"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getAccessToken, getCachedUser } from "@/lib/auth-api";

type Props = {
  className?: string;
  loginHref?: string;
  dashboardHref?: string;
  children: React.ReactNode;
};

export default function CtaLink({
  className,
  loginHref = "/login",
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
    <Link href={isUser ? dashboardHref : loginHref} className={className}>
      {children}
    </Link>
  );
}
