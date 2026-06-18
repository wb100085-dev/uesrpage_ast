"use client";

// 토스페이먼츠 결제창(API 개별 연동) — 1회성 상세보고서 결제 (직접 링크용 폴백 페이지).
// 평소 진입은 설문 결과 페이지의 결제 모달(CheckoutDialog). 흐름:
//   createOrder(서버가 orderId·금액 확정) → 결제수단 선택 → payment.requestPayment(결제창)
//   → successUrl(/checkout/success)에서 서버 승인(confirm).

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, CreditCard, Landmark, Wallet, Loader2 } from "lucide-react";
import { loadTossPayments, ANONYMOUS } from "@tosspayments/tosspayments-sdk";
import { createOrder, type CreateOrderResponse } from "@/lib/payments-api";

// 표시용 — 금액은 백엔드 PRODUCTS가 최종 확정(여기 값은 안내용).
const PRODUCT = {
  key: "detailed_report",
  name: "상세보고서",
  amount: 49500,
  desc: "정가 99,000원 → 50% 할인",
  features: [
    "가상패널에게 질문하기",
    "가상인구 패널 인구통계 정보",
    "문항별 응답 분포",
    "상세분석 및 시사점 보고서",
    "Raw Data 포함",
  ],
};

const METHODS = [
  { key: "CARD", label: "신용·체크카드", icon: CreditCard },
  { key: "TRANSFER", label: "계좌이체", icon: Landmark },
  { key: "EASY_PAY", label: "간편결제", icon: Wallet },
] as const;
type MethodKey = (typeof METHODS)[number]["key"];

const won = (n: number) => n.toLocaleString("ko-KR") + "원";

export default function CheckoutPage() {
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<CreateOrderResponse | null>(null);
  const [method, setMethod] = useState<MethodKey>("CARD");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const paymentRef = useRef<any>(null);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    (async () => {
      try {
        const o = await createOrder(PRODUCT.key);
        const toss = await loadTossPayments(o.client_key);
        paymentRef.current = toss.payment({ customerKey: ANONYMOUS });
        setOrder(o);
      } catch (e) {
        setError(e instanceof Error ? e.message : "결제 준비 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function pay() {
    const payment = paymentRef.current;
    if (!payment || !order) return;
    setPaying(true);
    setError(null);
    try {
      await payment.requestPayment({
        method,
        amount: { currency: "KRW", value: order.amount },
        orderId: order.order_id,
        orderName: order.order_name,
        successUrl: `${window.location.origin}/checkout/success`,
        failUrl: `${window.location.origin}/checkout/fail`,
        customerEmail: order.customer_email ?? undefined,
      });
      // 성공 시 successUrl로 리다이렉트되므로 여기 이후 코드는 실행되지 않음
    } catch (e) {
      setError(e instanceof Error ? e.message : "결제가 취소되었습니다.");
      setPaying(false);
    }
  }

  const amount = order?.amount ?? PRODUCT.amount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 px-4 py-10">
      <div className="mx-auto w-full max-w-2xl">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 mb-6"
        >
          <ArrowLeft size={16} /> 홈으로
        </Link>

        <div className="bg-white rounded-3xl shadow-2xl shadow-black/30 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500" />
          <div className="px-6 sm:px-8 py-7 sm:py-8">
            <h1 className="text-xl font-bold text-slate-900">서비스 신청 · 결제</h1>
            <p className="mt-1 text-sm text-slate-500">
              결제는 ㈜토스페이먼츠 결제창을 통해 안전하게 처리됩니다.
            </p>

            {/* 상품 안내 */}
            <div className="mt-6 rounded-2xl border border-slate-200 p-4">
              <div className="flex items-baseline justify-between">
                <span className="font-semibold text-slate-900">{PRODUCT.name}</span>
                <span className="text-indigo-600 font-bold">{won(amount)}</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{PRODUCT.desc}</p>
              <ul className="mt-2 space-y-0.5">
                {PRODUCT.features.map((f) => (
                  <li key={f} className="text-xs text-slate-600">
                    · {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* 결제수단 선택 */}
            <div className="mt-5">
              <p className="text-sm font-semibold text-slate-800 mb-2">결제 수단</p>
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-slate-400">
                  <Loader2 className="animate-spin" size={22} />
                  <span className="text-sm">결제 준비 중…</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {METHODS.map((m) => {
                    const active = m.key === method;
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => setMethod(m.key)}
                        className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                          active
                            ? "border-indigo-500 ring-2 ring-indigo-200 bg-indigo-50/50"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <Icon size={18} className={active ? "text-indigo-600" : "text-slate-400"} />
                        <span className="text-sm font-medium text-slate-800">{m.label}</span>
                        <span
                          className={`ml-auto w-4 h-4 rounded-full border-2 ${
                            active ? "border-indigo-600 bg-indigo-600" : "border-slate-300"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {error && (
              <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            <div className="mt-6">
              <button
                type="button"
                onClick={pay}
                disabled={loading || paying}
                className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 transition disabled:opacity-60"
              >
                {paying ? "결제창 여는 중…" : `${won(amount)} 결제하기`}
              </button>
            </div>

            <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-400">
              <ShieldCheck size={14} /> 결제 정보는 토스페이먼츠가 암호화하여 처리하며 당사 서버에 저장되지 않습니다.
            </p>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-slate-500">
          결제 진행 시 <Link href="/terms" className="underline">이용약관</Link> 및{" "}
          <Link href="/refund" className="underline">결제·환불 정책</Link>에 동의하게 됩니다.
        </p>
      </div>
    </div>
  );
}
