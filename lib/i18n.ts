/**
 * 한/영 UI 전환 — 전역 상태는 localStorage["vpg.lang"] 하나뿐이다.
 *
 * - 기본은 한국어. 내비게이션의 Korean / English 버튼(LangToggle)이 setLang 으로 바꾼다.
 * - `?lang=en` / `?lang=ko` 로 들어오면 layout 의 인라인 스크립트가 같은 키에 저장한다
 *   (해외 마케팅용 영문 링크: https://www.socialtwin.site/?lang=en).
 * - 서버 렌더는 항상 한국어로 나간다. 영어 사용자는 hydration 직후 영어로 다시 그려지는데,
 *   그 사이 한국어가 비치지 않도록 layout 인라인 스크립트가 <html class="i18n-pending"> 로
 *   body 를 잠깐 가리고, LangBoot 가 hydration 뒤 풀어준다.
 *
 * 번역 문구는 키 사전이 아니라 쓰는 자리에 `t("한국어", "English")` 쌍으로 둔다 —
 * 페이지 파일이 자기완결적인 이 저장소 관례(CLAUDE.md "페이지 단위 컨벤션")를 따른 것.
 */

import { useCallback, useSyncExternalStore } from "react";

export type Lang = "ko" | "en";

export const LANG_STORAGE_KEY = "vpg.lang";
const LANG_EVENT = "vpg:lang";

function readLang(): Lang {
  try {
    return localStorage.getItem(LANG_STORAGE_KEY) === "en" ? "en" : "ko";
  } catch {
    return "ko";
  }
}

function subscribe(onChange: () => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === LANG_STORAGE_KEY) onChange();
  };
  window.addEventListener("storage", onStorage); // 다른 탭에서 바꾼 경우
  window.addEventListener(LANG_EVENT, onChange); // 같은 탭에서 바꾼 경우
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(LANG_EVENT, onChange);
  };
}

/** React 바깥(API 헬퍼 등)에서 현재 언어를 읽는다. 서버에서는 항상 "ko". */
export function getLang(): Lang {
  return typeof window === "undefined" ? "ko" : readLang();
}

export function setLang(lang: Lang): void {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    /* 저장 불가(사파리 개인정보 보호 모드 등) — 이번 탭에서만 바뀌지 않는다 */
  }
  document.documentElement.lang = lang;
  window.dispatchEvent(new Event(LANG_EVENT));
}

/** 현재 UI 언어. SSR·hydration 첫 렌더에서는 "ko" 이고, 직후 저장된 값으로 다시 그린다. */
export function useLang(): Lang {
  return useSyncExternalStore(subscribe, readLang, () => "ko");
}

/**
 * `const t = useT();` → `t("조사 시작하기", "Start a study")`.
 * 문자열뿐 아니라 JSX·배열·객체도 그대로 고를 수 있다.
 */
export function useT(): <T>(ko: T, en: T) => T {
  const lang = useLang();
  return useCallback(<T>(ko: T, en: T): T => (lang === "en" ? en : ko), [lang]);
}
