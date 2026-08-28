"use client";

/**
 * 문항별 결과 카드 (막대 그래프 + 주관식 요약 + 응답 근거).
 *
 * 조사 결과를 보여주는 두 화면이 함께 쓴다:
 *   - app/results/[id]/page.tsx  (결제 후 결과 페이지)
 *   - app/design/page.tsx        (조사 실행 직후 결과 단계)
 * 표시를 바꿀 땐 이 파일만 고치면 양쪽에 반영된다.
 */
import { MessageCircle } from "lucide-react";
import type { SurveyResult } from "@/lib/survey-api";

const COLORS = [
  "from-indigo-500 to-indigo-400",
  "from-violet-500 to-violet-400",
  "from-sky-500 to-sky-400",
  "from-emerald-500 to-emerald-400",
  "from-amber-500 to-amber-400",
];

function Bar({ label, pct, maxPct, gradient }: { label: string; pct: number; maxPct: number; gradient?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-32 text-xs text-slate-500 truncate">{label}</div>
      <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-2.5 rounded-full bg-gradient-to-r ${gradient ?? "from-indigo-500 to-violet-500"}`}
          style={{ width: `${maxPct > 0 ? (pct / maxPct) * 100 : 0}%` }}
        />
      </div>
      <div className="w-10 text-xs font-semibold text-slate-600 text-right tabular-nums">{pct}%</div>
    </div>
  );
}

export default function QuestionResultCard({ result }: { result: SurveyResult }) {
  const isOpen = result.유형.includes("주관");
  const maxPct = Math.max(...result.분포.map((d) => d["비율(%)"]), 1);
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="text-xs text-indigo-500 font-semibold">Q{result.문항번호}. {result.제목}</div>
        {isOpen && (
          <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold text-violet-600 bg-violet-50 border border-violet-100 rounded-full px-2 py-0.5">
            <MessageCircle size={10} /> 주관식
          </span>
        )}
      </div>
      <div className="text-sm text-slate-700 mb-4">{result.질문}</div>

      {isOpen ? (
        result.분포.length > 0 ? (
          /* 주관식 — 대표 응답·키워드를 카드 크기에 맞게 리스트로 표시 */
          <div className="space-y-2">
            {result.분포.slice(0, 5).map((d, i) => (
              <div key={i} className="flex items-start gap-2.5 rounded-xl bg-slate-50 border border-slate-100 px-3.5 py-2.5">
                <span className="shrink-0 w-5 h-5 rounded-full bg-white border border-slate-200 text-[10px] font-bold text-slate-400 flex items-center justify-center mt-0.5">{i + 1}</span>
                <p className="flex-1 min-w-0 text-sm text-slate-700 leading-relaxed">{d.선택지}</p>
                {d["비율(%)"] > 0 && (
                  <span className="shrink-0 text-[11px] font-semibold text-slate-400 tabular-nums mt-0.5">{d["비율(%)"]}%</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* 주관식인데 집계 분포가 없을 때 — 빈 카드 대신 안내로 채움 */
          <div className="rounded-xl bg-slate-50 border border-dashed border-slate-200 px-4 py-7 text-center">
            <MessageCircle size={22} className="mx-auto mb-2.5 text-slate-300" />
            <p className="text-xs text-slate-500 leading-relaxed">
              자유 서술형 응답이라 선택지 분포로 집계되지 않습니다.<br />
              원문과 요약은 <span className="font-semibold text-slate-600">상세보고서(PDF)</span>와
              우측 <span className="font-semibold text-slate-600">‘가상인구 패널에게 질문’</span>에서 확인하세요.
            </p>
          </div>
        )
      ) : (
        <>
          <div className="space-y-2.5">
            {result.분포.slice(0, 6).map((d, i) => (
              <Bar
                key={d.선택지}
                label={d.선택지}
                pct={d["비율(%)"]}
                maxPct={maxPct}
                gradient={COLORS[i % COLORS.length]}
              />
            ))}
          </div>
          {result.평균점수 && (
            <div className="mt-3 text-xs text-slate-400">
              평균 점수: <span className="font-semibold text-slate-600">{result.평균점수.toFixed(2)}</span>
            </div>
          )}
          {(result.객관식근거샘플?.length ?? 0) > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-100">
              <p className="text-[11px] font-semibold text-slate-400 mb-2">💬 응답 근거 — 가상 응답자가 보기를 고른 이유</p>
              <div className="space-y-1.5">
                {result.객관식근거샘플!.slice(0, 3).map((r, i) => (
                  <div key={i} className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
                    <p className="text-xs text-slate-600 leading-relaxed">“{r.근거}”</p>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      {r.응답자 ? `${r.응답자} · ` : ""}선택: <span className="font-medium text-slate-500">{r.선택}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
