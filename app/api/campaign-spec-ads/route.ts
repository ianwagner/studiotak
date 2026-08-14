import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_FORM_AGE_MS = 1000 * 60 * 60 * 24;
const MIN_FORM_COMPLETION_MS = 900;
const TURNSTILE_ACTION = "spec_ads_application";

type FormPayload = {
  name?: unknown;
  title?: unknown;
  email?: unknown;
  businessName?: unknown;
  productToFeature?: unknown;
  monthlyMetaSpend?: unknown;
  creativeSetup?: unknown;
  creativeChallenge?: unknown;
  marketingConsent?: unknown;
  website?: unknown;
  captchaToken?: unknown;
  formStartedAt?: unknown;
};

const fieldLimits = {
  name: 200,
  title: 150,
  email: 254,
  businessName: 200,
  productToFeature: 2000,
  monthlyMetaSpend: 100,
  creativeSetup: 150,
  creativeChallenge: 3000
} as const;

const getString = (value: unknown, maxLength: number) => (typeof value === "string" ? value.trim().slice(0, maxLength) : "");
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] ?? character);

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function addMarketingContact(apiKey: string, email: string) {
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "User-Agent": "studio-tak-website/campfire-spec-ads"
  };
  const contact = JSON.stringify({ email, unsubscribed: false });

  try {
    const createResponse = await fetch("https://api.resend.com/contacts", {
      method: "POST",
      headers,
      body: contact,
      cache: "no-store"
    });
    if (createResponse.ok) return;
    if (createResponse.status !== 409) {
      console.error("Unable to add marketing contact to Resend", createResponse.status);
      return;
    }

    const updateResponse = await fetch(`https://api.resend.com/contacts/${encodeURIComponent(email)}`, {
      method: "PATCH",
      headers,
      body: contact,
      cache: "no-store"
    });
    if (!updateResponse.ok) console.error("Unable to update marketing contact in Resend", updateResponse.status);
  } catch {
    console.error("Unable to sync marketing contact to Resend");
  }
}

type TurnstileVerification =
  | { verified: true }
  | { verified: false; reason: "configuration" | "invalid" | "unavailable" };

const normalizeHostname = (hostname: string) => hostname.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");

async function verifyTurnstile(token: string): Promise<TurnstileVerification> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  const allowedHostnames = new Set(
    (process.env.TURNSTILE_HOSTNAMES ?? "")
      .split(",")
      .map(normalizeHostname)
      .filter(Boolean)
  );
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
      action?: string;
      hostname?: string;
      "error-codes"?: string[];
    } | null;
    const hostname = normalizeHostname(result?.hostname ?? "");
    const hostnameMatches = !allowedHostnames.size || allowedHostnames.has(hostname);
    const verified = result?.success === true && result.action === TURNSTILE_ACTION && hostnameMatches;

    if (!verified) {
      console.warn("Turnstile verification was rejected", {
        action: result?.action ?? null,
        errorCodes: result?.["error-codes"] ?? [],
        hostname: hostname || null,
        hostnameMatches
      });
    }

    return verified ? { verified: true } : { verified: false, reason: "invalid" };
  } catch {
    console.error("Turnstile verification request could not be completed.");
    return { verified: false, reason: "unavailable" };
  }
}

export async function POST(request: Request) {
  let payload: FormPayload;
  try {
    payload = (await request.json()) as FormPayload;
  } catch {
    return NextResponse.json({ error: "Please complete the form and try again." }, { status: 400 });
  }

  if (getString(payload.website, 200)) {
    // Return a normal response so automated submissions receive no signal.
    return NextResponse.json({ ok: true });
  }

  const startedAt = typeof payload.formStartedAt === "number" ? payload.formStartedAt : 0;
  const elapsed = Date.now() - startedAt;
  if (elapsed < MIN_FORM_COMPLETION_MS || elapsed > MAX_FORM_AGE_MS) {
    return NextResponse.json({ error: "Please refresh the page and try again." }, { status: 400 });
  }

  const name = getString(payload.name, fieldLimits.name);
  const title = getString(payload.title, fieldLimits.title);
  const email = getString(payload.email, fieldLimits.email).toLowerCase();
  const businessName = getString(payload.businessName, fieldLimits.businessName);
  const productToFeature = getString(payload.productToFeature, fieldLimits.productToFeature);
  const monthlyMetaSpend = getString(payload.monthlyMetaSpend, fieldLimits.monthlyMetaSpend);
  const creativeSetup = getString(payload.creativeSetup, fieldLimits.creativeSetup);
  const creativeChallenge = getString(payload.creativeChallenge, fieldLimits.creativeChallenge);
  const marketingConsent = getString(payload.marketingConsent, 10) === "yes";
  const captchaToken = getString(payload.captchaToken, 2048);

  if (!name || !title || !email || !businessName || !productToFeature || !monthlyMetaSpend || !creativeSetup || !creativeChallenge || !emailPattern.test(email)) {
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
  const applicationTemplateId = process.env.RESEND_APPLICATION_THANK_YOU_TEMPLATE_ID;
  if (!apiKey || !fromEmail) {
    return NextResponse.json({ error: "Form delivery is temporarily unavailable. Please try again later." }, { status: 503 });
  }

  const entries: Array<[string, string]> = [
    ["Name", name],
    ["Title", title],
    ["Email", email],
    ["Business", businessName],
    ["Product to feature", productToFeature],
    ["Average monthly Meta spend", monthlyMetaSpend],
    ["Current creative setup", creativeSetup],
    ["Creative opportunity", creativeChallenge],
    ["Marketing email opt-in", marketingConsent ? "Yes" : "No"]
  ];
  const text = entries.map(([label, value]) => `${label}:\n${value}`).join("\n\n");
  const html = entries
    .map(([label, value]) => `<tr><td style="padding:8px 14px 8px 0;color:#6b665f;font-weight:600;vertical-align:top">${escapeHtml(label)}</td><td style="padding:8px 0;white-space:pre-wrap">${escapeHtml(value)}</td></tr>`)
    .join("");
  const applicantText = `Hi ${name},\n\nThanks for putting your brand in front of us. We’re excited to take a proper look and see what we could make together.\n\nWe review every submission and select a focused group of brands for spec work. We’d genuinely love to work with everyone; keeping the group tight means we can give the work real attention and make something your team would actually want to run.\n\nIf it feels like a fit, we’ll be in touch soon.\n\nIn the meantime, see what we’re thinking: https://studiotak.co/learn\n\nWarmly,\nThe team at Studio Tak`;
  const applicantHtml = `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;margin:0;padding:0;background:#f9f7f6;"><tr><td align="center" style="padding:28px 16px 48px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #d9d5d3;border-radius:12px;"><tr><td style="padding:28px 32px 24px;border-bottom:1px solid #e5e2e0;"><img src="https://firebasestorage.googleapis.com/v0/b/studio-tak.firebasestorage.app/o/site-settings%2FlogoUrl-1765339607477-Horizontal.svg?alt=media&amp;token=55cbaf8d-1973-4e21-a745-23765b06e842" width="140" height="24" alt="Studio Tak" style="display:block;width:140px;height:24px;border:0;outline:none;text-decoration:none;" /></td></tr><tr><td style="padding:32px 32px 0;"><p style="margin:0;color:#ff700b;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.14em;line-height:1.2;text-transform:uppercase;">Campfire / 5 free spec ads</p><h1 style="margin:16px 0 0;color:#1b1817;font-family:Georgia,'Times New Roman',serif;font-size:42px;font-weight:400;letter-spacing:-1.6px;line-height:1.02;">Let’s make something<br />worth running.</h1></td></tr><tr><td style="padding:26px 32px 8px;color:#3e3a38;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;"><p style="margin:0 0 20px;">Hi ${escapeHtml(name)},</p><p style="margin:0 0 20px;">Thanks for putting your brand in front of us. We’re excited to take a proper look and see what we could make together.</p><p style="margin:0 0 20px;">We review every submission and select a focused group of brands for spec work. We’d genuinely love to work with everyone; keeping the group tight means we can give the work real attention and make something your team would actually want to run.</p><p style="margin:0;">If it feels like a fit, we’ll be in touch soon.</p></td></tr><tr><td style="padding:28px 32px 24px;"><table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td style="background:#ff700b;border-radius:8px;"><a href="https://studiotak.co/learn" target="_blank" style="display:inline-block;padding:13px 16px;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:600;line-height:1;text-decoration:none;">See what we’re thinking&nbsp;&nbsp;→</a></td></tr></table></td></tr><tr><td style="padding:0 32px 34px;color:#6a6664;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;"><div style="border-top:1px solid #e5e2e0;padding-top:20px;">Warmly,<br />The team at Studio Tak</div></td></tr></table></td></tr></table>`;
  const applicantComplianceText = "You’re receiving this because you applied for Campfire spec work.\nPrivacy Policy: https://studiotak.co/privacy-policy\nTerms of Service: https://studiotak.co/terms-of-service";
  const applicantHtmlWithFooter = applicantHtml
    .replace(
      "Warmly,<br />The team at Studio Tak</div>",
      "Warmly,<br />The team at Studio Tak<p style=\"margin:20px 0 0;color:#9c9896;font-size:11px;line-height:1.5;\">You’re receiving this because you applied for Campfire spec work.</p><p style=\"margin:7px 0 0;font-size:11px;line-height:1.5;\"><a href=\"https://studiotak.co/privacy-policy\" target=\"_blank\" style=\"color:#6a6664;text-decoration:underline;\">Privacy Policy</a><span style=\"color:#cdc8c5;\">&nbsp;·&nbsp;</span><a href=\"https://studiotak.co/terms-of-service\" target=\"_blank\" style=\"color:#6a6664;text-decoration:underline;\">Terms of Service</a></p></div>"
    )
    .replace(
      "<td style=\"padding:28px 32px 24px;\"><table role=\"presentation\"",
      "<td style=\"padding:28px 32px 24px;\"><p style=\"margin:0 0 14px;color:#3e3a38;font-size:15px;line-height:1.5;\">In the meantime, take a look at our thinking.</p><table role=\"presentation\""
    );
  const applicantEmail = applicationTemplateId
    ? {
        from: fromEmail,
        to: [email],
        template: { id: applicationTemplateId, variables: { NAME: name } }
      }
    : {
        from: fromEmail,
        to: [email],
        subject: "Thanks for your interest in Campfire",
        text: `${applicantText}\n\n${applicantComplianceText}`,
        html: applicantHtmlWithFooter
      };

  const emailResponse = await fetch("https://api.resend.com/emails/batch", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "studio-tak-website/campfire-spec-ads"
    },
    body: JSON.stringify([
      {
        from: fromEmail,
        to: ["info@studiotak.co"],
        reply_to: email,
        subject: `Spec ads application — ${businessName}`,
        text: `New Campfire spec ads application\n\n${text}`,
        html: `<h2 style="font-family:Arial,sans-serif">New Campfire spec ads application</h2><table style="font-family:Arial,sans-serif;font-size:14px;line-height:1.45">${html}</table>`
      },
      applicantEmail
    ]),
    cache: "no-store"
  });

  if (!emailResponse.ok) {
    return NextResponse.json({ error: "We couldn't send your application. Please try again." }, { status: 502 });
  }

  if (marketingConsent) await addMarketingContact(apiKey, email);

  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
