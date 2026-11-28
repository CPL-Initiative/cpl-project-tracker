-- Receipt: cpl_memory rows written by SkyCurlew (S744, Sam's plain session of 2026-11-27 from 16:00Z), through the
-- Supabase MCP by the conductor before its checkpoint. This file records them; it writes nothing itself.
-- The rows went in as INSERT ... ON CONFLICT (slug) DO NOTHING (insert-only), author 'skycurlew-s744@bot', each logged
-- 'create' in cpl_memory_log by actor 'skycurlew-s744@bot'. Sam's rulings are status 'verified', verified_by
-- 'Sam (in session S744)'; the rest are 'proposed'. The full text of each row (title, summary, tags, source,
-- verified_by) lives in the live table; read it back with the VERIFY query below rather than from this file.
--
-- Slugs written, by kind:
--   r-all-lp-links-open-bottom-bar-sam-2026-11-27      decision, verified (Sam: "have the get credit link open a bottom
--       bar so the user doesn't get stranded. bottom bars for wide (lots of) information and sidebars for more compact
--       details..."; "again, all links to lp go to bottom bar iframe of the lp")
--   r-cpl-glyph-map-pointer-sam-2026-11-27             decision, verified (Sam: "I think we may want to incorporate a CPL
--       glyph symbol that becomes recognizable over time. Thinking of using the MAP directional pointer we incorporate
--       into the A in MAP."; the 27th ruled mark beside the 26 of 2026-09-09)
--   r-compact-course-cards-sam-2026-11-27              decision, verified (the card iterations, settled "OK, let's go
--       with that")
--   r-stackable-programs-top-row-sam-2026-11-27        decision, verified (Sam: "the stackable programs is very exciting
--       development! would be nice to see a very compact set of cards in a top section of the pathway view showing the
--       stackable possibilities..."; "yes, measure and build it.")
--   r-get-credit-on-pathways-cards-sam-2026-11-27      decision, verified (Sam: "we could use the CPL Pathways views to
--       add the 'Get Credit' button that goes to the lp.")
--   d-icc-not-folded-s744                              decision, proposed (Cerro Coso's ICC is not folded: no IC
--       subject, not on the schedule; #3908)
--   f-map-landing-exhibit-param-pattern-s744           fact, proposed (?Exhibit= fills the landing page's search box;
--       every value must match ^[A-Za-z0-9]+(?:-[A-Za-z0-9]+){2,}$, at most 10, or the page drops the parameter; #3909)
--   f-cerritos-ironworkers-all-24-cpl-s744             fact, proposed (all 24 Field Ironworkers A.S. courses carry CPL
--       through the apprenticeship exhibits; the display build reads only MAPCXA-*, so it shows 15)
--   f-coci-description-shards-mojibake-s744            fact, proposed (coci_lookup_desc_*.js carries _x000D_ and
--       UTF-8-as-cp1252 mojibake)
-- No row is superseded.
--
-- ROLLBACK (insert-only, so a delete by slug undoes it):
--   delete from public.cpl_memory_log where memory_id in (select id from public.cpl_memory where slug in (
--     'r-all-lp-links-open-bottom-bar-sam-2026-11-27','r-cpl-glyph-map-pointer-sam-2026-11-27',
--     'r-compact-course-cards-sam-2026-11-27','r-stackable-programs-top-row-sam-2026-11-27',
--     'r-get-credit-on-pathways-cards-sam-2026-11-27','d-icc-not-folded-s744','f-map-landing-exhibit-param-pattern-s744',
--     'f-cerritos-ironworkers-all-24-cpl-s744','f-coci-description-shards-mojibake-s744'));
--   delete from public.cpl_memory where author = 'skycurlew-s744@bot' and slug in (
--     'r-all-lp-links-open-bottom-bar-sam-2026-11-27','r-cpl-glyph-map-pointer-sam-2026-11-27',
--     'r-compact-course-cards-sam-2026-11-27','r-stackable-programs-top-row-sam-2026-11-27',
--     'r-get-credit-on-pathways-cards-sam-2026-11-27','d-icc-not-folded-s744','f-map-landing-exhibit-param-pattern-s744',
--     'f-cerritos-ironworkers-all-24-cpl-s744','f-coci-description-shards-mojibake-s744');
--
-- VERIFY (expects 9 rows, 5 verified and 4 proposed, each summary at most 400 characters, each with one create):
select m.slug, m.kind, m.status, m.verified_by, length(m.summary) as summary_chars,
       count(l.id) filter (where l.action = 'create') as creates
from public.cpl_memory m left join public.cpl_memory_log l on l.memory_id = m.id
where m.slug in (
  'r-all-lp-links-open-bottom-bar-sam-2026-11-27','r-cpl-glyph-map-pointer-sam-2026-11-27',
  'r-compact-course-cards-sam-2026-11-27','r-stackable-programs-top-row-sam-2026-11-27',
  'r-get-credit-on-pathways-cards-sam-2026-11-27','d-icc-not-folded-s744','f-map-landing-exhibit-param-pattern-s744',
  'f-cerritos-ironworkers-all-24-cpl-s744','f-coci-description-shards-mojibake-s744')
group by m.slug, m.kind, m.status, m.verified_by, m.summary
order by m.slug;
