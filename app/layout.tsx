import type { Metadata, Viewport } from "next";
import { Inter, Share_Tech_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700"]
});

const shareTechMono = Share_Tech_Mono({
  subsets: ["latin"],
  variable: "--font-share-tech-mono",
  display: "swap",
  weight: "400"
});

export const metadata: Metadata = {
  applicationName: "osu! Atlas",
  description: "See where your osu! friends are from.",
  icons: {
    apple: "/favicon.svg?v=2",
    icon: "/favicon.svg?v=2",
    shortcut: "/favicon.svg?v=2"
  },
  openGraph: {
    description: "See where your osu! friends are from.",
    images: [{ url: "/og-preview.png", width: 1200, height: 630 }],
    siteName: "osu! Atlas",
    title: "osu! Atlas",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    description: "See where your osu! friends are from.",
    images: ["/og-preview.png"],
    title: "osu! Atlas"
  },
  title: "osu! Atlas"
};

export const viewport: Viewport = {
  themeColor: "#0a0a0c"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${shareTechMono.variable}`} suppressHydrationWarning>
      <body>
        <div id="ssr-boot" className="fx-boot" aria-hidden="true">
          <div className="fx-boot__terminal">
            <span className="fx-boot__cursor">_</span>
          </div>
        </div>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
