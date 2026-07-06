/**
 * 语音控制封装：Web Speech API（SpeechRecognition, zh-CN, 连续模式）。
 *
 * - 命令匹配：把识别文本与命令关键词做包含匹配，命中多个时取
 *   「最长关键词」的那条（例：「太阳系」优先于「太阳」，避免歧义）；
 * - 命中后可用 speechSynthesis 用中文播报确认语（“好的，前往木星”）；
 * - 连续识别会自然断开，onend 自动重启；网络类错误做指数退避，
 *   连续失败 3 次进入 error 状态停止重试；
 * - Safari/Firefox 无 SpeechRecognition → unsupported，页面显示降级提示。
 */

export type VoiceStatus =
  | "starting"
  | "listening"
  | "unsupported"
  | "denied"
  | "error";

export type VoiceCommand = {
  keywords: string[]; // 任一关键词被说到即触发
  reply?: string; // TTS 确认语
  run(): void;
};

export type VoiceController = { dispose(): void };

// 浏览器前缀类型（lib.dom 未内置 webkitSpeechRecognition）
type SR = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: SpeechResultEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
};
type SpeechResultEvent = {
  resultIndex: number;
  results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
};

export function matchCommand(
  text: string,
  commands: VoiceCommand[],
): VoiceCommand | null {
  let best: VoiceCommand | null = null;
  let bestLen = 0;
  for (const cmd of commands) {
    for (const kw of cmd.keywords) {
      if (kw.length > bestLen && text.includes(kw)) {
        best = cmd;
        bestLen = kw.length;
      }
    }
  }
  return best;
}

function speak(text: string) {
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "zh-CN";
    u.rate = 1.05;
    u.volume = 0.9;
    window.speechSynthesis.speak(u);
  } catch {
    // TTS 不可用时静默
  }
}

export function createVoiceControl(opts: {
  getCommands(): VoiceCommand[];
  onHeard(text: string, matched: VoiceCommand | null): void;
  onStatus(s: VoiceStatus): void;
}): VoiceController {
  const { getCommands, onHeard, onStatus } = opts;

  const Ctor =
    (window as unknown as { SpeechRecognition?: new () => SR }).SpeechRecognition ??
    (window as unknown as { webkitSpeechRecognition?: new () => SR })
      .webkitSpeechRecognition;
  if (!Ctor) {
    onStatus("unsupported");
    return { dispose() {} };
  }

  let disposed = false;
  let stopped = false; // denied / 连续失败后不再重启
  let failStreak = 0;
  let restartTimer: ReturnType<typeof setTimeout> | null = null;

  const rec = new Ctor();
  rec.lang = "zh-CN";
  rec.continuous = true;
  rec.interimResults = false;
  rec.maxAlternatives = 1;

  onStatus("starting");

  rec.onresult = (e) => {
    failStreak = 0;
    const res = e.results[e.resultIndex];
    if (!res?.isFinal) return;
    const text = res[0].transcript.trim();
    if (!text) return;
    const cmd = matchCommand(text, getCommands());
    if (cmd) {
      cmd.run();
      if (cmd.reply) speak(cmd.reply);
    }
    onHeard(text, cmd);
  };

  rec.onerror = (e) => {
    if (disposed) return;
    if (e.error === "not-allowed" || e.error === "service-not-allowed") {
      stopped = true;
      onStatus("denied");
    } else if (e.error === "network" || e.error === "audio-capture") {
      failStreak++;
      if (failStreak >= 3) {
        stopped = true;
        onStatus("error");
      }
    }
    // no-speech / aborted 等由 onend 的自动重启兜底
  };

  rec.onend = () => {
    if (disposed || stopped) return;
    // 指数退避重启（连续识别正常也会周期性 end）
    const delay = Math.min(3000, 250 * 2 ** failStreak);
    restartTimer = setTimeout(() => {
      try {
        rec.start();
        onStatus("listening");
      } catch {
        // 已在运行等竞态，忽略
      }
    }, delay);
  };

  try {
    rec.start();
    onStatus("listening");
  } catch {
    onStatus("error");
    stopped = true;
  }

  return {
    dispose() {
      disposed = true;
      if (restartTimer) clearTimeout(restartTimer);
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      try {
        rec.stop();
      } catch {
        // 未启动时 stop 会抛，忽略
      }
      try {
        window.speechSynthesis.cancel();
      } catch {
        // 无 TTS 环境
      }
    },
  };
}
