"use client";

// 토스페이먼츠 결제 모달 — 버튼 클릭 시 결제위젯을 띄운다.
// 부모는 열려 있을 때만 이 컴포넌트를 마운트한다: {open && <CheckoutDialog onClose=... />}
// (마운트=초기화이므로 내부 reset 불필요 — 닫았다 열면 새 주문이 생성된다.)
// 결제 성공 시 토스가 successUrl(/checkout/success)로 전체 페이지를 리다이렉트하며,
// 그 페이지가 서버 승인(confirm)을 호출해 결제를 확정한다.

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { X, ShieldCheck, Loader2, Check } from "lucide-react";
import { loadTossPayments, ANONYMOUS } from "@tosspayments/tosspayments-sdk";
import { createOrder, type CreateOrderResponse } from "@/lib/payments-api";

const won = (n: number) => n.toLocaleString("ko-KR") + "원";
const LIST_PRICE = 99000; // 정가 (표시용 — 실제 청구액은 서버가 확정)

// 왼쪽 정보 패널에 표시할 상세보고서 포함 내역 (참고용 예시 보고서 구성 기준)
const REPORT_FEATURES = [
  "핵심 지표(KPI)·가설 검증 요약",
  "가상인구 패널 인구통계 정보",
  "문항별 응답 분포 (전 문항)",
  "시장반응·세그먼트·가격·전략 심층 분석",
  "원본 데이터(Raw Data) 포함",
];

export default function CheckoutDialog({
  onClose,
  productKey = "detailed_report",
}: {
  onClose: () => void;
  productKey?: string;
}) {
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<CreateOrderResponse | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const widgetsRef = useRef<any>(null);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return; // StrictMode 이중 실행 방지
    initRef.current = true;
    (async () => {
      try {
        const o = await createOrder(productKey);
        const toss = await loadTossPayments(o.client_key);
        const w = toss.widgets({ customerKey: ANONYMOUS });
        await w.setAmount({ currency: "KRW", value: o.amount });
        widgetsRef.current = w;
        setOrder(o);
        await Promise.all([
          w.renderPaymentMethods({ selector: "#cd-payment-method", variantKey: "DEFAULT" }),
          w.renderAgreement({ selector: "#cd-agreement", variantKey: "AGREEMENT" }),
        ]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "결제 준비 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    })();
  }, [productKey]);

  async function pay() {
    const w = widgetsRef.current;
    if (!w || !order) return;
    setPaying(true);
    setError(null);
    try {
      await w.requestPayment({
        orderId: order.order_id,
        orderName: order.order_name,
        successUrl: `${window.location.origin}/checkout/success`,
        failUrl: `${window.location.origin}/checkout/fail`,
        customerEmail: order.customer_email ?? undefined,
      });
      // 성공 시 successUrl로 리다이렉트 → 이후 코드 미실행
    } catch (e) {
      setError(e instanceof Error ? e.message : "결제가 취소되었습니다.");
      setPaying(false);
    }
  }

  const amount = order?.amount ?? 49500;

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
            <span className="inline-flex bg-white rounded-md px-2.5 py-1.5 shadow-sm">
              <Image
                src="/socialtwin-logo.png"
                alt="SocialTwin"
                width={150}
                height={42}
                className="h-7 w-auto object-contain"
              />
            </span>
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
            <div className="flex items-baseline gap-2">
              <span className="text-sm text-indigo-200 line-through">{won(LIST_PRICE)}</span>
              <span className="text-xs font-semibold bg-rose-500 text-white px-1.5 py-0.5 rounded">
                50% 할인
              </span>
            </div>
            <p className="mt-1 text-3xl font-extrabold">{won(amount)}</p>
          </div>
        </div>

        {/* ── 오른쪽: 결제창 ── */}
        <div className="flex-1 min-w-0 p-5 sm:p-6 flex flex-col">
          <h3 className="text-base font-bold text-slate-900">결제 수단 선택</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            카드 · 계좌이체 · 간편결제 중 선택하세요.
          </p>

          {/* 결제위젯 (토스 SDK가 아래 div 안에 렌더) */}
          <div className="mt-3 relative min-h-[180px]">
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400">
                <Loader2 className="animate-spin" size={28} />
                <span className="text-sm">결제수단을 불러오는 중…</span>
              </div>
            )}
            <div id="cd-payment-method" />
            <div id="cd-agreement" />
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
