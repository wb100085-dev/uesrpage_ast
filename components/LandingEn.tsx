/**
 * 영문 랜딩 (English 선택 시 app/page.tsx 가 LangSwitch 로 한국어 랜딩 대신 렌더).
 *
 * 한국어 랜딩과 뼈대(히어로 → 진행 순서 → 차별성 → 비교 → 활용 → CTA)는 같게 두되,
 * 메시지는 "한국 시장에 진출하기 전에 먼저 조사해 보라"는 해외 기업 대상 포지셔닝으로 바꿨다.
 * 한국어 화면 캡처는 영어 방문자에게 혼란을 주므로 쓰지 않고, 같은 내용을 영문 목업으로 그린다.
 *
 * 문구 원칙(한국어 랜딩과 동일):
 *  - 저작권·DB제작자권리 등록은 '권리 등록'이지 성능 인증이 아니다 → "certified accuracy" 류 표현 금지.
 *  - 해외카드 결제 지원 여부가 확정되지 않았으므로 결제 수단은 약속하지 않는다.
 */
import Image from "next/image";
import {
  ArrowRight, Sparkles, BarChart2, Users, Zap, Globe, Check, TrendingUp, Shield,
  MessageSquare, MapPin, Wallet, Store, Megaphone, Target, Languages, FileText,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Reveal from "@/components/Reveal";
import CtaLink from "@/components/CtaLink";
import SiteFooter from "@/components/SiteFooter";
import StartCtaButtons from "@/components/StartCtaButtons";
import HeroVideo from "@/components/HeroVideo";

/* ─────────────────────────────────────────
   How it works — mini mockups (English)
───────────────────────────────────────── */
function StepMockup1() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-left">
      <div className="mb-2.5">
        <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mb-1">Product / service</div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5">
          <span className="text-[11px] text-slate-700 leading-snug">US plant-based protein snack</span>
        </div>
      </div>
      <div>
        <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mb-1">What you want to learn</div>
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-2 py-1.5">
          <span className="text-[11px] text-indigo-700 leading-snug">Who buys it in Korea, preferred flavors, price sensitivity</span>
        </div>
      </div>
    </div>
  );
}

function StepMockup2() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-left">
      <div className="flex items-center gap-1.5 mb-2.5">
        <div className="w-6 h-6 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
          <Sparkles size={12} className="text-violet-600" />
        </div>
        <span className="text-xs font-semibold text-slate-700">AI is designing</span>
        <span className="ml-auto text-[10px] text-emerald-600 font-semibold">2/2</span>
      </div>
      <div className="mb-2">
        <div className="text-[10px] text-slate-400 font-semibold mb-1">📌 Hypotheses</div>
        <div className="space-y-1">
          {[
            "Women in their 20s–30s will show the highest purchase intent.",
            "Convenience stores will be the preferred channel.",
          ].map((h) => (
            <div key={h} className="flex items-start gap-1 bg-slate-50 rounded px-1.5 py-1">
              <Check size={8} className="text-emerald-500 flex-shrink-0 mt-0.5" />
              <span className="text-[10px] text-slate-700 leading-snug">{h}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="text-[10px] text-slate-400 font-semibold mb-1">📋 Survey</div>
        <div className="text-[10px] text-slate-500 leading-snug">20 questions generated</div>
      </div>
    </div>
  );
}

function StepMockup3() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-left">
      <div className="flex items-center gap-2 mb-2.5">
        <Users size={13} className="text-sky-500" />
        <span className="text-xs font-semibold text-slate-700">Virtual Korean panel</span>
      </div>
      <div className="space-y-1 mb-2.5">
        {[
          { label: "Region", val: "Seoul · Gyeonggi" },
          { label: "Age", val: "20–50" },
          { label: "Gender", val: "Male, Female" },
        ].map((r) => (
          <div key={r.label} className="flex items-center justify-between text-[10px] bg-slate-50 rounded px-2 py-1">
            <span className="text-slate-400">{r.label}</span>
            <span className="text-slate-700 font-medium">{r.val}</span>
          </div>
        ))}
      </div>
      <div className="bg-emerald-50 rounded-lg p-2 flex items-center justify-between">
        <span className="text-[10px] text-emerald-600 font-medium">Simulated responses</span>
        <span className="text-xs font-bold text-emerald-700">500</span>
      </div>
    </div>
  );
}

function StepMockup4() {
  const bars = [
    { label: "Intent · women 20s–30s", pct: 53, c: "from-indigo-500 to-indigo-400", dot: "#6366f1" },
    { label: "Prefer convenience stores", pct: 41, c: "from-violet-500 to-violet-400", dot: "#8b5cf6" },
    { label: "OK at ₩3,000 or less", pct: 32, c: "from-sky-500 to-sky-400", dot: "#0ea5e9" },
  ];
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-left">
      <div className="flex items-center gap-1.5 mb-3">
        <BarChart2 size={13} className="text-indigo-500" />
        <span className="text-xs font-semibold text-slate-700">Results dashboard</span>
        <span className="ml-auto text-[10px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full font-medium">Done</span>
      </div>
      <div className="space-y-2">
        {bars.map((b) => (
          <div key={b.label}>
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
   Feature visuals (English)
───────────────────────────────────────── */
function FeatureVisualPopulation() {
  // 한국어 랜딩의 지역별 가상인구 화면 캡처(features/ai-population.png)를 영문으로 다시 그린 것
  const regions = [
    { name: "Gyeonggi", n: "13,631" },
    { name: "Seoul", n: "9,386" },
    { name: "Busan", n: "3,293" },
    { name: "S. Gyeongsang", n: "3,245" },
    { name: "Incheon", n: "3,010" },
    { name: "N. Gyeongsang", n: "2,543" },
  ];
  return (
    <div className="relative h-48 bg-indigo-50 overflow-hidden border-b border-indigo-100 p-4">
      <div className="grid grid-cols-3 gap-2 h-full content-center">
        {regions.map((r) => (
          <div key={r.name} className="rounded-lg bg-white border border-indigo-100 shadow-sm px-2 py-1.5">
            <div className="flex items-center gap-1 text-[9px] text-slate-500 font-semibold truncate">
              <MapPin size={8} className="text-indigo-400 shrink-0" /> {r.name}
            </div>
            <div className="text-sm font-extrabold text-violet-600 tabular-nums leading-tight">{r.n}</div>
            <div className="text-[8px] text-slate-400">virtual residents</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeatureVisualDesign() {
  return (
    <div className="relative h-48 bg-violet-50 overflow-hidden border-b border-violet-100 p-4">
      <div className="h-full max-w-[300px] mx-auto rounded-2xl bg-white border border-violet-100 shadow-sm p-3.5 flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <Sparkles size={12} className="text-violet-500" />
          <span className="text-[10px] font-bold text-slate-700">Q4 · Single choice</span>
        </div>
        <p className="text-[11px] font-semibold text-slate-800 leading-snug">
          Where would you most likely buy a protein snack?
        </p>
        <div className="space-y-1">
          {["Convenience store", "Online (Coupang, Naver)", "Supermarket", "Gym or health store"].map((o, i) => (
            <div key={o} className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] ${i === 0 ? "bg-violet-100 text-violet-700 font-semibold" : "bg-slate-50 text-slate-600"}`}>
              <span className={`w-2.5 h-2.5 rounded-full border ${i === 0 ? "border-violet-500 bg-violet-500" : "border-slate-300"}`} />
              {o}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeatureVisualReport() {
  const rows = [
    { seg: "Women 20s", v: 61 },
    { seg: "Women 30s", v: 47 },
    { seg: "Men 20s", v: 38 },
    { seg: "Men 30s", v: 29 },
  ];
  return (
    <div className="relative h-48 bg-sky-50 overflow-hidden border-b border-sky-100 p-4">
      <div className="h-full max-w-[300px] mx-auto rounded-2xl bg-white border border-sky-100 shadow-sm p-3.5">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[10px] font-bold text-slate-700">Purchase intent by segment</span>
          <span className="text-[9px] text-sky-600 font-semibold">n = 500</span>
        </div>
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.seg} className="flex items-center gap-2">
              <span className="w-16 shrink-0 text-[9px] text-slate-500">{r.seg}</span>
              <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500" style={{ width: `${r.v}%` }} />
              </div>
              <span className="w-7 text-right text-[9px] font-bold text-slate-600 tabular-nums">{r.v}%</span>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-lg bg-sky-50 px-2 py-1.5 text-[9px] text-sky-700 leading-snug">
          Insight: lead with women in their 20s in Seoul &amp; Gyeonggi.
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
              <div className="text-[9px] text-slate-400">Study turnaround</div>
              <div className="text-xs font-bold text-slate-700">Live process</div>
            </div>
          </div>
          <span className="text-lg font-extrabold text-amber-500 tabular-nums">~1 hr</span>
        </div>
        <div className="relative flex items-start justify-between">
          <div className="absolute top-3.5 left-4 right-4 h-0.5 bg-amber-100" />
          {[
            { label: "Design", time: "5 min" },
            { label: "Responses", time: "40 min" },
            { label: "Analysis", time: "15 min" },
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
          <span className="text-slate-400 line-through">4+ weeks</span>
          <ArrowRight size={9} className="text-amber-500" />
          <span className="text-amber-600 font-bold">Same-day results</span>
        </div>
      </div>
    </div>
  );
}

function FeatureVisualCost() {
  return (
    <div className="relative h-48 bg-rose-50 overflow-hidden border-b border-rose-100 p-4">
      <div className="h-full max-w-[300px] mx-auto rounded-2xl bg-white border border-rose-100 shadow-sm p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[9px] font-semibold uppercase tracking-[.14em] text-rose-400">Cost comparison</div>
            <div className="mt-0.5 text-xs font-bold text-slate-700">Same study, different bill</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
            <TrendingUp size={15} className="text-rose-500 rotate-180" />
          </div>
        </div>
        <div className="space-y-2.5">
          <div>
            <div className="flex items-center justify-between text-[9px] mb-1">
              <span className="text-slate-400">Local research agency</span>
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
          <span className="text-[9px] font-medium text-emerald-700">Estimated savings</span>
          <span className="text-xs font-extrabold text-emerald-600">95%+</span>
        </div>
      </div>
    </div>
  );
}

function FeatureVisualTrust() {
  const metrics = [
    { label: "Distribution match", value: 87.0, sub: "response distribution similarity", color: "#10b981", bg: "bg-emerald-50", text: "text-emerald-600" },
    { label: "Ranking match", value: 80.8, sub: "preference ranking agreement", color: "#0d9488", bg: "bg-teal-50", text: "text-teal-600" },
  ];
  return (
    <div className="relative h-48 bg-emerald-50 overflow-hidden border-b border-emerald-100 p-4">
      <div className="h-full max-w-[300px] mx-auto rounded-2xl bg-white border border-emerald-100 shadow-sm p-3.5">
        <div className="flex items-center justify-center gap-1.5 mb-3">
          <Shield size={13} className="text-emerald-500" />
          <span className="text-[10px] font-bold text-slate-700">Cross-checked against real human responses</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {metrics.map((metric) => (
            <div key={metric.label} className={`rounded-xl ${metric.bg} px-2 py-2.5 text-center`}>
              <div
                className="relative w-16 h-16 mx-auto rounded-full flex items-center justify-center"
                style={{ background: `conic-gradient(${metric.color} ${metric.value * 3.6}deg, #e2e8f0 0deg)` }}
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
   Content
───────────────────────────────────────── */
const WHY_KOREA = [
  {
    icon: <TrendingUp size={20} className="text-indigo-500" />,
    bg: "bg-indigo-50",
    title: "Trends move fast",
    desc: "Korean consumers adopt — and drop — products quickly. Check that your concept fits today's tastes before you spend on localization.",
  },
  {
    icon: <Users size={20} className="text-violet-500" />,
    bg: "bg-violet-50",
    title: "Seoul isn't the whole country",
    desc: "Age, region and income shape preferences sharply. Find the segment that actually wants your product, instead of guessing.",
  },
  {
    icon: <Wallet size={20} className="text-sky-500" />,
    bg: "bg-sky-50",
    title: "Price expectations are specific",
    desc: "Test willingness to pay in KRW and see where you sit against the local alternatives Koreans already use.",
  },
  {
    icon: <Languages size={20} className="text-emerald-500" />,
    bg: "bg-emerald-50",
    title: "Local research is slow and costly",
    desc: "Agencies need Korean-language panels, translation and four weeks or more. Socialtwin runs in English and delivers in about an hour.",
  },
];

const steps = [
  {
    icon: <MessageSquare size={20} className="text-indigo-500" />,
    bg: "bg-indigo-50",
    num: "01",
    title: "Describe your product",
    desc: "Tell us what you sell and what you need to know about Korea — in English.",
    mockup: <StepMockup1 />,
  },
  {
    icon: <Sparkles size={20} className="text-violet-500" />,
    bg: "bg-violet-50",
    num: "02",
    title: "AI designs hypotheses & questions",
    desc: "AI drafts the hypotheses worth testing and writes the survey for you.",
    mockup: <StepMockup2 />,
  },
  {
    icon: <Users size={20} className="text-sky-500" />,
    bg: "bg-sky-50",
    num: "03",
    title: "Virtual Koreans respond",
    desc: "We match your target from a virtual population built on Korean national statistics and simulate their answers.",
    mockup: <StepMockup3 />,
  },
  {
    icon: <BarChart2 size={20} className="text-emerald-500" />,
    bg: "bg-emerald-50",
    num: "04",
    title: "Dashboard & English report",
    desc: "Segment charts and a shareable report — in English, within about an hour.",
    mockup: <StepMockup4 />,
  },
];

const QUESTIONS_TO_ANSWER = [
  { icon: <Target size={18} className="text-indigo-500" />, title: "Is there real demand?", desc: "Purchase intent — and the reasons behind it — across Korean consumer segments." },
  { icon: <Users size={18} className="text-violet-500" />, title: "Who is my first customer?", desc: "The age, gender, region and income groups that respond best to your offer." },
  { icon: <Wallet size={18} className="text-sky-500" />, title: "What price will work?", desc: "Acceptable price ranges in KRW and how sensitive each segment is to price." },
  { icon: <Store size={18} className="text-amber-500" />, title: "Which channel?", desc: "Online marketplaces, convenience stores, department stores or direct — where Koreans expect to find you." },
  { icon: <Megaphone size={18} className="text-rose-500" />, title: "Which message lands?", desc: "Compare positioning and copy before you commit to an ad budget." },
  { icon: <Globe size={18} className="text-emerald-500" />, title: "What holds people back?", desc: "Concerns, entrenched local competitors and what would make customers switch." },
];

const INDUSTRIES = [
  "Consumer goods", "Food & beverage", "Beauty & personal care", "Retail & e-commerce",
  "SaaS & B2B", "Education", "Health & wellness", "Franchising",
];

const features = [
  {
    title: "1. A virtual Korea",
    desc: "Virtual respondents generated from 200,000+ Korean national statistics on region, gender, age, income and more.",
    visual: <FeatureVisualPopulation />,
  },
  {
    title: "2. AI survey design — in English",
    desc: "Describe your goal in a few sentences. AI drafts hypotheses, questions and answer options. No research expertise needed.",
    visual: <FeatureVisualDesign />,
  },
  {
    title: "3. Segment insights & reports",
    desc: "Compare answers by gender, age, region and income at a glance, then share a detailed report with your team.",
    visual: <FeatureVisualReport />,
  },
  {
    title: "4. About an hour",
    desc: "What takes a research agency four weeks or more lands in your results dashboard in about an hour.",
    visual: <FeatureVisualTime />,
  },
  {
    title: "5. 1/20 of the cost",
    desc: "95%+ less than commissioning a local research agency. No subscription — pay only for the studies you run.",
    visual: <FeatureVisualCost />,
  },
  {
    title: "6. Validated reliability",
    desc: "We validate virtual responses against real human responses: 87.0% distribution match and 80.8% ranking match.",
    visual: <FeatureVisualTrust />,
  },
];

const PARTNER_LOGOS = [
  { src: "/logos/dip.svg", alt: "Daegu Digital Innovation Promotion Agency", w: 275, h: 32, cls: "h-6" },
  { src: "/logos/kspo.svg", alt: "Korea Sports Promotion Foundation", w: 946, h: 122, cls: "h-8" },
  { src: "/logos/daegu-ccei.png", alt: "Daegu Center for Creative Economy & Innovation", w: 249, h: 53, cls: "h-9" },
  { src: "/logos/daegu-tp.png", alt: "Daegu Technopark", w: 227, h: 35, cls: "h-7" },
  { src: "/logos/kmedihub.png", alt: "Daegu-Gyeongbuk Medical Innovation Foundation (K-MEDI hub)", w: 186, h: 54, cls: "h-10" },
  { src: "/logos/innopolis.svg", alt: "INNOPOLIS Foundation", w: 171, h: 52, cls: "h-9" },
];

const FAQ = [
  {
    q: "Do I need to speak Korean?",
    a: "No. Write your brief in English. Hypotheses, survey questions, the results dashboard and the report all come back in English.",
  },
  {
    q: "Who are the virtual respondents?",
    a: "Synthetic profiles of Korean residents generated from Korean national statistics — region, gender, age, education, income, economic activity and everyday context — so the panel mirrors the real structure of the population.",
  },
  {
    q: "How accurate is it?",
    a: "We cross-check virtual responses against real human survey data: 87.0% distribution match and 80.8% ranking match. Use Socialtwin to screen ideas and set priorities fast; for high-stakes decisions, follow up with a confirmatory study of real people.",
  },
  {
    q: "Can I target a specific group?",
    a: "Yes. Narrow your panel by region, gender, age group, education, household income and economic activity.",
  },
  {
    q: "What does it cost?",
    a: "Try a 10-respondent study for free. A standard 100-respondent study with the detailed report is ₩99,000 (VAT incl.). See Pricing for larger panels.",
  },
];

/* ─────────────────────────────────────────
   Page
───────────────────────────────────────── */
export default function LandingEn() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar dark />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden mesh-bg noise min-h-[88vh] sm:min-h-[92vh] flex items-center">
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
                A virtual Korea, built on national statistics
              </div>
              <h1 className="animate-fade-up-2 text-4xl sm:text-5xl lg:text-[60px] font-extrabold leading-[1.1] tracking-tight text-white mb-6">
                Entering Korea?<br />
                <span className="text-shimmer">Test the market first.</span>
              </h1>
              <p className="animate-fade-up-3 text-base sm:text-lg text-slate-400 leading-relaxed mb-10 max-w-lg">
                Before you commit budget to a Korean launch, ask Korean consumers.
                AI designs your survey, virtual Koreans answer it, and you get an English report{" "}
                <span className="text-slate-200 font-medium">in about an hour</span> — for{" "}
                <span className="text-slate-200 font-medium">95% less than a local research agency</span>.
              </p>
              <div className="animate-fade-up-4 mb-12">
                <div className="flex flex-wrap gap-3">
                  <CtaLink className="btn-primary">
                    Start a study <ArrowRight size={16} />
                  </CtaLink>
                  <a href="#how" className="btn-ghost">
                    See how it works
                  </a>
                </div>
              </div>
              <div className="animate-fade-up-4 flex flex-wrap items-center gap-5 text-sm text-slate-500">
                {["Korean national statistics", "Reports in English", "Results in about 1 hour"].map((t) => (
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

      {/* ── Why research Korea first ── */}
      <section id="why-korea" className="py-20 md:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <Reveal className="text-center mb-12 sm:mb-16">
            <div className="inline-block text-rose-600 text-xs font-bold uppercase tracking-[.15em] bg-rose-50 px-3 py-1.5 rounded-full mb-4">
              Why research first
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-4">
              Korea is a great market — and an unforgiving one
            </h2>
            <p className="text-base sm:text-lg text-slate-500 max-w-2xl mx-auto">
              Korean consumers are fast, digital and demanding. What worked at home doesn&apos;t always translate.
              A quick read on real demand can save you months and a lot of budget.
            </p>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {WHY_KOREA.map((w, i) => (
              <Reveal key={w.title} delay={i * 70}>
                <div className="h-full rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className={`w-10 h-10 rounded-xl ${w.bg} flex items-center justify-center mb-4`}>{w.icon}</div>
                  <h3 className="text-[15px] font-semibold text-slate-900 mb-2">{w.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{w.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="py-20 md:py-28 bg-slate-50 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <Reveal className="text-center mb-12 sm:mb-16">
            <div className="inline-block text-indigo-600 text-xs font-bold uppercase tracking-[.15em] bg-indigo-50 px-3 py-1.5 rounded-full mb-4">
              How it works
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-4">
              Korean market research in four steps
            </h2>
            <p className="text-base sm:text-lg text-slate-500 max-w-xl mx-auto">
              All you write is a few sentences — in English.
            </p>
          </Reveal>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <Reveal key={step.num} delay={i * 80}>
                <div className="flex flex-col h-full">
                  <div className="text-left mb-3">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${step.bg} text-slate-700`}>
                      Step {i + 1}
                    </span>
                  </div>
                  <div className="group bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex-1 flex flex-col">
                    <div className="bg-slate-50 border-b border-slate-100 p-4 h-52 flex items-center justify-center">
                      <div className="w-full">{step.mockup}</div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
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
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Questions to answer before launch (use cases) ── */}
      <section id="use-cases" className="py-20 md:py-28 bg-white scroll-mt-20">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <Reveal className="text-center mb-12 sm:mb-14">
            <div className="inline-block text-sky-600 text-xs font-bold uppercase tracking-[.15em] bg-sky-50 px-3 py-1.5 rounded-full mb-4">
              Use cases
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-3">
              Answer these before you launch in Korea
            </h2>
            <p className="text-base sm:text-lg text-slate-500 max-w-xl mx-auto">
              The questions every market-entry plan has to answer — with data from Korean consumers.
            </p>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {QUESTIONS_TO_ANSWER.map((q, i) => (
              <Reveal key={q.title} delay={i * 60}>
                <div className="h-full rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">{q.icon}</div>
                    <h3 className="text-[15px] font-semibold text-slate-900">{q.title}</h3>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed">{q.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={150}>
            <div className="mt-10 flex flex-wrap justify-center gap-2">
              {INDUSTRIES.map((ind) => (
                <span key={ind} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
                  {ind}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-20 md:py-28 bg-slate-50 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <Reveal className="text-center mb-12 sm:mb-16">
            <div className="inline-block text-violet-600 text-xs font-bold uppercase tracking-[.15em] bg-violet-50 px-3 py-1.5 rounded-full mb-4">
              Why Socialtwin
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-4">
              A faster way to hear from Korea
            </h2>
            <p className="text-base sm:text-lg text-slate-500 max-w-xl mx-auto">
              AI and a statistically grounded virtual population replace weeks of fieldwork.
            </p>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 60}>
                <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full">
                  {f.visual}
                  <div className="p-5">
                    <h3 className="text-[15px] font-semibold text-slate-900 mb-2">{f.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* ── 가상인구의 정체 + 저작권 등록 — 한국어 랜딩과 같은 원칙(등록 ≠ 성능 인증) ── */}
          <Reveal delay={200}>
            <div className="mt-14 sm:mt-16 rounded-3xl border border-slate-200 bg-white p-6 sm:p-9">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-1.5 text-emerald-700 text-xs font-bold uppercase tracking-[.15em] bg-emerald-50 px-3 py-1.5 rounded-full mb-4">
                  <Shield size={13} /> Synthetic data from national statistics
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  Not people imagined by AI.<br />
                  <span className="text-indigo-600">South Korea</span>, rebuilt from national statistics.
                </h3>
                <p className="mt-3 text-sm sm:text-base text-slate-500 max-w-3xl mx-auto leading-relaxed">
                  Socialtwin&apos;s virtual population is not a set of made-up AI profiles. It is{" "}
                  <strong className="font-semibold text-slate-700">high-precision synthetic data</strong> that
                  reproduces the demographic, social and lifestyle structure of South Korea from official national
                  statistics. Both the database and the simulation software that runs it are registered with the
                  Korea Copyright Commission.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                {[
                  {
                    kicker: "Database producer rights registration",
                    no: "No. D-2026-000156",
                    title: "Socialtwin Virtual Population Database",
                    meta: [
                      ["Produced", "2026.06.09"],
                      ["Registered", "2026.09.03"],
                      ["Basis", "Copyright Act, Art. 98"],
                    ] as const,
                    thumb: "/certs/cert-db-thumb.jpg",
                    full: "/certs/cert-db.jpg",
                    alt: "Database producer rights registration certificate — Socialtwin Virtual Population Database",
                  },
                  {
                    kicker: "Copyright registration",
                    no: "No. C-2026-042596",
                    title: "Socialtwin Simulation Software",
                    meta: [
                      ["Created", "2026.08.20"],
                      ["Registered", "2026.09.01"],
                      ["Basis", "Copyright Act, Art. 53"],
                    ] as const,
                    thumb: "/certs/cert-copyright-thumb.jpg",
                    full: "/certs/cert-copyright.jpg",
                    alt: "Copyright registration certificate — Socialtwin Simulation Software",
                  },
                ].map((c) => (
                  <div key={c.no} className="flex gap-4 sm:gap-5 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5">
                    <a
                      href={c.full}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group shrink-0"
                      aria-label={`View original: ${c.alt}`}
                    >
                      <Image
                        src={c.thumb}
                        alt={c.alt}
                        width={600}
                        height={849}
                        className="w-20 sm:w-24 h-auto rounded-lg border border-slate-200 bg-white shadow-sm transition-transform duration-300 group-hover:scale-105"
                      />
                      <span className="mt-1.5 block text-center text-[10px] text-slate-400 group-hover:text-indigo-600">
                        View (Korean)
                      </span>
                    </a>
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">{c.kicker}</div>
                      <h4 className="mt-1 text-[15px] font-semibold text-slate-900">{c.title}</h4>
                      <div className="mt-0.5 font-mono text-xs text-slate-400">{c.no}</div>
                      <dl className="mt-3 space-y-1">
                        {c.meta.map(([k, v]) => (
                          <div key={k} className="flex gap-2 text-xs">
                            <dt className="w-20 shrink-0 text-slate-400">{k}</dt>
                            <dd className="font-medium text-slate-600">{v}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  </div>
                ))}
              </div>

              <p className="mt-6 text-center text-xs text-slate-400">
                Author &amp; database producer: Omninode Inc. · Issued by the Korea Copyright Commission
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
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Local agency vs. Socialtwin
            </h2>
          </Reveal>
          <Reveal delay={100}>
            {(() => {
              const rows = [
                { label: "Deliverable", old: "100-respondent survey report", neu: "100-respondent survey report" },
                { label: "Cost", old: "₩2,000,000+ per study", neu: "₩99,000 (95%+ less)" },
                { label: "Turnaround", old: "4+ weeks", neu: "About 1 hour" },
                { label: "Language", old: "Korean-speaking agency or translators", neu: "Work in English, get an English report" },
                { label: "Survey design", old: "Research expert required", neu: "Designed by AI" },
                { label: "Respondents", old: "Recruit a local panel", neu: "Drawn instantly from the virtual population" },
              ];
              return (
                <>
                  {/* Mobile — stacked cards */}
                  <div className="md:hidden flex flex-col gap-3">
                    {rows.map(({ label, old, neu }) => (
                      <div key={label} className="rounded-2xl border border-slate-200 shadow-sm overflow-hidden bg-white">
                        <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                          <span className="text-sm font-bold text-slate-800">{label}</span>
                        </div>
                        <div className="px-4 py-3 border-b border-slate-100">
                          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Local research agency</div>
                          <p className="text-sm text-slate-600 leading-relaxed">{old}</p>
                        </div>
                        <div className="px-4 py-3 bg-indigo-50/60">
                          <div className="text-sm font-extrabold text-indigo-600 uppercase tracking-wider mb-1.5">Socialtwin</div>
                          <p className="text-sm font-semibold text-indigo-700 leading-relaxed">{neu}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop — table */}
                  <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                    <table className="w-full text-sm bg-white table-fixed">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="text-left p-4 text-slate-400 font-medium text-xs w-[18%]" />
                          <th className="text-center p-4 font-semibold text-slate-500 text-xs w-[41%]">Local research agency</th>
                          <th className="text-center p-4 w-[41%] bg-indigo-50">
                            <span className="font-extrabold text-indigo-600 text-base sm:text-lg tracking-wide">Socialtwin</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map(({ label, old, neu }) => (
                          <tr key={label} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                            <td className="p-4 text-slate-700 font-semibold text-sm align-top">{label}</td>
                            <td className="p-4 text-sm align-top text-center text-slate-400">{old}</td>
                            <td className="p-4 align-top bg-indigo-50/50">
                              <div className="text-center font-semibold text-indigo-600 text-sm">{neu}</div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              );
            })()}
          </Reveal>

          {/* 함께한 기관 로고 마퀴 */}
          <Reveal className="mt-16">
            <p className="text-center text-xs font-semibold uppercase tracking-[.15em] text-slate-400 mb-6">
              Organizations we&apos;ve worked with in Korea
            </p>
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
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 md:py-28 bg-slate-50">
        <div className="max-w-3xl mx-auto px-5 sm:px-6">
          <Reveal className="text-center mb-10">
            <div className="inline-block text-emerald-600 text-xs font-bold uppercase tracking-[.15em] bg-emerald-50 px-3 py-1.5 rounded-full mb-4">
              FAQ
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Questions from global teams
            </h2>
          </Reveal>
          <div className="space-y-3">
            {FAQ.map((f, i) => (
              <Reveal key={f.q} delay={i * 50}>
                <details className="group rounded-2xl border border-slate-200 bg-white px-5 py-4 open:shadow-sm">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-semibold text-slate-900">
                    {f.q}
                    <ArrowRight size={16} className="shrink-0 text-slate-400 transition-transform group-open:rotate-90" />
                  </summary>
                  <p className="mt-3 text-sm text-slate-500 leading-relaxed">{f.a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* 왼쪽 — 상세보고서 구성 (한국어 보고서 캡처 대신 영문 목차 카드) */}
            <Reveal>
              <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-indigo-50/60 p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                    <FileText size={20} className="text-white" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-[.15em] text-indigo-600">Detailed report</div>
                    <div className="text-sm font-semibold text-slate-900">About 30 pages · in English</div>
                  </div>
                </div>
                <ul className="space-y-3">
                  {[
                    "Key metrics (KPIs) and hypothesis verdicts",
                    "Demographics of your virtual panel",
                    "Answer distribution for every question",
                    "Deep dives: market response, segments, pricing and strategy",
                    "Raw data (CSV) included",
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

            <Reveal delay={120}>
              <div className="lg:pl-4">
                <div className="mb-5 flex items-end justify-between gap-4">
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 tracking-tight leading-tight">
                    Know Korea<br />
                    before you enter
                  </h2>
                  <CtaLink className="btn-primary shrink-0 text-base px-8 py-4">
                    Start a study <ArrowRight size={18} />
                  </CtaLink>
                </div>
                <StartCtaButtons />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
