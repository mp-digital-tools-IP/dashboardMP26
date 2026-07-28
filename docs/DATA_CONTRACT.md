# Data Contract — Dashboard V5

## 1. Scope and authority

This document records the data structures and calculations currently present in:

- `tools/build_dashboard_v5_data.py`;
- `outputs/dashboard-v5/src/dashboardData.json`;
- UI-only calculations in `outputs/dashboard-v5/src/App.jsx`;
- local `OFFICIAL_ADMISSION_KNOWLEDGE_2026.md`.

It describes implementation behavior, not an assertion that every source field has correct business semantics.

Where implementation and business meaning conflict, the item is marked **требует подтверждения**.

## 2. Data sources

| Source | Current role | Tracking/status |
|---|---|---|
| `Пробуем отклонить_anonymized.xlsx` | Row-level anonymized AIS input to V5 generator | Local/ignored; 175,970 rows |
| `OFFICIAL_ADMISSION_KNOWLEDGE_2026.md` | University totals and bachelor/specialist program plans | Local/ignored |
| `outputs/dashboard-v4/src/admissionsActuals.json` | Optional fallback mapping from direction name to code | Tracked migration dependency |
| CRM/event values in `App.jsx` | Communications prototype | Hard-coded; source version requires confirmation |
| `100 000` contact base | Potential applicant KPI | Project model/assumption |
| 2025 line | Visual comparison | Modeled from 2026, not an official export |

Generated source metadata:

- `source.file`: `Пробуем отклонить_anonymized.xlsx`;
- `source.rows`: `175970`;
- `source.updated`: `27.07.2026`;
- `source.ryazanExcluded`: `true`;
- `allExport.people`: `26693`.

The update date is hard-coded in the generator. It is not derived from file metadata.

## 3. Required input columns

The V5 generator fails if any of these columns are missing:

- `anon_applicant_id`;
- `Личное дело`;
- `Сумма баллов`;
- `Согласие на зачисление`;
- `Приоритет`;
- `Форма обучения`;
- `Источник финансирования`;
- `Уровень подготовки`;
- `Направление\специальность`;
- `Профиль`;
- `Подразделение`;
- `Текущий статус конкурса`.

Optional subject columns are read as pairs `Дисциплина1..10` and `Предмет1..10`.

## 4. Normalization mappings

### Level

| Input | Output |
|---|---|
| Бакалавриат | Бакалавриат и специалитет |
| Специалитет | Бакалавриат и специалитет |
| Магистратура | Магистратура |
| Аспирантура | Аспирантура |

Rows with any other level are excluded from calculated scopes.

### Form

Recognized forms:

- Очная;
- Очно-заочная;
- Заочная.

Any other non-empty form is retained as its source text, but official plan support for it is absent.

### Funding basis

| Input | Output |
|---|---|
| Федеральный бюджет | `budget` |
| Внебюджетные средства | `paid` |
| Any other value | `other` |

Published slices are built only for `all`, `budget`, and `paid`.

### Faculty exclusion

Rows whose faculty text contains `рязан`, case-insensitive, are skipped after the person has already been added to `allExport.people`.

Therefore:

- V5 scopes/faculties/programs exclude Ryazan;
- `allExport.people` may still include people seen only in excluded rows;
- `source.rows` still counts all workbook rows.

This boundary **требует подтверждения** if `allExport` is expected to mean the same filtered universe as the dashboard.

## 5. Identity and units

### Source row

One worksheet row. `source.rows` and `allExport.rows` equal worksheet maximum row minus the header.

A row is not a person and not an application.

### Person

Primary key:

1. parse digits from `Личное дело <number>`;
2. if parsing fails, use `anon_applicant_id`.

Published anonymous ID:

```text
AB-26- + first 6 uppercase hex characters of SHA-256("pk26:" + personKey)
```

The fixed salt and short ID are implementation details; collision and re-identification risk **требует подтверждения** for production use.

### Application

Unique pair:

```text
(personKey, programId)
```

This deduplicates technical rows for the same person and program. Form and basis are not part of `app_key`.

### Program identity

```text
levelGroup + "|" + code + "|" + official/fallback program name
```

Faculty, form, and funding basis are not part of the ID. This differs from the local knowledge recommendation to key by year + code + program + form + basis and **требует подтверждения**.

## 6. Official plans

### Aggregate totals

| Level/form | Budget | Paid |
|---|---:|---:|
| Bachelor + specialist, all forms | 2,854 | 5,369 |
| Bachelor + specialist, full-time | 2,373 | 3,665 |
| Bachelor + specialist, part-time | 151 | 690 |
| Bachelor + specialist, correspondence | 330 | 1,014 |
| Magistracy, all forms | 779 | 1,953 |
| Postgraduate, all forms | 66 | 0 |

Bachelor/specialist form totals sum to the all-form totals.

### Program plans

The generator parses Markdown table rows only while the current heading is exactly `### Специалитет` or `### Бакалавриат`.

Accepted code pattern:

```text
NN.NN.NN
NN.NN.NN.NN
```

Plan cell:

- single number → budget only;
- `budget / paid` → both values;
- dash/blank → zero.

Program-level magistracy/postgraduate plans are not parsed. Their aggregate totals exist, but program plan values can be zero. This is a known gap and **требует подтверждения**.

## 7. Program matching

For each row the generator chooses a program by:

1. normalizing the profile text;
2. searching official programs of the same raw level;
3. accepting a normalized substring match in either direction;
4. choosing the longest matching candidate;
5. if no profile match, using a V4 direction-name→code fallback;
6. otherwise assigning code `—` and zero plans.

The matching result is cached by `(profile, direction, rawLevel)`.

The algorithm is heuristic. There is no committed match-quality report or assertion that every source profile maps uniquely.

## 8. Aggregate statistics object

The following fields appear in scope, faculty, and program aggregates/slices:

| Field | Type | Current calculation |
|---|---|---|
| `rows` | integer | Number of source rows added to the bucket |
| `people` | integer | Count of unique person keys |
| `applications` | integer | Count of unique `(person, programId)` pairs |
| `activePeople` | integer | Unique people with status exactly «Участвует в конкурсе» |
| `consentPeople` | integer | Unique people with source field «Согласие на зачисление» = «да» |
| `activeConsentPeople` | integer | Unique source-consent people also active |
| `potentialBudgetPeople` | integer | Unique active budget people with priority ≤2 |
| `budgetRows` | integer | Source rows mapped to budget |
| `paidRows` | integer | Source rows mapped to paid |
| `medianScore` | integer/null | Middle value of sorted row-level score list |
| `highScorers` | integer | Unique bucket people that satisfy the high-score formula |

Important:

- `medianScore` uses row-level scores, so people/applications can contribute multiple times.
- For an even-length list, the upper middle item is used; the two middle values are not averaged.
- The intended business meaning of this median **требует подтверждения**.

Scope objects additionally receive `planBudget` and `planPaid` according to level/form/basis.

## 9. Consent status

The generated JSON and stable V5 UI use:

- `consentPeople`: unique people with a submitted consent flag;
- `activeConsentPeople`: unique people with consent who remain active in the competition;
- row-level `consent`: source consent status for the application row;
- `highScorerConsents` and `activeHighScorerConsents`;
- `budgetFilled` and `budgetFillRate`.

Budget fill assigns at most one best-priority active budget consent per person and caps each educational program at its plan. Submitted and active consents must be shown separately. The exact historical timestamp/cancellation semantics of source flags **требует подтверждения**.

## 10. High scorers 85+

For each person, the generator takes the maximum observed score per discipline name.

Token matching:

- mathematics: discipline contains `математ`;
- physics: contains `физик`;
- informatics: contains `информат`.

Formula:

```text
math >= 85 AND (physics >= 85 OR informatics >= 85)
```

A bucket count is the intersection of the bucket's unique people and the global high-scorer person set.

## 11. Potential budget models

### Priority pool

`potentialBudgetPeople` is the count of unique people satisfying all:

- basis = budget;
- status = active;
- priority ≤2.

This is a signal of intent, not consent.

### Modeled potential choice

Calculated only in `App.jsx`:

```text
expected = round(potentialBudgetPeople × 0.12)
```

The 12% coefficient is hard-coded and has no source/version metadata. Its empirical basis **требует подтверждения**.

### Risk

For a nonzero budget plan:

```text
coverage = expected / plan
high risk   if coverage < 0.90
medium risk if 0.90 <= coverage < 1.15
low risk    if coverage >= 1.15
```

If plan is zero, risk is `Нет плана`.

Recommended action text is selected only from this risk category. The thresholds and actions are UI constants, not generator output.

## 12. Calculated score range

For each program:

1. take ranking rows with:
   - budget basis;
   - active status;
   - priority ≤2;
   - score >0;
2. sort by:
   - score descending;
   - priority ascending;
   - anonymous ID;
3. take the first `planBudget` rows across all forms;
4. calculate:
   - `projectedTopCount`;
   - `projectedTopRate`;
   - `projectedAverageScore`;
   - `projectedBoundaryScore`.

Legacy fields are forced to:

- `budgetFilled = 0`;
- `budgetFillRate = 0`;
- `topAverageScore = null`;
- `topBoundaryScore = null`.

The calculated range is not the 12% expected-choice model and is not an official passing score.

## 13. Rankings

For each program, ranking candidates are deduplicated by:

```text
(person, form, basis)
```

When duplicate rows exist, the preferred row has lower priority and then higher score.

Published ranking output:

- sorted by score descending, then priority ascending, then anonymous ID;
- limited to 80 rows per program;
- place assigned before UI filtering;
- `topList` set when anonymous ID belongs to the all-form projected range.

Ranking row fields:

| Field | Meaning |
|---|---|
| `id` | Anonymous applicant ID |
| `score` | Source total score or zero |
| `priority` | Parsed integer; missing becomes 999 |
| `consent` | Source technical flag; not shown as current fact |
| `active` | Exact active-status match |
| `status` | Source competition status |
| `form` | Normalized/source form |
| `basis` | budget/paid/other |
| `place` | Position in the limited all-form/all-basis output |
| `topList` | Anonymous ID membership in modeled priority range |

Known ambiguities:

- place is not recalculated after form/basis filtering;
- `topList` is keyed only by anonymous ID, so another row for the same person can inherit membership;
- program projected range uses the all-form budget plan;
- the UI label «Рейтинг» is not the official consent-based ranking described in the knowledge file.

These semantics **требует подтверждения** before operational use.

## 14. Applicant sample

The public applicant list is not the full population.

Selection:

- sort all applicant metadata by maximum score descending, then anonymous ID;
- take first 120 people;
- keep at most 12 distinct applications per person.

Person fields:

- `id`;
- `score` = maximum observed total score;
- `faculties` = sorted unique faculties;
- `segment`;
- `applications`.

Segment priority:

1. Высокобалльник 85+;
2. Приоритет 1–2;
3. Активен в конкурсе;
4. Требует внимания.

Application fields:

- `programId`;
- `code`;
- `name`;
- `faculty`;
- `score`;
- `priority`;
- `consent` factual flag for this exact program/form/basis;
- `status`;
- `form`;
- `basis`;
- `active`.

Person-level `consentPrograms` contains at most one application: the active source-consent row with the best priority, then budget basis and higher score; it preserves program/form/basis. `touchpoints` contains only communication events (event participation, open day, consultation, or CRM call); AIS applications and consents are not touches. Until CRM↔AIS identity resolution exists, V5 generates 1–3 modeled touches without consent and 3–5 with consent. The deterministic model is derived from the anonymous person key and dates preceding the first application. Every event has `modeled = true`, source `Модель CRM`, and a visible disclaimer.

Because the sample is score-biased, it must not be treated as representative of all applicants.

## 15. Intersections

For each person:

1. collect distinct program IDs;
2. sort them;
3. if more than 12, keep the first 12;
4. count every unordered pair;
5. publish the 80 most common pairs.

Fields:

- `a`: left program ID;
- `b`: right program ID;
- `count`: unique people contributing to the pair.

The UI renders at most 30 pairs. Truncating people with more than 12 programs can undercount some intersections.

## 16. Dynamics

Application date is parsed from `Личное дело` using:

```text
"от DD.MM.YYYY"
```

For each scope/faculty/program dynamics key:

- person date = earliest row date for that person;
- application date = earliest row date for `(person, programId)`;
- paid date = earliest row date for a paid `(person, programId)`;
- output is a daily cumulative series from earliest to latest available date.

Dynamic row fields:

- `date`: `DD.MM.YYYY`;
- `people`;
- `applications`;
- `paid`.

There are currently 237 dynamics collections.

The basis filter is not part of a dynamics key and does not alter the chart series.

## 17. Paid amount model

For a selected paid-chart date:

```text
modeledContracts(date) = round(finalModeledContracts × paidApplications(date) / finalPaidApplications)
averageAnnualPrice = 310,000 RUB
modeledAmount(date) = modeledContracts(date) × averageAnnualPrice
```

`finalModeledContracts` is the existing 18% paid-interest model. The amount is not a fact of concluded contracts, invoicing, or payment. The average price is a demonstration assumption and **требует подтверждения**.

## 18. Model 2025

For index `i` in a series of length `n`:

```text
progress = i / (n - 1), or 1 when n <= 1

main factor = 0.90 + 0.04 × progress
paid factor = 0.88 + 0.05 × progress

model2025 = round(value2026 × factor)
```

Thus:

- main flow progresses from 90% to 94% of 2026;
- paid flow progresses from 88% to 93% of 2026.

This is explicitly a visual estimate, not 2025 source data.

## 19. JSON top-level contract

Current top-level objects:

| Key | Current size/role |
|---|---|
| `source` | Source metadata |
| `officialTotals` | Aggregate plans |
| `allExport` | 175,970 source rows; 22,565 main-campus people after branch exclusion |
| `definitions` | UI dictionary |
| `scopes` | 12 level/form/basis aggregates |
| `faculties` | 11 main-campus faculty/institute objects |
| `programs` | 65 main-campus program objects |
| `dynamics` | 237 cumulative series |
| `rankings` | 78 program ranking arrays |
| `applicants` | 240 balanced anonymized trajectories with exams, program-specific consents, and communication-touch status |
| `intersections` | 80 program pairs |

### Faculty object

Contains base aggregate fields plus:

- `name`;
- `level`;
- `slices[form|basis]`.

### Program object

Contains base aggregate fields plus:

- identity: `id`, `code`, `groupCode`, `name`, `faculty`, `level`;
- plans: `plans`, `planBudget`, `planPaid`;
- modeled range fields;
- factual consent-based fill fields and modeled-range fallback;
- `slices[form|basis]`.

## 20. UI dependency map

| UI area | Data/calculation |
|---|---|
| Global filters | `officialTotals`, `faculties`, `programs` |
| Overview KPI | selected scope + official total + UI constants |
| Overview table | faculty slices + program plans + 12% model + risk |
| Management focus | program slices + plans + risk |
| Directions | program identity/plans/slices + modeled range |
| Ranking | rankings + program model fields |
| Applicants | 240-person sample with program-specific consent, exams, per-program scores, and explicitly modeled communication touches |
| Intersections | top 80 intersections |
| Communications | hard-coded UI constants |
| Tasks | hard-coded initial tasks + localStorage |
| Analytics | scopes, faculty slices, dynamics |
| Quality | source/allExport/definitions + UI source statuses |
| Reports/settings | no data backend |

## 21. Data logic requiring confirmation

1. Exact campaign date, cancellation history, and owner of source consent flags.
2. Evidence and owner of the 12% potential-choice coefficient.
3. Approval of 0.90/1.15 risk thresholds and action mapping.
4. Whether ranking must be recalculated per form and basis.
5. Whether `topList` should be person-, application-, or competition-group-specific.
6. Whether projected range should use the 12% model or the full priority pool.
7. Authoritative key for a program/competition group.
8. Accuracy of fuzzy profile-to-program matching.
9. Program-level magistracy and postgraduate plans.
10. Intended unit for `medianScore`.
11. Reconciliation of official all-university totals with the main-campus-only program plan after all branches are excluded.
12. Provenance and refresh date for CRM/event constants.
13. Provenance of the 100,000 contact assumption.
14. Exact reproducible generator command and source-file versions.
15. Whether date parsing from `Личное дело` is an approved source for filing dynamics.
