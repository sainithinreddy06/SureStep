# TerraGuard AI — Improvement Roadmap

This roadmap is ordered to reduce outdoor-safety and data risks before visual polish. Each phase is completed on a dedicated branch, with focused changes, documentation, tests, and a diff review before the next phase. Current baseline is recorded in [`AUDIT.md`](AUDIT.md). No production deployment or paid service is authorized by this roadmap.

## Phase 0 — Baseline audit and plan

**Status:** Source and live-screen review done; local verification is blocked because the active workspace has no SureStep Git checkout.

- Record the reviewed main commit, source findings, API inventory, risks, and verification limits.
- Preserve separate confirmed/suspected/unverified labels.
- Required remaining evidence: local service startup, builds/type checks, secret scan, endpoint network trace, isolated failure tests, performance numbers, responsive/accessibility matrix.
- **Exit:** audit docs committed on a feature branch; obtain a local checkout for phases 1 onward.

## Phase 1 — Safety language and data integrity

- Separate live and demonstration modes; make demo selection explicit and label every sample value.
- Remove fabricated live earthquake/weather/camera/incident responses; use unavailable states and correctly matched cached data only.
- Remove foot-placement and physical surface-safety outputs; keep any vision experiment descriptive and non-authoritative.
- Remove synthetic hazard counts, verification claims, and emergency placeholders from live views. Correct or delete unverified coordinates.
- Change SOS state to “prepared/shared”; only report delivery when a provider confirms it.
- **Exit checks:** deterministic tests for failure/unavailable states, no invented live information, no false verified/delivered labels, safety copy reviewed.

## Phase 2 — Security and privacy

- Lock down Firestore rules, remove application-triggered production seeding, decide on authenticated ownership or a validated server-side report boundary.
- Fix the Leaflet popup HTML injection by constructing safe text nodes.
- Add strict schemas, bounds, endpoint-specific request sizes, safe errors, AI rate/quota protection, upstream deadlines, and narrowly scoped CORS.
- Document where precise coordinates and images go, request location/camera only when needed, and give users retention/deletion controls.
- Threat model chat prompt injection and log redaction; scan repository history with a safe scanner after checkout.
- **Exit checks:** emulator and synthetic API tests; no test writes to production; no secret output; security checklist reviewed.

## Phase 3 — Architecture and code quality

- Review `App.tsx` and session/GPS/weather/risk/demo state using Ponytail full mode.
- Fix stale dependencies, duplicate GPS watchers, cleanup, races, effect side effects, nested state updates, and error visibility.
- Keep current React/TypeScript/Express/FastAPI stack; split only independent responsibilities with proven need.
- Remove unused code/dependencies only after references and build output are checked.
- **Exit checks:** type checks and focused tests for changed behavior; small diff; caller/state lifecycle review.

## Phase 4 — Feature reliability

- Exercise GPS permissions, location accuracy/freshness, geolocation cleanup, and live/demo separation.
- Validate weather responses, forecast-hour selection, location-specific cache and freshness.
- Test map coordinates, lifecycle, missing tiles, provider attribution, and marker provenance.
- Test session start/pause/resume/end/delete, distance/time calculations, persistence errors, and growth limits with synthetic fixtures.
- Validate hazard-report inputs, source, deduplication, verification, privacy, and safe locations/emergency data.
- **Exit checks:** reproducible mocked tests across normal, invalid and upstream-failure paths; no production records touched.

## Phase 5 — AI/ML boundaries

- Verify exact Gemini model IDs, quotas, SDK compatibility and failure behavior against official docs.
- Treat the current Random Forest as demo-only until real data provenance, leakage controls, held-out evaluation, calibration and out-of-distribution handling are documented.
- Verify YOLO code path and model provenance; do not describe a generic weight file as trained terrain recognition.
- Keep Ranger AI informational; never let a generated answer replace emergency services or qualified judgment.
- **Exit checks:** versioned model card, deterministic and invalid-input tests, explicit limitations, no fabricated fallback.

## Phase 6 — Design system and UI/UX Pro Max

- Install the official Codex skill from the reviewed UI/UX Pro Max CLI only after the project checkout is available: `npm install -g ui-ux-pro-max-cli`, then `uipro init --ai codex`. Record the installed package version/commit. Read the installed `SKILL.md` before use.
- Generate and persist a TerraGuard-specific master design system and justified page overrides using the skill’s `--design-system --persist` workflow. Review every generated recommendation against the user’s strict constraints.
- Establish Alpine Earth (light) and Mountain Slate (dark) tokens, semantic states, typography, interaction states, spacing and map/data conventions. Verify contrast rather than assuming supplied values pass.
- No glass, blur panels, neon, decorative glow, purple-pink gradients, generic AI copy, or fake trust indicators.
- **Exit checks:** design-system master/tokens/page rules committed; contrast and component-state checks complete.

## Phase 7 — Complete application redesign

- Redesign landing, overview, Vision, map, risk/weather/hazards, incident archive, reporting, Safety Center, Ranger AI, sessions, settings/privacy, onboarding/about/service status, loading/error/404 and mobile navigation.
- Use clear source/freshness labels and non-repetitive layouts; preserve real capabilities and remove unsupported claims.
- Add deep-link/back-forward behavior where justified; defer camera/map initialization until chosen.
- **Exit checks:** screenshots for all major screens at 320, 375, 390, 768, 1024, 1440 and 1920 px in both themes; keyboard, zoom, reduced motion and screen-reader review.

## Phase 8 — Performance

- Capture real production build/chunk sizes, resource timing and Core Web Vitals before changing code.
- Lazy-load only measured heavy routes/assets; request camera, maps, weather and ML only when needed; cancel superseded requests.
- Optimize assets/model loading only if measurement supports it.
- **Exit checks:** before/after measurements under the same environment; no claimed target without measured evidence.

## Phase 9 — Offline and resilience

- Test browser network switching, provider outages, stale caches, local session data, storage quota and retry behavior.
- Keep `navigator.onLine` separate from confirmed API health. Do not promise offline maps unless a licensed, complete workflow is implemented and tested.
- **Exit checks:** feature-by-feature offline capability matrix and tests.

## Phase 10 — Automated tests and CI

- Add only the smallest stack-appropriate frontend, API, ML and browser tests needed to cover established behavior. Prefer Vitest/RTL, Playwright, Supertest and Pytest only where they fit the existing repository.
- Add GitHub Actions for installs, types, actual lint, tests, production builds and safe dependency/security scans.
- Document Windows PowerShell setup and placeholder environment variables. Protect main with required checks through the repository’s approved settings process.
- **Exit checks:** reproducible local commands and green CI on the feature branch.

## Phase 11 — Deployment and final audit

- Confirm actual frontend, backend and Python hosting from repository/deployment settings; fix production routing and health checks.
- Document environment, logging, monitoring, resource limits, cold starts, rollback and service ownership.
- Run end-to-end regression, privacy/security review, accessibility and final visual check.
- **Approval gate:** review concrete results and obtain explicit approval before production deployment, infrastructure changes, paid services, destructive migration, or major framework replacement.

## Project constraints that persist

- Follow Ponytail throughout; prefer the smallest complete fix and preserve security, validation, accessibility and data-loss safeguards.
- Use UI/UX Pro Max for significant design work and preserve the project’s committed design-system master and page-specific rules.
- Consult Public APIs for discovery, then verify each provider through authoritative docs before adoption.
- Never fabricate environmental data, verification, emergency delivery, model accuracy, test results, or performance metrics.
- Maintain privacy, security, accessibility, performance and low-cost operation without adding abstractions or dependencies without need.
