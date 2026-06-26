"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import ContactDialog from "@/components/ContactDialog";

export default function StartCtaButtons() {
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <>
      {/* 무료 체험하기 안내 */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm leading-relaxed text-slate-500">
        <p>
          <span className="font-semibold text-slate-700">무료 체험하기</span>를 클릭하시면, 로그인 후{" "}
          <span className="font-semibold text-slate-700">‘새 분석 시작하기’</span>로 이동합니다.
        </p>
        <p className="mt-2">
          간단한 아이템 정보 입력을 통해 가상패널(50명)의 응답을 받아볼 수 있으며,{" "}
          <span className="font-semibold text-slate-700">요약보고서(10p 내외 PDF)</span>를 무료로 바로 다운로드 받을 수 있습니다.
        </p>
        <p className="mt-2">
          체험 후기를 남겨주시면,{" "}
          <span className="font-semibold text-amber-700">99,000원 상당의 상세보고서(30p 내외 PDF)와 원본자료(엑셀)</span>를{" "}
          무료로 제공(아이디 당 1회)해 드리는 이벤트 중입니다.
        </p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-slate-400">
            50명 이상 응답이 필요한 경우는 별도 문의 부탁드립니다.
          </p>
          <button
            type="button"
            onClick={() => setContactOpen(true)}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-all hover:border-slate-400 hover:bg-slate-50"
          >
            <Mail size={14} /> 문의 메일 보내기
          </button>
        </div>
      </div>

      <ContactDialog open={contactOpen} onClose={() => setContactOpen(false)} />
    </>
  );
}
