"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Zap, Users, CheckCircle, TrendingUp } from "lucide-react";
import Navbar from "@/components/Navbar";
import RequireAuth from "@/components/RequireAuth";
import { getSurveyStatus } from "@/lib/survey-api";

const STAGES = [
  { label: "가상인구 풀 로딩 중...", min: 0 },
  { label: "타겟 인구 필터링 중...", min: 20 },
  { label: "설문 응답 시뮬레이션 중...", min: 40 },
  { label: "데이터 집계 및 분석 중...", min: 85 },
  { label: "완료!", min: 99 },
];

export default function SurveyPage() {
  return (
    <RequireAuth>
      <SurveyPageInner />
    </RequireAuth>
  );
}

function SurveyPageInner() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;

  const [progress, setProgress] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const elapsedRef = useRef(0);

  const stage = [...STAGES].reverse().find((s) => progress >= s.min) ?? STAGES[0];
  const pct = Math.floor(progress);

  // 프로그레스바: 95%까지 천천히 증가 (실제 완료는 API 폴링)
  useEffect(() => {
    const t = setInterval(() => {
      setProgress((p) => (p >= 95 ? p : p + Math.random() * 1.2 + 0.3));
      setAnswered((a) => Math.min(a + Math.floor(Math.random() * 4 + 1), 500));
      elapsedRef.current += 0.3;
    }, 300);
    return () => clearInterval(t);
  }, []);

  // 실제 API 폴링
  useEffect(() => {
    if (!jobId) return;
    const poll = setInterval(async () => {
      try {
        const { status, error: apiErr } = await getSurveyStatus(jobId);
        if (status === "done") {
          clearInterval(poll);
          setProgress(100);
          setDone(true);
        } else if (status === "error") {
          clearInterval(poll);
          setError(apiErr ?? "설문 실행 중 오류가 발생했습니다.");
        }
      } catch {
        // 네트워크 오류는 무시하고 계속 폴링
      }
    }, 3000);
    return () => clearInterval(poll);
  }, [jobId]);

  useEffect(() => {
    if (done) setTimeout(() => router.push(`/results/${jobId}`), 1400);
  }, [done, jobId, router]);

  const remaining = Math.max(50 - answered, 0);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <div className="flex-1 max-w-lg mx-auto w-full px-6 py-16">
        {/* Header */}
        <div className="text-center mb-10 animate-fade-up">
          <div className="relative inline-block mb-5">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-xl ${done ? "bg-emerald-500 shadow-emerald-200" : error ? "bg-red-500 shadow-red-200" : "bg-gradient-to-br from-indigo-500 to-violet-600 shadow-indigo-200"}`}>
              {done
                ? <CheckCircle size={28} className="text-white" />
                : <Zap size={28} className="text-white fill-white" />
              }
            </div>
            {!done && !error && (
              <div className="absolute inset-0 rounded-2xl bg-indigo-400 animate-pulse-ring" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">
            {done ? "조사 완료!" : error ? "오류 발생" : "조사 진행 중..."}
          </h1>
          <p className="text-slate-400 text-sm">
            {done
              ? "결과 페이지로 이동합니다."
              : error
              ? error
              : "가상인구가 설문에 응답하고 있습니다. 잠시만 기다려주세요."}
          </p>
        </div>

        {/* Progress card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-4 animate-fade-up-2">
          <div className="flex items-center justify-between text-sm mb-4">
            <span className="text-slate-500 font-medium">{stage.label}</span>
            <span className="font-bold text-indigo-600 tabular-nums text-lg">{pct}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="h-2.5 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500 bg-[length:200%_100%] transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4 animate-fade-up-2">
          {[
            { icon: <CheckCircle size={16} className="text-emerald-500" />, val: answered.toLocaleString(), label: "응답 완료" },
            { icon: <Users size={16} className="text-slate-400" />, val: remaining.toLocaleString(), label: "대기 중" },
            { icon: <TrendingUp size={16} className="text-indigo-500" />, val: `${Math.round(elapsedRef.current)}초`, label: "경과 시간" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 text-center">
              <div className="flex justify-center mb-2">{s.icon}</div>
              <div className="text-xl font-bold tabular-nums text-slate-900">{s.val}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* 안내 카드 */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 animate-fade-up-3">
          <div className="flex items-center gap-2 mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-pulse-ring absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-400" />
            </span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">실시간 처리 중</span>
          </div>
          <div className="space-y-3 text-sm text-slate-600">
            {[
              "가상인구 데이터 로딩 완료",
              "Gemini AI로 응답 시뮬레이션 중",
              "응답 데이터 집계 및 분석 중",
              "시장조사 보고서 생성 중",
            ].map((label, i) => (
              <div key={label} className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${pct > i * 25 + 10 ? "bg-emerald-100" : "bg-slate-100"}`}>
                  {pct > i * 25 + 10
                    ? <CheckCircle size={12} className="text-emerald-500" />
                    : <div className="w-2 h-2 rounded-full bg-slate-300" />
                  }
                </div>
                <span className={pct > i * 25 + 10 ? "text-slate-700" : "text-slate-400"}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
