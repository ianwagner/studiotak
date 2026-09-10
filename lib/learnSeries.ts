import type { GhostPost } from "@/lib/ghost";
import { getLearnDisplayTitle } from "@/lib/learnTaxonomy";

export type LearnSeriesStep = {
  postSlug: string;
  position: number;
  label?: string;
};

export type LearnSeries = {
  slug: string;
  title: string;
  description: string;
  iconSrc?: string;
  steps: LearnSeriesStep[];
};

export type ResolvedLearnSeriesStep = LearnSeriesStep & {
  post: GhostPost;
  title: string;
};

export type ResolvedLearnSeries = Omit<LearnSeries, "steps"> & {
  steps: ResolvedLearnSeriesStep[];
};

type LearnSeriesSeed = Omit<LearnSeries, "steps"> & {
  steps: Array<Pick<LearnSeriesStep, "postSlug" | "label">>;
};

/**
 * The fallback catalog keeps the curated Series live before their Ghost tags
 * are added. Editors can take over the membership and order in Ghost with
 * internal tags: `#series: Series title | 1`.
 */
const LEARN_SERIES_SEEDS: LearnSeriesSeed[] = [
  {
    slug: "make-better-meta-ads",
    title: "Make Better Meta Ads",
    description: "Learn to make stronger individual ads.",
    iconSrc: "/learn/01.png",
    steps: [
      { postSlug: "why-good-design-still-fails-on-meta" },
      { postSlug: "what-high-performing-performance-creative-needs-to-do-in-the-first-3-seconds" },
      { postSlug: "why-templates-dont-work-when-performance-is-the-goal" },
      { postSlug: "why-ads-stop-working-on-meta-even-when-they-look-fine" },
    ]
  },
  {
    slug: "build-a-creative-testing-system",
    title: "Build a Creative Testing System",
    description: "Learn which ideas actually work.",
    iconSrc: "/learn/02.png",
    steps: [
      { postSlug: "the-complete-guide-to-meta-ad-creative-testing-services" },
      { postSlug: "what-to-look-for-in-meta-ad-testing-services" },
      { postSlug: "why-ads-stop-working-on-meta-even-when-they-look-fine" },
      { postSlug: "how-to-scale-meta-ads-without-sacrificing-quality" }
    ]
  },
  {
    slug: "master-meta-creative-scaling",
    title: "Master Meta Creative Scaling",
    description: "Turn what works into sustained creative growth.",
    iconSrc: "/learn/03.png",
    steps: [
      { postSlug: "why-meta-creative-diversity-matters-more-after-andromeda" },
      { postSlug: "how-to-identify-and-expand-high-performing-audiences-on-meta" },
      { postSlug: "how-many-ads-do-you-really-need-to-run-on-meta-as-you-scale" },
      { postSlug: "how-to-scale-meta-ads-without-sacrificing-quality" }
    ]
  },
  {
    slug: "build-a-branded-meta-ad-strategy",
    title: "Build a Branded Meta Ad Strategy",
    description: "Build brand into the performance system.",
    iconSrc: "/learn/04.png",
    steps: [
      { postSlug: "do-you-need-branded-ads-on-meta-as-you-scale", label: "Add Brand to Your Ad Mix" },
      { postSlug: "what-role-do-branded-ads-actually-play-in-meta-performance" },
      { postSlug: "how-many-ads-do-you-really-need-to-run-on-meta-as-you-scale" },
      { postSlug: "what-does-good-branded-creative-look-like-on-meta" }
    ]
  }
];

const SERIES_TAG_PATTERN = /^#?series\s*:\s*(.+?)\s*\|\s*(\d+)\s*$/i;
const SERIES_DESCRIPTION_TAG_PATTERN = /^#?series-description\s*:\s*(.+?)\s*\|\s*(.+)$/i;

const toSeriesSlug = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const getInternalTagNames = (post: GhostPost) =>
  (post.tags ?? [])
    .filter((tag) => tag.visibility === "internal")
    .map((tag) => tag.name);

const getTaggedSeries = (posts: GhostPost[]) => {
  const seriesBySlug = new Map<string, { title: string; steps: LearnSeriesStep[] }>();
  const descriptions = new Map<string, string>();

  posts.forEach((post) => {
    getInternalTagNames(post).forEach((tagName) => {
      const seriesMatch = tagName.match(SERIES_TAG_PATTERN);
      if (seriesMatch) {
        const title = seriesMatch[1].trim();
        const slug = toSeriesSlug(title);
        const position = Number(seriesMatch[2]);
        if (!slug || !Number.isFinite(position) || position < 1) return;

        const series = seriesBySlug.get(slug) ?? { title, steps: [] };
        series.steps.push({ postSlug: post.slug, position });
        seriesBySlug.set(slug, series);
        return;
      }

      const descriptionMatch = tagName.match(SERIES_DESCRIPTION_TAG_PATTERN);
      if (descriptionMatch) {
        const slug = toSeriesSlug(descriptionMatch[1]);
        const description = descriptionMatch[2].trim();
        if (slug && description) descriptions.set(slug, description);
      }
    });
  });

  return { seriesBySlug, descriptions };
};

/**
 * Returns all configured Series, preferring Ghost's internal Series tags
 * whenever a Series has been tagged there. New tag-defined Series are added
 * automatically, with a short default description until one is supplied.
 */
export const getLearnSeries = (posts: GhostPost[]): LearnSeries[] => {
  const { seriesBySlug, descriptions } = getTaggedSeries(posts);
  const seedSlugs = new Set(LEARN_SERIES_SEEDS.map((series) => series.slug));
  const configuredSeries = LEARN_SERIES_SEEDS.map((seed) => {
    const taggedSeries = seriesBySlug.get(seed.slug);
    const sourceSteps = taggedSeries?.steps.length
      ? taggedSeries.steps
      : seed.steps.map((step, index) => ({ ...step, position: index + 1 }));

    return {
      slug: seed.slug,
      title: taggedSeries?.title ?? seed.title,
      description: descriptions.get(seed.slug) ?? seed.description,
      iconSrc: seed.iconSrc,
      steps: sourceSteps
        .sort((a, b) => a.position - b.position || a.postSlug.localeCompare(b.postSlug))
        .filter((step, index, allSteps) => allSteps.findIndex((candidate) => candidate.postSlug === step.postSlug) === index)
    };
  });

  const tagOnlySeries = Array.from(seriesBySlug.entries())
    .filter(([slug]) => !seedSlugs.has(slug))
    .map(([slug, series]) => ({
      slug,
      title: series.title,
      description: descriptions.get(slug) ?? "A curated sequence of guides, arranged as practical steps.",
      steps: series.steps
        .sort((a, b) => a.position - b.position || a.postSlug.localeCompare(b.postSlug))
        .filter((step, index, allSteps) => allSteps.findIndex((candidate) => candidate.postSlug === step.postSlug) === index)
    }));

  return [...configuredSeries, ...tagOnlySeries];
};

/** Only render a Series when every listed guide is published and available. */
export const getAvailableLearnSeries = (posts: GhostPost[]): ResolvedLearnSeries[] => {
  const postsBySlug = new Map(posts.map((post) => [post.slug, post]));

  return getLearnSeries(posts).flatMap((series) => {
    const steps = series.steps.flatMap((step) => {
      const post = postsBySlug.get(step.postSlug);
      return post ? [{ ...step, post, title: step.label ?? getLearnDisplayTitle(post) }] : [];
    });

    return steps.length === series.steps.length ? [{ ...series, steps }] : [];
  });
};

export const findLearnSeriesBySlug = (slug: string, posts: GhostPost[]) =>
  getAvailableLearnSeries(posts).find((series) => series.slug === slug);

export const getLearnSeriesMembership = (postSlug: string, posts: GhostPost[]) => {
  const series = getAvailableLearnSeries(posts).find((item) => item.steps.some((step) => step.postSlug === postSlug));
  if (!series) return null;

  const stepIndex = series.steps.findIndex((step) => step.postSlug === postSlug);
  return stepIndex === -1 ? null : { series, stepIndex };
};
