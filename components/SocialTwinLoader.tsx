"use client";

import { useEffect, useState } from "react";
import { Check, FlaskConical, Lightbulb, ListChecks, Users } from "lucide-react";

/* ─────────────────────────────────────────
   SocialTwinLoader — 작업 대기 로딩 화면
   4개 화면:
   - hypothesis : 가설 설계 중   (짧은 작업 · 노드 그래프 + 문구 순환)
   - generate   : 설문 생성 중   (짧은 작업 · 문항 라인 스윕 + 문구 순환)
   - survey     : 조사 실행 중   (긴 작업 · 페르소나 점등 + 단계 + 진행률)
   - pilot      : 설문 파일럿 생성 중 (긴 작업 · 막대 차트 + 단계 + 진행률)
                  ⚠️ pilot은 백엔드 기능 미구현 — 화면만 준비됨, 아직 어디에도 적용하지 말 것
───────────────────────────────────────── */

export type LoaderScreen = "hypothesis" | "generate" | "survey" | "pilot";

type ScreenConfig = {
  eyebrow: string;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  visual: "nodes" | "lines" | "swarm" | "bars";
  /** 짧은 작업: 순환 문구 / 긴 작업: 단계 목록 */
  captions?: string[];
  steps?: string[];
};

const SCREENS: Record<LoaderScreen, ScreenConfig> = {
  hypothesis: {
    eyebrow: "Hypothesis",
    icon: Lightbulb,
    title: "작성한 정보를 바탕으로 가설을 설계 중입니다",
    subtitle: "조사 목적에 맞는 변수와 관계를 정리하는 중이에요",
    visual: "nodes",
    captions: [
      "입력 내용을 분석하고 있어요",
      "시장 컨텍스트를 파악하는 중이에요",
      "변수 간 관계를 정리해 가설을 도출하고 있어요",
    ],
  },
  generate: {
    eyebrow: "Survey",
    icon: ListChecks,
    title: "가설을 바탕으로 설문을 생성 중입니다",
    subtitle: "가설에 맞는 문항과 응답 척도를 구성하는 중이에요",
    visual: "lines",
    captions: [
      "가설에 맞는 문항을 구성하고 있어요",
      "응답 옵션과 척도를 다듬는 중이에요",
      "문항 순서를 최종 검토하고 있어요",
    ],
  },
  survey: {
    eyebrow: "Simulation",
    icon: Users,
    title: "가상인구 대상 조사를 실행 중입니다",
    subtitle: "통계 기반으로 합성된 가상인구 패널이 직접 응답합니다",
    visual: "swarm",
    steps: ["가상인구 패널 매칭 중", "AI 페르소나 응답 생성 중", "응답 데이터 집계 중", "결과 요약 생성 중"],
  },
  pilot: {
    eyebrow: "Pilot",
    icon: FlaskConical,
    title: "설문 파일럿을 생성하고 있습니다",
    subtitle: "본조사 전 소규모 표본으로 문항 품질을 점검하는 중이에요",
    visual: "bars",
    steps: ["파일럿 표본 구성 중", "파일럿 응답 수집 중", "문항 품질 점검 중", "설문 보정 중"],
  },
};

/* ── 시각 요소 ── */

const NODES: [number, number][] = [[20, 20], [200, 30], [120, 60], [40, 100], [210, 95]];
const NODE_LINKS: [number, number][] = [[0, 2], [1, 2], [2, 3], [2, 4]];

function NodesVisual() {
  return (
    <div className="relative w-[240px] h-[120px]">
      {NODES.map(([x, y], i) => (
        <div
          key={`n${i}`}
          className="absolute w-3.5 h-3.5 rounded-full bg-indigo-500 shadow-[0_0_14px_rgba(99,102,241,.45)]"
          style={{ left: x, top: y }}
        />
      ))}
      {NODE_LINKS.map(([a, b], i) => {
        const [x1, y1] = NODES[a];
        const [x2, y2] = NODES[b];
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.hypot(dx, dy);
        const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
        return (
          <div
            key={`l${i}`}
            className="absolute h-0.5 origin-left bg-gradient-to-r from-indigo-400/70 to-violet-400/60 animate-stw-link"
            style={{ left: x1 + 7, top: y1 + 7, width: len, transform: `rotate(${ang}deg)`, animationDelay: `${i * 0.3}s` }}
          />
        );
      })}
    </div>
  );
}

function LinesVisual() {
  return (
    <div className="w-4/5 max-w-sm flex flex-col gap-3.5">
      {[90, 70, 82].map((w, i) => (
        <div key={i} className="h-2.5 rounded-md bg-slate-100 relative overflow-hidden" style={{ width: `${w}%` }}>
          <div
            className="absolute inset-y-0 w-2/5 bg-gradient-to-r from-transparent via-indigo-300/80 to-transparent animate-stw-sweep"
            style={{ animationDelay: `${i * 0.25}s` }}
          />
        </div>
      ))}
    </div>
  );
}

// 렌더 간 동일해야 하므로(SSR hydration·React Compiler 순수성) 시드 기반 고정 좌표 사용
function seededRandom(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}
const SWARM_DOTS = Array.from({ length: 42 }, (_, i) => ({
  left: 8 + seededRandom(i + 1) * 84,
  top: 8 + seededRandom((i + 1) * 7.31) * 84,
  delay: seededRandom((i + 1) * 3.7) * 1.2,
}));

function SwarmVisual({ ratio }: { ratio: number }) {
  const dots = SWARM_DOTS;
  const onCount = Math.round(Math.min(Math.max(ratio, 0), 1) * dots.length);
  return (
    <div className="relative w-full h-full">
      {dots.map((p, i) => (
        <div
          key={i}
          className={`absolute w-2.5 h-2.5 rounded-full animate-scale-in transition-colors duration-500 ${
            i < onCount ? "bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,.5)]" : "bg-slate-200"
          }`}
          style={{ left: `${p.left}%`, top: `${p.top}%`, animationDelay: `${p.delay}s` }}
        />
      ))}
    </div>
  );
}

function BarsVisual({ level }: { level: number }) {
  return (
    <div className="flex items-end gap-3 h-[120px]">
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={i}
          className={`w-7 rounded-t-lg rounded-b-sm transition-all duration-700 ease-out ${
            i % 3 === 1
              ? "bg-gradient-to-b from-violet-500 to-violet-200"
              : i % 3 === 2
                ? "bg-gradient-to-b from-emerald-400 to-emerald-100"
                : "bg-gradient-to-b from-indigo-500 to-indigo-200"
          }`}
          style={{ height: 18 + Math.min(level, 5) * 16 + (i % 3) * 14 }}
        />
      ))}
    </div>
  );
}

function Visual({ kind, ratio, level }: { kind: ScreenConfig["visual"]; ratio: number; level: number }) {
  if (kind === "nodes") return <NodesVisual />;
  if (kind === "lines") return <LinesVisual />;
  if (kind === "swarm") return <SwarmVisual ratio={ratio} />;
  return <BarsVisual level={level} />;
}

/* ── 진행률 바 (ProgressCard와 동일 스타일) ── */
function ProgressBar({ label, pct }: { label: string; pct: number }) {
  return (
    <div className="w-full max-w-lg mt-2">
      <div className="flex justify-between text-xs text-slate-400 mb-2">
        <span>{label}</span>
        <span className="font-semibold text-indigo-600 tabular-nums">{Math.floor(pct)}%</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
        <div
          className="bg-gradient-to-r from-indigo-500 to-violet-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ── 메인 컴포넌트 ── */
export default function SocialTwinLoader({
  screen,
  title,
  subtitle,
  progress,
  progressLabel,
}: {
  screen: LoaderScreen;
  /** 헤더 제목 덮어쓰기 */
  title?: string;
  /** 헤더 부제 덮어쓰기 */
  subtitle?: string;
  /** 0~100. 긴 작업은 단계 활성화에도 사용 */
  progress?: number;
  /** 진행률 바 좌측 상태 문구 (긴 작업: 백엔드 stage 등) */
  progressLabel?: string;
}) {
  const cfg = SCREENS[screen];
  const Icon = cfg.icon;
  const isShort = !cfg.steps;
  const pct = Math.min(Math.max(progress ?? 0, 0), 100);

  // 짧은 작업: 안내 문구 순환
  const captions = cfg.captions ?? [];
  const [capIdx, setCapIdx] = useState(0);
  useEffect(() => {
    if (!isShort || captions.length < 2) return;
    const t = setInterval(() => setCapIdx((i) => (i + 1) % captions.length), 2600);
    return () => clearInterval(t);
  }, [isShort, captions.length]);

  // 긴 작업: 진행률로 현재 단계 도출
  const steps = cfg.steps ?? [];
  const active = steps.length > 0 ? Math.min(Math.floor((pct / 100) * steps.length), steps.length - 1) : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 sm:px-8 py-12 sm:py-14 flex flex-col items-center">
      {/* 아이콘 */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-xl shadow-indigo-200">
          <Icon size={32} className="text-white" />
        </div>
        <div className="absolute inset-0 rounded-2xl bg-indigo-400 animate-pulse opacity-30" />
      </div>

      {/* 헤더 */}
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold tracking-[0.14em] uppercase mb-3">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
        {cfg.eyebrow}
      </div>
      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2 tracking-tight text-center">
        {title ?? cfg.title}
      </h2>
      <p className="text-slate-400 text-sm mb-8 max-w-md text-center leading-relaxed">
        {subtitle ?? cfg.subtitle}
      </p>

      {/* 시각 요소 */}
      <div className="h-[140px] w-full max-w-lg flex items-center justify-center mb-6">
        <Visual kind={cfg.visual} ratio={pct / 100} level={active + 1} />
      </div>

      {isShort ? (
        <>
          {/* 순환 문구 */}
          <div className="relative h-6 w-full max-w-lg mb-4">
            {captions.map((c, i) => (
              <span
                key={i}
                className={`absolute inset-x-0 text-center text-sm text-slate-500 transition-opacity duration-500 ${
                  i === capIdx ? "opacity-100" : "opacity-0"
                }`}
              >
                {c}
              </span>
            ))}
          </div>
          {progress != null && <ProgressBar label={progressLabel ?? ""} pct={pct} />}
        </>
      ) : (
        <>
          {/* 단계 목록 */}
          <div className="w-full max-w-lg flex flex-col">
            {steps.map((label, i) => {
              const done = i < active;
              const isActive = i === active;
              return (
                <div
                  key={label}
                  className={`flex items-center gap-3 py-2.5 px-1 transition-opacity duration-300 ${
                    isActive ? "opacity-100" : done ? "opacity-70" : "opacity-40"
                  }`}
                >
                  <div
                    className={`flex-none w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition-all duration-300 ${
                      done
                        ? "border-indigo-500 bg-indigo-500 text-white"
                        : isActive
                          ? "border-indigo-500 text-indigo-600 bg-white ring-4 ring-indigo-100"
                          : "border-slate-200 text-slate-400 bg-white"
                    }`}
                  >
                    {done ? <Check size={13} /> : i + 1}
                  </div>
                  <span className={`text-sm font-semibold ${isActive ? "text-slate-800" : "text-slate-500"}`}>
                    {label}
                  </span>
                  {isActive && (
                    <div className="ml-auto w-4 h-4 rounded-full border-2 border-slate-200 border-t-indigo-500 animate-spin" />
                  )}
                </div>
              );
            })}
          </div>
          <ProgressBar label={progressLabel ?? steps[active]} pct={pct} />
        </>
      )}
    </div>
  );
}
