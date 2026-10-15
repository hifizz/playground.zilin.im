export default function SquircleCornersPage() {
  return (
    <div className="min-h-screen bg-neutral-900 py-16 px-4">
      <div className="max-w-6xl mx-auto space-y-16">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-neutral-50">
            Squircle Corner Shape
          </h1>
          <p className="text-neutral-400 max-w-2xl mx-auto">
            Exploring the CSS corner-shape property with squircle curves - a smoother, more organic alternative to standard border-radius
          </p>
        </div>

        {/* Section 1: Comparison */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-neutral-100">
            1. Squircle vs Standard Radius
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Squircle */}
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-medium text-neutral-200 mb-6">
                  Squircle Corner Shape
                </h3>
                <div className="flex justify-center">
                  <button
                    className="px-8 py-4 bg-neutral-700 hover:bg-neutral-600 text-neutral-50 font-medium transition-colors duration-300"
                    style={{
                      borderRadius: 'calc(36px * 0.7)',
                      // @ts-ignore - corner-shape is experimental
                      cornerShape: 'squircle'
                    }}
                  >
                    Squircle Button
                  </button>
                </div>
                <p className="text-sm text-neutral-500 mt-4">
                  Organic, continuous curve
                </p>
              </div>
            </div>

            {/* Standard */}
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-medium text-neutral-400 mb-6">
                  Standard Border Radius
                </h3>
                <div className="flex justify-center">
                  <button
                    className="px-8 py-4 bg-neutral-700 hover:bg-neutral-600 text-neutral-50 font-medium transition-colors duration-300"
                    style={{
                      borderRadius: 'calc(36px * 0.7)'
                    }}
                  >
                    Standard Button
                  </button>
                </div>
                <p className="text-sm text-neutral-500 mt-4">
                  Circular arc approximation
                </p>
              </div>
            </div>
          </div>

          {/* Visual Comparison */}
          <div className="border border-neutral-800 bg-neutral-800/50 rounded-2xl p-8">
            <h4 className="text-sm font-medium text-neutral-300 mb-4">
              Side-by-Side Visual Comparison
            </h4>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="relative">
                <div
                  className="w-48 h-48 mx-auto bg-neutral-700"
                  style={{
                    borderRadius: 'calc(36px * 0.7)',
                    // @ts-ignore
                    cornerShape: 'squircle'
                  }}
                />
                <p className="text-center text-xs text-neutral-300 mt-2 font-medium">
                  Squircle
                </p>
              </div>
              <div className="relative">
                <div
                  className="w-48 h-48 mx-auto bg-neutral-700"
                  style={{
                    borderRadius: 'calc(36px * 0.7)'
                  }}
                />
                <p className="text-center text-xs text-neutral-500 mt-2 font-medium">
                  Standard
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Size Variations */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-neutral-100">
            2. Squircle at Different Dimensions
          </h2>

          {/* Small to Large Square */}
          <div className="border border-neutral-800 bg-neutral-800/50 rounded-2xl p-8 space-y-6">
            <h4 className="text-sm font-medium text-neutral-300">
              Square Dimensions (Balanced)
            </h4>
            <div className="flex flex-wrap items-end justify-center gap-8">
              {[
                { size: 60, radius: 12, label: 'Small (60px)' },
                { size: 100, radius: 20, label: 'Medium (100px)' },
                { size: 160, radius: 32, label: 'Large (160px)' },
                { size: 240, radius: 48, label: 'XL (240px)' },
              ].map((item) => (
                <div key={item.size} className="space-y-2">
                  <div
                    className="bg-neutral-700 mx-auto"
                    style={{
                      width: item.size,
                      height: item.size,
                      borderRadius: item.radius,
                      // @ts-ignore
                      cornerShape: 'squircle'
                    }}
                  />
                  <p className="text-xs text-center text-neutral-400">
                    {item.label}
                  </p>
                  <p className="text-xs text-center text-neutral-600">
                    radius: {item.radius}px
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Wide Rectangles */}
          <div className="border border-neutral-800 bg-neutral-800/50 rounded-2xl p-8 space-y-6">
            <h4 className="text-sm font-medium text-neutral-300">
              Wide Rectangles (Horizontal Pills)
            </h4>
            <div className="space-y-4">
              {[
                { w: 300, h: 60, radius: 16, label: 'Wide Button (300×60)' },
                { w: 400, h: 80, radius: 24, label: 'Wide Card (400×80)' },
                { w: 500, h: 100, radius: 32, label: 'Wide Banner (500×100)' },
              ].map((item) => (
                <div key={`${item.w}-${item.h}`} className="space-y-2">
                  <div
                    className="bg-neutral-700 mx-auto flex items-center justify-center text-neutral-200 font-medium"
                    style={{
                      width: item.w,
                      height: item.h,
                      borderRadius: item.radius,
                      // @ts-ignore
                      cornerShape: 'squircle'
                    }}
                  >
                    {item.label}
                  </div>
                  <p className="text-xs text-center text-neutral-600">
                    radius: {item.radius}px
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Tall Rectangles */}
          <div className="border border-neutral-800 bg-neutral-800/50 rounded-2xl p-8 space-y-6">
            <h4 className="text-sm font-medium text-neutral-300">
              Tall Rectangles (Vertical Cards)
            </h4>
            <div className="flex flex-wrap items-start justify-center gap-8">
              {[
                { w: 120, h: 200, radius: 24, label: 'Mobile Card' },
                { w: 160, h: 280, radius: 32, label: 'Profile Card' },
                { w: 200, h: 360, radius: 40, label: 'Story Card' },
              ].map((item) => (
                <div key={`${item.w}-${item.h}`} className="space-y-2">
                  <div
                    className="bg-neutral-700 mx-auto"
                    style={{
                      width: item.w,
                      height: item.h,
                      borderRadius: item.radius,
                      // @ts-ignore
                      cornerShape: 'squircle'
                    }}
                  />
                  <p className="text-xs text-center text-neutral-400">
                    {item.label}
                  </p>
                  <p className="text-xs text-center text-neutral-600">
                    {item.w}×{item.h}, r={item.radius}px
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Extreme Aspect Ratios */}
          <div className="border border-neutral-800 bg-neutral-800/50 rounded-2xl p-8 space-y-6">
            <h4 className="text-sm font-medium text-neutral-300">
              Extreme Aspect Ratios
            </h4>
            <div className="space-y-6">
              {/* Very wide */}
              <div className="space-y-2">
                <div
                  className="bg-neutral-700 mx-auto"
                  style={{
                    width: 600,
                    height: 50,
                    borderRadius: 20,
                    // @ts-ignore
                    cornerShape: 'squircle'
                  }}
                />
                <p className="text-xs text-center text-neutral-400">
                  Ultra-wide Bar (600×50)
                </p>
              </div>

              {/* Very tall (centered) */}
              <div className="flex justify-center">
                <div className="space-y-2">
                  <div
                    className="bg-neutral-700 mx-auto"
                    style={{
                      width: 80,
                      height: 300,
                      borderRadius: 24,
                      // @ts-ignore
                      cornerShape: 'squircle'
                    }}
                  />
                  <p className="text-xs text-center text-neutral-400">
                    Ultra-tall (80×300)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Implementation & Compatibility */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-neutral-100">
            3. Implementation, Compatibility & Issues
          </h2>

          <div className="border border-neutral-800 bg-neutral-800/50 rounded-2xl p-8 space-y-6">
            {/* Implementation */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-neutral-200">
                💻 Implementation
              </h3>
              <pre className="bg-black/50 border border-neutral-800 p-4 rounded-lg overflow-x-auto text-sm">
                <code className="text-neutral-300">{`.squircle-button {
  border-radius: calc(36px * 0.7); /* 25.2px */
  corner-shape: squircle;
}`}</code>
              </pre>
              <ul className="space-y-2 text-sm text-neutral-400 list-disc list-inside">
                <li>
                  <code className="text-neutral-300">corner-shape: squircle</code> creates a superellipse curve (Lamé curve with n≈5)
                </li>
                <li>
                  The <code className="text-neutral-300">border-radius</code> value controls the corner size
                </li>
                <li>
                  Squircle corners are mathematically defined to be smoother than circular arcs
                </li>
                <li>
                  Popular in modern design systems (iOS icons, macOS UI, etc.)
                </li>
              </ul>
            </div>

            {/* Compatibility */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-neutral-200">
                🌐 Browser Compatibility
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">✅</span>
                  <div>
                    <p className="font-medium text-green-400">
                      Microsoft Edge 151+ (Chromium)
                    </p>
                    <p className="text-sm text-neutral-500">
                      Experimental support behind flag
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <p className="font-medium text-orange-400">
                      Chrome/Chromium (Not yet)
                    </p>
                    <p className="text-sm text-neutral-500">
                      In experimental phase, may arrive in future versions
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">❌</span>
                  <div>
                    <p className="font-medium text-neutral-500">
                      Firefox, Safari (No support)
                    </p>
                    <p className="text-sm text-neutral-600">
                      Falls back to standard border-radius
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Issues & Considerations */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-neutral-200">
                ⚡ Issues & Considerations
              </h3>
              <ul className="space-y-3 text-sm text-neutral-400">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">▸</span>
                  <div>
                    <strong className="text-neutral-300">Very Limited Browser Support:</strong> Only works in Edge 151+ with experimental flags enabled. Not production-ready for most websites.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">▸</span>
                  <div>
                    <strong className="text-neutral-300">Progressive Enhancement Required:</strong> Must always include border-radius as fallback. Unsupported browsers will show standard rounded corners.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-400 mt-0.5">▸</span>
                  <div>
                    <strong className="text-neutral-300">No Standard Yet:</strong> The property is experimental and may change before standardization.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-400 mt-0.5">▸</span>
                  <div>
                    <strong className="text-neutral-300">Performance Unknown:</strong> Rendering performance impact not well documented yet.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-neutral-500 mt-0.5">▸</span>
                  <div>
                    <strong className="text-neutral-300">Alternatives:</strong> For production, consider SVG masks, CSS clip-path, or canvas-based solutions to achieve similar effects cross-browser.
                  </div>
                </li>
              </ul>
            </div>

            {/* Future Outlook */}
            <div className="space-y-3 border-t border-neutral-800 pt-6">
              <h3 className="text-lg font-medium text-neutral-200">
                🔮 Future Outlook
              </h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                The <code className="text-neutral-300">corner-shape</code> property is part of the CSS Shapes Level 2 proposal.
                If adopted widely, it could provide native support for design trends popularized by Apple's design language.
                However, current adoption is minimal, and it may take years before it's safe to use in production without fallbacks.
              </p>
              <p className="text-sm text-neutral-400 leading-relaxed">
                For now, treat this as a progressive enhancement feature - provide the property for supporting browsers,
                but ensure your design works perfectly with standard border-radius.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center text-sm text-neutral-500 pt-8 border-t border-neutral-800">
          <p>
            Demo inspired by{' '}
            <a
              href="https://explore.microsoft.com/zh-cn/edge/update/151"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-400 hover:text-neutral-100 transition-colors"
            >
              Microsoft Edge 151 Update
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
