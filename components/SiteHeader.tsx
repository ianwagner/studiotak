import Link from "next/link";
import type { NavigationItemRecord } from "@/lib/admin/navigation";
import { getSiteSettings } from "@/lib/siteSettings";
import { getNavigationItems } from "@/lib/navigation";
import { HeaderNavigation } from "./HeaderNavigation";

type SiteHeaderProps = {
  navItems?: NavigationItemRecord[];
};

export async function SiteHeader({ navItems: providedNav }: SiteHeaderProps = {}) {
  const settings = await getSiteSettings();
  const logoUrl = settings.logoUrl;
  const navItems = providedNav ?? (await getNavigationItems());

  return (
    <header
      data-site-header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 5,
        background: "var(--header-bg)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--header-border)",
        boxShadow: "var(--header-shadow)",
        padding: "18px 0"
      }}
    >
      <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link
          href="/"
          style={{
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            display: "inline-flex",
            alignItems: "center"
          }}
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Studio Tak logo"
              style={{ height: 40, width: "auto", display: "block", objectFit: "contain" }}
            />
          ) : (
            <span>Studio Tak</span>
          )}
        </Link>
        <HeaderNavigation items={navItems} />
      </div>
    </header>
  );
}
