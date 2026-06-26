"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import ContactDialog from "@/components/ContactDialog";

export default function SiteFooter() {
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
              <Link href="/terms" className="hover:text-slate-800 transition-colors">이용약관</Link>
              <Link href="/privacy" className="hover:text-slate-800 transition-colors">개인정보처리방침</Link>
              <Link href="/refund" className="hover:text-slate-800 transition-colors">결제·환불정책</Link>
              <button
                type="button"
                onClick={() => setContactOpen(true)}
                className="hover:text-slate-800 transition-colors text-left"
              >
                문의하기
              </button>
            </div>
          </div>

          {/* 중단 — 사업자 정보 · 고객지원 */}
          <div className="grid md:grid-cols-2 gap-8 py-8 text-sm">
            {/* 사업자 정보 — 전자상거래법 제13조 표시 사항 */}
            <div>
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">사업자 정보</div>
              <dl className="space-y-1.5 text-slate-500 leading-relaxed">
                <div className="flex gap-2">
                  <dt className="text-slate-400 flex-shrink-0 w-32">상호</dt>
                  <dd>주식회사 옴니노드 (Omninode Co., Ltd.)</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-slate-400 flex-shrink-0 w-32">대표자</dt>
                  <dd>황영순</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-slate-400 flex-shrink-0 w-32">사업자등록번호</dt>
                  <dd>366-86-04216</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-slate-400 flex-shrink-0 w-32">통신판매업 신고번호</dt>
                  <dd>제2026-대구북구-0639호</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-slate-400 flex-shrink-0 w-32">사업장 소재지</dt>
                  <dd className="break-keep">
                    대구광역시 북구 호암로 51, 4층 AX창업오피스 (본사)<br />
                    대구광역시 남구 명덕로 104 동서문화관 410호 (연구소)
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-slate-400 flex-shrink-0 w-32">결제대행사</dt>
                  <dd>㈜토스페이먼츠</dd>
                </div>
              </dl>
              {/* KB에스크로 이체 인증마크 */}
              <button
                type="button"
                onClick={openKBAuthMark}
                className="mt-4 inline-block transition-opacity hover:opacity-80"
                aria-label="KB에스크로 이체 인증마크 확인"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://img1.kbstar.com/img/escrow/escrowcmark.gif"
                  alt="KB에스크로 이체 인증마크"
                  width={107}
                  height={32}
                  className="h-8 w-auto"
                />
              </button>
            </div>

            {/* 고객지원 · 개인정보 보호책임자 */}
            <div>
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">고객지원</div>
              <dl className="space-y-1.5 text-slate-500 leading-relaxed">
                <div className="flex gap-2">
                  <dt className="text-slate-400 flex-shrink-0 w-20">고객문의</dt>
                  <dd>
                    <a href="mailto:hys@omninode.kr" className="hover:text-slate-800 transition-colors">
                      hys@omninode.kr
                    </a>
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-slate-400 flex-shrink-0 w-20">고객센터</dt>
                  <dd>
                    <a href="tel:+821099690406" className="hover:text-slate-800 transition-colors">
                      010-9969-0406
                    </a>
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-slate-400 flex-shrink-0 w-20">운영시간</dt>
                  <dd>평일 10:00 – 17:00 (점심 12:00 – 13:30, 주말·공휴일 휴무)</dd>
                </div>
                <div className="pt-2 mt-2 border-t border-slate-200/70">
                  <div className="text-[11px] font-semibold text-slate-600 mb-1">개인정보 보호책임자</div>
                  <div className="text-slate-500">
                    천왕봉 (연구소장) ·{" "}
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
                    문의 메일 보내기 →
                  </button>
                </div>
              </dl>
            </div>

          </div>

          {/* 하단 — 카피라이트 · 분쟁조정 안내 */}
          <div className="pt-6 border-t border-slate-200 flex flex-col gap-3 text-xs text-slate-400">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>© 2026 Omninode Co., Ltd. All rights reserved.</div>
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
                  한국소비자원 1372
                </a>
                <a
                  href="https://www.ecmc.or.kr"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-slate-700 transition-colors"
                >
                  전자거래분쟁조정위원회
                </a>
              </div>
            </div>
            <p className="leading-relaxed text-slate-400">
              SocialTwin은 생성형 AI·통계 시뮬레이션으로 생성된 <strong className="text-slate-500">가상의 응답 데이터</strong>를 제공하는 참고용 서비스이며,
              실제 인물·집단의 의견을 직접 대표하지 않습니다.
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
