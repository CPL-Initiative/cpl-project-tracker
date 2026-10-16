-- S370 SkyHolly, 2026-10-12. Rule 8 ingest, as applied through execute_sql (the longer form timed out four times;
-- the shorter one landed, as the lessons doc records). INSERT-only, idempotent on slug; each row logged to cpl_memory_log.
-- Rollback: delete these rows by slug (author SkyHollyS370).
insert into public.cpl_memory (slug, kind, title, summary, tags, status, source, verified_by, verified_at, event_date, author)
values ('sam-sheet-68-card-2-remove-lbcc-38542-2026-10-12', 'decision',
 'Sam (Sheet 68 card 2): remove Long Beach City 38542',
 'Sam, Open Asks Sheet 68 card 2 (2026-10-12 11:20Z): "Remove it". 38542 read the SMAW page the re-read gave to 38540. S370 deleted it under a receipt (#2028); 1,554 rows live.',
 array['program-requirements-harvest','long-beach-city'], 'verified', 'Sheet 68 replies item 2; #2028', 'Sam', now(), '2026-10-12', 'SkyHollyS370')
on conflict (slug) do nothing;

-- Checkpoint rows (S370), applied through execute_sql; each logged to cpl_memory_log (action create).
insert into public.cpl_memory (slug, kind, title, summary, tags, status, source, verified_by, verified_at, event_date, author) values
('sam-deploy-7c-fix-when-ab-clean-2026-10-12','decision','Sam: fix Sierra 7c, deploy when the A/B is clean','Sam, 2026-10-12, in chat to S370: "fix Sierra''s 7c answer while San Diego City runs", then "deploy it when the A/B is clean". #2032: the request goes to the course''s own college, the answer written once.',array['sierra','smoke'],'verified','in chat to S370; #2032','Sam',now(),'2026-10-12','SkyHollyS370'),
('my-college-public-contact-read-absent-column-2026-10-12','pitfall','My College told the public every college had no contact','The contact measure read primary_contact_email, which map_college_contacts_pub lacks, so public readers saw "No contact listed in MAP" beside a listed coordinator, since 2026-09-17. #2030 reads coordinator, else counselor, for a public reader.',array['my-college','map-users'],'proposed','#2030','',null,'2026-10-12','SkyHollyS370')
on conflict (slug) do nothing;
