"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Search,
  Notebook,
  User,
  // Menu,
  Plus,
} from "lucide-react";

// --- 类型定义 ---
type TabId = "chats" | "search" | "notes" | "profile";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ElementType;
}

// --- 模拟数据与常量 ---
const TABS: Tab[] = [
  { id: "chats", label: "Chats", icon: MessageSquare },
  { id: "search", label: "Search", icon: Search },
  { id: "notes", label: "Notes", icon: Notebook }, // 使用 Notebook 代替 FileText 更像 iOS Notes
  { id: "profile", label: "Profile", icon: User },
];

const MOCK_CHATS = Array.from({ length: 15 }).map((_, i) => ({
  id: i,
  title: `Conversation ${i + 1}`,
  preview:
    i % 2 === 0
      ? "Can you help me summarize this PDF?"
      : "Generate a React component for...",
  time: "10:23 AM",
}));

// --- 组件：页面内容骨架 ---
// 仅用于演示内容在导航栏下方的滚动效果
const ContentSkeleton = ({ activeTab }: { activeTab: TabId }) => {
  if (activeTab === "chats") {
    return (
      <div className="space-y-3 p-4 pb-24">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Messages
          </h1>
          <button className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <Plus size={20} className="text-gray-600 dark:text-gray-300" />
          </button>
        </div>
        {MOCK_CHATS.map((chat) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={chat.id}
            className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800/50 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700/50"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                {chat.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {chat.preview}
              </p>
            </div>
            <span className="text-xs text-gray-400">{chat.time}</span>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl mb-4 flex items-center justify-center">
        {activeTab === "search" && <Search size={32} />}
        {activeTab === "notes" && <Notebook size={32} />}
        {activeTab === "profile" && <User size={32} />}
      </div>
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 capitalize mb-2">
        {activeTab}
      </h2>
      <p className="text-sm">This is the {activeTab} view placeholder.</p>
    </div>
  );
};

// --- 核心组件：Floating Dock ---
const FloatingDock = ({
  activeTab,
  onTabChange,
}: {
  activeTab: TabId;
  onTabChange: (id: TabId) => void;
}) => {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-[90%] flex justify-center">
      {/* Dock 容器
         backdrop-blur-xl: 强高斯模糊 (Glassmorphism)
         shadow-2xl: 深阴影提升层级感
      */}
      <div
        className="
        flex items-center p-1.5 gap-1
        bg-white/80 dark:bg-black/80
        backdrop-blur-xl border border-white/20 dark:border-white/10
        rounded-[24px] shadow-2xl shadow-black/10
      "
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                relative flex items-center justify-center
                h-10 px-3 rounded-[20px] cursor-pointer
                transition-colors duration-300 ease-out
                ${isActive ? "text-white" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"}
              `}
              style={{
                WebkitTapHighlightColor: "transparent",
              }}
            >
              {/* 背景光标 (Active Pill)
                layoutId 确保它在不同 Tab 之间平滑流转
              */}
              {isActive && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 bg-black dark:bg-gray-700 rounded-[20px]"
                  transition={{
                    type: "spring",
                    stiffness: 350,
                    damping: 30,
                  }}
                />
              )}

              {/* 内容层：图标 + 文字 */}
              <div className="relative z-10 flex items-center gap-2">
                {/* 图标：选中时稍微放大一点点 */}
                <motion.div
                  animate={{ scale: isActive ? 1.1 : 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <tab.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </motion.div>

                {/* 文字：只在选中时显示 (Saving Space)
                   使用 AnimatePresence 实现宽度和透明度的丝滑过渡
                */}
                <AnimatePresence initial={false} mode="popLayout">
                  {isActive && (
                    <motion.span
                      initial={{ width: 0, opacity: 0, filter: "blur(4px)" }}
                      animate={{
                        width: "auto",
                        opacity: 1,
                        filter: "blur(0px)",
                      }}
                      exit={{ width: 0, opacity: 0, filter: "blur(4px)" }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                        opacity: { duration: 0.2 },
                      }}
                      className="text-xs font-semibold whitespace-nowrap overflow-hidden"
                    >
                      {tab.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// --- 主应用入口 (模拟 SidePanel 环境) ---
export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("chats");
  const [isDarkMode, setIsDarkMode] = useState(false);

  // 简单的暗黑模式切换逻辑，仅用于演示
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  return (
    <div
      className={`min-h-screen w-full flex items-center justify-center bg-gray-50 ${isDarkMode ? "dark bg-gray-900" : ""}`}
    >
      {/* SidePanel 模拟容器
        宽度限制在 340px，模拟浏览器侧边栏的典型宽度
      */}
      <div className="relative w-full max-w-[340px] h-[600px] bg-gray-50 dark:bg-[#0f0f11] rounded-[32px] overflow-hidden border-4 border-gray-200 dark:border-gray-800 shadow-2xl">
        {/* 顶部简单的 Header (模拟浏览器插件头部) */}
        <div className="h-12 bg-white/50 dark:bg-black/20 backdrop-blur-md flex items-center justify-between px-4 sticky top-0 z-40 border-b border-gray-100 dark:border-gray-800/50">
          <span className="text-xs font-bold text-gray-500 tracking-wider">
            SIDE PANEL
          </span>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-md text-gray-600 dark:text-gray-300"
          >
            {isDarkMode ? "Light" : "Dark"}
          </button>
        </div>

        {/* 可滚动区域 */}
        <div className="h-full overflow-y-auto custom-scrollbar">
          <ContentSkeleton activeTab={activeTab} />
        </div>

        {/* 我们的主角：悬浮导航 */}
        <FloatingDock activeTab={activeTab} onTabChange={setActiveTab} />

        {/* 底部渐变遮罩，防止内容切断太生硬 */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-gray-50 dark:from-[#0f0f11] to-transparent pointer-events-none z-40" />
      </div>
    </div>
  );
}
