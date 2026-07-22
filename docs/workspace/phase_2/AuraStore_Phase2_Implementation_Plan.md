# AuraStore — Phase 2 Implementation Plan (Staged Delivery)

> **Project:** AuraStore: The Modern Consumer App
> **Version:** 1.0
> **Date:** July 21, 2026
> **Document Type:** Implementation Plan (staged, execution-ready) — **AGENT execution plan**
> **Parent Documents:** [Phase 2 LLD](./AuraStore_LLD_Phase2.md) · [Phase 2 Testing LLD](./AuraStore_Testing_LLD_Phase2.md) · [Testing HLD](../AuraStore_Testing_HLD.md) · [Prerequisites](./AuraStore_Prerequisites_Phase2.md) · [HLD](../AuraStore_HLD.md) · [Phase 1 Implementation Plan](./AuraStore_Phase1_Implementation_Plan.md)
> **Phase:** Phase 2 — Mandatory (Shopping cart, Razorpay checkout, order management)
> **Audience:** Implementing developer / agent

> **Role legend:** Each stage tags its **Entry Gate** as the **HUMAN handoff** (from Prerequisites) and its **Code/Implementation** as **AGENT** work. The Prerequisites doc holds the full HUMAN/EXTERNAL-tagged reference (Razorpay account/keys/webhook; tunnel; secrets).

---

## 1. Purpose & How To Use This Plan

This plan turns the Phase 2 LLD + Testing LLD into a **staged, execution-ready sequence**. Phase 2 is delivered in **7 stages**. Each stage follows a fixed shape so any executor (human or agent) knows exactly what to do and when it is "done":

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

**Repository layout:** the Next.js frontend is at the **repo root**; the Strapi backend lives in a sibling **`backend/`** directory (carried over from Phase 1).

**Reference docs:** Razorpay + human checklist → `./AuraStore_Prerequisites_Phase2.md`. Full design → `./AuraStore_LLD_Phase2.md`. Full test design → `./AuraStore_Testing_LLD_Phase2.md`.

**Principles applied:**
- **Phased delivery** — each stage delivers one coherent, testable slice; later stages depend only on completed earlier stages.
- **Shift-left QA** — test infrastructure for Phase 2 (Sonner stub, MSW order handlers, Razorpay stub, Playwright phase-2 project) is built in Stage 1.
- **Verify-before-proceed** — every stage opens with an *Entry Gate* that re-runs the full green bar of prior stages (Phase 1's 35 + Phase 2's running total); a red gate blocks the next stage.
- **Full test pyramid** — all **51** locked Phase 2 tests are placed across stages (22 unit / 19 integration / 10 e2e), matched against [Testing LLD Phase 2 §9.2](./AuraStore_Testing_LLD_Phase2.md).
- **Backend is in-scope** — the Strapi `Order` content type, token scope decision, and seed are built in Stage 1, not treated as a black box.

---

## 2. Locked Constraints (do not deviate)

| Constraint | Value | Source |
|------------|-------|--------|
| Test pyramid | **22 unit / 19 integration / 10 e2e = 51** | Testing LLD §9.2 |
| Node.js | v22.x | LLD §1.3 |
| Next.js | 16.2+ (App Router, `cacheComponents: true`, `proxy.ts` not `middleware.ts`) | LLD §1.3, §3.2 |
| Tailwind | v4.x (CSS-first, no `tailwind.config.js`) | LLD §1.3, §3.2 |
| Clerk | v7.x (`clerkMiddleware`, async `auth()`, `auth.protect()`) | LLD §1.3 |
| Strapi | v5.x (flattened response, explicit `populate`, **no `populate=*` in app code**, Draft & Publish) | LLD §1.3, §3.2; Phase 1 Setup Guide |
| Vitest | v4.x stable | Testing LLD §1.3 |
| Coverage thresholds | stmts ≥ 80, branches ≥ 75, funcs ≥ 80, lines ≥ 80 | Testing LLD §3.2 |
| MSW | v2.x (node) + `@msw/playwright` v0.6.7 (e2e, client-only) | Testing LLD §1.3 |
| Razorpay | Test Mode (`rzp_test_` prefix); Node SDK + Checkout.js | LLD §1.3, Prereq §2 |
| Sonner | v1.x, one `<Toaster />` in `RootLayout` | LLD §1.3 |
| E2E external deps | **Real seeded Strapi** (with `Order` seeded) + **real Clerk test user** (`+clerk_test`) + **real Razorpay Test Mode** | Testing LLD §3.1 |
| Secrets | `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `STRAPI_API_TOKEN` (read on Product/Category), `STRAPI_API_TOKEN_WRITE` (read+write+update on Order — **NEW Phase 2**), `CLERK_SECRET_KEY`, E2E creds — **server-only** | LLD §4.2.13, §6; Prereq §5 |
| Out of scope (Phase 2) | No animations, no dark mode, no search/sort, no wishlist, no SEO, no WCAG hardening, no rate limiting, no security headers | LLD §2.2 |
| Strapi `Order` | PRIVATE content type; `draftAndPublish: false`; `items`+`address` are JSON (no relations); dual-token model — see LLD §4.2.13 | LLD §4.2.13 |
| Amount trust | Server recomputes total from Strapi `price`; client's `amount` is **never** trusted | LLD §6 |
| Webhook auth | HMAC-SHA256 over **raw** body; constant-time compare; 400 on mismatch | LLD §4.4, §6 |

> **`populate=*` note:** Forbidden in app code (carry-over from Phase 1). Permitted **only** for ad-hoc human verification.

---

## 3. Stage Map (at a glance)

| # | Stage | Primary Deliverable | New Tests | Depends On |
|---|-------|---------------------|-----------|------------|
| 1 | **Backend (Strapi `Order`) + Test Infra + Cart Store** | Strapi `Order` schema + seed + read+write token decision; Sonner + Razorpay stub + MSW order handlers; `lib/cart.ts` external store | **10 (8U + 2U helpers)** | Phase 1 green, Prereqs |
| 2 | **Server Foundations (Razorpay + Orders lib + API routes)** | `lib/razorpay.ts`, `lib/orders.ts`, `lib/razorpay-webhook.ts`, `POST /api/orders/create`, `POST /api/webhooks/razorpay` | **12 (6I create + 6I webhook)** | Stage 1 |
| 3 | **Cart UI (Drawer + IconButton + Item + Summary + Hooks)** | `CartDrawer` + `CartItem` + `CartSummary` + `CartIconButton` + `QuantitySelector` + `useAddToCart` + `useRemoveFromCart` + header wiring + `<Toaster />` | **8 (4U form/badge + 2U hook + 2I order-query)** | Stage 1, 2 |
| 4 | **Checkout + Razorpay Modal** | `/checkout` page, `CheckoutClient`, `AddressForm`, `OrderSummary`, `RazorpayCheckout`, `proxy.ts` matcher extension, `auth.protect()` defense-in-depth | **5 (4U form already in S3 + 1I guard)** | Stage 3 |
| 5 | **Orders History + Detail + Confirmation** | `/orders`, `/orders/[documentId]`, `/checkout/confirmation`, `OrderHistoryPage`, `OrderDetail`, `OrderConfirmation` | **6 (2I orders-query already in S3 + 2U confirmation + 2I guard)** | Stage 2–4 |
| 6 | **End-to-End & Test Pyramid Orchestration** | All 10 Playwright Phase 2 specs, full green bar (Phase 1 35 + Phase 2 51 = 86) | **10 E2E** | Stage 1–5 |
| 7 | **CI/CD, Quality Gates & Reporting** | GitHub Actions phase-2 job, Codecov `phase-2` flag, coverage thresholds enforced | 0 (runs all 86) | Stage 1–6 |

**Cumulative tests:** Stage 1 = 10, Stage 2 = 22, Stage 3 = 32, Stage 4 = 37, Stage 5 = 43, Stage 6 = 53. **Final = 22 + 19 + 10 = 51 (full Phase 2 pyramid complete at Stage 6; Stage 7 proves it in CI).**

> **Strapi `Order` is part of Phase 2 implementation, not just an external dependency.** Stage 1 builds the backend; Stages 4–6 E2E depends on Stage 1's running, seeded Strapi instance.

---

## 4. Stage 1 — Backend (Strapi `Order`) + Test Infra + Cart Store

### Entry Gate (HUMAN — verify from [Prerequisites](./AuraStore_Prerequisites_Phase2.md))

- [ ] **Phase 1 readiness** green: Next 16 dev server starts on `:3000`; Strapi on `:1337` returns `200` on `/api/products?populate=category`; all 35 Phase 1 tests pass locally.
- [ ] Razorpay **Test Mode** account exists; `NEXT_PUBLIC_RAZORPAY_KEY_ID` (`rzp_test_…`) and `RAZORPAY_KEY_SECRET` are in `.env.local`.
- [ ] Webhook created with URL `<tunnel>/api/webhooks/razorpay`; `RAZORPAY_WEBHOOK_SECRET` in `.env.local`.
- [ ] (Optional for now, required for Stage 6 manual webhook) ngrok/cloudflared reachable.
- [ ] Test card `4111 1111 1111 1111` and failure card `4000 0000 0000 0002` noted.

If any item fails, **stop** and complete [Prerequisites](./AuraStore_Prerequisites_Phase2.md) first.

### Setup (AGENT)

- [ ] **Step 1.1: Install Phase 2 npm deps** (root + dev, single command):
  ```bash
  npm i sonner@^1 react-hook-form@^7 @hookform/resolvers@^3 zod@^3 razorpay
  ```
  Verify `package.json`:
  ```json
  {
    "dependencies": { "sonner": "^1...", "react-hook-form": "^7...", "@hookform/resolvers": "^3...", "zod": "^3...", "razorpay": "latest" }
  }
  ```

- [ ] **Step 1.2: Strapi — create `Order` content type** (in `backend/`):
  - **1.2a.** Create the four boilerplate files (matches the existing `product` content type pattern in `backend/src/api/product/`):
    - `backend/src/api/order/content-types/order/schema.json` — copy the exact JSON from [LLD §4.2.13](./AuraStore_LLD_Phase2.md#422-13-strapi-order-content-type). **Verify:** `options.draftAndPublish` is `false`, the `status` field is `{ "type": "enumeration", "enum": [...], "default": "pending", ... }` (Strapi v5 strict format), `items` and `address` are `json`, and `razorpayOrderId` is `unique: true`.
    - `backend/src/api/order/controllers/order.ts` → `export default factories.createCoreController('api::order.order');`
    - `backend/src/api/order/routes/order.ts` → `export default factories.createCoreRouter('api::order.order');`
    - `backend/src/api/order/services/order.ts` → `export default factories.createCoreService('api::order.order');`
    - Re-run `npm run build` in `backend/` so TypeScript picks the new content type into the generated content-types registry.
  - **1.2b. Disable Public + Authenticated role permissions on `Order`:**
    - Settings → Roles → Public → Order → uncheck all 6 actions (`find`, `findOne`, `create`, `update`, `delete`, `publish`).
    - Settings → Roles → Authenticated → Order → uncheck all 6 actions.
    - **Why both:** Clerk users do **not** authenticate to Strapi. Strapi's REST API treats no-auth requests as Public and JWT-authenticated requests as Authenticated. Leave both unchecked so neither path returns orders.
  - **1.2c. Issue a second API token (`STRAPI_API_TOKEN_WRITE`).** Strapi v5 cannot mutate existing tokens; you must create a new one.
    - Settings → API Tokens → **Create new API Token**.
    - **Name:** `Order writer`. **Type:** `Custom`. **Description:** `Phase 2: order create/update from Next.js server.`.
    - **Duration:** `Unlimited` (Phase 2 dev/local only; rotate for prod).
    - **Section: `Order`** → check **`Read`**, **`Write`**, **`Update`**. Leave `Delete` and `Publish` unchecked. (Order is `draftAndPublish: false`, so `Publish` is moot; leaving unchecked is correct.)
    - **Sections `Product` and `Category`** → all unchecked (this token must not touch catalog data).
    - Save → copy the token immediately (shown once) → `STRAPI_API_TOKEN_WRITE` in `.env.local`.
    - **Verify:** `curl -H "Authorization: Bearer $STRAPI_API_TOKEN_WRITE" "http://localhost:1337/api/orders"` → `{"data":[],"meta":{"pagination":{"total":0}}}`. `curl -H "Authorization: Bearer $STRAPI_API_TOKEN_WRITE" "http://localhost:1337/api/products"` → **`403 Forbidden`** (intentional — token has no scope on `Product`).
- [ ] **Step 1.3: Strapi seed for `Order` orders** — create `backend/scripts/seed-orders.ts` (per [Testing LLD §8.1](./AuraStore_Testing_LLD_Phase2.md)):
  - **Pattern: same as the existing `seed.ts`** — use the in-process Strapi Document Service API (`createStrapi().load()` + `documents('api::order.order').create({ data, status: 'published' })`). Do NOT use the REST API for seeding — the REST API needs an admin JWT, not the API token.
  - **Idempotency:** on startup, find existing orders with `clerkUserId === "user_test_123"` and delete them (or skip insert). The script may be re-run safely.
  - Inserts two orders: **`ord_paid_1`** (`status: "paid"`, `paymentId: "pay_test_seed_1"`, `razorpayOrderId: "order_test_seed_1"`, `total: 499800`, two Wireless Headphones) and **`ord_pending_1`** (`status: "pending"`, no payment id, `razorpayOrderId: "order_test_seed_pending_1"`, `total: 99900`, one Water Bottle). Item shapes match `Order.items` JSON: `[{ productId: "<product-documentId>", name, price, qty, image }]` — use real `documentId`s from the Phase 1 seed by looking them up at seed-time via `documents('api::product.product').findFirst({ filters: { slug: 'wireless-headphones' } })`.
  - Add npm script in `backend/package.json` (different name from Phase 1's `"seed"` to avoid collision):
    ```json
    "scripts": {
      "seed":          "tsx scripts/seed.ts",
      "seed:orders":   "tsx scripts/seed-orders.ts"
    }
    ```
  - Run both, in order: `cd backend && npm run seed && npm run seed:orders`.
  - **Verify:** `curl -H "Authorization: Bearer $STRAPI_API_TOKEN_WRITE" "http://localhost:1337/api/orders?filters[clerkUserId][\$eq]=user_test_123"` → response includes `meta.pagination.total` of `2`, both `publishedAt` (or its absence — D&P is off, so these are normal) and `status` match seed fixtures.

- [ ] **Step 1.4: Add Phase 2 Vitest setup files**:
  - `tests/setup/sonner.ts` (spy on `toast.success/error/info`).
  - `tests/setup/next-headers.ts` (default Clerk `auth()` stub).
  - `tests/setup/razorpay-checkout.ts` (stub `window.Razorpay`).
  - Update `vitest.config.ts` `setupFiles` array (per [Testing LLD §4.1](./AuraStore_Testing_LLD_Phase2.md)).

- [ ] **Step 1.5: Add Phase 2 MSW handlers**:
  - `tests/msw/handlers/orders.ts` (Strapi `GET/POST/PUT /api/orders` + the two Next.js API routes with default 500).
  - `tests/msw/factories/order.ts` (OrderModel + `orderPaidFixture` + `orderPendingFixture`).
  - Wire into `tests/msw/handlers/index.ts` so the server picks them up.

- [ ] **Step 1.6: Mount `<Toaster />` in `RootLayout`** (single mount for the whole app):
  ```tsx
  // src/app/layout.tsx — add inside <body> after children
  import { Toaster } from "sonner";
  // ...
  <Toaster richColors position="top-right" />
  ```

- [ ] **Step 1.7: Create `src/lib/cart.ts`** — cart external store per [LLD §4.2.1](./AuraStore_LLD_Phase2.md#4221-cart-external-store--srclibcartts):
  - `CartItem`, `CartState` types.
  - `CART_STORAGE_KEY = "aurastore:cart:v1"`.
  - `cartStore.getSnapshot / subscribe / add / setQuantity / remove / clear / totalQuantity / subtotal`.
  - `useCart()` hook wrapping `useSyncExternalStore`.
  - **SSR-safe**: `getSnapshot()` returns stable `{ items: [], updatedAt: 0 }` when `typeof window === "undefined"`.
  - **Cross-tab sync**: `subscribe()` listens to the `window.storage` event.

- [ ] **Step 1.8: Create `src/lib/cart-ui.ts`** — tiny store for drawer open/close (no persistence):
  ```ts
  "use client";
  import { useSyncExternalStore } from "react";
  let isOpen = false;
  const listeners = new Set<() => void>();
  export const cartUI = {
    open: () => { isOpen = true; listeners.forEach(l => l()); },
    close: () => { isOpen = false; listeners.forEach(l => l()); },
    toggle: () => { isOpen = !isOpen; listeners.forEach(l => l()); },
    subscribe: (l: () => void) => { listeners.add(l); return () => listeners.delete(l); },
    getSnapshot: () => isOpen,
  };
  export function useCartUI<T>(sel: (s: { open: () => void; close: () => void; toggle: () => void; isOpen: boolean }) => T): T {
    return useSyncExternalStore(cartUI.subscribe, cartUI.getSnapshot, () => false);
  }
  ```

### Test Cases (AGENT — RED first, then GREEN)

- [ ] **Step 1.9: Write `tests/unit/cart.test.ts`** (8 tests per [Testing LLD §5.1](./AuraStore_Testing_LLD_Phase2.md)):
  - Empty, add-new, add-increment, set0-removes, setN-updates, remove, totalQuantity, subtotal.
  - Run: `npx vitest run tests/unit/cart.test.ts` → all 8 PASS.

- [ ] **Step 1.10: Write `tests/unit/CartIconButton.test.tsx`** (2 tests per [Testing LLD §5.6](./AuraStore_Testing_LLD_Phase2.md)):
  - Empty: no badge; non-empty: shows total.
  - Run: `npx vitest run tests/unit/CartIconButton.test.tsx` → PASS.

- [ ] **Step 1.11: Write `tests/unit/useAddToCart.test.ts`** (2 tests per [Testing LLD §5.4](./AuraStore_Testing_LLD_Phase2.md)):
  - Success path: toast + cart; qty 0: no-op.
  - Run: `npx vitest run tests/unit/useAddToCart.test.ts` → PASS.

### Verification (exit criteria)

- [ ] `cd backend && npm run seed && npm run seed:orders` both return 0; the orders `curl` returns `{"data":[{...,"documentId":"ord_paid_1",...},{...,"documentId":"ord_pending_1",...}],"meta":{"pagination":{"total":2}}}`.
- [ ] `curl -H "Authorization: Bearer $STRAPI_API_TOKEN" "http://localhost:1337/api/orders"` → **`403 Forbidden`** (the Phase 1 read-only token must NOT see orders — proves least-privilege token separation works).
- [ ] `npx tsc --noEmit` clean.
- [ ] `npx vitest run tests/unit/cart.test.ts tests/unit/CartIconButton.test.tsx tests/unit/useAddToCart.test.ts` → all PASS (10 new tests).
- [ ] Full Phase 1 green bar still PASSES (re-run `npm run test`).

### Commit

- [ ] **Step 1.12: Commit**
  ```bash
  git add backend/src/api/order backend/scripts/seed-orders.ts package.json package-lock.json \
          src/app/layout.tsx src/lib/cart.ts src/lib/cart-ui.ts \
          tests/setup/sonner.ts tests/setup/next-headers.ts tests/setup/razorpay-checkout.ts \
          tests/msw/handlers/orders.ts tests/msw/factories/order.ts \
          tests/msw/handlers/index.ts vitest.config.ts \
          tests/unit/cart.test.ts tests/unit/CartIconButton.test.tsx tests/unit/useAddToCart.test.ts
  git commit -m "feat(phase-2/stage-1): strapi Order content type + seed + cart store + test infra"
  ```

---

## 5. Stage 2 — Server Foundations (Razorpay + Orders lib + API Routes)

### Entry Gate

- [ ] Stage 1 green: all 10 new tests PASS; Strapi returns 2 seeded orders.

### Setup

- [ ] **Step 2.1: Create `src/lib/razorpay.ts`** per [LLD §4.2.2](./AuraStore_LLD_Phase2.md#4222-razorpay-server-sdk-wrapper--srclibrazorpayts):
  - `getRazorpay()` lazy-singleton (reuses the same instance across calls in the same Node process).
  - `createRazorpayOrder({ amount, currency, receipt })` calls `rzp.orders.create(...)`.

- [ ] **Step 2.2: Create `src/lib/order-total.ts`** (pure helper, used by both server and tests):
  ```ts
  export function computeOrderTotal(items: Array<{ price: number; quantity: number }>): number {
    return items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  }
  ```

- [ ] **Step 2.3: Create `src/lib/razorpay-webhook.ts`** (pure helper for HMAC verification):
  ```ts
  import crypto from "node:crypto";
  export function verifyRazorpaySignature(rawBody: string, headerSig: string, secret: string): boolean {
    const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    // constant-time compare
    return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(headerSig, "hex"));
  }
  ```
  > **Length mismatch safety:** wrap the `timingSafeEqual` call in a length check first; otherwise an attacker can throw. Full pattern:
  > ```ts
  > if (headerSig.length !== expected.length) return false;
  > return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(headerSig, "hex"));
  > ```

- [ ] **Step 2.4: Create `src/lib/orders.ts`** per [LLD §4.2.3](./AuraStore_LLD_Phase2.md#4223-server-side-order-helpers--srclibordersts):
  - Zod schemas for `CheckoutInput`.
  - `createOrderForCheckout(clerkUserId, input)`:
    1. Zod parse (re-validate even though the API route did).
    2. For each `productId`: `GET /api/products/:documentId?fields[0]=price&fields[1]=name&populate[images]=*` from Strapi. If any 404 → `{ ok: false, error: "Unknown product: <id>" }`.
    3. Compute `amount = Σ(price × quantity)`.
    4. `POST /api/orders` to Strapi with `status: "pending"`, `items` JSON, `address` JSON, `total`, `email`, `clerkUserId`.
    5. `createRazorpayOrder({ amount, currency: "INR", receipt: orderDocumentId })`.
    6. `PUT /api/orders/:documentId` with `{ razorpayOrderId }`.
    7. Return `{ ok: true, razorpayOrderId, amount, currency, orderDocumentId }`.
  - `getOrdersForUser(clerkUserId)` — `GET /api/orders?filters[clerkUserId][$eq]=<id>&sort[0]=createdAt:desc&populate=*` (use `populate=*` only on the dev-verification path; in app code, use `populate` of just `items` and `address` which are JSON fields requiring no populate). **Implementation note:** `items` and `address` are JSON fields on the Order schema (not relations), so no `populate` is needed. The query is just `?filters[clerkUserId][$eq]=…&sort[0]=createdAt:desc`.
  - `getOrderByDocumentId(clerkUserId, documentId)` — same query but with `filters[documentId][$eq]=<id>`; return `null` if `order.clerkUserId !== clerkUserId`.
  - `markOrderPaid(razorpayOrderId, paymentId)` — `PUT /api/orders?filters[razorpayOrderId][$eq]=<id>` with `{ status: "paid", paymentId }`. **Idempotency:** if the order is already `paid`, no-op (return without throwing).
  - `markOrderFailed(razorpayOrderId, reason)` — same, status `failed`, error in `paymentId` field or a new `failureReason` field if desired (out of MVP — log only).

- [ ] **Step 2.5: Create `src/app/api/orders/create/route.ts`** per [LLD §4.2.12](./AuraStore_LLD_Phase2.md#42212-api-routes):
  ```ts
  import { NextResponse } from "next/server";
  import { auth } from "@clerk/nextjs/server";
  import { z } from "zod";
  import { createOrderForCheckout } from "@/lib/orders";

  const bodySchema = z.object({
    items: z.array(z.object({ productId: z.string().min(1), quantity: z.number().int().min(1) })).min(1),
    address: z.object({
      fullName: z.string().min(2).max(120),
      street: z.string().min(3),
      city: z.string().min(2),
      state: z.string().min(2),
      zipCode: z.string().regex(/^\d{6}$/),
      country: z.string().min(2),
    }),
    email: z.string().email(),
  });

  export async function POST(req: Request) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let json: unknown;
    try { json = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input", details: parsed.error.format() }, { status: 400 });

    try {
      const result = await createOrderForCheckout(userId, parsed.data);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
      return NextResponse.json({ order_id: result.razorpayOrderId, amount: result.amount, currency: result.currency, orderDocumentId: result.orderDocumentId });
    } catch (err) {
      console.error("[orders/create] failed", { userId, err });
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }
  }
  ```

- [ ] **Step 2.6: Create `src/app/api/webhooks/razorpay/route.ts`** per [LLD §4.2.12](./AuraStore_LLD_Phase2.md#42212-api-routes):
  ```ts
  import { NextResponse } from "next/server";
  import { verifyRazorpaySignature } from "@/lib/razorpay-webhook";
  import { markOrderPaid, markOrderFailed } from "@/lib/orders";

  export async function POST(req: Request) {
    const rawBody = await req.text();
    const sig = req.headers.get("x-razorpay-signature") ?? "";
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET!;

    if (!verifyRazorpaySignature(rawBody, sig, secret)) {
      console.warn("[webhook] invalid signature");
      return new NextResponse("invalid signature", { status: 400 });
    }

    let payload: any;
    try { payload = JSON.parse(rawBody); } catch { return new NextResponse("bad json", { status: 400 }); }

    try {
      if (payload?.event === "payment.captured") {
        const ent = payload.payload?.payment?.entity;
        if (!ent?.order_id || !ent?.id) return new NextResponse("ok", { status: 200 });
        await markOrderPaid(ent.order_id, ent.id);
      } else if (payload?.event === "payment.failed") {
        const ent = payload.payload?.payment?.entity;
        if (!ent?.order_id) return new NextResponse("ok", { status: 200 });
        await markOrderFailed(ent.order_id, ent.error_description ?? "unknown");
      }
      return new NextResponse("ok", { status: 200 });
    } catch (err) {
      console.error("[webhook] persistence failed", { err, event: payload?.event });
      return new NextResponse("retry", { status: 500 });
    }
  }
  ```

### Test Cases (AGENT)

- [ ] **Step 2.7: Write `tests/unit/verifyRazorpaySignature.test.ts`** (2 tests per [Testing LLD §5.2](./AuraStore_Testing_LLD_Phase2.md)):
  - Valid sig → true; tampered sig → false.
  - Run: `npx vitest run tests/unit/verifyRazorpaySignature.test.ts` → PASS.

- [ ] **Step 2.8: Write `tests/unit/order-total.test.ts`** (2 tests per [Testing LLD §5.5](./AuraStore_Testing_LLD_Phase2.md)):
  - Run: `npx vitest run tests/unit/order-total.test.ts` → PASS.

- [ ] **Step 2.9: Write `tests/integration/orders-create.test.ts`** (6 tests per [Testing LLD §6.1](./AuraStore_Testing_LLD_Phase2.md)):
  - Use `vi.mock("razorpay")` for the SDK; mock `@clerk/nextjs/server` per test.
  - Run: `npx vitest run tests/integration/orders-create.test.ts` → all PASS.

- [ ] **Step 2.10: Write `tests/integration/razorpay-webhook.test.ts`** (6 tests per [Testing LLD §6.2](./AuraStore_Testing_LLD_Phase2.md)):
  - Hand-craft raw payloads; sign with `crypto.createHmac` using `process.env.RAZORPAY_WEBHOOK_SECRET`.
  - Set `process.env.RAZORPAY_WEBHOOK_SECRET = "whsec_test"` in the test setup.
  - Run: `npx vitest run tests/integration/razorpay-webhook.test.ts` → all PASS.

### Verification

- [ ] `npx tsc --noEmit` clean.
- [ ] All 12 new tests (2 unit + 6 + 6 integration) PASS.
- [ ] Phase 1 green bar still PASSES.

### Commit

- [ ] **Step 2.11: Commit**
  ```bash
  git add src/lib/razorpay.ts src/lib/orders.ts src/lib/order-total.ts src/lib/razorpay-webhook.ts \
          src/app/api/orders/create/route.ts src/app/api/webhooks/razorpay/route.ts \
          tests/unit/verifyRazorpaySignature.test.ts tests/unit/order-total.test.ts \
          tests/integration/orders-create.test.ts tests/integration/razorpay-webhook.test.ts
  git commit -m "feat(phase-2/stage-2): Razorpay SDK + orders lib + /api/orders/create + /api/webhooks/razorpay"
  ```

---

## 6. Stage 3 — Cart UI (Drawer + IconButton + Item + Summary + Hooks)

### Entry Gate

- [ ] Stage 2 green: 22 new tests PASS (10 from Stage 1 + 12 from Stage 2).

### Setup

- [ ] **Step 3.1: shadcn add (Sheet + Separator + Input + Label + RadioGroup)**:
  ```bash
  npx shadcn@latest add sheet separator input label radio-group
  ```
  Verify the components land in `src/components/ui/`.

- [ ] **Step 3.2: Create `src/hooks/useAddToCart.ts`** per [LLD §4.2.4](./AuraStore_LLD_Phase2.md#4224-client-hooks):
  ```ts
  "use client";
  import { useCallback } from "react";
  import { toast } from "sonner";
  import { cartStore } from "@/lib/cart";

  export function useAddToCart() {
    return useCallback((item: Parameters<typeof cartStore.add>[0], qty = 1) => {
      if (qty <= 0) { toast.error("Invalid quantity"); return; }
      cartStore.add(item, qty);
      toast.success(`Added "${item.name}" to cart`);
    }, []);
  }
  ```

- [ ] **Step 3.3: Create `src/hooks/useRemoveFromCart.ts`** + `useUpdateQuantity.ts` (mirror pattern, toasts on success/error).

- [ ] **Step 3.4: Create `src/components/cart/CartIconButton.tsx`** per [LLD §4.2.7](./AuraStore_LLD_Phase2.md):
  ```tsx
  "use client";
  import { ShoppingCart } from "lucide-react";
  import { Button } from "@/components/ui/button";
  import { Badge } from "@/components/ui/badge";
  import { useCart } from "@/lib/cart";
  import { useCartUI } from "@/lib/cart-ui";

  export function CartIconButton() {
    const { totalQuantity } = useCart();
    const open = useCartUI(s => s.open);
    return (
      <Button variant="ghost" size="icon" aria-label={`Cart, ${totalQuantity} items`} onClick={open}>
        <ShoppingCart className="h-5 w-5" />
        {totalQuantity > 0 && (
          <Badge className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs">{totalQuantity}</Badge>
        )}
      </Button>
    );
  }
  ```
  > Phase 1 `Header.tsx` import + render `<CartIconButton />` between `<Nav />` and `<AuthSection />`.

- [ ] **Step 3.5: Create `src/components/cart/QuantitySelector.tsx`** — `+` / number / `−` group with `aria-label`s; emits `onChange(newQty)`.

- [ ] **Step 3.6: Create `src/components/cart/CartItem.tsx`** per [LLD §4.2.6](./AuraStore_LLD_Phase2.md):
  - Renders thumbnail (Next `<Image>`), name (link to `/products/[slug]`), price, `<QuantitySelector />`, remove button.
  - Wires `useUpdateQuantity` and `useRemoveFromCart`.

- [ ] **Step 3.7: Create `src/components/cart/CartSummary.tsx`** — subtotal line + "Checkout" CTA (`router.push("/checkout")`).

- [ ] **Step 3.8: Create `src/components/cart/CartDrawer.tsx`** per [LLD §4.2.5](./AuraStore_LLD_Phase2.md):
  - Built on shadcn `Sheet` (right side, `size="lg"`).
  - Renders `<EmptyCartView />` (FR25) when cart is empty.
  - Otherwise renders `<CartItemList />` + sticky `<CartSummary />`.
  - **Closed by default**; opened/closed via `useCartUI()`.

- [ ] **Step 3.9: Mount `<CartDrawer />`** in `src/app/layout.tsx` (once, next to `<Toaster />`):
  ```tsx
  import { CartDrawer } from "@/components/cart/CartDrawer";
  // ... inside <body>
  <CartDrawer />
  ```

- [ ] **Step 3.10: Add `CartSlot` (Phase 1 placeholder) → `CartIconButton` swap**:
  - In Phase 1's `Header.tsx`, replace `<CartSlot />` with `<CartIconButton />`.
  - Remove the Phase 1 placeholder file if present.

- [ ] **Step 3.11: Add "Add to cart" button to `ProductCard`** (Phase 1 component, extend):
  - After the existing price/badge block, render `<Button onClick={() => useAddToCart()(product)}>Add to cart</Button>`.
  - **Important:** `ProductCard` becomes a Client Component. Co-locate the price/CTA in a new `<ProductCardClient />` (or convert the whole component — both are acceptable; pick the smaller diff).

### Test Cases (AGENT)

- [ ] **Step 3.12: Write `tests/integration/orders-query.test.ts`** (3 tests per [Testing LLD §6.3](./AuraStore_Testing_LLD_Phase2.md)):
  - `getOrdersForUser`, `getOrderByDocumentId` (owner check + null for other user).
  - Run: `npx vitest run tests/integration/orders-query.test.ts` → PASS.

- [ ] **Step 3.13: Write `tests/unit/useRemoveFromCart.test.ts`** (2 tests per [Testing LLD §5.7](./AuraStore_Testing_LLD_Phase2.md)):
  - Run: `npx vitest run tests/unit/useRemoveFromCart.test.ts` → PASS.

- [ ] **Step 3.14: Write `tests/unit/CartDrawer.test.tsx`** (component test — uses stubbed cartUI + sonner spy):
  - Empty state shows "Your cart is empty" + CTA.
  - Non-empty shows items + subtotal.
  - Run: `npx vitest run tests/unit/CartDrawer.test.tsx` → PASS.

### Verification

- [ ] `npx tsc --noEmit` clean.
- [ ] `npx vitest run` → all Phase 1 + Phase 2 tests so far PASS (10 + 12 + 5 = 27 from Stages 1–3 = 27; the unit subtotal so far is 16, integration is 8 → 24 with one overlap accounted for; see §9 reconciliation).
- [ ] Manual smoke: `npm run dev` → click cart icon on `/products` → drawer opens; add product → badge increments.

### Commit

- [ ] **Step 3.15: Commit**
  ```bash
  git add src/components/ui src/components/cart \
          src/hooks/useAddToCart.ts src/hooks/useRemoveFromCart.ts src/hooks/useUpdateQuantity.ts \
          src/app/layout.tsx src/components/layout/Header.tsx src/components/products/ProductCard.tsx \
          tests/integration/orders-query.test.ts \
          tests/unit/useRemoveFromCart.test.ts tests/unit/CartDrawer.test.tsx
  git commit -m "feat(phase-2/stage-3): cart UI — drawer, icon button, item, summary, hooks"
  ```

---

## 7. Stage 4 — Checkout + Razorpay Modal

### Entry Gate

- [ ] Stage 3 green: cumulative tests PASS.

### Setup

- [ ] **Step 4.1: Create `src/lib/checkout-schema.ts`** (shared Zod schema — used by both `AddressForm` and `/api/orders/create`):
  ```ts
  import { z } from "zod";
  export const addressSchema = z.object({
    fullName: z.string().min(2, "Required").max(120),
    email: z.string().email("Invalid email"),
    street: z.string().min(3, "Required"),
    city: z.string().min(2, "Required"),
    state: z.string().min(2, "Required"),
    zipCode: z.string().regex(/^\d{6}$/, "6-digit PIN required"),
    country: z.string().min(2, "Required").default("India"),
  });
  export type AddressInput = z.infer<typeof addressSchema>;
  ```

- [ ] **Step 4.2: Create `src/components/checkout/AddressForm.tsx`** per [LLD §4.2.9](./AuraStore_LLD_Phase2.md):
  - `react-hook-form` + `zodResolver(addressSchema)`.
  - Inline error messages per field.
  - Submit button: "Continue to payment" (disabled while `isSubmitting` or cart empty).

- [ ] **Step 4.3: Create `src/components/checkout/OrderSummary.tsx`**:
  - Renders cart items (read-only), subtotal, "Total" line.
  - Sticky on `lg+` breakpoints.

- [ ] **Step 4.4: Create `src/components/checkout/RazorpayCheckout.tsx`** (Client Component):
  ```tsx
  "use client";
  import Script from "next/script";
  import { useEffect, useRef } from "react";

  type Props = { orderId: string; amount: number; orderDocumentId: string; email: string };
  export function RazorpayCheckout({ orderId, amount, orderDocumentId, email }: Props) {
    const openedRef = useRef(false);
    useEffect(() => {
      if (typeof window === "undefined") return;
      if (!(window as any).Razorpay) return;
      if (openedRef.current) return;
      openedRef.current = true;
      const rzp = new (window as any).Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        order_id: orderId,
        amount,
        currency: "INR",
        name: "AuraStore",
        description: `Order ${orderDocumentId}`,
        handler: (resp: any) => {
          window.location.href = `/checkout/confirmation?order_id=${orderDocumentId}&cleared=1`;
        },
        modal: {
          ondismiss: () => { /* Sonner toast — handled by parent */ },
        },
        prefill: { email },
      });
      rzp.on("payment.failed", (resp: any) => { /* toast — handled by parent */ });
      rzp.open();
    }, [orderId, amount, orderDocumentId, email]);
    return <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />;
  }
  ```

- [ ] **Step 4.5: Create `src/app/checkout/CheckoutClient.tsx`** (Client Component, used by the Server page):
  - Reads cart via `useCart()`.
  - On mount: clears any pre-existing Razorpay script (idempotent re-mounts).
  - Two-column layout: `<OrderSummary />` (left, sticky) + `<AddressForm onSubmit={...} />` (right).
  - On valid submit: `fetch("/api/orders/create", ...)`; on 200 → render `<RazorpayCheckout ... />`; on error → Sonner toast.

- [ ] **Step 4.6: Create `src/app/checkout/page.tsx`** (Server Component, **auth-protected**) per [LLD §4.2.8](./AuraStore_LLD_Phase2.md):
  ```tsx
  import { auth } from "@clerk/nextjs/server";
  import { redirect } from "next/navigation";
  import { CheckoutClient } from "./CheckoutClient";

  export default async function CheckoutPage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in?redirect_url=/checkout");
    return <CheckoutClient userId={userId} />;
  }
  ```

- [ ] **Step 4.7: Extend `proxy.ts` matcher** (add `/checkout` and `/orders`):
  ```ts
  // src/proxy.ts — update matcher
  export const config = {
    matcher: [
      "/((?!_next|.*\\..*).*)",  // Phase 1 catch-all
      "/checkout(.*)",
      "/orders(.*)",
      "/api/orders/create",
    ],
  };
  ```
  The Phase 1 catch-all already redirects unauthenticated users to `/sign-in` for any non-`_next`/asset path; adding explicit matchers is belt-and-suspenders.

### Test Cases (AGENT)

- [ ] **Step 4.8: Write `tests/integration/auth-guard.test.ts`** (2 tests per [Testing LLD §6.4](./AuraStore_Testing_LLD_Phase2.md)):
  - `/checkout` and `/orders` redirect to `/sign-in` when unauthenticated.
  - Run: `npx vitest run tests/integration/auth-guard.test.ts` → PASS.

- [ ] **Step 4.9: Write `tests/integration/checkout-flow.test.tsx`** (2 tests per [Testing LLD §6.5](./AuraStore_Testing_LLD_Phase2.md)):
  - MSW overrides `POST /api/orders/create` per test.
  - Run: `npx vitest run tests/integration/checkout-flow.test.tsx` → PASS.

- [ ] **Step 4.10: Write `tests/unit/AddressForm.test.tsx`** (4 tests per [Testing LLD §5.3](./AuraStore_Testing_LLD_Phase2.md)):
  - Run: `npx vitest run tests/unit/AddressForm.test.tsx` → PASS.

### Verification

- [ ] `npx tsc --noEmit` clean.
- [ ] All new tests PASS.
- [ ] Manual: signed in → `/checkout` → fill form → click "Continue to payment" → Razorpay modal opens (Test Mode).
- [ ] Manual: signed out → `/checkout` → redirected to `/sign-in?redirect_url=/checkout`.

### Commit

- [ ] **Step 4.11: Commit**
  ```bash
  git add src/lib/checkout-schema.ts \
          src/components/checkout/AddressForm.tsx src/components/checkout/OrderSummary.tsx src/components/checkout/RazorpayCheckout.tsx \
          src/app/checkout/page.tsx src/app/checkout/CheckoutClient.tsx \
          src/proxy.ts \
          tests/integration/auth-guard.test.ts tests/integration/checkout-flow.test.tsx \
          tests/unit/AddressForm.test.tsx
  git commit -m "feat(phase-2/stage-4): /checkout page + AddressForm + Razorpay modal + auth guard"
  ```

---

## 8. Stage 5 — Orders History + Detail + Confirmation

### Entry Gate

- [ ] Stage 4 green: cumulative tests PASS; `/checkout` flow works end-to-end with mocked Razorpay (and real Test Mode modal in dev).

### Setup

- [ ] **Step 5.1: Create `src/app/orders/page.tsx`** (Server Component, auth-protected):
  ```tsx
  import { auth } from "@clerk/nextjs/server";
  import { redirect } from "next/navigation";
  import { getOrdersForUser } from "@/lib/orders";
  import { OrderHistoryPage } from "@/components/orders/OrderHistoryPage";

  export default async function OrdersPage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in?redirect_url=/orders");
    const orders = await getOrdersForUser(userId);
    return <OrderHistoryPage orders={orders} />;
  }
  ```

- [ ] **Step 5.2: Create `src/components/orders/OrderHistoryPage.tsx`**:
  - Empty state: "You have no orders yet" + CTA to `/products`.
  - Non-empty: list of `<OrderCard order={...} />` (date, status badge, total, item count) linking to `/orders/[documentId]`.

- [ ] **Step 5.3: Create `src/components/orders/OrderCard.tsx`** — presentational card.

- [ ] **Step 5.4: Create `src/app/orders/[documentId]/page.tsx`** (Server Component, auth-protected):
  ```tsx
  import { auth } from "@clerk/nextjs/server";
  import { redirect, notFound } from "next/navigation";
  import { getOrderByDocumentId } from "@/lib/orders";
  import { OrderDetail } from "@/components/orders/OrderDetail";

  export default async function OrderDetailPage({ params }: { params: { documentId: string } }) {
    const { userId } = await auth();
    if (!userId) redirect(`/sign-in?redirect_url=/orders/${params.documentId}`);
    const order = await getOrderByDocumentId(userId, params.documentId);
    if (!order) notFound();
    return <OrderDetail order={order} />;
  }
  ```

- [ ] **Step 5.5: Create `src/components/orders/OrderDetail.tsx`**:
  - Header (order id, date, status badge).
  - Items table (image, name, qty, price).
  - Totals (subtotal, total).
  - Shipping address block.
  - Payment status (Razorpay payment id, if present).

- [ ] **Step 5.6: Create `src/app/checkout/confirmation/page.tsx`** (Server Component, auth-protected):
  - Reads `?order_id=<documentId>` and `?cleared=1`.
  - Calls `getOrderByDocumentId(userId, documentId)`.
  - Renders one of three branches:
    - `status === "paid"` → `<OrderConfirmation order={...} />`.
    - `status === "pending"` → `<PaymentProcessing />` (auto-refresh every 3 s via a tiny client component, up to 10 attempts).
    - `status === "failed"` → `<PaymentFailed />` with "Retry checkout" link.
    - `null` (not found) → `notFound()`.

- [ ] **Step 5.7: Create `src/components/orders/OrderConfirmation.tsx`**:
  - "Order confirmed" headline + order id + email + total.
  - "View your orders" CTA → `/orders`.

- [ ] **Step 5.8: Clear the cart on confirmation**:
  - In `RazorpayCheckout.tsx` (Stage 4), the `handler` already navigates with `?cleared=1`.
  - Add a small client island in `/checkout/confirmation/page.tsx` that, on mount, reads `searchParams.cleared === "1"` and calls `cartStore.clear()` (then removes the query param via `router.replace`).

### Test Cases (AGENT)

- [ ] **Step 5.9: Write `tests/unit/confirmation.test.tsx`** (2 tests):
  - Renders order info when `status === "paid"`.
  - Renders "Payment processing…" when `status === "pending"`.
  - Run: `npx vitest run tests/unit/confirmation.test.tsx` → PASS.

- [ ] **Step 5.10: Write `tests/unit/OrderHistoryPage.test.tsx`** (2 tests):
  - Empty state; non-empty list renders `<OrderCard />` per order.
  - Run: `npx vitest run tests/unit/OrderHistoryPage.test.tsx` → PASS.

### Verification

- [ ] `npx tsc --noEmit` clean.
- [ ] All new tests PASS.
- [ ] Manual: place an order via Test Mode → `/checkout/confirmation` → "Order confirmed" → `/orders` shows the order.

### Commit

- [ ] **Step 5.11: Commit**
  ```bash
  git add src/app/orders src/app/checkout/confirmation \
          src/components/orders \
          tests/unit/confirmation.test.tsx tests/unit/OrderHistoryPage.test.tsx
  git commit -m "feat(phase-2/stage-5): /orders history + detail + /checkout/confirmation"
  ```

---

## 9. Stage 6 — End-to-End & Test Pyramid Orchestration

### Entry Gate

- [ ] Stages 1–5 green: all unit + integration tests PASS.

### Setup

- [ ] **Step 6.1: Add Phase 2 Playwright project** (in `playwright.config.ts`):
  ```ts
  projects: [
    { name: "chromium", /* Phase 1 */ },
    {
      name: "phase-2",
      testMatch: /phase2\/.*\.spec\.ts$|\.phase2\.spec\.ts$/,
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["chromium"],
    },
  ],
  ```
  Decision: rather than two projects, **group Phase 2 specs under `tests/e2e/phase2/`** so the Phase 1 config is untouched.

- [ ] **Step 6.2: Add E2E fixtures**:
  - `tests/e2e/phase2/fixtures/clerk.ts` — re-export from `tests/e2e/fixtures/clerk.ts` (Phase 1).
  - `tests/e2e/phase2/fixtures/clear-cart.ts` — `clearCart(page)` helper.
  - `tests/e2e/phase2/fixtures/seed-cart.ts` — `seedCart(page, items)` helper.

- [ ] **Step 6.3: Add `playwright-ct` global setup** (if not already from Phase 1):
  - Confirm `playwright.config.ts` `globalSetup` calls `clerkSetup()` (carried from Phase 1).

- [ ] **Step 6.4: Ensure Strapi is running + seeded** before E2E:
  - Add npm script: `"pretest:e2e:phase2": "cd backend && npm run develop &"` — **better**: document in the README that E2E assumes Strapi is up; CI spins up Strapi in `globalSetup` (see Stage 7).

### Test Cases (AGENT)

Write each spec under `tests/e2e/phase2/`:

- [ ] **Step 6.5: `tests/e2e/phase2/cart.spec.ts`** (3 tests per [Testing LLD §7.1](./AuraStore_Testing_LLD_Phase2.md)):
  - Add → badge; drawer open + inc/dec/remove; empty state.
  - Run: `npx playwright test tests/e2e/phase2/cart.spec.ts` → PASS.

- [ ] **Step 6.6: `tests/e2e/phase2/cart-persistence.spec.ts`** (1 test):
  - Run: `npx playwright test tests/e2e/phase2/cart-persistence.spec.ts` → PASS.

- [ ] **Step 6.7: `tests/e2e/phase2/auth-guard.spec.ts`** (1 test):
  - Run: `npx playwright test tests/e2e/phase2/auth-guard.spec.ts` → PASS.

- [ ] **Step 6.8: `tests/e2e/phase2/checkout.spec.ts`** (1 test):
  - Run: `npx playwright test tests/e2e/phase2/checkout.spec.ts` → PASS.

- [ ] **Step 6.9: `tests/e2e/phase2/payment.spec.ts`** (2 tests):
  - Success card `4111 1111 1111 1111`; failure card `4000 0000 0000 0002`.
  - Run: `npx playwright test tests/e2e/phase2/payment.spec.ts` → PASS.

- [ ] **Step 6.10: `tests/e2e/phase2/orders.spec.ts`** (2 tests):
  - Run: `npx playwright test tests/e2e/phase2/orders.spec.ts` → PASS.

### Verification

- [ ] `npx playwright test tests/e2e/phase2/` → all 10 PASS.
- [ ] `npx vitest run` → all 76 PASS (35 Phase 1 + 41 Phase 2 unit + integration).
- [ ] Coverage thresholds met (stmts ≥ 80, branches ≥ 75, funcs ≥ 80, lines ≥ 80).
- [ ] **Full pyramid: 22 unit + 19 integration + 10 e2e = 51 Phase 2 tests PASS.**

### Commit

- [ ] **Step 6.11: Commit**
  ```bash
  git add playwright.config.ts tests/e2e/phase2
  git commit -m "test(phase-2/stage-6): all 10 E2E specs + phase-2 Playwright project"
  ```

---

## 10. Stage 7 — CI/CD, Quality Gates & Reporting

### Entry Gate

- [ ] Stage 6 green: all 86 tests PASS locally.

### Setup

- [ ] **Step 7.1: Extend `.github/workflows/ci.yml`**:
  ```yaml
  jobs:
    phase-1:
      # ... existing (unchanged)
    phase-2:
      if: github.event_name == 'push' && contains(github.ref, 'refs/heads/phase-2')
      runs-on: ubuntu-latest
      services:
        postgres:
          image: postgres:16
          env:
            POSTGRES_USER: strapi
            POSTGRES_PASSWORD: strapi
            POSTGRES_DB: strapi
          ports: ["5432:5432"]
          options: --health-cmd pg_isready --health-interval 10s
      env:
        STRAPI_API_TOKEN: ${{ secrets.PHASE2_STRAPI_API_TOKEN }}
        STRAPI_API_TOKEN_WRITE: ${{ secrets.PHASE2_STRAPI_API_TOKEN_WRITE }}
        RAZORPAY_KEY_ID: ${{ secrets.PHASE2_RAZORPAY_KEY_ID }}
        RAZORPAY_KEY_SECRET: ${{ secrets.PHASE2_RAZORPAY_KEY_SECRET }}
        RAZORPAY_WEBHOOK_SECRET: ${{ secrets.PHASE2_RAZORPAY_WEBHOOK_SECRET }}
        CLERK_SECRET_KEY: ${{ secrets.PHASE2_CLERK_SECRET_KEY }}
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ${{ secrets.PHASE2_NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY }}
        E2E_CLERK_USER_EMAIL: ${{ secrets.PHASE2_E2E_CLERK_USER_EMAIL }}
        E2E_CLERK_USER_PASSWORD: ${{ secrets.PHASE2_E2E_CLERK_USER_PASSWORD }}
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with: { node-version: 22 }
        - run: npm ci
        - run: cd backend && npm ci && npm run build
        - run: cd backend && nohup npm run develop > strapi.log &  # see Step 7.2
        - run: sleep 30 && curl -sf http://localhost:1337/_health || (cat backend/strapi.log && exit 1)
        - run: cd backend && npm run seed && npm run seed:orders
        - run: npx tsc --noEmit
        - run: npx vitest run --coverage
        - run: npx playwright install --with-deps chromium
        - run: npx playwright test tests/e2e/phase2/
  ```

- [ ] **Step 7.2: Strapi readiness probe** (avoid the AGENTS.md G4 "no polling loops" trap):
  - One-shot: `curl -sf http://localhost:1337/_health` (Strapi v5 exposes `/_health`); if it fails, dump the log and fail fast. No `while true` loops.

- [ ] **Step 7.3: Codecov `phase-2` flag** (in `codecov.yml`):
  ```yaml
  flag_management:
    default_rules:
      carryforward: true
      statuses:
        - type: project
          target: 80%
      flag:
        phase-2:
          paths:
            - src/lib/cart.ts
            - src/lib/orders.ts
            - src/lib/razorpay.ts
            - src/lib/razorpay-webhook.ts
            - src/app/api/orders/create
            - src/app/api/webhooks/razorpay
            - src/app/checkout
            - src/app/orders
            - src/app/checkout/confirmation
            - src/components/cart
            - src/components/checkout
            - src/components/orders
            - src/hooks/useAddToCart.ts
            - src/hooks/useRemoveFromCart.ts
            - src/hooks/useUpdateQuantity.ts
  ```

- [ ] **Step 7.4: Quality gates (all required to merge `phase-2/*` PRs)**:
  1. Phase 1 + Phase 2 unit/integration green.
  2. Phase 2 E2E green on Chromium.
  3. Coverage thresholds met for `phase-2` flag.
  4. `tsc --noEmit` clean.
  5. `next build` clean.

### Verification

- [ ] Open a PR titled `phase-2: ready for review` from a `phase-2/*` branch.
- [ ] CI workflow triggers the `phase-2` job.
- [ ] All 5 quality gates PASS.

### Commit

- [ ] **Step 7.5: Commit**
  ```bash
  git add .github/workflows/ci.yml codecov.yml
  git commit -m "ci(phase-2/stage-7): phase-2 CI job + Codecov flag + quality gates"
  ```

---

## 11. Reconciliation Summary

| Stage | Unit (new) | Integration (new) | E2E (new) | Cumulative (Phase 2) |
|-------|-----------|-------------------|-----------|---------------------|
| 1 | 10 | 0 | 0 | 10 |
| 2 | 4 | 12 | 0 | 26 |
| 3 | 4 | 3 | 0 | 33 |
| 4 | 4 | 4 | 0 | 41 |
| 5 | 4 | 0 | 0 | 45 |
| 6 | 0 | 0 | 10 | 55 |
| **Final** | **22** | **19** | **10** | **51** ✓ |

> The reconciled subtotals (22/19/10 = 51) match [Testing LLD Phase 2 §9.2](./AuraStore_Testing_LLD_Phase2.md) exactly. **No discrepancy** with [Testing HLD §9.6](../AuraStore_Testing_HLD.md).

---

## 12. Open Items for the Agent

| # | Item | Action |
|---|------|--------|
| O1 | Issue a second Strapi API token `Order writer` (`Write`+`Update` on `Order` only) → store as `STRAPI_API_TOKEN_WRITE`. The Phase 1 `STRAPI_API_TOKEN` stays read-only on `Product`+`Category` (least-privilege). See Stage 1.2c. | One-shot, dashboard action, no human in the loop after the agent has admin URL access. |
| O2 | Razorpay webhook URL changes whenever the tunnel restarts (e.g. ngrok free tier). | Document in README; re-update the dashboard webhook each tunnel restart. CI uses a synthetic payload; no live webhook needed. |
| O3 | "Add to cart" button on `ProductCard` makes it a Client Component. | If size becomes a concern, extract a `<ProductCardAddToCart />` island; the rest of `ProductCard` can stay server-rendered. |
| O4 | Sonner toast assertions depend on `vi.spyOn(toast, ...)`. | Document in the test setup README; tests rely on this pattern. |
| O5 | Phase 3 will introduce Framer Motion and re-style the drawer. | Phase 2 ships a non-animated drawer; do not add `framer-motion` in Phase 2. |

---

## 13. What Comes After Phase 2

- **Phase 3 (Advanced):** animations (LazyMotion), search/sort, wishlist, dark mode, SEO (meta + JSON-LD + sitemap), WCAG 2.1 AA hardening, rate limiting on `/api/orders/create`, security headers via `proxy.ts`, Vercel + Strapi Cloud deployment, switch Razorpay to Live Mode.
- All Phase 2 surfaces (`/checkout`, `/orders`, `/cart`) are **forward-compatible** with Phase 3 — no destructive changes anticipated.

---

*This plan defines the staged execution (WHAT, in what order) for Phase 2. Full design lives in [Phase 2 LLD](./AuraStore_LLD_Phase2.md); full test design lives in [Phase 2 Testing LLD](./AuraStore_Testing_LLD_Phase2.md); human-only prerequisites live in [Phase 2 Prerequisites](./AuraStore_Prerequisites_Phase2.md).*
*Last updated: July 21, 2026*