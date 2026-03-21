import type { Metadata } from "next";
import { notFound, redirect, permanentRedirect } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { BlocksRenderer } from "@/components/sections/BlocksRenderer";
import { DevDataSourceBanner } from "@/components/DevDataSourceBanner";
import { getNavigationItems } from "@/lib/navigation";
import { getPublishedPageBySlug, getPublishedPageBySlugWithSource, getPublishedPages, normalizeSlugPath } from "@/lib/pageContent";

export const revalidate = 120;
export const dynamic = "force-static";

type PageParams = {
  params: { slug: string[] };
};

const slugToPath = (segments: string[]) => {
  const joined = `/${segments.join("/")}`;
  if (joined === "/") return joined;
  return joined.replace(/\/+$/, "");
};

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const slugPath = normalizeSlugPath(slugToPath(params.slug));
  const page = await getPublishedPageBySlug(slugPath);

  if (!page) return {};

  const siteBase = process.env.NEXT_PUBLIC_SITE_URL ?? "https://studiotak.co";
  const canonical =
    page.canonicalUrl?.trim() || new URL(slugPath === "/" ? "/" : slugPath, siteBase).toString();

  return {
    title: page.seoTitle || page.title,
    description: page.metaDescription,
    alternates: { canonical },
    robots: {
      index: !page.noindex,
      follow: !page.nofollow
    },
    openGraph: {
      title: page.ogTitle || page.seoTitle || page.title,
      description: page.ogDescription || page.metaDescription || undefined,
      url: canonical,
      images: page.socialImage?.url ? [{ url: page.socialImage.url, alt: page.socialImage.alt }] : undefined
    },
    twitter: {
      card: page.socialImage?.url ? "summary_large_image" : "summary",
      title: page.twitterTitle || page.ogTitle || page.seoTitle || page.title,
      description: page.twitterDescription || page.ogDescription || page.metaDescription || undefined,
      images: page.socialImage?.url ? [page.socialImage.url] : undefined
    }
  };
}

export default async function MarketingPage({ params }: PageParams) {
  const slugPath = normalizeSlugPath(slugToPath(params.slug));
  const { page, source } = await getPublishedPageBySlugWithSource(slugPath);

  if (!page) {
    const pages = await getPublishedPages();
    const redirectRule = pages
      .flatMap((p) => p.redirects ?? [])
      .find((rule) => normalizeSlugPath(rule.from) === slugPath && rule.to);

    if (redirectRule?.to) {
      if (redirectRule.type === "permanent") {
        permanentRedirect(redirectRule.to);
      } else {
        redirect(redirectRule.to);
      }
    }
    return notFound();
  }

  const matchingRedirect = (page.redirects ?? []).find(
    (rule) => normalizeSlugPath(rule.from) === slugPath && rule.to
  );

  if (matchingRedirect?.to) {
    if (matchingRedirect.type === "permanent") {
      permanentRedirect(matchingRedirect.to);
    } else {
      redirect(matchingRedirect.to);
    }
  }

  const jsonLd = (() => {
    if (!page.jsonLd) return null;
    try {
      return JSON.parse(page.jsonLd);
    } catch {
      return null;
    }
  })();
  const hasHeroFirst = page.blocks?.[0]?.type === "hero" || page.blocks?.[0]?.type === "thirds";
  const pagePaddingTop = hasHeroFirst ? 0 : 72;
  const pagePaddingBottom = hasHeroFirst ? 0 : 120;
  const navItems = await getNavigationItems();
  const blocks = page.blocks ?? [];
  const blockSequence = blocks.map((b) => b.type).join(" → ");

  return (
    <main>
      <SiteHeader navItems={navItems} />
      <div
        className="container"
        style={{
          padding: `${pagePaddingTop}px 0 ${pagePaddingBottom}px`,
          display: "grid",
          gap: 32
        }}
      >
        <BlocksRenderer blocks={blocks} />
        {jsonLd ? (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        ) : null}
      </div>
      <SiteFooter navItems={navItems} />
      <DevDataSourceBanner
        source={source}
        blockSequence={blockSequence}
        blockCount={blocks.length}
        pageStatus={page.status}
        updatedAt={page.updatedAt}
      />
    </main>
  );
}
