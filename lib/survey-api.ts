import { getAccessToken } from "./auth-api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// 기본 AI 모델 — GPT-5.5 (최고급). 백엔드 ai_router 가 요청별 model 오버라이드로 사용.
export const DEFAULT_AI_MODEL = "gpt-5.5";
// 가상인구 추출 기본 표본 수 (설정 API 실패 시 폴백 — 평소엔 관리자 대시보드 값을 따름)
export const DEFAULT_SAMPLE_SIZE = 50;
// 조사 실행 기본 지역 (설정 API 실패 시 폴백)
export const DEFAULT_SIDO = "전국";

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
  // on-demand 상세 분석(POST /detail)으로 채워지는 추가 섹션들 (관리자 7단계와 동일)
  executive_summary?: string;
  segment_analysis?: string;
  pain_points?: string;
  market_competitive?: string;
  strategy?: string;
  limitations?: string;
}

export interface RunResponse {
  job_id: string;
}

export interface StatusResponse {
  status: "running" | "done" | "error";
  /** 백엔드 잡 진행 상황 — 패널 로드(1/4) → AI 응답 생성(2/4) → 결과 집계(3/4) → 인포그래픽(4/4) */
  progress?: { done?: number; total?: number; stage?: string };
  error?: string | null;
}

/** 조사 결과 1슬라이드 요약 (관리자 프론트 InfographicSummary 와 동일 형태) */
export interface InfographicSummary {
  headline: string;
  subheadline?: string;
  kpi_cards: { label: string; value: string; sub?: string }[];
  key_findings: string[];
  next_actions: string[];
  hypothesis_validation?: { hypothesis: string; verdict: string; evidence: string }[];
  target_segments?: { segment: string; insight: string }[];
  risks?: string[];
  opportunities?: string[];
  key_quote?: { text: string; source: string };
  key_quotes?: { text: string; source: string }[];
}

export interface ResultsResponse {
  status: string;
  results?: SurveyResult[];
  report?: SurveyReport;
  infographic?: InfographicSummary;
  n_respondents?: number;
  sido?: string;
  error?: string | null;
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

// ─── 전역 앱 설정 (관리자가 대시보드에서 지정) ────────────────
// 관리자 페이지에서 저장한 기본 AI 모델/표본 수를 백엔드에서 조회해 따른다.
// 세션당 1회만 호출하고 캐싱 (실패 시 하드코드 기본값으로 폴백).

export interface AppSettings {
  default_ai_model: string;
  analysis_sample_size: number;
  analysis_sido: string;
}

let _settingsPromise: Promise<AppSettings> | null = null;

export function getAppSettings(): Promise<AppSettings> {
  if (!_settingsPromise) {
    _settingsPromise = apiFetch<AppSettings>("/api/settings").catch(() => ({
      default_ai_model: DEFAULT_AI_MODEL,
      analysis_sample_size: DEFAULT_SAMPLE_SIZE,
      analysis_sido: DEFAULT_SIDO,
    }));
  }
  return _settingsPromise;
}

/** 관리자가 지정한 기본 AI 모델 (실패 시 DEFAULT_AI_MODEL). */
export async function getEffectiveModel(): Promise<string> {
  const s = await getAppSettings();
  return s.default_ai_model || DEFAULT_AI_MODEL;
}

/** 1단계: 가설만 생성 (설문 문항은 만들지 않음 — AI 호출 절약 + 가설 수정 후 재생성 가능) */
export async function generateHypotheses(body: {
  definition: string;
  needs: string;
  trade_type?: string;
  industry?: string;
  attachments?: { data: string; mime?: string; description?: string }[];
}): Promise<{ hypotheses: string[]; attachment_analysis?: string; design_id?: number | null }> {
  const model = await getEffectiveModel();
  return apiFetch("/api/survey/hypotheses", {
    method: "POST",
    body: JSON.stringify({ ...body, model }),
  });
}

/** 2단계: 검토·수정한 가설로 설문 문항 생성 */
export async function generateQuestions(body: {
  hypotheses: string[];
  definition?: string;
  design_id?: number | null;
}): Promise<{ questions: SurveyQuestion[] }> {
  const model = await getEffectiveModel();
  return apiFetch("/api/survey/questions", {
    method: "POST",
    body: JSON.stringify({ ...body, model }),
  });
}

/**
 * 가상인구 대상 조사 실행 (8단계 결과).
 * 지역·표본 수·모델은 관리자 대시보드의 전역 설정(analysis_sido / analysis_sample_size /
 * default_ai_model)을 따른다. 즉시 job_id 를 반환하며 getSurveyStatus 로 폴링한다.
 */
export async function runSurvey(body: {
  hypotheses: string[];
  questions: SurveyQuestion[];
  definition?: string;
  needs?: string;
  design_id?: number | null;
}): Promise<RunResponse> {
  const s = await getAppSettings();
  return apiFetch("/api/survey/run", {
    method: "POST",
    body: JSON.stringify({
      ...body,
      sido: s.analysis_sido || DEFAULT_SIDO,
      // 백엔드 RunRequestSerializer 상한(10000)에 맞춰 클램프
      sample_size: Math.max(1, Math.min(10000, s.analysis_sample_size || DEFAULT_SAMPLE_SIZE)),
      model: s.default_ai_model || DEFAULT_AI_MODEL,
    }),
  });
}

export function getSurveyStatus(jobId: string): Promise<StatusResponse> {
  return apiFetch(`/api/survey/${jobId}/status`);
}

export function getSurveyResults(jobId: string): Promise<ResultsResponse> {
  return apiFetch(`/api/survey/${jobId}/results`);
}

// ─── 상세 분석 (on-demand) ────────────────────────────────────
// 결제 후 사용자가 상세분석 결과를 볼 때 트리거. POST /detail 로 시작하고
// GET /detail-status 로 폴링하여 report(상세 보고서)를 받는다.

export interface DetailStatusResponse {
  detail_status: "idle" | "running" | "done" | "error";
  detail_progress?: { done?: number; total?: number; stage?: string };
  detail_error?: string | null;
  report?: SurveyReport | null;
}

export function startDetail(jobId: string): Promise<DetailStatusResponse> {
  return apiFetch(`/api/survey/${jobId}/detail`, { method: "POST", body: JSON.stringify({}) });
}

export function getDetailStatus(jobId: string): Promise<DetailStatusResponse> {
  return apiFetch(`/api/survey/${jobId}/detail-status`);
}

// ─── 가상인구 패널에게 질문 (패널 챗) ─────────────────────────
// 완료된 설문의 결과 컨텍스트로 AI가 가상패널 입장에서 자유 질문에 답한다.
export function askPanel(jobId: string, question: string): Promise<{ answer: string }> {
  return apiFetch(`/api/survey/${jobId}/chat`, {
    method: "POST",
    body: JSON.stringify({ question }),
  });
}

// ─── 파일 다운로드 (Blob, Bearer 첨부) ────────────────────────

async function apiBlob(path: string): Promise<Blob> {
  const headers = new Headers();
  if (typeof window !== "undefined") {
    const tok = getAccessToken();
    if (tok) headers.set("Authorization", `Bearer ${tok}`);
  }
  const res = await fetch(`${API_BASE}${path}`, { headers });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`다운로드 오류 ${res.status}: ${t}`);
  }
  return res.blob();
}

function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function stamp(): string {
  return new Date().toISOString().slice(0, 10).replace(/-/g, "");
}

/** 가설 및 설문 문항 (설계서 PDF) */
export async function downloadDesignPdf(jobId: string): Promise<void> {
  saveBlob(await apiBlob(`/api/survey/${jobId}/design.pdf`), `가설_설문문항_${stamp()}.pdf`);
}

/** 요약보고서 (설계서 + 조사결과 요약 PDF) */
export async function downloadSummaryPdf(jobId: string): Promise<void> {
  saveBlob(await apiBlob(`/api/survey/${jobId}/summary.pdf`), `요약보고서_${stamp()}.pdf`);
}

// ─── 리뷰 이벤트 설문 응답 ────────────────────────────────────
export interface ReviewSubmitPayload {
  survey_key: "service_review" | "report_quality";
  job_id?: string | null;
  answers: Record<string, unknown>;
}

/** 리뷰 설문 응답 저장 */
export function submitReviewResponse(payload: ReviewSubmitPayload): Promise<{ ok: boolean; id?: number }> {
  return apiFetch("/api/survey/review", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface ReviewResponseRow {
  id: number;
  created_at: string;
  user_email?: string | null;
  job_id?: string | null;
  survey_key: string;
  answers: Record<string, unknown>;
}

/** (관리자) 리뷰 설문 응답 전체 조회 */
export function listReviewResponses(): Promise<{ responses: ReviewResponseRow[] }> {
  return apiFetch("/api/survey/review");
}

/** 현재 사용자의 체험후기(설문1) 작성 여부 — 아이디당 1회 제한 UX용 */
export function getMyReviewStatus(): Promise<{ submitted: boolean; exempt: boolean; email: string | null }> {
  return apiFetch("/api/survey/review/me");
}

/** (관리자) 리뷰 설문 응답 CSV 다운로드 */
export async function downloadReviewCsv(): Promise<void> {
  saveBlob(await apiBlob(`/api/survey/review.csv`), `리뷰설문응답_${stamp()}.csv`);
}

/** 가상인구 Raw Data (CSV) */
export async function downloadRawCsv(jobId: string): Promise<void> {
  saveBlob(await apiBlob(`/api/survey/${jobId}/raw-csv`), `가상인구_RawData_${stamp()}.csv`);
}

/** 상세보고서 (전체 보고서 PDF) */
export async function downloadReportPdf(jobId: string): Promise<void> {
  saveBlob(await apiBlob(`/api/survey/${jobId}/report.pdf`), `상세보고서_${stamp()}.pdf`);
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
