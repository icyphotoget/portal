"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type Category = { name: string; slug: string };

export type FeaturedItem = {
  id: number;
  title: string;
  slug: string;
  publishedAt: string | null;
  excerpt?: string | null;
  coverUrl: string | null; // apsolutni URL (cdn/strapi)
  category: Category | null;
};

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

export default function FeaturedCarousel({
  items,
  intervalMs = 4500,
}: {
  items: FeaturedItem[];
  intervalMs?: number;
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const count = items.length;

  const scrollToIndex = (idx: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const child = el.children.item(idx) as HTMLElement | null;
    if (!child) return;
    el.scrollTo({ left: child.offsetLeft, behavior: "smooth" });
  };

  // autoplay
  useEffect(() => {
    if (paused) return;
    if (count <= 1) return;

    const t = setInterval(() => {
      setActive((a) => (a + 1) % count);
    }, intervalMs);

    return () => clearInterval(t);
  }, [paused, count, intervalMs]);

  // scroll when active changes
  useEffect(() => {
    scrollToIndex(active);
  }, [active]);

  // sync active when user scrolls manually
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const onScroll = () => {
      const children = Array.from(el.children) as HTMLElement[];
      let bestIdx = 0;
      let bestDist = Infinity;
      const left = el.scrollLeft;

      children.forEach((c, idx) => {
        const dist = Math.abs(c.offsetLeft - left);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = idx;
        }
      });

      setActive(bestIdx);
    };

    let raf = 0;
    const handler = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(onScroll);
    };

    el.addEventListener("scroll", handler, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", handler);
    };
  }, []);

  const dots = useMemo(() => Array.from({ length: count }), [count]);

  if (!items.length) return null;

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      <div
        ref={scrollerRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2
                   [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((a) => {
          const meta = [formatDate(a.publishedAt), estimateReadTime(a.excerpt || a.title)]
            .filter(Boolean)
            .join(" · ");

          return (
            <Link
              key={a.id}
              href={`/news/${a.slug}`}
              className="snap-center min-w-[88%] md:min-w-[70%] lg:min-w-[56%]
                         overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/25"
            >
              <div className="relative aspect-[16/10] bg-zinc-900">
                {a.coverUrl ? (
                  // CDN-safe: direktni <img> (nema Next optimizer 400)
                  <img
                    src={a.coverUrl}
                    alt={a.title}
                    className="absolute inset-0 h-full w-full object-cover opacity-95"
                    loading="lazy"
                  />
                ) : (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900" />
                    <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
                    <div className="absolute -bottom-28 -right-28 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(255,255,255,0.10),transparent_55%)]" />
                  </>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-zinc-950/10 to-transparent" />

                <div className="absolute bottom-0 p-4">
                  {a.category ? (
                    <span className="inline-flex items-center rounded-full border border-zinc-800 bg-zinc-950/60 px-3 py-1 text-xs text-zinc-100 backdrop-blur">
                      {a.category.name}
                    </span>
                  ) : null}

                  <div className="mt-2 text-xs text-zinc-300/80">{meta}</div>
                  <div className="mt-1 line-clamp-2 text-xl font-semibold leading-snug">
                    {a.title}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {count > 1 ? (
        <div className="mt-3 flex items-center justify-center gap-2">
          {dots.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setActive(i)}
              className={[
                "h-2 w-2 rounded-full transition",
                i === active ? "bg-zinc-100" : "bg-zinc-700 hover:bg-zinc-600",
              ].join(" ")}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
