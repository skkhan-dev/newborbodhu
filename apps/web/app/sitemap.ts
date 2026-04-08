import type { MetadataRoute } from "next";

import { getApiBaseUrl } from "@/lib/api";
import { matrimonyMarkets } from "@/lib/seo-content";

const DEFAULT_SITE_URL =
  "https://borbodhu-web-test-508740568768.asia-south1.run.app";

type PublicProfileDirectoryResponse = {
  results: Array<{
    displayId: string;
  }>;
};

type PublicGhotokResponse = Array<{
  slug: string;
}>;

type VendorDirectoryResponse = Array<{
  slug: string;
}>;

function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL).replace(/\/+$/, "");
}

async function safeFetchJson<T>(url: string) {
  try {
    const response = await fetch(url, { cache: "no-store" });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const [profiles, vendors, ghotoks] = await Promise.all([
    safeFetchJson<PublicProfileDirectoryResponse>(
      `${getApiBaseUrl()}/public/profiles?page=1&pageSize=100`,
    ),
    safeFetchJson<VendorDirectoryResponse>(`${getApiBaseUrl()}/vendors`),
    safeFetchJson<PublicGhotokResponse>(`${getApiBaseUrl()}/public/ghotoks`),
  ]);

  const staticRoutes = [
    "",
    "/en",
    "/bn",
    "/profiles",
    "/en/profiles",
    "/bn/profiles",
    "/vendors",
    "/en/vendors",
    "/bn/vendors",
    "/ghotok",
    "/en/ghotok",
    "/bn/ghotok",
    "/wedding-planning",
    "/en/wedding-planning",
    "/bn/wedding-planning",
    "/matrimony",
    "/en/matrimony",
    "/bn/matrimony",
    "/login",
    "/signup",
    "/signup/vendor",
    "/en/login",
    "/bn/login",
    "/en/signup",
    "/bn/signup",
    "/en/signup/vendor",
    "/bn/signup/vendor",
    "/upgrade",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
  ];

  return [
    ...staticRoutes.map((route) => ({
      url: `${siteUrl}${route}`,
      changeFrequency: route === "" ? ("daily" as const) : ("weekly" as const),
      priority: route === "" ? 1 : 0.7,
    })),
    ...matrimonyMarkets.map((market) => ({
      url: `${siteUrl}/matrimony/${market.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.72,
    })),
    ...(profiles?.results ?? []).map((profile) => ({
      url: `${siteUrl}/profiles/${profile.displayId}`,
      changeFrequency: "daily" as const,
      priority: 0.64,
    })),
    ...(profiles?.results ?? []).flatMap((profile) => [
      {
        url: `${siteUrl}/en/profiles/${profile.displayId}`,
        changeFrequency: "daily" as const,
        priority: 0.62,
      },
      {
        url: `${siteUrl}/bn/profiles/${profile.displayId}`,
        changeFrequency: "daily" as const,
        priority: 0.62,
      },
    ]),
    ...(vendors ?? []).map((vendor) => ({
      url: `${siteUrl}/vendors/${vendor.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.68,
    })),
    ...(vendors ?? []).flatMap((vendor) => [
      {
        url: `${siteUrl}/en/vendors/${vendor.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.66,
      },
      {
        url: `${siteUrl}/bn/vendors/${vendor.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.66,
      },
    ]),
    ...(ghotoks ?? []).map((ghotok) => ({
      url: `${siteUrl}/ghotok/${ghotok.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.66,
    })),
    ...(ghotoks ?? []).flatMap((ghotok) => [
      {
        url: `${siteUrl}/en/ghotok/${ghotok.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.64,
      },
      {
        url: `${siteUrl}/bn/ghotok/${ghotok.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.64,
      },
    ]),
    ...matrimonyMarkets.flatMap((market) => [
      {
        url: `${siteUrl}/en/matrimony/${market.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      },
      {
        url: `${siteUrl}/bn/matrimony/${market.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      },
    ]),
  ];
}
