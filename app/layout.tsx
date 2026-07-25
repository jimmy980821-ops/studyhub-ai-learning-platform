import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const metadataBase = new URL(`${protocol}://${host}`);
  const title = "學測物理學習筆記";
  const description = "108 課綱學測物理：27 個知識節點、題庫、歷屆題、互動實驗與錯題本。";

  return {
    metadataBase,
    title,
    description,
    manifest: "/site.webmanifest",
    icons: {
      icon: [{ url: "/physics-icon.png?v=20260725", type: "image/png" }],
      shortcut: "/physics-icon.png?v=20260725",
      apple: [{ url: "/physics-icon.png?v=20260725", sizes: "1024x1024", type: "image/png" }],
    },
    appleWebApp: {
      capable: true,
      title: "物理筆記",
      statusBarStyle: "black-translucent",
    },
    openGraph: {
      title,
      description,
      type: "website",
      images: [{ url: "/og.png", width: 1536, height: 1024, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og.png"],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
