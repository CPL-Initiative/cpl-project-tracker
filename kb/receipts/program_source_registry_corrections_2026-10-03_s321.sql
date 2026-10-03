-- S321 (SkyCatalog), 2026-10-03: six catalog addresses the census cannot reach, for a person to enter.
-- Staged for Sam's confirmation (open-asks sheet 24, card 2). Run it in the Supabase SQL editor, or
-- say "go" and a session you are watching runs it. Nothing here runs until a person confirms it.
--
-- Why a person: the four Los Rios homepages answer the census's browser 404, De Anza and City College
-- of San Francisco serve Cloudflare challenges (the census never works around one), and
-- catalog.losrios.edu, catalog.deanza.edu and catalog.ccsf.edu do not resolve (runs 37137334059,
-- 37139324090, 37140411314, 37141321117). The addresses below come from a web search on 2026-10-03.
--
-- What a correction does: program_source_census_apply() keeps a corrected row's values from then on,
-- files each later reading in census_evidence.census_values, and sets census_disagrees when the two
-- differ. access_status stays as the census saw it.
--
-- Rollback: the registry's trigger files every prior row in program_source_registry_history. To undo,
-- restore the six rows from the history entry written by this update (changed_by names the person) and
-- set corrected_by, corrected_at and correction_note back to null.

update public.program_source_registry as r set
  catalog_url      = v.url,
  catalog_year     = v.yr,
  catalog_platform = v.platform,
  catalog_format   = v.fmt,
  best_method      = 'person',
  corrected_by     = 'Sam (open-asks sheet 24)',
  corrected_at     = now(),
  correction_note  = v.note
from (values
  ('American River College', 'https://arc.losrios.edu/2026-2027-official-catalog', '2026-2027',
   'custom_html', 'html_per_program',
   'Los Rios publishes each catalog on the college site under a year path; the census reads the homepage as 404. Web search, S321.'),
  ('Folsom Lake College', 'https://flc.losrios.edu/2026-2027-official-catalog', '2026-2027',
   'custom_html', 'html_per_program',
   'Los Rios year path, as American River. Web search, S321.'),
  ('Sacramento City College', 'https://scc.losrios.edu/2026-2027-official-catalog', '2026-2027',
   'custom_html', 'html_per_program',
   'Los Rios year path, as American River. Web search, S321.'),
  ('Cosumnes River College', 'https://www.crc.losrios.edu/catalog', null,
   'custom_html', 'unknown',
   'The 2025-26 official catalog and a 2026-27 preview were found, no 2026-27 official; /catalog is the college''s stable entry. Web search, S321.'),
  ('De Anza College', 'https://www.deanza.edu/catalog/', null,
   'custom_html', 'unknown',
   'The site serves the census a Cloudflare challenge; the catalog sits at deanza.edu/catalog. Web search, S321.'),
  ('City College of San Francisco', 'https://www.ccsf.edu/catalog', null,
   'pdf', 'pdf_by_section',
   'Cloudflare challenge; CCSF publishes its catalog as PDFs by section (latest seen: 2025-26 front matter). Web search, S321.')
) as v(college, url, yr, platform, fmt, note)
where r.college = v.college
  and r.corrected_by is null;

-- Read back: six rows, each corrected.
select college, catalog_url, catalog_year, catalog_platform, corrected_by, corrected_at
from public.program_source_registry
where corrected_by = 'Sam (open-asks sheet 24)'
order by college;
