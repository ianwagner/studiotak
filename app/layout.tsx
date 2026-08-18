import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import localFont from "next/font/local";
import { getSiteSettings } from "@/lib/siteSettings";
import { CookieConsent } from "@/components/CookieConsent";
import "./globals.css";

const rubik = Rubik({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
  display: "swap",
  variable: "--font-sans"
});

const sentient = localFont({
  src: [
    { path: "../Fonts/WEB/fonts/Sentient-Light.woff2", weight: "300", style: "normal" },
    { path: "../Fonts/WEB/fonts/Sentient-Regular.woff2", weight: "400", style: "normal" },
    { path: "../Fonts/WEB/fonts/Sentient-Medium.woff2", weight: "500", style: "normal" },
    { path: "../Fonts/WEB/fonts/Sentient-Bold.woff2", weight: "700", style: "normal" }
  ],
  display: "swap",
  variable: "--font-sentient"
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://studiotak.co";

const baseMetadata: Metadata = {
  title: "Studio Tak | Design Systems & Interactive Experiences",
  description: "Studio Tak is a marketing technology consultancy building creative production systems, AI-assisted ad tools, and design infrastructure for agencies and brands.",
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "Studio Tak",
    description: "Studio Tak is a marketing technology consultancy building creative production systems, AI-assisted ad tools, and design infrastructure for agencies and brands.",
    url: siteUrl,
    siteName: "Studio Tak",
    locale: "en_US",
    type: "website"
  }
};

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  const icons = {
    icon: settings.faviconUrl ? [{ url: settings.faviconUrl }] : undefined,
    apple: settings.touchIconUrl ? [{ url: settings.touchIconUrl }] : undefined
  };
  const hasIcon = Boolean(icons.icon || icons.apple);

  return {
    ...baseMetadata,
    icons: hasIcon ? icons : undefined
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${rubik.variable} ${sentient.variable}`}>
      <head>
        <link rel="preconnect" href="https://challenges.cloudflare.com" />
      </head>
      <body className={rubik.className}>
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
