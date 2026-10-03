/**
 * 한글 → 로마자 (국어의 로마자 표기법 기본 규칙의 간이 구현).
 *
 * 영어 화면에서 가상인구 이름(김민준 → Kim Minjun)과 시군구(성남시 → Seongnam-si,
 * 강남구 → Gangnam-gu)를 읽을 수 있게 하려는 용도다. 연음(받침 + ㅇ)과 ㄹ 관련 동화
 * (ㄹㄹ·ㄹㄴ·ㄴㄹ → ll, ㅇ/ㅁ + ㄹ → n) 만 처리하고 나머지 자음동화는 생략한다 —
 * 표시용이므로 완벽한 표기보다 일관성이 목적.
 */

const INITIALS = ["g", "kk", "n", "d", "tt", "r", "m", "b", "pp", "s", "ss", "", "j", "jj", "ch", "k", "t", "p", "h"];
const MEDIALS = [
  "a", "ae", "ya", "yae", "eo", "e", "yeo", "ye", "o", "wa", "wae", "oe", "yo",
  "u", "wo", "we", "wi", "yu", "eu", "ui", "i",
];
// 받침 — 음절 끝소리
const FINALS = ["", "k", "k", "k", "n", "n", "n", "t", "l", "k", "m", "l", "l", "l", "p", "l", "m", "p", "p", "t", "t", "ng", "t", "t", "k", "t", "p", "t"];
// 받침이 뒤 음절(초성 ㅇ)로 넘어갈 때의 소리 (연음)
const FINALS_LIAISON = ["", "g", "kk", "ks", "n", "nj", "nh", "d", "r", "lg", "lm", "lb", "ls", "lt", "lp", "lh", "m", "b", "bs", "s", "ss", "ng", "j", "ch", "k", "t", "p", "h"];

const HANGUL_START = 0xac00;
const HANGUL_END = 0xd7a3;

function isSyllable(ch: string): boolean {
  const c = ch.charCodeAt(0);
  return c >= HANGUL_START && c <= HANGUL_END;
}

function decompose(ch: string): [number, number, number] {
  const idx = ch.charCodeAt(0) - HANGUL_START;
  return [Math.floor(idx / 588), Math.floor((idx % 588) / 28), idx % 28];
}

/** 한글 음절 연속을 로마자로 (소문자). 한글이 아닌 글자는 그대로 둔다. */
export function romanize(text: string): string {
  const chars = [...text];
  let out = "";
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (!isSyllable(ch)) {
      out += ch;
      continue;
    }
    const [ini, med, fin] = decompose(ch);
    const prev = i > 0 && isSyllable(chars[i - 1]) ? decompose(chars[i - 1]) : null;
    // 초성 — ㄹ+ㄹ·ㄹ+ㄴ·ㄴ+ㄹ = ll (설날 seollal, 신라 silla), ㅇ/ㅁ+ㄹ = n (종로 jongno)
    let initial = INITIALS[ini];
    if (prev && ((ini === 5 && (prev[2] === 8 || prev[2] === 4)) || (ini === 2 && prev[2] === 8))) initial = "l";
    else if (prev && ini === 5 && (prev[2] === 21 || prev[2] === 16)) initial = "n";
    // 앞 음절 받침이 연음으로 넘어온 경우 초성 ㅇ 자리는 비워 둔다(받침 쪽에서 처리)
    const next = i + 1 < chars.length && isSyllable(chars[i + 1]) ? decompose(chars[i + 1]) : null;
    let final = FINALS[fin];
    if (fin && next && next[0] === 11 && fin !== 21) final = FINALS_LIAISON[fin];
    else if (fin === 4 && next && next[0] === 5) final = "l";
    out += initial + MEDIALS[med] + final;
  }
  return out;
}

const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

// 행정구역 접미사 — 붙임표로 분리해 표기 (국어의 로마자 표기법 제5항)
const ADMIN_SUFFIX: Record<string, string> = { 시: "si", 군: "gun", 구: "gu", 동: "dong", 읍: "eup", 면: "myeon", 도: "do", 리: "ri" };

/** 시군구·읍면동 한 덩어리를 로마자로. 행정구역 접미사가 없으면 null. */
export function romanizePlace(word: string): string | null {
  if (!/^[가-힣]{2,}$/.test(word)) return null;
  const suffix = ADMIN_SUFFIX[word.slice(-1)];
  if (!suffix) return null;
  return `${cap(romanize(word.slice(0, -1)))}-${suffix}`;
}

// 관용 표기가 굳은 성씨 (RR 그대로면 Gim/I/Bak 처럼 어색해진다)
const SURNAMES: Record<string, string> = {
  김: "Kim", 이: "Lee", 박: "Park", 최: "Choi", 정: "Jung", 강: "Kang", 조: "Cho", 윤: "Yoon",
  장: "Jang", 임: "Lim", 한: "Han", 오: "Oh", 서: "Seo", 신: "Shin", 권: "Kwon", 황: "Hwang",
  안: "Ahn", 송: "Song", 류: "Ryu", 유: "Yoo", 전: "Jeon", 홍: "Hong", 고: "Ko", 문: "Moon",
  양: "Yang", 손: "Son", 배: "Bae", 백: "Baek", 허: "Heo", 남: "Nam", 심: "Shim", 노: "Noh",
  하: "Ha", 곽: "Kwak", 성: "Sung", 차: "Cha", 주: "Joo", 우: "Woo", 구: "Koo", 민: "Min",
  진: "Jin", 나: "Na", 지: "Ji", 엄: "Eom", 채: "Chae", 원: "Won", 천: "Cheon", 방: "Bang",
  공: "Kong", 현: "Hyun", 함: "Ham", 변: "Byun", 염: "Yeom", 여: "Yeo", 추: "Choo", 도: "Do",
  소: "So", 석: "Seok", 선: "Sun", 설: "Seol", 마: "Ma", 길: "Gil", 연: "Yeon", 표: "Pyo",
  명: "Myung", 기: "Ki", 반: "Ban", 왕: "Wang", 금: "Geum", 옥: "Ok", 육: "Yook", 인: "In",
  맹: "Maeng", 제: "Je", 모: "Mo", 탁: "Tak", 국: "Kook", 은: "Eun", 편: "Pyeon", 용: "Yong",
};
const TWO_CHAR_SURNAMES = ["남궁", "선우", "제갈", "황보", "독고", "사공", "서문"];

/** 한국 인명(2~4음절 한글)을 "Kim Minjun" 형태로. 한글 인명이 아니면 원문 그대로. */
export function romanizeName(name: string): string {
  const n = name.trim();
  if (!/^[가-힣]{2,4}$/.test(n)) return name;
  const two = TWO_CHAR_SURNAMES.find((s) => n.startsWith(s) && n.length > 2);
  const surname = two ?? n[0];
  const given = n.slice(surname.length);
  const sur = two ? cap(romanize(two)) : SURNAMES[surname] ?? cap(romanize(surname));
  return `${sur} ${cap(romanize(given))}`;
}
