import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getNavigationItems } from "@/lib/navigation";
import { getSiteSettings } from "@/lib/siteSettings";

export const revalidate = 120;
export const dynamic = "force-static";

export default async function NotFoundPage() {
  const [navItems, settings] = await Promise.all([getNavigationItems(), getSiteSettings()]);
  const iconUrl = settings.notFoundIconUrl;

  return (
    <main>
      <SiteHeader navItems={navItems} />
      <div
        className="container"
        style={{
          minHeight: "calc(100vh - var(--header-height) - 240px)",
          display: "grid",
          alignItems: "center",
          padding: "96px 0 120px"
        }}
      >
        <div style={{ display: "grid", gap: 20, justifyItems: "center", textAlign: "center" }}>
          <div style={{ color: "var(--accent-strong)" }}>
            {iconUrl ? (
              <img src={iconUrl} alt="404 page icon" style={{ width: 96, height: 96, objectFit: "contain" }} />
            ) : (
              <svg
                width="96"
                height="96"
                viewBox="0 0 96 96"
                role="img"
                aria-label="Compass illustration"
                style={{ display: "block" }}
              >
                <circle cx="48" cy="48" r="38" stroke="currentColor" strokeWidth="3" opacity="0.3" />
                <circle cx="48" cy="48" r="9" fill="currentColor" opacity="0.9" />
                <path
                  d="M66 28 52 52 28 66l14-24Z"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="currentColor"
                  opacity="0.9"
                />
              </svg>
            )}
          </div>
          <p style={{ margin: 0, color: "var(--muted)", letterSpacing: "0.16em", textTransform: "uppercase" }}>
            404 — Page not found
          </p>
          <h1
            style={{
              margin: 0,
              maxWidth: 560,
              fontFamily: "var(--font-secondary)",
              fontSize: "var(--font-size-display-sm)",
              fontWeight: 300,
              letterSpacing: 0,
              lineHeight: 0.95,
              textTransform: "none"
            }}
          >
            You&apos;ve wandered off the trail
          </h1>
          <p style={{ margin: "0 0 8px", color: "var(--muted)", maxWidth: 520 }}>
            The page you were looking for doesn&apos;t exist or has moved. Let&apos;s guide you back home.
          </p>
          <Link
            href="/"
            className="btn"
            style={{ paddingInline: 20, fontWeight: 600, letterSpacing: 0.01 }}
            aria-label="Return to the homepage"
          >
            Go back home
          </Link>
        </div>
      </div>
      <SiteFooter navItems={navItems} />
    </main>
  );
}
