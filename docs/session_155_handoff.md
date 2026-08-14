---
title: Session 155 handoff (SkyHaul → next) — build sierra_rules, then the two-lane memory tab
created: 2026-08-14
updated: 2026-08-14
tags: [handoff, sierra, governance, architecture, ace, ccrr, curation]
related:
  - "[[docs/kb-notes/adr-judgment-in-tables-mechanism-in-code]]"
  - "[[docs/military_cr_reference_scope]]"
---

# You are Session 155

Session 154 was **SkyHaul**. One PR (**#1178**, merged `e67706f`): **Sierra can
now name the colleges that have adopted a credential.** The session started on
the ACE spine and got pulled onto a live Sierra defect Sam hit while testing —
correctly, because it was mis-routing students.

## ⚠️ FIRST — read the memory table. This is Rule 8.

```sql
select slug, title, summary, status, event_date from cpl_memory
where status <> 'superseded'
  and (tags && array['sierra','governance','architecture','ace','ccrr','curation']
       or summary ilike '%adopter%')
order by event_date desc nulls last limit 40;
```

Seven rows were written on 2026-08-14. **Do not re-derive:**
`sierra-adopter-names-never-reached-the-prompt`,
`sierra-builtin-rules-outrank-team-guidance`,
`judgment-in-tables-mechanism-in-code` (Sam's principle),
`sierra-rules-stay-separate-from-cpl-memory` (the recommendation he accepted),
`ace-not-a-topic-gets-canonical-crs`, `ace-individualized-assessment-never-granted`,
`ace-unit-variants-are-one-ccrr`.

## ✅ What closed this run

**Sierra could not name adopting colleges because every credential RPC returns a
COUNT.** Sam, as a civic leader: *"Our teens earned an AWS D1.1 welding
certificate with a practical test. Where can they get college credit for it?"*
She named **Victor Valley** (which merely *teaches* welding — it is on
`potential_colleges`) and told him to go **ask**. Bakersfield, Barstow, Orange
Coast and Santa Ana have all articulated AWS D1.1 SMAW.

⭐ **She was not disobeying.** `cardinality(c.adopter_colleges)::integer` in all
three credential RPCs meant the prompt said `ADOPTED it: 4` and the names existed
nowhere in her context. Sam's `sierra_guidance` rule (written 13:33, tested
14:49) was active and correct and **could not be obeyed**. Third instance of the
same shape — a curated, nightly-synced dataset no consumer ever read.

Fixed with `fetchCredentialAdopters()`: batched **exact-key `.in()`** lookup on
`chatbox_credentials`, keyed on titles already matched — deliberately not another
search RPC, which would be a second matcher that can drift. No migration needed;
`sb` holds the service key. `tests/sierra_adopter_names.test.js`, **19 checks,
verified against the PRE-FIX source (3/19 there).**

## 🎯 PRIORITY 1 — `sierra_rules` + the overlay

Sam's build order, in his words: **"1 then 2 then 3."** Read
[`docs/kb-notes/adr-judgment-in-tables-mechanism-in-code.md`](kb-notes/adr-judgment-in-tables-mechanism-in-code.md)
first — it is the decision record and it carries the four tests.

Schema: `key`, `title`, `body`, `applies_when`, `sort_order`, `active`,
`memory_slug`, `updated_by/at`.

⚠️ **The overlay rule is load-bearing: the table OVERLAYS code defaults, never
replaces them.** A failed read must cost the *edits*, never the *governance* —
Sierra ungoverned is far worse than Sierra un-tuned.

⚠️ **Model `applies_when`, don't flatten.** Several rules are injected
conditionally (`${credentialContext ? CREDENTIAL_RULE : ""}`,
`${alignmentContext ? ALIGNMENT_RULE : ""}`, …). Flattening them all to
always-on bloats the prompt and fires rules out of context.

⚠️ **`sort_order` is the point.** Today the prompt *promises* "the team guidance
wins" and it does not — a specific `never` earlier beat a general instruction
appended later. Precedence has to be data, not a sentence.

**Ship the "which rules were in play for this answer" view with it.** The ADR
argues this is worth more than editability: what would have saved Sam four hours
was *seeing* `STATEWIDE_RULE` fighting his instruction, not being able to edit it.

## 🎯 PRIORITY 2 — the two-lane memory tab · PRIORITY 3 — the drift check

Two lanes (`cpl_memory` = what we know; `sierra_rules` = what Sierra does),
linked by `memory_slug`, rendered in one tab. Then the cron check that reports
**"decided in memory, no Sierra rule implements it"** — proposes, never
auto-adds. It would have caught this run's bug, the statewide flag and the
`ccc_rec` gate.

## 🔴 OWED TO SAM — do these early, they are small and he is waiting

1. **`STATEWIDE_RULE` rewrite.** He is writing the wording himself; it lives at
   `chatbox/supabase/functions/cpl-chat/index.ts:1860` and is editable **only**
   by code + deploy (that is the whole reason for Priority 1). The distinction
   his text needs: *"this credential is housed at Barstow"* (false, keep
   forbidding) vs *"Barstow has already articulated it, here is their page"* (a
   fact, and the answer). **Ask him for it if he has not sent it.**
2. **The `sierra_guidance` instruction.** Drafted and approved in principle
   (~930 chars, in the session transcript and restated below). **It was
   deliberately NOT written yet** — it had to land *after* #1178 deployed, or it
   fails identically to the 13:33 rule and reads as Sierra ignoring him a third
   time. **Verify the deploy landed, then write it.** Per DR-11 the wording is
   his call.
   > When a credential has colleges that have already articulated it, name those
   > colleges first — before explaining that it is a statewide standard, and even
   > when you don't know where the person is; let them decide what is near.
   > Include each college's CPL landing page and contact when you have them. A
   > college that merely teaches the subject has not articulated it — never blend
   > the two lists. Naming colleges that have adopted a statewide recommendation
   > is a fact, not a claim that the credential is housed at or owned by them.
3. **The "Send note" composer.** Sam: *"it turns gray but nothing else — not sure
   if it registers."* **It does register** — his note is in `sierra_feedback`,
   `turn_id 6e995f3d`, 449 chars, `14:50:35 UTC`. The defect is pure feedback:
   the button greys, the confirmation renders far away in the action row next to
   Copy, and **the composer stays open with the typed text still in it**. Clear
   or close it on success and put the confirmation at the button.

## 🎯 PRIORITY 4 — the ACE spine (unstarted; Sam's four rulings are LOCKED)

`docs/military_cr_reference_scope.md` has the measurement. **All four open
questions in its §10 are now answered** — update that doc, it still reads as open:

1. **Units:** ONE CCRR, units shown as a spread. Unblocks rung 2, 2,244 strings.
2. **Not-a-topic:** ⭐ **Sam CORRECTED the scope doc.** Rung 0 is not "exclude
   from the vocabulary" — *"We still need a canonicalized CR for it to account
   for every CR in the corpus."* Coverage is the goal. 43 strings / 6,626 rows →
   **3 canonical CRs**: `Credit Is Not Recommended` (absorbing the 13
   with-a-reason strings, reason kept as an attribute), `Credit May Be Granted by
   Individualized Assessment`, `Credit Is Not Recommended Until Prerequisite
   Completed`.
   ⚠️ **Class 3 is NOT a "no" and must never be auto-N/A'd** — 2,730 rows across
   95 colleges where ACE says credit *may* be granted after review, and it has
   **never once been granted anywhere** (0 applied, all four classes). Marking it
   N/A records a decision nobody made.
3. **Granularity:** suggestion-only, pairwise, never transitive.
4. **Evidence:** publish **both** fields, guarded — Sierra must never say "no
   evidence required" for a military exhibit (blank there by design).

Then the worklist, **ranked by ROWS** (collapse value does not transfer — every
head topic already sits at 80–100 of 108 colleges).

## ⚠️ Things that will mislead you

1. **A `sierra_guidance` rule that "isn't followed" may be unfollowable.** Check
   whether the data it asks for is even in the prompt before treating it as a
   model-compliance problem. That is what cost this run its first hour.
2. **`sb` in `cpl-chat` is the SERVICE key**, so RLS is never the reason a read
   comes back empty there. Do not chase RLS on that path.
3. **Column names**: it is `map_college_cr_unit.college_id`, not `college`;
   `sierra_guidance.rule`, not `guidance`; `sierra_feedback.turn_id`, not `id`.
   Query `information_schema.columns` first — three failed guesses this run.
4. **`chat_interactions.source_sections` is JSON** — `left(...)` on it errors.
5. **The known-red `governance.test.js` on `main` is still red** (25th drift
   candidate; the guard is working, the queue needs triage). Every PR shows a red
   non-required `test` check. **Check the failing test NAME before assuming it is
   yours.** `cpl_funding.test.js` also still hangs (rc=124), so `node tests/run.js`
   cannot finish — run suites individually.
6. **`cpl-chat-deploy.yml` requires `confirm: DEPLOY`** as a dispatch input. A
   bare dispatch 422s.

## 🔴 NEW known-red: `cpl-chat smoke test` mode 14a

Failing on `main` since at least `e67706f`. **One assert, and it is a STALE TEST,
not a Sierra defect:**

```
##[error]14a default surfaces the CPL contact: expected answer to match /romero|mdromero/
```

Sierra answers *"Rachel Russell — rrussell@sdccd.edu"* for San Diego Mesa. Every
other mode passes, 14b still correctly suppresses the contact on `ctx=external`.

⚠️ **Do NOT just swap in `russell`** — that hard-codes the next person to leave.
The test asserts a **human being's surname** while Sierra reads
`map_college_contacts` **live** (since v45), and the roster sync was moved to
**daily** on 2026-08-13 *because MAP's contacts change*. A test pinned to an
individual will break every time a college changes staff.

The fix is to assert the **shape** — that a name and an `@` address are present
and that 14b still suppresses them — rather than the identity. Check first
whether 14a was deliberately pinned to verify a `FALLBACK_CONTACTS` path rather
than the live roster; if so the fix is different, and that distinction is exactly
what `map_contact_proposals` vs the live table is about. **Worth telling Sam
either way: it may mean Mesa's contact genuinely changed in MAP.**

## 🧹 Carryover

- **The §11 pare-down is owed for a THIRD session.** `stacked_roadmap_cell` still
  flags **"MAP Users / student contact"**. Left again this run for the same
  honest reason: SkyHaul never worked that row. **Someone who has should do it.**
- 6 `oversized_doc`, 57 `kb_note_dialect`, 44 `vault_heavy_path` in
  `kb/docs_audit/2026-08-14.md`.
- Sam still owes the **freehand** CR head (top ~50 groups); the signal wanted is
  which rungs he overrides.
- Older: 12 adoption-file statewide titles absent from `chatbox_credentials` ·
  corpus covers 59 of 123 colleges · the 7 `via:"search"` contacts · the
  site-phrase superset decision · the identity crosswalk write to Supabase · the
  partner-crosswalk engine's 2nd run.

## Patterns that worked

- **Ask the blocking questions in ONE call, early, while he is at the keyboard.**
  Four decisions came back in one round trip and two of them changed the build.
- **Show him the data instead of describing it.** He asked to see the not-a-topic
  strings, and seeing them is what produced the ruling that corrected the scope
  doc — the classes were visibly four different meanings, not one.
- **Measure the disposition, not just the population.** "0 applied across all
  four classes" is what turned a free auto-N/A win into a door nobody should
  close.
- **Verify a test against the pre-fix source.** 3/19 → 19/19 proves it reproduces
  the defect rather than describing the fix.
- **Say when a recommendation is reasoned rather than measured.** The two-lane
  split is an argument; the adopter bug was a measurement. Sam deserves to know
  which is which.

## Safety patterns to honour

- Rule 4 — `CPL_Dashboard.html` / `index.html` byte-identical (`cmp -s`).
- Never force-push `main`; merge on `unstable`, not just `clean`.
- Sandbox is egress-blocked from `*.supabase.co` and the MAP hosts — Supabase via
  MCP only, MAP via an Actions-runner workflow only.
- `cpl_memory` CHECK constraints: `summary` ≤400, `detail` ≤4000, `kind` ∈
  fact/pitfall/opportunity/risk/wishlist/question/decision/milestone/procedure,
  `org` ∈ cpl/ci/cip/gr/shared.
- **A public-bot deploy is outward-facing.** Say so before dispatching it.
- The stop hook's "unpushed commits" nag after a squash-merge is a false
  positive. Verify, then ignore. Never amend.

## Moniker

**SkyProse** is still unclaimed (offered four times now). Or coin your own; if
Sam names one, his wins.
