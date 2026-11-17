// 把本地 Supabase 的地址和 anon key 写进 .env.local（先运行 npm run db:start）
// 用法：npm run env:local
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

let status;
try {
  status = JSON.parse(execSync("npx supabase status -o json", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }));
} catch {
  console.error("本地 Supabase 没有运行。先运行 npm run db:start。");
  process.exit(1);
}

const source = existsSync(".env.local") ? ".env.local" : ".env.example";
let text = readFileSync(source, "utf8");

function set(key, value) {
  const pattern = new RegExp(`^${key}=.*$`, "m");
  text = pattern.test(text) ? text.replace(pattern, `${key}=${value}`) : `${text.trimEnd()}\n${key}=${value}\n`;
}

set("NEXT_PUBLIC_SUPABASE_URL", status.API_URL);
set("NEXT_PUBLIC_SUPABASE_ANON_KEY", status.ANON_KEY);
writeFileSync(".env.local", text);
console.log("已写入 .env.local（本地 Supabase 地址和 anon key）。现在可以运行 npm run dev。");
