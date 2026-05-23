"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  MailCheck,
} from "lucide-react";
import {
  authLogin,
  authRegister,
  authSocialLoginUrl,
  authGetMe,
  getAccessToken,
  getRefreshToken,
} from "@/lib/auth-api";

// 슈퍼유저/스태프가 사용자 프론트에서 로그인하면 관리자 콘솔로 자동 핸드오프.
// URL fragment(#access=...&refresh=...)로 토큰 전달 — 서버 로그·referrer에 안 남음.
const ADMIN_HANDOFF_URL = "https://admin-frontend-chi-two.vercel.app/admin-handoff";

type Mode = "signin" | "signup";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function KakaoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" aria-hidden="true">
      <path
        d="M12 3C6.477 3 2 6.582 2 11.02c0 2.836 1.704 5.328 4.29 6.786l-.868 3.185a.3.3 0 0 0 .444.334L9.63 19.13C10.405 19.3 11.196 19.39 12 19.39c5.523 0 10-3.582 10-8.37S17.523 3 12 3z"
        fill="#3C1E1E"
      />
    </svg>
  );
}

function NaverIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" aria-hidden="true">
      <path
        d="M16.273 12.845 7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z"
        fill="white"
      />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center">
          <span className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      }
    >
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialError = searchParams.get("error");
  const justVerified = searchParams.get("verified") === "1";

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    initialError === "not_authenticated"
      ? "소셜 로그인이 완료되지 않았습니다. 다시 시도해주세요."
      : initialError
      ? "로그인 중 오류가 발생했습니다."
      : null
  );
  // 가입 완료 후 "메일 인증을 확인하세요" 화면
  const [signupSentTo, setSignupSentTo] = useState<string | null>(null);

  // ?next= 안전 추출 — open redirect 방지를 위해 상대 경로(/...)만 허용,
  // 프로토콜 상대(`//...`)와 /login 자기 자신은 제외.
  function getSafeNext(): string | null {
    const raw = searchParams.get("next");
    if (!raw) return null;
    if (!raw.startsWith("/") || raw.startsWith("//")) return null;
    if (raw.startsWith("/login")) return null;
    return raw;
  }

  async function gotoDashboard() {
    // 슈퍼유저/스태프면 관리자 콘솔로 핸드오프, 아니면 본인 대시보드(혹은 next).
    try {
      const me = await authGetMe();
      if (me?.is_superuser || me?.is_staff) {
        const access = getAccessToken() ?? "";
        const refresh = getRefreshToken() ?? "";
        const frag = new URLSearchParams({ access, refresh }).toString();
        window.location.href = `${ADMIN_HANDOFF_URL}#${frag}`;
        return;
      }
    } catch {
      // 사용자 정보 조회 실패 시 일반 사용자 흐름으로 폴백
    }
    const next = getSafeNext();
    router.push(next ?? "/dashboard/user");
  }

  function startSocialLogin(provider: "google" | "kakao" | "naver") {
    setError(null);
    setLoading(true);
    window.location.href = authSocialLoginUrl(provider);
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === "signup") {
        if (password !== password2) {
          throw new Error("비밀번호가 일치하지 않습니다.");
        }
        const res = await authRegister({
          email,
          password1: password,
          password2: password2 || password,
        });
        // 토큰이 발급되었으면 검증 비활성 환경 → 즉시 대시보드 이동
        // 토큰 없이 detail만 왔으면 mandatory → 인증 안내 화면
        const access = res.access ?? res.access_token ?? res.key;
        if (access) {
          gotoDashboard();
        } else {
          setSignupSentTo(email);
        }
      } else {
        await authLogin({ email: email.trim(), password });
        gotoDashboard();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  /* ── 가입 후 인증 메일 안내 화면 ── */
  if (signupSentTo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex flex-col items-center justify-center px-4 py-12">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl" />
        </div>
        <Link href="/" className="relative mb-8">
          <Image
            src="/Socialtwin_o2.png"
            alt="Socialtwin"
            width={160}
            height={46}
            className="h-12 w-auto object-contain brightness-[2] invert"
          />
        </Link>
        <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-black/30 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500" />
          <div className="px-6 sm:px-8 py-8 sm:py-10 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
              <MailCheck className="text-emerald-600" size={32} />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">메일을 확인해주세요</h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              <b className="text-slate-900">{signupSentTo}</b> 으로
              <br />인증 링크를 보냈습니다. 링크를 클릭하면 가입이 완료됩니다.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => { setSignupSentTo(null); setMode("signin"); }}
                className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500"
              >
                로그인 화면으로
              </button>
              <button
                onClick={() => setSignupSentTo(null)}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs hover:bg-slate-50"
              >
                다른 이메일로 다시 가입
              </button>
            </div>
            <p className="mt-6 text-xs text-slate-400">
              메일이 오지 않으면 스팸함도 확인해보세요.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex flex-col items-center justify-center px-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl" />
      </div>

      <Link href="/" className="relative mb-8">
        <Image
          src="/Socialtwin_o2.png"
          alt="Socialtwin"
          width={160}
          height={46}
          className="h-12 w-auto object-contain brightness-[2] invert"
        />
      </Link>

      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-black/30 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500" />

        <div className="px-6 sm:px-8 pt-7 sm:pt-8 pb-8 sm:pb-10">
          {/* 인증 완료 배너 */}
          {justVerified && (
            <div className="mb-5 flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
              <CheckCircle2 size={14} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-700">
                이메일이 확인되었습니다. 이제 로그인하실 수 있습니다.
              </p>
            </div>
          )}

          {/* 로그인 / 회원가입 탭 */}
          <div className="flex bg-slate-100 rounded-xl p-1 mb-8">
            {(["signin", "signup"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null); }}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                  mode === m
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {m === "signin" ? "로그인" : "회원가입"}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 whitespace-pre-line">{error}</p>
            </div>
          )}

          <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">이메일</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hello@example.com"
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-300 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">비밀번호</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "signup" ? "8자 이상 입력" : "비밀번호 입력"}
                  minLength={mode === "signup" ? 8 : undefined}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-300 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {mode === "signup" && (
                <p className="mt-1.5 text-xs text-slate-400">영문·숫자 포함 8자 이상을 권장합니다.</p>
              )}
            </div>

            {mode === "signup" && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">비밀번호 확인</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password2}
                    onChange={(e) => setPassword2(e.target.value)}
                    placeholder="비밀번호 재입력"
                    minLength={8}
                    autoComplete="new-password"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-300 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-500 transition-all hover:shadow-lg hover:shadow-indigo-200 active:scale-[0.99] disabled:opacity-70 mt-1"
            >
              {loading
                ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <>
                    <Sparkles size={14} />
                    {mode === "signin" ? "로그인" : "무료 가입하기"}
                    <ArrowRight size={14} />
                  </>
              }
            </button>
          </form>

          {/* 소셜 로그인 — 원형 버튼 단일 행 */}
          <div className="mt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400 font-medium">또는 소셜 계정으로</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => startSocialLogin("google")}
                disabled={loading}
                aria-label={`Google로 ${mode === "signin" ? "로그인" : "가입"}`}
                title={`Google로 ${mode === "signin" ? "로그인" : "가입"}`}
                className="w-12 h-12 flex items-center justify-center rounded-full border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 transition-all hover:border-slate-300 hover:shadow-md disabled:opacity-60"
              >
                <GoogleIcon />
              </button>
              <button
                onClick={() => startSocialLogin("naver")}
                disabled={loading}
                aria-label={`네이버로 ${mode === "signin" ? "로그인" : "가입"}`}
                title={`네이버로 ${mode === "signin" ? "로그인" : "가입"}`}
                style={{ backgroundColor: "#03C75A" }}
                className="w-12 h-12 flex items-center justify-center rounded-full transition-all hover:brightness-95 hover:shadow-md active:brightness-90 disabled:opacity-60"
              >
                <NaverIcon />
              </button>
              {/* 카카오 — 카카오 비즈니스 채널 인증 전까지 임시 숨김. 인증 후 이 블록만 노출하면 됨. */}
              {false && (
                <button
                  onClick={() => startSocialLogin("kakao")}
                  disabled={loading}
                  aria-label={`카카오로 ${mode === "signin" ? "로그인" : "가입"}`}
                  title={`카카오로 ${mode === "signin" ? "로그인" : "가입"}`}
                  style={{ backgroundColor: "#FEE500" }}
                  className="w-12 h-12 flex items-center justify-center rounded-full transition-all hover:brightness-95 hover:shadow-md active:brightness-90 disabled:opacity-60"
                >
                  <KakaoIcon />
                </button>
              )}
            </div>
          </div>

          {/* 하단 모드 전환 + 비밀번호 찾기 */}
          <div className="mt-6 flex items-center justify-between text-xs">
            <p className="text-slate-400">
              {mode === "signin"
                ? <>계정이 없으신가요?{" "}
                    <button onClick={() => { setMode("signup"); setError(null); }} className="text-indigo-600 font-semibold hover:underline">
                      무료 가입
                    </button>
                  </>
                : <>이미 계정이 있으신가요?{" "}
                    <button onClick={() => { setMode("signin"); setError(null); }} className="text-indigo-600 font-semibold hover:underline">
                      로그인
                    </button>
                  </>
              }
            </p>
            {mode === "signin" && (
              <Link href="/forgot-password" className="text-slate-500 hover:text-indigo-600">
                비밀번호 찾기
              </Link>
            )}
          </div>

        </div>
      </div>

      <p className="relative mt-6 text-xs text-slate-500 text-center">
        가입 시{" "}
        <span className="text-slate-400 underline underline-offset-2 cursor-pointer">서비스 이용약관</span>
        {" "}및{" "}
        <span className="text-slate-400 underline underline-offset-2 cursor-pointer">개인정보처리방침</span>
        에 동의하는 것으로 간주됩니다.
      </p>
    </div>
  );
}
