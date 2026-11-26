# TerraGuard AI (SureStep) — Baseline Audit

**Status:** Phase 0 source and deployed-site review completed; local execution and reproducible verification are blocked because this workspace has no SureStep checkout.

**Reviewed:** 2026-11-27 (Asia/Kolkata)  
**Repository snapshot:** `main` at `97b8b1251ea15fde1b25a1bfcf500b6043ff024b` (commit dated 2026-10-02)  
**Live site reviewed:** <https://terra-guard-ai-five.vercel.app/>  
**Review mode:** read-only GitHub source retrieval and browser inspection. No production data was written, no credentials were printed, and no model artifacts were loaded.

## Executive summary

The app has several safety and data-integrity blockers before it should be presented as a live hiking-safety product. Its default state is a scripted Mount Rainier demo, but the UI labels values as live GPS, live weather, verified hazards, safe footing, and emergency dispatch. Failure paths can return fabricated earthquake events, camera results, weather, and historical incidents. The risk score and confidence are not validated for real-world safety decisions: training code generates a synthetic target from a formula. Firestore rules allow unauthenticated reads and writes, and the map inserts user-controlled hazard strings into Leaflet popup HTML.

The deployed UI was inspected at the landing page and the Vision, Map, Risk, Safety, and Ranger AI views. It displayed synthetic coordinates and hazard counts, an Open-Meteo reading for the scripted coordinates, `ML prediction failed`, and claimed a live location in the floating HUD. The camera component attempted to start automatically when Vision was opened; the inspection browser had no camera device. Location and camera permissions were not granted. A screenshot showed a dark hero with gradient text, dense repeated cards, and bright color accents; the code also defines blur/glass panels, glow shadows, and animated decoration, contrary to the requested design constraints.

## Scope and limits

The GitHub tree contained 84 entries across the React/Vite frontend, Express backend, FastAPI service, data/model files, configuration, and README. Source reviewed included all primary application flows, services, risk/weather/ML code, Firebase rules and initialization, map/camera/AI/session/safety components, package manifests and lockfiles, Vite configuration, metadata, manifest, styles, and technical docs. Binary images and model weights were inventoried but not executed or decoded.

The workspace contains only `.codex/config.toml`; it is not a Git checkout. No `AGENTS.md`, tests, `.github` workflows, or deployment rewrite files exist in the reviewed `main` tree. Therefore I could not install dependencies, run frontend/backend/ML services, execute build/type/lint/tests, run secret scanning across Git history, verify live endpoint status through an isolated test environment, measure bundle size/Core Web Vitals, or test the requested viewport/theme/accessibility matrix. These are recorded as unverified rather than passed. The production app was not used to submit forms, start sessions, send chat/image payloads, trigger SOS, or mutate Firestore.

## Prioritized findings

Severity: **Critical** can mislead a person during an outdoor emergency or expose/change live records; **High** creates exploitable security, financial-abuse, or major correctness risk; **Medium** materially harms reliability, accessibility, performance, or trust. **Confirmed** means source or live evidence establishes the issue; **Suspected** means code strongly indicates it but the behavior was not safely reproduced; **Unverified** means a local or isolated check is still required.

### F-01 — Scripted coordinates and measurements are presented as live telemetry

- **Severity/status:** Critical — Confirmed in source and live UI.
- **Affected files:** `frontend/src/App.tsx:77-96, 117-125, 200-274`; `frontend/src/components/FloatingWindowHUD.tsx:89,108,134`; `frontend/src/components/MovingBackcountryBackground.tsx:173-183`.
- **Evidence:** GPS starts as `simulating`; the current coordinates, altitude, accuracy, heading, speed, trail and slope begin from `MOCK_TRAILS[0]`. The landing background renders fixed `96% · SOLID BEDROCK`, `11.2°`, and an east talus warning. The floating HUD renders `LIVE GPS` and a default slope. The live app showed `46.7865, -121.7358`, `1645 m`, and simulated map status before the user granted location access.
- **Reproduction:** Open the live URL and choose “Launch Whole Application”; inspect Map, Risk, and Safety before using device GPS.
- **Fix:** Make demo mode an explicit, persistent, unmistakable choice. Default live mode to location “not started”; do not calculate location-dependent weather/risk/hazard information until real coordinates and freshness are available. Keep demo data separate from live records and alerts.
- **Verification:** Permission granted/denied/unavailable, startup, tab changes, GPS loss, and explicit demo mode all show a truthful source/status label; no simulated values appear as live; no live prediction runs from defaults.

### F-02 — Vision gives fabricated, authoritative foot-placement advice

- **Severity/status:** Critical — Confirmed in source; a failure response was not invoked on production.
- **Affected files:** `backend/server.ts:177-265,294-338`; `frontend/src/components/GroundVision.tsx:56-299,324-361,393-420,422-500`.
- **Evidence:** The prompt asks Gemini to classify exact safe/dangerous step targets and prescribe a stride. Backend errors or a missing Gemini key return fixed screen positions, `94%` “safety,” “Solid Bedrock Shelf,” and instructions to step/avoid exact places. Preset scenarios also return hand-authored target boxes and confidence values. The page copy says it can calculate friction and exact targets. Vision starts the camera on component mount.
- **Reproduction:** Open the live app’s Vision tab; source shows presets and the fallback path. Do not test by relying on the advice on a real trail.
- **Fix:** Remove foot-placement, surface-safety, and safe/danger classification. If retained as an experiment, restrict it to descriptive observations with explicit demo/experimental status, no confidence score or action recommendation, and no safety decision inferred from an image. Request camera permission only after a user action.
- **Verification:** Synthetic test images, malformed responses, missing model, timeout, denied/no camera, and upload formats never produce a “safe step,” physical-safety score, or success-shaped fallback.

### F-03 — Public Firestore access and fake incident seeding

- **Severity/status:** Critical — Confirmed in repository configuration and code; actual production records were not read or changed.
- **Affected files:** `frontend/firestore.rules:1-12`; `frontend/src/services/firebase.ts:42-113,117-143`; `frontend/src/components/HistoricalIncidentDatabase.tsx:45-60,116-121`.
- **Evidence:** Firestore rules allow read and write to everyone for both `trail_incidents` and `ground_scans`. When the incident collection is empty, the frontend writes four hard-coded incidents attributed to official-looking source names into that configured database; their provenance is not verified. On a write failure, incident logging returns a local-looking ID; the UI can still show success.
- **Reproduction:** Not reproduced on the live database: it is an unsafe production write path. The code path runs when the incident collection is empty and that view is loaded.
- **Fix:** Immediately deploy restrictive Firestore rules; remove automatic seed writes from application startup; seed only an isolated emulator with clearly synthetic records; distinguish persistence failure from success. Decide whether user reports belong in an authenticated backend or a validated anonymous queue.
- **Verification:** Emulator tests prove anonymous reads/writes/deletes are denied, authorized paths enforce ownership and schema, failure is visible, and no production document is written by test runs.

### F-04 — User-provided hazard text is inserted into popup HTML

- **Severity/status:** Medium — Confirmed unsafe HTML sink; current map hazards are local to the user’s browser, so cross-user stored XSS is not established.
- **Affected files:** `frontend/src/components/TacticalMap.tsx:153-185`; `frontend/src/components/HazardReportingModal.tsx:22-50`.
- **Evidence:** Hazard title, description, type, and count are interpolated into a string passed to Leaflet `bindPopup`. Hazard titles/descriptions are user-controlled and stored in local state. The current map source is local/mock data, so this is a client-side injection sink, not evidence that one user can attack another.
- **Reproduction:** A crafted report string rendered in the map popup reaches the HTML sink. This was not entered into the live site.
- **Fix:** Construct popup DOM nodes and assign user text with `textContent`; avoid raw HTML interpolation. Validate values at the API/storage boundary as well.
- **Verification:** Unit/integration test strings containing markup, event handlers, SVG and quotes; assert they render literally and execute no script in the real Leaflet popup.

### F-05 — Production API routing is not represented by the frontend deployment config

- **Severity/status:** High — Confirmed configuration gap; one live API failure observed.
- **Affected files:** `frontend/vite.config.ts:1-21`; `frontend/src/services/mlService.ts`; `frontend/src/components/RangerAiChat.tsx:82-99`; `frontend/src/components/NaturalHazardAlerts.tsx:58-65`; `backend/server.ts`; repository root tree.
- **Evidence:** The only API routing configuration found is Vite’s development proxy from `/api` to `localhost:3000`. No Vercel rewrites, backend deployment manifest, or separate production API base URL for these calls was present. The live Risk screen showed `ML prediction failed` while the page was hosted on Vercel.
- **Reproduction:** Open live Risk & Incidents; the UI reported ML failure. Other route statuses were not inspected in a network panel.
- **Fix:** Document and implement one production routing arrangement for the Express API and ML service. Use explicit validated production environment values; never default a deployed browser to localhost. Return typed unavailable states when a service is absent.
- **Verification:** Production-like preview tests independently exercise every route through the chosen host, including 4xx/5xx, timeout, and upstream-down cases.

### F-06 — Unbounded public AI endpoints permit quota and resource abuse

- **Severity/status:** High — Confirmed in source; abuse was not attempted.
- **Affected files:** `backend/server.ts:10,121-186`; `backend/package.json`; `frontend/src/components/RangerAiChat.tsx:82-96`; `frontend/src/components/GroundVision.tsx:422-435`; `ml-service/main.py:19-24`.
- **Evidence:** A global 20 MB JSON body parser covers all routes. Chat validates only a truthy message; history, context, image dimensions, MIME type and base64 size have no route-specific bounds. No rate limiter or quota guard is installed. The ML service enables wildcard origins with credentials. AI calls use a server-held key, but the endpoints have no demonstrated caller authorization or cost controls.
- **Fix:** Apply endpoint-specific small limits, schema/range/length checks, strict image decoding and type/size checks, upstream timeout/cancellation, rate/quota controls, and allowlisted CORS only where cross-origin browser calls are actually required. Keep credentials server-side.
- **Verification:** Isolated tests cover oversize bodies/images, invalid coordinates/numbers, long chat/history, malformed responses, rate limit behavior, CORS, and AI outage without a real paid/quota account.

### F-07 — Risk numbers and confidence have no real-world safety validation

- **Severity/status:** Critical — Confirmed in model documentation and training code.
- **Affected files:** `ml-service/training/train.py:12-62`; `ml-service/training/evaluate.py`; `ml-service/README.md`; `ml-service/main.py:50-68,140-169`; `frontend/src/services/riskEngine.ts:20-246`; `frontend/src/components/RiskEngineCard.tsx:68-105`.
- **Evidence:** The checked-in training script generates 2,400 random feature rows and a formula-based target; the test split is from that same generated process. The service labels ensemble spread as confidence using a fixed transformation, or returns `68` for its rule fallback. Separately, the browser heuristic starts at `100` confidence and scores default slope, trail difficulty, and all hazards without checking their distance. UI displays scores, percentages, and recommended actions as current mountain risk.
- **Fix:** Remove probability/confidence and action language from live UI. Until a documented, independently evaluated dataset, evaluation protocol, calibration and out-of-distribution behavior exist, identify this model as experimental/demo-only and keep it out of physical safety decisions.
- **Verification:** Reproducible provenance and held-out evaluation, leakage and calibration checks, subgroup/park coverage, out-of-distribution tests, deterministic model/version tests, and copy review before any operational use.

### F-08 — Earthquake, historical hazard, report, and emergency UI can fabricate or misstate information

- **Severity/status:** Critical — Confirmed in source.
- **Affected files:** `backend/server.ts:59-118,263-338`; `frontend/src/services/mockTrails.ts:1-200`; `frontend/src/services/storageService.ts:24-36`; `frontend/src/components/HazardReportingModal.tsx:33-49`; `frontend/src/components/NaturalHazardAlerts.tsx:58-115`; `frontend/src/components/SafetyCenter.tsx:63-116,181-205`; `frontend/src/services/firebase.ts:42-113`.
- **Evidence:** USGS failure returns a hard-coded earthquake with `success: true`; two default emergency contacts include a US-specific dispatch number and a `555` placeholder; a user-created report starts with `verifiedCount: 147`; trail hazards and historical incidents have fixed dates/counts/descriptions. The monitor says “No active geological tremors within 100km” for an empty list although the backend query filters to 500 km. The frontend does not clear old events on an empty response.
- **Fix:** Remove fabricated events/verification/history from live experience and label every sample as demo. Do not show placeholder contacts; require user-provided/verified local emergency details or show the local emergency number only when region is known and verified. Rename SOS status to “prepared/shared” and never say dispatched/delivered without a delivery acknowledgement.
- **Verification:** Mock upstream failure, no-event, stale-event, placeholder-contact and cancelled-share tests. Confirm no failed service returns `success:true` with invented records and no cancelled share claims delivery.

### F-09 — Weather fallback and selection can show unrelated or mismatched conditions

- **Severity/status:** High — Confirmed in source; fallback path not forced on production.
- **Affected files:** `frontend/src/services/weatherService.ts:26-37,68-70,90-123`; `frontend/src/App.tsx:196-202,247-274,289-320,478-492`.
- **Evidence:** On failure, the service may reuse a global `surestep_weather_cache_latest` regardless of the requested coordinates, then labels it “Cached Backup”; with no cache it returns a hard-coded weather snapshot. Hourly precipitation probability and UV use index `[0]` rather than the hour matching `current.time`. Weather load effect depends only on trail ID, not the changing live GPS position. Responses are consumed without schema/time validation.
- **Fix:** Return unavailable when no matching cache exists; bind every cache entry to a normalized location/provider/time; select the correct current/future forecast hour; validate provider data, timestamp, units and coordinates; cancel superseded requests; display source and freshness.
- **Verification:** Fixture tests for location changes, midnight/timezone, missing/malformed fields, cache age/location mismatch, stale/out-of-order requests, timeout and provider failure.

### F-10 — Hazards are treated as nearby without spatial matching; verification is not durable

- **Severity/status:** High — Confirmed in source.
- **Affected files:** `frontend/src/services/riskEngine.ts:102-116`; `frontend/src/components/HazardsList.tsx:17-28,145-159`; `frontend/src/App.tsx:470-474`; `frontend/src/services/mockTrails.ts:105-124`.
- **Evidence:** Risk engine filters all active hazards by severity without measuring distance from current coordinates. “Verified” clicks are stored only in component state and `App` state; they do not persist to storage/backend. A Yosemite hazard is listed at longitude `-121.5450`, while the other Yosemite route/hazards are near `-119.54` (a likely data error of roughly two longitude degrees).
- **Fix:** Calculate and disclose distance with a documented radius; separate trail-level sample data from current-location hazards; make verification a deduplicated durable report with provenance; correct coordinates from an authoritative source or remove the record.
- **Verification:** Geographic fixtures at just inside/outside the radius, duplicate verification, reload, malformed coordinates, and source attribution.

### F-11 — Map tiles hide attribution and offline availability is overstated

- **Severity/status:** High for attribution — Confirmed; Medium for offline claim — Confirmed source gap.
- **Affected files:** `frontend/src/components/TacticalMap.tsx:53-81`; `frontend/src/components/OfflineConnectivityBanner.tsx:82-100`; `frontend/src/App.tsx:120-146`; root tree.
- **Evidence:** Leaflet disables its attribution control and uses OpenStreetMap, OpenTopoMap, and Esri imagery layers; no custom attribution text was found in TacticalMap. The OSM standard tile policy requires visible attribution. The repository has a web manifest but no service worker or offline tile storage; `navigator.onLine` is treated as connectivity status and the banner claims cached terrain tiles.
- **Fix:** Show correct attribution for each provider and follow their usage/licensing policy. Label GPS/session storage separately from map availability; do not promise offline map coverage without an implemented, licensed tile workflow.
- **Verification:** Screenshot each layer with legible attribution; block network and confirm which features still work, how fresh local data is, and whether map tiles were actually cached.

### F-12 — SOS can claim “dispatched” when nothing was sent

- **Severity/status:** Critical — Confirmed in source.
- **Affected files:** `frontend/src/components/SafetyCenter.tsx:63-116,181-205`.
- **Evidence:** `triggerSosDispatch` sets status to `dispatched` before calling `navigator.share`; the share sheet requires a later recipient/action and may be cancelled. The 911 call action is a separate `tel:911` link. The UI text does say the message is prepared, but the status is still misleading.
- **Fix:** Use state labels such as “Preparing,” “Ready to share,” and “Share sheet opened”; only claim sent/delivered if an actual messaging integration confirms delivery. Keep manual calling prominent and independent.
- **Verification:** Share success, cancel, unsupported browser, clipboard failure, and user-initiated phone-call flows each show accurate status.

### F-13 — Unsafe session and GPS lifecycle details need correction

- **Severity/status:** Medium — Confirmed source; user-facing data corruption has not been reproduced.
- **Affected files:** `frontend/src/App.tsx:286-408,414-468`; `frontend/src/services/storageService.ts:39-120`; `frontend/src/components/SessionTracker.tsx:69-107`.
- **Evidence:** GPS watch registration has no duplicate-start guard and no visible unmount cleanup; denied GPS sets simulation true but changes status to `denied`, while the interval only advances under `simulating`. Location side effects occur inside state updater callbacks. Session starting uses default coordinates; distance accumulates each point without accuracy/jump filtering; average speed starts at a constant `3.6`. Storage exceptions are logged but not surfaced.
- **Fix:** Make GPS a controlled lifecycle with one watcher and cleanup; separate live and demo session inputs; calculate metrics from validated samples and show persistence errors.
- **Verification:** Permission/state transition tests, duplicate-start/unmount tests, synthetic GPS drift/jump fixtures, pause/resume, storage quota, and repeated start/end/reload.

### F-14 — UI violates the requested visual direction and has accessibility gaps

- **Severity/status:** Medium — Confirmed visual/CSS issues; full WCAG result unverified.
- **Affected files:** `frontend/src/index.css:49-53,153-206,509,700-747,776-976,1121-1123`; `frontend/src/components/LandingPage.tsx:55-70,91-163`; `frontend/src/components/TacticalMap.tsx:71-81,324-345`.
- **Evidence:** CSS contains `.glass-panel`, multiple `backdrop-filter` effects, glowing green shadows, animated gradients/particles, and gradient backgrounds. The landing page uses oversized gradient headings, four repetitive cards, and fake telemetry. The live Map accessibility tree exposed several icon-only map control buttons without names. The app is a client-side `activeTab` state switch; navigation does not change the URL.
- **Fix:** Build the project-specific Alpine Earth/Mountain Slate tokens and page rules before redesign; replace blur/glow/decorative animation with matte surfaces and accessible states; use descriptive copy; add names/focus/dialog semantics; choose a restrained page hierarchy and deep-linkable navigation where justified.
- **Verification:** Axe/WCAG 2.2 AA, keyboard/modal focus, reduced motion, zoom, contrast, screen-reader names, both themes and the requested seven viewport widths.

### F-15 — Initial performance is not measured and may load too much eagerly

- **Severity/status:** Medium — Suspected; measurements unverified.
- **Affected files:** `frontend/src/App.tsx:1-43`; `frontend/src/assets/images/*`; `ml-service/models/terrain_risk_model.joblib`; `ml-service/yolo11n.pt`; package manifests.
- **Evidence:** `App.tsx` statically imports the full screen/component set (including Leaflet, camera, and Firebase feature paths) while the landing screen is shown. The repository tracks several ~0.9–1.1 MB landscape images and model binaries (~10.7 MB Random Forest artifact, ~5.6 MB YOLO weights). This is not proof that all assets ship in the initial transfer.
- **Fix:** Measure actual build output and Core Web Vitals from a local checkout before changing code. Lazy-load only confirmed heavy routes/assets and load camera/map/model code on demand. Remove unused files only after references and deployment usage are checked.
- **Verification:** Record production build chunks and transfer size; test first visit and warm visit on a realistic mobile profile; measure LCP/INP/CLS before and after.

## Baseline verification matrix

| Area | Baseline result |
|---|---|
| GitHub source snapshot / tree | Read-only review at stated commit; 84 tree entries; no project AGENTS/tests/workflows/deployment rewrites found |
| Live navigation | Landing, Vision, Map, Risk & Incidents, Safety & SOS, Ranger AI opened |
| Live network/API | Risk view displayed `ML prediction failed`; no full network trace collected |
| Browser console | Camera `NotFoundError` because this browser has no device; extension metadata errors are browser-environment noise, not attributed to SureStep |
| Build, type/lint, tests, local services | Not run: no local checkout/dependencies in workspace |
| Security scan / Git history | Not run; obtain checkout and use a safe scanner without printing findings |
| Responsive, themes, keyboard, contrast, reduced motion | Not run; only desktop landing screenshot was captured |
| Bundle size / Core Web Vitals / backend latency | Not measured; no performance numbers claimed |

## External resource and API inventory

The API discovery list is a candidate catalogue, not an assurance that an API is safe or licensed for this product. Snapshot references below are pinned for reproducibility; verify provider docs again before integration.

| Integration/source | Current implementation | Initial assessment and action |
|---|---|---|
| Open-Meteo | Frontend calls `api.open-meteo.com` directly for current conditions/hourly forecast. | Existing provider can remain under review. Public APIs lists it as free for non-commercial use. Official terms say the free API is non-commercial, rate-limited, and has no uptime guarantee; Vercel shared-IP usage may be rate-limited. Confirm intended project use and attribution/license before production expansion. [Terms](https://open-meteo.com/en/terms) · [Pricing](https://open-meteo.com/en/pricing). |
| USGS earthquake GeoJSON | Backend requests `earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson`. | Authoritative source for the feed it contains, not rockfall/flood detection. Keep source data separate from local trail reports; validate payload/time and return unavailable on failure. [Feed docs](https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php). |
| Gemini Developer API | Express server calls `@google/genai`; image/chat inputs and environmental context go to Gemini. | Keep key server-side; add cost/abuse controls, data notices, timeouts and schema validation. The displayed `Gemini 3.8 Flash` family is present in Google’s current official docs; verify the exact API model ID and quota before runtime. [Models/pricing](https://ai.google.dev/gemini-api/docs/pricing). |
| Firebase Firestore | Frontend initializes a configured Firestore client and queries/writes incident records. | Current public rules and auto-seeding are unsafe. Restrict access and remove fake production writes before further DB interaction. |
| Leaflet map tiles | OSM Standard, OpenTopoMap, Esri World Imagery. | Leaflet is the renderer, not an offline map provider. Attribution is disabled. OSM policy requires visible attribution and has usage constraints. Review OpenTopoMap/Esri terms, attribution and caching before retaining each layer. [OSM tile policy](https://operations.osmfoundation.org/policies/tiles/) · [OpenTopoMap credits](https://opentopomap.org/credits). |
| Python model API | Browser expects `/api/ml/predict-risk`; FastAPI exposes `/predict-risk`, proxied by Express in development config. | No production routing config found; live ML request failed. The model is a demo trained on generated data. |
| YOLO weights | `ml-service/yolo11n.pt` and README mention model use; `ml-service/main.py` only exposes health and Random Forest risk routes. | No YOLO inference route/service was found. Do not call this validated terrain-hazard detection. No additional computer-vision provider selected. |
| Public APIs discovery alternatives | Pinned catalogue includes Open-Meteo, Nominatim, and OpenTopoData entries. | Candidate discovery only. No replacement selected. Verify official docs, geographic coverage, CORS, rate limits, licensing, maintenance, costs, and privacy first; do not add duplicate providers without an evidenced need. |

**Pinned references:** `public-apis/public-apis` MIT, commit `9fb3bdb62643400aaebee03a2ecce0cd1ec934eb`; `nextlevelbuilder/ui-ux-pro-max-skill` MIT, commit `b244c0448bff0a891f972672d47df9c47d61ac31`; `DietrichGebert/ponytail` MIT, commit `ebd8654c2c627f721eb8f9c0d1bd4090a29f9e10`.

## Immediate next steps

1. Stop presenting generated/demo outputs as live or safety-authoritative; disable fake fallback events and fake SOS/verification states.
2. Close Firestore to public reads/writes and remove automatic production seeding before any other live DB checks.
3. Make a local checkout on the audit branch so service startup, isolated testing, design tooling and implementation can proceed.
4. Continue with the phase order in [`ROADMAP.md`](ROADMAP.md); do not deploy without the explicit deployment approval requested in the project instructions.
