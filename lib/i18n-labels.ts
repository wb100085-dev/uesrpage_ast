/**
 * 가상인구·설문 분류 라벨의 영문 표기.
 *
 * ⚠️ 백엔드로 보내는 값은 항상 한국어 원문 그대로다(가상인구 CSV 분류·문항 type 과 문자열 매칭).
 * 영어 화면에서는 "표시"만 이 표로 바꾼다 — 값 자체를 번역해 보내면 패널 매칭이 깨진다.
 * 표에 없는 시군구·읍면동은 로마자로 바꾸고(성남시 → Seongnam-si), 그 밖의 값은 원문을 그대로 보여준다.
 */

import { useCallback } from "react";
import { useLang } from "@/lib/i18n";
import { romanizePlace } from "@/lib/romanize";

export const KO_EN_LABELS: Record<string, string> = {
  // 시도
  전국: "Nationwide",
  서울특별시: "Seoul",
  부산광역시: "Busan",
  대구광역시: "Daegu",
  인천광역시: "Incheon",
  광주광역시: "Gwangju",
  대전광역시: "Daejeon",
  울산광역시: "Ulsan",
  세종특별자치시: "Sejong",
  경기도: "Gyeonggi",
  강원도: "Gangwon",
  강원특별자치도: "Gangwon",
  충청북도: "North Chungcheong",
  충청남도: "South Chungcheong",
  전라북도: "North Jeolla",
  전북특별자치도: "North Jeolla",
  전라남도: "South Jeolla",
  경상북도: "North Gyeongsang",
  경상남도: "South Gyeongsang",
  제주특별자치도: "Jeju",
  // 시도 약칭
  서울: "Seoul",
  부산: "Busan",
  대구: "Daegu",
  인천: "Incheon",
  광주: "Gwangju",
  대전: "Daejeon",
  울산: "Ulsan",
  세종: "Sejong",
  경기: "Gyeonggi",
  강원: "Gangwon",
  충북: "N. Chungcheong",
  충남: "S. Chungcheong",
  전북: "N. Jeolla",
  전남: "S. Jeolla",
  경북: "N. Gyeongsang",
  경남: "S. Gyeongsang",
  제주: "Jeju",
  // 성별
  남자: "Male",
  여자: "Female",
  남성: "Male",
  여성: "Female",
  남: "M",
  여: "F",
  // 연령대
  "10대 이하": "Teens & under",
  "10대": "Teens",
  "20대": "20s",
  "30대": "30s",
  "40대": "40s",
  "50대": "50s",
  "60대": "60s",
  "70대": "70s",
  "70대 이상": "70+",
  "60대 이상": "60+",
  // 경제활동
  경제활동: "Employed / job-seeking",
  비경제활동: "Not in labor force",
  // 교육정도
  중졸이하: "Middle school or less",
  고졸: "High school",
  대졸이상: "College or higher",
  // 가구소득(월)
  "200만원 미만": "Under ₩2M / mo",
  "200~400만원": "₩2M–4M / mo",
  "400~600만원": "₩4M–6M / mo",
  "600만원 이상": "₩6M+ / mo",
  // 패널 축 이름
  성별: "Gender",
  연령대: "Age group",
  교육정도: "Education",
  가구소득: "Household income",
  지역: "Region",
  // 설문 문항 유형
  객관식: "Single choice",
  복수선택: "Multiple choice",
  "리커트 5점": "5-point Likert",
  "리커트 7점": "7-point Likert",
  순위형: "Ranking",
  주관식: "Open-ended",
  // 거래방식
  기타: "Other",
  // 가설 판정(인포그래픽) — 데이터 값은 백엔드 계약상 한국어로 고정
  채택: "Supported",
  기각: "Rejected",
  혼합: "Mixed",
};

/** 한국어 라벨 → 영문 표기(없으면 원문). 언어와 무관하게 강제로 영문이 필요할 때 쓴다. */
export function labelEn(ko: string): string {
  return KO_EN_LABELS[ko] ?? ko;
}

/**
 * 현재 언어에 맞춰 분류 라벨을 표시한다. `const L = useLabel(); L("서울특별시")` → "Seoul".
 * "여 · 30대 · 서울특별시 강남구" 처럼 구분자로 이어진 라벨도 조각별로 바꾼다.
 */
export function useLabel(): (ko: string) => string {
  const lang = useLang();
  return useCallback(
    (ko: string) => {
      if (lang !== "en" || !ko) return ko;
      if (KO_EN_LABELS[ko]) return KO_EN_LABELS[ko];
      // "여 · 30대 · 서울특별시 강남구" / "여·40대·성남시" 같은 복합 라벨
      return ko
        .split(/(\s*·\s*|\s+)/)
        .map((part) => KO_EN_LABELS[part] ?? romanizePlace(part) ?? part)
        .join("");
    },
    [lang],
  );
}
