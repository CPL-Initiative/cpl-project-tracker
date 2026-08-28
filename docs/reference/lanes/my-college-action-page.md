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

✅ **LIVE, AND VERIFIED BY SAM IN A BROWSER (2026-08-25).** The tab opens on a CHOICE and always asks (Sky167 #1232–#1234; SkyAsk #1274; SkyVouch #1276; SkyScope #1291; Sky190 #1325). ⭐ **A remembered choice is a NAMED SHORTCUT, never a destination** — true of the COLLEGE and of the ROLE, whose localStorage key is SHARED with the public page and the Fact Sheet drawer, so one pick steered every answer. Remembered, but CONFIRMED per browser-tab session. ⭐ **THE HOST OWNS THE QUESTIONS, THE ANCHOR *AND* THE THREAD** — owning only the questions is what made Sierra answer an LACCD page about RCCD: `convo` is module-level by design and `finish()` wipes the visible log, so the reader saw a clean conversation while eight stale turns still shipped. **The invariant is a COMPARISON — *what is SENT is never more than what is SHOWN*.** ⚠️ A stale thread SOURCES the answer, it does not tint it. ⚠️ A group scope must not pass `null` (that restores PUBLIC starters). ⚠️ Clearing a transcript is NOT `logEl.innerHTML=''` — the starter chips live inside the log. **Standing invariants:** `buildQueue()` is **pure**; **measure at load, never carry a list** (a failed read is `unknown`, never 0); ⚠️ **NEVER re-derive an allocation — call `_alloc()`** (Mt. SAC = **$522,239**) and `_prios(name, slot)`; ⭐ join BOTH sides through `cplCollegeShort()`; ⭐ a ROLL-UP sums UNSUPPRESSED rows only; ⭐ the briefing is a **docx that READS THE RENDERED DOM**; ⚠️ `askSierra()` must OPEN the section first; ⚠️ `prefill()` stays send-free; ⚠️ an ABSENT measurement must never render as an ACHIEVEMENT; ⚠️ `map_credential_student_rollup` is a **MATVIEW**; ⚠️ **per-college figures come from `map_college_credit_summary`, NEVER from a profile** — `chatbox_college_profiles.credit_distribution` had no writer and is deleted. The lead figure is **ONE decision, not 300** — 98.8% of the 64,074 waiting units is Credit for Basic Military Service. ⚠️ **TWO OF FIVE SCOPES SHIP DISABLED WITH THEIR REASON** (SWP and ASCCC regions exist nowhere here; `college_geo.region` is a THIRD scheme). **HELD BY SAM:** MAP deep links, the `?college=` RLS decision, the MIS side-by-side. **NEXT:** ① the redesign in a browser; ② the region lists when he finds them. Story: [`docs/college_action_page_lessons.md`](docs/college_action_page_lessons.md); durable [`a-second-copy-of-a-fact-is-a-stale-copy-waiting`](docs/kb-notes/methodology-a-second-copy-of-a-fact-is-a-stale-copy-waiting.md).
