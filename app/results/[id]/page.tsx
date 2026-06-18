"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Download, Users, Target, Sparkles, ChevronRight, TrendingUp, BarChart2, FileText,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import RequireAuth from "@/components/RequireAuth";
import {
  getSurveyResults,
  startDetail,
  getDetailStatus,
  downloadDesignPdf,
  downloadRawCsv,
  downloadReportPdf,
  type SurveyResult,
  type SurveyReport,
} from "@/lib/survey-api";

const COLORS = [
  "from-indigo-500 to-indigo-400",
  "from-violet-500 to-violet-400",
  "from-sky-500 to-sky-400",
  "from-emerald-500 to-emerald-400",
  "from-amber-500 to-amber-400",
];

function Bar({ label, pct, maxPct, gradient }: { label: string; pct: number; maxPct: number; gradient?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-32 text-xs text-slate-500 truncate">{label}</div>
      <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-2.5 rounded-full bg-gradient-to-r ${gradient ?? "from-indigo-500 to-violet-500"}`}
          style={{ width: `${maxPct > 0 ? (pct / maxPct) * 100 : 0}%` }}
        />
      </div>
      <div className="w-10 text-xs font-semibold text-slate-600 text-right tabular-nums">{pct}%</div>
    </div>
  );
}

function QuestionCard({ result }: { result: SurveyResult }) {
  const maxPct = Math.max(...result.분포.map((d) => d["비율(%)"]), 1);
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="text-xs text-indigo-500 font-semibold mb-1">Q{result.문항번호}. {result.제목}</div>
      <div className="text-sm text-slate-700 mb-4">{result.질문}</div>
      <div className="space-y-2.5">
        {result.분포.slice(0, 6).map((d, i) => (
          <Bar
            key={d.선택지}
            label={d.선택지}
            pct={d["비율(%)"]}
            maxPct={maxPct}
            gradient={COLORS[i % COLORS.length]}
          />
        ))}
      </div>
      {result.평균점수 && (
        <div className="mt-3 text-xs text-slate-400">
          평균 점수: <span className="font-semibold text-slate-600">{result.평균점수.toFixed(2)}</span>
        </div>
      )}
    </div>
  );
}

export default function ResultsPage() {
  return (
    <RequireAuth>
      <ResultsPageInner />
    </RequireAuth>
  );
}

function ResultsPageInner() {
  const params = useParams();
  const jobId = params.id as string;

  const [tab, setTab] = useState<"overview" | "report">("report");
  const [data, setData] = useState<{ results: SurveyResult[]; report: SurveyReport; n_respondents: number; sido: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const applyReport = (r?: SurveyReport | null) => {
      if (r) setData((d) => (d ? { ...d, report: r } : d));
    };

    (async () => {
      try {
        const res = await getSurveyResults(jobId);
        if (cancelled) return;
        if (res.status !== "done") {
          setError(res.status === "error" ? "설문 실행 중 오류가 발생했습니다." : "결과를 불러오는 중입니다...");
          setLoading(false);
          return;
        }
        setData({
          results: res.results ?? [],
          report: res.report ?? { 상세분석: "", 결과및전략: "" },
          n_respondents: res.n_respondents ?? 0,
          sido: res.sido ?? "—",
        });
        setLoading(false);

        // 상세 분석(on-demand) 트리거 + 폴링 — 결제 후 보는 상세 보고서
        setDetailLoading(true);
        const start = await startDetail(jobId);
        if (cancelled) return;
        if (start.detail_status === "done") {
          applyReport(start.report);
          setDetailLoading(false);
          return;
        }
        if (start.detail_status === "error") {
          setDetailError("상세분석 생성에 실패했습니다.");
          setDetailLoading(false);
          return;
        }
        const poll = async () => {
          if (cancelled) return;
          try {
            const st = await getDetailStatus(jobId);
            if (cancelled) return;
            if (st.detail_status === "done") {
              applyReport(st.report);
              setDetailLoading(false);
            } else if (st.detail_status === "error") {
              setDetailError(st.detail_error || "상세분석 생성에 실패했습니다.");
              setDetailLoading(false);
            } else {
              timer = setTimeout(poll, 2500);
            }
          } catch {
            timer = setTimeout(poll, 3000);
          }
        };
        timer = setTimeout(poll, 2500);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "결과를 불러올 수 없습니다.");
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [jobId]);

  async function handleDownload(kind: string, fn: () => Promise<void>) {
    setDownloading(kind);
    setDownloadError(null);
    try {
      await fn();
    } catch (e) {
      setDownloadError(e instanceof Error ? e.message : "다운로드에 실패했습니다.");
    } finally {
      setDownloading(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500 text-sm">결과 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-sm">
            <p className="text-red-500 text-sm mb-4">{error ?? "결과를 불러올 수 없습니다."}</p>
            <Link href="/design" className="text-indigo-600 text-sm hover:underline">← 조사 설계로 돌아가기</Link>
          </div>
        </div>
      </div>
    );
  }

  const today = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\. /g, ".").replace(".", "");
  const insightLines = data.report.상세분석
    ? data.report.상세분석.split("\n").filter((l) => l.trim()).slice(0, 4)
    : [];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <div className="max-w-5xl mx-auto w-full px-5 sm:px-6 py-8 sm:py-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5 mb-8 animate-fade-up">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
              <Link href="/design" className="hover:text-slate-600 transition-colors">조사 목록</Link>
              <ChevronRight size={12} />
              <span className="text-slate-600">시장성 조사 결과</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
              시장성 조사 결과
            </h1>
            <div className="flex items-center gap-2.5 text-xs text-slate-400">
              <span>{today}</span>
              <span>·</span>
              <span>설문 {data.results.length}개</span>
              <span>·</span>
              <span>응답 {data.n_respondents}명</span>
              <span>·</span>
              <span className="flex items-center gap-1 text-emerald-500 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                완료
              </span>
            </div>
          </div>
        </div>

        {/* 다운로드 */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6 animate-fade-up-2">
          <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <Download size={15} className="text-indigo-500" /> 다운로드
          </h3>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { kind: "design", label: "가설 및 설문 문항", sub: "PDF", fn: () => downloadDesignPdf(jobId) },
              { kind: "raw", label: "가상인구 Raw Data", sub: "CSV", fn: () => downloadRawCsv(jobId) },
              { kind: "report", label: "상세보고서", sub: "PDF", fn: () => downloadReportPdf(jobId) },
            ].map((d) => (
              <button
                key={d.kind}
                onClick={() => handleDownload(d.kind, d.fn)}
                disabled={downloading !== null}
                className="flex items-center gap-2.5 rounded-xl border border-slate-200 px-4 py-3 text-left hover:border-indigo-300 hover:bg-indigo-50/40 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Download size={16} className="text-indigo-500 shrink-0" />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-slate-800 truncate">
                    {downloading === d.kind ? "준비 중…" : d.label}
                  </span>
                  <span className="block text-[11px] text-slate-400">{d.sub}</span>
                </span>
              </button>
            ))}
          </div>
          {downloadError && <p className="mt-2 text-xs text-red-600">{downloadError}</p>}
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 animate-fade-up-2">
          {[
            { icon: <Users size={18} className="text-indigo-500" />, val: `${data.n_respondents}명`, label: "총 응답자", bg: "bg-indigo-50" },
            { icon: <Target size={18} className="text-emerald-500" />, val: `${data.results.length}개`, label: "설문 문항", bg: "bg-emerald-50" },
            { icon: <FileText size={18} className="text-violet-500" />, val: data.sido || "전국", label: "조사 지역", bg: "bg-violet-50" },
            { icon: <Sparkles size={18} className="text-amber-500" />, val: "AI 분석", label: "보고서 포함", bg: "bg-amber-50" },
          ].map((k) => (
            <div key={k.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className={`w-9 h-9 rounded-xl ${k.bg} flex items-center justify-center mb-3`}>
                {k.icon}
              </div>
              <div className="text-2xl font-bold text-slate-900 mb-0.5 tracking-tight">{k.val}</div>
              <div className="text-xs text-slate-400 font-medium">{k.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 w-fit mb-6 animate-fade-up-2 shadow-sm">
          {(["overview", "report"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t === "overview"
                ? <span className="flex items-center gap-1.5"><BarChart2 size={13} />문항별 결과</span>
                : <span className="flex items-center gap-1.5"><TrendingUp size={13} />AI 분석 보고서</span>
              }
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === "overview" && (
          <div className="space-y-5 animate-scale-in">
            <div className="grid md:grid-cols-2 gap-5">
              {data.results.map((r) => (
                <QuestionCard key={r.문항번호} result={r} />
              ))}
            </div>

            {insightLines.length > 0 && (
              <div className="bg-gradient-to-br from-indigo-950 to-slate-900 rounded-2xl p-6 border border-indigo-800/40">
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
                    <Sparkles size={15} className="text-indigo-300" />
                  </div>
                  <span className="text-sm font-semibold text-white">AI 핵심 인사이트</span>
                </div>
                <div className="space-y-3">
                  {insightLines.map((line, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm text-slate-300 leading-relaxed">
                      <span className="w-5 h-5 rounded-full bg-indigo-500/25 text-indigo-300 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Report — 상세분석 결과 (관리자 7단계 상세 보고서) */}
        {tab === "report" && (
          <div className="space-y-5 animate-scale-in">
            {detailLoading && (
              <div className="flex items-center gap-3 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-sm text-slate-500">
                <span className="w-5 h-5 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                AI가 상세 분석 보고서를 생성하고 있습니다… (수십 초 정도 걸릴 수 있어요)
              </div>
            )}
            {detailError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{detailError}</p>
            )}
            {(
              [
                { key: "executive_summary", label: "핵심 요약", color: "text-indigo-500" },
                { key: "상세분석", label: "상세분석", color: "text-indigo-500" },
                { key: "segment_analysis", label: "세그먼트 분석", color: "text-violet-500" },
                { key: "pain_points", label: "페인포인트·미충족 니즈", color: "text-rose-500" },
                { key: "market_competitive", label: "시장·경쟁 관점", color: "text-sky-500" },
                { key: "strategy", label: "마케팅 전략 제안", color: "text-emerald-500" },
                { key: "limitations", label: "한계 및 후속 조사", color: "text-amber-500" },
                { key: "결과및전략", label: "결과 및 전략", color: "text-emerald-500" },
              ] as const
            ).map((s) => {
              const text = (data.report[s.key] ?? "").trim();
              if (!text) return null;
              return (
                <div key={s.key} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <BarChart2 size={15} className={s.color} /> {s.label}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{text}</p>
                </div>
              );
            })}
            {!detailLoading &&
              !detailError &&
              !(
                [
                  "executive_summary",
                  "상세분석",
                  "segment_analysis",
                  "pain_points",
                  "market_competitive",
                  "strategy",
                  "limitations",
                  "결과및전략",
                ] as const
              ).some((k) => (data.report[k] ?? "").trim()) && (
                <p className="text-sm text-slate-400 text-center py-8">표시할 분석 보고서가 없습니다.</p>
              )}
          </div>
        )}
      </div>
    </div>
  );
}
