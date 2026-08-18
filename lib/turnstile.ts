const TURNSTILE_SCRIPT_ID = "studio-tak-turnstile";
const TURNSTILE_SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileWindow = Window & { turnstile?: unknown };

export function loadTurnstile(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if ((window as TurnstileWindow).turnstile) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existingScript = document.getElementById(TURNSTILE_SCRIPT_ID) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Turnstile script failed to load.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = TURNSTILE_SCRIPT_ID;
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Turnstile script failed to load."));
    document.head.append(script);
  });
}

export function getTurnstileLoadError(errorCode?: string | number): string {
  const code = String(errorCode ?? "");

  if (code.startsWith("1101")) return "The security check is temporarily unavailable. Please try again shortly.";
  if (code.startsWith("1102")) return "The security check is not authorized for this site. Our team has been notified.";
  if (code.startsWith("2001")) return "Your device clock appears to be incorrect. Please correct it and try again.";
  if (code.startsWith("2005")) return "The security check could not load. Please refresh and try again.";

  return "The security check could not load. Please refresh and try again.";
}
