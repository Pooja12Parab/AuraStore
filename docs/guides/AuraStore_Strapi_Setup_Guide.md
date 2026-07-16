# AuraStore — Strapi v5 Setup & Integration Guide

> **Project:** AuraStore: The Modern Consumer App
> **Version:** 1.0
> **Status:** Draft (updated to match Phase 1 LLD / Prerequisites)
> **Date:** July 14, 2026
> **Document Type:** Setup & Integration Reference (full steps, HUMAN/AGENT tagged)

> ## Role legend (applies to every step below)
> - 🧑 **HUMAN** — must be done by a person (local runtime install, external SaaS account/keys). Cannot be scripted.
> - 🤖 **AGENT** — scriptable; the assigned developer/agent performs it (install, first-run admin, API token, `schema.json`, config, seed, verification, frontend code).
> - 🤝 **HUMAN → AGENT** — human supplies a value/decision, agent applies it.

> **Scope:** Phase 1 = Clerk auth + Strapi `Product`/`Category` catalog + browsing + layout. **Razorpay and the `Order` content type are Phase 2** (see Appendix A) and are **out of scope here**.
> **Layout:** Next.js app at **repo root**; Strapi backend in sibling **`backend/`**. (Older drafts used `frontend/` — corrected.)
> **Parent docs:** [Phase 1 Prerequisites](./phase_1/AuraStore_Prerequisites_Phase1.md) (human-only) · [Phase 1 Implementation Plan](./phase_1/AuraStore_Phase1_Implementation_Plan.md) (agent plan).

---

## Table of Contents

1. [Overview](#1-overview)
2. [Prerequisites & Pre-Install Checklist](#2-prerequisites--pre-install-checklist)
3. [Preparation (Human / External Only)](#3-preparation-human--external-only)
4. [Environment Variables Reference](#4-environment-variables-reference)
5. [Strapi Installation](#5-strapi-installation)
6. [Strapi Configuration](#6-strapi-configuration)
7. [Content Type Creation](#7-content-type-creation)
8. [API Access (Token-Auth, Private)](#8-api-access-token-auth-private)
9. [Seed Data Script](#9-seed-data-script)
10. [Frontend Integration (Agent Tasks)](#10-frontend-integration-agent-tasks)
11. [Testing the Integration](#11-testing-the-integration)
12. [Troubleshooting](#12-troubleshooting)
13. [Production Considerations](#13-production-considerations)
14. [Appendix A — Phase 2 (Out of Scope): Razorpay & Order](#appendix-a--phase-2-out-of-scope-razorpay--order)

---

## 1. Overview

### 1.1 Purpose
Complete, step-by-step reference for setting up **Strapi v5** as the headless CMS backend for AuraStore. Every step is tagged 🧑 HUMAN / 🤖 AGENT so you can see at a glance what the agent automates vs. what a person must do. **Strapi provisioning is fully automated** — only the local runtime and the external Clerk account require a human.

### 1.2 Architecture Context
```
┌─────────────────────┐         ┌─────────────────────┐
│   Next.js Frontend  │  REST   │   Strapi v5 CMS     │
│   (repo root :3000) │◄───────►│   (backend/ :1337)  │
│   TanStack Query    │  token  │   SQLite/PostgreSQL │
│   MSW (tests)       │  auth   │   Media Library     │
└─────────────────────┘         └─────────────────────┘
```

### 1.3 What This Guide Covers (Phase 1)
- ✅ Installing Strapi v5 with SQLite (dev) / PostgreSQL (prod) — 🤖 AGENT
- ✅ First-run admin registration (bootstrap script) — 🤖 AGENT
- ✅ Read-only API token (admin API) — 🤖 AGENT
- ✅ Creating `Product` + `Category` content types (`schema.json`) — 🤖 AGENT
- ✅ **Private content types + token-auth** (no Public-role read)
- ✅ Writing and running the seed data script (all entries published) — 🤖 AGENT
- ✅ Building the frontend API client (`lib/strapi.ts`) with **explicit `populate`** (no `populate=*`) — 🤖 AGENT
- ✅ Verification (all `curl` checks) — 🤖 AGENT
- ✅ Troubleshooting common issues

> Razorpay / `Order` type are **not** covered here — see Appendix A (Phase 2).

---

## 2. Prerequisites & Pre-Install Checklist

### 2.1 System Requirements 🧑 HUMAN
| Requirement | Version | Check Command |
|-------------|---------|---------------|
| **Node.js** | **v22.x** (LTS) | `node --version` |
| **npm** | v10.x+ | `npm --version` |
| **pnpm** (optional) | v9.x+ | `pnpm --version` |
| **PostgreSQL** (optional, prod) | v16+ | `psql --version` |
| **Git** | Latest | `git --version` |

### 2.2 Accounts & Services Needed
| Service | What You Need | Phase | Who |
|---------|---------------|-------|-----|
| **Strapi** | Local installation (no account) | 1 | 🤖 AGENT (`create-strapi` + bootstrap) |
| **Clerk** | Clerk application + API keys | 1 | 🧑 HUMAN (external SaaS) |
| **PostgreSQL** (optional) | Local/cloud DB | 1 (prod) | 🧑 HUMAN (or agent with provided creds) |
| **Razorpay** | Test account + API keys | **2** | 🧑 HUMAN — *out of scope here* (Appendix A) |

### 2.3 Tools 🧑 HUMAN
| Tool | Purpose |
|------|---------|
| **VS Code** | Code editor |
| **curl** | (Used by the agent for automated verification) |
| **Docker Desktop** (optional) | Running PostgreSQL via Docker |

---

## 3. Preparation (Human / External Only)

These are the **only** items a human must provide: the local runtime and the external Clerk account. **All Strapi provisioning below (§5–§9) is automated by the agent** — there are no human Strapi steps.

### Step 1 — Install Node.js v22 🧑 HUMAN
```bash
node --version   # Should show v22.x.x
npm --version    # Should show 10.x.x
```

### Step 2 — Choose Your Database 🧑 HUMAN (decision; default needs nothing)
- **SQLite (recommended for dev):** no install; Strapi default. The agent uses it automatically.
- **PostgreSQL (prod-like):** provide host/creds (local, Docker, or cloud). The agent wires it via `--dbclient postgres` / `.env`.
```bash
# Optional Docker Postgres:
docker run --name aurastore-db -e POSTGRES_USER=aurastore \
  -e POSTGRES_PASSWORD=aurastore123 -e POSTGRES_DB=aurastore \
  -p 5432:5432 -d postgres:16-alpine
```

### Step 3 — Create a Clerk Application 🧑 HUMAN (Phase 1, external)
1. Go to https://dashboard.clerk.com → **Add Application** → name `AuraStore`.
2. Select **Email + Password**.
3. Copy keys: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (`pk_test_…`), `CLERK_SECRET_KEY` (`sk_test_…`).
4. Create a `+clerk_test` test user (Prerequisites §2.4).

### Step 4 — Razorpay 🧑 HUMAN — **Phase 2, OUT OF SCOPE**
Deferred. See **Appendix A**.

### Step 5 — Project Directory 🤖 AGENT
The agent scaffolds the Next.js app at the **repo root** and creates `backend/` via `create-strapi` (§5). No human action.

### Step 6 — Gather Required Values 🧑 HUMAN
Record the **Clerk** values (Phase 1) in a secure place — do **not** commit:
```
# Clerk (human-supplied)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = pk_test_...
CLERK_SECRET_KEY = sk_test_...
E2E_CLERK_USER_EMAIL = testuser+clerk_test@example.com
E2E_CLERK_USER_PASSWORD = ...

# Strapi — GENERATED BY THE AGENT (no human action):
#   STRAPI_API_TOKEN        (read-only token created via admin API in §6.4)
#   NEXT_PUBLIC_STRAPI_API_URL = http://localhost:1337
```
> The Strapi token is created and written to `.env.local` by the agent. You do **not** need to create or copy it.

---

## 4. Environment Variables Reference

### 4.1 Strapi Backend (`backend/.env`) — 🤖 AGENT writes
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `HOST` | No | `0.0.0.0` | Server host |
| `PORT` | No | `1337` | Server port |
| `APP_KEYS` | **Yes** | Auto | Encryption keys |
| `API_TOKEN_SALT` | **Yes** | Auto | Salt for API tokens |
| `ADMIN_JWT_SECRET` | **Yes** | Auto | Admin JWT secret |
| `TRANSFER_TOKEN_SALT` | **Yes** | Auto | Transfer token salt |
| `DATABASE_CLIENT` | No | `sqlite` | `sqlite` or `postgres` |
| `DATABASE_FILENAME` | No | `.tmp/data.db` | SQLite file |
| `DATABASE_HOST` | Postgres | `localhost` | DB host |
| `DATABASE_PORT` | Postgres | `5432` | DB port |
| `DATABASE_NAME` | Postgres | `aurastore` | DB name |
| `DATABASE_USERNAME` | Postgres | `aurastore` | DB user |
| `DATABASE_PASSWORD` | Postgres | `aurastore123` | DB password |
| `DATABASE_SSL` | No | `false` | SSL for DB |
| `CLIENT_URL` | **Yes** | `http://localhost:3000` | Frontend URL (CORS) — agent default |

### 4.2 Frontend (`.env.local` at **repo root**) — 🤖 AGENT writes (Clerk values supplied by human)
| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_APP_URL` | Yes | `http://localhost:3000` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | From Clerk (Step 3) |
| `CLERK_SECRET_KEY` | Yes | From Clerk (Step 3) |
| `NEXT_PUBLIC_STRAPI_API_URL` | Yes | `http://localhost:1337` |
| `STRAPI_API_TOKEN` | Yes | **Generated by agent** (§6.4) |
| `E2E_CLERK_USER_EMAIL` | Test | `+clerk_test` user |
| `E2E_CLERK_USER_PASSWORD` | Test | test user password |

> **Phase 1 has no Razorpay vars.** They are listed only in Appendix A for Phase 2.

---

## 5. Strapi Installation

### 5.1 Create the Strapi Project 🤖 AGENT
```bash
# From the repo root:
npx create-strapi@latest backend --non-interactive
```
- `--non-interactive` uses defaults: **TypeScript**, installs dependencies, inits git, **SQLite** database.
- ⚠️ **`--quickstart` is DEPRECATED in Strapi 5 — do NOT use it** (it also implies SQLite but is removed; use `--non-interactive`).
- For PostgreSQL instead of SQLite: add `--dbclient postgres` with the corresponding db flags.
- This creates the `backend/` directory (sibling to the Next.js app at repo root).

### 5.2 First-Run Admin (bootstrap script) 🤖 AGENT
Strapi's first admin can be created via its API instead of a browser:
```bash
# Agent runs a bootstrap script, e.g. POST /admin/register:
curl -X POST http://localhost:1337/admin/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@aurastore.dev","password":"<generated>","firstname":"Aura","lastname":"Admin"}'
```
Then login (`POST /admin/login`) to obtain an admin JWT for the next step. **No human/browser step required.**

### 5.3 Verify Installation 🤖 AGENT
```bash
curl http://localhost:1337/_health
# Expected: {"uptime":...,"timestamp":...}
curl http://localhost:1337/api/products
# Expected (before token enforcement): {"data":[],"meta":{...}}
```

### 5.4 Project Structure After Installation
```
backend/
├── config/
│   ├── admin.ts
│   ├── api.ts
│   ├── database.ts
│   ├── middlewares.ts
│   ├── plugins.ts
│   └── server.ts
├── database/migrations/
├── public/uploads/
├── src/
│   ├── admin/
│   ├── api/
│   ├── extensions/
│   ├── index.ts
│   └── middlewares.ts
├── scripts/            # seed + bootstrap scripts go here
├── .env
├── package.json
├── tsconfig.json
└── types/generated/
```

---

## 6. Strapi Configuration

### 6.1 Database Configuration (`config/database.ts`) 🤖 AGENT
**SQLite (default — development):**
```typescript
// backend/config/database.ts
import path from 'path';

export default ({ env }) => {
  const client = env('DATABASE_CLIENT', 'sqlite');
  const connections = {
    sqlite: {
      connection: {
        filename: path.join(__dirname, '..', env('DATABASE_FILENAME', '.tmp/data.db')),
      },
      useNullAsDefault: true,
    },
    postgres: {
      connection: {
        host: env('DATABASE_HOST', 'localhost'),
        port: env.int('DATABASE_PORT', 5432),
        database: env('DATABASE_NAME', 'aurastore'),
        user: env('DATABASE_USERNAME', 'aurastore'),
        password: env('DATABASE_PASSWORD', 'aurastore123'),
        ssl: env.bool('DATABASE_SSL', false),
        schema: env('DATABASE_SCHEMA', 'public'),
      },
      pool: { min: 2, max: 10 },
    },
  };
  return {
    connection: {
      client,
      ...connections[client],
      acquireConnectionTimeout: env.int('DATABASE_CONNECTION_TIMEOUT', 60000),
    },
  };
};
```

**PostgreSQL (production-like):** set in `backend/.env`:
```bash
DATABASE_CLIENT=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=aurastore
DATABASE_USERNAME=aurastore
DATABASE_PASSWORD=aurastore123
DATABASE_SSL=false
```

### 6.2 CORS Configuration (`config/middlewares.ts`) 🤖 AGENT
```typescript
// backend/config/middlewares.ts
export default ({ env }) => [
  'strapi::errors',
  'strapi::security',
  {
    name: 'strapi::cors',
    config: {
      enabled: true,
      origin: [env('CLIENT_URL', 'http://localhost:3000')],
      headers: ['Content-Type', 'Authorization', 'Origin', 'Accept', 'X-Requested-With'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
      keepHeaderOnError: true,
    },
  },
  'strapi::poweredBy',
  'strapi::logger',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
```

### 6.3 Server Configuration (`config/server.ts`) 🤖 AGENT
```typescript
// backend/config/server.ts
export default ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  app: { keys: env.array('APP_KEYS') },
  url: env('PUBLIC_URL', 'http://localhost:1337'),
});
```

### 6.4 Generate the Read-Only API Token (admin API) 🤖 AGENT
The agent creates the token via the admin API using the admin JWT from §5.2 — no dashboard, no human copy:
```bash
# 1) login → admin JWT
ADMIN_JWT=$(curl -s -X POST http://localhost:1337/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@aurastore.dev","password":"<generated>"}' | jq -r .data.token)

# 2) create read-only token
curl -X POST http://localhost:1337/admin/api-tokens \
  -H "Authorization: Bearer $ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"name":"AuraStore Frontend","description":"Read-only token","type":"read-only","lifespan":null}'
# → response contains the token string; agent writes it to .env.local as STRAPI_API_TOKEN
```
> **Do NOT open Public-role permissions** for Phase 1. The frontend reads via this single read-only token (server-side). See §8.

### 6.5 Update `backend/.env` with Client URL 🤖 AGENT
```bash
# Add to backend/.env
CLIENT_URL=http://localhost:3000
```

### 6.6 Restart Strapi 🤖 AGENT
```bash
cd backend
npm run develop
```

---

## 7. Content Type Creation

> **Phase 1 types:** `Product` + `Category` only. The `Order` type is **Phase 2** (Appendix A).
> Field contracts match HLD §7.1 / LLD §4.5.

### 7.1 Code-generated `schema.json` 🤖 AGENT (preferred, reproducible)
The agent writes `backend/src/api/product/content-types/product/schema.json` and `backend/src/api/category/content-types/category/schema.json` (see Implementation Plan Stage 2). Restart Strapi after.

**Product** (collection type):
- `name` — Text (Short text), **required**, max 255
- `slug` — **UID**, unique, indexed (target field `name`)
- `description` — Rich text (Blocks)
- `price` — Decimal, **required**, min 0 (whole INR rupees)
- `comparePrice` — Decimal, optional, min 0
- `images` — Media, multiple
- `category` — **Relation → Category, many-to-one** (Category has many Product). **Required**
- `stock` — Integer, optional, min 0
- `featured` — Boolean, default `false`
- Advanced Settings: **Draft & Publish** enabled

**Category** (collection type):
- `name` — Text (Short text), **required**, max 100
- `slug` — **UID**, unique, indexed (target field `name`)
- `description` — Text, optional
- `image` — Media, single, optional
- Advanced Settings: **Draft & Publish** enabled

> Collection type display names are auto-pluralized (`Product`→`products`, `Category`→`categories`).

### 7.2 Option B — Strapi Admin UI 🧑 HUMAN (manual fallback only)
If the agent did NOT code-generate the types, a human can create them in the Admin UI:
1. **Content-Type Builder** → **Create new collection type** → `Category` → Continue.
2. Add fields per §7.1 (Text short / UID attached to `name` / Text / Media single). Save.
3. Create `Product`; for `category` choose **Relation → Many-To-One → Category**. Save.
4. Restart Strapi; both appear at `/api/products` and `/api/categories`.

### 7.3 Verify Content Types 🤖 AGENT
```bash
curl -H "Authorization: Bearer $STRAPI_API_TOKEN" http://localhost:1337/api/products
curl -H "Authorization: Bearer $STRAPI_API_TOKEN" http://localhost:1337/api/categories
```

---

## 8. API Access (Token-Auth, Private)

> **Locking decision (LLD §6.2):** Content types stay **PRIVATE**. The frontend reads via a **read-only Bearer API token** (server-side). **Do NOT enable Public-role `find`/`findOne` permissions.**

### 8.1 Why not Public permissions?
- Public read would expose the catalog to anyone without a token and bypasses the token-auth model.
- Phase 1 only needs read access → a single **Read-only** token is sufficient. Write operations (seed) are performed by the agent/server, not the browser.

### 8.2 Permissions Summary
| Content Type | Public (read) | Authenticated (token) |
|--------------|---------------|------------------------|
| **Product** | ❌ None | Read-only token: `find`, `findOne` |
| **Category** | ❌ None | Read-only token: `find`, `findOne` |

### 8.3 Verify Token Auth 🤖 AGENT
```bash
curl -H "Authorization: Bearer $STRAPI_API_TOKEN" http://localhost:1337/api/products   # 200
curl -H "Authorization: Bearer invalid_token" http://localhost:1337/api/products          # 401
```

---

## 9. Seed Data Script

### 9.1 Create the Seed Script 🤖 AGENT
Create `backend/scripts/seed.ts`. Key requirements:
- Create 4–5 categories + 10–20 products.
- **Publish every entry** (`status: 'published'`) — otherwise the storefront shows an empty grid (Draft & Publish caveat).
- Match the flattened response contract (LLD §4.4.2).
- **MUST include the exact slugs the Stage 6 E2E asserts on:** products `wireless-headphones` (with `comparePrice`) and `cotton-tshirt`, and categories `electronics` + `clothing`.
- Prices are **whole INR rupees** (e.g. `249900` → `₹2,49,900`).

```typescript
// backend/scripts/seed.ts
async function seed() {
  const { createStrapi } = await import('@strapi/strapi');
  const app = await createStrapi().load();
  const { documents } = app;

  const categoriesData = [
    { name: 'Electronics', slug: 'electronics', description: 'Gadgets, devices, and tech accessories' },
    { name: 'Clothing', slug: 'clothing', description: 'Fashion apparel for men and women' },
    { name: 'Home & Living', slug: 'home-living', description: 'Furniture, decor, and home essentials' },
    { name: 'Books', slug: 'books', description: 'Fiction, non-fiction, and educational' },
    { name: 'Sports & Outdoors', slug: 'sports-outdoors', description: 'Gear, equipment, and activewear' },
  ];

  const productsData = [
    { name: 'Wireless Headphones', slug: 'wireless-headphones', description: 'Premium noise-cancelling wireless headphones with 30-hour battery life.', price: 249900, comparePrice: 299900, categorySlug: 'electronics', stock: 50, featured: true },
    { name: 'Smart Watch', slug: 'smart-watch', description: 'Fitness tracker with heart rate monitor, GPS, and 7-day battery.', price: 129900, categorySlug: 'electronics', stock: 30, featured: true },
    { name: 'Bluetooth Speaker', slug: 'bluetooth-speaker', description: 'Portable waterproof speaker with deep bass and 12-hour playtime.', price: 49900, categorySlug: 'electronics', stock: 100, featured: false },
    { name: 'Cotton T-Shirt', slug: 'cotton-tshirt', description: 'Comfortable 100% organic cotton t-shirt. Available in multiple colors.', price: 79900, categorySlug: 'clothing', stock: 200, featured: true },
    { name: 'Denim Jacket', slug: 'denim-jacket', description: 'Classic denim jacket with a modern fit. Perfect for layering.', price: 299900, categorySlug: 'clothing', stock: 40, featured: false },
    { name: 'Running Shoes', slug: 'running-shoes', description: 'Lightweight running shoes with responsive cushioning and breathable mesh.', price: 899900, categorySlug: 'clothing', stock: 60, featured: true },
    { name: 'Scented Candle Set', slug: 'scented-candle-set', description: 'Set of 3 hand-poured soy wax candles.', price: 149900, categorySlug: 'home-living', stock: 45, featured: false },
    { name: 'Throw Blanket', slug: 'throw-blanket', description: 'Ultra-soft microfiber throw blanket. Machine washable.', price: 249900, categorySlug: 'home-living', stock: 80, featured: true },
    { name: 'Plant Pot Set', slug: 'plant-pot-set', description: 'Set of 3 ceramic plant pots with drainage holes.', price: 199900, categorySlug: 'home-living', stock: 35, featured: false },
    { name: 'The Art of Coding', slug: 'the-art-of-coding', description: 'A comprehensive guide to writing clean, maintainable code.', price: 49900, categorySlug: 'books', stock: 120, featured: true },
    { name: 'Design Patterns', slug: 'design-patterns', description: 'Modern design patterns for web applications.', price: 59900, categorySlug: 'books', stock: 90, featured: false },
    { name: 'JavaScript: The Good Parts', slug: 'javascript-good-parts', description: 'Deep dive into the best features of JavaScript.', price: 39900, categorySlug: 'books', stock: 150, featured: false },
    { name: 'Yoga Mat', slug: 'yoga-mat', description: 'Non-slip, eco-friendly yoga mat with carrying strap.', price: 299900, categorySlug: 'sports-outdoors', stock: 65, featured: true },
    { name: 'Water Bottle', slug: 'water-bottle', description: 'Insulated stainless steel water bottle.', price: 199900, categorySlug: 'sports-outdoors', stock: 200, featured: false },
    { name: 'Resistance Bands Set', slug: 'resistance-bands-set', description: 'Set of 5 resistance bands with different tension levels.', price: 149900, categorySlug: 'sports-outdoors', stock: 85, featured: false },
  ];

  const categoryMap: Record<string, number> = {};

  for (const cat of categoriesData) {
    // Use find or create pattern (idempotent)
    const existing = await documents('api::category.category').findFirst({
      filters: { slug: cat.slug },
    });
    if (existing) {
      categoryMap[cat.slug] = existing.id;
    } else {
      const created = await documents('api::category.category').create({
        data: { name: cat.name, slug: cat.slug, description: cat.description },
        status: 'published',
      });
      categoryMap[cat.slug] = created.id;
    }
  }

  for (const prod of productsData) {
    const existing = await documents('api::product.product').findFirst({
      filters: { slug: prod.slug },
    });
    if (existing) continue;
    await documents('api::product.product').create({
      data: {
        name: prod.name,
        slug: prod.slug,
        description: prod.description,
        price: prod.price,
        comparePrice: prod.comparePrice || null,
        stock: prod.stock || 0,
        featured: prod.featured || false,
        category: categoryMap[prod.categorySlug],
      },
      status: 'published',
    });
  }

  console.log(`Seed complete: ${categoriesData.length} categories, ${productsData.length} products (all published).`);
  process.exit(0);
}
seed().catch((e) => { console.error(e); process.exit(1); });
```

### 9.2 Add Seed Script to package.json 🤖 AGENT
```json
{
  "scripts": {
    "develop": "strapi develop",
    "start": "strapi start",
    "build": "strapi build",
    "strapi": "strapi",
    "seed": "tsx scripts/seed.ts"
  }
}
```

### 9.3 Run the Seed Script 🤖 AGENT
```bash
cd backend
npm run seed
```

### 9.4 Verify Seed Data 🤖 AGENT
```bash
curl -H "Authorization: Bearer $STRAPI_API_TOKEN" \
  "http://localhost:1337/api/products?populate=category" | json_pp
curl -H "Authorization: Bearer $STRAPI_API_TOKEN" \
  "http://localhost:1337/api/categories?populate=*" | json_pp
```
Expected: `data` arrays with `documentId`, `publishedAt` non-null, and `category` resolved.

---

## 10. Frontend Integration (Agent Tasks)

> 🤖 AGENT — all of §10 is implemented by the agent (Implementation Plan Stages 3, 6). **Use explicit `populate`, never `populate=*` in app code.**

### 10.1 Strapi API Client (`src/lib/strapi.ts`)
```typescript
const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;

async function strapiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${STRAPI_URL}/api${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(STRAPI_TOKEN ? { Authorization: `Bearer ${STRAPI_TOKEN}` } : {}),
    ...(options.headers as Record<string, string>),
  };
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    throw new Error(`Strapi API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}
```
Types (`StrapiProduct`, `StrapiCategory`, `StrapiImage`, list/single responses) mirror `backend/src/api/*/content-types/*/schema.json` (HLD §7.1). Price is `number` (whole INR).

### 10.2 Query builders with explicit populate (`src/lib/strapi-queries.ts`)
```typescript
import qs from 'qs';

// NO populate=* — use explicit fields via qs array serialization
export async function getProducts(params?: { category?: string; sort?: string }) {
  const query = qs.stringify(
    {
      populate: ['category', 'images'], // qs serializes to populate[0]=category&populate[1]=images
      ...(params?.category ? { filters: { category: { slug: { $eq: params.category } } } } : {}),
      ...(params?.sort ? { sort: params.sort } : {}),
    },
    { encodeValuesOnly: true }
  );
  return strapiFetch<StrapiListResponse<StrapiProduct>>(`/products?${query}`);
}
```

### 10.3 Image URL Helper (`src/lib/utils.ts`)
```typescript
export function strapiMedia({ url }: { url?: string }): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${process.env.NEXT_PUBLIC_STRAPI_API_URL}${url}`;
}
```

### 10.4 Next.js Image Configuration (`next.config.ts`)
```typescript
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '1337', pathname: '/uploads/**' },
      { protocol: 'https', hostname: '**.picsum.photos' },
    ],
  },
};
export default nextConfig;
```

---

## 11. Testing the Integration

### 11.1 Verification Checklist (automated) 🤖 AGENT
The agent (or CI) runs these checks — no human step:
```bash
# 1. Health
curl http://localhost:1337/_health

# 2. Products (token + explicit populate)
curl -H "Authorization: Bearer $STRAPI_API_TOKEN" \
  "http://localhost:1337/api/products?populate=category"

# 3. Single product by slug
curl -H "Authorization: Bearer $STRAPI_API_TOKEN" \
  "http://localhost:1337/api/products?filters[slug][$eq]=wireless-headphones&populate=category"

# 4. Categories
curl -H "Authorization: Bearer $STRAPI_API_TOKEN" \
  "http://localhost:1337/api/categories?populate=*"

# 5. Token auth (valid vs invalid)
curl -H "Authorization: Bearer $STRAPI_API_TOKEN" http://localhost:1337/api/products   # 200
curl -H "Authorization: Bearer invalid" http://localhost:1337/api/products               # 401

# 6. CORS preflight from the frontend origin
curl -X OPTIONS http://localhost:1337/api/products \
  -H "Origin: http://localhost:3000" -H "Access-Control-Request-Method: GET" -v 2>&1 \
  | grep -i "access-control"
# Expected: Access-Control-Allow-Origin: http://localhost:3000
```

### 11.2 MSW Handlers (unit/integration) 🤖 AGENT
Mirror the **flattened** Strapi v5 response and the **explicit-populate** contract. No `populate=*` in app requests. Handlers assert on `documentId`, `name`, `price`, resolved `category`.

### 11.3 E2E with real Strapi 🤖 AGENT
E2E (Playwright) hits the **real seeded Strapi (Stage 2)** because product/category pages are RSC server-fetched (browser MSW cannot mock them). `@msw/playwright` is used only for client-only mocks. Required seeded slugs: `wireless-headphones`, `cotton-tshirt`, `electronics`, `clothing`.

---

## 12. Troubleshooting

| Issue | Symptom | Cause | Solution |
|-------|---------|-------|----------|
| **CORS Error** | `No 'Access-Control-Allow-Origin'` | `CLIENT_URL` not set/wrong | Set `CLIENT_URL=http://localhost:3000` in `backend/.env`; restart |
| **401 Unauthorized** | API returns `401` | Invalid/missing token | Re-run the bootstrap token creation (§6.4); update `STRAPI_API_TOKEN` in `.env.local` |
| **403 Forbidden** | API returns `403` | Wrong token type / no permission | Use the **Read-only** token; content types are private by design (§8) |
| **Empty Data** | `{"data":[]}` though data exists | Entries are **drafts** (not published) | Publish products **and** categories, or re-run seed with `status:'published'` (§9) |
| **404 Not Found** | Wrong endpoint | Path mistake | Use `/api/products` not `/api/product` |
| **Image Not Loading** | Broken image | Wrong URL | Use `strapiMedia()` to prepend `NEXT_PUBLIC_STRAPI_API_URL` |
| **Port Conflict** | `EADDRINUSE` | Port 1337 in use | `lsof -ti:1337 | xargs kill` or change `PORT` |
| **Database Locked** | `SQLITE_BUSY` | Multiple instances | Run only one Strapi at a time |

---

## 13. Production Considerations

### 13.1 Moving to PostgreSQL
```bash
DATABASE_CLIENT=postgres
DATABASE_HOST=your-db-host.com
DATABASE_PORT=5432
DATABASE_NAME=aurastore_prod
DATABASE_USERNAME=aurastore
DATABASE_PASSWORD=secure_password
DATABASE_SSL=true
```

### 13.2 S3 Media Storage (optional)
```bash
npm install @strapi/provider-upload-aws-s3
```
Configure in `backend/config/plugins.ts` with `AWS_ACCESS_KEY_ID`, `AWS_ACCESS_SECRET`, `AWS_REGION`, `AWS_S3_BUCKET` (env-driven).

### 13.3 Environment-Specific Configs
```bash
# backend/.env.development
DATABASE_CLIENT=sqlite
CLIENT_URL=http://localhost:3000

# backend/.env.production
DATABASE_CLIENT=postgres
DATABASE_HOST=prod-db.example.com
DATABASE_NAME=aurastore_prod
DATABASE_USERNAME=aurastore
DATABASE_PASSWORD=secure_password
DATABASE_SSL=true
CLIENT_URL=https://aurastore.example.com
PUBLIC_URL=https://cms.aurastore.example.com
```

### 13.4 Backup Strategy
```bash
# SQLite
cp backend/.tmp/data.db backend/backups/data-$(date +%Y%m%d).db
# PostgreSQL
pg_dump -U aurastore aurastore_prod > backend/backups/dump-$(date +%Y%m%d).sql
```

### 13.5 Production Checklist
- [ ] PostgreSQL (not SQLite)
- [ ] CDN for media (S3 + CloudFront)
- [ ] `PUBLIC_URL` set to Strapi domain
- [ ] Database connection pooling
- [ ] Regular backups
- [ ] HTTPS via reverse proxy / platform
- [ ] Environment-specific `.env` files

---

## Appendix A — Phase 2 (Out of Scope): Razorpay & Order

> **NOT part of Phase 1.** Listed here only as a forward reference. Do **not** implement during Phase 1.

### A.1 Razorpay Account 🧑 HUMAN (Phase 2)
1. https://dashboard.razorpay.com → Settings → API Keys → Generate Key.
2. Copy `RAZORPAY_KEY_ID` (`rzp_test_…`), `RAZORPAY_KEY_SECRET`.
3. Webhook: `Settings → Webhooks` → `http://localhost:3000/api/webhooks/razorpay`, event `payment.captured`, copy webhook secret.

### A.2 `Order` Content Type 🤖 AGENT (Phase 2)
Fields: `clerkUserId` (text, indexed), `items` (JSON), `total` (decimal), `status` (enum: `pending`/`paid`/`failed`/`refunded`), `paymentId`, `razorpayOrderId`, `address` (JSON), `email` (email), `phone` (text). Server-side token (Custom) for create/find/findOne/update.

### A.3 Phase 2 Frontend Env Vars
```
NEXT_PUBLIC_RAZORPAY_KEY_ID = rzp_test_...
RAZORPAY_KEY_SECRET = ...
RAZORPAY_WEBHOOK_SECRET = ...
```

---

*This guide covers Strapi v5 setup for AuraStore Phase 1 (Clerk auth + Product/Category catalog). Razorpay/Order are Phase 2 (Appendix A). Strapi provisioning is fully agent-automated.*
*Last updated: July 14, 2026*
