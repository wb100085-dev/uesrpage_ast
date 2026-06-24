"use client";

// 토스페이먼츠 결제 모달 — 결제창(API 개별 연동) 방식.
// 결제수단(카드/계좌이체/간편결제)을 고르고 '결제하기'를 누르면 토스 결제창이 뜬다.
// 부모는 열려 있을 때만 이 컴포넌트를 마운트한다: {open && <CheckoutDialog onClose=... />}
// 결제 성공 시 토스가 successUrl(/checkout/success)로 리다이렉트하며,
// 그 페이지가 서버 승인(confirm)을 호출해 결제를 확정한다.

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { X, ShieldCheck, Loader2, Check, CreditCard, Landmark, Wallet } from "lucide-react";
import { loadTossPayments, ANONYMOUS } from "@tosspayments/tosspayments-sdk";
import { createOrder, type CreateOrderResponse } from "@/lib/payments-api";

const won = (n: number) => n.toLocaleString("ko-KR") + "원";

// 왼쪽 정보 패널에 표시할 상세보고서 포함 내역 (참고용 예시 보고서 구성 기준)
const REPORT_FEATURES = [
  "핵심 지표(KPI)·가설 검증 요약",
  "가상인구 패널 인구통계 정보",
  "문항별 응답 분포 (전 문항)",
  "시장반응·세그먼트·가격·전략 심층 분석",
  "원본 데이터(Raw Data) 포함",
];

// 결제창에서 선택할 결제수단 (토스 payment.requestPayment 의 유효한 method 값).
// 간편결제(토스페이·카카오페이 등)는 별도 method가 아니라 카드 결제창 안에서 선택됨.
const METHODS = [
  { key: "CARD", label: "카드·간편결제", icon: CreditCard },
  { key: "TRANSFER", label: "계좌이체", icon: Landmark },
  { key: "VIRTUAL_ACCOUNT", label: "가상계좌", icon: Wallet },
] as const;
type MethodKey = (typeof METHODS)[number]["key"];

export default function CheckoutDialog({
  onClose,
  productKey = "detailed_report",
  jobId,
}: {
  onClose: () => void;
  productKey?: string;
  jobId?: string; // 결제 후 상세분석 결과로 연결할 설문 job_id
}) {
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<CreateOrderResponse | null>(null);
  const [method, setMethod] = useState<MethodKey>("CARD");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const paymentRef = useRef<any>(null);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return; // StrictMode 이중 실행 방지
    initRef.current = true;
    (async () => {
      try {
        const o = await createOrder(productKey);
        const toss = await loadTossPayments(o.client_key);
        // 결제창(개별 연동) — 위젯과 달리 render 없이 requestPayment 로 결제창을 띄운다.
        paymentRef.current = toss.payment({ customerKey: ANONYMOUS });
        setOrder(o);
      } catch (e) {
        setError(e instanceof Error ? e.message : "결제 준비 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    })();
  }, [productKey]);

  async function pay() {
    const payment = paymentRef.current;
    if (!payment || !order) return;
    setPaying(true);
    setError(null);
    try {
      const successUrl =
        `${window.location.origin}/checkout/success` +
        (jobId ? `?job=${encodeURIComponent(jobId)}` : "");
      await payment.requestPayment({
        method,
        amount: { currency: "KRW", value: order.amount },
        orderId: order.order_id,
        orderName: order.order_name,
        successUrl,
        failUrl: `${window.location.origin}/checkout/fail`,
        customerEmail: order.customer_email ?? undefined,
      });
      // 성공 시 successUrl로 리다이렉트 → 이후 코드 미실행
    } catch (e) {
      setError(e instanceof Error ? e.message : "결제가 취소되었습니다.");
      setPaying(false);
    }
  }

  const amount = order?.amount ?? 99000;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-white rounded-2xl shadow-2xl flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 (모달 우상단 고정) */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 text-white/80 md:text-white hover:text-white"
          aria-label="닫기"
        >
          <X size={20} />
        </button>

        {/* ── 왼쪽: 정보 패널 (보고서 미리보기) ── */}
        <div className="md:w-[46%] shrink-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-700 text-white p-6 sm:p-7 flex flex-col">
          <div className="flex items-center justify-between gap-2">
            <Image
              src="/socialtwin-logo.png"
              alt="SocialTwin"
              width={150}
              height={42}
              className="h-7 w-auto object-contain"
            />
            <span className="shrink-0 text-[11px] font-semibold bg-white/15 px-2 py-0.5 rounded-full">
              30페이지 분량
            </span>
          </div>

          <h2 className="mt-5 text-2xl font-bold tracking-tight">상세보고서</h2>
          <p className="mt-1.5 text-sm text-indigo-100 leading-relaxed">
            가상패널 응답을 심층 분석한 진단 리포트와 원본 데이터를 모두 받아보세요.
          </p>

          {/* 실제 보고서 페이지 미리보기 */}
          <div className="mt-5">
            <div className="relative">
              <div className="absolute -inset-1 translate-x-1.5 translate-y-1.5 rotate-2 rounded-xl bg-white/15" />
              <div className="relative rounded-xl overflow-hidden ring-1 ring-white/40 shadow-xl bg-white">
                <Image
                  src="/checkout/report-summary.png"
                  alt="상세보고서 '조사결과 요약' 페이지 예시"
                  width={460}
                  height={650}
                  className="w-full h-44 object-cover object-top"
                />
              </div>
            </div>
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              <div className="rounded-lg overflow-hidden ring-1 ring-white/30 bg-white">
                <Image
                  src="/checkout/report-cover.png"
                  alt="보고서 표지 예시"
                  width={300}
                  height={420}
                  className="w-full h-16 object-cover object-top"
                />
              </div>
              <div className="rounded-lg overflow-hidden ring-1 ring-white/30 bg-white">
                <Image
                  src="/checkout/report-detail.png"
                  alt="문항별 응답 분포 예시"
                  width={300}
                  height={420}
                  className="w-full h-16 object-cover object-top"
                />
              </div>
            </div>
            <p className="mt-2 text-[11px] text-indigo-200 text-center">
              ▲ 실제 상세보고서 예시 (요약·표지·문항별 분포)
            </p>
          </div>

          <ul className="mt-5 space-y-2">
            {REPORT_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-[13px]">
                <span className="mt-0.5 shrink-0 inline-flex items-center justify-center w-4 h-4 rounded-full bg-white/20">
                  <Check size={11} strokeWidth={3} />
                </span>
                <span className="text-indigo-50">{f}</span>
              </li>
            ))}
          </ul>

          <div className="mt-auto pt-6">
            <p className="text-3xl font-extrabold">{won(amount)}</p>
          </div>
        </div>

        {/* ── 오른쪽: 결제수단 선택 (결제창 방식) ── */}
        <div className="flex-1 min-w-0 p-5 sm:p-6 flex flex-col">
          <h3 className="text-base font-bold text-slate-900">결제 수단 선택</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            선택 후 결제하기를 누르면 토스 결제창이 열립니다.
          </p>

          <div className="mt-4 relative min-h-[180px]">
            {loading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400">
                <Loader2 className="animate-spin" size={28} />
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
            <p className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <div className="mt-auto pt-4">
            <button
              type="button"
              onClick={pay}
              disabled={loading || paying}
              className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 transition disabled:opacity-60"
            >
              {paying ? "결제창 여는 중…" : `${won(amount)} 결제하기`}
            </button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-400">
              <ShieldCheck size={14} /> ㈜토스페이먼츠가 암호화하여 안전하게 처리합니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
