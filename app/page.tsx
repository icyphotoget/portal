// app/page.tsx
import Image from "next/image";
import Link from "next/link";

type StrapiMedia = any;

type Category = {
  id: number;
  documentId?: string;
  name: string;
  slug: string;
  description?: string | null;
};

type Article = {
  id: number;
  documentId?: string;
  title: string;
  slug: string;
  excerpt: string | null;
  publishedAt: string | null;
  coverImage?: StrapiMedia;
  category?: Category | null;
};

function absolutizeStrapiUrl(maybeRelativeUrl: string | null | undefined) {
  if (!maybeRelativeUrl) return null;
  if (maybeRelativeUrl.startsWith("http")) return maybeRelativeUrl;
  const base = process.env.NEXT_PUBLIC_STRAPI_URL;
  return base ? `${base}${maybeRelativeUrl}` : maybeRelativeUrl;
}

function pickMediaUrl(media: any): string | null {
  if (!media) return null;

  // Strapi v5 often returns media object directly with url
  if (typeof media.url === "string") return absolutizeStrapiUrl(media.url);

  // Strapi v4 style: { data: { attributes: { url } } }
  const v4 = media?.data?.attributes?.url;
  if (typeof v4 === "string") return absolutizeStrapiUrl(v4);

  // Sometimes: { data: [{ attributes: { url } }]}
  const v4arr = media?.data?.[0]?.attributes?.url;
  if (typeof v4arr === "string") return absolutizeStrapiUrl(v4arr);

  return null;
}

function firstCoverUrl(article: any): string | null {
  const c = article?.coverImage;
  if (Array.isArray(c)) return pickMediaUrl(c[0]);
  return pickMediaUrl(c);
}

function formatDate(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function estimateReadTime(text: string) {
  // super simple ~200 wpm
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min read`;
}

function getArticleCategory(a: any): Category | null {
  // Strapi v5 in your screenshot: category is an object directly
  if (a?.category && typeof a.category === "object") return a.category as Category;

  // Fallback v4: category.data.attributes
  const v4 = a?.category?.data?.attributes;
  if (v4?.name && v4?.slug) return { id: a.category.data.id ?? 0, ...v4 } as Category;

  return null;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { next: { revalidate: 60 } }); // cache 60s
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json();
}

async function fetchHomeData(baseUrl: string) {
  // Articles: populate coverImage + category
  // Strapi v5 accepts populate=category&populate=coverImage (as you proved)
  const articlesUrl =
    `${baseUrl}/api/articles?sort=publishedAt:desc` +
    `&populate=coverImage&populate=category` +
    `&pagination[pageSize]=12`;

  const categoriesUrl =
    `${baseUrl}/api/categories?sort=name:asc&pagination[pageSize]=50`;

  const [articlesJson, categoriesJson] = await Promise.all([
    fetchJson<{ data: Article[] }>(articlesUrl),
    fetchJson<{ data: Category[] }>(categoriesUrl),
  ]);

  const articles = (articlesJson.data ?? []).filter(Boolean);
  const categories = (categoriesJson.data ?? []).filter(Boolean);

  return { articles, categories };
}

function CategoryPill({ cat }: { cat: Category }) {
  return (
    <Link
      href={`/category/${cat.slug}`}
      className="inline-flex items-center rounded-full border border-zinc-800 bg-zinc-900/40 px-3 py-1 text-xs text-zinc-200 hover:bg-zinc-900"
    >
      {cat.name}
    </Link>
  );
}

function CategoryBadge({ cat }: { cat: Category | null }) {
  if (!cat) return null;
  return (
    <Link
      href={`/category/${cat.slug}`}
      className="absolute left-3 top-3 z-10 rounded-full border border-zinc-800 bg-zinc-950/70 px-3 py-1 text-xs text-zinc-100 backdrop-blur hover:bg-zinc-900"
    >
      {cat.name}
    </Link>
  );
}

function ArticleCard({
  a,
  variant = "small",
}: {
  a: Article;
  variant?: "big" | "small";
}) {
  const coverUrl = firstCoverUrl(a);
  const date = formatDate(a.publishedAt);
  const cat = getArticleCategory(a);
  const excerptForRead = a.excerpt ?? "";
  const readTime = estimateReadTime(excerptForRead || a.title);

  const imageAspect = variant === "big" ? "aspect-[16/10]" : "aspect-[16/10]";
  const titleClass =
    variant === "big"
      ? "mt-1 line-clamp-2 text-xl font-semibold leading-snug"
      : "mt-1 line-clamp-2 text-lg font-semibold leading-snug";

  return (
    <Link
      href={`/news/${a.slug}`}
      className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/30 transition hover:bg-zinc-900/50"
    >
      <div className={`relative w-full ${imageAspect} bg-zinc-900`}>
        <CategoryBadge cat={cat} />

        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={a.title}
            fill
            sizes={variant === "big" ? "(max-width: 1024px) 100vw, 60vw" : "(max-width: 1024px) 100vw, 33vw"}
            className="object-cover opacity-95 transition group-hover:opacity-100 group-hover:scale-[1.02]"
            priority={variant === "big"}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-zinc-500">
            No cover image
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/70 via-transparent to-transparent" />
      </div>

      <div className="p-4">
        {(date || readTime) && (
          <div className="text-xs text-zinc-400">
            {date ? date : ""}
            {date ? " · " : ""}
            {readTime}
          </div>
        )}

        <div className={titleClass}>{a.title}</div>

        {a.excerpt ? (
          <p className="mt-2 line-clamp-3 text-sm text-zinc-300">{a.excerpt}</p>
        ) : (
          <p className="mt-2 line-clamp-3 text-sm text-zinc-500">No excerpt.</p>
        )}

        <div className="mt-4 text-sm text-zinc-200/90">
          Read more{" "}
          <span className="inline-block translate-x-0 transition group-hover:translate-x-1">
            →
          </span>
        </div>
      </div>
    </Link>
  );
}

export default async function HomePage() {
  const baseUrl = process.env.NEXT_PUBLIC_STRAPI_URL;

  if (!baseUrl) {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-100">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <p className="text-zinc-300">
            Missing{" "}
            <code className="rounded bg-zinc-900 px-1">NEXT_PUBLIC_STRAPI_URL</code>{" "}
            in <code className="rounded bg-zinc-900 px-1">.env</code>.
          </p>
        </div>
      </main>
    );
  }

  let articles: Article[] = [];
  let categories: Category[] = [];

  try {
    const data = await fetchHomeData(baseUrl);
    articles = data.articles;
    categories = data.categories;
  } catch (e: any) {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-100">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <h1 className="text-3xl font-semibold tracking-tight">Crypto Portal</h1>
          <p className="mt-2 text-zinc-300">Failed to load homepage data.</p>
          <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-zinc-900/60 p-4 text-xs text-zinc-200">
            {String(e?.message ?? e)}
          </pre>
        </div>
      </main>
    );
  }

  const featured = articles[0] ?? null;
  const latest = articles.slice(featured ? 1 : 0, (featured ? 1 : 0) + 6);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* Top nav */}
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm text-zinc-300 hover:text-zinc-100">
            Crypto Portal
          </Link>

          <Link
            href="/news"
            className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-900"
          >
            News
          </Link>
        </div>

        {/* Hero */}
        <div className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-900/30 p-8 shadow-[0_0_120px_rgba(255,255,255,0.06)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                Crypto Portal
              </h1>
              <p className="mt-3 text-zinc-300">
                A clean, fast news hub powered by Next.js + Strapi. Browse the latest
                articles, categories, and featured updates.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/news"
                  className="rounded-xl bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-white"
                >
                  Browse News
                </Link>
                <Link
                  href="/sitemap.xml"
                  className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-900"
                >
                  Sitemap
                </Link>
              </div>
            </div>

            {featured ? (
              <div className="w-full lg:max-w-md">
                <div className="mb-2 flex items-center gap-2 text-xs text-zinc-400">
                  <span className="rounded-full border border-zinc-800 bg-zinc-950/50 px-3 py-1">
                    Featured
                  </span>
                  <span>Fresh from Strapi</span>
                </div>
                <ArticleCard a={featured} variant="big" />
              </div>
            ) : null}
          </div>
        </div>

        {/* Categories */}
        {categories.length > 0 ? (
          <section className="mt-10">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Categories</h2>
                <p className="mt-1 text-sm text-zinc-400">Browse by topic.</p>
              </div>
              <Link href="/news" className="text-sm text-zinc-300 hover:text-zinc-100">
                View all →
              </Link>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {categories.slice(0, 12).map((c) => (
                <CategoryPill key={c.id} cat={c} />
              ))}
            </div>
          </section>
        ) : null}

        {/* Latest */}
        <section className="mt-12">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Latest News</h2>
              <p className="mt-1 text-sm text-zinc-400">Fresh from Strapi.</p>
            </div>
            <Link href="/news" className="text-sm text-zinc-300 hover:text-zinc-100">
              View all →
            </Link>
          </div>

          {latest.length === 0 ? (
            <p className="mt-6 text-zinc-300">No published articles yet.</p>
          ) : (
            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {latest.map((a) => (
                <ArticleCard key={a.id} a={a} />
              ))}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="mt-16 border-t border-zinc-800 pt-8 text-sm text-zinc-400">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-zinc-200">Crypto Portal</div>
              <div className="mt-1">Independent crypto news & insights.</div>
            </div>
            <div className="flex gap-4">
              <Link href="/news" className="hover:text-zinc-200">News</Link>
              <Link href="/sitemap.xml" className="hover:text-zinc-200">Sitemap</Link>
            </div>
          </div>
          <div className="mt-6 text-xs">© {new Date().getFullYear()}</div>
        </footer>
      </div>
    </main>
  );
}
