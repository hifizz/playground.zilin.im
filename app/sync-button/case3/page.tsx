"use client";

import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';

/**
 * --------------------------------------------------------------------------
 * 样式定义 (Styles)
 * 为了保持单文件组件的便携性，我们将 Keyframes 和复杂样式注入到组件内部。
 * 在生产环境中，建议将这些移动到 global.css 或 module.css 中。
 * --------------------------------------------------------------------------
 */
const STYLE_TAG = `
  @keyframes dot-fade {
      0%, 100% { opacity: 0.3; }
      20% { opacity: 1; }
      50% { opacity: 0.6; }
  }

  /* 呼吸光晕 */
  @keyframes shadow-pulse {
      0%, 100% { box-shadow: 0px 0px 0px 0px rgba(255, 255, 255, 0); }
      50% { box-shadow: 0px 0px 12px 0px rgba(255, 255, 255, 0.05); }
  }

  @keyframes ripple-ping-green {
      0% { transform: scale(1); opacity: 0.5; }
      100% { transform: scale(2.5); opacity: 0; }
  }

  @keyframes ripple-ping-yellow {
      0% { transform: scale(1); opacity: 0.5; }
      100% { transform: scale(2.5); opacity: 0; }
  }

  .anim-dot {
      animation: dot-fade 1.2s ease-in-out infinite;
  }

  .text-enter {
      opacity: 0;
      filter: blur(4px);
  }

  .text-enter-active {
      opacity: 1;
      filter: blur(0px);
      transition: opacity 0.4s ease-out, filter 0.4s ease-out;
      transition-delay: 0.1s;
  }

  .text-exit {
      opacity: 1;
      filter: blur(0px);
  }

  .text-exit-active {
      opacity: 0;
      filter: blur(4px);
      transition: opacity 0.15s ease-in, filter 0.15s ease-in;
  }

  .btn-active:active {
      transform: scale(0.98);
      transition: transform 0.1s;
  }

  .cursor-grab { cursor: grab; }
  .cursor-grabbing { cursor: grabbing; }
`;

// 图标组件
const CheckIcon = ({ size = 12, strokeWidth = 3 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

// 加载点组件
const RenderingDots = () => (
  <span className="inline-flex ml-0.5 tracking-wider">
    <span className="anim-dot mx-[0.5px]" style={{ animationDelay: '0s' }}>.</span>
    <span className="anim-dot mx-[0.5px]" style={{ animationDelay: '0.15s' }}>.</span>
    <span className="anim-dot mx-[0.5px]" style={{ animationDelay: '0.3s' }}>.</span>
  </span>
);

/**
 * 核心交互容器组件
 */
const AnimatedContainer = ({ status, onClick }) => {
  const containerRef = useRef(null);
  const contentRef = useRef(null);

  // 状态管理
  const [displayStatus, setDisplayStatus] = useState(status);
  const [animState, setAnimState] = useState('idle'); // 'entering', 'exiting', 'idle'

  // 拖拽与位置状态
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isGrabbing, setIsGrabbing] = useState(false);

  const dragRef = useRef({
    startX: 0, startY: 0,
    initialX: 0, initialY: 0,
    lastX: 0, lastY: 0,
    isDragging: false
  });

  // 样式配置字典
  const containerStyles = {
    idle: {
      borderColor: "rgba(255, 255, 255, 0.08)",
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      boxShadow: "0px 0px 0px rgba(0,0,0,0)",
      animation: "none",
      dotColor: "bg-emerald-400",
      textColor: "text-white/90"
    },
    rendering: {
      borderColor: "rgba(255, 255, 255, 0.15)",
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      animation: "shadow-pulse 2s ease-in-out infinite",
      dotColor: "bg-yellow-400",
      textColor: "text-white/90"
    },
    success: {
      borderColor: "rgba(74, 222, 128, 0.3)",
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      boxShadow: "0px 0px 15px rgba(74, 222, 128, 0.1)",
      animation: "none",
      dotColor: "bg-emerald-400",
      textColor: "text-emerald-400"
    }
  };

  // 状态切换与动画序列控制
  useEffect(() => {
    if (status === displayStatus) return;

    // 1. 开始退出旧状态
    setAnimState('exiting');

    const timer = setTimeout(() => {
      // 2. 切换到新状态
      setDisplayStatus(status);
      setAnimState('entering');

      // 3. 动画结束，回到空闲态
      setTimeout(() => {
        setAnimState('idle');
      }, 400);
    }, 150);

    return () => clearTimeout(timer);
  }, [status, displayStatus]);

  // 动态宽度计算
  useLayoutEffect(() => {
    const calculateWidth = () => {
      if (!containerRef.current || !contentRef.current) return;

      const newContentWidth = contentRef.current.scrollWidth;
      // 兜底最小宽度，防止初次渲染文字未加载时的塌陷
      const safeWidth = newContentWidth > 0 ? newContentWidth : 65;

      // Padding (20px) + Gap + Icon + Buffer
      const targetWidth = Math.ceil(safeWidth) + 38 + 6;

      containerRef.current.style.width = `${targetWidth}px`;
    };

    calculateWidth();
    // 双重保险
    requestAnimationFrame(calculateWidth);

  }, [displayStatus]);

  // 鼠标交互处理
  const handleMouseDown = (e) => {
    // 仅允许左键拖动
    if (e.button !== 0) return;

    dragRef.current.isDragging = false;
    dragRef.current.startX = e.clientX;
    dragRef.current.startY = e.clientY;
    dragRef.current.initialX = position.x;
    dragRef.current.initialY = position.y;
    dragRef.current.lastX = position.x;
    dragRef.current.lastY = position.y;

    setIsGrabbing(true);

    const handleMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - dragRef.current.startX;
      const dy = moveEvent.clientY - dragRef.current.startY;

      // 简单的防抖阈值，区分点击和拖拽
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        dragRef.current.isDragging = true;
      }

      const newX = dragRef.current.initialX + dx;
      const newY = dragRef.current.initialY + dy;

      dragRef.current.lastX = newX;
      dragRef.current.lastY = newY;

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsGrabbing(false); // 启用 Transition 过渡
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);

      // --- 吸附逻辑 (Snap to Edge) ---
      if (dragRef.current.isDragging && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const screenWidth = window.innerWidth;
        const centerX = rect.left + rect.width / 2;

        let targetVisualLeft;

        // 判断吸附方向
        if (centerX < screenWidth / 2) {
          targetVisualLeft = 24; // 左侧 Padding
        } else {
          targetVisualLeft = screenWidth - rect.width - 24; // 右侧 Padding
        }

        const currentVisualLeft = rect.left;
        const deltaX = targetVisualLeft - currentVisualLeft;
        const finalX = dragRef.current.lastX + deltaX;

        // 应用吸附，Y轴保持不变
        setPosition({
          x: finalX,
          y: dragRef.current.lastY
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleSmartClick = () => {
    if (!dragRef.current.isDragging) {
      onClick && onClick();
    }
  };

  const activeStyle = containerStyles[status] || containerStyles.idle;
  const contentStyle = containerStyles[displayStatus] || containerStyles.idle;

  // 渲染内部文本内容
  const renderContent = () => {
    const commonClasses = "text-xs font-medium whitespace-nowrap flex items-center";
    switch (displayStatus) {
      case 'idle':
        return <span className={`${commonClasses} ${contentStyle.textColor}`}>Start Sync</span>;
      case 'rendering':
        return <span className={`${commonClasses} ${contentStyle.textColor}`}>Syncing<RenderingDots /></span>;
      case 'success':
        return <span className={`${commonClasses} ${contentStyle.textColor} gap-1.5`}>Success<CheckIcon /></span>;
      default: return null;
    }
  };

  const getTextClasses = () => {
    if (animState === 'exiting') return 'text-exit text-exit-active';
    if (animState === 'entering') return 'text-enter text-enter-active';
    return '';
  };

  // 动态过渡样式
  const dynamicTransition = isGrabbing
    ? "none"
    : "width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.4s, border-color 0.4s, box-shadow 0.4s, transform 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)";

  return (
    <>
      {/* 注入 CSS */}
      <style>{STYLE_TAG}</style>

      <div
        ref={containerRef}
        className={`relative flex items-center gap-2 px-2.5 h-[34px] rounded-full border border-solid backdrop-blur-xl select-none overflow-hidden origin-left btn-active min-w-[80px] ${isGrabbing ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{
          borderColor: activeStyle.borderColor,
          backgroundColor: activeStyle.backgroundColor,
          boxShadow: activeStyle.boxShadow,
          animation: activeStyle.animation,
          willChange: "width, background-color, border-color, transform",
          transition: dynamicTransition,
          transform: `translate3d(${position.x}px, ${position.y}px, 0)`
        }}
        onMouseDown={handleMouseDown}
        onClick={handleSmartClick}
      >
        {/* 左侧状态指示灯 */}
        <div className="relative flex items-center justify-center w-2.5 h-2.5 flex-shrink-0">
           <div className={`w-1.5 h-1.5 rounded-full absolute z-10 transition-colors duration-500 ${activeStyle.dotColor}`}></div>
           {status === 'rendering' && (
             <div className="absolute inset-0 bg-yellow-400 rounded-full" style={{ animation: 'ripple-ping-yellow 1.5s ease-out infinite' }}></div>
           )}
           {status === 'success' && (
             <div className="absolute inset-0 bg-emerald-400 rounded-full" style={{ animation: 'ripple-ping-green 1s ease-out forwards' }}></div>
           )}
        </div>

        {/* 文本容器 */}
        <div className="relative flex items-center overflow-hidden h-full w-full">
          {/* 隐形占位层 (用于测量宽度) */}
          <div ref={contentRef} className="opacity-0 pointer-events-none absolute w-max" aria-hidden="true">
            {renderContent()}
          </div>
          {/* 实际显示层 (用于动画过渡) */}
          <div className={`absolute left-0 top-1/2 -translate-y-1/2 ${getTextClasses()}`}>
             {renderContent()}
          </div>
        </div>
      </div>
    </>
  );
};

/**
 * 主演示组件
 */
export default function DynamicSnapButton() {
  const [status, setStatus] = useState('idle');
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
    <div className="relative w-full h-screen bg-[#0a0a0a] flex items-center justify-center overflow-hidden font-sans text-white">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[100px]"></div>

      {/* 按钮容器 */}
      <div className="relative z-10 w-[300px] flex justify-start pl-8">
        <AnimatedContainer status={status} onClick={handleProcess} />
        <div className="absolute -bottom-12 left-8 text-zinc-600 text-[10px] font-mono whitespace-nowrap pointer-events-none">
          Drag me · Snap to edge · Click to sync
        </div>
      </div>
    </div>
  );
}
