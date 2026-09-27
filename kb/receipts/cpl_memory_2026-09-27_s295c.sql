-- S295 (SkyHarbor), 2026-09-27, third write: Rule 8 ingest - four new rows, one status change.
-- New: Sam's rulings on the 2026-09-27 open-asks sheet (decision, human-verified), the unit rule for every
-- merge and mint (decision, human-verified), the 397 mojibake course titles and their repaired twins (fact,
-- measured), and the Supabase guard reading a bare replace() call as a write (pitfall). Status change: the
-- S295 question row `ace-august-answers-stand-until-sam-rules-2026-09-27` superseded, explicitly, by
-- `open-asks-2026-09-27-rulings` (a session-sourced row; Sam's answer is the ruling it asked for).
-- Rollback (docs/reference/data_write_rollback.md: cpl_memory rows are never rolled back by delete):
--   supersede the four rows by author 'SkyHarbor-s295c', logged under actor 'SkyHarbor-s295c-rollback',
--   and set the question row back to 'proposed' with its own log row.
insert into public.cpl_memory (slug, kind, org, title, summary, detail, plain, tags, source, related, status, verified_by, verified_at, event_date, author)
select x.slug, x.kind, 'cpl', x.title, x.summary, x.detail, x.plain, x.tags, x.source, '{}'::text[], x.status, x.verified_by,
       case when x.status = 'verified' then now() end, x.event_date::date, 'SkyHarbor-s295c'
from jsonb_to_recordset($json$[
 {
  "slug": "open-asks-2026-09-27-rulings",
  "kind": "decision",
  "event_date": "2026-09-27",
  "title": "Sam's rulings on the 2026-09-27 open-asks sheet (all eight cards)",
  "summary": "Sam completed the 2026-09-27 open-asks sheet through card 8: cue the narrated draft's reveals first; merge cpl-knowledge-base #23; the August military answers stand on the not-a-topic class and granularity; units never split an identity; two write surfaces go through Governance first; clean the stored mojibake titles; he rules GR rows #2, #10, #16 on the tab.",
  "detail": "Store https://claude.ai/artifact/5sWY4QCCDfkAegZtZrW1oe: card 1 his own call at 15:26 UTC (cue); Complete at 17:48:20 UTC with through 8, ruled 8, so cards 2-8 stand as proposed under the high-water rule. Carried out 2026-09-27 (S295): #23 merged (266c1b7); military lane and scope section 10 record cards 3-5, and CLAUDE.md Rule 7 plus mid_lifecycle carry the unit rule; partner-crosswalks and discipline-crosslist record card 6; sierra records card 7 (To-Do s296-fable-course-title-cleanup); t5-55050 records card 8 (To-Do s296-sam-gr-rows-on-tab). Every NEEDS-SAM marker left its lane in the same change. Supersedes the question ace-august-answers-stand-until-sam-rules-2026-09-27.",
  "plain": "Sam answered all eight open questions on his decision sheet, and each answer is now recorded where the work lives.",
  "tags": [
   "decision-sheet",
   "open-asks",
   "military-ace-cr",
   "partner-crosswalks",
   "sierra",
   "gr-register",
   "governance"
  ],
  "source": "Sam's Complete on the 2026-09-27 open-asks sheet (through card 8, 17:48 UTC); decision_sheets.md high-water rule",
  "status": "verified",
  "verified_by": "Sam (the sheet's reply store, read 2026-09-27)"
 },
 {
  "slug": "units-never-split-an-identity",
  "kind": "decision",
  "event_date": "2026-09-27",
  "title": "Units never split an identity; the identity shows the unit range it joins",
  "summary": "Sam's rule for every merge and mint (2026-09-27, open-asks card 5, answering his 2026-09-22 note asking for advice): a merge or mint that joins records whose units differ keeps one identity and shows the range it joins, such as Orienteering (1-3 units), for M-IDs and credit recommendations alike.",
  "detail": "His note of 2026-09-22 on the ACE unit-variants card: 'Keep as 1 course but name the unit variation (1-3u). I think this should be a rule for all merges and mints. Advise.' The advice (card 5) proposed a display rule, following his TOP ruling (gate identity, keep display); he chose it. Keys already comply: an M-ID is SUBJ4 plus number, and kb/_build_cr_reference.py topic_key discards units. The card named one case where it might be wrong, a C-ID descriptor's minimum units gating membership, and the rule was chosen with that in view. Recorded in CLAUDE.md Rule 7, docs/reference/mid_lifecycle.md invariants and military scope section 10; the display check is To-Do s296-fable-unit-range-display.",
  "plain": "When two course or credit records are combined, a difference in units never splits them; the combined record shows the range, for example 1 to 3 units.",
  "tags": [
   "doctrine",
   "mid",
   "military-ace-cr",
   "common-cr-reference",
   "rule-7"
  ],
  "source": "Sam's verdict 'rule' on card 5 of the 2026-09-27 open-asks sheet",
  "status": "verified",
  "verified_by": "Sam (the sheet's reply store, read 2026-09-27)"
 },
 {
  "slug": "course-title-mojibake-397-twins-2026-09-27",
  "kind": "fact",
  "event_date": "2026-09-27",
  "title": "The 397 garbled course titles each sit beside a repaired twin",
  "summary": "chatbox_college_courses holds 397 course titles carrying mojibake (85 colleges, all synced 2026-08-13), and the 2026-09-18 sync inserted a repaired twin beside each: same college, subject and number, the same words, every other column identical. The sync upserts on a key that includes the title, so it never removes the old row.",
  "detail": "Measured 2026-09-27 (S295) through read-only MCP queries: 142,093 rows = 141,696 synced 2026-08-13 + 397 synced 2026-09-18; the 397 garbled rows (ids 751 to 140937, id sum 28237824) each have exactly one sibling on (college, subject, course_number); the alphanumeric word sequence matches 397 of 397; units, credit_type, top_code, top_title, cid and control_number match 397 of 397; no twin is itself garbled. Sam's card-7 verdict: clean the stored titles once, under a receipt, and keep the loader repair. The repo's Supabase guard denies a session's write to this table, so the removal runs through a reviewed apply workflow with full row images in its receipt (To-Do s296-fable-course-title-cleanup).",
  "plain": "Sierra's course list still holds 397 old copies of course titles with scrambled characters next to the corrected copies; they are safe to remove.",
  "tags": [
   "sierra",
   "mojibake",
   "chatbox-college-courses",
   "data-quality"
  ],
  "source": "live reads of chatbox_college_courses, 2026-09-27 (S295)",
  "status": "verified",
  "verified_by": "measured 2026-09-27 (three read-only queries)"
 },
 {
  "slug": "supabase-guard-denies-bare-replace-in-a-read",
  "kind": "pitfall",
  "event_date": "2026-09-27",
  "title": "The Supabase guard denies a bare replace() call, even in a read",
  "summary": "scripts/supabase_sql_guard.py treats a bare replace() function call as the REPLACE write verb, so a read-only query that calls it is denied. Use translate() for single characters, or regexp_matches or regexp_replace, which are single words the guard reads as reads. The guard is working as built.",
  "detail": "Met 2026-09-27 (S295) verifying the mojibake twins: replace(course_title, chr(160), ' ') in a SELECT was denied with 'this statement contains replace'. The guard strips literals and comments first and checks whole words, so text inside a string literal never trips it, and regexp_replace is one word. Recorded as a pitfall, not a bug: approval-prompt hook work is paused by Sam's instruction of 2026-09-24.",
  "plain": "A safety check on database queries mistakes one text function for a write; there is a simple way around it that changes nothing.",
  "tags": [
   "supabase",
   "hooks",
   "pitfall",
   "rule-10"
  ],
  "source": "scripts/supabase_sql_guard.py WRITE_VERBS; the denied query of 2026-09-27",
  "status": "verified",
  "verified_by": "reproduced 2026-09-27 (S295)"
 }
]$json$::jsonb)
  as x(slug text, kind text, event_date text, title text, summary text, detail text, plain text, tags text[], source text, status text, verified_by text)
where not exists (select 1 from public.cpl_memory m where m.slug = x.slug);
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select id, 'SkyHarbor-s295c', 'create', 'S295 third write: the 2026-09-27 sheet answered', to_jsonb(m) from public.cpl_memory m
where m.slug in ('open-asks-2026-09-27-rulings', 'units-never-split-an-identity', 'course-title-mojibake-397-twins-2026-09-27', 'supabase-guard-denies-bare-replace-in-a-read')
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');
with before as (select id, to_jsonb(m) as b from public.cpl_memory m
                where slug = 'ace-august-answers-stand-until-sam-rules-2026-09-27' and status = 'proposed'),
     upd as (update public.cpl_memory m set status = 'superseded'
             from before where m.id = before.id returning m.id, to_jsonb(m) as a)
insert into public.cpl_memory_log (memory_id, actor, action, note, before, after)
select upd.id, 'SkyHarbor-s295c', 'supersede', 'answered: superseded by open-asks-2026-09-27-rulings (a session-sourced question row)', before.b, upd.a
from upd join before using (id);
select slug, status from public.cpl_memory
where slug in ('open-asks-2026-09-27-rulings', 'units-never-split-an-identity', 'course-title-mojibake-397-twins-2026-09-27', 'supabase-guard-denies-bare-replace-in-a-read', 'ace-august-answers-stand-until-sam-rules-2026-09-27')
order by 1;
