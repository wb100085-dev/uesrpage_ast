"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  authLogout,
  authGetProfile,
  authUpdateProfile,
  authChangePassword,
  type AuthUser,
} from "@/lib/auth-api";
import {
  getMyDesigns, listDrafts, deleteDraft, deleteMyDesign,
  redeemPendingReportToken, type SurveyDraft,
} from "@/lib/survey-api";
import {
  getReportAccessJobs,
  getMySubscription,
  SUBSCRIPTION_PRODUCT_KEY,
  type Subscription,
  type ReportAccess,
  type ReportCoupon,
} from "@/lib/payments-api";
import CheckoutDialog from "@/components/CheckoutDialog";
import PaymentPendingDialog, { canOpenCheckout } from "@/components/PaymentPendingDialog";
import RequireAuth from "@/components/RequireAuth";
import { useLang, useT, type Lang } from "@/lib/i18n";
import { useLabel } from "@/lib/i18n-labels";
import {
  BarChart2, History, ChevronRight, CreditCard, Repeat, CalendarClock,
  LogOut, MapPin, Sparkles, Clock,
  CheckCircle2, AlertCircle, RefreshCw, Construction,
  User, Users, ArrowRight, Zap, Save,
  Lock, Mail, UserCog, FileEdit, Trash2, MessageSquare,
  Info, LayoutDashboard, Ticket,
} from "lucide-react";

/* ─── 상수 ─────────────────────────────────── */

/* ─── 타입 ─────────────────────────────────── */
type SideMenu = "entrant" | "analysis" | "account";
type AnalysisTab = "home" | "history" | "drafts" | "subscription" | "coupons";

type HistoryItem = {
  id: string;
  job_id?: string | null;
  title: string;
  sido: string;
  sample_size: number;
  status: "done" | "running" | "error";
  created_at: string;
};

/**
 * 히스토리 행 클릭 시 어디로 보낼지 결정.
 * - completed + 열람 권한(결제·쿠폰·무료권한) → /results/<job_id> (상세보고서 다운로드 페이지)
 *   — 기존엔 design 요약으로 가서 이미 결제한 설문도 다시 결제해야 하는 문제가 있었음
 * - completed(권한 없음) → /design?design=<id>  (결과 보기 = design 요약 결과 단계)
 * - running + job_id → /survey/<job_id>   (진행 페이지)
 * - error + job_id   → /results/<job_id>  (결과 페이지가 에러 표시)
 * - 그 외 (가설/문항 단계 미완료, job_id 없음) → /design?design=<id> (이어쓰기)
 */
function historyHref(item: HistoryItem, access?: { all_access: boolean; job_ids: string[] }): string {
  if (item.job_id) {
    if (item.status === "running") return `/survey/${item.job_id}`;
    if (item.status === "error") return `/results/${item.job_id}`;
    if (
      item.status === "done" &&
      access &&
      (access.all_access || access.job_ids.includes(String(item.job_id)))
    ) {
      return `/results/${item.job_id}`;
    }
  }
  // done(완료) 및 그 외 → design 페이지로: 작성 내용 복원 + 완료 시 요약 결과 단계로 진입
  return `/design?design=${item.id}`;
}


/** 백엔드 status → UI status 매핑 */
function mapStatus(s: string): HistoryItem["status"] {
  if (s === "completed") return "done";
  if (s === "error") return "error";
  // "hypotheses" | "questions" | "running" → 진행 중으로 표시
  return "running";
}

/* ─── 유틸 ──────────────────────────────────── */
function fmtDate(iso: string, lang: Lang = "ko") {
  const d = new Date(iso);
  if (lang === "en") {
    return d.toLocaleString("en-US", {
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  }
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
/** 이용권 기간 표시용 — null 안전, 날짜만 (예: 2026.09.27) */
function fmtDay(iso: string | null, lang: Lang = "ko") {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  if (lang === "en") return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}
function fmtAgo(iso: string, lang: Lang = "ko") {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (lang === "en") {
    const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? "" : "s"} ago`;
    if (m < 1) return "just now";
    if (m < 60) return plural(m, "min");
    const h = Math.floor(m / 60);
    if (h < 24) return plural(h, "hour");
    return plural(Math.floor(h / 24), "day");
  }
  if (m < 1) return "방금 전";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

/* ─── 배지 ──────────────────────────────────── */
function StatusBadge({ status }: { status: HistoryItem["status"] }) {
  const t = useT();
  if (status === "done") return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium"><CheckCircle2 size={10} />{t("완료", "Done")}</span>;
  if (status === "running") return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-medium"><RefreshCw size={10} className="animate-spin" />{t("진행 중", "In progress")}</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-xs font-medium"><AlertCircle size={10} />{t("오류", "Error")}</span>;
}

/* ─── 무료 쿠폰 ─────────────────────────────── */
/** 관리자가 발행한 쿠폰 종류별 한 줄 설명 (관리자 화면의 3분류와 동일). */
const COUPON_LABEL: Record<ReportCoupon["kind"], string> = {
  once: "1회용 무료 쿠폰",
  multi_single: "무료 쿠폰",
  multi_unlim: "무제한 무료 쿠폰",
};
const COUPON_SCOPE: Record<ReportCoupon["kind"], string> = {
  once: "상세보고서 1건 무료 열람",
  multi_single: "상세보고서 1건 무료 열람",
  multi_unlim: "상세보고서 무제한 무료 열람",
};
const COUPON_LABEL_EN: Record<ReportCoupon["kind"], string> = {
  once: "Single-use free coupon",
  multi_single: "Free coupon",
  multi_unlim: "Unlimited free coupon",
};
const COUPON_SCOPE_EN: Record<ReportCoupon["kind"], string> = {
  once: "1 free detailed report",
  multi_single: "1 free detailed report",
  multi_unlim: "Unlimited free detailed reports",
};

/**
 * 내 무료 권한 카드 — 쿠폰을 가진 계정에만 노출.
 * 쿠폰이 어떤 조사에 쓰였는지는 히스토리 제목으로 보여준다(계정당 1건 쿠폰).
 */
function CouponCard({
  coupons,
  freeEmail,
  freeOnce,
  history,
}: {
  coupons: ReportCoupon[];
  freeEmail: boolean;
  /** 관리자 '1회 무료 제공 이메일' 권한 — 없으면 null */
  freeOnce: { available: boolean; job_id: string | null } | null;
  history: HistoryItem[];
}) {
  const t = useT();
  const lang = useLang();
  const titleOf = (jobId: string) => {
    const h = history.find((x) => String(x.job_id) === jobId);
    if (!h) return t("지난 조사", "Past study");
    return h.title || t("제목 없는 조사", "Untitled study");
  };
  return (
    <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-1">
        <Ticket size={16} className="text-emerald-600" />
        <h3 className="text-sm font-bold text-slate-900">{t("내 무료 쿠폰", "My free coupons")}</h3>
      </div>
      <p className="text-xs text-slate-500 mb-4 leading-relaxed break-keep">
        {t(
          "조사를 완료하면 결제 없이 상세보고서를 열람할 수 있습니다.",
          "Once a study is complete, you can view its detailed report without paying.",
        )}
      </p>
      {coupons.length === 0 && !freeEmail && !freeOnce && (
        <p className="text-sm text-slate-400 py-6 text-center">{t("보유한 쿠폰이 없습니다.", "You don't have any coupons.")}</p>
      )}
      <div className="space-y-2">
        {freeEmail && (
          <div className="flex items-start justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-emerald-800">{t("무료 제공 계정", "Complimentary account")}</p>
              <p className="text-xs text-emerald-700 mt-0.5">{t("상세보고서 무제한 무료 열람", "Unlimited free detailed reports")}</p>
            </div>
            <span className="flex-shrink-0 text-[11px] font-bold px-2 py-1 rounded-full bg-emerald-600 text-white">
              {t("사용 가능", "Available")}
            </span>
          </div>
        )}
        {freeOnce && (
          <div className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 ${
            freeOnce.available ? "border-emerald-100 bg-emerald-50/60" : "border-slate-100 bg-slate-50"
          }`}>
            <div className="min-w-0">
              <p className={`text-sm font-semibold ${freeOnce.available ? "text-emerald-800" : "text-slate-500"}`}>
                {t("무료 제공 계정 (1회)", "Complimentary account (one-time)")}
              </p>
              <p className={`text-xs mt-0.5 ${freeOnce.available ? "text-emerald-700" : "text-slate-400"}`}>
                {t("상세보고서 1건 무료 열람", "1 free detailed report")}
              </p>
              {freeOnce.job_id && (
                <p className="text-xs text-slate-400 mt-0.5 truncate">{t("사용한 조사", "Used on")}: {titleOf(freeOnce.job_id)}</p>
              )}
            </div>
            <span className={`flex-shrink-0 text-[11px] font-bold px-2 py-1 rounded-full ${
              freeOnce.available ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-500"
            }`}>
              {freeOnce.available ? t("사용 가능", "Available") : t("사용 완료", "Used")}
            </span>
          </div>
        )}
        {coupons.map((c, i) => {
          const usable = c.available && !c.expired;
          return (
            <div
              key={`${c.token_tail}-${i}`}
              className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 ${
                usable ? "border-emerald-100 bg-emerald-50/60" : "border-slate-100 bg-slate-50"
              }`}
            >
              <div className="min-w-0">
                <p className={`text-sm font-semibold ${usable ? "text-emerald-800" : "text-slate-500"}`}>
                  {t(COUPON_LABEL[c.kind], COUPON_LABEL_EN[c.kind])}
                  <span className="ml-1.5 font-mono text-[11px] font-normal text-slate-400">
                    ···{c.token_tail}
                  </span>
                </p>
                <p className={`text-xs mt-0.5 ${usable ? "text-emerald-700" : "text-slate-400"}`}>
                  {t(COUPON_SCOPE[c.kind], COUPON_SCOPE_EN[c.kind])}
                  {c.expires_at
                    ? t(` · ${fmtDay(c.expires_at)}까지`, ` · Expires ${fmtDay(c.expires_at, lang)}`)
                    : t(" · 유효기간 없음", " · No expiration")}
                </p>
                {c.job_id && (
                  <p className="text-xs text-slate-400 mt-0.5 truncate">
                    {t("사용한 조사", "Used on")}: {titleOf(c.job_id)}
                  </p>
                )}
              </div>
              <span
                className={`flex-shrink-0 text-[11px] font-bold px-2 py-1 rounded-full ${
                  c.expired
                    ? "bg-amber-100 text-amber-700"
                    : usable
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                {c.expired
                  ? t("기간 만료", "Expired")
                  : usable
                  ? t("사용 가능", "Available")
                  : t("사용 완료", "Used")}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════ */
/*  메인                                        */
/* ═══════════════════════════════════════════ */
export default function UserDashboard() {
  return (
    <RequireAuth>
      <UserDashboardInner />
    </RequireAuth>
  );
}

function UserDashboardInner() {
  const router = useRouter();
  const t = useT();
  const lang = useLang();
  const L = useLabel();
  /** 제목이 비어 있는 조사는 화면에서만 언어별 기본 제목을 보여준다(저장값은 빈 문자열). */
  const titleText = (title: string) => title || t("제목 없는 조사", "Untitled study");
  async function handleLogout() {
    await authLogout();
    router.push("/");
  }
  const [sideMenu, setSideMenu] = useState<SideMenu>("analysis");
  const [analysisTab, setAnalysisTab] = useState<AnalysisTab>("home");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  // 상세보고서 열람 권한 (결제·쿠폰·무료권한) — 히스토리 '결과 보기' 라우팅 + 쿠폰 표기에 사용
  const [reportAccess, setReportAccess] = useState<ReportAccess | undefined>(undefined);

  useEffect(() => {
    // 무료 쿠폰 링크로 들어와 보관된 토큰이 있으면 먼저 계정에 귀속시킨다.
    // (쿠폰 링크 → 가입 → 대시보드 경로에서는 /design 을 거치지 않아 리딤될 기회가 없었다.)
    let cancelled = false;
    redeemPendingReportToken()
      .catch(() => false)
      .then(() => getReportAccessJobs())
      .then((v) => { if (!cancelled) setReportAccess(v); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getMyDesigns();
        if (cancelled) return;
        const mapped: HistoryItem[] = (res.designs ?? []).map((d) => ({
          id: String(d.id),
          job_id: d.job_id ?? null,
          title: (d.definition ?? "")
            .replace(/^\[거래방식\][^\n]*\n*/m, "")
            .replace(/^\[산업 분류\][^\n]*\n*/m, "")
            .replace(/^\n+/, "")
            .slice(0, 40), // 빈 제목은 렌더 시 titleText() 가 언어별 기본 제목으로 채운다
          sido: d.sido ?? "-",
          sample_size: d.sample_size ?? 0,
          status: mapStatus(d.status),
          created_at: d.created_at,
        }));
        setHistory(mapped);
      } catch (err) {
        if (!cancelled) setHistoryError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ─── 임시저장 ───────────────────────────── */
  const [drafts, setDrafts] = useState<SurveyDraft[]>([]);
  const [draftsLoading, setDraftsLoading] = useState(true);
  const [draftsError, setDraftsError] = useState<string | null>(null);

  async function refreshDrafts() {
    setDraftsLoading(true);
    setDraftsError(null);
    try {
      const res = await listDrafts();
      setDrafts(res.drafts ?? []);
    } catch (err) {
      setDraftsError(err instanceof Error ? err.message : String(err));
    } finally {
      setDraftsLoading(false);
    }
  }

  useEffect(() => {
    refreshDrafts();
  }, []);

  async function handleDeleteDraft(id: number) {
    if (!confirm(t("이 임시저장을 삭제할까요?", "Delete this draft?"))) return;
    try {
      await deleteDraft(id);
      setDrafts((d) => d.filter((x) => x.id !== id));
    } catch (err) {
      alert(t("삭제 실패: ", "Delete failed: ") + (err instanceof Error ? err.message : String(err)));
    }
  }

  const [deletingId, setDeletingId] = useState<string | null>(null);
  async function handleDeleteHistory(id: string, title: string) {
    const shown = titleText(title);
    if (
      !confirm(
        t(
          `"${shown}" 분석 기록을 삭제할까요?\n삭제하면 결과·보고서도 함께 사라지며 되돌릴 수 없습니다.`,
          `Delete the analysis "${shown}"?\nIts results and reports will be deleted too. This can't be undone.`,
        ),
      )
    )
      return;
    setDeletingId(id);
    try {
      await deleteMyDesign(Number(id));
      setHistory((h) => h.filter((x) => x.id !== id));
    } catch (err) {
      alert(t("삭제 실패: ", "Delete failed: ") + (err instanceof Error ? err.message : String(err)));
    } finally {
      setDeletingId(null);
    }
  }

  /* ─── 계정 관리 ───────────────────────────── */
  const [profile, setProfile] = useState<AuthUser | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({
    first_name: "",
    last_name: "",
    gender: "",
    age: "", // 입력 컨트롤용 문자열, 저장 시 정수 변환
    organization: "",
    position: "",
    phone: "",
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await authGetProfile();
        if (cancelled) return;
        setProfile(p);
        setProfileForm({
          first_name: p.first_name ?? "",
          last_name: p.last_name ?? "",
          gender: p.gender ?? "",
          age: p.age != null ? String(p.age) : "",
          organization: p.organization ?? "",
          position: p.position ?? "",
          phone: p.phone ?? "",
        });
      } catch (err) {
        if (!cancelled) setProfileError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function handleProfileSave() {
    setProfileSaving(true);
    setProfileError(null);
    try {
      // age는 비어있으면 null, 아니면 정수 변환 (백엔드가 0~120 검증)
      let ageVal: number | null = null;
      if (profileForm.age.trim() !== "") {
        const n = parseInt(profileForm.age, 10);
        if (Number.isNaN(n)) throw new Error(t("연령은 숫자여야 합니다.", "Age must be a number."));
        ageVal = n;
      }
      const updated = await authUpdateProfile({
        first_name: profileForm.first_name,
        last_name: profileForm.last_name,
        gender: profileForm.gender,
        age: ageVal,
        organization: profileForm.organization,
        position: profileForm.position,
        phone: profileForm.phone,
      });
      setProfile(updated);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : String(err));
    } finally {
      setProfileSaving(false);
    }
  }

  const [pwForm, setPwForm] = useState({ old_password: "", new_password1: "", new_password2: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMessage, setPwMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPwSaving(true);
    setPwMessage(null);
    try {
      if (pwForm.new_password1 !== pwForm.new_password2) {
        throw new Error(t("새 비밀번호가 일치하지 않습니다.", "The new passwords don't match."));
      }
      if (pwForm.new_password1.length < 8) {
        throw new Error(t("새 비밀번호는 8자 이상이어야 합니다.", "Your new password must be at least 8 characters."));
      }
      await authChangePassword(pwForm);
      setPwMessage({ ok: true, text: t("비밀번호가 변경되었습니다.", "Your password has been changed.") });
      setPwForm({ old_password: "", new_password1: "", new_password2: "" });
    } catch (err) {
      setPwMessage({ ok: false, text: err instanceof Error ? err.message : String(err) });
    } finally {
      setPwSaving(false);
    }
  }

  /* 배지에 쓸 '아직 쓸 수 있는 쿠폰' 장수 — 만료·사용완료 쿠폰은 세지 않는다. */
  const usableCoupons = (reportAccess?.coupons ?? []).filter((c) => c.available && !c.expired).length
    + (reportAccess?.free_once?.available ? 1 : 0);
  /* 쿠폰 탭 노출 여부 — 사용 완료·만료 쿠폰도 이력으로 보여주므로 '한 장이라도 있으면' 기준. */
  const hasCoupons = (reportAccess?.coupons?.length ?? 0) > 0
    || Boolean(reportAccess?.free_email) || Boolean(reportAccess?.free_once);

  /* 30일권 상태 — 배지·남은 기간·결제 버튼 노출에 사용. 자동갱신 없음(선불 이용권) */
  const [sub, setSub] = useState<Subscription | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  // 결제 연동 준비 안내 (토스 라이브 키 발급 전 — 일반 사용자는 결제창 대신 이 안내)
  const [paymentPendingOpen, setPaymentPendingOpen] = useState(false);
  useEffect(() => {
    let cancelled = false;
    getMySubscription().then((v) => { if (!cancelled) setSub(v); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* 상단 바 */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-sm">
        <div className="px-4 md:px-6 h-14 md:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-4 min-w-0">
            <span className="flex-shrink-0"><Image src="/Socialtwin_o2.png" alt="Socialtwin" width={120} height={34} className="h-7 md:h-8 w-auto object-contain select-none" /></span>
            <div className="hidden md:block h-5 w-px bg-slate-200" />
            <div className="hidden md:flex items-center gap-1.5">
              <User size={14} className="text-slate-500" />
              <span className="text-sm font-semibold text-slate-800">{t("내 대시보드", "My dashboard")}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            <Link href="/dashboard/user" className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-all">
              <LayoutDashboard size={14} />
              {t("대시보드", "Dashboard")}
            </Link>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all" aria-label={t("로그아웃", "Log out")}>
              <LogOut size={14} />
              {t("로그아웃", "Log out")}
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
        {/* ─── 사이드바 (모바일에서는 상단 가로 네비) ── */}
        <aside className="w-full md:w-56 bg-white border-b md:border-b-0 md:border-r border-slate-100 flex flex-col py-2 md:py-4 px-2 md:px-3 flex-shrink-0">
          <p className="hidden md:block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">{t("메뉴", "Menu")}</p>
          <nav className="flex md:flex-col gap-1">
            {/* 입국자 대시보드 — 임시 숨김 */}
            <button onClick={() => setSideMenu("analysis")}
              className={`flex-1 md:flex-initial flex items-center justify-center md:justify-start gap-1.5 md:gap-2.5 px-2 md:px-3 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-medium transition-all ${sideMenu === "analysis" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>
              <BarChart2 size={15} className={sideMenu === "analysis" ? "text-indigo-600" : "text-slate-400"} />
              <span className="md:hidden">{t("분석", "Analysis")}</span>
              <span className="hidden md:inline">{t("분석 대시보드", "Analysis dashboard")}</span>
              {sideMenu !== "analysis" && <ChevronRight size={12} className="hidden md:block ml-auto text-slate-300" />}
            </button>
            <button onClick={() => setSideMenu("account")}
              className={`flex-1 md:flex-initial flex items-center justify-center md:justify-start gap-1.5 md:gap-2.5 px-2 md:px-3 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-medium transition-all ${sideMenu === "account" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>
              <UserCog size={15} className={sideMenu === "account" ? "text-indigo-600" : "text-slate-400"} />
              <span className="md:hidden">{t("계정", "Account")}</span>
              <span className="hidden md:inline">{t("계정 관리", "Account settings")}</span>
              {sideMenu !== "account" && <ChevronRight size={12} className="hidden md:block ml-auto text-slate-300" />}
            </button>
          </nav>
          <div className="hidden md:block mt-auto px-3">
            <div className="bg-indigo-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-indigo-800 mb-1">{t("빠른 이동", "Quick links")}</p>
              <Link href="/design" className="flex items-center gap-1.5 text-xs text-indigo-600 hover:underline">
                <Sparkles size={10} /> {t("새 시장성 분석", "New market analysis")}
              </Link>
            </div>
          </div>
        </aside>

        {/* ─── 메인 콘텐츠 ── */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">

          {/* ══ 입국자 대시보드 ══ */}
          {sideMenu === "entrant" && (
            <div className="max-w-2xl mx-auto flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-6">
                <Construction size={36} className="text-slate-300" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">{t("입국자 대시보드", "Inbound traveler dashboard")}</h2>
              <p className="text-sm text-slate-500 mb-1">{t("현재 개발 중입니다.", "Currently in development.")}</p>
              <p className="text-xs text-slate-400">{t("국내 입국자 데이터 기반 시장 분석 기능이 추후 제공될 예정입니다.", "Market analysis based on inbound traveler data for Korea is coming soon.")}</p>
              <div className="mt-8 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-5 py-3">
                <Clock size={14} className="text-slate-400" />
                <span className="text-sm text-slate-500">Coming Soon</span>
              </div>
            </div>
          )}

          {/* ══ 분석 대시보드 ══ */}
          {sideMenu === "analysis" && (
            <div className="max-w-3xl mx-auto">
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <h1 className="text-xl font-bold text-slate-900">{t("분석 대시보드", "Analysis dashboard")}</h1>
                {/* 무료 쿠폰 배지 — 쓸 수 있는 쿠폰이 남아 있을 때만 노출 */}
                {usableCoupons > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                    <Ticket size={12} />{" "}
                    {t(`무료 쿠폰 ${usableCoupons}장`, `${usableCoupons} free coupon${usableCoupons === 1 ? "" : "s"}`)}
                  </span>
                )}
                {/* 30일권 배지 — 이용권이 살아 있을 때만 노출 */}
                {sub?.active && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                    <Repeat size={12} /> {t("30일권 이용 중", "30-day pass active")}
                    <span className="font-semibold text-indigo-500">
                      · {t(`${sub.days_left}일 남음`, `${sub.days_left} day${sub.days_left === 1 ? "" : "s"} left`)}
                    </span>
                  </span>
                )}
              </div>

              {/* 탭: 새 분석 | 히스토리 | 설정 — 모바일 가로 스크롤 + 라벨 축약 */}
              <div className="-mx-4 md:mx-0 px-4 md:px-0 mb-8 overflow-x-auto scrollbar-hide">
                <div className="inline-flex gap-1 bg-white border border-slate-100 rounded-xl p-1 shadow-sm whitespace-nowrap">
                  {/* 새 분석 시작 */}
                  <button onClick={() => setAnalysisTab("home")}
                    className={`flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all flex-shrink-0 ${analysisTab === "home" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"}`}>
                    <Sparkles size={14} /> {t("새 분석", "New analysis")}
                  </button>
                  {/* 히스토리 */}
                  <button onClick={() => setAnalysisTab("history")}
                    className={`flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all flex-shrink-0 ${analysisTab === "history" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"}`}>
                    <History size={14} />
                    <span className="sm:hidden">{t("히스토리", "History")}</span>
                    <span className="hidden sm:inline">{t("내 분석 히스토리", "My analysis history")}</span>
                    {history.length > 0 && (
                      <span className={`ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${analysisTab === "history" ? "bg-white/20 text-white" : "bg-indigo-100 text-indigo-700"}`}>{history.length}</span>
                    )}
                  </button>
                  {/* 임시저장 */}
                  <button onClick={() => setAnalysisTab("drafts")}
                    className={`flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all flex-shrink-0 ${analysisTab === "drafts" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"}`}>
                    <FileEdit size={14} /> {t("임시저장", "Drafts")}
                    {drafts.length > 0 && (
                      <span className={`ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${analysisTab === "drafts" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-700"}`}>{drafts.length}</span>
                    )}
                  </button>
                  {/* 30일권 */}
                  <button onClick={() => setAnalysisTab("subscription")}
                    className={`flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all flex-shrink-0 ${analysisTab === "subscription" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"}`}>
                    <Repeat size={14} /> {t("30일권", "30-day pass")}
                    {sub?.active && (
                      <span className={`ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${analysisTab === "subscription" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-700"}`}>
                        {t("이용중", "Active")}
                      </span>
                    )}
                  </button>
                  {/* 내 무료 쿠폰 — 쿠폰(또는 무료 제공 계정 권한)이 있을 때만 노출 */}
                  {hasCoupons && (
                    <button onClick={() => setAnalysisTab("coupons")}
                      className={`flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all flex-shrink-0 ${analysisTab === "coupons" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"}`}>
                      <Ticket size={14} /> {t("내 무료 쿠폰", "My free coupons")}
                      {usableCoupons > 0 && (
                        <span className={`ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${analysisTab === "coupons" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-700"}`}>
                          {usableCoupons}
                        </span>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* ── 새 분석 탭 ── */}
              {analysisTab === "home" && (
                <div className="space-y-6">
                  {/* 히어로 CTA */}
                  <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 rounded-3xl p-6 md:p-10 overflow-hidden">
                    {/* 배경 장식 */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-8 w-40 h-40 bg-white/5 rounded-full translate-y-1/2" />
                    <div className="relative">
                      <div className="inline-flex items-center gap-2 bg-white/15 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-4 md:mb-5">
                        <Zap size={11} /> {t("AI 기반 고객조사", "AI-powered customer research")}
                      </div>
                      <h2 className="text-xl md:text-2xl font-bold text-white mb-3 leading-snug break-keep">
                        {t("가상인구로 시장의 반응을 미리 검증하세요", "Test the market's reaction in advance with a virtual population")}
                      </h2>
                      <p className="text-indigo-200 text-sm mb-6 md:mb-8 leading-relaxed break-keep">
                        {t(
                          "제품·서비스 정의와 조사 니즈를 입력하면 AI가 가설을 세우고 가상의 소비자 패널로 설문 결과를 즉시 생성합니다.",
                          "Describe your product or service and what you want to learn — AI builds hypotheses and instantly generates survey results from a virtual consumer panel.",
                        )}
                      </p>
                      <Link
                        href="/design"
                        className="inline-flex items-center gap-2 md:gap-2.5 bg-white text-indigo-700 font-bold text-sm px-5 md:px-7 py-3 md:py-3.5 rounded-2xl hover:bg-indigo-50 transition-all shadow-lg shadow-indigo-900/30 hover:shadow-xl hover:shadow-indigo-900/40 hover:-translate-y-0.5"
                      >
                        <Sparkles size={16} />
                        {t("새 분석 시작하기", "Start a new analysis")}
                        <ArrowRight size={15} />
                      </Link>
                    </div>
                  </div>

                  {/* 분석 절차 안내 — 랜딩페이지와 동일한 4단계 */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 md:p-6">
                    <h3 className="text-sm font-semibold text-slate-800 mb-4 md:mb-5">{t("분석 진행 순서", "How it works")}</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                      {[
                        {
                          step: "01",
                          icon: MessageSquare,
                          title: t("정의 · 니즈 입력", "Describe your idea & needs"),
                          desc: t(
                            "제품·서비스와 알고 싶은 인사이트를 한 문장으로 입력합니다.",
                            "Describe your product or service and the insight you want in one sentence.",
                          ),
                          iconColor: "text-indigo-500",
                          bg: "bg-indigo-50",
                          numColor: "text-indigo-400",
                        },
                        {
                          step: "02",
                          icon: Sparkles,
                          title: t("AI 가설·문항 설계", "AI designs hypotheses & questions"),
                          desc: t(
                            "조사 가설을 도출하고 설문 문항을 자동 생성합니다.",
                            "Derives research hypotheses and generates survey questions automatically.",
                          ),
                          iconColor: "text-violet-500",
                          bg: "bg-violet-50",
                          numColor: "text-violet-400",
                        },
                        {
                          step: "03",
                          icon: Users,
                          title: t("가상인구 매칭 · 실행", "Match & run the virtual population"),
                          desc: t(
                            "KOSIS 가상인구 중 타겟을 매칭해 응답 시뮬레이션을 실행합니다.",
                            "Matches your target from a KOSIS-based virtual population and simulates their responses.",
                          ),
                          iconColor: "text-sky-500",
                          bg: "bg-sky-50",
                          numColor: "text-sky-400",
                        },
                        {
                          step: "04",
                          icon: BarChart2,
                          title: t("대시보드 · 보고서", "Dashboard & report"),
                          desc: t(
                            "교차분석 차트와 PDF 보고서로 결과를 1시간 안에 확인합니다.",
                            "Review results within an hour with cross-tab charts and a PDF report.",
                          ),
                          iconColor: "text-emerald-500",
                          bg: "bg-emerald-50",
                          numColor: "text-emerald-400",
                        },
                      ].map(({ step, icon: Icon, title, desc, iconColor, bg, numColor }) => (
                        <div key={step} className="flex flex-col items-start gap-3 p-4 rounded-xl bg-slate-50">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-black tracking-widest ${numColor}`}>{step}</span>
                            <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center`}>
                              <Icon size={13} className={iconColor} />
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-800 mb-1 break-keep">{title}</p>
                            <p className="text-[11px] text-slate-500 leading-relaxed break-keep">{desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 최근 분석 미리보기 */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                        <History size={14} className="text-slate-400" /> {t("최근 분석", "Recent analyses")}
                      </h3>
                      <button onClick={() => setAnalysisTab("history")} className="text-xs text-indigo-600 flex items-center gap-0.5 hover:underline">
                        {t("전체 보기", "View all")} <ChevronRight size={12} />
                      </button>
                    </div>
                    {history.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <History size={24} className="text-slate-200 mb-2" />
                        <p className="text-xs text-slate-400">{t("아직 분석 내역이 없습니다.", "No analyses yet.")}</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-50">
                        {history.slice(0, 3).map(item => (
                          <Link
                            key={item.id}
                            href={historyHref(item)}
                            className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors group"
                          >
                            <div className="min-w-0">
                              <p className="text-sm text-slate-800 font-medium truncate group-hover:text-indigo-700">{titleText(item.title)}</p>
                              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                                <span className="flex items-center gap-1"><MapPin size={9} />{L(item.sido)}</span>
                                <span className="flex items-center gap-1"><Users size={9} />{t(`${item.sample_size}명`, `${item.sample_size} respondents`)}</span>
                              </p>
                            </div>
                            <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                              <StatusBadge status={item.status} />
                              <ChevronRight size={12} className="text-slate-300 group-hover:text-indigo-500" />
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── 히스토리 탭 ── */}
              {analysisTab === "history" && (
                <div>
                  {/* 데이터 보관 정책 안내 */}
                  <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
                    <Info size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-relaxed text-amber-800">
                      {t(
                        <>
                          <span className="font-semibold">분석 결과는 완료일로부터 1년간 보관</span>되며, 이후 자동으로 삭제됩니다.
                          필요한 분석 결과나 원자료(CSV)는 보관기간 내에 미리 다운로드해 주세요.
                        </>,
                        <>
                          <span className="font-semibold">Analysis results are kept for 1 year from completion</span> and then
                          deleted automatically. Please download any results or raw data (CSV) you need before then.
                        </>,
                      )}
                    </p>
                  </div>
                  {history.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                          <History size={28} className="text-slate-300" />
                        </div>
                        <h3 className="text-sm font-semibold text-slate-800 mb-1">{t("아직 분석 내역이 없습니다", "No analyses yet")}</h3>
                        <p className="text-xs text-slate-400 mb-6">{t("첫 번째 시장성 분석을 시작해 보세요.", "Start your first market analysis.")}</p>
                        <button onClick={() => setAnalysisTab("home")}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-all">
                          <Sparkles size={14} /> {t("새 분석 시작", "Start a new analysis")}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {history.map(item => {
                        const href = historyHref(item, reportAccess);
                        const ctaLabel = href.startsWith("/results/") && item.status === "done"
                          ? t("상세보고서 보기", "View detailed report")
                          : item.job_id && item.status === "done"
                            ? t("결과 보기", "View results")
                            : item.job_id && item.status === "running"
                              ? t("진행 보기", "View progress")
                              : t("이어서 작성", "Continue editing");
                        return (
                          <div key={item.id} className="relative group">
                            {/* 삭제 — Link 위에 겹쳐 배치(중첩 클릭 방지) */}
                            <button
                              type="button"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteHistory(item.id, item.title); }}
                              disabled={deletingId === item.id}
                              title={t("분석 기록 삭제", "Delete analysis")}
                              aria-label={t("분석 기록 삭제", "Delete analysis")}
                              className="absolute top-3 right-3 z-10 w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                            >
                              {deletingId === item.id
                                ? <RefreshCw size={13} className="animate-spin" />
                                : <Trash2 size={13} />}
                            </button>
                          <Link
                            href={href}
                            className="block bg-white rounded-2xl border border-slate-100 shadow-sm p-4 pr-12 hover:border-indigo-300 hover:shadow-md transition-all"
                          >
                            <div className="flex items-start justify-between">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-indigo-700">{titleText(item.title)}</p>
                                <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                                  <span className="flex items-center gap-1"><MapPin size={10} />{L(item.sido)}</span>
                                  <span className="flex items-center gap-1"><Users size={10} />{t(`${item.sample_size}명`, `${item.sample_size} respondents`)}</span>
                                  <span className="flex items-center gap-1"><Clock size={10} />{fmtAgo(item.created_at, lang)}</span>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2 ml-4 flex-shrink-0">
                                <StatusBadge status={item.status} />
                                <span className="text-xs text-indigo-600 font-medium flex items-center gap-0.5 group-hover:underline">
                                  {ctaLabel} <ChevronRight size={10} />
                                </span>
                              </div>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2">{fmtDate(item.created_at, lang)}</p>
                          </Link>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── 임시저장 탭 ── */}
              {analysisTab === "drafts" && (
                <div>
                  {draftsLoading ? (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-16 flex items-center justify-center gap-2 text-sm text-slate-400">
                      <RefreshCw size={14} className="animate-spin" /> {t("불러오는 중…", "Loading…")}
                    </div>
                  ) : draftsError ? (
                    <div className="bg-white rounded-2xl border border-rose-100 shadow-sm py-12 flex flex-col items-center justify-center gap-2 text-sm text-rose-600">
                      <AlertCircle size={20} />
                      <p>{draftsError}</p>
                      <button onClick={refreshDrafts} className="mt-2 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-semibold hover:bg-rose-100">{t("다시 시도", "Try again")}</button>
                    </div>
                  ) : drafts.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-16 flex flex-col items-center justify-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                        <FileEdit size={22} className="text-slate-300" />
                      </div>
                      <p className="text-sm text-slate-500">{t("임시저장한 분석이 없습니다.", "No saved drafts.")}</p>
                      <Link href="/design" className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-colors">
                        <Sparkles size={14} /> {t("새 분석 시작", "Start a new analysis")}
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {drafts.map((d) => {
                        const stepLabel: Record<string, string> = t(
                          {
                            input: "정의·니즈 입력",
                            hyp_review: "가설 검토",
                            survey_review: "문항 검토",
                            result: "결과",
                          },
                          {
                            input: "Idea & needs",
                            hyp_review: "Reviewing hypotheses",
                            survey_review: "Reviewing questions",
                            result: "Results",
                          },
                        );
                        return (
                          <div key={d.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:border-slate-200 transition-colors flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                              <FileEdit size={16} className="text-amber-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">{stepLabel[d.step] ?? d.step}</span>
                                <span className="text-[10px] text-slate-400">{fmtAgo(d.updated_at, lang)}</span>
                              </div>
                              <h4 className="text-sm font-semibold text-slate-900 truncate">{d.title || t("(제목 없음)", "(Untitled)")}</h4>
                              <p className="text-[11px] text-slate-500 mt-0.5">{fmtDate(d.updated_at, lang)}</p>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <Link
                                href={`/design?draft=${d.id}`}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition-colors"
                              >
                                {t("이어쓰기", "Continue")} <ArrowRight size={12} />
                              </Link>
                              <button
                                onClick={() => handleDeleteDraft(d.id)}
                                className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title={t("삭제", "Delete")}
                                aria-label={t("삭제", "Delete")}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── 내 무료 쿠폰 탭 ── */}
              {analysisTab === "coupons" && (
                <div className="space-y-5">
                  <CouponCard
                    coupons={reportAccess?.coupons ?? []}
                    freeEmail={Boolean(reportAccess?.free_email)}
                    freeOnce={reportAccess?.free_once ?? null}
                    history={history}
                  />
                </div>
              )}

              {/* ── 30일권 탭 ── */}
              {analysisTab === "subscription" && (
                <div className="space-y-5">
                  {/* 현재 상태 카드 */}
                  <div className={`rounded-2xl border p-6 ${sub?.active ? "border-indigo-200 bg-indigo-50/60" : "border-slate-100 bg-white shadow-sm"}`}>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${sub?.active ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"}`}>
                            <Repeat size={16} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">
                              {sub?.active
                                ? t("30일권 이용 중", "30-day pass active")
                                : t("30일권 미이용", "No active 30-day pass")}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {sub?.active
                                ? t(
                                    "가상인구 100명 규모 조사를 무제한으로 이용하고 계십니다.",
                                    "You can run unlimited studies with 100 virtual respondents.",
                                  )
                                : t(
                                    "30일권을 구매하시면 30일 동안 가상인구 100명 규모 조사를 무제한으로 이용하실 수 있습니다.",
                                    "Buy a 30-day pass to run unlimited studies with 100 virtual respondents for 30 days.",
                                  )}
                            </p>
                          </div>
                        </div>
                      </div>
                      {sub?.active && (
                        <div className="text-right shrink-0">
                          <p className="text-2xl font-extrabold text-indigo-700 tabular-nums leading-none">
                            {sub.days_left}
                            <span className="text-sm font-bold ml-0.5">
                              {t("일", sub.days_left === 1 ? " day" : " days")}
                            </span>
                          </p>
                          <p className="text-[11px] text-slate-500 mt-1">{t("남은 이용 기간", "Time remaining")}</p>
                        </div>
                      )}
                    </div>

                    {sub?.active && (
                      <dl className="mt-5 grid sm:grid-cols-2 gap-x-6 gap-y-2.5 text-sm border-t border-indigo-100 pt-4">
                        <div className="flex justify-between gap-3">
                          <dt className="text-slate-500">{t("이용 시작", "Start date")}</dt>
                          <dd className="font-medium text-slate-800">{fmtDay(sub.started_at, lang)}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-slate-500">{t("이용 종료(만료일)", "End (expiration) date")}</dt>
                          <dd className="font-medium text-slate-800">{fmtDay(sub.expires_at, lang)}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-slate-500">{t("조사당 가상인구", "Virtual respondents per study")}</dt>
                          <dd className="font-medium text-slate-800">{t(`${sub.sample_size}명`, `${sub.sample_size}`)}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-slate-500">{t("조사 횟수", "Number of studies")}</dt>
                          <dd className="font-medium text-slate-800">{t("기간 내 무제한", "Unlimited during your pass")}</dd>
                        </div>
                        <div className="flex justify-between gap-3 sm:col-span-2">
                          <dt className="text-slate-500">{t("자동갱신", "Auto-renewal")}</dt>
                          <dd className="font-semibold text-slate-800">
                            {t("없음 — 만료일에 자동 종료됩니다", "None — ends automatically on the expiration date")}
                          </dd>
                        </div>
                      </dl>
                    )}
                  </div>

                  {/* 요금제 설명 */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{t("30일권", "30-day pass")}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {t(
                            "결제일 기준 30일 동안, 횟수 제한 없이 조사하세요. 자동갱신 없는 선불 이용권입니다.",
                            "Run unlimited studies for 30 days from your payment date. A prepaid pass with no auto-renewal.",
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-extrabold text-slate-900 tabular-nums leading-none">
                          {t("500,000", "₩500,000")}
                          <span className="text-sm font-bold text-slate-400 ml-0.5">{t("원 / 30일", " / 30 days")}</span>
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">{t("부가세 포함", "VAT incl.")}</p>
                      </div>
                    </div>

                    <ul className="mt-5 grid sm:grid-cols-2 gap-x-6 gap-y-2.5">
                      {t(
                        [
                          "가상인구 100명 규모 조사 무제한",
                          "조사 건수 제한 없음 — 몇 번이든 반복 검증",
                          "상세보고서(30p 내외 PDF) 무제한 열람",
                          "설문에 응답한 가상인구와 심층 인터뷰",
                          "원본자료(Excel) 제공",
                          "결제일 기준 30일 이용 — 자동갱신 없음",
                        ],
                        [
                          "Unlimited studies with 100 virtual respondents",
                          "No cap on the number of studies — iterate as often as you like",
                          "Unlimited access to detailed reports (~30-page PDF)",
                          "In-depth interviews with the virtual respondents who took your survey",
                          "Raw data (Excel)",
                          "Valid for 30 days from payment — no auto-renewal",
                        ],
                      ).map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm text-slate-600 leading-snug break-keep">
                          <CheckCircle2 size={15} className="flex-shrink-0 mt-0.5 text-emerald-500" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>

                    {/* 결제 조건 고지 — 결제 버튼 바로 위에 노출한다 (자동갱신 여부·만료 처리·환불) */}
                    <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                        <AlertCircle size={13} strokeWidth={2.5} /> {t("결제 전 확인해 주세요", "Please review before you pay")}
                      </div>
                      <ul className="mt-2 space-y-1.5 text-[12px] leading-relaxed text-amber-900/90 break-keep">
                        {t(
                          <>
                            <li>· <strong>결제 금액</strong> — 500,000원 (부가세 포함), 1회 결제.</li>
                            <li>· <strong>이용 기간</strong> — 결제 승인 시점부터 30일. 만료일은 결제 후 이 화면에 표시됩니다.</li>
                            <li>· <strong>자동갱신 없음</strong> — 카드 정보를 저장해 두었다가 자동으로 재결제하는 정기결제 상품이 아닙니다. 30일이 지나면 이용이 자동으로 종료되며 추가 청구가 발생하지 않습니다.</li>
                            <li>· <strong>해지 방법</strong> — 자동결제가 없으므로 별도의 해지 신청이 필요 없습니다. 계속 이용하시려면 만료 후 이 화면에서 다시 결제해 주세요.</li>
                            <li>· <strong>중도 환불</strong> — 결제일로부터 7일 이내 미이용 시 전액 환불, 그 외에는 잔여기간에 비례해 환불합니다. 자세한 기준은{" "}
                              <a href="/refund" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 font-semibold">결제·환불 정책</a>을 확인해 주세요.
                            </li>
                          </>,
                          <>
                            <li>· <strong>Amount</strong> — ₩500,000 (VAT incl.), one-time payment.</li>
                            <li>· <strong>Period</strong> — 30 days from payment approval. Your expiration date appears on this screen after payment.</li>
                            <li>· <strong>No auto-renewal</strong> — This is not a recurring plan that stores your card and charges it again. Access ends automatically after 30 days, with no further charges.</li>
                            <li>· <strong>Cancellation</strong> — There&apos;s no auto-billing, so there&apos;s nothing to cancel. To keep using the service, purchase again from this screen after your pass expires.</li>
                            <li>· <strong>Refunds</strong> — Full refund if unused within 7 days of payment; otherwise, a prorated refund for the remaining period. See our{" "}
                              <a href="/refund" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 font-semibold">Payment &amp; Refund Policy</a> for details.
                            </li>
                          </>,
                        )}
                      </ul>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => {
                          if (canOpenCheckout()) setCheckoutOpen(true);
                          else setPaymentPendingOpen(true);
                        }}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-500 transition-all hover:shadow-lg hover:shadow-indigo-200"
                      >
                        <CreditCard size={15} />
                        {sub?.active
                          ? t("30일 연장 결제하기", "Buy another 30 days")
                          : t("30일권 결제하기", "Buy the 30-day pass")}
                      </button>
                      <a href="/pricing" target="_blank" rel="noopener noreferrer" className="text-xs text-slate-500 hover:text-slate-800 underline underline-offset-2">
                        {t("전체 요금제 보기", "View all plans")}
                      </a>
                    </div>

                    {sub?.active && (
                      <p className="mt-3 flex items-start gap-1.5 text-[11px] text-slate-400 leading-relaxed">
                        <CalendarClock size={13} className="mt-px flex-shrink-0" />
                        {t(
                          "지금 결제하시면 남은 기간에 더해지는 것이 아니라, 결제한 시점부터 30일이 새로 시작됩니다.",
                          "If you pay now, a new 30-day period starts from the payment date — it isn't added to your remaining time.",
                        )}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ 계정 관리 ══ */}
          {sideMenu === "account" && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="mb-2">
                <h1 className="text-xl font-bold text-slate-900">{t("계정 관리", "Account settings")}</h1>
                <p className="text-xs text-slate-500 mt-1">{t("프로필 정보와 비밀번호를 관리합니다.", "Manage your profile and password.")}</p>
              </div>

              {/* ── 프로필 카드 ── */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                  <User size={16} className="text-indigo-500" />
                  <h2 className="text-sm font-bold text-slate-800">{t("프로필 정보", "Profile")}</h2>
                </div>

                {profileLoading ? (
                  <div className="px-6 py-12 flex items-center justify-center text-sm text-slate-400 gap-2">
                    <RefreshCw size={14} className="animate-spin" />
                    {t("불러오는 중…", "Loading…")}
                  </div>
                ) : !profile ? (
                  <div className="px-6 py-10 text-center text-sm text-rose-600 flex items-center justify-center gap-2">
                    <AlertCircle size={14} />
                    {profileError ?? t("프로필을 불러오지 못했습니다.", "Couldn't load your profile.")}
                  </div>
                ) : (
                  <div className="px-6 py-5 space-y-4">
                    {/* 이메일 (읽기 전용) */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t("이메일", "Email")}</label>
                      <div className="relative">
                        <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="email"
                          value={profile.email}
                          readOnly
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-500 cursor-not-allowed"
                        />
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400">{t("이메일은 변경할 수 없습니다.", "Your email can't be changed.")}</p>
                    </div>

                    {/* 이름 */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t("성", "Last name")}</label>
                        <input
                          type="text"
                          value={profileForm.last_name}
                          onChange={(e) => setProfileForm((p) => ({ ...p, last_name: e.target.value }))}
                          placeholder={t("홍", "Doe")}
                          maxLength={150}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t("이름", "First name")}</label>
                        <input
                          type="text"
                          value={profileForm.first_name}
                          onChange={(e) => setProfileForm((p) => ({ ...p, first_name: e.target.value }))}
                          placeholder={t("길동", "Jane")}
                          maxLength={150}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all"
                        />
                      </div>
                    </div>

                    {/* 성별 + 연령 — 모바일은 세로, sm+ 가로 */}
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t("성별", "Gender")}</label>
                        <div className="flex gap-1.5">
                          {[
                            { value: "M", label: t("남", "Male") },
                            { value: "F", label: t("여", "Female") },
                            { value: "O", label: t("기타", "Other") },
                            { value: "", label: t("미선택", "Not set") },
                          ].map((opt) => (
                            <button
                              key={opt.value || "none"}
                              type="button"
                              onClick={() => setProfileForm((p) => ({ ...p, gender: opt.value }))}
                              className={`flex-1 py-2 rounded-xl border text-xs sm:text-sm font-medium transition-all ${
                                profileForm.gender === opt.value
                                  ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t("연령", "Age")}</label>
                        <input
                          type="number"
                          min={0}
                          max={120}
                          value={profileForm.age}
                          onChange={(e) => setProfileForm((p) => ({ ...p, age: e.target.value }))}
                          placeholder={t("예: 35", "e.g. 35")}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all"
                        />
                      </div>
                    </div>

                    {/* 소속 + 직급 — 모바일은 세로, sm+ 가로 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t("소속", "Organization")}</label>
                        <input
                          type="text"
                          value={profileForm.organization}
                          onChange={(e) => setProfileForm((p) => ({ ...p, organization: e.target.value }))}
                          placeholder={t("회사·기관·학교", "Company, institution, or school")}
                          maxLength={120}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t("직급", "Job title")}</label>
                        <input
                          type="text"
                          value={profileForm.position}
                          onChange={(e) => setProfileForm((p) => ({ ...p, position: e.target.value }))}
                          placeholder={t("예: 매니저", "e.g. Manager")}
                          maxLength={80}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all"
                        />
                      </div>
                    </div>

                    {/* 연락처 */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t("연락처", "Phone")}</label>
                      <input
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
                        placeholder="010-1234-5678"
                        maxLength={32}
                        autoComplete="tel"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all"
                      />
                    </div>

                    {profileError && (
                      <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                        <AlertCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-red-700">{profileError}</p>
                      </div>
                    )}

                    <button
                      onClick={handleProfileSave}
                      disabled={profileSaving}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-500 transition-all disabled:opacity-60"
                    >
                      {profileSaving ? (
                        <RefreshCw size={14} className="animate-spin" />
                      ) : profileSaved ? (
                        <>
                          <CheckCircle2 size={14} /> {t("저장됨", "Saved")}
                        </>
                      ) : (
                        <>
                          <Save size={14} /> {t("프로필 저장", "Save profile")}
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* ── 비밀번호 변경 카드 ── */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                  <Lock size={16} className="text-indigo-500" />
                  <h2 className="text-sm font-bold text-slate-800">{t("비밀번호 변경", "Change password")}</h2>
                </div>
                <form onSubmit={handlePasswordChange} className="px-6 py-5 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t("현재 비밀번호", "Current password")}</label>
                    <input
                      type="password"
                      required
                      value={pwForm.old_password}
                      onChange={(e) => setPwForm((p) => ({ ...p, old_password: e.target.value }))}
                      autoComplete="current-password"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t("새 비밀번호", "New password")}</label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={pwForm.new_password1}
                      onChange={(e) => setPwForm((p) => ({ ...p, new_password1: e.target.value }))}
                      autoComplete="new-password"
                      placeholder={t("8자 이상", "At least 8 characters")}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t("새 비밀번호 확인", "Confirm new password")}</label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={pwForm.new_password2}
                      onChange={(e) => setPwForm((p) => ({ ...p, new_password2: e.target.value }))}
                      autoComplete="new-password"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all"
                    />
                  </div>

                  {pwMessage && (
                    <div
                      className={`flex items-start gap-2 rounded-xl px-4 py-3 border ${
                        pwMessage.ok
                          ? "bg-emerald-50 border-emerald-200"
                          : "bg-red-50 border-red-200"
                      }`}
                    >
                      {pwMessage.ok ? (
                        <CheckCircle2 size={14} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                      )}
                      <p
                        className={`text-xs ${pwMessage.ok ? "text-emerald-700" : "text-red-700"} whitespace-pre-line`}
                      >
                        {pwMessage.text}
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={pwSaving}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition-all disabled:opacity-60"
                  >
                    {pwSaving ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <>
                        <Lock size={14} /> {t("비밀번호 변경", "Change password")}
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>

      {paymentPendingOpen && <PaymentPendingDialog onClose={() => setPaymentPendingOpen(false)} />}

      {/* 30일권 결제 모달 — 승인 완료 시 /checkout/success 로 이동한다 */}
      {checkoutOpen && (
        <CheckoutDialog
          productKey={SUBSCRIPTION_PRODUCT_KEY}
          onClose={() => setCheckoutOpen(false)}
        />
      )}
    </div>
  );
}
