"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import {
  canInitializeHackle, disableHackle, initializeHackle, trackHacklePage,
  type HackleBrowserSDK,
  synchronizeHackleTracking,
} from "@/lib/hackle-analytics";

// Pin the official browser build; loading analytics never blocks the page.
const SDK_URL = "https://cdn2.hackle.io/npm/@hackler/javascript-sdk@12.2.1/lib/index.browser.umd.min.js";
const subscribeToMount = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export default function HackleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mounted = useSyncExternalStore(subscribeToMount, clientSnapshot, serverSnapshot);

  useEffect(() => {
    if (!mounted || !pathname) return;
    synchronizeHackleTracking();
    if (!canInitializeHackle()) return;
    trackHacklePage(pathname);
    const sdk = (window as Window & { Hackle?: HackleBrowserSDK }).Hackle;
    if (sdk) void initializeHackle(sdk);
  }, [pathname, searchParams, mounted]);

  if (!mounted || !canInitializeHackle()) return null;
  return (
    <Script
      id="hackle-sdk"
      src={SDK_URL}
      strategy="afterInteractive"
      onReady={() => {
        const sdk = (window as Window & { Hackle?: HackleBrowserSDK }).Hackle;
        if (sdk) void initializeHackle(sdk);
      }}
      onError={disableHackle}
    />
  );
}
