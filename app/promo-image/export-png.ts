/**
 * 导出管线：把 Artboard DOM 节点压平成静态 PNG。
 *
 * 步骤：
 * 1. await document.fonts.ready —— 确保字体（尤其 CJK / web font）已加载，
 *    否则截图里字体会退化 / 位置错。
 * 2. 等一帧 rAF —— 让着色器把最新一帧提交进（preserveDrawingBuffer 保留的）缓冲。
 * 3. 预先内联字体 CSS（带超时兜底）—— html-to-image 会把 DOM 序列化进一张
 *    隔离的 SVG 再光栅化，隔离环境拿不到页面的 web font，需要把 @font-face 内联。
 *    这一步偶尔会卡在字体资源请求上，故加超时：拿不到就退化到系统字体，绝不吊死。
 * 4. html-to-image 按 scale 光栅化；style 覆盖掉预览用的缩放 transform，
 *    以设计空间原始尺寸 × scale 出图。
 * 5. 触发下载。
 */

import { getFontEmbedCSS, toPng } from "html-to-image";

const nextFrame = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/** 给一个 promise 套超时；超时则用 fallback 兜底（不 reject）。 */
function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    let done = false;
    const timer = setTimeout(() => {
      if (!done) {
        done = true;
        resolve(fallback);
      }
    }, ms);
    p.then(
      (v) => {
        if (!done) {
          done = true;
          clearTimeout(timer);
          resolve(v);
        }
      },
      () => {
        if (!done) {
          done = true;
          clearTimeout(timer);
          resolve(fallback);
        }
      },
    );
  });
}

export type ExportOptions = {
  /** 设计空间尺寸（未缩放的画布像素） */
  width: number;
  height: number;
  /** 导出倍率，默认 2x */
  scale?: number;
  fileName?: string;
};

export async function exportArtboardPng(
  node: HTMLElement,
  { width, height, scale = 2, fileName = "promo.png" }: ExportOptions,
): Promise<string> {
  if (typeof document !== "undefined" && "fonts" in document) {
    await withTimeout(document.fonts.ready, 4000, undefined as never);
  }
  await nextFrame();

  // 预先算好字体内联 CSS（超时退化为空串 → 用系统字体）。
  const fontEmbedCSS = await withTimeout(getFontEmbedCSS(node), 4000, "");

  const render = () =>
    toPng(node, {
      width,
      height,
      pixelRatio: scale,
      fontEmbedCSS,
      // 覆盖预览缩放：以原始设计尺寸渲染克隆节点。
      style: {
        transform: "none",
        transformOrigin: "top left",
        margin: "0",
      },
    });

  // html-to-image 首次调用偶发失败（画布 / 图片尚未解码就绪），重试一次兜底。
  let dataUrl = "";
  let renderErr: unknown = null;
  for (let attempt = 0; attempt < 2 && !dataUrl; attempt++) {
    if (attempt > 0) await nextFrame();
    dataUrl = await withTimeout(
      render().catch((e) => {
        renderErr = e;
        return "";
      }),
      20000,
      "",
    );
  }
  if (!dataUrl) {
    console.error("[promo-image] export failed:", renderErr);
    throw new Error("导出失败，请重试");
  }

  // 触发下载：锚点须挂进文档才能在各浏览器稳定触发（尤其 data: URL）。
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = fileName;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return dataUrl;
}
