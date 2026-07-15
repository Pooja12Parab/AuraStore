# AuraStore Phase 1 Implementation Plan — Corrections & Resolutions

> **Project:** AuraStore: The Modern Consumer App
> **Date:** July 15, 2026
> **Document Type:** Design Spec (corrections to Implementation Plan)
> **Parent:** [Phase 1 Implementation Plan](../phase_1/AuraStore_Phase1_Implementation_Plan.md)

## 1. Issues Found During Review

| # | Issue | Stage | Severity |
|---|-------|-------|----------|
| 1 | Missing `vite.config.ts` — vitest `mergeConfig` depends on it | 1 | High |
| 2 | Missing `git init` — no git repo exists | 1 | High |
| 3 | `src/` prefix inconsistent — Stages 3-6 use bare `lib/` and `components/` | 3, 4, 5, 6 | Medium |
| 4 | Package manager unspecified (`npm run` vs `pnpm`) | All | Medium |
| 5 | Missing `backend/package.json` `"seed"` script entry | 2 | Medium |
| 6 | `cn()` conflict — LLD shows simple version but shadcn init creates clsx+twMerge | 3, 4 | Low |
| 7 | Open Question Q1 unresolved (useProducts hooks vs pure RSC) | 6 | Low |

## 2. Resolutions Applied

### 2.1 Issue 1 — vite.config.ts (Stage 1)
Created `vite.config.ts` at repo root with `@vitejs/plugin-react` and `vite-tsconfig-paths`. vitest `mergeConfig` imports this file.

### 2.2 Issue 2 — git init (Stage 1)
Added `git init` as the first step in Stage 1 Setup, before Next.js scaffold.

### 2.3 Issue 3 — src/ prefix (Stages 3-6)
Normalized all file paths to use `src/` prefix:
- `lib/` → `src/lib/`
- `components/` → `src/components/`
- `hooks/` → `src/hooks/`

### 2.4 Issue 4 — Package manager
Locked to pnpm throughout. All `npm run` changed to `pnpm`. `npx` retained for one-off tools (create-next-app, playwright, shadcn init).

### 2.5 Issue 5 — Seed script (Stage 2)
Added `"seed": "node scripts/seed.ts"` to `backend/package.json` scripts section.

### 2.6 Issue 6 — cn() utility
Use shadcn's default `cn()` (clsx + tailwind-merge) from `shadcn/ui init`. Stage 3 adds `formatINR()` to the same `src/lib/utils.ts` file.

### 2.7 Issue 7 — Open Question Q1
**Resolved:** Drop `useProducts`/`useProduct` custom hooks. Pages consume `productQueryOptions`/`categoryQueryOptions` directly via `@tanstack/react-query` in Server Components. The 2 integration tests move from Stage 6 to Stage 4 (data-layer integration tests). Reduces code surface with no loss of test coverage.

## 3. Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Package manager | pnpm | Faster installs, disk-efficient, Next.js 16 compatible |
| cn() implementation | shadcn default (clsx+twMerge) | Avoids overriding shadcn's init output; same behavior |
| useProducts hooks | Dropped | Pages use queryOptions directly; fewer files, same test coverage |
| Spec doc location | docs/superpowers/specs/ | Per brainstorming skill convention; user confirmed location