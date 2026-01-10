"use client";

import { useEffect, useMemo, useState } from "react";
import StrapiBlocks from "@/app/components/StrapiBlocks";

type Article = {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: any;
  publishedAt: string | null;
  coverImage?: any;
};

type ParamsLike = { slug: string } | Promise<{ slug: string }>;

function absolutizeStrapiUrl(maybeRelativeUrl: string | null | undefined) {
  if (!maybeRelativeUrl) return null;
  if (maybeRelativeUrl.startsWith("http")) return maybeRelativeUrl;
  const base = process.env.NEXT_PUBLIC_STRAPI_URL;
  return base ? `${base}${maybeRelativeUrl}` : maybeRelativeUrl;
}

function pickMediaUrl(media: any): string | null {
  if (!media) return null;
  if (typeof media.url === "string") return absolutizeStrapiUrl(media.url);
  const v4 = media?.data?.attributes?.url;
  if (typeof v4 === "string") return absolutizeStrapiUrl(v4);
  return null;
}

function formatDate(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "2-digit" });
}

export default function ArticlePage({ params }: { params: ParamsLike }) {
  const [slug, setSlug] = useState<string | null>(null);
  const [article, setArticle] = useState<Article | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.resolve(params)
      .then((p) => alive && setSlug(p.slug))
      .catch((e) => alive && setError(`Could not read route params: ${String(e?.message ?? e)}`));
    return () => {
      alive = false;
    };
  }, [params]);

  useEffect(() => {
    if (!slug) return;

    const baseUrl = process.env.NEXT_PUBLIC_STRAPI_URL;
    if (!baseUrl) {
      setError("Missing NEXT_PUBLIC_STRAPI_URL in .env.local");
      return;
    }

    const url = `${baseUrl}/api/articles?filters[slug][$eq]=${encodeURIComponent(
      slug
    )}&populate=coverImage`;

    let alive = true;
    setError(null);
    setArticle(null);

    fetch(url)
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
        return r.json();
      })
      .then((json) => alive && setArticle((json.data?.[0] ?? null) as Article | null))
      .catch((e) => alive && setError(String(e?.message ?? e)));

    return () => {
      alive = false;
    };
  }, [slug]);

  const coverUrl = useMemo(() => {
    if (!article) return null;
    const c = (article as any).coverImage;
    if (Array.isArray(c)) return pickMediaUrl(c[0]);
    return pickMediaUrl(c);
  }, [article]);

  if (error) {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-100">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <h1 className="text-2xl font-semibold">Error</h1>
          <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-zinc-900/60 p-4 text-xs text-zinc-200">
            {error}
          </pre>
          <a className="mt-6 inline-block text-sm text-zinc-300 hover:text-white" href="/news">
            ← Back to News
          </a>
        </div>
      </main>
    );
  }

  if (!slug) {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-100">
        <div className="mx-auto max-w-3xl px-4 py-10 text-zinc-300">Loading route…</div>
      </main>
    );
  }

  if (!article) {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-100">
        <div className="mx-auto max-w-3xl px-4 py-10 text-zinc-300">Loading article…</div>
      </main>
    );
  }

  const date = formatDate(article.publishedAt);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <a className="text-sm text-zinc-300 hover:text-white" href="/news">
          ← Back to News
        </a>

        <div className="mt-6">
          {date ? <div className="text-xs text-zinc-400">{date}</div> : null}
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{article.title}</h1>

          {article.excerpt ? (
            <p className="mt-3 text-zinc-300">{article.excerpt}</p>
          ) : null}
        </div>

        {coverUrl ? (
          <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/30">
            <img
              src={coverUrl}
              alt={article.title}
              className="h-auto w-full object-cover"
              loading="lazy"
            />
          </div>
        ) : null}

        <article className="mt-8">
          {Array.isArray(article.content) ? (
            <StrapiBlocks blocks={article.content} />
          ) : (
            <p className="text-zinc-300">No content.</p>
          )}
        </article>
      </div>
    </main>
  );
}
