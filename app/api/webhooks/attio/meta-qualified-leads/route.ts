import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import {
  getActiveAttioValue,
  getAttioListEntry,
  getAttioRecord,
  getAttioValueDate,
  getAttioValueString,
  type AttioRecord
} from "@/lib/attio";
import { sendMetaQualifiedLead } from "@/lib/metaQualifiedLeads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_WEBHOOK_BODY_BYTES = 256_000;

type AttioWebhookEvent = {
  event_type?: unknown;
  id?: {
    object_id?: unknown;
    record_id?: unknown;
    attribute_id?: unknown;
    list_id?: unknown;
    entry_id?: unknown;
  };
  parent_object_id?: unknown;
  parent_record_id?: unknown;
};

type AttioWebhookPayload = {
  events?: unknown;
};

type StageUpdate = {
  event: AttioWebhookEvent;
  source: "record" | "list";
  recordId: string;
  object: string;
  record: AttioRecord;
  stageValues: Record<string, unknown>;
};

function setting(name: string) {
  return process.env[name]?.trim() ?? "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function signaturesMatch(body: string, signature: string, secret: string) {
  const expected = createHmac("sha256", secret).update(body, "utf8").digest("hex");
  const received = signature.trim();
  if (received.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(received, "utf8"), Buffer.from(expected, "utf8"));
}

function getEventName(stageName: string) {
  const configuredMapping = setting("ATTIO_QUALIFIED_LEADS_EVENT_NAMES_JSON");
  if (!configuredMapping) return stageName;

  try {
    const mapping = JSON.parse(configuredMapping) as unknown;
    if (!isRecord(mapping)) throw new Error("not an object");
    const mappedName = asString(mapping[stageName]);
    return mappedName || null;
  } catch {
    throw new Error("ATTIO_QUALIFIED_LEADS_EVENT_NAMES_JSON must be a JSON object mapping Attio stages to Meta event names.");
  }
}

function getLeadContact(record: AttioRecord) {
  const emailAttribute = setting("ATTIO_QUALIFIED_LEADS_EMAIL_ATTRIBUTE") || "email_addresses";
  const phoneAttribute = setting("ATTIO_QUALIFIED_LEADS_PHONE_ATTRIBUTE") || "phone_numbers";
  const nameAttribute = setting("ATTIO_QUALIFIED_LEADS_NAME_ATTRIBUTE") || "name";
  const metaLeadIdAttribute = setting("ATTIO_QUALIFIED_LEADS_META_LEAD_ID_ATTRIBUTE");
  const name = getActiveAttioValue(record.values, nameAttribute);

  return {
    email: getAttioValueString(getActiveAttioValue(record.values, emailAttribute), ["email_address", "original_email_address", "value"]),
    phone: getAttioValueString(getActiveAttioValue(record.values, phoneAttribute), ["original_phone_number", "phone_number", "value"]),
    firstName: getAttioValueString(name, ["first_name"]),
    lastName: getAttioValueString(name, ["last_name"]),
    leadId: metaLeadIdAttribute
      ? getAttioValueString(getActiveAttioValue(record.values, metaLeadIdAttribute), ["value"])
      : undefined
  };
}

async function resolveRecordUpdate(event: AttioWebhookEvent): Promise<StageUpdate | null> {
  if (event.event_type !== "record.updated" && event.event_type !== "record.created") return null;

  const stageAttributeId = setting("ATTIO_QUALIFIED_LEADS_STAGE_ATTRIBUTE_ID");
  if (!stageAttributeId) throw new Error("ATTIO_QUALIFIED_LEADS_STAGE_ATTRIBUTE_ID is not configured.");

  const recordId = asString(event.id?.record_id);
  const eventObjectId = asString(event.id?.object_id);
  const configuredObjectId = setting("ATTIO_QUALIFIED_LEADS_OBJECT_ID");
  const object = setting("ATTIO_QUALIFIED_LEADS_OBJECT") || "people";
  if (!recordId || (configuredObjectId && eventObjectId !== configuredObjectId)) return null;

  // A record.created event has no changed attribute. It allows an initial stage
  // set during record creation to be sent as the raw-lead event.
  if (event.event_type === "record.updated" && asString(event.id?.attribute_id) !== stageAttributeId) return null;

  const record = await getAttioRecord(object, recordId, 2_000);
  return { event, source: "record", recordId, object, record, stageValues: record.values };
}

async function resolveListUpdate(event: AttioWebhookEvent): Promise<StageUpdate | null> {
  if (event.event_type !== "list-entry.updated" && event.event_type !== "list-entry.created") return null;

  const listId = asString(event.id?.list_id);
  const entryId = asString(event.id?.entry_id);
  const configuredListId = setting("ATTIO_QUALIFIED_LEADS_LIST_ID");
  const stageAttributeId = setting("ATTIO_QUALIFIED_LEADS_STAGE_ATTRIBUTE_ID");
  if (!configuredListId || !stageAttributeId) {
    throw new Error("ATTIO_QUALIFIED_LEADS_LIST_ID and ATTIO_QUALIFIED_LEADS_STAGE_ATTRIBUTE_ID are required for list pipeline events.");
  }
  if (!listId || !entryId || listId !== configuredListId) return null;
  if (event.event_type === "list-entry.updated" && asString(event.id?.attribute_id) !== stageAttributeId) return null;

  const parentRecordId = asString(event.parent_record_id);
  const parentObject = setting("ATTIO_QUALIFIED_LEADS_OBJECT") || asString(event.parent_object_id);
  if (parentRecordId && parentObject) {
    const [entry, record] = await Promise.all([
      getAttioListEntry(listId, entryId, 2_000),
      getAttioRecord(parentObject, parentRecordId, 2_000)
    ]);
    return { event, source: "list", recordId: parentRecordId, object: parentObject, record, stageValues: entry.entryValues };
  }

  const entry = await getAttioListEntry(listId, entryId, 2_000);
  const record = await getAttioRecord(entry.parentObject, entry.parentRecordId, 2_000);
  return { event, source: "list", recordId: entry.parentRecordId, object: entry.parentObject, record, stageValues: entry.entryValues };
}

async function handleStageUpdate(stageUpdate: StageUpdate, idempotencyKey: string) {
  const stageAttribute = setting("ATTIO_QUALIFIED_LEADS_STAGE_ATTRIBUTE") || (stageUpdate.source === "list" ? "status" : "stage");
  const stageValue = getActiveAttioValue(stageUpdate.stageValues, stageAttribute);
  const stageName = getAttioValueString(stageValue, ["status.title", "option.title", "value"]);
  if (!stageName) return "skipped" as const;

  const eventName = getEventName(stageName);
  // A configured map intentionally limits reporting to the CRM stages that
  // matter to Meta. An unmapped stage is acknowledged but not uploaded.
  if (!eventName) return "skipped" as const;

  const stageChangedAt = getAttioValueDate(stageValue) ?? Math.floor(Date.now() / 1_000);
  const result = await sendMetaQualifiedLead({
    eventName,
    eventTime: stageChangedAt,
    // Attio supplies a retry-stable key. Add record/stage data so a future
    // batched delivery still gives each CRM event its own Meta event ID.
    eventId: `attio:${idempotencyKey}:${stageUpdate.recordId}:${stageChangedAt}`,
    contact: getLeadContact(stageUpdate.record)
  }, 2_000);

  if (result.status === "skipped") {
    console.warn("Meta Qualified Leads event skipped: the Attio record has no email, phone, or Meta lead ID.");
    return "skipped" as const;
  }
  return "sent" as const;
}

export async function POST(request: Request) {
  const secret = setting("ATTIO_QUALIFIED_LEADS_WEBHOOK_SECRET");
  if (!secret) {
    console.error("Attio Qualified Leads webhook rejected: ATTIO_QUALIFIED_LEADS_WEBHOOK_SECRET is not configured.");
    return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_WEBHOOK_BODY_BYTES) {
    return NextResponse.json({ error: "Payload is too large." }, { status: 413 });
  }

  const body = await request.text();
  if (body.length > MAX_WEBHOOK_BODY_BYTES) {
    return NextResponse.json({ error: "Payload is too large." }, { status: 413 });
  }

  const signature = request.headers.get("attio-signature") ?? request.headers.get("x-attio-signature");
  if (!signature || !signaturesMatch(body, signature, secret)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  let payload: AttioWebhookPayload;
  try {
    payload = JSON.parse(body) as AttioWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const events = Array.isArray(payload.events) ? payload.events.filter(isRecord) as AttioWebhookEvent[] : [];
  const idempotencyKey = request.headers.get("idempotency-key")?.trim() || createHmac("sha256", secret).update(body, "utf8").digest("hex");

  try {
    let sent = 0;
    for (const event of events) {
      const stageUpdate = (await resolveRecordUpdate(event)) ?? (await resolveListUpdate(event));
      if (!stageUpdate) continue;
      if (await handleStageUpdate(stageUpdate, idempotencyKey) === "sent") sent += 1;
    }
    return NextResponse.json({ ok: true, sent }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Unable to process Attio Qualified Leads webhook", {
      message: error instanceof Error ? error.message : "Unknown error"
    });
    // A non-2xx response causes Attio to retry with the same Idempotency-Key.
    return NextResponse.json({ error: "Unable to process the webhook." }, { status: 503 });
  }
}
