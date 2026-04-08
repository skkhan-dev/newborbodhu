import type { MetadataRoute } from "next";

const DEFAULT_SITE_URL =
  "https://borbodhu-web-test-508740568768.asia-south1.run.app";

function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL).replace(/\/+$/, "");
}

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/profiles", "/vendors", "/ghotok", "/wedding-planning", "/matrimony"],
      disallow: ["/dashboard", "/login", "/signup", "/parity-plan", "/persona-flows"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
