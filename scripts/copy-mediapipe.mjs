/**
 * 把 @mediapipe/tasks-vision 的 wasm 运行时拷进 public/，实现自托管
 * （不依赖 CDN，国内可访问）。由 predev / prebuild 自动执行，产物不进 git
 * （见 .gitignore）；模型 public/mediapipe/gesture_recognizer.task 已入库。
 */
import { cpSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "node_modules/@mediapipe/tasks-vision/wasm");
const dst = join(root, "public/mediapipe/wasm");

if (!existsSync(src)) {
  console.error("[copy-mediapipe] @mediapipe/tasks-vision 未安装，跳过");
  process.exit(0);
}
mkdirSync(dst, { recursive: true });
cpSync(src, dst, { recursive: true });
console.log("[copy-mediapipe] wasm →", dst);
