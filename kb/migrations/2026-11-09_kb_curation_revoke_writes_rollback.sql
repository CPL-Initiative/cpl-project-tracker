-- ROLLBACK of kb/migrations/2026-11-09_kb_curation_revoke_writes.sql (S614): restores the grants read live on
-- 2026-11-09 before it.
grant insert, update, delete, truncate, references, trigger on public.kb_curation to anon;
grant truncate, references, trigger on public.kb_curation to authenticated;
