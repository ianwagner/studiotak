import { NextRequest, NextResponse } from "next/server";

/**
 * Redirect www → non-www to resolve "Duplicate without user-selected canonical"
 * flagged in Google Search Console.
 *
 * All canonical URLs point to https://studiotak.co (no www), so any request
 * arriving at www.studiotak.co gets a permanent redirect to studiotak.co.
 */
export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";

  if (host.startsWith("www.")) {
    const newUrl = new URL(request.url);
    newUrl.host = host.replace(/^www\./, "");
    return NextResponse.redirect(newUrl, 301);
  }

  return NextResponse.next();
}
