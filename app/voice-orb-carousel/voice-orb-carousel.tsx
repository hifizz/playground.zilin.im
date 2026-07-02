'use client';

/**
 * VoiceOrbCarousel —— 用 paper-shaders 复刻 ElevenLabs 的音色球轮播
 *
 * 依赖： npm i @paper-design/shaders-react   （建议锁死具体版本，别用 ^，0.0.x 会带破坏性变更）
 *
 * 几个关键决策：
 * 1. 圆是 CSS 遮罩裁的，不是 shader 给的。paper-shaders 渲染矩形 canvas，
 *    圆形 + 软边靠 border-radius + radial-gradient mask。
 * 2. 性能：每个 shader = 一个独立 WebGL context，浏览器上限 ~8-16 个。
 *    所以只有「激活」的中间那颗真正在动（speed>0），左右邻居 speed=0（静止但仍占 context），
 *    最外侧两片虚化 sliver 干脆用 CSS 渐变，不开 shader —— 全程真实 WebGL context 只有 3 个。
 * 3. 尊重 prefers-reduced-motion，激活球也会停。
 * 4. 支持键盘左右方向键、点邻居切换、可选 onPlay 回调。
 */

import {
  useCallback,
  useEffect,
  useState,
  type CSSProperties,
} from 'react';
import { MeshGradient, GrainGradient } from '@paper-design/shaders-react';

type OrbType = 'mesh' | 'grain';

export interface OrbConfig {
  id: string;
  label: string;
  description: string;
  type: OrbType;
  colors: string[];
  /** 仅 grain 类型用得上 */
  colorBack?: string;
}

/** 照着截图扒的三颗，配色按需微调 */
export const DEFAULT_ORBS: OrbConfig[] = [
  {
    id: 'character',
    label: '角色',
    description: '适合动画或游戏的生动有趣音色。',
    type: 'mesh',
    colors: ['#7c6fc4', '#a89be0', '#f3b58f', '#f7d3b4'],
  },
  {
    id: 'narration',
    label: '旁白',
    description: '富有表现力的音色，让有声书和播客更生动。',
    type: 'grain',
    colors: ['#b7c7e6', '#ff8f9a', '#ff6b5c', '#ff8a3d'],
    colorBack: '#ff7a52',
  },
  {
    id: 'dialogue',
    label: '对话',
    description: '适用于非正式场景的自然音色。',
    type: 'mesh',
    colors: ['#8fb4d6', '#6fa85c', '#9ccf72', '#f0a878'],
  },
];

// —— 布局常量（按 |slot 距离| 索引：0=激活 / 1=邻居 / 2=最外虚化片）——
const ORB_BASE = 320; // 基准直径（px），实际大小 = ORB_BASE * scale
const RING_X = [0, 360, 645]; // 相对中心的水平偏移
const RING_SCALE = [1.25, 0.86, 0.56];
const RING_OPACITY = [1, 0.97, 0.4];
const RING_MASK_INNER = [68, 60, 48]; // 径向遮罩实心半径（%），越外圈越虚
const ORB_CENTER_Y = 218; // 球心纵向位置
const LABEL_Y = 442; // 文字行纵向位置
const CONTAINER_H = 560;
const CHEVRON_OFFSET = 208; // 左右箭头离中心的水平距离

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  return reduced;
}

/** 单颗球的着色层：mesh / grain 两种 shader */
function OrbShader({
  orb,
  animated,
}: {
  orb: OrbConfig;
  animated: boolean;
}) {
  const fill: CSSProperties = { width: '100%', height: '100%' };

  if (orb.type === 'grain') {
    return (
      <GrainGradient
        colors={orb.colors}
        colorBack={orb.colorBack}
        softness={0.7}
        intensity={0.45}
        noise={0.3}
        shape="wave"
        speed={animated ? 0.4 : 0}
        style={fill}
      />
    );
  }

  return (
    <MeshGradient
      colors={orb.colors}
      distortion={1}
      swirl={0.6}
      grainMixer={0.4}
      grainOverlay={0.15}
      speed={animated ? 0.3 : 0}
      style={fill}
    />
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="#171717" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

export interface VoiceOrbCarouselProps {
  orbs?: OrbConfig[];
  /** 初始停在哪颗，默认「旁白」，跟截图一致 */
  initialIndex?: number;
  /** 点激活球中间的播放键时触发 */
  onPlay?: (orb: OrbConfig) => void;
  className?: string;
}

export default function VoiceOrbCarousel({
  orbs = DEFAULT_ORBS,
  initialIndex = 1,
  onPlay,
  className,
}: VoiceOrbCarouselProps) {
  const n = orbs.length;
  const [active, setActive] = useState(((initialIndex % n) + n) % n);
  const reducedMotion = usePrefersReducedMotion();

  const go = useCallback(
    (dir: number) => setActive((i) => (i + dir + n) % n),
    [n],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  const slots = [-2, -1, 0, 1, 2];

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: CONTAINER_H,
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* —— 球层 —— */}
      {slots.map((d) => {
        const dist = Math.abs(d);
        const sign = Math.sign(d);
        const idx = (active + d + n) % n;
        const orb = orbs[idx];
        const isActive = d === 0;
        const isFar = dist === 2;

        const maskImage = `radial-gradient(circle at center, #000 ${RING_MASK_INNER[dist]}%, transparent 100%)`;

        return (
          <div
            key={d}
            onClick={isActive ? undefined : () => setActive(idx)}
            style={{
              position: 'absolute',
              left: '50%',
              top: ORB_CENTER_Y,
              transform: `translate(-50%, -50%) translateX(${sign * RING_X[dist]}px)`,
              opacity: RING_OPACITY[dist],
              cursor: isActive ? 'default' : 'pointer',
              transition:
                'transform 500ms cubic-bezier(0.22,1,0.36,1), opacity 500ms ease',
              zIndex: 10 - dist,
              willChange: 'transform, opacity',
            }}
          >
            <div
              style={{
                width: ORB_BASE,
                height: ORB_BASE,
                transform: `scale(${RING_SCALE[dist]})`,
                borderRadius: '50%',
                overflow: 'hidden',
                WebkitMaskImage: maskImage,
                maskImage,
                transition: 'transform 500ms cubic-bezier(0.22,1,0.36,1)',
              }}
            >
              {isFar ? (
                // 最外侧虚化片：不开 shader，CSS 渐近似，省一个 WebGL context
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    background: `linear-gradient(160deg, ${orb.colors[0]}, ${
                      orb.colors[orb.colors.length - 1]
                    })`,
                  }}
                />
              ) : (
                <OrbShader orb={orb} animated={isActive && !reducedMotion} />
              )}
            </div>
          </div>
        );
      })}

      {/* —— 播放键（只在激活球上）—— */}
      <button
        type="button"
        aria-label={`播放 ${orbs[active].label} 示例`}
        onClick={() => onPlay?.(orbs[active])}
        style={{
          position: 'absolute',
          left: '50%',
          top: ORB_CENTER_Y,
          transform: 'translate(-50%, -50%)',
          zIndex: 20,
          width: 72,
          height: 72,
          borderRadius: '50%',
          border: 'none',
          background: '#fff',
          boxShadow: '0 6px 24px rgba(0,0,0,0.14)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          paddingLeft: 4, // 三角形视觉居中
        }}
      >
        <PlayIcon />
      </button>

      {/* —— 左右切换 —— */}
      <NavButton dir={-1} onClick={() => go(-1)} />
      <NavButton dir={1} onClick={() => go(1)} />

      {/* —— 文字层（激活 + 左右邻居）—— */}
      {[-1, 0, 1].map((d) => {
        const idx = (active + d + n) % n;
        const orb = orbs[idx];
        const isActive = d === 0;

        return (
          <div
            key={`label-${d}`}
            style={{
              position: 'absolute',
              left: '50%',
              top: LABEL_Y,
              transform: `translateX(calc(-50% + ${d * RING_X[1]}px))`,
              width: 240,
              textAlign: 'center',
              transition: 'transform 500ms cubic-bezier(0.22,1,0.36,1)',
            }}
          >
            <div
              style={{
                fontSize: 20,
                fontWeight: isActive ? 600 : 500,
                color: '#1f1f1f',
                marginBottom: 8,
              }}
            >
              {orb.label}
              {isActive && <span style={{ marginLeft: 6 }}>↗</span>}
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.5, color: '#9a9a9a' }}>
              {orb.description}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function NavButton({ dir, onClick }: { dir: -1 | 1; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={dir === -1 ? '上一个' : '下一个'}
      onClick={onClick}
      style={{
        position: 'absolute',
        top: ORB_CENTER_Y,
        left: '50%',
        transform: `translate(-50%, -50%) translateX(${dir * CHEVRON_OFFSET}px)`,
        zIndex: 30,
        width: 40,
        height: 40,
        borderRadius: '50%',
        border: 'none',
        background: 'transparent',
        color: '#b5b5b5',
        fontSize: 26,
        lineHeight: 1,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {dir === -1 ? '‹' : '›'}
    </button>
  );
}
