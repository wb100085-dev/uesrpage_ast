"use client";

/**
 * 결제 연동 준비 안내 모달.
 *
 * 토스 라이브 키가 아직 발급되지 않아 실결제가 불가능하므로, 일반 사용자에게는
 * 결제창을 띄우지 않고 이 안내를 보여준다. PG사 심사용 테스트 계정
 * (PG_TEST_EMAILS)과 운영진(슈퍼유저/스태프)만 실제 결제창으로 진입한다.
 * → 라이브 키가 들어오면 canOpenCheckout() 이 항상 true 를 반환하도록 바꾸면 된다.
 */
import { X, Phone, Mail, Clock } from "lucide-react";
import { getCachedUser } from "@/lib/auth-api";

/** PG사 심사용 테스트 계정 — 이 계정으로 로그인하면 실제 결제창이 열린다. */
export const PG_TEST_EMAILS = ["test@tosspayments.co"];

const SUPPORT = {
  phone: "010-9969-0406",
  phoneHref: "tel:+821099690406",
  email: "hys@omninode.kr",
  hours: "평일 10:00 – 17:00 (점심 12:00 – 13:30, 주말·공휴일 휴무)",
};

/** 지금 이 사용자에게 실제 결제창을 열어도 되는가 */
export function canOpenCheckout(): boolean {
  const u = getCachedUser();
  const email = (u?.email || "").trim().toLowerCase();
  if (PG_TEST_EMAILS.includes(email)) return true;
  return Boolean(u?.is_superuser || u?.is_staff);
}

export default function PaymentPendingDialog({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="닫기"
          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100"
        >
          <X size={16} />
        </button>

        <h3 className="text-base font-bold text-slate-900 pr-6 break-keep">
          지금은 카드 결제 및 계좌이체만 가능합니다.
        </h3>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed break-keep">
          아래 회사 전화번호 및 이메일로 연락주시면 처리해드리겠습니다.
        </p>

        <dl className="mt-5 space-y-2.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm">
          <div className="flex items-center gap-2.5">
            <Phone size={15} className="shrink-0 text-indigo-500" />
            <dt className="sr-only">전화</dt>
            <dd>
              <a href={SUPPORT.phoneHref} className="font-semibold text-slate-800 hover:underline">
                {SUPPORT.phone}
              </a>
            </dd>
          </div>
          <div className="flex items-center gap-2.5">
            <Mail size={15} className="shrink-0 text-indigo-500" />
            <dt className="sr-only">이메일</dt>
            <dd>
              <a href={`mailto:${SUPPORT.email}`} className="font-semibold text-slate-800 hover:underline">
                {SUPPORT.email}
              </a>
            </dd>
          </div>
          <div className="flex items-start gap-2.5">
            <Clock size={15} className="shrink-0 mt-0.5 text-slate-400" />
            <dt className="sr-only">운영시간</dt>
            <dd className="text-xs text-slate-500 leading-relaxed">{SUPPORT.hours}</dd>
          </div>
        </dl>

        <button
          onClick={onClose}
          className="mt-6 w-full py-3 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-all"
        >
          확인
        </button>
      </div>
    </div>
  );
}
