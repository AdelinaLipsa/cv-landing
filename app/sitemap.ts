import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

// One page: the tabs are #hashes, and challenge links are noindex.
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: siteUrl, lastModified: new Date(), changeFrequency: "monthly", priority: 1 }];
}
