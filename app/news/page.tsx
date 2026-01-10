// app/news/page.tsx
import Link from "next/link";

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
  excerpt?: string | null;
  content?: any;
  publishedAt?: string | null;

  // Strapi media (can be various shapes depending on populate/transform)
  coverImage?: any;

  // IMPORTANT: in your API response, category is a flat object (not data/attributes)
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

  // flat
  if (typeof media?.url === "string") return absolutizeStrapiUrl(media.url);

  // sometimes nested
  if (typeof media?.attributes?.url === "string") return absolutizeStrapiUrl(media.attributes.url);

  // classic v4 media
  if (typeof media?.data?.attributes?.url === "string")
    return absolutizeStrapiUrl(media.data.attributes.url);

  return null;
}

function firstCoverUrl(article: Article): string | null {
  const c = article?.coverImage;
  if (!c) return null;
  if (Array.isArray(c)) return pickMediaUrl(c[0]);
  return pickMediaUrl(c);
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" });
}

export default async function NewsPage() {
  const baseUrl = process.env.NEXT_PUBLIC_STRAPI_URL;

  if (!baseUrl) {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-100">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <p className="text-zinc-300">
            Missing <code className="rounded bg-zinc-900 px-1">NEXT_PUBLIC_STRAPI_URL</code> in{" "}
            <code className="rounded bg-zinc-900 px-1">.env.local</code>.
          </p>
        </div>
      </main>
    );
  }

  // ✅ correct populate keys for your schema
  const res = await fetch(
    `${baseUrl}/api/articles?sort=publishedAt:desc&populate=coverImage&populate=category`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    const text = await res.text();
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-100">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <h1 className="text-2xl font-semibold">News</h1>
          <p className="mt-2 text-zinc-300">Failed to fetch articles. HTTP {res.status}</p>
          <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-zinc-900/60 p-4 text-xs text-zinc-200">
            {text}
          </pre>
        </div>
      </main>
    );
  }

  const json = await res.json();
  const articles: Article[] = json?.data ?? [];

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">News</h1>
            <p className="mt-2 text-sm text-zinc-400">Latest posts from your Strapi newsroom.</p>
          </div>

          <Link
            href="/"
            className="hidden rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-900 md:inline"
          >
            Home
          </Link>
        </div>

        {articles.length === 0 ? (
          <p className="mt-8 text-zinc-300">No published articles yet.</p>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => {
              const coverUrl = firstCoverUrl(a);
              const date = formatDate(a.publishedAt);
              const cat = a?.category ?? null;

              return (
                <div
                  key={a.id}
                  className="group overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/50 transition"
                >
                  <Link href={`/news/${a.slug}`} className="block">
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
                  </Link>

                  <div className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      {date ? <div className="text-xs text-zinc-400">{date}</div> : <div />}

                      {/* ✅ small category badge */}
                      {cat?.slug ? (
                        <Link
                          href={`/category/${cat.slug}`}
                          className="rounded-full border border-zinc-700 bg-zinc-950/40 px-2.5 py-0.5 text-xs text-zinc-200 hover:bg-zinc-900"
                        >
                          {cat.name}
                        </Link>
                      ) : null}
                    </div>

                    <Link href={`/news/${a.slug}`} className="block">
                      <div className="mt-2 line-clamp-2 text-lg font-semibold leading-snug">
                        {a.title}
                      </div>

                      {a.excerpt ? (
                        <p className="mt-2 line-clamp-3 text-sm text-zinc-300">{a.excerpt}</p>
                      ) : (
                        <p className="mt-2 line-clamp-3 text-sm text-zinc-500">No excerpt.</p>
                      )}

                      <div className="mt-4 text-sm text-zinc-200/90">
                        Read more{" "}
                        <span className="inline-block translate-x-0 group-hover:translate-x-1 transition">
                          →
                        </span>
                      </div>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
