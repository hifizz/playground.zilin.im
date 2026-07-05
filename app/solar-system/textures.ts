/**
 * 程序化行星贴图：全部用 2D canvas + 周期性 value noise 现场画出来，零外部图片。
 *
 * 关键点是横向（经度 u）必须无缝：噪声在 x 方向按整数周期取模，
 * 这样贴到球面上 u=0 与 u=1 处刚好接上。每颗行星是一个独立的
 * 逐像素着色函数，风格化但保留科普特征（木星条纹与大红斑、
 * 地球大陆与云、水星陨石坑、海王星大暗斑、金星逆行浓云……）。
 */

const W = 512;
const H = 256;

// ---------- 基础工具 ----------

function fract(x: number) {
  return x - Math.floor(x);
}

// 确定性 hash（代替存表的随机格点），x 方向可取模实现周期性
function hash2(x: number, y: number, seed: number) {
  return fract(Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453);
}

function smooth(t: number) {
  return t * t * (3 - 2 * t);
}

/** 周期性 value noise：px = x 方向周期（格点数），y 方向不需要周期 */
function pnoise(x: number, y: number, px: number, seed: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const fx = smooth(x - xi);
  const fy = smooth(y - yi);
  const w = (i: number) => ((i % px) + px) % px;
  const a = hash2(w(xi), yi, seed);
  const b = hash2(w(xi + 1), yi, seed);
  const c = hash2(w(xi), yi + 1, seed);
  const d = hash2(w(xi + 1), yi + 1, seed);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}

/** 分形噪声：叠 oct 层，每层频率 ×2 保持 x 周期性 */
function fbm(x: number, y: number, px: number, seed: number, oct = 4) {
  let sum = 0;
  let amp = 0.5;
  let f = 1;
  for (let i = 0; i < oct; i++) {
    sum += amp * pnoise(x * f, y * f, px * f, seed + i * 17);
    amp *= 0.5;
    f *= 2;
  }
  return sum; // 约 0..0.94
}

type RGB = [number, number, number];

function hex(c: string): RGB {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** 多段颜色渐变 → 256 级查找表 */
function makeLut(stops: [number, string][]): RGB[] {
  const lut: RGB[] = [];
  const cols = stops.map(([t, c]) => [t, hex(c)] as [number, RGB]);
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let j = 0;
    while (j < cols.length - 2 && cols[j + 1][0] < t) j++;
    const [t0, c0] = cols[j];
    const [t1, c1] = cols[j + 1];
    const k = Math.min(1, Math.max(0, (t - t0) / (t1 - t0 || 1)));
    lut.push([
      c0[0] + (c1[0] - c0[0]) * k,
      c0[1] + (c1[1] - c0[1]) * k,
      c0[2] + (c1[2] - c0[2]) * k,
    ]);
  }
  return lut;
}

function sampleLut(lut: RGB[], t: number): RGB {
  const i = Math.min(255, Math.max(0, Math.round(t * 255)));
  return lut[i];
}

/** 逐像素填充画布。shade(u, v) 返回 RGB；u 经度 0..1，v 纬度 0..1（0 = 北极） */
function paint(shade: (u: number, v: number) => RGB): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(W, H);
  const data = img.data;
  for (let y = 0; y < H; y++) {
    const v = y / H;
    for (let x = 0; x < W; x++) {
      const [r, g, b] = shade(x / W, v);
      const i = (y * W + x) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

/** 陨石坑后处理：暗色坑底 + 左上亮边（模拟侧光） */
function stampCraters(
  canvas: HTMLCanvasElement,
  count: number,
  seed: number,
  strength = 0.35,
) {
  const ctx = canvas.getContext("2d")!;
  for (let i = 0; i < count; i++) {
    const x = hash2(i, 1, seed) * W;
    const y = (0.12 + hash2(i, 2, seed) * 0.76) * H;
    const r = 1.5 + hash2(i, 3, seed) ** 2 * 11;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0,0,0,${strength * (0.5 + hash2(i, 4, seed) * 0.5)})`;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x - r * 0.18, y - r * 0.18, r * 0.92, Math.PI * 0.8, Math.PI * 1.9);
    ctx.strokeStyle = `rgba(255,255,255,${strength * 0.55})`;
    ctx.lineWidth = Math.max(0.6, r * 0.14);
    ctx.stroke();
  }
}

/** 椭圆风暴斑（大红斑 / 大暗斑）：中心实、边缘柔 */
function spotFactor(
  u: number,
  v: number,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
) {
  // u 是周期坐标，取最近镜像
  let du = Math.abs(u - cx);
  du = Math.min(du, 1 - du);
  const d = Math.hypot(du / rx, (v - cy) / ry);
  return d >= 1 ? 0 : smooth(1 - d);
}

// ---------- 各天体着色 ----------

function sunCanvas() {
  const lut = makeLut([
    [0, "#fff7d6"],
    [0.35, "#ffd75e"],
    [0.65, "#ff9f2e"],
    [0.85, "#f4691f"],
    [1, "#c93d12"],
  ]);
  return paint((u, v) => {
    const n = fbm(u * 10, v * 10, 10, 7, 5);
    const cell = pnoise(u * 24, v * 24, 24, 91); // 米粒组织
    const t = Math.min(1, Math.max(0, n * 0.9 + cell * 0.25 - 0.12));
    return sampleLut(lut, t);
  });
}

function mercuryCanvas() {
  const lut = makeLut([
    [0, "#c8c2ba"],
    [0.5, "#8f8880"],
    [1, "#575049"],
  ]);
  const canvas = paint((u, v) => {
    const n = fbm(u * 6, v * 6, 6, 21, 5);
    return sampleLut(lut, n);
  });
  stampCraters(canvas, 110, 33, 0.32);
  return canvas;
}

function venusCanvas() {
  const lut = makeLut([
    [0, "#f6e7c5"],
    [0.35, "#e8c47a"],
    [0.6, "#d9a752"],
    [0.85, "#c08a44"],
    [1, "#a9773c"],
  ]);
  return paint((u, v) => {
    // 高速环流的浓硫酸云：横向拉长的涡旋条带
    const swirl = fbm(u * 3 + v * 2.5, v * 6, 3, 55, 4);
    const t = Math.min(1, Math.max(0, v * 0.25 + swirl * 0.85 - 0.1));
    return sampleLut(lut, t);
  });
}

function earthCanvas() {
  const sea = makeLut([
    [0, "#0b3d91"],
    [0.6, "#155ec4"],
    [1, "#2f86d6"],
  ]);
  const land = makeLut([
    [0, "#2f7d3a"],
    [0.45, "#5c9143"],
    [0.75, "#9c8a4d"],
    [1, "#7a5c38"],
  ]);
  return paint((u, v) => {
    const n = fbm(u * 4, v * 4, 4, 3, 5); // 大陆
    const detail = fbm(u * 12, v * 12, 12, 8, 3);
    const lat = Math.abs(v - 0.5) * 2; // 0 赤道 → 1 两极
    let rgb: RGB;
    if (n > 0.52) {
      rgb = sampleLut(land, Math.min(1, (n - 0.52) * 3 + detail * 0.35));
    } else {
      rgb = sampleLut(sea, Math.min(1, (0.52 - n) * 2.2));
    }
    // 极地冰盖
    const ice = smooth(Math.min(1, Math.max(0, (lat - 0.82) / 0.12)));
    // 云层
    const cloud = Math.max(0, fbm(u * 7 + 3, v * 7, 7, 42, 4) - 0.52) * 2.2;
    const w = Math.min(1, ice + cloud * 0.75);
    return [
      rgb[0] + (245 - rgb[0]) * w,
      rgb[1] + (247 - rgb[1]) * w,
      rgb[2] + (250 - rgb[2]) * w,
    ];
  });
}

function marsCanvas() {
  const lut = makeLut([
    [0, "#e8a06a"],
    [0.4, "#c96a3c"],
    [0.7, "#a44a2a"],
    [1, "#6e2f1d"],
  ]);
  const canvas = paint((u, v) => {
    const n = fbm(u * 5, v * 5, 5, 12, 5);
    const dark = Math.max(0, fbm(u * 3 + 9, v * 3, 3, 77, 3) - 0.55) * 2; // 玄武岩暗斑
    const rgb = sampleLut(lut, Math.min(1, n * 0.8 + dark * 0.6));
    const lat = Math.abs(v - 0.5) * 2;
    const ice = smooth(Math.min(1, Math.max(0, (lat - 0.88) / 0.09)));
    return [
      rgb[0] + (250 - rgb[0]) * ice,
      rgb[1] + (248 - rgb[1]) * ice,
      rgb[2] + (244 - rgb[2]) * ice,
    ];
  });
  stampCraters(canvas, 40, 61, 0.16);
  return canvas;
}

function jupiterCanvas() {
  const lut = makeLut([
    [0, "#c9b29a"],
    [0.12, "#e8d9c3"],
    [0.24, "#b98d63"],
    [0.34, "#f0e6d4"],
    [0.46, "#c4703f"],
    [0.55, "#e6d3b8"],
    [0.66, "#a97a52"],
    [0.78, "#e0cdb2"],
    [0.9, "#b89778"],
    [1, "#cbb69c"],
  ]);
  return paint((u, v) => {
    // 纬向条带 + 湍流扰动
    const turb = (fbm(u * 8, v * 22, 8, 5, 4) - 0.45) * 0.07;
    let rgb = sampleLut(lut, Math.min(1, Math.max(0, v + turb)));
    // 大红斑（南半球）
    const s = spotFactor(u, v, 0.3, 0.63, 0.085, 0.055);
    if (s > 0) {
      const rust: RGB = [199, 81, 44];
      const k = Math.min(1, s * 1.3);
      rgb = [
        rgb[0] + (rust[0] - rgb[0]) * k,
        rgb[1] + (rust[1] - rgb[1]) * k,
        rgb[2] + (rust[2] - rgb[2]) * k,
      ];
    }
    return rgb;
  });
}

function saturnCanvas() {
  const soft = makeLut([
    [0, "#d8c49a"],
    [0.2, "#efe3c4"],
    [0.35, "#d9bc8c"],
    [0.5, "#f2e7cb"],
    [0.65, "#cfae7d"],
    [0.8, "#e9dab8"],
    [1, "#c2a375"],
  ]);
  return paint((u, v) => {
    const turb = (fbm(u * 6, v * 16, 6, 27, 3) - 0.45) * 0.04;
    return sampleLut(soft, Math.min(1, Math.max(0, v + turb)));
  });
}

function uranusCanvas() {
  const lut = makeLut([
    [0, "#bfeef0"],
    [0.5, "#8fd8de"],
    [1, "#5fb8c6"],
  ]);
  return paint((u, v) => {
    const n = (fbm(u * 4, v * 8, 4, 88, 3) - 0.45) * 0.18;
    return sampleLut(lut, Math.min(1, Math.max(0, v * 0.7 + 0.15 + n)));
  });
}

function neptuneCanvas() {
  const lut = makeLut([
    [0, "#8fb8f2"],
    [0.3, "#4f7fe0"],
    [0.6, "#2f55c4"],
    [1, "#1d3a9e"],
  ]);
  return paint((u, v) => {
    const streak = (fbm(u * 6, v * 18, 6, 14, 4) - 0.45) * 0.2;
    let rgb = sampleLut(lut, Math.min(1, Math.max(0, v * 0.8 + 0.1 + streak)));
    // 大暗斑
    const s = spotFactor(u, v, 0.62, 0.42, 0.075, 0.05);
    if (s > 0) {
      const k = s * 0.65;
      rgb = [rgb[0] * (1 - k * 0.6), rgb[1] * (1 - k * 0.55), rgb[2] * (1 - k * 0.35)];
    }
    // 暗斑旁的亮云条
    const c = spotFactor(u, v, 0.62, 0.5, 0.09, 0.02) * 0.7;
    return [rgb[0] + (240 - rgb[0]) * c, rgb[1] + (245 - rgb[1]) * c, rgb[2] + (255 - rgb[2]) * c];
  });
}

function moonCanvas() {
  const lut = makeLut([
    [0, "#d6d3cd"],
    [0.5, "#a3a09a"],
    [1, "#6b6862"],
  ]);
  const canvas = paint((u, v) => sampleLut(lut, fbm(u * 5, v * 5, 5, 71, 5)));
  stampCraters(canvas, 70, 19, 0.3);
  return canvas;
}

export function createBodyCanvas(id: string): HTMLCanvasElement {
  switch (id) {
    case "sun":
      return sunCanvas();
    case "mercury":
      return mercuryCanvas();
    case "venus":
      return venusCanvas();
    case "earth":
      return earthCanvas();
    case "mars":
      return marsCanvas();
    case "jupiter":
      return jupiterCanvas();
    case "saturn":
      return saturnCanvas();
    case "uranus":
      return uranusCanvas();
    case "neptune":
      return neptuneCanvas();
    case "moon":
      return moonCanvas();
    default:
      return mercuryCanvas();
  }
}

/** 行星环贴图：横向 = 半径方向。冰粒条带 + 卡西尼缝 */
export function createRingCanvas(): HTMLCanvasElement {
  const w = 512;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = 8;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(w, 8);
  const base = hex("#d8c8a8");
  for (let x = 0; x < w; x++) {
    const t = x / w;
    const bands = fbm(t * 40, 0.5, 40, 6, 4);
    let alpha = 0.25 + bands * 0.9;
    // 内缘/外缘淡出
    alpha *= smooth(Math.min(1, t / 0.08)) * smooth(Math.min(1, (1 - t) / 0.06));
    // 卡西尼缝
    const cassini = Math.exp(-(((t - 0.62) / 0.03) ** 2));
    alpha *= 1 - cassini * 0.92;
    // 内环 C 环更暗
    if (t < 0.25) alpha *= 0.55;
    const bright = 0.75 + bands * 0.35;
    for (let y = 0; y < 8; y++) {
      const i = (y * w + x) * 4;
      img.data[i] = Math.min(255, base[0] * bright);
      img.data[i + 1] = Math.min(255, base[1] * bright);
      img.data[i + 2] = Math.min(255, base[2] * bright);
      img.data[i + 3] = Math.max(0, Math.min(255, alpha * 255));
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

/** 地球云层：独立于地表的半透明白云（RGBA），单独一层球壳缓慢旋转 */
export function createCloudCanvas(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(W, H);
  for (let y = 0; y < H; y++) {
    const v = y / H;
    for (let x = 0; x < W; x++) {
      const u = x / W;
      const n = fbm(u * 5 + 13, v * 5, 5, 137, 4);
      const wisp = fbm(u * 14 + 3, v * 14, 14, 61, 3);
      const a = Math.max(0, n - 0.5) * 2.6 * (0.55 + wisp * 0.6);
      const i = (y * W + x) * 4;
      img.data[i] = 255;
      img.data[i + 1] = 253;
      img.data[i + 2] = 250;
      img.data[i + 3] = Math.min(230, a * 255);
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

/** 地球夜面城市灯光：在陆地上撒暖黄色光点（含都市光斑聚簇），作 emissiveMap */
export function createCityLightsCanvas(earthCanvas: HTMLCanvasElement): HTMLCanvasElement {
  const src = earthCanvas.getContext("2d")!.getImageData(0, 0, W, H).data;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);

  const isLand = (x: number, y: number) => {
    const i = (y * W + x) * 4;
    const r = src[i];
    const g = src[i + 1];
    const b = src[i + 2];
    // 排除海洋（蓝主导）、冰盖/云（接近白）
    return g >= b - 8 && b < 190 && !(r > 225 && g > 225 && b > 225);
  };

  // 都市光斑：陆地上找 70 个种子，向周围撒高斯分布的光点簇
  let placed = 0;
  for (let tries = 0; tries < 4000 && placed < 70; tries++) {
    const cx = Math.floor(hash2(tries, 5, 401) * W);
    const cy = Math.floor((0.15 + hash2(tries, 6, 401) * 0.7) * H);
    if (!isLand(cx, cy)) continue;
    placed++;
    const cluster = 24 + Math.floor(hash2(tries, 7, 401) * 50);
    for (let j = 0; j < cluster; j++) {
      const ang = hash2(tries, j * 2 + 8, 401) * Math.PI * 2;
      const rad = hash2(tries, j * 2 + 9, 401) ** 1.6 * 9;
      const x = Math.round(cx + Math.cos(ang) * rad * 1.6);
      const y = Math.round(cy + Math.sin(ang) * rad);
      if (x < 0 || x >= W || y < 0 || y >= H || !isLand(x, y)) continue;
      const a = 0.35 + hash2(x, y, 77) * 0.65;
      ctx.fillStyle = `rgba(255,196,120,${a})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  // 零星村镇光点
  for (let i = 0; i < 5000; i++) {
    const x = Math.floor(hash2(i, 11, 733) * W);
    const y = Math.floor((0.12 + hash2(i, 12, 733) * 0.76) * H);
    if (!isLand(x, y) || hash2(i, 13, 733) > 0.24) continue;
    ctx.fillStyle = `rgba(255,208,140,${0.25 + hash2(i, 14, 733) * 0.4})`;
    ctx.fillRect(x, y, 1, 1);
  }
  return canvas;
}

/** 太阳辉光 sprite：径向渐变 */
export function createGlowCanvas(): HTMLCanvasElement {
  const s = 256;
  const canvas = document.createElement("canvas");
  canvas.width = s;
  canvas.height = s;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, "rgba(255,220,150,0.85)");
  g.addColorStop(0.25, "rgba(255,170,70,0.4)");
  g.addColorStop(0.55, "rgba(255,120,40,0.12)");
  g.addColorStop(1, "rgba(255,100,30,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  return canvas;
}

/** 星点 sprite：柔边小圆点，给 Points 用 */
export function createStarCanvas(): HTMLCanvasElement {
  const s = 32;
  const canvas = document.createElement("canvas");
  canvas.width = s;
  canvas.height = s;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.4, "rgba(255,255,255,0.5)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  return canvas;
}
