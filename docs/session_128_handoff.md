---
title: Session 128 handoff (SkyGauge → you) — mode 7 is closed; the disposition grain is the live workstream
created: 2026-08-07
updated: 2026-08-07
tags: [handoff, sierra, cpl-assistant, student-detail, disposition, map-api]
related:
  - "[[docs/cpl_assistant_lessons]]"
  - "[[docs/kb-notes/methodology-a-wrong-column-is-worse-than-a-missing-one]]"
  - "[[docs/kb-notes/methodology-judge-a-detector-by-what-it-prints]]"
---

# You are Session 128

Previous session was **SkyGauge (127)**. The assistant is **Sierra**; the workstream is the "CPL AI Sherpa."
Sam names monikers — if he doesn't, **SkyLedger** is the suggestion (the open work is counting things
honestly). Coin your own if you prefer.

## Read these first, in order

1. `docs/kb-notes/methodology-a-wrong-column-is-worse-than-a-missing-one.md` — new, and the session's main
   transferable finding. Read before writing any ingestion or matcher.
2. `docs/cpl_assistant_lessons.md` — §SkyMiner and §SkyMiner part 2 for the Sierra state you inherit.
3. `funding/_student_detail_local.py` — the live workstream's tool. Its docstring carries the privacy reasoning.

## What SkyGauge shipped (all merged; main `145f790`)

| PR | What |
|---|---|
| #1038 | Mode 7 measured and closed — retrieval was never the problem; live 150-row fixture + 13 checks |
| #1039 | The disposition gap diagnosed; MAP API probe (runner-side) |
| #1040 | Aggregator takes the JSON export; per-exhibit rollup |
| #1041 | The status column it matched was the workflow stage, not the disposition |
| #1042 | KB note + this handoff — capture the findings (no checkpoint was run) |
| #1043 | Sum the credit funnel; `CPLStatusPlan` confirmed present in the export |

## ✅ Priority 1 from the last handoff is DONE — do not re-open it

Session 127's handoff filed "mode 7 part 3" as Priority 1 and told you not to guess between two causes. Measured:

- The offerings RPC returns **613 rows / 117 colleges** for mode 7's exact tsquery; the cap takes 150. **LA Trade
  Tech ranks 2, Rio Hondo 6, Long Beach City 19, El Camino 26.** Retrieval was never thinning anything.
- Feeding that live window through the real builder prints **ten colleges, all in LA Harbor's county**, under an
  explicit "point to the nearest colleges that do" line. Part 3's answer was in the context all along.
- **It already works.** Smoke run 47 (the red one the handoff describes) ran against **deploy 11**. #1035 shipped
  v35 after it. Runs **48, 49 and a fresh dispatch 50 are all green**, and run 50's answer carries a literal
  "Nearest Colleges That Teach Construction/Carpentry" section.

⭐ **The lesson worth carrying:** the session's own last PR fixed the item its handoff filed as Priority 1. The
smoke that proved it ran automatically on push, after the handoff was written and never re-read. **After your
last deploy, re-read the smoke run that the push triggered before you write your handoff.**

Committed so it cannot regress to a guess: `tests/fixtures/offerings_mode7_2026-08-07.tsv` (the live window) plus
13 checks in `sierra_geo_ranking.test.js`, including a guard tying the fixture to the RPC's `result_limit`.

Incidental finding in there: on that query **`core` does no discriminating work** — every returned row is a
construction/welding/carpentry TOP program — and the volume term saturates at `min(courses, 39)`. The entire
ordering rests on the proximity band. Strip it and an LA question is answered with Oakland and Sacramento.

## 🎯 Priority 1 (yours) — the disposition grain

**The problem, stated exactly.** Sierra can say *"this exhibit has X eligible credits statewide"* and never
*"at YOUR college these twelve are sitting at Needs Action."* Of the nine views in `fetch_custom_report.py`,
`View_ExhibitCRsCatalog_Dataset` carries the credit funnel but statewide-per-exhibit with no college dimension —
and **`CPLStatusPlan` appears in none of the nine.** That is why a live answer of Sam's hedged.

**Where it stands.**

- **Malone's API view is NOT live.** Probed 2026-08-07: `400 — View_StudentDetailCredits_APIDataset is not
  Valid`, same for `_Dataset` and the bare name, still empty on a single-column retry (so it is the view name,
  not the columns). Sam expects it "in the next few days."
- **You can re-check it yourself, one click:** Actions → **"Discover MAP datasets (manual)"** → Run workflow. It
  prints the endpoint's own `responseMessage`. When it returns rows, wire the name into
  `fetch_custom_report.py`; `funding/_build_cr_backlog.py` already parses that shape.
- **The file path works today.** Sam ran `funding/_student_detail_local.py` locally on the 2026-08-06 export.

**What that run established (trustworthy — none of it depends on the disputed column):**

- **537,908 rows · 42,345 distinct students statewide**
- **CPR / AED / first aid: 21,891 credit recommendations held by 17,904 DISTINCT students across 106 colleges** —
  **42% of every student in the system with a CPL recommendation.** That is Sam's original question, answered.
- 3,644 exhibits reported, 2,371 suppressed as too thin
- Top by distinct students: CCSF 1,238 · San Diego Miramar 995 · Moreno Valley 732 · San Diego Mesa 710

**What was OPEN and is now RESOLVED (#1043).** The run matched a column named `Status` (workflow stage: Needs
Action / Implementation / Faculty / Initiator / Articulation Officer) instead of `CPLStatusPlan`, and reported a
statewide disposition rate of **0.0%**. Sam then pasted the export's real header row, which settled it:

- **`CPLStatusPlan` IS present** — the LAST of 29 columns. `Status` sits eighteen places earlier and is largely
  **EMPTY**, which is both how the alternation matcher grabbed it and why "Needs Action" so dominated the output
  (blank cells fall through to the default). **No re-export is needed.** The matcher was rebuilt against his
  header order verbatim and now resolves correctly.
- **The export also carries the CREDIT FUNNEL per row** — `PotentialCredits`, `CreditsInReview`,
  `AppliedCredits`, `TranscribedCredits` — which the script had been ignoring while counting rows. This was Sam's
  original ask in his own words ("eligible, applied, and transcribed"), and it is now summed statewide, per
  family and per exhibit.
  ⚠️ **Credits SUM; students DEDUPE.** Adding credits across rows is correct; adding students across rows
  double-counts anyone holding several recommendations. They are separate fields for that reason — do not
  collapse them.

**So the one thing outstanding is a single re-run**, which Sam had not yet pasted back when the session ended.
Expect `'status': 'CPLStatusPlan'` in the matched columns, a real disposition rate, and a
`credits — eligible / in review / applied / transcribed` line under both the statewide block and the family.
**Ask him for it before doing anything else** — those numbers are Priority 2's input.

## 🎯 Priority 2 — get it into Sierra

`chatbox_exhibits` has 11 columns and none of them are the funnel. The per-exhibit rollup the aggregator now
emits is keyed by `ExhibitID`, which joins straight to `chatbox_exhibits.exhibit_id`. That is the bridge.

⚠️ **This writes to a shared table feeding the production widget on colleges' own pages. Walk Sam through blast
radius before touching it** — and Session 124's roadmap 3.2 already scopes the committed regeneration.

⚠️ **One correctness trap, measured:** `TotalStudentsForCR` **varies within `(ExhibitID, CreditRecommendation)`**
in 19,461 of 108,911 groups — and *still* varies with `SkillLevel` added. There is a finer key nobody has
identified, so any naive per-exhibit student sum overstates. `excel_to_dashboard.py`'s
`_rollup_exhibit_cr_catalog` already handles this (MAX per exhibit, then SUM across distinct exhibits) — reuse
its reasoning, do not re-derive it.

## 🎯 Priority 3 — the feedback queue (6 real rows), unchanged

Best value remains **"how many colleges have a CPL Counselor or Coordinator listed?"** — a build, not a bug; the
data exists from SkyMail. See session 127's handoff for the other five.

## Carryover

- **Sam's local clone is on a dead lineage** — 408 local vs 1,703 remote commits, add/add conflicts on `LICENSE`
  and `README.md`, most likely predating the Session 26 / #227 PII history rewrite. He was given
  `git reset --hard origin/main` (safe: `stash list` empty, only untracked `budget-support/` and
  `reports - Copy/`, which a hard reset does not touch). **Confirm he ran it.** His **vault clone** may have
  diverged the same way — `sync-vault-clones.ps1` only fast-forwards, so Obsidian may be silently stale. Check
  `.vault-sync.log`.
- **SkyHero's five-surface poaching audit was never reported.** Still open, two sessions running.
- **`creditforbeingyou.org/main/student` remains unverified** — sandbox is egress-blocked from that domain, and
  it is in front of every student who asks.
- **The corpus covers 59 of MAP's 123 colleges.** Still the biggest single limit on Sierra.
- **No checkpoint was run this session.** Sam was offered it three times and stayed in flow; §11 and the To-Do
  feed do NOT yet reflect any of the four PRs above.

## Patterns that worked

- **Check whether the last session's Priority 1 is still true before working it.** Ten minutes of reading the
  smoke logs saved a day of prompt-tuning on an already-fixed bug.
- **Measure the layer below before editing the layer above.** Running the RPC with the *exact* tsquery the
  deployed function builds settled in one query what two handoffs had argued about.
- **A number that looks like a sharper version of a known finding deserves MORE suspicion, not less.** 0.0%
  passed because 4.7% was expected.
- **Print what the API said.** Two separate bugs this session were solved by printing a field already in hand.
- **Give the user the tool, not the data.** Sam's export could not reach a session three times; a local script
  answered his question in one run and kept the student grain on his machine.

## Safety patterns to honour

- **Never route per-student rows through a session's context.** `_build_cr_backlog.py` states it; Session 26 /
  #227 was a PII forward-stop needing a history rewrite. The Drive connector returns files as **base64 into
  context**, so "just split it into tranches" does not help — it is not a size problem.
- **A salted hash of a small ID space is not anonymous.** The salt lives at `~/.map_hash_salt`, outside any repo.
  Never suggest link-sharing student-level data — **this repo is public.**
- The sandbox **cannot reach** `*.supabase.co`, `mapwebapinew.azurewebsites.net`, `creditforbeingyou.org`, or
  `github.io`. The runner is the proxy; `discover-map-datasets.yml` is the worked pattern.
- ⚠️ **`actions_list` returns enormous payloads** and ignores its `workflow_id` filter. Parse the saved
  tool-result file with python; prefer `actions_get {method:"get_workflow_run"}`.
- **After every squash-merge, `git fetch && git reset --hard origin/main`** before the next change.
- Never widen `sierra_guidance` / feedback / contacts gates toward anon.

## Rollback

Nothing deployed this session — cpl-chat is unchanged at **v35** (`git show 3272bb4:chatbox/supabase/functions/cpl-chat/index.ts`).
All four PRs are tests, docs and local/runner scripts; none touch a shared table or the production function.
