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
import { getMyDesigns, listDrafts, deleteDraft, type SurveyDraft } from "@/lib/survey-api";
import RequireAuth from "@/components/RequireAuth";
import {
  BarChart2, Settings, History, ChevronRight,
  LogOut, MapPin, Layers, Sparkles, Clock,
  CheckCircle2, AlertCircle, RefreshCw, Construction,
  User, Users, ArrowRight, Zap, X,
  FileText, Target, Globe, ChevronDown, Save,
  Lock, Mail, UserCog, FileEdit, Trash2, MessageSquare,
} from "lucide-react";

/* ─── 상수 ─────────────────────────────────── */
const INDUSTRIES = [
  "A. 농업, 임업 및 어업", "B. 광업", "C. 제조업",
  "D. 전기, 가스, 증기 및 공기조절 공급업",
  "E. 수도, 하수 및 폐기물 처리, 원료 재생업",
  "F. 건설업", "G. 도매 및 소매업", "H. 운수 및 창고업",
  "I. 숙박 및 음식점업", "J. 정보통신업", "K. 금융 및 보험업",
  "L. 부동산업", "M. 전문, 과학 및 기술 서비스업",
  "N. 사업시설 관리, 사업 지원 및 임대 서비스업",
  "O. 공공행정, 국방 및 사회보장 행정", "P. 교육 서비스업",
  "Q. 보건업 및 사회복지 서비스업",
  "R. 예술, 스포츠 및 여가 관련 서비스업",
  "S. 협회 및 단체, 수리 및 기타 개인 서비스업",
  "T. 가구 내 고용활동 및 달리 분류되지 않은 자가소비 생산활동",
  "U. 국제 및 외국기관",
];

const SIDO_LIST = [
  { name: "전국", code: "00" }, { name: "서울특별시", code: "11" },
  { name: "부산광역시", code: "21" }, { name: "대구광역시", code: "22" },
  { name: "인천광역시", code: "23" }, { name: "광주광역시", code: "24" },
  { name: "대전광역시", code: "25" }, { name: "울산광역시", code: "26" },
  { name: "세종특별자치시", code: "29" }, { name: "경기도", code: "31" },
  { name: "강원도", code: "32" }, { name: "충청북도", code: "33" },
  { name: "충청남도", code: "34" }, { name: "전라북도", code: "35" },
  { name: "전라남도", code: "36" }, { name: "경상북도", code: "37" },
  { name: "경상남도", code: "38" }, { name: "제주특별자치도", code: "39" },
];

/* ─── 타입 ─────────────────────────────────── */
type SideMenu = "entrant" | "analysis" | "account";
type AnalysisTab = "home" | "history" | "drafts" | "settings";

type HistoryItem = {
  id: string;
  job_id?: string | null;
  industry: string;
  sido: string;
  sample_size: number;
  status: "done" | "running" | "error";
  created_at: string;
};

/**
 * 히스토리 행 클릭 시 어디로 보낼지 결정.
 * - completed + job_id → /results/<job_id>  (결과 보기)
 * - running   + job_id → /survey/<job_id>   (진행 페이지)
 * - error + job_id     → /results/<job_id>  (결과 페이지가 에러 표시)
 * - 그 외 (가설/문항 단계 미완료, job_id 없음) → /design?design=<id> (이어쓰기)
 */
function historyHref(item: HistoryItem): string {
  if (item.job_id) {
    if (item.status === "done" || item.status === "error") return `/results/${item.job_id}`;
    if (item.status === "running") return `/survey/${item.job_id}`;
  }
  return `/design?design=${item.id}`;
}

type AnalysisSettings = {
  industry: string;
  definition: string;
  needs: string;
  target: string;
  sido: string;
  sampleSize: number;
};

/** 백엔드 status → UI status 매핑 */
function mapStatus(s: string): HistoryItem["status"] {
  if (s === "completed") return "done";
  if (s === "error") return "error";
  // "hypotheses" | "questions" | "running" → 진행 중으로 표시
  return "running";
}

/* ─── 유틸 ──────────────────────────────────── */
function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function fmtAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "방금 전";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

/* ─── 배지 ──────────────────────────────────── */
function StatusBadge({ status }: { status: HistoryItem["status"] }) {
  if (status === "done") return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium"><CheckCircle2 size={10} />완료</span>;
  if (status === "running") return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-medium"><RefreshCw size={10} className="animate-spin" />진행 중</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-xs font-medium"><AlertCircle size={10} />오류</span>;
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
  async function handleLogout() {
    await authLogout();
    router.push("/");
  }
  const [sideMenu, setSideMenu] = useState<SideMenu>("analysis");
  const [analysisTab, setAnalysisTab] = useState<AnalysisTab>("home");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getMyDesigns();
        if (cancelled) return;
        const mapped: HistoryItem[] = (res.designs ?? []).map((d) => ({
          id: String(d.id),
          job_id: d.job_id ?? null,
          industry: d.industry ?? "-",
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
    if (!confirm("이 임시저장을 삭제할까요?")) return;
    try {
      await deleteDraft(id);
      setDrafts((d) => d.filter((x) => x.id !== id));
    } catch (err) {
      alert("삭제 실패: " + (err instanceof Error ? err.message : String(err)));
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
        if (Number.isNaN(n)) throw new Error("연령은 숫자여야 합니다.");
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
        throw new Error("새 비밀번호가 일치하지 않습니다.");
      }
      if (pwForm.new_password1.length < 8) {
        throw new Error("새 비밀번호는 8자 이상이어야 합니다.");
      }
      await authChangePassword(pwForm);
      setPwMessage({ ok: true, text: "비밀번호가 변경되었습니다." });
      setPwForm({ old_password: "", new_password1: "", new_password2: "" });
    } catch (err) {
      setPwMessage({ ok: false, text: err instanceof Error ? err.message : String(err) });
    } finally {
      setPwSaving(false);
    }
  }

  /* 설정 (잠금 탭 — 미리보기용 state) */
  const [settings, setSettings] = useState<AnalysisSettings>({
    industry: INDUSTRIES[0], definition: "", needs: "", target: "",
    sido: "서울특별시", sampleSize: 50,
  });
  const [saved, setSaved] = useState(false);
  function updateSettings(patch: Partial<AnalysisSettings>) { setSettings(p => ({ ...p, ...patch })); setSaved(false); }
  function handleSave() { setSaved(true); setTimeout(() => setSaved(false), 2500); }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* 상단 바 */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-sm">
        <div className="px-4 md:px-6 h-14 md:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-4 min-w-0">
            <Link href="/" className="flex-shrink-0"><Image src="/Socialtwin_o2.png" alt="Socialtwin" width={120} height={34} className="h-7 md:h-8 w-auto object-contain" /></Link>
            <div className="hidden md:block h-5 w-px bg-slate-200" />
            <div className="hidden md:flex items-center gap-1.5">
              <User size={14} className="text-slate-500" />
              <span className="text-sm font-semibold text-slate-800">내 대시보드</span>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            <Link href="/design" className="flex items-center gap-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 px-2.5 md:px-3 py-1.5 rounded-lg transition-all">
              <Sparkles size={12} />
              <span className="hidden sm:inline">새 분석 시작</span>
              <span className="sm:hidden">새 분석</span>
            </Link>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-600 px-2.5 md:px-3 py-1.5 rounded-lg hover:bg-red-50 transition-all" aria-label="로그아웃">
              <LogOut size={12} />
              <span className="hidden sm:inline">로그아웃</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
        {/* ─── 사이드바 (모바일에서는 상단 가로 네비) ── */}
        <aside className="w-full md:w-56 bg-white border-b md:border-b-0 md:border-r border-slate-100 flex flex-col py-2 md:py-4 px-2 md:px-3 flex-shrink-0">
          <p className="hidden md:block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">메뉴</p>
          <nav className="flex md:flex-col gap-1">
            {/* 입국자 대시보드 — 임시 숨김 */}
            <button onClick={() => setSideMenu("analysis")}
              className={`flex-1 md:flex-initial flex items-center justify-center md:justify-start gap-1.5 md:gap-2.5 px-2 md:px-3 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-medium transition-all ${sideMenu === "analysis" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>
              <BarChart2 size={15} className={sideMenu === "analysis" ? "text-indigo-600" : "text-slate-400"} />
              <span className="md:hidden">분석</span>
              <span className="hidden md:inline">분석 대시보드</span>
              {sideMenu !== "analysis" && <ChevronRight size={12} className="hidden md:block ml-auto text-slate-300" />}
            </button>
            <button onClick={() => setSideMenu("account")}
              className={`flex-1 md:flex-initial flex items-center justify-center md:justify-start gap-1.5 md:gap-2.5 px-2 md:px-3 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-medium transition-all ${sideMenu === "account" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>
              <UserCog size={15} className={sideMenu === "account" ? "text-indigo-600" : "text-slate-400"} />
              <span className="md:hidden">계정</span>
              <span className="hidden md:inline">계정 관리</span>
              {sideMenu !== "account" && <ChevronRight size={12} className="hidden md:block ml-auto text-slate-300" />}
            </button>
          </nav>
          <div className="hidden md:block mt-auto px-3">
            <div className="bg-indigo-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-indigo-800 mb-1">빠른 이동</p>
              <Link href="/design" className="flex items-center gap-1.5 text-xs text-indigo-600 hover:underline">
                <Sparkles size={10} /> 새 시장성 분석
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
              <h2 className="text-xl font-bold text-slate-800 mb-2">입국자 대시보드</h2>
              <p className="text-sm text-slate-500 mb-1">현재 개발 중입니다.</p>
              <p className="text-xs text-slate-400">국내 입국자 데이터 기반 시장 분석 기능이 추후 제공될 예정입니다.</p>
              <div className="mt-8 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-5 py-3">
                <Clock size={14} className="text-slate-400" />
                <span className="text-sm text-slate-500">Coming Soon</span>
              </div>
            </div>
          )}

          {/* ══ 분석 대시보드 ══ */}
          {sideMenu === "analysis" && (
            <div className="max-w-3xl mx-auto">
              <div className="mb-6">
                <h1 className="text-xl font-bold text-slate-900">분석 대시보드</h1>
              </div>

              {/* 탭: 새 분석 | 히스토리 | 설정 */}
              <div className="flex gap-1 bg-white border border-slate-100 rounded-xl p-1 mb-8 w-fit shadow-sm">
                {/* 새 분석 시작 */}
                <button onClick={() => setAnalysisTab("home")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${analysisTab === "home" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"}`}>
                  <Sparkles size={14} /> 새 분석
                </button>
                {/* 히스토리 */}
                <button onClick={() => setAnalysisTab("history")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${analysisTab === "history" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"}`}>
                  <History size={14} /> 내 분석 히스토리
                  {history.length > 0 && (
                    <span className="ml-1 bg-indigo-100 text-indigo-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{history.length}</span>
                  )}
                </button>
                {/* 임시저장 */}
                <button onClick={() => setAnalysisTab("drafts")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${analysisTab === "drafts" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"}`}>
                  <FileEdit size={14} /> 임시저장
                  {drafts.length > 0 && (
                    <span className={`ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${analysisTab === "drafts" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-700"}`}>{drafts.length}</span>
                  )}
                </button>
                {/* 설정 — 구현중 */}
                <button onClick={() => setAnalysisTab("settings")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${analysisTab === "settings" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"}`}>
                  <Settings size={14} /> 설정
                  <span className="ml-1 inline-flex items-center gap-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    <Construction size={8} /> 구현중
                  </span>
                </button>
              </div>

              {/* ── 새 분석 탭 ── */}
              {analysisTab === "home" && (
                <div className="space-y-6">
                  {/* 히어로 CTA */}
                  <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 rounded-3xl p-10 overflow-hidden">
                    {/* 배경 장식 */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-8 w-40 h-40 bg-white/5 rounded-full translate-y-1/2" />
                    <div className="relative">
                      <div className="inline-flex items-center gap-2 bg-white/15 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
                        <Zap size={11} /> AI 기반 고객조사
                      </div>
                      <h2 className="text-2xl font-bold text-white mb-3 leading-snug">
                        가상인구로 시장의 반응을<br />미리 검증하세요
                      </h2>
                      <p className="text-indigo-200 text-sm mb-8 leading-relaxed">
                        제품이나 서비스의 정의와 조사 니즈를 입력하면 AI가 가설을 세우고<br />
                        가상의 소비자 패널로 설문 결과를 즉시 생성합니다.
                      </p>
                      <Link
                        href="/design"
                        className="inline-flex items-center gap-2.5 bg-white text-indigo-700 font-bold text-sm px-7 py-3.5 rounded-2xl hover:bg-indigo-50 transition-all shadow-lg shadow-indigo-900/30 hover:shadow-xl hover:shadow-indigo-900/40 hover:-translate-y-0.5"
                      >
                        <Sparkles size={16} />
                        새 분석 시작하기
                        <ArrowRight size={15} />
                      </Link>
                    </div>
                  </div>

                  {/* 분석 절차 안내 — 랜딩페이지와 동일한 4단계 */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                    <h3 className="text-sm font-semibold text-slate-800 mb-5">분석 진행 순서</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        {
                          step: "01",
                          icon: MessageSquare,
                          title: "정의 · 니즈 입력",
                          desc: "제품·서비스와 알고 싶은 인사이트를 한 문장으로 입력합니다.",
                          iconColor: "text-indigo-500",
                          bg: "bg-indigo-50",
                          numColor: "text-indigo-400",
                        },
                        {
                          step: "02",
                          icon: Sparkles,
                          title: "AI 가설·문항 설계",
                          desc: "조사 가설을 도출하고 설문 문항을 자동 생성합니다.",
                          iconColor: "text-violet-500",
                          bg: "bg-violet-50",
                          numColor: "text-violet-400",
                        },
                        {
                          step: "03",
                          icon: Users,
                          title: "가상인구 매칭 · 실행",
                          desc: "KOSIS 가상인구 중 타겟을 매칭해 응답 시뮬레이션을 실행합니다.",
                          iconColor: "text-sky-500",
                          bg: "bg-sky-50",
                          numColor: "text-sky-400",
                        },
                        {
                          step: "04",
                          icon: BarChart2,
                          title: "대시보드 · 보고서",
                          desc: "교차분석 차트와 PDF 보고서로 결과를 30분 안에 확인합니다.",
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
                        <History size={14} className="text-slate-400" /> 최근 분석
                      </h3>
                      <button onClick={() => setAnalysisTab("history")} className="text-xs text-indigo-600 flex items-center gap-0.5 hover:underline">
                        전체 보기 <ChevronRight size={12} />
                      </button>
                    </div>
                    {history.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <History size={24} className="text-slate-200 mb-2" />
                        <p className="text-xs text-slate-400">아직 분석 내역이 없습니다.</p>
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
                              <p className="text-sm text-slate-800 font-medium truncate group-hover:text-indigo-700">{item.industry}</p>
                              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                                <span className="flex items-center gap-1"><MapPin size={9} />{item.sido}</span>
                                <span className="flex items-center gap-1"><Users size={9} />{item.sample_size}명</span>
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
                  {history.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                          <History size={28} className="text-slate-300" />
                        </div>
                        <h3 className="text-sm font-semibold text-slate-800 mb-1">아직 분석 내역이 없습니다</h3>
                        <p className="text-xs text-slate-400 mb-6">첫 번째 시장성 분석을 시작해 보세요.</p>
                        <button onClick={() => setAnalysisTab("home")}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-all">
                          <Sparkles size={14} /> 새 분석 시작
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {history.map(item => {
                        const href = historyHref(item);
                        const ctaLabel = item.job_id && item.status === "done"
                          ? "결과 보기"
                          : item.job_id && item.status === "running"
                            ? "진행 보기"
                            : "이어서 작성";
                        return (
                          <Link
                            key={item.id}
                            href={href}
                            className="block bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:border-indigo-300 hover:shadow-md transition-all group"
                          >
                            <div className="flex items-start justify-between">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-indigo-700">{item.industry}</p>
                                <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                                  <span className="flex items-center gap-1"><MapPin size={10} />{item.sido}</span>
                                  <span className="flex items-center gap-1"><Users size={10} />{item.sample_size}명</span>
                                  <span className="flex items-center gap-1"><Clock size={10} />{fmtAgo(item.created_at)}</span>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2 ml-4 flex-shrink-0">
                                <StatusBadge status={item.status} />
                                <span className="text-xs text-indigo-600 font-medium flex items-center gap-0.5 group-hover:underline">
                                  {ctaLabel} <ChevronRight size={10} />
                                </span>
                              </div>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2">{fmtDate(item.created_at)}</p>
                          </Link>
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
                      <RefreshCw size={14} className="animate-spin" /> 불러오는 중…
                    </div>
                  ) : draftsError ? (
                    <div className="bg-white rounded-2xl border border-rose-100 shadow-sm py-12 flex flex-col items-center justify-center gap-2 text-sm text-rose-600">
                      <AlertCircle size={20} />
                      <p>{draftsError}</p>
                      <button onClick={refreshDrafts} className="mt-2 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-semibold hover:bg-rose-100">다시 시도</button>
                    </div>
                  ) : drafts.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-16 flex flex-col items-center justify-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                        <FileEdit size={22} className="text-slate-300" />
                      </div>
                      <p className="text-sm text-slate-500">임시저장한 분석이 없습니다.</p>
                      <Link href="/design" className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-colors">
                        <Sparkles size={14} /> 새 분석 시작
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {drafts.map((d) => {
                        const stepLabel: Record<string, string> = {
                          input: "정의·니즈 입력",
                          hyp_review: "가설 검토",
                          survey_review: "문항 검토",
                          result: "결과",
                        };
                        return (
                          <div key={d.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:border-slate-200 transition-colors flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                              <FileEdit size={16} className="text-amber-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">{stepLabel[d.step] ?? d.step}</span>
                                <span className="text-[10px] text-slate-400">{fmtAgo(d.updated_at)}</span>
                              </div>
                              <h4 className="text-sm font-semibold text-slate-900 truncate">{d.title || "(제목 없음)"}</h4>
                              <p className="text-[11px] text-slate-500 mt-0.5">{fmtDate(d.updated_at)}</p>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <Link
                                href={`/design?draft=${d.id}`}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition-colors"
                              >
                                이어쓰기 <ArrowRight size={12} />
                              </Link>
                              <button
                                onClick={() => handleDeleteDraft(d.id)}
                                className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="삭제"
                                aria-label="삭제"
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

              {/* ── 설정 탭 (구현 중) ── */}
              {analysisTab === "settings" && (
                <div className="relative">
                  {/* 흐린 설정 미리보기 */}
                  <div className="space-y-6 select-none pointer-events-none" style={{ filter: "blur(4px)", opacity: 0.45 }}>
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center"><Globe size={15} className="text-indigo-600" /></div>
                        <div><p className="text-sm font-semibold text-slate-800">산업 분류</p><p className="text-xs text-slate-500 mt-0.5">한국표준산업분류 11차 대분류 기준으로 분석 산업을 선택하세요.</p></div>
                      </div>
                      <div className="relative">
                        <select value={settings.industry} onChange={e => updateSettings({ industry: e.target.value })}
                          className="w-full appearance-none pl-4 pr-10 py-3 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-800">
                          {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center"><Target size={15} className="text-indigo-600" /></div>
                        <div><p className="text-sm font-semibold text-slate-800">타겟 설정</p><p className="text-xs text-slate-500 mt-0.5">분석하고자 하는 타겟 고객을 구체적으로 설명하세요. (선택)</p></div>
                      </div>
                      <textarea rows={3} className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl bg-slate-50 resize-none" placeholder="예: 30대 워킹맘, 1인 가구 직장인…" readOnly />
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center"><FileText size={15} className="text-indigo-600" /></div>
                        <div><p className="text-sm font-semibold text-slate-800">제품/서비스 정의</p><p className="text-xs text-slate-500 mt-0.5">분석할 제품 또는 서비스를 300자 이상 상세히 설명하세요.</p></div>
                      </div>
                      <textarea rows={5} className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl bg-slate-50 resize-none" readOnly />
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center"><Layers size={15} className="text-indigo-600" /></div>
                        <div><p className="text-sm font-semibold text-slate-800">가상인구 설정</p><p className="text-xs text-slate-500 mt-0.5">분석에 사용할 지역과 가상인구 표본 수를 설정하세요.</p></div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="h-12 bg-slate-100 rounded-xl" />
                        <div className="h-12 bg-slate-100 rounded-xl" />
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full mt-4" />
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex justify-end">
                      <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-100 text-indigo-400 text-sm font-semibold">
                        <Save size={14} /> 설정 저장
                      </div>
                    </div>
                  </div>

                  {/* 구현 중 안내 오버레이 */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative bg-white rounded-3xl shadow-2xl shadow-black/10 border border-slate-100 p-8 max-w-sm w-full mx-4 text-center">
                      <button
                        onClick={() => setAnalysisTab("home")}
                        aria-label="닫기"
                        className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        <X size={16} />
                      </button>
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-5">
                        <Construction size={28} className="text-slate-400" />
                      </div>
                      <div className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full mb-4">
                        <Construction size={11} /> 구현중
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mb-2">상세 설정은 현재 구현 중입니다</h3>
                      <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                        산업 분류, 타겟 설정, 제품 정의, 조사 니즈,<br />
                        지역·가상인구 수를 미리 저장해 두는 기능을<br />
                        준비하고 있어요. 곧 만나보실 수 있습니다.
                      </p>
                      <button
                        onClick={() => setAnalysisTab("home")}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-all"
                      >
                        닫기
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ 계정 관리 ══ */}
          {sideMenu === "account" && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="mb-2">
                <h1 className="text-xl font-bold text-slate-900">계정 관리</h1>
                <p className="text-xs text-slate-500 mt-1">프로필 정보와 비밀번호를 관리합니다.</p>
              </div>

              {/* ── 프로필 카드 ── */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                  <User size={16} className="text-indigo-500" />
                  <h2 className="text-sm font-bold text-slate-800">프로필 정보</h2>
                </div>

                {profileLoading ? (
                  <div className="px-6 py-12 flex items-center justify-center text-sm text-slate-400 gap-2">
                    <RefreshCw size={14} className="animate-spin" />
                    불러오는 중…
                  </div>
                ) : !profile ? (
                  <div className="px-6 py-10 text-center text-sm text-rose-600 flex items-center justify-center gap-2">
                    <AlertCircle size={14} />
                    {profileError ?? "프로필을 불러오지 못했습니다."}
                  </div>
                ) : (
                  <div className="px-6 py-5 space-y-4">
                    {/* 이메일 (읽기 전용) */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">이메일</label>
                      <div className="relative">
                        <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="email"
                          value={profile.email}
                          readOnly
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-500 cursor-not-allowed"
                        />
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400">이메일은 변경할 수 없습니다.</p>
                    </div>

                    {/* 이름 */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">성</label>
                        <input
                          type="text"
                          value={profileForm.last_name}
                          onChange={(e) => setProfileForm((p) => ({ ...p, last_name: e.target.value }))}
                          placeholder="홍"
                          maxLength={150}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">이름</label>
                        <input
                          type="text"
                          value={profileForm.first_name}
                          onChange={(e) => setProfileForm((p) => ({ ...p, first_name: e.target.value }))}
                          placeholder="길동"
                          maxLength={150}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all"
                        />
                      </div>
                    </div>

                    {/* 성별 + 연령 (한 줄) */}
                    <div className="grid grid-cols-[1fr_120px] gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">성별</label>
                        <div className="flex gap-1.5">
                          {[
                            { value: "M", label: "남" },
                            { value: "F", label: "여" },
                            { value: "O", label: "기타" },
                            { value: "", label: "미선택" },
                          ].map((opt) => (
                            <button
                              key={opt.value || "none"}
                              type="button"
                              onClick={() => setProfileForm((p) => ({ ...p, gender: opt.value }))}
                              className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all ${
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
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">연령</label>
                        <input
                          type="number"
                          min={0}
                          max={120}
                          value={profileForm.age}
                          onChange={(e) => setProfileForm((p) => ({ ...p, age: e.target.value }))}
                          placeholder="예: 35"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all"
                        />
                      </div>
                    </div>

                    {/* 소속 + 직급 */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">소속</label>
                        <input
                          type="text"
                          value={profileForm.organization}
                          onChange={(e) => setProfileForm((p) => ({ ...p, organization: e.target.value }))}
                          placeholder="회사·기관·학교"
                          maxLength={120}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">직급</label>
                        <input
                          type="text"
                          value={profileForm.position}
                          onChange={(e) => setProfileForm((p) => ({ ...p, position: e.target.value }))}
                          placeholder="예: 매니저"
                          maxLength={80}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all"
                        />
                      </div>
                    </div>

                    {/* 연락처 */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">연락처</label>
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
                          <CheckCircle2 size={14} /> 저장됨
                        </>
                      ) : (
                        <>
                          <Save size={14} /> 프로필 저장
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
                  <h2 className="text-sm font-bold text-slate-800">비밀번호 변경</h2>
                </div>
                <form onSubmit={handlePasswordChange} className="px-6 py-5 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">현재 비밀번호</label>
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
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">새 비밀번호</label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={pwForm.new_password1}
                      onChange={(e) => setPwForm((p) => ({ ...p, new_password1: e.target.value }))}
                      autoComplete="new-password"
                      placeholder="8자 이상"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">새 비밀번호 확인</label>
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
                        <Lock size={14} /> 비밀번호 변경
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
