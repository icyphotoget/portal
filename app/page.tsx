// app/page.tsx
type Article = {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  excerpt: string | null;
  publishedAt: string | null;
  coverImage?: any;
  category?: {
    id: number;
    documentId: string;
    name: string;
    slug: string;
  } | null;
};

function absolutizeStrapiUrl(maybeRelativeUrl: string | null | undefined) {
  if (!maybeRelativeUrl) return null;
  if (maybeRelativeUrl.startsWith("http")) return maybeRelativeUrl;
  const base = process.env.NEXT_PUBLIC_STRAPI_URL;
  return base ? `${base}${maybeRelativeUrl}` : maybeRelativeUrl;
}

function pickMediaUrl(media: any): string | null {
  if (!media) return null;
  if (typeof media?.url === "string") return absolutizeStrapiUrl(media.url);
  const v4 = media?.data?.attributes?.url;
  if (typeof v4 === "string") return absolutizeStrapiUrl(v4);
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

async function fetchLatestArticles(): Promise<Article[]> {
  const baseUrl = process.env.NEXT_PUBLIC_STRAPI_URL;
  if (!baseUrl) return [];

  const res = await fetch(
    `${baseUrl}/api/articles?sort=publishedAt:desc&pagination[pageSize]=6&populate=coverImage&populate=category`,
    { cache: "no-store" }
  );

  if (!res.ok) return [];
  const json = await res.json();
  return (json.data ?? []) as Article[];
}

export default async function HomePage() {
  const latest = await fetchLatestArticles();

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm text-zinc-400">Crypto Portal</div>
          <a
            href="/news"
            className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-900"
          >
            News
          </a>
        </div>

        {/* Hero */}
        <div className="mt-10 rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-900/40 to-zinc-950/10 p-6 md:p-10">
          <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
            Crypto Portal
          </h1>
          <p className="mt-3 max-w-2xl text-zinc-300 md:text-lg">
            A clean, fast news hub powered by Next.js + Strapi. Browse the latest
            articles, categories, and featured updates.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/news"
              className="rounded-xl bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white"
            >
              Browse News
            </a>
            <a
              href="/sitemap.xml"
              className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-900"
            >
              Sitemap
            </a>
          </div>
        </div>

        {/* Latest */}
        <div className="mt-10 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Latest News</h2>
            <p className="mt-1 text-sm text-zinc-400">Fresh from Strapi.</p>
          </div>
          <a href="/news" className="text-sm text-zinc-200 hover:underline">
            View all →
          </a>
        </div>

        {latest.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 text-zinc-300">
            No articles yet. Create & publish one in Strapi.
          </div>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {latest.map((a) => {
              const coverUrl = firstCoverUrl(a);
              const date = formatDate(a.publishedAt);
              const cat = a.category;

              return (
                <a
                  key={a.id}
                  href={`/news/${a.slug}`}
                  className="group overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/50 transition"
                >
                  <div className="relative aspect-[16/10] w-full bg-zinc-900">
                    {coverUrl ? (
                      <img
                        src={coverUrl}
                        alt={a.title}
                        className="h-full w-full object-cover opacity-95 group-hover:opacity-100 transition"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm text-zinc-500">
                        No cover image
                      </div>
                    )}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/70 via-transparent to-transparent" />
                  </div>

                  <div className="p-4">
                    {date ? <div className="text-xs text-zinc-400">{date}</div> : null}

                    {/* small tag (non-clickable, safe for server component) */}
                    {cat?.name ? (
                      <div className="mt-2 inline-flex rounded-full border border-zinc-700 bg-zinc-950/40 px-2 py-0.5 text-xs text-zinc-200">
                        {cat.name}
                      </div>
                    ) : null}

                    <div className="mt-2 line-clamp-2 text-lg font-semibold leading-snug">
                      {a.title}
                    </div>

                    <p className="mt-2 line-clamp-3 text-sm text-zinc-300">
                      {a.excerpt ?? "No excerpt."}
                    </p>

                    <div className="mt-4 text-sm text-zinc-200/90">
                      Read more{" "}
                      <span className="inline-block translate-x-0 group-hover:translate-x-1 transition">
                        →
                      </span>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
