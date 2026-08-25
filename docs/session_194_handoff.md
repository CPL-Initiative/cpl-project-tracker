---
title: Session 194 handoff — the write key, the credential, and a word with no referent
created: 2026-08-25
updated: 2026-08-25
tags: [handoff, session-194, memory, skyview, gr-register, auth]
kb-status: internal
obsidian-folder: cpl-project-tracker
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/methodology-a-test-must-report-a-missing-thing-not-dereference-it]]"
  - "[[docs/kb-notes/methodology-name-the-credential-that-actually-failed]]"
  - "[[docs/kb-notes/methodology-a-word-in-a-request-may-have-no-referent-yet]]"
---

# Session 194 handoff

You are **Session 194**. Session 193 ran as **SkyFixer** (Sam named it mid-run).
It was a live session: Sam drove COBI in a browser for hours and reported defects
as he hit them. **Almost nothing shipped came from a plan** — it came from him
clicking things and them not working.

⚠️ Sam runs several sessions at once. `git log origin/main` before assuming your
branch is the only work in flight.

---

## Read this first

**PR #1330 is MERGED and deployed.** **PR #1331** was open and green-pending at
handoff — **verify it actually merged** before building on it. ⚠️ A
`check_suite.completed` event on this repo named a SUPERSEDED head **four times**
this session. Always re-read the runs on the head the PR reports *now*.

⚠️ **`npm test` is ~267 files / ~40 min and cannot finish in this sandbox.** Run
the targeted suites; let CI own the full one.

### Sam's decisions this run — do not re-litigate

- **The signed-in dropdown showing his email is "good enough for now."** A `name`
  column on `allowed_reviewers` was offered and **declined**. Don't rebuild it.
- **Delete belongs in the list beside the statuses.** Shipped as a menu item that
  **opens the entry's confirm** rather than deleting — he has not objected, but
  he asked for it *in* the list, so if he pushes back, that is the tension.
- **GR editing + reanalysis: approved and built.**
- **Still awaiting his go:** clearing the one false verification stamp in
  `cpl_memory`, and whether to build an LLM lane for GR `blast_why`/`blast_rank`.

## What shipped

| | |
|---|---|
| **The Memory write key** | `?slug=eq.` on a NULLABLE unique column. 6 of 572 rows took writes that matched nothing while the page blamed the team phrase. Keys on `id` now. |
| **The status menu** | The ✎ chip was a CYCLE that wrote every state it passed through. Sam's two clicks are in `cpl_memory_log` 15s apart. Now one click, one write; the stamp clears when the status leaves `verified`. |
| **Inactive / Restore / Delete** | The DB already permitted all three. Only the UI never offered them. |
| **The masthead identity chip** | Both credentials, one sentence, shared with the rail badge (which had been magic-link-blind since it was written). |
| **The magic-link return tab** | Nine modules stashed it in `sessionStorage` — per browser tab. Every sign-in landed on CCR. |
| **SkyView** | Subject names outrank course titles; typeahead; a real subject list; the CCR tab opens on the map and defers the table's 7 MB. |
| **GR Priorities** | Edit every field; a deterministic Re-analyze. |

## ⭐ The three findings worth carrying

**1. A write key must name exactly one thing — and "none" is a way to fail it.**
#1329 found a key naming *two* courses; this found one naming *nothing*. Both
were silent: PostgREST answers an unmatched filtered write with `200 + []`, which
the house helper reports as 403-shaped, so a bad key looks exactly like an auth
failure. **When a write "does nothing", check the key before the credential.**

**2. A word in a request may have no referent.** "Re-run the reanalysis" presumed
an analyzer; `blast_rank` is computed by nothing in this repo. One grep turned
plumbing into a design decision — and the audience (a CO submission) is what
decided it: deterministic checks you can re-derive, not a model's opinion.

**3. ⚠️ Five perturbations read as 0 FAIL because the suite CRASHED and stopped.**
Every check below the crash went unreported while the exit code said only
"something failed". This is the S190 `exit=0 was my trailing grep` shape one
layer in. **Conclusions come from the exit code, never from `grep -c FAIL`**, and
a test must report a missing thing rather than dereference it.

## 🔭 Your priority — Sam named it, and it is scoped and ready

**The GR Priorities on-demand re-analysis.** Read
[`docs/gr_reanalysis_scope.md`](gr_reanalysis_scope.md) FIRST — it is the
authority and it is buildable as written.

Sam, at the end of Session 193: *"a routine I can run on demand that looks at the
edit I made and reanalyzes everything for related Title 5 and Ed Code citations
and an analysis of whether it can be accomplished by a clarifying memo,
regulation revision, Ed Code revision, or some combination of the 3"* — and then
the decisive line: ***"It's the same routine used to create the tab in the first
place."***

⭐ **That is the whole finding.** The 16 CPL revisions were analyzed by a SESSION
during the Sky168 rebuild and written into the table; nothing computed them. So
this is not "invent an analyzer", it is "make a session's work product repeatable
and put a button on it" — and `gr_revisions` IS the output template.

⭐ **The doctrine is measured, not invented** — grouping the 16 rows by their own
Approach text against the pathway actually assigned: regulation-must-change → Title
5 only (**3 of 3**), statute-blocks → Ed Code + `ed_first=Yes` (**2 of 2**),
already-permitted → includes a memo. One test: *does the change contradict a
statute, a regulation, or merely a practice?* Carry it in the prompt explicitly or
the tab becomes a patchwork of two analysts.

⭐ **Rows #12, #9, #7 and #5 are a labeled test set the register already contains**
— blank their stored pathway, re-run, and assert memo-only / Title 5 / Ed Code.
Cheapest real evaluation available.

⚠️ **It needs an Edge Function deploy**, which is separate from Pages and shared
with the public Sierra. Merge the client → dispatch `cpl-chat-deploy.yml` →
confirm with `cpl-chat-smoke.yml`. Four open questions for Sam are in §Open
questions of the scope; **question 1 (one row vs the whole area) genuinely changes
the design** — the tied ranks (3,3 and 5,5,5) can only be fixed by an area pass.

## 🔭 Then

**Decision packs per discipline, fetched on demand** — unchanged from Session
193, and now more urgent because the map leads. The grouped work surface exists
for **5 of 159 subjects (593 of 49,907 identities, ~1.2%)**, so a curator clicking
into the map lands on nothing most of the time. `kb/_build_ccr_universe.py
--desc-dir` already shards 302 description files fetched on demand; widening
`kb/_build_ccr_atlas_extract.py` past its hardcoded demo list is a walked path.

⚠️ **Serve the page, do not open it** — `python3 -m http.server 8000`.

## Carryover

| Item | Status |
|---|---|
| GR re-analysis | **SCOPED, not built** — `docs/gr_reanalysis_scope.md`, Sam's stated priority |
| The 5 GR `blast_why` drafts | in `docs/gr_why_it_matters_drafts.md`, PR #1332 — **nothing written to Supabase** (Sam was editing live) |
| The false verification stamp | ✅ **CLEARED** 2026-08-25 on Sam's go; 0 remaining; the 12 attributed rows untouched |
| PR #1331 merged? | **verify** — four superseded-head events this session |
| The one false verification stamp | **awaiting Sam** — `stale` + `verified_by='curator'`; the 11 rows with `'Sam Lee'`/`'Jenni'` are real attribution |
| GR: 0 of 20 revisions verified | **Sam's**, and it is what a CO draft needs |
| GR: LLM lane for `blast_why` | scoped, NOT built — needs a new `cpl-chat` drafting surface + an Edge deploy |
| 26 `verified` memory rows with no verifier | backlog; new writes name the person |
| My College roadmap cell | **flagged stacked** (4,292 chars) — out of scope this run, compact it next |
| `docs/INDEX.md` at 6.5× budget | 260 KB, standing |
| `CLAUDE.md` at 2.5× budget | standing — it SHRANK this run (150,020 → 148,268) |
| `prototype/ccr_desc/` absent | one `check_ccr_atlas.js` check fails; gitignored, needs generating |
| Cañada in the member roster | open — repair at source, 678× in the raw export |

## Patterns that worked

- **Read the audit log.** Sam's two clicks were timestamped 15 seconds apart in
  `cpl_memory_log`, which turned "the chip is odd" into a proven data defect with
  a named row.
- **Measure before scoping.** One grep for `blast_rank` changed the whole GR task.
- **Perturb every guard, and check the perturbation applied.** Twice an anchor
  matched twice or broke the parse and the suite passed unchanged — which looks
  exactly like a guard holding.
- **Let the lint decide what you write.** `stacked_roadmap_cell` flagged SkyView;
  compacting it (history → lessons doc) is why `CLAUDE.md` got smaller.

## Safety patterns to honor

- Rule 10: fresh read at write time; the sandbox reaches Supabase only via MCP.
- Never force-push `main`. Restart your branch after every squash-merge.
- Rule 4: `index.html` and `CPL_Dashboard.html` byte-identical — `diff -q` them.
- The sandbox is egress-blocked from `*.supabase.co` and the published site, so
  **the last verification step is always Sam's.**

**Moniker:** SkyFixer signing off. Next is **Session 194** —
`docs/session_194_handoff.md`. Take **Sky194** or coin your own.
