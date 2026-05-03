"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Clock,
  Copy,
  ExternalLink,
  Globe,
  Lock,
  Share2,
  X,
} from "lucide-react";

type Step = "idle" | "generating" | "success";
type AccessType = "public" | "code";

const DURATIONS = ["3 days", "7 days", "30 days", "Forever"] as const;

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-md bg-white/[0.06] ${className}`} />
  );
}

function IdleContent({
  accessType,
  setAccessType,
  duration,
  setDuration,
  onCreate,
}: {
  accessType: AccessType;
  setAccessType: (value: AccessType) => void;
  duration: string;
  setDuration: (value: string) => void;
  onCreate: () => void;
}) {
  return (
    <motion.div
      key="idle"
      layout
      initial={{ opacity: 0, filter: "blur(8px)", scale: 0.985 }}
      animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
      exit={{ opacity: 0, filter: "blur(8px)", scale: 0.965 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6 w-full"
    >
      <div className="flex flex-col">
        <div className="space-y-2.5">
          <label className="text-[12px] font-medium text-[#888888]">
            Access Control
          </label>
          <div className="flex bg-[#1A1A1A] p-0.5 rounded-[10px] border border-white/[0.04]">
            {[
              { id: "public" as const, label: "Public", icon: Globe },
              { id: "code" as const, label: "Access code", icon: Lock },
            ].map((type) => {
              const isActive = accessType === type.id;
              const Icon = type.icon;

              return (
                <button
                  key={type.id}
                  onClick={() => setAccessType(type.id)}
                  className={`relative flex-1 py-2 text-[13px] font-medium rounded-[8px] transition-all duration-200 flex items-center justify-center gap-2 ${
                    isActive ? "text-white" : "text-[#666] hover:text-[#AAA]"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabLinear"
                      className="absolute inset-0 bg-[#2C2C2C] border border-white/[0.08] rounded-[8px] shadow-sm -z-10"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  )}
                  <Icon
                    size={14}
                    className={isActive ? "text-white" : "text-[#666]"}
                  />
                  {type.label}
                </button>
              );
            })}
          </div>
        </div>

        <AnimatePresence initial={false}>
          {accessType === "code" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{
                height: { duration: 0.26, ease: [0.16, 1, 0.3, 1] },
                opacity: { duration: 0.2 },
              }}
              className="overflow-hidden"
            >
              <div className="pt-3">
                <div className="flex bg-[#1A1A1A] border border-white/[0.06] rounded-lg focus-within:border-white/20 focus-within:ring-1 focus-within:ring-white/10 transition-all p-1">
                  <input
                    type="text"
                    placeholder="Type a custom code..."
                    className="flex-1 bg-transparent px-3 py-1.5 text-[13px] text-white placeholder:text-[#555] outline-none"
                  />
                  <button className="bg-[#2A2A2A] hover:bg-[#333] border border-white/[0.05] px-3 rounded-md text-[12px] font-medium transition-all text-[#CCC] flex items-center gap-1.5">
                    Auto
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-2.5">
        <label className="text-[12px] font-medium text-[#888888]">
          Link expiration
        </label>
        <div className="flex flex-wrap gap-2">
          {DURATIONS.map((value) => (
            <button
              key={value}
              onClick={() => setDuration(value)}
              className={`px-4 py-2 text-[12px] font-medium rounded-md border transition-all ${
                duration === value
                  ? "bg-white/10 border-white/20 text-white"
                  : "bg-[#1A1A1A] border-white/[0.04] text-[#666] hover:text-[#AAA] hover:bg-[#222]"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-2">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onCreate}
          className="w-full py-2.5 bg-[#EEEEEE] text-[#111111] rounded-lg font-medium text-[13px] flex items-center justify-center hover:bg-white transition-colors"
        >
          Create Link
        </motion.button>
      </div>
    </motion.div>
  );
}

function GeneratingContent() {
  return (
    <motion.div
      key="generating"
      layout
      initial={{ opacity: 0, filter: "blur(8px)", scale: 0.985 }}
      animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
      exit={{ opacity: 0, filter: "blur(8px)", scale: 0.97 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="py-2 space-y-5 w-full"
    >
      <div className="flex flex-col items-center justify-center space-y-4 pt-2">
        <div className="w-12 h-12 rounded-full bg-white/[0.03] border border-white/[0.04] flex items-center justify-center">
          <Skeleton className="w-5 h-5 rounded-full bg-white/[0.08]" />
        </div>
        <div className="space-y-2 flex flex-col items-center">
          <Skeleton className="w-24 h-4 rounded-[4px]" />
          <Skeleton className="w-48 h-3 rounded-[4px] opacity-70" />
        </div>
      </div>

      <div className="w-full rounded-[10px] border border-white/[0.03] bg-[#1A1A1A]/50 p-4">
        <div className="space-y-3">
          <Skeleton className="h-3 w-20 rounded-[4px] opacity-80" />
          <Skeleton className="h-3 w-full rounded-[4px] opacity-70" />
          <Skeleton className="h-3 w-[92%] rounded-[4px] opacity-60" />
          <Skeleton className="h-3 w-[78%] rounded-[4px] opacity-50" />
          <div className="h-4" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </div>

      <div className="flex gap-2.5">
        <Skeleton className="flex-1 h-[42px] rounded-lg" />
        <Skeleton className="flex-1 h-[42px] rounded-lg opacity-80" />
      </div>

      <div className="pt-2 flex justify-center">
        <Skeleton className="w-32 h-3.5 rounded-[4px] opacity-70" />
      </div>
    </motion.div>
  );
}

function SuccessContent({
  accessType,
  duration,
  copied,
  generatedCode,
  onCopy,
}: {
  accessType: AccessType;
  duration: string;
  copied: boolean;
  generatedCode: string;
  onCopy: () => void;
}) {
  return (
    <motion.div
      key="success"
      layout
      initial={{ opacity: 0, filter: "blur(8px)", scale: 0.985 }}
      animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
      exit={{ opacity: 0, filter: "blur(8px)", scale: 0.97 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="py-2 space-y-5 w-full"
    >
      <div className="flex flex-col items-center justify-center space-y-4 pt-2">
        <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center justify-center">
          <Check size={20} className="text-indigo-400" />
        </div>
        <div className="text-center space-y-1">
          <h3 className="text-[15px] font-medium text-white">Link created</h3>
          <p className="text-[13px] text-[#888888]">
            Anyone with the link can view this chat.
          </p>
        </div>
      </div>

      <div className="bg-[#1A1A1A] border border-white/[0.08] rounded-[10px] p-4 space-y-4 relative overflow-hidden group shadow-inner">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="relative space-y-4">
          <div className="text-[13px] font-mono font-medium text-indigo-400 flex items-center gap-2">
            Share info
          </div>
          <div className="text-[13px] text-[#A3A3A3] font-mono leading-relaxed space-y-4">
            <p>zilin shared a Claude chat with you:</p>

            <div className="space-y-1">
              <p className="text-[#D4D4D4]">
                <span className="text-[#666]">Topic:</span> KaTeX 在 Markdown
                中的渲染原理
              </p>
              <p className="text-indigo-300">
                <span className="text-[#666]">Link:</span>{" "}
                https://linear.chatkeep.dev/s/8c1ab33c
              </p>
              {accessType === "code" && (
                <p className="text-amber-200">
                  <span className="text-[#666]">Access code:</span>{" "}
                  {generatedCode}
                </p>
              )}
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] font-medium">
            <Clock size={12} /> Expires in {duration}
          </div>
        </div>
      </div>

      <div className="flex gap-2.5">
        <button
          onClick={onCopy}
          className="flex-1 py-2.5 bg-[#2A2A2A] hover:bg-[#333] border border-white/[0.05] text-[#EEE] rounded-lg text-[13px] font-medium flex items-center justify-center gap-2 transition-all"
        >
          {copied ? (
            <Check size={14} className="text-indigo-400" />
          ) : (
            <Copy size={14} />
          )}
          {copied ? "Copied" : "Copy info"}
        </button>
        <button className="flex-1 py-2.5 bg-[#EEEEEE] text-[#111] hover:bg-white rounded-lg text-[13px] font-medium flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(255,255,255,0.05)]">
          <ExternalLink size={14} /> Open shared page
        </button>
      </div>

      <div className="pt-2 text-center">
        <button className="text-[#666] hover:text-[#AAA] text-[12px] font-medium flex items-center justify-center gap-1.5 w-full transition-colors group">
          Manage shared links
          <ArrowRight
            size={12}
            className="group-hover:translate-x-0.5 transition-transform"
          />
        </button>
      </div>
    </motion.div>
  );
}

export default function App() {
  const [open, setOpen] = useState(true);
  const [step, setStep] = useState<Step>("idle");
  const [accessType, setAccessType] = useState<AccessType>("public");
  const [duration, setDuration] = useState<string>("7 days");
  const [copied, setCopied] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [contentHeight, setContentHeight] = useState<number | "auto">("auto");

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentMeasureRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (copyResetTimerRef.current) clearTimeout(copyResetTimerRef.current);
    };
  }, []);

  useLayoutEffect(() => {
    const element = contentMeasureRef.current;
    if (!element) return;

    const updateHeight = () => {
      setContentHeight(element.offsetHeight);
    };

    updateHeight();

    const frameId = requestAnimationFrame(updateHeight);
    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(element);

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
    };
  }, [step, accessType, duration, copied, generatedCode, open]);

  const handleCreate = () => {
    if (timerRef.current) clearTimeout(timerRef.current);

    setGeneratedCode("");
    setCopied(false);
    setStep("generating");

    timerRef.current = setTimeout(() => {
      if (accessType === "code") {
        setGeneratedCode("cobalt719");
      }
      setStep("success");
    }, 1500);
  };

  const handleCopyInfo = async () => {
    const infoText = `Share info\n\nzilin shared a Claude chat with you:\n\nTopic: KaTeX 在 Markdown 中的渲染原理\nLink: https://linear.chatkeep.dev/s/8c1ab33c\n${
      accessType === "code" ? `Access code: ${generatedCode}\n` : ""
    }Expires in ${duration}`;

    try {
      await navigator.clipboard.writeText(infoText);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = infoText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }

    setCopied(true);

    if (copyResetTimerRef.current) clearTimeout(copyResetTimerRef.current);
    copyResetTimerRef.current = setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleClose = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setStep("idle");
    setCopied(false);
    setGeneratedCode("");
    setOpen(false);
  };

  const handleReopen = () => {
    setOpen(true);
    setStep("idle");
    setCopied(false);
    setGeneratedCode("");
  };

  return (
    <div className="min-h-screen bg-[#080808] relative font-sans text-[#EEEEEE] antialiased overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
        <AnimatePresence initial={false}>
          {!open && (
            <motion.button
              key="trigger"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -8 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              onClick={handleReopen}
              className="pointer-events-auto px-4 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors"
            >
              Create link
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="dialog"
              initial={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.98, filter: "blur(6px)" }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto w-full max-w-[420px] bg-[#121212] rounded-[14px] shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_24px_48px_rgba(0,0,0,0.5)] overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.06),transparent_35%)] pointer-events-none z-10" />

              <div
                className="absolute inset-0 rounded-[14px] pointer-events-none z-20"
                style={{
                  padding: "1px",
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.05) 20%, transparent 50%)",
                  WebkitMask:
                    "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                  WebkitMaskComposite: "xor",
                  maskComposite: "exclude",
                }}
              />

              <div className="px-5 pt-5 pb-4 flex justify-between items-center border-b border-white/[0.04] relative z-30">
                <div className="flex items-center gap-2.5">
                  <Share2 size={16} className="text-[#888888]" />
                  <h2 className="text-[14px] font-medium tracking-tight">
                    Share chat link
                  </h2>
                </div>
                <button
                  onClick={handleClose}
                  className="text-[#666666] hover:text-[#EEEEEE] transition-colors p-1 rounded-md hover:bg-white/5"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="px-5 py-5 relative z-30">
                <div className="space-y-2.5 mb-6">
                  <label className="text-[12px] font-medium text-[#888888]">
                    Topic
                  </label>
                  <div className="flex items-center gap-3 p-3 bg-[#1A1A1A] rounded-lg border border-white/[0.06] shadow-inner">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                    <p className="text-[13px] font-medium text-[#D4D4D4] truncate">
                      KaTeX 在 Markdown 中的渲染原理
                    </p>
                  </div>
                </div>

                <motion.div
                  animate={{ height: contentHeight }}
                  transition={{
                    height: {
                      type: "spring",
                      stiffness: 340,
                      damping: 34,
                      mass: 0.9,
                    },
                  }}
                  className="relative overflow-hidden"
                >
                  <div ref={contentMeasureRef}>
                    <AnimatePresence mode="popLayout" initial={false}>
                      {step === "idle" && (
                        <IdleContent
                          accessType={accessType}
                          setAccessType={setAccessType}
                          duration={duration}
                          setDuration={setDuration}
                          onCreate={handleCreate}
                        />
                      )}

                      {step === "generating" && <GeneratingContent />}

                      {step === "success" && (
                        <SuccessContent
                          accessType={accessType}
                          duration={duration}
                          copied={copied}
                          generatedCode={generatedCode}
                          onCopy={handleCopyInfo}
                        />
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
