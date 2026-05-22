"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";

type Props = {
  title: string;
  updatedAt?: string;
  children: ReactNode;
};

export default function LegalLayout({ title, updatedAt, children }: Props) {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar dark />

      {/* Header */}
      <section className="relative overflow-hidden mesh-bg noise pt-28 pb-16">
        <div
          className="absolute inset-0 opacity-[.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative max-w-3xl mx-auto px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors mb-5"
          >
            <ChevronLeft size={15} /> 홈으로
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">{title}</h1>
          {updatedAt && (
            <p className="mt-3 text-sm text-slate-400">최종 개정일 · {updatedAt}</p>
          )}
        </div>
        <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* Body */}
      <main className="flex-1 bg-white py-16">
        <article className="max-w-3xl mx-auto px-6 legal-content break-keep">
          {children}
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}
