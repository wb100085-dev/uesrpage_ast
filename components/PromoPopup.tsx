"use client";

// 랜딩 진입 시 노출되는 프로모션 팝업 (인스타그램 광고 이미지).
// - 한 번 닫으면 그 세션(탭) 동안 다시 안 뜸 → sessionStorage.
// - "오늘 하루 보지 않기"를 누르면 그 날짜를 localStorage에 저장해 당일(세션 넘어서도) 재노출을 막는다.
// SSR 하이드레이션 미스매치 방지를 위해 마운트 후 effect에서만 표시 여부를 결정한다.

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { X } from "lucide-react";

const HIDE_DATE_KEY = "vpg.promo.hideDate"; // localStorage 값: "YYYY-MM-DD" (이 날짜엔 다시 안 띄움)
const SESSION_KEY = "vpg.promo.dismissed";  // sessionStorage 값: 닫으면 그 세션 동안 안 띄움
const PROMO_HREF = "/login"; // "지금 무료로 시작" 동선

function todayStr() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export default function PromoPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;        // 이번 세션에서 이미 닫음
      if (localStorage.getItem(HIDE_DATE_KEY) === todayStr()) return; // 오늘은 보지 않기 설정됨
    } catch {
      /* 스토리지 접근 불가 시 그냥 노출 */
    }
    setOpen(true);
  }, []);

  if (!open) return null;

  // 닫기(X·닫기·오버레이·이미지 클릭) → 그 세션 동안 재노출 차단
  const close = () => {
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* 저장 실패해도 닫기는 진행 */
    }
    setOpen(false);
  };

  // 오늘 하루 보지 않기 → 날짜를 저장(세션을 넘어 당일 내내 차단)
  const hideToday = () => {
    try {
      localStorage.setItem(HIDE_DATE_KEY, todayStr());
    } catch {
      /* 저장 실패해도 닫기는 진행 */
    }
    close();
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-up"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label="프로모션 안내"
    >
      <div
        className="relative w-full max-w-[400px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 (이미지 우상단 위로 띄움) */}
        <button
          type="button"
          onClick={close}
          aria-label="팝업 닫기"
          className="absolute -top-3 -right-3 z-10 inline-flex items-center justify-center w-9 h-9 rounded-full bg-white text-slate-700 shadow-lg ring-1 ring-black/5 hover:bg-slate-100 transition"
        >
          <X size={18} />
        </button>

        <div className="rounded-2xl overflow-hidden bg-white shadow-2xl">
          {/* 광고 이미지 — 클릭 시 시작 동선으로 이동 */}
          <Link href={PROMO_HREF} onClick={close} className="block">
            <Image
              src="/promo/socialtwin-ad.png"
              alt="SocialTwin — AI가 설문을 설계하고 가상인구가 답하는 AI 고객조사. 후기 작성 시 99,000원 상당 상세보고서 무료 제공 (~8.31)"
              width={2160}
              height={2700}
              priority
              unoptimized
              className="w-full h-auto max-h-[74vh] object-contain"
            />
          </Link>

          {/* 하단 바 */}
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5 text-sm">
            <button
              type="button"
              onClick={hideToday}
              className="text-slate-400 hover:text-slate-600 transition"
            >
              오늘 하루 보지 않기
            </button>
            <button
              type="button"
              onClick={close}
              className="font-semibold text-slate-600 hover:text-slate-900 transition"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
