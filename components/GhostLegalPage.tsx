import type { ReactNode } from "react";
import { getGhostPageBySlug } from "@/lib/ghost";
import { StaticPage } from "@/components/StaticPage";

type Props = {
  slug: "terms-of-service" | "privacy-policy";
  title: string;
  lastUpdated: string;
  children: ReactNode;
};

export async function GhostLegalPage({ slug, title, lastUpdated, children }: Props) {
  const page = await getGhostPageBySlug(slug);
  const hasContent = Boolean(page?.html?.trim());
  const updated = hasContent && page?.updated_at ? new Date(page.updated_at) : null;
  const displayDate = updated && !Number.isNaN(updated.getTime())
    ? new Intl.DateTimeFormat("en-US", {
        month: "long", day: "numeric", year: "numeric", timeZone: "UTC"
      }).format(updated)
    : lastUpdated;

  return (
    <StaticPage title={hasContent ? page!.title : title} lastUpdated={displayDate}>
      {hasContent ? <div dangerouslySetInnerHTML={{ __html: page!.html! }} /> : children}
    </StaticPage>
  );
}
