import { useEffect, useMemo, useRef, useState } from "react";
import {
  SquaresFour, GraduationCap, ListNumbers, UsersThree, ArrowsLeftRight, ChatCircleDots,
  CheckSquare, ChartLineUp, FileText, Database, Gear, Bell, DownloadSimple, Funnel,
  Target, Buildings, CurrencyRub, TrendUp, CheckCircle, WarningCircle, CaretRight,
  MagnifyingGlass, Plus, X, List, Clock, ShieldCheck, Sparkle, CaretDown, UserFocus,
} from "./icons.jsx";
import data from "./dashboardData.json";

const nav = [
  ["overview", "Обзор", SquaresFour], ["directions", "Направления", GraduationCap],
  ["ranking", "Рейтинг", ListNumbers], ["applicants", "Абитуриенты", UsersThree],
  ["intersections", "Пересечения", ArrowsLeftRight], ["communications", "Коммуникации", ChatCircleDots],
  ["tasks", "Задачи", CheckSquare], ["analytics", "Аналитика", ChartLineUp],
  ["reports", "Отчёты", FileText], ["quality", "Качество данных", Database],
  ["settings", "Настройки", Gear],
];

const titles = {
  overview: ["Обзор кампании", "Ключевые показатели, факультеты и динамика"],
  directions: ["Направления и программы", "Иерархия кодов, конкурс и управленческие действия"],
  ranking: ["Рейтинговый список", "Обезличенный текущий срез по выбранной программе"],
  applicants: ["Абитуриенты", "Реальные обезличенные траектории из АИС"],
  intersections: ["Пересечения программ", "На какие образовательные программы подают одни и те же люди"],
  communications: ["Коммуникации", "Подтверждённые статусы CRM и готовность сквозной аналитики"],
  tasks: ["Очередь действий", "Задачи сохраняются в этом браузере"],
  analytics: ["Аналитика", "Сравнение потоков, факультетов и сегментов"],
  reports: ["Отчёты", "Управленческие срезы с происхождением показателей"],
  quality: ["Качество данных", "Единицы учёта, источники и ограничения"],
  settings: ["Настройки", "Пороговые сигналы и будущая синхронизация"],
};

const fmt = (value) => new Intl.NumberFormat("ru-RU").format(Number(value || 0));
const pct = (value) => `${Number(value || 0).toFixed(1).replace(".", ",")}%`;
const basisNames = { all: "Бюджет и платное", budget: "Бюджет", paid: "Платное" };
const initialTasks = [
  { id: "TASK-501", title: "Проверить программы с высоким риском недобора", owner: "Аналитическая группа", priority: "high", status: "todo", due: "Сегодня" },
  { id: "TASK-502", title: "Подготовить сценарий коммуникации до старта согласий", owner: "Приёмная комиссия", priority: "medium", status: "progress", due: "29 июля" },
  { id: "TASK-503", title: "Подготовить срез по платному спросу", owner: "Договорной отдел", priority: "low", status: "done", due: "Выполнено" },
];

function Badge({ tone = "neutral", children }) { return <span className={`badge badge-${tone}`}>{children}</span>; }
function Source({ type = "ais", children }) { return <span className={`source source-${type}`}>{children || (type === "plan" ? "План приёма" : type === "model" ? "Модель" : type === "status" ? "Статус кампании" : "АИС «Приём»")}</span>; }
function Panel({ title, subtitle, action, className = "", children }) {
  return <section className={`panel ${className}`}><header className="panel-head"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action}</header>{children}</section>;
}
function Progress({ value, tone = "blue" }) { return <div className="progress"><span className={tone} style={{ width: `${Math.min(100, Math.max(0, value || 0))}%` }} /></div>; }
function Empty({ children }) { return <div className="empty"><WarningCircle size={24}/><b>{children}</b></div>; }

function Metric({ label, value, detail, icon: Icon, tone = "blue", source = "ais", emphasis = false }) {
  return <article className={`metric ${emphasis ? "metric-emphasis" : ""}`}>
    <span className={`metric-icon ${tone}`}><Icon size={22} weight="duotone"/></span>
    <div><div className="metric-label"><p>{label}</p><Source type={source}/></div><strong>{value}</strong><small>{detail}</small></div>
  </article>;
}

function planFor(program, form) {
  if (!program) return { budget: 0, paid: 0 };
  if (form !== "Все формы") return program.plans?.[form] || { budget: 0, paid: 0 };
  return Object.values(program.plans || {}).reduce((sum, item) => ({ budget: sum.budget + item.budget, paid: sum.paid + item.paid }), { budget: 0, paid: 0 });
}
function sliceFor(entity, form, basis) { return entity?.slices?.[`${form}|${basis}`] || entity || {}; }
function modelValue(value, index, length, type) {
  const progress = length <= 1 ? 1 : index / (length - 1);
  const factor = type === "paid" ? .88 + .05 * progress : .90 + .04 * progress;
  return Math.round(value * factor);
}

const REAL_CONSENTS = 0;
const EXPECTED_BUDGET_YIELD = 0.12;
const expectedBudgetChoice = (slice) => Math.round(Number(slice?.potentialBudgetPeople || 0) * EXPECTED_BUDGET_YIELD);
function riskFor(plan, expected) {
  if (!plan) return { key: "none", label: "Нет плана", tone: "neutral", rank: 3, coverage: null };
  const coverage = expected / plan;
  if (coverage < .9) return { key: "high", label: "Высокий", tone: "high", rank: 0, coverage };
  if (coverage < 1.15) return { key: "medium", label: "Средний", tone: "medium", rank: 1, coverage };
  return { key: "low", label: "Низкий", tone: "green", rank: 2, coverage };
}
function actionForRisk(risk) {
  if (risk.key === "high") return "Усилить целевой набор: обзвон приоритетов 1–2, высокобалльники и реклама.";
  if (risk.key === "medium") return "Персонально отработать приоритеты 1–2 и проверить конкурирующие программы.";
  if (risk.key === "low") return "Удерживать интерес и готовить перевод части спроса в платный набор.";
  return "Сверить распределение контрольных цифр приёма.";
}

function DynamicsChart({ rows, type = "main" }) {
  const canvasRef = useRef(null);
  const [selected, setSelected] = useState(Math.max(0, rows.length - 1));
  useEffect(() => setSelected(Math.max(0, rows.length - 1)), [rows]);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !rows.length) return undefined;
    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const scale = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, rect.width * scale); canvas.height = Math.max(1, rect.height * scale);
      const ctx = canvas.getContext("2d"); ctx.setTransform(scale, 0, 0, scale, 0, 0);
      const width = rect.width, height = rect.height, pad = { l: 48, r: 16, t: 18, b: 28 };
      const innerW = width - pad.l - pad.r, innerH = height - pad.t - pad.b;
      const keys = type === "paid" ? ["paid"] : ["applications", "people"];
      const maxValue = Math.max(1, ...rows.flatMap((row) => keys.map((key) => row[key] || 0)));
      ctx.clearRect(0, 0, width, height); ctx.font = "11px Gilroy, Arial"; ctx.fillStyle = "#707985";
      for (let index = 0; index <= 4; index += 1) {
        const y = pad.t + innerH * index / 4;
        ctx.strokeStyle = "#e7ebf0"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(width - pad.r, y); ctx.stroke();
        ctx.fillText(fmt(Math.round(maxValue * (1 - index / 4))), 0, y + 4);
      }
      const point = (value, index) => ({ x: pad.l + innerW * index / Math.max(rows.length - 1, 1), y: pad.t + innerH * (1 - value / maxValue) });
      const line = (values, color, dashed = false) => {
        ctx.beginPath(); values.forEach((value, index) => { const p = point(value, index); index ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); });
        ctx.strokeStyle = color; ctx.lineWidth = dashed ? 2 : 2.8; ctx.setLineDash(dashed ? [7, 5] : []); ctx.lineJoin = "round"; ctx.stroke(); ctx.setLineDash([]);
      };
      const primaryKey = type === "paid" ? "paid" : "applications";
      line(rows.map((row) => row[primaryKey] || 0), type === "paid" ? "#1b9b67" : "#2167ef");
      if (type === "main") line(rows.map((row) => row.people || 0), "#e31e2b");
      line(rows.map((row, index) => modelValue(row[primaryKey] || 0, index, rows.length, type)), "#7f8792", true);
      const marker = point(rows[selected]?.[primaryKey] || 0, selected);
      ctx.strokeStyle = "#aab1bb"; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(marker.x, pad.t); ctx.lineTo(marker.x, pad.t + innerH); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = "#fff"; ctx.strokeStyle = type === "paid" ? "#1b9b67" : "#2167ef"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(marker.x, marker.y, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      [0, Math.floor((rows.length - 1) / 2), rows.length - 1].forEach((index) => { const p = point(rows[index]?.[primaryKey] || 0, index); ctx.fillStyle = "#707985"; ctx.fillText((rows[index]?.date || "").slice(0, 5), p.x - 14, height - 7); });
    };
    draw(); const observer = new ResizeObserver(draw); observer.observe(canvas); return () => observer.disconnect();
  }, [rows, selected, type]);
  if (!rows.length) return <Empty>Для выбранного среза нет дат создания заявлений</Empty>;
  const current = rows[selected] || rows[rows.length - 1];
  const key = type === "paid" ? "paid" : "applications";
  return <div className="dynamics">
    <div className="legend"><span><i className={type === "paid" ? "green" : "blue"}/>2026</span>{type === "main" && <span><i className="red"/>Люди</span>}<span><i className="gray"/>Модель 2025</span><b>{current.date}</b></div>
    <canvas ref={canvasRef} aria-label={type === "paid" ? "Динамика платных заявлений" : "Динамика заявлений"}/>
    <div className="chart-values">
      {type === "main" && <div><span>Людей</span><b>{fmt(current.people)}</b></div>}
      <div><span>{type === "paid" ? "Платных заявлений" : "Заявлений по программам"}</span><b>{fmt(current[key])}</b></div>
      <div><span>Модель 2025</span><b>{fmt(modelValue(current[key], selected, rows.length, type))}</b></div>
    </div>
    <label className="slider"><span>{rows[0].date}</span><input type="range" min="0" max={rows.length - 1} value={selected} onChange={(event) => setSelected(Number(event.target.value))}/><span>{rows.at(-1).date}</span></label>
    <p className="model-note">Модель 2025 — визуализационная оценка: похожая динамика, немного ниже 2026 года.</p>
  </div>;
}

function GlobalFilters({ filters, setFilters, programs, faculties }) {
  const levels = Object.keys(data.officialTotals);
  const availablePrograms = programs.filter((program) => program.level === filters.level && (filters.faculty === "all" || program.faculty === filters.faculty));
  const set = (key, value) => setFilters((old) => ({ ...old, [key]: value, ...(key === "level" ? { form: "Все формы", faculty: "all", program: "all" } : {}), ...(key === "faculty" ? { program: "all" } : {}) }));
  return <div className="filters"><div className="filter-label"><Funnel/> Срез</div>
    <label><span>Уровень</span><select value={filters.level} onChange={(event) => set("level", event.target.value)}>{levels.map((value) => <option key={value}>{value}</option>)}</select></label>
    <label><span>Форма</span><select value={filters.form} onChange={(event) => set("form", event.target.value)}><option>Все формы</option>{Object.keys(data.officialTotals[filters.level] || {}).filter((value) => value !== "Все формы").map((value) => <option key={value}>{value}</option>)}</select></label>
    <label><span>Основа</span><select value={filters.basis} onChange={(event) => set("basis", event.target.value)}>{Object.entries(basisNames).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</select></label>
    <label><span>Факультет / институт</span><select value={filters.faculty} onChange={(event) => set("faculty", event.target.value)}><option value="all">Все подразделения</option>{faculties.filter((item) => item.level === filters.level).map((item) => <option key={item.name}>{item.name}</option>)}</select></label>
    <label className="profile-filter"><span>Программа</span><select value={filters.program} onChange={(event) => set("program", event.target.value)}><option value="all">Все программы</option>{availablePrograms.map((program) => <option key={program.id} value={program.id}>{program.code} · {program.name}</option>)}</select></label>
    <span className="updated"><i/>Срез: {data.source.updated}</span>
  </div>;
}

function currentDynamics(filters) {
  const form = filters.form || "Все формы";
  if (filters.program !== "all") return data.dynamics[`program:${form}:${filters.program}`] || data.dynamics[`program:Все формы:${filters.program}`] || [];
  if (filters.faculty !== "all") return data.dynamics[`faculty:${filters.level}:${form}:${filters.faculty}`] || data.dynamics[`faculty:${filters.level}:Все формы:${filters.faculty}`] || [];
  return data.dynamics[`scope:${filters.level}:${form}`] || data.dynamics[`scope:${filters.level}:Все формы`] || [];
}

function Overview({ filters, programs, faculties, navigate }) {
  const scope = data.scopes[`${filters.level}|${filters.form}|${filters.basis}`] || data.scopes[`${filters.level}|Все формы|${filters.basis}`] || {};
  const officialPlan = data.officialTotals[filters.level]?.[filters.form] || data.officialTotals[filters.level]?.["Все формы"] || { budget: 0, paid: 0 };
  const visiblePrograms = programs.filter((program) => program.level === filters.level && (filters.faculty === "all" || program.faculty === filters.faculty) && (filters.program === "all" || program.id === filters.program));
  const visibleFaculties = faculties.filter((faculty) => faculty.level === filters.level && (filters.faculty === "all" || faculty.name === filters.faculty));
  const programRisks = visiblePrograms.filter((program) => planFor(program, filters.form).budget > 0).map((program) => {
    const plan = planFor(program, filters.form).budget;
    const budgetSlice = sliceFor(program, filters.form, "budget");
    const expected = expectedBudgetChoice(budgetSlice);
    const risk = riskFor(plan, expected);
    return { program, plan, expected, rawPotential: budgetSlice.potentialBudgetPeople || 0, risk };
  });
  const highRiskCount = programRisks.filter((item) => item.risk.key === "high").length;
  const facultyRows = visibleFaculties.map((faculty) => {
    const facultyPrograms = visiblePrograms.filter((program) => program.faculty === faculty.name);
    const plan = facultyPrograms.reduce((sum, program) => sum + planFor(program, filters.form).budget, 0);
    const budgetSlice = sliceFor(faculty, filters.form, "budget");
    const expected = expectedBudgetChoice(budgetSlice);
    const risk = riskFor(plan, expected);
    return { faculty, plan, expected, rawPotential: budgetSlice.potentialBudgetPeople || 0, submitted: budgetSlice.people || 0, applications: budgetSlice.applications || 0, risk };
  });
  const focus = [...programRisks].sort((a, b) => a.risk.rank - b.risk.rank || (a.risk.coverage || 0) - (b.risk.coverage || 0)).slice(0, 5);
  const dynamics = currentDynamics(filters);
  return <>
    <div className="warning consent-stage"><WarningCircle/><span><b>Реальных согласий на зачисление пока нет.</b> Приём согласий ещё не начался, поэтому выполнение бюджетного плана не рассчитывается. Риск ниже — модель по спросу и приоритетам, а не факт зачисления.</span><Source type="status"/><Source type="model"/></div>
    <div className="metrics metrics-seven">
      <Metric label="План приёма" value={fmt(officialPlan.budget)} detail={`бюджетных мест · ${fmt(officialPlan.paid)} платных`} icon={Buildings} source="plan"/>
      <Metric label="Потенциальные абитуриенты" value="100 000" detail="контактная база проекта · пока без распределения по факультетам" icon={UsersThree} source="model"/>
      <Metric label="Подали заявление, людей" value={fmt(scope.people)} detail="уникальные личные дела" icon={FileText}/>
      <Metric label="Заявления по программам" value={fmt(scope.applications)} detail="человек × образовательная программа" icon={ArrowsLeftRight} tone="violet"/>
      <Metric label="Согласия, факт" value={fmt(REAL_CONSENTS)} detail="приём согласий ещё не начался" icon={CheckCircle} tone="red" source="status"/>
      <Metric label="Высокобалльники 85+" value={fmt(scope.highScorers)} detail="математика 85+ и физика / информатика 85+" icon={Target} tone="red" emphasis/>
      <Metric label="Программы с риском" value={fmt(highRiskCount)} detail="высокий риск по модели реализации потенциального выбора" icon={WarningCircle} tone="red" source="model"/>
    </div>
    <div className="management-overview">
      <Panel title="Ситуация по бюджетному набору" subtitle="План, спрос, прогноз выбора, согласия и управленческое действие" action={<button className="text-button" onClick={() => navigate("directions")}>Все программы <CaretRight/></button>} className="situation-panel">
        <div className="situation-table">
          <div className="situation-row situation-head"><span>Факультет / институт</span><span>План бюджета</span><span>Потенциально выберут</span><span>Подали, людей</span><span>Согласия</span><span>Риск</span><span>Управленческое действие</span></div>
          {facultyRows.map((row) => <button className="situation-row" key={row.faculty.name} onClick={() => navigate("directions", row.faculty.name)}>
            <span className="situation-name" data-label="Факультет / институт"><i>{row.faculty.name.split(" ").filter((word) => word.length > 3).slice(0, 2).map((word) => word[0]).join("")}</i><b>{row.faculty.name}</b></span>
            <span data-label="План бюджета"><b>{row.plan ? fmt(row.plan) : "—"}</b><small>мест</small></span>
            <span data-label="Потенциально выберут"><b>{fmt(row.expected)}</b><small>модель из {fmt(row.rawPotential)} приоритетов 1–2</small></span>
            <span data-label="Подали, людей"><b>{fmt(row.submitted)}</b><small>{fmt(row.applications)} заявлений</small></span>
            <span data-label="Согласия"><b>{REAL_CONSENTS}</b><small>приём не начат</small></span>
            <span data-label="Риск"><Badge tone={row.risk.tone}>{row.risk.label}</Badge></span>
            <span className="situation-action" data-label="Действие">{actionForRisk(row.risk)}<CaretRight/></span>
          </button>)}
        </div>
        <p className="footnote model-explainer">«Потенциально выберут» — модель: активные бюджетные заявления с приоритетом 1–2 × коэффициент реализации 12%. Это не согласия и не прогноз зачисления.</p>
      </Panel>
      <Panel title="Управленческий фокус" subtitle="Программы, где модельный потенциал ниже бюджетного плана">
        <div className="focus-list risk-focus">{focus.map(({ program, plan, expected, risk }, index) => <button key={program.id} onClick={() => navigate("directions", program.faculty, program.id)}><em>{index + 1}</em><span><b>{program.code} · {program.name}</b><small>план {fmt(plan)} · потенциально {fmt(expected)} · согласия 0</small><p>{actionForRisk(risk)}</p></span><Badge tone={risk.tone}>{risk.label}</Badge></button>)}</div>
      </Panel>
    </div>
    <div className="chart-grid">
      <Panel title="Динамика поданных заявлений" subtitle="2026 и реалистичная модель 2025"><DynamicsChart rows={dynamics}/></Panel>
      <Panel title="Динамика платных заявлений" subtitle="Фактический спрос, без имитации договоров"><DynamicsChart rows={dynamics} type="paid"/></Panel>
    </div>
  </>;
}

function DirectionsView({ filters, programs, setFilters, addTask }) {
  const [query, setQuery] = useState("");
  const visible = programs.filter((program) => program.level === filters.level && (filters.faculty === "all" || program.faculty === filters.faculty) && `${program.code} ${program.name} ${program.faculty}`.toLowerCase().includes(query.toLowerCase()));
  const groups = useMemo(() => Object.entries(visible.reduce((acc, program) => { (acc[program.groupCode] ||= []).push(program); return acc; }, {})).sort((a, b) => a[0].localeCompare(b[0], "ru")), [visible]);
  const selected = visible.find((program) => program.id === filters.program) || visible[0];
  const selectProgram = (id) => setFilters((old) => ({ ...old, program: id }));
  if (!selected) return <Empty>Для выбранного среза нет программ</Empty>;
  const slice = sliceFor(selected, filters.form, filters.basis); const budgetSlice = sliceFor(selected, filters.form, "budget"); const plan = planFor(selected, filters.form);
  const rawPotential = budgetSlice.potentialBudgetPeople || 0; const expected = expectedBudgetChoice(budgetSlice); const risk = riskFor(plan.budget, expected);
  const coverage = plan.budget ? Math.min(100, expected / plan.budget * 100) : 0;
  return <div className="split-view">
    <Panel title="Иерархия программ" subtitle={`${visible.length} программ · родительский код → программа`} action={<label className="search"><MagnifyingGlass/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Код или название"/></label>} className="program-list-panel">
      <div className="program-tree">{groups.map(([groupCode, items]) => <details key={groupCode} open={items.some((item) => item.id === selected.id)}><summary><span><CaretDown/><b>{groupCode}</b></span><Badge>{items.length}</Badge></summary>{items.map((program) => <button key={program.id} className={program.id === selected.id ? "selected" : ""} onClick={() => selectProgram(program.id)}><span><b>{program.code}</b><small>{program.name}</small><em>{program.faculty}</em></span><strong>{fmt(sliceFor(program, filters.form, filters.basis).applications)}</strong></button>)}</details>)}</div>
    </Panel>
    <div className="detail-stack">
      <Panel title={`${selected.code} · ${selected.name}`} subtitle={selected.faculty} action={<Source type="plan"/>}>
        <div className="consent-inline-note"><WarningCircle/><span><b>Согласия: 0.</b> Приём ещё не начат; ниже показана модель спроса.</span></div>
        <div className="detail-metrics"><div><span>Людей</span><b>{fmt(slice.people)}</b></div><div><span>Заявлений</span><b>{fmt(slice.applications)}</b></div><div><span>Согласия, факт</span><b>{REAL_CONSENTS}</b></div><div><span>Высокобалльники 85+</span><b>{fmt(slice.highScorers)}</b></div></div>
        <div className="plan-grid"><article><span>План приёма</span><strong>{plan.budget || "—"}</strong><small>бюджетных мест · {fmt(plan.paid)} платных</small></article><article><span>Потенциально выберут бюджет</span><strong>{fmt(expected)} / {plan.budget || "—"}</strong><Progress value={coverage} tone={risk.key === "high" ? "red" : risk.key === "medium" ? "orange" : "green"}/><small>модель 12% из {fmt(rawPotential)} активных приоритетов 1–2</small></article><article><span>Средний балл расчётного диапазона</span><strong>{selected.projectedAverageScore ?? "—"}</strong><small>модель без согласий, в пределах плана</small></article><article><span>Расчётная граница</span><strong>{selected.projectedBoundaryScore ?? "—"}</strong><small>не проходной балл и не факт зачисления</small></article></div>
        <div className="recommendation"><Sparkle/><span><b>Риск недобора: {risk.label.toLowerCase()}</b><p>{actionForRisk(risk)}</p></span><button onClick={() => addTask({ title: `${actionForRisk(risk)} ${selected.code}`, owner: selected.faculty, priority: risk.key === "high" ? "high" : "medium" })}>В очередь</button></div>
      </Panel>
      <Panel title="Динамика выбранной программы" subtitle="Дата на ползунке меняет значения"><DynamicsChart rows={currentDynamics({ ...filters, program: selected.id })}/></Panel>
    </div>
  </div>;
}

function RankingView({ filters, programs, setFilters }) {
  const available = programs.filter((program) => program.level === filters.level && (filters.faculty === "all" || program.faculty === filters.faculty));
  const selected = available.find((program) => program.id === filters.program) || available[0];
  if (!selected) return <Empty>Нет рейтинга в выбранном срезе</Empty>;
  const rows = (data.rankings[selected.id] || []).filter((row) => (filters.form === "Все формы" || row.form === filters.form) && (filters.basis === "all" || row.basis === filters.basis));
  const budgetSlice = sliceFor(selected, filters.form, "budget"); const expected = expectedBudgetChoice(budgetSlice);
  return <>
    <div className="warning"><WarningCircle/><span><b>Согласия на зачисление ещё не принимаются.</b> Рейтинг ниже показывает только обезличенные заявления и расчётный диапазон по приоритетам 1–2.</span><Source type="status"/><Source type="model"/></div>
    <div className="ranking-toolbar"><label><span>Образовательная программа</span><select value={selected.id} onChange={(event) => setFilters((old) => ({ ...old, program: event.target.value }))}>{available.map((program) => <option key={program.id} value={program.id}>{program.code} · {program.name}</option>)}</select></label></div>
    <div className="metrics metrics-four"><Metric label="Бюджетных мест" value={fmt(planFor(selected, filters.form).budget)} detail={`платных: ${fmt(planFor(selected, filters.form).paid)}`} icon={Buildings} source="plan"/><Metric label="Потенциально выберут" value={fmt(expected)} detail={`модель из ${fmt(budgetSlice.potentialBudgetPeople)} приоритетов 1–2`} icon={UsersThree} source="model"/><Metric label="Средний балл диапазона" value={selected.projectedAverageScore ?? "—"} detail="расчёт без согласий" icon={Target} tone="red" source="model"/><Metric label="Расчётная граница" value={selected.projectedBoundaryScore ?? "—"} detail="не проходной балл" icon={TrendUp} tone="green" source="model"/></div>
    <Panel title="Рейтинг заявлений" subtitle={`${selected.code} · ${rows.length} обезличенных строк`} action={<Source/>}><div className="table-wrap"><table><thead><tr><th>Место</th><th>Код абитуриента</th><th>Балл</th><th>Приоритет</th><th>Статус заявления</th><th>Расчётный диапазон</th></tr></thead><tbody>{rows.map((row) => <tr key={`${row.id}-${row.form}-${row.basis}`}><td>{row.place}</td><td><b>{row.id}</b></td><td><b>{row.score}</b></td><td>{row.priority === 999 ? "—" : row.priority}</td><td>{row.status}</td><td>{row.topList ? <Badge tone="green">В диапазоне</Badge> : "—"}</td></tr>)}</tbody></table></div><p className="footnote">«В диапазоне» — модельная позиция по активным бюджетным заявлениям с приоритетом 1–2. Она не означает согласие или зачисление.</p></Panel>
  </>;
}

function ApplicantsView({ filters }) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const visible = data.applicants.filter((person) => `${person.id} ${person.segment}`.toLowerCase().includes(query.toLowerCase()) && (filters.faculty === "all" || person.faculties.includes(filters.faculty)) && (filters.program === "all" || person.applications.some((item) => item.programId === filters.program)));
  const person = visible.find((item) => item.id === selectedId) || visible[0];
  if (!person) return <Empty>В обезличенной выборке нет людей для выбранного среза</Empty>;
  return <>
    <div className="explain"><ShieldCheck/><span><b>Без персональных данных.</b> Идентификаторы сформированы специально для демонстрации; ФИО и контакты не публикуются.</span><Source/></div>
    <div className="warning consent-stage"><WarningCircle/><span><b>Согласия ещё не собираются.</b> В карточках показаны только статус заявления и приоритет; фактических согласий — 0.</span><Source type="status"/></div>
    <div className="split-view applicants-view">
      <Panel title="Обезличенная выборка" subtitle={`${visible.length} реальных траекторий`} action={<label className="search"><MagnifyingGlass/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ID или сегмент"/></label>}><div className="people-list">{visible.map((item) => <button key={item.id} className={item.id === person.id ? "selected" : ""} onClick={() => setSelectedId(item.id)}><UserFocus/><span><b>{item.id}</b><small>{item.score} баллов · {item.applications.length} программ</small></span><Badge tone={item.segment.includes("85+") ? "high" : item.segment.includes("Приоритет") ? "medium" : "neutral"}>{item.segment}</Badge></button>)}</div></Panel>
      <div className="detail-stack"><Panel title={person.id} subtitle={person.faculties.join(" · ")}><div className="detail-metrics"><div><span>Максимальный балл</span><b>{person.score}</b></div><div><span>Программ</span><b>{person.applications.length}</b></div><div><span>Сегмент</span><b className="small-value">{person.segment}</b></div></div></Panel><Panel title="Заявления и приоритеты" subtitle="Реальные обезличенные данные АИС"><div className="application-list">{person.applications.map((item) => <article key={item.programId}><span className="priority">{item.priority === 999 ? "—" : item.priority}</span><span><b>{item.code} · {item.name}</b><small>{item.faculty} · {item.form} · {item.basis === "budget" ? "бюджет" : "платное"}</small></span><strong>{item.score}</strong><Badge>{item.status}</Badge></article>)}</div></Panel></div>
    </div>
  </>;
}

function IntersectionsView({ filters, programs, setFilters }) {
  const map = Object.fromEntries(programs.map((program) => [program.id, program]));
  const rows = data.intersections.filter((item) => filters.program === "all" || item.a === filters.program || item.b === filters.program).filter((item) => map[item.a]?.level === filters.level && map[item.b]?.level === filters.level).slice(0, 30);
  return <><div className="explain"><ArrowsLeftRight/><span><b>Пересечения считаются между образовательными программами.</b> Базовый код используется только как родительская группа.</span><Source/></div><Panel title="Самые сильные пересечения" subtitle="Уникальные люди, подавшие на обе программы"><div className="intersection-table">{rows.map((item) => <button key={`${item.a}-${item.b}`} onClick={() => setFilters((old) => ({ ...old, program: item.a }))}><span><b>{map[item.a]?.code}</b><small>{map[item.a]?.name}</small></span><ArrowsLeftRight/><strong>{fmt(item.count)}</strong><span><b>{map[item.b]?.code}</b><small>{map[item.b]?.name}</small></span></button>)}</div></Panel></>;
}

const events = [
  { name: "День открытых дверей", contacts: 496, submitted: 54, source: "CRM" },
  { name: "Другие CRM-формы", contacts: 26, submitted: 4, source: "CRM" },
  { name: "Профориентационные мероприятия", contacts: 43, submitted: null, source: "ожидается загрузка" },
  { name: "Выставка «Образование и карьера»", contacts: 18, submitted: null, source: "ожидается загрузка" },
];
function CommunicationsView() { return <><div className="warning"><WarningCircle/><span><b>Сквозная конверсия CRM → АИС пока недоступна.</b> Статус «подали документы» ниже взят из CRM и не является результатом объединения с АИС.</span></div><div className="metrics compact-metrics"><Metric label="Контакты CRM" value="590" detail="обезличенная выборка ФИТ" icon={UsersThree} source="model"/><Metric label="CRM: подали документы" value="58" detail="статус внутри CRM" icon={CheckCircle} tone="green" source="model"/><Metric label="Совпадения CRM ↔ АИС" value="0" detail="нужен единый master_applicant_id" icon={ArrowsLeftRight} tone="red" source="model"/></div><Panel title="Мероприятия" subtitle="Что известно сейчас"><div className="event-grid">{events.map((event) => <article key={event.name}><header><b>{event.name}</b><Badge tone={event.submitted == null ? "medium" : "green"}>{event.source}</Badge></header><div><span>Контактов</span><strong>{event.contacts}</strong></div><div><span>Подали документы</span><strong>{event.submitted == null ? "—" : event.submitted}</strong></div>{event.submitted == null && <p>Показатель появится после загрузки и проверки данных мероприятия.</p>}</article>)}</div></Panel></>;
}

function TaskModal({ preset, onClose, onSave }) {
  const [title, setTitle] = useState(preset?.title || ""); const [owner, setOwner] = useState(preset?.owner || "Приёмная комиссия"); const [priorityValue, setPriority] = useState(preset?.priority || "medium");
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><form className="modal" onSubmit={(event) => { event.preventDefault(); if (title.trim()) onSave({ title: title.trim(), owner, priority: priorityValue }); }}><button type="button" className="modal-close" onClick={onClose} aria-label="Закрыть"><X/></button><h2>Добавить задачу</h2><label>Задача<input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} required/></label><label>Ответственный<input value={owner} onChange={(event) => setOwner(event.target.value)}/></label><label>Приоритет<select value={priorityValue} onChange={(event) => setPriority(event.target.value)}><option value="high">Срочный</option><option value="medium">Средний</option><option value="low">Низкий</option></select></label><button className="primary wide" type="submit"><Plus/>Добавить в очередь</button></form></div>;
}
function TasksView({ tasks, setTasks, addTask }) {
  const columns = [["todo", "К выполнению"], ["progress", "В работе"], ["done", "Готово"]];
  const move = (id, status) => setTasks((old) => old.map((task) => task.id === id ? { ...task, status } : task));
  return <><div className="actions-row"><span><b>{tasks.length} задач в локальной очереди</b><small>Сохраняются после перезагрузки на этом устройстве</small></span><button className="primary" onClick={() => addTask()}><Plus/>Добавить задачу</button></div><div className="kanban">{columns.map(([status, label]) => <section key={status}><header><b>{label}</b><Badge>{tasks.filter((task) => task.status === status).length}</Badge></header>{tasks.filter((task) => task.status === status).map((task) => <article key={task.id}><div><Badge tone={task.priority === "high" ? "high" : task.priority === "medium" ? "medium" : "neutral"}>{task.priority === "high" ? "Срочно" : task.priority === "medium" ? "Средний" : "Низкий"}</Badge><small>{task.id}</small></div><h3>{task.title}</h3><p>{task.owner}</p><footer><Clock/>{task.due}</footer>{status !== "done" && <button className="secondary wide" onClick={() => move(task.id, status === "todo" ? "progress" : "done")}>{status === "todo" ? "Взять в работу" : "Завершить"}</button>}</article>)}</section>)}</div></>;
}

function AnalyticsView({ filters, programs, faculties }) {
  const scope = data.scopes[`${filters.level}|${filters.form}|${filters.basis}`] || {};
  const rows = currentDynamics(filters);
  const visibleFaculties = faculties.filter((item) => item.level === filters.level);
  return <>
    <div className="warning consent-stage"><WarningCircle/><span><b>Согласия: 0.</b> Пока этап не начался, аналитика показывает спрос и модель потенциального выбора, а не заполнение плана.</span><Source type="status"/><Source type="model"/></div>
    <div className="chart-grid"><Panel title="Общий поток" subtitle="Сравнение 2026 с моделью 2025"><DynamicsChart rows={rows}/></Panel><Panel title="Платный спрос" subtitle="Платные заявления, не договоры"><DynamicsChart rows={rows} type="paid"/></Panel></div>
    <div className="analytics-grid"><Panel title="Сегменты" subtitle="Выбранный глобальный срез"><div className="segment-grid">{[["Людей", scope.people], ["Заявлений", scope.applications], ["Активные личные дела", scope.activePeople], ["Потенциал бюджета", scope.potentialBudgetPeople], ["Согласия, факт", REAL_CONSENTS], ["Высокобалльники 85+", scope.highScorers]].map(([label, value]) => <article key={label}><span>{label}</span><b>{fmt(value)}</b></article>)}</div></Panel><Panel title="Факультеты и институты" subtitle="Спрос и модель выбора бюджета"><div className="analytics-list">{visibleFaculties.slice(0, 12).map((faculty) => { const slice = sliceFor(faculty, filters.form, filters.basis); const budgetSlice = sliceFor(faculty, filters.form, "budget"); return <div key={faculty.name}><span><b>{faculty.name}</b><small>{fmt(slice.people)} людей</small></span><span><b>{fmt(slice.applications)}</b><small>заявлений</small></span><span><b>{fmt(expectedBudgetChoice(budgetSlice))}</b><small>потенциально выберут · модель 12%</small></span></div>; })}</div></Panel></div>
  </>;
}

function ReportsView({ toast }) { return <><div className="actions-row"><span><b>Отчёты сохраняют выбранный срез и методику</b><small>Персональные данные в публичную версию не попадают</small></span><button className="primary" onClick={() => toast("Отчёт поставлен в очередь")}>Сформировать отчёт</button></div><div className="report-grid">{["Сводка для руководства", "Срез по факультетам", "Срез по программам", "Контроль качества данных"].map((name, index) => <article key={name}><FileText/><Badge>{index === 0 ? "PDF" : "XLSX"}</Badge><h3>{name}</h3><p>План, спрос, согласия, риски и дата формирования.</p><button className="secondary" onClick={() => toast(`Подготовка: ${name}`)}><DownloadSimple/>Подготовить</button></article>)}</div></>;
}
function QualityView() {
  const labels = { people: "Люди", applications: "Заявления", highScorer: "Высокобалльник 85+", potentialBudget: "Потенциальный выбор бюджета", topList: "Расчётный диапазон", model2025: "Модель 2025" };
  return <>
    <div className="metrics compact-metrics"><Metric label="Строк исходной АИС" value={fmt(data.allExport.rows)} detail="технические конкурсные строки" icon={Database}/><Metric label="Людей во всей выгрузке" value={fmt(data.allExport.people)} detail="уникальные личные дела" icon={UsersThree} tone="green"/><Metric label="Образовательных программ" value={fmt(data.programs.length)} detail="с учётом профильных кодов" icon={GraduationCap} tone="violet"/></div>
    <div className="quality-grid"><Panel title="Словарь показателей" subtitle="Как читать цифры"><div className="method-list">{Object.entries(data.definitions).map(([key, value]) => <article key={key}><b>{labels[key] || key}</b><p>{value}</p></article>)}</div></Panel><Panel title="Контроль источников" subtitle="Что подтверждено"><ul className="source-list"><li><i className="ok"/><span><b>АИС «Приём»</b><small>обезличенная выгрузка, {fmt(data.source.rows)} строк</small></span></li><li><i className="ok"/><span><b>Официальный план 2026</b><small>приказ № 17-ОД, приложение 2.4</small></span></li><li><i className="warn"/><span><b>Согласия на зачисление</b><small>этап ещё не начат; фактическое значение — 0</small></span></li><li><i className="warn"/><span><b>CRM ↔ АИС</b><small>сквозная склейка пока не настроена</small></span></li><li><i className="warn"/><span><b>Модель 2025</b><small>визуализация, не официальная выгрузка</small></span></li></ul></Panel></div>
  </>;
}

function SettingsView({ toast }) { const [auto, setAuto] = useState(true); return <div className="settings-grid"><Panel title="Обновление данных" subtitle="Будущий внутренний контур"><label className="setting"><span><b>Автоматическая синхронизация</b><small>После подключения внутреннего API</small></span><button className={`toggle ${auto ? "on" : ""}`} onClick={() => setAuto(!auto)}><i/></button></label><label className="field">Частота<select><option>Каждые 15 минут</option><option>Каждый час</option></select></label></Panel><Panel title="Пороговые сигналы" subtitle="Настройка управленческого внимания"><label className="field">Заполнение бюджета ниже, %<input type="number" defaultValue="70"/></label><label className="field">Нет движения, дней<input type="number" defaultValue="7"/></label></Panel><button className="primary save-settings" onClick={() => toast("Настройки сохранены")}>Сохранить настройки</button></div>; }

export function App() {
  const programs = data.programs; const faculties = data.faculties;
  const [active, setActive] = useState("overview"); const [menuOpen, setMenuOpen] = useState(false); const [toastText, setToastText] = useState(""); const [taskPreset, setTaskPreset] = useState(null); const [modalOpen, setModalOpen] = useState(false);
  const [filters, setFilters] = useState({ level: "Бакалавриат и специалитет", form: "Все формы", basis: "all", faculty: "all", program: "all" });
  const [tasks, setTasks] = useState(() => { try { return JSON.parse(localStorage.getItem("dashboard-v5-tasks")) || initialTasks; } catch { return initialTasks; } });
  useEffect(() => localStorage.setItem("dashboard-v5-tasks", JSON.stringify(tasks)), [tasks]);
  const toast = (message) => { setToastText(message); window.clearTimeout(toast.timer); toast.timer = window.setTimeout(() => setToastText(""), 2600); };
  const navigate = (page, faculty, program) => { setActive(page); setMenuOpen(false); if (faculty || program) setFilters((old) => ({ ...old, faculty: faculty || old.faculty, program: program || "all" })); };
  const addTask = (preset = null) => { setTaskPreset(preset); setModalOpen(true); };
  const saveTask = (task) => { setTasks((old) => [{ ...task, id: `TASK-${Date.now().toString().slice(-6)}`, status: "todo", due: "Сегодня" }, ...old]); setModalOpen(false); toast("Задача добавлена в очередь"); };
  const content = {
    overview: <Overview filters={filters} programs={programs} faculties={faculties} navigate={navigate}/>,
    directions: <DirectionsView filters={filters} programs={programs} setFilters={setFilters} addTask={addTask}/>,
    ranking: <RankingView filters={filters} programs={programs} setFilters={setFilters}/>,
    applicants: <ApplicantsView filters={filters}/>, intersections: <IntersectionsView filters={filters} programs={programs} setFilters={setFilters}/>,
    communications: <CommunicationsView/>, tasks: <TasksView tasks={tasks} setTasks={setTasks} addTask={addTask}/>,
    analytics: <AnalyticsView filters={filters} programs={programs} faculties={faculties}/>, reports: <ReportsView toast={toast}/>,
    quality: <QualityView/>, settings: <SettingsView toast={toast}/>,
  }[active];
  const [title, subtitle] = titles[active];
  return <div className={`app-shell ${menuOpen ? "menu-open" : ""}`}>
    <button className="menu-toggle" aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X/> : <List/>}</button>{menuOpen && <button className="menu-backdrop" aria-label="Закрыть меню" onClick={() => setMenuOpen(false)}/>}
    <aside className="sidebar"><div className="brand"><img src="./assets/polytech_logo_main_RGB_RUS.png" alt="Московский Политех"/></div><div className="campaign-title"><span>ЦУ</span><div><b>Цифровой центр управления</b><small>приёмной кампанией 2026</small></div></div><nav>{nav.map(([id, label, Icon]) => <button key={id} className={active === id ? "active" : ""} onClick={() => navigate(id)}><Icon size={20}/><span>{label}</span>{id === "tasks" && <em>{tasks.filter((task) => task.status !== "done").length}</em>}</button>)}</nav><div className="sidebar-foot"><ShieldCheck/><span><b>Без персональных данных</b><small>Публичная демонстрация</small></span></div></aside>
    <main className="workspace"><header className="topbar"><div><p>Цифровой центр управления приёмной кампанией 2026</p><h1>{title}</h1><span>{subtitle}</span></div><div className="top-actions"><button className="icon-button" aria-label="Уведомления"><Bell/><i/></button><button className="secondary" onClick={() => toast("Срез подготовлен к экспорту")}><DownloadSimple/>Экспорт</button><button className="primary" onClick={() => navigate("tasks")}><Target/>Действия <b>{tasks.filter((task) => task.status !== "done").length}</b></button></div></header><GlobalFilters filters={filters} setFilters={setFilters} programs={programs} faculties={faculties}/><div className="page-content">{content}</div></main>
    {modalOpen && <TaskModal preset={taskPreset} onClose={() => setModalOpen(false)} onSave={saveTask}/>} {toastText && <div className="toast"><CheckCircle/>{toastText}</div>}
  </div>;
}
