import { createClient, type ClientConfig } from "@sanity/client";

type RequiredConfigKeys = "projectId" | "dataset";

type OptionalConfigKeys = "apiVersion" | "useCdn" | "perspective";

export type SanityConfig = Pick<ClientConfig, RequiredConfigKeys | OptionalConfigKeys>;

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2024-01-01";

const baseConfig: SanityConfig = {
  projectId: projectId ?? "",
  dataset: dataset ?? "",
  apiVersion,
  useCdn: process.env.NODE_ENV === "production",
  perspective: "published",
};

export const sanityConfig = baseConfig;

const isConfigured = Boolean(projectId && dataset);

export const sanityClient = isConfigured ? createClient(baseConfig) : null;

export function hasSanityClient(): sanityClient is NonNullable<typeof sanityClient> {
  return isConfigured && Boolean(sanityClient);
}

export function requireSanityClient(): NonNullable<typeof sanityClient> {
  if (!hasSanityClient()) {
    throw new Error(
      "Missing Sanity configuration. Set NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET to enable Sanity queries.",
    );
  }

  return sanityClient!;
}
