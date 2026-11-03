import { pauseHackleTracking } from "./lib/hackle-analytics";

// Next.js invokes this before push/replace/traverse, not after URL mutation.
// Pause native SDK engagement/error events until a safe route is committed.
export function onRouterTransitionStart(url: string) {
  try {
    const current = new URL(window.location.href);
    const target = new URL(url, current);
    // Same-page/hash-only transitions do not rerun the pathname/search effect.
    if (target.origin === current.origin && target.pathname === current.pathname && target.search === current.search) return;
  } catch {
    // Unknown destinations stay conservative; never let analytics block routing.
  }
  pauseHackleTracking();
}
