-- kb_curation: anon loses every write grant, and authenticated loses TRUNCATE (S614; COBIx on #2950 item 2). Read
-- live 2026-11-09: anon=arwdDxtm and authenticated=arwdDxtm. RLS already refuses anon's INSERT, UPDATE and DELETE
-- (the three write policies name authenticated only), and RLS does not govern TRUNCATE, so these grants let any caller
-- with a SQL path as anon or authenticated empty the table. Every browser write sends a reviewer's token
-- (authenticated); every kb/*.py write uses service_role. Same fix as security step 3 (#2901) and the student-grain
-- revoke (S604). Apply only on Sam's word (Sheet 167 card 4: each security item on his word).
-- Rollback: 2026-11-09_kb_curation_revoke_writes_rollback.sql
revoke insert, update, delete, truncate, references, trigger on public.kb_curation from anon;
revoke truncate, references, trigger on public.kb_curation from authenticated;

-- Read back (expect only SELECT for anon; SELECT, INSERT, UPDATE, DELETE for authenticated):
--   select grantee, string_agg(privilege_type, ',' order by privilege_type) from information_schema.role_table_grants
--   where table_schema = 'public' and table_name = 'kb_curation' and grantee in ('anon','authenticated') group by 1;
