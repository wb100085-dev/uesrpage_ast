"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Mail, AlertCircle, ArrowLeft, MailCheck } from "lucide-react";
import { authPasswordResetRequest } from "@/lib/auth-api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await authPasswordResetRequest(email.trim());
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
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
          <h2 className="text-xl font-bold text-slate-900 mb-1">비밀번호 찾기</h2>
          <p className="text-sm text-slate-500 mb-6">
            가입하신 이메일을 입력하시면 재설정 링크를 보내드립니다.
          </p>

          {done ? (
            <div className="flex flex-col items-center text-center py-6">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <MailCheck className="text-emerald-600" size={28} />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">메일을 확인해주세요</h3>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                <b>{email}</b>로 비밀번호 재설정 링크를 보냈습니다.
                <br />몇 분 내 도착하지 않으면 스팸함도 확인해주세요.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-colors"
              >
                <ArrowLeft size={14} />
                로그인으로 돌아가기
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                  : "재설정 링크 받기"}
              </button>

              <div className="pt-3 mt-1 border-t border-slate-100 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-600"
                >
                  <ArrowLeft size={12} />
                  로그인으로 돌아가기
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
