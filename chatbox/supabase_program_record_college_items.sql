-- ─────────────────────────────────────────────────────────────────────────
-- program_record_college_items — one row per item a program record gives its
-- college to correct. (S385 SkyHazel, 2026-10-13)
--
-- Sam, Open Asks Sheet 77 card 3 ("Build it", 2026-10-13 22:25Z): the boxes marked
-- "Catalog and state file differ" are the college's to correct, outside his confirm
-- (cpl_memory sam-coci-mismatch-flags-for-colleges-2026-10-13). The Records view now
-- shows them on one line a record, and each college's full list sits on My College
-- and in the MAP team's queue. The queue reads this view: one row an item, so it
-- counts every college's items in about 100 KB instead of reading every record's
-- gaps (5.2 MB). The Records view and My College read the same gaps from the table.
--
-- A row is a gap in program_requirement_records.display -> 'gaps' whose owner is the
-- college: today "Catalog and state file differ" (3,341) and "MAP names a second
-- course" (12), 3,353 items on 947 records at 16 colleges (measured 2026-10-13 22:55Z).
-- `n` is the gap's place in the record's list (1-based), so a reader keeps its order.
-- `loaded_at` is the record's, which ages the item in the MAP team's queue; every
-- display build restamps `built`, so it cannot.
--
-- security_invoker: the view reads as the caller, through the table's own policies and
-- column grants (anon and authenticated read every column used here, Sheet 67). It
-- writes nothing. The full count runs in about 70 ms (explain analyze, 2026-10-13).
-- ─────────────────────────────────────────────────────────────────────────
create or replace view public.program_record_college_items
with (security_invoker = on) as
select r.college,
       r.control_number,
       r.program_title,
       r.award,
       r.catalog_year,
       r.checked,
       r.loaded_at,
       g.n::int          as n,
       g.item ->> 'kind' as kind,
       g.item ->> 'text' as text
from public.program_requirement_records r
cross join lateral jsonb_array_elements(
  case when jsonb_typeof(r.display -> 'gaps') = 'array' then r.display -> 'gaps' else '[]'::jsonb end
) with ordinality as g(item, n)
where g.item ->> 'owner' = 'college';

comment on view public.program_record_college_items is
  'One row per program record gap the college owns (display.gaps owner = college), for the MAP team queue''s lists. Sam, Open Asks Sheet 77 card 3.';

-- Read only: new views in public carry the default grants, so take them back and give select.
revoke all on public.program_record_college_items from public, anon, authenticated;
grant select on public.program_record_college_items to anon, authenticated, service_role;
