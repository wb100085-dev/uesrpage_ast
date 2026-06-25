"use client";

import { useState, useEffect, useCallback, useMemo, Fragment } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { authLogout } from "@/lib/auth-api";
import RequireAuth from "@/components/RequireAuth";
import {
  Users, Activity, BarChart2, RefreshCw, Clock, Search,
  TrendingUp, Database, ChevronRight, LogOut, Shield,
  FileText, MapPin, Layers, AlertCircle, CheckCircle2,
  TableProperties, ChevronsUpDown, ChevronUp, ChevronDown as ChevronDownIcon,
  Download, ClipboardList,
} from "lucide-react";
import { listReviewResponses, downloadReviewCsv, type ReviewResponseRow } from "@/lib/survey-api";
import { SURVEY_SERVICE_REVIEW, SURVEY_REPORT_QUALITY } from "@/lib/review-survey";

/* ─── 타입 ─────────────────────────────────── */
type UserRow = {
  id: string;
  email: string;
  role: "admin" | "user";
  created_at: string;
  last_sign_in_at: string | null;
  analysis_count: number;
};

type AnalysisLog = {
  id: string;
  user_email: string;
  definition: string;
  needs: string;
  target: string;
  sido: string;
  sample_size: number;
  hypothesis_1: string;
  hypothesis_2: string;
  hypothesis_3: string;
  status: "done" | "running" | "error";
  created_at: string;
};

type Stats = {
  total_users: number;
  total_analyses: number;
  today_analyses: number;
  active_users_7d: number;
};

type SortKey = keyof AnalysisLog;
type SortDir = "asc" | "desc";

/* ─── 더미 데이터 (Supabase 연결 후 교체) ──── */
const DUMMY_STATS: Stats = { total_users: 0, total_analyses: 0, today_analyses: 0, active_users_7d: 0 };
const DUMMY_USERS: UserRow[] = [];
const DUMMY_LOGS: AnalysisLog[] = [];

/* ─── 유틸 ──────────────────────────────────── */
function fmtDate(iso: string | null) {
  if (!iso) return "—";
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
function StatusBadge({ status }: { status: AnalysisLog["status"] }) {
  if (status === "done")
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium whitespace-nowrap"><CheckCircle2 size={10} />완료</span>;
  if (status === "running")
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-medium whitespace-nowrap"><RefreshCw size={10} className="animate-spin" />진행 중</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-xs font-medium whitespace-nowrap"><AlertCircle size={10} />오류</span>;
}
function RoleBadge({ role }: { role: "admin" | "user" }) {
  return role === "admin"
    ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold"><Shield size={10} />Admin</span>
    : <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">User</span>;
}

/* ─── 스탯 카드 ─────────────────────────────── */
function StatCard({ icon: Icon, label, value, sub, color }: { icon: React.ElementType; label: string; value: number | string; sub?: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
          <p className="text-3xl font-bold text-slate-900">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
    </div>
  );
}

/* ─── 정렬 아이콘 ───────────────────────────── */
function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronsUpDown size={11} className="text-slate-300 ml-1 flex-shrink-0" />;
  return sortDir === "asc"
    ? <ChevronUp size={11} className="text-indigo-500 ml-1 flex-shrink-0" />
    : <ChevronDownIcon size={11} className="text-indigo-500 ml-1 flex-shrink-0" />;
}

/* ─── CSV 다운로드 ──────────────────────────── */
function downloadCSV(logs: AnalysisLog[]) {
  const headers = ["#", "사용자", "제품정의", "조사니즈", "타겟", "지역", "표본수", "가설1", "가설2", "가설3", "상태", "일시"];
  const rows = logs.map((l, i) => [
    i + 1, l.user_email, l.definition, l.needs, l.target,
    l.sido, l.sample_size, l.hypothesis_1, l.hypothesis_2, l.hypothesis_3,
    l.status, fmtDate(l.created_at),
  ]);
  const csv = [headers, ...rows].map(r => r.map(c => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = `분석시트_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  URL.revokeObjectURL(url);
}

/* ═══════════════════════════════════════════ */
/*  메인                                        */
/* ═══════════════════════════════════════════ */
export default function AdminDashboard() {
  return (
    <RequireAuth>
      <AdminDashboardInner />
    </RequireAuth>
  );
}

function AdminDashboardInner() {
  const router = useRouter();
  async function handleLogout() {
    await authLogout();
    router.push("/");
  }
  const [stats, setStats] = useState<Stats>(DUMMY_STATS);
  const [users, setUsers] = useState<UserRow[]>(DUMMY_USERS);
  const [logs, setLogs] = useState<AnalysisLog[]>(DUMMY_LOGS);
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "logs" | "sheet" | "reviews">("overview");
  const [reviews, setReviews] = useState<ReviewResponseRow[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [reviewSurvey, setReviewSurvey] = useState<"service_review" | "report_quality">("service_review");
  const [reviewCsvBusy, setReviewCsvBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    /* TODO: Supabase 연결 시 아래 주석 해제
    const { data: usersData } = await supabase
      .from("profiles")
      .select("id, email, role, created_at, last_sign_in_at, analysis_count")
      .order("created_at", { ascending: false });
    const { data: logsData } = await supabase
      .from("analysis_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    const fetchedUsers = (usersData ?? []) as UserRow[];
    const fetchedLogs = (logsData ?? []) as AnalysisLog[];
    setUsers(fetchedUsers);
    setLogs(fetchedLogs);
    setStats({
      total_users: fetchedUsers.length,
      total_analyses: fetchedLogs.length,
      today_analyses: fetchedLogs.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString()).length,
      active_users_7d: new Set(fetchedLogs.filter(l => Date.now() - new Date(l.created_at).getTime() < 7*86400000).map(l => l.user_email)).size,
    });
    */
    setStats(DUMMY_STATS);
    setUsers(DUMMY_USERS);
    setLogs(DUMMY_LOGS);
    setLastRefresh(new Date());
    setTimeout(() => setRefreshing(false), 400);
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 30000);
    return () => clearInterval(id);
  }, [refresh]);

  /* ── 리뷰 설문 응답 로드 (실제 백엔드) ── */
  const loadReviews = useCallback(async () => {
    setReviewsLoading(true);
    setReviewsError(null);
    try {
      const { responses } = await listReviewResponses();
      setReviews(responses ?? []);
    } catch (err) {
      setReviewsError(err instanceof Error ? err.message : "설문 응답을 불러오지 못했습니다.");
    } finally {
      setReviewsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "reviews") loadReviews();
  }, [activeTab, loadReviews]);

  /* ── 탭 전환 시 검색 초기화 ── */
  function switchTab(tab: typeof activeTab) {
    setActiveTab(tab);
    setSearch("");
    setExpandedRow(null);
  }

  /* ── 정렬 토글 ── */
  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }

  /* ── 필터·정렬 적용 ── */
  const filteredUsers = useMemo(() =>
    users.filter(u => u.email.includes(search) || u.role.includes(search)),
    [users, search]);

  const filteredLogs = useMemo(() =>
    logs.filter(l =>
      l.user_email.includes(search) ||
      l.sido.includes(search)
    ), [logs, search]);

  const sheetRows = useMemo(() => {
    const q = search.toLowerCase();
    const filtered = logs.filter(l =>
      !q ||
      l.user_email.toLowerCase().includes(q) ||
      l.sido.toLowerCase().includes(q) ||
      l.target.toLowerCase().includes(q) ||
      l.definition.toLowerCase().includes(q) ||
      l.needs.toLowerCase().includes(q) ||
      l.hypothesis_1.toLowerCase().includes(q) ||
      l.hypothesis_2.toLowerCase().includes(q) ||
      l.hypothesis_3.toLowerCase().includes(q)
    );
    return [...filtered].sort((a, b) => {
      const av = a[sortKey] ?? ""; const bv = b[sortKey] ?? "";
      const cmp = String(av).localeCompare(String(bv), "ko");
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [logs, search, sortKey, sortDir]);

  /* ── 시트 컬럼 정의 ── */
  const SHEET_COLS: { key: SortKey; label: string; width: string; align?: string }[] = [
    { key: "user_email",    label: "사용자",      width: "min-w-[160px]" },
    { key: "target",        label: "타겟",         width: "min-w-[140px]" },
    { key: "definition",    label: "제품/서비스 정의", width: "min-w-[260px]" },
    { key: "needs",         label: "조사 니즈",   width: "min-w-[260px]" },
    { key: "sido",          label: "지역",         width: "min-w-[110px]" },
    { key: "sample_size",   label: "표본 수",     width: "min-w-[80px]",  align: "right" },
    { key: "hypothesis_1",  label: "가설 1",       width: "min-w-[220px]" },
    { key: "hypothesis_2",  label: "가설 2",       width: "min-w-[220px]" },
    { key: "hypothesis_3",  label: "가설 3",       width: "min-w-[220px]" },
    { key: "status",        label: "상태",         width: "min-w-[80px]",  align: "center" },
    { key: "created_at",    label: "일시",         width: "min-w-[140px]" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 상단 바 */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Image src="/Socialtwin_o2.png" alt="Socialtwin" width={120} height={34} className="h-8 w-auto object-contain" />
            </Link>
            <div className="h-5 w-px bg-slate-200" />
            <div className="flex items-center gap-1.5">
              <Shield size={14} className="text-indigo-600" />
              <span className="text-sm font-semibold text-slate-800">Admin 대시보드</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={refresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-all"
            >
              <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
              {fmtDate(lastRefresh.toISOString())} 기준
            </button>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-all">
              <LogOut size={12} /> 로그아웃
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Supabase 미연결 알림 */}
        <div className="mb-6 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <Database size={16} className="text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            Supabase가 연결되지 않아 데이터가 없습니다.{" "}
            <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs font-mono">.env.local</code>에
            실제 키를 입력하면 실시간 데이터가 표시됩니다.
          </p>
        </div>

        {/* 탭 */}
        <div className="flex gap-1 bg-white border border-slate-100 rounded-xl p-1 mb-6 w-fit shadow-sm">
          {(["overview", "users", "logs", "sheet", "reviews"] as const).map((tab) => {
            const labels = { overview: "개요", users: "가입자", logs: "분석 로그", sheet: "분석 시트", reviews: "설문결과" };
            const icons = { overview: TrendingUp, users: Users, logs: FileText, sheet: TableProperties, reviews: ClipboardList };
            const Icon = icons[tab];
            return (
              <button
                key={tab}
                onClick={() => switchTab(tab)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                <Icon size={14} />
                {labels[tab]}
              </button>
            );
          })}
        </div>

        {/* ── 개요 탭 ── */}
        {activeTab === "overview" && (
          <div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard icon={Users} label="총 가입자" value={stats.total_users.toLocaleString()} sub="전체 누적" color="bg-indigo-500" />
              <StatCard icon={BarChart2} label="총 분석 횟수" value={stats.total_analyses.toLocaleString()} sub="전체 누적" color="bg-violet-500" />
              <StatCard icon={Activity} label="오늘 분석" value={stats.today_analyses.toLocaleString()} sub="오늘 생성된 분석" color="bg-emerald-500" />
              <StatCard icon={TrendingUp} label="주간 활성 유저" value={stats.active_users_7d.toLocaleString()} sub="최근 7일" color="bg-amber-500" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2"><Users size={14} className="text-indigo-500" />최근 가입자</h3>
                  <button onClick={() => switchTab("users")} className="text-xs text-indigo-600 flex items-center gap-0.5 hover:underline">전체 보기 <ChevronRight size={12} /></button>
                </div>
                {users.length === 0 ? <EmptyState icon={Users} label="가입자가 없습니다" /> : (
                  <div className="divide-y divide-slate-50">
                    {users.slice(0, 5).map(u => (
                      <div key={u.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50">
                        <div>
                          <p className="text-sm text-slate-800 font-medium">{u.email}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{fmtDate(u.created_at)}</p>
                        </div>
                        <RoleBadge role={u.role} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2"><BarChart2 size={14} className="text-violet-500" />최근 분석</h3>
                  <button onClick={() => switchTab("sheet")} className="text-xs text-indigo-600 flex items-center gap-0.5 hover:underline">시트에서 보기 <ChevronRight size={12} /></button>
                </div>
                {logs.length === 0 ? <EmptyState icon={BarChart2} label="분석 기록이 없습니다" /> : (
                  <div className="divide-y divide-slate-50">
                    {logs.slice(0, 5).map(l => (
                      <div key={l.id} className="px-5 py-3 flex items-start justify-between hover:bg-slate-50/50">
                        <div className="min-w-0">
                          <p className="text-sm text-slate-800 font-medium truncate">{l.user_email}</p>
                          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                            <span className="flex items-center gap-1"><MapPin size={10} />{l.sido}</span>
                            <span className="flex items-center gap-1"><Layers size={10} />{l.sample_size}명</span>
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 ml-3 flex-shrink-0">
                          <StatusBadge status={l.status} />
                          <span className="text-[10px] text-slate-400">{fmtAgo(l.created_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── 가입자 탭 ── */}
        {activeTab === "users" && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="이메일, 역할 검색..."
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all" />
              </div>
              <span className="text-xs text-slate-400">{filteredUsers.length}명</span>
            </div>
            {filteredUsers.length === 0 ? <EmptyState icon={Users} label={search ? "검색 결과가 없습니다" : "가입자가 없습니다"} /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs font-semibold">
                      <th className="px-5 py-3 text-left">이메일</th>
                      <th className="px-5 py-3 text-left">역할</th>
                      <th className="px-5 py-3 text-left">가입일</th>
                      <th className="px-5 py-3 text-left">마지막 로그인</th>
                      <th className="px-5 py-3 text-right">분석 횟수</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredUsers.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3 font-medium text-slate-800">{u.email}</td>
                        <td className="px-5 py-3"><RoleBadge role={u.role} /></td>
                        <td className="px-5 py-3 text-slate-500">{fmtDate(u.created_at)}</td>
                        <td className="px-5 py-3 text-slate-500">{fmtDate(u.last_sign_in_at)}</td>
                        <td className="px-5 py-3 text-right font-semibold text-slate-800">{u.analysis_count.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── 분석 로그 탭 ── */}
        {activeTab === "logs" && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="이메일, 지역 검색..."
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all" />
              </div>
              <span className="text-xs text-slate-400">{filteredLogs.length}건</span>
            </div>
            {filteredLogs.length === 0 ? <EmptyState icon={FileText} label={search ? "검색 결과가 없습니다" : "분석 로그가 없습니다"} /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs font-semibold">
                      <th className="px-5 py-3 text-left">사용자</th>
                      <th className="px-5 py-3 text-left">지역</th>
                      <th className="px-5 py-3 text-right">표본 수</th>
                      <th className="px-5 py-3 text-center">상태</th>
                      <th className="px-5 py-3 text-left">일시</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredLogs.map(l => (
                      <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3 font-medium text-slate-800">{l.user_email}</td>
                        <td className="px-5 py-3 text-slate-600">{l.sido}</td>
                        <td className="px-5 py-3 text-right font-semibold text-slate-800">{l.sample_size}명</td>
                        <td className="px-5 py-3 text-center"><StatusBadge status={l.status} /></td>
                        <td className="px-5 py-3 text-slate-500 text-xs">
                          <div>{fmtDate(l.created_at)}</div>
                          <div className="text-slate-400">{fmtAgo(l.created_at)}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── 분석 시트 탭 ── */}
        {activeTab === "sheet" && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {/* 시트 툴바 */}
            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-3 flex-wrap">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="전체 컬럼 검색..."
                  className="pl-8 pr-4 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all w-52"
                />
              </div>
              <span className="text-xs text-slate-400">{sheetRows.length}건</span>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs text-slate-400">컬럼 헤더 클릭 시 정렬</span>
                <button
                  onClick={() => downloadCSV(sheetRows)}
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
                >
                  <Download size={12} /> CSV 다운로드
                </button>
              </div>
            </div>

            {sheetRows.length === 0 ? (
              <EmptyState icon={TableProperties} label={search ? "검색 결과가 없습니다" : "분석 데이터가 없습니다"} />
            ) : (
              /* 스프레드시트 영역 — 가로 스크롤, 헤더 고정 */
              <div className="overflow-auto max-h-[calc(100vh-280px)]">
                <table className="text-xs border-collapse" style={{ minWidth: "max-content" }}>
                  <thead className="sticky top-0 z-20">
                    <tr>
                      {/* # 고정 컬럼 */}
                      <th className="sticky left-0 z-30 bg-slate-100 border-b border-r border-slate-200 px-3 py-2.5 text-slate-500 font-semibold text-center w-10 select-none">
                        #
                      </th>
                      {SHEET_COLS.map(col => (
                        <th
                          key={col.key}
                          onClick={() => toggleSort(col.key)}
                          className={`bg-slate-100 border-b border-r border-slate-200 px-3 py-2.5 font-semibold text-slate-600 cursor-pointer hover:bg-indigo-50 hover:text-indigo-700 select-none transition-colors ${col.width} ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"}`}
                        >
                          <span className="flex items-center gap-0.5 whitespace-nowrap">
                            {col.label}
                            <SortIcon col={col.key} sortKey={sortKey} sortDir={sortDir} />
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sheetRows.map((row, idx) => {
                      const isExpanded = expandedRow === row.id;
                      return (
                        <>
                          <tr
                            key={row.id}
                            onClick={() => setExpandedRow(isExpanded ? null : row.id)}
                            className={`cursor-pointer border-b border-slate-100 transition-colors ${
                              isExpanded ? "bg-indigo-50" : idx % 2 === 0 ? "bg-white hover:bg-slate-50" : "bg-slate-50/40 hover:bg-slate-100/60"
                            }`}
                          >
                            {/* 행 번호 — 고정 */}
                            <td className={`sticky left-0 z-10 border-r border-slate-200 px-3 py-2 text-center font-mono text-slate-400 select-none ${isExpanded ? "bg-indigo-50" : idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"}`}>
                              {idx + 1}
                            </td>
                            {/* 사용자 */}
                            <td className="border-r border-slate-100 px-3 py-2 font-medium text-slate-800 whitespace-nowrap">{row.user_email}</td>
                            {/* 타겟 */}
                            <td className="border-r border-slate-100 px-3 py-2 text-slate-600 max-w-[140px] truncate">{row.target || <span className="text-slate-300">—</span>}</td>
                            {/* 제품 정의 */}
                            <td className="border-r border-slate-100 px-3 py-2 text-slate-600 max-w-[260px] truncate">{row.definition}</td>
                            {/* 조사 니즈 */}
                            <td className="border-r border-slate-100 px-3 py-2 text-slate-600 max-w-[260px] truncate">{row.needs}</td>
                            {/* 지역 */}
                            <td className="border-r border-slate-100 px-3 py-2 text-slate-600 whitespace-nowrap">{row.sido}</td>
                            {/* 표본 수 */}
                            <td className="border-r border-slate-100 px-3 py-2 text-right font-semibold text-slate-800 whitespace-nowrap">{row.sample_size}명</td>
                            {/* 가설 1,2,3 */}
                            <td className="border-r border-slate-100 px-3 py-2 text-slate-600 max-w-[220px] truncate">{row.hypothesis_1 || <span className="text-slate-300">—</span>}</td>
                            <td className="border-r border-slate-100 px-3 py-2 text-slate-600 max-w-[220px] truncate">{row.hypothesis_2 || <span className="text-slate-300">—</span>}</td>
                            <td className="border-r border-slate-100 px-3 py-2 text-slate-600 max-w-[220px] truncate">{row.hypothesis_3 || <span className="text-slate-300">—</span>}</td>
                            {/* 상태 */}
                            <td className="border-r border-slate-100 px-3 py-2 text-center"><StatusBadge status={row.status} /></td>
                            {/* 일시 */}
                            <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{fmtDate(row.created_at)}</td>
                          </tr>

                          {/* 펼침 상세 행 */}
                          {isExpanded && (
                            <tr key={`${row.id}-detail`} className="bg-indigo-50/60 border-b-2 border-indigo-200">
                              <td className="sticky left-0 bg-indigo-50/60 border-r border-slate-200" />
                              <td colSpan={SHEET_COLS.length} className="px-4 py-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <DetailBlock label="제품/서비스 정의" value={row.definition} />
                                  <DetailBlock label="조사의 목적과 니즈" value={row.needs} />
                                  <DetailBlock label="가설 1" value={row.hypothesis_1} />
                                  <DetailBlock label="가설 2" value={row.hypothesis_2} />
                                  <DetailBlock label="가설 3" value={row.hypothesis_3} />
                                  {row.target && <DetailBlock label="타겟" value={row.target} />}
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {/* 시트 하단 안내 */}
            {sheetRows.length > 0 && (
              <div className="px-5 py-2 border-t border-slate-100 bg-slate-50 flex items-center gap-4 text-xs text-slate-400">
                <span>행 클릭 시 전체 내용 펼치기</span>
                <span>·</span>
                <span>컬럼 헤더 클릭 시 정렬</span>
                <span className="ml-auto">{sheetRows.length}행 × {SHEET_COLS.length + 1}열</span>
              </div>
            )}
          </div>
        )}

        {/* ── 설문결과 탭 (리뷰 이벤트 설문 — 실제 백엔드) ── */}
        {activeTab === "reviews" && (
          <ReviewsTab
            reviews={reviews}
            loading={reviewsLoading}
            error={reviewsError}
            survey={reviewSurvey}
            setSurvey={setReviewSurvey}
            onRefresh={loadReviews}
            csvBusy={reviewCsvBusy}
            onCsv={async () => {
              setReviewCsvBusy(true);
              try { await downloadReviewCsv(); } catch (e) { setReviewsError(e instanceof Error ? e.message : "CSV 다운로드 실패"); }
              finally { setReviewCsvBusy(false); }
            }}
            expandedRow={expandedRow}
            setExpandedRow={setExpandedRow}
          />
        )}

        <p className="mt-4 text-center text-xs text-slate-400 flex items-center justify-center gap-1">
          <Clock size={10} /> 30초마다 자동 갱신
        </p>
      </div>
    </div>
  );
}

/* ── 설문결과 탭 ── */
function ReviewsTab({
  reviews, loading, error, survey, setSurvey, onRefresh, csvBusy, onCsv, expandedRow, setExpandedRow,
}: {
  reviews: ReviewResponseRow[];
  loading: boolean;
  error: string | null;
  survey: "service_review" | "report_quality";
  setSurvey: (s: "service_review" | "report_quality") => void;
  onRefresh: () => void;
  csvBusy: boolean;
  onCsv: () => void;
  expandedRow: string | null;
  setExpandedRow: (s: string | null) => void;
}) {
  const def = survey === "service_review" ? SURVEY_SERVICE_REVIEW : SURVEY_REPORT_QUALITY;
  const filtered = reviews.filter((r) => r.survey_key === survey);
  const counts = {
    service_review: reviews.filter((r) => r.survey_key === "service_review").length,
    report_quality: reviews.filter((r) => r.survey_key === "report_quality").length,
  };

  function fmt(ts: string) {
    try { return new Date(ts).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" }); }
    catch { return ts; }
  }
  function answerText(ans: Record<string, unknown>, id: string): string {
    const v = ans?.[id];
    if (Array.isArray(v)) return v.join(", ");
    return v == null ? "" : String(v);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex gap-1 bg-white border border-slate-100 rounded-lg p-1 shadow-sm">
          {([["service_review", `설문1 · 서비스 후기 (${counts.service_review})`], ["report_quality", `설문2 · 보고서 품질 (${counts.report_quality})`]] as const).map(([k, label]) => (
            <button key={k} onClick={() => { setSurvey(k); setExpandedRow(null); }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${survey === k ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-50"}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={onRefresh} disabled={loading} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-60">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> 새로고침
          </button>
          <button onClick={onCsv} disabled={csvBusy} className="flex items-center gap-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 rounded-lg disabled:opacity-60">
            <Download size={13} /> {csvBusy ? "준비 중…" : "전체 CSV 다운로드"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-700">
          <AlertCircle size={15} className="flex-shrink-0 mt-0.5" /> {error}
        </div>
      )}

      <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-slate-400">불러오는 중…</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={ClipboardList} label="아직 수집된 설문 응답이 없습니다" />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs">
              <tr>
                <th className="px-4 py-3 text-left w-10">#</th>
                <th className="px-4 py-3 text-left">일시</th>
                <th className="px-4 py-3 text-left">사용자</th>
                <th className="px-4 py-3 text-left">Job ID</th>
                <th className="px-4 py-3 text-right">상세</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const rid = String(r.id);
                const open = expandedRow === rid;
                return (
                  <Fragment key={rid}>
                    <tr className="border-t border-slate-50 hover:bg-slate-50/60 cursor-pointer" onClick={() => setExpandedRow(open ? null : rid)}>
                      <td className="px-4 py-3 text-slate-400 tabular-nums">{r.id}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{fmt(r.created_at)}</td>
                      <td className="px-4 py-3 text-slate-700">{r.user_email || <span className="text-slate-300">비로그인</span>}</td>
                      <td className="px-4 py-3 text-slate-400 font-mono text-xs truncate max-w-[160px]">{r.job_id || "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <ChevronDownIcon size={15} className={`inline text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
                      </td>
                    </tr>
                    {open && (
                      <tr className="bg-slate-50/60">
                        <td colSpan={5} className="px-4 py-4">
                          <div className="flex flex-col gap-3">
                            {def.questions.map((q, i) => {
                              const a = answerText(r.answers, q.id);
                              const reason = answerText(r.answers, `${q.id}_reason`);
                              return (
                                <div key={q.id} className="grid grid-cols-[24px_1fr] gap-2">
                                  <span className="text-[11px] font-bold text-indigo-500">Q{i + 1}</span>
                                  <div>
                                    <p className="text-xs text-slate-500 mb-0.5">{q.label}</p>
                                    <p className="text-sm text-slate-800 font-medium whitespace-pre-wrap">{a || <span className="text-slate-300">무응답</span>}</p>
                                    {reason && <p className="text-xs text-amber-600 mt-0.5">↳ 사유: {reason}</p>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
      <Icon size={32} className="mb-3 opacity-30" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

function DetailBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-indigo-100 p-3">
      <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wide mb-1.5">{label}</p>
      <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap break-words">{value || "—"}</p>
    </div>
  );
}
