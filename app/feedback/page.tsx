"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageSquare, Loader2, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft } from "lucide-react";
import {
  SURVEY_SERVICE_REVIEW,
  SURVEY_REPORT_QUALITY,
  type ReviewSurvey,
} from "@/lib/review-survey";
import { SurveyForm, buildAnswers, validate } from "@/components/ReviewSurveyForm";
import { submitReviewResponse } from "@/lib/survey-api";

type Step = 1 | 2 | "done";

/**
 * 공개 설문 링크 (체험후기 다이얼로그의 1·3단계만 분리, 다운로드 제외).
 * 1단계 = 서비스 리뷰(service_review), 2단계 = 보고서 품질 평가(report_quality).
 * 비로그인 허용 — 제출은 job_id 없이 submitReviewResponse 로 전송되어
 * 백엔드 리뷰 응답 저장소(관리자 대시보드 "설문결과" 탭)에 그대로 기록됩니다.
 */
export default function FeedbackPage() {
  const [step, setStep] = useState<Step>(1);

  // 응답 상태 (설문별 분리)
  const [single1, setSingle1] = useState<Record<string, string>>({});
  const [multi1, setMulti1] = useState<Record<string, string[]>>({});
  const [text1, setText1] = useState<Record<string, string>>({});
  const [single2, setSingle2] = useState<Record<string, string>>({});
  const [multi2, setMulti2] = useState<Record<string, string[]>>({});
  const [text2, setText2] = useState<Record<string, string>>({});

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitSurvey(
    survey: ReviewSurvey,
    single: Record<string, string>,
    multi: Record<string, string[]>,
    text: Record<string, string>,
    next: Step,
  ) {
    const v = validate(survey, single, multi, text);
    if (v) { setError(v); return; }
    setError(null);
    setSubmitting(true);
    try {
      await submitReviewResponse({
        survey_key: survey.key,
        job_id: null, // 공개 링크 — 특정 조사 결과에 묶이지 않음
        answers: buildAnswers(survey, single, multi, text),
        source: "public_link", // 백엔드가 비로그인 저장을 허용하도록 출처 표식
      });
      setError(null);
      setStep(next);
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "응답 저장에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  const headerByStep: Record<string, { sub: string; title: string; meta: string }> = {
    // 공개 링크에는 다운로드 리워드가 없으므로 설문1의 "무료 다운로드" 안내 문구는 빼고 표기
    1: { sub: SURVEY_SERVICE_REVIEW.subtitle, title: SURVEY_SERVICE_REVIEW.title, meta: "소요 시간 약 3~5분 · 총 14문항" },
    2: { sub: SURVEY_REPORT_QUALITY.subtitle, title: SURVEY_REPORT_QUALITY.title, meta: SURVEY_REPORT_QUALITY.meta },
    done: { sub: "완료", title: "감사합니다", meta: "소중한 의견 감사합니다 · SocialTwin" },
  };
  const h = headerByStep[String(step)];

  return (
    <main className="min-h-screen mesh-bg flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg flex flex-col bg-white rounded-2xl shadow-2xl shadow-black/10 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400" />

        {/* 헤더 */}
        <div className="px-6 pt-5 pb-3 flex items-start gap-2.5 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <MessageSquare size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-amber-600">{h.sub}</p>
            <h1 className="text-base font-bold text-slate-900">{h.title}</h1>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{h.meta}</p>
          </div>
        </div>

        {/* 진행 표시 (설문 단계에서만, 2단계) */}
        {(step === 1 || step === 2) && (
          <div className="px-6 pt-3 flex items-center gap-2">
            {[1, 2].map((n) => (
              <div key={n} className={`h-1.5 flex-1 rounded-full ${Number(step) >= n ? "bg-amber-400" : "bg-slate-200"}`} />
            ))}
          </div>
        )}

        {/* 본문 */}
        <div className="px-6 py-4">
          {step === 1 && (
            <SurveyForm survey={SURVEY_SERVICE_REVIEW} single={single1} setSingle={setSingle1} multi={multi1} setMulti={setMulti1} text={text1} setText={setText1} />
          )}
          {step === 2 && (
            <SurveyForm survey={SURVEY_REPORT_QUALITY} single={single2} setSingle={setSingle2} multi={multi2} setMulti={setMulti2} text={text2} setText={setText2} />
          )}
          {step === "done" && (
            <div className="py-10 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                <CheckCircle2 size={28} className="text-emerald-500" />
              </div>
              <h2 className="text-base font-bold text-slate-900 mb-1">참여해 주셔서 감사합니다</h2>
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
          {step === 1 && (
            <button
              onClick={() => submitSurvey(SURVEY_SERVICE_REVIEW, single1, multi1, text1, 2)}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-400 transition-all disabled:opacity-60"
            >
              {submitting ? <><Loader2 size={14} className="animate-spin" /> 제출 중…</> : <>다음 설문으로 <ArrowRight size={14} /></>}
            </button>
          )}
          {step === 2 && (
            <>
              <button onClick={() => { setError(null); setStep(1); }} className="flex items-center justify-center gap-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-all">
                <ArrowLeft size={14} /> 이전
              </button>
              <button
                onClick={() => submitSurvey(SURVEY_REPORT_QUALITY, single2, multi2, text2, "done")}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-400 transition-all disabled:opacity-60"
              >
                {submitting ? <><Loader2 size={14} className="animate-spin" /> 제출 중…</> : <>평가 제출</>}
              </button>
            </>
          )}
          {step === "done" && (
            <Link href="/" className="flex-1 text-center py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-all">
              SocialTwin 홈으로
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
