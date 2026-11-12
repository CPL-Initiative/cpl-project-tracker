-- S640 (SkyHeron, the conductor), 2026-11-12: the Rule 9 checkpoint's cpl_memory rows (step 10): the conductor's
-- five decisions (status proposed, for Sam to revise on Open Asks Sheet 182) and five lessons worth a row.
-- One INSERT-only statement under author memory-s640-checkpoint-2026-11-12.
-- ROLLBACK:
--   delete from public.cpl_memory where author = 'memory-s640-checkpoint-2026-11-12';
insert into public.cpl_memory (slug, kind, title, summary, detail, plain, tags, status, source, verified_by, verified_at, event_date, author, related)
select x.slug, x.kind, x.title, x.summary, x.detail, x.plain, x.tags, x.status, x.source, x.verified_by,
       case when x.verified_by is null then null else now() end, x.event_date::date, 'memory-s640-checkpoint-2026-11-12', coalesce(x.related, '{}'::text[])
from jsonb_to_recordset($json$[
 {
  "slug": "d-standards-plan-four-entries-s640",
  "kind": "decision",
  "title": "The standards rename plan is four entries, not five",
  "summary": "The S640 conductor, 2026-11-12: the standards plan (standards-2026-11-12, #3142) carries four entries. The lane's \"five\" counted Sam's saved folds at ruling time; phases 1 and 2 emptied four source titles since, and what remained to apply were his four saves of 15:26Z 2026-11-11. Count what remains from a fresh read, never from a lane's figure.",
  "tags": [
   "cer-procedures",
   "exhibits",
   "rename",
   "decision"
  ],
  "source": "Session call, S640 (the conductor)",
  "related": [],
  "status": "proposed",
  "verified_by": null,
  "event_date": "2026-11-12",
  "detail": null,
  "plain": null
 },
 {
  "slug": "d-rename-apply-drops-fulfilled-approvals-s640",
  "kind": "decision",
  "title": "A rename apply drops the approval rows it fulfils, keeping each in its receipt",
  "summary": "The S640 conductor, 2026-11-12: a rename apply deletes a person's override or merge-confirm row once it carries out that row's fold, keeping each before-row in the receipt (kb/_cred_rename_apply_supabase.py, Why DELETE + PATCH). S639's rule still protects a saved row whose instruction was never carried out. Applied to 7 of Sam's rows in kb/cred_rename_out/2026-11-12-2; told to COBIx first.",
  "tags": [
   "cer-procedures",
   "exhibits",
   "rename",
   "kb_curation",
   "decision"
  ],
  "source": "Session call, S640 (the conductor)",
  "related": [
   "d-standards-plan-four-entries-s640"
  ],
  "status": "proposed",
  "verified_by": null,
  "event_date": "2026-11-12",
  "detail": null,
  "plain": null
 },
 {
  "slug": "d-standards-second-plan-s640",
  "kind": "decision",
  "title": "The other seven standards folds go as a second ruled plan",
  "summary": "The S640 conductor, 2026-11-12: Sam's saved renames of 15:26:54Z 2026-11-11 for ASE L1, A2, A6, L3, A9, A3 and A4, none holding an industry-certification exhibit, went as plan standards-2-2026-11-12 (#3143): applied 05:48Z, receipt kb/cred_rename_out/2026-11-12-3, 19 row steps, 0 failed. Two more A6 saves (Automotive Electrical/Electronics 1 and 2) sit on emptied titles and stay out.",
  "tags": [
   "cer-procedures",
   "exhibits",
   "rename",
   "decision"
  ],
  "source": "Session call, S640 (the conductor)",
  "related": [
   "d-standards-plan-four-entries-s640"
  ],
  "status": "proposed",
  "verified_by": null,
  "event_date": "2026-11-12",
  "detail": null,
  "plain": null
 },
 {
  "slug": "d-rename-repoint-stopped-resolve-at-read-s640",
  "kind": "decision",
  "title": "Re-pointing saved values at apply time is stopped; resolve a stored title at read time",
  "summary": "The S640 conductor, 2026-11-12: #3140 re-pointed saved machine values inside the rename apply. Five review rounds each found a wrong-data fault on a new interaction (hand SQL, a separate job, undo order, a skipped retry, a replay on an undone apply), so it is not merged. Recommended: resolve a stored title through the applied alias map at read time, as kb/alias_chain.py does for M-IDs.",
  "tags": [
   "cer-procedures",
   "rename",
   "rollback",
   "decision"
  ],
  "source": "Session call, S640 (the conductor)",
  "related": [],
  "status": "proposed",
  "verified_by": null,
  "event_date": "2026-11-12",
  "detail": null,
  "plain": null
 },
 {
  "slug": "d-pdf-reader-design-calls-s640",
  "kind": "decision",
  "title": "The PDF reader's three design calls",
  "summary": "The S640 conductor, 2026-11-12, after the review of #3135 (the harvest's PDF reader): a paid read never makes a passing record worse; the list-page rule never lowers coverage; a bare number is read as a page number only when proven. The review had found a fingerprint that dropped bare unit figures.",
  "tags": [
   "program-requirements",
   "harvest",
   "decision"
  ],
  "source": "Session call, S640 (the conductor)",
  "related": [],
  "status": "proposed",
  "verified_by": null,
  "event_date": "2026-11-12",
  "detail": null,
  "plain": null
 },
 {
  "slug": "pitfall-partial-capture-files-as-complete-s640",
  "kind": "pitfall",
  "title": "A capture that meets HTTP 503s files a partial read as if complete",
  "summary": "S640, 2026-11-12: Rio Hondo's reconcile 43142240927 met 40 HTTP 503s, read 34 of 328 pages and found 33 of 301 programs, then measured 245 to 249 of 288 where the PR simulated 276, and said nothing. Check a capture's pages answered before reading its measure; a capture should refuse to file below a floor of pages answered.",
  "tags": [
   "program-requirements",
   "harvest",
   "pitfall"
  ],
  "source": "docs/program_requirements_harvest_lessons.md (S640)",
  "related": [],
  "status": "proposed",
  "verified_by": null,
  "event_date": "2026-11-12",
  "detail": null,
  "plain": null
 },
 {
  "slug": "procedure-proof-run-same-day-baseline-s640",
  "kind": "procedure",
  "title": "A proof run takes a same-day baseline by main's code",
  "summary": "S640, 2026-11-12: three of #3135's five capture proofs compared against reads main filed on 2026-10-17, before the reader changed, so 37 and 50 pick changes were reader drift. A proof compares against main's code run on the same source the same day, on a scratch branch with no PR (claude/harvest-pdf-baseline-s640), deleted when the change merges.",
  "tags": [
   "program-requirements",
   "harvest",
   "review",
   "procedure"
  ],
  "source": "docs/kb-notes/methodology-a-proof-run-needs-a-same-day-baseline.md",
  "related": [],
  "status": "proposed",
  "verified_by": null,
  "event_date": "2026-11-12",
  "detail": null,
  "plain": null
 },
 {
  "slug": "pitfall-second-write-path-no-receipt-s640",
  "kind": "pitfall",
  "title": "A second write path needs the whole receipt machinery again",
  "summary": "S640, 2026-11-12: re-pointing saved machine values after renames went first as hand-run SQL, then as a separate job, then inside the apply, and each round of review found a live row with no way back or a replay on the wrong apply (#3140, five rounds: 20, 12, 9, 3 and 1 findings). A fix that needs a fourth review round is a design to replace, not to patch.",
  "tags": [
   "cer-procedures",
   "rename",
   "rollback",
   "pitfall"
  ],
  "source": "docs/exhibit_canonicalization_lessons.md (S640)",
  "related": [
   "d-rename-repoint-stopped-resolve-at-read-s640"
  ],
  "status": "proposed",
  "verified_by": null,
  "event_date": "2026-11-12",
  "detail": null,
  "plain": null
 },
 {
  "slug": "pitfall-test-outside-every-workflow-s640",
  "kind": "pitfall",
  "title": "A test no workflow runs goes red unseen",
  "summary": "S640, 2026-11-12: tests/partner_crosswalk_test.py check 4 fails on main on five titles (California Food Manager Certificate, G Skin & Beauty Institute, HIT 10: Medical Terminology, Medical Billing and Coding Certificate of Completion, Water Supply Technology), and no workflow runs it. The governance lane's workflow PR adds it.",
  "tags": [
   "governance-team-enablement",
   "ci",
   "tests",
   "pitfall"
  ],
  "source": "docs/reference/lanes/governance-team-enablement.md",
  "related": [],
  "status": "proposed",
  "verified_by": null,
  "event_date": "2026-11-12",
  "detail": null,
  "plain": null
 },
 {
  "slug": "procedure-conductor-context-economy-s640",
  "kind": "procedure",
  "title": "Conductor context economy: what costs the most and what helps",
  "summary": "S640, 2026-11-12: 370,000 tokens went in 85 minutes. Largest costs: a review workflow's completion notice echoing long args (about 10,000 each), full get_check_runs and list_workflow_runs output, PR subscription notices. Helps: review context in a scratchpad file, a one-line context arg; get_check_runs perPage 1 or 2; list_workflow_runs filtered to in_progress on main.",
  "tags": [
   "conductor",
   "governance-team-enablement",
   "context",
   "procedure"
  ],
  "source": "docs/session_641_handoff.md; docs/reference/conductor_mode.md (What went wrong in S640)",
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
