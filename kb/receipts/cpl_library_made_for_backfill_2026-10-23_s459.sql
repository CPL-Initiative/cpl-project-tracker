-- S459 SkyBuckeye, 2026-10-23: the Made-for backfill (Sam, Open Asks Sheet 120 card 7, "backfill", his own call;
-- and his Kind call on the mock-up, ~20:08Z: a page opened in a browser is a visual, Word and PDF stay documents).
-- Runs after kb/supabase_cpl_library.sql (the columns) and kb/supabase_cpl_library_public.sql (the public read).
--
-- What it does, in three guarded statements (Rule 10 a2: each applies only to a row still in the state read):
--   1. the twelve colleges' CPL Opportunity pages: kind document -> visual, Made for College, For <the college as MAP
--      spells it, the name the page's ?college= carries>;
--   2. the twelve workbooks: Made for College, For <the college> (kind stays spreadsheet);
--   3. the DSP page (a Claude page): kind document -> visual, Made for Agency, For DDS, Aging and LWDA; and the ELL IET
--      award notice (a PDF, kind stays document): Made for Agency, For EDD ELL IET Fund grantees.
-- Left alone on purpose: the open-asks series record stays kind document (Sam's call 9, 2026-10-05: decision sheets
-- are "kind document, occasion Open asks"), and the funding guidance memo page carries no ruling.
--
-- BEFORE (read live through the Supabase MCP, 2026-10-23 ~20:30Z): every row below reads for_kind null and for_name
-- null (the columns are new), the twelve pages and the DSP page read kind 'document', the workbooks 'spreadsheet',
-- the ELL IET record 'document'. cpl_library_history_trg files each prior row as well.
-- ROLLBACK: update public.cpl_library set kind = 'document', for_kind = null, for_name = null, updated_by = 'library-made-for-s459@bot'
--   where slug in (the twelve -visual slugs, 'dsp-credit-starting-points');
-- update public.cpl_library set for_kind = null, for_name = null, updated_by = 'library-made-for-s459@bot'
--   where slug in (the twelve -workbook slugs, 'ell-iet-cpl-ideas-mvlcfx9k').
-- A good result: 12, 12 and 2 rows, each returning its slug, kind, for_kind and for_name.
-- APPLIED: run 40031759397, 2026-10-23 22:14:22Z (kb/receipts/migration_cpl_library_made_for_backfill_2026_10_23_s459_40031759397.json);
-- read back live at 22:27Z: 12 visual/college, 12 spreadsheet/college, the DSP page visual/agency, the ELL IET notice
-- document/agency, every row updated_by library-made-for-s459@bot at 22:14:22Z.

update public.cpl_library l set kind = 'visual', for_kind = 'college', for_name = v.name, updated_by = 'library-made-for-s459@bot'
from (values
  ('cpl-opportunity-american-river-visual', 'American River College'),
  ('cpl-opportunity-bakersfield-visual', 'Bakersfield College'),
  ('cpl-opportunity-cerritos-visual', 'Cerritos College'),
  ('cpl-opportunity-foothill-visual', 'Foothill College'),
  ('cpl-opportunity-moreno-valley-visual', 'Moreno Valley College'),
  ('cpl-opportunity-norco-visual', 'Norco College'),
  ('cpl-opportunity-rio-hondo-visual', 'Rio Hondo College'),
  ('cpl-opportunity-san-bernardino-valley-visual', 'San Bernardino Valley College'),
  ('cpl-opportunity-san-joaquin-delta-visual', 'San Joaquin Delta College'),
  ('cpl-opportunity-santiago-canyon-visual', 'Santiago Canyon College'),
  ('cpl-opportunity-sierra-visual', 'Sierra College'),
  ('cpl-opportunity-riverside-city-visual', 'Riverside City College')
) as v(slug, name)
where l.slug = v.slug and l.kind = 'document' and l.for_kind is null and l.retired_at is null
returning l.slug, l.kind, l.for_kind, l.for_name;

update public.cpl_library l set for_kind = 'college', for_name = v.name, updated_by = 'library-made-for-s459@bot'
from (values
  ('cpl-opportunity-american-river-workbook', 'American River College'),
  ('cpl-opportunity-bakersfield-workbook', 'Bakersfield College'),
  ('cpl-opportunity-cerritos-workbook', 'Cerritos College'),
  ('cpl-opportunity-foothill-workbook', 'Foothill College'),
  ('cpl-opportunity-moreno-valley-workbook', 'Moreno Valley College'),
  ('cpl-opportunity-norco-workbook', 'Norco College'),
  ('cpl-opportunity-rio-hondo-workbook', 'Rio Hondo College'),
  ('cpl-opportunity-san-bernardino-valley-workbook', 'San Bernardino Valley College'),
  ('cpl-opportunity-san-joaquin-delta-workbook', 'San Joaquin Delta College'),
  ('cpl-opportunity-santiago-canyon-workbook', 'Santiago Canyon College'),
  ('cpl-opportunity-sierra-workbook', 'Sierra College'),
  ('cpl-opportunity-riverside-city-workbook', 'Riverside City College')
) as v(slug, name)
where l.slug = v.slug and l.kind = 'spreadsheet' and l.for_kind is null and l.retired_at is null
returning l.slug, l.kind, l.for_kind, l.for_name;

update public.cpl_library set kind = 'visual', for_kind = 'agency', for_name = 'DDS, Aging and LWDA', updated_by = 'library-made-for-s459@bot'
where slug = 'dsp-credit-starting-points' and kind = 'document' and for_kind is null and retired_at is null
returning slug, kind, for_kind, for_name;

update public.cpl_library set for_kind = 'agency', for_name = 'EDD ELL IET Fund grantees', updated_by = 'library-made-for-s459@bot'
where slug = 'ell-iet-cpl-ideas-mvlcfx9k' and kind = 'document' and for_kind is null and retired_at is null
returning slug, kind, for_kind, for_name;
