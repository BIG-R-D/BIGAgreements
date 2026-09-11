# Open-source compliance

**This is an engineering implementation checklist, not legal advice.** Items
marked **[legal review]** need a lawyer's sign-off before production.

---

## What this project is

BIG Agreements is a modified version of [Mike (MikeOSS)](https://github.com/open-legal-products/mike),
licensed under the **GNU Affero General Public License v3.0 only**
(`LICENSE`, 661 lines; `AGPL-3.0-only` is declared in the root, `backend/` and
`frontend/` package manifests).

We fork it, modify it, white-label the member-facing brand, and operate it as a
hosted service for BIG members.

---

## What the AGPL permits us to do

- **Modify the software.** Freely.
- **Run it as a hosted service.** Freely.
- **Rebrand the member-facing product.** Trademarks and product naming are not
  what a copyright licence governs. Calling the member-facing product
  "BIG Agreements" is a branding decision, not a licence question.
- **Keep the WordPress plugin under a different licence**, provided it is a
  genuinely separate work — see below.

## What the AGPL requires of us

### 1. Section 13 — the network source offer ⚠️ currently unmet

> A modified version conveyed over a network must offer its users access to the
> corresponding source.

**Upstream Mike ships no such notice anywhere in the application.** Once BIG
members interact with our modified version over the network, that obligation is
ours.

**Status: addressed in Phase 1.**

- `frontend/src/app/components/shared/OpenSourceNotice.tsx` renders the offer.
- It appears on the login and signup screens — reachable without an account,
  because the offer is owed to everyone who interacts with the service.
- The link target is `NEXT_PUBLIC_OPEN_SOURCE_NOTICE_URL`
  (default `https://github.com/BIG-R-D/BIGAgreements`).

**Open item [legal review]:** the repository is currently public, which
satisfies the offer directly. If BIG makes it private, the notice must instead
point at a location that actually serves the corresponding source of the
*running* version. Going private without changing this would leave a notice
pointing at a 404 — worse than no notice.

### 2. Preserve copyright and licence notices

- `LICENSE` stays in place, unmodified.
- `"license": "AGPL-3.0-only"` stays in every package manifest.
- Upstream copyright headers are not removed.

Note the deliberate distinction: **member-facing branding and licence notices
are separate concerns.** We change what members see; we do not touch what the
licence requires us to keep.

### 3. Document our modifications

Section 5(a) requires modified files to carry prominent notice of change.

- Every BIG-authored file lives under `backend/src/big/**`,
  `frontend/src/app/lib/branding.ts`, or a file whose header says what changed.
- Modifications to upstream files are enumerated in `docs/UPSTREAM_SYNC.md` and
  are, by policy, limited to replacing hardcoded literals with configuration
  reads.
- Git history is the authoritative record; `upstream` remains configured so the
  diff against the original is always computable:
  ```
  git diff upstream/main --stat
  ```

---

## The WordPress plugin boundary

`big-agreements-wordpress` is deliberately:

- in a **separate repository**,
- a **separate deployable**, distributed separately,
- communicating **only over HTTP** (signed JWTs in, signed webhooks out),
- sharing **no code** with this repository — no linking, no imports, no
  vendored files.

On that basis it is a separate work rather than a derivative of Mike, and is not
obliged to be AGPL.

**Do not** bundle the plugin into this repository, vendor Mike code into it, or
create a shared library imported by both. Any of those would put this argument
at risk.

**[legal review]** — confirm the boundary before the plugin is distributed
outside BIG.

---

## Third-party dependencies

Separate from the AGPL obligation. Not yet inventoried.

**To do before production:**
- Generate a dependency licence inventory for `backend/`, `frontend/` and the
  plugin.
- Flag any copyleft dependency whose terms are stricter than AGPL-3.0.
- Flag any dependency whose licence is incompatible with hosted commercial use.

Note: LibreOffice (invoked as an external `soffice` binary for document
conversion, per `backend/Dockerfile`) is MPL-2.0 and is *executed*, not linked —
that distinction matters and should be recorded in the inventory.

---

## Checklist before production

- [x] `LICENSE` intact
- [x] `AGPL-3.0-only` declared in all manifests
- [x] Section 13 source notice rendered in the application
- [x] `upstream` remote retained so modifications remain computable
- [ ] Decide whether `BIG-R-D/BIGAgreements` stays public **[legal review]**
- [ ] Third-party dependency licence inventory
- [ ] WordPress plugin separation confirmed **[legal review]**
- [ ] `docs/UPSTREAM_SYNC.md` written and kept current

---

## Questions for legal

1. Does BIG intend to keep the fork public? If not, how is the section 13 offer
   served to members?
2. Is the WordPress plugin's separation sufficient to keep it outside the AGPL?
3. Does hosting for members (as opposed to the public) change the section 13
   analysis? Our engineering assumption is that it does not — members are
   network users.
4. Are there BIG contractual or client obligations that conflict with operating
   AGPL software?
