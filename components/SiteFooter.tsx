import Link from "next/link";
import type { Route } from "next";
import type { NavigationItemRecord } from "@/lib/admin/navigation";
import { getNavigationItems } from "@/lib/navigation";

type SiteFooterProps = {
  navItems?: NavigationItemRecord[];
};

export async function SiteFooter({ navItems: providedNav }: SiteFooterProps) {
  const navItems = providedNav ?? (await getNavigationItems());
  const footerLinks = navItems.filter((item) => item.showInFooter);
  const footerChildren = footerLinks.filter((item) => item.parentId);
  const childrenByParent = footerChildren.reduce<Record<string, NavigationItemRecord[]>>((acc, item) => {
    if (!item.parentId) return acc;
    acc[item.parentId] = acc[item.parentId] ? [...acc[item.parentId], item] : [item];
    return acc;
  }, {});
  const footerParents = footerLinks.filter((item) => !item.parentId);
  const year = new Date().getFullYear();
  const footerSections = footerParents.reduce<Record<string, NavigationItemRecord[]>>((sections, item) => {
    const sectionName = item.footerSection?.trim() || "Links";
    sections[sectionName] = sections[sectionName] ? [...sections[sectionName], item] : [item];
    return sections;
  }, {});
  const sectionEntries = Object.entries(footerSections);

  return (
    <footer data-site-footer>
      <div className="container footer-shell">
        <div className="footer-brand">
          <span style={{ fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Studio Tak</span>
          <span style={{ color: "var(--muted)", fontSize: 14 }}>Design &amp; Build</span>
          <span style={{ color: "var(--muted)", fontSize: 13 }}>© {year} Studio Tak. All rights reserved.</span>
        </div>
        {sectionEntries.length ? (
          <div data-footer-sections>
            {sectionEntries.map(([sectionTitle, links]) => (
              <div key={sectionTitle} className="footer-section">
                <p className="footer-section-title">{sectionTitle}</p>
                <nav data-footer-nav aria-label={`${sectionTitle} links`}>
                  {links.map((item) => {
                    const children = childrenByParent[item.id] ?? [];
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
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </footer>
  );
}
