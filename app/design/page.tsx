"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Sparkles, ArrowRight, ArrowLeft, MessageSquare,
  Clock, Check, Pencil, Upload, FileText,
  X, BarChart2, Target, Lightbulb, Trash2, Plus,
  AlertCircle, Wand2, ListChecks, Users, Save, RefreshCw,
  SlidersHorizontal, MapPin, Repeat, Lock, Send, MessageCircle, Info,
  LayoutDashboard, ImagePlus, PieChart,
  Download, CreditCard,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import ContactDialog from "@/components/ContactDialog";
import RequireAuth from "@/components/RequireAuth";
import {
  getMySubscription,
  panelProductKey,
  getOrder,
  getReportAccessJobs,
  type Subscription,
} from "@/lib/payments-api";
import CheckoutDialog from "@/components/CheckoutDialog";
import PaymentPendingDialog, { canOpenCheckout } from "@/components/PaymentPendingDialog";
import QuestionResultCard from "@/components/QuestionResultCard";
import InfographicCard from "@/components/InfographicCard";
import TechCopyCard from "@/components/TechCopyCard";
import { trackEvent } from "@/lib/analytics";
import SocialTwinLoader from "@/components/SocialTwinLoader";
import AttachmentSection, { type SurveyAttachment } from "@/components/AttachmentSection";
import { getAccessToken, getCachedUser } from "@/lib/auth-api";
import {
  createDraft as apiCreateDraft,
  updateDraft as apiUpdateDraft,
  getDraft as apiGetDraft,
  getMyDesign as apiGetMyDesign,
  generateHypotheses,
  generateQuestions,
  runSurvey as apiRunSurvey,
  askPanel,
  getDetailStatus,
  startDetail,
  downloadRawCsv,
  downloadReportPdf,
  getSurveyStatus,
  getSurveyResults,
  getReportExempt,
  claimReportJob,
  redeemPendingReportToken,
  FREE_REPORT_PASS_KEY,
  downloadSummaryPdf,
  type SurveyDraftPatch,
  type InfographicSummary,
  type SurveyResult,
  type SurveyReport,
} from "@/lib/survey-api";

/* ─────────────────────────────────────────
   타입
───────────────────────────────────────── */
type Step =
  | "input"
  | "hyp_designing"
  | "hyp_review"
  | "survey_designing"
  | "survey_review"
  | "panel"
  | "result"
  | "survey_running"
  | "survey_result";

type ApiQuestion = {
  type: string;
  title: string;
  question: string;
  options: string[];
  image?: string | null; // 문항 첨부 이미지(data:URL). 실행 시 GPT 비전으로 함께 평가
};

/** 이미지 파일 → base64 data:URL */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

/* ─────────────────────────────────────────
   상수
───────────────────────────────────────── */
const TRADE_TYPES: { code: string; en: string; ko: string; desc: string; icon: string }[] = [
  { code: "B2C", en: "Business-to-Consumer", ko: "기업 → 소비자", desc: "일반 소비자에게 직접 판매", icon: "🛍️" },
  { code: "B2B", en: "Business-to-Business", ko: "기업 → 기업", desc: "다른 기업에 납품·판매", icon: "🏢" },
  { code: "B2G", en: "Business-to-Government", ko: "기업 → 정부·공공", desc: "정부·공공기관에 납품", icon: "🏛️" },
  { code: "기타", en: "Others", ko: "그외 거래방식 혹은 해당없음", desc: "C2C·D2C·B2B2C 등", icon: "🧩" },
];

const QUESTION_TYPES = ["객관식", "복수선택", "리커트 5점", "리커트 7점", "순위형", "주관식"];

/* ── 패널 설정 ──────────────────────────────────────────
   축·라벨은 관리자 설문설계 "4. 실행 설정"과 동일하게 맞춘다
   (frontend/src/pages/Survey.tsx 의 FILTER_OPTIONS / SIDO_OPTIONS).
   가상인구 CSV의 실제 분류이므로 임의로 늘리면 매칭이 실패한다. */
const SIDO_OPTIONS = [
  "전국", "서울특별시", "부산광역시", "대구광역시", "인천광역시", "광주광역시",
  "대전광역시", "울산광역시", "세종특별자치시", "경기도", "강원도", "충청북도",
  "충청남도", "전라북도", "전라남도", "경상북도", "경상남도", "제주특별자치도",
];

const PANEL_AXES = [
  { key: "genders", label: "성별", options: ["남자", "여자"] },
  { key: "age_bands", label: "연령대", options: ["10대 이하", "20대", "30대", "40대", "50대", "60대", "70대 이상"] },
  { key: "economic_activities", label: "경제활동", options: ["경제활동", "비경제활동"] },
  { key: "education_levels", label: "교육정도", options: ["중졸이하", "고졸", "대졸이상"] },
  { key: "income_levels", label: "가구소득", options: ["200만원 미만", "200~400만원", "400~600만원", "600만원 이상"] },
] as const;
type AxisKey = (typeof PANEL_AXES)[number]["key"];

/** 상세보고서 무료 제공(이메일 목록·무료 쿠폰) 대상자의 조사 패널 수 — 유료 스탠다드와 동일. */
const FREE_PROVISION_PANEL_SIZE = 100;

/** 결제 상품 key → 패널 수 (백엔드 PANEL_PRODUCT_BY_SIZE 의 역매핑). */
const PANEL_SIZE_BY_PRODUCT: Record<string, number> = { survey_100: 100, survey_500: 500 };

/* 패널 수 — 요금제와 1:1. 월정액 구독자는 100명으로 고정된다. */
const PANEL_SIZES = [
  { size: 10, name: "무료 체험", price: "무료", desc: "결제 없이 전체 흐름을 확인해보세요." },
  { size: 100, name: "스탠다드", price: "99,000원", desc: "의사결정에 바로 쓰는 표준 조사 1건.", note: "건당 · 부가세 포함" },
  { size: 500, name: "프로", price: "300,000원", desc: "표본을 키워 세부 집단까지 나눠 봅니다.", note: "건당 · 부가세 포함" },
] as const;

const STEPS: Step[] = ["input", "hyp_designing", "hyp_review", "survey_designing", "survey_review", "panel", "result", "survey_running", "survey_result"];
// 단계별 기술 카피(참고용/SocialTwin_단계별_기술카피_최종.md) 매핑 — design 8단계
const STEP_TO_NUM: Record<Step, number> = {
  input: 1, hyp_designing: 2, hyp_review: 3, survey_designing: 4,
  // 패널 설정은 '가상인구 응답자' 카피(7)를 재사용한다.
  survey_review: 5, panel: 7, result: 6, survey_running: 7, survey_result: 8,
};
const STEP_LABELS = ["질문 입력", "가설 설계", "가설 검토", "설문 생성", "설문 검토", "패널 설정", "최종 검토", "설문 진행", "결과"];
const STEP_ICONS = [MessageSquare, Sparkles, Lightbulb, Wand2, ListChecks, SlidersHorizontal, BarChart2, Users, PieChart];

const BACK_MAP: Partial<Record<Step, Step>> = {
  hyp_designing: "input",
  hyp_review: "input",
  survey_designing: "hyp_review",
  survey_review: "hyp_review",
  panel: "survey_review",
  result: "panel",
  survey_running: "result",
  survey_result: "result",
};

const PRODUCT_QUESTIONS = [
  {
    tag: "[대상]",
    label: "1. [대상] 이 제품(서비스)은 정확히 '누구'의 문제를 해결합니까?",
    hint: "단순한 인구통계학적 구분을 넘어, 어떤 상황에 처해 있거나 어떤 고충(Pain Point)을 겪고 있는 사람인지 정의합니다.",
  },
  {
    tag: "[본질]",
    label: "2. [본질] 고객이 겪고 있는 문제 중 '어떤 핵심적인 어려움'을 해결합니까?",
    hint: "제공자가 생각하는 기능 중심이 아니라, 고객이 느끼는 가장 가렵고 아픈 부분이 무엇인지에 집중하여 정의합니다.",
  },
  {
    tag: "[방법]",
    label: "3. [방법] 그 문제를 해결하기 위한 '결정적인 솔루션'은 무엇입니까?",
    hint: "기술적 메커니즘이나 서비스의 핵심 프로세스를 설명합니다. 어떤 방식으로 고객의 문제를 해소하는지 정의합니다.",
  },
  {
    tag: "[차별화]",
    label: "4. [차별화] 기존의 대안(경쟁사 혹은 관습)들과 비교했을 때 무엇이 '다릅니까'?",
    hint: "왜 고객이 다른 서비스가 아닌 이 제품을 선택해야 하는지, 우리만의 독보적인 강점이나 차별적 접근법을 정의합니다.",
  },
  {
    tag: "[결과]",
    label: "5. [결과] 고객이 이 서비스를 이용한 후 얻게 되는 '최종적인 변화'는 무엇입니까?",
    hint: "단순한 결과물이 아니라, 고객의 삶이나 업무 효율성, 감정적 만족도 등에서 일어나는 실질적인 변화(Before & After)를 정의합니다.",
  },
];

const PURPOSE_QUESTIONS = [
  {
    tag: "[조사 목적]",
    label: "1. [조사 목적] 이번 시장조사를 통해 의사결정을 내려야 하는 '당면 과제'는 무엇입니까?",
    hint: "신제품 출시 여부, 가격 책정, 브랜드 인지도 파악 등 조사가 끝난 후 즉시 실행에 옮겨야 할 구체적인 목표를 확인합니다.",
  },
  {
    tag: "[가설 검증]",
    label: "2. [가설 검증] 현재 내부적으로 추측하고 있는 '가장 핵심적인 가설'은 무엇입니까?",
    hint: "\"우리의 주 고객은 30대일 것이다\" 혹은 \"기존 제품의 가격이 비싸서 안 팔릴 것이다\"와 같이, 맞는지 틀린지 확인하고 싶은 전제를 파악합니다.",
  },
  {
    tag: "[타겟 상세]",
    label: "3. [타겟 상세] 어떤 특성을 가진 사람들에게 질문했을 때 가장 '신뢰할 만한 답변'을 얻을 수 있습니까?",
    hint: "단순 연령/성별을 넘어 실제 사용자, 잠재 고객, 혹은 경쟁사 이용자 등 응답자의 조건(Screening)을 구체화합니다.",
  },
  {
    tag: "[핵심 지표]",
    label: "4. [핵심 지표] 조사 결과에서 가장 먼저 확인하고 싶은 '핵심 수치'는 무엇입니까?",
    hint: "예) '제품을 사겠다고 답한 응답자 비율', '적정 가격이라 답한 가격대의 평균', '경쟁사 대비 만족도 점수'. 의사결정의 근거가 될 단 하나의 숫자/지표를 적어주세요.",
  },
  {
    tag: "[활용 계획]",
    label: "5. [활용 계획] 조사 결과가 나온 뒤, 이 데이터를 어떤 '목적'으로 활용하실 예정입니까?",
    hint: "마케팅 캠페인 전략 수립, 투자 유치용 IR 자료, 제품 기능 개선 등 활용처에 따라 설문의 톤앤매너와 분석의 깊이를 조절하기 위함입니다.",
  },
];

/* ─────────────────────────────────────────
   StepBar
───────────────────────────────────────── */
function StepBar({
  step,
  onJump,
  isStepAvailable,
  isLoggedIn,
  onDashboardBlocked,
}: {
  step: Step;
  onJump: (s: Step) => void;
  isStepAvailable: (s: Step) => boolean;
  isLoggedIn: boolean;
  onDashboardBlocked: () => void;
}) {
  const idx = STEPS.indexOf(step);
  const activeLabel = STEP_LABELS[idx];
  return (
    <div className="mb-6 sm:mb-10">
      {/* 모바일 전용 — 현재 단계 배지 (라벨 숨김 대신 정보 제공) */}
      <div className="sm:hidden flex justify-center mb-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100">
          <span className="text-[11px] font-bold text-indigo-600">{activeLabel}</span>
          <span className="text-[10px] text-indigo-400 tabular-nums">{idx + 1}/{STEP_LABELS.length}</span>
        </div>
      </div>

      <div className="flex justify-center">
        <div className="inline-flex flex-col">
        <div className="flex items-center justify-center">
        {/* 대시보드(외부 이동) — 로그인 시에만 접근 가능. 비로그인은 안내 후 차단 */}
        <div className="flex items-center">
          {isLoggedIn ? (
            <Link
              href="/dashboard/user"
              className="flex flex-col items-center gap-1.5 group cursor-pointer"
              title="내 대시보드로 이동"
            >
              <div className="w-7 sm:w-9 h-7 sm:h-9 rounded-full flex items-center justify-center bg-white border-2 border-indigo-300 ring-2 ring-indigo-100 ring-offset-2 ring-offset-slate-50 transition-all group-hover:scale-110 group-hover:ring-indigo-400 group-hover:bg-indigo-50">
                <LayoutDashboard className="text-indigo-500 w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </div>
              <span className="hidden sm:inline text-[10px] font-semibold tracking-wide whitespace-nowrap text-indigo-500 group-hover:underline underline-offset-4">대시보드</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={onDashboardBlocked}
              className="flex flex-col items-center gap-1.5 group cursor-pointer"
              title="대시보드는 로그인 후 이용할 수 있습니다"
              aria-label="대시보드 (로그인 필요)"
            >
              <div className="w-7 sm:w-9 h-7 sm:h-9 rounded-full flex items-center justify-center bg-white border-2 border-slate-300 ring-2 ring-slate-100 ring-offset-2 ring-offset-slate-50 transition-all group-hover:scale-110 group-hover:border-slate-400">
                <LayoutDashboard className="text-slate-400 w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </div>
              <span className="hidden sm:inline text-[10px] font-semibold tracking-wide whitespace-nowrap text-slate-400 group-hover:underline underline-offset-4">대시보드</span>
            </button>
          )}
          <div className="w-2.5 sm:w-12 h-0.5 mb-0 sm:mb-5 mx-0.5 sm:mx-1.5 rounded-full bg-slate-200" />
        </div>

        {STEP_LABELS.map((label, i) => {
          const Icon = STEP_ICONS[i];
          const done = i < idx;
          const active = i === idx;
          const targetStep = STEPS[i];
          const canJump = !active && isStepAvailable(targetStep);
          // 모바일에선 자동/로딩 단계(가설 설계·설문 생성·설문 진행)를 숨겨 5단계만 노출
          const mobileHidden = targetStep === "hyp_designing" || targetStep === "survey_designing" || targetStep === "survey_running";

          // 색/링 결정
          let circleCls = "";
          if (active) {
            circleCls = "bg-indigo-600 shadow-lg shadow-indigo-300 ring-4 ring-indigo-100";
          } else if (canJump) {
            // 클릭 가능: 인디고 + 항상 보이는 외곽 ring
            circleCls = done
              ? "bg-indigo-600 shadow-md shadow-indigo-200 ring-2 ring-indigo-200 ring-offset-2 ring-offset-slate-50"
              : "bg-white border-2 border-indigo-300 ring-2 ring-indigo-100 ring-offset-2 ring-offset-slate-50";
          } else if (done) {
            // 클릭 불가 + 이미 지나간 단계(가설설계·설문생성 등 로딩 전환): 슬레이트 톤 + 흐림
            circleCls = "bg-slate-300 opacity-60";
          } else {
            circleCls = "bg-white border-2 border-slate-200";
          }

          const circle = (
            <div className={`w-7 sm:w-9 h-7 sm:h-9 rounded-full flex items-center justify-center transition-all duration-300 ${circleCls} ${canJump ? "group-hover:scale-110 group-hover:ring-indigo-400 group-hover:shadow-lg" : ""}`}>
              {done
                ? <Check className={`text-white w-3 h-3 sm:w-3.5 sm:h-3.5 ${!canJump ? "opacity-80" : ""}`} strokeWidth={2.5} />
                : <Icon className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${active ? "text-white" : canJump ? "text-indigo-500" : "text-slate-400"}`} />
              }
            </div>
          );

          // 라벨 색상
          let labelCls = "text-slate-400";
          if (active) labelCls = "text-indigo-600";
          else if (canJump) labelCls = "text-indigo-500";
          else if (done) labelCls = "text-slate-400 opacity-70";

          // 라벨은 모바일에서 숨김 — 위쪽 배지가 활성 단계를 안내함
          const labelEl = (
            <span className={`hidden sm:inline text-[10px] font-semibold tracking-wide whitespace-nowrap ${labelCls} ${canJump ? "group-hover:underline underline-offset-4 group-hover:text-indigo-700" : ""}`}>{label}</span>
          );

          return (
            <div key={label} className={`${mobileHidden ? "hidden sm:flex" : "flex"} items-center`}>
              {canJump ? (
                <button
                  type="button"
                  onClick={() => onJump(targetStep)}
                  className="flex flex-col items-center gap-1.5 group focus:outline-none cursor-pointer"
                  title={`${label}(으)로 이동`}
                >
                  {circle}
                  {labelEl}
                </button>
              ) : (
                <div
                  className="flex flex-col items-center gap-1.5"
                  title={active ? `현재 단계: ${label}` : done ? `${label} (이동할 수 없는 단계)` : `${label} (아직 도달하지 않은 단계)`}
                >
                  {circle}
                  {labelEl}
                </div>
              )}
              {i < STEP_LABELS.length - 1 && (
                <div className={`w-2.5 sm:w-12 h-0.5 mb-0 sm:mb-5 mx-0.5 sm:mx-1.5 rounded-full transition-all duration-300 ${
                  i < idx ? "bg-indigo-400" : "bg-slate-200"
                }`} />
              )}
            </div>
          );
        })}
        </div>

        {/* 프로세스 안내 — 대시보드 노드 기준 왼쪽 정렬 */}
        <p className="mt-4 text-left text-[11px] sm:text-xs text-slate-400 break-keep">
          하단의 임시저장 버튼을 클릭하시면 자동저장 되며, 저장 후에는 네비게이션으로 이동 가능합니다.
        </p>
        </div>
      </div>
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

// 각 주제(제품/서비스, 시장조사 목적)에 요구하는 최소 작성 글자수.
const MIN_CHARS = 300;

// 글자 수는 충분하나 의미 없는 입력(문자 도배·같은 단어 반복·같은 구절 반복
// 붙여넣기·완성되지 않은 자모/기호 나열 등)을 걸러낸다.
// 문제가 있으면 사유 문구를, 정상이면 null을 반환한다.
function contentIssue(text: string): string | null {
  const raw = text.trim();
  const compact = raw.replace(/\s+/g, "");
  const len = compact.length;
  if (len < 30) return null; // 짧은 입력은 글자 수 검증이 담당

  // 1) 동일 문자 장기 반복: ㅁㅁㅁㅁ…, aaaaaaaaa, ……
  if (/(.)\1{9,}/u.test(raw)) return "같은 문자를 여러 번 반복해서 입력하신 것 같습니다.";

  // 2) 문자 다양성 부족: 소수의 문자로만 채워 넣음
  const uniqChars = new Set(compact).size;
  if (uniqChars / len < 0.12) return "같은 문자를 반복하거나 붙여넣어 채우신 것 같습니다.";

  // 3) 같은 구절 반복 붙여넣기: 이중 문자열 기법으로 최소 반복 주기 탐지
  if ((compact + compact).indexOf(compact, 1) < compact.length) {
    return "같은 내용을 반복해서 붙여넣으신 것 같습니다.";
  }

  // 4) 단어 반복: 동일 단어가 과도하게 반복되거나 연속됨
  const words = raw.split(/\s+/).filter((w) => w.length > 0);
  if (words.length >= 8) {
    const uniqWords = new Set(words).size;
    if (uniqWords / words.length < 0.3) return "같은 단어를 반복해서 입력하신 것 같습니다.";
    let run = 1;
    let maxRun = 1;
    for (let i = 1; i < words.length; i++) {
      run = words[i] === words[i - 1] ? run + 1 : 1;
      if (run > maxRun) maxRun = run;
    }
    if (maxRun >= 6) return "같은 단어를 연속해서 입력하신 것 같습니다.";
  }

  // 5) 의미를 알기 어려운 글자·기호 나열 (예: ㅁㄴㅇㄹ, ㅋㅋㅋ, !!!!, 특수문자 도배)
  const meaningful = (raw.match(/[가-힣a-zA-Z0-9]/g) || []).length; // 완성형 한글·영문·숫자
  const jamo = (raw.match(/[ㄱ-ㅣ]/g) || []).length; // 홑자음·홑모음 ㄱ-ㅣ
  if (meaningful / len < 0.55) return "의미를 알기 어려운 글자·기호가 많습니다.";
  if (jamo / len > 0.3) return "완성되지 않은 자음·모음이 많습니다.";

  return null;
}

// 주제별 입력 상태를 하나의 안내 문구로 변환한다. 정상이면 null.
function fieldErrorMsg(topic: string, len: number, text: string): string | null {
  if (len < MIN_CHARS) {
    if (len === 0) return `${topic}을(를) 입력해주세요.`;
    return `글자 수가 부족합니다. 설문의 정확성을 높이기 위해 자세한 작성을 부탁드립니다. (현재 ${len}자 / 최소 ${MIN_CHARS}자)`;
  }
  const issue = contentIssue(text);
  if (issue) return `${issue} 설문의 정확성을 높이기 위해 의미 있는 내용으로 수정 부탁드립니다.`;
  return null;
}

/* ─────────────────────────────────────────
   메인 페이지
───────────────────────────────────────── */
// 조사 설계는 로그인 필수 — URL 직접 진입도 /login?next=/design 으로 보낸다.
// (RequireAuth 는 네비 훅을 쓰지 않으므로 Suspense 바깥에 둘 수 있다.)
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftIdFromUrl = searchParams.get("draft");
  const designIdFromUrl = searchParams.get("design");

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // 입력
  const [tradeType, setTradeType] = useState("");
  const tradeTypeRef = useRef<HTMLDivElement>(null); // 미선택 검증 실패 시 스크롤 이동용
  // 거래방식-조사목적 불일치 경고 (예: 목적은 B2B인데 B2C 선택) — 1회 경고 후 재클릭 시 진행
  const [tradeMismatchWarning, setTradeMismatchWarning] = useState("");
  const tradeMismatchAck = useRef(false);
  // 실행 시점 불일치 경고 (저장된 설계를 다시 실행하는 경로 — 설계 시 경고를 못 본 경우)
  const runMismatchAck = useRef(false);

  /** 정의·목적에 기업/기관 대상 신호가 있는데 거래방식이 B2C/기타면 감지된 키워드 반환 */
  function detectTradeMismatch(): string | null {
    if (tradeType !== "B2C" && tradeType !== "기타") return null;
    const text = `${productDef} ${researchPurpose}`.toLowerCase();
    const signals = ["b2b", "비투비", "기업 대상", "기업을 대상", "기업 고객", "실무자", "의사결정권자", "구매 담당", "도입 여부", "공공기관", "지자체", "관공서", "조달", "b2g"];
    return signals.find((k) => text.includes(k)) ?? null;
  }
  const [productMode, setProductMode] = useState<"structured" | "free" | null>(null);
  const [productAnswers, setProductAnswers] = useState(["", "", "", "", ""]);
  const [productFree, setProductFree] = useState("");
  const [purposeMode, setPurposeMode] = useState<"structured" | "free" | null>(null);
  const [purposeAnswers, setPurposeAnswers] = useState(["", "", "", "", ""]);
  const [purposeFree, setPurposeFree] = useState("");
  const [attachments, setAttachments] = useState<SurveyAttachment[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [apiError, setApiError] = useState("");

  // ── 임시저장 상태 ──
  const [draftId, setDraftId] = useState<number | null>(null);
  const [draftLoading, setDraftLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // 활성 모드에서 결합 텍스트 도출 (모드 미선택 시 빈 문자열)
  const productDef = productMode === "structured"
    ? productAnswers.map((a, i) => a.trim() ? `${PRODUCT_QUESTIONS[i].tag}\n${a.trim()}` : "").filter(Boolean).join("\n\n")
    : productMode === "free"
    ? productFree
    : "";

  const researchPurpose = purposeMode === "structured"
    ? purposeAnswers.map((a, i) => a.trim() ? `${PURPOSE_QUESTIONS[i].tag}\n${a.trim()}` : "").filter(Boolean).join("\n\n")
    : purposeMode === "free"
    ? purposeFree
    : "";

  // 검증용 실제 작성 글자수 (태그·구분자 제외).
  // 질문형은 각 주제의 질문 답변 합계, 자유형은 서술 본문 길이로 계산한다.
  const productLen = productMode === "structured"
    ? productAnswers.reduce((sum, a) => sum + a.trim().length, 0)
    : productMode === "free"
    ? productFree.trim().length
    : 0;
  const purposeLen = purposeMode === "structured"
    ? purposeAnswers.reduce((sum, a) => sum + a.trim().length, 0)
    : purposeMode === "free"
    ? purposeFree.trim().length
    : 0;

  // 내용 품질 검증용 순수 텍스트 (질문형은 답변만 공백으로 결합).
  const productText = productMode === "structured"
    ? productAnswers.join(" ")
    : productMode === "free"
    ? productFree
    : "";
  const purposeText = purposeMode === "structured"
    ? purposeAnswers.join(" ")
    : purposeMode === "free"
    ? purposeFree
    : "";

  // 주제별 안내 문구 (미작성·글자수 부족·의미 없는 내용 모두 포함). 정상이면 null.
  const productErr = fieldErrorMsg("제품/서비스 정의", productLen, productText);
  const purposeErr = fieldErrorMsg("시장조사 목적", purposeLen, purposeText);

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
  const [qDraft, setQDraft] = useState<Partial<ApiQuestion>>({});
  const [editAllMode, setEditAllMode] = useState(false); // 전체 문항 일괄 수정 모드
  const [uploadedPdf, setUploadedPdf] = useState<string | null>(null);

  // 문의 다이얼로그
  const [contactOpen, setContactOpen] = useState(false);
  // 상세보고서 결제 다이얼로그
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  // 요약보고서 PDF 다운로드 상태
  // 결제하기 버튼은 슈퍼유저/스태프 계정에만 노출. 일반 로그인·비로그인은 모두 숨김
  // (별도 문의로 안내). localStorage(캐시 사용자)는 마운트 후 effect에서
  // 읽어 SSR 하이드레이션 미스매치를 피한다.
  const [paymentsEnabled, setPaymentsEnabled] = useState(false);
  // 상세보고서 무료 제공(결제 생략) 대상 여부 — 관리자 전역 설정의 이메일 목록 기준
  const [reportExempt, setReportExempt] = useState(false);
  // 비로그인 상태로 무료 열람 링크를 타고 들어와 보관 중인 토큰 (로그인하면 적용됨)
  const [pendingFreeToken, setPendingFreeToken] = useState<string | null>(null);
  // 로그인 여부 — 안내문 노출 분기에 사용.
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  useEffect(() => {
    const u = getCachedUser();
    // 결제버튼 노출: 슈퍼유저/스태프 + 테스트 계정 화이트리스트(권한 없이 결제 흐름 테스트용).
    const PAYMENTS_TEST_EMAILS = ["test@tosspayments.co"];
    const email = (u?.email || "").trim().toLowerCase();
    setPaymentsEnabled(Boolean(u?.is_superuser || u?.is_staff || PAYMENTS_TEST_EMAILS.includes(email)));
    const logged = Boolean(getAccessToken() && u);
    setIsLoggedIn(logged);
    if (logged) {
      // 무료 열람 링크로 진입해 보관된 토큰이 있으면 먼저 리딤 → 그 결과 포함해 면제 확인
      redeemPendingReportToken()
        .then((redeemed) => (redeemed ? true : getReportExempt()))
        .then((exempt) => {
          setReportExempt(exempt);
          // 상세보고서 무료 제공(이메일 목록·무료 쿠폰) 대상은 100명 기준으로 조사한다
          if (exempt) setPanelSize(FREE_PROVISION_PANEL_SIZE);
        })
        .catch(() => {});
    } else {
      // 비로그인 — 링크로 들어와 보관된 토큰이 있으면 결과 단계에서 '로그인하고 무료 열람' 버튼 노출
      try {
        setPendingFreeToken(localStorage.getItem(FREE_REPORT_PASS_KEY));
      } catch { /* noop */ }
    }
  }, []);
  // 비로그인 사용자가 대시보드 노드를 누르면 안내 토스트를 띄우고 이동은 막는다.
  const [dashboardNotice, setDashboardNotice] = useState(false);
  const dashboardNoticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function handleDashboardBlocked() {
    setDashboardNotice(true);
    if (dashboardNoticeTimer.current) clearTimeout(dashboardNoticeTimer.current);
    dashboardNoticeTimer.current = setTimeout(() => setDashboardNotice(false), 3200);
  }
  useEffect(() => () => {
    if (dashboardNoticeTimer.current) clearTimeout(dashboardNoticeTimer.current);
  }, []);

  // ── 조사 실행 (8단계 결과) ──
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [designId, setDesignId] = useState<number | null>(null); // 백엔드 survey_designs 연결용
  const [runJobId, setRunJobId] = useState<string | null>(null);
  // 조사 잡이 확정되면 '그 설문에 대해' 무료인지 재판정 — 계정당 설문 1건 링크는
  // 이미 다른 설문에 썼으면 여기서 false 가 되어 버튼이 숨는다.
  useEffect(() => {
    if (isLoggedIn && runJobId) {
      getReportExempt(runJobId).then(setReportExempt).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, runJobId]);
  const [runError, setRunError] = useState("");
  const [infographic, setInfographic] = useState<InfographicSummary | null>(null);
  const [runMeta, setRunMeta] = useState<{ n: number; sido: string } | null>(null);
  // 문항별 결과(막대 그래프)·상세 보고서 — 결제 후 결과 페이지와 동일한 화면을 위해 보관
  const [surveyResults, setSurveyResults] = useState<SurveyResult[]>([]);
  const [detailReport, setDetailReport] = useState<SurveyReport | null>(null);
  const [sampleSize, setSampleSize] = useState<number | null>(null); // 로딩 화면 사람 아이콘·응답 카운터용

  /* ── 패널 설정 (설문 검토 ↔ 최종 검토 사이 단계) ──
     빈 배열 = '전체' (그 축을 제한하지 않음). 기본값은 모든 축 전체. */
  const [panelSido, setPanelSido] = useState<string[]>(["전국"]);
  const [panelAxes, setPanelAxes] = useState<Record<AxisKey, string[]>>({
    genders: [], age_bands: [], economic_activities: [], education_levels: [], income_levels: [],
  });
  const [panelSize, setPanelSize] = useState<number>(10);
  // 월정액 구독자는 패널 수가 100명으로 고정된다.
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  useEffect(() => {
    let cancelled = false;
    getMySubscription().then((v) => {
      if (cancelled) return;
      setSubscription(v);
      if (v.active) setPanelSize(v.sample_size);
    });
    return () => { cancelled = true; };
  }, []);
  const subActive = Boolean(subscription?.active);

  /* ── 조사 실행 전 결제 게이트 ──
     패널 수가 유료 구간(100·500명)이고 월정액 구독자가 아니면 결제를 먼저 받는다.
     결제 완료 후 토스 → /checkout/success → "조사 이어서 진행하기" → /design?draft=..&paid=<orderId>
     로 돌아오며, 그 주문이 실제 paid 인지 서버에 확인한 뒤에만 게이트를 연다. */
  const [panelCheckoutOpen, setPanelCheckoutOpen] = useState(false);
  // 결제 연동 준비 안내 (라이브 키 발급 전)
  const [paymentPendingOpen, setPaymentPendingOpen] = useState(false);
  const [paidProductKey, setPaidProductKey] = useState<string | null>(null);
  const [paidOrderId, setPaidOrderId] = useState<string | null>(null);
  const paidParam = searchParams.get("paid");
  useEffect(() => {
    if (!paidParam) return;
    let cancelled = false;
    getOrder(paidParam)
      .then((o) => {
        if (cancelled) return;
        if (o.status === "paid" && o.product_key) {
          setPaidProductKey(o.product_key);
          setPaidOrderId(o.order_id);
          // 결제한 상품이 곧 패널 수 — 결제 후 복귀 시 기본값(10명)으로 되돌아가지 않게 복원
          const paidSize = PANEL_SIZE_BY_PRODUCT[o.product_key];
          if (paidSize) setPanelSize(paidSize);
        }
      })
      .catch(() => { /* 조회 실패 시 게이트 유지 */ });
    return () => { cancelled = true; };
  }, [paidParam]);

  /* 서버 기준 유료 열람 권한 — 결제(주문↔조사 연결)·쿠폰·구독을 모두 반영한다.
     URL 의 ?paid 파라미터에만 의존하면 새로고침이나 재진입에서 권한이 사라진다. */
  const [reportAccess, setReportAccess] = useState<{ all: boolean; jobs: string[] }>({ all: false, jobs: [] });
  useEffect(() => {
    if (step !== "survey_result") return;
    let cancelled = false;
    getReportAccessJobs()
      .then((r) => { if (!cancelled) setReportAccess({ all: !!r.all_access, jobs: r.job_ids ?? [] }); })
      .catch(() => { /* 실패 시 기존 판정 유지 */ });
    return () => { cancelled = true; };
  }, [step, runJobId]);

  /** 유료 이용 여부 — 월정액 구독자 · 이번 조사를 결제한 경우 · 무료 제공 대상 계정.
      무료(10명) 체험에서는 패널 질문·원본자료(엑셀)가 잠긴다. */
  const paidTier =
    subActive ||
    paidProductKey != null ||
    reportExempt ||
    reportAccess.all ||
    (runJobId != null && reportAccess.jobs.includes(runJobId));

  /* ── 결과 단계: 다운로드 ── */
  const [resultDownloading, setResultDownloading] = useState<string | null>(null);
  const [resultDownloadError, setResultDownloadError] = useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  async function handleResultDownload(kind: string) {
    if (!runJobId) { setResultDownloadError("조사 작업 정보가 없어 다운로드할 수 없습니다."); return; }
    setResultDownloading(kind);
    setResultDownloadError(null);
    try {
      if (kind === "summary") { trackEvent("요약보고서_다운로드"); await downloadSummaryPdf(runJobId); }
      else if (kind === "raw") { trackEvent("원본자료_다운로드"); await downloadRawCsv(runJobId); }
      else {
        trackEvent("상세보고서_다운로드", { 경로: "조사결과" });
        // 계정당 1건 무료 쿠폰을 이 설문에 확정 (무제한 권한이면 서버가 무시)
        claimReportJob(runJobId).catch(() => { /* 권한 없으면 다운로드에서 걸러짐 */ });
        await downloadReportPdf(runJobId);
      }
    } catch (err) {
      setResultDownloadError(err instanceof Error ? err.message : "다운로드에 실패했습니다.");
    } finally {
      setResultDownloading(null);
    }
  }

  /* ── 결과 단계: 상세보고서 생성 상태 ──
     조사 실행이 끝나면 백엔드가 이어서 상세 분석을 돌린다(survey_run → _run_detail_sync).
     생성 전에는 다운로드가 409 로 거절되므로, 완료될 때까지 폴링해 버튼을 잠근다. */
  const [detailStatus, setDetailStatus] = useState<string>("idle");
  useEffect(() => {
    if (step !== "survey_result" || !runJobId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;
    const tick = async () => {
      try {
        const st = await getDetailStatus(runJobId);
        if (cancelled) return;
        setDetailStatus(st.detail_status ?? "idle");
        if (st.report) setDetailReport(st.report);
        if (st.detail_status === "done" || st.detail_status === "error") {
          if (timer) clearInterval(timer);
        }
      } catch { /* 일시 오류는 다음 폴링에서 회복 */ }
    };
    tick();
    timer = setInterval(tick, 5000);
    return () => { cancelled = true; if (timer) clearInterval(timer); };
  }, [step, runJobId]);

  /** 상세보고서 생성 시작 — 무료 체험(10명)은 자동 생성하지 않으므로 사용자가 눌러 만든다. */
  const [detailStarting, setDetailStarting] = useState(false);
  async function handleStartDetail() {
    if (!runJobId || detailStarting) return;
    setDetailStarting(true);
    setResultDownloadError(null);
    try {
      trackEvent("상세보고서_생성요청");
      const r = await startDetail(runJobId);
      setDetailStatus(r.detail_status ?? "running");
    } catch (e) {
      setResultDownloadError(e instanceof Error ? e.message : "상세보고서 생성을 시작하지 못했습니다.");
    } finally {
      setDetailStarting(false);
    }
  }

  /* ── 결과 단계: 가상인구 패널에게 질문 ── */
  const [panelMessages, setPanelMessages] = useState<{ role: "user" | "panel"; text: string }[]>([]);
  const [panelInput, setPanelInput] = useState("");
  const [panelSending, setPanelSending] = useState(false);
  const [panelError, setPanelError] = useState<string | null>(null);

  async function handleAskPanel() {
    const q = panelInput.trim();
    if (!q || panelSending || !runJobId) return;
    setPanelMessages((m) => [...m, { role: "user", text: q }]);
    setPanelInput("");
    setPanelSending(true);
    setPanelError(null);
    try {
      const { answer } = await askPanel(runJobId, q);
      setPanelMessages((m) => [...m, { role: "panel", text: answer }]);
    } catch (e) {
      setPanelError(e instanceof Error ? e.message : "답변을 받지 못했습니다.");
    } finally {
      setPanelSending(false);
    }
  }

  /** 현재 패널 수로 조사를 실행하려면 결제가 필요한가 */
  function needsPayment(): boolean {
    if (subActive) return false;                       // 월정액 — 무제한
    if (reportExempt) return false;                    // 무료 제공(이메일 목록·쿠폰) 대상
    const key = panelProductKey(panelSize);
    if (!key) return false;                            // 무료 체험(10명)
    return paidProductKey !== key;                     // 이미 결제한 상품이면 통과
  }

  /** 축의 라벨 하나를 토글. 전체 선택/해제는 setPanelAxes 로 직접 처리. */
  function toggleAxis(key: AxisKey, label: string) {
    setPanelAxes((prev) => {
      const cur = prev[key];
      const next = cur.includes(label) ? cur.filter((v) => v !== label) : [...cur, label];
      return { ...prev, [key]: next };
    });
  }

  /** 체크박스 선택 → 백엔드가 쓰는 비율맵(라벨→%). 선택 라벨에 균등 배분. */
  function buildTargetFilters(): Record<string, Record<string, number>> {
    const out: Record<string, Record<string, number>> = {};
    for (const axis of PANEL_AXES) {
      const picked = panelAxes[axis.key];
      // 전체(빈 배열)이거나 모든 라벨을 고른 경우 = 제한 없음 → 축 자체를 보내지 않는다
      if (picked.length === 0 || picked.length === axis.options.length) continue;
      const share = Math.round(100 / picked.length);
      out[axis.key] = Object.fromEntries(picked.map((l) => [l, share]));
    }
    return out;
  }

  // 언마운트 시 상태 폴링 정리
  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current);
  }, []);

  /* ── 기존 분석(survey_designs)에서 이어쓰기: URL ?design= 로 들어오면 로드 ── */
  useEffect(() => {
    if (!designIdFromUrl) return;
    const id = parseInt(designIdFromUrl, 10);
    if (Number.isNaN(id)) return;
    let cancelled = false;
    setDraftLoading(true);
    (async () => {
      try {
        const { design } = await apiGetMyDesign(id);
        if (cancelled || !design) return;
        setDesignId(design.id);
        if (design.trade_type) setTradeType(design.trade_type);
        // definition은 [거래방식] 머리말이 붙어있을 수 있으므로 제거
        const defText = (design.definition ?? "")
          .replace(/^\[거래방식\][^\n]*\n*/m, "")
          .replace(/^\[산업 분류\][^\n]*\n*/m, "")
          .replace(/^\n+/, "");
        // 구조화 입력 폼은 별도 저장 안 됐으므로 free 텍스트 모드로 복원
        setProductMode("free");
        setProductFree(defText);
        setPurposeMode("free");
        setPurposeFree(design.needs ?? "");
        if (Array.isArray(design.hypotheses)) {
          setHypothesisTexts(design.hypotheses);
          setSelectedHypotheses(new Set(design.hypotheses.map((_, i) => i)));
        }
        if (Array.isArray(design.questions)) setSurveyQuestions(design.questions as ApiQuestion[]);
        // 도착 단계: questions > 0 → 문항 검토 / hypotheses만 → 가설 검토 / 둘 다 없으면 input
        let target: Step = "input";
        if (Array.isArray(design.questions) && design.questions.length > 0) target = "survey_review";
        else if (Array.isArray(design.hypotheses) && design.hypotheses.length > 0) target = "hyp_review";

        // 완료된 분석이면 결과 요약을 불러와 결과(요약) 단계로 진입 (대시보드 "결과 보기")
        if (design.job_id && design.status === "completed") {
          setRunJobId(design.job_id);
          try {
            const res = await getSurveyResults(design.job_id);
            if (!cancelled && res.infographic) {
              setInfographic(res.infographic);
              setRunMeta({ n: res.n_respondents ?? 0, sido: res.sido ?? "" });
              setSurveyResults(res.results ?? []);
              target = "survey_result";
            }
          } catch {
            // 결과 요약을 못 불러오면 검토 단계 유지
          }
        }
        if (cancelled) return;
        // 거래방식이 없는 예전 설계 — 필수값이므로 질문 입력부터 다시 받는다
        setStep(design.trade_type ? target : "input");
        setSubmitted(true);
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setDraftLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [designIdFromUrl]);

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
        if (d.productMode === "structured" || d.productMode === "free") setProductMode(d.productMode);
        if (Array.isArray(d.productAnswers)) setProductAnswers((d.productAnswers as string[]).slice(0, 5).concat(["", "", "", "", ""]).slice(0, 5));
        if (typeof d.productFree === "string") setProductFree(d.productFree);
        if (d.purposeMode === "structured" || d.purposeMode === "free") setPurposeMode(d.purposeMode);
        if (Array.isArray(d.purposeAnswers)) setPurposeAnswers((d.purposeAnswers as string[]).slice(0, 5).concat(["", "", "", "", ""]).slice(0, 5));
        if (typeof d.purposeFree === "string") setPurposeFree(d.purposeFree);
        // 패널 설정 복원 (결제 후 ?paid= 로 돌아온 경우 아래 effect 가 결제 상품 기준으로 덮어씀)
        if (Array.isArray(d.panelSido) && d.panelSido.length > 0) setPanelSido(d.panelSido as string[]);
        if (d.panelAxes && typeof d.panelAxes === "object") {
          const ax = d.panelAxes as Record<string, unknown>;
          setPanelAxes((prev) => {
            const next = { ...prev };
            for (const axis of PANEL_AXES) {
              const v = ax[axis.key];
              if (Array.isArray(v)) next[axis.key] = v as string[];
            }
            return next;
          });
        }
        // 결제 후 복귀(?paid=)라면 결제 상품이 패널 수를 결정하므로 임시저장 값으로 덮지 않는다
        if (!paidParam && typeof d.panelSize === "number" && d.panelSize > 0) setPanelSize(d.panelSize);
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
        // 거래방식이 비어 있는 예전 임시저장 — 필수값이므로 질문 입력부터 다시 받는다
        const restoredTrade = typeof d.tradeType === "string" ? d.tradeType : "";
        setStep(restoredTrade ? restored : "input");
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
      || "(제목 없음)").trim();
    const title = titleSrc.slice(0, 30);
    const payload: SurveyDraftPatch = {
      title,
      step,
      input_data: {
        tradeType, productMode, productAnswers, productFree,
        purposeMode, purposeAnswers, purposeFree,
        // 패널 설정 — 결제 후 복귀·임시저장 복원에서 그대로 살아나야 한다
        panelSido, panelAxes, panelSize,
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

  function stopPolling() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }

  function goBack() {
    stopTimer();
    stopPolling();
    const target = BACK_MAP[step];
    if (target) setStep(target);
  }

  function isStepAvailable(s: Step): boolean {
    // 거래방식은 필수 — 미선택이면 질문 입력 단계 밖으로 나갈 수 없다
    if (s !== "input" && !tradeType) return false;
    switch (s) {
      case "input": return true;
      case "hyp_designing": return false;
      case "hyp_review": return hypothesisTexts.length > 0;
      case "survey_designing": return false;
      case "survey_review": return surveyQuestions.length > 0;
      case "panel": return surveyQuestions.length > 0;
      case "result": return hypothesisTexts.length > 0 && surveyQuestions.length > 0;
      case "survey_running": return false;
      case "survey_result": return infographic != null; // 조사 결과가 있을 때만 재진입 가능
    }
  }

  function jumpToStep(s: Step) {
    if (s === step) return;
    if (!isStepAvailable(s)) return;
    stopTimer();
    stopPolling();
    setStep(s);
  }

  // minDurationMs: API가 너무 빨리 끝나도 로딩 화면(기술 설명)을 최소 이 시간만큼 노출
  // expectedMs: 예상 소요시간 — 진행률이 이 시간에 맞춰 완만하게 97%로 수렴한다.
  // (예상보다 오래 걸려도 조금씩 계속 차오르므로 한 지점에 멈춰 보이지 않는다)
  function startAnimation(labels: string[], onDone: () => void, minDurationMs = 0, expectedMs = 20000) {
    setProgress(0);
    setProgressLabel(labels[0]);
    const startedAt = Date.now();
    let li = 0;
    timerRef.current = setInterval(() => {
      const t = Date.now() - startedAt;
      const p = 97 * (1 - Math.exp(-t / (expectedMs * 0.55)));
      setProgress(Math.min(97, Math.round(p * 10) / 10));
      const nextLi = Math.min(Math.floor(p / (100 / labels.length)), labels.length - 1);
      if (nextLi !== li) { li = nextLi; setProgressLabel(labels[li]); }
    }, 250);

    // 최소 노출 시간을 채울 때까지 대기(그 동안 막대는 95%까지 계속 진행)
    return () => {
      const wait = Math.max(0, minDurationMs - (Date.now() - startedAt));
      setTimeout(() => {
        stopTimer();
        setProgress(100);
        setTimeout(onDone, 400);
      }, wait);
    };
  }

  // 거래방식을 바꾸면 불일치 경고 리셋
  useEffect(() => {
    setTradeMismatchWarning("");
    tradeMismatchAck.current = false;
  }, [tradeType]);

  /* ── Step 1→2: 가설 설계 API 호출 ── */
  // 거래방식을 정의 본문 앞에 명시해 AI가 컨텍스트로 활용 (가설·문항 생성 공용)
  function buildDefinitionPayload() {
    const tradeFull = TRADE_TYPES.find((t) => t.code === tradeType);
    const tradeLine = tradeFull ? `[거래방식] ${tradeFull.code} (${tradeFull.en})` : "";
    // 복원·재실행 시 정의에 이미 박힌 [거래방식] 머리말을 모두 제거해 중복 표기를 방지
    const cleanDef = productDef.replace(/\[거래방식\][^\n\[]*/g, "").trim();
    return [tradeLine, cleanDef].filter(Boolean).join("\n\n");
  }

  /* ── Step 1→2: 가설만 생성 (문항은 만들지 않음 — AI 호출 절약 + 가설 수정 반영 가능) ── */
  async function handleDesign() {
    setSubmitted(true);
    if (!tradeType || productErr || purposeErr) {
      // 거래방식 미선택 — 에러 안내가 화면 위쪽에 있어 안 보이므로 해당 섹션으로 스크롤
      if (!tradeType) {
        tradeTypeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    // 거래방식-조사목적 불일치 감지 — B2C/기타 선택인데 정의·목적에 기업/기관 대상 신호가 있으면
    // 1회 경고하고 멈춘다 (맞다면 버튼을 다시 누르면 그대로 진행).
    if (!tradeMismatchAck.current) {
      const hit = detectTradeMismatch();
      if (hit) {
        tradeMismatchAck.current = true;
        setTradeMismatchWarning(
          `조사 목적·정의에 기업/기관 대상 표현("${hit}")이 있습니다. 거래방식이 ${tradeType}로 선택되어 있는데 맞나요? ` +
          `B2B/B2G 조사라면 거래방식을 바꿔야 직장인·기관 실무자 중심으로 응답자가 구성됩니다. 지금 선택이 맞다면 'AI 설계 시작'을 한 번 더 눌러주세요.`
        );
        tradeTypeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
    }

    setApiError("");
    setStep("hyp_designing");

    const finish = startAnimation(
      ["입력 내용 분석 중...", "시장 컨텍스트 파악 중...", "가설 도출 중...", "검토 중..."],
      () => setStep("hyp_review"),
      5000,
      15000
    );

    try {
      const data = await generateHypotheses({
        definition: buildDefinitionPayload(),
        needs: researchPurpose,
        trade_type: tradeType,
        attachments: attachments.map((a) => ({
          data: a.dataUrl,
          mime: a.mime,
          description: a.description,
        })),
      });
      setHypothesisTexts(data.hypotheses ?? []);
      setSurveyQuestions([]); // 가설만 — 문항은 검토 후 '설문 생성'에서 생성
      setSelectedHypotheses(new Set(data.hypotheses?.length ? [0] : []));
      if (data.design_id != null) setDesignId(data.design_id); // 조사 실행 시 같은 설계에 결과가 쌓이도록 연결
      finish();
    } catch (err) {
      stopTimer();
      setApiError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
      setStep("input");
    }
  }

  /* ── Step 3→4: 검토·수정한 가설로 설문 문항 생성 (이 시점에 실제 AI 호출) ── */
  async function handleSurveyDesign() {
    const hyps = hypothesisTexts.filter((h) => h.trim());
    if (hyps.length === 0) {
      setApiError("가설을 먼저 작성·검토해 주세요.");
      return;
    }
    setApiError("");
    setStep("survey_designing");
    const finish = startAnimation(
      ["가설 분석 중...", "설문 문항 구성 중...", "응답 옵션 생성 중...", "생성된 설문 비판 검토 중...", "검토 의견 반영해 문항 다듬는 중..."],
      () => setStep("survey_review"),
      5000,
      50000
    );
    try {
      const data = await generateQuestions({
        hypotheses: hyps,
        definition: buildDefinitionPayload(),
        design_id: designId,
      });
      setSurveyQuestions((data.questions ?? []) as ApiQuestion[]);
      finish();
    } catch (err) {
      stopTimer();
      setApiError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
      setStep("hyp_review");
    }
  }

  /* ── Step 7→8: 가상인구 대상 조사 실행 → 인포그래픽 결과 ──
     지역·표본 수는 관리자 대시보드 전역 설정(analysis_sido / analysis_sample_size)을 따른다. */
  async function handleRunSurvey() {
    if (surveyQuestions.length === 0) return;

    // 거래방식 필수 — 미선택 상태로 실행되면 패널 구성이 조사 목적과 어긋난다
    if (!tradeType) {
      setSubmitted(true);
      setRunError("거래방식을 선택해주세요. 질문 입력 단계에서 주된 거래 대상을 골라야 조사를 실행할 수 있습니다.");
      setStep("input");
      setTimeout(() => tradeTypeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
      return;
    }

    // 유료 패널 수 — 결제창부터. 설계를 잃지 않도록 임시저장 후 결제로 보낸다.
    if (needsPayment()) {
      setRunError("");
      // 토스 라이브 키 발급 전 — 일반 사용자에겐 결제창 대신 연동 안내를 띄운다
      if (!canOpenCheckout()) {
        setPaymentPendingOpen(true);
        return;
      }
      await handleSaveDraft();
      setPanelCheckoutOpen(true);
      return;
    }

    // 거래방식-목적 불일치 재확인 — 저장된 설계를 바로 실행하는 경우 설계 단계 경고를
    // 못 봤을 수 있으므로 실행 직전에 1회 더 경고 (재클릭 시 진행)
    if (!runMismatchAck.current) {
      const hit = detectTradeMismatch();
      if (hit) {
        runMismatchAck.current = true;
        setRunError(
          `거래방식 확인: 조사 목적에 기업/기관 대상 표현("${hit}")이 있는데 거래방식이 ${tradeType}입니다. ` +
          `B2B/B2G 조사라면 1단계에서 거래방식을 바꿔주세요. 지금 그대로 진행하려면 '조사 실행하기'를 한 번 더 눌러주세요.`
        );
        return;
      }
    }
    const selected = [...selectedHypotheses].sort((a, b) => a - b).map((i) => hypothesisTexts[i]);
    const hyps = (selected.length > 0 ? selected : hypothesisTexts).filter((h) => h && h.trim());

    setRunError("");
    setInfographic(null);
    setRunMeta(null);
    setProgress(0);
    setProgressLabel("조사 실행 준비 중...");
    setStep("survey_running");

    // 패널 설정에서 고른 수를 로딩 화면(사람 아이콘·응답 카운터)에 그대로 반영
    setSampleSize(panelSize);

    try {
      const { job_id } = await apiRunSurvey({
        hypotheses: hyps,
        questions: surveyQuestions,
        definition: buildDefinitionPayload(),
        needs: researchPurpose,
        design_id: designId,
        trade_type: tradeType,
        // 패널 설정 — 시도는 복수 선택 시 첫 항목(백엔드는 단일 시도 문자열을 받는다)
        sido: panelSido.includes("전국") ? "전국" : panelSido[0],
        sample_size: panelSize,
        target_filters: buildTargetFilters(),
        // 실행 전 결제분이 있으면 이 조사에 묶어 유료 기능(원본자료·패널 질문)을 연다
        ...(paidOrderId ? { order_id: paidOrderId } : {}),
      });
      setRunJobId(job_id);

      stopPolling();
      pollRef.current = setInterval(async () => {
        try {
          const st = await getSurveyStatus(job_id);
          const pg = st.progress;
          if (pg?.total) {
            // 백엔드 4단계(패널 로드→AI 응답→집계→인포그래픽) 진행률 — 완료 전까지 95% 캡
            setProgress(Math.min(95, Math.round(((pg.done ?? 0) / pg.total) * 100)));
            if (pg.stage) setProgressLabel(pg.stage);
          }
          if (st.status === "error") {
            stopPolling();
            setRunError(st.error || "조사 실행 중 오류가 발생했습니다.");
            setStep("result");
            return;
          }
          if (st.status === "done") {
            stopPolling();
            setProgress(100);
            const res = await getSurveyResults(job_id);
            if (res.infographic) {
              setInfographic(res.infographic);
              setRunMeta({ n: res.n_respondents ?? 0, sido: res.sido ?? "" });
              setSurveyResults(res.results ?? []);
              setStep("survey_result");
            } else {
              setRunError(res.error || "결과 요약을 생성하지 못했습니다. 다시 시도해 주세요.");
              setStep("result");
            }
          }
        } catch (err) {
          // 일시적 네트워크 오류는 다음 폴링에서 재시도 — 404(잡 소실)만 중단
          if (err instanceof Error && err.message.includes("404")) {
            stopPolling();
            setRunError("조사 작업을 찾을 수 없습니다. 다시 실행해 주세요.");
            setStep("result");
          }
        }
      }, 3000);
    } catch (err) {
      stopPolling();
      setRunError(err instanceof Error ? err.message : "조사 실행에 실패했습니다.");
      setStep("result");
    }
  }

  const hasOptions = (q: ApiQuestion) =>
    (q.type === "객관식" || q.type === "복수선택" || q.type === "순위형") && q.options?.length > 0;

  const isOptionType = (t: string | undefined) =>
    t === "객관식" || t === "복수선택" || t === "순위형";

  /* ── 문항 추가/삭제/일괄수정 ── */
  const blankQuestion = (): ApiQuestion => ({ type: "객관식", title: "", question: "", options: ["", ""] });

  function addQuestion() {
    const blank = blankQuestion();
    setSurveyQuestions((prev) => [...prev, blank]);
    if (!editAllMode) {
      setQDraft({ ...blank, options: [...blank.options] });
      setEditingQIdx(surveyQuestions.length); // 새 문항을 바로 편집 모드로
    }
  }

  /** i번 문항 바로 아래에 새 문항 삽입 */
  function insertQuestion(i: number) {
    const blank = blankQuestion();
    setSurveyQuestions((prev) => [...prev.slice(0, i + 1), blank, ...prev.slice(i + 1)]);
    if (!editAllMode) {
      setQDraft({ ...blank, options: [...blank.options] });
      setEditingQIdx(i + 1);
    }
  }

  function deleteQuestion(i: number) {
    setSurveyQuestions((prev) => prev.filter((_, si) => si !== i));
    setEditingQIdx((cur) => (cur === null || cur === i ? null : cur > i ? cur - 1 : cur));
  }

  /** 일괄 수정 모드에서 문항 하나를 직접 갱신 */
  function updateQ(i: number, patch: Partial<ApiQuestion>) {
    setSurveyQuestions((prev) => prev.map((q, si) => (si === i ? ({ ...q, ...patch } as ApiQuestion) : q)));
  }

  /** 일괄 수정 종료 — 빈 보기 정리 후 모드 해제 */
  function finishEditAll() {
    setSurveyQuestions((prev) => prev.map((q) => ({
      ...q,
      options: isOptionType(q.type) ? (q.options ?? []).map((o) => o.trim()).filter(Boolean) : [],
    })));
    setEditAllMode(false);
  }

  const errTradeType = submitted && !tradeType;
  const errProduct = submitted && Boolean(productErr);
  const errPurpose = submitted && Boolean(purposeErr);

  // 임시저장 블록 — 각 step 콘텐츠 하단에 공통 배치 (로그인 + 요약·실행·결과 단계 제외)
  const saveDraftBlock =
    typeof window !== "undefined" && getAccessToken() && step !== "result" && step !== "survey_running" && step !== "survey_result" ? (
      <div className="mt-8 flex flex-col items-center gap-1.5">
        <button
          onClick={handleSaveDraft}
          disabled={saving || draftLoading}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 hover:border-slate-300 disabled:opacity-60 transition-all"
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
          <span className="text-[10px] text-rose-600 max-w-[260px] truncate" title={saveError}>{saveError}</span>
        )}
      </div>
    ) : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar appMode />

      {/* 비로그인 대시보드 접근 차단 안내 토스트 */}
      {dashboardNotice && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4">
          <div className="flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-lg shadow-amber-100/60">
            <AlertCircle size={16} className="shrink-0 text-amber-500" />
            <p className="text-sm text-slate-700">
              대시보드는 <span className="font-semibold text-slate-900">로그인이 필요합니다.</span>
              <span className="hidden sm:inline text-slate-500"> 로그인 후 이용해 주세요.</span>
            </p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-10">
        <StepBar step={step} onJump={jumpToStep} isStepAvailable={isStepAvailable} isLoggedIn={isLoggedIn} onDashboardBlocked={handleDashboardBlocked} />

        {/* ── 단계 제목 — 전체 폭(2분할 위에 노출) ── */}
        {step === "input" && (
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
              <Sparkles size={12} /> AI 시장조사 설계
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">어떤 시장조사가 필요하신가요?</h1>
            <p className="text-sm sm:text-base text-slate-500">입력 내용을 바탕으로 AI가 가설과 설문 문항을 자동으로 설계합니다.</p>
          </div>
        )}
        {(step === "hyp_designing" || step === "survey_designing" || step === "survey_running") && (
          <button onClick={goBack} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mb-8">
            <ArrowLeft size={15} /> 이전으로
          </button>
        )}
        {step === "hyp_review" && (
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 sm:mb-7">
            <button onClick={goBack} className="order-1 flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600">
              <ArrowLeft size={15} /> 이전으로
            </button>
            <div className="order-3 sm:order-2 w-full sm:w-auto sm:flex-1 text-center">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">AI 생성 가설 검토</h2>
              <p className="text-xs text-slate-400 mt-0.5">조사에 사용할 가설을 선택하고 필요시 수정하세요</p>
            </div>
            <div className="order-2 sm:order-3 inline-flex items-center gap-1.5 bg-violet-50 text-violet-600 text-xs font-semibold px-3 py-1.5 rounded-full border border-violet-100">
              <Lightbulb size={12} /> 가설 {hypothesisTexts.length}개 생성
            </div>
          </div>
        )}
        {step === "survey_review" && (
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 sm:mb-7">
            <button onClick={goBack} className="order-1 flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600">
              <ArrowLeft size={15} /> 이전으로
            </button>
            <div className="order-3 sm:order-2 w-full sm:w-auto sm:flex-1 text-center">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">AI 생성 설문 검토</h2>
              <p className="text-xs text-slate-400 mt-0.5">문항을 확인하고 필요시 수정하세요</p>
            </div>
            <div className="order-2 sm:order-3 inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-600 text-xs font-semibold px-3 py-1.5 rounded-full border border-indigo-100">
              <ListChecks size={12} /> {surveyQuestions.length}문항 생성
            </div>
          </div>
        )}
        {step === "result" && (
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <button onClick={goBack} className="order-1 flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600">
              <ArrowLeft size={15} /> 이전으로
            </button>
            <div className="order-3 sm:order-2 w-full sm:w-auto sm:flex-1 text-center">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">조사 설계 요약</h2>
            </div>
            <div className="order-2 sm:order-3 inline-flex items-center gap-1.5 bg-indigo-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-md shadow-indigo-200">
              <Sparkles size={11} /> 설계 완료
            </div>
          </div>
        )}
        {step === "survey_result" && (
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <button onClick={goBack} className="order-1 flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600">
              <ArrowLeft size={15} /> 이전으로
            </button>
            <div className="order-3 sm:order-2 w-full sm:w-auto sm:flex-1 text-center">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">조사 결과</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {runMeta ? `${runMeta.sido || "—"} · 가상인구 ${runMeta.n.toLocaleString()}명 응답` : ""}
              </p>
            </div>
            <div className="order-2 sm:order-3 inline-flex items-center gap-1.5 bg-indigo-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-md shadow-indigo-200">
              <PieChart size={11} /> 조사 완료
            </div>
          </div>
        )}

        {/* 2분할 — 좌: 작업/표시 화면, 우: 단계별 기술 설명 패널 */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_22rem] gap-6 lg:gap-8 items-start">
          <div className="min-w-0">

        {/* ══════════════════════════════════════════
            1. 질문 입력
        ══════════════════════════════════════════ */}
        {step === "input" && (
          <div>
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
              <div ref={tradeTypeRef} className="px-5 sm:px-8 pt-6 sm:pt-7 pb-5 border-b border-slate-100">
                <FieldLabel required>
                  거래방식
                  <span className="ml-1.5 text-slate-400 text-xs font-normal">(주된 거래 대상 — 하나를 선택하세요)</span>
                </FieldLabel>
                <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
                  {TRADE_TYPES.map((t) => {
                    const selected = tradeType === t.code;
                    const dimmed = tradeType !== "" && !selected;
                    return (
                      <button
                        key={t.code}
                        type="button"
                        onClick={() => setTradeType(selected ? "" : t.code)}
                        aria-pressed={selected}
                        title={`${t.code} (${t.en})`}
                        className={`relative flex flex-col items-center text-center rounded-xl border-2 px-1.5 sm:px-2.5 py-4 transition-all duration-150 ${
                          selected
                            ? "border-indigo-500 bg-indigo-50 shadow-sm"
                            : errTradeType
                              ? "border-red-200 bg-white hover:border-slate-300"
                              : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50"
                        } ${dimmed ? "opacity-40 grayscale hover:opacity-100 hover:grayscale-0" : ""}`}
                      >
                        {selected && (
                          <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500">
                            <Check size={11} className="text-white" strokeWidth={3} />
                          </span>
                        )}
                        <span className="text-3xl mb-1.5 leading-none" aria-hidden>{t.icon}</span>
                        <span className="text-sm font-bold text-slate-800">{t.code}</span>
                        <span className="hidden sm:block text-[10px] text-slate-400 leading-tight mb-1.5">{t.en}</span>
                        <span className="text-[11px] font-semibold text-slate-600 mt-1 sm:mt-0">{t.ko}</span>
                        <span className="hidden sm:block text-[11px] text-slate-400 leading-snug mt-0.5">{t.desc}</span>
                      </button>
                    );
                  })}
                </div>
                {errTradeType && <ErrorMsg msg="거래방식을 선택해주세요." />}
                {tradeMismatchWarning && (
                  <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3">
                    <AlertCircle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs leading-relaxed text-amber-800">{tradeMismatchWarning}</p>
                  </div>
                )}
              </div>

              {/* 제품 정의 */}
              <div className="px-5 sm:px-8 py-6 border-b border-slate-100">
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

                {productMode === null ? (
                  <div className={`rounded-xl border border-dashed ${errProduct ? "border-red-300 bg-red-50/30" : "border-slate-200 bg-slate-50/60"} px-5 py-8 text-center`}>
                    <p className="text-sm font-semibold text-slate-600 mb-1">입력 방식을 먼저 선택해주세요</p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      <span className="font-medium text-indigo-500">질문형</span>은 항목별 가이드 질문에 답하는 방식이고,{" "}
                      <span className="font-medium text-indigo-500">자유형</span>은 한 곳에 직접 서술하는 방식입니다.
                    </p>
                  </div>
                ) : productMode === "structured" ? (
                  <div className="flex flex-col gap-5">
                    <p className="text-xs text-indigo-500 font-medium -mb-1">각 항목에 최대한 상세하게 작성해주세요. 구체적일수록 AI가 더 정확한 가설을 도출합니다.<br />답변이 힘든 부분은 생략하셔도 되나, 전체 답변 합계는 300자 이상이어야 합니다.</p>
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
                    <div className="flex justify-end">
                      <CharCount len={productLen} />
                    </div>
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
                {errProduct && productErr && <ErrorMsg msg={productErr} />}
              </div>

              {/* 시장조사 목적 */}
              <div className="px-5 sm:px-8 py-6">
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

                {purposeMode === null ? (
                  <div className={`rounded-xl border border-dashed ${errPurpose ? "border-red-300 bg-red-50/30" : "border-slate-200 bg-slate-50/60"} px-5 py-8 text-center`}>
                    <p className="text-sm font-semibold text-slate-600 mb-1">입력 방식을 먼저 선택해주세요</p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      <span className="font-medium text-indigo-500">질문형</span>은 5개 가이드 질문에 답하는 방식이고,{" "}
                      <span className="font-medium text-indigo-500">자유형</span>은 한 곳에 자유롭게 서술하는 방식입니다.
                    </p>
                  </div>
                ) : purposeMode === "structured" ? (
                  <div className="flex flex-col gap-5">
                    <p className="text-xs text-indigo-500 font-medium -mb-1">각 항목에 최대한 상세하게 작성해주세요. 구체적일수록 AI가 더 정확한 가설을 도출합니다.<br />답변이 힘든 부분은 생략하셔도 되나, 전체 답변 합계는 300자 이상이어야 합니다.</p>
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
                    <div className="flex justify-end">
                      <CharCount len={purposeLen} />
                    </div>
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
                {errPurpose && purposeErr && <ErrorMsg msg={purposeErr} />}
              </div>

              {/* 참고 이미지 첨부(선택) — 시장조사 목적 바로 아래 */}
              <AttachmentSection attachments={attachments} setAttachments={setAttachments} />

              <div className="px-5 sm:px-8 py-5 bg-slate-50 border-t border-slate-100">
                <button
                  onClick={handleDesign}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-500 transition-all hover:shadow-lg hover:shadow-indigo-200 active:scale-[0.99]"
                >
                  <Sparkles size={15} /> AI 설계 시작 <ArrowRight size={15} />
                </button>
              </div>
            </div>
            {saveDraftBlock}
          </div>
        )}

        {/* ══════════════════════════════════════════
            2. AI 가설 설계 중
        ══════════════════════════════════════════ */}
        {step === "hyp_designing" && (
          <div>
            <SocialTwinLoader
              screen="hypothesis"
              title="작성한 정보를 바탕으로 가설을 설계 중입니다"
              subtitle={`“${researchPurpose.slice(0, 60)}${researchPurpose.length > 60 ? "..." : ""}”`}
              progress={progress}
            />
            {saveDraftBlock}
          </div>
        )}

        {/* ══════════════════════════════════════════
            3. 가설 검토
        ══════════════════════════════════════════ */}
        {step === "hyp_review" && (
          <div>
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
                              setSurveyQuestions([]); // 가설 수정 → 기존 문항 무효화(재생성 강제)
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
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {selectedHypotheses.size}개 가설 선택됨
                </p>
                <p className="text-xs text-slate-400 mt-0.5">선택한 가설을 기반으로 설문을 생성합니다</p>
              </div>
              <button
                onClick={handleSurveyDesign}
                disabled={selectedHypotheses.size === 0}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-500 transition-all hover:shadow-lg hover:shadow-indigo-200 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Wand2 size={15} /> AI 설문 생성 <ArrowRight size={15} />
              </button>
            </div>
            {saveDraftBlock}
          </div>
        )}

        {/* ══════════════════════════════════════════
            4. AI 설문 생성 중
        ══════════════════════════════════════════ */}
        {step === "survey_designing" && (
          <div>
            <SocialTwinLoader
              screen="generate"
              title="가설을 바탕으로 설문을 생성 중입니다"
              subtitle={`${selectedHypotheses.size}개 가설 기반으로 설문 문항을 구성하고 있습니다`}
              progress={progress}
            />
            {saveDraftBlock}
          </div>
        )}

        {/* ══════════════════════════════════════════
            5. 설문 검토
        ══════════════════════════════════════════ */}
        {step === "survey_review" && (
          <div>
            <div className="flex flex-col gap-5">
              {/* 위쪽: 선택된 가설 요약 */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2 bg-gradient-to-r from-violet-50/60 to-white">
                  <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
                    <Lightbulb size={13} className="text-violet-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800">선택된 가설</h3>
                  <span className="ml-auto text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{selectedHypotheses.size}개</span>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {[...selectedHypotheses].sort().map((i) => (
                    <div key={i} className="flex items-start gap-2.5 p-3 bg-violet-50/60 rounded-xl border border-violet-100">
                      <span className="text-[10px] font-bold text-violet-500 bg-violet-100 px-1.5 py-0.5 rounded mt-0.5 flex-shrink-0">H{i + 1}</span>
                      <p className="text-xs text-slate-700 leading-relaxed">{hypothesisTexts[i]}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2분할: 왼쪽 설문지 직접 업로드 / 오른쪽 설문지 수정 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                  <p className="text-xs font-semibold text-slate-500 mb-1">설문지 직접 업로드 <span className="font-normal text-slate-400">(선택)</span></p>
                  <p className="text-[11px] text-slate-400 mb-2 break-keep leading-relaxed">조사하고 싶은 설문지가 있는 경우에는 업로드하시면 자동으로 문항을 인식합니다.</p>
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
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col">
                  <p className="text-xs font-semibold text-slate-500 mb-1">설문지 수정</p>
                  <p className="text-[11px] text-slate-400 mb-2 break-keep leading-relaxed flex-1">아래 전체 설문 문항을 한 화면에서 한꺼번에 수정할 수 있습니다. 수정이 끝나면 수정 완료를 누르세요.</p>
                  <button
                    onClick={() => {
                      if (editAllMode) { finishEditAll(); }
                      else { setEditingQIdx(null); setEditAllMode(true); }
                    }}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      editAllMode
                        ? "bg-emerald-500 text-white hover:bg-emerald-400"
                        : "border-2 border-dashed border-indigo-200 text-indigo-500 hover:border-indigo-300 hover:bg-indigo-50/40"
                    }`}
                  >
                    {editAllMode ? <><Check size={13} /> 수정 완료</> : <><Pencil size={13} /> 설문지 수정 (전체 문항 한번에)</>}
                  </button>
                </div>
              </div>

              {/* 아래쪽: 설문 문항 — 보기까지 전부 펼쳐서 표시 */}
              <div className="flex flex-col gap-3">
                {surveyQuestions.map((q, i) => {
                  const isEditingQ = !editAllMode && editingQIdx === i;
                  const canExpand = hasOptions(q);

                  return (
                    <div key={i} className="flex flex-col gap-2">
                    {editAllMode ? (
                      /* 일괄 수정 카드 — 전체 문항을 한 화면에서 바로 수정 */
                      <div className="bg-white rounded-2xl border border-indigo-200 shadow-sm px-5 py-4 flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0 shadow-sm">
                            {i + 1}
                          </div>
                          <select
                            value={q.type}
                            onChange={(e) => {
                              const t = e.target.value;
                              updateQ(i, { type: t, options: isOptionType(t) && !(q.options?.length) ? ["", ""] : q.options });
                            }}
                            className="flex-1 appearance-none bg-white border border-indigo-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-none"
                          >
                            {QUESTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                          </select>
                          <button
                            onClick={() => deleteQuestion(i)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                            title="문항 삭제"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <input
                          className="w-full px-3 py-2 text-sm bg-white border border-indigo-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-400/30"
                          placeholder="제목"
                          value={q.title}
                          onChange={(e) => updateQ(i, { title: e.target.value })}
                        />
                        <textarea
                          className="w-full h-16 px-3 py-2.5 text-sm bg-white border border-indigo-200 rounded-lg resize-none outline-none focus:ring-2 focus:ring-indigo-400/30 leading-relaxed"
                          placeholder="질문 내용"
                          value={q.question}
                          onChange={(e) => updateQ(i, { question: e.target.value })}
                        />
                        {isOptionType(q.type) && (
                          <div className="flex flex-col gap-1.5">
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">보기 항목</p>
                            {(q.options ?? []).map((opt, oi) => (
                              <div key={oi} className="flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded-full bg-white border border-indigo-100 text-[10px] font-bold text-slate-400 flex items-center justify-center flex-shrink-0">
                                  {oi + 1}
                                </span>
                                <input
                                  className="flex-1 px-3 py-1.5 text-xs bg-white border border-indigo-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-400/30"
                                  placeholder={`보기 ${oi + 1}`}
                                  value={opt}
                                  onChange={(e) => updateQ(i, { options: (q.options ?? []).map((o, j) => (j === oi ? e.target.value : o)) })}
                                />
                                <button
                                  onClick={() => updateQ(i, { options: (q.options ?? []).filter((_, j) => j !== oi) })}
                                  className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 flex-shrink-0"
                                  title="보기 삭제"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ))}
                            <button
                              onClick={() => updateQ(i, { options: [...(q.options ?? []), ""] })}
                              className="self-start inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-dashed border-indigo-200 text-[11px] text-indigo-500 hover:bg-indigo-50 transition-colors"
                            >
                              <Plus size={12} /> 보기 추가
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
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
                          {/* 문항 이미지(선택) */}
                          <div className="mt-2 flex items-center gap-2 flex-wrap">
                            {q.image ? (
                              <div className="relative">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={q.image} alt="문항 이미지" className="h-14 w-14 object-cover rounded-lg border border-slate-200" />
                                <button
                                  type="button"
                                  onClick={() => setSurveyQuestions((prev) => prev.map((sq, si) => (si === i ? { ...sq, image: null } : sq)))}
                                  className="absolute -top-1.5 -right-1.5 bg-white border border-slate-300 rounded-full w-5 h-5 flex items-center justify-center text-rose-500 hover:bg-rose-50"
                                  title="이미지 제거"
                                >
                                  <X size={11} />
                                </button>
                              </div>
                            ) : (
                              <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] text-slate-500 cursor-pointer hover:border-indigo-300 hover:text-indigo-500 transition-colors">
                                <ImagePlus size={12} /> 이미지 추가 <span className="text-slate-300">(선택)</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={async (e) => {
                                    const f = e.target.files?.[0];
                                    e.currentTarget.value = "";
                                    if (!f || !f.type.startsWith("image/") || f.size > 6 * 1024 * 1024) return;
                                    const url = await fileToDataUrl(f);
                                    setSurveyQuestions((prev) => prev.map((sq, si) => (si === i ? { ...sq, image: url } : sq)));
                                  }}
                                />
                              </label>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => {
                              if (isEditingQ) { setEditingQIdx(null); }
                              else { setQDraft({ title: q.title, question: q.question, type: q.type, options: [...(q.options ?? [])] }); setEditingQIdx(i); }
                            }}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 transition-colors"
                            title={isEditingQ ? "편집 취소" : "문항 수정"}
                          >
                            {isEditingQ ? <X size={13} /> : <Pencil size={13} />}
                          </button>
                          <button
                            onClick={() => deleteQuestion(i)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                            title="문항 삭제"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* 객관식 보기 항목 — 항상 펼쳐서 표시 (편집 중에는 편집 폼에서 수정) */}
                      {!isEditingQ && canExpand && (
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
                          <select
                            value={qDraft.type ?? ""}
                            onChange={(e) => {
                              const t = e.target.value;
                              setQDraft((d) => ({
                                ...d,
                                type: t,
                                // 보기형 유형으로 바꿨는데 보기가 없으면 빈 보기 2개 시드
                                options: isOptionType(t) && !(d.options?.length) ? ["", ""] : d.options,
                              }));
                            }}
                            className="w-full appearance-none bg-white border border-indigo-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-none"
                          >
                            {QUESTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                          </select>
                          {/* 보기 편집 — 객관식·복수선택·순위형 */}
                          {isOptionType(qDraft.type) && (
                            <div className="flex flex-col gap-1.5">
                              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">보기 항목</p>
                              {(qDraft.options ?? []).map((opt, oi) => (
                                <div key={oi} className="flex items-center gap-1.5">
                                  <span className="w-5 h-5 rounded-full bg-white border border-indigo-100 text-[10px] font-bold text-slate-400 flex items-center justify-center flex-shrink-0">
                                    {oi + 1}
                                  </span>
                                  <input
                                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-indigo-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-400/30"
                                    placeholder={`보기 ${oi + 1}`}
                                    value={opt}
                                    onChange={(e) => setQDraft((d) => ({
                                      ...d,
                                      options: (d.options ?? []).map((o, j) => (j === oi ? e.target.value : o)),
                                    }))}
                                  />
                                  <button
                                    onClick={() => setQDraft((d) => ({
                                      ...d,
                                      options: (d.options ?? []).filter((_, j) => j !== oi),
                                    }))}
                                    className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 flex-shrink-0"
                                    title="보기 삭제"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              ))}
                              <button
                                onClick={() => setQDraft((d) => ({ ...d, options: [...(d.options ?? []), ""] }))}
                                className="self-start inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-dashed border-indigo-200 text-[11px] text-indigo-500 hover:bg-indigo-50 transition-colors"
                              >
                                <Plus size={12} /> 보기 추가
                              </button>
                            </div>
                          )}
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => setEditingQIdx(null)} className="px-3 py-2 text-xs text-slate-500 hover:bg-slate-100 rounded-lg border border-slate-200 bg-white">취소</button>
                            <button
                              onClick={() => {
                                const opts = isOptionType(qDraft.type)
                                  ? (qDraft.options ?? []).map((o) => o.trim()).filter(Boolean)
                                  : [];
                                setSurveyQuestions((prev) => prev.map((sq, si) =>
                                  si === i ? ({ ...sq, ...qDraft, options: opts } as ApiQuestion) : sq
                                ));
                                setEditingQIdx(null);
                              }}
                              className="px-3 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-500"
                            >저장</button>
                          </div>
                        </div>
                      )}
                    </div>
                    )}
                    {/* 이 문항 바로 아래에 새 문항 삽입 */}
                    <button
                      onClick={() => insertQuestion(i)}
                      className="self-center inline-flex items-center gap-1 px-3 py-1 rounded-full border border-dashed border-slate-200 text-[11px] text-slate-400 hover:text-indigo-500 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all"
                    >
                      <Plus size={11} /> 문항 추가
                    </button>
                    </div>
                  );
                })}

                {surveyQuestions.length === 0 && (
                  <button
                    onClick={addQuestion}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-indigo-200 text-indigo-500 text-sm font-medium hover:bg-indigo-50/60 hover:border-indigo-300 transition-all"
                  >
                    <Plus size={15} /> 문항 추가
                  </button>
                )}

                <button
                  onClick={() => { if (editAllMode) finishEditAll(); setStep("panel"); }}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-500 transition-all hover:shadow-lg hover:shadow-indigo-200 active:scale-[0.99] mt-2"
                >
                  패널 설정 <ArrowRight size={15} />
                </button>
              </div>
            </div>
            {saveDraftBlock}
          </div>
        )}

        {/* ══════════════════════════════════════════
            6. 패널 설정 — 조사에 응답할 가상인구를 고른다
        ══════════════════════════════════════════ */}
        {step === "panel" && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                  <SlidersHorizontal size={16} className="text-indigo-600" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-slate-900">패널 설정</h2>
                  <p className="mt-0.5 text-xs text-slate-500 leading-relaxed break-keep">
                    설문에 응답할 가상인구를 고릅니다. 조건을 좁히지 않으면(전체) 조사 목적에 맞는
                    응답자 구성을 AI가 자동으로 잡아줍니다.
                  </p>
                </div>
              </div>
            </div>

            {/* 지역 */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-1">
                <MapPin size={15} className="text-slate-400" />
                <h3 className="text-sm font-bold text-slate-900">시도</h3>
                <span className="text-[11px] text-slate-400">복수 선택 가능</span>
              </div>
              <p className="text-xs text-slate-600 mb-3">전국을 고르면 모든 시도를 합산합니다.</p>
              <div className="flex flex-wrap gap-2">
                {SIDO_OPTIONS.map((name) => {
                  const isAll = name === "전국";
                  const checked = panelSido.includes(name);
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => {
                        if (isAll) { setPanelSido(["전국"]); return; }
                        const next = checked
                          ? panelSido.filter((v) => v !== name)
                          : [...panelSido.filter((v) => v !== "전국"), name];
                        setPanelSido(next.length === 0 ? ["전국"] : next);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        checked
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 인구 특성 축 */}
            {PANEL_AXES.map((axis) => {
              const picked = panelAxes[axis.key];
              const isAll = picked.length === 0;
              return (
                <div key={axis.key} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <h3 className="text-sm font-bold text-slate-900">{axis.label}</h3>
                    {!isAll && (
                      <button
                        type="button"
                        onClick={() => setPanelAxes((p) => ({ ...p, [axis.key]: [] }))}
                        className="text-[11px] text-slate-400 hover:text-slate-700"
                      >
                        전체로 되돌리기
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setPanelAxes((p) => ({ ...p, [axis.key]: [] }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        isAll
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      전체
                    </button>
                    {axis.options.map((opt) => {
                      const checked = picked.includes(opt);
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => toggleAxis(axis.key, opt)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                            checked
                              ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* 패널 수 — 요금제 */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-1">
                <Users size={15} className="text-slate-400" />
                <h3 className="text-sm font-bold text-slate-900">패널 수</h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                설문에 응답할 가상인구 수입니다. 많을수록 세부 집단까지 나눠 볼 수 있습니다.
              </p>

              {subActive || reportExempt ? (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                      <Repeat size={16} />
                    </div>
                    <div className="min-w-0">
                      {subActive ? (
                        <>
                          <p className="text-sm font-bold text-slate-900">
                            월정액 고객 — 100명 고정
                            <span className="ml-2 text-xs font-semibold text-indigo-600">
                              {subscription?.days_left}일 남음
                            </span>
                          </p>
                          <p className="mt-1 text-xs text-slate-600 leading-relaxed break-keep">
                            월정액 구독은 가상인구 <strong className="font-semibold">100명</strong> 규모로 고정되며,
                            구독 기간 동안 <strong className="font-semibold">횟수 제한 없이</strong> 조사하실 수 있습니다.
                            이 조사는 추가 결제 없이 바로 진행됩니다.
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-bold text-slate-900">무료 제공 대상 — 100명 고정</p>
                          <p className="mt-1 text-xs text-slate-600 leading-relaxed break-keep">
                            상세보고서 무료 제공(무료 쿠폰·무료 제공 계정) 대상이라
                            가상인구 <strong className="font-semibold">100명</strong> 규모로 조사합니다.
                            추가 결제 없이 바로 진행되며, 원본자료(엑셀)와 패널 질문도 이용하실 수 있습니다.
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid sm:grid-cols-3 gap-3">
                  {PANEL_SIZES.map((p) => {
                    const active = panelSize === p.size;
                    return (
                      <button
                        key={p.size}
                        type="button"
                        onClick={() => setPanelSize(p.size)}
                        className={`text-left rounded-xl border p-4 transition-all ${
                          active
                            ? "border-indigo-500 bg-indigo-50/60 ring-1 ring-indigo-200"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-xs font-bold ${active ? "text-indigo-700" : "text-slate-500"}`}>
                            {p.name}
                          </span>
                          <span
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              active ? "border-indigo-600 bg-indigo-600" : "border-slate-300"
                            }`}
                          >
                            {active && <Check size={10} strokeWidth={4} className="text-white" />}
                          </span>
                        </div>
                        <p className="mt-2 text-lg font-extrabold text-slate-900 tabular-nums">
                          {p.size}<span className="text-sm font-bold ml-0.5">명</span>
                        </p>
                        <p className={`mt-0.5 text-sm font-bold ${active ? "text-indigo-700" : "text-slate-700"}`}>
                          {p.price}
                        </p>
                        {"note" in p && p.note && (
                          <p className="text-[11px] text-slate-400">{p.note}</p>
                        )}
                        <p className="mt-2 text-[11px] text-slate-500 leading-snug break-keep">{p.desc}</p>
                      </button>
                    );
                  })}
                </div>
              )}

              {!subActive && !reportExempt && (
                <p className="mt-3 text-[11px] text-slate-400 leading-relaxed break-keep">
                  무료 체험(10명)은 결제 없이 진행됩니다. 100명·500명은 조사를 진행할 때 결제가 필요하며,
                  자주 조사하신다면{" "}
                  <a href="/pricing" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline underline-offset-2">
                    월정액 구독(100명 무제한)
                  </a>
                  이 유리합니다.
                </p>
              )}
            </div>

            <button
              onClick={() => setStep("result")}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-500 transition-all hover:shadow-lg hover:shadow-indigo-200 active:scale-[0.99]"
            >
              최종 검토 <ArrowRight size={15} />
            </button>
            {saveDraftBlock}
          </div>
        )}

        {/* ══════════════════════════════════════════
            6. 요약 — 지금까지 진행한 설계 과정을 한눈에
        ══════════════════════════════════════════ */}
        {step === "result" && (
          <div>
            {/* KPI */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
              {[
                { icon: <Target size={18} />, label: "거래방식", value: tradeType || "—", accent: "indigo" },
                { icon: <Lightbulb size={18} />, label: "선택 가설", value: `${selectedHypotheses.size}개`, accent: "sky" },
                { icon: <FileText size={18} />, label: "설문 문항", value: `${surveyQuestions.length}개`, accent: "emerald" },
                { icon: <Users size={18} />, label: "패널 수", value: `${panelSize}명`, accent: "amber" },
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
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 mb-1">거래방식</p>
                    <p className="text-sm text-slate-700">
                      {tradeType
                        ? `${tradeType} (${TRADE_TYPES.find((t) => t.code === tradeType)?.en ?? ""})`
                        : "미선택"}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-[11px] font-semibold text-slate-400 mb-1">업로드 설문지</p>
                    <p className={`text-sm ${uploadedPdf ? "text-emerald-600 font-medium" : "text-slate-400"}`}>
                      {uploadedPdf ?? "없음"}
                    </p>
                  </div>
                  {productDef && (
                    <div className="sm:col-span-2">
                      <p className="text-[11px] font-semibold text-slate-400 mb-1">제품 / 서비스 정의</p>
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{productDef}</p>
                    </div>
                  )}
                  {researchPurpose && (
                    <div className="sm:col-span-2">
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

              {/* 4. 패널 설정 요약 */}
              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-[11px] font-bold flex items-center justify-center">4</span>
                  <SlidersHorizontal size={14} className="text-amber-500" />
                  <h3 className="text-sm font-semibold text-slate-800">패널 설정</h3>
                  <button
                    onClick={() => setStep("panel")}
                    className="ml-auto text-[11px] font-medium text-indigo-600 hover:underline"
                  >
                    수정하기
                  </button>
                </div>
                <div className="p-5 flex flex-col gap-4">
                  {/* 패널 수 + 요금 */}
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Users size={15} className="text-slate-400" />
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          가상인구 {panelSize}명
                          {subActive && <span className="ml-2 text-xs font-semibold text-indigo-600">월정액 · 고정</span>}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {subActive
                            ? `월정액 구독 중 — 추가 결제 없이 진행됩니다 (${subscription?.days_left}일 남음)`
                            : (PANEL_SIZES.find((p) => p.size === panelSize)?.desc ?? "")}
                        </p>
                      </div>
                    </div>
                    <span className={`text-sm font-bold ${subActive ? "text-indigo-600" : "text-slate-800"}`}>
                      {subActive
                        ? "무제한"
                        : (PANEL_SIZES.find((p) => p.size === panelSize)?.price ?? "—")}
                    </span>
                  </div>

                  {/* 조사 지역 */}
                  <div>
                    <p className="text-xs font-bold text-slate-700 mb-2">조사 지역</p>
                    <div className="flex flex-wrap gap-1.5">
                      {panelSido.map((name) => (
                        <span key={name} className="text-xs font-medium text-slate-700 bg-slate-100 border border-slate-200 rounded px-2 py-1">{name}</span>
                      ))}
                    </div>
                  </div>

                  {/* 인구 특성 축 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                    {PANEL_AXES.map((axis) => {
                      const picked = panelAxes[axis.key];
                      const isAll = picked.length === 0;
                      return (
                        <div key={axis.key}>
                          <p className="text-xs font-bold text-slate-700 mb-2">{axis.label}</p>
                          {isAll ? (
                            <span className="inline-flex items-center rounded px-2 py-1 text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200">
                              전체
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {picked.map((v) => (
                                <span key={v} className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded px-2 py-1">{v}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {Object.keys(buildTargetFilters()).length === 0 ? (
                    <div className="flex items-start gap-2.5 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3">
                      <Sparkles size={15} className="mt-0.5 shrink-0 text-violet-500" />
                      <p className="text-xs leading-relaxed break-keep text-violet-900">
                        <strong className="font-bold">특성 조건을 좁히지 않았습니다</strong> — 조사 목적에 맞는
                        응답자 구성을 <strong className="font-bold">AI가 자동으로</strong> 잡아줍니다.
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2.5 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3">
                      <SlidersHorizontal size={15} className="mt-0.5 shrink-0 text-indigo-500" />
                      <p className="text-xs leading-relaxed break-keep text-indigo-900">
                        <strong className="font-bold">선택한 특성 조건</strong>으로 가상인구를 추출합니다.
                        선택한 라벨에 균등 비율이 적용됩니다.
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {/* 실행 */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-800">위 설문문항을 바탕으로 가상인구 대상 조사를 실행합니다.</p>
                  <p className="text-xs text-slate-400 mt-0.5">가상인구 매칭과 AI 응답 생성에 몇 분 정도 걸릴 수 있습니다.</p>
                  {needsPayment() && (
                    <p className="mt-1.5 flex items-start gap-1.5 text-xs text-amber-700 font-medium">
                      <CreditCard size={13} className="flex-shrink-0 mt-0.5" />
                      가상인구 {panelSize}명 조사는{" "}
                      {PANEL_SIZES.find((p) => p.size === panelSize)?.price} 결제 후 진행됩니다.
                    </p>
                  )}
                  {runError && (
                    <p className="mt-1.5 flex items-start gap-1 text-xs text-rose-500 font-medium">
                      <AlertCircle size={13} className="flex-shrink-0 mt-0.5" /> {runError}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleRunSurvey}
                  disabled={surveyQuestions.length === 0}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-500 transition-all hover:shadow-lg hover:shadow-indigo-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {needsPayment()
                    ? <><CreditCard size={15} /> 결제하고 조사 실행하기 <ArrowRight size={15} /></>
                    : <><Users size={15} /> 조사 실행하기 <ArrowRight size={15} /></>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            7. 가상인구 조사 실행 중
        ══════════════════════════════════════════ */}
        {step === "survey_running" && (
          <div>
            <SocialTwinLoader
              screen="survey"
              title="가상인구 대상 조사를 실행 중입니다"
              subtitle={`가상인구 패널이 ${surveyQuestions.length}개 문항에 응답하고 있습니다. 몇 분 정도 걸릴 수 있어요`}
              progress={progress}
              progressLabel={progressLabel}
              totalRespondents={sampleSize ?? undefined}
            />
          </div>
        )}

        {/* ══════════════════════════════════════════
            8. 결과 — 인포그래픽 요약 + 상세분석 안내
        ══════════════════════════════════════════ */}
        {step === "survey_result" && (
          <div>
            <div className="flex flex-col gap-5">
              {/* ── 다운로드 — 결제 후 결과 페이지(/results/[id])와 동일 구성 ──
                  무료(10명) 조사에서는 Raw Data·상세보고서가 잠긴다. */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900 shadow-lg p-5">
                <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                  <Download size={15} className="text-slate-300" /> 다운로드
                </h3>
                <div className="mb-3 leading-relaxed">
                  {detailStatus === "idle" ? (
                    <p className="text-[11px] text-slate-400">
                      상세보고서는 <span className="font-semibold text-amber-300">‘상세보고서 생성하기’</span>를
                      누르면 만들어집니다. 요약보고서는 지금 바로 내려받을 수 있습니다.
                    </p>
                  ) : detailStatus === "running" ? (
                    <>
                      <p className="text-[11px] text-slate-400">
                        상세보고서를 생성하고 있습니다 — 초안 생성 → 검토 → 수정·보완 과정을 거치며
                        패널의 수에 따라 약 5~10분 걸립니다.
                      </p>
                      <p className="mt-1 text-[11px] font-medium text-indigo-300">
                        기다리는 동안 우측의 <span className="font-bold text-indigo-200">가상인구 패널</span>에게
                        궁금한 점을 질문해 보세요.
                      </p>
                    </>
                  ) : (
                    <p className="text-[11px] text-slate-400">조사 결과 자료를 내려받으실 수 있습니다.</p>
                  )}
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                  {[
                    { kind: "summary", label: "요약보고서", sub: "PDF", locked: false, pending: false },
                    { kind: "raw", label: "가상인구 Raw Data", sub: "엑셀(CSV)", locked: !paidTier, pending: false },
                    { kind: "report", label: "상세보고서", sub: "PDF", locked: false, pending: detailStatus !== "done" && detailStatus !== "idle" },
                  ].map((d) => (
                    <button
                      key={d.kind}
                      onClick={() => {
                        if (d.locked) { setUpgradeOpen(true); return; }
                        if (d.pending) return;
                        // 아직 만들지 않은 상세보고서 — 먼저 생성부터 시작한다
                        if (d.kind === "report" && detailStatus === "idle") { handleStartDetail(); return; }
                        handleResultDownload(d.kind);
                      }}
                      disabled={resultDownloading !== null || d.pending}
                      className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-left transition disabled:cursor-not-allowed ${
                        d.locked
                          ? "border-amber-400/40 bg-amber-400/10 hover:border-amber-400/70"
                          : d.pending
                            ? "border-white/15 bg-white/5 opacity-70"
                            : "border-white/15 bg-white/10 hover:border-white/40 hover:bg-white/20"
                      }`}
                    >
                      {d.locked
                        ? <Lock size={16} className="text-amber-300 shrink-0" />
                        : d.kind === "report" && detailStatus === "idle"
                          ? <Sparkles size={16} className="text-amber-300 shrink-0" />
                          : d.pending
                            ? <RefreshCw size={16} className="text-slate-300 shrink-0 animate-spin" />
                            : <Download size={16} className="text-white shrink-0" />}
                      <span className="min-w-0">
                        <span className={`block text-sm font-medium truncate ${d.locked ? "text-amber-100" : "text-white"}`}>
                          {resultDownloading === d.kind
                            ? "준비 중…"
                            : d.kind === "report" && detailStatus === "idle"
                              ? (detailStarting ? "생성 시작 중…" : "상세보고서 생성하기")
                              : d.label}
                        </span>
                        <span className={`block text-[11px] ${
                          d.locked ? "text-amber-300 font-medium"
                          : d.pending ? "text-slate-300 font-medium"
                          : "text-slate-400"
                        }`}>
                          {d.locked
                            ? "유료 버전에서 가능"
                            : d.kind === "report" && detailStatus === "idle"
                              ? "눌러서 생성 (약 5~10분)"
                              : d.pending
                                ? (detailStatus === "error" ? "생성 실패 — 다시 시도해 주세요" : "생성 중…")
                                : d.sub}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
                {!paidTier && (
                  <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3">
                    <Info size={15} className="mt-0.5 shrink-0 text-amber-300" />
                    <p className="text-xs leading-relaxed break-keep text-amber-100">
                      <strong className="font-bold text-amber-200">무료 체험은 가상인구 10명 기준입니다.</strong>{" "}
                      상세보고서는 그대로 받아보실 수 있지만, 모집단이 작아 세부 집단별 비교나 비율 해석은
                      제한적입니다.
                      <br />
                      의사결정 근거로 쓰시려면 100명 이상 조사를 권합니다.
                    </p>
                  </div>
                )}
                {resultDownloadError && (
                  <p className="mt-2 text-[11px] text-red-300 leading-snug">{resultDownloadError}</p>
                )}
              </div>

              {/* AI 핵심 인사이트 — 상세 분석이 끝나면 표시 */}
              {(detailReport?.상세분석 ?? "").trim() && (
                <div className="bg-gradient-to-br from-indigo-950 to-slate-900 rounded-2xl p-6 border border-indigo-800/40">
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
                      <Sparkles size={15} className="text-indigo-300" />
                    </div>
                    <span className="text-sm font-semibold text-white">AI 핵심 인사이트</span>
                  </div>
                  <div className="space-y-3">
                    {(detailReport!.상세분석 ?? "").split("\n").filter((l) => l.trim()).slice(0, 4).map((line, i) => (
                      <div key={i} className="flex items-start gap-3 text-sm text-slate-300 leading-relaxed break-keep">
                        <span className="w-5 h-5 rounded-full bg-indigo-500/25 text-indigo-300 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 설문 개요 — 제품/서비스 정의 + 조사 목적·니즈 */}
              {(productDef.trim() || researchPurpose.trim()) && (
                <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
                    <FileText size={15} className="text-indigo-500" />
                    <h3 className="text-sm font-semibold text-slate-800">설문 개요</h3>
                  </div>
                  <div className="p-5 flex flex-col gap-4">
                    {productDef.trim() && (
                      <div>
                        <p className="text-[11px] font-semibold text-slate-400 mb-1.5">제품/서비스</p>
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{productDef.trim()}</p>
                      </div>
                    )}
                    {researchPurpose.trim() && (
                      <div className={productDef.trim() ? "border-t border-slate-100 pt-4" : ""}>
                        <p className="text-[11px] font-semibold text-slate-400 mb-1.5">조사 목적·니즈</p>
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{researchPurpose.trim()}</p>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* 인포그래픽 요약 — 1슬라이드 핵심 카드 */}
              {infographic ? (
                <InfographicCard info={infographic} />
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center text-sm text-slate-400">
                  표시할 결과 요약이 없습니다. 요약 단계로 돌아가 조사를 다시 실행해 주세요.
                </div>
              )}

              {/* 무료 열람 쿠폰 보유(비로그인) — 로그인하면 바로 상세보고서 열람 */}
              {!paidTier && !isLoggedIn && pendingFreeToken && runJobId && (
                <button
                  onClick={() => {
                    trackEvent("상세보고서_무료열람_로그인유도");
                    router.push(`/login?next=${encodeURIComponent(`/free-report?pass=${pendingFreeToken}&job=${runJobId}`)}`);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-500 transition-all hover:shadow-lg hover:shadow-indigo-200"
                >
                  <Download size={15} />
                  <span className="leading-tight text-center">
                    상세보고서 무료로 받기
                    <span className="block text-[11px] font-medium text-indigo-200">무료 쿠폰 적용 중 — 로그인 후 바로 열람됩니다</span>
                  </span>
                </button>
              )}

              {/* 문항별 결과 — 막대 그래프 */}
              {surveyResults.length > 0 && (
                <div>
                  <h2 className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 mb-4">
                    <BarChart2 size={15} className="text-indigo-500" /> 문항별 결과
                  </h2>
                  <div className="grid md:grid-cols-2 gap-5">
                    {surveyResults.map((r) => (
                      <QuestionResultCard key={r.문항번호} result={r} />
                    ))}
                  </div>
                </div>
              )}

              {/* 요금 안내 + 문의 */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs leading-relaxed text-slate-600">
                    더 큰 규모의 조사나 원본자료·상세보고서가 필요하시면{" "}
                    <a href="/pricing" target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo-600 underline underline-offset-2">
                      요금 안내
                    </a>
                    를 확인해 주세요.
                  </p>
                  <button
                    type="button"
                    onClick={() => setContactOpen(true)}
                    className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-all hover:border-slate-400 hover:bg-slate-50"
                  >
                    <MessageSquare size={14} /> 문의하기
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

          </div>
          {/* 우측 — 결과 단계에서는 가상인구 패널 대화창, 그 외에는 단계별 기술 설명 (스티키) */}
          <aside className="lg:sticky lg:top-20 self-start">
            {step === "survey_result" ? (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col min-h-[32rem] lg:h-[calc(100vh-7rem)]">
                <div className="px-5 py-4 border-b border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <MessageCircle size={15} className="text-indigo-500" /> 가상인구 패널에게 질문
                    {!paidTier && (
                      <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5">
                        <Lock size={9} /> 유료
                      </span>
                    )}
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-400">
                    이 설문에 참여한 가상인구 패널에게 직접 추가 질문을 할 수 있습니다.
                  </p>
                </div>

                {paidTier ? (
                  <>
                    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                      {panelMessages.length === 0 && (
                        <div className="text-center text-sm text-slate-400 py-10">
                          <MessageCircle size={28} className="mx-auto mb-3 text-slate-300" />
                          궁금한 점을 물어보세요.
                          <div className="mt-4 flex flex-wrap gap-2 justify-center">
                            {["이 제품을 선택한 이유는?", "어떤 점이 가장 마음에 드나요?", "구매를 망설이게 하는 점은?"].map((ex) => (
                              <button
                                key={ex}
                                onClick={() => setPanelInput(ex)}
                                className="text-xs px-3 py-1.5 rounded-full border border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition"
                              >
                                {ex}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {panelMessages.map((m, i) => (
                        <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-line leading-6 break-keep ${
                            m.role === "user" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"
                          }`}>
                            {m.text}
                          </div>
                        </div>
                      ))}
                      {panelSending && (
                        <div className="flex justify-start">
                          <div className="bg-slate-100 text-slate-400 rounded-2xl px-4 py-2.5 text-sm flex items-center gap-2">
                            <RefreshCw size={14} className="animate-spin" /> 답변 생성 중…
                          </div>
                        </div>
                      )}
                      {panelError && <p className="text-sm text-red-600">{panelError}</p>}
                    </div>
                    <div className="border-t border-slate-100 p-3">
                      <form
                        onSubmit={(e) => { e.preventDefault(); handleAskPanel(); }}
                        className="flex items-end gap-2"
                      >
                        <textarea
                          value={panelInput}
                          onChange={(e) => setPanelInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                              e.preventDefault();
                              handleAskPanel();
                            }
                          }}
                          rows={1}
                          placeholder="가상패널에게 질문을 입력하세요 (Enter 전송 · Shift+Enter 줄바꿈)"
                          className="flex-1 resize-none rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-400 max-h-32"
                        />
                        <button
                          type="submit"
                          disabled={panelSending || !panelInput.trim()}
                          className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition disabled:opacity-50"
                          aria-label="전송"
                        >
                          <Send size={16} />
                        </button>
                      </form>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center p-5">
                    <button
                      onClick={() => setUpgradeOpen(true)}
                      className="w-full rounded-xl border border-amber-200 bg-amber-50 px-4 py-6 text-left hover:border-amber-300 transition"
                    >
                      <p className="flex items-center gap-1.5 text-sm font-bold text-amber-800">
                        <Lock size={14} /> 유료 버전에서 가능한 기능입니다
                      </p>
                      <p className="mt-1.5 text-xs text-amber-700 leading-relaxed break-keep">
                        무료 체험(가상인구 10명)에서는 패널 질문과 원본자료(엑셀) 내려받기가 제공되지 않습니다.
                        상세보고서는 무료로도 받아보실 수 있습니다.
                        <br />
                        100명·500명 조사나 월정액 구독에서 패널 질문과 원본자료까지 이용하실 수 있습니다.
                      </p>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <TechCopyCard step={STEP_TO_NUM[step]} />
            )}
          </aside>
        </div>
      </div>

      {paymentsEnabled && checkoutOpen && (
        <CheckoutDialog
          productKey="detailed_report"
          jobId={runJobId ?? undefined}
          onClose={() => setCheckoutOpen(false)}
        />
      )}

      <ContactDialog
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        title="문의하기"
        subtitle="가상패널 질문하기·패널 인구통계·문항별 응답 분포·시사점 보고서·Raw Data가 포함된 상세분석을 받아보려면 담당자에게 문의해주세요."
        prefill={[
          runJobId ? `조사 Job ID: ${runJobId}` : null,
          runMeta ? `조사 규모: ${runMeta.sido || "—"} · 가상인구 ${runMeta.n.toLocaleString()}명` : null,
          `거래방식: ${tradeType || "미선택"}`,
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

      {/* 무료 체험에서 잠긴 기능을 눌렀을 때 — 유료 안내 */}
      {upgradeOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setUpgradeOpen(false)}
        >
          <div
            className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setUpgradeOpen(false)}
              aria-label="닫기"
              className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X size={16} />
            </button>
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4">
              <Lock size={24} className="text-amber-500" />
            </div>
            <h3 className="text-base font-bold text-slate-900">유료 버전에서 가능한 기능입니다</h3>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed break-keep">
              무료 체험(가상인구 10명)에서는 <strong className="font-semibold text-slate-700">가상인구 패널 질문</strong>과{" "}
              <strong className="font-semibold text-slate-700">원본자료(엑셀)</strong>가 제공되지 않습니다.
              상세보고서는 무료로도 받아보실 수 있지만, 모집단이 10명이라 해석이 제한적입니다.
              가상인구 100명·500명 조사 또는 월정액 구독에서 전체 기능을 이용하실 수 있습니다.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <button
                onClick={() => { setUpgradeOpen(false); setStep("panel"); }}
                className="w-full py-3 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-500 transition-all"
              >
                패널 수 변경하고 다시 조사하기
              </button>
              <a
                href="/pricing"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-all"
              >
                요금 안내 보기
              </a>
            </div>
          </div>
        </div>
      )}

      {paymentPendingOpen && <PaymentPendingDialog onClose={() => setPaymentPendingOpen(false)} />}

      {/* 조사 실행 전 결제 — 패널 수(100·500명)에 해당하는 상품으로 결제창을 띄운다.
          결제 후 /checkout/success 에서 "조사 이어서 진행하기" 로 이 설계로 돌아온다. */}
      {panelCheckoutOpen && (
        <CheckoutDialog
          productKey={panelProductKey(panelSize) ?? "detailed_report"}
          returnTo={draftId != null ? `/design?draft=${draftId}` : "/design"}
          onClose={() => setPanelCheckoutOpen(false)}
        />
      )}
    </div>
  );
}
