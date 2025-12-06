'use client';

import { type Config } from "sanity";
import { NextStudio } from "next-sanity/studio";

// The Studio config lives in the standalone /sanity workspace; types come from its local install.
// Cast to the root "sanity" Config to avoid duplicate-type conflicts.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore mismatched module resolution between workspaces
import studioConfig from "../../../../sanity/sanity.config";

const config = studioConfig as unknown as Config;

export default function StudioPage() {
  return <NextStudio config={config} />;
}
