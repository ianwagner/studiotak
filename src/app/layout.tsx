import type { Metadata } from "next";
import { Rubik, Geist_Mono } from "next/font/google";
import { cookies, headers } from "next/headers";

import { Header } from "@/components/Header";
import { authConfig } from "@/lib/auth";
import { fetchNavigation } from "@/lib/sanity/navigation";
import { fetchSiteSettings } from "@/lib/sanity/siteSettings";

import "./globals.css";

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Studio Tak",
    template: "%s | Studio Tak",
  },
  description: "Studio Tak website",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerList = await headers();
  const pathnameHeader = headerList.get("x-studiotak-pathname") ?? headerList.get("next-url");
  const pathname = pathnameHeader ? new URL(pathnameHeader, "http://localhost").pathname : "";
  const isAuthed =
    (await cookies()).get(authConfig.AUTH_COOKIE_NAME)?.value === authConfig.AUTH_COOKIE_VALUE;
  const isLoginPage = pathname === authConfig.LOGIN_PATH && !isAuthed;
  const isStudioRoute = pathname.startsWith("/studio");
  const hideChrome = isLoginPage || isStudioRoute;
  const [navigation, siteSettings] = await Promise.all([fetchNavigation(), fetchSiteSettings()]);

  return (
    <html lang="en">
      <head>
        <meta name="color-scheme" content="light dark" />
        {siteSettings.favicons.map((icon) => (
          <link
            key={[icon.rel, icon.sizes ?? "auto", icon.url].join(":")}
            rel={icon.rel}
            href={icon.url}
            sizes={icon.sizes ?? undefined}
            type={icon.type ?? undefined}
          />
        ))}
        {siteSettings.appIcons.map((icon) => (
          <link
            key={[icon.rel, icon.sizes ?? "auto", icon.url].join(":")}
            rel={icon.rel}
            href={icon.url}
            sizes={icon.sizes ?? undefined}
            type={icon.type ?? undefined}
          />
        ))}
      </head>
      <body
        className={`${rubik.className} ${rubik.variable} ${geistMono.variable} bg-background text-foreground antialiased`}
      >
        <div className={hideChrome ? "min-h-screen" : "flex min-h-screen flex-col"}>
          {hideChrome ? null : <Header navigation={navigation} siteSettings={siteSettings} />}
          <main className={hideChrome ? "min-h-screen" : "flex-1"}>
            <div className="flex flex-col gap-0">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
