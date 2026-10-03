"use client";

import { useEffect, useState } from "react";
import { MessageSquare, X, Gift, Download, FileText, Database, FileEdit, Loader2, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft } from "lucide-react";
import {
  SURVEY_SERVICE_REVIEW,
  SURVEY_REPORT_QUALITY,
  surveyHeader,
  type ReviewSurvey,
} from "@/lib/review-survey";
import { SurveyForm, buildAnswers, validate, type BiMsg } from "@/components/ReviewSurveyForm";
import { trackEvent } from "@/lib/analytics";
import { useLang, useT } from "@/lib/i18n";
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

/** 백엔드 에러는 원문 문자열 그대로, 프론트 안내는 [한, 영] 쌍 */
type Msg = string | BiMsg;

export default function ReviewDialog({ open, onClose, jobId }: Props) {
  const lang = useLang();
  const t = useT();
  const [part, setPart] = useState<Part>(1);

  // 응답 상태 (파트별 분리)
  const [single1, setSingle1] = useState<Record<string, string>>({});
  const [multi1, setMulti1] = useState<Record<string, string[]>>({});
  const [text1, setText1] = useState<Record<string, string>>({});
  const [single2, setSingle2] = useState<Record<string, string>>({});
  const [multi2, setMulti2] = useState<Record<string, string[]>>({});
  const [text2, setText2] = useState<Record<string, string>>({});

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<Msg | null>(null);

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
      const msg = err instanceof Error ? err.message : "";
      // 아이디당 1회 제한(409) — 이미 작성한 경우: 이벤트 참여 완료 안내 화면으로
      if (survey.key === "service_review" && (msg.includes("409") || msg.includes("already_submitted") || msg.includes("이미 체험후기"))) {
        setAlreadySubmitted(true);
        setError(null);
        setPart("already");
      } else {
        setError(msg || ["응답 저장에 실패했습니다.", "Failed to save your response."]);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const h1 = surveyHeader(SURVEY_SERVICE_REVIEW, lang);
  const h3 = surveyHeader(SURVEY_REPORT_QUALITY, lang);
  const headerByPart: Record<string, { sub: string; title: string; meta: string }> = {
    1: { sub: h1.subtitle, title: h1.title, meta: h1.meta },
    2: t(
      { sub: "리워드", title: "설문 리워드", meta: "상세보고서·원본자료·설계서를 무료로 받아보세요" },
      { sub: "Reward", title: "Survey reward", meta: "Get the detailed report, raw data, and design document for free" },
    ),
    3: { sub: h3.subtitle, title: h3.title, meta: h3.meta },
    already: t(
      { sub: "안내", title: "체험후기 이벤트", meta: "아이디당 1회 참여" },
      { sub: "Notice", title: "Review event", meta: "One entry per account" },
    ),
    done: t(
      { sub: "완료", title: "감사합니다", meta: "소중한 의견 감사합니다 · SocialTwin" },
      { sub: "Complete", title: "Thank you", meta: "Thanks for your feedback · Socialtwin" },
    ),
  };
  const h = headerByPart[String(part)];
  const errorText = error == null ? null : typeof error === "string" ? error : t(error[0], error[1]);

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
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg p-1.5 -mr-1 flex-shrink-0 transition-colors" aria-label={t("닫기", "Close")} title={t("닫기", "Close")}>
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
              <Loader2 size={16} className="animate-spin" /> {t("확인 중…", "Checking…")}
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
              <h3 className="text-base font-bold text-slate-900 mb-1">{t("이미 이벤트에 참여하셨습니다", "You've already joined this event")}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t(
                  <>
                    체험후기 이벤트는 <b className="text-slate-700">아이디당 1회</b> 참여 가능합니다.<br />
                    참여해 주셔서 감사합니다.
                  </>,
                  <>
                    The review event is limited to <b className="text-slate-700">one entry per account</b>.<br />
                    Thank you for participating.
                  </>,
                )}
              </p>
            </div>
          )}

          {!checking && part === "done" && (
            <div className="py-10 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                <CheckCircle2 size={28} className="text-emerald-500" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">{t("참여해 주셔서 감사합니다", "Thank you for participating")}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{t("남겨주신 의견은 서비스 개선에 소중히 활용하겠습니다.", "We'll use your feedback to improve the service.")}</p>
            </div>
          )}
        </div>

        {/* 에러 */}
        {errorText && (
          <div className="mx-6 mb-2 flex items-start gap-2 text-[11px] text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
            <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
            <span>{errorText}</span>
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
              {submitting ? <><Loader2 size={14} className="animate-spin" /> {t("제출 중…", "Submitting…")}</> : <>{t("후기 제출하고 자료 받기", "Submit review and get files")} <ArrowRight size={14} /></>}
            </button>
          )}
          {!checking && part === 2 && (
            <>
              {alreadySubmitted ? (
                <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-all">
                  {t("닫기", "Close")}
                </button>
              ) : (
                <button onClick={() => { setError(null); setPart(1); }} className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-all">
                  <ArrowLeft size={14} /> {t("이전", "Back")}
                </button>
              )}
              <button onClick={() => { setError(null); setPart(3); }} className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-all">
                <span className="flex items-center gap-1.5">{t("보고서 품질 평가", "Rate report quality")} <ArrowRight size={14} /></span>
                <span className="text-[10px] font-normal text-indigo-200 leading-snug text-center">
                  {t(
                    <>다운로드 받으신 상세보고서 등을 확인하신 후<br />응답 부탁드립니다.</>,
                    <>Please answer after reviewing<br />the detailed report you downloaded.</>,
                  )}
                </span>
              </button>
            </>
          )}
          {!checking && part === 3 && (
            <>
              <button onClick={() => { setError(null); setPart(2); }} className="flex items-center justify-center gap-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-all">
                <ArrowLeft size={14} /> {t("이전", "Back")}
              </button>
              <button
                onClick={() => submitPart(SURVEY_REPORT_QUALITY, single2, multi2, text2, "done")}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-400 transition-all disabled:opacity-60"
              >
                {submitting ? <><Loader2 size={14} className="animate-spin" /> {t("제출 중…", "Submitting…")}</> : <>{t("평가 제출", "Submit review")}</>}
              </button>
            </>
          )}
          {(part === "done" || part === "already") && (
            <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-all">
              {t("닫기", "Close")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── 파트 2: 설문 리워드(자료 다운로드) ── */
function DownloadPart({ jobId, alreadySubmitted }: { jobId: string | null; alreadySubmitted?: boolean }) {
  const t = useT();
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<Msg | null>(null);
  const [reportMsg, setReportMsg] = useState<BiMsg | null>(null);
  const NO_JOB: BiMsg = ["조사 작업 정보가 없어 다운로드할 수 없습니다.", "Can't download — the study information is missing."];

  async function run(kind: string, fn: () => Promise<void>) {
    if (!jobId) { setErr(NO_JOB); return; }
    setErr(null); setBusy(kind);
    try { await fn(); } catch (e) { setErr(e instanceof Error ? e.message : ["다운로드에 실패했습니다.", "Download failed."]); }
    finally { setBusy(null); }
  }

  // 상세보고서 — 아직 생성 전이면 상세분석을 트리거하고 완료까지 폴링한 뒤 다운로드.
  async function runReport() {
    if (!jobId) { setErr(NO_JOB); return; }
    setErr(null); setBusy("report");
    try {
      let st = await getDetailStatus(jobId);
      if (st.detail_status !== "done") {
        setReportMsg([
          "상세보고서를 작성하고 있습니다. 초안 생성과 검토·수정 과정을 거쳐 2~4분 정도 소요됩니다. 창을 닫지 말고 잠시만 기다려 주세요.",
          "Writing the detailed report. Drafting, review, and revision take about 2–4 minutes. Please keep this window open.",
        ]);
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
        setErr(st.detail_error || ["상세보고서 생성에 실패했습니다.", "Failed to generate the detailed report."]);
        return;
      }
      if (st.detail_status !== "done") {
        setErr(["상세보고서 생성이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.", "The detailed report is taking longer than expected. Please try again shortly."]);
        return;
      }
      setReportMsg(["상세보고서 생성 완료 — 다운로드를 시작합니다.", "Detailed report ready — starting download."]);
      trackEvent("상세보고서_다운로드", { 경로: "리워드" });
      await downloadReportPdf(jobId);
    } catch (e) {
      setErr(e instanceof Error ? e.message : ["상세보고서 다운로드에 실패했습니다.", "Failed to download the detailed report."]);
    } finally {
      setBusy(null);
      setReportMsg(null);
    }
  }

  const items = [
    { kind: "report", label: t("상세보고서", "Detailed report"), sub: t("30p 내외 PDF · 생성·검토·수정 거쳐 완성(2~4분 소요)", "~30-page PDF · drafted, reviewed, and revised (takes 2–4 min)"), icon: FileText, onClick: runReport },
    { kind: "raw", label: t("원본자료 (Raw Data)", "Raw data"), sub: t("CSV / 엑셀", "CSV / Excel"), icon: Database, onClick: () => run("raw", () => downloadRawCsv(jobId!)) },
    { kind: "design", label: t("설문 가설 및 설문 문항 설계서", "Survey hypotheses & question design document"), sub: "PDF", icon: FileEdit, onClick: () => run("design", () => downloadDesignPdf(jobId!)) },
  ];
  const errText = err == null ? null : typeof err === "string" ? err : t(err[0], err[1]);

  return (
    <div>
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 mb-4">
        <div className="flex items-center gap-1.5 text-amber-700 font-bold text-xs mb-1">
          <Gift size={13} /> {alreadySubmitted ? t("이미 체험후기를 작성하셨습니다", "You've already submitted a review") : t("설문 리워드", "Survey reward")}
        </div>
        <p className="text-[12px] leading-relaxed text-slate-600">
          {alreadySubmitted
            ? t("체험후기는 아이디당 1회 참여이며, 자료는 언제든 다시 받으실 수 있습니다.", "Reviews are limited to one per account, but you can download the files again anytime.")
            : t("설문 리워드를 통해 무료로 다운로드 하실 수 있습니다.", "Download these for free as your survey reward.")}
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
          <span>{t(reportMsg[0], reportMsg[1])}</span>
        </div>
      )}
      {errText && <p className="mt-3 text-[11px] text-rose-500">{errText}</p>}
    </div>
  );
}

