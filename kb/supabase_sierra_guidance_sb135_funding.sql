-- supabase_sierra_guidance_sb135_funding.sql — one Sierra directive: CPL
-- funding is enacted under SB 135, not proposed.
--
-- Sam, 2026-10-21 (S443, before an 8 a.m. meeting with the CO): Sierra on the
-- funding page answered "the Governor has also proposed a $35M local
-- implementation fund", led with AB 123, and called the funding systemwide
-- rather than for individual colleges. Cause: her corpus holds vault notes from
-- February to July 2026 (cpl-fact-sheet-2026-02-10.md: "$35M one-time proposed
-- in Governor's 2026 budget"); one section names SB 135. This rule corrects her
-- on every surface until the corpus carries the enacted funding.
--
-- Facts from the funding page's own Overview (cpl_funding.js, x_lede). The max
-- award wording is Sam's verbatim (CLAUDE.md, Funding vocabulary).
--
-- INSERT-only, idempotent on created_by + rule prefix. Rollback (Rule 10 a2):
--   update public.sierra_guidance set active = false
--    where created_by = 'sierra-s443@bot';
-- or deactivate it in the Sierra training tab.
insert into public.sierra_guidance (rule, active, note, created_by, kind, surface)
select
  'CPL FUNDING IS ENACTED, NOT PROPOSED. Senate Bill 135 (Statutes of 2026, Chapter 79), the 2026 education trailer bill, added Article 9 to the Education Code (sections 78093 through 78093.2), effective July 13, 2026. It establishes the Credit for Prior Learning Initiative and directs the Chancellor''s Office to allocate designated funds to support implementation at each campus. The enacted 2026-27 budget appropriates $35 million one-time for CPL implementation, allocated across the 2026-27 and 2027-28 fiscal years. Most of it goes directly to institutions: all 118 (the 115 colleges and three noncredit-only campuses), each with its own max award, the maximum funding to be awarded based on measurable outcomes and allocated as credit and noncredit subtotals. The rest funds statewide CPL projects and technology. A college qualifies for its award through its CPL outcomes in MAP. Never describe this funding as proposed by the Governor, never say it is systemwide rather than for individual colleges, and never lead with AB 123 when asked about current or new CPL funding; AB 123 (2025) is the earlier funding. Point readers to the 2026-2028 CPL Initiative Funding page (https://cpl-initiative.github.io/cpl-project-tracker/funding-model/) for each institution''s figures. Say funding, never money.',
  true,
  'S443 for Sam, 2026-10-21: the funding page''s Sierra answered from pre-SB 135 vault notes. Retire once the corpus carries the enacted funding.',
  'sierra-s443@bot', 'directive', null
where not exists (
  select 1 from public.sierra_guidance
   where created_by = 'sierra-s443@bot' and rule like 'CPL FUNDING IS ENACTED%'
);
