import type { AnimationPresetName } from "@/components/sections/animationPresets";
import type { GhostPost } from "@/lib/ghost";

export type PageStatus = "draft" | "published";

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
  subtitle?: string;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  media?: BlockMedia;
  background?: BlockMedia;
  alignment: "image_left" | "image_right" | "centered";
  overlayStyle?: "full" | "gradient";
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

export type BlockRecord =
  | DividerBlock
  | HeroBlock
  | ThirdsBlock
  | StoryBlock
  | SplitBlock
  | FeaturesBlock
  | AnimatedHeadlineBlock
  | ScrollGalleryBlock
  | ShowcaseBlock
  | LogosBlock
  | ContactBlock
  | ArticleFeaturedBlock
  | ArticleGridBlock;

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
    id: "home",
    slug: "/",
    title: "Home",
    status: "published",
    seoTitle: "Studio Tak | Design Systems & Interactive Experiences",
    metaDescription: "Static-first marketing pages built with React islands where they matter.",
    canonicalUrl: "https://studiotak.co/",
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
        alignment: "centered"
      },
      {
        id: "home-animated-headline",
        type: "animated_headline",
        headline: "Full-screen animated headlines",
        subtext: "Pick a motion preset or tie the reveal to scroll to choreograph the story beat.",
        animationStyle: "scramble",
        animationMode: "scroll",
        freezeOnScroll: true
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
            industry: "Marketing systems"
          },
          {
            title: "Horizontal scroll",
            body: "Full-width track with snap points keeps the story feeling cinematic.",
            badge: "Motion",
            type: "Scroll"
          },
          {
            title: "Page-specific cards",
            body: "Layer in bespoke highlights without touching code—edit right in Admin.",
            badge: "Custom",
            type: "Content"
          }
        ]
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
            badge: "CTA-ready"
          },
          {
            title: "Animated headline",
            body: "Full-screen headline with reusable text motion presets and scroll-linking.",
            badge: "Motion"
          },
          {
            title: "Story",
            body: "Multi-column story block with variants and nested sections for process steps.",
            badge: "Rich copy"
          },
          {
            title: "Features",
            body: "Badge + title + body cards laid out in responsive columns.",
            badge: "New"
          }
        ]
      },
      {
        id: "home-story",
        type: "story",
        anchor: "process",
        heading: "Process",
        body: "Edit these steps in /admin → Pages to update the live site.",
        variant: "two_column",
        sections: [
          { title: "Discovery & storyboard", body: "We map the emotional beats, target metrics, and hero moments." },
          { title: "Design system + tokens", body: "Design tokens, content schemas, and motion systems to keep every section coherent." },
          { title: "Build & QA", body: "Static-first builds with selective React islands and Framer Motion choreography." }
        ]
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
          alt: "Designers collaborating at a table"
        },
        formId: "bb99355b-ad00-407a-81e7-882535a3c4be",
        portalId: "244262601",
        region: "na2",
        formScriptSrc: "https://js-na2.hsforms.net/forms/embed/244262601.js"
      }
    ]
  },
  {
    id: "about",
    slug: "/about",
    title: "About",
    status: "draft",
    metaDescription: "Small, senior team working at the intersection of brand and product.",
    blocks: [
      {
        id: "about-hero",
        type: "hero",
        eyebrow: "About",
        title: "Small, senior team working at the intersection of brand and product.",
        subtitle: "We blend design systems thinking with expressive visuals.",
        primaryCtaLabel: "Meet the team",
        primaryCtaHref: "/about#team",
        alignment: "centered"
      },
      {
        id: "about-story",
        type: "story",
        heading: "Approach",
        body: "We prototype in the browser early to validate motion.",
        variant: "split_with_quote",
        sections: [
          { title: "Approach", body: "We prototype in the browser early to validate motion." },
          { title: "Stack", body: "Next.js app router, Framer Motion, content schemas mapped to design tokens." }
        ]
      }
    ]
  },
  {
    id: "work",
    slug: "/work",
    title: "Work",
    status: "draft",
    metaDescription: "Selected launches across SaaS, fintech, and climate.",
    blocks: [
      {
        id: "work-hero",
        type: "hero",
        eyebrow: "Work",
        title: "Selected launches across SaaS, fintech, and climate.",
        subtitle: "We pair narrative with purposeful motion to drive activation.",
        primaryCtaLabel: "View case studies",
        primaryCtaHref: "/work",
        alignment: "image_left"
      },
      {
        id: "work-story",
        type: "story",
        heading: "Collaboration",
        body: "Work directly with senior designers and engineers.",
        variant: "single_column",
        sections: [
          { title: "Case studies", body: "Narratives anchored by metrics and motion." },
          { title: "Collaboration", body: "Work directly with senior designers and engineers." }
        ]
      }
    ]
  },
  {
    id: "learn",
    slug: "/learn",
    title: "Learn",
    status: "published",
    seoTitle: "Learn | Studio Tak",
    metaDescription: "Insights, case studies, and notes from Studio Tak.",
    blocks: [
      {
        id: "learn-featured",
        type: "article_featured",
        adminLabel: "Featured article"
      },
      {
        id: "learn-grid",
        type: "article_grid",
        adminLabel: "Article grid",
        offset: 1
      }
    ]
  },
  {
    id: "campfire-test",
    slug: "/campfire-test",
    title: "Campfire",
    status: "published",
    seoTitle: "Campfire — Bespoke Meta Ad Creative, Sold Per Ad",
    metaDescription:
      "High-volume Meta ad creative that still feels intentional. Human-led, performance-focused, priced per ad. No subscriptions, no lock-in.",
    ogTitle: "Campfire — Bespoke Meta Ad Creative",
    ogDescription:
      "Every ad made for your brand. Human designers who know what converts on Meta. Pay per ad, not per month.",
    focusKeyword: "meta ad creative",
    blocks: [
      {
        id: "cf-hero",
        type: "hero",
        eyebrow: "Campfire / Bespoke Ad Creative",
        title: "Ads that actually look like your brand",
        subtitle:
          "Bespoke Meta ad creative, made by people with taste. Pay per ad — no subscriptions, no retainers, no guesswork.",
        primaryCtaLabel: "Get started",
        primaryCtaHref: "#contact",
        secondaryCtaLabel: "See how it works",
        secondaryCtaHref: "#how-it-works",
        alignment: "centered",
      },
      {
        id: "cf-headline",
        type: "animated_headline",
        headline: "High volume doesn't have to mean low quality",
        subtext:
          "Every ad is made for your brand specifically. No templates. No AI slop. Just intentional creative that performs.",
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
            body: "Every ad starts from your brand, your products, your audience. We learn what makes you different and build creative around it.",
            badge: "Made for you",
          },
          {
            title: "Pay per ad",
            body: "One ad, one price. No monthly subscriptions, no retainers, no confusing packages. Scale up or down whenever you need to.",
            badge: "Simple pricing",
          },
          {
            title: "Human-led, Meta-optimized",
            body: "Real designers who understand Meta's ad ecosystem — formats, placements, hooks, and what actually stops a thumb.",
            badge: "Performance",
          },
          {
            title: "Fast without cutting corners",
            body: "Our production system moves quickly, but every ad gets a human design pass. Speed and quality aren't a trade-off here.",
            badge: "Quick turnaround",
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
            body: "Send us your brand guidelines, product pages, and any creative you like. We study what makes your brand yours — colors, tone, audience, the whole picture.",
          },
          {
            title: "2. We make your ads",
            body: "Our designers build bespoke static and video ads optimized for Meta. Every layout, headline, and visual choice is intentional — informed by what actually performs.",
          },
          {
            title: "3. Review, approve, launch",
            body: "Review your ads in our lightweight approval tool. Request changes, leave notes, and approve — all in one place. Then put them to work.",
          },
        ],
      },
      {
        id: "cf-who-its-for",
        type: "features",
        eyebrow: "Built for",
        heading: "You've outgrown Canva. You're not ready for an agency.",
        body: "Campfire fills the gap between DIY and enterprise — professional creative for brands that are growing fast and need ads that keep up.",
        columns: 3,
        items: [
          {
            title: "Scaling founders",
            body: "You're spending $10K–$100K/month on Meta and you know your creative could be better. You need great ads without hiring a full-time designer.",
            badge: "Entrepreneurs",
          },
          {
            title: "Growth & media buyers",
            body: "You know what to test but can't get creative made fast enough. Campfire keeps your ad account fed with fresh, on-brand creative.",
            badge: "Performance teams",
          },
          {
            title: "Marketing teams at SMBs",
            body: "Your team is growing but your creative resources aren't. We work like an extension of your team — learning your brand, not just filling a queue.",
            badge: "Growing brands",
          },
        ],
      },
      {
        id: "cf-split-performance",
        type: "split",
        eyebrow: "The point",
        heading: "Beautiful creative that actually converts",
        body: "We care about whether the ad works, not just how it looks. Every creative decision is informed by Meta ad performance data — what hooks, what converts, what scales. Pretty ads that don't perform aren't good ads.",
        mediaSide: "right",
        ctaLabel: "See the work",
        ctaHref: "#contact",
      },
      {
        id: "cf-vs-alternatives",
        type: "features",
        eyebrow: "Honest comparison",
        heading: "How Campfire stacks up",
        body: "We're not the right fit for everyone. But if you're scaling Meta ads and want creative that performs, here's why brands choose us.",
        columns: 2,
        items: [
          {
            title: "vs. Design subscriptions",
            body: "Services like Design Pickle charge $2K+/month for a general design queue. We specialize in Meta ads, charge per ad, and you talk to people who know your brand.",
            badge: "No subscription",
          },
          {
            title: "vs. AI ad tools",
            body: "AI can generate an ad. We make your ad. Human taste, brand nuance, and creative direction that AI can't replicate — yet.",
            badge: "Human-led",
          },
          {
            title: "vs. Freelancers",
            body: "Stop rolling the dice. We bring consistent quality, Meta ad expertise, and a real creative relationship — not a one-off transaction.",
            badge: "Consistent",
          },
          {
            title: "vs. Doing it yourself",
            body: "Your time is worth more than another hour in Canva. Focus on running your business — we'll handle the creative.",
            badge: "Your time back",
          },
        ],
      },
      {
        id: "cf-contact",
        type: "contact",
        eyebrow: "Let's talk",
        heading: "Tell us about your brand",
        body: "Share a bit about your business, your Meta ad goals, and the kind of creative you're looking for. We'll follow up with a plan — no pitch deck, no pressure.",
        anchor: "contact",
        formId: "bb99355b-ad00-407a-81e7-882535a3c4be",
        portalId: "244262601",
        region: "na2",
        formScriptSrc:
          "https://js-na2.hsforms.net/forms/embed/244262601.js",
      },
    ],
  }
];
