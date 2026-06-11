import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // bandeiras das selecoes
      { protocol: "https", hostname: "flagcdn.com" },
    ],
  },
};

export default nextConfig;
