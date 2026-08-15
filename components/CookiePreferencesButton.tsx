"use client";

import { OPEN_COOKIE_PREFERENCES_EVENT } from "@/lib/cookieConsent";

export function CookiePreferencesButton() {
  return (
    <button
      type="button"
      className="footer-legal-link footer-cookie-preferences"
      onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_PREFERENCES_EVENT))}
    >
      Cookie Preferences
    </button>
  );
}
