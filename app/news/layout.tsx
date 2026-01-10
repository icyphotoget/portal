import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "News",
  description: "Latest crypto news and market updates.",
  openGraph: {
    title: "News",
    description: "Latest crypto news and market updates.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "News",
    description: "Latest crypto news and market updates.",
  },
};

export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
