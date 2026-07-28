"use client";

/**
 * 무료 열람 링크 리딤 페이지 — /free-report?pass=<token>
 *
 * 관리자 콘솔(전역 설정)에서 생성한 링크로 들어온 사용자를 처리한다:
 *  - 비로그인 → 로그인 페이지로 (로그인 후 이 페이지로 복귀해 자동 리딤)
 *  - 로그인 → 토큰 리딤 → 성공 시 이 계정은 결제 없이 상세보고서 열람 가능
 */
import { useEffect, useRef, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import { getAccessToken } from "@/lib/auth-api";
import { redeemReportToken } from "@/lib/survey-api";
import { trackEvent } from "@/lib/analytics";

function FreeReportInner() {
  const router = useRouter();
  const params = useSearchParams();
  const token = (params.get("pass") || "").trim();
  const [state, setState] = useState<"working" | "ok" | "error">("working");
  const [message, setMessage] = useState("");
  const ranRef = useRef(false); // StrictMode 이중 실행 방지

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;
    if (!token) {
      setState("error");
      setMessage("링크가 올바르지 않습니다. (토큰 누락)");
      return;
    }
    if (!getAccessToken()) {
      router.replace(`/login?next=${encodeURIComponent(`/free-report?pass=${token}`)}`);
      return;
    }
    redeemReportToken(token)
      .then((r) => {
        trackEvent("무료열람링크_사용");
        setState("ok");
        setMessage(r.note || "");
      })
      .catch((e) => {
        setState("error");
        setMessage(e instanceof Error ? e.message : "링크 확인에 실패했습니다.");
      });
  }, [token, router]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-md mx-auto px-4 pt-28 pb-16">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
          {state === "working" && (
            <>
              <Loader2 size={36} className="mx-auto text-indigo-500 animate-spin mb-4" />
              <h1 className="text-base font-bold text-slate-900 mb-1">무료 열람 링크 확인 중…</h1>
              <p className="text-xs text-slate-500">잠시만 기다려 주세요.</p>
            </>
          )}
          {state === "ok" && (
            <>
              <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={30} className="text-emerald-500" />
              </div>
              <h1 className="text-base font-bold text-slate-900 mb-2">무료 열람이 활성화되었습니다</h1>
              <p className="text-xs text-slate-500 leading-relaxed mb-6">
                {message || "이 계정은 결제 없이 상세보고서를 열람할 수 있습니다."}
                <br />
                조사를 진행하시면 결과 단계에서 <b className="text-slate-700">상세보고서 보기</b> 버튼이 나타납니다.
              </p>
              <Link
                href="/design"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-500 transition-all"
              >
                조사 시작하기 <ArrowRight size={15} />
              </Link>
            </>
          )}
          {state === "error" && (
            <>
              <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={30} className="text-rose-500" />
              </div>
              <h1 className="text-base font-bold text-slate-900 mb-2">링크를 사용할 수 없습니다</h1>
              <p className="text-xs text-rose-500 leading-relaxed mb-6">{message}</p>
              <Link
                href="/design"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-slate-300 text-slate-600 font-medium text-sm hover:bg-slate-50 transition-all"
              >
                서비스 둘러보기
              </Link>
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
