"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Sparkles } from "lucide-react";
import { authGetMe, setAuthTokens, setCachedUser } from "@/lib/auth-api";

/**
 * 소셜 로그인 콜백 페이지.
 * Django 백엔드가 `/api/auth/social-finish` 에서 JWT를 발급한 뒤
 * `?access=...&refresh=...&username=...` 쿼리로 이 페이지에 리다이렉트합니다.
 *
 * 동작:
 *  1) 쿼리에서 토큰을 읽어 localStorage에 저장
 *  2) `/api/auth/me` 호출로 사용자 정보 캐시
 *  3) 사용자 대시보드로 이동
 *  4) `?error=...` 가 있으면 로그인 페이지로 되돌림
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const errorParam = params.get("error");
    if (errorParam) {
      const next = errorParam === "not_authenticated" ? "not_authenticated" : "callback_failed";
      router.replace(`/login?error=${next}`);
      return;
    }

    const access = params.get("access");
    const refresh = params.get("refresh");
    const username = params.get("username");

    if (!access) {
      setError("토큰을 받지 못했습니다. 다시 시도해주세요.");
      const t = setTimeout(() => router.replace("/login?error=callback_failed"), 1500);
      return () => clearTimeout(t);
    }

    setAuthTokens(access, refresh);
    if (username) {
      setCachedUser({ username, email: "" });
    }

    // 사용자 상세를 백엔드에서 조회해 캐시 갱신 후 대시보드로 이동
    void (async () => {
      try {
        await authGetMe();
      } catch {
        // 무시 — 토큰만 있어도 대시보드는 동작
      }
      router.replace("/dashboard/user");
    })();
  }, [params, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex flex-col items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-2xl shadow-black/30 px-10 py-12 flex flex-col items-center gap-4 max-w-md w-full">
        {error ? (
          <>
            <AlertCircle className="text-rose-500" size={32} />
            <p className="text-sm text-slate-700 text-center whitespace-pre-line">{error}</p>
          </>
        ) : (
          <>
            <Sparkles className="text-indigo-500 animate-pulse" size={28} />
            <p className="text-sm text-slate-700">로그인 처리 중…</p>
            <span className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          </>
        )}
      </div>
    </div>
  );
}
