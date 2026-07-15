# AuraStore — Prerequisites (Phase 1: Basic/MVP)

> **Project:** AuraStore: The Modern Consumer App
> **Version:** 1.0
> **Status:** Draft
> **Date:** July 14, 2026
> **Document Type:** **Human / External-only** Pre-Implementation Checklist (Phase 1)
> **Parent Documents:** [AuraStore HLD](../AuraStore_HLD.md) · [AuraStore Requirements](../AuraStore_Requirements.md) · [AuraStore LLD Phase 1](./AuraStore_LLD_Phase1.md) · [AuraStore Testing HLD](../AuraStore_Testing_HLD.md)
> **Phase:** Phase 1 — Basic/MVP (Clerk auth, Strapi product catalog, product browsing, layout)
> **Audience:** Developer / DevOps (human performing setup)
>
> ⚠️ **SCOPE OF THIS DOCUMENT:** This is a **human / external-dependency-only** checklist. It lists ONLY what a human must do that **cannot be scripted** — installing the local runtime and creating the external Clerk account/keys. **Everything Strapi-related is automated by the agent** (install, first-run admin, API token, content types, CORS, seed, verification) and is therefore NOT listed here as a human task.
> - All **scriptable/agent** work (scaffolding the Next app, all Strapi setup, `schema.json`, CORS, seed, verification, frontend code) lives in the **[Implementation Plan](./AuraStore_Phase1_Implementation_Plan.md)** and the **[Strapi Setup Guide](../AuraStore_Strapi_Setup_Guide.md)**.
> **Scope guard:** Phase 1 only. **Razorpay and Vercel are intentionally omitted** (Phase 2 prerequisite doc).

---

## 1. Local Development Environment (HUMAN — local runtime)

- [ ] **Install Node.js v22.x** (required by Next.js 16). Verify: `node -v` → `v22.x`.
- [ ] **Install a package manager** (npm or pnpm); pick one and use it consistently.
- [ ] **Free the dev ports:** frontend `3000`, Strapi `1337`.
- [ ] *(Optional)* **Clerk CLI** (`npm i -g @clerk/clerk`) for `clerk auth login` / `clerk doctor`.

> The agent scaffolds the frontend and the entire Strapi backend (including first-run admin + API token + seed + verification). You only ensure the runtime and the Clerk account/keys below.

---

## 2. Clerk — **REQUIRED (Phase 1, HUMAN / EXTERNAL)**

*(Source: Clerk Docs — Testing, Playwright test helpers, sign-up flows, API keys.)*

### 2.1 Create the application
1. Sign up / log in at [dashboard.clerk.com](https://dashboard.clerk.com).
2. **Create a new application** named `AuraStore`.
3. Confirm the instance is in **Development** mode (keys begin `pk_test_` / `sk_test_`). Dev and Live are **separate instances** — different users and keys. Use dev for local + E2E.

### 2.2 Enable Email + Password
4. **User & authentication → Email**: ensure **Email** is enabled.
5. **User & authentication → Password**: ensure **Password** is enabled (Phase 1 sign-in method).

### 2.3 Copy the API keys (shown once)
6. **API Keys** page → copy:
   - **Publishable Key** → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (public)
   - **Secret Key** (`sk_test_…`) → `CLERK_SECRET_KEY` (server-only; shown once)

### 2.4 Create the E2E TEST USER (critical — avoids the real-email OTP trap)
7. Create a **real user in the dev instance** whose email uses the **`+clerk_test` suffix**. Per Clerk's documented test-account contract, any address with `+clerk_test` is treated as a test user: verification uses the **fixed OTP `424242`**, **no real email/SMS is sent**, and MFA is bypassed — **dev instances only**.
   - **Email:** `testuser+clerk_test@example.com` (domain is arbitrary; the `+clerk_test` part is mandatory)
   - **Password:** one you control, e.g. `TestPass123!`
   - Create via **Dashboard → Users → Create user**, or by signing up through the app.
8. Record as:
   - `E2E_CLERK_USER_EMAIL` = the `+clerk_test` email
   - `E2E_CLERK_USER_PASSWORD` = the password

> ⚠️ A test user **without** `+clerk_test` triggers a real email/SMS OTP and may require MFA — that is the failure mode to avoid. The suffix is non-negotiable for reliable E2E.

### 2.5 OTP handling in E2E
If an OTP / device-trust screen appears during sign-in, enter the test OTP **digit by digit**:
- Email placeholder: `Enter your email address`
- Password placeholder: `Enter your password`
- Continue button: `Continue` (exact)
- OTP value: `424242` (works with `+clerk_test` emails in dev)

### 2.6 Robust CI sign-in (no OTP at all)
For automated E2E prefer `@clerk/testing`: `clerkSetup()` (global setup) + `clerk.signIn({ page, emailAddress: E2E_CLERK_USER_EMAIL })`. This creates a **server-side sign-in ticket** (Backend API) and bypasses all verification including MFA. **Requires `CLERK_SECRET_KEY`** in the test environment (agent-configured).

### 2.7 Verify Clerk is ready
- Run `npx clerk doctor` (after the agent adds the SDK) — validates key wiring.
- OR manually sign in with the `+clerk_test` test user; if an OTP screen appears, `424242` must succeed.

**Where the values go (names only — the agent creates the file):**

| Variable | Visibility | Source |
|----------|-----------|--------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Public | Clerk API Keys |
| `CLERK_SECRET_KEY` | **Server-only** | Clerk API Keys |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Public | `/sign-in` (optional) |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Public | `/sign-up` (optional) |
| `E2E_CLERK_USER_EMAIL` | **Server-only (test)** | Your `+clerk_test` user |
| `E2E_CLERK_USER_PASSWORD` | **Server-only (test)** | Your test user password |

---

## 3. Strapi — **AGENT-AUTOMATED (no human steps in Phase 1)**

> **No human action is required for Strapi in Phase 1.** The agent provisions the entire backend in Implementation Plan Stage 2 (see [Strapi Setup Guide](../AuraStore_Strapi_Setup_Guide.md) §5–§9):
> - Installs via `npx create-strapi@latest backend --non-interactive`
> - Creates the **first-run admin** via a bootstrap script (POST `/admin/register`) — no browser step needed
> - Generates the **read-only API token** via the admin API — no dashboard copy needed
> - Writes `Product`/`Category` `schema.json`, configures CORS, seeds + publishes data
> - Runs all `curl` verification checks
>
> The only Strapi value the agent needs from you is already covered above: none — the agent generates the token itself and writes it to `.env.local`.

---

## 4. Secrets Handling & Security (HUMAN)

- **Public** (`NEXT_PUBLIC_*`): `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `NEXT_PUBLIC_STRAPI_API_URL`, `NEXT_PUBLIC_APP_URL`.
- **Server-only** (never in the browser bundle): `CLERK_SECRET_KEY`, `STRAPI_API_TOKEN` (agent-generated), and test creds `E2E_CLERK_USER_EMAIL` / `E2E_CLERK_USER_PASSWORD`.
- Clerk Secret Key is **shown only once** — copy immediately into `.env.local` / platform env. The agent generates the Strapi token and stores it. **Never commit secrets.**

---

## 5. Phase 1 Pre-Implementation Readiness Checklist (HUMAN)

- [ ] Node.js v22 installed; ports 3000/1337 free
- [ ] Clerk app created in **Development** mode; Email + Password enabled
- [ ] Clerk **Publishable + Secret keys** obtained
- [ ] Clerk **test user created with `+clerk_test` email suffix**; its OTP is `424242`
- [ ] `E2E_CLERK_USER_EMAIL` / `E2E_CLERK_USER_PASSWORD` recorded
- [ ] `npx clerk doctor` passes (or manual sign-in with test user works, OTP `424242`)
- [ ] All secret values collected and stored securely (not in repo)

> Strapi readiness (running instance, token, content types, seeded + published data, `curl` 200) is **verified by the agent** in Stage 2 — not a human checklist item.

---

## Sources (internet, researched 2026-07-14)

- **Clerk:** API Keys; Testing overview & Testing Tokens; Test emails and phones (`+clerk_test` → OTP `424242`, dev-only); Playwright test helpers (`clerkSetup`, `clerk.signIn({emailAddress})` server ticket); Sign-up flows (field placeholders, `424242` OTP); Next.js quickstart (`proxy.ts` on Next 16+).
- **Strapi 5:** CLI / installation (`create-strapi@latest`, `--non-interactive`, `--quickstart` deprecated); first-run admin via API (`POST /admin/register`); API Tokens via admin API (Read-only); Content-type Builder (dev-mode only, field/relation creation); Draft & Publish (published-by-default, `publishedAt: null` for drafts, relation publish caveat); REST API (flattened `documentId` response, `populate`, `status`); security/CORS (`strapi::cors` origin).

---

*Phase 1 only. Razorpay and Vercel prerequisites are intentionally excluded and covered in the Phase 2 prerequisite doc.*
*Last updated: July 14, 2026*
