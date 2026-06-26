import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import SessionGuard from "@/components/SessionGuard";

const GA_ID = "G-RXEWRM02JQ";
const FB_PIXEL_ID = "1041566044877220";

const SITE_URL = "https://www.socialtwin.site";
const SITE_TITLE = "Socialtwin — AI 시장조사 플랫폼";
const SITE_DESCRIPTION =
  "한 문장으로 시작하는 AI 기반 시장조사. 가상인구 분석으로 1시간 안에 결과를 확인하세요.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  verification: { google: "EZQdvFqA8pv9_RzF25F8mEubABDm5nPj2kvcp-y-xzo" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Socialtwin",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    locale: "ko_KR",
    images: [
      {
        url: "/Socialtwin_o2.png",
        width: 1146,
        height: 318,
        alt: "Socialtwin — AI 시장조사 플랫폼",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/Socialtwin_o2.png"],
  },
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

        {/* Meta Pixel */}
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${FB_PIXEL_ID}');
            fbq('track', 'PageView');
          `}
        </Script>
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src={`https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>
      </body>
    </html>
  );
}
