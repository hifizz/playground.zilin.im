import type { StyleSpecification } from "maplibre-gl";

/**
 * 深色极简底图配色（黑白灰 + 一点红）
 * 唯一彩色点缀 accent 只用于排版，不用于地图本身。
 * 想调色时改这里即可。
 */
export const palette = {
  background: "#0a0a0a",
  water: "#141414",
  building: "#1a1a1a",
  buildingOutline: "#262626",
  road: {
    highway: "#ffffff", // kind=highway → 高速 / 主干（motorway/trunk）
    major: "#888888", // kind=major_road → 主要道路（primary/secondary/tertiary）
    minor: "#3a3a3a", // kind=minor_road/other/path → 支路 / 服务路 / 步道
  },
  boundary: "#4a4a4a",
  label: "#4a4a4a",
  labelHalo: "#0a0a0a",
  // 铁轨辉光在 railway.ts 里单独处理
  rail: "#5a5a5a",
  accent: "#e63946",
} as const;

const GLYPHS =
  "https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf";

const SOURCE_ID = "protomaps";

/**
 * 构建深色底图 style。
 * @param pmtilesUrl 形如 `pmtiles://https://.../x.pmtiles`（远程范围请求）
 *                   或 `pmtiles:///shanghai.pmtiles`（public 目录本地文件）
 */
export function buildStyle(pmtilesUrl: string): StyleSpecification {
  return {
    version: 8,
    glyphs: GLYPHS,
    sources: {
      [SOURCE_ID]: {
        type: "vector",
        url: pmtilesUrl,
        attribution:
          "<a href='https://openstreetmap.org/copyright'>© OpenStreetMap</a> · <a href='https://protomaps.com'>Protomaps</a>",
      },
    },
    layers: [
      // ---- 背景 & 陆地 ----
      {
        id: "background",
        type: "background",
        paint: { "background-color": palette.background },
      },
      {
        id: "earth",
        type: "fill",
        source: SOURCE_ID,
        "source-layer": "earth",
        paint: { "fill-color": palette.background },
      },

      // ---- 水系 ----
      {
        id: "water",
        type: "fill",
        source: SOURCE_ID,
        "source-layer": "water",
        paint: { "fill-color": palette.water },
      },
      {
        id: "water-lines",
        type: "line",
        source: SOURCE_ID,
        "source-layer": "water",
        filter: ["in", "kind", "river", "stream", "canal"],
        paint: {
          "line-color": palette.water,
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            10,
            0.4,
            16,
            2,
          ],
        },
      },

      // ---- 建筑 ----
      {
        id: "buildings",
        type: "fill",
        source: SOURCE_ID,
        "source-layer": "buildings",
        minzoom: 13,
        paint: {
          "fill-color": palette.building,
          "fill-opacity": ["interpolate", ["linear"], ["zoom"], 13, 0, 14, 1],
          "fill-outline-color": palette.buildingOutline,
        },
      },

      // ---- 道路（由细到粗依次叠放）----
      {
        id: "roads-minor",
        type: "line",
        source: SOURCE_ID,
        "source-layer": "roads",
        filter: ["in", "kind", "minor_road", "other", "path"],
        minzoom: 12,
        paint: {
          "line-color": palette.road.minor,
          "line-width": ["interpolate", ["linear"], ["zoom"], 12, 0.3, 18, 3],
        },
      },
      {
        id: "roads-major",
        type: "line",
        source: SOURCE_ID,
        "source-layer": "roads",
        filter: ["==", "kind", "major_road"],
        paint: {
          "line-color": palette.road.major,
          "line-width": ["interpolate", ["linear"], ["zoom"], 8, 0.6, 18, 7],
        },
      },
      {
        id: "roads-highway",
        type: "line",
        source: SOURCE_ID,
        "source-layer": "roads",
        filter: ["==", "kind", "highway"],
        paint: {
          "line-color": palette.road.highway,
          "line-width": ["interpolate", ["linear"], ["zoom"], 6, 0.6, 13, 2, 18, 9],
          "line-opacity": 0.9,
        },
      },

      // ---- 铁轨（step 1 先用朴素线确认数据存在，step 2 换成辉光）----
      {
        id: "railway",
        type: "line",
        source: SOURCE_ID,
        "source-layer": "roads",
        filter: ["==", "kind", "rail"],
        paint: {
          "line-color": palette.rail,
          "line-width": ["interpolate", ["linear"], ["zoom"], 8, 0.4, 18, 4],
        },
      },

      // ---- 行政边界 ----
      {
        id: "boundaries",
        type: "line",
        source: SOURCE_ID,
        "source-layer": "boundaries",
        paint: {
          "line-color": palette.boundary,
          "line-width": 0.5,
          "line-dasharray": [3, 2],
          "line-opacity": 0.6,
        },
      },

      // ---- 注记 ----
      {
        id: "labels-place",
        type: "symbol",
        source: SOURCE_ID,
        "source-layer": "places",
        filter: ["in", "kind", "locality", "region", "neighbourhood"],
        layout: {
          "text-field": ["coalesce", ["get", "name:zh"], ["get", "name"]],
          "text-font": ["Noto Sans Regular"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 10, 10, 16, 14],
          "text-letter-spacing": 0.1,
          "text-max-width": 6,
        },
        paint: {
          "text-color": palette.label,
          "text-halo-color": palette.labelHalo,
          "text-halo-width": 1,
        },
      },
    ],
  };
}

export { SOURCE_ID };
