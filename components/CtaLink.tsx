"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getAccessToken, getCachedUser } from "@/lib/auth-api";
import { trackEvent } from "@/lib/analytics";

type Props = {
  className?: string;
  loginHref?: string;
  dashboardHref?: string;
  children: React.ReactNode;
};

export default function CtaLink({
  className,
  // 비로그인: 로그인 화면으로 보내고, 로그인 후 조사 설계로 이어준다.
  loginHref = "/login?next=%2Fdesign",
  dashboardHref = "/dashboard/user",
  children,
}: Props) {
  const [isUser, setIsUser] = useState(false);

  useEffect(() => {
    const refresh = () => {
      setIsUser(Boolean(getAccessToken() && getCachedUser()));
    };
    refresh();
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, []);

  return (
    <Link
      href={isUser ? dashboardHref : loginHref}
      className={className}
      // GA4 이벤트명은 백엔드 analytics_dashboard_views.py 화이트리스트와
      // 관리자 TrafficDashboard 가 같은 키를 참조하므로 바꾸지 않는다(버튼 라벨만 변경됨).
      onClick={() => trackEvent("무료체험_클릭", { 로그인여부: isUser ? "로그인" : "비로그인" })}
    >
      {children}
    </Link>
  );
}
