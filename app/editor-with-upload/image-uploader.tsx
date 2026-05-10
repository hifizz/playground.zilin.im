"use client";

import { X } from "lucide-react";

export type UploadedImage = {
  id: string;
  url: string;
  name: string;
};

export function filesToImages(files: File[]): UploadedImage[] {
  return files
    .filter((f) => f.type.startsWith("image/"))
    .map((f) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      url: URL.createObjectURL(f),
      name: f.name,
    }));
}

type Props = {
  images: UploadedImage[];
  onRemove: (id: string) => void;
};

export function ImageUploader({ images, onRemove }: Props) {
  if (images.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto p-3 border-b border-neutral-200 dark:border-neutral-800">
      {images.map((img) => (
        <div
          key={img.id}
          className="relative shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-900 group"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img.url}
            alt={img.name}
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={() => onRemove(img.id)}
            aria-label={`Remove ${img.name}`}
            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-black/80"
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}
