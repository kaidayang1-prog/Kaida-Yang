import type { MetadataRoute } from "next";
import { zh } from "@/i18n/zh";

// 静态导出时生成 /manifest.webmanifest
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: zh.app.fullName,
    short_name: zh.app.name,
    description: zh.app.description,
    lang: "zh-CN",
    start_url: "/home/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fffaf5",
    theme_color: "#fffaf5",
    categories: ["travel", "shopping", "social"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
