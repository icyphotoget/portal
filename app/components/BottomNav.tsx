import Link from "next/link";

export default function BottomNav() {
  return (
    <>
      <nav className="fixed bottom-4 left-1/2 z-50 w-[92%] -translate-x-1/2 lg:hidden">
        <div className="rounded-[1.6rem] border border-zinc-800 bg-zinc-950/80 backdrop-blur px-4 py-3 flex items-center justify-around shadow-[0_30px_90px_rgba(0,0,0,0.55)]">
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

      {/* Spacer da nav ne prekriva content */}
      <div className="h-24 lg:hidden" />
    </>
  );
}
