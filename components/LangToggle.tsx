"use client";

import { setLang, useLang, type Lang } from "@/lib/i18n";

const OPTIONS: { value: Lang; label: string }[] = [
  { value: "ko", label: "Korean" },
  { value: "en", label: "English" },
];

/** 내비게이션 우측 Korean / English 전환 버튼. 기본은 Korean. */
export default function LangToggle({ dark = false, className = "" }: { dark?: boolean; className?: string }) {
  const lang = useLang();
  const wrap = dark ? "border-white/15 bg-white/5" : "border-slate-200 bg-slate-50";
  const idle = dark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900";
  const active = dark ? "bg-white text-slate-900 shadow-sm" : "bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200";

  return (
    <div
      role="group"
      aria-label="Language"
      className={`inline-flex items-center rounded-lg border p-0.5 ${wrap} ${className}`}
    >
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          lang={o.value}
          aria-pressed={lang === o.value}
          onClick={() => lang !== o.value && setLang(o.value)}
          className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
            lang === o.value ? active : idle
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
