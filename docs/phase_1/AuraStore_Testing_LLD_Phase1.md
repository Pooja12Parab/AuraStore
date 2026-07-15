# AuraStore — Testing Low-Level Design (LLD): Phase 1 (Basic/MVP)

> **Project:** AuraStore: The Modern Consumer App
> **Version:** 1.0
> **Status:** Draft
> **Date:** July 14, 2026
> **Document Type:** Testing Low-Level Design (Implementation)
> **Parent Documents:** [AuraStore HLD](../AuraStore_HLD.md) · [AuraStore Testing HLD](../AuraStore_Testing_HLD.md) · [AuraStore Requirements](../AuraStore_Requirements.md) · [AuraStore LLD Phase 1](./AuraStore_LLD_Phase1.md)
> **Phase:** Phase 1 — Basic/MVP (Clerk auth, Strapi product catalog, product browsing, layout)
> **Audience:** Developers, testers

---

## Table of Contents

1. [Document Header](#1-document-header)
2. [Scope & Test Objectives](#2-scope--test-objectives)
3. [Assumptions, Constraints & Test Dependencies](#3-assumptions-constraints--test-dependencies)
4. [Detailed Test Design](#4-detailed-test-design)
   - [4.1 Vitest Configuration](#41-vitest-configuration)
   - [4.2 Test Setup Files](#42-test-setup-files)
   - [4.3 MSW Handlers & Data Factories](#43-msw-handlers--data-factories)
   - [4.4 TanStack Query Test Wrapper](#44-tanstack-query-test-wrapper)
   - [4.5 Clerk Mock for Component Tests](#45-clerk-mock-for-component-tests)
   - [4.6 Playwright Configuration](#46-playwright-configuration)
   - [4.7 Clerk E2E Auth & MSW Playwright Fixtures](#47-clerk-e2e-auth--msw-playwright-fixtures)
5. [Unit Test Specifications (Phase 1)](#5-unit-test-specifications-phase-1)
6. [Integration Test Specifications (Phase 1)](#6-integration-test-specifications-phase-1)
7. [E2E Test Specifications (Phase 1)](#7-e2e-test-specifications-phase-1)
8. [Test Data Strategy (Phase 1)](#8-test-data-strategy-phase-1)
9. [Traceability Matrix & Coverage Reconciliation](#9-traceability-matrix--coverage-reconciliation)
10. [CI/CD, Quality Gates & Reporting](#10-cicd-quality-gates--reporting)
11. [Open Questions, Risks & Discrepancies](#11-open-questions-risks--discrepancies)

---

## 1. Document Header

### 1.1 Purpose

This Testing Low-Level Design defines **how** Phase 1 of AuraStore is tested: the exact toolchain, configurations, fixtures, test data strategy, and per-test specifications for all **35** Phase 1 tests (20 unit / 9 integration / 6 E2E). It translates the Testing HLD and the Phase 1 Implementation LLD into actionable, implementation-ready test designs. Code is presented as **snippets only** (per project convention); full files are left to the implementing agent.

### 1.2 Scope Summary

- **In Scope:** Clerk authentication flows, Strapi product/category catalog integration, product listing + detail + category filtering, loading skeletons, error boundaries, header/footer/responsive layout.
- **Out of Scope (Phase 2):** Cart, checkout, Razorpay payment, webhooks, order management.
- **Out of Scope (Phase 3):** Search, sort, dark mode, wishlist, SEO, accessibility hardening, animations.

### 1.3 Locked Tool Stack (verified latest as of 2026-07-14)

| Tool | Version | Purpose | Key Notes |
|------|---------|---------|-----------|
| Node.js | **v22.x** | Runtime | Required by Next.js 16 |
| Vitest | **v4.x** (stable `4.1.10`) | Unit + integration runner | **v5 is beta — do not use** |
| `@vitest/coverage-v8` | latest | Coverage provider | Install explicitly; `provider: 'v8'` |
| `@vitejs/plugin-react` | latest | `.tsx` transform | Required for component tests |
| `vite-tsconfig-paths` | latest | `@/` alias resolution | Reads `tsconfig.json` paths |
| `@testing-library/react` | **v16.x** | Component tests | React 19 compatible |
| `@testing-library/jest-dom` | v6.x | DOM matchers | `toBeInTheDocument()` etc. |
| `@testing-library/user-event` | v14.x | Interaction simulation | `user.click()`, `user.type()` |
| MSW | **v2.x** | API mocking (node + browser) | `http`, `HttpResponse`, `setupServer` |
| `@mswjs/data` | latest | Test data factories | `factory`, `primaryKey` |
| `@msw/playwright` | **v0.6.7** | E2E API mocking (client only) | Official binding; `createNetworkFixture` |
| Playwright | **v1.6x** | E2E runner | Chromium, Firefox, WebKit |
| `@clerk/testing` | latest | Clerk E2E auth | `clerkSetup`, `clerk.signIn`, `clerk.signOut` |
| TanStack Query | v5.90+ | Data-fetch hooks (under test) | `queryOptions`, `isPending`, `gcTime` |

---

## 2. Scope & Test Objectives

### 2.1 Phase 1 FR → Test Layer Mapping

| FR ID | Requirement | Primary Test Layer | Test File(s) |
|-------|-------------|--------------------|--------------|
| FR1 | Sign up (email/password) | E2E | `auth.spec.ts` |
| FR2 | Sign in (email/password) | E2E + Integration | `auth.spec.ts`, `auth-section.test.tsx` |
| FR3 | Sign out | E2E + Unit | `auth.spec.ts`, `auth-section.test.tsx` |
| FR4 | Authenticated profile menu | Unit + Integration | `auth-section.test.tsx` (Clerk mock) |
| FR5 | Unauthenticated sign-in/up buttons | Unit | `auth-section.test.tsx` |
| FR6 | Protected route redirect | E2E | `auth-guard.spec.ts` |
| FR7 | Admin manages products (Strapi) | Manual / out of test scope | — |
| FR8 | Admin manages categories (Strapi) | Manual / out of test scope | — |
| FR9 | Products filterable by category | Integration + E2E | `strapi-queries.test.ts`, `products.spec.ts` |
| FR10 | Draft/publish workflow | Integration (server) | `strapi-queries.test.ts` |
| FR11 | Seed 10–20 products / 4–5 categories | Test data | `seed.ts` |
| FR12 | Product grid (image, name, price, badge) | Unit + E2E | `product-card.test.tsx`, `product-grid.test.tsx`, `products.spec.ts` |
| FR13 | Product detail (images, description, price) | Unit + E2E | `product-detail.test.tsx`, `product-detail.spec.ts` |
| FR14 | Category filter | Integration + E2E | `category-filter.test.tsx`, `products.spec.ts` |
| FR15 | Loading skeletons | Unit | `skeleton.test.tsx`, `product-grid.test.tsx` |
| FR16 | Graceful error handling | Integration | `strapi.test.ts`, `error-boundary.test.tsx` |
| FR17 | Header (logo, nav, auth) | Unit | `header.test.tsx` |
| FR18 | Footer (links, branding) | Unit | `footer.test.tsx` |
| FR19 | Responsive layout | Unit + E2E | `header.test.tsx`, `responsive.spec.ts` |

### 2.2 Test Distribution (Phase 1 = 35 total)

| Layer | Count | Rationale |
|-------|-------|-----------|
| Unit | 20 | Presentational components + utilities (pure, fast) |
| Integration | 9 | Data layer (`lib/strapi*`), URL-synced filter, error boundary, query hooks (MSW) |
| E2E | 6 | Real flows: browse, filter, detail, sign-in, auth-guard, responsive |

---

## 3. Assumptions, Constraints & Test Dependencies

### 3.1 Assumptions

- **Node.js v22+** available for both frontend and test tooling.
- A **real, seeded Strapi v5** instance is available at `localhost:1337` for **E2E** (Phase 1 product pages are RSC server-fetched — see §4.7 note).
- A **real Clerk test account** (email+password) is provisioned; `CLERK_SECRET_KEY` set for E2E token generation.
- `STRAPI_API_TOKEN` / `CLERK_SECRET_KEY` are **server-only**; never asserted to appear in client bundles.
- Product prices are **whole INR rupees** (no paise). `formatINR(249900)` → `₹2,49,900`.

### 3.2 Constraints

- **No full source files** in this doc — snippets only.
- **No Phase 2/3 code paths** are introduced (cart/checkout/payment/search/wishlist/dark mode).
- Unit/integration tests must run **without a browser or network** (MSW node isolates Strapi).
- Coverage thresholds enforced: statements ≥ 80, branches ≥ 75, functions ≥ 80, lines ≥ 80.

### 3.3 External Test Dependencies

| Service | Used In | Mode |
|---------|---------|------|
| Strapi | E2E | **Real** seeded instance |
| Strapi | Unit/Integration | **MSW node** (`setupServer`) |
| Clerk | E2E | **Real** test account via `@clerk/testing` |
| Clerk | Unit/Integration | Module mock (`vi.mock('@clerk/nextjs')`) |

---

## 4. Detailed Test Design

### 4.1 Vitest Configuration

Use `mergeConfig` so path aliases, plugins, and `import.meta.env` from the app's `vite.config.ts` apply to tests. Split into **projects** so pure logic runs in `node` (fast) and components run in `jsdom`.

```typescript
// vitest.config.ts
import { defineConfig, mergeConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    plugins: [react(), tsconfigPaths()],
    test: {
      globals: true,
      coverage: {
        provider: 'v8', // requires @vitest/coverage-v8
        reporter: ['text', 'html', 'lcov'],
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/**/*.test.{ts,tsx}', 'src/components/ui/**', 'src/types/**'],
        thresholds: { statements: 80, branches: 75, functions: 80, lines: 80 },
      },
      projects: [
        {
          test: {
            name: 'unit',
            include: ['src/**/*.unit.test.{ts,tsx}'],
            environment: 'node',
          },
        },
        {
          test: {
            name: 'component',
            include: ['src/**/*.test.{ts,tsx}'],
            environment: 'jsdom',
            setupFiles: ['./src/__tests__/setup.ts'],
          },
        },
      ],
    },
  })
);
```

### 4.2 Test Setup Files

```typescript
// src/__tests__/setup.ts
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeAll, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from './mocks/server';

// MSW node server lifecycle
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// DOM cleanup after each component test
afterEach(() => cleanup());

// localStorage mock
const store: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
  clear: () => { for (const k in store) delete store[k]; },
});

// IntersectionObserver mock (future-proof for Framer Motion)
vi.stubGlobal('IntersectionObserver', vi.fn(() => ({
  observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn(),
})));
```

### 4.3 MSW Handlers & Data Factories

Handlers mirror the **explicit `populate`** contract from the Implementation LLD §4.4 (`lib/strapi-queries.ts`). Never use `populate=*`.

```typescript
// src/__tests__/mocks/handlers.ts
import { http, HttpResponse } from 'msw';
import { db } from './factories';

const STRAPI = 'http://localhost:1337';

export const handlers = [
  http.get(`${STRAPI}/api/products`, ({ request }) => {
    const url = new URL(request.url);
    const slug = url.searchParams.get('filters[category][slug][$eq]');
    let products = db.product.getAll();
    if (slug) products = products.filter((p) => p.category?.slug === slug);
    return HttpResponse.json({
      data: products,
      meta: { pagination: { page: 1, pageSize: 25, pageCount: 1, total: products.length } },
    });
  }),

  http.get(`${STRAPI}/api/products`, ({ request }) => {
    // explicit populate query (images + category) — mirrors lib/strapi-queries.ts
    return HttpResponse.json({ data: db.product.getAll(), meta: { pagination: { page: 1, pageSize: 25, pageCount: 1, total: db.product.count() } } });
  }),

  http.get(`${STRAPI}/api/products/:slug`, ({ params }) => {
    const p = db.product.findFirst({ where: { slug: { equals: String(params.slug) } } });
    if (!p) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json({ data: p });
  }),

  http.get(`${STRAPI}/api/categories`, () => {
    return HttpResponse.json({ data: db.category.getAll(), meta: { pagination: { page: 1, pageSize: 25, pageCount: 1, total: db.category.count() } } });
  }),

  http.get(`${STRAPI}/api/categories/:slug`, ({ params }) => {
    const c = db.category.findFirst({ where: { slug: { equals: String(params.slug) } } });
    if (!c) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json({ data: c });
  }),
];
```

```typescript
// src/__tests__/mocks/factories.ts
import { factory, primaryKey } from '@mswjs/data';

export const db = factory({
  category: {
    id: primaryKey(Number),
    documentId: String,
    name: String,
    slug: String,
    description: String,
    image: Object,
  },
  product: {
    id: primaryKey(Number),
    documentId: String,
    name: String,
    slug: String,
    description: String,
    price: Number,
    comparePrice: Number,
    images: Array,
    category: { type: 'relationship', of: 'category' },
    stock: Number,
    featured: Boolean,
  },
});
```

```typescript
// src/__tests__/mocks/seed.ts
export function seedTestData() {
  const electronics = db.category.create({ id: 1, documentId: 'cat1', name: 'Electronics', slug: 'electronics' });
  const clothing = db.category.create({ id: 2, documentId: 'cat2', name: 'Clothing', slug: 'clothing' });
  db.product.create({
    id: 1, documentId: 'prod1', name: 'Wireless Headphones', slug: 'wireless-headphones',
    description: 'Premium noise-cancelling', price: 249900, comparePrice: 299900,
    images: [{ url: '/uploads/headphones.jpg', alternativeText: 'Headphones' }],
    category: electronics, stock: 50, featured: true,
  });
  db.product.create({
    id: 2, documentId: 'prod2', name: 'Cotton T-Shirt', slug: 'cotton-tshirt',
    description: 'Comfortable cotton', price: 79900,
    images: [{ url: '/uploads/tshirt.jpg', alternativeText: 'T-Shirt' }],
    category: clothing, stock: 100, featured: false,
  });
  // ... seed 10–20 products across 4–5 categories (FR11)
}
```

### 4.4 TanStack Query Test Wrapper

Each test gets a **fresh `QueryClient`** with retries off and `gcTime: 0` to avoid open-handle warnings and async drift. Always assert with `findBy*`/`waitFor`, and **never** use fake timers with TanStack Query.

```typescript
// src/__tests__/utils/create-wrapper.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

export const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};
```

### 4.5 Clerk Mock for Component Tests

Mock `@clerk/nextjs` and provide a `renderWithProviders({ isSignedIn })` toggle so both signed-in and signed-out states are tested without real Clerk.

```typescript
// src/__tests__/utils/render-with-providers.tsx
import { vi } from 'vitest';
import { QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactNode } from 'react';

vi.mock('@clerk/nextjs', () => ({
  ClerkProvider: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  UserButton: () => <div data-testid="user-button" />,
  SignInButton: () => <button>Sign in</button>,
  SignUpButton: () => <button>Sign up</button>,
  useUser: () => ({ isSignedIn: isSignedInRef.value, user: { firstName: 'Test' } }),
  useClerk: () => ({ signOut: vi.fn() }),
}));

let isSignedInRef = { value: false };

export function renderWithProviders(ui: ReactNode, { isSignedIn = false } = {}) {
  isSignedInRef.value = isSignedIn;
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}
```

### 4.6 Playwright Configuration

Use `clerkSetup()` global setup so Clerk testing tokens are generated once. Authenticated projects depend on the `setup` project that writes `storageState`. E2E points at a **real seeded Strapi** (no MSW for RSC fetches).

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['html'], ['list'], ['json', { outputFile: 'test-results/e2e-results.json' }]],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium-auth',
      use: { ...devices['Desktop Chrome'], storageState: 'playwright/.auth/user.json' },
      dependencies: ['setup'],
    },
    { name: 'chromium-unauth', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'], storageState: 'playwright/.auth/user.json' },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'], storageState: 'playwright/.auth/user.json' },
      dependencies: ['setup'],
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

```typescript
// e2e/global.setup.ts
import { clerkSetup } from '@clerk/testing/playwright';
export default async function globalSetup() {
  await clerkSetup();
}
```

```typescript
// e2e/auth.setup.ts
import { test as setup, expect } from '@playwright/test';
import { clerk } from '@clerk/testing/playwright';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  await page.goto('/');
  await clerk.signIn({ page, emailAddress: process.env.E2E_CLERK_USER_EMAIL });
  await expect(page.getByTestId('user-button')).toBeVisible();
  await page.context().storageState({ path: authFile });
});
```

### 4.7 Clerk E2E Auth & MSW Playwright Fixtures

> **Critical architecture note:** Phase 1 product/category pages are **React Server Components** that fetch Strapi **server-side** (`'use cache'`). The `@msw/playwright` `network` fixture intercepts **only client-side** requests (`page.route`). Therefore RSC Strapi calls in E2E must hit the **real seeded Strapi** instance. Use `@msw/playwright` only for client-only mocks (analytics, CSAT, feature flags).
>
> **Replacement:** The Testing HLD §6.2 manual form-filling sign-in is brittle and replaced here by `@clerk/testing` (`clerk.signIn`). The Testing HLD §6.3 `msw-playwright`/`createWorker` is replaced by the official `@msw/playwright` `createNetworkFixture`.

```typescript
// e2e/playwright.setup.ts
import { test as base } from '@playwright/test';
import { createNetworkFixture } from '@msw/playwright';
import { handlers } from './mocks/handlers';

export const test = base.extend({
  // client-only network mocking; RSC Strapi uses the real instance
  network: createNetworkFixture({ initialHandlers: handlers }),
});
export { expect } from '@playwright/test';
```

```typescript
// e2e/auth.spec.ts
import { test, expect } from './playwright.setup';
import { clerk } from '@clerk/testing/playwright';

test('signed-in user sees profile menu', async ({ page }) => {
  await page.goto('/');
  await clerk.signIn({ page, emailAddress: process.env.E2E_CLERK_USER_EMAIL });
  await expect(page.getByTestId('user-button')).toBeVisible();
});

test('signed-out user sees sign-in button', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
});
```

Protected-route assertion must **disable redirect following** to avoid a false 200 (Clerk returns 302 → `/sign-in` → 200 HTML).

```typescript
test('unauthenticated /orders redirects to sign-in', async ({ request }) => {
  const res = await request.get('/orders', { maxRedirects: 0, failOnStatusCode: false });
  expect(res.status()).not.toBe(200); // expect 302 → /sign-in
});
```

---

## 5. Unit Test Specifications (Phase 1)

**Count: 20.** Pure functions and presentational components in `jsdom` (or `node` for utilities).

| # | Target | File | Key Assertions |
|---|--------|------|----------------|
| 1 | `formatINR` | `utils.unit.test.ts` | `249900 → '₹2,49,900'`; `0 → '₹0'`; `null/NaN → '₹0'` |
| 2 | `cn` | `utils.unit.test.ts` | Merges truthy classes; drops falsy; joins with space |
| 3 | `strapiMedia` | `strapi.unit.test.ts` | Relative URL → prepends `NEXT_PUBLIC_STRAPI_API_URL`; absolute URL passes through; empty → `''` |
| 4 | `strapiFetch` (success) | `strapi.unit.test.ts` | Returns parsed JSON; sends `Bearer` token when `STRAPI_API_TOKEN` set |
| 5 | `strapiFetch` (404) | `strapi.unit.test.ts` | Throws with status in message |
| 6 | `strapiFetch` (500) | `strapi.unit.test.ts` | Throws; extracts Strapi error message when present |
| 7 | `getProducts` query build | `strapi-queries.unit.test.ts` | Builds correct `qs` string; `populate` explicit (no `populate=*`) |
| 8 | `getProducts` (category) | `strapi-queries.unit.test.ts` | Adds `filters[category][slug][$eq]` when category passed |
| 9 | `getProductBySlug` | `strapi-queries.unit.test.ts` | Returns first match; throws on missing |
| 10 | `ProductCard` | `product-card.test.tsx` | Renders name, `₹2,49,900` price, category badge; image `alt`; link `href`; handles missing image |
| 11 | `ProductGrid` | `product-grid.test.tsx` | Renders one card per product; shows `EmptyState` when empty; shows skeleton fallback while loading |
| 12 | `CategoryBadge` | `category-badge.test.tsx` | Renders category name; handles missing category gracefully |
| 13 | `PriceDisplay` | `price-display.test.tsx` | Formats INR; shows strikethrough compare price when `comparePrice > price`; hides otherwise |
| 14 | `Skeleton` | `skeleton.test.tsx` | Applies `animate-pulse`; respects `className` |
| 15 | `EmptyState` | `empty-state.test.tsx` | Renders title/description; CTA link when `actionLabel`+`actionHref` provided |
| 16 | `ErrorBoundary` | `error-boundary.test.tsx` | Catches child error; renders fallback; reset clears error; `componentDidCatch` logs |
| 17 | `Header` | `header.test.tsx` | Renders logo, nav links, auth section; reserves inert `cart-slot` testid |
| 18 | `Footer` | `footer.test.tsx` | Renders branding + links |
| 19 | `AuthSection` (signed-out) | `auth-section.test.tsx` | Shows Sign in / Sign up buttons |
| 20 | `AuthSection` (signed-in) | `auth-section.test.tsx` | Renders `UserButton` (via Clerk mock) |

---

## 6. Integration Test Specifications (Phase 1)

**Count: 9.** Data layer and URL-synced UI behavior, with MSW isolating Strapi.

| # | Target | File | Key Assertions |
|---|--------|------|----------------|
| 1 | `lib/strapi.ts` error parsing | `strapi.test.ts` | 404/500 throw; message extracted from `error.message`; `Authorization` header attached when token present |
| 2 | `lib/strapi-queries.ts` query building | `strapi-queries.test.ts` | `qs.stringify` output matches explicit `populate` + `sort`; category filter encoded correctly |
| 3 | `lib/strapi-queries.ts` category filter | `strapi-queries.test.ts` | MSW handler filters by `category.slug`; returns subset |
| 4 | `lib/strapi-queries.ts` missing product | `strapi-queries.test.ts` | 404 from MSW → `getProductBySlug` throws |
| 5 | `CategoryFilter` URL sync | `category-filter.test.tsx` | Reads `searchParams`; click updates URL via `useRouter`; active category highlighted |
| 6 | `ErrorBoundary` catch + reset | `error-boundary.test.tsx` | Child throw → fallback shown; reset handler re-renders children |
| 7 | `useProducts` hook | `use-products.test.ts` | MSW returns list → `isSuccess` with data; simulate 500 → `isError` |
| 8 | `useProduct` hook (by slug) | `use-product.test.ts` | Returns single product; 404 → `isError` |
| 9 | ProductGrid + Suspense | `product-grid.test.tsx` | Streaming fallback (skeleton) then grid; empty state when no data |

> All hook tests use the `createWrapper()` from §4.4 and `findBy*`/`waitFor` assertions.

---

## 7. E2E Test Specifications (Phase 1)

**Count: 6.** Real Clerk + real seeded Strapi. No RSC mocking via MSW.

| # | Test | File | Description |
|---|------|------|-------------|
| 1 | Homepage → /products | `homepage.spec.ts` | Hero CTA navigates to product listing; header/footer visible |
| 2 | Product listing + filter | `products.spec.ts` | Grid renders seeded products; clicking a category filter updates the list (real Strapi) |
| 3 | Product detail | `product-detail.spec.ts` | Click card → detail page shows images, description, price, category |
| 4 | Sign-in flow | `auth.spec.ts` | `clerk.signIn` authenticates; `UserButton` appears; sign-out returns to signed-out state |
| 5 | Protected redirect | `auth-guard.spec.ts` | Unauthenticated `/orders` request returns non-200 (302→/sign-in); with `storageState` the page loads |
| 6 | Responsive layout | `responsive.spec.ts` | Mobile viewport stacks nav / shows hamburger; desktop shows horizontal nav (assert via `setViewportSize`) |

```typescript
// e2e/products.spec.ts (snippet)
import { test, expect } from './playwright.setup';

test('product listing renders seeded products and filters by category', async ({ page, network }) => {
  await page.goto('/products');
  await expect(page.getByRole('link', { name: /wireless headphones/i })).toBeVisible();

  await page.getByRole('button', { name: /clothing/i }).click();
  await expect(page.getByRole('link', { name: /cotton t-shirt/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /wireless headphones/i })).toHaveCount(0);
});
```

```typescript
// e2e/product-detail.spec.ts (snippet)
test('product detail shows full information', async ({ page }) => {
  await page.goto('/products/wireless-headphones');
  await expect(page.getByRole('heading', { name: /wireless headphones/i })).toBeVisible();
  await expect(page.getByText(/premium noise-cancelling/i)).toBeVisible();
  await expect(page.getByText('₹2,49,900')).toBeVisible();
});
```

---

## 8. Test Data Strategy (Phase 1)

| Test Type | Data Source | Freshness |
|-----------|-------------|-----------|
| **Unit** | Inline mock objects | Fresh per test (isolated) |
| **Integration** | `@mswjs/data` factories + `seedTestData()` | Reseed in `beforeEach` via `server.resetHandlers()` |
| **E2E** | Real seeded Strapi (10–20 products / 4–5 categories, FR11) | Static per run |
| **E2E (Auth)** | Real Clerk test account | Persistent across runs via `storageState` |

- **Factories** (`@mswjs/data`) keep the mock schema in sync with `src/types/strapi.ts`.
- **Seed coverage:** at least 4–5 categories and 10–20 products, including one product with `comparePrice` (strikethrough path) and one `featured`.
- **Isolation:** `server.resetHandlers()` after each test prevents cross-test leakage.

---

## 9. Traceability Matrix & Coverage Reconciliation

### 9.1 FR → Test Traceability (Phase 1)

See §2.1 for the full FR → test-file mapping (FR1–FR19). Every Phase 1 FR has at least one test at the appropriate layer.

### 9.2 Coverage Count Reconciliation (discrepancy resolved)

The Testing HLD contains a **contradiction**:

- §3.3 "Test Distribution by Phase" → Phase 1 = **40 unit / 15 integration / 5 E2E = 60**.
- §9 "Phase-Wise Test Coverage Map" → Phase 1 = **20 unit / 9 integration / 6 E2E = 35**.

**Resolution for this document:** Lock to **§9 = 35 tests**, because (a) the Implementation LLD §9.2 explicitly cites Testing HLD §9, and (b) the §9 subtotal is internally consistent ("Phase 1 Subtotal = 35"). The §3.3 figures appear to be a stale copy from an earlier draft and should be corrected in a future Testing HLD revision. This LLD uses **20 / 9 / 6 = 35**.

---

## 10. CI/CD, Quality Gates & Reporting

### 10.1 GitHub Actions

```yaml
# .github/workflows/test.yml (abridged)
jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck

  unit-and-integration:
    needs: lint-and-typecheck
    runs-on: ubuntu-latest
    steps:
      - run: npm ci
      - run: npx vitest run --coverage
      - uses: actions/upload-artifact@v4
        with: { name: coverage-report, path: coverage/ }

  e2e:
    needs: lint-and-typecheck
    runs-on: ubuntu-latest
    strategy:
      matrix: { shardIndex: [1, 2, 3, 4], shardTotal: [4] }
    steps:
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test --shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }}
        env:
          CLERK_SECRET_KEY: ${{ secrets.CLERK_SECRET_KEY }}
          NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ${{ secrets.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY }}
      - uses: actions/upload-artifact@v4
        with: { name: playwright-report, path: playwright-report/ }
```

### 10.2 Quality Gates

| Gate | Threshold | Action |
|------|-----------|--------|
| Unit/integration coverage | ≥ 80% stmts, ≥ 75% branches, ≥ 80% funcs/lines | PR blocked if below |
| E2E critical flows | 100% pass | PR blocked on failure |
| Lint errors | 0 | PR blocked |
| TypeScript errors | 0 | PR blocked |
| Flaky tests | < 5% flake rate | Quarantine; fix within 48h |

### 10.3 Reporting

| Report | Tool | Location |
|--------|------|----------|
| Coverage | `@vitest/coverage-v8` | `coverage/` (text, html, lcov) |
| E2E results | Playwright | `playwright-report/`, `test-results/` (traces/screenshots/video) |

---

## 11. Open Questions, Risks & Discrepancies

### 11.1 Discrepancies Resolved

| ID | Issue | Resolution |
|----|-------|------------|
| D1 | Testing HLD §3.3 (60) vs §9 (35) Phase 1 counts | Lock to **§9 = 35** (this doc) |
| D2 | HLD §6.2 manual Clerk sign-in | Replaced with `@clerk/testing` (`clerk.signIn`) |
| D3 | HLD §6.3 `msw-playwright`/`createWorker` | Replaced with official `@msw/playwright` `network` fixture |
| D4 | HLD coverage `provider:'v8'` without package | Added `@vitest/coverage-v8` to devDeps |

### 11.2 Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| RSC Strapi fetches not intercepted by browser MSW | E2E cannot mock product data client-side | Use **real seeded Strapi** for E2E (§4.7); alternative = Next.js experimental `next/experimental/testmode/playwright` (`next.onFetch`) — flagged experimental |
| Clerk E2E session expiry | Auth tests flake | `storageState` persisted; `clerkSetup()` regenerates tokens; skip gracefully if `CLERK_SECRET_KEY` absent |
| TanStack Query async timing | Component/hook tests timeout | `createWrapper()` with `retry:false`, `gcTime:0`; `findBy*`/`waitFor`; no fake timers |
| Cross-browser CSS differences | Layout tests flake on Firefox/WebKit | Assert critical layout only in Chromium; screenshots with `maxDiffPixelRatio` |
| Strapi v5 minor drift | Query field mismatch | Explicit `fields`/`populate` allowlist in `lib/strapi-queries.ts` |

### 11.3 Phase 2/3 Seams (not tested here)

The Header reserves an inert `cart-slot` testid (LLD §4.2) — no cart/checkout/payment/wishlist/dark-mode/search tests are introduced in Phase 1.

---

*This document defines the implementation-level testing design (HOW Phase 1 is tested). All 11 sections are present; snippets are illustrative. Full test files are left to the implementing agent.*
*Last updated: July 14, 2026*
