---
title: Session 153 handoff (SkyCall → next) — work the head, then the military lane
created: 2026-08-13
updated: 2026-08-13
tags: [handoff, cr-reference, ccrr, curation, military, ace]
related:
  - "[[docs/common_cr_reference_lessons]]"
  - "[[docs/common_cr_reference_scope]]"
  - "[[docs/kb-notes/methodology-a-normalisation-and-its-screens-must-see-the-same-text]]"
superseded: true
superseded_by: session_154_handoff.md
---

# You are Session 153

Session 152 was **SkyCall**. One PR (**#1176**): the **Common CR Reference
worklist is built and live** — Sam's Priority 1, closed.

## ⚠️ FIRST — read the memory table. This is Rule 8.

```sql
select slug, title, summary, status, event_date from cpl_memory
where status <> 'superseded'
  and (tags && array['cr-reference','ccrr','curation','identity','military']
       or summary ilike '%credit_rec%')
order by event_date desc nulls last limit 40;
```

Seven rows written this run. Two you must not re-derive:
`ccrr-naming-cascade-ccn-cid-mid` (Sam's ruling) and
`ace-lane-is-88pct-of-the-map-cr-vocabulary` (the whole shape of what's left).

⚠️ Also read **`ccr-identity-gate-mechanism-was-corrected`** — a deliberate
conflict flag. A `verified`, Sam-sourced row still describes the rung-3 gate as
"not cartesian AND subject agrees". **That mechanism does not work** (it fails on
the very case it was built for); his *intent* stands, the mechanism was replaced
by the credential's course count. Rule 8 forbids silently superseding a
human-sourced row, so it is flagged rather than retired.

## What shipped

- `kb/_build_cr_reference.py` → `kb/cr_reference_worklist.json` — **2,159
  groups, 156 carrying a decision**, ranked by **collapse value**.
- `cr_reference.js` — team-gated tab, nav **"Common CR Reference"** (beside CCR
  / CSR / CER). Confirm / split out / **+ Add a wording** / not-a-topic / defer,
  curator attribution, CSV receipt.
- Gated Supabase `cr_reference_decisions`, keyed on `group_key` — a rebuild can
  never overwrite a judgement.
- `tests/cr_reference.test.js` — **42 checks**, verified against the pre-fix
  builder (A4 + A5 fail there).
- Cron rebuilds + commits the worklist; `pages.yml` asserts both files are
  served.

## 🎯 PRIORITY 1 — get Sam through the head, and watch which rungs he overrides

The queue is ranked so the top ~50 groups are most of the value (**top 50
strings = 49.4% of all articulation rows**). Ask him to work them and **record
which automatic rungs he rejects** — that is the cheapest signal we will ever
get on whether the rung order is right, and it costs him minutes rather than a
review cycle.

Watch especially the **38 divergent-title groups** badged `AJ 110? — check`. If
he accepts most, the divergence guard is too conservative. If he rejects most,
it is load-bearing and the C-ID-through-articulation path needs tightening.

## 🎯 PRIORITY 2 — the military lane, which needs its own scoping pass

Sam: *"assign a CCRR to each CR in the MAP dataset. The military ones may be the
stickiest."* Measured on `map_college_cr_unit` (204,683 rows):

| Lane | Rows | Distinct CR strings |
|---|---:|---:|
| `source_code='ACE'` | 200,840 (98.1%) | **10,117 (88.5%)** |
| `source_code='MAP'` | 3,254 | 1,231 |

**11,426 distinct strings — ~5× the 2,344 the current worklist covers.**

⭐ **Do not just point the existing builder at it.** The reason the military lane
is sticky is structural: **ACE recommendations are SUBJECT AREAS, not courses** —
`3 hours in Supervision` (2,986 rows), `Computer Applications`,
`Communications`, `Industrial Safety`, `Leadership`, `1 hour in First Aid`.
There is no C-ID for "Supervision", so the entire CCN → C-ID → M-ID cascade
resolves to nothing and the whole lane falls to curator judgement. That is a
different problem shape and deserves the same scoping-before-building treatment
that made this one come out right.

Free win available first: **`0 hours in Credit Is Not Recommended` (3,242 rows)**
and `0 hours in Credit may be granted on the basis of an individualized
assessment` (2,269) are not recommendations at all — they are the **not-a-topic**
class the tab already has a button for, and the first is the same population §11
already calls "a free auto-N/A win".

## ⚠️ Things that will mislead you

1. **`3 hours in Elective Course Credits` spans 61 credentials and is worthless**
   — one college, a placeholder. Never rank by how widely a string spreads.
2. **`attribution='per_course'` is not a gate** (8,809 rows carry it, including
   every poisoned `AJ 110` row), and neither is a cartesian/line-fraction test.
3. **A C-ID reaching a group through the articulation pairing may be a
   cross-join.** That is why a divergent official title is offered, not applied.
4. **`source_code` IS a military-lane discriminator at the CR grain.** This does
   *not* contradict "no military flag exists" — that note is about
   `map_student_credit.military_credits`, an applied *amount*, zero on 84% of
   rows. Different column, different grain.
5. **`tests/cpl_funding.test.js` hangs** (pre-existing), so `node tests/run.js`
   cannot finish. Run suites individually. `npm install` first.
6. **M-ID naming is wired but `MID_RULES = False`.** Flip it only in the change
   that declares the M-ID layer faculty-published (Rule 7).

## 🧹 Carryover

- **The §11 pare-down is still owed.** `CLAUDE.md` is ~107 KB against a 60,000
  budget. I shrank it slightly (rewrote my roadmap cell to current truth,
  archived SkyRef's narrative) but the audit still flags **`docs/INDEX.md` at
  5.24×** and **`docs/roadmap_archive.md` at 2.58×**, and the worst
  `stacked_roadmap_cell` is **"MAP Users / student contact" at 4,447 chars** —
  I left it alone deliberately, since compacting a live cell I did not verify
  risks losing truth. Someone who *has* that context should do it.
- 12 adoption-file statewide titles absent from `chatbox_credentials` · corpus
  covers 59 of 123 colleges · the 7 `via:"search"` fallback contacts · the
  site-phrase superset decision · the identity crosswalk write to Supabase ·
  the partner-crosswalk engine's 2nd run.

## Patterns that worked

- **A ranking rule that needs a special case to avoid an absurd result is the
  wrong rule.** Collapse value fixed the placeholder problem with no exclusion
  list.
- **Emit what you computed; don't let a consumer re-derive it.** Three separate
  drifts in one run came from re-implementing one normalisation.
- **A safety mechanism firing on an obviously-fine case is usually mis-wired,
  not right.** Genuine screen hits look genuinely ambiguous.
- **Run the new test against the OLD file.** 2 of 42 fail pre-fix; that is the
  only reason the suite is worth anything.
- **Ask the one question that forks the build, early, with numbers in the
  options.** The global/per-credential answer took one round-trip.

## Safety patterns to honour

- Rule 4 — `CPL_Dashboard.html` / `index.html` byte-identical (`cmp -s`). Inject
  tab CSS from the tab's JS; it covers both without the mirror.
- Never force-push `main`; merge on `unstable`, not just `clean`.
- Sandbox is egress-blocked from `*.supabase.co` — Supabase via MCP only.
- `cpl_memory` CHECK constraints: `summary` ≤400, `detail` ≤4000, `kind` ∈
  fact/pitfall/opportunity/risk/wishlist/question/decision/milestone/procedure,
  `org` ∈ cpl/ci/cip/gr/shared. Long story goes in `detail`.
- The stop hook's "unpushed commits" nag after a squash-merge is a false
  positive. Verify, then ignore. Never amend.

## Moniker

**SkyProse** is still unclaimed (offered twice now). Or coin your own; if Sam
names one, his wins.
