-- cpl_memory rows for SkyPlover (S650), the checkpoint, 2026-11-14. One statement.
-- Every summary at most 400 characters (the table's check), measured by script when this file was written:
--   344, 352, 343, 375, 335; the longest is 375.
-- INSERT ... ON CONFLICT (slug) DO NOTHING (a replay is harmless), then the cpl_memory_log append, then the verify.
-- ROLLBACK (by slug; never by author):
--   delete from cpl_memory_log where memory_id in (select id from cpl_memory where slug in (<the slugs>));
--   delete from cpl_memory where slug in (<the slugs>);
-- No row is superseded.

-- ===========================================================================================================
-- STATEMENT 1 -- NOT YET RUN. The S650 conductor's decisions and one pitfall (status proposed, for Sam to revise on
-- the next sheet's card 1). Run through the Supabase MCP, then mark this header RUN with the time.
-- ===========================================================================================================
insert into cpl_memory (slug,kind,title,summary,tags,status,source,verified_by,verified_at,author,event_date) values
('d-cosumnes-two-pins-loaded-seven-held-s650','decision','Cosumnes River: two pinned rows loaded, seven rescore-only passes held','The S650 conductor, #3288: reread run 43568812092 replaced two program_requirement_records rows, 30566 Psychology AA-T (p.552) and 33072 History AA-T (p.404), GE units 34, both pass (filed passing 136 to 138); receipt holds before-values. The seven rescore-only passes (04602, 04607, 04614, 07305, 11319, 11338, 33542) wait for the one dry run.',array['program-requirements-harvest','decision'],'proposed','S650 checkpoint; docs/session_651_handoff.md and the lane files',null,null,'SkyPlover (S650)',date '2026-11-14'),
('p-degree-electives-fill-false-pass-s650','pitfall','The degree electives fill can pass a program whose major is incomplete','S650, a second reader on #3288: the program-total electives fill fills a degree''s major total, and its guard (electives_named) accepts any word elective in the text. Cosumnes River 11338 (6 of 24 units placed) and 04614 (ten codes missing) would pass. The fix goes into the one dry run; until then no rescore-only pass that rests on the fill is loaded.',array['program-requirements-harvest','scorer','pitfall'],'proposed','S650 checkpoint; docs/session_651_handoff.md and the lane files',null,null,'SkyPlover (S650)',date '2026-11-14'),
('d-sheet-196-published-s650','decision','Open Asks Sheet 196 published, four cards','The S650 conductor published Open Asks Sheet 196 (SHEET_ID 2026-11-14-open-asks-196, https://claude.ai/artifact/9JJAP1MKrRgKGUdrxFo7yA): 1 S649''s decisions since Sheet 195; 2 delete HUMA M10ME and LIBR M10CJ; 3 five Honors design choices; 4 the identities apply and the 625. Vault a218014b (CPLBrain#786); the CLAUDE.md pointer moved on #3282.',array['decision-sheet','commons','decision'],'proposed','S650 checkpoint; docs/session_651_handoff.md and the lane files',null,null,'SkyPlover (S650)',date '2026-11-14'),
('d-lassen-calgetc-page-read-s650','decision','Lassen is the sweep''s next college: a free Cal-GETC page read','The S650 conductor, #3291: Lassen''s 14 transfer degrees name Cal-GETC with no figure; ten fail on arithmetic alone (30947, 31015, 31037, 31132, 31379, 32083, 33263, 33729, 33730, 42300). A free page read (plan kb/college_reads/lassen_cal_getc_page.json), then the config with quoted words, reconcile extract=0, --calgetc-review --restore, reread, display, COBIx''s spot-check.',array['program-requirements-harvest','cal-getc','decision'],'proposed','S650 checkpoint; docs/session_651_handoff.md and the lane files',null,null,'SkyPlover (S650)',date '2026-11-14'),
('d-library-four-wait-on-people-s650','decision','Library step 6: four open rows, each waits on a person','The S650 conductor: four open Library rows, nothing built. mwdvs6l1 Draft 2 waits on Ally Barker''s Publish it; mwdv9pl5 is its superseded duplicate (retiring it is her press); the coordinator piece has ready draft 7a26c199, whose pictures 4, 5 and 14 show names or emails to cover before publishing; iaca waits on Crystal Nasio''s file.',array['library','decision'],'proposed','S650 checkpoint; docs/session_651_handoff.md and the lane files',null,null,'SkyPlover (S650)',date '2026-11-14')
on conflict (slug) do nothing;
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select id, 'SkyPlover (S650)', 'create', 'S650 checkpoint (2026-11-14)', to_jsonb(m)
from public.cpl_memory m where m.slug in
  ('d-cosumnes-two-pins-loaded-seven-held-s650','p-degree-electives-fill-false-pass-s650','d-sheet-196-published-s650','d-lassen-calgetc-page-read-s650','d-library-four-wait-on-people-s650')
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');
select m.slug, length(m.summary) as summary_chars, count(l.id) filter (where l.action = 'create') as creates
from public.cpl_memory m left join public.cpl_memory_log l on l.memory_id = m.id
where m.slug in
  ('d-cosumnes-two-pins-loaded-seven-held-s650','p-degree-electives-fill-false-pass-s650','d-sheet-196-published-s650','d-lassen-calgetc-page-read-s650','d-library-four-wait-on-people-s650')
group by m.slug, m.summary order by m.slug;
