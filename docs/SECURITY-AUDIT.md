# Security Audit Report — ReviewPost

**Date:** 2026-03-19  
**Auditor:** Automated Security Audit  
**Scope:** Full codebase (`src/`, config files, dependencies)  
**Branch:** `develop`

---

## Executive Summary

| Severity | Found | Fixed | Acknowledged | Deferred |
|----------|-------|-------|--------------|----------|
| Critical | 5     | 5     | 0            | 0        |
| High     | 3     | 3     | 0            | 0        |
| Medium   | 5     | 1     | 4            | 0        |
| Low      | 3     | 0     | 3            | 0        |
| **Total** | **16** | **9** | **7**       | **0**    |

---

## Findings

### CRITICAL

#### C1. IDOR — `/api/onboarding` accepts arbitrary `businessId`
- **File:** `src/app/api/onboarding/route.ts`
- **Description:** Authenticated users could update/modify any business by supplying a `businessId` not owned by them.
- **Status:** ✅ Fixed — Added ownership check (`business.userId === session.user.userId`) before any mutation.

#### C2. IDOR — `/api/ai/generate-caption` allows `userId` override
- **File:** `src/app/api/ai/generate-caption/route.ts`
- **Description:** The `userId` field in the request body could override the review owner's userId, allowing access to another user's AI key and quota.
- **Status:** ✅ Fixed — Removed `userId` override, added ownership check on review's business, enforced `review.business.userId` as the resolved user.

#### C3. IDOR — `/api/templates/render` has no ownership check
- **File:** `src/app/api/templates/render/route.ts`
- **Description:** Any authenticated user could render templates for any review. Also accepted a `businessId` override.
- **Status:** ✅ Fixed — Added auth + ownership check (`review.business.userId === session.user.userId`), removed `businessId` override.

#### C4. IDOR — `/api/reviews/google` has no ownership check
- **File:** `src/app/api/reviews/google/route.ts`
- **Description:** Any authenticated user could trigger Google review pulls for any `businessId`.
- **Status:** ✅ Fixed — Added auth + ownership check on `businessId`.

#### C5. IDOR — `/api/publishing/publish` has no ownership check
- **File:** `src/app/api/publishing/publish/route.ts`
- **Description:** Any authenticated user could publish any post via arbitrary `postId`.
- **Status:** ✅ Fixed — Added auth + ownership check via `post.review.business.userId`.

### HIGH

#### H1. XSS in Template Rendering — Unescaped HTML injection
- **File:** `src/lib/templates/index.ts`
- **Description:** User-controlled values (`business_name`, `author_name`, `review_text`, `logo_url`) were injected into HTML templates via `.replaceAll()` without escaping. An attacker could store malicious payloads (e.g., `<script>`) in business names or review text that would execute when rendered via Puppeteer.
- **Status:** ✅ Fixed — Added `escapeHtml()` function that escapes `&`, `<`, `>`, `"`, `'`. All template variables are now escaped before injection.

#### H2. Unsafe Raw Query — `$queryRawUnsafe` in health checker
- **File:** `src/lib/monitoring/health.ts:30`
- **Description:** Used `prisma.$queryRawUnsafe('SELECT 1')` instead of the safe tagged template literal version. While no user input was passed, `$queryRawUnsafe` accepts string concatenation and is a bad pattern that could introduce SQL injection if modified later.
- **Status:** ✅ Fixed — Changed to `prisma.$queryRaw\`SELECT 1\``.

#### H3. Missing Security Headers
- **File:** `next.config.mjs`
- **Description:** No security headers were configured. Missing `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy`, and API cache-control headers.
- **Status:** ✅ Fixed — Added all security headers via `next.config.mjs` `headers()` function:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
  - API routes: `Cache-Control: no-store, no-cache, must-revalidate`

### MEDIUM

#### M1. `.env` file tracked in git
- **Description:** `.env` was tracked in git (with only placeholder `xxx` values, no real secrets). However, tracking any `.env` file is a risk vector — developers may accidentally add real values.
- **Status:** ✅ Fixed — Removed `.env` from git tracking (`git rm --cached .env`) and added `.env` to `.gitignore`. The `.env.example` file serves the same purpose for documenting required variables.

#### M2. No rate limiting on most API endpoints
- **Files:** All API routes except `/api/tools/review-score`
- **Description:** Only the public Review Score tool has rate limiting. Other endpoints rely solely on authentication but lack per-user rate limiting. Authenticated users could spam resource-intensive endpoints like `/api/ai/generate-caption` or `/api/templates/render`.
- **Recommendation:** Add per-user rate limiting using Redis + a sliding window algorithm for resource-intensive endpoints. Priority endpoints: `/api/ai/generate-caption`, `/api/templates/render`, `/api/reviews/google`, `/api/publishing/publish`.
- **Status:** 📝 Acknowledged — Requires Redis-based rate limiter (tracked for Phase 2).

#### M3. No input length validation on API routes
- **Files:** Multiple API routes
- **Description:** String inputs (`businessName`, `logoUrl`, `primaryColor`, `selectedTemplate`, `query`) lack maximum length validation. Extremely long inputs could cause performance issues.
- **Recommendation:** Add Zod schema validation for all API request bodies with max length constraints.
- **Status:** 📝 Acknowledged — Tracked for next sprint.

#### M4. No URL validation for `logoUrl`
- **Files:** `src/app/api/onboarding/route.ts`, `src/app/api/settings/brand/route.ts`
- **Description:** `logoUrl` accepts any string value including `javascript:` URIs. Should validate as HTTPS URL only.
- **Recommendation:** Validate `logoUrl` matches `https://` pattern before storing.
- **Status:** 📝 Acknowledged — Tracked for next sprint.

#### M5. No CORS configuration
- **File:** `next.config.mjs`
- **Description:** No explicit CORS policy configured. Next.js defaults to same-origin for API routes, which is acceptable for the current single-domain deployment. If the API is consumed cross-origin in the future, explicit CORS headers should be added.
- **Recommendation:** Add CORS headers if/when cross-origin API access is needed. Current same-origin default is sufficient.
- **Status:** 📝 Acknowledged — Not needed for current architecture (Next.js same-origin).

### LOW

#### L1. npm audit — 13 vulnerabilities (5 moderate, 8 high)
- **Description:** `npm audit` reports 13 vulnerabilities, primarily in `next` (multiple CVEs including DoS via Image Optimizer, HTTP request smuggling) and `lodash` (transitive via `prisma-ast` → `chevrotain`).
- **Details:**
  - **next** (9.5.0–16.1.6): 4 high-severity advisories. Fix available via `npm audit fix --force` (upgrades to Next.js 16.2.0, breaking change).
  - **lodash** (via `@mrleebo/prisma-ast`): Prototype pollution. Transitive dev dependency, not exploitable at runtime.
- **Recommendation:** Schedule Next.js major version upgrade to 16.x to resolve all `next`-related CVEs. The lodash issues are in dev-only transitive deps and not a runtime risk.
- **Status:** 📝 Acknowledged — Next.js upgrade tracked for Phase 2.

#### L2. `Strict-Transport-Security` not set
- **Description:** HSTS header is not configured in `next.config.mjs`.
- **Recommendation:** Add `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` at the reverse proxy level (Nginx/Cloudflare) rather than in Next.js, as HSTS requires HTTPS which is handled by the proxy.
- **Status:** 📝 Acknowledged — Should be configured in production Nginx/Cloudflare config.

#### L3. Email preferences don't enforce boolean type
- **File:** `src/app/api/email/preferences/route.ts`
- **Description:** PUT endpoint stores preference values without strict boolean coercion. Non-boolean values could be stored.
- **Recommendation:** Add `value === true` coercion when storing preferences.
- **Status:** 📝 Acknowledged — Low risk since values are only used as boolean flags internally.

---

## Verification Checklist

### 1. API Key Security ✅
- `.env.local` is in `.gitignore` and was never committed
- `.env` removed from git tracking (only had placeholders)
- No API keys, secrets, or tokens found in any committed source file
- Scanned for: `GOCSPX`, `sk-`, `STRIPE`, `RESEND`, and all known key patterns

### 2. OAuth Token Encryption ✅
- **File:** `src/lib/reviews/google.ts`
- Uses AES-256-GCM (correct algorithm)
- IV is generated via `crypto.randomBytes(12)` — unique per encryption
- Auth tag is stored alongside ciphertext
- Format: `iv(hex):authTag(hex):ciphertext(hex)`
- Key validation enforces 64-char hex (32 bytes)

### 3. Rate Limiting ⚠️
- `/api/tools/review-score` — ✅ 5 req/IP/day (in-memory)
- `/api/reviews/google` — ✅ Google API rate limiter (10 req/min)
- Other endpoints — ❌ No per-user rate limiting (see M2)

### 4. Input Sanitization ✅
- All DB access uses Prisma parameterized queries
- Only raw query: `$queryRaw\`SELECT 1\`` — no user input, safe
- Template injection now uses HTML escaping (H1 fix)

### 5. CORS ✅
- Next.js API routes default to same-origin
- No cross-origin access needed currently

### 6. Authentication Middleware ✅
- `/dashboard/*` — requires login
- `/onboarding/*` — requires login
- `/admin/*` — requires login + ADMIN role
- `/api/admin/*` — requires login + ADMIN role (returns 401/403 JSON)
- `/api/*` — requires login (except public routes)

### 7. Public Routes (confirmed appropriate)
| Route | Reason |
|-------|--------|
| `/api/plans` | Plan listing for marketing pages |
| `/api/health` | Infrastructure health check |
| `/api/tools/*` | Free tool (lead gen funnel) |
| `/api/billing/webhook` | Stripe webhook (signature-verified) |
| `/api/billing/moyasar/callback` | Moyasar payment callback |
| `/api/email/send` | Internal service-to-service (API key protected) |
| `/api/auth/*` | NextAuth routes (excluded from matcher) |

### 8. Webhook Security ✅
- **Stripe:** Signature verification via `stripe.webhooks.constructEvent()` with `STRIPE_WEBHOOK_SECRET`
- Returns 400 if signature is missing or invalid

### 9. File Upload ✅
- No file upload endpoints exist
- Logo is handled via URL string (`logoUrl`), not file upload
- URL validation recommended (see M4)

### 10. Dependencies ⚠️
- 13 vulnerabilities (5 moderate, 8 high)
- Primary: Next.js CVEs (DoS, request smuggling)
- Fix requires Next.js major version upgrade (see L1)

### 11. Environment / .gitignore ✅
- `.env` and `.env*.local` are in `.gitignore`
- `.env` removed from git tracking
- `*.pem` is in `.gitignore`
- `/src/generated/prisma` is in `.gitignore`
- `.env.example` has only placeholder values

### 12. Security Headers ✅
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- API routes: `Cache-Control: no-store, no-cache, must-revalidate`

---

## Recommendations for Next Phase

1. **Redis-based rate limiting** for all authenticated API endpoints (priority: AI, render, publish)
2. **Zod schema validation** for all API request bodies
3. **URL allowlist** for `logoUrl` (HTTPS only)
4. **Next.js upgrade** to 16.x to resolve CVEs
5. **HSTS** via reverse proxy (Nginx/Cloudflare)
6. **Content Security Policy** header for additional XSS protection
7. **API key rotation** mechanism for `INTERNAL_API_KEY` and `TOKEN_ENCRYPTION_KEY`
