-- cpl_memory rows for the funding side session of 2026-11-24 (the Simple view mockup and exact public dollars).
-- Two rows INSERTed ON CONFLICT (slug) DO NOTHING, and one guarded UPDATE that supersedes Sam's 2026-09-03 row.
-- Sam reverses his own ruling here in his own words, so the supersede is explicit (Rule 8).
-- ROLLBACK:
--   delete from public.cpl_memory_log where memory_id in (select id from public.cpl_memory where slug in ('d-public-dollars-exact-2026-11-24','o-whole-dollar-allocation-2026-11-24'));
--   delete from public.cpl_memory where slug in ('d-public-dollars-exact-2026-11-24','o-whole-dollar-allocation-2026-11-24');
--   update public.cpl_memory set status = 'verified', updated_at = now() where slug = 'sam-approved-the-under-10-package-with-public-dollars-floored-at-1000' and status = 'superseded';
--   (before-value of that row's status: 'verified', read 2026-11-24)
insert into public.cpl_memory (slug,kind,title,summary,detail,tags,status,source,verified_by,verified_at,author,event_date) values
('d-public-dollars-exact-2026-11-24','decision','Public funding dollars are exact, in whole dollars',
 'Sam, 2026-11-24: Funds Qualified So Far prints the same whole dollars as Max Funds on the public page, the curator view and the CSV. The $1,000 rounding and its <$1,000 floor are gone; the count mask under 10 stays.',
 'His words: "The qualified so far doesn''t need to round to the nearest 1000 for privacy...since we are showing the exact number on the max funding side. they should match. there is no possibility someone could deduce an individual at a college based on the funding allocation since there is no connection to the type of cpl either applicable or transcribed and we don''t show the number of students who qualify for either. the ftes could be any combination of student numbers." Supersedes sam-approved-the-under-10-package-with-public-dollars-floored-at-1000 (its dollar half only). ADR decision 5; guards cpl_funding_public_dollars, cpl_funding_public_dollars_at_cap.',
 array['funding','privacy','public-page','decision'],'verified','docs/kb-notes/adr-funding-counts-mask-under-10-units-carry-the-money.md decision 5','Sam Lee (chat, 2026-11-24)',now(),'Claude (funding side session, 2026-11-24)','2026-11-24'),
('o-whole-dollar-allocation-2026-11-24','opportunity','Round each award once so totals agree to the dollar',
 'The rows, district subtotals, Statewide row and memo can differ by a few dollars (Sam saw about $4 against the field memo), because the model keeps fractional dollars and each figure rounds on its own.',
 'Fix: round each award to whole dollars once in allocModel, largest remainder among the proportional rows so they sum to the net exactly; split CR and NC as CR rounded, NC the rest; every total sums those integers; a test fails on a $1 gap. Sam, 2026-11-24: "no cents should be included in our calcs."',
 array['funding','rounding','allocation','memo'],'proposed','docs/reference/lanes/implementation-funding.md',null,null,'Claude (funding side session, 2026-11-24)','2026-11-24')
on conflict (slug) do nothing;

update public.cpl_memory set status = 'superseded', updated_at = now()
where slug = 'sam-approved-the-under-10-package-with-public-dollars-floored-at-1000' and status = 'verified';

insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select id, 'Claude (funding side session, 2026-11-24)', 'create', '2026-11-24', to_jsonb(m)
from public.cpl_memory m where m.slug in ('d-public-dollars-exact-2026-11-24','o-whole-dollar-allocation-2026-11-24');
insert into public.cpl_memory_log (memory_id, actor, action, note, before)
select id, 'Claude (funding side session, 2026-11-24)', 'supersede', 'Sam, 2026-11-24: public dollars exact; superseded by d-public-dollars-exact-2026-11-24', jsonb_build_object('status','verified')
from public.cpl_memory where slug = 'sam-approved-the-under-10-package-with-public-dollars-floored-at-1000';
