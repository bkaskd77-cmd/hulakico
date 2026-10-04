import type { MetadataRoute } from "next";
import { listPublicPaths, siteUrl } from "@/lib/seo/site";

/** Public sitemap built from live services, notes, cities, lanes, and info pages. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const paths = await listPublicPaths();
    return paths.map((item) => ({
      url: siteUrl(item.path),
      lastModified: new Date(),
      changeFrequency: item.changeFrequency,
      priority: item.priority,
    }));
  } catch (error) {
    console.error("[sitemap.ts:sitemap]", error instanceof Error ? error.message : error);
    return [{ url: siteUrl("/"), lastModified: new Date(), changeFrequency: "weekly", priority: 1 }];
  }
}
