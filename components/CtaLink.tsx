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
  // 비로그인 무료체험: 로그인 화면을 거치지 않고 곧장 설계 페이지로 진입.
  loginHref = "/design",
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
      onClick={() => trackEvent("무료체험_클릭", { 로그인여부: isUser ? "로그인" : "비로그인" })}
    >
      {children}
    </Link>
  );
}
