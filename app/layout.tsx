import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import { getSiteSettings } from "@/lib/siteSettings";
import "./globals.css";

const rubik = Rubik({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-sans"
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://studio-tak.example";

const baseMetadata: Metadata = {
  title: "Studio Tak | Design Systems & Interactive Experiences",
  description: "Marketing site and admin control for Studio Tak.",
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "Studio Tak",
    description: "Design systems and expressive web experiences",
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
    <html lang="en" className={rubik.variable}>
      <body className={rubik.className}>
        {children}
      </body>
    </html>
  );
}
