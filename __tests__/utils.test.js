import { add, subtract } from "../src/utils";

describe("Utility Functions", () => {
  test("adds two numbers correctly", () => {
    expect(add(2, 3)).toBe(5);
    expect(add(-1, 1)).toBe(0);
  });

  test("subtracts two numbers correctly", () => {
    expect(subtract(5, 3)).toBe(2);
    expect(subtract(0, 5)).toBe(-5);
  });
});
