# ratio-engine-ts

A tiny, zero-dependency TypeScript library for **category-pair ratio systems** — the kind you see in loyalty programmes, peer-to-peer swap platforms, multi-currency accounting, and tiered membership systems where each tier exchanges a unit (time, points, credits, currency) at a different rate depending on the source/destination pair.

```ts
import { makeRatioEngine } from 'ratio-engine-ts';

const engine = makeRatioEngine(['gold', 'silver', 'bronze'] as const, {
  gold:   { gold: 1,   silver: 1.5, bronze: 2   },
  silver: { gold: 0.7, silver: 1,   bronze: 1.5 },
  bronze: { gold: 0.5, silver: 0.7, bronze: 1   },
});

engine.convert(10, 'gold', 'bronze');      // 20
engine.breakdown(10, 'silver');             // { gold: 7, silver: 10, bronze: 15 }
engine.unitsRequired(15, 'silver', 'bronze'); // 10
```

## Why it exists

Most systems that need this end up writing it ad-hoc inside business logic — hard to test, hard to change, easy to get wrong on edge cases (zero ratios, missing tiers, floating-point drift). This is the small library I wished I had after reverse-engineering a half-built private home-exchange platform built on Next.js 16 + Supabase. Pulled out, generalised, fully tested.

## Install

```bash
npm install ratio-engine-ts
```

## API

### `makeRatioEngine(tiers, ratio)`

Creates an engine bound to a fixed set of tiers and a ratio matrix.

- `tiers: readonly T[]` — the tier names. Use `as const` for full type-safety on the returned object's keys.
- `ratio: Record<T, Record<T, number>>` — the conversion matrix. Rows are *source* tier (what you hold). Columns are *target* tier (what you want).

Returns `{ convert, breakdown, unitsRequired }`.

### `.convert(unitsHeld, source, target): number`

How many units do `unitsHeld` of `source` convert to, in `target`?

### `.breakdown(unitsHeld, source): Record<T, number>`

Same as `.convert`, but applied to every tier — useful for dashboards (*"you can spend up to X in gold, Y in silver, Z in bronze"*).

### `.unitsRequired(unitsWanted, holder, target): number`

Inverse: how much of `holder`'s tier is required to acquire `unitsWanted` units of `target`? Returns `Infinity` when the ratio is zero (no exchange possible).

## Type safety

The engine is generic over a string-literal union:

```ts
type Tier = 'gold' | 'silver' | 'bronze';

const engine = makeRatioEngine(['gold','silver','bronze'] as const, {...});

engine.convert(10, 'gold', 'bronze');   // ✅ typechecks
engine.convert(10, 'gold', 'platinum'); // ❌ compile error
```

## Testing

```bash
npm test
```

Tests are written with [Vitest](https://vitest.dev). Run `npm run test:watch` while developing.

## License

MIT.

## About

Written by [@kiki007-lab](https://github.com/kiki007-lab). Extracted from notes after reading a production Next.js 16 + React 19 + Supabase + Tailwind 4 codebase end-to-end. See [/notes](./notes) for the write-up of that process.
