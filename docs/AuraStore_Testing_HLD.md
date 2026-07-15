# AuraStore — Testing Architecture (HLD)

> **Project:** AuraStore: The Modern Consumer App  
> **Version:** 1.0  
> **Status:** Draft  
> **Date:** July 9, 2026  
> **Document Type:** Testing High-Level Design

---

## Table of Contents

1. [Testing Philosophy & Strategy](#1-testing-philosophy--strategy)
2. [Testing Stack & Tools](#2-testing-stack--tools)
3. [Testing Pyramid for AuraStore](#3-testing-pyramid-for-aurastore)
4. [Unit Testing Architecture](#4-unit-testing-architecture)
5. [Integration Testing Architecture](#5-integration-testing-architecture)
6. [E2E Testing Architecture](#6-e2e-testing-architecture)
7. [Test Data Strategy](#7-test-data-strategy)
8. [CI/CD Integration](#8-cicd-integration)
9. [Phase-Wise Test Coverage Map](#9-phase-wise-test-coverage-map)
10. [Key User Flows (E2E)](#10-key-user-flows-e2e)
11. [Reporting & Monitoring](#11-reporting--monitoring)
12. [Challenges & Mitigations](#12-challenges--mitigations)

---

## 1. Testing Philosophy & Strategy

### 1.1 Core Principles

| Principle | Description |
|-----------|-------------|
| **Test behavior, not implementation** | Assert on what the user sees and experiences, not internal function calls or state shapes |
| **Shift left** | Catch issues at the earliest possible stage: lint → type → unit → integration → E2E |
| **Isolate external dependencies** | Mock Strapi, Razorpay, and Clerk in unit/integration tests using MSW |
| **Test real flows in E2E** | Use actual Clerk test credentials and Razorpay test mode for full end-to-end validation |
| **Automate in CI** | Every PR must pass linting, type checking, unit tests, and critical E2E paths |
| **Flaky test discipline** | Tag flaky tests, quarantine them, and fix within 48 hours |

### 1.2 Risk-Based Testing Priority

```
HIGH RISK (must test thoroughly):
  • Payment flow (Razorpay order creation → webhook → order status update)
  • Authentication (sign-up, sign-in, protected route redirects)
  • Cart operations (add, remove, quantity, persistence, optimistic updates)
  • Checkout (address validation, order summary accuracy, auth guard)

MEDIUM RISK (test core paths):
  • Product listing, filtering, and detail pages
  • Order history and order detail views
  • API error handling (Strapi down, network failure)
  • Cart empty state and edge cases

LOW RISK (smoke test):
  • Animations and transitions (visual regression only)
  • Dark mode toggle
  • Footer links and branding
  • 404 and error pages
```

### 1.3 Test Isolation Strategy

```
┌─────────────────────────────────────────────────────────────────────┐
│                        TEST ISOLATION LAYERS                         │
│                                                                      │
│  Unit Tests:     Pure functions, utilities, type guards              │
│                  → No network, no browser, no storage                │
│                                                                      │
│  Component Tests: React components with mocked data                  │
│                  → MSW intercepts Strapi/Clerk calls                 │
│                  → localStorage mocked via vi.stubGlobal             │
│                                                                      │
│  Hook Tests:     TanStack Query hooks with QueryClientProvider       │
│                  → MSW intercepts all API calls                      │
│                  → No real browser                                   │
│                                                                      │
│  API Route Tests: Next.js API routes with mocked SDKs                │
│                  → Razorpay SDK mocked via vi.mock                   │
│                  → Strapi SDK mocked via vi.mock                     │
│                  → No real network                                   │
│                                                                      │
│  E2E Tests:      Full browser with real Clerk + Razorpay test mode   │
│                  → Real network to Clerk/Razorpay                    │
│                  → Strapi mocked via MSW Playwright binding          │
│                  → Real browser (Chromium, Firefox, WebKit)          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Testing Stack & Tools

### 2.1 Tool Versions (Verified Latest)

| Tool | Version | Purpose | Key Features |
|------|---------|---------|--------------|
| **Vitest** | **v4.1+** | Unit & integration testing | Vite-native, Jest-compatible, ESM, TypeScript, `vi.mock()`, `vi.stubGlobal()` |
| **@testing-library/react** | v16.x | React component testing | Queries by role/text/label, `render()`, `screen`, `waitFor` |
| **@testing-library/jest-dom** | v6.x | DOM matchers | `toBeInTheDocument()`, `toHaveTextContent()`, `toHaveClass()` |
| **@testing-library/user-event** | v14.x | User interaction simulation | `user.click()`, `user.type()`, `user.tab()` |
| **MSW** | **v2.x** | API mocking (Node.js) | `http` handlers, `setupServer()`, request interception at network level |
| **MSW Data** | **v0.x** | Test data factories | Schema-based model, relations, pagination, sorting |
| **Playwright** | **v1.61+** | E2E testing | Cross-browser (Chromium, Firefox, WebKit), `storageState`, web-first assertions, trace viewer |
| **MSW Playwright** | **v0.x** | MSW integration for Playwright | `worker` setup in Playwright context, shared handlers |
| **Clerk Testing** | v6.x | Clerk auth in tests | `clerk_test` email suffix, test OTP `424242`, session tokens |
| **@next/bundle-analyzer** | Latest | Bundle size tracking | Used in performance testing assertions |

### 2.2 Tool Interaction Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TEST EXECUTION ENVIRONMENT                           │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                        Vitest (Node.js)                               │   │
│  │                                                                       │   │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │   │
│  │  │ @testing-library │  │ vi.mock()        │  │ MSW setupServer  │   │   │
│  │  │ render(<Comp>)   │  │ (Razorpay SDK)   │  │ (Strapi API)     │   │   │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                     Playwright (Browser)                              │   │
│  │                                                                       │   │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │   │
│  │  │ Clerk Auth       │  │ Razorpay Test    │  │ MSW Playwright   │   │   │
│  │  │ (real login)     │  │ (test mode)      │  │ (mock Strapi)    │   │   │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Testing Pyramid for AuraStore

### 3.1 Visual Pyramid

```
                    ╱╲
                   ╱  ╲
                  ╱ E2E ╲              ← 20 tests (20% effort)
                 ╱  (20%) ╲
                ╱──────────╲
               ╱            ╲
              ╱ Integration  ╲         ← 50 tests (30% effort)
             ╱    (30%)       ╲
            ╱──────────────────╲
           ╱                    ╲
          ╱       Unit           ╲     ← 100+ tests (50% effort)
         ╱       (50%)            ╲
        ╱──────────────────────────╲
```

### 3.2 Layer Breakdown

| Layer | Count | Tools | What Gets Tested | Speed |
|-------|-------|-------|------------------|-------|
| **Unit** | 100+ | Vitest + testing-library | Components, hooks, utilities, type guards, cart logic | ⚡ ms |
| **Integration** | 50 | Vitest + MSW | API routes, TanStack Query mutations, form validation, error states | ⚡ ms |
| **E2E** | 20 | Playwright + MSW Playwright | Full user flows, payment, auth, cross-browser | 🐢 s |

### 3.3 Test Distribution by Phase

| Phase | Unit | Integration | E2E | Total |
|-------|------|-------------|-----|-------|
| **Phase 1 (Basic)** | 40 | 15 | 5 | 60 |
| **Phase 2 (Mandatory)** | 40 | 25 | 10 | 75 |
| **Phase 3 (Advanced)** | 20 | 10 | 5 | 35 |
| **Total** | **100** | **50** | **20** | **170** |

---

## 4. Unit Testing Architecture

### 4.1 Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/components/ui/**', // shadcn/ui — tested by library
        'src/types/**',
      ],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### 4.2 Test Setup File

```typescript
// src/__tests__/setup.ts
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
})();

vi.stubGlobal('localStorage', localStorageMock);

// Mock IntersectionObserver (used by Framer Motion)
vi.stubGlobal('IntersectionObserver', vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
})));
```

### 4.3 What Gets Unit Tested

#### Components (Phase 1 — Basic)

| Component | Test Scenarios | File |
|-----------|---------------|------|
| `ProductCard` | Renders name, price, image, category badge; handles missing image; truncates long names | `ProductCard.test.tsx` |
| `ProductGrid` | Renders grid of cards; shows empty state; shows loading skeletons | `ProductGrid.test.tsx` |
| `CategoryBadge` | Renders with correct color; handles missing category | `CategoryBadge.test.tsx` |
| `PriceDisplay` | Formats INR correctly; shows compare-at price with strikethrough; handles zero | `PriceDisplay.test.tsx` |
| `Skeleton` | Renders with correct dimensions; accepts className override | `Skeleton.test.tsx` |
| `ErrorBoundary` | Catches errors; renders fallback UI; reset button works | `ErrorBoundary.test.tsx` |
| `EmptyState` | Renders icon, title, message; CTA button works | `EmptyState.test.tsx` |
| `Header` | Renders logo, nav links, auth section; responsive behavior | `Header.test.tsx` |
| `Footer` | Renders links and branding | `Footer.test.tsx` |

#### Components (Phase 2 — Mandatory)

| Component | Test Scenarios | File |
|-----------|---------------|------|
| `CartDrawer` | Opens/closes; shows items; shows empty state; calculates subtotal | `CartDrawer.test.tsx` |
| `CartItem` | Shows product info; increment/decrement/remove buttons; quantity sync | `CartItem.test.tsx` |
| `CartSummary` | Shows subtotal, total; handles empty cart | `CartSummary.test.tsx` |
| `QuantitySelector` | Increment/decrement; min/max bounds; keyboard input | `QuantitySelector.test.tsx` |
| `AddressForm` | Validates required fields; validates zip code format; submits on enter | `AddressForm.test.tsx` |
| `OrderCard` | Shows date, status, total, item count; status color coding | `OrderCard.test.tsx` |

#### Components (Phase 3 — Advanced)

| Component | Test Scenarios | File |
|-----------|---------------|------|
| `SearchBar` | Debounced input; shows results dropdown; clears on escape | `SearchBar.test.tsx` |
| `SortDropdown` | Selects sort option; calls onChange with correct value | `SortDropdown.test.tsx` |
| `ThemeToggle` | Toggles dark/light; persists preference | `ThemeToggle.test.tsx` |
| `WishlistButton` | Toggles filled/outlined; calls add/remove | `WishlistButton.test.tsx` |
| `Breadcrumbs` | Renders correct trail; last item is non-clickable | `Breadcrumbs.test.tsx` |

#### Hooks

| Hook | Test Scenarios | File |
|------|---------------|------|
| `useProducts` | Returns products list; handles loading state; handles error | `useProducts.test.ts` |
| `useProduct` | Returns single product by slug; handles 404 | `useProduct.test.ts` |
| `useCart` | Add item; remove item; update quantity; optimistic update rollback; localStorage persistence | `useCart.test.ts` |
| `useOrders` | Returns user orders; handles empty history; handles error | `useOrders.test.ts` |
| `useOrder` | Returns single order by ID; handles 404 | `useOrder.test.ts` |

#### Utilities

| Utility | Test Scenarios | File |
|---------|---------------|------|
| `lib/strapi.ts` | Fetches products; fetches categories; handles API errors; builds query params | `strapi.test.ts` |
| `lib/cart.ts` | Calculates subtotal; calculates total items; merges localStorage cart | `cart.test.ts` |
| `lib/utils.ts` | `cn()` class merging; `formatPrice()` INR formatting; `formatDate()` | `utils.test.ts` |

### 4.4 Component Test Pattern

```typescript
// Example: ProductCard.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ProductCard } from '@/components/shared/product-card';

const mockProduct = {
  id: 1,
  documentId: 'abc123',
  name: 'Wireless Headphones',
  slug: 'wireless-headphones',
  price: 249900,
  images: [{ url: '/uploads/headphones.jpg', alternativeText: 'Headphones' }],
  category: { id: 1, name: 'Electronics', slug: 'electronics' },
};

describe('ProductCard', () => {
  it('renders product name and price', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText('Wireless Headphones')).toBeInTheDocument();
    expect(screen.getByText('₹2,49,900')).toBeInTheDocument();
  });

  it('renders category badge', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText('Electronics')).toBeInTheDocument();
  });

  it('renders product image with alt text', () => {
    render(<ProductCard product={mockProduct} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('alt', 'Headphones');
  });

  it('links to product detail page', () => {
    render(<ProductCard product={mockProduct} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/products/wireless-headphones');
  });

  it('handles missing image gracefully', () => {
    const productWithoutImage = { ...mockProduct, images: [] };
    render(<ProductCard product={productWithoutImage} />);
    expect(screen.getByRole('img')).toHaveAttribute('alt', 'Wireless Headphones');
  });
});
```

---

## 5. Integration Testing Architecture

### 5.1 MSW Handler Setup

```typescript
// src/__tests__/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

const STRAPI_URL = 'http://localhost:1337';

export const handlers = [
  // Products
  http.get(`${STRAPI_URL}/api/products`, ({ request }) => {
    const url = new URL(request.url);
    const category = url.searchParams.get('filters[category][slug][$eq]');

    let products = mockProducts;
    if (category) {
      products = products.filter(p => p.category.slug === category);
    }

    return HttpResponse.json({
      data: products,
      meta: { pagination: { page: 1, pageSize: 25, pageCount: 1, total: products.length } },
    });
  }),

  // Single Product
  http.get(`${STRAPI_URL}/api/products/:slug`, ({ params }) => {
    const product = mockProducts.find(p => p.slug === params.slug);
    if (!product) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json({ data: product });
  }),

  // Categories
  http.get(`${STRAPI_URL}/api/categories`, () => {
    return HttpResponse.json({
      data: mockCategories,
      meta: { pagination: { page: 1, pageSize: 25, pageCount: 1, total: mockCategories.length } },
    });
  }),

  // Orders (authenticated)
  http.get(`${STRAPI_URL}/api/orders`, ({ request }) => {
    const url = new URL(request.url);
    const userId = url.searchParams.get('filters[clerkUserId][$eq]');
    const userOrders = mockOrders.filter(o => o.clerkUserId === userId);
    return HttpResponse.json({
      data: userOrders,
      meta: { pagination: { page: 1, pageSize: 25, pageCount: 1, total: userOrders.length } },
    });
  }),

  // Create Order (Strapi)
  http.post(`${STRAPI_URL}/api/orders`, async ({ request }) => {
    const body = await request.json();
    const newOrder = { id: 99, documentId: 'new999', ...body, status: 'pending' };
    return HttpResponse.json({ data: newOrder }, { status: 201 });
  }),
];
```

### 5.2 MSW Server Setup for Vitest

```typescript
// src/__tests__/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

```typescript
// src/__tests__/setup.ts (extended)
import { server } from './mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### 5.3 What Gets Integration Tested

#### API Routes

| API Route | Test Scenarios | File |
|-----------|---------------|------|
| `POST /api/orders/create` | Creates Razorpay order; returns order_id; handles Razorpay error; validates auth | `orders-create.test.ts` |
| `POST /api/webhooks/razorpay` | Validates HMAC signature; updates Strapi order; handles invalid signature; handles duplicate webhook | `webhooks-razorpay.test.ts` |

#### TanStack Query Mutations

| Mutation | Test Scenarios | File |
|----------|---------------|------|
| `useAddToCart` | Optimistic update; rollback on error; toast notification | `useAddToCart.test.ts` |
| `useRemoveFromCart` | Optimistic update; rollback on error | `useRemoveFromCart.test.ts` |
| `useUpdateQuantity` | Optimistic update; min/max bounds | `useUpdateQuantity.test.ts` |
| `useCreateOrder` | Calls API; handles success; handles error | `useCreateOrder.test.ts` |

#### Form Validation

| Form | Test Scenarios | File |
|------|---------------|------|
| `AddressForm` | Validates all required fields; validates zip (6-digit); validates phone (10-digit); shows errors; submits valid form | `AddressForm.integration.test.tsx` |

### 5.4 API Route Test Pattern

```typescript
// Example: POST /api/orders/create integration test
import { describe, it, expect, vi, beforeAll } from 'vitest';

// Mock Razorpay SDK
vi.mock('razorpay', () => ({
  default: vi.fn().mockImplementation(() => ({
    orders: {
      create: vi.fn().mockResolvedValue({
        id: 'order_test123',
        amount: 249900,
        currency: 'INR',
      }),
    },
  })),
}));

describe('POST /api/orders/create', () => {
  it('creates Razorpay order and returns order_id', async () => {
    const request = new Request('http://localhost:3000/api/orders/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 249900,
        currency: 'INR',
        items: [{ productId: 1, name: 'Test', price: 249900, quantity: 1 }],
        address: { fullName: 'John', street: '123 St', city: 'Mumbai', state: 'MH', zipCode: '400001', country: 'India' },
        email: 'john@example.com',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('order_id', 'order_test123');
    expect(data).toHaveProperty('amount', 249900);
  });

  it('returns 401 for unauthenticated requests', async () => {
    // Mock auth() to return null
    vi.mocked(auth).mockResolvedValueOnce({ userId: null });

    const request = new Request('http://localhost:3000/api/orders/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 100 }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });
});
```

---

## 6. E2E Testing Architecture

### 6.1 Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: [
    ['html'],
    ['list'],
    ['json', { outputFile: 'test-results/e2e-results.json' }],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // Setup: Authenticate and save session state
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    // Authenticated tests (Chromium)
    {
      name: 'chromium-auth',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    // Unauthenticated tests (Chromium)
    {
      name: 'chromium-unauth',
      use: { ...devices['Desktop Chrome'] },
    },

    // Cross-browser (authenticated)
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        storageState: 'playwright/.auth/user.json',
      },
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

### 6.2 Auth Setup (Clerk)

```typescript
// e2e/auth.setup.ts
import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate with Clerk', async ({ page }) => {
  // Navigate to sign-in page
  await page.goto('/sign-in');

  // Fill email (Clerk test account with clerk_test suffix)
  await page.getByPlaceholder('Enter email address').fill('test-user+clerk_test@example.com');

  // Click Continue
  await page.getByRole('button', { name: 'Continue', exact: true }).last().click();

  // Fill password
  await page.getByPlaceholder('Enter password').fill('TestPassword123!');

  // Click Continue
  await page.getByRole('button', { name: 'Continue', exact: true }).last().click();

  // Handle OTP screen if shown (Clerk test OTP: 424242)
  const otpInput = page.getByPlaceholder('Enter verification code');
  if (await otpInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    await otpInput.fill('424242');
    await page.getByRole('button', { name: 'Verify' }).click();
  }

  // Wait for redirect to home page
  await page.waitForURL('/');
  await expect(page.getByRole('button', { name: /user menu/i })).toBeVisible();

  // Save storage state
  await page.context().storageState({ path: authFile });
});
```

### 6.3 MSW Playwright Integration

```typescript
// e2e/mocks/playwright-handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('http://localhost:1337/api/products', () => {
    return HttpResponse.json({
      data: [
        {
          id: 1,
          documentId: 'abc123',
          name: 'Wireless Headphones',
          slug: 'wireless-headphones',
          price: 249900,
          images: [{ url: 'https://picsum.photos/400/400', alternativeText: 'Headphones' }],
          category: { id: 1, name: 'Electronics', slug: 'electronics' },
        },
        // ... more mock products
      ],
      meta: { pagination: { page: 1, pageSize: 25, pageCount: 1, total: 10 } },
    });
  }),

  http.get('http://localhost:1337/api/categories', () => {
    return HttpResponse.json({
      data: [
        { id: 1, documentId: 'cat1', name: 'Electronics', slug: 'electronics' },
        { id: 2, documentId: 'cat2', name: 'Clothing', slug: 'clothing' },
        { id: 3, documentId: 'cat3', name: 'Home & Living', slug: 'home-living' },
        { id: 4, documentId: 'cat4', name: 'Books', slug: 'books' },
        { id: 5, documentId: 'cat5', name: 'Sports & Outdoors', slug: 'sports-outdoors' },
      ],
      meta: { pagination: { page: 1, pageSize: 25, pageCount: 1, total: 5 } },
    });
  }),
];
```

### 6.4 E2E Test Fixture

```typescript
// e2e/fixtures.ts
import { test as base, expect, Page } from '@playwright/test';
import { createWorker } from 'msw-playwright';
import { handlers } from './mocks/playwright-handlers';

// Extend base test with MSW worker
export const test = base.extend<{ worker: ReturnType<typeof createWorker> }>({
  worker: async ({ page }, use) => {
    const worker = await createWorker(page, handlers);
    await use(worker);
  },
});

export { expect };
```

### 6.5 E2E Test Scenarios

#### Phase 1 — Basic (5 tests)

| Test | Description | File |
|------|-------------|------|
| `Homepage loads` | Verify product grid renders, header/footer visible | `homepage.spec.ts` |
| `Product listing` | Navigate to /products, verify cards, filter by category | `products.spec.ts` |
| `Product detail` | Click product, verify detail page with all info | `product-detail.spec.ts` |
| `Sign-in flow` | Complete Clerk sign-in, verify UserButton appears | `auth.spec.ts` |
| `Protected route redirect` | Visit /orders unauthenticated, verify redirect to /sign-in | `auth-guard.spec.ts` |

#### Phase 2 — Mandatory (10 tests)

| Test | Description | File |
|------|-------------|------|
| `Add to cart` | Add product, verify cart badge updates, toast appears | `cart.spec.ts` |
| `Cart drawer` | Open cart drawer, verify items, quantities, subtotal | `cart-drawer.spec.ts` |
| `Cart quantity controls` | Increment/decrement/remove, verify totals update | `cart-quantity.spec.ts` |
| `Cart persistence` | Refresh page, verify cart items persist | `cart-persistence.spec.ts` |
| `Checkout flow` | Proceed to checkout, fill address, verify order summary | `checkout.spec.ts` |
| `Razorpay payment` | Complete test payment, verify redirect to confirmation | `payment.spec.ts` |
| `Order confirmation` | Verify order details on confirmation page | `order-confirmation.spec.ts` |
| `Order history` | Visit /orders, verify list of past orders | `order-history.spec.ts` |
| `Order detail` | Click order, verify full details | `order-detail.spec.ts` |
| `Auth guard on checkout` | Visit /checkout unauthenticated, verify redirect | `checkout-auth.spec.ts` |

#### Phase 3 — Advanced (5 tests)

| Test | Description | File |
|------|-------------|------|
| `Search functionality` | Type in search bar, verify debounced results | `search.spec.ts` |
| `Dark mode toggle` | Toggle dark mode, verify theme persists on reload | `dark-mode.spec.ts` |
| `Wishlist add/remove` | Add to wishlist, verify on wishlist page, remove | `wishlist.spec.ts` |
| `404 page` | Visit invalid URL, verify custom 404 | `error-pages.spec.ts` |
| `Responsive layout` | Resize to mobile, verify hamburger menu, stacked layout | `responsive.spec.ts` |

### 6.6 E2E Test Pattern

```typescript
// Example: cart.spec.ts
import { test, expect } from '../fixtures';

test.describe('Shopping Cart', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/products');
  });

  test('adds product to cart and shows badge', async ({ page }) => {
    // Click "Add to Cart" on first product
    await page.getByRole('button', { name: /add to cart/i }).first().click();

    // Verify toast notification
    await expect(page.getByText(/added to cart/i)).toBeVisible();

    // Verify cart badge shows 1
    await expect(page.getByTestId('cart-badge')).toHaveText('1');
  });

  test('cart drawer shows correct items and totals', async ({ page }) => {
    // Add two different products
    await page.getByRole('button', { name: /add to cart/i }).nth(0).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /add to cart/i }).nth(1).click();
    await page.waitForTimeout(500);

    // Open cart drawer
    await page.getByTestId('cart-icon-button').click();

    // Verify drawer is visible
    await expect(page.getByTestId('cart-drawer')).toBeVisible();

    // Verify two items
    await expect(page.getByTestId('cart-item')).toHaveCount(2);

    // Verify subtotal is calculated
    await expect(page.getByTestId('cart-subtotal')).not.toHaveText('₹0');
  });

  test('persists cart across page reload', async ({ page }) => {
    // Add product
    await page.getByRole('button', { name: /add to cart/i }).first().click();
    await expect(page.getByTestId('cart-badge')).toHaveText('1');

    // Reload page
    await page.reload();

    // Verify cart still has item
    await expect(page.getByTestId('cart-badge')).toHaveText('1');
  });
});
```

---

## 7. Test Data Strategy

### 7.1 MSW Data Factories

```typescript
// src/__tests__/mocks/factories.ts
import { factory, primaryKey } from '@mswjs/data';

export const db = factory({
  product: {
    id: primaryKey(Number),
    documentId: String,
    name: String,
    slug: String,
    description: String,
    price: Number,
    comparePrice: Number,
    images: Array,
    category: Object,
    stock: Number,
    featured: Boolean,
    createdAt: String,
    updatedAt: String,
  },
  category: {
    id: primaryKey(Number),
    documentId: String,
    name: String,
    slug: String,
    description: String,
    image: Object,
  },
  order: {
    id: primaryKey(Number),
    documentId: String,
    clerkUserId: String,
    items: Array,
    total: Number,
    status: String,
    paymentId: String,
    razorpayOrderId: String,
    address: Object,
    email: String,
    phone: String,
    createdAt: String,
  },
});
```

### 7.2 Seed Data

```typescript
// src/__tests__/mocks/seed.ts
import { db } from './factories';

export function seedTestData() {
  // Create categories
  const electronics = db.category.create({
    id: 1, documentId: 'cat1', name: 'Electronics', slug: 'electronics',
    description: 'Gadgets and devices',
  });
  const clothing = db.category.create({
    id: 2, documentId: 'cat2', name: 'Clothing', slug: 'clothing',
    description: 'Fashion apparel',
  });

  // Create products
  db.product.create({
    id: 1, documentId: 'prod1', name: 'Wireless Headphones', slug: 'wireless-headphones',
    description: 'Premium noise-cancelling headphones', price: 249900,
    comparePrice: 299900, images: [{ url: '/uploads/headphones.jpg', alternativeText: 'Headphones' }],
    category: electronics, stock: 50, featured: true,
    createdAt: '2026-01-15T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z',
  });

  db.product.create({
    id: 2, documentId: 'prod2', name: 'Cotton T-Shirt', slug: 'cotton-tshirt',
    description: 'Comfortable cotton t-shirt', price: 79900,
    images: [{ url: '/uploads/tshirt.jpg', alternativeText: 'T-Shirt' }],
    category: clothing, stock: 100, featured: false,
    createdAt: '2026-02-10T00:00:00Z', updatedAt: '2026-05-20T00:00:00Z',
  });

  // Create orders
  db.order.create({
    id: 1, documentId: 'ord1', clerkUserId: 'user_2abc123',
    items: [{ productId: 1, name: 'Wireless Headphones', price: 249900, quantity: 1, image: '/uploads/headphones.jpg' }],
    total: 249900, status: 'paid', paymentId: 'pay_test123', razorpayOrderId: 'order_test123',
    address: { fullName: 'John Doe', street: '123 Main St', city: 'Mumbai', state: 'Maharashtra', zipCode: '400001', country: 'India' },
    email: 'john@example.com', phone: '9876543210',
    createdAt: '2026-06-15T10:30:00Z',
  });
}
```

### 7.3 Data Strategy by Test Type

| Test Type | Data Source | Data Freshness |
|-----------|-------------|----------------|
| **Unit** | Inline mock objects | Fresh per test (isolated) |
| **Integration** | MSW Data factories + seed | Fresh per test file (`beforeEach` reseed) |
| **E2E** | MSW Playwright handlers (static mocks) | Static per test run |
| **E2E (Auth)** | Real Clerk test account | Persistent across test runs |

---

## 8. CI/CD Integration

### 8.1 GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck

  unit-and-integration:
    runs-on: ubuntu-latest
    needs: lint-and-typecheck
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'
      - run: npm ci
      - run: npx vitest --coverage
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage-report
          path: coverage/

  e2e:
    runs-on: ubuntu-latest
    needs: lint-and-typecheck
    strategy:
      fail-fast: false
      matrix:
        shardIndex: [1, 2, 3, 4]
        shardTotal: [4]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps
      - name: Run E2E tests (shard ${{ matrix.shardIndex }}/${{ matrix.shardTotal }})
        run: npx playwright test --shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }}
        env:
          CLERK_SECRET_KEY: ${{ secrets.CLERK_SECRET_KEY }}
          NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ${{ secrets.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY }}
          RAZORPAY_KEY_SECRET: ${{ secrets.RAZORPAY_KEY_SECRET }}
          RAZORPAY_WEBHOOK_SECRET: ${{ secrets.RAZORPAY_WEBHOOK_SECRET }}
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report-${{ matrix.shardIndex }}
          path: playwright-report/

  test-summary:
    runs-on: ubuntu-latest
    needs: [unit-and-integration, e2e]
    if: always()
    steps:
      - run: echo "All tests completed"
```

### 8.2 Pre-commit Hook

```json
// package.json (lint-staged config)
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,css}": ["prettier --write"]
  }
}
```

```json
// package.json (husky config)
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "npm run typecheck && npm run test:unit"
    }
  }
}
```

### 8.3 Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:unit": "vitest run --project=unit",
    "test:integration": "vitest run --project=integration",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:all": "npm run test && npm run test:e2e",
    "lint": "eslint src/ --ext .ts,.tsx",
    "typecheck": "tsc --noEmit",
    "format": "prettier --write 'src/**/*.{ts,tsx}'"
  }
}
```

---

## 9. Phase-Wise Test Coverage Map

| Feature | Phase | Unit | Integration | E2E | Total Tests |
|---------|-------|------|-------------|-----|-------------|
| **Product Listing** | Basic | 4 | 2 | 1 | 7 |
| **Product Detail** | Basic | 3 | 2 | 1 | 6 |
| **Category Filtering** | Basic | 2 | 1 | 1 | 4 |
| **Authentication (Clerk)** | Basic | 2 | 2 | 2 | 6 |
| **Navigation & Layout** | Basic | 4 | 0 | 0 | 4 |
| **Loading States** | Basic | 2 | 1 | 0 | 3 |
| **Error Boundaries** | Basic | 2 | 1 | 0 | 3 |
| **Responsive Layout** | Basic | 1 | 0 | 1 | 2 |
| **Phase 1 Subtotal** | | **20** | **9** | **6** | **35** |
| | | | | | |
| **Shopping Cart** | Mandatory | 8 | 4 | 4 | 16 |
| **Checkout Flow** | Mandatory | 4 | 3 | 2 | 9 |
| **Razorpay Payments** | Mandatory | 2 | 4 | 1 | 7 |
| **Webhook Handling** | Mandatory | 0 | 4 | 0 | 4 |
| **Order Management** | Mandatory | 4 | 2 | 2 | 8 |
| **Auth Guards** | Mandatory | 2 | 2 | 1 | 5 |
| **Toast Notifications** | Mandatory | 2 | 0 | 0 | 2 |
| **Phase 2 Subtotal** | | **22** | **19** | **10** | **51** |
| | | | | | |
| **Animations** | Advanced | 1 | 0 | 0 | 1 |
| **Search** | Advanced | 3 | 1 | 1 | 5 |
| **Sorting** | Advanced | 2 | 1 | 0 | 3 |
| **Image Gallery** | Advanced | 2 | 0 | 0 | 2 |
| **Dark Mode** | Advanced | 2 | 0 | 1 | 3 |
| **Wishlist** | Advanced | 3 | 1 | 1 | 5 |
| **SEO** | Advanced | 0 | 0 | 0 | 0 |
| **Accessibility** | Advanced | 0 | 0 | 0 | 0 |
| **404/Error Pages** | Advanced | 1 | 0 | 1 | 2 |
| **Phase 3 Subtotal** | | **14** | **3** | **4** | **21** |
| | | | | | |
| **GRAND TOTAL** | | **56** | **31** | **20** | **107** |

> **Note:** SEO and Accessibility are validated via Lighthouse CI audit, not traditional tests.

---

## 10. Key User Flows (E2E)

### 10.1 Browse → Add to Cart → Checkout → Pay

```
┌──────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│  Browser  │   │  Playwright  │   │  Clerk Auth   │   │  Razorpay    │
└────┬─────┘   └──────┬───────┘   └──────┬───────┘   └──────┬───────┘
     │                │                   │                   │
     │ 1. Navigate    │                   │                   │
     │   to /products │                   │                   │
     │◄───────────────│                   │                   │
     │                │                   │                   │
     │ 2. Verify      │                   │                   │
     │   product grid │                   │                   │
     │◄───────────────│                   │                   │
     │                │                   │                   │
     │ 3. Click       │                   │                   │
     │   "Add to Cart"│                   │                   │
     │◄───────────────│                   │                   │
     │                │                   │                   │
     │ 4. Verify      │                   │                   │
     │   toast + badge│                   │                   │
     │◄───────────────│                   │                   │
     │                │                   │                   │
     │ 5. Open cart   │                   │                   │
     │   drawer       │                   │                   │
     │◄───────────────│                   │                   │
     │                │                   │                   │
     │ 6. Verify      │                   │                   │
     │   items + total│                   │                   │
     │◄───────────────│                   │                   │
     │                │                   │                   │
     │ 7. Click       │                   │                   │
     │   "Checkout"   │                   │                   │
     │◄───────────────│                   │                   │
     │                │                   │                   │
     │ 8. Fill address│                   │                   │
     │   form         │                   │                   │
     │◄───────────────│                   │                   │
     │                │                   │                   │
     │ 9. Submit      │                   │                   │
     │   order        │                   │                   │
     │◄───────────────│                   │                   │
     │                │                   │                   │
     │ 10. Razorpay   │                   │                   │
     │    modal opens │                   │                   │
     │◄───────────────│──────────────────────────────────────►│
     │                │                   │                   │
     │ 11. Enter test │                   │                   │
     │    card details│                   │                   │
     │◄───────────────│──────────────────────────────────────►│
     │                │                   │                   │
     │ 12. Payment    │                   │                   │
     │    success     │                   │                   │
     │◄───────────────│──────────────────────────────────────►│
     │                │                   │                   │
     │ 13. Redirect   │                   │                   │
     │    to /orders/ │                   │                   │
     │    [id]        │                   │                   │
     │◄───────────────│                   │                   │
     │                │                   │                   │
     │ 14. Verify     │                   │                   │
     │    confirmation│                   │                   │
     │◄───────────────│                   │                   │
```

### 10.2 Authentication Flow

```
┌──────────┐   ┌──────────────┐   ┌──────────────┐
│  Browser  │   │  Playwright  │   │  Clerk Auth   │
└────┬─────┘   └──────┬───────┘   └──────┬───────┘
     │                │                   │
     │ 1. Visit       │                   │
     │   /checkout    │                   │
     │◄───────────────│                   │
     │                │                   │
     │ 2. Redirect    │                   │
     │   to /sign-in  │                   │
     │◄───────────────│                   │
     │                │                   │
     │ 3. Fill email  │                   │
     │◄───────────────│──────────────────►│
     │                │                   │
     │ 4. Fill        │                   │
     │   password     │                   │
     │◄───────────────│──────────────────►│
     │                │                   │
     │ 5. Click       │                   │
     │   "Continue"   │                   │
     │◄───────────────│──────────────────►│
     │                │                   │
     │ 6. OTP screen  │                   │
     │   (if shown)   │                   │
     │◄───────────────│──────────────────►│
     │                │                   │
     │ 7. Redirect    │                   │
     │   to /checkout │                   │
     │◄───────────────│                   │
     │                │                   │
     │ 8. Verify      │                   │
     │   checkout page│                   │
     │◄───────────────│                   │
```

---

## 11. Reporting & Monitoring

### 11.1 Test Reports

| Report | Tool | Format | Location | Retention |
|--------|------|--------|----------|-----------|
| Unit/Integration Coverage | Vitest + v8 | HTML, LCOV, text | `coverage/` | 30 days (CI artifacts) |
| E2E Results | Playwright | HTML, JSON | `playwright-report/` | 30 days (CI artifacts) |
| E2E Traces | Playwright | ZIP (trace.zip) | `test-results/` | 7 days (CI artifacts) |
| E2E Screenshots | Playwright | PNG | `test-results/` | 7 days (CI artifacts) |
| E2E Videos | Playwright | WebM | `test-results/` | 7 days (CI artifacts) |

### 11.2 Quality Gates

| Gate | Threshold | Action |
|------|-----------|--------|
| Unit test coverage | ≥ 80% statements, ≥ 75% branches | PR blocked if below threshold |
| E2E pass rate | 100% on critical flows | PR blocked if any critical E2E fails |
| Flaky tests | < 5% flake rate | Quarantine flaky tests, fix within 48 hours |
| Lint errors | 0 | PR blocked |
| TypeScript errors | 0 | PR blocked |

### 11.3 Flaky Test Management

```yaml
# .github/workflows/flaky-detection.yml
name: Flaky Test Detection

on:
  schedule:
    - cron: '0 6 * * 1-5'  # Run weekdays at 6 AM

jobs:
  flaky-detection:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - name: Run E2E tests 3 times
        run: |
          for i in 1 2 3; do
            npx playwright test --reporter=json --output=flaky-report-$i.json || true
          done
      - name: Analyze flaky tests
        run: node scripts/analyze-flaky.js
```

---

## 12. Challenges & Mitigations

| Challenge | Impact | Mitigation |
|-----------|--------|------------|
| **Clerk E2E session expiry** | Auth tests fail intermittently | Use `storageState` to persist session; re-authenticate only when expired; Clerk test accounts have longer session TTL |
| **Razorpay test OTP** | Payment E2E requires OTP input | Use Razorpay test card `4111 1111 1111 1111` with any future expiry and any CVV; no OTP required for test cards |
| **Strapi availability in CI** | Integration tests fail if Strapi is down | Mock Strapi entirely with MSW in all test layers; no real Strapi dependency in CI |
| **Image snapshot flakiness** | Visual regression tests fail on different renderers | Use Playwright's `toHaveScreenshot()` with `maxDiffPixelRatio: 0.05`; run on consistent OS (Ubuntu) |
| **TanStack Query timing** | Tests fail due to async cache timing | Use `waitFor` and `findBy*` queries instead of `getBy*`; set `gcTime: 0` in test QueryClient |
| **Framer Motion animation delays** | Component tests fail due to animation timing | Disable animations in test environment: `vi.mock('framer-motion', () => ({ motion: { div: 'div' } }))` |
| **PPR in E2E** | Static shell may not reflect latest data | Use `page.waitForLoadState('networkidle')` before assertions; disable PPR in test environment if needed |
| **Cross-browser CSS differences** | Layout tests fail on Firefox/WebKit | Use Playwright's `toHaveScreenshot()` with browser-specific snapshots; test critical layout only in Chromium |

---

*This document covers the testing architecture (HOW the system is tested). Detailed test implementations are covered in individual test files.*  
*Last updated: July 9, 2026*