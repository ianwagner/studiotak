import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_FORM_AGE_MS = 1000 * 60 * 60 * 24;
const MIN_FORM_COMPLETION_MS = 900;

type ContactPayload = {
  firstName?: unknown;
  lastName?: unknown;
  email?: unknown;
  creativeChallenge?: unknown;
  marketingConsent?: unknown;
  signupPath?: unknown;
  utmSource?: unknown;
  utmMedium?: unknown;
  utmCampaign?: unknown;
  website?: unknown;
  captchaToken?: unknown;
  formStartedAt?: unknown;
};

const fieldLimits = {
  firstName: 100,
  lastName: 100,
  email: 254,
  creativeChallenge: 3000,
  signupPath: 2_000,
  utm: 255
} as const;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const turnstileConfigurationErrors = new Set(["missing-input-secret", "invalid-input-secret"]);

const getString = (value: unknown, maxLength: number) => (typeof value === "string" ? value.trim().slice(0, maxLength) : "");
const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] ?? character);

type TurnstileVerification =
  | { verified: true }
  | { verified: false; reason: "configuration" | "invalid" | "unavailable" };

async function verifyTurnstile(token: string): Promise<TurnstileVerification> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.error("Turnstile verification is unavailable: TURNSTILE_SECRET_KEY is not configured.");
    return { verified: false, reason: "configuration" };
  }

  const formData = new FormData();
  formData.set("secret", secret);
  formData.set("response", token);

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
      cache: "no-store",
      signal: AbortSignal.timeout(10_000)
    });
    if (!response.ok) {
      console.error("Turnstile verification request failed", { status: response.status });
      return { verified: false, reason: "unavailable" };
    }

    const result = (await response.json().catch(() => null)) as {
      success?: boolean;
      "error-codes"?: string[];
    } | null;
    const errorCodes = result?.["error-codes"] ?? [];
    if (errorCodes.some((code) => turnstileConfigurationErrors.has(code))) {
      return { verified: false, reason: "configuration" };
    }
    return result?.success === true ? { verified: true } : { verified: false, reason: "invalid" };
  } catch {
    console.error("Turnstile verification request could not be completed.");
    return { verified: false, reason: "unavailable" };
  }
}

type MarketingContactDetails = {
  email: string;
  firstName: string;
  lastName: string;
  signupPath: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
};

const MARKETING_CONSENT_VERSION = "website_marketing_v1";

async function addMarketingContact(apiKey: string, details: MarketingContactDetails) {
  const { email, firstName, lastName, signupPath, utmSource, utmMedium, utmCampaign } = details;
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "User-Agent": "studio-tak-website/contact"
  };
  const properties = {
    source: "contact",
    first_source: "contact",
    latest_source: "contact",
    marketing_consent: "true",
    marketing_consent_at: new Date().toISOString(),
    marketing_consent_version: MARKETING_CONSENT_VERSION,
    signup_path: signupPath,
    ...(utmSource ? { utm_source: utmSource } : {}),
    ...(utmMedium ? { utm_medium: utmMedium } : {}),
    ...(utmCampaign ? { utm_campaign: utmCampaign } : {})
  };
  const createContact = JSON.stringify({
    email,
    first_name: firstName,
    last_name: lastName,
    unsubscribed: false,
    properties
  });
  const updateContact = JSON.stringify({
    email,
    first_name: firstName,
    last_name: lastName,
    unsubscribed: false,
    properties: {
      ...properties,
      first_source: undefined
    }
  });

  try {
    const createResponse = await fetch("https://api.resend.com/contacts", {
      method: "POST",
      headers,
      body: createContact,
      cache: "no-store"
    });
    if (createResponse.ok) return;
    if (createResponse.status !== 409) {
      console.error("Unable to add contact to Resend", createResponse.status);
      return;
    }

    const updateResponse = await fetch(`https://api.resend.com/contacts/${encodeURIComponent(email)}`, {
      method: "PATCH",
      headers,
      body: updateContact,
      cache: "no-store"
    });
    if (!updateResponse.ok) console.error("Unable to update contact in Resend", updateResponse.status);
  } catch {
    console.error("Unable to sync contact to Resend");
  }
}

export async function POST(request: Request) {
  let payload: ContactPayload;
  try {
    payload = (await request.json()) as ContactPayload;
  } catch {
    return NextResponse.json({ error: "Please complete the form and try again." }, { status: 400 });
  }

  if (getString(payload.website, 200)) {
    // Return success so automated submissions receive no signal.
    return NextResponse.json({ ok: true });
  }

  const startedAt = typeof payload.formStartedAt === "number" ? payload.formStartedAt : 0;
  const elapsed = Date.now() - startedAt;
  if (elapsed < MIN_FORM_COMPLETION_MS || elapsed > MAX_FORM_AGE_MS) {
    return NextResponse.json({ error: "Please refresh the page and try again." }, { status: 400 });
  }

  const firstName = getString(payload.firstName, fieldLimits.firstName);
  const lastName = getString(payload.lastName, fieldLimits.lastName);
  const email = getString(payload.email, fieldLimits.email).toLowerCase();
  const creativeChallenge = getString(payload.creativeChallenge, fieldLimits.creativeChallenge);
  const marketingConsent = getString(payload.marketingConsent, 10) === "yes";
  const signupPath = getString(payload.signupPath, fieldLimits.signupPath);
  const utmSource = getString(payload.utmSource, fieldLimits.utm);
  const utmMedium = getString(payload.utmMedium, fieldLimits.utm);
  const utmCampaign = getString(payload.utmCampaign, fieldLimits.utm);
  const captchaToken = getString(payload.captchaToken, 2048);

  if (!firstName || !lastName || !email || !emailPattern.test(email)) {
    return NextResponse.json({ error: "Please complete each field with a valid email address." }, { status: 400 });
  }

  const turnstile = await verifyTurnstile(captchaToken);
  if (!turnstile.verified) {
    if (turnstile.reason === "configuration") {
      return NextResponse.json({ error: "The security service is temporarily unavailable. Please try again shortly.", code: "turnstile_configuration" }, { status: 503 });
    }
    if (turnstile.reason === "unavailable") {
      return NextResponse.json({ error: "We couldn't verify the security check. Please try again shortly.", code: "turnstile_unavailable" }, { status: 503 });
    }
    return NextResponse.json({ error: "The security check expired. Please complete it again and resubmit.", code: "turnstile_expired" }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !fromEmail) {
    return NextResponse.json({ error: "Form delivery is temporarily unavailable. Please try again later." }, { status: 503 });
  }

  const contactEmailResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "studio-tak-website/contact"
    },
    body: JSON.stringify({
      from: fromEmail,
      to: ["info@studiotak.co"],
      reply_to: email,
      subject: `Website contact — ${firstName} ${lastName}`,
      text: `New website contact\n\nFirst name: ${firstName}\nLast name: ${lastName}\nEmail: ${email}\nWhat would make your creative more effective right now?: ${creativeChallenge || "Not provided"}\nMarketing email opt-in: ${marketingConsent ? "Yes" : "No"}`,
      html: `<h2 style="font-family:Arial,sans-serif">New website contact</h2><table style="font-family:Arial,sans-serif;font-size:14px;line-height:1.45"><tr><td style="padding:5px 12px 5px 0;font-weight:600">First name</td><td>${escapeHtml(firstName)}</td></tr><tr><td style="padding:5px 12px 5px 0;font-weight:600">Last name</td><td>${escapeHtml(lastName)}</td></tr><tr><td style="padding:5px 12px 5px 0;font-weight:600">Email</td><td>${escapeHtml(email)}</td></tr><tr><td style="padding:5px 12px 5px 0;font-weight:600;vertical-align:top">What would make your creative more effective right now?</td><td style="white-space:pre-wrap">${escapeHtml(creativeChallenge || "Not provided")}</td></tr><tr><td style="padding:5px 12px 5px 0;font-weight:600">Marketing email opt-in</td><td>${marketingConsent ? "Yes" : "No"}</td></tr></table>`
    }),
    cache: "no-store"
  });

  if (!contactEmailResponse.ok) {
    console.error("Resend rejected the contact email", {
      status: contactEmailResponse.status,
      response: (await contactEmailResponse.text()).slice(0, 1000)
    });
    return NextResponse.json({ error: "We couldn't send your message. Please try again." }, { status: 502 });
  }

  if (marketingConsent) {
    await addMarketingContact(apiKey, {
      email,
      firstName,
      lastName,
      signupPath,
      utmSource,
      utmMedium,
      utmCampaign
    });
  }

  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
