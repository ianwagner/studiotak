import { createHash, randomUUID } from "node:crypto";

type MetaWebsiteLead = {
  email: string;
  firstName: string;
  lastName: string;
  eventId?: string;
  signupPath: string;
  contentName: string;
};

type MetaWebEventResult =
  | { status: "sent"; eventId: string }
  | { status: "skipped"; reason: "no_marketing_consent" | "not_configured" };

const META_GRAPH_BASE_URL = "https://graph.facebook.com";
const COOKIE_PREFERENCES_NAME = "st_cookie_preferences";
const COOKIE_PREFERENCES_VERSION = "2026-08";
const EVENT_ID_PATTERN = /^[A-Za-z0-9:_-]{1,100}$/;

function setting(...names: string[]) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return "";
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function normalizeName(value: string) {
  return value.trim().toLowerCase();
}

function readCookie(request: Request, name: string) {
  const prefix = `${name}=`;
  return request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))
    ?.slice(prefix.length) ?? "";
}

function hasMarketingConsent(request: Request) {
  const storedPreferences = readCookie(request, COOKIE_PREFERENCES_NAME);
  if (!storedPreferences) return false;

  try {
    const preferences = JSON.parse(decodeURIComponent(storedPreferences)) as {
      version?: unknown;
      marketing?: unknown;
    };
    return preferences.version === COOKIE_PREFERENCES_VERSION && preferences.marketing === true;
  } catch {
    return false;
  }
}

function getForwardedIp(request: Request) {
  const value = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  return value && value.length <= 100 ? value : "";
}

function getEventSourceUrl(request: Request, signupPath: string) {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) return "";

  const protocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
  const safePath = signupPath.startsWith("/") ? signupPath : "/";
  try {
    return new URL(safePath, `${protocol}://${host}`).toString();
  } catch {
    return "";
  }
}

function validCookieId(value: string) {
  return /^[A-Za-z0-9._-]{1,200}$/.test(value) ? value : "";
}

/** True when the deployment has credentials for website Conversions API events. */
export function isMetaWebEventsConfigured() {
  return Boolean(
    setting("META_WEB_EVENTS_DATASET_ID", "META_QUALIFIED_LEADS_DATASET_ID", "NEXT_PUBLIC_META_PIXEL_ID") &&
    setting("META_WEB_EVENTS_ACCESS_TOKEN", "META_QUALIFIED_LEADS_ACCESS_TOKEN")
  );
}

/**
 * Sends one consented website Lead event to Meta's Conversions API. The caller
 * supplies the same event ID to the browser Pixel event, allowing Meta to
 * deduplicate the two delivery paths.
 */
export async function sendMetaWebsiteLead(request: Request, lead: MetaWebsiteLead, timeoutMs = 2_000): Promise<MetaWebEventResult> {
  if (!hasMarketingConsent(request)) return { status: "skipped", reason: "no_marketing_consent" };

  const datasetId = setting("META_WEB_EVENTS_DATASET_ID", "META_QUALIFIED_LEADS_DATASET_ID", "NEXT_PUBLIC_META_PIXEL_ID");
  const accessToken = setting("META_WEB_EVENTS_ACCESS_TOKEN", "META_QUALIFIED_LEADS_ACCESS_TOKEN");
  if (!datasetId || !accessToken) return { status: "skipped", reason: "not_configured" };

  const eventId = lead.eventId && EVENT_ID_PATTERN.test(lead.eventId) ? lead.eventId : `web_lead_${randomUUID()}`;
  const apiVersion = setting("META_WEB_EVENTS_API_VERSION", "META_QUALIFIED_LEADS_API_VERSION") || "v26.0";
  const testEventCode = setting("META_WEB_EVENTS_TEST_EVENT_CODE");
  const fbp = validCookieId(readCookie(request, "_fbp"));
  const fbc = validCookieId(readCookie(request, "_fbc"));
  const userAgent = request.headers.get("user-agent")?.trim() ?? "";
  const ipAddress = getForwardedIp(request);
  const eventSourceUrl = getEventSourceUrl(request, lead.signupPath);

  const url = new URL(`${META_GRAPH_BASE_URL}/${encodeURIComponent(apiVersion)}/${encodeURIComponent(datasetId)}/events`);
  url.searchParams.set("access_token", accessToken);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "studio-tak-website/meta-web-events"
      },
      body: JSON.stringify({
        data: [
          {
            action_source: "website",
            event_name: "Lead",
            event_time: Math.floor(Date.now() / 1_000),
            event_id: eventId,
            ...(eventSourceUrl ? { event_source_url: eventSourceUrl } : {}),
            custom_data: { content_name: lead.contentName },
            user_data: {
              em: [sha256(lead.email.trim().toLowerCase())],
              fn: [sha256(normalizeName(lead.firstName))],
              ln: [sha256(normalizeName(lead.lastName))],
              ...(fbp ? { fbp } : {}),
              ...(fbc ? { fbc } : {}),
              ...(userAgent ? { client_user_agent: userAgent } : {}),
              ...(ipAddress ? { client_ip_address: ipAddress } : {})
            }
          }
        ],
        ...(testEventCode ? { test_event_code: testEventCode } : {})
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs)
    });
  } catch {
    throw new Error("Meta website Lead request could not be completed.");
  }

  if (!response.ok) {
    // Do not log the response body: Meta can include information derived from the request.
    throw new Error(`Meta website Lead was rejected (${response.status}).`);
  }

  return { status: "sent", eventId };
}
