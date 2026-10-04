import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/lib/seo/site";

/** Allow public pages; keep staff, account, and booking out of search. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/account", "/book", "/api", "/ops", "/signin", "/signup", "/pay"],
      },
    ],
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
    host: SITE_ORIGIN,
  };
}
