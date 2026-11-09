import { clsx } from "clsx";
import type { ModuleId } from "../data/module-info";

const PACKAGES: { pkg: string; note?: string; duty: string; mod: ModuleId }[] = [
  { pkg: "@h/ai", duty: "多厂商模型调用、流式、重试、降级", mod: "provider" },
  { pkg: "@h/core", duty: "消息与事件类型、Agent loop，以及 Tool / Store / Policy / Sandbox 接口；不做 I/O", mod: "loop" },
  { pkg: "@h/tools", duty: "内置工具（文件、shell、网页）与 MCP 客户端", mod: "tools" },
  { pkg: "@h/store", duty: "事件日志、快照、续跑；内存、SQLite、Postgres 适配器", mod: "eventlog" },
  { pkg: "@h/context", duty: "prompt 组装、压缩、token 预算", mod: "context" },
  { pkg: "@h/skills", duty: "Skill 发现、索引、按需加载", mod: "skills" },
  { pkg: "@h/memory", duty: "记忆写入、召回、去重、过期、删除", mod: "memory" },
  { pkg: "@h/policy", duty: "权限、审批、预算与步数上限、hooks", mod: "policy" },
  { pkg: "@h/sandbox", duty: "本地、Docker、云沙箱执行器；密钥注入", mod: "sandbox" },
  { pkg: "@h/runtime", duty: "组装所有包成 session；持久执行、子 agent", mod: "subagents" },
  { pkg: "@h/gateway", duty: "CLI、HTTP/SSE、IM、定时任务、webhook", mod: "gateway" },
  { pkg: "@h/telemetry", note: "横切", duty: "订阅事件，输出 OTel trace 与费用", mod: "telemetry" },
  { pkg: "@h/eval", note: "横切", duty: "数据集、事件重放、评分、CI 门禁", mod: "eval" },
];

interface PackagesTableProps {
  active: ModuleId | null;
  pinned: ModuleId | null;
  onHover: (id: ModuleId | null) => void;
  onSelect: (id: ModuleId) => void;
}

export default function PackagesTable({ active, pinned, onHover, onSelect }: PackagesTableProps) {
  return (
    <section className="section" id="packages">
      <div className="head">
        <p className="head__eyebrow">分包</p>
        <h2>分包：11 个主包 + 2 个横切包</h2>
        <p className="head__sub">点任意一行，在图上定位对应模块。</p>
      </div>
      <div className="table-wrap x-pkg">
        <table>
          <thead>
            <tr>
              <th scope="col">包</th>
              <th scope="col">职责</th>
              <th scope="col">对应模块</th>
            </tr>
          </thead>
          <tbody>
            {PACKAGES.map(({ pkg, note, duty, mod }) => (
              <tr
                key={pkg}
                className={clsx({ "is-on": mod === active, "is-pinned": mod === pinned })}
                onMouseEnter={() => onHover(mod)}
                onMouseLeave={() => onHover(null)}
                onClick={() => onSelect(mod)}
              >
                <th scope="row">
                  <button className="x-pkg__btn" type="button" onFocus={() => onHover(mod)} onBlur={() => onHover(null)}>
                    {pkg}
                    {note ? <small>{note}</small> : null}
                  </button>
                </th>
                <td data-label="职责">{duty}</td>
                <td data-label="对应模块" className="x-pkg__mod">
                  {mod}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ol className="x-rules">
        <li>core 不做 I/O，mock 模型即可单测。</li>
        <li>只有 runtime 负责组装，各实现包互不依赖。</li>
        <li>
          事件是跨包合同：store 记录、telemetry 订阅、eval 重放，schema 带版本号（Pi 的 pi-telemetry 就是这样一份零依赖合同）。
        </li>
      </ol>
    </section>
  );
}
