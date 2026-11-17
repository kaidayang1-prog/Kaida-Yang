import { describe, expect, it } from "vitest";
import { FareInputError, splitFare, type FareInput } from "./splitFare";

/** 需求里给的测试数据：油耗 8.5、油价 $1.69，六段路，车上人数 1、2、3、3、2、1 */
const REQUIRED_CASE: FareInput = {
  fuelLPer100km: 8.5,
  gasCentsPerLitre: 169,
  legs: [
    { km: 1.7, riders: ["lily"] },
    { km: 2.4, riders: ["lily", "amy"] },
    { km: 8.5, riders: ["lily", "amy", "ben"] },
    { km: 8.8, riders: ["lily", "amy", "ben"] },
    { km: 2.9, riders: ["lily", "amy"] },
    { km: 1.7, riders: ["lily"] },
  ],
};

const sum = (values: Record<string, number>) => Object.values(values).reduce((a, b) => a + b, 0);

describe("splitFare", () => {
  it("需求测试数据：三人分别付 $1.69、$1.21、$0.83，合计 $3.73", () => {
    const result = splitFare(REQUIRED_CASE);
    expect(result.shares).toEqual({ lily: 169, amy: 121, ben: 83 });
    expect(result.totalCents).toBe(373);
    expect(sum(result.shares)).toBe(373);
  });

  it("需求测试数据：每公里 14.365 分，逐段油费和人数正确", () => {
    const result = splitFare(REQUIRED_CASE);
    expect(result.costPerKmCents).toBeCloseTo(14.365, 10);
    expect(result.legs.map((leg) => leg.headcount)).toEqual([1, 2, 3, 3, 2, 1]);
    expect(result.legs.map((leg) => leg.costCents)).toEqual([24.4205, 34.476, 122.1025, 126.412, 41.6585, 24.4205]);
    expect(result.totalExactCents).toBeCloseTo(373.49, 10);
  });

  it("需求测试数据：取整过程是先各取整数分，再把差的 2 分补给小数最大的 Amy 和 Ben", () => {
    const result = splitFare(REQUIRED_CASE);
    expect(result.exactShares.lily).toBeCloseTo(169.7464, 3);
    expect(result.exactShares.amy).toBeCloseTo(120.9054, 3);
    expect(result.exactShares.ben).toBeCloseTo(82.8382, 3);
    expect(result.rounding).toEqual({ floorSum: 371, rest: 2, bumped: ["amy", "ben"] });
  });

  it("只有车主一个人时，车主付全部油费", () => {
    const result = splitFare({ fuelLPer100km: 10, gasCentsPerLitre: 150, legs: [{ km: 10, riders: ["d"] }] });
    expect(result.shares).toEqual({ d: 150 });
  });

  it("人数除不尽时，合计仍然正好等于总油费", () => {
    const result = splitFare({
      fuelLPer100km: 7.3,
      gasCentsPerLitre: 163,
      legs: [
        { km: 3.33, riders: ["d", "a", "b"] },
        { km: 11.07, riders: ["d", "a", "b", "c", "e", "f", "g"] },
        { km: 0.01, riders: ["d", "g"] },
      ],
    });
    expect(sum(result.shares)).toBe(result.totalCents);
  });

  it("余数相同时按 id 顺序补分，结果稳定", () => {
    // 1 km × 10 L/100km × 100 分 = 10 分，三个人平分 3.333…，差 1 分补给 id 最小的 a
    const result = splitFare({ fuelLPer100km: 10, gasCentsPerLitre: 100, legs: [{ km: 1, riders: ["c", "a", "b"] }] });
    expect(result.shares).toEqual({ a: 4, b: 3, c: 3 });
  });

  it("同行家人按人头算：带 1 位家人的报名付两份", () => {
    const result = splitFare({
      fuelLPer100km: 10,
      gasCentsPerLitre: 100,
      legs: [{ km: 3, riders: ["driver", "family"] }], // 30 分，3 个人
      weights: { family: 2 },
    });
    expect(result.shares).toEqual({ driver: 10, family: 20 });
    expect(result.legs[0].headcount).toBe(3);
  });

  it("总油费四舍五入：正好 .5 分时进位", () => {
    // 每公里 10 / 100 × 100 分 = 10 分；0.05 km → 0.5 分 → 1 分
    const result = splitFare({ fuelLPer100km: 10, gasCentsPerLitre: 100, legs: [{ km: 0.05, riders: ["d"] }] });
    expect(result.totalCents).toBe(1);
    expect(result.shares).toEqual({ d: 1 });
  });

  it("随机数据：任何情况下合计都等于总油费，每人和精确值相差不到 1 分", () => {
    let seed = 42;
    const random = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
    const people = ["d", "p1", "p2", "p3", "p4", "p5", "p6"];
    for (let run = 0; run < 500; run++) {
      const legs = Array.from({ length: 1 + Math.floor(random() * 8) }, () => ({
        km: Math.round(random() * 3000) / 100,
        riders: ["d", ...people.slice(1).filter(() => random() < 0.5)],
      }));
      const result = splitFare({
        fuelLPer100km: Math.round((3 + random() * 22) * 10) / 10,
        gasCentsPerLitre: 50 + Math.floor(random() * 301),
        legs,
      });
      expect(sum(result.shares)).toBe(result.totalCents);
      for (const [id, cents] of Object.entries(result.shares)) {
        expect(Math.abs(cents - result.exactShares[id])).toBeLessThan(1);
      }
    }
  });

  it("没有路段时总油费为 0", () => {
    expect(splitFare({ fuelLPer100km: 8, gasCentsPerLitre: 150, legs: [] })).toMatchObject({ totalCents: 0, shares: {} });
  });

  describe("输入校验", () => {
    const base: FareInput = { fuelLPer100km: 8, gasCentsPerLitre: 150, legs: [{ km: 1, riders: ["d"] }] };
    const codeOf = (input: FareInput) => {
      try {
        splitFare(input);
        return null;
      } catch (error) {
        return error instanceof FareInputError ? error.code : "unexpected";
      }
    };

    it("油耗限制在 3–25 L/100km", () => {
      expect(codeOf({ ...base, fuelLPer100km: 2.9 })).toBe("fuel_out_of_range");
      expect(codeOf({ ...base, fuelLPer100km: 25.1 })).toBe("fuel_out_of_range");
      expect(codeOf({ ...base, fuelLPer100km: 3 })).toBeNull();
      expect(codeOf({ ...base, fuelLPer100km: 25 })).toBeNull();
    });

    it("油价限制在 $0.50–3.50/L", () => {
      expect(codeOf({ ...base, gasCentsPerLitre: 49 })).toBe("gas_out_of_range");
      expect(codeOf({ ...base, gasCentsPerLitre: 351 })).toBe("gas_out_of_range");
      expect(codeOf({ ...base, gasCentsPerLitre: 50 })).toBeNull();
      expect(codeOf({ ...base, gasCentsPerLitre: 350 })).toBeNull();
    });

    it("公里数不能是负数或无效值", () => {
      expect(codeOf({ ...base, legs: [{ km: -1, riders: ["d"] }] })).toBe("invalid_km");
      expect(codeOf({ ...base, legs: [{ km: Number.NaN, riders: ["d"] }] })).toBe("invalid_km");
    });

    it("每段至少一个人，同一段不能重复算一个人", () => {
      expect(codeOf({ ...base, legs: [{ km: 1, riders: [] }] })).toBe("empty_leg");
      expect(codeOf({ ...base, legs: [{ km: 1, riders: ["d", "d"] }] })).toBe("duplicate_rider");
    });

    it("同行人数是 1–4 的整数", () => {
      expect(codeOf({ ...base, weights: { d: 0 } })).toBe("invalid_weight");
      expect(codeOf({ ...base, weights: { d: 5 } })).toBe("invalid_weight");
      expect(codeOf({ ...base, weights: { d: 1.5 } })).toBe("invalid_weight");
    });
  });
});
