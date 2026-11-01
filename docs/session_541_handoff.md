---
title: "Session 541 handoff: Sierra's side panel and matched instructions, the Exhibits List view, the contacts harvest's fourth read"
date: 2026-11-01
session: 540 (SkyBunchberry, the CPL Queue routine's 14:12Z firing, with Sam live from about 14:30Z)
tags: [handoff, sierra, exhibits, contacts-harvest, library]
status: current
---

# You are Session 541

Your moniker is **SkyBlatusoff**. Sam, at sign-off: *"let's move back to our galaxy exploration session naming
practices--SkyBlatusoff"*. Name the sessions after it the galaxy-exploration way, no more berries. S540 was the routine's 14:12Z
firing; Sam joined live and drove most of it. **Full checkpoint**, written at the context WARN (about 92k left). It
skipped `README.md`, `kb/README.md` and the pipeline view; nothing they describe moved.

## Open work, in order

0. **The cpl-chat deploy Sam approved ("deploy all", ~14:55Z).** PR **#2647** (matched instructions) waits on
   `test` after a timing-log guard fix. When green: squash-merge, then dispatch `cpl-chat-deploy.yml` on `main` with
   confirm `DEPLOY`; it carries handoff 530's three held changes too. The preview A/B regressed smoke 7v twice on the
   first design (one shared word matched the Cabrillo noncredit rule); with two shared words required it passed
   (run 41321479920, modes 7v,7l). Read the deploy's own smoke job, then delete nothing; the preview slug is cleaned.
1. **PR #2645** (Sierra training opens the current Sierra in the side panel) and **PR #2648** (the Exhibits List
   view): merge each on a passing `test` on its current head; main moves under them, so merge `origin/main` and run
   `python3 kb/_build_dependency_map.py` if lints say stale. **CPLBrain #593** (Sheet 152/153 builder, session note,
   braindump) merges after.
2. **Sam's next asks on the List view** (his words in `docs/cer_v2_redesign_lessons.md`, *The List view*):
   - the search bar finds a credential by **college, district, SWP region or ASCCC region** (college is in
     `articulations[].local[].colleges`; district and regions need the college identity file joined);
   - **find and replace with a preview** (mocked at https://claude.ai/artifact/Qqcfxd9xkzdg91rkw6275A, bottom);
   - **keep the mock going at the same link** (Sam: "Hopefully, SkyBlatusoff will be able to publish the mock so we can
     keep working on it"): its source is `docs/visuals/2026-11-01-exhibits-list-mockup.html` (on #2648's branch until it
     merges). Publish with the Artifact tool, `url: https://claude.ai/artifact/Qqcfxd9xkzdg91rkw6275A`, after one
     `action: "read"` of that URL. The mock lags the real view: mirror selection, flags, drill-downs, Confidence and
     custom sort (Shift and a header press) into it first.
3. **Scheduled-sessions step 9, the re-analysis pass** (new today): read `_EXHIBIT_REANALYSIS::` rows with Sam's
   comments; code checks first; the Jev runner job and the findings panel are the next builds.
4. **The contacts harvest, each night** (step 8). 121 people after S540 (fourth read 41 + the five Equity titles,
   counted on Sheet 153). Coalinga's `unsettled_campus` still waits for West Hills Lemoore's own page.
5. **Monterey Peninsula's 14**, unchanged (coverage 42989, 43858, 44876 first).
6. **Carryover:** the Exhibits tab hides a decided card only for the visit (make it read the live rows); Accept's
   email (Sheet 146 card 3); Sierra's first-text latency; the college short-name editor; the lints' checkout time.

## What shipped or ran this session

- **#2643 merged:** the Library's SharePoint note; the two summit refresh notes cleared (MCP after a 502); the fourth
  contacts read; Sheet 153 rulings in the lanes; CI made hermetic (`cer_procedures_test`) and the Commons builder
  leaves out a zero issue (a 14:34Z bot push to main had broken both for every PR).
- **Open Asks Sheet 153** (https://claude.ai/artifact/RjwgkgeczU7wDS9YDZN6Js), answered 14:41Z: 1 overnight, 2 count,
  3 deploy. No sheet is open.
- **Pages** dispatched by hand for the 14:34Z CER run (bot pushes start no Pages deploy): Sam's 18 Exhibits saves had
  landed; only the served queue was stale.

## Lessons to honor

- **A bot push to main can break every PR's lints without a CI run of its own.** Fetch main before calling a PR
  failure yours.
- **One shared word is not a match** for instruction routing; the A/B caught it.
- **The a11y seed waits for the control it clicks.**

## Let go

No PR subscription, no check-in. The artifacts have no watch (remote sessions cannot). The routine fires next at
06:12Z on 2026-11-02.
