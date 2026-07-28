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
  { id: "TASK-501", title: "Обзвонить высокобалльников факультета машиностроения без согласия", owner: "Факультет машиностроения", priority: "high", status: "todo", due: "Сегодня" },
  { id: "TASK-502", title: "Написать абитуриентам с приоритетом 1–2 без согласия", owner: "Приёмная комиссия", priority: "high", status: "todo", due: "Сегодня" },
  { id: "TASK-503", title: "Повторно связаться с участниками Дня открытых дверей", owner: "CRM-группа", priority: "medium", status: "progress", due: "29 июля" },
  { id: "TASK-504", title: "Проверить программы с высоким риском недобора", owner: "Аналитическая группа", priority: "high", status: "progress", due: "Сегодня" },
  { id: "TASK-505", title: "Проверить записи с неопределённым кодом программы", owner: "Группа качества данных", priority: "medium", status: "todo", due: "30 июля" },
  { id: "TASK-506", title: "Подготовить срез по платному спросу", owner: "Договорной отдел", priority: "low", status: "done", due: "Выполнено" },
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

const POTENTIAL_CONTACTS = 100000;
const EVENT_TO_APPLICATION_CONVERSION = 0.10;
const EXPECTED_BUDGET_YIELD = 0.12;
const EXPECTED_PAID_YIELD = 0.18;
const AVERAGE_CONTRACT_PRICE = 310000;
const expectedBudgetChoice = (slice) => Math.round(Number(slice?.potentialBudgetPeople || 0) * EXPECTED_BUDGET_YIELD);
const expectedPaidContracts = (slice) => Math.round(Number(slice?.potentialPaidPeople || 0) * EXPECTED_PAID_YIELD);
const filledFor = (program, form) => form === "Все формы"
  ? Number(program?.budgetFilled || 0)
  : Math.min(planFor(program, form).budget, Number(sliceFor(program, form, "budget").activeConsentPeople || 0));
function riskFor(plan, filled, expected) {
  if (!plan) return { key: "none", label: "Нет плана", tone: "neutral", rank: 3, coverage: null };
  const coverage = filled / plan;
  const demandCoverage = expected / plan;
  if (coverage < .6 || demandCoverage < .9) return { key: "high", label: "Высокий", tone: "high", rank: 0, coverage };
  if (coverage < .85 || demandCoverage < 1.15) return { key: "medium", label: "Средний", tone: "medium", rank: 1, coverage };
  return { key: "low", label: "Низкий", tone: "green", rank: 2, coverage };
}
function actionForRisk(risk) {
  if (risk.key === "high") return "Усилить целевой набор: обзвон приоритетов 1–2, высокобалльники и реклама.";
  if (risk.key === "medium") return "Персонально отработать приоритеты 1–2 и проверить конкурирующие программы.";
  if (risk.key === "low") return "Удерживать интерес и готовить перевод части спроса в платный набор.";
  return "Сверить распределение контрольных цифр приёма.";
}

function DynamicsChart({ rows, type = "main", paidContractsTotal = 0 }) {
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
  const finalPaidApplications = Number(rows.at(-1)?.paid || 0);
  const modeledContracts = type === "paid" && finalPaidApplications
    ? Math.round(paidContractsTotal * Number(current.paid || 0) / finalPaidApplications)
    : 0;
  const modeledAmount = modeledContracts * AVERAGE_CONTRACT_PRICE;
  return <div className="dynamics">
    <div className="legend"><span><i className={type === "paid" ? "green" : "blue"}/>2026</span>{type === "main" && <span><i className="red"/>Люди</span>}<span><i className="gray"/>Модель 2025</span><b>{current.date}</b></div>
    <canvas ref={canvasRef} aria-label={type === "paid" ? "Динамика платных заявлений" : "Динамика заявлений"}/>
    <div className="chart-values">
      {type === "main" && <div><span>Людей</span><b>{fmt(current.people)}</b></div>}
      <div><span>{type === "paid" ? "Платных заявлений" : "Заявлений по программам"}</span><b>{fmt(current[key])}</b></div>
      <div><span>Модель 2025</span><b>{fmt(modelValue(current[key], selected, rows.length, type))}</b></div>
      {type === "paid" && <><div><span>Ожидаемые договоры</span><b>≈ {fmt(modeledContracts)}</b></div><div><span>Средняя цена года</span><b>≈ {fmt(AVERAGE_CONTRACT_PRICE)} ₽</b></div><div className="amount-value"><span>Потенциальная сумма</span><b>≈ {fmt(Math.round(modeledAmount / 1000000))} млн ₽</b></div></>}
    </div>
    <label className="slider"><span>{rows[0].date}</span><input type="range" min="0" max={rows.length - 1} value={selected} onChange={(event) => setSelected(Number(event.target.value))}/><span>{rows.at(-1).date}</span></label>
    <p className="model-note">{type === "paid" ? `Денежная модель: ожидаемые договоры распределены пропорционально динамике платных заявлений; сумма = договоры × ${fmt(AVERAGE_CONTRACT_PRICE)} ₽ за год. Это не фактические договоры и не оплаты. ` : ""}Модель 2025 — визуализационная оценка: похожая динамика, немного ниже 2026 года.</p>
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
  const visiblePrograms = programs.filter((program) => program.level === filters.level && (filters.faculty === "all" || program.faculty === filters.faculty) && (filters.program === "all" || program.id === filters.program));
  const visibleFaculties = faculties.filter((faculty) => faculty.level === filters.level && (filters.faculty === "all" || faculty.name === filters.faculty));
  const selectedEntity = filters.program !== "all" ? visiblePrograms.find((program) => program.id === filters.program) : filters.faculty !== "all" ? visibleFaculties[0] : null;
  const selectedSlice = selectedEntity ? sliceFor(selectedEntity, filters.form, filters.basis) : scope;
  const paidSignal = selectedEntity ? sliceFor(selectedEntity, filters.form, "paid") : data.scopes[`${filters.level}|${filters.form}|paid`] || {};
  const programRisks = visiblePrograms.filter((program) => planFor(program, filters.form).budget > 0).map((program) => {
    const plan = planFor(program, filters.form).budget;
    const budgetSlice = sliceFor(program, filters.form, "budget");
    const expected = expectedBudgetChoice(budgetSlice);
    const filled = filledFor(program, filters.form);
    return { program, plan, filled, expected, rawPotential: budgetSlice.potentialBudgetPeople || 0, consents: budgetSlice.activeConsentPeople || 0, high: budgetSlice.highScorers || 0, highConsent: budgetSlice.activeHighScorerConsents || 0, risk: riskFor(plan, filled, expected) };
  });
  const facultyRows = visibleFaculties.map((faculty) => {
    const facultyPrograms = visiblePrograms.filter((program) => program.faculty === faculty.name);
    const plan = facultyPrograms.reduce((sum, program) => sum + planFor(program, filters.form).budget, 0);
    const filled = facultyPrograms.reduce((sum, program) => sum + filledFor(program, filters.form), 0);
    const budgetSlice = sliceFor(faculty, filters.form, "budget");
    const expected = expectedBudgetChoice(budgetSlice);
    return { faculty, plan, filled, expected, rawPotential: budgetSlice.potentialBudgetPeople || 0, submitted: budgetSlice.people || 0, applications: budgetSlice.applications || 0, consents: budgetSlice.activeConsentPeople || 0, totalConsents: budgetSlice.consentPeople || 0, high: budgetSlice.highScorers || 0, highConsent: budgetSlice.activeHighScorerConsents || 0, risk: riskFor(plan, filled, expected) };
  });
  const focus = [...programRisks].sort((a, b) => a.risk.rank - b.risk.rank || (a.risk.coverage || 0) - (b.risk.coverage || 0)).slice(0, 5);
  const dynamics = currentDynamics(filters);
  const budgetPlan = programRisks.reduce((sum, item) => sum + item.plan, 0);
  const budgetFilled = programRisks.reduce((sum, item) => sum + item.filled, 0);
  const paidPlan = visiblePrograms.reduce((sum, program) => sum + planFor(program, filters.form).paid, 0);
  const paidFilled = Math.min(paidPlan, expectedPaidContracts(paidSignal));
  return <>
    <div className="metrics metrics-eight">
      <Metric label="Потенциальные абитуриенты" value={fmt(POTENTIAL_CONTACTS)} detail="контактная база проекта · верх воронки" icon={UsersThree} source="model"/>
      <Metric label="Заявления по программам" value={fmt(selectedSlice.applications)} detail="человек × образовательная программа" icon={ArrowsLeftRight} tone="violet"/>
      <Metric label="Подали заявление, людей" value={fmt(selectedSlice.people)} detail="уникальные личные дела в выбранном срезе" icon={FileText}/>
      <Metric label="Конверсия в подачу" value={`≈ ${pct(EVENT_TO_APPLICATION_CONVERSION * 100)}`} detail="реалистичная модель: около 10 из 100 участников мероприятий" icon={TrendUp} tone="green" source="model"/>
      <Metric label="Согласия, факт" value={fmt(selectedSlice.activeConsentPeople)} detail={`${fmt(selectedSlice.consentPeople)} подали · ${fmt(selectedSlice.activeConsentPeople)} активны`} icon={CheckCircle} tone="green"/>
      <Metric label="Высокобалльники 85+" value={`${fmt(selectedSlice.highScorers)} / ${fmt(selectedSlice.activeHighScorerConsents)}`} detail="всего / с активным согласием · математика 85+ и физика / информатика 85+" icon={Target} tone="red" emphasis/>
      <Metric label="Бюджетный набор заполнен" value={budgetPlan ? pct(budgetFilled / budgetPlan * 100) : "—"} detail={`${fmt(budgetFilled)} / ${fmt(budgetPlan)} мест · факт согласий с лимитом по программам`} icon={Buildings} source="plan"/>
      <Metric label="Платный набор заполнен" value={paidPlan ? `≈ ${pct(paidFilled / paidPlan * 100)}` : "—"} detail={`≈ ${fmt(paidFilled)} / ${fmt(paidPlan)} · модель, договоры не загружены`} icon={CurrencyRub} tone="violet" source="model"/>
    </div>
    <div className="management-overview">
      <Panel title="Сводка факультетов и институтов" subtitle="План, фактические согласия, высокобалльники, риск и действие" action={<button className="text-button" onClick={() => navigate("directions")}>Все программы <CaretRight/></button>} className="situation-panel">
        <div className="situation-table">
          <div className="situation-row situation-head"><span>Факультет / институт</span><span>Бюджет</span><span>Спрос</span><span>Согласия</span><span>85+ / согласие</span><span>Риск</span><span>Управленческое действие</span></div>
          {facultyRows.map((row) => <button className="situation-row" key={row.faculty.name} onClick={() => navigate("directions", row.faculty.name)}>
            <span className="situation-name" data-label="Факультет / институт"><i>{row.faculty.name.split(" ").filter((word) => word.length > 3).slice(0, 2).map((word) => word[0]).join("")}</i><b>{row.faculty.name}</b></span>
            <span data-label="Бюджет"><b>{fmt(row.filled)} / {fmt(row.plan)}</b><small>{row.plan ? pct(row.filled / row.plan * 100) : "нет плана"}</small></span>
            <span data-label="Спрос"><b>{fmt(row.submitted)} людей</b><small>{fmt(row.applications)} заявлений · потенциал {fmt(row.expected)} из {fmt(row.rawPotential)}</small></span>
            <span data-label="Согласия"><b>{fmt(row.consents)}</b><small>{fmt(row.totalConsents)} всего</small></span>
            <span data-label="85+ / согласие"><b>{fmt(row.high)} / {fmt(row.highConsent)}</b><small>целевая группа</small></span>
            <span data-label="Риск"><Badge tone={row.risk.tone}>{row.risk.label}</Badge></span>
            <span className="situation-action" data-label="Действие">{actionForRisk(row.risk)}<CaretRight/></span>
          </button>)}
        </div>
        <p className="footnote model-explainer">Фактическое заполнение бюджета — одно лучшее активное согласие на человека, не выше плана программы. «Потенциально выберут» и конверсия мероприятий остаются моделями.</p>
      </Panel>
      <Panel title="Управленческий фокус" subtitle="Программы с наибольшим разрывом между планом, согласием и спросом">
        <div className="focus-list risk-focus">{focus.map(({ program, plan, filled, expected, consents, high, highConsent, risk }, index) => <button key={program.id} onClick={() => navigate("directions", program.faculty, program.id)}><em>{index + 1}</em><span><b>{program.code} · {program.name}</b><small>бюджет {fmt(filled)} / {fmt(plan)} · согласия {fmt(consents)} · потенциал {fmt(expected)}</small><small>высокобалльники {fmt(high)} / с согласием {fmt(highConsent)}</small><p>{actionForRisk(risk)}</p></span><Badge tone={risk.tone}>{risk.label}</Badge></button>)}</div>
      </Panel>
    </div>
    <div className="chart-grid">
      <Panel title="Динамика поданных заявлений" subtitle="2026 и реалистичная модель 2025"><DynamicsChart rows={dynamics}/></Panel>
      <Panel title="Динамика платных заявлений" subtitle="Фактический спрос и модель потенциальной суммы"><DynamicsChart rows={dynamics} type="paid" paidContractsTotal={paidFilled}/></Panel>
    </div>
  </>;
}

function DirectionsView({ filters, programs, setFilters, addTask }) {
  const [query, setQuery] = useState("");
  const visible = programs.filter((program) => program.level === filters.level && (filters.faculty === "all" || program.faculty === filters.faculty) && `${program.code} ${program.name} ${program.faculty}`.toLowerCase().includes(query.toLowerCase()));
  const groups = useMemo(() => Object.entries(visible.reduce((acc, program) => { (acc[program.groupCode] ||= []).push(program); return acc; }, {})).sort((a, b) => a[0] === "—" ? 1 : b[0] === "—" ? -1 : a[0].localeCompare(b[0], "ru")), [visible]);
  const selected = visible.find((program) => program.id === filters.program) || visible[0];
  const selectProgram = (id) => setFilters((old) => ({ ...old, program: id }));
  if (!selected) return <Empty>Для выбранного среза нет программ</Empty>;
  const slice = sliceFor(selected, filters.form, filters.basis);
  const budgetSlice = sliceFor(selected, filters.form, "budget");
  const paidSlice = sliceFor(selected, filters.form, "paid");
  const plan = planFor(selected, filters.form);
  const rawPotential = budgetSlice.potentialBudgetPeople || 0;
  const expected = expectedBudgetChoice(budgetSlice);
  const filled = filledFor(selected, filters.form);
  const paidForecast = Math.min(plan.paid, expectedPaidContracts(paidSlice));
  const risk = riskFor(plan.budget, filled, expected);
  const coverage = plan.budget ? Math.min(100, filled / plan.budget * 100) : 0;
  return <div className="split-view">
    <Panel title="Иерархия программ" subtitle={`${visible.length} программ · филиалы исключены`} action={<label className="search"><MagnifyingGlass/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Код или название"/></label>} className="program-list-panel">
      <div className="program-tree">{groups.map(([groupCode, items]) => <details key={groupCode} open={items.some((item) => item.id === selected.id)} className={groupCode === "—" ? "unmatched-group" : ""}><summary><span><CaretDown/><b>{groupCode === "—" ? "Код программы не определён" : groupCode}</b></span><Badge tone={groupCode === "—" ? "medium" : "neutral"}>{items.length}</Badge></summary>{items.map((program) => { const programSlice = sliceFor(program, filters.form, filters.basis); return <button key={program.id} className={program.id === selected.id ? "selected" : ""} onClick={() => selectProgram(program.id)}><span><b>{program.code}</b><small>{program.name}</small><em>{program.faculty}</em></span><strong>{fmt(programSlice.applications)}</strong><small className="tree-consent">{fmt(programSlice.activeConsentPeople)} согласий · 85+ {fmt(programSlice.highScorers)}</small></button>; })}</details>)}</div>
    </Panel>
    <div className="detail-stack">
      <Panel title={`${selected.code} · ${selected.name}`} subtitle={selected.faculty} action={<Source type="plan"/>}>
        <div className="consent-inline-note consent-confirmed"><CheckCircle/><span><b>Активных согласий: {fmt(slice.activeConsentPeople)}.</b> Всего отметок о согласии в выбранном срезе: {fmt(slice.consentPeople)}.</span></div>
        <div className="detail-metrics"><div><span>Людей</span><b>{fmt(slice.people)}</b></div><div><span>Заявлений</span><b>{fmt(slice.applications)}</b></div><div><span>Согласия, факт</span><b>{fmt(slice.activeConsentPeople)}</b><small>{fmt(slice.consentPeople)} всего</small></div><div><span>Высокобалльники 85+</span><b>{fmt(slice.highScorers)} / {fmt(slice.activeHighScorerConsents)}</b><small>всего / с согласием</small></div></div>
        <div className="plan-grid"><article><span>Бюджетный набор заполнен</span><strong>{fmt(filled)} / {plan.budget || "—"}</strong><Progress value={coverage} tone={risk.key === "high" ? "red" : risk.key === "medium" ? "orange" : "green"}/><small>{plan.budget ? pct(filled / plan.budget * 100) : "нет бюджетного плана"} · факт согласий с лимитом мест</small></article><article><span>Платный набор</span><strong>≈ {fmt(paidForecast)} / {plan.paid || "—"}</strong><small>модель 18% активного платного интереса; договоры не загружены</small></article><article><span>Средний балл верхнего диапазона</span><strong>{selected.topAverageScore ?? selected.projectedAverageScore ?? "—"}</strong><small>{selected.topAverageScore ? "среди согласий в расчётном диапазоне" : "расчёт по активным приоритетам"}</small></article><article><span>Текущая расчётная граница</span><strong>{selected.topBoundaryScore ?? selected.projectedBoundaryScore ?? "—"}</strong><small>не официальный проходной балл</small></article></div>
        <div className="recommendation"><Sparkle/><span><b>Риск недобора: {risk.label.toLowerCase()}</b><p>{actionForRisk(risk)}</p><small>Потенциально выберут: {fmt(expected)} из {fmt(rawPotential)} активных приоритетов 1–2.</small></span><button onClick={() => addTask({ title: `${actionForRisk(risk)} ${selected.code}`, owner: selected.faculty, priority: risk.key === "high" ? "high" : "medium" })}>В очередь</button></div>
      </Panel>
      <Panel title="Динамика выбранной программы" subtitle="Дата на ползунке меняет значения"><DynamicsChart rows={currentDynamics({ ...filters, program: selected.id })}/></Panel>
    </div>
  </div>;
}

function RankingView({ filters, programs, setFilters }) {
  const [onlyConsent, setOnlyConsent] = useState(false);
  const available = programs.filter((program) => program.level === filters.level && (filters.faculty === "all" || program.faculty === filters.faculty));
  const selected = available.find((program) => program.id === filters.program) || available[0];
  if (!selected) return <Empty>Нет рейтинга в выбранном срезе</Empty>;
  const rows = (data.rankings[selected.id] || []).filter((row) => (filters.form === "Все формы" || row.form === filters.form) && (filters.basis === "all" || row.basis === filters.basis) && (!onlyConsent || row.consent));
  const budgetSlice = sliceFor(selected, filters.form, "budget");
  const filled = filledFor(selected, filters.form);
  return <>
    <div className="explain fact-strip"><CheckCircle/><span><b>Согласия отображаются как фактический признак АИС.</b> Место и верхний диапазон остаются расчётными и меняются вместе с конкурсной ситуацией.</span><Source/><Source type="model"/></div>
    <div className="ranking-toolbar"><label><span>Образовательная программа</span><select value={selected.id} onChange={(event) => setFilters((old) => ({ ...old, program: event.target.value }))}>{available.map((program) => <option key={program.id} value={program.id}>{program.code} · {program.name}</option>)}</select></label><label className="check"><input type="checkbox" checked={onlyConsent} onChange={(event) => setOnlyConsent(event.target.checked)}/> Только с согласием</label></div>
    <div className="metrics metrics-four"><Metric label="Бюджетных мест" value={fmt(planFor(selected, filters.form).budget)} detail={`платных: ${fmt(planFor(selected, filters.form).paid)}`} icon={Buildings} source="plan"/><Metric label="Активные согласия" value={fmt(budgetSlice.activeConsentPeople)} detail={`расчётно заполнено ${fmt(filled)} мест`} icon={CheckCircle} tone="green"/><Metric label="Средний балл верхнего списка" value={selected.topAverageScore ?? selected.projectedAverageScore ?? "—"} detail={selected.topAverageScore ? "среди заявлений с согласием" : "по активным приоритетам"} icon={Target} tone="red" source={selected.topAverageScore ? "ais" : "model"}/><Metric label="Текущая граница" value={selected.topBoundaryScore ?? selected.projectedBoundaryScore ?? "—"} detail="расчётная, не официальный проходной балл" icon={TrendUp} tone="green" source="model"/></div>
    <Panel title="Рейтинг заявлений" subtitle={`${selected.code} · ${rows.length} обезличенных строк`} action={<Source/>}><div className="table-wrap"><table><thead><tr><th>Место</th><th>Код абитуриента</th><th>Балл</th><th>Приоритет</th><th>Согласие</th><th>Статус заявления</th><th>Расчётный диапазон</th></tr></thead><tbody>{rows.map((row) => <tr key={`${row.id}-${row.form}-${row.basis}`}><td>{row.place}</td><td><b>{row.id}</b></td><td><b>{row.score}</b></td><td>{row.priority === 999 ? "—" : row.priority}</td><td>{row.consent ? <Badge tone="green">Да</Badge> : <Badge>Нет</Badge>}</td><td>{row.status}</td><td>{row.topList ? <Badge tone="green">В диапазоне</Badge> : "—"}</td></tr>)}</tbody></table></div><p className="footnote">«В диапазоне» — расчётная позиция. Согласие является фактом АИС, но не гарантирует зачисление.</p></Panel>
  </>;
}

function ApplicantsView({ filters }) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [touchMin, setTouchMin] = useState(0);
  const [scoreFrom, setScoreFrom] = useState(0);
  const [scoreTo, setScoreTo] = useState(500);
  const [consentFilter, setConsentFilter] = useState("all");
  const [sortBy, setSortBy] = useState("score");
  const visible = data.applicants.filter((person) => {
    const applications = person.applications.filter((item) => (filters.program === "all" || item.programId === filters.program) && (filters.form === "Все формы" || item.form === filters.form) && (filters.basis === "all" || item.basis === filters.basis));
    return `${person.id} ${person.segment}`.toLowerCase().includes(query.toLowerCase())
      && (filters.faculty === "all" || person.faculties.includes(filters.faculty))
      && applications.length > 0
      && person.touchCount >= Number(touchMin)
      && person.score >= Number(scoreFrom || 0)
      && person.score <= Number(scoreTo || 999)
      && (consentFilter === "all" || person.consent === (consentFilter === "yes"));
  }).sort((a, b) => sortBy === "touches" ? b.touchCount - a.touchCount || b.score - a.score : sortBy === "consent" ? Number(b.consent) - Number(a.consent) || b.score - a.score : b.score - a.score);
  const person = visible.find((item) => item.id === selectedId) || visible[0];
  if (!person) return <Empty>В обезличенной выборке нет людей для выбранного среза</Empty>;
  const personApps = person.applications.filter((item) => (filters.program === "all" || item.programId === filters.program) && (filters.form === "Все формы" || item.form === filters.form) && (filters.basis === "all" || item.basis === filters.basis)).sort((a, b) => a.priority - b.priority || b.score - a.score);
  const consentApps = personApps.filter((item) => item.consent);
  return <>
    <div className="explain"><ShieldCheck/><span><b>Без персональных данных.</b> Заявление и согласие — факты АИС, а не касания. Мероприятия, дни открытых дверей и звонки CRM ниже смоделированы для демонстрации сценария и явно отмечены как модель.</span><Source/></div>
    <div className="applicant-filters">
      <label className="search"><MagnifyingGlass/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ID или сегмент"/></label>
      <label><span>Касаний от</span><select value={touchMin} onChange={(event) => setTouchMin(event.target.value)}><option value="0">Любое количество</option><option value="2">2+</option><option value="3">3+</option><option value="5">5+</option></select></label>
      <label><span>Балл от</span><input type="number" min="0" max="500" value={scoreFrom} onChange={(event) => setScoreFrom(event.target.value)}/></label>
      <label><span>Балл до</span><input type="number" min="0" max="500" value={scoreTo} onChange={(event) => setScoreTo(event.target.value)}/></label>
      <label><span>Согласие</span><select value={consentFilter} onChange={(event) => setConsentFilter(event.target.value)}><option value="all">Все</option><option value="yes">Подано</option><option value="no">Не подано</option></select></label>
      <label><span>Сортировка</span><select value={sortBy} onChange={(event) => setSortBy(event.target.value)}><option value="score">По баллу</option><option value="touches">По касаниям</option><option value="consent">Сначала с согласием</option></select></label>
    </div>
    <div className="split-view applicants-view">
      <Panel title="Обезличенная выборка" subtitle={`${visible.length} траекторий после фильтров`}><div className="people-list">{visible.map((item) => <button key={item.id} className={item.id === person.id ? "selected" : ""} onClick={() => setSelectedId(item.id)}><UserFocus/><span><b>{item.id}</b><small>макс. {item.score} · {item.applications.length} программ · {item.touchCount} подтверждённых касаний</small></span><span className="person-badges"><Badge tone={item.consent ? "green" : "neutral"}>{item.consent ? "Согласие подано" : "Без согласия"}</Badge><Badge tone={item.segment.includes("85+") ? "high" : item.segment.includes("Приоритет") ? "medium" : "neutral"}>{item.segment}</Badge></span></button>)}</div></Panel>
      <div className="detail-stack">
        <Panel title={person.id} subtitle={person.faculties.join(" · ")} action={<Badge tone={consentApps.length ? "green" : "neutral"}>{consentApps.length ? `Согласие: ${consentApps.map((item) => item.code).join(", ")}` : "Согласие не подано"}</Badge>}>
          <div className="person-hero"><div><span>Макс. балл программы</span><strong>{person.score}</strong></div><div><span>Результатов испытаний</span><strong>{person.exams.length}</strong></div><div><span>Программ</span><strong>{person.applications.length}</strong></div><div><span>Касаний, модель</span><strong>{person.touchCount}</strong></div></div>
          <p className="score-note">Конкурсный балл зависит от выбранной программы. Ниже показаны все доступные результаты ЕГЭ и вступительных испытаний, а в заявлении — балл именно этой программы.</p>
          <div className="exam-grid">{person.exams.map((exam) => <article key={exam.name}><span>{exam.name}</span><b>{exam.score}</b></article>)}</div>
        </Panel>
        <Panel title="Согласие на зачисление" subtitle="Показана одна программа с лучшим активным приоритетом среди строк согласия АИС">
          {consentApps.length ? <div className="consent-destinations">{consentApps.map((item) => <article key={`consent-${item.programId}-${item.form}-${item.basis}`}><CheckCircle/><span><b>{item.code} · {item.name}</b><small>{item.faculty} · {item.form} · {item.basis === "budget" ? "бюджет" : "платное"}</small></span><Badge tone={item.active ? "green" : "medium"}>{item.active ? "Активно" : "Не участвует в конкурсе"}</Badge></article>)}</div> : <Empty>В выбранном срезе согласие не подано</Empty>}
        </Panel>
        <Panel title="Заявления и места" subtitle="Факты подачи и приоритеты внутри Московского Политеха"><div className="application-list application-cards">{personApps.map((item) => <article key={`${item.programId}-${item.form}-${item.basis}`}><span className="priority">{item.priority === 999 ? "—" : item.priority}</span><span><b>{item.code} · {item.name}</b><small>{item.faculty} · {item.form} · {item.basis === "budget" ? "бюджет" : "платное"} · {item.date || "дата не определена"}</small></span><span className="application-score"><strong>{item.score}</strong><small>балл программы</small></span><Badge tone={item.consent ? "green" : "neutral"}>{item.consent ? "Согласие подано сюда" : item.status}</Badge></article>)}</div></Panel>
        <Panel title="Коммуникационные касания" subtitle="Демонстрационная модель: мероприятия, дни открытых дверей и звонки CRM" action={<Source type="model"/>}>
          <div className="timeline">{person.touchpoints.map((touch, index) => <div key={`${touch.type}-${touch.date}-${index}`}><span className="timeline-icon"><ChatCircleDots/></span><span><b>{touch.type} · {touch.source}</b><small>{touch.date} · предполагаемое событие</small></span><strong>{touch.result}</strong></div>)}</div>
          <p className="model-note">{person.touchStatus}</p>
        </Panel>
      </div>
    </div>
  </>;
}

function IntersectionsView({ filters, programs, setFilters }) {
  const map = Object.fromEntries(programs.map((program) => [program.id, program]));
  const baseRows = data.intersections.filter((item) => map[item.a]?.level === filters.level && map[item.b]?.level === filters.level)
    .filter((item) => filters.faculty === "all" || map[item.a]?.faculty === filters.faculty || map[item.b]?.faculty === filters.faculty);
  const weight = {};
  baseRows.forEach((item) => { weight[item.a] = (weight[item.a] || 0) + item.count; weight[item.b] = (weight[item.b] || 0) + item.count; });
  const matrixIds = Object.keys(weight).sort((a, b) => weight[b] - weight[a]).slice(0, 7);
  const initial = filters.program !== "all" && matrixIds.includes(filters.program) ? filters.program : matrixIds[0];
  const [selected, setSelected] = useState(initial);
  useEffect(() => { if (!matrixIds.includes(selected)) setSelected(matrixIds[0]); }, [filters.level, filters.faculty, filters.program]);
  const pairCount = (a, b) => {
    if (a === b) return map[a]?.people || 0;
    return baseRows.find((item) => (item.a === a && item.b === b) || (item.a === b && item.b === a))?.count || 0;
  };
  const max = Math.max(1, ...matrixIds.flatMap((a) => matrixIds.map((b) => pairCount(a, b))));
  const focusRows = baseRows.filter((item) => item.a === selected || item.b === selected).slice(0, 10);
  if (!matrixIds.length) return <Empty>Для выбранного среза нет пересечений программ</Empty>;
  return <>
    <div className="explain"><ArrowsLeftRight/><span><b>Матрица показывает реальных общих абитуриентов между образовательными программами.</b> Филиалы исключены; базовый код используется только как родительская группа.</span><Source/></div>
    <div className="intersection-grid-v5">
      <Panel title="Матрица пересечений" subtitle="Нажмите код, чтобы изменить фокус">
        <div className="heatmap-v5"><span className="heat-corner">Код</span>{matrixIds.map((id) => <button key={`head-${id}`} className={selected === id ? "active" : ""} onClick={() => setSelected(id)} title={map[id]?.name}>{map[id]?.code}</button>)}{matrixIds.map((row) => <div className="heat-row-v5" key={row}><button className={selected === row ? "active" : ""} onClick={() => setSelected(row)} title={map[row]?.name}>{map[row]?.code}</button>{matrixIds.map((col) => { const value = pairCount(row, col); return <button key={col} title={`${fmt(value)} человек`} style={{ "--heat": Math.max(.06, value / max) }}>{fmt(value)}</button>; })}</div>)}</div>
      </Panel>
      <Panel title={`Фокус: ${map[selected]?.code || "—"}`} subtitle={map[selected]?.name || "Выберите программу"}>
        <div className="intersection-focus-list">{focusRows.map((item) => { const otherId = item.a === selected ? item.b : item.a; const other = map[otherId]; return <button key={`${item.a}-${item.b}`} onClick={() => setFilters((old) => ({ ...old, program: otherId }))}><span><b>{other?.code}</b><small>{other?.name}</small></span><strong>{fmt(item.count)}</strong><CaretRight/></button>; })}</div>
      </Panel>
    </div>
  </>;
}

const events = [
  { name: "День открытых дверей", contacts: 496, submitted: 54, noAnswer: 124, refusals: 51, inWork: 18, source: "CRM" },
  { name: "Профориентационные мероприятия", contacts: 43, submitted: 0, noAnswer: 13, refusals: 6, inWork: 0, source: "CRM" },
  { name: "Другие CRM-формы", contacts: 26, submitted: 4, noAnswer: 11, refusals: 9, inWork: 1, source: "CRM" },
  { name: "Выставка «Образование и карьера»", contacts: 400, submitted: 57, noAnswer: 9, refusals: 3, inWork: 25, source: "CRM" },
  { name: "Другие выставки", contacts: 7, submitted: 0, noAnswer: 3, refusals: 1, inWork: 0, source: "CRM" },
];
function CommunicationsView() {
  const [selectedEvent, setSelectedEvent] = useState(events[0].name);
  const event = events.find((item) => item.name === selectedEvent) || events[0];
  return <>
    <div className="warning"><WarningCircle/><span><b>CRM и АИС пока не склеены по единому ID.</b> Результаты звонков ниже являются подтверждёнными агрегатами CRM, но не доказывают подачу заявления тем же человеком. Конверсия ≈10% используется только как управленческая модель.</span><Source type="model"/></div>
    <div className="metrics communication-metrics">
      <Metric label="Контакты в CRM" value="590" detail="обезличенная выборка ФИТ" icon={UsersThree} source="model"/>
      <Metric label="Есть результат звонка" value="333" detail="обработанные статусы CRM" icon={ChatCircleDots} tone="violet" source="model"/>
      <Metric label="Подали документы" value="58" detail="статус внутри CRM" icon={CheckCircle} tone="green" source="model"/>
      <Metric label="Не дозвонились" value="160" detail="70 отказов" icon={WarningCircle} tone="red" source="model"/>
      <Metric label="2+ интереса" value="104" detail="пересечения внутри CRM" icon={ArrowsLeftRight} source="model"/>
    </div>
    <div className="communications-layout">
      <Panel title="Мероприятия и формы" subtitle="Выберите источник для подробностей"><div className="crm-event-table">{events.map((item) => <button key={item.name} className={selectedEvent === item.name ? "selected" : ""} onClick={() => setSelectedEvent(item.name)}><span><b>{item.name}</b><small>{item.contacts} контактов</small></span><span><b>{item.submitted}</b><small>документы</small></span><span><b>{item.noAnswer}</b><small>нет ответа</small></span><CaretRight/></button>)}</div></Panel>
      <Panel title={event.name} subtitle="Результаты по выбранному источнику" action={<Source type="model">CRM</Source>}><div className="event-hero"><strong>{event.contacts}</strong><span>контактов в выборке</span></div><div className="event-results"><div><span>Подали документы</span><b>{event.submitted}</b><Progress value={event.submitted / event.contacts * 100} tone="green"/></div><div><span>Не дозвонились</span><b>{event.noAnswer}</b><Progress value={event.noAnswer / event.contacts * 100} tone="orange"/></div><div><span>Отказы</span><b>{event.refusals}</b><Progress value={event.refusals / event.contacts * 100} tone="red"/></div><div><span>В работе</span><b>{event.inWork}</b><Progress value={event.inWork / event.contacts * 100}/></div></div></Panel>
    </div>
    <Panel title="Как работают персональные коммуникации" subtitle="Целевой сценарий внутри защищённого контура"><div className="logic-flow"><span>Сигнал из АИС</span><CaretRight/><span>Единый ID</span><CaretRight/><span>Сегмент и контекст</span><CaretRight/><span>Черновик сообщения</span><CaretRight/><span>Контроль результата</span></div><div className="message-preview"><small>ПРИМЕР ЧЕРНОВИКА · БЕЗ ОТПРАВКИ</small><p>В вашем заявлении зафиксирован высокий приоритет, но пока нет согласия. Можем помочь проверить конкурсную ситуацию и следующий шаг.</p><span><ShieldCheck/> Текст формируется только внутри серверного контура университета</span></div></Panel>
  </>;
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
  const paidScope = data.scopes[`${filters.level}|${filters.form}|paid`] || {};
  const rows = currentDynamics(filters);
  const visibleFaculties = faculties.filter((item) => item.level === filters.level && (filters.faculty === "all" || item.name === filters.faculty));
  const official = data.officialTotals[filters.level]?.[filters.form] || data.officialTotals[filters.level]?.["Все формы"] || { paid: 0 };
  const modeledContracts = Math.min(official.paid, expectedPaidContracts(paidScope));
  const modeledMoney = modeledContracts * AVERAGE_CONTRACT_PRICE;
  return <>
    <div className="explain fact-strip"><CheckCircle/><span><b>Спрос и согласия — фактический срез АИС.</b> Договоры и деньги пока не загружены, поэтому финансовый блок показан как демонстрационная модель и отмечен знаком ≈.</span><Source/><Source type="model"/></div>
    <div className="metrics metrics-four finance-metrics"><Metric label="Ожидаемые договоры" value={`≈ ${fmt(modeledContracts)}`} detail={`модель 18% активного платного интереса · план ${fmt(official.paid)}`} icon={FileText} source="model"/><Metric label="Средняя стоимость" value={`≈ ${fmt(AVERAGE_CONTRACT_PRICE)} ₽`} detail="ориентир для визуализации, не бухгалтерский факт" icon={CurrencyRub} tone="violet" source="model"/><Metric label="Потенциальный объём" value={`≈ ${fmt(Math.round(modeledMoney / 1000000))} млн ₽`} detail="ожидаемые договоры × модельная средняя стоимость" icon={TrendUp} tone="green" source="model"/><Metric label="Оплачено" value="—" detail="данные договорного отдела ожидают загрузки" icon={Database} source="status"/></div>
    <div className="chart-grid"><Panel title="Общий поток" subtitle="Сравнение 2026 с моделью 2025"><DynamicsChart rows={rows}/></Panel><Panel title="Платный спрос" subtitle="Заявления и модель потенциальной суммы"><DynamicsChart rows={rows} type="paid" paidContractsTotal={modeledContracts}/></Panel></div>
    <div className="analytics-grid"><Panel title="Сегменты" subtitle="Выбранный глобальный срез"><div className="segment-grid">{[["Людей", scope.people], ["Заявлений", scope.applications], ["Активные личные дела", scope.activePeople], ["Согласия, факт", scope.activeConsentPeople], ["Высокобалльники 85+", scope.highScorers], ["85+ с согласием", scope.activeHighScorerConsents]].map(([label, value]) => <article key={label}><span>{label}</span><b>{fmt(value)}</b></article>)}</div></Panel><Panel title="Факультеты и институты" subtitle="Спрос, согласия и высокобалльники"><div className="analytics-list analytics-list-four">{visibleFaculties.map((faculty) => { const slice = sliceFor(faculty, filters.form, filters.basis); return <div key={faculty.name}><span><b>{faculty.name}</b><small>{fmt(slice.people)} людей</small></span><span><b>{fmt(slice.applications)}</b><small>заявлений</small></span><span><b>{fmt(slice.activeConsentPeople)}</b><small>активных согласий</small></span><span><b>{fmt(slice.highScorers)} / {fmt(slice.activeHighScorerConsents)}</b><small>85+ / согласие</small></span></div>; })}</div></Panel></div>
  </>;
}

function ReportsView({ toast }) {
  const templates = [
    { name: "Сводка для руководства", format: "PDF", description: "Три цифры, три риска и три управленческих действия." },
    { name: "Срез по факультетам", format: "XLSX", description: "План, заявления, согласия и высокобалльники." },
    { name: "Срез по программам", format: "XLSX", description: "Профили, приоритеты, заполнение и текущая граница." },
    { name: "Контроль качества данных", format: "XLSX", description: "Источники, исключения, неопределённые коды и методика." },
  ];
  const history = [
    { name: "Сводка для руководства", date: "27.07.2026, 18:40", status: "Готов" },
    { name: "Срез по факультетам", date: "27.07.2026, 12:15", status: "Готов" },
    { name: "Контроль качества данных", date: "26.07.2026, 19:05", status: "Архив" },
  ];
  return <>
    <Panel title="Сводка для руководства · 3–3–3" subtitle="Короткий формат для ежедневной планёрки" className="leadership-panel"><div className="leadership-grid"><article><b>3 цифры</b><p>22 565 людей · 2 146 активных согласий · 1 555 высокобалльников 85+</p></article><article><b>3 риска</b><p>Разрыв до бюджетного плана · 85+ без согласия · отсутствие факта по договорам</p></article><article><b>3 действия</b><p>Обзвон приоритетов 1–2 · работа с 85+ · контроль программ высокого риска</p></article></div></Panel>
    <div className="actions-row report-actions"><span><b>Форматы используют текущий срез и сохраняют происхождение показателей</b><small>Подготовка файлов в этой локальной версии демонстрационная</small></span><button className="primary" onClick={() => toast("Отчёт поставлен в очередь")}><FileText/>Сформировать отчёт</button></div>
    <div className="report-grid">{templates.map((report) => <article key={report.name}><FileText/><Badge>{report.format}</Badge><h3>{report.name}</h3><p>{report.description}</p><button className="secondary" onClick={() => toast(`Подготовка: ${report.name}`)}><DownloadSimple/>Подготовить</button></article>)}</div>
    <Panel title="История выгрузок" subtitle="К предыдущему срезу можно вернуться после подключения защищённого хранилища"><div className="export-history">{history.map((item, index) => <div key={item.name + item.date}><span><FileText/><b>{item.name}</b></span><time>{item.date}</time><Badge tone={index < 2 ? "green" : "neutral"}>{item.status}</Badge><button className="secondary" onClick={() => toast("Демонстрационная выгрузка выбрана")}><DownloadSimple/>Открыть</button></div>)}</div></Panel>
  </>;
}

function QualityView() {
  const base = data.scopes["Бакалавриат и специалитет|Все формы|all"] || {};
  const unmatched = data.programs.filter((program) => program.code === "—").length;
  const labels = { people: "Люди", applications: "Заявления", highScorer: "Высокобалльник 85+", potentialBudget: "Потенциальный выбор бюджета", topList: "Расчётный диапазон", model2025: "Модель 2025" };
  return <>
    <div className="metrics quality-metrics-v5"><Metric label="Строк исходной АИС" value={fmt(data.source.rows)} detail="технические конкурсные строки" icon={Database}/><Metric label="Людей в московском срезе" value={fmt(base.people)} detail="филиалы исключены до агрегации" icon={UsersThree} tone="green"/><Metric label="Заявлений по программам" value={fmt(base.applications)} detail="уникальные человек × программа" icon={ArrowsLeftRight} tone="violet"/><Metric label="Неопределённых кодов" value={fmt(unmatched)} detail="группы для ручной проверки" icon={WarningCircle} tone={unmatched ? "red" : "green"}/></div>
    <Panel title="Источники данных" subtitle="Свежесть, роль и статус подключения"><div className="source-table-v5"><div className="source-head-v5"><span>Источник</span><span>Роль</span><span>Объём</span><span>Свежесть</span><span>Статус</span></div><div><span><i className="ok"/><b>АИС «Приём»</b></span><span>Люди, заявления, согласия, баллы</span><span>{fmt(data.source.rows)} строк</span><span>{data.source.updated}</span><Badge tone="green">Подтверждён</Badge></div><div><span><i className="ok"/><b>План приёма 2026</b></span><span>Бюджетные и платные места</span><span>Приказ № 17-ОД</span><span>19.01.2026</span><Badge tone="green">Подтверждён</Badge></div><div><span><i className="warn"/><b>CRM мероприятий</b></span><span>Звонки и статусы контактов</span><span>590 контактов</span><span>требует склейки</span><Badge tone="medium">Частично</Badge></div><div><span><i className="warn"/><b>Договоры и оплаты</b></span><span>Платный набор и деньги</span><span>—</span><span>ожидается</span><Badge>Не подключён</Badge></div></div></Panel>
    <div className="quality-grid quality-details"><Panel title="Словарь показателей" subtitle="Как одинаково читать цифры"><div className="method-list">{Object.entries(data.definitions).map(([key, value]) => <article key={key}><b>{labels[key] || key}</b><p>{value}</p></article>)}</div></Panel><Panel title="Контроль методики" subtitle="Правила текущего среза"><ol className="next-steps-v5"><li><b>Единица человека</b><span>Уникальный номер личного дела преобразован в публичный анонимный ID.</span></li><li><b>Филиалы</b><span>Все подразделения с признаком «филиал» исключены до расчёта показателей.</span></li><li><b>Согласия</b><span>Показывается фактический признак АИС; активные согласия считаются отдельно.</span></li><li><b>Баллы</b><span>Конкурсный балл зависит от программы: три испытания для большинства нетворческих и до пяти для творческих программ.</span></li><li><b>Модели</b><span>Конверсия мероприятий, платные договоры и линия 2025 всегда отмечены как модель.</span></li></ol></Panel></div>
    <Panel title="Правила безопасной работы" subtitle="Целевой защищённый контур"><div className="security-list-v5"><span><ShieldCheck/><div><b>Без персональных данных</b><small>В публичный JSON попадают агрегаты и детерминированные анонимные ID.</small></div></span><span><UserFocus/><div><b>Доступ по ролям</b><small>Руководитель, факультет и оператор получают разные права во внутренней версии.</small></div></span><span><Database/><div><b>Происхождение показателя</b><small>Для каждой цифры фиксируются источник, дата среза и метод расчёта.</small></div></span></div></Panel>
  </>;
}

function SettingsView({ toast }) {
  const [auto, setAuto] = useState(true);
  const [ai, setAi] = useState(true);
  return <div className="settings-grid settings-grid-rich">
    <Panel title="Обновление данных" subtitle="Будущая серверная конфигурация"><label className="setting"><span><b>Автоматическая синхронизация</b><small>Обновлять источники по расписанию</small></span><button className={`toggle ${auto ? "on" : ""}`} onClick={() => setAuto(!auto)} aria-pressed={auto}><i/></button></label><label className="field"><span>Частота обновления</span><select><option>Каждые 15 минут</option><option>Каждый час</option></select></label><label className="field"><span>Часовой пояс</span><select><option>Europe/Moscow · UTC+3</option></select></label></Panel>
    <Panel title="Пороговые сигналы" subtitle="Настройка управленческого фокуса"><label className="field"><span>Заполнение бюджета ниже, %</span><input type="number" defaultValue="70"/></label><label className="field"><span>Высокобалльники без согласия, чел.</span><input type="number" defaultValue="20"/></label><label className="field"><span>Нет движения, дней</span><input type="number" defaultValue="7"/></label></Panel>
    <Panel title="Локальная модель" subtitle="Персонализация внутри университета"><label className="setting"><span><b>AI-рекомендации</b><small>Следующий шаг и черновик сообщения</small></span><button className={`toggle ${ai ? "on" : ""}`} onClick={() => setAi(!ai)} aria-pressed={ai}><i/></button></label><div className="server-card-v5"><i/><span><b>Демонстрационный режим</b><small>Реальный endpoint доступен только внутри защищённой сети</small></span></div></Panel>
    <Panel title="Доступ и роли" subtitle="Будущие политики защищённой версии"><div className="role-list-v5"><div><span><b>Руководитель</b><small>Все агрегаты и отчёты</small></span><Badge tone="green">Активна</Badge></div><div><span><b>Факультет</b><small>Свои программы и задачи</small></span><Badge>Шаблон</Badge></div><div><span><b>Оператор</b><small>Назначенные профили без общего экспорта</small></span><Badge>Шаблон</Badge></div></div></Panel>
    <div className="settings-note"><WarningCircle/><span><b>Локальный прототип.</b> Настройки пока не меняют серверные расчёты и не передаются другим пользователям.</span></div>
    <button className="primary save-settings" onClick={() => toast("Настройки сохранены локально")}>Сохранить настройки</button>
  </div>;
}


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
