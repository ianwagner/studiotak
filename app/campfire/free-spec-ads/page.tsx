import type { Metadata } from "next";
import { SpecAdsCampaign } from "@/components/campaigns/SpecAdsCampaign";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getNavigationItems } from "@/lib/navigation";
import { getPublishedPageBySlug } from "@/lib/pageContent";
import type { LogosBlock } from "@/lib/admin/pages";

export const metadata: Metadata = {
  title: "Claim 5 Free Spec Ads | Campfire by Studio Tak",
  description:
    "Tell us what you want to feature and Campfire will create five free spec ads for selected brands."
};

export default async function FreeSpecAdsPage() {
  const [navItems, campfirePage] = await Promise.all([getNavigationItems(), getPublishedPageBySlug("/campfire")]);
  const logoBlock = campfirePage?.blocks.find((block): block is LogosBlock => block.type === "logos");

  return (
    <>
      <SiteHeader navItems={navItems} />
      <SpecAdsCampaign logoBlock={logoBlock} />
      <SiteFooter navItems={navItems} />
    </>
  );
}
