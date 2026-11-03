import { trackHackleEvent } from "./hackle-analytics";

// GA4와 Hackle의 공통 이벤트 진입점. 한쪽 장애가 다른 쪽이나 화면을 막지 않는다.
// 하나 이상이 전송(또는 메모리 큐 적재)을 수락했는지 반환한다.
type EventParams = Record<string, string | number | boolean | undefined>;

export function trackEvent(name: string, params?: EventParams, options?: { dedupeKey?: string }): boolean {
  if (typeof window === "undefined") return false;
  const gtag = (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag;
  let sent = false;
  if (typeof gtag === "function") {
    try {
      gtag("event", name, params ?? {});
      sent = true;
    } catch {
      // 광고 차단·태그 오류가 있어도 핵클 및 제품 흐름은 계속된다.
    }
  }
  return trackHackleEvent(name, params, options) || sent;
}
