"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Sparkles } from "lucide-react";
import { getAccessToken } from "@/lib/auth-api";

/**
 * 클라이언트 사이드 인증 가드.
 * - 마운트 시 localStorage의 access 토큰 확인.
 * - 토큰 없으면 /login?next=<현재 경로(+검색)>으로 replace 이동.
 * - 토큰 있으면 children 렌더.
 *
 * 미들웨어를 안 쓰는 이유: 이 앱은 JWT를 localStorage에 보관 → 서버 사이드(미들웨어)에서
 * 읽을 수 없음. 쿠키로 옮기지 않는 한 가드는 클라이언트에서 한다.
 */
export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const tok = getAccessToken();
    if (!tok) {
      const qs = searchParams.toString();
      const full = qs ? `${pathname}?${qs}` : (pathname || "/");
      router.replace(`/login?next=${encodeURIComponent(full)}`);
      return;
    }
    setAuthed(true);
  }, [pathname, router, searchParams]);

  if (authed !== true) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Sparkles size={20} className="text-indigo-500 animate-pulse" />
          <span className="text-sm">인증 확인 중…</span>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
