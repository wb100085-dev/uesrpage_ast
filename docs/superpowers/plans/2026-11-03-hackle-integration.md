# Hackle Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Connect SocialTwin events to Hackle while preserving GA4.
**Architecture:** A small browser bridge queues sanitized mapped events until the official SDK is ready; a client-only component loads it after hydration and reports normalized route views. Existing conversion emitters are reused and survey acknowledgements/results receive two explicit signals.
**Tech Stack:** Next.js 16.2.4, React 19.2.4, TypeScript, Hackle browser SDK 12.2.1 CDN, Node test runner.
**Spec:** docs/superpowers/specs/2026-11-03-hackle-design.md

## Global Constraints
- Keep GA4 event names and behavior intact.
- No customer profile, free-text research or credential data in custom Hackle payloads.
- No deployment or unrelated changes.

## Review Focus
- Early events must survive asynchronous initialization.
- CDN/init failure must preserve GA4 and application behavior.
- Missing configuration must cause no third-party initialization.
- Sensitive routes must not initialize/flush SDK; custom paths exclude identifiers/query strings.
- Only successful API responses produce survey start/result signals.

### Task 1: Bridge and client initialization
**Files:** lib/hackle-analytics.ts, lib/analytics.ts, components/HackleAnalytics.tsx, app/layout.tsx, tests/hackle-analytics.test.cjs
**Interfaces:** trackHackleEvent(name, params): boolean; trackHacklePage(pathname): boolean; initializeHackle(sdk): Promise<void>; disableHackle(): void.
- [x] Write tests exercising real bridge behavior against a minimal external SDK receiver: readiness queue, missing key, failures, normalization, safe routes, GA4 independence.
- [x] Run node --test tests/hackle-analytics.test.cjs and observe failing coverage.
- [x] Implement bridge and deferred Script component; add component to root layout.
- [x] Rerun tests; run targeted lint and TypeScript check.

### Task 2: Successful survey lifecycle and operator configuration
**Files:** app/design/page.tsx, app/results/[id]/page.tsx, README.md, .env.example
**Interfaces:** trackEvent('조사실행_접수', {패널수, 무료체험}); trackEvent('조사결과_조회', {패널수, 화면}).
- [x] Verify instrumentation points after successful run response and after successful result load.
- [x] Add events and document key setup, event map and browser identification scope.
- [x] Run the test suite, lint/type checks and production build; smoke-test local routes.
- [x] Review final diff, apply only reviewed changed files to the authorized userpage project, preserving concurrent work.

## Verification record (2026-11-03)

- Original userpage: 13 Node regression tests pass; targeted lint and type checking pass.
- Production `npm run build` passes with all 27 static pages, including pre-existing preview routes.
- Full tracked-source lint has pre-existing diagnostics (21 errors, 11 warnings); diagnostics in modified existing pages match the pre-change baseline.
- Hackle development dashboard received real page_view and click_start_survey from local Chrome.
- Independent review findings (nested credentials, native SDK opt-out, same-URL navigation) fixed and regression-tested; final review has no blocker.
- Added instrumentation-client.ts to pause native SDK events before routing; root route/search commit resumes only on safe URLs.
- Source applied to user-provided folder with concurrent-edit checks and backup; development/production App/Browser keys are in ignored environment files.
- Production hosting deployment is pending; no commit/push/deployment performed.
