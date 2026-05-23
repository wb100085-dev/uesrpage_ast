"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Sparkles, ArrowRight, ArrowLeft, MessageSquare,
  Clock, Check, Pencil, Upload, FileText,
  X, ChevronDown, BarChart2, Target, Lightbulb,
  AlertCircle, Wand2, ListChecks, Users, Save, RefreshCw,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import ContactDialog from "@/components/ContactDialog";
import RequireAuth from "@/components/RequireAuth";
import { getAccessToken } from "@/lib/auth-api";
import {
  createDraft as apiCreateDraft,
  updateDraft as apiUpdateDraft,
  getDraft as apiGetDraft,
  type SurveyDraftPatch,
} from "@/lib/survey-api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/* ─────────────────────────────────────────
   타입
───────────────────────────────────────── */
type Step =
  | "input"
  | "hyp_designing"
  | "hyp_review"
  | "survey_designing"
  | "survey_review"
  | "result";

type ApiQuestion = {
  type: string;
  title: string;
  question: string;
  options: string[];
};

/* ─────────────────────────────────────────
   상수
───────────────────────────────────────── */
const TRADE_TYPES: { code: string; en: string }[] = [
  { code: "B2C", en: "Business-to-Consumer" },
  { code: "B2B", en: "Business-to-Business" },
  { code: "B2G", en: "Business-to-Government" },
  { code: "C2C", en: "Consumer-to-Consumer" },
  { code: "D2C", en: "Direct-to-Consumer" },
  { code: "B2B2C", en: "Business-to-Business-to-Consumer" },
];

const INDUSTRIES = [
  "A. 농업, 임업 및 어업", "B. 광업", "C. 제조업",
  "D. 전기, 가스, 증기 및 공기조절 공급업",
  "E. 수도, 하수 및 폐기물 처리, 원료 재생업",
  "F. 건설업", "G. 도매 및 소매업", "H. 운수 및 창고업",
  "I. 숙박 및 음식점업", "J. 정보통신업", "K. 금융 및 보험업",
  "L. 부동산업", "M. 전문, 과학 및 기술 서비스업",
  "N. 사업시설 관리, 사업 지원 및 임대 서비스업",
  "O. 공공행정, 국방 및 사회보장 행정", "P. 교육 서비스업",
  "Q. 보건업 및 사회복지 서비스업",
  "R. 예술, 스포츠 및 여가 관련 서비스업",
  "S. 협회 및 단체, 수리 및 기타 개인 서비스업",
  "T. 가구 내 고용활동 및 달리 분류되지 않은 자가소비 생산활동",
  "U. 국제 및 외국기관",
];

const QUESTION_TYPES = ["객관식", "복수선택", "리커트 5점", "리커트 7점", "순위형", "주관식"];

const STEPS: Step[] = ["input", "hyp_designing", "hyp_review", "survey_designing", "survey_review", "result"];
const STEP_LABELS = ["질문 입력", "가설 설계", "가설 검토", "설문 생성", "설문 검토", "요약"];
const STEP_ICONS = [MessageSquare, Sparkles, Lightbulb, Wand2, ListChecks, BarChart2];

const BACK_MAP: Partial<Record<Step, Step>> = {
  hyp_designing: "input",
  hyp_review: "input",
  survey_designing: "hyp_review",
  survey_review: "hyp_review",
  result: "survey_review",
};

const PRODUCT_QUESTIONS = [
  {
    tag: "[대상]",
    label: "[대상] 이 제품(서비스)은 정확히 '누구'의 문제를 해결합니까?",
    hint: "단순한 인구통계학적 구분을 넘어, 어떤 상황에 처해 있거나 어떤 고충(Pain Point)을 겪고 있는 사람인지 정의합니다.",
  },
  {
    tag: "[본질]",
    label: "[본질] 고객이 겪고 있는 문제 중 '어떤 핵심적인 어려움'을 해결합니까?",
    hint: "제공자가 생각하는 기능 중심이 아니라, 고객이 느끼는 가장 가렵고 아픈 부분이 무엇인지에 집중하여 정의합니다.",
  },
  {
    tag: "[방법]",
    label: "[방법] 그 문제를 해결하기 위한 '결정적인 솔루션'은 무엇입니까?",
    hint: "기술적 메커니즘이나 서비스의 핵심 프로세스를 설명합니다. 어떤 방식으로 고객의 문제를 해소하는지 정의합니다.",
  },
  {
    tag: "[차별화]",
    label: "[차별화] 기존의 대안(경쟁사 혹은 관습)들과 비교했을 때 무엇이 '다릅니까'?",
    hint: "왜 고객이 다른 서비스가 아닌 이 제품을 선택해야 하는지, 우리만의 독보적인 강점이나 차별적 접근법을 정의합니다.",
  },
  {
    tag: "[결과]",
    label: "[결과] 고객이 이 서비스를 이용한 후 얻게 되는 '최종적인 변화'는 무엇입니까?",
    hint: "단순한 결과물이 아니라, 고객의 삶이나 업무 효율성, 감정적 만족도 등에서 일어나는 실질적인 변화(Before & After)를 정의합니다.",
  },
];

const PURPOSE_QUESTIONS = [
  {
    tag: "[조사 목적]",
    label: "[조사 목적] 이번 시장조사를 통해 의사결정을 내려야 하는 '당면 과제'는 무엇입니까?",
    hint: "신제품 출시 여부, 가격 책정, 브랜드 인지도 파악 등 조사가 끝난 후 즉시 실행에 옮겨야 할 구체적인 목표를 확인합니다.",
  },
  {
    tag: "[가설 검증]",
    label: "[가설 검증] 현재 내부적으로 추측하고 있는 '가장 핵심적인 가설'은 무엇입니까?",
    hint: "\"우리의 주 고객은 30대일 것이다\" 혹은 \"기존 제품의 가격이 비싸서 안 팔릴 것이다\"와 같이, 맞는지 틀린지 확인하고 싶은 전제를 파악합니다.",
  },
  {
    tag: "[타겟 상세]",
    label: "[타겟 상세] 어떤 특성을 가진 사람들에게 질문했을 때 가장 '신뢰할 만한 답변'을 얻을 수 있습니까?",
    hint: "단순 연령/성별을 넘어 실제 사용자, 잠재 고객, 혹은 경쟁사 이용자 등 응답자의 조건(Screening)을 구체화합니다.",
  },
  {
    tag: "[핵심 지표]",
    label: "[핵심 지표] 결과 보고서에 반드시 포함되어야 하는 '가장 중요한 한 가지 데이터'는 무엇입니까?",
    hint: "순수 추천 지수(NPS), 구매 의향도, 제품 만족도 등 의뢰인이 결과물을 받았을 때 가장 먼저 펼쳐볼 핵심 지표를 정의합니다.",
  },
  {
    tag: "[활용 계획]",
    label: "[활용 계획] 조사 결과가 나온 뒤, 이 데이터를 어떤 '비즈니스 채널'에 활용하실 예정입니까?",
    hint: "마케팅 캠페인 전략 수립, 투자 유치용 IR 자료, 제품 기능 개선 등 활용처에 따라 설문의 톤앤매너와 분석의 깊이를 조절하기 위함입니다.",
  },
];

/* ─────────────────────────────────────────
   StepBar
───────────────────────────────────────── */
function StepBar({ step }: { step: Step }) {
  const idx = STEPS.indexOf(step);
  return (
    <div className="flex items-center justify-center mb-10">
      {STEP_LABELS.map((label, i) => {
        const Icon = STEP_ICONS[i];
        const done = i < idx;
        const active = i === idx;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                done ? "bg-indigo-600 shadow-md shadow-indigo-200"
                  : active ? "bg-indigo-600 shadow-lg shadow-indigo-300 ring-4 ring-indigo-100"
                  : "bg-white border-2 border-slate-200"
              }`}>
                {done
                  ? <Check size={14} className="text-white" strokeWidth={2.5} />
                  : <Icon size={14} className={active ? "text-white" : "text-slate-400"} />
                }
              </div>
              <span className={`text-[10px] font-semibold tracking-wide whitespace-nowrap ${
                active ? "text-indigo-600" : done ? "text-indigo-400" : "text-slate-400"
              }`}>{label}</span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div className={`w-12 h-0.5 mb-5 mx-1.5 rounded-full transition-all duration-300 ${
                i < idx ? "bg-indigo-400" : "bg-slate-200"
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────
   공용 컴포넌트
───────────────────────────────────────── */
function CharCount({ len }: { len: number }) {
  if (len === 0) return <span className="text-xs text-slate-300">0자</span>;
  if (len >= 300) return <span className="text-xs text-emerald-500 font-medium">{len}자 ✓</span>;
  return <span className="text-xs text-amber-400 font-medium">{len}자 · {300 - len}자 더 필요</span>;
}

function FieldLabel({ children, required, hint }: { children: React.ReactNode; required?: boolean; hint?: string }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <label className="text-sm font-semibold text-slate-700">
        {children}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {hint && <span className="text-xs text-amber-500 font-medium">{hint}</span>}
    </div>
  );
}

function ErrorMsg({ msg }: { msg: string }) {
  return (
    <p className="mt-1.5 flex items-center gap-1 text-xs text-red-500 font-medium">
      <span className="w-3.5 h-3.5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 text-[9px] font-bold">!</span>
      {msg}
    </p>
  );
}

/* ─────────────────────────────────────────
   ProgressCard (공통 애니메이션 카드)
───────────────────────────────────────── */
function ProgressCard({
  title, subtitle, progress, progressLabel, dots,
}: {
  title: string;
  subtitle: string;
  progress: number;
  progressLabel: string;
  dots: string[];
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-8 py-16 flex flex-col items-center">
      <div className="relative mb-8">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-xl shadow-indigo-200">
          <Sparkles size={32} className="text-white" />
        </div>
        <div className="absolute inset-0 rounded-2xl bg-indigo-400 animate-pulse opacity-30" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">{title}</h2>
      <p className="text-slate-400 text-sm mb-10 max-w-md text-center leading-relaxed">
        &ldquo;{subtitle}&rdquo;
      </p>
      <div className="w-full max-w-lg mb-3">
        <div className="flex justify-between text-xs text-slate-400 mb-2">
          <span>{progressLabel}</span>
          <span className="font-semibold text-indigo-600 tabular-nums">{Math.floor(progress)}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-indigo-500 to-violet-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <div className="flex items-center gap-6 mt-8 text-xs text-slate-400">
        {dots.map((s, i) => (
          <div key={s} className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${progress > i * (100 / dots.length) + 5 ? "bg-indigo-400" : "bg-slate-200"}`} />
            <span className={progress > i * (100 / dots.length) + 5 ? "text-slate-500" : ""}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   메인 페이지
───────────────────────────────────────── */
export default function DesignPage() {
  return (
    <RequireAuth>
      <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
        <DesignPageInner />
      </Suspense>
    </RequireAuth>
  );
}

function DesignPageInner() {
  const searchParams = useSearchParams();
  const draftIdFromUrl = searchParams.get("draft");

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // 입력
  const [tradeType, setTradeType] = useState("");
  const [industry, setIndustry] = useState("");
  const [productMode, setProductMode] = useState<"structured" | "free">("structured");
  const [productAnswers, setProductAnswers] = useState(["", "", "", "", ""]);
  const [productFree, setProductFree] = useState("");
  const [purposeMode, setPurposeMode] = useState<"structured" | "free">("structured");
  const [purposeAnswers, setPurposeAnswers] = useState(["", "", "", "", ""]);
  const [purposeFree, setPurposeFree] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [apiError, setApiError] = useState("");

  // ── 임시저장 상태 ──
  const [draftId, setDraftId] = useState<number | null>(null);
  const [draftLoading, setDraftLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // 활성 모드에서 결합 텍스트 도출
  const productDef = productMode === "structured"
    ? productAnswers.map((a, i) => a.trim() ? `${PRODUCT_QUESTIONS[i].tag}\n${a.trim()}` : "").filter(Boolean).join("\n\n")
    : productFree;

  const researchPurpose = purposeMode === "structured"
    ? purposeAnswers.map((a, i) => a.trim() ? `${PURPOSE_QUESTIONS[i].tag}\n${a.trim()}` : "").filter(Boolean).join("\n\n")
    : purposeFree;

  // 단계
  const [step, setStep] = useState<Step>("input");
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");

  // 가설
  const [hypothesisTexts, setHypothesisTexts] = useState<string[]>([]);
  const [selectedHypotheses, setSelectedHypotheses] = useState<Set<number>>(new Set());
  const [editingHypIdx, setEditingHypIdx] = useState<number | null>(null);
  const [hypDraft, setHypDraft] = useState("");

  // 설문
  const [surveyQuestions, setSurveyQuestions] = useState<ApiQuestion[]>([]);
  const [editingQIdx, setEditingQIdx] = useState<number | null>(null);
  const [expandedQIdx, setExpandedQIdx] = useState<Set<number>>(new Set());
  const [qDraft, setQDraft] = useState<Partial<ApiQuestion>>({});
  const [uploadedPdf, setUploadedPdf] = useState<string | null>(null);

  // 문의 다이얼로그
  const [contactOpen, setContactOpen] = useState(false);

  /* ── 임시저장: URL ?draft= 로 들어오면 마운트 시 자동 로드 ── */
  useEffect(() => {
    if (!draftIdFromUrl) return;
    const id = parseInt(draftIdFromUrl, 10);
    if (Number.isNaN(id)) return;
    let cancelled = false;
    setDraftLoading(true);
    (async () => {
      try {
        const { draft } = await apiGetDraft(id);
        if (cancelled || !draft) return;
        setDraftId(draft.id);
        // input_data 복원
        const d = (draft.input_data || {}) as Record<string, unknown>;
        if (typeof d.tradeType === "string") setTradeType(d.tradeType);
        if (typeof d.industry === "string") setIndustry(d.industry);
        if (d.productMode === "structured" || d.productMode === "free") setProductMode(d.productMode);
        if (Array.isArray(d.productAnswers)) setProductAnswers((d.productAnswers as string[]).slice(0, 5).concat(["", "", "", "", ""]).slice(0, 5));
        if (typeof d.productFree === "string") setProductFree(d.productFree);
        if (d.purposeMode === "structured" || d.purposeMode === "free") setPurposeMode(d.purposeMode);
        if (Array.isArray(d.purposeAnswers)) setPurposeAnswers((d.purposeAnswers as string[]).slice(0, 5).concat(["", "", "", "", ""]).slice(0, 5));
        if (typeof d.purposeFree === "string") setPurposeFree(d.purposeFree);
        // AI 결과 복원
        if (Array.isArray(draft.hypotheses)) setHypothesisTexts(draft.hypotheses);
        if (Array.isArray(draft.selected_hypotheses)) setSelectedHypotheses(new Set(draft.selected_hypotheses as number[]));
        if (Array.isArray(draft.questions)) setSurveyQuestions(draft.questions as ApiQuestion[]);
        // step 복원 (running 류는 건너뛰고 검토 단계로)
        const stepMap: Record<string, Step> = {
          input: "input",
          hyp_review: "hyp_review",
          survey_review: "survey_review",
          result: "result",
        };
        const restored = stepMap[draft.step] ?? "input";
        setStep(restored);
        setSubmitted(true);
        setSavedAt(new Date(draft.updated_at).getTime());
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setDraftLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftIdFromUrl]);

  /* ── 임시저장 ── */
  async function handleSaveDraft() {
    if (saving) return;
    setSaving(true);
    setSaveError(null);
    // 제목: 첫 30자 (productFree 또는 첫 productAnswer)
    const titleSrc = (productFree.trim()
      || productAnswers.find((a) => a.trim())
      || tradeType
      || industry
      || "(제목 없음)").trim();
    const title = titleSrc.slice(0, 30);
    const payload: SurveyDraftPatch = {
      title,
      step,
      input_data: {
        tradeType, industry, productMode, productAnswers, productFree,
        purposeMode, purposeAnswers, purposeFree,
      },
      hypotheses: hypothesisTexts,
      selected_hypotheses: Array.from(selectedHypotheses),
      questions: surveyQuestions,
    };
    try {
      if (draftId == null) {
        const { draft } = await apiCreateDraft(payload);
        setDraftId(draft.id);
      } else {
        await apiUpdateDraft(draftId, payload);
      }
      setSavedAt(Date.now());
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  /* ── 헬퍼 ── */
  function stopTimer() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }

  function goBack() {
    stopTimer();
    const target = BACK_MAP[step];
    if (target) setStep(target);
  }

  function startAnimation(labels: string[], onDone: () => void) {
    setProgress(0);
    setProgressLabel(labels[0]);
    let p = 0; let li = 0;
    timerRef.current = setInterval(() => {
      p += Math.random() * 6 + 2;
      const nextLi = Math.floor(p / (100 / labels.length));
      if (nextLi !== li && nextLi < labels.length) { li = nextLi; setProgressLabel(labels[li]); }
      if (p >= 95) { p = 95; }
      setProgress(Math.min(p, 95));
    }, 200);

    return () => {
      stopTimer();
      setProgress(100);
      setTimeout(onDone, 400);
    };
  }

  /* ── Step 1→2: 가설 설계 API 호출 ── */
  async function handleDesign() {
    setSubmitted(true);
    if (!tradeType || !industry || !productDef.trim() || !researchPurpose.trim()) return;

    setApiError("");
    setStep("hyp_designing");

    const finish = startAnimation(
      ["입력 내용 분석 중...", "시장 컨텍스트 파악 중...", "가설 도출 중...", "검토 중..."],
      () => setStep("hyp_review")
    );

    // 거래방식·산업을 정의 본문 앞에 명시해 AI가 가설 설계 시 컨텍스트로 활용
    const tradeFull = TRADE_TYPES.find((t) => t.code === tradeType);
    const tradeLine = tradeFull ? `[거래방식] ${tradeFull.code} (${tradeFull.en})` : "";
    const industryLine = industry ? `[산업 분류] ${industry}` : "";
    const definitionPayload = [tradeLine, industryLine, productDef].filter(Boolean).join("\n\n");

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const tok = getAccessToken();
      if (tok) headers.Authorization = `Bearer ${tok}`;
      const res = await fetch(`${API_URL}/api/survey/design`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          definition: definitionPayload,
          needs: researchPurpose,
          trade_type: tradeType,
          industry,
        }),
      });
      if (!res.ok) throw new Error(`서버 오류 (${res.status})`);
      const data = await res.json();

      setHypothesisTexts(data.hypotheses ?? []);
      setSurveyQuestions(data.questions ?? []);
      setSelectedHypotheses(new Set(data.hypotheses?.length ? [0] : []));
      finish();
    } catch (err) {
      stopTimer();
      setApiError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
      setStep("input");
    }
  }

  /* ── Step 3→4: 설문 생성 (이미 가져온 데이터, 애니메이션만) ── */
  function handleSurveyDesign() {
    setStep("survey_designing");
    const finish = startAnimation(
      ["가설 분석 중...", "설문 문항 구성 중...", "응답 옵션 생성 중...", "최종 검토 중..."],
      () => setStep("survey_review")
    );
    setTimeout(finish, 2500);
  }

  /* ── 객관식 토글 ── */
  function toggleExpand(i: number) {
    setExpandedQIdx((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  const hasOptions = (q: ApiQuestion) =>
    (q.type === "객관식" || q.type === "복수선택" || q.type === "순위형") && q.options?.length > 0;

  const errTradeType = submitted && !tradeType;
  const errIndustry = submitted && !industry;
  const errProduct = submitted && !productDef.trim();
  const errPurpose = submitted && !researchPurpose.trim();

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-8 py-10">
        <div className="flex items-start justify-between gap-4 mb-2">
          <div className="flex-1"><StepBar step={step} /></div>
          {/* 임시저장 버튼 — 로그인 사용자만 노출 + 결과 단계는 숨김 */}
          {typeof window !== "undefined" && getAccessToken() && step !== "result" && (
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <button
                onClick={handleSaveDraft}
                disabled={saving || draftLoading}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 hover:border-slate-300 disabled:opacity-60 transition-all"
                title={draftId ? "임시저장한 작업에 덮어쓰기" : "임시저장"}
              >
                {saving
                  ? <><RefreshCw size={12} className="animate-spin" /> 저장 중…</>
                  : draftLoading
                    ? <><RefreshCw size={12} className="animate-spin" /> 불러오는 중…</>
                    : <><Save size={12} /> 임시저장</>}
              </button>
              {savedAt && !saving && (
                <span className="text-[10px] text-slate-400">
                  마지막 저장 {new Date(savedAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
              {saveError && (
                <span className="text-[10px] text-rose-600 max-w-[200px] truncate" title={saveError}>{saveError}</span>
              )}
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════
            1. 질문 입력
        ══════════════════════════════════════════ */}
        {step === "input" && (
          <div>
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
                <Sparkles size={12} /> AI 시장조사 설계
              </div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">어떤 시장조사가 필요하신가요?</h1>
              <p className="text-slate-500">입력 내용을 바탕으로 AI가 가설과 설문 문항을 자동으로 설계합니다.</p>
            </div>

            {apiError && (
              <div className="mb-4 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-700">오류가 발생했습니다</p>
                  <p className="text-xs text-red-500 mt-0.5">{apiError}</p>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* 거래방식 */}
              <div className="px-8 pt-7 pb-5 border-b border-slate-100">
                <FieldLabel required>
                  거래방식
                  <span className="ml-1.5 text-slate-400 text-xs font-normal">(주된 거래 대상)</span>
                </FieldLabel>
                <div className="relative">
                  <select
                    value={tradeType}
                    onChange={(e) => setTradeType(e.target.value)}
                    className={`w-full appearance-none bg-slate-50 border rounded-xl px-4 py-3 pr-10 text-sm text-slate-700 outline-none focus:bg-white focus:ring-2 transition-all cursor-pointer ${
                      errTradeType ? "border-red-300 focus:ring-red-400/20" : "border-slate-200 focus:border-indigo-400 focus:ring-indigo-400/20"
                    }`}
                  >
                    <option value="">거래방식을 선택하세요</option>
                    {TRADE_TYPES.map((t) => (
                      <option key={t.code} value={t.code}>
                        {t.code} ({t.en})
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
                {errTradeType && <ErrorMsg msg="거래방식을 선택해주세요." />}
              </div>

              {/* 산업 분류 */}
              <div className="px-8 pt-7 pb-5 border-b border-slate-100">
                <FieldLabel required>
                  산업 분류
                  <span className="ml-1.5 text-slate-400 text-xs font-normal">(한국표준산업분류 11차 대분류)</span>
                </FieldLabel>
                <div className="relative">
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className={`w-full appearance-none bg-slate-50 border rounded-xl px-4 py-3 pr-10 text-sm text-slate-700 outline-none focus:bg-white focus:ring-2 transition-all cursor-pointer ${
                      errIndustry ? "border-red-300 focus:ring-red-400/20" : "border-slate-200 focus:border-indigo-400 focus:ring-indigo-400/20"
                    }`}
                  >
                    <option value="">산업 분류를 선택하세요</option>
                    {INDUSTRIES.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
                  </select>
                  <ChevronDown size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
                {errIndustry && <ErrorMsg msg="산업 분류를 선택해주세요." />}
              </div>

              {/* 제품 정의 */}
              <div className="px-8 py-6 border-b border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm font-semibold text-slate-700">
                    제품 / 서비스 정의 <span className="text-red-400">*</span>
                  </label>
                  <div className="flex items-center gap-0.5 bg-slate-100 p-1 rounded-lg">
                    {(["structured", "free"] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setProductMode(m)}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                          productMode === m
                            ? "bg-white text-indigo-600 shadow-sm"
                            : "text-slate-400 hover:text-slate-600"
                        }`}
                      >
                        {m === "structured" ? "질문형" : "자유형"}
                      </button>
                    ))}
                  </div>
                </div>

                {productMode === "structured" ? (
                  <div className="flex flex-col gap-5">
                    <p className="text-xs text-indigo-500 font-medium -mb-1">각 항목에 최대한 상세하게 작성해주세요. 구체적일수록 AI가 더 정확한 가설을 도출합니다.</p>
                    {PRODUCT_QUESTIONS.map((q, i) => (
                      <div key={i}>
                        <p className="text-sm font-semibold text-slate-700 mb-1">{q.label}</p>
                        <p className="text-xs text-slate-400 mb-2 leading-relaxed">{q.hint}</p>
                        <textarea
                          className="w-full h-12 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-300 resize-none outline-none leading-relaxed bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all"
                          value={productAnswers[i]}
                          onChange={(e) => {
                            const next = [...productAnswers];
                            next[i] = e.target.value;
                            setProductAnswers(next);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-amber-500 font-medium">300자 이상 작성해주세요. 내용이 구체적일수록 조사 품질이 높아집니다.</p>
                    <div className={`rounded-xl border overflow-hidden transition-all ${
                      errProduct ? "border-red-300" : "border-slate-200 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-400/20"
                    }`}>
                      <textarea
                        className="w-full h-44 px-4 pt-4 text-sm text-slate-800 placeholder:text-slate-300 resize-none outline-none leading-relaxed bg-white"
                        placeholder="제품의 핵심 기능, 가치, 시장 내 위치 등을 상세히 작성해주세요.&#10;&#10;예) 우리 제품은 00시장에서 ..."
                        value={productFree}
                        onChange={(e) => setProductFree(e.target.value)}
                      />
                      <div className="flex justify-end px-4 py-2 bg-slate-50 border-t border-slate-100">
                        <CharCount len={productFree.length} />
                      </div>
                    </div>
                  </div>
                )}
                {errProduct && <ErrorMsg msg="제품/서비스 정의를 입력해주세요." />}
              </div>

              {/* 시장조사 목적 */}
              <div className="px-8 py-6">
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm font-semibold text-slate-700">
                    시장조사 목적 <span className="text-red-400">*</span>
                  </label>
                  <div className="flex items-center gap-0.5 bg-slate-100 p-1 rounded-lg">
                    {(["structured", "free"] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setPurposeMode(m)}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                          purposeMode === m
                            ? "bg-white text-indigo-600 shadow-sm"
                            : "text-slate-400 hover:text-slate-600"
                        }`}
                      >
                        {m === "structured" ? "질문형" : "자유형"}
                      </button>
                    ))}
                  </div>
                </div>

                {purposeMode === "structured" ? (
                  <div className="flex flex-col gap-5">
                    <p className="text-xs text-indigo-500 font-medium -mb-1">각 항목에 최대한 상세하게 작성해주세요. 구체적일수록 AI가 더 정확한 가설을 도출합니다.</p>
                    {PURPOSE_QUESTIONS.map((q, i) => (
                      <div key={i}>
                        <p className="text-sm font-semibold text-slate-700 mb-1">{q.label}</p>
                        <p className="text-xs text-slate-400 mb-2 leading-relaxed">{q.hint}</p>
                        <textarea
                          className="w-full h-12 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-300 resize-none outline-none leading-relaxed bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all"
                          value={purposeAnswers[i]}
                          onChange={(e) => {
                            const next = [...purposeAnswers];
                            next[i] = e.target.value;
                            setPurposeAnswers(next);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-amber-500 font-medium">300자 이상 작성해주세요. 내용이 구체적일수록 조사 품질이 높아집니다.</p>
                    <div className={`rounded-xl border overflow-hidden transition-all ${
                      errPurpose ? "border-red-300" : "border-slate-200 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-400/20"
                    }`}>
                      <textarea
                        className="w-full h-44 px-4 pt-4 text-sm text-slate-800 placeholder:text-slate-300 resize-none outline-none leading-relaxed bg-white"
                        placeholder="이번 조사를 통해 무엇을 알고 싶으신가요?&#10;&#10;예) 타겟 유저의 가격 저항선, 경쟁사 대비 강점 ..."
                        value={purposeFree}
                        onChange={(e) => setPurposeFree(e.target.value)}
                      />
                      <div className="flex justify-end px-4 py-2 bg-slate-50 border-t border-slate-100">
                        <CharCount len={purposeFree.length} />
                      </div>
                    </div>
                  </div>
                )}
                {errPurpose && <ErrorMsg msg="시장조사 목적을 입력해주세요." />}
              </div>

              <div className="px-8 py-5 bg-slate-50 border-t border-slate-100">
                <button
                  onClick={handleDesign}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-500 transition-all hover:shadow-lg hover:shadow-indigo-200 active:scale-[0.99]"
                >
                  <Sparkles size={15} /> AI 설계 시작 <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            2. AI 가설 설계 중
        ══════════════════════════════════════════ */}
        {step === "hyp_designing" && (
          <div>
            <button onClick={goBack} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mb-8">
              <ArrowLeft size={15} /> 이전으로
            </button>
            <ProgressCard
              title="작성자가 작성한 정보를 바탕으로 가설을 설계 중입니다"
              subtitle={researchPurpose.slice(0, 60) + (researchPurpose.length > 60 ? "..." : "")}
              progress={progress}
              progressLabel={progressLabel}
              dots={["입력 분석", "시장 컨텍스트", "가설 도출", "검토"]}
            />
          </div>
        )}

        {/* ══════════════════════════════════════════
            3. 가설 검토
        ══════════════════════════════════════════ */}
        {step === "hyp_review" && (
          <div>
            <div className="flex items-center justify-between mb-7">
              <button onClick={goBack} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600">
                <ArrowLeft size={15} /> 이전으로
              </button>
              <div className="text-center">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">AI 생성 가설 검토</h2>
                <p className="text-xs text-slate-400 mt-0.5">조사에 사용할 가설을 선택하고 필요시 수정하세요</p>
              </div>
              <div className="inline-flex items-center gap-1.5 bg-violet-50 text-violet-600 text-xs font-semibold px-3 py-1.5 rounded-full border border-violet-100">
                <Lightbulb size={12} /> 가설 {hypothesisTexts.length}개 생성
              </div>
            </div>

            <div className="flex flex-col gap-3 mb-6">
              {hypothesisTexts.map((hyp, i) => {
                const isSelected = selectedHypotheses.has(i);
                const isEditing = editingHypIdx === i;
                return (
                  <div key={i} className={`rounded-2xl border-2 overflow-hidden bg-white shadow-sm transition-all ${
                    isSelected ? "border-violet-300" : "border-slate-100 hover:border-slate-200"
                  }`}>
                    <div
                      className="flex items-start gap-4 p-5 cursor-pointer"
                      onClick={() => {
                        setSelectedHypotheses((prev) => {
                          const next = new Set(prev);
                          next.has(i) ? next.delete(i) : next.add(i);
                          return next;
                        });
                        setEditingHypIdx(null);
                      }}
                    >
                      <div className={`w-6 h-6 rounded-lg border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                        isSelected ? "border-violet-500 bg-violet-500" : "border-slate-300"
                      }`}>
                        {isSelected && <Check size={13} className="text-white" strokeWidth={3} />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[11px] font-bold text-violet-500 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-100">
                            가설 {i + 1}
                          </span>
                          {isSelected && (
                            <span className="text-[10px] font-semibold text-violet-400">선택됨</span>
                          )}
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed">{hyp}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setHypDraft(hyp);
                          setEditingHypIdx(isEditing ? null : i);
                        }}
                        className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-violet-500 hover:bg-violet-50 transition-colors"
                      >
                        <Pencil size={13} />
                      </button>
                    </div>

                    {isEditing && (
                      <div className="border-t border-violet-100 bg-violet-50/30">
                        <textarea
                          className="w-full h-28 px-5 pt-4 text-sm text-slate-700 resize-none outline-none leading-relaxed bg-transparent"
                          value={hypDraft}
                          onChange={(e) => setHypDraft(e.target.value)}
                          autoFocus
                        />
                        <div className="flex justify-end gap-2 px-5 pb-4">
                          <button onClick={() => setEditingHypIdx(null)} className="px-3.5 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded-lg">취소</button>
                          <button
                            onClick={() => {
                              const u = [...hypothesisTexts]; u[i] = hypDraft;
                              setHypothesisTexts(u); setEditingHypIdx(null);
                            }}
                            className="px-3.5 py-1.5 text-xs font-semibold bg-violet-600 text-white rounded-lg hover:bg-violet-500"
                          >저장</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 선택 카운트 + 버튼 */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {selectedHypotheses.size}개 가설 선택됨
                </p>
                <p className="text-xs text-slate-400 mt-0.5">선택한 가설을 기반으로 설문을 생성합니다</p>
              </div>
              <button
                onClick={handleSurveyDesign}
                disabled={selectedHypotheses.size === 0}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-500 transition-all hover:shadow-lg hover:shadow-indigo-200 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Wand2 size={15} /> AI 설문 생성 <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            4. AI 설문 생성 중
        ══════════════════════════════════════════ */}
        {step === "survey_designing" && (
          <div>
            <button onClick={goBack} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mb-8">
              <ArrowLeft size={15} /> 이전으로
            </button>
            <ProgressCard
              title="가성을 바탕으로 설문을 생성 중입니다"
              subtitle={`${selectedHypotheses.size}개 가설 기반으로 설문 문항을 구성하고 있습니다`}
              progress={progress}
              progressLabel={progressLabel}
              dots={["가설 분석", "문항 구성", "옵션 생성", "최종 검토"]}
            />
          </div>
        )}

        {/* ══════════════════════════════════════════
            5. 설문 검토
        ══════════════════════════════════════════ */}
        {step === "survey_review" && (
          <div>
            <div className="flex items-center justify-between mb-7">
              <button onClick={goBack} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600">
                <ArrowLeft size={15} /> 이전으로
              </button>
              <div className="text-center">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">AI 생성 설문 검토</h2>
                <p className="text-xs text-slate-400 mt-0.5">문항을 확인하고 필요시 수정하세요</p>
              </div>
              <div className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-600 text-xs font-semibold px-3 py-1.5 rounded-full border border-indigo-100">
                <ListChecks size={12} /> {surveyQuestions.length}문항 생성
              </div>
            </div>

            <div className="grid grid-cols-5 gap-5 items-start">
              {/* 왼쪽: 선택된 가설 요약 */}
              <div className="col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden sticky top-20">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2 bg-gradient-to-r from-violet-50/60 to-white">
                  <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
                    <Lightbulb size={13} className="text-violet-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800">선택된 가설</h3>
                  <span className="ml-auto text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{selectedHypotheses.size}개</span>
                </div>
                <div className="p-4 flex flex-col gap-2.5">
                  {[...selectedHypotheses].sort().map((i) => (
                    <div key={i} className="flex items-start gap-2.5 p-3 bg-violet-50/60 rounded-xl border border-violet-100">
                      <span className="text-[10px] font-bold text-violet-500 bg-violet-100 px-1.5 py-0.5 rounded mt-0.5 flex-shrink-0">H{i + 1}</span>
                      <p className="text-xs text-slate-700 leading-relaxed">{hypothesisTexts[i]}</p>
                    </div>
                  ))}
                </div>
                {/* 업로드 */}
                <div className="px-4 pb-4">
                  <p className="text-xs font-semibold text-slate-500 mb-2">설문지 직접 업로드 <span className="font-normal text-slate-400">(선택)</span></p>
                  <input ref={pdfInputRef} type="file" accept=".pdf" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) setUploadedPdf(f.name); }} />
                  {uploadedPdf ? (
                    <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <FileText size={13} className="text-emerald-500 flex-shrink-0" />
                      <span className="text-xs text-emerald-700 font-medium flex-1 truncate">{uploadedPdf}</span>
                      <button onClick={() => { setUploadedPdf(null); if (pdfInputRef.current) pdfInputRef.current.value = ""; }}>
                        <X size={13} className="text-emerald-400 hover:text-emerald-600" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => pdfInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 text-xs hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50/40 transition-all"
                    >
                      <Upload size={13} /> PDF 설문지 업로드
                    </button>
                  )}
                </div>
              </div>

              {/* 오른쪽: 설문 문항 */}
              <div className="col-span-3 flex flex-col gap-3">
                {surveyQuestions.map((q, i) => {
                  const isEditingQ = editingQIdx === i;
                  const isExpanded = expandedQIdx.has(i);
                  const canExpand = hasOptions(q);

                  return (
                    <div key={i} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
                      isEditingQ ? "border-indigo-200" : "border-slate-200 hover:border-slate-300"
                    }`}>
                      {/* 문항 헤더 */}
                      <div className="flex items-start gap-3 px-5 py-4">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-sm font-semibold text-slate-800">{q.title}</span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              q.type === "객관식" || q.type === "복수선택"
                                ? "bg-indigo-50 text-indigo-600 border border-indigo-100"
                                : q.type.includes("리커트")
                                ? "bg-amber-50 text-amber-600 border border-amber-100"
                                : "bg-slate-100 text-slate-500"
                            }`}>{q.type}</span>
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed">{q.question}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {canExpand && (
                            <button
                              onClick={() => toggleExpand(i)}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                                isExpanded ? "bg-indigo-50 text-indigo-500" : "text-slate-300 hover:text-indigo-500 hover:bg-indigo-50"
                              }`}
                              title="보기 항목"
                            >
                              <ChevronDown size={14} className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (isEditingQ) { setEditingQIdx(null); }
                              else { setQDraft({ title: q.title, question: q.question, type: q.type }); setEditingQIdx(i); }
                            }}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 transition-colors"
                          >
                            {isEditingQ ? <X size={13} /> : <Pencil size={13} />}
                          </button>
                        </div>
                      </div>

                      {/* 객관식 보기 항목 */}
                      {isExpanded && canExpand && (
                        <div className="px-5 pb-4 border-t border-slate-50">
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-3 mb-2">보기 항목</p>
                          <div className="flex flex-col gap-1.5">
                            {q.options.map((opt, oi) => (
                              <div key={oi} className="flex items-center gap-2.5 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
                                <span className="w-5 h-5 rounded-full bg-white border border-slate-200 text-[10px] font-bold text-slate-400 flex items-center justify-center flex-shrink-0">
                                  {oi + 1}
                                </span>
                                <span className="text-xs text-slate-700">{opt}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 편집 폼 */}
                      {isEditingQ && (
                        <div className="px-5 pb-4 border-t border-indigo-50 bg-indigo-50/20 flex flex-col gap-2 pt-4">
                          <input
                            className="w-full px-3 py-2 text-sm bg-white border border-indigo-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-400/30"
                            placeholder="제목"
                            value={qDraft.title ?? ""}
                            onChange={(e) => setQDraft((d) => ({ ...d, title: e.target.value }))}
                            autoFocus
                          />
                          <textarea
                            className="w-full h-20 px-3 py-2.5 text-sm bg-white border border-indigo-200 rounded-lg resize-none outline-none focus:ring-2 focus:ring-indigo-400/30 leading-relaxed"
                            placeholder="질문 내용"
                            value={qDraft.question ?? ""}
                            onChange={(e) => setQDraft((d) => ({ ...d, question: e.target.value }))}
                          />
                          <div className="flex items-center gap-2">
                            <select
                              value={qDraft.type ?? ""}
                              onChange={(e) => setQDraft((d) => ({ ...d, type: e.target.value }))}
                              className="flex-1 appearance-none bg-white border border-indigo-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-none"
                            >
                              {QUESTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <button onClick={() => setEditingQIdx(null)} className="px-3 py-2 text-xs text-slate-500 hover:bg-slate-100 rounded-lg border border-slate-200 bg-white">취소</button>
                            <button
                              onClick={() => {
                                setSurveyQuestions((prev) => prev.map((sq, si) => si === i ? { ...sq, ...qDraft } as ApiQuestion : sq));
                                setEditingQIdx(null);
                              }}
                              className="px-3 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-500"
                            >저장</button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                <button
                  onClick={() => setStep("result")}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-500 transition-all hover:shadow-lg hover:shadow-indigo-200 active:scale-[0.99] mt-2"
                >
                  요약 보기 <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            6. 요약 — 지금까지 진행한 설계 과정을 한눈에
        ══════════════════════════════════════════ */}
        {step === "result" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <button onClick={goBack} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600">
                <ArrowLeft size={15} /> 이전으로
              </button>
              <div className="text-center">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">조사 설계 요약</h2>
                <p className="text-xs text-slate-400 mt-0.5">{industry || "산업 미지정"}</p>
              </div>
              <div className="inline-flex items-center gap-1.5 bg-indigo-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-md shadow-indigo-200">
                <Sparkles size={11} /> 설계 완료
              </div>
            </div>

            {/* KPI */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              {[
                { icon: <Target size={18} />, label: "거래방식", value: tradeType || "—", accent: "indigo" },
                { icon: <Target size={18} />, label: "산업 분류", value: industry ? industry.split(".")[0] : "—", accent: "violet" },
                { icon: <Lightbulb size={18} />, label: "선택 가설", value: `${selectedHypotheses.size}개`, accent: "sky" },
                { icon: <FileText size={18} />, label: "설문 문항", value: `${surveyQuestions.length}개`, accent: "emerald" },
              ].map((k) => (
                <div key={k.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${k.accent}-50 text-${k.accent}-500 flex-shrink-0`}>
                    {k.icon}
                  </div>
                  <div>
                    <div className="text-xl font-bold text-slate-900">{k.value}</div>
                    <div className="text-xs text-slate-400 font-medium">{k.label}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-5">
              {/* 1. 질문 입력 */}
              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-bold flex items-center justify-center">1</span>
                  <MessageSquare size={14} className="text-indigo-500" />
                  <h3 className="text-sm font-semibold text-slate-800">질문 입력</h3>
                </div>
                <div className="p-5 grid grid-cols-2 gap-x-6 gap-y-4">
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 mb-1">거래방식</p>
                    <p className="text-sm text-slate-700">
                      {tradeType
                        ? `${tradeType} (${TRADE_TYPES.find((t) => t.code === tradeType)?.en ?? ""})`
                        : "미선택"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 mb-1">산업 분류</p>
                    <p className="text-sm text-slate-700">{industry || "미선택"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[11px] font-semibold text-slate-400 mb-1">업로드 설문지</p>
                    <p className={`text-sm ${uploadedPdf ? "text-emerald-600 font-medium" : "text-slate-400"}`}>
                      {uploadedPdf ?? "없음"}
                    </p>
                  </div>
                  {productDef && (
                    <div className="col-span-2">
                      <p className="text-[11px] font-semibold text-slate-400 mb-1">제품 / 서비스 정의</p>
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{productDef}</p>
                    </div>
                  )}
                  {researchPurpose && (
                    <div className="col-span-2">
                      <p className="text-[11px] font-semibold text-slate-400 mb-1">시장조사 목적</p>
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{researchPurpose}</p>
                    </div>
                  )}
                </div>
              </section>

              {/* 2. 가설 */}
              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 text-[11px] font-bold flex items-center justify-center">2</span>
                  <Lightbulb size={14} className="text-violet-500" />
                  <h3 className="text-sm font-semibold text-slate-800">선택된 가설</h3>
                  <span className="ml-auto text-[11px] text-slate-400">{selectedHypotheses.size}개 / 총 {hypothesisTexts.length}개</span>
                </div>
                <div className="p-4 flex flex-col gap-2.5">
                  {selectedHypotheses.size === 0 ? (
                    <p className="text-xs text-slate-400 px-2 py-3">선택된 가설이 없습니다.</p>
                  ) : (
                    [...selectedHypotheses].sort((a, b) => a - b).map((i) => (
                      <div key={i} className="flex items-start gap-2.5 p-3 bg-violet-50/60 rounded-xl border border-violet-100">
                        <span className="text-[10px] font-bold text-violet-500 bg-violet-100 px-1.5 py-0.5 rounded mt-0.5 flex-shrink-0">H{i + 1}</span>
                        <p className="text-xs text-slate-700 leading-relaxed">{hypothesisTexts[i]}</p>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* 3. 설문 문항 */}
              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-bold flex items-center justify-center">3</span>
                  <FileText size={14} className="text-emerald-500" />
                  <h3 className="text-sm font-semibold text-slate-800">설문 문항</h3>
                  <span className="ml-auto text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{surveyQuestions.length}개</span>
                </div>
                <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
                  {surveyQuestions.length === 0 ? (
                    <p className="text-xs text-slate-400 px-5 py-4">생성된 설문 문항이 없습니다.</p>
                  ) : (
                    surveyQuestions.map((q, i) => (
                      <div key={i} className="flex items-start gap-4 px-5 py-3.5 hover:bg-slate-50/60">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-800 font-medium">{q.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{q.question}</p>
                          {q.options && q.options.length > 0 && (
                            <ul className="mt-2 flex flex-wrap gap-1.5">
                              {q.options.map((opt, oi) => (
                                <li key={oi} className="text-[11px] text-slate-500 bg-slate-100 rounded px-2 py-0.5">
                                  {opt}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full flex-shrink-0">{q.type}</span>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* 실행 */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">설계가 완료되었습니다</p>
                  <p className="text-xs text-slate-400 mt-0.5">위 요약을 바탕으로 가상 인구 대상 조사를 실행할 수 있습니다</p>
                </div>
                <button
                  onClick={() => setContactOpen(true)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-500 transition-all hover:shadow-lg hover:shadow-indigo-200"
                >
                  <Users size={15} /> 조사 실행하기 (문의 하기) <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <ContactDialog
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        title="조사 실행 문의"
        subtitle="설계한 조사를 가상 인구 대상으로 실행하려면 담당자에게 문의해주세요."
        prefill={[
          `거래방식: ${tradeType || "미선택"}`,
          `산업 분류: ${industry || "미선택"}`,
          `선택 가설 수: ${selectedHypotheses.size}개 / 총 ${hypothesisTexts.length}개`,
          `설문 문항 수: ${surveyQuestions.length}개`,
          uploadedPdf ? `업로드 설문지: ${uploadedPdf}` : null,
          productDef ? `\n[제품/서비스 정의]\n${productDef}` : null,
          researchPurpose ? `\n[시장조사 목적]\n${researchPurpose}` : null,
          selectedHypotheses.size > 0
            ? `\n[선택 가설]\n${[...selectedHypotheses].sort((a, b) => a - b).map((i) => `- H${i + 1}: ${hypothesisTexts[i]}`).join("\n")}`
            : null,
        ].filter(Boolean).join("\n")}
      />
    </div>
  );
}
