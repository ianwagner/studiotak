import type { Metadata } from "next";
import { PartnerCard } from "@/components/PartnerCard";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getGhostPosts } from "@/lib/ghost";
import { getNavigationItems } from "@/lib/navigation";
import { getCanonicalUrl, getSiteUrl } from "@/lib/siteUrl";

export const revalidate = 120;
export const dynamic = "force-static";

const TITLE = "Partners | Studio Tak";
const DESCRIPTION =
  "Meet the technology and service partners Studio Tak trusts to help brands build stronger, more connected growth systems.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: getCanonicalUrl("/partners") },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: getCanonicalUrl("/partners"),
    siteName: "Studio Tak",
    type: "website"
  },
  twitter: {
    card: "summary",
    title: TITLE,
    description: DESCRIPTION
  }
};

export default async function PartnersPage() {
  const [navItems, partners] = await Promise.all([
    getNavigationItems(),
    getGhostPosts("partners")
  ]);

  const siteBase = getSiteUrl();
  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Studio Tak Partners",
    description: DESCRIPTION,
    url: new URL("/partners", siteBase).toString(),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: partners.map((partner, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: partner.title,
        url: new URL(`/partners/${partner.slug}`, siteBase).toString()
      }))
    }
  };

  return (
    <>
      <SiteHeader navItems={navItems} />
      <main id="main-content" tabIndex={-1}>
        <section className="partners-index" aria-labelledby="partners-title">
          <div className="container partners-index-shell" data-keep-centered>
            <header className="partners-index-hero">
              <p className="partners-eyebrow">Studio Tak network</p>
              <h1 id="partners-title">Better work, built together.</h1>
              <p>
                Meet the technology and service partners we trust to help ambitious teams connect creative,
                content, and growth.
              </p>
            </header>

            {partners.length ? (
              <div className="partners-grid" aria-label="Studio Tak partners">
                {partners.map((partner) => (
                  <PartnerCard key={partner.id} post={partner} />
                ))}
              </div>
            ) : (
              <div className="partners-empty" role="status">
                <h2>Partner profiles are on the way.</h2>
                <p>We’re preparing introductions to the teams we love building with.</p>
              </div>
            )}
          </div>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
          />
        </section>
      </main>
      <SiteFooter navItems={navItems} showTopBorder />
    </>
  );
}

