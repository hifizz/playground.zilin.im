/**
 * 太阳系点云版：所有天体由粒子云构成。
 *
 * 与实体版（../solar-system/scene.ts）的区别：
 * - 每个天体是一份 THREE.Points + 自定义 ShaderMaterial：在球面上均匀采样,
 *   逐点从同一套程序化贴图（../solar-system/textures.ts）取色——木星条纹、
 *   地球大陆、土星环的卡西尼缝在粒子形态下依然可辨认。
 * - 昼夜明暗在顶点着色器里算：把太阳方向变换到天体本地坐标后与法线点乘,
 *   粒子云也有明暗交界线。
 * - 开场是「星尘汇聚」：粒子从四散的随机位置按各自相位飞回球面成形,
 *   可随时重放；粒子始终带轻微闪烁。
 * - 行星环 / 轨道线也粒子化（环按贴图 alpha 做拒绝采样，密度即亮度）。
 *
 * 数据（planets.ts）、交互模型（点击聚焦 + 相机跟随 + 面板回调）与实体版一致。
 */

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  CSS2DObject,
  CSS2DRenderer,
} from "three/addons/renderers/CSS2DRenderer.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { BODIES, type Body } from "../solar-system/planets";
import {
  createBodyCanvas,
  createGlowCanvas,
  createStarCanvas,
} from "../solar-system/textures";

export type SolarPointsHandles = {
  focus(id: string | null): void;
  setTimeScale(v: number): void;
  setPaused(v: boolean): void;
  setShowOrbits(v: boolean): void;
  setShowLabels(v: boolean): void;
  setGalaxy(v: boolean): void;
  resetView(): void;
  replayAssembly(): void;
  // —— 手势控制 API ——
  pickAt(clientX: number, clientY: number): string | null;
  orbitBy(dx: number, dy: number): void;
  dollyBy(factor: number): void;
  hoverBody(id: string | null): void;
  dispose(): void;
};

type CloudUniforms = {
  uAssemble: { value: number };
  uMorph: { value: number };
  uWorldToLocal: { value: THREE.Matrix4 };
  uTime: { value: number };
  uSize: { value: number };
  uPixelRatio: { value: number };
  uSunDir: { value: THREE.Vector3 };
  uLit: { value: number };
};

type PlanetNode = {
  body: Body;
  anchor: THREE.Group;
  tiltGroup: THREE.Group;
  points: THREE.Points; // 球体粒子（绕自身 Y 轴自转）
  uniforms: CloudUniforms;
  ringUniforms: CloudUniforms | null;
  hit: THREE.Mesh;
  label: CSS2DObject;
  angle: number;
  orbitSpeed: number;
  spinSpeed: number;
  baseSize: number;
};

const ORBIT_DAYS_PER_SEC = 4;
const SPIN_VISUAL = 0.09;
const DEFAULT_CAM = new THREE.Vector3(0, 24, 46);
const IDLE_RESUME_MS = 18000;
const ASSEMBLE_DURATION = 3.2; // 汇聚动画时长（秒）

function seededRand(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- 点云着色器 ----------

const VERT = /* glsl */ `
  attribute vec3 aScatter;   // 汇聚动画的出发位置
  attribute vec3 aGalaxy;    // 星系形态的目标位置（世界坐标）
  attribute vec3 aColor;     // 从程序化贴图采样的颜色
  attribute float aRand;     // 每粒子随机相位

  uniform float uAssemble;   // 0 = 四散, 1 = 成形
  uniform float uMorph;      // 0 = 太阳系, 1 = 螺旋星系
  uniform mat4 uWorldToLocal; // 世界 → 本体局部（星系目标固定在世界系，天体还在公转）
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform vec3 uSunDir;      // 天体本地坐标系下指向太阳的方向
  uniform float uLit;        // 1 = 计算昼夜, 0 = 自发光（太阳/环）

  varying vec3 vColor;
  varying float vLight;

  void main() {
    // 各粒子带相位差地汇聚，后出发的粒子最后就位
    float t = clamp(uAssemble * 1.7 - aRand * 0.7, 0.0, 1.0);
    t = t * t * (3.0 - 2.0 * t);
    vec3 pos = mix(aScatter, position, t);

    // 星系 morph：目标点是世界坐标，先变换回本体局部系再混合，
    // 这样即使天体仍在公转/自转，星系形态在世界中也是静止的
    float m = clamp(uMorph * 1.6 - aRand * 0.6, 0.0, 1.0);
    m = m * m * (3.0 - 2.0 * m);
    vec3 galaxyLocal = (uWorldToLocal * vec4(aGalaxy, 1.0)).xyz;
    pos = mix(pos, galaxyLocal, m);

    vec3 n = normalize(position);
    float diff = max(dot(n, normalize(uSunDir)), 0.0);
    vLight = mix(mix(1.0, 0.3 + 0.9 * diff, uLit), 1.0, m * 0.85);
    vColor = aColor;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    float twinkle = 0.82 + 0.36 * sin(uTime * 2.2 + aRand * 31.0);
    gl_PointSize = uSize * uPixelRatio * twinkle * (26.0 / -mv.z) * mix(1.0, 0.82, m);
    gl_Position = projectionMatrix * mv;
  }
`;

// 行星：圆形硬边粒子 + 深度写入，靠深度缓冲正确遮挡
const FRAG_SOLID = /* glsl */ `
  varying vec3 vColor;
  varying float vLight;
  void main() {
    if (length(gl_PointCoord - 0.5) > 0.46) discard;
    gl_FragColor = vec4(vColor * vLight, 1.0);
  }
`;

// 太阳：软边 + 加色混合，粒子互相叠亮
const FRAG_GLOW = /* glsl */ `
  varying vec3 vColor;
  varying float vLight;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.05, d);
    gl_FragColor = vec4(vColor * vLight * a, a);
  }
`;

function makeCloudMaterial(opts: {
  size: number;
  pixelRatio: number;
  lit: boolean;
  glow?: boolean;
}): { material: THREE.ShaderMaterial; uniforms: CloudUniforms } {
  const uniforms: CloudUniforms = {
    uAssemble: { value: 0 },
    uMorph: { value: 0 },
    uWorldToLocal: { value: new THREE.Matrix4() },
    uTime: { value: 0 },
    uSize: { value: opts.size },
    uPixelRatio: { value: opts.pixelRatio },
    uSunDir: { value: new THREE.Vector3(0, 1, 0) },
    uLit: { value: opts.lit ? 1 : 0 },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: VERT,
    fragmentShader: opts.glow ? FRAG_GLOW : FRAG_SOLID,
    transparent: !!opts.glow,
    depthWrite: !opts.glow,
    blending: opts.glow ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
  return { material, uniforms };
}

// ---------- 螺旋星系形态：3 旋臂 + 中央核球（世界坐标） ----------

type GalaxyKind = "core" | "arm";

/** 生成一个星系目标点。core = 核球（太阳粒子），arm = 旋臂（行星/环/月球粒子） */
function galaxyPoint(rand: () => number, kind: GalaxyKind, out: Float32Array, i: number) {
  const gauss = () => rand() + rand() + rand() - 1.5; // 近似高斯
  if (kind === "core") {
    // 核球：密集小球体，略压扁
    const r = 1.2 + 4.5 * rand() ** 1.7;
    const z = rand() * 2 - 1;
    const t = rand() * Math.PI * 2;
    const s = Math.sqrt(1 - z * z);
    out[i] = s * Math.cos(t) * r;
    out[i + 1] = z * r * 0.55;
    out[i + 2] = s * Math.sin(t) * r;
    return;
  }
  // 旋臂：对数螺线 + 高斯散布，越靠外越薄
  const arm = Math.floor(rand() * 3);
  const r = 5 + 27 * Math.sqrt(rand());
  const theta =
    r * 0.3 + (arm * Math.PI * 2) / 3 + gauss() * (0.5 - (r / 32) * 0.32);
  out[i] = Math.cos(theta) * r + gauss() * 1.1;
  out[i + 1] = gauss() * 1.7 * Math.exp(-r / 16);
  out[i + 2] = Math.sin(theta) * r + gauss() * 1.1;
}

/** 球面均匀采样 + 从贴图取色，生成点云 geometry */
function makeSphereCloud(
  body: Body,
  count: number,
  rand: () => number,
  opts: { radiusJitter?: number; brighten?: number; galaxy?: GalaxyKind } = {},
): THREE.BufferGeometry {
  const canvas = createBodyCanvas(body.id === "moon-visual" ? "moon" : body.id);
  const ctx = canvas.getContext("2d")!;
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const W = canvas.width;
  const H = canvas.height;

  const pos = new Float32Array(count * 3);
  const scatter = new Float32Array(count * 3);
  const galaxy = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const rnd = new Float32Array(count);
  const brighten = opts.brighten ?? 1;

  for (let i = 0; i < count; i++) {
    galaxyPoint(rand, opts.galaxy ?? "arm", galaxy, i * 3);
    // 球面均匀分布
    const z = rand() * 2 - 1;
    const theta = rand() * Math.PI * 2;
    const s = Math.sqrt(1 - z * z);
    const nx = s * Math.cos(theta);
    const ny = z;
    const nz = s * Math.sin(theta);
    const jitter = 1 + (opts.radiusJitter ?? 0) * (rand() - 0.5);
    const r = body.radius * jitter;
    pos[i * 3] = nx * r;
    pos[i * 3 + 1] = ny * r;
    pos[i * 3 + 2] = nz * r;

    // 汇聚出发点：大半径随机球壳
    const sr = body.radius * (10 + rand() * 26);
    const sz = rand() * 2 - 1;
    const st = rand() * Math.PI * 2;
    const ss = Math.sqrt(1 - sz * sz);
    scatter[i * 3] = ss * Math.cos(st) * sr;
    scatter[i * 3 + 1] = sz * sr * 0.6;
    scatter[i * 3 + 2] = ss * Math.sin(st) * sr;

    // 经纬 → 贴图 UV 取色
    const u = Math.atan2(nz, nx) / (Math.PI * 2) + 0.5;
    const v = Math.acos(THREE.MathUtils.clamp(ny, -1, 1)) / Math.PI;
    const px = Math.min(W - 1, Math.floor(u * W));
    const py = Math.min(H - 1, Math.floor(v * H));
    const o = (py * W + px) * 4;
    col[i * 3] = Math.min(1, (img[o] / 255) * brighten);
    col[i * 3 + 1] = Math.min(1, (img[o + 1] / 255) * brighten);
    col[i * 3 + 2] = Math.min(1, (img[o + 2] / 255) * brighten);

    rnd[i] = rand();
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("aScatter", new THREE.BufferAttribute(scatter, 3));
  geo.setAttribute("aGalaxy", new THREE.BufferAttribute(galaxy, 3));
  geo.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
  geo.setAttribute("aRand", new THREE.BufferAttribute(rnd, 1));
  return geo;
}

/** 行星环点云：半径方向按环贴图的 alpha 做拒绝采样，密度即亮度 */
function makeRingCloud(
  ring: NonNullable<Body["ring"]>,
  count: number,
  rand: () => number,
): THREE.BufferGeometry {
  // 与实体版一致的径向分布（含卡西尼缝），这里直接重算 alpha 曲线
  const alphaAt = (t: number) => {
    let a = 0.35 + 0.65 * Math.abs(Math.sin(t * 40) * Math.sin(t * 13 + 2));
    a *= Math.min(1, t / 0.08) * Math.min(1, (1 - t) / 0.06);
    a *= 1 - Math.exp(-(((t - 0.62) / 0.03) ** 2)) * 0.92;
    if (t < 0.25) a *= 0.55;
    return Math.max(0, Math.min(1, a));
  };

  const pos = new Float32Array(count * 3);
  const scatter = new Float32Array(count * 3);
  const galaxy = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const rnd = new Float32Array(count);
  const base = new THREE.Color("#d8c8a8");

  for (let i = 0; i < count; i++) {
    galaxyPoint(rand, "arm", galaxy, i * 3);
    // 面积均匀 + alpha 拒绝采样
    let t = 0.5;
    for (let tries = 0; tries < 12; tries++) {
      const rr = Math.sqrt(
        THREE.MathUtils.lerp(ring.inner ** 2, ring.outer ** 2, rand()),
      );
      t = (rr - ring.inner) / (ring.outer - ring.inner);
      if (rand() < alphaAt(t)) break;
    }
    const r = THREE.MathUtils.lerp(ring.inner, ring.outer, t);
    const a = rand() * Math.PI * 2;
    pos[i * 3] = Math.cos(a) * r;
    pos[i * 3 + 1] = (rand() - 0.5) * 0.03;
    pos[i * 3 + 2] = Math.sin(a) * r;

    const sr = r * (6 + rand() * 14);
    const sa = rand() * Math.PI * 2;
    scatter[i * 3] = Math.cos(sa) * sr;
    scatter[i * 3 + 1] = (rand() - 0.5) * sr * 0.5;
    scatter[i * 3 + 2] = Math.sin(sa) * sr;

    const bright = (0.55 + rand() * 0.45) * ring.opacity;
    col[i * 3] = base.r * bright;
    col[i * 3 + 1] = base.g * bright;
    col[i * 3 + 2] = base.b * bright;
    rnd[i] = rand();
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("aScatter", new THREE.BufferAttribute(scatter, 3));
  geo.setAttribute("aGalaxy", new THREE.BufferAttribute(galaxy, 3));
  geo.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
  geo.setAttribute("aRand", new THREE.BufferAttribute(rnd, 1));
  return geo;
}

export function createSolarPoints(
  container: HTMLElement,
  onSelect: (id: string | null) => void,
): SolarPointsHandles {
  const disposables: { dispose(): void }[] = [];
  const track = <T extends { dispose(): void }>(d: T): T => {
    disposables.push(d);
    return d;
  };

  // DPR 按窗口面积设上限：bloom 的 HalfFloat 渲染目标在高分大屏上会打爆
  // 显存（分配失败时画布只剩部分内容/黑块）。dprScale 由性能自适应控制
  let dprScale = 1;
  const capDpr = (w: number, h: number) =>
    Math.max(
      0.55,
      Math.min(window.devicePixelRatio, 2, Math.sqrt(4.2e6 / Math.max(1, w * h))) * dprScale,
    );

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance",
  });
  const pixelRatio = capDpr(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.domElement.style.display = "block";
  container.appendChild(renderer.domElement);

  const onCtxLost = (e: Event) => {
    e.preventDefault();
    console.warn("WebGL context lost — 等待恢复");
  };
  const onCtxRestored = () => resize();
  renderer.domElement.addEventListener("webglcontextlost", onCtxLost);
  renderer.domElement.addEventListener("webglcontextrestored", onCtxRestored);

  const labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(container.clientWidth, container.clientHeight);
  Object.assign(labelRenderer.domElement.style, {
    position: "absolute",
    inset: "0",
    pointerEvents: "none",
  });
  container.appendChild(labelRenderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x020208);

  const camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.1,
    2000,
  );
  camera.position.set(0, 60, 130);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = 4;
  controls.maxDistance = 160;
  controls.autoRotate = false;
  controls.autoRotateSpeed = 0.4;

  // ---------- 后处理：Bloom（加色叠亮的太阳粒子与汇聚星尘会晕开成霓虹） ----------
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(container.clientWidth, container.clientHeight),
    0.55, // strength：只让太阳粒子与星尘晕开，别冲淡行星本色
    0.5, // radius
    0.62, // threshold
  );
  composer.addPass(bloomPass);
  composer.addPass(new OutputPass());

  // ---------- 性能自适应：持续低帧率时逐级降画质 ----------
  let perfLevel = 0;
  const PERF_DPR = [1, 0.85, 0.7, 0.55];
  const applyPerfLevel = () => {
    dprScale = PERF_DPR[perfLevel];
    bloomPass.strength = perfLevel >= 2 ? 0.35 : 0.55;
    applySize();
    console.info(
      `[solar-points] 帧率偏低，画质自适应 → L${perfLevel}（渲染分辨率 ×${dprScale}）`,
    );
  };

  // ---------- 星空 ----------
  const starTex = track(new THREE.CanvasTexture(createStarCanvas()));
  {
    const rand = seededRand(2024);
    const n = 2600;
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    const c = new THREE.Color();
    for (let i = 0; i < n; i++) {
      const r = 300 + rand() * 500;
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(rand() * 2 - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.cos(phi);
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      c.setHSL(0.55 + rand() * 0.12, rand() * 0.5, 0.65 + rand() * 0.35);
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    const geo = track(new THREE.BufferGeometry());
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const mat = track(
      new THREE.PointsMaterial({
        size: 2.2,
        map: starTex,
        transparent: true,
        vertexColors: true,
        depthWrite: false,
        sizeAttenuation: false,
      }),
    );
    scene.add(new THREE.Points(geo, mat));
  }

  // ---------- 天体点云 ----------
  const planets: PlanetNode[] = [];
  const hitMeshes: THREE.Mesh[] = [];
  const orbitClouds: THREE.Points[] = [];
  const allCloudUniforms: CloudUniforms[] = [];
  // 所有点云对象（含环/月球），星系 morph 时逐个回传 world→local 矩阵
  const clouds: { obj: THREE.Points; uniforms: CloudUniforms }[] = [];
  const rand = seededRand(7);

  const makeLabel = (body: Body) => {
    const el = document.createElement("div");
    el.textContent = body.name;
    Object.assign(el.style, {
      color: "rgba(255,255,255,0.72)",
      fontSize: "11px",
      letterSpacing: "0.16em",
      textShadow: "0 0 6px rgba(0,0,0,0.9)",
      whiteSpace: "nowrap",
      userSelect: "none",
    });
    const label = new CSS2DObject(el);
    label.position.set(0, body.radius * 1.55 + 0.5, 0);
    return label;
  };

  let sunPoints!: THREE.Points;
  let sunUniforms!: CloudUniforms;
  let sunGlow!: THREE.Sprite;
  let sunTilt!: THREE.Group;
  let sunLabel!: CSS2DObject;

  for (const body of BODIES) {
    if (body.kind === "comet") continue; // 彗星仅在实体版实现
    const isSun = body.id === "sun";
    // 粒子数 ∝ 表面积，太阳密一些做发光体
    const count = isSun
      ? 16000
      : Math.round(THREE.MathUtils.clamp(4200 * body.radius ** 2, 1600, 13000));

    const geo = track(
      makeSphereCloud(body, count, rand, {
        radiusJitter: isSun ? 0.1 : 0.03,
        brighten: isSun ? 1.15 : 1.05,
        galaxy: isSun ? "core" : "arm", // 星系形态：太阳粒子归入银心核球
      }),
    );
    const { material, uniforms } = makeCloudMaterial({
      size: isSun ? 2.6 : THREE.MathUtils.clamp(body.radius * 1.6, 1.5, 2.6),
      pixelRatio,
      lit: !isSun,
      glow: isSun,
    });
    track(material);
    allCloudUniforms.push(uniforms);

    const points = new THREE.Points(geo, material);
    points.frustumCulled = false; // 汇聚动画期间粒子在包围球外
    clouds.push({ obj: points, uniforms });

    const tiltGroup = new THREE.Group();
    tiltGroup.rotation.z = THREE.MathUtils.degToRad(body.tiltDeg);
    tiltGroup.add(points);

    const anchor = new THREE.Group();
    anchor.add(tiltGroup);

    const hitGeo = track(
      new THREE.SphereGeometry(Math.max(body.radius * 1.7, 0.9), 12, 8),
    );
    const hitMat = track(new THREE.MeshBasicMaterial({ visible: false }));
    const hit = new THREE.Mesh(hitGeo, hitMat);
    hit.userData.bodyId = body.id;
    anchor.add(hit);
    hitMeshes.push(hit);

    const label = makeLabel(body);
    anchor.add(label);
    scene.add(anchor);

    let ringUniforms: CloudUniforms | null = null;
    if (body.ring) {
      const ringCount = body.id === "saturn" ? 7000 : 1800;
      const ringGeo = track(makeRingCloud(body.ring, ringCount, rand));
      const made = makeCloudMaterial({ size: 1.3, pixelRatio, lit: false });
      track(made.material);
      ringUniforms = made.uniforms;
      allCloudUniforms.push(made.uniforms);
      const ringPoints = new THREE.Points(ringGeo, made.material);
      ringPoints.frustumCulled = false;
      clouds.push({ obj: ringPoints, uniforms: made.uniforms });
      tiltGroup.add(ringPoints);
    }

    if (isSun) {
      sunPoints = points;
      sunUniforms = uniforms;
      sunTilt = tiltGroup;
      const glowTex = track(new THREE.CanvasTexture(createGlowCanvas()));
      const glowMat = track(
        new THREE.SpriteMaterial({
          map: glowTex,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          transparent: true,
          opacity: 0.8,
        }),
      );
      sunGlow = new THREE.Sprite(glowMat);
      sunGlow.scale.setScalar(body.radius * 6);
      anchor.add(sunGlow);
      label.position.y = body.radius * 1.3 + 0.6;
      sunLabel = label;
      continue;
    }

    // 轨道：粒子化虚线
    {
      const n = 240;
      const pos = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        pos[i * 3] = Math.cos(a) * body.orbitRadius;
        pos[i * 3 + 1] = 0;
        pos[i * 3 + 2] = Math.sin(a) * body.orbitRadius;
      }
      const geoO = track(new THREE.BufferGeometry());
      geoO.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      const matO = track(
        new THREE.PointsMaterial({
          size: 1.4,
          color: 0x8899bb,
          transparent: true,
          opacity: 0.3,
          depthWrite: false,
          sizeAttenuation: false,
        }),
      );
      const cloud = new THREE.Points(geoO, matO);
      orbitClouds.push(cloud);
      scene.add(cloud);
    }

    planets.push({
      body,
      anchor,
      tiltGroup,
      points,
      uniforms,
      ringUniforms,
      hit,
      label,
      angle: rand() * Math.PI * 2,
      orbitSpeed: (Math.PI * 2) / body.orbitDays,
      spinSpeed: ((Math.PI * 2 * 24) / body.dayHours) * SPIN_VISUAL,
      baseSize: (material.uniforms.uSize as { value: number }).value,
    });
  }

  const sunSpin = ((Math.PI * 2 * 24) / 609.6) * SPIN_VISUAL;

  // ---------- 月球点云 ----------
  const earthNode = planets.find((p) => p.body.id === "earth")!;
  const moonPivot = new THREE.Group();
  let moonUniforms: CloudUniforms;
  let moonPoints: THREE.Points;
  {
    const moonBody = {
      ...earthNode.body,
      id: "moon-visual",
      radius: 0.17,
    } as Body;
    const geo = track(makeSphereCloud(moonBody, 700, rand, { brighten: 1.1 }));
    const made = makeCloudMaterial({ size: 1.4, pixelRatio, lit: true });
    track(made.material);
    moonUniforms = made.uniforms;
    allCloudUniforms.push(made.uniforms);
    moonPoints = new THREE.Points(geo, made.material);
    moonPoints.frustumCulled = false;
    moonPoints.position.x = 1.35;
    clouds.push({ obj: moonPoints, uniforms: made.uniforms });
    moonPivot.add(moonPoints);
    earthNode.anchor.add(moonPivot);
  }

  // ---------- 小行星带 ----------
  let belt: THREE.Points;
  {
    const n = 1600;
    const pos = new Float32Array(n * 3);
    const beltRand = seededRand(99);
    for (let i = 0; i < n; i++) {
      const a = beltRand() * Math.PI * 2;
      const r = 16.2 + beltRand() * 2.4;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = (beltRand() - 0.5) * 0.7;
      pos[i * 3 + 2] = Math.sin(a) * r;
    }
    const geo = track(new THREE.BufferGeometry());
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const mat = track(
      new THREE.PointsMaterial({
        size: 1.6,
        color: 0x9a8f80,
        map: starTex,
        transparent: true,
        opacity: 0.75,
        depthWrite: false,
        sizeAttenuation: false,
      }),
    );
    belt = new THREE.Points(geo, mat);
    scene.add(belt);
  }

  // ---------- 交互状态（与实体版同构） ----------
  let timeScale = 1;
  let paused = false;
  let selected: PlanetNode | "sun" | null = null;
  let hovered: PlanetNode | null = null;
  let disposed = false;
  let idleTimer: ReturnType<typeof setTimeout> | null = null;
  let introDone = false;
  let assembleT = 0; // 0..1 汇聚进度
  let galaxyOn = false;
  let morphT = 0; // 0..1 星系形态进度
  let userOrbits = true;
  let userLabels = true;

  // 星系模式下隐藏太阳系专属元素（轨道/标签/小行星带/太阳辉光）
  const applyVisibility = () => {
    for (const c of orbitClouds) c.visible = userOrbits && !galaxyOn;
    for (const p of planets) p.label.visible = userLabels && !galaxyOn;
    sunLabel.visible = userLabels && !galaxyOn;
    belt.visible = !galaxyOn;
    sunGlow.visible = !galaxyOn;
  };

  const prevSelectedPos = new THREE.Vector3();

  type CamAnim = {
    t: number;
    dur: number;
    fromPos: THREE.Vector3;
    fromTarget: THREE.Vector3;
    toPos: () => THREE.Vector3;
    toTarget: () => THREE.Vector3;
    onDone?: () => void;
  };
  let camAnim: CamAnim | null = null;

  const startCamAnim = (
    toPos: () => THREE.Vector3,
    toTarget: () => THREE.Vector3,
    dur = 1.5,
    onDone?: () => void,
  ) => {
    camAnim = {
      t: 0,
      dur,
      fromPos: camera.position.clone(),
      fromTarget: controls.target.clone(),
      toPos,
      toTarget,
      onDone,
    };
  };

  startCamAnim(
    () => DEFAULT_CAM.clone(),
    () => new THREE.Vector3(0, 0, 0),
    2.6,
    () => {
      introDone = true;
      controls.autoRotate = true;
    },
  );

  const kickIdleTimer = () => {
    controls.autoRotate = false;
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (!selected && introDone) controls.autoRotate = true;
    }, IDLE_RESUME_MS);
  };
  controls.addEventListener("start", kickIdleTimer);

  const nodeById = (id: string) => planets.find((p) => p.body.id === id);

  const focusDistance = (node: PlanetNode | "sun") => {
    if (node === "sun") return BODIES[0].radius * 4.2;
    const r = node.body.ring ? node.body.radius * node.body.ring.outer : node.body.radius;
    return Math.max(r * 5, 3.6);
  };

  const worldPosOf = (node: PlanetNode | "sun", out: THREE.Vector3) => {
    if (node === "sun") return out.set(0, 0, 0);
    return node.anchor.getWorldPosition(out);
  };

  const focus = (id: string | null) => {
    if (disposed) return;
    const next = id === "sun" ? ("sun" as const) : id ? nodeById(id) ?? null : null;
    if (next === selected) return;
    selected = next;
    controls.autoRotate = false;
    if (idleTimer) clearTimeout(idleTimer);

    if (!selected) {
      startCamAnim(
        () => DEFAULT_CAM.clone(),
        () => new THREE.Vector3(0, 0, 0),
        1.4,
        () => {
          idleTimer = setTimeout(() => {
            if (!selected) controls.autoRotate = true;
          }, IDLE_RESUME_MS);
        },
      );
      return;
    }

    const sel = selected;
    const target = new THREE.Vector3();
    worldPosOf(sel, target);
    prevSelectedPos.copy(target);
    const dist = focusDistance(sel);
    startCamAnim(
      () => {
        const p = worldPosOf(sel, new THREE.Vector3());
        const dir = camera.position.clone().sub(p).normalize();
        dir.y = Math.max(dir.y, 0.28);
        dir.normalize();
        return p.clone().add(dir.multiplyScalar(dist));
      },
      () => worldPosOf(sel, new THREE.Vector3()),
      1.5,
    );
  };

  // ---------- 点击 / 悬停 ----------
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let downX = 0;
  let downY = 0;

  const pickAt = (clientX: number, clientY: number): string | null => {
    if (galaxyOn) return null; // 星系形态下天体已散开
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -(((clientY - rect.top) / rect.height) * 2 - 1),
    );
    raycaster.setFromCamera(pointer, camera);
    const hitList = raycaster.intersectObjects(hitMeshes, false);
    return hitList.length ? (hitList[0].object.userData.bodyId as string) : null;
  };
  const pick = (ev: PointerEvent) => pickAt(ev.clientX, ev.clientY);

  const onPointerDown = (ev: PointerEvent) => {
    downX = ev.clientX;
    downY = ev.clientY;
  };
  const onPointerUp = (ev: PointerEvent) => {
    if (galaxyOn) return; // 星系形态下天体已散作星尘，不可选中
    if (Math.hypot(ev.clientX - downX, ev.clientY - downY) > 6) return;
    const id = pick(ev);
    if (id) {
      focus(id);
      onSelect(id);
    } else if (selected) {
      focus(null);
      onSelect(null);
    }
  };
  const onPointerMove = (ev: PointerEvent) => {
    if (galaxyOn) {
      hovered = null;
      renderer.domElement.style.cursor = "grab";
      return;
    }
    const id = pick(ev);
    hovered = id && id !== "sun" ? nodeById(id) ?? null : null;
    renderer.domElement.style.cursor = id ? "pointer" : "grab";
  };
  renderer.domElement.addEventListener("pointerdown", onPointerDown);
  renderer.domElement.addEventListener("pointerup", onPointerUp);
  renderer.domElement.addEventListener("pointermove", onPointerMove);

  // ---------- resize ----------
  const applySize = () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (!w || !h) return;
    const pr = capDpr(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(pr);
    renderer.setSize(w, h);
    composer.setPixelRatio(pr);
    composer.setSize(w, h);
    labelRenderer.setSize(w, h);
    for (const u of allCloudUniforms) u.uPixelRatio.value = pr;
  };
  const resize = () => {
    applySize();
    // 布局过渡期间尺寸可能未稳定，下一帧再校一次
    requestAnimationFrame(applySize);
  };
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  // ResizeObserver 覆盖不到 DPR 变化（换显示器 / 浏览器缩放），补 window resize
  window.addEventListener("resize", resize);
  // 标签页切回时强制重建一次，清掉合成器可能残留的陈旧帧
  const onVisible = () => {
    if (document.visibilityState === "visible") resize();
  };
  document.addEventListener("visibilitychange", onVisible);

  // ---------- 主循环 ----------
  const clock = new THREE.Clock();
  const tmp = new THREE.Vector3();
  const qTmp = new THREE.Quaternion();
  const dirTmp = new THREE.Vector3();
  let elapsed = 0;
  let rafId = 0;
  let nextSizeCheck = 0;
  let fpsWindow = performance.now();
  let fpsCount = 0;

  const frame = () => {
    if (disposed) return;
    rafId = requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.1);
    elapsed += dt;

    // 自愈：CSS 尺寸或绘制缓冲与预期失步时重设（重建缓冲会清掉陈旧帧）。
    // 按墙钟时间而非帧数检查，低帧率下也能及时恢复
    if (performance.now() >= nextSizeCheck) {
      nextSizeCheck = performance.now() + 1500;
      const el = renderer.domElement;
      const pr = renderer.getPixelRatio();
      if (
        Math.abs(el.clientWidth - container.clientWidth) > 2 ||
        Math.abs(el.clientHeight - container.clientHeight) > 2 ||
        Math.abs(el.width - Math.floor(container.clientWidth * pr)) > 4 ||
        Math.abs(el.height - Math.floor(container.clientHeight * pr)) > 4
      ) {
        applySize();
      }
    }

    // 性能采样：3s 窗口平均帧率持续 < 24 时降级（跳过后台停摆窗口）
    fpsCount++;
    {
      const nowMs = performance.now();
      const span = nowMs - fpsWindow;
      if (span >= 3000) {
        const fps = (fpsCount * 1000) / span;
        fpsWindow = nowMs;
        fpsCount = 0;
        if (
          span < 6000 &&
          document.visibilityState === "visible" &&
          fps < 24 &&
          perfLevel < PERF_DPR.length - 1
        ) {
          perfLevel++;
          applyPerfLevel();
        }
      }
    }
    const simDays = paused ? 0 : dt * ORBIT_DAYS_PER_SEC * timeScale;

    // 汇聚进度与闪烁不受暂停影响
    assembleT = Math.min(1, assembleT + dt / ASSEMBLE_DURATION);
    // 星系形态进度：匀速趋近目标（约 2.2s 完成）
    morphT += THREE.MathUtils.clamp((galaxyOn ? 1 : 0) - morphT, -dt / 2.2, dt / 2.2);
    for (const u of allCloudUniforms) {
      u.uAssemble.value = assembleT;
      u.uMorph.value = morphT;
      u.uTime.value = elapsed;
    }
    // 星系目标点固定在世界系：每帧回传各点云的 world→local 矩阵
    if (morphT > 0.0001) {
      for (const c of clouds) {
        c.uniforms.uWorldToLocal.value.copy(c.obj.matrixWorld).invert();
      }
    }

    // 公转 + 自转 + 昼夜方向
    for (const p of planets) {
      p.angle += p.orbitSpeed * simDays;
      p.anchor.position.set(
        Math.cos(p.angle) * p.body.orbitRadius,
        0,
        -Math.sin(p.angle) * p.body.orbitRadius,
      );
      p.points.rotation.y += p.spinSpeed * simDays;

      // 太阳方向 → 天体本地坐标（含自转与轴倾角）
      p.points.getWorldQuaternion(qTmp);
      dirTmp.copy(p.anchor.position).negate().normalize().applyQuaternion(qTmp.invert());
      p.uniforms.uSunDir.value.copy(dirTmp);

      const targetScale = selected === p ? 1.28 : hovered === p ? 1.1 : 1;
      const s = p.tiltGroup.scale.x + (targetScale - p.tiltGroup.scale.x) * Math.min(1, dt * 8);
      p.tiltGroup.scale.setScalar(s);
      // 选中时粒子略增大，补偿点云放大后的间隙
      p.uniforms.uSize.value = p.baseSize * (1 + (s - 1) * 0.6);
      if (p.ringUniforms) p.ringUniforms.uSize.value = 1.3 * (1 + (s - 1) * 0.6);
    }
    sunPoints.rotation.y += sunSpin * simDays;
    moonPivot.rotation.y += ((Math.PI * 2) / 27.3) * simDays;
    belt.rotation.y += ((Math.PI * 2) / 1800) * simDays;

    // 月球昼夜
    moonPoints.getWorldQuaternion(qTmp);
    moonPoints.getWorldPosition(tmp);
    dirTmp.copy(tmp).negate().normalize().applyQuaternion(qTmp.invert());
    moonUniforms.uSunDir.value.copy(dirTmp);

    // 太阳呼吸
    sunGlow.scale.setScalar(BODIES[0].radius * (6 + Math.sin(elapsed * 1.4) * 0.35));
    sunUniforms.uSize.value = 2.6 + Math.sin(elapsed * 1.8) * 0.25;
    const sunScale = selected === "sun" ? 1.12 : 1;
    sunTilt.scale.setScalar(
      sunTilt.scale.x + (sunScale - sunTilt.scale.x) * Math.min(1, dt * 8),
    );

    // 相机动画 / 跟随（与实体版一致）
    if (camAnim) {
      camAnim.t += dt;
      const k = Math.min(1, camAnim.t / camAnim.dur);
      const e = k * k * (3 - 2 * k);
      camera.position.lerpVectors(camAnim.fromPos, camAnim.toPos(), e);
      controls.target.lerpVectors(camAnim.fromTarget, camAnim.toTarget(), e);
      if (selected && selected !== "sun") worldPosOf(selected, prevSelectedPos);
      if (k >= 1) {
        const done = camAnim.onDone;
        camAnim = null;
        done?.();
      }
    } else if (selected && selected !== "sun") {
      worldPosOf(selected, tmp);
      const delta = tmp.clone().sub(prevSelectedPos);
      camera.position.add(delta);
      controls.target.copy(tmp);
      prevSelectedPos.copy(tmp);
    }

    controls.update();
    composer.render();
    labelRenderer.render(scene, camera);
  };
  frame();

  return {
    focus,
    setTimeScale(v) {
      timeScale = v;
    },
    setPaused(v) {
      paused = v;
    },
    setShowOrbits(v) {
      userOrbits = v;
      applyVisibility();
    },
    setShowLabels(v) {
      userLabels = v;
      applyVisibility();
    },
    setGalaxy(v) {
      if (galaxyOn === v) return;
      galaxyOn = v;
      selected = null;
      applyVisibility();
      if (idleTimer) clearTimeout(idleTimer);
      if (v) {
        // 拉远俯瞰 + 自动环绕，欣赏旋臂
        controls.autoRotate = true;
        startCamAnim(
          () => new THREE.Vector3(0, 42, 66),
          () => new THREE.Vector3(0, 0, 0),
          2.2,
        );
      } else {
        controls.autoRotate = false;
        startCamAnim(
          () => DEFAULT_CAM.clone(),
          () => new THREE.Vector3(0, 0, 0),
          1.6,
          () => {
            idleTimer = setTimeout(() => {
              if (!selected && !galaxyOn) controls.autoRotate = true;
            }, IDLE_RESUME_MS);
          },
        );
      }
    },
    resetView() {
      selected = null;
      startCamAnim(
        () => DEFAULT_CAM.clone(),
        () => new THREE.Vector3(0, 0, 0),
        1.2,
      );
    },
    replayAssembly() {
      assembleT = 0;
    },
    pickAt,
    orbitBy(dx, dy) {
      if (camAnim) return;
      kickIdleTimer();
      const offset = camera.position.clone().sub(controls.target);
      const sph = new THREE.Spherical().setFromVector3(offset);
      sph.theta -= dx;
      sph.phi = THREE.MathUtils.clamp(sph.phi - dy, 0.05, Math.PI - 0.05);
      offset.setFromSpherical(sph);
      camera.position.copy(controls.target).add(offset);
    },
    dollyBy(factor) {
      if (camAnim) return;
      kickIdleTimer();
      const offset = camera.position.clone().sub(controls.target);
      offset.setLength(
        THREE.MathUtils.clamp(
          offset.length() * factor,
          controls.minDistance,
          controls.maxDistance,
        ),
      );
      camera.position.copy(controls.target).add(offset);
    },
    hoverBody(id) {
      hovered = !galaxyOn && id && id !== "sun" ? nodeById(id) ?? null : null;
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(rafId);
      if (idleTimer) clearTimeout(idleTimer);
      ro.disconnect();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisible);
      renderer.domElement.removeEventListener("webglcontextlost", onCtxLost);
      renderer.domElement.removeEventListener("webglcontextrestored", onCtxRestored);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      controls.dispose();
      for (const d of disposables) d.dispose();
      composer.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
      container.removeChild(labelRenderer.domElement);
    },
  };
}
