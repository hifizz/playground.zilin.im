import maplibregl from "maplibre-gl";
import { Protocol } from "pmtiles";
import { buildStyle } from "./style.ts";

/** 上海站中心点 */
export const SHANGHAI_STATION: [number, number] = [121.455, 31.2497];

/**
 * pmtiles 数据源地址。
 * - 默认读 public/shanghai.pmtiles（同源，无 CORS 问题）。见 README 的下载说明。
 * - 想临时换源（如自建 CDN）时设置 .env 里的 VITE_PMTILES_URL，
 *   例如 VITE_PMTILES_URL=pmtiles://https://your-cdn.com/shanghai.pmtiles
 * 注意：Protomaps demo bucket 未开放 CORS，不能直接在浏览器里跨域读，故本地化。
 */
const PMTILES_URL =
  import.meta.env.VITE_PMTILES_URL ?? "pmtiles:///shanghai.pmtiles";

export function initMap(container: string | HTMLElement): maplibregl.Map {
  // 注册 pmtiles 协议（客户端直接读单文件，无需服务端 / API key）
  const protocol = new Protocol();
  maplibregl.addProtocol("pmtiles", protocol.tile);

  const map = new maplibregl.Map({
    container,
    style: buildStyle(PMTILES_URL),
    center: SHANGHAI_STATION,
    zoom: 13,
    bearing: -15,
    pitch: 0,
    attributionControl: { compact: true },
    // 保留 hover / 拖拽，但去掉旋转干扰，保持构图稳定
    dragRotate: false,
    pitchWithRotate: false,
  });

  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");

  return map;
}
