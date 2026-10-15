"use client";

import { createContext, useContext } from "react";

/**
 * Radix 的 Portal 默认挂到 document.body，会脱离 `.mx-root`（字体变量、color-scheme）。
 * 这里把根节点通过 context 传下去，让下拉菜单 / Tooltip 仍然渲染在页面作用域内。
 */
const PortalContainerContext = createContext<HTMLElement | null>(null);

export const PortalContainerProvider = PortalContainerContext.Provider;
export const usePortalContainer = () => useContext(PortalContainerContext);
