/** Hackle browser bridge. Existing GA4 names are mapped to stable event keys. */
type Params = Record<string, string | number | boolean | undefined>;
type HackleEvent = { key: string; properties: Record<string, string | number | boolean> };

export interface HackleBrowserSDK {
  createInstance(key: string, config: {
    automaticPageTracking: boolean;
    automaticRouteTracking: boolean;
    optOutTracking: boolean;
  }): {
    onInitialized(): Promise<void>;
    track(event: HackleEvent): void;
    setOptOutTracking(value: boolean): void;
  };
}

type State = {
  queue: HackleEvent[];
  client?: ReturnType<HackleBrowserSDK["createInstance"]>;
  initializing?: Promise<void>;
  disabled: boolean;
  ready: boolean;
  paused: boolean;
  lastPage?: string;
};

const SDK_KEY = process.env.NEXT_PUBLIC_HACKLE_SDK_KEY?.trim();
const MAX_QUEUE = 100;
const EVENT_KEYS: Record<string, string> = {
  "조사시작하기_클릭": "click_start_survey",
  "회원가입": "complete_signup",
  "무료체험_실행": "click_run_free_trial",
  "조사실행_접수": "start_survey",
  "조사결과_조회": "view_survey_result",
  "결제완료": "complete_purchase",
  "문의하기_클릭": "click_contact",
  "상세보고서_다운로드": "download_detailed_report",
  "요약보고서_다운로드": "download_summary_report",
  "원본자료_다운로드": "download_raw_data",
  "상세보고서_생성요청": "request_detailed_report",
  "상세보고서_무료열람_로그인유도": "click_report_login",
  "무료열람링크_진입": "open_free_report_link",
};
const PROPERTY_KEYS: Record<string, string> = {
  "로그인여부": "auth_state", "방식": "method", "패널수": "panel_size",
  "무료체험": "is_free_trial", "화면": "screen", "금액": "amount",
  "상품": "product", "경로": "source",
};
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "utm_id"];

function state(): State | undefined {
  if (!SDK_KEY || typeof window === "undefined") return;
  const browser = window as Window & { __socialtwinHackle?: State };
  return browser.__socialtwinHackle ??= { queue: [], disabled: false, ready: false, paused: false };
}

function pagePath(pathname: string): string {
  return pathname
    .replace(/^\/results\/[^/]+\/?$/, "/results/[id]")
    .replace(/^\/survey\/[^/]+\/?$/, "/survey/[id]")
    .replace(/^\/reset-password\/.*/, "/reset-password/[uid]/[token]");
}

function containsCredentials(value: string): boolean {
  let decoded = value;
  for (let depth = 0; depth < 5; depth++) {
    if (/(?:^|\/)(auth\/callback|reset-password|free-report|checkout\/success)(?:[/?#]|$)/i.test(decoded)) return true;
    if (/(?:^|[?&])(access|refresh|token|pass|password|password1|password2|paymentkey|email|username|code)=/i.test(decoded)) return true;
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) return false;
      decoded = next;
    } catch {
      return true;
    }
  }
  return true; // Deeply nested/encoded URLs fail closed.
}

/** Include nested return URLs and referrers: SDK metadata collects both. */
export function canInitializeHackle(): boolean {
  const current = state();
  if (!current || current.disabled) return false;
  const { pathname, search } = window.location;
  if (containsCredentials(pathname + search)) return false;
  for (const value of new URLSearchParams(search).values()) {
    if (containsCredentials(value)) return false;
  }
  if (typeof document !== "undefined" && containsCredentials(document.referrer)) return false;
  return true;
}

function flush(current: State): void {
  if (!current.client || !current.ready || current.paused || !canInitializeHackle()) return;
  while (current.queue.length) {
    const event = current.queue.shift()!;
    try {
      current.client.track(event);
    } catch {
      // Analytics failures must not interrupt signup, surveys or checkout.
    }
  }
}

function enqueue(event: HackleEvent): boolean {
  const current = state();
  if (!current || current.disabled) return false;
  current.queue.push(event);
  if (current.queue.length > MAX_QUEUE) current.queue.shift();
  flush(current);
  return true;
}

export function trackHackleEvent(name: string, params: Params = {}): boolean {
  const key = Object.hasOwn(EVENT_KEYS, name) ? EVENT_KEYS[name] : undefined;
  if (!key || typeof window === "undefined") return false;
  const properties: HackleEvent["properties"] = {};
  for (const [source, target] of Object.entries(PROPERTY_KEYS)) {
    const value = params[source];
    if (typeof value === "string") properties[target] = value.slice(0, 1024);
    else if (typeof value === "boolean" || (typeof value === "number" && Number.isFinite(value))) properties[target] = value;
  }
  properties.page_path = pagePath(window.location.pathname);
  return enqueue({ key, properties });
}

export function trackHacklePage(pathname: string): boolean {
  const current = state();
  if (!current || !canInitializeHackle()) return false;
  if (current.lastPage === pathname) { flush(current); return false; }
  const properties: HackleEvent["properties"] = { page_path: pagePath(pathname) };
  const search = new URLSearchParams(window.location.search);
  for (const key of UTM_KEYS) {
    const value = search.get(key);
    if (value) properties[key] = value.slice(0, 1024);
  }
  const queued = enqueue({ key: "page_view", properties });
  if (queued) current.lastPage = pathname;
  return queued;
}

export function initializeHackle(sdk: HackleBrowserSDK): Promise<void> {
  const current = state();
  if (!current || !canInitializeHackle()) return Promise.resolve();
  if (current.initializing) { flush(current); return current.initializing; }
  current.initializing = (async () => {
    try {
      const client = sdk.createInstance(SDK_KEY!, {
        automaticPageTracking: false,
        automaticRouteTracking: false,
        optOutTracking: true,
      });
      current.client = client;
      await client.onInitialized();
      if (current.disabled) return;
      current.ready = true;
      client.setOptOutTracking(current.paused || !canInitializeHackle());
      flush(current);
    } catch {
      disableHackle();
    }
  })();
  return current.initializing;
}

/** Called by Next before a route transition, before URL credentials can appear. */
export function pauseHackleTracking(): void {
  const current = state();
  if (!current) return;
  current.paused = true;
  current.client?.setOptOutTracking(true);
}

/** Resume only after React commits a safe route; native SDK events stay paused too. */
export function synchronizeHackleTracking(): void {
  const current = state();
  if (!current) return;
  current.paused = !canInitializeHackle();
  current.client?.setOptOutTracking(!current.ready || current.paused);
  flush(current);
}

export function disableHackle(): void {
  const current = state();
  if (!current) return;
  current.disabled = true;
  current.client?.setOptOutTracking(true);
  current.queue.length = 0;
  current.client = undefined;
}
