import type { AnimationPresetName } from "@/components/sections/animationPresets";
import type { GhostPost } from "@/lib/ghost";

export type PageStatus = "draft" | "published";
export type BlockBackgroundStyle = "blank" | "glow";

export type BlockMedia = {
  url: string;
  type?: "image" | "video";
  alt?: string;
  width?: number;
  height?: number;
};

export type BlockSection = { title: string; body: string };

export type DividerBlock = {
  id: string;
  type: "divider";
  adminLabel?: string;
  anchor?: string;
  width?: "full" | "page";
  enableDarkModeOnScroll?: boolean;
};

export type HeroBlock = {
  id: string;
  type: "hero";
  adminLabel?: string;
  anchor?: string;
  eyebrow?: string;
  title: string;
  italicTitleText?: string;
  subtitle?: string;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  media?: BlockMedia;
  background?: BlockMedia;
  alignment: "image_left" | "image_right" | "centered";
  overlayStyle?: "full" | "gradient";
  copyColorBlockEnabled?: boolean;
  copyColorBlockColor?: string;
  copyColorBlockAlignment?: "left" | "centered";
  copyColorBlockTextColor?: "black" | "white";
  enableDarkModeOnScroll?: boolean;
  mode?: "static" | "dynamic";
  mediaIndustryTag?: string;
  mediaTypeTag?: string;
  mediaLimit?: number;
};

export type ThirdsBlock = Omit<HeroBlock, "type"> & {
  type: "thirds";
  layout?: "left" | "centered";
};

export type StoryBlock = {
  id: string;
  type: "story";
  adminLabel?: string;
  anchor?: string;
  heading: string;
  body: string;
  media?: BlockMedia;
  variant: "single_column" | "two_column" | "split_with_quote";
  sections?: BlockSection[];
  enableDarkModeOnScroll?: boolean;
};

export type SplitBlock = {
  id: string;
  type: "split";
  adminLabel?: string;
  anchor?: string;
  eyebrow?: string;
  heading: string;
  body?: string;
  media?: BlockMedia;
  mediaSide?: "left" | "right";
  ctaLabel?: string;
  ctaHref?: string;
  enableDarkModeOnScroll?: boolean;
};

export type AnimatedHeadlineStyle = "fade_by_word" | "slide_by_letter" | "typewriter" | "scramble";
export type AnimatedHeadlineMode = "viewport" | "scroll";

export type AnimatedHeadlineBlock = {
  id: string;
  type: "animated_headline";
  adminLabel?: string;
  anchor?: string;
  headline: string;
  subtext?: string;
  animationStyle: AnimatedHeadlineStyle;
  animationMode: AnimatedHeadlineMode;
  freezeOnScroll?: boolean;
  enableDarkModeOnScroll?: boolean;
};

export type FeatureItem = {
  title: string;
  body: string;
  badge?: string;
  href?: string;
  icon?: BlockMedia;
  industry?: string;
  type?: string;
  componentId?: string;
  mediaFit?: "cover" | "contain";
};

export type FeaturesBlock = {
  id: string;
  type: "features";
  adminLabel?: string;
  anchor?: string;
  eyebrow?: string;
  heading: string;
  body?: string;
  columns?: number;
  items: FeatureItem[];
  variant?: "default" | "stacked";
  enableDarkModeOnScroll?: boolean;
};

export type FeatureSpotlightBlock = {
  id: string;
  type: "feature_spotlight";
  adminLabel?: string;
  anchor?: string;
  eyebrow?: string;
  heading: string;
  body?: string;
  items: FeatureItem[];
  enableDarkModeOnScroll?: boolean;
};

export type ScrollGalleryBlock = {
  id: string;
  type: "scroll_gallery";
  adminLabel?: string;
  anchor?: string;
  eyebrow?: string;
  heading: string;
  body?: string;
  items: FeatureItem[];
  enableDarkModeOnScroll?: boolean;
};

export type LogosBlock = {
  id: string;
  type: "logos";
  adminLabel?: string;
  anchor?: string;
  eyebrow?: string;
  heading?: string;
  limit?: number;
  enableDarkModeOnScroll?: boolean;
};

export type ShowcaseBlock = {
  id: string;
  type: "showcase";
  adminLabel?: string;
  anchor?: string;
  eyebrow?: string;
  heading?: string;
  subhead?: string;
  typeFilter: string;
  industryFilter?: string;
  limit?: number;
  featuredOnly?: boolean;
  animationPreset?: AnimationPresetName;
  enableDarkModeOnScroll?: boolean;
};

export type ContactBlock = {
  id: string;
  type: "contact";
  adminLabel?: string;
  eyebrow?: string;
  heading: string;
  body?: string;
  anchor?: string;
  media?: BlockMedia;
  formId?: string;
  portalId?: string;
  region?: string;
  formScriptSrc?: string;
  enableDarkModeOnScroll?: boolean;
};

export type ArticleFeaturedBlock = {
  id: string;
  type: "article_featured";
  adminLabel?: string;
  anchor?: string;
  tagFilter?: string;
  posts?: GhostPost[];
  enableDarkModeOnScroll?: boolean;
};

export type ArticleGridBlock = {
  id: string;
  type: "article_grid";
  adminLabel?: string;
  anchor?: string;
  tagFilter?: string;
  offset?: number;
  limit?: number;
  posts?: GhostPost[];
  enableDarkModeOnScroll?: boolean;
};

export type ProductDemoAd = {
  imageUrl: string;
  brandName: string;
  headline: string;
  overlayText?: string;
};

export type ProductDemoCopyCard = {
  primary: string;
  headline: string;
  description: string;
};

export type ProductDemoBlock = {
  id: string;
  type: "product_demo";
  adminLabel?: string;
  anchor?: string;
  eyebrow?: string;
  heading?: string;
  body?: string;
  demoId: "ad_review";
  typeFilter?: string;
  industryFilter?: string;
  featuredOnly?: boolean;
  exampleData?: {
    index?: number;
    version?: string;
    status?: string;
    portraitAd?: ProductDemoAd;
    squareAd?: ProductDemoAd;
    copy?: ProductDemoCopyCard;
  };
  enableDarkModeOnScroll?: boolean;
};

export type AdFrameworkItem = {
  label: string;
  title: string;
  description?: string;
  examples?: string[];
};

export type AdFrameworkBlock = {
  id: string;
  type: "ad_framework";
  adminLabel?: string;
  anchor?: string;
  eyebrow?: string;
  heading?: string;
  body?: string;
  principles?: string[];
  items: AdFrameworkItem[];
  enableDarkModeOnScroll?: boolean;
};

export type SlackIntegrationBlock = {
  id: string;
  type: "slack_integration";
  adminLabel?: string;
  anchor?: string;
  eyebrow?: string;
  heading: string;
  body: string;
  enableDarkModeOnScroll?: boolean;
};

export type StatItem = {
  value: string;
  label: string;
  prefix?: string;
  suffix?: string;
};

export type StatsBlock = {
  id: string;
  type: "stats";
  adminLabel?: string;
  anchor?: string;
  eyebrow?: string;
  heading?: string;
  body?: string;
  ctaLabel?: string;
  ctaHref?: string;
  items: StatItem[];
  variant?: "default" | "card";
  enableDarkModeOnScroll?: boolean;
};

export type ComparisonColumn = {
  heading: string;
  items: string[];
  highlighted?: boolean;
  icon?: string;
};

export type ComparisonTableRow = {
  feature: string;
  label?: string;
  highlighted: string;
  other: string;
};

export type ComparisonTableFooter = {
  feature: string;
  highlighted: string;
  other: string;
};

export type ComparisonBlock = {
  id: string;
  type: "comparison";
  adminLabel?: string;
  anchor?: string;
  eyebrow?: string;
  heading?: string;
  body?: string;
  variant?: "feature_table";
  tableHeaders?: {
    feature?: string;
    highlighted?: string;
    other?: string;
  };
  columns: [ComparisonColumn, ComparisonColumn];
  rows?: ComparisonTableRow[];
  footer?: ComparisonTableFooter;
  enableDarkModeOnScroll?: boolean;
};

export type BlockRecord = (
  | DividerBlock
  | HeroBlock
  | ThirdsBlock
  | StoryBlock
  | SplitBlock
  | FeaturesBlock
  | FeatureSpotlightBlock
  | AnimatedHeadlineBlock
  | ScrollGalleryBlock
  | ShowcaseBlock
  | LogosBlock
  | ContactBlock
  | ArticleFeaturedBlock
  | ArticleGridBlock
  | ProductDemoBlock
  | AdFrameworkBlock
  | SlackIntegrationBlock
  | StatsBlock
  | ComparisonBlock
) & {
  backgroundStyle?: BlockBackgroundStyle;
};

export type RedirectRule = {
  from: string;
  to: string;
  type?: "permanent" | "temporary";
};

export type PageRecord = {
  id: string;
  slug: string;
  title: string;
  status: PageStatus;
  blocks: BlockRecord[];
  seoTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  noindex?: boolean;
  nofollow?: boolean;
  ogTitle?: string;
  ogDescription?: string;
  socialImage?: BlockMedia;
  twitterTitle?: string;
  twitterDescription?: string;
  jsonLd?: string;
  sitemapExclude?: boolean;
  focusKeyword?: string;
  internalLinks?: string[];
  redirects?: RedirectRule[];
  updatedAt?: string;
};


export const seedPages: PageRecord[] = [
  {
    id: "campfire-agencies",
    slug: "/campfire/agencies",
    title: "Campfire for Agencies",
    status: "published",
    seoTitle: "Campfire for Agencies \u2014 Bespoke Ad Creative at Scale",
    metaDescription: "Your clients get bespoke ads and a great experience. You get production visibility, brand management, and the tools to run creative at scale.",
    nofollow: false,
    noindex: false,
    sitemapExclude: false,
    focusKeyword: "meta ad creative agency",
    ogTitle: "Campfire for Agencies \u2014 Creative Production at Scale",
    ogDescription: "Manage brands, track production, and give your clients a frictionless review experience. Bespoke Meta ad creative, built for agency workflows.",
    blocks: [
      {
        id: "cfa-hero",
        type: "hero",
        eyebrow: "Campfire / For Agency Partners",
        title: "Your clients get great ads. You get real visibility.",
        subtitle: "Bespoke Meta ad creative, a frictionless client experience, and the production tools to manage it all \u2014 across every brand in your portfolio.",
        primaryCtaLabel: "Partner with us",
        primaryCtaHref: "#contact",
        secondaryCtaLabel: "See what you get",
        secondaryCtaHref: "#agency-tools",
        alignment: "centered",
        mode: "dynamic",
        mediaTypeTag: "Example",
      },
      {
        id: "cfa-headline",
        type: "animated_headline",
        headline: "Scale creative without scaling chaos",
        subtext: "Whether you're managing three brands or thirty, Campfire keeps production organized, tracked, and on schedule.",
        animationStyle: "fade_by_word",
        animationMode: "scroll",
        freezeOnScroll: true,
        enableDarkModeOnScroll: true,
      },
      {
        id: "cfa-client-experience",
        type: "story",
        heading: "What your clients see",
        body: "Your clients get a simple, frictionless experience \u2014 and because you're on the platform, you can see exactly what they see.",
        variant: "two_column",
        sections: [
          {
            title: "One-link review",
            body: "Clients review and approve ads from a single shareable link \u2014 no account needed. Ads and ad copy show up side by side, with approve/reject/edit controls on every piece.",
          },
          {
            title: "Client dashboard",
            body: "Approved ads, status at a glance, and download links in one place. A gallery view makes it easy for clients to share creative with their own stakeholders.",
          },
          {
            title: "Slack notifications",
            body: "Clients get notified right in Slack when ads are ready for review or approvals come through \u2014 in the channels they're already using.",
          },
          {
            title: "Built-in support",
            body: "Clients can raise questions or revision requests directly inside Campfire, tied to the ads they're about. No email chains, no lost context.",
          },
        ],
      },
      {
        id: "cfa-ad-review-demo",
        type: "product_demo",
        eyebrow: "See it in action",
        heading: "One link. Every ad. Total control.",
        body: "This is what reviewing ads in Campfire actually looks like — creative and copy side by side, with one-click approval. No logins, no PDFs, no email threads.",
        demoId: "ad_review",
        typeFilter: "product_demo",
        exampleData: {
          index: 1,
          version: "V2",
          status: "pending",
          portraitAd: {
            imageUrl:
              "https://firebasestorage.googleapis.com/v0/b/studio-tak.firebasestorage.app/o/block-media%2F1773997308699-TAST_MARCH-77BA_46_9x16.webp?alt=media&token=a338484a-e11f-4d60-bbc4-862524a43d05",
            brandName: "TAST",
            headline: "NEW COLLECTION",
          },
          squareAd: {
            imageUrl:
              "https://firebasestorage.googleapis.com/v0/b/studio-tak.firebasestorage.app/o/block-media%2F1773997311425-TAST_MARCH-77BA_46_1x1.webp?alt=media&token=4329171c-3b0d-4771-b110-d9441644edbe",
            brandName: "TAST",
            headline: "NEW COLLECTION",
          },
          copy: {
            primary:
              "Made for the moments that matter. New styles, crafted with intention.",
            headline: "SPRING EDIT",
            description: "Designed to Stand Out",
          },
        },
      },
      {
        id: "cfa-agency-tools",
        type: "features",
        anchor: "agency-tools",
        eyebrow: "Your toolkit",
        heading: "Built for how agencies actually work",
        body: "Campfire isn't repurposed project management software. It's designed specifically for teams producing ad creative at volume.",
        columns: 2,
        items: [
          {
            title: "Production workspace",
            body: "See every ad's status and timeline across all your brands. Filter by brand, month, review status, or any combination. Share a specific view with a colleague in one click.",
            badge: "Visibility",
          },
          {
            title: "Brand management",
            body: "Each brand gets a dedicated profile: logos, products, tone of voice, contract terms, and internal notes. When anyone picks up a new brief, everything they need is in one place.",
            badge: "Organization",
          },
          {
            title: "Integrations",
            body: "Campfire connects to your existing tools \u2014 trafficking systems, DAMs, and other production tools \u2014 so it fits into how you already work.",
            badge: "Your stack",
          },
          {
            title: "Scoped permissions",
            body: "You only see what's relevant to your portfolio. Each team member gets the right level of access for their role \u2014 from read-only visibility to full production management.",
            badge: "Access control",
          },
        ],
      },
      {
        id: "cfa-comparison",
        type: "comparison",
        eyebrow: "The difference",
        heading: "Stop stitching tools together",
        body: "Most agencies cobble together spreadsheets, Drive folders, and Slack threads to manage creative production. Campfire replaces all of it.",
        columns: [
          {
            heading: "Without Campfire",
            items: [
              "Status updates via email and Slack",
              "Creative shared through Drive links",
              "Feedback scattered across threads",
              "Manual reporting in spreadsheets",
              "Client onboarding takes days",
              "Brand assets live in shared folders",
            ],
          },
          {
            heading: "With Campfire",
            highlighted: true,
            items: [
              "Real-time production dashboard",
              "One-link review for every ad",
              "Feedback tied to the creative it\u2019s about",
              "Automated reporting and exports",
              "Clients are in within minutes",
              "Brand profiles with everything in one place",
            ],
          },
        ],
      },
      {
        id: "cfa-split-scale",
        type: "split",
        eyebrow: "At scale",
        heading: "Everything lives together",
        body: "Ads, copy, feedback, status, and integrations \u2014 all in one place. No more stitching together spreadsheets, Drive folders, and Slack threads. Whether you're producing five ads or fifty, Campfire keeps production organized.",
        mediaSide: "left",
        ctaLabel: "See it in action",
        ctaHref: "#contact",
      },
      {
        id: "cfa-stats",
        type: "stats",
        eyebrow: "By the numbers",
        heading: "Capacity your clients can count on",
        variant: "card",
        items: [
          { value: "80", suffix: "+", label: "brands managed in parallel \u2014 capacity that scales with your roster" },
          { value: "5,900", suffix: "+", label: "ads in 90 days \u2014 a creative engine that won't bottleneck your pipeline" },
          { value: "2", suffix: "x", label: "the Meta average click-through rate \u2014 performance you can report to your clients" },
          { prefix: "Nearly ", value: "1 in 5", label: "ads delivers a 4x+ return \u2014 consistent quality across every account" },
        ],
      },
      {
        id: "cfa-why",
        type: "scroll_gallery",
        eyebrow: "Why Campfire for agencies",
        heading: "The creative production partner your portfolio needs",
        body: "Bespoke ad creative your clients will love, with the operational depth you need to manage it.",
        items: [
          {
            title: "Your clients get a great experience",
            body: "One-link review, real-time updates, zero onboarding friction. They see the work, not the process.",
            badge: "Client experience",
          },
          {
            title: "You get real visibility",
            body: "Production boards and brand management \u2014 purpose-built for high-volume creative work. No more asking for status updates.",
            badge: "Visibility",
          },
          {
            title: "It scales with your portfolio",
            body: "Three brands or thirty \u2014 Campfire keeps production organized, tracked, and on schedule without adding overhead.",
            badge: "Scale",
          },
          {
            title: "Bespoke creative, always",
            body: "Every ad is made for each brand specifically. Human-led, Meta-optimized, performance-focused. No templates, no AI slop.",
            badge: "Quality",
          },
        ],
      },
      {
        id: "cfa-showcase",
        type: "showcase",
        typeFilter: "Example",
        limit: 8,
        featuredOnly: true,
        animationPreset: "fan",
      },
      {
        id: "cfa-contact",
        type: "contact",
        eyebrow: "Let's talk",
        heading: "See how Campfire fits your agency",
        body: "Tell us about your brands, your creative volume, and how your team works today. We'll show you how Campfire can fit into your workflow.",
        anchor: "contact",
        formId: "bb99355b-ad00-407a-81e7-882535a3c4be",
        portalId: "244262601",
        region: "na2",
        formScriptSrc: "https://js-na2.hsforms.net/forms/embed/244262601.js",
      },
    ],
  },
  {
    id: "campfire-brands",
    slug: "/campfire/brands",
    title: "Campfire for Brands",
    status: "published",
    seoTitle: "Campfire for Brands \u2014 Bespoke Meta Ad Creative, Made for You",
    metaDescription: "Review and approve bespoke Meta ad creative from a single link. Your dashboard, your ads, your brand \u2014 all in one place. Pay per ad, no subscriptions.",
    nofollow: false,
    noindex: false,
    sitemapExclude: false,
    focusKeyword: "meta ad creative for brands",
    ogTitle: "Campfire for Brands \u2014 Your Ads, Your Way",
    ogDescription: "Bespoke Meta ad creative with a frictionless review experience. One link, real-time updates, and a dashboard built for your brand.",
    blocks: [
      {
        id: "cfb-hero",
        type: "hero",
        eyebrow: "Campfire / For Brands",
        title: "Your ads, reviewed and delivered \u2014 without the back-and-forth",
        subtitle: "Campfire is where you review ads, approve creative, and access your delivered work \u2014 all from one place. No email chains, no lost notes.",
        primaryCtaLabel: "Get started",
        primaryCtaHref: "#contact",
        secondaryCtaLabel: "See how it works",
        secondaryCtaHref: "#review",
        alignment: "centered",
        mode: "dynamic",
        mediaTypeTag: "Example",
      },
      {
        id: "cfb-headline",
        type: "animated_headline",
        headline: "One link. Your ads. Done.",
        subtext: "No account to create, no app to install. Click, review, and respond. It's that simple.",
        animationStyle: "fade_by_word",
        animationMode: "scroll",
        freezeOnScroll: true,
        enableDarkModeOnScroll: true,
      },
      {
        id: "cfb-review",
        type: "story",
        anchor: "review",
        heading: "Reviewing your ads",
        body: "When your creative is ready, you get a single link. Click it, enter a password, and you're in.",
        variant: "two_column",
        sections: [
          {
            title: "Ads and copy, side by side",
            body: "See your visuals alongside the ad copy so you always know what the messaging says. Approve, reject, or request edits on each piece \u2014 feedback flows back to us in real time.",
          },
          {
            title: "Progress tracks itself",
            body: "You can always see where things stand without having to ask. No checking in, no status meetings \u2014 just the current state of your work with us.",
          },
          {
            title: "Your dashboard",
            body: "Approved ads ready to use, status at a glance, and quick download links. A gallery view makes it easy to share creative with your own team or stakeholders.",
          },
          {
            title: "Raise a question anytime",
            body: "A note about an ad, a revision request, a question for our team \u2014 raise it directly inside Campfire. It stays connected to the ad, so nothing gets lost.",
          },
        ],
      },
      {
        id: "cfb-ad-review-demo",
        type: "product_demo",
        eyebrow: "See it in action",
        heading: "One link. Every ad. Total control.",
        body: "This is what reviewing ads in Campfire actually looks like — creative and copy side by side, with one-click approval. No logins, no PDFs, no email threads.",
        demoId: "ad_review",
        typeFilter: "product_demo",
        exampleData: {
          index: 1,
          version: "V2",
          status: "pending",
          portraitAd: {
            imageUrl:
              "https://firebasestorage.googleapis.com/v0/b/studio-tak.firebasestorage.app/o/block-media%2F1773997308699-TAST_MARCH-77BA_46_9x16.webp?alt=media&token=a338484a-e11f-4d60-bbc4-862524a43d05",
            brandName: "TAST",
            headline: "NEW COLLECTION",
          },
          squareAd: {
            imageUrl:
              "https://firebasestorage.googleapis.com/v0/b/studio-tak.firebasestorage.app/o/block-media%2F1773997311425-TAST_MARCH-77BA_46_1x1.webp?alt=media&token=4329171c-3b0d-4771-b110-d9441644edbe",
            brandName: "TAST",
            headline: "NEW COLLECTION",
          },
          copy: {
            primary:
              "Made for the moments that matter. New styles, crafted with intention.",
            headline: "SPRING EDIT",
            description: "Designed to Stand Out",
          },
        },
      },
      {
        id: "cfb-platform-features",
        type: "features",
        eyebrow: "The experience",
        heading: "Everything stays connected",
        body: "From the brief to the final ad, nothing falls through the cracks. Campfire is built to make working with your creative team feel effortless.",
        columns: 3,
        items: [
          {
            title: "Slack notifications",
            body: "When ads are ready for review or approvals come through, you get notified right in Slack \u2014 in the channels your team already uses.",
            badge: "Stay in the loop",
          },
          {
            title: "Reporting & exports",
            body: "See your ads at a glance \u2014 aspect ratio coverage and status breakdowns. Export everything to CSV for your own reporting.",
            badge: "Data",
          },
          {
            title: "Always up to date",
            body: "Everything syncs live. When new ads are uploaded or a status changes, you see it immediately. No refreshing, no waiting.",
            badge: "Real-time",
          },
        ],
      },
      {
        id: "cfb-spotlight",
        type: "feature_spotlight",
        eyebrow: "Your brand, your way",
        heading: "Everything is built around you",
        body: "Campfire isn\u2019t a self-serve tool. It\u2019s a creative partner that learns your brand and delivers work that feels like it came from your own team.",
        items: [
          {
            title: "Dedicated brand profile",
            body: "Your logos, tone of voice, product shots, brand guidelines, and past creative \u2014 all stored in one place. Every designer who touches your account starts from context, not a blank page.",
            badge: "Brand",
          },
          {
            title: "Direct line to your team",
            body: "Questions, revision requests, and creative direction \u2014 all inside Campfire, tied to the ad. No middlemen, no lost context.",
            badge: "Communication",
          },
          {
            title: "Gallery-ready downloads",
            body: "Every approved ad is sized for every Meta placement. Download individually or in bulk \u2014 ready to drop straight into Ads Manager.",
            badge: "Delivery",
          },
        ],
      },
      {
        id: "cfb-split-bespoke",
        type: "split",
        eyebrow: "The creative",
        heading: "Bespoke ads, not templates",
        body: "Every ad is made for your brand. No stock imagery, no cookie-cutter layouts, no AI slop. High volume, still intentional. Human designers who understand Meta's ad ecosystem \u2014 what hooks, what converts, what scales.",
        mediaSide: "right",
        ctaLabel: "See how it works",
        ctaHref: "#how-it-works",
      },
      {
        id: "cfb-stats",
        type: "stats",
        eyebrow: "Proof across categories",
        heading: "Breadth and consistency, not one-off wins",
        variant: "default",
        items: [
          { value: "80", suffix: "+", label: "brands across every major category \u2014 you're not our first in your space" },
          { value: "2", suffix: "x", label: "the Meta average click-through rate \u2014 your ads earn the scroll, not just fill the feed" },
          { prefix: "Nearly ", value: "1 in 5", label: "ads delivers a 4x+ return \u2014 work that pays for itself" },
          { value: "5,900", suffix: "+", label: "ads in 90 days \u2014 built to keep your feed fresh, never fatigued" },
        ],
      },
      {
        id: "cfb-why",
        type: "scroll_gallery",
        eyebrow: "Why Campfire",
        heading: "Built for brands scaling Meta ads",
        body: "You've outgrown Canva but you're not ready for a $5K/month agency retainer. Campfire fills that gap.",
        items: [
          {
            title: "Pay per ad, no gotchas",
            body: "One ad, one price. No subscriptions, no retainers, no lock-in. Scale up or down whenever you need to.",
            badge: "Simple pricing",
          },
          {
            title: "Human-led, Meta-optimized",
            body: "Real designers who understand Meta's ad ecosystem. Creative decisions informed by what actually performs, made by people with taste.",
            badge: "Performance",
          },
          {
            title: "Zero friction",
            body: "One link to review. Live updates. Slack notifications. Everything in one place. Working with us should feel easy \u2014 because it is.",
            badge: "Effortless",
          },
          {
            title: "Performance is the point",
            body: "We care about whether the ad works, not just how it looks. Beautiful creative that actually converts.",
            badge: "Results",
          },
        ],
      },
      {
        id: "cfb-showcase",
        type: "showcase",
        typeFilter: "Example",
        limit: 8,
        featuredOnly: true,
        animationPreset: "fan",
      },
      {
        id: "cfb-contact",
        type: "contact",
        eyebrow: "Let's talk",
        heading: "Tell us about your brand",
        body: "Share a bit about your business, your Meta ad goals, and the kind of creative you're looking for. We'll follow up with a plan \u2014 no pitch deck, no pressure.",
        anchor: "contact",
        formId: "bb99355b-ad00-407a-81e7-882535a3c4be",
        portalId: "244262601",
        region: "na2",
        formScriptSrc: "https://js-na2.hsforms.net/forms/embed/244262601.js",
      },
    ],
  },
  {
    id: "campfire-growth",
    focusKeyword: "meta ad creative for growth marketers",
    ogTitle: "Campfire for Growth Teams \u2014 Creative That Keeps Up With Your Spend",
    ogDescription: "Bespoke Meta ad creative built for media buyers and growth marketers. Fresh hooks, fast iterations, and a pipeline that matches your testing velocity.",
    seoTitle: "Campfire for Growth Teams \u2014 Bespoke Meta Ad Creative That Converts",
    title: "Campfire for Growth Teams",
    metaDescription: "High-volume Meta ad creative built for performance. Fresh concepts on demand, fast turnaround, and a production pipeline that keeps up with your testing cadence.",
    slug: "/campfire/growth",
    status: "published",
    nofollow: false,
    noindex: false,
    sitemapExclude: false,
    blocks: [
      {
        eyebrow: "Campfire / For Growth Teams",
        primaryCtaHref: "#contact",
        mode: "dynamic",
        secondaryCtaHref: "#pipeline",
        mediaTypeTag: "Example",
        primaryCtaLabel: "Let's talk creative",
        title: "Creative that keeps up with your spend",
        subtitle: "You're scaling Meta ads and burning through creative faster than your team can make it. Campfire gives you a steady pipeline of bespoke ad creative \u2014 fresh hooks, new angles, fast iterations \u2014 without hiring another designer.",
        secondaryCtaLabel: "See what you get",
        id: "cfg-hero",
        alignment: "centered",
        type: "hero",
      },
      {
        freezeOnScroll: true,
        type: "animated_headline",
        enableDarkModeOnScroll: true,
        headline: "Test more. Win more. Burn out less.",
        id: "cfg-headline",
        subtext: "Your best-performing ad is only your best-performing ad until it fatigues. You need a creative partner who can keep pace.",
        animationMode: "scroll",
        animationStyle: "fade_by_word",
      },
      {
        id: "cfg-pipeline",
        heading: "Your creative pipeline",
        sections: [
          {
            body: "Submit a brief, get bespoke ad creative back \u2014 designed by humans who understand Meta's ad ecosystem. No templates, no AI-generated filler. Every ad is made to perform.",
            title: "Brief it, ship it",
          },
          {
            body: "Found a hook that's working? We'll spin variations \u2014 new formats, fresh angles, different aspect ratios \u2014 so you can test deeper without starting from scratch every time.",
            title: "Iterate on winners",
          },
          {
            title: "Review in one click",
            body: "Ads and copy show up side by side in a single shareable link. Approve, reject, or request changes \u2014 feedback flows back to us in real time. No email threads, no Slack scavenger hunts.",
          },
          {
            body: "Approved creative is ready to pull into your ad manager immediately. Sized for every placement. No reformatting, no hunting through Drive folders.",
            title: "Download and deploy",
          },
        ],
        variant: "two_column",
        body: "Campfire is built for the way growth teams actually work \u2014 fast cycles, constant testing, and a need for creative that doesn't all look the same.",
        anchor: "pipeline",
        type: "story",
      },
      {
        id: "cfg-ad-review-demo",
        type: "product_demo",
        eyebrow: "See it in action",
        heading: "One link. Every ad. Total control.",
        body: "This is what reviewing ads in Campfire actually looks like — creative and copy side by side, with one-click approval. No logins, no PDFs, no email threads.",
        demoId: "ad_review",
        typeFilter: "product_demo",
        exampleData: {
          index: 1,
          version: "V8",
          status: "pending",
          portraitAd: {
            imageUrl:
              "https://firebasestorage.googleapis.com/v0/b/studio-tak.firebasestorage.app/o/block-media%2F1773997308699-TAST_MARCH-77BA_46_9x16.webp?alt=media&token=a338484a-e11f-4d60-bbc4-862524a43d05",
            brandName: "TAST",
            headline: "NEW COLLECTION",
          },
          squareAd: {
            imageUrl:
              "https://firebasestorage.googleapis.com/v0/b/studio-tak.firebasestorage.app/o/block-media%2F1773997311425-TAST_MARCH-77BA_46_1x1.webp?alt=media&token=4329171c-3b0d-4771-b110-d9441644edbe",
            brandName: "TAST",
            headline: "NEW COLLECTION",
          },
          copy: {
            primary:
              "Made for the moments that matter. New styles, crafted with intention.",
            headline: "SPRING EDIT",
            description: "Designed to Stand Out",
          },
        },
      },
      {
        heading: "The creative infrastructure you've been missing",
        items: [
          {
            body: "New hooks, new angles, new visual approaches \u2014 on your schedule. No waiting for a design queue or a creative director's calendar.",
            title: "Fresh concepts on demand",
            mediaFit: "contain",
            icon: {
              type: "image",
              url: "https://firebasestorage.googleapis.com/v0/b/studio-tak.firebasestorage.app/o/component-icons%2F1765343922083-01.webp?alt=media&token=9198ee90-4e0d-4569-b279-04ef402e721d",
            },
            badge: "Volume",
          },
          {
            badge: "Performance",
            icon: {
              type: "image",
              url: "https://firebasestorage.googleapis.com/v0/b/studio-tak.firebasestorage.app/o/component-icons%2F1765343941137-03.webp?alt=media&token=442804d3-ac26-4a96-9b00-2e6b568e3b91",
            },
            mediaFit: "contain",
            title: "Performance-informed",
            body: "Our designers understand what works on Meta. Aspect ratio best practices, hook structures, thumb-stopping patterns \u2014 baked into every ad.",
          },
          {
            icon: {
              type: "image",
              url: "https://firebasestorage.googleapis.com/v0/b/studio-tak.firebasestorage.app/o/component-icons%2F1765343932988-02.webp?alt=media&token=eb2cdf34-89c5-49de-aa02-a5a09f1e275d",
            },
            badge: "Speed",
            body: "Measured in days, not weeks. Your testing cadence shouldn't slow down because creative can't keep up.",
            title: "Fast turnaround",
            mediaFit: "contain",
          },
        ],
        id: "cfg-built-for-testing",
        eyebrow: "Built for testing velocity",
        columns: 3,
        anchor: "testing",
        body: "You have the data, the budget, and the strategy. What you don't have is enough fresh creative to test against. That's what Campfire solves.",
        type: "features",
      },
      {
        id: "cfg-stats",
        type: "stats",
        eyebrow: "The numbers",
        heading: "Winners, velocity, and scale",
        variant: "card",
        items: [
          { prefix: "Nearly ", value: "1 in 5", label: "ads hits 4x+ return \u2014 a winner rate you can actually scale" },
          { value: "2", suffix: "x", label: "the Meta average CTR \u2014 stronger creative signal, cheaper clicks" },
          { value: "5,900", suffix: "+", label: "ads in 90 days \u2014 testing velocity to keep your account out of fatigue" },
          { value: "14", suffix: "x+", label: "top creatives returning \u2014 proven scalers, not just hooks" },
        ],
      },
      {
        mediaSide: "right",
        body: "You already know: even your best ads have a shelf life. CPAs creep up, CTRs flatten, and suddenly your winning creative is yesterday's news. The brands that win on Meta are the ones that can keep feeding the machine with fresh, high-quality creative. Campfire makes that sustainable.",
        type: "split",
        ctaLabel: "See how it works",
        ctaHref: "#pipeline",
        eyebrow: "The real problem",
        id: "cfg-split-fatigue",
        heading: "Creative fatigue is a growth problem",
      },
      {
        id: "cfg-comparison",
        type: "comparison",
        eyebrow: "Choose your path",
        heading: "Template tools vs. a creative partner",
        body: "Self-serve design tools are great for social posts. But when performance matters, you need creative built for the platform.",
        columns: [
          {
            heading: "Template tools",
            items: [
              "Same layouts everyone else uses",
              "You do the design work",
              "No Meta-specific optimization",
              "Creative fatigue built in",
              "Iteration means starting over",
              "You manage the whole process",
            ],
          },
          {
            heading: "Campfire",
            highlighted: true,
            items: [
              "Bespoke creative for your brand",
              "Human designers do the work",
              "Built for Meta\u2019s ad ecosystem",
              "Fresh concepts on demand",
              "Variations and iterations included",
              "Brief it, review it, deploy it",
            ],
          },
        ],
      },
      {
        heading: "Built for media buyers who care about creative",
        eyebrow: "Why Campfire for growth",
        id: "cfg-why",
        items: [
          {
            badge: "Flexible pricing",
            title: "Pay per ad, scale on your terms",
            body: "No retainers, no subscriptions, no minimum commitments. Order five ads or fifty \u2014 pricing stays the same. Scale up for a launch, scale down when you're optimizing.",
          },
          {
            badge: "Quality",
            body: "Real designers who understand the platform. Creative decisions informed by what actually performs \u2014 made by people with taste, not a prompt.",
            title: "Human-made, Meta-optimized",
          },
          {
            badge: "Iteration",
            body: "Need three variations of a winning hook? A new concept for a cold audience? Static and video versions of the same angle? Just ask. We're built for iteration.",
            title: "Your testing partner",
          },
          {
            title: "Zero production overhead",
            body: "No hiring, no managing, no creative direction needed. Brief us, review the work, deploy. We handle everything in between.",
            badge: "Effortless",
          },
        ],
        body: "You know creative is the biggest lever in your account. You just need a partner who can pull it.",
        type: "scroll_gallery",
      },
      {
        type: "showcase",
        limit: 8,
        typeFilter: "Example",
        animationPreset: "fan",
        id: "cfg-showcase",
        featuredOnly: true,
      },
      {
        id: "cfg-contact",
        formScriptSrc: "https://js-na2.hsforms.net/forms/embed/244262601.js",
        heading: "Tell us about your growth goals",
        region: "na2",
        anchor: "contact",
        type: "contact",
        body: "Share your monthly ad volume, what's working (and what's not), and where creative is the bottleneck. We'll come back with a plan to keep your pipeline full.",
        eyebrow: "Let's talk",
        portalId: "244262601",
        formId: "bb99355b-ad00-407a-81e7-882535a3c4be",
      },
    ],
  },
  {
    id: "campfire-test",
    title: "Campfire",
    status: "published",
    seoTitle: "Campfire \u2014 Bespoke Meta Ad Creative, Sold Per Ad",
    metaDescription: "High-volume Meta ad creative that still feels intentional. Human-led, performance-focused, priced per ad. No subscriptions, no lock-in.",
    ogTitle: "Campfire \u2014 Bespoke Meta Ad Creative",
    ogDescription: "Every ad made for your brand. Human designers who know what converts on Meta. Pay per ad, not per month.",
    focusKeyword: "meta ad creative",
    nofollow: false,
    noindex: false,
    sitemapExclude: false,
    blocks: [
      {
        id: "cf-hero",
        type: "hero",
        eyebrow: "Campfire / Bespoke Ad Creative",
        title: "Ad creative, delivered \u2014 without the back-and-forth",
        subtitle: "Campfire is where you review ads, approve creative, and track your work \u2014 all from one place. Human-led, Meta-optimized, priced per ad.",
        primaryCtaLabel: "Get started",
        primaryCtaHref: "#contact",
        secondaryCtaLabel: "See how it works",
        secondaryCtaHref: "#how-it-works",
        alignment: "centered",
        mode: "dynamic",
        mediaTypeTag: "Example",
      },
      {
        id: "cf-stats",
        type: "stats",
        eyebrow: "Proof",
        heading: "Creative that performs",
        variant: "card",
        items: [
          { prefix: "$", value: "40M", suffix: "+", label: "in sales driven for the brands we work with \u2014 creative that performs" },
          { value: "2", suffix: "x", label: "the Meta average click-through rate \u2014 creative that stops the scroll" },
          { prefix: "Nearly ", value: "1 in 5", label: "ads delivers a 4x+ return \u2014 not just attention, conversion" },
          { value: "80", suffix: "+", label: "brands \u2014 proven across categories, not one lucky vertical" },
        ],
      },
      {
        id: "cf-headline",
        type: "animated_headline",
        headline: "High volume doesn't have to mean low quality",
        subtext: "Every ad is made for your brand specifically. No templates. No AI slop. Just intentional creative that performs.",
        animationStyle: "fade_by_word",
        animationMode: "scroll",
        freezeOnScroll: true,
        enableDarkModeOnScroll: true,
      },
      {
        id: "cf-value-props",
        type: "scroll_gallery",
        eyebrow: "Why Campfire",
        heading: "Creative that works as hard as you do",
        body: "We make ads for brands scaling their Meta spend who refuse to settle for generic. Here's what makes us different.",
        items: [
          {
            title: "Bespoke, not templated",
            body: "Every ad starts from your brand, your products, your audience. No stock imagery, no cookie-cutter layouts. High volume, still intentional.",
            badge: "Made for you",
          },
          {
            title: "Pay per ad, no gotchas",
            body: "One ad, one price. No subscriptions, no retainers, no lock-in. You pay for what you get, when you need it.",
            badge: "Simple pricing",
          },
          {
            title: "Human-led, Meta-optimized",
            body: "Real designers who understand Meta's ad ecosystem. Creative decisions informed by what actually performs, made by people with taste.",
            badge: "Performance",
          },
          {
            title: "Zero friction",
            body: "One link to review. Live updates. Everything in one place. Working with us should feel easy \u2014 because it is.",
            badge: "Effortless",
          },
        ],
      },
      {
        id: "cf-how-it-works",
        type: "story",
        anchor: "how-it-works",
        heading: "How it works",
        body: "Three steps between you and ads that actually represent your brand. No onboarding marathons, no scope creep.",
        variant: "two_column",
        sections: [
          {
            title: "1. Share your brand",
            body: "Send us your brand guidelines, product pages, and any creative you like. We study what makes your brand yours \u2014 colors, tone, audience, the whole picture.",
          },
          {
            title: "2. We make your ads",
            body: "Our designers build bespoke static and video ads optimized for Meta. Every layout, headline, and visual choice is intentional \u2014 informed by what actually performs.",
          },
          {
            title: "3. Review, approve, launch",
            body: "Review your ads from a single link \u2014 no account needed. Approve, reject, or request edits on each piece. Your feedback flows back to us in real time.",
          },
        ],
      },
      {
        id: "cf-ad-framework",
        type: "ad_framework",
        anchor: "ad-framework",
        eyebrow: "The framework",
        heading: "The building blocks for great ads",
        body: "Campfire ads learn. They’re built from an intelligent framework that makes every creative easier to test, improve, and scale.",
        principles: ["Persona-led", "Diverse", "Testable", "Intelligent"],
        items: [
          {
            label: "Persona",
            title: "Audience",
            description: "Define the exact person the ad needs to move.",
            examples: ["New customers", "High-intent buyers"]
          },
          {
            label: "Pain point",
            title: "Problem",
            description: "Lead with the friction, desire, or objection that matters most.",
            examples: ["No time", "Too expensive"]
          },
          {
            label: "Creative",
            title: "Creative format",
            description: "Choose the creative structure that brings the message to life.",
            examples: ["Us vs. Them", "Founder POV", "Problem / solution"]
          },
          {
            label: "Delivery",
            title: "Delivery format",
            description: "Build the concept for the formats where it will run.",
            examples: ["Static", "Video", "Carousel"]
          }
        ]
      },
      {
        id: "cf-ad-review-demo",
        type: "product_demo",
        eyebrow: "See it in action",
        heading: "One link. Every ad. Total control.",
        body: "This is what reviewing ads in Campfire actually looks like — creative and copy side by side, with one-click approval. No logins, no PDFs, no email threads.",
        demoId: "ad_review",
        typeFilter: "product_demo",
        exampleData: {
          index: 1,
          version: "V2",
          status: "pending",
          portraitAd: {
            imageUrl:
              "https://firebasestorage.googleapis.com/v0/b/studio-tak.firebasestorage.app/o/block-media%2F1773997308699-TAST_MARCH-77BA_46_9x16.webp?alt=media&token=a338484a-e11f-4d60-bbc4-862524a43d05",
            brandName: "TAST",
            headline: "NEW COLLECTION",
          },
          squareAd: {
            imageUrl:
              "https://firebasestorage.googleapis.com/v0/b/studio-tak.firebasestorage.app/o/block-media%2F1773997311425-TAST_MARCH-77BA_46_1x1.webp?alt=media&token=4329171c-3b0d-4771-b110-d9441644edbe",
            brandName: "TAST",
            headline: "NEW COLLECTION",
          },
          copy: {
            primary:
              "Made for the moments that matter. New styles, crafted with intention.",
            headline: "SPRING EDIT",
            description: "Designed to Stand Out",
          },
        },
      },
      {
        id: "cf-slack-connection",
        type: "slack_integration",
        adminLabel: "Slack connection",
        anchor: "slack",
        eyebrow: "Campfire in Slack",
        heading: "Your ad production operating system, right in Slack.",
        body: "Campfire joins the workspace your team already calls home, so every update feels close at hand.",
      },
      {
        id: "cf-platform",
        type: "feature_spotlight",
        eyebrow: "The platform",
        heading: "Everything in one place",
        body: "Campfire isn't just where ads get made \u2014 it's where you manage the whole relationship. Review creative, track progress, and access everything we've delivered.",
        items: [
          {
            title: "One-link review",
            body: "Click a link, enter a password, and you're in. See your ads and ad copy side by side. Approve, reject, or request edits \u2014 feedback flows back to us instantly.",
            badge: "Review",
          },
          {
            title: "Your dashboard",
            body: "Approved ads, status at a glance, and download links in one place. A gallery view makes it easy to share creative with your stakeholders.",
            badge: "Dashboard",
          },
          {
            title: "Slack notifications",
            body: "When ads are ready for review or approvals come through, you get notified right in Slack \u2014 in the channels your team already uses.",
            badge: "Stay in the loop",
          },
        ],
      },
      {
        id: "cf-who-its-for",
        type: "features",
        variant: "stacked",
        eyebrow: "Built for",
        heading: "Creative firepower for every stage of growth",
        body: "Whether you're running lean or scaling fast, Campfire gives you professional creative without the overhead of an agency or a full-time hire.",
        columns: 3,
        items: [
          {
            title: "Creative ops teams",
            body: "You're juggling briefs, brand guidelines, and a backlog that never shrinks. Campfire becomes your on-demand production arm \u2014 consistent quality, zero onboarding.",
            badge: "Creative ops",
          },
          {
            title: "Growth leads",
            body: "You know what to test but can't get creative made fast enough. Campfire keeps your ad account fed with fresh, on-brand assets so you never stall a winning ad set.",
            badge: "Growth",
          },
          {
            title: "Solo entrepreneurs",
            body: "You'd rather spend your time on the business than inside Canva. We handle the creative so you can focus on what actually moves the needle.",
            badge: "Founders",
          },
        ],
      },
      {
        id: "cf-split-performance",
        type: "split",
        eyebrow: "The point",
        heading: "Beautiful creative that actually converts",
        body: "We care about whether the ad works, not just how it looks. Every creative decision is informed by Meta ad performance data \u2014 what hooks, what converts, what scales. Pretty ads that don't perform aren't good ads.",
        mediaSide: "right",
        ctaLabel: "See the work",
        ctaHref: "#contact",
      },
      {
        id: "cf-vs-alternatives",
        type: "comparison",
        eyebrow: "Honest comparison",
        heading: "How Campfire stacks up",
        body: "We're not the right fit for everyone. But if you want creative that performs, here's why brands choose us.",
        columns: [
          {
            heading: "The other guys",
            items: [
              "Generic design queues with no ad expertise",
              "AI-generated ads with no brand nuance",
              "Freelancers who disappear mid-project",
              "Monthly subscriptions whether you need them or not",
              "Endless revisions with no strategic input",
              "One-size-fits-all templates",
            ],
          },
          {
            heading: "Campfire",
            highlighted: true,
            icon: "/campfire-icon.png",
            items: [
              "Specialists in Meta ad creative that converts",
              "Human-led creative with real brand understanding",
              "A consistent team that learns your brand over time",
              "Pay per ad \u2014 scale up or down as you need",
              "Strategic creative direction baked into every asset",
              "Custom creative tailored to your audience and goals",
            ],
          },
        ],
      },
      {
        id: "cf-feature-comparison",
        type: "comparison",
        variant: "feature_table",
        adminLabel: "Feature comparison table",
        eyebrow: "Honest comparison",
        heading: "How Campfire stacks up",
        body: "We're not the right fit for everyone. But if you want Meta creative that actually performs, here's how we're different from everyone else.",
        tableHeaders: {
          feature: "Feature",
          highlighted: "Campfire",
          other: "The other guys",
        },
        columns: [
          {
            heading: "The other guys",
            items: [
              "Monthly subscriptions and add-ons that make spend hard to control",
              "Generalist queues where Meta ads are just another design request",
              "Templated or AI-generated output with limited brand nuance",
              "Format limits, upgrade gates, or second vendors for motion and video",
              "Creative delivered without a clear loop back to performance data",
              "Scattered reviews, logins, email threads, and file chasing",
              "Rotating freelancers or teams that never learn the brand",
            ],
          },
          {
            heading: "Campfire",
            highlighted: true,
            icon: "/campfire-icon.png",
            items: [
              "Pay per ad with no subscriptions, minimums, or lock-in",
              "Built only for Meta by designers who know hooks and scroll-stoppers",
              "Bespoke, human-led work that keeps your brand feel at high volume",
              "Static, motion, carousel, and video in one place",
              "Relay ties live Meta performance back to the asset that made it",
              "Brief, review, approval, and delivery in one platform",
              "A consistent team that learns your brand round after round",
            ],
          },
        ],
        rows: [
          {
            feature: "Pricing",
            label: "What you pay",
            highlighted: "Pay per ad. No subscriptions, no minimums, no lock-in. Scale up or down whenever you want.",
            other: "Monthly subscriptions you pay whether you use them or not, plus add-ons that balloon the bill.",
          },
          {
            feature: "Platform expertise",
            label: "Who makes it",
            highlighted: "Built only for Meta. Designers who live in hooks, scroll-stoppers, and what converts on the platform.",
            other: "Generalist design queues with no real ad expertise. Meta is just another request in the line.",
          },
          {
            feature: "Creative quality",
            label: "How it looks",
            highlighted: "Bespoke, human-led work from real designers who hold your brand feel even at high volume.",
            other: "Templated or AI-generated output that looks the part but lacks taste, depth, and brand nuance.",
          },
          {
            feature: "Formats",
            label: "What you can make",
            highlighted: "Static, motion, carousel, and video, all in one place. No plan-hopping, no upgrade gates.",
            other: "Limited formats on base plans. Motion or video usually means an upgrade or a second vendor.",
          },
          {
            feature: "Performance loop",
            label: "Tied to results",
            highlighted: "Relay reads live Meta data and ties every ad back to the asset that made it, so each round gets sharper.",
            other: "Creative gets delivered and forgotten. No link between what they make and what actually performs.",
          },
          {
            feature: "Workflow",
            label: "How you run it",
            highlighted: "Brief, design, review, and delivery in one platform. Reviewers approve with a single link, no account needed.",
            other: "Scattered tools and thin dashboards. Reviews mean logins, email threads, and chasing files.",
          },
          {
            feature: "Your team",
            label: "Who shows up",
            highlighted: "A consistent team that learns your brand and shows up round after round.",
            other: "Freelancers who vanish mid-project, or rotating queues that never learn who you are.",
          },
        ],
        footer: {
          feature: "Bottom line",
          highlighted: "A reliable creative partner that gives you bespoke, high-performing Meta ads at scale.",
          other: "A queue, a tool, or a contractor. Volume or convenience, rarely both, never the performance.",
        },
      },
      {
        id: "cf-contact",
        type: "contact",
        eyebrow: "Let's talk",
        heading: "Tell us about your brand",
        body: "Share a bit about your business, your Meta ad goals, and the kind of creative you're looking for. We'll follow up with a plan \u2014 no pitch deck, no pressure.",
        anchor: "contact",
        formId: "bb99355b-ad00-407a-81e7-882535a3c4be",
        portalId: "244262601",
        region: "na2",
        formScriptSrc: "https://js-na2.hsforms.net/forms/embed/244262601.js",
      },
    ],
    slug: "/campfire",
  },
  {
    id: "learn",
    slug: "/learn",
    title: "Learn",
    status: "published",
    seoTitle: "Learn | Studio Tak",
    nofollow: false,
    noindex: false,
    sitemapExclude: false,
    focusKeyword: "Learn",
    twitterTitle: "Learn",
    canonicalUrl: "https://studiotak.co/learn",
    ogTitle: "Learn",
    blocks: [
      {
        id: "learn-featured",
        type: "article_featured",
        adminLabel: "Featured article",
      },
      {
        id: "learn-grid",
        type: "article_grid",
        adminLabel: "Article grid",
        offset: 1,
      },
    ],
    metaDescription: "Insights, case studies, and notes from Studio Tak.",
  },
  {
    id: "lvGVSzmisEW5fqnHH1Ao",
    slug: "/campfire/demo",
    status: "published",
    noindex: false,
    nofollow: false,
    sitemapExclude: false,
    title: "Book a Demo",
    focusKeyword: "Book a Demo",
    twitterTitle: "Book a Demo",
    canonicalUrl: "https://studiotak.co/campfire/demo",
    twitterDescription: "We partner with DTC teams to produce, and ship performance-ready ads every week. Book a demo and we\u2019ll walk through how Campfire can work for you.",
    ogTitle: "Book a Demo",
    ogDescription: "We partner with DTC teams to produce, and ship performance-ready ads every week. Book a demo and we\u2019ll walk through how Campfire can work for you.",
    seoTitle: "Book a Demo",
    metaDescription: "We partner with DTC teams to produce, and ship performance-ready ads every week. Book a demo and we\u2019ll walk through how Campfire can work for you.",
    blocks: [
      {
        type: "contact",
        formId: "bb99355b-ad00-407a-81e7-882535a3c4be",
        eyebrow: "Let's Chat",
        formScriptSrc: "https://js-na2.hsforms.net/forms/embed/244262601.js",
        enableDarkModeOnScroll: false,
        id: "a7f124d8-f9a0-4a1b-b126-7eb0d0ff7314",
        media: {
          type: "image",
          url: "https://firebasestorage.googleapis.com/v0/b/studio-tak.firebasestorage.app/o/block-media%2F1765343575514-Ian%20Wagner%C2%A0BW.webp?alt=media&token=59af2921-1ea9-4fea-b343-81288d41d434",
        },
        region: "na2",
        portalId: "244262601",
        anchor: "contact",
        body: "We partner with DTC teams to produce, and ship performance-ready ads every week.\nBook a demo and we\u2019ll walk through how Campfire can work for you.",
        heading: "Pull up a chair.",
      },
    ],
  },
  {
    id: "about",
    blocks: [
      {
        id: "about-hero",
        type: "hero",
        eyebrow: "About",
        title: "Small, senior team working at the intersection of brand and product.",
        subtitle: "We blend design systems thinking with expressive visuals.",
        primaryCtaLabel: "Meet the team",
        primaryCtaHref: "/about#team",
        alignment: "centered",
      },
      {
        id: "about-story",
        type: "story",
        heading: "Approach",
        body: "We prototype in the browser early to validate motion.",
        variant: "split_with_quote",
        sections: [
          {
            title: "Approach",
            body: "We prototype in the browser early to validate motion.",
          },
          {
            title: "Stack",
            body: "Next.js app router, Framer Motion, content schemas mapped to design tokens.",
          },
        ],
      },
    ],
    title: "About",
    metaDescription: "Small, senior team working at the intersection of brand and product.",
    slug: "/about",
    status: "draft",
  },
  {
    id: "home",
    slug: "/",
    title: "Home",
    status: "published",
    canonicalUrl: "https://studiotak.co/",
    ogTitle: "Studio Tak | Marketing Technology & Creative Production",
    ogDescription: "Creative production systems for brands and agencies running Meta ads at scale.",
    nofollow: false,
    noindex: false,
    sitemapExclude: false,
    blocks: [
      {
        id: "home-hero",
        type: "hero",
        eyebrow: "Studio Tak / Marketing Engineering",
        title: "Design systems with expressive motion",
        subtitle: "Static-first marketing pages built with React islands where they matter.",
        primaryCtaLabel: "Plan a launch",
        primaryCtaHref: "#contact",
        secondaryCtaLabel: "View capabilities",
        secondaryCtaHref: "#capabilities",
        alignment: "centered",
      },
      {
        id: "home-animated-headline",
        type: "animated_headline",
        headline: "Full-screen animated headlines",
        subtext: "Pick a motion preset or tie the reveal to scroll to choreograph the story beat.",
        animationStyle: "scramble",
        animationMode: "scroll",
        freezeOnScroll: true,
      },
      {
        id: "home-scroll-gallery",
        type: "scroll_gallery",
        eyebrow: "Scroll gallery",
        heading: "Swipe through featured work",
        body: "Full-bleed, full-height carousel of cards you can source from the component library or craft per page.",
        items: [
          {
            title: "Component-powered",
            body: "Pull in existing feature components to keep cards consistent across pages.",
            badge: "Reusable",
            industry: "Marketing systems",
          },
          {
            title: "Horizontal scroll",
            body: "Full-width track with snap points keeps the story feeling cinematic.",
            badge: "Motion",
            type: "Scroll",
          },
          {
            title: "Page-specific cards",
            body: "Layer in bespoke highlights without touching code\u2014edit right in Admin.",
            badge: "Custom",
            type: "Content",
          },
        ],
      },
      {
        id: "home-features",
        type: "features",
        anchor: "capabilities",
        eyebrow: "Capabilities",
        heading: "Blocks built as a component library",
        body: "Each block maps to content schema fields so marketing can ship pages without engineering.",
        columns: 3,
        items: [
          {
            title: "Hero",
            body: "Above-the-fold intro with inline or background media plus two CTAs.",
            badge: "CTA-ready",
          },
          {
            title: "Animated headline",
            body: "Full-screen headline with reusable text motion presets and scroll-linking.",
            badge: "Motion",
          },
          {
            title: "Story",
            body: "Multi-column story block with variants and nested sections for process steps.",
            badge: "Rich copy",
          },
          {
            title: "Features",
            body: "Badge + title + body cards laid out in responsive columns.",
            badge: "New",
          },
        ],
      },
      {
        id: "home-story",
        type: "story",
        anchor: "process",
        heading: "Process",
        body: "Edit these steps in /admin \u2192 Pages to update the live site.",
        variant: "two_column",
        sections: [
          {
            title: "Discovery & storyboard",
            body: "We map the emotional beats, target metrics, and hero moments.",
          },
          {
            title: "Design system + tokens",
            body: "Design tokens, content schemas, and motion systems to keep every section coherent.",
          },
          {
            title: "Build & QA",
            body: "Static-first builds with selective React islands and Framer Motion choreography.",
          },
        ],
      },
      {
        id: "home-contact",
        type: "contact",
        eyebrow: "Contact",
        heading: "Plan your launch with Studio Tak",
        body: "Tell us about your product, timeline, and the outcomes you want. We'll follow up with a focused plan.",
        anchor: "contact",
        media: {
          url: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
          type: "image",
          alt: "Designers collaborating at a table",
        },
        formId: "bb99355b-ad00-407a-81e7-882535a3c4be",
        portalId: "244262601",
        region: "na2",
        formScriptSrc: "https://js-na2.hsforms.net/forms/embed/244262601.js",
      },
    ],
    seoTitle: "Studio Tak | Design Systems & Interactive Experiences",
    metaDescription: "Marketing technology consultancy helping agencies and brands produce ads faster through creative production systems, custom tooling, and AI-assisted workflows.",
  },
  {
    id: "work",
    blocks: [
      {
        id: "work-hero",
        type: "hero",
        eyebrow: "Work",
        title: "Selected launches across SaaS, fintech, and climate.",
        subtitle: "We pair narrative with purposeful motion to drive activation.",
        primaryCtaLabel: "View case studies",
        primaryCtaHref: "/work",
        alignment: "image_left",
      },
      {
        id: "work-story",
        type: "story",
        heading: "Collaboration",
        body: "Work directly with senior designers and engineers.",
        variant: "single_column",
        sections: [
          {
            title: "Case studies",
            body: "Narratives anchored by metrics and motion.",
          },
          {
            title: "Collaboration",
            body: "Work directly with senior designers and engineers.",
          },
        ],
      },
    ],
    title: "Work",
    metaDescription: "Selected launches across SaaS, fintech, and climate.",
    slug: "/work",
    status: "draft",
  }
];

// Dev-time guard: surface duplicate slugs immediately when the dev server starts.
if (process.env.NODE_ENV === "development") {
  const slugMap = new Map<string, string>();
  for (const page of seedPages) {
    const existing = slugMap.get(page.slug);
    if (existing) {
      console.warn(`⚠ Duplicate slug "${page.slug}" in seed data: "${existing}" and "${page.id}"`);
    }
    slugMap.set(page.slug, page.id);
  }
}
