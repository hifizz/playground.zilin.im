export function SyncButtonThumb() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-5" style={{ background: "linear-gradient(145deg, #001818 0%, #001a30 100%)" }}>
      <svg width="46" height="46" viewBox="0 0 46 46" fill="none">
        <circle cx="23" cy="23" r="18" stroke="rgba(34,211,238,0.14)" strokeWidth="1.5" />
        <path d="M13 23a10 10 0 0 1 17-7.4" stroke="rgba(34,211,238,0.78)" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M33 23a10 10 0 0 1-17 7.4" stroke="rgba(34,211,238,0.35)" strokeWidth="1.5" strokeLinecap="round" />
        <polygon points="29,11.5 33.5,15.5 29,15.5" fill="rgba(34,211,238,0.78)" />
      </svg>
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        borderRadius: 999,
        background: "rgba(34,211,238,0.1)",
        border: "1px solid rgba(34,211,238,0.2)",
        padding: "8px 20px",
      }}>
        <div style={{ height: 5, width: 44, borderRadius: 3, background: "rgba(34,211,238,0.42)" }} />
        <div style={{ width: 6, height: 6, borderRadius: 3, background: "rgba(34,211,238,0.62)" }} />
      </div>
    </div>
  );
}
