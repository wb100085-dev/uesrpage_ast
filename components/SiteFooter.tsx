"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import ContactDialog from "@/components/ContactDialog";
import { useT } from "@/lib/i18n";

export default function SiteFooter() {
  const t = useT();
  const [contactOpen, setContactOpen] = useState(false);

  // KB에스크로 이체 인증마크 — GET 폼을 팝업으로 제출
  const openKBAuthMark = () => {
    const params = new URLSearchParams({
      page: "C021590",
      cc: "b034066:b035526",
      mHValue: "e75fd08917197b0f7e11dd1801e907c5",
    });
    window.open(
      `https://okbfex.kbstar.com/quics?${params.toString()}`,
      "KB_AUTHMARK",
      "height=604,width=648,status=yes,toolbar=no,menubar=no,location=no"
    );
  };

  return (
    <>
      <footer className="border-t border-slate-100 bg-slate-50/60">
        <div className="max-w-6xl mx-auto px-6 py-12">
          {/* 상단 — 로고 · 정책 링크 */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 pb-8 border-b border-slate-200">
            <div className="flex items-center">
              <Image
                src="/omninode.png"
                alt="Omninode"
                width={120}
                height={36}
                className="h-9 w-auto object-contain"
              />
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
              <Link href="/terms" className="hover:text-slate-800 transition-colors">{t("이용약관", "Terms of Service")}</Link>
              <Link href="/privacy" className="hover:text-slate-800 transition-colors">{t("개인정보처리방침", "Privacy Policy")}</Link>
              <Link href="/refund" className="hover:text-slate-800 transition-colors">{t("결제·환불정책", "Refund Policy")}</Link>
              <button
                type="button"
                onClick={() => setContactOpen(true)}
                className="hover:text-slate-800 transition-colors text-left"
              >
                {t("문의하기", "Contact us")}
              </button>
            </div>
          </div>

          {/* 중단 — 사업자 정보 · 고객지원 */}
          <div className="grid md:grid-cols-2 gap-8 py-8 text-sm">
            {/* 사업자 정보 — 전자상거래법 제13조 표시 사항 */}
            <div>
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">{t("사업자 정보", "Business information")}</div>
              <dl className="space-y-1.5 text-slate-500 leading-relaxed">
                <div className="flex gap-2">
                  <dt className="text-slate-400 flex-shrink-0 w-32">{t("상호", "Company")}</dt>
                  <dd>{t("주식회사 옴니노드 (Omninode Co., Ltd.)", "Omninode Inc.")}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-slate-400 flex-shrink-0 w-32">{t("대표자", "CEO")}</dt>
                  <dd>{t("황영순", "Youngsoon Hwang")}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-slate-400 flex-shrink-0 w-32">{t("사업자등록번호", "Business reg. no.")}</dt>
                  <dd>366-86-04216</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-slate-400 flex-shrink-0 w-32">{t("통신판매업 신고번호", "Mail-order reg. no.")}</dt>
                  <dd>{t("제2026-대구북구-0639호", "2026-Daegu Buk-gu-0639")}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-slate-400 flex-shrink-0 w-32">{t("사업장 소재지", "Address")}</dt>
                  <dd className="break-keep">
                    {t(
                      <>
                        (본사) 대구광역시 북구 호암로 51, 4층 AX창업오피스<br />
                        (연구소) 대구광역시 남구 명덕로 104 동서문화관 410호
                      </>,
                      <>
                        (HQ) AX Startup Office, 4F, 51 Hoam-ro, Buk-gu, Daegu, Republic of Korea<br />
                        (R&amp;D Center) Room 410, Dongseo Cultural Center, 104 Myeongdeok-ro, Nam-gu, Daegu, Republic of Korea
                      </>,
                    )}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-slate-400 flex-shrink-0 w-32">{t("결제대행사", "Payment processor")}</dt>
                  <dd>{t("㈜토스페이먼츠", "Toss Payments Co., Ltd.")}</dd>
                </div>
              </dl>
              {/* KB에스크로 이체 인증마크 */}
              <button
                type="button"
                onClick={openKBAuthMark}
                className="mt-4 inline-block transition-opacity hover:opacity-80"
                aria-label={t("KB에스크로 이체 인증마크 확인", "View KB Escrow certification mark")}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://img1.kbstar.com/img/escrow/escrowcmark.gif"
                  alt={t("KB에스크로 이체 인증마크", "KB Escrow certification mark")}
                  width={107}
                  height={32}
                  className="h-8 w-auto"
                />
              </button>
            </div>

            {/* 고객지원 · 개인정보 보호책임자 */}
            <div>
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">{t("고객지원", "Customer support")}</div>
              <dl className="space-y-1.5 text-slate-500 leading-relaxed">
                <div className="flex gap-2">
                  <dt className="text-slate-400 flex-shrink-0 w-20">{t("고객문의", "Email")}</dt>
                  <dd>
                    <a href="mailto:hys@omninode.kr" className="hover:text-slate-800 transition-colors">
                      hys@omninode.kr
                    </a>
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-slate-400 flex-shrink-0 w-20">{t("고객센터", "Phone")}</dt>
                  <dd>
                    <a href="tel:+821099690406" className="hover:text-slate-800 transition-colors">
                      010-9969-0406
                    </a>
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-slate-400 flex-shrink-0 w-20">{t("운영시간", "Hours")}</dt>
                  <dd>
                    {t(
                      "평일 10:00 – 17:00 (점심 12:00 – 13:30, 주말·공휴일 휴무)",
                      "Weekdays 10:00 – 17:00 KST (lunch 12:00 – 13:30; closed on weekends and Korean public holidays)",
                    )}
                  </dd>
                </div>
                <div className="pt-2 mt-2 border-t border-slate-200/70">
                  <div className="text-[11px] font-semibold text-slate-600 mb-1">{t("개인정보 보호책임자", "Chief Privacy Officer")}</div>
                  <div className="text-slate-500">
                    {t("천왕봉 (연구소장)", "Wangbong Chun (Head of R&D Center)")} ·{" "}
                    <a href="mailto:cwb@omninode.kr" className="hover:text-slate-800 transition-colors">
                      cwb@omninode.kr
                    </a>
                  </div>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setContactOpen(true)}
                    className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 text-xs font-semibold transition-colors"
                  >
                    {t("문의 메일 보내기 →", "Send us an email →")}
                  </button>
                </div>
              </dl>
            </div>

          </div>

          {/* 하단 — 카피라이트 · 분쟁조정 안내 */}
          <div className="pt-6 border-t border-slate-200 flex flex-col gap-3 text-xs text-slate-400">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>{t("© 2026 Omninode Co., Ltd. All rights reserved.", "© 2026 Omninode Inc. All rights reserved.")}</div>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <a
                  href="https://omninode.kr"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-slate-700 transition-colors"
                >
                  omninode.kr
                </a>
                <a
                  href="https://www.kca.go.kr"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-slate-700 transition-colors"
                >
                  {t("한국소비자원 1372", "Korea Consumer Agency (1372)")}
                </a>
                <a
                  href="https://www.ecmc.or.kr"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-slate-700 transition-colors"
                >
                  {t("전자거래분쟁조정위원회", "E-Commerce Mediation Committee")}
                </a>
              </div>
            </div>
            <p className="leading-relaxed text-slate-400">
              {t(
                <>
                  SocialTwin은 생성형 AI·통계 시뮬레이션으로 생성된 <strong className="text-slate-500">가상의 응답 데이터</strong>를 제공하는 참고용 서비스이며,
                  실제 인물·집단의 의견을 직접 대표하지 않습니다.
                </>,
                <>
                  Socialtwin is a reference service that provides <strong className="text-slate-500">synthetic response data</strong> generated
                  through generative AI and statistical simulation. It does not directly represent the opinions of real individuals or groups.
                </>,
              )}
            </p>
          </div>
        </div>
      </footer>

      <ContactDialog
        open={contactOpen}
        onClose={() => setContactOpen(false)}
      />
    </>
  );
}
