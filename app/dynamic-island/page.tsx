"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  BellOff,
  Music,
  Phone,
  Fingerprint,
  CheckCircle2,
  BatteryCharging,
  ChevronRight,
  Pause,
  SkipForward,
  SkipBack,
  Share2,
  Navigation,
  Timer,
  Mic,
  CloudUpload,
  CarFront
} from 'lucide-react';

// 动画物理参数配置 - 模拟 iOS 阻尼感
const SPRING_CONFIG = {
  type: "spring",
  stiffness: 380,
  damping: 30,
};

// 灵动岛组件
const DynamicIsland = ({ state }) => {
  // 定义不同状态下的尺寸与圆角
  const variants = {
    idle: {
      width: 120,
      height: 36,
      borderRadius: 24
    },
    ring: {
      width: 360,
      height: 84,
      borderRadius: 42
    },
    music: {
      width: 360,
      height: 190,
      borderRadius: 48
    },
    payment: {
      width: 220,
      height: 220,
      borderRadius: 48
    },
    charge: {
      width: 240,
      height: 50,
      borderRadius: 30
    },
    silent: {
      width: 200,
      height: 50,
      borderRadius: 30
    },
    airdrop: {
      width: 320,
      height: 80,
      borderRadius: 40
    },
    navigation: {
      width: 340,
      height: 80,
      borderRadius: 40
    },
    timer: {
      width: 260,
      height: 60,
      borderRadius: 35
    },
    recorder: {
      width: 300,
      height: 70,
      borderRadius: 40
    },
    upload: {
      width: 280,
      height: 60,
      borderRadius: 35
    },
    ride: {
      width: 320,
      height: 80,
      borderRadius: 40
    }
  };

  return (
    // 修改点 1: 移除 flex 布局，外层由父级 absolute 控制位置
    // 保持 motion.div 的 layout 属性，但在绝对定位下它不会触发周围元素重排
    <motion.div
      layout
      initial={false}
      animate={state}
      variants={variants}
      transition={SPRING_CONFIG}
      className="bg-black relative overflow-hidden text-white shadow-2xl z-[999] mx-auto border border-white/5"
      style={{ transformOrigin: "top center" }}
    >
        <div className="w-full h-full relative">
          <AnimatePresence mode="wait">

            {/* --- 1. 待机模式 (Idle) --- */}
            {state === 'idle' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="w-full h-full flex items-center justify-center cursor-pointer group"
              >
                  <div className="w-20 h-full bg-transparent group-hover:bg-white/5 transition-colors duration-300" />
              </motion.div>
            )}

            {/* --- 2. 来电模式 (Ring) --- */}
            {state === 'ring' && (
              <motion.div
                key="ring"
                initial={{ opacity: 0, scale: 0.9, filter: "blur(4px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.9, filter: "blur(4px)" }}
                className="w-full h-full px-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-inner">
                    妈
                  </div>
                  <div className="flex flex-col justify-center leading-tight">
                    <span className="text-[10px] text-gray-400 font-medium tracking-wide">iPhone</span>
                    <span className="text-sm font-semibold">妈妈 来电...</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white"
                  >
                    <Phone size={18} className="rotate-[135deg]" />
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white"
                  >
                    <Phone size={18} />
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* --- 3. 音乐模式 (Music) --- */}
            {state === 'music' && (
              <motion.div
                key="music"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="w-full h-full p-6 flex flex-col justify-between"
              >
                <div className="flex items-center gap-4">
                  <motion.div
                    layoutId="cover"
                    className="w-14 h-14 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-lg shrink-0"
                  />
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-bold truncate">Starboy</span>
                    <span className="text-xs text-gray-400 truncate">The Weeknd • Daft Punk</span>
                  </div>
                  <div className="w-6 h-6 flex items-center justify-center">
                    <MusicWaveform color="text-green-400" />
                  </div>
                </div>

                <div className="flex items-center gap-3 text-[10px] text-gray-400 font-medium mt-1">
                  <span>1:20</span>
                  <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: "0%" }}
                      animate={{ width: "35%" }}
                      className="h-full bg-white rounded-full"
                    />
                  </div>
                  <span>-2:30</span>
                </div>

                <div className="flex items-center justify-center gap-8 mt-1">
                   <motion.button whileTap={{ scale: 0.8 }}><SkipBack size={24} fill="currentColor" className="text-white" /></motion.button>
                   <motion.button whileTap={{ scale: 0.8 }}><Pause size={32} fill="currentColor" className="text-white" /></motion.button>
                   <motion.button whileTap={{ scale: 0.8 }}><SkipForward size={24} fill="currentColor" className="text-white" /></motion.button>
                </div>
              </motion.div>
            )}

            {/* --- 4. 支付模式 (Payment) --- */}
            {state === 'payment' && (
              <motion.div
                key="payment"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="w-full h-full flex flex-col items-center justify-center gap-4 text-center"
              >
                <motion.div
                    initial={{ scale: 0.5, rotate: -90, color: "#3b82f6" }}
                    animate={{ scale: 1, rotate: 0, color: "#22c55e" }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="relative"
                >
                    <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full" />
                    <CheckCircle2 size={56} className="relative z-10" />
                </motion.div>
                <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-bold">支付成功</span>
                    <span className="text-xs text-gray-400">Apple Store</span>
                </div>
              </motion.div>
            )}

             {/* --- 5. 充电模式 (Charge) --- */}
             {state === 'charge' && (
              <motion.div
                key="charge"
                initial={{ opacity: 0, scaleY: 0.5 }}
                animate={{ opacity: 1, scaleY: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full px-5 flex items-center justify-between"
              >
                <span className="text-xs font-medium text-green-400">正在充电</span>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">75%</span>
                    <BatteryCharging size={18} className="text-green-400" />
                </div>
              </motion.div>
            )}

            {/* --- 6. 静音模式 (Silent) --- */}
            {state === 'silent' && (
              <motion.div
                key="silent"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full h-full px-4 flex items-center justify-between bg-neutral-800/50"
              >
                 <div className="flex items-center gap-3 text-red-500">
                    <BellOff size={20} fill="currentColor" />
                    <span className="text-sm font-semibold text-white">静音模式</span>
                 </div>
                 <span className="text-xs font-medium text-red-500">开启</span>
              </motion.div>
            )}

            {/* --- 7. AirDrop (传输) --- */}
            {state === 'airdrop' && (
              <motion.div
                key="airdrop"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full h-full px-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-500/30 animate-ping rounded-full" />
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white relative z-10">
                       <Share2 size={20} />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-400">AirDrop</span>
                    <span className="text-sm font-semibold">正在发送...</span>
                  </div>
                </div>
                {/* 简单的 SVG 环形进度条 */}
                <div className="relative w-10 h-10 flex items-center justify-center">
                    <svg className="w-full h-full rotate-[-90deg]">
                        <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-gray-700" />
                        <motion.circle
                            cx="20" cy="20" r="16"
                            stroke="currentColor" strokeWidth="3" fill="transparent"
                            className="text-blue-500"
                            strokeDasharray="100"
                            strokeDashoffset="100"
                            animate={{ strokeDashoffset: 20 }}
                            transition={{ duration: 2, ease: "easeInOut" }}
                        />
                    </svg>
                </div>
              </motion.div>
            )}

            {/* --- 8. 地图导航 (Navigation) --- */}
            {state === 'navigation' && (
              <motion.div
                key="navigation"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="w-full h-full px-5 flex items-center justify-between"
              >
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-neutral-800 rounded-full flex items-center justify-center">
                       <Navigation size={22} className="text-white" fill="white" />
                    </div>
                    <div className="flex flex-col">
                       <span className="text-xs text-gray-400">50 米后</span>
                       <span className="text-sm font-bold">右转进入香榭丽舍大道</span>
                    </div>
                 </div>
                 <div className="w-8 h-8 flex items-center justify-center">
                    <ChevronRight size={24} className="text-green-400 animate-pulse" />
                 </div>
              </motion.div>
            )}

             {/* --- 9. 倒计时 (Timer) --- */}
             {state === 'timer' && (
              <motion.div
                key="timer"
                initial={{ opacity: 0, scaleY: 0.5 }}
                animate={{ opacity: 1, scaleY: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full px-5 flex items-center justify-between text-orange-400"
              >
                <div className="flex items-center gap-2">
                    <Timer size={18} />
                    <span className="text-xs font-medium text-gray-400">计时器</span>
                </div>
                <div className="font-mono text-xl font-bold tabular-nums text-orange-400">
                    14:59<span className="text-xs align-top opacity-60">.2</span>
                </div>
              </motion.div>
            )}

            {/* --- 10. 录音机 (Recorder) --- */}
            {state === 'recorder' && (
              <motion.div
                key="recorder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full px-5 flex items-center justify-between"
              >
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
                        <Mic size={16} fill="currentColor" />
                    </div>
                    <div className="h-6 w-24 flex items-center gap-[2px]">
                        {/* 红色声波 */}
                        {[1,2,3,4,5,6].map(i => (
                             <motion.div
                             key={i}
                             className="w-[3px] bg-red-500 rounded-full"
                             animate={{ height: ["30%", "100%", "30%"] }}
                             transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                         />
                        ))}
                    </div>
                 </div>
                 <span className="text-red-500 font-mono font-medium">00:14</span>
              </motion.div>
            )}

            {/* --- 11. 文件上传 (Upload) --- */}
            {state === 'upload' && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="w-full h-full px-5 flex items-center justify-between"
              >
                  <div className="flex items-center gap-3">
                      <CloudUpload size={20} className="text-blue-400" />
                      <span className="text-sm font-medium">正在上传 4 项...</span>
                  </div>
                  <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="h-full bg-blue-400 rounded-full"
                      />
                  </div>
              </motion.div>
            )}

             {/* --- 12. 打车 (Ride) --- */}
             {state === 'ride' && (
              <motion.div
                key="ride"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="w-full h-full px-5 flex items-center justify-between"
              >
                  <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-neutral-800 rounded-full flex items-center justify-center border border-white/10">
                        <CarFront size={20} className="text-white" />
                      </div>
                      <div className="flex flex-col">
                          <span className="text-[10px] text-yellow-500 font-bold uppercase tracking-wider">Uber Black</span>
                          <span className="text-sm font-bold">京A·88888</span>
                      </div>
                  </div>
                  <div className="text-right">
                      <span className="block text-2xl font-bold leading-none text-green-400">3</span>
                      <span className="text-[9px] text-gray-400 font-medium uppercase">分钟后到达</span>
                  </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
  );
};

// 简单的音频波形动画组件
const MusicWaveform = ({ color = "text-green-400" }) => (
    <div className={`flex items-end gap-[2px] h-3 ${color}`}>
        {[1, 2, 3, 4].map((i) => (
            <motion.div
                key={i}
                className="w-[3px] bg-current rounded-full"
                animate={{ height: ["20%", "100%", "20%"] }}
                transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.1,
                    ease: "easeInOut"
                }}
            />
        ))}
    </div>
)


export default function App() {
  const [islandState, setIslandState] = useState('idle');

  // 控制按钮组件
  const ControlButton = ({ label, targetState, icon: Icon, colorClass }) => (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setIslandState(targetState)}
      className={`
        h-20 rounded-2xl flex flex-col items-center justify-center gap-2
        transition-all duration-300 border border-white/5 relative overflow-hidden group
        ${islandState === targetState
            ? `${colorClass} text-white shadow-lg ring-2 ring-white/20`
            : 'bg-neutral-800/50 text-gray-400 hover:bg-neutral-800 hover:text-white'
        }
      `}
    >
      <Icon size={22} className="relative z-10" />
      <span className="text-[11px] font-medium relative z-10">{label}</span>
      {/* 按钮背景高亮效果 */}
      {islandState === targetState && (
          <motion.div layoutId="active-bg" className="absolute inset-0 bg-white/10" />
      )}
    </motion.button>
  );

  return (
    <div className="min-h-screen bg-neutral-950 text-white selection:bg-neutral-700">
      {/* 模拟手机顶部区域 */}
      <div className="w-full max-w-md mx-auto min-h-screen bg-neutral-900 shadow-2xl relative border-x border-neutral-800 overflow-hidden">

        {/* 顶部状态栏时间等 */}
        <div className="px-8 py-3 flex justify-between items-center text-xs font-medium text-gray-400 z-50 relative">
             <span>9:41</span>
             <div className="flex gap-1.5">
                 <div className="w-4 h-4 rounded-sm border border-current flex items-center justify-center p-[1px]">
                    <div className="w-full h-full bg-current rounded-[1px]" />
                 </div>
             </div>
        </div>

        {/* 修改点 2: 灵动岛区域 - 改为绝对定位容器，脱离文档流 */}
        {/* flex justify-center 用于水平居中，top-2 确定垂直位置 */}
        <div className="absolute top-2 left-0 right-0 flex justify-center z-[999] pointer-events-none">
            {/* pointer-events-auto 加在 DynamicIsland 内部或这里，确保岛可交互，但不阻挡两侧 */}
            <div className="pointer-events-auto">
                <DynamicIsland state={islandState} />
            </div>
        </div>

        {/* 修改点 3: 模拟屏幕内容 - 增加 paddingTop 避免 IDLE 状态遮挡 */}
        <div className="p-6 pt-16 space-y-8 opacity-100 transition-opacity duration-500 h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar">
            <div className="text-center space-y-2 mb-8">
                <h1 className="text-2xl font-bold bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent">
                    Dynamic Island
                </h1>
                <p className="text-gray-500 text-xs uppercase tracking-widest">
                    高性能演示 (Absolute Layout)
                </p>
            </div>

            {/* 控制网格 */}
            <div className="space-y-6">
                <div>
                    <h3 className="text-xs font-medium text-gray-500 mb-3 ml-1 uppercase">基础功能</h3>
                    <div className="grid grid-cols-4 gap-3">
                        <ControlButton label="待机" targetState="idle" icon={ChevronRight} colorClass="bg-neutral-600" />
                        <ControlButton label="来电" targetState="ring" icon={Phone} colorClass="bg-green-600" />
                        <ControlButton label="音乐" targetState="music" icon={Music} colorClass="bg-indigo-500" />
                        <ControlButton label="支付" targetState="payment" icon={Fingerprint} colorClass="bg-blue-500" />
                    </div>
                </div>

                <div>
                    <h3 className="text-xs font-medium text-gray-500 mb-3 ml-1 uppercase">工具与系统</h3>
                    <div className="grid grid-cols-4 gap-3">
                        <ControlButton label="充电" targetState="charge" icon={BatteryCharging} colorClass="bg-teal-600" />
                        <ControlButton label="静音" targetState="silent" icon={BellOff} colorClass="bg-red-500" />
                        <ControlButton label="AirDrop" targetState="airdrop" icon={Share2} colorClass="bg-blue-600" />
                        <ControlButton label="上传" targetState="upload" icon={CloudUpload} colorClass="bg-sky-500" />
                    </div>
                </div>

                <div>
                    <h3 className="text-xs font-medium text-gray-500 mb-3 ml-1 uppercase">实时活动</h3>
                    <div className="grid grid-cols-4 gap-3">
                        <ControlButton label="导航" targetState="navigation" icon={Navigation} colorClass="bg-green-500" />
                        <ControlButton label="计时" targetState="timer" icon={Timer} colorClass="bg-orange-500" />
                        <ControlButton label="录音" targetState="recorder" icon={Mic} colorClass="bg-rose-500" />
                        <ControlButton label="行程" targetState="ride" icon={CarFront} colorClass="bg-yellow-600" />
                    </div>
                </div>
            </div>

            <div className="mt-8 p-4 rounded-xl bg-white/5 border border-white/5 text-[10px] text-gray-500 leading-relaxed">
                <p>性能优化说明：</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>灵动岛容器现已脱离文档流 (Absolute)。</li>
                    <li>状态切换时不再触发布局重排 (No Reflow)。</li>
                    <li>内容区域保持静止，仅发生层级覆盖。</li>
                </ul>
            </div>
        </div>

        {/* 底部横条 */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/20 rounded-full pointer-events-none" />
      </div>
    </div>
  );
}
