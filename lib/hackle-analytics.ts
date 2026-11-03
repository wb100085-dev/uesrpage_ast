/** Product pages send only safe event data. The SDK runs in a no-referrer iframe. */
type Params = Record<string, string | number | boolean | undefined>;
type Properties = Record<string, string | number | boolean>;
type Envelope = { id: string; event: { key: string; properties: Properties }; createdAt: number; userId: string | null; dedupeKey?: string };
type Relay = Pick<Window, "postMessage">;
type Campaign = Record<string, string>;
type Stored = { queue: Envelope[]; seen: Record<string, number>; first: Campaign; last: Campaign };
type State = Stored & { target?: Relay; ready: boolean; lastPage?: string };
const KEY = process.env.NEXT_PUBLIC_HACKLE_SDK_KEY?.trim();
const PROTOCOL = "socialtwin-hackle-v2";
const STORE = `st.hackle.outbox.v2.${KEY?.slice(0, 8)}`;
const TTL = 7 * 24 * 60 * 60 * 1000;
const EVENT_KEYS: Record<string, string> = {
  "조사시작하기_클릭": "click_start_survey", "회원가입": "complete_signup", "로그인완료": "complete_login",
  "무료체험_실행": "click_run_free_trial", "조사실행_접수": "start_survey", "조사결과_조회": "view_survey_result",
  "결제진입": "begin_checkout", "결제완료": "complete_purchase", "문의하기_클릭": "click_contact",
  "상세보고서_다운로드": "download_detailed_report", "요약보고서_다운로드": "download_summary_report",
  "원본자료_다운로드": "download_raw_data", "상세보고서_생성요청": "request_detailed_report",
  "상세보고서_무료열람_로그인유도": "click_report_login", "무료열람링크_진입": "open_free_report_link",
};
const PROPERTY_KEYS: Record<string, string> = {
  "로그인여부": "auth_state", "방식": "method", "패널수": "panel_size", "무료체험": "is_free_trial",
  "화면": "screen", "금액": "amount", "상품": "product", "상품키": "product_key", "경로": "source", "버튼위치": "button_location",
};
const UTMS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "utm_id"];
const EVENTS = new Set(["page_view", ...Object.values(EVENT_KEYS)]);
const CRITICAL = new Set(["complete_purchase", "complete_signup"]);
const PROP_NAMES = new Set(["page_path", "auth_state", ...Object.values(PROPERTY_KEYS), ...UTMS.flatMap(k => [k, `first_${k}`, `last_${k}`])]);

function cleanProperties(value: unknown): Properties {
  if (!value || typeof value !== "object") return {};
  const result: Properties = {};
  for (const [key, v] of Object.entries(value)) {
    if (!PROP_NAMES.has(key)) continue;
    if (typeof v === "string") result[key] = v.slice(0, 1024);
    else if (typeof v === "boolean" || (typeof v === "number" && Number.isFinite(v))) result[key] = v;
  }
  return result;
}
function cleanCampaign(value: unknown): Campaign {
  const result: Campaign = {};
  if (!value || typeof value !== "object") return result;
  for (const [k, v] of Object.entries(value)) {
    // Campaign labels, never arbitrary URLs, emails or credentials.
    if (UTMS.includes(k) && typeof v === "string" && /^[a-zA-Z0-9가-힣._~-]{1,160}$/.test(v)) result[k] = v;
  }
  return result;
}
function memberId(): string | null {
  try {
    if (!window.localStorage.getItem("vpg.auth.access")) return null;
    const user = JSON.parse(window.localStorage.getItem("vpg.auth.user") || "null");
    const id = user?.pk ?? user?.id;
    return Number.isSafeInteger(id) && id > 0 ? `st-member-${id}` : null;
  } catch { return null; }
}
function readStored(): Stored {
  const result: Stored = { queue: [], seen: {}, first: {}, last: {} };
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORE) || "null");
    const now = Date.now();
    if (stored && Array.isArray(stored.queue)) {
      result.queue = stored.queue.filter((e: Envelope) => e && typeof e.id === "string" && e.id.length < 128 && EVENTS.has(e.event?.key) && e.createdAt > now - TTL && e.createdAt <= now && (e.userId === null || /^st-member-\d+$/.test(e.userId))).slice(-100).map((e: Envelope) => ({ id: e.id, event: { key: e.event.key, properties: cleanProperties(e.event.properties) }, createdAt: e.createdAt, userId: e.userId, ...(typeof e.dedupeKey === "string" ? { dedupeKey: e.dedupeKey.slice(0, 200) } : {}) }));
      if (stored.seen && typeof stored.seen === "object") result.seen = Object.fromEntries(Object.entries(stored.seen).filter(([,v]) => typeof v === "number" && v > now - TTL).slice(-1000)) as Record<string, number>;
      result.first = cleanCampaign(stored.first); result.last = cleanCampaign(stored.last);
    }
  } catch { /* Blocked/malformed storage leaves an in-memory queue. */ }
  return result;
}
function state(): State | undefined {
  if (!KEY || typeof window === "undefined") return;
  const browser = window as Window & { __socialtwinHackleV2?: State };
  return browser.__socialtwinHackleV2 ??= { ...readStored(), ready: false };
}
function persist(s: State): void {
  const stored = readStored();
  s.seen = { ...stored.seen, ...s.seen };
  const dedupe = new Set<string>();
  s.queue = [...new Map([...stored.queue, ...s.queue].map(e => [e.id, e])).values()].filter(e => {
    if (s.seen[`id:${e.id}`] || (e.dedupeKey && (s.seen[e.dedupeKey] || dedupe.has(e.dedupeKey)))) return false;
    if (e.dedupeKey) dedupe.add(e.dedupeKey);
    return e.createdAt > Date.now() - TTL;
  });
  while (s.queue.length > 100) {
    const normal = s.queue.findIndex(e => !CRITICAL.has(e.event.key));
    const [removed] = s.queue.splice(normal < 0 ? 0 : normal, 1);
    s.seen[`id:${removed.id}`] = Date.now();
  }
  s.seen = Object.fromEntries(Object.entries(s.seen).filter(([,at]) => at > Date.now() - TTL).sort((a,b) => a[1]-b[1]).slice(-1000));
  if (Object.keys(stored.first).length) s.first = stored.first;
  try { window.localStorage.setItem(STORE, JSON.stringify({ queue: s.queue, seen: s.seen, first: s.first, last: s.last })); } catch { /* Analytics never blocks the app. */ }
}
function attribution(s: State): Properties {
  const incoming = cleanCampaign(Object.fromEntries(new URLSearchParams(window.location.search)));
  if (Object.keys(incoming).length) {
    if (!Object.keys(s.first).length) s.first = incoming;
    s.last = incoming;
  }
  return { ...s.last, ...Object.fromEntries(Object.entries(s.first).map(([k,v]) => [`first_${k}`,v])), ...Object.fromEntries(Object.entries(s.last).map(([k,v]) => [`last_${k}`,v])) };
}
function pagePath(path: string): string {
  return path.replace(/^\/results\/[^/]+\/?$/, "/results/[id]").replace(/^\/survey\/[^/]+\/?$/, "/survey/[id]").replace(/^\/reset-password\/.*/, "/reset-password/[uid]/[token]");
}
function send(s: State, data: Record<string, unknown>): void {
  try { s.target?.postMessage({ protocol: PROTOCOL, ...data }, window.location.origin); } catch { /* Retry on next bridge load/tick. */ }
}
export function retryHackleEvents(): void {
  const s = state(); if (!s) return;
  if (!s.ready) { if (s.target) send(s, { type: "init", sdkKey: KEY }); return; }
  persist(s);
  const now = Date.now(); s.queue = s.queue.filter(e => e.createdAt > now - TTL);
  for (const { id, event, createdAt, userId } of s.queue) send(s, { type: "event", id, event, createdAt, userId });
  send(s, { type: "identify", userId: memberId() });
  persist(s);
}
export function attachHackleRelay(target: Relay): void {
  const s = state(); if (!s) return;
  s.target = target; s.ready = false;
  send(s, { type: "init", sdkKey: KEY });
}
export function detachHackleRelay(): void { const s = state(); if (s) { s.target = undefined; s.ready = false; } }
export function handleHackleRelayMessage(message: Pick<MessageEvent, "origin" | "source" | "data">): void {
  const s = state(); if (!s || message.origin !== window.location.origin || message.source !== s.target || message.data?.protocol !== PROTOCOL) return;
  if (message.data.type === "ready") { s.ready = true; retryHackleEvents(); }
  if (message.data.type === "ack" && typeof message.data.id === "string") {
    const item = s.queue.find(e => e.id === message.data.id);
    if (!item) return;
    if (item.dedupeKey) s.seen[item.dedupeKey] = Date.now();
    s.seen[`id:${item.id}`] = Date.now();
    s.queue = s.queue.filter(e => e.id !== item.id);
    persist(s);
  }
}
function enqueue(key: string, properties: Properties, dedupeKey?: string): boolean {
  const s = state(); if (!s) return false;
  const latest = readStored();
  if (Object.keys(latest.first).length) s.first = latest.first;
  if (Object.keys(latest.last).length) s.last = latest.last;
  persist(s);
  if (dedupeKey && (s.seen[dedupeKey] || s.queue.some(e => e.dedupeKey === dedupeKey))) return true;
  const userId = memberId();
  const item: Envelope = { id: crypto.randomUUID(), createdAt: Date.now(), event: { key, properties: { ...attribution(s), auth_state: userId ? "로그인" : "비로그인", ...properties } }, userId, ...(dedupeKey ? { dedupeKey: dedupeKey.slice(0,200) } : {}) };
  s.queue.push(item);
  persist(s);
  if (s.ready && s.queue.some(e => e.id === item.id)) send(s, { type: "event", id: item.id, event: item.event, createdAt: item.createdAt, userId: item.userId });
  return true;
}
export function trackHackleEvent(name: string, params: Params = {}, options: { dedupeKey?: string } = {}): boolean {
  const key = Object.hasOwn(EVENT_KEYS, name) ? EVENT_KEYS[name] : undefined;
  if (!key || typeof window === "undefined") return false;
  const mapped = Object.fromEntries(Object.entries(PROPERTY_KEYS).map(([a,b]) => [b,params[a]]));
  return enqueue(key, { ...cleanProperties(mapped), page_path: pagePath(window.location.pathname) }, options.dedupeKey);
}
export function trackHacklePage(pathname: string): boolean {
  const s = state(); if (!s || s.lastPage === pathname) return false;
  if (/^\/(auth\/callback|reset-password|free-report|checkout\/success)(\/|$)/.test(pathname)) return false;
  const queued = enqueue("page_view", { page_path: pagePath(pathname) });
  if (queued) s.lastPage = pathname;
  return queued;
}
export function hackleEnabled(): boolean { return !!KEY; }
