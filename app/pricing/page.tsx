import PricingClient from "./PricingClient";

// metadata 는 서버 컴포넌트에서만 export 할 수 있어 여기 남기고, 본문(한/영 전환)은 PricingClient 로 분리.
// (검색엔진·링크 미리보기용이라 한국어 그대로 둔다.)
export const metadata = {
  title: "요금 안내 · SocialTwin",
  description:
    "SocialTwin 요금 안내 — 가상인구 10명 무료 체험부터 건당 결제(100명 99,000원 / 500명 300,000원), 30일권(100명 규모 무제한 500,000원 / 30일)까지. 자동갱신 없는 선불 이용권이며, 모든 금액은 부가세 포함입니다.",
};

export default function PricingPage() {
  return <PricingClient />;
}
