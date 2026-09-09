"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import type { ContactBlock } from "@/lib/admin/pages";
import { getTurnstileLoadError, loadTurnstile } from "@/lib/turnstile";
import { AnimatedSection, SectionHeading } from "./AnimatedSection";
import { animationPresets, defaultAnimationPreset } from "./animationPresets";
import { createMetaEventId, trackMetaEvent } from "@/lib/cookieConsent";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          action?: string;
          theme?: "light" | "dark" | "auto";
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: (errorCode?: string | number) => void;
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    gtag?: (...args: unknown[]) => void;
  }
}

type SubmitState = "idle" | "submitting" | "error";

const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

const trackGaEvent = (eventName: string, params: Record<string, unknown>) => {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", eventName, params);
};

export function ResendContactBlockSection({ block, index }: { block: ContactBlock; index: number }) {
  const router = useRouter();
  const hasMedia = !!block.media?.url;
  const isVideo = block.media?.type === "video" || /\.(mp4|mov|webm|ogg)$/i.test(block.media?.url ?? "");
  const captchaContainerRef = useRef<HTMLDivElement>(null);
  const captchaWidgetRef = useRef<string | null>(null);
  const formStartedAtRef = useRef(Date.now());
  const hasTrackedFormStart = useRef(false);
  const [turnstileLoaded, setTurnstileLoaded] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaError, setCaptchaError] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [submitError, setSubmitError] = useState("");
  const preset = animationPresets[defaultAnimationPreset];

  useEffect(() => {
    let active = true;

    void loadTurnstile()
      .then(() => {
        if (active) setTurnstileLoaded(true);
      })
      .catch(() => {
        if (active) setCaptchaError(getTurnstileLoadError());
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!turnstileLoaded || !turnstileSiteKey || !captchaContainerRef.current || !window.turnstile) return;

    const container = captchaContainerRef.current;
    captchaWidgetRef.current = window.turnstile.render(container, {
      sitekey: turnstileSiteKey,
      theme: "light",
      callback: (token) => {
        setCaptchaToken(token);
        setCaptchaError("");
      },
      "expired-callback": () => setCaptchaToken(""),
      "error-callback": (errorCode) => {
        setCaptchaToken("");
        console.error("Turnstile widget failed to load", { errorCode });
        setCaptchaError(getTurnstileLoadError(errorCode));
      }
    });

    return () => {
      if (captchaWidgetRef.current) window.turnstile?.remove(captchaWidgetRef.current);
    };
  }, [turnstileLoaded]);

  const handleFormStart = () => {
    if (hasTrackedFormStart.current) return;
    hasTrackedFormStart.current = true;
    trackGaEvent("form_start", {
      form_id: "contact-form",
      method: "resend",
      section: block.anchor ?? "contact"
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;

    if (!captchaToken) {
      setCaptchaError("Please complete the security check before submitting.");
      return;
    }

    setSubmitState("submitting");
    setSubmitError("");

    const fields = Object.fromEntries(new FormData(form).entries());
    const searchParams = new URLSearchParams(window.location.search);
    const metaEventId = createMetaEventId();
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...fields,
          captchaToken,
          formStartedAt: formStartedAtRef.current,
          signupPath: window.location.pathname,
          utmSource: searchParams.get("utm_source") ?? "",
          utmMedium: searchParams.get("utm_medium") ?? "",
          utmCampaign: searchParams.get("utm_campaign") ?? "",
          metaEventId
        })
      });
      const payload = (await response.json().catch(() => null)) as { error?: string; code?: string } | null;
      if (!response.ok) {
        if (payload?.code === "turnstile_expired") {
          setCaptchaError("The security check expired. Please complete it again before submitting.");
          setSubmitState("idle");
          return;
        }
        throw new Error(payload?.error || "We couldn't send your message. Please try again.");
      }

      trackGaEvent("generate_lead", {
        form_id: "contact-form",
        method: "resend",
        section: block.anchor ?? "contact"
      });
      trackMetaEvent("Lead", { content_name: "Contact form" }, metaEventId);
      router.replace("/thank-you");
    } catch (error) {
      setSubmitState("error");
      setSubmitError(error instanceof Error ? error.message : "We couldn't send your message. Please try again.");
    } finally {
      if (captchaWidgetRef.current) window.turnstile?.reset(captchaWidgetRef.current);
      setCaptchaToken("");
    }
  };

  const securityMessage = !turnstileSiteKey
    ? "This form is temporarily unavailable. Please try again shortly."
    : captchaError;
  const media = hasMedia ? (
    <div
      data-resend-contact-media
      style={{
        width: "100%",
        aspectRatio: "1 / 1",
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid var(--border-strong)",
        background: "rgba(255,255,255,0.02)"
      }}
    >
      {isVideo ? (
        <video src={block.media?.url} controls style={{ width: "100%", height: "100%", objectFit: "cover" }}>
          Your browser does not support the video tag.
        </video>
      ) : (
        <img
          src={block.media?.url ?? ""}
          alt={block.media?.alt ?? ""}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      )}
    </div>
  ) : null;

  return (
    <AnimatedSection key={block.id ?? index} index={index} variant="plain" animated={false}>
      <div data-resend-contact-block>
        <style>{`
          [data-resend-contact-block] {
            width: 100%;
            max-width: var(--max-width);
            margin: 0 auto;
          }
          [data-resend-contact-section] {
            width: 100%;
            max-width: var(--max-width);
            margin: 0 auto;
            padding: 0 var(--section-px, 15px);
          }
          [data-resend-contact-grid] {
            display: grid;
            gap: 18px;
            align-items: center;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          }
          [data-resend-contact-form] {
            padding: clamp(22px, 4vw, 40px);
            border: 1px solid var(--border-strong);
            border-radius: 18px;
            background: var(--input-bg);
            font-family: var(--font-sans, Rubik, system-ui, -apple-system, sans-serif);
          }
          [data-resend-contact-form] form { display: grid; gap: 20px; }
          [data-resend-contact-form] label { display: grid; }
          [data-resend-contact-form] .contact-name-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 20px; }
          [data-resend-contact-form] .contact-sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
          [data-resend-contact-form] input[type=text],
          [data-resend-contact-form] input[type=email],
          [data-resend-contact-form] textarea {
            width: 100%;
            box-sizing: border-box;
            padding: 12px 14px;
            border: 1px solid var(--border-strong);
            border-radius: 10px;
            background: transparent;
            color: var(--text);
            font: inherit;
            font-weight: 500;
            line-height: 1.35;
            transition: border-color 150ms ease, box-shadow 150ms ease;
          }
          [data-resend-contact-form] input::placeholder,
          [data-resend-contact-form] textarea::placeholder { color: var(--muted); opacity: .78; }
          [data-resend-contact-form] textarea { min-height: 72px; resize: none; }
          [data-resend-contact-form] input:focus,
          [data-resend-contact-form] textarea:focus { border-color: var(--accent); outline: none; box-shadow: 0 0 0 3px var(--accent-soft); }
          [data-resend-contact-form] .contact-consent { grid-template-columns: 16px 1fr; align-items: start; gap: 10px; color: var(--muted); font-size: var(--font-size-label); font-weight: 500; line-height: 1.5; }
          [data-resend-contact-form] .contact-consent input { width: 16px; height: 16px; margin: 1px 0 0; accent-color: var(--accent); }
          [data-resend-contact-form] .contact-legal { margin: 0; color: var(--muted); font-size: var(--font-size-xs); line-height: 1.5; }
          [data-resend-contact-form] .contact-legal a { color: inherit; text-decoration: underline; text-underline-offset: 2px; }
          [data-resend-contact-form] .contact-captcha-label { display: block; margin-bottom: 6px; color: var(--muted); font-size: var(--font-size-label); font-weight: 700; }
          [data-resend-contact-form] .contact-error { margin: 0; padding: 8px 10px; border: 1px solid rgba(214, 54, 54, .28); border-radius: 10px; background: rgba(214, 54, 54, .08); color: var(--danger); font-size: var(--font-size-sm); line-height: 1.45; }
          [data-resend-contact-form] .contact-submit {
            display: inline-flex;
            justify-self: start;
            align-items: center;
            gap: 8px;
            padding: 12px 16px;
            border: 0;
            border-radius: 12px;
            background: var(--accent);
            color: #fff;
            font: inherit;
            font-size: var(--font-size-body);
            font-weight: 700;
            cursor: pointer;
            box-shadow: 0 6px 16px rgba(0, 0, 0, .12);
            transition: transform .12s ease, box-shadow .12s ease, background .12s ease;
          }
          [data-resend-contact-form] .contact-submit:hover:not(:disabled) { transform: translateY(-1px); background: var(--accent-strong); box-shadow: 0 8px 18px rgba(0, 0, 0, .16); }
          [data-resend-contact-form] .contact-submit:focus { outline: 2px solid var(--accent); outline-offset: 2px; }
          [data-resend-contact-form] .contact-submit:disabled { cursor: not-allowed; opacity: .65; }
          [data-resend-contact-honeypot] { position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden; }
          @media (max-width: 900px) { [data-resend-contact-media] { max-width: 540px; margin: 0 auto; } }
          @media (max-width: 768px) { [data-resend-contact-grid] { grid-template-columns: 1fr; } }
        `}</style>
        <motion.section
          data-resend-contact-section
          variants={preset.item}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          custom={index}
        >
          <div data-resend-contact-grid>
            {media}
            <div className="grid" style={{ gap: 12 }}>
              <SectionHeading eyebrow={block.eyebrow} title={block.heading} kicker={block.body} />
              <div data-resend-contact-form>
                <form onSubmit={handleSubmit} onFocus={handleFormStart} onInput={handleFormStart}>
                  <div className="contact-name-row">
                    <label>
                      <span className="contact-sr-only">First name</span>
                      <input type="text" name="firstName" autoComplete="given-name" placeholder="First name" aria-label="First name" required maxLength={100} />
                    </label>
                    <label>
                      <span className="contact-sr-only">Last name</span>
                      <input type="text" name="lastName" autoComplete="family-name" placeholder="Last name" aria-label="Last name" required maxLength={100} />
                    </label>
                  </div>
                  <label>
                    <span className="contact-sr-only">Work email</span>
                    <input type="email" name="email" autoComplete="email" placeholder="Work email" aria-label="Work email" required maxLength={254} />
                  </label>
                  <label>
                    <span className="contact-sr-only">What would make your creative more effective right now? Optional</span>
                    <textarea name="creativeChallenge" placeholder="What would make your creative more effective right now? (Optional)" aria-label="What would make your creative more effective right now? Optional" maxLength={3000} rows={3} />
                  </label>
                  <p className="contact-legal">
                    By submitting, you acknowledge our <a href="/privacy-policy">Privacy Policy</a> and agree to our{" "}
                    <a href="/terms-of-service">Terms of Service</a>.
                  </p>
                  <label className="contact-consent">
                    <input type="checkbox" name="marketingConsent" value="yes" />
                    <span>Send me Studio Tak&apos;s occasional thinking, Campfire updates, and useful creative ideas by email. I can unsubscribe anytime.</span>
                  </label>
                  <div>
                    <span className="contact-captcha-label">Security check</span>
                    <div ref={captchaContainerRef} />
                    {securityMessage ? <p className="contact-error" role="alert" style={{ marginTop: 8 }}>{securityMessage}</p> : null}
                  </div>
                  {submitState === "error" ? <p className="contact-error" role="alert">{submitError}</p> : null}
                  <div data-resend-contact-honeypot aria-hidden="true">
                    <label htmlFor="contact-website">Leave this field blank</label>
                    <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
                  </div>
                  <button className="contact-submit" type="submit" disabled={submitState === "submitting" || !captchaToken}>
                    {submitState === "submitting" ? "Submitting…" : "Submit"}
                  </button>
                </form>
              </div>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: "var(--font-size-sm)" }}>
                We typically reply within one business day.
              </p>
            </div>
          </div>
        </motion.section>
      </div>
    </AnimatedSection>
  );
}
