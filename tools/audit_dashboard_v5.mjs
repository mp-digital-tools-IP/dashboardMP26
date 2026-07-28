import { chromium } from "file:///C:/Users/%D0%AF%D1%80%D0%BE%D1%81%D0%BB%D0%B0%D0%B2%D0%BA%D0%B0/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";
import fs from "node:fs/promises";
import path from "node:path";

const target = process.env.DASHBOARD_V5_URL || "http://127.0.0.1:4175/";
const auditDir = path.resolve("outputs/dashboard-v5/audit");
await fs.mkdir(auditDir, { recursive: true });
const report = { target, checkedAt: new Date().toISOString(), checks: [], consoleErrors: [], failedResources: [] };
const check = (name, pass, detail = "") => report.checks.push({ name, pass: Boolean(pass), detail });
const browser = await chromium.launch({ headless: true, executablePath: "C:/Users/Ярославка/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe" });

const desktop = await browser.newContext({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 1, locale: "ru-RU" });
const page = await desktop.newPage();
page.on("console", (message) => { if (message.type() === "error") report.consoleErrors.push(message.text()); });
page.on("pageerror", (error) => report.consoleErrors.push(error.message));
page.on("response", (response) => { if (response.status() >= 400) report.failedResources.push({ status: response.status(), url: response.url() }); });
await page.goto(target, { waitUntil: "networkidle" });
await page.locator(".metrics-eight").waitFor();

check("Заголовок кампании", (await page.locator("header.topbar p").textContent()).includes("2026"));
check("Восемь KPI в порядке воронки", await page.locator(".metrics-eight .metric").count() === 8, await page.locator(".metrics-eight .metric").allTextContents());
check("Согласия отображаются фактом", Number((await page.locator(".metric").filter({ hasText: "Согласия, факт" }).locator("strong").textContent()).replace(/\s/g, "")) > 0);
check("Высокобалльники показывают всего и согласие", (await page.locator(".metric").filter({ hasText: "Высокобалльники 85+" }).locator("strong").textContent()).includes("/"));
check("Бюджетный набор имеет факт и план", (await page.locator(".metric").filter({ hasText: "Бюджетный набор заполнен" }).innerText()).includes("/"));
check("Конверсия и платный набор отмечены моделью", await page.locator(".metric .source-model").count() >= 3, await page.locator(".metric .source-model").count());
check("Управленческая таблица показывает московские подразделения", await page.locator(".situation-row:not(.situation-head)").count() >= 10, await page.locator(".situation-row:not(.situation-head)").count());
check("Филиалы отсутствуют в глобальном фильтре", !(await page.locator(".filters select").nth(3).innerText()).toLowerCase().includes("филиал"));
check("В сводке есть высокобалльники и действия", await page.getByText("85+ / согласие", { exact: true }).count() === 1 && await page.locator(".situation-action").count() >= 10);
check("Сравнение 2025 и денежная модель подписаны", await page.getByText("Модель 2025", { exact: false }).count() >= 2 && await page.getByText("Потенциальная сумма", { exact: true }).count() === 1 && (await page.getByText("Средняя цена года", { exact: true }).locator("..").innerText()).includes("310"));
check("Нет горизонтальной прокрутки страницы 1440", await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, width: innerWidth })));
const desktopFonts = await page.evaluate(() => {
  const px = (selector) => parseFloat(getComputedStyle(document.querySelector(selector)).fontSize);
  return { body: px("body"), nav: px(".sidebar nav button"), panel: px(".panel-head h2"), metric: px(".metric strong"), metricLabel: px(".metric p"), source: px(".source") };
});
check("Шрифты десктопа соответствуют минимумам", desktopFonts.body >= 12 && desktopFonts.nav >= 14 && desktopFonts.panel >= 17 && desktopFonts.metric >= 26 && desktopFonts.metricLabel >= 12 && desktopFonts.source >= 9, desktopFonts);
await page.screenshot({ path: path.join(auditDir, "desktop-1440-overview.png"), fullPage: true });

const selects = page.locator(".filters select");
check("Пять глобальных фильтров", await selects.count() === 5, await selects.count());
const beforeSlider = await page.locator(".chart-values").first().innerText();
const slider = page.locator('input[type="range"]').first();
await slider.fill(String(Math.max(0, Math.floor(Number(await slider.getAttribute("max")) / 2))));
check("Ползунок даты обновляет значения", beforeSlider !== await page.locator(".chart-values").first().innerText());

await page.getByRole("button", { name: "Направления", exact: true }).click();
await page.locator(".program-tree").waitFor();
check("Иерархия программ доступна", await page.locator(".program-tree details").count() > 0);
check("В программе видны реальные согласия и 85+", (await page.locator(".detail-metrics").innerText()).includes("Согласия, факт") && (await page.locator(".detail-metrics").innerText()).includes("Высокобалльники"));
await page.screenshot({ path: path.join(auditDir, "desktop-1440-directions.png"), fullPage: true });

await page.getByRole("button", { name: "Рейтинг", exact: true }).click();
check("Рейтинг содержит колонку согласия", await page.getByRole("columnheader", { name: "Согласие", exact: true }).count() === 1);

await page.getByRole("button", { name: "Абитуриенты", exact: true }).click();
await page.locator(".applicant-filters").waitFor();
check("Фильтры абитуриентов доступны", await page.locator(".applicant-filters select").count() === 3 && await page.locator(".applicant-filters input").count() === 3);
check("Касания смоделированы отдельно от фактов АИС", await page.locator(".exam-grid article").count() > 0 && await page.locator(".timeline>div").count() > 0 && (await page.locator(".timeline").innerText()).includes("Модель CRM") && (await page.locator(".person-hero").innerText()).includes("Касаний, модель"));
check("Согласие привязано к конкретной программе", await page.getByText("Согласие на зачисление", { exact: true }).count() === 1 && await page.getByText(/Согласие подано сюда|В выбранном срезе согласие не подано/).count() > 0);

await page.getByRole("button", { name: "Пересечения", exact: true }).click();
check("Матрица пересечений восстановлена", await page.locator(".heatmap-v5").count() === 1 && await page.locator(".heat-row-v5").count() > 0);

await page.getByRole("button", { name: "Коммуникации", exact: true }).click();
await page.getByRole("button", { name: /Выставка «Образование и карьера»/ }).click();
check("Коммуникации имеют список и подробности", await page.locator(".crm-event-table button").count() === 5 && await page.locator(".event-results>div").count() === 4 && (await page.locator(".event-hero").innerText()).includes("400") && (await page.locator(".event-results").innerText()).includes("57") && (await page.locator(".event-results").innerText()).includes("25"));

await page.getByRole("button", { name: "Отчёты", exact: true }).click();
check("Отчёты содержат сводку 3–3–3 и историю", await page.locator(".leadership-grid article").count() === 3 && await page.locator(".export-history>div").count() === 3);

await page.getByRole("button", { name: "Качество данных", exact: true }).click();
check("Качество данных содержит источники и методику", await page.locator(".source-table-v5>div").count() >= 4 && await page.locator(".next-steps-v5 li").count() >= 5);

await page.getByRole("button", { name: "Настройки", exact: true }).click();
check("Настройки восстановлены в расширенном виде", await page.locator(".settings-grid-rich .panel").count() === 4);

await page.getByRole("button", { name: /^Задачи/ }).click();
await page.getByRole("button", { name: "Добавить задачу", exact: true }).click();
await page.locator(".modal input").first().fill("UX-проверка V5");
await page.getByRole("button", { name: "Добавить в очередь", exact: true }).click();
check("Задача создаётся в канбане", await page.getByText("UX-проверка V5", { exact: true }).count() === 1);
await page.waitForFunction(() => localStorage.getItem("dashboard-v5-tasks")?.includes("UX-проверка V5"));
await page.reload({ waitUntil: "networkidle" });
await page.getByRole("button", { name: /^Задачи/ }).click();
check("Задача сохраняется после перезагрузки", await page.getByText("UX-проверка V5", { exact: true }).count() === 1);
await page.evaluate(() => localStorage.removeItem("dashboard-v5-tasks"));
await desktop.close();

const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, locale: "ru-RU", hasTouch: true });
const phone = await mobile.newPage();
phone.on("console", (message) => { if (message.type() === "error") report.consoleErrors.push("mobile: " + message.text()); });
phone.on("pageerror", (error) => report.consoleErrors.push("mobile: " + error.message));
await phone.goto(target, { waitUntil: "networkidle" });
await phone.locator(".metrics-eight").waitFor();
const mobileOverflow = await phone.evaluate(() => ({ scroll: document.documentElement.scrollWidth, width: innerWidth, offenders: [...document.querySelectorAll("body *")].map((element) => { const r = element.getBoundingClientRect(); return { tag: element.tagName, className: String(element.className || "").slice(0, 100), left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width), scrollWidth: element.scrollWidth, clientWidth: element.clientWidth }; }).filter((item) => item.right > innerWidth + 1 || item.left < -1).sort((a, b) => b.right - a.right).slice(0, 12) }));
check("Нет горизонтальной прокрутки всей страницы 390", mobileOverflow.scroll <= mobileOverflow.width + 1, mobileOverflow);
const kpiScroll = await phone.locator(".metrics-eight").evaluate((element) => ({ scrollWidth: element.scrollWidth, clientWidth: element.clientWidth, cards: element.querySelectorAll(".metric").length }));
check("Восемь KPI перелистываются горизонтально", kpiScroll.cards === 8 && kpiScroll.scrollWidth > kpiScroll.clientWidth, kpiScroll);
const situationBounds = await phone.locator(".situation-row:not(.situation-head)").first().evaluate((element) => { const r = element.getBoundingClientRect(); return { left: r.left, right: r.right, width: r.width }; });
check("Карточка факультета помещается на мобильном", situationBounds.left >= 0 && situationBounds.right <= 390, situationBounds);
check("Бургер-меню имеет крупную кнопку", await phone.locator(".menu-toggle").evaluate((element) => { const r = element.getBoundingClientRect(); return r.width >= 44 && r.height >= 44; }));
await phone.screenshot({ path: path.join(auditDir, "mobile-390-overview.png"), fullPage: true });
await phone.locator(".menu-toggle").click();
await phone.getByRole("button", { name: "Абитуриенты", exact: true }).click();
await phone.locator(".applicant-filters").waitFor();
check("Мобильные фильтры абитуриентов помещаются", await phone.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
await phone.screenshot({ path: path.join(auditDir, "mobile-390-applicants.png"), fullPage: true });
await mobile.close();

check("Нет ошибок JavaScript в консоли", report.consoleErrors.length === 0, report.consoleErrors);
check("Нет неуспешных загрузок ресурсов", report.failedResources.length === 0, report.failedResources);
report.summary = { passed: report.checks.filter((item) => item.pass).length, failed: report.checks.filter((item) => !item.pass).length };
await fs.writeFile(path.join(auditDir, "ux-ui-audit.json"), JSON.stringify(report, null, 2), "utf8");
console.log(JSON.stringify(report, null, 2));
await browser.close();
