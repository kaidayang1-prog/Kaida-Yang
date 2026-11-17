/**
 * 最大余数法（Hamilton 法）取整。
 *
 * 每个人的精确金额用 分子 / 公共分母 表示（都是整数，用 BigInt 避免浮点误差）。
 * 先每人取整数部分，再把差的几分按余数从大到小各补 1 分；余数相同时按 id 的字符顺序，结果稳定可复现。
 * 数据库里的结算函数用同样的排序规则（id 按 "C" 排序规则比较），两边结果一致。
 */
export function allocateLargestRemainder(
  numerators: ReadonlyMap<string, bigint>,
  denominator: bigint,
  total: bigint,
): Map<string, bigint> {
  if (denominator <= 0n) throw new RangeError("denominator must be positive");

  const result = new Map<string, bigint>();
  const remainders: { id: string; remainder: bigint }[] = [];
  let floorSum = 0n;

  for (const [id, numerator] of numerators) {
    if (numerator < 0n) throw new RangeError("numerators must not be negative");
    const whole = numerator / denominator;
    result.set(id, whole);
    floorSum += whole;
    remainders.push({ id, remainder: numerator % denominator });
  }

  let rest = total - floorSum;
  if (rest < 0n || rest > BigInt(remainders.length)) {
    throw new RangeError("total is not reachable from these shares");
  }

  remainders.sort((a, b) => {
    if (a.remainder !== b.remainder) return a.remainder > b.remainder ? -1 : 1;
    return compareIds(a.id, b.id);
  });

  for (const { id } of remainders) {
    if (rest === 0n) break;
    result.set(id, (result.get(id) ?? 0n) + 1n);
    rest -= 1n;
  }

  return result;
}

/** 按字符编码比较（和 SQL 的 collate "C" 一致），不受系统语言影响 */
export function compareIds(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * 把一个整数总额按份数分给几个人（拼单分装用：一箱鸡蛋 24 只三家分，小票 $8.99）。
 * 份数必须是正整数；合计正好等于 totalCents。
 */
export function splitTotalByWeights(
  totalCents: number,
  weights: Readonly<Record<string, number>>,
): Record<string, number> {
  if (!Number.isSafeInteger(totalCents) || totalCents < 0) {
    throw new RangeError("totalCents must be a non-negative integer");
  }
  const entries = Object.entries(weights);
  if (entries.length === 0) return {};
  let weightSum = 0n;
  for (const [, weight] of entries) {
    if (!Number.isSafeInteger(weight) || weight <= 0) throw new RangeError("weights must be positive integers");
    weightSum += BigInt(weight);
  }
  const numerators = new Map(entries.map(([id, weight]) => [id, BigInt(totalCents) * BigInt(weight)]));
  const allocated = allocateLargestRemainder(numerators, weightSum, BigInt(totalCents));
  return Object.fromEntries([...allocated].map(([id, cents]) => [id, Number(cents)]));
}
