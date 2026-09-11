# Environment variables

Every variable the BIG Agreements application reads, what it does, and whether
it is required.

**Never commit real values.** `.env` files are gitignored and secret scanning
(`.gitleaks.toml`) runs in CI. On Railway, set these as service variables.

Legend: **R** required · **P** required in production · **O** optional

---

## BIG Agreements branding (new)

Read by `backend/src/big/config/branding.ts` and validated at startup by
`validateBrandingConfiguration()`. The frontend mirror is
`frontend/src/app/lib/branding.ts`.

Only `PRODUCT_NAME` is normally needed — the short, assistant and document
names all derive from it unless overridden.

| Variable | | Default | Purpose |
| --- | --- | --- | --- |
| `PRODUCT_NAME` | O | `BIG Agreements` | Member-facing product name |
| `PRODUCT_SHORT_NAME` | O | = `PRODUCT_NAME` | Logo and sidebar |
| `PRODUCT_ASSISTANT_NAME` | O | = `PRODUCT_NAME` | Name the AI uses for itself in the system prompt |
| `PRODUCT_DOCUMENT_AUTHOR` | O | = `PRODUCT_NAME` | DOCX `dc:creator` and tracked-change author |
| `SUPPORT_EMAIL` | O | `support@bigapp.work` | Member support address |
| `PUBLIC_APP_URL` | O | `https://legal.bigapp.ai` | Public origin; must be https in production |
| `PRIMARY_BRAND_URL` | O | `https://bigapp.work` | Marketing site the logo links to |
| `LEGAL_FOOTER` | O | `BIG R/D` | Footer legal line |
| `OPEN_SOURCE_NOTICE_URL` | O | GitHub repo | **AGPL §13 source offer.** See `docs/OPEN_SOURCE_COMPLIANCE.md` |

### Frontend equivalents

Next.js inlines these at **build time**, so they must be present when
`next build` runs — setting them only at runtime has no effect.

`NEXT_PUBLIC_PRODUCT_NAME`, `NEXT_PUBLIC_PRODUCT_SHORT_NAME`,
`NEXT_PUBLIC_PRODUCT_ASSISTANT_NAME`, `NEXT_PUBLIC_PRODUCT_DESCRIPTION`,
`NEXT_PUBLIC_PRIMARY_BRAND_URL`, `NEXT_PUBLIC_PUBLIC_APP_URL`,
`NEXT_PUBLIC_SUPPORT_EMAIL`, `NEXT_PUBLIC_LEGAL_FOOTER`,
`NEXT_PUBLIC_OPEN_SOURCE_NOTICE_URL`, `NEXT_PUBLIC_TERMS_URL`,
`NEXT_PUBLIC_PRIVACY_URL` — all optional, all defaulting to the BIG brand.

---

## Core runtime (upstream)

### Authentication and database

| Variable | | Purpose |
| --- | --- | --- |
| `SUPABASE_URL` | R | Supabase project URL |
| `SUPABASE_PUBLISHABLE_KEY` | R | Anon/publishable key (`SUPABASE_ANON_KEY` also accepted) |
| `SUPABASE_SECRET_KEY` | R | **Service role key — bypasses all RLS. Treat as the master credential.** |
| `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` | O | Google OAuth |
| `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET` | O | Google OAuth |

Validated at boot by `validateRuntimeConfiguration()`; the process exits rather
than serving with a broken auth boundary.

### URLs and origins

| Variable | | Purpose |
| --- | --- | --- |
| `FRONTEND_URL` | P | Frontend origin; must be https in production |
| `API_PUBLIC_URL` | P | Public API origin; must be https in production |
| `ALLOWED_ORIGINS` | O | Comma-separated extra trusted origins |
| `WORD_ADDIN_URL` | O | Word add-in origin. **Requires `AUTH_HANDOFF_ENCRYPTION_SECRET`** |
| `PORT` | O | API port (default 3001) |
| `NODE_ENV` | R | `production` enables HSTS and https enforcement |
| `TRUST_PROXY_HOPS` | O | Proxy hops for correct client IPs (default 1). Set correctly on Railway or rate limiting keys on the wrong IP |

### Secrets

Generate each with `openssl rand -hex 32`. **Use different values.**

| Variable | | Purpose |
| --- | --- | --- |
| `DOWNLOAD_SIGNING_SECRET` | R | Signs short-lived document download tokens |
| `USER_API_KEYS_ENCRYPTION_SECRET` | R | Encrypts per-user provider API keys at rest |
| `AUTH_HANDOFF_ENCRYPTION_SECRET` | P | AES-256-GCM key for session handoff tickets. ≥32 chars. Required when `WORD_ADDIN_URL` is set, and by the BIG WordPress session bridge |
| `AUTH_HANDOFF_TTL_SECONDS` | O | Ticket lifetime, clamped 30–300 (default 120) |
| `MANIFEST_SIGNING_KEY` | O | Ed25519 key for export manifests. Unset = unsigned; malformed = boot failure |

### Object storage (S3-compatible)

| Variable | | Purpose |
| --- | --- | --- |
| `R2_ENDPOINT_URL` | R | S3/R2 endpoint |
| `R2_ACCESS_KEY_ID` | R | Access key |
| `R2_SECRET_ACCESS_KEY` | R | Secret key |
| `R2_BUCKET_NAME` | O | Bucket (default `mike` — an internal identifier, deliberately unchanged) |
| `R2_PUBLIC_ENDPOINT_URL` | O | Endpoint used for browser-facing presigned upload URLs |

> **Never point this at Railway's ephemeral disk.** Contracts must live in
> durable object storage.

### LLM providers

At least one is required unless running Ollama exclusively.

`ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `OPENAI_API_KEY`, `OPENROUTER_API_KEY`,
`AI_GATEWAY_API_KEY`, `OPENCODE_API_KEY` — plus optional base-URL overrides
`OPENROUTER_BASE_URL`, `OPENCODE_GO_BASE_URL`, `VERCEL_AI_GATEWAY_BASE_URL`.

### Queue and workers

| Variable | | Purpose |
| --- | --- | --- |
| `QUEUE_DRIVER` | O | Queue backend. The Postgres `db_jobs` driver removes the Redis dependency entirely |
| `REDIS_URL` | O | Required only when using the Redis/BullMQ driver |
| `WORKERS_MODE` | O | `inline` (in API process), `thread`, or `none` (separate worker service) |
| `DB_JOBS_ENABLED` | O | Enables the Postgres durable job queue |
| `DB_JOBS_POLL_MS` | O | Poll interval |
| `ASYNC_DOCUMENT_CONVERSION` | O | Offload conversion to workers |
| `ASYNC_TABULAR_EXTRACTION` | O | Offload tabular extraction to workers |

### Upload and conversion tuning

`UPLOAD_PROCESSING_CONCURRENCY` (default 8, max 64),
`UPLOAD_PROCESSING_MAX_RUNNING_PER_USER` (default 2),
`UPLOAD_CONVERT_TIMEOUT_MS` (default 120000, clamped 10s–10m),
`UPLOAD_JOB_WALL_CLOCK_MS` (default 15m, clamped 1m–60m),
`STALE_DOC_PROCESSING_MS`, `STALE_SWEEP_INTERVAL_MS`,
`REDIS_PRODUCER_TIMEOUT_MS`.

### Rate limiting

All optional; defaults in `backend/src/app.ts`. Windows and maxima for
`RATE_LIMIT_GENERAL_*`, `RATE_LIMIT_CHAT_*`, `RATE_LIMIT_CHAT_CREATE_*`,
`RATE_LIMIT_TOOL_RESULT_*`, `RATE_LIMIT_EXPORT_*`, `RATE_LIMIT_UPLOAD_*`,
`RATE_LIMIT_DATA_DELETE_*`, `RATE_LIMIT_AUTH_LOGIN_*`,
`RATE_LIMIT_AUTH_ACCOUNT_*`, `RATE_LIMIT_AUTH_EMAIL_*`,
`RATE_LIMIT_AUTH_FLOW_*`, `RATE_LIMIT_AUTH_MFA_*`,
`RATE_LIMIT_UPLOAD_SESSION_*`.

### Upstream integrations

`COURTLISTENER_API_TOKEN` (US case-law research),
`MIKE_WORKFLOWS_REPOSITORY`, `MIKE_WORKFLOWS_REF`, `MIKE_WORKFLOWS_GITHUB_TOKEN`
(workflow catalogue sync).

These drive upstream features that BIG Agreements does not use in Phase 1;
leaving them unset disables those features.

---

## Not yet implemented

Reserved for later phases; documented here so the naming is settled.

| Variable | Phase | Purpose |
| --- | --- | --- |
| `BIG_WP_JWT_PUBLIC_KEY` | 3 | Verifies session JWTs from the WordPress plugin |
| `BIG_WP_JWT_ISSUER` | 3 | Expected JWT issuer |
| `BIG_WP_API_BASE_URL` | 3 | WordPress REST base for context lookups |
| `BIG_WEBHOOK_SIGNING_SECRET` | 4 | HMAC-SHA256 key for outbound webhooks |
| `BIG_WEBHOOK_TARGET_URL` | 4 | Plugin webhook receiver |
| `BIG_TRANSLATION_MODEL` | 4 | Model used for Spanish derivation |

---

## Local development

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

Then set `DOWNLOAD_SIGNING_SECRET` and `USER_API_KEYS_ENCRYPTION_SECRET` to two
different `openssl rand -hex 32` values, add one LLM provider key, and run
`docker compose up --build`. See `docs/local-development.md`.

Branding defaults to BIG Agreements with no configuration, so a local stack is
correctly branded out of the box.
