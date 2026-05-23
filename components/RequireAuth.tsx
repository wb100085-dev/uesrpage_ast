"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { getAccessToken } from "@/lib/auth-api";

/**
 * 클라이언트 사이드 인증 가드.
 * - 마운트 시 localStorage의 access 토큰 확인.
 * - 토큰 없으면 /login?next=<현재 경로(+검색)>으로 replace 이동.
 * - 토큰 있으면 children 렌더.
 *
 * useSearchParams/usePathname 같은 Next 네비 훅을 안 쓰는 이유:
 * SSG 빌드 시 Suspense 경계가 필요해져 페이지마다 wrapper가 강제됨.
 * 이 컴포넌트는 useEffect 안에서만 동작 → window.location 직접 읽어도 안전 (client only).
 */
export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const tok = getAccessToken();
    if (!tok) {
      const full = window.location.pathname + window.location.search;
      router.replace(`/login?next=${encodeURIComponent(full)}`);
      return;
    }
    setAuthed(true);
  }, [router]);

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
