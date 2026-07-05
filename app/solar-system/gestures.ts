/**
 * 摄像头手势识别封装：MediaPipe GestureRecognizer（VIDEO 模式，双手）。
 *
 * - 模型给出离散手势分类（Closed_Fist / Open_Palm / Pointing_Up /
 *   Thumb_Up / Thumb_Down / Victory / ILoveYou）+ 每只手 21 个关节点；
 * - 在其上叠加自定义「捏合」检测：拇指尖(4)与食指尖(8)的距离按手掌
 *   尺寸（腕(0)→中指根(9)）归一化后小于阈值即视为捏住；
 * - 光标 = 掌心（腕/食指根/小指根均值），x 轴镜像成自拍视角。
 *
 * wasm 与模型全部自托管（无 CDN 依赖）：wasm 由 scripts/copy-mediapipe.mjs
 * 在 dev/build 前从 node_modules 拷进 public/mediapipe/wasm；模型文件
 * public/mediapipe/gesture_recognizer.task 已入库。加载失败走 onStatus("error")。
 */

const WASM_URL = "/mediapipe/wasm";
const MODEL_URL = "/mediapipe/gesture_recognizer.task";

export type HandFrame = {
  gesture: string; // MediaPipe 分类名，无手势时 "None"
  pinch: boolean; // 自定义捏合
  cursor: { x: number; y: number }; // 掌心 0..1（x 已镜像）
  landmarks: { x: number; y: number }[]; // 归一化关节点（未镜像，画预览用）
};

export type GestureStatus = "loading" | "ready" | "denied" | "error";

export type GestureController = { dispose(): void };

export async function createGestureController(opts: {
  video: HTMLVideoElement;
  onFrame(hands: HandFrame[]): void;
  onStatus(s: GestureStatus, detail?: string): void;
}): Promise<GestureController> {
  const { video, onFrame, onStatus } = opts;
  let disposed = false;
  let rafId = 0;
  let stream: MediaStream | null = null;
  let recognizer: { close(): void } | null = null;

  onStatus("loading");

  const dispose = () => {
    disposed = true;
    cancelAnimationFrame(rafId);
    recognizer?.close();
    recognizer = null;
    stream?.getTracks().forEach((t) => t.stop());
    stream = null;
    video.srcObject = null;
  };

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, facingMode: "user" },
      audio: false,
    });
  } catch {
    onStatus("denied");
    return { dispose };
  }
  if (disposed) {
    stream.getTracks().forEach((t) => t.stop());
    return { dispose };
  }
  video.srcObject = stream;
  await video.play().catch(() => {});

  try {
    const vision = await import("@mediapipe/tasks-vision");
    const fileset = await vision.FilesetResolver.forVisionTasks(WASM_URL);
    const make = (delegate: "GPU" | "CPU") =>
      vision.GestureRecognizer.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate },
        runningMode: "VIDEO",
        numHands: 2,
      });
    let rec: Awaited<ReturnType<typeof make>>;
    try {
      rec = await make("GPU");
    } catch {
      rec = await make("CPU"); // 无 WebGPU/GL 环境回退
    }
    recognizer = rec;
    if (disposed) {
      dispose();
      return { dispose };
    }
    onStatus("ready");

    let lastVideoTime = -1;
    const loop = () => {
      if (disposed) return;
      rafId = requestAnimationFrame(loop);
      if (video.readyState < 2 || video.currentTime === lastVideoTime) return;
      lastVideoTime = video.currentTime;
      const result = rec.recognizeForVideo(video, performance.now());
      const hands: HandFrame[] = [];
      for (let i = 0; i < result.landmarks.length; i++) {
        const lm = result.landmarks[i];
        const palm = {
          x: (lm[0].x + lm[5].x + lm[17].x) / 3,
          y: (lm[0].y + lm[5].y + lm[17].y) / 3,
        };
        const handSize = Math.hypot(lm[0].x - lm[9].x, lm[0].y - lm[9].y) || 1;
        const pinchDist = Math.hypot(lm[4].x - lm[8].x, lm[4].y - lm[8].y);
        hands.push({
          gesture: result.gestures[i]?.[0]?.categoryName ?? "None",
          pinch: pinchDist / handSize < 0.38,
          cursor: { x: 1 - palm.x, y: palm.y }, // 镜像成自拍视角
          landmarks: lm.map((p) => ({ x: p.x, y: p.y })),
        });
      }
      onFrame(hands);
    };
    loop();
  } catch (err) {
    console.error("Gesture model load failed:", err);
    onStatus("error", err instanceof Error ? err.message : String(err));
  }

  return { dispose };
}
