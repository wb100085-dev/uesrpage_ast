"use client";

/**
 * 결제 연동 준비 안내 모달. **2026-09-04 부로 평시에는 뜨지 않는다.**
 *
 * 원래는 토스 라이브 키 발급 전이라 일반 사용자에게 결제창 대신 이 안내를 띄우고,
 * 운영진(슈퍼유저/스태프)과 PG 심사용 계정만 실결제로 보내는 장치였다.
 * 라이브 키 적용·실결제 검증이 끝나 canOpenCheckout() 이 항상 true 가 되었으므로,
 * 지금은 모든 사용자가 결제창으로 바로 진입한다.
 *
 * 컴포넌트는 남겨둔다 — 결제를 다시 닫아야 할 상황(PG 장애, 상품 개편 등)에서
 * canOpenCheckout() 만 false 로 되돌리면 안내 화면이 그대로 살아난다.
 */
import { X, Phone, Mail, Clock } from "lucide-react";

/** PG사 심사용 테스트 계정. 전면 개방 이후로는 특별 취급이 없다(전원 결제창 진입).
 *  결제를 다시 닫을 때 예외 목록으로 되살려 쓸 수 있어 남겨둔다. */
export const PG_TEST_EMAILS = ["test@tosspayments.co"];

const SUPPORT = {
  phone: "010-9969-0406",
  phoneHref: "tel:+821099690406",
  email: "hys@omninode.kr",
  hours: "평일 10:00 – 17:00 (점심 12:00 – 13:30, 주말·공휴일 휴무)",
};

/** 지금 이 사용자에게 실제 결제창을 열어도 되는가.
 *
 * 라이브 키 적용 완료(2026-09-04, 실결제 1건으로 전 구간 검증)로 전면 개방.
 * 결제 진입점(/design, /dashboard/user, /checkout)은 모두 로그인 필수이므로
 * 여기서 별도 로그인 검사를 하지 않아도 결제자 귀속(payments.user_email)이 보장된다.
 *
 * 결제를 다시 닫으려면 이 함수만 false 로 되돌리면 된다 — 호출처 4곳이 모두
 * PaymentPendingDialog 안내로 자동 전환된다.
 */
export function canOpenCheckout(): boolean {
  return true;
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
