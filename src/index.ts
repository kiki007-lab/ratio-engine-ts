/**
 * Category-pair ratio engine.
 *
 * Generic pattern for any system where N tiers exchange a unit (time, points,
 * credits, currency) at different rates depending on the (source, destination)
 * pair. Common in loyalty programmes, peer-to-peer swap platforms, multi-currency
 * accounting, and tiered membership systems.
 */

export type RatioMatrix<T extends string> = Record<T, Record<T, number>>;

export interface RatioEngine<T extends string> {
  /** How many `target`-tier units `unitsHeld` of `source` converts to. */
  convert(unitsHeld: number, source: T, target: T): number;

  /**
   * The same as `convert`, but applied across all tiers — useful for dashboards
   * ("you can spend up to X in gold, Y in silver, …").
   */
  breakdown(unitsHeld: number, source: T): Record<T, number>;

  /**
   * Inverse of `convert`: how many `holder`-tier units are required to acquire
   * `unitsWanted` units of `target`. Returns `Infinity` if the ratio is zero
   * (no exchange possible).
   */
  unitsRequired(unitsWanted: number, holder: T, target: T): number;
}

/**
 * Create a new ratio engine bound to a fixed set of tiers and matrix.
 *
 * @example
 *   const engine = makeRatioEngine(['gold','silver','bronze'] as const, {
 *     gold:   { gold: 1,   silver: 1.5, bronze: 2   },
 *     silver: { gold: 0.7, silver: 1,   bronze: 1.5 },
 *     bronze: { gold: 0.5, silver: 0.7, bronze: 1   },
 *   });
 *   engine.convert(10, 'gold', 'bronze'); // 20
 */
export function makeRatioEngine<T extends string>(
  tiers: readonly T[],
  ratio: RatioMatrix<T>,
): RatioEngine<T> {
  // Validate matrix shape at construction time — fail loud, fail early.
  for (const a of tiers) {
    if (!ratio[a]) {
      throw new Error(`ratio matrix is missing row for tier "${a}"`);
    }
    for (const b of tiers) {
      if (typeof ratio[a][b] !== "number" || Number.isNaN(ratio[a][b])) {
        throw new Error(`ratio matrix is missing or invalid at [${a}][${b}]`);
      }
      if (ratio[a][b] < 0) {
        throw new Error(`ratio matrix has a negative value at [${a}][${b}]`);
      }
    }
  }

  function convert(unitsHeld: number, source: T, target: T): number {
    return unitsHeld * ratio[source][target];
  }

  function breakdown(unitsHeld: number, source: T): Record<T, number> {
    return Object.fromEntries(
      tiers.map((t) => [t, convert(unitsHeld, source, t)]),
    ) as Record<T, number>;
  }

  function unitsRequired(unitsWanted: number, holder: T, target: T): number {
    const r = ratio[holder][target];
    if (r === 0) return Number.POSITIVE_INFINITY;
    return unitsWanted / r;
  }

  return { convert, breakdown, unitsRequired };
}
