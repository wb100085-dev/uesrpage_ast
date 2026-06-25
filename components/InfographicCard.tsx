"use client";

import type { InfographicSummary } from "@/lib/survey-api";
import {
  FileBarChart, FlaskConical, Lightbulb, Rocket, Users,
  AlertTriangle, Target, Quote, TrendingUp, BarChart2,
  Activity, PieChart, CheckCircle2,
} from "lucide-react";

/**
 * 조사 결과 요약 — 사용자 페이지 설계 단계와 동일한 디자인 언어로 리디자인.
 * 상단 '개요(Overview)'는 관리자 대시보드 StatCard 스타일(컬러 아이콘 타일 + 큰 수치)을
 * 이식해 핵심 지표를 한눈에 보여주고, 이하 섹션은 흰색 rounded-2xl 카드로 정돈.
 */

const KPI_ICONS = [TrendingUp, BarChart2, Activity, PieChart];

/* 섹션 카드 — 설계 단계(app/design)의 section 패턴과 동일 */
function Section({
  icon: Icon,
  iconColor,
  title,
  children,
}: {
  icon: React.ElementType;
  iconColor: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
        <Icon size={15} className={iconColor} />
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export default function InfographicCard({ info }: { info: InfographicSummary }) {
  const verdictBadge = (v: string) => {
    if (v.includes("채택")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (v.includes("기각")) return "bg-rose-50 text-rose-700 border-rose-200";
    return "bg-amber-50 text-amber-700 border-amber-200";
  };

  return (
    <div className="flex flex-col gap-5">
      {/* ── 개요(Overview) — 리포트 헤더 + KPI 타일 (관리자 대시보드 이식) ── */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-5 sm:px-6 py-5 text-white">
          <div className="flex items-center gap-1.5 text-indigo-100 text-[11px] font-semibold uppercase tracking-wider">
            <FileBarChart size={13} /> 분석 결과 요약
          </div>
          {info.headline && (
            <h2 className="text-xl sm:text-2xl font-bold mt-1.5 leading-snug">{info.headline}</h2>
          )}
          {info.subheadline && (
            <p className="text-sm text-indigo-100 mt-1.5 leading-relaxed">{info.subheadline}</p>
          )}
        </div>

        {info.kpi_cards && info.kpi_cards.length > 0 && (
          <div className="p-5 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {info.kpi_cards.map((c, i) => {
              const Icon = KPI_ICONS[i % KPI_ICONS.length];
              return (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-slate-500 mb-1 truncate" title={c.label}>{c.label}</p>
                      <p className="text-xl font-bold text-slate-900 truncate" title={c.value}>{c.value}</p>
                      {c.sub && <p className="text-[11px] text-slate-400 mt-1 truncate">{c.sub}</p>}
                    </div>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-slate-100">
                      <Icon size={16} className="text-slate-400" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── 가설 검증 ── */}
      {info.hypothesis_validation && info.hypothesis_validation.length > 0 && (
        <Section icon={FlaskConical} iconColor="text-indigo-500" title="가설 검증">
          <div className="space-y-2.5">
            {info.hypothesis_validation.map((h, i) => (
              <div key={i} className="rounded-xl border border-slate-200 p-3.5">
                <div className="flex items-start gap-2.5">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full border font-bold whitespace-nowrap ${verdictBadge(h.verdict)}`}>
                    H{i + 1} {h.verdict}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-900">{h.hypothesis}</div>
                    <div className="text-xs text-slate-500 mt-1">근거: {h.evidence}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── 핵심 발견 + 다음 액션 — 2열 ── */}
      {((info.key_findings && info.key_findings.length > 0) || (info.next_actions && info.next_actions.length > 0)) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {info.key_findings && info.key_findings.length > 0 && (
            <Section icon={Lightbulb} iconColor="text-emerald-500" title="핵심 발견">
              <ul className="space-y-2">
                {info.key_findings.map((f, i) => (
                  <li key={i} className="text-sm text-slate-700 flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                    <span className="leading-relaxed">{f}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}
          {info.next_actions && info.next_actions.length > 0 && (
            <Section icon={Rocket} iconColor="text-fuchsia-500" title="다음 액션">
              <ul className="space-y-2">
                {info.next_actions.map((a, i) => (
                  <li key={i} className="text-sm text-slate-700 flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-fuchsia-500 flex-shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{a}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>
      )}

      {/* ── 타깃 세그먼트 ── */}
      {info.target_segments && info.target_segments.length > 0 && (
        <Section icon={Users} iconColor="text-purple-500" title="타깃 세그먼트">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {info.target_segments.map((s, i) => (
              <div key={i} className="rounded-xl border border-slate-200 p-3.5">
                <div className="text-xs font-bold text-purple-700 mb-1.5">{s.segment}</div>
                <div className="text-xs text-slate-600 leading-relaxed">{s.insight}</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── 리스크 + 기회 — 2열 ── */}
      {((info.risks && info.risks.length > 0) || (info.opportunities && info.opportunities.length > 0)) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {info.risks && info.risks.length > 0 && (
            <Section icon={AlertTriangle} iconColor="text-rose-500" title="리스크">
              <ul className="space-y-2">
                {info.risks.map((r, i) => (
                  <li key={i} className="text-sm text-slate-700 flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-rose-50 text-rose-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">!</span>
                    <span className="leading-relaxed">{r}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}
          {info.opportunities && info.opportunities.length > 0 && (
            <Section icon={Target} iconColor="text-blue-500" title="기회 영역">
              <ul className="space-y-2">
                {info.opportunities.map((o, i) => (
                  <li key={i} className="text-sm text-slate-700 flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">+</span>
                    <span className="leading-relaxed">{o}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>
      )}

      {/* ── 고객 인터뷰 ── */}
      {(() => {
        const quotes = (info.key_quotes && info.key_quotes.length
          ? info.key_quotes
          : (info.key_quote?.text ? [info.key_quote] : [])
        ).filter((q) => q && q.text).slice(0, 3);
        if (!quotes.length) return null;
        return (
          <Section icon={Quote} iconColor="text-amber-500" title="고객 인터뷰">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {quotes.map((q, i) => (
                <div key={i} className="border-l-2 border-amber-300 bg-slate-50 rounded-r-xl p-3.5">
                  <blockquote className="text-sm text-slate-800 italic leading-relaxed">&ldquo;{q.text}&rdquo;</blockquote>
                  {q.source && <div className="text-[11px] text-amber-600 mt-2 text-right font-medium">— {q.source}</div>}
                </div>
              ))}
            </div>
          </Section>
        );
      })()}
    </div>
  );
}
