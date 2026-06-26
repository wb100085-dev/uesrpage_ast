"use client";

import { useState } from "react";
import {
  ChevronDown, ArrowRight, Type, Image as ImageIcon, FileText,
  Boxes, UserCheck, CheckCircle2, XCircle, Filter, Link2,
  ShieldCheck, Users, BarChart3, Sparkles, Layers,
} from "lucide-react";

/**
 * 단계별 기술 카피 패널 — design 흐름의 각 단계 화면 우측에 노출.
 * 출처: 참고용/SocialTwin_단계별_기술카피_최종.md
 * 색: 브랜드 오렌지(#DC6D26)·네이비(#14213D)·웜페이퍼(#FAF7F2).
 * 노출 규칙: 배지·헤드라인·본문·그림은 항상 노출, 메커니즘·근거·vs는 접이식.
 * 강약: 7·8단계는 접이식 기본 펼침(풀), 1~6은 기본 접힘.
 */

const ORANGE = "#DC6D26";
const NAVY = "#14213D";

type StepCopy = {
  badges: string[];
  headline: string;
  body: string;
  mechanism: string;
  evidence: string[];
  vs: { plain: string; ours: string };
  notice?: string;
};

const COPY: Record<number, StepCopy> = {
  1: {
    badges: ["여기서 시작", "간편 입력"],
    headline: "처음이어도 괜찮아요, 한 문장이면 됩니다",
    body: "조사하려는 제품·서비스와 알고 싶은 점을 자유롭게 적어 주세요. 참고할 이미지나 PDF가 있다면 함께 올리면 됩니다. 지금 입력한 내용은 이후 모든 단계에 그대로 이어져, 다시 설명할 필요가 없습니다.",
    mechanism: "올려주신 글과 자료를 AI가 함께 읽고 하나의 조사 맥락으로 정리해 둡니다. 전문 지식 없이 평소 말하듯 적어도 충분합니다.",
    evidence: ["전문지식 불필요", "이미지·문서 함께 이해", "한 번 입력으로 끝까지"],
    vs: { plain: "일반 챗봇 — 물어볼 때마다 다시 설명", ours: "입력 한 번이 전 과정의 기준" },
  },
  2: {
    badges: ["AI 자동 제안"],
    headline: "무엇부터 확인할지, AI가 먼저 잡아드립니다",
    body: "입력한 내용을 바탕으로 시장에서 검증해볼 핵심 가설을 AI가 자동으로 제안합니다. 조사 경험이 없어도 '무엇을 물어봐야 하지?' 하고 막막해할 필요가 없습니다. 잠시만 기다리면 됩니다.",
    mechanism: "수요·타깃·가치·가격 같은 관점에서 확인할 거리를 정리하고, 다음 단계의 설문이 이 가설을 그대로 측정하도록 연결해 둡니다.",
    evidence: ["핵심 가설 자동 제안", "여러 관점으로 정리", "설문까지 자연스럽게 연결"],
    vs: { plain: "일반 AI — 질문만 던짐", ours: "검증할 가설로 정리" },
  },
  3: {
    badges: ["직접 확인", "내가 결정"],
    headline: "AI 제안을 직접 보고, 고치고, 확정하세요",
    body: "AI가 제안한 가설을 그대로 써도 되고, 마음에 들지 않으면 자유롭게 수정하거나 빼도 됩니다. 사용자가 확정한 가설만 다음 단계로 넘어가니, 조사 방향은 언제나 사용자가 정합니다.",
    mechanism: "여기서 다듬은 내용이 이후 문항과 결과 분석의 기준이 됩니다. 언제든 이전 단계로 돌아가 다시 손볼 수 있습니다.",
    evidence: ["자유롭게 수정·삭제", "확정한 것만 진행", "방향은 사용자가 결정"],
    vs: { plain: "일반 AI — 나온 대로 사용", ours: "내가 검토·확정 후 진행" },
  },
  4: {
    badges: ["문항 자동 생성"],
    headline: "확정한 가설이 곧바로 설문 문항이 됩니다",
    body: "검토를 마친 가설에 맞춰, 답하기 쉬운 객관식·척도 문항을 AI가 자동으로 만들어 줍니다. 이미 만들어 둔 설문지가 있다면 올려서 변환할 수도 있습니다.",
    mechanism: "각 가설이 어떤 문항으로 측정되는지 자연스럽게 이어지고, 좋은 설문이 되도록 작성 원칙이 자동으로 반영됩니다.",
    evidence: ["가설에 맞춘 문항", "답하기 쉬운 형식", "기존 설문지 변환"],
    vs: { plain: "일반 설문툴 — 빈 문항지부터 직접", ours: "가설 기반 자동 설계" },
  },
  5: {
    badges: ["자동 품질 점검"],
    headline: "치우치거나 헷갈리는 문항을 미리 걸러냅니다",
    body: "만들어진 문항을 확인하는 단계입니다. 답을 유도하거나 두 가지를 한꺼번에 묻는 등 결과를 흐릴 수 있는 문항을 자동으로 점검하고 더 나은 표현으로 다듬어 둡니다. 사용자는 결과만 확인하면 됩니다.",
    mechanism: "조사 방법론 관점에서 문항을 살펴보고, 깔끔한 표현을 제안합니다. 좋은 설문의 기준이 자동으로 적용됩니다.",
    evidence: ["편향 문항 자동 점검", "표현 다듬기", "검증된 설문 기준" ],
    vs: { plain: "일반 설문 — 품질은 작성자 몫", ours: "품질 점검까지 자동으로" },
  },
  6: {
    badges: ["실행 전 최종 확인"],
    headline: "조사를 시작하기 전, 전체를 한눈에 확인하세요",
    body: "가설·문항·조사 설정(지역·표본수)을 한 화면에서 마지막으로 점검하는 단계입니다. 무엇을 어떻게 조사할지 미리보기로 확인하고, 이상이 없으면 바로 실행하면 됩니다.",
    mechanism: "여기서 확정한 설계가 그대로 조사에 사용되어, 같은 조건으로 다시 돌려볼 수 있습니다. 설계서·요약은 PDF 미리보기로 받아볼 수 있습니다.",
    evidence: ["전체 설계 미리보기", "지역·표본수 확인", "같은 조건 재실행"],
    vs: { plain: "일반 AI — 바로 생성, 되돌리기 어려움", ours: "확인 후 실행하는 안심 절차" },
  },
  7: {
    badges: ["통계청 데이터 기반", "대표성 보정"],
    headline: "무작위가 아니라, 실제 인구를 닮은 응답자가 답합니다",
    body: "조사가 실행되는 단계입니다. 통계청 공식 인구 통계를 바탕으로 구성된 가상 응답자들이 설문에 답합니다. 특정 집단에 치우치지 않도록 보정돼, 실제 시장에 더 가까운 결과를 얻을 수 있습니다.",
    mechanism: "연령·성별·지역 등 응답자 구성이 실제 인구 분포에 가깝도록 자동으로 맞춰지고, 선택한 지역의 특성까지 반영됩니다. 잠시만 기다리면 결과가 만들어집니다.",
    evidence: ["통계청 통계 기반", "대표성 자동 보정", "선택 지역 특성 반영"],
    vs: { plain: "일반 AI — 성격 없는 무작위 응답", ours: "인구 구조에 맞춘 대표 표본" },
    notice: "참고용 초기 진단입니다. 실제 표본조사를 대체하지 않습니다.",
  },
  8: {
    badges: ["핵심 요약 무료", "의사결정 중심"],
    headline: "숫자 나열이 아니라, '무엇을 할지'까지 알려드립니다",
    body: "응답을 분석해 핵심 인사이트와 추천 액션을 정리해 드립니다. 단순 집계를 넘어 검증된 분석 기법으로 해석하기 때문에, 결과를 바로 의사결정에 활용할 수 있습니다. 핵심 요약은 무료로 제공됩니다.",
    mechanism: "수요 예측·가격 민감도·선호도 같은 검증된 마케팅 분석 관점으로 결과를 해석해 의사결정 대시보드로 보여줍니다. 더 깊은 분석과 원본 데이터는 화면의 버튼으로 받아볼 수 있습니다.",
    evidence: ["핵심 인사이트 요약", "추천 액션 제시", "검증된 분석 기법"],
    vs: { plain: "일반 도구 — 집계 그래프까지", ours: "의사결정까지 제시" },
    notice: "참고용 초기 진단입니다. 중요한 의사결정 전 실제 표본 검증을 권장합니다.",
  },
};

/* ── 작은 칩/노드 ── */
function Chip({ label, accent = false }: { label: string; accent?: boolean }) {
  return accent ? (
    <span className="inline-flex items-center rounded-md px-2 py-1 text-[10px] font-bold text-white" style={{ backgroundColor: ORANGE }}>
      {label}
    </span>
  ) : (
    <span className="inline-flex items-center rounded-md border px-2 py-1 text-[10px] font-semibold" style={{ borderColor: `${NAVY}22`, color: NAVY }}>
      {label}
    </span>
  );
}

function Node({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-9 h-9 rounded-lg bg-white border flex items-center justify-center" style={{ borderColor: `${NAVY}22` }}>
        <Icon size={16} style={{ color: NAVY }} />
      </div>
      <span className="text-[9px] font-semibold" style={{ color: NAVY }}>{label}</span>
    </div>
  );
}

function Arrow() {
  return <ArrowRight size={14} className="flex-shrink-0" style={{ color: ORANGE }} />;
}

/* ── 단계별 개념 그림(아이콘 흐름) ── */
function StepDiagram({ step }: { step: number }) {
  const wrap = "rounded-xl border bg-white/70 px-3 py-3.5 flex items-center justify-center gap-2 flex-wrap";
  const wrapStyle = { borderColor: `${NAVY}1a` };
  switch (step) {
    case 1:
      return (
        <div className={wrap} style={wrapStyle}>
          <div className="flex flex-col gap-1.5">
            <Node icon={Type} label="텍스트" />
            <Node icon={ImageIcon} label="이미지" />
            <Node icon={FileText} label="PDF" />
          </div>
          <Arrow />
          <Node icon={Boxes} label="컨텍스트" />
        </div>
      );
    case 2:
      return (
        <div className={wrap} style={wrapStyle}>
          <Node icon={Boxes} label="컨텍스트" />
          <Arrow />
          <div className="flex gap-1.5">
            {["H1", "H2", "H3"].map((h) => <Chip key={h} label={h} accent />)}
          </div>
        </div>
      );
    case 3:
      return (
        <div className={wrap} style={wrapStyle}>
          <Chip label="가설" accent />
          <Arrow />
          <Node icon={UserCheck} label="사용자 검토" />
          <Arrow />
          <CheckCircle2 size={18} className="text-emerald-500" />
        </div>
      );
    case 4:
      return (
        <div className={wrap} style={wrapStyle}>
          <div className="flex flex-col gap-1.5">{["H1", "H2"].map((h) => <Chip key={h} label={h} accent />)}</div>
          <Link2 size={16} style={{ color: ORANGE }} />
          <div className="flex flex-col gap-1.5">{["Q1", "Q2"].map((q) => <Chip key={q} label={q} />)}</div>
        </div>
      );
    case 5:
      return (
        <div className={wrap} style={wrapStyle}>
          <Chip label="문항" />
          <Arrow />
          <Node icon={Filter} label="QA 게이트" />
          <Arrow />
          <div className="flex flex-col gap-1.5">
            <CheckCircle2 size={16} className="text-emerald-500" />
            <XCircle size={16} className="text-rose-400" />
          </div>
        </div>
      );
    case 6:
      return (
        <div className={wrap} style={wrapStyle}>
          <Node icon={Layers} label="가설·문항·설정" />
          <Arrow />
          <Node icon={ShieldCheck} label="확정 게이트" />
          <Arrow />
          <CheckCircle2 size={18} className="text-emerald-500" />
        </div>
      );
    case 7:
      return (
        <div className={wrap} style={wrapStyle}>
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-end gap-0.5 h-7">
              {[10, 18, 14, 22, 12].map((h, i) => <span key={i} className="w-1.5 rounded-sm" style={{ height: h, backgroundColor: `${NAVY}99` }} />)}
            </div>
            <span className="text-[9px] font-semibold" style={{ color: NAVY }}>실제 인구분포</span>
          </div>
          <Arrow />
          <Node icon={Sparkles} label="대표성 보정" />
          <Arrow />
          <Node icon={Users} label="가상인구 표본" />
        </div>
      );
    case 8:
    default:
      return (
        <div className={wrap} style={wrapStyle}>
          <Node icon={BarChart3} label="응답 분포" />
          <Arrow />
          <Chip label="검증된 분석" accent />
          <Arrow />
          <Node icon={Layers} label="의사결정 대시보드" />
        </div>
      );
  }
}

/* ── 접이식 섹션 ── */
function Collapsible({ title, defaultOpen, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="border-t pt-3" style={{ borderColor: `${NAVY}14` }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 text-[12px] font-bold"
        style={{ color: NAVY }}
      >
        {title}
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} style={{ color: ORANGE }} />
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  );
}

export default function TechCopyCard({ step }: { step: number }) {
  const c = COPY[step];
  if (!c) return null;
  const full = step >= 7; // 7·8단계는 접이식 기본 펼침

  return (
    <div className="rounded-2xl border shadow-sm overflow-hidden" style={{ backgroundColor: "#FAF7F2", borderColor: `${NAVY}1f` }}>
      {/* 상단 강조 바 */}
      <div className="h-1" style={{ backgroundColor: ORANGE }} />
      <div className="p-5 flex flex-col gap-3.5">
        {/* 배지 */}
        <div className="flex flex-wrap gap-1.5">
          {c.badges.map((b) => <Chip key={b} label={b} accent />)}
        </div>

        {/* 헤드라인 */}
        <h3 className="text-[15px] font-extrabold leading-snug" style={{ color: NAVY }}>{c.headline}</h3>

        {/* 본문 */}
        <p className="text-[13px] leading-relaxed" style={{ color: `${NAVY}cc` }}>{c.body}</p>

        {/* 그림 */}
        <StepDiagram step={step} />

        {/* 어떻게 작동하나요? — 접이식 */}
        <Collapsible title="어떻게 작동하나요?" defaultOpen={full}>
          <p className="text-[12px] leading-relaxed" style={{ color: `${NAVY}b3` }}>{c.mechanism}</p>
        </Collapsible>

        {/* 근거 — 접이식 */}
        <Collapsible title="근거" defaultOpen={full}>
          <div className="flex flex-wrap gap-1.5">
            {c.evidence.map((e) => <Chip key={e} label={e} />)}
          </div>
        </Collapsible>

        {/* vs 비교 — 접이식 */}
        <Collapsible title="vs 비교" defaultOpen={full}>
          <div className="flex flex-col gap-1.5 text-[12px]">
            <div className="rounded-lg bg-white/70 border px-3 py-2" style={{ borderColor: `${NAVY}14`, color: `${NAVY}99` }}>
              일반 — {c.vs.plain}
            </div>
            <div className="rounded-lg px-3 py-2 text-white font-medium" style={{ backgroundColor: NAVY }}>
              SocialTwin — {c.vs.ours}
            </div>
          </div>
        </Collapsible>

        {/* 고지 */}
        {c.notice && (
          <p className="text-[11px] leading-relaxed border-t pt-3" style={{ color: `${NAVY}80`, borderColor: `${NAVY}14` }}>
            ※ {c.notice}
          </p>
        )}
      </div>
    </div>
  );
}
