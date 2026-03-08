import type { Metadata, Viewport } from "next";
import "./globals.css";

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
    siteName: "osu! Atlas",
    title: "osu! Atlas",
    type: "website"
  },
  title: "osu! Atlas"
};

export const viewport: Viewport = {
  themeColor: "#ff66aa"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
