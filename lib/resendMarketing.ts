const MARKETING_SEGMENT_NAME = "Marketing updates";

let segmentIdPromise: Promise<string | null> | null = null;
let backfillPromise: Promise<boolean> | null = null;

type ResendSegment = {
  id?: unknown;
  name?: unknown;
};

type ResendContact = {
  id?: unknown;
  email?: unknown;
  properties?: Record<string, unknown>;
};

const getConfiguredSegmentId = () => process.env.RESEND_MARKETING_SEGMENT_ID?.trim() || null;

const requestHeaders = (apiKey: string) => ({
  Authorization: `Bearer ${apiKey}`,
  "Content-Type": "application/json",
  "User-Agent": "studio-tak-website/resend-marketing"
});

export async function getMarketingSegmentId(apiKey: string): Promise<string | null> {
  const configuredId = getConfiguredSegmentId();
  if (configuredId) return configuredId;

  if (!segmentIdPromise) {
    segmentIdPromise = (async () => {
      const headers = requestHeaders(apiKey);
      try {
        const listResponse = await fetch("https://api.resend.com/segments", { headers, cache: "no-store" });
        if (!listResponse.ok) {
          console.error("Unable to list Resend marketing segments", listResponse.status);
          return null;
        }

        const list = (await listResponse.json()) as { data?: ResendSegment[] };
        const existing = list.data?.find((segment) => segment.name === MARKETING_SEGMENT_NAME);
        if (typeof existing?.id === "string") return existing.id;

        const createResponse = await fetch("https://api.resend.com/segments", {
          method: "POST",
          headers,
          body: JSON.stringify({ name: MARKETING_SEGMENT_NAME }),
          cache: "no-store"
        });
        if (!createResponse.ok) {
          console.error("Unable to create the Resend marketing segment", createResponse.status);
          return null;
        }

        const created = (await createResponse.json()) as ResendSegment;
        return typeof created.id === "string" ? created.id : null;
      } catch {
        console.error("Unable to resolve the Resend marketing segment");
        return null;
      }
    })();
  }

  const segmentId = await segmentIdPromise;
  if (!segmentId) segmentIdPromise = null;
  return segmentId;
}

export async function backfillMarketingSegment(apiKey: string, segmentId: string): Promise<boolean> {
  if (!backfillPromise) {
    backfillPromise = (async () => {
      const headers = requestHeaders(apiKey);
      let after: string | null = null;

      try {
        while (true) {
          const query = new URLSearchParams({ limit: "100" });
          if (after) query.set("after", after);
          const contactsResponse = await fetch(`https://api.resend.com/contacts?${query}`, { headers, cache: "no-store" });
          if (!contactsResponse.ok) {
            console.error("Unable to list Resend contacts for the marketing segment", contactsResponse.status);
            return false;
          }

          const contacts = (await contactsResponse.json()) as { data?: ResendContact[]; has_more?: boolean };
          const data = Array.isArray(contacts.data) ? contacts.data : [];
          for (const contact of data) {
            if (contact.properties?.marketing_consent !== "true" || typeof contact.id !== "string") continue;
            const addResponse = await fetch(
              `https://api.resend.com/contacts/${encodeURIComponent(contact.id)}/segments/${encodeURIComponent(segmentId)}`,
              { method: "POST", headers, cache: "no-store" }
            );
            if (!addResponse.ok && addResponse.status !== 409) {
              console.error("Unable to add an opted-in contact to the Resend marketing segment", addResponse.status);
              return false;
            }
          }

          if (!contacts.has_more || data.length === 0) return true;
          const cursor = data.at(-1)?.id;
          if (typeof cursor !== "string") {
            console.error("Resend contacts pagination did not return a cursor.");
            return false;
          }
          after = cursor;
        }
      } catch {
        console.error("Unable to backfill the Resend marketing segment");
        return false;
      }
    })();
  }

  const complete = await backfillPromise;
  if (!complete) backfillPromise = null;
  return complete;
}
