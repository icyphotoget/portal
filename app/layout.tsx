// app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://your-domain.com"), // CHANGE IN PROD

  title: {
    default: "Crypto Portal",
    template: "%s | Crypto Portal",
  },

  description:
    "Latest crypto news, market insights, Bitcoin, Ethereum, and blockchain trends.",

  keywords: [
    "crypto",
    "bitcoin",
    "ethereum",
    "blockchain",
    "web3",
    "altcoins",
    "crypto news",
  ],

  authors: [{ name: "Crypto Portal" }],
  creator: "Crypto Portal",
  publisher: "Crypto Portal",

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },

  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://your-domain.com",
    siteName: "Crypto Portal",
    title: "Crypto Portal",
    description:
      "Latest crypto news, market insights, Bitcoin, Ethereum, and blockchain trends.",
    images: [
      {
        url: "/og-home.jpg", // put this in /public
        width: 1200,
        height: 630,
        alt: "Crypto Portal – Crypto News & Insights",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Crypto Portal",
    description:
      "Latest crypto news, market insights, Bitcoin, Ethereum, and blockchain trends.",
    images: ["/og-home.jpg"],
    creator: "@yourtwitter", // optional
  },

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

// ✅ themeColor belongs in viewport (App Router)
export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
