# How courses get merged on the Common Course Reference — the rules, in plain terms

*This page explains, without jargon, how the Common Course Reference (CCR)
decides that two colleges' courses are "the same course," and what the
automatic steps will and will not do. It is written for faculty, curators,
and anyone checking our work. (The technical versions of these rules live in
the project documentation; this brief is the contract in plain language.)*

*Status: everything here is a **working draft layer** — useful for cleanup
and review, but not faculty-published. No official record at any college is
changed by anything this table does.*

---

## What you're looking at

California's community colleges teach tens of thousands of local courses.
Many of them are the same course wearing different clothes — "Calculus I" at
one college, "Analytic Geometry and Calculus" at another, "MATH 003A" at a
third. The CCR tries to give each *real* course one row, with every college's
local version listed underneath it.

Three kinds of rows appear:

- **C-ID and CCN rows** — official statewide course identities (C-ID
  descriptors and AB 1111 Common Course Numbers). We never invent, rename, or
  renumber these; they appear exactly as the state publishes them.
- **M-ID rows** (numbers like `MATH M1175`) — **our working labels** for
  courses that look the same across colleges but don't yet have an official
  identity confirmed. The "M" means *minted by this project*, deliberately,
  so nobody mistakes one for an official number.
- **Stand-alone rows** — single-college courses nothing else matches yet.

## The rules, strongest evidence first

When the system attaches a college's course to a row, it uses exactly one of
these justifications — always the strongest available:

1. **The college said so itself.** Colleges file their courses with the
   state's course inventory (COCI), and that filing can name the course's
   official C-ID or CCN. We take the college at its word.
2. **The statewide C-ID registry says so.** The C-ID system publishes, for
   every descriptor, the list of each college's *approved* articulated
   course. This catches the many cases where a course is officially approved
   but the college never noted it in COCI — in our data, roughly **half** of
   all approvals. A course placed this way is placed because the registry
   names *that college's exact course* — its title is never part of the
   decision, which is how "Analytic Geometry and Calculus" can land
   correctly under "Single Variable Calculus I."
3. **Historical evidence, with a freshness check.** When this project
   reorganized its records, it kept receipts ("these courses left this group
   for that official number"). Old receipts can describe groups that have
   since changed, so a receipt only counts if the course it points to still
   matches by name — we call this the *kinship check*. Receipts that fail it
   go to a human review queue instead of acting automatically.
4. **A human said so.** Curators can confirm suggested merges or make their
   own. Human decisions outrank everything above and are never overwritten
   by automation.

Title *similarity* — "these two names look alike" — is not enough to merge
anything automatically. It only produces *suggestions* for a person to
confirm or skip. The same goes for **catalog-description similarity**: for
courses no official source covers, we compare colleges' own catalog
descriptions to find likely matches the names would never reveal ("Intro to
Programming" vs "Programming Fundamentals") — with screens so that different
course *levels*, men's vs women's athletics, and different sports never pair
just because their descriptions share a template. Those, too, are only
suggestions a person confirms.

There is exactly **one title-based step that acts on its own**, and it is
deliberately the strictest rule in the system: the **twin merge**
(authorized by the project lead, first for two subjects in June 2026, then
statewide). Two of *our own working labels* (M-IDs — never official rows)
merge only when their titles contain **the same words** (order, punctuation,
"&" vs "and", and Roman-vs-Arabic numerals aside — "Smog Check Inspector
Level 1 & 2 Training" and "Smog Check Inspector Training, Level 1 & 2"),
AND they sit in the same subject and discipline, AND they carry the same
credit type and the same units, AND none of the safety screens object
(course levels, Honors/Refresher/Lab-type variants, years, gender, sport).
If *any* of that differs — even just the unit count — the pair stays a
suggestion for a person. Every twin merge is recorded in a receipt with an
undo map.

## What the automation refuses to do

- **Pick a side in a conflict.** If the college's filing and the statewide
  registry disagree, or a course's evidence points at two different official
  numbers, the system leaves it alone and flags it for a person.
- **Split credit for a sequence.** Some approvals say "these *two* courses
  together equal the standard." Neither course alone is the standard, so
  neither is moved automatically.
- **Choose between multiple approvals.** A course officially approved under
  two different descriptors stays put until a curator chooses.
- **Touch anything a curator has verified.** Verified rows are locked to
  automation.

## What a "merge" actually changes

Less than you might think. Automatic placements are **display-level**: the
table regroups what it shows you, every time it rebuilds, from the same
underlying records. Nothing is deleted, no college's data is edited, and
removing an input (or a rule) un-merges everything it caused. Every
automatic step also leaves a written receipt — counts, sources, and dates —
so any placement can be traced back to *why*.

The one exception is the strict **twin merge** above, which folds two of
our own working labels into one *in our records* (still never touching any
college's data or any official identity). Each one is logged in an alias
map — old label → surviving label — so it can be traced or reversed
exactly.

Rows the automation touched stay marked **Generated** until a person
verifies them. **Verified** means a human looked.

## If something looks wrong

It might be! This layer exists so errors surface where people can see them.
If a row groups courses that don't belong together — or splits ones that do —
say so (a screenshot with the row ID is perfect). Several of the rules above
exist *because* someone spotted a wrong row and we traced the cause. Signed-in
reviewers can also fix placements directly: every row offers Verify, merge,
and propose-correction tools.

---

*Maintained alongside the CCR. The precise, technical statements of these
rules — with the measurements behind them — live in the project's
documentation folder, starting with `docs/cid_articulation_authority_scope.md`
and `docs/kb-notes/methodology-witness-kinship-gate.md`.*
