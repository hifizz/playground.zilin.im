"use client";

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

/**
 * 样式定义
 */
const STYLE_TAG = `
  @keyframes dot-fade {
    0%, 100% { opacity: 0.3; }
    20% { opacity: 1; }
    50% { opacity: 0.6; }
  }

  @keyframes shadow-pulse {
    0%, 100% { box-shadow: 0px 0px 0px 0px rgba(255, 255, 255, 0); }
    50% { box-shadow: 0px 0px 12px 0px rgba(255, 255, 255, 0.05); }
  }

  .anim-dot {
    animation: dot-fade 1.2s ease-in-out infinite;
  }
`;

// 加载点组件
const RenderingDots = () => (
  <span className="inline-flex ml-0.5 tracking-wider">
    <span className="anim-dot mx-[0.5px]" style={{ animationDelay: '0s' }}>.</span>
    <span className="anim-dot mx-[0.5px]" style={{ animationDelay: '0.15s' }}>.</span>
    <span className="anim-dot mx-[0.5px]" style={{ animationDelay: '0.3s' }}>.</span>
  </span>
);

// 勾选图标
const CheckIcon = ({ size = 10, strokeWidth = 3 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

// Logo 组件（带状态指示点）
const LogoWithStatus = ({ status }: { status: string }) => {
  const dotColor = status === 'rendering' ? 'bg-yellow-400' : 'bg-emerald-400';

  return (
    <div className="relative w-5 h-5 flex-shrink-0">
      <Image
        src="/chatkeep_logo.png"
        alt="ChatKeep"
        width={20}
        height={20}
        className="w-full h-full object-contain"
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
      />
      {/* 状态指示点 - 右下角 */}
      <div className={`absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ${dotColor} border border-black`} />
    </div>
  );
};

/**
 * SyncButton 组件
 */
const SyncButton = ({ status, onClick }: { status: string; onClick?: () => void }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isGrabbing, setIsGrabbing] = useState(false);
  const [snapSide, setSnapSide] = useState<'left' | 'right' | 'none'>('none');
  const [isHovered, setIsHovered] = useState(false);

  const dragRef = useRef({
    startX: 0, startY: 0,
    initialX: 0, initialY: 0,
    lastX: 0, lastY: 0,
    isDragging: false
  });

  // 固定宽度
  const BUTTON_WIDTH = 106;
  const BUTTON_HEIGHT = 40;
  const LOGO_SECTION_WIDTH = 20;
  const REVEAL_WIDTH = 14;
  const EDGE_PADDING = 24;

  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

  const getSnappedX = (side: 'left' | 'right', screenWidth: number) => {
    if (side === 'left') {
      return EDGE_PADDING - (BUTTON_WIDTH - REVEAL_WIDTH);
    }
    return screenWidth - EDGE_PADDING - REVEAL_WIDTH;
  };

  useEffect(() => {
    const initX = (window.innerWidth - BUTTON_WIDTH) / 2;
    const initY = (window.innerHeight - BUTTON_HEIGHT) / 2;
    setPosition({
      x: clamp(initX, 0, window.innerWidth - BUTTON_WIDTH),
      y: clamp(initY, 0, window.innerHeight - BUTTON_HEIGHT),
    });
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        const maxX = window.innerWidth - BUTTON_WIDTH;
        const maxY = window.innerHeight - BUTTON_HEIGHT;
        if (snapSide !== 'none') {
          return {
            x: getSnappedX(snapSide, window.innerWidth),
            y: clamp(prev.y, 0, maxY),
          };
        }
        return {
          x: clamp(prev.x, 0, maxX),
          y: clamp(prev.y, 0, maxY),
        };
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [snapSide]);

  // 鼠标交互处理
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;

    const visualX = position.x + getHoverTranslateX();

    dragRef.current.isDragging = false;
    dragRef.current.startX = e.clientX;
    dragRef.current.startY = e.clientY;
    dragRef.current.initialX = visualX;
    dragRef.current.initialY = position.y;
    dragRef.current.lastX = visualX;
    dragRef.current.lastY = position.y;

    setIsGrabbing(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - dragRef.current.startX;
      const dy = moveEvent.clientY - dragRef.current.startY;

      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        dragRef.current.isDragging = true;
        setIsHovered(false);
      }

      const maxX = window.innerWidth - BUTTON_WIDTH;
      const maxY = window.innerHeight - BUTTON_HEIGHT;
      const newX = clamp(dragRef.current.initialX + dx, 0, maxX);
      const newY = clamp(dragRef.current.initialY + dy, 0, maxY);

      dragRef.current.lastX = newX;
      dragRef.current.lastY = newY;
      setPosition({ x: newX, y: newY });
      setSnapSide('none');
    };

    const handleMouseUp = () => {
      setIsGrabbing(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);

      if (dragRef.current.isDragging) {
        const screenWidth = window.innerWidth;
        const centerX = dragRef.current.lastX + BUTTON_WIDTH / 2;
        const maxX = window.innerWidth - BUTTON_WIDTH;
        const maxY = window.innerHeight - BUTTON_HEIGHT;

        let newSnapSide: 'left' | 'right' | 'none';
        let finalX: number;

        // 判断吸附方向
        if (centerX < screenWidth * 0.3) {
          newSnapSide = 'left';
          finalX = getSnappedX('left', screenWidth);
        } else if (centerX > screenWidth * 0.7) {
          newSnapSide = 'right';
          finalX = getSnappedX('right', screenWidth);
        } else {
          // 不吸附，保持当前位置
          newSnapSide = 'none';
          finalX = clamp(dragRef.current.lastX, 0, maxX);
        }

        setSnapSide(newSnapSide);
        setPosition({ x: finalX, y: clamp(dragRef.current.lastY, 0, maxY) });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleSmartClick = () => {
    if (!dragRef.current.isDragging) {
      onClick?.();
    }
  };

  // 计算 hover 时的位移
  const getHoverTranslateX = () => {
    if (!isHovered || snapSide === 'none') return 0;
    const hiddenWidth = BUTTON_WIDTH - REVEAL_WIDTH;
    return snapSide === 'left' ? hiddenWidth : -hiddenWidth;
  };

  // 是否反转布局（左边吸附时 logo 在右边）
  const isReversed = snapSide === 'left';
  const isCollapsed = snapSide !== 'none' && !isHovered;

  // 获取状态文字
  const getStatusText = () => {
    switch (status) {
      case 'idle': return 'Auto save';
      case 'rendering': return <span className="flex items-center">Syncing<RenderingDots /></span>;
      case 'success': return <span className="flex items-center gap-1">Success <CheckIcon /></span>;
      default: return 'Auto save';
    }
  };

  // 获取 tooltip 文字
  const getTooltipText = () => {
    switch (status) {
      case 'idle': return 'Auto save, click will sync instantly';
      case 'rendering': return 'Syncing in progress...';
      case 'success': return 'Sync completed!';
      default: return 'ChatKeep Sync';
    }
  };

  const dynamicTransition = isGrabbing
    ? "none"
    : "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.3s, border-color 0.3s";

  return (
    <>
      <style>{STYLE_TAG}</style>

      <div
        className="absolute left-0 top-0"
        style={{
          width: BUTTON_WIDTH,
          height: BUTTON_HEIGHT,
          transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        }}
        onMouseDown={handleMouseDown}
        onClick={handleSmartClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        title={getTooltipText()}
      >
        <div
          ref={containerRef}
          className={`flex items-center px-2.5 gap-2 rounded-full border border-white/10 backdrop-blur-xl select-none overflow-hidden cursor-grab active:cursor-grabbing ${isGrabbing ? 'cursor-grabbing' : ''}`}
          style={{
            width: BUTTON_WIDTH,
            height: BUTTON_HEIGHT,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            willChange: "transform",
            transition: dynamicTransition,
            transform: `translate3d(${getHoverTranslateX()}px, 0, 0)`,
            flexDirection: isReversed ? 'row-reverse' : 'row',
          }}
        >
          {/* Logo 区域 */}
          <div
            className="flex items-center justify-center flex-shrink-0"
            style={{ width: LOGO_SECTION_WIDTH }}
          >
            <LogoWithStatus status={status} />
          </div>

          {/* 文字区域 */}
          <div className="flex-1 flex items-center pr-1.5">
            <span className={`text-[11px] font-medium whitespace-nowrap ${status === 'success' ? 'text-emerald-400' : 'text-white/90'}`}>
              {getStatusText()}
            </span>
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

      {/* 按钮 */}
      <SyncButton status={status} onClick={handleProcess} />

      {/* 提示文字 */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-zinc-600 text-xs font-mono whitespace-nowrap pointer-events-none">
        Drag to edges · Hover to expand · Click to sync
      </div>
    </div>
  );
}
