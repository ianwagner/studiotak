import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { BlocksRenderer } from "@/components/sections/BlocksRenderer";
import { getNavigationItems } from "@/lib/navigation";
import { getPublishedPageBySlug } from "@/lib/pageContent";

export const revalidate = 120;
export const dynamic = "force-static";

export default async function HomePage() {
  const pageData = await getPublishedPageBySlug("/");
  const navItems = await getNavigationItems();
  const blocks = pageData?.blocks ?? [];
  const hasHeroFirst = blocks[0]?.type === "hero" || blocks[0]?.type === "thirds";
  const pagePaddingTop = hasHeroFirst ? 0 : 72;
  const pagePaddingBottom = hasHeroFirst ? 0 : 120;

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
    </main>
  );
}
