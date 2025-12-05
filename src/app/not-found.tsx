import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";

import { fetchErrorPage } from "@/lib/sanity/errorPage";
import { buildSanityImage } from "@/lib/sanity/images";
import { getButtonClassName } from "@/styles/buttons";
import { blockThemeVariables, gmColors, gmSpacing } from "@/styles/designTokens";
import { typographyMap } from "@/styles/typography";

export default async function NotFound() {
  const errorPage = await fetchErrorPage();
  const iconImage = buildSanityImage(errorPage.icon, { width: 360, height: 360, quality: 95, fit: "max" });
  const backgroundPalette = blockThemeVariables[errorPage.backgroundTheme];
  const contentPalette = blockThemeVariables[errorPage.theme];
  type ThemeVars = CSSProperties & {
    "--background": string;
    "--foreground": string;
    "--content-background": string;
    "--content-foreground": string;
  };
  const themeStyle: ThemeVars = {
    "--background": backgroundPalette["--background"],
    "--foreground": contentPalette["--foreground"],
    "--content-background": contentPalette["--background"],
    "--content-foreground": contentPalette["--foreground"],
  };

  return (
    <div className="bg-background text-foreground" style={themeStyle}>
      <div
        className={[
          gmSpacing["gm-spacing-shell-inline"],
          "py-24 sm:py-32",
        ].join(" ")}
      >
        <div className="mx-auto flex max-w-xl flex-col items-center text-center">
          {iconImage ? (
            <Image
              src={iconImage.url}
              alt={errorPage.iconAlt}
              width={iconImage.width ?? 360}
              height={iconImage.height ?? 360}
              className="mb-8 h-36 w-36 object-contain sm:h-40 sm:w-40"
              priority
            />
          ) : null}
          <h1
            className={[
              typographyMap.headings.h2,
              gmColors["gm-color-text-strong"],
            ].join(" ")}
          >
            {errorPage.heading}
          </h1>
          <p
            className={[
              "mt-4 max-w-lg text-balance",
              typographyMap.body.lead,
              gmColors["gm-color-text-muted"],
            ].join(" ")}
          >
            The page you are looking for is not available or may have moved.
          </p>
          <div className="mt-8">
            <Link href="/" className={[getButtonClassName("primary"), "focus-ring-token"].join(" ")}>
              {errorPage.buttonLabel}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
