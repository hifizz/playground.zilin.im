/** Minimal typed surface of the vendored linework bundle (only what harness-scene uses). */

export type Pt = [number, number];

export interface PathBuilder {
  M(p: Pt, z?: number): unknown;
  Q(c: Pt, cz: number, p: Pt, z?: number): unknown;
}

export type BoxCls = { face?: string; top?: string; side?: string } | string;

export interface Sketch {
  path(cls?: string): PathBuilder;
  line(a: Pt, az: number, b: Pt, bz: number, cls?: string): unknown;
  box(x: number, y: number, w: number, h: number, z: number, d: number, cls?: BoxCls): unknown;
  disc(c: Pt, z: number, r: number, cls?: string): unknown;
  part(id: string, attrs: string, body: () => void): unknown;
  bias(n: number, body: () => void): unknown;
  pt(p: Pt, z?: number): Pt;
}

export interface SceneView {
  yaw: number;
  pitch: number;
  f: number;
  cx: number;
  cy: number;
}

export interface OrbitHandle {
  view: SceneView;
  redraw(): void;
  stop(): void;
}

declare const Linework: {
  sketch(view: SceneView): Sketch;
  scene<P>(build: (s: Sketch, props: P) => void): (view: SceneView, props: P) => string;
  orbit(
    el: Element,
    opts: {
      view: SceneView;
      onFrame: (v: SceneView) => void;
      yawRange?: [number, number];
      pitchRange?: [number, number];
      idle?: boolean;
    },
  ): OrbitHandle;
};

export default Linework;
