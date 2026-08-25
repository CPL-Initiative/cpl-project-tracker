---
title: GR register — scaling the Government Relations tab past CPL
date: 2026-08-18
tags: [lessons, gr, government-relations, title5, regulation, policy, register, security]
kb-status: internal
obsidian-folder: cpl-project-tracker
artifacts:
  - gr_priorities.js
  - kb/supabase_gr_register.sql
  - tests/gr_priorities.test.js
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/methodology-a-filter-needs-a-field]]"
---

# GR register — scaling the Government Relations tab past CPL

## 2026-08-18 — Sky168, the demo-driven rebuild

Sam is demoing the GR tab to the **CO General Counsel team** to see whether they
want it for *all* their policy and regulation reviews. His ask: make it scale
past the CPL regs — user-entered priority areas, procedures to add revisions and
artifacts, filters and section dropdowns, division + priority tagging.

### What the tab actually was

One hardcoded document. `DOC_ID = "cpl-t5-priorities"`, a single jsonb blob in
`gr_content`, 16 priorities in 5 groups, a 3-chip tier filter, a Word export, and
`writes: []` in its own Admin row. **Read-only, one topic, no artifacts, no
citations as data.** So items 1–4 were not additions to a structure; they *were*
the structure.

### The reframe: a document became a register

`gr_areas → gr_revisions → gr_artifacts`. Three tables, no cleverness. Every ask
then falls out as a column — areas, revisions, artifacts, filters, section
dropdowns, division tags. The briefing survives as a *view* of the register
rather than being the thing itself. `gr_content` was **left in place** as the
rollback copy; the migration copied its 16 priorities out and deleted nothing.

### Three things Sam's list assumed that were not true

**"like the Guidance Memo, Title 5 Rulemaking, etc. are listed"** — those are not
artifacts in a knowledge base. They are the three **pathway tiers**: how a change
gets made (CO memo → BOG rulemaking → statute). They are an attribute of each
revision. Artifacts are a genuinely new axis and were kept separate from
pathways rather than folded into one list.

**Section dropdowns had nothing to read.** No citation field existed anywhere;
§55050 lived only inside sentences. This is the durable lesson, written up in
[`methodology-a-filter-needs-a-field`](kb-notes/methodology-a-filter-needs-a-field.md).
⚠️ **§11342.2 is GOVERNMENT Code** (the APA definition of "regulation") — a
`5xxxx → Title 5 / else → Ed. Code` rule would have fabricated a citation in
front of lawyers. Codes are assigned by explicit range; anything unmatched is
left unassigned. Backfilled citations carry `citations_derived` and render
dashed until a human edits them.

**The Knowledge Base already exists and it is not this tab's.** `cpl_documents`
(62) + `cpl_document_sections` (525, pgvector) is **Sierra's** RAG corpus, fed by
an **external** indexer from Sam's private Obsidian vault, last indexed
2026-07-19, all CPL content, and the GR tab reads none of it. There is no path
from a browser into that corpus. So "add an artifact to the KB" was scoped to
what it can honestly be today: a register row with a link, a division, and a
human `why`. Nothing is analyzed automatically, and the form says so.

### The feature nobody asked for that justifies the whole thing

Once citations are data across every area, a **cross-area section index** is one
query: which sections do two different priority areas both propose to amend?
Dual enrollment, CPL, SCFF and baccalaureate teams all edit overlapping parts of
Title 5, and today nobody sees the collision until rulemaking. That is the thing
a register can do that a folder of Word documents cannot, and it is the honest
answer to "why would General Counsel use this?"

### Security findings

⚠️ **The GR phrase opens every shared team tab.** `team_pass_check()` matches ANY
secret in `team_access`, so handing a CO division the GR phrase hands them the
Workplan, Budget, Memory, MAP Users and Governance. This is the same defect Sam
flagged for Finance on 2026-08-15 (§11 "Org & phrase scope", blocked on him) —
now on the critical path, because the GR tab was **built to lock the CO out**
("just the MAP team, NOT the CO") and he wants to invite them in.

**Writes are reviewer-only, deliberately.** A shared phrase is a bearer
credential: it carries no identity, cannot be revoked per person, and cannot say
who changed a row. It is adequate for "keep drafts off the public site" and
inadequate for legal analysis across divisions. Reads still accept the phrase;
writes require a magic-link reviewer session.

⚠️ **The Admin surface inventory is generated and reads comments.** Hand-editing
`cobi_admin_surface.js` fails `admin_tab.test.js` by design — run
`kb/_build_cobi_admin_surface.py`. Its scanner matches the `REST + "/table"`
shape, so building URLs from a variable hides the tab's data surface from the
RLS view (an inventory that misses a table renders as "nothing to protect").
It also scans **comments**: writing the pattern out in prose invented a table
called `"table"` in the generated inventory. A phantom row in a security view is
the same defect as a missing one.

### Current state

- 2 areas (`cpl` 16 revisions migrated; `dual-enrollment` 4, a clearly-marked
  **sample** built for the demo — neutral review prompts, not positions)
- 2 artifacts, 14 distinct sections across three codes (T5 / EC / GC)
- `tests/gr_priorities.test.js` **71 checks**, every prior security guard kept

### Next

1. **The phrase-scope fix** — blocked on Sam; gates inviting GC.
2. **Per-field sensitivity.** Which sections are under review is public law; the
   *position* is what is sensitive. A `sensitivity` column + a view would let the
   collision index be shared CO-wide while positions stay restricted. This is
   what turns a MAP tool into a CO tool.
3. **Edit and version history** — a legal audience needs to see who changed what,
   not just who created it. Today rows are append-only from the UI.
4. Load the authoritative CO priority-area list when Sam has it (the area picker
   accepts typed titles until then).

---

## 2026-08-19 — the adversarial audit, and what a faithful migration still lost

Six lenses over the register (authorization, injection, citation correctness,
migration fidelity, failure modes, test quality), every candidate facing two
independent skeptics prompted to refute. **~38 candidates → 8 confirmed, 28
refuted.** Most refutations read *"already fixed at HEAD"* — the fixes landed
while it verified.

### The finding that mattered

**The "before this goes external — verify" caveat was migrated and never
rendered.** It records that the CPL area's quoted statutory text was never
checked against primary sources (the sandbox could not reach leginfo, Cornell or
cccco.edu). Sixteen priorities, confident citations, no disclaimer, for lawyers.

A verifier sharpened the reasoning past mine: the mitigation one reaches for —
*"it's behind a phrase and a sign-in"* — is exactly the argument that fails,
because `draftWord()` writes a file that leaves the gate, the RLS and the room as
an attachment. The caveat now renders above the register **and travels inside the
export**.

Three more were migrated-and-unrendered (the sequenced ask, four legal-accuracy
corrections, the `Draft · date` stamp), and one was never migrated at all: the
**13-priority blast-radius layer** with its "why it matters" prose, cross-keyed
to the matrix by strings like `#6 / #13 / #16`. Recovered by parsing those:
**16 of 16 rows, 13 distinct ranks, all with prose.** Durable write-up:
[`methodology-migrate-the-display-not-just-the-data`](kb-notes/methodology-migrate-the-display-not-just-the-data.md).

### Where the audit beat the author

- I fixed `tag()`'s escaping and stopped. A verifier reproduced the other half:
  the lookup table was a plain object, so a pathway of `"toString"` resolved
  through `Function.prototype` and the export printed `UNDEFINED`.
- On the false-zero fix I was told I had **understated** it — `nextN` derives
  from the same collapsed list, so adding a revision to an area whose 16 rows had
  not loaded would number the new one `1`. The display bug was also a write bug.

Both are the same shape: **a partial fix reads as a complete one**, because the
symptom you checked is gone.

### Also landed

Phrase scope applied (`team_pass_check()` excludes `gr`; verified before/after —
exactly one bit changed, no Finance lockout). Attribution bound to the JWT by a
BEFORE trigger. Dead `fetchDoc()` removed, which also cleared a phantom
`gr_content` read from the Admin RLS inventory. Version history, per-field
`sensitivity` (default `restricted`, nothing flipped), and a verification pass so
the caveat reports "N of M verified" instead of disclaiming forever.

Tests **71 → 125**.

### Process note

The workflow was sized at six lenses and fanned out to ~80 agents, because every
finding drew two skeptics. That is well past this repo's under-15 guideline. It
paid for itself, but the cap belongs on candidates-per-lens, not on lenses.

---

## 2026-08-25 — SkyFixer S193: editing a priority, and what "reanalysis" turned out to mean

Sam, mid-session: *"I want to make some fixes on the GR Priorities tab to be able
to edit the drop down info on each regulation priority and run a reanalysis on
the items edited on demand after edits are in… I need to get the CO a draft of
the reg changes I am proposing this week."*

### ⭐ The word "reanalysis" had no referent

Before building anything I looked for the analyzer. **`blast_rank` appears in no
Python, no SQL and no workflow in this repo.** All 16 CPL revisions carry a rank;
all 4 dual-enrollment ones carry none. The ranks were *authored* during the
Sky168 rebuild. So "re-run the analysis" would have meant building an analyzer
and calling it a re-run.

That reframed the whole task. The honest question is not *how do we re-run it*
but *what should it compute*, and the answer follows from the audience: these
rows become a **Chancellor's Office submission**.

⭐ **So the analysis is deterministic, and that is the design, not a shortcut.**
Four checks, all derivable from the row itself:

1. sections the **text cites** that are missing from the citation list
2. **listed** sections the text no longer cites
3. numbers **no code band claims** (a bare `53410` is ambiguous between Gov. Code
   §53xxx and Title 5 §53410 — the divergence this file already records)
4. sections **another priority area also claims** — the conflict this register
   exists to surface before rulemaking rather than during it

Plus a verification stamp standing over citations that have since changed.

**An answer you can re-derive is one you can defend. A model's opinion about
blast radius is not.** An LLM lane for `blast_why`/`blast_rank` remains
scoped-not-built; it needs a new `cpl-chat` drafting surface and an Edge
Function deploy, which ships separately from Pages.

### ⚠️ Bare numbers in prose are not harvested

A `§` is required. Without it, *"In 2026 the board reviewed course 55050 and item
66025"* becomes two citations — and a fabricated citation with a confident face
on it is the one error this register cannot ship to the CO.

### ⚠️ A verification cannot outlive the list it describes

"Mark citations verified" means *I checked THESE against the source*. Editing the
citations makes that untrue, so the edit clears `verified_at`/`verified_by`. This
is the same defect as `cpl_memory`'s status cycle leaving a stamp on a stale row,
one table over, found the same afternoon — which is the tell that it is a shape
rather than an incident.

### ✅ Editing needed no new audit plumbing — measured, not assumed

`CLAUDE.md` warned that `gr_history` has **no write policy**, which reads like a
blocker for an editor. It is not: `gr_capture_history()` fires on UPDATE and
DELETE for all three tables and `gr_stamp_actor()` stamps the actor, both as
**triggers**. The browser never writes history, which is why it needs no policy.

### ⚠️ Two roadmap corrections

- The GR row said `sensitivity` defaults restricted **"(nothing open)"** and that
  flipping rows open was Sam's call *"nothing open today"*. **Measured false:**
  `cpl` revisions already carry `sensitivity='open'`. That matters before any
  export, because the unverified-text caveat travels in `draftWord()`.
- **0 of 20 revisions are `verified`.** For a CO draft this week that is the
  number to move, and it is curator work, not analysis.

### Method note

⚠️ **Two of six perturbations did not apply on the first attempt** — one anchor
matched twice (the add-form has the same citation guard as the editor) and one
produced a syntax error. Both suites passed unchanged, which looks exactly like a
guard holding. **A perturbation that fails to perturb proves nothing**; both were
redone against the editor's own line and confirmed red.
