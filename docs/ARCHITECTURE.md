# Architecture of dashboardMP26

## 1. Purpose and documented baseline

This document describes the repository state reviewed at commit `2a88f3e` on 2026-07-28. The currently published product is Dashboard V5. V1, V2, and V4 remain separately published historical artifacts.

The repository is a public prototype and publication bundle, not a complete production information system. There is no backend, database, authentication layer, university API, or real CRM integration in the current implementation.

## 2. Repository map

| Path | Role | Stability |
|---|---|---|
| `README.md` | Minimal repository description | Informational |
| `.github/workflows/deploy-pages.yml` | Builds V4/V5 and publishes the version selector plus V1/V2/V4/V5 to GitHub Pages | Production publishing path |
| `outputs/index.html` | Public version selector; marks V5 as latest | Stable public entry point |
| `outputs/dashboard-v1/` | Static HTML/CSS/JS first dashboard prototype | Historical; preserve |
| `outputs/dashboard-v2/` | Static HTML/CSS/JS second dashboard prototype | Historical; preserve |
| `outputs/dashboard-v4/` | Previous React/Vite management prototype and V4 aggregates | Historical; preserve |
| `outputs/dashboard-v5/` | Current React/Vite application, generated data, tests, and screenshots | Current stable product |
| `tools/build_dashboard_v5_data.py` | Generates the V5 privacy-safe JSON from a local anonymized workbook and local knowledge file | Current data build tool |
| `tools/anonymize_admissions_data.py` | Local CSV/XLSX anonymizer | Data preparation tool |
| `tools/anonymizer_app.py` plus launch scripts | Desktop UI for the anonymizer | Data preparation tool |
| `tools/build_dashboard_demo_data.py` | Older aggregate builder described as a V3 generator | Legacy helper; V3 is not published/tracked |
| `tools/audit_dashboard_v5.mjs` | Playwright functional, responsive, and visual audit | Current V5 regression check |
| `docs/` | Product/data analysis and the stable-state contracts | Documentation |
| `OFFICIAL_ADMISSION_KNOWLEDGE_2026.md` | Local knowledge source used by the V5 generator | Ignored by Git; required for reproduction; requires controlled storage |

The root `.gitignore` ignores everything by default and explicitly allows selected source, documentation, tooling, and dashboard output paths. Raw, private, and anonymized data directories are ignored.

## 3. Version architecture

### V1 and V2

V1 and V2 are self-contained static applications:

```text
index.html
assets/
src/data.js
src/app.js
src/styles.css
```

They require no build step for publication. Their data is embedded in `src/data.js`. Navigation labels exist, but the implementation is primarily a single dashboard page. They are copied directly by the Pages workflow.

### V4

V4 is a React 19/Vite 6 application. It retains its own source, data files, package lock, Sites worker, and tests. GitHub Pages builds it and publishes `dist/client`. V4 is the previous management version and is not the current source of truth for V5 behavior.

V5 uses `outputs/dashboard-v4/src/admissionsActuals.json` only as an optional fallback from direction name to code while generating data. This is a migration dependency, not a runtime dependency.

### V5

V5 is a client-only React single-page prototype:

```text
outputs/dashboard-v5/
  index.html
  package.json
  vite.config.mjs
  public/assets/
  src/
    main.jsx
    App.jsx
    icons.jsx
    styles.css
    dashboardData.json
  scripts/prepare-sites-build.mjs
  worker/index.js
  tests/sites-worker.test.mjs
  audit/
```

- `main.jsx` mounts `App` under React Strict Mode.
- `App.jsx` contains navigation, global state, business formulas, every screen, and most prototype interactions.
- `icons.jsx` contains the local SVG glyph system.
- `styles.css` contains the full visual system and responsive rules.
- `dashboardData.json` is generated ahead of time and imported into the browser bundle.
- There is no runtime request to an API.

## 4. Data flow

```text
Private source export
  → local anonymizer
  → ignored anonymized XLSX
      + ignored OFFICIAL_ADMISSION_KNOWLEDGE_2026.md
      + optional tracked V4 code fallback
  → tools/build_dashboard_v5_data.py
  → outputs/dashboard-v5/src/dashboardData.json
  → React/Vite bundle
  → GitHub Pages
```

Detailed stages:

1. `anonymize_admissions_data.py` classifies columns by header name and masks identifiers, contacts, documents, birth dates, addresses, comments, and dates.
2. `build_dashboard_v5_data.py` reads the anonymized workbook with `openpyxl`, parses official bachelor/specialist plan rows from the knowledge Markdown, aggregates data, and writes JSON.
3. The browser imports JSON statically. Filters select precomputed slices and dynamics collections.
4. UI-only formulas in `App.jsx` add modeled event conversion (10%), paid demand (18%), risk categories, recommended actions, and the modeled 2025 line. Budget fill is generated from active AIS consents.
5. Tasks are the only user-created persistent state. They are stored in browser `localStorage`.

The exact command used to produce the committed JSON is not stored as a script or manifest. The input workbook and knowledge file are ignored by Git. Reproducible regeneration therefore **требует подтверждения** of the input paths and versions.

## 5. Runtime component structure

`App.jsx` is a monolithic composition root with these reusable primitives:

- `Badge`: neutral/high/medium/green state label.
- `Source`: source pill for AIS, official plan, model, or campaign status.
- `Panel`: titled content container.
- `Progress`: capped 0–100% horizontal indicator.
- `Empty`: empty-state message.
- `Metric`: KPI card with icon, source, value, and description.
- `DynamicsChart`: responsive canvas chart with slider and 2025 model.
- `GlobalFilters`: level, form, funding basis, faculty/institute, and program.

Screen components:

- `Overview`
- `DirectionsView`
- `RankingView`
- `ApplicantsView`
- `IntersectionsView`
- `CommunicationsView`
- `TasksView` and `TaskModal`
- `AnalyticsView`
- `ReportsView`
- `QualityView`
- `SettingsView`

`App` owns:

- active screen;
- mobile-menu state;
- toast state;
- five global filters;
- task-modal state;
- tasks loaded from and saved to `localStorage`.

There is no router. Screen navigation is in-memory state, so direct URLs do not identify individual screens.

## 6. Filter and selection flow

Initial filter state:

```text
level   = Бакалавриат и специалитет
form    = Все формы
basis   = all
faculty = all
program = all
```

Changing level resets form, faculty, and program. Changing faculty resets program. Other filter changes do not reset dependent values.

Precomputed keys:

- scope: `level|form|basis`;
- faculty slice: `form|basis`;
- program slice: `form|basis`;
- dynamics:
  - `scope:level:form`;
  - `faculty:level:form:faculty`;
  - `program:form:programId`.

Filter application is not uniform across all screens. The exact coverage matrix is documented in `docs/UI_CONTRACT.md`.

## 7. Styling and responsive structure

The application uses local Gilroy font files and the supplied Moscow Polytech logo. Main layout:

- fixed dark sidebar;
- white top bar;
- sticky global filters on wide screens;
- light workspace with white analytical panels.

Breakpoints in `styles.css`:

- `1380px`: narrower sidebar, three-column KPI layout, wrapping filters;
- `1200px`: management overview becomes one column;
- `900px`: major two-column layouts become one column;
- `767px`: mobile drawer, burger menu, stacked filters, horizontally swipeable KPI cards, card-form management rows, and locally scrollable tables.

The current audit targets desktop `1440×1100` and mobile `390×844`.

## 8. Build and deployment

V5 package scripts:

- `pnpm run dev`: Vite development server;
- `pnpm run build`: Vite build plus Sites packaging;
- `pnpm run preview`: Vite preview server;
- `pnpm run test:sites`: Node tests for the Sites worker and output packaging.

Vite writes the browser bundle to `dist/client`. `prepare-sites-build.mjs` additionally copies the worker and hosting metadata to `dist/server` and `dist/.openai`.

GitHub Pages does not use the worker. Its workflow:

1. checks out `main`;
2. installs and builds V4;
3. installs and builds V5;
4. copies the version selector and published dashboard folders into `pages-site`;
5. uploads and deploys the Pages artifact.

The worker exists for an alternate Sites-compatible handoff and implements an HTML-route fallback. It is not the current production host.

## 9. Existing verification

- `tests/sites-worker.test.mjs`: four tests for static assets, SPA fallback, API/write-request behavior, and required build files.
- `tools/audit_dashboard_v5.mjs`: 34 checks covering KPI order, factual consents, fill, faculty/program summaries, filters, date slider, hierarchy, ranking, applicant exams/touches, intersections, communications, reports, quality, settings, tasks, persistence, desktop/mobile overflow, mobile controls, console errors, and resource failures.
- `outputs/dashboard-v5/audit/`: baseline screenshots and the latest JSON audit result. Current recorded result: 34 passed, 0 failed.

## 10. Architectural risks in the current stable state

1. **Monolithic frontend.** UI composition and business formulas are concentrated in `App.jsx`; a small change can affect unrelated screens.
2. **Unreproducible data build.** Required source files are ignored and the exact generator invocation/version manifest is not committed.
3. **Duplicated rules.** Official totals exist in generator constants and generated JSON; campaign status, 12% conversion, risk thresholds, CRM counts, and events are hard-coded in UI.
4. **Consent date semantics.** AIS consent fields are now used as facts, but the exact business timestamp and cancellation history still require confirmation.
5. **Static generated snapshot.** Public V5 imports a generated JSON snapshot and does not refresh from AIS at runtime.
6. **Fuzzy program matching.** Program/profile association uses normalized substring matching and an optional V4 fallback; false matches are possible.
7. **Program identity can merge contexts.** `programId` is level + code + name; it omits faculty, form, and basis even though the knowledge file recommends a more detailed key.
8. **Ranking is computed globally, filtered later.** Place and `topList` are generated before UI form/basis filtering; their interpretation under a narrowed filter **требует подтверждения**.
9. **Two potential models.** The projected score range caps priority-1–2 candidates at the plan, while overview risk multiplies the priority pool by 12%. These are different models with similar wording.
10. **Branch scope.** All branch rows are deliberately excluded from V5 and require separate analytical boards; official all-university plan totals therefore differ from the main-campus displayed plan.
11. **Incomplete program plans for levels.** Aggregate totals exist for magistracy/postgraduate study, but the Markdown parser only imports program-level bachelor/specialist plans.
12. **Prototype-only actions.** Export, reports, notifications, settings, and CRM actions show UI feedback but have no backend effect.
13. **Client-only task storage.** Tasks are device/browser-local and have no multi-user consistency or audit trail.
14. **Static timestamps.** The data update date is hard-coded by the generator, not derived from a manifest or API.
15. **Privacy preprocessing risk.** The generic anonymizer does not explicitly classify the header `Личное дело` as an identifier; V5 hashes its parsed number before publication, but the intermediate anonymized workbook can still retain it.
