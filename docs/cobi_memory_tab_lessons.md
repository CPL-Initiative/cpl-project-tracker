---
title: COBI Memory tab + MAP Data Quality register — lessons
date: 2026-07-26
tags: [lessons, memory, data-quality, rls, license, sky10men]
artifacts:
  - cpl_memory.js
  - map_data_quality.js
  - kb/supabase_cpl_memory.sql
  - kb/supabase_map_data_quality.sql
  - kb/cpl_memory_plain_seed.json
  - kb/cpl_memory_title_seed.json
related:
  - "[[docs/kb-notes/adr-unified-memory-table]]"
  - "[[docs/kb-notes/playbook-cpl-memory-auto-write-at-checkpoint]]"
  - "[[docs/kb-notes/methodology-team-curated-table-needs-update-rls]]"
  - "[[docs/memory/cpl_memory]]"
---

# COBI Memory tab + MAP Data Quality register — lessons

Workstream scratchpad for the 🧠 Memory tab polish, the 🩺 MAP Data Quality
register, and the license correction. Continues SkyKnow's memory-loop build.

## 2026-07-26 — Sky10Men

Picked up from SkyKnow's handoff (the memory loop: table + curate pane +
checkpoint auto-write + Report view, all live). Shipped, in order:

### (a) 🧠 Memory Report → non-techie prose + reader fields (#894, #895)
- **What:** the 📄 Report ("Everything We Know") read like a technical index —
  bold fragment summaries + `touches:` filename dumps + `source:` citations, and
  fragments like *"eligible flag = `has_ccc`"* a lay reader can't parse. Reworked
  it to plain-English **prose**: per-section plain-language lead-ins, each entry a
  flowing paragraph, milestone dates in prose ("Reached July 20, 2026"), and the
  curator jargon dropped from the reader view.
- **Two reader columns** on `cpl_memory`: **`plain`** (the full-sentence,
  jargon-free version, with an example where the summary is obtuse) and
  **`title`** (a 3-6 word bold label above each item). Report **prefers** them,
  **falls back** to `summary`(+`detail`) so no row is required to have them.
  `summary`/`detail` stay the terse curator + AI surface. All 48/49 rows populated
  (receipts `kb/cpl_memory_plain_seed.json`, `kb/cpl_memory_title_seed.json`).
- **✨ Autogenerate** on the Add **and** Edit forms: type a topic → it researches
  the KB via the shared **cpl-chat RAG edge function** and drafts every field
  (prefill-only, parsed defensively). Putting it on Edit too, not just Add, is the
  sibling-surface sweep → recorded as `pr7`.
- **Real bug caught:** reading a form control named `title` via `form.title`
  returns `HTMLFormElement.title` (the attribute), not the input → the Short-title
  silently never saved. Fix: all form field access via `querySelector('[name=…]')`.

### (b) 🧠 Memory curate lockout — RLS fix (#896)
- **Symptom (Sam):** clicking a status chip snapped it back to *proposed* and
  locked the curator out ("team phrase may have expired"); re-unlocking → same.
- **Root cause:** an RLS asymmetry. `cpl_memory` SELECT + INSERT both allowed
  `is_allowed_reviewer() OR team_pass_ok()`, but **UPDATE was reviewer-only**. A
  team-phrase UPDATE matched 0 rows → PostgREST `200 []` → `team_phrase.js`
  `checkWrite` reads the empty representation as a 403 (the RLS zero-row trap) →
  `handleWriteFailure` clears the phrase → lockout.
- **Fix:** widen UPDATE to `reviewer OR team` (the pane says "view + curate", and
  INSERT already trusted team). Server-side, live immediately. Durable lesson →
  KB note + pitfall `p8`.

### (c) 🩺 MAP Data Quality register (#897)
- **Why:** Sam is finding data-quality problems in the Custom Report Generator's
  `View_StudentAggregatedValues` and wants to track them + follow up with the MAP
  dev team. Built a team-gated register (Supabase `map_data_quality` +
  `map_data_quality.js`, Reference & Curation group) — issue cards, status/
  category/college/search filters, an Advance-status cycle, and a **"Copy for MAP
  devs"** evidence export. **RLS applied the `p8` lesson from the start** (team can
  UPDATE). Seeded with Sam's four issues.
- **Domain fact captured (`f8`/`o3`):** Marine Corps JSTs list ACE credit
  recommendations under **every skill level**, and higher levels **repeat** the
  lower ones → summing over-counts eligibility (4× one 3-unit course). Fix =
  **dedupe by the CR itself within an exhibit**, not by skill-level order (sidesteps
  the non-canonical ordering). Moving Priority 1 to **Applied** credits also
  neutralizes it (a counselor N/A's the dupes).

### (d) License correction (#898)
- The tracker's `LICENSE` was an **unmodified MIT template (© 2019 Zachary Rice)** —
  it explicitly granted anyone the right to copy/modify/redistribute/sell, the
  opposite of intent. Replaced with a **proprietary all-rights-reserved** notice
  owned by **CCCCO** (carve-outs for public data + the CC BY 4.0 KB). Caveats: MIT
  is irrevocable for already-published snapshots (forward-only); a license is a
  legal, not technical, control (cloning of a public repo is unaffected).

## Advice given (not yet built) — data quality + repo privacy

- **Priority 1: Eligible → Applied.** `TotalAppliedCreditsForCR` is already in the
  MAP dataset, so re-basing is feasible without a MAP change. Applied = a counselor
  made a conscious keep/N-A decision → the better incentive-to-act metric + it
  cleans up the USMC inflation. Cautions: phase-in (backlogs drop measured perf at
  first), keep Eligible as the *ceiling* KPI, and there's a further outcome metric
  (`TotalTranscribedCreditsForCR`).
- **Repo privacy / appropriation:** private repo ≠ private data if Pages stays
  public (Pages serves the artifacts regardless). Levers: (1) license (done, #898),
  (2) privatize the tracker (needs Pro/Team to keep the public site), (3) split
  repo (public rendered site + private engine). KB stays CC BY 4.0 by design.
  Recommended starting move whenever Sam wants: a **public-exposure audit**.

## Roadmap / next

- **Register enhancements (queued, memory `w3`/`w4`):** (1) auto-generate findings
  from `View_StudentAggregatedValues` into the register on each daily run
  (counts + example IDs, idempotent upsert); (2) a follow-up-nudge on issues whose
  `followup_on` date has passed. Recommended for a fresh session (context).
- **On Sam's word:** the public-exposure audit; a Priority-1-on-Applied prototype
  behind a basis toggle.

## Patterns that worked

- Model a new team-gated curate tab directly on `cpl_memory.js` (unlock + RLS-safe
  `doWrite`/`checkWrite` + scoped CSS from JS) — a proven template.
- Apply `p8` to **every** new team-curated table's RLS up front (team on
  SELECT/INSERT/UPDATE; reviewer-only DELETE).
- `querySelector('[name=…]')` for form controls, never `form.<name>` (the `title`
  collision).

---

## 2026-08-24 — Session 190 (Sky190): the memory work shipped and never went live

Sam, picking this thread up alongside SkyView: *"two sessions ran in parallel, SkyRead on
memory and SkyCal on the new SkyView graph view… Let's pick up the memory thread to close
out anything needed."* Then, on the deploy question: *"Just don't want wonky things from
memory to show up in Sierra and Fact Sheet. If the results look appropriate and balanced
against training, that would be great."*

### ⭐ THE HEADLINE — HALF OF A TWO-HALF FEATURE DEPLOYS ITSELF, AND THE HALF THAT DOES IS THE CLIENT

SkyRead's #1320 and #1321 both changed **two** things: `cpl_memory.js` (a static file at the
repo root) and `chatbox/supabase/functions/cpl-chat/index.ts` (a Supabase Edge Function).
Merging to `main` published the first automatically via Pages. The second requires a manual
`workflow_dispatch` of `cpl-chat-deploy.yml` with a typed `DEPLOY`. Nobody dispatched it.

Measured, not inferred: `list_edge_functions` reports `cpl-chat` **version 57, updated
2026-08-23 01:18 UTC**. `git log` on `index.ts` shows the only commits after that timestamp
are **#1320 (14:48) and #1321 (15:16) on 2026-08-24** — 134 insertions, 8 deletions.

⚠️ **THE FEATURE IS NOT MERELY INERT — IT IS LIVE AND WRONG.** The deployed v57 does not
have `memory-briefing` in `KNOWN_SURFACES`, so it normalizes to `null` and takes the
conversational path: a hard `slice(0, 1000)`. The client builds a corpus of up to ~19,000
characters and its instruction envelope alone is ~984 of the 1,000 the server keeps. **The
model receives roughly sixteen characters of corpus.** And because the panel reports the
*client's* budget — "read N of N entries" — it states a census it did not perform.

That is `a-silent-input-cap-is-a-content-swap` arriving one level up from where SkyRead
found it. The note was written about Autogenerate; the same defect shipped in the Briefing,
on the same day, because the fix lives on the undeployed side.

⚠️ **A DEPLOY GATE IS NOT A RELEASE PLAN.** `cpl-chat-deploy.yml` requires a typed
confirmation *because* it reaches production with no staging tier — the gate is correct. What
is missing is anything that notices a merged `index.ts` change sitting undeployed. The
smoke workflow runs on push, but it tests the **deployed** function, so on this diff it
was exercising v57 and passing.

### ⭐ THE RIGHT ANSWER TO "WILL THIS CHANGE SIERRA" IS A GUARD, NOT A READING

Sam's worry is contamination: one shared Edge Function serves the public Sierra page, the
Fact Sheet drawer, the COBI tab, My College, the map.rccd.edu widget — and the Memory tab.
Four channels could carry memory text into a Sierra answer, and all four were checked:

| Channel | Verdict |
|---|---|
| **Input cap** | `queryCapFor()` returns 1,000 for every conversational surface, named/absent/unknown. Unchanged. |
| **Guidance rules** | Filter is `surface IS NULL OR surface = <this one>`, so a memory-scoped rule cannot reach Sierra. |
| **System prompt** | `DRAFTING_BLOCK` appends to `volatile` (rebuilt per request), never to `stable` (the shared cached prefix). |
| **Interactions log** | v58 *stops* filing drafting calls into `chat_interactions`. |

⭐ **THE DEPLOY REDUCES CONTAMINATION ON THE ONE CHANNEL WHERE IT IS ALREADY HAPPENING.**
`chat_interactions` holds **3 rows** from `cobi-memory-autogen`, first 2026-08-15, **last
2026-08-24** — written by the deployed v57. The Sierra Training Gap Miner reads that table
unfiltered and presents rows as questions people asked Sierra, so today it shows an entry
beginning *"You are drafting ONE internal team memory entry…"*, carrying a similarity score
earned by its own boilerplate, pushing a real question off the list. v58 is what stops it.

### ⚠️ THE ASSERTION THAT WAS SUPPOSED TO CATCH THIS COULD NOT FAIL

`tests/sierra_surface.test.js` (6) reads *"the surface reaches ONLY the guidance layer so
far"* and tests it with `/fetchTeamGuidance\(sb, hostSurface\)/` — a **presence** check
wearing an **exclusivity** label. v58 gave the surface three more consumers and the
assertion still passed, because **an assertion pinned to one member of a set cannot notice
the set growing.** Its `why` string even described the widening as "a later decision" — a
decision that had since been made, in the diff it was failing to notice.

Replaced by `tests/sierra_memory_isolation.test.js` (25 checks), which pins the **set**:
four consumers, counted, so a fifth fails the run. Every assertion was perturbation-proved
— fork the cache to `stable`, drop either guard, add a fifth consumer, give `public` a
drafting cap, make `sierra.js` send `retrieval_query`: each fails, and the baseline is
clean.

⚠️ **AND THE COUNT HAD TO SEE CODE, NOT PROSE.** The first cut counted 10 where the code
says 7, because three *comments* in the handler use the word "drafting". A guard that cries
wolf on a sentence teaches its reader to bump the number until it goes green — the opposite
of what it is for. ⚠️ Its self-check was then anchored on one of the guards it protects, so
a perturbation that legitimately moved that line reported a broken stripper **as well as**
the real defect: a second failure saying nothing. Anchor a sanity check on something the
thing under test does not touch.

### ⚠️ A CONSTRAINT IN THE SCHEMA FILE IS NOT A CONSTRAINT IN THE DATABASE

`chatbox/supabase_sierra_guidance.sql` lists `memory-briefing` in
`sierra_guidance_surface_ck`. The **live** constraint does not:

```
CHECK ((surface IS NULL) OR (surface = ANY (ARRAY['my-college','cobi-assistant',
       'public','fact-sheet','memory-autogen'])))
```

`sierra_surface.test.js` (4) asserts "every surface the function accepts is allowed by the
constraint" — and passes, because it reads the **file**. The live database is a system no
jsdom test can see.

⭐ **THIS IS THE ONE REMAINING PATH BY WHICH A MEMORY-INTENDED RULE COULD REACH SIERRA AND
THE FACT SHEET.** The Sierra Training picker offers *"Only when briefing on the memory
entries"* (shipped live in #1321). A curator choosing it gets a constraint violation, and
the way out of a failed save is to leave the scope blank — and blank means **every surface**.
The contamination path is not the code; it is the curator being unable to express the
scope the UI offers them. One additive `ALTER` closes it.

⚠️ Note the memory row `the-sierra-surface-vocabulary-lives-in-three-places` already says
the constraint lives in "the SQL file **AND the live DB**". The row is right and the second
half was not done — recording a rule and applying it are two events, again.

### The `plain` regression

#1308 made plain language mandatory on every row, after Sam mis-governed two entries he
could not read. On 2026-08-24 both sessions wrote rows and **neither wrote `plain`**: 19 of
the 26 rows missing it were written that day. Backfilled here. The remaining 7 are all
`superseded` — out of the default view, historical — and are deliberately left, because
rewriting retired rows is churn, not hygiene. **Live rows are at zero.**

### Where this leaves the thread

- **`cpl-chat` v58 is not deployed, and that is now Sam's call to make deliberately** —
  he asked to test the surfaces first, particularly Sierra. The isolation guard is the
  mechanical half of that answer; the smoke suite against the deployed function is the
  other half and can only run *after* a deploy.
- **The live CHECK constraint needs one additive `ALTER`** — independent of the deploy, and
  safe in either order (`fetchGuidanceKind` retries unscoped on any error, by design).
- **The 3 polluted `chat_interactions` rows** are still in the Gap Miner's feed.
