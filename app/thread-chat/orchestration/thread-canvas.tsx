"use client";
/**
 * orchestration/thread-canvas —— 画布视图层（与 thread-columns 平级的第二个编排层）。
 *
 * Phase 1 只读画布：React Flow 容器 + 节点/边装配 + pan/zoom/fitView + MiniMap/Controls。
 * 会话树归 core store（经 useThreadStore 以 version 驱动重派生）；坐标/pin 等视口
 * 状态归 use-canvas-layout。画布内不发生分支/发消息——双击节点走壳层统一意图
 * openBranchUI 回列模式深读（onOpenThread）。
 *
 * 本文件经 next/dynamic({ ssr:false }) 懒加载：React Flow 及其样式只在进入画布
 * 模式时才落地（首屏与列模式不背这份体积；RF 也依赖 DOM，天然需要跳过 SSR）。
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type FitViewOptions,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { RotateCcw } from "lucide-react";
import type { ThreadStore } from "../core/store";
import { useThreadStore } from "../core/use-thread-store";
import { dc } from "../theme";
import { CanvasActionsContext, CanvasCard, type CanvasActions, type CanvasCardNode } from "./canvas-node";
import { useCanvasLayout, type CanvasViewState } from "./use-canvas-layout";

/** nodeTypes 稳定引用：模块级定义，避免 React Flow 整树重挂（skill 契约 #4） */
const nodeTypes = { threadCard: CanvasCard };

const fitViewOptions: FitViewOptions = { padding: 0.18, maxZoom: 1 };

/** MiniMap 节点深度色走 .fc-N 类 + CSS fill（SVG 的 fill 属性不解析 var()，只能经 CSS） */
const minimapNodeClass = (n: CanvasCardNode) =>
  n.data.depth > 0 ? `fc-${dc(n.data.depth)}` : "";

export interface ThreadCanvasProps {
  store: ThreadStore;
  /** 主线卡的主题副标题（与列模式主线副标题同源） */
  mainSubtitle?: string;
  /** 画布视图状态宿主（pin 表跨「列 ⇄ 画布」切换存活），壳层持有的稳定对象 */
  viewState: CanvasViewState;
  /** 统一意图：双击节点 = 回列模式打开该会话（壳层 openBranchUI） */
  onOpenThread: (threadId: string) => void;
  /** 画布内 fork 出的新会话：居中并展开它（n 递增去重，壳层每次 fork 置新值） */
  focusNode?: { id: string; n: number } | null;
}

function CanvasFlow({ store, mainSubtitle, viewState, onOpenThread, focusNode }: ThreadCanvasProps) {
  const version = useThreadStore(store);
  const { nodes, edges, onNodesChange, resetLayout, selectNode, pinCount } = useCanvasLayout({
    store,
    version,
    mainSubtitle,
    viewState,
  });
  const { fitView, setCenter, getZoom } = useReactFlow();

  /* 节点内对话动作直达 store（context 穿过 React Flow 到自定义节点） */
  const actions = useMemo<CanvasActions>(
    () => ({ send: store.send, retry: store.retryReply }),
    [store],
  );

  /* 画布内 fork：新节点入树后居中 + 展开（ref 去重——effect 依赖含 nodes，
     每个 version 都会跑，只有未处理过的 focusNode.n 才触发视口动画） */
  const handledFocus = useRef(0);
  useEffect(() => {
    if (!focusNode || focusNode.n === handledFocus.current) return;
    const node = nodes.find((x) => x.id === focusNode.id);
    if (!node) return;
    handledFocus.current = focusNode.n;
    selectNode(focusNode.id);
    const w = node.initialWidth ?? 280;
    const h = node.initialHeight ?? 120;
    void setCenter(node.position.x + w / 2, node.position.y + h / 2 + 120, {
      zoom: Math.max(getZoom(), 0.85),
      duration: 320,
    });
  }, [focusNode, nodes, selectNode, setCenter, getZoom]);

  /* 重新排列：清 pin → 全量 dagre 重排；坐标 commit 之后再 fitView 动画跟上 */
  const [relayoutN, setRelayoutN] = useState(0);
  const onRelayout = () => {
    resetLayout();
    setRelayoutN((n) => n + 1);
  };
  useEffect(() => {
    if (relayoutN > 0) void fitView({ ...fitViewOptions, duration: 320 });
  }, [relayoutN, fitView]);

  const onNodeDoubleClick = useCallback<NodeMouseHandler<CanvasCardNode>>(
    (_, node) => onOpenThread(node.id),
    [onOpenThread],
  );

  return (
    /* React Flow 父容器必须有确定宽高：flex:1 + min-height:0 + width:100%（skill 契约 #3） */
    <div className="canvas-wrap">
      <CanvasActionsContext.Provider value={actions}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onNodeDoubleClick={onNodeDoubleClick}
        fitView
        fitViewOptions={fitViewOptions}
        minZoom={0.2}
        maxZoom={1.75}
        nodesConnectable={false}
        deleteKeyCode={null}
        zoomOnDoubleClick={false}
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1.4} />
        <Controls position="bottom-left" showInteractive={false} />
        <MiniMap<CanvasCardNode>
          pannable
          zoomable
          nodeClassName={minimapNodeClass}
          maskColor="rgba(245, 242, 234, 0.75)"
        />
        <Panel position="top-left" className="canvas-panel">
          <button
            className="cbtn"
            title="清除手动固定的节点位置，重新自动布局并适配视口"
            onClick={onRelayout}
          >
            <RotateCcw size={11} style={{ verticalAlign: "-1px", marginRight: 4 }} />
            重新排列{pinCount > 0 ? ` · 已固定 ${pinCount}` : ""}
          </button>
          <span className="canvas-tip">
            单击节点就地对话（可划选开分支）· 拖动固定位置 · 双击回列模式
          </span>
        </Panel>
      </ReactFlow>
      </CanvasActionsContext.Provider>
    </div>
  );
}

export function ThreadCanvas(props: ThreadCanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasFlow {...props} />
    </ReactFlowProvider>
  );
}
