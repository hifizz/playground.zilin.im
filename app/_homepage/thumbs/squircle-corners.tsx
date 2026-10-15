export function SquircleCornersThumb() {
  return (
    <div
      className="w-full h-full flex items-center justify-center p-8"
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}
    >
      <div className="grid grid-cols-2 gap-4">
        {/* Squircle shape */}
        <div className="space-y-2">
          <div
            className="w-20 h-20 bg-white/90"
            style={{
              borderRadius: '16px',
              // @ts-ignore
              cornerShape: 'squircle'
            }}
          />
          <div className="text-[10px] text-white/70 text-center font-medium">
            Squircle
          </div>
        </div>

        {/* Standard radius */}
        <div className="space-y-2">
          <div
            className="w-20 h-20 bg-white/40"
            style={{
              borderRadius: '16px'
            }}
          />
          <div className="text-[10px] text-white/50 text-center font-medium">
            Standard
          </div>
        </div>
      </div>
    </div>
  );
}
