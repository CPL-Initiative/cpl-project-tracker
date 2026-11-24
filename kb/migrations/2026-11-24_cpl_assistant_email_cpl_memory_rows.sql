-- cpl_memory row: Sam's account of why the CPL Assistant Email matters (2026-11-24), verbatim. INSERT-only.
-- ROLLBACK:
--   delete from public.cpl_memory_log where memory_id in (select id from public.cpl_memory where slug = 'f-cpl-assistant-email-enables-request-cpl-2026-11-24');
--   delete from public.cpl_memory where slug in ('f-cpl-assistant-email-enables-request-cpl-2026-11-24','d-first-condition-requires-cpl-assistant-email-2026-11-24');
--   delete from public.cpl_memory_log where memory_id is null and note = 'd-first-condition-requires-cpl-assistant-email-2026-11-24';
insert into public.cpl_memory (slug,kind,title,summary,detail,tags,status,source,verified_by,verified_at,author,event_date) values
('f-cpl-assistant-email-enables-request-cpl-2026-11-24','fact','The CPL Assistant Email turns on Request CPL',
 'The CPL Assistant Email in MAP is the address in the CPL contact field of a college''s landing page; with it on the page the Request CPL button works, so students can get CPL there, not just explore it.',
 'Sam, 2026-11-24, verbatim: "the CPL Assistant Email is important because that''s the email that is listed in the cpl contact field of the college landing pages and when the email in on the page, it enables the Request CPL button to work, which allows students to use the lp to get (rather than just explore) cpl. note that colleges are a little touchy about this because it is often the first time they will get requests from students for CPL that they need to respond to in a timely way." Measured that day: 81 colleges have a CPL Coordinator in MAP, 78 also the CPL Assistant Email; 2 meet the funding first condition without it (coordPartMissing''s primary-contact-and-landing-page way, Sam 2026-11-09).',
 array['funding','map-contacts','landing-page','student-requests','map-users'],'verified','docs/reference/lanes/implementation-funding.md','Sam Lee (chat, 2026-11-24)',now(),'Claude (funding side session, 2026-11-24)','2026-11-24')
on conflict (slug) do nothing;
insert into public.cpl_memory (slug,kind,title,summary,detail,tags,status,source,verified_by,verified_at,author,event_date) values
('d-first-condition-requires-cpl-assistant-email-2026-11-24','decision','The first condition requires the CPL Assistant Email',
 'Sam, 2026-11-24: the funding first condition requires the CPL Assistant Email in MAP, replacing the 2026-11-09 way of meeting it with a primary contact and landing page instead.',
 'His words: "require it, but let me know who the colleges are so our team can get the cpl assistant put on for them so they don''t fall out of compliance." Affected that day: Coalinga College, Lake Tahoe Community College (would fall out), West Valley College (already unmet). Build is the next session''s (coordPartMissing in cpl_funding.js).',
 array['funding','map-contacts','landing-page','decision'],'verified','docs/reference/lanes/implementation-funding.md','Sam Lee (chat, 2026-11-24)',now(),'Claude (funding side session, 2026-11-24)','2026-11-24')
on conflict (slug) do nothing;
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select id, 'Claude (funding side session, 2026-11-24)', 'create', '2026-11-24', to_jsonb(m)
from public.cpl_memory m where m.slug in ('f-cpl-assistant-email-enables-request-cpl-2026-11-24','d-first-condition-requires-cpl-assistant-email-2026-11-24');
