"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type CategoryLite = { name: string; slug: string } | null;

export type FeaturedItem = {
  id: number;
  title: string;
  slug: string;
  publishedAt: string | null;
  excerpt?: string | null;
  coverUrl: string | null;
  category: CategoryLite;
};

function formatDate(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" });
}

function estimateReadTime(text: string) {
  const words = (text ?? "").trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min read`;
}

export default function FeaturedCarousel({
  items,
  intervalMs = 5200,
}: {
  items: FeaturedItem[];
  intervalMs?: number;
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1

  const count = items.length;

  const scrollToIndex = (idx: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const child = el.children.item(idx) as HTMLElement | null;
    if (!child) return;
    el.scrollTo({ left: child.offsetLeft, behavior: "smooth" });
  };

  // Sync active index when user swipes
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const onScroll = () => {
      const children = Array.from(el.children) as HTMLElement[];
      let bestIdx = 0;
      let bestDist = Infinity;
      const left = el.scrollLeft;

      for (let i = 0; i < children.length; i++) {
        const dist = Math.abs(children[i].offsetLeft - left);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = i;
        }
      }
      setActive(bestIdx);
    };

    const handler = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(onScroll);
    };

    el.addEventListener("scroll", handler, { passive: true });
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      el.removeEventListener("scroll", handler);
    };
  }, []);

  // Scroll when active changes
  useEffect(() => {
    scrollToIndex(active);
    setProgress(0);
  }, [active]);

  // Autoplay + progress
  useEffect(() => {
    if (paused || count <= 1) return;

    let start = performance.now();
    let stopped = false;

    const tick = (now: number) => {
      if (stopped) return;
      const elapsed = now - start;
      const p = Math.min(1, elapsed / intervalMs);
      setProgress(p);

      if (p >= 1) {
        start = performance.now();
        setActive((a) => (a + 1) % count);
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      stopped = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [paused, count, intervalMs]);

  const dots = useMemo(() => Array.from({ length: count }), [count]);

  if (!items.length) return null;

  const handlePause = () => setPaused(true);
  const handleResume = () => setPaused(false);

  return (
    <section
      onMouseEnter={handlePause}
      onMouseLeave={handleResume}
      onTouchStart={handlePause}
      onTouchEnd={handleResume}
      className="relative"
    >
      <div
        ref={scrollerRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2
                   [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((a, idx) => {
          const meta = [formatDate(a.publishedAt), estimateReadTime(a.excerpt || a.title)]
            .filter(Boolean)
            .join(" · ");

          return (
            <Link
              key={a.id}
              href={`/news/${a.slug}`}
              className="snap-center min-w-[88%] sm:min-w-[78%] lg:min-w-[56%]
                         overflow-hidden rounded-[2rem] border border-zinc-800 bg-zinc-900/20
                         shadow-[0_30px_90px_rgba(0,0,0,0.55)]"
            >
              <div className="relative aspect-[16/10] bg-zinc-900">
                {a.coverUrl ? (
                  <img
                    src={a.coverUrl}
                    alt={a.title}
                    className="absolute inset-0 h-full w-full object-cover opacity-95"
                    loading={idx === 0 ? "eager" : "lazy"}
                  />
                ) : (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900" />
                    <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/6 blur-3xl" />
                    <div className="absolute -bottom-28 -right-28 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(255,255,255,0.12),transparent_55%)]" />
                  </>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/85 via-zinc-950/10 to-transparent" />

                {/* 2026: soft glass top label */}
                <div className="absolute left-4 top-4 flex items-center gap-2">
                  {a.category ? (
                    <span className="inline-flex items-center rounded-full border border-zinc-800 bg-zinc-950/60 px-3 py-1 text-xs text-zinc-100 backdrop-blur">
                      {a.category.name}
                    </span>
                  ) : null}
                  <span className="inline-flex items-center rounded-full border border-zinc-800 bg-zinc-950/35 px-3 py-1 text-xs text-zinc-200 backdrop-blur">
                    Featured
                  </span>
                </div>

                <div className="absolute bottom-0 p-5">
                  <div className="text-xs text-zinc-300/80">{meta}</div>
                  <div className="mt-1 line-clamp-2 text-[1.35rem] font-semibold leading-snug">
                    {a.title}
                  </div>
                  <div className="mt-3 inline-flex items-center gap-2 text-sm text-zinc-200/90">
                    <span className="opacity-90">Open</span>
                    <span className="translate-x-0 transition group-hover:translate-x-1">→</span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Progress bar (2026 touch) */}
      {count > 1 ? (
        <div className="mt-3 flex items-center gap-3">
          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-zinc-800/70">
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-zinc-100"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>

          <div className="flex items-center gap-1.5">
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
        </div>
      ) : null}
    </section>
  );
}
