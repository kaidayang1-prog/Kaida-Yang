import { expect, test } from "@playwright/test";
import { deleteUserByPhone, latestEmailCode, loginWithPhone, patchProfile, userExists } from "./helpers";

const AMY_ID = "00000000-0000-4000-8000-000000000103";

// M1：手机号登录、注册引导、加入社区、语言同步、删除账号

test("没登录时打开首页会回到介绍页", async ({ page }) => {
  await page.goto("/home/");
  await expect(page).toHaveURL(/\/welcome\/$/);
  await expect(page.getByRole("heading", { name: "邻居拼车，一起去买菜" })).toBeVisible();
});

test("手机号格式不对时提示", async ({ page }) => {
  await page.goto("/login/");
  await page.getByLabel("手机号").fill("555 0101");
  await page.getByRole("button", { name: "获取验证码" }).click();
  await expect(page.getByText("请输入 10 位加拿大或美国手机号。")).toBeVisible();
});

test("验证码错误时提示", async ({ page }) => {
  await page.goto("/login/");
  await page.getByLabel("手机号").fill("416 555 0104");
  await page.getByRole("button", { name: "获取验证码" }).click();
  await page.getByLabel("6 位验证码").fill("000000");
  await expect(page.getByText("验证码不对或已经过期")).toBeVisible();
});

test("新用户：登录 → 引导 → 用住址加入小区 → 完成 → 删除账号", async ({ page }) => {
  await deleteUserByPhone("14165550110");
  await loginWithPhone(page, "416 555 0110");

  // 第 1 步：昵称
  await expect(page).toHaveURL(/\/onboarding\/$/);
  await page.getByLabel("昵称").fill("测试新人");
  await page.getByRole("button", { name: "下一步" }).click();

  // 第 2 步：主要身份
  await page.getByRole("radio", { name: /我主要开车/ }).click();
  await page.getByRole("button", { name: "下一步" }).click();

  // 第 3 步：用住址加入小区
  await page.getByLabel("住址（输入路口或街道）").fill("yonge park home");
  await page.getByRole("button", { name: "Yonge St & Park Home Ave, North York" }).click();
  await expect(page.getByText("北约克中心")).toBeVisible();
  await page.getByRole("button", { name: "加入", exact: true }).click();
  await expect(page.getByText("已加入")).toBeVisible();
  await page.getByRole("button", { name: "下一步" }).click();

  // 完成
  await expect(page.getByRole("heading", { name: "设置好了" })).toBeVisible();
  await page.getByRole("button", { name: "进入拼车购物" }).click();
  await expect(page).toHaveURL(/\/home\/$/);
  // 主要身份是车主，首页显示车主内容
  await expect(page.getByRole("heading", { name: "我的班次" })).toBeVisible();

  // “我的”：昵称、认证等级、社区
  await page.getByRole("link", { name: "我的" }).click();
  await expect(page.getByText("测试新人")).toBeVisible();
  await expect(page.getByText("邻居级")).toBeVisible();
  await expect(page.getByText("北约克中心")).toBeVisible();
  await expect(page.getByText("住址验证")).toBeVisible();

  // 删除账号
  await page.getByRole("button", { name: "删除账号" }).click();
  await page.getByRole("button", { name: "确认删除" }).click();
  await expect(page).toHaveURL(/\/welcome\/$/);
  expect(await userExists("14165550110")).toBe(false);
});

test("新用户：住址附近没有小区时可以申请开通，也可以先跳过", async ({ page }) => {
  await deleteUserByPhone("14165550112");
  await loginWithPhone(page, "416 555 0112");
  await page.getByLabel("昵称").fill("Bayview 邻居");
  await page.getByRole("button", { name: "下一步" }).click();
  await page.getByRole("button", { name: "下一步" }).click();

  await page.getByLabel("住址（输入路口或街道）").fill("bayview sheppard");
  await page.getByRole("button", { name: "Bayview Ave & Sheppard Ave, North York" }).click();
  await expect(page.getByText("附近还没有开通的小区")).toBeVisible();
  await page.getByLabel("楼名或路口").fill("Bayview & Sheppard 的公寓");
  await page.getByRole("button", { name: "申请开通" }).click();
  await expect(page.getByText("收到了，开通后会通知你。")).toBeVisible();

  await page.getByRole("button", { name: "以后再说" }).click();
  await expect(page.getByText("你还没有加入小区或学校")).toBeVisible();
  await page.getByRole("button", { name: "进入拼车购物" }).click();
  await expect(page).toHaveURL(/\/home\/$/);
  await page.getByRole("link", { name: "我的" }).click();
  await expect(page.getByText("手机号已验证")).toBeVisible();

  await deleteUserByPhone("14165550112");
});

test("新用户：用学校邮箱验证后自动加入学校", async ({ page }) => {
  await deleteUserByPhone("14165550111");
  const email = `e2e-${Date.now()}@mail.utoronto.ca`;
  await loginWithPhone(page, "416 555 0111");
  await page.getByLabel("昵称").fill("学生");
  await page.getByRole("button", { name: "下一步" }).click();
  await page.getByRole("button", { name: "下一步" }).click();

  await page.getByRole("radio", { name: "用学校邮箱" }).click();
  await page.getByLabel("学校邮箱").fill(email);
  await page.getByRole("button", { name: "发送验证码" }).click();
  await expect(page.getByText(`验证码已发到 ${email}`)).toBeVisible();
  await page.getByLabel("邮箱里的 6 位验证码").fill(await latestEmailCode(email));
  await page.getByRole("button", { name: "验证" }).click();
  await expect(page.getByText("已验证，加入了多伦多大学。")).toBeVisible();

  await page.getByRole("button", { name: "下一步" }).click();
  await page.getByRole("button", { name: "进入拼车购物" }).click();
  await page.getByRole("link", { name: "我的" }).click();
  await expect(page.getByText("多伦多大学")).toBeVisible();
  await expect(page.getByText("学校邮箱验证")).toBeVisible();

  await deleteUserByPhone("14165550111");
});

test("已有用户 Amy：直接进首页；切换语言会保存到资料，重新打开还是英文", async ({ page }) => {
  await patchProfile(AMY_ID, { locale: "zh" });
  await loginWithPhone(page, "416 555 0103");
  await expect(page).toHaveURL(/\/home\/$/);
  await page.getByRole("link", { name: "我的" }).click();
  await expect(page.getByText("Amy", { exact: true })).toBeVisible();
  await expect(page.getByText("北约克中心")).toBeVisible();

  await page.getByRole("radio", { name: "English" }).click();
  await expect(page.getByRole("heading", { name: "Me", exact: true })).toBeVisible();
  // 清掉本机保存的语言，确认是从用户资料里读回来的
  await page.evaluate(() => window.localStorage.removeItem("carpool.locale"));
  await page.reload();
  await expect(page.getByRole("heading", { name: "Me", exact: true })).toBeVisible();

  // 恢复中文，并退出登录
  await page.getByRole("radio", { name: "中文" }).click();
  await expect(page.getByRole("heading", { name: "我的", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "退出登录" }).click();
  await expect(page).toHaveURL(/\/welcome\/$/);
});
