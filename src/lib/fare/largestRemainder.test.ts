import { describe, expect, it } from "vitest";
import { allocateLargestRemainder, splitTotalByWeights } from "./largestRemainder";

describe("allocateLargestRemainder", () => {
  it("把差的分补给余数最大的人", () => {
    // 精确值 1.6、1.3、1.1，合计 4 → 2、1、1
    const result = allocateLargestRemainder(
      new Map([
        ["a", 16n],
        ["b", 13n],
        ["c", 11n],
      ]),
      10n,
      4n,
    );
    expect(Object.fromEntries(result)).toEqual({ a: 2n, b: 1n, c: 1n });
  });

  it("总额不可能达到时报错", () => {
    expect(() => allocateLargestRemainder(new Map([["a", 10n]]), 10n, 3n)).toThrow(RangeError);
  });
});

describe("splitTotalByWeights（拼单分装）", () => {
  it("一箱鸡蛋 $8.99 三家平分：3.00、3.00、2.99", () => {
    expect(splitTotalByWeights(899, { a: 1, b: 1, c: 1 })).toEqual({ a: 300, b: 300, c: 299 });
  });

  it("按份数分：一家要 2 份", () => {
    const result = splitTotalByWeights(1000, { a: 2, b: 1 });
    expect(result).toEqual({ a: 667, b: 333 });
    expect(result.a + result.b).toBe(1000);
  });

  it("份数必须是正整数", () => {
    expect(() => splitTotalByWeights(100, { a: 0 })).toThrow(RangeError);
  });
});
