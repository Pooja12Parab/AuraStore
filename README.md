# AuraStore — The Modern Consumer App

A full-stack, production-grade e-commerce reference application built as a **monorepo** with two coordinated workspaces:

- **Frontend:** Next.js 16 (App Router, React 19, Tailwind v4, shadcn/ui) — a server-rendered storefront with Clerk authentication, TanStack Query data layer, and a complete test pyramid (Vitest unit/integration + Playwright E2E).
- **Backend:** Strapi v5 — a headless CMS that exposes a token-authenticated `Product` / `Category` catalog consumed by the storefront through an explicit `populate` contract.

> **Status:** Phase 1 — Basic / MVP (auth, product catalog, browsing, responsive layout). Cart, checkout, payment, search, wishlist, and dark mode are intentionally out of scope.

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Repository Structure](#repository-structure)
4. [Prerequisites](#prerequisites)
5. [Quick Start](#quick-start)
6. [Environment Variables](#environment-variables)
7. [Running the App](#running-the-app)
8. [Testing](#testing)
9. [Architecture & Data Contract](#architecture--data-contract)
10. [Project Documentation](#project-documentation)
11. [Available Scripts](#available-scripts)
12. [Troubleshooting](#troubleshooting)
13. [License & Contributing](#license--contributing)

---

## Features

- **Clerk authentication** with email + password, protected routes (`/orders`, `/checkout`, `/account`), and Clerk middleware (`proxy.ts`).
- **Product catalog** served from Strapi v5 with flattened v5 response shape, explicit `qs` populate, and read-only server-side API token.
- **Server-rendered pages** with Partial Prerendering (`cacheComponents: true`), Suspense boundaries, and `ErrorBoundary` fallbacks.
- **TanStack Query** for client-side caching and revalidation of catalog data.
- **Responsive layout** — mobile hamburger / stacked navigation, desktop horizontal nav, verified via Playwright viewports.
- **Category filter** with URL search-param synchronization (`/products?category=electronics`).
- **shadcn/ui** primitives styled with Tailwind v4 (CSS-first config, no `tailwind.config.js`).
- **Full test pyramid** — 20 unit + 9 integration + 6 E2E = **35 tests** with coverage gates (statements ≥ 80, branches ≥ 75, funcs ≥ 80, lines ≥ 80).
- **MSW** for node + browser test isolation, **Playwright** for end-to-end flows against a real seeded Strapi instance.

---

## Tech Stack

### Frontend (repo root)

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | [Next.js](https://nextjs.org) (App Router, Turbopack, PPR) | 16.2+ |
| Runtime | React / React DOM | 19.2 |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS (CSS-first) | 4.x |
| Components | shadcn/ui + Radix (Base UI) | latest |
| Auth | [Clerk](https://clerk.com) (`@clerk/nextjs`, `clerkMiddleware`) | 7.x |
| Data | [TanStack Query](https://tanstack.com/query) (`@tanstack/react-query`) | 5.x |
| Query strings | `qs` | 6.x |
| Unit / integration tests | [Vitest](https://vitest.io) + Testing Library + MSW | 4.1.10 (pinned) |
| E2E tests | [Playwright](https://playwright.dev) + `@msw/playwright` | 1.6x |
| Lint / format | ESLint (`eslint-config-next`) | 9.x |
| Package manager | pnpm | 9.x+ |

### Backend (`backend/`)

| Layer | Technology | Version |
|-------|-----------|---------|
| CMS | [Strapi](https://strapi.io) | 5.50.x |
| Database (dev) | SQLite (`better-sqlite3`) | bundled |
| Database (prod-like) | PostgreSQL (`pg`) | 8.x |
| Seed runner | `tsx` | 4.x |
| Language | TypeScript | 5.x |

### External services

- **Clerk** — authentication (dev instance, `pk_test_` / `sk_test_` keys).
- **Strapi Cloud** (optional) — managed Strapi hosting for production.

---

## Repository Structure

```
AuraStore_Ecommerce/
├── src/                          # Next.js frontend (App Router)
│   ├── app/                      # Routes (home, /products, /products/[slug], /category/[slug], /sign-in, /sign-up)
│   ├── components/               # UI components
│   │   ├── common/               # Skeleton, EmptyState, ErrorBoundary
│   │   ├── layout/               # Header, Footer, Nav, AuthSection
│   │   ├── product/              # ProductCard, ProductGrid, ProductDetail, PriceDisplay, CategoryBadge, CategoryFilter
│   │   └── ui/                   # shadcn primitives (button, etc.)
│   ├── lib/                      # strapi.ts (HTTP client), strapi-queries.ts, utils.ts (cn, formatINR)
│   ├── providers/                # QueryProvider (TanStack)
│   ├── types/                    # Strapi v5 type contracts (StrapiProduct, StrapiCategory, etc.)
│   └── __tests__/                # Vitest specs (unit + integration) + MSW mocks + test helpers
│
├── backend/                      # Strapi v5 CMS
│   ├── config/                   # server.ts, middlewares.ts, database.ts, plugins.ts
│   ├── src/api/
│   │   ├── product/              # Product content type (schema.json)
│   │   └── category/             # Category content type (schema.json)
│   ├── scripts/seed.ts           # Idempotent seed: 4–5 categories, 10–20 products
│   └── .env                      # Strapi env (DB, CLIENT_URL, admin secrets, API token)
│
├── e2e/                          # Playwright E2E specs
│   ├── auth.setup.ts             # Clerk storageState bootstrap
│   ├── auth.spec.ts              # Sign-in / sign-out flows
│   ├── auth-guard.spec.ts        # Protected route redirects
│   ├── homepage.spec.ts          # Landing page
│   ├── products.spec.ts          # Listing + category filter (real Strapi)
│   ├── product-detail.spec.ts    # Detail page
│   └── responsive.spec.ts        # Mobile / desktop viewports
│
├── docs/                         # Engineering documentation
│   ├── workspace/                # HLD, Requirements, Testing HLD
│   ├── workspace/phase_1/        # Phase 1 LLD, Testing LLD, Prerequisites, Implementation Plan
│   └── guides/                   # AuraStore_Strapi_Setup_Guide.md
│
├── playwright.config.ts          # Playwright projects: setup, chromium-auth, chromium-unauth, firefox, webkit
├── vitest.config.ts              # Vitest projects: unit (node) + component (jsdom)
├── proxy.ts                      # Clerk middleware (Next 16 renames middleware.ts → proxy.ts)
├── next.config.ts                # cacheComponents: true, images.remotePatterns
├── .env.local.example            # Frontend env template
└── package.json                  # Frontend scripts and dependencies
```

---

## Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | **22.x** | Required by Next.js 16. Verify with `node -v`. |
| pnpm | 9.x+ | Used throughout the repo. Install with `npm i -g pnpm`. |
| Free ports | `3000` (Next.js), `1337` (Strapi) | Stop anything bound to these. |
| Clerk account | Dev instance | Free tier is fine. Dev keys start with `pk_test_` / `sk_test_`. |
| Git | 2.x+ | For cloning and version control. |

> **Optional:** [Clerk CLI](https://clerk.com/docs/references/nextjs/overview) for `clerk doctor` / `clerk auth login` — `npm i -g @clerk/clerk`.

### One-time external setup (Clerk)

1. Create a free application at [dashboard.clerk.com](https://dashboard.clerk.com) named **AuraStore** (must be in **Development** mode).
2. Enable **Email + Password** under *User & authentication*.
3. Copy the **Publishable Key** (`pk_test_…`) and **Secret Key** (`sk_test_…`) — the secret key is shown once.
4. **Create the E2E test user** with an email containing the `+clerk_test` suffix, e.g. `aurastore+clerk_test@example.com`. Per Clerk's documented test-account contract, any `+clerk_test` address uses the fixed OTP `424242`, never sends real email/SMS, and bypasses MFA. Record the email and password as `E2E_CLERK_USER_EMAIL` / `E2E_CLERK_USER_PASSWORD`.

> A test user **without** `+clerk_test` triggers real OTP and may require MFA — that is the failure mode to avoid.

---

## Quick Start

> Run these commands from the **repository root** unless stated otherwise. The frontend and backend are independent workspaces — install each separately.

### 1. Clone & install the frontend

```bash
git clone <your-repo-url> AuraStore_Ecommerce
cd AuraStore_Ecommerce
pnpm install
```

### 2. Install & start the Strapi backend (separate terminal)

```bash
cd backend
npm install
npm run develop
```

On first run, Strapi opens `http://localhost:1337/admin` and asks for the first admin user. Create one, then come back to the terminal.

### 3. Generate a read-only API token in Strapi

1. Sign in to `http://localhost:1337/admin`.
2. Go to **Settings → API Tokens → Create new API Token**.
3. Name: `aurastore-frontend` · Type: **Read-only** · Duration: *Unlimited*.
4. Copy the token (shown once) into `.env.local` as `STRAPI_API_TOKEN` (see next step).
5. **Do not** grant the *Public* role any read permission — the frontend always authenticates server-side with the token.

### 4. Configure frontend env

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and fill in **all** Clerk keys, the `+clerk_test` credentials, the Strapi URL, and the API token you just generated.

### 5. Seed the catalog

```bash
cd backend
npm run seed
```

The seed creates 4–5 categories and 10–20 products (all **Published**) including the slugs `wireless-headphones`, `cotton-tshirt`, `electronics`, and `clothing` — these are required by the E2E specs.

### 6. Start the frontend

```bash
cd ..          # back to repo root
pnpm dev
```

Visit **http://localhost:3000**.

---

## Environment Variables

All frontend env vars live in `.env.local` (git-ignored). See `.env.local.example` for the full template.

| Variable | Visibility | Purpose | Required |
|----------|-----------|---------|----------|
| `NEXT_PUBLIC_STRAPI_API_URL` | Public | Base URL of Strapi (default `http://localhost:1337`). | Yes |
| `STRAPI_API_TOKEN` | **Server-only** | Read-only API token from Strapi (created in Step 3). | Yes |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Public | Clerk publishable key (`pk_test_…`). | Yes |
| `CLERK_SECRET_KEY` | **Server-only** | Clerk secret key (`sk_test_…`). | Yes |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Public | Sign-in route (default `/sign-in`). | No |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Public | Sign-up route (default `/sign-up`). | No |
| `E2E_CLERK_USER_EMAIL` | **Server-only (test)** | The `+clerk_test` email used by Playwright. | Yes (for E2E) |
| `E2E_CLERK_USER_PASSWORD` | **Server-only (test)** | Password for the `+clerk_test` user. | Yes (for E2E) |

Strapi's own `.env` lives in `backend/.env` and includes `CLIENT_URL`, `APP_KEYS`, `ADMIN_JWT_SECRET`, `API_TOKEN_SALT`, `TRANSFER_TOKEN_SALT`, `JWT_SECRET`, database credentials, and (for Postgres) `DATABASE_URL`.

---

## Running the App

Two processes must be running for the storefront to render products:

| Service | Command (cwd) | Port | URL |
|---------|--------------|------|-----|
| Strapi | `npm run develop` (in `backend/`) | 1337 | http://localhost:1337/admin |
| Next.js | `pnpm dev` (in repo root) | 3000 | http://localhost:3000 |

Start **Strapi first** so the seed has time to commit before the frontend boots.

### Routes

| Route | Description | Auth |
|-------|-------------|------|
| `/` | Landing page with hero + CTA → `/products` | Public |
| `/products` | Product grid with `CategoryFilter` (URL-synced) | Public |
| `/products/[slug]` | Product detail page (404 on missing slug) | Public |
| `/category/[slug]` | Filtered product grid | Public |
| `/sign-in`, `/sign-up` | Clerk-hosted auth flows | Public |
| `/orders`, `/checkout`, `/account` | Placeholders | **Protected** (redirects to `/sign-in`) |

### Production build

```bash
pnpm build          # builds the frontend (PPR enabled)
pnpm start          # serves the production build on :3000

cd backend && npm run build && npm run start   # Strapi production mode
```

---

## Testing

The repo ships with a **35-test pyramid** (20 unit / 9 integration / 6 E2E) with coverage gates. All commands run from the **repo root**.

### Unit + integration (Vitest)

```bash
pnpm test                 # run everything once
pnpm test:unit            # pure-logic specs (*.unit.test.ts), node env
pnpm test:integration     # component + hook specs (*.test.tsx), jsdom env
pnpm test:coverage        # run with v8 coverage report (HTML + JSON)
```

Vitest is configured with two projects in `vitest.config.ts`:

- **unit** — Node environment, `*.unit.test.ts` suffix, no DOM.
- **component** — jsdom environment, `*.test.ts(x)`, includes MSW + `@testing-library/react`.

Coverage thresholds are enforced by `vitest.config.ts`:

| Metric | Threshold |
|--------|-----------|
| Statements | ≥ 80 % |
| Branches | ≥ 75 % |
| Functions | ≥ 80 % |
| Lines | ≥ 80 % |

Excluded from coverage: `src/app/**` (RSC, exercised by Playwright), `src/components/ui/**` (shadcn primitives), `src/providers/**`, `src/components/product/product-detail.tsx`.

### End-to-end (Playwright)

```bash
pnpm test:e2e             # headless run across chromium-auth, chromium-unauth, firefox, webkit
pnpm test:e2e:ui          # interactive UI mode
```

`playwright.config.ts` defines four projects:

- **setup** — runs `auth.setup.ts` once, persists Clerk `storageState`.
- **chromium-auth** — Desktop Chrome with authenticated state (skips `auth.spec.ts`).
- **chromium-unauth** — Desktop Chrome, no auth (runs `auth.spec.ts`).
- **firefox** / **webkit** — cross-browser sanity (auth state).

The config auto-starts `pnpm dev` as a `webServer` (skipped if `:3000` is already serving). For E2E to work, Strapi must be running on `:1337` with the seeded + published catalog.

Install browsers once: `npx playwright install --with-deps`.

### Lint & typecheck

```bash
pnpm lint
pnpm typecheck
```

Both must return zero errors before merging.

---

## Architecture & Data Contract

### Why a monorepo (not `frontend/` + separate backend repo)?

The Phase 1 design treats Strapi as an **in-scope implementation deliverable** (see the [Implementation Plan](./docs/workspace/phase_1/AuraStore_Phase1_Implementation_Plan.md)), not as an opaque external service. Co-locating the two keeps the type contract (`src/types/strapi.ts` ↔ `backend/src/api/*/schema.json`) under one review surface and lets CI run the full pipeline (seed Strapi → start Next → run Playwright) in a single workflow.

### Strapi v5 contract

- **Response shape:** Strapi v5 returns **flattened** objects (`data.attributes` is collapsed into `data`), unlike v4. The frontend types in `src/types/strapi.ts` mirror this directly.
- **Population:** All frontend queries use **explicit `qs` populate** (e.g. `populate=category`, `populate=images`). `populate=*` is forbidden in app code — it is allowed only for ad-hoc human verification (`curl http://localhost:1337/api/products?populate=category`).
- **Authentication:** Frontend uses a **read-only API token** sent as `Authorization: Bearer …` from server-side code (`src/lib/strapi.ts`). No content type is exposed via the *Public* role.
- **Draft & Publish:** Strapi content types have D&P enabled. The seed script explicitly publishes every entry; otherwise the storefront renders empty.

### Frontend data flow

```
Server Component (RSC)
        ↓  productQueryOptions / getProductBySlug
src/lib/strapi-queries.ts
        ↓  explicit qs populate
src/lib/strapi.ts (strapiFetch, Bearer token)
        ↓
Strapi v5 (localhost:1337)
```

Client components consume cached data via `@tanstack/react-query`'s `HydrationBoundary` / `QueryClient`. There are no custom `useProducts` / `useProduct` hooks — pages use the query-options factories directly.

### Key implementation files

| Concern | File |
|---------|------|
| Clerk middleware | [`proxy.ts`](./proxy.ts) |
| Next.js config (PPR + image hosts) | [`next.config.ts`](./next.config.ts) |
| Strapi HTTP client | [`src/lib/strapi.ts`](./src/lib/strapi.ts) |
| Query builders | [`src/lib/strapi-queries.ts`](./src/lib/strapi-queries.ts) |
| Type contracts | [`src/types/strapi.ts`](./src/types/strapi.ts) |
| QueryProvider | [`src/providers/query-provider.tsx`](./src/providers/query-provider.tsx) |
| Root layout (ClerkProvider + QueryProvider) | [`src/app/layout.tsx`](./src/app/layout.tsx) |
| Strapi seed | [`backend/scripts/seed.ts`](./backend/scripts/seed.ts) |

---

## Project Documentation

This README is the **entry point**. Detailed design and execution docs live under `docs/`:

| Doc | Path | Purpose |
|-----|------|---------|
| High-Level Design | [`docs/workspace/AuraStore_HLD.md`](./docs/workspace/AuraStore_HLD.md) | Architecture, system context, stack rationale |
| Requirements | [`docs/workspace/AuraStore_Requirements.md`](./docs/workspace/AuraStore_Requirements.md) | Functional + non-functional requirements |
| Testing HLD | [`docs/workspace/AuraStore_Testing_HLD.md`](./docs/workspace/AuraStore_Testing_HLD.md) | Test strategy, pyramid, quality gates |
| Phase 1 LLD | [`docs/workspace/phase_1/AuraStore_LLD_Phase1.md`](./docs/workspace/phase_1/AuraStore_LLD_Phase1.md) | Low-level design for Phase 1 |
| Phase 1 Testing LLD | [`docs/workspace/phase_1/AuraStore_Testing_LLD_Phase1.md`](./docs/workspace/phase_1/AuraStore_Testing_LLD_Phase1.md) | Test specs for Phase 1 |
| Phase 1 Prerequisites | [`docs/workspace/phase_1/AuraStore_Prerequisites_Phase1.md`](./docs/workspace/phase_1/AuraStore_Prerequisites_Phase1.md) | Human-only setup checklist |
| Phase 1 Implementation Plan | [`docs/workspace/phase_1/AuraStore_Phase1_Implementation_Plan.md`](./docs/workspace/phase_1/AuraStore_Phase1_Implementation_Plan.md) | 7-stage staged delivery plan |
| Strapi Setup Guide | [`docs/guides/AuraStore_Strapi_Setup_Guide.md`](./docs/guides/AuraStore_Strapi_Setup_Guide.md) | Strapi install, schema, CORS, seed |

---

## Available Scripts

### Frontend (repo root)

| Script | Command | Description |
|--------|---------|-------------|
| `pnpm dev` | `next dev --turbopack` | Start dev server on `:3000` with Turbopack |
| `pnpm build` | `next build` | Production build (PPR enabled) |
| `pnpm start` | `next start` | Serve production build |
| `pnpm lint` | `eslint .` | Lint with `eslint-config-next` |
| `pnpm typecheck` | `tsc --noEmit` | TypeScript check |
| `pnpm test` | `vitest run` | Run all Vitest specs once |
| `pnpm test:unit` | `vitest run --project unit` | Unit specs only |
| `pnpm test:integration` | `vitest run --project component` | Component / integration specs |
| `pnpm test:coverage` | `vitest run --coverage` | Coverage report (HTML + JSON) |
| `pnpm test:e2e` | `playwright test` | Run Playwright across all projects |
| `pnpm test:e2e:ui` | `playwright test --ui` | Playwright interactive UI |

### Backend (`backend/`)

| Script | Command | Description |
|--------|---------|-------------|
| `npm run develop` | `strapi develop` | Dev server with autoReload on `:1337` |
| `npm run start` | `strapi start` | Production server (after `build`) |
| `npm run build` | `strapi build` | Build admin panel |
| `npm run seed` | `tsx scripts/seed.ts` | Seed categories + products (idempotent) |
| `npm run console` | `strapi console` | Interactive Strapi shell |
| `npm run deploy` | `strapi deploy` | Strapi Cloud deploy |

---

## Troubleshooting

### Frontend renders but the product grid is empty

- Confirm Strapi is running on `:1337` (`curl http://localhost:1337/api/products?populate=category`).
- Ensure the seed completed and entries are **Published** (Strapi admin → Content Manager → *Published* toggle).
- Check `STRAPI_API_TOKEN` is set and has **Read-only** permissions; verify with `curl -H "Authorization: Bearer $STRAPI_API_TOKEN" http://localhost:1337/api/products`.

### Clerk sign-in keeps prompting for an OTP / MFA

You probably created the E2E test user **without** the `+clerk_test` email suffix. Delete the user and recreate with an address like `aurastore+clerk_test@example.com`. The fixed OTP is `424242`.

### `pnpm dev` fails with "Port 3000 already in use"

Stop any process bound to port 3000. On Windows PowerShell:

```powershell
Get-NetTCPConnection -LocalPort 3000 | Select-Object OwningProcess
Stop-Process -Id <pid> -Force
```

### `pnpm test:coverage` fails the threshold

Coverage excludes RSC pages, shadcn primitives, `QueryProvider`, and `ProductDetail`. If you added new files, list them in the `coverage.exclude` of `vitest.config.ts` only after wiring real E2E coverage for them.

### Playwright cannot reach `http://localhost:3000`

The `webServer` config in `playwright.config.ts` starts `pnpm dev` automatically in CI mode but reuses an existing server locally. Make sure no stale `next dev` is running on a different port.

### MSW warnings about unhandled requests in Vitest

Check `src/__tests__/mocks/handlers.ts` — every test fetch URL must have a matching handler, or the request will pass through to the real network.

### `populate=*` warning

The frontend contract forbids `populate=*` in app code (see [Architecture](#architecture--data-contract)). Use explicit `populate=category` / `populate=images`.

---

## License & Contributing

This is a reference project. Internal use only at this stage.

**Conventions:**

- All app code lives under `src/` (per `aurastore.src_directory_convention`).
- Never commit `.env` / `.env.local` — they contain secrets.
- Run `pnpm lint && pnpm typecheck && pnpm test:coverage` before opening a PR.
- E2E specs hit a **real seeded Strapi**; do not mock Strapi at the network layer in Playwright (use `@msw/playwright` only for client-only routes).

**Repository layout note:** the Next.js frontend sits at the **repo root** and Strapi lives in `backend/`. Earlier planning docs referenced a `frontend/` subfolder — that was corrected and the layout is now flat.

---

<sub>Built with Next.js 16 · React 19 · Tailwind v4 · shadcn/ui · Clerk v7 · Strapi v5 · Vitest 4 · Playwright 1.6x.</sub>
