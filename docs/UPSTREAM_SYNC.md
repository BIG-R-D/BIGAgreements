# Upstream sync

How BIG Agreements takes changes from `open-legal-products/mike` without
inheriting its churn, and the standing record of what we have modified.

---

## Remotes

```
origin    https://github.com/BIG-R-D/BIGAgreements.git
upstream  https://github.com/open-legal-products/mike.git
```

If `upstream` is missing:

```bash
git remote add upstream https://github.com/open-legal-products/mike.git
```

---

## The rule: never merge blindly

Upstream is an actively developed project with a dependabot cadence and 85+
migrations. A blanket `git merge upstream/main` will, sooner or later, pull in a
schema change or a refactor that silently breaks BIG behaviour, inside a diff
too large to review honestly.

**Cherry-pick with intent instead.**

| Upstream change | Action |
| --- | --- |
| Security fix | **Take promptly.** Review, cherry-pick, test, ship. |
| Dependency/CVE bump | Take, after CI is green. |
| Bug fix in code we use | Take if it affects a path BIG relies on. |
| Bug fix in code we don't use (tabular, CourtListener, Word add-in) | Usually skip. |
| New feature | Evaluate on merits. Default to skipping — every adopted feature is surface we then maintain. |
| Refactor of files we modified | **Highest risk.** Review by hand; never auto-merge. |
| Schema migration | Review closely against `big_*` tables. Never apply to production without the deployment procedure in `docs/deployment.md`. |

---

## Procedure

```bash
git fetch upstream

# What has moved since we last synced?
git log --oneline HEAD..upstream/main

# What does it touch that we also touch?
git diff HEAD...upstream/main --stat -- $(cat docs/upstream-touched-files.txt 2>/dev/null || echo .)
```

Then, per change worth taking:

```bash
git checkout -b sync/<short-name>
git cherry-pick <sha>
npm test --prefix backend && npm run build --prefix backend
npm test --prefix frontend && npm run lint --prefix frontend
bash scripts/check-module-boundaries.sh
```

Open a PR describing what was taken, what was skipped, and why.

**After any sync touching `schema.sql` or `migrations/`,** confirm the
schema-drift workflow (`.github/workflows/schema-drift.yml`) is green — it
checks a fresh install against an upgraded one.

---

## What we have modified (as of Phase 1)

The whole point of the isolation rules in `ARCHITECTURE_PROPOSAL.md` §1 is to
keep this list short and boring. Current diff against the fork point:
**37 files changed, 136 insertions, 60 deletions.**

Regenerate this list at any time with:

```bash
git diff upstream/main --stat
```

### BIG-authored files (no upstream conflict possible)

```
REPO_AUDIT.md
ARCHITECTURE_PROPOSAL.md
IMPLEMENTATION_PLAN.md
backend/src/lib/branding.ts
backend/src/lib/__tests__/branding.test.ts
frontend/src/app/lib/branding.ts
frontend/src/app/components/shared/OpenSourceNotice.tsx
scripts/check-module-boundaries.sh
.github/workflows/big-module-boundaries.yml
docs/ENVIRONMENT_VARIABLES.md
docs/OPEN_SOURCE_COMPLIANCE.md
docs/UPSTREAM_SYNC.md
```

### Modified upstream files

**Every one of these replaces a hardcoded brand literal with a configuration
read. None changes behaviour.** That is what makes them cheap to re-apply if
upstream rewrites the surrounding code.

*Backend — startup and configuration*
- `backend/src/index.ts` — calls `validateBrandingConfiguration()`; startup log
- `backend/src/worker.ts` — startup log
- `backend/.env.example`, `.env.example` — branding variables

*Backend — member-facing output*
- `backend/src/lib/chat/prompts.ts` — assistant self-identity in the system prompt
- `backend/src/lib/chat/wordPrompt.ts` — same, Word surface
- `backend/src/routes/tabular.ts` — same, tabular-review chat
- `backend/src/lib/chat/tools/documentOps.ts` — DOCX `dc:creator`,
  `lastModifiedBy`, `Application`, theme name, tracked-change author
- `backend/src/lib/docxTrackedChanges.ts` — default tracked-change author
- `backend/src/lib/projectAccess.ts`, `contentAccess.ts`,
  `routes/workflows.ts` — "does not belong to a … user" error
- `backend/src/lib/llm/providers.ts` — OpenRouter `appName`; one error string
- `backend/src/lib/mcp/oauth.ts` — OAuth `client_name` shown on consent screens

*Frontend — member-facing output*
- `frontend/src/app/layout.tsx` — title, description, OpenGraph, Twitter card
- `frontend/src/app/global-error.tsx` — error page title
- `frontend/src/app/components/site-logo.tsx`,
  `components/shared/AppSidebar.tsx` — logo and sidebar wordmark
- `frontend/src/app/login/page.tsx`, `signup/page.tsx` — terms/privacy links,
  AGPL §13 notice
- `frontend/src/app/(pages)/settings/{appearance,personalisation,security}/page.tsx`
- `frontend/src/app/components/shared/AddUserInput.tsx`,
  `components/assistant/AskInputPopup.tsx`,
  `components/tabular/AddColumnModal.tsx`,
  `components/workflows/WFEditColumnModal.tsx`
- `frontend/src/app/support/page.tsx`, `onboarding/profile/page.tsx`

*Tests updated to assert the configured brand rather than a literal*
- `backend/src/__tests__/integration/{chat,workflows}.routes.test.ts`
- `backend/src/lib/__tests__/{chatPrompts,docxTrackedChanges,openrouter,projectAccess}.test.ts`
- `frontend/src/app/components/modals/AccessModal.test.tsx`
- `frontend/src/app/components/projects/NewProjectModal.test.tsx`

### Deliberately NOT modified

Internal identifiers stay upstream-identical, because renaming them changes
nothing a member sees and guarantees conflicts on every sync:

`mike_workflows` / `mike_workflow_assets` tables · `MikeApiError` ·
`MikeIcon` / `MikeIconUI` · `MikeLayout` · `frontend/src/app/lib/mikeApi.ts` ·
the default `mike` storage bucket · `mike-backend` package name ·
`MIKE_WORKFLOWS_*` environment variables.

---

## Known upstream-branding item left open

`frontend/src/app/components/workflows/OpenSourceWorkflowModal.tsx` tells the
member that contributed workflows are published to the
`Open-Legal-Products/mike-workflows` repository and the mikeoss.com site.

That statement is **factually true**, so rebranding the strings would make the
UI lie. The correct fix is a product decision, not a branding substitution:
hide the upstream-contribution flow from BIG members. Tracked for Phase 2.

---

## Upstream defect patched locally

`docker compose up --build` fails on the **frontend** image in upstream Mike as
shipped. It is not caused by any BIG change.

**Cause.** `frontend/src/wordAddin/*.test.ts` type-import
`../../../word-addin/src/...`, and `next build` type-checks them. But
`frontend/Dockerfile.dockerignore` excluded `word-addin` from the build
context, so those modules were absent and the build died with a wall of
`TS2307: Cannot find module` errors. It succeeds outside Docker only because
`word-addin/` happens to exist on the developer's disk.

**Fix.** Mirror the pattern the Dockerfile already uses for exactly this
problem with `backend/src`:

- `frontend/Dockerfile` — `COPY word-addin/src /word-addin/src` alongside the
  existing `COPY backend/src /backend/src`
- `frontend/Dockerfile.dockerignore` — keep excluding `word-addin` wholesale,
  then re-include `word-addin/src` and `word-addin/src/**`. This keeps the
  build context lean while making the type-imported sources available.

**Fixed twice, independently.** The same defect was found and fixed on `main`
in PRs #1 and #2 (via Railway's code-change agent) while this branch was in
progress. The rebase kept `main`'s dockerignore form — the negation approach
is tighter than excluding named subdirectories, and it is the version proven
to build on Railway — plus the explanatory comment from this branch.

**Offer this upstream.** It is a genuine bug affecting every Mike deployment
that builds the documented Compose stack, and the fix is a few lines. Carrying
it as a local patch is pure cost.

---

## When conflicts get expensive

If a sync starts producing painful conflicts in the modified files above, that
is the signal to upstream the change rather than keep carrying it. A patch that
replaces hardcoded product names with a configuration module is plausibly
useful to upstream and to every other Mike deployment — offering it there turns
a permanent maintenance cost into a one-off contribution.
