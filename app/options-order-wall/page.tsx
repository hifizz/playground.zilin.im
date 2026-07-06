"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  EXPIRIES,
  SPOT,
  STRIKES,
  formatOI,
  generateChain,
  type ChainData,
  type OptionCell,
} from "./data";

/**
 * ============================================================================
 * Options Order Wall · 3D 期权订单墙
 * ============================================================================
 * 用 three.js 把期权链的 open interest 铺成 3D 柱阵：
 *   X 轴 = 行权价（strike）· Z 轴 = 到期日（expiry）· Y 轴 = 未平仓量（OI）
 *
 *   - Call 绿柱 / Put 红柱，同一格子里并排各占一半
 *   - 现价位置竖一面半透明蓝色参考平面，Max Pain 画一条紫色虚线
 *   - OI 超过「均值 × 阈值」的合约判定为订单墙：琥珀描边 + 呼吸脉冲 + OI 标签
 *   - OrbitControls 旋转缩放，hover 有 raycast tooltip
 *
 * three.js 场景只建一次，所有可变操作（换数据 / 换阈值 / 过滤方向）通过
 * apiRef 上的命令式方法完成，避免 React 重渲染整个场景。
 * ============================================================================
 */

// ---- 场景布局常量 --------------------------------------------------------
const CELL_X = 1.6; // 相邻 strike 间距
const CELL_Z = 2.3; // 相邻到期日间距
const BAR_W = 0.6; // 柱宽（X）
const BAR_D = 0.66; // 柱厚（Z）
const PAIR_GAP = 0.44; // call/put 双柱偏离行中心的距离
const MAX_H = 9; // 最大柱高
const GRID_W = (STRIKES.length - 1) * CELL_X;
const GRID_D = (EXPIRIES.length - 1) * CELL_Z;

const xOfIdx = (si: number) => (si - (STRIKES.length - 1) / 2) * CELL_X;
const zOfIdx = (ei: number) => (ei - (EXPIRIES.length - 1) / 2) * CELL_Z;
const xOfStrike = (k: number) => ((k - STRIKES[0]) / (STRIKES[STRIKES.length - 1] - STRIKES[0])) * GRID_W - GRID_W / 2;

const COLOR = {
  bg: 0x05070c,
  callLow: new THREE.Color("#0c4f45"),
  callHigh: new THREE.Color("#2ee6c9"),
  putLow: new THREE.Color("#571a1c"),
  putHigh: new THREE.Color("#ff655c"),
  wallEdge: 0xffc24b,
  spot: 0x7aa2ff,
  maxPain: 0xb388ff,
};

type Mode = "both" | "call" | "put";

type BarEntry = {
  cell: OptionCell;
  mesh: THREE.Mesh;
  mat: THREE.MeshStandardMaterial;
  targetH: number;
  delay: number; // 生长动画的错峰延迟
  pulsePhase: number;
  isWall: boolean;
  edges: THREE.LineSegments<THREE.EdgesGeometry, THREE.LineBasicMaterial> | null;
  label: THREE.Sprite | null;
};

type SceneApi = {
  setData: (data: ChainData, thresholdMult: number, mode: Mode) => void;
  setThreshold: (thresholdMult: number) => void;
  setMode: (mode: Mode) => void;
  setAutoRotate: (on: boolean) => void;
  dispose: () => void;
};

// ---- 文本 Sprite ---------------------------------------------------------
function makeTextSprite(
  text: string,
  opts: { fontSize?: number; color?: string; bold?: boolean; scale?: number } = {},
) {
  const { fontSize = 44, color = "rgba(255,255,255,0.75)", bold = false, scale = 1 } = opts;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  const font = `${bold ? "700" : "500"} ${fontSize}px ui-monospace, SFMono-Regular, monospace`;
  ctx.font = font;
  const w = Math.ceil(ctx.measureText(text).width) + 16;
  const h = fontSize + 20;
  canvas.width = w;
  canvas.height = h;
  ctx.font = font;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillStyle = color;
  ctx.fillText(text, w / 2, h / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(mat);
  const unit = 0.016 * scale;
  sprite.scale.set(w * unit, h * unit, 1);
  return sprite;
}

function disposeObject(obj: THREE.Object3D) {
  obj.traverse((o) => {
    const anyO = o as THREE.Mesh;
    if (anyO.geometry) anyO.geometry.dispose();
    const mats = Array.isArray(anyO.material) ? anyO.material : anyO.material ? [anyO.material] : [];
    for (const m of mats) {
      const sm = m as THREE.SpriteMaterial;
      if (sm.map) sm.map.dispose();
      m.dispose();
    }
  });
}

// ---- 场景构建 ------------------------------------------------------------
function createScene(container: HTMLDivElement, tooltip: HTMLDivElement, onUserDrag: () => void): SceneApi {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(COLOR.bg);
  scene.fog = new THREE.Fog(COLOR.bg, 46, 95);

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
  camera.position.set(18, 14, 24);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.target.set(0, 2.2, 0);
  controls.minDistance = 10;
  controls.maxDistance = 70;
  controls.maxPolarAngle = Math.PI / 2 - 0.04;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.8;
  controls.addEventListener("start", onUserDrag);

  // 灯光：主光 + 冷色补光 + 环境光
  scene.add(new THREE.AmbientLight(0x93a4c8, 0.55));
  const key = new THREE.DirectionalLight(0xffffff, 1.15);
  key.position.set(14, 22, 10);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x4466aa, 0.4);
  fill.position.set(-16, 10, -14);
  scene.add(fill);

  // 地面网格
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(GRID_W + 14, GRID_D + 14),
    new THREE.MeshStandardMaterial({ color: 0x0a0e18, roughness: 0.95, metalness: 0 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  scene.add(ground);
  const grid = new THREE.GridHelper(60, 60, 0x1c2436, 0x121826);
  grid.position.y = 0;
  scene.add(grid);

  // 轴标签：strike（前缘）+ 到期日（左缘）
  const axisGroup = new THREE.Group();
  for (let si = 0; si < STRIKES.length; si++) {
    if (STRIKES[si] % 10 !== 0) continue;
    const s = makeTextSprite(`$${STRIKES[si]}`, {
      color: STRIKES[si] === SPOT ? "rgba(140,170,255,0.95)" : "rgba(255,255,255,0.42)",
      bold: STRIKES[si] === SPOT,
      scale: 0.92,
    });
    s.position.set(xOfIdx(si), 0.32, GRID_D / 2 + 1.5);
    axisGroup.add(s);
  }
  for (let ei = 0; ei < EXPIRIES.length; ei++) {
    const e = EXPIRIES[ei];
    const s = makeTextSprite(e.label, {
      color: e.monthly ? "rgba(255,214,130,0.8)" : "rgba(255,255,255,0.42)",
      bold: e.monthly,
      scale: 0.92,
    });
    s.position.set(-GRID_W / 2 - 1.9, 0.32, zOfIdx(ei));
    axisGroup.add(s);
  }
  scene.add(axisGroup);

  // 现价参考平面（贯穿所有到期日的半透明蓝墙）
  const spotGroup = new THREE.Group();
  const spotPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(GRID_D + 3, MAX_H + 1.2),
    new THREE.MeshBasicMaterial({
      color: COLOR.spot,
      transparent: true,
      opacity: 0.09,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  spotPlane.rotation.y = Math.PI / 2;
  spotPlane.position.set(xOfStrike(SPOT), (MAX_H + 1.2) / 2, 0);
  spotGroup.add(spotPlane);
  const spotLabel = makeTextSprite(`SPOT $${SPOT}`, { color: "rgba(150,180,255,0.95)", bold: true });
  spotLabel.position.set(xOfStrike(SPOT), MAX_H + 1.8, 0);
  spotGroup.add(spotLabel);
  scene.add(spotGroup);

  // 单位几何体：底部在原点，scale.y 即柱高
  const barGeo = new THREE.BoxGeometry(BAR_W, 1, BAR_D);
  barGeo.translate(0, 0.5, 0);
  const edgeGeo = new THREE.EdgesGeometry(barGeo);

  let barsGroup = new THREE.Group();
  let labelGroup = new THREE.Group();
  let maxPainGroup = new THREE.Group();
  scene.add(barsGroup, labelGroup, maxPainGroup);

  let entries: BarEntry[] = [];
  let currentMode: Mode = "both";
  let currentAvgOI = 1;
  let dataStart = 0; // 生长动画起点（秒）
  let hovered: BarEntry | null = null;

  const clock = new THREE.Clock();

  function visibleBySide(cell: OptionCell) {
    return currentMode === "both" || cell.side === currentMode;
  }

  /** 根据阈值重算订单墙：描边 + 标签的增删 */
  function refreshWalls(thresholdMult: number) {
    const limit = currentAvgOI * thresholdMult;
    for (const en of entries) {
      const isWall = en.cell.oi >= limit;
      if (isWall === en.isWall && (isWall ? en.edges !== null : true)) {
        en.isWall = isWall;
        continue;
      }
      en.isWall = isWall;
      if (isWall && !en.edges) {
        const edges = new THREE.LineSegments(
          edgeGeo,
          new THREE.LineBasicMaterial({ color: COLOR.wallEdge, transparent: true, opacity: 0.9 }),
        );
        en.mesh.add(edges); // 作为子节点，跟随柱体的 scale/visible
        en.edges = edges;
        const label = makeTextSprite(formatOI(en.cell.oi), {
          color: "#ffd88a",
          bold: true,
          scale: 1.05,
        });
        label.position.set(en.mesh.position.x, en.targetH + 0.75, en.mesh.position.z);
        label.visible = visibleBySide(en.cell);
        labelGroup.add(label);
        en.label = label;
      } else if (!isWall && en.edges) {
        en.mesh.remove(en.edges);
        en.edges.material.dispose();
        en.edges = null;
        if (en.label) {
          labelGroup.remove(en.label);
          disposeObject(en.label);
          en.label = null;
        }
      }
      // 非墙时恢复基础发光
      if (!isWall) en.mat.emissiveIntensity = en === hovered ? 0.5 : 0.08;
    }
  }

  function applyMode() {
    for (const en of entries) {
      const v = visibleBySide(en.cell);
      en.mesh.visible = v;
      if (en.label) en.label.visible = v;
    }
    if (hovered && !visibleBySide(hovered.cell)) clearHover();
  }

  function clearHover() {
    if (!hovered) return;
    hovered.mat.emissiveIntensity = hovered.isWall ? 0.55 : 0.08;
    hovered = null;
    tooltip.style.display = "none";
    renderer.domElement.style.cursor = "grab";
  }

  const api: SceneApi = {
    setData(data, thresholdMult, mode) {
      currentMode = mode;
      clearHover();
      // 清掉旧的
      scene.remove(barsGroup, labelGroup, maxPainGroup);
      disposeObject(barsGroup);
      disposeObject(labelGroup);
      disposeObject(maxPainGroup);
      barsGroup = new THREE.Group();
      labelGroup = new THREE.Group();
      maxPainGroup = new THREE.Group();
      scene.add(barsGroup, labelGroup, maxPainGroup);
      entries = [];
      currentAvgOI = data.avgOI;

      for (const cell of data.cells) {
        const hRatio = Math.pow(cell.oi / data.maxOI, 0.62);
        const targetH = Math.max(0.06, hRatio * MAX_H);
        const low = cell.side === "call" ? COLOR.callLow : COLOR.putLow;
        const high = cell.side === "call" ? COLOR.callHigh : COLOR.putHigh;
        const color = low.clone().lerp(high, Math.min(1, hRatio * 1.25));
        const mat = new THREE.MeshStandardMaterial({
          color,
          emissive: high,
          emissiveIntensity: 0.08,
          roughness: 0.42,
          metalness: 0.12,
        });
        const mesh = new THREE.Mesh(barGeo, mat);
        const zOffset = cell.side === "call" ? -PAIR_GAP : PAIR_GAP;
        mesh.position.set(xOfIdx(cell.strikeIdx), 0, zOfIdx(cell.expiryIdx) + zOffset);
        mesh.scale.y = 0.001;
        mesh.visible = visibleBySide(cell);
        barsGroup.add(mesh);
        entries.push({
          cell,
          mesh,
          mat,
          targetH,
          delay: cell.expiryIdx * 0.07 + cell.strikeIdx * 0.022,
          pulsePhase: Math.random() * Math.PI * 2,
          isWall: false,
          edges: null,
          label: null,
        });
      }

      // Max Pain 虚线 + 标签
      const painX = xOfStrike(data.maxPain);
      const dashGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(painX, 0.02, -GRID_D / 2 - 1.4),
        new THREE.Vector3(painX, 0.02, GRID_D / 2 + 1.4),
      ]);
      const dash = new THREE.Line(
        dashGeo,
        new THREE.LineDashedMaterial({ color: COLOR.maxPain, dashSize: 0.45, gapSize: 0.3, transparent: true, opacity: 0.85 }),
      );
      dash.computeLineDistances();
      maxPainGroup.add(dash);
      const painLabel = makeTextSprite(`MAX PAIN $${data.maxPain}`, { color: "rgba(200,160,255,0.9)", scale: 0.9 });
      painLabel.position.set(painX, 0.55, -GRID_D / 2 - 2.2);
      maxPainGroup.add(painLabel);

      dataStart = clock.getElapsedTime();
      refreshWalls(thresholdMult);
      applyMode();
    },

    setThreshold(thresholdMult) {
      refreshWalls(thresholdMult);
    },

    setMode(mode) {
      currentMode = mode;
      applyMode();
    },

    setAutoRotate(on) {
      controls.autoRotate = on;
    },

    dispose() {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerleave", clearHover);
      scene.remove(barsGroup, labelGroup, maxPainGroup, axisGroup, spotGroup);
      disposeObject(scene);
      barGeo.dispose();
      edgeGeo.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };

  // ---- hover raycast -----------------------------------------------------
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  function onPointerMove(ev: PointerEvent) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const visibleMeshes = entries.filter((e) => e.mesh.visible).map((e) => e.mesh);
    const hits = raycaster.intersectObjects(visibleMeshes, false);
    const hit = hits[0]?.object as THREE.Mesh | undefined;
    const entry = hit ? entries.find((e) => e.mesh === hit) ?? null : null;
    if (entry !== hovered) {
      if (hovered) hovered.mat.emissiveIntensity = hovered.isWall ? 0.55 : 0.08;
      hovered = entry;
      if (entry) {
        entry.mat.emissiveIntensity = 0.6;
        renderer.domElement.style.cursor = "pointer";
      } else {
        tooltip.style.display = "none";
        renderer.domElement.style.cursor = "grab";
      }
    }
    if (entry) {
      const c = entry.cell;
      const distPct = (((c.strike - SPOT) / SPOT) * 100).toFixed(1);
      tooltip.style.display = "block";
      tooltip.style.left = `${ev.clientX - rect.left + 14}px`;
      tooltip.style.top = `${ev.clientY - rect.top + 14}px`;
      tooltip.innerHTML = `
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
          <span style="color:${c.side === "call" ? "#2ee6c9" : "#ff655c"};font-weight:700;">${c.side.toUpperCase()}</span>
          <span style="font-weight:700;">$${c.strike}</span>
          <span style="color:rgba(255,255,255,0.5);">· ${EXPIRIES[c.expiryIdx].label}</span>
          ${entry.isWall ? '<span style="color:#ffc24b;font-weight:700;">▮ WALL</span>' : ""}
        </div>
        <div style="color:rgba(255,255,255,0.75);">OI <b style="color:#fff;">${formatOI(c.oi)}</b> · Vol ${formatOI(c.volume)}</div>
        <div style="color:rgba(255,255,255,0.45);">距现价 ${Number(distPct) >= 0 ? "+" : ""}${distPct}%</div>`;
    }
  }
  renderer.domElement.addEventListener("pointermove", onPointerMove);
  renderer.domElement.addEventListener("pointerleave", clearHover);
  renderer.domElement.style.cursor = "grab";

  // ---- resize ------------------------------------------------------------
  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();

  // ---- 渲染循环 ----------------------------------------------------------
  const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
  let raf = 0;
  function loop() {
    raf = requestAnimationFrame(loop);
    const t = clock.getElapsedTime();
    const since = t - dataStart;
    for (const en of entries) {
      // 生长动画：错峰 ease-out
      const p = Math.min(1, Math.max(0.0002, (since - en.delay) / 0.7));
      en.mesh.scale.y = en.targetH * easeOutCubic(p);
      // 订单墙呼吸脉冲
      if (en.isWall && en !== hovered) {
        en.mat.emissiveIntensity = 0.5 + 0.3 * Math.sin(t * 2.6 + en.pulsePhase);
      }
    }
    // 墙标签在生长动画尾声淡入
    const labelOpacity = Math.min(1, Math.max(0, (since - 0.8) / 0.5));
    labelGroup.traverse((o) => {
      const sp = o as THREE.Sprite;
      if (sp.isSprite) sp.material.opacity = labelOpacity;
    });
    controls.update();
    renderer.render(scene, camera);
  }
  loop();

  return api;
}

// ============================================================================
// 页面
// ============================================================================
export default function OptionsOrderWallPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<SceneApi | null>(null);

  const [seed, setSeed] = useState(20260705);
  const [mode, setMode] = useState<Mode>("both");
  const [threshold, setThreshold] = useState(3.5);
  const [autoRotate, setAutoRotate] = useState(true);

  const data = useMemo(() => generateChain(seed), [seed]);

  const stats = useMemo(() => {
    const callOI = data.cells.filter((c) => c.side === "call").reduce((s, c) => s + c.oi, 0);
    const putOI = data.totalOI - callOI;
    const walls = data.cells.filter((c) => c.oi >= data.avgOI * threshold).length;
    return { pcRatio: putOI / callOI, walls };
  }, [data, threshold]);

  // 场景只建一次
  useEffect(() => {
    const container = containerRef.current;
    const tooltip = tooltipRef.current;
    if (!container || !tooltip) return;
    const api = createScene(container, tooltip, () => setAutoRotate(false));
    apiRef.current = api;
    return () => {
      api.dispose();
      apiRef.current = null;
    };
  }, []);

  // 数据变化 → 重建柱阵（初次挂载也走这里）
  useEffect(() => {
    apiRef.current?.setData(data, threshold, mode);
    // 仅在数据变化时重建；阈值/模式有独立的轻量更新路径
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  useEffect(() => {
    apiRef.current?.setThreshold(threshold);
  }, [threshold]);

  useEffect(() => {
    apiRef.current?.setMode(mode);
  }, [mode]);

  useEffect(() => {
    apiRef.current?.setAutoRotate(autoRotate);
  }, [autoRotate]);

  return (
    <div className="h-dvh w-full flex flex-col overflow-hidden bg-[#05070c] text-white">
      {/* 顶栏 */}
      <header className="shrink-0 px-5 pt-4 pb-3 border-b border-white/[0.06]">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <Link
            href="/"
            className="text-xs text-white/40 hover:text-white/80 transition-colors font-mono"
          >
            ← Playground
          </Link>
          <h1 className="text-lg font-semibold tracking-tight">
            Options Order Wall <span className="text-white/35 font-normal">· 3D 期权订单墙</span>
          </h1>
          <p className="text-xs text-white/40">
            X 行权价 · Z 到期日 · Y 未平仓量（OI）。琥珀描边的脉冲柱 = 超过阈值的大单墙。拖拽旋转 / 滚轮缩放 / 悬停看合约。
          </p>
        </div>

        {/* 统计 + 控制 */}
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-mono">
          <span className="text-white/45">
            SPOT <b className="text-[#8caaff] font-semibold">${SPOT}</b>
          </span>
          <span className="text-white/45">
            MAX PAIN <b className="text-[#c8a0ff] font-semibold">${data.maxPain}</b>
          </span>
          <span className="text-white/45">
            总 OI <b className="text-white font-semibold">{formatOI(data.totalOI)}</b>
          </span>
          <span className="text-white/45">
            P/C <b className={`font-semibold ${stats.pcRatio > 1 ? "text-[#ff655c]" : "text-[#2ee6c9]"}`}>{stats.pcRatio.toFixed(2)}</b>
          </span>
          <span className="text-white/45">
            订单墙 <b className="text-[#ffc24b] font-semibold">{stats.walls}</b>
          </span>

          <span className="h-4 w-px bg-white/10 hidden sm:block" />

          {/* Call / Put 过滤 */}
          <div className="flex rounded-md overflow-hidden border border-white/10">
            {(
              [
                ["both", "全部"],
                ["call", "Call"],
                ["put", "Put"],
              ] as const
            ).map(([m, label]) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-2.5 py-1 transition-colors ${
                  mode === m
                    ? m === "call"
                      ? "bg-[#2ee6c9]/20 text-[#2ee6c9]"
                      : m === "put"
                        ? "bg-[#ff655c]/20 text-[#ff655c]"
                        : "bg-white/15 text-white"
                    : "text-white/45 hover:text-white/80"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* 墙阈值 */}
          <label className="flex items-center gap-2 text-white/45">
            墙阈值
            <input
              type="range"
              min={2}
              max={8}
              step={0.5}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-28 accent-[#ffc24b]"
            />
            <b className="text-[#ffc24b] whitespace-nowrap w-16">{threshold.toFixed(1)}× 均值</b>
          </label>

          <label className="flex items-center gap-1.5 text-white/45 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoRotate}
              onChange={(e) => setAutoRotate(e.target.checked)}
              className="accent-[#8caaff]"
            />
            自动旋转
          </label>

          <button
            onClick={() => setSeed((s) => s + 1)}
            className="px-2.5 py-1 rounded-md border border-white/10 text-white/60 hover:text-white hover:border-white/25 transition-colors"
          >
            ↻ 重新生成
          </button>
        </div>
      </header>

      {/* 3D 画布 */}
      <div ref={containerRef} className="relative flex-1 min-h-0">
        {/* tooltip：直接 DOM 操作，避免 pointermove 触发 React 重渲染 */}
        <div
          ref={tooltipRef}
          className="pointer-events-none absolute z-10 hidden rounded-lg border border-white/10 bg-[#0b0f18]/95 px-3 py-2 text-xs font-mono shadow-xl backdrop-blur"
          style={{ display: "none" }}
        />
        {/* 图例 */}
        <div className="pointer-events-none absolute bottom-4 left-4 z-10 flex flex-col gap-1.5 rounded-lg border border-white/[0.07] bg-[#0b0f18]/80 px-3 py-2.5 text-[11px] font-mono text-white/55 backdrop-blur">
          <span className="flex items-center gap-2">
            <i className="inline-block w-2.5 h-2.5 rounded-[2px] bg-[#2ee6c9]" /> Call OI
          </span>
          <span className="flex items-center gap-2">
            <i className="inline-block w-2.5 h-2.5 rounded-[2px] bg-[#ff655c]" /> Put OI
          </span>
          <span className="flex items-center gap-2">
            <i className="inline-block w-2.5 h-2.5 rounded-[2px] border border-[#ffc24b] bg-transparent" /> 订单墙（&gt;{threshold.toFixed(1)}× 均值）
          </span>
          <span className="flex items-center gap-2">
            <i className="inline-block w-2.5 h-2.5 rounded-[2px] bg-[#7aa2ff]/40" /> 现价平面
          </span>
          <span className="flex items-center gap-2">
            <i className="inline-block w-2.5 h-0 border-t border-dashed border-[#b388ff]" /> Max Pain
          </span>
        </div>
      </div>
    </div>
  );
}
