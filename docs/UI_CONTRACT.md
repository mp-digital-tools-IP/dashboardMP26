# UI Contract — Dashboard V5

## 1. Scope

This contract records the visible and interactive state of `outputs/dashboard-v5/` at commit `2a88f3e`. It is a regression contract, not a redesign specification.

The public version selector also exposes V1, V2, and V4. Those are historical independent applications and must remain available, but the detailed screen contract below applies to V5.

## 2. Global application shell

Every V5 screen shares:

- Moscow Polytech logo from `public/assets/polytech_logo_main_RGB_RUS.png`;
- product block: «Цифровой центр управления» / «приёмной кампанией 2026»;
- dark left sidebar on desktop;
- page title and subtitle;
- top actions:
  - notifications icon with indicator;
  - «Экспорт»;
  - «Действия» with the number of unfinished tasks;
- global filter bar;
- data-slice date from `data.source.updated`;
- footer status «Без персональных данных / Публичная демонстрация».

The export, notification, report, settings, and synchronization controls are prototype interactions. They do not call a backend.

## 3. Navigation screens

The sidebar contains exactly eleven entries in this order:

1. Обзор
2. Направления
3. Рейтинг
4. Абитуриенты
5. Пересечения
6. Коммуникации
7. Задачи
8. Аналитика
9. Отчёты
10. Качество данных
11. Настройки

There is no URL router. Navigation changes React state. The active screen is not encoded in the URL.

## 4. Global filters

The global filter bar contains exactly five selectors:

| Filter | Values/source | Reset behavior |
|---|---|---|
| Уровень | Keys of `officialTotals` | Resets form, faculty, and program |
| Форма | «Все формы» plus forms available for the selected level | Does not reset program |
| Основа | Бюджет и платное (`all`), Бюджет, Платное | Does not reset other filters |
| Факультет / институт | V5 faculties for selected level | Resets program |
| Программа | V5 programs for selected level and faculty | No dependent reset |

Initial values: bachelor/specialist, all forms, both funding bases, all subdivisions, all programs.

### Actual filter coverage by screen

| Screen | Level | Form | Basis | Faculty | Program | Notes |
|---|---:|---:|---:|---:|---:|---|
| Обзор | yes | yes | yes | yes | yes | Graphs do not use basis |
| Направления | yes | metrics | metrics | yes | selected item | Local code/name search also applies |
| Рейтинг | yes | yes | yes | yes | yes | Local program selector changes global program |
| Абитуриенты | no | no | no | yes | yes | With program=`all`, selected level is not applied |
| Пересечения | yes | no | no | no | yes | Limited to 30 rendered pairs |
| Коммуникации | no | no | no | no | no | Static prototype values |
| Задачи | no | no | no | no | no | Browser-local state |
| Аналитика | yes | yes | yes | charts | charts | Faculty comparison itself includes all faculties of selected level |
| Отчёты | no | no | no | no | no | Text says selected slice, but no report is produced |
| Качество данных | no | no | no | no | no | Global dataset summary |
| Настройки | no | no | no | no | no | Prototype controls |

Uneven filter coverage is part of the current behavior. Changing it **требует подтверждения**.

## 5. Common visual elements

### Source labels

The interface distinguishes:

- `АИС «Приём»`;
- `План приёма`;
- `Модель`;
- `Статус кампании`.

These labels are mandatory where currently present. A modeled number must not be presented with an AIS or plan label.

### Status badges

Available visual tones:

- neutral;
- high/red;
- medium/orange;
- green.

Risk text and badge color must remain aligned.

### Empty states

When a selected slice has no program, rating, applicant, or dynamics rows, the screen shows an explicit empty-state panel rather than failing or rendering stale data.

## 6. Screen contract

### 6.1 Обзор

Title: «Обзор кампании».

Mandatory order:

1. eight KPI cards;
2. faculty/institute management table and management-focus panel;
3. two dynamics charts.

The Overview does not show a separate consent-explanation banner; source badges remain inside the KPI cards.

The eight KPI cards are:

1. Потенциальные абитуриенты — `100 000`, labeled as a model/contact base;
2. Заявления по программам — unique person × educational-program pairs;
3. Подали заявление, людей — unique personal files;
4. Конверсия в подачу — `≈10%`, modeled event participant → applicant conversion;
5. Согласия, факт — active consent with all submitted consents in detail;
6. Высокобалльники 85+ — total and active-consent count with the subject formula;
7. Бюджетный набор заполнен — active consents assigned once and capped by program plan;
8. Платный набор заполнен — clearly labeled 18% demand model.

The management table contains:

- Faculty / institute;
- Actual budget fill / plan;
- Submitted people, applications, and modeled demand;
- Active/all consents;
- High scorers / active high-scorer consents;
- Risk;
- Management action.

Each row opens Directions scoped to that faculty. The management-focus panel shows five programs sorted by risk and coverage; each includes plan, consents, high scorers, risk, and action.

Charts:

- «Динамика поданных заявлений»;
- «Динамика платных заявлений».

### 6.2 Направления

Title: «Направления и программы».

Left panel:

- local search by code/name/faculty;
- hierarchy grouped by `groupCode`;
- group count;
- program code, name, faculty, and application count;
- selected state.

Right detail panel:

- code, name, faculty, and plan source;
- factual AIS consent notice;
- four detail metrics:
  - people;
  - applications;
  - factual consents;
  - high scorers 85+;
- plan/fill and score blocks:
  - budget and paid plan;
  - actual budget fill and clearly labeled paid-demand model;
  - average score of the consent-based upper list or fallback calculated range;
  - calculated boundary, explicitly not an official passing score;
- risk and recommended action;
- «В очередь» button opening a prefilled task modal;
- dynamics chart for the selected program.

### 6.3 Рейтинг

Title: «Рейтинговый список».

Mandatory elements:

- factual AIS consent status;
- program selector;
- four KPI cards:
  - budget places;
  - modeled potential choice;
  - modeled average score;
  - modeled boundary;
- ranking table.

Table columns:

1. Place
2. Anonymous applicant code
3. Score
4. Priority
5. Consent status
6. Application status
7. Calculated range

The badge «В диапазоне» is a model, not consent, enrollment, or an official passing result.

### 6.4 Абитуриенты

Title: «Абитуриенты».

Mandatory elements:

- privacy notice and factual consent status;
- search by anonymous ID;
- filters by minimum touches, score range, and consent;
- sorting by score, touches, or consent;
- anonymized trajectory list;
- selected applicant summary with maximum competition score, exam count, program count, touches, segment, and consent;
- actual anonymized exam-subject results;
- communication-touch timeline containing modeled events, open days, and CRM calls, each explicitly labeled as a model; AIS applications and consents are never counted as touches;
- dedicated consent destinations list tied to exact program/form/basis;
- application/priorities list:
  - priority;
  - program code and name;
  - faculty;
  - form;
  - basis;
  - score;
  - application status.

The screen must not show names, contacts, documents, addresses, free text, or the source personal-file number.

### 6.5 Пересечения

Title: «Пересечения программ».

Mandatory elements:

- explanation that intersections are between individual educational programs, while the base code is only the parent group;
- list of strongest pairs;
- both program codes and names;
- unique-person intersection count;
- click behavior selecting the left program.

At most 30 rows are rendered from the precomputed top 80 intersections.

### 6.6 Коммуникации

Title: «Коммуникации».

Mandatory warning: CRM→AIS end-to-end conversion is unavailable; event conversion is not presented as a measured fact.

Five KPI cards show contacts, reached contacts, submitted-document CRM statuses, refusals, and repeated interest.

A V4-style event list opens a detail panel with four result measures. Current event examples include:

- День открытых дверей — 496 contacts, 54 submitted, CRM;
- Другие CRM-формы — 26 contacts, 4 submitted, CRM;
- Профориентационные мероприятия — 43 contacts, result awaiting upload;
- Выставка «Образование и карьера» — 400 contacts, 57 submitted, 9 no answer, 3 refusals, 25 in work.

These values are hard-coded prototype values. Their source/version **требует подтверждения**.

### 6.7 Задачи

Title: «Очередь действий».

Mandatory elements:

- local queue count;
- «Добавить задачу» button;
- three Kanban columns:
  - К выполнению;
  - В работе;
  - Готово;
- task card:
  - priority;
  - ID;
  - title;
  - owner;
  - due label;
  - transition button when not completed;
- modal fields:
  - task title;
  - owner;
  - priority;
  - submit and close actions.

Tasks persist after reload in `localStorage["dashboard-v5-tasks"]`. They are not shared between browsers or users.

### 6.8 Аналитика

Title: «Аналитика».

Mandatory elements:

- factual consent/model warning;
- general-flow chart;
- paid-demand chart;
- segment panel with six values:
  - people;
  - applications;
  - active personal files;
  - budget potential pool;
  - factual consents;
  - high scorers 85+;
- faculty/institute comparison with people, applications, active consents, and high scorers;
- contracts-and-money panel explicitly labeled as a model because contracts and payments are not loaded.

### 6.9 Отчёты

Title: «Отчёты».

A leadership 3–3–3 summary (three figures, three risks, three actions), four report cards, and a three-row export history:

- Сводка для руководства — PDF;
- Срез по факультетам — XLSX;
- Срез по программам — XLSX;
- Контроль качества данных — XLSX.

The buttons only show a toast. No file is generated or downloaded. Any statement that these controls create a real report **требует подтверждения**.

### 6.10 Качество данных

Title: «Качество данных».

Four KPI cards:

- source AIS rows;
- main-campus people;
- educational programs;
- active factual consents.

Mandatory blocks:

- source-status table;
- metric dictionary;
- method rules for branch exclusion, consent fill, high scorers, scores, and models;
- data-safety panel;
- next required data steps.

### 6.11 Настройки

Title: «Настройки».

Four large settings panels:

- updates and synchronization;
- risk thresholds;
- local AI/server status;
- role/access overview.

All controls are local prototype UI. They do not change calculations, persist settings, configure a server, or grant real access.

## 7. Dynamics chart contract

`DynamicsChart` is canvas-based and responsive.

Main chart:

- 2026 application line;
- 2026 unique-people line;
- dashed model 2025 line;
- selected-date marker;
- values for selected date.

Paid chart:

- 2026 paid-application line;
- dashed model 2025 line;
- selected-date marker;
- values for selected date;
- modeled expected contracts, average annual price, and potential amount.

Both include:

- legend;
- exact selected date;
- range slider;
- first and last date on desktop;
- model disclaimer; the paid chart states that amount is not actual contracts or payments.

Changing the slider must update the date and values. The basis filter does not currently change the chart series.

## 8. Responsive contract

### Desktop

At 1440 px:

- fixed sidebar;
- five filters visible in the global bar;
- no page-wide horizontal scroll;
- eight KPI cards in a dense grid;
- readable management table;
- chart panels side by side;
- body ≥12 px, navigation ≥14 px, panel heading ≥17 px, KPI value ≥26 px, KPI label ≥12 px, source label ≥9 px.

### Mobile

At 390 px:

- fixed 44×44 burger button;
- off-canvas sidebar and backdrop;
- menu closes after navigation;
- stacked global filters;
- KPI cards swipe horizontally;
- management rows become cards inside the viewport;
- major grids become one column;
- wide tables scroll inside their container, not the whole page;
- key visible buttons are at least 40 px in both dimensions;
- no page-wide horizontal scroll.

## 9. Accessibility and interaction baseline

- Burger button has `aria-label` and `aria-expanded`.
- Backdrop and modal close buttons have accessible labels.
- Canvas charts have descriptive `aria-label`.
- Keyboard focus must remain visibly outlined.
- Program groups use native `details/summary`.
- Interactive management, program, applicant, and intersection rows are buttons.
- Current audit does not include a full WCAG/axe scan; comprehensive accessibility **требует подтверждения**.

## 10. Historical published interfaces

The Pages selector must continue to link to:

- `dashboard-v1/`;
- `dashboard-v2/`;
- `dashboard-v4/`;
- `dashboard-v5/`.

V1 and V2 are static prototypes with their own dashboard tables, filters, recommendations, and charts. V4 is the previous React management dashboard. Their detailed internal behavior is not part of the V5 regression contract, but their files and public URLs must not disappear.
