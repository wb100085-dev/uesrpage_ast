"use client";

// 결제 실패/취소 콜백. 토스가 ?code&message&orderId 로 리다이렉트한다.
// 여기서는 승인을 시도하지 않는다(결제가 성사되지 않았으므로).
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { useT } from "@/lib/i18n";

function FailInner() {
  const t = useT();
  const params = useSearchParams();
  const code = params.get("code");
  const message = params.get("message");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-black/30 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500" />
        <div className="px-6 sm:px-8 py-9 flex flex-col items-center text-center gap-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-50 border border-amber-200">
            <AlertTriangle className="text-amber-600" size={30} strokeWidth={2.5} />
          </div>
          <h1 className="text-xl font-bold text-slate-900">{t("결제가 완료되지 않았습니다", "Payment not completed")}</h1>
          <p className="text-sm text-slate-500">
            {/* message 는 토스가 준 원문(한국어) — 그대로 보여준다 */}
            {message ||
              t(
                "결제가 취소되었거나 처리 중 문제가 발생했습니다.",
                "The payment was canceled or something went wrong while processing it.",
              )}
          </p>
          {code && <p className="text-xs text-slate-400 font-mono">{t("오류 코드", "Error code")}: {code}</p>}
          <div className="flex flex-col w-full gap-2 mt-2">
            <Link
              href="/checkout"
              className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3"
            >
              {t("다시 시도", "Try again")}
            </Link>
            <Link
              href="/"
              className="w-full rounded-xl border border-slate-200 text-slate-700 font-medium py-3 hover:bg-slate-50"
            >
              {t("홈으로", "Back to home")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutFailPage() {
  return (
    <Suspense fallback={null}>
      <FailInner />
    </Suspense>
  );
}
