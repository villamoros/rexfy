import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  experimental: {
    agentUpgrade: "security",
    // Listing photos go through server actions: up to 6 photos of 5 MB each.
    serverActions: { bodySizeLimit: "32mb" },
  },
  partialPrefetching: true,
  turbopack: {
    // Keep local and Vercel builds scoped to this app in the repository.
    root: __dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
