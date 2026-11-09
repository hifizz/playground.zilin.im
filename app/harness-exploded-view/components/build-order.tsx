import { clsx } from "clsx";
import type { ModuleId } from "../data/module-info";

const STEPS: { label: string; mod: ModuleId }[] = [
  { label: "Loop", mod: "loop" },
  { label: "工具", mod: "tools" },
  { label: "事件日志", mod: "eventlog" },
  { label: "权限与沙箱", mod: "policy" },
  { label: "上下文", mod: "context" },
  { label: "Skills", mod: "skills" },
  { label: "记忆", mod: "memory" },
  { label: "Runtime 组装", mod: "loop" },
  { label: "入口与会话", mod: "gateway" },
  { label: "子 Agent", mod: "subagents" },
  { label: "可观测性", mod: "telemetry" },
  { label: "Eval", mod: "eval" },
];

interface BuildOrderProps {
  active: ModuleId | null;
  pinned: ModuleId | null;
  onHover: (id: ModuleId | null) => void;
  onSelect: (id: ModuleId) => void;
}

export default function BuildOrder({ active, pinned, onHover, onSelect }: BuildOrderProps) {
  return (
    <section className="section" id="order">
      <div className="head">
        <p className="head__eyebrow">构建顺序</p>
        <h2>先让 Loop 转起来，再一层层往上加。</h2>
        <p className="head__sub">点任意一步，在图上定位对应模块。</p>
      </div>
      <ol className="x-order">
        {STEPS.map(({ label, mod }) => (
          <li key={label}>
            <button
              type="button"
              className={clsx({ "is-on": mod === active, "is-pinned": mod === pinned })}
              onMouseEnter={() => onHover(mod)}
              onMouseLeave={() => onHover(null)}
              onFocus={() => onHover(mod)}
              onBlur={() => onHover(null)}
              onClick={() => onSelect(mod)}
            >
              {label}
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
