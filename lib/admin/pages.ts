import type { AnimationPresetName } from "@/components/sections/animationPresets";

export type PageStatus = "draft" | "published";

export type BlockMedia = {
  url: string;
  type?: "image" | "video";
  alt?: string;
  width?: number;
  height?: number;
};

export type BlockSection = { title: string; body: string };

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

export type BlockRecord =
  | HeroBlock
  | ThirdsBlock
  | StoryBlock
  | SplitBlock
  | FeaturesBlock
  | AnimatedHeadlineBlock
  | ScrollGalleryBlock
  | ShowcaseBlock
  | LogosBlock
  | ContactBlock;

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
  }
];
