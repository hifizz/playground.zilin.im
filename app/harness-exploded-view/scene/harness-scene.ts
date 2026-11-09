// harness-scene — exploded line drawing of an Agent Harness, built on linework.
// Ported from the static page's harness-scene.js (UMD) to a typed ES module; geometry unchanged.
import Linework from "./linework.bundle";
import type { Pt, SceneView, Sketch } from "./linework.bundle";

const CX = 460;
const CY = 600;

export type ModuleKind =
  | "nozzle"
  | "cyl"
  | "box"
  | "stack"
  | "ring"
  | "cage"
  | "pods"
  | "drum"
  | "hub"
  | "gauge"
  | "cone";

export type ModuleId =
  | "provider"
  | "loop"
  | "tools"
  | "eventlog"
  | "context"
  | "skills"
  | "memory"
  | "policy"
  | "sandbox"
  | "subagents"
  | "gateway"
  | "telemetry"
  | "eval";

export interface ModuleSpec {
  id: ModuleId;
  kind: ModuleKind;
  /** module height */
  h: number;
  /** half-width (rings) or half-size (boxes) */
  r: number;
  /** borrowed layers draw dashed */
  borrowed?: boolean;
  /** box modules with side ports */
  ports?: boolean;
  /** screen anchor, set during build */
  anchor?: Pt;
}

// bottom → top
export const MODULES: ModuleSpec[] = [
  { id: "provider", kind: "nozzle", h: 60, r: 70, borrowed: true },
  { id: "loop", kind: "cyl", h: 76, r: 92 },
  { id: "tools", kind: "box", h: 40, r: 80, ports: true },
  { id: "eventlog", kind: "stack", h: 52, r: 88 },
  { id: "context", kind: "box", h: 44, r: 76 },
  { id: "skills", kind: "box", h: 34, r: 66 },
  { id: "memory", kind: "drum", h: 44, r: 78 },
  { id: "policy", kind: "ring", h: 24, r: 104 },
  { id: "sandbox", kind: "cage", h: 58, r: 96 },
  { id: "subagents", kind: "pods", h: 42, r: 84 },
  { id: "gateway", kind: "hub", h: 34, r: 74 },
  { id: "telemetry", kind: "gauge", h: 22, r: 98 },
  { id: "eval", kind: "cone", h: 62, r: 70 },
];

export const MODULE_IDS: ModuleId[] = MODULES.map((m) => m.id);

export interface SceneProps {
  explode: number;
  active: ModuleId | null;
}

// circle in the horizontal (x–z) plane at screen-y = y, approximated by 8 quadratic segments
function ring(s: Sketch, y: number, r: number, cls: string) {
  const n = 8;
  const p = s.path(cls);
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const x = CX + r * Math.cos(a);
    const z = r * Math.sin(a);
    if (i === 0) {
      p.M([x, y], z);
      continue;
    }
    const am = ((i - 0.5) / n) * Math.PI * 2;
    const rc = r / Math.cos(Math.PI / n);
    p.Q([CX + rc * Math.cos(am), y], rc * Math.sin(am), [x, y], z);
  }
}

function rails(
  s: Sketch,
  yTop: number,
  yBot: number,
  rTop: number,
  rBot: number,
  cls: string,
  count: number,
) {
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    s.line(
      [CX + rTop * Math.cos(a), yTop],
      rTop * Math.sin(a),
      [CX + rBot * Math.cos(a), yBot],
      rBot * Math.sin(a),
      cls,
    );
  }
}

function cbox(s: Sketch, y: number, half: number, h: number, cls: { face: string; top: string; side: string }) {
  s.box(CX - half, y, half * 2, h, half, half * 2, cls);
}

function build(s: Sketch, props: SceneProps) {
  const { explode = 1, active = null } = props;
  const gap = 6 + explode * 24;
  const total = MODULES.reduce((a, m) => a + m.h, 0) + gap * (MODULES.length - 1);
  let yBottom = CY + total / 2; // stack centred around y=CY

  for (const m of MODULES) {
    const yTop = yBottom - m.h;
    const yMid = yTop + m.h / 2;
    const on = active === m.id ? " is-active" : active ? " is-dim" : "";
    const ink = m.borrowed ? "ink dash" : "ink";
    s.part(m.id, `class="mod${on}" data-mod="${m.id}"`, () => {
      switch (m.kind) {
        case "nozzle": // borrowed provider layer: bell nozzle, dashed
          ring(s, yTop, m.r * 0.55, ink);
          ring(s, yBottom, m.r, ink);
          rails(s, yTop, yBottom, m.r * 0.55, m.r, ink, 8);
          break;
        case "cyl": // the agent loop: engine drum with a turn arrow
          ring(s, yTop, m.r, ink);
          ring(s, yBottom, m.r, ink);
          ring(s, yMid, m.r * 0.62, "thin");
          rails(s, yTop, yBottom, m.r, m.r, ink, 12);
          break;
        case "box":
          cbox(s, yTop, m.r, m.h, { face: "face3", top: "top3", side: "side3" });
          if (m.ports)
            for (const sx of [-1, 1])
              for (const dz of [-40, 0, 40]) {
                s.line([CX + sx * m.r, yMid], dz, [CX + sx * (m.r + 26), yMid], dz, "ink");
                s.disc([CX + sx * (m.r + 30), yMid], dz, 5, "ink");
              }
          break;
        case "stack": // append-only log: platters
          for (let i = 0; i < 4; i++)
            ring(s, yTop + (i * m.h) / 3, m.r, i === 0 || i === 3 ? ink : "thin");
          rails(s, yTop, yBottom, m.r, m.r, "thin", 16);
          break;
        case "ring": // interrupt / steer control collar
          ring(s, yTop, m.r, ink);
          ring(s, yBottom, m.r, ink);
          ring(s, yTop, m.r * 0.8, "thin");
          ring(s, yBottom, m.r * 0.8, "thin");
          rails(s, yTop, yBottom, m.r, m.r, "thin", 24);
          break;
        case "cage": // sandbox: a cage around a core
          ring(s, yTop, m.r, ink);
          ring(s, yBottom, m.r, ink);
          ring(s, yMid, m.r, "thin");
          rails(s, yTop, yBottom, m.r, m.r, ink, 10);
          cbox(s, yTop + 16, 30, m.h - 32, { face: "face3", top: "top3", side: "side3" });
          break;
        case "pods": // sub-agents: a hub with three pods
          ring(s, yTop, 34, ink);
          ring(s, yBottom, 34, ink);
          rails(s, yTop, yBottom, 34, 34, ink, 8);
          for (let i = 0; i < 3; i++) {
            const a = (i / 3) * Math.PI * 2 + 0.5;
            const px = CX + m.r * Math.cos(a);
            const pz = m.r * Math.sin(a);
            s.line([CX + 34 * Math.cos(a), yMid], 34 * Math.sin(a), [px, yMid], pz, "thin");
            s.box(px - 14, yMid - 14, 28, 28, pz + 14, 28, { face: "face3", top: "top3", side: "side3" });
          }
          break;
        case "drum": // memory: banded vault drum, a separate store from skills
          ring(s, yTop, m.r, ink);
          ring(s, yBottom, m.r, ink);
          for (let i = 1; i < 4; i++) ring(s, yTop + (i * m.h) / 4, m.r, "thin");
          rails(s, yTop, yBottom, m.r, m.r, ink, 6);
          ring(s, yTop, m.r * 0.4, "thin");
          break;
        case "hub": // gateway / sessions: a hub with entry antennas (CLI, API, IM, cron, webhook)
          ring(s, yTop, m.r, ink);
          ring(s, yBottom, m.r, ink);
          rails(s, yTop, yBottom, m.r, m.r, ink, 10);
          for (let i = 0; i < 5; i++) {
            const a = (i / 5) * Math.PI * 2 + 0.3;
            const c = Math.cos(a);
            const z = Math.sin(a);
            s.line([CX + m.r * c, yMid], m.r * z, [CX + (m.r + 30) * c, yMid], (m.r + 30) * z, "ink");
            s.disc([CX + (m.r + 34) * c, yMid], (m.r + 34) * z, 4, "ink");
          }
          break;
        case "gauge": // telemetry: a dial collar with tick marks
          ring(s, yTop, m.r, ink);
          ring(s, yBottom, m.r, ink);
          for (let i = 0; i < 36; i++) {
            const a = (i / 36) * Math.PI * 2;
            const r2 = m.r + (i % 3 === 0 ? 12 : 6);
            s.line([CX + m.r * Math.cos(a), yTop], m.r * Math.sin(a), [CX + r2 * Math.cos(a), yTop], r2 * Math.sin(a), "thin");
          }
          rails(s, yTop, yBottom, m.r, m.r, "thin", 18);
          break;
        case "cone": // eval: nose cone
          ring(s, yBottom, m.r, ink);
          rails(s, yTop, yBottom, 0.1, m.r, ink, 10);
          ring(s, yBottom - m.h * 0.45, m.r * 0.55, "thin");
          break;
      }
    });
    m.anchor = [CX + m.r + (m.ports || m.kind === "hub" ? 40 : 18), yMid];
    yBottom = yTop - gap;
  }
  // central axis (paper-ish, dashed) — the event stream every module reads
  s.bias(-5, () => s.line([CX, CY + total / 2 + 30], 0, [CX, CY - total / 2 - 30], 0, "axis"));
}

const draw = Linework.scene(build);

// anchor of each module on screen for the current view (for leader lines/labels)
export function anchors(view: SceneView, props: SceneProps): Record<string, Pt> {
  const s = Linework.sketch(view);
  build(s, props);
  const out: Record<string, Pt> = {};
  for (const m of MODULES) if (m.anchor) out[m.id] = s.pt(m.anchor, 0);
  return out;
}

export const VIEW: SceneView = { yaw: 0.55, pitch: 0.32, f: 1600, cx: 460, cy: 600 };
export const VIEWBOX = "0 0 920 1200";
export { draw };
