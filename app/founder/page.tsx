import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getNavigationItems } from "@/lib/navigation";
import FounderContent from "./FounderContent";

export const revalidate = 120;
export const dynamic = "force-static";

const siteBase = process.env.NEXT_PUBLIC_SITE_URL ?? "https://studiotak.co";

export const metadata: Metadata = {
  title: "Ian Wagner — Founder, Studio Tak",
  description:
    "A note from Ian Wagner, founder of Studio Tak. Systems designer, team builder, and the person behind Campfire.",
  alternates: { canonical: new URL("/founder", siteBase).toString() },
  openGraph: {
    title: "Ian Wagner — Founder, Studio Tak",
    description:
      "A note from Ian Wagner, founder of Studio Tak. Systems designer, team builder, and the person behind Campfire.",
    url: new URL("/founder", siteBase).toString(),
    siteName: "Studio Tak",
    type: "profile",
    firstName: "Ian",
    lastName: "Wagner"
  },
  twitter: {
    card: "summary",
    title: "Ian Wagner — Founder, Studio Tak",
    description:
      "Designer turned systems builder. Founder of Studio Tak, focused on AI-assisted creative production and marketing technology."
  }
};

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Ian Wagner",
  jobTitle: "Founder",
  worksFor: {
    "@type": "Organization",
    name: "Studio Tak",
    url: siteBase
  },
  alumniOf: {
    "@type": "CollegeOrUniversity",
    name: "University of Denver"
  },
  url: new URL("/founder", siteBase).toString(),
  sameAs: [
    "https://linkedin.com/in/ianwa",
    "https://ianwagner.co",
    "https://futurepoetic.com"
  ]
};

export default async function FounderPage() {
  const navItems = await getNavigationItems();

  return (
    <>
      <SiteHeader navItems={navItems} />
      <main>
        <FounderContent />
      </main>
      <SiteFooter navItems={navItems} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
    </>
  );
}
