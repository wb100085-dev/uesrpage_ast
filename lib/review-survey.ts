// 리뷰 이벤트 설문 정의 — 참고용/SocialTwin_리뷰이벤트_설문.docx 기반.
// 설문1(서비스 이용 후기, 14문항) / 설문2(상세보고서 품질 평가, 6문항).
//
// 영문 화면: *En 필드는 "표시"에만 쓴다. 응답 저장값(선택지 문자열·라벨)은 언어와
// 무관하게 항상 한국어 원문이다 — 관리자 대시보드 통계가 한국어 선택지로 집계하므로.

import type { Lang } from "@/lib/i18n";

export type ReviewQuestion = {
  id: string;                 // 저장 키 (예: "q1")
  section?: string;           // 섹션 헤더(이 문항 위에 표시)
  label: string;              // 문항 텍스트
  type: "single" | "multi" | "scale" | "text";
  options?: string[];         // single/multi/scale 선택지
  otherOption?: boolean;      // 마지막 선택지가 "기타"(자유 입력) 인지
  optional?: boolean;         // 선택 응답(미응답 허용)
  reasonWhenIndex?: number[]; // 해당 인덱스 선택 시 사유 자유입력 노출 (예: [0,1])
  reasonLabel?: string;
  // 영문 화면 표시용 — 저장(payload)·관리자 통계는 항상 위 한국어 값을 쓴다.
  sectionEn?: string;
  labelEn?: string;
  optionsEn?: string[];       // options 와 같은 순서·길이
  reasonLabelEn?: string;
};

export type ReviewSurvey = {
  key: "service_review" | "report_quality";
  title: string;
  subtitle: string;
  meta: string;
  titleEn: string;
  subtitleEn: string;
  metaEn: string;
  questions: ReviewQuestion[];
};

export const SURVEY_SERVICE_REVIEW: ReviewSurvey = {
  key: "service_review",
  title: "서비스 이용 후기 설문",
  subtitle: "설문 1",
  meta: "작성 완료 시 상세보고서 무료 다운로드 · 소요 시간 약 3~5분 · 총 14문항",
  titleEn: "Service experience survey",
  subtitleEn: "Survey 1",
  metaEn: "Free detailed report download when completed · About 3–5 minutes · 14 questions",
  questions: [
    {
      id: "q1",
      label: "이번에 이 서비스를 이용하신 주된 목적은 무엇인가요?",
      labelEn: "What was your main purpose for using this service?",
      optionsEn: [
        "Validating an idea before starting a business",
        "Checking market response to an existing business or product",
        "Building evidence for fundraising or a business plan",
        "School assignment or research",
        "Just trying out the service",
        "Other",
      ],
      type: "single",
      otherOption: true,
      options: [
        "창업 전 아이디어 검증",
        "기존 사업·제품의 시장 반응 확인",
        "투자 유치·사업계획서 근거 마련",
        "학교 과제 또는 연구",
        "단순 서비스 체험",
        "기타",
      ],
    },
    {
      id: "q2",
      section: "섹션 1. 홈페이지 이용 편의성",
      label: "홈페이지를 처음 방문했을 때, 이 서비스가 무엇을 해주는 서비스인지 바로 이해하셨나요?",
      sectionEn: "Section 1. Website usability",
      labelEn: "When you first visited the website, did you immediately understand what this service does?",
      optionsEn: [
        "Didn't understand at all",
        "Hard to understand",
        "Neutral",
        "Understood easily",
        "Understood at a glance",
      ],
      type: "scale",
      options: ["전혀 이해 못했다", "이해하기 어려웠다", "보통이다", "쉽게 이해했다", "한눈에 바로 이해했다"],
    },
    {
      id: "q3",
      label: "회원가입부터 첫 서비스 이용 시작까지 과정이 불편하지 않았나요?",
      labelEn: "How convenient was the process from signing up to using the service for the first time?",
      optionsEn: [
        "Very inconvenient",
        "Inconvenient",
        "Neutral",
        "Convenient",
        "Very convenient",
      ],
      type: "scale",
      options: ["매우 불편했다", "불편했다", "보통이다", "편리했다", "매우 편리했다"],
    },
    {
      id: "q4",
      section: "섹션 2. 서비스 이용 편의성",
      label: "아이템 정보 입력부터 결과 확인까지 전체 과정을 따라가기가 쉬웠나요?",
      sectionEn: "Section 2. Ease of use",
      labelEn: "Was it easy to follow the whole process, from entering your product details to viewing the results?",
      optionsEn: [
        "Very difficult",
        "Difficult",
        "Neutral",
        "Easy",
        "Very easy",
      ],
      type: "scale",
      options: ["매우 어려웠다", "어려웠다", "보통이다", "쉬웠다", "매우 쉬웠다"],
    },
    {
      id: "q5",
      label: "이용 과정 중 가장 불편하거나 어렵게 느껴진 단계가 있다면 선택해 주세요.",
      labelEn: "If any steps felt inconvenient or difficult, please select them.",
      optionsEn: [
        "Entering product details (describing the idea or product to study)",
        "Setting hypotheses (choosing or entering what to validate)",
        "Reviewing the generated survey (checking or editing AI-written questions)",
        "Running the survey (AI panel responses)",
        "Viewing the results summary",
        "No step was difficult",
        "Other",
      ],
      type: "multi",
      otherOption: true,
      options: [
        "아이템 정보 입력 (조사할 아이디어·제품 설명)",
        "가설 설정 (검증하고 싶은 내용 선택 또는 입력)",
        "설문 생성 확인 (AI가 만든 질문 검토 또는 입력)",
        "설문 진행 (AI 패널 응답 실행)",
        "결과 요약 보기",
        "불편한 단계 없었음",
        "기타",
      ],
    },
    {
      id: "q6",
      label: "AI가 자동으로 만들어준 설문 문항들이 제가 알고 싶었던 내용을 잘 담고 있었나요?",
      labelEn: "Did the AI-generated survey questions capture what you wanted to learn?",
      optionsEn: [
        "Not at all",
        "Not enough",
        "Neutral",
        "Captured it well",
        "Captured it very well",
      ],
      type: "scale",
      options: ["전혀 담지 못했다", "부족했다", "보통이다", "잘 담겨 있었다", "매우 잘 담겨 있었다"],
    },
    {
      id: "q7",
      section: "섹션 3. 서비스 가치",
      label: "이 서비스의 조사 결과가 실제 사업 결정이나 아이디어 검증에 얼마나 도움이 될 것 같나요?",
      sectionEn: "Section 3. Value",
      labelEn: "How helpful do you think these study results would be for real business decisions or idea validation?",
      optionsEn: [
        "Not helpful at all",
        "Not very helpful",
        "Neutral",
        "Helpful",
        "Very helpful",
      ],
      type: "scale",
      options: ["전혀 도움 안 될 것 같다", "별로 도움 안 될 것 같다", "보통이다", "도움이 될 것 같다", "매우 도움이 될 것 같다"],
    },
    {
      id: "q8",
      label: "이 서비스를 이용하기 전, 시장조사나 고객 반응 확인을 어떤 방식으로 해보신 적 있나요?",
      labelEn: "Before using this service, how have you done market research or checked customer reactions?",
      optionsEn: [
        "Asked friends or people around me",
        "Built my own online survey (Google Forms, Naver Form, etc.)",
        "Hired a professional research firm",
        "Posted on social media or online communities",
        "Never done it",
        "Other",
      ],
      type: "multi",
      otherOption: true,
      options: [
        "지인이나 주변인에게 직접 물어봄",
        "온라인 설문 도구(네이버폼·구글폼 등) 직접 제작",
        "전문 조사 업체에 의뢰",
        "SNS·커뮤니티에 올려서 반응 확인",
        "해본 적 없음",
        "기타",
      ],
    },
    {
      id: "q9",
      section: "섹션 4. 사용·추천·가격 의향",
      label: "나중에 아이디어를 검증하거나 시장 반응을 확인할 일이 생기면 이 서비스를 이용할 의향이 있으신가요?",
      sectionEn: "Section 4. Usage, referral, and pricing",
      labelEn: "If you need to validate an idea or check market response in the future, would you use this service?",
      optionsEn: [
        "Definitely not",
        "No",
        "Not sure",
        "Yes",
        "I'll definitely use it",
      ],
      type: "scale",
      options: ["전혀 없다", "없다", "모르겠다", "있다", "반드시 이용할 것이다"],
    },
    {
      id: "q10",
      label: "이 서비스가 가장 필요한 사람은 누구라고 생각하시나요?",
      labelEn: "Who do you think needs this service most?",
      optionsEn: [
        "Aspiring founders who want to validate a business idea",
        "Professionals planning a new product or service",
        "Startup founders preparing to raise funding",
        "Small businesses and SMEs looking to cut research costs",
        "Students and researchers who need preliminary research",
        "Other",
      ],
      type: "multi",
      otherOption: true,
      options: [
        "사업 아이디어를 검증하고 싶은 예비창업자",
        "신제품·신서비스를 기획 중인 직장인·담당자",
        "투자 유치를 준비 중인 스타트업 대표",
        "조사 비용을 줄이고 싶은 소상공인·중소기업",
        "논문이나 연구에서 사전 조사가 필요한 학생·연구자",
        "기타",
      ],
    },
    {
      id: "q11",
      label: "주변에 그런 분이 있다면 이 서비스를 추천하실 의향이 있으신가요?",
      labelEn: "If you know someone like that, would you recommend this service?",
      optionsEn: [
        "Definitely not",
        "No",
        "Not sure",
        "Yes",
        "I'll definitely recommend it",
      ],
      type: "scale",
      options: ["전혀 없다", "없다", "모르겠다", "있다", "반드시 추천할 것이다"],
    },
    {
      id: "q12",
      label: "상세보고서 1건 유료 구매 시 — “이 가격이면 너무 저렴해서 품질이 의심된다”고 느끼는 금액은?",
      labelEn: "If you bought a single detailed report — at what price would it feel “so cheap that I'd doubt the quality”?",
      optionsEn: [
        "₩10,000–19,999",
        "₩20,000–29,999",
        "₩30,000–39,999",
        "₩40,000–49,999",
        "I wouldn't doubt the quality at any price",
      ],
      type: "single",
      options: ["1만원대", "2만원대", "3만원대", "4만원대", "가격이 얼마여도 품질이 의심되지 않는다"],
    },
    {
      id: "q13",
      label: "상세보고서 1건 유료 구매 시 — “이 가격 이상이면 너무 비싸서 이용하지 않을 것 같다”고 느끼는 금액은?",
      labelEn: "If you bought a single detailed report — above what price would it feel “too expensive to use”?",
      optionsEn: [
        "₩50,000–69,999",
        "₩70,000–89,999",
        "₩90,000–109,999",
        "₩110,000–129,999",
        "I'd use it even at ₩130,000 or more",
      ],
      type: "single",
      options: ["5~6만원대", "7~8만원대", "9~10만원대", "11~12만원대", "13만원 이상이어도 이용할 것이다"],
    },
    {
      id: "q14",
      section: "섹션 5. 자유 의견",
      label: "서비스를 이용하면서 불편했던 점이나 개선되었으면 하는 내용을 자유롭게 남겨주세요.",
      sectionEn: "Section 5. Comments",
      labelEn: "Please share anything that was inconvenient or that you'd like us to improve.",
      type: "text",
      optional: true,
    },
  ],
};

export const SURVEY_REPORT_QUALITY: ReviewSurvey = {
  key: "report_quality",
  title: "상세보고서 품질 평가",
  subtitle: "설문 2",
  meta: "보고서 열람 후 작성 · 선택 참여 · 소요 시간 약 2분 · 총 6문항",
  titleEn: "Detailed report quality review",
  subtitleEn: "Survey 2",
  metaEn: "Complete after reading the report · Optional · About 2 minutes · 6 questions",
  questions: [
    {
      id: "q1",
      section: "섹션 1. 보고서 이해도 및 신뢰도",
      label: "상세보고서의 내용이 전반적으로 이해하기 쉬웠나요?",
      sectionEn: "Section 1. Clarity and credibility",
      labelEn: "Overall, was the detailed report easy to understand?",
      optionsEn: [
        "Very hard to understand",
        "Hard to understand",
        "Neutral",
        "Easy to understand",
        "Very easy to understand",
      ],
      type: "scale",
      options: ["매우 이해하기 어려웠다", "어려웠다", "보통이다", "이해하기 쉬웠다", "매우 이해하기 쉬웠다"],
    },
    {
      id: "q2",
      label: "보고서에 제시된 분석 결과를 신뢰할 수 있다고 느껴졌나요?",
      labelEn: "Did the analysis in the report feel trustworthy?",
      optionsEn: [
        "Not trustworthy at all",
        "Hard to trust",
        "Neutral",
        "Trustworthy",
        "Very trustworthy",
      ],
      type: "scale",
      options: ["전혀 믿을 수 없다", "믿기 어렵다", "보통이다", "믿을 수 있다", "매우 믿을 수 있다"],
    },
    {
      id: "q3",
      label: "보고서 내용이 실제로 활용할 수 있다고 생각하셨나요?",
      labelEn: "Do you think the report's content is actually usable?",
      optionsEn: [
        "Not usable at all",
        "Mostly not usable",
        "Neutral (usefulness varies by section)",
        "Mostly usable",
        "Highly usable",
      ],
      reasonLabelEn: "Please tell us why it felt hard to use.",
      type: "scale",
      options: [
        "전혀 활용할 수 없다고 생각되었다",
        "전반적으로 활용할 수 없다고 생각되었다",
        "보통이다(내용에 따라 활용여부의 차이가 있는 편이다)",
        "전반적으로 활용할 수 있다고 생각되었다",
        "매우 활용성이 높다고 생각되었다",
      ],
      reasonWhenIndex: [0, 1],
      reasonLabel: "활용하기 어렵다고 느끼신 이유를 알려주세요.",
    },
    {
      id: "q4",
      section: "섹션 2. 보고서 내용 평가",
      label: "보고서에서 가장 유용하게 느낀 항목을 골라주세요.",
      sectionEn: "Section 2. Report content",
      labelEn: "Which sections of the report did you find most useful?",
      optionsEn: [
        "Results summary — key metrics at a glance",
        "Market response — purchase intent and interest levels",
        "Target segments — analysis of key customer groups",
        "Needs and value proposition — what customers want, plus draft messaging",
        "Offer, pricing, and channels — suggested price range and sales approach",
        "Go-to-market strategy — six-axis market entry analysis",
        "Action items — execution priorities and further validation",
        "Appendix — full survey results",
        "Raw data — original survey response data",
        "Other",
      ],
      type: "multi",
      otherOption: true,
      options: [
        "조사결과 요약 — 핵심 지표 한눈에 보기",
        "시장반응 진단 — 구매의향·관심도 수치",
        "타깃 세그먼트 진단 — 주요 고객층 분석",
        "니즈·가치제안 분석 — 고객이 원하는 것과 메시지 초안",
        "Offer·가격·채널 방향 — 가격대·판매방식 제안",
        "시장 진입 전략 — 시장 진입 전략 6축 분석",
        "과제 — 실행 우선순위와 추가검증 과제",
        "부록 — 전체 설문 응답 결과",
        "Rawdata — 설문 응답 원본 데이터",
        "기타",
      ],
    },
    {
      id: "q5",
      label: "보고서에 추가되거나 보완되었으면 하는 내용이 있다면 골라주세요.",
      labelEn: "What would you like added to or improved in the report?",
      optionsEn: [
        "Comparison with competitors or similar products",
        "Detailed price acceptance analysis (how much people would pay)",
        "Projected effectiveness by marketing channel",
        "Guidance on following up with real consumer research",
        "Nothing — it's useful enough as is",
        "Other",
      ],
      type: "multi",
      otherOption: true,
      options: [
        "경쟁 서비스·유사 제품과의 비교",
        "가격 수용 구간 상세 분석 (얼마까지 낼 의향이 있는지)",
        "마케팅 채널별 효과 예측",
        "실제 소비자 조사 연계 방안 안내",
        "없음 — 현재로도 충분히 유용하다",
        "기타",
      ],
    },
    {
      id: "q6",
      section: "섹션 3. 자유 의견",
      label: "보고서에 대한 솔직한 의견을 자유롭게 남겨주세요.",
      sectionEn: "Section 3. Comments",
      labelEn: "Please share your honest thoughts on the report.",
      type: "text",
      optional: true,
    },
  ],
};

/* ── 표시용 헬퍼 (영문 화면) — 저장값은 건드리지 않는다 ── */

export function surveyHeader(s: ReviewSurvey, lang: Lang): { title: string; subtitle: string; meta: string } {
  return lang === "en"
    ? { title: s.titleEn, subtitle: s.subtitleEn, meta: s.metaEn }
    : { title: s.title, subtitle: s.subtitle, meta: s.meta };
}

export function questionLabel(q: ReviewQuestion, lang: Lang): string {
  return lang === "en" ? q.labelEn ?? q.label : q.label;
}

export function questionSection(q: ReviewQuestion, lang: Lang): string | undefined {
  return lang === "en" ? q.sectionEn ?? q.section : q.section;
}

/** i번째 선택지의 표시 문구. 저장값은 항상 q.options[i](한국어). */
export function optionLabel(q: ReviewQuestion, i: number, lang: Lang): string {
  const ko = q.options?.[i] ?? "";
  return lang === "en" ? q.optionsEn?.[i] ?? ko : ko;
}

export function reasonLabel(q: ReviewQuestion, lang: Lang): string | undefined {
  return lang === "en" ? q.reasonLabelEn ?? q.reasonLabel : q.reasonLabel;
}
