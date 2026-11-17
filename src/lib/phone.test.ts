import { describe, expect, it } from "vitest";
import { formatPhone, maskPhone, normalizeNanpPhone } from "./phone";

describe("normalizeNanpPhone", () => {
  it("接受各种常见写法", () => {
    for (const input of ["416 555 0101", "(416) 555-0101", "+1 416-555-0101", "14165550101", "4165550101"]) {
      expect(normalizeNanpPhone(input)).toBe("+14165550101");
    }
  });

  it("位数不对或区号无效时返回 null", () => {
    expect(normalizeNanpPhone("555 0101")).toBeNull();
    expect(normalizeNanpPhone("416 555 01011")).toBeNull();
    expect(normalizeNanpPhone("016 555 0101")).toBeNull();
    expect(normalizeNanpPhone("416 055 0101")).toBeNull();
    expect(normalizeNanpPhone("")).toBeNull();
  });
});

describe("formatPhone / maskPhone", () => {
  it("显示成 +1 416-555-0101，部分隐藏中间三位", () => {
    expect(formatPhone("14165550101")).toBe("+1 416-555-0101");
    expect(formatPhone("+14165550101")).toBe("+1 416-555-0101");
    expect(maskPhone("14165550101")).toBe("+1 416-•••-0101");
  });

  it("空值返回空字符串", () => {
    expect(formatPhone(null)).toBe("");
    expect(maskPhone(undefined)).toBe("");
  });
});
