import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
    // Keep each shrunk photo in Vercel's cache for a month instead of four hours. Uploaded photos
    // never change (every upload gets its own address), and each refresh re-downloads the original
    // from Vercel Blob, which counts against the store's monthly download allowance.
    minimumCacheTTL: 60 * 60 * 24 * 31,
  },
};

export default nextConfig;
