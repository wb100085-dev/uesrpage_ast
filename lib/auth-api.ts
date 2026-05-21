/**
 * Django 백엔드 인증 클라이언트.
 * - 백엔드 베이스 URL: NEXT_PUBLIC_API_URL (기본 http://localhost:8000)
 * - dj-rest-auth + django-allauth 기반
 * - JWT (access/refresh)를 localStorage에 저장
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const ACCESS_KEY = "vpg.auth.access";
const REFRESH_KEY = "vpg.auth.refresh";
const USER_KEY = "vpg.auth.user";

// ───────────────────── 토큰 저장소 ─────────────────────

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY);
}
export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}
export function setAuthTokens(access: string | null, refresh?: string | null): void {
  if (typeof window === "undefined") return;
  if (access) localStorage.setItem(ACCESS_KEY, access);
  else localStorage.removeItem(ACCESS_KEY);
  if (refresh !== undefined) {
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
    else localStorage.removeItem(REFRESH_KEY);
  }
}
export function setCachedUser(user: AuthUser | null): void {
  if (typeof window === "undefined") return;
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
}
export function getCachedUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}
export function clearAuth(): void {
  setAuthTokens(null, null);
  setCachedUser(null);
}

// ───────────────────── 타입 ─────────────────────

export interface AuthUser {
  pk?: number;
  id?: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  /** 성별: "M" | "F" | "O" | "" (미설정) */
  gender?: string;
  is_active?: boolean;
  is_staff?: boolean;
  is_superuser?: boolean;
  date_joined?: string | null;
  last_login?: string | null;
}

export interface LoginResponse {
  access?: string;
  refresh?: string;
  access_token?: string;
  refresh_token?: string;
  user?: AuthUser;
  key?: string; // 토큰 인증 호환
}

// ───────────────────── 내부 HTTP ─────────────────────

async function request<T>(
  path: string,
  init: RequestInit = {},
  opts: { auth?: boolean } = {},
): Promise<T> {
  const { auth = true } = opts;
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body && typeof init.body === "string") {
    headers.set("Content-Type", "application/json");
  }
  if (auth) {
    const tok = getAccessToken();
    if (tok && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${tok}`);
    }
  }
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...init,
    headers,
  });
  // 응답 본문은 스트림이라 한 번만 읽을 수 있음 — 텍스트로 먼저 받아두고
  // 필요 시 JSON 파싱을 시도합니다 ("body stream already read" 회피).
  const text = await res.text();

  if (!res.ok) {
    let detail = text;
    try {
      const data = JSON.parse(text);
      detail = typeof data === "string" ? data : JSON.stringify(data);
    } catch {
      // not JSON — 원문 텍스트 그대로 사용
    }
    throw new ApiError(res.status, detail);
  }

  // 204 No Content 또는 비-JSON 응답
  const ct = res.headers.get("Content-Type") || "";
  if (!text) return undefined as T;
  if (!ct.includes("application/json")) {
    return text as unknown as T;
  }
  return JSON.parse(text) as T;
}

export class ApiError extends Error {
  readonly status: number;
  readonly detail: string;
  constructor(status: number, detail: string) {
    super(`HTTP ${status}: ${detail}`);
    this.status = status;
    this.detail = detail;
  }
}

function extractKoreanMessage(detail: string): string {
  // dj-rest-auth 응답 예: {"non_field_errors":["..."]} 또는 {"username":["..."]}
  // SimpleJWT 응답 예: {"detail":"...","code":"token_not_valid","messages":[{...}]}
  try {
    const obj = JSON.parse(detail);
    return flatten(obj).join("\n") || detail;
  } catch {
    return detail;
  }
}

function flatten(v: unknown): string[] {
  if (v == null) return [];
  if (typeof v === "string") return [v];
  if (typeof v === "number" || typeof v === "boolean") return [String(v)];
  if (Array.isArray(v)) return v.flatMap(flatten);
  if (typeof v === "object") {
    // SimpleJWT의 nested 객체는 사람에게 보일 메시지만 추출 (token_class 등은 버린다)
    const o = v as Record<string, unknown>;
    if (typeof o.detail === "string") return [o.detail];
    if (typeof o.message === "string") return [o.message];
    return Object.values(o).flatMap(flatten);
  }
  return [];
}

// ───────────────────── 인증 API ─────────────────────

/** 이메일 또는 사용자명 + 비밀번호 로그인. JWT를 자동 저장. */
export async function authLogin(input: {
  username?: string;
  email?: string;
  password: string;
}): Promise<LoginResponse> {
  // 이전 세션의 (만료/무효) 토큰이 Authorization 헤더로 같이 가면
  // SimpleJWT가 먼저 그걸 검증해서 401 token_not_valid를 돌려준다. 미리 비운다.
  clearAuth();
  // 백엔드가 username/email 어느 쪽 기반이든 동작하도록 두 필드를 함께 보낸다.
  // (dj-rest-auth LoginSerializer는 사용하지 않는 필드를 무시한다.)
  const payload = {
    ...input,
    username: input.username ?? input.email,
    email: input.email ?? input.username,
  };
  try {
    const res = await request<LoginResponse>(
      "/api/auth/login/",
      { method: "POST", body: JSON.stringify(payload) },
      { auth: false },
    );
    const access = res.access ?? res.access_token ?? res.key ?? null;
    const refresh = res.refresh ?? res.refresh_token ?? null;
    if (access) setAuthTokens(access, refresh);
    if (res.user) setCachedUser(res.user);
    return res;
  } catch (e) {
    if (e instanceof ApiError) {
      throw new Error(translateAuthError(extractKoreanMessage(e.detail)));
    }
    throw e;
  }
}

/** 회원가입 (dj-rest-auth registration).
 *  - 이메일 검증이 mandatory면 토큰 없이 {"detail":"Verification e-mail sent."} 반환
 *  - 검증 비활성/optional이면 access/refresh 즉시 발급
 */
export async function authRegister(input: {
  email: string;
  password1: string;
  password2: string;
}): Promise<LoginResponse & { detail?: string }> {
  clearAuth();
  try {
    const res = await request<LoginResponse & { detail?: string }>(
      "/api/auth/registration/",
      { method: "POST", body: JSON.stringify(input) },
      { auth: false },
    );
    const access = res.access ?? res.access_token ?? res.key ?? null;
    const refresh = res.refresh ?? res.refresh_token ?? null;
    if (access) setAuthTokens(access, refresh);
    if (res.user) setCachedUser(res.user);
    return res;
  } catch (e) {
    if (e instanceof ApiError) {
      throw new Error(translateAuthError(extractKoreanMessage(e.detail)));
    }
    throw e;
  }
}

/** 로그아웃 — 서버 측 토큰 무효화 시도 + 로컬 토큰 제거. */
export async function authLogout(): Promise<void> {
  try {
    await request("/api/auth/logout/", { method: "POST", body: "{}" });
  } catch {
    // 서버 실패해도 로컬은 정리
  } finally {
    clearAuth();
  }
}

/** 현재 사용자 조회 (인증 필요). 미인증이면 null 반환. */
export async function authGetMe(): Promise<AuthUser | null> {
  if (!getAccessToken()) return null;
  try {
    const res = await request<{ authenticated: boolean; user?: AuthUser }>(
      "/api/auth/me",
      { method: "GET" }
    );
    if (!res.authenticated || !res.user) return null;
    setCachedUser(res.user);
    return res.user;
  } catch {
    return null;
  }
}

/** 소셜 로그인 시작 URL. 브라우저를 이 URL로 이동시키면 백엔드 → OAuth → 프론트 콜백 흐름이 시작됩니다. */
export function authSocialLoginUrl(provider: "google" | "kakao" | "naver"): string {
  return `${API_BASE.replace(/\/$/, "")}/accounts/${provider}/login/?process=login`;
}

/** 비밀번호 찾기 — 이메일로 재설정 링크를 발송합니다. */
export async function authPasswordResetRequest(email: string): Promise<{ detail: string }> {
  try {
    return await request<{ detail: string }>(
      "/api/auth/password/reset/",
      { method: "POST", body: JSON.stringify({ email }) },
      { auth: false },
    );
  } catch (e) {
    if (e instanceof ApiError) {
      throw new Error(translateAuthError(extractKoreanMessage(e.detail)));
    }
    throw e;
  }
}

/** 현재 사용자 프로필 조회 (이름·성별 포함). 인증 필수. */
export async function authGetProfile(): Promise<AuthUser> {
  try {
    const res = await request<{ user: AuthUser }>(
      "/api/auth/profile",
      { method: "GET" },
    );
    if (res.user) setCachedUser(res.user);
    return res.user;
  } catch (e) {
    if (e instanceof ApiError) {
      throw new Error(translateAuthError(extractKoreanMessage(e.detail)));
    }
    throw e;
  }
}

/** 프로필 수정 — first_name, last_name, gender 중 일부 또는 전체. */
export async function authUpdateProfile(input: {
  first_name?: string;
  last_name?: string;
  gender?: string;
}): Promise<AuthUser> {
  try {
    const res = await request<{ user: AuthUser }>(
      "/api/auth/profile",
      { method: "PATCH", body: JSON.stringify(input) },
    );
    if (res.user) setCachedUser(res.user);
    return res.user;
  } catch (e) {
    if (e instanceof ApiError) {
      throw new Error(translateAuthError(extractKoreanMessage(e.detail)));
    }
    throw e;
  }
}

/** 로그인 상태에서 비밀번호 변경. dj-rest-auth 표준 endpoint 사용. */
export async function authChangePassword(input: {
  old_password: string;
  new_password1: string;
  new_password2: string;
}): Promise<{ detail: string }> {
  try {
    return await request<{ detail: string }>(
      "/api/auth/password/change/",
      { method: "POST", body: JSON.stringify(input) },
    );
  } catch (e) {
    if (e instanceof ApiError) {
      throw new Error(translateAuthError(extractKoreanMessage(e.detail)));
    }
    throw e;
  }
}

/** 비밀번호 재설정 — 이메일 링크에서 받은 uid/token + 새 비밀번호. */
export async function authPasswordResetConfirm(input: {
  uid: string;
  token: string;
  new_password1: string;
  new_password2: string;
}): Promise<{ detail: string }> {
  try {
    return await request<{ detail: string }>(
      "/api/auth/password/reset/confirm/",
      { method: "POST", body: JSON.stringify(input) },
      { auth: false },
    );
  } catch (e) {
    if (e instanceof ApiError) {
      throw new Error(translateAuthError(extractKoreanMessage(e.detail)));
    }
    throw e;
  }
}

// ───────────────────── 에러 메시지 한글화 ─────────────────────

function translateAuthError(raw: string): string {
  const s = raw || "";
  if (/token_not_valid|Given token not valid|Token is invalid or expired/i.test(s)) {
    return "세션이 만료되었습니다. 페이지를 새로고침한 뒤 다시 로그인해주세요.";
  }
  if (/E-mail is not verified|not verified/i.test(s)) {
    return "이메일 인증이 완료되지 않았습니다. 가입 시 받은 메일의 링크를 클릭해주세요.";
  }
  if (
    /Unable to log in with provided credentials/i.test(s) ||
    /no active account/i.test(s) ||
    /제공된 인증 데이터로는 로그인 할 수 없습니다/.test(s) ||
    /제공된 자격으로 로그인 할 수 없습니다/.test(s)
  ) {
    return "이메일 또는 비밀번호가 올바르지 않습니다. 비밀번호 찾기로 재설정해보세요.";
  }
  if (/This password is too short/i.test(s) || /this password is too common/i.test(s)) {
    return "비밀번호가 너무 단순합니다. 영문·숫자 포함 8자 이상을 사용해주세요.";
  }
  if (/이미 존재합니다/.test(s) || /already exists/i.test(s)) {
    return "이미 사용 중인 이메일입니다.";
  }
  if (/two password fields didn't match/i.test(s)) {
    return "비밀번호가 일치하지 않습니다.";
  }
  if (/Enter a valid email/i.test(s)) {
    return "올바른 이메일을 입력해주세요.";
  }
  return s || "요청을 처리하지 못했습니다.";
}
