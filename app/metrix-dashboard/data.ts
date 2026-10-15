import type { IconName } from "./ui/icon";

/* ───────────── 侧边栏 ───────────── */

export type NavItem = { id: string; label: string; icon: IconName };
export type NavGroup = { title: string; items: NavItem[] };

export const NAV_GROUPS: NavGroup[] = [
  {
    title: "Main Menu",
    items: [
      { id: "dashboard", label: "Dashboard", icon: "homeOutline" },
      { id: "products", label: "Products", icon: "chartBarLine" },
      { id: "transactions", label: "Transactions", icon: "money" },
      { id: "reports", label: "Reports & Analytics", icon: "file02" },
      { id: "messages", label: "Messages", icon: "bubbleChat" },
      { id: "team", label: "Team Performance", icon: "presentation" },
      { id: "campaigns", label: "Campaigns", icon: "megaphone" },
    ],
  },
  {
    title: "Customers",
    items: [
      { id: "customers", label: "Customer List", icon: "userMultiple" },
      { id: "channels", label: "Channels", icon: "modernTv" },
      { id: "orders", label: "Order Management", icon: "invoice" },
    ],
  },
  {
    title: "Management",
    items: [
      { id: "roles", label: "Roles & Permissions", icon: "userList" },
      { id: "billing", label: "Billing & Subscription", icon: "invoice01" },
      { id: "integrations", label: "Integrations", icon: "archive" },
    ],
  },
  {
    title: "Settings",
    items: [
      { id: "support", label: "Customer Support", icon: "headset" },
      { id: "help", label: "Help Center", icon: "helpCircle" },
      { id: "settings", label: "System Settings", icon: "setting" },
    ],
  },
];

export const WORKSPACES = ["Spark Pixel Team", "Spark Pixel Labs", "Client · Aimo"];

/* ───────────── KPI 卡片 ───────────── */

export type Kpi = {
  id: string;
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals: number;
  unit: string;
  delta: number;
  bars: number[];
  accent: number;
};

export const KPIS: Kpi[] = [
  { id: "revenue", label: "Total Revenue", value: 20320, prefix: "$", decimals: 0, unit: "", delta: 0.94, bars: [30, 38, 31, 35, 43, 31, 31], accent: 3 },
  { id: "orders", label: "Total Orders", value: 10320, decimals: 0, unit: "Orders", delta: 0.94, bars: [30, 38, 31, 45, 22, 31, 31], accent: 3 },
  { id: "customers", label: "New Customers", value: 4305, decimals: 0, unit: "New Users", delta: 0.94, bars: [26, 36, 28, 42, 38, 24, 33], accent: 3 },
  { id: "conversion", label: "Conversion Rate", value: 3.9, suffix: "%", decimals: 1, unit: "", delta: 0.94, bars: [28, 34, 26, 40, 30, 36, 29], accent: 3 },
];

/* ───────────── Sales Trend（像素柱图） ───────────── */

export type SalesPoint = { label: string; newUser: number; existing: number };
export type SalesPeriod = "weekly" | "monthly" | "yearly";

export const SALES_POINT_COUNT = 57;
/** 每个像素格代表的数值（k），共 25 行 → 顶部约 62.5k */
export const SALES_UNIT = 2.5;
export const SALES_ROWS = 25;

const NEW_USER_BASE = [
  4, 5, 6, 8, 11, 9, 7, 10, 15, 13, 9, 6, 10, 9, 7, 6, 8, 12, 15, 20, 10, 7, 4, 2, 5, 9, 16, 8, 6, 8, 9, 15, 12, 10, 7, 3,
  1, 9, 13, 16, 9, 8, 6, 4, 8, 10, 6, 5, 7, 10, 15, 13, 8, 6, 7, 8, 12,
];
const EXISTING_BASE = [
  1, 2, 3, 2, 5, 7, 5, 6, 3, 1, 5, 3, 4, 6, 4, 3, 1, 3, 8, 5, 3, 2, 1, 2, 3, 6, 4, 5, 3, 1, 2, 9, 5, 2, 2, 1, 1, 3, 4, 7,
  3, 3, 2, 1, 2, 8, 3, 4, 5, 3, 1, 2, 2, 4, 6, 3, 1,
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** 确定性伪随机：SSR / CSR 结果一致，避免 hydration 不匹配 */
const rand = (n: number) => {
  const t = Math.sin(n * 9301 + 49297) * 233280;
  return t - Math.floor(t);
};

const baseToValue = (base: number, seed: number) =>
  base <= 0 ? 0 : +(base * SALES_UNIT - rand(seed) * 2.3).toFixed(1);

/** 图表上下文：把「数值」换算成要点亮几行像素 */
export const valueToRows = (v: number) => Math.min(SALES_ROWS, Math.max(0, Math.ceil(v / SALES_UNIT - 1e-9)));

function wave(count: number, base: number, amp: number, seed: number, label: (i: number) => string): SalesPoint[] {
  return Array.from({ length: count }, (_, i) => {
    const w = Math.sin(i / 2.7 + seed) * 0.5 + Math.sin(i / 6.1 + seed * 2) * 0.35;
    const n = Math.max(2.5, base + w * amp + (rand(i + seed * 17) - 0.5) * amp * 0.9);
    const e = Math.max(1.2, n * (0.28 + rand(i * 3 + seed) * 0.3));
    return { label: label(i), newUser: +Math.min(59, n).toFixed(1), existing: +e.toFixed(1) };
  });
}

const monthlyPoints: SalesPoint[] = NEW_USER_BASE.map((b, i) => ({
  label: `${MONTHS[Math.min(11, Math.floor((i * 12) / 57))]} 2025`,
  newUser: baseToValue(b, i + 1),
  existing: baseToValue(EXISTING_BASE[i], i + 101),
})).map((p, i) => (i === 26 ? { ...p, newUser: 38, existing: 9.6 } : p));

export const SALES_DATA: Record<SalesPeriod, { points: SalesPoint[]; axis: string[]; total: number }> = {
  monthly: { points: monthlyPoints, axis: MONTHS, total: 20320 },
  weekly: {
    points: wave(57, 21, 18, 3, (i) => `${WEEKDAYS[Math.min(6, Math.floor((i * 7) / 57))]}, ${String(Math.floor(i / 2) % 24).padStart(2, "0")}:00`),
    axis: WEEKDAYS,
    total: 4860,
  },
  yearly: {
    points: wave(57, 30, 16, 7, (i) => `${2014 + Math.min(11, Math.floor((i * 12) / 57))}`),
    axis: Array.from({ length: 12 }, (_, i) => `${2014 + i}`),
    total: 243840,
  },
};

export const SALES_Y_LABELS = ["60k", "50k", "40k", "30k", "20k", "10k", "0k"];

/* ───────────── Revenue Breakdown ───────────── */

export type RevenuePoint = { x: number; total: number; value: number; date: string; revenue: number; target: number };

/** 原站柱子的 x 基于 352px 宽的设计稿，渲染时换算成百分比 */
export const REVENUE_DESIGN_WIDTH = 352;
export const REVENUE_DESIGN_HEIGHT = 368.4;

export const REVENUE_BASE: RevenuePoint[] = [
  { x: 29.4, total: 143, value: 96 },
  { x: 53.4, total: 175, value: 128 },
  { x: 77.4, total: 120, value: 73 },
  { x: 101.4, total: 197, value: 154 },
  { x: 125.4, total: 154, value: 102.72 },
  { x: 149.4, total: 109, value: 73 },
  { x: 173.4, total: 143, value: 109 },
  { x: 197.4, total: 109, value: 67 },
  { x: 221.4, total: 186, value: 146 },
  { x: 245.4, total: 130, value: 81 },
  { x: 269.4, total: 166, value: 120 },
  { x: 293.4, total: 143, value: 83 },
  { x: 317.4, total: 126, value: 81 },
].map((p, i) => ({
  ...p,
  date: `Jan ${1 + Math.round((i * 29) / 12)}`,
  revenue: Math.round(p.value * 10),
  target: Math.round(p.total * 10),
}));

export type RevenueRange = { id: string; label: string; total: number; scale: number; from: string; to: string };

export const REVENUE_RANGES: RevenueRange[] = [
  { id: "ytd", label: "Jan 1 - Aug 30", total: 20320, scale: 1, from: "1 Jan", to: "30 Jan 2025" },
  { id: "q3", label: "Jul 1 - Sep 30", total: 17480, scale: 0.86, from: "1 Jul", to: "30 Sep 2025" },
  { id: "30d", label: "Last 30 days", total: 6940, scale: 0.72, from: "7 Oct", to: "6 Nov 2025" },
];

export const AI_INSIGHT =
  "Revenue peaked on Jan 10 and Jan 20 — both days had a promo push. Existing customers drove 71% of category revenue; Ergo seating is the top performer.";

/** 切换时间范围时，按 scale 对柱高做确定性缩放 */
export function scaleRevenue(range: RevenueRange): RevenuePoint[] {
  if (range.scale === 1) return REVENUE_BASE;
  return REVENUE_BASE.map((p, i) => {
    const k = range.scale * (0.85 + ((i * 37) % 11) / 30);
    const total = Math.min(210, p.total * k);
    const value = Math.min(total - 14, p.value * k);
    return { ...p, total, value, revenue: Math.round(value * 10), target: Math.round(total * 10) };
  });
}

/* ───────────── Transactions ───────────── */

export type TxStatus = "Success" | "Pending" | "Refunded";
export type Transaction = {
  id: string;
  customer: string;
  product: string;
  status: TxStatus;
  qty: number;
  unitPrice: number;
  total: number;
};

export const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: "#04910", customer: "Ryan Korsgaard", product: "Ergo Office Chair", status: "Success", qty: 12, unitPrice: 3450, total: 41400 },
  { id: "#04911", customer: "Madelyn Lubin", product: "Sunset Desk 02", status: "Success", qty: 20, unitPrice: 2980, total: 89200 },
  { id: "#04912", customer: "Abram Bergson", product: "Eco Bookshelf", status: "Pending", qty: 22, unitPrice: 1750, total: 75900 },
  { id: "#04913", customer: "Phillip Mango", product: "Green Leaf Desk", status: "Refunded", qty: 24, unitPrice: 1950, total: 19500 },
];

/** 点「Add Transaction」时依次插入的新行 */
export const NEW_TRANSACTION_POOL: Omit<Transaction, "id">[] = [
  { customer: "Kianna Dorwart", product: "Oak Standing Desk", status: "Pending", qty: 6, unitPrice: 2150, total: 12900 },
  { customer: "Cristofer Vetrovs", product: "Mesh Task Chair", status: "Success", qty: 14, unitPrice: 890, total: 12460 },
  { customer: "Alena Geidt", product: "Walnut Side Table", status: "Success", qty: 9, unitPrice: 640, total: 5760 },
];

export const formatMoney = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
