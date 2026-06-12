import type { MetadataRoute } from "next";

const BASE_URL = "https://bolao-amigos-copa-2026.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/login"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
