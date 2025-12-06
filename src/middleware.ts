import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { authConfig, sanitizeRedirectPath } from "@/lib/auth";

const PUBLIC_FILE = /\.[^/]+$/;

function isBypassedPath(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/sitemap") ||
    pathname.startsWith("/manifest") ||
    pathname.startsWith("/.well-known") ||
    PUBLIC_FILE.test(pathname)
  );
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isBypassedPath(pathname)) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-studiotak-pathname", pathname);
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  const isLoginRoute = pathname === authConfig.LOGIN_PATH;
  const isAuthed =
    request.cookies.get(authConfig.AUTH_COOKIE_NAME)?.value === authConfig.AUTH_COOKIE_VALUE;

  if (isLoginRoute) {
    if (isAuthed) {
      const safeRedirect = sanitizeRedirectPath(request.nextUrl.searchParams.get("redirect") ?? undefined);
      const redirectUrl = new URL(safeRedirect, request.nextUrl.origin);
      return NextResponse.redirect(redirectUrl);
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-studiotak-pathname", pathname);
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  if (isAuthed) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-studiotak-pathname", pathname);
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = authConfig.LOGIN_PATH;
  redirectUrl.searchParams.set("redirect", `${pathname}${search}`);

  return NextResponse.redirect(redirectUrl);
}
