"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import ContactDialog from "@/components/ContactDialog";

export default function StartCtaButtons() {
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <>
      {/* 조사 시작하기 안내 */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm leading-relaxed text-slate-500">
        <p>
          <span className="font-semibold text-slate-700">조사 시작하기</span>를 클릭하시면, 로그인 후{" "}
          <span className="font-semibold text-slate-700">‘새 분석 시작하기’</span>로 이동합니다.
        </p>
        <p className="mt-2">
          간단한 아이템 정보 입력만으로{" "}
          <span className="font-semibold text-slate-700">가상인구 10명</span>의 응답을 무료로 받아보실 수 있습니다.
        </p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-slate-400">
            더 큰 규모의 조사는{" "}
            <a href="/pricing" target="_blank" rel="noopener noreferrer" className="font-medium text-indigo-600 underline underline-offset-2">
              요금 안내
            </a>
            를 확인해 주세요.
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
