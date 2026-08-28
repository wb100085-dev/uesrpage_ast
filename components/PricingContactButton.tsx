"use client";

import { useState } from "react";
import ContactDialog from "@/components/ContactDialog";

/**
 * 요금 안내 페이지의 플랜별 "문의하기" 버튼.
 * 어떤 플랜에서 눌렀는지 문의 본문에 컨텍스트로 붙인다.
 */
export default function PricingContactButton({
  plan,
  className = "",
  children,
}: {
  plan: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>
      <ContactDialog
        open={open}
        onClose={() => setOpen(false)}
        title="요금제 문의"
        subtitle="담당자가 확인 후 안내드립니다."
        prefill={`[요금제 문의] ${plan}`}
      />
    </>
  );
}
