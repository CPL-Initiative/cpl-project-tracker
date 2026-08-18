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
human `why`. Nothing is analysed automatically, and the form says so.

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
