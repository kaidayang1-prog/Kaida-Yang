/** 金额：整数分 → "$1.69"（加元，中英文界面都用 $ 符号） */
export function formatCents(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  return `${sign}$${(Math.abs(Math.round(cents)) / 100).toFixed(2)}`;
}

/** 精确金额（分，可能有小数）→ "$1.6975"，用来展示计算过程 */
export function formatExactCents(cents: number, digits = 4): string {
  return `$${(cents / 100).toFixed(digits)}`;
}

/** 公里数 → "8.5"（最多两位小数，去掉末尾的 0） */
export function formatKm(km: number): string {
  return String(Number(km.toFixed(2)));
}
