# AuraStore — Wireframes (Phase 1)

> **Project:** AuraStore: The Modern Consumer App
> **Version:** 1.0
> **Date:** July 18, 2026
> **Document Type:** Visual specification — ASCII wireframes
> **Audience:** Designers, developers, QA
> **Scope:** All Phase 1 user-facing surfaces

This document captures the **complete visual structure** of the AuraStore storefront as it is implemented today (Phase 1, July 2026). Every wireframe is rendered against the actual component hierarchy under `src/` so design and engineering stay in lockstep. Mobile and desktop variants are shown side-by-side where they differ. Loading, empty, and error states are documented for data-driven surfaces.

### Conventions

```
┌─────────────────────────────────────────────────┐
│ Header / chrome                                  │  ← Browser frame / persistent chrome
├─────────────────────────────────────────────────┤
│ Section title                                    │  ← Page section
│ ┌──────────┐ ┌──────────┐ ┌──────────┐          │  ← Grid cards
│ │ Card A   │ │ Card B   │ │ Card C   │          │
│ └──────────┘ └──────────┘ └──────────┘          │
└─────────────────────────────────────────────────┘
Footer / persistent
```

| Symbol | Meaning |
|--------|---------|
| `[]`  | Interactive element (link, button) |
| `()`  | Non-interactive label / text |
| `▼`   | Dropdown / mobile menu trigger |
| `▶`   | Active / selected state |
| `…`   | Truncated text / carousel |
| `░`   | Image / media placeholder |
| `▓`   | Skeleton / loading block |
| `!`   | Error / warning indicator |

---

## 1. Information Architecture

```
AuraStore (/)
│
├── /                            ── Landing (hero + CTA)
├── /products                    ── All products (grid + category filter)
│   └── /products/[slug]         ── Product detail
├── /category/[slug]             ── Filtered product grid
├── /sign-in   /sign-up          ── Clerk auth (catch-all routes)
│
├── /orders   (protected)        ── Placeholder → redirects to /sign-in
├── /checkout (protected)        ── Placeholder → redirects to /sign-in
└── /account (protected)         ── Placeholder → redirects to /sign-in
```

Persistent chrome (every page): **Header → Page → Footer**.

---

## 2. Persistent Chrome

### 2.1 Header — Desktop (≥ 768 px)

```
┌──────────────────────────────────────────────────────────────────────┐
│ AuraStore        ( Products   About   Contact )   ▢ cart-slot  [Sign in] [Sign up] │
└──────────────────────────────────────────────────────────────────────┘
  brand            inline nav links (hidden < md)         auth section
```

Source: `src/components/layout/header.tsx`, `nav.tsx`, `auth-section.tsx`.

### 2.2 Header — Mobile (< 768 px)

```
┌────────────────────────────────────────┐
│ AuraStore                  [Menu] [Sign in] │
└────────────────────────────────────────┘
                            ↓ tap [Menu]
┌────────────────────────────────────────┐
│ ──────────────────────────────────────  │ ← sliding panel (absolute, full-width)
│  Products                                │
│  About                                   │
│  Contact                                 │
└────────────────────────────────────────┘
```

`AuthSection` stays visible on mobile (Sign in button shrinks to fit); only the inline nav links collapse behind the hamburger.

### 2.3 Auth state — Signed-in

```
┌──────────────────────────────────────────────────────────────────────┐
│ AuraStore        ( Products   About   Contact )   ▢ cart-slot  (•)  │
└──────────────────────────────────────────────────────────────────────┘
                                                            user avatar
                                                       (Clerk UserButton)
```

### 2.4 Footer

```
┌──────────────────────────────────────────────────────────────────────┐
│ AuraStore                          Products   About   Contact        │
└──────────────────────────────────────────────────────────────────────┘
  brand (bold)                          inline nav (smaller, gray)
```

Source: `src/components/layout/footer.tsx`.

---

## 3. Landing Page — `/`

### Desktop

```
┌──────────────────────────────────────────────────────────────────────┐
│ [Header — see §2.1]                                                   │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│                                                                       │
│                                                                       │
│                    Shop curated essentials                            │
│                    ────────────────────────                           │
│                                                                       │
│                                                                       │
│                      [ Browse products ]                              │
│                                                                       │
│                                                                       │
│                                                                       │
├──────────────────────────────────────────────────────────────────────┤
│ [Footer — see §2.4]                                                   │
└──────────────────────────────────────────────────────────────────────┘
        ↑ centered, max-width 3xl, vertical padding y-24
```

| Region | Element | Source |
|--------|---------|--------|
| H1 | "Shop curated essentials" | `src/app/page.tsx:7` |
| CTA | `[ Browse products ]` → `/products` | `data-testid="hero-cta"` |

### Mobile

```
┌──────────────────────┐
│ [Header — §2.2]      │
├──────────────────────┤
│                      │
│                      │
│  Shop curated        │
│  essentials          │  ← h1 scales from 4xl to 5xl on sm+
│                      │
│                      │
│  [ Browse products ] │
│                      │
│                      │
├──────────────────────┤
│ [Footer — §2.4]      │
└──────────────────────┘
```

Verified by `e2e/homepage.spec.ts` (hero CTA → listing).

---

## 4. Products Listing — `/products`

### Desktop — Default (no filter)

```
┌──────────────────────────────────────────────────────────────────────┐
│ [Header]                                                              │
├──────────────────────────────────────────────────────────────────────┤
│  Products                                                             │
│                                                                       │
│  [▶ All] [ Electronics ] [ Clothing ] [ Home ] [ Books ] [ Outdoor ]  │ ← CategoryFilter
│                                                                       │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐         │
│  │   ░░░░     │ │   ░░░░     │ │   ░░░░     │ │   ░░░░     │         │
│  │   ░░░░     │ │   ░░░░     │ │   ░░░░     │ │   ░░░░     │         │
│  │   ░░░░     │ │   ░░░░     │ │   ░░░░     │ │   ░░░░     │         │
│  ├────────────┤ ├────────────┤ ├────────────┤ ├────────────┤         │
│  │ [badge]    │ │ [badge]    │ │ [badge]    │ │ [badge]    │         │ ← CategoryBadge
│  │ Name       │ │ Name       │ │ Name       │ │ Name       │         │
│  │ ₹1,499     │ │ ₹2,499 ₹3,│ │ ₹799       │ │ ₹3,999     │         │ ← PriceDisplay
│  │            │ │    999     │ │            │ │            │         │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘         │
│                                                                       │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐         │
│  │   ...      │ │   ...      │ │   ...      │ │   ...      │         │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘         │
│                                                                       │
├──────────────────────────────────────────────────────────────────────┤
│ [Footer]                                                              │
└──────────────────────────────────────────────────────────────────────┘
```

**Grid:** Tailwind defaults — 1 col mobile, 2 col sm, 3 col lg, 4 col xl. Source: `src/components/product/product-grid.tsx` → `ProductCard`.

**Strikethrough price** (e.g. `wireless-headphones`): `comparePrice > price` shows `₹3,999 ~~₹2,499~~` (line-through on the higher value).

### Desktop — Category filter active (e.g. `?category=electronics`)

```
┌──────────────────────────────────────────────────────────────────────┐
│ [Header]                                                              │
├──────────────────────────────────────────────────────────────────────┤
│  Products                                                             │
│                                                                       │
│  [ All ] [▶ Electronics ] [ Clothing ] [ Home ] [ Books ] [ Outdoor ]│
│            ▲─── black fill / white text                              │
│                                                                       │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐                         │
│  │   ░░░░     │ │   ░░░░     │ │   ░░░░     │                         │
│  │ Headphones │ │ Speaker    │ │ Charger    │  ← only Electronics    │
│  └────────────┘ └────────────┘ └────────────┘                         │
│                                                                       │
├──────────────────────────────────────────────────────────────────────┤
│ [Footer]                                                              │
└──────────────────────────────────────────────────────────────────────┘
```

URL changes to `/products?category=electronics` via `router.replace(…, { scroll: false })`.

### Mobile

```
┌──────────────────────┐
│ [Header]             │
├──────────────────────┤
│ Products             │
│                      │
│ [▶A][E][C][H][B][O] │ ← horizontal scroll / wrap
│                      │
│ ┌──────────────────┐ │
│ │   ░░░░░░░        │ │
│ │   ░░░░░░░        │ │
│ ├──────────────────┤ │
│ │ [badge]  Name    │ │
│ │ ₹1,499           │ │
│ └──────────────────┘ │
│ ┌──────────────────┐ │
│ │       ...        │ │
│ └──────────────────┘ │
├──────────────────────┤
│ [Footer]             │
└──────────────────────┘
```

### State: Loading (Suspense fallback)

```
┌──────────────────────────────────────────────────────────────────────┐
│ [Header]                                                              │
├──────────────────────────────────────────────────────────────────────┤
│  Products                                                             │
│                                                                       │
│  [ All ] [ Electronics ] [ Clothing ] [ Home ] [ Books ] [ Outdoor ]  │  ← CategoryFilter renders immediately
│                                                                       │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐         │
│  │ ▓▓▓▓▓▓▓▓▓▓▓ │ │ ▓▓▓▓▓▓▓▓▓▓▓ │ │ ▓▓▓▓▓▓▓▓▓▓▓ │ │ ▓▓▓▓▓▓▓▓▓▓▓ │         │
│  │ ▓▓▓▓▓▓▓▓▓▓▓ │ │ ▓▓▓▓▓▓▓▓▓▓▓ │ │ ▓▓▓▓▓▓▓▓▓▓▓ │ │ ▓▓▓▓▓▓▓▓▓▓▓ │         │
│  │ ▓▓▓▓▓▓▓▓▓▓▓ │ │ ▓▓▓▓▓▓▓▓▓▓▓ │ │ ▓▓▓▓▓▓▓▓▓▓▓ │ │ ▓▓▓▓▓▓▓▓▓▓▓ │         │ ← GridSkeleton
│  │ ▓▓▓▓        │ │ ▓▓▓▓        │ │ ▓▓▓▓        │ │ ▓▓▓▓        │         │
│  │ ▓▓▓▓▓▓      │ │ ▓▓▓▓▓▓      │ │ ▓▓▓▓▓▓      │ │ ▓▓▓▓▓▓      │         │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘         │
│                                                                       │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐         │
│  │ ▓▓▓▓▓▓▓▓▓▓▓ │ │ ▓▓▓▓▓▓▓▓▓▓▓ │ │ ▓▓▓▓▓▓▓▓▓▓▓ │ │ ▓▓▓▓▓▓▓▓▓▓▓ │         │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘         │
└──────────────────────────────────────────────────────────────────────┘
```

Source: `GridSkeleton` from `src/components/product/product-grid.tsx`. 8 skeleton cards with `animate-pulse`.

### State: Empty

```
┌──────────────────────────────────────────────────────────────────────┐
│ [Header]                                                              │
├──────────────────────────────────────────────────────────────────────┤
│  Products                                                             │
│                                                                       │
│  [ All ] [▶ Clothing ]                                                 │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │                                                               │    │
│  │                         (empty box icon)                       │    │
│  │                                                               │    │
│  │                   No products in this category                │    │
│  │                                                               │    │
│  │                  [ Browse all products ]                       │    │
│  │                                                               │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                       │
├──────────────────────────────────────────────────────────────────────┤
│ [Footer]                                                              │
└──────────────────────────────────────────────────────────────────────┘
```

Source: `EmptyState` from `src/components/common/empty-state.tsx`. CTA is optional.

### State: Error (Strapi down / 500)

```
┌──────────────────────────────────────────────────────────────────────┐
│ [Header]                                                              │
├──────────────────────────────────────────────────────────────────────┤
│  Products                                                             │
│                                                                       │
│  [ All ] [ Electronics ] [ Clothing ] …                                │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  !  Couldn't load products. Please try again.                │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                       │
├──────────────────────────────────────────────────────────────────────┤
│ [Footer]                                                              │
└──────────────────────────────────────────────────────────────────────┘
```

Bubbled up to `src/app/error.tsx` (Next 16 error boundary).

---

## 5. Category Page — `/category/[slug]`

Identical structure to §4 with two differences:

1. **H1 = category name** (e.g. `Electronics`) instead of generic "Products".
2. **CategoryFilter active** is pre-set to the slug (e.g. `electronics`).

```
┌──────────────────────────────────────────────────────────────────────┐
│ [Header]                                                              │
├──────────────────────────────────────────────────────────────────────┤
│  Electronics                                                          │
│                                                                       │
│  [ All ] [▶ Electronics ] [ Clothing ] [ Home ] [ Books ] [ Outdoor ]  │
│                                                                       │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐         │
│  │   ░░░░     │ │   ░░░░     │ │   ░░░░     │ │   ░░░░     │         │
│  ├────────────┤ ├────────────┤ ├────────────┤ ├────────────┤         │
│  │ Headphones │ │ Speaker    │ │ Charger    │ │ Cable      │         │
│  │ ₹2,499 ₹3,│ │ ₹1,999     │ │ ₹499       │ │ ₹199       │         │
│  │    999     │ │            │ │            │ │            │         │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘         │
├──────────────────────────────────────────────────────────────────────┤
│ [Footer]                                                              │
└──────────────────────────────────────────────────────────────────────┘
```

### State: Category slug not found

```
┌──────────────────────────────────────────────────────────────────────┐
│ [Header]                                                              │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│                         404 — Page not found                          │
│                                                                       │
│                  We couldn't find that category.                      │
│                                                                       │
│                       [ Back to products ]                            │
│                                                                       │
├──────────────────────────────────────────────────────────────────────┤
│ [Footer]                                                              │
└──────────────────────────────────────────────────────────────────────┘
```

Source: `src/app/not-found.tsx` + `notFound()` call in `src/app/category/[slug]/page.tsx:35`.

---

## 6. Product Detail — `/products/[slug]`

### Desktop

```
┌──────────────────────────────────────────────────────────────────────┐
│ [Header]                                                              │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────────────┐    ( Electronics )  ← CategoryBadge (link) │
│  │                         │                                         │
│  │                         │    Wireless headphones                  │
│  │                         │    ──────────────────                   │
│  │       ░░░░░░░░░░        │                                         │
│  │       ░░░░░░░░░░        │    ₹2,499  ~~₹3,999~~                  │ ← PriceDisplay
│  │       ░░░░░░░░░░        │                                         │
│  │                         │    Active noise cancellation, 40-hour   │
│  │                         │    battery, USB-C fast charge. Premium │
│  │                         │    memory-foam earcups for all-day      │
│  │                         │    comfort.                             │
│  └─────────────────────────┘                                         │
│                                  ┌────────────────────┐              │
│  ┌─────────────────────────┐    │  ★ Featured         │              │ ← featured badge
│  │       ░░░░░░░░░░        │    └────────────────────┘              │
│  └─────────────────────────┘                                         │
│                                                                       │
│   (image gallery — stacks vertically at 600×600)                      │
│                                                                       │
├──────────────────────────────────────────────────────────────────────┤
│ [Footer]                                                              │
└──────────────────────────────────────────────────────────────────────┘
```

Source: `src/components/product/product-detail.tsx`. 2-column grid (`md:grid-cols-2`), images stack vertically on the left, info on the right. **No "Add to cart"** in Phase 1 (cart is out of scope).

### Mobile

```
┌──────────────────────┐
│ [Header]             │
├──────────────────────┤
│ ( Electronics )      │
│                      │
│ Wireless headphones  │
│ ₹2,499  ~~₹3,999~~   │
│                      │
│ ┌──────────────────┐ │
│ │   ░░░░░░░░░░     │ │ ← images stack first
│ └──────────────────┘ │
│ ┌──────────────────┐ │
│ │   ░░░░░░░░░░     │ │
│ └──────────────────┘ │
│                      │
│ Active noise         │
│ cancellation,        │
│ 40-hour battery,     │
│ USB-C fast charge.   │
│ …                    │
│                      │
│ ★ Featured           │
├──────────────────────┤
│ [Footer]             │
└──────────────────────┘
```

### State: Slug not found

Same 404 surface as §5 — `notFound()` triggers `src/app/not-found.tsx`.

### State: Image missing fallback

In the gallery, a missing image renders:

```
┌─────────────────────────┐
│         (gray)           │ ← `bg-gray-100`
│       No image           │
└─────────────────────────┘
```

In a card, same fallback. Source: `src/components/product/product-card.tsx:24-26`.

---

## 7. Sign-In — `/sign-in`

Catch-all Clerk route: `src/app/sign-in/[[...sign-in]]/page.tsx`. Mounts Clerk's `<SignIn />` component, which renders Clerk's hosted UI inside the AuraStore shell.

### Desktop

```
┌──────────────────────────────────────────────────────────────────────┐
│ [Header — auth section shows Sign up only when signed out]            │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│                                                                       │
│                    ┌──────────────────────────┐                       │
│                    │                          │                       │
│                    │      ┌──────────┐        │                       │
│                    │      │  LOGO    │        │                       │
│                    │      └──────────┘        │                       │
│                    │                          │                       │
│                    │   Sign in to AuraStore   │                       │
│                    │   ───────────────────   │                       │
│                    │                          │                       │
│                    │   [ Email address     ]  │                       │
│                    │                          │                       │
│                    │   [ Password          ]  │                       │
│                    │                          │                       │
│                    │   (   Continue        )   │                       │
│                    │                          │                       │
│                    │   ──── or ────           │                       │
│                    │                          │                       │
│                    │   ( Continue with Google )                       │
│                    │                          │                       │
│                    │   Don't have an account? │                       │
│                    │   [ Sign up ]            │                       │
│                    │                          │                       │
│                    └──────────────────────────┘                       │
│                                                                       │
│                                                                       │
├──────────────────────────────────────────────────────────────────────┤
│ [Footer]                                                              │
└──────────────────────────────────────────────────────────────────────┘
```

OTP (when triggered): the same card shows a 6-digit code field. With the `+clerk_test` test user the fixed OTP `424242` is accepted.

---

## 8. Sign-Up — `/sign-up`

Identical layout to §7 with copy swapped:

```
┌────────────────────────────────────────────┐
│            Create your account             │
│            ─────────────────               │
│                                            │
│   [ Email address                       ]  │
│                                            │
│   [ Password                            ]  │
│                                            │
│   (   Continue   )                          │
│                                            │
│   ──── or ────                             │
│                                            │
│   ( Continue with Google )                 │
│                                            │
│   Already have an account?                 │
│   [ Sign in ]                              │
└────────────────────────────────────────────┘
```

Source: `src/app/sign-up/[[...sign-up]]/page.tsx`.

---

## 9. Protected Placeholders — `/orders`, `/checkout`, `/account`

These routes exist only to satisfy the `clerkMiddleware` `createRouteMatcher` definition. There is **no rendered content** — the middleware redirects unauthenticated visitors to `/sign-in`.

### Unauthenticated → redirect

```
┌──────────────────────┐
│ [Header]             │
├──────────────────────┤
│                      │
│  (redirected →       │
│      /sign-in)       │
│                      │
└──────────────────────┘
```

Status: **302** to `/sign-in`. Verified by `e2e/auth-guard.spec.ts`.

### Authenticated → placeholder body

```
┌──────────────────────────────────────────────────────────────────────┐
│ [Header — auth section shows UserButton]                              │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│   ( Orders   )   ← placeholder body (Phase 1 = simple text or empty)  │
│                                                                       │
│                                                                       │
│   "Your orders will appear here."                                     │
│                                                                       │
├──────────────────────────────────────────────────────────────────────┤
│ [Footer]                                                              │
└──────────────────────────────────────────────────────────────────────┘
```

(`/checkout` and `/account` use the same placeholder pattern.)

---

## 10. 404 — Not Found

```
┌──────────────────────────────────────────────────────────────────────┐
│ [Header]                                                              │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│                                                                       │
│                         404                                           │
│                         ────                                          │
│                                                                       │
│                  We couldn't find that page.                          │
│                                                                       │
│                  [ Back to home ]                                     │
│                                                                       │
│                                                                       │
├──────────────────────────────────────────────────────────────────────┤
│ [Footer]                                                              │
└──────────────────────────────────────────────────────────────────────┘
```

Source: `src/app/not-found.tsx`. Used by `notFound()` calls in `/products/[slug]` and `/category/[slug]` slug mismatches.

---

## 11. Error Boundary — `src/app/error.tsx`

```
┌──────────────────────────────────────────────────────────────────────┐
│ [Header]                                                              │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│                  !  Something went wrong                              │
│                     ────────────────                                  │
│                                                                       │
│              We hit an unexpected error.                              │
│              Please try again.                                        │
│                                                                       │
│                  [ Try again ]                                        │
│                                                                       │
├──────────────────────────────────────────────────────────────────────┤
│ [Footer]                                                              │
└──────────────────────────────────────────────────────────────────────┘
```

`reset()` prop from Next.js restarts the segment boundary.

---

## 12. Component Detail Specs

### 12.1 ProductCard — `src/components/product/product-card.tsx`

```
┌────────────────────────┐
│                        │
│       ░░░░░░░░░        │  aspect-square, object-cover
│       ░░░░░░░░░        │  hover:scale-105 transition
│       ░░░░░░░░░        │
│                        │
├────────────────────────┤
│ ( Electronics )        │  CategoryBadge — pill, gray-100 bg
│ Wireless headphones    │  h3, font-medium
│ ₹2,499  ~~₹3,999~~     │  PriceDisplay
└────────────────────────┘
   ↑ whole card is a <Link> to /products/[slug]
```

| Prop | Source |
|------|--------|
| `product: StrapiProduct` | Strapi v5 flattened response |
| Missing image | Gray fallback "No image" |
| Strikethrough | Only when `comparePrice > price` |

### 12.2 ProductGrid — `src/components/product/product-grid.tsx`

- Responsive grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`.
- Empty → renders `<EmptyState />`.
- `isLoading` → renders `<GridSkeleton />` (8 cards with `animate-pulse`).

### 12.3 PriceDisplay — `src/components/product/price-display.tsx`

```
Without comparePrice:           With comparePrice (comparePrice > price):
₹2,499                         ₹2,499  ~~₹3,999~~
                                  ↑ price    ↑ strikethrough, gray-400
```

`formatINR()` in `src/lib/utils.ts` uses Indian grouping: `249900 → ₹2,49,900`.

### 12.4 CategoryBadge — `src/components/product/category-badge.tsx`

```
( Electronics )    ← rounded-full bg-gray-100 px-3 py-1 text-sm
```

Graceful fallback when category missing (renders nothing).

### 12.5 CategoryFilter — `src/components/product/category-filter.tsx`

```
[▶ All] [ Electronics ] [▶ Clothing ] [ Home ] …
   ▲           ▲
 active      inactive
 black bg    gray border
 white text  gray-700 text
```

- Wraps on overflow (`flex flex-wrap gap-2`).
- Updates URL via `router.replace(?category=…, { scroll: false })`.
- `aria-current="page"` on the active button.

### 12.6 AuthSection — `src/components/layout/auth-section.tsx`

```
Signed out:   [ Sign in ]  [ Sign up ]
              ▲ black bg    ▲ bordered
              white text    black text

Signed in:    ( UserButton )    ← Clerk avatar dropdown
```

### 12.7 EmptyState — `src/components/common/empty-state.tsx`

```
┌──────────────────────────────────┐
│                                  │
│         ( empty icon )           │
│                                  │
│      No products here yet        │   ← title (required)
│                                  │
│      Check back soon             │   ← description (optional)
│                                  │
│      [ Browse all ]              │   ← CTA (optional)
│                                  │
└──────────────────────────────────┘
```

### 12.8 Skeleton — `src/components/common/skeleton.tsx`

```
┌──────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓ │  ← animate-pulse + rounded bg-gray-200
│ ▓▓▓▓▓▓▓▓▓▓▓▓ │
│ ▓▓▓▓▓▓▓▓▓▓▓▓ │
└──────────────┘
```

`GridSkeleton` renders 8 cards × 2 rows with the above block at varying widths.

---

## 13. Responsive Breakpoint Matrix

| Surface | < 640 px (mobile) | 640–767 (sm) | 768–1023 (md) | 1024–1279 (lg) | ≥ 1280 (xl) |
|---------|-------------------|--------------|---------------|----------------|-------------|
| Nav | Hamburger | Hamburger | Inline links | Inline links | Inline links |
| Product grid | 1 col | 2 col | 2 col | 3 col | 4 col |
| Product detail | Stacked | Stacked | 2 col | 2 col | 2 col |
| Auth buttons | Both visible | Both visible | Both visible | Both visible | Both visible |
| CategoryFilter | Wrap | Wrap | Wrap | Wrap | Wrap |

Verified by `e2e/responsive.spec.ts` (mobile viewport: hamburger + stacked detail; desktop viewport: inline nav + side-by-side detail).

---

## 14. Color & Type Tokens (Phase 1 baseline)

| Token | Value | Usage |
|-------|-------|-------|
| `bg-black` | `#000` | Primary CTA, active filter, brand emphasis |
| `text-white` | `#fff` | On-black CTA labels |
| `text-gray-700` | `#374151` | Body text, secondary nav |
| `text-gray-600` | `#4b5563` | Footer links, description prose |
| `bg-gray-100` | `#f3f4f6` | Image placeholder, category badge |
| `bg-gray-200` | `#e5e7eb` | Skeleton blocks |
| `border-gray-300` | `#d1d5db` | Inactive filter, button borders |
| `bg-yellow-100` / `text-yellow-800` | — | "Featured" badge |
| Border radius | `rounded-md` (UI) / `rounded-lg` (cards, images) / `rounded-full` (pills) |
| Font | Geist (auto-loaded by `next/font`) | All surfaces |

Tailwind v4 CSS-first — tokens live in `src/app/globals.css` (`@theme { … }`), no `tailwind.config.js`.

---

## 15. Wireframe Coverage Checklist

| Surface | Wireframe | Component source |
|---------|-----------|------------------|
| Landing page | §3 | `src/app/page.tsx` |
| Header (desktop + mobile) | §2.1, §2.2 | `layout/header.tsx`, `nav.tsx`, `auth-section.tsx` |
| Footer | §2.4 | `layout/footer.tsx` |
| Products listing (default / filtered / loading / empty / error) | §4 | `app/products/page.tsx` |
| Category page | §5 | `app/category/[slug]/page.tsx` |
| Product detail (desktop / mobile / missing image) | §6 | `product/product-detail.tsx` |
| Sign-in | §7 | `app/sign-in/[[...sign-in]]/page.tsx` |
| Sign-up | §8 | `app/sign-up/[[...sign-up]]/page.tsx` |
| Protected placeholders | §9 | `proxy.ts` matcher |
| 404 | §10 | `app/not-found.tsx` |
| Error boundary | §11 | `app/error.tsx` |
| ProductCard | §12.1 | `product/product-card.tsx` |
| ProductGrid | §12.2 | `product/product-grid.tsx` |
| PriceDisplay | §12.3 | `product/price-display.tsx` |
| CategoryBadge | §12.4 | `product/category-badge.tsx` |
| CategoryFilter | §12.5 | `product/category-filter.tsx` |
| AuthSection | §12.6 | `layout/auth-section.tsx` |
| EmptyState | §12.7 | `common/empty-state.tsx` |
| Skeleton / GridSkeleton | §12.8 | `common/skeleton.tsx`, `product/product-grid.tsx` |

Every wireframe traces 1:1 to an existing source file. If a future change modifies the layout, update this document in the same PR.

---

*Last updated: July 18, 2026 — aligned with `master` as of Phase 1 close (Stage 6 commits `068e2a9` … `63de78b`).*