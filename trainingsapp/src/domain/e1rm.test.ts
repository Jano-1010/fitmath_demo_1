import { describe, expect, it } from "vitest";
import { estimateE1RM } from "./e1rm";

describe("estimateE1RM (Epley)", () => {
  it("applies kg * (1 + reps / 30)", () => {
    expect(estimateE1RM(100, 5)).toBeCloseTo(116.667, 3);
    expect(estimateE1RM(80, 10)).toBeCloseTo(106.667, 3);
    expect(estimateE1RM(60, 3)).toBeCloseTo(66, 6);
  });
  it("returns 0 without load or reps", () => {
    expect(estimateE1RM(0, 5)).toBe(0);
    expect(estimateE1RM(100, 0)).toBe(0);
    expect(estimateE1RM(NaN, 5)).toBe(0);
  });
});
