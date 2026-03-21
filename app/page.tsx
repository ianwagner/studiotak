import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { BlocksRenderer } from "@/components/sections/BlocksRenderer";
import { DevDataSourceBanner } from "@/components/DevDataSourceBanner";
import { getNavigationItems } from "@/lib/navigation";
import { getPublishedPageBySlugWithSource } from "@/lib/pageContent";

export const revalidate = 120;
export const dynamic = "force-static";

export default async function HomePage() {
  const { page: pageData, source } = await getPublishedPageBySlugWithSource("/");
  const navItems = await getNavigationItems();
  const blocks = pageData?.blocks ?? [];
  const hasHeroFirst = blocks[0]?.type === "hero" || blocks[0]?.type === "thirds";
  const pagePaddingTop = hasHeroFirst ? 0 : 72;
  const pagePaddingBottom = hasHeroFirst ? 0 : 120;

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
        {blocks.length ? <BlocksRenderer blocks={blocks} /> : null}
      </div>
      <SiteFooter navItems={navItems} />
      <DevDataSourceBanner
        source={source}
        blockSequence={blockSequence}
        blockCount={blocks.length}
        pageStatus={pageData?.status}
        updatedAt={pageData?.updatedAt}
      />
    </main>
  );
}
