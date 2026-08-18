import { createHash } from "node:crypto";

export type QualifiedLeadContact = {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  leadId?: string;
};

export type QualifiedLeadEvent = {
  eventName: string;
  eventTime: number;
  eventId: string;
  contact: QualifiedLeadContact;
};

type MetaQualifiedLeadResult =
  | { status: "sent" }
  | { status: "skipped"; reason: "no_matching_data" };

const META_GRAPH_BASE_URL = "https://graph.facebook.com";

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function normalizeEmail(value: string | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

// Meta expects a phone number in international format. Attio keeps the original
// representation, so remove formatting without attempting to infer a country code.
function normalizePhone(value: string | undefined) {
  return value?.replace(/\D/g, "") ?? "";
}

function normalizeName(value: string | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function hashIfPresent(value: string) {
  return value ? sha256(value) : undefined;
}

function getRequiredSetting(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

/**
 * Sends a CRM lead-stage event to Meta's Qualified Leads / Conversions API.
 * Customer information is normalized and SHA-256 hashed before it leaves this
 * server. Lead IDs remain strings so 15–17 digit Meta IDs never lose precision.
 */
export async function sendMetaQualifiedLead(event: QualifiedLeadEvent, timeoutMs = 2_000): Promise<MetaQualifiedLeadResult> {
  const datasetId = getRequiredSetting("META_QUALIFIED_LEADS_DATASET_ID");
  const accessToken = getRequiredSetting("META_QUALIFIED_LEADS_ACCESS_TOKEN");
  const apiVersion = process.env.META_QUALIFIED_LEADS_API_VERSION?.trim() || "v26.0";
  const testEventCode = process.env.META_QUALIFIED_LEADS_TEST_EVENT_CODE?.trim();

  const email = hashIfPresent(normalizeEmail(event.contact.email));
  const phone = hashIfPresent(normalizePhone(event.contact.phone));
  const firstName = hashIfPresent(normalizeName(event.contact.firstName));
  const lastName = hashIfPresent(normalizeName(event.contact.lastName));
  const leadId = event.contact.leadId?.trim();

  if (!email && !phone && !leadId) {
    return { status: "skipped", reason: "no_matching_data" };
  }

  const userData = {
    ...(email ? { em: [email] } : {}),
    ...(phone ? { ph: [phone] } : {}),
    ...(firstName ? { fn: [firstName] } : {}),
    ...(lastName ? { ln: [lastName] } : {}),
    ...(leadId ? { lead_id: leadId } : {})
  };

  const url = new URL(`${META_GRAPH_BASE_URL}/${encodeURIComponent(apiVersion)}/${encodeURIComponent(datasetId)}/events`);
  url.searchParams.set("access_token", accessToken);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "studio-tak-website/meta-qualified-leads"
      },
      body: JSON.stringify({
        data: [
          {
            action_source: "system_generated",
            custom_data: {
              event_source: "crm",
              lead_event_source: "Attio"
            },
            event_id: event.eventId,
            event_name: event.eventName,
            event_time: event.eventTime,
            user_data: userData
          }
        ],
        ...(testEventCode ? { test_event_code: testEventCode } : {})
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs)
    });
  } catch {
    throw new Error("Meta Qualified Leads request could not be completed.");
  }

  if (!response.ok) {
    // Do not log the response body: Meta can include information derived from the request.
    throw new Error(`Meta Qualified Leads rejected the event (${response.status}).`);
  }

  return { status: "sent" };
}
