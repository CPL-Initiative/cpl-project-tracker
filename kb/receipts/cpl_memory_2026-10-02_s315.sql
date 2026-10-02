-- S315 (SkyLedger), 2026-10-02: Rule 8 ingest at the checkpoint - five new rows, one status change.
-- Status change: sierra-catalog-reads-timeout-under-load-2026-10-02 superseded explicitly (session-sourced;
-- its 'no top_code index' clause is false since migration chatbox_college_courses_top_code_idx).
-- Rollback: supersede the five rows by author 'SkyLedger-s315', logged under 'SkyLedger-s315-rollback',
-- and set the superseded row back to 'proposed' with its own log row.
insert into public.cpl_memory (slug, kind, org, title, summary, detail, plain, tags, source, related, status, verified_by, verified_at, event_date, author)
select x.slug, x.kind, 'cpl', x.title, x.summary, x.detail, x.plain, x.tags, x.source, '{}'::text[], x.status, x.verified_by,
       case when x.status = 'verified' then now() end, x.event_date::date, 'SkyLedger-s315'
from jsonb_to_recordset($json$[
 {
  "slug": "sam-sheet17-rulings-2026-10-02",
  "kind": "decision",
  "event_date": "2026-10-02",
  "title": "Sam's rulings on open-asks sheet 17 (both cards)",
  "summary": "Sam, 2026-10-02 04:18Z, both his own call: card 2 'Apply them' (the model sweep's cards 23-24, his saved Introduction paragraph and two Timeline labels, both scenarios) and card 1 'Done' (the CER entry for the AWS fold and the Microsoft title).",
  "detail": "Store https://claude.ai/artifact/BUSR19kLbQ8yponfQVk1AP, replies/done through 2, ruled 2. Card 2 executed by S315: funding-config-edit-apply.yml at 04:52Z, plan kb/funding_config_edits_out/2026-10-02-2 (#1815). Card 1 left no kb_curation row and the edge log shows no CER overlay read after 22:46Z on 2026-10-01, so the entry was re-asked as sheet 19 card 1 with a session-write option.",
  "plain": "Sam answered sheet 17: the funding text was rewritten as he approved, and the credential entry is asked again because nothing was saved.",
  "tags": [
   "decision-sheet",
   "open-asks",
   "implementation-funding",
   "partner-crosswalks"
  ],
  "source": "sheet 17 reply store (read 2026-10-02 S315)",
  "status": "verified",
  "verified_by": "Sam (the sheet's reply store, read 2026-10-02)"
 },
 {
  "slug": "funding-text-model-words-written-2026-10-02",
  "kind": "milestone",
  "event_date": "2026-10-02",
  "title": "The saved funding text no longer says 'model' in either scenario",
  "summary": "funding-config-edit-apply.yml wrote six paths at 04:52Z 2026-10-02: both scenarios' text.about now reads 'The Chancellor's Office measures outcomes...' and 'CPL funding relies on data in the MAP platform...', and timing[0..1] read 'CPL Funding Procedure Finalized' and 'Guidance Memo Release'. Config md5 7e59830b -> 764fd264.",
  "detail": "Plan kb/funding_config_edits_out/2026-10-02-2 (a second plan the same day takes <date>-2; the workflow accepts -2..-9 since #1815). Receipt applied_2026-10-02T04-52-27Z.json, read-back all at after, updated_by implementation-funding-s315@bot. The built-in DEFAULT_TIMING and default introduction in cpl_funding.js still say 'model' and render only for a scenario with no saved text.",
  "plain": "The last places the funding page's saved words said 'model' now say what Sam approved.",
  "tags": [
   "implementation-funding",
   "model-sweep",
   "config-write"
  ],
  "source": "kb/funding_config_edits_out/2026-10-02-2/applied_2026-10-02T04-52-27Z.json; PR #1815",
  "status": "verified",
  "verified_by": "the receipt's read-back (S315)"
 },
 {
  "slug": "cer-done-twice-without-a-load-2026-10-02",
  "kind": "pitfall",
  "event_date": "2026-10-02",
  "title": "A sheet's 'Done' on the CER entry left no row twice; the edge log showed the CER was never opened",
  "summary": "Sheets 16 and 17 came back Done on the AWS fold and Microsoft title with no kb_curation row. The CER reads course_id=like._CREDENTIAL_REVIEW::% on every load, and the edge log held no such read between the 22:46Z rename run and 05:40Z, so the page was not opened. A Done that reports an action is checked in the store and the log before the next step.",
  "detail": "Newest kb_curation row 2026-09-27 12:03Z as of 06:12Z 2026-10-02. After the second miss, sheet 19 card 1 offers a session path (a reviewed workflow writing the three rows under a bot cohort, mapped in Governance). KB note methodology-a-verdict-that-reports-an-action-is-checked-in-the-store.",
  "plain": "Twice the credential fix was marked done but never saved, because the page was never opened; now the session offers to make the entry itself.",
  "tags": [
   "partner-crosswalks",
   "decision-sheet",
   "pitfall",
   "kb_curation"
  ],
  "source": "Supabase edge logs and kb_curation, read S315; docs/partner_crosswalk_lessons.md",
  "status": "proposed",
  "verified_by": null
 },
 {
  "slug": "chatbox-college-courses-top-code-index-2026-10-02",
  "kind": "fact",
  "event_date": "2026-10-02",
  "title": "chatbox_college_courses has a top_code index; program_typical_courses 1,521 -> 15.5 ms",
  "summary": "Migration chatbox_college_courses_top_code_idx (btree on top_code, 1 MB), applied S315 ~05:01Z 2026-10-02. Before: a seq scan of 4,215 buffers keeping 723 of 141,696 rows, 1.9-3.4 s on a quiet database; program_typical_courses('{1230.30,1230.20}',2,12) 1,521 ms. After: bitmap scan of 419 buffers, 15.5 ms, same 21 rows.",
  "detail": "The loader (kb/_sync_college_courses.py) upserts 500-row batches, so the btree is per-batch maintenance. Receipt kb/receipts/chatbox_college_courses_top_code_idx_2026-10-02.sql names the rollback; schema of record chatbox/supabase_program_typical_courses.sql; #1817.",
  "plain": "Sierra's lookup of typical courses for a program now takes a hundredth of the time.",
  "tags": [
   "sierra",
   "supabase",
   "performance",
   "index"
  ],
  "source": "PR #1817; kb/receipts/chatbox_college_courses_top_code_idx_2026-10-02.sql",
  "status": "verified",
  "verified_by": "the receipt's before/after plans (S315)"
 },
 {
  "slug": "statewide-target-gap-is-the-maximum-award-2026-10-02",
  "kind": "fact",
  "event_date": "2026-10-02",
  "title": "The 2.3% statewide Access target gap is the maximum award trimming seven institutions' targets",
  "summary": "cpl_funding.js over the e21658f9 fixture, Scenario 2: with the $400,000 maximum the 118 institutions' Access targets sum to 4,366.66 FTES; with it lifted they sum to 4,467.60, the statewide division, exactly. prioEntitlement scales a capped institution's target by capScale(), so the seven at the maximum carry 78.8 FTES each; no other target moves.",
  "detail": "Trims: Mt. San Antonio 62.0, Pasadena 14.0, Santa Ana 10.5, Long Beach 7.4, Fresno City 4.6, Bakersfield 2.0, El Camino 0.4 (100.94). The Access card prints prioTarget(null,p) (the division) and the Statewide row's detail sums crTarget + ncTarget (the sum). Which one the state publishes is Sam's: sheet 19 card 2. Explains statewide-target-exceeds-institution-sum-2026-10-01.",
  "plain": "The statewide target and the colleges' targets disagree because the largest colleges are held at the maximum award; Sam decides which figure to show.",
  "tags": [
   "implementation-funding",
   "targets",
   "measured"
  ],
  "source": "S315 engine run over tests/fixtures/cpl_funding_config_e21658f9.json; PR #1818",
  "status": "proposed",
  "verified_by": null
 }
]$json$::jsonb)
  as x(slug text, kind text, event_date text, title text, summary text, detail text, plain text, tags text[], source text, status text, verified_by text)
where not exists (select 1 from public.cpl_memory m where m.slug = x.slug);
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select id, 'SkyLedger-s315', 'create', 'S315 checkpoint: sheet 17, the index, the target gap', to_jsonb(m) from public.cpl_memory m
where m.slug in ('sam-sheet17-rulings-2026-10-02', 'funding-text-model-words-written-2026-10-02', 'cer-done-twice-without-a-load-2026-10-02', 'chatbox-college-courses-top-code-index-2026-10-02', 'statewide-target-gap-is-the-maximum-award-2026-10-02')
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');
with before as (select id, to_jsonb(m) as b from public.cpl_memory m
                where slug = 'sierra-catalog-reads-timeout-under-load-2026-10-02' and status = 'proposed'),
     upd as (update public.cpl_memory m set status = 'superseded'
             from before where m.id = before.id returning m.id, to_jsonb(m) as a)
insert into public.cpl_memory_log (memory_id, actor, action, note, before, after)
select upd.id, 'SkyLedger-s315', 'supersede', 'resolved: the top_code index (chatbox-college-courses-top-code-index-2026-10-02); a session-sourced row', before.b, upd.a
from upd join before using (id);
select slug, status from public.cpl_memory where slug in ('sam-sheet17-rulings-2026-10-02', 'funding-text-model-words-written-2026-10-02', 'cer-done-twice-without-a-load-2026-10-02', 'chatbox-college-courses-top-code-index-2026-10-02', 'statewide-target-gap-is-the-maximum-award-2026-10-02', 'sierra-catalog-reads-timeout-under-load-2026-10-02') order by 1;
-- Second write, 12:01Z: one row, sam-sheet19-rulings-2026-10-02 (decision, verified by the sheet 19 reply store),
-- inserted under author 'SkyLedger-s315' with its cpl_memory_log 'create' row (same shape as above).
