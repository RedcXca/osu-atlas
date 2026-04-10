import type { Metadata, Viewport } from "next";
import { DM_Sans, Plus_Jakarta_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"]
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
  weight: ["600", "700", "800"]
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
    <html lang="en" className={`${dmSans.variable} ${plusJakarta.variable}`} suppressHydrationWarning>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
