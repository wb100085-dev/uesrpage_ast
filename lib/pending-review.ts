/**
 * 체험후기(리뷰 이벤트) "로그인 후 이어가기" 컨텍스트.
 *
 * 비로그인 상태에서 /design 결과 화면의 "체험후기 남기기"를 누르면, 진행 중이던
 * 조사(job_id)와 익명으로 저장된 설계기록(design_id)을 localStorage에 보관한 뒤
 * 로그인 페이지로 보낸다. 로그인(또는 이메일 인증 후 로그인)이 끝나면 login/콜백
 * 페이지가 이 값을 읽어:
 *   1) /api/survey/my-designs/<id>/claim 으로 익명 설계기록에 가입 이메일을 연결
 *   2) /design?review=1 로 이동해 체험후기 설문을 자동으로 띄운다
 *
 * 같은 브라우저라면 이메일 인증(EMAIL_VERIFICATION=mandatory) 단계를 거쳐도
 * localStorage가 유지되므로 흐름이 복원된다.
 */

const KEY = "vpg.pending_review";

export interface PendingReview {
  jobId: string | null;
  designId: number | null;
  savedAt: number;
}

export function savePendingReview(input: { jobId?: string | null; designId?: number | null }): void {
  if (typeof window === "undefined") return;
  const payload: PendingReview = {
    jobId: input.jobId ?? null,
    designId: input.designId ?? null,
    savedAt: Date.now(),
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    /* localStorage 불가(시크릿 모드 등) — 무시 */
  }
}

export function getPendingReview(): PendingReview | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingReview;
  } catch {
    return null;
  }
}

export function hasPendingReview(): boolean {
  return getPendingReview() != null;
}

export function clearPendingReview(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* 무시 */
  }
}

/** 로그인 직후 보낼 경로 — 보류 중인 체험후기가 있으면 설문 자동 오픈 경로를 반환. */
export const PENDING_REVIEW_NEXT = "/design?review=1";
