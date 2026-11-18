-- One guarded UPDATE of SkyPlover's own proposed row d-named-course-minimum-one-s667 (S667, 2026-11-16), applied by
-- supabase-migrate.yml (kb/migrations/.apply). COBIx on #3404 (18:01Z): of the 9 one-course records, Las Positas 45954
-- (Honors Scholar: HNRS 1 plus five honors courses by rule) and Los Angeles Valley 02964 (Foreign Languages A.A.: LING 001
-- plus two language requirements printed as rules) are not single-course programs. The records are complete; their other
-- requirements carry no course codes. The minimum of one stands; the summary's "each a real single-course certificate" was wrong.
-- GUARD: the row changes only while its summary is exactly the one 2026-11-16_s667_cpl_memory_rows.sql wrote and its
-- author is SkyPlover (S667); otherwise nothing is written. The log row keeps the whole row before and after.
-- ROLLBACK: kb/migrations/2026-11-16_s667_cpl_memory_fix_rollback.sql (restores the summary, guarded on the new text).

with old as (
  select * from public.cpl_memory
  where slug = 'd-named-course-minimum-one-s667' and author = 'SkyPlover (S667)' and summary = 'S667, COBIx''s empty-heading rule (#3299): a found page is extracted only if it names at least one course; it stays found either way. Of 19,137 filed records, 9 name one course, each a real single-course certificate (Victor Valley CJ 80, EMS 60; American River FIRE 1500), so a minimum of two would refuse real programs.'
), upd as (
  update public.cpl_memory m set summary = 'S667, COBIx''s empty-heading rule (#3299): a found page is extracted only if it names at least one course; it stays found either way. Of 19,137 filed records, 9 name one course: 7 single-course certificates (Victor Valley CJ 80; American River FIRE 1500) and 2 whose other requirements are rules (Las Positas HNRS 1). A minimum of two would refuse real programs.', updated_at = now()
  from old where m.id = old.id
  returning m.id, to_jsonb(old.*) as before_row
)
insert into public.cpl_memory_log (memory_id, actor, action, note, before, after)
select upd.id, 'SkyPlover (S667)', 'update', 'S667: COBIx on #3404, two of the nine one-course records add rule-based requirements',
       upd.before_row, (select to_jsonb(m) from public.cpl_memory m where m.id = upd.id)
from upd;
