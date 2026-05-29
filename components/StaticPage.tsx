import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getNavigationItems } from "@/lib/navigation";
import styles from "@/components/StaticPage.module.css";

const siteBase = process.env.NEXT_PUBLIC_SITE_URL ?? "https://studiotak.co";

type StaticPageProps = {
  title: string;
  lastUpdated?: string;
  children: ReactNode;
};

type StaticPageMetadataOptions = {
  title: string;
  description: string;
  path: string;
};

export function createStaticPageMetadata({
  title,
  description,
  path
}: StaticPageMetadataOptions): Metadata {
  const url = new URL(path, siteBase).toString();

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url,
      siteName: "Studio Tak",
      type: "website"
    }
  };
}

export async function StaticPage({ title, lastUpdated, children }: StaticPageProps) {
  const navItems = await getNavigationItems();

  return (
    <>
      <SiteHeader navItems={navItems} />
      <main>
        <div className={styles.page}>
          <header className={styles.header}>
            <h1 className={styles.title}>{title}</h1>
            {lastUpdated ? <p className={styles.updated}>Last updated: {lastUpdated}</p> : null}
          </header>

          <div className={styles.content}>{children}</div>
        </div>
      </main>
      <SiteFooter navItems={navItems} />
    </>
  );
}
