-- One guarded UPDATE of one cpl_memory_log row (S667 SkyPlover, 2026-11-16), applied by supabase-migrate.yml.
-- COBIx on #3404 (18:13Z, confirmed by a read-only check at 18:20Z): 2026-11-16_s667_cpl_memory_fix.sql built its
-- log row's `after` with a SELECT inside the same WITH statement as the UPDATE, and every part of one statement reads
-- one snapshot, so `after` holds the row before the change (equal to `before`). The live cpl_memory summary is correct.
-- This sets that one log row's `after` to the row as it stands now.
-- GUARD: only log row 61e8c09a-d756-4db7-a3c2-27dc02188d1d, only while its actor, action and memory_id are the fix's
-- and its `after` still equals its `before`; otherwise nothing is written.
-- PITFALL for the next guarded UPDATE with a log row: return the new row from the UPDATE itself
-- (`returning to_jsonb(m.*)`) rather than selecting it again in the same statement.
-- ROLLBACK: kb/migrations/2026-11-16_s667_cpl_memory_log_after_fix_rollback.sql
update public.cpl_memory_log l
set after = (select to_jsonb(m) from public.cpl_memory m where m.id = l.memory_id)
where l.id = '61e8c09a-d756-4db7-a3c2-27dc02188d1d'
  and l.actor = 'SkyPlover (S667)'
  and l.action = 'update'
  and l.memory_id = (select id from public.cpl_memory where slug = 'd-named-course-minimum-one-s667')
  and l.after = l.before;
