import type { MetadataRoute } from "next";

const BASE_URL = "https://bolao-amigos-copa-2026.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    { url: `${BASE_URL}/`, lastModified },
    { url: `${BASE_URL}/resultados`, lastModified },
    { url: `${BASE_URL}/grade`, lastModified },
  ];
}
