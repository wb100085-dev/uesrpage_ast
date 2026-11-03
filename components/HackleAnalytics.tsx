"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { attachHackleRelay, detachHackleRelay, handleHackleRelayMessage, hackleEnabled, retryHackleEvents, trackHacklePage } from "@/lib/hackle-analytics";

const subscribe = () => () => {};
export default function HackleAnalytics() {
  const pathname = usePathname();
  const search = useSearchParams();
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  useEffect(() => {
    if (!hackleEnabled()) return;
    window.addEventListener("message", handleHackleRelayMessage);
    window.addEventListener("vpg-auth-changed", retryHackleEvents);
    window.addEventListener("storage", retryHackleEvents);
    const timer = window.setInterval(retryHackleEvents, 5000);
    return () => {
      window.removeEventListener("message", handleHackleRelayMessage);
      window.removeEventListener("vpg-auth-changed", retryHackleEvents);
      window.removeEventListener("storage", retryHackleEvents);
      window.clearInterval(timer); detachHackleRelay();
    };
  }, []);
  useEffect(() => { if (mounted && pathname) trackHacklePage(pathname); }, [pathname, search, mounted]);
  if (!mounted || !hackleEnabled()) return null;
  // Static document avoids the app layout, GA tags, authentication URL and referrer.
  return <iframe src="/hackle-relay.html" title="분석 이벤트 전송" hidden tabIndex={-1} referrerPolicy="no-referrer" sandbox="allow-scripts allow-same-origin" onLoad={e => { const target = e.currentTarget.contentWindow; if (target) attachHackleRelay(target); }} />;
}
