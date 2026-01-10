import type { MetadataRoute } from "next";

type Article = {
  slug: string;
  updatedAt?: string;
};

async function fetchAllArticleSlugs(): Promise<Article[]> {
  const baseUrl = process.env.NEXT_PUBLIC_STRAPI_URL;
  if (!baseUrl) return [];

  const url = `${baseUrl}/api/articles?fields[0]=slug&fields[1]=updatedAt&pagination[pageSize]=1000`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];

    const json = await res.json();

    return (
      json.data?.map((a: any) => ({
        slug: a.slug,
        updatedAt: a.updatedAt,
      })) ?? []
    );
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const articles = await fetchAllArticleSlugs();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
    },
    {
      url: `${siteUrl}/news`,
      lastModified: new Date(),
    },
  ];

  const articleRoutes: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${siteUrl}/news/${article.slug}`,
    lastModified: article.updatedAt
      ? new Date(article.updatedAt)
      : new Date(),
  }));

  return [...staticRoutes, ...articleRoutes];
}
