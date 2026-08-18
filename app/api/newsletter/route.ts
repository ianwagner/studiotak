import { NextResponse } from "next/server";
import { syncAttioPerson } from "@/lib/attio";

export const runtime = "nodejs";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getFormValue(formData: FormData, name: string, maxLength: number) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

async function verifyTurnstile(token: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) return false;

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
    const result = await response.json().catch(() => null) as { success?: unknown } | null;
    return response.ok && result?.success === true;
  } catch {
    return false;
  }
}

async function subscribeInResend({ email, firstName, lastName, signupPath }: {
  email: string;
  firstName: string;
  lastName: string;
  signupPath: string;
}) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return false;

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "User-Agent": "studio-tak-website/newsletter"
  };
  const properties = {
    source: "newsletter",
    first_source: "newsletter",
    latest_source: "newsletter",
    marketing_consent: "true",
    marketing_consent_at: new Date().toISOString(),
    marketing_consent_version: "website_marketing_v1",
    signup_path: signupPath
  };

  try {
    const createResponse = await fetch("https://api.resend.com/contacts", {
      method: "POST",
      headers,
      body: JSON.stringify({ email, first_name: firstName, last_name: lastName, unsubscribed: false, properties }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000)
    });
    if (createResponse.ok) return true;
    if (createResponse.status !== 409) return false;

    const updateResponse = await fetch(`https://api.resend.com/contacts/${encodeURIComponent(email)}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        email,
        first_name: firstName,
        last_name: lastName,
        unsubscribed: false,
        properties: { ...properties, first_source: undefined }
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000)
    });
    return updateResponse.ok;
  } catch {
    return false;
  }
}

/** Stores an opted-in newsletter subscriber in Resend, then mirrors them to Attio. */
export async function POST(request: Request) {
  const formData = await request.formData();
  const email = getFormValue(formData, "EMAIL", 254).toLowerCase();
  const firstName = getFormValue(formData, "FIRSTNAME", 100);
  const lastName = getFormValue(formData, "LASTNAME", 100);
  const captchaToken = getFormValue(formData, "cf-turnstile-response", 4_000);
  const signupPath = getFormValue(formData, "signup_path", 2_000);

  if (!emailPattern.test(email) || !firstName || !lastName || formData.get("OPT_IN") !== "1" || !captchaToken) {
    return NextResponse.json({ error: "Please complete the newsletter form." }, { status: 400 });
  }

  if (getFormValue(formData, "email_address_check", 256)) {
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  }

  if (!await verifyTurnstile(captchaToken)) {
    return NextResponse.json({ error: "Captcha verification failed. Please try again." }, { status: 400 });
  }

  if (!await subscribeInResend({ email, firstName, lastName, signupPath })) {
    console.error("Resend newsletter signup was rejected.");
    return NextResponse.json({ error: "Newsletter signup could not be completed." }, { status: 502 });
  }

  await syncAttioPerson({
    email,
    firstName,
    lastName,
    attributes: {
      lead_source: "Newsletter",
      marketing_consent: "Yes",
      signup_path: signupPath
    }
  });

  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
