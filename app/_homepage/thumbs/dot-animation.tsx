export function DotAnimationThumb() {
  const dots = Array.from({ length: 25 }, (_, index) => index);

  return (
    <div className="flex h-full w-full items-center justify-center bg-[#f5f4f0]">
      <div className="grid grid-cols-5 gap-[6px]">
        {dots.map((dot) => (
          <span
            key={dot}
            className="h-2 w-2 rounded-full bg-[#1a1a18]"
            style={{ opacity: dot === 4 ? 1 : dot === 3 || dot === 9 ? 0.56 : 0.12 }}
          />
        ))}
      </div>
    </div>
  );
}
