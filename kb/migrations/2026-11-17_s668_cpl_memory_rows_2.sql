-- cpl_memory row for SkyPipit (S668), 2026-11-17, written at sign-off. Applied by supabase-migrate.yml once
-- kb/migrations/.apply names it (the next session, after S669's 2026-11-17_s669_cpl_memory_rows_2.sql receipt lands).
-- INSERT ... ON CONFLICT (slug) DO NOTHING. ROLLBACK: delete from public.cpl_memory where slug = 'd-bcc-41778-keeps-current-s668';
insert into public.cpl_memory (slug,kind,title,summary,tags,status,source,verified_by,verified_at,author,event_date) values
('d-bcc-41778-keeps-current-s668','decision','Berkeley City 41778 keeps its current record','S668: Berkeley City Mathematics 41778''s 2025-2026 read places 8 of 8 but names Cal-GETC with no units; the free reconcile rescore has no Berkeley City statewide Cal-GETC step, so it fails arithmetic while main''s record passes live. main''s record stays (Riverside City 32745''s precedent); NEXT a cited Cal-GETC step, then a free rescore.',array['program-requirements-harvest','curriqunet','decision'],'proposed','S668 sign-off; claude/prior-2025-berkeley-city-s668',null,null,'SkyPipit (S668)',date '2026-11-17')
on conflict (slug) do nothing;
