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
    badges: ["멀티모달 분석", "맥락 연결"],
    headline: "입력 한 번이 분석 끝까지 따라갑니다",
    body: "제품 정의·산업·거래방식·니즈를 구조화하고, 첨부한 이미지·PDF까지 분석해 하나의 맥락으로 만듭니다. 이 맥락은 가설→문항→결과 분석 전 단계에 동일하게 주입됩니다.",
    mechanism: "입력값을 거래유형·산업 분류 등 구조화된 컨텍스트로 변환하고, 첨부 자료는 비전 분석으로 핵심을 추출해 합칩니다.",
    evidence: ["이미지·PDF 멀티모달 분석", "거래유형·산업 구조화", "전 단계 맥락 일관"],
    vs: { plain: "일반 챗봇 — 한 번 묻고 끝", ours: "입력이 전 과정의 기준점" },
  },
  2: {
    badges: ["가설 자동 설계"],
    headline: "막연한 질문이 아니라, 검증할 가설부터",
    body: "입력 맥락을 바탕으로 시장에서 검증해야 할 핵심 가설을 자동 도출합니다. 수요·타깃·가치·가격 등 축으로 정리돼, 이후 문항이 가설을 직접 측정하게 됩니다.",
    mechanism: "제품 컨텍스트를 시장 가설 프레임에 매핑해 검증 가능한 명제로 구조화합니다.",
    evidence: ["컨텍스트 기반 도출", "검증가능 명제화", "다축 구조"],
    vs: { plain: "일반 AI — 질문만 생성", ours: "검증 설계로 변환" },
  },
  3: {
    badges: ["사용자 직접 검토", "Human-in-the-loop"],
    headline: "AI가 만든 가설을, 사용자가 직접 확정합니다",
    body: "자동 도출된 가설을 사용자가 직접 검토·수정할 수 있습니다. 사용자가 확정한 가설만 다음 단계로 넘어갑니다.",
    mechanism: "사용자가 수정한 가설이 이후 문항 생성·분석의 기준이 되며, 작성 주체가 함께 기록됩니다.",
    evidence: ["사용자 검토·수정 단계", "확정본만 진행", "작성자 추적"],
    vs: { plain: "일반 AI — 생성 결과 그대로", ours: "사용자가 교정·확정 후 진행" },
  },
  4: {
    badges: ["가설↔문항 매핑", "작성 가이드 학습"],
    headline: "가설을 '측정 가능한' 문항으로",
    body: "확정 가설을 객관식·척도 등 측정 가능한 문항으로 변환합니다. 누적된 문항 작성 가이드라인이 함께 적용돼 문항 품질을 끌어올립니다.",
    mechanism: "각 가설에 측정 문항을 매핑하고, 그동안의 개선에서 학습된 작성 원칙을 주입합니다. 직접 만든 설문 PDF 업로드 → 문항 변환도 지원합니다.",
    evidence: ["가설별 문항 매핑", "작성 가이드 누적 학습", "PDF 설문 변환"],
    vs: { plain: "일반 설문툴 — 빈 문항지", ours: "가설 기반 자동 설계" },
  },
  5: {
    badges: ["자동 품질검증(QA)", "의미유사도 채점"],
    headline: "사람이 놓치는 '나쁜 문항'을 잡아냅니다",
    body: "생성된 문항을 자동 검증해 유도질문·이중질문·모호한 표현을 찾아냅니다. 의미 유사도로 문항을 채점하고 개선안을 제안·적용합니다.",
    mechanism: "품질 검증 루프가 문항을 점검하고, LLM 개선 제안을 받아 적용하는 과정을 반복합니다.",
    evidence: ["유도·이중·모호 검출", "의미유사도 채점", "개선 제안→적용"],
    vs: { plain: "일반 설문 — 작성자 책임", ours: "설문 방법론 내장 검증" },
  },
  6: {
    badges: ["설계 일관성 점검", "실행 전 확정"],
    headline: "실행 전, 설계 전체를 한 번에 확정합니다",
    body: "가설·문항·조사 설정(지역·표본수)을 한 화면에서 최종 확인합니다. 설계서·요약 미리보기로 무엇이 어떻게 조사될지 실행 전에 점검할 수 있습니다.",
    mechanism: "확정 시점의 설계가 그대로 실행에 넘어가 동일 조건의 재현이 가능합니다. 설계서/요약 PDF 미리보기를 제공합니다.",
    evidence: ["설계 요약 미리보기", "지역·표본수 확정", "재현 가능한 실행"],
    vs: { plain: "일반 AI — 즉시 생성·되돌리기 어려움", ours: "확정 후 실행하는 통제된 절차" },
  },
  7: {
    badges: ["KOSIS 정합", "CA-IPF 보정", "시도별 특화"],
    headline: "무작위 AI가 아니라, 실제 인구 구조를 닮은 가상인구가 응답합니다",
    body: "통계청(KOSIS) 공식 통계로 사전 정합된 가상인구 패널에서 표본을 추출합니다. 연령·성별·지역 등 인구 축이 실제 분포를 따르도록 보정돼 있어, 응답이 특정 집단에 쏠리지 않습니다.",
    mechanism: "CA-IPF(반복비례보정)가 각 인구 축의 비율을 실제 통계에 맞춰 반복 조정해 표본 쏠림을 제거합니다. 시도별 핸들러가 선택한 지역의 인구 특성까지 반영합니다.",
    evidence: ["통계청 KOSIS 기준", "다축 인구 보정", "지역별 인구 반영"],
    vs: { plain: "일반 AI 설문 — 성격 없는 무작위 페르소나", ours: "인구 구조에 정합된 대표 표본" },
    notice: "참고용 초기 진단입니다. 실제 표본조사를 대체하지 않습니다.",
  },
  8: {
    badges: ["BASS", "PSM", "Conjoint", "의사결정 대시보드"],
    headline: "집계 그래프가 아니라, '의사결정'으로",
    body: "응답을 마케팅 통계모형으로 해석합니다. 수요 확산(BASS), 가격 민감도(PSM), 속성 선호(Conjoint)를 적용해 '무엇을 할지'까지 제시합니다. 핵심 요약은 무료로 제공됩니다.",
    mechanism: "단순 빈도 집계를 넘어 검증된 마케팅 사이언스 모형으로 결과를 분석하고 의사결정 대시보드로 구성합니다. 상세보고서·Raw Data는 좌측/하단 버튼에서 진행할 수 있습니다.",
    evidence: ["BASS 수요예측", "PSM 가격민감도", "Conjoint 선호분석"],
    vs: { plain: "일반 도구 — 빈도 집계 그래프", ours: "통계모형 기반 의사결정 대시보드" },
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
            <span className="text-[9px] font-semibold" style={{ color: NAVY }}>KOSIS</span>
          </div>
          <Arrow />
          <Node icon={Sparkles} label="CA-IPF 보정" />
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
          <Chip label="BASS · PSM · Conjoint" accent />
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
