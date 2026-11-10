---
title: "CER procedures and the simpler CER tab — lane state"
created: 2026-10-18
updated: 2026-11-10
tags: [reference, roadmap-lane, cer, exhibit-canonicalization]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference/lanes
related:
  - "[[CLAUDE]]"
---

# CER procedures and the simpler CER tab

**What this lane is:** the Common Exhibit Reference (COBI's *Common Exhibit Reference* tab, `credential_reference.js`)
run on procedures. Sam adds a rule in plain words; the nightly run applies the rules, then the classifier
(`kb/classify_exhibits.py`, which reads the exhibit-canonicalization skill as its system prompt) settles the rest; Sam
sees only the exceptions. Sam, 2026-10-18 ~02:55Z (vault braindump
`braindump-2026-10-18-0300-cer-procedures-automate-curation`): *"I want to be able to add more procedures to have you
classify and complete common exhibit titles and elements as we go. I don't have enough time to curate the growing list
and want to further automate so curation is manageable."*

**The classifier answered nothing from 2026-11-07 to the merge of #2925 (S604).** Every call came back HTTP 413: the
house families pushed the standing rules to 251,866 characters against `cer-classify`'s `MAX_RULES` 250,000. #2925 lists
the families under their issuer over a 240,000 budget (lossless, ~165,600), drops far families only as a last resort,
and stops the run rather than send a refused call. COBIx asked for a replay: the first trim kept every family line but
stripped the issuer from 156 of 1,115 saved joined answers; the grouping keeps all 1,115 (`tests/cer_classifier_rules_size_test.py`).
Read the next nightly report's `classifier_run.answered` and `errors` after it lands. Also #2924: the procedures report
`kb/cer_procedures_out/latest.json` is served by Pages again (it 404'd for Exhibits, the CER tab and the progress).

## The redesign (2026-10-30, side session beside S531)

Sam, 2026-10-30: *"Have a good look at the current CER and notice how crowded it is and not intuitive to navigate. It is
now part of our Catalog Commons overall project and I want you to help me make it much more manageable and simple."*
Design record: mock-up https://claude.ai/artifact/6fTBpjkrGseEb7h3gaPnSM (version 26), source
`docs/visuals/2026-10-30-cer-exhibits-redesign-mockup.html` (#2595, merged). Built so far: the high school and ROP
rule and the CPL-AI dialog (#2601); the Exhibits tab's Review queue (SkyRowanberry, 2026-10-31, below). What Sam ruled in the
mock-up, each his words in the lessons doc (`docs/cer_v2_redesign_lessons.md`, 2026-10-30):

**The List view** (S540, S541; live): its record moved verbatim to `docs/library_lessons.md` (*Moved from the lane, SkyFern*).

**Re-analysis, first run (S626, 2026-11-10).** Sam's press of 2026-11-09 12:39Z (no comments) ran the code checks alone (`kb/_exhibit_reanalysis_checks.py`; findings `kb/exhibits_reanalysis/2026-11-10.json`; done row under `exhibit-reanalysis-s626@bot`). **RULED and done (Sam, Open Asks Sheet 180 card 3, 19:35Z 2026-11-10: long):** Wildland Fire-Basics' issuer now reads *California State Fire Training (SFT)*, as the other 110 credentials do (guarded update of his one row, cohort `exhibit-reanalysis-s633@bot`; receipt `kb/receipts/kb_curation_wildland_issuer_2026-11-10_s633.json` restores his save). **The findings panel is built (S628 SkyDraco):** under the List view's re-analyze box, the last pass (`kb/exhibits_reanalysis/latest.json`) leads with what needs the sender's word, then folds the checks' counts and the routine's notes; `tests/exhibits_reanalysis_panel.test.js` guards it and fails a `latest.json` older than the newest dated file. **The Jev runner is built (S633):** `kb/_exhibit_reanalysis_jev.py` on `typesafe-smoke.yml` (input `reanalysis`, the findings file), the two questions only, no gate (none is measured for the exhibits), so each answer carries Jev's probability for Sam's word; guard `tests/exhibit_reanalysis_jev_test.py`. Its dry run over the first findings: 0 pairs (the checks flagged none), 13 issuers. **First sitting (S633, run 42873788079, 13 calls):** no pair to ask (the checks flagged none); of 13 issuers, five read as training sites, filed under `jev` in the findings and `latest.json`: Proctored Testing Center 0.90, California Specialized Training Institute (CSTI) 0.77, Graduate Level Institution of Higher Education 0.71, Johnson Controls Training Institute 0.71, Spaulding Marine Center 0.66. **RULED (Sam, Open Asks Sheet 180 card 6, 19:37Z 2026-11-10: two, "and go with your recommendation on the remaining 3"):** Proctored Testing Center and Graduate Level Institution of Higher Education describe a setting; CSTI, Johnson Controls Training Institute and Spaulding Marine Center stay as issuers. **DECIDED and done (S634, 2026-11-10):** 10-Key Data Entry's two exhibits are Modesto's own BIT 375 by credit by exam, so its issuer reads *California Community Colleges* alone (guarded update of the bot's row, cohort `exhibit-reanalysis-s634@bot`, and `kb/credentials.json`; receipt `kb/receipts/kb_curation_10key_issuer_2026-11-10_s634.json`). **DECIDED (S634):** the two Graduate Level credentials are Los Angeles Pierce's exhibits for a doctorate (*Clinical Psychology Ph.D.*, MAP 63381; *Psy.D.*, MAP 64857); the university that confers a doctorate issues it and MAP names none, so Sam's two rows stand until Pierce names one (a question for its CSM). Seen beside it: the Ph.D. exhibit sits under the credential *Clinical Counseling Laws and Ethics*, the name of one course it awards (ADDICST 004); the row is Sam's to move. `kb/_apply_credential_review.py` fills or appends an issuer and never removes one, so a changed override needs the reference edited with it (S634 did so for Wildland Fire-Basics' long form too). These five verdicts are the exhibits' first calibration set for the training-site question.

Sam's mock-up rulings, item by item, moved verbatim to `docs/cer_v2_redesign_lessons.md`, *Moved from the lane (SkyCloudberry)*.

**Sam's rulings, Open Asks Sheet 147** ([the sheet](https://claude.ai/artifact/XVNFzgxMW4mAiCC9YUsABB), completed 00:06Z 2026-10-31, all five his own call; cpl_memory `sam-sheet-147-rulings-2026-10-31`). Build in this order:

1. **One Exhibits tab** in the Catalog Commons replaces the CER and EACR; **Review is built first**. The two tabs stay until Exhibits carries everything they show.
2. **The high school and ROP rule — built (SkyGooseberry, 2026-10-31).** Detail moved verbatim to the lessons doc, *Moved from the lane (S541)*.
3. **The public adoption page lists settled credentials only** (a person's or a rule's stamp), so it grows as the CER finishes. Its name is still his to give; *Credentials Your College Can Adopt* holds the place.
4. **The page takes Malone's CPL/AI look**, beside the Library and Sierra (the mock-up's First Light was proposed and set aside).
5. **The CPL-AI matching in the Program Requirements dialog — built (SkyGooseberry, 2026-10-31).** Detail moved verbatim to the lessons doc, *Moved from the lane (S541)*.

**The Exhibits tab** (`#exhibits`, `exhibits.js`; built 2026-10-31 in #2602, #2603 and #2604, history in the lessons
doc's 2026-10-31 sections). *Review* draws mock-up v26's card per held title, the step tiles as filters and *Go to an
exhibit*; `#exhibits/held`, `/conflict` and `/credentials` open one place, read once per visit, and the Commons' CER row
links them (#2612). A List row's side panel (the Credentials view retired into it, 2026-11-03) sets the issuer and training
sites (each with its college), saved as `_CREDENTIAL_REVIEW::` rows; `resolve_sites` and `resolveSites` decide which
stands (`tests/credential_review_sites_test.py`); `field:kb_curation.training_sites_override` maps to DR-07. The panel
reads `kb/exhibits_adoption.json`: each college's lines and units, the course a could-adopt college already teaches,
the peer median. **Could adopt never reads the TOP and C-ID overlap** (Sam, 2026-09-24; Rule 7; KB note
`methodology-a-fold-carries-the-folded-tabs-rulings`). EACR's matrix, filters, exports and Create Handout live on the
public Credential Catalog. Not built: sites for a title new to the reference, and the *Held titles by group* table. **The review card (Sam, 2026-10-31, #2620):** Change to Proposed Title, Keep Current Title, Teach a rule, Back, Skip; the local title in bold. Back reopens this visit's cards, naming the save, and a new choice replaces it. *Accept all proposed titles (N)* asks first and leaves a conflict, or a title someone already saved, as it is.

- `kb/_build_exhibits_review.py` writes `kb/exhibits_review.json` and the lazy `kb/exhibits_review_courses.json` from the
  procedures run's `needs_you`, the `aligned` course, `statewide_data.js`, the identity members, the reference and the
  overlay's training sites; nightly at the end of `cer-procedures.yml` and daily. A title settled or saved since the
  run leaves the queue. First published 2026-10-31 02:12Z: 468 held (401, 36, 13, 18), 209 aligned.
- **Students:** `exhibit_title_students(p_keys, p_ids)` (`kb/migrations/2026-10-31_exhibit_title_students.sql`),
  distinct students per title, an allowed reviewer only, k=10 inside the function. Governance:
  `rpc:exhibit_title_students` dismissed, `tab:exhibits` mapped to DR-07.
- **The buttons** write the CER's own `_UNCLASSIFIED::<local title>` rows (title and issuer). A conflict's *Change to
  Proposed Title* with the reference's title clears the saved assignment; any other title on a conflict re-keys a
  person-reviewed entry and stays a session's change. *Teach a rule* copies the rule for a session.

**CPL-AI (SkyLantern, 2026-11-06; detail in `docs/library_lessons.md`).** Sam's words: host it all, frozen (*"make sure
we can host all the data, which for now will not have any further updates"*); join the 115; fix the seven titles; name
the pairs on the List; and *"I do want the CPL-AI recs on public view"* (answers Sheet 147 card 5). **State:**
`kb/cpl_ai/hosted/` holds all 33,232 pairs with full reports (`kb/_harvest_cpl_ai_reports.py`, `kb/_build_cpl_ai_hosted.py
--check`); `kb/cpl_ai/exhibit_join.json` (`kb/_build_cpl_ai_join.py --check`, a reason per call; a curator's correction
wins): 46 exact, 8 related, 61 none once tonight's fold lands. Exhibits shows them at `#exhibits/cpl-ai` and on each List
row (`#exhibits/list/cplai`, #2853). The seven title moves are written (`kb/cer_decisions_out/2026-11-06/`) and the nightly fold re-points the
five titles. **Sam's "1 yes, 2 yes" is applied (SkyBeacon, #2855):** the applier gained a guarded retire path (`retires`
in a plan: a named curator row goes only while it still holds that value from that reviewer; the receipt keeps it whole;
`--rollback` reinstates it); plan `kb/cer_decisions_out/2026-11-06-2/` retired his four spent 2026-10-27 Spanish 1 and 2
rows and confirmed the Wheel Alignment merge (receipt `applied_2026-11-06T21-24-44Z.json`: 1 written, 4 retired), and
`cred-rename-apply.yml` (run 42298978785) then folded ServSafe Food Protection Manager into its Certification title and
the two Wheel Alignment titles into one (2 confirmed merges, apply_safe). **The Catalog's badges and a college's first
view are live with the next daily run (SkyBeacon, #2856):** *Statewide recommendation* (152 credentials across every
credit status) and *CPL-AI course match* (43) on cards, the List's Recommended column and the panel; the Recommendations
filter; a single college pick opens on *Recommended credentials <college> could adopt* (no award there, an aligned course
there: the course mapped in MAP or CPL-AI's Strong evidence and Faculty interpretation courses), each with Request Quick
Adopt (42 for Allan Hancock); the panel's CPL-AI section with a college picker and the full recommendation read in place
from `kb/cpl_ai/hosted/shards/`. The builder writes `library/adopt/adopt_ai.json`, read after first paint. Sam's words: *"like badges on the credential"*; *"If you're Allan Hancock College and you open the cred catalog and
select Allan Hancock filter, you should immediately be presented with any statewide or AI recommended exhibits with
Request Adopt buttons on all their local aligned courses."* **The ask rule is live (#2854):** *Ask us to prioritize* only
where no college has articulated the credential, the *Worth a faculty review* cards included; an articulated one offers
Request Quick Adopt. **Add your credential is built (#2860; Sam: "yes, build the add your credential route"):** an empty search offers *Add it*; `credential_submission_add()` is INSERT-only; a reviewer Verifies, Merges, Declines or Reopens in Exhibits Requests; verified ones join the Catalog. DR-32, live 2026-11-06. **Seven triage titles corrected (Sam, Open Asks Sheet 164 card 4, 2026-11-07: *Correct all seven*; SkyBramble):** the four whole-college Credit by Exam exhibits return to *Credit by Exam*, and ECHT 144, 146 and 142 take *CompTIA A+*, *Network+* and *Server+* (`kb/cer_decisions_out/2026-11-07/plan.json`, cohort `exhibits-s596@bot`, guarded replaces of his rows; the fold's revise lane re-points them, *Plant Propagation* and *Water Supply* retire). His issuer rows stay as saved, so the fold names California Community Colleges an issuer of the three, as Security+ already shows from the same triage. **Ruled (Sam, Open Asks Sheet 167 card 1, 15:03Z 2026-11-07, his words):** *"it depends--if the credit is based on a course exam rather than the official CompTIA exam as certificate, then it is treated as Cx and the issuer is the college. If the credit is based on the certificate granted by passing the comptia administered exam, the issuer is comptia."* **Read (S602): all four are course exams; no row changes.** Each is El Camino's own course (*ECHT 144 — CompTIA A+ Computer Hardware Systems*) filed in MAP as Credit by Exam (63639 to 63642), so by his rule it is Cx, issuer the college, as the rows say. Should El Camino's page say the certificate stands in for the exam, the issuer becomes CompTIA. **Quick Adopt (2026-11-07):** a Strong evidence course in the panel, at a college without the award, offers Request Quick Adopt. Sierra's CPL-AI answers: live 2026-11-07 ([`sierra-retrieval-corpus`](sierra-retrieval-corpus.md)). **Next:** the Department of Insurance's license types (`data_sources`; the sandbox cannot reach the site).

**The Credential Catalog (built SkyTwinberry, 2026-10-31; Sheets 147 and 148).** `library/adopt/`, Pages-served, linked
from the Library and the public header; `kb/_build_adopt_page.py` writes `adopt_data.json` daily from
`kb/exhibits_adoption.json`, and **settled means a local title under the credential carries a review stamp**, a person's
or a cohort's. It offers both CSVs and Create Handout, writes nothing but the asks, remembers no filter, and `?college=`
follows the pick. Today's shape is the port below.
**The Credential Catalog, ported from the mock (SkyAerial, 2026-11-06; Sam: "I think it would make a good beginning for
our credential registry", then "let's roll with this"; the mock https://claude.ai/artifact/2r9apBWRRiaYS6CNqYy3Ds, eight
versions in one morning).** `library/adopt/` now runs the full width; three figure tiles beside the title open what they
count (1,260 earn credit at a college, 101 colleges award it, 7,389 not yet evaluated; the tile count is his call, "101 is
right") and **follow every filter but Credit status** (SkyLantern, Sam 2026-11-06: Computer and Information Sciences reads
68 · 44 · 997; with a college pick the first two count what earns credit there), and a tile keeps the filters when it opens; *Start with* names five kinds of learner; every filter is a multi-select picker (College with a district heading
only where a district has more than one college; Region under *Strong Workforce* and *ASCCC*; Field; *How credit is
given*; **Credit status**, Show folded into it); the list groups under field headers, the largest work fields first and
the exams (AP, IB, CLEP, DSST) last; a **List** view drills down (issuer searches, field and type filter, the count opens
the awarding table) **one line a credential** (SkyLantern, Sam 2026-11-06): Credit status is its own column, *Ask us to
prioritize* the last column on the right (its *Ask* and the asked count), a long cell ends in an ellipsis with the whole
text in its title, and the List scrolls in a box a screen tall that **lazy-loads** the next 72 as the reader nears its end
(the cards too, against the window; Show more stays only where the browser lacks IntersectionObserver). **Worth a faculty
review sits above the results**, its 28 cards in a box about two rows tall; the matrix's cells open a side panel (**A** marks a college
that could adopt; a column heading picks the college); the panel resizes from its left edge and the browser keeps the
width; the Library's eleven photos cycle with *Pause photos*; the intro says *many*, and no public string says a bare
MAP or CPL. **Credit status in public words, the Commons' curation words beside them:** Earns credit at a college
(Awarded somewhere, 1,260) · Earns credit here / Earns credit elsewhere, could be added here (the two college-relative
values, replacing Show) · Known to a college, no credit yet (In MAP, no articulation yet, 12) · Being reviewed (Held for
title review, 1,171) · Not yet evaluated (Harvested, no exhibit yet, 7,389, the nightly watch's
`kb/it_ai_credential_catalog.json`). Data: `kb/_build_adopt_page.py` also writes `adopt_more.json` (the other statuses,
read after the first paint); `kb/_build_adopt_align.py` writes `adopt_align.json`, the **analysis for faculty** (issuer
skill areas from `kb/reference/industry_credential_skills.json` against `public.course_outcomes`, an illustrative
word-overlap score labeled so; the Foundation and ASCCC method, or a TypeSafe Jev Score per skill area, replaces it; Jev
already runs the harvest, `tests/jev_harvest_test.py`). Both run daily. Tests `public_adopt` (91),
`adopt_align_build_test.py` (9), `adopt_page_build_test.py` (32); `npm run a11y -- public-adopt public-adopt-dark
public-adopt-matrix public-adopt-list` (the last two new). **Request an evaluation** ships with the routes that exist
today: the college route through *Find your college* and *Credit for Being You* (the portal is recorded as a Found data
source, `docs/reference/data_sources.md`), and a statewide line that says the list is being set up.

**RULED and built (Sam, Open Asks Sheet 162, 15:16Z 2026-11-06, his own call, in a note; built by SkyLoop the same
afternoon): the statewide route is a public request to prioritize review, never an evaluation promise.** His words:
*"Reframe it as a public request to prioritize review of a credential. The idea is that we could collect requests to help us
better prioritize our work without promising any one person that we would evaluate their credential--that would be left to
the discretion of local colleges."* The page's word is **Ask us to prioritize this credential** (the panel's heading, every
card's chip; *Ask us to prioritize* on a List row's 0); the panel's statewide paragraph says each request raises the
credential in the Initiative's order, that evaluation rests with a college's faculty, and that no reply is sent. The form
takes the credential (fixed), an optional college (prefilled from the pick) and an optional email, and posts to **one
INSERT-only SECURITY DEFINER function**, `credential_priority_request()`, which validates, bounds, drops a repeat from the
same email within a day, and returns the count; `credential_priority_counts()` is the one public read (credential and n,
nothing else) and paints the count beside the credential on its card, its List row and the panel's heading (the count is
the signal). The table `credential_priority_requests` has no public policy; the team reads rows behind the phrase or a
reviewer sign-in; nobody deletes. Migration `kb/migrations/2026-11-06_credential_priority_requests.sql` (+ rollback), applied
16:21Z by `supabase-migrate.yml` from `kb/migrations/.apply` (receipt `kb/receipts/migration_credential_priority_requests_42251263756.json`;
the MCP's apply had waited on a confirmation and timed out, Rule 10 c); read back live: anon executes the two functions and
holds no insert on the table, RLS on. Governance before shipping (Rule 10 a3): register row **DR-31**, `table:` and `rpc:credential_priority_request`
mapped to it, the counts read dismissed with its privacy reason; the dependency map regenerated. Tests: `public_adopt`
(81). **NEXT:** the Commons Exhibits List reads the rows as a queue item with its count (below).

**The Commons Exhibits List carries the same shape next (Sam, 2026-11-06: "make sure that any needed formatting or
functionality from this mock is also reflected if needed on the commons exhibits"; the Credential Catalog is the public
face of the Exhibits reference plus the harvested lane).** Already there: the resizable side panel, drill-downs, the
could-adopt courses behind a chip, Request Quick Adopt, the held and conflict queues, the industry lane, the SLO neighbor
hints, procedure requests, and (SkyLoop, 2026-11-06) **the public requests as the Requests view** (`#exhibits/requests`):
one line per credential, most asked first, the colleges named or *Statewide only*, emails counted and never shown, first
and last asked; the views row counts the asks still new and Progress lists them with *Read them*; the read goes behind the
phrase or a reviewer sign-in (`tests/exhibits_requests.test.js`, 19). **To add:** credit status as one band and filter
across all four classes (held, conflict and industry are separate lanes today); routing a request to a college or the
statewide list from its line (a status stamp, service role today); the analysis for faculty in the side panel; A for a
could-adopt cell wherever a matrix shows; the table shape with 0 carrying the action. Public only: Start with, the photos,
the portal hand-off.

Sheet 148's rulings (the Credential Catalog's name and links, the CER and EACR tabs retired) and Sheet 149's (fold, routine) are in the lessons doc.

**Rules (SkyBilberry, 2026-10-31; Sam: "a link to a view of all the rules used to suggest or fold exhibit titles", and
Sheet 149 card 2).** The tab's **Rules** view (`#exhibits/rules`, also from Another look's rule filter) lists every
procedure with its words, who set it and the last run's tallies, Another look's rules, and the rules sent to the routine.
Teach a rule's *Send to the routine* writes `_CER_PROCEDURE_REQUEST::<when>-<tag>` / `cer_procedure_request`; the CPL
queue routine (step 7 of `scheduled_sessions.md`) builds the procedure off (`request` names the row; an off rule's
lanes reach nobody), writes `cer_procedure_built` from `kb/_cer_procedures.py --try`, and applies *Turn on* or *Discard*
(`cer_procedure_switch`) at its next firing. DR-07 maps the three fields; the rows carry no student detail.
Guards: `tests/exhibits_rules.test.js`, `tests/cer_procedures_test.py`.

The AP fold (Sheet 149 card 1) applied on 2026-10-31; its receipts are in the lessons doc.

**IB and CLEP on the AP pattern (SkyInkberry and SkyTeaberry, 2026-11-01; Sam kept both, Sheet 150 cards 1 and 2)** moved verbatim to `docs/cer_v2_redesign_lessons.md` (*Moved from the lane, SkyBeacon, 2026-11-06*).

**NEXT:** (0) After each of Sam's runs through *Another look*, read the next fold's `credential_moves` and
`credential_retires` and move the panel rows they list (receipts `kb/receipts/credential_panel_move_*.json`; a row
that cannot fan in, or whose rename the fold carried out, stays under its old key, named in the receipt).
Sheet 161, applied 16:08Z 2026-11-03: lessons. (1) The Catalog's *Courses that may align*,
once a source names courses. (2) Training sites for a held title new to the reference, and the *Held titles by group*
table, only if Sam asks.
