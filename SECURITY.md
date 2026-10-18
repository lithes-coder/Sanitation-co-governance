# Security Policy

## Overview

SCGIP (Sanitation Co-Governance Intelligence Platform) is a civic web application for reporting, tracking, and collaboratively verifying sanitation complaints across 8 wards. This document describes the security model, known findings, responsible disclosure, and out-of-scope areas.

## Live deployment

- **Production URL:** `https://sanitation-co-governance-platform.vercel.app`
- **Stack:** Next.js 16 (App Router) · Prisma 6 · Neon PostgreSQL (production) / SQLite (local dev) · custom HMAC session auth · Vercel
- **Authentication model:** custom HMAC-signed session cookies (`scgip_session`). This is **not** built on NextAuth / Auth.js — it is a bespoke session layer using `AUTH_SECRET`-signed cookies with `HttpOnly`, `Secure`, and `SameSite=lax` flags.

## Security model

### Authentication

- Session cookies are HMAC-SHA256 signed with `AUTH_SECRET`.
- Token payload carries `{ email, iat }`; `iat` is now checked (token rejected if older than 7 days).
- Session cookie flags: `HttpOnly`, `Secure`, `SameSite=lax`, 7-day `Max-Age`.
- Registration is citizen-only; the server hardcodes `role: "citizen"`. Role injection in the registration body is ignored.
- Staff accounts (officer, admin) are created by an admin via `POST /api/admin/users`. Citizens cannot be created through the admin endpoint.

### Authorization

- Role-based access control. Roles: `citizen`, `officer`, `admin`.
- Object-level authorization on complaints: a citizen can only read/act on their own complaints. Foreign complaint reads return `404` (no existence oracle), foreign rate/confirm actions return `403`, admin-only and officer-only endpoints return `401` for unauthorized roles.
- Admin-only endpoints: user management, manual status changes, legacy import.
- Officer-only endpoints: verify, assign, resolve.

### Server-side

- Prisma is used with parameterized queries; NoSQL/operator injection probes have been tested and return normal 401s (Prisma string-casts inputs).
- A tamper-evident audit log chains rows via SHA-256 (`prevHash` → `hash`).
- Realtime updates use an in-process pub/sub bus plus SSE for live complaint/notification updates; on serverless hosts (Vercel), an 8s visibility-poll fallback keeps updates fresh.

### Headers

The following response headers are set site-wide:

- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Frame-Options: DENY`
- `Content-Security-Policy` (default-src self; script/style self + unsafe-inline + unsafe-eval; img self/data/blob + OpenStreetMap tiles; connect self + Nominatim; frame-ancestors none; base-uri self; form-action self)
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(self), camera=(), microphone=()`
- `X-DNS-Prefetch-Control: on`
- `poweredByHeader: false`

## Known findings

### Resolved / in code

The following were addressed in code. To take effect on the live deployment they must be deployed.

- **F-01 (HIGH):** Authority webhook `POST /api/authority/webhook` was fail-open when `AUTHORITY_WEBHOOK_SECRET` was unset. Fixed in code: the endpoint now fails **closed** (`const secret = process.env.AUTHORITY_WEBHOOK_SECRET; if (!secret || ...) → 403`). To fully close this in production, set `AUTHORITY_WEBHOOK_SECRET` to a strong random value in Vercel environment variables. Until the corporation integration is live, the endpoint correctly rejects everything.
- **F-02 (MEDIUM):** No login rate limiting. Fixed in code with a lightweight in-memory throttle in `lib/server/auth.ts` + `app/api/auth/login/route.ts`: 5 failed attempts per normalized email → temporary lockout with `Retry-After`, progressive backoff, capped. Successful login resets the counter. This is a stopgap for small deployments; for larger or multi-instance traffic it should be replaced with a shared store (e.g. Upstash Redis / Vercel KV) or a Vercel WAF rate rule on `POST /api/auth/login`.
- **F-03 (MEDIUM):** Session cookie missing `Secure` flag. Fixed in code: `setSessionCookie` now sets `secure: true`.
- **F-04 (MEDIUM):** AI chatbot `POST /api/chat` was unauthenticated. Fixed in code: `POST` now requires a live session (`requireRole(["citizen","officer","admin"])`); `GET` (health check) stays public.
- **F-06 (LOW):** Session token had no internal expiry. Fixed in code: `getCurrentUser` now rejects tokens whose `iat` is older than 7 days.

### Open / lower priority

- **F-05 (LOW):** Registration endpoint returns `409` when an email already exists, which can be used to enumerate registered emails. Accepted risk for a civic platform; can be hardened (e.g. always return 200 + send an email) if desired.

## Chat / AI surface

The chatbot currently runs as a **knowledge-base prototype**: a regex pattern-matched QA layer with a fallback to a FastAPI sidecar only when `FASTAPI_URL` is configured and reachable. On the live deployment, no FastAPI sidecar is attached, so the chatbot runs in knowledge-base mode. It is not backed by a live LLM, vector database, or agent orchestration in the deployed build.

The **AI Governance Dashboard** (`/admin/watsonx`) is a **prototype** layered on top of SCGIP's real data model. It is **not** wired to IBM watsonx, Ollama, FAISS, LangGraph, LangChain, or any external AI service. The metrics, sentiment, and asset-health views are computed from actual SCGIP complaint records at render time, but the "AI" framing is illustrative — it is a design probe for how a civic platform could expose AI-assisted governance oversight, not a claim that these AI services are deployed.

## Testing performed

- Manual, evidence-based penetration testing (owner-directed, on the owner's own production application), with captured Proof-of-Concept evidence. See `security-reports/SCGIP-Pentest-2026-09-25.md` for the full report.
- An automated multi-agent scan (Strix) was also attempted against the production URL; it did not produce findings within the available quota window. All confirmed findings in this report come from the manual verified suite.

## Responsible disclosure

This is the owner's own application. If you find a security issue in the live deployment:

1. Do **not** exploit it against real users or real data.
2. Email the owner with a description, the affected URL, and a minimal reproducible request. Include the words **"SCGIP security report"** in the subject.
3. Allow reasonable time for a fix before disclosing publicly.

Do not brute-force, flood, or run high-volume fuzzing against the production URL — real users are on it.

## Out of scope

- Vercel and Neon platform-level attack surface (out of application scope).
- DoS, flooding, or high-volume fuzzing (excluded to protect real users).
- Stored XSS payloads injected into the production complaint DB (would pollute real user data). JSX auto-escaping has been reviewed in code — no `dangerouslySetInnerHTML` in complaint rendering paths. Test XSS on a staging/local copy.
- The FastAPI agenticAI sidecar when it is not deployed to production.

## Environment and secrets

- `AUTH_SECRET` — session cookie signing key. Use a strong random value in production. Never commit it.
- `DATABASE_URL` — database connection string (local dev uses SQLite via `DATABASE_URL`; production uses Neon PostgreSQL).
- `AUTHORITY_WEBHOOK_SECRET` — shared secret for the corporation inbound webhook. Must be set in production to close F-01. Until set, the webhook rejects all requests.
- `FASTAPI_URL` — optional; only used when the Python sidecar is reachable. If absent or unreachable, the chatbot runs in knowledge-base mode.
- No platform credentials or session tokens are stored in project files, browser storage, logs, or public assets.

## Local development

- `npm run dev` — start the Next.js dev server.
- `npm run build` — production build.
- `npm run start` — start the built app locally (needs a running DB).
- `npm run start:prod` — deploy-style local start: `prisma migrate deploy && tsx scripts/prod-init.ts && next start`.
- `npm run db:migrate` — dev migrations.
- `npm run db:seed` — seed dev data (`tsx prisma/seed.ts`).
- `npm run test` — severity engine tests (`tsx lib/server/severity.test.ts`).
- `npm run lint` — ESLint.

Environment variables for local dev go in `.env.local` (git-ignored). Do not commit `.env*` files that contain real secrets.
