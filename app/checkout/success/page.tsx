"use client";

// 결제 성공 콜백. 토스가 ?paymentKey&orderId&amount 로 리다이렉트한 뒤, 여기서
// 백엔드 /api/payments/confirm 을 호출해 결제를 "최종 승인"한다.
// 이 confirm 호출이 끝나야 실제 결제가 확정된다(승인 전까지는 미완 상태).
import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";
import { confirmPayment, type ConfirmResponse } from "@/lib/payments-api";

const won = (n: number) => n.toLocaleString("ko-KR") + "원";

function SuccessInner() {
  const params = useSearchParams();
  const paymentKey = params.get("paymentKey");
  const orderId = params.get("orderId");
  const amount = params.get("amount");
  const validParams = !!(paymentKey && orderId && amount);

  const [confirmState, setConfirmState] = useState<"loading" | "ok" | "error">("loading");
  const [result, setResult] = useState<ConfirmResponse | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const ran = useRef(false); // StrictMode 이중 호출 방지

  useEffect(() => {
    if (!validParams || ran.current) return;
    ran.current = true;
    confirmPayment({ paymentKey, orderId, amount: Number(amount) })
      .then((r) => {
        setResult(r);
        setConfirmState("ok");
      })
      .catch((e) => {
        setConfirmError(e instanceof Error ? e.message : "결제 승인에 실패했습니다.");
        setConfirmState("error");
      });
  }, [validParams, paymentKey, orderId, amount]);

  // 파라미터 누락이면 effect 없이 즉시 에러 화면 (synchronous setState in effect 회피)
  const state = validParams ? confirmState : "error";
  const error = validParams ? confirmError : "결제 정보가 올바르지 않습니다.";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-black/30 overflow-hidden">
        <div
          className={`h-1 bg-gradient-to-r ${
            state === "error"
              ? "from-red-500 via-rose-500 to-red-500"
              : "from-emerald-500 via-teal-500 to-emerald-500"
          }`}
        />
        <div className="px-6 sm:px-8 py-9 flex flex-col items-center text-center gap-4">
          {state === "loading" && (
            <>
              <Loader2 className="text-indigo-500 animate-spin" size={40} />
              <h1 className="text-lg font-bold text-slate-900">결제를 확정하는 중입니다…</h1>
              <p className="text-sm text-slate-500">잠시만 기다려 주세요. 창을 닫지 마세요.</p>
            </>
          )}

          {state === "ok" && result && (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200">
                <Check className="text-emerald-600" size={32} strokeWidth={2.5} />
              </div>
              <h1 className="text-xl font-bold text-slate-900">결제가 완료되었습니다</h1>
              <dl className="w-full mt-1 text-sm divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                <div className="flex justify-between px-4 py-2.5">
                  <dt className="text-slate-500">상품</dt>
                  <dd className="font-medium text-slate-900">{result.order_name ?? "-"}</dd>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <dt className="text-slate-500">결제 금액</dt>
                  <dd className="font-semibold text-slate-900">{won(result.amount)}</dd>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <dt className="text-slate-500">주문번호</dt>
                  <dd className="font-mono text-xs text-slate-600">{result.order_id}</dd>
                </div>
              </dl>
              <div className="flex flex-col w-full gap-2 mt-2">
                {result.receipt_url && (
                  <a
                    href={result.receipt_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full rounded-xl border border-slate-200 text-slate-700 font-medium py-3 hover:bg-slate-50"
                  >
                    영수증 보기
                  </a>
                )}
                <Link
                  href="/dashboard/user"
                  className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3"
                >
                  대시보드로 이동
                </Link>
              </div>
            </>
          )}

          {state === "error" && (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 border border-red-200">
                <X className="text-red-600" size={32} strokeWidth={2.5} />
              </div>
              <h1 className="text-xl font-bold text-slate-900">결제 승인에 실패했습니다</h1>
              <p className="text-sm text-slate-500">{error}</p>
              <p className="text-xs text-slate-400">
                결제가 출금되었는데 실패로 표시되면 자동으로 취소 처리되거나, 고객센터로 문의해 주세요.
              </p>
              <Link
                href="/checkout"
                className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 mt-1"
              >
                다시 시도
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessInner />
    </Suspense>
  );
}
