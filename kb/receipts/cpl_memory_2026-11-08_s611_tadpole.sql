-- S611 SkyTadpole (Sam's hand-opened session, 2026-11-08) checkpoint: two cpl_memory rows, INSERT-only, one call with its log
-- and verify (playbook-cpl-memory-auto-write-at-checkpoint). Lengths measured before staging: summary <= 400, detail <= 4000.
insert into public.cpl_memory (kind, slug, title, summary, detail, plain, tags, source, status, verified_by, verified_at, event_date, author, confidence) values
('pitfall','p-postgrest-cap-silences-a-cleanup','A cleanup that reads first never sees past the PostgREST row cap',
 'map_student_key_sketch held 74 pulls (148,000 hashes) against a keep-two loop: write_sketch read every pull with one limit=200000 GET, PostgREST answered 1,000 rows, so the cleanup never saw an older date. Fix (#2932): one row names the previous pull, page it to an empty page, delete by predicate on the server.',
 'Guard tests/map_key_sketch_one_pull_test.py fakes a 1,000-row and a 300-row cap; a fake that returns everything passes the bug. KB note methodology-paginate-postgrest-reads (2026-11-08 section). #2932 held for Sam: merging deletes the 73 older pulls (Open Asks Sheet 171 card 3).',
 'A nightly cleanup that asked for every row only ever got the first thousand, so it never deleted the old ones.',
 array['map-custom-reports','supabase','postgrest','disposition-grain-student-detail'],'cpl-project-tracker#2932','proposed',null,null,'2026-11-08','SkyTadpoleS611','high'),
('pitfall','p-id-doc-era-read-from-keys','An id-keyed document with no era stamp takes only the maps after its own era',
 'The curated anchor (kb/common_courses.json) carries no _rekeyed_through. The whole alias chain sent GRAF M10IB, an id the 2026-09-03 Z-band retirement re-used, to CRIM M11SD through the June fold. kb/_anchor_rekey_dryrun.py reads the era from the keys (latest producer; refuse on a skipped map) and applies pending maps only.',
 'Baseline on 2026-11-08: the 2026-09-04 prefix fold. Dry run: 2 re-keys, 15 prefix swaps, 6 for Sam (Open Asks Sheet 171 card 4). KB note methodology-read-a-documents-era-from-its-keys; guard tests/anchor_rekey_dryrun_test.py.',
 'Old course ids get reused, so a list has to be updated only with the renames made after it was written.',
 array['common-subjects-reference','m-id','alias-chain','remint'],'cpl-project-tracker#2935','proposed',null,null,'2026-11-08','SkyTadpoleS611','high')
on conflict do nothing;
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select id, 'SkyTadpoleS611', 'create', 'checkpoint auto-write (S611 SkyTadpole)', to_jsonb(m)
from public.cpl_memory m where m.slug in ('p-postgrest-cap-silences-a-cleanup','p-id-doc-era-read-from-keys')
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');
select m.slug, count(l.id) filter (where l.action='create') as creates
from public.cpl_memory m left join public.cpl_memory_log l on l.memory_id = m.id
where m.author = 'SkyTadpoleS611' group by m.slug order by m.slug;
