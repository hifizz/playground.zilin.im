"use client";

// 交互状态容器：hover 与 pinned 是图纸、零件表、构建顺序、分包表、详情面板共享的唯一状态。
import { useCallback, useEffect, useState } from "react";
import type { ModuleId } from "./data/module-info";
import { MODULE_IDS } from "./data/module-info";
import BomList from "./components/bom-list";
import BuildOrder from "./components/build-order";
import DetailPanel from "./components/detail-panel";
import PackagesTable from "./components/packages-table";
import Stage from "./components/stage";

export default function HarnessApp() {
  const [hoverId, setHoverId] = useState<ModuleId | null>(null);
  const [pinnedId, setPinnedId] = useState<ModuleId | null>(null);
  const active = hoverId ?? pinnedId;

  const pin = useCallback((id: ModuleId) => {
    setPinnedId(id);
    setHoverId(null);
  }, []);
  const unpin = useCallback(() => setPinnedId(null), []);

  // 构建顺序 / 分包表点击后先把图纸滚进视野再钉选。
  const pinAndScroll = useCallback(
    (id: ModuleId) => {
      pin(id);
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      document.getElementById("drawing")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    },
    [pin],
  );

  const prev = useCallback((id: ModuleId) => {
    const i = MODULE_IDS.indexOf(id);
    if (i > 0) pin(MODULE_IDS[i - 1]);
  }, [pin]);
  const next = useCallback((id: ModuleId) => {
    const i = MODULE_IDS.indexOf(id);
    if (i < MODULE_IDS.length - 1) pin(MODULE_IDS[i + 1]);
  }, [pin]);

  useEffect(() => {
    if (!pinnedId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") unpin();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [pinnedId, unpin]);

  return (
    <>
      <section className="x-stage" id="drawing" aria-label="Agent Harness 爆炸图">
        <Stage active={active} pinnedId={pinnedId} onHover={setHoverId} onPin={pin} onUnpin={unpin} />
        <BomList active={active} pinned={pinnedId} onHover={setHoverId} onPin={pin} />
      </section>
      <BuildOrder active={active} pinned={pinnedId} onHover={setHoverId} onSelect={pinAndScroll} />
      <PackagesTable active={active} pinned={pinnedId} onHover={setHoverId} onSelect={pinAndScroll} />
      <DetailPanel pinnedId={pinnedId} onClose={unpin} onPrev={prev} onNext={next} />
    </>
  );
}
