// app/page.tsx
import path from "path";
import Link from "next/link";
import FeaturedCarousel, { type FeaturedItem } from "./components/FeaturedCarousel";

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
  if (!base) return maybeRelativeUrl;

  const cleanBase = base.replace(/\/+$/, "");
  const cleanPath = maybeRelativeUrl.startsWith("/") ? maybeRelativeUrl : `/${maybeRelativeUrl}`;
  return `${cleanBase}${cleanPath}`;
}

function pickMediaUrl(media: any): string | null {
  if (!media) return null;

  // Strapi v5: media.url
  if (typeof media.url === "string") return absolutizeStrapiUrl(media.url);

  // Strapi v4: { data: { attributes: { url } } }
  const v4 = media?.data?.attributes?.url;
  if (typeof v4 === "string") return absolutizeStrapiUrl(v4);

  // v4 array: { data: [{ attributes: { url } }]}
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
  const words = (text ?? "").trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min read`;
}

function getArticleCategory(a: any): Category | null {
  if (a?.category && typeof a.category === "object") return a.category as Category;

  const v4 = a?.category?.data?.attributes;
  if (v4?.name && v4?.slug) return { id: a.category.data.id ?? 0, ...v4 } as Category;

  return null;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json();
}

async function fetchHomeData(baseUrl: string) {
  const articlesUrl =
    `${baseUrl}/api/articles?sort=publishedAt:desc` +
    `&populate=coverImage&populate=category` +
    `&pagination[pageSize]=30`;

  const categoriesUrl =
    `${baseUrl}/api/categories?sort=name:asc&pagination[pageSize]=50`;

  const [articlesJson, categoriesJson] = await Promise.all([
    fetchJson<{ data: Article[] }>(articlesUrl),
    fetchJson<{ data: Category[] }>(categoriesUrl),
  ]);

  return {
    articles: (articlesJson.data ?? []).filter(Boolean),
    categories: (categoriesJson.data ?? []).filter(Boolean),
  };
}

/* -------- UI bits -------- */

function CategoryPill({ cat }: { cat: Category }) {
  return (
    <Link
      href={`/category/${cat.slug}`}
      className="inline-flex items-center rounded-full border border-zinc-800 bg-zinc-900/35 px-3 py-1 text-xs text-zinc-200 hover:bg-zinc-900"
    >
      {cat.name}
    </Link>
  );
}

function MiniListItem({ a }: { a: Article }) {
  const coverUrl = firstCoverUrl(a);
  const meta = [formatDate(a.publishedAt), estimateReadTime(a.excerpt ?? a.title)]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      href={`/news/${a.slug}`}
      className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/20 p-4 hover:bg-zinc-900/45"
    >
      <div className="min-w-0">
        <div className="text-xs text-zinc-400">{meta}</div>
        <div className="mt-1 font-semibold leading-snug line-clamp-2">{a.title}</div>
      </div>

      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-zinc-800/60">
        {coverUrl ? (
          <img src={coverUrl} alt={a.title} className="h-full w-full object-cover" loading="lazy" />
        ) : null}
      </div>
    </Link>
  );
}

function DesktopCard({ a }: { a: Article }) {
  const coverUrl = firstCoverUrl(a);
  const cat = getArticleCategory(a);
  const meta = [formatDate(a.publishedAt), estimateReadTime(a.excerpt ?? a.title)]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      href={`/news/${a.slug}`}
      className="group overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/20 hover:bg-zinc-900/45 transition"
    >
      <div className="relative aspect-[16/10] bg-zinc-900">
        {coverUrl ? (
          <img src={coverUrl} alt={a.title} className="absolute inset-0 h-full w-full object-cover opacity-95" loading="lazy" />
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900" />
            <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
            <div className="absolute -bottom-28 -right-28 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
          </>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />

        {cat ? (
          <span className="absolute left-3 top-3 rounded-full border border-zinc-800 bg-zinc-950/60 px-3 py-1 text-xs text-zinc-100 backdrop-blur">
            {cat.name}
          </span>
        ) : null}
      </div>

      <div className="p-4">
        <div className="text-xs text-zinc-400">{meta}</div>
        <div className="mt-2 text-lg font-semibold leading-snug line-clamp-2">{a.title}</div>
        <p className="mt-2 text-sm text-zinc-300 line-clamp-3">{a.excerpt ?? "Open to read the full story."}</p>
        <div className="mt-4 text-sm text-zinc-200/90">
          Open <span className="inline-block transition group-hover:translate-x-1">→</span>
        </div>
      </div>
    </Link>
  );
}

/* -------- PAGE -------- */

export default async function HomePage() {
  const baseUrl = process.env.NEXT_PUBLIC_STRAPI_URL;

  if (!baseUrl) {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-100">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <p className="text-zinc-300">
            Missing <code className="rounded bg-zinc-900 px-1">NEXT_PUBLIC_STRAPI_URL</code>.
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
          <h1 className="text-3xl font-semibold tracking-tight">FullPort</h1>
          <p className="mt-2 text-zinc-300">Failed to load homepage data.</p>
          <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-zinc-900/60 p-4 text-xs text-zinc-200">
            {String(e?.message ?? e)}
          </pre>
        </div>
      </main>
    );
  }

  const featured = articles.slice(0, 6);
  const latest = articles.slice(6, 26);

  const featuredItems: FeaturedItem[] = featured.map((a) => ({
    id: a.id,
    title: a.title,
    slug: a.slug,
    excerpt: a.excerpt,
    publishedAt: a.publishedAt,
    coverUrl: firstCoverUrl(a),
    category: (() => {
      const c = getArticleCategory(a);
      return c ? { name: c.name, slug: c.slug } : null;
    })(),
  }));

  const desktopFeatured = featured[0] ?? null;
  const desktopTop = featured.slice(1, 3);
  const desktopGrid = articles.slice(3, 12);
  const desktopLatest = articles.slice(12, 24);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-6xl px-4 py-6 lg:py-10">
        {/* TOP BAR */}
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/40 text-sm">
              FP
            </span>
            <div>
              <div className="text-sm font-semibold">FullPort</div>
              <div className="text-xs text-zinc-400">Crypto newsroom</div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/news"
              className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-900"
            >
              News
            </Link>
          </div>
        </header>

        {/* MOBILE */}
        <div className="mt-6 lg:hidden">
          {/* Featured autoplay carousel */}
          <div className="flex items-end justify-between">
            <h2 className="text-lg font-semibold">Featured</h2>
            <Link href="/news" className="text-sm text-zinc-300 hover:text-zinc-100">
              View all →
            </Link>
          </div>

          <div className="mt-4">
            <FeaturedCarousel items={featuredItems} intervalMs={4500} />
          </div>

          {/* Categories */}
          {categories.length ? (
            <section className="mt-7">
              <div className="text-xs text-zinc-500">Topics</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {categories.slice(0, 12).map((c) => (
                  <CategoryPill key={c.id} cat={c} />
                ))}
              </div>
            </section>
          ) : null}

          {/* Latest list */}
          <section className="mt-8">
            <div className="flex items-end justify-between">
              <h2 className="text-lg font-semibold">Latest</h2>
              <Link href="/news" className="text-sm text-zinc-300 hover:text-zinc-100">
                All →
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {latest.map((a) => (
                <MiniListItem key={a.id} a={a} />
              ))}
            </div>
          </section>

          {/* Bottom nav (mobile only) */}
          <nav className="fixed bottom-4 left-1/2 z-50 w-[92%] -translate-x-1/2">
            <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 backdrop-blur px-4 py-3 flex items-center justify-around">
              <Link
                href="/"
                className="rounded-2xl bg-white text-zinc-950 px-4 py-2 text-sm font-medium"
              >
                Home
              </Link>
              <Link href="/news" className="px-4 py-2 text-sm text-zinc-200">
                News
              </Link>
              <Link href="/categories" className="px-4 py-2 text-sm text-zinc-200">
                Topics
              </Link>
              <Link href="/sitemap.xml" className="px-4 py-2 text-sm text-zinc-200">
                Map
              </Link>
            </div>
          </nav>

          <div className="h-24" />
        </div>

        {/* DESKTOP */}
        <div className="mt-8 hidden lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Left: featured + top */}
          <div className="lg:col-span-7">
            <div className="flex items-end justify-between">
              <h2 className="text-xl font-semibold">Featured</h2>
              <Link href="/news" className="text-sm text-zinc-300 hover:text-zinc-100">
                View all →
              </Link>
            </div>

            <div className="mt-4 space-y-6">
              {desktopFeatured ? (
                <Link
                  href={`/news/${desktopFeatured.slug}`}
                  className="block overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/20 hover:bg-zinc-900/45 transition"
                >
                  <div className="relative aspect-[16/9] bg-zinc-900">
                    {firstCoverUrl(desktopFeatured) ? (
                      <img
                        src={firstCoverUrl(desktopFeatured) as string}
                        alt={desktopFeatured.title}
                        className="absolute inset-0 h-full w-full object-cover opacity-95"
                        loading="lazy"
                      />
                    ) : (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900" />
                        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
                        <div className="absolute -bottom-28 -right-28 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
                      </>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/85 via-zinc-950/10 to-transparent" />

                    <div className="absolute bottom-0 p-6">
                      <div className="text-xs text-zinc-300/80">
                        {formatDate(desktopFeatured.publishedAt)} ·{" "}
                        {estimateReadTime(desktopFeatured.excerpt ?? desktopFeatured.title)}
                      </div>
                      <div className="mt-2 text-3xl font-semibold leading-snug">
                        {desktopFeatured.title}
                      </div>
                      <p className="mt-2 text-sm text-zinc-200/90 line-clamp-2">
                        {desktopFeatured.excerpt ?? "Open to read the full story."}
                      </p>
                    </div>
                  </div>
                </Link>
              ) : null}

              <div className="grid grid-cols-2 gap-6">
                {desktopTop.map((a) => (
                  <DesktopCard key={a.id} a={a} />
                ))}
              </div>
            </div>

            {/* Grid */}
            <div className="mt-10">
              <h3 className="text-lg font-semibold">Trending</h3>
              <div className="mt-4 grid grid-cols-2 gap-6">
                {desktopGrid.map((a) => (
                  <DesktopCard key={a.id} a={a} />
                ))}
              </div>
            </div>
          </div>

          {/* Right: latest list */}
          <aside className="lg:col-span-5">
            <h2 className="text-xl font-semibold">Latest</h2>
            <div className="mt-4 space-y-3">
              {desktopLatest.map((a) => (
                <MiniListItem key={a.id} a={a} />
              ))}
            </div>

            {/* Topics */}
            {categories.length ? (
              <div className="mt-10">
                <div className="text-sm font-semibold">Topics</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {categories.slice(0, 18).map((c) => (
                    <CategoryPill key={c.id} cat={c} />
                  ))}
                </div>
              </div>
            ) : null}
          </aside>
        </div>

        {/* FOOTER */}
        <footer className="mt-14 border-t border-zinc-800 pt-8 text-sm text-zinc-400">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-zinc-200">FullPort</div>
              <div className="mt-1">Independent crypto news & narratives.</div>
            </div>
            <div className="flex gap-4">
              <Link href="/news" className="hover:text-zinc-200">
                News
              </Link>
              <Link href="/sitemap.xml" className="hover:text-zinc-200">
                Sitemap
              </Link>
            </div>
          </div>
          <div className="mt-6 text-xs">© {new Date().getFullYear()} FullPort</div>
        </footer>
      </div>
    </main>
  );
}
