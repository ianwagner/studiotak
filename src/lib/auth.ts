const AUTH_COOKIE_NAME = "studiotak_auth";
const AUTH_COOKIE_VALUE = "granted";
const VALID_USERNAME = "admin";
const VALID_PASSWORD = "BETA865#";
const LOGIN_PATH = "/login";

function normalizeRedirectPath(target: string | null | undefined): string {
  if (!target) {
    return "/";
  }

  // Only allow relative paths within this site to avoid open redirects.
  if (!target.startsWith("/") || target.startsWith("//")) {
    return "/";
  }

  // Prevent redirect loops back to the login page or Next.js internals.
  if (target.startsWith(LOGIN_PATH) || target.startsWith("/_next")) {
    return "/";
  }

  return target;
}

export const authConfig = {
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_VALUE,
  VALID_USERNAME,
  VALID_PASSWORD,
  LOGIN_PATH,
};

export function sanitizeRedirectPath(target: string | null | undefined): string {
  return normalizeRedirectPath(target);
}
