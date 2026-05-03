<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>No-Framer Animation Replica</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

    <style>
        /* 1. 核心动画关键帧 */

        @keyframes dot-fade {
            0%, 100% { opacity: 0.3; }
            20% { opacity: 1; }
            50% { opacity: 0.6; }
        }

        /* 恢复：白色的呼吸光晕 */
        @keyframes shadow-pulse {
            0%, 100% { box-shadow: 0px 0px 0px 0px rgba(255, 255, 255, 0); }
            50% { box-shadow: 0px 0px 12px 0px rgba(255, 255, 255, 0.05); }
        }

        @keyframes ripple-ping-green {
            0% { transform: scale(1); opacity: 0.5; }
            100% { transform: scale(2.5); opacity: 0; }
        }

        @keyframes ripple-ping-yellow {
            0% { transform: scale(1); opacity: 0.5; }
            100% { transform: scale(2.5); opacity: 0; }
        }

        /* 2. 实用类 */

        .anim-dot {
            animation: dot-fade 1.2s ease-in-out infinite;
        }

        .spring-transition {
            transition-property: width, background-color, border-color, box-shadow;
            transition-duration: 400ms;
            transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .text-enter {
            opacity: 0;
            transform: translateX(-10px);
            filter: blur(4px);
        }

        .text-enter-active {
            opacity: 1;
            transform: translateX(0);
            filter: blur(0px);
            transition: all 0.4s ease-out;
            transition-delay: 0.15s;
        }

        .text-exit {
            opacity: 1;
            transform: translateX(0);
            filter: blur(0px);
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            white-space: nowrap;
        }

        .text-exit-active {
            opacity: 0;
            transform: translate(10px, -50%);
            filter: blur(4px);
            transition: all 0.1s ease-in;
        }

        .btn-active:active {
            transform: scale(0.98);
            transition: transform 0.1s;
        }

        .cursor-grab { cursor: grab; }
        .cursor-grabbing { cursor: grabbing; }
    </style>
</head>
<body class="bg-[#0a0a0a] min-h-screen flex items-center justify-center overflow-hidden font-sans text-white">

    <div id="root"></div>

    <script type="text/babel">
        const { useState, useRef, useEffect, useLayoutEffect } = React;

        const CheckIcon = ({ size = 12, strokeWidth = 3 }) => (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
        );

        const RenderingDots = () => (
            <span className="inline-flex ml-0.5 tracking-wider">
                <span className="anim-dot mx-[0.5px]" style={{ animationDelay: '0s' }}>.</span>
                <span className="anim-dot mx-[0.5px]" style={{ animationDelay: '0.15s' }}>.</span>
                <span className="anim-dot mx-[0.5px]" style={{ animationDelay: '0.3s' }}>.</span>
            </span>
        );

        const AnimatedContainer = ({ status, onClick }) => {
            const containerRef = useRef(null);
            const contentRef = useRef(null);

            const [displayStatus, setDisplayStatus] = useState(status);
            const [animState, setAnimState] = useState('idle');

            const [position, setPosition] = useState({ x: 0, y: 0 });
            const [isGrabbing, setIsGrabbing] = useState(false);
            const dragRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0, isDragging: false });

            // 样式配置
            const containerStyles = {
                idle: {
                    borderColor: "rgba(255, 255, 255, 0.08)",
                    backgroundColor: "rgba(0, 0, 0, 0.6)",
                    boxShadow: "0px 0px 0px rgba(0,0,0,0)",
                    animation: "none",
                    dotColor: "bg-emerald-400",
                    textColor: "text-white/90"
                },
                rendering: {
                    // 修改：边框改回原来的白色系，不发黄
                    borderColor: "rgba(255, 255, 255, 0.15)",
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    // 修改：动画改回白色的 shadow-pulse
                    animation: "shadow-pulse 2s ease-in-out infinite",
                    // 保持：圆点保持黄色
                    dotColor: "bg-yellow-400",
                    // 修改：文字改回白色，只有圆点是黄的
                    textColor: "text-white/90"
                },
                success: {
                    borderColor: "rgba(74, 222, 128, 0.3)",
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    boxShadow: "0px 0px 15px rgba(74, 222, 128, 0.1)",
                    animation: "none",
                    dotColor: "bg-emerald-400",
                    textColor: "text-emerald-400"
                }
            };

            useEffect(() => {
                if (status === displayStatus) return;
                setAnimState('exiting');
                const timer = setTimeout(() => {
                    setDisplayStatus(status);
                    setAnimState('entering');
                    setTimeout(() => {
                        setAnimState('idle');
                    }, 400);
                }, 150);
                return () => clearTimeout(timer);
            }, [status]);

            // 宽度的安全计算
            useLayoutEffect(() => {
                const calculateWidth = () => {
                    if (!containerRef.current || !contentRef.current) return;

                    const newContentWidth = contentRef.current.scrollWidth;

                    const safeWidth = newContentWidth > 0 ? newContentWidth : 65;

                    const targetWidth = Math.ceil(safeWidth) + 38 + 6;

                    containerRef.current.style.width = `${targetWidth}px`;
                };

                calculateWidth();
                requestAnimationFrame(calculateWidth);

            }, [displayStatus]);

            const handleMouseDown = (e) => {
                if (e.button !== 0) return;
                dragRef.current.isDragging = false;
                dragRef.current.startX = e.clientX;
                dragRef.current.startY = e.clientY;
                dragRef.current.initialX = position.x;
                dragRef.current.initialY = position.y;
                setIsGrabbing(true);

                const handleMouseMove = (moveEvent) => {
                    const dx = moveEvent.clientX - dragRef.current.startX;
                    const dy = moveEvent.clientY - dragRef.current.startY;
                    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                        dragRef.current.isDragging = true;
                    }
                    setPosition({
                        x: dragRef.current.initialX + dx,
                        y: dragRef.current.initialY + dy
                    });
                };

                const handleMouseUp = () => {
                    setIsGrabbing(false);
                    window.removeEventListener('mousemove', handleMouseMove);
                    window.removeEventListener('mouseup', handleMouseUp);
                };
                window.addEventListener('mousemove', handleMouseMove);
                window.addEventListener('mouseup', handleMouseUp);
            };

            const handleSmartClick = () => {
                if (!dragRef.current.isDragging) {
                    onClick && onClick();
                }
            };

            const activeStyle = containerStyles[status] || containerStyles.idle;
            const contentStyle = containerStyles[displayStatus] || containerStyles.idle;

            const renderContent = () => {
                const commonClasses = "text-xs font-medium whitespace-nowrap flex items-center";
                switch (displayStatus) {
                    case 'idle':
                        return <span className={`${commonClasses} ${contentStyle.textColor}`}>Start Sync</span>;
                    case 'rendering':
                        return <span className={`${commonClasses} ${contentStyle.textColor}`}>Syncing<RenderingDots /></span>;
                    case 'success':
                        return <span className={`${commonClasses} ${contentStyle.textColor} gap-1.5`}>Success<CheckIcon /></span>;
                    default: return null;
                }
            };

            const getTextClasses = () => {
                if (animState === 'exiting') return 'text-exit text-exit-active';
                if (animState === 'entering') return 'text-enter text-enter-active';
                return '';
            };

            return (
                <div
                    ref={containerRef}
                    className={`relative flex items-center gap-2 px-2.5 h-[34px] rounded-full border border-solid backdrop-blur-xl select-none overflow-hidden origin-left spring-transition btn-active min-w-[80px] ${isGrabbing ? 'cursor-grabbing' : 'cursor-grab'}`}
                    style={{
                        borderColor: activeStyle.borderColor,
                        backgroundColor: activeStyle.backgroundColor,
                        boxShadow: activeStyle.boxShadow,
                        animation: activeStyle.animation,
                        willChange: "width, background-color, border-color, transform",
                        transform: `translate3d(${position.x}px, ${position.y}px, 0)`
                    }}
                    onMouseDown={handleMouseDown}
                    onClick={handleSmartClick}
                >
                    {/* 左侧指示灯 */}
                    <div className="relative flex items-center justify-center w-2.5 h-2.5 flex-shrink-0">
                         {/* 内部圆点 */}
                         <div className={`w-1.5 h-1.5 rounded-full absolute z-10 transition-colors duration-500 ${activeStyle.dotColor}`}></div>
                         {/* rendering 时波纹跟随圆点变黄 */}
                         {status === 'rendering' && (
                             <div className="absolute inset-0 bg-yellow-400 rounded-full" style={{ animation: 'ripple-ping-yellow 1.5s ease-out infinite' }}></div>
                         )}
                        {status === 'success' && (
                             <div className="absolute inset-0 bg-emerald-400 rounded-full" style={{ animation: 'ripple-ping-green 1s ease-out forwards' }}></div>
                         )}
                    </div>

                    {/* 文本容器 */}
                    <div className="relative flex items-center overflow-hidden h-full w-full">
                        <div ref={contentRef} className="opacity-0 pointer-events-none absolute w-max" aria-hidden="true">
                            {renderContent()}
                        </div>
                        <div className={`absolute left-0 top-1/2 -translate-y-1/2 ${getTextClasses()}`}>
                             {renderContent()}
                        </div>
                    </div>
                </div>
            );
        };

        const App = () => {
            const [status, setStatus] = useState('idle');
            const isProcessing = useRef(false);

            const handleProcess = () => {
                if (status !== 'idle' || isProcessing.current) return;
                isProcessing.current = true;
                setStatus('rendering');
                setTimeout(() => {
                    setStatus('success');
                    setTimeout(() => {
                        setStatus('idle');
                        isProcessing.current = false;
                    }, 2500);
                }, 3000);
            };

            return (
                <div className="relative w-full h-screen flex items-center justify-center">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[100px]"></div>

                    <div className="relative z-10 w-[300px] flex justify-start pl-8">
                        <AnimatedContainer status={status} onClick={handleProcess} />
                        <div className="absolute -bottom-12 left-8 text-zinc-600 text-[10px] font-mono whitespace-nowrap pointer-events-none">
                            Drag me · Click to sync
                        </div>
                    </div>
                </div>
            );
        };

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<App />);
    </script>
</body>
</html>
