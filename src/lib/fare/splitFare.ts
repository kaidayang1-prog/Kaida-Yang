import { allocateLargestRemainder, compareIds } from "./largestRemainder";

/**
 * 油费分摊（纯函数，没有任何外部依赖）。
 *
 *   每公里油费 = 油耗 / 100 × 油价
 *   每段油费   = 这段公里数 × 每公里油费，由这段车上的所有人平分（车主也算一个人；同行家人每人算一份）
 *   每人应付   = 他坐过的各段分摊之和，最后用最大余数法取整到分，所有人加起来正好等于总油费
 *
 * 为了没有浮点误差，内部全部换成整数计算：
 *   公里数 × 100（精确到 0.01 km）、油耗 × 10（精确到 0.1 L/100km）、油价用“分/升”。
 *   一段的油费（分）= km100 × fuel10 × 油价分 / 100000。
 */

export const FUEL_MIN = 3;
export const FUEL_MAX = 25;
export const GAS_CENTS_MIN = 50;
export const GAS_CENTS_MAX = 350;
export const PARTY_SIZE_MAX = 4;

export interface FareLegInput {
  /** 这段的公里数（地图算出的） */
  km: number;
  /** 这段车上的付款人 id（车主 + 乘客），不能重复 */
  riders: readonly string[];
}

export interface FareInput {
  /** 油耗，L/100km，范围 3–25 */
  fuelLPer100km: number;
  /** 油价，分/升，范围 50–350（$0.50–3.50） */
  gasCentsPerLitre: number;
  legs: readonly FareLegInput[];
  /** 每位付款人代表几个人（报名时带的同行家人），默认 1，最多 4 */
  weights?: Readonly<Record<string, number>>;
}

export interface FareLegResult {
  index: number;
  km: number;
  riders: string[];
  /** 这段车上一共几个人（含同行家人） */
  headcount: number;
  /** 这段油费，分，精确值（只用于显示） */
  costCents: number;
  /** 这段每个人分摊多少，分，精确值（只用于显示） */
  perPersonCents: number;
}

export interface FareResult {
  /** 每公里油费，分，精确值 */
  costPerKmCents: number;
  /** 总油费，分，精确值 */
  totalExactCents: number;
  /** 总油费取整到分 */
  totalCents: number;
  /** 每位付款人应付，分（整数） */
  shares: Record<string, number>;
  /** 每位付款人应付的精确值，分（只用于显示） */
  exactShares: Record<string, number>;
  /** 每人先取整数分的合计、还差几分、补给了谁（用于解释取整过程） */
  rounding: { floorSum: number; rest: number; bumped: string[] };
  legs: FareLegResult[];
}

export type FareErrorCode =
  | "fuel_out_of_range"
  | "gas_out_of_range"
  | "invalid_km"
  | "empty_leg"
  | "duplicate_rider"
  | "invalid_weight";

export class FareInputError extends Error {
  constructor(
    readonly code: FareErrorCode,
    message: string = code,
  ) {
    super(message);
    this.name = "FareInputError";
  }
}

const SCALE = 100_000n; // km100 × fuel10 × 分 / 100000 = 分

export function splitFare(input: FareInput): FareResult {
  const { fuelLPer100km, gasCentsPerLitre, legs, weights = {} } = input;

  if (!Number.isFinite(fuelLPer100km) || fuelLPer100km < FUEL_MIN || fuelLPer100km > FUEL_MAX) {
    throw new FareInputError("fuel_out_of_range");
  }
  if (!Number.isFinite(gasCentsPerLitre) || gasCentsPerLitre < GAS_CENTS_MIN || gasCentsPerLitre > GAS_CENTS_MAX) {
    throw new FareInputError("gas_out_of_range");
  }

  const fuel10 = BigInt(Math.round(fuelLPer100km * 10));
  const gasCents = BigInt(Math.round(gasCentsPerLitre));

  const weightOf = (id: string): bigint => {
    const weight = weights[id] ?? 1;
    if (!Number.isInteger(weight) || weight < 1 || weight > PARTY_SIZE_MAX) {
      throw new FareInputError("invalid_weight");
    }
    return BigInt(weight);
  };

  // 先校验并换算每一段
  const prepared = legs.map((leg, index) => {
    if (!Number.isFinite(leg.km) || leg.km < 0) throw new FareInputError("invalid_km");
    if (leg.riders.length === 0) throw new FareInputError("empty_leg");
    if (new Set(leg.riders).size !== leg.riders.length) throw new FareInputError("duplicate_rider");
    const km100 = BigInt(Math.round(leg.km * 100));
    const costNumerator = km100 * fuel10 * gasCents; // 这段油费 = costNumerator / SCALE 分
    const headcount = leg.riders.reduce((sum, id) => sum + weightOf(id), 0n);
    return { index, km: Number(km100) / 100, riders: [...leg.riders], costNumerator, headcount };
  });

  // 公共分母：SCALE × 各段人数的最小公倍数，这样每个人的精确金额都是整数分子
  const lcmHeadcount = prepared.reduce((acc, leg) => lcm(acc, leg.headcount), 1n);
  const denominator = SCALE * lcmHeadcount;

  const numerators = new Map<string, bigint>();
  let totalNumerator = 0n; // 以 SCALE 为分母
  for (const leg of prepared) {
    totalNumerator += leg.costNumerator;
    const perWeight = leg.costNumerator * (lcmHeadcount / leg.headcount);
    for (const id of leg.riders) {
      numerators.set(id, (numerators.get(id) ?? 0n) + perWeight * weightOf(id));
    }
  }

  // 总油费四舍五入到分（.5 进位，和数据库 round() 一致）
  const totalCents = (totalNumerator * 2n + SCALE) / (SCALE * 2n);
  const allocated = allocateLargestRemainder(numerators, denominator, totalCents);

  const floorSum = [...numerators.values()].reduce((sum, n) => sum + n / denominator, 0n);
  const bumped = [...allocated]
    .filter(([id, cents]) => cents > (numerators.get(id) ?? 0n) / denominator)
    .map(([id]) => id)
    .sort(compareIds);

  const toCents = (numerator: bigint, scale: bigint) => Number(numerator) / Number(scale);

  return {
    costPerKmCents: (Number(fuel10) / 10 / 100) * Number(gasCents),
    totalExactCents: toCents(totalNumerator, SCALE),
    totalCents: Number(totalCents),
    shares: Object.fromEntries([...allocated].map(([id, cents]) => [id, Number(cents)])),
    exactShares: Object.fromEntries([...numerators].map(([id, n]) => [id, toCents(n, denominator)])),
    rounding: { floorSum: Number(floorSum), rest: Number(totalCents - floorSum), bumped },
    legs: prepared.map((leg) => ({
      index: leg.index,
      km: leg.km,
      riders: leg.riders,
      headcount: Number(leg.headcount),
      costCents: toCents(leg.costNumerator, SCALE),
      perPersonCents: toCents(leg.costNumerator, SCALE) / Number(leg.headcount),
    })),
  };
}

function gcd(a: bigint, b: bigint): bigint {
  while (b !== 0n) [a, b] = [b, a % b];
  return a;
}

function lcm(a: bigint, b: bigint): bigint {
  return (a / gcd(a, b)) * b;
}
