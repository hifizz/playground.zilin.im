"use client";
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { Check } from 'lucide-react';

/**
 * --------------------------------------------------------------------------
 * 动画配置 (Animation Configuration)
 * --------------------------------------------------------------------------
 */

// 1. 三个点的动画序列 (保持经典波浪效果)
const dotVariants = {
  initial: { opacity: 0.3 },
  animate: (i: number) => ({
    opacity: [0.3, 1, 0.6, 0.3],
    transition: {
      duration: 1.2,
      repeat: Infinity,
      ease: "easeInOut",
      delay: i * 0.15, //稍微调快一点节奏
      times: [0, 0.2, 0.5, 1]
    }
  })
};

// 2. 容器样式变体
const containerVariants = {
  idle: {
    borderColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    boxShadow: "0px 0px 0px rgba(0,0,0,0)",
  },
  rendering: {
    borderColor: "rgba(255, 255, 255, 0.15)",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    boxShadow: [
      "0px 0px 0px 0px rgba(255, 255, 255, 0)",
      "0px 0px 12px 0px rgba(255, 255, 255, 0.05)",
      "0px 0px 0px 0px rgba(255, 255, 255, 0)"
    ],
    transition: {
      boxShadow: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  },
  success: {
    borderColor: "rgba(74, 222, 128, 0.3)",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    boxShadow: "0px 0px 15px rgba(74, 222, 128, 0.1)",
  }
};

// 3. 核心文本动画：实现"先伸长，后显示"的关键
const textVariants = {
  initial: {
    opacity: 0,
    x: -10, // 稍微带点位移，更有动感
    filter: "blur(4px)"
  },
  animate: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: {
        // 关键点：延迟文字显示。
        // 等待容器宽度动画先“跑”一会 (spring动画通常在前100-200ms变化最大)
        delay: 0.15,
        duration: 0.4,
        ease: "easeOut"
    }
  },
  exit: {
    opacity: 0,
    x: 10,
    filter: "blur(4px)",
    position: "absolute", // 核心 Trick: 退出元素绝对定位，不占空间，容器瞬间吸附到新宽度
    transition: {
        duration: 0.1 // 快速退出，不拖泥带水
    }
  }
}

// 子组件：加载中的点
const RenderingDots = () => (
  <span className="inline-flex ml-1 tracking-wider">
    {[0, 1, 2].map((i) => (
      <motion.span
        key={i}
        custom={i}
        variants={dotVariants as Variants}
        initial="initial"
        animate="animate"
        className="text-white mx-[1px]"
      >
        .
      </motion.span>
    ))}
  </span>
);

export default function App() {
  const [status, setStatus] = useState('idle');
  // 使用 ref 来避免多次点击
  const isProcessing = useRef(false);

  const handleProcess = () => {
    if (status !== 'idle' || isProcessing.current) return;
    isProcessing.current = true;

    setStatus('rendering');

    setTimeout(() => {
      setStatus('success');
      setTimeout(() => {
        setStatus('idle');
        isProcessing.current = false;
      }, 2500);
    }, 3000);
  };

  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] flex items-center justify-center relative overflow-hidden font-sans">

      {/* 装饰背景 */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[100px]"></div>

      {/* 对齐容器：
          为了实现"左侧固定，向右伸长"，我们需要一个左对齐的父容器。
          w-[300px] 是为了给右侧伸长预留空间，避免布局跳动。
      */}
      <div className="relative z-10 w-[300px] flex justify-start pl-8">

        <motion.button
          layout // 开启布局投影动画
          onClick={handleProcess}
          variants={containerVariants as Variants}
          initial="idle"
          animate={status}
          whileTap={{ scale: 0.98 }}
          // 物理弹簧配置：stiffness 高一点让反应更灵敏，damping 适中避免过度回弹
          transition={{
            layout: { type: "spring", stiffness: 600, damping: 35 },
            default: { duration: 0.3 }
          }}
          className={`
            relative flex items-center gap-2 px-3 py-2.5 h-[42px]
            rounded-full border-1 backdrop-blur-xl
            cursor-pointer select-none outline-none
            overflow-hidden
            origin-left // 确保变换原点在左侧
          `}
        >
          {/* 左侧指示灯：使用 layout 属性，让它在容器变形时稳定锚定 */}
          <motion.div layout="position" className="relative flex items-center justify-center w-3 h-3 flex-shrink-0">
             <motion.div
               className={`w-2 h-2 rounded-full absolute z-10 transition-colors duration-500 ${status === 'idle' ? 'bg-zinc-500' : 'bg-[#4ADE80]'}`}
             />
             <AnimatePresence>
               {status === 'rendering' && (
                 <motion.div
                   className="absolute inset-0 bg-[#4ADE80] rounded-full"
                   initial={{ scale: 1, opacity: 0.5 }}
                   animate={{ scale: 2.5, opacity: 0 }}
                   exit={{ opacity: 0 }}
                   transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                 />
               )}
             </AnimatePresence>
          </motion.div>

          {/* 文本区域容器
             设置为 relative，因为退出的文字会变成 absolute。
             如果不设 relative，absolute 元素会飞到 button 左上角。
          */}
          <motion.div layout className="relative flex items-center">
            <AnimatePresence mode="popLayout" initial={false}>

              {status === 'idle' && (
                <motion.span
                  key="idle"
                  variants={textVariants as Variants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="text-sm font-medium text-white/80 whitespace-nowrap"
                >
                  Start Sync
                </motion.span>
              )}

              {status === 'rendering' && (
                <motion.span
                  key="rendering"
                  variants={textVariants as Variants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="text-sm font-medium text-white/90 flex items-center whitespace-nowrap"
                >
                  Rendering
                  <RenderingDots />
                </motion.span>
              )}

              {status === 'success' && (
                <motion.span
                  key="success"
                  variants={textVariants as Variants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="text-sm font-medium text-emerald-400 flex items-center gap-1.5 whitespace-nowrap"
                >
                  Success
                  <Check size={14} strokeWidth={3} />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>

        </motion.button>

        {/* 说明文字 */}
        <div className="absolute -bottom-12 left-8 text-zinc-600 text-xs font-mono whitespace-nowrap">
          Left-anchored · Prioritized Expansion
        </div>

      </div>
    </div>
  );
}
