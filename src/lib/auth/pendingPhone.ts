/** 登录时输入的手机号，在“输入验证码”页面用；只存在这次打开的页面里，不放进网址 */
const KEY = "carpool.pendingPhone";

export const pendingPhone = {
  get(): string | null {
    try {
      return window.sessionStorage.getItem(KEY);
    } catch {
      return null;
    }
  },
  set(phone: string) {
    try {
      window.sessionStorage.setItem(KEY, phone);
    } catch {
      // 存不了时，验证码页面会让用户重新输入手机号
    }
  },
  clear() {
    try {
      window.sessionStorage.removeItem(KEY);
    } catch {
      // 忽略
    }
  },
};
