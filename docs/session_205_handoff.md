---
title: Session 205 handoff — from SkyLint (Session 204, the Obsidian lane)
created: 2026-08-28
updated: 2026-08-28
tags: [handoff, session-205, obsidian, docs-corpus, lint, vault]
kb-status: internal
obsidian-folder: cpl-project-tracker
---

# You are Session 205

SkyLint here. Sam split this session off from the live Funding session (203) to
work **the Obsidian lane** — the vault-facing lint debt carried in the Session
203 handoff. That separation held all run; the Funding tab was not touched.

⚠️ **Two sessions ran in parallel today.** `docs/session_203_handoff.md` is
SkyLens's and covers the Funding tab, the ABCD spine and #1371/#1372. Neither
supersedes the other — read both, and check whether 203's PR landed.

## What shipped — PR #1373

| Finding | Before | After |
|---|---:|---:|
| `kb_note_dialect` | 60 | **0** |
| `american_spelling` | 174 | **0** |
| `oversized_doc` | 5 | **4** |
| `docs/INDEX.md` | 273,616 B (6.84×) | **20,757 B** |

Three tools, all dry-run-by-default:

- `kb/_normalize_kb_note_frontmatter.py` — 340 notes now resolve their type via
  `tags:` and carry `created:`.
- `kb/_build_docs_index.py` — INDEX's marker block + four catalogs under
  `docs/catalog/`, from each doc's own frontmatter. `--check` runs in CI.
- `kb/_fix_american_spelling.py` — 399 replacements, prose only.

New suites: `docs_index_build` 25/25, `american_spelling` 32/32. And
`tests/docs_audit_test.py` (67) now actually runs — it never had.

## The four things worth carrying forward

1. **A field the resolver never reaches can disagree for ever.** `kb_type_of`
   returns the type tag and stops, so a `type:` key beside it is never read.
   41 notes had one; **6 disagreed**, silently, for months. Audit agreement
   across every source — the resolved value is self-consistent by construction,
   which is exactly why reading it proves nothing.
2. **Moving content out from under a guard disables the guard, and the diff
   looks like progress.** Relocating the listings orphaned all 340 notes from
   `unindexed_kb_note`. Caught only by re-running the audit after the move.
3. **A checker and a fixer returning different counts are reading different
   text.** The lint scanned raw text, the sweeper scanned prose, so 25 findings
   survived that nobody could act on. One `prose_only()` now serves both.
4. **Sam's ruling generalized past its example.** *"No need to fix any spellings
   we import…like COCI catalog or MAP Custom Reports data"* → exclude every
   **quoted span**. Costs 3 of 402 replacements, and caught a case nobody had
   considered: Sam quoted verbatim in `session_68_handoff.md`.

## Shipped after the first handoff was written

**The Governance "Docs & doctrine" panel** (#1376). Sam asked for a way to trace
a recurring behavioral mismatch back to the document that caused it — *"I
definitely don't want to get trapped reviewing for a living."* So it is a
**lookup, not a review queue**: no checkbox, no mark-reviewed, no unread count,
no owner, inert until opened, and `tests/governance_docs_panel.test.js` asserts
each of those absences because they are exactly what a helpful future session
would add. `kb/_build_docs_index.py` now also emits `docs/catalog/index.json`
(same pass, one collector) so titles, tags and the `artifacts:` each note governs
are searchable together. A **doctrine lane** leads it — `CLAUDE.md`, both READMEs,
`.claude/commands/` — because `CLAUDE.md` auto-loads into every session and
`kb/doctrine.py` deliberately excludes it.

⚠️ **`docs/catalog/index.json` is committed and regenerates on every doc change**,
so a checkpoint that adds a note produces a ~14k-line diff on it. That is the
cost of the panel; `--check` in CI is what keeps it honest.

## The public KB is six weeks stale, structurally

Sam asked what would keep the public KB current with session learnings. Measured:

| | |
|---|---:|
| KB files | 54 |
| KB last content change | **2026-07-17** |
| Tracker `docs/kb-notes/` | **342** |
| Manifest entries sourced from `docs/kb-notes/` | **0** |

⭐ **Not one session learning has ever been promoted**, though `CURATION.md`'s
incremental path explicitly provides for tracker kb-notes. The manifest was built
from a one-time vault audit dated **2026-05-08**; the kb-notes lane was created
**2026-05-27**. It has been frozen at its first pass since, and **nothing
accumulates candidates**, so there is no backlog to work — only absence.

⚠️ **The scanner FLAGS, it does not strip.** Sam believed a routine removes PII;
`curation_assistant.py` flags and a human PR review *is* the audit. Do not
describe it as a scrub.

⭐ **Two jobs with opposite requirements are in one repo.** A public curated
shopfront needs a human gate; a context store needs to be complete and current.
The gate is *why* it is stale. The context-store job is already done privately and
better — `docs/kb-notes/`, `cpl_memory`, and now `docs/catalog/index.json`.
⚠️ And "everything we know, public" runs directly against the **public/private
split** roadmap row, which exists because of IP-proliferation concern.

**Two recommendations await Sam's go — do not build either unasked:**
1. A checkpoint sub-step where a session that writes a *publicly useful* note
   appends a **`hold`-bucket** manifest row + one-line rationale. Builds a
   candidate queue, publishes nothing, human gate untouched.
2. Nothing reads `docs/kb-notes/` at runtime — Sierra reads `cpl_memory` but not
   the notes. That is the concrete gap if tools should query "everything we know".

## Your priority — the CLAUDE.md consolidation (SCOPED AND MEASURED, execute it)

Sam and SkyLint worked this out at the end of Session 204. The measurements are
done; you are executing a plan, not designing one.

### The diagnosis

**Three stores are each doing all three jobs**, with nothing assigned:

| Job | `CLAUDE.md` | `cpl_memory` | `docs/kb-notes/` |
|---|:--:|:--:|:--:|
| **Rules** — must fire unprompted | ✅ 23 KB | ⚠️ **85 of Sam's rulings** | — |
| **State** — what is true in a lane now | ⚠️ **§11, 90 KB** | ⚠️ some | — |
| **Findings** — what we learned | ⚠️ narratives | ✅ 379 | ✅ 343 |

⭐ **THE ASSIGNMENT RULE (Sam's, 2026-08-28): push what a session cannot know to
ask for; pull everything else.** `CLAUDE.md` is PUSHED — present before you know
you need it. `cpl_memory` is PULLED — you must think of the question. *"Never
force-push main"* cannot move to a pull store; you would only query it if you
already suspected. *"What is the state of the funding lane"* is a question you
know you have — that is pull, and it is **62.4% of the file**.

⚠️ **Do NOT relocate doctrine into `cpl_memory`.** Its briefing budget is 17,951
chars against **85,505** of verified rows — **21% fits**. A rule there can be
present and silently unread, which is strictly worse than a large `CLAUDE.md`
that at least loads completely.

### Measured starting state

- `CLAUDE.md` **148,460 B** vs a 60,000 B budget. §11 Roadmap is **90,324 B (62.4%)**
  across **37 rows**; Critical Rules are only **22,680 B (15.3%)**.
- **Dropping §11 alone lands the file at ~56 KB — under budget, in one move.**
- 26 rows carry a ✅/DONE/LIVE marker, ⚠️ **but that over-counts**: many read
  *"✅ LIVE … NEXT: …"*, i.e. live with open work. Read each row; do not grep.
- `cpl_memory.scope` is set on **4 of 646 rows** — the field that would answer
  "global or lane-local?" is unused.

### The steps — ONE PR EACH, each independently revertible

1. **Retire genuinely-finished rows.** Already documented practice ("when a
   row's NEXT step is done and nothing is pending, move it"), never enforced.
   Per-row read, not a grep.
2. **Move live lane state to per-lane files, leaving a ONE-LINE POINTER INDEX in
   `CLAUDE.md`.** ⭐ **The pointer is the safety mechanism** — pushed, while the
   content is pulled. Without it a session re-derives what was already written,
   which is the exact failure Rule 8 exists for. ~2 KB replaces ~45 KB.
3. **FOLLOW THE GUARDS.** ⚠️ `rule_stacked_roadmap_cell` hard-codes
   `if entry["rel"] != "CLAUDE.md": return None` — **the moment §11 cells move it
   silently stops guarding.** Re-point it, and give the new lane an
   `oversized_doc` budget or it grows unwatched. This is the third instance in
   one day of *moving content out from under a guard disables the guard, and the
   diff looks like progress*; it is the step most likely to be skipped because
   the change looks finished without it.
4. **Populate `cpl_memory.scope` BEFORE promoting any ruling.** Then "global or
   lane-local" is a query, not 85 judgment calls. ⚠️ **Do not promote all 85** —
   *"the noncredit lane gets a SECOND ROW per college"* is one tab's design
   decision, not a rule every session needs. By slug it looks like ~51
   cross-cutting / ~34 lane-local, but that is a weak heuristic.
5. **Write the assignment rule into `CLAUDE.md` AND `.claude/commands/checkpoint.md`.**
   Otherwise it regrows — Session 204 proved that changing a mechanism without
   changing the instruction describing it is its own failure.

### Safety

- **Relocate verbatim, never delete** — content moves, nothing is lost.
- `oversized_doc` **verifies the outcome mechanically**; you will know it worked
  without reading anything.
- ⚠️ **Check no other session is live on `CLAUDE.md` first** — it is the most
  contended file in the repo (Session 204 had to verify PR #1372's file list
  before touching §11).
- **Steps 1–3 are mechanical; 4–5 are judgment. Do not mix them in one PR.**
- Steps 1–3 get you under budget alone and need no decisions from Sam.

## Background — why this is the priority

**149,538 B against a 60,000 B budget, and every session pays it.** This is the
single highest-value item left in this lane and it was held today only because
paring §11 collides with the concurrent Funding session's checkpoint.

Do it once 203's PR has landed:

1. `python3 kb/_docs_audit.py` and read `stacked_roadmap_cell` — a roadmap cell
   states CURRENT TRUTH, not a log. Delete superseded text; do not stack
   `*Prior:*` markers.
2. §11 keeps **at most 2** session narratives. Move older ones verbatim to
   `docs/roadmap_archive.md`.
3. Move finished rows to `docs/reference/finished_workstreams.md` — a row nobody
   is acting on is a tax every future run pays.
4. Re-run the audit; `oversized_doc` should drop from 4 to 3.

## Carryover

- **5 British-form filenames** (`methodology-normalise-both-sides-of-a-join.md`
  and friends). A filename is an identifier — one coordinated pass over
  `CLAUDE.md`, `related:` wikilinks and `cpl_memory` rows. The sweeper lists
  them and refuses.
- **`docs/roadmap_archive.md` at 3.36×** — it is an archive, so decide whether
  the `other` budget is simply wrong for that lane rather than compacting it.
- **Obsidian Bases.** The properties are canonical now, which was the
  precondition. A `.base` gives the vault a live filterable view by
  type/status/date; the generated catalogs stay for GitHub, which cannot render
  Bases. Sam has not been asked about this — it is a proposal, not a plan.
- **`vault_heavy_path` (45)** — the sparse-checkout fix is a Windows-side action
  for Sam; `playbook-keep-build-artifacts-out-of-the-vault` has the procedure.
- **`kb/cpl_todos.json` was deliberately NOT touched.** Every item in it is
  203's funding lane, including Sam's top to-do (clicking Publish to recover his
  relabels). Rewriting it would have clobbered those and reset his check-offs,
  and nothing in this lane needs anything from Sam.

## Patterns that worked

- **Read the memory table first.** It supplied two facts I would otherwise have
  re-derived: Obsidian exclusion is a *relevance* filter (sparse checkout is
  what worked), and the `analys` stem had already been narrowed after flagging
  430 correct words.
- **Check for an existing note before writing one.** The lint/fixer lesson was a
  new *instance* of `a-normalisation-and-its-screens-must-see-the-same-text`,
  not a new rule, so it was appended there. Two notes were genuinely new.
- **Prove the guard fails.** Every new invariant was broken on purpose and
  watched to fail before being pinned by a test.
- **Verify the blast radius, don't assert it.** All 3,145 link and wikilink
  targets were snapshotted before the sweep and diffed after.

## Safety patterns to honor

- Never force-push `main`. Merge on `clean` **or** `unstable`.
- A `check_suite` wake names a routinely superseded `head_sha` — re-read
  `get_check_runs` on the current head.
- **Ask before writing a shared artifact another live session owns.** Sam runs
  several sessions; a later write silently wins.
- Sam, 2026-08-28: *"If we need to add to a supabase table, recommend."* Propose
  schema additions; do not create them.

## Moniker

I took **SkyLint** — the whole run was the lint pass this corpus had been
reporting and nobody had consumed. Yours is open.

**Next is Session 206 — `docs/session_206_handoff.md`.**
