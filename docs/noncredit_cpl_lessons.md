---
title: Noncredit & Learning-Partner CPL — workstream lessons
created: 2026-08-05
updated: 2026-08-05
tags: [lessons, noncredit, learning-partners, cpl, not-for-credit, adult-education, rop, high-school-articulation, apprenticeship]
artifacts:
  - docs/noncredit_cpl_thinking.md
  - kb/nc_learning_partners.json
  - nc_learning_partners.js
  - kb/supabase_nc_partner_notes.sql
  - tests/nc_learning_partners.test.js
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/methodology-dormant-asset-worklist]]"
  - "[[docs/kb-notes/methodology-register-is-the-spine-narrative-cites-it]]"
  - "[[docs/kb-notes/adr-notes-alongside-the-curated-register]]"
---

# Noncredit & Learning-Partner CPL — workstream lessons

Scratchpad for the noncredit / not-for-credit / adult-school / ROP / HS-CTE /
apprenticeship CPL workstream. Append a dated section each checkpoint.

---

## 2026-08-05 — SkyPartner: from a cold ask to a live instrument in one session

### What we were asked

Sam opened with a research-and-cogitation ask ahead of a white paper: map the CPL
opportunities across noncredit, ROP, adult schools, not-for-credit (contract ed),
and HS CTE articulated (Cx) programs — seven numbered prompts, plus "ask me anything
needed to set up this session most effectively." It ended the day as a shipped COBI
tab with a live query and a write layer.

### (a) What was learned

**1. The knowledge existed; the written record didn't.** The single most important
finding, and it reframed everything. The Oct-2024 *Scaling CPL in California*
monograph mentions noncredit **6 times in 32 pages** — no framework, no examples.
By the Fall-2025 Noncredit Summit decks it was genuinely figured out: mirroring with
its documentation and processing steps, the not-for-credit evidence hierarchy, four
worked student cases, the two-tab landing-page architecture, the EMS Corps play.
It had simply never left a slide deck. **A college that wants to mirror a noncredit
course today has nowhere to look.** That gap *is* the reason for the workstream, and
it became §0 of the thinking doc.

**2. Twelve mechanisms; six modes.** The taxonomy is organized by **mechanism**, not
sector, because the mechanism sets the unit economics and the economics decide
whether a case scales. Sam then asked for a layer above it the team could carry into
a meeting → the **six modes** (M1 mirrored · M2 certificates and licenses ·
M3 noncredit certificates · M4 HS Cx · M5 portfolio · M6 CPL toward a noncredit
award). **M2 carries the screening question that sorts most partner conversations
before anyone opens a catalog: *does this program end in a license or third-party
certification?*** Yes → one determination covers everyone holding it, forever. No →
you're in M5, per student, every time.

**3. The scalability ladder.** CPL's cost isn't the credit — the credit is free to
issue. It's the **assessment**. Every scaling move reduces, amortizes, or subsidizes
assessment cost. Tier 1 = assessment *during* instruction (mirroring, ~$0 marginal);
Tier 2 = once per credential; Tier 3 = per cohort; Tier 4 = per student (never
scales, must be **subsidized rather than optimized**).

**4. The "oxymoron" is an apportionment problem in a curriculum costume.** Sam's Q3
(can NC award NC CPL?) looked like a Title 5 question. It isn't. Noncredit is funded
on **contact hours**; a waived noncredit course generates **zero apportionment**;
and because the student never pays a fee, **100% of the loss lands on the
institution**. That's why programs waive informally and never record it. Reframes
the ask from *"may we award noncredit CPL?"* to *"how do we stop penalizing a
partner for recognizing competency instead of selling seat time?"* — which is
fundable, and **SB 361 (2006) is the precedent** the state already set.

**5. Querying the live data beat reasoning about it, every time.** Five findings
came out of `credential_reference_data.js` + `coci_lookup_data.js` that no amount of
thinking would have produced — see §7a of the thinking doc. The headline:
**49 dormant statewide exhibits across 252 college-slots, and only 30 of 84
statewide exhibits have ever converted a unit (64% have not).**

**6. I was wrong once, in a way worth recording.** I told Sam MAP carried "zero
noncredit colleges, adult schools, or ROPs" — that read only the *top* of the
trainer list. A full audit showed **~48 high-school entries, Baldy View ROP, Fontana
Adult School, Chaffey Joint Union HSD** are present; only the **four standalone
noncredit institutions** are genuinely at zero. The corrected picture is *stronger*:
the hardest partner lane populated itself organically, and the easiest one — four
institutions inside the system, on the same platform, holding $1M in carve-out — is
empty. **The lesson: "top N of a sorted list" is not an audit.**

### (b) Current state

| Artifact | State |
|---|---|
| `docs/noncredit_cpl_thinking.md` | ~1,530 lines. §0 why it exists · §1 terminology · §2 thesis · §3 twelve use cases · §3a EMS Corps · §4 ladder · §5–§10 the questions · §10a sector scale · §10b the three 2026 commitments · §11 funding (**parked**) · §12 open items |
| `kb/nc_learning_partners.json` | The register — 6 modes, 12 use cases, 9 opportunities, 10 questions |
| Noncredit & Learning Partners tab | **Live** (#985) — 5 collapsible sections, jump links, expand/collapse-all, report generator (Copy · MD · Word · Print) |
| Narrative cross-refs | **Live** (#987) — `[[ITEM-ID]]` → opens section, clears blocking filter, scrolls, flashes |
| Write layer | **Live + applied** (#988/#989) — ✎ Add insight on every card; schema applied to `hvuwhnbuahrtptokpqfh` |
| Tests | `tests/nc_learning_partners.test.js` — **82** |

**Sam's decisions this run:** terminology = **Learning Partners** (never "feeder"
externally) · CR/NC split = FTES sizes the pot, behavior distributes it · recognition
= data layer + partner surface · deliverable = long-form thinking doc first ·
tab audience = private now, field-facing later · **answering never closes, just
revises** · notes alongside the register with a promotion path · "Needs Sam" →
**"Needs Input"**.

### (c) Strategic roadmap

**Ranked by value ÷ effort** (mirrors §12 of the thinking doc):

1. **Populate the four standalone noncredit institutions in MAP** — absolute zero
   across 1,987 titles. Data entry, and it unblocks every partner-recognition
   mechanism.
2. **EMS Corps as outreach, not articulation-building** — 28 colleges already carry
   the statewide EMT exhibit at **75.6%** conversion. Build the landing page; it *is*
   the outreach vehicle.
3. **Work the dormant list** — 49 exhibits, 252 college-slots, zero transcriptions.
4. **The mirroring playbook** — the lead recommendation has no artifact behind it.
5. **The 26-college dental list** — 27 teach it, 1 awards it (West LA, 99.5%).

**Parked deliberately:** the funding metric. Designing it before the mechanisms are
mapped is how you pay for the thing you can measure instead of the thing you want.

### (d) Next concrete step

**Answer the six Needs Input items in the tab** — now possible in place. The
highest-value one is **HS articulation scale** (how many colleges/partners on the
incumbent system), because it sizes the largest-volume lane and nothing in the repos
carries it.

### Patterns that worked

- **Prototype in an artifact, then port.** The repo convention, and it earned its
  keep: the preview caught a real bug before it shipped — the renderer used
  `--brand`/`--text`/`--link`, none of which exist in COBI. Also surfaced the rule
  that tables sit on `--surface-opaque`, never on glass.
- **Ask the setup questions before doing the work.** Four picker questions at the
  top settled terminology, funding framing, recognition ambition, and deliverable
  shape — every later decision followed from those without rework.
- **Mark confidence inline.** ⟨sourced⟩ / ⟨inferred⟩ / ⟨**NEEDS SAM**⟩ throughout
  the thinking doc meant Sam could see instantly which claims were load-bearing and
  which were mine. It's also what made the "44 non-CCC programs" figure catchable
  as unverifiable rather than repeated as fact.
- **Verify the arithmetic after drafting.** Re-running the FTES math caught two wrong
  rows in the split table (I'd double-subtracted Mt. SAC). The corrected number made
  the finding *stronger* — the $1M carve-out turns out to be a pure-FTES split to
  within 2.8%.

### Safety patterns honored

- Rule 4 — nav/pane/boot mirrored in **both** HTMLs, verified byte-identical.
- Rule 9c — the schema went through the **Supabase MCP**, never a direct connection.
- Post-apply verification was **asserted in `DO` blocks**, so a failure throws rather
  than needing to be spotted in output. The anon gate was tested by *seeding a row
  and confirming anon reads 0*.
- Public `cpl-knowledge-base` **untouched** — the promotion packet targets the
  tracker's lanes and states that boundary in its own text.
- Post-squash merge conflicts (twice) resolved by **rebuilding on current `main`**,
  never by force-resolving.
