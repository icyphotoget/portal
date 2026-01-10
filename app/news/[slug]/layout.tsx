import type { Metadata } from "next";

type ParamsLike = { slug: string } | Promise<{ slug: string }>;

type Article = {
  title: string;
  slug: string;
  excerpt: string | null;
  publishedAt: string | null;
  updatedAt?: string | null;
  coverImage?: any;
};

function absolutizeStrapiUrl(maybeRelativeUrl: string | null | undefined) {
  if (!maybeRelativeUrl) return null;
  if (maybeRelativeUrl.startsWith("http")) return maybeRelativeUrl;

  const base = process.env.NEXT_PUBLIC_STRAPI_URL;
  return base ? `${base}${maybeRelativeUrl}` : maybeRelativeUrl;
}

function pickMediaUrl(media: any): string | null {
  if (!media) return null;

  // Strapi v5 flat media: { url: "/uploads/..." }
  if (typeof media.url === "string") return absolutizeStrapiUrl(media.url);

  // Strapi v4 style: { data: { attributes: { url } } }
  const v4 = media?.data?.attributes?.url;
  if (typeof v4 === "string") return absolutizeStrapiUrl(v4);

  return null;
}

async function fetchArticleBySlug(slug: string): Promise<Article | null> {
  const baseUrl = process.env.NEXT_PUBLIC_STRAPI_URL;
  if (!baseUrl) return null;

  const url =
    `${baseUrl}/api/articles?` +
    `filters[slug][$eq]=${encodeURIComponent(slug)}` +
    `&populate=coverImage` +
    `&fields[0]=title&fields[1]=slug&fields[2]=excerpt&fields[3]=publishedAt&fields[4]=updatedAt`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;

  const json = await res.json();
  return (json.data?.[0] ?? null) as Article | null;
}

export async function generateMetadata({
  params,
}: {
  params: ParamsLike;
}): Promise<Metadata> {
  const { slug } = await Promise.resolve(params);

  const article = await fetchArticleBySlug(slug);

  if (!article) {
    return {
      title: "Article not found",
      description: "This article could not be found.",
      robots: { index: false, follow: false },
    };
  }

  const siteName = "Crypto Portal";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const title = `${article.title} | ${siteName}`;
  const description =
    (article.excerpt ?? "").trim() || "Latest crypto news and market updates.";

  const canonical = `${siteUrl}/news/${article.slug}`;

  const cover = (article as any).coverImage;
  const coverUrl = Array.isArray(cover) ? pickMediaUrl(cover[0]) : pickMediaUrl(cover);

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      type: "article",
      url: canonical,
      images: coverUrl ? [{ url: coverUrl }] : undefined,
    },
    twitter: {
      card: coverUrl ? "summary_large_image" : "summary",
      title,
      description,
      images: coverUrl ? [coverUrl] : undefined,
    },
  };
}

export default async function ArticleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: ParamsLike;
}) {
  const { slug } = await Promise.resolve(params);
  const article = await fetchArticleBySlug(slug);

  // Ako nema članka, samo render children (page će pokazati "Loading"/"Error" ako si tako napravio)
  // JSON-LD u tom slučaju preskačemo
  if (!article) return <>{children}</>;

  const siteName = "Crypto Portal";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const canonical = `${siteUrl}/news/${article.slug}`;

  const cover = (article as any).coverImage;
  const coverUrl = Array.isArray(cover) ? pickMediaUrl(cover[0]) : pickMediaUrl(cover);

  const published = article.publishedAt ? new Date(article.publishedAt).toISOString() : undefined;
  const modified = article.updatedAt ? new Date(article.updatedAt).toISOString() : published;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonical,
    },
    headline: article.title,
    description: (article.excerpt ?? "").trim() || undefined,
    image: coverUrl ? [coverUrl] : undefined,
    datePublished: published,
    dateModified: modified,
    publisher: {
      "@type": "Organization",
      name: siteName,
      // ako kasnije dodaš logo u /public, odkomentiraj:
      // logo: {
      //   "@type": "ImageObject",
      //   url: `${siteUrl}/logo.png`,
      // },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        // JSON.stringify je safe ovdje, Next to ubaci u HTML
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
