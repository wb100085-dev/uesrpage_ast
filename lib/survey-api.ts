import { getAccessToken } from "./auth-api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// 기본 AI 모델 — GPT-5.5 (최고급). 백엔드 ai_router 가 요청별 model 오버라이드로 사용.
export const DEFAULT_AI_MODEL = "gpt-5.5";
// 가상인구 추출 기본 표본 수
export const DEFAULT_SAMPLE_SIZE = 500;

export interface SurveyQuestion {
  type: string;
  title: string;
  question: string;
  options: string[];
}

export interface DistItem {
  선택지: string;
  응답자수: number;
  "비율(%)": number;
}

export interface SurveyResult {
  문항번호: number;
  제목: string;
  질문: string;
  유형: string;
  응답자수: number;
  분포: DistItem[];
  평균점수: number | null;
}

export interface SurveyReport {
  상세분석: string;
  결과및전략: string;
}

export interface DesignResponse {
  hypotheses: string[];
  questions: SurveyQuestion[];
}

export interface RunResponse {
  job_id: string;
}

export interface StatusResponse {
  status: "running" | "done" | "error";
  error?: string;
}

export interface ResultsResponse {
  status: string;
  results: SurveyResult[];
  report: SurveyReport;
  n_respondents: number;
  sido: string;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (typeof window !== "undefined") {
    const tok = getAccessToken();
    if (tok && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${tok}`);
    }
  }
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API 오류 ${res.status}: ${err}`);
  }
  return res.json() as Promise<T>;
}

export function designSurvey(definition: string, needs: string): Promise<DesignResponse> {
  return apiFetch("/api/survey/design", {
    method: "POST",
    body: JSON.stringify({ definition, needs, model: DEFAULT_AI_MODEL }),
  });
}

/** 1단계: 가설만 생성 (설문 문항은 만들지 않음 — AI 호출 절약 + 가설 수정 후 재생성 가능) */
export function generateHypotheses(body: {
  definition: string;
  needs: string;
  trade_type?: string;
  industry?: string;
  attachments?: { data: string; mime?: string; description?: string }[];
}): Promise<{ hypotheses: string[]; attachment_analysis?: string }> {
  return apiFetch("/api/survey/hypotheses", {
    method: "POST",
    body: JSON.stringify({ ...body, model: DEFAULT_AI_MODEL }),
  });
}

/** 2단계: 검토·수정한 가설로 설문 문항 생성 */
export function generateQuestions(body: {
  hypotheses: string[];
  definition?: string;
}): Promise<{ questions: SurveyQuestion[] }> {
  return apiFetch("/api/survey/questions", {
    method: "POST",
    body: JSON.stringify({ ...body, model: DEFAULT_AI_MODEL }),
  });
}

export function runSurvey(
  hypotheses: string[],
  questions: SurveyQuestion[],
  sido = "서울특별시",
  sampleSize = DEFAULT_SAMPLE_SIZE,
  model = DEFAULT_AI_MODEL,
): Promise<RunResponse> {
  return apiFetch("/api/survey/run", {
    method: "POST",
    body: JSON.stringify({ hypotheses, questions, sido, sample_size: sampleSize, model }),
  });
}

export function getSurveyStatus(jobId: string): Promise<StatusResponse> {
  return apiFetch(`/api/survey/${jobId}/status`);
}

export function getSurveyResults(jobId: string): Promise<ResultsResponse> {
  return apiFetch(`/api/survey/${jobId}/results`);
}

export interface DesignHistoryItem {
  id: number;
  created_at: string;
  updated_at?: string;
  user_id?: string | null;
  user_email?: string | null;
  job_id?: string | null;
  model?: string | null;
  sido?: string | null;
  sample_size?: number | null;
  n_respondents?: number | null;
  // 백엔드 status: "hypotheses" | "questions" | "running" | "completed" | "error"
  status: string;
  trade_type?: string | null;
  industry?: string | null;
  definition?: string | null;
  needs?: string | null;
  hypotheses?: string[] | null;
}

export function getMyDesigns(): Promise<{ designs: DesignHistoryItem[] }> {
  return apiFetch("/api/survey/my-designs");
}

/** /design ?design=<id> 로드용 — 단건 전체(questions 포함). */
export interface DesignFull extends DesignHistoryItem {
  questions?: SurveyQuestion[] | null;
}

export function getMyDesign(id: number): Promise<{ design: DesignFull }> {
  return apiFetch(`/api/survey/my-designs/${id}`);
}

// ─── 설문 설계 임시저장 (drafts) ─────────────────────────────

export interface SurveyDraft {
  id: number;
  created_at: string;
  updated_at: string;
  user_id?: string | null;
  user_email: string;
  title?: string | null;
  step: string; // "input" | "hyp_review" | "survey_review" | "result" ...
  input_data: Record<string, unknown>;
  hypotheses: string[];
  selected_hypotheses: number[];
  questions: SurveyQuestion[];
}

export type SurveyDraftPatch = Partial<Omit<SurveyDraft, "id" | "created_at" | "updated_at" | "user_id" | "user_email">>;

export function listDrafts(): Promise<{ drafts: SurveyDraft[]; count: number }> {
  return apiFetch("/api/survey/drafts");
}

export function createDraft(data: SurveyDraftPatch): Promise<{ draft: SurveyDraft }> {
  return apiFetch("/api/survey/drafts", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getDraft(id: number): Promise<{ draft: SurveyDraft }> {
  return apiFetch(`/api/survey/drafts/${id}`);
}

export function updateDraft(id: number, patch: SurveyDraftPatch): Promise<{ draft: SurveyDraft }> {
  return apiFetch(`/api/survey/drafts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function deleteDraft(id: number): Promise<{ ok: boolean }> {
  return apiFetch(`/api/survey/drafts/${id}`, { method: "DELETE" });
}
