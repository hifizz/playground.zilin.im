"use client";

export default function RainbowBorderPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <style>{`
        @import url("https://fonts.googleapis.com/css?family=Montserrat:400,700");

        .rb-wrap {
          display: flex;
          font-family: Montserrat, sans-serif;
          color: #2a103a;
        }

        .rb-has-glow {
          width: 540px;
          height: 220px;
          display: inline-flex;
          position: relative;
          isolation: isolate;
        }

        .rb-content {
          display: flex;
          flex-direction: column;
          padding: 10px;
          flex-grow: 1;
          border-radius: 8px;
          margin: 6px;
          backdrop-filter: blur(22px);
          background: transparent;
          justify-content: center;
          align-items: center;
          gap: 6px;
        }

        .rb-content h1 {
          padding: 0;
          margin: 0;
          font-size: 1.5rem;
          font-weight: 700;
        }

        .rb-white-clip {
          position: absolute;
          background: white;
          filter: blur(6px);
          border-radius: 8px;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .rb-glow {
          border-radius: 6px;
          inset: 1px;
          overflow: hidden;
          position: absolute;
          transition: opacity 0.8s ease-out;
          will-change: opacity;
        }

        .rb-glow-bg {
          --color: oklch(0.85 0.37 145.75);
          animation: rb-spin 3s linear infinite;
          aspect-ratio: 1;
          background: conic-gradient(in oklch longer hue, var(--color), var(--color));
          left: 50%;
          position: absolute;
          top: 50%;
          translate: -50% -50%;
          width: 150%;
        }

        @keyframes rb-spin {
          to {
            rotate: 1turn;
          }
        }
      `}</style>

      <div className="rb-wrap">
        <div className="rb-has-glow">
          <div className="rb-glow">
            <div className="rb-glow-bg" />
          </div>
          <div className="rb-white-clip" />
          <div className="rb-content">
            <h1>Animated rainbow border</h1>
            <div>Pure CSS for the new iOS 18 effect</div>
          </div>
        </div>
      </div>
    </div>
  );
}
