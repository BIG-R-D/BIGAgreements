# REPO_AUDIT.md — Phase 0 Existing System Assessment

**Repository:** `BIG-R-D/BIGAgreements` (fork of `open-legal-products/mike`)
**Audited at commit:** `8b3466f`
**Date:** 2026-09-09
**Status:** Assessment only. No application code has been modified.

This document describes what upstream Mike **actually is**, based on reading the
repository — not on upstream marketing or documentation claims.

---

## 1. Summary

Mike (MikeOSS) is a mature, security-conscious **legal document AI platform**:
chat over documents, AI-assisted document *editing* with tracked changes,
tabular extraction across document sets, and citation research. It is roughly
1,022 tracked files and ~51 MB.

The critical finding for BIG Agreements:

> Mike is a document **ingestion, review and editing** platform.
> It is **not** a contract **generation** platform.
> There is no structured agreement model, no questionnaire engine, no
> template/clause library, no translation pipeline, and no webhook subsystem.

What Mike *does* give BIG is a large amount of expensive, already-hardened
infrastructure underneath those missing pieces: auth, multi-tenant
authorization, document versioning, tracked-change edit review, object storage,
a multi-provider LLM abstraction, a durable job queue, and an audit trail.

**The build is therefore additive, not a rewrite.** The realistic effort is in
the agreement domain layer and the WordPress bridge — not in re-solving
authentication, storage or document handling.

---

## 2. Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 16 (App Router), React 19, Tailwind 4, TipTap editor |
| Backend | Express 4 (TypeScript), Node ≥22 |
| Auth | Supabase Auth (GoTrue) — email/password, Google OAuth, TOTP MFA |
| Database | Postgres (Supabase), 50 tables, 85 dated migrations |
| Object storage | S3-compatible (Cloudflare R2 in production, RustFS locally) |
| Queue | BullMQ over Redis **or** a Postgres-backed `db_jobs` queue |
| LLM | Vercel AI SDK — Anthropic, Google, OpenAI, OpenRouter, Vercel Gateway, OpenCode Go, Ollama, any OpenAI-compatible endpoint |
| Doc conversion | LibreOffice (`soffice`) via `libreoffice-convert`, `mammoth`, `pdfjs-dist` |
| Extra client | Microsoft Word task-pane add-in (separate app, own Dockerfile) |
| Tests | Vitest (backend + frontend), Playwright (e2e), Stryker (mutation) |
| License | **AGPL-3.0-only** |

---

## 3. Services actually required

From `docker-compose.yml` (13 services locally, most of which are the
self-hosted Supabase stack, not Mike itself):

**Mike's own runtime is only three processes:**

1. `backend` — Express API (`npm start` → `dist/index.js`), port 3001
2. `frontend` — Next.js server, port 3000
3. `workflow-sync` — one-shot job that pulls the workflow catalogue from GitHub

Everything else (`db`, `auth`, `rest`, `gateway`, `storage`, `redis`,
`mailpit`, `db-init`, `createbucket`) is infrastructure that Railway or
Supabase Cloud provides as managed services.

**Workers:** `WORKERS_MODE` controls whether background workers run in-process
inside the API or as a separate process (`src/worker.ts`). Redis is optional —
`QUEUE_DRIVER` can select the Postgres `db_jobs` queue instead, which removes
Redis from the topology entirely.

---

## 4. Authentication (as implemented)

`backend/src/middleware/auth.ts`, `lib/authSession.ts`, `lib/authHandoff.ts`,
`routes/auth.ts`.

- Browser clients authenticate with **HttpOnly cookies** (Supabase SSR session).
- A legacy `Authorization: Bearer` path remains for older Word add-ins and API
  clients.
- Non-GET cookie requests are rejected unless the `Origin` is in a configured
  trusted-origin allowlist (`lib/origins.ts` — `FRONTEND_URL`,
  `WORD_ADDIN_URL`, `ALLOWED_ORIGINS`).
- MFA can be enforced per user (`user_profiles.mfa_on_login`), with assurance
  levels checked on every request.

### The finding that matters most for WordPress integration

`lib/authHandoff.ts` implements a **single-use, short-lived, encrypted session
handoff ticket**:

- 32 random bytes, stored only as a SHA-256 hash (`auth_handoff_tickets`)
- Session tokens encrypted at rest with AES-256-GCM
- AAD binds the ticket to `user_id + ticket_hash + request_id + origin`
- TTL 30–300s (default 120s), single-use via a conditional `consumed_at` update
- Opportunistic expiry cleanup, no scheduler dependency

This is precisely the primitive a WordPress SSO bridge needs, and it is already
built, already tested, and already in production use by the Word add-in.
**It is currently hard-gated to the Word add-in origin** (`requestOriginIsWordAddin`),
so it needs a generalisation — not an invention.

---

## 5. Authorization

`lib/access.ts`, `projectAccess.ts`, `permissions.ts`, `orgs.ts`,
`orgAccessOverrides.ts`, `contentAccess.ts`.

- Row Level Security is **enabled on 30 tables but zero policies are defined.**
  This is deliberate: it denies all direct `anon`/`authenticated` access, and
  every read/write goes through the backend using the service role.
- **All authorization is enforced in application code.** Any new BIG tables
  inherit this contract: enable RLS, define no policies, and enforce access in
  the service layer.
- Model: `organizations` → `org_members` (roles `admin` | `member`), plus
  per-resource grants (`project_access_grants`, `chat_access_grants`,
  `tabular_review_access_grants`) with roles `owner` | `editor` | `viewer`, plus
  per-user org overrides including an explicit `deny`.

This maps cleanly onto BIG's company/member/project structure.

---

## 6. Data model (50 tables)

Relevant clusters:

- **Identity:** `user_profiles`, `organizations`, `org_members`, `org_invitations`
- **Content:** `projects`, `project_subfolders`, `library_folders`, `documents`,
  `document_versions`, `document_edits`
- **Upload pipeline:** `upload_sessions`, `upload_session_files`,
  `upload_processing_jobs`
- **AI surfaces:** `chats`, `chat_messages`, `word_chats`, `tabular_reviews`,
  `tabular_cells`
- **Templates:** `workflows`, `mike_workflows`, `mike_workflow_assets`,
  `quick_actions`
- **Ops:** `audit_events`, `db_jobs`, `auth_handoff_tickets`

### Two tables worth calling out

**`document_versions`** already has a `source` enum containing `'generated'`,
`'assistant_edit'`, `'user_accept'`, `'user_reject'` alongside `'upload'`, plus
`version_number`, `content_sha256`, and soft delete. Generated-document
versioning is a solved problem here.

**`document_edits`** stores per-change tracked edits with
`status ∈ {pending, accepted, rejected}`, insert/delete text and surrounding
context, linked to a chat message and a document version. The "AI proposes a
revision, member accepts or rejects it" loop already exists and is wired to real
DOCX tracked changes (`lib/docxTrackedChanges.ts`).

---

## 7. What "workflows" actually are (important)

The upstream "workflow" system sounds like an agreement-template engine. It is
not.

`mike_workflows` stores `prompt_md` (a markdown prompt), optional
`columns_config` (JSON, for tabular reviews), and metadata (`jurisdictions`,
`practice`, `language`, `pack_key`). Type is constrained to
`'assistant' | 'tabular'`.

So a workflow is **a stored prompt with metadata** — no typed fields, no
validation rules, no conditional questions, no clause composition, no structured
output contract. Workflows are also synced from an external GitHub repo
(`Open-Legal-Products/mike-workflows`) via `MIKE_WORKFLOWS_REPOSITORY`.

**Consequence:** BIG Agreements' structured questionnaire and clause library is
net-new work. It can borrow the workflow catalogue's *distribution* pattern
(versioned, content-hashed, synced definitions) but not its data model.

---

## 8. Document pipeline

Upload → direct-to-object-storage via presigned URL (`routes/uploadSessions.ts`;
the old multipart endpoints now return HTTP 410) → queued processing
(`workers/extractionWorker.ts`, `conversionWorker.ts`) → text extraction and PDF
rendition → versioned rows.

Generation exists but is narrow: `lib/chat/tools/documentOps.ts` lets the
assistant produce a document rendition into `generatedDocKey(...)`. There is no
template-driven, data-driven document composition. The `docx` library is a
dependency of both frontend and backend but is not used for structured contract
assembly anywhere in the backend today.

---

## 9. LLM abstraction

`lib/llm/{index,providers,models,aiSdk,types}.ts` — a genuinely clean seam.
`streamChatWithTools()` and `completeText()` are the only entry points; provider
selection is by model id; per-user API keys are supported and encrypted
(`user_api_keys`, `USER_API_KEYS_ENCRYPTION_SECRET`).

**BIG can set provider, model and routing by configuration without touching this
layer.** Adding a distinct translation model or a cost ceiling is additive.

There is currently **no token/cost telemetry table** — cost tracking per
agreement is net-new.

---

## 10. Storage

`lib/storage.ts` — S3-compatible, private objects, presigned upload and download
URLs, key derivation helpers (`storageKey`, `versionStorageKey`,
`generatedDocKey`, `extractedTextKey`). Signed short-lived download tokens are
handled separately (`lib/downloadTokens.ts`, `routes/downloads.ts`,
`DOWNLOAD_SIGNING_SECRET`).

This already satisfies BIG's storage requirements (private, signed/expiring,
no guessable URLs). **It must not be pointed at Railway's ephemeral disk** —
use R2 or S3.

---

## 11. Deployment posture

- `backend/Dockerfile` — single-stage `node:22-slim` + LibreOffice, `EXPOSE 3001`.
- `backend/nixpacks.toml` **and** `backend/railpack.json` — Railway's own
  builders are already configured upstream, both adding LibreOffice. Someone
  upstream has already deployed this to Railway.
- `frontend/` targets **Cloudflare Workers** via `@opennextjs/cloudflare`
  (`open-next.config.ts`, `wrangler`). For Railway this is not required — the
  standard `next build` / `next start` path in `frontend/Dockerfile` works.
- `/health` endpoint exists (`app.ts`) — usable directly as a Railway healthcheck.
- 11 GitHub Actions workflows: CI, CodeQL, e2e, gitleaks, load test, mutation
  testing, schema drift, OSSF scorecard, security, stack tests, word add-in.

**Railway compatibility is good.** The main decisions are LibreOffice in the
image (large but handled), Redis vs. the Postgres `db_jobs` queue, and where
Supabase runs.

---

## 12. Testing

288 test files (119 backend, 143 frontend, plus e2e and word-addin). Vitest,
Playwright, Stryker mutation testing, schema-drift checking between
`schema.sql` and `migrations/`. Coverage config present.

This is a well-tested codebase, which raises the cost of invasive edits and
lowers the cost of additive ones.

---

## 13. Branding surface (white-labelling assessment)

Raw counts are misleading. 310 files contain the string "Mike", but most are
internal identifiers (`mike_workflows` table, `MikeApiError`, `MikeLayout`,
`MikeIcon`, the `mike` storage bucket default, package names) which members
never see.

**Actual member-facing branding is small and concentrated:**

- `frontend/src/app/layout.tsx` — page title, OpenGraph/Twitter metadata,
  `metadataBase: https://app.mikeoss.com`
- `frontend/src/app/global-error.tsx` — error page title
- `frontend/src/app/components/site-logo.tsx` — logo component
- A handful of settings-page copy strings ("Use a darker color palette
  throughout Mike", "Tell Mike about your role…")
- MFA enrolment issuer name (`enrollMfa("Mike")`)
- `docs/assets/` images, favicons, `public/`

**Assessment: white-labelling is genuinely cheap** — a branding config module
plus roughly 45 frontend files, most needing only an identifier rename.

---

## 14. What does not exist at all

Every item below is net-new for BIG Agreements:

| Missing capability | Notes |
| --- | --- |
| Structured agreement entity | No `agreements` table, no structured terms JSON |
| Questionnaire / guided intake engine | Workflows are prompts, not typed forms |
| Clause library / template composition | Nothing |
| Translation pipeline | No i18n of *content*; no EN→ES derivative model |
| Version lineage across languages | `document_versions` is per-document only |
| Protected-value validation | Nothing |
| **Outbound webhooks** | Zero occurrences of "webhook" in the codebase |
| Service-to-service / machine auth | All auth is end-user session auth |
| Entitlements / usage limits / metering | Only rate limits; no plan or quota model |
| AI cost & token telemetry | Not recorded |
| Product analytics events | Not present |
| E-signature integration | Nothing |
| Admin console | No admin UI; ops via DB and `audit_events` |
| AGPL source-offer notice in the UI | **Not present** — see §16 |

---

## 15. Security assessment

**Strong, and better than typical for an OSS project:**

- Helmet with a restrictive CSP (`default-src 'none'`, `frame-ancestors 'none'`)
- HSTS in production, `no-referrer`, `x-powered-by` disabled
- Per-route rate limiting with ~15 distinct limiter lanes, including
  account-level login throttling keyed by a **SHA-256 digest of the email** so
  addresses never enter the limiter store
- Trusted-origin enforcement on state-changing cookie requests
- Internal error responses sanitised (`middleware/internalErrorResponse.ts`)
- Encrypted user API keys; signed export manifests (Ed25519); signed download
  tokens; SSRF protection (`lib/privateIp.ts`)
- Secret scanning (gitleaks), CodeQL, OSSF scorecard in CI

**Risks BIG inherits or introduces:**

1. **`frame-ancestors 'none'` blocks iframe embedding.** Any WordPress iframe
   plan requires deliberately relaxing this for one origin — a real security
   decision, not a config typo.
2. **RLS with no policies** means a single missed service-layer check is a full
   authorization bypass. Every new BIG table must follow the same discipline.
3. **Service-role key is the master key.** `SUPABASE_SECRET_KEY` bypasses
   everything; Railway secret hygiene is critical.
4. **No machine-to-machine auth exists.** WordPress↔Railway calls need a new,
   carefully designed credential path — the most security-sensitive new code.
5. **Multi-tenancy is collaborative, not hostile-tenant.** It is built for law
   firms sharing matters, not for mutually distrustful members. BIG's contractor
   vs. client relationship is closer to adversarial and needs explicit review.
6. Contract text will flow to third-party LLM providers — BIG must set retention
   and privacy terms per provider explicitly.

---

## 16. Licensing (AGPL-3.0-only)

- `LICENSE` is the full AGPL-3.0 text (661 lines). `package.json` in root,
  backend and frontend all declare `"license": "AGPL-3.0-only"`.
- **AGPL §13 requires that users interacting with the software over a network be
  offered the corresponding source.** No such notice or source link exists
  anywhere in the frontend today. Upstream is arguably already thin here; BIG
  running it as a member-facing hosted service makes it *our* obligation.
- Modifying and hosting the fork is entirely permitted. White-labelling the
  member-facing brand is permitted. Removing copyright notices is not.
- **The WordPress plugin should be a separate work** communicating over HTTP.
  Kept in its own repository, distributed separately, and interacting only
  through a documented network API, it is not a derivative of Mike. Bundling it
  into this repository or linking it into Mike's code would put that argument at
  risk.
- Flag for legal review: whether BIG intends to publish the modified
  BIG Agreements source to members (AGPL §13 says yes for network users).

---

## 17. Local-run feasibility

**Not currently runnable on this machine.** `docker` is not installed and no
daemon is available; `bun` and the Supabase CLI are also absent. Node v26.3.0 is
present and satisfies `engines: >=22`.

The documented quick start is Docker-only (`docker compose up --build`), which
brings up Postgres, GoTrue, PostgREST, an nginx gateway, RustFS, Redis and
Mailpit. Running the stack requires installing Docker Desktop — an install I
have deliberately **not** performed, per the instruction to inspect before
installing.

Backend unit tests could be run without Docker after `npm ci` in `backend/`,
which is also an install action and is therefore pending approval.

---

## 18. Reusability verdict

| Area | Verdict |
| --- | --- |
| Auth (Supabase, MFA, cookies, handoff tickets) | **Reuse as-is**, generalise handoff origin gate |
| Authorization (orgs, grants, overrides) | **Reuse as-is**, extend for BIG party roles |
| Object storage + signed URLs | **Reuse as-is** |
| Document versioning + tracked-change review | **Reuse as-is** — high value |
| LLM provider abstraction | **Reuse as-is**, add config for model routing |
| `db_jobs` durable queue | **Reuse** — ideal webhook delivery substrate |
| `audit_events` | **Reuse**, extend `action` vocabulary |
| Upload/extraction pipeline | Reuse; secondary for generation-first flow |
| Chat + document Q&A | **Reuse** — this is the "ask about clauses" feature |
| Workflow catalogue | Borrow the distribution pattern only; **not** the model |
| Tabular reviews, CourtListener, Word add-in | **Leave alone** — out of scope |
| Frontend shell, design system, editor | Reuse; re-skin |
| Cloudflare/OpenNext deploy path | Not needed for Railway; leave in place |

---

## 19. Top technical risks

1. **Adversarial multi-party contracts on a collaborative permission model.**
   Contractor and client seeing the right things is a design problem, not a
   config problem.
2. **Translation fidelity of protected values.** Requires deterministic
   extraction and diffing of names, amounts, dates and percentages — an LLM
   check alone is not sufficient evidence.
3. **Upstream divergence.** 85 migrations and an active dependabot cadence
   upstream. Every edit to an existing file raises future merge cost.
4. **Iframe embedding vs. CSP.** Getting this wrong is either a broken product
   or a clickjacking vector.
5. **Unknown WordPress schema.** BIGAPP's member/project/job model has not been
   inspected. Nothing should be built against assumed plugin schemas.
6. **LibreOffice image weight** on Railway build times and cold starts.
7. **AGPL network-source obligation** currently unmet by the running app.

---

## 20. Recommended integration architecture (summary)

Detailed in `ARCHITECTURE_PROPOSAL.md`. In one line:

> Build BIG Agreements as an **isolated module inside this fork** (`big_*`
> tables, `/big/*` API namespace, new files only), and keep the **WordPress
> plugin as a genuinely separate repository** — rather than either editing Mike
> invasively or standing up a second backend service that would have to
> duplicate Mike's storage, document and LLM layers.

---

# Addendum — member-experience audit

Added after the expanded product brief. The original audit assessed Mike as
infrastructure. This addendum assesses it as a **product surface for
construction members**, which is a different question and reaches a different
conclusion.

## 21. The core product-surface finding

Mike's entire information architecture assumes a lawyer with documents in hand.
Its front door is a chat box labelled *"How can I help?"*, and its primary nav is
Assistant / Projects / Library / Tabular Review / Workflows.

BIG's member arrives with the opposite starting condition: **no document, a deal
already agreed, and no legal vocabulary.** They need "tell us about the job",
not "upload and prompt".

> This is not a re-skin. Branding (Phase 1, complete) made Mike *say*
> BIG Agreements. It did not make Mike *behave* like BIG Agreements.
> The member surface must be newly built, on top of Mike's engine.

## 22. Feature-surface classification

Verified against the running application.

### Show to members (adapted, simplified)

| Capability | Why, and what changes |
| --- | --- |
| Document Q&A (chat over one agreement) | This *is* "what does this clause mean?" Reframe: scoped to one agreement, no model picker, no tool exposure, suggested questions instead of a blank prompt. |
| Tracked-change review (`document_edits`) | This *is* "show me what changed". Reframe as a plain-language diff with Accept / Reject. |
| Document versions | Needed for version lineage. Surface as "Version 2 — 14 March", not a version table. |
| Download / share final document | Keep. |

### Hide from members entirely

| Capability | Reason |
| --- | --- |
| **Tabular Review** | Bulk extraction across document sets. No member journey reaches it. |
| **Workflows** (assistant + tabular) | Prompt-authoring surface. Members must never write prompts. |
| **Library** + folder taxonomy | Document-management model for a practice, not a member with three agreements. |
| **CourtListener research** | US case-law research. Actively confusing here. |
| **Bring Your Own Keys** | Members must never see provider keys. |
| **Model Preferences / model picker** | Member must not choose a model. |
| **Connectors (MCP)** | Advanced integration surface. |
| **Word add-in** | Desktop Office workflow; irrelevant to a phone-first member. |
| **Open-source workflow contribution modal** | Exposes upstream repo and mikeoss.com — see the branding item in `docs/UPSTREAM_SYNC.md`. |
| **Personalisation** ("your legal practice", jurisdiction, practice areas, professional title) | Asks a contractor to describe their law practice. Onboarding step 2 must be removed for members. |

### Admin-only (BIG staff)

Agreement inspection across members · failed generations · translation
sync state · AI cost and token spend · webhook delivery failures and replay ·
agreement definition and clause template management · provider and model
settings · entitlement configuration · audit events · workflow disable
switches · escalated/high-risk agreements.

**Reuse note:** several capabilities that are *wrong* for members are *right*
for admins — the model picker, provider settings, `audit_events`, and the
existing settings shell can be repointed at Mode 3 rather than rebuilt.

## 23. Mobile assessment — empirical

Tested at 375×812 against the running stack.

**Works:** the app chrome is genuinely responsive. Sidebar collapses to a
hamburger (`data-slot="mobile-header"`, `md:hidden`), the composer adapts,
touch targets on primary buttons are adequate.

**Does not work:** the content patterns are desktop-first. The Projects list is
a **nine-column data table** (Name, Access, CM, Practice, Created by, Files,
Chats, Tabular Reviews, Created). On a phone only *Name* and *Access* are
visible; everything else needs horizontal scrolling.

**Conclusion:** the shell is reusable on mobile; the list/table/detail patterns
are not. A member surface built as one-question-at-a-time steps with card
layouts — not `TablePrimitive` — is required. This is further evidence for
building a new member surface rather than adapting existing screens.

## 24. Three user modes — current support

| Mode | Upstream support | Gap |
| --- | --- | --- |
| **1. BIG member** | None as specified | Entire guided surface is new |
| **2. Other agreement party** | **None.** No concept of a non-account counterparty. `project_access_grants` and `chat_access_grants` are keyed by email and require an existing user profile | Needs tokenised, scoped, account-less invite access. Genuinely new, and security-sensitive |
| **3. BIG admin** | Partial — `audit_events`, org roles (`admin`/`member`), settings shell | No admin console; no cross-member view; no cost/webhook/translation dashboards |

Mode 2 deserves emphasis: Mike's sharing model assumes **every participant has
an account**, and its tenancy model assumes **collaborators, not
counterparties**. A subcontractor agreement is a two-sided document where the
parties have opposing interests. Nothing upstream models that.
