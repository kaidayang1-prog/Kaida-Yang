import { defineConfig, devices } from "@playwright/test";

/**
 * 端到端测试：在真实的本地 Supabase 上跑完整流程（登录、注册引导、加入社区……）。
 * 运行前：supabase start，并把 .env.local 配好（见 README）。
 *   npm run e2e
 */
export default defineConfig({
  testDir: "./e2e",
  // 测试共用一个本地数据库，按顺序跑
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [["list"]],
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: "http://localhost:3000",
    trace: "off",
    locale: "zh-CN",
    timezoneId: "America/Toronto",
  },
  projects: [{ name: "mobile", use: { ...devices["iPhone 13"], browserName: "chromium" } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000/welcome/",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
