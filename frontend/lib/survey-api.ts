import { getAccessToken } from "./auth-api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

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
    body: JSON.stringify({ definition, needs }),
  });
}

export function runSurvey(
  hypotheses: string[],
  questions: SurveyQuestion[],
  sido = "서울특별시",
  sampleSize = 50,
): Promise<RunResponse> {
  return apiFetch("/api/survey/run", {
    method: "POST",
    body: JSON.stringify({ hypotheses, questions, sido, sample_size: sampleSize }),
  });
}

export function getSurveyStatus(jobId: string): Promise<StatusResponse> {
  return apiFetch(`/api/survey/${jobId}/status`);
}

export function getSurveyResults(jobId: string): Promise<ResultsResponse> {
  return apiFetch(`/api/survey/${jobId}/results`);
}
