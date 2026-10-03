"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, Info } from "lucide-react";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import { useT } from "@/lib/i18n";

type Props = {
  title: string;
  updatedAt?: string;
  children: ReactNode;
};

// 약관 페이지가 넘기는 "2026년 9월 1일" 형식을 영어 화면용 "September 1, 2026" 으로 바꾼다.
// 형식이 다르면 원문 그대로 둔다.
function formatUpdatedAtEn(raw: string): string {
  const m = raw.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);
  if (!m) return raw;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default function LegalLayout({ title, updatedAt, children }: Props) {
  const t = useT();
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar dark />

      {/* Header */}
      <section className="relative overflow-hidden mesh-bg noise pt-20 sm:pt-28 pb-12 sm:pb-16">
        <div
          className="absolute inset-0 opacity-[.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative max-w-3xl mx-auto px-5 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors mb-5"
          >
            <ChevronLeft size={15} /> {t("홈으로", "Home")}
          </Link>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight">{title}</h1>
          {updatedAt && (
            <p className="mt-3 text-sm text-slate-400">
              {t(<>최종 개정일 · {updatedAt}</>, <>Last updated · {formatUpdatedAtEn(updatedAt)}</>)}
            </p>
          )}
        </div>
        <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* Body */}
      <main className="flex-1 bg-white py-12 sm:py-16">
        {/* 약관 본문은 한국어만 제공한다 — 영어 화면에서는 그 사실과 효력 기준을 먼저 알린다. */}
        {t(
          null,
          <div className="max-w-3xl mx-auto px-5 sm:px-6 mb-8">
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900">
              <Info size={16} className="mt-0.5 flex-shrink-0 text-amber-600" />
              <p>
                This document is currently available in Korean only. The Korean version is legally binding.
                For questions, contact{" "}
                <a href="mailto:cwb@omninode.kr" className="font-semibold underline underline-offset-2">
                  cwb@omninode.kr
                </a>
                .
              </p>
            </div>
          </div>,
        )}
        <article className="max-w-3xl mx-auto px-5 sm:px-6 legal-content break-keep">
          {children}
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}
