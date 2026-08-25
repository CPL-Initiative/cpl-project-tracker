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

---

## 2026-08-25 — Sky195: Lane B, and a vocabulary that lives in five places

Session 195 (**Sky195**) built the on-demand deep re-analysis Session 194's
handoff named as the priority — Lane B of the two-lane design. Lane A (#1331)
checks a row against **itself**, deterministically. Lane B asks a model the two
questions Lane A structurally cannot answer, because they need knowledge of law
this repo does not hold: **related Title 5 / Ed. Code sections nobody has cited
yet**, and the **instrument determination**. PR #1333.

### What was learned

**⭐ The doctrine was already in the data, and it holds.** Before writing a line
of prompt, the scope's claimed doctrine was re-derived against the live table:
regulation-must-change → Title 5 only, **3 of 3** (#3, #9, #10);
statute-blocks → Ed. Code + `ed_first=Yes`, **2 of 2** (#5, #7);
already-permitted → includes a memo (#12 memo-only, #1, #14, #15). The tied
ranks the scope predicted are real too (3,3 on #9/#10 and 5,5,5 on #6/#13/#16).
The one test — *does the change contradict a statute, a regulation, or merely a
practice?* — ships in the prompt verbatim, because without it a re-analyzed row
rejoins the register in a different voice and a CO reader feels the seam.

**⭐ A measured doctrine belongs to the area it was measured from.** The scope
left this as an open question ("same routine for dual-enrollment?"). It answers
itself from that area's own summary: *"SAMPLE AREA — entries below are neutral
review prompts, not Chancellor's Office or MAP positions."* Running an advocacy
doctrine there would write a position into the rows that exist to demonstrate
their absence. `DOCTRINE_AREAS` is an explicit map keyed on `area_id`, not a
string sniff on the summary, and every other area gets a neutral variant that
returns `pathway`/`ed_first`/`blast_rank` as null. Add an area when its doctrine
has been measured the same way — not before.

**⭐ THE SURFACE VOCABULARY LIVES IN FIVE PLACES, AND NEITHER SOURCE KNEW ALL
FIVE.** `docs/gr_reanalysis_scope.md` named `KNOWN_SURFACES`,
`DRAFTING_SURFACES`, `SURFACE_QUERY_CAPS`. The `cpl_memory` row
`the-sierra-surface-vocabulary-lives-in-three-places` named `KNOWN_SURFACES`,
the SQL `CHECK` constraint, and `SURFACES` in `sierra_training.js`. Both said
"three"; the union is **five**, and the live CHECK constraint needed widening
too or no curator could ever scope a guidance rule to the surface. **Rule 8's
read step is what caught this** — the scope doc alone would have shipped a
surface with two silent gaps.

**⚠️ The envelope needed its own cap, and the margin was the tell.** Measured
against the longest real row (#7, apportionment): **5,564 characters**, which
fits `QUERY_CAP_DRAFTING` (6,000) with **436 to spare**. Reusing the existing cap
was the scope's suggestion and it was wrong for a register Sam edits live — one
rewritten Approach crosses the line. `QUERY_CAP_GR_ANALYSIS` is 14,000, the
client refuses rather than sending what it knows will be cut, and the test reads
the server's constant instead of restating it. Stripping the stored HTML first
is not cosmetic: #7's approach field is ~26% href by character.

**⭐ AND THE CLIENT'S BUDGET CHECK CANNOT SEE THE ONE FAILURE MOST LIKELY TO
HAPPEN.** It compares against the cap *this repo* declares. On merge day the
deployed function still applies **1,000**, because Pages ships the client and
only a dispatch ships the function — the roadmap's own "half a two-half feature
deploys itself". The output contract sits at the END of the envelope, so what
gets eaten is the instructions, and the model answers in helpful prose. The fix
is not another guard: it is that a non-JSON reply now **names the deploy**
rather than the model. Durable note:
[`methodology-a-client-cannot-see-the-cap-the-server-enforces`](kb-notes/methodology-a-client-cannot-see-the-cap-the-server-enforces.md).

**⚠️ Two of my own guards were not guards, and perturbation is what said so.**
A bare `indexOf("gr-analysis")` matches inside `"gr-analysis-typo"` — so the
`SURFACE_QUERY_CAPS` check **could not fail for the single most likely real
mistake**, a mistyped key. It stayed GREEN under perturbation while eleven
others went red. The SQL and picker checks survived only because they happen to
quote both sides. All three list checks are quote-delimited now.

**⚠️ And the reporter was skippable — the Session 193 finding, in my own file.**
The async block calling `report()` at its end would have swallowed every result
line if anything above it threw. `report()` runs in a `finally`; a deliberately
injected crash now prints `32/33` with a named FAIL and exit 1 instead of
vanishing. Proven, not assumed.

**Two test assertions were wrong before the code was.** One asserted
`#12 [rank 12]` — confusing a row's **ordinal** with its **rank** (#12 carries
rank 6; #5 carries rank 12). Asserting on a row where the two coincide would
pass just as happily if the block printed `n` twice, so the fixed check uses a
pair where they differ. The other claimed entity decoding happened after tag
stripping so an escaped `&lt;b&gt;` "cannot reconstitute a tag" — the order is
right but the reason was backwards: decoding *first* would turn escaped markup
into a real tag and then **eat** it, deleting the author's literal text.

**`sierra_memory_isolation` went red, and was right to.** Its claim *"the memory
tab is the only caller naming a drafting surface"* was a true statement about a
set of size two wearing an exclusivity label — the same shape as
`an-assertion-pinned-to-one-member-cannot-see-the-set-grow`, except this one
DID see the set grow. Rescoped to *"every drafting surface is claimed by exactly
one vetted client"*, plus a count so the owner list cannot fall behind
`DRAFTING_SURFACES`.

### Current state

- **Client + server code merged; the Edge Function is NOT deployed.** The button
  cannot work until `cpl-chat-deploy.yml` is dispatched, and it says so.
- Deployed `cpl-chat` v58 is **byte-identical to HEAD** (sha256
  `02c130977e69e8f9`, 221,310 chars) — so a deploy ships **only** this additive
  change. That was measured, not assumed, and it is the fact that makes the
  deploy proposal cheap to accept.
- Live `sierra_guidance_surface_ck` widened to admit `gr-analysis` (additive;
  the new set is a strict superset, no existing row changes, no RLS moves).
- `tests/gr_deep_analysis.test.js`: **37 checks**, 15 perturbations each red by
  exit code.
- Open questions 1 and 2 from the scope are answered together: **per row**
  (Sam's *"the edit I made"*), with the other 15 rows as read-only ranking
  context — ranking is comparative, so hand it the comparison. Q3
  (`citations_related`): **displayed, never persisted**, no schema change. Q4:
  the sample-area answer above.

### Next concrete step

1. **Sam's go on dispatching `cpl-chat-deploy.yml`** — the function is shared
   with the public Sierra, which is why this is his call and not a session's.
2. **Then the doctrine regression**, which can only run against a deployed
   function: blank the stored `pathway` on rows **#12, #9, #7 and #5**, re-run,
   and assert memo-only / Title 5 / Ed. Code + `ed_first=Yes`. ⭐ Those four rows
   are a labeled test set the register already contains — the cheapest real
   evaluation available, and the thing that tells you a prompt edit made the
   analysis worse.
3. Then the register's own open number: **0 of 20 revisions are `verified`**,
   which for a CO draft is the figure to move, and it is curator work.

⚠️ Row #9's title currently reads *"Remove the requirement to requirement to
note CPL on the transcript"* — a live-edit typo, deliberately **left alone**.
It is Sam's row in Sam's draft; a session silently editing his prose is how a
register stops being his.
