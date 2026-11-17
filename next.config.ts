import { readFileSync } from "node:fs";
import type { NextConfig } from "next";

const { version } = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")) as {
  version: string;
};

/**
 * 整个应用静态导出（out/ 目录）：
 *  - 网站：部署到 Vercel，直接托管 out/。
 *  - APP：以后用 Capacitor 把同一个 out/ 打包成 iOS / 安卓。
 * 所以这里不用服务端功能（Server Actions、Proxy、Cache Components、动态路由参数等），
 * 数据都在手机端通过 Supabase 读写，权限由数据库 RLS 保证。
 */
const nextConfig: NextConfig = {
  output: "export",
  // /home -> /home/index.html，静态托管和 Capacitor 本地加载都更稳
  trailingSlash: true,
  // 静态导出不能用默认的图片优化服务
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_APP_VERSION: version },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
