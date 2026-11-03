# SocialTwin Hackle integration

Authorized scope: connect the existing SocialTwin frontend to Hackle and measure acquisition through successful survey results. Reuse the existing GA4 event helper; existing GA4 names and behavior stay intact. Initial integration uses browser device identification, not customer profile fields.

Approaches: reuse existing event instrumentation (selected, minimal surface area); replace GA4 (rejected, loses current reporting); instrument every button independently (rejected, duplicates existing instrumentation).

Use the official browser SDK 12.2.1, deferred through next/script, gated by NEXT_PUBLIC_HACKLE_SDK_KEY. Disable automatic page/route collection and emit a custom page_view with normalized pathname plus allowlisted UTM attribution. Do not initialize/flush on authentication callbacks, reset-password paths, or URLs containing credentials/payment keys. Hold safe event payloads until a safe route is available. Missing key, CDN failure, SDK initialization failure or blocked storage must not break the application or GA4. Bound the in-memory queue.

Add server-acknowledged start_survey and view_survey_result events; never emit successful start before the run API succeeds, or successful result before results are loaded. Preserve unrelated files and existing untracked work. Do not deploy or change account permissions in this task.
