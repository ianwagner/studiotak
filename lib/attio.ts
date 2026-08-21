const ATTIO_PEOPLE_ENDPOINT = "https://api.attio.com/v2/objects/people/records?matching_attribute=email_addresses";
const ATTIO_PEOPLE_QUERY_ENDPOINT = "https://api.attio.com/v2/objects/people/records/query";

type AttioPerson = {
  email: string;
  firstName: string;
  lastName: string;
  attributes?: Record<string, string | undefined>;
  list?: string;
};

export type AttioRecord = {
  values: Record<string, unknown>;
};

export type AttioListEntry = {
  parentRecordId: string;
  parentObject: string;
  entryValues: Record<string, unknown>;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function getNestedValue(value: Record<string, unknown>, path: string) {
  return path.split(".").reduce<unknown>((current, key) => {
    const currentRecord = asRecord(current);
    return currentRecord?.[key];
  }, value);
}

function getAttioApiKey() {
  const apiKey = process.env.ATTIO_API_KEY?.trim();
  if (!apiKey) throw new Error("ATTIO_API_KEY is not configured.");
  return apiKey;
}

function getAttioRecordId(value: unknown) {
  const record = asRecord(value);
  const id = asRecord(record?.id);
  return typeof id?.record_id === "string" ? id.record_id : "";
}

async function addPersonToAttioList(apiKey: string, list: string, recordId: string) {
  try {
    const response = await fetch(`https://api.attio.com/v2/lists/${encodeURIComponent(list)}/entries`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "studio-tak-website/forms"
      },
      body: JSON.stringify({
        data: {
          parent_record_id: recordId,
          parent_object: "people",
          entry_values: {}
        }
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000)
    });

    if (!response.ok) {
      console.error("Unable to add person to Attio list", { status: response.status });
    }
  } catch {
    console.error("Unable to add person to Attio list");
  }
}

/**
 * Returns whether the email already belongs to an Attio Person. An unavailable
 * lookup deliberately returns null: a CRM lookup failure must never cause an
 * existing lead to be reset to its initial stage.
 */
async function personExists(apiKey: string, email: string): Promise<boolean | null> {
  try {
    const response = await fetch(ATTIO_PEOPLE_QUERY_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "studio-tak-website/forms"
      },
      body: JSON.stringify({ filter: { email_addresses: email }, limit: 1 }),
      cache: "no-store",
      signal: AbortSignal.timeout(5_000)
    });
    if (!response.ok) return null;
    const payload = await response.json().catch(() => null) as { data?: unknown } | null;
    return Array.isArray(payload?.data) ? payload.data.length > 0 : null;
  } catch {
    return null;
  }
}

async function getAttioResource(path: string, timeoutMs: number): Promise<Record<string, unknown>> {
  let response: Response;
  try {
    response = await fetch(`https://api.attio.com/v2${path}`, {
      headers: {
        Authorization: `Bearer ${getAttioApiKey()}`,
        "User-Agent": "studio-tak-website/meta-qualified-leads"
      },
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs)
    });
  } catch {
    throw new Error("Attio API request could not be completed.");
  }

  if (!response.ok) throw new Error(`Attio API request failed (${response.status}).`);
  const payload = await response.json().catch(() => null) as { data?: unknown } | null;
  const data = payload?.data;
  const record = asRecord(data);
  if (!record) throw new Error("Attio API returned an invalid record.");
  return record;
}

/** Fetches an Attio record using either its API slug or object UUID. */
export async function getAttioRecord(object: string, recordId: string, timeoutMs = 10_000): Promise<AttioRecord> {
  const data = await getAttioResource(`/objects/${encodeURIComponent(object)}/records/${encodeURIComponent(recordId)}`, timeoutMs);
  const values = asRecord(data.values);
  if (!values) throw new Error("Attio record did not include values.");
  return { values };
}

/** Fetches an Attio list entry, including its current status and parent record. */
export async function getAttioListEntry(list: string, entryId: string, timeoutMs = 10_000): Promise<AttioListEntry> {
  const data = await getAttioResource(`/lists/${encodeURIComponent(list)}/entries/${encodeURIComponent(entryId)}`, timeoutMs);
  const entryValues = asRecord(data.entry_values);
  const parentRecordId = typeof data.parent_record_id === "string" ? data.parent_record_id : "";
  const parentObject = typeof data.parent_object === "string" ? data.parent_object : "";
  if (!entryValues || !parentRecordId || !parentObject) throw new Error("Attio list entry did not include its parent record and values.");
  return { parentRecordId, parentObject, entryValues };
}

/** Returns the current (rather than historic) value of an Attio attribute. */
export function getActiveAttioValue(values: Record<string, unknown>, attribute: string) {
  const candidates = values[attribute];
  if (!Array.isArray(candidates)) return null;
  return candidates.find((candidate) => {
    const record = asRecord(candidate);
    return record && (record.active_until === null || record.active_until === undefined);
  }) ?? candidates[0] ?? null;
}

/** Reads a string from an Attio value, supporting nested status/select titles. */
export function getAttioValueString(value: unknown, paths: string[]) {
  const record = asRecord(value);
  if (!record) return "";
  for (const path of paths) {
    const candidate = getNestedValue(record, path);
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
  }
  return "";
}

/** Converts Attio's active_from timestamp to the Unix event time Meta expects. */
export function getAttioValueDate(value: unknown) {
  const record = asRecord(value);
  if (!record || typeof record.active_from !== "string") return null;
  const timestamp = Date.parse(record.active_from);
  return Number.isNaN(timestamp) ? null : Math.floor(timestamp / 1_000);
}

/**
 * Creates or updates a person using Attio's unique email-address attribute.
 * CRM availability must not prevent a verified form submission from being delivered.
 */
export async function syncAttioPerson({ email, firstName, lastName, attributes, list }: AttioPerson) {
  const apiKey = process.env.ATTIO_API_KEY?.trim();
  const listName = list ?? process.env.ATTIO_WEBSITE_LEADS_LIST?.trim() ?? "leads";
  if (!apiKey) {
    console.warn("Attio sync skipped: ATTIO_API_KEY is not configured.");
    return;
  }

  try {
    const leadStageAttribute = process.env.ATTIO_QUALIFIED_LEADS_STAGE_ATTRIBUTE?.trim();
    const initialLeadStage = process.env.ATTIO_QUALIFIED_LEADS_INITIAL_STAGE?.trim() || "Lead";
    const existingPerson = leadStageAttribute ? await personExists(apiKey, email) : null;
    const response = await fetch(ATTIO_PEOPLE_ENDPOINT, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "studio-tak-website/forms"
      },
      body: JSON.stringify({
        data: {
          values: {
            email_addresses: [email],
            name: [
              {
                first_name: firstName,
                last_name: lastName,
                full_name: `${firstName} ${lastName}`
              }
            ],
            ...Object.fromEntries(
              Object.entries(attributes ?? {}).filter(([, value]) => Boolean(value))
            ),
            // Apply the raw-lead stage only when this is a new Attio Person.
            // Never overwrite a stage that a teammate has progressed manually.
            ...(leadStageAttribute && existingPerson === false ? { [leadStageAttribute]: initialLeadStage } : {})
          }
        }
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000)
    });

    if (!response.ok) {
      console.error("Unable to sync person to Attio", { status: response.status });
      return;
    }

    const payload = await response.json().catch(() => null);
    const recordId = getAttioRecordId(payload?.data);
    if (!recordId) {
      console.error("Unable to add person to Attio list: record ID was missing.");
      return;
    }

    await addPersonToAttioList(apiKey, listName, recordId);
  } catch {
    console.error("Unable to sync person to Attio");
  }
}
