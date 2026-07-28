# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Product-specific design decisions

- Keep `dashboard-v1` through `dashboard-v4` untouched; this project is the separate `dashboard-v5` iteration.
- Restore the information hierarchy of the original `dashboard-v1`: dense top-level KPI strip, then the situation by directions with plan and risk; dynamics belongs below this decision layer.
- The approved visual reference is `Утверждено проректором/v4 dashboard.png`: dense enterprise layout, white workspace, black sidebar, Moscow Polytech red for the active section, blue/green/orange/red analytical states.
- Use the supplied Moscow Polytech PNG logo and the supplied Gilroy family. Do not recreate or approximate the logo.
- Demo data must be anonymous. Never display real names, phone numbers, emails, document numbers, addresses, or free-text comments.
- Management scope is selectable by level, form, funding, faculty and educational program. In `Пробуем отклонить_anonymized.xlsx`, identify a person by the number parsed from `Личное дело`; `anon_applicant_id` is row-level and must not be counted as a person.
- Separate units everywhere: 20,887 unique people filed; 66,044 unique `person × direction` applications; 2,102 people have consent, of whom 1,805 remain active in the contest. The full export still contains 175,970 source rows.
- High scorers are unique applicants who filed and have Mathematics ≥85 plus either Physics ≥85 or Informatics ≥85; the current scope contains 1,465 such people.
- Estimate budget fill by assigning at most one best-priority active consent per person and capping each direction at its official plan. Current estimate: 1,474 of 2,058 places, or 71.6%.
- Official bachelor + specialist totals are 2,854 budget and 5,369 paid across all forms; full-time is 2,373 budget and 3,665 paid. Magistracy is 779 / 1,953 and postgraduate study is 66 budget.
- Never model contracts or payments. The 2025 comparison is a clearly marked visual model only: core flow 90→94% and paid flow 88→93% of the 2026 series.
- The top-level potential contact base is the project assumption of 100,000 contacts. Until CRM ↔ AIS deduplication is available, conversion to filing is approximate and must use the `≈` sign.
- The current CRM sample contains 590 unique anonymized contacts. Its anonymized IDs have zero matches with the admissions export, so never show event-to-application conversion until a stable shared `master_applicant_id` is implemented.
- Hide CRM free-text comments and manager names: the source contains a small number of likely PII-bearing rows.
- The product must visibly support future API-backed data. Real processing is expected inside the university perimeter with a local model/server.
- Official plan figures come from Appendix 2.4 to the 2026/2027 admission rules (order № 17-ОД dated 19.01.2026). The ranking example is the official public slice for 09.03.02.01, full-time budget, captured on 27.07.2026.
- Core product scenarios: campaign overview, faculties/directions, anonymous applicant trajectories, intersections between directions, event/CRM touchpoints, action queue, analytics, reporting, and data quality.
