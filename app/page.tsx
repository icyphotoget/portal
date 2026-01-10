// app/page.tsx
import Link from "next/link";
import FeaturedCarousel, { type FeaturedItem } from "./components/FeaturedCarousel";
import BottomNav from "./components/BottomNav";

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

/* ----------------- Strapi URL helpers ----------------- */

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
  // Strapi v5: category object directly
  if (a?.category && typeof a.category === "object") return a.category as Category;

  // v4 fallback: category.data.attributes
  const v4 = a?.category?.data?.attributes;
  if (v4?.name && v4?.slug) return { id: a.category.data.id ?? 0, ...v4 } as Category;

  return null;
}

/* ----------------- Fetch ----------------- */

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
    `&pagination[pageSize]=40`;

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

/* ----------------- UI helpers ----------------- */

function Glow() {
  return (
    <>
      <div className="pointer-events-none absolute -left-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-white/6 blur-3xl" />
      <div className="pointer-events-none absolute -right-48 -bottom-56 h-[34rem] w-[34rem] rounded-full bg-white/5 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,rgba(255,255,255,0.12),transparent_55%)]" />
    </>
  );
}

function Pill({ children, href }: { children: React.ReactNode; href?: string }) {
  const cls =
    "inline-flex items-center rounded-full border border-zinc-800 bg-zinc-950/60 px-3 py-1 text-xs text-zinc-100 backdrop-blur hover:bg-zinc-900";
  return href ? (
    <Link href={href} className={cls}>
      {children}
    </Link>
  ) : (
    <span className={cls}>{children}</span>
  );
}

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

function ListItem({ a }: { a: Article }) {
  const coverUrl = firstCoverUrl(a);
  const meta = [formatDate(a.publishedAt), estimateReadTime(a.excerpt ?? a.title)]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      href={`/news/${a.slug}`}
      className="flex items-center justify-between gap-3 rounded-[1.35rem] border border-zinc-800 bg-zinc-900/20 p-4 hover:bg-zinc-900/45 transition"
    >
      <div className="min-w-0">
        <div className="text-xs text-zinc-400">{meta}</div>
        <div className="mt-1 font-semibold leading-snug line-clamp-2">{a.title}</div>
      </div>

      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-zinc-800/60">
        {coverUrl ? (
          <img src={coverUrl} alt={a.title} className="h-full w-full object-cover" loading="lazy" />
        ) : null}
      </div>
    </Link>
  );
}

function GridCard({ a }: { a: Article }) {
  const coverUrl = firstCoverUrl(a);
  const cat = getArticleCategory(a);
  const meta = [formatDate(a.publishedAt), estimateReadTime(a.excerpt ?? a.title)]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      href={`/news/${a.slug}`}
      className="group overflow-hidden rounded-[1.6rem] border border-zinc-800 bg-zinc-900/20 hover:bg-zinc-900/45 transition
                 hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_30px_90px_rgba(0,0,0,0.55)]"
    >
      <div className="relative aspect-[16/10] bg-zinc-900">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={a.title}
            className="absolute inset-0 h-full w-full object-cover opacity-95 transition duration-300 group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900" />
            <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/6 blur-3xl" />
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
          Open <span className="inline-block translate-x-0 transition group-hover:translate-x-1">→</span>
        </div>
      </div>
    </Link>
  );
}

/* ----------------- Page ----------------- */

export default async function HomePage() {
  const baseUrl = process.env.NEXT_PUBLIC_STRAPI_URL;

  if (!baseUrl) {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-100">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <p className="text-zinc-300">
            Missing{" "}
            <code className="rounded bg-zinc-900 px-1">NEXT_PUBLIC_STRAPI_URL</code>.
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

  const desktopHero = articles[0] ?? null;
  const desktopTop = articles.slice(1, 4);
  const desktopTrending = articles.slice(4, 10);
  const desktopGrid = articles.slice(10, 22);
  const desktopSidebarLatest = articles.slice(22, 34);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-6xl px-4 py-6 lg:py-10">
        {/* Top bar */}
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/40 text-sm">
              FP
            </span>
            <div>
              <div className="text-sm font-semibold">FullPort</div>
              <div className="text-xs text-zinc-400">2026 newsroom</div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/news"
              className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-900"
            >
              News
            </Link>
            <Link
              href="/sitemap.xml"
              className="hidden sm:inline-flex rounded-xl border border-zinc-800 bg-zinc-900/25 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-900"
            >
              Sitemap
            </Link>
          </div>
        </header>

        {/* MOBILE: app-like */}
        <div className="mt-6 lg:hidden">
          <div className="relative overflow-hidden rounded-[2rem] border border-zinc-800 bg-zinc-900/15 p-5 shadow-[0_0_140px_rgba(255,255,255,0.06)]">
            <Glow />
            <div className="relative">
              <div className="flex flex-wrap gap-2">
                <Pill>⚡ Live</Pill>
                <Pill>🧠 Narratives</Pill>
                <Pill href="/news">📰 Feed</Pill>
              </div>

              <h1 className="mt-4 text-3xl font-semibold tracking-tight">FullPort</h1>
              <p className="mt-2 text-zinc-300">
                Clean crypto news with a modern, mobile-first feel.
              </p>

              <div className="mt-5">
                <div className="flex items-end justify-between">
                  <h2 className="text-lg font-semibold">Featured</h2>
                  <Link href="/news" className="text-sm text-zinc-300 hover:text-zinc-100">
                    View all →
                  </Link>
                </div>

                <div className="mt-4">
                  <FeaturedCarousel items={featuredItems} intervalMs={5200} />
                </div>
              </div>
            </div>
          </div>

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

          <section className="mt-8">
            <div className="flex items-end justify-between">
              <h2 className="text-lg font-semibold">Latest</h2>
              <Link href="/news" className="text-sm text-zinc-300 hover:text-zinc-100">
                All →
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {latest.map((a) => (
                <ListItem key={a.id} a={a} />
              ))}
            </div>
          </section>

          <BottomNav />
        </div>

        {/* DESKTOP: editorial dashboard */}
        <div className="mt-8 hidden lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Left */}
          <div className="lg:col-span-8">
            {/* Hero */}
            {desktopHero ? (
              <Link
                href={`/news/${desktopHero.slug}`}
                className="group relative block overflow-hidden rounded-[2rem] border border-zinc-800 bg-zinc-900/15
                           shadow-[0_0_160px_rgba(255,255,255,0.06)]"
              >
                <div className="relative aspect-[16/9] bg-zinc-900">
                  {firstCoverUrl(desktopHero) ? (
                    <img
                      src={firstCoverUrl(desktopHero) as string}
                      alt={desktopHero.title}
                      className="absolute inset-0 h-full w-full object-cover opacity-95 transition duration-300 group-hover:scale-[1.02]"
                      loading="lazy"
                    />
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900" />
                      <div className="absolute -left-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-white/6 blur-3xl" />
                      <div className="absolute -right-48 -bottom-56 h-[34rem] w-[34rem] rounded-full bg-white/5 blur-3xl" />
                    </>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/85 via-zinc-950/15 to-transparent" />

                  <div className="absolute bottom-0 p-7">
                    <div className="text-xs text-zinc-300/80">
                      {formatDate(desktopHero.publishedAt)} ·{" "}
                      {estimateReadTime(desktopHero.excerpt ?? desktopHero.title)}
                    </div>
                    <div className="mt-2 text-4xl font-semibold leading-tight">
                      {desktopHero.title}
                    </div>
                    <p className="mt-3 max-w-2xl text-sm text-zinc-200/90 line-clamp-2">
                      {desktopHero.excerpt ?? "Open to read the full story."}
                    </p>
                    <div className="mt-5 inline-flex items-center gap-2 text-sm text-zinc-200/90">
                      <span>Open</span>
                      <span className="inline-block translate-x-0 transition group-hover:translate-x-1">→</span>
                    </div>
                  </div>
                </div>
              </Link>
            ) : null}

            {/* Top stories */}
            <div className="mt-8">
              <div className="flex items-end justify-between">
                <h2 className="text-xl font-semibold">Top stories</h2>
                <Link href="/news" className="text-sm text-zinc-300 hover:text-zinc-100">
                  View all →
                </Link>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-6">
                {desktopTop.map((a) => (
                  <GridCard key={a.id} a={a} />
                ))}
              </div>
            </div>

            {/* Trending shelf */}
            <div className="mt-10">
              <h2 className="text-xl font-semibold">Trending</h2>
              <div className="mt-4 flex gap-4 overflow-x-auto pb-2
                              [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {desktopTrending.map((a) => (
                  <div key={a.id} className="min-w-[320px] max-w-[320px]">
                    <GridCard a={a} />
                  </div>
                ))}
              </div>
            </div>

            {/* Latest grid */}
            <div className="mt-10">
              <h2 className="text-xl font-semibold">Latest</h2>
              <div className="mt-4 grid grid-cols-3 gap-6">
                {desktopGrid.map((a) => (
                  <GridCard key={a.id} a={a} />
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4">
            <div className="sticky top-8 space-y-8">
              <div className="rounded-[1.6rem] border border-zinc-800 bg-zinc-900/15 p-5">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">Latest updates</div>
                  <Link href="/news" className="text-sm text-zinc-300 hover:text-zinc-100">
                    All →
                  </Link>
                </div>

                <div className="mt-4 space-y-3">
                  {desktopSidebarLatest.map((a) => (
                    <ListItem key={a.id} a={a} />
                  ))}
                </div>
              </div>

              {categories.length ? (
                <div className="rounded-[1.6rem] border border-zinc-800 bg-zinc-900/15 p-5">
                  <div className="text-sm font-semibold">Topics</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {categories.slice(0, 22).map((c) => (
                      <CategoryPill key={c.id} cat={c} />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </aside>
        </div>

        {/* Footer */}
        <footer className="mt-14 border-t border-zinc-800 pt-8 text-sm text-zinc-400">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-zinc-200">FullPort</div>
              <div className="mt-1">Independent crypto news & narratives.</div>
            </div>
            <div className="flex gap-4">
              <Link href="/news" className="hover:text-zinc-200">News</Link>
              <Link href="/sitemap.xml" className="hover:text-zinc-200">Sitemap</Link>
            </div>
          </div>
          <div className="mt-6 text-xs">© {new Date().getFullYear()} FullPort</div>
        </footer>
      </div>
    </main>
  );
}
