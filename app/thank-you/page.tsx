import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getNavigationItems } from "@/lib/navigation";
import styles from "./ThankYouPage.module.css";

export const revalidate = 120;
export const dynamic = "force-static";

const title = "Thank you for contacting Studio Tak";
const description = "Your message has been received. The Studio Tak team will be in touch soon.";
const canonicalUrl = new URL("/thank-you", process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.studiotak.co").toString();

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: canonicalUrl },
  robots: { index: false, follow: false },
  openGraph: {
    title,
    description,
    url: canonicalUrl,
    siteName: "Studio Tak",
    type: "website"
  }
};

export default async function ThankYouPage() {
  const navItems = await getNavigationItems();

  return (
    <>
      <SiteHeader navItems={navItems} />
      <main id="main-content" tabIndex={-1} className={styles.page}>
        <section className={styles.confirmationSection} aria-labelledby="confirmation-heading">
          <div className={styles.card}>
            <div className={styles.successMessage} role="status">
              <span aria-hidden="true">✓</span>
              <h1 id="confirmation-heading">Thank you for contacting us.</h1>
              <p>Your message is on its way to our team. We&apos;ll be in touch within one business day.</p>
              <p className={styles.learnLink}>
                <span>In the meantime,</span>
                <Link href="/learn">take a look around.</Link>
              </p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter navItems={navItems} />
    </>
  );
}
