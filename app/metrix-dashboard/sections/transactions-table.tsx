"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatMoney, INITIAL_TRANSACTIONS, NEW_TRANSACTION_POOL, type Transaction, type TxStatus } from "../data";
import { AnimatedNumber } from "../ui/animated-number";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Img, type IconName } from "../ui/icons";
import { PanelHeader, PanelShell } from "../ui/panel";

type SortKey = keyof Transaction;
type Sort = { key: SortKey; dir: 1 | -1 } | null;

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "customer", label: "Customer" },
  { key: "product", label: "Product" },
  { key: "status", label: "Status" },
  { key: "qty", label: "Qty" },
  { key: "unitPrice", label: "Unit Price" },
  { key: "total", label: "Total Revenue" },
];

const STATUS: Record<TxStatus, { icon: IconName; color: string }> = {
  Success: { icon: "statusSuccess", color: "text-mx-success" },
  Pending: { icon: "statusPending", color: "text-mx-warning" },
  Refunded: { icon: "statusRefunded", color: "text-mx-neutral" },
};

/** 排序表头：sort 图标用 clip-path 只露出上半 / 下半来表示升降序 */
function SortableHead({ label, dir, onClick, className }: { label: string; dir: 0 | 1 | -1; onClick: () => void; className?: string }) {
  return (
    <th className={cn("px-[12px] py-[10px] font-normal", className)} aria-sort={dir === 1 ? "ascending" : dir === -1 ? "descending" : "none"}>
      <button
        onClick={onClick}
        className={cn(
          "group/sort flex items-center gap-[6px] whitespace-nowrap font-mx-mono text-[12px] uppercase leading-none outline-none transition-colors",
          dir ? "text-[#b3b3b3]" : "text-mx-subtle hover:text-[#999]",
        )}
      >
        {label}
        <span className="relative h-[8px] w-[6px]">
          <Img
            name="sort"
            width={6}
            height={8}
            className={cn(
              "transition-[transform,clip-path,opacity] duration-200",
              dir === 1 && "[clip-path:inset(0_0_50%_0)]",
              dir === -1 && "[clip-path:inset(50%_0_0_0)]",
              !dir && "opacity-100 group-hover/sort:opacity-80",
            )}
          />
        </span>
      </button>
    </th>
  );
}

function StatusPill({ status }: { status: TxStatus }) {
  const s = STATUS[status];
  return (
    <span className="flex h-[24px] w-[92px] items-center justify-center gap-[4px] overflow-clip rounded-[88px] border-[0.6px] border-white/[0.08] bg-mx-muted px-[8px] py-[10px] shadow-[0px_0px_0px_1px_rgba(0,0,0,0.2)] transition-transform duration-200 group-hover:-translate-y-px">
      <Img name={s.icon} width={12} height={12} />
      <span className={cn("whitespace-nowrap text-[12px] leading-[normal]", s.color)}>{status}</span>
    </span>
  );
}

function RowActions({ tx, onDelete }: { tx: Transaction; onDelete: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="iconSm" aria-label={`Actions for ${tx.id}`} className="data-[state=open]:bg-[#42413f]">
          <Img name="moreCircle" width={16} height={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          {tx.id} · {formatMoney(tx.total)}
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem>View details</DropdownMenuItem>
          <DropdownMenuItem>Download invoice</DropdownMenuItem>
          <DropdownMenuItem>Contact customer</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem variant="destructive" onSelect={onDelete}>
            Remove
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TableSearch({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="group hidden h-[30px] w-[240px] cursor-text items-center gap-2 overflow-clip rounded-[6px] border-[0.6px] border-white/[0.12] px-[8px] py-[7px] transition-[border-color,box-shadow] focus-within:border-mx-primary/50 focus-within:shadow-[0px_0px_0px_3px_rgba(249,115,22,0.12)] hover:border-white/20 sm:flex">
      <span className="relative size-[16.64px] shrink-0">
        <Img name="search" width={14.5699} height={14.8872} className="absolute left-[1.15px] top-[1.15px]" />
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type="search"
        placeholder="Search transactions..."
        aria-label="Search transactions"
        className="w-full min-w-0 bg-transparent text-[12.48px] leading-[1.6] text-mx-fg outline-none placeholder:text-mx-subtle [&::-webkit-search-cancel-button]:hidden"
      />
    </label>
  );
}

export function TransactionsTable() {
  const [rows, setRows] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [flashId, setFlashId] = useState<string | null>(null); // 新增行短暂高亮

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = q ? rows.filter((r) => [r.id, r.customer, r.product, r.status].some((v) => v.toLowerCase().includes(q))) : rows;
    if (sort) {
      list = [...list].sort((a, b) => {
        const x = a[sort.key];
        const y = b[sort.key];
        return (typeof x === "number" ? x - (y as number) : String(x).localeCompare(String(y))) * sort.dir;
      });
    }
    return list;
  }, [rows, query, sort]);

  const allSelected = visible.length > 0 && visible.every((r) => selected.has(r.id));
  const someSelected = visible.some((r) => selected.has(r.id));

  /** 无 → 升序 → 降序 → 无 */
  const toggleSort = (key: SortKey) =>
    setSort((s) => (s?.key === key ? (s.dir === 1 ? { key, dir: -1 } : null) : { key, dir: 1 }));

  const addTransaction = () => {
    const added = rows.length - INITIAL_TRANSACTIONS.length;
    const base = NEW_TRANSACTION_POOL[added % NEW_TRANSACTION_POOL.length];
    const id = `#0${4910 + rows.length}`;
    setRows((r) => [{ ...base, id }, ...r]);
    setFlashId(id);
    setTimeout(() => setFlashId(null), 1600);
  };

  const sortDir = (key: SortKey): 0 | 1 | -1 => (sort?.key === key ? sort.dir : 0);

  return (
    <PanelShell aria-labelledby="tx-title" className="lg:ml-[2px]">
      <PanelHeader id="tx-title" title="Recent Transactions" info="Latest orders across all channels">
        <TableSearch value={query} onChange={setQuery} />
        <Button variant="primary" size="sm" onClick={addTransaction} className="group border-[0.6px] border-white/20">
          <Img name="plus" width={12} height={12} className="transition-transform duration-300 group-hover:rotate-90" />
          Add Transaction
        </Button>
      </PanelHeader>

      <div className="mx-stroke-inside relative overflow-x-auto rounded-[10px] bg-mx-card [scrollbar-width:thin]">
        <table className="w-full min-w-[980px] table-fixed border-collapse text-left">
          <thead>
            <tr className="h-[36px] [&>th]:shadow-[inset_0_-0.8px_0_var(--mx-border)]">
              <th className="w-[36px] p-[10px] align-middle">
                <Checkbox
                  aria-label="Select all"
                  checked={allSelected ? true : someSelected ? "indeterminate" : false}
                  onCheckedChange={(c) => setSelected(c ? new Set(visible.map((r) => r.id)) : new Set())}
                />
              </th>
              <SortableHead label="ID" dir={sortDir("id")} onClick={() => toggleSort("id")} className="w-[90px] pl-[12px] pr-[16px]" />
              {COLUMNS.map((c) => (
                <SortableHead key={c.key} label={c.label} dir={sortDir(c.key)} onClick={() => toggleSort(c.key)} />
              ))}
              <th className="w-[60px] px-[12px] py-[10px] font-mx-mono text-[12px] font-normal uppercase leading-none text-mx-subtle">
                <div className="flex justify-end whitespace-nowrap">Actions</div>
              </th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {visible.map((tx, i) => {
                const isSelected = selected.has(tx.id);
                return (
                  <motion.tr
                    key={tx.id}
                    layout="position"
                    initial={{ opacity: 0, backgroundColor: "rgba(249,115,22,0.10)" }}
                    animate={{ opacity: 1, backgroundColor: flashId === tx.id ? "rgba(249,115,22,0.10)" : "rgba(249,115,22,0)" }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1], backgroundColor: { duration: 1.2 } }}
                    className={cn(
                      "group h-[44px] transition-colors duration-150 [&>td]:shadow-[inset_0_-0.6px_0_var(--mx-border)] hover:!bg-white/[0.025]",
                      isSelected && "!bg-mx-primary/[0.06]",
                    )}
                  >
                    <td className="p-[10px] align-middle">
                      <Checkbox
                        aria-label={`Select ${tx.id}`}
                        checked={isSelected}
                        onCheckedChange={(c) =>
                          setSelected((prev) => {
                            const next = new Set(prev);
                            if (c) next.add(tx.id);
                            else next.delete(tx.id);
                            return next;
                          })
                        }
                      />
                    </td>
                    <td className="w-[90px] truncate px-[12px] py-[10px] text-[13px] leading-none text-mx-subtle">{tx.id}</td>
                    <td className="truncate px-[12px] py-[10px] text-[13px] leading-none text-mx-fg">{tx.customer}</td>
                    <td className="truncate px-[12px] py-[10px] text-[13px] leading-none text-mx-fg">{tx.product}</td>
                    <td className="px-[12px] py-[10px]">
                      <StatusPill status={tx.status} />
                    </td>
                    <td className="px-[12px] py-[10px] font-mx-mono text-[13px] font-medium leading-none text-mx-fg tabular-nums">
                      <AnimatedNumber value={tx.qty} duration={0.9} delay={0.3 + i * 0.05} />
                    </td>
                    <td className="px-[12px] py-[10px] font-mx-mono text-[13px] font-medium leading-none text-mx-fg tabular-nums">
                      <AnimatedNumber value={tx.unitPrice} prefix="$" duration={1} delay={0.3 + i * 0.05} />
                    </td>
                    <td className="px-[12px] py-[10px] font-mx-mono text-[13px] font-medium leading-none text-mx-fg tabular-nums">
                      <AnimatedNumber value={tx.total} prefix="$" duration={1.1} delay={0.3 + i * 0.05} />
                    </td>
                    <td className="w-[60px] px-[12px] py-0">
                      <div className="flex justify-end">
                        <RowActions tx={tx} onDelete={() => setRows((r) => r.filter((x) => x.id !== tx.id))} />
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
            {visible.length === 0 && (
              <tr className="h-[88px]">
                <td colSpan={9} className="text-center text-[13px] text-mx-subtle">
                  No transactions match “{query}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </PanelShell>
  );
}
