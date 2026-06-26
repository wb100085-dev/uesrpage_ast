"use client";

import { useEffect, useMemo, useState } from "react";
import { MessageSquare, X, Gift, Download, FileText, Database, FileEdit, Check, Loader2, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft } from "lucide-react";
import {
  SURVEY_SERVICE_REVIEW,
  SURVEY_REPORT_QUALITY,
  type ReviewSurvey,
  type ReviewQuestion,
} from "@/lib/review-survey";
import {
  submitReviewResponse,
  getMyReviewStatus,
  downloadReportPdf,
  downloadRawCsv,
  downloadDesignPdf,
  startDetail,
  getDetailStatus,
} from "@/lib/survey-api";

type Props = {
  open: boolean;
  onClose: () => void;
  jobId?: string | null;
};

type Part = 1 | 2 | 3 | "done" | "already";

const OTHER = "기타";

export default function ReviewDialog({ open, onClose, jobId }: Props) {
  const [part, setPart] = useState<Part>(1);

  // 응답 상태 (파트별 분리)
  const [single1, setSingle1] = useState<Record<string, string>>({});
  const [multi1, setMulti1] = useState<Record<string, string[]>>({});
  const [text1, setText1] = useState<Record<string, string>>({});
  const [single2, setSingle2] = useState<Record<string, string>>({});
  const [multi2, setMulti2] = useState<Record<string, string[]>>({});
  const [text2, setText2] = useState<Record<string, string>>({});

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 아이디당 1회 제한 — 이미 작성했으면 설문1을 건너뛰고 다운로드(Part2)로 시작
  const [checking, setChecking] = useState(true);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  // 열릴 때마다 작성 여부 확인 (열기 직후 1회)
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setChecking(true);
    getMyReviewStatus()
      .then((s) => {
        if (cancelled) return;
        if (s.submitted && !s.exempt) {
          setAlreadySubmitted(true);
          setPart("already");
        } else {
          setAlreadySubmitted(false);
          setPart(1);
        }
      })
      .catch(() => { /* 상태 확인 실패 시 정상 진행(백엔드가 최종 강제) */ })
      .finally(() => { if (!cancelled) setChecking(false); });
    return () => { cancelled = true; };
  }, [open]);

  // 스크롤 잠금 — 설문 작성 중 실수로 닫히지 않도록 ESC·바깥 클릭으로는 닫지 않음(상단 X 버튼으로만 닫기)
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  // ── 응답 → 저장 payload 변환 ──
  function buildAnswers(
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

  // ── 검증: 필수 문항 미응답 목록 ──
  function validate(
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

  async function submitPart(
    survey: ReviewSurvey,
    single: Record<string, string>,
    multi: Record<string, string[]>,
    text: Record<string, string>,
    next: Part,
  ) {
    const v = validate(survey, single, multi, text);
    if (v) { setError(v); return; }
    setError(null);
    setSubmitting(true);
    try {
      await submitReviewResponse({
        survey_key: survey.key,
        job_id: jobId ?? null,
        answers: buildAnswers(survey, single, multi, text),
      });
      setPart(next);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "응답 저장에 실패했습니다.";
      // 아이디당 1회 제한(409) — 이미 작성한 경우: 이벤트 참여 완료 안내 화면으로
      if (survey.key === "service_review" && (msg.includes("409") || msg.includes("already_submitted") || msg.includes("이미 체험후기"))) {
        setAlreadySubmitted(true);
        setError(null);
        setPart("already");
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const headerByPart: Record<string, { sub: string; title: string; meta: string }> = {
    1: { sub: SURVEY_SERVICE_REVIEW.subtitle, title: SURVEY_SERVICE_REVIEW.title, meta: SURVEY_SERVICE_REVIEW.meta },
    2: { sub: "리워드", title: "설문 리워드", meta: "상세보고서·원본자료·설계서를 무료로 받아보세요" },
    3: { sub: SURVEY_REPORT_QUALITY.subtitle, title: SURVEY_REPORT_QUALITY.title, meta: SURVEY_REPORT_QUALITY.meta },
    already: { sub: "안내", title: "체험후기 이벤트", meta: "아이디당 1회 참여" },
    done: { sub: "완료", title: "감사합니다", meta: "소중한 의견 감사합니다 · SocialTwin" },
  };
  const h = headerByPart[String(part)];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      {/* 바깥 클릭으로는 닫지 않음 — 작성 중 실수 방지(상단 X 버튼으로만 닫기) */}
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />

      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl shadow-black/30 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400" />

        {/* 헤더 */}
        <div className="px-6 pt-5 pb-3 flex items-start justify-between border-b border-slate-100">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
              <MessageSquare size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-amber-600">{h.sub}</p>
              <h2 className="text-base font-bold text-slate-900 truncate">{h.title}</h2>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{h.meta}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg p-1.5 -mr-1 flex-shrink-0 transition-colors" aria-label="닫기" title="닫기">
            <X size={18} />
          </button>
        </div>

        {/* 진행 표시 (설문 단계에서만) */}
        {(part === 1 || part === 2 || part === 3) && (
          <div className="px-6 pt-3 flex items-center gap-2">
            {[1, 2, 3].map((n) => (
              <div key={n} className={`h-1.5 flex-1 rounded-full ${Number(part) >= n ? "bg-amber-400" : "bg-slate-200"}`} />
            ))}
          </div>
        )}

        {/* 본문 (스크롤) */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {checking && (
            <div className="py-12 flex items-center justify-center text-slate-400 text-sm gap-2">
              <Loader2 size={16} className="animate-spin" /> 확인 중…
            </div>
          )}

          {!checking && part === 1 && (
            <SurveyForm survey={SURVEY_SERVICE_REVIEW} single={single1} setSingle={setSingle1} multi={multi1} setMulti={setMulti1} text={text1} setText={setText1} />
          )}

          {!checking && part === 2 && (
            <DownloadPart jobId={jobId ?? null} alreadySubmitted={alreadySubmitted} />
          )}

          {!checking && part === 3 && (
            <SurveyForm survey={SURVEY_REPORT_QUALITY} single={single2} setSingle={setSingle2} multi={multi2} setMulti={setMulti2} text={text2} setText={setText2} />
          )}

          {!checking && part === "already" && (
            <div className="py-10 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mb-4">
                <Gift size={28} className="text-amber-500" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">이미 이벤트에 참여하셨습니다</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                체험후기 이벤트는 <b className="text-slate-700">아이디당 1회</b> 참여 가능합니다.<br />
                참여해 주셔서 감사합니다.
              </p>
            </div>
          )}

          {!checking && part === "done" && (
            <div className="py-10 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                <CheckCircle2 size={28} className="text-emerald-500" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">참여해 주셔서 감사합니다</h3>
              <p className="text-xs text-slate-500 leading-relaxed">남겨주신 의견은 서비스 개선에 소중히 활용하겠습니다.</p>
            </div>
          )}
        </div>

        {/* 에러 */}
        {error && (
          <div className="mx-6 mb-2 flex items-start gap-2 text-[11px] text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
            <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* 푸터 액션 */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center gap-2">
          {!checking && part === 1 && (
            <button
              onClick={() => submitPart(SURVEY_SERVICE_REVIEW, single1, multi1, text1, 2)}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-400 transition-all disabled:opacity-60"
            >
              {submitting ? <><Loader2 size={14} className="animate-spin" /> 제출 중…</> : <>후기 제출하고 자료 받기 <ArrowRight size={14} /></>}
            </button>
          )}
          {!checking && part === 2 && (
            <>
              {alreadySubmitted ? (
                <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-all">
                  닫기
                </button>
              ) : (
                <button onClick={() => { setError(null); setPart(1); }} className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-all">
                  <ArrowLeft size={14} /> 이전
                </button>
              )}
              <button onClick={() => { setError(null); setPart(3); }} className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-all">
                보고서 품질 평가 <ArrowRight size={14} />
              </button>
            </>
          )}
          {!checking && part === 3 && (
            <>
              <button onClick={() => { setError(null); setPart(2); }} className="flex items-center justify-center gap-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-all">
                <ArrowLeft size={14} /> 이전
              </button>
              <button
                onClick={() => submitPart(SURVEY_REPORT_QUALITY, single2, multi2, text2, "done")}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-400 transition-all disabled:opacity-60"
              >
                {submitting ? <><Loader2 size={14} className="animate-spin" /> 제출 중…</> : <>평가 제출</>}
              </button>
            </>
          )}
          {(part === "done" || part === "already") && (
            <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-all">
              닫기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── 파트 2: 설문 리워드(자료 다운로드) ── */
function DownloadPart({ jobId, alreadySubmitted }: { jobId: string | null; alreadySubmitted?: boolean }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [reportMsg, setReportMsg] = useState<string | null>(null);

  async function run(kind: string, fn: () => Promise<void>) {
    if (!jobId) { setErr("조사 작업 정보가 없어 다운로드할 수 없습니다."); return; }
    setErr(null); setBusy(kind);
    try { await fn(); } catch (e) { setErr(e instanceof Error ? e.message : "다운로드에 실패했습니다."); }
    finally { setBusy(null); }
  }

  // 상세보고서 — 아직 생성 전이면 상세분석을 트리거하고 완료까지 폴링한 뒤 다운로드.
  async function runReport() {
    if (!jobId) { setErr("조사 작업 정보가 없어 다운로드할 수 없습니다."); return; }
    setErr(null); setBusy("report");
    try {
      let st = await getDetailStatus(jobId);
      if (st.detail_status !== "done") {
        setReportMsg("상세보고서를 생성하고 있습니다. 1~2분 정도 소요됩니다. 창을 닫지 말고 잠시만 기다려 주세요.");
        if (st.detail_status !== "running") {
          await startDetail(jobId); // 이미 진행 중이면 백엔드가 현재 상태를 그대로 반환
        }
        // 완료/오류까지 폴링 (최대 ~4분)
        for (let i = 0; i < 80 && st.detail_status !== "done" && st.detail_status !== "error"; i++) {
          await new Promise((r) => setTimeout(r, 3000));
          st = await getDetailStatus(jobId);
        }
      }
      if (st.detail_status === "error") {
        throw new Error(st.detail_error || "상세보고서 생성에 실패했습니다.");
      }
      if (st.detail_status !== "done") {
        throw new Error("상세보고서 생성이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.");
      }
      setReportMsg("상세보고서 생성 완료 — 다운로드를 시작합니다.");
      await downloadReportPdf(jobId);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "상세보고서 다운로드에 실패했습니다.");
    } finally {
      setBusy(null);
      setReportMsg(null);
    }
  }

  const items = [
    { kind: "report", label: "상세보고서", sub: "30p 내외 PDF · 클릭 시 생성(1~2분 소요)", icon: FileText, onClick: runReport },
    { kind: "raw", label: "원본자료 (Raw Data)", sub: "CSV / 엑셀", icon: Database, onClick: () => run("raw", () => downloadRawCsv(jobId!)) },
    { kind: "design", label: "설문 가설 및 설문 문항 설계서", sub: "PDF", icon: FileEdit, onClick: () => run("design", () => downloadDesignPdf(jobId!)) },
  ];

  return (
    <div>
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 mb-4">
        <div className="flex items-center gap-1.5 text-amber-700 font-bold text-xs mb-1">
          <Gift size={13} /> {alreadySubmitted ? "이미 체험후기를 작성하셨습니다" : "설문 리워드"}
        </div>
        <p className="text-[12px] leading-relaxed text-slate-600">
          {alreadySubmitted
            ? "체험후기는 아이디당 1회 참여이며, 자료는 언제든 다시 받으실 수 있습니다."
            : "설문 리워드를 통해 무료로 다운로드 하실 수 있습니다."}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <button
              key={it.kind}
              onClick={it.onClick}
              disabled={busy !== null}
              className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition-all text-left disabled:opacity-60"
            >
              <span className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0"><Icon size={16} /></span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold text-slate-800">{it.label}</span>
                <span className="block text-[11px] text-slate-400">{it.sub}</span>
              </span>
              {busy === it.kind ? <Loader2 size={16} className="animate-spin text-indigo-500" /> : <Download size={16} className="text-slate-400" />}
            </button>
          );
        })}
      </div>
      {reportMsg && (
        <div className="mt-3 flex items-start gap-2 text-[11px] text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
          <Loader2 size={13} className="flex-shrink-0 mt-0.5 animate-spin" />
          <span>{reportMsg}</span>
        </div>
      )}
      {err && <p className="mt-3 text-[11px] text-rose-500">{err}</p>}
    </div>
  );
}

/* ── 설문 폼 (파트 1·3 공용) ── */
function SurveyForm({
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
