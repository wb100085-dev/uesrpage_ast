import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import SessionGuard from "@/components/SessionGuard";

const GA_ID = "G-RXEWRM02JQ";

export const metadata: Metadata = {
  title: "Socialtwin — AI 시장조사 플랫폼",
  description: "한 문장으로 시작하는 AI 기반 시장조사. 가상인구 분석으로 5분 안에 결과를 확인하세요.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full scroll-smooth">
      <body className="min-h-full flex flex-col">
        <SessionGuard />
        {children}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga4-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `}
        </Script>
      </body>
    </html>
  );
}
