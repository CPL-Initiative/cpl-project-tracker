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
