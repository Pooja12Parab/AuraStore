# AuraStore — Low-Level Design (LLD): Phase 2 (Mandatory)

> **Project:** AuraStore: The Modern Consumer App
> **Version:** 1.0
> **Status:** Draft
> **Date:** July 21, 2026
> **Document Type:** Low-Level Design (Implementation)
> **Parent Document:** [AuraStore HLD](../AuraStore_HLD.md)
> **Sister Docs:** [Requirements](../AuraStore_Requirements.md) · [Testing HLD](../AuraStore_Testing_HLD.md) · [Testing LLD Phase 2](./AuraStore_Testing_LLD_Phase2.md) · [Implementation Plan](./AuraStore_Phase2_Implementation_Plan.md) · [Prerequisites](./AuraStore_Prerequisites_Phase2.md)
> **Phase:** Phase 2 — Mandatory (Shopping cart, Razorpay checkout, order management)
> **Audience:** Developers, testers

---

## Table of Contents

1. [Document Header](#1-document-header)
2. [Scope & Objectives](#2-scope--objectives)
3. [Assumptions, Constraints & Dependencies](#3-assumptions-constraints--dependencies)
4. [Detailed Design](#4-detailed-design)
   - [4.1 Component Architecture](#41-component-architecture)
   - [4.2 Module / Component Design](#42-module--component-design)
   - [4.3 Sequence Diagrams](#43-sequence-diagrams)
   - [4.4 API / Data Contracts](#44-api--data-contracts)
   - [4.5 Data Design](#45-data-design)
5. [Error Handling Strategy](#5-error-handling-strategy)
6. [Security Considerations](#6-security-considerations)
7. [Performance Considerations](#7-performance-considerations)
8. [Observability Plan](#8-observability-plan)
9. [Testing Strategy](#9-testing-strategy)
10. [Deployment & Rollout](#10-deployment--rollout)
11. [Open Questions & Risks](#11-open-questions-risks)

---

## 1. Document Header

### 1.1 Purpose

This Low-Level Design defines the **how** (component-level design, interface contracts, and implementation patterns) for **Phase 2** of AuraStore. It translates the HLD and Requirements into actionable specifications for developers and testers, and extends the Phase 1 baseline without changing locked decisions.

### 1.2 Scope Summary

- **In Scope:** Client-side cart state + `localStorage` persistence, slide-out cart drawer, cart badge, add/increment/decrement/remove with optimistic updates, `/checkout` page (address form + order summary), `POST /api/orders/create` (Razorpay order), Razorpay Checkout modal integration, `POST /api/webhooks/razorpay` (HMAC-SHA256 verification, order status update), `/orders` history + `/orders/[documentId]` detail, Strapi `Order` content type, Sonner toasts, Clerk auth guards on `/checkout` and `/orders`.
- **Out of Scope (Phase 1, already shipped):** Clerk auth, Strapi Product/Category catalog, browsing pages, layout.
- **Out of Scope (Phase 3):** Animations (cart slide, page transitions), search/sort, wishlist, dark mode, SEO, accessibility hardening, rate limiting, security headers.

### 1.3 Tech Stack (Locked + Phase 2 deltas)

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Framework | Next.js | **16.2+** | App Router, PPR via `cacheComponents: true`, Turbopack default |
| Runtime | Node.js | **v22.x** | Required for Next 16 |
| Language | TypeScript | **v5.x** | Strict mode |
| Styling | Tailwind CSS | **v4.3+** | CSS-first; `@import "tailwindcss"`, `@theme` blocks; no `tailwind.config.js` |
| UI Library | shadcn/ui | v2+ | `style: new-york`, `rsc: true`, `cssVariables: true`; **new components added**: `sheet`, `input`, `label`, `textarea`, `radio-group`, `separator` |
| Auth | Clerk | **v7.x** | `proxy.ts` boundary, async `auth()`, `auth.protect()` |
| CMS | Strapi | **v5.x** | Flattened response, explicit `populate`; **NEW**: `Order` collection type |
| Data Fetching | TanStack Query | **v5.90+** | `queryOptions`, `isPending`, `gcTime`; **NEW**: cart + order mutations |
| Payments | Razorpay | **API v1** | Node SDK (`razorpay`) for `orders.create`; **Checkout.js** (`v1/checkout.js`) for modal |
| Notifications | Sonner | **v1.x** | `<Toaster />` mounted in `RootLayout`; one toast per action |
| Validation | Zod | **v3.x** | Server-side validation of `POST /api/orders/create` and webhook payloads |
| HTTP Client | Native `fetch` | — | Wrapped in `lib/strapi.ts` and `lib/razorpay.ts` |
| State (cart) | `useSyncExternalStore` + `localStorage` | — | SSR-safe external store; no Redux/Zustand |

> **No new heavyweight dependencies.** Sonner, Razorpay (Node SDK), and the Razorpay Checkout.js `<script>` tag are the only additions.

---

## 2. Scope & Objectives

### 2.1 In-Scope Functional Requirements (Phase 2 = FR20–FR41)

| FR ID | Requirement | Phase 2 Module |
|-------|-------------|----------------|
| FR20 | Add products to cart with quantity selection | `ProductCard` ("Add to cart") → `useCart().add()` |
| FR21 | Slide-out drawer with items, quantities, subtotal | `CartDrawer` (shadcn `Sheet`, right side) |
| FR22 | Increment / decrement / remove items | `CartItem` + `QuantitySelector` |
| FR23 | Cart persists across browser sessions | `lib/cart.ts` external store → `localStorage` key `aurastore:cart:v1` |
| FR24 | Cart item-count badge on header icon | `Header` → `CartIconButton` (badge from `useCart().totalQuantity`) |
| FR25 | Empty cart with CTA to browse products | `CartDrawer` empty state |
| FR26 | Cart actions show toast notifications | Sonner toasts on add/remove/error |
| FR27 | Proceed from cart → checkout | `CartDrawer` footer CTA → `/checkout` |
| FR28 | Order summary on checkout (items, qtys, totals) | `OrderSummary` (checkout page) |
| FR29 | Shipping address + email | `AddressForm` (controlled, client-validated with `react-hook-form` + `zod`) |
| FR30 | Create Razorpay order, return `order_id` | `POST /api/orders/create` (Server Route) |
| FR31 | Launch Razorpay modal + complete test payment | `CheckoutPage` mounts Checkout.js; `payment.captured` handler |
| FR32 | Receive Razorpay webhook | `POST /api/webhooks/razorpay` |
| FR33 | Verify cryptographic signature | HMAC-SHA256 with `RAZORPAY_WEBHOOK_SECRET` over **raw** body |
| FR34 | Update order status in Strapi (`pending` → `paid`/`failed`) | Strapi `PUT /api/orders/:documentId` from webhook handler |
| FR35 | Order confirmation page after successful payment | `/checkout/confirmation?order_id=…` (Server Component reads Strapi) |
| FR36 | Payment failure error messages | Modal `ondismiss` + failure-card flow → toast + return to checkout |
| FR37 | Strapi stores orders with user/items/total/status/paymentId/address | Strapi `Order` schema (see §4.5) |
| FR38 | Authenticated users can view order history | `/orders` Server Component, filters by `clerkUserId` |
| FR39 | Authenticated users can view full order detail | `/orders/[documentId]` Server Component |
| FR40 | Unauthenticated → `/checkout` redirects to sign-in | `proxy.ts` matcher + `auth.protect()` in `/checkout` Server Component |
| FR41 | Address form fields have client-side validation | `react-hook-form` + `zod` resolver |

### 2.2 Out-of-Scope (Phase 2 seam notes)

| Feature | Phase | Seam in Phase 2 |
|---------|-------|-----------------|
| Cart slide-in animation | 3 | Drawer opens instantly; no Framer Motion |
| Search / sort / wishlist | 3 | Not in nav or product cards |
| Dark mode | 3 | Light theme only |
| Rate limiting on `/api/orders/create` | 3 | Not implemented |
| Security headers (Helmet-style) | 3 | Not added to `proxy.ts` |
| WCAG 2.1 AA hardening | 3 | Focus is functional; basic labels + keyboard support only |

---

## 3. Assumptions, Constraints & Dependencies

### 3.1 Assumptions

- **Phase 1 is complete and green** — Next.js 16 frontend running, Strapi v5 with seeded+published Products/Categories, Clerk `+clerk_test` user working.
- **Razorpay Test Mode account** exists; `rzp_test_` keys, webhook secret, and webhook URL are configured (per [Prerequisites](./AuraStore_Prerequisites_Phase2.md)).
- **Product prices** continue to be whole INR rupees (no paise). Razorpay amounts use the **same whole-rupee value** (`amount` in rupees, NOT paise).
- **Cart identity** is by `productId` (Strapi `documentId`). Adding the same product twice increments quantity (no duplicate line items).
- **One cart per browser**, not per user. The cart lives in `localStorage`; signed-in vs signed-out users see the same cart contents until they check out (where the server-side order is keyed by `clerkUserId`).
- **No stock reservation.** Inventory is not in scope (Phase 3 may revisit). Orders can be placed regardless of stock value.
- **Webhook idempotency** is required — Razorpay may retry. The webhook handler must be safe to call multiple times for the same `payment_id`.

### 3.2 Constraints

- **No additional state library.** Cart uses `useSyncExternalStore` + `localStorage`. No Zustand, Redux, or Jotai.
- **No `populate=*`** in Strapi queries — use explicit `fields` + `populate` (same rule as Phase 1).
- **Server-only Razorpay secret.** `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` never enter the client bundle. `NEXT_PUBLIC_RAZORPAY_KEY_ID` is the only Razorpay value exposed.
- **Webhook signature verification is mandatory and is computed over the RAW request body**, not the parsed JSON. Next.js App Router requires `req.text()` to read the raw body.
- **Server-verified amounts.** The Next.js `/api/orders/create` route must recompute the total from `items[].productId` × Strapi `price`, not trust the client's `amount` (NFR11).
- **Strapi `Order` content type is PRIVATE** (no Public role read). All reads/writes go through the Next.js server. Two API tokens are used: `STRAPI_API_TOKEN` (read on `Product`+`Category` — Phase 1, unchanged) and `STRAPI_API_TOKEN_WRITE` (read+write+update on `Order` — Phase 2 NEW). See [§4.2.13](#422-13-strapi-order-content-type).
- **`auth.protect()` on `/checkout`** is in addition to `proxy.ts` protection — defense-in-depth per HLD §9.2 (CVE-2025-29927).

### 3.3 External Dependencies

- `razorpay` (npm, server) — `Razorpay({ key_id, key_secret })`, `.orders.create({ amount, currency, receipt })`.
- Razorpay **Checkout.js** (`https://checkout.razorpay.com/v1/checkout.js`) — loaded via Next `<Script strategy="lazyOnload">` in the checkout page.
- Sonner — `<Toaster richColors position="top-right" />` mounted once in `RootLayout`.
- `react-hook-form` + `@hookform/resolvers` + `zod` — for the address form (client validation; server re-validates).

---

## 4. Detailed Design

### 4.1 Component Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              Next.js App (port 3000)                          │
│                                                                                │
│   ┌────────────────────────────────────────────────────────────────────┐     │
│   │ RootLayout: <ClerkProvider><QueryProvider><Toaster />{children}   │     │
│   └────────────────────────────────────────────────────────────────────┘     │
│                                                                                │
│   Phase 1 (shipped)              Phase 2 (this doc)                            │
│   ─────────────────              ─────────────────                             │
│   • Header (logo, nav,           • Header ← adds <CartIconButton badge/>      │
│     auth section)                • ProductCard ← "Add to cart" button         │
│   • ProductGrid/Detail           • CartDrawer (Sheet) + CartItem +            │
│   • Category pages                 QuantitySelector + CartSummary            │
│   • /sign-in, /sign-up           • /checkout (Server, auth-protected)         │
│                                    + AddressForm + OrderSummary               │
│                                  • /checkout/confirmation                      │
│                                  • /orders (Server, auth-protected)           │
│                                  • /orders/[documentId] (Server)             │
│                                                                                │
│   lib/                            lib/ (NEW in Phase 2)                        │
│   ─────                           ───────────                                   │
│   • strapi.ts                     • cart.ts (external store + localStorage)   │
│   • strapi-queries.ts             • razorpay.ts (server SDK wrapper)          │
│   • format.ts                     • orders.ts (createOrder + getOrders)       │
│                                                                                │
│   hooks/                          hooks/ (NEW)                                 │
│   ──────                          ────────                                      │
│   • useProducts.ts                • useCart.ts (consumes lib/cart.ts)         │
│                                   • useAddToCart.ts, useRemoveFromCart.ts     │
│                                   • useUpdateQuantity.ts                      │
│                                                                                │
│   app/api/                        app/api/ (NEW)                               │
│   ─────────                       ───────────                                  │
│                                   • orders/create/route.ts (POST)             │
│                                   • webhooks/razorpay/route.ts (POST)         │
│                                                                                │
│   proxy.ts (Phase 1)              proxy.ts (EXTENDED)                          │
│                                   • matcher += /checkout, /orders             │
│                                                                                │
│                                  Strapi (backend/, port 1337)                  │
│                                  ────────────────────────                      │
│                                  • NEW: Order collection type                  │
│                                  • NEW: order seed (1 paid, 1 pending)         │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Module / Component Design

#### 4.2.1 Cart external store — `src/lib/cart.ts`

A single module owns the cart. It is a **pure JS** external store (no React) so it can be consumed from server components, server actions, client components, and event handlers via the same `useSyncExternalStore` hook.

**File:** `src/lib/cart.ts`

```ts
export type CartItem = {
  productId: string;     // Strapi documentId
  slug: string;
  name: string;
  price: number;         // whole INR rupees
  imageUrl: string | null;
  quantity: number;      // >= 1
};

export type CartState = {
  items: CartItem[];     // unique by productId
  updatedAt: number;     // epoch ms — last mutation
};

export const CART_STORAGE_KEY = "aurastore:cart:v1";

export const cartStore = {
  getSnapshot(): CartState { /* read localStorage or return { items: [], updatedAt: 0 } */ },
  subscribe(listener: () => void): () => void { /* wrap window 'storage' + manual emit */ },
  add(item: Omit<CartItem, "quantity">, qty?: number): void,
  setQuantity(productId: string, qty: number): void,   // qty <= 0 removes
  remove(productId: string): void,
  clear(): void,
  totalQuantity(): number,                              // sum of quantities
  subtotal(): number,                                   // sum of price*qty
};

export function useCart(): {
  items: CartItem[];
  totalQuantity: number;
  subtotal: number;
  add: typeof cartStore.add;
  setQuantity: typeof cartStore.setQuantity;
  remove: typeof cartStore.remove;
  clear: typeof cartStore.clear;
};
```

**Invariants:**
- `items` is always unique by `productId`. `add()` of an existing product increments its `quantity` by `qty` (default 1).
- `setQuantity(id, 0)` removes the item.
- `subscribe()` returns an unsubscribe. It emits on every cart mutation **and** on the window `storage` event (so multiple tabs stay in sync).
- `getSnapshot()` returns a **new reference** whenever the underlying state changes, so `useSyncExternalStore` re-renders.
- SSR: `getSnapshot()` returns a stable empty state on the server. The first client render hydrates from `localStorage`.

#### 4.2.2 Razorpay server SDK wrapper — `src/lib/razorpay.ts`

**File:** `src/lib/razorpay.ts`

```ts
import Razorpay from "razorpay";

let _client: Razorpay | null = null;

export function getRazorpay(): Razorpay {
  if (_client) return _client;
  const key_id = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!;
  const key_secret = process.env.RAZORPAY_KEY_SECRET!;
  _client = new Razorpay({ key_id, key_secret });
  return _client;
}

export async function createRazorpayOrder(args: {
  amount: number;      // whole INR rupees
  currency: "INR";
  receipt: string;     // <64 chars; we use crypto.randomUUID()
}): Promise<{ id: string; amount: number; currency: string }> { /* ... */ }
```

#### 4.2.3 Server-side order helpers — `src/lib/orders.ts`

```ts
export type CheckoutInput = {
  items: Array<{ productId: string; quantity: number }>;
  address: {
    fullName: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  email: string;
};

export type CreateOrderResult =
  | { ok: true; razorpayOrderId: string; amount: number; currency: "INR"; orderDocumentId: string }
  | { ok: false; error: string };

export async function createOrderForCheckout(
  clerkUserId: string,
  input: CheckoutInput
): Promise<CreateOrderResult>;

export async function getOrdersForUser(clerkUserId: string): Promise<Order[]>;     // history list
export async function getOrderByDocumentId(clerkUserId: string, documentId: string): Promise<Order | null>;
export async function markOrderPaid(razorpayOrderId: string, paymentId: string): Promise<void>;
export async function markOrderFailed(razorpayOrderId: string, reason: string): Promise<void>;
```

**`createOrderForCheckout` contract:**
1. **Validate** `CheckoutInput` with Zod.
2. **Fetch** each product from Strapi by **`documentId`** via `GET /api/products/:documentId?fields[0]=price&fields[1]=name&fields[2]=slug&populate[images][fields][0]=url`. Collect `{name, price, image}`. If any `productId` is unknown (404), return `{ ok: false, error: "Unknown product: <id>" }`.
3. **Compute** `amount = Σ(price × quantity)`. **Never trust the client's total.**
4. **Create** the Strapi `Order` via `POST /api/orders` with `Authorization: Bearer ${STRAPI_API_TOKEN_WRITE}` (the new write-scoped token), body `{ data: { clerkUserId, items, address, total, email, status: "pending" } }`. The server returns the created `documentId`.
5. **Create** the Razorpay order with `amount`, `currency: "INR"`, `receipt = <order documentId>`.
6. **Update** the Strapi order via `PUT /api/orders/:documentId` with `data: { razorpayOrderId }`.
7. Return `{ ok: true, razorpayOrderId, amount, currency, orderDocumentId }`.

#### 4.2.4 Client hooks — `src/hooks/useCart.ts` (re-export), `useAddToCart.ts`, `useRemoveFromCart.ts`, `useUpdateQuantity.ts`

These are thin wrappers that call `cartStore` and fire Sonner toasts.

```ts
// src/hooks/useAddToCart.ts
"use client";
import { useCallback } from "react";
import { toast } from "sonner";
import { cartStore } from "@/lib/cart";

export function useAddToCart() {
  return useCallback((item: Parameters<typeof cartStore.add>[0], qty = 1) => {
    cartStore.add(item, qty);
    toast.success(`Added "${item.name}" to cart`);
  }, []);
}
```

`useRemoveFromCart` and `useUpdateQuantity` mirror the pattern. Errors (e.g. invalid quantity) show a destructive toast.

#### 4.2.5 `CartDrawer` — `src/components/cart/CartDrawer.tsx`

Built on shadcn `Sheet` (right side, `size="lg"`). Rendered **once** in `RootLayout`, mounted via a portal, controlled by `useCartUI()` (a tiny store in `lib/cart-ui.ts` that the header button toggles).

- Props: none (reads cart + UI state).
- Empty state: `<EmptyCartView />` with a "Browse products" CTA → `/products`.
- Non-empty: `<CartItemList />` (scrollable) + sticky footer `<CartSummary />` with subtotal + "Checkout" button.

#### 4.2.6 `CartItem` — `src/components/cart/CartItem.tsx`

```tsx
type Props = { item: CartItem };
// Renders: thumbnail, name (link to /products/[slug]), price, <QuantitySelector />, remove button.
```

`QuantitySelector` is a small `+` / number / `−` group with `aria-label="Decrease quantity"` / `"Increase quantity"`.

#### 4.2.7 `CartIconButton` — `src/components/cart/CartIconButton.tsx`

```tsx
"use client";
export function CartIconButton() {
  const { totalQuantity } = useCart();
  const open = useCartUI(s => s.open);
  return (
    <Button variant="ghost" size="icon" aria-label={`Cart, ${totalQuantity} items`} onClick={open}>
      <ShoppingCartIcon />
      {totalQuantity > 0 && <Badge>{totalQuantity}</Badge>}
    </Button>
  );
}
```

Wired into the existing Phase 1 `Header` (between nav and auth section).

#### 4.2.8 `/checkout` — `src/app/checkout/page.tsx`

Server Component. First line:

```ts
import { auth } from "@clerk/nextjs/server";
export default async function CheckoutPage() {
  const { userId } = await auth();
  if (!userId) return redirect("/sign-in?redirect_url=/checkout");
  // ... render <CheckoutClient userId={userId} />
}
```

`CheckoutClient` (`"use client"`):
1. Reads cart from `useCart()`.
2. If cart empty → `<EmptyCartView />`.
3. Renders `<OrderSummary />` (left, sticky on desktop) and `<AddressForm />` (right).
4. On submit:
   - Validates with Zod resolver.
   - POSTs `/api/orders/create` with `{ items, address, email }`.
   - On 200 → mounts `<RazorpayCheckout orderId amount ... />`.
5. `<RazorpayCheckout>` loads `https://checkout.razorpay.com/v1/checkout.js` via Next `<Script strategy="lazyOnload">`, opens the modal with `key`, `order_id`, `amount`, `currency`, `handler: (resp) => router.push("/checkout/confirmation?order_id=" + orderDocumentId)`, `modal.ondismiss: () => toast.error("Payment cancelled")`.

#### 4.2.9 `AddressForm` — `src/components/checkout/AddressForm.tsx`

`react-hook-form` + `zod` resolver:

```ts
const addressSchema = z.object({
  fullName: z.string().min(2, "Required").max(120),
  email: z.string().email(),
  street: z.string().min(3, "Required"),
  city: z.string().min(2, "Required"),
  state: z.string().min(2, "Required"),
  zipCode: z.string().regex(/^\d{6}$/, "6-digit Indian PIN"),
  country: z.string().min(2, "Required").default("India"),
});
```

Submit button disabled while `isSubmitting` or cart empty.

#### 4.2.10 `/checkout/confirmation` — `src/app/checkout/confirmation/page.tsx`

Server Component:
- Reads `?order_id=<documentId>`.
- Calls `getOrderByDocumentId(userId, documentId)`.
- If `status === "paid"` → renders `<OrderConfirmation order={...} />`.
- If `status === "pending"` → renders a "Payment is processing" message with a refresh hint (covers the webhook-not-yet-arrived window).
- If `status === "failed"` → renders an error with a "Retry checkout" link.
- **Clears the cart** server-side via a redirect flag (the client `useCart().clear()` runs on confirmation mount when `?cleared=1` is present).

> **Important:** the page must NOT block on the webhook. The user's experience is: pay → confirmation page → server polls/reads Strapi. Most of the time the webhook arrives within ~2s; if not, the "processing" message stays until refresh.

#### 4.2.11 `/orders` and `/orders/[documentId]`

- `/orders`: Server Component, `auth().userId` required (proxy + `auth.protect()`); calls `getOrdersForUser(userId)`; renders `<OrderHistoryPage orders={...} />`. Empty state: "You have no orders yet" with CTA to `/products`.
- `/orders/[documentId]`: Server Component; calls `getOrderByDocumentId(userId, documentId)`; if null → `notFound()`. Renders `<OrderDetail order={...} />` (items, totals, shipping address, payment status).

#### 4.2.12 API routes

##### `POST /api/orders/create` — `src/app/api/orders/create/route.ts`

- Auth: `auth().userId` required (return `401` otherwise).
- Body: `{ items: [{ productId, quantity }], address, email }`.
- Validation: Zod schema.
- Delegates to `createOrderForCheckout(userId, body)`.
- Response: `200 { order_id, amount, currency }` on success; `400 { error, details? }` on validation/business failure; `401` if unauthenticated; `500 { error }` on Strapi/Razorpay outage.

##### `POST /api/webhooks/razorpay` — `src/app/api/webhooks/razorpay/route.ts`

- **No Clerk auth** — Razorpay does not have a Clerk session.
- Reads **raw body** via `await req.text()` (required for HMAC).
- Verifies `x-razorpay-signature`:
  ```ts
  const expected = crypto.createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(rawBody).digest("hex");
  if (expected !== headerSignature) return new Response("invalid signature", { status: 400 });
  ```
- Parses JSON.
- Idempotency: if order is already `paid` or `failed`, return `200` immediately.
- Dispatches:
  - `payment.captured` → `markOrderPaid(razorpayOrderId, paymentId)`.
  - `payment.failed` → `markOrderFailed(razorpayOrderId, reason)`.
- Always returns `200` for handled events; `400` for invalid signature/payload; `500` only if persistence fails (Razorpay will retry).

#### 4.2.13 Strapi `Order` content type

Added to the existing Strapi v5 project (Phase 1). Field model per [HLD §7.1 Order](../AuraStore_HLD.md#7-data-architecture); the exact `schema.json` to write to **`backend/src/api/order/content-types/order/schema.json`** is:

```json
{
  "kind": "collectionType",
  "collectionName": "orders",
  "info": {
    "singularName": "order",
    "pluralName": "orders",
    "displayName": "Order",
    "description": "Customer orders created at checkout and updated by the Razorpay webhook."
  },
  "options": {
    "draftAndPublish": false
  },
  "pluginOptions": {},
  "attributes": {
    "clerkUserId":     { "type": "string", "required": true, "indexed": true },
    "items":           { "type": "json", "required": true },
    "total":           { "type": "decimal", "required": true, "min": 0 },
    "status":          { "type": "enumeration", "enum": ["pending", "paid", "failed", "refunded"], "default": "pending", "required": true },
    "paymentId":       { "type": "string" },
    "razorpayOrderId": { "type": "string", "indexed": true, "unique": true },
    "address":         { "type": "json", "required": true },
    "email":           { "type": "email", "required": true },
    "phone":           { "type": "string" }
  }
}
```

**Why these decisions (Strapi v5 specifics):**

- **`draftAndPublish: false`** — Strapi v5 enables Draft & Publish by default for new content types. Orders are **immutable facts** (an order is either pending, paid, or failed — never "draft editorial content"). Leaving D&P on would cause silent failures: every new order created via `POST /api/orders` would land as a draft with `publishedAt: null` and would be invisible to default `GET /api/orders` queries. This is the single largest Strapi-correctness issue in the original Phase 1→Phase 2 seam.
- **`enumeration` field shape** is Strapi v5's strict format. The HLD-style shorthand (`"enum": [...]` at the field level) is rejected.
- **`razorpayOrderId` is `unique: true`** — Razorpay order IDs are globally unique and the field is the webhook's idempotency key. A `unique` constraint is a belt-and-suspenders safety net alongside the `markOrderPaid` no-op-on-already-paid guard.
- **`items` and `address` are `json`** — these are inline JSON values in Strapi v5. They are **not** relations, **do not** appear in `populate`, and **are not** affected by cascading deletes. This matches the HLD's snapshot-consistency intent.
- **No relation to `Product` / `Category`** — `items[].productId` is a denormalized reference (string), not a Strapi relation. This is intentional (orders survive product deletion). Document in code comments because it's easy to "fix" by accident.

**Permissions (Roles → Public / Authenticated):**
- **Public role:** all actions unchecked (`find`, `findOne`, `create`, `update`, `delete`).
- **Authenticated role:** all actions unchecked. Clerk users do **not** authenticate to Strapi — they are minted by Clerk, and the Next.js server calls Strapi on their behalf.

**API Token model (the load-bearing decision for Phase 2):**

Strapi v5 API tokens carry per-content-type action scopes (`Read`, `Write`, `Update`, `Delete`, `Publish`). Phase 1 used a single **read-only** token. Phase 2 needs `Write` + `Update` on `Order`, but should keep `Product`/`Category` reads on a least-privilege token.

| Token | Var | Scopes | Used by |
|-------|-----|--------|---------|
| `Phase 1 catalog reader` (existing) | `STRAPI_API_TOKEN` | `Read` on `Product` + `Category` | Phase 1 product/category reads (unchanged) |
| `Order writer` (**NEW**) | `STRAPI_API_TOKEN_WRITE` | `Write` + `Update` on `Order`, plus `Read` on `Order` (for `getOrdersForUser`) | `/api/orders/create`, `/api/webhooks/razorpay`, `/orders`, `/orders/[documentId]`, server-side `getOrdersForUser`, server-side `getOrderByDocumentId` |

**Why two tokens instead of one read+write:** least-privilege. Phase 1 surfaces never need `Write`. If a future XSS or SSRF hits `STRAPI_API_TOKEN`, the blast radius is reads only.

**`markOrderPaid` / `markOrderFailed` (server-side helpers in `src/lib/orders.ts`)** must use `STRAPI_API_TOKEN_WRITE`. Use `PUT /api/orders` with `filters[razorpayOrderId][$eq]=<id>` and `data: { status, paymentId }`. The Strapi response shape is `{ data: { id, documentId, status, paymentId, ... }, meta: {} }`.

### 4.3 Sequence Diagrams

#### 4.3.1 Add to cart → drawer → checkout (browser only, no network)

```
User ─── ProductCard "Add to cart" ──▶ useAddToCart()
                                          │
                                          ▼
                                     cartStore.add(item)
                                          │
                                          ├─ mutate localStorage
                                          ├─ emit (subscribers re-render)
                                          └─ toast.success("Added to cart")
                                          │
User ─── Header cart icon ──▶ CartDrawer open
                                          │
User ─── CartDrawer "Checkout" ──▶ router.push("/checkout")
```

#### 4.3.2 Checkout → Razorpay → webhook → confirmation

```
Browser              Next.js server         Razorpay            Strapi
  │                        │                   │                   │
  │ submit address         │                   │                   │
  ├───────────────────────▶│                   │                   │
  │                        │ validate (zod)    │                   │
  │                        │ fetch products    │                   │
  │                        │  (STRAPI_API_TOKEN: read)            │
  │                        ├───────────────────────────────────────▶│
  │                        │◀──────────────────────────────────────┤
  │                        │ compute total (server)                 │
  │                        │ POST /api/orders (create pending)      │
  │                        │  (STRAPI_API_TOKEN_WRITE)               │
  │                        ├───────────────────────────────────────▶│
  │                        │◀──────── { documentId } ───────────────┤
  │                        │ POST Razorpay orders.create            │
  │                        ├──────────────────▶│                   │
  │                        │◀─── { id, amount, currency } ─────────┤
  │                        │ PUT strapi order.razorpayOrderId       │
  │                        │  (STRAPI_API_TOKEN_WRITE)               │
  │                        ├───────────────────────────────────────▶│
  │  200 {order_id,amount} │                   │                   │
  │◀───────────────────────┤                   │                   │
  │ mount Checkout.js      │                   │                   │
  │───────────────────────▶│                   │                   │
  │ user pays test card    │                   │                   │
  ├────────────────────────┼──────────────────▶│                   │
  │ handler(rzpResponse)   │                   │                   │
  │ redirect /checkout/confirmation?order_id=… │                   │
  │                        │                   │                   │
  │                        │ (parallel)        │ webhook payment.captured
  │                        │◀──────────────────┤                   │
  │                        │ verify HMAC       │                   │
  │                        │ PUT strapi order.status=paid           │
  │                        │  (STRAPI_API_TOKEN_WRITE)               │
  │                        ├───────────────────────────────────────▶│
  │ reads /checkout/confirmation                 │                   │
  │◀─── shows "Order confirmed" ────────────────┼───────────────────┤
```

#### 4.3.3 Order history

```
User ─── /orders ──▶ proxy.ts → auth.userId present
                │
                ▼
            Server Component
                │
                ├─ getOrdersForUser(userId)
                │     └─ Strapi: GET /api/orders?filters[clerkUserId][$eq]=…&sort=createdAt:desc&populate=*
                │
                ▼
            <OrderHistoryPage orders={...} />
```

### 4.4 API / Data Contracts

#### `POST /api/orders/create` — full contract

**Headers (request):**
```
Content-Type: application/json
Cookie: __session=<clerk session cookie>   // required
```

**Request body:**
```json
{
  "items": [
    { "productId": "abc123", "quantity": 2 },
    { "productId": "def456", "quantity": 1 }
  ],
  "address": {
    "fullName": "Jane Doe",
    "street": "221B Baker Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "zipCode": "400001",
    "country": "India"
  },
  "email": "jane@example.com"
}
```

**Responses:**

| Status | Body | Meaning |
|--------|------|---------|
| 200 | `{ "order_id": "order_Nxq8m7K3", "amount": 499800, "currency": "INR", "orderDocumentId": "ord_abc123" }` | Success; open Razorpay modal |
| 400 | `{ "error": "Invalid input", "details": "<zod issues>" }` | Validation failed |
| 401 | `{ "error": "Unauthorized" }` | No Clerk session |
| 500 | `{ "error": "Failed to create order", "details": "…" }` | Strapi or Razorpay outage |

#### `POST /api/webhooks/razorpay` — full contract

**Headers (Razorpay → us):**
```
Content-Type: application/json
x-razorpay-signature: <HMAC-SHA256 of RAW body>
```

**Body:** Razorpay event envelope (we care about `payment.captured` and `payment.failed`):

```json
{
  "event": "payment.captured",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_Nxq8m7K3",
        "order_id": "order_Nxq8m7K3",
        "amount": 499800,
        "currency": "INR",
        "status": "captured"
      }
    }
  }
}
```

**Responses:**

| Status | Meaning |
|--------|---------|
| 200 | Event handled (or no-op for already-handled orders, for idempotency) |
| 400 | Invalid signature or unparsable body |
| 500 | Persistence failed — Razorpay will retry |

### 4.5 Data Design

#### Strapi `Order` content type (NEW)

See [§4.2.13](#422-13-strapi-order-content-type) for the full `schema.json` and the rationale for `draftAndPublish: false`, the `enumeration` field shape, the `json` storage for `items`/`address`, and the dual API-token model (`STRAPI_API_TOKEN` read / `STRAPI_API_TOKEN_WRITE` write).

**Key restatements:**
- `Order.draftAndPublish = false` — non-negotiable; orders are facts not editorial.
- `items` and `address` are inline JSON fields (no relations, no populate needed).
- `razorpayOrderId` is `unique: true` to back the webhook idempotency contract in [§4.4](#44-api--data-contracts).
- The seeded Phase 1 catalog and the new `Order` content type live in the same Strapi v5 project. No migration is required.

#### Cart shape (browser `localStorage`)

```ts
type CartState = {
  items: CartItem[];   // unique by productId
  updatedAt: number;   // epoch ms
};
// localStorage key: "aurastore:cart:v1"
```

`v1` suffix allows future schema migrations (`v2`).

#### Razorpay webhook idempotency

Stored idempotency key: `Order.razorpayOrderId` (unique enough in practice; combined with `status`, prevents double-update).

---

## 5. Error Handling Strategy

| Layer | Error | Handling |
|-------|-------|----------|
| `cartStore` | localStorage full / disabled | Catch `setItem` throw; fall back to in-memory state; toast "Cart unavailable in this browser" |
| `useAddToCart` | qty < 1 | Ignore; toast "Invalid quantity" |
| `AddressForm` (client) | Zod validation | Inline errors; submit disabled until valid |
| `/api/orders/create` | Unauthenticated | 401 |
| `/api/orders/create` | Bad input | 400 + zod details |
| `/api/orders/create` | Unknown productId | 400 + "Unknown product: <id>" |
| `/api/orders/create` | Razorpay 4xx/5xx | 500 + log full error server-side; client shows toast "Payment service unavailable, try again" |
| `/api/orders/create` | Strapi 4xx/5xx | 500 + log |
| `/api/webhooks/razorpay` | Invalid signature | 400 (no log of secret) |
| `/api/webhooks/razorpay` | Unknown `razorpayOrderId` | 200 (log warning — Razorpay may have sent a stale event) |
| `/api/webhooks/razorpay` | Persistence error | 500 (Razorpay retries) |
| Razorpay modal | User dismisses | toast.error("Payment cancelled"); cart untouched |
| Razorpay modal | Test failure card | toast.error("Payment failed"); user can retry |
| `/checkout/confirmation` | Order not found | `notFound()` |
| `/checkout/confirmation` | Order pending | "Payment processing…" message; do NOT mark as failed |

**Logging (observability):**
- All `/api/orders/create` errors logged with `userId` + sanitized body (no card data — we never have it).
- All webhook errors logged with `event` + `razorpayOrderId` (no signature).
- No PII beyond `clerkUserId` and `email` in logs.

---

## 6. Security Considerations

| Area | Measure |
|------|---------|
| **Server-only secrets** | `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `STRAPI_API_TOKEN`, `STRAPI_API_TOKEN_WRITE`, `CLERK_SECRET_KEY` never `NEXT_PUBLIC_*`. |
| **Webhook auth** | HMAC-SHA256 over **raw** body, constant-time comparison. 400 on mismatch. |
| **Amount trust** | Server recomputes `Σ(price × qty)` from Strapi `price`. Client `amount` ignored entirely. |
| **Auth gating** | `proxy.ts` matcher includes `/checkout`, `/checkout/confirmation`, `/orders`, `/orders/[documentId]`. `auth.protect()` is also called in those Server Components (defense-in-depth, CVE-2025-29927). |
| **Order ownership** | All Strapi queries filter by `clerkUserId` from the session. A user cannot read another user's order even with a guessed `documentId` — `getOrderByDocumentId` checks `order.clerkUserId === userId`. |
| **CSRF** | `POST /api/orders/create` requires a Clerk session cookie (SameSite=Lax). Razorpay webhook has its own HMAC. No custom CSRF tokens needed for Phase 2. |
| **XSS** | Address fields rendered as plain text on the confirmation page (React default escaping). Order items rendered as text. No `dangerouslySetInnerHTML`. |
| **Open redirect** | The "redirect_url" param on `/sign-in?redirect_url=/checkout` is constrained to known internal paths (Clerk handles this; we only redirect to `/checkout` ourselves). |
| **Input validation** | All API inputs validated with Zod on the server. |
| **Logging hygiene** | No full payment payloads, no webhook secrets in logs. |
| **CORS** | No new Strapi origin needed (Next.js server-side calls only). Phase 1 CORS config unchanged. |

**Not in Phase 2 (Phase 3):** rate limiting on `/api/orders/create`, security headers via `proxy.ts`, bot protection, audit log retention.

---

## 7. Performance Considerations

| Concern | Mitigation |
|---------|------------|
| Cart drawer open latency | Drawer is pre-mounted (not lazy) — opening is instant; the slide animation is Phase 3 (instant open in Phase 2). |
| `/checkout` initial paint | Server Component renders empty cart immediately; client hydrates cart from `localStorage` (no network round trip). |
| Razorpay Checkout.js load | `<Script strategy="lazyOnload">` — loaded after main bundle, doesn't block first paint. |
| Strapi product re-fetch on checkout | `/api/orders/create` re-fetches each product's `price` to verify amounts; queries are cached by Strapi; bounded to ≤ ~10 items per order. |
| Order history query | Indexed `clerkUserId` + `sort=createdAt:desc`; pagination not required for Phase 2 (single user's history). |
| Cart persistence write | `cartStore.add/setQuantity/remove` writes to `localStorage` synchronously but **only after** the in-memory state mutation; listeners see the new state immediately (optimistic). |
| Bundle size | New client deps: Sonner (~3 KB gz), `react-hook-form` + `@hookform/resolvers` (~10 KB gz), `zod` (already in tree from Phase 1? if not: ~12 KB gz). Phase 2 adds ~25 KB gz to the **checkout** chunk only; not loaded on the product pages. |
| Code splitting | `/checkout`, `/checkout/confirmation`, `/orders`, `/orders/[documentId]`, `CartDrawer` mounted via `next/dynamic({ ssr: false })` for the Sheet. |

**Performance budget (Phase 2):**
- Initial JS on `/products`: unchanged from Phase 1 (≤ 150 KB gz, NFR7).
- Initial JS on `/checkout`: ≤ 175 KB gz (cart + form + sonner).
- TTFB on `/api/orders/create`: ≤ 400 ms p95 (Strapi + Razorpay sequential calls; we parallelize the product re-fetch with the Strapi order create).

---

## 8. Observability Plan

**Logs (structured, server-only):**
- `INFO` on successful order create: `{ userId, itemsCount, total, razorpayOrderId }`.
- `WARN` on Razorpay errors: `{ userId, step: "razorpay.orders.create", code, description }`.
- `WARN` on unknown `razorpayOrderId` in webhook.
- `ERROR` on webhook persistence failure (Razorpay will retry).
- `ERROR` on signature mismatch (counter for brute-force attempts).

**Metrics (Phase 2 baseline):**
- `orders.create.count` — successful creates.
- `orders.create.duration_ms` — p50/p95.
- `webhook.received.count{event}` — per event.
- `webhook.signature_invalid.count` — counter.

**No third-party APM in Phase 2.** Console + Vercel logs are sufficient. Phase 3 may add Sentry/PostHog.

---

## 9. Testing Strategy

See [Testing LLD Phase 2](./AuraStore_Testing_LLD_Phase2.md) for full spec. Summary:

- **Unit (Vitest):** `cartStore` (add/remove/setQuantity/persistence), `AddressForm` (zod resolver), Razorpay signature verification helper, total computation helper.
- **Integration (Vitest + MSW):** `POST /api/orders/create` (happy path, invalid body, unauthenticated, Strapi error, Razorpay error), `POST /api/webhooks/razorpay` (happy path, invalid signature, unknown order, idempotent retry).
- **Component (Vitest + RTL + MSW):** `CartDrawer`, `CartItem`, `CartSummary`, `CartIconButton`, `AddressForm`, `OrderSummary`, `RazorpayCheckout`.
- **E2E (Playwright):** cart drawer open/close, add → increment → remove, cart persists across reload, `/checkout` redirects when signed out, end-to-end checkout with test card, order confirmation page renders, `/orders` shows the new order, webhook updates order status.

**Total target:** 51 tests (22 unit + 19 integration + 10 e2e) — matches [Testing HLD §9.6 subtotals](../AuraStore_Testing_HLD.md).

---

## 10. Deployment & Rollout

**Local:**
1. `cd backend && npm run develop` (Strapi).
2. `npm run dev` (Next.js).
3. (Optional) `ngrok http 3000` → update Razorpay webhook URL if changed.

**Staging (Phase 3 introduces):**
- Vercel preview deploy for the Next.js frontend.
- Strapi deployed to Railway/Render with managed PostgreSQL.
- Razorpay webhook URL = `<staging>/api/webhooks/razorpay`.

**Phase 2 ships to local + E2E only.** No production deploy in Phase 2.

**Env vars required (Phase 2 delta):** see [Prerequisites §5](./AuraStore_Prerequisites_Phase2.md#5-secrets-handling--security-human).

---

## 11. Open Questions & Risks

| # | Question / Risk | Owner | Mitigation |
|---|-----------------|-------|------------|
| Q1 | **Webhook delivery in local dev.** Without a tunnel, the webhook never arrives locally. | Dev | Tunnel via ngrok/cloudflared for full E2E. Integration tests verify HMAC + state machine with synthetic payloads. |
| Q2 | **Test card vs real failure card.** E2E only covers the success path with `4111 1111 1111 1111`. | Dev | Add a separate Playwright spec using `4000 0000 0000 0002` and assert the failure toast + redirect back to `/checkout`. |
| Q3 | **Order confirmation race.** The user may arrive at `/checkout/confirmation` before the webhook fires. | Dev | Confirmation page renders "Payment processing…" when `status === "pending"`; auto-refreshes every 3 s for up to 30 s, then shows a manual "Refresh" button. |
| Q4 | **Cart-merge on sign-in.** Anonymous cart vs authenticated cart — Phase 2 keeps a single browser cart. | Dev | Document behavior in `/checkout` empty state and tooltip on cart icon ("Cart is saved in this browser"). |
| Q5 | **`STRAPI_API_TOKEN` scope.** Phase 1 token is read-only on `Product`+`Category`. Phase 2 needs read+write+update on `Order`. | Dev | **Locked (see §4.2.13):** keep Phase 1 `STRAPI_API_TOKEN` as-is (read-only) and create a **new** API token `Order writer` with `Write`+`Update` scopes on `Order` only → store as `STRAPI_API_TOKEN_WRITE`. Strapi v5 cannot mutate the scopes of an existing token via the Admin API; a new token is the only path. |
| Q6 | **Razorpay Checkout.js in iframe sandboxes.** Should be fine on standard e-commerce sites; we do not embed AuraStore in an iframe. | Dev | None — but note for future embed use cases. |
| Q7 | **Phase 3 will add `framer-motion`** to animate the drawer. Phase 2 must NOT introduce a competing animation lib. | Dev | Strict dependency lock; Phase 2 ships a non-animated drawer. |
| Q8 | **Zod v3 vs v4.** Strapi already pulls zod v3 transitively; we pin `zod@^3` for the API route. | Dev | Lockfile check in Stage 1. |

---

*This LLD defines only the implementation design (HOW) for Phase 2. Operational rollout and human checklist live in [Prerequisites](./AuraStore_Prerequisites_Phase2.md); test specifications live in [Testing LLD Phase 2](./AuraStore_Testing_LLD_Phase2.md); the staged, execution-ready task breakdown lives in [Phase 2 Implementation Plan](./AuraStore_Phase2_Implementation_Plan.md).*
*Last updated: July 21, 2026*
