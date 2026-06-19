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

/** 주문 생성 — 서버가 orderId·금액을 확정하고 결제위젯에 필요한 값을 반환. */
export function createOrder(productKey: string): Promise<CreateOrderResponse> {
  return api("/api/payments/create", {
    method: "POST",
    body: JSON.stringify({ product_key: productKey }),
  });
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
