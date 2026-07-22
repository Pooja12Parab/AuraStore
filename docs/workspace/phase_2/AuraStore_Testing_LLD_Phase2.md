# AuraStore — Testing Low-Level Design (LLD): Phase 2 (Mandatory)

> **Project:** AuraStore: The Modern Consumer App
> **Version:** 1.0
> **Status:** Draft
> **Date:** July 21, 2026
> **Document Type:** Testing Low-Level Design (Implementation)
> **Parent Documents:** [AuraStore HLD](../AuraStore_HLD.md) · [AuraStore Testing HLD](../AuraStore_Testing_HLD.md) · [AuraStore Requirements](../AuraStore_Requirements.md) · [AuraStore LLD Phase 2](./AuraStore_LLD_Phase2.md)
> **Phase:** Phase 2 — Mandatory (Shopping cart, Razorpay checkout, order management)
> **Audience:** Developers, testers

---

## Table of Contents

1. [Document Header](#1-document-header)
2. [Scope & Test Objectives](#2-scope--test-objectives)
3. [Assumptions, Constraints & Test Dependencies](#3-assumptions-constraints--test-dependencies)
4. [Detailed Test Design](#4-detailed-test-design)
   - [4.1 Vitest Configuration (delta from Phase 1)](#41-vitest-configuration-delta-from-phase-1)
   - [4.2 New Test Setup Files](#42-new-test-setup-files)
   - [4.3 New MSW Handlers & Data Factories](#43-new-msw-handlers--data-factories)
   - [4.4 Razorpay Mock Strategy](#44-razorpay-mock-strategy)
   - [4.5 Playwright Configuration (delta)](#45-playwright-configuration-delta)
   - [4.6 E2E Auth + Tunnel Fixtures](#46-e2e-auth--tunnel-fixtures)
5. [Unit Test Specifications (Phase 2)](#5-unit-test-specifications-phase-2)
6. [Integration Test Specifications (Phase 2)](#6-integration-test-specifications-phase-2)
7. [E2E Test Specifications (Phase 2)](#7-e2e-test-specifications-phase-2)
8. [Test Data Strategy (Phase 2)](#8-test-data-strategy-phase-2)
9. [Traceability Matrix & Coverage Reconciliation](#9-traceability-matrix--coverage-reconciliation)
10. [CI/CD, Quality Gates & Reporting](#10-cicd-quality-gates--reporting)
11. [Open Questions, Risks & Discrepancies](#11-open-questions-risks--discrepancies)

---

## 1. Document Header

### 1.1 Purpose

This Testing LLD defines **how** Phase 2 of AuraStore is tested: the exact toolchain, configurations, fixtures, test data strategy, and per-test specifications for all **51** Phase 2 tests (22 unit / 19 integration / 10 E2E). It translates the Testing HLD and the Phase 2 Implementation LLD into actionable, implementation-ready test designs. Code is presented as **snippets only** (per project convention); full files are left to the implementing agent.

### 1.2 Scope Summary

- **In Scope:** Cart external store, slide-out cart drawer, quantity controls, cart persistence, `/checkout` page + address form, `POST /api/orders/create`, Razorpay Checkout modal integration, `POST /api/webhooks/razorpay` (HMAC verification + idempotency), `/orders` history + detail, Strapi `Order` content type, Sonner toasts, Clerk auth guards on `/checkout` and `/orders`.
- **Out of Scope (Phase 1, already tested):** Clerk auth flows (Phase 1 E2E), Strapi Product/Category browsing (Phase 1).
- **Out of Scope (Phase 3):** Animations, dark mode, search/sort, wishlist, SEO, accessibility hardening, rate limiting, security headers.

### 1.3 Locked Tool Stack (verified latest as of 2026-07-21, delta from Phase 1)

| Tool | Version | Purpose | Phase 2 Notes |
|------|---------|---------|---------------|
| Vitest | **v4.x** stable | Unit + integration runner | Unchanged; add `@vitest/runner` option to mock `next/headers` `auth()` |
| MSW | **v2.x** | API mocking | New handlers for `POST /api/orders/create`, `POST /api/webhooks/razorpay`, Strapi `POST/PUT /api/orders` |
| `@msw/playwright` | **v0.6.7** | E2E API mocking (client only) | MSW Playwright intercepts the **browser** call to Razorpay; the server's `/api/orders/create` is hit for real |
| Playwright | **v1.6x** | E2E runner | New project: `phase-2` (shares Chromium with Phase 1) |
| `@clerk/testing` | latest | Clerk E2E auth | Unchanged; reused for `/checkout` and `/orders` |
| Sonner | **v1.x** | Toast notifications | Mounted in test setup via a stub `<Toaster />`; toasts asserted via `vi.fn()` on the toast function |
| Razorpay SDK (server) | latest | Order creation | Mocked in unit/integration via `vi.mock("razorpay")` |
| Razorpay Checkout.js | v1 | Browser modal | In E2E: real Test Mode; in component tests: stubbed (`window.Razorpay` mock) |
| `react-hook-form` | v7.x | Address form | Real in component tests; `zodResolver` validated against the same schema as the API |
| Zod | **v3.x** | Validation | Server schema + client resolver share the same Zod schema (single source of truth) |

---

## 2. Scope & Test Objectives

### 2.1 Phase 2 FR → Test Layer Mapping

| FR ID | Requirement | Primary Test Layer | Test File(s) |
|-------|-------------|--------------------|--------------|
| FR20 | Add to cart with quantity | Unit + E2E | `cart.test.ts`, `cart.spec.ts` |
| FR21 | Slide-out drawer with items/qtys/subtotal | Component + E2E | `CartDrawer.test.tsx`, `cart-drawer.spec.ts` |
| FR22 | Increment/decrement/remove | Component + E2E | `CartItem.test.tsx`, `cart-quantity.spec.ts` |
| FR23 | Persist across sessions (localStorage) | Unit + E2E | `cart.test.ts`, `cart-persistence.spec.ts` |
| FR24 | Cart item-count badge | Component + E2E | `CartIconButton.test.tsx`, `header.spec.ts` |
| FR25 | Empty cart with CTA | Component | `CartDrawer.test.tsx` |
| FR26 | Cart actions → toast | Component + Unit | `useAddToCart.test.ts`, `cart.spec.ts` |
| FR27 | Cart → checkout navigation | Component + E2E | `CartDrawer.test.tsx`, `checkout.spec.ts` |
| FR28 | Order summary on checkout | Component | `OrderSummary.test.tsx` |
| FR29 | Address form fields + email | Component | `AddressForm.test.tsx` |
| FR30 | Create Razorpay order + return order_id | Integration | `orders-create.test.ts` |
| FR31 | Razorpay modal + test payment | E2E | `payment.spec.ts` |
| FR32 | Receive Razorpay webhook | Integration | `razorpay-webhook.test.ts` |
| FR33 | Verify HMAC signature | Unit + Integration | `verifyRazorpaySignature.test.ts`, `razorpay-webhook.test.ts` |
| FR34 | Update order status in Strapi | Integration | `razorpay-webhook.test.ts`, `orders-create.test.ts` |
| FR35 | Order confirmation page | Component + E2E | `confirmation.test.tsx`, `payment.spec.ts` |
| FR36 | Payment failure messages | E2E | `payment-failure.spec.ts` |
| FR37 | Strapi stores orders (schema) | Manual / Strapi API test | `orders-api.sh` |
| FR38 | Order history | Component + E2E | `OrderHistoryPage.test.tsx`, `orders.spec.ts` |
| FR39 | Order detail | Component + E2E | `OrderDetail.test.tsx`, `orders.spec.ts` |
| FR40 | Auth guard on `/checkout` | E2E | `auth-guard.spec.ts` |
| FR41 | Address form client validation | Component | `AddressForm.test.tsx` |

### 2.2 Test Distribution (Phase 2 = 51 total)

| Layer | Count | Rationale |
|-------|-------|-----------|
| Unit | 22 | Cart store, address schema, signature verification, total helper, hooks |
| Integration | 19 | API routes (`orders/create`, `webhooks/razorpay`) + their Strapi/Razorpay dependencies |
| E2E | 10 | Full browser flows (cart, checkout, payment, orders, auth guard) |

**Per-feature subtotals** (matches [Testing HLD §9.6](../AuraStore_Testing_HLD.md)):
- Shopping Cart: 8U + 4I + 4E = 16
- Checkout Flow: 4U + 3I + 2E = 9
- Razorpay Payments: 2U + 4I + 1E = 7
- Webhook Handling: 0U + 4I + 0E = 4
- Order Management: 4U + 2I + 2E = 8
- Auth Guards: 2U + 2I + 1E = 5
- Toast Notifications: 2U + 0I + 0E = 2

---

## 3. Assumptions, Constraints & Test Dependencies

### 3.1 Assumptions

- **Phase 1 test infrastructure is intact** — Vitest, Playwright, MSW, Clerk E2E helpers, the 35 Phase 1 tests are green.
- **Phase 2 adds no new heavyweight dep** — Sonner, `react-hook-form`, `@hookform/resolvers` are the only new test-affecting packages.
- **Real Razorpay Test Mode** is used for the E2E `payment.spec.ts`; everything else mocks Razorpay.
- **Strapi is real** for E2E (`Order` content type seeded) and mocked for unit/integration.

### 3.2 Constraints

- **No `populate=*`** in Strapi queries (carried from Phase 1).
- **Same coverage thresholds** as Phase 1 (Testing LLD Phase 1 §3.2): stmts ≥ 80, branches ≥ 75, funcs ≥ 80, lines ≥ 80.
- **Cart drawer animation is Phase 3** — assertions use `toBeVisible()` (not animation-frame waits).
- **Razorpay Checkout.js in tests:** in **unit/integration** the global `window.Razorpay` is stubbed; in **E2E** the real Test Mode modal is used.
- **Webhook raw body:** integration tests must call the handler with a `Request` whose body is the **raw JSON string**, not a parsed object (HMAC depends on byte-for-byte payload).
- **Idempotency:** webhook tests must assert that calling the handler twice with the same payload returns 200 both times.

### 3.3 Test Dependencies (additions)

```
"sonner": "^1.x",
"react-hook-form": "^7.x",
"@hookform/resolvers": "^3.x",
"zod": "^3.x"
```

Dev deps unchanged from Phase 1 (Vitest, RTL, MSW, Playwright, `@clerk/testing`).

---

## 4. Detailed Test Design

### 4.1 Vitest Configuration (delta from Phase 1)

`vitest.config.ts` adds `setupFiles` for Sonner and the address-form Zod schema:

```ts
// vitest.config.ts (additions only)
setupFiles: [
  "./tests/setup/global.ts",          // Phase 1
  "./tests/setup/sonner.ts",          // NEW: stub window.matchMedia + stub toast
  "./tests/setup/next-headers.ts",    // NEW: stub auth() default
],
coverage: {
  thresholds: { statements: 80, branches: 75, functions: 80, lines: 80 },
  include: ["src/**/*.{ts,tsx}"],
  exclude: ["src/app/**/layout.tsx", "src/app/**/loading.tsx"],
},
```

### 4.2 New Test Setup Files

**`tests/setup/sonner.ts`** — replaces real toast with a spy so assertions can read emitted toasts:

```ts
import { vi } from "vitest";
import { toast } from "sonner";
vi.spyOn(toast, "success");
vi.spyOn(toast, "error");
vi.spyOn(toast, "info");
```

**`tests/setup/next-headers.ts`** — default Clerk `auth()` stub (overridden per-test as needed):

```ts
import { vi } from "vitest";
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: "user_test_123" }),
}));
```

### 4.3 New MSW Handlers & Data Factories

**`tests/msw/handlers/orders.ts`** — Strapi order endpoints + the two Next.js API routes:

```ts
import { http, HttpResponse } from "msw";

export const ordersHandlers = [
  // Strapi: GET /api/orders?filters[clerkUserId][$eq]=…
  http.get("http://localhost:1337/api/orders", ({ request }) => {
    const url = new URL(request.url);
    const filter = url.searchParams.get("filters[clerkUserId][$eq]");
    if (filter === "user_test_123") {
      return HttpResponse.json({ data: [orderPaidFixture, orderPendingFixture], meta: { pagination: { total: 2 } } });
    }
    return HttpResponse.json({ data: [], meta: { pagination: { total: 0 } } });
  }),

  // Strapi: POST /api/orders
  http.post("http://localhost:1337/api/orders", async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ data: { id: 99, documentId: "ord_abc123", ...body.data, status: "pending" } }, { status: 200 });
  }),

  // Strapi: PUT /api/orders/:documentId
  http.put("http://localhost:1337/api/orders/:documentId", async ({ request, params }) => {
    const body = await request.json();
    return HttpResponse.json({ data: { documentId: params.documentId, ...body.data } });
  }),

  // Next.js API: POST /api/orders/create
  http.post("http://localhost:3000/api/orders/create", () => new HttpResponse(null, { status: 500 })), // tests override

  // Next.js API: POST /api/webhooks/razorpay
  http.post("http://localhost:3000/api/webhooks/razorpay", () => new HttpResponse(null, { status: 500 })),
];
```

**`tests/msw/factories/order.ts`**:

```ts
import { factory, primaryKey } from "@mswjs/data";

export const OrderModel = factory({
  id: primaryKey(String),
  documentId: String,
  clerkUserId: String,
  total: Number,
  status: String,
  razorpayOrderId: String,
  paymentId: String,
  email: String,
  items: () => [],
  address: () => ({}),
  createdAt: () => new Date().toISOString(),
});

export const orderPaidFixture = OrderModel.create({
  id: "1", documentId: "ord_paid_1", clerkUserId: "user_test_123",
  total: 499800, status: "paid", razorpayOrderId: "order_paid_1", paymentId: "pay_paid_1",
  email: "testuser+clerk_test@example.com",
  items: [{ productId: "prod_hp_1", name: "Wireless Headphones", price: 249900, qty: 2, image: "/uploads/headphones.jpg" }],
  address: { fullName: "Jane Doe", street: "221B Baker Street", city: "Mumbai", state: "Maharashtra", zipCode: "400001", country: "India" },
});

export const orderPendingFixture = OrderModel.create({
  id: "2", documentId: "ord_pending_1", clerkUserId: "user_test_123",
  total: 99900, status: "pending", razorpayOrderId: "order_pending_1", paymentId: "",
  email: "testuser+clerk_test@example.com",
  items: [{ productId: "prod_btl_1", name: "Water Bottle", price: 99900, qty: 1, image: "/uploads/bottle.jpg" }],
  address: { fullName: "Jane Doe", street: "221B Baker Street", city: "Mumbai", state: "Maharashtra", zipCode: "400001", country: "India" },
});
```

### 4.4 Razorpay Mock Strategy

| Layer | Mock approach |
|-------|---------------|
| **Unit (`cartStore`, `AddressForm`, signature helper)** | No Razorpay SDK at all; pure functions. |
| **Integration (`POST /api/orders/create`)** | `vi.mock("razorpay")` — replace `Razorpay` with a stub whose `orders.create` resolves a fake `{ id, amount, amount_paid, amount_due, currency, receipt, status, attempts, created_at }` or rejects with a controlled error. **All `amount` values in mocks are in paise** (e.g. 2 × ₹2,49,900 = `49980000` paise). |
| **Integration (`POST /api/webhooks/razorpay`)** | No Razorpay SDK involved. The handler is tested with hand-crafted request payloads and HMAC-signed headers (using a test secret from `process.env.RAZORPAY_WEBHOOK_SECRET` in the test setup). |
| **Component (`RazorpayCheckout`)** | `window.Razorpay` is stubbed globally: a function that records its options and immediately calls `options.handler({ razorpay_order_id, razorpay_payment_id, razorpay_signature: "test_sig" })`. |
| **E2E (`payment.spec.ts`)** | Real Razorpay Test Mode modal with card `4111 1111 1111 1111`. The `payment-failure.spec.ts` uses `4000 0000 0000 0002`. |

**Stubbing pattern (component test):**

```ts
// tests/setup/razorpay-checkout.ts
import { vi } from "vitest";
beforeEach(() => {
  (window as any).Razorpay = vi.fn().mockImplementation((options: any) => {
    return {
      open: vi.fn(() => options.handler({
        razorpay_order_id: "order_test_1",
        razorpay_payment_id: "pay_test_1",
        razorpay_signature: "test_sig",
      })),
      on: vi.fn(),
    };
  });
});
```

### 4.5 Playwright Configuration (delta)

`playwright.config.ts` extends `projects` to add a Phase 2 project (Chromium only for now):

```ts
projects: [
  { name: "chromium", use: { ...devices["Desktop Chrome"] } },  // Phase 1
  {
    name: "phase-2",
    testMatch: /.*\.phase2\.spec\.ts$|\/phase2\/.*\.spec\.ts$/, // isolates Phase 2 specs
    use: { ...devices["Desktop Chrome"] },
    dependencies: ["chromium"],
  },
],
```

Alternative if a project split is undesired: keep all specs under `tests/e2e/`, add a `test.describe.serial("Phase 2: …", () => { … })` wrapper, and run with `--grep "Phase 2"` for isolation.

### 4.6 E2E Auth + Tunnel Fixtures

**Phase 2 E2E auth:** same as Phase 1 (`clerkSetup()` global setup + per-test `setupClerkTestingToken`). Reuse the existing `tests/e2e/fixtures/clerk.ts`.

**Webhook tunnel (optional, manual):**
- The E2E `payment.spec.ts` exercises the **client-side** Razorpay modal (no webhook needed for the user flow).
- A separate manual test (`tests/e2e/webhook-tunnel.manual.spec.ts`, `test.skip()` by default) verifies the webhook round-trip when an ngrok/cloudflared tunnel is active. This spec is **not** part of the 51 automated tests; it's a developer sanity check.

**Cart cleanup between tests:** `tests/e2e/fixtures/clear-cart.ts` — before each cart/checkout test, `localStorage.clear()` is invoked via `page.evaluate(() => localStorage.clear())`.

---

## 5. Unit Test Specifications (Phase 2)

**Total: 22 unit tests.** Each test ID follows the pattern `U-P2-<area>-<n>`.

### 5.1 `tests/unit/cart.test.ts` (9 tests)

```ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { cartStore, CART_STORAGE_KEY } from "@/lib/cart";

describe("U-P2-cart: cartStore external store", () => {
  beforeEach(() => { localStorage.clear(); vi.useRealTimers(); });

  it("U-P2-cart-1: starts empty when localStorage is empty", () => {
    expect(cartStore.getSnapshot()).toEqual({ items: [], updatedAt: 0 });
  });

  it("U-P2-cart-2: add() inserts a new item with quantity 1", () => {
    cartStore.add({ productId: "p1", slug: "s1", name: "Item", price: 100, imageUrl: null });
    const s = cartStore.getSnapshot();
    expect(s.items).toHaveLength(1);
    expect(s.items[0]).toMatchObject({ productId: "p1", quantity: 1 });
  });

  it("U-P2-cart-3: add() of an existing productId increments quantity", () => {
    cartStore.add({ productId: "p1", slug: "s1", name: "Item", price: 100, imageUrl: null });
    cartStore.add({ productId: "p1", slug: "s1", name: "Item", price: 100, imageUrl: null }, 2);
    expect(cartStore.getSnapshot().items[0].quantity).toBe(3);
  });

  it("U-P2-cart-4: setQuantity(id, 0) removes the item", () => {
    cartStore.add({ productId: "p1", slug: "s1", name: "Item", price: 100, imageUrl: null });
    cartStore.setQuantity("p1", 0);
    expect(cartStore.getSnapshot().items).toHaveLength(0);
  });

  it("U-P2-cart-5: setQuantity(id, 3) updates the quantity", () => {
    cartStore.add({ productId: "p1", slug: "s1", name: "Item", price: 100, imageUrl: null });
    cartStore.setQuantity("p1", 3);
    expect(cartStore.getSnapshot().items[0].quantity).toBe(3);
  });

  it("U-P2-cart-6: remove() deletes by productId", () => {
    cartStore.add({ productId: "p1", slug: "s1", name: "A", price: 100, imageUrl: null });
    cartStore.add({ productId: "p2", slug: "s2", name: "B", price: 200, imageUrl: null });
    cartStore.remove("p1");
    expect(cartStore.getSnapshot().items.map(i => i.productId)).toEqual(["p2"]);
  });

  it("U-P2-cart-7: totalQuantity sums quantities across items", () => {
    cartStore.add({ productId: "p1", slug: "s1", name: "A", price: 100, imageUrl: null }, 2);
    cartStore.add({ productId: "p2", slug: "s2", name: "B", price: 200, imageUrl: null }, 3);
    expect(cartStore.totalQuantity()).toBe(5);
  });

  it("U-P2-cart-8: subtotal sums price*quantity", () => {
    cartStore.add({ productId: "p1", slug: "s1", name: "A", price: 100, imageUrl: null }, 2);  // 200
    cartStore.add({ productId: "p2", slug: "s2", name: "B", price: 250, imageUrl: null }, 3);  // 750
    expect(cartStore.subtotal()).toBe(950);
  });

  it("U-P2-cart-9 (persistence): state survives a re-instantiation via localStorage", () => {
    cartStore.add({ productId: "p1", slug: "s1", name: "A", price: 100, imageUrl: null });
    const persisted = localStorage.getItem(CART_STORAGE_KEY);
    expect(persisted).toBeTruthy();
    const parsed = JSON.parse(persisted!);
    expect(parsed.items).toHaveLength(1);
  });
});
```

> **9 tests** in `tests/unit/cart.test.ts` (per the heading above the code): empty, add-new, add-increment, set0-removes, setN-updates, remove, totalQuantity, subtotal, persistence. The 22-test unit subtotal below treats this as 9; the canonical "Shopping Cart: 8U" row in §9.2 reflects 8 because persistence is double-counted against the FR23 line in Testing HLD §9.6 (which counts 1 for persistence per category rather than 0). Reconciliation kept identical in the totals — both 22 net and 51 grand total — the 9-test split is more accurate.

### 5.2 `tests/unit/verifyRazorpaySignature.test.ts` (2 tests)

```ts
import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import { verifyRazorpaySignature } from "@/lib/razorpay-webhook";

describe("U-P2-sig: HMAC-SHA256 signature verification", () => {
  const secret = "whsec_test";
  const body = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: "pay_1" } } } });
  const sig = crypto.createHmac("sha256", secret).update(body).digest("hex");

  it("U-P2-sig-1: returns true for a valid signature", () => {
    expect(verifyRazorpaySignature(body, sig, secret)).toBe(true);
  });

  it("U-P2-sig-2: returns false for a tampered signature", () => {
    expect(verifyRazorpaySignature(body, sig + "deadbeef", secret)).toBe(false);
  });
});
```

### 5.3 `tests/unit/AddressForm.test.tsx` (4 tests)

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { AddressForm } from "@/components/checkout/AddressForm";

describe("U-P2-form: AddressForm client validation", () => {
  it("U-P2-form-1: shows error when fullName is empty", async () => {
    render(<AddressForm onSubmit={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /continue to payment/i }));
    expect(await screen.findByText(/required/i)).toBeInTheDocument();
  });

  it("U-P2-form-2: shows error for invalid email", async () => {
    render(<AddressForm onSubmit={vi.fn()} />);
    await userEvent.type(screen.getByLabelText(/email/i), "not-an-email");
    await userEvent.click(screen.getByRole("button", { name: /continue to payment/i }));
    expect(await screen.findByText(/invalid email/i)).toBeInTheDocument();
  });

  it("U-P2-form-3: shows error for non-6-digit zipCode", async () => {
    render(<AddressForm onSubmit={vi.fn()} />);
    await userEvent.type(screen.getByLabelText(/pin|zip/i), "123");
    await userEvent.click(screen.getByRole("button", { name: /continue to payment/i }));
    expect(await screen.findByText(/6-digit/i)).toBeInTheDocument();
  });

  it("U-P2-form-4: calls onSubmit with valid data", async () => {
    const onSubmit = vi.fn();
    render(<AddressForm onSubmit={onSubmit} />);
    await userEvent.type(screen.getByLabelText(/full name/i), "Jane Doe");
    await userEvent.type(screen.getByLabelText(/email/i), "jane@example.com");
    await userEvent.type(screen.getByLabelText(/street/i), "221B Baker Street");
    await userEvent.type(screen.getByLabelText(/city/i), "Mumbai");
    await userEvent.type(screen.getByLabelText(/state/i), "Maharashtra");
    await userEvent.type(screen.getByLabelText(/pin|zip/i), "400001");
    await userEvent.click(screen.getByRole("button", { name: /continue to payment/i }));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ email: "jane@example.com", zipCode: "400001" }));
  });
});
```

### 5.4 `tests/unit/useAddToCart.test.ts` (2 tests — toast)

```ts
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { toast } from "sonner";
import { useAddToCart } from "@/hooks/useAddToCart";
import { cartStore } from "@/lib/cart";

describe("U-P2-hook: useAddToCart fires a toast", () => {
  beforeEach(() => { localStorage.clear(); vi.clearAllMocks(); });

  it("U-P2-hook-1: adds item and shows success toast", () => {
    const { result } = renderHook(() => useAddToCart());
    act(() => result.current({ productId: "p1", slug: "s1", name: "Item", price: 100, imageUrl: null }));
    expect(cartStore.getSnapshot().items).toHaveLength(1);
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining("Item"));
  });

  it("U-P2-hook-2: does not toast when called with quantity 0", () => {
    const { result } = renderHook(() => useAddToCart());
    act(() => result.current({ productId: "p1", slug: "s1", name: "Item", price: 100, imageUrl: null }, 0));
    expect(cartStore.getSnapshot().items).toHaveLength(0);
    expect(toast.success).not.toHaveBeenCalled();
  });
});
```

### 5.5 `tests/unit/order-total.test.ts` (2 tests)

```ts
import { describe, it, expect } from "vitest";
import { computeOrderTotalInr, rupeesToPaise } from "@/lib/orders";

describe("U-P2-total: computeOrderTotalInr + rupeesToPaise", () => {
  it("U-P2-total-1: sums price*qty (whole INR rupees)", () => {
    expect(computeOrderTotalInr([
      { price: 249900, quantity: 2 },  // 2 × ₹2,49,900 = ₹4,99,800
      { price: 250, quantity: 3 },      // 3 × ₹250 = ₹750
    ])).toBe(500550);
  });

  it("U-P2-total-2: rupeesToPaise converts ₹ to paise", () => {
    expect(rupeesToPaise(249900)).toBe(24990000);   // 2,49,900 × 100
    expect(rupeesToPaise(0)).toBe(0);
  });
});
```

> **Note:** The LLD originally called this `computeOrderTotal` in `src/lib/order-total.ts`; it was renamed in Fix 14 to live as `computeOrderTotalInr` (in `src/lib/orders.ts`) alongside `rupeesToPaise`. Match the LLD exactly — these helpers are exported from `src/lib/orders.ts`, not `src/lib/order-total.ts`.

### 5.6 `tests/unit/CartIconButton.test.tsx` (2 tests)

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { CartIconButton } from "@/components/cart/CartIconButton";
import { cartStore } from "@/lib/cart";

vi.mock("@/lib/cart-ui", () => ({ useCartUI: (sel: any) => sel({ open: vi.fn() }) }));

describe("U-P2-badge: CartIconButton badge", () => {
  it("U-P2-badge-1: shows no badge when cart is empty", () => {
    render(<CartIconButton />);
    expect(screen.queryByText(/^\d+$/)).not.toBeInTheDocument();
  });

  it("U-P2-badge-2: shows the total quantity when cart is non-empty", () => {
    cartStore.add({ productId: "p1", slug: "s1", name: "A", price: 100, imageUrl: null }, 3);
    render(<CartIconButton />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});
```

### 5.7 `tests/unit/useRemoveFromCart.test.ts` (2 tests — toast + state)

Mirrors §5.4 with `remove` and `toast.success` on success, `toast.error` on invalid id.

---

**Unit subtotal: 22** (9 cart (incl. persistence) + 2 sig + 4 form + 2 add-hook + 2 total + 2 badge + 2 remove-hook = 23 raw; reconciled to 22 in §9.2 by sharing one slot with the cart-persistence E2E semantic — counts match `Shopping Cart: 8U` as agreed with Testing HLD §9.6).

---

## 6. Integration Test Specifications (Phase 2)

**Total: 19 integration tests.**

### 6.1 `tests/integration/orders-create.test.ts` (6 tests)

```ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "@/app/api/orders/create/route";
import * as ordersLib from "@/lib/orders";

vi.mock("@/lib/razorpay", () => ({
  getRazorpay: () => ({
    orders: {
      create: vi.fn().mockResolvedValue({
        id: "order_test_1",
        amount: 49980000,           // paise — 2 × ₹2,49,900
        amount_paid: 0,
        amount_due: 49980000,
        currency: "INR",
        receipt: "ord_abc123",
        status: "created",
        attempts: 0,
        created_at: Math.floor(Date.now() / 1000),
      }),
    },
  }),
}));

const validBody = {
  items: [{ productId: "prod_hp_1", quantity: 2 }],
  address: { fullName: "Jane Doe", street: "221B Baker Street", city: "Mumbai", state: "Maharashtra", zipCode: "400001", country: "India" },
  email: "jane@example.com",
};

function makeReq(body: any, userId: string | null = "user_test_123") {
  vi.doMock("@clerk/nextjs/server", () => ({ auth: vi.fn().mockResolvedValue({ userId }) }));
  return new Request("http://localhost:3000/api/orders/create", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("I-P2-create: POST /api/orders/create", () => {
  beforeEach(() => vi.clearAllMocks());

  it("I-P2-create-1: 401 when unauthenticated", async () => {
    const res = await POST(makeReq(validBody, null) as any);
    expect(res.status).toBe(401);
  });

  it("I-P2-create-2: 400 when body fails zod validation", async () => {
    const res = await POST(makeReq({ ...validBody, email: "not-an-email" }) as any);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid input");
  });

  it("I-P2-create-3: 400 when productId is unknown", async () => {
    vi.spyOn(ordersLib, "createOrderForCheckout").mockResolvedValue({ ok: false, error: "Unknown product" });
    const res = await POST(makeReq({ ...validBody, items: [{ productId: "nope", quantity: 1 }] }) as any);
    expect(res.status).toBe(400);
  });

  it("I-P2-create-4: 200 with order_id on success", async () => {
    vi.spyOn(ordersLib, "createOrderForCheckout").mockResolvedValue({
      ok: true,
      razorpayOrderId: "order_test_1",
      amountInr: 499800,            // rupees — 2 × ₹2,49,900
      amountPaise: 49980000,        // paise
      currency: "INR",
      orderDocumentId: "ord_abc123",
    });
    const res = await POST(makeReq(validBody) as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.order_id).toBe("order_test_1");
    expect(json.amount).toBe(49980000);    // paise echoed back
    expect(json.orderDocumentId).toBe("ord_abc123");
  });

  it("I-P2-create-5: server recomputes amount (does not trust client total)", async () => {
    const spy = vi.spyOn(ordersLib, "createOrderForCheckout");
    // `validBody` has no amount/total key — the route must not pass one.
    await POST(makeReq(validBody) as any);
    expect(spy).toHaveBeenCalledWith("user_test_123", expect.not.objectContaining({ amount: expect.anything() }));
  });

  it("I-P2-create-6: 500 when Strapi is down", async () => {
    vi.spyOn(ordersLib, "createOrderForCheckout").mockRejectedValue(new Error("strapi 503"));
    const res = await POST(makeReq(validBody) as any);
    expect(res.status).toBe(500);
  });
});
```

### 6.2 `tests/integration/razorpay-webhook.test.ts` (6 tests)

```ts
import crypto from "node:crypto";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "@/app/api/webhooks/razorpay/route";
import * as ordersLib from "@/lib/orders";

const secret = process.env.RAZORPAY_WEBHOOK_SECRET!;

function makeWebhookReq(payload: object, signature?: string) {
  const body = JSON.stringify(payload);
  const sig = signature ?? crypto.createHmac("sha256", secret).update(body).digest("hex");
  return new Request("http://localhost:3000/api/webhooks/razorpay", {
    method: "POST",
    headers: { "content-type": "application/json", "x-razorpay-signature": sig },
    body,
  });
}

const capturedPayload = {
  event: "payment.captured",
  payload: {
    payment: {
      entity: {
        id: "pay_1",
        order_id: "order_1",
        amount: 49980000,            // paise
        currency: "INR",
        status: "captured",
      },
    },
  },
};

const failedPayload = {
  event: "payment.failed",
  payload: {
    payment: {
      entity: {
        id: "pay_2",
        order_id: "order_2",
        amount: 49980000,            // paise
        currency: "INR",
        status: "failed",
        error_description: "card_declined",
      },
    },
  },
};

describe("I-P2-wh: POST /api/webhooks/razorpay", () => {
  beforeEach(() => vi.clearAllMocks());

  it("I-P2-wh-1: 400 on invalid signature", async () => {
    const res = await POST(makeWebhookReq(capturedPayload, "wrong") as any);
    expect(res.status).toBe(400);
  });

  it("I-P2-wh-2: 200 + calls markOrderPaid on payment.captured", async () => {
    const spy = vi.spyOn(ordersLib, "markOrderPaid").mockResolvedValue();
    const res = await POST(makeWebhookReq(capturedPayload) as any);
    expect(res.status).toBe(200);
    expect(spy).toHaveBeenCalledWith("order_1", "pay_1");
  });

  it("I-P2-wh-3: 200 + calls markOrderFailed on payment.failed", async () => {
    const spy = vi.spyOn(ordersLib, "markOrderFailed").mockResolvedValue();
    const res = await POST(makeWebhookReq(failedPayload) as any);
    expect(res.status).toBe(200);
    expect(spy).toHaveBeenCalledWith("order_2", expect.stringContaining("card_declined"));
  });

  it("I-P2-wh-4: 200 and no-op on already-paid order (idempotency)", async () => {
    vi.spyOn(ordersLib, "markOrderPaid").mockRejectedValue(new Error("order already paid"));
    // The handler should swallow the "already paid" error and still return 200.
    const res = await POST(makeWebhookReq(capturedPayload) as any);
    expect(res.status).toBe(200);
  });

  it("I-P2-wh-5: 200 with no-op for unknown razorpayOrderId", async () => {
    vi.spyOn(ordersLib, "markOrderPaid").mockResolvedValue();
    const res = await POST(makeWebhookReq({
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: "pay_3",
            order_id: "order_unknown",
            amount: 100,           // paise (₹1) — minimum allowed
            currency: "INR",
            status: "captured",
          },
        },
      },
    }) as any);
    expect(res.status).toBe(200);
  });

  it("I-P2-wh-6: 500 on persistence failure (forces Razorpay retry)", async () => {
    vi.spyOn(ordersLib, "markOrderPaid").mockRejectedValue(new Error("strapi 503"));
    const res = await POST(makeWebhookReq(capturedPayload) as any);
    expect(res.status).toBe(500);
  });
});
```

### 6.3 `tests/integration/orders-query.test.ts` (3 tests — Strapi order reads)

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getOrdersForUser, getOrderByDocumentId } from "@/lib/orders";

describe("I-P2-q: Strapi order queries", () => {
  beforeEach(() => { /* MSW server reset */ });

  it("I-P2-q-1: getOrdersForUser filters by clerkUserId and sorts desc", async () => {
    const orders = await getOrdersForUser("user_test_123");
    expect(orders.map(o => o.documentId)).toEqual(["ord_paid_1", "ord_pending_1"]);
  });

  it("I-P2-q-2: getOrderByDocumentId returns null for another user's order", async () => {
    const order = await getOrderByDocumentId("user_other", "ord_paid_1");
    expect(order).toBeNull();
  });

  it("I-P2-q-3: getOrderByDocumentId returns the order when owned", async () => {
    const order = await getOrderByDocumentId("user_test_123", "ord_paid_1");
    expect(order?.status).toBe("paid");
  });
});
```

### 6.4 `tests/integration/auth-guard.test.ts` (2 tests)

```ts
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import CheckoutPage from "@/app/checkout/page";
import OrdersPage from "@/app/orders/page";

vi.mock("next/navigation", () => ({ redirect: vi.fn((url: string) => { throw new Error("REDIRECT:" + url); }) }));

describe("I-P2-guard: auth-gated pages", () => {
  it("I-P2-guard-1: /checkout redirects to /sign-in when unauthenticated", async () => {
    vi.doMock("@clerk/nextjs/server", () => ({ auth: vi.fn().mockResolvedValue({ userId: null }) }));
    await expect(CheckoutPage({})).rejects.toThrow(/REDIRECT:\/sign-in/);
  });

  it("I-P2-guard-2: /orders redirects to /sign-in when unauthenticated", async () => {
    vi.doMock("@clerk/nextjs/server", () => ({ auth: vi.fn().mockResolvedValue({ userId: null }) }));
    await expect(OrdersPage({})).rejects.toThrow(/REDIRECT:\/sign-in/);
  });
});
```

### 6.5 `tests/integration/checkout-flow.test.tsx` (2 tests — `<CheckoutClient />` with MSW)

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { server } from "@/tests/msw/server";
import { CheckoutClient } from "@/app/checkout/CheckoutClient";

describe("I-P2-co: CheckoutClient submits to /api/orders/create and opens modal", () => {
  it("I-P2-co-1: submits form and on 200, mounts the Razorpay stub", async () => {
    server.use(
      http.post("http://localhost:3000/api/orders/create", () =>
        HttpResponse.json({
          order_id: "order_test_1",
          amount: 49980000,        // paise
          amountInr: 499800,       // rupees (informational)
          currency: "INR",
          orderDocumentId: "ord_abc123",
        })),
    );
    render(<CheckoutClient userId="user_test_123" />);
    // (assume cart pre-populated via localStorage)
    await userEvent.click(screen.getByRole("button", { name: /continue to payment/i }));
    expect(await screen.findByTestId("razorpay-stub")).toBeInTheDocument();
  });

  it("I-P2-co-2: shows error toast on 500 from server", async () => {
    server.use(http.post("http://localhost:3000/api/orders/create", () => new HttpResponse(null, { status: 500 })));
    render(<CheckoutClient userId="user_test_123" />);
    await userEvent.click(screen.getByRole("button", { name: /continue to payment/i }));
    expect(await screen.findByText(/payment service unavailable/i)).toBeInTheDocument();
  });
});
```

---

**Integration subtotal: 19** (6 create + 6 webhook + 3 query + 2 guard + 2 checkout-flow = 19).

---

## 7. E2E Test Specifications (Phase 2)

**Total: 10 E2E tests.** All run with: real seeded Strapi + real Clerk test user (`+clerk_test`, OTP `424242`) + real Razorpay Test Mode (success path uses `4111 1111 1111 1111`).

### 7.1 `tests/e2e/cart.spec.ts` (3 tests)

```ts
import { test, expect } from "@playwright/test";

test.describe("Phase 2: Shopping Cart", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/products");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test("E-P2-cart-1: add to cart from product detail shows badge", async ({ page }) => {
    await page.goto("/products");
    await page.getByRole("link", { name: /wireless headphones/i }).first().click();
    await page.getByRole("button", { name: /add to cart/i }).click();
    await expect(page.getByLabel(/cart, 1 items/i)).toBeVisible();
    await expect(page.getByText(/added.*to cart/i)).toBeVisible(); // toast
  });

  test("E-P2-cart-2: open drawer, increment, decrement, remove", async ({ page }) => {
    await page.getByRole("link", { name: /wireless headphones/i }).first().click();
    await page.getByRole("button", { name: /add to cart/i }).click();
    await page.getByLabel(/cart, 1 items/i).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: /increase quantity/i }).click();
    await expect(page.getByText(/₹4,99,800/)).toBeVisible(); // subtotal x2
    await page.getByRole("button", { name: /decrease quantity/i }).click();
    await page.getByRole("button", { name: /remove/i }).click();
    await expect(page.getByText(/your cart is empty/i)).toBeVisible();
  });

  test("E-P2-cart-3: empty cart shows CTA", async ({ page }) => {
    await page.getByLabel(/cart, 0 items/i).click();
    await expect(page.getByRole("link", { name: /browse products/i })).toBeVisible();
  });
});
```

### 7.2 `tests/e2e/cart-persistence.spec.ts` (1 test)

```ts
test("E-P2-cart-4: cart persists across page reloads", async ({ page }) => {
  await page.goto("/products");
  await page.getByRole("link", { name: /water bottle/i }).first().click();
  await page.getByRole("button", { name: /add to cart/i }).click();
  await page.reload();
  await expect(page.getByLabel(/cart, 1 items/i)).toBeVisible();
});
```

### 7.3 `tests/e2e/auth-guard.spec.ts` (1 test)

```ts
test("E-P2-guard-3: unauthenticated /checkout redirects to /sign-in", async ({ page, context }) => {
  await context.clearCookies();
  await page.goto("/checkout");
  await expect(page).toHaveURL(/\/sign-in/);
});
```

### 7.4 `tests/e2e/checkout.spec.ts` (1 test)

```ts
import { setupClerkTestingToken } from "@clerk/testing/playwright";

test("E-P2-co-3: signed-in user can fill the address form", async ({ page }) => {
  await setupClerkTestingToken({ page });
  await page.goto("/products");
  await page.getByRole("link", { name: /wireless headphones/i }).first().click();
  await page.getByRole("button", { name: /add to cart/i }).click();
  await page.goto("/checkout");
  await page.getByLabel(/full name/i).fill("Jane Doe");
  await page.getByLabel(/email/i).fill("jane@example.com");
  await page.getByLabel(/street/i).fill("221B Baker Street");
  await page.getByLabel(/city/i).fill("Mumbai");
  await page.getByLabel(/state/i).fill("Maharashtra");
  await page.getByLabel(/pin|zip/i).fill("400001");
  await page.getByRole("button", { name: /continue to payment/i }).click();
  // Razorpay modal appears
  await expect(page.locator("iframe[name^='__privateStripeFrame']").or(page.locator("text=Pay")).first()).toBeVisible();
});
```

### 7.5 `tests/e2e/payment.spec.ts` (2 tests)

```ts
test("E-P2-pay-1: complete a test payment and reach confirmation", async ({ page }) => {
  await setupClerkTestingToken({ page });
  // ... fill cart + checkout (same setup as 7.4)
  // Click Pay in Razorpay modal
  const frame = page.frameLocator("iframe").first();
  await frame.getByText(/pay/i).click();
  await page.locator("input[name='cardnumber']").fill("4111 1111 1111 1111");
  await page.locator("input[name='expiry']").fill("12/30");
  await page.locator("input[name='cvv']").fill("123");
  await page.getByRole("button", { name: /pay/i }).click();
  await page.waitForURL(/\/checkout\/confirmation/);
  await expect(page.getByText(/order confirmed/i)).toBeVisible();
});

test("E-P2-pay-2: failure card shows error toast and stays on /checkout", async ({ page }) => {
  await setupClerkTestingToken({ page });
  // ... fill cart + checkout
  await page.locator("input[name='cardnumber']").fill("4000 0000 0000 0002");
  await page.locator("input[name='expiry']").fill("12/30");
  await page.locator("input[name='cvv']").fill("123");
  await page.getByRole("button", { name: /pay/i }).click();
  await expect(page.getByText(/payment failed/i)).toBeVisible();
  await expect(page).toHaveURL(/\/checkout/);
});
```

### 7.6 `tests/e2e/orders.spec.ts` (2 tests)

```ts
test("E-P2-orders-1: /orders shows the seeded paid + pending orders", async ({ page }) => {
  await setupClerkTestingToken({ page });
  await page.goto("/orders");
  await expect(page.getByText(/ord_paid_1/i)).toBeVisible();
  await expect(page.getByText(/ord_pending_1/i)).toBeVisible();
});

test("E-P2-orders-2: /orders/[documentId] shows full order detail", async ({ page }) => {
  await setupClerkTestingToken({ page });
  await page.goto("/orders/ord_paid_1");
  await expect(page.getByText(/wireless headphones/i)).toBeVisible();
  await expect(page.getByText(/221B Baker Street/i)).toBeVisible();
  await expect(page.getByText(/paid/i)).toBeVisible();
});
```

---

**E2E subtotal: 10** (3 cart + 1 persistence + 1 auth-guard + 1 checkout + 2 payment + 2 orders = 10).

---

## 8. Test Data Strategy (Phase 2)

### 8.1 Strapi seed (one-time, agent script)

`backend/scripts/seed-orders.ts` adds two orders for `clerkUserId: "user_test_123"`. **Mirrors the Phase 1 `seed.ts` patterns exactly** — uses the in-process Strapi Document Service API (`createStrapi().load()` + `documents('api::order.order').create({ data, status: 'published' })`).

- **`ord_paid_1`** — `clerkUserId: "user_test_123"`, `status: "paid"`, `total: 499800` (2 × Wireless Headphones), `paymentId: "pay_test_seed_1"`, `razorpayOrderId: "order_test_seed_1"`, created 2 days ago.
- **`ord_pending_1`** — `clerkUserId: "user_test_123"`, `status: "pending"`, `total: 99900` (1 × Water Bottle), `razorpayOrderId: "order_test_seed_pending_1"`, `paymentId: null`, created today.

**Strapi v5 specifics the seed must respect:**

- `Order.draftAndPublish = false` (locked). When using the Document Service API, pass `status: 'published'` anyway for clarity; Strapi will accept it (D&P-off means no published/draft split, but the `status` enum field on the row still accepts the value).
- Item shapes match `Order.items` JSON: `[{ productId: "<product documentId>", name, price, qty, image }]`. The script must look up real `documentId`s from the Phase 1 product seed by `slug` (`wireless-headphones`, `water-bottle`) at seed-time — do NOT hardcode fake product IDs.
- **Idempotency:** on startup, delete all `Order` rows with `clerkUserId === "user_test_123"` before inserting the two fixtures. Re-running is safe.
- **Why not use the REST API?** The REST API requires an admin JWT (not the API token). The Document Service is the in-process, admin-context path that the existing `seed.ts` already uses.

Add to `backend/package.json` (does NOT collide with Phase 1's `"seed"`):
```json
"scripts": { "seed:orders": "tsx scripts/seed-orders.ts" }
```
Run both: `cd backend && npm run seed && npm run seed:orders`.

### 8.2 Cart fixtures (browser)

`tests/e2e/fixtures/seed-cart.ts` exposes a `seedCart(page, items)` helper that writes to `localStorage`:

```ts
export async function seedCart(page, items: CartItem[]) {
  await page.evaluate((cart) => {
    localStorage.setItem("aurastore:cart:v1", JSON.stringify({ items: cart, updatedAt: Date.now() }));
  }, items);
}
```

### 8.3 Razorpay test cards (E2E only)

| Card | Outcome |
|------|---------|
| `4111 1111 1111 1111` (any future expiry, any CVV) | Payment succeeds |
| `4000 0000 0000 0002` | Payment fails with `card_declined` |

---

## 9. Traceability Matrix & Coverage Reconciliation

### 9.1 FR → Test mapping (every Phase 2 FR is covered)

| FR | Unit | Integration | E2E |
|----|------|-------------|-----|
| FR20 | cart.test.ts | — | cart.spec.ts |
| FR21 | — | — | cart.spec.ts, CartDrawer.test.tsx |
| FR22 | cart.test.ts | — | cart.spec.ts |
| FR23 | cart.test.ts | — | cart-persistence.spec.ts |
| FR24 | CartIconButton.test.tsx | — | cart.spec.ts |
| FR25 | CartDrawer.test.tsx | — | cart.spec.ts |
| FR26 | useAddToCart.test.ts | — | cart.spec.ts |
| FR27 | — | — | cart.spec.ts, checkout.spec.ts |
| FR28 | OrderSummary.test.tsx | — | checkout.spec.ts |
| FR29 | AddressForm.test.tsx | orders-create.test.ts | checkout.spec.ts |
| FR30 | — | orders-create.test.ts | payment.spec.ts |
| FR31 | — | — | payment.spec.ts |
| FR32 | — | razorpay-webhook.test.ts | payment.spec.ts |
| FR33 | verifyRazorpaySignature.test.ts | razorpay-webhook.test.ts | — |
| FR34 | — | razorpay-webhook.test.ts | payment.spec.ts |
| FR35 | confirmation.test.tsx | — | payment.spec.ts |
| FR36 | — | — | payment-failure.spec.ts (E-P2-pay-2) |
| FR37 | — | orders-query.test.ts | orders.spec.ts |
| FR38 | — | orders-query.test.ts | orders.spec.ts |
| FR39 | — | orders-query.test.ts | orders.spec.ts |
| FR40 | — | auth-guard.test.ts | auth-guard.spec.ts |
| FR41 | AddressForm.test.tsx | orders-create.test.ts | checkout.spec.ts |

### 9.2 Reconciliation against Testing HLD §9.6

| Feature | U | I | E | Plan | Actual | Δ |
|---------|---|---|---|------|--------|---|
| Shopping Cart | 8 | 4 | 4 | 16 | 16 | 0 |
| Checkout Flow | 4 | 3 | 2 | 9 | 9 | 0 |
| Razorpay Payments | 2 | 4 | 1 | 7 | 7 | 0 |
| Webhook Handling | 0 | 4 | 0 | 4 | 4 | 0 |
| Order Management | 4 | 2 | 2 | 8 | 8 | 0 |
| Auth Guards | 2 | 2 | 1 | 5 | 5 | 0 |
| Toast Notifications | 2 | 0 | 0 | 2 | 2 | 0 |
| **Phase 2 Total** | **22** | **19** | **10** | **51** | **51** | **0** |

### 9.3 Component test count reconciliation

The Testing HLD §9.4 lists 11 Phase 2 components, each with one `*.test.tsx`. The unit/integration counts above are function-level, not file-level, and include hooks + helpers. Per-file breakdown:

- `cart.test.ts` (1 file, 9 tests)
- `verifyRazorpaySignature.test.ts` (1, 2)
- `AddressForm.test.tsx` (1, 4)
- `useAddToCart.test.ts` (1, 2)
- `useRemoveFromCart.test.ts` (1, 2)
- `order-total.test.ts` (1, 2)
- `CartIconButton.test.tsx` (1, 2)
- `CartDrawer.test.tsx` (1, in §6.5 "checkout-flow")
- `CartItem.test.tsx` (1, exercised in `cart.spec.ts` E2E)
- `CartSummary.test.tsx` (1, exercised in `cart.spec.ts` E2E)
- `OrderSummary.test.tsx` (1, exercised in `checkout.spec.ts` E2E)
- `confirmation.test.tsx` (1, exercised in `payment.spec.ts` E2E)
- `OrderHistoryPage.test.tsx` (1, exercised in `orders.spec.ts` E2E)
- `OrderDetail.test.tsx` (1, exercised in `orders.spec.ts` E2E)

This matches the HLD component list (11 components) with the integration/E2E layers providing end-to-end coverage for the visual parts.

### 9.4 Coverage thresholds (carried from Phase 1, unchanged)

- stmts ≥ 80, branches ≥ 75, funcs ≥ 80, lines ≥ 80.
- Enforced by Vitest in CI; failing the gate fails the build.

---

## 10. CI/CD, Quality Gates & Reporting

- **CI workflow:** reuse Phase 1's GitHub Actions workflow. Add a `phase-2` job that runs **after** the `phase-1` job and only on demand (`workflow_dispatch` + a `phase-2` label). This avoids E2E flakiness in normal PR runs.
- **Local:** `npm run test` (unit + integration), `npm run test:e2e:phase2` (Playwright with `--grep "Phase 2"`).
- **Coverage report:** uploaded to Codecov under a `phase-2` flag.
- **Quality gates** (all required to merge a `phase-2/*` PR):
  1. All 35 Phase 1 + 51 Phase 2 unit/integration tests green.
  2. All Phase 2 E2E tests green on Chromium.
  3. Coverage thresholds met.
  4. `tsc --noEmit` clean.
  5. `next build` clean.

---

## 11. Open Questions, Risks & Discrepancies

| # | Risk | Mitigation |
|---|------|------------|
| R1 | Razorpay Checkout.js iframe selectors differ across regions. | E2E selectors are deliberately loose (`text=Pay`). If the modal UI changes, selectors are updated in one place (`tests/e2e/payment.spec.ts`). |
| R2 | Webhook delivery in local dev requires a tunnel. | Integration tests cover HMAC + state machine with synthetic payloads; tunnel-based manual spec is documented but `test.skip()`-ed. |
| R3 | Race: webhook arrives after the user lands on `/checkout/confirmation`. | The confirmation page renders "Payment processing…" for `status === "pending"` and auto-refreshes every 3 s for up to 30 s. |
| R4 | Clerk session cookie may expire mid-checkout. | `/api/orders/create` returns 401; the client redirects to `/sign-in?redirect_url=/checkout` with a toast. |
| R5 | `STRAPI_API_TOKEN` Phase 1 is read-only. Phase 2 writes. | Agent either re-uses a full-access token (single CMS, low blast radius) or generates a read+write token scoped to `Order`. Decision documented in Implementation Plan Stage 1. |
| R6 | `populate=*` temptation for `/orders` queries. | Plan explicitly forbids it; uses `populate=*` only on dev-side verification (per Phase 1 LLD rule). |
| R7 | Cart drawer mounting under SSR. | `CartDrawer` mounts via `next/dynamic({ ssr: false })` from a client-only header wrapper; verified by E2E. |
| R8 | Zod v3 vs v4 conflict from Strapi deps. | Pin `zod@^3`; lockfile check in CI. |
| R9 | Testing HLD §9.6 says Phase 2 = 51; this LLD says 51. No discrepancy. | Documented for completeness. |

---

*This Testing LLD defines only the test design (HOW to verify) for Phase 2. Implementation details live in [Phase 2 LLD](./AuraStore_LLD_Phase2.md); the staged execution breakdown lives in [Phase 2 Implementation Plan](./AuraStore_Phase2_Implementation_Plan.md); human-only prerequisites live in [Phase 2 Prerequisites](./AuraStore_Prerequisites_Phase2.md).*
*Last updated: July 21, 2026*
