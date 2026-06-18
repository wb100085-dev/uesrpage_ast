"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Download, Users, Target, Sparkles, ChevronRight, BarChart2, FileText, MessageCircle, Send,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import RequireAuth from "@/components/RequireAuth";
import {
  getSurveyResults,
  askPanel,
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

  const [tab, setTab] = useState<"overview" | "chat">("overview");
  const [data, setData] = useState<{ results: SurveyResult[]; report: SurveyReport; n_respondents: number; sido: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // 가상인구 패널에게 질문 (챗)
  const [messages, setMessages] = useState<{ role: "user" | "panel"; text: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getSurveyResults(jobId)
      .then((res) => {
        if (cancelled) return;
        if (res.status === "done") {
          setData({
            results: res.results ?? [],
            report: res.report ?? { 상세분석: "", 결과및전략: "" },
            n_respondents: res.n_respondents ?? 0,
            sido: res.sido ?? "—",
          });
        } else {
          setError(res.status === "error" ? "설문 실행 중 오류가 발생했습니다." : "결과를 불러오는 중입니다...");
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "결과를 불러올 수 없습니다.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
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

  async function sendChat() {
    const q = chatInput.trim();
    if (!q || chatSending) return;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setChatInput("");
    setChatSending(true);
    setChatError(null);
    try {
      const { answer } = await askPanel(jobId, q);
      setMessages((m) => [...m, { role: "panel", text: answer }]);
    } catch (e) {
      setChatError(e instanceof Error ? e.message : "답변을 받지 못했습니다.");
    } finally {
      setChatSending(false);
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
          {(["overview", "chat"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t === "overview"
                ? <span className="flex items-center gap-1.5"><BarChart2 size={13} />문항별 결과</span>
                : <span className="flex items-center gap-1.5"><MessageCircle size={13} />가상인구 패널에게 질문</span>
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

        {/* 가상인구 패널에게 질문 (챗) */}
        {tab === "chat" && (
          <div className="animate-scale-in">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col min-h-[26rem]">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <MessageCircle size={15} className="text-indigo-500" /> 가상인구 패널에게 질문
                </h3>
                <p className="mt-0.5 text-xs text-slate-400">
                  이 조사에 응답한 가상인구 패널 결과를 바탕으로 AI가 답합니다.
                </p>
              </div>

              {/* 메시지 */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {messages.length === 0 && (
                  <div className="text-center text-sm text-slate-400 py-10">
                    <MessageCircle size={28} className="mx-auto mb-3 text-slate-300" />
                    궁금한 점을 물어보세요.
                    <div className="mt-4 flex flex-wrap gap-2 justify-center">
                      {["가장 중요한 시사점은?", "어떤 세그먼트를 먼저 공략해야 하나요?", "가격 저항은 어느 정도인가요?"].map((ex) => (
                        <button
                          key={ex}
                          onClick={() => setChatInput(ex)}
                          className="text-xs px-3 py-1.5 rounded-full border border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition"
                        >
                          {ex}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${
                        m.role === "user" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
                {chatSending && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 text-slate-400 rounded-2xl px-4 py-2.5 text-sm flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin" />
                      답변 생성 중…
                    </div>
                  </div>
                )}
                {chatError && <p className="text-sm text-red-600">{chatError}</p>}
              </div>

              {/* 입력 */}
              <div className="border-t border-slate-100 p-3">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendChat();
                  }}
                  className="flex items-end gap-2"
                >
                  <textarea
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendChat();
                      }
                    }}
                    rows={1}
                    placeholder="가상패널에게 질문을 입력하세요 (Enter 전송 · Shift+Enter 줄바꿈)"
                    className="flex-1 resize-none rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-400 max-h-32"
                  />
                  <button
                    type="submit"
                    disabled={chatSending || !chatInput.trim()}
                    className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-50"
                    aria-label="전송"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
