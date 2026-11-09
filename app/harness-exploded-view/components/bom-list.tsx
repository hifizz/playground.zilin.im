import { clsx } from "clsx";
import { MODULE_IDS, MODULE_INFO, num } from "../data/module-info";
import type { ModuleId } from "../data/module-info";

interface BomListProps {
  active: ModuleId | null;
  pinned: ModuleId | null;
  onHover: (id: ModuleId | null) => void;
  onPin: (id: ModuleId) => void;
}

export default function BomList({ active, pinned, onHover, onPin }: BomListProps) {
  return (
    <aside className="x-bom" aria-label="零件表">
      <div className="x-bom__head">
        <span>零件表 · BOM</span>
        <span>13 件</span>
      </div>
      <ol>
        {MODULE_IDS.map((id) => (
          <li key={id}>
            <button
              type="button"
              className={clsx({ "is-on": id === active, "is-pinned": id === pinned })}
              onMouseEnter={() => onHover(id)}
              onMouseLeave={() => onHover(null)}
              onFocus={() => onHover(id)}
              onBlur={() => onHover(null)}
              onClick={() => onPin(id)}
            >
              <span className="n">{num(id)}</span>
              <span className="t">{MODULE_INFO[id].name}</span>
              <span className="s">{MODULE_INFO[id].sub}</span>
            </button>
          </li>
        ))}
      </ol>
    </aside>
  );
}
