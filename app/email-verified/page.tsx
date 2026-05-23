import Image from "next/image";
import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";

export default function EmailVerifiedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex flex-col items-center justify-center px-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl" />
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
        <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500" />

        <div className="px-6 sm:px-8 pt-8 sm:pt-10 pb-7 sm:pb-8 flex flex-col items-center text-center gap-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200">
            <Check className="text-emerald-600" size={32} strokeWidth={2.5} />
          </div>
          <h1 className="text-xl font-bold text-slate-900">이메일 인증이 완료되었습니다</h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            가입 절차가 정상적으로 처리되었습니다.<br />
            이제 로그인하여 서비스를 이용하실 수 있습니다.
          </p>

          <Link
            href="/login"
            className="mt-2 inline-flex items-center gap-1.5 px-6 py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-all hover:shadow-lg hover:shadow-indigo-200 active:scale-[0.99]"
          >
            로그인 하러 가기
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
