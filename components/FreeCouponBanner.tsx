"use client";

/**
 * 무료 쿠폰(열람 링크) 안내 배너 — 랜딩(/) 최상단.
 *
 * /free-report?pass=<token> 로 들어온 비로그인 방문자는 토큰만 localStorage 에
 * 보관하고 랜딩으로 온다. 이 배너가 "쿠폰이 대기 중"임을 알리고 로그인으로 잇는다.
 * 로그인 상태로 랜딩에 오면 여기서 즉시 리딤해 계정에 귀속시킨다.
 * (보관 토큰이 없으면 아무것도 렌더하지 않으므로 일반 방문자에겐 보이지 않는다.)
 */
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Ticket, AlertCircle } from "lucide-react";
import { getAccessToken } from "@/lib/auth-api";
import { FREE_REPORT_PASS_KEY, redeemPendingReportToken } from "@/lib/survey-api";

type State = "none" | "guest" | "redeeming" | "applied" | "failed";

export default function FreeCouponBanner() {
  const [state, setState] = useState<State>("none");

  useEffect(() => {
    let token = "";
    try {
      token = localStorage.getItem(FREE_REPORT_PASS_KEY) || "";
    } catch {
      return; // storage 불가 환경 — 배너 생략
    }
    if (!token) return;
    if (!getAccessToken()) {
      setState("guest"); // 로그인 시점에 design/dashboard 가 자동 리딤
      return;
    }
    setState("redeeming");
    redeemPendingReportToken()
      .then((ok) => setState(ok ? "applied" : "failed"))
      .catch(() => setState("failed"));
  }, []);

  if (state === "none") return null;

  const failed = state === "failed";
  // 랜딩 히어로(어두운 배경) 바로 위에 붙으므로 같은 톤의 어두운 바탕을 깔고 색을 얹는다.
  const tone = failed
    ? "border-rose-400/30 bg-rose-950/60"
    : "border-emerald-400/30 bg-emerald-950/60";

  return (
    <div className="bg-[#080812]">
     <div className={`border-b ${tone}`}>
      <div className="max-w-7xl mx-auto px-5 sm:px-6 py-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
            failed ? "bg-rose-500/15 text-rose-300" : "bg-emerald-500/15 text-emerald-300"
          }`}
        >
          {failed ? <AlertCircle size={15} /> : state === "applied" ? <CheckCircle2 size={15} /> : <Ticket size={15} />}
        </span>

        {state === "guest" && (
          <>
            <p className="text-sm text-slate-200">
              <span className="font-semibold text-white">상세보고서 무료 쿠폰</span>이 확인되었습니다.
              <span className="text-slate-400"> 로그인(또는 무료 가입)하시면 계정에 자동으로 적용됩니다.</span>
            </p>
            <Link
              href="/login?next=%2Fdesign"
              className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-white transition-all hover:bg-emerald-400"
            >
              로그인하고 쿠폰 사용하기 <ArrowRight size={14} />
            </Link>
          </>
        )}

        {state === "redeeming" && (
          <p className="text-sm text-slate-300">무료 쿠폰을 계정에 적용하는 중…</p>
        )}

        {state === "applied" && (
          <>
            <p className="text-sm text-slate-200">
              <span className="font-semibold text-white">무료 쿠폰이 적용되었습니다.</span>
              <span className="text-slate-400"> 조사를 시작하면 상세보고서를 결제 없이 보실 수 있습니다.</span>
            </p>
            <Link
              href="/design"
              className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-white transition-all hover:bg-emerald-400"
            >
              조사 시작하기 <ArrowRight size={14} />
            </Link>
          </>
        )}

        {failed && (
          <p className="text-sm text-slate-200">
            <span className="font-semibold text-white">쿠폰을 적용하지 못했습니다.</span>
            <span className="text-slate-400"> 유효기간이 지났거나 이미 사용된 링크일 수 있습니다.</span>
          </p>
        )}
      </div>
     </div>
    </div>
  );
}
