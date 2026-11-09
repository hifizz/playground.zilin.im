"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * ============================================================================
 * Hark Pro · macOS 登录窗复刻
 * ============================================================================
 * 设计稿里窗体是 1046 × 703 的固定画板：所有元素都按画板坐标绝对定位，
 * 再整体 transform: scale() 到视口，保证任何尺寸下比例与截图一致。
 * 窄屏（< 720px）切成「只有右侧表单」的紧凑画板（380 × 703）。
 * ============================================================================
 */

const FULL = { w: 1046, h: 703 };
const COMPACT = { w: 380, h: 703 };
/** 右侧表单列：宽 311，在完整画板中 left = 612 */
const COL_W = 311;
const MAX_SCALE = 1.4;

type Status = "idle" | "loading" | "sent";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export default function HarkProSignin({ fontClassName = "" }: { fontClassName?: string }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [compact, setCompact] = useState(false);
  const [ready, setReady] = useState(false);

  useIsoLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const fit = () => {
      const vw = el.clientWidth;
      const vh = el.clientHeight;
      const isCompact = vw < 720;
      const stage = isCompact ? COMPACT : FULL;
      // 截图里窗体约占画面宽 87%、高 82%
      const s = Math.min(
        (vw * (isCompact ? 0.94 : 0.872)) / stage.w,
        (vh * (isCompact ? 0.92 : 0.82)) / stage.h,
        MAX_SCALE,
      );
      setCompact(isCompact);
      setScale(s);
      setReady(true);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const stage = compact ? COMPACT : FULL;
  const colLeft = compact ? (COMPACT.w - COL_W) / 2 : 612;
  const colCenter = colLeft + COL_W / 2;

  // ———— 表单状态 ————
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [provider, setProvider] = useState<"google" | "apple" | null>(null);
  const valid = isEmailOrPhone(value);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || status !== "idle") return;
    setStatus("loading");
    window.setTimeout(() => setStatus("sent"), 1100);
  };

  const oauth = (p: "google" | "apple") => {
    if (provider) return;
    setProvider(p);
    window.setTimeout(() => setProvider(null), 1400);
  };

  return (
    <div
      ref={viewportRef}
      className={`${fontClassName} relative flex h-[100svh] w-full items-center justify-center overflow-hidden`}
      style={{ fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif" }}
    >
      {/* ———— 壁纸：天空 + 花海 ———— */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: "url(/hark-pro-signin/meadow.webp)",
          backgroundSize: "cover",
          backgroundPosition: "center 62%",
        }}
      />

      {/* ———— 窗体（按画板尺寸绘制，再整体缩放） ———— */}
      <div
        className="relative shrink-0"
        style={{
          width: stage.w * scale,
          height: stage.h * scale,
          marginTop: compact ? 0 : "-3.4svh",
          opacity: ready ? 1 : 0,
        }}
      >
        <div
          className="hark-window absolute left-0 top-0 overflow-hidden"
          style={{
            width: stage.w,
            height: stage.h,
            transform: `scale(${scale})`,
            transformOrigin: "0 0",
            borderRadius: 14,
            background: [
              // 左下角（照片一侧）偏亮的雾光
              "radial-gradient(90% 60% at 42% 108%, rgba(112,116,140,0.5) 0%, rgba(80,88,118,0.2) 45%, rgba(40,50,90,0) 75%)",
              // 主体：顶部深海军蓝 → 底部灰蓝
              "linear-gradient(180deg, #171c38 0%, #141a37 20%, #1f294d 50%, #2a3456 75%, #2e3852 100%)",
            ].join(","),
            boxShadow:
              "0 0 0 0.5px rgba(0,0,0,0.55), inset 0 0 0 0.5px rgba(255,255,255,0.12), 0 24px 60px rgba(10,20,50,0.35), 0 8px 18px rgba(10,20,50,0.18)",
          }}
        >
          {/* 红绿灯 */}
          <TrafficLights />

          {/* 人像卡片 */}
          {!compact && (
            <div
              className="absolute overflow-hidden"
              style={{ left: 16, top: 61, width: 489, height: 625, borderRadius: 18 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/hark-pro-signin/portrait.webp"
                alt="A woman working on a laptop"
                className="h-full w-full object-cover"
                style={{ objectPosition: "50% 30%" }}
                draggable={false}
              />
              <HarkMark className="absolute" style={{ left: 20, top: 20, width: 25, height: 23 }} />
            </div>
          )}

          {/* —— 右侧表单列（全部按画板坐标绝对定位） —— */}
          {/* 字标 */}
          <div
            className="absolute flex items-baseline justify-center whitespace-nowrap"
            style={{
              left: colCenter - 150 - 2,
              width: 300,
              top: 176,
              height: 60,
              fontFamily: "var(--font-hark-serif), ui-serif, Georgia, serif",
              fontSize: 44,
              lineHeight: "60px",
              letterSpacing: -0.2,
            }}
          >
            <span style={{ color: "#f4f5fa" }}>hark</span>
            <span style={{ marginLeft: 12, fontStyle: "italic", color: "rgba(196,201,224,0.5)" }}>pro</span>
          </div>

          {/* 标语 */}
          <p
            className="absolute text-center"
            style={{
              left: colCenter - (compact ? 188 : 210),
              width: compact ? 376 : 420,
              top: 244,
              fontSize: 17.2,
              lineHeight: "22.5px",
              letterSpacing: -0.3,
              color: "#f1f5fd",
            }}
          >
            A new kind of system for getting things done.
            <br />
            Whatever you need, let Hark handle it.
          </p>

          {/* 第三方登录 */}
          <SocialButton
            top={322}
            left={colLeft}
            icon={<GoogleIcon />}
            label="Continue with Google"
            loading={provider === "google"}
            onClick={() => oauth("google")}
          />
          <SocialButton
            top={371}
            left={colLeft}
            icon={<AppleIcon />}
            label="Continue with Apple"
            loading={provider === "apple"}
            onClick={() => oauth("apple")}
          />

          {/* 分割线 or */}
          <div
            className="absolute flex items-center"
            style={{ left: colLeft, width: COL_W, top: 427, height: 16, gap: 14 }}
          >
            <span className="h-px flex-1" style={{ background: "rgba(150,165,215,0.14)" }} />
            <span style={{ fontSize: 10.5, color: "rgba(206,212,232,0.62)", lineHeight: "16px" }}>
              or
            </span>
            <span className="h-px flex-1" style={{ background: "rgba(150,165,215,0.14)" }} />
          </div>

          {/* 手机号 / 邮箱 */}
          <form onSubmit={submit}>
            {status === "sent" ? (
              <div
                className="hark-fade absolute flex flex-col items-center justify-center text-center"
                style={{ left: colLeft, width: COL_W, top: 458, height: 94 }}
              >
                <span style={{ fontSize: 13, color: "#eef1fb", lineHeight: "18px" }}>
                  Check your {value.includes("@") ? "inbox" : "messages"}
                </span>
                <span
                  className="mt-1 max-w-full truncate"
                  style={{ fontSize: 11.5, color: "rgba(206,212,232,0.62)", lineHeight: "16px" }}
                >
                  We sent a sign-in code to {value.trim()}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setStatus("idle");
                    setValue("");
                  }}
                  className="mt-2 transition-colors hover:text-white"
                  style={{ fontSize: 11.5, color: "rgba(226,231,248,0.85)", lineHeight: "16px" }}
                >
                  Use a different address
                </button>
              </div>
            ) : (
              <>
                <input
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="Mobile number or email address"
                  inputMode="email"
                  autoComplete="email"
                  spellCheck={false}
                  disabled={status === "loading"}
                  className="hark-input absolute text-center outline-none"
                  style={{
                    left: colLeft,
                    width: COL_W,
                    top: 458,
                    height: 38,
                    borderRadius: 19,
                    fontSize: 12.5,
                    color: "#f1f3fb",
                    letterSpacing: -0.1,
                  }}
                />
                <button
                  type="submit"
                  disabled={!valid || status === "loading"}
                  className="hark-continue absolute flex items-center justify-center"
                  data-active={valid ? "" : undefined}
                  style={{
                    left: colLeft,
                    width: COL_W,
                    top: 514,
                    height: 38,
                    borderRadius: 19,
                    fontSize: 12.5,
                    letterSpacing: -0.1,
                  }}
                >
                  {status === "loading" ? <Spinner dark /> : "Continue"}
                </button>
              </>
            )}
          </form>

          {/* 条款 */}
          <p
            className="absolute text-center"
            style={{
              left: colCenter - 120,
              width: 240,
              top: 647,
              fontSize: 9.8,
              letterSpacing: -0.05,
              lineHeight: "13px",
              color: "rgba(168,176,204,0.72)",
            }}
          >
            By continuing, you agree to our <TermsLink>Terms of Service</TermsLink> and acknowledge
            that your data will be processed in accordance with our{" "}
            <TermsLink>Privacy Policy</TermsLink>.
          </p>
        </div>
      </div>

      <style>{`
        .hark-window { animation: hark-in 700ms cubic-bezier(.2,.8,.2,1) both; }
        @keyframes hark-in {
          from { opacity: 0; translate: 0 10px; filter: blur(2px); }
          to { opacity: 1; translate: 0 0; filter: blur(0); }
        }
        .hark-fade { animation: hark-fade 320ms ease-out both; }
        @keyframes hark-fade { from { opacity: 0; translate: 0 4px; } to { opacity: 1; translate: 0 0; } }

        .hark-social {
          background: #f3f3f5;
          color: #1d2030;
          transition: background-color 150ms ease, transform 120ms ease;
        }
        .hark-social:hover { background: #ffffff; }
        .hark-social:active { transform: scale(0.985); }
        .hark-social:focus-visible { outline: 2px solid rgba(160,180,255,0.7); outline-offset: 2px; }

        .hark-input {
          background: rgba(14, 18, 40, 0.3);
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0);
          transition: box-shadow 150ms ease, background-color 150ms ease;
        }
        .hark-input::placeholder { color: rgba(170,178,206,0.55); }
        .hark-input:hover { background: rgba(9, 13, 34, 0.4); }
        .hark-input:focus { background: rgba(9, 13, 34, 0.45); box-shadow: inset 0 0 0 1px rgba(180,195,245,0.35); }

        .hark-continue {
          background: #7c8299;
          color: #3b4160;
          transition: background-color 180ms ease, color 180ms ease, transform 120ms ease;
        }
        .hark-continue[data-active] { background: #f3f3f5; color: #1d2030; cursor: pointer; }
        .hark-continue[data-active]:hover { background: #ffffff; }
        .hark-continue[data-active]:active { transform: scale(0.985); }
        .hark-continue:disabled:not([data-active]) { cursor: default; }

        .hark-link { color: rgba(232,236,250,0.95); transition: color 150ms ease; }
        .hark-link:hover { color: #fff; text-decoration: underline; text-underline-offset: 2px; }

        @keyframes hark-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ----------------------------------------------------------------------------
// 子组件
// ----------------------------------------------------------------------------

function TrafficLights() {
  const colors = [
    { bg: "#ee5f57", ring: "#d24a42" },
    { bg: "#f6bd2f", ring: "#d9a01c" },
    { bg: "#4cae42", ring: "#3a9532" },
  ];
  return (
    <div className="group absolute flex" style={{ left: 12, top: 25, gap: 7 }}>
      {colors.map((c, i) => (
        <span
          key={i}
          className="block"
          style={{
            width: 12,
            height: 12,
            borderRadius: 6,
            background: c.bg,
            boxShadow: `inset 0 0 0 0.5px ${c.ring}`,
          }}
        />
      ))}
    </div>
  );
}

function SocialButton({
  top,
  left,
  icon,
  label,
  loading,
  onClick,
}: {
  top: number;
  left: number;
  icon: React.ReactNode;
  label: string;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="hark-social absolute flex items-center justify-center"
      style={{
        left,
        top,
        width: COL_W,
        height: 39,
        borderRadius: 20,
        fontSize: 13,
        fontWeight: 500,
        letterSpacing: -0.05,
        gap: 9,
      }}
    >
      {loading ? (
        <Spinner dark />
      ) : (
        <>
          {icon}
          <span>{label}</span>
        </>
      )}
    </button>
  );
}

function TermsLink({ children }: { children: React.ReactNode }) {
  return (
    <a href="#" onClick={(e) => e.preventDefault()} className="hark-link">
      {children}
    </a>
  );
}

function Spinner({ dark = false }: { dark?: boolean }) {
  return (
    <span
      aria-label="Loading"
      className="block"
      style={{
        width: 14,
        height: 14,
        borderRadius: 7,
        border: `1.6px solid ${dark ? "rgba(29,32,48,0.18)" : "rgba(255,255,255,0.2)"}`,
        borderTopColor: dark ? "#1d2030" : "#fff",
        animation: "hark-spin 700ms linear infinite",
      }}
    />
  );
}

/** Hark 的帆形标记：左侧尖角 + 右侧外凸弧 */
function HarkMark(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 25 23" fill="none" aria-hidden {...props}>
      <path
        d="M0.6 11.2C7.6 11 13.2 7.4 18.4 0.9C23.6 6.6 24.4 15.4 19.6 22.4C14.8 15.6 8.6 12.2 0.6 11.2Z"
        fill="#F4F4F6"
      />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="14" height="16" viewBox="0 0 384 512" aria-hidden style={{ marginTop: -2 }}>
      <path
        fill="#111"
        d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"
      />
    </svg>
  );
}

function isEmailOrPhone(v: string) {
  const s = v.trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s)) return true;
  const digits = s.replace(/[\s()+\-.]/g, "");
  return /^\d{7,15}$/.test(digits);
}
