"use client";

import { useMemo } from "react";
import { Check } from "lucide-react";
import type { ReviewSurvey, ReviewQuestion } from "@/lib/review-survey";

export const OTHER = "기타";

/* ── 응답 → 저장 payload 변환 ── */
export function buildAnswers(
  survey: ReviewSurvey,
  single: Record<string, string>,
  multi: Record<string, string[]>,
  text: Record<string, string>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const q of survey.questions) {
    if (q.type === "text") {
      out[q.id] = text[q.id] || "";
    } else if (q.type === "multi") {
      const arr = (multi[q.id] || []).map((o) =>
        o === OTHER ? `기타: ${text[`${q.id}_other`] || ""}` : o,
      );
      out[q.id] = arr;
    } else {
      const v = single[q.id] || "";
      out[q.id] = v === OTHER ? `기타: ${text[`${q.id}_other`] || ""}` : v;
      if (q.reasonWhenIndex && q.options) {
        const idx = q.options.indexOf(v);
        if (q.reasonWhenIndex.includes(idx)) out[`${q.id}_reason`] = text[`${q.id}_reason`] || "";
      }
    }
    // 가독성을 위해 문항 라벨도 함께 저장
    out[`${q.id}_label`] = q.label;
  }
  return out;
}

/* ── 검증: 필수 문항 미응답 시 안내 메시지(없으면 null) ── */
export function validate(
  survey: ReviewSurvey,
  single: Record<string, string>,
  multi: Record<string, string[]>,
  text: Record<string, string>,
): string | null {
  for (const q of survey.questions) {
    if (q.optional) continue;
    if (q.type === "text") {
      if (!(text[q.id] || "").trim()) return `“${q.label}” 문항에 응답해 주세요.`;
    } else if (q.type === "multi") {
      const arr = multi[q.id] || [];
      if (arr.length === 0) return `“${q.label}” 문항을 하나 이상 선택해 주세요.`;
      if (arr.includes(OTHER) && !(text[`${q.id}_other`] || "").trim()) return `“${q.label}”의 기타 내용을 입력해 주세요.`;
    } else {
      const v = single[q.id] || "";
      if (!v) return `“${q.label}” 문항에 응답해 주세요.`;
      if (v === OTHER && !(text[`${q.id}_other`] || "").trim()) return `“${q.label}”의 기타 내용을 입력해 주세요.`;
    }
  }
  return null;
}

/* ── 설문 폼 (체험후기 다이얼로그·공개 링크 공용) ── */
export function SurveyForm({
  survey, single, setSingle, multi, setMulti, text, setText,
}: {
  survey: ReviewSurvey;
  single: Record<string, string>;
  setSingle: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  multi: Record<string, string[]>;
  setMulti: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  text: Record<string, string>;
  setText: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) {
  const numbered = useMemo(() => survey.questions.map((q, i) => ({ q, n: i + 1 })), [survey]);

  return (
    <div className="flex flex-col gap-5">
      {numbered.map(({ q, n }) => (
        <div key={q.id}>
          {q.section && (
            <div className="text-[11px] font-bold text-indigo-600 bg-indigo-50 rounded-md px-2.5 py-1.5 mb-2.5">{q.section}</div>
          )}
          <p className="text-sm font-semibold text-slate-800 mb-2 leading-snug">
            <span className="text-indigo-500">Q{n}.</span> {q.label}
            {!q.optional && <span className="text-rose-400 ml-1">*</span>}
            {q.optional && <span className="text-slate-300 text-xs font-normal ml-1">(선택)</span>}
            {q.type === "multi" && <span className="text-indigo-500 text-xs font-semibold ml-1">(복수 선택 가능)</span>}
          </p>
          <QuestionField q={q} single={single} setSingle={setSingle} multi={multi} setMulti={setMulti} text={text} setText={setText} />
        </div>
      ))}
    </div>
  );
}

function QuestionField({
  q, single, setSingle, multi, setMulti, text, setText,
}: {
  q: ReviewQuestion;
  single: Record<string, string>;
  setSingle: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  multi: Record<string, string[]>;
  setMulti: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  text: Record<string, string>;
  setText: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) {
  const setT = (key: string, v: string) => setText((p) => ({ ...p, [key]: v }));

  if (q.type === "text") {
    return (
      <textarea
        value={text[q.id] || ""}
        onChange={(e) => setT(q.id, e.target.value)}
        rows={3}
        placeholder="자유롭게 입력해 주세요"
        className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-300 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all resize-none"
      />
    );
  }

  const isScale = q.type === "scale";
  const opts = q.options || [];

  if (q.type === "multi") {
    const sel = multi[q.id] || [];
    const toggle = (o: string) => setMulti((p) => {
      const cur = p[q.id] || [];
      return { ...p, [q.id]: cur.includes(o) ? cur.filter((x) => x !== o) : [...cur, o] };
    });
    return (
      <div className="flex flex-col gap-1.5">
        {opts.map((o, i) => {
          const checked = sel.includes(o);
          const isOther = q.otherOption && i === opts.length - 1;
          return (
            <div key={o}>
              <button type="button" onClick={() => toggle(o)} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left text-sm transition-all ${checked ? "border-indigo-400 bg-indigo-50 text-indigo-800" : "border-slate-200 hover:border-slate-300 text-slate-700"}`}>
                <span className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${checked ? "bg-indigo-600" : "border border-slate-300"}`}>{checked && <Check size={11} className="text-white" strokeWidth={3} />}</span>
                {o}
              </button>
              {isOther && checked && (
                <input value={text[`${q.id}_other`] || ""} onChange={(e) => setT(`${q.id}_other`, e.target.value)} placeholder="기타 내용을 입력해 주세요" className="mt-1.5 w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm outline-none focus:bg-white focus:border-indigo-400" />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // single / scale
  const v = single[q.id] || "";
  const pick = (o: string) => setSingle((p) => ({ ...p, [q.id]: o }));
  return (
    <div className={isScale ? "flex flex-col gap-1.5" : "flex flex-col gap-1.5"}>
      {opts.map((o, i) => {
        const active = v === o;
        const isOther = q.otherOption && i === opts.length - 1;
        const showReason = q.reasonWhenIndex?.includes(i) && active;
        return (
          <div key={o}>
            <button type="button" onClick={() => pick(o)} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left text-sm transition-all ${active ? "border-indigo-400 bg-indigo-50 text-indigo-800" : "border-slate-200 hover:border-slate-300 text-slate-700"}`}>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${active ? "bg-indigo-600" : "border border-slate-300"}`}>{active && <span className="w-1.5 h-1.5 rounded-full bg-white" />}</span>
              {isScale && <span className="text-[10px] font-bold text-slate-400 w-4">{i + 1}</span>}
              {o}
            </button>
            {isOther && active && (
              <input value={text[`${q.id}_other`] || ""} onChange={(e) => setT(`${q.id}_other`, e.target.value)} placeholder="기타 내용을 입력해 주세요" className="mt-1.5 w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm outline-none focus:bg-white focus:border-indigo-400" />
            )}
            {showReason && (
              <input value={text[`${q.id}_reason`] || ""} onChange={(e) => setT(`${q.id}_reason`, e.target.value)} placeholder={q.reasonLabel || "이유를 입력해 주세요"} className="mt-1.5 w-full px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-sm outline-none focus:bg-white focus:border-amber-400" />
            )}
          </div>
        );
      })}
    </div>
  );
}
