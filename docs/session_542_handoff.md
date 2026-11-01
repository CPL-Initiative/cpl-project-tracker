---
title: "Session 542 handoff: the Exhibits List grows, the cert link (ASE first), the credential harvest moves into the queue"
date: 2026-11-01
session: 541 (SkyBlatusoff, Sam's session, live from about 16:00Z)
tags: [handoff, exhibits, exhibits-list, cert-link, credential-registry, scheduled-sessions]
status: current
---

# You are Session 542

Your moniker is **SkyTriangulum**, a galaxy name, as Sam asked at S540's sign-off (*"let's move back to our galaxy
exploration session naming practices"*). S541 ran a **full checkpoint** (two new KB generators). The Pipeline tab
did not move, so it was skipped. No PR is open; everything is on `main`.

## What shipped (all merged on a passing `test`)

- **#2645** Sierra training opens the current Sierra in the side panel. **#2647** matched instructions; the
  **cpl-chat deploy** Sam approved ran green, smoke included (run 41325193799), with handoff 530's three held changes.
- **#2648** the Exhibits List view (S540's build).
- **#2649** the List finds a credential by college, district, SWP region or ASCCC area (`college_lookup.js`), and
  **find and replace** previews every change with a check per row, saves the checked ones, and undoes for the visit.
- **#2650** **AI sort** (`kb/_build_exhibits_ai_sort.py`, daily): like with like, groups A to Z, 384 groups hold 2,071
  of 2,663; 22 spelling twins carry a **suggested fold**; **Edit every row**; columns resize on a phone.
- **#2651** accepted folds stay improvable (**Re-point** along a fold chain, *Folds waiting for the apply*); a **Basis**
  column, *Based on statewide* (152) or *Local only* (2,511); drawers keyed by column name (they had drifted a place).
- **#2652** the **exhibit-to-cert link** (`kb/_build_exhibit_cert_links.py`, daily): the industry catalog
  (`kb/it_ai_credential_catalog.json`, 7,335 credentials) is the cert table; ASE first, 59 titles to 24 certs.
- **#2653** the credential harvest is **step 10 of the CPL queue**, nightly; the Monday routine
  `trig_019tTcardPfntFz6ctWU9Jg1` is **disabled** (history kept).
- CPLBrain **#593** (S540's Sheet 152/153 builder and note) merged.

## Read in order

1. `docs/cer_v2_redesign_lessons.md`, *The List view grows, a cert table found, the harvest moves (S541)*: Sam's words.
2. `docs/reference/lanes/cer-procedures.md` (the List view line) and `docs/reference/scheduled_sessions.md` step 10.
3. `docs/kb-notes/reference-authoritative-statewide-exhibit-signal.md`, the 84-of-152 section.

## Open work, in order

1. **Step 10's first night.** The queue runs `credential_watch_agent.md` tonight: 7 issuers, a new `_issuers_read`
   date each, then the catalog, the report and the cert link. Read its count in the night's handoff.
2. **The cert link's next families:** AP, CLEP and IB from the official-name tables (`kb/_ap_official_titles.py` and its
   CLEP and IB twins); then the unresolved names (SP/2 HD, Snap-on 604, MACS/609, Cummins ISX, G1, Master Automobile
   Technician, xEV); the catalog's three doubled ASE codes (A4, S5, H8) go to the watch.
3. **The reference's statewide flag** reads articulation lines (84) where MAP's CCC exhibit rows say 152. No funding
   or ESS code reads it (checked); fix the export in `excel_to_dashboard.py` to read the exhibit rows, code only.
4. **Offered to Sam, no answer yet:** tier 2 suggested titles (a Claude pass grouping by meaning, CPR beside BLS); a
   Dismiss that lasts past the visit; the MAP team searching the cert list on MAP's Opportunities page (his team's call).
5. **Carryover from 541:** step 9's Jev runner and findings panel; the contacts harvest nightly (121 people after
   S540); Monterey Peninsula's 14 (coverage 42989, 43858, 44876 first); the Exhibits tab hides a decided card only for
   the visit; Accept's email (Sheet 146 card 3); Sierra's first-text latency; the college short-name editor.

## The List preview

https://claude.ai/artifact/Qqcfxd9xkzdg91rkw6275A (version 11) runs the real `exhibits.js`:
`python3 scripts/build_exhibits_list_preview.py <scratch>/exhibits_list_preview.html`, one `action: "read"` of the URL,
then publish the file there. Saves stay in the page. Rebuild it after any List change Sam will look at.

## Lessons to honor

- **Look before building a table.** Sam asked *"Maybe we already have it?"*; the cert table existed as the catalog.
- **Check a memory row's claim against the code before it reaches Sam.** An October row said the ESS check read the
  statewide flag; it does not, and S541 told Sam otherwise before checking.
- **Key UI behavior by name, never position.** A column inserted later shifted every drawer after it.

## Let go

No PR subscription and no check-in. The List artifact holds the Artifact tool's comment and republish watch for this
session; it lapses with the session. The CPL queue fires next at 06:12Z on 2026-11-02.
