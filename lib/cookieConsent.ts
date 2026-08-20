export type CookiePreferences = {
  analytics: boolean;
  marketing: boolean;
};

export const COOKIE_PREFERENCES_NAME = "st_cookie_preferences";
export const COOKIE_PREFERENCES_VERSION = "2026-08";
export const OPEN_COOKIE_PREFERENCES_EVENT = "studio-tak:open-cookie-preferences";

type MetaPixelFunction = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  loaded?: boolean;
  push?: MetaPixelFunction;
  queue?: unknown[][];
  version?: string;
};

declare global {
  interface Window {
    __studioTakCookiePreferences?: CookiePreferences;
    __studioTakGaConfiguredId?: string;
    __studioTakMetaPixelInitializedId?: string;
    dataLayer?: unknown[];
    _uxa?: unknown[][];
    fbq?: MetaPixelFunction;
    _fbq?: MetaPixelFunction;
    gtag?: (...args: unknown[]) => void;
  }
}

export function hasMarketingConsent() {
  return typeof window !== "undefined" && window.__studioTakCookiePreferences?.marketing === true;
}

export function createMetaEventId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `web_lead_${crypto.randomUUID()}`;
  }
  return `web_lead_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function trackMetaEvent(eventName: string, parameters: Record<string, unknown> = {}, eventId?: string) {
  if (!hasMarketingConsent() || typeof window.fbq !== "function") return;
  window.fbq("track", eventName, parameters, eventId ? { eventID: eventId } : undefined);
}
