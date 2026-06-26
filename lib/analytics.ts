// GA4 클릭/이벤트 추적 헬퍼.
// gtag(app/layout.tsx 에서 로드되는 Google Analytics 4)가 있으면 이벤트를 전송하고,
// 로드 전이거나 차단된 경우엔 조용히 무시한다.
// 전송한 이벤트는 GA4 → 보고서 → 실시간 / 참여도 → 이벤트 에서 확인.
type EventParams = Record<string, string | number | boolean | undefined>;

export function trackEvent(name: string, params?: EventParams) {
  if (typeof window === "undefined") return;
  const gtag = (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag;
  if (typeof gtag === "function") {
    gtag("event", name, params ?? {});
  }
}
