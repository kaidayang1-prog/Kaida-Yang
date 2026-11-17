import { execSync } from "node:child_process";

/** 从本地 Supabase 读取地址和密钥，给测试里的清理工具用（只在本机测试时用，不进前端） */
export default function globalSetup() {
  let status: Record<string, string>;
  try {
    status = JSON.parse(execSync("npx supabase status -o json", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }));
  } catch {
    throw new Error("本地 Supabase 没有运行。先运行 `npx supabase start`，再跑 `npm run e2e`。");
  }
  process.env.E2E_SUPABASE_URL = status.API_URL;
  process.env.E2E_SERVICE_ROLE_KEY = status.SERVICE_ROLE_KEY;
  process.env.E2E_MAILPIT_URL = status.MAILPIT_URL ?? status.INBUCKET_URL;
}
