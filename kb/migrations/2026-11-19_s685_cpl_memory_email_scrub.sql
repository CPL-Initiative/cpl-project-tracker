-- S685 (SkyTowhee): take a staff email address out of one cpl_memory row's summary (COBIx on #3545, 12:15Z and 12:47Z).
-- The row d-issuer-tags-registered-empty-s684 landed at about 12:55Z (supabase-migrate run 44528020042) from S684's
-- rows file as it stood; the conductor had not yet read the thread that asked for the address to come out first.
-- A guarded UPDATE: that one slug, and only while its summary still holds an address after "reviewed_by". The pattern
-- names no address, so this file holds none. The wording left is the one COBIx proposed.
-- ROLLBACK: none is wanted, since the address must not return. The before-value is the row as S684's rows file wrote it
-- (kb/migrations/2026-11-19_s684_cpl_memory_rows.sql at commit 3a736158), which differs only by the address.
update public.cpl_memory
   set summary = regexp_replace(summary, 'reviewed_by [^ ]+@[^ ]+ on', 'reviewed_by on')
 where slug = 'd-issuer-tags-registered-empty-s684'
   and summary ~ 'reviewed_by [^ ]+@[^ ]+ on'
returning slug, status, length(summary) as summary_chars, (summary ~ '@') as still_holds_an_at_sign,
          substring(summary from 'Sam''s own saves[^.]*') as phrase_now;
