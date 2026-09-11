---
title: Session 258 handoff — a tab whose main table had never rendered, and a deploy boundary that is not one
date: 2026-09-11
session: 258 (SkyList)
tags: [handoff, college-identity, sierra, cpl-chat, map-users, a11y]
status: current
---

# You are Session 258

Your moniker is **SkyList**. SkyBeat cleared the top of SkySignal's queue and
found a production defect on the way. Two lanes moved; the MAP Users work is
the one Sam is deciding on.

⚠️ **PARALLEL LANES.** [`docs/session_253_handoff.md`](session_253_handoff.md)
(SkyProof, dark mode) and [`docs/session_254_handoff.md`](session_254_handoff.md)
(SkyStar, SkyView) are still live for their lanes; this file supersedes only
[`docs/session_257_handoff.md`](session_257_handoff.md).

Read in order:
[`lanes/college-district-identity.md`](reference/lanes/college-district-identity.md) ·
[`lanes/sierra-retrieval-corpus.md`](reference/lanes/sierra-retrieval-corpus.md) ·
[`methodology-a-feature-test-on-a-missing-method-fails-silent`](kb-notes/methodology-a-feature-test-on-a-missing-method-fails-silent.md) ·
[PR #1559](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1559) (merged).

## What Session 257 did

- ⭐ **College Identity's main table had never rendered — for anyone, since the
  tab shipped.** `authHeaders()` feature-tested `window.CPL_TEAM_PHRASE.headers`,
  which does not exist (`decorateHeaders` does). Always-false guard → no `apikey`
  on any fetch → `map_colleges` 401 → `state.live` null → the roster draws under
  `if (live)`. Sam saw only the lint findings and asked where the table was. It
  was his own 2026-08-21 ask, quoted in the file's header — which had itself
  drifted to describe the broken screen (*"a LINT SURFACE, not a lookup"*).
- **Sam ruled the order:** *"show the full table and just give a link to the
  discrepancies."* Built. A **link, not a disclosure** — the findings stay in the
  DOM and in document order for Ctrl-F, the heading list and deep links. No link
  is drawn when there is nothing to link to.
- **a11y:** the view's only failure (both themes) was `headings skips: h1 -> h3`.
  Every sibling tab opens at h2. Fixed and **re-verified**: the view leaves the
  output, total 38 → 36.
- ⭐ **The cap-hit read: 0 real cap hits and 0 blanks on the fixed code.** The two
  rows that LOOK like v64 cap hits are zero-character blanks served by **warm v63
  isolates ~25 s past the deploy**. Two independent proofs: **0 `EMPTY ANSWER`
  lines in 17 hours** (v64 logs one on any zero-text answer), and the cache line's
  own FORMAT gained `model=` in that deploy — last without **02:04:02.384Z**,
  first with **02:04:06.434Z**, 5 of 200 pre-cutover.
- **Smoke 16a → 16r.** Roster asserted at retrieval with controls and a floor of
  7 of 9; prose keeps only floors and bans. Live run: 16r 9 of 9, 16a 9 of 9.
- **The announce hint** now requires the session's one-line confirmation to carry
  the visibility reminder — Sam asked for exactly that prompt.

## Sam's decisions this run

1. **Roster above findings, discrepancies behind a link** — *"Yes, above the
   findings. Better yet, show the full table and just give a link to the
   discrepancies."*
2. **He wants a daily identity diff** — *"We could run it daily in the cron
   against what we pull from MAP and flag any diffs."* Not built; see below.
3. **He wants the taxonomy wired to MAP Users** — *"College taxonomy should be
   wired to the MAP Users tab and data as well. I'm sure it already is…"* It is
   not. Not built; his call.
4. **Sessions should prompt him to share** — *"Wish there was a way to make
   sessions public by default or perhaps a prompt when you spin up."* Built into
   the SessionStart hint.

## NEEDS SAM — do not start either without a reply

1. **Wire the identity lint into `map-users-sync.yml`** for his daily diff. The
   builder already takes `--observed-json`; only the trigger is missing. That
   workflow already runs daily at `0 13 * * *` and is the job that pulls from MAP,
   so it holds the fresh names. ⚠️ Its header says "schedule (monthly)" — wrong.
2. **Make MAP Users resolve through `college_id`/variants**, not name strings.
   `map_users.js` has **zero** references to `map_colleges`/`college_id`/`variants`
   and keys on `map_college_users?college=eq.<name>` plus `FALLBACK_CONTACTS` (78),
   `CPL_PAGES` (16), `CPL_LIAISONS` (1). This is the weak link he keeps noticing.
3. Carried: the sixteen-row register sweep on Sonnet 5; `sierra_guidance`'s CHECK
   constraint lacks `skyview-ask`; eleven decision-sheet items settled and waiting
   (4, 5, 8, 9, 10, 11, 13, 15, 16, 17, 18, 19).

## Queue

- ⚠️ **15a/15c are still red and #1555 did NOT close them.** Two correct answers
  trip the stripper's two narrow shapes: a negation four words upstream of the
  stem (*"not a backlog it's failing to work through"*), and a match running
  across an em-dash into the next clause (*"transcribed — it's not that the
  number is zero"*). Patch proposed in the #1559 comment, unpushed — it is a
  different mode from that PR and `smoke` is non-required.
- **Raise `cpl-chat-health.yml` to hourly** — its own header says to once billing
  moved to the corporate account, which it did on 09-10.
- **The probe's blind spot.** It asks one simple question and passed through two
  hours of blanks. ⭐ Recommendation, not yet built: **read the blank rate from
  `chat_interactions`** rather than add a second question — it costs no model
  call and sees real traffic instead of the probe's own.
- **`/a11y-pass`** on the remaining 36 failures. The Fact Sheet is the biggest
  (141 targets under 24×24) and is public-facing.
- ⚠️ **`docs/roadmap_archive.md` is 4.26× over budget** (638 KB / 150 KB) — the
  worst `oversized_doc` in the corpus and untouched by this run.
- Carried: `Counselor_Verified` into the daily fetch; 51 guessed column offsets in
  `excel_to_dashboard.py`; SkyView ⑩/⑪ (S254).

## Patterns that worked

- **When a measurement straddles a deploy, date the rows by something whose SHAPE
  changed, not by the wall clock.** A log line gaining a field settled in one
  query what the timestamps got wrong.
- **Check the repo before proposing.** Sam asked for a taxonomy tab; it existed,
  built to his own earlier words. The answer was reading a lane file.
- **Assert ORDER, not presence.** Both sections rendered before and after the
  reorder, so every other check in the file passed either way.
- ⚠️ **Two of my own guards were vacuous on the first pass** — one matched a
  phrase my rewritten intro also contained (asserted nothing, stayed green); one
  used a selector matching any element after a heading (failed on correct
  markup). A guard that passes is not a guard that works; make it fail first.

## Safety patterns to honor

Rule 4 · Rule 5 (never force-push `main`) · Rule 10 (Supabase only through MCP;
the sandbox cannot reach `*.supabase.co`, `api.github.com` or `map.rccd.edu`) ·
the `test` check green on the CURRENT head before every merge, and ⚠️ a
`check_suite.completed` wake routinely names a SUPERSEDED sha · `cpl-chat deploy`
is a production dispatch · MAP read-only · the public KB untouched · **rebuild
`kb/dependency_map.json` before pushing — it records LINE OFFSETS, so any edit
moves it and `test` goes red** · DON'T LOCK IN: end the turn when the next step
waits on anything external.

## KB notes added this run

- `methodology-a-feature-test-on-a-missing-method-fails-silent`

---

*Greetings, you are Sky**List** (Session 258), see Sky**Beat**'s handoff —
`docs/session_258_handoff.md` — let's keep rolling with our queue.*
