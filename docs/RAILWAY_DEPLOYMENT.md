# Railway deployment

Assumes **Supabase Cloud** for database + auth. See `REPO_AUDIT.md` and the
Supabase layout discussion for why a plain Postgres addon cannot run this app:
the backend has **no Postgres driver at all** and reaches the database over
HTTP through PostgREST, so it needs GoTrue *and* PostgREST, not just Postgres.

---

## Service topology

| Railway service | Source | Domain |
| --- | --- | --- |
| `api` | `backend/Dockerfile` | **none — keep private** |
| `frontend` | `frontend/Dockerfile` (context = repo root) | `legal.bigapp.ai` |

Two services. No Redis: `QUEUE_DRIVER=postgres` uses the durable `db_jobs`
Postgres queue. No separate worker: `WORKERS_MODE=thread` runs workers in a
worker thread inside `api`. Split the worker out later only if generation load
justifies it.

**Why `api` stays private.** The browser only ever talks to the frontend
origin; `frontend/src/app/api/[...path]/route.ts` proxies `/api/*` server-side
to `API_BASE_URL`. Keeping `api` off the public internet removes the entire
API surface from external reach, and is why no Supabase key is ever present in
the browser bundle.

---

## Order of operations

1. Create the Supabase project. Apply `backend/schema.sql` to it.
2. Create the R2 (or S3) bucket. **Private.** No public access policy.
3. Create the Railway project and both services from this repo.
4. Set variables (below).
5. Deploy `api` first, confirm it boots, then `frontend`.
6. Attach the domain to `frontend` only.

---

## Variables

Templates live in `docs/railway/`:

- `docs/railway/api.env.example`
- `docs/railway/frontend.env.example`

Both are safe to commit — placeholders only.

For a filled-in copy with secrets already generated, run:

```bash
scripts/generate-railway-env.sh
```

It writes `.env.railway-api.local` and `.env.railway-frontend.local`, which are
gitignored by the existing `.env.*` rule. Fill the remaining `<PASTE ...>`
values, then bulk-paste each file into
**Railway → service → Variables → Raw Editor**.

Never commit the `.local` files, paste them into chat or tickets, or reuse
staging secrets in production.

---

## Traps that will actually bite you

**`NEXT_PUBLIC_*` are build-time.** `next build` inlines them into the bundle.
Setting one in Railway after a deploy does nothing until you rebuild. All are
optional and default to the BIG brand, so the simplest staging setup omits them.

**Do not set `PORT`.** Railway injects it; `index.ts` reads `process.env.PORT`.

**Do not set `REDIS_URL`.** `backend/src/lib/dbq/driver.ts` resolves the queue
driver in order: explicit `QUEUE_DRIVER`, then *any* `REDIS_URL`, then
`ASYNC_DOCUMENT_CONVERSION=true`, then `ASYNC_TABULAR_EXTRACTION=true`, then
Postgres. Setting any of those three silently reintroduces a Redis dependency
you have not deployed.

**Boot-time validation exits the process.** `validateRuntimeConfiguration()`
and `validateBrandingConfiguration()` run before the HTTP listener binds and
call `process.exit(1)` on bad config. In production, `FRONTEND_URL`,
`API_PUBLIC_URL`, `PUBLIC_APP_URL`, `PRIMARY_BRAND_URL` and
`OPEN_SOURCE_NOTICE_URL` **must be https**. A first-deploy crash-loop is nearly
always this — read the logs before suspecting the platform.

**`TRUST_PROXY_HOPS=1`.** Railway terminates TLS at one proxy. Wrong value and
every rate limiter keys on the proxy IP, so one abusive client throttles
everyone.

**IPv6 private networking.** Railway's private network is IPv6-only.
`app.listen(PORT)` with no host binds dual-stack, so `api.railway.internal`
should resolve — but verify on first deploy. If it does not, give `api` a public
domain and point `API_BASE_URL` at that instead.

**LibreOffice makes the image large.** `backend/Dockerfile` installs it for
document conversion. Expect slow first builds. `nixpacks.toml` and
`railpack.json` already declare it if you use a Railway builder instead of the
Dockerfile.

**Frontend build context is ~536 MB.** Pre-existing upstream, not BIG-specific.
Worth trimming `frontend/Dockerfile.dockerignore` here, since it costs on every
build.

---

## Health checks

`GET /health` → `{"ok":true}` exists already in `backend/src/app.ts`. Point
Railway's healthcheck at it for `api`. For `frontend`, `/login` returns 200
unauthenticated.

---

## Staging

Separate Railway project, **separate Supabase project**, separate R2 bucket,
**freshly generated secrets**. Domain `staging-legal.bigapp.ai`.
Never share secrets between staging and production.

---

## Not yet covered

Database migration strategy on deploy (`backend/migrations/` applies files newer
than the deployed version, in filename order — see `docs/deployment.md`),
backup and PITR policy, and log retention with contract text excluded. These
land in Phase 6.

---

## Automatic deploys

Each service is connected to `BIG-R-D/BIGAgreements`, branch `main`, and a
**repo trigger** is what actually fires a deploy on push. The two are separate:
`serviceInstance.source.repo` can still read `BIG-R-D/BIGAgreements` — so the
UI looks connected — while `service.repoTriggers` is empty and nothing deploys.

That failure mode is silent and easy to misread: the merge looks done, but the
live site keeps serving the previous build.

Check both:

```bash
railway api 'query($id:String!){service(id:$id){name repoTriggers{edges{node{repository branch}}}}}' --var id=<serviceId>
```

Restore with:

```bash
railway service source connect --repo BIG-R-D/BIGAgreements --branch main --service <service>
```

Verify `rootDirectory` afterwards — `backend` for `big-agreements-api`, and
**empty** for `big-agreements-web`, which needs repo-root context because its
Dockerfile copies `backend/src` and `word-addin/src`.
