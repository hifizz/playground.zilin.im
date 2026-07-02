'use client';

/**
 * VoiceChatWidget —— 复刻 ElevenLabs 右下角「对话式 AI 语音挂件」
 *
 * 折叠态是一枚玻璃拟态胶囊（语音球图标 +「语音聊天」），点击展开为一张带动效的
 * 对话框：顶部语言选择器 + 最小化键，中部一颗 GrainGradient sphere 语音球（中央
 * 叠通话键），下方说明文字，底部消息输入框。
 *
 * 几个决策：
 * 1. 折叠胶囊里的小球用纯 CSS 径向渐变（静态），不开 shader —— 省一个 WebGL context。
 *    只有对话框展开时才挂载那颗真实的 sphere shader。
 * 2. 对话框从右下角缩放弹出（transformOrigin: bottom right），spring 动画，仿 onboarding。
 * 3. 点通话键切换 inCall：球体流动加速 + 柔光脉冲，模拟正在通话。尊重 prefers-reduced-motion。
 */

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { GrainGradient } from '@paper-design/shaders-react';
import { ChevronDown, Minimize2, Phone, PhoneOff, Send } from 'lucide-react';

const ORB_COLORS = ['#7cc0e8', '#9ad3a4', '#4a90d9', '#8ec98f'];
const ORB_COLOR_BACK = '#eaf3f8';

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

const CIRCLE_MASK =
  'radial-gradient(circle at center, #000 70%, transparent 100%)';

export interface VoiceChatWidgetProps {
  /** 覆盖右下角定位偏移（px），默认 24 */
  offset?: number;
}

export default function VoiceChatWidget({ offset = 24 }: VoiceChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [message, setMessage] = useState('');
  const reduced = usePrefersReducedMotion();

  const toggleCall = useCallback(() => setInCall((c) => !c), []);
  // 收起对话框时一并结束通话（在关闭那一处直接调用，无需 effect）
  const closeWidget = useCallback(() => {
    setInCall(false);
    setOpen(false);
  }, []);

  const anchor = { right: offset, bottom: offset } as const;
  const spring = reduced
    ? { duration: 0.15 }
    : ({ type: 'spring', stiffness: 320, damping: 30 } as const);

  return (
    <>
      {/* 说话/通话时的柔光脉冲 */}
      <style>{`
        @keyframes vcw-orb-pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1);    opacity: 0.45; }
          50%      { transform: translate(-50%, -50%) scale(1.16); opacity: 0.8; }
        }
      `}</style>

      {/* —— 折叠胶囊（FAB）—— */}
      <AnimatePresence>
        {!open && (
          <motion.button
            type="button"
            key="pill"
            aria-label="打开语音聊天"
            onClick={() => setOpen(true)}
            initial={{ opacity: 0, scale: 0.8, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 8 }}
            transition={spring}
            style={{
              position: 'fixed',
              ...anchor,
              zIndex: 50,
              transformOrigin: 'bottom right',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 18px 10px 12px',
              borderRadius: 999,
              border: '1px solid rgba(0,0,0,0.06)',
              background: 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              boxShadow: '0 10px 30px -8px rgba(0,0,0,0.25)',
              cursor: 'pointer',
              color: '#1f1f1f',
              fontSize: 15,
              fontWeight: 500,
            }}
          >
            {/* 静态 CSS 小球（不开 shader） */}
            <span
              aria-hidden
              style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                background:
                  'radial-gradient(circle at 35% 30%, #a8d9ff, #4a90d9 55%, #6fae7a 110%)',
                boxShadow: 'inset -2px -3px 6px rgba(0,0,0,0.18)',
                flexShrink: 0,
              }}
            />
            语音聊天
          </motion.button>
        )}
      </AnimatePresence>

      {/* —— 展开对话框 —— */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="dialog"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={
              reduced
                ? { duration: 0.15 }
                : {
                    type: 'spring',
                    stiffness: 260,
                    damping: 20,
                    // opacity 单独快淡入，不跟随 spring 拖尾
                    opacity: { duration: 0.18 },
                  }
            }
            style={{
              position: 'fixed',
              ...anchor,
              zIndex: 50,
              transformOrigin: 'bottom right',
              width: 380,
              maxWidth: 'calc(100vw - 32px)',
              borderRadius: 28,
              background: '#fff',
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '0 24px 60px -16px rgba(0,0,0,0.32)',
              padding: 20,
              userSelect: 'none',
            }}
          >
            {/* 顶部：语言选择器（居中）+ 最小化键（右上） */}
            <div
              style={{
                position: 'relative',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: 40,
              }}
            >
              <button
                type="button"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '7px 14px',
                  borderRadius: 999,
                  border: '1px solid rgba(0,0,0,0.08)',
                  background: '#fff',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  cursor: 'pointer',
                  fontSize: 15,
                  fontWeight: 500,
                  color: '#1f1f1f',
                }}
              >
                <span aria-hidden style={{ fontSize: 16 }}>
                  🇨🇳
                </span>
                Chinese
                <ChevronDown size={16} color="#9a9a9a" />
              </button>

              <button
                type="button"
                aria-label="最小化"
                onClick={closeWidget}
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 0,
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: 'none',
                  background: '#f2f2f4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <Minimize2 size={16} color="#6a6a6a" />
              </button>
            </div>

            {/* 中部：sphere 语音球 + 中央通话键 */}
            <div
              style={{
                position: 'relative',
                width: 176,
                height: 176,
                margin: '24px auto 8px',
              }}
            >
              {/* 通话中的柔光脉冲 */}
              {inCall && !reduced && (
                <div
                  aria-hidden
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: 176,
                    height: 176,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${ORB_COLORS[0]}, transparent 68%)`,
                    animation: 'vcw-orb-pulse 1.6s ease-in-out infinite',
                    zIndex: 0,
                    pointerEvents: 'none',
                  }}
                />
              )}

              {/* 球体（CSS 遮罩裁圆） */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  WebkitMaskImage: CIRCLE_MASK,
                  maskImage: CIRCLE_MASK,
                  zIndex: 1,
                }}
              >
                <GrainGradient
                  colors={ORB_COLORS}
                  colorBack={ORB_COLOR_BACK}
                  softness={inCall ? 0.5 : 0.7}
                  intensity={inCall ? 0.85 : 0.5}
                  noise={0.28}
                  shape="sphere"
                  speed={reduced ? 0 : inCall ? 1.6 : 0.5}
                  style={{ width: '100%', height: '100%' }}
                />
              </div>

              {/* 中央通话键 */}
              <button
                type="button"
                aria-label={inCall ? '结束通话' : '开始通话'}
                aria-pressed={inCall}
                onClick={toggleCall}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 2,
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  border: 'none',
                  background: inCall ? '#e5484d' : '#fff',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background 240ms ease',
                }}
              >
                {inCall ? (
                  <PhoneOff size={22} color="#fff" />
                ) : (
                  <Phone size={22} color="#171717" fill="#171717" />
                )}
              </button>
            </div>

            {/* 说明文字 */}
            <p
              style={{
                textAlign: 'center',
                fontSize: 14,
                lineHeight: 1.5,
                color: '#6a6a6a',
                margin: '4px 12px 20px',
              }}
            >
              {inCall
                ? '正在通话中，随便和智能体聊聊…'
                : '了解 ElevenLabs 驱动的对话式智能体功能'}
            </p>

            {/* 底部输入框 */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setMessage('');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 6px 6px 18px',
                borderRadius: 999,
                border: '1px solid rgba(0,0,0,0.1)',
                background: '#fff',
              }}
            >
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="或发送消息…"
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: 15,
                  color: '#1f1f1f',
                  background: 'transparent',
                }}
              />
              <button
                type="submit"
                aria-label="发送"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  border: 'none',
                  background: message.trim() ? '#171717' : '#f2f2f4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: message.trim() ? 'pointer' : 'default',
                  transition: 'background 200ms ease',
                  flexShrink: 0,
                }}
              >
                <Send size={17} color={message.trim() ? '#fff' : '#9a9a9a'} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
