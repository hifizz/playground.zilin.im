"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { INITIAL_TRANSACTIONS } from "./data";
import { Sidebar } from "./layout/sidebar";
import { TopBar } from "./layout/top-bar";
import { KpiCards } from "./sections/kpi-cards";
import { PageHeader } from "./sections/page-header";
import { RevenueBreakdown } from "./sections/revenue-breakdown";
import { SalesTrend } from "./sections/sales-trend";
import { TransactionsTable } from "./sections/transactions-table";
import { PortalContainerProvider } from "./ui/portal";
import { TooltipProvider } from "./ui/tooltip";
import { mxFontClass } from "./fonts";
import "./metrix.css";

function exportCsv() {
  const body = INITIAL_TRANSACTIONS.map((t) => [t.id, t.customer, t.product, t.status, t.qty, t.unitPrice, t.total].join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([`id,customer,product,status,qty,unit_price,total_revenue\n${body}\n`], { type: "text/csv" }));
  Object.assign(document.createElement("a"), { href: url, download: "spark-overview-2025-11-06.csv" }).click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function MetrixDashboardDemo() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [root, setRoot] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div ref={setRoot} className={`mx-root ${mxFontClass} min-h-screen`}>
      <PortalContainerProvider value={root}>
        <TooltipProvider>
          <div className="flex min-h-screen bg-mx-bg">
            <Sidebar open={menuOpen} onNavigate={() => setMenuOpen(false)} />
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  className="fixed inset-0 z-30 bg-black/50 backdrop-blur-[2px] xl:hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setMenuOpen(false)}
                />
              )}
            </AnimatePresence>
            <div className="flex min-w-0 flex-1 flex-col">
              <TopBar onMenu={() => setMenuOpen(true)} />
              <main className="flex flex-col px-4 pb-[21px] pt-[20px] sm:px-5">
                <PageHeader onExport={exportCsv} />
                <div className="mt-[12px]">
                  <KpiCards />
                </div>
                <div className="mt-[9px] grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,782fr)_minmax(320px,356fr)]">
                  <SalesTrend />
                  <RevenueBreakdown />
                </div>
                <div className="mt-[12px]">
                  <TransactionsTable />
                </div>
              </main>
            </div>
          </div>
        </TooltipProvider>
      </PortalContainerProvider>
    </div>
  );
}
