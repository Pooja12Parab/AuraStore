# AuraStore — High-Level Design (HLD)

> **Project:** AuraStore: The Modern Consumer App  
> **Version:** 1.0  
> **Status:** Draft  
> **Date:** July 9, 2026  
> **Document Type:** High-Level Design (Architecture)

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture Style & Patterns](#2-architecture-style--patterns)
3. [C4 Architecture Diagrams](#3-c4-architecture-diagrams)
   - [Level 1: System Context](#31-level-1-system-context)
   - [Level 2: Container Diagram](#32-level-2-container-diagram)
   - [Level 3: Component Diagram](#33-level-3-component-diagram)
4. [Technology Stack & Versions](#4-technology-stack--versions)
5. [Data Flow Architecture](#5-data-flow-architecture)
   - [5.1 Content Delivery Flow (PPR)](#51-content-delivery-flow-ppr)
   - [5.2 Authentication Flow (Clerk)](#52-authentication-flow-clerk)
   - [5.3 Cart & Checkout Flow](#53-cart--checkout-flow)
   - [5.4 Webhook Payment Confirmation Flow](#54-webhook-payment-confirmation-flow)
6. [Module & Component Design](#6-module--component-design)
   - [6.1 Frontend Modules (By Phase)](#61-frontend-modules-by-phase)
   - [6.2 Strapi Backend Services](#62-strapi-backend-services)
7. [Data Architecture](#7-data-architecture)
   - [7.1 Strapi Collection Types](#71-strapi-collection-types)
   - [7.2 Entity Relationships](#72-entity-relationships)
   - [7.3 Data Storage Strategy](#73-data-storage-strategy)
8. [API Architecture](#8-api-architecture)
   - [8.1 Strapi REST API Endpoints](#81-strapi-rest-api-endpoints)
   - [8.2 Next.js API Routes](#82-nextjs-api-routes)
   - [8.3 Clerk API Integration](#83-clerk-api-integration)
   - [8.4 Razorpay API Integration](#84-razorpay-api-integration)
9. [Security Architecture](#9-security-architecture)
10. [Deployment Architecture](#10-deployment-architecture)
11. [Performance Architecture](#11-performance-architecture)
12. [Phase-Wise Architecture Map](#12-phase-wise-architecture-map)

---

## 1. System Overview

### 1.1 Purpose
AuraStore is a modern, decoupled e-commerce storefront that delivers instant-loading product browsing, secure payment processing, and a fluid app-like user experience. The system follows a headless architecture where the frontend presentation layer is completely independent from the backend content management and payment processing.

### 1.2 Scope
The system spans three implementation phases:
- **Phase 1 (Basic/MVP):** Product catalog browsing, user authentication, responsive layout
- **Phase 2 (Mandatory):** Shopping cart, checkout flow, Razorpay payment integration, order management
- **Phase 3 (Advanced):** Animations, search/sorting, dark mode, SEO, wishlist, accessibility

### 1.3 Architecture Style
**Decoupled / Headless Architecture** — The Next.js frontend communicates with Strapi CMS, Clerk Auth, and Razorpay Payments via REST APIs and webhooks. There is no monolithic backend; each service is independently deployable and scalable.

---

## 2. Architecture Style & Patterns

| Pattern | Implementation | Rationale |
|---------|---------------|-----------|
| **Headless CMS** | Strapi v5 serves content via REST API | Frontend is independent of backend; content can be managed separately |
| **Partial Prerendering (PPR)** | Next.js 16 `cacheComponents: true` + Suspense boundaries | Static shell delivered instantly; dynamic content streams in |
| **Optimistic UI** | TanStack Query v5 `onMutate` → `setQueryData` → rollback on error | Cart feels instant; no waiting for server confirmation |
| **Server-Side Auth** | Clerk `clerkMiddleware()` (in `proxy.ts`) + `auth().protect()` → `auth.protect()` | Session validation on every protected request (defense-in-depth) |
| **Webhook-Driven Payments** | Razorpay webhook → HMAC verification → Strapi update | Payment state is never trusted from client |
| **CSS-First Styling** | Tailwind CSS v4 `@import "tailwindcss"` + `@theme` blocks | No separate config file; inline theme configuration |
| **Bundle-Optimized Animations** | Framer Motion `LazyMotion` + `m` + `domAnimation` | Animation features loaded on demand (17KB vs 29KB) |

---

## 3. C4 Architecture Diagrams

### 3.1 Level 1: System Context

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   [Anonymous User] ───►───   [AuraStore System]   ◄───►─── [Admin User]    │
│                               (E-Commerce Platform)                         │
│                                     │                                       │
│                        ┌────────────┼────────────┐                          │
│                        ▼            ▼            ▼                          │
│                   ┌─────────┐ ┌──────────┐ ┌──────────┐                    │
│                   │ Clerk   │ │ Razorpay│ │ Strapi   │                    │
│                   │ (Auth)  │ │(Payment)│ │ (CMS)    │                    │
│                   └─────────┘ └──────────┘ └──────────┘                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**External Systems:**
- **Clerk** — User authentication, session management, user profiles
- **Razorpay** — Payment order creation, payment modal, webhook callbacks
- **Strapi** — Product catalog, categories, order storage (runs as separate service)

### 3.2 Level 2: Container Diagram

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│                              AuraStore System                                        │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────┐                            │
│  │              Single-Page Application (SPA)           │                            │
│  │              Next.js 16 + TypeScript                 │                            │
│  │                                                      │                            │
│  │  ┌──────────┐ ┌──────────┐ ┌────────────────────┐  │                            │
│  │  │ App      │ │ Pages    │ │ Shared Components  │  │                            │
│  │  │ Router   │ │ (RSC +   │ │ (shadcn/ui +       │  │                            │
│  │  │ Layouts  │ │ Suspense)│ │  Custom)           │  │                            │
│  │  └──────────┘ └──────────┘ └────────────────────┘  │                            │
│  │                                                      │                            │
│  │  ┌──────────┐ ┌──────────┐ ┌────────────────────┐  │                            │
│  │  │ TanStack │ │ Clerk    │ │ Framer Motion      │  │                            │
│  │  │ Query    │ │ Provider │ │ (LazyMotion)       │  │                            │
│  │  └──────────┘ └──────────┘ └────────────────────┘  │                            │
│  │                                                      │                            │
│  │  ┌──────────────────────────────────────────────┐  │                            │
│  │  │        API Routes (Next.js Server)           │  │                            │
│  │  │  /api/orders/create  /api/webhooks/razorpay  │  │                            │
│  │  └──────────────────────────────────────────────┘  │                            │
│  └─────────────────────────────────────────────────────┘                            │
│                           │                                                          │
│        ┌──────────────────┼─────────────────────┐                                   │
│        ▼                  ▼                     ▼                                   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐                        │
│  │ Strapi CMS   │ │ Razorpay     │ │ Clerk Backend API    │                        │
│  │ (Container)  │ │ (Container)  │ │ (Container)          │                        │
│  │              │ │              │ │                      │                        │
│  │ PostgreSQL   │ │ Payment GW  │ │ User Management      │                        │
│  │ / SQLite     │ │ Webhooks    │ │ Session Tokens        │                        │
│  └──────────────┘ └──────────────┘ └──────────────────────┘                        │
└────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Level 3: Component Diagram (Next.js Internals)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Next.js Application (Container)                      │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                        Root Layout (app/layout.tsx)                   │   │
│  │  ┌──────────────┐ ┌────────────────┐ ┌──────────────────────────┐   │   │
│  │  │ ClerkProvider │ │ QueryProvider  │ │ ThemeProvider (dark mode)│   │   │
│  │  └──────────────┘ └────────────────┘ └──────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                         Header Component                              │   │
│  │  ┌──────┐ ┌──────────┐ ┌───────────┐ ┌───────────┐ ┌──────────────┐│   │
│  │  │ Logo │ │ Navigation │ │SearchBar │ │AuthSection│ │CartIconButton││   │
│  │  └──────┘ └──────────┘ └───────────┘ └───────────┘ └──────────────┘│   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  Page Components (RSC + Suspense Boundaries for PPR)                  │   │
│  │                                                                       │   │
│  │  ┌──────────────┐ ┌────────────────┐ ┌────────────────────────┐     │   │
│  │  │ /products    │ │ /products/[slug]│ │ /checkout              │     │   │
│  │  │ ProductGrid  │ │ ProductDetail  │ │ OrderSummary           │     │   │
│  │  │ ProductCard  │ │ ImageGallery   │ │ AddressForm            │     │   │
│  │  │ CategoryFilter│ │ RelatedProducts│ │ PaymentButton          │     │   │
│  │  └──────────────┘ └────────────────┘ └────────────────────────┘     │   │
│  │                                                                       │   │
│  │  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌─────────────────┐      │   │
│  │  │ /cart    │ │ /orders   │ │ /orders/ │ │ /wishlist       │      │   │
│  │  │ CartDrawer│ │ OrderCard │ │ [id]     │ │ WishlistGrid    │      │   │
│  │  │ CartItem │ │ OrderList │ │ OrderItem│ │ WishlistCard    │      │   │
│  │  └──────────┘ └───────────┘ └──────────┘ └─────────────────┘      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  Data Layer                                                          │   │
│  │  ┌────────────┐ ┌──────────┐ ┌───────────┐ ┌───────────────────┐   │   │
│  │  │ lib/strapi │ │ lib/cart │ │ hooks/    │ │ providers/        │   │   │
│  │  │ (API client)│ │ (state)  │ │ useCart   │ │ query-provider    │   │   │
│  │  │            │ │          │ │ useProducts│ │ theme-provider    │   │   │
│  │  └────────────┘ └──────────┘ └───────────┘ └───────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  API Routes Layer                                                     │   │
│  │  ┌─────────────────────────────┐ ┌───────────────────────────────┐   │   │
│  │  │ POST /api/orders/create     │ │ POST /api/webhooks/razorpay   │   │   │
│  │  │ → Razorpay SDK              │ │ → crypto.verify → Strapi API  │   │   │
│  │  └─────────────────────────────┘ └───────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Technology Stack & Versions

### Frontend (UI & Experience)

| Technology | Version | Purpose | Key Notes |
|-----------|---------|---------|-----------|
| Next.js | **v16.x** (stable) | Framework with App Router | PPR via `cacheComponents: true`, Turbopack default |
| TypeScript | v5.x | Type safety | Strict mode enabled |
| Tailwind CSS | **v4.3+** | Utility-first styling | CSS-first config: `@import "tailwindcss"`, `@theme` blocks |
| shadcn/ui | v2+ (Tailwind v4 support) | UI component library | Radix UI primitives, accessible by default |
| Framer Motion | **v12.x** | Animations | Use `LazyMotion` + `m` + `domAnimation` for bundle optimization |
| TanStack Query | **v5.90+** | Data fetching & caching | Object signatures, `isPending`, `gcTime` |
| Sonner | v2.x | Toast notifications | Lightweight, customisable |
| Lucide React | Latest | Icons | Tree-shakeable SVG icons |
| Clerk | **v7.x** | Authentication | `clerkMiddleware()` (in `proxy.ts`), `auth().protect()` → `auth.protect()`, `<ClerkProvider>` |

### Backend & Infrastructure

| Technology | Version | Purpose | Key Notes |
|-----------|---------|---------|-----------|
| Strapi | **v5.x** | Headless CMS | Flattened API, `documentId`, Vite bundler, Strapi AI |
| PostgreSQL / SQLite | - | Database | Managed via Strapi |
| Razorpay | API v2 | Payment gateway | Order API, Payment modal, Webhooks |

### Development Tools

| Tool | Purpose |
|------|---------|
| npm / pnpm | Package manager |
| Turbopack | Lightning-fast dev server (default in Next.js 16) |
| ESLint + Prettier | Code quality & formatting |
| Strapi AI | AI-assisted content type generation in admin panel |

---

## 5. Data Flow Architecture

### 5.1 Content Delivery Flow (PPR)

```
User Request → Next.js Server
                   │
                   ▼
        ┌─────────────────────┐
        │  PPR Engine         │
        │  cacheComponents:   │
        │  true               │
        └─────────┬───────────┘
                  │
        ┌─────────┴──────────┐
        ▼                    ▼
┌──────────────┐    ┌──────────────┐
│ Static Shell │    │ Dynamic      │
│ (Instant)    │    │ Islands      │
│              │    │ (Streamed)   │
│ - Layout     │    │ - Cart       │
│ - Header     │    │ - User Menu  │
│ - Product    │    │ - Search     │
│   Grid (SSG) │    │ - Checkout   │
└──────────────┘    └──────────────┘
        │                    │
        └────────┬───────────┘
                 ▼
        ┌─────────────────────┐
        │  TanStack Query     │
        │  caches responses   │
        │  staleTime: 5min    │
        └─────────┬───────────┘
                  │
                  ▼
        ┌─────────────────────┐
        │  Strapi CMS API     │
        │  GET /api/products  │
        └─────────────────────┘
```

**Key Points:**
- Static shell is pre-rendered at build time and served instantly
- Dynamic components are wrapped in React `<Suspense>` boundaries
- TanStack Query fetches from Strapi with 5-minute cache staleness
- Product data is considered mostly static; cart/user data is dynamic

### 5.2 Authentication Flow (Clerk)

```
┌──────────┐     ┌─────────────────┐     ┌──────────────┐
│  Browser │     │  Next.js Server  │     │  Clerk API   │
└────┬─────┘     └────────┬─────────┘     └──────┬───────┘
     │                    │                       │
     │ 1. Visit /sign-in  │                       │
     │───────────────────►│                       │
     │                    │                       │
     │ 2. Clerk UI loads  │                       │
     │◄───────────────────│                       │
     │                    │                       │
     │ 3. Submit credentials                      │
     │───────────────────────────────────────────►│
     │                    │                       │
     │ 4. Session token   │                       │
     │◄───────────────────────────────────────────│
     │                    │                       │
     │ 5. Request protected page                  │
     │───────────────────►│                       │
     │                    │                       │
     │ 6. clerkMiddleware │                       │
     │    validates token │                       │
     │                    │                       │
     │ 7. Server Component│                       │
     │    auth() gets user│                       │
     │                    │                       │
     │ 8. Rendered page   │                       │
     │◄───────────────────│                       │
```

**Key Points:**
- Network boundary (`proxy.ts` with `clerkMiddleware()`) intercepts all requests (Next.js 16 renamed `middleware.ts` → `proxy.ts`)
- Protected routes defined via `createRouteMatcher()`
- Server Components use `auth()` from `@clerk/nextjs/server` — **async in v7**, must `await`
- Client components use `useUser()` hook
- Session tokens available via `getToken()` for external API calls
- **Defense-in-depth:** `proxy.ts` is only the first line of defense; also call `auth().protect()` / `auth.protect()` inside protected Server Components and API routes (CVE-2025-29927). Middleware alone is insufficient.

### 5.3 Cart & Checkout Flow

```
┌──────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Browser │    │ TanStack Q.  │    │ Next.js API  │    │  Razorpay    │
└────┬─────┘    └──────┬───────┘    └──────┬───────┘    └──────┬───────┘
     │                 │                    │                    │
     │ 1. Add to cart  │                    │                    │
     │────────────────►│                    │                    │
     │                 │                    │                    │
     │ 2. Optimistic   │                    │                    │
     │    update       │                    │                    │
     │◄────────────────│                    │                    │
     │                 │                    │                    │
     │ 3. Proceed to   │                    │                    │
     │    checkout     │                    │                    │
     │─────────────────────────────────────►│                    │
     │                 │                    │                    │
     │                 │  4. POST /api/     │                    │
     │                 │    orders/create   │                    │
     │                 │                    │───────────────────►│
     │                 │                    │                    │
     │                 │  5. Return         │                    │
     │                 │    order_id        │                    │
     │                 │                    │◄───────────────────│
     │                 │                    │                    │
     │ 6. Launch       │                    │                    │
     │    Razorpay     │                    │                    │
     │    Modal        │                    │                    │
     │◄────────────────│                    │                    │
     │                 │                    │                    │
     │ 7. User pays    │                    │                    │
     │─────────────────────────────────────────────────────────►│
     │                 │                    │                    │
     │ 8. Payment      │                    │                    │
     │    callback     │                    │                    │
     │◄─────────────────────────────────────────────────────────│
     │                 │                    │                    │
     │ 9. Redirect to  │                    │                    │
     │    confirmation │                    │                    │
     │◄────────────────│                    │                    │
```

**Key Points:**
- Cart operations use optimistic updates via `onMutate` + `setQueryData`
- Rollback on error via `onError` with snapshot
- Cart persisted to `localStorage` for session continuity
- Razorpay order created server-side to protect secret key

### 5.4 Webhook Payment Confirmation Flow

```
┌──────────┐     ┌─────────────────┐     ┌──────────────┐     ┌──────────┐
│ Razorpay │     │  Next.js API    │     │  Strapi CMS  │     │ Browser  │
└────┬─────┘     └────────┬─────────┘     └──────┬───────┘     └────┬─────┘
     │                    │                       │                   │
     │ 1. Payment success │                       │                   │
     │    (async)         │                       │                   │
     │───────────────────►│                       │                   │
     │                    │                       │                   │
     │ 2. Verify HMAC-    │                       │                   │
     │    SHA256 signature │                       │                   │
     │                    │                       │                   │
     │ 3. Update order    │                       │                   │
     │    status → "paid" │                       │                   │
     │───────────────────────────────────────────►│                   │
     │                    │                       │                   │
     │ 4. 200 OK          │                       │                   │
     │◄───────────────────│                       │                   │
     │                    │                       │                   │
     │                    │  5. User redirected   │                   │
     │                    │    to /orders/[id]    │                   │
     │                    │──────────────────────────────────────────►│
```

**Key Points:**
- Webhook is the source of truth for payment state
- HMAC-SHA256 verification prevents tampering
- Order amount re-verified server-side (not trusted from client)
- 200 OK returned immediately after Strapi update

---

## 6. Module & Component Design

### 6.1 Frontend Modules (By Phase)

#### Phase 1 (Basic/MVP)

| Module | Components | Purpose |
|--------|-----------|---------|
| **Auth** | `SignInButton`, `UserButton`, `ClerkProvider` | Clerk-powered authentication |
| **Product Catalog** | `ProductCard`, `ProductGrid`, `ProductDetail`, `CategoryBadge`, `PriceDisplay` | Product browsing |
| **Layout** | `Header`, `Footer`, `Navigation`, `RootLayout` | App shell and navigation |
| **Data Layer** | `lib/strapi.ts`, `hooks/useProducts.ts`, `QueryProvider` | Strapi API integration |
| **Common** | `Skeleton`, `ErrorBoundary`, `EmptyState` | Shared UI primitives |

#### Phase 2 (Mandatory)

| Module | Components | Purpose |
|--------|-----------|---------|
| **Cart** | `CartDrawer`, `CartItem`, `CartSummary`, `CartIconButton`, `QuantitySelector` | Shopping cart |
| **Checkout** | `CheckoutPage`, `OrderSummary`, `AddressForm`, `PaymentButton` | Checkout flow |
| **Orders** | `OrderCard`, `OrderDetail`, `OrderHistoryPage` | Order management |
| **Payments** | `POST /api/orders/create`, `POST /api/webhooks/razorpay` | Razorpay integration |
| **Notifications** | `Sonner Toaster` | Toast notifications |
| **State** | `lib/cart.ts`, `hooks/useCart.ts`, `hooks/useOrders.ts` | Client state management |

#### Phase 3 (Advanced)

| Module | Components | Purpose |
|--------|-----------|---------|
| **Animations** | Framer Motion `LazyMotion`, page transitions, hover effects | UI polish |
| **Search** | `SearchBar` with debounce, search results | Product discovery |
| **Discovery** | `SortDropdown`, `ImageGallery`, `RelatedProducts`, `Pagination`, `Breadcrumbs` | Enhanced browsing |
| **UX** | `ThemeToggle`, `WishlistButton`, `WishlistGrid` | User preferences |
| **SEO** | Meta tags, JSON-LD structured data, sitemap | Search engine optimization |
| **Accessibility** | Keyboard navigation, screen reader support, WCAG compliance | Inclusive design |

### 6.2 Strapi Backend Services

| Service | Collection Type | Purpose | Phase |
|---------|----------------|---------|-------|
| **Product Service** | `Product` | CRUD for products, image management | Basic |
| **Category Service** | `Category` | CRUD for categories, product categorization | Basic |
| **Order Service** | `Order` | Order storage, status management | Mandatory |
| **Media Service** | Built-in Strapi Media | Product/category image storage | Basic |

---

## 7. Data Architecture

### 7.1 Strapi Collection Types

#### Product
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `name` | String | Required, max 255 chars | Product display name |
| `slug` | UID | Auto-generated, unique, indexed | URL-friendly identifier |
| `description` | Rich Text | Optional | Full product description |
| `price` | Decimal (whole INR rupees) | Required, min 0 | Price in whole INR rupees (no paise/sub-unit) |
| `comparePrice` | Decimal | Optional, min 0 | Original/comparison price |
| `images` | Media (multiple) | Optional | Product images (WebP format) |
| `category` | Relation (Category) | Required, many-to-one | Product categorization |
| `stock` | Integer | Optional, min 0 | Inventory count |
| `featured` | Boolean | Default: false | Featured product flag |
| `publishedAt` | DateTime | Optional | Draft/publish workflow |

#### Category
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `name` | String | Required, max 100 chars | Category display name |
| `slug` | UID | Auto-generated, unique, indexed | URL-friendly identifier |
| `description` | Text | Optional | Category description |
| `image` | Media | Optional | Category cover image |

#### Order
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `clerkUserId` | String | Required, indexed | Clerk user identifier |
| `items` | JSON | Required | Array of `{productId, name, price, qty, image}` |
| `total` | Decimal | Required, min 0 | Total order amount in INR |
| `status` | Enumeration | Required, default: `pending` | `pending` / `paid` / `failed` / `refunded` |
| `paymentId` | String | Optional | Razorpay payment ID |
| `razorpayOrderId` | String | Optional | Razorpay order ID |
| `address` | JSON | Required | `{fullName, street, city, state, zipCode, country}` |
| `email` | Email | Required | Customer email address |
| `phone` | String | Optional | Customer phone number |

### 7.2 Entity Relationships

```
┌──────────────┐       ┌──────────────┐
│   Category   │       │   Product    │
│──────────────│       │──────────────│
│ id (PK)      │◄──────│ category (FK)│
│ name         │  1:N  │ name         │
│ slug         │       │ price        │
│ description  │       │ images       │
│ image        │       │ slug         │
└──────────────┘       └──────┬───────┘
                              │
                              │ (items JSON contains
                              │  productId references)
                              │
                     ┌────────▼───────┐
                     │    Order       │
                     │────────────────│
                     │ id (PK)        │
                     │ clerkUserId    │
                     │ items (JSON)   │
                     │ total          │
                     │ status         │
                     │ paymentId      │
                     │ address (JSON) │
                     └────────────────┘
```

**Relationship Rules:**
- `Product` → `Category`: Many-to-One (a product belongs to exactly one category)
- `Order` → `Product`: Reference via `items[].productId` (denormalized for snapshot consistency)
- `Order` → `User`: Reference via `clerkUserId` (Clerk manages user data, not Strapi)
- Cascade delete is disabled on Category → Product (prevent accidental data loss)

### 7.3 Data Storage Strategy

| Data Type | Storage | Managed By | Backup Strategy |
|-----------|---------|------------|----------------|
| Products | PostgreSQL / SQLite | Strapi | Strapi export / DB dump |
| Categories | PostgreSQL / SQLite | Strapi | Strapi export / DB dump |
| Orders | PostgreSQL / SQLite | Strapi | Strapi export / DB dump |
| Media (images) | Filesystem / S3 | Strapi (via provider) | Strapi media backup |
| User Auth Data | Clerk Cloud | Clerk | Clerk-managed |
| Session Data | Clerk Cloud | Clerk | Clerk-managed |
| Cart State | Browser localStorage | Frontend | Non-persistent (session) |
| Payment Data | Razorpay Cloud | Razorpay | Razorpay-managed |

---

## 8. API Architecture

### 8.1 Strapi REST API Endpoints

| Method | Endpoint | Auth | Response Type | Phase |
|--------|----------|------|---------------|-------|
| `GET` | `/api/products?populate=*` | Public (API Token) | `StrapiResponse<Product>` | Basic |
| `GET` | `/api/products/:slug?populate=*` | Public (API Token) | `StrapiSingleResponse<Product>` | Basic |
| `GET` | `/api/categories?populate=*` | Public (API Token) | `StrapiResponse<Category>` | Basic |
| `GET` | `/api/categories/:slug?populate[products]=*` | Public (API Token) | `StrapiSingleResponse<Category>` | Basic |
| `POST` | `/api/orders` | API Token (server-side) | `StrapiSingleResponse<Order>` | Mandatory |
| `PUT` | `/api/orders/:documentId` | API Token (server-side) | `StrapiSingleResponse<Order>` | Mandatory |
| `GET` | `/api/orders?filters[clerkUserId][$eq]=:userId` | API Token + Server Call | `StrapiResponse<Order>` | Mandatory |

**Strapi v5 Response Format (Flattened):**
```json
{
  "data": [
    {
      "id": 1,
      "documentId": "abc123",
      "name": "Product Name",
      "price": 1999,
      "category": {
        "id": 1,
        "name": "Electronics"
      }
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 25,
      "pageCount": 1,
      "total": 10
    }
  }
}
```

### 8.2 Next.js API Routes

| Method | Endpoint | Auth | Purpose | Phase |
|--------|----------|------|---------|-------|
| `POST` | `/api/orders/create` | Server (Clerk session) | Create Razorpay order, return `order_id` | Mandatory |
| `POST` | `/api/webhooks/razorpay` | HMAC Signature | Verify payment, update Strapi order | Mandatory |

#### POST /api/orders/create — Request/Response Contract

**Request:**
```json
{
  "amount": 249900,
  "currency": "INR",
  "items": [
    {
      "productId": 1,
      "name": "Wireless Headphones",
      "price": 249900,
      "quantity": 1
    }
  ],
  "address": {
    "fullName": "John Doe",
    "street": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "zipCode": "400001",
    "country": "India"
  },
  "email": "john@example.com"
}
```

**Response (200):**
```json
{
  "order_id": "order_Nxq8m7K3...",
  "amount": 249900,
  "currency": "INR"
}
```

**Error Response (400/500):**
```json
{
  "error": "Failed to create order",
  "details": "Razorpay API error: ..."
}
```

#### POST /api/webhooks/razorpay — Contract

**Headers:**
```
x-razorpay-signature: <HMAC-SHA256 signature>
Content-Type: application/json
```

**Request Body:**
```json
{
  "event": "payment.captured",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_Nxq8m7K3...",
        "order_id": "order_Nxq8m7K3...",
        "amount": 249900,
        "currency": "INR",
        "status": "captured"
      }
    }
  }
}
```

**Validation Logic:**
```
expectedSignature = crypto
  .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
  .update(JSON.stringify(payload))
  .digest('hex')

if (expectedSignature !== headerSignature) → 400 Bad Request
```

**Response:** `200 OK` on success, `400` on signature mismatch.

### 8.3 Clerk API Integration

| Integration Point | Method | Purpose | Location |
|-------------------|--------|---------|----------|
| `<ClerkProvider>` | Component | Wrap root layout, provide auth context | `app/layout.tsx` |
| `clerkMiddleware()` | Network boundary (`proxy.ts`) | Protect routes, redirect unauthenticated | `proxy.ts` (Next.js 16; was `middleware.ts`) |
| `auth().protect()` (v6) → `auth.protect()` (v7) | Server Helper | Gate individual routes/actions | Server Components, API Routes |
| `auth()` | Server Helper | Get `userId`, `orgId`, `sessionId` | Server Components, API Routes |
| `useUser()` | Hook | Get user object on client | Client Components |
| `getToken()` | Server Helper | Get session token for external APIs | API Routes |

### 8.4 Razorpay API Integration

| Integration Point | Method | Purpose | Location |
|-------------------|--------|---------|----------|
| `Razorpay()` SDK | Server | Create order with `amount` + `currency` | `POST /api/orders/create` |
| `Razorpay()` Checkout | Client (browser) | Launch payment modal with `order_id` | `checkout/page.tsx` |
| Webhook Handler | Server | Receive `payment.captured` event | `POST /api/webhooks/razorpay` |

---

## 9. Security Architecture

### 9.1 Security Boundaries

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PUBLIC (Internet)                             │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                     PUBLIC ROUTES                              │   │
│  │  /products, /products/[slug], /category/[slug], /sign-in,    │   │
│  │  /sign-up                                                     │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                  │                                   │
│           Clerk Proxy Barrier (proxy.ts / clerkMiddleware)                  │
│                                  │                                   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    PROTECTED ROUTES                            │   │
│  │  /checkout, /orders, /orders/[id], /wishlist, /account        │   │
│  │  POST /api/orders/create                                      │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                  │                                   │
│           Webhook Signature Barrier (HMAC Verification)              │
│                                  │                                   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                  WEBHOOK ROUTE                                │   │
│  │  POST /api/webhooks/razorpay                                 │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### 9.2 Security Measures

| Area | Measure | Implementation | Phase |
|------|---------|---------------|-------|
| **Secrets** | Server-side only | `RAZORPAY_KEY_SECRET`, `STRAPI_API_TOKEN` never in client bundle | Basic |
| **Auth** | Clerk (`proxy.ts`) | `clerkMiddleware()` in `proxy.ts` + `auth.protect()` in protected components (defense-in-depth, CVE-2025-29927) | Basic |
| **Payment** | Webhook verification | HMAC-SHA256 signature check before order update | Mandatory |
| **Payment** | Amount verification | Server re-verifies amount, does not trust client-provided total | Mandatory |
| **CORS** | Origin restriction | Strapi CORS whitelist: only Next.js origin | Basic |
| **Input** | Server-side validation | Validate all form inputs on the server | Mandatory |
| **Rate Limiting** | API route protection | Rate limit on `/api/orders/create` | Advanced |
| **Headers** | Security headers | Apply via Next.js middleware (Helmet-style) | Advanced |
| **CSRF** | SameSite cookies | Clerk manages CSRF protection | Basic |
| **XSS** | React sanitization | React's built-in XSS + Strapi content sanitization | Basic |

---

## 10. Deployment Architecture

### 10.1 Local Development Environment

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Developer Machine                                   │
│                                                                              │
│  ┌────────────────────┐     ┌────────────────────┐     ┌────────────────┐   │
│  │  Next.js Frontend  │     │   Strapi Backend   │     │    Browser     │   │
│  │  localhost:3000    │◄───►│  localhost:1337    │     │  Chrome/Safari │   │
│  │                    │     │                    │     │                │   │
│  │  npm run dev       │     │  npm run develop   │     │  DevTools      │   │
│  └────────────────────┘     └─────────┬──────────┘     └────────────────┘   │
│                                       │                                      │
│                                       ▼                                      │
│                             ┌────────────────────┐                          │
│                             │   PostgreSQL /     │                          │
│                             │   SQLite Database   │                          │
│                             └────────────────────┘                          │
│                                                                              │
│  External Services:                                                          │
│    • Clerk Dashboard (https://dashboard.clerk.com)                          │
│    • Razorpay Dashboard (https://dashboard.razorpay.com)                    │
│    • picsum.photos (placeholder product images)                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 10.2 Production Deployment Targets

| Component | Platform | Configuration | 
|-----------|----------|---------------|
| Next.js Frontend | **Vercel** (recommended) | Environment variables via Vercel dashboard, automatic HTTPS |
| Strapi Backend | **Railway / Render / AWS EC2** | PostgreSQL managed database, persistent storage for media |
| Database | **Strapi-managed PostgreSQL** | Managed PostgreSQL from cloud provider |
| Media Storage | **AWS S3 / Cloudinary** (via Strapi provider) | Scalable image storage and CDN |
| Clerk | **Clerk Cloud** | Managed auth, no self-hosting |
| Razorpay | **Razorpay Cloud** | Managed payment gateway |

### 10.3 Environment Configuration

| Variable | Where | Secret | Phase |
|----------|-------|--------|-------|
| `NEXT_PUBLIC_APP_URL` | Frontend (.env.local / Vercel) | No | Basic |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Frontend (.env.local / Vercel) | No | Basic |
| `CLERK_SECRET_KEY` | Server-only (.env.local / Vercel) | Yes | Basic |
| `NEXT_PUBLIC_STRAPI_API_URL` | Frontend (.env.local / Vercel) | No | Basic |
| `STRAPI_API_TOKEN` | Server-only (.env.local / Vercel) | Yes | Basic |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Frontend (.env.local / Vercel) | No | Mandatory |
| `RAZORPAY_KEY_SECRET` | Server-only (.env.local / Vercel) | Yes | Mandatory |
| `RAZORPAY_WEBHOOK_SECRET` | Server-only (.env.local / Vercel) | Yes | Mandatory |
| `DATABASE_URL` | Strapi backend | Yes | Basic |

---

## 11. Performance Architecture

### 11.1 Performance Targets

| Metric | Target | Mechanism |
|--------|--------|-----------|
| First Contentful Paint (FCP) | < 1.0s | PPR static shell + Next.js font optimization |
| Largest Contentful Paint (LCP) | < 1.5s | Image optimization, lazy loading |
| Cumulative Layout Shift (CLS) | < 0.1 | Fixed dimensions for images, skeleton placeholders |
| Time to Interactive (TTI) | < 2.0s | Code splitting, LazyMotion |
| Lighthouse Performance | > 90 | Combined strategies below |
| Initial JS Bundle (gzipped) | < 150KB | Dynamic imports, LazyMotion |

### 11.2 Performance Strategies

| Strategy | Implementation | Impact |
|----------|---------------|--------|
| **PPR** | `cacheComponents: true` in `next.config.ts` + Suspense boundaries for dynamic content | Instant static shell, streamed dynamic islands |
| **Turbopack** | Default in Next.js 16, no flags needed | Faster HMR in development |
| **Image Optimization** | Next.js `<Image>` with `lazyLoad`, WebP format, `remotePatterns` for Strapi | Reduced image payload, responsive images |
| **TanStack Query Caching** | `staleTime: 300000` (5 min), `gcTime: 1800000` (30 min) | Cache-first data loading, fewer network requests |
| **Code Splitting** | `next/dynamic` for CartDrawer, Checkout, heavy components | Smaller initial bundle |
| **LazyMotion** | `LazyMotion` + `domAnimation` (17KB) instead of full `framer-motion` (29KB) | Reduced animation bundle by 41% |
| **Font Optimization** | `next/font` with `display: swap` | No FOIT, minimal CLS |
| **Bundle Analysis** | `@next/bundle-analyzer` for ongoing monitoring | Track and maintain bundle size targets |

---

## 12. Phase-Wise Architecture Map

| Architecture Component | Phase 1 (Basic) | Phase 2 (Mandatory) | Phase 3 (Advanced) |
|----------------------|-----------------|---------------------|---------------------|
| **Next.js Setup** | ✅ Initialized with v16, Turbopack | ✅ Enhanced with API routes | ✅ Performance tuning |
| **Strapi CMS** | ✅ Product + Category types, seed data | ✅ Order type, webhook client | ✅ Admin polish |
| **Clerk Auth** | ✅ Provider, middleware, UI components | ✅ Auth guards on checkout | - |
| **TanStack Query** | ✅ Provider, product queries | ✅ Cart + order mutations | ✅ Advanced caching |
| **PPR** | ✅ Static shell for product pages | ✅ + Cart/checkout islands | ✅ Optimized boundaries |
| **shadcn/ui** | ✅ Base components (Button, Card, Input, Badge, Skeleton) | ✅ Sheet (cart drawer) | ✅ Additional components |
| **Product Browsing** | ✅ Listing, detail, category filter | - | ✅ Search, sort, gallery, related |
| **Shopping Cart** | - | ✅ Add/remove, drawer, localStorage, optimistic UI | ✅ Cart animations |
| **Checkout** | - | ✅ Order creation, Razorpay modal, address form | ✅ Refined UX |
| **Payments** | - | ✅ Order API, webhook, signature verification | ✅ Rate limiting |
| **Orders** | - | ✅ History, detail view, Strapi storage | ✅ Empty states |
| **Animations** | - | - | ✅ Page transitions, micro-interactions, LazyMotion |
| **Dark Mode** | - | - | ✅ Theme toggle, persisted preference |
| **SEO** | - | - | ✅ Meta/OG tags, JSON-LD, sitemap |
| **Accessibility** | - | - | ✅ WCAG 2.1 AA, keyboard nav, screen readers |
| **Wishlist** | - | - | ✅ Add/remove/view, persisted |
| **Notifications** | - | ✅ Sonner toasts | ✅ Animated toast entries |
| **Security Hardening** | - | ✅ Webhook verification | ✅ Rate limiting, security headers |

---

*This document covers the high-level architecture (HOW the system is built). Detailed implementation specifications are covered in separate LLD and Implementation Plan documents.*  
*Last updated: July 9, 2026*