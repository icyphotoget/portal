"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Category = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
};

type Article = {
  id: number;
  title: string;
  slug: string;
  excerpt?: string | null;
};

type ParamsLike = { slug: string } | Promise<{ slug: string }>;

function pickField<T = any>(item: any, key: string): T | undefined {
  return item?.[key] ?? item?.attributes?.[key];
}

export default function CategoryPage({ params }: { params: ParamsLike }) {
  const [slug, setSlug] = useState<string | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 1) unwrap params (works even if params is Promise)
  useEffect(() => {
    let alive = true;

    Promise.resolve(params)
      .then((p) => {
        if (!alive) return;
        setSlug(p.slug);
      })
      .catch((e) => {
        if (!alive) return;
        setError(`Cannot read route params: ${String(e?.message ?? e)}`);
      });

    return () => {
      alive = false;
    };
  }, [params]);

  // 2) fetch category + articles
  useEffect(() => {
    if (!slug) return;

    const baseUrl = process.env.NEXT_PUBLIC_STRAPI_URL;
    if (!baseUrl) {
      setError("Missing NEXT_PUBLIC_STRAPI_URL in .env.local");
      setLoading(false);
      return;
    }

    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      setCategory(null);
      setArticles([]);

      try {
        // CATEGORY
        const catRes = await fetch(
          `${baseUrl}/api/categories?filters[slug][$eq]=${encodeURIComponent(slug)}`,
          { cache: "no-store" }
        );

        if (!catRes.ok) {
          throw new Error(`Category request failed (HTTP ${catRes.status})`);
        }

        const catJson = await catRes.json();
        const catItem = catJson?.data?.[0];

        if (!catItem) {
          setCategory(null);
          setLoading(false);
          return;
        }

        const cat: Category = {
          id: typeof catItem.id === "number" ? catItem.id : 0,
          name: pickField<string>(catItem, "name") ?? "Untitled category",
          slug: pickField<string>(catItem, "slug") ?? slug,
          description: pickField<string>(catItem, "description") ?? null,
        };

        setCategory(cat);

        // ARTICLES BY CATEGORY SLUG
        const artRes = await fetch(
          `${baseUrl}/api/articles?filters[category][slug][$eq]=${encodeURIComponent(
            cat.slug
          )}&sort=publishedAt:desc&fields[0]=title&fields[1]=slug&fields[2]=excerpt`,
          { cache: "no-store" }
        );

        if (!artRes.ok) {
          throw new Error(`Articles request failed (HTTP ${artRes.status})`);
        }

        const artJson = await artRes.json();
        const list: Article[] = (artJson?.data ?? [])
          .map((item: any) => {
            const title = pickField<string>(item, "title");
            const slugVal = pickField<string>(item, "slug");
            if (!title || !slugVal) return null;

            return {
              id: typeof item.id === "number" ? item.id : 0,
              title,
              slug: slugVal,
              excerpt: pickField<string>(item, "excerpt") ?? null,
            } as Article;
          })
          .filter(Boolean);

        setArticles(list);
      } catch (e: any) {
        setError(String(e?.message ?? e));
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [slug]);

  // UI
  if (error) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Error</h1>
        <pre style={{ whiteSpace: "pre-wrap" }}>{error}</pre>
        <div style={{ marginTop: 16 }}>
          <Link href="/news">← Back to News</Link>
        </div>
      </main>
    );
  }

  if (!slug || loading) {
    return (
      <main style={{ padding: 24 }}>
        Loading category…
      </main>
    );
  }

  if (!category) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Category not found</h1>
        <div style={{ marginTop: 16 }}>
          <Link href="/news">← Back to News</Link>
        </div>
        <p style={{ opacity: 0.7, marginTop: 12 }}>
          Debug: Try{" "}
          <code>
            {process.env.NEXT_PUBLIC_STRAPI_URL}/api/categories?filters[slug][$eq]={slug}
          </code>
        </p>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 32, fontWeight: 700 }}>{category.name}</h1>

      {category.description ? (
        <p style={{ opacity: 0.8, marginTop: 8 }}>{category.description}</p>
      ) : null}

      <div style={{ marginTop: 14 }}>
        <Link href="/news">← Back to News</Link>
      </div>

      <hr style={{ margin: "24px 0", opacity: 0.2 }} />

      {articles.length === 0 ? (
        <p>No articles in this category yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {articles.map((a) => (
            <li key={`${a.id}-${a.slug}`} style={{ marginBottom: 18 }}>
              <Link
                href={`/news/${a.slug}`}
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                {a.title}
              </Link>

              {a.excerpt ? (
                <p style={{ opacity: 0.75, marginTop: 6 }}>{a.excerpt}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
