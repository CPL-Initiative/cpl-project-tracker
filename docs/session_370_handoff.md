---
title: Session 370 handoff — load and display Chaffey, read San Diego City, Sheet 68 card 2, the My College UI pass
date: 2026-10-12
session: 369 (SkyLaurel)
tags: [handoff, program-requirements, chaffey, san-diego-city, long-beach-city, decision-sheet]
status: current
superseded: true
superseded_by: session_380_handoff.md
---

# You are Session 370

Your moniker is **SkyHolly**. Session 369 (**SkyLaurel**, `session_012PUdGwqCsP2FJbU6GQ2iMU`) ran with Sam present at the
start and end, checkpointed at the context warning (109k left), and let go of its check-ins and PR watches. A worker
restart idled it from 04:35Z to 11:16Z; the 05:05Z routine stood down because S369 held the queue.

## First, in this order

0. **One writer.** `list_sessions`; Sam's routine fires 05:05Z daily (`trig_01L8K64ZKYb5eALdT4HW6NAV`). S369 holds nothing.
   Merge S369's checkpoint PRs on `test` (tracker `claude/s369-checkpoint`, then vault `claude/s369-checkpoint`).
1. **Rule 8:** `cpl_memory` tags `program-requirements-harvest`, `chaffey`, `san-diego-city`, `long-beach-city`.
2. **Sheet 68** ([NYWeDqDAVgTNEc4Ds5SHSy](https://claude.ai/artifact/NYWeDqDAVgTNEc4Ds5SHSy), current): read the `replies`
   store. Card 1 is answered (*Pasted*, 11:18Z; the policy reads `true`, anon sees 1,555). Card 2 (remove Long Beach City
   38542) was open at sign-off. On *Remove it*: receipt with the row whole (`to_jsonb(r)::text`, md5-guarded, unchecked, no
   verdict; the S362 wrong-page receipt is the pattern), delete; if `apply_migration` times out, a paste card. Then drop both
   cards from the vault builder (no card left, no sheet written) and the lane's marker, in one PR per repo, tracker first.

## Next in the queue

1. **Chaffey** (`claude/s369-chaffey-reader`, draft PR open): run 38242003226 reads with extraction (~$11, Sam's 02:50Z
   go). When it files, check found/pass counts, dispatch `step=load` on the branch, merge `origin/main` in, run
   `python3 kb/_build_roep_display.py` (Chaffey is already in the dated reads, 99841af), commit, dispatch `step=display`,
   read back the build counts, merge the PR on `test`.
2. **San Diego City** (`claude/s369-sdcity-read`): capture-only run 38242006192 on the fixed reader (catalog 69 from
   `_getCatalogs`). If it finds most of its 191 programs with lists, dispatch `step=read` with `extract=1` on that branch,
   then load and display the same way (its dated reads are on the Chaffey branch; merge that first). If it finds few, probe
   *Degree Curricula and Certificate Programs* (15604) with a `kb/college_reads/` plan before changing the reader.
3. **UI pass:** `python3 scripts/ui_pass.py --next` names My College (`college_briefing.js`, 280 KB). S369 skipped it for
   room; give it a whole run.
4. **7c's quick-list window** (1,800 characters) missed by about 5 on #2021's smoke: Sam's rule, not changed. Raise it only
   if it fails again.

## What shipped (S369)

#2023 smoke 7s (a pronoun for the articulation its own sentence names) · #2024 Long Beach City's re-read filed, displayed
(build `05811159eeee`, 1,554 rows; Trauma Studies 43802/46290 files restored to the reads their rows hold) · #2025 lane +
Sheet 68 markers · vault #315 Sheet 68 · Chaffey/San Diego City reader fixes on `claude/s369-chaffey-reader` (entries with a
Requirements child, AS-T awards, degree sections first, each title once, `_getCatalogs` fallback; 107 checks) · dated reads
for both colleges (md5-verified) · Sam's policy paste confirmed live.

## Patterns that worked

- **Probe the catalog's own JSON before changing the reader.** Two probes found all three Chaffey differences; two more
  found San Diego City's catalog id in `_getCatalogs`.
- **Hand a large tool result to a subagent.** The dated-read SQL returns ~25k tokens; a subagent filed it and proved it by md5.
- **Merge main into a bot-headed branch** so `test` runs on the head (a bot commit triggers no CI).

## Safety patterns

- **Restore a filed record before the display build, not after.** The display test requires the committed receipt to cover
  every filed record; S369 rebuilt twice.
- **Check the 05:05Z routine after a long gap.** It reads S369's branches and stands down while a session holds the queue.

## Not refreshed this checkpoint

UI pass (no room; My College stays due); Pipeline tab (did not move); `kb/README.md`, `README.md` (no structure or surface
change); no new KB note (the curriQunet lessons are in the lessons doc, S369). Sheet 68's builder still carries card 1 until
card 2 is answered.

## Sign-off line for Sam

Greetings, you are SkyHolly (Session 370), see SkyLaurel's handoff — `docs/session_370_handoff.md` — let's keep rolling with our queue.
