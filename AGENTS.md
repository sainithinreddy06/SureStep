# Repository instructions

## Mandatory Ponytail requirement

The project owner requires the Ponytail skill to be located, read and applied throughout every engineering phase. At the 2026-11-27 audit, no Ponytail skill was present in the available skill catalog or workspace search. Do not invent or infer Ponytail instructions. Before any source-code implementation, locate and load the actual skill instructions. If it remains unavailable, stop source changes and record the blocker. This note records the requirement and the verified absence; it does not substitute for the skill.

## Safety and data handling

- Read `AUDIT.md` and `ROADMAP.md` before implementation; update both when evidence or phase status changes.
- Do not present simulated, estimated, cached, stale or model-generated information as verified live data. If data is absent or an upstream fails, show an explicit unavailable state; never synthesize a live hazard or safety classification.
- Treat camera, terrain, risk and Ranger AI behavior as experimental and non-authoritative. Do not provide foot-placement instructions or physical-safety guarantees without independently validated evidence.
- Use synthetic data and isolated providers/Firebase Emulator for tests. Do not query or modify production Firestore records as part of routine testing. The current incident-history loader has an automatic production fixture-seed path; do not open that flow against production until it is removed or safely isolated.
- Never print, commit or copy credentials. Keep AI/API credentials server-side; do not make billable model calls without explicit approval.
- Obtain explicit approval before destructive data migrations, paid services, production configuration changes or production deployments.

## Repository workflow

- Work on a dedicated feature branch; never push directly to `main` unless the owner explicitly requests that exact action.
- Preserve unrelated changes. Run the narrowest relevant check first, then required tests/builds. Do not call the existing `lint` script a linter without verifying its behavior; the baseline scripts currently run TypeScript `--noEmit`.
- Verify deployment routing independently of the Vite development proxy. The current Vercel project is configured as a Vite frontend rooted at `frontend`; production API paths were observed returning 404.
- Keep claims in UI, README and model documentation aligned with tested behavior and clearly state limitations.
