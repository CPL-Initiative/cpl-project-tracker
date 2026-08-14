---
title: Session 154 handoff (Sky153 → next) — read the probe log, then build the ACE spine
created: 2026-08-14
updated: 2026-08-14
tags: [handoff, cr-reference, ccrr, military, ace, evidence, sierra]
related:
  - "[[docs/military_cr_reference_scope]]"
  - "[[docs/common_cr_reference_lessons]]"
  - "[[docs/kb-notes/methodology-tell-a-parser-defect-from-a-people-defect]]"
---

# You are Session 154

Session 153 was **Sky153**. One PR (**#1177**): the **military (ACE) CR
Reference is scoped**, and Sam's evidence-field question is answered with a
probe queued to settle the one part a session cannot reach.

## ⚠️ FIRST — read the memory table. This is Rule 8.

```sql
select slug, title, summary, status, event_date from cpl_memory
where status <> 'superseded'
  and (tags && array['cr-reference','ccrr','military','ace','evidence','curation']
       or summary ilike '%credit_rec%')
order by event_date desc nulls last limit 40;
```

Rows you must not re-derive: `ace-lane-is-88pct-of-the-map-cr-vocabulary`,
`ccrr-naming-cascade-ccn-cid-mid` (Sam's ruling), `f8` (USMC skill-level
duplication — it explained a text pattern nobody was looking for this run), and
the four rows Sky153 wrote about the ACE lane.

⚠️ `ccr-identity-gate-mechanism-was-corrected` is still a deliberate conflict
flag — a `verified`, Sam-sourced row describes a rung-3 gate that does not work.
His intent stands; the mechanism was replaced. Do not "fix" it by superseding
the human-sourced row.

## 🎯 PRIORITY 1 — read the probe log, it is probably already waiting

Sam asked (2026-08-14) whether Sierra knows about `EvidenceDescription` /
`EvidenseTypeID` in the Exhibit CRs Catalog, and whether the description is
truncated. **She does not** — no Supabase column matches `%evidence%`, no repo
reference exists, and `fetch_custom_report.py` asks for 9 columns from
`View_ExhibitCRsCatalog_Dataset` with neither among them.

The truncation half **cannot be answered from a session** (egress allowlist
blocks the MAP hosts), so `kb/_probe_exhibit_evidence_fields.py` was added to
the manual-dispatch `discover-map-datasets.yml` and **dispatched on the session
branch**. Read its run log via the GitHub MCP.

It answers four things, and **all four gate the next step**:

1. **Which column name is real.** We are guessing the spelling — it tries nine
   candidates separately and reports which the API honours. If none are, the
   answer is a MAP-side question, not a build.
2. **Truncation** — decided by the LENGTH DISTRIBUTION. A spike at 255/500/1000/
   4000 is server-side (upstream fix, and it caps what we could ever show);
   smoothly varying lengths mean Sam's JSON *viewer* is clipping and the data is
   fine. **These need different fixes — don't collapse them.**
3. **Fill rate.** An un-truncated field populated on 4% of rows is not shippable
   to students either. Absence and truncation are different defects.
4. **Sam's own case** — the AWS D1.1 / welding rows are printed so he can read
   the actual text.

⚠️ **`fetch_custom_report.py` was deliberately NOT touched** — Sam chose *measure
first, then decide*, and the daily cron reads that file. Fill rate and truncation
both have to pass before evidence goes anywhere near the daily fetch or Sierra.

## 🎯 PRIORITY 2 — the ACE mechanical spine (33.5%, and it is the cheap part)

`docs/military_cr_reference_scope.md` has the full measurement. Build order is
**deliberately the inverse of the freehand lane**, where the worklist came first
and the matcher last — because here the mechanical rungs are worth 33.5% rather
than ~10%:

1. **Not-a-topic** — 47 strings / 6,663 rows (`Credit Is Not Recommended` 32 /
   3,892 + individualized-assessment 15 / 2,771). §11 already calls this "a free
   auto-N/A win". ⚠️ Note the class is **bigger than the 3,242** previously
   cited, which was one string rather than the class.
2. **Typographic fold** — 767 strings, pure case/punctuation.
3. **Units as an attribute** — 2,244 strings. ⚠️ **Gated on Sam's answer to
   §10 Q1**, see below.
4. **USMC rank strip** — 306 topics / 10,550 rows land on an existing base
   topic. **Widen the strip list first**: 176 don't land, because of dangling
   qualifiers (`leadership ssgt and above`) and spelled-out ranks (`gunnery
   sergeant … only`).

Then the worklist, **ranked by ROWS**, sized for ~250 decisions to reach half
the lane.

## ⚠️ Things that will mislead you

1. **The freehand lane's ranking rule does not transfer.** Collapse value
   (wordings × colleges) was SkyCall's hard-won fix, and it ranks nothing here —
   every head topic already sits at ~80–100 of 108 colleges, so you are
   multiplying by a constant. **Rank by rows.** The durable form: a ranking rule
   encodes an assumption about where variance lives, and that has to be
   re-derived per corpus.
2. **Token containment is suggestion-only.** `management` contains 21 narrower
   topics — `project management`, `records management`, `supply chain
   management`. None of them are `management`. Pairwise and gated, never
   transitive.
3. **"No cascade" is not "no authority."** The CCN>C-ID>M-ID rungs fire on 2.6%
   of ACE rows, but Sam's cascade already ends in *published line*, and ACE's own
   text IS that line. No new ruling needed — checking the ruling we had saved
   inventing one.
4. **A third of this lane is an INGEST defect, not curation.** 58 colleges hold
   both casings, 0 hold only one. Don't build a workbench that asks curators to
   do a parser's job 767 times.
5. **Postgres word boundary is `\y`, not `\b`.** `\b` is a backspace — a
   normalisation step using it silently matches nothing and looks like "that
   step doesn't help." Cost me a re-run.
6. **Sanity-check every count against its population.** A containment join
   reported 908,451 rows in a 200,840-row lane (a topic counted once per pair).
   Both of this run's errors were caught by a figure being *impossible*, not by
   inspection.
7. **`tests/cpl_funding.test.js` still hangs** (pre-existing), so `node
   tests/run.js` cannot finish. Run suites individually. `npm install` first.

## 🧹 Carryover

- **The §11 pare-down is still owed.** `CLAUDE.md` is **1.81×** budget
  (108,515 B / 60,000). `docs/INDEX.md` is **5.25×**, `docs/roadmap_archive.md`
  **2.59×**. The worst `stacked_roadmap_cell` is still **"MAP Users / student
  contact" at 4,447 chars** — now left alone for the *second* session running,
  both times because the session lacked the context to compact it safely.
  **Someone who has worked that row should do it**; it is not getting smaller.
- Sam still owes the **freehand** head — the top ~50 CR Reference groups — and
  the signal we want is **which rungs he overrides**, especially the 38
  divergent-title groups badged `AJ 110? — check`.
- 12 adoption-file statewide titles absent from `chatbox_credentials` · corpus
  covers 59 of 123 colleges · the 7 `via:"search"` fallback contacts · the
  site-phrase superset decision · the identity crosswalk write to Supabase · the
  partner-crosswalk engine's 2nd run.

## Patterns that worked

- **Read the memory table first, properly.** `f8` was written for the
  *eligibility* question and it explained a *text* pattern — the USMC rank
  tokens — that nothing in the handoff pointed at.
- **Check the ruling you already have before asking for a new one.** The naming
  cascade already covered the ACE lane at a lower rung.
- **Answer the part you can, then instrument the part you can't.** Three cheap
  checks settled "does Sierra see it"; only truncation needed the runner.
- **Ask before touching a shared pipeline.** `fetch_custom_report.py` feeds the
  daily cron; Sam picked measure-first, which is a smaller change than the one I
  would have made unasked.
- **Distinguish defects that look identical but need different fixes** — server
  truncation vs a viewer clipping; a parser defect vs a people defect.

## Safety patterns to honour

- Rule 4 — `CPL_Dashboard.html` / `index.html` byte-identical (`cmp -s`). Inject
  tab CSS from the tab's JS; it covers both without the mirror.
- Never force-push `main`; merge on `unstable`, not just `clean`.
- Sandbox is egress-blocked from `*.supabase.co` **and** the MAP hosts — Supabase
  via MCP only, MAP via an Actions-runner workflow only.
- `cpl_memory` CHECK constraints: `summary` ≤400, `detail` ≤4000, `kind` ∈
  fact/pitfall/opportunity/risk/wishlist/question/decision/milestone/procedure,
  `org` ∈ cpl/ci/cip/gr/shared. Long story goes in `detail`.
- The stop hook's "unpushed commits" nag after a squash-merge is a false
  positive. Verify, then ignore. Never amend.

## Moniker

**SkyProse** is still unclaimed (offered three times now). Or coin your own; if
Sam names one, his wins.

## ⚠️ Known-red CI on `main` (found 2026-08-14, NOT introduced by #1177)

`tests/governance.test.js` fails **on `origin/main`** — verified in a clean
worktree of main, 89/90, single failure:

```
FAIL ⚠ the candidate list stays readable (< 25)
```

The daily cron's governance drift detector has emitted its **25th** candidate
and the test asserts the list stays under 25. **The guard is working** — it is
telling us the candidate queue needs triage. Do NOT raise the threshold; that
switches off the only signal that the queue is growing. Someone has to work the
candidates and either map each onto the register or dismiss it with a reason
(the detector "proposes, never auto-adds" — §11).

`js-tests` is a **non-required** check, so this does not gate merge-on-green.
But it does mean **every PR from here will show a red `test` check until the
queue is triaged**, and a genuinely new failure will be easy to miss inside it.
Check the failing test NAME before assuming a red `test` check is yours:

```bash
for f in tests/*.test.js; do timeout 60 node "$f" >/dev/null 2>&1 || echo "$f"; done
```

That prints exactly two today: `cpl_funding.test.js` (rc=124, the pre-existing
hang) and `governance.test.js` (rc=1, this one). Anything else is new.
