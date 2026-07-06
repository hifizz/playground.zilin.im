/**
 * 模拟美股期权链数据（open interest 订单墙）。
 *
 * 生成规则尽量贴近真实市场形态：
 *   - OI 在 ATM（现价附近）聚集，距离越远越稀疏（高斯衰减）
 *   - 整数关口（尾数 0 / 25 / 50）有明显强化 —— 真实市场的心理价位效应
 *   - 月度到期日（月 OpEx）的 OI 远大于普通周度
 *   - 现价下方 Put 偏重（保护性看跌），上方 Call 偏重（追涨/covered call）
 *   - 随机注入若干"鲸鱼大单"：某个具体合约上的巨量 OI，即订单墙
 */

export const SPOT = 560;
export const STRIKE_STEP = 5;
export const STRIKES = Array.from({ length: 17 }, (_, i) => SPOT - 40 + i * STRIKE_STEP);

export type Expiry = { label: string; days: number; monthly: boolean };

export const EXPIRIES: Expiry[] = [
  { label: "7D", days: 7, monthly: false },
  { label: "14D", days: 14, monthly: false },
  { label: "21D", days: 21, monthly: false },
  { label: "1M", days: 30, monthly: true },
  { label: "6W", days: 45, monthly: false },
  { label: "2M", days: 60, monthly: true },
  { label: "3M", days: 91, monthly: true },
  { label: "6M", days: 182, monthly: true },
];

export type Side = "call" | "put";

export type OptionCell = {
  strike: number;
  strikeIdx: number;
  expiryIdx: number;
  side: Side;
  oi: number; // open interest（张）
  volume: number; // 当日成交量
  whale: boolean; // 是否为注入的鲸鱼单
};

export type ChainData = {
  cells: OptionCell[];
  maxOI: number;
  avgOI: number;
  totalOI: number;
  maxPain: number; // 最大痛点行权价
};

/** mulberry32 —— 可复现的种子随机数 */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 整数关口强化系数 */
function roundBoost(strike: number) {
  if (strike % 50 === 0) return 2.4;
  if (strike % 25 === 0) return 1.7;
  if (strike % 10 === 0) return 1.25;
  return 1;
}

export function generateChain(seed: number): ChainData {
  const rand = mulberry32(seed);
  const cells: OptionCell[] = [];

  // 每个到期日的规模系数：月度显著更大，越远月流动性稍降
  const expiryWeight = EXPIRIES.map((e, i) => {
    const base = e.monthly ? 2.1 : 0.9;
    const decay = 1 - i * 0.045;
    return base * decay * (0.85 + rand() * 0.3);
  });

  for (let ei = 0; ei < EXPIRIES.length; ei++) {
    // 远月的 OI 分布更宽（不确定性更高）
    const width = 18 + EXPIRIES[ei].days * 0.11;
    for (let si = 0; si < STRIKES.length; si++) {
      const strike = STRIKES[si];
      const dist = strike - SPOT;
      const gauss = Math.exp(-(dist * dist) / (2 * width * width));
      for (const side of ["call", "put"] as const) {
        // 方向偏置：下方 Put 重、上方 Call 重
        const sideBias =
          side === "put"
            ? dist < 0
              ? 1.45
              : 0.55
            : dist > 0
              ? 1.4
              : 0.6;
        const noise = 0.45 + Math.pow(rand(), 1.6) * 1.6; // 右偏噪声
        const oi = Math.round(
          9000 * gauss * sideBias * roundBoost(strike) * expiryWeight[ei] * noise + rand() * 350,
        );
        cells.push({
          strike,
          strikeIdx: si,
          expiryIdx: ei,
          side,
          oi,
          volume: Math.round(oi * (0.08 + rand() * 0.5)),
          whale: false,
        });
      }
    }
  }

  // 注入 4-6 个鲸鱼大单：偏好月度到期 + 整数关口，Call 在上方 / Put 在下方
  const whaleCount = 4 + Math.floor(rand() * 3);
  const candidates = cells.filter((c) => {
    const roundOK = c.strike % 10 === 0;
    const monthlyOK = EXPIRIES[c.expiryIdx].monthly || rand() < 0.25;
    const dirOK =
      c.side === "call" ? c.strike >= SPOT : c.strike <= SPOT;
    return roundOK && monthlyOK && dirOK;
  });
  const picked = new Set<number>();
  for (let i = 0; i < whaleCount && candidates.length > 0; i++) {
    let idx = Math.floor(rand() * candidates.length);
    let guard = 0;
    while (picked.has(idx) && guard++ < 20) idx = Math.floor(rand() * candidates.length);
    picked.add(idx);
    const cell = candidates[idx];
    cell.oi = Math.round(cell.oi * (3.5 + rand() * 4.5) + 25000);
    cell.volume = Math.round(cell.oi * (0.3 + rand() * 0.6));
    cell.whale = true;
  }

  const totalOI = cells.reduce((s, c) => s + c.oi, 0);
  const maxOI = cells.reduce((m, c) => Math.max(m, c.oi), 0);
  const avgOI = totalOI / cells.length;

  // 最大痛点：让所有期权买方总收益最小（卖方付出最少）的结算价
  let maxPain = SPOT;
  let minPayout = Infinity;
  for (const settle of STRIKES) {
    let payout = 0;
    for (const c of cells) {
      if (c.side === "call") payout += c.oi * Math.max(0, settle - c.strike);
      else payout += c.oi * Math.max(0, c.strike - settle);
    }
    if (payout < minPayout) {
      minPayout = payout;
      maxPain = settle;
    }
  }

  return { cells, maxOI, avgOI, totalOI, maxPain };
}

export function formatOI(oi: number) {
  if (oi >= 1_000_000) return `${(oi / 1_000_000).toFixed(2)}M`;
  if (oi >= 1_000) return `${(oi / 1_000).toFixed(1)}K`;
  return String(oi);
}
