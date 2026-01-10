export const runtime = "nodejs";

type Article = {
  title: string;
  slug: string;
  excerpt: string | null;
  publishedAt: string | null;
  updatedAt?: string;
};

function escapeXml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

async function fetchLatestArticles(): Promise<Article[]> {
  const baseUrl = process.env.NEXT_PUBLIC_STRAPI_URL;
  if (!baseUrl) return [];

  const url =
    `${baseUrl}/api/articles?` +
    `sort=publishedAt:desc&` +
    `pagination[pageSize]=50&` +
    `fields[0]=title&fields[1]=slug&fields[2]=excerpt&fields[3]=publishedAt&fields[4]=updatedAt`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return [];

  const json = await res.json();
  return (json.data ?? []) as Article[];
}

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const siteTitle = "Crypto Portal";
  const siteDescription = "Latest crypto news, market insights, and blockchain trends.";

  const articles = await fetchLatestArticles();

  const itemsXml = articles
    .map((a) => {
      const link = `${siteUrl}/news/${a.slug}`;
      const pubDate = a.publishedAt ? new Date(a.publishedAt).toUTCString() : new Date().toUTCString();
      const description = a.excerpt ? escapeXml(a.excerpt) : "";

      return `
      <item>
        <title>${escapeXml(a.title)}</title>
        <link>${escapeXml(link)}</link>
        <guid isPermaLink="true">${escapeXml(link)}</guid>
        <pubDate>${pubDate}</pubDate>
        ${description ? `<description>${description}</description>` : ""}
      </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(siteTitle)}</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>${escapeXml(siteDescription)}</description>
    <language>en-US</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${itemsXml}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
