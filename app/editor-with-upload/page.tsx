"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import {
  ImageUploader,
  filesToImages,
  type UploadedImage,
} from "./image-uploader";
import { TiptapEditor } from "./tiptap-editor";
import "./editor.css";

export default function EditorWithUploadPage() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounter = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((files: File[]) => {
    const next = filesToImages(files);
    if (next.length === 0) return;
    setImages((prev) => [...prev, ...next]);
  }, []);

  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((img) => img.id !== id);
    });
  }, []);

  // Revoke any remaining blob URLs on unmount.
  useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onDragEnter = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes("Files")) return;
    dragCounter.current += 1;
    setIsDragOver(true);
  };
  const onDragLeave = () => {
    dragCounter.current = Math.max(0, dragCounter.current - 1);
    if (dragCounter.current === 0) setIsDragOver(false);
  };
  const onDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes("Files")) {
      e.preventDefault();
    }
  };
  const onDrop = (e: React.DragEvent) => {
    dragCounter.current = 0;
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files ?? []);
    if (files.length > 0) {
      e.preventDefault();
      addFiles(files);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <header className="mb-6">
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
            Editor with Upload
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Tiptap 编辑器 + 图片上传：拖拽 / 粘贴图片到编辑器，附件区始终保持在顶部，撑高整个容器。
          </p>
        </header>

        <div
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDragOver={onDragOver}
          onDrop={onDrop}
          className={[
            "relative rounded-2xl bg-white dark:bg-neutral-900",
            "border transition-colors",
            isDragOver
              ? "border-blue-500 ring-2 ring-blue-500/30"
              : "border-neutral-200 dark:border-neutral-800 focus-within:border-neutral-400 dark:focus-within:border-neutral-600",
          ].join(" ")}
        >
          <ImageUploader images={images} onRemove={removeImage} />

          <TiptapEditor onFiles={addFiles} />

          <div className="flex items-center justify-between px-3 py-2 border-t border-neutral-200 dark:border-neutral-800">
            <span className="text-xs text-neutral-400 dark:text-neutral-500">
              拖拽或粘贴图片到编辑器即可上传
            </span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
            >
              <ImagePlus size={14} />
              上传图片
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                addFiles(files);
                e.target.value = "";
              }}
            />
          </div>

          {isDragOver && (
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-blue-500/5 flex items-center justify-center">
              <div className="text-sm font-medium text-blue-600 dark:text-blue-400 bg-white/80 dark:bg-neutral-900/80 backdrop-blur px-3 py-1.5 rounded-full border border-blue-500/30">
                松开鼠标上传图片
              </div>
            </div>
          )}
        </div>

        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-4">
          注：图片仅在浏览器内通过 blob URL 预览，刷新即丢失。
        </p>
      </div>
    </div>
  );
}
