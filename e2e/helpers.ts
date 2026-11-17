import { expect, type Page } from "@playwright/test";

const api = () => process.env.E2E_SUPABASE_URL!;
const serviceKey = () => process.env.E2E_SERVICE_ROLE_KEY!;

function adminHeaders() {
  return { apikey: serviceKey(), Authorization: `Bearer ${serviceKey()}`, "Content-Type": "application/json" };
}

interface AdminUser {
  id: string;
  phone?: string;
}

/** 删除某个手机号的测试账号（让测试可以重复跑） */
export async function deleteUserByPhone(phoneDigits: string) {
  const response = await fetch(`${api()}/auth/v1/admin/users?per_page=1000`, { headers: adminHeaders() });
  const { users } = (await response.json()) as { users: AdminUser[] };
  for (const user of users.filter((u) => u.phone === phoneDigits)) {
    await fetch(`${api()}/auth/v1/admin/users/${user.id}`, { method: "DELETE", headers: adminHeaders() });
  }
}

export async function userExists(phoneDigits: string): Promise<boolean> {
  const response = await fetch(`${api()}/auth/v1/admin/users?per_page=1000`, { headers: adminHeaders() });
  const { users } = (await response.json()) as { users: AdminUser[] };
  return users.some((u) => u.phone === phoneDigits);
}

/** 直接改测试账号的资料（用管理权限，绕过前端），比如把语言恢复成中文 */
export async function patchProfile(userId: string, patch: Record<string, unknown>) {
  await fetch(`${api()}/rest/v1/profiles?id=eq.${userId}`, {
    method: "PATCH",
    headers: { ...adminHeaders(), Prefer: "return=minimal" },
    body: JSON.stringify(patch),
  });
}

/** 用测试号码登录（验证码固定 123456），停在验证码通过后的下一页 */
export async function loginWithPhone(page: Page, phone: string) {
  await page.goto("/login/");
  await page.getByLabel("手机号").fill(phone);
  await page.getByRole("button", { name: "获取验证码" }).click();
  await expect(page).toHaveURL(/\/login\/verify\/$/);
  await page.getByLabel("6 位验证码").fill("123456");
}

/** 从本地邮件测试服务（Mailpit）里取最新一封发给某个邮箱的验证码 */
export async function latestEmailCode(to: string): Promise<string> {
  const mailpit = process.env.E2E_MAILPIT_URL!;
  for (let attempt = 0; attempt < 20; attempt++) {
    const search = await fetch(`${mailpit}/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`);
    const { messages } = (await search.json()) as { messages: { ID: string }[] };
    if (messages.length > 0) {
      const message = await fetch(`${mailpit}/api/v1/message/${messages[0].ID}`);
      const { Text, HTML } = (await message.json()) as { Text: string; HTML: string };
      const code = `${Text} ${HTML}`.match(/\b(\d{6})\b/);
      if (code) return code[1];
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`no email code for ${to}`);
}
