const paths = {
  grid: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
  cap: "M2 9l10-5 10 5-10 5zM6 12v5c3 2 9 2 12 0v-5M22 9v7",
  list: "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01",
  users: "M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 20v-2a4 4 0 0 0-3-3.87M16 2.13a4 4 0 0 1 0 7.75",
  arrows: "M17 3l4 4-4 4M3 7h18M7 21l-4-4 4-4M21 17H3",
  chat: "M21 15a4 4 0 0 1-4 4H8l-5 3v-7a8 8 0 1 1 18 0z",
  checkSquare: "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
  chart: "M3 3v18h18M7 16l4-5 4 3 5-7",
  file: "M6 2h9l5 5v15H6zM14 2v6h6M9 13h6M9 17h6",
  database: "M4 6c0-2 4-4 8-4s8 2 8 4-4 4-8 4-8-2-8-4zM4 6v6c0 2 4 4 8 4s8-2 8-4V6M4 12v6c0 2 4 4 8 4s8-2 8-4v-6",
  gear: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v3M12 19v3M4.9 4.9L7 7M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1L7 17M17 7l2.1-2.1",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4",
  download: "M12 3v12M7 10l5 5 5-5M4 21h16",
  funnel: "M3 4h18l-7 8v6l-4 2v-8z",
  target: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  building: "M4 22V4h10v18M14 9h6v13M8 8h2M8 12h2M8 16h2M17 13h1M17 17h1M2 22h20",
  ruble: "M7 20V4h7a5 5 0 0 1 0 10H7M5 11h10M5 15h8",
  trend: "M3 17l6-6 4 4 8-9M15 6h6v6",
  checkCircle: "M22 11.1V12a10 10 0 1 1-5.9-9.1M22 4L12 14l-3-3",
  warning: "M12 9v4M12 17h.01M10.3 3.6L2.4 18a2 2 0 0 0 1.8 3h15.6a2 2 0 0 0 1.8-3L13.7 3.6a2 2 0 0 0-3.4 0z",
  caretRight: "M9 18l6-6-6-6",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.4-4.4",
  plus: "M12 5v14M5 12h14",
  x: "M5 5l14 14M19 5L5 19",
  menu: "M4 6h16M4 12h16M4 18h16",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4",
  sparkle: "M12 2l1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z",
  caretDown: "M6 9l6 6 6-6",
  userFocus: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 22v-2a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v2M2 6V2h4M18 2h4v4",
};

function Glyph({ kind, size = 24, weight, ...props }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={weight === "bold" ? 2.25 : 1.8} strokeLinecap="round" strokeLinejoin="round" {...props}><path d={paths[kind]} /></svg>;
}

const icon = (kind) => (props) => <Glyph kind={kind} {...props} />;
export const SquaresFour = icon("grid"), GraduationCap = icon("cap"), ListNumbers = icon("list");
export const UsersThree = icon("users"), ArrowsLeftRight = icon("arrows"), ChatCircleDots = icon("chat");
export const CheckSquare = icon("checkSquare"), ChartLineUp = icon("chart"), FileText = icon("file");
export const Database = icon("database"), Gear = icon("gear"), Bell = icon("bell"), DownloadSimple = icon("download");
export const Funnel = icon("funnel"), Target = icon("target"), Buildings = icon("building"), CurrencyRub = icon("ruble");
export const TrendUp = icon("trend"), CheckCircle = icon("checkCircle"), WarningCircle = icon("warning");
export const CaretRight = icon("caretRight"), MagnifyingGlass = icon("search"), Plus = icon("plus"), X = icon("x");
export const List = icon("menu"), Clock = icon("clock"), ShieldCheck = icon("shield"), Sparkle = icon("sparkle");
export const CaretDown = icon("caretDown"), UserFocus = icon("userFocus");
