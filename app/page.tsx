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

/* ─────────────────────────────────────────
   Hero — floating app mockup
───────────────────────────────────────── */
function HeroMockup() {
  // 메인 화면 캡처(대시보드) + 상세보고서 3장(부채꼴 플로팅)
  // unoptimized: UI 스크린샷은 webp 압축 없이 원본 PNG로 표시해 글자를 선명하게 유지
  const reports = [
    { src: "/checkout/report-cover.png", alt: "상세보고서 표지 예시", rot: "-rotate-[10deg]", ml: "" },
    { src: "/checkout/report-summary.png", alt: "상세보고서 요약 예시", rot: "-rotate-[2deg]", ml: "-ml-14" },
    { src: "/checkout/report-detail.png", alt: "문항별 분포 예시", rot: "rotate-[7deg]", ml: "-ml-14" },
  ];
  return (
    <div className="animate-float relative max-w-lg mx-auto">
      {/* 메인 — 분석 대시보드 화면 */}
      <div className="relative z-10 rounded-2xl overflow-hidden ring-1 ring-white/20 shadow-2xl shadow-black/60 bg-white">
        {/* 윈도우 크롬 */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 border-b border-slate-200">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <div className="flex-1 mx-3 bg-white rounded-full h-3.5 border border-slate-200" />
        </div>
        <Image
          src="/features/hero-dashboard.png"
          alt="분석 대시보드 화면"
          width={793}
          height={688}
          className="w-full h-auto"
          sizes="520px"
          priority
          unoptimized
        />
      </div>
      {/* 플로팅 — 상세보고서 3장 부채꼴 + 분석완료 칩 (우하단, 칩은 부채꼴 우상단) */}
      <div className="absolute z-20 -bottom-14 -right-6">
        <div className="relative">
          {/* 부채꼴 스택 */}
          <div className="flex items-end">
            {reports.map((r) => (
              <div
                key={r.src}
                className={`relative w-32 h-44 ${r.ml} ${r.rot} rounded-lg overflow-hidden ring-1 ring-white/40 shadow-xl shadow-black/40 bg-white`}
              >
                <Image src={r.src} alt={r.alt} fill sizes="128px" className="object-cover object-top" unoptimized />
              </div>
            ))}
          </div>
          {/* 칩 — 부채꼴 우상단 */}
          <div className="absolute z-30 -top-3 -right-3 flex items-center gap-1.5 bg-emerald-500 text-white rounded-full px-3 py-1.5 text-xs font-semibold shadow-lg shadow-emerald-500/40">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block" /> 분석 완료
          </div>
        </div>
      </div>
    </div>
  );
}

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
    <div className="relative h-48 bg-rose-50 overflow-hidden border-b border-rose-100">
      <div className="absolute inset-0 p-4 flex flex-col items-center justify-center gap-3">
        {/* 좌(기존) → 우(Socialtwin) 비교 카드 */}
        <div className="flex items-stretch gap-2 w-full max-w-[300px]">
          <div className="flex-1 bg-white rounded-lg px-2 py-2 border border-slate-200 text-center flex flex-col justify-center">
            <div className="text-[8px] text-slate-400 mb-0.5 uppercase tracking-wider">기존 리서치</div>
            <div className="text-base font-bold text-slate-400 line-through tabular-nums">₩100만+</div>
          </div>
          <div className="flex items-center">
            <ArrowRight size={14} className="text-rose-400" />
          </div>
          <div className="relative flex-1 bg-white rounded-lg px-2 py-2 border border-indigo-200 text-center shadow-sm">
            <div className="text-[8px] text-indigo-500 mb-0.5 uppercase tracking-wider font-bold">Socialtwin</div>
            <div className="text-[10px] text-slate-400 line-through tabular-nums leading-none">₩99,000</div>
            <div className="flex items-center justify-center gap-1 mt-0.5">
              <span className="text-base font-extrabold text-slate-900 tabular-nums leading-tight">₩49,500</span>
              <span className="inline-block bg-rose-500 text-white text-[8px] font-extrabold px-1 py-0.5 rounded-md shadow-sm leading-none">
                50% OFF
              </span>
            </div>
          </div>
        </div>
        {/* 절감 배지 */}
        <div className="inline-flex items-center gap-1.5 bg-emerald-50 rounded-full px-3 py-1 border border-emerald-200">
          <TrendingUp size={11} className="text-emerald-500" style={{ transform: "rotate(180deg)" }} />
          <span className="text-emerald-600 text-[10px] font-bold">기존 대비 95% 절감</span>
        </div>
      </div>
    </div>
  );
}

function FeatureVisualTime() {
  return (
    <div className="relative h-48 bg-amber-50 overflow-hidden border-b border-amber-100">
      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-white rounded-full px-2.5 py-1 border border-slate-200 shadow-sm">
        <Clock size={11} className="text-amber-500" />
        <span className="text-slate-600 text-[10px] font-medium">실시간</span>
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl font-extrabold text-slate-900 tracking-tight">
            ~1<span className="text-2xl font-bold ml-0.5">시간</span>
          </div>
          <div className="text-slate-500 text-sm mt-1">결제 후 결과 확인까지</div>
        </div>
      </div>
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-center gap-2 text-[10px]">
        <span className="text-slate-400 line-through">기존 2주 이상</span>
        <ArrowRight size={10} className="text-emerald-500" />
        <span className="text-emerald-600 font-semibold">Socialtwin 1시간</span>
      </div>
    </div>
  );
}

function FeatureVisualTrust() {
  return (
    <div className="relative h-48 bg-emerald-50 overflow-hidden border-b border-emerald-100">
      <div className="absolute inset-0 p-4 flex flex-col justify-center gap-2.5">
        {/* 핵심 수치 — 정합성 95% 강조 */}
        <div className="flex items-end justify-center gap-1.5">
          <span className="text-4xl font-extrabold text-emerald-700 tracking-tight tabular-nums leading-none">95%</span>
          <span className="text-[11px] text-emerald-600/80 font-medium mb-0.5">정합성</span>
        </div>
        {/* 실 패널 vs Socialtwin 비교 막대 — 흰 패널로 대비 확보 */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-3 py-2.5 space-y-1.5 max-w-[280px] mx-auto w-full">
          <div className="flex items-center gap-2">
            <span className="w-16 text-[9px] text-slate-500 text-right">실 패널 조사</span>
            <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
              <div className="bg-slate-300 h-2 rounded-full" style={{ width: "100%" }} />
            </div>
            <span className="w-9 text-[9px] text-slate-500 text-right tabular-nums">100%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-16 text-[9px] text-emerald-600 text-right font-semibold">Socialtwin</span>
            <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full"
                style={{ width: "95%" }}
              />
            </div>
            <span className="w-9 text-[9px] text-emerald-600 text-right font-bold tabular-nums">95%</span>
          </div>
        </div>
        {/* 캡션 */}
        <div className="text-center flex items-center justify-center gap-1.5">
          <Shield size={10} className="text-emerald-500" />
          <span className="text-emerald-600 text-[10px] font-medium">KOSIS 인구통계 분포 반영</span>
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
    desc: "기존 리서치가 2주 이상 걸리던 일을 약 1시간 만에 결과 대시보드로 확인합니다.",
    visual: <FeatureVisualTime />,
  },
  {
    title: "5. 20분의 1 비용",
    desc: "기존 리서치 회사 의뢰 대비 95% 이상 저렴한 가격. 월 구독 없이 조사 한 건당 결제합니다.",
    visual: <FeatureVisual5 />,
  },
  {
    title: "6. 검증된 신뢰도",
    desc: "실제 인구통계 분포에 맞춰 시뮬레이션하므로 실 패널 조사 결과와 95% 이상의 정합성을 보입니다.",
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

      {/* ── Hero ── */}
      <section className="relative overflow-hidden mesh-bg noise min-h-[88vh] sm:min-h-[92vh] flex items-center">
        <div
          className="absolute inset-0 opacity-[.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative max-w-6xl mx-auto px-5 sm:px-6 py-16 sm:py-24 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
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
              <div className="animate-fade-up-4 flex flex-wrap gap-3 mb-12">
                <CtaLink className="btn-primary">
                  무료 체험하기 <ArrowRight size={16} />
                </CtaLink>
              </div>
              <div className="animate-fade-up-4 flex flex-wrap items-center gap-5 text-sm text-slate-500">
                {["국가 통계 기반", "AI가상인구", "1시간이내 결과 확인"].map((t) => (
                  <div key={t} className="flex items-center gap-1.5">
                    <Check size={14} className="text-emerald-400" /> {t}
                  </div>
                ))}
              </div>
            </div>
            <div className="relative hidden lg:block px-8">
              <HeroMockup />
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
                { label: "결과", old: "고객 100명 설문조사 결과 보고서", neu: "고객 500명 설문조사 결과 보고서" },
                { label: "비용", old: "건당 100만원 이상", neu: "95% 이상 절감" },
                { label: "시간", old: "2주 이상", neu: "1시간 이내" },
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
                      <div className="text-sm font-semibold text-slate-900">{t.name}</div>
                      <div className="text-xs text-slate-400">{t.role}</div>
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
            <h2 className="text-4xl font-bold text-white tracking-tight mb-3">구독 없음, 건당 결제</h2>
            <p className="text-slate-400 text-lg">필요할 때만 사용하세요. 월정액 부담이 없습니다.</p>
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
                {/* 결제창에서 가져온 상세보고서 포함 내역 — 그림 아래 배치 */}
                <ul className="mt-3 grid sm:grid-cols-2 gap-x-5 gap-y-2.5">
                  {[
                    "핵심 지표(KPI)·가설 검증 요약",
                    "가상인구 패널 인구통계 정보",
                    "문항별 응답 분포 (전 문항)",
                    "시장반응·세그먼트·가격·전략 심층 분석",
                    "원본 데이터(Raw Data) 포함",
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
                <div className="inline-flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-[.15em] bg-indigo-50 px-3 py-1.5 rounded-full mb-5">
                  상세보고서 <span className="text-[10px] font-semibold normal-case bg-indigo-600 text-white px-1.5 py-0.5 rounded-full">30페이지 분량</span>
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-5 leading-tight">
                  지금 바로<br />
                  시작해보세요
                </h2>
                <p className="text-base sm:text-lg text-slate-500 mb-9 leading-relaxed">
                  가상패널 응답을 심층 분석한 진단 리포트와 원본 데이터를 모두 받아보세요.
                </p>
                <CtaLink className="btn-primary text-base px-8 py-4">
                  무료 체험하기 <ArrowRight size={18} />
                </CtaLink>
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
