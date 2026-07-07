/**
 * 图片处理：把上传的 File 转成 dataURL。
 * - 用 dataURL 而非 blob URL：html-to-image 导出时可直接内联，且不触发 canvas 污染。
 * - 大图先在客户端降采样（最长边 ≤ MAX_EDGE）再进画布，控内存 / 性能。
 * - 小图保留原始 dataURL，避免重新编码掉质量、也保留透明通道。
 */

const MAX_EDGE = 2048;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("读取文件失败"));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("图片解码失败"));
    img.src = src;
  });
}

export async function fileToImageDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("请选择图片文件");
  }
  const original = await readAsDataUrl(file);
  const img = await loadImage(original);

  const longest = Math.max(img.naturalWidth, img.naturalHeight);
  if (longest <= MAX_EDGE) {
    return original; // 小图直接用原图
  }

  const scale = MAX_EDGE / longest;
  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return original;
  ctx.drawImage(img, 0, 0, w, h);
  // 降采样后统一转 JPEG（宣传图多为照片），控体积。
  return canvas.toDataURL("image/jpeg", 0.92);
}
