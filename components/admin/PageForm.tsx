"use client";

import Link from "next/link";
import type { Route } from "next";
import { useList } from "@refinedev/core";
import { useEffect, useMemo, useState } from "react";
import type {
  AnimatedHeadlineBlock,
  BlockRecord,
  HeroBlock,
  PageRecord,
  PageStatus,
  StoryBlock,
  FeaturesBlock,
  FeatureItem,
  ScrollGalleryBlock,
  ShowcaseBlock,
  LogosBlock,
  SplitBlock,
  ThirdsBlock,
  ContactBlock,
  BlockMedia
} from "@/lib/admin/pages";
import { animationPresets, defaultAnimationPreset, type AnimationPresetName } from "@/components/sections/animationPresets";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { addDoc, collection, getDocs, getFirestore, limit, query, serverTimestamp, where } from "firebase/firestore";
import { ensureFirebaseDevAuth, getFirebaseApp } from "@/lib/firebaseClient";
import { getAuth } from "firebase/auth";
import type { ComponentRecord } from "@/lib/admin/components";
import type { RedirectRule } from "@/lib/admin/pages";
import { MediaSelect, type MediaOption } from "./MediaSelect";
import { localAuthBypassEnabled } from "@/lib/localAuthBypass";

type PendingBlock = {
  id: string;
  type: "pending";
  adminLabel?: string;
};

type EditableBlock = BlockRecord | PendingBlock;
type HeroLikeBlock = HeroBlock | ThirdsBlock;

export type PageFormState = Omit<PageRecord, "id" | "blocks"> & { id?: string; blocks: EditableBlock[] };

type SubmitLabel = {
  idle: string;
  loading: string;
};

type PageFormProps = {
  initialState: PageFormState;
  onSubmit: (values: PageFormState) => Promise<void>;
  isSubmitting: boolean;
  backHref: Route;
  heading?: string;
  intro?: string;
  submitLabel: SubmitLabel;
  message?: string | null;
  onDelete?: () => Promise<void>;
  deleteLabel?: SubmitLabel;
  isDeleting?: boolean;
};

type MediaTarget = "media" | "background";

function AlignmentSelect({
  value,
  onChange
}: {
  value: HeroLikeBlock["alignment"];
  onChange: (next: HeroLikeBlock["alignment"]) => void;
}) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontSize: 14 }}>Alignment</span>
      <select value={value} onChange={(e) => onChange(e.target.value as HeroLikeBlock["alignment"])}>
        <option value="image_left">Image left</option>
        <option value="image_right">Image right</option>
        <option value="centered">Centered</option>
      </select>
    </label>
  );
}

const isHeroBlock = (block: EditableBlock): block is HeroBlock => block.type === "hero";
const isThirdsBlock = (block: EditableBlock): block is ThirdsBlock => block.type === "thirds";
const isHeroLikeBlock = (block: EditableBlock): block is HeroLikeBlock => isHeroBlock(block) || isThirdsBlock(block);
const isStoryBlock = (block: EditableBlock): block is StoryBlock => block.type === "story";
const isSplitBlock = (block: EditableBlock): block is SplitBlock => block.type === "split";
const isFeaturesBlock = (block: EditableBlock): block is FeaturesBlock => block.type === "features";
const isScrollGalleryBlock = (block: EditableBlock): block is ScrollGalleryBlock => block.type === "scroll_gallery";
const isShowcaseBlock = (block: EditableBlock): block is ShowcaseBlock => block.type === "showcase";
const isLogosBlock = (block: EditableBlock): block is LogosBlock => block.type === "logos";
const isContactBlock = (block: EditableBlock): block is ContactBlock => block.type === "contact";
const isFeatureItemsBlock = (block: EditableBlock): block is FeaturesBlock | ScrollGalleryBlock =>
  isFeaturesBlock(block) || isScrollGalleryBlock(block);
const isAnimatedHeadlineBlock = (block: EditableBlock): block is AnimatedHeadlineBlock => block.type === "animated_headline";
const isPendingBlock = (block: EditableBlock): block is PendingBlock => block.type === "pending";

const ChevronIcon = ({
  direction = "down",
  size = 18
}: {
  direction?: "down" | "up";
  size?: number;
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      transform: direction === "up" ? "rotate(180deg)" : "none",
      transition: "transform 0.18s ease",
      display: "block"
    }}
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const GripIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: "block" }}
  >
    <path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01" />
  </svg>
);

const newPendingBlock = (): PendingBlock => ({
  id: crypto.randomUUID(),
  type: "pending",
  adminLabel: ""
});

const newHeroBlock = (): HeroBlock => ({
  id: crypto.randomUUID(),
  type: "hero",
  adminLabel: "Hero block",
  eyebrow: "",
  title: "Hero title",
  subtitle: "",
  primaryCtaLabel: "",
  primaryCtaHref: "",
  secondaryCtaLabel: "",
  secondaryCtaHref: "",
  alignment: "centered",
  background: undefined,
  overlayStyle: "gradient",
  enableDarkModeOnScroll: false,
  mode: "static",
  mediaIndustryTag: "",
  mediaTypeTag: "",
  mediaLimit: 18
});

const newThirdsBlock = (): ThirdsBlock => ({
  ...newHeroBlock(),
  id: crypto.randomUUID(),
  type: "thirds",
  adminLabel: "Thirds block",
  layout: "left"
});

const newStoryBlock = (): StoryBlock => ({
  id: crypto.randomUUID(),
  type: "story",
  adminLabel: "Story block",
  heading: "Story heading",
  body: "",
  variant: "single_column",
  sections: [{ title: "New section", body: "" }],
  enableDarkModeOnScroll: false
});

const newSplitBlock = (): SplitBlock => ({
  id: crypto.randomUUID(),
  type: "split",
  adminLabel: "Split block",
  eyebrow: "",
  heading: "Split block heading",
  body: "Supporting text sits opposite the media.",
  mediaSide: "right",
  ctaLabel: "",
  ctaHref: "",
  enableDarkModeOnScroll: false
});

const newAnimatedHeadlineBlock = (): AnimatedHeadlineBlock => ({
  id: crypto.randomUUID(),
  type: "animated_headline",
  adminLabel: "Animated headline",
  headline: "Animated headline",
  subtext: "Optional supporting line that animates with the headline.",
  animationStyle: "fade_by_word",
  animationMode: "viewport",
  freezeOnScroll: false,
  enableDarkModeOnScroll: false
});

const newFeaturesBlock = (): FeaturesBlock => ({
  id: crypto.randomUUID(),
  type: "features",
  adminLabel: "Features block",
  eyebrow: "Highlights",
  heading: "Feature block heading",
  body: "Describe the value these features deliver.",
  columns: 3,
  items: [
    { title: "Feature 1", body: "Short description of this capability.", badge: "New" },
    { title: "Feature 2", body: "Another concise highlight with context." },
    { title: "Feature 3", body: "Keep these tight; 2–3 sentences max." }
  ],
  enableDarkModeOnScroll: false
});

const newLogosBlock = (): LogosBlock => ({
  id: crypto.randomUUID(),
  type: "logos",
  adminLabel: "Logos block",
  eyebrow: "Logos",
  heading: "Trusted by teams that ship bold stories",
  limit: 12,
  enableDarkModeOnScroll: false
});

const newScrollGalleryBlock = (): ScrollGalleryBlock => ({
  id: crypto.randomUUID(),
  type: "scroll_gallery",
  adminLabel: "Scroll gallery",
  eyebrow: "Gallery",
  heading: "Full-bleed scroll gallery",
  body: "Swipe through horizontally scrolling cards.",
  items: [
    { title: "Story 1", body: "First card description.", badge: "New" },
    { title: "Story 2", body: "Second card description." },
    { title: "Story 3", body: "Third card description." }
  ],
  enableDarkModeOnScroll: false
});

const newShowcaseBlock = (): ShowcaseBlock => ({
  id: crypto.randomUUID(),
  type: "showcase",
  adminLabel: "Showcase",
  eyebrow: "Media showcase",
  heading: "Stack of recent work",
  subhead: "Pulled live from the media library.",
  typeFilter: "",
  industryFilter: "",
  limit: 6,
  featuredOnly: false,
  animationPreset: defaultAnimationPreset,
  enableDarkModeOnScroll: false
});

const newContactBlock = (): ContactBlock => ({
  id: crypto.randomUUID(),
  type: "contact",
  adminLabel: "Contact block",
  eyebrow: "Contact",
  heading: "Plan your launch with Studio Tak",
  body: "Tell us about your product, timeline, and the outcomes you want. We'll follow up with a focused plan.",
  anchor: "contact",
  media: undefined,
  formId: "bb99355b-ad00-407a-81e7-882535a3c4be",
  portalId: "244262601",
  region: "na2",
  formScriptSrc: "https://js-na2.hsforms.net/forms/embed/244262601.js",
  enableDarkModeOnScroll: false
});

const normalizeSlugLocal = (slug: string) => {
  const trimmed = slug.trim();
  if (!trimmed) return "/";
  const withLeading = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  const withoutTrailing = withLeading.replace(/\/+$/, "");
  return withoutTrailing || "/";
};

const canonicalFromSlug = (slug: string, siteBase: string) => {
  const base = siteBase.replace(/\/+$/, "");
  const normalized = normalizeSlugLocal(slug);
  return `${base}${normalized}`;
};

const withDefaults = (state: PageFormState): PageFormState => ({
  ...state,
  blocks: state.blocks ?? [],
  seoTitle: state.seoTitle ?? "",
  metaDescription: state.metaDescription ?? "",
  canonicalUrl: state.canonicalUrl ?? "",
  noindex: state.noindex ?? false,
  nofollow: state.nofollow ?? false,
  ogTitle: state.ogTitle ?? "",
  ogDescription: state.ogDescription ?? "",
  socialImage: state.socialImage ?? { url: "", alt: "", type: "image" },
  twitterTitle: state.twitterTitle ?? "",
  twitterDescription: state.twitterDescription ?? "",
  jsonLd: state.jsonLd ?? "",
  sitemapExclude: state.sitemapExclude ?? false,
  focusKeyword: state.focusKeyword ?? "",
  internalLinks: state.internalLinks ?? [],
  redirects: state.redirects ?? []
});

export function PageForm({
  initialState,
  onSubmit,
  isSubmitting,
  backHref,
  heading,
  intro = "Pages hold an ordered stack of blocks. Blocks contain their own sections and CTAs.",
  submitLabel,
  message,
  onDelete,
  deleteLabel,
  isDeleting
}: PageFormProps) {
  const [formState, setFormState] = useState<PageFormState | null>(withDefaults(initialState));
  const [openBlocks, setOpenBlocks] = useState<Set<string>>(new Set());
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [uploadingBlock, setUploadingBlock] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [shareUploadBusy, setShareUploadBusy] = useState<boolean>(false);
  const [hasSpinnerStyles, setHasSpinnerStyles] = useState(false);
  const [mediaOptions, setMediaOptions] = useState<MediaOption[]>([]);
  const [mediaSearch, setMediaSearch] = useState("");
  const { data: componentsData } = useList<ComponentRecord>({ resource: "components", pagination: { pageSize: 100 } });
  const componentLibrary = componentsData?.data ?? [];
  const [componentSelections, setComponentSelections] = useState<Record<string, string>>({});
  const [mediaModal, setMediaModal] = useState<{
    open: boolean;
    blockIdx: number | null;
    target: MediaTarget;
    filterType?: "image" | "video";
  }>({
    open: false,
    blockIdx: null,
    target: "media"
  });
  const [seoOpen, setSeoOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setFormState(withDefaults(initialState));
    setOpenBlocks(new Set());
  }, [initialState]);

  useEffect(() => {
    setHasSpinnerStyles(true);
  }, []);

  const fetchMediaOptions = useMemo(
    () => async () => {
      if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) return;
      try {
        const db = getFirestore(getFirebaseApp());
        const mediaRef = collection(db, "media");
        const q = query(mediaRef, limit(100));
        const snapshot = await getDocs(q);
        const options: MediaOption[] = snapshot.docs.map((doc) => {
          const data = doc.data() as any;
          return {
            id: doc.id,
            name: data.name ?? doc.id,
            url: data.url,
            mediaType: data.mediaType ?? data.type ?? "image"
          };
        });
        setMediaOptions(options);
      } catch (err) {
        console.error("Failed to load media options", err);
      }
    },
    []
  );

  useEffect(() => {
    fetchMediaOptions();
  }, [fetchMediaOptions]);

  const handleBasicChange = (field: keyof PageFormState, value: string | PageStatus) => {
    setFormState((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleInternalLinksChange = (value: string) => {
    const links = value
      .split(/[\n,]/)
      .map((link) => link.trim())
      .filter(Boolean);
    setFormState((prev) => (prev ? { ...prev, internalLinks: links } : prev));
  };

  const handleRedirectChange = (idx: number, field: "from" | "to", value: string) => {
    setFormState((prev) => {
      if (!prev) return prev;
      const next: RedirectRule[] = [...(prev.redirects ?? [])];
      next[idx] = { ...next[idx], [field]: value };
      return { ...prev, redirects: next };
    });
  };

  const handleRedirectTypeChange = (idx: number, value: RedirectRule["type"]) => {
    setFormState((prev) => {
      if (!prev) return prev;
      const next: RedirectRule[] = [...(prev.redirects ?? [])];
      next[idx] = { ...next[idx], type: value };
      return { ...prev, redirects: next };
    });
  };

  const addRedirect = () => {
    setFormState((prev) => {
      if (!prev) return prev;
      const next: RedirectRule[] = [...(prev.redirects ?? []), { from: "", to: "", type: "permanent" }];
      return { ...prev, redirects: next };
    });
  };

  const removeRedirect = (idx: number) => {
    setFormState((prev) => {
      if (!prev) return prev;
      const next = (prev.redirects ?? []).filter((_, i) => i !== idx);
      return { ...prev, redirects: next };
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formState) return;
    if ((formState.blocks ?? []).some(isPendingBlock)) {
      setFormError("Choose a block type for each block before saving.");
      setOpenBlocks(new Set((formState.blocks ?? []).map((block) => block.id)));
      return;
    }
    setFormError(null);
    await onSubmit({
      ...formState,
      blocks: formState.blocks as BlockRecord[],
      updatedAt: new Date().toISOString()
    });
  };

  const updateBlock = (idx: number, updater: (block: EditableBlock) => EditableBlock) => {
    setFormState((prev) => {
      if (!prev) return prev;
      const nextBlocks = [...prev.blocks];
      nextBlocks[idx] = updater(nextBlocks[idx]);
      return { ...prev, blocks: nextBlocks };
    });
  };

  const handleBlockTypeChange = (idx: number, nextType: EditableBlock["type"]) => {
    setFormError(null);
    const buildBlock = (type: Exclude<EditableBlock["type"], "pending">): BlockRecord => {
      switch (type) {
        case "hero":
          return newHeroBlock();
        case "thirds":
          return newThirdsBlock();
        case "story":
          return newStoryBlock();
        case "split":
          return newSplitBlock();
        case "features":
          return newFeaturesBlock();
        case "logos":
          return newLogosBlock();
        case "scroll_gallery":
          return newScrollGalleryBlock();
        case "showcase":
          return newShowcaseBlock();
        case "contact":
          return newContactBlock();
        case "animated_headline":
          return newAnimatedHeadlineBlock();
        default:
          return newStoryBlock();
      }
    };
    updateBlock(idx, (block) => {
      if (block.type === nextType) return block;
      const label = block.adminLabel;
      if (nextType === "pending") {
        return { ...newPendingBlock(), id: block.id, adminLabel: label };
      }
      if (
        !isPendingBlock(block) &&
        ((block.type === "hero" && nextType === "thirds") || (block.type === "thirds" && nextType === "hero"))
      ) {
        const base = { ...block, type: nextType, adminLabel: label };
        if (nextType === "thirds") {
          return { ...base, layout: isThirdsBlock(block) ? block.layout ?? "left" : "left" };
        }
        const { layout: _layout, ...rest } = base as ThirdsBlock;
        return rest;
      }
      if (isPendingBlock(block)) {
        return { ...buildBlock(nextType as BlockRecord["type"]), id: block.id, adminLabel: label };
      }
      const replacement = buildBlock(nextType as BlockRecord["type"]);
      return { ...replacement, id: block.id, adminLabel: label };
    });
  };

  const handleHeroFieldChange = (
    idx: number,
    field: keyof Omit<HeroLikeBlock, "id" | "type" | "media" | "alignment" | "background">,
    value: HeroLikeBlock[keyof Omit<HeroLikeBlock, "id" | "type" | "media" | "alignment" | "background">]
  ) => {
    updateBlock(idx, (block) => (isHeroLikeBlock(block) ? { ...block, [field]: value } : block));
  };

  const handleHeroAlignmentChange = (idx: number, alignment: HeroLikeBlock["alignment"]) => {
    updateBlock(idx, (block) => (isHeroLikeBlock(block) ? { ...block, alignment } : block));
  };

  const handleThirdsLayoutChange = (idx: number, layout: NonNullable<ThirdsBlock["layout"]>) => {
    updateBlock(idx, (block) => (isThirdsBlock(block) ? { ...block, layout } : block));
  };

  const handleStoryFieldChange = (
    idx: number,
    field: keyof Omit<StoryBlock, "id" | "type" | "media" | "variant" | "sections">,
    value: StoryBlock[keyof Omit<StoryBlock, "id" | "type" | "media" | "variant" | "sections">]
  ) => {
    updateBlock(idx, (block) => (isStoryBlock(block) ? { ...block, [field]: value } : block));
  };

  const handleStoryVariantChange = (idx: number, variant: StoryBlock["variant"]) => {
    updateBlock(idx, (block) => (isStoryBlock(block) ? { ...block, variant } : block));
  };

  const handleSplitFieldChange = (
    idx: number,
    field: keyof Omit<SplitBlock, "id" | "type" | "media">,
    value: SplitBlock[keyof Omit<SplitBlock, "id" | "type" | "media">]
  ) => {
    updateBlock(idx, (block) => (isSplitBlock(block) ? { ...block, [field]: value } : block));
  };

  const handleAnimatedHeadlineFieldChange = (
    idx: number,
    field: keyof Omit<AnimatedHeadlineBlock, "id" | "type">,
    value: AnimatedHeadlineBlock[keyof Omit<AnimatedHeadlineBlock, "id" | "type">]
  ) => {
    updateBlock(idx, (block) => (isAnimatedHeadlineBlock(block) ? { ...block, [field]: value } : block));
  };

  const handleFeaturesFieldChange = (
    idx: number,
    field: keyof Omit<FeaturesBlock, "id" | "type" | "items">,
    value: FeaturesBlock[keyof Omit<FeaturesBlock, "id" | "type" | "items">]
  ) => {
    updateBlock(idx, (block) => (isFeaturesBlock(block) ? { ...block, [field]: value } : block));
  };

  const handleScrollGalleryFieldChange = (
    idx: number,
    field: keyof Omit<ScrollGalleryBlock, "id" | "type" | "items">,
    value: ScrollGalleryBlock[keyof Omit<ScrollGalleryBlock, "id" | "type" | "items">]
  ) => {
    updateBlock(idx, (block) => (isScrollGalleryBlock(block) ? { ...block, [field]: value } : block));
  };

  const handleLogosFieldChange = (
    idx: number,
    field: keyof Omit<LogosBlock, "id" | "type">,
    value: LogosBlock[keyof Omit<LogosBlock, "id" | "type">]
  ) => {
    updateBlock(idx, (block) => (isLogosBlock(block) ? { ...block, [field]: value } : block));
  };

  const handleShowcaseFieldChange = (
    idx: number,
    field: keyof Omit<ShowcaseBlock, "id" | "type">,
    value: ShowcaseBlock[keyof Omit<ShowcaseBlock, "id" | "type">]
  ) => {
    updateBlock(idx, (block) => (isShowcaseBlock(block) ? { ...block, [field]: value } : block));
  };

  const handleContactFieldChange = (
    idx: number,
    field: keyof Omit<ContactBlock, "id" | "type" | "media">,
    value: ContactBlock[keyof Omit<ContactBlock, "id" | "type" | "media">]
  ) => {
    updateBlock(idx, (block) => (isContactBlock(block) ? { ...block, [field]: value } : block));
  };

  const addFeatureItem = (idx: number) => {
    updateBlock(idx, (block) => {
      if (!isFeatureItemsBlock(block)) return block;
      const nextItems = [...(block.items ?? []), { title: "New feature", body: "Brief description" }];
      return { ...block, items: nextItems };
    });
  };

  const addFeatureFromComponent = (idx: number, componentId: string) => {
    const component = componentLibrary.find((item) => item.id === componentId);
    if (!component) return;
    const nextItem: FeatureItem = {
      title: component.title,
      body: component.body,
      icon: component.icon,
      industry: component.industry,
      type: component.type,
      componentId: component.id
    };
    updateBlock(idx, (block) => {
      if (!isFeatureItemsBlock(block)) return block;
      return { ...block, items: [...(block.items ?? []), nextItem] };
    });
  };

  const updateFeatureItem = (blockIdx: number, itemIdx: number, field: keyof FeatureItem, value: string) => {
    updateBlock(blockIdx, (block) => {
      if (!isFeatureItemsBlock(block)) return block;
      const items = [...(block.items ?? [])];
      items[itemIdx] = { ...items[itemIdx], [field]: value };
      return { ...block, items };
    });
  };

  const removeFeatureItem = (blockIdx: number, itemIdx: number) => {
    updateBlock(blockIdx, (block) => {
      if (!isFeatureItemsBlock(block)) return block;
      return { ...block, items: (block.items ?? []).filter((_, idx) => idx !== itemIdx) };
    });
  };

  const handleBlockLabelChange = (idx: number, value: string) => {
    updateBlock(idx, (block) => ({ ...block, adminLabel: value }));
  };

  const handleMediaChange = (idx: number, field: "url" | "alt" | "type", value: string) => {
    updateBlock(idx, (block) => {
      if (!("media" in block)) return block;
      const media = { ...(block.media ?? { url: "", alt: "", type: "image" }), [field]: value };
      return { ...block, media };
    });
  };

  const handleMediaUpload = async (idx: number, file: File, target: MediaTarget = "media") => {
    if (!formState) return;
    setUploadError(null);
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
      setUploadError("Configure Firebase to upload media.");
      return;
    }
    const block = formState.blocks[idx];
    const blockId = block.id ?? `block-${idx}`;
    const uploadKey = `${blockId}-${target}`;
    try {
      setUploadingBlock(uploadKey);
      const isVideo = file.type.startsWith("video");
      await ensureFirebaseDevAuth();
      const app = getFirebaseApp();
      if (!localAuthBypassEnabled) {
        const auth = getAuth(app);
        if (!auth.currentUser) {
          setUploadError("Sign in to upload media.");
          return;
        }
      }
      const storage = getStorage(app);
      const db = getFirestore(app);
      const path = `block-media/${Date.now()}-${file.name}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      const updatedMedia: BlockMedia = {
        url,
        alt: file.name,
        type: isVideo ? "video" : "image"
      };
      updateBlock(idx, (current) => {
        if (target === "background" && isHeroLikeBlock(current)) {
          return { ...current, background: updatedMedia };
        }
        return { ...current, media: updatedMedia };
      });

      await addDoc(collection(db, "media"), {
        name: file.name,
        url,
        industry: `Page: ${formState.title || "Untitled"}`,
        type: block.type,
        alt: file.name,
        mediaType: updatedMedia.type,
        uploadedAt: serverTimestamp()
      });
      await fetchMediaOptions();
    } catch (err: any) {
      console.error("Media upload failed", err);
      setUploadError(err?.message ?? "Upload failed");
    } finally {
      setUploadingBlock(null);
    }
  };

  const handleShareMediaChange = (field: keyof NonNullable<PageFormState["socialImage"]>, value: string) => {
    setFormState((prev) => {
      if (!prev) return prev;
      const current = prev.socialImage ?? { url: "", alt: "", type: "image" };
      return { ...prev, socialImage: { ...current, [field]: value } };
    });
  };

  const handleShareUpload = async (file: File) => {
    if (!formState) return;
    setUploadError(null);
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
      setUploadError("Configure Firebase to upload media.");
      return;
    }
    try {
      setShareUploadBusy(true);
      await ensureFirebaseDevAuth();
      const app = getFirebaseApp();
      if (!localAuthBypassEnabled) {
        const auth = getAuth(app);
        if (!auth.currentUser) {
          setUploadError("Sign in to upload media.");
          return;
        }
      }
      const storage = getStorage(app);
      const db = getFirestore(app);
      const path = `social-media/${Date.now()}-${file.name}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      const mediaPayload = {
        url,
        alt: file.name,
        type: file.type.startsWith("video") ? "video" : "image"
      } as const;
      setFormState((prev) => (prev ? { ...prev, socialImage: mediaPayload } : prev));

      await addDoc(collection(db, "media"), {
        name: file.name,
        url,
        industry: `Page social: ${formState.title || "Untitled"}`,
        type: "social",
        alt: file.name,
        mediaType: mediaPayload.type,
        uploadedAt: serverTimestamp()
      });
      await fetchMediaOptions();
    } catch (err: any) {
      console.error("Social image upload failed", err);
      setUploadError(err?.message ?? "Upload failed");
    } finally {
      setShareUploadBusy(false);
    }
  };

  const addBlock = () => {
    const block = newPendingBlock();
    setFormState((prev) => (prev ? { ...prev, blocks: [...prev.blocks, block] } : prev));
    setOpenBlocks((prev) => new Set(prev).add(block.id));
  };

  const buildSeoSuggestions = (state: PageFormState) => {
    const hero = (state.blocks ?? []).find(isHeroLikeBlock);
    const story = (state.blocks ?? []).find(isStoryBlock);
    const split = (state.blocks ?? []).find(isSplitBlock);
    const contact = (state.blocks ?? []).find(isContactBlock);
    const title = hero?.title?.trim() || state.title?.trim() || "Page";
    const descParts = [
      hero?.subtitle,
      story?.body,
      split?.body,
      contact?.body,
      ...(story?.sections ?? []).map((section) => `${section.title ?? ""} ${section.body ?? ""}`)
    ]
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    const desc = descParts ? `${descParts.slice(0, 170)}${descParts.length > 170 ? "…" : ""}` : "";
    const siteBase = process.env.NEXT_PUBLIC_SITE_URL ?? "https://studio-tak.example";
    return {
      seoTitle: title,
      metaDescription: desc,
      ogTitle: title,
      ogDescription: desc,
      twitterTitle: title,
      twitterDescription: desc,
      focusKeyword: state.focusKeyword?.trim() || title.split(" ").slice(0, 3).join(" "),
      canonicalUrl: canonicalFromSlug(state.slug ?? "", siteBase)
    };
  };

  const handleAutofillSeo = () => {
    setFormState((prev) => {
      if (!prev) return prev;
      const suggestions = buildSeoSuggestions(prev);
      return { ...prev, ...suggestions };
    });
    setSeoOpen(true);
  };

  const removeBlock = (idx: number) => {
    setFormState((prev) => {
      if (!prev) return prev;
      const target = prev.blocks[idx];
      const nextBlocks = prev.blocks.filter((_, i) => i !== idx);
      setOpenBlocks((open) => {
        const next = new Set(open);
        next.delete(target?.id ?? `block-${idx}`);
        return next;
      });
      return { ...prev, blocks: nextBlocks };
    });
  };

  const addSectionToBlock = (idx: number) => {
    updateBlock(idx, (block) => {
      if (!isStoryBlock(block)) return block;
      const sections = block.sections ?? [];
      return { ...block, sections: [...sections, { title: "New section", body: "" }] };
    });
  };

  const handleSectionChange = (blockIdx: number, sectionIdx: number, field: "title" | "body", value: string) => {
    updateBlock(blockIdx, (block) => {
      if (!isStoryBlock(block)) return block;
      const sections = block.sections ?? [];
      const nextSections = [...sections];
      nextSections[sectionIdx] = { ...nextSections[sectionIdx], [field]: value };
      return { ...block, sections: nextSections };
    });
  };

  const removeSectionFromBlock = (blockIdx: number, sectionIdx: number) => {
    updateBlock(blockIdx, (block) => {
      if (!isStoryBlock(block)) return block;
      const sections = block.sections ?? [];
      return { ...block, sections: sections.filter((_, idx) => idx !== sectionIdx) };
    });
  };

  const moveBlockToIndex = (from: number, to: number) => {
    setFormState((prev) => {
      if (!prev) return prev;
      if (from === to) return prev;
      const nextBlocks = [...prev.blocks];
      const [moved] = nextBlocks.splice(from, 1);
      nextBlocks.splice(to, 0, moved);
      return { ...prev, blocks: nextBlocks };
    });
  };

  const toggleBlockOpen = (id: string) => {
    setOpenBlocks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const iconButtonStyle = {
    width: 34,
    height: 32,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
    color: "var(--foreground)"
  } as const;

  const renderMediaThumb = (media?: { url?: string; type?: string; alt?: string } | null, loading?: boolean) => {
    if (!media?.url) {
      return (
        <div
          style={{
            width: "100%",
            aspectRatio: "4 / 3",
            borderRadius: 10,
            border: "1px dashed var(--border)",
            display: "grid",
            placeItems: "center",
            color: "var(--muted)",
            fontSize: 13,
            background: "rgba(255,255,255,0.02)"
          }}
        >
          {loading ? (
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                border: "2px solid var(--border)",
                borderTopColor: "var(--accent)",
                animation: "admin-spin 0.9s linear infinite"
              }}
            />
          ) : (
            "No media yet"
          )}
        </div>
      );
    }
    if ((media.type ?? "").startsWith("video")) {
      return (
        <video
          src={media.url}
          controls
          style={{
            width: "100%",
            borderRadius: 10,
            border: "1px solid var(--border)"
          }}
        />
      );
    }
    return (
      <img
        src={media.url}
        alt={media.alt ?? ""}
        style={{
          width: "100%",
          borderRadius: 10,
          border: "1px solid var(--border)",
          objectFit: "cover",
          aspectRatio: "4 / 3"
        }}
      />
    );
  };

  const MediaField = ({
    blockId,
    blockIdx,
    media,
    uploading,
    uploadError,
    onUpload,
    onOpenPicker,
    label = "Media",
    helperText,
    target = "media",
    accept = "image/*,video/*",
    pickerFilter,
    showAlignment = false,
    alignment,
  onAlignmentChange,
  onClear
}: {
    blockId: string;
    blockIdx: number;
    media: HeroLikeBlock["media"] | StoryBlock["media"] | null | undefined;
    uploading: boolean;
    uploadError: string | null;
    onUpload: (idx: number, file: File, target?: MediaTarget) => void;
    onOpenPicker: (target: MediaTarget, filterType?: "image" | "video") => void;
    label?: string;
    helperText?: string;
    target?: MediaTarget;
    accept?: string;
    pickerFilter?: "image" | "video";
    showAlignment?: boolean;
    alignment?: HeroLikeBlock["alignment"];
    onAlignmentChange?: (val: HeroLikeBlock["alignment"]) => void;
    onClear?: () => void;
  }) => (
    <div className="card" style={{ padding: 12, border: "1px solid var(--border-strong)", display: "grid", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "grid", gap: 4 }}>
          <strong>{label}</strong>
          {helperText ? <span style={{ color: "var(--muted)", fontSize: 13 }}>{helperText}</span> : null}
        </div>
        {showAlignment && alignment && onAlignmentChange ? (
          <AlignmentSelect value={alignment} onChange={onAlignmentChange} />
        ) : null}
      </div>
      {renderMediaThumb(media, uploading)}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button
          type="button"
          className="btn secondary"
          disabled={uploading}
          onClick={() => document.getElementById(`upload-${blockId}-${target}`)?.click()}
        >
          {uploading ? "Uploading…" : "Upload file"}
        </button>
        <input
          id={`upload-${blockId}-${target}`}
          type="file"
          accept={accept}
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(blockIdx, file, target);
          }}
        />
        <button type="button" className="btn secondary" onClick={() => onOpenPicker(target, pickerFilter)}>
          Choose existing
        </button>
        {media?.url ? (
          <button type="button" className="btn secondary" onClick={onClear}>
            Remove
          </button>
        ) : null}
      </div>
      {uploadError && !uploading ? <span style={{ color: "var(--accent)", fontSize: 13 }}>{uploadError}</span> : null}
    </div>
  );

  const MediaRow = ({
    children,
    secondary
  }: {
    children: React.ReactNode;
    secondary?: React.ReactNode;
  }) => (
    <div
      className="grid"
      style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, alignItems: "start" }}
    >
      {children}
      {secondary ?? <div style={{ minHeight: 1 }} />}
    </div>
  );

  const warnings = useMemo(() => {
    if (!formState) return [];
    const list: string[] = [];
    const titleLength = formState.seoTitle?.trim().length ?? 0;
    const descLength = formState.metaDescription?.trim().length ?? 0;
    if (titleLength > 0 && (titleLength < 30 || titleLength > 65)) {
      list.push("SEO title is outside the ideal 30-65 character range.");
    }
    if (descLength === 0) {
      list.push("Add a meta description to improve click-through rate.");
    } else if (descLength < 110 || descLength > 175) {
      list.push("Meta description length is outside the typical 110-175 character range.");
    }
    const missingAlt = (formState.blocks ?? []).some(
      (block) => ("media" in block && block.media?.url && !block.media?.alt) || ("background" in block && block.background?.url && !block.background?.alt)
    );
    if (missingAlt) {
      list.push("At least one media item is missing alt text.");
    }
    if (formState.jsonLd) {
      try {
        JSON.parse(formState.jsonLd);
      } catch {
        list.push("JSON-LD is not valid JSON.");
      }
    }
    return list;
  }, [formState]);

  const blockFields =
    formState?.blocks.map((block, idx) => {
      const baseLabel = isPendingBlock(block)
        ? "New block"
        : block.type === "hero"
        ? "Hero block"
        : block.type === "thirds"
        ? "Thirds block"
        : block.type === "story"
        ? "Story / Text block"
        : block.type === "split"
        ? "Split block"
        : block.type === "features"
        ? "Features block"
        : block.type === "scroll_gallery"
        ? "Scroll gallery"
        : block.type === "showcase"
        ? "Showcase"
        : block.type === "logos"
        ? "Logos block"
        : block.type === "contact"
        ? "Contact block"
        : "Animated headline";
      const blockLabel = block.adminLabel?.trim() || baseLabel;
      const blockId = block.id ?? `block-${idx}`;
      const isOpen = openBlocks.has(blockId);
      const thirdsLayout = block.type === "thirds" ? block.layout ?? "left" : "left";
      const heroMode = isHeroLikeBlock(block) ? block.mode ?? "static" : "static";
      const showDynamicHeroMode = block.type === "hero";
      return (
        <div
          key={block.id ?? idx}
          className="card"
          style={{
            padding: 0,
            border: "1.5px solid var(--border-strong)",
            boxShadow: "none"
          }}
          draggable
          onDragStart={() => setDragIndex(idx)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (dragIndex !== null) {
              moveBlockToIndex(dragIndex, idx);
            }
            setDragIndex(null);
          }}
          onDragEnd={() => setDragIndex(null)}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "56px minmax(0, 1fr) 160px 160px",
              alignItems: "center",
              gap: 12,
              padding: "10px 12px",
              background: "rgba(255,255,255,0.02)",
              borderBottom: isOpen ? "1px solid rgba(255,255,255,0.08)" : "none"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start" }}>
              <span
                aria-label="Drag to reorder"
                style={{ ...iconButtonStyle, cursor: "grab" }}
              >
                <GripIcon size={16} />
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <input
                className="input"
                value={block.adminLabel ?? ""}
                onChange={(e) => handleBlockLabelChange(idx, e.target.value)}
                placeholder={baseLabel}
                style={{ width: "100%", minWidth: 0 }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
              <select value={block.type} onChange={(e) => handleBlockTypeChange(idx, e.target.value as EditableBlock["type"])}>
                <option value="pending" disabled>
                  Select block type…
                </option>
                <option value="hero">Hero</option>
                <option value="thirds">Thirds</option>
                <option value="story">Story / Text</option>
                <option value="split">Split</option>
                <option value="features">Features</option>
                <option value="logos">Logos</option>
                <option value="scroll_gallery">Scroll gallery</option>
                <option value="showcase">Showcase</option>
                <option value="contact">Contact</option>
                <option value="animated_headline">Animated headline</option>
              </select>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button
                type="button"
                aria-label={isOpen ? "Collapse block" : "Expand block"}
                className="btn secondary"
                onClick={() => toggleBlockOpen(blockId)}
                style={iconButtonStyle}
              >
                <ChevronIcon direction={isOpen ? "up" : "down"} size={16} />
              </button>
              <button type="button" className="btn secondary" onClick={() => removeBlock(idx)}>
                Remove
              </button>
            </div>
          </div>

          {!isOpen ? null : isPendingBlock(block) ? (
            <div style={{ padding: 12, display: "grid", gap: 10 }}>
              <div className="card" style={{ padding: 12, display: "grid", gap: 6, border: "1px dashed var(--border-strong)" }}>
                <strong style={{ fontSize: 15 }}>Choose a block type to start editing</strong>
                <span style={{ color: "var(--muted)", fontSize: 13 }}>
                  Blocks stay empty until you pick a type above. After selecting, fields for that block will appear here.
                </span>
              </div>
            </div>
          ) : isHeroLikeBlock(block) ? (
            <div className="grid" style={{ gap: 12, padding: 12 }}>
              {block.type === "thirds" ? (
                <div className="card" style={{ padding: 10, border: "1px dashed var(--border-strong)" }}>
                  <span style={{ color: "var(--muted)", fontSize: 13 }}>
                    Thirds keeps the hero layout but uses a shorter, partial-height frame.
                  </span>
                </div>
              ) : null}
              {showDynamicHeroMode ? (
                <div className="grid" style={{ gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                  <div className="field-group">
                    <label>Hero media mode</label>
                    <select
                      value={heroMode}
                      onChange={(e) => handleHeroFieldChange(idx, "mode", e.target.value as HeroBlock["mode"])}
                    >
                      <option value="static">Static</option>
                      <option value="dynamic">Dynamic (tagged media)</option>
                    </select>
                    <span style={{ color: "var(--muted)", fontSize: 13 }}>
                      Switch to dynamic to auto-fill the hero with media that matches your tag filters below.
                    </span>
                  </div>
                  {heroMode === "dynamic" ? (
                    <>
                      <div className="field-group">
                        <label>Industry tag</label>
                        <input
                          className="input"
                          value={block.mediaIndustryTag ?? ""}
                          onChange={(e) => handleHeroFieldChange(idx, "mediaIndustryTag", e.target.value)}
                          placeholder="Fintech, SaaS"
                        />
                        <span style={{ color: "var(--muted)", fontSize: 12 }}>
                          Matches the Industry tag set on uploaded media.
                        </span>
                      </div>
                      <div className="field-group">
                        <label>Type tag</label>
                        <input
                          className="input"
                          value={block.mediaTypeTag ?? ""}
                          onChange={(e) => handleHeroFieldChange(idx, "mediaTypeTag", e.target.value)}
                          placeholder="Logo, Product"
                        />
                        <span style={{ color: "var(--muted)", fontSize: 12 }}>
                          Optional. Further narrow results using the Type tag.
                        </span>
                      </div>
                      <div className="field-group">
                        <label>Max items</label>
                        <input
                          className="input"
                          type="number"
                          min={6}
                          max={60}
                          value={block.mediaLimit ?? 18}
                          onChange={(e) => handleHeroFieldChange(idx, "mediaLimit", Number(e.target.value) || 0)}
                          placeholder="18"
                        />
                        <span style={{ color: "var(--muted)", fontSize: 12 }}>
                          Pulls up to this many matches to animate in the columns.
                        </span>
                      </div>
                    </>
                  ) : null}
                </div>
              ) : null}
              {block.type === "thirds" ? (
                <div className="field-group">
                  <label>Layout</label>
                  <select
                    value={thirdsLayout}
                    onChange={(e) => handleThirdsLayoutChange(idx, e.target.value as NonNullable<ThirdsBlock["layout"]>)}
                  >
                    <option value="left">Left</option>
                    <option value="centered">Centered</option>
                  </select>
                </div>
              ) : null}
              <div className="field-group">
                <label>Eyebrow</label>
                <input
                  className="input"
                  value={block.eyebrow ?? ""}
                  onChange={(e) => handleHeroFieldChange(idx, "eyebrow", e.target.value)}
                  placeholder="Page label"
                />
              </div>
              <div className="field-group">
                <label>Title</label>
                <input
                  className="input"
                  value={block.title}
                  onChange={(e) => handleHeroFieldChange(idx, "title", e.target.value)}
                  placeholder="Hero headline"
                />
              </div>
              <div className="field-group">
                <label>Subtitle</label>
                <textarea
                  rows={3}
                  value={block.subtitle ?? ""}
                  onChange={(e) => handleHeroFieldChange(idx, "subtitle", e.target.value)}
                  placeholder="Concise supporting copy"
                />
              </div>
              <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
                <div className="field-group">
                  <label>Primary CTA label</label>
                  <input
                    className="input"
                    value={block.primaryCtaLabel ?? ""}
                    onChange={(e) => handleHeroFieldChange(idx, "primaryCtaLabel", e.target.value)}
                    placeholder="Start a project"
                  />
                </div>
                <div className="field-group">
                  <label>Primary CTA href</label>
                  <input
                    className="input"
                    value={block.primaryCtaHref ?? ""}
                    onChange={(e) => handleHeroFieldChange(idx, "primaryCtaHref", e.target.value)}
                    placeholder="#contact"
                  />
                </div>
                <div className="field-group">
                  <label>Secondary CTA label</label>
                  <input
                    className="input"
                    value={block.secondaryCtaLabel ?? ""}
                    onChange={(e) => handleHeroFieldChange(idx, "secondaryCtaLabel", e.target.value)}
                    placeholder="View capabilities"
                  />
                </div>
                <div className="field-group">
                  <label>Secondary CTA href</label>
                  <input
                    className="input"
                    value={block.secondaryCtaHref ?? ""}
                    onChange={(e) => handleHeroFieldChange(idx, "secondaryCtaHref", e.target.value)}
                    placeholder="#capabilities"
                  />
                </div>
              </div>
              <MediaRow>
                {heroMode === "static" ? (
                  <MediaField
                    blockId={blockId}
                    blockIdx={idx}
                    media={block.media}
                    uploading={uploadingBlock === `${blockId}-media`}
                    uploadError={uploadError}
                    onUpload={handleMediaUpload}
                    onOpenPicker={(target, filterType) => setMediaModal({ open: true, blockIdx: idx, target, filterType })}
                    target="media"
                    showAlignment={block.type === "hero" || (block.type === "thirds" && thirdsLayout === "left")}
                    alignment={block.alignment}
                    onAlignmentChange={(next) => handleHeroAlignmentChange(idx, next)}
                    onClear={() =>
                      updateBlock(idx, (current) => ({
                        ...current,
                        media: undefined
                      }))
                    }
                  />
                ) : null}
                <MediaField
                  blockId={blockId}
                  blockIdx={idx}
                  media={block.background}
                  uploading={uploadingBlock === `${blockId}-background`}
                  uploadError={uploadError}
                  onUpload={handleMediaUpload}
                  onOpenPicker={(target, filterType) => setMediaModal({ open: true, blockIdx: idx, target, filterType })}
                  target="background"
                  label="Background media"
                  helperText="Optional. Adds a backdrop behind the hero content. Supports images or video."
                  accept="image/*,video/*"
                  onClear={() =>
                    updateBlock(idx, (current) => ({
                      ...current,
                      background: undefined
                    }))
                  }
                />
              </MediaRow>
              <div className="field-group">
                <label>Overlay style</label>
                <select
                  value={block.overlayStyle ?? "gradient"}
                  onChange={(e) => handleHeroFieldChange(idx, "overlayStyle", e.target.value)}
                >
                  <option value="gradient">Gradient</option>
                  <option value="full">Full</option>
                </select>
                <span style={{ color: "var(--muted)", fontSize: 13 }}>
                  Choose between the gradient overlay (clearer on the right) or a full overlay for maximum contrast.
                </span>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={!!block.enableDarkModeOnScroll}
                  onChange={(e) => handleHeroFieldChange(idx, "enableDarkModeOnScroll", e.target.checked)}
                />
                <span>Trigger dark mode while this hero is in view</span>
              </label>
            </div>
          ) : isSplitBlock(block) ? (
            <div className="grid" style={{ gap: 12, padding: 12 }}>
              <div className="grid" style={{ gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                <div className="field-group">
                  <label>Eyebrow</label>
                  <input
                    className="input"
                    value={block.eyebrow ?? ""}
                    onChange={(e) => handleSplitFieldChange(idx, "eyebrow", e.target.value)}
                    placeholder="Section label"
                  />
                </div>
                <div className="field-group">
                  <label>Media side</label>
                  <select
                    value={block.mediaSide ?? "right"}
                    onChange={(e) => handleSplitFieldChange(idx, "mediaSide", e.target.value as SplitBlock["mediaSide"])}
                  >
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                  </select>
                </div>
              </div>
              <div className="field-group">
                <label>Heading</label>
                <input
                  className="input"
                  value={block.heading}
                  onChange={(e) => handleSplitFieldChange(idx, "heading", e.target.value)}
                  placeholder="Split block heading"
                />
              </div>
              <div className="field-group">
                <label>Body</label>
                <textarea
                  rows={4}
                  value={block.body ?? ""}
                  onChange={(e) => handleSplitFieldChange(idx, "body", e.target.value)}
                  placeholder="Supporting copy that sits opposite the media"
                />
              </div>
              <div className="grid" style={{ gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
                <div className="field-group">
                  <label>CTA label</label>
                  <input
                    className="input"
                    value={block.ctaLabel ?? ""}
                    onChange={(e) => handleSplitFieldChange(idx, "ctaLabel", e.target.value)}
                    placeholder="View work"
                  />
                </div>
                <div className="field-group">
                  <label>CTA href</label>
                  <input
                    className="input"
                    value={block.ctaHref ?? ""}
                    onChange={(e) => handleSplitFieldChange(idx, "ctaHref", e.target.value)}
                    placeholder="/work"
                  />
                </div>
              </div>
              <MediaRow>
                <MediaField
                  blockId={blockId}
                  blockIdx={idx}
                  media={block.media}
                  uploading={uploadingBlock === `${blockId}-media`}
                  uploadError={uploadError}
                  onUpload={handleMediaUpload}
                  onOpenPicker={(target, filterType) => setMediaModal({ open: true, blockIdx: idx, target, filterType })}
                  onClear={() =>
                    updateBlock(idx, (current) => ({
                      ...current,
                      media: undefined
                    }))
                  }
                />
              </MediaRow>
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={!!block.enableDarkModeOnScroll}
                  onChange={(e) => handleSplitFieldChange(idx, "enableDarkModeOnScroll", e.target.checked)}
                />
                <span>Trigger dark mode while this block is in view</span>
              </label>
            </div>
          ) : isContactBlock(block) ? (
            <div className="grid" style={{ gap: 12, padding: 12 }}>
              <div className="grid" style={{ gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                <div className="field-group">
                  <label>Eyebrow</label>
                  <input
                    className="input"
                    value={block.eyebrow ?? ""}
                    onChange={(e) => handleContactFieldChange(idx, "eyebrow", e.target.value)}
                    placeholder="Contact"
                  />
                </div>
                <div className="field-group">
                  <label>Anchor ID</label>
                  <input
                    className="input"
                    value={block.anchor ?? ""}
                    onChange={(e) => handleContactFieldChange(idx, "anchor", e.target.value)}
                    placeholder="contact"
                  />
                  <span style={{ color: "var(--muted)", fontSize: 12 }}>Used for in-page links like #contact.</span>
                </div>
              </div>
              <div className="field-group">
                <label>Heading</label>
                <input
                  className="input"
                  value={block.heading}
                  onChange={(e) => handleContactFieldChange(idx, "heading", e.target.value)}
                  placeholder="Plan your launch"
                />
              </div>
              <div className="field-group">
                <label>Body</label>
                <textarea
                  rows={3}
                  value={block.body ?? ""}
                  onChange={(e) => handleContactFieldChange(idx, "body", e.target.value)}
                  placeholder="Tell visitors what happens after they submit."
                />
              </div>
              <div className="grid" style={{ gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                <div className="field-group">
                  <label>HubSpot portal ID</label>
                  <input
                    className="input"
                    value={block.portalId ?? ""}
                    onChange={(e) => handleContactFieldChange(idx, "portalId", e.target.value)}
                    placeholder="244262601"
                  />
                </div>
                <div className="field-group">
                  <label>Form ID</label>
                  <input
                    className="input"
                    value={block.formId ?? ""}
                    onChange={(e) => handleContactFieldChange(idx, "formId", e.target.value)}
                    placeholder="bb99355b-ad00-407a-81e7-882535a3c4be"
                  />
                </div>
                <div className="field-group">
                  <label>Region</label>
                  <input
                    className="input"
                    value={block.region ?? ""}
                    onChange={(e) => handleContactFieldChange(idx, "region", e.target.value)}
                    placeholder="na2"
                  />
                </div>
                <div className="field-group">
                  <label>Form script src</label>
                  <input
                    className="input"
                    value={block.formScriptSrc ?? ""}
                    onChange={(e) => handleContactFieldChange(idx, "formScriptSrc", e.target.value)}
                    placeholder="https://js-na2.hsforms.net/forms/embed/244262601.js"
                  />
                </div>
              </div>
              <MediaRow>
                <MediaField
                  blockId={blockId}
                  blockIdx={idx}
                  media={block.media}
                  uploading={uploadingBlock === `${blockId}-media`}
                  uploadError={uploadError}
                  onUpload={handleMediaUpload}
                  onOpenPicker={(target, filterType) => setMediaModal({ open: true, blockIdx: idx, target, filterType })}
                  onClear={() =>
                    updateBlock(idx, (current) => (isContactBlock(current) ? { ...current, media: undefined } : current))
                  }
                />
              </MediaRow>
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={!!block.enableDarkModeOnScroll}
                  onChange={(e) => handleContactFieldChange(idx, "enableDarkModeOnScroll", e.target.checked)}
                />
                <span>Trigger dark mode while this block is in view</span>
              </label>
              <div className="card" style={{ padding: 12, border: "1px dashed var(--border-strong)", display: "grid", gap: 6 }}>
                <strong style={{ fontSize: 14 }}>HubSpot embed</strong>
                <span style={{ color: "var(--muted)", fontSize: 13 }}>
                  Uses the HubSpot embed script and the <code>hs-form-frame</code> container to render the form alongside your media.
                </span>
              </div>
            </div>
          ) : isAnimatedHeadlineBlock(block) ? (
            <div className="grid" style={{ gap: 12, padding: 12 }}>
              <div className="field-group">
                <label>Headline</label>
                <input
                  className="input"
                  value={block.headline}
                  onChange={(e) => handleAnimatedHeadlineFieldChange(idx, "headline", e.target.value)}
                  placeholder="Animated headline"
                />
              </div>
              <div className="field-group">
                <label>Subtext (optional)</label>
                <textarea
                  rows={3}
                  value={block.subtext ?? ""}
                  onChange={(e) => handleAnimatedHeadlineFieldChange(idx, "subtext", e.target.value)}
                  placeholder="Short supporting line"
                />
              </div>
              <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                <div className="field-group">
                  <label>Animation style</label>
                  <select
                    value={block.animationStyle}
                    onChange={(e) => handleAnimatedHeadlineFieldChange(idx, "animationStyle", e.target.value)}
                  >
                    <option value="fade_by_word">Fade in by word</option>
                    <option value="slide_by_letter">Slide up by letter</option>
                    <option value="typewriter">Typewriter</option>
                    <option value="scramble">Scramble reveal</option>
                  </select>
                </div>
                <div className="field-group">
                  <label>Animation timing</label>
                  <select
                    value={block.animationMode}
                    onChange={(e) => handleAnimatedHeadlineFieldChange(idx, "animationMode", e.target.value)}
                  >
                    <option value="viewport">Play on enter</option>
                    <option value="scroll">Tied to scroll progress</option>
                  </select>
                </div>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={!!block.freezeOnScroll}
                  onChange={(e) => handleAnimatedHeadlineFieldChange(idx, "freezeOnScroll", e.target.checked)}
                />
                <span>Freeze while scrolling (pin until section ends)</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={!!block.enableDarkModeOnScroll}
                  onChange={(e) => handleAnimatedHeadlineFieldChange(idx, "enableDarkModeOnScroll", e.target.checked)}
                />
                <span>Trigger dark mode while this headline is in view</span>
              </label>
            </div>
          ) : isShowcaseBlock(block) ? (
            <div className="grid" style={{ gap: 12, padding: 12 }}>
              <div className="grid" style={{ gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
                <div className="field-group">
                  <label>Eyebrow</label>
                  <input
                    className="input"
                    value={block.eyebrow ?? ""}
                    onChange={(e) => handleShowcaseFieldChange(idx, "eyebrow", e.target.value)}
                    placeholder="Section label"
                  />
                </div>
                <div className="field-group">
                  <label>Title</label>
                  <input
                    className="input"
                    value={block.heading ?? ""}
                    onChange={(e) => handleShowcaseFieldChange(idx, "heading", e.target.value)}
                    placeholder="Showcase title"
                  />
                </div>
                <div className="field-group">
                  <label>Subhead</label>
                  <input
                    className="input"
                    value={block.subhead ?? ""}
                    onChange={(e) => handleShowcaseFieldChange(idx, "subhead", e.target.value)}
                    placeholder="Optional supporting line"
                  />
                </div>
                <div className="field-group">
                  <label>Type filter</label>
                  <input
                    className="input"
                    value={block.typeFilter}
                    onChange={(e) => handleShowcaseFieldChange(idx, "typeFilter", e.target.value)}
                    placeholder="Match the media 'type' field"
                  />
                  <span style={{ color: "var(--muted)", fontSize: 12 }}>
                    Only pulls media whose <code>type</code> equals this value.
                  </span>
                </div>
                <div className="field-group">
                  <label>Industry filter (optional)</label>
                  <input
                    className="input"
                    value={block.industryFilter ?? ""}
                    onChange={(e) => handleShowcaseFieldChange(idx, "industryFilter", e.target.value)}
                    placeholder="Fintech, SaaS…"
                  />
                  <span style={{ color: "var(--muted)", fontSize: 12 }}>Leave blank to ignore industry.</span>
                </div>
                <div className="field-group">
                  <label>Featured filter</label>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--muted)" }}>
                    <input
                      type="checkbox"
                      checked={!!block.featuredOnly}
                      onChange={(e) => handleShowcaseFieldChange(idx, "featuredOnly", e.target.checked)}
                    />
                    <span>Only pull featured media</span>
                  </label>
                  <span style={{ color: "var(--muted)", fontSize: 12 }}>Toggle to restrict the block to featured items.</span>
                </div>
                <div className="field-group">
                  <label>Results to show</label>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    max={24}
                    value={block.limit ?? 6}
                    onChange={(e) =>
                      handleShowcaseFieldChange(idx, "limit", Math.min(24, Math.max(1, Number(e.target.value) || 0)))
                    }
                    placeholder="6"
                  />
                </div>
                <div className="field-group">
                  <label>Animation preset</label>
                  <select
                    value={block.animationPreset ?? defaultAnimationPreset}
                    onChange={(e) => handleShowcaseFieldChange(idx, "animationPreset", e.target.value as AnimationPresetName)}
                  >
                    {Object.keys(animationPresets).map((preset) => (
                      <option key={preset} value={preset}>
                        {preset}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={!!block.enableDarkModeOnScroll}
                  onChange={(e) => handleShowcaseFieldChange(idx, "enableDarkModeOnScroll", e.target.checked)}
                />
                <span>Trigger dark mode while this block is in view</span>
              </label>
              <div className="card" style={{ padding: 12, border: "1px dashed var(--border-strong)" }}>
                <strong style={{ display: "block", marginBottom: 4 }}>Showcase pulls straight from Media</strong>
                <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>
                  Matching items animate in as overlapping cards. The block hides media titles and tags—only the visuals show.
                </p>
              </div>
            </div>
          ) : isLogosBlock(block) ? (
            <div className="grid" style={{ gap: 12, padding: 12 }}>
              <div className="grid" style={{ gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
                <div className="field-group">
                  <label>Eyebrow</label>
                  <input
                    className="input"
                    value={block.eyebrow ?? ""}
                    onChange={(e) => handleLogosFieldChange(idx, "eyebrow", e.target.value)}
                    placeholder="Trusted by"
                  />
                </div>
              </div>
              <div className="field-group">
                <label>Headline</label>
                <input
                  className="input"
                  value={block.heading ?? ""}
                  onChange={(e) => handleLogosFieldChange(idx, "heading", e.target.value)}
                  placeholder="Teams that trust us"
                />
              </div>
              <div className="field-group">
                <label>Max logos (1-20)</label>
                <input
                  className="input"
                  type="number"
                  min={1}
                  max={20}
                  value={block.limit ?? 12}
                  onChange={(e) =>
                    handleLogosFieldChange(idx, "limit", Math.min(20, Math.max(1, Number(e.target.value) || 0)))
                  }
                  placeholder="12"
                />
                <span style={{ color: "var(--muted)", fontSize: 12 }}>
                  Pulls any media with type <code>Logo</code>. Logos are capped at 20 and shown in a looping wall.
                </span>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={!!block.enableDarkModeOnScroll}
                  onChange={(e) => handleLogosFieldChange(idx, "enableDarkModeOnScroll", e.target.checked)}
                />
                <span>Trigger dark mode while this block is in view</span>
              </label>
              <div className="card" style={{ padding: 12, border: "1px dashed var(--border-strong)" }}>
                <strong style={{ display: "block", marginBottom: 4 }}>Step-and-repeat logos</strong>
                <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>
                  Dynamically fetches up to 20 media items tagged as Logo and lays them out in a repeating marquee.
                </p>
              </div>
            </div>
          ) : isScrollGalleryBlock(block) ? (
            <div className="grid" style={{ gap: 12, padding: 12 }}>
              <div className="grid" style={{ gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
                <div className="field-group">
                  <label>Eyebrow</label>
                  <input
                    className="input"
                    value={block.eyebrow ?? ""}
                    onChange={(e) => handleScrollGalleryFieldChange(idx, "eyebrow", e.target.value)}
                    placeholder="Section label"
                  />
                </div>
              </div>
              <div className="field-group">
                <label>Headline</label>
                <input
                  className="input"
                  value={block.heading}
                  onChange={(e) => handleScrollGalleryFieldChange(idx, "heading", e.target.value)}
                  placeholder="Gallery headline"
                />
              </div>
              <div className="field-group">
                <label>Body / kicker</label>
                <textarea
                  rows={3}
                  value={block.body ?? ""}
                  onChange={(e) => handleScrollGalleryFieldChange(idx, "body", e.target.value)}
                  placeholder="Quick summary that sits above the horizontal scroll"
                />
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={!!block.enableDarkModeOnScroll}
                  onChange={(e) => handleScrollGalleryFieldChange(idx, "enableDarkModeOnScroll", e.target.checked)}
                />
                <span>Trigger dark mode while this section is in view</span>
              </label>
              <div className="grid" style={{ gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                  <h4 style={{ margin: 0 }}>Gallery cards</h4>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <button type="button" className="btn secondary" onClick={() => addFeatureItem(idx)}>
                      + Add card
                    </button>
                    {componentLibrary.length ? (
                      <>
                        <select
                          value={componentSelections[blockId] ?? ""}
                          onChange={(e) =>
                            setComponentSelections((prev) => ({
                              ...prev,
                              [blockId]: e.target.value
                            }))
                          }
                          style={{ minWidth: 200 }}
                        >
                          <option value="">Insert from components…</option>
                          {componentLibrary.map((component) => (
                            <option key={component.id} value={component.id}>
                              {component.title} {component.industry ? `(${component.industry})` : ""}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="btn secondary"
                          disabled={!componentSelections[blockId]}
                          onClick={() => componentSelections[blockId] && addFeatureFromComponent(idx, componentSelections[blockId])}
                        >
                          Add from library
                        </button>
                      </>
                    ) : null}
                    <Link className="btn secondary" href="/admin/components/new" target="_blank" rel="noreferrer">
                      + New reusable component
                    </Link>
                  </div>
                </div>
                {(block.items ?? []).map((item, itemIdx) => (
                  <div key={`${item.title}-${itemIdx}`} className="card" style={{ padding: 12 }}>
                    <div className="grid" style={{ gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                      <div className="field-group">
                        <label>Title</label>
                        <input
                          className="input"
                          value={item.title}
                          onChange={(e) => updateFeatureItem(idx, itemIdx, "title", e.target.value)}
                          placeholder="Card name"
                        />
                      </div>
                      <div className="field-group">
                        <label>Badge (optional)</label>
                        <input
                          className="input"
                          value={item.badge ?? ""}
                          onChange={(e) => updateFeatureItem(idx, itemIdx, "badge", e.target.value)}
                          placeholder="New, Case study"
                        />
                      </div>
                      <div className="field-group">
                        <label>Link (optional)</label>
                        <input
                          className="input"
                          value={item.href ?? ""}
                          onChange={(e) => updateFeatureItem(idx, itemIdx, "href", e.target.value)}
                          placeholder="/work"
                        />
                      </div>
                      <div className="field-group">
                        <label>Industry tag</label>
                        <input
                          className="input"
                          value={item.industry ?? ""}
                          onChange={(e) => updateFeatureItem(idx, itemIdx, "industry", e.target.value)}
                          placeholder="SaaS, Fintech"
                        />
                      </div>
                      <div className="field-group">
                        <label>Type tag</label>
                        <input
                          className="input"
                          value={item.type ?? ""}
                          onChange={(e) => updateFeatureItem(idx, itemIdx, "type", e.target.value)}
                          placeholder="Feature, Story"
                        />
                      </div>
                    </div>
                    <div className="field-group">
                      <label>Description</label>
                      <textarea
                        rows={3}
                        value={item.body}
                        onChange={(e) => updateFeatureItem(idx, itemIdx, "body", e.target.value)}
                        placeholder="What makes this story or capability interesting?"
                      />
                    </div>
                    <button
                      type="button"
                      className="btn secondary"
                      onClick={() => removeFeatureItem(idx, itemIdx)}
                      style={{ width: "fit-content" }}
                    >
                      Remove card
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : isFeaturesBlock(block) ? (
            <div className="grid" style={{ gap: 12, padding: 12 }}>
              <div className="grid" style={{ gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
                <div className="field-group">
                  <label>Eyebrow</label>
                  <input
                    className="input"
                    value={block.eyebrow ?? ""}
                    onChange={(e) => handleFeaturesFieldChange(idx, "eyebrow", e.target.value)}
                    placeholder="Section label"
                  />
                </div>
                <div className="field-group">
                  <label>Columns (1-4)</label>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    max={4}
                    value={block.columns ?? 3}
                    onChange={(e) => handleFeaturesFieldChange(idx, "columns", Number(e.target.value))}
                    placeholder="3"
                  />
                </div>
              </div>
              <div className="field-group">
                <label>Heading</label>
                <input
                  className="input"
                  value={block.heading}
                  onChange={(e) => handleFeaturesFieldChange(idx, "heading", e.target.value)}
                  placeholder="Feature block heading"
                />
              </div>
              <div className="field-group">
                <label>Body / kicker</label>
                <textarea
                  rows={3}
                  value={block.body ?? ""}
                  onChange={(e) => handleFeaturesFieldChange(idx, "body", e.target.value)}
                  placeholder="Quick summary for these feature cards"
                />
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={!!block.enableDarkModeOnScroll}
                  onChange={(e) => handleFeaturesFieldChange(idx, "enableDarkModeOnScroll", e.target.checked)}
                />
                <span>Trigger dark mode while this section is in view</span>
              </label>
              <div className="grid" style={{ gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                  <h4 style={{ margin: 0 }}>Feature items</h4>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <button type="button" className="btn secondary" onClick={() => addFeatureItem(idx)}>
                      + Add feature
                    </button>
                    {componentLibrary.length ? (
                      <>
                        <select
                          value={componentSelections[blockId] ?? ""}
                          onChange={(e) =>
                            setComponentSelections((prev) => ({
                              ...prev,
                              [blockId]: e.target.value
                            }))
                          }
                          style={{ minWidth: 200 }}
                        >
                          <option value="">Insert from components…</option>
                          {componentLibrary.map((component) => (
                            <option key={component.id} value={component.id}>
                              {component.title} {component.industry ? `(${component.industry})` : ""}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="btn secondary"
                          disabled={!componentSelections[blockId]}
                          onClick={() => componentSelections[blockId] && addFeatureFromComponent(idx, componentSelections[blockId])}
                        >
                          Add from library
                        </button>
                      </>
                    ) : null}
                    <Link className="btn secondary" href="/admin/components/new" target="_blank" rel="noreferrer">
                      + New reusable component
                    </Link>
                  </div>
                </div>
                {(block.items ?? []).map((item, itemIdx) => (
                  <div key={`${item.title}-${itemIdx}`} className="card" style={{ padding: 12 }}>
                    <div className="grid" style={{ gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                      <div className="field-group">
                        <label>Title</label>
                        <input
                          className="input"
                          value={item.title}
                          onChange={(e) => updateFeatureItem(idx, itemIdx, "title", e.target.value)}
                          placeholder="Feature name"
                        />
                      </div>
                      <div className="field-group">
                        <label>Badge (optional)</label>
                        <input
                          className="input"
                          value={item.badge ?? ""}
                          onChange={(e) => updateFeatureItem(idx, itemIdx, "badge", e.target.value)}
                          placeholder="New, Coming soon"
                        />
                      </div>
                      <div className="field-group">
                        <label>Link (optional)</label>
                        <input
                          className="input"
                          value={item.href ?? ""}
                          onChange={(e) => updateFeatureItem(idx, itemIdx, "href", e.target.value)}
                          placeholder="/capabilities"
                        />
                      </div>
                      <div className="field-group">
                        <label>Industry tag</label>
                        <input
                          className="input"
                          value={item.industry ?? ""}
                          onChange={(e) => updateFeatureItem(idx, itemIdx, "industry", e.target.value)}
                          placeholder="SaaS, Fintech"
                        />
                      </div>
                      <div className="field-group">
                        <label>Type tag</label>
                        <input
                          className="input"
                          value={item.type ?? ""}
                          onChange={(e) => updateFeatureItem(idx, itemIdx, "type", e.target.value)}
                          placeholder="Feature, Benefit"
                        />
                      </div>
                    </div>
                    <div className="field-group">
                      <label>Description</label>
                      <textarea
                        rows={3}
                        value={item.body}
                        onChange={(e) => updateFeatureItem(idx, itemIdx, "body", e.target.value)}
                        placeholder="What makes this feature useful?"
                      />
                    </div>
                    <button
                      type="button"
                      className="btn secondary"
                      onClick={() => removeFeatureItem(idx, itemIdx)}
                      style={{ width: "fit-content" }}
                    >
                      Remove feature
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid" style={{ gap: 12, padding: 12 }}>
              <div className="field-group">
                <label>Heading</label>
                <input
                  className="input"
                  value={block.heading}
                  onChange={(e) => handleStoryFieldChange(idx, "heading", e.target.value)}
                  placeholder="Story headline"
                />
              </div>
              <div className="field-group">
                <label>Body (rich text friendly)</label>
                <textarea
                  rows={4}
                  value={block.body}
                  onChange={(e) => handleStoryFieldChange(idx, "body", e.target.value)}
                  placeholder="Narrative, quote, or supporting text"
                />
              </div>
              <MediaRow
                secondary={
                  <div className="field-group">
                    <label>Variant</label>
                    <select value={block.variant} onChange={(e) => handleStoryVariantChange(idx, e.target.value as StoryBlock["variant"])}>
                      <option value="single_column">Single column</option>
                      <option value="two_column">Two column</option>
                      <option value="split_with_quote">Split with quote</option>
                    </select>
                  </div>
                }
              >
                <MediaField
                  blockId={blockId}
                  blockIdx={idx}
                  media={block.media}
                  uploading={uploadingBlock === `${blockId}-media`}
                  uploadError={uploadError}
                  onUpload={handleMediaUpload}
                  onOpenPicker={(target, filterType) => setMediaModal({ open: true, blockIdx: idx, target, filterType })}
                  onClear={() =>
                    updateBlock(idx, (current) => ({
                      ...current,
                      media: undefined
                    }))
                  }
                />
              </MediaRow>
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={!!block.enableDarkModeOnScroll}
                  onChange={(e) => handleStoryFieldChange(idx, "enableDarkModeOnScroll", e.target.checked)}
                />
                <span>Trigger dark mode while this section is in view</span>
              </label>
              <div className="grid" style={{ gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h4 style={{ margin: 0 }}>Sections inside this block</h4>
                  <button type="button" className="btn secondary" onClick={() => addSectionToBlock(idx)}>
                    + Add section
                  </button>
                </div>
                {(block.sections ?? []).map((section, sectionIdx) => (
                  <div key={`${section.title}-${sectionIdx}`} className="card" style={{ padding: 12 }}>
                    <div className="field-group">
                      <label>Section title</label>
                      <input
                        className="input"
                        value={section.title}
                        onChange={(e) => handleSectionChange(idx, sectionIdx, "title", e.target.value)}
                        placeholder="Section title"
                      />
                    </div>
                    <div className="field-group">
                      <label>Section body</label>
                      <textarea
                        rows={3}
                        value={section.body}
                        onChange={(e) => handleSectionChange(idx, sectionIdx, "body", e.target.value)}
                        placeholder="Supporting copy"
                      />
                    </div>
                    <button
                      type="button"
                      className="btn secondary"
                      onClick={() => removeSectionFromBlock(idx, sectionIdx)}
                      style={{ width: "fit-content" }}
                    >
                      Remove section
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }) ?? [];
  const hasPendingBlocks = (formState?.blocks ?? []).some(isPendingBlock);

  if (!formState) {
    return <p>Loading page…</p>;
  }

  const headingText = heading ?? formState.title ?? "Page";
  const mediaModalBlock = mediaModal.blockIdx !== null ? formState.blocks[mediaModal.blockIdx] : null;
  const mediaModalValue =
    mediaModal.target === "background" && mediaModalBlock && isHeroLikeBlock(mediaModalBlock)
      ? mediaModalBlock.background?.url ?? ""
      : mediaModalBlock && "media" in mediaModalBlock
      ? mediaModalBlock.media?.url ?? ""
      : "";
  const deleteText = isDeleting ? deleteLabel?.loading ?? "Deleting…" : deleteLabel?.idle ?? "Delete page";

  return (
    <div className="grid" style={{ gap: 16 }}>
      {hasSpinnerStyles ? (
        <style jsx global>{`
          @keyframes admin-spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      ) : null}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14 }}>Page</p>
          <h1 style={{ margin: 0 }}>{headingText}</h1>
          <p style={{ margin: 0, color: "var(--muted)" }}>{intro}</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
          {onDelete ? (
            <button className="btn secondary" type="button" onClick={onDelete} disabled={isSubmitting || isDeleting}>
              {deleteText}
            </button>
          ) : null}
          <Link className="btn secondary" href={backHref}>
            ← Back to list
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {warnings.length ? (
          <div className="card" style={{ padding: 12, border: "1.5px solid var(--accent)" }}>
            <strong style={{ display: "block", marginBottom: 6 }}>SEO suggestions</strong>
            <ul style={{ margin: 0, paddingLeft: 18, color: "var(--muted)" }}>
              {warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <div className="field-group">
          <label>Title</label>
          <input
            className="input"
            value={formState.title}
            onChange={(e) => handleBasicChange("title", e.target.value)}
            placeholder="Page title"
          />
        </div>
        <div className="field-group">
          <label>Slug</label>
          <input
            className="input"
            value={formState.slug}
            onChange={(e) => handleBasicChange("slug", e.target.value)}
            placeholder="/about"
          />
        </div>
        <div className="field-group">
          <label>Status</label>
          <select
            value={formState.status}
            onChange={(e) => handleBasicChange("status", e.target.value as PageStatus)}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>

        <fieldset>
          <legend>SEO & Social</legend>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <div style={{ display: "grid", gap: 2 }}>
              <strong>SEO controls</strong>
              <span style={{ color: "var(--muted)", fontSize: 13 }}>Meta, sharing, structured data, and redirects.</span>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" className="btn secondary" onClick={handleAutofillSeo}>
                Auto-fill from content
              </button>
              <button type="button" className="btn secondary" onClick={() => setSeoOpen((open) => !open)}>
                {seoOpen ? "Hide" : "Show"} SEO fields
              </button>
            </div>
          </div>

          {!seoOpen ? null : (
            <div className="grid" style={{ gap: 16, marginTop: 12 }}>
              <fieldset>
                <legend>SEO basics</legend>
                <div className="grid" style={{ gap: 12 }}>
                  <div className="field-group">
                    <label>SEO title (overrides page title)</label>
                    <input
                      className="input"
                      value={formState.seoTitle ?? ""}
                      onChange={(e) => handleBasicChange("seoTitle", e.target.value)}
                      placeholder="Title tag"
                    />
                  </div>
                  <div className="field-group">
                    <label>Meta description</label>
                    <textarea
                      rows={3}
                      value={formState.metaDescription ?? ""}
                      onChange={(e) => handleBasicChange("metaDescription", e.target.value)}
                      placeholder="Short snippet for SERP"
                    />
                  </div>
                  <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
                    <div className="field-group">
                      <label>Canonical URL</label>
                      <input
                        className="input"
                        value={formState.canonicalUrl ?? ""}
                        onChange={(e) => handleBasicChange("canonicalUrl", e.target.value)}
                        placeholder="https://example.com/page"
                      />
                    </div>
                    <div className="field-group">
                      <label>Focus keyword (optional)</label>
                      <input
                        className="input"
                        value={formState.focusKeyword ?? ""}
                        onChange={(e) => handleBasicChange("focusKeyword", e.target.value)}
                        placeholder="Target keyword or phrase"
                      />
                    </div>
                  </div>
                  <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={!!formState.noindex}
                        onChange={(e) => setFormState((prev) => (prev ? { ...prev, noindex: e.target.checked } : prev))}
                      />
                      <span>Noindex (hide from search)</span>
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={!!formState.nofollow}
                        onChange={(e) => setFormState((prev) => (prev ? { ...prev, nofollow: e.target.checked } : prev))}
                      />
                      <span>Nofollow</span>
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={!!formState.sitemapExclude}
                        onChange={(e) => setFormState((prev) => (prev ? { ...prev, sitemapExclude: e.target.checked } : prev))}
                      />
                      <span>Exclude from sitemap</span>
                    </label>
                  </div>
                  <div className="field-group">
                    <label>Suggested internal links (one per line or comma separated)</label>
                    <textarea
                      rows={2}
                      value={(formState.internalLinks ?? []).join("\n")}
                      onChange={(e) => handleInternalLinksChange(e.target.value)}
                      placeholder="/pricing, /about, /work/case-study"
                    />
                  </div>
                </div>
              </fieldset>

              <fieldset>
                <legend>Social sharing</legend>
                <div className="grid" style={{ gap: 12 }}>
                  <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
                    <div className="field-group">
                      <label>OG title</label>
                      <input
                        className="input"
                        value={formState.ogTitle ?? ""}
                        onChange={(e) => handleBasicChange("ogTitle", e.target.value)}
                        placeholder="Open Graph title"
                      />
                    </div>
                    <div className="field-group">
                      <label>OG description</label>
                      <input
                        className="input"
                        value={formState.ogDescription ?? ""}
                        onChange={(e) => handleBasicChange("ogDescription", e.target.value)}
                        placeholder="Share description"
                      />
                    </div>
                  </div>
                  <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
                    <div className="field-group">
                      <label>Twitter title</label>
                      <input
                        className="input"
                        value={formState.twitterTitle ?? ""}
                        onChange={(e) => handleBasicChange("twitterTitle", e.target.value)}
                        placeholder="X / Twitter title"
                      />
                    </div>
                    <div className="field-group">
                      <label>Twitter description</label>
                      <input
                        className="input"
                        value={formState.twitterDescription ?? ""}
                        onChange={(e) => handleBasicChange("twitterDescription", e.target.value)}
                        placeholder="X / Twitter description"
                      />
                    </div>
                  </div>
                  <div className="card" style={{ padding: 12, border: "1px solid var(--border-strong)", display: "grid", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "grid", gap: 4 }}>
                        <strong>OG / Twitter image</strong>
                        <span style={{ color: "var(--muted)", fontSize: 13 }}>Recommended 1200x630</span>
                      </div>
                      {formState.socialImage?.url ? (
                        <img
                          src={formState.socialImage.url}
                          alt={formState.socialImage.alt ?? ""}
                          style={{ width: 80, height: 50, objectFit: "cover", borderRadius: 6, border: "1px solid var(--border)" }}
                        />
                      ) : null}
                    </div>
                    <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
                      <input
                        className="input"
                        value={formState.socialImage?.url ?? ""}
                        onChange={(e) => handleShareMediaChange("url", e.target.value)}
                        placeholder="https://…"
                      />
                      <input
                        className="input"
                        value={formState.socialImage?.alt ?? ""}
                        onChange={(e) => handleShareMediaChange("alt", e.target.value)}
                        placeholder="Alt text"
                      />
                      <select
                        value={formState.socialImage?.type ?? "image"}
                        onChange={(e) => handleShareMediaChange("type", e.target.value)}
                      >
                        <option value="image">Image</option>
                        <option value="video">Video</option>
                      </select>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                      <button
                        type="button"
                        className="btn secondary"
                        disabled={shareUploadBusy}
                        onClick={() => document.getElementById("upload-share-media")?.click()}
                      >
                        {shareUploadBusy ? "Uploading…" : "Upload image"}
                      </button>
                      <input
                        id="upload-share-media"
                        type="file"
                        accept="image/*,video/*"
                        style={{ display: "none" }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleShareUpload(file);
                        }}
                      />
                      <select
                        value=""
                        onChange={(e) => {
                          const match = mediaOptions.find((opt) => opt.id === e.target.value);
                          if (match) {
                            handleShareMediaChange("url", match.url);
                            handleShareMediaChange("type", match.mediaType ?? "image");
                          }
                        }}
                      >
                        <option value="">Choose from library…</option>
                        {mediaOptions.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.name}
                          </option>
                        ))}
                      </select>
                      {formState.socialImage?.url ? (
                        <button
                          type="button"
                          className="btn secondary"
                          onClick={() => setFormState((prev) => (prev ? { ...prev, socialImage: { url: "", alt: "", type: "image" } } : prev))}
                        >
                          Clear
                        </button>
                      ) : null}
                      {uploadError && !shareUploadBusy ? <span style={{ color: "var(--accent)", fontSize: 13 }}>{uploadError}</span> : null}
                    </div>
                  </div>
                </div>
              </fieldset>

              <fieldset>
                <legend>Structured data</legend>
                <div className="field-group">
                  <label>JSON-LD</label>
                  <textarea
                    rows={6}
                    value={formState.jsonLd ?? ""}
                    onChange={(e) => handleBasicChange("jsonLd", e.target.value)}
                    placeholder='{"@context":"https://schema.org","@type":"WebPage"}'
                  />
                </div>
              </fieldset>

              <fieldset>
                <legend>Redirects for this page</legend>
                <div className="grid" style={{ gap: 12 }}>
                  {(formState.redirects ?? []).map((redirect, idx) => (
                    <div key={`${redirect.from}-${idx}`} className="card" style={{ padding: 12, display: "grid", gap: 8 }}>
                      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
                        <div className="field-group">
                          <label>From</label>
                          <input
                            className="input"
                            value={redirect.from}
                            onChange={(e) => handleRedirectChange(idx, "from", e.target.value)}
                            placeholder="/old-path"
                          />
                        </div>
                        <div className="field-group">
                          <label>To</label>
                          <input
                            className="input"
                            value={redirect.to}
                            onChange={(e) => handleRedirectChange(idx, "to", e.target.value)}
                            placeholder="/new-path"
                          />
                        </div>
                        <div className="field-group">
                          <label>Type</label>
                          <select value={redirect.type ?? "permanent"} onChange={(e) => handleRedirectTypeChange(idx, e.target.value as RedirectRule["type"])}>
                            <option value="permanent">301 Permanent</option>
                            <option value="temporary">302 Temporary</option>
                          </select>
                        </div>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: "var(--muted)", fontSize: 13 }}>Applied at request time.</span>
                        <button type="button" className="btn secondary" onClick={() => removeRedirect(idx)}>
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                  <button type="button" className="btn secondary" onClick={addRedirect}>
                    + Add redirect
                  </button>
                </div>
              </fieldset>
            </div>
          )}
        </fieldset>

        <fieldset>
          <legend>Blocks</legend>
          <div className="grid" style={{ gap: 12 }}>
            <div
              className="card"
              style={{
                display: "grid",
                gridTemplateColumns: "56px minmax(0, 1fr) 160px 160px",
                padding: "10px 12px",
                gap: 10,
                background: "rgba(255,255,255,0.03)",
                border: "1.5px solid var(--border-strong)",
                color: "var(--muted)",
                fontSize: 14
              }}
            >
              <span>Reorder</span>
              <span style={{ textAlign: "left" }}>Block name</span>
              <span style={{ textAlign: "right" }}>Type</span>
              <span style={{ textAlign: "right" }}>Actions</span>
            </div>
            {hasPendingBlocks ? (
              <div
                className="card"
                style={{
                  padding: 10,
                  border: "1px dashed var(--border-strong)",
                  display: "flex",
                  justifyContent: "flex-start",
                  alignItems: "center",
                  gap: 8
                }}
              >
                <span style={{ color: "var(--muted)", fontSize: 13 }}>New blocks stay blank until you pick a type in the dropdown.</span>
              </div>
            ) : null}
            {blockFields}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" className="btn secondary" onClick={addBlock}>
                + Add block
              </button>
            </div>
          </div>
        </fieldset>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button className="btn" type="submit" disabled={isSubmitting}>
            {isSubmitting ? submitLabel.loading : submitLabel.idle}
          </button>
          {formError ? <span style={{ color: "var(--accent)" }}>{formError}</span> : null}
          {message ? <span style={{ color: "var(--accent)" }}>{message}</span> : null}
        </div>
      </form>

      {mediaModal.open && mediaModal.blockIdx !== null ? (
        <MediaSelect
          options={mediaOptions}
          value={mediaModalValue}
          search={mediaSearch}
          filterType={mediaModal.filterType}
          onSearch={setMediaSearch}
          onSelect={(url, mediaType) => {
            updateBlock(mediaModal.blockIdx as number, (current) => {
              const mediaPayload = { url, type: mediaType ?? "image" };
              if (mediaModal.target === "background" && isHeroLikeBlock(current)) {
                return { ...current, background: mediaPayload };
              }
              return { ...current, media: mediaPayload };
            });
            setMediaModal({ open: false, blockIdx: null, target: "media" });
          }}
          onClose={() => setMediaModal({ open: false, blockIdx: null, target: "media" })}
        />
      ) : null}
    </div>
  );
}
