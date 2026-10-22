import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import SessionGuard from "@/components/SessionGuard";
import LangBoot from "@/components/LangBoot";

const GA_ID = "G-RXEWRM02JQ";
const FB_PIXEL_ID = "1041566044877220";

const SITE_URL = "https://www.socialtwin.site";
const SITE_TITLE = "소셜트윈(Socialtwin) — AI 시장조사 플랫폼";
// 네이버는 한글 "소셜트윈"과 영문 "Socialtwin"을 같은 단어로 보지 않는다.
// 브랜드 검색·검색광고 연관지수를 위해 title·description 에 한글 표기를 반드시 함께 둘 것.
const SITE_DESCRIPTION =
  "소셜트윈(Socialtwin)은 국가통계 기반 AI 가상인구로 설문을 설계·응답하는 AI 시장조사 플랫폼입니다. 한 문장 입력으로 1시간 안에 결과를 확인하세요.";

// 구조화 데이터 — 소셜트윈 = Socialtwin 이 같은 서비스임을 검색엔진에 명시
const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "소셜트윈",
      alternateName: ["Socialtwin", "SocialTwin", "소셜 트윈"],
      inLanguage: "ko-KR",
      publisher: { "@id": "https://www.omninode.kr/#organization" },
    },
    {
      "@type": "SoftwareApplication",
      name: "소셜트윈",
      alternateName: ["Socialtwin", "SocialTwin"],
      url: SITE_URL,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description: SITE_DESCRIPTION,
      publisher: { "@id": "https://www.omninode.kr/#organization" },
    },
    {
      "@type": "Organization",
      "@id": "https://www.omninode.kr/#organization",
      name: "주식회사 옴니노드",
      alternateName: ["옴니노드", "Omninode"],
      url: "https://www.omninode.kr",
    },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  verification: {
    google: "EZQdvFqA8pv9_RzF25F8mEubABDm5nPj2kvcp-y-xzo",
    other: { "naver-site-verification": "ebb9df63a0a111f7d3f2ba95fb253b2e8e4f76d6" },
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "소셜트윈 Socialtwin",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    locale: "ko_KR",
    // 카카오톡·슬랙 등은 미리보기 박스(약 2:1)에 맞춰 이미지를 "cover"로 잘라낸다.
    // 로고 원본(1146x318, 3.6:1)을 그대로 쓰면 좌우가 잘리고 투명 배경이 다크모드에서
    // 검게 깔려 태그라인이 사라진다. 1200x630(1.91:1) 불투명 카드로 고정할 것.
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        type: "image/png",
        alt: "소셜트윈(Socialtwin) — AI 시장조사 플랫폼",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full scroll-smooth" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
        {/* 한/영 전환(lib/i18n.ts) — 페이지 코드보다 먼저 돌아야 영어 사용자에게 한국어가 비치지 않는다.
            ?lang=en|ko 쿼리를 저장하고, 영어면 hydration 이 끝날 때까지 본문을 가린다
            (LangBoot 가 벗김. JS 가 멈춰도 1.5초 뒤엔 무조건 벗긴다). */}
        <Script id="lang-boot" strategy="beforeInteractive">
          {`
            try {
              var _l = new URLSearchParams(location.search).get('lang');
              if (_l === 'en' || _l === 'ko') localStorage.setItem('vpg.lang', _l);
              if (localStorage.getItem('vpg.lang') === 'en') {
                var _d = document.documentElement;
                _d.lang = 'en';
                _d.classList.add('i18n-pending');
                setTimeout(function () { _d.classList.remove('i18n-pending'); }, 1500);
              }
            } catch (e) {}
          `}
        </Script>
        <LangBoot />
        <SessionGuard />
        {children}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        {/* gtag 큐는 페이지 코드보다 먼저 준비돼야 한다(beforeInteractive). afterInteractive 면
            마운트 즉시 보내는 이벤트(/email-verified 의 회원가입 등)가 gtag 없음으로 버려진다. */}
        <Script id="ga4-init" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('js', new Date());
            // 내부자(직원) 트래픽 표시 — /?internal=1 로 1회 접속하면 이 브라우저의
            // 모든 방문이 traffic_type=internal 로 전송되어 GA4 통계에서 제외된다.
            // /?internal=0 으로 해제. (GA4 데이터 필터 'Internal Traffic'과 연동)
            try {
              var _q = new URLSearchParams(location.search).get('internal');
              if (_q === '1') localStorage.setItem('st_internal', '1');
              if (_q === '0') localStorage.removeItem('st_internal');
              if (localStorage.getItem('st_internal') === '1') {
                gtag('set', { 'traffic_type': 'internal' });
              }
            } catch (e) {}
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
