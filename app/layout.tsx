import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");

  return {
    metadataBase: new URL(`${protocol}://${host}`),
    title: "StudyHub｜AI 高中生學習平台",
    description: "為高中生與學測生打造的學習效率、弱點分析與知識整理平台。",
    manifest: "/site.webmanifest",
    icons: {
      icon: [
        { url: "/favicon.svg", type: "image/svg+xml" },
        { url: "/studyhub-icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/studyhub-icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      shortcut: "/favicon.svg",
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    },
    openGraph: {
      title: "StudyHub｜讓每次學習都有方向",
      description: "整合錯題、閱讀、分析、知識卡與升學探索的 AI 學習工作台。",
      type: "website",
      images: [{ url: "/studyhub-og-v2.png", width: 1536, height: 1024, alt: "StudyHub 學習工作台" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "StudyHub｜讓每次學習都有方向",
      description: "整合錯題、閱讀、分析、知識卡與升學探索的 AI 學習工作台。",
      images: ["/studyhub-og-v2.png"],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
