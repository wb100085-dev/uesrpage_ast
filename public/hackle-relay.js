/* The SDK runs only in this static document: never read parent URLs or profiles. */
(() => {
  "use strict";
  const protocol = "socialtwin-hackle-v2";
  if (window.parent === window) return;
  const origin = window.location.origin;
  const keys = new Set(["page_view","click_start_survey","complete_signup","complete_login","click_run_free_trial","start_survey","view_survey_result","begin_checkout","complete_purchase","click_contact","download_detailed_report","download_summary_report","download_raw_data","request_detailed_report","click_report_login","open_free_report_link"]);
  const names = new Set(["page_path","auth_state","method","panel_size","is_free_trial","screen","amount","product","product_key","source","button_location"]);
  for (const k of ["utm_source","utm_medium","utm_campaign","utm_content","utm_term","utm_id"]) for (const prefix of ["","first_","last_"]) names.add(prefix+k);
  let client, initializing, chain = Promise.resolve();
  let userId = null;
  let storeKey;
  let delivered = {};
  const reply = data => window.parent.postMessage({ protocol, ...data }, origin);
  const validUser = id => id === null || (typeof id === "string" && /^st-member-\d+$/.test(id));
  async function identify(next) {
    if (!validUser(next) || next === userId) return;
    if (userId !== null) await client.resetUser();
    if (next !== null) await client.setUserId(next);
    userId = next;
  }
  async function init(key) {
    if (initializing) { await initializing; reply({type:"ready"}); return; }
    initializing = (async () => {
      storeKey = "st.hackle.relay.seen." + key.slice(0,8);
      try { delivered = JSON.parse(localStorage.getItem(storeKey) || "{}"); } catch { delivered = {}; }
      if (!delivered || typeof delivered !== "object" || Array.isArray(delivered)) delivered = {};
      await new Promise((resolve,reject) => {
        const script = document.createElement("script");
        script.src = "https://cdn2.hackle.io/npm/@hackler/javascript-sdk@12.2.1/lib/index.browser.umd.min.js";
        script.onload = resolve; script.onerror = reject; document.head.appendChild(script);
      });
      client = window.Hackle.createInstance(key, {automaticPageTracking:false,automaticRouteTracking:false,optOutTracking:true});
      await client.onInitialized();
      userId = client.getUser().userId || null;
      client.setOptOutTracking(false);
      reply({type:"ready"});
    })();
    try { await initializing; } catch { console.warn('[Hackle] 분석 연결을 재시도합니다.'); initializing = undefined; client = undefined; }
  }
  window.addEventListener("message", event => {
    if (event.source !== window.parent || event.origin !== origin || event.data?.protocol !== protocol) return;
    const data = event.data;
    if (data.type === "init" && typeof data.sdkKey === "string" && /^[a-zA-Z0-9_-]{8,128}$/.test(data.sdkKey)) { void init(data.sdkKey); return; }
    if (!client) return;
    chain = chain.then(async () => {
      if (data.type === "identify") { await identify(data.userId); return; }
      if (data.type !== "event" || typeof data.id !== "string" || data.id.length > 128 || !keys.has(data.event?.key) || !validUser(data.userId) || !Number.isFinite(data.createdAt) || data.createdAt < Date.now()-604800000 || data.createdAt > Date.now()+60000) return;
      try { const shared = JSON.parse(localStorage.getItem(storeKey) || "{}"); if (shared && typeof shared === "object" && !Array.isArray(shared)) delivered = {...shared,...delivered}; } catch { /* In-memory receipts still deduplicate retries. */ }
      if (delivered[data.id]) { reply({type:"ack",id:data.id}); return; }
      const properties = {};
      for (const [k,v] of Object.entries(data.event.properties || {})) {
        if (!names.has(k)) continue;
        if (typeof v === "string") properties[k] = v.slice(0,1024);
        else if (typeof v === "boolean" || (typeof v === "number" && Number.isFinite(v))) properties[k] = v;
      }
      await identify(data.userId);
      client.track({key:data.event.key,properties});
      delivered[data.id] = Date.now();
      delivered = Object.fromEntries(Object.entries(delivered).filter(([,at]) => typeof at === "number" && at > Date.now()-604800000).slice(-1000));
      try { localStorage.setItem(storeKey,JSON.stringify(delivered)); } catch { /* Browser storage may be unavailable. */ }
      reply({type:"ack",id:data.id});
    }).catch(() => { /* No acknowledgement: parent retries its durable outbox. */ });
  });
})();
