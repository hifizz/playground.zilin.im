"use client";

/**
 * ControlsPanel —— 左侧控件：Title / Caption / 图片上传 / 比例 / 模板 / 导出。
 * 只吐出内容与选择，不碰渲染与导出实现。
 */

import { useRef, useState } from "react";
import { Download, ImagePlus, Loader2, X } from "lucide-react";
import { templates } from "./templates";
import {
  aspectsEqual,
  DEFAULT_IMAGE_TRANSFORM,
  RATIO_PRESETS,
  type Content,
  type ImageTransform,
  type Ratio,
  type RatioPreset,
} from "./types";

type Props = {
  content: Content;
  onTitle: (v: string) => void;
  onCaption: (v: string) => void;
  onImageFile: (file: File) => void;
  onClearImage: () => void;
  onImageTransform: (t: ImageTransform) => void;
  aspect: Ratio;
  onAspect: (r: Ratio) => void;
  templateId: string;
  onTemplate: (id: string) => void;
  onExport: () => void;
  exporting: boolean;
  error?: string | null;
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-400">
      {children}
    </div>
  );
}

/**
 * 比例选择：预设网格 + 自定义 W:H。预设与自定义走同一个 onChange，
 * 自定义输入本地保存字符串（允许清空重填），有效时即时应用；当前 aspect
 * 命中某预设则高亮该预设，否则视为自定义。
 */
function RatioPicker({
  aspect,
  onChange,
}: {
  aspect: Ratio;
  onChange: (r: Ratio) => void;
}) {
  const [cw, setCw] = useState(String(aspect.w));
  const [ch, setCh] = useState(String(aspect.h));

  const activeId = RATIO_PRESETS.find((p) => aspectsEqual(p, aspect))?.id ?? null;
  const isCustom = activeId === null;

  const pickPreset = (p: RatioPreset) => {
    setCw(String(p.w));
    setCh(String(p.h));
    onChange({ w: p.w, h: p.h });
  };

  const onCustom = (wStr: string, hStr: string) => {
    setCw(wStr);
    setCh(hStr);
    const w = parseFloat(wStr);
    const h = parseFloat(hStr);
    if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) {
      onChange({ w: Math.min(w, 1000), h: Math.min(h, 1000) });
    }
  };

  const inputCls =
    "w-14 rounded-md border border-neutral-200 bg-white px-1.5 py-1 text-center text-sm text-neutral-900 outline-none transition focus:border-neutral-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

  return (
    <div>
      <SectionLabel>比例 Ratio</SectionLabel>
      <div className="grid grid-cols-4 gap-1.5">
        {RATIO_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => pickPreset(p)}
            title={p.hint}
            className={[
              "rounded-lg border px-1 py-1.5 text-xs font-medium transition",
              activeId === p.id
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300",
            ].join(" ")}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* 自定义 W:H */}
      <div
        className={[
          "mt-2 flex items-center gap-2 rounded-lg border px-3 py-2 transition",
          isCustom
            ? "border-neutral-900 bg-neutral-900/[0.03]"
            : "border-neutral-200 bg-white",
        ].join(" ")}
      >
        <span className="mr-auto text-xs text-neutral-500">自定义</span>
        <input
          type="number"
          min="0.1"
          step="any"
          inputMode="decimal"
          aria-label="宽度比例"
          value={cw}
          onChange={(e) => onCustom(e.target.value, ch)}
          className={inputCls}
        />
        <span className="text-neutral-400">:</span>
        <input
          type="number"
          min="0.1"
          step="any"
          inputMode="decimal"
          aria-label="高度比例"
          value={ch}
          onChange={(e) => onCustom(cw, e.target.value)}
          className={inputCls}
        />
      </div>
    </div>
  );
}

export function ControlsPanel({
  content,
  onTitle,
  onCaption,
  onImageFile,
  onClearImage,
  onImageTransform,
  aspect,
  onAspect,
  templateId,
  onTemplate,
  onExport,
  exporting,
  error,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const pickFile = (files: FileList | null) => {
    const file = files?.[0];
    if (file) onImageFile(file);
  };

  const transform = content.imageTransform ?? DEFAULT_IMAGE_TRANSFORM;
  const isDefaultTransform =
    transform.fit === "cover" &&
    transform.zoom === 1 &&
    transform.offsetX === 0 &&
    transform.offsetY === 0;

  return (
    <div className="flex w-full flex-col gap-6">
      {/* —— 内容 —— */}
      <div>
        <SectionLabel>标题 Title</SectionLabel>
        <input
          value={content.title}
          onChange={(e) => onTitle(e.target.value)}
          placeholder="输入标题…"
          className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-900/5"
        />
      </div>

      <div>
        <SectionLabel>说明 Caption</SectionLabel>
        <textarea
          value={content.caption}
          onChange={(e) => onCaption(e.target.value)}
          placeholder="一句话说明…"
          rows={3}
          className="w-full resize-none rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm leading-relaxed text-neutral-900 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-900/5"
        />
      </div>

      {/* —— 图片上传 —— */}
      <div>
        <SectionLabel>图片 Image</SectionLabel>
        {content.image ? (
          <div className="flex flex-col gap-3">
            <div className="group relative h-28 w-full overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={content.image}
                alt="已上传"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="rounded-md bg-white/90 px-2.5 py-1.5 text-xs font-medium text-neutral-800 hover:bg-white"
                >
                  更换
                </button>
                <button
                  type="button"
                  onClick={onClearImage}
                  className="flex items-center gap-1 rounded-md bg-white/90 px-2.5 py-1.5 text-xs font-medium text-neutral-800 hover:bg-white"
                >
                  <X size={12} /> 移除
                </button>
              </div>
            </div>

            {/* —— 适配方式 —— */}
            <div className="grid grid-cols-2 gap-1.5">
              {(
                [
                  { fit: "cover", label: "裁满填充" },
                  { fit: "contain", label: "完整显示" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.fit}
                  type="button"
                  onClick={() =>
                    onImageTransform({ ...transform, fit: opt.fit })
                  }
                  className={[
                    "rounded-lg border px-2 py-1.5 text-xs font-medium transition",
                    transform.fit === opt.fit
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300",
                  ].join(" ")}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* —— 缩放 —— */}
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-neutral-500">
                <span>缩放</span>
                <span className="tabular-nums">
                  {Math.round(transform.zoom * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={50}
                max={300}
                step={1}
                value={Math.round(transform.zoom * 100)}
                aria-label="图片缩放"
                onChange={(e) =>
                  onImageTransform({
                    ...transform,
                    zoom: Number(e.target.value) / 100,
                  })
                }
                className="w-full accent-neutral-900"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[11px] text-neutral-400">
                在右侧预览中拖动图片可调整位置
              </span>
              <button
                type="button"
                disabled={isDefaultTransform}
                onClick={() => onImageTransform(DEFAULT_IMAGE_TRANSFORM)}
                className="rounded-md border border-neutral-200 px-2 py-1 text-xs text-neutral-600 transition hover:border-neutral-300 disabled:opacity-40"
              >
                重置
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            onDragEnter={(e) => {
              if (e.dataTransfer.types.includes("Files")) setDragOver(true);
            }}
            onDragOver={(e) => {
              if (e.dataTransfer.types.includes("Files")) e.preventDefault();
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              pickFile(e.dataTransfer.files);
            }}
            className={[
              "flex h-28 w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed transition",
              dragOver
                ? "border-neutral-900 bg-neutral-900/5"
                : "border-neutral-300 bg-neutral-50 hover:border-neutral-400 hover:bg-neutral-100",
            ].join(" ")}
          >
            <ImagePlus size={20} className="text-neutral-400" />
            <span className="text-xs text-neutral-500">
              点击或拖拽上传图片
            </span>
            <span className="text-[10px] text-neutral-400">
              仅在浏览器内处理，不上传服务器
            </span>
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            pickFile(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {/* —— 比例 —— */}
      <RatioPicker aspect={aspect} onChange={onAspect} />

      {/* —— 模板 —— */}
      <div>
        <SectionLabel>版式 Template</SectionLabel>
        <div className="flex flex-col gap-1.5">
          {templates.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onTemplate(t.id)}
              className={[
                "rounded-lg border px-3 py-2 text-left text-sm font-medium transition",
                templateId === t.id
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300",
              ].join(" ")}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {/* —— 导出 —— */}
      <div className="mt-1">
        <button
          type="button"
          onClick={onExport}
          disabled={exporting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-60"
        >
          {exporting ? (
            <>
              <Loader2 size={16} className="animate-spin" /> 导出中…
            </>
          ) : (
            <>
              <Download size={16} /> 导出 PNG（2x）
            </>
          )}
        </button>
        {error ? (
          <p className="mt-2 text-xs text-red-500">{error}</p>
        ) : (
          <p className="mt-2 text-[11px] text-neutral-400">
            浏览器内截图导出，字体就绪后出图，默认 2 倍分辨率。
          </p>
        )}
      </div>
    </div>
  );
}
