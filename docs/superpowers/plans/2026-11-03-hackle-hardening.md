# Hackle hardening

User authorized fixing audited analytics gaps and deployment. Preserve existing GA4 event names and unrelated user work.

Design: use one same-origin static iframe with no referrer for the official SDK. Parent passes only allowlisted events, public browser SDK key, pseudonymous numeric member key and campaign labels. SDK never sees authentication/payment documents. A bounded durable outbox plus acknowledgements handles reload/closed-tab startup loss. Alternatives rejected: memory-only deferral loses conversions; a new backend collector adds server credentials and expands scope. Analytics stays best-effort, not an accounting ledger.

Tasks:
- [x] Reproduce loss, attribution, user identity, origin validation and payment-helper gaps with behavior tests.
- [x] Implement clean relay, persistent queue, account switching/reset and first/last UTM attribution.
- [x] Wire desktop/mobile CTA and server-accepted checkout/payment hooks; remove obsolete parent SDK and router pause.
- [x] Test, lint, typecheck, build, independent review; apply only task files to original checkout.
- [ ] Commit/push, verify Vercel Ready and production events.
- [ ] Apply Korean event aliases/descriptions and create real SocialTwin funnel reports in Chrome.

Review focus: credential/referrer leakage, iframe recursion or duplicate GA, forged messages, closure/retry recovery, duplicate purchases, account switching/logout, attribution, storage failures and bounds.

Verification: 13/13 Node tests; targeted lint and TypeScript pass; original Turbopack production build passes. Independent review fixed the real SDK getUser contract (RED→GREEN) and social conversion ordering after profile cache refresh. Browser verification found the official CDN redirects to jsDelivr; CSP includes both verified origins. SDK acknowledgement is handoff, not server delivery, documented in README.
