import type { Metadata, Viewport } from "next";
import {
  Cormorant_Garamond,
  Noto_Sans_TC,
  Noto_Serif_TC,
} from "next/font/google";

import { CardBackSprite } from "@/components/card/card-back-sprite";
import { StarField } from "@/components/common/star-field";
import { SiteHeader } from "@/components/site-header";

import "./globals.css";

// Headings: Cormorant Garamond for Latin, Noto Serif TC for Chinese; body: Noto Sans TC.
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});
const notoSerifTC = Noto_Serif_TC({
  variable: "--font-noto-serif-tc",
  weight: ["500", "700"],
  preload: false, // Chinese font files are large
});
const notoSansTC = Noto_Sans_TC({
  variable: "--font-noto-sans-tc",
  weight: ["400", "500"],
  preload: false,
});

export const metadata: Metadata = {
  title: "星語塔羅 · 線上塔羅占卜",
  description: "靜心提問、親手洗牌與抽牌，聆聽解讀師為你說說牌裡的故事。",
};

export const viewport: Viewport = {
  themeColor: "#1e0a10", // same as --abyss; meta tags cannot read CSS variables
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="zh-Hant-TW"
      className={`${cormorant.variable} ${notoSerifTC.variable} ${notoSansTC.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <CardBackSprite />
        <StarField />
        <SiteHeader />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16">
          {children}
        </main>
      </body>
    </html>
  );
}
