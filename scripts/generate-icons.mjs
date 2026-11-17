// 生成 PWA 图标（PNG）。图形和 src/components/AppMark.tsx 一致。
// 用法：node scripts/generate-icons.mjs（需要 Playwright 和 Chromium：npx playwright install chromium）
import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";

// 用 require 加载，这样全局安装的 Playwright（设置 NODE_PATH）也能用
const { chromium } = createRequire(import.meta.url)("playwright");

const ACCENT = "#C2410C";
const WHITE = "#FFFFFF";

const glyph = (color, cutout) => `
  <polyline points="120,214 256,118 392,214" fill="none" stroke="${color}" stroke-width="30" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M176 302 L206 252 Q214 240 228 240 H284 Q298 240 306 252 L336 302 Z" fill="${color}"/>
  <path d="M112 326 Q112 302 136 302 H376 Q400 302 400 326 V358 Q400 372 386 372 H126 Q112 372 112 358 Z" fill="${color}"/>
  <path d="M214 296 L230 266 Q234 260 241 260 H252 V296 Z" fill="${cutout}"/>
  <path d="M260 296 V260 H271 Q278 260 282 266 L298 296 Z" fill="${cutout}"/>
  <circle cx="176" cy="374" r="34" fill="${color}"/>
  <circle cx="336" cy="374" r="34" fill="${color}"/>
  <circle cx="176" cy="374" r="13" fill="${cutout}"/>
  <circle cx="336" cy="374" r="13" fill="${cutout}"/>`;

const svg = ({ rounded, background = true, mono = false }) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  ${background ? `<rect width="512" height="512" rx="${rounded ? 112 : 0}" fill="${ACCENT}"/>` : ""}
  ${mono ? glyph(WHITE, "transparent") : glyph(WHITE, ACCENT)}
</svg>`;

const outputs = [
  { file: "public/icons/icon-192.png", size: 192, svg: svg({ rounded: true }) },
  { file: "public/icons/icon-512.png", size: 512, svg: svg({ rounded: true }) },
  { file: "public/icons/icon-maskable-512.png", size: 512, svg: svg({ rounded: false }) },
  { file: "public/icons/badge-96.png", size: 96, svg: svg({ rounded: false, background: false, mono: true }) },
  { file: "src/app/icon.png", size: 96, svg: svg({ rounded: true }) },
  { file: "src/app/apple-icon.png", size: 180, svg: svg({ rounded: false }) },
];

await mkdir("public/icons", { recursive: true });
await writeFile("public/icons/icon.svg", svg({ rounded: true }).trim() + "\n");

const browser = await chromium.launch();
try {
  for (const output of outputs) {
    const page = await browser.newPage({ viewport: { width: output.size, height: output.size }, deviceScaleFactor: 1 });
    await page.setContent(
      `<html><body style="margin:0;background:transparent">${output.svg}</body></html>`,
    );
    await page.screenshot({ path: output.file, omitBackground: true, clip: { x: 0, y: 0, width: output.size, height: output.size } });
    await page.close();
    console.log("wrote", output.file);
  }
} finally {
  await browser.close();
}
