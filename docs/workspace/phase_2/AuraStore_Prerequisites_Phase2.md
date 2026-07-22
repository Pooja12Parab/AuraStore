# AuraStore — Prerequisites (Phase 2: Mandatory)

> **Project:** AuraStore: The Modern Consumer App
> **Version:** 1.0
> **Status:** Draft
> **Date:** July 21, 2026
> **Document Type:** **Human / External-only** Pre-Implementation Checklist (Phase 2)
> **Parent Documents:** [AuraStore HLD](../AuraStore_HLD.md) · [AuraStore Requirements](../AuraStore_Requirements.md) · [AuraStore LLD Phase 2](./AuraStore_LLD_Phase2.md) · [AuraStore Testing HLD](../AuraStore_Testing_HLD.md) · [Phase 1 Prerequisites](./AuraStore_Prerequisites_Phase1.md)
> **Phase:** Phase 2 — Mandatory (Shopping cart, Razorpay checkout, order management)
> **Audience:** Developer / DevOps (human performing setup)
>
> ⚠️ **SCOPE OF THIS DOCUMENT:** This is a **human / external-dependency-only** checklist for Phase 2. It lists ONLY what a human must do that **cannot be scripted** — creating the Razorpay account/keys and ensuring Phase 1 readiness. **All other Phase 2 setup** (Order content type in Strapi, Razorpay SDK wiring, webhook signature verification, cart state module, checkout pages, /api/orders routes, webhooks) is performed by the **agent** in the [Phase 2 Implementation Plan](./AuraStore_Phase2_Implementation_Plan.md).
> - All **scriptable / agent** work (Strapi `Order` schema, `lib/cart.ts`, `lib/razorpay.ts`, `POST /api/orders/create`, `POST /api/webhooks/razorpay`, checkout pages, /orders pages, Sonner toaster, tests) lives in the **[Implementation Plan](./AuraStore_Phase2_Implementation_Plan.md)**.
> **Scope guard:** Phase 2 only. **Vercel, animations, dark mode, search/sort, wishlist, SEO and accessibility hardening are intentionally omitted** (Phase 3).

---

## 1. Phase 1 Readiness Gate (HUMAN — verify, do not redo)

Phase 2 builds **on top of** Phase 1. Confirm every item before starting Phase 2 — re-running Phase 1 setup is **not** required.

- [ ] Phase 1 deliverables complete (see [Phase 1 Implementation Plan §3 Stage Map](./AuraStore_Phase1_Implementation_Plan.md))
  - [ ] Next.js 16 frontend running on `localhost:3000`
  - [ ] Strapi v5 backend running on `localhost:1337` with seeded + **published** Products & Categories
  - [ ] Clerk sign-in works with the `+clerk_test` test user (OTP `424242`)
  - [ ] All **35** Phase 1 tests pass locally (`npm run test`, `npm run test:e2e`)
- [ ] All Phase 1 environment variables are present in `.env.local`:
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
  - `NEXT_PUBLIC_STRAPI_API_URL`, `STRAPI_API_TOKEN`
  - `E2E_CLERK_USER_EMAIL`, `E2E_CLERK_USER_PASSWORD`

> If any Phase 1 item is missing, **stop** and complete Phase 1 first. Do not start Phase 2 work on an unfinished Phase 1 baseline.

---

## 2. Razorpay — **REQUIRED (Phase 2, HUMAN / EXTERNAL)**

Razorpay is the payment gateway. We use **Test Mode** for all local + E2E work; Live Mode is for production only.

### 2.1 Create a Razorpay account
1. Sign up / log in at [dashboard.razorpay.com](https://dashboard.razorpay.com).
2. Verify your account (email + business details). For local + E2E, **Test Mode is sufficient** — no KYC/business verification required.
3. Confirm the toggle in the top bar reads **Test Mode** (keys begin `rzp_test_…`). Test and Live are **separate** environments — different keys, different webhooks, different test cards.

### 2.2 Copy the API keys
4. **Settings → API Keys** → **Generate Test Key** (if not already generated):
   - **Key ID** (`rzp_test_…`) → `NEXT_PUBLIC_RAZORPAY_KEY_ID` (public — exposed to the browser)
   - **Key Secret** → `RAZORPAY_KEY_SECRET` (server-only — **never** `NEXT_PUBLIC_`)
5. Record both. The Key Secret is **shown once** — copy immediately.

### 2.3 Create a Webhook (for local development)
The Next.js webhook handler will receive `payment.captured` events from Razorpay. Local development uses a **public tunnel** so Razorpay can reach `localhost:3000`.

6. **Install a tunneling tool** (pick one):
   - [ngrok](https://ngrok.com/download) — `ngrok http 3000`
   - [Cloudflare Tunnel (`cloudflared`)](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) — `cloudflared tunnel --url http://localhost:3000`
7. Start the tunnel and copy the **public HTTPS URL** (e.g. `https://a1b2c3.ngrok-free.app`).
8. **Settings → Webhooks → Create New Webhook**:
   - **Webhook URL:** `<public-tunnel-url>/api/webhooks/razorpay`
   - **Active Events:** `payment.captured` (mandatory), `payment.failed` (recommended)
   - **Secret:** click **Generate** → copy the value → `RAZORPAY_WEBHOOK_SECRET` (server-only)
9. Copy the **Webhook Secret** into `.env.local` immediately — it is shown only once.

> **Tip for E2E:** the Playwright E2E for the Razorpay modal **does not** need the tunnel — the modal is launched in the browser and the test card (`4111 1111 1111 1111`) completes payment client-side. The tunnel is required only when you want to exercise the **server-side webhook** flow end-to-end (covered by integration tests, not browser E2E).

### 2.4 Test card (no real money moves)
10. **Test card** (provided by Razorpay):
    - **Number:** `4111 1111 1111 1111`
    - **Expiry:** any future date
    - **CVV:** any 3 digits
    - **Name:** anything
    - **OTP / 3DS:** none required for this test card
11. **Failure test card:**
    - **Number:** `4000 0000 0000 0002`
    - Rest same as above → Razorpay returns `payment_failed`

### 2.5 Verify Razorpay is ready
- From your terminal: `curl -u "<KEY_ID>:<KEY_SECRET>" https://api.razorpay.com/v1/payments?count=1` → expect `{"count":0, "items":[]}` in Test Mode.
- In the dashboard: confirm Test Mode toggle is on, your Key ID is `rzp_test_…`, and the webhook appears under **Active Webhooks**.

**Where the values go (names only — the agent creates/updates `.env.local`):**

| Variable | Visibility | Source |
|----------|-----------|--------|
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Public | Razorpay API Keys (Test Mode) |
| `RAZORPAY_KEY_SECRET` | **Server-only** | Razorpay API Keys (Test Mode) |
| `RAZORPAY_WEBHOOK_SECRET` | **Server-only** | Razorpay Webhooks (Generate) |

---

## 3. Strapi — **AGENT-AUTOMATED (Order content type + permission)**

> No human action is required for Strapi in Phase 2. The agent extends the existing Strapi v5 instance (built in Phase 1 Stage 2):
> - Adds the **`Order`** collection type (`clerkUserId`, `items` JSON, `total`, `status` enum, `paymentId`, `razorpayOrderId`, `address` JSON, `email`, `phone`) — per [HLD §7.1 Order](../AuraStore_HLD.md)
> - Creates an API Token for the existing Strapi Admin (or reuses the Phase 1 read-only token for `GET` and adds a **read-write** token for order create/update from the Next.js server)
> - Writes an `Order` seed script that creates one `paid` + one `pending` order for the `+clerk_test` Clerk user (used by the Phase 2 `/orders` E2E)
> - Verifies with `curl` that `GET /api/orders?filters[clerkUserId][$eq]=…` returns 200

The agent does **not** need any additional values from you.

---

## 4. Clerk — **NO NEW SETUP** (Phase 1 contract carries over)

> Phase 2 adds **`/checkout` and `/orders`** to the protected route list, but Clerk itself does not require any new configuration:
> - The `+clerk_test` test user from Phase 1 is reused for Phase 2 E2E (sign-in → add to cart → checkout → pay).
> - The webhook receiver is **not** gated by Clerk; it is gated by Razorpay HMAC signature verification only.
> - `auth.protect()` in the `/checkout` Server Component provides defense-in-depth (see [HLD §9.2](../AuraStore_HLD.md)).

---

## 5. Secrets Handling & Security (HUMAN)

Update `.env.local` with the new Phase 2 keys. **Public** keys (`NEXT_PUBLIC_RAZORPAY_KEY_ID`) are safe in the client bundle. **Server-only** keys are NEVER exposed:

- **Public** (added): `NEXT_PUBLIC_RAZORPAY_KEY_ID`.
- **Server-only** (added): `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, **`STRAPI_API_TOKEN_WRITE`** (agent-generated in [Implementation Plan §Stage 1.2c](./AuraStore_Phase2_Implementation_Plan.md)).
- **Server-only** (carried over): `CLERK_SECRET_KEY`, `STRAPI_API_TOKEN` (Phase 1 read-only — unchanged), `E2E_CLERK_USER_EMAIL`, `E2E_CLERK_USER_PASSWORD`.
- **Vercel env (later, when deploying):** add the same Phase 2 variables to the Vercel project. **Never commit secrets.**

> **Why two Strapi tokens?** Phase 1's `STRAPI_API_TOKEN` has only `Read` on `Product`+`Category`. Phase 2 adds `STRAPI_API_TOKEN_WRITE` with `Read`+`Write`+`Update` on `Order` only — so a Phase 1-style compromise of the read token cannot create orders. The agent creates this token in Strapi Settings → API Tokens → Create new (Custom, scopes `Read`+`Write`+`Update` on `Order`, nothing else).

`.env.local` (Phase 2, full set):

```bash
# Clerk (carried over from Phase 1)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_…
CLERK_SECRET_KEY=sk_test_…
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Strapi (Phase 1 read-only — UNCHANGED)
NEXT_PUBLIC_STRAPI_API_URL=http://localhost:1337
STRAPI_API_TOKEN=…              # Phase 1 read-only: Product + Category Read

# Strapi (NEW Phase 2 — write order)
STRAPI_API_TOKEN_WRITE=…        # Order Read + Write + Update ONLY

# App (carried over from Phase 1)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# E2E (carried over from Phase 1)
E2E_CLERK_USER_EMAIL=testuser+clerk_test@example.com
E2E_CLERK_USER_PASSWORD=TestPass123!

# Razorpay (NEW in Phase 2)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_…
RAZORPAY_KEY_SECRET=…
RAZORPAY_WEBHOOK_SECRET=…
```

> Secrets are never committed. The agent adds the new variables to `.gitignore` (already ignored) and verifies with `git status` before any commit.

---

## 6. Port & Local Dev Readiness (HUMAN)

- [ ] Port `3000` (Next.js) and `1337` (Strapi) free.
- [ ] Phase 1 `npm run dev` and `npm run develop` (in `backend/`) both start without errors.
- [ ] *(Optional, for webhook E2E)* ngrok or cloudflared installed; `ngrok http 3000` returns a public HTTPS URL.
- [ ] Razorpay dashboard **Test Mode** is ON.

---

## 7. Phase 2 Pre-Implementation Readiness Checklist (HUMAN)

- [ ] Phase 1 readiness gate green (Section 1)
- [ ] Razorpay account created; **Test Mode** toggle ON
- [ ] `NEXT_PUBLIC_RAZORPAY_KEY_ID` (Key ID, `rzp_test_…`) obtained
- [ ] `RAZORPAY_KEY_SECRET` obtained and recorded
- [ ] Webhook created with URL `<tunnel>/api/webhooks/razorpay` and events `payment.captured`, `payment.failed`
- [ ] `RAZORPAY_WEBHOOK_SECRET` obtained and recorded
- [ ] (Optional) ngrok or cloudflared installed and a public tunnel URL is reachable
- [ ] Test card `4111 1111 1111 1111` and failure card `4000 0000 0000 0002` noted
- [ ] All three new Razorpay values stored in `.env.local` (server-only keys not committed)
- [ ] `curl -u "<KEY_ID>:<KEY_SECRET>" https://api.razorpay.com/v1/payments?count=1` returns `200`

> Strapi `Order` content type, tokens, seed, and verification are performed by the **agent** in Implementation Plan Stage 1.

---

## 8. Open Items the Human Should Know

- **Webhook delivery in local dev** requires a public tunnel (ngrok/cloudflared). Without it, integration tests can still verify HMAC signature logic locally using a synthetic payload, but the **real** Razorpay → your-server round trip is only possible with a tunnel.
- **Test vs Live:** Razorpay Test and Live are different environments. Do **not** mix `rzp_test_` and `rzp_live_` keys. Production deploy (Phase 3) will require re-running Section 2 against a Live Mode account.
- **Phase 3 will add:** rate limiting on `/api/orders/create`, security headers via `proxy.ts`, and additional observability. No Phase 2 prerequisite is affected.

---

## Sources (internet, researched 2026-07-21)

- **Razorpay:** Test Mode vs Live Mode; API Keys (`rzp_test_` prefix); Webhooks (event subscription, signing secret, retry policy); Standard Test Card (`4111 1111 1111 1111`, any future expiry, any CVV, no 3DS); Failure Test Card (`4000 0000 0000 0002`); Node SDK (`razorpay` npm — `Razorpay({ key_id, key_secret }).orders.create({ amount, currency })`); Checkout.js (`<script src="https://checkout.razorpay.com/v1/checkout.js">` — options `key`, `order_id`, `amount`, `currency`, `handler`, `modal.ondismiss`); Webhook signature verification (`crypto.createHmac('sha256', secret).update(rawBody).digest('hex')`).
- **Strapi v5:** collection types with `enum`, `json`, `email` fields; permissions via Roles & Permissions plugin; token scopes (`read`, `write`, `full-access`); query filters (`filters[field][$eq]=value`).
- **Clerk v7:** `auth.protect()` (server) for protected pages; `+clerk_test` test-user convention (carried over from Phase 1).

---

*Phase 2 only. Vercel deploy, animations, dark mode, search/sort, wishlist, SEO and accessibility prerequisites are intentionally excluded and covered in the Phase 3 prerequisite doc.*
*Last updated: July 21, 2026*
