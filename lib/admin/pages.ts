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
        title: "Ad creative, delivered — without the back-and-forth",
        subtitle:
          "Campfire is where you review ads, approve creative, and track campaigns — all from one place. Human-led, Meta-optimized, priced per ad.",
        primaryCtaLabel: "Get started",
        primaryCtaHref: "#contact",
        secondaryCtaLabel: "See how it works",
        secondaryCtaHref: "#how-it-works",
        alignment: "centered",
        mode: "dynamic",
        mediaTypeTag: "Example",
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
            body: "One link to review. Live updates. Everything in one place. Working with us should feel easy — because it is.",
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
            body: "Send us your brand guidelines, product pages, and any creative you like. We study what makes your brand yours — colors, tone, audience, the whole picture.",
          },
          {
            title: "2. We make your ads",
            body: "Our designers build bespoke static and video ads optimized for Meta. Every layout, headline, and visual choice is intentional — informed by what actually performs.",
          },
          {
            title: "3. Review, approve, launch",
            body: "Review your ads from a single link — no account needed. Approve, reject, or request edits on each piece. Your feedback flows back to us in real time.",
          },
        ],
      },
      {
        id: "cf-platform",
        type: "features",
        eyebrow: "The platform",
        heading: "Everything in one place",
        body: "Campfire isn't just where ads get made — it's where you manage the whole relationship. Review creative, track progress, and access everything we've delivered.",
        columns: 3,
        items: [
          {
            title: "One-link review",
            body: "Click a link, enter a password, and you're in. See your ads and ad copy side by side. Approve, reject, or request edits — feedback flows back to us instantly.",
            badge: "Review",
          },
          {
            title: "Your dashboard",
            body: "Approved ads, campaign status, and download links in one place. A gallery view makes it easy to share creative with your stakeholders.",
            badge: "Dashboard",
          },
          {
            title: "Slack notifications",
            body: "When ads are ready for review or a campaign hits a milestone, you get notified right in Slack — in the channels your team already uses.",
            badge: "Stay in the loop",
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
  },
  {
    id: "campfire-brands",
    slug: "/campfire/brands",
    title: "Campfire for Brands",
    status: "published",
    seoTitle: "Campfire for Brands — Bespoke Meta Ad Creative, Made for You",
    metaDescription:
      "Review and approve bespoke Meta ad creative from a single link. Your dashboard, your ads, your brand — all in one place. Pay per ad, no subscriptions.",
    ogTitle: "Campfire for Brands — Your Ads, Your Way",
    ogDescription:
      "Bespoke Meta ad creative with a frictionless review experience. One link, real-time updates, and a dashboard built for your brand.",
    focusKeyword: "meta ad creative for brands",
    blocks: [
      {
        id: "cfb-hero",
        type: "hero",
        eyebrow: "Campfire / For Brands",
        title: "Your ads, reviewed and delivered — without the back-and-forth",
        subtitle:
          "Campfire is where you review ads, approve creative, track campaigns, and access your delivered work — all from one place. No email chains, no lost notes.",
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
        subtext:
          "No account to create, no app to install. Click, review, and respond. It's that simple.",
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
            body: "See your visuals alongside the ad copy so you always know what the messaging says. Approve, reject, or request edits on each piece — feedback flows back to us in real time.",
          },
          {
            title: "Progress tracks itself",
            body: "You can always see where things stand without having to ask. No checking in, no status meetings — just the current state of your work with us.",
          },
          {
            title: "Your dashboard",
            body: "Approved ads ready to use, campaign status at a glance, and quick download links. A gallery view makes it easy to share creative with your own team or stakeholders.",
          },
          {
            title: "Raise a question anytime",
            body: "A note about an ad, a revision request, a question for our team — raise it directly inside Campfire. It stays connected to the campaign, so nothing gets lost.",
          },
        ],
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
            body: "When ads are ready for review or campaigns hit milestones, you get notified right in Slack — in the channels your team already uses.",
            badge: "Stay in the loop",
          },
          {
            title: "Reporting & exports",
            body: "Ad counts by campaign, aspect ratio coverage, and status breakdowns. Export everything to CSV for your own reporting.",
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
        id: "cfb-split-bespoke",
        type: "split",
        eyebrow: "The creative",
        heading: "Bespoke ads, not templates",
        body: "Every ad is made for your brand. No stock imagery, no cookie-cutter layouts, no AI slop. High volume, still intentional. Human designers who understand Meta's ad ecosystem — what hooks, what converts, what scales.",
        mediaSide: "right",
        ctaLabel: "See how it works",
        ctaHref: "#how-it-works",
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
            body: "One link to review. Live updates. Slack notifications. Everything in one place. Working with us should feel easy — because it is.",
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
        body: "Share a bit about your business, your Meta ad goals, and the kind of creative you're looking for. We'll follow up with a plan — no pitch deck, no pressure.",
        anchor: "contact",
        formId: "bb99355b-ad00-407a-81e7-882535a3c4be",
        portalId: "244262601",
        region: "na2",
        formScriptSrc:
          "https://js-na2.hsforms.net/forms/embed/244262601.js",
      },
    ],
  },
  {
    id: "campfire-agencies",
    slug: "/campfire/agencies",
    title: "Campfire for Agencies",
    status: "published",
    seoTitle: "Campfire for Agencies — Bespoke Ad Creative at Scale",
    metaDescription:
      "Your clients get bespoke ads and a great experience. You get production visibility, brand management, and the tools to run creative at scale.",
    ogTitle: "Campfire for Agencies — Creative Production at Scale",
    ogDescription:
      "Manage brands, track production, and give your clients a frictionless review experience. Bespoke Meta ad creative, built for agency workflows.",
    focusKeyword: "meta ad creative agency",
    blocks: [
      {
        id: "cfa-hero",
        type: "hero",
        eyebrow: "Campfire / For Agency Partners",
        title: "Your clients get great ads. You get real visibility.",
        subtitle:
          "Bespoke Meta ad creative, a frictionless client experience, and the production tools to manage it all — across every brand in your portfolio.",
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
        subtext:
          "Whether you're managing three brands or thirty, Campfire keeps production organized, tracked, and on schedule.",
        animationStyle: "fade_by_word",
        animationMode: "scroll",
        freezeOnScroll: true,
        enableDarkModeOnScroll: true,
      },
      {
        id: "cfa-client-experience",
        type: "story",
        heading: "What your clients see",
        body: "Your clients get a simple, frictionless experience — and because you're on the platform, you can see exactly what they see.",
        variant: "two_column",
        sections: [
          {
            title: "One-link review",
            body: "Clients review and approve ads from a single shareable link — no account needed. Ads and ad copy show up side by side, with approve/reject/edit controls on every piece.",
          },
          {
            title: "Client dashboard",
            body: "Approved ads, campaign status, and download links in one place. A gallery view makes it easy for clients to share creative with their own stakeholders.",
          },
          {
            title: "Slack notifications",
            body: "Clients get notified right in Slack when ads are ready for review or campaigns hit milestones — in the channels they're already using.",
          },
          {
            title: "Built-in support",
            body: "Clients can raise questions or revision requests directly inside Campfire, tied to the campaign they're about. No email chains, no lost context.",
          },
        ],
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
            body: "See every campaign's status, timeline, and assignments across all your brands. Filter by brand, month, review status, or any combination. Share a specific view with a colleague in one click.",
            badge: "Visibility",
          },
          {
            title: "Brand management",
            body: "Each brand gets a dedicated profile: logos, products, campaigns, tone of voice, staff assignments, contract terms, and internal notes. When anyone picks up a new brief, everything they need is in one place.",
            badge: "Organization",
          },
          {
            title: "Integrations",
            body: "Campfire connects to your existing tools — trafficking systems, DAMs, and other production tools — so it fits into how you already work.",
            badge: "Your stack",
          },
          {
            title: "Scoped permissions",
            body: "You only see what's relevant to your portfolio. Each team member gets the right level of access for their role — from read-only visibility to full production management.",
            badge: "Access control",
          },
        ],
      },
      {
        id: "cfa-split-scale",
        type: "split",
        eyebrow: "At scale",
        heading: "Everything lives together",
        body: "Ads, copy, feedback, status, reporting, and integrations — all in one place. No more stitching together spreadsheets, Drive folders, and Slack threads. Whether you're running five campaigns or fifty, Campfire keeps production organized.",
        mediaSide: "left",
        ctaLabel: "See it in action",
        ctaHref: "#contact",
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
            body: "Production boards and brand management — purpose-built for high-volume creative work. No more asking for status updates.",
            badge: "Visibility",
          },
          {
            title: "It scales with your portfolio",
            body: "Three brands or thirty — Campfire keeps production organized, tracked, and on schedule without adding overhead.",
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
        formScriptSrc:
          "https://js-na2.hsforms.net/forms/embed/244262601.js",
      },
    ],
  }
];
