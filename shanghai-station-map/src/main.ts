import "./style.css";
import { initMap } from "./map/init.ts";

const map = initMap("map");

// 调试用：把 map 挂到 window，方便在控制台调色
declare global {
  interface Window {
    map: typeof map;
  }
}
window.map = map;
