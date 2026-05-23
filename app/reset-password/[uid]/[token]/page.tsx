"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { authPasswordResetConfirm } from "@/lib/auth-api";

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams<{ uid: string; token: string }>();
  const uid = params?.uid ?? "";
  const token = params?.token ?? "";

  const [pwd1, setPwd1] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (pwd1 !== pwd2) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (pwd1.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await authPasswordResetConfirm({
        uid,
        token,
        new_password1: pwd1,
        new_password2: pwd2,
      });
      setDone(true);
      setTimeout(() => router.replace("/login"), 2000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      let friendly = msg;
      if (/Invalid value|Invalid token|token/i.test(msg)) {
        friendly = "재설정 링크가 만료되었거나 유효하지 않습니다. 다시 요청해주세요.";
      }
      setError(friendly);
    } finally {
      setLoading(false);
    }
  }

  const linkValid = !!uid && !!token;

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
          <h2 className="text-xl font-bold text-slate-900 mb-1">비밀번호 재설정</h2>
          <p className="text-sm text-slate-500 mb-6">새 비밀번호를 입력하세요.</p>

          {!linkValid ? (
            <div className="text-center py-6">
              <p className="text-sm text-slate-600 mb-4">잘못된 링크입니다.</p>
              <Link
                href="/forgot-password"
                className="inline-flex items-center px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500"
              >
                재설정 메일 다시 요청
              </Link>
            </div>
          ) : done ? (
            <div className="flex flex-col items-center text-center py-6">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <CheckCircle2 className="text-emerald-600" size={28} />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">비밀번호가 변경되었습니다</h3>
              <p className="text-sm text-slate-600">곧 로그인 페이지로 이동합니다…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">새 비밀번호</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPwd ? "text" : "password"}
                    required
                    value={pwd1}
                    onChange={(e) => setPwd1(e.target.value)}
                    placeholder="8자 이상 입력"
                    minLength={8}
                    autoComplete="new-password"
                    className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-300 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-slate-400">영문·숫자 포함 8자 이상을 권장합니다.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">새 비밀번호 확인</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPwd ? "text" : "password"}
                    required
                    value={pwd2}
                    onChange={(e) => setPwd2(e.target.value)}
                    placeholder="다시 입력"
                    minLength={8}
                    autoComplete="new-password"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-300 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <AlertCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 whitespace-pre-line">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-500 transition-all hover:shadow-lg hover:shadow-indigo-200 active:scale-[0.99] disabled:opacity-70 mt-1 flex items-center justify-center"
              >
                {loading
                  ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : "비밀번호 변경"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
