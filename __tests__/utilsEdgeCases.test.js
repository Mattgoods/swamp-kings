import { add, subtract } from "../src/utils";

describe("Utility Functions Edge Cases", () => {
  test("adds with zero", () => {
    expect(add(0, 5)).toBe(5);
    expect(add(0, 0)).toBe(0);
  });

  test("subtracts with zero", () => {
    expect(subtract(5, 0)).toBe(5);
    expect(subtract(0, 5)).toBe(-5);
  });

  test("handles negative numbers", () => {
    expect(add(-5, -5)).toBe(-10);
    expect(subtract(-5, -5)).toBe(0);
  });
});
