---
title: Session 260 handoff — the flag that was unbuilt, and the field that was not
date: 2026-09-12
session: 260 (SkyKey)
tags: [handoff, sierra, curation, testing, a11y]
status: current
---

# You are Session 260

Your moniker is **SkyKey**. SkyGuard (S259) found that the queue's top item —
"build the Sierra `surface` field" — had shipped three weeks earlier, worked out
what Sam's "3. Yes" had actually ruled on, and built that instead: the viewer
flag, derived by the server from the credential and never claimed by the page.

⚠️ **PARALLEL LANES.** [`docs/session_253_handoff.md`](session_253_handoff.md)
(SkyProof, dark mode) and [`docs/session_254_handoff.md`](session_254_handoff.md)
(SkyStar, SkyView) are still live for their lanes; this file supersedes only
[`docs/session_259_handoff.md`](session_259_handoff.md).

Read in order:
[`lanes/sierra-retrieval-corpus.md`](reference/lanes/sierra-retrieval-corpus.md) ·
[`methodology-verify-a-queue-item-against-the-code-before-it-reaches-the-decider`](kb-notes/methodology-verify-a-queue-item-against-the-code-before-it-reaches-the-decider.md) ·
[`cpl_assistant_lessons.md`](cpl_assistant_lessons.md) (2026-09-12) ·
PR #1568 (the flag) · PR #1566 (smoke 15a/15c) · PR #1567 (the explainer a11y target).

## What Session 259 did

- ⭐ **THE `surface` FIELD WAS ALREADY LIVE (v56, 2026-08-22).** `KNOWN_SURFACES`,
  `sierra_guidance.surface`, the Training-tab picker, two guard suites — and two
  live rows already scoped to `my-college`. The lane had said "NOT BUILT, blocked
  on Sam's go" since 2026-08-28; S258 carried that line into open question 3.
  The To-Do Sam actually read asked whether to build the **scope flag**, so his
  "3. Yes" is a ruling on the flag. Four artifacts recorded the wrong label;
  all corrected, and a `cpl_memory` row flags the conflict without superseding
  his row.
- ⭐ **BUILT THE VIEWER FLAG — cpl-chat v66, PR #1568, NOT YET DEPLOYED.**
  `deriveViewer()` asks `is_allowed_reviewer()` / `team_pass_ok()` by RPC with
  the ANON key and the caller's own credential (JWT bearer / `x-team-pass`);
  `reviewer` · `team` · `public`; every error path is public; the anon bearer
  alone costs zero round trips. Logged per turn (`chat_interactions.viewer`,
  `.surface` — migration applied live), echoed as `event: meta`, rendered by the
  COBI widget as one line of words. The public page and the Fact Sheet drawer
  are untouched. ⚠️ **It widens nothing** — no prompt line, no retrieval change;
  that is the second build and routes through Governance first.
- **Smoke 15a/15c closed** (PR #1566): the stripper spans a bounded same-clause
  gap and 15c cannot cross a dash; `tests/smoke_negation_stripper.test.js` runs
  real sed against the recorded answers and fails 6 of 24 on the old script.
- **The explainer is an a11y target** (PR #1567): measured 245 targets under
  24×24 at every width and two `.tablebox` regions not keyboard reachable
  ≤430px — all in `cpl_funding.js`'s shared section, so the funding-tab
  `/a11y-pass` fixes both surfaces.
- Sierra lane corrected and under budget (11.9 KB); funding lane compacted.

## Sam's decisions this run

None — Sam was not in the session. Every ruling honored here is his of
2026-09-12 as recorded by S258, re-read from the To-Do he answered.

## NEEDS SAM

1. **Dispatch `cpl-chat-deploy.yml` to put v66 live.** Blast radius, in plain
   words: the one function behind every Sierra surface redeploys. The public
   page, the Fact Sheet drawer, map.rccd.edu and the vendor iframe get no
   behavior change. A COBI reader who is signed in (magic link or team phrase)
   sees one new line under the assistant, *Recognized by the assistant as a
   signed-in reviewer*, which is the proof the server saw the sign-in. The log
   gains `viewer` and `surface`. The migration is already applied, so the order
   cannot matter. After the dispatch: ask Sierra from the CPL Assistant tab while
   signed in and look for the line.
2. **One statement to let curators scope a rule to SkyView** — the live CHECK on
   `sierra_guidance.surface` still lacks `skyview-ask`, so picking it in the
   Training tab is a hard save failure. Carried since S255; a session can apply
   it on your word:
   ```sql
   alter table public.sierra_guidance drop constraint sierra_guidance_surface_ck;
   alter table public.sierra_guidance add constraint sierra_guidance_surface_ck
     check (surface is null or surface in ('my-college','cobi-assistant','public',
       'fact-sheet','memory-autogen','memory-briefing','gr-analysis','skyview-ask'));
   ```
3. **Say go on the hourly health probe, or make the change yourself.** Its
   header's condition is met — billing moved to the corporate account on
   2026-09-10 (S255's lessons section; three handoffs) — but the remote
   environment's permission rules stopped the edit as a shared-resource change
   (a scheduled workflow that spends funding, about $22 a month at the header's
   estimate). The whole change is one cron line in `cpl-chat-health.yml`,
   `'7 */3 * * *'` → `'7 * * * *'`, plus its header note. A session can make it
   on your word; the probe's guard (`tests/sierra_health_probe.test.js`) does
   not pin the cadence.
4. Carried: the funding dials (Accepted 25% / factor 1.0); the sixteen-row
   register sweep on Sonnet 5.

⚠️ **HELD, NOT PENDING — do not re-ask and do not act on inference.** The LWDA
partnership stays undesignated on the (C) card (Sam, 2026-09-12).

## Queue

- ⭐ **After the dispatch, verify v66 the only way it can be verified:** signed
  in on COBI, one question on the CPL Assistant tab, the recognition line
  appears; then `select viewer, surface, count(*) from chat_interactions where
  created_at > <deploy> group by 1,2`. No session can do the browser half.
- **The bubble itself** (Sam's S255 ask, advice given, flag now built): one
  floating control on every COBI tab that mounts `cpl_chat.js` via `mountInto`
  — First Light, 24px targets, single column on a phone. It needs a surface
  name (five places: `KNOWN_SURFACES`, the SQL CHECK file AND live, the picker,
  the tests) or it reuses `cobi-assistant`.
- **The second build:** what a verified reviewer may see. The boundary inside
  COBI is aggregate vs student-detail; route through Governance and
  [`adr-student-detail-aggregate-disclosure-control`](kb-notes/adr-student-detail-aggregate-disclosure-control.md)
  before any prompt line or retrieval change. A surface-aware rule registry is
  a separate change (built-ins still outrank guidance).
- **`/a11y-pass` on the funding tab + explainer.** 317 targets on the tab, 245
  on the explainer, the same three classes; 18 `--text-faint` pairs on the tab;
  two `.tablebox` regions on the explainer. One CSS pass in `cpl_funding.js`.
- **Sierra Training's Gap Miner could show `viewer` and `surface`** per turn
  (its select list at `sierra_training.js` ~534) — the columns exist now.
- **Observation, not acted on:** `chat_interactions` still carries an
  `anon_insert_only` policy (`with_check true`) from before the function logged
  under the service key. Any holder of the public key can insert a row. Not
  widened by v66; not this lane's to remove without a look at who else inserts.
- ⚠️ **Docs over budget:** `docs/roadmap_archive.md` 4.3× (untouched, worst in
  the corpus); `cpl_funding_lessons.md` at 1.0×; `cobi-dark-mode.md` lane 1.54×.
- Carried: `Counselor_Verified` into the daily fetch; 51 guessed column offsets
  in `excel_to_dashboard.py`; SkyView ⑩/⑪ (S254); the explainer video frames
  rather than blurs (shot sheet beat 2).

## Patterns that worked

- **Grep for the thing the queue says is missing before doing anything else.**
  One grep turned "build X" into "X shipped three weeks ago; what did he rule?"
- **Recover a ruling from what the decider READ, not from what the checkpoint
  wrote.** The pre-ruling To-Do and the pre-ruling handoff are in git.
- **Inject the client factory.** `deriveViewer(headers, makeClient)` lets a Node
  test drive the real async derivation with a fake and prove which key and
  which header every check is made with — no network, no mock of Deno beyond
  `Deno.env`.
- **A test that reads the script's own expressions.** The stripper test extracts
  both sed expressions and both mode regexes out of `smoke_test.sh`; a copy would
  pass while the script drifted.
- ⚠️ **Do not `git stash` in a worktree here** — the stash stack is shared with
  every other worktree and session. A file edited in one worktree was found
  unmodified at commit time; the cause was never proven, so the safe habit is a
  WIP commit, never a stash.
- **An a11y target that fails is still the right target.** Adding it recorded
  the numbers; hiding it would have recorded nothing.

## Safety patterns to honor

Rule 4 · Rule 5 (never force-push `main`) · Rule 10 (Supabase only through MCP;
the sandbox cannot reach `*.supabase.co`, `api.github.com` or `map.rccd.edu`) ·
the `test` check green on the CURRENT head before every merge, and ⚠️ a
`check_suite.completed` wake routinely names a SUPERSEDED sha · `cpl-chat deploy`
is a production dispatch and Sam's · MAP read-only · the public KB untouched ·
**rebuild `kb/dependency_map.json` as the genuinely LAST step before a push** ·
**never re-baseline `check_floor.json` from a contended run** (hand-add one
measured entry) · the viewer flag is derived SERVER-SIDE — never add a body
field or a header the page sets to name a kind · DON'T LOCK IN: end the turn
when the next step waits on anything external.

## KB notes added this run

- `methodology-verify-a-queue-item-against-the-code-before-it-reaches-the-decider`

---

*Greetings, you are Sky**Key** (Session 260), see Sky**Guard**'s handoff —
`docs/session_260_handoff.md` — let's keep rolling with our queue.*
