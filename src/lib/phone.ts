/**
 * 北美手机号（+1）。用户可以输入 “416 555 0101”“(416) 555-0101”“+1 416-555-0101” 等写法。
 * 登录系统里存的是不带 + 的 “14165550101”。
 */

/** 转成 +1XXXXXXXXXX；不是有效的北美号码时返回 null */
export function normalizeNanpPhone(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  if (digits.length !== 10) return null;
  // 区号和局号都不能以 0 或 1 开头
  if (/^[01]/.test(digits) || /^[01]/.test(digits.slice(3))) return null;
  return `+1${digits}`;
}

/** 显示成 +1 416-555-0101 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
  if (digits.length !== 10) return phone;
  return `+1 ${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/** 部分隐藏：+1 416-•••-0101 */
export function maskPhone(phone: string | null | undefined): string {
  const formatted = formatPhone(phone);
  return formatted.replace(/^(\+1 \d{3}-)\d{3}(-\d{4})$/, "$1•••$2");
}
