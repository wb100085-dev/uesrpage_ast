"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Download, Users, Target, Sparkles, ChevronRight, TrendingUp, BarChart2, FileText,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { getSurveyResults, type SurveyResult, type SurveyReport } from "@/lib/survey-api";

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
  const params = useParams();
  const jobId = params.id as string;

  const [tab, setTab] = useState<"overview" | "report">("overview");
  const [data, setData] = useState<{ results: SurveyResult[]; report: SurveyReport; n_respondents: number; sido: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSurveyResults(jobId)
      .then((res) => {
        if (res.status === "done") {
          setData({ results: res.results, report: res.report, n_respondents: res.n_respondents, sido: res.sido });
        } else {
          setError(res.status === "error" ? "설문 실행 중 오류가 발생했습니다." : "결과를 불러오는 중입니다...");
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [jobId]);

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

      <div className="max-w-5xl mx-auto w-full px-6 py-10">

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
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-500 transition-all hover:shadow-lg hover:shadow-indigo-200 hover:-translate-y-px self-start">
            <Download size={15} />
            PDF 다운로드
          </button>
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

        {/* Report */}
        {tab === "report" && (
          <div className="space-y-5 animate-scale-in">
            {data.report.상세분석 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <BarChart2 size={15} className="text-indigo-500" /> 상세분석
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{data.report.상세분석}</p>
              </div>
            )}
            {data.report.결과및전략 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <TrendingUp size={15} className="text-emerald-500" /> 결과 및 전략
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{data.report.결과및전략}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
