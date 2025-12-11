"use client";

import { useCreate } from "@refinedev/core";
import { useRouter } from "next/navigation";
import { PageForm, type PageFormState } from "./PageForm";

const defaultPage: PageFormState = {
  id: undefined,
  title: "New page",
  slug: "",
  status: "draft",
  blocks: [],
  seoTitle: "",
  metaDescription: "",
  canonicalUrl: "",
  noindex: false,
  nofollow: false,
  ogTitle: "",
  ogDescription: "",
  socialImage: { url: "", alt: "", type: "image" },
  twitterTitle: "",
  twitterDescription: "",
  jsonLd: "",
  sitemapExclude: false,
  focusKeyword: "",
  internalLinks: [],
  redirects: []
};

export function PageCreate() {
  const { mutateAsync, isLoading } = useCreate<PageFormState>();
  const router = useRouter();

  const handleSubmit = async (values: PageFormState) => {
    const { id: _ignore, ...payload } = values;
    const result = await mutateAsync({
      resource: "pages",
      values: { ...payload, slug: normalizeSlug(payload.slug), updatedAt: new Date().toISOString() }
    });
    const newId = result?.data?.id;
    if (newId) {
      router.push(`/admin/pages/${newId}`);
    } else {
      router.push("/admin/pages");
    }
  };

  return (
    <PageForm
      initialState={defaultPage}
      onSubmit={handleSubmit}
      isSubmitting={isLoading}
      backHref="/admin/pages"
      heading="Create page"
      submitLabel={{ idle: "Create page", loading: "Creating…" }}
    />
  );
}

const normalizeSlug = (slug: string) => {
  if (!slug) return slug;
  return slug.startsWith("/") ? slug : `/${slug}`;
};
