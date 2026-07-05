/**
 * 程序化太空氛围音：零音频资源，全部用 Web Audio 现场合成。
 *
 * 声音设计（三层）：
 * 1. 深空低鸣 —— 两只 55Hz 左右微失谐的正弦波产生缓慢拍频 + 一只八度上方
 *    的三角波，过低通滤波；两只超低频 LFO 分别推滤波器截止频率与音量，
 *    让声音像潮汐一样起伏。
 * 2. 恒星辉光 —— 白噪声过高 Q 带通（~1.4kHz），LFO 缓慢扫频，
 *    听感类似太阳风的"咝鸣"。
 * 3. 脉动 —— 110Hz 正弦被 0.22Hz 的 LFO 做振幅调制，给场景一个心跳。
 *
 * AnalyserNode 挂在主输出上，getLevel() 返回平滑后的能量 0..1，
 * 场景用它驱动太阳亮度 / 辉光 / bloom 强度 —— 画面随声音呼吸。
 *
 * 注意：AudioContext 必须由用户手势创建/恢复，start() 只能在点击回调里调。
 */

export type SpaceAudio = {
  start(): Promise<void>;
  stop(): Promise<void>;
  getLevel(): number;
  dispose(): void;
};

export function createSpaceAudio(): SpaceAudio {
  let ctx: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  let freqData: Uint8Array<ArrayBuffer> | null = null;
  let smoothed = 0;

  const build = () => {
    ctx = new AudioContext();
    const master = ctx.createGain();
    master.gain.value = 0.16;
    analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.85;
    freqData = new Uint8Array(analyser.frequencyBinCount);
    master.connect(analyser);
    analyser.connect(ctx.destination);

    // ---- 1. 深空低鸣 ----
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 260;
    lowpass.Q.value = 0.8;
    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.5;
    lowpass.connect(droneGain);
    droneGain.connect(master);

    for (const [type, freq, gain] of [
      ["sine", 55, 0.6],
      ["sine", 55.6, 0.6], // 与上一只形成 0.6Hz 拍频
      ["triangle", 110.3, 0.22],
    ] as const) {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.value = gain;
      osc.connect(g);
      g.connect(lowpass);
      osc.start();
    }

    // 潮汐 LFO：推滤波器截止 & 音量
    const lfoFilter = ctx.createOscillator();
    lfoFilter.frequency.value = 0.06;
    const lfoFilterAmp = ctx.createGain();
    lfoFilterAmp.gain.value = 130;
    lfoFilter.connect(lfoFilterAmp);
    lfoFilterAmp.connect(lowpass.frequency);
    lfoFilter.start();

    const lfoVol = ctx.createOscillator();
    lfoVol.frequency.value = 0.11;
    const lfoVolAmp = ctx.createGain();
    lfoVolAmp.gain.value = 0.16;
    lfoVol.connect(lfoVolAmp);
    lfoVolAmp.connect(droneGain.gain);
    lfoVol.start();

    // ---- 2. 恒星辉光（太阳风咝鸣） ----
    const noiseLen = ctx.sampleRate * 2;
    const noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < noiseLen; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuf;
    noise.loop = true;
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = "bandpass";
    bandpass.frequency.value = 1400;
    bandpass.Q.value = 9;
    const shimmerGain = ctx.createGain();
    shimmerGain.gain.value = 0.05;
    noise.connect(bandpass);
    bandpass.connect(shimmerGain);
    shimmerGain.connect(master);
    noise.start();

    const lfoShimmer = ctx.createOscillator();
    lfoShimmer.frequency.value = 0.05;
    const lfoShimmerAmp = ctx.createGain();
    lfoShimmerAmp.gain.value = 600;
    lfoShimmer.connect(lfoShimmerAmp);
    lfoShimmerAmp.connect(bandpass.frequency);
    lfoShimmer.start();

    // ---- 3. 脉动（0.22Hz 振幅调制的心跳） ----
    const pulse = ctx.createOscillator();
    pulse.type = "sine";
    pulse.frequency.value = 110;
    const pulseGain = ctx.createGain();
    pulseGain.gain.value = 0; // 由 LFO 全深度调制
    const lfoPulse = ctx.createOscillator();
    lfoPulse.frequency.value = 0.22;
    const lfoPulseAmp = ctx.createGain();
    lfoPulseAmp.gain.value = 0.07;
    lfoPulse.connect(lfoPulseAmp);
    lfoPulseAmp.connect(pulseGain.gain);
    pulse.connect(pulseGain);
    pulseGain.connect(master);
    pulse.start();
    lfoPulse.start();
  };

  return {
    async start() {
      if (!ctx) build();
      if (ctx!.state !== "running") await ctx!.resume();
    },
    async stop() {
      if (ctx && ctx.state === "running") await ctx.suspend();
      smoothed = 0;
    },
    getLevel() {
      if (!ctx || !analyser || !freqData || ctx.state !== "running") return 0;
      analyser.getByteFrequencyData(freqData);
      let sum = 0;
      for (let i = 0; i < freqData.length; i++) sum += freqData[i];
      const raw = sum / freqData.length / 255;
      // 低频 drone 能量集中，raw 偏小：放大并平滑
      const target = Math.min(1, raw * 3.2);
      smoothed += (target - smoothed) * 0.12;
      return smoothed;
    },
    dispose() {
      void ctx?.close();
      ctx = null;
    },
  };
}
