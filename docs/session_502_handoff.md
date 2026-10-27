---
title: "Session 502 handoff: Sierra without a header or a picker, links on every reference; Sheet 136 answered; the funding review gate half built"
date: 2026-10-27
session: 500 (SkyLingonberry, Sam's session beside the queue routine's SkyBlackberry)
tags: [handoff, sierra-page-redesign, implementation-funding, funding-public]
status: current
---

# You are Session 502

Your moniker is **SkyHuckleberry**. Two sessions ran as Session 500 on 2026-10-27: the CPL Queue routine
(**SkyBlackberry**, ~13:56Z to ~15:30Z, handoff 501 on #2510) and Sam's own session (**SkyLingonberry**, ~13:27Z on,
this file). Read both: this file, then `docs/session_501_handoff.md`. ⚠️ 501's *"Sheet 135 still unanswered"* is
stale: Sam answered its card on [Open Asks Sheet 136](https://claude.ai/artifact/JLNSJm65Z9s3SMmbJxE3Cm) (14:03Z,
reread, infer, keep), and #2499 is no longer held. This checkpoint was **light** (context at 108K): skipped
`kb/README.md`, `README.md`, the Pipeline tab and the `kb/status` run logs (none moved); no KB note crossed the bar.

**The 7th Annual CPL Summit is Friday 2026-10-30.** Nothing on the public funding page may regress before then.

## Decisions Sam made (all in `cpl_memory`, verified_by Sam)

- `sam-sierra-tweaks-2026-10-27`: no header row on Sierra's page; links embedded for every reference; Suggest wording
  always writes the full URL. Sheet 136: card 2 **infer** (no audience picker; she reads the asker), card 3 **keep**
  Ask, card 1 **reread** scenes 5 to 7 (`sam-sheet-136-rulings-2026-10-27`).
- The public funding page's requests (participation confirmation and the noncredit attestation, its only two public
  writes) wait for a MAP team reviewer: a **college or district email domain check** at submit, then a reviewer
  **accepts or denies**; acceptance confirms and sends the confirmation email. Reviewers sign in by **magic link**
  (`is_allowed_reviewer()`, already wired for update and delete), not the team phrase. **Before Friday.**
  (`sam-funding-public-domain-check-csm-accept-2026-10-27`, `sam-funding-public-review-magic-link-2026-10-27`,
  `sam-funding-public-review-rulings-2026-10-27`.)

## Open work, in order

0. **Hide the public funding page's My Institution view, keep its code (Sam, ruled ~15:25Z; `cpl_memory`
   `sam-funding-hide-my-institution-ruled-2026-10-27`):** *"OK, let's hide the My Institution and save the code ... Later,
   when the My College or CPL Pathways pages are better settled, we can throw on a link to either on the dash college
   row."* Sam, minutes later: *"Hiding will mean hiding the Step 1 and 2 at the top and any other link to it."* So the switch hides the page's Step 1 and Step 2 at the top as well as the view, and every link that opens it. One shared public dashboard. The view lives in `cpl_funding.js` (`oneCollegeView()`, `VIEW_ITEMS` near line
   14443): take its entry off the menu behind a switch, and land any link that asks for it (CPL Pathways, My College)
   on the main dashboard with that institution's row open. Before Friday, with the review gate (item 5); the
   `funding-model-mycpl` a11y target and its tests follow the switch.
1. **#2511** (Sierra: no header, links, infer; carries #2512's fix and the check floor). Merge on a passing `test`,
   then dispatch `cpl-chat-deploy.yml` (LINK_RULE, READER_RULE) and `cpl-chat-smoke.yml`. The smoke has been red on
   main since run 380 for older modes; mode 17 passes; read the new answers for links and plain student wording.
2. **CPLBrain#514**: re-run its `coverage` after #2511 merges (it reads the tracker's main), then merge.
3. **#2512** (the Activity filters' aria-labels in `college_activity_template.html`): merge on `test`; whichever of it
   and #2511 lands second carries the same lines.
4. **#2499** (the narrated cut, Draft 4, 2:52, linked beside the music film; pushed by this session's agent): merge on
   `test`. It and #2511 both edit the implementation-funding lane's narrated-cut line: keep #2499's done wording. Its
   agent also changed test a3 (the Contents link the narrated cut, under Sheet 136 card 1's "offer it beside the music
   film") and rendered with `CHROME=/opt/pw-browsers/chromium-1243/...` (README notes it).
5. **The funding review gate, before Friday**, branch `claude/funding-request-review` (pushed, no PR). The database
   half is written and dry-run on live contacts, **not applied**: `kb/migrations/2026-10-27_s500_funding_request_review.sql`
   (map table from `kb/_build_funding_college_map.js`, `cpl_funding_email_domains()`, `cpl_funding_email_domain_ok()`,
   the check on `cfp_insert_self` and `cna_insert_self`). Still to build in `cpl_funding.js`: count only `confirmed`
   rows (`loadEligibility` and the derive path near `o.optinRow`, `_localOptinStatus`, `ncAttestStanding`), show a
   pending request on the Minimum Conditions line and hide the forms while one waits, the thank-you and notes in the new
   flow, the domain hint from the RPC, Accept and Deny for a reviewer on the line, the CO review lane and
   `ncAttestCtlHtml` (Accept = confirm, then a mailto to the submitter cc the CPL coordinator, with "If you did not send
   this request, please reply"; Deny = remove), the new data attributes in `CURATE_ATTRS` and both binding places. Then
   tests (several pin attest-first text), `npm run a11y -- funding-public funding-model funding-model-mycpl`, the
   governance surface map, the lane; apply the migration; open the PR; merge.
6. **The piano score** (Sam's S490 ask). Built and pushed: `claude/funding-film-piano` at fb378c6e (no PR; the source
   and the README's score paragraph only). Piano in place of the string pad, pizzicato, bell and melody lines, a piano
   left hand in place of the contrabass; horns, drums and effects identical (701 events); the loudness climb holds.
   `offline()` now builds the score in 2 s slices (76 s render, from 751 s). The 46 s samples went to Sam at ~15:35Z.
   **On his approval:** open the PR, rebuild the pages, re-render the music film and the narrated cut (after #2499
   merges). On a no: leave the branch.
   **Sam heard it (~15:45Z): no.** *"The piano is too obviously electronic--like a childs play piano. Any way to get a
   realistic sound with rich chords?"* Next: a recorded piano in place of the synthesized one: the Salamander Grand
   Piano samples (Alexander Holm, CC BY 3.0; credit it in the closing), a few notes per octave committed under
   `prototype/funding_video/assets/piano/` and played through WebAudio, with fuller voicings (open spread chords,
   octave bass, sustain pedal). `tonejs.github.io` is refused by this environment's proxy; try the samples' GitHub
   source through the git proxy. Send Sam a new 46 s sample before any re-render.
7. **Friday morning:** handoff 496 and 500's a11y list on main.

## Lessons to honor

- **Read a test's exit code, not its text.** A loop that grepped for `FAIL` missed two files that print failures
  another way; CI caught them. And the runner keeps a per-file check floor (`tests/check_floor.json`): removing checks
  on purpose means lowering that file's floor in the same change.
- **The daily run rebuilds the Activity section from `college_activity_template.html`.** A fix made in the HTMLs alone
  lasts until the next cron (#2495's aria-labels, wiped by b28e2886).
- **Two sessions numbered 500.** Agree one writer per file: the routine owns `session_501`; this file is 502.

## Let go

S500 SkyLingonberry signed off at ~15:25Z with 59K context left: it dropped its subscriptions to #2511, #2499 and
CPLBrain#514 and its watch on Sheet 136 (#2512 merged at 15:17Z). #2511 and #2499 were re-running CI (main merged into
#2499 at 1ec29fd87); merge each on a passing `test`. The piano agent may still finish in that container; its branch was
never pushed.
