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
  const isAutoScrollingRef = useRef(false);
  const scrollThrottleRef = useRef<number | null>(null);

  const timeoutRef = useRef<number | null>(null);
  const remainingRef = useRef<number>(intervalMs);
  const startedAtRef = useRef<number>(Date.now());

  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const count = items.length;
  const dots = useMemo(() => Array.from({ length: count }), [count]);

  const clearTimer = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const startTimer = (ms: number) => {
    clearTimer();
    startedAtRef.current = Date.now();
    remainingRef.current = ms;

    timeoutRef.current = window.setTimeout(() => {
      setActive((a) => (a + 1) % Math.max(1, count));
    }, ms);
  };

  const scrollToIndex = (idx: number) => {
    const el = scrollerRef.current;
    if (!el) return;

    const child = el.children.item(idx) as HTMLElement | null;
    if (!child) return;

    isAutoScrollingRef.current = true;
    el.scrollTo({ left: child.offsetLeft, behavior: "smooth" });

    window.setTimeout(() => {
      isAutoScrollingRef.current = false;
    }, 650);
  };

  useEffect(() => {
    if (count <= 1) return;
    if (paused) return;

    startTimer(intervalMs);
    return () => clearTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, count, intervalMs]);

  useEffect(() => {
    scrollToIndex(active);

    if (count <= 1) return;
    if (paused) return;

    startTimer(intervalMs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const pause = () => {
    if (paused) return;
    setPaused(true);

    const elapsed = Date.now() - startedAtRef.current;
    const remain = Math.max(0, remainingRef.current - elapsed);
    remainingRef.current = remain;
    clearTimer();
  };

  const resume = () => {
    if (!paused) return;
    setPaused(false);

    if (count > 1) startTimer(Math.max(250, remainingRef.current));
  };

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const computeActive = () => {
      const children = Array.from(el.children) as HTMLElement[];
      if (!children.length) return;

      const left = el.scrollLeft;
      let bestIdx = 0;
      let bestDist = Infinity;

      for (let i = 0; i < children.length; i++) {
        const dist = Math.abs(children[i].offsetLeft - left);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = i;
        }
      }

      setActive(bestIdx);
    };

    const onScroll = () => {
      if (isAutoScrollingRef.current) return;

      if (scrollThrottleRef.current) return;
      scrollThrottleRef.current = window.setTimeout(() => {
        scrollThrottleRef.current = null;
        computeActive();
      }, 120);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (scrollThrottleRef.current) window.clearTimeout(scrollThrottleRef.current);
    };
  }, []);

  if (!items.length) return null;

  return (
    <section
      className="relative"
      onPointerDown={pause}
      onPointerUp={resume}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onTouchStart={pause}
      onTouchEnd={resume}
    >
      <div
        ref={scrollerRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2
                   [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ scrollSnapStop: "always" as any }}
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
                         overflow-hidden rounded-[2rem] border border-zinc-800 bg-zinc-900/20"
            >
              <div className="relative aspect-[16/10] bg-zinc-900">
                {a.coverUrl ? (
                  <img
                    src={a.coverUrl}
                    alt={a.title}
                    className="absolute inset-0 h-full w-full object-cover opacity-95"
                    loading={idx === 0 ? "eager" : "lazy"}
                    decoding="async"
                  />
                ) : (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900" />
                    <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/6 blur-3xl" />
                    <div className="absolute -bottom-28 -right-28 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
                  </>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/85 via-zinc-950/10 to-transparent" />

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
                    <span>→</span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {count > 1 ? (
        <div className="mt-3 flex items-center gap-3">
          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-zinc-800/70">
            <div
              key={`${active}-${paused ? "p" : "r"}`}
              className={[
                "absolute left-0 top-0 h-full rounded-full bg-zinc-100 origin-left",
                paused ? "" : "animate-[fpProgress_var(--fpDur)_linear_forwards]",
              ].join(" ")}
              style={
                {
                  "--fpDur": `${intervalMs}ms`,
                  transform: "scaleX(0)",
                } as React.CSSProperties
              }
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

          {/* keyframes via <style> in markup is OK, but let's keep it minimal */}
          <style>{`
            @keyframes fpProgress {
              from { transform: scaleX(0); }
              to { transform: scaleX(1); }
            }
          `}</style>
        </div>
      ) : null}
    </section>
  );
}
