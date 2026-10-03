"use client";

import type { ReactNode } from "react";
import { useLang } from "@/lib/i18n";

/** 서버 컴포넌트 페이지에서 한/영 본문을 통째로 갈아끼울 때 쓴다 (예: 랜딩 — app/page.tsx). */
export default function LangSwitch({ ko, en }: { ko: ReactNode; en: ReactNode }) {
  return <>{useLang() === "en" ? en : ko}</>;
}
