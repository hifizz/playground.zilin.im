"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";

/**
 * ============================================================================
 * Shader 效果 · 流动的光
 * ============================================================================
 * 4 个纯 WebGL 实时渲染效果，每个的核心都是一段片段着色器：每个像素拿自己的
 * 坐标 + 时间(+ 用户输入)，算出此刻的颜色。
 *   ① 语音流光带 —— 两层 noise 叠出起伏上边缘，音量 uniform 控制振幅
 *   ② 呼吸光环   —— SDF 辉光 + sin 脉动半径 + cos 三相位流光，鼠标牵引
 *   ③ 边缘流光   —— 到最近屏幕边缘的距离做 mask，四周一圈跑彩虹（Apple Intelligence）
 *   ④ 弥散渐变   —— noise 扭曲坐标后多色连续混合 = mesh gradient
 *
 * 从原始 vanilla WebGL demo 移植为 React：着色器源码保持不变，WebGL 初始化 /
 * rAF 循环 / resize 全部放进一个 useEffect，卸载时清理。交互状态用 ref 传给
 * 渲染循环（避免每帧 setState），只有按钮的可见态用 React state。
 * ============================================================================
 */

const HEADER = `precision highp float;
uniform vec2 uRes; uniform float uTime; uniform vec2 uMouse; uniform float uParam;`;

const NOISE = `
vec3 permute(vec3 x){return mod(((x*34.0)+1.0)*x,289.0);}
float snoise(vec2 v){
  const vec4 C=vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);
  vec2 i=floor(v+dot(v,C.yy));
  vec2 x0=v-i+dot(i,C.xx);
  vec2 i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0);
  vec4 x12=x0.xyxy+C.xxzz; x12.xy-=i1;
  i=mod(i,289.0);
  vec3 p=permute(permute(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));
  vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0);
  m=m*m; m=m*m;
  vec3 x=2.0*fract(p*C.www)-1.0;
  vec3 h=abs(x)-0.5; vec3 ox=floor(x+0.5); vec3 a0=x-ox;
  m*=1.79284291400159-0.85373472095314*(a0*a0+h*h);
  vec3 g; g.x=a0.x*x0.x+h.x*x0.y; g.yz=a0.yz*x12.xz+h.yz*x12.yw;
  return 130.0*dot(m,g);
}`;

/* ① 语音流光带 */
const F1 =
  HEADER +
  NOISE +
  `
void main(){
  vec2 uv=gl_FragCoord.xy/uRes.xy;
  float vol=uParam;
  float t=uTime;
  // 起伏的上边缘:两层 noise，振幅随音量
  float w1=snoise(vec2(uv.x*3.0 - t*0.6, t*0.3));
  float w2=snoise(vec2(uv.x*7.0 + t*0.5, t*0.2+5.0));
  float base=0.12+0.05*vol;
  float h=base + (w1*0.5+w2*0.3)*(0.10+vol*0.42);
  h=max(h,0.02);            // 关键修复:夹住 h 不让它变负,否则整列会被点亮成竖光柱
  // 底部亮、到 h 高度柔和衰减为 0(方向固定,不会反转)
  float glow=1.0 - smoothstep(0.0, h, uv.y);
  glow=pow(glow,1.3);
  // 颜色沿 x 流动:橙 -> 粉 -> 蓝
  float f=uv.x + 0.08*sin(t*0.5) + w1*0.06;
  vec3 orange=vec3(1.0,0.6,0.24);
  vec3 pink=vec3(1.0,0.5,0.72);
  vec3 blue=vec3(0.43,0.66,1.0);
  vec3 col = f<0.5 ? mix(orange,pink,f*2.0) : mix(pink,blue,(f-0.5)*2.0);
  col *= glow*(0.85+vol*0.6);
  gl_FragColor=vec4(col,1.0);
}`;

/* ② 呼吸光环 */
const F2 =
  HEADER +
  `
void main(){
  vec2 uv=gl_FragCoord.xy/uRes.xy;
  float asp=uRes.x/uRes.y;
  vec2 p=uv-0.5; p.x*=asp;
  // 鼠标牵引
  vec2 m=(uMouse-0.5); m.x*=asp;
  p-=m*0.35;
  float t=uTime;
  float r=length(p);
  float radius=0.26+sin(t*1.3)*0.025;      // 呼吸
  float ring=abs(r-radius);
  float glow=0.010/(ring+0.006);            // 辉光
  glow*=smoothstep(0.6,0.0,r);
  float ang=atan(p.y,p.x);
  // 沿角度流动的冷调彩虹(青-蓝-绿)
  vec3 col=0.5+0.5*cos(ang*1.0 + t*0.8 + vec3(0.0,1.3,2.2));
  col=mix(col, vec3(0.2,0.8,0.9), 0.25);
  col*=glow;
  gl_FragColor=vec4(col,1.0);
}`;

/* ③ 边缘流光 */
const F3 =
  HEADER +
  NOISE +
  `
void main(){
  vec2 uv=gl_FragCoord.xy/uRes.xy;
  float t=uTime;
  float trig=uParam; // 0..1 唤醒强度
  // 到最近边缘的距离
  float edge=min(min(uv.x,1.0-uv.x),min(uv.y,1.0-uv.y));
  float band=0.06+0.10*trig;
  float mask=smoothstep(band,0.0,edge);
  // 沿边缘流动的彩虹
  float flow=uv.x*1.5+uv.y*1.5 + t*0.25 + snoise(uv*2.2+t*0.3)*0.5;
  vec3 col=0.5+0.5*cos(6.2831*flow + vec3(0.0,2.094,4.188));
  col*=mask*(0.35+0.9*trig);
  gl_FragColor=vec4(col,1.0);
}`;

/* ④ 弥散渐变 */
const F4 =
  HEADER +
  NOISE +
  `
void main(){
  vec2 uv=gl_FragCoord.xy/uRes.xy;
  float t=uTime;
  vec2 p=uv;
  p+=0.32*vec2(snoise(uv*1.5+t*0.18), snoise(uv*1.5+8.0-t*0.14));
  float ang=0.5*snoise(uv*1.1+t*0.1);
  float s=sin(ang),c=cos(ang);
  p=0.5+mat2(c,-s,s,c)*(p-0.5);
  float n1=snoise(p*1.3+t*0.16)*0.5+0.5;
  float n2=snoise(p*1.3+5.0-t*0.12)*0.5+0.5;
  vec3 c0=vec3(0.03,0.56,0.70);  // 青
  vec3 c1=vec3(0.15,0.39,0.92);  // 蓝
  vec3 c2=vec3(0.02,0.71,0.51);  // 绿
  vec3 c3=vec3(0.20,0.83,0.86);  // 亮青
  vec3 col=mix(mix(c0,c1,n1),mix(c2,c3,n1),n2);
  gl_FragColor=vec4(col,1.0);
}`;

const VERT = `attribute vec2 aPos;void main(){gl_Position=vec4(aPos,0.0,1.0);}`;

type Card = {
  canvas: HTMLCanvasElement;
  gl: WebGLRenderingContext;
  prog: WebGLProgram;
  u: {
    res: WebGLUniformLocation | null;
    time: WebGLUniformLocation | null;
    mouse: WebGLUniformLocation | null;
    param: WebGLUniformLocation | null;
  };
  paramFn: ((t: number) => number) | null;
  mouse: [number, number];
  onMove: (e: MouseEvent) => void;
  onLeave: () => void;
};

export default function ShaderFlowingLightPage() {
  // canvas refs
  const c1 = useRef<HTMLCanvasElement | null>(null);
  const c2 = useRef<HTMLCanvasElement | null>(null);
  const c3 = useRef<HTMLCanvasElement | null>(null);
  const c4 = useRef<HTMLCanvasElement | null>(null);
  const wakeLabelRef = useRef<HTMLSpanElement | null>(null);

  // 交互状态（渲染循环读取，用 ref 避免每帧 setState）
  const autoTalkRef = useRef(false);
  const volRef = useRef(0.4);
  const wakeRef = useRef(0);

  // 仅用于按钮 / 滑块的可见态
  const [autoTalk, setAutoTalk] = useState(false);
  const [vol, setVol] = useState(0.4);
  const [webglFailed, setWebglFailed] = useState(false);

  useEffect(() => {
    const cards: Card[] = [];

    const makeCard = (
      canvas: HTMLCanvasElement | null,
      frag: string,
      paramFn: ((t: number) => number) | null
    ) => {
      if (!canvas) return;
      const gl = (canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
      if (!gl) {
        setWebglFailed(true);
        return;
      }
      const comp = (ty: number, src: string) => {
        const s = gl.createShader(ty)!;
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
          console.error(gl.getShaderInfoLog(s));
        return s;
      };
      const prog = gl.createProgram()!;
      gl.attachShader(prog, comp(gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, comp(gl.FRAGMENT_SHADER, frag));
      gl.linkProgram(prog);
      gl.useProgram(prog);
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
        gl.STATIC_DRAW
      );
      const loc = gl.getAttribLocation(prog, "aPos");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      const u = {
        res: gl.getUniformLocation(prog, "uRes"),
        time: gl.getUniformLocation(prog, "uTime"),
        mouse: gl.getUniformLocation(prog, "uMouse"),
        param: gl.getUniformLocation(prog, "uParam"),
      };
      const card: Card = {
        canvas,
        gl,
        prog,
        u,
        paramFn,
        mouse: [0.5, 0.5],
        onMove: (e: MouseEvent) => {
          const r = canvas.getBoundingClientRect();
          card.mouse = [
            (e.clientX - r.left) / r.width,
            1.0 - (e.clientY - r.top) / r.height,
          ];
        },
        onLeave: () => {
          card.mouse = [0.5, 0.5];
        },
      };
      canvas.addEventListener("mousemove", card.onMove);
      canvas.addEventListener("mouseleave", card.onLeave);
      cards.push(card);
      resizeCard(card);
    };

    const resizeCard = (card: Card) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = card.canvas.clientWidth;
      const h = card.canvas.clientHeight;
      card.canvas.width = w * dpr;
      card.canvas.height = h * dpr;
      card.gl.viewport(0, 0, card.canvas.width, card.canvas.height);
    };

    const onResize = () => cards.forEach(resizeCard);
    window.addEventListener("resize", onResize);

    // paramFn ①：语音音量包络
    const vol1 = (t: number) => {
      if (autoTalkRef.current) {
        // 模拟说话包络:几个不同频率的正弦叠加 + 停顿
        let v = 0.5 + 0.5 * Math.sin(t * 7.0);
        v *= 0.6 + 0.4 * Math.sin(t * 2.3 + 1.0);
        v *= 0.7 + 0.3 * Math.sin(t * 13.0);
        return Math.max(0.05, Math.min(1.0, v * 0.9 + 0.1));
      }
      return volRef.current;
    };

    // paramFn ③：唤醒强度衰减 + 状态标签
    const wake3 = () => {
      wakeRef.current *= 0.975; // 缓慢衰减
      if (wakeLabelRef.current)
        wakeLabelRef.current.textContent =
          wakeRef.current > 0.15 ? "唤醒中" : "待机";
      return Math.max(0.08, wakeRef.current); // 保留一点常亮边缘
    };

    makeCard(c1.current, F1, vol1);
    makeCard(c2.current, F2, null);
    makeCard(c3.current, F3, wake3);
    makeCard(c4.current, F4, null);

    const start = performance.now();
    let raf = 0;
    const loop = (now: number) => {
      const t = (now - start) / 1000;
      cards.forEach((c) => {
        const gl = c.gl;
        gl.useProgram(c.prog);
        gl.uniform2f(c.u.res, c.canvas.width, c.canvas.height);
        gl.uniform1f(c.u.time, t);
        gl.uniform2f(c.u.mouse, c.mouse[0], c.mouse[1]);
        gl.uniform1f(c.u.param, c.paramFn ? c.paramFn(t) : 0.0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      cards.forEach((c) => {
        c.canvas.removeEventListener("mousemove", c.onMove);
        c.canvas.removeEventListener("mouseleave", c.onLeave);
        const ext = c.gl.getExtension("WEBGL_lose_context");
        if (ext) ext.loseContext();
      });
    };
  }, []);

  return (
    <main
      className="min-h-screen"
      style={{ background: "#08080c", color: "#e7e7ee" }}
    >
      <Link
        href="/"
        className="fixed left-5 top-5 z-50 rounded-full border px-3 py-1.5 text-xs backdrop-blur-sm transition hover:text-white"
        style={{ borderColor: "#22222c", background: "rgba(0,0,0,0.4)", color: "#8a8a99" }}
      >
        ← 首页
      </Link>

      <div className="mx-auto max-w-[1080px] px-6 pb-2 pt-16">
        <h1 className="mb-1.5 text-xl tracking-tight">用 Shader 复刻「流动的光」</h1>
        <p className="text-[13px] leading-relaxed" style={{ color: "#8a8a99" }}>
          4 个效果都是纯 WebGL 实时渲染，每一个的核心都是一段片段着色器：每个像素拿自己的坐标 + 时间(+ 你给的输入)，算出此刻的颜色。拖滑块、点按钮，看它们怎么随输入变形。
        </p>
      </div>

      {webglFailed && (
        <div className="mx-auto max-w-[1080px] px-6 pb-2">
          <div
            className="rounded-lg border px-4 py-3 text-xs"
            style={{ borderColor: "#22222c", color: "#8a8a99" }}
          >
            当前环境未启用 WebGL，效果无法渲染。
          </div>
        </div>
      )}

      <div className="mx-auto grid max-w-[1080px] grid-cols-1 gap-[18px] px-6 pb-11 pt-[18px] md:grid-cols-2">
        {/* ① 语音流光带 */}
        <Card>
          <CanvasBox canvasRef={c1} />
          <Meta n="①" title="语音流光带">
            两层 noise 叠出起伏的上边缘，音量作为 uniform 控制振幅高度——这就是「光随声音起伏」。对应图3那条小爱语音光。
          </Meta>
          <div className="mt-3 flex flex-wrap items-center gap-2.5 px-4 pb-4">
            <span className="text-[11px]" style={{ color: "#8a8a99", minWidth: 34 }}>
              音量
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={vol}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setVol(v);
                volRef.current = v;
              }}
              className="sfl-range"
            />
            <button
              type="button"
              onClick={() => {
                const next = !autoTalk;
                setAutoTalk(next);
                autoTalkRef.current = next;
              }}
              className="sfl-btn"
              data-on={autoTalk || undefined}
            >
              {autoTalk ? "自动说话 ●" : "自动说话"}
            </button>
          </div>
        </Card>

        {/* ② 呼吸光环 */}
        <Card>
          <CanvasBox canvasRef={c2} />
          <Meta n="②" title="呼吸光环">
            SDF 算到圆环的距离，取倒数得辉光；半径随时间做 sin 脉动 = 呼吸，颜色沿角度用 cos 三相位错开 = 流光。对应图5的呼吸光球 / 手势光。鼠标移入会牵引它。
          </Meta>
        </Card>

        {/* ③ 边缘流光 */}
        <Card>
          <CanvasBox canvasRef={c3} />
          <Meta n="③" title="边缘流光 · Apple Intelligence">
            用到最近屏幕边缘的距离做 mask，只让四周一圈发光，里面跑流动的彩虹——Siri 唤醒时那圈边缘光的核心做法。
          </Meta>
          <div className="mt-3 flex flex-wrap items-center gap-2.5 px-4 pb-4">
            <button
              type="button"
              onClick={() => {
                wakeRef.current = 1.0;
              }}
              className="sfl-btn"
            >
              唤醒 ✨
            </button>
            <span
              ref={wakeLabelRef}
              className="text-[11px]"
              style={{ color: "#8a8a99" }}
            >
              待机
            </span>
          </div>
        </Card>

        {/* ④ 弥散渐变 */}
        <Card>
          <CanvasBox canvasRef={c4} />
          <Meta n="④" title="弥散渐变 · AI Color">
            noise 扭曲坐标后，在几个颜色之间连续混合，整片色彩场缓慢流动 = mesh gradient。对应图1的主题色和图2的 AI Color。
          </Meta>
        </Card>
      </div>

      <style>{`
        .sfl-range{-webkit-appearance:none;appearance:none;flex:1;min-width:120px;height:4px;border-radius:4px;background:#22222c;outline:none;cursor:pointer}
        .sfl-range::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:#2dd4bf;cursor:pointer;border:2px solid #08080c}
        .sfl-range::-moz-range-thumb{width:12px;height:12px;border-radius:50%;background:#2dd4bf;cursor:pointer;border:2px solid #08080c}
        .sfl-btn{border:1px solid #22222c;background:#14141c;color:#e7e7ee;font-size:12px;padding:7px 14px;border-radius:999px;cursor:pointer;transition:.15s}
        .sfl-btn:hover{border-color:#2dd4bf;color:#fff}
        .sfl-btn[data-on]{background:#2dd4bf;border-color:#2dd4bf;color:#08080c;font-weight:600}
      `}</style>
    </main>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="overflow-hidden rounded-2xl border"
      style={{ borderColor: "#22222c", background: "#0b0b11" }}
    >
      {children}
    </div>
  );
}

function CanvasBox({
  canvasRef,
}: {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}) {
  return (
    <div className="relative w-full" style={{ height: 260, background: "#000" }}>
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}

function Meta({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-4 pb-0 pt-3.5">
      <h3 className="mb-1.5 flex items-center gap-2 text-sm">
        <span style={{ color: "#2dd4bf", fontVariantNumeric: "tabular-nums" }}>
          {n}
        </span>
        {title}
      </h3>
      <p className="text-xs leading-relaxed" style={{ color: "#8a8a99" }}>
        {children}
      </p>
    </div>
  );
}
