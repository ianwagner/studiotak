import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

/** @type {(phase: string) => import('next').NextConfig} */
const nextConfig = (phase) => ({
  distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
  async redirects() {
    return [
      {
        source: "/campfire",
        destination: "https://campfireads.io",
        permanent: true
      }
    ];
  },
  experimental: {
    typedRoutes: true
  }
});

export default nextConfig;
