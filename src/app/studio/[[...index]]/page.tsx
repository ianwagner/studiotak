'use client';

import type { Metadata } from "next";
import { NextStudio } from "next-sanity/studio";

import config from "../../../../sanity/sanity.config";

export const metadata: Metadata = {
  title: "Studio | Studio Tak",
};

export default function StudioPage() {
  return <NextStudio config={config} />;
}
