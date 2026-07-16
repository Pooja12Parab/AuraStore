# AuraStore — Requirements Document

> **Project:** AuraStore: The Modern Consumer App  
> **Version:** 1.0  
> **Status:** Draft  
> **Date:** July 9, 2026

---

## 1. Introduction

### 1.1 Purpose
AuraStore is a modern e-commerce storefront that delivers a fast, visually rich shopping experience. This document defines what the system must do — broken into three implementation phases.

### 1.2 Scope
The project consists of a Next.js frontend, a Strapi headless CMS backend for product/order management, Clerk for authentication, and Razorpay for payment processing.

### 1.3 Key Technologies
- **Frontend:** Next.js, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, TanStack Query, Sonner, Lucide React, Clerk
- **Backend:** Strapi CMS, PostgreSQL/SQLite, Razorpay payment gateway

---

## 2. Functional Requirements — Phase 1: Basic (MVP)

**Goal:** A browsable storefront with authentication and product display. No purchasing capability.

### 2.1 Authentication (Clerk)
- FR1: Users must be able to sign up with email and password
- FR2: Users must be able to sign in with email and password
- FR3: Users must be able to sign out
- FR4: Authenticated users must see their profile/user menu
- FR5: Unauthenticated users must see sign-in/sign-up buttons
- FR6: Certain routes (checkout, orders, account) must be protected and redirect unauthenticated users to sign-in

### 2.2 Product Catalog (Strapi CMS)
- FR7: Admin must be able to manage products (name, slug, description, price, images, category) via Strapi admin panel
- FR8: Admin must be able to manage categories (name, slug, description, image) via Strapi admin panel
- FR9: Products must be filterable by category
- FR10: Products must support draft/publish workflow
- FR11: At least 10-20 seed products must exist across 4-5 categories for development

### 2.3 Product Browsing
- FR12: Users must be able to view a grid of all products with image, name, price, and category badge
- FR13: Users must be able to click a product to view full details (images, description, price, category)
- FR14: Users must be able to filter products by category
- FR15: The product listing must display loading skeletons while data loads
- FR16: Errors during product fetching must be handled gracefully (error boundary)

### 2.4 Navigation & Layout
- FR17: The app must have a header with logo, navigation links, and auth buttons
- FR18: The app must have a footer with links and branding
- FR19: The layout must be responsive across mobile, tablet, and desktop

---

## 3. Functional Requirements — Phase 2: Mandatory

**Goal:** Full e-commerce functionality — shopping cart, checkout, and real payment processing.

### 3.1 Shopping Cart
- FR20: Users must be able to add products to cart with quantity selection
- FR21: Users must be able to view cart contents in a slide-out drawer showing items, quantities, and subtotal
- FR22: Users must be able to increment/decrement/remove items in the cart
- FR23: Cart must persist across browser sessions (localStorage)
- FR24: Cart must show item count badge on the header icon
- FR25: Empty cart must show a graceful message with a call-to-action to browse products
- FR26: Cart actions must show toast notifications (item added, removed, errors)

### 3.2 Checkout & Payments (Razorpay)
- FR27: Users must be able to proceed from cart to checkout
- FR28: Checkout must show an order summary (items, quantities, totals)
- FR29: Users must provide shipping address (name, street, city, state, zip, country) and email
- FR30: On submit, the system must create a Razorpay order and return an order_id
- FR31: The Razorpay payment modal must launch and allow test payment completion
- FR32: After successful payment, the system must receive a Razorpay webhook
- FR33: The webhook must verify the cryptographic signature before updating order status
- FR34: Order status must be updated in Strapi (pending → paid / failed)
- FR35: Users must see an order confirmation page after successful payment
- FR36: Payment failures must show appropriate error messages

### 3.3 Order Management
- FR37: Strapi must store orders with user ID, items, total, status, payment ID, and shipping address
- FR38: Authenticated users must be able to view their order history (date, status, total, item count)
- FR39: Authenticated users must be able to view full order details (items, quantities, prices, shipping address, payment status)

### 3.4 Authentication Guards
- FR40: Unauthenticated users attempting to access checkout must be redirected to sign-in
- FR41: Address form fields must have client-side validation

---

## 4. Functional Requirements — Phase 3: Advanced

**Goal:** Polished user experience, animations, performance optimization, and premium features.

### 4.1 Animations & Interactions
- FR42: Page transitions between product listing, detail, cart, and checkout must be smooth (Framer Motion)
- FR43: Product cards must have hover effects and scroll-based fade-in animations
- FR44: Cart drawer must slide in/out smoothly
- FR45: Micro-interactions must be present on buttons, toasts, and skeleton loaders

### 4.2 Search & Discovery
- FR46: Users must be able to search products with a debounced search bar
- FR47: Search results must show relevant matches with highlighted terms
- FR48: Users must be able to sort products by price (asc/desc), name, and newest
- FR49: Product detail pages must show related products from the same category
- FR50: Product images must support gallery view with zoom/lightbox

### 4.3 User Experience
- FR51: Users must be able to toggle between light and dark mode (preference persisted)
- FR52: Authenticated users must be able to add/remove products to/from a wishlist
- FR53: Custom 404 and error pages must be present
- FR54: All empty states (order history, wishlist, search no-results) must display appropriate messaging

### 4.4 SEO & Performance
- FR55: Product pages must have meta tags, Open Graph data, and JSON-LD structured data
- FR56: A sitemap must be generated
- FR57: Images must use lazy loading and modern formats (WebP)

### 4.5 Accessibility
- FR58: The app must target WCAG 2.1 AA compliance
- FR59: Keyboard navigation must work across all interactive elements
- FR60: Screen reader announcements must be present for dynamic content changes

### 4.6 Administration
- FR61: Strapi admin should have organized media library and custom admin views

### 4.7 Security Hardening
- FR62: Rate limiting must be applied on payment-related API routes
- FR63: Security headers must be applied via middleware

---

## 5. Non-Functional Requirements

### 5.1 Performance
- NFR1: Lighthouse Performance score must be ≥ 90
- NFR2: Lighthouse Accessibility score must be ≥ 90
- NFR3: Lighthouse SEO score must be ≥ 95
- NFR4: First Contentful Paint (FCP) must be < 1.0s
- NFR5: Largest Contentful Paint (LCP) must be < 1.5s
- NFR6: Cumulative Layout Shift (CLS) must be < 0.1
- NFR7: Initial JS bundle (gzipped) must be < 150KB
- NFR8: Partial Prerendering (PPR) must be used for instant static shell delivery

### 5.2 Security
- NFR9: `RAZORPAY_KEY_SECRET` and `STRAPI_API_TOKEN` must never be exposed to the client
- NFR10: Razorpay webhook payloads must be verified using HMAC-SHA256 signature verification
- NFR11: Order amounts must be verified server-side, never trusted from the client
- NFR12: CORS must be configured to allow only the Next.js origin
- NFR13: Server-side input validation must be performed on all form submissions

### 5.3 Browser Support
- NFR14: The app must support latest versions of Chrome, Firefox, Safari, and Edge

### 5.4 Development Requirements
- NFR15: The project must use TypeScript throughout
- NFR16: The project must use Strapi v5 with its flattened API response format
- NFR17: The project must use Next.js v16 with Turbopack as default bundler
- NFR18: The project must use Clerk v6 with `clerkMiddleware()` pattern
- NFR19: The Strapi backend must be seeded with mock/development data

---

## 6. Constraints & Assumptions

### 6.1 Assumptions
- A Strapi CMS instance will be available (local development or cloud)
- A Razorpay test account with API keys will be available
- Clerk account with project credentials will be available
- PostgreSQL or SQLite will be used as the database (managed through Strapi)
- Product images will be served via Strapi media library or placeholder services (e.g., picsum.photos)

### 6.2 Constraints
- No custom backend API — Strapi serves as the sole backend
- Authentication is handled entirely through Clerk (no custom auth)
- Payments are processed exclusively through Razorpay
- The project must follow a decoupled architecture (frontend independent of backend)
- All phases must be implemented sequentially — each phase builds on the previous

---

## 7. Glossary

| Term | Definition |
|------|------------|
| CMS | Content Management System — Strapi used for product/order data |
| PPR | Partial Prerendering — serves static HTML shell + streams dynamic content |
| Webhook | HTTP callback from Razorpay to verify payment success server-side |
| HMAC | Hash-based Message Authentication Code used for webhook signature verification |
| Optimistic UI | Immediate UI update before server confirms the action |
| Decoupled Architecture | Frontend and backend operate independently via API communication |
| shadcn/ui | Collection of re-usable React components built on Radix UI primitives |

---

*This document defines only the requirements (WHAT). Architecture, design, and implementation details (HOW) are covered in separate documents.*  
*Last updated: July 9, 2026*