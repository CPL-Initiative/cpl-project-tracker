-- S327 (SkyAmend), 2026-10-04 ~18:10Z: Rule 8 ingest - two rows, both Sam's own words, both logged.
-- New (author 'SkyAmend-s327'): CSU LA stays counted, and its harvest procedure is still to be worked
-- out (decision, verified: his words); course and program outcomes join the ROEP harvest, and a process
-- compares harvested credential skills with course outcomes (decision, verified: his words).
-- Rollback: supersede the two rows by slug under actor 'SkyAmend-s327-rollback'.

insert into public.cpl_memory (slug, title, kind, summary, detail, plain, tags, affects, source, author, event_date, status, verified_by, verified_at)
values
('sam-keep-csu-la-in-the-mix-2026-10-04',
 'Sam: California State University Los Angeles stays counted on MAP; its harvest procedure is still to be worked out',
 'decision',
 'Sam, 2026-10-04 (S327 opening): "Keep CSU LA in the mix as they are our first CSU starting to use MAP. We''ll figure out a procedure for them as well." The dashboard keeps counting California State University Los Angeles, which the 16:55Z scrape added to MAP''s tiers (116 listed).',
 'CSU LA has no row in map_colleges, coci_college_programs or program_source_registry (read 2026-10-04). Nothing errors on the unresolved name; wording that calls every counted institution a community college is now false (the public KB letter blocks "of California''s {{SW_TOTAL_COLLEGES}} community colleges"; the KPI card "of 116 system colleges"; Sierra''s 115 fallback). A CSU catalog has no state Program Course File, so the harvest''s coverage check needs another closed list for it. Open asks on the standing sheet. Vault braindump 2026-10-04 18:03.',
 'The first CSU campus on MAP stays in the counts, and it will get its own catalog-reading procedure.',
 array['csu','map-platform','live-metrics','program-requirements','college-identity'], array['live_metrics.json','excel_to_dashboard.py','docs/reference/lanes/program-requirements-harvest.md'],
 'Sam, S327 chat, 2026-10-04', 'SkyAmend-s327', '2026-10-04', 'verified', 'Sam', now()),
('sam-harvest-outcomes-for-alignment-2026-10-04',
 'Sam: the ROEP harvest also grabs published course and program outcomes, and a process compares credential skills with course outcomes',
 'decision',
 'Sam, 2026-10-04 18:03Z: add an element to the ROEP harvest procedures that grabs published course and program outcomes (CMSs, newer COCI courses, catalog listings), and build a process that compares harvested credential skills with course outcomes for alignment indicators. COCI course outcomes are not yet in our dataset.',
 'His words: "we need a process to compare the cert skills we harvest to course outcomes for alignment indicators. Also makes me thing we need to add an element to our ROEP harvest procedures to grab any published course and program outcomes our agents can find. Outcomes should be listed in the CMSs and to newer COCI courses as well as on catalog listings we''re grabbing. I don''t believe we''ve been able to get the COCI course outcomes included in our dataset yet, but it''s something to check on as we go." Said after S327 reported that the "for consideration" kind of CPL has no source rows: no unarticulated CER title and none of the 1,165 IT/AI catalog credentials names a course identity. Checked the same day: kb/reference/industry_credential_skills.json (the cert half) is named by the IT/AI catalog builder and the watch agent and is not in the repo; course SLOs are uncaptured (kb/_row_audit.py MC slots all not_yet_captured; roadmap Phase 4 SLO ingestion parked). Vault braindump 2026-10-04 18:03.',
 'Collect the outcomes colleges publish for courses and programs, and compare them with the skills a credential certifies to find likely matches.',
 array['program-requirements','roep','outcomes','slo','credential-skills','alignment'], array['docs/reference/lanes/program-requirements-harvest.md','kb/_build_it_ai_credential_catalog.py','kb/_row_audit.py'],
 'Sam, S327 chat, 2026-10-04', 'SkyAmend-s327', '2026-10-04', 'verified', 'Sam', now())
on conflict do nothing;

insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select m.id, 'SkyAmend-s327', 'create', 'S327 ingest (CSU LA; outcomes)', to_jsonb(m)
from public.cpl_memory m
where m.author = 'SkyAmend-s327'
  and m.slug in ('sam-keep-csu-la-in-the-mix-2026-10-04', 'sam-harvest-outcomes-for-alignment-2026-10-04')
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');
