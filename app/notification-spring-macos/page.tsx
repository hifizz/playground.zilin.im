"use client";
import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  CheckCircle2,
  Info,
  Sparkles,
  TriangleAlert,
  X,
  MessageSquare,
  ShieldCheck,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const MAX_NOTIFICATIONS = 5;
const COLLAPSED_VISIBLE = 3;
const DEFAULT_CONFIG = {
  blurBackground: true,
  cardTheme: "neutral",
  cardOpacity: 0.72,
  animationPreset: "slide-right",
  springPreset: "snappy",
};

const templates = [
  {
    title: "Deployment Complete",
    message: "Your production build finished successfully and is now live.",
    icon: CheckCircle2,
    accent: "from-emerald-400/80 via-teal-300/70 to-cyan-300/70",
  },
  {
    title: "Design Review Reminder",
    message: "The liquid glass UI review starts in 10 minutes.",
    icon: Sparkles,
    accent: "from-sky-400/80 via-cyan-300/70 to-indigo-300/70",
  },
  {
    title: "New Message",
    message: "A new stakeholder comment has arrived in the feedback thread.",
    icon: MessageSquare,
    accent: "from-violet-400/80 via-fuchsia-300/70 to-pink-300/70",
  },
  {
    title: "Security Notice",
    message: "A new sign-in was detected from a trusted device.",
    icon: ShieldCheck,
    accent: "from-amber-400/80 via-orange-300/70 to-yellow-300/70",
  },
  {
    title: "Update Ready",
    message: "Version 2.4.1 is available to install in the background.",
    icon: Download,
    accent: "from-blue-400/80 via-sky-300/70 to-cyan-200/70",
  },
  {
    title: "Heads Up",
    message: "You have exceeded the current notification demo threshold.",
    icon: TriangleAlert,
    accent: "from-rose-400/80 via-orange-300/70 to-amber-300/70",
  },
];

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createNotification(template, index) {
  return {
    id: uid(),
    title: template.title,
    message: template.message,
    icon: template.icon,
    accent: template.accent,
    time: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    index,
  };
}

const ANIMATION_PRESETS = {
  "slide-right": {
    label: "Slide Right",
    initial: { opacity: 0, x: 72, y: 12, scale: 0.98, filter: "blur(10px)" },
    exit: { opacity: 0, x: 96, y: 4, scale: 0.94, filter: "blur(10px)" },
  },
  "slide-left": {
    label: "Slide Left",
    initial: { opacity: 0, x: -72, y: 12, scale: 0.98, filter: "blur(10px)" },
    exit: { opacity: 0, x: -84, y: 4, scale: 0.95, filter: "blur(10px)" },
  },
  "slide-top": {
    label: "Slide Top",
    initial: { opacity: 0, x: 0, y: -72, scale: 0.98, filter: "blur(10px)" },
    exit: { opacity: 0, x: 0, y: -84, scale: 0.95, filter: "blur(10px)" },
  },
  scale: {
    label: "Scale",
    initial: { opacity: 0, x: 0, y: 10, scale: 0.84, filter: "blur(8px)" },
    exit: { opacity: 0, x: 0, y: 6, scale: 0.86, filter: "blur(8px)" },
  },
  fade: {
    label: "Fade",
    initial: { opacity: 0, x: 0, y: 6, scale: 1, filter: "blur(6px)" },
    exit: { opacity: 0, x: 0, y: 2, scale: 1, filter: "blur(6px)" },
  },
  "slide-top-scale": {
    label: "Top + Scale",
    initial: { opacity: 0, x: 0, y: -60, scale: 0.9, filter: "blur(10px)" },
    exit: { opacity: 0, x: 0, y: -72, scale: 0.88, filter: "blur(10px)" },
  },
};

const SPRING_PRESETS = {
  gentle: {
    label: "Gentle",
    type: "spring",
    stiffness: 140,
    damping: 22,
    mass: 0.95,
  },
  snappy: {
    label: "Snappy",
    type: "spring",
    stiffness: 240,
    damping: 24,
    mass: 0.8,
  },
  bouncy: {
    label: "Bouncy",
    type: "spring",
    stiffness: 280,
    damping: 18,
    mass: 0.78,
  },
  heavy: {
    label: "Heavy",
    type: "spring",
    stiffness: 180,
    damping: 28,
    mass: 1.08,
  },
  elastic: {
    label: "Elastic",
    type: "spring",
    stiffness: 320,
    damping: 16,
    mass: 0.72,
  },
};

function GlassOrb({ className = "" }) {
  return (
    <div
      className={`absolute rounded-full bg-white/20 blur-2xl pointer-events-none ${className}`}
      aria-hidden="true"
    />
  );
}

function NotificationCard({
  notification,
  index,
  expanded,
  onClose,
  totalVisible,
  blurBackground,
  cardTheme,
  cardOpacity,
  animationPreset,
  springPreset,
}) {
  const Icon = notification.icon || Info;

  const collapsedDepth = Math.min(index, COLLAPSED_VISIBLE - 1);
  const hiddenWhenCollapsed = !expanded && index >= COLLAPSED_VISIBLE;
  const isPrimary = index === 0;

  const y = expanded ? index * 98 : collapsedDepth * 12;
  const scale = expanded ? 1 : 1 - collapsedDepth * 0.035;
  const opacity = hiddenWhenCollapsed
    ? 0
    : expanded
      ? 1
      : 1 - Math.max(0, index - 1) * 0.18;
  const blur = expanded ? 0 : collapsedDepth * 0.6;

  const isWhiteTheme = cardTheme === "white";
  const clampedOpacity = Math.max(0.3, Math.min(1, cardOpacity ?? 0.72));
  const cardBgValue = isWhiteTheme
    ? `rgba(255,255,255,${clampedOpacity})`
    : `rgba(38,38,38,${clampedOpacity})`;
  const supportBgValue = isWhiteTheme
    ? `rgba(255,255,255,${Math.max(0.18, clampedOpacity - 0.08)})`
    : `rgba(38,38,38,${Math.max(0.18, clampedOpacity - 0.1)})`;

  const cardClassName = isWhiteTheme
    ? `relative overflow-hidden rounded-[28px] border border-black/8 shadow-[0_14px_40px_rgba(15,23,42,0.14)] ${
        blurBackground ? "backdrop-blur-3xl" : "backdrop-blur-none"
      }`
    : `relative overflow-hidden rounded-[28px] border border-white/20 shadow-[0_14px_40px_rgba(15,23,42,0.26)] ${
        blurBackground ? "backdrop-blur-3xl" : "backdrop-blur-none"
      }`;
  const overlayAlpha = isWhiteTheme
    ? Math.max(0.08, Math.min(0.55, clampedOpacity * 0.7))
    : Math.max(0.03, Math.min(0.16, clampedOpacity * 0.08));
  const overlayClassName = "absolute inset-0";
  const iconWrapClassName = isWhiteTheme
    ? `relative mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-black/8 bg-black/[0.03] shadow-inner shadow-white/30 ${blurBackground ? "backdrop-blur-xl" : ""}`
    : `relative mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/14 shadow-inner shadow-white/10 ${blurBackground ? "backdrop-blur-xl" : ""}`;
  const iconColorClassName = isWhiteTheme
    ? "relative h-5 w-5 text-neutral-900"
    : "relative h-5 w-5 text-white";
  const titleClassName = isWhiteTheme
    ? "text-[15px] font-semibold tracking-tight text-neutral-950"
    : "text-[15px] font-semibold tracking-tight text-white/95";
  const timeClassName = isWhiteTheme
    ? "mt-0.5 text-xs text-neutral-500"
    : "mt-0.5 text-xs text-white/52";
  const messageClassName = isWhiteTheme
    ? "mt-3 text-sm leading-6 text-neutral-700"
    : "mt-3 text-sm leading-6 text-white/74";
  const closeButtonClassName = isWhiteTheme
    ? "rounded-full border border-black/10 bg-black/[0.04] p-1.5 text-neutral-500 transition hover:bg-black/[0.07] hover:text-neutral-900"
    : "rounded-full border border-white/15 bg-white/8 p-1.5 text-white/60 transition hover:bg-white/14 hover:text-white";
  const primaryActionClassName = isWhiteTheme
    ? "rounded-full border border-black/10 bg-black/[0.05] px-3 py-1.5 text-xs font-medium text-neutral-900 transition hover:bg-black/[0.08]"
    : "rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/88 transition hover:bg-white/16";
  const secondaryActionClassName = isWhiteTheme
    ? "rounded-full border border-black/8 bg-transparent px-3 py-1.5 text-xs font-medium text-neutral-600 transition hover:bg-black/[0.04] hover:text-neutral-900"
    : "rounded-full border border-white/12 bg-black/10 px-3 py-1.5 text-xs font-medium text-white/64 transition hover:bg-white/8 hover:text-white/88";

  const activeAnimationPreset =
    ANIMATION_PRESETS[animationPreset] ?? ANIMATION_PRESETS["slide-right"];
  const activeSpringPreset =
    SPRING_PRESETS[springPreset] ?? SPRING_PRESETS.snappy;

  return (
    <motion.div
      layout
      initial={activeAnimationPreset.initial}
      animate={{
        opacity,
        x: 0,
        y,
        scale,
        filter: `blur(${blur}px)`,
      }}
      exit={activeAnimationPreset.exit}
      transition={activeSpringPreset}
      className={`absolute right-0 top-0 w-[360px] origin-top-right ${hiddenWhenCollapsed ? "pointer-events-none" : ""}`}
      style={{
        zIndex: totalVisible - index,
        transformOrigin: "top right",
      }}
    >
      <Card
        className={cardClassName}
        style={{
          backgroundColor: cardBgValue,
          ...(blurBackground
            ? {
                WebkitBackdropFilter: "blur(24px)",
                backdropFilter: "blur(24px)",
              }
            : {}),
          ...(blurBackground ? {} : { backgroundColor: cardBgValue }),
        }}
      >
        <div
          className={overlayClassName}
          style={{ backgroundColor: `rgba(255,255,255,${overlayAlpha})` }}
        />
        {blurBackground && (
          <GlassOrb
            className={`-top-10 left-6 h-24 w-24 opacity-80 ${isWhiteTheme ? "bg-white/50" : ""}`}
          />
        )}
        {blurBackground && (
          <GlassOrb className="bottom-0 right-5 h-16 w-16 bg-sky-200/10 opacity-60" />
        )}

        <CardContent className="relative p-4">
          <div className="flex items-start gap-3">
            <div className={iconWrapClassName}>
              <div
                className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${notification.accent} opacity-14`}
              />
              <Icon className={iconColorClassName} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={titleClassName}>{notification.title}</p>
                  <p className={timeClassName}>now · {notification.time}</p>
                </div>
                <button
                  onClick={() => onClose(notification.id)}
                  className={closeButtonClassName}
                  aria-label="Dismiss notification"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className={messageClassName}>{notification.message}</p>

              <div className="mt-4 flex items-center gap-2">
                <button className={primaryActionClassName}>Open</button>
                <button className={secondaryActionClassName}>Later</button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function NotificationLiquidGlassDemo() {
  const [notifications, setNotifications] = useState(() => [
    createNotification(templates[0], 0),
    createNotification(templates[1], 1),
    createNotification(templates[2], 2),
  ]);
  const [expanded, setExpanded] = useState(false);
  const [counter, setCounter] = useState(3);
  const [config, setConfig] = useState(DEFAULT_CONFIG);

  const opacityPresets = [0.48, 0.64, 0.8, 0.94];
  const animationPresetOrder = [
    "slide-right",
    "slide-left",
    "slide-top",
    "slide-top-scale",
    "scale",
    "fade",
  ];
  const springPresetOrder = ["gentle", "snappy", "bouncy", "heavy", "elastic"];
  const opacityLabelMap = {
    0.48: "48%",
    0.64: "64%",
    0.8: "80%",
    0.94: "94%",
  };

  const visibleNotifications = useMemo(() => notifications, [notifications]);

  const pushNotification = (template) => {
    setNotifications((prev) => {
      const next = [createNotification(template, counter), ...prev];
      return next.slice(0, MAX_NOTIFICATIONS);
    });
    setCounter((c) => c + 1);
  };

  const addRandom = () => {
    const template = templates[counter % templates.length];
    pushNotification(template);
  };

  const closeNotification = (id) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.16),_transparent_28%),radial-gradient(circle_at_80%_20%,_rgba(168,85,247,0.14),_transparent_22%),linear-gradient(180deg,_#09111f_0%,_#0f172a_48%,_#111827_100%)] text-white">
      <GlassOrb className="left-[8%] top-[14%] h-60 w-60 bg-cyan-300/10" />
      <GlassOrb className="right-[14%] top-[12%] h-72 w-72 bg-fuchsia-300/10" />
      <GlassOrb className="bottom-[8%] left-[18%] h-80 w-80 bg-sky-200/10" />

      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6 py-14">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 18 }}
            className="relative overflow-hidden rounded-[36px] border border-white/20 bg-white/10 p-8 shadow-[0_18px_80px_rgba(15,23,42,0.32)] backdrop-blur-3xl"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/16 via-white/8 to-white/6" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/70">
                <Bell className="h-3.5 w-3.5" />
                Liquid Glass Notification Demo
              </div>

              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                macOS-inspired notification stack with spring motion.
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-white/70">
                Add cards from the control panel, collapse them into a stacked
                preview, or expand the full list. When the max count is
                exceeded, the oldest card is removed automatically.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <Button
                  onClick={addRandom}
                  className="h-12 rounded-2xl border border-white/20 bg-white/16 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] backdrop-blur-xl hover:bg-white/24"
                >
                  Add Random Notification
                </Button>
                <Button
                  onClick={() => pushNotification(templates[0])}
                  className="h-12 rounded-2xl border border-white/20 bg-emerald-400/18 text-white backdrop-blur-xl hover:bg-emerald-400/28"
                >
                  Add Success Card
                </Button>
                <Button
                  onClick={() => pushNotification(templates[2])}
                  className="h-12 rounded-2xl border border-white/20 bg-violet-400/18 text-white backdrop-blur-xl hover:bg-violet-400/28"
                >
                  Add Message Card
                </Button>
                <Button
                  onClick={() => pushNotification(templates[5])}
                  className="h-12 rounded-2xl border border-white/20 bg-amber-400/18 text-white backdrop-blur-xl hover:bg-amber-400/28"
                >
                  Add Warning Card
                </Button>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <Button
                  onClick={() => setExpanded((v) => !v)}
                  variant="secondary"
                  className="rounded-2xl border border-white/15 bg-black/10 text-white/85 backdrop-blur-xl hover:bg-white/10"
                >
                  {expanded ? "Collapse Stack" : "Expand Stack"}
                </Button>
                <Button
                  onClick={() =>
                    setConfig((prev) => ({
                      ...prev,
                      blurBackground: !prev.blurBackground,
                    }))
                  }
                  variant="secondary"
                  className="rounded-2xl border border-white/15 bg-black/10 text-white/75 backdrop-blur-xl hover:bg-white/10 hover:text-white"
                >
                  Blur BG: {config.blurBackground ? "On" : "Off"}
                </Button>
                <Button
                  onClick={() =>
                    setConfig((prev) => ({
                      ...prev,
                      cardTheme:
                        prev.cardTheme === "neutral" ? "white" : "neutral",
                    }))
                  }
                  variant="secondary"
                  className="rounded-2xl border border-white/15 bg-black/10 text-white/75 backdrop-blur-xl hover:bg-white/10 hover:text-white"
                >
                  Card Theme:{" "}
                  {config.cardTheme === "white" ? "White" : "Neutral"}
                </Button>
                <Button
                  onClick={() => {
                    const currentIndex = opacityPresets.findIndex(
                      (value) => value === config.cardOpacity,
                    );
                    const nextOpacity =
                      opacityPresets[
                        (currentIndex + 1 + opacityPresets.length) %
                          opacityPresets.length
                      ];
                    setConfig((prev) => ({
                      ...prev,
                      cardOpacity: nextOpacity,
                    }));
                  }}
                  variant="secondary"
                  className="rounded-2xl border border-white/15 bg-black/10 text-white/75 backdrop-blur-xl hover:bg-white/10 hover:text-white"
                >
                  Card Opacity:{" "}
                  {opacityLabelMap[config.cardOpacity] ??
                    `${Math.round(config.cardOpacity * 100)}%`}
                </Button>
                <Button
                  onClick={() => {
                    const currentIndex = animationPresetOrder.findIndex(
                      (value) => value === config.animationPreset,
                    );
                    const nextPreset =
                      animationPresetOrder[
                        (currentIndex + 1 + animationPresetOrder.length) %
                          animationPresetOrder.length
                      ];
                    setConfig((prev) => ({
                      ...prev,
                      animationPreset: nextPreset,
                    }));
                  }}
                  variant="secondary"
                  className="rounded-2xl border border-white/15 bg-black/10 text-white/75 backdrop-blur-xl hover:bg-white/10 hover:text-white"
                >
                  Enter Anim:{" "}
                  {ANIMATION_PRESETS[config.animationPreset]?.label ??
                    "Slide Right"}
                </Button>
                <Button
                  onClick={() => {
                    const currentIndex = springPresetOrder.findIndex(
                      (value) => value === config.springPreset,
                    );
                    const nextPreset =
                      springPresetOrder[
                        (currentIndex + 1 + springPresetOrder.length) %
                          springPresetOrder.length
                      ];
                    setConfig((prev) => ({
                      ...prev,
                      springPreset: nextPreset,
                    }));
                  }}
                  variant="secondary"
                  className="rounded-2xl border border-white/15 bg-black/10 text-white/75 backdrop-blur-xl hover:bg-white/10 hover:text-white"
                >
                  Spring:{" "}
                  {SPRING_PRESETS[config.springPreset]?.label ?? "Snappy"}
                </Button>
                <Button
                  onClick={clearAll}
                  variant="secondary"
                  className="rounded-2xl border border-white/15 bg-black/10 text-white/70 backdrop-blur-xl hover:bg-white/10 hover:text-white"
                >
                  Clear All
                </Button>
              </div>

              <div className="mt-8 flex flex-wrap gap-3 text-sm text-white/60">
                <div className="rounded-full border border-white/15 bg-white/8 px-3 py-1.5">
                  Max instances: {MAX_NOTIFICATIONS}
                </div>
                <div className="rounded-full border border-white/15 bg-white/8 px-3 py-1.5">
                  Mode: {expanded ? "Expanded" : "Collapsed"}
                </div>
                <div className="rounded-full border border-white/15 bg-white/8 px-3 py-1.5">
                  Current cards: {notifications.length}
                </div>
                <div className="rounded-full border border-white/15 bg-white/8 px-3 py-1.5">
                  Blur BG: {config.blurBackground ? "Enabled" : "Disabled"}
                </div>
                <div className="rounded-full border border-white/15 bg-white/8 px-3 py-1.5">
                  Card Theme:{" "}
                  {config.cardTheme === "white" ? "White" : "Neutral"}
                </div>
                <div className="rounded-full border border-white/15 bg-white/8 px-3 py-1.5">
                  Card Opacity:{" "}
                  {opacityLabelMap[config.cardOpacity] ??
                    `${Math.round(config.cardOpacity * 100)}%`}
                </div>
                <div className="rounded-full border border-white/15 bg-white/8 px-3 py-1.5">
                  Enter Anim:{" "}
                  {ANIMATION_PRESETS[config.animationPreset]?.label ??
                    "Slide Right"}
                </div>
                <div className="rounded-full border border-white/15 bg-white/8 px-3 py-1.5">
                  Spring:{" "}
                  {SPRING_PRESETS[config.springPreset]?.label ?? "Snappy"}
                </div>
              </div>
            </div>
          </motion.div>

          <div className="relative min-h-[620px] rounded-[40px] border border-white/15 bg-white/[0.04] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
            <div className="pointer-events-none absolute inset-0 rounded-[40px] bg-gradient-to-b from-white/8 to-white/[0.02]" />
            <div className="relative h-full overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-5">
              <div className="mb-4 flex items-center justify-between text-sm text-white/55">
                <span>Preview Surface</span>
                <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1">
                  top-right / floating / spring
                </span>
              </div>

              <div className="relative h-[520px] overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.14),_transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))]">
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent)]" />
                <div
                  className="absolute right-5 top-5 w-[360px]"
                  onMouseEnter={() => setExpanded(true)}
                  onMouseLeave={() => setExpanded(false)}
                >
                  <AnimatePresence initial={false}>
                    {visibleNotifications.map((item, index) => (
                      <NotificationCard
                        key={item.id}
                        notification={item}
                        index={index}
                        expanded={expanded}
                        onClose={closeNotification}
                        totalVisible={visibleNotifications.length}
                        blurBackground={config.blurBackground}
                        cardTheme={config.cardTheme}
                        cardOpacity={config.cardOpacity}
                        animationPreset={config.animationPreset}
                        springPreset={config.springPreset}
                      />
                    ))}
                  </AnimatePresence>
                </div>

                {visibleNotifications.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 180, damping: 18 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="rounded-[28px] border border-white/15 bg-white/8 px-8 py-6 text-center backdrop-blur-2xl">
                      <Bell className="mx-auto h-7 w-7 text-white/70" />
                      <p className="mt-3 text-sm font-medium text-white/80">
                        No active notifications
                      </p>
                      <p className="mt-1 text-sm text-white/55">
                        Use the buttons on the left to spawn new cards.
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
