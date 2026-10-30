---
title: "Session 519 handoff: the Library's slides beside their items, funding on a phone, the FAQ in groups and Sierra reading it"
date: 2026-10-29
session: 518 (SkyServiceberry, Sam's session)
tags: [handoff, library, remediation, funding, sierra, faq]
status: current
superseded: true
superseded_by: session_522_handoff.md
---

# You are Session 519

Your moniker is **SkyCloudberry**. Session 518 (SkyServiceberry) ran with Sam on 2026-10-29, the day before the 7th
Annual CPL Summit (Friday 2026-10-30). It was a **light** checkpoint, written at context WARN (about 108,000 tokens
left), then amended at CONTEXT EMERGENCY (about 46,000 left) for #2559's red shard: no lane changed state and the run wrote no re-mint or data receipt. Skipped: KB notes (nothing crossed the bar),
the pipeline tab (it did not move), `kb/README.md` and `README.md` (no structure or surface change they describe).

## What shipped

- **#2556 (merged):** every remediation item that names a slide draws it beside the item (a crowded slide numbered in
  reading order); a slide's empty boxes (no words, fill or outline) removed; the empty title box kept and drafted.
- **#2557 (merged):** a title box for every slide that has none, drafted and kept just off the slide; the dropped-deck
  notes question (keep, Claude's script below, or in their place) and `slide-script-draft` (new edge function, deployed
  v1, reads no table and writes nothing); slides numbered in `presentation.xml`'s order (a reordered deck had been
  numbered by file name).
- **#2558 (merged):** the funding page links one video, the narrated film, as `n2.html?full=1`, opening filling the
  window; the film row Play, Full screen and *Back to the CPL funding page*; the film and training pages Light; the
  header lighter and shorter on a phone; the tab's scenario row no longer 288px tall on a phone.
- **#2559 (open at this checkpoint):** the funding FAQ in six groups (headings and group links on the page and tab);
  `funding-model/faq.json`; Sierra's FUNDING FAQ BLOCK.

## Sam's decisions this run (all in `cpl_memory`, verified by him)

`sam-remediation-slides-beside-items-2026-10-29`, `sam-remediation-removes-empty-boxes-2026-10-29` (he asked "why not
just also delete empty title boxes?" and took the answer: keep it, draft it, "good! draft title will help"),
`sam-remediation-title-boxes-and-notes-2026-10-29`, `sam-funding-phone-asks-2026-10-29` (COBI keeps following the
phone's dark mode, his "makes sense"), `sam-funding-faq-groups-and-sierra-2026-10-29`.

## Open work, in order

0. **⭐ FIRST, before the Summit: the CSM team's funding test fixes** (Sam, 2026-10-29 ~18:05Z, with four
   screenshots: *"CSM team came through with all the testing fixes above"*). His list, verbatim:
   1. *"Statewide Curr total is 0 but should add everything in curr college rows"* (the Funding Dashboard's Statewide
      row reads $0 under Curr Funds while the rows carry figures).
   2. *"public college totals are wrong for curr. they are correct on internal view. Unit sources link on public view
      is not showing up"* (Cabrillo: public $149,000 and $66,000 per credit priority; internal $149,426 and $65,545;
      the public view rounds or caps differently and drops the *Unit sources* link).
   3. *"CSM team suggests changing Curr to 'Funds Qualified So Far' and I think it would avoid confusion. advise"*
      (S518 advised yes: it says what the figure is in the funding vocabulary, where a college qualifies for its
      award; carry it to every header, hover, the Excel download and the memo, the word in prose only).
   4. *"Canada College should be Cañada College with tilde"*.
   5. *"add period on 'Mt.' San Antonio"*.
   6. *"take of College on the following: Coalinga, Norco, Imperial Valley, Reedley"* (the table's short names).
   7. *"Link led to error."* (the Sources line's *CCCCO MIS DataMart, Annual FTES Summary* link answers HTTP 404 at
      datamart.cccco.edu/Outcomes/FTES_Summary.aspx; find its current address).
   8. *"When search used for college, no way to clear it"* (the dashboard's search box needs a clear control).
   Proceed on the recommendations; each is reversible. Run `npm run a11y -- funding-model funding-model-mycpl`
   before shipping (a public view).

1. **#2559 is RED, uninvestigated:** `suite (4)` failed on head `b6ca5a7` (the checkpoint commit; job
   123637356237, run 40927187438). The commit before it (`8ec06f3`, the FAQ code) completed its checks; find the failing
   test in the job log, root-cause it (likely a docs or generated-file guard the checkpoint's lane moves tripped, or a
   test reading `docs/session_*` or `faq.json`), fix, push. S518 hit CONTEXT EMERGENCY here and released the PR's
   subscription and check-in: this session owns #2559 now. Then merge on a green `test`; then wait for Pages to publish
   `https://cpl-initiative.github.io/cpl-project-tracker/funding-model/faq.json`; then dispatch `cpl-chat-deploy.yml`
   (confirm `DEPLOY`, function `cpl-chat`) and ask Sierra one FAQ question (*"How does my college confirm
   participation?"*): she should give the FAQ's answer and link `funding-model/#questions`. A check-in
   (`trig_01E7YKrgidHV1eipzKmPCck3`, 18:48Z) covers the merge if the session goes quiet.
2. **Sam's call, waiting:** an address without github.io. Quick: a map.rccd.edu forwarding address (Malone, ITPI).
   Lasting: a custom domain (one DNS record from RCCD or CO IT, one Pages setting; the team phrase entered once more).
   Put it on a decision sheet if he does not answer in chat.
3. **Sam's first real deck with the new remediation:** the first live calls of `slide-script-draft`; if a script comes
   back blank or reads wrong, the function's `INSTRUCTIONS` and the page's `draftScript` are the two places to look.
4. Carryover from handoff 518: Glendale's course units (harvest NEXT); Library NEXT (the inputs the bar shows people
   doing most, in that order; a chart's `c:dLbl` colors when he asks); handoff 509's small asks; the MAP-link sweep.

## Read first

`docs/library_lessons.md` (the three S518 sections), `prototype/funding_video/README.md` (*The page on a phone*),
`docs/cpl_assistant_lessons.md` (*Moved from the lane (S518)*), `docs/reference/lanes/implementation-funding.md`.

## Lessons to honor

- **`pkill -f <pattern>` kills its own shell** when the pattern sits in the same command line (exit 144, twice).
  Kill by port (`lsof -t -i:<port>`) or run it alone.
- **Never type a merge SHA by hand:** `git rev-parse HEAD` first (one 409 this run).
- **Scenario 1's film pages (`s1`, `n1`) predate the Veteran Star:** rebuilding them under today's source moves their
  picture, and their committed figures are not reproducible. They are linked from nowhere; leave them.
- **COBI routes on the address's `#`:** an in-page anchor inside a tab needs a click handler that scrolls in place.
- **A flex basis in a column is a height:** the funding strip's `flex: 1 1 18rem` stood 288px tall on a phone.
- Heavy funding suites (`cpl_funding_calm`, about three minutes) outrun a 120-second local limit; CI's shards are
  the authority.

## Let go

At this checkpoint the session holds the #2559 subscription and check-in `trig_01E7YKrgidHV1eipzKmPCck3`. At sign-off,
drop both if #2559 has merged and Sierra is deployed; otherwise this handoff's item 1 is the next session's.
