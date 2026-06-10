"use client";

import type { InfographicSummary } from "@/lib/survey-api";

/**
 * 조사 결과 1슬라이드 인포그래픽 요약.
 * 관리자 프론트엔드(admin_Frontend) Survey.tsx 의 InfographicCard 를 이식 —
 * brand 계열 색상만 사용자 페이지 톤(indigo)으로 맞춤.
 */
export default function InfographicCard({ info }: { info: InfographicSummary }) {
  const verdictBadge = (v: string) => {
    if (v.includes("채택")) return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (v.includes("기각")) return "bg-rose-100 text-rose-700 border-rose-200";
    return "bg-amber-100 text-amber-700 border-amber-200";
  };
  return (
    <div className="rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-fuchsia-50 p-5 sm:p-6 shadow-lg shadow-indigo-100">
      {info.headline && (
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center leading-snug">
          {info.headline}
        </h2>
      )}
      {info.subheadline && (
        <p className="text-sm text-slate-600 mb-4 text-center mt-1">{info.subheadline}</p>
      )}

      {/* KPI 카드 — 기본 8개 */}
      {info.kpi_cards && info.kpi_cards.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {info.kpi_cards.map((c, i) => (
            <div key={i} className="bg-white rounded-xl p-3 border border-slate-200 text-center">
              <div className="text-[10px] uppercase tracking-wide text-slate-500">{c.label}</div>
              <div className="text-xl font-bold text-indigo-700 mt-1 truncate" title={c.value}>{c.value}</div>
              {c.sub && <div className="text-[10px] text-slate-400 mt-0.5">{c.sub}</div>}
            </div>
          ))}
        </div>
      )}

      {/* 가설 검증 — 가설별 채택/기각/혼합 */}
      {info.hypothesis_validation && info.hypothesis_validation.length > 0 && (
        <div className="mb-6">
          <h4 className="font-bold text-sm text-slate-700 mb-2 flex items-center gap-1">🧪 가설 검증</h4>
          <div className="space-y-2">
            {info.hypothesis_validation.map((h, i) => (
              <div key={i} className="bg-white rounded-lg p-3 border border-slate-200">
                <div className="flex items-start gap-2">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full border font-bold whitespace-nowrap ${verdictBadge(h.verdict)}`}>
                    H{i + 1} {h.verdict}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-900">{h.hypothesis}</div>
                    <div className="text-xs text-slate-600 mt-0.5">근거: {h.evidence}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 핵심 발견 + 다음 액션 — 2열 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {info.key_findings && info.key_findings.length > 0 && (
          <div>
            <h4 className="font-bold text-sm text-emerald-700 mb-2 flex items-center gap-1">💡 핵심 발견</h4>
            <ul className="space-y-1.5">
              {info.key_findings.map((f, i) => (
                <li key={i} className="text-sm text-slate-700 flex items-start gap-2 bg-white rounded p-2 border border-emerald-100">
                  <span className="text-emerald-600 font-bold shrink-0">{i + 1}.</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {info.next_actions && info.next_actions.length > 0 && (
          <div>
            <h4 className="font-bold text-sm text-fuchsia-700 mb-2 flex items-center gap-1">🚀 다음 액션</h4>
            <ul className="space-y-1.5">
              {info.next_actions.map((a, i) => (
                <li key={i} className="text-sm text-slate-700 flex items-start gap-2 bg-white rounded p-2 border border-fuchsia-100">
                  <span className="text-fuchsia-600 font-bold shrink-0">▶</span>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 타깃 세그먼트 */}
      {info.target_segments && info.target_segments.length > 0 && (
        <div className="mb-6">
          <h4 className="font-bold text-sm text-purple-700 mb-2 flex items-center gap-1">👥 타깃 세그먼트</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {info.target_segments.map((s, i) => (
              <div key={i} className="bg-white rounded-lg p-3 border border-purple-100">
                <div className="text-xs font-bold text-purple-700 mb-1">{s.segment}</div>
                <div className="text-xs text-slate-700">{s.insight}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 리스크 + 기회 — 2열 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {info.risks && info.risks.length > 0 && (
          <div>
            <h4 className="font-bold text-sm text-rose-700 mb-2 flex items-center gap-1">⚠️ 리스크</h4>
            <ul className="space-y-1.5">
              {info.risks.map((r, i) => (
                <li key={i} className="text-sm text-slate-700 flex items-start gap-2 bg-white rounded p-2 border border-rose-100">
                  <span className="text-rose-600 font-bold shrink-0">!</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {info.opportunities && info.opportunities.length > 0 && (
          <div>
            <h4 className="font-bold text-sm text-blue-700 mb-2 flex items-center gap-1">🎯 기회 영역</h4>
            <ul className="space-y-1.5">
              {info.opportunities.map((o, i) => (
                <li key={i} className="text-sm text-slate-700 flex items-start gap-2 bg-white rounded p-2 border border-blue-100">
                  <span className="text-blue-600 font-bold shrink-0">+</span>
                  <span>{o}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 고객 인터뷰 인용 (key_quotes 3개 우선, 없으면 단일 key_quote 폴백) */}
      {(() => {
        const quotes = (info.key_quotes && info.key_quotes.length
          ? info.key_quotes
          : (info.key_quote?.text ? [info.key_quote] : [])
        ).filter((q) => q && q.text).slice(0, 3);
        if (!quotes.length) return null;
        return (
          <div>
            <div className="text-xs font-bold text-amber-700 mb-2">💬 고객 인터뷰</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {quotes.map((q, i) => (
                <div key={i} className="bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-amber-400 rounded-r-lg p-3">
                  <blockquote className="text-sm text-slate-800 italic leading-relaxed">&ldquo;{q.text}&rdquo;</blockquote>
                  {q.source && <div className="text-[11px] text-amber-600 mt-1 text-right">— {q.source}</div>}
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
