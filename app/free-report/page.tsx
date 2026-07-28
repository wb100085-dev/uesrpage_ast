"use client";

/**
 * 무료 쿠폰(열람 링크) 진입 페이지 — /free-report?pass=<token>
 *
 * 로그인 요구 없이 곧바로 조사 설계(제품정의) 페이지로 보낸다.
 * 토큰은 localStorage 에 보관했다가 로그인된 시점에 design 페이지가 자동 리딤한다.
 * (이미 로그인 상태면 여기서 즉시 리딤 후 이동.)
 */
import { useEffect, useRef, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { getAccessToken } from "@/lib/auth-api";
import { redeemReportToken, claimReportJob, FREE_REPORT_PASS_KEY } from "@/lib/survey-api";
import { trackEvent } from "@/lib/analytics";

function FreeReportInner() {
  const router = useRouter();
  const params = useSearchParams();
  const token = (params.get("pass") || "").trim();
  const job = (params.get("job") || "").trim(); // 로그인 복귀 시 바로 열람할 설문
  const [errMsg, setErrMsg] = useState("");
  const ranRef = useRef(false); // StrictMode 이중 실행 방지

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;
    if (!token) {
      setErrMsg("쿠폰 링크가 올바르지 않습니다. (토큰 누락)");
      return;
    }
    trackEvent("무료열람링크_진입");
    if (getAccessToken()) {
      // 이미 로그인 — 즉시 리딤. job 이 있으면(결과 화면에서 로그인 유도로 온 경우)
      // 그 설문에 무료 1건을 확정하고 바로 상세보고서로, 없으면 설계 페이지로.
      redeemReportToken(token)
        .then(async () => {
          try { localStorage.removeItem(FREE_REPORT_PASS_KEY); } catch { /* noop */ }
          if (job) {
            await claimReportJob(job).catch(() => {});
            router.replace(`/results/${job}`);
          } else {
            router.replace("/design");
          }
        })
        .catch((e) => setErrMsg(e instanceof Error ? e.message : "쿠폰 확인에 실패했습니다."));
      return;
    }
    // 비로그인 — 토큰을 보관하고 곧장 설계 페이지로 (로그인 시점에 자동 리딤)
    try {
      localStorage.setItem(FREE_REPORT_PASS_KEY, token);
    } catch {
      /* storage 불가 환경 — 무시 */
    }
    router.replace("/design");
  }, [token, job, router]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-md mx-auto px-4 pt-28 pb-16">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
          {errMsg ? (
            <>
              <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={30} className="text-rose-500" />
              </div>
              <h1 className="text-base font-bold text-slate-900 mb-2">쿠폰을 사용할 수 없습니다</h1>
              <p className="text-xs text-rose-500 leading-relaxed mb-6">{errMsg}</p>
              <Link
                href="/design"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-slate-300 text-slate-600 font-medium text-sm hover:bg-slate-50 transition-all"
              >
                서비스 둘러보기
              </Link>
            </>
          ) : (
            <>
              <Loader2 size={36} className="mx-auto text-indigo-500 animate-spin mb-4" />
              <h1 className="text-base font-bold text-slate-900 mb-1">이동 중…</h1>
              <p className="text-xs text-slate-500">조사 설계 페이지로 이동합니다.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FreeReportPage() {
  return (
    <Suspense fallback={null}>
      <FreeReportInner />
    </Suspense>
  );
}
