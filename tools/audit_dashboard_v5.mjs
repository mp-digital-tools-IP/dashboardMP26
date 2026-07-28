import { chromium } from "file:///C:/Users/%D0%AF%D1%80%D0%BE%D1%81%D0%BB%D0%B0%D0%B2%D0%BA%D0%B0/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";
import fs from "node:fs/promises";
import path from "node:path";

const target = "http://127.0.0.1:4175/";
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
await page.locator(".metrics-seven").waitFor();

check("Заголовок кампании", (await page.locator("header.topbar p").textContent()).includes("2026"));
check("Семь верхних KPI", await page.locator(".metrics-seven .metric").count() === 7, await page.locator(".metrics-seven .metric").count());
check("Согласия явно равны нулю", await page.locator(".metric").filter({ hasText: "Согласия, факт" }).getByText("0", { exact: true }).count() === 1);
check("Этап согласий обозначен как не начавшийся", (await page.locator(".consent-stage").first().innerText()).includes("ещё не начался"));
check("Управленческая таблица показывает факультеты", await page.locator(".situation-row:not(.situation-head)").count() >= 10, await page.locator(".situation-row:not(.situation-head)").count());
check("В таблице есть риск и управленческие действия", await page.locator(".situation-row:not(.situation-head) .badge").count() >= 10 && await page.locator(".situation-action").count() >= 10);
check("Сравнение 2025 подписано как модель", await page.getByText("Модель 2025", { exact: false }).count() >= 2);
check("Нет горизонтальной прокрутки страницы 1440", await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, width: innerWidth })));
const desktopFonts = await page.evaluate(() => {
  const px = (selector) => parseFloat(getComputedStyle(document.querySelector(selector)).fontSize);
  return { body: px("body"), nav: px(".sidebar nav button"), panel: px(".panel-head h2"), metric: px(".metric strong"), metricLabel: px(".metric p"), source: px(".source") };
});
check("Шрифты десктопа соответствуют минимумам", desktopFonts.body >= 12 && desktopFonts.nav >= 14 && desktopFonts.panel >= 17 && desktopFonts.metric >= 26 && desktopFonts.metricLabel >= 12 && desktopFonts.source >= 9, desktopFonts);
await page.screenshot({ path: path.join(auditDir, "desktop-1440-overview.png"), fullPage: true });

const selects = page.locator(".filters select");
check("Пять глобальных фильтров", await selects.count() === 5, await selects.count());
await selects.nth(3).selectOption({ index: 1 });
check("Фильтр подразделения меняет срез", (await selects.nth(3).inputValue()) !== "all", await selects.nth(3).inputValue());
const beforeSlider = await page.locator(".chart-values").first().innerText();
const slider = page.locator('input[type="range"]').first();
const max = Number(await slider.getAttribute("max"));
await slider.fill(String(Math.max(0, Math.floor(max / 2))));
const afterSlider = await page.locator(".chart-values").first().innerText();
check("Ползунок даты обновляет значения", beforeSlider !== afterSlider, { before: beforeSlider.slice(0, 80), after: afterSlider.slice(0, 80) });

await page.getByRole("button", { name: "Направления", exact: true }).click();
await page.locator(".program-tree").waitFor();
check("Иерархия направлений доступна", await page.locator(".program-tree details").count() > 0, await page.locator(".program-tree details").count());
await page.screenshot({ path: path.join(auditDir, "desktop-1440-directions.png"), fullPage: true });

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
await page.reload({ waitUntil: "networkidle" });

await page.getByRole("button", { name: "Обзор", exact: true }).click();
await page.keyboard.press("Tab");
const focusInfo = await page.evaluate(() => {
  const element = document.activeElement;
  const style = getComputedStyle(element);
  return { tag: element?.tagName, label: element?.getAttribute("aria-label") || element?.textContent?.trim().slice(0, 40), outline: style.outlineStyle, width: element?.getBoundingClientRect().width, height: element?.getBoundingClientRect().height };
});
check("Клавиатурный фокус видим", focusInfo.tag === "BUTTON" && focusInfo.outline !== "none", focusInfo);
await desktop.close();

const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, locale: "ru-RU", isMobile: true, hasTouch: true });
const phone = await mobile.newPage();
phone.on("console", (message) => { if (message.type() === "error") report.consoleErrors.push("mobile: " + message.text()); });
phone.on("pageerror", (error) => report.consoleErrors.push("mobile: " + error.message));
await phone.goto(target, { waitUntil: "networkidle" });
await phone.locator(".metrics-seven").waitFor();
check("Нет горизонтальной прокрутки всей страницы 390", await phone.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), await phone.evaluate(() => ({ scroll: document.documentElement.scrollWidth, width: innerWidth })));
const kpiScroll = await phone.locator(".metrics-seven").evaluate((element) => ({ scrollWidth: element.scrollWidth, clientWidth: element.clientWidth, cards: element.querySelectorAll(".metric").length }));
check("KPI перелистываются горизонтально", kpiScroll.cards === 7 && kpiScroll.scrollWidth > kpiScroll.clientWidth, kpiScroll);
const situationBounds = await phone.locator(".situation-row:not(.situation-head)").first().evaluate((element) => { const r = element.getBoundingClientRect(); return { left: r.left, right: r.right, width: r.width }; });
check("Карточка бюджетного набора помещается на мобильном", situationBounds.left >= 0 && situationBounds.right <= 390, situationBounds);
check("Бургер-меню имеет крупную кнопку", await phone.locator(".menu-toggle").evaluate((element) => { const r = element.getBoundingClientRect(); return r.width >= 44 && r.height >= 44; }));
await phone.screenshot({ path: path.join(auditDir, "mobile-390-overview.png"), fullPage: true });
await phone.locator(".menu-toggle").click();
await phone.waitForTimeout(350);
check("Бургер открывает навигацию", await phone.locator(".sidebar").evaluate((element) => getComputedStyle(element).transform === "none" || element.getBoundingClientRect().left >= 0));
await phone.getByRole("button", { name: "Направления", exact: true }).click();
await phone.waitForTimeout(350);
check("После перехода меню закрывается", await phone.locator(".menu-toggle").getAttribute("aria-expanded") === "false");
await phone.screenshot({ path: path.join(auditDir, "mobile-390-directions.png"), fullPage: true });
const smallButtons = await phone.locator("button:visible").evaluateAll((elements) => elements.map((element) => { const r = element.getBoundingClientRect(); return { text: element.getAttribute("aria-label") || element.textContent.trim().slice(0, 35), width: Math.round(r.width), height: Math.round(r.height) }; }).filter((item) => item.width < 40 || item.height < 40));
check("Ключевые мобильные кнопки не меньше 40 px", smallButtons.length === 0, smallButtons.slice(0, 12));
await mobile.close();

check("Нет ошибок JavaScript в консоли", report.consoleErrors.length === 0, report.consoleErrors);
check("Нет неуспешных загрузок ресурсов", report.failedResources.length === 0, report.failedResources);
report.summary = { passed: report.checks.filter((item) => item.pass).length, failed: report.checks.filter((item) => !item.pass).length };
await fs.writeFile(path.join(auditDir, "ux-ui-audit.json"), JSON.stringify(report, null, 2), "utf8");
console.log(JSON.stringify(report, null, 2));
await browser.close();
