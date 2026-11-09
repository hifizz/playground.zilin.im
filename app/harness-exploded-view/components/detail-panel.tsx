import { useState } from "react";
import { MODULE_IDS, MODULE_INFO, num } from "../data/module-info";
import type { ModuleId } from "../data/module-info";

interface DetailPanelProps {
  pinnedId: ModuleId | null;
  onClose: () => void;
  onPrev: (id: ModuleId) => void;
  onNext: (id: ModuleId) => void;
}

// what/how/pit/pi 内含 <code> 标签的静态受信内容，用 dangerouslySetInnerHTML 注入。
function Html({ code }: { code: string }) {
  return <dd dangerouslySetInnerHTML={{ __html: code }} />;
}

export default function DetailPanel({ pinnedId, onClose, onPrev, onNext }: DetailPanelProps) {
  // 关闭滑出动画期间保留上一个模块的内容，与原静态页一致（渲染期回填上一帧的值）。
  const [lastId, setLastId] = useState<ModuleId | null>(null);
  const [prevPinned, setPrevPinned] = useState<ModuleId | null>(null);
  if (pinnedId !== prevPinned) {
    setPrevPinned(pinnedId);
    if (pinnedId) setLastId(pinnedId);
  }
  const shown = pinnedId ?? lastId;
  const info = shown ? MODULE_INFO[shown] : null;
  const i = shown ? MODULE_IDS.indexOf(shown) : -1;

  return (
    <aside
      className={pinnedId ? "x-panel is-open" : "x-panel"}
      role="dialog"
      aria-modal="false"
      aria-labelledby="p-name"
      tabIndex={-1}
    >
      <div className="x-panel__bar">
        <span>{shown ? `DETAIL · HARNESS-001 / ${num(shown)}` : "DETAIL"}</span>
        <button className="x-close" type="button" aria-label="关闭" onClick={onClose}>
          ✕
        </button>
      </div>
      {info && shown ? (
        <>
          <p className="x-panel__num">
            {num(shown)} · {shown}
          </p>
          <h2 id="p-name">{info.name}</h2>
          <p className="x-panel__sub">{info.sub}</p>
          <p className="x-panel__hover">{info.hover}</p>
          <dl>
            <dt>做什么</dt>
            <Html code={info.what} />
            <dt>怎么实现</dt>
            <Html code={info.how} />
            <dt>坑</dt>
            <Html code={info.pit} />
            <dt>对照</dt>
            <Html code={info.pi} />
          </dl>
          <div className="x-panel__nav">
            <button className="x-play" type="button" disabled={i === 0} onClick={() => onPrev(shown)}>
              ↓ 下一层
            </button>
            <button className="x-play" type="button" disabled={i === MODULE_IDS.length - 1} onClick={() => onNext(shown)}>
              ↑ 上一层
            </button>
          </div>
        </>
      ) : null}
    </aside>
  );
}
