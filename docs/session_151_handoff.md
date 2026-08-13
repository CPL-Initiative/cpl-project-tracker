---
title: Session 151 handoff (SkyRef → next) — the CR Reference tab, and the EACR filters
created: 2026-08-13
updated: 2026-08-13
tags: [handoff, cr-reference, eacr, sierra, contacts]
related:
  - "[[docs/sierra_credit_recs_lessons]]"
  - "[[docs/map_users_lessons]]"
  - "[[docs/sierra_training_tab_scope]]"
---

# You are Session 151

Session 150 was **SkyRef** — eight PRs (**#1164–#1171**), cpl-chat **v44 → v47**,
three migrations, one cron change. All merged and live.

**Sam queued two things for you, in this order.**

## ⚠️ FIRST — read the memory table. This is Rule 8.

```sql
select slug, title, summary, status, event_date from cpl_memory
where status <> 'superseded'
  and (tags && array['sierra','cr-reference','curation','retrieval','contacts']
       or summary ilike '%credit_rec%')
order by event_date desc nulls last limit 40;
```

## 🎯 PRIORITY 1 — Plan and build the Common CR Reference tab

Sam proposed this 2026-08-13 and has now asked for it to be built. **Scope it
before you write code** — CLAUDE.md §11 *Common CR Reference* has the full row.

⭐ **His design ruling, and do not quietly re-litigate it:** *"CID is only one
factor in determining common CR references. Similar to the CCR, we take into
account matching factors like title, course name and number, course description,
subject, etc."* His list is **illustrative, not exhaustive** — ask before
freezing it. Recorded verified + attributed as
`cpl_memory:common-cr-reference-is-multi-factor-not-cid-keyed`.

The measurement backs him harder than the session's own caution did. C-ID as key
fails **both** ways:
- **over-merges** — POST carries `AJ 110` on two genuinely different lines, a
  repeat Sam ruled must be FLAGGED, never auto-resolved;
- **under-merges, far bigger** — only **402 of 2,344** distinct `credit_rec`
  strings carry a C-ID at all (**~17%**), stranding ~1,942 as their own canonical.

Numbers to start from: **2,344** distinct strings → **2,187** after mechanical
normalisation (**~7% collapse, so this is CURATION, not string-cleaning** —
exactly the CER's situation); 402 C-ID-bearing → **175 distinct C-IDs**, 81
carrying 2+ wordings, worst `AJ 110` → **10 wordings**; curated spine already in
place = **351 statewide lines / 134 credentials**.

**Read the CCR's actual matching factors first** and model on them — that is what
Sam asked for. The CER is the other precedent worth reading for how a freehand
vocabulary got canonicalised.

## 🎯 PRIORITY 2 — Debug the EACR tab filters

Sam: *"filters need drop downs and they don't all work."*

Surface is mapped for you — tab **`exhibit-adoption`**, file
**`statewide_interactive.js`**, **8 checkbox multi-selects** in `state.filters`:
`collabType · cplType · sector · discipline · issuer · college · district ·
swRegion`. He wants **dropdowns** instead of checkbox lists.

**The data layer is sound — I verified it, so do not start there.** 2,672
exhibits: `cpl_type`/`discipline`/`collaborative_type` **100%** populated,
`sector` 85%, `issuing_agency` 75%; `college_lookup` resolves **120 of 122**
adopter/potential names.

⚠️ The two misses are **`CA MAP INITIATIVE COLLEGE`** and **`Calbright College
Non-Credit`**, and `collegeMatchesFilters()` **fails closed** on a `LOOKUP` miss —
so the district and swRegion filters silently drop them. Note the first is the
same sandbox org Sam flagged in the dropdowns: **the EACR data carries it too**,
so it wants the same `entity_kind` treatment.

⚠️ **ASK SAM WHICH FILTERS FAIL before building.** The fields all carry data, so
the defect is in the control wiring or the option lists, and guessing which of
eight is wrong would waste the run.

## 📌 Decisions Sam made this run

- **Roster sync is DAILY** (was monthly). Sierra reads contacts live now, so
  stale means a student emails the wrong person.
- **Curator contact proposals are a MAP to-do ONLY — Sierra must never read
  them.** A test asserts `cpl-chat` never references `map_contact_proposals`.
  This is a decision, not an oversight; do not "improve" it by wiring it in.
- **All 25 gap-contact rows editable**, cascade pre-filled as the default.

## ⚠️ Things that will mislead you

1. **The Sierra Training gap pane is no longer 78 rows — it is ~13.** 83% was the
   CI smoke test. If you see a big number again, check `session_id='smoke-ci'`
   before treating it as a backlog.
2. **Duplicate question pairs are NOT flapping.** The smoke suite asks each
   question twice and one probe deliberately has no college context. 43% of
   punts have a successful twin within 45 seconds. Do not "fix" it.
3. **`chatbox_college_profiles` is stale for everything EXCEPT contacts** — those
   read live from `map_college_contacts` since v45. Do not re-seed the blob.
4. **`map_colleges.entity_kind` already exists and is correct.** Three times this
   run the bug was "the right value existed and the consumer never asked it"
   (contacts, the statewide flag, the sandbox orgs). **Worth a deliberate sweep**
   for other reads that ignore a classifier.
5. **`CLAUDE.md` is 1.7× its lint budget** — see below.
6. **`tests/cpl_funding.test.js` hangs** (pre-existing), so `node tests/run.js`
   cannot finish; run suites individually. `npm install` first.

## 🧹 Carryover — the §11 pare-down is still owed

`CLAUDE.md` is **~105 KB against a 60,000 budget**. The 2026-08-13 checkpoints
grew it despite deleting superseded text. The fix Rule 9 names: move narrative
out of the fattest cells (*Disposition grain*, *College action page*, *Local
course ↔ CR alignment*, *Sierra retrieval*, *MAP Users*, *Sierra Training*) into
their lessons docs, leaving current state plus a pointer. A session's work, which
is why it keeps not happening.

Other carryover: 12 adoption-file statewide titles absent from
`chatbox_credentials` · corpus covers 59 of 123 colleges · the 7 `via:"search"`
fallback contacts need confirming · the site-phrase superset decision (from 146)
· the identity crosswalk write to Supabase · the partner-crosswalk engine's 2nd
run.

## Patterns that worked

- **Ask "how many?" before fixing "this one."** One feedback line about RCC was
  41 colleges. One request to bulk-mark a list revealed 83% of it was robots.
- **Measure before advising.** Sam chose group-by-question before either of us
  knew the list was 83% CI; the measurement made it unnecessary, and saying so
  was better than building it.
- **Grep for the writer.** "What job refreshes this table?" found the contacts
  fossil faster than reading any consumer.
- **Run the new test against the OLD file.** 5 of 18 failed on the hand-off test,
  which is the only reason it is trustworthy.
- **Two reports with similar words can be different complaints.** The three
  ironworker rows looked like one issue; the newest was a distinct defect.

## Safety patterns to honour

- Rule 4 — `CPL_Dashboard.html` / `index.html` byte-identical.
- Never force-push `main`; merge on `unstable`, not just `clean`.
- Sandbox is egress-blocked from `*.supabase.co` and college domains — Supabase
  via MCP only. **You cannot read Sierra's prose; Sam has to.**
- Migrations apply **immediately**, ahead of the PR merge. Say so when reporting.
- `cpl-chat` deploy is `workflow_dispatch` + typed `DEPLOY`; verify the version
  bumped and `verify_jwt` stayed **false**. Front-end JS ships with Pages instead
  — do not conflate the two.
- The stop hook's "unpushed commits" nag after a squash-merge is a false
  positive. Verify, then ignore. Never amend.

## Moniker

**SkyProse** is still unclaimed. Or coin your own; if Sam names one, his wins.
