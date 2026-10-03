"use client";

import { useState } from "react";
import ContactDialog from "@/components/ContactDialog";
import { useT } from "@/lib/i18n";

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
  const t = useT();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>
      <ContactDialog
        open={open}
        onClose={() => setOpen(false)}
        title={t("요금제 문의", "Pricing inquiry")}
        subtitle={t("담당자가 확인 후 안내드립니다.", "Our team will review your inquiry and get back to you.")}
        // prefill 은 화면에 보이지 않고 Formspree 메일 필드로만 간다 — 운영진이 읽으므로 한국어 유지
        prefill={`[요금제 문의] ${plan}`}
      />
    </>
  );
}
