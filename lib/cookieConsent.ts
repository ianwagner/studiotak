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
    fbq?: MetaPixelFunction;
    _fbq?: MetaPixelFunction;
    gtag?: (...args: unknown[]) => void;
  }
}

export function hasMarketingConsent() {
  return typeof window !== "undefined" && window.__studioTakCookiePreferences?.marketing === true;
}

export function trackMetaEvent(eventName: string, parameters: Record<string, unknown> = {}) {
  if (!hasMarketingConsent() || typeof window.fbq !== "function") return;
  window.fbq("track", eventName, parameters);
}
