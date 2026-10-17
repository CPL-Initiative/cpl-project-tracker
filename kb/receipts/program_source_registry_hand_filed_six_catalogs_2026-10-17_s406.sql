-- S406 (SkyIronwood), 2026-10-17: six registry rows pointed at the catalog PDFs Sam found.
-- NOT YET APPLIED: the repo's Supabase guard held the UPDATE for a person (16:00Z); it goes to Sam as a paste card on
-- Open Asks Sheet 90. Once pasted, the RETURNING rows are the read-back.
--
-- Why: Sam pasted each refused college's catalog PDF address in chat to S405 (hand-opened), ~15:00Z, and posted
-- the files to the catalog-files release (cpl_memory sam-hand-filed-catalog-pdf-links-2026-10-17: "the registry
-- rows can point at them (his paste is the approval)"). The reader reads the release copies
-- (kb/hand_filed_catalogs/, #2199); these rows name the college's own address, as the copies' provenance does.
-- Cerro Coso's and Porterville's rows already named Sam's addresses and are not touched.
-- De Anza publishes its 2026-2027 catalog only as HTML, so its row names the 2025-2026 PDF, a year-behind
-- catalog as Palo Verde's row is (cpl_memory sam-catalog-files-release-de-anza-2025-26-2026-10-17).
-- access_status is the host's answer to the reader and stays as the census read it.
--
-- BEFORE (read 2026-10-17 ~15:55Z through execute_sql; corrected_by 'Sam (open-asks sheets 25 and 26)' on all six,
-- best_method 'person'):
--   American River College (18)        | https://arc.losrios.edu/2026-2027-official-catalog | 2026-2027
--     | custom_html | html_per_program | not_found
--     | note: Los Rios publishes each catalog on the college site under a year path; the census reads the homepage as 404. Web search, S321.
--   City College of San Francisco (30) | https://www.ccsf.edu/catalog | null | pdf | pdf_by_section | blocked
--     | note: Cloudflare challenge; CCSF publishes its catalog as PDFs by section (latest seen: 2025-26 front matter). Web search, S321.
--   Cosumnes River College (43)        | https://www.crc.losrios.edu/catalog | null | custom_html | unknown | not_found
--     | note: The 2025-26 official catalog and a 2026-27 preview were found, no 2026-27 official; /catalog is the college's stable entry. Web search, S321.
--   De Anza College (47)               | https://www.deanza.edu/catalog/ | null | custom_html | unknown | blocked
--     | note: The site serves the census a Cloudflare challenge; the catalog sits at deanza.edu/catalog. Web search, S321.
--   Folsom Lake College (53)           | https://flc.losrios.edu/2026-2027-official-catalog | 2026-2027
--     | custom_html | html_per_program | not_found | note: Los Rios year path, as American River. Web search, S321.
--   Sacramento City College (95)       | https://scc.losrios.edu/2026-2027-official-catalog | 2026-2027
--     | custom_html | html_per_program | not_found | note: Los Rios year path, as American River. Web search, S321.
--
-- Rollback: the registry's trigger files each prior row in program_source_registry_history. To undo, restore the
-- six rows from those entries (or the BEFORE values above), with corrected_by back to
-- 'Sam (open-asks sheets 25 and 26)'.

update public.program_source_registry r set
  catalog_url      = v.url,
  catalog_year     = v.year,
  catalog_platform = 'pdf',
  catalog_format   = 'single_pdf',
  corrected_by     = 'Sam (his catalog PDF addresses, 2026-10-17), applied by S406 SkyIronwood',
  corrected_at     = now(),
  correction_note  = v.note
from (values
  ('American River College', 'https://arc.losrios.edu/2026-2027-official-catalog',
   'https://arc.losrios.edu/catalog/compiled-catalog/arc-catalog-26-27.pdf', '2026-2027',
   'Los Rios publishes one compiled PDF of each catalog; the host answers the reader 404, so the reader reads the copy Sam filed (kb/hand_filed_catalogs/american_river.json).'),
  ('City College of San Francisco', 'https://www.ccsf.edu/catalog',
   'https://www.ccsf.edu/sites/default/files/2026/document/ccsf-catalog-2026-27.pdf', '2026-2027',
   'CCSF publishes the 2026-2027 catalog as one compiled PDF; the host serves the reader a Cloudflare challenge, so the reader reads the copy Sam filed (kb/hand_filed_catalogs/city_of_san_francisco.json).'),
  ('Cosumnes River College', 'https://www.crc.losrios.edu/catalog',
   'https://crc.losrios.edu/catalog/compiled-catalog/crc-catalog-26-27.pdf', '2026-2027',
   'Los Rios publishes one compiled PDF of each catalog; the host answers the reader 404, so the reader reads the copy Sam filed (kb/hand_filed_catalogs/cosumnes_river.json).'),
  ('De Anza College', 'https://www.deanza.edu/catalog/',
   'https://www.deanza.edu/catalog/documents/dac_catalog_2025-2026.pdf', '2025-2026',
   'De Anza publishes its 2026-2027 catalog only as HTML behind a Cloudflare challenge; the 2025-2026 PDF and its spring 2026 addendum are read as a year-behind catalog (Palo Verde precedent) from the copies Sam filed (kb/hand_filed_catalogs/de_anza.json).'),
  ('Folsom Lake College', 'https://flc.losrios.edu/2026-2027-official-catalog',
   'https://flc.losrios.edu/catalog/compiled-catalog/flc-catalog-26-27.pdf', '2026-2027',
   'Los Rios publishes one compiled PDF of each catalog; the host answers the reader 404, so the reader reads the copy Sam filed (kb/hand_filed_catalogs/folsom_lake.json).'),
  ('Sacramento City College', 'https://scc.losrios.edu/2026-2027-official-catalog',
   'https://scc.losrios.edu/catalog/compiled-catalog/scc-catalog-26-27.pdf', '2026-2027',
   'Los Rios publishes one compiled PDF of each catalog; the host answers the reader 404, so the reader reads the copy Sam filed (kb/hand_filed_catalogs/sacramento_city.json).')
) as v(college, was_url, url, year, note)
where r.college = v.college
  and r.catalog_url = v.was_url
  and r.corrected_by = 'Sam (open-asks sheets 25 and 26)'
returning r.college, r.catalog_url, r.catalog_year, r.catalog_platform, r.catalog_format;
