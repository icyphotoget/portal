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
  if (!base) return maybeRelativeUrl;

  const cleanBase = base.replace(/\/+$/, "");
  const cleanPath = maybeRelativeUrl.startsWith("/")
    ? maybeRelativeUrl
    : `/${maybeRelativeUrl}`;

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
  const words = text.trim().split(/\s+/).filter(Boolean).length;
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
    `&pagination[pageSize]=18`;

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

/* -------------------- UI bits -------------------- */

function Chip({
  children,
  href,
}: {
  children: React.ReactNode;
  href?: string;
}) {
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

function SoftGlow() {
  return (
    <>
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-48 -right-48 h-[28rem] w-[28rem] rounded-full bg-white/5 blur-3xl" />
    </>
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

function Cover({
  title,
  coverUrl,
  cat,
  metaLine,
  variant,
}: {
  title: string;
  coverUrl: string | null;
  cat: Category | null;
  metaLine: string;
  variant: "featured" | "card";
}) {
  const aspect = variant === "featured" ? "aspect-[16/9]" : "aspect-[16/10]";
  return (
    <div className={`relative w-full ${aspect} overflow-hidden bg-zinc-900`}>
      <CategoryBadge cat={cat} />

      {coverUrl ? (
        <Image
          src={coverUrl}
          alt={title}
          fill
          sizes={variant === "featured" ? "(max-width: 1024px) 100vw, 60vw" : "(max-width: 1024px) 100vw, 33vw"}
          className="object-cover opacity-95 transition duration-300 group-hover:opacity-100 group-hover:scale-[1.02]"
          priority={variant === "featured"}
        />
      ) : (
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900" />
          <SoftGlow />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.08),transparent_55%)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/75 via-zinc-950/10 to-transparent" />

          <div className="relative flex h-full flex-col justify-end p-4">
            {cat ? <Chip href={`/category/${cat.slug}`}>{cat.name}</Chip> : null}
            <div className="mt-2 line-clamp-2 text-lg font-semibold text-zinc-100">
              {title}
            </div>
            <div className="mt-1 text-xs text-zinc-400">{metaLine}</div>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/70 via-transparent to-transparent" />
    </div>
  );
}

function ArticleCard({
  a,
  variant = "card",
}: {
  a: Article;
  variant?: "card" | "featured" | "compact";
}) {
  const coverUrl = firstCoverUrl(a);
  const date = formatDate(a.publishedAt);
  const cat = getArticleCategory(a);
  const readTime = estimateReadTime((a.excerpt ?? "") || a.title);
  const meta = [date, readTime].filter(Boolean).join(" · ");

  const base =
    "group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/25 transition transform-gpu " +
    "hover:bg-zinc-900/55 hover:border-zinc-700 hover:-translate-y-0.5 " +
    "hover:shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_30px_80px_rgba(0,0,0,0.55)]";

  if (variant === "compact") {
    return (
      <Link href={`/news/${a.slug}`} className={`${base} p-4`}>
        <div className="flex items-start gap-3">
          <div className="min-w-0">
            <div className="text-xs text-zinc-400">{meta}</div>
            <div className="mt-1 line-clamp-2 text-base font-semibold">{a.title}</div>
            <div className="mt-2 text-sm text-zinc-300/90">
              <span className="opacity-90 group-hover:opacity-100">Open</span>{" "}
              <span className="inline-block translate-x-0 transition group-hover:translate-x-1">→</span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  const titleClass =
    variant === "featured"
      ? "mt-2 line-clamp-2 text-2xl font-semibold leading-snug"
      : "mt-2 line-clamp-2 text-lg font-semibold leading-snug";

  return (
    <Link href={`/news/${a.slug}`} className={base}>
      <Cover title={a.title} coverUrl={coverUrl} cat={cat} metaLine={meta} variant={variant === "featured" ? "featured" : "card"} />

      <div className={variant === "featured" ? "p-6" : "p-4"}>
        <div className="text-xs text-zinc-400">{meta}</div>
        <div className={titleClass}>{a.title}</div>

        <p className="mt-2 line-clamp-3 text-sm text-zinc-300">
          {a.excerpt ? a.excerpt : "Tap to read the full story."}
        </p>

        <div className="mt-4 inline-flex items-center gap-2 text-sm text-zinc-200/90">
          <span className="opacity-90 group-hover:opacity-100">Open</span>
          <span className="inline-block translate-x-0 transition group-hover:translate-x-1">→</span>
        </div>
      </div>
    </Link>
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

function SectionHeader({
  title,
  subtitle,
  href,
  hrefLabel,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-zinc-400">{subtitle}</p> : null}
      </div>
      {href ? (
        <Link href={href} className="text-sm text-zinc-300 hover:text-zinc-100">
          {hrefLabel ?? "View all"} →
        </Link>
      ) : null}
    </div>
  );
}

/* -------------------- Page -------------------- */

export default async function HomePage() {
  const baseUrl = process.env.NEXT_PUBLIC_STRAPI_URL;

  if (!baseUrl) {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-100">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <p className="text-zinc-300">
            Missing{" "}
            <code className="rounded bg-zinc-900 px-1">NEXT_PUBLIC_STRAPI_URL</code>{" "}
            in environment variables.
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
  const topStories = articles.slice(featured ? 1 : 0, (featured ? 1 : 0) + 2);
  const trending = articles.slice((featured ? 1 : 0) + 2, (featured ? 1 : 0) + 8);
  const latest = articles.slice((featured ? 1 : 0) + 8, (featured ? 1 : 0) + 14);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* Top nav */}
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm text-zinc-300 hover:text-zinc-100">
            Crypto Portal
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/news"
              className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-900"
            >
              News
            </Link>
          </div>
        </div>

        {/* HERO */}
        <div className="relative mt-8 overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/25 p-8 shadow-[0_0_120px_rgba(255,255,255,0.06)]">
          <SoftGlow />

          <div className="relative grid gap-6 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-5">
              <Chip>⚡ Fast</Chip>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
                Crypto Portal
              </h1>
              <p className="mt-3 text-zinc-300">
                Real-time crypto news, memecoins, and narratives — powered by Next.js + Strapi.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/news"
                  className="rounded-xl bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-white"
                >
                  Browse Latest
                </Link>
                <Link
                  href="/sitemap.xml"
                  className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-900"
                >
                  Sitemap
                </Link>
              </div>

              {/* Categories quick pills */}
              {categories.length ? (
                <div className="mt-6">
                  <div className="text-xs text-zinc-500">Browse topics</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {categories.slice(0, 10).map((c) => (
                      <CategoryPill key={c.id} cat={c} />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="lg:col-span-7">
              <div className="mb-3 flex items-center gap-2 text-xs text-zinc-400">
                <span className="rounded-full border border-zinc-800 bg-zinc-950/60 px-3 py-1 text-zinc-100">
                  🔥 Featured
                </span>
                <span className="text-zinc-500">Fresh from Strapi</span>
              </div>

              {featured ? <ArticleCard a={featured} variant="featured" /> : null}

              {topStories.length ? (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {topStories.map((a) => (
                    <ArticleCard key={a.id} a={a} variant="compact" />
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* TRENDING */}
        {trending.length ? (
          <section className="mt-10">
            <SectionHeader
              title="Trending"
              subtitle="Quick picks people are clicking right now."
              href="/news"
              hrefLabel="All news"
            />

            <div className="mt-5 flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {trending.map((a) => (
                <div key={a.id} className="min-w-[280px] max-w-[280px]">
                  <ArticleCard a={a} />
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* LATEST */}
        <section className="mt-12">
          <SectionHeader title="Latest" subtitle="Fresh drops from the CMS." href="/news" />

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
