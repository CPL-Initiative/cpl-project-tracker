---
title: Session 154 handoff (Sky153 → next) — build the ACE spine; decide on publishing evidence
created: 2026-08-14
updated: 2026-08-14
tags: [handoff, cr-reference, ccrr, military, ace, evidence, sierra]
related:
  - "[[docs/military_cr_reference_scope]]"
  - "[[docs/kb-notes/reference-exhibit-crs-catalog-field-census]]"
  - "[[docs/kb-notes/methodology-tell-a-parser-defect-from-a-people-defect]]"
superseded: true
superseded_by: session_159_handoff.md
---

# You are Session 154

Session 153 was **Sky153**. One PR (**#1177**): the **military (ACE) CR
Reference is scoped**, the **Exhibit CRs Catalog's 27 fields are censused**, and
the **required-evidence fields are wired into the daily fetch**.

## ⚠️ FIRST — read the memory table. This is Rule 8.

```sql
select slug, title, summary, status, event_date from cpl_memory
where status <> 'superseded'
  and (tags && array['cr-reference','ccrr','military','ace','evidence','curation']
       or summary ilike '%credit_rec%')
order by event_date desc nulls last limit 40;
```

Do not re-derive: `ace-is-already-a-controlled-vocabulary`,
`ace-cascade-names-by-ace-own-published-text`, `usmc-rank-tokens-leak-into-cr-text`,
`a-ranking-rule-must-be-rederived-per-corpus`, `map-api-echoes-requested-columns`,
`ccrr-naming-cascade-ccn-cid-mid` (Sam's ruling), and `f8` (USMC skill-level
duplication — it explained a text pattern nobody was looking for).

⚠️ `ccr-identity-gate-mechanism-was-corrected` is still a deliberate conflict
flag — a `verified`, Sam-sourced row describes a rung-3 gate that does not work.
His intent stands; the mechanism was replaced. Do not "fix" it by superseding a
human-sourced row.

## ✅ What closed this run

**Sierra had no access or awareness of the evidence fields** — no Supabase
column matches `%evidence%`, no repo reference, and the daily fetch asked for 9
of the catalog's 27 columns with neither among them.

**Truncation, answered on the runner** (a session cannot reach the MAP hosts):

- **`EvidenceDescription` is NOT truncated** — max 349 chars, lengths vary
  freely. What Sam saw clipped in his JSON view was the viewer.
- **`SubmissionGuidelines`** is mostly fine (max 1,230) but **43 of 5,744 values
  sit at exactly 100 chars**, so *some* source caps at 100.

**Now fetched daily (5 new):** `EvidenceDescription`, `EvidenceTypeID`,
`SubmissionGuidelines`, `AceID`, `CPLTypeCode`. Full 27-field census with
add/keep/drop reasoning: [`docs/kb-notes/reference-exhibit-crs-catalog-field-census.md`](kb-notes/reference-exhibit-crs-catalog-field-census.md).

## 🎯 PRIORITY 1 — decide whether evidence reaches Sierra, then publish it

Fetching is step one; **nothing is in Supabase yet, so Sierra still cannot see
any of it.** Before publishing, one hard rule falls out of the measurement:

⚠️ **The evidence fields are empty on military rows BY DESIGN, not by defect.**
Every welding/MOS row sampled for Sam's AWS D1.1 case carried all three blank
with `ActiveEvidence=false` and `CPLTypeCode=M`. Non-military rows total
**8,811** and **6,705 carry evidence** — ~76% of the rows where evidence is a
meaningful concept.

**So Sierra must never say "no evidence required" for a military exhibit.** That
is an absent measurement rendered as an answer — the same failure shape as the
Imperial Valley "that is a finished queue" bug (`absence-must-not-render-as-achievement`).
Guard it in the function, not in the prompt.

`SubmissionGuidelines` is arguably the more useful of the two — it is the
actionable half (*"must submit MJC CPL Petition Form"*) where
`EvidenceDescription` is a 146-value type label (*Exam Scores*, *Certificate*,
*Portfolio Review*, *Performance, Demonstration, Audition*).

**`Issuer` is the strongest remaining ADD** to the fetch — 90% of credentials
carry an issuer word absent from both title and variants
(`methodology-search-the-awarding-body-not-just-the-name`).

## 🎯 PRIORITY 2 — the ACE mechanical spine (33.5%, and it is the cheap part)

`docs/military_cr_reference_scope.md` has the full measurement. Build order is
**deliberately the inverse of the freehand lane**, where the worklist came first
and the matcher last — because here the mechanical rungs are worth 33.5% rather
than ~10%:

1. **Not-a-topic** — 47 strings / 6,663 rows (`Credit Is Not Recommended` 32 /
   3,892 + individualized-assessment 15 / 2,771). §11 already calls this "a free
   auto-N/A win". ⚠️ The class is **bigger than the 3,242** previously cited,
   which was one string rather than the class.
2. **Typographic fold** — 767 strings, pure case/punctuation.
3. **Units as an attribute** — 2,244 strings. ⚠️ **Gated on Sam's answer to
   §10 Q1** (are ACE unit variants one recommendation? 22.2% of the vocabulary
   turns on it).
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
   multiplying by a constant. **Rank by rows.**
2. **Token containment is suggestion-only.** `management` contains 21 narrower
   topics — `project management`, `records management`, `supply chain
   management`. None of them are `management`. Pairwise and gated, never
   transitive.
3. **"No cascade" is not "no authority."** The CCN>C-ID>M-ID rungs fire on 2.6%
   of ACE rows, but Sam's cascade already ends in *published line*, and ACE's own
   text IS that line. Checking the ruling we had saved inventing one.
4. **A third of this lane is an INGEST defect, not curation.** 58 colleges hold
   both casings, 0 hold only one. Don't build a workbench that asks curators to
   do a parser's job 767 times.
5. ⭐ **The MAP CustomReport API ECHOES your requested `columnName` back even on
   an invalid request.** A field is real IFF **rows come back**. Run 1 of the
   evidence probe validated against the echo and "confirmed" a misspelling and a
   bare `Evidence` as real columns. Always run a known-good baseline first, or an
   API outage reads as "every field is invalid."
6. **Postgres word boundary is `\y`, not `\b`.** `\b` is a backspace — a
   normalization step using it silently matches nothing and looks like "that step
   doesn't help."
7. **Sanity-check every count against its population.** A containment join
   reported 908,451 rows in a 200,840-row lane (a topic counted once per pair).
   Both of this run's measurement errors were caught by a figure being
   *impossible*, not by inspection.
8. **Verify a git ref is current before reasoning from it.** `git show
   origin/main:<file>` read a stale local ref and sent me down a wrong diagnosis
   for the CI failure below. `git fetch` first.

## ⚠️ Known-red CI on `main` (NOT from #1177)

`tests/governance.test.js` fails **on `origin/main`** — verified in a clean
worktree, 89/90, single failure:

```
FAIL ⚠ the candidate list stays readable (< 25)
```

The daily cron's governance drift detector has emitted its **25th** candidate
and the test asserts the list stays under 25. **The guard is working** — it is
reporting that the queue needs triage. Do NOT raise the threshold; that switches
off the only signal that the queue is growing. Someone has to work the
candidates and either map each onto the register or dismiss it with a reason
(the detector "proposes, never auto-adds" — §11).

`js-tests` is **non-required**, so this does not gate merge-on-green. But
**every PR will show a red `test` check until it is triaged**, so check the
failing test NAME before assuming it is yours:

```bash
for f in tests/*.test.js; do timeout 60 node "$f" >/dev/null 2>&1 || echo "$f"; done
```

Two today: `cpl_funding.test.js` (rc=124, the pre-existing hang — so
`node tests/run.js` cannot finish; run suites individually) and
`governance.test.js` (rc=1, this one). Anything else is new. `npm install` first.

## 🧹 Carryover

- **The §11 pare-down is still owed.** `CLAUDE.md` is **1.81×** budget.
  `docs/INDEX.md` is **5.25×**, `docs/roadmap_archive.md` **2.59×**. The worst
  `stacked_roadmap_cell` is still **"MAP Users / student contact" at 4,447
  chars** — left alone for the *second* session running, both times because the
  session lacked the context to compact it safely. **Someone who has worked that
  row should do it.**
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
- **Ask the API to enumerate itself before guessing.** An empty `columnName`
  returned all 27 fields, retiring a 57-name guess list.
- **Ask before touching a shared pipeline.** `fetch_custom_report.py` feeds the
  daily cron; Sam chose measure-first, and the measurement changed which fields
  were worth adding.
- **A failing test you did not cause still deserves a diagnosis**, and the
  diagnosis belongs in the handoff so the next session does not repeat it.

## Safety patterns to honour

- Rule 4 — `CPL_Dashboard.html` / `index.html` byte-identical (`cmp -s`). Inject
  tab CSS from the tab's JS; it covers both without the mirror.
- Never force-push `main`; merge on `unstable`, not just `clean`.
- Sandbox is egress-blocked from `*.supabase.co` **and** the MAP hosts — Supabase
  via MCP only, MAP via an Actions-runner workflow only.
- `cpl_memory` CHECK constraints: `summary` ≤400, `detail` ≤4000, `kind` ∈
  fact/pitfall/opportunity/risk/wishlist/question/decision/milestone/procedure,
  `org` ∈ cpl/ci/cip/gr/shared.
- The stop hook's "unpushed commits" nag after a squash-merge is a false
  positive. Verify, then ignore. Never amend.

## Moniker

**SkyProse** is still unclaimed (offered three times now). Or coin your own; if
Sam names one, his wins.
