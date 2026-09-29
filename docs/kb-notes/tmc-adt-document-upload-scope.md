---
title: TMC ADT submission — supporting-document upload (CORs → the contact-hours gap)
created: 2026-06-22
kb-status: published
tags: [scope, tmc, adt, co-review, cor, contact-hours, supabase, storage, upload, compliance]
artifacts:
  - tmc_builder.js                          # the tab — gains a per-course upload affordance + reviewer COR link
  - tmc/supabase_tmc_submission_docs.sql    # NEW (proposed) — the document index + private Storage bucket
  - tmc/supabase_tmc_submissions.sql        # the parent submission row (college, tmc_id) the docs hang off
  - tmc_templates.js                        # the C-ID slots a COR is attached against
related:
  - docs/kb-notes/tmc-co-review-scope.md
  - docs/kb-notes/reference-adt-acceptance-rules.md
  - docs/kb-notes/reference-tmc-adt-data-model.md
  - docs/tmc_builder_lessons.md
---

# TMC ADT submission — supporting-document upload

A sub-scope of the [CO-review tool](tmc-co-review-scope.md). Scope-first, no build
yet — react to this, then we apply the schema + wire the UI.

## The problem → the reframe (Sam, 2026-06-22)

An ADT review compares each course's title / number / **units / hours** against the
TMC. We can auto-check title/number/units, but **contact hours are absent from every
structured source we have** — COCI, the PCF, and C-ID descriptors all omit them
([acceptance-rules §4](reference-adt-acceptance-rules.md)). Hours live on the
**course outline of record (COR)**, a per-course document.

The CO has **no structured store** of completed ADT applications either — only the
*status* flows downstream (the COCI Programs extract the tab reads today). Sam's
reframe turns that gap into the asset: **make the TMC tab the intake that mints the
structured data.** Every future ADT application submitted through the tool is *born
structured* (the alignment jsonb in `tmc_submissions`) **plus a COR attached per
course** for the hours. A permanent data gap becomes a growing structured corpus,
and the tab graduates from "review tool" to **system of record for ADT intake**.

→ That requires a **document-upload process** on each ADT application. This scope.

## Decisions locked (Sam, 2026-06-22)

- **Who uploads: the submitting college** — the COR is attached as part of completing
  the application (anon-capable, like the rest of `tmc_submissions`), so applications
  arrive complete rather than reviewers chasing CORs after the fact.

## Design (on the stack we already run)

- **Supabase Storage**, one **private** bucket `tmc-adt-docs`. The COR file is never
  public; the app mints a short-lived **signed URL** for the submitter in-session and
  for signed-in reviewers. (Pending applications are pre-decision; the site is public.)
- **Attach per course, not per application.** A COR documents one course and hours are
  per-course, so the upload affordance lives on each **slot/course row** (right where
  the college picks its local course); one application carries N CORs. `slot_key` =
  the same `"<sectionIdx>:<slotIdx>"` used by `tmc_curator_notes`.
- **A thin index table** `tmc_submission_docs` (`college`, `tmc_id`, `slot_key`,
  `course_code`, `doc_type`, `storage_path`, `filename`, size/type, `created_at`) —
  composite FK to `tmc_submissions (college, tmc_id)` `on delete cascade`. The file
  is in Storage; the row is what the reviewer worklist joins on. Mirrors the
  `tmc_submissions` anon-write RLS; DELETE is reviewer-only (`is_allowed_reviewer()`).
  Schema of record: [`tmc/supabase_tmc_submission_docs.sql`](../../tmc/supabase_tmc_submission_docs.sql).
- **Constraints:** PDF-only, ≤ 20 MB, MIME allow-list — enforced client-side **and**
  in the bucket policy.

## Two feeds, one model

The same table indexes **both** directions:
1. **Backfill** — the CO's existing approval-queue PDFs/CORs Sam is requesting land
   as `doc_type='proposal'`/`'cor'` rows (reviewer-uploaded).
2. **Forward** — born-in-tool COR uploads by submitting colleges (`doc_type='cor'`).

So the backfill and the forward intake path converge on one schema — no second model.

## Authentication & the COCI-embed path (the graduation step)

**Aspiration (Sam, 2026-06-22):** embed the submission form **inside the existing
COCI workflow** and lean on **COCI's own authentication** — the form activates once
the user is logged into COCI, so the submitter arrives already identified as their
college.

**Honest reality — feasible, but it's a CCCCO / CCC Tech Center *partnership*, not a
unilateral build (the "big assumption" is exactly right).** An embedded iframe
**cannot** read COCI's session or cookies (cross-origin isolation) — so we can't
"detect" a COCI login. COCI has to **actively hand us a verified identity**, via one
of the standard handoffs its side would implement:
- **OIDC / SAML SSO federation** to the shared CCC identity service (then "logged into
  COCI" ≈ logged into the same IdP ≈ our app gets a token); or
- an **LTI-1.3-style signed launch** (the LMS-tool pattern: a host app launches an
  external tool, passing the authenticated user + context in a signed token); or
- a **signed-token (JWT) handoff** our existing Supabase Edge Function validates and
  exchanges for a scoped session.

**Recommended path:** ship the **standalone tab with our magic-link auth now** (zero
external dependency — it proves the whole workflow end-to-end), but keep identity
behind a **swappable shim** — the submission keys on `college` regardless of auth
source, so replacing magic-link with a COCI-provided assertion later is a *localized*
change, not a rebuild. Then pitch the embed to the CCCCO / Tech Center as the
**graduation step**, prototype in hand (far easier buy-in for "embed this proven tool"
than for a greenfield integration). It's the same "prototype here → promote into the
official system later" move the project already plans for MAP. **Data stays in our
Supabase** (we own the structured corpus + the acceptance engine); COCI would provide
auth + the embed surface. Bonus: a real COCI identity also retires the anon-write
caveats in the schema below (who-can-delete, abuse) — the swap is pure upside.

## Phasing

- **Phase 1 — capture + surface.** Upload affordance per course; store file + index
  row; reviewers (and the submitter) get a **📄 COR** link inline on the course row.
  Even with **zero** parsing, evidence-on-the-row already replaces the staffer's blind
  file-pile dig — the [triage-not-verdict](reference-adt-acceptance-rules.md) ethos.
- **Phase 2 — parse COR → contact hours.** Extract lecture/lab hours from the COR PDF
  and feed the engine's hours axis. **Format-dependent** (CurricUNET / eLumen / Modern
  Campus lay CORs out differently) → same "get a few sample CORs, measure consistency
  before committing to a parser" rule that governs the queue PDFs.

## Honest limits / open at build-time

- **Hours = a consistency check, not template conformance.** Even with COR hours in
  hand, C-ID descriptors/TMC slots carry no *required* hours value, so the check is
  "do stated hours match the units via the Title 5 ~48–54 contact-hrs/unit convention;
  do peer colleges agree?" — a useful triage flag, not a pass/fail gate.
- **Storage object cleanup.** The FK cascade clears index rows on submission delete,
  but Storage objects aren't FK-aware → a periodic prefix sweep (or a delete hook)
  reaps orphans. Low urgency (storage is cheap; hard-deletes are rare).
- **Exact Storage RLS** (anon-upload + signed-URL read) finalized at apply-time; the
  SQL file carries the illustrative policy DDL.
- **Applying is the gated next step** — the bucket + table go in via the Supabase MCP
  (additive: new bucket + new table, touches nothing existing), once this scope is OK'd.
