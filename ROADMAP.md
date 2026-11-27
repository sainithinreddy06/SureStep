# TerraGuard AI (SureStep) — Engineering Roadmap

**Status as of 2026-11-27:** Phase 0 baseline is documented in `AUDIT.md`; it is not a go-live sign-off. Phase 1 implementation is in progress on a feature branch. Work stays on a dedicated feature branch, never directly on `main`.

## Phase gates

### Phase 0 — Baseline audit (partial; no release approval)

- Record confirmed/suspected/unverified findings, local smoke checks, Vercel routing and performance baseline in `AUDIT.md`.
- Remaining gates: resolve the possible Firestore auto-seed side effect with owner-approved review; complete full-history secret scanning; confirm Render/backend/ML ownership and production environment without printing secrets; complete page-by-page accessibility/responsive checks in an isolated Firebase setup.
- **Exit:** every finding has an owner, evidence, remediation and verification test; no production data is inspected or changed without approval.

### Phase 1 — Safety and data integrity

- Third checkpoint: camera analysis returns only possible visible features. Ranger failures show an unavailable state, and the incident archive reads without inserting sample data. Existing records need an owner-approved provenance review. Verified with [isolated GitHub Actions](https://github.com/sainithinreddy06/SureStep/actions/runs/45966273300): mocked AI and archive handler tests, frontend and backend type checks, the production build, and Chromium outage and retry checks.

- Second checkpoint: label device and demo positions, mark both risk estimates as demo output, require device GPS for local weather and SOS location sharing, and display Open-Meteo model time and cache status. The mocked weather regression, frontend type check, production build, and Chromium checks passed in [the isolated check](https://github.com/sainithinreddy06/SureStep/actions/runs/45964797007).

- First checkpoint: the USGS earthquake monitor requires device GPS, distinguishes an unavailable feed from an empty feed, and no longer shows fabricated earthquakes. Seven synthetic backend checks passed. The isolated browser check covered denied GPS, an empty earthquake feed, simulated outage, and recovery.

- Make demo mode explicit; stop simulated GPS/weather/risk from appearing live.
- Remove fabricated hazard events, camera classifications and fallback safety instructions.
- Make unavailable/stale/estimated/demo states distinct; remove unsupported foot-placement and physical-safety claims.
- Stop automatic fixture writes; separate submitted, moderated and externally verified reports; clarify emergency share-vs-delivery behavior.
- **Exit:** failure-path tests prove no fabricated live output; safety copy describes experimental limits; no user can mistake demo data for live telemetry.

### Phase 2 — Security and privacy

- Replace permissive Firestore rules with tested least-privilege policies and a documented identity/moderation model.
- Add request/response schemas, coordinate/numeric/history limits, endpoint-specific body/image limits, rate/quota controls, safe errors, restricted CORS and deployed security headers.
- Review XSS sinks, prompt injection, uploads, secrets/history, sensitive logging, location retention/deletion and dependency advisories.
- **Approval gate:** no production data migration, deletion, paid-service usage or production configuration change without explicit approval.
- **Exit:** isolated adversarial and access-control tests pass; secret scan covers full Git history; privacy and threat model are documented.

### Phase 3 — Architecture and code quality

- Simplify `App.tsx` responsibilities; correct GPS watcher lifecycle/cleanup, state races, effect dependencies and session calculations.
- Introduce URL-backed navigation only where needed for refresh/back/deep links; keep abstractions proportionate.
- Standardize typed API outcomes and errors; remove dead code/dependencies only with evidence.
- **Exit:** behavior-preserving tests cover lifecycle and state transitions; typecheck/build pass with no new lint debt.

### Phase 4 — Feature reliability

- Test GPS permission/accuracy/timestamps; weather cache locality/freshness/hour matching; map tiles/attribution; session start/pause/resume/end/delete; hazard report validation/moderation; safety-center failure states.
- Use synthetic fixtures, mocked upstreams and Firebase Emulator—never production records.
- **Exit:** every feature has deterministic happy-path, invalid-input, failure and persistence tests; no false success state.

### Phase 5 — AI and ML quality

- Confirm supported Gemini model/config and schema in a cost-controlled test environment; bound inputs, timeout/cancellation and prompt/context.
- Document synthetic training provenance, dataset rights, geographic/seasonal holdout, calibration, class balance and out-of-distribution behavior.
- Either validate the intended model rigorously or disable its live classification. Do not describe generic YOLO as terrain hazard recognition.
- **Approval gate:** any billable Gemini evaluation needs explicit approval.
- **Exit:** model version/data/evaluation card, reproducible test suite and approved limitations; no unsupported safety probability.

### Phase 6 — Design system

- Define semantic tokens, dark and Sunlight Active themes, typography/fallbacks, contrast-tested statuses and shared accessible components.
- Preserve the user’s forest technology direction while reducing clutter and emphasizing data provenance/freshness.
- **Exit:** tested color contrast, keyboard-visible focus, component interaction states and reduced-motion behavior.

### Phase 7 — Product UX and screen redesign

- Review landing/dashboard, Vision, map, risk/weather, hazards/reporting, Safety Center, Ranger AI, sessions/history, settings/privacy, onboarding, limitations, service status, loading/error and 404 behavior.
- Gate camera/location permission behind an explicit user action; clarify demo/live states; support responsive and URL navigation where appropriate.
- **Exit:** all implemented routes and dialogs verified with keyboard/screen reader and at 320, 375, 390, 768, 1024, 1440 and 1920 px; no unresolved critical accessibility issue.

### Phase 8 — Performance

- Measure production route bundles, field-like Web Vitals, React work, API count/latency, map/camera resources and ML startup before optimizing.
- Lazy-load genuinely heavy views, cancel/debounce requests and cache only with correct scope/freshness.
- **Exit:** before/after measurements identify the change and environment; do not claim Core Web Vitals targets without evidence.

### Phase 9 — Offline/resilience

- Define and test each complete offline workflow, cache expiry/invalidation, storage-quota failure, network switching and retry semantics.
- Do not market offline maps/GPS unless tested end to end with licensed cached data and clear freshness.
- **Exit:** feature-by-feature offline matrix with tested limits and explicit degraded states.

### Phase 10 — Testing and CI/CD

- Add focused frontend unit/component/accessibility/browser tests, backend endpoint/schema/rate/upstream tests, and ML loading/inference/input tests.
- Add GitHub Actions for install, typecheck, real lint, tests, production build and dependency/security scanning; protect `main` with required checks.
- **Exit:** reproducible clean-checkout CI is green and uses no production data or secrets.

### Phase 11 — Deployment and final audit

- Resolve Vercel project-ID mismatch and document actual frontend/backend/ML hosting, routing, health checks, environment ownership, logs, limits and rollback.
- Run final regression/security/accessibility/performance audit against an isolated deployment.
- **Approval gate:** no production deployment, domain/routing mutation or data migration without explicit approval.
- **Exit:** every P0/P1 finding is fixed or formally accepted with a mitigation; limitations and rollback are documented.

## Current blockers

1. **Ponytail instructions located:** the Phase 1 worker loaded and applied the required instructions.
2. **Production Firestore seed outcome unknown:** verify only with owner authorization and a backup; do not clean or alter records as part of this audit.
3. **Vercel association mismatch:** CLI inspection and chat-linked project IDs differ; confirm intended project before production work.
4. **Full-history secret scan outstanding:** current checkout is shallow and scanner binaries were unavailable.
