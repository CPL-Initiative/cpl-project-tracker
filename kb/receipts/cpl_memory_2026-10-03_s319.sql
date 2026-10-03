-- S319 (SkyRudder), 2026-10-03: Rule 8 ingest - seven new rows, all logged.
-- New (author 'SkyRudder-s319'): Sam's deploy go, timing-log ask and Jev direction (decision, verified: his
-- words); Sam's program requirements harvest (decision, verified: his words); the course lists and the
-- timing log live (milestone, verified: deploy runs); a prompt rule the model repeats (pitfall); the
-- supabase-js insert error that is returned, never thrown (pitfall); the first timing read (fact); Jev
-- absent from Sierra (fact).
-- Rollback: supersede the seven rows by author 'SkyRudder-s319' under actor 'SkyRudder-s319-rollback'.

insert into public.cpl_memory (slug, title, kind, summary, detail, plain, tags, affects, source, author, event_date, status, verified_by, verified_at)
values
('sam-deploy-go-timing-log-and-jev-2026-10-03',
 'Sam: deploy the course lists once the A/B is clean; add the timing log; find how best to use Jev',
 'decision',
 'Sam, 2026-10-03 (S319): "go ahead and deploy once the A/B is clean." Then, after asking whether Sierra uses Jev: "yes, add the timing log after the deploy and let see how best to use Jev as we continue to expand Sierra''s knowledgebase and capability". Both deployed: #1832 at 14:15Z, #1834 at 14:57Z.',
 'Sierra never calls Jev; only kb/ curation scripts do. The session advised measuring first: college_program_courses reads in 0.33 s, and the wait is mostly the model writing. First Jev use proposed: a judge over the A/B answers (our questions, Sierra''s answers, no visitor text leaves). Routing visitor questions through TypeSafe is a new outbound flow and goes through Governance first (Rule 10 a3).',
 'Sam approved deploying Sierra''s course lists and asked for a log of how long each answer takes, so the team can decide where Jev helps.',
 array['sierra','jev','deploy','timing'], array['chatbox/supabase/functions/cpl-chat/index.ts'],
 'Sam, S319 chat, 2026-10-03', 'SkyRudder-s319', '2026-10-03', 'verified', 'Sam', now()),
('sam-program-requirements-harvest-2026-10-03',
 'Sam: harvest each program''s required, list-choice and elective courses from local catalogs, our own best version first',
 'decision',
 'Sam, 2026-10-03 (S319), three statements verbatim in CPLBrain braindump 2026-10-03-1433: harvest each program''s required, optional (list) and elective courses from local catalogs; build our own best version now, the Tech Center''s COCI ROE fields a parallel track; a per-college source registry kept by agents, a per-college tab, and an agent per college the college and we own and train.',
 'The gap: the Program Course File lists every course but never says required, optional or elective; colleges use many CMSs and mostly PDF catalogs. The Butte Tech Center added COCI ROE fields; his three-year position is a summer amnesty for colleges to fill them. "I don''t want to let integration with the tech center to slow down anything." Plan: https://claude.ai/code/artifact/77ae8cb2-443b-45e3-b287-594c9c9b8744 (census of 115 credit colleges, pilot at five, four checks against the catalog, eight calls on sheet 23). Lane: docs/reference/lanes/program-requirements-harvest.md.',
 'Sam wants a statewide record of which courses in each program are required, so learners can see the CPL units they save.',
 array['program-requirements','catalog-harvest','coci','ppm','cpl-unit-savings'], array['docs/reference/lanes/program-requirements-harvest.md'],
 'Sam, S319 chat, 2026-10-03', 'SkyRudder-s319', '2026-10-03', 'verified', 'Sam', now()),
('sierra-course-lists-and-timing-log-live-2026-10-03',
 'Sierra lists a program''s courses at the college asked, and logs each answer''s time',
 'milestone',
 'cpl-chat deployed twice on 2026-10-03: 14:15Z (run 37128917426, main 9b282af, #1832) with college_program_courses and the honors-pair rule; 14:57Z (run 37131460494, main f9f5952, #1834) with chat_interactions.timings. A/B runs 37127850411 and 37130467747: 0 regressions. Smoke 7l asks for Mt. San Antonio''s LVN-to-RN courses (27).',
 'The timings column was applied live first (migration chat_interactions_timings): the preview writes the same table, and an insert naming a missing column loses the row.',
 'Sierra now names the courses a program lists at one college, and the team can see how long her answers take.',
 array['sierra','program-course','timing','deploy'], array['chatbox/supabase/functions/cpl-chat/index.ts','chatbox/smoke_test.sh'],
 'cpl-chat-deploy runs 37128917426 and 37131460494', 'SkyRudder-s319', '2026-10-03', 'verified', 'SkyRudder-s319 (deploy runs read back)', now()),
('a-prompt-rule-is-a-sentence-the-model-may-say-2026-10-03',
 'A rule in a model''s prompt is a sentence it may repeat: write it as the claim the reader needs',
 'pitfall',
 'The course-list rule said "honors versions and alternatives appear side by side". A/B run 37126608238 passed every mode, then told the student honors versions "appear side by side rather than as substitutes you''d choose between". The rule now says a student takes one course of each honors pair; the second A/B said so.',
 'Only reading the candidate''s prose found it; no assertion asked. KB note methodology-write-the-rule-as-the-sentence-you-want-said.',
 'An instruction written to describe the data came back to a student as wrong advice.',
 array['sierra','prompt-rules','a-b-testing'], array['chatbox/supabase/functions/cpl-chat/index.ts'],
 'S319, A/B runs 37126608238 and 37127850411', 'SkyRudder-s319', '2026-10-03', 'proposed', null, null),
('supabase-js-insert-error-is-returned-not-thrown-2026-10-03',
 'supabase-js returns an insert''s error and never throws it',
 'pitfall',
 'cpl-chat wrapped its chat_interactions insert in try/catch, which never fires: supabase-js resolves to {error}. A row the table refused (a column not yet migrated) was lost with clean logs. #1834 reads the returned error and logs it.',
 'Any supabase-js write in an edge function: check the returned error, and apply an additive column before deploying the code that writes it.',
 'A failed database save could disappear without any message; now it is logged.',
 array['supabase','edge-function','pitfall'], array['chatbox/supabase/functions/cpl-chat/index.ts'],
 'S319, #1834', 'SkyRudder-s319', '2026-10-03', 'proposed', null, null),
('sierra-timing-first-read-2026-10-03',
 'First timing read: Sierra''s answers take a median 15 s, most of it the model writing',
 'fact',
 'The preview''s 23 smoke turns (2026-10-03 14:41-14:54Z): median total 15,155 ms, first word 6,114, embed 148, retrieval 1,437, prep 2,236, model wait 939, writing 8,755; context 67,189 chars.',
 'Smoke questions are long, course-level asks, so they overstate a typical visitor''s wait. Re-read over a week of real traffic before choosing what to cut.',
 'In testing, about half of Sierra''s answer time is the model writing.',
 array['sierra','timing','performance'], array['chatbox/supabase/functions/cpl-chat/index.ts'],
 'chat_interactions.timings, 2026-10-03', 'SkyRudder-s319', '2026-10-03', 'proposed', null, null),
('jev-absent-from-sierra-2026-10-03',
 'Sierra never calls Jev; Jev runs only in the kb/ curation scripts',
 'fact',
 'Read 2026-10-03: no chatbox/ file references TypeSafe or Jev; kb/_jev_adjudicate.py, the decision-sheet builders and typesafe-smoke.yml do. The fit note (reference-system-one-model-fit-by-lane) lists Sierra uses as next: a first-pass judge on A/B answers, and routing (s279-skykeeper-jev-for-sierra).',
 'Jev answers closed questions with a probability (64k context, "large state" on its own failure list); it cannot search the 313,710-row course file.',
 'The Jev model is not part of Sierra yet.',
 array['jev','sierra'], array['chatbox/supabase/functions/cpl-chat/index.ts'],
 'S319 read of the repo', 'SkyRudder-s319', '2026-10-03', 'proposed', null, null)
on conflict do nothing;

insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select m.id, 'SkyRudder-s319', 'create', 'S319 ingest', to_jsonb(m)
from public.cpl_memory m
where m.author = 'SkyRudder-s319'
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');

-- S319, after the checkpoint (2026-10-03 ~15:15Z): one more row by 'SkyRudder-s319', logged
-- (note 'S319 ingest (sheet 23)'): sam-sheet23-harvest-calls-as-proposed-2026-10-03 (decision, verified: his
-- reply on sheet 23, replies/1 = "proposed", replies/done through 1). Rollback as above.
