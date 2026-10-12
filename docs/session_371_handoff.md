---
title: Session 371 handoff — deploy the Sierra 7c fix, load and display San Diego City, College Identity's UI pass
date: 2026-10-12
session: 370 (SkyHolly)
tags: [handoff, program-requirements, san-diego-city, sierra, smoke, my-college]
status: current
---

# You are Session 371

Your moniker is **SkyMaple**. Session 370 (**SkyHolly**, `session_01HyMmsoFSqP4jANuuRsXR8h`) ran with Sam present, checkpointed
at the context warning (about 109k left), and lets go of its watches and check-ins in its sign-off turn.

## First, in this order

0. **One writer.** `list_sessions`; Sam's routine fires 05:05Z daily (`trig_01L8K64ZKYb5eALdT4HW6NAV`). Merge S370's
   checkpoint PRs on `test` (tracker `claude/s370-checkpoint`, then vault `claude/s370-session-note`).
1. **Rule 8:** `cpl_memory` tags `program-requirements-harvest`, `san-diego-city`, `sierra`, `my-college`.
2. **The Sierra 7c fix is merged and deploying (#2032).** Sam: *"deploy it when the A/B is clean."* A/B run 38262514292:
   no regressions; 7c and two 7s checks fail on production and pass on the preview (its 7c opens on Long Beach City's VN 220
   with Long Beach City's coordinator). S370 merged it (7f467d6) and dispatched `cpl-chat-deploy.yml` from main ~14:48Z.
   Confirm the deploy run succeeded and `list_edge_functions` shows the new version, then dispatch `cpl-chat-smoke.yml` on
   main once no other smoke is running (the merge's push starts one against whatever was live). Delete the preview
   function (`cpl-chat-preview-ab.yml` with `cleanup=true`). The A/B preview pass logged one database timeout on 7p's
   negative control (57014), which no prompt reaches; the compare step counts only `7r` controls.
3. **San Diego City** (`claude/s369-sdcity-read`): read run 38252422845 (capture plus extraction). When it has filed:
   check found/pass, dispatch `step=load`, merge `origin/main` in, `python3 kb/_build_roep_display.py`, commit, dispatch
   `step=display`, read back the build (every row on it), open a PR and merge on `test`. Its dated reads are on main (99841af).

## Next in the queue

1. **UI pass:** `python3 scripts/ui_pass.py --next` names College Identity (`cobi:college-identity`, never audited).
   If the tab is gated, seed it as #2020 and #2030 did (`a11y.config.js`, without the mouse).
2. **The next college** after San Diego City: the next Leading-tier college on a platform the read handles.
3. **Smoke 7c** after the deploy: if it fails again on the opening, read the answer before touching the prompt.

## What shipped (S370)

#2028 Long Beach City 38542 removed (Sheet 68 card 2, receipt holds the row) · vault #317 Sheet 68 out of the builder ·
#2027 Chaffey read, loaded, displayed (191; build `496f2a71470a`, 1,745 rows) · #2030 My College UI pass: the public
contact measure (every college had told the public "No contact listed in MAP"), seeded targets, controls as words ·
#2031 smoke 7s, a verb before the articulation · #2032 Sierra 7c opening (A/B clean, merged, deploy dispatched).

## Decisions Sam made this run

- Open Asks Sheet 68 card 2, *Remove it* (11:20Z): 38542 deleted under a receipt.
- *"fix Sierra's 7c answer while San Diego City runs"* and *"deploy it when the A/B is clean"* (both 2026-10-12, in chat).

## Patterns that worked

- **Read a seeded page's text, not only its sweep.** The contact contradiction painted cleanly; it showed in the text.
- **A subagent for a long log or a large read** (two smoke logs, the queue status rows): the conclusion, not the dump.

## Safety patterns

- **Merge the tracker PR before the vault PR that reads its lane markers**; read a PR's checks before merging it.
- **A push-triggered smoke measures production**, not the branch; the branch's evidence is the A/B.
- **Read a smoke against what the database was doing**: a display apply timed out 7l four times.
- A long `cpl_memory` insert can time out; a shorter one lands (title and summary, no detail).

## Not refreshed this checkpoint

Pipeline tab (the M-ID pipeline did not move); `kb/README.md`, `README.md` (no structure or surface change). No decision
sheet: no lane carries a NEEDS SAM marker.

## Sign-off line for Sam

Greetings, you are SkyMaple (Session 371), see SkyHolly's handoff — `docs/session_371_handoff.md` — let's keep rolling with our queue.
