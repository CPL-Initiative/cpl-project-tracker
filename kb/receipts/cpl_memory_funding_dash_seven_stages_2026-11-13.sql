-- RUN 2026-11-13 about 20:40Z through the Supabase MCP (2 rows inserted, 2 logged; read back, both proposed).
-- cpl_memory rows for the Funding Follow-up Dashboard's seven stages (Malone's side session on the MAP account,
-- 2026-11-13; cpl-project-tracker#3253, merged as b558b649). Two rows, status proposed: his decisions, and the one call
-- held for Sam. INSERT ... ON CONFLICT (slug) DO NOTHING, then the cpl_memory_log append. Summaries at most 400 characters.
-- ROLLBACK (by slug; never by author):
-- delete from cpl_memory_log where memory_id in (select id from cpl_memory where slug in ('malone-funding-dash-seven-stages-2026-11-13','q-held-follow-up-names-coordinator-2026-11-13'));
-- delete from cpl_memory where slug in ('malone-funding-dash-seven-stages-2026-11-13','q-held-follow-up-names-coordinator-2026-11-13');
insert into cpl_memory (slug,kind,title,summary,tags,status,source,verified_by,verified_at,author,event_date) values
('malone-funding-dash-seven-stages-2026-11-13','decision','Funding Follow-up Dashboard: seven sequential stages, one email a stage, no rebuild',
 'Malone, 2026-11-13: the lists are seven stages in order, each college in one; an email may go at each step and an acceptance needs none of its own; To send apart from Waiting; three look-up lists; the credit share qualifies while the noncredit share waits (Sheet 113 card 1 stands). He and Sam ruled out a rebuild. Built in #3253; no table changed.',
 array['csm-workspace','implementation-funding','filters','email-templates','decision'],'proposed',
 'Malone in session on the MAP account, 2026-11-13 (D1 to D5 of CPLBrain csm-workspace-mock/20261113_Funding_Follow-up_Sequential_Stages_Plan.md); cpl-project-tracker#3253',
 null,null,'Malone''s side session (MAP account)','2026-11-13'),
('q-held-follow-up-names-coordinator-2026-11-13','question','May the held follow-up name a missing CPL Coordinator?',
 'Malone''s stage 5 email names every missing requirement. Sam''s call of 2026-11-09 (issue 3010) is that the dashboard writes no email for a missing coordinator, since he chases those. On COBIx''s review of #3253 the held follow-up leaves the coordinator out, and a college held by it alone is owed no email, until Sam rules.',
 array['csm-workspace','implementation-funding','email-templates','question'],'proposed',
 'COBIx on cpl-project-tracker#3253 (20:01Z 2026-11-13); lanes/csm-workspace.md',
 null,null,'Malone''s side session (MAP account)','2026-11-13')
on conflict (slug) do nothing;
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select id, 'Malone''s side session (MAP account)', 'create', 'the seven stages, 2026-11-13', to_jsonb(m)
from public.cpl_memory m where m.slug in ('malone-funding-dash-seven-stages-2026-11-13','q-held-follow-up-names-coordinator-2026-11-13')
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');
