"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Clock, RefreshCw, LogOut } from "lucide-react";
import {
  getAccessToken,
  clearAuth,
  parseJwtExp,
  authRefreshToken,
} from "@/lib/auth-api";

/**
 * 세션 만료 가드 (방식 B: 활동 기반 자동 갱신 + 비활동 시 팝업).
 *
 * 동작:
 *  - 마운트 시 access 토큰의 exp를 읽어 타이머 2개 설정 (경고 / 강제 만료).
 *  - 경고 시각(만료 N분 전)에 도달하면 직전 사용자 활동 여부로 분기:
 *    · 최근 활동 → silent refresh (사용자 모름) → 새 토큰으로 타이머 재설정
 *    · 비활동 → 카운트다운 모달 표시 ("연장" / "지금 로그아웃")
 *  - 모달 무응답 + exp 도달 → 강제 로그아웃 (?error=session_expired)
 *  - 다른 탭에서 토큰 변경되면 자동으로 재스케줄.
 */

const ACTION_BEFORE_EXP_S = 5 * 60; // 만료 5분 전에 행동 결정
const ACTIVE_WINDOW_MS = 10 * 60 * 1000; // 최근 10분 내 활동이면 "활동 중"
const ACTIVITY_THROTTLE_MS = 60 * 1000; // 활동 기록 1분에 한 번만 갱신

// 로그인이 필요한 보호 경로. 그 외(랜딩·인증·약관 등)는 공개 페이지로 간주.
const PROTECTED_PREFIXES = ["/dashboard", "/design", "/results", "/survey"];
function isProtectedPath(p: string): boolean {
  return PROTECTED_PREFIXES.some((pre) => p === pre || p.startsWith(pre + "/"));
}
function currentPath(): string {
  return typeof window !== "undefined" ? window.location.pathname : "/";
}

export default function SessionGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const [showWarn, setShowWarn] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const lastActivityRef = useRef<number>(Date.now());
  const lastActivityWrittenRef = useRef<number>(0);
  const warnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const expireTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function clearTimers() {
    if (warnTimerRef.current) clearTimeout(warnTimerRef.current);
    if (expireTimerRef.current) clearTimeout(expireTimerRef.current);
    if (tickRef.current) clearInterval(tickRef.current);
    warnTimerRef.current = null;
    expireTimerRef.current = null;
    tickRef.current = null;
  }

  function forceLogout(reason: "expired" | "user") {
    clearTimers();
    clearAuth();
    setShowWarn(false);
    if (reason === "user") {
      router.push("/");
      return;
    }
    // expired — 보호 페이지에서만 로그인으로. 랜딩 등 공개 페이지면 토큰만 정리하고 머무름.
    if (isProtectedPath(currentPath())) {
      router.push("/login?error=session_expired");
    }
  }

  function showWarning(expMs: number) {
    setShowWarn(true);
    const tick = () => {
      const remain = Math.max(0, Math.floor((expMs - Date.now()) / 1000));
      setCountdown(remain);
      if (remain <= 0) forceLogout("expired");
    };
    tick();
    tickRef.current = setInterval(tick, 1000);
  }

  async function silentRefresh(expMs: number) {
    setRefreshing(true);
    const ok = await authRefreshToken();
    setRefreshing(false);
    if (ok) {
      scheduleFromToken();
    } else {
      // refresh 실패 → 사용자에게 알려야 함
      showWarning(expMs);
    }
  }

  function decideAtWarnTime(expMs: number) {
    const inactiveMs = Date.now() - lastActivityRef.current;
    if (inactiveMs < ACTIVE_WINDOW_MS) {
      silentRefresh(expMs);
    } else {
      showWarning(expMs);
    }
  }

  function scheduleFromToken() {
    clearTimers();
    setShowWarn(false);
    const tok = getAccessToken();
    if (!tok) return;
    const exp = parseJwtExp(tok);
    if (!exp) return;
    const expMs = exp * 1000;
    const now = Date.now();
    const ttl = expMs - now;
    const onProtected = isProtectedPath(currentPath());
    if (ttl <= 0) {
      // 만료 토큰 정리. 보호 페이지면 로그인으로 보내고, 공개/랜딩 페이지면 머무름.
      clearAuth();
      if (onProtected) router.push("/login?error=session_expired");
      return;
    }
    if (!onProtected) {
      // 공개/랜딩 페이지에서는 만료 모달·리다이렉트 없이 대기 (보호 페이지 진입 시 재스케줄).
      return;
    }
    const warnInMs = ttl - ACTION_BEFORE_EXP_S * 1000;
    if (warnInMs <= 0) {
      decideAtWarnTime(expMs);
    } else {
      warnTimerRef.current = setTimeout(() => decideAtWarnTime(expMs), warnInMs);
    }
    // 안전망: 팝업 무응답 대비
    expireTimerRef.current = setTimeout(() => forceLogout("expired"), ttl);
  }

  async function handleExtend() {
    setRefreshing(true);
    const ok = await authRefreshToken();
    setRefreshing(false);
    setShowWarn(false);
    if (ok) scheduleFromToken();
    else forceLogout("expired");
  }

  function handleLogoutNow() {
    forceLogout("user");
  }

  useEffect(() => {
    function onActivity() {
      const now = Date.now();
      if (now - lastActivityWrittenRef.current < ACTIVITY_THROTTLE_MS) return;
      lastActivityRef.current = now;
      lastActivityWrittenRef.current = now;
    }
    const events: (keyof WindowEventMap)[] = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));

    function onStorage(e: StorageEvent) {
      if (e.key === "vpg.auth.access") scheduleFromToken();
    }
    window.addEventListener("storage", onStorage);

    function onAuthChanged() {
      scheduleFromToken();
    }
    window.addEventListener("vpg-auth-changed", onAuthChanged);

    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity));
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("vpg-auth-changed", onAuthChanged);
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 경로 변경 시 재스케줄 — 공개 페이지에서 보호 페이지로 진입하면 가드를 다시 무장.
  useEffect(() => {
    scheduleFromToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!showWarn) return null;

  const mins = Math.floor(countdown / 60);
  const secs = countdown % 60;
  const timeText = `${mins}분 ${String(secs).padStart(2, "0")}초`;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-warn-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Clock size={20} className="text-amber-600" />
          </div>
          <div>
            <h2 id="session-warn-title" className="text-base font-bold text-slate-900">
              세션이 곧 만료됩니다
            </h2>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">
              비활동 상태가 길어졌어요.{" "}
              <b className="text-slate-700 tabular-nums">{timeText}</b> 후 자동
              로그아웃됩니다.
            </p>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button
            onClick={handleLogoutNow}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors"
          >
            <LogOut size={14} /> 지금 로그아웃
          </button>
          <button
            onClick={handleExtend}
            disabled={refreshing}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 disabled:opacity-60 transition-colors"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "연장 중…" : "연장하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
