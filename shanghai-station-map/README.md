# 上海站 · Fill In the Blank

MapLibre GL JS + Protomaps 做的全屏深色极简城市地图 landing page。黑白灰底图 + 中心一束发光铁轨汇聚到上海站，上面叠一层衬线排版。全程无需 API key、无需服务端。

## 技术栈

- Vite + TypeScript（无框架，保持轻量）
- MapLibre GL JS（开源，无 token）
- Protomaps `.pmtiles` 单文件底图，客户端 `pmtiles://` 协议直读
- Tailwind CSS v4 做排版

## 运行

```bash
npm install
npm run dev      # http://localhost:5183
```

底图数据文件 `public/shanghai.pmtiles` 需要存在（见下）。

## 底图数据：下载并放置 shanghai.pmtiles

底图用 Protomaps 的基础 basemap 矢量瓦片，schema 见 https://docs.protomaps.com/basemaps/layers 。
我们只截取上海站周边一小块区域到本地单文件，避免整颗星球的体积。

> ⚠️ Protomaps 的 demo bucket（`demo-bucket.protomaps.com`）**没有开放 CORS**，
> 不能在浏览器里直接跨域读。所以必须把区域切片下载到本地 `public/` 目录（同源）。

### 方式一：从 demo bucket 截取（最省事，本仓库就是这么生成的）

1. 装 `pmtiles` CLI（go-pmtiles）：从 https://github.com/protomaps/go-pmtiles/releases
   下载对应平台的二进制（如 macOS arm64: `go-pmtiles-x.y.z_Darwin_arm64.zip`），解压得到 `pmtiles`。
2. 截取上海站周边 bbox（`minLon,minLat,maxLon,maxLat`）到 `public/`：

```bash
pmtiles extract "https://demo-bucket.protomaps.com/v4.pmtiles" \
  public/shanghai.pmtiles \
  --bbox=121.30,31.15,121.60,31.35 \
  --maxzoom=15
```

得到约 13 MB 的 `public/shanghai.pmtiles`。CLI 在服务端做 HTTP Range 请求，不受 CORS 限制。

### 方式二：从每日 planet build 截取（数据更新）

demo bucket 更新不频繁。要最新数据，从 Protomaps 每日构建截取（需自行确认可用日期）：

```bash
pmtiles extract "https://build.protomaps.com/<YYYYMMDD>.pmtiles" \
  public/shanghai.pmtiles \
  --bbox=121.30,31.15,121.60,31.35 --maxzoom=15
```

或参考官方文档用自己的 API key 生成：https://docs.protomaps.com/pmtiles/create

### 换数据源

默认读 `public/shanghai.pmtiles`。想换成自建 CDN 上的文件，在项目根建 `.env`：

```
VITE_PMTILES_URL=pmtiles://https://your-cdn.com/shanghai.pmtiles
```

（自建 CDN 记得开 CORS，允许 `GET` + `Range`。）

## 调色

底图 style 全部抽在 `src/map/style.ts`：

- 顶部 `palette` 对象集中管理所有颜色，改这里即可全局调色。
- `buildStyle(pmtilesUrl)` 返回完整 MapLibre StyleSpecification。
- 铁轨辉光单独在 `src/map/railway.ts`（多层 line-blur 叠加）。

地图初始化（中心 / zoom / bearing / 交互开关）在 `src/map/init.ts`。

## 项目结构

```
src/
├── main.ts            # 入口：初始化地图 + 叠排版
├── style.css          # Tailwind + 全屏地图容器样式
└── map/
    ├── init.ts        # MapLibre 初始化 + pmtiles 协议
    ├── style.ts       # 深色底图 style（palette 在顶部）
    └── railway.ts     # 发光铁轨图层（step 2）
public/
└── shanghai.pmtiles   # 底图数据（不入库，需自行下载）
```
