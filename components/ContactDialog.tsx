"use client";

import { useEffect, useState } from "react";
import { Mail, X, Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

const CONTACT_EMAILS = ["hys@omninode.kr", "cwb@omninode.kr"];
const CONTACT_EMAIL_DISPLAY = CONTACT_EMAILS.join(", ");
// Formspree form endpoint (omninode 홈페이지에서 이미 사용 중인 양식)
const FORMSPREE_ENDPOINT = "https://formspree.io/f/xwvwokke";

type Props = {
  open: boolean;
  onClose: () => void;
  /** 문의 내용 위에 자동으로 붙는 컨텍스트 (예: 조사 설계 요약) */
  prefill?: string;
  /** 다이얼로그 상단 안내 문구 */
  title?: string;
  subtitle?: string;
};

type Status = "idle" | "sending" | "success" | "error";

export default function ContactDialog({
  open,
  onClose,
  prefill,
  title = "문의하기",
  subtitle = "담당자에게 메일로 문의 내용을 전달합니다.",
}: Props) {
  const [affiliation, setAffiliation] = useState("");
  const [nameTitle, setNameTitle] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ESC 닫기
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // 본문 스크롤 잠금
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // 닫힐 때 상태 초기화 (다시 열었을 때 깨끗하게)
  useEffect(() => {
    if (open) return;
    const t = setTimeout(() => {
      setStatus("idle");
      setErrorMsg(null);
    }, 200);
    return () => clearTimeout(t);
  }, [open]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "sending") return;

    setStatus("sending");
    setErrorMsg(null);

    const formData = new FormData();
    formData.append("_subject", `[Socialtwin 문의] ${affiliation} · ${nameTitle}`);
    formData.append("_replyto", email);
    // 기본 수신자(Formspree 폼 설정 = hys@omninode.kr) 외 담당자는 참조(CC)로 발송.
    // 기본 수신자와 중복 방지: CONTACT_EMAILS 중 첫 주소(기본 수신자)는 제외.
    const ccList = CONTACT_EMAILS.slice(1).join(",");
    if (ccList) formData.append("_cc", ccList);
    formData.append("소속", affiliation);
    formData.append("이름/직급", nameTitle);
    formData.append("회신 이메일", email);
    formData.append("연락처", phone || "(미기재)");
    formData.append("문의 내용", message);
    if (prefill) formData.append("설계 요약", prefill);

    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const detail =
          (Array.isArray(data?.errors) && data.errors[0]?.message) ||
          data?.error ||
          `HTTP ${res.status}`;
        throw new Error(detail);
      }
      setStatus("success");
      // 입력 초기화
      setAffiliation("");
      setNameTitle("");
      setEmail("");
      setMessage("");
      setPhone("");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "전송 중 오류가 발생했습니다");
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl shadow-black/30 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500" />

        <div className="px-6 pt-5 pb-2 flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Mail size={16} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{title}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 -mr-1"
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </div>

        {status === "success" ? (
          <div className="px-6 py-8 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
              <CheckCircle2 size={28} className="text-emerald-500" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">문의가 전송되었습니다</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              담당자가 입력하신 이메일로 회신드릴 예정입니다.<br />
              감사합니다.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-all"
            >
              닫기
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                소속 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={affiliation}
                onChange={(e) => setAffiliation(e.target.value)}
                placeholder="예: 소셜트윈 / OO기업 마케팅팀"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-300 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                이름 / 직급 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={nameTitle}
                onChange={(e) => setNameTitle(e.target.value)}
                placeholder="예: 홍길동 / 매니저"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-300 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                회신받을 이메일 <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hello@example.com"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-300 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                문의 내용 <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="어떤 도움이 필요하신가요?"
                rows={5}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-300 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                연락처 <span className="text-slate-400 font-normal">(선택사항)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010-0000-0000"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-300 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all"
              />
            </div>

            {prefill && (
              <div className="text-[11px] text-slate-400 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                현재 설계한 조사 요약이 메일에 자동으로 첨부됩니다.
              </div>
            )}

            {status === "error" && errorMsg && (
              <div className="flex items-start gap-2 text-[11px] text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
                <span>전송 실패: {errorMsg}</span>
              </div>
            )}

            <div className="flex items-center gap-2 mt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={status === "sending"}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-all disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={status === "sending"}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-all hover:shadow-lg hover:shadow-indigo-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {status === "sending" ? (
                  <>
                    <Loader2 size={13} className="animate-spin" /> 전송 중...
                  </>
                ) : (
                  <>
                    <Send size={13} /> 메일 보내기
                  </>
                )}
              </button>
            </div>

            <p className="text-[10px] text-slate-400 text-center">
              전송 버튼을 누르면 즉시 담당자({CONTACT_EMAIL_DISPLAY})에게 메일이 발송됩니다.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
