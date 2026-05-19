"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { authLogout } from "@/lib/auth-api";
import {
  BarChart2, Plane, Settings, History, ChevronRight,
  LogOut, MapPin, Layers, Sparkles, Clock,
  CheckCircle2, AlertCircle, RefreshCw, Construction,
  User, Users, ArrowRight, Zap, X,
  FileText, Target, Globe, ChevronDown, Save,
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
type SideMenu = "entrant" | "analysis";
type AnalysisTab = "home" | "history" | "settings";

type HistoryItem = {
  id: string;
  industry: string;
  sido: string;
  sample_size: number;
  status: "done" | "running" | "error";
  created_at: string;
};

type AnalysisSettings = {
  industry: string;
  definition: string;
  needs: string;
  target: string;
  sido: string;
  sampleSize: number;
};

const DUMMY_HISTORY: HistoryItem[] = [];

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
  const router = useRouter();
  async function handleLogout() {
    await authLogout();
    router.push("/");
  }
  const [sideMenu, setSideMenu] = useState<SideMenu>("analysis");
  const [analysisTab, setAnalysisTab] = useState<AnalysisTab>("home");
  const [history] = useState<HistoryItem[]>(DUMMY_HISTORY);

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
        <div className="px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/"><Image src="/Socialtwin_o2.png" alt="Socialtwin" width={120} height={34} className="h-8 w-auto object-contain" /></Link>
            <div className="h-5 w-px bg-slate-200" />
            <div className="flex items-center gap-1.5">
              <User size={14} className="text-slate-500" />
              <span className="text-sm font-semibold text-slate-800">내 대시보드</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/design" className="flex items-center gap-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-lg transition-all">
              <Sparkles size={12} /> 새 분석 시작
            </Link>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-all">
              <LogOut size={12} /> 로그아웃
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ─── 사이드바 ── */}
        <aside className="w-56 bg-white border-r border-slate-100 flex flex-col py-4 px-3 flex-shrink-0">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">메뉴</p>
          <nav className="flex flex-col gap-1">
            <button onClick={() => setSideMenu("entrant")}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${sideMenu === "entrant" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>
              <Plane size={15} className={sideMenu === "entrant" ? "text-indigo-600" : "text-slate-400"} />
              <span>입국자 대시보드</span>
              {sideMenu !== "entrant" && <ChevronRight size={12} className="ml-auto text-slate-300" />}
            </button>
            <button onClick={() => setSideMenu("analysis")}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${sideMenu === "analysis" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>
              <BarChart2 size={15} className={sideMenu === "analysis" ? "text-indigo-600" : "text-slate-400"} />
              <span>분석 대시보드</span>
              {sideMenu !== "analysis" && <ChevronRight size={12} className="ml-auto text-slate-300" />}
            </button>
          </nav>
          <div className="mt-auto px-3">
            <div className="bg-indigo-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-indigo-800 mb-1">빠른 이동</p>
              <Link href="/design" className="flex items-center gap-1.5 text-xs text-indigo-600 hover:underline">
                <Sparkles size={10} /> 새 시장성 분석
              </Link>
            </div>
          </div>
        </aside>

        {/* ─── 메인 콘텐츠 ── */}
        <main className="flex-1 overflow-y-auto p-6">

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
                        <Zap size={11} /> AI 기반 시장성 조사
                      </div>
                      <h2 className="text-2xl font-bold text-white mb-3 leading-snug">
                        가상인구로 시장을<br />미리 검증하세요
                      </h2>
                      <p className="text-indigo-200 text-sm mb-8 leading-relaxed">
                        제품 정의와 조사 니즈를 입력하면 AI가 가설을 세우고<br />
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

                  {/* 분석 절차 안내 */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                    <h3 className="text-sm font-semibold text-slate-800 mb-5">분석 진행 순서</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { step: "01", icon: FileText, title: "정보 입력", desc: "산업 분류, 제품 정의,\n조사 니즈를 입력합니다." },
                        { step: "02", icon: Sparkles, title: "AI 설계", desc: "AI가 가설 3개와\n설문 문항을 자동 생성합니다." },
                        { step: "03", icon: BarChart2, title: "결과 확인", desc: "가상 패널 응답 결과와\n분석 리포트를 확인합니다." },
                      ].map(({ step, icon: Icon, title, desc }) => (
                        <div key={step} className="flex flex-col items-start gap-3 p-4 rounded-xl bg-slate-50">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-indigo-400 tracking-widest">{step}</span>
                            <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
                              <Icon size={13} className="text-indigo-600" />
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-800 mb-1">{title}</p>
                            <p className="text-[11px] text-slate-500 leading-relaxed whitespace-pre-line">{desc}</p>
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
                          <div key={item.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50">
                            <div className="min-w-0">
                              <p className="text-sm text-slate-800 font-medium truncate">{item.industry}</p>
                              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                                <span className="flex items-center gap-1"><MapPin size={9} />{item.sido}</span>
                                <span className="flex items-center gap-1"><Users size={9} />{item.sample_size}명</span>
                              </p>
                            </div>
                            <StatusBadge status={item.status} />
                          </div>
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
                      {history.map(item => (
                        <div key={item.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:border-indigo-200 transition-all">
                          <div className="flex items-start justify-between">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-slate-800 truncate">{item.industry}</p>
                              <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                                <span className="flex items-center gap-1"><MapPin size={10} />{item.sido}</span>
                                <span className="flex items-center gap-1"><Users size={10} />{item.sample_size}명</span>
                                <span className="flex items-center gap-1"><Clock size={10} />{fmtAgo(item.created_at)}</span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2 ml-4 flex-shrink-0">
                              <StatusBadge status={item.status} />
                              {item.status === "done" && (
                                <Link href={`/results/${item.id}`} className="text-xs text-indigo-600 hover:underline flex items-center gap-0.5">
                                  결과 보기 <ChevronRight size={10} />
                                </Link>
                              )}
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-2">{fmtDate(item.created_at)}</p>
                        </div>
                      ))}
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
        </main>
      </div>
    </div>
  );
}
