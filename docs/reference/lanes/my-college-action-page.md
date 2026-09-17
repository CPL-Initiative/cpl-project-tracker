---
title: "My College (college action page) / MAP-team queue — lane state"
created: 2026-08-28
updated: 2026-08-28
tags: [reference, roadmap-lane]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference/lanes
related:
  - "[[CLAUDE]]"
---

# My College (college action page) / MAP-team queue

> **Relocated verbatim from `CLAUDE.md` §11 on 2026-08-28** (Session 206, the
> consolidation). This is **always-current lane state, not an archive** —
> update it at every checkpoint that moves this lane, exactly as you used to
> update the §11 cell. `CLAUDE.md` keeps the one-line pointer; the detail is
> here.

**What this lane is:** One page (not 123) where a college picks itself and gets its stats, its opportunities against the goals, and concrete to-dos — plus the same engine pointed INWARD at the MAP team's own backlog.

## Status

✅ **LIVE, AND VERIFIED BY SAM IN A BROWSER (2026-08-25).** The tab opens on a CHOICE and always asks (Sky167 #1232–#1234; SkyAsk #1274; SkyVouch #1276; SkyScope #1291; Sky190 #1325). ⭐ **A remembered choice is a NAMED SHORTCUT, never a destination** — true of the COLLEGE and of the ROLE, whose localStorage key is SHARED with the public page and the Fact Sheet drawer, so one pick steered every answer. Remembered, but CONFIRMED per browser-tab session. ⭐ **THE HOST OWNS THE QUESTIONS, THE ANCHOR *AND* THE THREAD** — owning only the questions is what made Sierra answer an LACCD page about RCCD: `convo` is module-level by design and `finish()` wipes the visible log, so the reader saw a clean conversation while eight stale turns still shipped. **The invariant is a COMPARISON — *what is SENT is never more than what is SHOWN*.** ⚠️ A stale thread SOURCES the answer, it does not tint it. ⚠️ A group scope must not pass `null` (that restores PUBLIC starters). ⚠️ Clearing a transcript is NOT `logEl.innerHTML=''` — the starter chips live inside the log. **Standing invariants:** `buildQueue()` is **pure**; **measure at load, never carry a list** (a failed read is `unknown`, never 0); ⚠️ **NEVER re-derive an allocation — call `_alloc()`** (Mt. SAC = **$522,239**) and `_prios(name, slot)`; ⭐ join BOTH sides through `cplCollegeShort()`; ⭐ a ROLL-UP sums UNSUPPRESSED rows only; ⭐ the briefing is a **docx that READS THE RENDERED DOM**; ⚠️ `askSierra()` must OPEN the section first; ⚠️ `prefill()` stays send-free; ⚠️ an ABSENT measurement must never render as an ACHIEVEMENT; ⚠️ `map_credential_student_rollup` is a **MATVIEW**; ⚠️ **per-college figures come from `map_college_credit_summary`, NEVER from a profile** — `chatbox_college_profiles.credit_distribution` had no writer and is deleted. The lead figure is **ONE decision, not 300** — 98.8% of the 64,074 waiting units is Credit for Basic Military Service. ⚠️ **TWO OF FIVE SCOPES SHIP DISABLED WITH THEIR REASON** (SWP and ASCCC regions exist nowhere here; `college_geo.region` is a THIRD scheme). **HELD BY SAM:** MAP deep links, the `?college=` RLS decision, the MIS side-by-side. ⭐ **OPEN TO THE PUBLIC 2026-09-17 (Sam's ruling), AND NOTHING WAS UN-GATED** (#1598 data, #1599 client). The Admin tab's *Seen by* governs the MENU; the PAGE was gated by `if (!signedIn())` in BOTH `render()` and `activate()`, which is why setting the audience to Everyone changed nothing a reader could see. `sources()` now points a credential-less reader at four `_pub` mirrors and a phrase holder at the bases; every base keeps its RLS and is never written. ⚠️ **Three of the four could never be un-gated:** `map_college_cr_unit` has 145,554 rows describing ONE student at a named college, course and credit recommendation; `map_college_credit_summary` publishes exact sub-k headcounts; `map_college_contacts` is a statewide executive directory with emails. Suppression moved to BUILD time in `kb/_publish_college_briefing.py` (the one implementation) — render-time suppression is what the ADR calls decoration. ⚠️ **A REMAINDER ROW IS NOT A DATA GAP** — ungrouped it reads as *Not categorized* / *(no recommendation named in MAP)*, so it is split out and rendered as its own withheld line with its units still IN the total; group shares are of the FULL total and deliberately do not sum to 1. ⚠️ **A ROLE THE READER MAY NOT SEE IS NOT AN EMPTY ROLE** — `contactRoster` returns three lists now, or the page tells a college its VP is missing when we did not ask. Refresh: dispatch `college-briefing-publish.yml`. ⚠️ `npm run a11y` passes this tab but loads static files with no Supabase, so it never paints either new row — the new markup adds no class, color or hex and inherits its neighbours, which is reuse rather than a measurement.

**NEXT:** ① the redesign in a browser; ② the region lists when he finds them; ③ Sam's eyes on the public page signed out — the check the sweep cannot make. Story: [`docs/college_action_page_lessons.md`](docs/college_action_page_lessons.md); durable [`a-second-copy-of-a-fact-is-a-stale-copy-waiting`](docs/kb-notes/methodology-a-second-copy-of-a-fact-is-a-stale-copy-waiting.md).
