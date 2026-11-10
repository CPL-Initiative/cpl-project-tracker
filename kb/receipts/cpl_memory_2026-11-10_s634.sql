-- S634 SkyBackward: five cpl_memory rows (proposed) and their log entries: the calls made while carrying out
-- Open Asks Sheet 180's rulings under decide-and-record (Sam, 2026-11-10). Written 2026-11-10 ~20:15Z through
-- execute_sql. Rollback: delete from cpl_memory where author = 'SkyBackwardS634' (log rows by memory_id).
insert into public.cpl_memory (kind, slug, title, summary, detail, plain, tags, source, status, verified_by, verified_at, event_date, author, confidence) values
('decision','d-ccr-seed-confirm-all-applied-s634','CCR seed confirm applied to every remaining discipline; Kinesiology''s 10 new cards too',
 'On Sam''s "all" (Sheet 180 card 1) S634 stamped 584 cards in 26 disciplines, one receipt each. Session call: Kinesiology''s 10 cards that qualified after S615''s 627 took the same stamp on Sheet 174''s ruling. A recount finds no confirmed card left.',
 'kb/_ccr_seed_confirm_apply.py; receipts kb/ccr_seed_confirm_out/2026-11-10/<slug>.json, each reverses alone with --undo. The discipline never changes; nothing in Supabase moves.',
 'The course reference''s remaining discipline labels that two independent checks agree on are now marked confirmed, and each batch can be undone.',
 array['commons','ccr','decision'],'cpl-project-tracker#3084; docs/reference/lanes/commons.md','proposed',null,null,'2026-11-10','SkyBackwardS634','high'),
('decision','d-las-positas-local-ge-summed-s634','Las Positas local degrees: LPC-GE 28 (A.A.) and 22 (A.S.), with the page''s overlap and electives words',
 'Carrying out Sam''s "count" (Sheet 180 card 4), S634 added four reconcile steps for local degrees: ge_units summed from the LPC-GE page''s areas (each note says summed), ge_overlap from "Double counting courses in GE and the major is permissible", electives_fill_degree from "Elective units must be degree applicable". Session call: the two flags.',
 'New award kinds local, local_aa, local_as in kb/_program_requirements_reconcile.py. Simulated: 43 of 45 failing local records read equal; two stay unequal and stand.',
 'Las Positas''s own degrees can now be added up, using the general education units its page lists by area.',
 array['program-requirements-harvest','decision'],'cpl-project-tracker#3085','proposed',null,null,'2026-11-10','SkyBackwardS634','high'),
('decision','d-alameda-semester-sum-narrow-s634','Alameda''s semester sum applies only where the record holds no printed total',
 'Carrying out Sam''s "count" (Sheet 180 card 2), the semester_sum reconcile step sets total_units to the sum of the semester subtotals (marked total_units_summed) only where the record holds no program or degree total and no other block asks for units. Session call: Chassis 09009, which prints a degree total, stays as filed, so exactly the six named records take it.',
 'kb/_program_requirements_reconcile.py, kind semester_sum; tests/program_requirements_reconcile_test.py.',
 'A program laid out semester by semester with no grand total now uses the sum of its semesters, but never in place of a total the catalog prints.',
 array['program-requirements-harvest','decision'],'cpl-project-tracker#3086','proposed',null,null,'2026-11-10','SkyBackwardS634','high'),
('decision','d-10key-issuer-and-graduate-rows-s634','10-Key Data Entry''s issuer is the college; the two doctorate rows stand until Pierce names a university',
 'Carrying out Sam''s "two" (Sheet 180 card 6): 10-Key Data Entry is Modesto''s own BIT 375 by credit by exam, so its issuer reads California Community Colleges alone. The two Graduate Level credentials are LA Pierce doctorate exhibits (MAP 63381, 64857); MAP names no conferring university, so Sam''s two rows stand, a question for Pierce''s CSM.',
 'Receipt kb/receipts/kb_curation_10key_issuer_2026-11-10_s634.json. Also seen: the Ph.D. exhibit sits under the credential Clinical Counseling Laws and Ethics, the name of a course it awards; the row is Sam''s to move.',
 'One credential that listed a testing room as its issuer now lists the college. Two doctoral-degree entries keep their general label because the records do not say which university.',
 array['cer-procedures','exhibits','decision'],'docs/reference/lanes/cer-procedures.md','proposed',null,null,'2026-11-10','SkyBackwardS634','medium'),
('pitfall','p-credential-review-apply-never-removes-issuer','Changing an issuer override does not remove the old issuer from the reference',
 'kb/_apply_credential_review.py fills an empty issuer or appends a new one; it never removes one. A kb_curation issuing_agency_override changed from A to B leaves A in kb/credentials.json beside B unless the reference is edited in the same change.',
 'Found S634 on 10-Key Data Entry. S634 edited the reference for Wildland Fire-Basics'' long form (S633''s rename) in the same change.',
 'When someone corrects who issues a credential, the old answer can linger next to the new one unless it is removed by hand.',
 array['cer-procedures','exhibits','pitfall'],'kb/_apply_credential_review.py','proposed',null,null,'2026-11-10','SkyBackwardS634','high')
on conflict (slug) do nothing;
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select id, 'SkyBackwardS634', 'create', 'decide-and-record', to_jsonb(m)
from public.cpl_memory m where m.author = 'SkyBackwardS634'
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');
select m.slug, length(m.summary) n, count(l.id) filter (where l.action='create') as creates
from public.cpl_memory m left join public.cpl_memory_log l on l.memory_id = m.id
where m.author = 'SkyBackwardS634' group by m.slug, m.summary order by m.slug;

-- Checkpoint, ~22:35Z: two more rows by the same author and the same log insert, written through execute_sql
-- (count for the author afterward: 7): m-dashboard-signin-ask-an-approver-leads-2026-11-10 (milestone, #3092)
-- and p-a11y-run-hangs-in-cloud-container (pitfall). Same rollback.
