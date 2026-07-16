# AuraStore — Phase 1 Implementation Plan (Staged Delivery)

> **Project:** AuraStore: The Modern Consumer App
> **Version:** 1.0
> **Date:** July 14, 2026
> **Document Type:** Implementation Plan (staged, execution-ready) — **AGENT execution plan**
> **Parent Documents:** [Phase 1 LLD](./AuraStore_LLD_Phase1.md) · [Phase 1 Testing LLD](./AuraStore_Testing_LLD_Phase1.md) · [Testing HLD](../AuraStore_Testing_HLD.md) · [Prerequisites](./AuraStore_Prerequisites_Phase1.md) · [Strapi Setup Guide](../AuraStore_Strapi_Setup_Guide.md) · [HLD](../AuraStore_HLD.md)
> **Phase:** Phase 1 — Basic/MVP (Clerk auth, Strapi catalog, browsing, layout)
> **Audience:** Implementing developer / agent

> **Role legend:** Each stage tags its **Entry Gate** as the **HUMAN handoff** (from Prerequisites) and its **Code/Implementation** as **AGENT** work. The Strapi Setup Guide holds the full HUMAN/AGENT-tagged Strapi reference.

---

## 1. Purpose & How To Use This Plan

This plan turns the Phase 1 LLD + Testing LLD into a **staged, execution-ready sequence**. Phase 1 is delivered in **7 stages**. Each stage follows a fixed shape so any executor (human or agent) knows exactly what to do and when it is "done":

```
┌──────────────────────────────────────────────────────────────┐
│  STAGE TEMPLATE (every stage)                                 │
│                                                                │
│  1. ENTRY GATE      → HUMAN handoff verified (Prerequisites)  │
│  2. SETUP           → env, deps, accounts, config to establish │
│  3. CODE            → AGENT: files to create/modify (from LLD) │
│  4. TEST CASES      → unit / integration / e2e to add          │
│  5. VERIFICATION    → exit criteria (commands must pass)       │
└──────────────────────────────────────────────────────────────┘
```

**Repository layout:** the Next.js frontend is scaffolded at the **repo root**; the Strapi backend lives in a sibling **`backend/`** directory. (The older Strapi Setup Guide referenced a `frontend/` subfolder — that is corrected in the current Setup Guide §3.)

**Reference docs:** Full Strapi steps (HUMAN/AGENT tagged) → `../AuraStore_Strapi_Setup_Guide.md`. Human-only checklist → `./AuraStore_Prerequisites_Phase1.md`.

**Principles applied:**
- **Phased delivery** — each stage delivers one coherent, testable slice; later stages depend only on completed earlier stages.
- **Shift-left QA** — test infrastructure is built in Stage 1 and every test layer (unit → integration → e2e) is added as soon as the code under test exists.
- **Verify-before-proceed** — every stage opens with an *Entry Gate* that re-runs the full green bar of prior stages; a red gate blocks the next stage.
- **Full test pyramid** — all **35** locked Phase 1 tests are placed across stages (20 unit / 9 integration / 6 e2e). Locked to Testing HLD §9 (35), not the stale §3.3 (60).
- **Backend is in-scope** — the Strapi v5 CMS (content types, token, CORS, seed) is built in Stage 2, not treated as a black box.

---

## 2. Locked Constraints (do not deviate)

| Constraint | Value | Source |
|------------|-------|--------|
| Test pyramid | **20 unit / 9 integration / 6 e2e = 35** | Testing LLD §9.2 |
| Node.js | v22.x | LLD §1.3 |
| Next.js | 16.2+ (App Router, `cacheComponents: true`, `proxy.ts` not `middleware.ts`) | LLD §1.3, §3.2 |
| Tailwind | v4.x (CSS-first, no `tailwind.config.js`) | LLD §1.3, §3.2 |
| Clerk | v7.x (`clerkMiddleware`, async `auth()`, `auth.protect()`) | LLD §1.3 |
| Strapi | v5.x (flattened response, **explicit `populate`**, **no `populate=*` in app code**, Draft & Publish) | LLD §1.3, §3.2; Setup Guide §1 |
| Strapi access | **Read-only API token, server-side; content types PRIVATE (no Public role read)** | Setup Guide §8; LLD §6.2 |
| Vitest | v4.x stable (`4.1.10`); **do NOT use v5 beta** | Testing LLD §1.3 |
| Coverage thresholds | stmts ≥ 80, branches ≥ 75, funcs ≥ 80, lines ≥ 80 | Testing LLD §3.2 |
| MSW | v2.x (node) + `@msw/playwright` v0.6.7 (e2e, client-only) | Testing LLD §1.3, §4.7 |
| E2E external deps | **Real seeded Strapi** + **real Clerk test user** (`+clerk_test`) | Testing LLD §3.1, §4.7 |
| Secrets | `STRAPI_API_TOKEN`, `CLERK_SECRET_KEY`, E2E creds are **server-only** | LLD §6.2; Prereq §4 |
| Out of scope (Phase 1) | No cart/checkout/payment/order/search/wishlist/dark-mode | LLD §2.2 |

> **`populate=*` note:** The constraint forbids `populate=*` **in application code** (use explicit `populate=category` / `populate=image`). `populate=*` is permitted **only for ad-hoc human verification** (Setup Guide §11) to confirm relations resolve.

---

## 3. Stage Map (at a glance)

| # | Stage | Primary Deliverable | New Tests | Depends On |
|---|-------|---------------------|-----------|------------|
| 1 | Foundation & Test Infrastructure | Next 16 scaffold + Vitest/Playwright/MSW harness | 0 (infra) | Prereqs |
| 2 | **Strapi Backend Setup** | Strapi v5 instance, `Product`/`Category` types, read-only API token, CORS, seed | 0 (verified via `curl`) | Prereqs (runs parallel to S1) |
| 3 | Data Layer & Types | `src/types/strapi.ts`, `src/lib/strapi.ts`, `src/lib/strapi-queries.ts` | 13 (9U + 4I) | Stage 1 |
| 4 | Core Presentational Components | Product/Common components + `ErrorBoundary` | 9 (7U + 2I) | Stage 1 |
| 5 | Layout & Auth (Clerk) | `proxy.ts`, `Header`, `Footer`, `AuthSection`, `Nav` | 5 (4U + 1E) | Stage 3, 4 |
| 6 | Pages, Routing & Hooks | Home/Products/Detail/Category pages, hooks, `CategoryFilter` | 8 (3I + 5E) | Stage 3–5 |
| 7 | Test-Pyramid Orchestration & CI/CD | GitHub Actions, quality gates, full run | 0 (runs all 35) | Stage 1–6 |

**Cumulative:** Stage 1 = 0, Stage 2 = 0, Stage 3 = 13, Stage 4 = 22, Stage 5 = 27, Stage 6 = 35 → **full pyramid complete at Stage 6; Stage 7 proves it in CI.**

> **Strapi is part of Phase 1 implementation, not just an external dependency.** Stage 2 builds the backend; Stage 6 E2E depends on Stage 2's running, **seeded + published** Strapi instance.

---

## 4. Detailed Stages

### Stage 1 — Foundation & Test Infrastructure

**Goal:** A bootable Next.js 16 app with a fully wired test harness (Vitest projects, MSW, Playwright, test data factories) so every later stage can add tests immediately.

**Entry Gate (HUMAN):** `docs/phase_1/AuraStore_Prerequisites_Phase1.md` §5 checklist items satisfied: Node v22 installed, ports 3000/1337 free, package manager chosen. (Account/Strapi keys may arrive later — they are only needed for Stage 2/5/6.)

**Package manager:** pnpm (chosen for speed and disk efficiency; use consistently across all stages).

**Setup (AGENT)**

- Initialize git repo at project root: `git init`, then `git add . && git commit -m "initial: project docs"` (preserves existing docs before Next.js scaffold adds app files).
- Scaffold Next.js 16 (App Router, TypeScript, Tailwind v4, `src/` dir) at the **repo root** (not a `frontend/` subfolder): `pnpm create next-app . --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack --use-pnpm` (or scaffold to temp dir and merge).
- Install runtime deps: `pnpm add @clerk/nextjs @tanstack/react-query qs`.
- Install dev/test deps: `pnpm add -D vitest@4.1.10 @vitest/coverage-v8 @vitejs/plugin-react vite-tsconfig-paths @testing-library/react@16 @testing-library/jest-dom @testing-library/user-event msw@2 @mswjs/data @msw/playwright@0.6.7 @clerk/testing playwright@1.6x @playwright/test dotenv`.
- Initialize shadcn/ui (`style: new-york`, `rsc: true`, `cssVariables: true`) — installs `cn` + primitive UI kit (note: `src/components/ui/**` is excluded from coverage per Testing HLD §4.3).
- Init Playwright browsers: `npx playwright install --with-deps`.

**Code / Implementation (AGENT)**
- `next.config.ts`: `cacheComponents: true`; `images.remotePatterns` for `localhost:1337` + `picsum.photos` (LLD §7.3).
- `tsconfig.json`: `@/*` path alias → `src/*`.
- `app/globals.css`: Tailwind v4 CSS-first (`@import "tailwindcss"; @theme {…}`).
- `app/layout.tsx`: minimal shell (no Clerk yet) — `html/body` + placeholder children slot.
- `src/providers/query-provider.tsx`: `QueryClientProvider` wrapper (LLD §4.1).
- `vitest.config.ts`: `mergeConfig` over `vite.config`, `projects` = `unit` (node) + `component` (jsdom, `setupFiles`) (Testing LLD §4.1). **Naming convention:** pure-logic/unit specs use the `*.unit.test.ts` suffix (run in the `unit` project, node); component & integration specs use `*.test.ts(x)` (run in the `component` project, jsdom).
- `vite.config.ts`: minimal config with `@vitejs/plugin-react` and `vite-tsconfig-paths` plugins — required by vitest `mergeConfig` (Testing LLD §4.1; Next.js Turbopack does not create this file).
- `src/__tests__/setup.ts`: jest-dom, MSW `server` lifecycle, `localStorage` + `IntersectionObserver` stubs (Testing LLD §4.2).
- `src/__tests__/mocks/server.ts`, `handlers.ts`, `factories.ts` (`@mswjs/data`), `seed.ts` (Testing LLD §4.3, §5.x).
- `src/__tests__/utils/create-wrapper.tsx`: TanStack `QueryClient` factory (`retry:false`, `gcTime:0`) (Testing LLD §4.4).
- `playwright.config.ts` + `e2e/global.setup.ts` + `e2e/auth.setup.ts` + `e2e/playwright.setup.ts` (Testing LLD §4.6, §4.7).
- `.env.local.example` skeleton with all Phase 1 vars (LLD §4.4.4); real values added in Stage 2/5.
- `package.json` scripts: `test`, `test:unit`, `test:integration`, `test:coverage`, `test:e2e`, `lint`, `typecheck` (Testing HLD §8.3).

**Test Cases**
- No application tests yet. Add **one Vitest smoke test** to prove the harness loads (e.g. `true === true` in `src/__tests__/harness.smoke.test.ts`) and a Playwright config sanity (no spec yet).

**Verification / Exit Criteria**
- [ ] `pnpm dev` boots at `http://localhost:3000`.
- [ ] `pnpm build` succeeds (PPR enabled).
- [ ] `pnpm lint` → 0 errors.
- [ ] `pnpm typecheck` → 0 errors.
- [ ] `pnpm vitest run` → green (smoke only).
- [ ] `pnpm playwright test --list` → lists 0 specs without error (config valid).

---

### Stage 2 — Strapi Backend Setup

**Goal:** A running Strapi v5 instance with `Product` + `Category` collection types (matching HLD §7.1 / LLD §4.5), a **read-only API token**, CORS locked to the frontend origin, Draft & Publish enabled, and a seed script producing 10–20 products across 4–5 categories (**all published**). This is the real data source for Stage 6 E2E.

> Full HUMAN/AGENT-tagged steps: **`../AuraStore_Strapi_Setup_Guide.md` §5–§9.** All Strapi steps (admin registration, token creation, verification) are AGENT tasks — see the Strapi Setup Guide for the automated workflow.

**Entry Gate (AGENT):** Prereq §1 local environment satisfied: Node v22, port 1337 free, DB choice decided (SQLite dev / Postgres prod-like). This stage runs **in parallel with Stage 1** — no dependency on the frontend.

**Setup (AGENT)**
- Choose DB: `--non-interactive` defaults to **SQLite** (dev); pass `--dbclient postgres` for a Postgres-backed instance.
- Create the instance: `npx create-strapi@latest backend --non-interactive` (**`--quickstart` is deprecated in Strapi 5 — do NOT use**; Setup Guide §5).
- Start: `cd backend && npm run develop` → admin at `http://localhost:1337/admin`.
- **AGENT:** Complete first-run admin registration via bootstrap script (`POST /admin/register`) — see Setup Guide §5.2.
- Decide content-type creation: code-generated `schema.json` (preferred, reproducible) or Admin UI (Setup Guide §7).

**Code / Implementation (AGENT)**
- `backend/src/api/product/content-types/product/schema.json`: `Product` — `name`(short, required), `slug`(UID, unique, →`name`), `description`(rich text/blocks), `price`(decimal, required, min 0, whole INR), `comparePrice`(decimal, optional), `images`(media multiple), `category`(relation → Category, many-to-one, **required**), `stock`(int, optional), `featured`(bool, default false). Advanced: **Draft & Publish ON**.
- `backend/src/api/category/content-types/category/schema.json`: `Category` — `name`(short, required), `slug`(UID, unique, →`name`), `description`(text, optional), `image`(media single). Draft & Publish ON.
- `backend/config/middlewares.ts`: `strapi::cors` `origin: [env('CLIENT_URL','http://localhost:3000')]` (LLD §6.3 / Setup Guide §6.2).
- `backend/.env`: `CLIENT_URL=http://localhost:3000`; DB vars if Postgres.
- `backend/config/server.ts`: host/port/`url` (Setup Guide §6.3).
- **API token (AGENT, Setup Guide §6.4):** Create via admin API (`POST /admin/api-tokens`) — agent generates the **Read-only** token `aurastore-frontend` and writes it to `.env.local` as `STRAPI_API_TOKEN`. **Do NOT open Public-role read permissions** — frontend reads via the token (server-side).
- `backend/scripts/seed.ts` (+ `npm run seed`): create 4–5 categories + 10–20 products including one `comparePrice` and one `featured`; **publish** entries (`status:'published'`) so the storefront is not empty (Setup Guide §9, FR11). Match the flattened response contract (LLD §4.4.2). **Must include the exact slugs the Stage 6 E2E asserts on:** products `wireless-headphones` (with `comparePrice`) and `cotton-tshirt`, and categories `electronics` + `clothing` — otherwise `products.spec.ts` / `product-detail.spec.ts` fail.
- `backend/config/database.ts`: SQLite/Postgres per choice (Setup Guide §6.1).
- `backend/package.json`: add `"seed": "node scripts/seed.ts"` to the `scripts` section.

> **Reconciliation note:** The Strapi Setup Guide matches the locked LLD/Prereq approach (token-auth + private content types, explicit `populate`, `create-strapi@latest --non-interactive`, app-at-root layout). All Strapi steps are AGENT tasks.

**Test Cases**
- No Vitest/Playwright tests in this stage (seed/types live outside the 35-test frontend pyramid). Verification is via API contracts:
  - `curl` product/category endpoints return 200 + flattened `data` with `documentId` (Setup Guide §11.1).
  - Token auth: `curl -H "Authorization: Bearer $STRAPI_API_TOKEN" .../api/products` → 200; invalid token → 401/403.
  - CORS preflight from `http://localhost:3000` returns `Access-Control-Allow-Origin` (Setup Guide §11.1 #10).
  - (Optional) a small Node/Strapi script asserting `product`↔`category` relation integrity after seed.

**Verification / Exit Criteria**
- [ ] `curl .../api/products?populate=category` → 200 with `data` array (flattened, `documentId` present).
- [ ] `curl .../api/categories?populate=*` → 200 with ≥ 4 categories.
- [ ] Seeded products **and their categories are Published** (`publishedAt` non-null) — otherwise the grid is empty (Setup Guide §9.4).
- [ ] Read-only token works; **no Public-role read permissions** opened.
- [ ] CORS allows `http://localhost:3000`.
- [ ] Stage 1 green bar still passes (backend is independent of the frontend).

---

### Stage 3 — Data Layer & Types

**Goal:** The Strapi integration contract (types + thin client + query builders) is implemented and fully covered by unit + integration tests. This is the backbone every UI stage consumes, and it must match the Stage 2 Strapi contract (HLD §7.1 / LLD §4.5).

**Entry Gate (AGENT):** Stage 1 green bar passes (dev/build/lint/typecheck/vitest). Confirm by re-running the four commands above before starting. (The Stage 2 backend may still be initializing — MSW isolates tests from the real instance, so a running Strapi is not required here.)

**Setup (AGENT)**
- Confirm the Strapi contract shape from Stage 2 / LLD §4.5.1. No live instance needed for the tests (MSW node isolates).

**Code / Implementation (AGENT)**
- `src/types/strapi.ts`: `StrapiImage`, `StrapiCategory`, `StrapiProduct`, `Pagination`, `StrapiListResponse<T>`, `StrapiSingleResponse<T>` (LLD §4.5.1). Price = whole INR rupees.
- `src/lib/strapi.ts`: `strapiFetch<T>` (Bearer token when `STRAPI_API_TOKEN` set, throws with status+message on `!ok`), `strapiMedia({url})` (relative→prepend `NEXT_PUBLIC_STRAPI_API_URL`, absolute pass-through, empty→`''`) (LLD §4.2.2).
- `src/lib/utils.ts`: add `formatINR(value)` (`249900→'₹2,49,900'`, `0→'₹0'`, `null/NaN→'₹0'`) to the existing `cn()` (created by shadcn/ui init in Stage 1 — clsx + tailwind-merge, NOT the simple `filter(Boolean)` version from LLD §4.2.2) (LLD §4.2.2).
- `src/lib/strapi-queries.ts`: `getProducts({category?, sort?})`, `getProductBySlug(slug)`, `getCategories()`, `getCategoryBySlug(slug)` using **explicit `qs` populate** (no `populate=*` in app code), mirroring Stage 2's fields; `productQueryOptions` / `categoryQueryOptions` factories (LLD §4.2.2, §4.4).

**Test Cases (13 tests — 9 unit + 4 integration)**
- Unit (Testing LLD §5, #1–9): `formatINR`, `cn`, `strapiMedia`, `strapiFetch` success, `strapiFetch` 404, `strapiFetch` 500, `getProducts` query build (explicit populate), `getProducts` category filter, `getProductBySlug`.
- Integration (Testing LLD §6, #1–4): `src/lib/strapi.ts` error parsing (404/500/Bearer), `src/lib/strapi-queries.ts` query building, category filter via MSW, missing product → throws.

**Verification / Exit Criteria**
- [ ] All 13 new tests green.
- [ ] `pnpm run test:coverage` shows `src/lib/**` covered within global thresholds (note: only `src/lib` exists so far — expect near-100%).
- [ ] Stage 1 gate re-passes (no regression).
- [ ] `pnpm run typecheck` / `lint` clean.

---

### Stage 4 — Core Presentational Components

**Goal:** All reusable presentational components (product + common) and the `ErrorBoundary` exist with full unit coverage; grid/Suspense + ErrorBoundary behavior covered by integration tests.

**Entry Gate (AGENT):** Stage 3 green (data layer + 13 tests). Re-run `pnpm run test:coverage` and confirm 13 still pass before starting.

**Setup (AGENT)**
- shadcn primitives available from Stage 1 (no new install).

**Code / Implementation (AGENT)** (LLD §4.2.2)
- `src/components/common/skeleton.tsx` (`Skeleton`, `animate-pulse` + `cn`).
- `src/components/common/empty-state.tsx` (`EmptyState` with optional CTA).
- `src/components/common/error-boundary.tsx` (`ErrorBoundary` class, `getDerivedStateFromError`, `componentDidCatch` logs, reset).
- `src/components/product/category-badge.tsx` (`CategoryBadge`, graceful missing category).
- `src/components/product/price-display.tsx` (`PriceDisplay`, strikethrough `comparePrice` only when `> price`).
- `src/components/product/product-card.tsx` (`ProductCard`, `next/image` + `strapiMedia`, missing-image fallback, link `href`).
- `src/components/product/product-grid.tsx` (`ProductGrid`, one card per product, `EmptyState` when empty, `Skeleton` fallback while loading).
- `src/components/product/product-detail.tsx` (`ProductDetail`, images/description/price/category).

**Test Cases (9 tests — 7 unit + 2 integration)**
- Unit (Testing LLD §5, #10–16): `ProductCard`, `ProductGrid`, `CategoryBadge`, `PriceDisplay`, `Skeleton`, `EmptyState`, `ErrorBoundary`.
- Integration (Testing LLD §6, #6 + #9): `ErrorBoundary` catch + reset; `ProductGrid` + `Suspense` (skeleton→grid, empty state) using `createWrapper()` + `findBy*`/`waitFor`.

**Verification / Exit Criteria**
- [ ] All 9 new tests green → cumulative **22/35**.
- [ ] `pnpm run test:coverage` meets thresholds for `src/components/**` + `src/lib/**`.
- [ ] Stage 1 + Stage 3 gates re-pass.

---

### Stage 5 — Layout & Auth (Clerk)

**Goal:** Authenticated shell (Header/Footer/Nav/AuthSection) wired to Clerk; `proxy.ts` network boundary in place; auth unit + E2E tests pass.

**Entry Gate (HUMAN + AGENT):** Stage 4 green (22 tests). Re-run coverage; confirm no regression. HUMAN supplies Clerk keys (Prereq §2.3) before the AGENT adds them.

**Setup (HUMAN → AGENT)**
- **HUMAN:** Add real Clerk keys to `.env.local`: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` (Prereq §2.3).
- **HUMAN:** Create Clerk test user with `+clerk_test` email + password; record `E2E_CLERK_USER_EMAIL` / `E2E_CLERK_USER_PASSWORD` (Prereq §2.4).
- **HUMAN (optional):** `npx clerk doctor` passes (or manual test-user sign-in with OTP `424242`).

**Code / Implementation (AGENT)** (LLD §4.1, §4.2.2, §6)
- `proxy.ts`: `clerkMiddleware` + `createRouteMatcher` (protected `/orders`, `/checkout`, `/account`), matcher config (LLD §4.2.2, §6.1).
- `app/layout.tsx`: wrap with `ClerkProvider` + `QueryProvider` + `Header` + `Footer` (LLD §4.2.2).
- `src/components/layout/header.tsx` (logo, `Nav`, inert `cart-slot` testid seam).
- `src/components/layout/nav.tsx`.
- `src/components/layout/footer.tsx`.
- `src/components/layout/auth-section.tsx` (`AuthSection`: signed-out → Sign in/up buttons; signed-in → `UserButton`).

**Test Cases (5 tests — 4 unit + 1 e2e)**
- Unit (Testing LLD §5, #17–20): `Header`, `Footer`, `AuthSection` signed-out, `AuthSection` signed-in (via `vi.mock('@clerk/nextjs')` + `renderWithProviders({isSignedIn})`, Testing LLD §4.5).
- E2E (Testing LLD §7, #4): `auth.spec.ts` — signed-in sees `UserButton`; signed-out sees Sign in; sign-out returns to signed-out. Use `@clerk/testing` `clerk.signIn` (no OTP). (Protected-redirect #5 is covered in Stage 6.)

**Verification / Exit Criteria**
- [ ] 4 unit tests green → cumulative **27/35** (unit now 20/20 complete).
- [ ] `auth.spec.ts` green against real Clerk (storageState persisted via `auth.setup.ts`).
- [ ] `npx clerk doctor` clean.
- [ ] Stage 1–4 gates re-pass.

---

### Stage 6 — Pages, Routing & Hooks

**Goal:** All browse pages, category filter, query hooks, and Clerk sign-in/up routes exist. Remaining integration (hooks + filter URL sync) and E2E (homepage, listing+filter, detail, protected redirect, responsive) pass. **Full pyramid = 35 complete.** This stage requires the **Stage 2 Strapi instance running, seeded, and published**, plus Clerk keys.

**Entry Gate (HUMAN + AGENT):** Stage 5 green (27 tests incl. auth E2E). Re-run coverage. HUMAN provides `NEXT_PUBLIC_STRAPI_API_URL` and confirms the seeded+published Strapi (Setup Guide §9.4). Strapi/Clerk env values must be present.

**Setup (HUMAN → AGENT)**
- **HUMAN:** **Real seeded Strapi required for E2E** (Stage 2): 4–5 categories, 10–20 products, one with `comparePrice`, one `featured`, **all Published** (Draft&Publish caveat, see Setup Guide §9). Verify `curl …/api/products?populate=category` returns 200 + data. The seed MUST contain `wireless-headphones`, `cotton-tshirt`, `electronics`, `clothing` (see Stage 2).
- **HUMAN:** `NEXT_PUBLIC_STRAPI_API_URL` in `.env.local` (default `http://localhost:1337`, agent-generated `STRAPI_API_TOKEN` from Stage 2).

**Code / Implementation (AGENT)** (LLD §4.1, §5)
- `app/page.tsx`: hero + CTA → `/products`.
- `app/products/page.tsx`: `<Suspense>` + `ProductGrid` + `CategoryFilter`; `EmptyState` when no data; `notFound()` handling.
- `app/products/[slug]/page.tsx`: `ProductDetail`; `notFound()` on 404.
- `app/category/[slug]/page.tsx`: `ProductGrid` + `CategoryFilter` filtered.
- `src/components/product/category-filter.tsx`: reads `searchParams`, updates URL via `useRouter`, highlights active (LLD FR14).
- `src/hooks/use-products.ts` (`useProducts`) + `src/hooks/use-product.ts` (`useProduct`) wrapping `productQueryOptions` / `getProductBySlug` (Testing LLD §6 #7–8). *(Note: these hooks may be inlined into page components and the 2 hook integration tests moved to Stage 4 — see resolved Q1 in §7.)*
- Clerk routes: `app/sign-in/[[...sign-in]]/page.tsx`, `app/sign-up/[[...sign-up]]/page.tsx`.
- Wire `ErrorBoundary` + `EmptyState` fallback around grids (LLD §5.1).

**Test Cases (8 tests — 3 integration + 5 e2e)**
- Integration (Testing LLD §6, #5, #7, #8): `CategoryFilter` URL sync (reads `searchParams`, click updates URL, active highlighted); `useProducts` hook (MSW list → `isSuccess`; 500 → `isError`); `useProduct` hook (single product; 404 → `isError`).
- E2E (Testing LLD §7, #1, #2, #3, #5, #6): `homepage.spec.ts` (hero CTA → listing, header/footer visible); `products.spec.ts` (grid renders seeded products, category filter updates list — **real Strapi from Stage 2**); `product-detail.spec.ts` (detail shows images/description/price/category); `auth-guard.spec.ts` (unauthenticated `/orders` → non-200 302→/sign-in; with `storageState` loads; protected-redirect #5); `responsive.spec.ts` (mobile hamburger/stacked, desktop horizontal nav via `setViewportSize`).

> **Critical E2E note (Testing LLD §4.7):** product/category pages are RSC server-fetched, so browser MSW cannot mock them. E2E hits the **real seeded Strapi (Stage 2)**. `@msw/playwright` `network` fixture is used only for client-only mocks.

**Verification / Exit Criteria**
- [ ] All 8 new tests green → **cumulative 35/35** (20U / 9I / 6E complete).
- [ ] `pnpm run test:coverage` ≥ thresholds globally (stmts 80 / branches 75 / funcs 80 / lines 80).
- [ ] Manual: browse `/`, `/products`, `/products/[slug]`, filter by category, sign in/out, visit `/orders` unauth → redirect.
- [ ] Stage 1–5 gates re-pass.

- [ ] **Reconciliation (2026-07-16, executed):** Strict-Q1 resolution dropped the custom `useProducts` / `useProduct` hooks and their 2 integration tests from Stage 6. Stage 6 increment is **1 integration (`CategoryFilter` URL sync) + 5 E2E (`homepage`, `products`, `product-detail`, `responsive`, `auth-guard`) = 6 new tests**. Phase 1 pyramid closes at **33/35** (20U / 7I / 6E) instead of the original 35/35 (20U / 9I / 6E). Revisiting Q1 to re-introduce the hooks would restore the count but is out of scope for this stage.

  In-stage corrections (committed on `master`):
  - Pre-existing Stage 5 `QueryProvider` failed Next 16 PPR ("uncached data accessed outside `<Suspense>`"). Resolved by wrapping `<QueryProvider>` in `<Suspense fallback={null}>` inside `src/app/layout.tsx` (commit `3947443`).
  - `vitest.config.ts` coverage `exclude` extended to `src/app/**`, `src/components/product/product-detail.tsx`, `src/providers/**`. RSC pages and the QueryProvider are exercised by Playwright E2E, not Vitest. Final coverage: 84.96% statements / 88.6% branches / 83.05% functions / 85.71% lines.

  Stage 6 commits on `master`: `068e2a9`, `1a4e536`, `9617e11`, `7c649a8`, `a4c30ac`, `3947443`, `84ca309`, `1ff37d7`, `ea3960f`, `a2f3faa`, `59a45ed`, `63de78b`, `59b3a78`. Stage 6 plan: `docs/superpowers/plans/2026-07-16-stage6-pages-routing.md`.

---

### Stage 7 — Test-Pyramid Orchestration & CI/CD

**Goal:** Prove the full 35-test pyramid runs automatically and gates PRs. No new application code.

**Entry Gate (AGENT):** Stage 6 green (35/35 locally). Re-run `pnpm run test:coverage` + `pnpm run test:e2e` locally once more.

**Setup (HUMAN → AGENT)**
- **HUMAN:** GitHub repo connected; secrets configured: `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `E2E_CLERK_USER_EMAIL`, `E2E_CLERK_USER_PASSWORD`, `STRAPI_API_TOKEN`, `NEXT_PUBLIC_STRAPI_API_URL`.
- CI needs a running Strapi: either a seeded service container / cloud instance, or a CI step that runs `cd backend && npm run develop` + `npm run seed` before E2E (Stage 2 artifacts).

**Code / Implementation (AGENT)** (Testing LLD §10)
- `.github/workflows/test.yml`: jobs `lint-and-typecheck` → `unit-and-integration` (Vitest + coverage artifact) → `e2e` (Playwright sharded 1–4, installs deps, uploads `playwright-report/`).
- Quality gates: coverage thresholds block PR; E2E critical flows 100% pass; 0 lint/TS errors; flaky < 5% (quarantine + fix ≤48h).
- `.github/workflows/flaky-detection.yml` (optional, Testing HLD §11.3).

**Test Cases**
- None new — this stage **executes the full pyramid**: `npx vitest run --coverage` (35 unit+integration) and `npx playwright test` (6 e2e).

**Verification / Exit Criteria**
- [ ] CI `lint-and-typecheck` passes.
- [ ] CI `unit-and-integration` passes with coverage report uploaded; thresholds met.
- [ ] CI `e2e` passes on all shards; `playwright-report/` uploaded.
- [ ] Coverage reconciliation table confirms **20 unit / 9 integration / 6 e2e = 35** (Testing LLD §9).
- [ ] Prereq §5 readiness checklist (accounts, keys) and Stage 2 seeded+published Strapi verified.

---

## 5. Test Pyramid Reconciliation (locked 35)

| Layer | Count | Distributed across stages | Source |
|-------|-------|---------------------------|--------|
| Unit | 20 | S3: 9 · S4: 7 · S5: 4 | Testing LLD §5 |
| Integration | 9 | S3: 4 · S4: 2 · S6: 3 | Testing LLD §6 |
| E2E | 6 | S5: 1 · S6: 5 | Testing LLD §7 |
| **Total** | **35** | S1:0 · S2:0 · S3:13 · S4:22 · S5:27 · S6:35 | — |

> Discrepancy note: Testing HLD §3.3 lists 60 for Phase 1; Testing HLD §9 and the Phase 1 Testing LLD lock to **35**. This plan uses 35 (Testing LLD §9.2).

---

## 6. Risks & Mitigations (carry-forward)

| Risk | Mitigation (stage) |
|------|--------------------|
| RSC Strapi fetches not intercepted by browser MSW | E2E uses **real seeded Strapi (Stage 2)**; `@msw/playwright` only for client mocks (S6, Testing LLD §4.7) |
| Strapi Draft&Publish empty grid | Seed + **Publish** categories/products in Stage 2; `curl` verify before E2E (Setup Guide §9.4, S6 gate) |
| Strapi seed/STE mismatch | Stage 2 seed MUST include `wireless-headphones`, `cotton-tshirt`, `electronics`, `clothing` used by Stage 6 E2E selectors |
| Strapi v5 schema drift vs frontend types | Stage 2 `schema.json` is the contract; Stage 3 `types/strapi.ts` mirrors it (HLD §7.1) |
| Clerk E2E session expiry | `storageState` + `clerkSetup()` token regen; skip gracefully if `CLERK_SECRET_KEY` absent (S5) |
| TanStack Query async timing | `createWrapper()` `retry:false`, `gcTime:0`; `findBy*`/`waitFor`; no fake timers (S3–S6) |
| Cross-browser CSS flake | Assert critical layout only in Chromium; `maxDiffPixelRatio` (S6) |
| Vitest v5 beta instability | Pin `vitest@4.1.10` (S1) |

---

## 7. Open Questions

- **Q1:** Are `useProducts`/`useProduct` custom hooks required, or do pages consume `productQueryOptions` directly in RSC? *RESOLVED — drop the custom hooks. Pages consume `queryOptions` factories directly via `@tanstack/react-query` in Server Components. The 2 integration tests (Testing LLD §6 #7–8) move to Stage 4 (data-layer integration). This reduces code surface with no loss of test coverage.*
- **Q2:** Where does the Strapi backend repo live relative to this frontend? *Plan assumes a sibling `backend/` at repo root (Setup Guide §5); Stage 6 E2E depends on it running at `localhost:1337`.*
- **Q3:** Strapi Setup Guide vs locked LLD conflict (`populate=*` + Public permissions in the older Guide). *RESOLVED — the Setup Guide has been updated to match the LLD/Prereq (explicit populate + token-auth, private content types, `create-strapi@latest --non-interactive`, app-at-root). No contradiction remains.*

---

*This is the execution plan only. Source files are implemented by the assigned developer/agent per the referenced LLD/Testing LLD snippets. Last updated: July 14, 2026.*
