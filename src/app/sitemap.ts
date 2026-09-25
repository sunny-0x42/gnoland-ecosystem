import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

const PATHS = ["", "/networks", "/tokens", "/glossary", "/submit"];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-09-25");
  return PATHS.map((path) => ({
    url: `${SITE_URL}${path || "/"}`,
    lastModified,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.6,
  }));
}
