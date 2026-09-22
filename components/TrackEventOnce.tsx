"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

/**
 * 마운트될 때 GA4 이벤트를 한 번만 보내는 표시용 컴포넌트 (화면에 아무것도 그리지 않음).
 *
 * 서버 컴포넌트 페이지(예: /email-verified)에서 전환 이벤트를 보내야 할 때 쓴다.
 * `key` 가 같은 이벤트는 브라우저(localStorage)당 1회만 전송한다 — 새로고침·재방문으로
 * 전환 수가 부풀지 않도록. (GA4 퍼널은 순 사용자 기준이라 영향이 없지만, 유입 경로 표는
 * 이벤트 '횟수' 기준이라 중복이 그대로 드러난다.)
 */
export default function TrackEventOnce({
  name,
  params,
  once = true,
}: {
  name: string;
  params?: Record<string, string | number | boolean | undefined>;
  once?: boolean;
}) {
  useEffect(() => {
    const flag = `vpg.tracked.${name}`;
    if (once) {
      try {
        if (localStorage.getItem(flag)) return;
        localStorage.setItem(flag, "1");
      } catch {
        // 시크릿 모드·저장소 차단 — 중복 방지는 포기하고 이벤트는 보낸다
      }
    }
    trackEvent(name, params);
    // params 는 렌더마다 새 객체일 수 있어 의존성에서 제외한다(이벤트는 마운트 1회만).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, once]);

  return null;
}
