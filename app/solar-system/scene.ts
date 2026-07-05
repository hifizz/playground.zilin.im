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
import { BODIES, type Body } from "./planets";
import {
  createBodyCanvas,
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
  resetView(): void;
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
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
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

  // ---------- 灯光 ----------
  scene.add(new THREE.AmbientLight(0x445566, 0.5));
  const sunLight = new THREE.PointLight(0xfff2d8, 3.2, 0, 0);
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

  for (const body of BODIES) {
    const tex = track(new THREE.CanvasTexture(createBodyCanvas(body.id)));
    tex.colorSpace = THREE.SRGBColorSpace;

    const isSun = body.id === "sun";
    const geo = track(new THREE.SphereGeometry(body.radius, 64, 32));
    const mat = track(
      isSun
        ? new THREE.MeshBasicMaterial({ map: tex })
        : new THREE.MeshStandardMaterial({
            map: tex,
            roughness: 0.92,
            metalness: 0,
            emissive: new THREE.Color(body.accent),
            emissiveIntensity: 0.06, // 暗面留一点可读性，方便科普观察
          }),
    );
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData.bodyId = body.id;

    const tiltGroup = new THREE.Group();
    tiltGroup.rotation.z = THREE.MathUtils.degToRad(body.tiltDeg);
    tiltGroup.add(mesh);

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
        }),
      );
      sunGlow = new THREE.Sprite(glowMat);
      sunGlow.scale.setScalar(body.radius * 6);
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

  // ---------- 交互状态 ----------
  let timeScale = 1;
  let paused = false;
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

  const pick = (ev: PointerEvent): string | null => {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set(
      ((ev.clientX - rect.left) / rect.width) * 2 - 1,
      -(((ev.clientY - rect.top) / rect.height) * 2 - 1),
    );
    raycaster.setFromCamera(pointer, camera);
    const hitList = raycaster.intersectObjects(hitMeshes, false);
    return hitList.length ? (hitList[0].object.userData.bodyId as string) : null;
  };

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
    labelRenderer.setSize(w, h);
  };
  const ro = new ResizeObserver(resize);
  ro.observe(container);

  // ---------- 主循环 ----------
  const clock = new THREE.Clock();
  const tmp = new THREE.Vector3();
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
      p.angle += p.orbitSpeed * simDays;
      p.anchor.position.set(
        Math.cos(p.angle) * p.body.orbitRadius,
        0,
        -Math.sin(p.angle) * p.body.orbitRadius,
      );
      p.mesh.rotation.y += p.spinSpeed * simDays;

      // 悬停 / 选中的缩放（弹性趋近）
      const targetScale = selected === p ? 1.28 : hovered === p ? 1.1 : 1;
      const s = p.tiltGroup.scale.x + (targetScale - p.tiltGroup.scale.x) * Math.min(1, dt * 8);
      p.tiltGroup.scale.setScalar(s);
    }
    sunMesh.rotation.y += sunSpin * simDays;
    moonPivot.rotation.y += ((Math.PI * 2) / 27.3) * simDays;
    belt.rotation.y += ((Math.PI * 2) / 1800) * simDays;

    // 太阳辉光呼吸
    sunGlow.scale.setScalar(BODIES[0].radius * (6 + Math.sin(elapsed * 1.4) * 0.35));
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
    renderer.render(scene, camera);
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
    },
    setShowLabels(v) {
      for (const p of planets) p.label.visible = v;
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
      renderer.dispose();
      container.removeChild(renderer.domElement);
      container.removeChild(labelRenderer.domElement);
    },
  };
}
