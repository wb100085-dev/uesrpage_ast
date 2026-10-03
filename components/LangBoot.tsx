"use client";

import { useEffect } from "react";
import { useLang } from "@/lib/i18n";

/** 서버 metadata 의 한국어 탭 제목 → 영문. 서버 렌더는 항상 한국어라 클라이언트에서 바꿔 끼운다. */
const TITLE_EN: Record<string, string> = {
  "Socialtwin — AI 시장조사 플랫폼": "Socialtwin — Test the Korean market with AI",
  "요금 안내 · SocialTwin": "Pricing · SocialTwin",
  "이용약관 · SocialTwin": "Terms of Service · SocialTwin",
  "개인정보처리방침 · SocialTwin": "Privacy Policy · SocialTwin",
  "결제·환불 정책 · SocialTwin": "Refund Policy · SocialTwin",
};
const TITLE_KO: Record<string, string> = Object.fromEntries(
  Object.entries(TITLE_EN).map(([ko, en]) => [en, ko]),
);

/**
 * layout 인라인 스크립트가 영어 사용자에게 씌운 <html class="i18n-pending">(본문 가림)을
 * hydration 이 끝나 영어로 다시 그려진 뒤 벗긴다. <html lang> 과 탭 제목도 현재 언어로 맞춘다.
 */
export default function LangBoot() {
  const lang = useLang();

  useEffect(() => {
    document.documentElement.lang = lang;
    // 저장값으로 다시 그리는 렌더가 화면에 반영된 다음 프레임에 벗긴다
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => document.documentElement.classList.remove("i18n-pending")),
    );
    return () => cancelAnimationFrame(id);
  }, [lang]);

  useEffect(() => {
    const apply = () => {
      const next = (lang === "en" ? TITLE_EN : TITLE_KO)[document.title];
      if (next) document.title = next;
    };
    apply();
    // 클라이언트 내비게이션 때 Next 가 metadata 제목을 다시 써 넣으므로 <head> 변화를 지켜본다
    const mo = new MutationObserver(apply);
    mo.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => mo.disconnect();
  }, [lang]);

  return null;
}
