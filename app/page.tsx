import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight, Sparkles, BarChart2, Users, FileText,
  Zap, Globe, Brain, Check, TrendingUp, Clock,
  ChevronRight, Shield, MessageSquare, Play,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Reveal from "@/components/Reveal";
import CtaLink from "@/components/CtaLink";

/* ─────────────────────────────────────────
   Hero — floating app mockup
───────────────────────────────────────── */
function HeroMockup() {
  const bars = [
    { label: "아이스 아메리카노", w: 82 },
    { label: "카페 라떼",        w: 54 },
    { label: "프라푸치노",       w: 34 },
    { label: "기타",             w: 30 },
  ];
  return (
    <div className="animate-float relative">
      <div className="glass rounded-2xl overflow-hidden shadow-2xl shadow-black/60 w-full max-w-lg mx-auto">
        {/* Window chrome */}
        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/8">
          <div className="w-3 h-3 rounded-full bg-red-400/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
          <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
          <div className="flex-1 mx-4 bg-white/8 rounded-full h-4" />
        </div>
        <div className="p-5">
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[
              { v: "500명", l: "응답자" }, { v: "95%", l: "신뢰도" },
              { v: "3분", l: "소요" },     { v: "A+", l: "품질" },
            ].map((k) => (
              <div key={k.l} className="bg-white/6 rounded-xl p-3 text-center">
                <div className="text-sm font-bold text-white">{k.v}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{k.l}</div>
              </div>
            ))}
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <div className="text-[11px] font-semibold text-slate-400 mb-3 uppercase tracking-wider">선호 음료</div>
            <div className="space-y-2.5">
              {bars.map((b) => (
                <div key={b.label} className="flex items-center gap-3">
                  <div className="w-24 text-[10px] text-slate-400 truncate">{b.label}</div>
                  <div className="flex-1 bg-white/8 rounded-full h-2">
                    <div className="bg-gradient-to-r from-indigo-500 to-violet-500 h-2 rounded-full" style={{ width: `${b.w}%` }} />
                  </div>
                  <div className="text-[10px] text-slate-400 w-6">{Math.round(b.w / 2)}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Floating chips */}
      <div className="absolute -top-3 -right-3 flex items-center gap-1.5 bg-emerald-500 text-white rounded-full px-3 py-1.5 text-xs font-semibold shadow-lg shadow-emerald-500/40">
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block" /> 분석 완료
      </div>
      <div className="absolute -bottom-5 -left-5 glass-light rounded-2xl p-3 shadow-xl max-w-[210px]">
        <div className="flex items-start gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <Sparkles size={13} className="text-indigo-600" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-medium mb-0.5">AI 설계 완료</div>
            <div className="text-xs text-slate-800 leading-relaxed">"20대 여성 카페 선호도" 조사가 설계되었습니다</div>
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
        <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mb-1">제품/서비스 정의</div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
          <span className="text-[11px] text-slate-600 leading-tight">20대 여성을 위한 비건 카페</span>
        </div>
      </div>
      <div>
        <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mb-1">조사 니즈</div>
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-2.5 py-1.5">
          <span className="text-[11px] text-indigo-700 leading-tight">메뉴 선호도와 가격 민감도를 알고 싶어요</span>
        </div>
      </div>
    </div>
  );
}

function StepMockup2() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-left">
      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-6 h-6 rounded-lg bg-violet-100 flex items-center justify-center">
          <Sparkles size={12} className="text-violet-600" />
        </div>
        <span className="text-xs font-semibold text-slate-700">AI 설계 중</span>
        <span className="ml-auto text-[10px] text-emerald-600 font-semibold">2/2</span>
      </div>
      <div className="mb-2">
        <div className="text-[10px] text-slate-400 font-semibold mb-1">📌 가설</div>
        <div className="space-y-1">
          {["가격보다 비건 인증을 더 중시한다", "SNS 후기가 방문 결정에 영향"].map((h) => (
            <div key={h} className="flex items-start gap-1.5 bg-slate-50 rounded px-1.5 py-1">
              <Check size={8} className="text-emerald-500 flex-shrink-0 mt-0.5" />
              <span className="text-[10px] text-slate-700 leading-tight">{h}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="text-[10px] text-slate-400 font-semibold mb-1">📋 문항</div>
        <div className="text-[10px] text-slate-500 leading-tight">총 12문항 자동 생성</div>
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
          { label: "연령", val: "20-29" },
          { label: "성별", val: "여성" },
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
  const bars = [{ w: "82%", c: "from-indigo-500 to-indigo-400" }, { w: "54%", c: "from-violet-500 to-violet-400" }, { w: "34%", c: "from-sky-500 to-sky-400" }];
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-left">
      <div className="flex items-center gap-1.5 mb-3">
        <BarChart2 size={13} className="text-indigo-500" />
        <span className="text-xs font-semibold text-slate-700">결과 대시보드</span>
        <span className="ml-auto text-[10px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full font-medium">완료</span>
      </div>
      <div className="space-y-2.5">
        {bars.map((b, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: ["#6366f1","#8b5cf6","#0ea5e9"][i] }} />
            <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
              <div className={`bg-gradient-to-r ${b.c} h-2 rounded-full`} style={{ width: b.w }} />
            </div>
            <span className="text-[10px] text-slate-400 w-5">{[41,27,17][i]}%</span>
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
  return (
    <div className="relative h-48 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl overflow-hidden">
      <Image
        src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80&fit=crop"
        alt="데이터 분석 대시보드"
        fill
        className="object-cover opacity-60"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
      <div className="absolute bottom-3 left-3 right-3">
        <div className="flex gap-2">
          {["KOSIS", "행정안전부", "통계청"].map((t) => (
            <span key={t} className="px-2 py-1 bg-white/15 backdrop-blur-sm rounded-full text-white text-[10px] font-medium border border-white/20">{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeatureVisual2() {
  return (
    <div className="relative h-48 bg-gradient-to-br from-violet-800 to-indigo-900 rounded-xl overflow-hidden">
      <div className="absolute inset-0 flex flex-col justify-end p-4">
        <div className="glass rounded-xl p-3">
          <div className="text-[10px] text-slate-300 mb-1.5 font-medium">AI 설계 중 — 설문 3/5 생성</div>
          <div className="space-y-1.5">
            {["카페 방문 빈도를 선택해주세요", "선호하는 음료 종류는?"].map((q) => (
              <div key={q} className="flex items-center gap-2 bg-white/10 rounded-lg px-2.5 py-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                <span className="text-[10px] text-white">{q}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureVisual3() {
  return (
    <div className="relative h-48 bg-gradient-to-br from-sky-800 to-slate-900 rounded-xl overflow-hidden">
      <Image
        src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80&fit=crop"
        alt="데이터 시각화"
        fill
        className="object-cover opacity-50"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent" />
      <div className="absolute bottom-3 left-3 right-3">
        <div className="flex gap-2">
          {[
            { label: "교차분석", color: "bg-sky-500" },
            { label: "세그먼트", color: "bg-violet-500" },
            { label: "트렌드", color: "bg-emerald-500" },
          ].map((t) => (
            <div key={t.label} className="flex items-center gap-1 px-2 py-1 bg-white/15 backdrop-blur-sm rounded-full border border-white/20">
              <div className={`w-1.5 h-1.5 rounded-full ${t.color}`} />
              <span className="text-white text-[10px] font-medium">{t.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeatureVisual4() {
  return (
    <div className="relative h-48 bg-gradient-to-br from-emerald-800 to-slate-900 rounded-xl overflow-hidden">
      <Image
        src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&q=80&fit=crop"
        alt="보고서"
        fill
        className="object-cover opacity-50"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent" />
      <div className="absolute bottom-3 left-3">
        <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/20">
          <FileText size={14} className="text-emerald-300" />
          <div>
            <div className="text-white text-xs font-semibold">보고서 준비됨</div>
            <div className="text-slate-300 text-[10px]">PDF 12페이지</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureVisual5() {
  return (
    <div className="relative h-48 bg-gradient-to-br from-amber-700 to-slate-900 rounded-xl overflow-hidden">
      <Image
        src="https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=600&q=80&fit=crop"
        alt="결제"
        fill
        className="object-cover opacity-40"
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl font-extrabold text-white">₩9,900</div>
          <div className="text-slate-300 text-sm mt-1">건당 · 구독 없음</div>
        </div>
      </div>
    </div>
  );
}

function FeatureVisual6() {
  // 17개 시도 — 한반도 형태에 가깝게 배치 (정렬된 grid로 약식 표현)
  const rows = [
    ["서울", "인천", "경기", "강원"],
    ["대전", "세종", "충북", "충남"],
    ["광주", "전북", "전남"],
    ["대구", "경북", "부산", "울산", "경남"],
    ["제주"],
  ];
  return (
    <div className="relative h-48 bg-gradient-to-br from-indigo-600 via-violet-700 to-slate-900 rounded-xl overflow-hidden">
      {/* 장식 — 부드러운 원형 글로우 */}
      <div className="absolute top-0 left-1/4 w-32 h-32 bg-rose-400/20 rounded-full blur-2xl" />
      <div className="absolute bottom-0 right-0 w-40 h-40 bg-indigo-400/20 rounded-full blur-3xl" />
      {/* 그리드 점 — 지도 같은 배경 */}
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)", backgroundSize: "16px 16px" }} />

      <div className="relative h-full flex flex-col items-center justify-center px-4 py-3">
        {/* 17개 시도 뱃지 — 행마다 가운데 정렬해 반도형 분포 느낌 */}
        <div className="flex flex-col items-center gap-1 mb-2">
          {rows.map((row, ri) => (
            <div key={ri} className="flex gap-1 justify-center">
              {row.map((r) => (
                <span
                  key={r}
                  className="px-1.5 py-0.5 text-[9px] font-medium text-white bg-white/15 backdrop-blur-sm rounded border border-white/20"
                >
                  {r}
                </span>
              ))}
            </div>
          ))}
        </div>
        <div className="mt-1 text-center">
          <div className="text-[10px] text-white/60 font-semibold tracking-widest">17 SIDO · KOSIS</div>
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
    text: "AI가 설문을 설계해준다는 게 처음엔 반신반의했는데, 나보다 더 잘 짜더라고요. 특히 교차분석 결과가 인상적이었습니다.",
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
    image: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=600&q=80&fit=crop",
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
    title: "제품 정의 + 조사 니즈 입력",
    desc: "제품·서비스 정보와 알고 싶은 인사이트를 한 줄로 입력합니다.",
    mockup: <StepMockup1 />,
  },
  {
    icon: <Sparkles size={20} className="text-violet-500" />,
    bg: "bg-violet-50",
    num: "02",
    title: "AI가 가설·문항 자동 설계",
    desc: "조사 가설을 도출하고, 검증을 위한 객관식 문항을 자동으로 생성합니다.",
    mockup: <StepMockup2 />,
  },
  {
    icon: <Users size={20} className="text-sky-500" />,
    bg: "bg-sky-50",
    num: "03",
    title: "가상인구 타겟 매칭 + 실행",
    desc: "KOSIS 통계 기반 가상인구 중 타겟을 매칭해 즉시 응답 시뮬레이션을 돌립니다.",
    mockup: <StepMockup3 />,
  },
  {
    icon: <BarChart2 size={20} className="text-emerald-500" />,
    bg: "bg-emerald-50",
    num: "04",
    title: "인사이트 대시보드·보고서",
    desc: "교차분석 차트와 PDF 보고서로 결과를 5분 안에 확인합니다.",
    mockup: <StepMockup4 />,
  },
];

const features = [
  { title: "실제 통계 기반 가상인구", desc: "KOSIS·행정안전부 데이터로 지역·연령·소득이 반영된 가상인구를 제공합니다.", visual: <FeatureVisual1 /> },
  { title: "AI 자동 설계", desc: "조사 목적을 이해하고 최적의 설문 구조와 문항을 자동으로 생성합니다.", visual: <FeatureVisual2 /> },
  { title: "인사이트 대시보드", desc: "교차분석, 소득·연령대별 세그먼트 비교를 한눈에 시각화합니다.", visual: <FeatureVisual3 /> },
  { title: "PDF 보고서 자동 생성", desc: "클라이언트에게 바로 전달 가능한 깔끔한 보고서를 원클릭으로 다운로드합니다.", visual: <FeatureVisual4 /> },
  { title: "건당 결제, 구독 없음", desc: "필요할 때만 사용하세요. 월정액 없이 조사 한 건당 결제합니다.", visual: <FeatureVisual5 /> },
  { title: "전국 17개 시도 지원", desc: "서울·경기부터 제주까지 지역별 특성이 반영된 가상인구 풀을 제공합니다.", visual: <FeatureVisual6 /> },
];

/* ─────────────────────────────────────────
   Page
───────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar dark />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden mesh-bg noise min-h-[92vh] flex items-center">
        <div
          className="absolute inset-0 opacity-[.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative max-w-6xl mx-auto px-6 py-24 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="animate-fade-up inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass text-indigo-300 text-xs font-semibold mb-7 border border-indigo-500/30">
                <span className="relative flex h-2 w-2">
                  <span className="animate-pulse-ring absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-400" />
                </span>
                Beta · 가상인구 100만명+ 데이터 기반
              </div>
              <h1 className="animate-fade-up-2 text-5xl lg:text-[64px] font-extrabold leading-[1.1] tracking-tight text-white mb-6">
                한 문장으로<br />
                <span className="text-shimmer">AI 시장조사</span>
              </h1>
              <p className="animate-fade-up-3 text-lg text-slate-400 leading-relaxed mb-10 max-w-md">
                AI가 설문을 설계하고, 가상인구가 응답합니다.{" "}<br />
                <span className="text-slate-200 font-medium">기존 리서치 대비 10분의 1 비용</span>으로{" "}<br />
                <span className="text-slate-200 font-medium">5분 안에</span> 인사이트를 얻으세요.
              </p>
              <div className="animate-fade-up-4 flex flex-wrap gap-3 mb-12">
                <CtaLink className="btn-primary">
                  무료로 체험하기 <ArrowRight size={16} />
                </CtaLink>
                <Link href="#how" className="btn-ghost">
                  <Play size={14} className="fill-white/80" /> 작동 방식 보기
                </Link>
              </div>
              <div className="animate-fade-up-4 flex flex-wrap items-center gap-5 text-sm text-slate-500">
                {["국가 통계 연동", "AI 설계", "결제 후 30분 내 결과"].map((t) => (
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
      <section id="how" className="py-28 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal className="text-center mb-16">
            <div className="inline-block text-indigo-600 text-xs font-bold uppercase tracking-[.15em] bg-indigo-50 px-3 py-1.5 rounded-full mb-4">
              How it works
            </div>
            <h2 className="text-4xl font-bold text-slate-900 tracking-tight">
              4단계로 완성되는 시장조사
            </h2>
          </Reveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <Reveal key={step.num} delay={i * 80}>
                <div className="group bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
                  {/* Mini mockup screenshot */}
                  <div className="bg-slate-50 border-b border-slate-100 p-4">
                    {step.mockup}
                  </div>
                  {/* Text */}
                  <div className="p-5 flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-9 h-9 rounded-xl ${step.bg} flex items-center justify-center`}>
                        {step.icon}
                      </div>
                      <span className="text-xs font-bold text-slate-200 tabular-nums">{step.num}</span>
                    </div>
                    <h3 className="text-[15px] font-semibold text-slate-900 mb-2">{step.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden lg:flex justify-center mt-[-52px] relative z-10 pointer-events-none">
                  </div>
                )}
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features with images ── */}
      <section id="features" className="py-28 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal className="text-center mb-16">
            <div className="inline-block text-violet-600 text-xs font-bold uppercase tracking-[.15em] bg-violet-50 px-3 py-1.5 rounded-full mb-4">
              Features
            </div>
            <h2 className="text-4xl font-bold text-slate-900 tracking-tight mb-4">
              기존 리서치와 무엇이 다를까요?
            </h2>
            <p className="text-lg text-slate-500 max-w-xl mx-auto">
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
      <section className="py-28 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <Reveal className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 tracking-tight">기존 방식과 비교</h2>
          </Reveal>
          <Reveal delay={100}>
            <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
              <table className="w-full text-sm bg-white">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left p-4 text-slate-400 font-medium text-xs w-1/3" />
                    <th className="text-center p-4 font-semibold text-slate-500 text-xs w-1/3">기존 온라인 설문</th>
                    <th className="text-center p-4 w-1/3 bg-indigo-50">
                      <span className="font-bold text-indigo-600 text-xs">Socialtwin</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["비용", "100만원+", "건당 ₩9,900~"],
                    ["소요 시간", "수 일 ~ 수 주", "약 30분"],
                    ["설문 설계", "전문가 필요", "AI 자동 설계"],
                    ["응답자 모집", "패널 직접 모집", "가상인구 즉시"],
                    ["지역 세분화", "추가 비용 발생", "17개 시도 기본"],
                    ["보고서", "별도 제작 필요", "PDF 자동 생성"],
                  ].map(([item, old, neu]) => (
                    <tr key={item} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                      <td className="p-4 text-slate-600 font-medium text-sm">{item}</td>
                      <td className="p-4 text-center text-slate-400 text-sm">{old}</td>
                      <td className="p-4 text-center bg-indigo-50/50">
                        <span className="font-semibold text-indigo-600 text-sm">{neu}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Use Cases ── */}
      <section className="py-28 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal className="text-center mb-14">
            <div className="inline-block text-sky-600 text-xs font-bold uppercase tracking-[.15em] bg-sky-50 px-3 py-1.5 rounded-full mb-4">
              Use cases
            </div>
            <h2 className="text-4xl font-bold text-slate-900 tracking-tight mb-3">
              이런 분야에서 사용하고 있어요
            </h2>
            <p className="text-lg text-slate-500 max-w-xl mx-auto">
              스타트업부터 공공기관까지,<br></br> 의사결정이 필요한 모든 자리에 Socialtwin이 함께합니다.
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
      <section className="py-28 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal className="text-center mb-14">
            <div className="inline-block text-emerald-600 text-xs font-bold uppercase tracking-[.15em] bg-emerald-50 px-3 py-1.5 rounded-full mb-4">
              Testimonials
            </div>
            <h2 className="text-4xl font-bold text-slate-900 tracking-tight">
              이미 쓰고 있는 분들의 이야기
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
      <section className="py-28 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* 왼쪽 — CSS 대시보드 미리보기 */}
            <Reveal>
              <div className="relative aspect-[4/3] rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-700 to-slate-900 overflow-hidden shadow-2xl shadow-indigo-200">
                {/* 글로우 장식 */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-rose-400/20 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-sky-400/20 rounded-full blur-3xl" />
                {/* 격자 점 배경 */}
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)", backgroundSize: "20px 20px" }} />

                {/* 내부 카드 — 가상 대시보드 미리보기 */}
                <div className="absolute inset-6 md:inset-8 flex flex-col gap-3">
                  {/* 상단 헤더 */}
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/15">
                    <BarChart2 size={14} className="text-white" />
                    <span className="text-[11px] text-white font-semibold">분석 대시보드</span>
                    <span className="ml-auto px-2 py-0.5 rounded-full bg-emerald-400/30 text-emerald-100 text-[9px] font-bold">완료</span>
                  </div>
                  {/* 차트 카드 */}
                  <div className="flex-1 bg-white rounded-2xl p-4 flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-slate-700">선호 메뉴 분포</span>
                      <span className="text-[10px] text-slate-400">N=500</span>
                    </div>
                    <div className="flex-1 space-y-2.5">
                      {[
                        { label: "비건 라떼", pct: 82, color: "from-indigo-500 to-violet-500" },
                        { label: "곡물 스무디", pct: 64, color: "from-violet-500 to-rose-500" },
                        { label: "콜드브루", pct: 47, color: "from-rose-500 to-amber-500" },
                        { label: "허브티", pct: 28, color: "from-emerald-500 to-sky-500" },
                      ].map((b) => (
                        <div key={b.label} className="flex items-center gap-2">
                          <div className="w-20 text-[10px] text-slate-600 truncate">{b.label}</div>
                          <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div className={`bg-gradient-to-r ${b.color} h-2 rounded-full`} style={{ width: `${b.pct}%` }} />
                          </div>
                          <div className="w-7 text-[10px] text-slate-500 text-right tabular-nums">{b.pct}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* 하단 칩 */}
                  <div className="flex gap-2">
                    {["KOSIS", "AI 가설", "PDF"].map((t) => (
                      <span key={t} className="flex-1 text-center px-2 py-1.5 bg-white/15 backdrop-blur-sm rounded-lg border border-white/20 text-white text-[10px] font-medium">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>

            {/* 오른쪽 — 텍스트 + CTA */}
            <Reveal delay={120}>
              <div className="lg:pl-4">
                <div className="inline-block text-indigo-600 text-xs font-bold uppercase tracking-[.15em] bg-indigo-50 px-3 py-1.5 rounded-full mb-5">
                  Get started
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-5 leading-tight">
                  오늘 바로<br />
                  시작해보세요
                </h2>
                <p className="text-lg text-slate-500 mb-8 leading-relaxed">
                  가입 즉시 무료로 시장조사를 설계하고, AI가 만든 가상인구 응답을 확인할 수 있습니다.
                </p>
                <ul className="space-y-2 mb-9">
                  {[
                    "신용카드 등록 없이 시작",
                    "5분 안에 첫 조사 결과",
                    "PDF 보고서 자동 생성",
                  ].map((t) => (
                    <li key={t} className="flex items-center gap-2 text-sm text-slate-600">
                      <Check size={14} className="text-emerald-500 flex-shrink-0" />
                      {t}
                    </li>
                  ))}
                </ul>
                <CtaLink className="btn-primary text-base px-8 py-4">
                  무료 체험 시작 <ArrowRight size={18} />
                </CtaLink>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-100 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center">
            <Image
              src="/omninode.png"
              alt="Omninode"
              width={120}
              height={36}
              className="h-9 w-auto object-contain"
            />
          </div>
          <div className="flex gap-6 text-sm text-slate-400">
            {["이용약관", "개인정보처리방침", "문의하기"].map((l) => (
              <Link key={l} href="#" className="hover:text-slate-700 transition-colors">{l}</Link>
            ))}
          </div>
          <div className="text-sm text-slate-400">© 2026 Omninode</div>
        </div>
      </footer>
    </div>
  );
}
