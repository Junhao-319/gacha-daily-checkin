import { describe, expect, it } from "vitest";
import {
  addDays,
  fromDateKey,
  getRollingDateKeys,
  millisecondsUntilNextMidnight,
  toDateKey
} from "./date";

describe("date helpers", () => {
  it("uses local calendar dates for keys", () => {
    expect(toDateKey(new Date(2026, 8, 12, 23, 59))).toBe("2026-09-12");
    expect(toDateKey(fromDateKey("2026-09-12"))).toBe("2026-09-12");
  });

  it("adds days across month boundaries", () => {
    expect(toDateKey(addDays(new Date(2026, 0, 31, 12), 1))).toBe("2026-02-01");
  });

  it("returns a rolling inclusive date window", () => {
    const dates = getRollingDateKeys(new Date(2026, 8, 12, 12), 3);
    expect(dates).toEqual(["2026-09-10", "2026-09-11", "2026-09-12"]);
  });

  it("calculates the next local midnight delay", () => {
    const delay = millisecondsUntilNextMidnight(new Date(2026, 8, 12, 23, 59, 50));
    expect(delay).toBeGreaterThan(9_000);
    expect(delay).toBeLessThanOrEqual(10_500);
  });
});