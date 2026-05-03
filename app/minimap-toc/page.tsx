"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { ChevronUp, ChevronDown, User, Bot, MessageSquare } from "lucide-react";

/**
 * ============================================================================
 * 1. 类型定义与模拟数据
 * ============================================================================
 */

type Role = "user" | "assistant";

interface Message {
  id: string;
  role: Role;
  content: string;
}

// 模拟数据生成器
const generateMockMessages = (count: number): Message[] => {
  return Array.from({ length: count }).map((_, i) => {
    const isUser = i % 2 === 0;
    return {
      id: `msg-${i}`,
      role: isUser ? "user" : "assistant",
      content: isUser
        ? `[消息 ${i + 1}] 用户提问：这个组件的实现原理是什么？我们需要确保滚动的性能。`
        : `[消息 ${i + 1}] AI 回复：这是一个很长的回复内容，用于测试长文本的展示效果。React 的 Intersection Observer API 非常适合用来处理这种滚动高亮的需求。` +
          " 为了模拟真实场景，我会添加很多废话来增加高度。".repeat(
            Math.floor(Math.random() * 8) + 2,
          ),
    };
  });
};

/**
 * ============================================================================
 * 2. 子组件：Popover (气泡提示)
 * ============================================================================
 * 修改点：
 * 1. 移除了 Header (User/AI 标识和装饰箭头)
 * 2. 圆角改为 rounded-2xl
 * 3. 简化了内部结构，只展示文字
 */
interface PopoverProps {
  message: Message;
  isVisible: boolean;
}

const Popover: React.FC<PopoverProps> = ({ message, isVisible }) => {
  if (!isVisible) return null;

  // 截取前50个字符
  const previewText =
    message.content.slice(0, 50) + (message.content.length > 50 ? "..." : "");

  return (
    <div className="absolute right-10 top-1/2 -translate-y-1/2 z-50 animate-in fade-in slide-in-from-right-4 duration-200 pointer-events-none">
      {/* 修改：rounded-lg -> rounded-2xl, p-3 -> p-4 */}
      <div className="w-64 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-4 relative">
        {/* 装饰性的小三角指向右侧 */}
        <div className="absolute top-1/2 -right-[5px] -translate-y-1/2 w-2.5 h-2.5 bg-zinc-900 border-t border-r border-zinc-700 rotate-45 rounded-sm" />

        {/* 内容预览：纯文字展示 */}
        <p className="text-xs text-zinc-300 font-mono leading-relaxed break-all">
          {previewText}
        </p>
      </div>
    </div>
  );
};

/**
 * ============================================================================
 * 3. 子组件：MinimapLine (单根缩略线)
 * ============================================================================
 * 处理单根线的渲染、Hover状态和点击事件
 */
interface MinimapLineProps {
  msg: Message;
  isActive: boolean;
  index: number;
  onClick: (index: number) => void;
}

const MinimapLine: React.FC<MinimapLineProps> = ({
  msg,
  isActive,
  index,
  onClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const isUser = msg.role === "user";

  // 动态计算样式类名
  const getLineStyles = () => {
    const base = "transition-all duration-300 ease-out rounded-full";
    // 长度区分：用户短，AI长
    const width = isUser ? "w-2" : "w-3";

    // 激活状态：高亮、发光、轻微变长
    if (isActive) {
      return `${base} ${isUser ? "w-4" : "w-4"} h-[1px] bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]`;
    }

    // Hover状态（非激活）：变灰白、变长
    if (isHovered) {
      return `${base} w-4 h-[1px] bg-white`;
    }

    // 默认状态：暗灰色
    return `${base} ${width} h-[1px] bg-zinc-600`;
  };

  return (
    <div
      className="group/line relative flex items-center justify-end py-[5px] cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick(index)}
    >
      <Popover message={msg} isVisible={isHovered} />
      <div className={getLineStyles()} />
    </div>
  );
};

/**
 * ============================================================================
 * 4. 容器组件：ChatMinimap (右侧导航栏)
 * ============================================================================
 */
interface ChatMinimapProps {
  messages: Message[];
  activeIndex: number;
  onScrollTo: (index: number) => void;
}

const ChatMinimap: React.FC<ChatMinimapProps> = ({
  messages,
  activeIndex,
  onScrollTo,
}) => {
  // 处理上一个/下一个点击逻辑
  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeIndex > 0) {
      onScrollTo(activeIndex - 1);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeIndex < messages.length - 1) {
      onScrollTo(activeIndex + 1);
    }
  };

  return (
    // 添加 group 类，以便子元素可以通过 group-hover 控制显示
    <div className="fixed right-8 top-1/2 -translate-y-1/2 flex flex-col items-end z-40 select-none group">
      {/* 上一条按钮
        - 使用 absolute 定位到顶部外部，不影响中间线条布局
        - 默认 opacity-0，group-hover 时变为 opacity-100
      */}
      <button
        onClick={handlePrev}
        disabled={activeIndex === 0}
        className={`
          absolute -top-7 -right-2 p-1 rounded-full
          text-zinc-400 hover:text-white hover:bg-zinc-800
          transition-all duration-300 opacity-0 group-hover:opacity-100
          disabled:opacity-0 disabled:cursor-not-allowed
        `}
      >
        <ChevronUp size={16} />
      </button>

      {/* 消息线条列表 */}
      <div className="flex flex-col items-end">
        {messages.map((msg, index) => (
          <MinimapLine
            key={msg.id}
            index={index}
            msg={msg}
            isActive={index === activeIndex}
            onClick={onScrollTo}
          />
        ))}
      </div>

      {/* 下一条按钮
        - 使用 absolute 定位到底部外部
      */}
      <button
        onClick={handleNext}
        disabled={activeIndex === messages.length - 1}
        className={`
          absolute -bottom-7 -right-2 p-1 rounded-full
          text-zinc-400 hover:text-white hover:bg-zinc-800
          transition-all duration-300 opacity-0 group-hover:opacity-100
          disabled:opacity-0 disabled:cursor-not-allowed
        `}
      >
        <ChevronDown size={16} />
      </button>
    </div>
  );
};

/**
 * ============================================================================
 * 5. 主应用：ChatInterface
 * ============================================================================
 */
export default function ChatInterface() {
  const [messages] = useState<Message[]>(() => generateMockMessages(40)); // 生成40条数据
  const [activeIndex, setActiveIndex] = useState(0);

  // 引用集合，用于滚动和观察
  const messageRefs = useRef<(HTMLDivElement | null)[]>([]);
  // 滚动容器引用
  const containerRef = useRef<HTMLDivElement>(null);

  // --- 核心逻辑：IntersectionObserver 实现双向同步 ---
  useEffect(() => {
    const observerOptions = {
      root: null, // 使用视口作为根
      // 关键设置：将判定区域缩小到屏幕中间的一条缝。
      // '-45% 0px -45% 0px' 意味着只有元素进入屏幕垂直居中的 10% 区域时才算 intersect
      rootMargin: "-45% 0px -45% 0px",
      threshold: 0,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = Number(entry.target.getAttribute("data-index"));
          setActiveIndex(index);
        }
      });
    }, observerOptions);

    // 绑定观察者
    messageRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [messages]);

  // --- 点击跳转逻辑 ---
  const handleScrollTo = (index: number) => {
    const target = messageRefs.current[index];
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div className="flex h-screen bg-black text-white font-sans overflow-hidden">
      {/* 左侧：主聊天区域 */}
      <div
        className="flex-1 h-full overflow-y-auto scroll-smooth relative no-scrollbar"
        ref={containerRef}
      >
        <div className="max-w-3xl mx-auto px-6 py-20 space-y-12">
          <div className="text-center mb-10">
            <h1 className="text-2xl font-bold tracking-tighter flex items-center justify-center gap-2">
              <MessageSquare className="text-zinc-500" />
              Chat TOC · 缩略线导航
            </h1>
            <p className="text-zinc-500 text-sm mt-2">
              滚动页面，右侧缩略线实时同步当前阅读位置；Hover 可预览内容
            </p>
          </div>

          {messages.map((msg, index) => (
            <div
              key={msg.id}
              ref={(el) => { messageRefs.current[index] = el; }}
              data-index={index}
              className={`transition-all duration-500 ${
                // 可选：非当前阅读的消息降低不透明度，增强聚焦感
                activeIndex === index
                  ? "opacity-100 scale-[1.01]"
                  : "opacity-50 blur-[0.5px]"
              }`}
            >
              {/* 消息头部 */}
              <div className="flex items-center gap-2 mb-3">
                <div
                  className={`p-1.5 rounded-full ${msg.role === "user" ? "bg-blue-900/30" : "bg-purple-900/30"}`}
                >
                  {msg.role === "user" ? (
                    <User size={14} className="text-blue-400" />
                  ) : (
                    <Bot size={14} className="text-purple-400" />
                  )}
                </div>
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                  {msg.role.toUpperCase()}
                </span>
              </div>

              {/* 消息气泡 */}
              <div
                className={`p-6 rounded-2xl text-sm leading-7 shadow-lg border ${
                  msg.role === "user"
                    ? "bg-zinc-900/50 border-zinc-800 text-zinc-200"
                    : "bg-transparent border-transparent text-zinc-400 pl-0"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {/* 底部占位，确保最后一条消息能滚到屏幕中间 */}
          <div className="h-[40vh]" />
        </div>
      </div>

      {/* 右侧：Minimap 组件 */}
      <ChatMinimap
        messages={messages}
        activeIndex={activeIndex}
        onScrollTo={handleScrollTo}
      />
    </div>
  );
}
