"use client";

import Script from "next/script";
import { FormEvent, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { collection, getDocs, getFirestore, limit, query, where } from "firebase/firestore";
import { getFirebaseApp } from "@/lib/firebaseClient";
import { animationPresets, defaultAnimationPreset } from "@/components/sections/animationPresets";
import { LogosBlockSection } from "@/components/sections/BlocksRenderer";
import type { LogosBlock } from "@/lib/admin/pages";
import { trackMetaEvent } from "@/lib/cookieConsent";
import styles from "./SpecAdsCampaign.module.css";

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
          "error-callback"?: () => void;
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

type SubmitState = "idle" | "submitting" | "success" | "error";

type HeroExampleAd = {
  id: string;
  url: string;
  alt: string;
  industry: string[];
};

const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

const spendOptions = ["Under $10k", "$10k–$50k", "$50k–$150k", "$150k–$500k", "$500k+"];
const creativeSetupOptions = ["In-house team", "Creative agency", "Freelancers", "A mix of in-house and external partners", "Other"];
const heroCardTransforms = [styles.adCardOne, styles.adCardTwo, styles.adCardThree];
const messageCardTransforms = [styles.messageCardOne, styles.messageCardTwo, styles.messageCardThree];
const heroMessageCards = [
  {
    headline: "More creative tests, faster",
    detail: "Find the angle worth scaling"
  },
  {
    headline: "Keep winners from going stale",
    detail: "Turn performance into the next brief"
  },
  {
    headline: "Make more ads your brand would actually run",
    detail: "Grow spend without losing the brand"
  }
];

const selectDiverseExamples = (items: HeroExampleAd[]) => {
  const selected: HeroExampleAd[] = [];
  const seenIndustries = new Set<string>();

  for (const item of items) {
    const industry = item.industry.find(Boolean)?.toLowerCase() ?? "";
    if (selected.length < 3 && (!industry || !seenIndustries.has(industry))) {
      selected.push(item);
      if (industry) seenIndustries.add(industry);
    }
  }

  for (const item of items) {
    if (selected.length >= 3) break;
    if (!selected.some((selectedItem) => selectedItem.id === item.id)) selected.push(item);
  }

  return selected;
};

export function SpecAdsCampaign({ logoBlock }: { logoBlock?: LogosBlock }) {
  const captchaContainerRef = useRef<HTMLDivElement>(null);
  const captchaWidgetRef = useRef<string | null>(null);
  const heroArtworkRef = useRef<HTMLDivElement>(null);
  const successMessageRef = useRef<HTMLDivElement>(null);
  const formStartedAtRef = useRef(Date.now());
  const [turnstileLoaded, setTurnstileLoaded] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaError, setCaptchaError] = useState("");
  const [featuredExamples, setFeaturedExamples] = useState<HeroExampleAd[]>([]);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [submitError, setSubmitError] = useState("");
  const animationPreset = animationPresets[defaultAnimationPreset];

  useEffect(() => {
    if (!turnstileLoaded || !turnstileSiteKey || !captchaContainerRef.current || !window.turnstile) return;

    const container = captchaContainerRef.current;
    captchaWidgetRef.current = window.turnstile.render(container, {
      sitekey: turnstileSiteKey,
      action: "spec_ads_application",
      theme: "light",
      callback: (token) => {
        setCaptchaToken(token);
        setCaptchaError("");
      },
      "expired-callback": () => setCaptchaToken(""),
      "error-callback": () => {
        setCaptchaToken("");
        setCaptchaError("The security check could not load. Please refresh and try again.");
      }
    });

    return () => {
      if (captchaWidgetRef.current) window.turnstile?.remove(captchaWidgetRef.current);
    };
  }, [turnstileLoaded]);

  useEffect(() => {
    let cancelled = false;

    const loadHeroExamples = async () => {
      if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) return;

      try {
        const mediaSnapshot = await getDocs(
          query(
            collection(getFirestore(getFirebaseApp()), "media"),
            where("status", "==", "published"),
            where("type", "==", "Example"),
            where("featured", "==", true),
            limit(24)
          )
        );
        if (cancelled) return;

        const examples = mediaSnapshot.docs
          .map((mediaDoc): HeroExampleAd | null => {
            const data = mediaDoc.data();
            if (typeof data.url !== "string" || !data.url) return null;
            const industry = Array.isArray(data.industry)
              ? data.industry.filter((tag): tag is string => typeof tag === "string" && Boolean(tag.trim()))
              : typeof data.industry === "string" && data.industry.trim()
                ? [data.industry.trim()]
                : [];
            return {
              id: mediaDoc.id,
              url: data.url,
              alt: typeof data.alt === "string" && data.alt.trim() ? data.alt : typeof data.name === "string" ? data.name : "Campfire example ad",
              industry
            };
          })
          .filter((item): item is HeroExampleAd => item !== null);

        setFeaturedExamples(examples);
      } catch (error) {
        console.error("Failed to load featured hero examples", error);
      }
    };

    loadHeroExamples();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const artwork = heroArtworkRef.current;
    if (!artwork || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const updateParallax = () => {
      const bounds = artwork.getBoundingClientRect();
      const progress = Math.max(-1, Math.min(1, (window.innerHeight * 0.58 - bounds.top) / window.innerHeight));
      artwork.style.setProperty("--parallax-one", `${Math.round(progress * -18)}px`);
      artwork.style.setProperty("--parallax-two", `${Math.round(progress * 24)}px`);
      artwork.style.setProperty("--parallax-three", `${Math.round(progress * -11)}px`);
      frame = 0;
    };
    const queueUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(updateParallax);
    };

    updateParallax();
    window.addEventListener("scroll", queueUpdate, { passive: true });
    window.addEventListener("resize", queueUpdate);
    return () => {
      window.removeEventListener("scroll", queueUpdate);
      window.removeEventListener("resize", queueUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (submitState !== "success") return;

    const scrollTimeout = window.setTimeout(() => {
      successMessageRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 0);

    return () => window.clearTimeout(scrollTimeout);
  }, [submitState]);

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

    try {
      const response = await fetch("/api/campaign-spec-ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...fields,
          captchaToken,
          formStartedAt: formStartedAtRef.current,
          signupPath: window.location.pathname,
          utmSource: searchParams.get("utm_source") ?? "",
          utmMedium: searchParams.get("utm_medium") ?? "",
          utmCampaign: searchParams.get("utm_campaign") ?? ""
        })
      });

      const payload = (await response.json().catch(() => null)) as { error?: string; code?: string } | null;
      if (!response.ok) {
        if (payload?.code === "turnstile_expired") {
          setCaptchaError("The security check expired. Please complete it again before submitting.");
          setSubmitState("idle");
          return;
        }
        throw new Error(payload?.error || "We couldn't send your application. Please try again.");
      }

      setSubmitState("success");
      form.reset();
      trackMetaEvent("Lead", { content_name: "Free spec ads application" });
    } catch (error) {
      setSubmitState("error");
      setSubmitError(error instanceof Error ? error.message : "We couldn't send your application. Please try again.");
    } finally {
      if (captchaWidgetRef.current) window.turnstile?.reset(captchaWidgetRef.current);
      setCaptchaToken("");
    }
  };

  const securityMessage = !turnstileSiteKey
    ? "This form is temporarily unavailable. Please try again shortly."
    : captchaError;
  const heroExamples = selectDiverseExamples(featuredExamples);
  const heroExampleIds = new Set(heroExamples.map((example) => example.id));
  const whyExamples = featuredExamples.filter((example) => !heroExampleIds.has(example.id)).slice(0, 3);

  return (
    <main className={styles.page}>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setTurnstileLoaded(true)}
        onError={() => setCaptchaError("The security check could not load. Please refresh and try again.")}
      />

      <section className={styles.hero}>
        <div className={styles.shell}>
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>For brands ready to grow on Meta</p>
              <h1>
                Claim <em>5 free</em>
                <br />
                spec ads.
              </h1>
              <p className={styles.heroLead}>
                Tell us what you want to feature. Campfire takes it from brief to delivery, creating five spec ads built for
                today&apos;s Meta creative landscape.
              </p>
              <a className={styles.primaryButton} href="#application">
                Get your ads <span aria-hidden="true">→</span>
              </a>
              <p className={styles.noCommitment}>No commitment. We&apos;ll review every application.</p>
            </div>

            <div ref={heroArtworkRef} className={styles.heroArtwork} aria-label="Featured Campfire example ads">
              {heroExamples.map((ad, index) => (
                <div className={styles.heroCardPair} key={ad.id}>
                  <motion.div
                    className={styles.adMotion}
                    variants={animationPreset.item}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    custom={index * 2}
                  >
                    <figure className={`${styles.adCard} ${heroCardTransforms[index]}`}>
                      <img src={ad.url} alt={ad.alt} />
                    </figure>
                  </motion.div>
                  <motion.article
                    className={`${styles.messageCard} ${messageCardTransforms[index]}`}
                    variants={animationPreset.item}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    custom={index * 2 + 1}
                  >
                    <p>{heroMessageCards[index]?.headline}</p>
                    <span>{heroMessageCards[index]?.detail}</span>
                  </motion.article>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {logoBlock ? (
        <section className={styles.campfireLogos} aria-label={logoBlock.heading ?? "Campfire clients"}>
          <p className={styles.logosEyebrow}>Your favorite brands are growing faster with Campfire</p>
          <LogosBlockSection block={logoBlock} index={0} hideHeading />
        </section>
      ) : null}

      <section className={styles.intro}>
        <div className={styles.shell}>
          <div className={styles.introGrid}>
            <div>
              {whyExamples.length ? (
                <motion.div
                  className={styles.whyAds}
                  variants={animationPreset.container}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.2 }}
                >
                  {whyExamples.map((ad, index) => (
                    <motion.figure
                      key={ad.id}
                      className={`${styles.whyAd} ${heroCardTransforms[index % heroCardTransforms.length]}`}
                      variants={animationPreset.item}
                      custom={index}
                    >
                      <img src={ad.url} alt={ad.alt} />
                    </motion.figure>
                  ))}
                </motion.div>
              ) : null}
            </div>
            <div>
              <h2>Launch more ads, without slowing your team down.</h2>
              <p>
                Campfire is an Andromeda-optimized creative workflow for teams that need a steady stream of fresh ads. You
                share the product and the context; we handle the brief, concepts, production, and delivery.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.applicationSection} id="application">
        <div className={styles.shell}>
          <div className={styles.formGrid}>
            <div className={styles.formIntro}>
              <h2>What should we make?</h2>
              <p>
                A little context helps us choose the right products and create work that feels useful to your team.
              </p>
              <div className={styles.disclaimer}>
                <strong>A note on selection</strong>
                <p>
                  We review every submission and select brands for spec work at our discretion. We&apos;d love to work with
                  everyone; this helps us make sure the work goes to real brands we can genuinely support.
                </p>
              </div>
            </div>

            <div className={`${styles.formCard} ${submitState === "success" ? styles.formCardSuccess : ""}`}>
              {submitState === "success" ? (
                <div ref={successMessageRef} className={styles.successMessage} role="status" tabIndex={-1}>
                  <span>✓</span>
                  <h3>Application received.</h3>
                  <p>Thanks for sharing your brand. We&apos;ll review the details and be in touch if it&apos;s a fit.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className={styles.fieldGrid}>
                    <label>
                      <span className={styles.srOnly}>First name</span>
                      <input name="firstName" type="text" autoComplete="given-name" placeholder="First name" required maxLength={100} />
                    </label>
                    <label>
                      <span className={styles.srOnly}>Last name</span>
                      <input name="lastName" type="text" autoComplete="family-name" placeholder="Last name" required maxLength={100} />
                    </label>
                  </div>
                  <label>
                    <span className={styles.srOnly}>Work email</span>
                    <input name="email" type="email" autoComplete="email" placeholder="Work email" required maxLength={254} />
                  </label>
                  <label>
                    <span className={styles.srOnly}>Business name</span>
                    <input name="businessName" type="text" autoComplete="organization" placeholder="Business name" required maxLength={200} />
                  </label>
                  <label>
                    <span className={styles.srOnly}>What product would you like us to feature?</span>
                    <textarea name="productToFeature" placeholder="What product would you like us to feature?" required maxLength={2000} rows={4} />
                  </label>
                  <label>
                    <span className={styles.srOnly}>Average monthly spend on Meta</span>
                    <select name="monthlyMetaSpend" required defaultValue="">
                      <option value="" disabled>
                        Average monthly Meta spend
                      </option>
                      {spendOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className={styles.srOnly}>How is your creative currently produced?</span>
                    <select name="creativeSetup" required defaultValue="">
                      <option value="" disabled>
                        How is your creative currently produced?
                      </option>
                      {creativeSetupOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className={styles.srOnly}>What would make your creative more effective right now?</span>
                    <textarea name="creativeChallenge" placeholder="What would make your creative more effective right now?" required maxLength={3000} rows={5} />
                  </label>
                  <div className={styles.formLegal}>
                    <p>
                      By submitting, you acknowledge our <a href="/privacy-policy">Privacy Policy</a> and agree to our{" "}
                      <a href="/terms-of-service">Terms of Service</a>.
                    </p>
                    <label className={styles.marketingConsent}>
                      <input name="marketingConsent" type="checkbox" value="yes" />
                      <span>Send me Studio Tak&apos;s occasional thinking, Campfire updates, and useful creative ideas by email. I can unsubscribe anytime.</span>
                    </label>
                  </div>
                  <div className={styles.honeypot} aria-hidden="true">
                    <label htmlFor="website">Leave this field blank</label>
                    <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
                  </div>
                  <div className={styles.captchaWrap}>
                    <span className={styles.captchaLabel}>Security check</span>
                    <div ref={captchaContainerRef} />
                    {securityMessage ? <p className={styles.captchaError}>{securityMessage}</p> : null}
                  </div>
                  {submitState === "error" ? <p className={styles.submitError} role="alert">{submitError}</p> : null}
                  <button className={styles.submitButton} type="submit" disabled={submitState === "submitting" || !captchaToken}>
                    {submitState === "submitting" ? "Sending application…" : "Get your ads"} <span aria-hidden="true">→</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.pricing}>
        <div className={styles.shell}>
          <div className={styles.pricingIntro}>
            <div>
              <h2>Order ads like you order anything else. Delivered in 5 days.</h2>
            </div>
            <p>
              Most creative services price the process: hours, people, project scopes, and surprise change orders.
              Campfire prices the thing you actually receive.
            </p>
          </div>

          <div className={styles.pricingGrid}>
            <div className={styles.priceStatement}>
              <div className={styles.priceAmount}>
                <span>$50</span>
                <strong>per delivered ad</strong>
              </div>
              <p>
                Like ordering a product, not scoping a project. Add ads when you need them, know the price before you do.
              </p>
              <p className={styles.priceExample}>10 ads = $500. 40 ads = $2,000.</p>
            </div>

            <div className={styles.comparison}>
              <div className={styles.comparisonColumn}>
                <h3>Traditional creative service</h3>
                <ul>
                  <li>Quoted by project or retainer</li>
                  <li>Billed for hours and people</li>
                  <li>Total changes as the scope does</li>
                </ul>
              </div>
              <div className={`${styles.comparisonColumn} ${styles.comparisonColumnCampfire}`}>
                <h3>Campfire</h3>
                <ul>
                  <li>One clear unit price</li>
                  <li>Pay only for delivered ads</li>
                  <li>Scale up, slow down, or stop anytime</li>
                </ul>
              </div>
            </div>
          </div>

          <p className={styles.pricingCloser}>
            After you receive your spec work, you decide if you want to keep going. No retainer. No long-term commitment.
          </p>
        </div>
      </section>

    </main>
  );
}
