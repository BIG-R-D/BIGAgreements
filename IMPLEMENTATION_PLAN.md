# IMPLEMENTATION_PLAN.md — BIG Agreements

Re-sequenced to the phase numbering in the expanded product brief.
**Companions:** `REPO_AUDIT.md` (+ member-experience addendum),
`ARCHITECTURE_PROPOSAL.md` (+ member product architecture addendum).

---

## Guiding constraints

1. **New files only** for BIG code: `backend/src/big/**`,
   `frontend/src/app/(big)/**`. Branding config is the one standing exception
   and lives in `lib/` — see `ARCHITECTURE_PROPOSAL.md` §1.
2. **One-way dependencies.** BIG imports Mike; Mike never imports BIG. Enforced
   by `scripts/check-module-boundaries.sh` in CI.
3. **`big_` table prefix.** Migrations add objects; never alter upstream tables.
4. **RLS enabled, no policies** — authorization in the service layer, matching
   the existing contract.
5. **Server-side authorization always.** Never trust an id from the browser.
6. **Structured data before prompts.** `structured_terms` is canonical; the
   document is a rendition.
7. **English first; Spanish derived, never independent.**
8. **Mobile-first** for every member screen.
9. **Fictional test data only.** No real BIG member or project data, ever.
10. **Do not overbuild.** One vertical slice before generalising.

---

## Phase 0 — Repository audit ✅ COMPLETE

`REPO_AUDIT.md`, `ARCHITECTURE_PROPOSAL.md`, `IMPLEMENTATION_PLAN.md`
delivered, plus the member-experience addendum answering C/D/E and the mobile
assessment.

## Phase 1 — Local baseline ✅ COMPLETE

Verified against a running stack (Colima + Docker, 9 services):

- Backend build clean; **1395 tests pass**, 0 failures
- Frontend lint 0 errors; production build succeeds
- Migrations applied — 52 tables; storage bucket created; workers running
- Signup → onboarding → project creation exercised end-to-end in a browser
- Branding config (`lib/branding.ts` + `app/lib/branding.ts`) verified at
  runtime and in the rendered UI; zero member-facing "Mike" remains
- AGPL §13 source notice added and rendering
- `docs/ENVIRONMENT_VARIABLES.md`, `OPEN_SOURCE_COMPLIANCE.md`,
  `UPSTREAM_SYNC.md` written

**Known gaps, deliberate:** chat and document generation unverified — they need
an LLM provider API key that has not been supplied. Frontend test suite shows
38 pre-existing failures caused by Node 26's `localStorage` global shadowing
jsdom's; CI pins Node 22, where they pass.

---

## Phase 2 — BIG member product shell

**Goal:** a member sees a guided BIG product, not legal software. No agreement
engine yet — this is the surface and the routing.

1. `frontend/src/app/(big)/` route group: own layout, mobile-first, no Mike nav.
2. Member home: *Create an agreement · Review an existing agreement ·
   My agreements*. **Not** a chat box.
3. Role-based routing — members never reach `/assistant`, `/library`,
   `/tabular-reviews`, `/workflows`. Enforced server-side, not by hidden links.
4. Mobile component set: stepper, one-question-per-screen, card lists
   (**not** `TablePrimitive`), large touch targets, save-and-resume.
5. Remove onboarding step 2 ("your legal practice") for members.
6. Plain-language copy layer.

**Exit:** a signed-in member sees only BIG-shaped screens, usable one-handed on
a phone.

---

## Phase 3 — Agreement data model

1. Migration: `big_agreements`, `big_agreement_parties`,
   `big_agreement_versions`, `big_agreement_definitions`, `big_clauses`,
   `big_agreement_events`.
2. Service + repository layer under `backend/src/big/agreements/`.
3. `/big/agreements` router — one mount line in `app.ts`.
4. Status machine; translation state machine
   (`not_requested → generating → current → outdated → failed`).
5. Version lineage: `source_english_version`, with the invariant that an English
   change marks Spanish outdated.
6. Tests including **negative** authorization cases.

---

## Phase 4 — WordPress connector

Separate repo `BIG-R-D/big-agreements-wordpress`. Prefix `big_agreements_`.

**Discovery first — assume nothing.** Inspect BIGAPP staging; produce
`docs/BIGAPP_SCHEMA_FINDINGS.md` before any adapter code.

1. Plugin skeleton + settings screen (Railway URL, keys, webhook secret).
2. Short-lived signed JWT minting (≤120s, `jti`, asymmetric preferred).
3. `/wp-json/big-agreements/v1/me` + context routes.
4. Adapters: `MemberAdapter`, `ProjectAdapter`, `JobAdapter`, `CompanyAdapter`,
   `MembershipAdapter`.
5. `[big_agreements]` shortcode, Gutenberg block, job/project launch buttons.
6. Webhook receiver — HMAC, timestamp, replay protection, idempotency.
7. Railway `/big/session` bridge + JIT user provisioning + company → org mapping.
8. Generalise `requestOriginIsWordAddin` to an allowlist. *(Upstream edit.)*

---

## Phase 5 — First end-to-end agreement: **Subcontractor**

Per BIG's selection (see `ARCHITECTURE_PROPOSAL.md` §18).

1. Subcontractor definition: typed fields, conditional questions, clause set,
   validation, risk flags.
2. Prefill from BIG context; snapshot into the agreement; ask only what is
   missing.
3. English generation from `structured_terms` → a Mike `documents` row.
4. Review: scoped Q&A + structured revision (classify → map to fields → diff →
   confirm → new version → audit).
5. *"Would you also like a Spanish version?"* after English exists.
6. Spanish derivation from the current English master, with lineage.
7. **Protected-value validator** — deterministic extraction and diff of names,
   companies, addresses, emails, phones, currency, amounts, percentages, dates,
   defined terms, payment schedules, quantities, numbering. LLM proposes;
   validator decides.
8. Webhook dispatcher on `db_jobs`.
9. `SignatureProvider` interface + mock adapter.
10. Entitlement checks at generation and translation.

**Exit:** BIG project → agreement → prefill → questions → English → Q&A →
revision → Spanish → validation → finalize → webhook back to BIG.

---

## Phase 6 — Railway staging

Services `api` + `frontend` + Postgres/Supabase + R2. Redis only if `db_jobs`
proves insufficient. `staging-agreements.bigapp.work`. Security review: origin
and CSP posture, webhook replay, cross-tenant access, contract text absent from
logs. Trim the 536 MB frontend build context here.

**No production member access until staging is stable.**

---

## Open decisions and time-boxed exceptions

| Item | State | Must change before |
| --- | --- | --- |
| **Public signup left ENABLED** (`GOTRUE_DISABLE_SIGNUP` unset) so the team can self-serve a demo at `legal.bigapp.ai`. Anyone who reaches the domain can register. | Accepted for demo | **Any real member or contract data.** Flip to `true` in Supabase and let the WordPress bridge provision users JIT. |
| **Login / signup / onboarding routes still present.** Members will reach the app via WordPress handoff, so these become unreachable for Mode 1 in Phase 2. | Intentional for now | Phase 2 route guards |
| **AGPL §13 notice lives on `/login` and `/signup`** — pages Phase 2 removes for members. | Tracked | Must move to a member-reachable surface in the same change that removes those pages, or the source offer silently regresses. |
| **Do BIG admins log in directly, or also via WordPress?** Determines whether a login page survives at all. | Unanswered | Phase 2 |
| **Is BIG's main site `bigapp.work` or `bigapp.ai`?** App is `legal.bigapp.ai`; brand/support/legal URLs still point at `bigapp.work`. | Unanswered | Before member-facing launch |

---

## Deferred

Mode 2 counterparty access · remaining agreement types · analytics pipeline ·
admin console beyond inspection · real e-signature vendor · iframe embedding.

---

## The next 10 engineering tasks

Tasks 1–3 need no code and unblock everything.

| # | Task | Blocked on |
| --- | --- | --- |
| 1 | **BIG approves this plan** — especially "build new member surface, keep Mike screens as admin" | BIG |
| 2 | **Decide Supabase Cloud vs. self-hosted** — determines Railway topology | BIG |
| 3 | **Inspect BIGAPP WordPress schema** on staging → `docs/BIGAPP_SCHEMA_FINDINGS.md` | BIG staging access |
| 4 | Supply an LLM provider key so generation paths can be exercised | BIG |
| 5 | Scaffold `app/(big)` route group, layout, mobile component set | 1 |
| 6 | Member home + role-based routing away from Mike screens | 5 |
| 7 | Migration + service layer for the `big_*` agreement tables | 1 |
| 8 | Subcontractor definition: fields, questionnaire, clause set (**legal review of clause wording runs in parallel**) | 7 |
| 9 | Create `big-agreements-wordpress` repo, plugin skeleton, JWT minting | 1 |
| 10 | `/big/session` bridge + handoff origin allowlist generalisation | 7, 9 |

**Sequencing note.** Do not start 5–10 before 1–3 are answered. Tasks 2 and 3
can force rework: task 2 changes the deployment topology, task 3 gates the
entire connector, and building adapters against a guessed WordPress schema is
the single most likely source of wasted work in this project.
