-- S418 SkyMadrone, 2026-10-18 19:20Z. cpl_memory hygiene: Sam's Commons approval was written twice within minutes,
-- by S417 (sam-approves-commons-mockup-collapse-2026-10-18, the first-hand session, verified under Sam's name) and by
-- S418 (sam-commons-mockup-approved-collapse-controls-2026-10-18, from S417's relay, carrying the relay's first time,
-- 17:31Z, which S417 corrected to 19:08Z). S417's row stands; S418's is superseded explicitly, same source, same fact.
-- Through supabase-migrate.yml because execute_sql holds an UPDATE for a confirmation. Idempotent. Rollback: set the
-- row's status back to 'verified' and superseded_by to null.
update public.cpl_memory
set status = 'superseded',
    superseded_by = 'sam-approves-commons-mockup-collapse-2026-10-18',
    detail = coalesce(detail, '') || ' Superseded by S418 (19:20Z): a duplicate of sam-approves-commons-mockup-collapse-2026-10-18, S417''s first-hand row; this row''s 17:31Z was the relay''s first time, corrected by S417 to 19:08Z.',
    updated_at = now()
where slug = 'sam-commons-mockup-approved-collapse-controls-2026-10-18'
  and status <> 'superseded';
