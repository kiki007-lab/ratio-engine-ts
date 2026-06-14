# Notes — reverse-engineering a half-built Next.js 16 + Supabase platform

A short writeup of the read-through that produced this library.

I was asked to "continue work" on a half-built private exchange platform — no handover doc, only a 15-page PDF specification and ~70 source files. The brief was four lines on WhatsApp:

> Done: revamp the landing page
> Progressing: —
> Remaining: all details in pdf

This is the process I used to get oriented in about 24 hours before deciding the scope was outside the original role I'd applied for, declining the engagement, and turning the read-through into a portable artefact.

---

## Stack the repo turned out to use

| Layer | Tech |
|---|---|
| Framework | Next.js 16.2.6 (App Router) — much newer than the PDF claimed |
| UI | React 19, Tailwind 4 (CSS `@theme {…}` tokens, no JS config) |
| Auth & data | Supabase SSR (`@supabase/ssr`) — cookie-based |
| Hosting | Netlify (not Vercel as the PDF said) |
| Testing | Vitest + path-aliased `@/` |
| AI conventions | An `AGENTS.md` warning *"This is NOT the Next.js you know"* — bleeding-edge breaking changes |

## What I read, in order

1. **Specification PDF.** Read end-to-end so I'd recognise the vocabulary in the code.
2. **`package.json` + `tsconfig.json`.** Tells you the real stack in 30 seconds. Always read these before any application file.
3. **`AGENTS.md` / `CLAUDE.md`.** Agent-style convention files. If the previous engineer used them, follow them.
4. **`next.config.ts`, `netlify.toml`, `vitest.config.ts`, `eslint.config.mjs`.** Tells you the hosting target, image domains, test layout, lint rules.
5. **`src/app/globals.css`.** The design system — chocolate / cream / gold / sage tokens, prebuilt `.surface`, `.btn-primary`, `.input`, `.badge-*` utility classes. Reusing these classes saves you from inventing parallel Tailwind utility combos.
6. **`src/app/layout.tsx`.** Fonts, toasts, manifest, theme colour.
7. **`src/app/page.tsx`.** The landing page — what the marketing site already says is being built.
8. **`src/lib/`.** The domain logic — `availability.ts` (the real engine), `credits.ts` (a deprecated shim re-exporting from `availability`).
9. **`src/lib/supabase/{client,server,middleware}.ts` + root `middleware.ts`.** Auth wiring + the auth guard.
10. **`src/` tree via `tree /F /A src > tree.txt`.** The inventory of what exists.

## Five contradictions I found between the PDF and the code

| # | PDF said | Code did | Decision |
|---|---|---|---|
| 1 | Next.js 14 + Vercel | Next.js 16 + Netlify | Trust the code, not the PDF. |
| 2 | Tailwind 3 (`tailwind.config.ts`) | Tailwind 4 (`@theme` in CSS) | All theme tokens go in `globals.css`. |
| 3 | Resend for email | Supabase Edge Functions planned | Build the email helper as an Edge Function. |
| 4 | "Credits" vocabulary | A deprecated `credits.ts` shim re-exports from `availability.ts` (which uses "weeks available" / "time to book") | Use the new vocabulary; do not regress to "credits". |
| 5 | In-app chat in the plan | No `messages` route in code (deep-link to WhatsApp/email instead) | Remove the chat from the plan. |

The implementation plan in the repo was clearly written *before* the v2 spec arrived; the code had already moved on. **Treat the latest code as the source of truth and the spec as historical context.**

## The four unanswered questions I found in `implementation_plan.md`

Worth surfacing in any first-day conversation:

1. Drop the legacy Supabase tables (`payments`, `properties`, `profiles`, `bids`, etc.) or keep them alongside the new `ok_*` tables?
2. Google Maps API key — do we have one or do we fall back to Leaflet / OpenStreetMap?
3. Email provider — Supabase built-in or Resend?
4. Production domain — needed for Supabase auth redirect URLs.

## What I did NOT do

- Did not write a single line of application code.
- Did not push anything to the project repo.
- Did not commit to a deadline before scope, quote, and an explicit greenlight were given.

## Why this is here

I keep the writeup because the *process* is reusable — every freelance engagement starts with a foreign codebase and a PDF that doesn't match it. The `ratio-engine-ts` library in this repo is the small piece of generalisable insight I pulled out: any three-tier exchange system needs a tested, validated ratio engine, and most projects implement it ad-hoc.

---

*Identifying details about the client and the agency have been removed.*
