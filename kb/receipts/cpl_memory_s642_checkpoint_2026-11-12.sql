-- S642 (SkyKestrel, the conductor), 2026-11-12: the Rule 9 checkpoint's cpl_memory rows (step 10): the conductor's
-- seven decisions, Sam's two in-session rulings not yet in a row, and two lessons. Conductor rows status proposed, for
-- Sam to revise on the next sheet; Sam's two verified, verified_by Sam Lee.
-- Drafted by the documents worker; the conductor ran the same rows at 15:09Z 2026-11-12 through the Supabase MCP as one
-- VALUES insert, and all 11 slugs returned. Every summary counted at drafting: at most 400 characters.
-- One INSERT-only statement, author 'SkyKestrel (S642)', on conflict do nothing.
-- ROLLBACK:
--   delete from public.cpl_memory where author = 'SkyKestrel (S642)' and slug in (
--     'd-ghost-delete-sync-carries-names-first-s642',
--     'd-ghost-delete-230-on-plan-s642',
--     'd-side-panel-folds-reuse-rename-rows-s642',
--     'd-alignment-line-same-issuer-s642',
--     'd-first-light-tab-read-only-first-s642',
--     'd-reclustering-placement-s642',
--     'd-ghost-delete-small-cell-k10-s642',
--     'sam-sierra-no-images-for-now-2026-11-12',
--     'sam-side-panel-change-related-titles-2026-11-12',
--     'p-read-pr-thread-before-merge-s642',
--     'p-check-ledger-floor-fails-new-tests-s642');
insert into public.cpl_memory (slug, kind, title, summary, detail, plain, tags, status, source, verified_by, verified_at, event_date, author, related)
select x.slug, x.kind, x.title, x.summary, x.detail, x.plain, x.tags, x.status, x.source, x.verified_by,
       case when x.verified_by is null then null else now() end, x.event_date::date, 'SkyKestrel (S642)', coalesce(x.related, '{}'::text[])
from jsonb_to_recordset($json$[
 {
  "slug": "d-ghost-delete-sync-carries-names-first-s642",
  "kind": "decision",
  "title": "Before a ghost delete the sync carries each retired name to its successor",
  "summary": "The S642 conductor, 2026-11-12 (#3158, #3166): credential-catalog-sync adds each retired name to its successor's raw_variants before any ghost delete, and apply holds a ghost until every successor carries it; an absent case-only successor holds too (COBIx's finding). Undo of the delete: chatbox-ghost-delete.yml mode=undo.",
  "tags": [
   "sierra",
   "cer-procedures",
   "conductor",
   "decision"
  ],
  "source": "Session call, S642 (SkyKestrel, the conductor, session 01Rvwe2XyXXS6P7ZCAqiG4va); docs/reference/lanes/cer-procedures.md",
  "related": [],
  "status": "proposed",
  "verified_by": null,
  "event_date": "2026-11-12",
  "detail": null,
  "plain": null
 },
 {
  "slug": "d-ghost-delete-230-on-plan-s642",
  "kind": "decision",
  "title": "Sierra's 230 ghost rows deleted on a plan of 7.8% of the live rows",
  "summary": "The S642 conductor, 2026-11-12, on Sam's Sheet 183 card 6 (\"delete\"): plan 13:37Z read 2,949 live rows against a reference of 2,719, 230 ghosts, none held; apply 13:46Z, live 2,719 after by a fresh count. 148 of the 230 had no recorded rename. Receipt and undo: kb/receipts/chatbox_ghost_delete_2026-11-12T13-37-23Z/.",
  "tags": [
   "sierra",
   "cer-procedures",
   "rule-10",
   "decision"
  ],
  "source": "Session call, S642 (SkyKestrel, the conductor, session 01Rvwe2XyXXS6P7ZCAqiG4va); kb/receipts/chatbox_ghost_delete_2026-11-12T13-37-23Z/applied.json",
  "related": [],
  "status": "proposed",
  "verified_by": null,
  "event_date": "2026-11-12",
  "detail": null,
  "plain": null
 },
 {
  "slug": "d-side-panel-folds-reuse-rename-rows-s642",
  "kind": "decision",
  "title": "A side-panel title change writes the rename batch's own fold rows",
  "summary": "The S642 conductor, 2026-11-12 (#3160): the Exhibits Review side panel changes related titles by writing the rename batch's rows (_CREDENTIAL_REVIEW::<title>, unified_title_override plus unified_title_merge_confirm naming the target), after a fresh live read; no new row kind. The List's Edit back clears both rows (COBIx's finding).",
  "tags": [
   "cer-procedures",
   "exhibits",
   "kb-curation",
   "decision"
  ],
  "source": "Session call, S642 (SkyKestrel, the conductor, session 01Rvwe2XyXXS6P7ZCAqiG4va); docs/reference/lanes/cer-procedures.md",
  "related": [],
  "status": "proposed",
  "verified_by": null,
  "event_date": "2026-11-12",
  "detail": null,
  "plain": null
 },
 {
  "slug": "d-alignment-line-same-issuer-s642",
  "kind": "decision",
  "title": "The Review card names only a same-issuer statewide or most-used title",
  "summary": "The S642 conductor, 2026-11-12 (#3160 review): the card names a statewide or most-used title only when it shares the card's issuer, and names none when several statewide titles compete without a lead of 3 times the next one's local titles. The review measured three wrong names before it (Carpenters to Cabinetmaker, SMART sheet metal to SMAW, UA refrigeration to ESCO).",
  "tags": [
   "cer-procedures",
   "exhibits",
   "decision"
  ],
  "source": "Session call, S642 (SkyKestrel, the conductor, session 01Rvwe2XyXXS6P7ZCAqiG4va); docs/reference/lanes/cer-procedures.md",
  "related": [],
  "status": "proposed",
  "verified_by": null,
  "event_date": "2026-11-12",
  "detail": null,
  "plain": null
 },
 {
  "slug": "d-first-light-tab-read-only-first-s642",
  "kind": "decision",
  "title": "The First Light tab shipped read-only; editing is phase B",
  "summary": "The S642 conductor, 2026-11-12 (#3162): the First Light tab (#first-light: paintings, photos, sierra) shipped read-only, with library/photos/hero_photos.json the one hero list and a drift test. Phase B, designed on #3153 (comment 6826461825): a marks table, Apply opens a PR, the queue writes the words. cobi_nav row first-light set to magic_link 14:29Z.",
  "tags": [
   "first-light",
   "admin-tab-side-menu",
   "conductor",
   "decision"
  ],
  "source": "Session call, S642 (SkyKestrel, the conductor, session 01Rvwe2XyXXS6P7ZCAqiG4va); docs/reference/lanes/sierra-page-redesign.md",
  "related": [],
  "status": "proposed",
  "verified_by": null,
  "event_date": "2026-11-12",
  "detail": null,
  "plain": null
 },
 {
  "slug": "d-reclustering-placement-s642",
  "kind": "decision",
  "title": "M-ID re-clustering sits under the plan's priorities 2, 3 and 7; a model pass is priced first",
  "summary": "The S642 conductor with COBIx, 2026-11-12 (#2962): re-clustering by outcomes sits under the moonshot plan's priorities 2, 3 and 7. Step 1 (#3165) writes nothing and reports 1,857 M-IDs: 557 confirmed, 760 split, 221 merge candidates, 319 not enough text; six cases wait for Sam. A second pass with a model is priced before it runs.",
  "tags": [
   "commons",
   "m-id",
   "conductor",
   "decision"
  ],
  "source": "Session call, S642 (SkyKestrel, the conductor, session 01Rvwe2XyXXS6P7ZCAqiG4va); docs/reference/lanes/commons.md",
  "related": [],
  "status": "proposed",
  "verified_by": null,
  "event_date": "2026-11-12",
  "detail": null,
  "plain": null
 },
 {
  "slug": "d-ghost-delete-small-cell-k10-s642",
  "kind": "decision",
  "title": "A delete receipt refuses a before-row under the disclosure floor",
  "summary": "The S642 conductor, 2026-11-12 (#3166, COBIx's finding): the ghost-delete plan refuses to write plan.json when a before-row carries a students_served count from 1 to 9, or is suppressed with a count; the floor is the disclosure ADR's k = 10 (SERVED_SUPPRESS_BELOW). Refuse, never null: a nulled receipt would leave undo unable to restore the row.",
  "tags": [
   "sierra",
   "privacy",
   "rule-10",
   "decision"
  ],
  "source": "Session call, S642 (SkyKestrel, the conductor, session 01Rvwe2XyXXS6P7ZCAqiG4va); docs/kb-notes/adr-student-detail-aggregate-disclosure-control.md",
  "related": [],
  "status": "proposed",
  "verified_by": null,
  "event_date": "2026-11-12",
  "detail": null,
  "plain": null
 },
 {
  "slug": "sam-sierra-no-images-for-now-2026-11-12",
  "kind": "decision",
  "title": "Sierra shows no images for now",
  "summary": "Sam, in session S642, 2026-11-12, on applying his gallery marks: \"no images on sierra for now so not impacted.\" The First Light marks (#3159) change the COBI rotation only; Sierra's set and sierra/art/manifest.json stay as they are.",
  "tags": [
   "first-light",
   "sierra",
   "decision"
  ],
  "source": "Sam, in session S642 (verbatim)",
  "related": [],
  "status": "verified",
  "verified_by": "Sam Lee",
  "event_date": "2026-11-12",
  "detail": null,
  "plain": null
 },
 {
  "slug": "sam-side-panel-change-related-titles-2026-11-12",
  "kind": "decision",
  "title": "Change related titles to the statewide title from the side panel",
  "summary": "Sam, in session S642, 2026-11-12, on the Firefighter Academy card: \"I would like to be able to change all those needing it to firefighter 1 in the sidebar.\" and \"yes and i need to be able to use this title on the sidebar candidates that need it:)\" Built in #3160.",
  "tags": [
   "cer-procedures",
   "exhibits",
   "decision"
  ],
  "source": "Sam, in session S642 (verbatim)",
  "related": [],
  "status": "verified",
  "verified_by": "Sam Lee",
  "event_date": "2026-11-12",
  "detail": null,
  "plain": null
 },
 {
  "slug": "p-read-pr-thread-before-merge-s642",
  "kind": "pitfall",
  "title": "Read a PR's own thread, and every thread COBIx touched today, before merging",
  "summary": "S642, 2026-11-12: the conductor merged and ran #3158 without reading COBIx's 13:13Z note on that PR; his two findings became #3166 after the delete. Sam had to point at #3111 and #2962. Read each PR's comments to the last page before merging, and #3110, #3111 and every issue COBIx touched today at start and each wake.",
  "tags": [
   "conductor",
   "cobix",
   "merge",
   "pitfall"
  ],
  "source": "docs/reference/conductor_mode.md (What went wrong in S642)",
  "related": [],
  "status": "proposed",
  "verified_by": null,
  "event_date": "2026-11-12",
  "detail": null,
  "plain": null
 },
 {
  "slug": "p-check-ledger-floor-fails-new-tests-s642",
  "kind": "pitfall",
  "title": "A ledger at its line fails every PR that adds a test",
  "summary": "S642, 2026-11-12: three PRs failed suite (6) for one reason: tests/check_ledger.test.js needs each new test file's floor in tests/check_floor.json, and main sits at the 60% line. Briefs that add a test say so, and run only the tests touching their files plus check_ledger, pages_size_guard and the nav inventory tests; CI runs the rest.",
  "tags": [
   "conductor",
   "tests",
   "governance-team-enablement",
   "pitfall"
  ],
  "source": "docs/reference/lanes/governance-team-enablement.md",
  "related": [],
  "status": "proposed",
  "verified_by": null,
  "event_date": "2026-11-12",
  "detail": null,
  "plain": null
 }
]$json$::jsonb) as x(slug text, kind text, title text, summary text, detail text, plain text, tags text[], status text, source text, verified_by text, event_date text, related text[])
on conflict (slug) do nothing
returning slug, char_length(summary) as summary_chars;
-- Verify:
select slug from public.cpl_memory where author = 'SkyKestrel (S642)' order by created_at;
