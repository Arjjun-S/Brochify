import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "utfs.io" },
      { protocol: "https", hostname: "replicate.delivery" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  serverExternalPackages: ["jsdom"],
  turbopack: {
    resolveAlias: {
      "jsdom": "./lib/stubs/jsdom-stub.js",
      "jsdom/lib/jsdom/living/generated/utils": "./lib/stubs/jsdom-stub.js",
      "jsdom/lib/jsdom/utils": "./lib/stubs/jsdom-stub.js",
    },
  },
};

export default nextConfig;
