import type { Metadata } from "next";
import VocabularyApp from "./VocabularyApp";
import "./vocabulary.css";

export const metadata: Metadata = {
  title: "高中核心字彙 A–Z｜StudyHub",
  description: "大考中心高中英文參考詞彙 Level 1–6，共 6,012 個詞條，可依字母、級別與詞性搜尋篩選。",
  openGraph: {
    title: "高中核心字彙 A–Z｜StudyHub",
    description: "6,012 個官方詞條，Level 1–6 一次查清楚。",
    type: "website",
    images: [{ url: "/vocabulary-og.png", width: 1536, height: 1024, alt: "高中核心字彙 A–Z" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "高中核心字彙 A–Z｜StudyHub",
    description: "6,012 個官方詞條，Level 1–6 一次查清楚。",
    images: ["/vocabulary-og.png"],
  },
};

export default function VocabularyPage() {
  return <VocabularyApp />;
}
