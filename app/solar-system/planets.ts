/**
 * 太阳系天体数据：科普信息（真实数据）+ 场景视觉参数（压缩比例）。
 *
 * 注意：为了在一屏内同时看清 8 颗行星，半径与轨道距离都做了非线性压缩，
 * 但「公转/自转的相对快慢」「轴倾角」「自转方向（金星/天王星逆行）」均按真实比例呈现。
 */

export type Body = {
  id: string;
  name: string; // 中文名
  enName: string;
  type: string; // 恒星 / 类地行星 / 气态巨行星 / 冰巨行星
  accent: string; // 面板与标签的主题色

  // —— 科普数据（真实） ——
  diameter: string;
  distance: string; // 距太阳
  orbitPeriodText: string;
  rotationPeriodText: string;
  moons: string;
  temperature: string;
  tiltText: string;
  fact: string; // 一条冷知识

  // —— 场景视觉参数（压缩比例） ——
  radius: number; // 场景中的球体半径
  orbitRadius: number; // 轨道半径，0 = 太阳
  orbitDays: number; // 真实公转周期（天）→ 决定公转角速度
  dayHours: number; // 真实自转周期（小时），负数 = 逆行自转
  tiltDeg: number; // 轴倾角（度）
  ring?: { inner: number; outer: number; opacity: number };
};

export const BODIES: Body[] = [
  {
    id: "sun",
    name: "太阳",
    enName: "Sun",
    type: "恒星 · G2V 黄矮星",
    accent: "#fbbf24",
    diameter: "1,392,700 km（地球的 109 倍）",
    distance: "距银河系中心约 2.6 万光年",
    orbitPeriodText: "绕银心一圈约 2.3 亿年",
    rotationPeriodText: "赤道约 25.4 天",
    moons: "8 颗行星 + 众多小天体",
    temperature: "表面约 5,500 °C",
    tiltText: "7.25°（相对黄道）",
    fact: "太阳占据了太阳系总质量的 99.86%，每秒将约 400 万吨物质转化为纯能量向外辐射。",
    radius: 3.2,
    orbitRadius: 0,
    orbitDays: 0,
    dayHours: 609.6,
    tiltDeg: 7.25,
  },
  {
    id: "mercury",
    name: "水星",
    enName: "Mercury",
    type: "类地行星",
    accent: "#a8a29e",
    diameter: "4,879 km",
    distance: "5,790 万 km（0.39 AU）",
    orbitPeriodText: "88 个地球日",
    rotationPeriodText: "58.6 个地球日",
    moons: "0",
    temperature: "-173 ~ 427 °C",
    tiltText: "0.03°",
    fact: "水星上一个「太阳日」（日出到下一次日出）约 176 个地球日——比它 88 天的一年还要长一倍。",
    radius: 0.4,
    orbitRadius: 6.5,
    orbitDays: 88,
    dayHours: 1407.6,
    tiltDeg: 0.03,
  },
  {
    id: "venus",
    name: "金星",
    enName: "Venus",
    type: "类地行星",
    accent: "#e8c47a",
    diameter: "12,104 km",
    distance: "1.082 亿 km（0.72 AU）",
    orbitPeriodText: "224.7 个地球日",
    rotationPeriodText: "243 个地球日（逆行）",
    moons: "0",
    temperature: "约 464 °C（最热的行星）",
    tiltText: "177.4°",
    fact: "金星自转方向与其他行星相反——在金星上，太阳从西边升起；浓密的 CO₂ 温室大气让它比更靠近太阳的水星还热。",
    radius: 0.62,
    orbitRadius: 8.8,
    orbitDays: 224.7,
    dayHours: -5832.5,
    tiltDeg: 177.4,
  },
  {
    id: "earth",
    name: "地球",
    enName: "Earth",
    type: "类地行星",
    accent: "#60a5fa",
    diameter: "12,756 km",
    distance: "1.496 亿 km（1 AU）",
    orbitPeriodText: "365.25 天",
    rotationPeriodText: "23.9 小时",
    moons: "1（月球）",
    temperature: "平均约 15 °C",
    tiltText: "23.4°",
    fact: "已知唯一存在生命的星球。23.4° 的轴倾角带来了四季；月球正以每年约 3.8 cm 的速度缓慢远离地球。",
    radius: 0.68,
    orbitRadius: 11.5,
    orbitDays: 365.25,
    dayHours: 23.9,
    tiltDeg: 23.4,
  },
  {
    id: "mars",
    name: "火星",
    enName: "Mars",
    type: "类地行星",
    accent: "#f87171",
    diameter: "6,792 km",
    distance: "2.279 亿 km（1.52 AU）",
    orbitPeriodText: "687 个地球日",
    rotationPeriodText: "24.6 小时",
    moons: "2（火卫一、火卫二）",
    temperature: "平均约 -65 °C",
    tiltText: "25.2°",
    fact: "火星拥有太阳系最高的火山——奥林帕斯山，高约 21.9 km，是珠穆朗玛峰的 2.5 倍；铁锈色来自地表的氧化铁。",
    radius: 0.52,
    orbitRadius: 14.2,
    orbitDays: 687,
    dayHours: 24.6,
    tiltDeg: 25.2,
  },
  {
    id: "jupiter",
    name: "木星",
    enName: "Jupiter",
    type: "气态巨行星",
    accent: "#d4a373",
    diameter: "142,984 km（地球的 11 倍）",
    distance: "7.786 亿 km（5.2 AU）",
    orbitPeriodText: "11.9 年",
    rotationPeriodText: "9.9 小时（最快）",
    moons: "95+",
    temperature: "云顶约 -110 °C",
    tiltText: "3.1°",
    fact: "大红斑是一场持续了至少 350 年的巨型反气旋风暴，宽度能并排放下 2~3 个地球；木星强大的引力像「吸尘器」一样替内太阳系挡下了许多彗星。",
    radius: 1.7,
    orbitRadius: 21,
    orbitDays: 4331,
    dayHours: 9.9,
    tiltDeg: 3.1,
  },
  {
    id: "saturn",
    name: "土星",
    enName: "Saturn",
    type: "气态巨行星",
    accent: "#e7cf9f",
    diameter: "120,536 km",
    distance: "14.3 亿 km（9.5 AU）",
    orbitPeriodText: "29.5 年",
    rotationPeriodText: "10.7 小时",
    moons: "146+",
    temperature: "云顶约 -140 °C",
    tiltText: "26.7°",
    fact: "土星的平均密度比水还小，理论上能浮在水面上；壮观的光环主要由冰粒和岩屑构成，直径超过 27 万 km，平均厚度却只有约 10 米。",
    radius: 1.45,
    orbitRadius: 26.5,
    orbitDays: 10747,
    dayHours: 10.7,
    tiltDeg: 26.7,
    ring: { inner: 1.9, outer: 2.9, opacity: 0.95 },
  },
  {
    id: "uranus",
    name: "天王星",
    enName: "Uranus",
    type: "冰巨行星",
    accent: "#7dd3fc",
    diameter: "51,118 km",
    distance: "28.7 亿 km（19.2 AU）",
    orbitPeriodText: "84 年",
    rotationPeriodText: "17.2 小时（逆行）",
    moons: "28",
    temperature: "云顶约 -195 °C",
    tiltText: "97.8°",
    fact: "自转轴倾角 97.8°，几乎是「躺着」绕太阳滚动——两极各自会经历长达 42 年的极昼与极夜；淡蓝绿色来自大气中的甲烷。",
    radius: 1.05,
    orbitRadius: 31.5,
    orbitDays: 30589,
    dayHours: -17.2,
    tiltDeg: 97.8,
    ring: { inner: 1.5, outer: 1.9, opacity: 0.35 },
  },
  {
    id: "neptune",
    name: "海王星",
    enName: "Neptune",
    type: "冰巨行星",
    accent: "#818cf8",
    diameter: "49,528 km",
    distance: "45 亿 km（30.1 AU）",
    orbitPeriodText: "164.8 年",
    rotationPeriodText: "16.1 小时",
    moons: "16",
    temperature: "云顶约 -200 °C",
    tiltText: "28.3°",
    fact: "海王星的风速可达 2,100 km/h，是太阳系之最；它也是唯一一颗先由数学计算预言位置、随后才被望远镜找到的行星。",
    radius: 1.0,
    orbitRadius: 35.5,
    orbitDays: 59800,
    dayHours: 16.1,
    tiltDeg: 28.3,
  },
];

export const PLANETS = BODIES.filter((b) => b.orbitRadius > 0);

export function bodyById(id: string | null): Body | undefined {
  return BODIES.find((b) => b.id === id);
}
