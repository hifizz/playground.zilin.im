/**
 * 太阳系 3D 场景（原生 Three.js，不依赖 R3F）。
 *
 * 架构：createSolarSystem() 在 useEffect 中调用，返回一组命令式句柄
 * （聚焦星球 / 调速 / 开关轨道标签 / 销毁），React 侧只管 UI 状态。
 *
 * 动画要点：
 * - 公转角速度 ∝ 1/真实公转周期，自转角速度 ∝ 1/真实自转周期（等比压缩，
 *   金星/天王星按真实数据逆行），轴倾角按真实角度摆放。
 * - 开场相机从远处推入 + 无操作时缓慢自动环绕（拖动即接管，闲置后恢复）。
 * - 点击星球：星球弹性放大 1.28 倍，相机沿当前视线方向飞近并持续跟随
 *   该星球公转；再次点击空白处或关闭面板，相机飞回全景。
 */

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  CSS2DObject,
  CSS2DRenderer,
} from "three/addons/renderers/CSS2DRenderer.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { BODIES, type Body } from "./planets";
import {
  createBodyCanvas,
  createCityLightsCanvas,
  createCloudCanvas,
  createGlowCanvas,
  createRingCanvas,
  createStarCanvas,
} from "./textures";

export type SolarSystemHandles = {
  focus(id: string | null): void;
  setTimeScale(v: number): void;
  setPaused(v: boolean): void;
  setShowOrbits(v: boolean): void;
  setShowLabels(v: boolean): void;
  /** 音画联动：传入取能量函数（0..1），太阳亮度/辉光/bloom 随之呼吸；null 解绑 */
  bindAudioLevel(fn: (() => number) | null): void;
  resetView(): void;
  // —— 手势控制 API ——
  pickAt(clientX: number, clientY: number): string | null;
  orbitBy(dx: number, dy: number): void; // 绕目标点旋转相机（弧度）
  dollyBy(factor: number): void; // 距离乘因子（<1 拉近）
  hoverBody(id: string | null): void; // 外部驱动悬停高亮
  dispose(): void;
};

type PlanetNode = {
  body: Body;
  anchor: THREE.Group; // 位于轨道上的锚点（含标签、命中球）
  tiltGroup: THREE.Group; // 轴倾角容器（含球体与环，选中时整体缩放）
  mesh: THREE.Mesh; // 球体本体（绕自身 Y 轴自转）
  hit: THREE.Mesh; // 放大的隐形命中球，方便点击小星球
  label: CSS2DObject;
  angle: number; // 当前公转角
  orbitSpeed: number; // rad / 模拟天
  spinSpeed: number; // rad / 模拟天（视觉压缩）
};

const ORBIT_DAYS_PER_SEC = 4; // 1x 速度下每秒推进 4 个模拟天（地球年 ≈ 91s）
const SPIN_VISUAL = 0.09; // 自转视觉压缩：地球 1x 下约 0.36 转/秒
const DEFAULT_CAM = new THREE.Vector3(0, 24, 46);
const IDLE_RESUME_MS = 18000;

// 哈雷彗星椭圆轨道（压缩比例）：近日点 5.6 / 远日点 34.4，逆行，轨道面倾斜
const COMET = {
  a: 20, // 半长轴
  e: 0.72, // 离心率
  incline: 0.34, // 轨道面倾角（弧度）
  periodDays: 250, // 压缩后的公转周期（模拟天）
};

// ---------- 太阳：GLSL 3D 噪声动态日面（输出 >1 的 HDR 颜色喂给 bloom） ----------

const SUN_VERT = /* glsl */ `
  varying vec3 vObjPos;
  varying vec3 vVNormal;
  varying vec3 vVPos;
  void main() {
    vObjPos = position;
    vVNormal = normalMatrix * normal;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vVPos = mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`;

const SUN_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uAudio; // 音频能量 0..1，驱动整体亮度
  varying vec3 vObjPos;
  varying vec3 vVNormal;
  varying vec3 vVPos;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x),
          mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
          mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
      f.z);
  }
  float fbm(vec3 p) {
    float s = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { s += a * noise(p); p *= 2.03; a *= 0.5; }
    return s;
  }

  void main() {
    // 用球面方向做 3D 噪声采样，天然无缝；双层流动 = 翻滚的日面
    vec3 dir = normalize(vObjPos);
    float n = fbm(dir * 3.5 + vec3(uTime * 0.05, uTime * 0.03, -uTime * 0.02));
    float cell = fbm(dir * 11.0 - vec3(0.0, uTime * 0.06, uTime * 0.04));
    float t = clamp(n * 1.1 + cell * 0.55 - 0.3, 0.0, 1.0);

    vec3 col = mix(vec3(1.0, 0.96, 0.78), vec3(0.98, 0.52, 0.1), t);
    col = mix(col, vec3(0.72, 0.16, 0.02), smoothstep(0.55, 1.0, t));

    // 边缘菲涅尔增亮：轮廓烧起来，交给 bloom 晕开（盘面压亮度，保住米粒组织细节）
    float rim = pow(1.0 - clamp(dot(normalize(-vVPos), normalize(vVNormal)), 0.0, 1.0), 2.2);
    gl_FragColor = vec4(col * (0.8 + rim * 1.1) * (1.0 + uAudio * 0.45), 1.0);
  }
`;

// ---------- 地球大气：BackSide 菲涅尔辉光壳 ----------

const ATMO_VERT = /* glsl */ `
  varying vec3 vVNormal;
  void main() {
    vVNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ATMO_FRAG = /* glsl */ `
  varying vec3 vVNormal;
  void main() {
    float intensity = pow(0.66 - dot(vVNormal, vec3(0.0, 0.0, 1.0)), 3.5);
    gl_FragColor = vec4(vec3(0.28, 0.56, 1.0) * 1.4, 1.0) * max(intensity, 0.0);
  }
`;

// ---------- God Rays：屏幕空间径向散射（crepuscular rays） ----------
// 原理：提取亮部（基本只有太阳 HDR 盘面），沿「像素 → 太阳屏幕位置」的
// 射线做衰减累加。行星挡住太阳时，亮部里的剪影缺口会自然拉出光束阴影。

const GODRAYS_SHADER = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uLightPos: { value: new THREE.Vector2(0.5, 0.5) }, // 太阳的屏幕坐标 0..1
    uIntensity: { value: 0 }, // 太阳出画面 / 在身后时淡出
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    #define SAMPLES 48
    uniform sampler2D tDiffuse;
    uniform vec2 uLightPos;
    uniform float uIntensity;
    varying vec2 vUv;

    void main() {
      vec3 base = texture2D(tDiffuse, vUv).rgb;
      vec2 delta = (uLightPos - vUv) * 0.62 / float(SAMPLES);
      vec2 p = vUv;
      float decay = 1.0;
      vec3 rays = vec3(0.0);
      for (int i = 0; i < SAMPLES; i++) {
        p += delta;
        vec3 s = texture2D(tDiffuse, p).rgb;
        float luma = dot(s, vec3(0.299, 0.587, 0.114));
        rays += s * smoothstep(0.5, 0.95, luma) * decay;
        decay *= 0.955;
      }
      gl_FragColor = vec4(base + rays * 0.028 * uIntensity, 1.0);
    }
  `,
};

// ---------- 彗尾粒子（生命周期驱动大小与透明度，加色混合） ----------

const TAIL_VERT = /* glsl */ `
  attribute float aLife;
  uniform float uSize;
  uniform float uPixelRatio;
  varying float vA;
  void main() {
    vA = smoothstep(0.0, 0.12, aLife) * pow(aLife, 1.4);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = uSize * uPixelRatio * (0.45 + aLife) * (26.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const TAIL_FRAG = /* glsl */ `
  uniform vec3 uColor;
  varying float vA;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d) * vA;
    gl_FragColor = vec4(uColor * a, a);
  }
`;

function seededRand(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createSolarSystem(
  container: HTMLElement,
  onSelect: (id: string | null) => void,
): SolarSystemHandles {
  const disposables: { dispose(): void }[] = [];
  const track = <T extends { dispose(): void }>(d: T): T => {
    disposables.push(d);
    return d;
  };

  // ---------- renderer / scene / camera ----------
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  const pixelRatio = Math.min(window.devicePixelRatio, 2);
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; // 电影级色调映射
  renderer.domElement.style.display = "block";
  container.appendChild(renderer.domElement);

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
  camera.position.set(0, 60, 130); // 开场从远处推入

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = 4;
  controls.maxDistance = 160;
  controls.autoRotate = false; // 开场动画结束后开启
  controls.autoRotateSpeed = 0.4;

  // ---------- 后处理：God Rays → Bloom ----------
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const godRaysPass = new ShaderPass(GODRAYS_SHADER);
  composer.addPass(godRaysPass);
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(container.clientWidth, container.clientHeight),
    0.6, // strength
    0.55, // radius
    0.72, // threshold：太阳 HDR、彗尾、城市灯光会溢出发光
  );
  composer.addPass(bloomPass);
  composer.addPass(new OutputPass());

  // ---------- 灯光 ----------
  scene.add(new THREE.AmbientLight(0x445566, 0.65));
  const sunLight = new THREE.PointLight(0xfff2d8, 4.2, 0, 0); // 补偿 ACES 压暗
  scene.add(sunLight);

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

  // ---------- 天体 ----------
  const planets: PlanetNode[] = [];
  const hitMeshes: THREE.Mesh[] = [];
  const orbitLines: THREE.Line[] = [];
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

  let sunTilt!: THREE.Group;
  let sunMesh!: THREE.Mesh;
  let sunGlow!: THREE.Sprite;
  let sunUniforms!: { uTime: { value: number }; uAudio: { value: number } };
  let earthClouds: THREE.Mesh | null = null;
  const earthSunDirView = { value: new THREE.Vector3(1, 0, 0) };

  for (const body of BODIES) {
    if (body.kind === "comet") continue; // 彗星走专属椭圆轨道流程

    const isSun = body.id === "sun";
    const geo = track(new THREE.SphereGeometry(body.radius, 64, 32));

    let mat: THREE.Material;
    if (isSun) {
      // 动态日面：3D 噪声实时翻滚，无需贴图
      sunUniforms = { uTime: { value: 0 }, uAudio: { value: 0 } };
      mat = track(
        new THREE.ShaderMaterial({
          uniforms: sunUniforms,
          vertexShader: SUN_VERT,
          fragmentShader: SUN_FRAG,
        }),
      );
    } else {
      const srcCanvas = createBodyCanvas(body.id);
      const tex = track(new THREE.CanvasTexture(srcCanvas));
      tex.colorSpace = THREE.SRGBColorSpace;
      const std = new THREE.MeshStandardMaterial({
        map: tex,
        roughness: 0.92,
        metalness: 0,
        emissive: new THREE.Color(body.accent),
        emissiveIntensity: 0.06, // 暗面留一点可读性，方便科普观察
      });
      if (body.id === "earth") {
        // 夜面城市灯光：暖黄 emissiveMap，只在背阳面亮起（注入视线空间太阳方向做遮罩）
        const cityTex = track(new THREE.CanvasTexture(createCityLightsCanvas(srcCanvas)));
        cityTex.colorSpace = THREE.SRGBColorSpace;
        std.emissiveMap = cityTex;
        std.emissive = new THREE.Color(0xffd9a0);
        std.emissiveIntensity = 1.3;
        std.onBeforeCompile = (sh) => {
          sh.uniforms.uSunDirView = earthSunDirView;
          sh.fragmentShader = sh.fragmentShader
            .replace(
              "uniform vec3 emissive;",
              "uniform vec3 emissive;\nuniform vec3 uSunDirView;",
            )
            .replace(
              "#include <emissivemap_fragment>",
              "#include <emissivemap_fragment>\n\ttotalEmissiveRadiance *= smoothstep(0.18, -0.22, dot(normal, uSunDirView));",
            );
        };
      }
      mat = track(std);
    }
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData.bodyId = body.id;

    const tiltGroup = new THREE.Group();
    tiltGroup.rotation.z = THREE.MathUtils.degToRad(body.tiltDeg);
    tiltGroup.add(mesh);

    if (body.id === "earth") {
      // 云层：略大的独立球壳，与地表异速旋转
      const cloudTex = track(new THREE.CanvasTexture(createCloudCanvas()));
      cloudTex.colorSpace = THREE.SRGBColorSpace;
      const cloudMat = track(
        new THREE.MeshStandardMaterial({
          map: cloudTex,
          transparent: true,
          opacity: 0.85,
          depthWrite: false,
          roughness: 1,
        }),
      );
      earthClouds = new THREE.Mesh(
        track(new THREE.SphereGeometry(body.radius * 1.03, 48, 24)),
        cloudMat,
      );
      tiltGroup.add(earthClouds);

      // 大气辉光壳：BackSide 菲涅尔
      const atmoMat = track(
        new THREE.ShaderMaterial({
          vertexShader: ATMO_VERT,
          fragmentShader: ATMO_FRAG,
          blending: THREE.AdditiveBlending,
          side: THREE.BackSide,
          transparent: true,
          depthWrite: false,
        }),
      );
      const atmo = new THREE.Mesh(
        track(new THREE.SphereGeometry(body.radius * 1.18, 48, 24)),
        atmoMat,
      );
      tiltGroup.add(atmo);
    }

    const anchor = new THREE.Group();
    anchor.add(tiltGroup);

    // 放大的隐形命中球（小星球太难点）
    const hitGeo = track(new THREE.SphereGeometry(Math.max(body.radius * 1.7, 0.9), 12, 8));
    const hitMat = track(new THREE.MeshBasicMaterial({ visible: false }));
    const hit = new THREE.Mesh(hitGeo, hitMat);
    hit.userData.bodyId = body.id;
    anchor.add(hit);
    hitMeshes.push(hit);

    const label = makeLabel(body);
    anchor.add(label);
    scene.add(anchor);

    if (body.ring) {
      const ringTex = track(new THREE.CanvasTexture(createRingCanvas()));
      ringTex.colorSpace = THREE.SRGBColorSpace;
      const ringGeo = track(
        new THREE.RingGeometry(body.ring.inner, body.ring.outer, 128, 1),
      );
      // 重写 UV：u = 半径方向，让贴图沿半径展开成同心条带
      const p = ringGeo.attributes.position;
      const uv = ringGeo.attributes.uv as THREE.BufferAttribute;
      const v3 = new THREE.Vector3();
      for (let i = 0; i < p.count; i++) {
        v3.fromBufferAttribute(p as THREE.BufferAttribute, i);
        uv.setXY(i, (v3.length() - body.ring.inner) / (body.ring.outer - body.ring.inner), 0.5);
      }
      const ringMat = track(
        new THREE.MeshBasicMaterial({
          map: ringTex,
          transparent: true,
          opacity: body.ring.opacity,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      tiltGroup.add(ring);
    }

    if (isSun) {
      sunTilt = tiltGroup;
      sunMesh = mesh;
      const glowTex = track(new THREE.CanvasTexture(createGlowCanvas()));
      const glowMat = track(
        new THREE.SpriteMaterial({
          map: glowTex,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          transparent: true,
          opacity: 0.55, // bloom 已负责主辉光，sprite 只做底色
        }),
      );
      sunGlow = new THREE.Sprite(glowMat);
      sunGlow.scale.setScalar(body.radius * 4.4);
      anchor.add(sunGlow);
      label.position.y = body.radius * 1.3 + 0.6;
      continue;
    }

    // 轨道线
    {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 180; i++) {
        const a = (i / 180) * Math.PI * 2;
        pts.push(
          new THREE.Vector3(Math.cos(a) * body.orbitRadius, 0, Math.sin(a) * body.orbitRadius),
        );
      }
      const geoL = track(new THREE.BufferGeometry().setFromPoints(pts));
      const matL = track(
        new THREE.LineBasicMaterial({ color: 0x8899bb, transparent: true, opacity: 0.22 }),
      );
      const line = new THREE.Line(geoL, matL);
      orbitLines.push(line);
      scene.add(line);
    }

    planets.push({
      body,
      anchor,
      tiltGroup,
      mesh,
      hit,
      label,
      angle: rand() * Math.PI * 2,
      orbitSpeed: (Math.PI * 2) / body.orbitDays,
      spinSpeed: ((Math.PI * 2 * 24) / body.dayHours) * SPIN_VISUAL,
    });
  }

  // 太阳自转参数
  const sunSpin = ((Math.PI * 2 * 24) / 609.6) * SPIN_VISUAL;

  // ---------- 月球（地球的視覺陪衬，不可点击） ----------
  const earthNode = planets.find((p) => p.body.id === "earth")!;
  const moonPivot = new THREE.Group();
  {
    const moonTex = track(new THREE.CanvasTexture(createBodyCanvas("moon")));
    moonTex.colorSpace = THREE.SRGBColorSpace;
    const moonGeo = track(new THREE.SphereGeometry(0.17, 24, 16));
    const moonMat = track(
      new THREE.MeshStandardMaterial({ map: moonTex, roughness: 0.95 }),
    );
    const moon = new THREE.Mesh(moonGeo, moonMat);
    moon.position.x = 1.35;
    moonPivot.add(moon);
    earthNode.anchor.add(moonPivot);
  }

  // ---------- 小行星带 ----------
  let belt: THREE.Points;
  {
    const n = 1600;
    const pos = new Float32Array(n * 3);
    const r0 = 16.2;
    const r1 = 18.6;
    const beltRand = seededRand(99);
    for (let i = 0; i < n; i++) {
      const a = beltRand() * Math.PI * 2;
      const r = r0 + beltRand() * (r1 - r0);
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

  // ---------- 哈雷彗星：椭圆轨道（开普勒第二定律）+ 双彗尾 ----------
  const cometBody = BODIES.find((b) => b.id === "halley")!;
  const cometPlane = new THREE.Matrix4().makeRotationX(COMET.incline);
  const cometPosAt = (theta: number, out: THREE.Vector3) => {
    const r = (COMET.a * (1 - COMET.e ** 2)) / (1 + COMET.e * Math.cos(theta));
    out.set(Math.cos(theta) * r, 0, -Math.sin(theta) * r).applyMatrix4(cometPlane);
    return out;
  };
  // 等面积扫掠常数：角速度 = C / r²（近日点快、远日点慢）
  const cometC =
    (2 * Math.PI * COMET.a * COMET.a * Math.sqrt(1 - COMET.e ** 2)) / COMET.periodDays;
  let cometTheta = 1.0;

  let cometNode!: PlanetNode;
  let cometGlow!: THREE.Sprite;
  {
    const anchor = new THREE.Group();
    const tiltGroup = new THREE.Group();
    anchor.add(tiltGroup);

    // 冰质彗核：微微自发光，被 bloom 晕成蓝白光点
    const geo = track(new THREE.SphereGeometry(cometBody.radius, 24, 16));
    const mat = track(
      new THREE.MeshStandardMaterial({
        color: 0xdff4ff,
        roughness: 0.6,
        emissive: new THREE.Color(0x9fe8ff),
        emissiveIntensity: 0.9,
      }),
    );
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData.bodyId = cometBody.id;
    tiltGroup.add(mesh);

    const glowTex = track(new THREE.CanvasTexture(createGlowCanvas()));
    const glowMat = track(
      new THREE.SpriteMaterial({
        map: glowTex,
        color: 0x9fe8ff,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
      }),
    );
    cometGlow = new THREE.Sprite(glowMat);
    cometGlow.scale.setScalar(1.8);
    anchor.add(cometGlow);

    const hitGeo = track(new THREE.SphereGeometry(1.1, 12, 8));
    const hitMat = track(new THREE.MeshBasicMaterial({ visible: false }));
    const hit = new THREE.Mesh(hitGeo, hitMat);
    hit.userData.bodyId = cometBody.id;
    anchor.add(hit);
    hitMeshes.push(hit);

    const label = makeLabel(cometBody);
    anchor.add(label);
    cometPosAt(cometTheta, anchor.position);
    scene.add(anchor);

    cometNode = {
      body: cometBody,
      anchor,
      tiltGroup,
      mesh,
      hit,
      label,
      angle: 0,
      orbitSpeed: 0,
      spinSpeed: ((Math.PI * 2 * 24) / cometBody.dayHours) * SPIN_VISUAL,
    };
    planets.push(cometNode);

    // 彗星椭圆轨道虚线
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 240; i++) {
      pts.push(cometPosAt((i / 240) * Math.PI * 2, new THREE.Vector3()));
    }
    const geoL = track(new THREE.BufferGeometry().setFromPoints(pts));
    const matL = track(
      new THREE.LineBasicMaterial({ color: 0x7ee8fa, transparent: true, opacity: 0.16 }),
    );
    const line = new THREE.Line(geoL, matL);
    orbitLines.push(line);
    scene.add(line);
  }

  // 彗尾粒子系统：世界坐标 Points，CPU 积分 + 生命周期 shader
  type Tail = {
    points: THREE.Points;
    geo: THREE.BufferGeometry;
    pos: Float32Array;
    vel: Float32Array;
    life: Float32Array;
    n: number;
    cursor: number;
    acc: number;
    maxLife: number;
    rate: number; // 粒子/秒（近日点附近按 1/r² 增强）
    speed: [number, number]; // 背阳初速 [基础, 随机]
    spread: number; // 横向散布
    inherit: number; // 继承彗核轨道速度比例（尘埃尾弯曲的来源）
  };
  const makeTail = (opts: {
    n: number;
    color: number;
    size: number;
    maxLife: number;
    rate: number;
    speed: [number, number];
    spread: number;
    inherit: number;
  }): Tail => {
    const pos = new Float32Array(opts.n * 3);
    const life = new Float32Array(opts.n); // 初始全 0 = 不可见
    const geo = track(new THREE.BufferGeometry());
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aLife", new THREE.BufferAttribute(life, 1));
    const mat = track(
      new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color(opts.color) },
          uSize: { value: opts.size },
          uPixelRatio: { value: pixelRatio },
        },
        vertexShader: TAIL_VERT,
        fragmentShader: TAIL_FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;
    scene.add(points);
    return {
      points,
      geo,
      pos,
      vel: new Float32Array(opts.n * 3),
      life,
      n: opts.n,
      cursor: 0,
      acc: 0,
      maxLife: opts.maxLife,
      rate: opts.rate,
      speed: opts.speed,
      spread: opts.spread,
      inherit: opts.inherit,
    };
  };
  // 离子尾：笔直背阳、蓝色、快
  const ionTail = makeTail({
    n: 1100, color: 0x86e8ff, size: 1.7, maxLife: 1.6,
    rate: 320, speed: [7, 3], spread: 0.22, inherit: 0.05,
  });
  // 尘埃尾：暖白、慢、继承轨道速度而弯曲
  const dustTail = makeTail({
    n: 1500, color: 0xffe3b8, size: 2.0, maxLife: 3.0,
    rate: 400, speed: [1.6, 1.2], spread: 0.4, inherit: 0.55,
  });
  const tailRand = seededRand(4242);
  const updateTail = (
    tail: Tail,
    head: THREE.Vector3,
    headVel: THREE.Vector3,
    antiSun: THREE.Vector3,
    strength: number,
    simSec: number,
  ) => {
    // 衰老 + 积分
    for (let i = 0; i < tail.n; i++) {
      if (tail.life[i] <= 0) continue;
      tail.life[i] -= simSec / tail.maxLife;
      tail.pos[i * 3] += tail.vel[i * 3] * simSec;
      tail.pos[i * 3 + 1] += tail.vel[i * 3 + 1] * simSec;
      tail.pos[i * 3 + 2] += tail.vel[i * 3 + 2] * simSec;
    }
    // 发射：出生点沿本帧彗核轨迹插值，高速/低帧率下彗尾依然连续不结块
    tail.acc += tail.rate * strength * simSec;
    const emitTotal = Math.floor(tail.acc);
    tail.acc -= emitTotal;
    for (let e = 0; e < emitTotal; e++) {
      const i = tail.cursor;
      tail.cursor = (tail.cursor + 1) % tail.n;
      const back = (e / Math.max(1, emitTotal)) * simSec;
      tail.pos[i * 3] = head.x - headVel.x * back + (tailRand() - 0.5) * 0.2;
      tail.pos[i * 3 + 1] = head.y - headVel.y * back + (tailRand() - 0.5) * 0.2;
      tail.pos[i * 3 + 2] = head.z - headVel.z * back + (tailRand() - 0.5) * 0.2;
      const sp = tail.speed[0] + tailRand() * tail.speed[1];
      tail.vel[i * 3] =
        antiSun.x * sp + headVel.x * tail.inherit + (tailRand() - 0.5) * tail.spread;
      tail.vel[i * 3 + 1] =
        antiSun.y * sp + headVel.y * tail.inherit + (tailRand() - 0.5) * tail.spread;
      tail.vel[i * 3 + 2] =
        antiSun.z * sp + headVel.z * tail.inherit + (tailRand() - 0.5) * tail.spread;
      tail.life[i] = 1;
    }
    tail.geo.attributes.position.needsUpdate = true;
    tail.geo.attributes.aLife.needsUpdate = true;
  };

  // ---------- 行星轨迹拖尾（加色渐隐折线，随速度拉长） ----------
  const TRAIL_LEN = 120;
  type Trail = { line: THREE.Line; positions: Float32Array; last: THREE.Vector3 };
  const trails: Trail[] = [];
  for (const p of planets) {
    if (p.body.kind === "comet") continue;
    const start = new THREE.Vector3(
      Math.cos(p.angle) * p.body.orbitRadius,
      0,
      -Math.sin(p.angle) * p.body.orbitRadius,
    );
    const positions = new Float32Array(TRAIL_LEN * 3);
    const colors = new Float32Array(TRAIL_LEN * 3);
    const c = new THREE.Color(p.body.accent);
    for (let i = 0; i < TRAIL_LEN; i++) {
      positions[i * 3] = start.x;
      positions[i * 3 + 1] = start.y;
      positions[i * 3 + 2] = start.z;
      const k = (i / (TRAIL_LEN - 1)) ** 2 * 0.5; // 旧端透明 → 新端渐亮
      colors[i * 3] = c.r * k;
      colors[i * 3 + 1] = c.g * k;
      colors[i * 3 + 2] = c.b * k;
    }
    const geo = track(new THREE.BufferGeometry());
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const mat = track(
      new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    const line = new THREE.Line(geo, mat);
    line.frustumCulled = false;
    scene.add(line);
    trails.push({ line, positions, last: start.clone() });
  }

  // ---------- 交互状态 ----------
  let timeScale = 1;
  let paused = false;
  let audioLevelFn: (() => number) | null = null;
  let selected: PlanetNode | "sun" | null = null;
  let hovered: PlanetNode | null = null;
  let disposed = false;
  let idleTimer: ReturnType<typeof setTimeout> | null = null;
  let introDone = false;

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

  // 开场：远景推入
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
    if (node.body.kind === "comet") return 7; // 留出看彗尾的距离
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
    if (Math.hypot(ev.clientX - downX, ev.clientY - downY) > 6) return; // 拖动不算点击
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
    const id = pick(ev);
    hovered = id && id !== "sun" ? nodeById(id) ?? null : null;
    renderer.domElement.style.cursor = id ? "pointer" : "grab";
  };
  renderer.domElement.addEventListener("pointerdown", onPointerDown);
  renderer.domElement.addEventListener("pointerup", onPointerUp);
  renderer.domElement.addEventListener("pointermove", onPointerMove);

  // ---------- resize ----------
  const resize = () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    composer.setSize(w, h);
    labelRenderer.setSize(w, h);
  };
  const ro = new ResizeObserver(resize);
  ro.observe(container);

  // ---------- 主循环 ----------
  const clock = new THREE.Clock();
  const tmp = new THREE.Vector3();
  const camDir = new THREE.Vector3();
  let elapsed = 0;
  let rafId = 0;

  const frame = () => {
    if (disposed) return;
    rafId = requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.1);
    elapsed += dt;
    const simDays = paused ? 0 : dt * ORBIT_DAYS_PER_SEC * timeScale;

    // 公转 + 自转
    for (const p of planets) {
      if (!p.body.kind) {
        p.angle += p.orbitSpeed * simDays;
        p.anchor.position.set(
          Math.cos(p.angle) * p.body.orbitRadius,
          0,
          -Math.sin(p.angle) * p.body.orbitRadius,
        );
      }
      p.mesh.rotation.y += p.spinSpeed * simDays;

      // 悬停 / 选中的缩放（弹性趋近）
      const targetScale = selected === p ? 1.28 : hovered === p ? 1.1 : 1;
      const s = p.tiltGroup.scale.x + (targetScale - p.tiltGroup.scale.x) * Math.min(1, dt * 8);
      p.tiltGroup.scale.setScalar(s);
    }
    sunMesh.rotation.y += sunSpin * simDays;
    sunUniforms.uTime.value = elapsed;
    if (earthClouds) earthClouds.rotation.y += earthNode.spinSpeed * 1.35 * simDays;
    moonPivot.rotation.y += ((Math.PI * 2) / 27.3) * simDays;
    belt.rotation.y += ((Math.PI * 2) / 1800) * simDays;

    // 彗星：开普勒扫掠（逆行），近日点明显加速；彗尾按 1/r² 增强
    {
      const head = cometNode.anchor.position;
      const simSec = paused ? 0 : dt * timeScale;
      if (simSec > 0) {
        const r0 = head.length();
        cometTheta -= (cometC / (r0 * r0)) * simDays;
        tmp.copy(head);
        cometPosAt(cometTheta, head);
        const headVel = tmp.subVectors(head, tmp).divideScalar(simSec).clone();
        const r = head.length();
        const antiSun = head.clone().normalize();
        const strength = THREE.MathUtils.clamp((14 / r) ** 2, 0.06, 5);
        cometGlow.scale.setScalar(1.2 + strength * 0.7);
        updateTail(ionTail, head, headVel, antiSun, strength, simSec);
        updateTail(dustTail, head, headVel, antiSun, strength, simSec);
      }
    }

    // 行星拖尾：移动超过步长才追加，轨迹弧长与速度无关
    for (let i = 0, j = 0; i < planets.length; i++) {
      const p = planets[i];
      if (p.body.kind === "comet") continue;
      const trail = trails[j++];
      if (p.anchor.position.distanceTo(trail.last) > 0.12) {
        trail.positions.copyWithin(0, 3);
        trail.positions[(TRAIL_LEN - 1) * 3] = p.anchor.position.x;
        trail.positions[(TRAIL_LEN - 1) * 3 + 1] = p.anchor.position.y;
        trail.positions[(TRAIL_LEN - 1) * 3 + 2] = p.anchor.position.z;
        trail.last.copy(p.anchor.position);
        (trail.line.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      }
    }

    // 太阳辉光呼吸 + 音画联动（声音能量推大辉光、提亮日面、加深 bloom）
    const audio = audioLevelFn ? audioLevelFn() : 0;
    sunUniforms.uAudio.value = audio;
    bloomPass.strength = 0.6 + audio * 0.5;
    sunGlow.scale.setScalar(
      BODIES[0].radius * (4.4 + Math.sin(elapsed * 1.4) * 0.3 + audio * 2.4),
    );

    // God Rays：把太阳投影到屏幕坐标；太阳在身后或出画时淡出
    camera.getWorldDirection(camDir);
    const sunInFront = camDir.dot(tmp.copy(camera.position).negate()) > 0;
    tmp.set(0, 0, 0).project(camera);
    const offAxis = Math.max(Math.abs(tmp.x), Math.abs(tmp.y));
    const rayFade = sunInFront ? 1 - THREE.MathUtils.smoothstep(offAxis, 1.0, 1.6) : 0;
    godRaysPass.uniforms.uLightPos.value.set((tmp.x + 1) / 2, (tmp.y + 1) / 2);
    godRaysPass.uniforms.uIntensity.value = rayFade * (1 + audio * 0.5);

    // 地球夜面灯光遮罩：视线空间的太阳方向
    tmp.set(0, 0, 0).applyMatrix4(camera.matrixWorldInverse);
    earthSunDirView.value
      .copy(earthNode.anchor.position)
      .applyMatrix4(camera.matrixWorldInverse)
      .multiplyScalar(-1)
      .add(tmp)
      .normalize();
    const sunScale = selected === "sun" ? 1.12 : 1;
    sunTilt.scale.setScalar(
      sunTilt.scale.x + (sunScale - sunTilt.scale.x) * Math.min(1, dt * 8),
    );

    // 相机动画
    if (camAnim) {
      camAnim.t += dt;
      const k = Math.min(1, camAnim.t / camAnim.dur);
      const e = k * k * (3 - 2 * k); // smoothstep
      camera.position.lerpVectors(camAnim.fromPos, camAnim.toPos(), e);
      controls.target.lerpVectors(camAnim.fromTarget, camAnim.toTarget(), e);
      if (selected && selected !== "sun") worldPosOf(selected, prevSelectedPos);
      if (k >= 1) {
        const done = camAnim.onDone;
        camAnim = null;
        done?.();
      }
    } else if (selected && selected !== "sun") {
      // 跟随选中行星公转：目标与相机一起平移
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

  // ---------- 句柄 ----------
  return {
    focus,
    setTimeScale(v) {
      timeScale = v;
    },
    setPaused(v) {
      paused = v;
    },
    setShowOrbits(v) {
      for (const l of orbitLines) l.visible = v;
      for (const t of trails) t.line.visible = v;
    },
    setShowLabels(v) {
      for (const p of planets) p.label.visible = v;
    },
    bindAudioLevel(fn) {
      audioLevelFn = fn;
    },
    pickAt,
    orbitBy(dx, dy) {
      if (camAnim) return; // 相机动画期间不抢镜头
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
      hovered = id && id !== "sun" ? nodeById(id) ?? null : null;
    },
    resetView() {
      selected = null;
      startCamAnim(
        () => DEFAULT_CAM.clone(),
        () => new THREE.Vector3(0, 0, 0),
        1.2,
      );
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(rafId);
      if (idleTimer) clearTimeout(idleTimer);
      ro.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      controls.dispose();
      for (const d of disposables) d.dispose();
      godRaysPass.dispose();
      bloomPass.dispose();
      composer.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
      container.removeChild(labelRenderer.domElement);
    },
  };
}
