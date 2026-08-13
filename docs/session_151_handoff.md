---
title: Session 151 handoff (SkyRef → next) — read the prose, then decide the 8
created: 2026-08-13
updated: 2026-08-13
tags: [handoff, sierra, contacts, map-users, silent-failure]
related:
  - "[[docs/map_users_lessons]]"
  - "[[docs/sierra_credit_recs_lessons]]"
  - "[[docs/sierra_training_tab_scope]]"
  - "[[docs/session_150_handoff]]"
---

# You are Session 151

Session 150 was **SkyRef** — four PRs (**#1164**, **#1165**, **#1166**, **#1167**),
cpl-chat **v44 → v46**, one migration. Everything below is merged and live.

## ⚠️ FIRST — read the memory table. This is Rule 8.

```sql
select slug, title, summary, status, event_date from cpl_memory
where status <> 'superseded'
  and (tags && array['sierra','contacts','map-users','staleness','retrieval']
       or summary ilike '%contact%')
order by event_date desc nulls last limit 40;
```

Then read, in order: `docs/map_users_lessons.md` (the 2026-08-13 SkyRef section)
→ CLAUDE.md §11 rows *MAP Users / student contact*, *Sierra retrieval + corpus*,
*Sierra: false absences*, *Sierra Training* → `docs/sierra_training_tab_scope.md`.

## 🎯 PRIORITY 1 — Sam is testing. Nobody has read Sierra's prose.

**This is the third handoff in a row to say this, and it is still true.** The
sandbox is egress-blocked from `*.supabase.co`, so a session can verify the data
layer and the renderers and still be wrong about the answer — which is exactly
how SkyTop's alignment bug survived three deploys. Two acceptance cases:

1. **Cerritos ironworker**, on v46: *"I have a journey worker license as Iron and
   Steel worker. What CPL can I get here?"* Should now name the credentials **and**
   the IWAP courses with units (`IWAP 40.09 — 2 hours in IW - GEN Rigging`).
2. **RCC contact**: *"Does Riverside City College offer firefighter CPL?"* should
   give **Lisa Martin / Lisa.Martin@rcc.edu**, not Rene Felix.

Also still unread: **POST × Cerritos**, where the six C-ID matches should render.

## 📌 Decisions Sam made this run

- **Editable contact proposals: all 25 rows, cascade pre-filled as the default** —
  not just the 8. A curator's knowledge of who answers outranks the cascade.
- ⭐ **A curator proposal is a MAP to-do ONLY — Sierra must not read it.** She keeps
  routing strictly on MAP's own designations. `tests/map_users_proposals.test.js`
  asserts `cpl-chat` never references `map_contact_proposals`. Do not "improve"
  this by wiring it in.
- He confirmed the cascade reading himself and was right; treat his inferences
  about MAP semantics as strong evidence.

## 🧹 PRIORITY 2 — `CLAUDE.md` needs the §11 pare-down, and this run made it worse

The lint has flagged `CLAUDE.md` `always_loaded` for several sessions. It is now
**103,351 bytes against a 60,000 budget (1.72×)**, and the 2026-08-13 checkpoint
**grew it by ~5 KB** despite deleting superseded text — four substantive roadmap
updates plus a session narrative outweighed what came out. Trimming the new prose
recovered under 1 KB before it started costing load-bearing facts, and archiving
the one genuinely-finished row (`Cred-Ref PR-5b/2`) recovered 432 bytes. Those are
rounding errors against the real problem.

**Every session pays this as context tax on turn one.** The structural fix is the
one Rule 9 already names and the 2026-07-10 pare-down already demonstrated: move
prose to `docs/reference/`. Concretely, the fattest §11 cells are *Disposition
grain*, *College action page*, *Local course ↔ CR alignment*, *Sierra retrieval*
and *MAP Users* — each is now several thousand characters of narrative that
belongs in its lessons doc, with the cell reduced to current state + a pointer.
Doing that properly is a session's work, not a checkpoint's, which is exactly why
it keeps not happening. **Consider doing it first, before taking new work.**

## ⚠️ NEEDS SAM — one decision left open

**8 colleges keep a 2026-06-25 snapshot contact where MAP is now blank.** They
fall back under the fail-safe, so they are never worse than before — but MAP is
the system of record, and a blank there could mean that person left the role.
Flagged rather than decided. Ask him; do not decide it silently.

## ⚠️ Things that will mislead you

1. **`chatbox_college_profiles` is stale for everything EXCEPT contacts now.**
   Contacts read live from `map_college_contacts` (v45). Don't re-report the
   contacts half as broken, and don't "fix" it by re-seeding the blob — that
   makes a fresher fossil.
2. **Feedback is at 5, not 25.** Sam triaged it himself. Three of the five are now
   fixed in code and can be cleared.
3. **`map_users.js` `FALLBACK_CONTACTS` is still a hardcoded display layer** — the
   new proposals table did NOT replace it. Two different mechanisms.
4. **Don't pin an implementation detail in a test.** `map_users_contact_quality`
   had pinned the literal `addressWarning(g.proposed_email)` and broke on a
   refactor while the rule it guards was intact. Third session in a row this has
   come up. Guard the behaviour.
5. **`tests/cpl_funding.test.js` hangs** (pre-existing), so `node tests/run.js`
   can't finish; run suites individually. `npm install` first — jsdom isn't
   vendored.

## Carryover

- **The Common CR Reference** — still unscoped. Sam's ruling stands: C-ID is ONE
  factor, not the key (only ~17% of rec strings carry one). Scope it against the
  CCR's actual matching factors before building.
- 12 adoption-file statewide titles absent from `chatbox_credentials`.
- Sierra corpus covers 59 of 123 colleges.
- The 7 `via:"search"` fallback contacts still need confirming; the 17 blanks
  still need working.
- The site-phrase **superset decision** (from 146) still needs Sam.
- The identity crosswalk write to Supabase is still queued.
- The partner-crosswalk engine's **2nd run** is still outstanding.

## Patterns that worked

- **Ask "how many?" before fixing "this one."** One feedback line about RCC was a
  third of the colleges. The query cost 30 seconds and changed the whole shape of
  the fix.
- **Grep for the writer.** "What job refreshes this table?" found the fossil
  faster than reading any consumer. No writer = the copy is a snapshot.
- **Run the new test against the OLD file.** 5 of 18 failed, which is the only
  reason the hand-off test is trustworthy. A test written after a fix that passes
  on both versions guards nothing.
- **Believe the user's reading of the domain.** Sam's inference about the
  Assistant cascade was correct and saved a wrong-headed investigation.
- **Two reports with similar words can be different complaints.** The three
  ironworker rows looked like one issue in the handoff; the newest was a distinct
  defect that would have shipped closed.

## Safety patterns to honour

- Rule 4 — `CPL_Dashboard.html` / `index.html` byte-identical.
- Never force-push `main`; merge on `unstable`, not just `clean`.
- Sandbox is egress-blocked from `*.supabase.co`, college domains and
  `cpl-initiative.github.io` — Supabase via MCP only.
- Sam curates live; fresh-read before any bulk write.
- Migrations apply **immediately** — live before their PR merges. Say so.
- `cpl-chat` deploy is `workflow_dispatch` + typed `DEPLOY`; verify the version
  bumped (`list_edge_functions`) and `verify_jwt` stayed **false**.
- Front-end JS changes ship with **Pages**, no cpl-chat deploy — don't conflate.

## Moniker

**SkyProse** is still unclaimed and still apt — the run that finally reads what
Sierra actually says. Take it or coin your own; if Sam names one, his wins.
