-- S287 (SkyMatrix), 2026-09-24: the EACR tweaks session. Rule 8 ingest — three rows, INSERT-only, idempotent on slug.
-- Two are Sam's decisions (verified_by names him; the words are his, from the standing sheet's store and his
-- opening message); one is a measurement this session made in Chromium. Summary is one sentence of at most 400
-- characters (cpl_memory_summary_check); the long text sits in detail; plain is present on every row.
-- The log entry is a SEPARATE statement (a data-modifying CTE cannot see its own rows). Idempotent.
-- Rollback: delete from cpl_memory where author = 'SkyMatrix-s287';
--           then delete from cpl_memory_log where actor = 'SkyMatrix-s287' and action = 'create';
insert into public.cpl_memory (slug, kind, title, summary, detail, plain, tags, source, related, status, superseded_by, scope, verified_by, event_date, author)
values
 ('asccc-areas-come-from-map-sam-2026-09-22', 'decision', 'ASCCC areas: MAP carries them, Pedro can export them',
  'Sam ruled add on the standing sheet''s ASCCC-areas card on 2026-09-22 and wrote that MAP carries every location''s regions and Pedro can produce a MAP Custom Report listing them, so the authoritative ASCCC Area roster is MAP''s own export rather than a county derivation.',
  'Verbatim, the card''s note: ''I believe you have this in our dataset. I know it is available from the MAP dashboard. If you need me to add a MAP Custom report that lists all locations with their various regions, let me know and I will ask Pedro for it'' (verdict chip: add). Context: kb/reference/swp_region_map.json had recorded ASCCC areas as NOT FOUND in any Supabase column or repo file and asked for the source to be named. On 2026-09-24 the EACR''s ASCCC Area filter shipped on a PROVISIONAL map, kb/reference/asccc_area_map.json (36 of 118 colleges anchored to asccc.org text read through search snippets, 82 by the Areas'' geographic descriptions; asccc.org, cccco.edu and web.archive.org are egress-blocked from the sandbox), applied to college_lookup.js by kb/_apply_asccc_areas.py. The open ask on the sheet is now: yes to the Custom Report, or a paste of asccc.org/area-college-list.',
  'The Academic Senate''s four areas come from MAP''s own data, which Pedro can export; the map on the site until then is a stand-in.',
  array['asccc','regions','partner-crosswalks','eacr','map-custom-reports'],
  'standing open-asks sheet FTEhLfMxhRfv4YH6DGSPhn, replies/18 (by sam, 2026-09-22T19:37Z)',
  array['swp-region-roster-is-the-consortium'],
  'verified', null, 'college identity', 'Sam', '2026-09-22', 'SkyMatrix-s287'),
 ('eacr-ten-tweaks-sam-2026-09-24', 'decision', 'Sam''s ten EACR tweaks, 2026-09-24',
  'Sam, 2026-09-24, asked for ten changes to the Exhibit Adoption view: CIP Sectors for Career Cluster with the complete list, an ASCCC Area filter, vertical college headers, a drill-down by exhibit title and units, no scope or threshold chips, CIP-sector row sections, a cell hover listing the college''s recommendations, and a Create Handout link to My College.',
  'Verbatim, his numbered list: 1. Provide a complete list in drop down filter for Career Clusters and change label for this to CIP Sectors based on CIP--allow multi-select on all possible filters on this tab. 2. Add ASCCC Region Filter next to SW Region filter. 3. Make the college column headers full vertical (reading bottom to top) instead of diagonal to save horizontal column width. 4. drill down on Exhibit links on rows should show Exhibit Title and Total units instead of MAP ID. 5. Don''t need the College Filter Matches chips or chips for Rows-Credential with at least... 6. Add Exhibit row headers based on CIP sectors and alpha sort Exhibits in those sections. 7. Hover over on green and mustard college units should show list of credit recommendations and units approved by college. 8. Make sure everything is properly wired to dependencies and is AA compliant and mobile friendly. 9. Optimize speed/performance wherever possible. 10. Add Create Handout button and link to the Handout feature on the My College tab (I believe that''s the one that has it). Shipped the same day (statewide_interactive.js, excel_to_dashboard.py, college_lookup.js); the data half (cip_sector, top_codes, exhibit_records, adopter_rec_idx, cip_sectors) lands with the first daily-dashboard run after the merge. Two readings stated as assumptions: every credential with an adopting college is a matrix row (his screen had 1 adopter selected), and the handout feature is My College''s Report plus its occupation opportunity register.',
  'Sam''s ten changes to the exhibit adoption page, in his words, and what shipped for each.',
  array['eacr','exhibit-adoption','adoption-matrix','cip','asccc','handout','sam-ruling'],
  'Sam''s opening message, 2026-09-24 (session 287); docs/reference/lanes/eacr-exhibit-cr-adoption.md',
  array['sam-eacr-matrix-design-rulings','sam-eacr-defaults-and-a11y-standing'],
  'verified', null, 'eacr', 'Sam', '2026-09-24', 'SkyMatrix-s287'),
 ('a-grid-past-a-few-hundred-thousand-cells-needs-a-window', 'pitfall', 'A 316,000-cell table needs a window, not chunks',
  'Measured 2026-09-24 in Chromium: the EACR matrix at 2,675 rows by 118 columns took 18 to 23 seconds to land as a chunked table and 200 to 500 ms per scroll frame afterwards, with or without the sticky headers, and a windowed render holding 25 to 40 rows in the DOM paints in about 80 ms with wheel-scroll frames at a 33 ms median.',
  'Chunking spreads the JavaScript cost across frames and leaves the DOM cost untouched; past a few hundred thousand cells the DOM cost is the whole problem. The window: two spacer rows carry the height of everything outside it, every credential row is a fixed 52px (titles clamp to two lines, the th title attribute and DOM text keep the whole), section headers are 30px, an expanded drill-down is measured once rendered, the current section header is rendered one line early so the sticky rule keeps it named, and a focused cell survives a re-render by (row, column). Fixed table layout and removing every sticky rule were both measured first and changed nothing. Note: docs/kb-notes/methodology-a-grid-past-a-few-hundred-thousand-cells-needs-a-window-not-chunks.md.',
  'A very large table has to render only the part on screen; splitting the whole thing into pieces does not make it fast.',
  array['performance','eacr','adoption-matrix','cobi','methodology'],
  'session measurement, Playwright + Chromium, 2026-09-24 (scratch scripts pw_matrix.js, pw_sticky.js)',
  array['sam-eacr-matrix-design-rulings'],
  'verified', null, 'cobi', 'session', '2026-09-24', 'SkyMatrix-s287')
on conflict (slug) do nothing
returning slug, kind, status;

insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select m.id, 'SkyMatrix-s287', 'create',
       'S287 write, 2026-09-24 (kb/receipts/cpl_memory_2026-09-24_s287.sql)',
       to_jsonb(m)
from public.cpl_memory m
where m.author = 'SkyMatrix-s287'
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');

select m.slug, count(l.id) filter (where l.action = 'create') as creates
from public.cpl_memory m
left join public.cpl_memory_log l on l.memory_id = m.id
where m.author = 'SkyMatrix-s287'
group by m.slug order by m.slug;
