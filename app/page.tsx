import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight, Sparkles, BarChart2, Users,
  Zap, Globe, Brain, Check, TrendingUp, Clock,
  ChevronRight, Shield, MessageSquare,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Reveal from "@/components/Reveal";
import CtaLink from "@/components/CtaLink";
import SiteFooter from "@/components/SiteFooter";
import StartCtaButtons from "@/components/StartCtaButtons";
import HeroVideo from "@/components/HeroVideo";
import FreeCouponBanner from "@/components/FreeCouponBanner";

/* ─────────────────────────────────────────
   How it works — mini screen mockups
───────────────────────────────────────── */
function StepMockup1() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-left">
      <div className="mb-2.5">
        <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mb-1">제품(서비스)</div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5">
          <span className="text-[11px] text-slate-700 leading-snug break-keep">비건 카페</span>
        </div>
      </div>
      <div>
        <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mb-1">알고 싶은 내용</div>
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-2 py-1.5">
          <span className="text-[11px] text-indigo-700 leading-snug break-keep">선호 고객층, 메뉴선호, 가격민감도 등</span>
        </div>
      </div>
    </div>
  )
}

function StepMockup2() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-left">
      <div className="flex items-center gap-1.5 mb-2.5">
        <div className="w-6 h-6 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
          <Sparkles size={12} className="text-violet-600" />
        </div>
        <span className="text-xs font-semibold text-slate-700">AI 설계 중</span>
        <span className="ml-auto text-[10px] text-emerald-600 font-semibold">2/2</span>
      </div>
      <div className="mb-2">
        <div className="text-[10px] text-slate-400 font-semibold mb-1">📌 가설</div>
        <div className="space-y-1">
          {["20대 여성고객이 더 선호 할 것이다.", "비건 소비재를 함께 파는 것을 더 선호 할 것이다."].map((h) => (
            <div key={h} className="flex items-start gap-1 bg-slate-50 rounded px-1.5 py-1">
              <Check size={8} className="text-emerald-500 flex-shrink-0 mt-0.5" />
              <span className="text-[10px] text-slate-700 leading-snug break-keep">{h}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="text-[10px] text-slate-400 font-semibold mb-1">📋 설문 문항</div>
        <div className="text-[10px] text-slate-500 leading-snug break-keep">20문항 자동 생성</div>
      </div>
    </div>
  );
}

function StepMockup3() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-left">
      <div className="flex items-center gap-2 mb-2.5">
        <Users size={13} className="text-sky-500" />
        <span className="text-xs font-semibold text-slate-700">가상인구 매칭</span>
      </div>
      <div className="space-y-1 mb-2.5">
        {[
          { label: "지역", val: "서울·경기" },
          { label: "연령", val: "20~50" },
          { label: "성별", val: "남성, 여성" },
        ].map((r) => (
          <div key={r.label} className="flex items-center justify-between text-[10px] bg-slate-50 rounded px-2 py-1">
            <span className="text-slate-400">{r.label}</span>
            <span className="text-slate-700 font-medium">{r.val}</span>
          </div>
        ))}
      </div>
      <div className="bg-emerald-50 rounded-lg p-2 flex items-center justify-between">
        <span className="text-[10px] text-emerald-600 font-medium">응답 시뮬레이션</span>
        <span className="text-xs font-bold text-emerald-700">500명</span>
      </div>
    </div>
  );
}

function StepMockup4() {
  const bars = [
    { label: "20대 여성 선호", pct: 53, c: "from-indigo-500 to-indigo-400", dot: "#6366f1" },
    { label: "소비재판매 선호", pct: 22, c: "from-violet-500 to-violet-400", dot: "#8b5cf6" },
    { label: "가격민감도",      pct: 32, c: "from-sky-500 to-sky-400",       dot: "#0ea5e9" },
  ];
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-left">
      <div className="flex items-center gap-1.5 mb-3">
        <BarChart2 size={13} className="text-indigo-500" />
        <span className="text-xs font-semibold text-slate-700">결과 대시보드</span>
        <span className="ml-auto text-[10px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full font-medium">완료</span>
      </div>
      <div className="space-y-2">
        {bars.map((b, i) => (
          <div key={i}>
            <div className="flex items-center gap-1.5 mb-0.5">
              <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: b.dot }} />
              <span className="text-[10px] text-slate-600 font-medium truncate">{b.label}</span>
              <span className="ml-auto text-[10px] text-slate-500 font-semibold">{b.pct}%</span>
            </div>
            <div className="bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div className={`bg-gradient-to-r ${b.c} h-1.5 rounded-full`} style={{ width: `${b.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Feature showcase — large visual cards
───────────────────────────────────────── */
function FeatureVisual1() {
  // 국가 통계 기반 지역별 가상인구 분포 (실제 화면 캡처)
  return (
    <div className="relative h-48 bg-indigo-50 overflow-hidden border-b border-indigo-100 p-4">
      <div className="relative h-full w-full">
        <Image
          src="/features/ai-population.png"
          alt="국가 통계 기반 지역별 가상인구 분포"
          fill
          sizes="(max-width: 768px) 100vw, 380px"
          className="object-contain"
          unoptimized
        />
      </div>
    </div>
  );
}

function FeatureVisual2() {
  // AI 자동 생성 — 조사 가설 + 설문 문항 (실제 화면 캡처 2장)
  return (
    <div className="relative h-48 bg-violet-50 overflow-hidden border-b border-violet-100 grid grid-cols-2 gap-2.5 p-4">
      <div className="relative rounded-lg overflow-hidden ring-1 ring-violet-200 shadow-sm bg-white">
        <Image
          src="/features/design-hypothesis.png"
          alt="AI가 자동 생성한 조사 가설"
          fill
          sizes="190px"
          className="object-cover object-top"
          unoptimized
        />
      </div>
      <div className="relative rounded-lg overflow-hidden ring-1 ring-violet-200 shadow-sm bg-white">
        <Image
          src="/features/design-questions.png"
          alt="AI가 자동 생성한 설문 문항"
          fill
          sizes="190px"
          className="object-cover object-top"
          unoptimized
        />
      </div>
    </div>
  );
}

function FeatureVisual4() {
  // 실제 상세보고서 예시 — 표지 · 문항별 분포
  return (
    <div className="relative h-48 bg-sky-50 overflow-hidden border-b border-sky-100 grid grid-cols-2 gap-2.5 p-4">
      <div className="relative rounded-lg overflow-hidden ring-1 ring-slate-200 shadow-sm">
        <Image
          src="/checkout/report-cover.png"
          alt="보고서 표지 예시"
          fill
          sizes="190px"
          className="object-cover object-top"
          unoptimized
        />
      </div>
      <div className="relative rounded-lg overflow-hidden ring-1 ring-slate-200 shadow-sm">
        <Image
          src="/checkout/report-detail.png"
          alt="문항별 응답 분포 예시"
          fill
          sizes="190px"
          className="object-cover object-top"
          unoptimized
        />
      </div>
    </div>
  );
}

function FeatureVisual5() {
  return (
    <div className="relative h-48 bg-rose-50 overflow-hidden border-b border-rose-100 p-4">
      <div className="h-full max-w-[300px] mx-auto rounded-2xl bg-white border border-rose-100 shadow-sm p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[9px] font-semibold uppercase tracking-[.14em] text-rose-400">Cost comparison</div>
            <div className="mt-0.5 text-xs font-bold text-slate-700">같은 조사, 달라진 비용</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
            <TrendingUp size={15} className="text-rose-500 rotate-180" />
          </div>
        </div>
        <div className="space-y-2.5">
          <div>
            <div className="flex items-center justify-between text-[9px] mb-1">
              <span className="text-slate-400">기존 리서치</span>
              <span className="font-semibold text-slate-400 line-through tabular-nums">₩2,000,000+</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full w-full rounded-full bg-slate-300" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-[9px] mb-1">
              <span className="font-bold text-indigo-600">Socialtwin</span>
              <span className="font-extrabold text-slate-900 tabular-nums">₩99,000</span>
            </div>
            <div className="h-2 rounded-full bg-indigo-50 overflow-hidden">
              <div className="h-full w-[5%] min-w-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-500" />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-emerald-50 border border-emerald-100 px-2.5 py-1.5">
          <span className="text-[9px] font-medium text-emerald-700">예상 절감 비용</span>
          <span className="text-xs font-extrabold text-emerald-600">95% 이상</span>
        </div>
      </div>
    </div>
  );
}

function FeatureVisualTime() {
  return (
    <div className="relative h-48 bg-amber-50 overflow-hidden border-b border-amber-100 p-4">
      <div className="relative h-full max-w-[300px] mx-auto rounded-2xl bg-white border border-amber-100 shadow-sm px-4 py-3.5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
              <Zap size={15} className="text-amber-500 fill-amber-500" />
            </div>
            <div>
              <div className="text-[9px] text-slate-400">조사 진행 시간</div>
              <div className="text-xs font-bold text-slate-700">실시간 프로세스</div>
            </div>
          </div>
          <span className="text-lg font-extrabold text-amber-500 tabular-nums">~1시간</span>
        </div>
        <div className="relative flex items-start justify-between">
          <div className="absolute top-3.5 left-4 right-4 h-0.5 bg-amber-100" />
          {[
            { label: "설문 설계", time: "5분" },
            { label: "가상 응답", time: "40분" },
            { label: "결과 분석", time: "15분" },
          ].map((step, index) => (
            <div key={step.label} className="relative z-10 w-1/3 text-center">
              <div className="w-7 h-7 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center text-[9px] font-bold ring-4 ring-white">
                {index + 1}
              </div>
              <div className="mt-2 text-[9px] font-semibold text-slate-600">{step.label}</div>
              <div className="text-[9px] text-amber-600">{step.time}</div>
            </div>
          ))}
        </div>
        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-center gap-2 rounded-full bg-slate-50 py-1 text-[9px]">
          <span className="text-slate-400 line-through">기존 4주 이상</span>
          <ArrowRight size={9} className="text-amber-500" />
          <span className="text-amber-600 font-bold">당일 결과 확인</span>
        </div>
      </div>
    </div>
  );
}

function FeatureVisualTrust() {
  const metrics = [
    { label: "분포 정합성", value: 87.0, sub: "응답 분포 유사도", color: "#10b981", bg: "bg-emerald-50", text: "text-emerald-600" },
    { label: "순위 정합성", value: 80.8, sub: "선호 순위 일치도", color: "#0d9488", bg: "bg-teal-50", text: "text-teal-600" },
  ];
  return (
    <div className="relative h-48 bg-emerald-50 overflow-hidden border-b border-emerald-100 p-4">
      <div className="h-full max-w-[300px] mx-auto rounded-2xl bg-white border border-emerald-100 shadow-sm p-3.5">
        <div className="flex items-center justify-center gap-1.5 mb-3">
          <Shield size={13} className="text-emerald-500" />
          <span className="text-[10px] font-bold text-slate-700">실제 인간 응답과 교차검증</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {metrics.map((metric) => (
            <div key={metric.label} className={`rounded-xl ${metric.bg} px-2 py-2.5 text-center`}>
              <div
                className="relative w-16 h-16 mx-auto rounded-full flex items-center justify-center"
                style={{
                  background: `conic-gradient(${metric.color} ${metric.value * 3.6}deg, #e2e8f0 0deg)`,
                }}
              >
                <div className="absolute inset-[6px] rounded-full bg-white" />
                <span className={`relative text-sm font-extrabold tabular-nums ${metric.text}`}>{metric.value.toFixed(1)}%</span>
              </div>
              <div className="mt-1.5 text-[10px] font-bold text-slate-700">{metric.label}</div>
              <div className="text-[8px] text-slate-400">{metric.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Testimonials
───────────────────────────────────────── */
const TESTIMONIALS = [
  {
    emoji: "👩‍💼",
    bg: "bg-indigo-50",
    name: "김지은",
    role: "스타트업 대표",
    text: "기존에 리서치 회사에 의뢰하면 2주, 500만원이 들었어요. Socialtwin으로 같은 수준의 인사이트를 30분 만에 얻었습니다.",
  },
  {
    emoji: "🧑‍💻",
    bg: "bg-violet-50",
    name: "박민준",
    role: "마케터",
    text: "신규 캠페인 카피를 두 가지 안으로 돌려 타겟 연령·성별별 반응을 출시 전에 비교하고 있어요. 외부 패널 없이 바로 컨셉 A/B 테스트를 돌릴 수 있어 의사결정 속도가 크게 빨라졌습니다.",
  },
  {
    emoji: "👩‍🎨",
    bg: "bg-emerald-50",
    name: "이수현",
    role: "제품 기획자",
    text: "신제품 출시 전 타겟 고객 조사를 매번 외부에 맡겼는데, 이제 팀 내부에서 직접 하고 있습니다. 속도와 비용 모두 확 줄었어요.",
  },
  {
    emoji: "🧑‍🍳",
    bg: "bg-amber-50",
    name: "정현우",
    role: "외식업 운영자",
    text: "신메뉴 출시 전에 지역·연령대별 선호도를 미리 볼 수 있어서 메뉴판 구성을 훨씬 자신 있게 잡을 수 있었어요.",
  },
  {
    emoji: "👩‍🔬",
    bg: "bg-sky-50",
    name: "최서연",
    role: "대학원생 · 연구자",
    text: "논문 사전 조사에 활용하고 있어요. 학교에서 패널을 모으는 데 들이던 시간이 거의 사라졌습니다.",
  },
  {
    emoji: "🧑‍💼",
    bg: "bg-rose-50",
    name: "강도윤",
    role: "마케팅 에이전시 디렉터",
    text: "클라이언트 제안서에 들어가는 1차 인사이트를 빠르게 뽑을 수 있어요. 발표 전날에도 부담 없이 추가 분석을 돌립니다.",
  },
];

// Use cases 로고 마퀴 — 함께한 기관. h 클래스로 시각적 크기를 통일 (가로형 로고는 낮게)
const PARTNER_LOGOS = [
  { src: "/logos/dip.svg", alt: "대구디지털혁신진흥원", w: 275, h: 32, cls: "h-6" },
  { src: "/logos/kspo.svg", alt: "국민체육진흥공단", w: 946, h: 122, cls: "h-8" },
  { src: "/logos/daegu-ccei.png", alt: "대구창조경제혁신센터", w: 249, h: 53, cls: "h-9" },
  { src: "/logos/daegu-tp.png", alt: "대구테크노파크", w: 227, h: 35, cls: "h-7" },
  { src: "/logos/kmedihub.png", alt: "대구경북첨단의료산업진흥재단", w: 186, h: 54, cls: "h-10" },
  { src: "/logos/innopolis.svg", alt: "연구개발특구진흥재단", w: 171, h: 52, cls: "h-9" },
];

const USE_CASES = [
  {
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&q=80&fit=crop",
    field: "스타트업 · 신사업",
    desc: "PMF 검증과 초기 타겟 발굴을 빠르게. 투자자 미팅 전 가설 점검까지.",
  },
  {
    image: "https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=600&q=80&fit=crop",
    field: "마케팅 · 광고",
    desc: "캠페인 메시지 A/B 사전 테스트와 타겟 페르소나 인사이트를 손쉽게.",
  },
  {
    image: "https://images.unsplash.com/photo-1606857521015-7f9fcf423740?w=600&q=80&fit=crop",
    field: "제품 기획 · PM",
    desc: "기능 우선순위, 가격 민감도, 컨셉 테스트를 출시 전에 미리 확인.",
  },
  {
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80&fit=crop",
    field: "F&B · 외식업",
    desc: "신메뉴 선호도, 객단가, 지역별 입맛 차이를 데이터로 검증.",
  },
  {
    image: "https://images.unsplash.com/photo-1481437156560-3205f6a55735?w=600&q=80&fit=crop",
    field: "리테일 · 커머스",
    desc: "신규 SKU·패키지 디자인 반응, 채널별 구매 의향을 사전 점검.",
  },
  {
    image: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=600&q=80&fit=crop",
    field: "연구 · 교육",
    desc: "논문·과제용 1차 데이터 수집과 사회 트렌드 파일럿 조사에 활용.",
  },
  {
    image: "https://images.unsplash.com/photo-1488229297570-58520851e868?w=600&q=80&fit=crop",
    field: "공공 · 정책",
    desc: "지역 주민 의견 수렴과 정책 수용도 사전 진단을 빠르게.",
  },
  {
    image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&q=80&fit=crop",
    field: "컨설팅 · 리서치",
    desc: "프로젝트 초반 시장 스캐닝과 클라이언트 보고용 인사이트 보강.",
  },
];

const steps = [
  {
    icon: <MessageSquare size={20} className="text-indigo-500" />,
    bg: "bg-indigo-50",
    num: "01",
    title: "정의 · 니즈 입력",
    desc: "제품·서비스와 알고 싶은 인사이트를 한 문장으로 입력합니다.",
    mockup: <StepMockup1 />,
  },
  {
    icon: <Sparkles size={20} className="text-violet-500" />,
    bg: "bg-violet-50",
    num: "02",
    title: "AI 가설·문항 설계",
    desc: "조사 가설을 도출하고 설문 문항을 자동 생성합니다.",
    mockup: <StepMockup2 />,
  },
  {
    icon: <Users size={20} className="text-sky-500" />,
    bg: "bg-sky-50",
    num: "03",
    title: "가상인구 매칭 · 실행",
    desc: "KOSIS 가상인구 중 타겟을 매칭해 응답 시뮬레이션을 실행합니다.",
    mockup: <StepMockup3 />,
  },
  {
    icon: <BarChart2 size={20} className="text-emerald-500" />,
    bg: "bg-emerald-50",
    num: "04",
    title: "대시보드 · 보고서",
    desc: "교차분석 차트와 PDF 보고서로 결과를 1시간 안에 확인합니다.",
    mockup: <StepMockup4 />,
  },
];

const features = [
  {
    title: "1. AI 가상인구",
    desc: "국가 통계 데이터로 지역, 성별, 연령, 소득 등 20만여개의 통계를 활용하여 가상인구를 생성합니다.",
    visual: <FeatureVisual1 />,
  },
  {
    title: "2. AI 자동 설계",
    desc: "조사 목적을 한 문장만 입력하면 AI가 가설·문항·선택지를 자동 생성합니다. 설문 설계 전문 지식이 필요 없습니다.",
    visual: <FeatureVisual2 />,
  },
  {
    title: "3. 인사이트 · 보고서",
    desc: "성별, 소득, 연령대 등 세그먼트별 비교를 통해 한눈에 시각화 합니다.",
    visual: <FeatureVisual4 />,
  },
  {
    title: "4. 압도적 속도",
    desc: "기존 리서치가 4주 이상 걸리던 일을 약 1시간 만에 결과 대시보드로 확인합니다.",
    visual: <FeatureVisualTime />,
  },
  {
    title: "5. 20분의 1 비용",
    desc: "기존 리서치 회사 의뢰 대비 95% 이상 저렴한 가격. 자동결제 없이 필요한 만큼만 결제합니다.",
    visual: <FeatureVisual5 />,
  },
  {
    title: "6. 검증된 신뢰도",
    desc: "생성된 가상인구의 응답을 실제 인간 응답 대비 검증합니다. 분포 정합성 87.0%, 순위 정합성 80.8%.",
    visual: <FeatureVisualTrust />,
  },
];

/* ─────────────────────────────────────────
   Page
───────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar dark />
      {/* 무료 쿠폰 링크로 들어온 방문자에게만 보이는 안내 (보관 토큰 없으면 렌더 안 함) */}
      <FreeCouponBanner />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden mesh-bg noise min-h-[88vh] sm:min-h-[92vh] flex items-center">
        {/* 브랜드 키비주얼 — 회사 소개서와 같은 결(검정 바탕 + 주황 광선).
            기존 mesh-bg 를 지우지 않고 그 위에 얹는다. 아래로 갈수록 진하게 덮어
            흰 제목·본문 대비를 지키고, 바닥은 다음 섹션(흰색)으로 자연스럽게 넘긴다. */}
        <div aria-hidden className="absolute inset-0">
          <Image src="/brand-keyvisual.webp" alt="" fill priority sizes="100vw"
                 className="object-cover object-center opacity-70" />
          <div className="absolute inset-0 bg-[#080812]/55" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080812] via-[#080812]/55 to-transparent" />
        </div>
        <div
          className="absolute inset-0 opacity-[.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-5 sm:px-6 py-16 sm:py-24 w-full">
          <div className="grid lg:grid-cols-[1fr_1.25fr] gap-12 items-center">
            <div>
              <div className="animate-fade-up inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass text-indigo-300 text-xs font-semibold mb-7 border border-indigo-500/30">
                <span className="relative flex h-2 w-2">
                  <span className="animate-pulse-ring absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-400" />
                </span>
                국가통계 데이터 기반 AI가상인구
              </div>
              <h1 className="animate-fade-up-2 text-4xl sm:text-5xl lg:text-[64px] font-extrabold leading-[1.1] tracking-tight text-white mb-6">
                빠르고 쉬운<br />
                <span className="text-shimmer">AI 고객조사</span>
              </h1>
              <p className="animate-fade-up-3 text-base sm:text-lg text-slate-400 leading-relaxed mb-10 max-w-md">
                AI가 설문을 설계하고, 가상인구가 응답합니다.{" "}<br className="hidden sm:inline" />
                <span className="text-slate-200 font-medium">기존 고객조사 대비 95% 이상 저렴한 비용</span>으로{" "}<br className="hidden sm:inline" />
                <span className="text-slate-200 font-medium">1시간 안에</span> 인사이트를 얻으세요.
              </p>
              <div className="animate-fade-up-4 mb-12">
                <div className="flex flex-wrap gap-3">
                  <CtaLink className="btn-primary">
                    조사 시작하기 <ArrowRight size={16} />
                  </CtaLink>
                </div>
              </div>
              <div className="animate-fade-up-4 flex flex-wrap items-center gap-5 text-sm text-slate-500">
                {["국가 통계 기반", "AI가상인구", "1시간이내 결과 확인"].map((t) => (
                  <div key={t} className="flex items-center gap-1.5">
                    <Check size={14} className="text-emerald-400" /> {t}
                  </div>
                ))}
              </div>
            </div>
            <div className="relative hidden lg:block">
              <HeroVideo />
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ── How it works ── */}
      <section id="how" className="py-20 md:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <Reveal className="text-center mb-12 sm:mb-16">
            <div className="inline-block text-indigo-600 text-xs font-bold uppercase tracking-[.15em] bg-indigo-50 px-3 py-1.5 rounded-full mb-4">
              How it works
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-4">
              4단계로 완성되는 AI 고객조사
            </h2>
            <p className="text-base sm:text-lg text-slate-500 max-w-xl mx-auto">
              여러분은 단 두 문장만 입력하시면 됩니다.
            </p>
          </Reveal>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <Reveal key={step.num} delay={i * 80}>
                <div className="flex flex-col h-full">
                  {/* 단계 라벨 */}
                  <div className="text-left mb-3">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${step.bg} text-slate-700`}>
                      {i + 1}단계
                    </span>
                  </div>
                  <div className="group bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex-1 flex flex-col">
                    {/* Mini mockup screenshot — 고정 높이로 4개 박스를 시각적으로 동일하게 */}
                    <div className="bg-slate-50 border-b border-slate-100 p-4 h-52 flex items-center justify-center">
                      <div className="w-full">{step.mockup}</div>
                    </div>
                    {/* Text — flex-1 로 텍스트 영역 높이 균일화 */}
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex items-center justify-between mb-3">
                        <div className={`w-9 h-9 rounded-xl ${step.bg} flex items-center justify-center`}>
                          {step.icon}
                        </div>
                        <span className="text-xs font-bold text-slate-200 tabular-nums">{step.num}</span>
                      </div>
                      <h3 className="text-[15px] font-semibold text-slate-900 mb-2 break-keep">{step.title}</h3>
                      <p className="text-sm text-slate-500 leading-relaxed break-keep">{step.desc}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features with images ── */}
      <section id="features" className="py-20 md:py-28 bg-slate-50">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <Reveal className="text-center mb-12 sm:mb-16">
            <div className="inline-block text-violet-600 text-xs font-bold uppercase tracking-[.15em] bg-violet-50 px-3 py-1.5 rounded-full mb-4">
              Features
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-4">
              기존 리서치와 무엇이 다를까요?
            </h2>
            <p className="text-base sm:text-lg text-slate-500 max-w-xl mx-auto">
              AI와 가상인구 기술이 결합된 완전히 새로운 시장조사 방식입니다.
            </p>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 60}>
                <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  {f.visual}
                  <div className="p-5">
                    <h3 className="text-[15px] font-semibold text-slate-900 mb-2">{f.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* ── 가상인구의 정체 + 저작권 등록 (홍보용 신뢰 근거) ──
              등록증 원본은 회사 홈페이지(omninode)의 이미지/certs 와 동일 파일.

              문구 원칙 두 가지 (바꿀 때 반드시 지킬 것):
              ① 주인공은 "국가통계 기반 초정밀 합성데이터"다. 등록증은 그 뒤를 받치는
                 근거로만 쓴다. "권리를 보유한 자산" 처럼 소유권을 앞세우면 홍보가 아니라
                 "함부로 쓰지 말라"는 경고로 읽힌다.
              ② 등록증 기재사항만 쓴다. 저작권·DB제작자권리 등록은 '권리 등록'이지
                 성능 심사·인증이 아니므로 "국가가 성능을 인정" 류의 표현은 넣지 않는다. */}
          <Reveal delay={200}>
            <div className="mt-14 sm:mt-16 rounded-3xl border border-slate-200 bg-white p-6 sm:p-9">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-1.5 text-emerald-700 text-xs font-bold uppercase tracking-[.15em] bg-emerald-50 px-3 py-1.5 rounded-full mb-4">
                  <Shield size={13} /> 국가통계 기반 합성데이터
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight break-keep">
                  AI가 지어낸 인구가 아닙니다.<br />
                  국가통계로 재현한 <span className="text-indigo-600">대한민국</span>입니다
                </h3>
                {/* 문장 단위로 줄을 끊는다 — sm 이상에서만 <br> 적용, 모바일은 자연스럽게 흐르게 둔다 */}
                <p className="mt-3 text-sm sm:text-base text-slate-500 max-w-3xl mx-auto leading-relaxed break-keep">
                  Socialtwin의 가상인구는 AI가 상상해 만들어낸 가짜 프로필이 아닙니다.
                  <br className="hidden sm:block" />
                  통계청·공공데이터의 국가통계를 기반으로 대한민국의 인구·사회·생활 구조를 그대로 모방해 만든{" "}
                  <strong className="font-semibold text-slate-700">초정밀 합성데이터</strong>입니다.
                  <br className="hidden sm:block" />
                  그 데이터베이스와 이를 구동하는 시뮬레이션 소프트웨어는 한국저작권위원회에 각각 등록을 마쳤습니다.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                {[
                  {
                    kicker: "데이터베이스제작자권리 등록증",
                    no: "제 D-2026-000156 호",
                    title: "Socialtwin 가상인구 데이터베이스",
                    meta: [
                      ["제작연월일", "2026.06.09"],
                      ["등록연월일", "2026.09.03"],
                      ["근거", "저작권법 제98조"],
                    ] as const,
                    thumb: "/certs/cert-db-thumb.jpg",
                    full: "/certs/cert-db.jpg",
                    alt: "Socialtwin 가상인구 데이터베이스 제작자권리 등록증",
                  },
                  {
                    kicker: "저작권 등록증",
                    no: "제 C-2026-042596 호",
                    title: "Socialtwin 시뮬레이션 S/W",
                    meta: [
                      ["창작연월일", "2026.08.20"],
                      ["등록연월일", "2026.09.01"],
                      ["근거", "저작권법 제53조"],
                    ] as const,
                    thumb: "/certs/cert-copyright-thumb.jpg",
                    full: "/certs/cert-copyright.jpg",
                    alt: "Socialtwin 컴퓨터프로그램(시뮬레이션 S/W) 저작권 등록증",
                  },
                ].map((c) => (
                  <div
                    key={c.no}
                    className="flex gap-4 sm:gap-5 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5"
                  >
                    <a
                      href={c.full}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group shrink-0"
                      aria-label={`${c.alt} 원본 크게 보기`}
                    >
                      <Image
                        src={c.thumb}
                        alt={c.alt}
                        width={600}
                        height={849}
                        className="w-20 sm:w-24 h-auto rounded-lg border border-slate-200 bg-white shadow-sm transition-transform duration-300 group-hover:scale-105"
                      />
                      <span className="mt-1.5 block text-center text-[10px] text-slate-400 group-hover:text-indigo-600">
                        크게 보기
                      </span>
                    </a>
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                        {c.kicker}
                      </div>
                      <h4 className="mt-1 text-[15px] font-semibold text-slate-900 break-keep">
                        {c.title}
                      </h4>
                      <div className="mt-0.5 font-mono text-xs text-slate-400">{c.no}</div>
                      <dl className="mt-3 space-y-1">
                        {c.meta.map(([k, v]) => (
                          <div key={k} className="flex gap-2 text-xs">
                            <dt className="w-16 shrink-0 text-slate-400">{k}</dt>
                            <dd className="font-medium text-slate-600">{v}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  </div>
                ))}
              </div>

              <p className="mt-6 text-center text-xs text-slate-400 break-keep">
                저작자·데이터베이스제작자 : 주식회사 옴니노드 · 발급 : 한국저작권위원회
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Comparison ── */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-4xl mx-auto px-5 sm:px-6">
          <Reveal className="text-center mb-10 sm:mb-12">
            <div className="inline-block text-amber-600 text-xs font-bold uppercase tracking-[.15em] bg-amber-50 px-3 py-1.5 rounded-full mb-4">
              Comparison
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">기존 방식과 비교</h2>
          </Reveal>
          <Reveal delay={100}>
            {(() => {
              const HLOld = ({ children }: { children: React.ReactNode }) => (
                <span className="inline-block bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-semibold">
                  {children}
                </span>
              );
              const HLNew = ({ children }: { children: React.ReactNode }) => (
                <span className="inline-block bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-semibold">
                  {children}
                </span>
              );
              const rows: Array<{
                label: string;
                old: React.ReactNode;
                neu: React.ReactNode;
              }> = [
                { label: "결과", old: "고객 100명 설문조사 결과 보고서", neu: "고객 100명 설문조사 결과 보고서" },
                { label: "비용", old: "건당 200만원 이상", neu: "95% 이상 절감(99,000원)" },
                { label: "시간", old: "4주 이상", neu: "1시간 이내" },
                { label: "설문 설계", old: "전문가 필요", neu: "AI 자동 설계" },
                { label: "응답자 모집", old: "응답 패널 직접 모집", neu: "가상인구에서 즉시 추출" },
                {
                  label: "편향",
                  old: (
                    <ul className="space-y-2 text-left list-disc pl-4 marker:text-slate-300">
                      <li>사회적 시선을 의식한 <HLOld>의식적 거짓 답변</HLOld></li>
                      <li>질문자 의도에 맞추는 <HLOld>맹목적 순응/동조</HLOld></li>
                      <li>주관적 기준에 따른 <HLOld>척도 점수 왜곡</HLOld></li>
                    </ul>
                  ),
                  neu: (
                    <ul className="space-y-2 text-left list-disc pl-4 marker:text-indigo-300">
                      <li>자아 방어 기제가 없는 <HLNew>객관적 통계 확률 추론</HLNew></li>
                      <li>프로필 규칙 기반의 <HLNew>감정적 독립성 유지</HLNew></li>
                      <li>특허 알고리즘(CA-IPF) 기반의 <HLNew>데이터 표준화</HLNew></li>
                    </ul>
                  ),
                },
              ];
              return (
                <>
                  {/* 모바일 — 카드 스택 (라벨 / 기존 / Socialtwin 세로 배치) */}
                  <div className="md:hidden flex flex-col gap-3">
                    {rows.map(({ label, old, neu }) => {
                      const oldIsText = typeof old === "string";
                      const neuIsText = typeof neu === "string";
                      return (
                        <div key={label} className="rounded-2xl border border-slate-200 shadow-sm overflow-hidden bg-white">
                          <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                            <span className="text-sm font-bold text-slate-800">{label}</span>
                          </div>
                          <div className="px-4 py-3 border-b border-slate-100">
                            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">기존방식의 고객조사</div>
                            {oldIsText ? (
                              <p className="text-sm text-slate-600 leading-relaxed">{old}</p>
                            ) : (
                              <div className="text-sm text-slate-600 leading-relaxed break-keep">{old}</div>
                            )}
                          </div>
                          <div className="px-4 py-3 bg-indigo-50/60">
                            <div className="text-sm font-extrabold text-indigo-600 uppercase tracking-wider mb-1.5">Socialtwin</div>
                            {neuIsText ? (
                              <p className="text-sm font-semibold text-indigo-700 leading-relaxed">{neu}</p>
                            ) : (
                              <div className="text-sm text-indigo-700 leading-relaxed break-keep">{neu}</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* 데스크톱 — 기존 테이블 */}
                  <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                    <table className="w-full text-sm bg-white table-fixed">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="text-left p-4 text-slate-400 font-medium text-xs w-[18%]" />
                          <th className="text-center p-4 font-semibold text-slate-500 text-xs w-[41%]">기존방식의 고객조사</th>
                          <th className="text-center p-4 w-[41%] bg-indigo-50">
                            <span className="font-extrabold text-indigo-600 text-base sm:text-lg tracking-wide">Socialtwin</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map(({ label, old, neu }) => {
                          const oldIsText = typeof old === "string";
                          const neuIsText = typeof neu === "string";
                          return (
                            <tr key={label} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                              <td className="p-4 text-slate-700 font-semibold text-sm align-top">{label}</td>
                              <td className={`p-4 text-sm align-top ${oldIsText ? "text-center text-slate-400" : "text-slate-600 leading-relaxed break-keep"}`}>
                                {old}
                              </td>
                              <td className="p-4 align-top bg-indigo-50/50">
                                {neuIsText ? (
                                  <div className="text-center font-semibold text-indigo-600 text-sm">{neu}</div>
                                ) : (
                                  <div className="text-indigo-700 text-sm leading-relaxed break-keep">{neu}</div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              );
            })()}
          </Reveal>
        </div>
      </section>

      {/* ── Use Cases ── */}
      <section id="use-cases" className="py-20 md:py-28 bg-white scroll-mt-20">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <Reveal className="text-center mb-12 sm:mb-14">
            <div className="inline-block text-sky-600 text-xs font-bold uppercase tracking-[.15em] bg-sky-50 px-3 py-1.5 rounded-full mb-4">
              Use cases
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-3">
              이런 분야에서 사용하고 있어요
            </h2>
            <p className="text-base sm:text-lg text-slate-500 max-w-xl mx-auto">
              스타트업부터 공공기관까지,<br className="hidden sm:block" /> 의사결정이 필요한 모든 자리에 Socialtwin이 함께합니다.
            </p>
          </Reveal>
          {/* 기관 로고 마퀴 — 두 벌을 이어 붙여 -50% 이동으로 무한 루프 */}
          <Reveal className="mb-12 sm:mb-16">
            <div
              className="overflow-hidden"
              style={{
                maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
                WebkitMaskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
              }}
            >
              <div className="flex w-max animate-marquee">
                {[0, 1].map((copy) => (
                  <div key={copy} aria-hidden={copy === 1} className="flex items-center gap-16 pr-16">
                    {PARTNER_LOGOS.map((l) => (
                      <Image
                        key={l.src}
                        src={l.src}
                        alt={copy === 0 ? l.alt : ""}
                        width={l.w}
                        height={l.h}
                        unoptimized
                        className={`${l.cls} w-auto max-w-none`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {USE_CASES.map((u, i) => (
              <Reveal key={u.field} delay={i * 60}>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 h-full flex flex-col">
                  <div className="relative h-32 bg-slate-100 overflow-hidden">
                    <Image
                      src={u.image}
                      alt={u.field}
                      fill
                      sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 to-transparent" />
                    <div className="absolute bottom-2 left-3 right-3">
                      <span className="inline-block px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[11px] font-semibold text-slate-800 shadow-sm">
                        {u.field}
                      </span>
                    </div>
                  </div>
                  <div className="p-5 flex-1">
                    <p className="text-sm text-slate-500 leading-relaxed">{u.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-20 md:py-28 bg-slate-50">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <Reveal className="text-center mb-12 sm:mb-14">
            <div className="inline-block text-emerald-600 text-xs font-bold uppercase tracking-[.15em] bg-emerald-50 px-3 py-1.5 rounded-full mb-4">
              USE CASES
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              활용 사례
            </h2>
          </Reveal>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.name} delay={i * 80}>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-shadow h-full flex flex-col">
                  <p className="text-sm text-slate-600 leading-relaxed flex-1 mb-6">
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div
                      aria-hidden
                      className={`w-10 h-10 rounded-full ${t.bg} ring-2 ring-slate-100 flex items-center justify-center text-xl leading-none`}
                    >
                      {t.emoji}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{t.role}</div>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing (잠시 비공개) ── */}
      {false && (
      <section id="pricing" className="py-28 relative overflow-hidden mesh-bg noise">
        <div className="absolute inset-0 opacity-[.04]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.4) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.4) 1px,transparent 1px)", backgroundSize: "40px 40px" }}
        />
        <div className="relative max-w-5xl mx-auto px-6">
          <Reveal className="text-center mb-14">
            <div className="inline-block text-indigo-300 text-xs font-bold uppercase tracking-[.15em] bg-indigo-500/15 border border-indigo-500/20 px-3 py-1.5 rounded-full mb-4">
              Pricing
            </div>
            <h2 className="text-4xl font-bold text-white tracking-tight mb-3">자동결제 없음, 필요한 만큼만</h2>
            <p className="text-slate-400 text-lg">조사 한 건당 결제하거나, 30일권으로 기간 내 무제한 이용하세요. 자동으로 갱신되는 정기결제는 없습니다.</p>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { name: "기본", price: "9,900", desc: "가볍게 시작하는 첫 조사", features: ["설문 문항 5개", "응답자 500명", "차트 대시보드", "CSV 다운로드"], highlight: false },
              { name: "스탠다드", price: "19,900", desc: "더 깊은 인사이트가 필요할 때", features: ["설문 문항 15개", "응답자 2,000명", "세그먼트 교차분석", "PDF 보고서 자동 생성", "지역별 비교 분석"], highlight: true },
              { name: "프리미엄", price: "49,900", desc: "전문 수준의 심층 조사", features: ["설문 문항 무제한", "응답자 10,000명", "심층 인터뷰 시뮬레이션", "모든 분석 포함", "AI 인사이트 리포트"], highlight: false },
            ].map((plan, i) => (
              <Reveal key={plan.name} delay={i * 80}>
                <div className={`rounded-2xl p-7 h-full flex flex-col ${plan.highlight ? "bg-indigo-600 ring-1 ring-indigo-400/40 shadow-2xl shadow-indigo-900/60" : "glass"}`}>
                  {plan.highlight && (
                    <div className="inline-flex w-fit items-center gap-1 bg-white/20 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white mb-4">
                      <Zap size={10} className="fill-white" /> 가장 인기
                    </div>
                  )}
                  <div className={`text-xs font-semibold mb-1 ${plan.highlight ? "text-indigo-200" : "text-slate-400"}`}>{plan.name}</div>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-4xl font-extrabold tracking-tight text-white">₩{plan.price}</span>
                    <span className={`text-sm ${plan.highlight ? "text-indigo-200" : "text-slate-400"}`}>/건</span>
                  </div>
                  <p className={`text-sm mb-7 ${plan.highlight ? "text-indigo-200" : "text-slate-400"}`}>{plan.desc}</p>
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className={`flex items-start gap-2.5 text-sm ${plan.highlight ? "text-indigo-100" : "text-slate-300"}`}>
                        <Check size={15} className={`flex-shrink-0 mt-0.5 ${plan.highlight ? "text-indigo-300" : "text-emerald-400"}`} /> {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/login" className={`block text-center py-3 rounded-xl font-semibold text-sm transition-all ${plan.highlight ? "bg-white text-indigo-600 hover:bg-indigo-50 shadow-lg" : "glass border border-white/20 text-white hover:bg-white/10"}`}>
                    시작하기
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* ── CTA ── 좌(비주얼) / 우(텍스트·버튼) 2분할 */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* 왼쪽 — 실제 상세보고서 예시 (배경 없이 이미지 강조) */}
            <Reveal>
              <div className="flex flex-col gap-3">
                {/* 상세보고서 예시 3종 — 동일 크기 3열 배치 */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { src: "/checkout/report-cover.png", alt: "보고서 표지 예시" },
                    { src: "/checkout/report-summary.png", alt: "상세보고서 '조사결과 요약' 페이지 예시" },
                    { src: "/checkout/report-detail.png", alt: "문항별 응답 분포 예시" },
                  ].map((img) => (
                    <div key={img.src} className="relative aspect-[3/4] rounded-xl overflow-hidden ring-1 ring-slate-200 shadow-lg bg-white">
                      <Image
                        src={img.src}
                        alt={img.alt}
                        fill
                        sizes="(max-width: 1024px) 30vw, 200px"
                        className="object-cover object-top"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-400 text-center">
                  ▲ 실제 상세보고서 예시 (표지·요약·문항별 분포)
                </p>
                <div className="flex justify-start">
                  <div className="inline-flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-[.15em] bg-indigo-50 px-3 py-1.5 rounded-full">
                    상세보고서 <span className="text-[10px] font-semibold normal-case bg-indigo-600 text-white px-1.5 py-0.5 rounded-full">30페이지 분량</span>
                  </div>
                </div>
                {/* 결제창에서 가져온 상세보고서 포함 내역 — 그림 아래 배치 */}
                <ul className="mt-3 grid sm:grid-cols-2 gap-x-5 gap-y-2.5">
                  {[
                    "핵심 지표(KPI)·가설 검증 요약",
                    "가상인구 패널 인구통계 정보",
                    "문항별 응답 분포 (전 문항)",
                    "시장반응·세그먼트·가격·전략 심층 분석",
                    "원본 자료(Raw Data) 제공",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-slate-600">
                      <span className="mt-0.5 shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-600">
                        <Check size={12} strokeWidth={3} />
                      </span>
                      <span className="text-sm">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            {/* 오른쪽 — 텍스트 + CTA (결제창 상세보고서 설명 반영) */}
            <Reveal delay={120}>
              <div className="lg:pl-4">
                <div className="mb-5 flex items-end justify-between gap-4">
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 tracking-tight leading-tight">
                    지금 바로<br />
                    시작해보세요
                  </h2>
                  <CtaLink className="btn-primary shrink-0 text-base px-8 py-4">
                    조사 시작하기 <ArrowRight size={18} />
                  </CtaLink>
                </div>
                <StartCtaButtons />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <SiteFooter />
    </div>
  );
}
