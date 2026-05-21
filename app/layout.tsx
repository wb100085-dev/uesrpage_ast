import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Socialtwin — AI 시장조사 플랫폼",
  description: "한 문장으로 시작하는 AI 기반 시장조사. 가상인구 분석으로 5분 안에 결과를 확인하세요.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full scroll-smooth">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
