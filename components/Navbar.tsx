"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, Menu, User, X } from "lucide-react";
import {
  authLogout,
  getAccessToken,
  getCachedUser,
  type AuthUser,
} from "@/lib/auth-api";

export default function Navbar({ dark = false, appMode = false }: { dark?: boolean; appMode?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  // null = 아직 hydration 전(SSR 미스매치 방지용), AuthUser | "guest" 가 확정 상태
  const [authState, setAuthState] = useState<AuthUser | "guest" | null>(null);

  useEffect(() => {
    const refresh = () => {
      const tok = getAccessToken();
      const user = getCachedUser();
      setAuthState(tok && user ? user : "guest");
    };
    refresh();
    // 다른 탭/창에서 로그인·로그아웃이 일어났을 때 동기화
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, []);

  async function handleLogout() {
    await authLogout();
    setAuthState("guest");
    router.push("/");
  }

  const linkCls = dark
    ? "text-slate-400 hover:text-white"
    : "text-slate-500 hover:text-slate-900";

  const borderCls = dark ? "border-white/8" : "border-slate-100";
  const bgCls = dark
    ? "bg-slate-950/80 backdrop-blur-xl"
    : "bg-white/90 backdrop-blur-xl";

  const isUser = authState && authState !== "guest";

  return (
    <header className={`sticky top-0 z-50 border-b ${borderCls} ${bgCls}`}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo — appMode(앱 내부 페이지)에서는 클릭 비활성 */}
        {appMode ? (
          <span className="flex items-center">
            <Image
              src="/Socialtwin_o2.png"
              alt="Socialtwin"
              width={140}
              height={40}
              className="h-10 w-auto object-contain select-none"
            />
          </span>
        ) : (
          <Link href="/" className="flex items-center group">
            <Image
              src="/Socialtwin_o2.png"
              alt="Socialtwin"
              width={140}
              height={40}
              className="h-10 w-auto object-contain"
            />
          </Link>
        )}

        {/* Desktop nav */}
        {!appMode && (
          <nav className="hidden md:flex items-center gap-7">
            {[
              { label: "진행 순서", href: "/#how", external: false },
              { label: "차별성", href: "/#features", external: false },
              { label: "활용", href: "/#use-cases", external: false },
              { label: "(주)옴니노드", href: "https://www.omninode.kr", external: true },
            ].map((item) =>
              item.external ? (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className={`text-sm font-medium transition-colors ${linkCls}`}
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`text-sm font-medium transition-colors ${linkCls}`}
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>
        )}

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          {/* authState === null 인 동안은 자리만 잡고 깜빡임을 피한다 */}
          {authState === null ? (
            <div className="h-8 w-40" />
          ) : isUser ? (
            <>
              {appMode ? (
                <Link
                  href="/dashboard/user"
                  className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-all"
                  title={authState.email}
                >
                  <LayoutDashboard size={14} />
                  대시보드
                </Link>
              ) : (
                <Link
                  href="/dashboard/user"
                  className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${linkCls}`}
                  title={authState.email}
                >
                  <User size={14} />
                  <span className="max-w-[160px] truncate">
                    {authState.email || authState.username}
                  </span>
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all"
              >
                <LogOut size={14} />
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${linkCls}`}
              >
                로그인
              </Link>
              <Link
                href="/design"
                className="text-sm font-semibold px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-all hover:shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-px"
              >
                무료 체험하기
              </Link>
            </>
          )}
        </div>

        {/* Mobile */}
        <button
          onClick={() => setOpen(!open)}
          className={`md:hidden p-2 rounded-lg ${dark ? "text-white" : "text-slate-700"}`}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div
          className={`md:hidden border-t ${borderCls} ${
            dark ? "bg-slate-950" : "bg-white"
          } px-6 py-5 flex flex-col gap-4`}
        >
          {!appMode && (
            <>
              {[
                { label: "진행 순서", href: "/#how" },
                { label: "차별성", href: "/#features" },
                { label: "활용", href: "/#use-cases" },
              ].map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={`text-sm font-medium text-left ${linkCls}`}
                >
                  {l.label}
                </a>
              ))}
              <a
                href="https://www.omninode.kr"
                target="_blank"
                rel="noreferrer"
                onClick={() => setOpen(false)}
                className={`text-sm font-medium text-left ${linkCls}`}
              >
                (주)옴니노드
              </a>
            </>
          )}
          {isUser ? (
            <>
              <Link
                href="/dashboard/user"
                onClick={() => setOpen(false)}
                className="mt-1 text-sm font-semibold px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-center"
              >
                내 대시보드
              </Link>
              <button
                onClick={() => {
                  setOpen(false);
                  handleLogout();
                }}
                className="text-sm font-medium px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700"
              >
                로그아웃
              </button>
            </>
          ) : (
            <Link
              href="/design"
              onClick={() => setOpen(false)}
              className="mt-1 text-sm font-semibold px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-center"
            >
              무료 체험하기
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
