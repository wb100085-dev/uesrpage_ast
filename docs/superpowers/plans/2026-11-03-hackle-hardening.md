# Hackle hardening

User authorized fixing audited analytics gaps and deployment. Preserve existing GA4 event names and unrelated user work.

Design: use one same-origin static iframe with no referrer for the official SDK. Parent passes only allowlisted events, public browser SDK key, pseudonymous numeric member key and campaign labels. SDK never sees authentication/payment documents. A bounded durable outbox plus acknowledgements handles reload/closed-tab startup loss. Alternatives rejected: memory-only deferral loses conversions; a new backend collector adds server credentials and expands scope. Analytics stays best-effort, not an accounting ledger.

Tasks:
- [x] Reproduce loss, attribution, user identity, origin validation and payment-helper gaps with behavior tests.
- [x] Implement clean relay, persistent queue, account switching/reset and first/last UTM attribution.
- [x] Wire desktop/mobile CTA and server-accepted checkout/payment hooks; remove obsolete parent SDK and router pause.
- [x] Test, lint, typecheck, build, independent review; apply only task files to original checkout.
- [x] Commit/push, verify Vercel Ready and production events.
- [x] Apply Korean event aliases/descriptions and create real SocialTwin funnel reports in Chrome.

Review focus: credential/referrer leakage, iframe recursion or duplicate GA, forged messages, closure/retry recovery, duplicate purchases, account switching/logout, attribution, storage failures and bounds.

Verification: 13/13 Node tests; targeted lint and TypeScript pass; original Turbopack production build passes. Independent review fixed the real SDK getUser contract (RED→GREEN) and social conversion ordering after profile cache refresh. Browser verification found the official CDN redirects to jsDelivr; CSP includes both verified origins. SDK acknowledgement is handoff, not server delivery, documented in README.

Completed: 266e5cb pushed to main; Vercel deployment 2Mz6M1nMeuXguQB7UqTmVgjPt9e5 Ready. Development raw event confirmed button_location=상단메뉴 plus naver_blog attribution; production raw event confirmed st-member-1, threads attribution and button_location=본문. No live charge was performed.

Hackle: 16 event aliases/descriptions registered. Real report https://dashboard.hackle.io/workspaces/118048/reports/63864 includes activation funnel (chart46012, unified identity, 7-day completion, last30days), checkout-to-approval funnel, and channel-grouped unique users for page_view/complete_signup/start_survey/complete_purchase. Initial data includes verification traffic: do not interpret as marketing performance until real traffic accumulates.

Sigmine shared instructions now require naver_blog/threads source, organic_social medium, modu campaign and unique per-post content. Saved via UI without publishing, scheduling or changing automatic approval. Applies to newly started/resumed conversations.
