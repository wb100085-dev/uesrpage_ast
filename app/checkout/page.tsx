"use client";

// 토스페이먼츠 결제위젯 — 1회성 서비스 신청 결제.
// 흐름: 상품 선택 → createOrder(서버가 orderId·금액 확정) → 결제위젯 렌더 →
//       requestPayment → successUrl(/checkout/success)에서 서버 승인(confirm).
// 결제수단 UI(카드/계좌이체/간편결제)는 토스 SDK가 #payment-method 에 그려준다.

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { loadTossPayments, ANONYMOUS } from "@tosspayments/tosspayments-sdk";
import { createOrder, type CreateOrderResponse } from "@/lib/payments-api";

// 표시용 카탈로그 — 금액은 백엔드 PRODUCTS가 최종 확정(여기 값은 안내용).
// 평소 진입은 설문 결과 페이지의 결제 모달(CheckoutDialog)이며, 이 페이지는 직접 링크용 폴백.
const PRODUCTS = [
  {
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
  },
];

const won = (n: number) => n.toLocaleString("ko-KR") + "원";

export default function CheckoutPage() {
  const [selected, setSelected] = useState(PRODUCTS[0].key);
  const [phase, setPhase] = useState<"select" | "widget">("select");
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [widgets, setWidgets] = useState<any>(null);
  const [order, setOrder] = useState<CreateOrderResponse | null>(null);

  async function initWidget() {
    setLoading(true);
    setError(null);
    try {
      const o = await createOrder(selected);
      const toss = await loadTossPayments(o.client_key);
      const w = toss.widgets({ customerKey: ANONYMOUS });
      await w.setAmount({ currency: "KRW", value: o.amount });
      setOrder(o);
      setWidgets(w);
      setPhase("widget");
      // #payment-method / #agreement 는 항상 DOM에 존재(hidden) → 바로 렌더 가능
      await Promise.all([
        w.renderPaymentMethods({ selector: "#payment-method", variantKey: "DEFAULT" }),
        w.renderAgreement({ selector: "#agreement", variantKey: "AGREEMENT" }),
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "결제 준비 중 오류가 발생했습니다.");
      setPhase("select");
    } finally {
      setLoading(false);
    }
  }

  async function pay() {
    if (!widgets || !order) return;
    setPaying(true);
    setError(null);
    try {
      await widgets.requestPayment({
        orderId: order.order_id,
        orderName: order.order_name,
        successUrl: `${window.location.origin}/checkout/success`,
        failUrl: `${window.location.origin}/checkout/fail`,
        customerEmail: order.customer_email ?? undefined,
      });
      // 성공 시 successUrl로 리다이렉트되므로 여기 이후 코드는 실행되지 않음
    } catch (e) {
      // 사용자가 결제창을 닫거나 취소한 경우
      setError(e instanceof Error ? e.message : "결제가 취소되었습니다.");
      setPaying(false);
    }
  }

  const selectedProduct = PRODUCTS.find((p) => p.key === selected) ?? PRODUCTS[0];

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
              상품을 선택하고 결제를 진행하세요. 결제는 ㈜토스페이먼츠를 통해 안전하게 처리됩니다.
            </p>

            {/* 상품 선택 */}
            <div className="mt-6 grid sm:grid-cols-2 gap-3">
              {PRODUCTS.map((p) => {
                const active = p.key === selected;
                return (
                  <button
                    key={p.key}
                    type="button"
                    disabled={phase === "widget"}
                    onClick={() => setSelected(p.key)}
                    className={`text-left rounded-2xl border p-4 transition disabled:opacity-60 disabled:cursor-not-allowed ${
                      active
                        ? "border-indigo-500 ring-2 ring-indigo-200 bg-indigo-50/50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-baseline justify-between">
                      <span className="font-semibold text-slate-900">{p.name}</span>
                      <span className="text-indigo-600 font-bold">{won(p.amount)}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{p.desc}</p>
                    <ul className="mt-2 space-y-0.5">
                      {p.features.map((f) => (
                        <li key={f} className="text-xs text-slate-600">
                          · {f}
                        </li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>

            {error && (
              <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            {/* 결제위젯 (항상 DOM에 존재, 위젯 단계에서만 표시) */}
            <div className={phase === "widget" ? "mt-6 block" : "hidden"}>
              <div id="payment-method" />
              <div id="agreement" />
            </div>

            {/* 액션 버튼 */}
            <div className="mt-6">
              {phase === "select" ? (
                <button
                  type="button"
                  onClick={initWidget}
                  disabled={loading}
                  className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 transition disabled:opacity-60"
                >
                  {loading ? "결제수단 불러오는 중…" : `${won(selectedProduct.amount)} 결제하기`}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={pay}
                  disabled={paying}
                  className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 transition disabled:opacity-60"
                >
                  {paying ? "결제창 여는 중…" : `${won(order?.amount ?? selectedProduct.amount)} 결제하기`}
                </button>
              )}
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
