---
title: Session 147 handoff (SkyFund → next) — Contracts is on the Finance phrase, and the trainer's backlog has still never been worked
created: 2026-08-12
updated: 2026-08-12
tags: [handoff, team-phrase, auth, sierra-training, rls, governance]
related:
  - "[[docs/team_phrase_lessons]]"
  - "[[docs/sierra_training_tab_scope]]"
  - "[[docs/kb-notes/methodology-a-shared-credential-can-only-scope-to-an-exclusive-surface]]"
  - "[[docs/session_146_handoff]]"
---

# You are Session 147

Session 146 was **SkyFund**. Sam named it. Six PRs (**#1137–#1141**, **#1144**), one
production deploy (**cpl-chat v39**), and two migrations — `site_phrase_fin_additive`
and `site_phrase_fin_contracts_swap`, the second applied last, on Sam's go.

## ⚠️ FIRST — read the memory table. This is Rule 8.

```sql
select slug, title, summary, status, event_date from cpl_memory
where status <> 'superseded'
  and (tags && array['team-phrase','auth','sierra','rls'] or summary ilike '%phrase%')
order by event_date desc nulls last limit 40;
```

Then read, in order: `docs/team_phrase_lessons.md` → `docs/sierra_training_tab_scope.md`
(its 2026-08-12 section) → CLAUDE.md §11 (two new roadmap rows).

## What shipped

- **A masthead phrase control** (#1137). 7 tabs consumed the phrase and offered
  **no box** — each said *"sign in on Team & RACI … and re-open this tab"*, and
  two of them gate a READ, so the bounce cost the whole tab. Now one 🔒/🔓
  control that follows the Site dropdown.
- **Site-scoped phrases.** A tab can demand a site phrase **only if it is
  EXCLUSIVE to that site**; `cobi_orgs.js` already held that list, and exactly
  two qualify. `fin_pass_ok()` created; Finance row added.
- **🔑 Team Phrases is a tab** (#1141) — visible to all, contents on a
  magic-link reviewer sign-in. The phrase deliberately does not open it.
- **Sierra Training is usable by a human** (#1138) — SkyLink's Priority 1,
  closed. Plain language, hover-overs everywhere, and the character limit fixed.
- Three KB notes (#1139 + two in the checkpoint, #1144).

## ✅ DONE at the very end of 146 — the Contracts swap landed

Do **not** redo this. Sam rotated the Finance phrase himself on the new 🔑 Team
Phrases tab (`team_access.fin` updated 2026-08-12 20:33 UTC — which also proved
the tab works end to end), then said *"we're good to turn on"*. Migration
`site_phrase_fin_contracts_swap` applied: **12 policies to `fin_pass_ok()`**,
DELETE still reviewer-only, `team_pass_ok()` gone from the register. Verified
post-apply.

**If Contracts looks broken to someone**, the answer is almost always that they
hold the shared phrase and not the Finance one — the tab renders its own unlock
box for exactly that case. Rollback, if it is ever needed, is re-widening those
12 to `(is_allowed_reviewer() or team_pass_ok())`; no data moves.

## 🎯 PRIORITY 1 — the superset decision (now the top open item)

**Is a site phrase meant to be a superset?** Under Sam's "allow either" ruling it
opens its own tabs *plus* every shared one, because `team_pass_check()` matches
any secret in `team_access`. That is safe only while **every phrase holder is
trusted with all shared CPL data** — budget, personnel, projects, memory, MAP
contacts.

**Raise it before the Finance phrase reaches anyone in Finance — it is live now, so this is no longer hypothetical.** The split is
small: a `scope` column, with `team_pass_check()` matching only `scope='shared'`.
It is a decision about *who you hand a credential to*, not about code — so it is
Sam's, and it should be asked rather than assumed either way.

## ⚠️ Four things that will mislead you

1. **There is no `cpl` phrase.** `team_access` holds `ci`, `gr`, `raci`. What
   everyone calls "the CPL phrase" is the `raci` row. Do not go looking.
2. **A filtered read is not an empty one.** `team_access` (and any
   reviewer-gated table) returns **`200 + []`** to a non-reviewer, never 403.
   "Nothing configured" would be the opposite of the truth. Same on write: a
   policy-filtered PATCH answers 200 with an **empty body**, so an "ok" write
   must also prove it touched a row.
3. **C&I and CIP have zero gated tables of their own.** Their phrase protects
   nothing. That is measured, not assumed — do not build isolation for them
   without first finding something to isolate.
4. **The Sierra instruction caps are a PAIR.** `GUIDANCE_RULE_MAX` in
   `sierra_training.js` must equal `GUIDANCE_MAX_CHARS_PER_RULE` in
   `chatbox/supabase/functions/cpl-chat/index.ts` (1500), and the totals likewise
   (9000). Raising one alone just moves the silent truncation. `tests/sierra_training_plain.test.js`
   asserts the equality; **a change to either needs a cpl-chat deploy.**

## Carryover

- **Sam must retype three Sierra instructions.** They were truncated at 500 chars
  before the fix and **the lost text is not recoverable** — raising the cap does
  not restore what was never stored. Two cut mid-sentence, one mid-table.
- **The trainer's feedback backlog has still never been worked** — ~25 real rows,
  11 thumbs-down, oldest since 1 July. The tab is now usable; nobody has used it.
  This is the `contact-refresh-cadence-never-run` shape again.
- **Projects Editor is a free win** — `projects` INSERT/UPDATE already accepts
  `team_pass_ok()`, but the tab offers magic-link only.
- **Phase 2 of the team-phrase plan is still unexecuted** — CER / Unified Courses
  / Canonical SUBJ4 cannot take a phrase because `kb_curation`'s INSERT binds
  `reviewer_email` to the JWT. Needs the `team:<name>` attribution decision.
- From 146: the identity crosswalk write to Supabase was queued and is not mine —
  check `docs/session_146_handoff.md` Priority 2.

## Patterns that worked

- **Measure the premise before building to it.** The ask assumed the Site
  dropdown gated auth. It did not, and one SQL query showed that a single phrase
  already opened everything. That turned a large project into a small one.
- **The repo had already answered it.** `cobi_orgs.js`'s `EXCLUSIVE` list *was*
  the rule for which tabs can carry a site phrase. Re-reading beat generating.
- **Identical lengths are a fingerprint.** Two instructions at exactly 500
  characters is not a coincidence — it is a truncation signature.

## Safety patterns to honour

- Rule 4 — `CPL_Dashboard.html` and `index.html` byte-identical. Verify with `diff`.
- Never force-push `main`.
- Sam curates live; fresh-read before any bulk write.
- The sandbox is egress-blocked from `*.supabase.co`, college domains **and
  `cpl-initiative.github.io`** — Supabase goes through the MCP, and you cannot
  verify a Pages deploy by fetching the site.
- Merge on `unstable`, not just `clean`.

## Moniker

**SkyLedger** is offered — this run put a real Finance boundary in place and left
its ledger of open decisions. Take it or coin your own; Sam sometimes names one
in his greeting, and if he does, his wins.
