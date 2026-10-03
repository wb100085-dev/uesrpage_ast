"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Users, RefreshCw } from "lucide-react";
import PaidLockNotice from "@/components/PaidLockNotice";
import { useLang, useT } from "@/lib/i18n";
import { romanizeName } from "@/lib/romanize";
import { useLabel } from "@/lib/i18n-labels";
import {
  getInterviewPanel,
  askInterviewPanel,
  type InterviewMember,
  type InterviewTurn,
} from "@/lib/survey-api";

// 패널별 고정 색상 — 같은 사람이 대화 내내 같은 색 아바타를 갖도록 인덱스로 배정.
const AVATAR_COLORS = [
  "bg-indigo-100 text-indigo-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-sky-100 text-sky-700",
];

const EXAMPLES = [
  "그렇게 답하신 이유를 조금 더 자세히 말씀해 주시겠어요?",
  "실제로 돈을 내고 쓰신다면 어떤 점이 가장 걸리나요?",
  "비슷한 제품을 써보신 경험이 있다면 어떠셨나요?",
  "어떤 점이 바뀌면 생각이 달라질까요?",
];
const EXAMPLES_EN = [
  "Could you tell me more about why you answered that way?",
  "If you actually had to pay for it, what would concern you most?",
  "If you've used a similar product, how was it?",
  "What would need to change for you to feel differently?",
];

/** 백엔드 에러는 원문 문자열 그대로, 프론트 안내는 [한, 영] 쌍 */
type Msg = string | readonly [ko: string, en: string];

function initial(name: string): string {
  const n = (name || "").trim();
  if (!n) return "??";
  // 한글 이름은 이름 두 글자, 영문 이름은 머리글자 두 개
  if (/[가-힣]/.test(n)) return n.slice(-2);
  return n.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

export default function PanelInterview({ jobId }: { jobId: string }) {
  const t = useT();
  const L = useLabel();
  // 영어 화면에선 가상인구 한글 이름을 로마자로 (김민준 → Kim Minjun)
  const lang = useLang();
  const nm = (name: string) => (lang === "en" ? romanizeName(name) : name);
  const tm = (m: Msg) => (typeof m === "string" ? m : t(m[0], m[1]));
  const [members, setMembers] = useState<InterviewMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<Msg | null>(null);
  const [locked, setLocked] = useState(false); // 유료 전용 — 403

  const [turns, setTurns] = useState<InterviewTurn[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [askError, setAskError] = useState<Msg | null>(null);
  // 한 질문에 답변이 5개씩 쌓여 화면을 넘기므로, 새 턴이 오면 맨 아래로 따라간다.
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns, sending]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getInterviewPanel(jobId);
        if (cancelled) return;
        setMembers(res.members ?? []);
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "";
        // apiFetch 는 "API 오류 403: {...}" 형태로 상태코드를 문자열 앞에 담아 던진다.
        if (/^(API 오류|API error) 403\b/.test(msg)) setLocked(true);
        else setLoadError(msg || ["패널을 불러오지 못했습니다.", "Couldn't load the panel."]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  function colorOf(id: string): string {
    const i = members.findIndex((m) => m.id === id);
    return AVATAR_COLORS[(i < 0 ? 0 : i) % AVATAR_COLORS.length];
  }

  async function ask() {
    const q = input.trim();
    if (!q || sending || members.length === 0) return;
    setInput("");
    setSending(true);
    setAskError(null);
    // 답변 대기 중에도 질문이 먼저 보이도록 빈 턴을 미리 넣는다.
    setTurns((t) => [...t, { question: q, answers: [] }]);
    try {
      const res = await askInterviewPanel(jobId, q, turns);
      setTurns((t) => {
        const next = [...t];
        next[next.length - 1] = { question: q, answers: res.answers ?? [] };
        return next;
      });
    } catch (e) {
      setAskError(e instanceof Error ? e.message : ["인터뷰 답변을 받지 못했습니다.", "Couldn't get interview answers."]);
      setTurns((t) => t.slice(0, -1)); // 실패한 턴은 되돌린다
      setInput(q);
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-slate-400 gap-2">
        <span className="w-4 h-4 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
        {t("인터뷰 패널 구성 중…", "Setting up the interview panel…")}
      </div>
    );
  }

  if (locked) {
    return (
      <PaidLockNotice
        title={t("심층 인터뷰는 유료 이용자 전용입니다", "In-depth interviews are for paid users only")}
        desc={t(
          "결제 또는 30일권을 이용하시면 이 설문에 참여한 가상인구와 직접 대화할 수 있습니다.",
          "Make a payment or get a 30-day pass to talk directly with the virtual respondents who took this survey.",
        )}
      />
    );
  }

  if (loadError || members.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-10">
        <p className="text-sm text-slate-500 mb-2">
          {loadError != null ? tm(loadError) : t("인터뷰할 응답자를 찾지 못했습니다.", "No respondents available to interview.")}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:underline"
        >
          <RefreshCw size={12} /> {t("다시 시도", "Try again")}
        </button>
      </div>
    );
  }

  return (
    <>
      {/* 패널 프로필 — 이 설문에 실제로 응답한 사람들 */}
      <div className="px-5 py-3 border-b border-slate-100">
        <p className="text-[11px] text-slate-400 mb-2 flex items-center gap-1.5">
          <Users size={12} />{" "}
          {t(
            <>이 설문에 응답한 {members.length}명과 대화합니다</>,
            <>Talking with the {members.length} respondents who took this survey</>,
          )}
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {members.map((m, i) => (
            <div
              key={m.id}
              title={[m.label, m.job, m.education, m.income].filter(Boolean).map(L).join(" · ")}
              className="shrink-0 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/60 px-2.5 py-1.5"
            >
              <span
                className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center ${
                  AVATAR_COLORS[i % AVATAR_COLORS.length]
                }`}
              >
                {initial(nm(m.name))}
              </span>
              <span className="min-w-0">
                <span className="block text-[11px] font-medium text-slate-700 leading-tight truncate max-w-[7rem]">
                  {nm(m.name)}
                </span>
                <span className="block text-[10px] text-slate-400 leading-tight truncate max-w-[7rem]">
                  {L(m.label)}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 대화 */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {turns.length === 0 && (
          <div className="text-center text-sm text-slate-400 py-8">
            <Users size={28} className="mx-auto mb-3 text-slate-300" />
            {t("응답자 본인에게 직접 물어보세요.", "Ask the respondents directly.")}
            <div className="mt-4 flex flex-col gap-2">
              {t(EXAMPLES, EXAMPLES_EN).map((ex) => (
                <button
                  key={ex}
                  onClick={() => setInput(ex)}
                  className="text-xs px-3 py-2 rounded-xl border border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition text-left leading-snug"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}

        {turns.map((turn, ti) => (
          <div key={ti} className="space-y-3">
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm text-white whitespace-pre-wrap leading-relaxed">
                {turn.question}
              </div>
            </div>
            {turn.answers.map((a) => (
              <div key={a.id} className="flex gap-2.5">
                <span
                  className={`shrink-0 w-7 h-7 rounded-full text-[10px] font-bold flex items-center justify-center mt-0.5 ${colorOf(
                    a.id,
                  )}`}
                >
                  {initial(nm(a.name))}
                </span>
                <div className="min-w-0">
                  <div className="text-[11px] text-slate-400 mb-1">
                    <span className="font-medium text-slate-600">{nm(a.name)}</span> · {L(a.label)}
                  </div>
                  <div className="rounded-2xl bg-slate-100 px-4 py-2.5 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {a.answer}
                  </div>
                </div>
              </div>
            ))}
            {sending && ti === turns.length - 1 && turn.answers.length === 0 && (
              <div className="flex items-center gap-2 text-sm text-slate-400 pl-1">
                <span className="w-4 h-4 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
                {t(
                  <>{members.length}명이 답변을 작성하고 있습니다…</>,
                  <>{members.length} respondents are writing their answers…</>,
                )}
              </div>
            )}
          </div>
        ))}
        {askError && <p className="text-sm text-red-600">{tm(askError)}</p>}
        <div ref={bottomRef} />
      </div>

      {/* 입력 */}
      <div className="border-t border-slate-100 p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask();
          }}
          className="flex items-end gap-2"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              // isComposing — 한글 입력 중 조합을 확정하는 Enter 는 전송으로 보지 않는다.
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                ask();
              }
            }}
            rows={1}
            placeholder={t("응답자에게 심층 질문을 해보세요", "Ask the respondents an in-depth question")}
            className="flex-1 resize-none rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-400 max-h-32"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-50"
            aria-label={t("전송", "Send")}
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </>
  );
}
