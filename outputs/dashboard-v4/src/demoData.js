export const campaign = {
  name: "Приемная кампания 360",
  year: 2026,
  updatedAt: "27.07.2026, 03:58",
  mode: "Демонстрационный контур",
  applications: 175970,
  applicants: 61306,
  multiDirectionApplicants: 47206,
  threePlusDirectionApplicants: 28523,
  consents: 14239,
  onReview: 33100,
  examPending: 3993,
  controlFailed: 29237,
  activeContest: 137895,
  budgetApplications: 126493,
  paidApplications: 49477,
  dormitoryNeed: 76738,
  highScoreNoConsent: 19752,
  averageApplicationsPerApplicant: 2.87,
  fullTimeBudgetPlan: 2373,
  fullTimePaidPlan: 3665,
  allFormsBudgetPlan: 2854,
  allFormsPaidPlan: 5369,
};

export const metricSources = {
  admissions: "Пробуем отклонить_anonymized.xlsx · АИС «Прием», 175 970 строк; текущий срез: бакалавриат, очная форма",
  places: "Приложение 2.4 к Правилам приема 2026/2027, приказ № 17-ОД от 19.01.2026",
  ranking: "Публичный рейтинг абитуриентов Московского Политеха, срез 27.07.2026",
  crm: "Обезличенная выгрузка Bitrix24 по ФИТ, 590 контактов",
};

export const officialRanking = {
  code: "09.03.02.01",
  name: "Информационные системы и технологии",
  form: "Очная",
  basis: "Бюджетная",
  budgetPlan: 220,
  paidPlan: 200,
  targetQuota: 5,
  specialQuota: 22,
  separateQuota: 22,
  previousPassScore: 243,
  rows: 5134,
  uniqueCodes: 4818,
  realRanked: 169,
  consents: 548,
  priorityOne: 1070,
  consentPriorityOne: 158,
  highScore250: 1857,
  dormitoryNeeded: 3025,
  medianScore: 241,
  averageScore: 237.3,
  status: { active: 4884, review: 243, exams: 7 },
  sampleRows: [
    { place: 1, code: "•••8960", score: 256, consent: false, priority: 1, realRank: "—", dormitory: false, status: "Участвует в конкурсе" },
    { place: 2, code: "•••7440", score: 225, consent: true, priority: 1, realRank: 1, dormitory: false, status: "Участвует в конкурсе" },
    { place: 3, code: "•••7522", score: 220, consent: true, priority: 1, realRank: "—", dormitory: true, status: "Участвует в конкурсе" },
    { place: 4, code: "•••4341", score: 209, consent: false, priority: 1, realRank: "—", dormitory: false, status: "Участвует в конкурсе" },
    { place: 5, code: "•••0532", score: 197, consent: true, priority: 1, realRank: 2, dormitory: true, status: "Участвует в конкурсе" },
    { place: 6, code: "•••5428", score: 175, consent: false, priority: 1, realRank: "—", dormitory: false, status: "На рассмотрении" },
    { place: 7, code: "•••7617", score: 296, consent: false, priority: 2, realRank: "—", dormitory: false, status: "Участвует в конкурсе" },
    { place: 8, code: "•••2010", score: 287, consent: false, priority: 2, realRank: "—", dormitory: false, status: "Участвует в конкурсе" },
  ],
};

export const crmSummary = {
  scope: "ФИТ · пример выгрузки",
  contacts: 590,
  processed: 217,
  qualityLeads: 214,
  unprocessed: 111,
  inStageWork: 48,
  statusKnown: 333,
  submitted: 58,
  noAnswer: 160,
  refusals: 70,
  statusInWork: 19,
  duplicates: 5,
  multiDirectionInterest: 104,
  joinMatched: 0,
  piiRiskRows: 4,
  events: [
    { name: "День открытых дверей", contacts: 496, submitted: 54, noAnswer: 124, refusals: 51, inWork: 18 },
    { name: "Профориентационные мероприятия", contacts: 43, submitted: 0, noAnswer: 13, refusals: 6, inWork: 0 },
    { name: "Другие CRM-формы", contacts: 26, submitted: 4, noAnswer: 11, refusals: 9, inWork: 1 },
    { name: "Выставка «Образование и карьера»", contacts: 18, submitted: 0, noAnswer: 9, refusals: 3, inWork: 0 },
    { name: "Другие выставки", contacts: 7, submitted: 0, noAnswer: 3, refusals: 1, inWork: 0 },
  ],
};

export const faculties = [
  { id: "fit", name: "Факультет информационных технологий", short: "ФИТ", applications: 73922, applicants: 44254, consents: 5403, controlFailed: 9811, risk: "medium" },
  { id: "fm", name: "Факультет машиностроения", short: "ФМ", applications: 25240, applicants: 21030, consents: 1938, controlFailed: 3334, risk: "medium" },
  { id: "tf", name: "Транспортный факультет", short: "ТФ", applications: 16177, applicants: 14351, consents: 1347, controlFailed: 2094, risk: "low" },
  { id: "fdr", name: "Передовая инженерная школа FDR", short: "FDR", applications: 15264, applicants: 13620, consents: 910, controlFailed: 1400, risk: "medium" },
  { id: "feu", name: "Факультет экономики и управления", short: "ФЭУ", applications: 12186, applicants: 11106, consents: 1112, controlFailed: 4121, risk: "high" },
  { id: "fugh", name: "Факультет урбанистики и городского хозяйства", short: "ФУГХ", applications: 7347, applicants: 6977, consents: 386, controlFailed: 1370, risk: "high" },
  { id: "pf", name: "Полиграфический факультет", short: "ПФ", applications: 4137, applicants: 4011, consents: 405, controlFailed: 518, risk: "low" },
  { id: "fhtb", name: "Факультет химической технологии и биотехнологии", short: "ФХТБ", applications: 2839, applicants: 2776, consents: 212, controlFailed: 556, risk: "medium" },
  { id: "izhi", name: "Институт издательского дела и журналистики", short: "ИИДЖ", applications: 2508, applicants: 2464, consents: 383, controlFailed: 829, risk: "medium" },
  { id: "favorsky", name: "Институт графики и искусства книги им. В. А. Фаворского", short: "ИГИК", applications: 1731, applicants: 1716, consents: 342, controlFailed: 1059, risk: "high" },
];

export const directions = [
  { id: "ivt", code: "09.03.01", name: "Информатика и вычислительная техника", facultyId: "fit", applications: 41251, applicants: 30566, consents: 3085, consentRate: 7.48, medianScore: 230, controlFailed: 5413, planBudget: 391, planPaid: 519, risk: "medium", action: "Вернуть сильных кандидатов без согласия" },
  { id: "pi", code: "09.03.03", name: "Прикладная информатика", facultyId: "fit", applications: 21981, applicants: 18694, consents: 1642, consentRate: 7.47, medianScore: 234, controlFailed: 2596, planBudget: 210, planPaid: 310, risk: "medium", action: "Сегмент 250+ с приоритетом 1–3" },
  { id: "ist", code: "09.03.02", name: "Информационные системы и технологии", facultyId: "fit", applications: 15215, applicants: 13566, consents: 1221, consentRate: 8.02, medianScore: 229, controlFailed: 2388, planBudget: 250, planPaid: 250, risk: "medium", action: "Проверить заявления на рассмотрении" },
  { id: "transport", code: "23.05.01", name: "Наземные транспортно-технологические средства", facultyId: "tf", applications: 8027, applicants: 7585, consents: 906, consentRate: 11.29, medianScore: 207, controlFailed: 978, planBudget: 159, planPaid: 301, risk: "low", action: "Сопровождать приоритет 1" },
  { id: "machinery", code: "15.03.01", name: "Машиностроение", facultyId: "fm", applications: 7896, applicants: 7435, consents: 699, consentRate: 8.85, medianScore: 210, controlFailed: 1121, planBudget: 115, planPaid: 125, risk: "medium", action: "Закрыть контроль по документам" },
  { id: "infosec", code: "10.03.01", name: "Информационная безопасность", facultyId: "fit", applications: 6434, applicants: 6128, consents: 395, consentRate: 6.14, medianScore: 230, controlFailed: 844, planBudget: 99, planPaid: 61, risk: "high", action: "Позвонить высокобалльникам" },
  { id: "energy", code: "13.03.02", name: "Электроэнергетика и электротехника", facultyId: "fugh", applications: 6235, applicants: 5960, consents: 618, consentRate: 9.91, medianScore: 205, controlFailed: 1374, planBudget: 56, planPaid: 104, risk: "medium", action: "Уточнить барьер по общежитию" },
  { id: "automation", code: "15.03.04", name: "Автоматизация технологических процессов и производств", facultyId: "fm", applications: 5211, applicants: 5016, consents: 298, consentRate: 5.72, medianScore: 223, controlFailed: 407, planBudget: 55, planPaid: 105, risk: "high", action: "Персональная коммуникация 220+" },
  { id: "construction", code: "08.03.01", name: "Строительство", facultyId: "fugh", applications: 5061, applicants: 4889, consents: 226, consentRate: 4.47, medianScore: 201, controlFailed: 1035, planBudget: 34, planPaid: 126, risk: "high", action: "Вынести на ежедневную планерку" },
  { id: "innovation", code: "27.03.05", name: "Инноватика", facultyId: "fdr", applications: 5021, applicants: 4839, consents: 410, consentRate: 8.17, medianScore: 227, controlFailed: 657, planBudget: 66, planPaid: 94, risk: "medium", action: "Уточнить намерение кандидатов" },
  { id: "math", code: "01.03.02", name: "Прикладная математика и информатика", facultyId: "fit", applications: 4575, applicants: 4411, consents: 203, consentRate: 4.44, medianScore: 231, controlFailed: 479, planBudget: 60, planPaid: 60, risk: "high", action: "Сегмент 230+ без согласия" },
  { id: "ads", code: "42.03.01", name: "Реклама и связи с общественностью", facultyId: "feu", applications: 4006, applicants: 3883, consents: 573, consentRate: 14.3, medianScore: 198, controlFailed: 1617, planBudget: 50, planPaid: 86, risk: "medium", action: "Разобрать очередь контроля" },
  { id: "ias", code: "10.05.03", name: "Информационная безопасность автоматизированных систем", facultyId: "fit", applications: 3289, applicants: 3207, consents: 217, consentRate: 6.6, medianScore: 228, controlFailed: 421, planBudget: 91, planPaid: 109, risk: "high", action: "Пригласить на консультацию" },
  { id: "materials", code: "22.03.01", name: "Материаловедение и технологии материалов", facultyId: "fm", applications: 2965, applicants: 2887, consents: 191, consentRate: 6.44, medianScore: 209, controlFailed: 226, planBudget: 55, planPaid: 105, risk: "medium", action: "Поддерживающая рассылка" },
  { id: "management", code: "38.03.02", name: "Менеджмент", facultyId: "feu", applications: 2897, applicants: 2833, consents: 110, consentRate: 3.8, medianScore: 178, controlFailed: 1201, planBudget: 105, planPaid: 90, risk: "high", action: "Пересобрать платный сегмент" },
  { id: "techmach", code: "15.03.05", name: "Конструкторско-технологическое обеспечение машиностроительных производств", facultyId: "fm", applications: 2730, applicants: 2678, consents: 517, consentRate: 18.94, medianScore: 198, controlFailed: 554, planBudget: 30, planPaid: 0, risk: "low", action: "Продолжить сопровождение" },
];

export const intersections = [
  { a: "ivt", b: "pi", count: 8673 },
  { a: "ivt", b: "ist", count: 6283 },
  { a: "ist", b: "pi", count: 3923 },
  { a: "ivt", b: "transport", count: 3584 },
  { a: "ivt", b: "machinery", count: 3426 },
  { a: "ivt", b: "infosec", count: 2789 },
  { a: "ivt", b: "energy", count: 2767 },
  { a: "automation", b: "ivt", count: 2332 },
  { a: "innovation", b: "ivt", count: 2232 },
  { a: "construction", b: "ivt", count: 2201 },
  { a: "transport", b: "pi", count: 2194 },
  { a: "ivt", b: "math", count: 2085 },
  { a: "machinery", b: "pi", count: 2080 },
  { a: "ads", b: "ivt", count: 1822 },
  { a: "infosec", b: "pi", count: 1767 },
  { a: "energy", b: "pi", count: 1718 },
  { a: "ias", b: "ivt", count: 1544 },
  { a: "ist", b: "transport", count: 1521 },
  { a: "ist", b: "machinery", count: 1490 },
  { a: "construction", b: "pi", count: 1460 },
  { a: "automation", b: "pi", count: 1452 },
  { a: "innovation", b: "pi", count: 1355 },
  { a: "ivt", b: "materials", count: 1331 },
  { a: "ivt", b: "management", count: 1304 },
];

export const applicants = [
  {
    id: "AB-26-004812", score: 276, risk: "high", segment: "Сильный без согласия", region: "ЦФО", citizenship: "Россия", dormitory: true, owner: "Группа ФИТ", nextAction: "Позвонить сегодня до 16:00",
    applications: [
      { directionId: "ivt", priority: 1, basis: "Бюджет", status: "Участвует в конкурсе", consent: false, rank: "18 / 391", control: true },
      { directionId: "pi", priority: 2, basis: "Бюджет", status: "Участвует в конкурсе", consent: false, rank: "27 / 215", control: true },
      { directionId: "ist", priority: 3, basis: "Платное", status: "На рассмотрении", consent: false, rank: "—", control: false },
    ],
    touchpoints: [
      { date: "26.07", type: "Звонок", source: "Bitrix24", result: "Не дозвонились" },
      { date: "20.07", type: "Мероприятие", source: "НТО", result: "Участник финала" },
      { date: "12.07", type: "Email", source: "Рассылка", result: "Открыл письмо" },
    ],
  },
  {
    id: "AB-26-011730", score: 264, risk: "medium", segment: "Несколько приоритетов", region: "ПФО", citizenship: "Россия", dormitory: false, owner: "Транспортный факультет", nextAction: "Уточнить основной приоритет",
    applications: [
      { directionId: "transport", priority: 1, basis: "Бюджет", status: "Участвует в конкурсе", consent: true, rank: "11 / 159", control: true },
      { directionId: "ivt", priority: 2, basis: "Бюджет", status: "Участвует в конкурсе", consent: false, rank: "86 / 391", control: true },
      { directionId: "machinery", priority: 3, basis: "Бюджет", status: "Участвует в конкурсе", consent: false, rank: "43 / 182", control: true },
    ],
    touchpoints: [
      { date: "25.07", type: "Сообщение", source: "Telegram", result: "Подтвердил интерес" },
      { date: "18.07", type: "Мероприятие", source: "Инженеры будущего", result: "Посетил трек" },
    ],
  },
  {
    id: "AB-26-018044", score: 253, risk: "high", segment: "Контроль не пройден", region: "ЦФО", citizenship: "Россия", dormitory: true, owner: "Группа контроля", nextAction: "Проверить комплект документов",
    applications: [
      { directionId: "automation", priority: 1, basis: "Бюджет", status: "На рассмотрении", consent: false, rank: "—", control: false },
      { directionId: "machinery", priority: 2, basis: "Бюджет", status: "На рассмотрении", consent: false, rank: "—", control: false },
    ],
    touchpoints: [
      { date: "26.07", type: "Задача", source: "Bitrix24", result: "Запрошен документ" },
      { date: "14.07", type: "Мероприятие", source: "День открытых дверей", result: "Посетил консультацию" },
    ],
  },
  {
    id: "AB-26-020915", score: 248, risk: "medium", segment: "Ожидает результаты ВИ", region: "СЗФО", citizenship: "Россия", dormitory: true, owner: "Институт Фаворского", nextAction: "Напомнить о графике ВИ",
    applications: [
      { directionId: "ads", priority: 2, basis: "Платное", status: "Ожидание результатов ВИ", consent: false, rank: "—", control: true },
      { directionId: "pi", priority: 4, basis: "Платное", status: "Участвует в конкурсе", consent: false, rank: "142 / 285", control: true },
    ],
    touchpoints: [
      { date: "24.07", type: "Email", source: "Рассылка", result: "Перешел к расписанию" },
      { date: "10.07", type: "Мероприятие", source: "Наука для жизни", result: "Регистрация" },
    ],
  },
  {
    id: "AB-26-027501", score: 236, risk: "low", segment: "Согласие получено", region: "ЦФО", citizenship: "Россия", dormitory: false, owner: "ФИТ", nextAction: "Поддерживать контакт до приказа",
    applications: [
      { directionId: "ist", priority: 1, basis: "Бюджет", status: "Участвует в конкурсе", consent: true, rank: "57 / 180", control: true },
      { directionId: "pi", priority: 2, basis: "Платное", status: "Участвует в конкурсе", consent: false, rank: "204 / 285", control: true },
    ],
    touchpoints: [
      { date: "26.07", type: "Сообщение", source: "Telegram", result: "Подтвердил намерение" },
      { date: "16.07", type: "Форма", source: "Сайт", result: "Запрос программы" },
    ],
  },
  {
    id: "AB-26-031886", score: 228, risk: "high", segment: "Платный набор", region: "ЮФО", citizenship: "Россия", dormitory: true, owner: "ФЭУ", nextAction: "Отправить расчет стоимости",
    applications: [
      { directionId: "management", priority: 1, basis: "Платное", status: "На рассмотрении", consent: false, rank: "—", control: false },
      { directionId: "ads", priority: 2, basis: "Платное", status: "Участвует в конкурсе", consent: false, rank: "311 / 138", control: true },
    ],
    touchpoints: [
      { date: "25.07", type: "Звонок", source: "Bitrix24", result: "Интересуется рассрочкой" },
      { date: "19.07", type: "Email", source: "Рассылка", result: "Открыл расчет" },
    ],
  },
  {
    id: "AB-26-039104", score: 221, risk: "medium", segment: "Общежитие", region: "СФО", citizenship: "Россия", dormitory: true, owner: "ФУГХ", nextAction: "Уточнить условия заселения",
    applications: [
      { directionId: "construction", priority: 1, basis: "Бюджет", status: "Участвует в конкурсе", consent: false, rank: "68 / 34", control: true },
      { directionId: "energy", priority: 2, basis: "Бюджет", status: "Участвует в конкурсе", consent: false, rank: "51 / 76", control: true },
    ],
    touchpoints: [
      { date: "26.07", type: "Сообщение", source: "Bitrix24", result: "Задан вопрос об общежитии" },
      { date: "05.07", type: "Мероприятие", source: "День открытых дверей", result: "Онлайн-участник" },
    ],
  },
  {
    id: "AB-26-045622", score: 218, risk: "medium", segment: "Иностранный абитуриент", region: "Зарубежье", citizenship: "Казахстан", dormitory: true, owner: "Международный отдел", nextAction: "Проверить перевод документа",
    applications: [
      { directionId: "materials", priority: 1, basis: "Платное", status: "На рассмотрении", consent: false, rank: "—", control: false },
      { directionId: "machinery", priority: 2, basis: "Платное", status: "Новое", consent: false, rank: "—", control: false },
    ],
    touchpoints: [
      { date: "25.07", type: "Email", source: "Международный отдел", result: "Документы получены" },
      { date: "21.07", type: "Форма", source: "Сайт", result: "Оставил заявку" },
    ],
  },
  {
    id: "AB-26-052718", score: 214, risk: "low", segment: "Целевой прием", region: "УФО", citizenship: "Россия", dormitory: false, owner: "ПИШ FDR", nextAction: "Подтвердить организацию-заказчика",
    applications: [
      { directionId: "innovation", priority: 1, basis: "Целевое", status: "Участвует в конкурсе", consent: true, rank: "7 / 55", control: true },
      { directionId: "automation", priority: 2, basis: "Бюджет", status: "Участвует в конкурсе", consent: false, rank: "92 / 58", control: true },
    ],
    touchpoints: [
      { date: "24.07", type: "Звонок", source: "ПИШ FDR", result: "Подтвердил организацию" },
      { date: "11.07", type: "Мероприятие", source: "Инженеры будущего", result: "Победитель кейса" },
    ],
  },
  {
    id: "AB-26-060403", score: 207, risk: "medium", segment: "Несколько факультетов", region: "ПФО", citizenship: "Россия", dormitory: false, owner: "Общая очередь", nextAction: "Передать в профильный факультет",
    applications: [
      { directionId: "ivt", priority: 3, basis: "Платное", status: "Участвует в конкурсе", consent: false, rank: "481 / 589", control: true },
      { directionId: "transport", priority: 1, basis: "Платное", status: "Участвует в конкурсе", consent: false, rank: "97 / 321", control: true },
      { directionId: "innovation", priority: 2, basis: "Платное", status: "На рассмотрении", consent: false, rank: "—", control: false },
    ],
    touchpoints: [
      { date: "26.07", type: "Задача", source: "Bitrix24", result: "Ожидает назначения" },
      { date: "15.07", type: "Мероприятие", source: "Карьерный интенсив", result: "Участник" },
    ],
  },
  {
    id: "AB-26-067155", score: 196, risk: "high", segment: "Нет движения 7 дней", region: "ЦФО", citizenship: "Россия", dormitory: false, owner: "ФМ", nextAction: "Повторный контакт",
    applications: [
      { directionId: "machinery", priority: 1, basis: "Платное", status: "На рассмотрении", consent: false, rank: "—", control: false },
      { directionId: "materials", priority: 2, basis: "Платное", status: "На рассмотрении", consent: false, rank: "—", control: false },
    ],
    touchpoints: [
      { date: "19.07", type: "Звонок", source: "Bitrix24", result: "Просил перезвонить" },
      { date: "08.07", type: "Форма", source: "Сайт", result: "Скачал буклет" },
    ],
  },
  {
    id: "AB-26-071902", score: 184, risk: "medium", segment: "Низкий конкурсный балл", region: "ЦФО", citizenship: "Россия", dormitory: false, owner: "ФЭУ", nextAction: "Предложить платную траекторию",
    applications: [
      { directionId: "management", priority: 1, basis: "Бюджет", status: "Участвует в конкурсе", consent: false, rank: "702 / 18", control: true },
      { directionId: "ads", priority: 2, basis: "Платное", status: "Участвует в конкурсе", consent: false, rank: "118 / 138", control: true },
    ],
    touchpoints: [
      { date: "23.07", type: "Email", source: "Bitrix24", result: "Предложение доставлено" },
      { date: "06.07", type: "Мероприятие", source: "День открытых дверей", result: "Очный участник" },
    ],
  },
];

export const eventSources = [
  { name: "НТО", contacts: 18460, matched: 12840, applicants: 7360, consentRate: 11.8 },
  { name: "Инженеры будущего", contacts: 12620, matched: 8910, applicants: 4180, consentRate: 13.4 },
  { name: "Наука для жизни", contacts: 10890, matched: 7520, applicants: 3390, consentRate: 10.7 },
  { name: "Дни открытых дверей", contacts: 24380, matched: 18940, applicants: 11180, consentRate: 12.9 },
  { name: "Формы сайта", contacts: 19740, matched: 16680, applicants: 9210, consentRate: 8.6 },
  { name: "Другие мероприятия", contacts: 13890, matched: 8240, applicants: 3980, consentRate: 9.2 },
];

export const tasksSeed = [
  { id: "T-1048", applicantId: "AB-26-004812", title: "Позвонить кандидату 276 баллов", type: "Звонок", priority: "high", status: "todo", due: "Сегодня, 16:00", owner: "ФИТ" },
  { id: "T-1051", applicantId: "AB-26-018044", title: "Проверить комплект документов", type: "Контроль", priority: "high", status: "todo", due: "Сегодня, 14:30", owner: "Группа контроля" },
  { id: "T-1054", applicantId: "AB-26-031886", title: "Отправить расчет стоимости", type: "Email", priority: "medium", status: "todo", due: "Сегодня, 18:00", owner: "ФЭУ" },
  { id: "T-1057", applicantId: "AB-26-039104", title: "Ответить по общежитию", type: "Сообщение", priority: "medium", status: "progress", due: "Сегодня", owner: "ФУГХ" },
  { id: "T-1062", applicantId: "AB-26-045622", title: "Проверить перевод документа", type: "Контроль", priority: "high", status: "progress", due: "28.07", owner: "Международный отдел" },
  { id: "T-1068", applicantId: "AB-26-060403", title: "Передать в транспортный факультет", type: "Передача", priority: "medium", status: "progress", due: "Сегодня", owner: "Общая очередь" },
  { id: "T-1021", applicantId: "AB-26-027501", title: "Подтвердить согласие", type: "Сообщение", priority: "low", status: "done", due: "26.07", owner: "ФИТ" },
  { id: "T-1027", applicantId: "AB-26-052718", title: "Связаться с организацией", type: "Звонок", priority: "low", status: "done", due: "26.07", owner: "FDR" },
];

export const campaigns = [
  { id: "C-14", name: "Высокобалльники без согласия", audience: 19752, sent: 14320, opened: 68, responses: 2940, channel: "Email + Telegram", status: "active" },
  { id: "C-18", name: "Контроль документов", audience: 23610, sent: 12980, opened: 74, responses: 4380, channel: "SMS + Email", status: "active" },
  { id: "C-21", name: "Общежитие: условия 2026", audience: 76738, sent: 0, opened: 0, responses: 0, channel: "Email", status: "planned" },
  { id: "C-09", name: "Участники НТО", audience: 7360, sent: 7360, opened: 81, responses: 2110, channel: "Telegram", status: "done" },
];

export const applicationDynamics = [
  { date: "26.06", value: 5230, previous: 4180 },
  { date: "30.06", value: 18460, previous: 14920 },
  { date: "04.07", value: 39780, previous: 32140 },
  { date: "08.07", value: 68120, previous: 55730 },
  { date: "12.07", value: 94760, previous: 77950 },
  { date: "16.07", value: 121430, previous: 100840 },
  { date: "20.07", value: 149820, previous: 124690 },
  { date: "24.07", value: 169440, previous: 143280 },
  { date: "27.07", value: 175970, previous: 151620 },
];

export const consentDynamics = [
  { date: "26.06", value: 120 },
  { date: "30.06", value: 540 },
  { date: "04.07", value: 1680 },
  { date: "08.07", value: 3540 },
  { date: "12.07", value: 5980 },
  { date: "16.07", value: 8420 },
  { date: "20.07", value: 10790 },
  { date: "24.07", value: 13110 },
  { date: "27.07", value: 14239 },
];

export const reportTemplates = [
  { id: "R-01", name: "Сводка проректору", description: "3 цифры, 3 риска, 3 действия", format: "PDF", last: "27.07, 08:00" },
  { id: "R-02", name: "Факультеты и направления", description: "План, заявления, согласия и риск", format: "XLSX", last: "26.07, 20:15" },
  { id: "R-03", name: "Очередь действий", description: "Список задач по приоритету и сроку", format: "XLSX", last: "26.07, 18:40" },
  { id: "R-04", name: "Качество данных", description: "Свежесть, дубли и ошибки склейки", format: "PDF", last: "25.07, 12:10" },
];

export const dataSources = [
  { id: "abit", name: "АИС «Прием»", role: "Заявления и статусы", records: "175 970", freshness: "срез 27.07", status: "confirmed", quality: 94, method: "XLSX → API" },
  { id: "places", name: "План приема 2026", role: "Бюджетные и платные места", records: "2 854 / 5 369", freshness: "приказ 19.01", status: "confirmed", quality: 100, method: "PDF → справочник" },
  { id: "rating", name: "Публичный рейтинг", role: "Реальное место и приоритет", records: "5 134 · пример", freshness: "срез 27.07", status: "confirmed", quality: 100, method: "Сайт → API" },
  { id: "bitrix", name: "Bitrix24 · ФИТ", role: "Мероприятия и обзвон", records: "590", freshness: "файловый срез", status: "partial", quality: 56, method: "XLSX · ID не склеены" },
  { id: "events", name: "Другие базы мероприятий", role: "Касания до поступления", records: "не подключены", freshness: "—", status: "hypothesis", quality: 0, method: "Требует обследования" },
];

export const heatmapDirections = ["ivt", "pi", "ist", "transport", "machinery", "infosec"];

export function directionById(id) {
  return directions.find((item) => item.id === id);
}

export function facultyById(id) {
  return faculties.find((item) => item.id === id);
}

export function intersectionCount(a, b) {
  if (a === b) return directionById(a)?.applicants ?? 0;
  return intersections.find((item) => (item.a === a && item.b === b) || (item.a === b && item.b === a))?.count ?? 0;
}
