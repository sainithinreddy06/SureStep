# TerraGuard AI (SureStep) — Phase 0 Audit Snapshot

- **Date:** 2026-11-27
- **Repository:** `sainithinreddy06/SureStep`
- **Working branch / baseline:** `v0/phase-0-audit` at `97b8b12` (`Set Render Python version`; shallow checkout)
- **Production URL:** https://terra-guard-ai-five.vercel.app
- **Status:** Evidence-based baseline; not a security certification or go-live approval.

## Scope and method

Reviewed repository instructions and tracked project structure; README, frontend/backend/ML manifests and environment examples; key React pages, GPS/session/weather/risk/hazard/storage/Firebase services; Express and FastAPI handlers; training/evaluation scripts and model notes; Firebase rules; Vite/Vercel setup; and relevant styles/assets. No pre-existing `AGENTS.md`, automated test suite, or GitHub Actions workflow was found. Model binaries were treated as artifacts, not opened as text. The Ponytail skill was not available in the provided skill catalog or workspace search; see the blocker in `AGENTS.md`.

Inspected the deployed landing/dashboard in the browser, including representative 320 px and 1920 px map views, and checked production API paths with read-only GET requests. Inspected Vercel project settings through the CLI. Ran local TypeScript/build checks and isolated local API smoke tests with synthetic values; no Gemini request or production deployment was made.

### Verification baseline

- Frontend `npm run lint` (TypeScript `--noEmit`) and `npm run build`: pass. Build emits a large-chunk warning; the main JS asset is approximately **995 kB minified / 293 kB gzip**.
- Backend `npm run lint` (TypeScript `--noEmit`): pass. This is type-checking, not a lint-rule suite.
- Dependency audit: npm reported **7 high** frontend findings and **1 high + 1 moderate** backend findings. Review fixes and compatibility before upgrading; do not blindly apply the suggested Firebase major downgrade.
- Local Express → ML health: HTTP 200, model loaded. Synthetic valid inference: HTTP 200, `LOW`, confidence `83`; this is not validation of safety or calibration. ML startup warns that the serialized model was produced with scikit-learn **1.8.0** but requirements pin **1.6.1**.
- Invalid synthetic elevation (`20000`) through the Express ML proxy returned HTTP **502** with FastAPI’s “less than or equal to 10000” validation detail; this should be a client validation error, not an upstream failure.
- Local synthetic camera-analysis request without Gemini credentials returned HTTP 200 with three fabricated target scores (**94, 67, 12**). Local Ranger AI fallback returned HTTP 200 with `isFallback: true` and generic guidance. A local USGS request for synthetic coordinates returned HTTP 200 and zero events; this does not test upstream outage behavior.
- Production GETs to `/api/ml/health` and `/api/natural-hazards` returned **404**. Vercel inspection reports project root `frontend`, Vite, build `npm run build`, and no server-side API functions in that deployment configuration.
- Browser lab metrics were approximately TTFB **2.2 ms**, FCP/LCP **132 ms**, CLS **0**, with INP unavailable. These are a single sandbox run, not field performance. The captured 320 px UI showed tightly packed controls and low-contrast status text; representative screenshots are not a full responsive/accessibility pass.

## Prioritized findings

Severity: **P0** = immediate safety/privacy stop-use risk; **P1** = high-priority correctness/security/reliability; **P2** = important quality/maintainability. Status is **Confirmed**, **Suspected**, or **Unverified** based on the evidence available.

### P0 — DB-01: Firestore permits anonymous read/write

- **Status:** Confirmed in rules; no exploit or production write test was performed.
- **Affected:** `frontend/firestore.rules`, `frontend/src/services/firebase.ts`, client incident/scan flows.
- **Evidence / reproduction:** Inspect rules: `trail_incidents` and `ground_scans` allow `read, write` unconditionally. The UI has no authenticated-user boundary.
- **Risk:** Anyone with the client configuration can read, create, alter, or delete records, including location-bearing reports/scans. Report verification counts and data provenance are not trustworthy.
- **Proposed solution:** Default-deny rules; choose an explicit authenticated and ownership/moderation model. Validate fields and ownership on writes. If public reports are intended, accept them through a rate-limited server path with moderation rather than unauthenticated direct writes.
- **Verification:** Firebase Emulator tests prove unauthenticated reads/writes fail and authorized cases are narrowly scoped. Test only with synthetic data in an isolated Firebase project. Do not migrate or clean production data without approval and a backup plan.

### P0 — SAF-01: Demonstration GPS/terrain values are presented as live

- **Status:** Confirmed in source and deployed UI.
- **Affected:** `frontend/src/App.tsx`, `frontend/src/services/riskEngine.ts`, map/vision/dashboard components, mock trail data.
- **Evidence / reproduction:** Load the app without supplying a real location. The app initializes simulated coordinates and terrain values; the deployed UI displays fixed coordinates and “LIVE GPS,” along with elevation, heading, slope and “solid step” guidance. The landing page advertises 96% step confidence and camera-based placement. The browser harness also recorded a camera `NotFoundError` during initial page load; physical-device permission behavior remains unverified.
- **Risk:** A person could make a real outdoor decision from mock coordinates or unvalidated terrain output.
- **Proposed solution:** Make demo mode an explicit user choice, visually persistent and impossible to confuse with live mode. In live mode, represent absent GPS/weather/terrain as unavailable; remove unsupported foot-placement and physical-safety claims. State that the app is experimental and not an emergency or route-safety authority.
- **Verification:** Automated tests cover permission granted/denied/unavailable, missing and invalid coordinates, and stale timestamps. Browser tests prove no simulated values are labelled live and no safety recommendation is emitted when inputs are missing.

### P0 — SAF-02: Service failures can produce fabricated hazard and vision success

- **Status:** Confirmed in source; camera fallback reproduced locally with synthetic input.
- **Affected:** `backend/server.ts`, `frontend/src/components/NaturalHazardAlerts.tsx`, `frontend/src/components/GroundVision.tsx`, `frontend/src/services/yoloService.ts`.
- **Evidence / reproduction:** Natural-hazard upstream failure returns a scripted earthquake with a success response. The local `/api/analyze-footsteps` fallback returned a normal grip label and three target safety scores for an invalid synthetic image when Gemini was unavailable. UI copy presents exact foot-placement/friction advice.
- **Risk:** A generated fallback can be mistaken for a verified USGS event or a trustworthy surface assessment.
- **Proposed solution:** Fail closed to explicit `unavailable` states. Never synthesize events, object locations, safety classifications, or foot placements in live mode. Restrict any vision experiment to clearly labelled, non-authoritative descriptions and disclose uncertainty.
- **Verification:** Deterministic tests force timeouts, malformed upstream responses, missing credentials and invalid images; the UI shows unavailable, emits no synthetic event/score, and never uses an HTTP success response to conceal failure.

### P0 — DB-02: Opening incident history can seed production with fixtures

- **Status:** Confirmed code path; whether it ran in production is **Unverified**.
- **Affected:** `frontend/src/services/firebase.ts`, `frontend/src/components/HistoricalIncidentDatabase.tsx`.
- **Evidence / reproduction:** The history loader writes four hard-coded sample incidents when its collection is empty. The live Risk & Weather view was opened during this audit, which invokes the loader. No report was submitted and no manual Firestore write was made; whether the live collection was empty or the seed executed is unknown.
- **Risk:** Browsing the feature can contaminate production records with fictional incidents.
- **Proposed solution:** Remove automatic production seeding. Put fixtures in tests/demo mode or an emulator only. Add an explicit source/provenance field and admin-only import path if seed data is genuinely needed.
- **Verification:** Empty-collection tests prove ordinary reads are side-effect-free; production configuration cannot seed. Before any cleanup, inspect with the owner’s approval and preserve a backup. No production records were queried or changed intentionally in this audit.

### P1 — DEP-01: Production API routes do not resolve

- **Status:** Confirmed by Vercel configuration and read-only production GETs.
- **Affected:** `frontend/vite.config.ts`, Vercel project settings, `backend/server.ts`, `ml-service/main.py`.
- **Evidence / reproduction:** Production `/api/ml/health` and `/api/natural-hazards` return 404. Vercel serves the Vite frontend from `frontend`; the development proxy does not create production routes. The configured Vercel project ID (`prj_mfOx94v1aGxCGBKLIJatopRMF29B`) differs from the chat-linked ID (`prj_2rRn8AZHgNZzUofpqVaJRTFCFTha`).
- **Risk:** Production UI can report empty/unavailable services while backend/ML are not reachable; future deployment work may target the wrong project.
- **Proposed solution:** Reconcile the project link with the owner. Document actual Render/backend/ML service ownership and production URLs. Add an explicit production routing/health design only after service ownership is confirmed; do not deploy or alter infrastructure in this audit.
- **Verification:** Deployed smoke tests from the real frontend origin reach the intended service, return typed errors and health status, and use the intended Vercel project ID. Test deployment/rollback without touching production data.

### P1 — ML-01: Random Forest is based on synthetic rules, with incompatible artifact version

- **Status:** Confirmed by training/evaluation source, runtime warning and local smoke test.
- **Affected:** `ml-service/training/train.py`, `ml-service/training/evaluate.py`, `ml-service/requirements.txt`, serialized model artifact, `ml-service/main.py`, `frontend/src/services/riskEngine.ts`.
- **Evidence / reproduction:** Training generates synthetic examples; no independently sourced outdoor hazard dataset or validated field evaluation is documented. Startup warns artifact version 1.8.0 vs installed 1.6.1. A synthetic input returns a `LOW` label and confidence `83`; neither is a calibrated probability of physical safety.
- **Risk:** Users can interpret a demo score as an empirical probability or recommendation.
- **Proposed solution:** Remove probability/safety language and treat the model as experimental. Establish provenance, held-out geographic/seasonal evaluation, calibration, class/OOD handling and model versioning before any user-facing risk classification; otherwise disable it in live mode.
- **Verification:** Reproducible data split and independent evaluation report; pinned training/inference versions; tests for OOD/missing inputs; calibration and limitations documented. No “safe” claim without evidence.

### P1 — CV-01: YOLO is not an implemented terrain-hazard service

- **Status:** Confirmed by frontend/backend/ML route review.
- **Affected:** `frontend/src/services/yoloService.ts`, `backend/server.ts`, `ml-service/main.py`, `ml-service/models/README.md` and tracked weights.
- **Evidence / reproduction:** Frontend calls `/api/vision/detect`; no matching Express/FastAPI route or YOLO inference dependency was found. The existing camera endpoint uses Gemini and a scripted fallback instead. Presence of a generic weights file does not establish terrain-hazard training or validation.
- **Risk:** Documentation and UI imply model capability that is not present or validated.
- **Proposed solution:** Remove unsupported YOLO/terrain-recognition claims or implement only after choosing a licensed model and validated dataset/evaluation protocol. Do not label generic object detection as hazard recognition.
- **Verification:** An end-to-end synthetic test proves the exact documented model/version/path is invoked; model card discloses class definitions, dataset, limitations and evaluation. Otherwise UI states the feature is unavailable/experimental.

### P1 — DATA-01: Weather cache and time matching can show unrelated/stale inputs

- **Status:** Confirmed in source.
- **Affected:** `frontend/src/services/weatherService.ts`, `frontend/src/services/riskEngine.ts`, `frontend/src/App.tsx`.
- **Evidence / reproduction:** Missing inputs are replaced with fixed slope/elevation/weather values; weather can fall back to an unscoped “latest” cache without an age/location match, and hourly values are not matched to current time. Zero coordinates also interact incorrectly with truthy fallback parsing in the backend.
- **Risk:** A real provider value may be attached to a simulated or different location/time and feed risk output.
- **Proposed solution:** Use explicit nullable typed inputs; key cache by a privacy-conscious location cell and provider timestamp; enforce max age; match the current hourly interval; display provider/freshness and stale/unavailable labels. Validate latitude/longitude ranges while accepting valid zero values.
- **Verification:** Fixtures test timezone boundaries, missing/malformed responses, location changes, cache expiry and zero/edge coordinates. No unrelated cache may appear as current data.

### P1 — SEC-01: API input, quota and browser-origin protections are insufficient

- **Status:** Confirmed in source; exploitability not exercised.
- **Affected:** `backend/server.ts`, `ml-service/main.py`, image-analysis and Ranger AI clients.
- **Evidence / reproduction:** Express applies a global 20 MB JSON limit. No general authentication/rate-limit layer was found. ML CORS permits `*` with credentials. The model validates some fields, but the Express proxy maps a model 422 into a 502. Gemini prompt/history/image bounds and cancellation are not consistently enforced.
- **Risk:** Abuse, quota exhaustion, excess memory, misleading 5xx responses, and broad cross-origin access.
- **Proposed solution:** Per-endpoint body and image limits; strict schemas/ranges and MIME/magic-byte verification; safe error mapping; rate limits/quotas; restricted CORS; timeout/cancellation; prompt/history bounds and no sensitive logging. Keep credentials server-side.
- **Verification:** Isolated tests cover boundary values, oversized payloads, malformed JSON/image, unauthorized calls, rate limits, timeout and upstream failures; no production keys/data in tests.

### P1 — SEC-02: Potential raw-HTML map popup injection

- **Status:** Suspected security impact; raw interpolation sink confirmed, exploit not tested.
- **Affected:** `frontend/src/components/TacticalMap.tsx`, hazard report input flow.
- **Evidence / reproduction:** Leaflet popup markup is constructed from hazard title/description strings that can originate in user-entered reports.
- **Risk:** If attacker-controlled report text reaches the popup, HTML can execute in the app origin.
- **Proposed solution:** Render text through DOM nodes/React-safe text APIs or rigorously escape values; do not trust persisted or external report strings.
- **Verification:** Security test submits harmless HTML sentinel strings and proves they render as text, not markup; test all popup fields.

### P1 — SOS-01: Emergency status/contact copy can overstate capability

- **Status:** Confirmed UI behavior; contact authority/accuracy unverified.
- **Affected:** `frontend/src/components/SafetyCenter.tsx`, emergency contact data.
- **Evidence / reproduction:** Contact details are static and include a `555` placeholder; the UI prepares a share/clipboard payload rather than transmitting an emergency message. One location-specific contact is shown independently of verified user location.
- **Risk:** A user may rely on a placeholder or infer help has been dispatched.
- **Proposed solution:** Remove unverified phone numbers; show only emergency numbers verified for the user’s jurisdiction, with source/update date. State clearly that no message was sent until the platform confirms delivery; provide a prominent “call local emergency services” path.
- **Verification:** Tests for unsupported location/contact, share-sheet cancellation and failed delivery prove no false confirmation is shown.

### P1 — DATA-02: Report verification is client-side and not trustworthy

- **Status:** Confirmed in UI/storage flow.
- **Affected:** `frontend/src/components/HazardReportingModal.tsx`, `frontend/src/components/HazardsList.tsx`, `frontend/src/services/storageService.ts`, map markers.
- **Evidence / reproduction:** New reports are initialized with a verification count and client-side confirmation changes the displayed count; local storage provides no independent reporter/moderator identity.
- **Risk:** Reports can appear corroborated without independent verification; data is not shared or durable as the UI may imply.
- **Proposed solution:** Separate submission from verification; define server-side moderation and provenance, prevent duplicate confirmations, and label local-only drafts accurately.
- **Verification:** Synthetic tests prove one reporter cannot increment independent verification and storage failures are announced.

### P2 — OFF-01: Online status is conflated with service availability

- **Status:** Confirmed in source and deployed copy.
- **Affected:** `frontend/src/components/OfflineConnectivityBanner.tsx`, `frontend/src/App.tsx`.
- **Evidence / reproduction:** `navigator.onLine` is used to claim map tiles and meteorological telemetry resumed, without checking those providers. A green “Connection Restored” banner appears while service routes are unavailable.
- **Proposed solution:** Label only network-link state from `navigator.onLine`; probe each actual service independently and show data freshness/unavailable status. Do not call a feature offline-capable until the full workflow works without network.
- **Verification:** Mock online-but-provider-down, offline, captive portal and reconnect cases.

### P2 — QLT-01: No regression suite or CI gate

- **Status:** Confirmed by repository inventory/manifests.
- **Affected:** frontend/backend/ML test configuration, `.github/workflows/`.
- **Evidence / reproduction:** No unit/component/API/ML test suite or GitHub Actions workflow was found. Existing `lint` scripts are TypeScript checks only.
- **Proposed solution:** Add focused tests in the existing stacks (Vitest/RTL, Supertest, Pytest) and CI typecheck/build/test/security jobs. Use Firebase emulator and mocked providers.
- **Verification:** CI runs on PRs and fails on tests/type errors/build/security policy violations; production secrets are not present in CI test jobs.

### P2 — PERF-01: Initial bundle is large and all major views are eagerly bundled

- **Status:** Confirmed build output.
- **Affected:** `frontend/src/App.tsx`, route/tab components, dependencies.
- **Evidence / reproduction:** Vite build reports a roughly 995 kB JS chunk (293 kB gzip) and the >500 kB warning. Map, camera, ML/UI and other views are imported from the main app surface.
- **Proposed solution:** Measure production routes, then lazy-load map/camera/heavy views and remove only proven-unused dependencies. Avoid loading camera/map before the user opens them.
- **Verification:** Compare cold production route bundles and field-like Web Vitals before/after; report route/device/build mode and no unsupported target claims.

### P2 — UX-01: Single-page state navigation and incomplete accessibility baseline

- **Status:** Confirmed structural gap; complete WCAG conformance unverified.
- **Affected:** `frontend/src/App.tsx`, headers/navigation/dialogs/forms, `frontend/src/index.css`.
- **Evidence / reproduction:** Main views are switched by component state rather than URL routes; refresh/back/deep linking are not represented. The mobile 320 px screenshot compresses header controls and shows a low-contrast green-on-green status banner. Icon-only controls and dialog focus/label behavior need a full audit.
- **Proposed solution:** Add URL-backed navigation where justified, accessible names/focus handling, semantic dialogs and keyboard support; define dark and sunlight tokens and test contrast. Avoid initiating camera/location permission on initial landing.
- **Verification:** Keyboard-only and screen-reader checks; WCAG 2.2 AA contrast/form/modal audit; direct route refresh/back tests; all requested viewport widths across each actual view.

### P2 — DOC-01: README and deployment claims diverge from implementation

- **Status:** Confirmed in reviewed documentation/source.
- **Affected:** `README.md`, `frontend/src/components/LandingPage.tsx`, `ml-service/README.md`, hosting configuration.
- **Evidence / reproduction:** Docs/marketing describe YOLO terrain recognition, offline topographic GPS, Firestore persistence and service behavior not established by current code or Vercel routing. Render/backend deployment and real production service URLs were not independently inspected.
- **Proposed solution:** After architecture is verified, document only tested capabilities, accurate Windows PowerShell setup, required environment variable names with placeholders, hosting ownership, limitations and rollback.
- **Verification:** Each documented command and service URL is tested from a clean checkout; claims map to an automated check or an explicit “experimental/unverified” label.

## Explicitly unverified / blocked

- Whether the live Firestore incident collection was empty and whether its seed path ran; no Firestore records were queried or changed intentionally. Preserve data and obtain owner approval before any cleanup.
- Full-history credential scanning: the clone is shallow and no `gitleaks`/`trufflehog` executable was available. No secret values were printed. A full-history scan is still required.
- Whether production Render backend/ML services exist, their environment variables, health, cold starts, logs, quotas and actual production URLs.
- Paid Gemini behavior, cancellation, response-schema compliance, prompt-injection robustness and image limits. No Gemini request was sent.
- GPS/camera behavior on physical devices; this browser lacked a camera. Full accessibility/contrast, all form states, all map controls and all 7 viewport widths on every view remain to be tested in an isolated environment.
- Production data retention/deletion, Firebase project ownership and emergency contact authority.

## Data-safety note

The audit did not intentionally write production data, submit a hazard, start a session, or invoke paid AI. However, opening the production Risk & Weather view can trigger the automatic Firestore sample-seed path described in DB-02. Treat its outcome as unknown. Do not attempt cleanup or further production reads until the owner authorizes a safe, backed-up review.

## Phase 1 follow-up

- SAF-02 earthquake path addressed on the Phase 1 branch. Invalid coordinates return 400. Upstream failures return 503 without fabricated events. The monitor requires device GPS and distinguishes an unavailable feed from a successful empty feed.
- Seven synthetic checks passed against the backend handler. Full frontend build and browser verification are outstanding. Camera and Ranger fallbacks, other demo signals, history seeding, and SOS remain open. The production deployment was not changed.
