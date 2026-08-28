// 토스페이먼츠 결제 API 헬퍼.
// 백엔드(/api/payments/*)를 Bearer 토큰과 함께 호출한다. raw fetch 대신 이 헬퍼를 쓸 것
// (lib/survey-api.ts의 apiFetch와 동일 패턴 — 로그인 사용자의 결제를 user_email에 귀속).
import { getAccessToken } from "./auth-api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (typeof window !== "undefined") {
    const tok = getAccessToken();
    if (tok && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${tok}`);
    }
  }
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    let detail = "";
    try {
      const j = await res.json();
      detail = j?.error || j?.message || JSON.stringify(j);
      // 백엔드가 주는 진단 힌트(예: 누락된 DB 테이블 안내)도 함께 노출해 원인 파악을 돕는다.
      if (j?.hint) detail += ` (${j.hint})`;
    } catch {
      detail = await res.text();
    }
    throw new Error(detail || `결제 API 오류 ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export interface Product {
  key: string;
  name: string;
  amount: number;
}

export interface CreateOrderResponse {
  client_key: string;
  order_id: string;
  order_name: string;
  amount: number;
  customer_email?: string | null;
}

export interface ConfirmResponse {
  ok: boolean;
  order_id: string;
  amount: number;
  method?: string;
  receipt_url?: string;
  order_name?: string;
  already?: boolean;
}

/** 상품 카탈로그 (백엔드 PRODUCTS). */
export function getProducts(): Promise<{ products: Product[] }> {
  return api("/api/payments/products");
}

/** 주문 생성 — 서버가 orderId·금액을 확정하고 결제위젯에 필요한 값을 반환.
 * jobId 를 주면 '결제된 설문'으로 기록되어 내 분석 히스토리에서 결과 페이지로 직행할 수 있다. */
export function createOrder(productKey: string, jobId?: string): Promise<CreateOrderResponse> {
  return api("/api/payments/create", {
    method: "POST",
    body: JSON.stringify({ product_key: productKey, ...(jobId ? { job_id: jobId } : {}) }),
  });
}

/** 내가 상세보고서를 볼 수 있는 조사 목록 (결제 완료 + 쿠폰 바인딩 + 무제한 권한). */
export function getReportAccessJobs(): Promise<{ all_access: boolean; job_ids: string[] }> {
  return api("/api/report-access/jobs");
}

/** successUrl 콜백에서 받은 값으로 결제를 최종 승인. */
export function confirmPayment(p: {
  paymentKey: string;
  orderId: string;
  amount: number;
}): Promise<ConfirmResponse> {
  return api("/api/payments/confirm", {
    method: "POST",
    body: JSON.stringify({
      paymentKey: p.paymentKey,
      orderId: p.orderId,
      amount: p.amount,
    }),
  });
}

/* ── 월정액 구독 ───────────────────────────────────────────
 * 백엔드는 별도 subscriptions 테이블 없이 payments(product_key='monthly_100',
 * status='paid')의 최신 승인시각 + 30일로 활성 여부를 계산한다.
 * 결제 1건 = 1개월이며, 갱신 결제를 하면 그 시점부터 다시 30일이 시작된다. */

/** 월정액 구독 상품 key — 백엔드 PRODUCTS 와 1:1. */
export const SUBSCRIPTION_PRODUCT_KEY = "monthly_100";

export interface Subscription {
  active: boolean;
  plan: string;
  plan_name: string;
  amount: number;
  /** 구독 중 조사 1건당 가상인구 수 (100) */
  sample_size: number;
  period_days: number;
  started_at: string | null;
  expires_at: string | null;
  /** 남은 일수 (올림). 비활성이면 0 */
  days_left: number;
}

/** 내 월정액 구독 상태. 비로그인·오류 시 비활성으로 폴백한다(화면이 깨지지 않도록). */
export function getMySubscription(): Promise<Subscription> {
  return api<Subscription>("/api/subscription/me").catch(() => ({
    active: false,
    plan: SUBSCRIPTION_PRODUCT_KEY,
    plan_name: "월정액 구독 (가상인구 100명 무제한)",
    amount: 500000,
    sample_size: 100,
    period_days: 30,
    started_at: null,
    expires_at: null,
    days_left: 0,
  }));
}

/** 패널 수 → 건당 결제 상품 key (백엔드 PANEL_PRODUCT_BY_SIZE 와 1:1). 무료(10명)는 null. */
export function panelProductKey(size: number): string | null {
  if (size === 100) return "survey_100";
  if (size === 500) return "survey_500";
  return null;
}

export interface OrderStatus {
  order_id: string;
  status: string;
  product_key: string | null;
  amount: number;
  order_name: string | null;
}

/** 주문 1건의 상태 — 결제 후 조사 실행을 열어줄지 서버에 확인할 때 사용. */
export function getOrder(orderId: string): Promise<OrderStatus> {
  return api(`/api/payments/order?order_id=${encodeURIComponent(orderId)}`);
}
