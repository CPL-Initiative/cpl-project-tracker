---
title: CPL Project Tracker — Roadmap Archive, part 4
date: 2026-10-25
tags: [archive, roadmap, project-memory, session-history]
related:
  - docs/roadmap_archive.md (part 1, where new rotations land)
status: archive
---

# Roadmap Archive, part 4

The §11 narratives moved 2026-08-01 to 08-03 and the next batch, moved verbatim and in their original order from
[`roadmap_archive.md`](roadmap_archive.md) on 2026-10-25 (S474) so each file fits the 150 KB archive
budget. Parts 2 to 6 hold the body that sat between part 1's newest rotations at the top and its
2026-09-17-onward rotations at the bottom.

## Archived §11 session narratives — moved 2026-08-01 (Rule 8 budget: ≤2 inline)

Moved verbatim from `CLAUDE.md` §11. Every line in that file is context-tax on every
future session; these are kept here in full so nothing is lost.

### SkyQueue cont. — Implementation Funding: front-load earns the window, and the mask comes off (2026-07-31, #955/#956/#957 MERGED)

Three merges, one story. **#955** — the baked priority metrics had gone stale (the Excel workbook +
builder were RETIRED 2026-07-03, so **nothing keeps `cpl_funding_data.js`'s bake in sync with the live
Supabase config**; Year 1 overrides it so nothing looked wrong, but Year 2's three `null` slots fell back
to two-generation-old wording every `MEASURES` predicate reads as a gap). Synced + added a curator-only
**metric-wiring diagnostic** (`prioMetricSource`, "↩ inheriting baked default") + a guard test. **#956 —
front-load now EARNS the whole window against the Year-1 targets**, Sam's *"double the per-student amount,
not the students"* — built as a scope change, not a multiplier, via the new single seam `slotEntitlement` /
`prioCap` / `slotIsCarryover` (under EVEN it reduces exactly to the old formula; a test asserts **zero
sites** compute scope on their own). Targets deliberately unscaled, so the doubled rate falls out. That
also killed a **live** defect: front-load had earned each year on its OWN metrics and summed both into the
Yr-1 cell, so Year 2's three gap metrics paid every college a full ADVANCE for half the window — and both
live scenarios have front-load ON. **#957 — removing that advance exposed a months-old join bug**: Barstow
(`pe` 133) · Lassen (140) · Madera (43) · Southwestern (571) had never matched the MAP feed (`College` vs
`Community College`, in **both directions**) and dropped to $0. Fixed with a **collision-checked** stem
join (a stem reachable from two colleges is *dropped, not guessed*) + a `short_caps` fix that also closed
LA Southwest/Reedley/Norco/MiraCosta/Mt San Antonio. Tests: `cpl_funding` 591 · new **frontload 37** ·
new **metric_wiring 13** · `performance` 24; suite **177 green**; Chromium clean (phone h-overflow 50 is
pre-existing on main). Durable: **a default payout masks the data gap beneath it** —
`docs/kb-notes/methodology-a-default-payout-masks-the-gap-beneath-it.md`. Also: three prose/unit
contradictions (a hover calling the doubled cap "the statewide base rate") were caught by HAND review, not
the suite. Story: `docs/cpl_funding_lessons.md` · handoff `docs/cpl_funding_handoff.md`. **Still open: the
Budget consolidation** (single-source `one_time_2026_27` off the ledger — kills this drift class). Open with
Sam: the 9 colleges with genuinely no feed row now read $0. Side-lane — left `cpl_todos.json` + the numbered
handoff to the CCR mainline.

### SkyQueue — Implementation Funding: two mode toggles retired + the baseline funding gate (2026-07-30, #946/#947 MERGED)

Shipped 3 of SkyReconcile's queued 4 asks; **#3 (public college page) + the Budget consolidation stay open**.
**#946 — the Potential⇄Earned basis toggle RETIRED.** Sam's "it reads wrong" was right but the toggle was
innocent: two SCOPE mismatches hid under it — the P-cells render the viewed **year** while the front-load
"Yr 1" money column renders the whole **WINDOW**, and `earned_total` silently summed both years (dominated by
year-2 advances invisible in the year-1 cells). Fix = **coexistence**: every money cell stacks cap over earned
(the P-cell shape), front-load column relabeled **"Window (front-loaded)"**, and earned **splits 3 ways at the
source** — measured / advance / guaranteed — which surfaced that **~95% of a typical college's "earned" is a
provisional ADVANCE**. Targets deliberately NOT doubled under front-load (timing-only by design). **#946 also —
the baseline gate** on Sam's 4 rulings: only the 2 baseline reqs gate · once cleared, cleared for the window ·
gate only the performance-earned main allocation (guaranteed rural + the cap untouched) · **held in reserve,
never redistributed**. Fails open; a gated cell reads `withheld · $X held`, **never a bare $0** (that would
claim the college posted no CPL). **#947 — "Group by district"** replaced the Colleges|Districts toggle (which
*replaced* the college rows); grouping only ADDS subtotal headers, groups ordered by subtotal, colleges sorted
within — deleted the stranded `COLS_DISTRICT`/`districtRowHtml`/`districtDetailHtml`/`districts()`. Tests
531→**552**; suite 174 green; Chromium clean. Durable: **when a mode toggle "reads wrong," suspect the scopes
it separates, not its logic** — `docs/kb-notes/methodology-retire-a-mode-toggle-by-coexistence.md`. Story:
`docs/cpl_funding_lessons.md` · handoff `docs/cpl_funding_handoff.md`. Side-lane — left `cpl_todos.json` + the
numbered handoff to the CCR mainline.

### SkyElemental side-lane — COBI Element Map refresh + the single-source workplan title/description editor (2026-07-27, #900/#902 MERGED)

Two merged PRs. **#900** refreshed the stale **COBI Element Map** (`Dashboard_Element_Map.html`,
the 🔧 button on Activities): Excel→**Supabase** everywhere (new `tag-supabase`/`supa-ref`
chips), Section 2 rewritten to the current 4-Activity/32-sub structure + the real
`apply_live_activity_current()` priority, a read-only callout (edits happen via the signed-in
editors), the one honest Excel carve-out (budget Key Factors) flagged. Hand-maintained static
file, Pages-served. **#902** made the **Annual Workplan Goals tab the ONE place** to edit workplan
**titles + brief descriptions**: `workplan_goals.js` gained `startDescEdit`(→`projects.description`),
`startActivityTitleEdit`(→`workplan_goals.name`, keeps the "Activity N:" prefix),
`startActivityDescEdit`(→ new `workplan_goals.description` col) on a shared `inlineTextEditor`;
generator emits `activity_desc` store→`CPL_Data.js`; **de-hardcoded** the drifted Activity copies
in `raci.js`/`master_report.js`/`generate_reports.js` so a rename flows everywhere. **Adversarial
review earned its keep** — caught that the report generators keyed `ACTIVITY_DESC` by the short
`Activity N` id but looked it up with the *full* `projects.activity` label, so the de-hardcode was
dead (fixed + rename-flow test). **Workplan data cleanup** (curator-confirmed, live, receipt
`kb/supabase_workplan_goals_description.sql`): backfilled real primary links for the 10
association-less projects; purged the dissolved Activity 5 (+ 5.1/5.5 ghosts); deleted tabled
`5.1` AI-Ready California; retitled Activity 4 → "Coordinate CPL Sprints, Targeted Projects,
Professional Learning, and Strategic Partnerships". Two linking mechanisms clarified:
`projects.workplan_activity` (home + grouping-by-number) vs `workplan_activity_associations`
(N-to-N cross-links). Tests: new `workplan_goals_desc_editors` (22) + a `master_report` rename-flow
guard + `raci` mock fixed (4 activities). Story: `docs/workplan_single_source_editor_lessons.md` ·
`docs/workplan_single_source_editor_handoff.md`; KB notes
`methodology-single-source-of-truth-flows-via-snapshot`,
`reference-workplan-activity-project-linking-model`. Side-lane — **left `cpl_todos.json` + the
numbered handoff to the CCR mainline.** Deferred: retire dead `projects_editor.js`/projects-grid;
optionally show the sub-activity description on the Activities-tab cards.

**Cont. 2026-07-27 — reflect EVERY project + finish the #872 re-key (#905, #909 + a live 4.7→4.5.1
re-home).** **#905:** the Annual Goals table grouped rows by `activity_ids[0]` (smallest cross-link)
not the HOME Activity → repeated/interleaved headers (9 not 4); fixed to group by
`workplan_activity` + sort by (home, id). **#909 — the big finding:** the **#872 reorg re-keyed
`projects`/`item_raci`/`item_updates` but LEFT `workplan_goals` + `workplan_activity_associations`
on the OLD numbering** → 10 projects missing from Annual Goals + every Activity-4 row showing the
NEXT item's targets (off-by-one under the dissolved "4.1 Sprints" wrapper). Fix: applied the same
#872 crosswalk to `workplan_goals` (two-phase perm, receipt `kb/supabase_workplan_goals_rekey.sql`)
+ cleaned 10 orphan association rows + filled `3.1.4`; generator **Path A** — `annual_goals` now
iterates the `projects` set (ladder overlaid by id) so every project reflects and the two tabs
can't drift; blank-ladder rows read-only (gated on `has_ladder`), title/desc still editable; X.Y.Z
ids nest under their X.Y parent (Sam: 29 Palms subsidiary-but-a-card). A consumer trace confirmed
RACI/Fact Sheet/reports need no change (the re-key **auto-corrects** the reports' targets — they
read `projects[*].kpi_goal_*`). **4.7→4.5.1**: Legislative Advocacy re-homed under 4.5 (renumber =
re-parent). Descriptions: only `3.1.4` was empty (filled); the rest are curator-authored, kept.
Tests: `annual_goals_activity_grouping` (12) + `annual_goals_reflect_all_projects` (20). Durable:
**re-key EVERY project-keyed table** (`methodology-rekey-every-id-keyed-artifact`); **projects=tree,
workplan_goals=overlay** (`methodology-single-source-of-truth-flows-via-snapshot`). Story in the
lessons/handoff docs above.

### Sky10Men side-lane — 🧠 Memory tab polish + 🩺 MAP Data Quality register + license fix (2026-07-26, #894–#898 MERGED)

Picked up SkyKnow's live memory loop. **#894/#895:** the 📄 Report → non-techie **prose** +
short item **titles** + reader **`plain`** column + **✨ Autogenerate** on Add & Edit (cpl-chat
RAG draft, prefill-only; form fields via `querySelector`, never `form.title`). **#896:** the Memory
**curate lockout fix** — `cpl_memory` UPDATE RLS was reviewer-only, so team edits hit the PostgREST
zero-row trap → `checkWrite` read a 403 → phrase cleared → lockout; widened to reviewer-OR-team
(now the standing **`p8`** / KB-note rule for every team-curated table). **#897:** the new **🩺 MAP
Data Quality register** (Supabase `map_data_quality` + team-gated tab, Reference & Curation group,
seeded with Sam's 4 defects incl. the **USMC JST skill-level CR duplication**, `f8`/`o3`). **#898:**
**license** corrected (vestigial MIT © 2019 Zachary Rice → **CCCCO all-rights-reserved**). Queued
(`w3`/`w4`): auto-generate DQ findings from `View_StudentAggregatedValues` + a follow-up nudge.
Advice given (not built): Priority 1 → **Applied** credits (`TotalAppliedCreditsForCR` already in
the feed); repo-privacy levers (private ≠ private-data if Pages public; license/privatize/split).
Story: `docs/cobi_memory_tab_lessons.md` · `docs/cobi_memory_tab_handoff.md`. Side-lane — left
`cpl_todos.json` + the numbered handoff to the CCR mainline.

### SkyVid side-lane — CPL Student Portal "Credit for Being You" intro video: audio restoration + accessibility (2026-07-23)

Sam's "work some magic" on the new CPL Student Portal (creditforbeingyou.org) 1:51
intro video — accessibility, warmth, music, "cool & inviting, not salesy," + advise
CC-vs-Claude-Design. All done in-session with `ffmpeg`/`numpy`; **no repo code
touched**, deliverables handed to Sam directly (video binaries not committed).
**(1) Captions** — the auto-`.vtt` had real errors (CLAP→CLEP, CDL→CPL,
credit4Beingu→creditforbeingyou.org) + 11 run-on cues → rebuilt to **22 WCAG-clean
cues** (+`.srt` +transcript). **(2) Voice de-tinny** — *measured band energy +
spectrogram first* (Zoom HPF + 84 kbps AAC, hard 12 kHz brick-wall); restored
80–320 Hz body, tamed the presence edge, two-pass loudnorm to −16 LUFS; Sam picked
"Broadcast," then "warmer still." **(3) Music** — the exported cut had **NO music**
(silence-scan proved it: ~12 true-silent gaps); Sam's YouTube link **and** Demucs
model hosts were both proxy-blocked (403), so the bed was recovered from his
separate mixed export by **subtracting the clean VO stem** (`music = mix − 1.30·voice`,
lag-0, g from least-squares → 15–20 dB voice cancel), warm voice re-laid on top,
rebalanced **+7 dB with ducking**, + a 2 s end-card freeze & music **fade-out**.
Tool advice: CC = audio/caption/encode engine, Claude app = visual/motion
concepting, DaVinci Resolve = timeline. Story: `docs/cpl_portal_video_lessons.md`;
handoff `docs/cpl_portal_video_handoff.md`; KB notes
`methodology-recover-music-bed-by-voice-stem-subtraction`,
`methodology-warm-a-tinny-voiceover-measured-eq`; polish-plan artifact
(https://claude.ai/code/artifact/2222f015-6251-4e3a-87f5-9ebd950f1889). Side-lane —
left `cpl_todos.json` + the numbered handoff to the CCR mainline; did not write the
public KB.

### SkyVeil side-lane — Fact Sheet: per-section "Hide section" toggle (2026-07-23, #874–#876 MERGED, LIVE)

Sam is modeling Implementation Funding scenarios (they change the Fact Sheet's
current-allocations figures + budget table), so he wanted the **Funding** section
hidden "for now," then a **general** control: *"add a hide button to each section
in the curation view; if hidden, suppress it in the reporting functions."* Shipped:
**#874** hid Funding via a new `.fs-withheld` class (page + TOC link + Word-export
strip) — **key gotcha: `factsheet_word.js` un-hides `[hidden]` to flatten
collapsibles, so a `hidden` attribute would REAPPEAR in the export → use a stripped
class**; **#875** the general **🙈 Hide section** toggle (Curate mode, per
reorderable section) — reuses the box-hide plumbing: reserved `<sid>|__hidden`
override + marks the section **+ its TOC link** `.fs-ov-hidden` (the box-hide class
the Word export already strips + `@media print` already hides), so **report
suppression came for free**; **#876** un-hid Funding (byte-identical restore) so
Sam can test the toggle himself (he did — *"Hide function works great"*). New
`tests/factsheet_edit_section_hide.test.js` (24); suite **168 green**. Story:
`docs/fact_sheet_lessons.md` (SkyVeil); KB note
`methodology-hide-must-suppress-the-export.md`. Side-lane — left `cpl_todos.json`
+ the numbered handoff to the CCR mainline.

### SkyPlan + StarTeam side-lane — COBI Activities tab reorg (2026-07-22, ✅ MERGED #872, LIVE)

Realigned the Activities tab to the CPL Workplan: **4 Activities** (phantom "Activity 5"
dissolved), every project nested under its parent Activity, the separate Projects grid +
Workplan-Goals Projects table gone, Goal banners dropped (Path A), a cross-cutting
**◆ sprint** tag/filter; Veteran `4.1`(+`4.1.1` 29 Palms) & Apprenticeship `4.2` as slim
Activity-4 nodes, Statewide Adoption → `3.3`; clean renumber (A1:7 A2:4 A3:12 A4:9 + held-out
5.1). **SkyPlan** locked the taxonomy + shipped the spec; **StarTeam (SkyPlan-II)** built the
generator Option-B render (verified offline via a snapshot + local-rekey → render → Chromium
harness, locked by Sam), the consumers + ◆ sprint filter, aligned the report `ACTIVITY_DESC`
titles, and rewired **tabling** onto the nested cards (the `activityLayerIds()` immune gate
was dropped — it marked everything immune post-reorg; all sub-activities are now tableable).
The **live Supabase re-key** ran in Sam's hold — two-phase permutation + inline verification
gate, receipt/SQL `kb/activity_reorg_out/2026-07-21/` — then merged + regen-dispatched. Full
story: `docs/activity_reorg_lessons.md` · `docs/activity_reorg_handoff.md`; KB note
`methodology-adversarial-verify-crosswalk-before-live-rekey.md`. **⚠ One documented
follow-up:** the re-key missed the N-to-N `workplan_activity_associations` table (still holds
old ids + Activity-5 rows → stale "Activity 5" on the Workplan-Goals tab; main Activities tab
unaffected) — ready-to-run fix (both approaches) in the handoff. Side-lane — left
`cpl_todos.json` + the numbered handoff to the CCR mainline.

### StarBOG side-lane — CPL exec decks: BOG update + CBO budget-workshop slides (2026-07-20)

Sam needed two presentation deliverables. **(1) Board of Governors update deck** — 12 slides for his
15-min segment (theme: the 2026–27 CPL funding win, **$7M ongoing + $35M one-time**, supporting Vision
2030): cover · positioning · statewide KPIs (50,154 students · $326M saved · 102 active colleges) · the
funding win · **COBI 3 priorities** · CPL Portal soft-launch · My CPL Story · EMT video · Moreno Valley
EM B.S. pathway (illustrative) · partnerships · Fire/CSTI hand-off to Miramar · close, **speaker script
in every slide's notes** (`presentations/build_bog_deck.py`; also a private draft artifact; PR #808
opened → **Sam closed it**, took the file). **(2) CBO budget-workshop slides** — 3 slides on the $35M
one-time → COBI 3 priorities + guiding principles (amounts held per Sam), **filled natively into the CO
"2026 Annual Budget Workshop" template's CPL section** (slides 17–19): read `theme1.xml` for the CCC
brand (Source Sans Pro; navy `002F6D`/blue `0066BA`/gold `FFB600`), reused the content layout, set the
native title, drew shapes in the body band, reordered `sldId`s; validated + QA-rendered
(`build_cbo_slides.py`, `fill_template.py`). **Tooling:** installed `libreoffice-impress` + `poppler`
(not preinstalled); fallback = pptx→HTML + Chromium. New KB note
`playbook-building-cpl-executive-presentations.md`; lessons `docs/cpl_presentations_lessons.md`.
Side-lane — **left `cpl_todos.json` + the numbered handoff untouched**; **did not** write to the public KB.

### StarEmber side-lane — Fire & EMS CPL eligibility: statewide vs local (2026-07-20, read-only)

Sam's data ask: how many MAP students have eligible credit + how many credits for
**statewide** credit recommendations in **Fire / EMT / EMS / Wildlands / Paramedic**,
then the **local** ones too, then "drop into a filtered view." All answerable from the
committed CER rollup (`credential_reference_data.js`: `students_served` +
`eligible_credits` per credential; `statewide` flag = tier) joined to the statewide
category map — **no pipeline/code change, no live MAP fetch.** Answer (2026-07-20 pull):
statewide **27 creds · ~238 students · ~1,946 credits**; local **142 · ~251 · ~2,567**.
Two findings: (1) the locals visibly **mirror the statewide series** (colleges built on
them — local Fire out-counts statewide Fire); (2) **"statewide" has two divergent
definitions** — the CER flag = `has_ccc` (has a CCC-Collaborative *articulation*,
`export_credential_reference()` ~L6890/6909), which is **not** "on the statewide CPL
page," so **Paramedic License** (18 stu / 721.5 cr) reads *local* and swings the paramedic
split. Deliverable: a private **filtered-view artifact**
([link](https://claude.ai/code/artifact/36e7fb36-10a7-44a3-a631-d0ec591ccc4c)). Docs:
`docs/fire_ems_eligibility_lessons.md` · `docs/fire_ems_eligibility_handoff.md` · KB note
`methodology-area-eligibility-rollup-from-cer`. Side-lane — left `cpl_todos.json` + the
numbered handoff to the CCR mainline.

### SkyCIP side-lane — CIP Coder (Beta): the Review-tab UI redesign (2026-07-20, #850/#851 MERGED)

Sam co-designed the Review-tab look in a fast-feedback artifact
([final](https://claude.ai/code/artifact/4369b106-abe8-4149-abf6-571d325bf508)),
locked it ("obsessed with this new version"), then "get this into prod." Two merges:
**#850** the confidence-scoring rework (a title-match signal makes the same-title CIP
win its TOP; de-inflated ABSOLUTE confidence — obvious pick 80%, capped 95; crosswalk
stays primary, outside match a "worth a look" hint) and **#851 — the UI redesign PORT**:
the tool is now titled **"CIP Coder (Beta)"** (eyebrow +Academic Affairs, trimmed intro).
**Sticky College + Subject + count-tiles** — the college bar pins `top:0`; the tiles ride
their OWN list-sibling host (NOT the short summary host, or a sticky element unsticks the
moment its parent scrolls past) pinned at the college bar's **measured** height
(`syncStickyOffsets`, rAF+resize) → switch subjects/colleges without scrolling up. **White
row gutters over a faint list field** (`--cipx-row-sep`/`--cipx-rev-field`) so each inline
"why" note brackets with the course above; **expanded course = a "package"** (accent spine +
framed top + tint); a non-functional **"COCI Sync'd" destination tile** (dashed, count 0,
"In Development") so the tiles read as the pipeline **All → Review → Ready → COCI Sync'd**;
glyph-free mode tabs; Department → **Subject**; tiles centered; Manual tile hidden at 0.
226 CIP jsdom assertions / 166 files; real-Chromium Chaffey BIOL (light/dark/phone, 0
overflow/0 errors). **Held for a follow-up:** the prototype's %-in-box (the real `cipBox`
has more states). A post-merge GitHub Pages **503 outage** (not the code) left the site
stale — fixed by a fresh `workflow_dispatch` of `pages.yml` (NOT `rerun_failed_jobs`, which
duplicates the `github-pages` artifact → "Multiple artifacts" error; new playbook +
Troubleshooting entry). Full story: `docs/cip_crosswalk_lessons.md` ·
`docs/cip_crosswalk_handoff.md`. Side-lane — left `cpl_todos.json` + the numbered handoff untouched.

### StarBoard side-lane — dethroning TOP: from gatekeeper to last-in-line signal (2026-07-16, #799/#800 MERGED)

Sam: *"unburden our schema from the tyranny of TOP … it should not be used for
gatekeeping or primary determinations … a last-in-line signal that nudges edge
cases … fuzzy for search/filter."* A 4-agent audit (all 3 repos) found the doctrine
**~80% already built** (confidence/source ladder, TOP weighted 0.10, blanks-only
fills) — the gap was **wording + two real leaks**. **Blast radius: 24%** (17,059 of
71,076 disciplined rows reach `discipline` via a 0.4–0.5 TOP guess). **The leak:**
`_seed_canonical_subj4.py` let a TOP guess vote on + fold into the M-ID SUBJ4
identity, and `_row_audit.py` scored TOP-sourced `inferred-high` (= subject_map).
**PR A #799** — doctrine anchor (`methodology-top-is-a-last-in-line-signal`), §7
TOP caveat, ~8 prose passages softened, `_row_audit.py` TOP demoted →`inferred-low`,
`merge_flag`/`_overmerge_apply` fixes. **PR B #800** (Sam's *"gate identity, keep
display"* ruling) — shared predicate `kb/_top_gate.py`, seed excludes TOP rows from
the canonical-SUBJ4 vote (+`top_only`/`corroborated_voters`), read-only dry-run
`kb/top_gate_out/2026-07-16/`. **Headline: the gate changed 0 of 146 canonical
values** — corroborated rows already carry every anchor, so it's provably
non-disruptive. Deferred (Rule 7 dispatched): fold-apply enforcement; the tiny
`excel_to_dashboard.py` fallback-label; a curation-gated public-KB caveat. CIP
(fall-2026 cutover) is the systemic exit — same "corroborate, don't gate" posture.
Full story: `docs/top_dethroning_lessons.md` · `docs/top_dethroning_handoff.md`.
Side-lane — left `cpl_todos.json` + the numbered handoff to the CCR mainline.

### SkyNew side-lane — the CIP site: TOP↔CIP Crosswalk tab + suggest-to-curate (2026-07-14)

The CO is transitioning course/program coding **TOP→CIP fall 2026** (ESS 26-06).
ESS built a searchable Excel workbook to email to the field; Sam asked for a COBI
tab that **replaces** it. Shipped a **third COBI area — CIP** (beside CPL/C&I in
SkyFlyer's org layer: `cobi_orgs.js` `ORGS[]` +1, `?org=cip` → COBI ᶜᴵᴾ, tabs =
CIP Crosswalk + COCI Lookup) + the top-level **CIP Crosswalk tab** (`#cip-crosswalk`,
Reference & Curation group). `cip_crosswalk.js` (`window.CPL_CIP_CROSSWALK`, lazy,
scoped `.cipx`) searches/filters the crosswalk (**420 TOP · 2,325 CIP · 5,353
mappings**, normalized in `cip_crosswalk_data.js` from
`kb/reference/cip_searchable_260708.xlsx` via `kb/_build_cip_crosswalk.py`),
row-expands to CIP definition + 2020-CIP transition badges (New/Deleted/Moved) +
SOC occupations + provenance + the colleges-with-pairing list + a **"COCI courses
with TOP N"** deep-link (added TOP to the COCI search haystack). Faculty file
**suggested changes/notes** open/anon (Quick-Adopt pattern) → Supabase
`cip_crosswalk_suggestion` (anon INSERT-only, no public SELECT; queue read gated
by `is_allowed_reviewer() OR team_pass_ok()`; `kb/supabase_cip_crosswalk_suggestion.sql`,
MCP migration `cip_crosswalk_suggestion_intake` on Work Plan). **#771** added a
**transfer (C-ID) marker + filter** (CO prioritizes transfer first; COCI has no
CSU/UC-transferable flag, so C-ID presence is a labeled floor — `top[code].cid/crs`
rolled up from `coci_course_list.xlsx`). **#772 = the reference-manual pivot:** Jenni
Abbott (CO AA) confirmed TOP→CIP is **one-to-many** (data: only 9% of TOP are 1:1),
the **Tech Center owns the COCI CIP-dropdown** data entry, and ours is the **reference
manual** (successor to the TOP Code Manual) — so a **"Browse all CIP codes" view**
now surfaces all **2,325** federal CIP codes (incl. 181 that had no TOP mapping) with
narrative definitions. The planned canonical-CIP-designation curator surface was
**dropped** (1:1 premise false). Tests: `tests/cip_crosswalk.test.js` (44) +
`cobi_orgs.test.js` (33); real-Chromium verified, 0 console errors; RLS verified live.
Full story + continuation: `docs/cip_crosswalk_lessons.md`. Side-lane like
SkyFlyer/SkyIron — left `cpl_todos.json` + the numbered handoff untouched.

### SkyLiftoff side-lane — the TOP→CIP "easy button" (course-first recommend mode) (2026-07-17)

Shipped SkyLoft's queued priority. The `#cip-crosswalk` tab gains a **second mode**
(segmented toggle, Browse default, remembered): **🎯 Find my course's code** — pick your
college + a course → the tool reads its COCI description, looks up its **current TOP**, and
ranks the CIP codes the **official crosswalk** maps from that TOP by description-fit. The
**two-signals-agree gate** (§7 TOP caveat) made visible: crosswalk PROPOSES, description-fit
RANKS, faculty CONFIRMS — TOP never decides. Top strong+clear candidate → ✓ **Recommended**;
weaker ones sit below with honest tiers; a strong match the crosswalk misses → a separate
**⚠ "outside the crosswalk"** drawer (auto-opens when no clear winner); the 2 universal
noncredit boilerplate CIPs collapse away; matched-term chips + muted provenance labels
(official/field-submitted). Data: `kb/_build_cip_crosswalk.py` re-emits a compact
`topcip` map (420 TOPs · 4,865 pairs · `boiler`) into `cip_crosswalk_data.js` (embedded,
parity-exact on the 2,325 reference rows). Tests 60→**84**; real-Chromium desktop+phone,
light+dark, 0 overflow/0 errors; Fable consulted on the design fork. **Next: Phase 2 —
the whole-catalog review sheet** (the `_recommend` seam returns everything a batch pass
needs) + the standing **WCAG** gate. Full story: `docs/cip_crosswalk_lessons.md` ·
`docs/cip_crosswalk_handoff.md`. Side-lane — left `cpl_todos.json` + the numbered handoff untouched.

### SkyLoft side-lane — CIP Code Taxonomy + the "Check a course" fit tool (2026-07-16/17, #798–#816 MERGED)

Sam: "get the mockup into production on COBI," then a live-testing sprint. The
`#cip-crosswalk` tab is the CIP-2020 **reference manual** (search + plain-English
finder + category pills + 🎓 C-ID/CCN chip + family filter over all **2,325** codes;
certified CTE `cat`) **plus** an inline **"Check a course against this CIP"** tool.
Arc, all merged: **#798** port of StarCIP's locked mockup (nav "CIP Crosswalk"→"CIP
Codes", backend-free, lean `{fams,rows}` off the 260715 cut, certified CTE 244/244);
**#802** UX polish (self-contained dark toggle, wider intro, rounded chips, one
consolidated search, muted badges); **#813** the Fit-Check Phase-0 engine
(IDF-weighted lexical match of a course description vs each CIP's definition —
Strong/Plausible/Weak + margin discrimination; grounded, no backend); **#814** the
**inline redesign** — pick your **college** once (remembered), pick a **course** →
its **COCI description** auto-scores against the code (per-college `cip_fitcheck/`
lazy-fetched, ~50MB split so the browser pulls ≤1MB); **#815** the **coverage
factor** (a course's *fundamental purpose* wins — an incidental "cost accounting"
mention no longer reads Strong for Accounting; light touch, `rel%` picks the tier);
**#816** scroll-preserve on expand + a **searchable custom combobox** (opens below,
type to filter ~1,500 courses). Engine seams `_score`/`_courseScore`/`_courseToks`;
tests 60; real-Chromium desktop+phone, 0 overflow/0 errors. **Method note:**
`docs/kb-notes/methodology-grounded-lexical-cip-confidence.md`.

**🎯 QUEUED for SkyLiftoff — the TOP→CIP "easy button" (Sam's priority):** every
course has a current **TOP**; the CO's official **TOP→CIP crosswalk** (median 5
CIPs/TOP, 32% ≤3; `cip_searchable_260715.xlsx` TOP-CIP Data) gives the candidate
CIPs → **rank them by description-fit** = the two-signals-agree gate (§7 TOP caveat).
Phase 1: show current TOP + ranked crosswalk CIPs (✓ Recommended when both agree, ⚠
on disagreement) + course-first entry; small data lift (re-emit `TOP→[CIP+prov]`).
Phase 2: whole-catalog review sheet per college (1,500 courses → recommended CIP →
confidence). **🔒 WCAG audit is the standing pre-field gate.** Full story + the
paste-able capsule: `docs/cip_crosswalk_lessons.md` · `docs/cip_crosswalk_handoff.md`.
**Side-lane — left `cpl_todos.json` + the numbered handoff untouched** (CCR mainline owns those).

### StarCIP side-lane — CIP Code Taxonomy: the "easy button" reference + finder (2026-07-15, PROTOTYPE → ported #798)

Jenni Abbott's email feedback pivoted the CIP tab: **don't recreate the crosswalk**
(COE hosts it), the product is the **full CIP list as the authoritative reference**
(successor to the TOP Code Manual) — **simple, an "easy button"** for faculty,
replacing the 6-tab Excel workbook the CO would email out. Built as a **fast-feedback
artifact** (prototype→lock→port; **not yet ported to `cip_crosswalk.js`**),
refined live with Jenni: one search box + the full CIP list, the **category label
(CTE/Non-CTE/Both/Noncredit) visible per row**, a **🎓 C-ID/CCN** toggle chip (course-
level floor, not "Transfer"), a **plain-English finder** (Phase-0 no-backend
keyword+stem ranker — zero hallucination; Phase-1 = wire Sierra `/functions/v1/cpl-chat`
once CO OKs finder-not-decider), light/dark toggle. **Data crux (carries to the port):
CTE label = the CO consultant's CERTIFIED designations, not either workbook tab** —
the *Descriptions* and *crosswalk* tabs disagree on **244 codes in both directions**,
neither reliable (Jenni's 45.0702 catch). Certified authority preserved
`kb/reference/cip_cte_certified_260715.json`; refreshed to the **260715 cut**. Prototype
+ scripts: `docs/cip_prototype/`; KB note `methodology-conflicting-source-tabs-use-certified-value.md`.
Full story: `docs/cip_crosswalk_lessons.md`. **Side-lane — left `cpl_todos.json` + the
numbered handoff untouched** (CCR mainline owns those).

### SkyFlyer side-lane — COBI org layer: the C&I subsite pilot + "Our Process" tab (2026-07-14, #765–#768 MERGED)

Sam's Chancellor's Office talk → the CO **Curriculum & Instruction** team (Dean
Arambula, D. Garcia) wanted their **own COBI (C&I) site**. Shipped the pilot org
layer per `docs/co_platform_strategy.md` (**one platform, org as a view dimension —
NOT a repo/site per org**): a masthead **site-switcher** (`cobi_orgs.js` — CPL / C&I,
per-site ᶜᴾᴸ/ᶜ&ᴵ wordmark tag, nav-filtered, `?org=ci` shareable, **no gating**, #766)
+ the **"Our Process" viz tab** (`our_process.js`, #765) + masthead polish (#767 —
search→right, Go button dropped/Enter submits, seal 46→60px) + the **C&I curation
phrase `ci-team-2026`** (#768, live via Supabase; `team_pass_check` now matches any
cohort). Per-area DATA isolation is deferred (Rule 9 — today both phrases unlock the
same tables). Full story + the 4 open tuning calls: `docs/co_platform_orglayer_lessons.md`;
decision: `docs/kb-notes/adr-cobi-org-layer.md`. Parallel track — the curation
`cpl_todos.json` + numbered handoff were left untouched.

### SkyIron side-lane — 🎓 CPL Pathways: three course maps + Quick Adopt (2026-07-10, #732–#736 + #740 MERGED)

New top-level **🎓 CPL Pathways tab** for the **California Apprenticeship Council (Aug 13)**
deck — CPL check-offs **derived live from the CER dataset**, one data-file object per program.
Three views on the picker: **Cerritos Field Ironworker Supervisor BS** (#732/#733 — 15 IWAP
courses ✓ **31.5u**, the billboard number; ◆15u CLEP → **39%** of 120u; status stages 📝
Discussion Draft default + ⬇ PDF); **Foothill Dental Hygiene BS** (#735 — ✓0/◆17qu/9%, the
ADOPTION map: violet **⊕ chips** live-derive where OTHER colleges articulate — West LA's
RDA (11 courses) + RDH precedent); **Foothill Respiratory Care BS** (#735 — the VISIBILITY
map: Foothill's catalog already awards **24qu CPL** for NBRC+RCP licensure, invisible to MAP).
**#736 ⚡ Quick Adopt v1:** every ⊕ panel takes an adoption request → new Supabase
`cpl_adoption_interest` (anon INSERT-only, no public SELECT; team lane pending). **#740:**
page title/og → "COBI ᶜᴾᴸ" (generator-owned) for Teams unfurls. Suite +`cpl_pathways` 97;
Sam's link out to colleagues. Full story + continuation: `docs/cpl_pathways_lessons.md` ·
`docs/cpl_pathways_handoff.md`. Parked: the CCC catalog→Supabase harvest (todos).

### StarRunner side-lane — CPL Pathways: the DIRECTORY tier, every CCC bacc (2026-07-14)

Sam: expand CPL Pathways to **all CCC baccalaureates**; dropdown not chips; push
back. Pushback taken — hand-curating 40+ full course maps is unsourceable
(catalog bot-blocks, no course→program join), so the tab is now **two-tier**:
the 3 deep **Featured** maps stay, plus an auto **Directory** card per
baccalaureate (**45**, `cpl_baccalaureates_data.js` from the COCI program
export via `kb/_build_baccalaureate_pathways.py`). Keystone: **CER carries a TOP
code on every articulation** → each card **live-derives** the college's own
in-field CPL (✓), the peer **adoption pool** (⊕ + ⚡ Quick Adopt, e.g. Automotive
= 82 adoptable from 27 colleges), the same-field **cohort**, and GE-CLEP — with
a mustard **"CPL frontier"** banner where nobody's articulated yet
(Biomanufacturing, Respiratory). Chip picker → grouped `<select>` (★ Featured +
per-field optgroups); pool caps at 20 with Show-all. **Metric = COURSE COUNTS**
(#777): dropdown shows `current/potential courses`, ✓ tile `courses ·
credentials` — Sam flagged CPL *units* as "sus" (they double-count competencies:
4 courses → 1 ASE area), course counts read as coverage not degree-credit.
#774/#775/#777 MERGED; tests 97→**137**; real-Chromium verified.
**Spin-off — CER credential-merge doctrine (Rule 8c), APPLIED #778/#779:** the
"sus count" dig opened the CER exhibit-credential merge lane (NOT the CCR's M-ID
course convergence — wave 4 skips it). Rule 8c (in `exhibit-canonicalization`
SKILL.md): (1) `(with Practical Assessment)`-style qualifiers collapse into the
base cert; (2) industry-cert vs local-Cx is a SPLIT not a merge (why the
automotive count is legitimately large); (3) narrower competency doesn't fold;
(4) read the curator's own issuer before assuming a mis-issue (Rule 9). Applied
via `cred-rename-apply.yml`: 10 ASE `(with Practical)` folds + the Long Beach
`Automative` cluster (6 folds + 2 spelling fixes; `issuer=ASE` was Sam's
deliberate curation, so 8c-4 self-corrected). Receipts:
`docs/ase_practical_merge_scope.md`, Supabase `merge_doctrine_notes`. Left
`cpl_todos.json` + the numbered handoff untouched (CER mainline owns those).
Story: `docs/cpl_pathways_lessons.md` · `docs/cpl_pathways_handoff.md`.

### StarMarathon side-lane — CPL Pathways: the retired-course filter (2026-07-14, #782 MERGED)

Cleared StarRunner's 🔑 priority finding: MAP keeps **retired/renumbered course
numbers** alive as articulations (Santa Ana's retired `AT`-series + old
`AUTO 53/A1/B33` beside current `AUTO 111–119`), inflating the directory ✓ count
(31 → **12 courses · 18 credentials**). New sidecar `cpl_coci_course_keys.js`
(emitted by `kb/_build_coci_lookup.py` from the same rows as `coci_lookup_data.js`)
lets `cpl_pathways.js` filter the ✓ list to courses in the **current MAP course
catalog** — **fail-open** (college absent / no catalog → keep), so it can *never*
drop an active course (that property also resolved Sam's active-vs-inactive
export question). Only ✓ is filtered; the ⊕ pool stays inclusive. Tests 137→143;
real-Chromium verified. **Cross-lane flag → the numbered mainline:** the ROOT fix
is a **systemwide stale-articulation signal** in the CER/CCR generator (flag any
articulation whose `(college, subj, num)` is absent from the current catalog) —
tightens EVERY count, reuses the all-college `CPL_COCI_COURSE_KEYS` set. Left
`cpl_todos.json` + the numbered handoff core untouched. Story:
`docs/cpl_pathways_lessons.md` · KB note
`methodology-filter-live-counts-against-current-catalog.md`.

### StarX side-lane — CPL Pathways: the Common Course Reference engine + two-view redesign + feeder fields (2026-07-15/16, #794/#796/#797 MERGED)

Sam's "foundational" dig at the Auto CPL Pathway → a full redesign of the directory
cards. **Doctrine landed (Rule 8c already had the credential-merge calls); this is a
NEW course-identity join.** Three merged PRs: **#794 — the CCR engine**
(`kb/_build_cpl_pathway_ccr.py` → `cpl_pathways_ccr_data.js`, keyed
`<NORMCOLLEGE>|<top4>`): per course the **local (searchable) cert(s)**, its **Common
Course Reference** (C-ID/CCN/minted M-ID via `coci_minted_memberships`), **units**,
**peer field-agreement**, **course-grain adoption opportunities**, and a
**cross-field over-merge flag**. Field is **grouped by** the CATALOG 4-digit TOP (a
membership *proxy* — COCI has no course→program join — not an authoritative field key;
see the TOP caveat), which is at least less-noisy than `coci_articulations`' 2-digit
division stamp. Daily-fresh (workflow step). **#796 —
feeder fields** (`kb/pathway_feeder_fields.json`): a multidisciplinary program
aggregates CPL across lower-division feeder disciplines under OTHER TOP codes — fixed
Miramar Public Safety Management (empty → **34 courses / 104u** of Fire/EMS/AJ CPL for
the board deck with the Fire faculty workgroup); flag now compares each course's OWN
field. **#797 — the two-view render** in `cpl_pathways.js` (`renderCcrViews`, fails
open): **🎓 Explore CPL (student)** = course + local cert ("Qualify with X OR Y"), clean;
**🏛️ Curate & validate (college)** = + CCR chip, field-agreement, opportunities, ⚠ flags.
Mockup ([artifact](https://claude.ai/code/artifact/647293d9-57b4-498c-9e41-418e0545be01))
locked live with Sam. Tests: `cpl_pathway_ccr` (21) + `cpl_pathways_ccr_render` (17);
suite 164 files green. **Design seams for later:** the feeder JSON is the interim form
of a Supabase **program-supplement** store (`in_coci:false` reserved for
not-yet-in-COCI courses). **Deferred:** the per-college coordinator/landing contact
block (`map_college_contacts` — Miramar coord = Suzanne Freeman); the **AUTO 116 →
Construction (`CNST M1062`) split re-mint** for the CCR mainline queue; competency-spine
adoption view (Sam parked, wants to explore later). Story + continuation:
`docs/cpl_pathways_lessons.md` · `docs/cpl_pathways_handoff.md`. Side-lane — left the
numbered handoff + `cpl_todos.json` untouched (CCR mainline owns those).

### Session 117 — StarMarcus: closed the doctrine's last open forks → v0.13 + the ESL dry-run payoff (2026-07-15)

Sam wanted "back in the interrogation room." Two grounded 3-fork scenario batches
(profile-before-edges) closed **every remaining named open fork** — Sam swept all
6 with the recommended calls: **Q-HONORS→P-13** (honors folds to base; standalone
honors-program courses keep identity), **Q-UNITS→P-5** (a big spread on a
non-standardized course = whole-vs-part split signal, not a cap), **Q-XDISC→D-8**
(same-subject-code → canonical SUBJ4; diff-code collisions → P-12 homonym gate),
**Q-VARIANT→P-13** (Lab folds; Refresher & Bridge stay separate — the D-4 marks
don't share one rule; each reduces to P-1). Doctrine **v0.12→v0.13** (#791). Then
the payoff: the **ESL packaging dry-run** (#792) — the real 2,364 ESL identities →
Beginning 1,305 / Intermediate 548 / Advanced 296 + carve-outs (Citizenship 38 ·
VESL 155 · Transfer-review 22), measurement-only (`kb/esl_package_out/2026-07-15/`)
+ a visual artifact. Full story: `docs/ccr_convergence_lessons.md` (batches 6–7 +
ESL dry-run). Handoff: `docs/session_118_handoff.md`.

### Session 115 — StarMagna: the doctrine graduation gate → a scenario-refinement cascade (v0.6 → v0.11) (2026-07-14)

Picked up the CCR mainline (wave 4 staged, not run). Sam chose the **doctrine gate
first**: ran the **v0.6 calibration re-seed** as two blind instruments (regression
vs his ratified calls + a fresh held-out sample) → **92% fundamental / 94.7% fine
after his rulings → the doctrine GRADUATED** (#784/#785). Then a **scenario cascade**
via small AskUserQuestion batches took it to **v0.11** (#786–#789): P-6 same-college
merge form, P-1b + Q-FLOOR bound, P-7 generic umbrellas, the 3-rung ladder cap, the
**ESL 3-comprehensive collapse** (2,364→3 + transfer/Citizenship/VESL carve-outs),
FL numeric rungs, the Music/Dance activity doctrine (**Q-TARGETCOUNT fully settled**)
+ the permutation-pressure lever. **7 of 11 open Qs closed; ~6,600 identities**
(ESL/Music/Dance/KINE) now have a packaging policy; whole-worklist batch-apply
authorized. Product insight: small curated scenario batches beat the thousands-strong
🧠 panel (Sam had bounced off it). Full story: `docs/ccr_convergence_lessons.md`
(batches 1–5); method: `docs/kb-notes/methodology-curated-scenario-batches-doctrine-elicitation.md`.
Handoff: `docs/session_116_handoff.md`.

## Archived §11 narrative — moved 2026-08-03 (Rule 8 budget: ≤2 inline)

### SkyQueue cont. 2 — Implementation Funding: the FTES move, and two defects my own tests caught (2026-07-31, #958–#962 MERGED)

Sam moved the model **off headcount onto FTES — twice, in two senses the code now keeps rigidly apart**:
**enrolment** credit FTES (`sizeOf`/`totalSize`, the ALLOCATION basis, 1,069,182 statewide) vs **CPL FTES**
(prior learning awarded, a PERFORMANCE quantity, 10³–10⁴). ~500× apart; never a bare `ftes` for the second.
**#959** switched the basis — I argued AGAINST it (working adults enroll part-time → FTES would penalise
CPL-heavy colleges) and **measurement killed my objection**: corr 0.086, and the switch moves **+$307K TO**
the top-15 CPL colleges. What decided it was DATA QUALITY (headcount: 41/115 rows on 2022-23, 33/115
implausible — Pasadena read 14,936 against 23,347 credit FTES). Sam's fresh DataMart pull then **confirmed
the diagnosis** (Pasadena → 41,521). **#960 — a defect I shipped in #959:** the cap moved to FTES and the
target stayed on headcount, so `cap ÷ target` diverged 0.49×–2.11× for **72 of 115** colleges and a hover
asserted a base rate its own two numbers contradicted. It survived because **no test asserted the
RELATIONSHIP** — only each side. New `prioTarget()` seam (target had been open-coded at 5 sites).
**#961** builder unit sums + FTES-aware `MEASURES` with **unit-mismatch** detection (Sam's 3 live strings
had resolved to student COUNTS and a full advance; "measurable" was the only test). **#962** targets in
**CPL FTES** = pre-floor entitlement ÷ $5,649.63 × multiplier; TLM as a per-calendar parameter (525/17.5=30
semester, 525/11.67=45 quarter — same 900 units read 30.0 vs 20.0 FTES); factors box stores BASES, derives
quotients. **Second self-caught defect:** the multiplier was wired onto the RATE, inverting it — caught
because the test asserted what the knob is FOR, not what it computes. **The unknown I couldn't resolve
(source row grain) is now measured by the pipeline every run** — first run ratio **1.0054/1.0002**, the
conservative reducer is right. Tests 539·35·24·40·26·53·24; suite **180 green**; Chromium clean.
**Live: eligible 1,354,527 units = 45,151 CPL FTES = $255.1M; transcribed 103,139 = 3,438 FTES = $19.4M**
against a ~$11.6M/yr pool (an earlier CER estimate was **7× low**). ⚠ **Open for Sam: P1 (eligible)
saturates at 22× target and incentivises nothing** — one rate can't calibrate all three priorities.
Durable: `methodology-ship-the-oracle-with-the-assumption`. Story: `docs/cpl_funding_lessons.md` · handoff
`docs/cpl_funding_handoff.md`. Still open: the Budget consolidation. Side-lane — left `cpl_todos.json` +
the numbered handoff to the CCR mainline.


### SkyUnit — Implementation Funding: headcount out, and the summary surfaces made to agree on units (2026-08-01, #964/#965 MERGED)

Sam, on the pool cards: *"eliminate headcount from the model altogether — the card that allocates
$4.62 per student should be a per FTES amount"* and *"the P1,2,3 earned FTES seem way too high, the
tgt FTES way too low."* Both right; the second had a **live 30× defect** under it. The per-college
P-cells convert units→CPL FTES; **three SUMMARY surfaces did not** — P1 read *"Actual 1,354,527
students — 193,700% of target"*, the target line relabelled CPL FTES as "students" then divided by
headcount, and the college table's **SYSTEM row printed a headcount under a "Credit FTES" header**.
Sites **four, five and six** of the family #960/#961/#962 fixed; they survived because tests asserted
each side's PRESENCE, never the RELATIONSHIP — the new ones recompute "% of target" from the card's
own two numbers. The SYSTEM row was caught only by **rendering in real Chromium and reading the header
next to its own total**. Cards now follow the basis seam (credit FTES pairs with **noncredit** feeder
FTES, never feeder headcount); `$4.62` retired for the operative price — **$5,649.63/CPL FTES → 2,056.8
CPL FTES the tranche buys** (61,704 units, $188.32/unit), with $10.87/credit FTES (the literal swap) as
a note. ⚠ **Raising the rate LOWERS the target**; there is no ~$8k in the dataset, and $8,071 would take
the target 2,057→1,440 — the wrong way for Sam's own complaint. He settled on **$5,649.63**, now
**curator-editable** (#965: base rate not the derived effective one; writes `setFtesRate` NOT `setPool`
— a pool write sits *under* the override and does nothing visible; two entry points, one setter;
zero/negative/junk **rejected**, since a 0 rate silently earns every college $0). **P1 → Applied
(Sam's call):** I proposed dropping eligible on the evidence it can't discriminate (98/102 colleges
over target, median 42×); he located the real cause, and measurement confirmed **our arithmetic is
right and the SOURCE is inflated** (producer cross-check vs MAP's own totals = **1.0054**; the ACE/JST
skill-level duplication, `map_data_quality` 10ad9e0a, which MAP can't easily fix). So we **measure one
rung down the funnel** — eligible 1,354,527 → **applied 242,559 (18%)** → transcribed 103,139. Producer
emits `pa`/`pa_u`; **P1 not rewired yet** (per-college split needs the cron). Two guards mattered more
than the feature: `pa` is **omitted, never zeroed** (a present 0 reads as "posted nothing" → $0
statewide) and a **`MEASURES` entry shipped WITH the data** (the string matched no rule → full-cap
advance). Tests 545 · 54 · new `applied` 23; suite **181 green**; Chromium clean. Durable:
`methodology-a-summary-must-share-the-unit-of-its-detail`, `methodology-omit-dont-zero-an-absent-measure`,
`methodology-move-down-the-funnel-to-route-around-an-upstream-defect`. Also: Sam's ruling closed DQ
`7eb0c25a` (quarter colleges keep the 11.67 TLM → 45 units/FTES) and opened `ae3e16d6` (normalize units
in MAP, alongside native). Story: `docs/cpl_funding_lessons.md` · handoff `docs/cpl_funding_handoff.md`.
**Next: the cron publishes `pa`/`pa_u` → wire P1→Applied + cumulative targets, but look at the
distribution first (79 of 99 colleges have ZERO transcribed; top 10 hold 95.7%).** Side-lane — left the
numbered handoff to the CCR mainline.

### SkyUnit cont. — Implementation Funding: P1 → APPLIED, and the funding model is settled (2026-08-03, #967 MERGED)

Sam sent a pivot of the MAP Student Aggregated Values export and asked to switch P1 from eligible to
applied units. **His pivot validated the producer exactly** — Bakersfield eligible 25,280.5 / applied
8,437.5 / transcribed 962.5, all three matching `pe_u`/`pa_u`/`p3_u` to the decimal, built independently
at the per-student grain we dedupe on. Applied **live** to the Scenario-1 config (receipt
`kb/supabase_funding_p1_applied.sql`): **P1 = Applied · shares .50/.45/.05 · multiplier 2.0**. Pool now
earns **$9.65M of $23.24M (41.5%**, was 30.1%), median college **50%** of cap (was 34%). **Cumulative
targets came FREE:** `prioTarget = (entitlement ÷ nYears) ÷ rate × multiplier`, so with a 2-yr window
**multiplier 2.0 IS the cumulative window target** — dropping the `÷ nYears` in `prioEntitlement` would
give the same target and **cancel the front-load incentive**, so a new test (`cumulative_target`, 10)
carries the REASON. **Sam's design intent, why these metrics:** P1 Applied = proxy for the upfront
articulation work (the petition→outreach flip — onus on the college to create CPL opportunities BEFORE
the student asks); P2 Transcribed = proxy that every step happened (counseling, program AND transfer
destination, SIS→MIS); P3 outside submissions = outreach to not-yet-students, small share because it's
"too much of an ask for the Y1 & 2 phase". **THREE of my proposals were wrong and withdrawn:** replacing
P1 with a raw articulation count (corr only 0.334 — but a count rewards credentials nobody qualifies
for, while applied proves the articulation was created AND useful); deleting the `credit recommendation`
MEASURES rule (it would let "eligible + statewide" fall through to plain eligible — a wrong number in
place of an honest gap); and a harsher multiplier (I'd read a WINDOW-denominated table as PER-YEAR, so
my "2.0×" was really 4.0 — the same unit-scope class #964 fixed, made while fixing it). **A causal
correction that had reached 3 artifacts:** I wrote eligible is "inflated at the SOURCE" by JST
duplication; the gap is mostly **correct applicability filtering** (a JST lists 1 unit of marksmanship;
no CCC offers it). Where a credential IS articulated colleges apply **79%** of eligible; across all
eligibility it's 18%. Corrected in the KB note + `cpl_memory`. **Also:** the $0 colleges are THREE
states, never one number — 9 absent (implementation gap, verified NOT a join miss, self-heals), 4
privacy-suppressed (did the work, earn $0 anyway — open decision), 16 measured zero (outreach list).
Suite **182 green**; Chromium clean. Durable: `methodology-omit-dont-zero-an-absent-measure` (extended:
three kinds of zero). Story: `docs/cpl_funding_lessons.md` · handoff `docs/cpl_funding_handoff.md`.
**Next: the Budget reconciliation** (fold Implementation Funding in as a Budget sub-view). Side-lane —
left the numbered handoff to the CCR mainline.

### SkyUnit cont. — Implementation Funding: per-priority PRICE FACTOR replaces the global multiplier (2026-08-04, #971 MERGED)

Sam & Malone: **decouple the funding split from the FTES difficulty.** Retired the single global
**target multiplier**; each priority now carries a `factor` — **price/CPL FTES = factor × base rate**,
**target = pot ÷ price** (higher factor ⇒ fewer FTES earn the pot ⇒ a *premium*; scales the target
**inversely**). **`factor 1.0` = the prior model exactly**: the cumulative-window `×nYears` is now
**structural** in `prioTarget`; `prioEntitlement` stays per-year (front-load invariant). **Behavior-neutral
to merge** (live `targetMultiplier:2` ≡ factor 1.0), so the config activation was a **separate post-deploy**
write (`kb/supabase_funding_priority_factors.sql`, Rule-9-guarded — factors were null, Sam's shares/metrics
untouched). Live: **shares .5/.3/.2 · factors P1 .5/P2 1/P3 2** → pool $23.24M, statewide target **5,759 FTES**,
earns **$8.62M (35.6%)**, median 31%. Retired `targetMultiplier`/`effectiveFtesRate`/`setTargetMultiplier`;
factor is editable per-priority in the tab. Prototyped + real-Chromium-verified in the **sanity-check artifact**
first (linked on the private tab). Suite **545/545**. ⚠ **Do NOT reintroduce a global multiplier** — the factor
is THE dial. Durable: `methodology-retire-a-global-dial-into-per-item-dials`. Story:
`docs/cpl_funding_lessons.md` §2026-08-04 · handoff `docs/cpl_funding_handoff.md`. **Next: Budget reconciliation.**
Side-lane — left the numbered handoff to the CCR mainline.

### SkyBox — Implementation Funding: ALL of Sam's tweaks + the NC rehaul (2026-08-04, #973–#976 MERGED)

Sam's 7 display/report tweaks. **#973:** award boxes → **Min·Avg·Max**; Report gained a
**Recommended Strategies** section, renamed the division **ESS → Academic Affairs**, dropped
the **$35M gross** (leads with available college funding). **#974:** the duplicate $35M boxes
**collapse to one editable box**; hero is now the **INSTITUTION total $25,240,308** (college
pool + rural + $1M NC, 3-way note — raising the feeder now shifts money college→NC *inside* the
total, no longer shrinks the hero); "Earned so far" relabeled **"…not the noncredit carve-out."**
Suite **545→552**; all mirror to the public page (shared JS). **Big NC question — Sam chose
"targeted + advisory NC column":** keep $1M with the 4 standalone NC campuses (SF earns via the
credit column — its FTES sheet shows $236,645 vs $0 for the NC campuses — not shut out), add an
advisory NC column, DON'T dilute across ~105 colleges. ⚠ **Calbright 21,438 NC FTES is
impossible** (2,484 heads) — don't let it drive dollars; feeder split stays by headcount.
**#976 shipped #5:** an advisory per-college **NC-FTES sub-line** under the size cell (a sub-line, not
a 12th column, to keep no-scroll; matched all 115 via a verify-or-abort script — model `credit_ftes` ==
Malone's Credit-FTES column cross-confirmed it; **De Anza → "DeAnza"** display override, Chabot stays
"Chabot"; ⚠ `rowsFiltered()` field-whitelists the row copy, so a new data-file field must be added there).
Suite 552→555. **Deferred: #3b** (NC gate — inert today). **Then #978 reworked the funding memo**
(institution total; district-grouped allocation with each district's NC campus beneath it; a
$50k-seed intro; a Technical Assistance section w/ KB-verified MAP links + contacts). Suite →562.
**Administrator (VPAA/VPSS/CEO) opt-in — v1 SHIPPED (SkyOptIn, 2026-08-05):** a public self-service
opt-in on each college row (works on the public page) captures the attesting admin AT opt-in;
**attest-first** (Sam's call — the submit clears `baselineGate`, the CO confirms/revokes in a lane, no
pre-gate); PII-safe (attestor name/email reviewer-gated via column grants + the gated
`cpl_funding_optin_review()` RPC; `kb/supabase_funding_optin.sql`). v2 (magic-link email) still queued.
**Next: the Budget reconciliation.** Full story: `docs/cpl_funding_lessons.md` §2026-08-05 (SkyOptIn) ·
§2026-08-04 (SkyBox) · handoff `docs/cpl_funding_handoff.md`.

---

### SkyPartner — Noncredit & Learning-Partner CPL: thinking doc → live tab → write layer (2026-08-05, #981–#989 MERGED)

Sam's cold ask (7 prompts + "ask me anything") became a shipped instrument in one session.
**`docs/noncredit_cpl_thinking.md`** (~1,530 lines): §0 *why this exists* — the noncredit thinking
**was** figured out (Fall-2025 decks) but never left a slide deck; the Oct-2024 monograph mentions
noncredit **6× in 32 pages**. Twelve use cases by MECHANISM → **six MODES** for the team
(M1 mirrored · M2 certificates/licenses · M3 NC certificates · M4 HS Cx · M5 portfolio · M6 CPL-toward-NC).
**M2 holds the screening question:** *does the program END in a license/3rd-party cert?* Yes → one
determination covers everyone, forever. **Sam's Q3 "oxymoron" is an apportionment problem** — a waived
NC course earns **zero** apportionment and the student pays no fee, so 100% of the loss hits the
institution (SB 361 is the precedent for a hold-harmless). ⭐ **Data findings (§7a):** **49 dormant
statewide exhibits / 252 college-slots**, only **30 of 84** statewide exhibits have EVER converted a unit;
the **4 standalone NC institutions are at ZERO** across 1,987 titles while ~48 HS entries exist; **27 CCCs
teach dental assisting, 1 awards RDA CPL** (West LA, 99.5%); EMT converts at **75.6%** across 28 colleges
(→ EMS Corps is **outreach**, not articulation-building). **Tab shipped** (#985): 5 collapsible sections,
jump links, report generator (Copy·MD·Word·Print). **#987** narrative `[[ITEM-ID]]` cross-refs — an uncited
claim is now *visibly* unbacked, and a test fails on a dead ref. **#988/#989** write layer — ✎ Add insight on
every card; **"answering never closes, just revises"** enforced in schema (supersede RPC, **no DELETE policy**);
notes sit ALONGSIDE the register with a **promotion packet**; applied to `hvuwhnbuahrtptokpqfh`, anon-gate
verified (anon reads 0). ⚠ **Public `cpl-knowledge-base` untouched** — packet targets tracker lanes only.
Suite **82** (tab) · full 184 files green. Durable: `methodology-dormant-asset-worklist`,
`methodology-register-is-the-spine-narrative-cites-it`, `adr-notes-alongside-the-curated-register`.
Story: `docs/noncredit_cpl_lessons.md` · handoff `docs/session_119_handoff.md`.
**Funding deliberately PARKED** until the NC universe is mapped (Sam).

### SkyOptIn cont. — Implementation Funding: opt-in row CTA + the Budget reconciliation (2026-08-05, #986 + #1002)

**Opt-in row ergonomics (#986 MERGED).** A one-click **✎ Opt in** chip on every not-opted-in college row
(public + private) expands the drill-in, opens the attestation form, focuses the Name field; the CO
**✓ Confirm / ✕ Reject** now shows **INLINE in the reviewer's row drill-in** (where Sam looked — not only
the aggregate Baseline lane), with the attestor identity. Binding: holder-scoped in `wireTable()` so it
survives `refreshTable()`; the lane copies scoped to `.cplfund-elig` in `wire()` (disjoint, no double-bind).
`cpl_funding_optin` 18 → 28. **Budget reconciliation** vs the revised `20260729_CPL_Amendment_Sep_BOG.xlsx`:
ties to the penny across the whole tree ($35M split, $15M reconciliation, $31,556,650 amendment, and the
clean fold $8,959,692 = $1,516,342 RCCD + $7,443,350 CO/TBA). **Sam's 2 workbook fixes:** **$74M → $71M**
(`=E2+E9+E10` double-counts the $8.96M project slice already in the $35M) and **award Max $665,971 → $522,239**
(recomputed from live `awardStats()` over 115 colleges = Min $150K · Avg $210,785 · Max $522,239 Mt SAC;
**report 115 Colleges SPLIT from 4 Noncredit** — Calbright $33,134 is below the $150K floor, never blend the
119). **COBI ongoing → 2030-31 committed (#1002):** +$14M → $35M, the pre-amendment $5M 2025-26 archived,
new `yr_2030_31` column (`budget_ledger.js` `USE_YEARS → [1..5]`); Supabase applied + verified
(`kb/supabase_budget_extend_2030_31.sql`, guarded UPDATEs, no `model_field` touched). `budget_ledger` 34 → 40.
**OPEN — NC equalization:** design LOCKED (floor + optional per-row factor, skip double-dip flag), build
DEFERRED on Sam's **headcount → FTES** basis call (next session); award-card 115/4-NC split rides with it.
Durable: `methodology-recompute-a-documents-figures-from-the-live-engine`. Story:
`docs/cpl_funding_lessons.md` §2026-08-05 · handoff `docs/cpl_funding_handoff.md`.

### SkyWalker — Partner occupation → CPL crosswalk engine (2026-08-05, #995 MERGED)

**Ashley opened this one, not Sam** — a training-center occupation list (SJCOE, 160 rows →
**139 unique**) and a concrete goal: *"so they know which college offers CPL for their work
experience and industry certs."* Sam's mid-session note — *"wire it so it can be scaled for
other similar crosswalks"* — turned a favor into an instrument. ⭐ **The design insight: the
two vocabularies don't join.** Partner lists carry JOB/apprenticeship titles, MAP is keyed by
CREDENTIAL titles, and no authoritative crosswalk exists — so the match is JUDGMENT, and
judgment is what gets persisted (`kb/occupation_credential_map.json`, normalized-key) while the
run stays disposable. Every run's `unmapped.json` **is** the curator worklist, so coverage
compounds across partners. Results: **51 statewide CPL · 53 local-only · 35 no CPL anywhere**;
406 matches, 1,488 occupation×credential×college rows. ⭐ **Two findings.** ① **Utility line
work is a total desert** — ~20 rows (lineworker, substation, hydro, gas control, metering, cable
splicer, power dispatch) have ZERO CPL system-wide; also empty: tile/terrazzo, pest control,
surgical tech, central sterile, painting, nuclear. ② **The obvious referral target fails
silently** — San Joaquin Delta, the in-county college, has **69 credentials of which ONE is
career/technical**; Sacramento City + Folsom Lake have zero, Cosumnes River none at all, while
**Modesto Junior has 265, the largest in the state**. Hence the workbook splits regional
capacity academic-exam vs career/technical. Also pinned in tests: statewide = the ADOPTION file
(**138**), not the credential reference's **84** (a strict SUBSET whose 54-title delta is the
contractor-licence/apprenticeship/NCCER cohort trades lists match); `adopters` is a deliberate
UNION of statewide + local. Suite **32 checks**. **COBI tab authorized by Sam but deliberately
NOT built** — Ashley chose engine-only; when revisited, build the *regional-capacity* view (pure
data), not the occupation matching (judgment). Durable:
`methodology-partner-occupation-crosswalk`. Story: `docs/partner_crosswalk_lessons.md` ·
handoff `docs/session_122_handoff.md`.

### SkyMail — MAP Users: the student-contact worklist (2026-08-05, #991–#993 MERGED)

Sam's "add some features" resolved to a goal one message later: *"all College Landing Pages
include contact so when students request CPL, it goes to a real person."* MAP routes on
`primary_contact_email` — **25 of 123 colleges had none, 24 of them with a live landing page.**
A silent service outage: every dashboard counts what exists, not what's missing.
**The design came from Sam's constraint, not from me.** My first cascade preferred a shared
inbox (`cpl@college.edu`) since turnover is what causes these gaps; he killed it — colleges are
**locally governed**, and adopting that convention for them is a determination we don't get to
make. The surviving rule is stronger: **every proposal is a person the COLLEGE already
designated in MAP.** We route, we don't appoint — and the email says so, so they can check it.
Corollary: **leadership stopped being a rung** (5 colleges moved to *ask*) — routing student
mail to a VP is their call. **17/25 resolved.** ⭐ The unlock was measurement, not logic: a probe
found `View_CollegeContacts_APIDataset` carries **24 fields while the sync pulled 11** — CPL
Assistant (52/123, Sam was right it existed and unsure of the label → probe, don't ask him to
recall a spelling), CPL Counselor 65, AO 87, Faculty Lead 84, Lead Initiator 82, SCO 101.
**Jessica's input added a third trust tier:** curator-supplied contacts render with *who and
when*, web-sourced with a *source link + verify*; a lookup may only yield a department inbox,
**a curator may name an individual** (they know who answers). Also found: the public headline
overstated (**2,657/120**, not 2,769/128 — 7 sandbox colleges + the statewide account, fixed by
*labelling* not filtering); `disciplines` is **pipe**-delimited (a 1,364-char cell, live 2
months); 15 colleges hold multiple emails in one contact cell. Anon-gate verified (0 rows).
Suite **70→108**, 184 files green. Durable: `methodology-route-to-a-determination-they-already-made`,
`methodology-provenance-is-a-field`. Story: `docs/map_users_lessons.md` · handoff `docs/session_121_handoff.md`.
**Then Sam asked what would improve GOVERNANCE** — and the answer wrote itself from the day's evidence:
every problem hit was a **governance gap wearing a data-quality costume** (a field nobody owned, a source
nobody owned knowing, a definition nobody owned). ⚖️ **Governance tab** (#997, team-gated) — decision
rights · acceptance standards · cadences. **It measures itself:** reasoning stored, facts computed at
render time, so the register's "decided each semester" contact cadence renders **"never run"** off 0 rows
in `map_college_nudges` — decided in June, never once fired. **Every `owner` ships null**, red, counted:
the empty cells ARE the review. Then **team enablement** (#998) as the team grows past Sam — the guide
`docs/working_with_claude_code.md` (built on Sam's own tips to Ashley: ask to see it · a tool you return
to, not a one-time Excel sheet · ask for a tab) **plus the stronger half**, §"Working with the MAP team"
here, as session OBLIGATIONS — *a habit that depends on a new user remembering it fails on their first
day*. **Agents: not yet** (an agent must be invoked; standing instructions can't be forgotten). Suite
**185** files green. Durable: `methodology-a-governance-artifact-must-measure-itself`. Story:
`docs/governance_lessons.md`.

### SkyPlan — the $50k tab's real measure, and headcount finally retired (2026-08-06, #1007 · #1012 · #1013 · #1014 MERGED)

Sam opened on the $50k/ESS-25-82 tab — *"where we have simple check marks"* — with the goal underneath
it: **get colleges unstuck and awarding real CPL to real students in MAP.** The rework is NOT built; this
run found what it has to stand on. ⭐ **He named MVC / Cabrillo / Bakersfield as adept BEFORE anything was
computed, and that offhand list was the free test set that killed three plausible metrics.** Applied-per-1,000
ranked Cabrillo 29th; applied÷eligible 24th; transcribe-completion crowned a college whose 99% was a *batch
AP/IB upload*. Only the **disposition rate** — share of credit recommendations carrying any disposition —
put all three in the top thirteen of 106 against a **median 4.7%**. It is also the FAIR measure: Cabrillo is
**844 Not Applicable vs 320 Applied**, so scoring "applied" alone reads 9% instead of 34%. ⭐ **Sam corrected
my phase**: applied, not transcribed, is this phase's ask — which made the fix *smaller* (outcome 3 fires on
ELIGIBLE, not an action a college takes; moving it to applied changes 13 colleges, not 78). ⭐ **His "something
in the config is trumping us" was right**: `wantsUnits()` decided FTES-vs-students by string-matching
"headcount" in the metric LABEL, so a retitle silently moved targets onto a headcount-era `target_rate`
applied to credit FTES. Fixed with an explicit **layer-aware** `unit` (a naive lookup would have inverted the
bug and scored live Scenario 2 as FTES). Also: **NC split headcount → noncredit FTES** via a new
`feederBasis(f)` seam (open-coded at FOUR sites), Calbright placeholder 1,000 (reported 21,438 = 8.63
FTES/student, impossible), and 5 prose strings that still claimed targets ride headcount. ⚠ **FTES alone
moves Calbright only $33K→$40K — the FLOOR is what delivers equity**, and they were being conflated.
**Deliberately NOT done:** re-baking `year_priorities` to FTES (rewrites ~15 behavioral assertions — its own
PR). Malone is productionising the student×CR report; `funding/_build_cr_backlog.py` waits on the view name.
A GitHub **Actions incident** (confirmed, 17:40 UTC) ate two hours — `runner_id: 0` was the tell.
Durable: `methodology-validate-a-derived-metric-against-expert-ranking`,
`methodology-an-incentive-teaches-where-the-finish-line-is`,
`methodology-a-label-that-decides-behaviour-is-a-policy-switch`,
`playbook-diagnose-a-starved-actions-runner`. Story: `docs/cpl_funding_lessons.md` §2026-08-06 ·
handoff `docs/session_123_handoff.md`.

### SkyHunter — the CPR question, and a fix that became the next outage (2026-08-06, #1016 · #1017 MERGED)

Sam asked for the last Sierra handoff; the real prompt came three messages later — *"a colleague at
the CO asked which colleges give CPL for a CPR or AED cert and Sierra could only find 2."* **Sierra
found 2, the corpus held 5, the CER knows 7** (+28 via EMT). Five defects, and **none of them was the
one fixed the last time this same question broke** (Session 93, 2026-07-01) — ⭐ **one was INTRODUCED
by that fix.** It added `aed` to the CPR synonym family; `to_tsquery('english','aed:*')` parses to
**`'a':*`** because Snowball strips the "-ed", and OR'd against every other term that one token
swallowed the corpus. It sat five weeks because **nothing ever asserted what retrieval RETURNED** —
both prior verifications were "read the answer, it looks better." Also: `cert` matched 445/2,397
(18.6%); no relevance floor; **`Aid/CPR/AED` parses as ONE file-path token**, so Modesto's rows had
only ever surfaced via the unrelated word "Certificate". ⭐ **Sam supplied the test cases
conversationally and every one found a real bug** — plurals (`firefighter` 11 terms vs
`firefighters` **1**), two-word/hyphenated forms (`first aid`, `life saving` → nothing), and
misspellings (*"like my misspellings :)"*, having just Googled "cardiopulmonary" while holding a CPR
card). His framing is the North Star: *"the way you magically understand me with all my garbed typos
should be the way Sierra understands."* Fuzzy had to target **synonym KEYS not titles** —
`word_similarity('cardiopulminary', 'Adult CPR…')` = 0.069. **2 → 5 colleges, 100% precision.** ⭐ The
new test went red on the plural bug *the minute it existed*; the battery also caught a
`CREATE OR REPLACE` **overload** (42725) that would have broken Sierra outright. ⚠️ **NOT DEPLOYED —
production still answers "2"**, held for Sam's go. The contacts/landing-page "regression" was **not
one**: live v28 was byte-identical to repo; the question mix had shifted to a path that never carries
contacts. Also **#1017** — small-cell suppression that didn't suppress (total + all-but-one cell
recovers the hidden value; complementary suppression + row floor + the residual documented).
Durable: `methodology-assert-what-retrieval-returns`,
`reference-postgres-fts-pitfalls-for-credential-titles`,
`methodology-small-cell-suppression-must-survive-subtraction`. Story:
`docs/cpl_assistant_lessons.md` §SkyHunter · handoff `docs/session_124_handoff.md`.
**DEPLOYED 2026-08-07 (#1019–#1021): cpl-chat v29, CPR fix LIVE**, smoke **mode 13 green** on the live
function. Deploy is now runner-based (byte-exact from git; `--no-verify-jwt` pinned in the workflow) —
the 66 KB hand-transcription hazard is retired. ⭐ Five attempts, five different causes, only ONE Sam's:
**403 ≠ 401** (403 = credential accepted, identity refused — and Supabase's renaming means a JWT or a
project key 403s *exactly like* an under-privileged role, so test the `sbp_` prefix in the workflow), a
GitHub CLI-release rate limit, and my own wrong working directory (the CLI resolves
`<cwd>/supabase/functions/`, which lives under `chatbox/` here — and that check fires AFTER auth and a
Docker pull, so it reads like a permissions failure). 🔨 **Mode 7 stays red but CHANGED MEANING** — the
Dental-Board false positive is gone; it now names Norco (107 exhibits, ~50 mi) over the genuinely
adjacent LA-basin colleges: **volume outranking distance** in the offerings path. Queued for SkyHero.
Durable: `playbook-deploy-an-edge-function-from-the-runner`.


---

### SkyHero — the bug was one layer up, and four passes on what Sierra tells a seeker (2026-08-07, #1023 · #1024 · #1025 · #1026 · #1027 MERGED · deploys 7–10 green)

Picked up SkyHunter's queued mode 7. The handoff diagnosed "volume outranking distance"; measuring found the
cause **one layer up — the home college was never detected.** `detectAndFetchCollegeProfile` returned on the
FIRST word with several matches, so `"angeles"` (9 colleges) short-circuited before `"harbor"` (exactly 1) — and
⭐ **`.limit(3)` with no `ORDER BY` is non-deterministic**: two identical live calls returned different triples,
so LA Harbor resolved only when it happened to land in an arbitrary window. **Retrieval itself was flaky**, which
is a large share of what read as model flake. With no home college, `askedGeo` was null and nothing downstream
*could* rank by distance. Also: the exhibit list had **no geography at all**. Three cases measured live —
LA Harbor → every LA-county college above Norco; Fullerton/CPR → **Cypress (7 mi)** over Modesto (~300 mi);
Crafton → **Chaffey (same county)** over Bakersfield. ⭐ **That third case was reported by a human in
`sierra_feedback` on 2026-07-03** and sat at `status='new'` for five weeks — **43 rows, zero ever triaged**, 19 of
them the smoke test polluting its own queue. Also **#1024** 📋 Copy on both surfaces (rich HTML + markdown, three
tiers because the vendor iframe blocks the async Clipboard API). Then **four passes on student routing, each one
Sam correcting the last**: both/and → **Yes/And** (a substance fix — my first version split them by FUNCTION,
compare-there/act-here, but a seeker can see AND request review at BOTH) → the portal's **fuller portfolio
process** → **anti-poaching** ("we don't want colleges angry at Sierra"). ⚠️ **Open, unresolved:** Sam's
"err on the side of CPL seekers…while supporting our colleges" — #1027 as written can make Sierra **WITHHOLD**,
which fails the seeker *and* the college; the restraint must bind salesmanship, not facts. **Mode 7 stays red on
a NEW meaning** (see the roadmap row) and a 5-surface poaching audit was still running at checkpoint. Durable:
`methodology-an-unordered-limit-is-a-correctness-bug`, `methodology-the-feedback-queue-already-knew`,
`methodology-a-guardrail-that-only-forbids-disables-the-feature`. Story: `docs/cpl_assistant_lessons.md`
§SkyHero · handoff `docs/session_125_handoff.md`.

---

### SkyMiner — both decisions land, and the robot in the suggestion box (2026-08-07, #1029 MERGED · deploy 11 green)

Picked up SkyHero's two queued decisions, which the handoff marked **not mine to answer**. Asked; both answers
changed the code. **(a) Restraint binds salesmanship, not facts** — `PORTAL_RULE` now carries the tie-break:
never withhold a fact that materially changes the visitor's outcome, never editorialise; if the host hasn't
articulated it, say so, say where it IS available today, say the host can adopt it; when the two can't be
reconciled the **visitor's outcome wins, stated plainly and never sold**. **(b) Mode 7 = all three parts, in
order** — host → precedent → **nearest real route** (colleges that merely *teach* it, even with no exhibit);
`OFFERINGS_RULE` calls stopping early *a failure of the answer, not politeness*, and the smoke assertion now
requires all three so it encodes the DECISION. ⭐ The transferable half of (b): two rules in different files
conflicted with nothing saying which governed, so the later one silently won — **a tie-break stated only where
the conflict is defined never reaches where the conflict is resolved**; `OFFERINGS_RULE` had to cross-reference
`PORTAL_RULE` explicitly. ⭐ **Measuring the feedback queue before asking became the session's real finding:**
53 rows, still ALL `status='new'`, and **28 written by our own smoke test** (up from 19 the day before) — CI was
**53% of the queue it fills**, every row a thumbs-down, so the headline "👎 total" read **38 when only 10 were
real**. It **cannot** clean up (mode 12 writes as anon; anon is write-only there *by design* — the mode asserts
exactly that), so the fix is at the reading surface: hidden by default, disclosed with a count + toggle, stats
following the same rule. ⭐ And the queue had **already reported three of the last four sessions' work** — the
07-17 row said *"should push them to the student portal"* **three weeks before** Sam raised student routing.
4 rows marked `addressed`; 6 remain. Tests `sierra_student_portal` 44→**59** (the added checks are the
PERMISSION half — a violated prohibition is loud, a violated permission is silent), `sierra_training` 31→**44**.
Durable: `methodology-a-test-that-writes-to-the-queue-it-monitors` + the Resolution section added to
`methodology-a-guardrail-that-only-forbids-disables-the-feature`. Story: `docs/cpl_assistant_lessons.md`
§SkyMiner · handoff `docs/session_126_handoff.md`.

**Part 2 — four more decisions, then a bug report that was three bugs (#1032–#1036, deploy 12 = v35).**
Sam's edge cases: **distance is a fact, not a filter** (name the nearest teaching college however far, state the
distance, let the visitor judge) and **the true dead end** (say so plainly + portal + flag it to MAP so the gap
is recorded — and *never invent a college or an articulation to avoid an empty answer*). Then his "save button
needs two clicks": `commit()` repainted BEFORE `saveOwner()` did the optimistic write, so ⭐ **the UI was always
exactly one write behind** (a 3rd save typing a new name still showed the old one; it reads as
second-time-works only because the dialog pre-fills from the same state). An adversarial sweep found **9 more**;
I fixed the two that misled him about his own data — `r.ok ? r.json() : []` turning a 401 into "nobody has an
owner", and `if (state.reg) return` never re-reading after sign-in. ⭐ **In all three the data was fine and only
the screen lied** — the hardest class to report, because the reporter accurately describes a symptom pointing
away from the cause — and **every pre-existing test passed through them**, having set state directly rather than
driving the button→dialog→Save path. Then **OQ-08 built** (`kb/_build_governance_candidates.py`): 39 → **15
candidates**, 0 stale rows, noise budget committed as a test. ⭐ **Both filter bugs looked fine in code and were
obvious on first print** — one too loose, one that *silently matched nothing* (1.2M chars between a tab's button
and its loadScript), and a scan returning zero reports good news, which nobody investigates. Durable:
`methodology-a-failed-read-is-not-an-empty-result`, `methodology-judge-a-detector-by-what-it-prints`.

### SkyGauge — the bug was already fixed, and a 0.0% that looked like a finding (2026-08-07, #1038–#1044 MERGED)

Took the handoff's Priority 1 (mode 7 part 3) and **measured instead of guessing between its two candidate
causes.** The offerings RPC returns **613 rows / 117 colleges** for mode 7's exact tsquery, cap 150, with **LA
Trade Tech at rank 2 and Rio Hondo at 6** — retrieval never thinned anything, and the built context held **ten
colleges, all in LA Harbor's county**. ⭐ **It was already working:** smoke 47 (the red run the handoff
describes) ran against **deploy 11**; #1035 shipped v35 after it and runs 48/49/50 are all green. **The session's
own last PR fixed the item its handoff filed as Priority 1** — the proving smoke fired on push, after the handoff
was written, and was never re-read. Committed the live 150-row window as a fixture + 13 checks (#1038); found
that `core` discriminates nothing on that query and the **whole ordering rests on the proximity band**.
Then Sam's live CPR/AED question exposed a real gap: **`CPLStatusPlan` is in NONE of the nine fetched views**, so
Sierra can say what credit exists but never what a college has ACTED on (#1039, + a runner probe — Malone's view
is `400 … not Valid`, not yet published). The 51 MB export failed to reach a session a third time; ⭐ the
decisive point is **not the 10 MB cap** but that the Drive connector returns files as **base64 into context**, so
tranching cannot help. Shipped a **local** aggregator instead (#1040/#1043): grain stays on his machine, salt
outside any repo. First run: **537,908 rows · 42,345 students · CPR/AED = 17,904 DISTINCT students at 106
colleges, 42% of all CPL students.** ⚠️ It also reported a **0.0% disposition rate** — the matcher took a column
named `Status` (workflow stage) over `CPLStatusPlan`, and ⭐ **it was wrong in the direction that looked right**
(median is 4.7%, so it read as a sharper known finding). Cause was **shape not vocabulary**: alternation resolves
to the first COLUMN matching ANY branch. Fixed + value-checked + withholds rather than emits (#1041). Durable:
`methodology-a-wrong-column-is-worse-than-a-missing-one`. Story: `docs/cpl_assistant_lessons.md` §SkyGauge ·
handoff `docs/session_128_handoff.md`.

### SkyNaut — the spec was wrong in four places, and 30 real rows found all of them (2026-08-08, #1049–#1062 MERGED)

Sam's ask was procedural — *"I'll need a little help getting the table curated and up into Supabase."* **`map_student_credit`
is live: 220,588 rows verified against his Access count**, 42,346 students, 111 colleges, reviewer-only, no write policies.
⭐ **Sprint goal 2 is now a number: 60.0% of awarded credit reaches real COURSE credit, 31.8% a GE AREA, 8.2% ELECTIVE; 47% of
all CPL students hold ≥1 area award; 71% of rows have nothing awarded.** The measure is `course_type`'s suffix — durable
precisely because it is **MAP-generated**, while every field that broke mid-build was one colleges type themselves.
⭐ **The whole session's method was: ask for real rows before designing.** The handoff's schema was wrong four ways — a PK
colliding on 8%, `course_type` being 11 values in two vocabularies not 3, the null-sentinel premise holding for only one
variant, and a goal-2 formula that **divides by zero on the entire backlog** (Sam caught that one first). None would have
errored; all would have produced a table that looked right. Two landmines: the handoff's *"same gate as `kb_curation`"* would
have published student grain to anon (**`kb_curation` is world-readable** — writes are gated, reads aren't), and **Supabase's
CSV importer duplicated 2,058 rows while reporting success**, caught only by reconciling counts across the boundary. Durable:
`methodology-a-successful-import-is-not-a-correct-one`, `adr-student-detail-aggregate-disclosure-control` (k=10, write-time
suppression, complementary suppression), `playbook-access-export-to-supabase`.
**Part 2 — the second table, and the number that did not exist.** `map_college_cr_unit` loaded (204,714, reconciled exact) →
⭐ **1,051,870 units of credit at Needs Action, of which 63,991 are ALREADY ARTICULATED** — everything built, nobody acted,
~1,000 degrees' worth. The tab leads with the 64k because the million is a ceiling (~30% of reviewed credit is correctly Not
Applicable). ⭐ Its duplicate-key error was **not a data defect**: the file is provably unique and staged at exactly 204,714 —
Studio re-sent a batch, the same intermittent bug that silently added 2,058 rows to the first load, except this time the
strict table's **PK caught it**. ⭐ Sam pushed back on my asking him for a college lookup — **he was right, it was already in
`map_college_users`**, and checking also produced a better finding: our internal names have **zero** variants (123 names, 120
resolve, 0 differing), so the variation is against EXTERNAL sources. `entity_kind` then revealed **every non-college entity is
at zero awarded credit**. ⚠️ **Sierra reaches none of it yet** and the blocking question is Sam's: may a public assistant state
a named college's unawarded-credit figure? Story: `docs/student_detail_load_lessons.md` · handoff `docs/session_129_handoff.md`.

### SkyMind — the handoff said "no new disclosure decision"; two greps refuted it (2026-08-09, #1064–#1066 MERGED)

Sam: *"I want Sierra to be able to query the new data."* **She does — cpl-chat v36 is live**, answering statewide and
per named college, verified by 68 committed checks and live smoke run 55 (`ALL MODES OK`).
⭐ **The session's whole value was checking the premise before building on it.** The handoff scoped Priority 1 as
low-risk because "the COBI Sierra is INTERNAL" — but all three surfaces (COBI tab, the PUBLIC map.rccd.edu widget,
the Fact Sheet drawer) POST to **one** function, which reads with the **service-role key** (so RLS constrains
nothing) and ships `--no-verify-jwt` (so anyone can curl it). There was no internal Sierra to start with, and what
was written down as *"no new disclosure decision"* **was** the disclosure decision. Sam made it explicitly: per-college
open to all callers. ⭐ Blast radius turned out narrower than either of us assumed — **every non-college entity is
already `suppressed=true`** under k=10, so partner figures cannot be stated at all. Framing is Sam's:
**transparency and truth, framed as opportunity — colleges want to do this work and have not had the visibility.**
⚠️ **I shipped the same defect twice, hours apart: an assertion that fires on CORRECT behavior.** First it printed
`STUDENT GRAIN LEAKED` at a PostgREST statement timeout; then a "tightening" that would have failed Sierra for being
right (measured: of 17 colleges absent from the disposition data, exactly ONE has any exhibits, so "zero" is
approximately TRUE for absent colleges). Both reverted/fixed with positive controls. Durable:
`methodology-rls-is-not-a-gate-in-front-of-a-service-role-function`, `methodology-a-guard-that-fails-on-truth-gets-muted`.
Also: **numbers are computed from the published table, never pasted** — which surfaced that the docs' headline
(1,052,531) was unsourceable against the tab (1,051,870); Sam ruled published-everywhere. Story:
`docs/cpl_assistant_lessons.md` §SkyMind · handoff `docs/session_130_handoff.md`.

### SkyDesk / SkyTime — the handoff's backlog was two-sixths wrong within two days (2026-08-09, #1072/#1073 MERGED)

Sam: *"let's crank!"* **Name: Sam called it SkyTime at greeting and sign-off; it ran as SkyDesk because SkyTime was already Session 104's moniker. Sam's name wins — both are recorded here so either search term lands, the same reconciliation SkyWire/SkyMind got.** ⭐ **The session's value was measuring the handoff's six-item MAP-team backlog before building
on it — fifteen minutes of SQL, and it came back materially different.** "Every governance owner unset" was FALSE
(the team assigned **17 of 17** on Aug 5+7 — the register's own OQ-01 had been answered by people while the document
still listed it as the work); "6 open Sierra feedback rows" was **23**; "56 proposed contact fills" was **14** (42 of
the 56 are colleges MAP already covers); "15 unroutable colleges" was **11**. ⭐ And **7 colleges with no primary
contact had NEVER BEEN LOOKED UP** — Citrus · Canyons · Palomar · Saddleback · Yuba (+2 partner entities) — because
the sweep scoped to *"colleges without a CPL Assistant"*, a **proxy** for the need that diverges on 28% of rows.
Cheapest work on the board: one lookup each. **📥 MAP Team Queue tab LIVE** (#1073) — every item **measured at load**,
never a list; unmeasurable items sit in `kb/map_team_tracked.json` rendering **their own staleness**; a failed read
renders **`unknown` and sorts to the top**, never 0; cleared items stay visible. `buildQueue(sources, now)` is PURE —
**the engine the college-facing briefing must reuse**. Also **#1072**: CI smoke rows out of the Sierra queue, fixed at
the WRITE path (`status='ci'`), 43 backfilled → **23 real open · 4 addressed · 43 CI**. ⚠️ Two test assertions failed
on first run and **both were the assertion, not the code** — one matched a legitimate backfill because it wasn't scoped
to the `ON CONFLICT` clause, the proxy-instead-of-property mistake committed with that KB note open in the same session.
Durable: `methodology-a-written-backlog-decays-silently`, `methodology-a-sweep-scoped-by-a-proxy-leaves-a-shadow`.
Story: `docs/college_action_page_lessons.md` · handoff `docs/session_132_handoff.md`.

## Archived session narratives

### SkyMoon S194 — the sweep is the routine, and a token with no owner (2026-08-25)

**A live session: Sam edited the GR register in a browser while new law landed on it** (#1333, #1334).
⭐ **A save failed with a message blaming his sign-in, and his account was fine.** `gr_history` proved it:
every write that landed has an audit row and his edit had none, so the UPDATE matched nothing. Refresh
tokens ROTATE, and `sync()` said *"this tab has the session: it is the truth"* — so a stale tab published
its consumed token over the live one and signed out every tab. **The freshest token wins now.**
⭐ **Rule 8's read step earned its place**: the surface vocabulary lives in FIVE places, and neither the
scope doc nor the memory row knew all five.
⭐ **SB 135 created Ed. Code Article 9** (§78093–78093.2, eff. 2026-07-13) — **row #2 asks for enacted law**,
four duties no row covers, and one finding cuts AGAINST #12. The register could not cite its own governing
statute until the bands widened to Part 48.
⭐ **Sam named the routine**: *"Your sweep is the routine I want to run on demand after edits"* — and it is
NOT the per-row call widened; three of its findings are structurally invisible per-row.
⚠️ **A client cannot see the cap the server enforces**, and CI cannot either. ⚠️ Four guards were wrong
before the code was, including one that could not fail for a typo.
⚠️ **Sierra moved to Haiku 4.5** at Sam's request (temporary; revert = the `CPL_CHAT_MODEL` secret, no deploy).
He verified it reads well; the one smoke regression is mode 15a dropping the Not-Applicable ceiling caveat —
the rule exists, so it is a COMPLIANCE gap, and the fix is to attach the caveat to the DATA not a distant rule.
Story `docs/gr_register_lessons.md` · `docs/gr_sb135_row_sweep.md` · handoff `docs/session_195_handoff.md`.

### SkyCal S189 — the drag was reachable at last, and it had never worked (2026-08-24)

**Sam: *"let get this moonshot on the way"*** — step 1 of the approved drag re-home (#1317).
⭐ **101,063 member courses reached the graph** in a SECOND 2.5 MB payload; the record is
`[control_number, code, college index]` and carries **no title** (9.9 MB dicts · 5.5 MB with
title · **2.5 MB without**, and the list renders code + college). Merge-chain resolution was
already done upstream — a join, not a build.
⚠️ **THE VERB COULD NOT BE COMPLETED WITH A MOUSE.** `pointerdown` clobbered the carried
course before `pointerup` could read it, so **Drag… → click the destination** selected the
destination and moved nothing. Unobservable until the data landed: no course on screen, no
drop to attempt. **That is the other half of what zero `CN:` rows meant.**
⚠️ **Three of the harness's first four failures were the HARNESS** — a canvas center cached
before `cvs.focus()` scrolls it, an assertion that a DROP changes the selection (it does not;
the write line naming the destination is the proof), and a click that never asserted which
node it hit. **A check written against an unwalked path is itself unwalked**
([`a-blocked-path-hides-the-defects-behind-it`](docs/kb-notes/methodology-a-blocked-path-hides-the-defects-behind-it.md)).
⚠️ **`nd.n` is not a college count** — `ESOL M9168` read *"1,152 colleges"* in a system with
123, and it disagrees with the carried members on **3,399 of 16,242** rows; both shown now.
⚠️ **1,122 control numbers sit under >1 identity**, so a move is GLOBAL and leaves every card.
Story `docs/ccr_atlas_lessons.md` · handoff `docs/session_190_handoff.md`.


### SkyGlass — the windows were never the test's to free (2026-08-20, Session 176)

**Merged #1272.** Sam handed on SkySort's open call: the 8,192 → 12,288 MB cap raise bought headroom, it did not fix a **2,955-line file holding 61 jsdom windows in one process**.
⭐ **A BOOTED jsdom window retains ~44 MB and is never released for the life of its process; an UNBOOTED one costs nothing** (15 = 57 MB total, collected). `window.close()`, nulling, block-scoping, an IIFE and awaiting a turn are ALL no-ops. Heap snapshots name the retainers: `(Stack roots)` — the suite's own still-running top-level frame — and, once an IIFE removes that root, `(Micro tasks)`, a promise reaction holding `boot()`'s `onDOMContentLoad` closure on a queue a long synchronous file never drains. **The only event that reclaims a window is the PROCESS ENDING**, which `tests/run.js` already gives every file — so peak memory is set by the window count of the LARGEST FILE and splitting was the only cure. Nine suites: **575 → 575 assertions, peak RSS 8,642 → 2,393 MB**, 462 s → 333 s. Bodies moved verbatim by line range, verified line-for-line. **Budget: ~44 MB per booted window over a ~40 MB floor; past ~15 windows, start a new suite.**
⚠️ **A loop-shaped probe cannot reproduce a block-shaped file** — booting in a `for` loop and measuring afterwards shows the memory coming back, because the frame returned. Three probes said "no leak" before one shaped like the real file said 925 MB.
⚠️ **`kb/cpl_todos.json` had been sitting on `main` with raw merge-conflict markers**, committed by #1268 where two parallel Session-173 sessions each rewrote the feed. Invalid JSON → the 📋 button had nothing to read on any tab, and it **fails soft by design**, so it simply did not appear. Underneath it, an older one: the feed writes `for:` and `cpl_todos.js` grouped on `it.who` — `byWho[undefined]` is a valid key, so the panel rendered ONE **"For Undefined"** section and **the suite passed because its fixture used the spelling the code read**. Both guarded now, each guard verified to fail first, plus a repo-wide conflict-marker scan.
✅ **Sam confirmed in a private window that Curate is hidden from the public** (2026-08-21) — the #1269 mechanism is proven end to end. A reveal that persists in the curator's own browser is BY DESIGN (`?curate=0` forgets it), and is the first thing to rule out when someone reports the button "still showing".
Durable: [`methodology-a-test-file-is-a-memory-budget`](docs/kb-notes/methodology-a-test-file-is-a-memory-budget.md) · story `docs/cpl_funding_lessons.md` · handoff `docs/session_177_handoff.md`.


### Sky167 — the tab was fine, the key was a ghost (2026-08-17, Session 167)

**Three merges — #1232, #1233, #1234.** Sam: *"all the colleges are coming up blank on this."*
⭐ **`getSession()` read a storage key nothing has ever written** (`cpl_team_session`, one occurrence in the
repo — the read itself), so neither the reviewer session nor the team phrase reached the server, and **an
RLS-filtered SELECT answers 200 + `[]`** — every gated figure read as "this college has nothing", on every
college, while the public reads beside them kept the tab looking healthy. The data was never missing.
⚠️ **The 232-check suite signed in via the broken path and stubbed fetch** — it exercised the defect every run.
Assert HEADERS when no rendered state can tell the bug from the truth.
Then Sam's seven asks: the tab now opens on a **scope question**, Sierra is a **collapsible section expanded by
default**, and the briefing is a **docx that READS THE RENDERED DOM** so it cannot drift from the screen.
⚠️ **Two of five scopes ship disabled with their reason** — and the region data we hold is a *third* scheme
(`college_geo` is a proximity map; SWP has 8 consortia, ASCCC has 4 areas), so a test pins that it stays unwired.
Story: `docs/college_action_page_lessons.md` · `docs/sierra_surface_alignment_lessons.md` · handoff
`docs/session_168_handoff.md`.


### Sky160 — the manager could not see two of its own items (2026-08-15, Session 160)

Three merges (**#1212**, **#1213**, **#1214**) against Sam's six questions; four were advisory.
⭐ **`cobi_nav` HOLDS 43 ROWS, SAVED BY SAM AT 13:59 UTC** — the "unproven in a real browser" item three
handoffs called Priority 1 was closed by *reading the table*. The answer had been sitting there for hours.
⭐ **SHARE WAS TWO MENU ITEMS THE MANAGER COULD NOT SEE** — synthesised from anchors with no `data-tab`, so the
page looked complete while omitting part of what it manages. Widening the set made three rules lie, each
confidently: the site filter would have HIDDEN both, and "Not checked" would have RISEN by two the day they
became visible. ⭐ **THE GUARD WAS ON THE WRONG AXIS** — `plan()` already lifts Admin out of a hidden group, so
barring it from every category was a second belt over a sealed door; `GROUP_LOCKED` now holds dashboard alone.
⚠️ **THE FALLBACK TAB WAS `valid[0]`, NOT `dashboard`** — DOM order became curator-editable when Admin shipped, so
dragging anything to the top silently changed where every broken link lands.
⚠️ **THE NO-GLYPHS RULE WAS IN `cpl_memory` FROM 2026-08-14** and the tab shipped covered in emoji that same week.
⚠️ **The "check that never registers" trap reappeared in a SECOND harness within 24 hours** — both pre-fix runs
printed ZERO failures because an unguarded deref threw. A fix to one harness is not a fix to the practice.
Story: `docs/admin_tab_lessons.md` · durable [`methodology-a-manager-must-show-everything-it-manages`](docs/kb-notes/methodology-a-manager-must-show-everything-it-manages.md) · [`methodology-a-live-rename-must-be-order-proof`](docs/kb-notes/methodology-a-live-rename-must-be-order-proof.md) · handoff `docs/session_161_handoff.md`.


### Sky155 — the rule that could not be obeyed, twice (2026-08-14, Session 155)

Five PRs (**#1184**, **#1185**, **#1186**, **#1187**, **#1188**), all merged; `cpl-chat` at **v51**.
Sam tested live throughout and every fix came from a real report.
⭐ **`sierra_rules` IS LIVE — Priority 1 of the ADR.** The ten built-in prompt rules are now a
registry with `sort_order` + `applies_when`, overlaid by a reviewer-only table that **never
replaces** code defaults: a failed read costs the *edits*, never the *governance*. Proven
**byte-identical** to the old hand-concatenated chain across all 16 context combinations.
`applies_when` is a KEY into a code-side predicate map — curators pick a context, they never write
logic into data. The **protected set** (`portal`, `landing_page`, `volume`, `credit_status`) always
ships its code body and ignores `active=false`, because gutting a body removes a guard as
effectively as disabling it. `chat_interactions` now records `rules_fired`/`rules_overridden`.
⭐ **THE SAME BUG SHAPE, ONE LAYER ALONG.** `STATEWIDE_RULE` asks for a `college | credit | landing
page` table; `renderAdopters()` emitted names and **no URLs**, and the rule says never guess a link
— so **Sierra was obeying exactly** and her own fail-safe produced the empty column.
`landing_page_url` had been populated for 123 of 130 colleges all along: the **fourth** instance of
curated-data-nobody-reads. The LOCAL branch also printed a bare count, silently dropping Lemoore
and Riverside.
⭐ **AN AUTHOR `display` RULE DEFEATS `[hidden]`.** Send note *did* call `hidden = true`;
`display:flex` made it inert. Worst of the four defects: the confirmation was **unconditional**, so
a note that never saved was thanked for — which also made the obvious fix (allow a note with no
rating) *wrong*, since the RPC raises on a null rating and the error was swallowed.
⚠️ **Four red checks on `main` were stale test BOUNDS, not defects** — a character window that
stopped covering a grown function, an `await` spelling after a `Promise.all` move, a cap pinned to
500 after it became 1500, a missing extraction dependency. **A red check nobody can act on is how a
real one gets missed.** Two suites also broke invisibly because the sandbox has no `node_modules`.
Story: `docs/sierra_rules_lessons.md` · handoff `docs/session_156_handoff.md`.


### SkyBridge — Sam drove the design live, and eleven steers later My College works (2026-08-11, Session 140)

Shipped **#1117** (funding box · 72-district picker · Ask Sierra), **#1118** (the transcribed correction) and **#1119**
(**Sierra AI embedded at the top**, pickers inside it, per-college computed questions, and **"Who MAP has on file"**).
Tests **49 → 104**. Mock (all real figures): `https://claude.ai/code/artifact/aa252c19-bdd3-485b-980c-1fed3a3edc7f`.
⭐ **The handoff's own worked figure was wrong** — an allocation is an iterative **floor waterfall**: 50 of 115 colleges
pinned at $150K, and the floor's **$1,999,687** comes out of the same pool, so a flat share is wrong for the floored
colleges *and* for those it never touches (Bakersfield off by $11,340). Never re-derive; call `_alloc()`.
⭐ **Sam's rulings:** "transcribed" in MAP is a **MARK**, not a posting — the college forwards the plan to **A&R, who
enter it in the SIS by hand; there is no SIS integration**; Priority 3 routing is **standard practice, not gaming**;
use the **funding tab names**, never "$35M"; **show contacts** on a college's own view; **"Sierra AI"**, not Sierra.
⭐ **A percentile bar would hand a top-5% badge to a 21-student college** (Compton 96th on 21 vs Chaffey 97th on 1,495;
median 4.5%, **16 tied at zero**). The tier system already exists — **Leading 14 / Advancing 89 / Inactive 12** — and
**77% sit in one bucket**; fix is *"Advancing — 2 of 5"* with the missing criteria named, not a new scheme.
⚠️ **A MAP↔MIS side-by-side will mostly show MIS ABOVE MAP** (87 of 111 have marked zero transcribed) — the *stronger*
anti-"double work" argument. Durable: `methodology-reuse-the-model-not-its-formula`,
`methodology-a-safe-fallback-is-caller-specific`. Story: `docs/college_action_page_lessons.md` · handoff
`docs/session_141_handoff.md`.

### Sky -- the vault was never slow, and five diagnoses needed correcting (2026-08-09, #1071-#1083 MERGED)

Sam asked which of ten "Claude + Obsidian memory" repos to adopt. Answer: **one** (kepano's skills, now
committed to BOTH repos so remote sessions and the team get them -- a laptop install reaches neither).
The real finding: eight of ten solve *retrieval*; this corpus's problem is **accretion**. Shipped
`kb/_docs_audit.py`, the docs **lint** pass, as step 0 of `/checkpoint` -- `superseded_handoff`,
`frontmatter_log_chain` and `kb_note_frontmatter` all now **0**. Vault clone **1,037 MB -> 10.2 MB**
via a docs-only sparse checkout; sync now hourly with **no console window** (an S4U principal --
`-WindowStyle Hidden` was never the fix). COG skills **22 -> 16** (8 structurally unable to run: every
integration Disabled in `MY-INTEGRATIONS.md`); kept `daily-brief`/`weekly-checkin`/`onboarding` because
**broken != unused**. + **The vault was never slow -- GRAPH VIEW was blank, for two weeks, unreported.**
And the SIZE fixed it, not the `linkDistance: 250` I blamed: 418 MB of `row_audit` MARKDOWN loading into
the metadata cache. **`linkDistance: 250` is still live** (default 30) -- next session's cheapest win.
**Three bugs surfaced only on Sam's hardware**: a missing `/scripts/` sparse pattern that would have
deleted the Task Scheduler's own target and silently killed vault sync, a 60-second silent hang, and em
dashes that made all three `.ps1` unparseable under PowerShell 5.1 (ASCII guard now committed). Durable:
`methodology-a-knowledge-base-needs-a-lint-pass`, `playbook-keep-build-artifacts-out-of-the-vault`,
`methodology-the-plausible-cause-is-not-the-measured-one`.
Story: `docs/vault_sync_lessons.md` - handoff `docs/session_134_handoff.md`.

---

### SkyHigh — the sweep method is gone, and the action library was already written (2026-08-09, #1078 MERGED)

Sam: *"let's pick up the string."* **#1078** closed the cheapest item on the queue — the **seven colleges**
SkyTime found had never been looked up. Five have a candidate address (Yuba · Citrus · Palomar · Saddleback ·
Futuro Health), two are blank-with-a-finding (Canyons publishes only a *technical*-support inbox; Launch has an
interest form only). Queue: never-looked-up **7 → 0**, search-only **0 → 7**, proposals (14) and empty (4)
**unchanged** as the control. ⚠️ **None is verified, and that is structural: sessions are egress-blocked from
college domains** (`curl` → `000`). So this doc's standing offer that the other **52 colleges** could get "the
same grind if wanted" **is no longer true** — that needs a human, a differently-egressed runner, or a curator.
The addresses did NOT go in as `via: "web"`: a tier is a claim about METHOD, and Jessica's rules are rules about
what a PAGE shows — 2 of the previous 71 published only a mental-health inbox, invisible from a snippet. New
`via: "search"` tier, refused by `proposedFillFor()` **in code**. ⭐ **The action library the roadmap called "the
hard part" already exists** — Supabase `cpl_funding_config` Scenario 1 Year 1 holds **23 team-typed strategies**.
⚠️ **And the overlay this file calls "currently EMPTY" is not**: live Scenario 1 is **50/30/20**, not the
documented 30/42/28 (real path `…scenarios."Scenario 1".yearPriorities."1"`, camelCase, three levels deeper than
the `config.year_priorities` this file used to claim). ✅ **🏫 COLLEGE BRIEFING SHIPPED (#1086)** — Sam chose
**Scenario 1 / Year 1**; it walks **every project** in the config so the **$50k / ESS 25-82** strategies wire in
with no code change when he writes them, names any program it could not read, and renders the 3 measurable
strategies as **fractions** and the other 19 as advice with **no score**. ✅ **Y1 ≡ Y2, byte-identical, 22
strategies each** — Sam: *"a 2-year project with unchanging priorities"*, **"Year 1 is the authoritative set"**;
a year selector over this config is now inert, so build no year-specific logic. ⚠️ **I broke a good number and
put it back (#1087 → #1088):** dormant-unsuppressed **1,052,531 is correct**, scoped to `entity_kind='college'`;
I "corrected" it to an all-entities 1,053,332.50 while leaving articulated college-scoped — **never change one
half of a pair alone**, and the real defect was that the figure shipped **without its scope**. ⚠️ **Unidentified
entity 122** (117 students, 417.00 units) is **inside the published total** — k-anonymity hid the other four
non-colleges only because they were tiny; **suppression is not a type filter**. Durable:
`methodology-a-tier-must-encode-what-you-could-not-check`, `methodology-verify-the-last-hop-of-a-resolution-chain`.
**Open for Sam (all small, deferred to 2026-08-10):** 4 curator typos (now ×2 via the mirror), Y1's borrowed P3
description, 5 contact confirmations, and the 122 call.
Story: `docs/map_users_lessons.md` · `docs/college_action_page_lessons.md` · handoff `docs/session_133_handoff.md`.

*(archived from `CLAUDE.md` §11 at the 2026-08-10 checkpoint — Rule 8 keeps at most 2 session narratives inline.)*

---

### SkyLine — the naming layer already existed; Sierra just couldn't see it (2026-08-10, #1091-#1094 MERGED)

Sam: *"Sierra's access to student-level data"* — then a real transcript where Sierra said exhibit-level
student counts *"aren't available."* ⚠️ **Both premises were wrong.** (1) Not an access problem: only
**6.1% of student rows are nameable** (student grain is **ACE military ids** `AR-`/`MC-`/`NV-`/`NER-` +
32,360 `Default *` sentinels; Sierra's catalog is `MAPICI-*`; overlap **624 of 6,280**). Control: CPR/AED,
**17,904** students locally, reproduces as **17** through the obvious join — three orders of magnitude,
silently, from real tables. The naive fix is WORSE than today's honest "I don't have that". (2) The naming
layer **was already built and curated** by `map@rccd.edu` — POST folds **16** freehand titles into
`POST Basic Academy` with the ASCCC rec and **32 adopters vs 71 potential, zero overlap**. It never reached
the DB Sierra queries. **A publish step, not a build** — third session running where the best catch came
from reading a committed artefact. Shipped: **k=10** floor (#1091/#1093 — the real defect was the mask
`"<5"` hard-coded in **8** places, one printing the live floor beside a stale label), **1,987 credentials
live** in `chatbox_credentials` (#1092, 0 suppressed counts leaked), **CRED·STD retrieval** (#1094).
⭐ **A route's purpose changes its ranking** — three passes, each failure informative; the sharp one is that
length-normalized similarity makes **the best-curated records rank WORST** (POST's 16 variants diluted it
below a rival with two). ⚠️ **Sam's "students with Applied Credits > 0" is NOT computable** — the four credit
columns are NOT in the 5-column export and never were (my "dropped at load" was a wrong inference, corrected
same day); the raw `TblSOURCE` — 537,908 rows — has them. A re-load, not a
Malone dependency. ⚠️ **MAP has no "Apprenticeship" CPL type** (6 values only) — any such filter returns 0
and reads as "we do none". Durable: `methodology-a-concatenated-haystack-penalises-your-best-record`,
`methodology-emit-the-threshold-with-the-label-it-prints`.
Story: `docs/sierra_credential_naming_lessons.md` · handoff `docs/session_135_handoff.md`.

### SkyDeck — the busy slides were screenshots, and they were clipping their own tables (2026-08-10, not a PR)

Sam asked for a calmer version of the CAC deck's three pre-apprenticeship→baccalaureate pathway slides
(13 Aug, California Apprenticeship Council: trade reps, employers, CCC/state, **DAS**). ⭐ **All three were
single full-bleed PNGs** — every word pixels, nothing editable or accessible — **and their course tables ran
off the bottom edge of the slide**, so rows below the fold were never visible to anyone, including the author.
Busyness was the symptom; reference data pasted into a narrative slide was the cause. 3 slides → 6, native
shapes on the deck's own master: a **spine** slide with a 120-unit credit ladder (CPL = 26–38 of the 60 in the
associate, which satisfies the first 60 of the bachelor's), three trade slides each built in **3 clicks**
(*the road → who does what → what it's worth*), two **appendix** crosswalks, originals kept as **hidden**
slides. ⚠️ **The transcription caught two live data defects**: Carpentry's visible courses total **20.0 units**
vs **26** cited, Cerritos **31.5** vs **38** (American River reconciles exactly at 29.5) — printed as caveats on
the appendix so no number can be quoted without its flag; **still open with the two colleges**. Then speaker
notes for all 15 slides + a printable run sheet, **13:00 of script inside the 15:00 slot**, every figure live at
2026-08-10 13:50 UTC (**49,696 CPL students / 589 apprentices** = 1.2%, the runway number; **45 colleges could
adopt an existing Fire Technology statewide exhibit today**). ⭐ **Sam corrected the pre-apprenticeship framing
and that is the durable output**: a pre-apprentice earns CPL from **noncredit coursework**, **industry
certifications**, and — the one nobody names — **clearing admission requirements for the apprenticeship
itself**, which speeds *entry* not just completion; the Ironworkers slide's stage 1 already showed the first
two. ⚠️ **Verify before the 13th**: the **44% apprentice-withdrawal** figure is NOT ours (a CTE policy source
citing DAS, with DAS in the room — attribute, don't assert). Durable:
`methodology-rebuild-a-flattened-diagram-as-a-built-slide`, `reference-cpl-at-the-pre-apprenticeship-stage`.
Assets `presentations/cac_2026-08/` (decks not committed — 27 MB each).
Story: `docs/cpl_presentations_lessons.md` · handoff `docs/session_136_handoff.md`.

### SkyLine — the student re-load landed, and two "applied" measures came apart (2026-08-10, Session 137)

Re-loaded `map_student_credit` from **`TblSOURCE`**: **537,908 rows / 16 columns**, live, reviewer-only, prior table kept
as `_prev`. ⭐ **The swap was licensed by a set identity, not a hope**: `(college_id, student_key, course_type)` identical
old-vs-new (81,007 triples, **0 diff**), so `map_college_goal2.students` + every suppression decision provably could not
move — and after rebuild they didn't (0 diff, all 3 file assertions 0); `map_college_credit_summary` **byte-identical**
(1,051,870.00 / 63,991.00). Collapsing to the old 5 columns reproduces **220,588 exactly**; Needs Action reproduces
**1,053,332.50 to the cent**. ⚠️ **The Studio CSV importer duplicates — third time measured** (0.9% / 1.5% / 1.05%);
re-importing does NOT fix it, which is why `source_row_id` is mandatory (all 5,671 dupes byte-identical, 0 conflicts →
dedupe lossless). ⚠️ **`Default Area` is NOT MAP data** — 0 rows in the raw extract; the prior load synthesised it for
18,127 null-exhibit rows, so the documented "32,360 `Default *` sentinels" was part invention. Same family as the
`dropped at load` error: **a load-time transformation becomes, one document later, a stated fact about MAP.**
⭐ **I recommended re-basing the Goal 2 share on distinct students because it's provably grain-invariant (96/96
unchanged) — Sam asked to see the colleges first and the data killed it: that measure saturates at exactly 100.0% for
34 of 96.** Grain-invariance is a property, not a virtue; check a measure still *discriminates* before preferring it for
stability. Rows-based share kept — its movement (43 of 96, 38 of them UP) is a correction, since the old export collapsed
multi-course-recommendation exhibits. Durable: `methodology-a-grain-invariant-measure-can-still-be-the-wrong-one`,
`reference-batch-uploaded-transcribed-credit`. Story: `docs/student_detail_load_lessons.md` · handoff `docs/session_138_handoff.md`.

### SkyRoute — the answer that looked like a search failure, and the leak the checkpoint caught (2026-08-10/11, Session 138)

Sam pasted a live transcript: Sierra said no statewide CCC recommendation for CompTIA *"has been adopted yet"* — **MAP holds
ten** — then listed A+/Network+/Security+/Cloud+/CySA+ from world knowledge. ⭐ **The list was CORRECT, which is worse than
wrong**: a reviewer files no bug, so it survives to a question where the guess misses. ⭐ **Retrieval was never at fault** —
one query proved it, and had the fix followed the accusation it would have rewritten a working function. The gap was the
half Sierra stated honestly: no per-credential student numbers. Shipped **CRED·VOLUME + COLLEGE·ADOPT** (#1113, **v38
deployed, smoke-tested against v38 not v37**): bridge `exhibit_id`→`raw_variants`→`unified_title`, **1,886 of 2,050 fold**;
CompTIA A+ **115 students / 7 of 21 colleges**; **120 colleges** have adoption opportunities (avg 126).
⚠️ **I shipped a disclosure leak and only the checkpoint found it.** Row-level suppression passed its assertion the whole
time while units summed: `statewide − Σ(published siblings)` recovered a lone hidden cell **exactly** (AP Chemistry
755.00−695.00 = **60.00**, 12+ credentials). ADR decision 5 had required complementary suppression two days earlier.
**A suppression test must model the ATTACK, not the field.** Fixed (16 complement cells); both assertions now committed.
Also: two CI checks were **already red on `main`** (pinned argument order, non-required so nobody saw), and the 14 colleges
at **100%** on the Course Credit tab carry **155,153 dormant units** — Sam: *"makes me think I can check the box and be
done."* Durable: `methodology-a-retrieval-miss-and-a-data-gap-look-identical`,
`methodology-publish-the-denominator-with-the-number`, `methodology-assert-the-contract-not-the-argument-order`,
`methodology-order-the-post-deploy-check-after-the-deploy`.
Story: `docs/sierra_credential_naming_lessons.md` · handoff `docs/session_139_handoff.md`.
