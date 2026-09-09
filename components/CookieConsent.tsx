"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  COOKIE_PREFERENCES_NAME,
  COOKIE_PREFERENCES_VERSION,
  OPEN_COOKIE_PREFERENCES_EVENT,
  type CookiePreferences
} from "@/lib/cookieConsent";
import styles from "./CookieConsent.module.css";

type StoredCookiePreferences = CookiePreferences & {
  version: string;
  updatedAt: string;
};

const defaultPreferences: CookiePreferences = { analytics: false, marketing: false };
const consentLifetimeSeconds = 60 * 60 * 24 * 365;
const googleAnalyticsId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
const googleAdsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim() || "AW-18441317671";
const googleTagId = googleAnalyticsId || googleAdsId;
const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
const contentsquareTagId = process.env.NEXT_PUBLIC_CONTENTSQUARE_TAG_ID?.trim() || "5382551060185";
const hasOptionalTracking = Boolean(googleTagId || metaPixelId || contentsquareTagId);
type MetaPixel = NonNullable<Window["fbq"]>;

function getCookieValue(name: string) {
  if (typeof document === "undefined") return null;
  const prefix = `${name}=`;
  return document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(prefix))
    ?.slice(prefix.length) ?? null;
}

function readStoredPreferences(): CookiePreferences | null {
  const value = getCookieValue(COOKIE_PREFERENCES_NAME);
  if (!value) return null;

  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as Partial<StoredCookiePreferences>;
    if (parsed.version !== COOKIE_PREFERENCES_VERSION) return null;
    if (typeof parsed.analytics !== "boolean" || typeof parsed.marketing !== "boolean") return null;
    return { analytics: parsed.analytics, marketing: parsed.marketing };
  } catch {
    return null;
  }
}

function savePreferences(preferences: CookiePreferences) {
  const value = encodeURIComponent(JSON.stringify({
    ...preferences,
    version: COOKIE_PREFERENCES_VERSION,
    updatedAt: new Date().toISOString()
  }));
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE_PREFERENCES_NAME}=${value}; Max-Age=${consentLifetimeSeconds}; Path=/; SameSite=Lax${secure}`;
  window.__studioTakCookiePreferences = preferences;
}

function deleteCookie(name: string) {
  const host = window.location.hostname;
  const hostParts = host.split(".");
  const domains = ["", host, `.${host}`];
  if (hostParts.length > 2) domains.push(`.${hostParts.slice(-2).join(".")}`);

  for (const domain of domains) {
    document.cookie = `${name}=; Max-Age=0; Path=/${domain ? `; Domain=${domain}` : ""}`;
  }
}

function clearTrackingCookies(prefix: "_ga" | "_fb" | "_gcl") {
  const names = document.cookie
    .split("; ")
    .map((cookie) => cookie.split("=", 1)[0])
    .filter((name) => {
      if (prefix === "_ga") return name === "_ga" || name.startsWith("_ga_");
      if (prefix === "_fb") return name === "_fbp" || name === "_fbc";
      return name.startsWith("_gcl");
    });
  names.forEach(deleteCookie);
}

function addExternalScript(id: string, src: string) {
  const existing = document.getElementById(id) as HTMLScriptElement | null;
  if (existing) {
    if (existing.dataset.loaded === "true") return Promise.resolve();
    return new Promise<void>((resolve, reject) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error(`Unable to load ${src}`)), { once: true });
    });
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error(`Unable to load ${src}`));
    document.head.appendChild(script);
  });
}

function getGtag() {
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || ((...args: unknown[]) => window.dataLayer?.push(args));
  return window.gtag;
}

function updateGoogleConsent(preferences: CookiePreferences) {
  const gtag = getGtag();
  const mode = window.__studioTakGoogleTagConsentInitialized ? "update" : "default";
  gtag("consent", mode, {
    analytics_storage: preferences.analytics ? "granted" : "denied",
    ad_storage: preferences.marketing ? "granted" : "denied",
    ad_user_data: preferences.marketing ? "granted" : "denied",
    ad_personalization: preferences.marketing ? "granted" : "denied"
  });
  window.__studioTakGoogleTagConsentInitialized = true;
  return gtag;
}

async function enableGoogleTag(pathname: string, preferences: CookiePreferences) {
  if (!googleTagId) return;

  const gtag = updateGoogleConsent(preferences);
  const configuredIds = new Set(window.__studioTakGoogleTagConfiguredIds ?? []);

  if (configuredIds.size === 0) gtag("js", new Date());

  if (preferences.analytics && googleAnalyticsId && !configuredIds.has(googleAnalyticsId)) {
    (window as unknown as Record<string, boolean>)[`ga-disable-${googleAnalyticsId}`] = false;
    gtag("config", googleAnalyticsId, { send_page_view: false });
    configuredIds.add(googleAnalyticsId);
  }

  if (preferences.marketing && googleAdsId && !configuredIds.has(googleAdsId)) {
    gtag("config", googleAdsId);
    configuredIds.add(googleAdsId);
  }
  window.__studioTakGoogleTagConfiguredIds = Array.from(configuredIds);

  try {
    await addExternalScript("studio-tak-google-tag", `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(googleTagId)}`);
  } catch {
    return;
  }

  if (!preferences.analytics || !googleAnalyticsId) return;

  gtag("event", "page_view", {
    page_location: window.location.href,
    page_path: `${pathname}${window.location.search}`,
    page_title: document.title
  });
}

function disableGoogleAnalytics(measurementId: string) {
  (window as unknown as Record<string, boolean>)[`ga-disable-${measurementId}`] = true;
  clearTrackingCookies("_ga");
}

function disableGoogleAds() {
  clearTrackingCookies("_gcl");
}

function createMetaPixelQueue() {
  if (window.fbq) return window.fbq;

  const pixel = ((...args: unknown[]) => {
    if (pixel.callMethod) pixel.callMethod(...args);
    else pixel.queue?.push(args);
  }) as MetaPixel;
  pixel.push = pixel;
  pixel.loaded = true;
  pixel.version = "2.0";
  pixel.queue = [];
  window.fbq = pixel;
  window._fbq = pixel;
  return pixel;
}

function enableMetaPixel(pixelId: string) {
  const fbq = createMetaPixelQueue();
  if (window.__studioTakMetaPixelInitializedId !== pixelId) {
    fbq("init", pixelId);
    window.__studioTakMetaPixelInitializedId = pixelId;
  }
  fbq("track", "PageView");
  void addExternalScript("studio-tak-meta-pixel", "https://connect.facebook.net/en_US/fbevents.js");
}

function disableMetaPixel() {
  window.fbq?.("consent", "revoke");
  clearTrackingCookies("_fb");
}

async function enableContentsquare(tagId: string, isCancelled: () => boolean) {
  if (document.getElementById("studio-tak-contentsquare")) {
    if (getCookieValue("_cs_optout")) {
      deleteCookie("_cs_optout");
      window.location.reload();
    }
    return;
  }

  const { injectContentsquareScript } = await import("@contentsquare/tag-sdk");
  if (isCancelled()) return;
  const script = injectContentsquareScript({ clientId: tagId });
  if (script) script.id = "studio-tak-contentsquare";
}

function disableContentsquare() {
  window._uxa = window._uxa || [];
  window._uxa.push(["optout"]);
}

export function CookieConsent() {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin") ?? false;
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);
  const [hasMadeChoice, setHasMadeChoice] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  useEffect(() => {
    if (isAdminRoute || !hasOptionalTracking) return;
    const stored = readStoredPreferences();
    if (stored) {
      window.__studioTakCookiePreferences = stored;
      setPreferences(stored);
      setHasMadeChoice(true);
    }
  }, [isAdminRoute]);

  useEffect(() => {
    const openPreferences = () => {
      if (isAdminRoute || !hasOptionalTracking) return;
      setPreferences(readStoredPreferences() ?? defaultPreferences);
      setPreferencesOpen(true);
    };
    window.addEventListener(OPEN_COOKIE_PREFERENCES_EVENT, openPreferences);
    return () => window.removeEventListener(OPEN_COOKIE_PREFERENCES_EVENT, openPreferences);
  }, [isAdminRoute]);

  useEffect(() => {
    if (isAdminRoute || !hasMadeChoice || !googleTagId) return;
    if (!preferences.analytics && !preferences.marketing) {
      updateGoogleConsent(preferences);
      if (googleAnalyticsId) disableGoogleAnalytics(googleAnalyticsId);
      disableGoogleAds();
      return;
    }
    if (!preferences.analytics && googleAnalyticsId) disableGoogleAnalytics(googleAnalyticsId);
    if (!preferences.marketing) disableGoogleAds();
    void enableGoogleTag(pathname ?? "/", preferences);
  }, [hasMadeChoice, isAdminRoute, pathname, preferences]);

  useEffect(() => {
    if (isAdminRoute || !hasMadeChoice || !metaPixelId) return;
    if (!preferences.marketing) {
      disableMetaPixel();
      return;
    }
    enableMetaPixel(metaPixelId);
  }, [hasMadeChoice, isAdminRoute, pathname, preferences.marketing]);

  useEffect(() => {
    if (isAdminRoute || !hasMadeChoice || !contentsquareTagId) return;
    if (!preferences.analytics) {
      disableContentsquare();
      return;
    }

    let cancelled = false;
    void enableContentsquare(contentsquareTagId, () => cancelled);
    return () => {
      cancelled = true;
    };
  }, [hasMadeChoice, isAdminRoute, preferences.analytics]);

  if (isAdminRoute || !hasOptionalTracking) return null;

  const commitPreferences = (nextPreferences: CookiePreferences) => {
    savePreferences(nextPreferences);
    setPreferences(nextPreferences);
    setHasMadeChoice(true);
    setPreferencesOpen(false);
  };

  const rejectAll = () => commitPreferences(defaultPreferences);
  const acceptAll = () => commitPreferences({ analytics: true, marketing: true });

  return (
    <>
      {!hasMadeChoice && !preferencesOpen ? (
        <section className={styles.banner} role="dialog" aria-modal="false" aria-labelledby="cookie-banner-title">
          <p className={styles.eyebrow}>Your privacy</p>
          <h2 id="cookie-banner-title" className={styles.title}>Choose your cookie settings</h2>
          <p className={styles.copy}>
            We use essential security technologies and, with your permission, analytics and marketing tools. You can change your choice at any time in Cookie Preferences. Read our <a href="/privacy-policy#cookies">Privacy Policy</a>.
          </p>
          <div className={styles.actions}>
            <button type="button" className={styles.button} onClick={acceptAll}>Accept all</button>
            <button type="button" className={styles.buttonSecondary} onClick={rejectAll}>Reject non-essential</button>
            <button type="button" className={styles.manage} onClick={() => setPreferencesOpen(true)}>Manage choices</button>
          </div>
        </section>
      ) : null}

      {preferencesOpen ? (
        <div className={styles.backdrop} onMouseDown={(event) => {
          if (event.target === event.currentTarget) setPreferencesOpen(false);
        }}>
          <section className={styles.preferences} role="dialog" aria-modal="true" aria-labelledby="cookie-preferences-title">
            <div className={styles.preferencesHeader}>
              <div>
                <p className={styles.eyebrow}>Your privacy</p>
                <h2 id="cookie-preferences-title" className={styles.title}>Cookie preferences</h2>
              </div>
              <button type="button" className={styles.close} onClick={() => setPreferencesOpen(false)} aria-label="Close cookie preferences">×</button>
            </div>
            <p className={styles.copy}>
              Essential technologies keep the site secure and remember this choice. Analytics and marketing remain off unless you choose to enable them.
            </p>
            <div className={styles.categories}>
              <div className={styles.category}>
                <div>
                  <label className={styles.categoryTitle} htmlFor="cookie-necessary">Strictly necessary</label>
                  <span className={styles.categoryCopy}>Saves your cookie choice and supports security checks on forms.</span>
                </div>
                <input id="cookie-necessary" className={styles.switch} type="checkbox" checked disabled aria-label="Strictly necessary cookies are always enabled" />
              </div>
              <div className={styles.category}>
                <div>
                  <label className={styles.categoryTitle} htmlFor="cookie-analytics">Analytics</label>
                  <span className={styles.categoryCopy}>Google Analytics and Contentsquare help us understand aggregate usage, page interaction, and scrolling so we can improve the site.</span>
                </div>
                <input id="cookie-analytics" className={styles.switch} type="checkbox" checked={preferences.analytics} onChange={(event) => setPreferences((current) => ({ ...current, analytics: event.target.checked }))} />
              </div>
              <div className={styles.category}>
                <div>
                  <label className={styles.categoryTitle} htmlFor="cookie-marketing">Marketing</label>
                  <span className={styles.categoryCopy}>Google Ads and Meta Pixel measure whether ads led to a visit or form submission.</span>
                </div>
                <input id="cookie-marketing" className={styles.switch} type="checkbox" checked={preferences.marketing} onChange={(event) => setPreferences((current) => ({ ...current, marketing: event.target.checked }))} />
              </div>
            </div>
            <div className={`${styles.actions} ${styles.modalActions}`}>
              <button type="button" className={styles.buttonSecondary} onClick={rejectAll}>Reject non-essential</button>
              <button type="button" className={styles.button} onClick={() => commitPreferences(preferences)}>Save choices</button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
