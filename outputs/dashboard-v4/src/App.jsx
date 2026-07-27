import { useEffect, useMemo, useRef, useState } from "react";
import {
  SquaresFour, GraduationCap, UsersThree, ArrowsLeftRight, ChatCircleDots,
  CheckSquare, ChartLineUp, FileText, Database, Gear, MagnifyingGlass, Bell,
  DownloadSimple, Funnel, WarningCircle, UserFocus, Phone, Target, X,
  CheckCircle, Clock, CaretRight, ArrowUpRight, ShieldCheck, LinkSimple,
  Sparkle, DotsThree, ListNumbers, Buildings, TrendUp, CurrencyRub, List,
} from "@phosphor-icons/react";
import {
  campaign, faculties, directions, intersections, applicants, tasksSeed,
  applicationDynamics, consentDynamics, reportTemplates, dataSources,
  heatmapDirections, directionById, facultyById, intersectionCount,
  officialRanking, crmSummary, metricSources,
} from "./demoData.js";
import actuals from "./admissionsActuals.json";

const nav = [
  ["overview", "Обзор", SquaresFour],
  ["directions", "Направления", GraduationCap],
  ["ranking", "Рейтинг", ListNumbers],
  ["applicants", "Абитуриенты", UsersThree],
  ["intersections", "Пересечения", ArrowsLeftRight],
  ["communications", "Коммуникации", ChatCircleDots],
  ["tasks", "Задачи", CheckSquare],
  ["analytics", "Аналитика", ChartLineUp],
  ["reports", "Отчеты", FileText],
  ["quality", "Качество данных", Database],
  ["settings", "Настройки", Gear],
];

const titles = {
  overview: ["Обзор приемной кампании", "Управленческий срез на 27 июля 2026 года"],
  directions: ["Факультеты и направления", "Фактический спрос, план приема и зоны риска"],
  ranking: ["Рейтинг абитуриентов", "Расширенный служебный срез по выбранному конкурсу"],
  applicants: ["Абитуриенты", "Обезличенные траектории и следующий целевой шаг"],
  intersections: ["Пересечения направлений", "Конкуренция программ за одного и того же абитуриента"],
  communications: ["Коммуникации и мероприятия", "Фактическая CRM-выгрузка: 590 обезличенных контактов ФИТ"],
  tasks: ["Очередь действий", "Операционная работа по приоритетам приемной кампании"],
  analytics: ["Аналитика", "Динамика, факультеты и подтвержденные сегменты"],
  reports: ["Отчеты", "Управленческие выгрузки и история формирования"],
  quality: ["Качество данных", "Источники, склейка профилей и готовность API"],
  settings: ["Настройки", "Пороговые значения, обновление и безопасный контур"],
};

const fmt = (n) => new Intl.NumberFormat("ru-RU").format(n);
const pct = (a, b) => `${((a / b) * 100).toFixed(1).replace(".", ",")}%`;
const riskLabel = { high: "Высокий", medium: "Средний", low: "Низкий" };
const projectContacts = 100000;
const demoPaidFilled = 1216;
const demoPaidFillRate = demoPaidFilled / actuals.scope.paidPlan * 100;
const actualDirections = actuals.directions.filter((d) => d.code !== "—" && (d.planBudget > 0 || d.planPaid > 0));
const actualFacultyNames = [...new Set(actualDirections.map((d) => d.faculty))].sort((a, b) => a.localeCompare(b, "ru"));
const actualFaculties = Object.values(actualDirections.reduce((acc, d) => {
  const key = d.faculty;
  if (!acc[key]) acc[key] = { name: key, applications: 0, applicants: 0, consents: 0, plan: 0, filled: 0 };
  acc[key].applications += d.applications;
  acc[key].applicants += d.activeApplicants;
  acc[key].consents += d.activeConsentApplicants;
  acc[key].plan += d.planBudget;
  acc[key].filled += d.budgetFilled;
  return acc;
}, {})).sort((a, b) => b.applications - a.applications);
const directionRisk = (d) => d.budgetFillRate == null || d.budgetFillRate < 70 ? "high" : d.budgetFillRate < 90 ? "medium" : "low";

function Badge({ tone = "neutral", children }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function SourcePill({ type = "admissions" }) {
  const names = { admissions: "АИС «Прием»", places: "План приема", ranking: "Публичный рейтинг", crm: "Bitrix24", contacts: "Контактная база" };
  const descriptions = { ...metricSources, contacts: "Проектный контур: 100 000 контактов из CRM и мероприятий; сквозная дедупликация с АИС еще не настроена" };
  return <span className={`source-pill source-${type}`} title={descriptions[type]}>{names[type]}</span>;
}

function Metric({ label, value, detail, tone = "blue", icon: Icon, source = "admissions", emphasis = false }) {
  return <article className={`metric-card ${emphasis ? "metric-emphasis" : ""}`}>
    <div className={`metric-icon ${tone}`}>{Icon && <Icon size={20} weight="duotone" />}</div>
    <div className="metric-copy"><div className="metric-label"><p>{label}</p><SourcePill type={source}/></div><strong>{value}</strong><span>{detail}</span></div>
  </article>;
}

function Panel({ title, subtitle, action, className = "", children }) {
  return <section className={`panel ${className}`}>
    <header className="panel-head"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action}</header>
    {children}
  </section>;
}

function Progress({ value, tone = "blue" }) {
  return <div className="progress"><span className={tone} style={{ width: `${Math.min(Math.max(value || 0, 0), 100)}%` }} /></div>;
}

function SparkBars({ data, valueKey = "value", color = "blue" }) {
  const max = Math.max(...data.map((d) => d[valueKey]));
  return <div className="spark-bars">{data.map((d) => <div className="spark-col" key={d.date} title={`${d.date}: ${fmt(d[valueKey])}`}>
    <div className={`spark-fill ${color}`} style={{ height: `${Math.max(8, (d[valueKey] / max) * 100)}%` }} /><span>{d.date}</span>
  </div>)}</div>;
}

function DynamicsChart({ data, selected, onSelected }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scale = window.devicePixelRatio || 1;
    canvas.width = rect.width * scale; canvas.height = rect.height * scale;
    const ctx = canvas.getContext("2d"); ctx.scale(scale, scale);
    const w = rect.width, h = rect.height, pad = { l: 44, r: 16, t: 18, b: 28 };
    const innerW = w - pad.l - pad.r, innerH = h - pad.t - pad.b;
    const max = Math.max(...data.map((d) => d.applications));
    ctx.clearRect(0, 0, w, h); ctx.font = "10px Gilroy, Arial"; ctx.fillStyle = "#8a909a";
    for (let i = 0; i <= 4; i += 1) {
      const y = pad.t + innerH * i / 4;
      ctx.strokeStyle = "#edf0f4"; ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y); ctx.stroke();
      ctx.fillText(fmt(Math.round(max * (1 - i / 4))), 2, y + 3);
    }
    const point = (d, i, key) => ({ x: pad.l + innerW * i / Math.max(data.length - 1, 1), y: pad.t + innerH * (1 - d[key] / max) });
    const draw = (key, color) => {
      ctx.beginPath(); data.forEach((d, i) => { const p = point(d, i, key); i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); });
      ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.lineJoin = "round"; ctx.stroke();
    };
    draw("applications", "#2167ef"); draw("people", "#e51e2a");
    const marker = point(data[selected], selected, "applications");
    ctx.setLineDash([4, 4]); ctx.strokeStyle = "#a9b1bd"; ctx.beginPath(); ctx.moveTo(marker.x, pad.t); ctx.lineTo(marker.x, pad.t + innerH); ctx.stroke(); ctx.setLineDash([]);
    [["applications", "#2167ef"], ["people", "#e51e2a"]].forEach(([key, color]) => { const p = point(data[selected], selected, key); ctx.fillStyle = "#fff"; ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); });
    [0, Math.floor((data.length - 1) / 2), data.length - 1].forEach((i) => { const p = point(data[i], i, "applications"); ctx.fillStyle = "#8a909a"; ctx.fillText(data[i].date, p.x - 13, h - 8); });
  }, [data, selected]);
  const current = data[selected];
  return <div className="dynamics-widget">
    <div className="chart-legend"><span><i className="legend-blue"/>Заявления по направлениям</span><span><i className="legend-red"/>Люди</span><b>{current.date}.2026</b></div>
    <canvas ref={canvasRef} className="dynamics-canvas" aria-label="Интерактивная динамика заявлений"/>
    <div className="dynamic-summary"><article><span>Людей</span><b>{fmt(current.people)}</b></article><article><span>Заявлений по направлениям</span><b>{fmt(current.applications)}</b></article><article><span>В среднем на человека</span><b>{(current.applications / Math.max(current.people, 1)).toFixed(2).replace(".", ",")}</b></article></div>
    <label className="period-slider"><span>20 июня</span><input aria-label="Период динамики" type="range" min="0" max={data.length - 1} value={selected} onChange={(e) => onSelected(Number(e.target.value))}/><span>25 июля</span></label>
  </div>;
}

function GlobalFilters({ faculty, setFaculty, basis, setBasis }) {
  return <div className="filterbar">
    <div className="filter-title"><Funnel size={16}/> Срез</div>
    <select aria-label="Факультет" value={faculty} onChange={(e) => setFaculty(e.target.value)}>
      <option value="all">Все факультеты</option>{actualFacultyNames.map((name) => <option key={name} value={name}>{name}</option>)}
    </select>
    <select aria-label="Основа обучения" value={basis} onChange={(e) => setBasis(e.target.value)}>
      <option value="all">Бюджет и платное</option><option value="budget">Бюджет</option><option value="paid">Платное</option>
    </select>
    <button className="filter-chip active">Прием 2026</button><button className="filter-chip active">Бакалавриат · очная</button>
    <span className="filter-spacer"/><span className="updated"><span className="live-dot"/> Срез данных: 27.07.2026</span>
  </div>;
}

function Overview({ onNavigate, facultyFilter }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [dynamicPoint, setDynamicPoint] = useState(actuals.dynamics.length - 1);
  const filtered = actualDirections.filter((d) => (facultyFilter === "all" || d.faculty === facultyFilter) && `${d.code} ${d.name} ${d.faculty}`.toLowerCase().includes(query.toLowerCase()));
  const pageSize = 8;
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages - 1);
  const rows = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize);
  const focus = [...actualDirections].filter((d) => d.planBudget > d.budgetFilled).sort((a, b) => (b.planBudget - b.budgetFilled) - (a.planBudget - a.budgetFilled)).slice(0, 3);
  return <>
    <div className="overview-source-note"><ShieldCheck size={16}/><span><b>Единицы учета разведены.</b> Люди определены по номеру личного дела, заявления — как уникальная пара «человек × направление».</span><div><SourcePill/><SourcePill type="places"/></div></div>
    <div className="metrics-grid overview-metrics">
      <Metric label="Потенциальные абитуриенты" value={fmt(projectContacts)} detail="контактная база проекта · до дедупликации" icon={UsersThree} source="contacts"/>
      <Metric label="Подали заявление, людей" value={fmt(actuals.scope.uniqueApplicants)} detail="уникальные номера личных дел" icon={FileText}/>
      <Metric label="Заявления с учетом направлений" value={fmt(actuals.scope.directionApplications)} detail="уникальные человек × направление" icon={ArrowsLeftRight} tone="violet"/>
      <Metric label="Конверсия в подачу" value={`≈${pct(actuals.scope.uniqueApplicants, projectContacts)}`} detail="ориентир до склейки CRM ↔ АИС" icon={TrendUp} tone="green" source="contacts"/>
      <Metric label="Согласия на зачисление" value={fmt(actuals.scope.consentApplicants)} detail={`${fmt(actuals.scope.activeConsentApplicants)} человек активны в конкурсе`} icon={CheckCircle} tone="green"/>
      <Metric label="Высокобалльники 85+" value={fmt(actuals.scope.highScorerApplicants)} detail="математика 85+ и физика / информатика 85+" icon={Target} tone="red" emphasis/>
      <Metric label="Бюджетный набор заполнен" value={`${String(actuals.scope.budgetFillRate).replace(".", ",")}%`} detail={`${fmt(actuals.scope.budgetFilled)} / ${fmt(actuals.scope.budgetPlan)} · с лимитом по направлениям`} icon={Buildings} source="places"/>
      <Metric label="Платный набор заполнен" value={`${demoPaidFillRate.toFixed(1).replace(".", ",")}%*`} detail={`${fmt(demoPaidFilled)} / ${fmt(actuals.scope.paidPlan)} договоров`} icon={CurrencyRub} tone="violet" source="places"/>
    </div>
    <div className="overview-main-grid">
      <Panel title="Ситуация по направлениям" subtitle="Бакалавриат · очная форма · фактический спрос и оценка заполнения бюджета" className="direction-situation" action={<div className="table-search"><MagnifyingGlass/><input aria-label="Поиск по направлениям" value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} placeholder="Факультет, код или направление"/></div>}>
        <div className="table-wrap"><table className="executive-table"><thead><tr>
          <th>Факультет / направление</th><th>План<br/>бюдж./плат.</th><th>Подали,<br/>людей</th><th>Активные<br/>согласия</th><th>85+ без<br/>согласия</th><th>Заполнение бюджета</th><th>Риск</th>
        </tr></thead><tbody>{rows.map((d) => <tr key={d.code} onClick={() => onNavigate("directions")}>
          <td><small className="faculty-cell">{d.faculty}</small><b>{d.code}</b><span>{d.name}</span></td><td><b>{d.planBudget} / {d.planPaid}</b><span>очный план</span></td><td><b>{fmt(d.applicants)}</b><span>{fmt(d.applications)} заявлений</span></td><td>{fmt(d.activeConsentApplicants)}</td><td className={d.highScorerNoConsent > 100 ? "danger-text" : ""}>{fmt(d.highScorerNoConsent)}</td><td><b>{d.budgetFillRate == null ? "—" : `${String(d.budgetFillRate).replace(".", ",")}%`}</b><Progress value={d.budgetFillRate} tone={directionRisk(d) === "high" ? "red" : directionRisk(d) === "medium" ? "orange" : "green"}/><span>{d.budgetFilled} из {d.planBudget}</span></td><td><Badge tone={directionRisk(d)}>{riskLabel[directionRisk(d)]}</Badge></td>
        </tr>)}</tbody></table></div>
        <div className="table-footer"><span>{filtered.length ? `${safePage * pageSize + 1}–${Math.min((safePage + 1) * pageSize, filtered.length)} из ${filtered.length}` : "Ничего не найдено"}</span><div><button disabled={safePage === 0} onClick={() => setPage(Math.max(0, safePage - 1))}>‹</button><b>{safePage + 1}</b><button disabled={safePage >= pages - 1} onClick={() => setPage(Math.min(pages - 1, safePage + 1))}>›</button></div><button className="text-btn" onClick={() => onNavigate("directions")}>Все направления <CaretRight/></button></div>
        <p className="table-footnote">Заполнение бюджета — оценка: одно лучшее активное согласие на человека с ограничением планом каждого направления.</p>
      </Panel>
      <Panel title="Управленческий фокус" subtitle="Действия, которые следуют из текущего среза" action={<Badge tone="purple"><Sparkle/> AI-агент</Badge>}>
        <div className="action-list">{focus.map((d, i) => <button key={d.code} onClick={() => onNavigate("applicants")}><span className={`action-rank ${i === 0 ? "red" : i === 1 ? "orange" : "blue"}`}>{i + 1}</span><div><strong>Отработать {d.code}</strong><small>не хватает {d.planBudget - d.budgetFilled} согласий до плана · {fmt(d.highScorerNoConsent)} высокобалльников без согласия</small></div><ArrowUpRight/></button>)}</div>
        <div className="focus-separator"/>
        <div className="source-legend"><b>Источники и ограничения</b><p><SourcePill/> файл «Пробуем отклонить»</p><p><SourcePill type="places"/> приказ № 17-ОД · сумма профилей: 2 058</p><p><SourcePill type="contacts"/> 100 000 контактов · склейка впереди</p></div>
      </Panel>
    </div>
    <div className="grid-2 overview-lower">
      <Panel title="Факультеты" subtitle="Заявления по направлениям, активные согласия и бюджетный план" action={<button className="text-btn" onClick={() => onNavigate("directions")}>Подробный срез <CaretRight/></button>}>
        <div className="faculty-list">{actualFaculties.slice(0, 7).map((f) => { const fill = f.plan ? f.filled / f.plan * 100 : 0; const risk = fill < 70 ? "high" : fill < 90 ? "medium" : "low"; return <button key={f.name} onClick={() => onNavigate("directions")}><span className="faculty-mark">{f.name.split(" ").filter((x) => x.length > 3).slice(0, 2).map((x) => x[0]).join("")}</span><span className="faculty-copy"><b>{f.name}</b><small>{fmt(f.applications)} заявлений · {fmt(f.consents)} активных согласий</small><Progress value={fill} tone={risk === "high" ? "red" : risk === "medium" ? "orange" : "green"}/></span><Badge tone={risk}>{fill.toFixed(0)}%</Badge></button>; })}</div>
      </Panel>
      <Panel title="Динамика поданных заявлений" subtitle="Реальные даты создания личных дел · накопительным итогом" action={<button className="text-btn" onClick={() => onNavigate("analytics")}>Аналитика <CaretRight/></button>}>
        <DynamicsChart data={actuals.dynamics} selected={dynamicPoint} onSelected={setDynamicPoint}/>
      </Panel>
    </div>
    <p className="demo-footnote">* прогнозный демонстрационный показатель для визуализации будущего контура договоров и оплат</p>
  </>;
}

function DirectionsView({ facultyFilter, onNavigate }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("09.03.01");
  const list = actualDirections.filter((d) => (facultyFilter === "all" || d.faculty === facultyFilter) && `${d.code} ${d.name} ${d.faculty}`.toLowerCase().includes(query.toLowerCase()));
  const current = list.find((d) => d.code === selected) || list[0] || actualDirections[0];
  const risk = directionRisk(current);
  const paidForecast = Math.min(current.planPaid, Math.round(current.planPaid * (0.3 + Math.min(current.paidApplications / Math.max(current.applicationRows, 1), .6))));
  return <div className="split-view">
    <Panel title="Направления" subtitle={`${list.length} программ в текущем срезе`} className="list-panel" action={<div className="search small"><MagnifyingGlass/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Код или название"/></div>}>
      <div className="direction-list">{list.map((d) => <button key={d.code} className={current.code === d.code ? "selected" : ""} onClick={() => setSelected(d.code)}><div><b>{d.code}</b><span>{d.name}</span><small>{d.faculty}</small></div><div className="direction-numbers"><strong>{fmt(d.applications)}</strong><small>человек × направление</small><Badge tone={directionRisk(d)}>{d.budgetFillRate == null ? "—" : `${String(d.budgetFillRate).replace(".", ",")}%`}</Badge></div></button>)}</div>
    </Panel>
    <div className="detail-stack">
      <Panel title={current.name} subtitle={`${current.code} · ${current.faculty}`} action={<><SourcePill type="places"/><Badge tone={risk}>{riskLabel[risk]} риск</Badge></>}>
        <div className="mini-metrics"><div><span>Подали, людей</span><b>{fmt(current.applicants)}</b></div><div><span>Активны в конкурсе</span><b>{fmt(current.activeApplicants)}</b></div><div><span>Медиана балла</span><b>{current.medianScore}</b></div><div><span>Активные согласия</span><b>{fmt(current.activeConsentApplicants)}</b></div></div>
        <div className="plan-duo"><article><span>Бюджет заполнен</span><strong>{current.budgetFilled} / {current.planBudget}</strong><small>{current.budgetFillRate == null ? "—" : `${String(current.budgetFillRate).replace(".", ",")}%`} · с лимитом мест</small></article><article><span>Платный прогноз*</span><strong>{paidForecast} / {current.planPaid}</strong><small>{current.planPaid ? `${pct(paidForecast, current.planPaid)} заполнения` : "нет плана"}</small></article><article><span>Высокобалльники без согласия</span><strong>{fmt(current.highScorerNoConsent)}</strong><small>целевая группа для контакта</small></article></div>
        <div className="recommendation"><Sparkle size={20}/><div><b>Рекомендуемое действие</b><p>{current.budgetFilled < current.planBudget ? `Персонально отработать ${fmt(current.highScorerNoConsent)} высокобалльников: до бюджетного плана не хватает ${current.planBudget - current.budgetFilled} согласий.` : "Бюджетный план закрыт: перевести коммуникацию на удержание и платный контур."}</p></div><button onClick={() => onNavigate("tasks")}>В очередь</button></div>
      </Panel>
      <Panel title="Состав спроса" subtitle="Реальные агрегаты по выбранному направлению" action={<button className="text-btn" onClick={() => onNavigate("intersections")}>Матрица пересечений <CaretRight/></button>}>
        <div className="intersection-list"><div><span><b>Бюджет</b>строки конкурсных заявлений</span><strong>{fmt(current.budgetApplications)}</strong><Progress value={current.budgetApplications / Math.max(current.applicationRows, 1) * 100}/></div><div><span><b>Платное</b>строки конкурсных заявлений</span><strong>{fmt(current.paidApplications)}</strong><Progress value={current.paidApplications / Math.max(current.applicationRows, 1) * 100} tone="green"/></div><div><span><b>Заявления по направлению</b>уникальные люди × направление</span><strong>{fmt(current.applications)}</strong><Progress value={current.activeApplications / Math.max(current.applications, 1) * 100}/></div></div>
      </Panel>
      <p className="demo-footnote">* прогнозный демонстрационный показатель</p>
    </div>
  </div>;
}

function RankingView() {
  const [showConsent, setShowConsent] = useState(false);
  const rows = officialRanking.sampleRows.filter((row) => !showConsent || row.consent);
  return <>
    <div className="ranking-filter-card">
      <label>Категория<select><option>Москва · бакалавриат / специалитет</option></select></label>
      <label>Направление<select><option>{officialRanking.code} · {officialRanking.name}</option></select></label>
      <label>Форма<select><option>{officialRanking.form}</option></select></label>
      <label>Основа<select><option>{officialRanking.basis}</option></select></label>
      <button className="primary"><MagnifyingGlass/> Сформировать</button>
    </div>
    <div className="ranking-context"><SourcePill type="ranking"/><span>Срез 27.07.2026 · публичные данные расширены служебными аналитическими полями</span></div>
    <div className="metrics-grid ranking-metrics">
      <Metric label="Бюджетных мест" value={officialRanking.budgetPlan} detail={`платных мест: ${officialRanking.paidPlan}`} icon={Buildings} source="ranking"/>
      <Metric label="Реальное место рассчитано" value={fmt(officialRanking.realRanked)} detail={`из ${fmt(officialRanking.rows)} строк рейтинга`} icon={ListNumbers} tone="violet" source="ranking"/>
      <Metric label="Согласия" value={fmt(officialRanking.consents)} detail={`${fmt(officialRanking.consentPriorityOne)} с приоритетом 1`} icon={CheckCircle} tone="green" source="ranking"/>
      <Metric label="Высокобалльники 250+" value={fmt(officialRanking.highScore250)} detail={`медиана ${officialRanking.medianScore} · средний ${String(officialRanking.averageScore).replace(".", ",")}`} icon={Target} tone="red" source="ranking" emphasis/>
      <Metric label="Проходной балл 2025" value={officialRanking.previousPassScore} detail="официальный ориентир прошлого года" icon={TrendUp} source="ranking"/>
    </div>
    <div className="grid-2 ranking-layout">
      <Panel title="Рейтинговый список" subtitle={`${fmt(officialRanking.rows)} строк · ${fmt(officialRanking.uniqueCodes)} уникальных кодов`} action={<label className="inline-check"><input type="checkbox" checked={showConsent} onChange={(e) => setShowConsent(e.target.checked)}/> Только с согласием</label>}>
        <div className="table-wrap"><table className="ranking-table"><thead><tr><th>№</th><th>Код</th><th>Балл</th><th>Согласие</th><th>Приоритет</th><th>Реальное место</th><th>Общежитие</th><th>Статус</th></tr></thead><tbody>{rows.map((r) => <tr key={`${r.place}-${r.code}`}><td>{r.place}</td><td><b>{r.code}</b></td><td><b>{r.score}</b></td><td>{r.consent ? <Badge tone="green">Да</Badge> : <Badge>Нет</Badge>}</td><td>{r.priority}</td><td><b>{r.realRank}</b></td><td>{r.dormitory ? "Нужно" : "Нет"}</td><td>{r.status}</td></tr>)}</tbody></table></div>
      </Panel>
      <div className="detail-stack">
        <Panel title="План и квоты" subtitle="Очная форма · бюджетная основа"><div className="quota-grid"><div><span>Общий план</span><b>{officialRanking.budgetPlan}</b></div><div><span>Целевая квота</span><b>{officialRanking.targetQuota}</b></div><div><span>Особая квота</span><b>{officialRanking.specialQuota}</b></div><div><span>Отдельная квота</span><b>{officialRanking.separateQuota}</b></div></div></Panel>
        <Panel title="Статусы конкурса" subtitle="Структура официального рейтинга"><div className="status-bars"><div><span>Участвуют в конкурсе</span><b>{fmt(officialRanking.status.active)}</b><Progress value={officialRanking.status.active / officialRanking.rows * 100} tone="green"/></div><div><span>На рассмотрении</span><b>{fmt(officialRanking.status.review)}</b><Progress value={officialRanking.status.review / officialRanking.rows * 100} tone="orange"/></div><div><span>Ожидают ВИ</span><b>{fmt(officialRanking.status.exams)}</b><Progress value={officialRanking.status.exams / officialRanking.rows * 100}/></div></div></Panel>
      </div>
    </div>
  </>;
}

function ApplicantsView({ selectedId, setSelectedId }) {
  const [query, setQuery] = useState("");
  const visible = applicants.filter((a) => `${a.id} ${a.segment}`.toLowerCase().includes(query.toLowerCase()));
  const person = applicants.find((a) => a.id === selectedId) || visible[0] || applicants[0];
  return <><div className="demo-note"><WarningCircle/><span><b>UX-демонстрация.</b> Карточки обезличены и показывают будущую механику; агрегаты кампании рассчитываются отдельно из выгрузки АИС.</span></div><div className="split-view applicant-view">
    <Panel title="Обезличенная выборка" subtitle="Без ФИО, телефона и электронной почты" className="list-panel" action={<div className="search small"><MagnifyingGlass/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ID или сегмент"/></div>}>
      <div className="people-list">{visible.map((a) => <button key={a.id} className={person.id === a.id ? "selected" : ""} onClick={() => setSelectedId(a.id)}><span className="avatar"><UserFocus/></span><span><b>{a.id}</b><small>{a.score} баллов · {a.applications.length} заявл.</small><em>{a.segment}</em></span><Badge tone={a.risk}>{riskLabel[a.risk]}</Badge></button>)}</div>
    </Panel>
    <div className="detail-stack">
      <Panel title={person.id} subtitle={`${person.region} · ${person.citizenship} · ${person.owner}`} action={<Badge tone="green"><ShieldCheck/> Без ПДн</Badge>}>
        <div className="person-hero"><div><span>Конкурсный балл</span><strong>{person.score}</strong></div><div><span>Заявлений</span><strong>{person.applications.length}</strong></div><div><span>Общежитие</span><strong>{person.dormitory ? "Нужно" : "Не нужно"}</strong></div><div className="next-action"><span>Следующее действие</span><b>{person.nextAction}</b><button><Phone/> Создать задачу</button></div></div>
      </Panel>
      <Panel title="Заявления и места" subtitle="Приоритеты внутри Московского Политеха"><div className="application-cards">{person.applications.sort((a, b) => a.priority - b.priority).map((app) => { const d = directionById(app.directionId); return <article key={app.directionId}><span className="priority">{app.priority}</span><div><b>{d?.code} · {d?.name}</b><small>{app.basis} · {app.status}</small></div><div><strong>{app.rank}</strong><small>место / план</small></div><Badge tone={app.consent ? "green" : app.control ? "neutral" : "high"}>{app.consent ? "Согласие" : app.control ? "Контроль пройден" : "Проверить"}</Badge></article>; })}</div></Panel>
      <Panel title="История касаний" subtitle="Будущий объединенный профиль"><div className="timeline">{person.touchpoints.map((t, i) => <div key={`${t.date}-${i}`}><span className="timeline-icon"><ChatCircleDots/></span><span><b>{t.type} · {t.source}</b><small>{t.date}</small></span><strong>{t.result}</strong></div>)}</div></Panel>
    </div>
  </div></>;
}

function IntersectionsView() {
  const [selected, setSelected] = useState("ivt");
  const max = Math.max(...heatmapDirections.flatMap((a) => heatmapDirections.map((b) => intersectionCount(a, b))));
  return <>
    <div className="info-strip"><ArrowsLeftRight/><span><b>{fmt(campaign.multiDirectionApplicants)} абитуриента</b> подали заявления на 2+ направления; {fmt(campaign.threePlusDirectionApplicants)} — на 3+.</span><SourcePill/></div>
    <div className="grid-2 intersection-grid"><Panel title="Матрица пересечений" subtitle="Нажмите направление, чтобы изменить фокус"><div className="heatmap"><button>Код</button>{heatmapDirections.map((id) => <button key={id} className={selected === id ? "active" : ""} onClick={() => setSelected(id)}>{directionById(id)?.code}</button>)}{heatmapDirections.map((row) => <div className="heat-row" key={row}><button className={selected === row ? "active" : ""} onClick={() => setSelected(row)}>{directionById(row)?.code}</button>{heatmapDirections.map((col) => { const value = intersectionCount(row, col); return <button key={col} title={`${fmt(value)} абитуриентов`} style={{ "--heat": Math.max(.08, value / max) }}>{fmt(value)}</button>; })}</div>)}</div></Panel>
      <Panel title={`Фокус: ${directionById(selected)?.code}`} subtitle="Самые сильные пересечения"><div className="intersection-list large">{intersections.filter((i) => i.a === selected || i.b === selected).slice(0, 8).map((i) => { const other = directionById(i.a === selected ? i.b : i.a); return <button key={`${i.a}-${i.b}`}><span><b>{other?.code}</b>{other?.name}</span><strong>{fmt(i.count)}</strong></button>; })}</div></Panel></div>
    <Panel title="Пересечения интересов в CRM-выборке" subtitle="Отдельный срез 590 контактов; не склеен с заявлениями АИС" action={<SourcePill type="crm"/>}><div className="crm-intersections"><article><b>36</b><span>Информационная безопасность × ИБ автоматизированных систем</span></article><article><b>28</b><span>Информационная безопасность × ИСТ</span></article><article><b>12</b><span>ИБ автоматизированных систем × ИСТ</span></article><article><b>104</b><span>контакта интересуются 2+ направлениями</span></article></div></Panel>
  </>;
}

function CommunicationsView() {
  const [selectedEvent, setSelectedEvent] = useState(crmSummary.events[0].name);
  const event = crmSummary.events.find((e) => e.name === selectedEvent) || crmSummary.events[0];
  return <>
    <div className="join-warning"><WarningCircle weight="fill"/><span><b>Сквозная конверсия пока недоступна.</b> Совпадений ID между CRM и АИС: 0 из {crmSummary.contacts}. Для запуска нужен единый стабильный master_applicant_id.</span><Badge tone="high">требует настройки</Badge></div>
    <div className="metrics-grid crm-metrics">
      <Metric label="Контакты в CRM" value={fmt(crmSummary.contacts)} detail="все ID уникальны" icon={UsersThree} source="crm"/>
      <Metric label="Есть результат звонка" value={fmt(crmSummary.statusKnown)} detail={`${pct(crmSummary.statusKnown, crmSummary.contacts)} выборки`} icon={Phone} tone="violet" source="crm"/>
      <Metric label="Подали документы" value={fmt(crmSummary.submitted)} detail="статус в обезличенной выгрузке" icon={CheckCircle} tone="green" source="crm"/>
      <Metric label="Не дозвонились" value={fmt(crmSummary.noAnswer)} detail={`${fmt(crmSummary.refusals)} отказов`} icon={WarningCircle} tone="red" source="crm"/>
      <Metric label="2+ интереса" value={fmt(crmSummary.multiDirectionInterest)} detail="пересечения внутри CRM" icon={ArrowsLeftRight} source="crm"/>
    </div>
    <div className="grid-2 crm-layout"><Panel title="Мероприятия и формы" subtitle="Фактическая структура CRM-выборки"><div className="crm-event-table">{crmSummary.events.map((e) => <button key={e.name} className={selectedEvent === e.name ? "selected" : ""} onClick={() => setSelectedEvent(e.name)}><span><b>{e.name}</b><small>{e.contacts} контактов</small></span><span><b>{e.submitted}</b><small>документы</small></span><span><b>{e.noAnswer}</b><small>нет ответа</small></span><CaretRight/></button>)}</div></Panel>
      <Panel title={event.name} subtitle="Результаты по выбранному источнику" action={<SourcePill type="crm"/>}><div className="event-hero"><strong>{event.contacts}</strong><span>контактов в выборке</span></div><div className="event-results"><div><span>Подали документы</span><b>{event.submitted}</b><Progress value={event.submitted / event.contacts * 100} tone="green"/></div><div><span>Не дозвонились</span><b>{event.noAnswer}</b><Progress value={event.noAnswer / event.contacts * 100} tone="orange"/></div><div><span>Отказы</span><b>{event.refusals}</b><Progress value={event.refusals / event.contacts * 100} tone="red"/></div><div><span>В работе</span><b>{event.inWork}</b><Progress value={event.inWork / event.contacts * 100}/></div></div></Panel></div>
    <Panel title="Как будет работать персональная коммуникация" subtitle="Демонстрационный сценарий будущей интеграции с Bitrix24"><div className="logic-flow"><span>Сигнал из АИС</span><CaretRight/><span>Единый ID</span><CaretRight/><span>Сегмент и контекст</span><CaretRight/><span>Локальная модель</span><CaretRight/><span>Черновик в Bitrix24</span><CaretRight/><span>Контроль результата</span></div><div className="message-preview"><small>ПРИМЕР ЧЕРНОВИКА · БЕЗ ОТПРАВКИ</small><p>Вы интересовались направлением «Информационные системы и технологии». В вашем заявлении еще не зафиксировано согласие — можем помочь проверить приоритет и документы.</p><span><ShieldCheck/> Текст формируется внутри серверного контура университета</span></div></Panel>
  </>;
}

function TasksView() {
  const [tasks, setTasks] = useState(tasksSeed);
  const move = (id, status) => setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status } : t));
  const columns = [["todo", "К выполнению"], ["progress", "В работе"], ["done", "Готово"]];
  return <div className="kanban">{columns.map(([status, label]) => <section key={status}><header><span>{label}</span><Badge>{tasks.filter((t) => t.status === status).length}</Badge></header>{tasks.filter((t) => t.status === status).map((t) => <article key={t.id}><div><Badge tone={t.priority}>{t.priority === "high" ? "Срочно" : t.priority === "medium" ? "Средний" : "Низкий"}</Badge><small>{t.id}</small></div><h3>{t.title}</h3><button className="applicant-link">{t.applicantId}</button><footer><span><Clock/> {t.due}</span><span>{t.owner}</span></footer>{status !== "done" && <button className="secondary wide" onClick={() => move(t.id, status === "todo" ? "progress" : "done")}>{status === "todo" ? "Взять в работу" : "Завершить"}</button>}</article>)}</section>)}</div>;
}

function AnalyticsView() {
  const [tab, setTab] = useState("dynamic");
  const [dynamicPoint, setDynamicPoint] = useState(actuals.dynamics.length - 1);
  const tabs = [["dynamic", "Динамика"], ["faculties", "Факультеты"], ["segments", "Сегменты"], ["method", "Методика"]];
  return <><div className="subtabs">{tabs.map(([id, label]) => <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>{label}</button>)}</div>
    {tab === "dynamic" && <div className="grid-2"><Panel title="Динамика поданных заявлений" subtitle="Люди и заявления по направлениям · 20.06–25.07"><DynamicsChart data={actuals.dynamics} selected={dynamicPoint} onSelected={setDynamicPoint}/></Panel><Panel title="Заполнение плана" subtitle="Бюджет — расчет по согласиям; платное — демонстрационный прогноз"><div className="fill-forecast"><article><header><span>Бюджет</span><b>{String(actuals.scope.budgetFillRate).replace(".", ",")}%</b></header><Progress value={actuals.scope.budgetFillRate} tone="green"/><small>{fmt(actuals.scope.budgetFilled)} из {fmt(actuals.scope.budgetPlan)} мест</small></article><article><header><span>Платное*</span><b>{demoPaidFillRate.toFixed(1).replace(".", ",")}%</b></header><Progress value={demoPaidFillRate} tone="violet"/><small>{fmt(demoPaidFilled)} из {fmt(actuals.scope.paidPlan)} договоров</small></article><div className="forecast-callout"><TrendUp/><div><b>Прогноз к завершению приема</b><span>Бюджет 96% · платное 82%*</span></div></div></div><p className="demo-footnote">* прогнозный демонстрационный показатель</p></Panel></div>}
    {tab === "faculties" && <Panel title="Сравнение факультетов" subtitle="Фактические агрегаты АИС"><div className="analytics-rows">{actualFaculties.map((f) => { const fill = f.plan ? f.filled / f.plan * 100 : 0; const risk = fill < 70 ? "high" : fill < 90 ? "medium" : "low"; return <div key={f.name}><span><b>{f.name}</b><small>{fmt(f.applications)} заявлений по направлениям</small></span><div><small>Активные согласия</small><b>{fmt(f.consents)}</b><Progress value={f.consents / Math.max(actualFaculties[0].consents, 1) * 100}/></div><div><small>Бюджет заполнен</small><b>{fill.toFixed(0)}%</b><Progress value={fill} tone={risk === "high" ? "red" : risk === "medium" ? "orange" : "green"}/></div><Badge tone={risk}>{riskLabel[risk]}</Badge></div>; })}</div></Panel>}
    {tab === "segments" && <div className="segment-grid">{[["Высокобалльники 85+", actuals.scope.highScorerApplicants, "high"], ["Активны в конкурсе", actuals.scope.activeUniqueApplicants, "low"], ["Подали согласие", actuals.scope.consentApplicants, "low"], ["Активные согласия", actuals.scope.activeConsentApplicants, "medium"], ["Заявления по направлениям", actuals.scope.directionApplications, "medium"], ["Бюджетные строки", actuals.scope.budgetApplicationRows, "medium"]].map(([n, v, r]) => <article key={n}><Badge tone={r}>{riskLabel[r]}</Badge><strong>{fmt(v)}</strong><h3>{n}</h3><button>Открыть сегмент <CaretRight/></button></article>)}</div>}
    {tab === "method" && <Panel title="Словарь показателей" subtitle="Чтобы цифры читались одинаково"><div className="method-grid"><article><b>Подали заявление, людей</b><p>Уникальные номера личных дел в срезе «бакалавриат · очная форма».</p><SourcePill/></article><article><b>Заявления по направлениям</b><p>Уникальная пара «номер личного дела × направление». Один человек может учитываться в нескольких направлениях.</p><SourcePill/></article><article><b>Высокобалльник 85+</b><p>Математика 85+ и одновременно физика либо информатика 85+.</p><SourcePill/></article><article><b>Заполнение бюджета</b><p>Одно лучшее активное согласие на человека, не выше плана каждого направления.</p><SourcePill type="places"/></article></div></Panel>}
  </>;
}

function ReportsView({ toast }) {
  return <><div className="info-strip"><FileText/><span><b>Отчеты используют текущий срез и сохраняют происхождение каждой цифры.</b></span><button className="primary" onClick={() => toast("Отчет поставлен в очередь")}>Сформировать отчет</button></div><div className="report-grid">{reportTemplates.map((r) => <article key={r.id}><span className="file-icon"><FileText/></span><div><Badge>{r.format}</Badge><h3>{r.name}</h3><p>{r.description}</p><small>Последний: {r.last}</small></div><button className="icon-btn" onClick={() => toast(`Подготовка: ${r.name}`)}><DownloadSimple/></button></article>)}</div><Panel title="История выгрузок" subtitle="Последние сформированные документы"><div className="simple-table">{reportTemplates.slice(0, 3).map((r, i) => <div key={r.id}><span><FileText/><b>{r.name}</b></span><span>{r.last}</span><Badge tone={i === 0 ? "green" : "neutral"}>Готов</Badge><button onClick={() => toast("Файл подготовлен для скачивания")}><DownloadSimple/> Скачать</button></div>)}</div></Panel></>;
}

function QualityView() {
  return <><div className="metrics-grid quality-metrics"><Metric label="Строк исходной АИС" value={fmt(actuals.allExport.applicationRows)} detail="полная обезличенная выгрузка" icon={Database}/><Metric label="Строк в текущем срезе" value={fmt(actuals.scope.applicationRows)} detail="бакалавриат · очная форма" icon={FileText}/><Metric label="Уникальных людей" value={fmt(actuals.scope.uniqueApplicants)} detail="ключ извлечен из номера личного дела" icon={UsersThree} tone="green"/><Metric label="Заявлений по направлениям" value={fmt(actuals.scope.directionApplications)} detail="уникальные человек × направление" icon={ArrowsLeftRight} tone="violet"/></div>
    <Panel title="Источники данных" subtitle="Что подтверждено, а что требует API-обследования"><div className="source-table"><div className="source-head"><span>Источник</span><span>Роль</span><span>Записей</span><span>Свежесть</span><span>Качество</span><span>Подключение</span></div>{dataSources.map((s) => <div key={s.id}><span><i className={`source-dot ${s.status}`}/><b>{s.name}</b></span><span>{s.role}</span><span>{s.records}</span><span>{s.freshness}</span><span><b>{s.quality ? `${s.quality}%` : "—"}</b><Progress value={s.quality} tone={s.quality > 85 ? "green" : s.quality ? "orange" : "red"}/></span><Badge tone={s.status === "confirmed" ? "green" : s.status === "partial" ? "medium" : "neutral"}>{s.method}</Badge></div>)}</div></Panel>
    <div className="grid-2"><Panel title="Правила безопасной работы" subtitle="Целевой контур университета"><div className="security-list"><span><ShieldCheck/><div><b>Данные не покидают периметр</b><small>API, хранилище и локальная модель работают на сервере университета.</small></div></span><span><UserFocus/><div><b>Доступ по ролям</b><small>Руководители видят агрегаты, операторы — только назначенные профили.</small></div></span><span><Database/><div><b>Происхождение показателя</b><small>Источник, дата среза и метод расчета хранятся для каждой цифры.</small></div></span></div></Panel><Panel title="Контроль методики" subtitle="Что фиксируем перед подключением API"><ol className="next-steps"><li><b>Ключ человека</b><span>Используем номер личного дела: технический anon_applicant_id уникален для строки.</span></li><li><b>План бакалавриата</b><span>Сумма очных профилей по приказу: 2 058 бюджетных и 3 200 платных мест.</span></li><li><b>Прогнозный слой</b><span>Договоры, оплаты и будущая динамика помечаются звездочкой до подключения источника.</span></li></ol></Panel></div>
  </>;
}

function SettingsView({ toast }) {
  const [auto, setAuto] = useState(true); const [ai, setAi] = useState(true);
  return <div className="settings-grid"><Panel title="Обновление данных" subtitle="Будущая серверная конфигурация"><label className="setting-row"><span><b>Автоматическая синхронизация</b><small>Обновлять источники по расписанию</small></span><button className={`toggle ${auto ? "on" : ""}`} onClick={() => setAuto(!auto)}><i/></button></label><label className="field"><span>Частота обновления</span><select><option>Каждые 15 минут</option><option>Каждый час</option></select></label><label className="field"><span>Часовой пояс</span><select><option>Europe/Moscow · UTC+3</option></select></label></Panel><Panel title="Пороговые сигналы" subtitle="Настройка управленческого фокуса"><label className="field"><span>Высокий балл без согласия</span><input type="number" defaultValue="250"/></label><label className="field"><span>Ошибки контроля, %</span><input type="number" defaultValue="15"/></label><label className="field"><span>Нет движения, дней</span><input type="number" defaultValue="7"/></label></Panel><Panel title="Локальная модель" subtitle="Персонализация внутри университета"><label className="setting-row"><span><b>AI-рекомендации</b><small>Следующий шаг и черновик сообщения</small></span><button className={`toggle ${ai ? "on" : ""}`} onClick={() => setAi(!ai)}><i/></button></label><div className="server-card"><span className="live-dot"/><div><b>Демонстрационный режим</b><small>Реальный endpoint будет доступен только из внутренней сети</small></div></div></Panel><Panel title="Доступ и роли" subtitle="Будущие политики"><div className="role-list"><div><span><b>Руководитель</b><small>Все агрегаты и отчеты</small></span><Badge tone="green">Активна</Badge></div><div><span><b>Факультет</b><small>Свои направления и задачи</small></span><Badge>Шаблон</Badge></div><div><span><b>Оператор</b><small>Назначенные профили без экспорта</small></span><Badge>Шаблон</Badge></div></div></Panel><button className="primary settings-save" onClick={() => toast("Настройки сохранены")}>Сохранить настройки</button></div>;
}

export function App() {
  const [active, setActive] = useState("overview");
  const [faculty, setFaculty] = useState("all");
  const [basis, setBasis] = useState("all");
  const [selectedApplicant, setSelectedApplicant] = useState(applicants[0].id);
  const [toast, setToast] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = (id) => { setActive(id); setMenuOpen(false); };
  const showToast = (message) => { setToast(message); window.clearTimeout(showToast.timer); showToast.timer = window.setTimeout(() => setToast(""), 2400); };
  const [title, subtitle] = titles[active];
  const content = useMemo(() => ({
    overview: <Overview onNavigate={setActive} facultyFilter={faculty}/>,
    directions: <DirectionsView facultyFilter={faculty} onNavigate={setActive}/>,
    ranking: <RankingView/>,
    applicants: <ApplicantsView selectedId={selectedApplicant} setSelectedId={setSelectedApplicant}/>,
    intersections: <IntersectionsView/>, communications: <CommunicationsView/>, tasks: <TasksView/>, analytics: <AnalyticsView/>,
    reports: <ReportsView toast={showToast}/>, quality: <QualityView/>, settings: <SettingsView toast={showToast}/>,
  }), [active, faculty, selectedApplicant]);
  return <div className={`app-shell ${menuOpen ? "menu-open" : ""}`}><button className="mobile-menu-toggle" aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X/> : <List/>}</button><button className="mobile-menu-backdrop" aria-label="Закрыть меню" onClick={() => setMenuOpen(false)}/><aside className="sidebar"><div className="brand"><img src={`${import.meta.env.BASE_URL}assets/polytech_logo_main_RGB_RUS.png`} alt="Московский Политех"/></div><div className="campaign-mark"><span>ПК</span><div><b>Приемная кампания 360</b><small>2026 · служебный контур</small></div></div><nav>{nav.map(([id, label, Icon]) => <button key={id} className={active === id ? "active" : ""} onClick={() => navigate(id)}><Icon size={20} weight={active === id ? "fill" : "regular"}/><span>{label}</span>{id === "tasks" && <em>6</em>}</button>)}</nav><div className="sidebar-bottom"><div className="secure"><ShieldCheck/><span><b>Безопасный контур</b><small>Обезличенные данные</small></span></div></div></aside>
    <main className="workspace"><header className="topbar"><div><p>Приемная кампания 2026</p><h1>{title}</h1><span>{subtitle}</span></div><div className="top-actions"><button className="icon-btn" aria-label="Уведомления"><Bell size={20}/><i/></button><button className="secondary" onClick={() => showToast("Срез подготовлен к экспорту")}><DownloadSimple/> Экспорт</button><button className="primary" onClick={() => navigate("tasks")}><Target/> Действия <b>6</b></button></div></header><GlobalFilters faculty={faculty} setFaculty={setFaculty} basis={basis} setBasis={setBasis}/><div className="page-content" key={active}>{content[active]}</div></main>{toast && <div className="toast"><CheckCircle weight="fill"/> {toast}</div>}</div>;
}
