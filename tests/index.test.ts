import { describe, it, expect } from "vitest";
import { makeRatioEngine } from "../src/index";

const tiers = ["gold", "silver", "bronze"] as const;

const engine = makeRatioEngine(tiers, {
  gold:   { gold: 1,   silver: 1.5, bronze: 2   },
  silver: { gold: 0.7, silver: 1,   bronze: 1.5 },
  bronze: { gold: 0.5, silver: 0.7, bronze: 1   },
});

describe("makeRatioEngine", () => {
  describe("convert", () => {
    it("returns the source amount when source and target match (ratio 1)", () => {
      expect(engine.convert(10, "gold", "gold")).toBe(10);
      expect(engine.convert(10, "silver", "silver")).toBe(10);
      expect(engine.convert(10, "bronze", "bronze")).toBe(10);
    });

    it("applies the source→target ratio", () => {
      expect(engine.convert(10, "gold", "bronze")).toBe(20);
      expect(engine.convert(10, "bronze", "gold")).toBe(5);
      expect(engine.convert(4, "silver", "bronze")).toBe(6);
    });

    it("handles zero units", () => {
      expect(engine.convert(0, "gold", "bronze")).toBe(0);
    });
  });

  describe("breakdown", () => {
    it("returns one entry per tier", () => {
      const out = engine.breakdown(10, "silver");
      expect(Object.keys(out).sort()).toEqual(["bronze", "gold", "silver"]);
    });

    it("matches convert() values for every tier", () => {
      const held = 10;
      const out = engine.breakdown(held, "silver");
      expect(out).toEqual({
        gold: engine.convert(held, "silver", "gold"),
        silver: engine.convert(held, "silver", "silver"),
        bronze: engine.convert(held, "silver", "bronze"),
      });
    });
  });

  describe("unitsRequired", () => {
    it("is the inverse of convert under the same ratio", () => {
      const got = engine.convert(10, "gold", "bronze"); // 20
      expect(engine.unitsRequired(got, "gold", "bronze")).toBe(10);
    });

    it("returns Infinity when the ratio is zero", () => {
      const e = makeRatioEngine(tiers, {
        gold:   { gold: 1, silver: 1, bronze: 1 },
        silver: { gold: 1, silver: 1, bronze: 1 },
        bronze: { gold: 0, silver: 0, bronze: 1 },
      });
      expect(e.unitsRequired(5, "bronze", "gold")).toBe(Number.POSITIVE_INFINITY);
    });
  });

  describe("construction validation", () => {
    it("throws if a row is missing", () => {
      expect(() =>
        makeRatioEngine(tiers, {
          gold:   { gold: 1, silver: 1, bronze: 1 },
          silver: { gold: 1, silver: 1, bronze: 1 },
          // bronze row missing
        } as never),
      ).toThrow(/missing row for tier "bronze"/);
    });

    it("throws if a cell is NaN", () => {
      expect(() =>
        makeRatioEngine(tiers, {
          gold:   { gold: 1,   silver: NaN, bronze: 1 },
          silver: { gold: 1,   silver: 1,   bronze: 1 },
          bronze: { gold: 1,   silver: 1,   bronze: 1 },
        }),
      ).toThrow(/missing or invalid at \[gold\]\[silver\]/);
    });

    it("throws on negative ratios", () => {
      expect(() =>
        makeRatioEngine(tiers, {
          gold:   { gold: 1, silver: -1, bronze: 1 },
          silver: { gold: 1, silver: 1,  bronze: 1 },
          bronze: { gold: 1, silver: 1,  bronze: 1 },
        }),
      ).toThrow(/negative value at \[gold\]\[silver\]/);
    });
  });
});
