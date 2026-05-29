import Link from "next/link";
import type { Route } from "next";
import type { NavigationItemRecord } from "@/lib/admin/navigation";
import { getNavigationItems } from "@/lib/navigation";
import { getSiteSettings } from "@/lib/siteSettings";

type SiteFooterProps = {
  navItems?: NavigationItemRecord[];
};

const campfireAudienceFooterLinks: NavigationItemRecord[] = [
  {
    id: "footer-campfire-brands",
    label: "Brands",
    href: "/campfire/brands",
    order: 101,
    showInFooter: true,
    parentId: "nav-campfire"
  },
  {
    id: "footer-campfire-growth",
    label: "Growth Teams",
    href: "/campfire/growth",
    order: 102,
    showInFooter: true,
    parentId: "nav-campfire"
  },
  {
    id: "footer-campfire-agencies",
    label: "Agencies",
    href: "/campfire/agencies",
    order: 103,
    showInFooter: true,
    parentId: "nav-campfire"
  }
];

const isDuplicateCampfireDemoFooterLink = (item: NavigationItemRecord) =>
  !item.parentId && item.href === "/campfire/demo" && item.label.trim().toLowerCase() === "get a demo";

const isCampfireFooterParent = (item: NavigationItemRecord) =>
  !item.parentId && (item.href === "/campfire" || item.label.trim().toLowerCase() === "campfire");

const isCampfireLoginFooterLink = (item: NavigationItemRecord) =>
  item.label.trim().toLowerCase() === "log in" || item.href.includes("campfire.studiotak.co/login");

const getFooterChildren = (
  parent: NavigationItemRecord,
  childrenByParent: Record<string, NavigationItemRecord[]>
) => {
  const children = childrenByParent[parent.id] ?? [];
  if (!isCampfireFooterParent(parent)) return children;

  const visibleChildren = children.filter((child) => !isCampfireLoginFooterLink(child));
  const existingHrefs = new Set(visibleChildren.map((child) => child.href));
  const campfireChildren = campfireAudienceFooterLinks
    .filter((child) => !existingHrefs.has(child.href))
    .map((child) => ({ ...child, parentId: parent.id }));

  return [...visibleChildren, ...campfireChildren].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0) || a.label.localeCompare(b.label)
  );
};

export async function SiteFooter({ navItems: providedNav }: SiteFooterProps) {
  const [navItems, settings] = await Promise.all([
    providedNav ? Promise.resolve(providedNav) : getNavigationItems(),
    getSiteSettings()
  ]);
  const footerLogoUrl = settings.footerLogoUrl || settings.logoUrl;
  const footerLinks = navItems.filter((item) => item.showInFooter && !isDuplicateCampfireDemoFooterLink(item));
  const footerChildren = footerLinks.filter((item) => item.parentId);
  const childrenByParent = footerChildren.reduce<Record<string, NavigationItemRecord[]>>((acc, item) => {
    if (!item.parentId) return acc;
    acc[item.parentId] = acc[item.parentId] ? [...acc[item.parentId], item] : [item];
    return acc;
  }, {});
  const footerParents = footerLinks.filter((item) => !item.parentId);
  const year = 2026;
  const footerSections = footerParents.reduce<Record<string, NavigationItemRecord[]>>((sections, item) => {
    const sectionName = item.footerSection?.trim() || "Links";
    sections[sectionName] = sections[sectionName] ? [...sections[sectionName], item] : [item];
    return sections;
  }, {});
  const sectionEntries = Object.entries(footerSections);

  return (
    <footer data-site-footer>
      <div className="footer-shell" data-keep-centered>
        <div className="footer-top">
          <div className="footer-brand">
            {footerLogoUrl ? (
              <img
                src={footerLogoUrl}
                alt="Studio Tak footer logo"
                className="footer-logo"
              />
            ) : (
              <span className="footer-wordmark">Studio Tak</span>
            )}
            <span className="footer-tagline">Design &amp; Build</span>
          </div>

          {footerParents.length ? (
            <nav data-footer-nav aria-label="Footer links">
              {footerParents.map((item) => {
                const children = getFooterChildren(item, childrenByParent);
                return (
                  <div key={item.id} className="footer-parent-block">
                    <span className="footer-parent-label">{item.label}</span>
                    {children.length ? (
                      <div className="footer-children">
                        {children.map((child) => (
                          <Link
                            key={child.id}
                            href={child.href as Route}
                            target={child.isExternal ? "_blank" : undefined}
                            rel={child.isExternal ? "noreferrer noopener" : undefined}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </nav>
          ) : null}
        </div>

        <div className="footer-bottom">
          <div className="footer-legal">
            <span>© {year} Studio Tak. All rights reserved.</span>
            <Link href={"/terms-of-service" as Route} className="footer-legal-link">Terms of Service</Link>
            <Link href={"/privacy-policy" as Route} className="footer-legal-link">Privacy Policy</Link>
          </div>
          <div className="footer-cta">
            <Link href={"/campfire/demo" as Route} className="footer-cta-link">
              Get a demo of Campfire
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
