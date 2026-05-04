export function ShimmerTextThumb() {
  const keyframes = `
    @keyframes shimmer-thumb-sweep {
      0%   { background-position: 100% 0; }
      100% { background-position: 0% 0; }
    }
  `;
  const gradient = `linear-gradient(
    90deg,
    rgba(255,255,255,0.25) 0%,
    rgba(255,255,255,0.25) 42%,
    rgba(255,255,255,0.95) 50%,
    rgba(255,255,255,0.25) 58%,
    rgba(255,255,255,0.25) 100%
  )`;

  const lineStyle = (delay: number, fontSize: number, weight: number) => ({
    backgroundImage: gradient,
    backgroundSize: "250% 100%",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "100% 0",
    WebkitBackgroundClip: "text" as const,
    backgroundClip: "text" as const,
    color: "transparent",
    WebkitTextFillColor: "transparent" as const,
    animation: `shimmer-thumb-sweep 2.4s linear ${delay}s infinite`,
    fontSize,
    fontWeight: weight,
    letterSpacing: "-0.01em",
  });

  return (
    <div
      className="w-full h-full flex flex-col items-start justify-center gap-2 pl-9 pr-5"
      style={{
        background:
          "linear-gradient(160deg, #0a0a0f 0%, #11111a 60%, #0e0e16 100%)",
      }}
    >
      <style>{keyframes}</style>

      {/* dotted prefix */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            background: "rgba(255,255,255,0.4)",
            animation: "shimmer-thumb-sweep 1.4s linear infinite",
          }}
        />
        <span style={lineStyle(0, 13, 600)}>Generating component…</span>
      </div>

      <span style={lineStyle(0.4, 11, 500)}>Reading project files</span>
      <span style={lineStyle(0.8, 11, 500)}>Applying edits</span>
    </div>
  );
}
