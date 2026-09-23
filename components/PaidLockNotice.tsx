import { Lock } from "lucide-react";

/**
 * 유료 전용 기능 잠금 안내 (결과 페이지 우측 패널의 두 탭이 함께 쓴다).
 *
 * 무료 이용자에게 "API 오류 403: ..." 같은 날것의 문자열을 보여주지 않기 위한 화면이다.
 * 실제 차단은 서버(api/_utils.has_paid_access)가 하며, 이건 안내일 뿐이다.
 */
export default function PaidLockNotice({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-10">
      <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
        <Lock size={18} className="text-slate-400" />
      </div>
      <p className="text-sm font-medium text-slate-700 mb-1.5">{title}</p>
      <p className="text-xs text-slate-400 leading-relaxed max-w-[15rem]">{desc}</p>
      <a
        href="/pricing"
        className="mt-4 inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-700 transition"
      >
        이용권 안내 보기
      </a>
    </div>
  );
}
