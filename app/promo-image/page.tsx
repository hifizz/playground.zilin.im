"use client";

/**
 * ============================================================================
 * 宣传图工具 v1 · Demo 页
 * ============================================================================
 * 用户传入图片 + 填 Title / Caption，工具把它们叠在 paper-shaders 噪点渐变背景上，
 * 按固定版式排好，一键导出静态 PNG。
 *
 * 架构：内容(content) 与 模板(template) 是两份独立数据，通用渲染器 <Artboard>
 * 把它们合成画布，exportArtboardPng() 把画布压平成 PNG。换 template 即换版式。
 *
 * 纯前端：用户图片只在浏览器内经 dataURL 处理，不出浏览器、不上服务器。
 * ============================================================================
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Artboard } from "./renderer";
import { ControlsPanel } from "./controls-panel";
import { exportArtboardPng } from "./export-png";
import { fileToImageDataUrl } from "./image-utils";
import { defaultTemplate, templates } from "./templates";
import { artboardSize, type Content, type Ratio } from "./types";

const DEFAULT_CONTENT: Content = {
  title: "用声音，重新定义交互",
  caption: "上传图片、填两段文字，一键导出带噪点渐变质感的宣传封面。",
};

/** 测量元素可用尺寸（ResizeObserver），用于把画布缩放贴合预览区。 */
function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0].contentRect;
      setSize({ w: cr.width, h: cr.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}

const PREVIEW_PADDING = 56; // 预览区四周留白（px）

export default function PromoImagePage() {
  const [content, setContent] = useState<Content>(DEFAULT_CONTENT);
  const [ratio, setRatio] = useState<Ratio>("4:5");
  const [templateId, setTemplateId] = useState<string>(defaultTemplate.id);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const artboardRef = useRef<HTMLDivElement>(null);
  const [previewRef, avail] = useElementSize<HTMLDivElement>();

  const template = useMemo(
    () => templates.find((t) => t.id === templateId) ?? defaultTemplate,
    [templateId],
  );
  const size = useMemo(() => artboardSize(ratio), [ratio]);

  // 预览缩放：同时受宽、高约束（4:5 较高），不放大超过设计分辨率。
  const scale = useMemo(() => {
    if (avail.w <= 0 || avail.h <= 0) return 0;
    const s = Math.min(
      (avail.w - PREVIEW_PADDING) / size.w,
      (avail.h - PREVIEW_PADDING) / size.h,
    );
    return Math.max(0.05, Math.min(s, 1));
  }, [avail.w, avail.h, size.w, size.h]);

  const onImageFile = useCallback(async (file: File) => {
    setError(null);
    try {
      const url = await fileToImageDataUrl(file);
      setContent((c) => ({ ...c, image: url }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "图片处理失败");
    }
  }, []);

  const clearImage = useCallback(
    () => setContent((c) => ({ ...c, image: undefined })),
    [],
  );

  const handleExport = useCallback(async () => {
    const node = artboardRef.current;
    if (!node) return;
    setExporting(true);
    setError(null);
    try {
      await exportArtboardPng(node, {
        width: size.w,
        height: size.h,
        scale: 2,
        fileName: `promo-${template.id}-${ratio.replace(":", "x")}.png`,
      });
    } catch (e) {
      console.error(e);
      setError("导出失败，请重试");
    } finally {
      setExporting(false);
    }
  }, [size.w, size.h, template.id, ratio]);

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900">
      {/* 顶栏 */}
      <header className="flex h-14 items-center justify-between border-b border-neutral-200 bg-white/80 px-4 backdrop-blur-sm sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="rounded-full border border-neutral-200 px-2.5 py-1 text-xs text-neutral-500 transition hover:bg-neutral-100"
          >
            ← 首页
          </Link>
          <h1 className="text-sm font-semibold tracking-tight">宣传图工具</h1>
          <span className="hidden text-xs text-neutral-400 sm:inline">
            图片 + 文案 → 着色器封面
          </span>
        </div>
      </header>

      {/* 主体：左控件 + 右预览 */}
      <div className="flex flex-col lg:h-[calc(100vh-3.5rem)] lg:flex-row">
        {/* 控件面板 */}
        <aside className="w-full shrink-0 overflow-y-auto border-b border-neutral-200 bg-white p-5 sm:p-6 lg:w-[340px] lg:border-b-0 lg:border-r">
          <ControlsPanel
            content={content}
            onTitle={(v) => setContent((c) => ({ ...c, title: v }))}
            onCaption={(v) => setContent((c) => ({ ...c, caption: v }))}
            onImageFile={onImageFile}
            onClearImage={clearImage}
            ratio={ratio}
            onRatio={setRatio}
            templateId={templateId}
            onTemplate={setTemplateId}
            onExport={handleExport}
            exporting={exporting}
            error={error}
          />
        </aside>

        {/* 预览区 */}
        <main
          ref={previewRef}
          className="relative flex min-h-[62vh] flex-1 items-center justify-center overflow-hidden p-6 lg:min-h-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.05) 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        >
          <div
            style={{
              width: size.w * scale,
              height: size.h * scale,
              borderRadius: 16,
              overflow: "hidden",
              boxShadow:
                "0 24px 60px -20px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.08)",
              visibility: scale > 0 ? "visible" : "hidden",
            }}
          >
            <Artboard
              ref={artboardRef}
              template={template}
              content={content}
              size={size}
              style={{
                transform: `scale(${scale})`,
                transformOrigin: "top left",
              }}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
