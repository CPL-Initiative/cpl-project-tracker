-- ═══════════════════════════════════════════════════════════════════════════
-- Budget tab rework — structure + seed  (Sam's decisions, 2026-07-30)
--
-- COMMITTED RECEIPT for the migration `budget_funding_structure` + the data
-- seed applied via the Supabase MCP the same day. Re-runnable (idempotent):
-- every INSERT is keyed on a natural unique text and guarded.
--
-- Sam's three rulings (AskUserQuestion, 2026-07-30), all implemented here:
--   1. ONE consolidated $7M ongoing row from 2026-27, retiring the separate
--      $5M/$2M future years. The 2025-26 $5M stays as its own historical year.
--   2. The Sept-2026 BOG amendment's 2-year shape governs the $35M everywhere;
--      its three components become their own Uses lines.
--   3. Cutoff at 2025-26; ARCHIVE, don't delete.
--
-- ── The row-5 anomaly this fixes ──────────────────────────────────────────
-- Row 5 was named "$2M P98" but carried $7,000,000 x 4 years in the year cells
-- while `total` said $8,000,000. Not a typo — TWO CONCEPTS in one row: `total`
-- was the INCREMENT ($2M x 4), the year cells were the COMBINED ongoing
-- ($5M base + $2M increment = $7M/yr). It becomes the single $7M ongoing row.
--
-- ── Why nothing is deleted ────────────────────────────────────────────────
-- Rows 1 and 2 ($6M P98, CO $2,254,764 / RCCD $3,745,235.64) turn out to be the
-- NATURAL PARENTS of the seven $6M allocations in Sam's funding history:
--     CO   = ASCCC 1,563,900 + Foundation AI 200,000 + RP 57,275
--          + WestEd 200,000 + Foundation Regional 233,589 = 2,254,764  ✓
--     RCCD = AI Apprenticeship 1,345,236 + transfer 2,400,000 = 3,745,236  ✓
-- So the history nests UNDER the existing rows — no repurposing, no deletion.
--
-- ── The $59,692, resolved ─────────────────────────────────────────────────
-- AI Apprenticeship CPL drew 1,345,236 from the $6M and 59,692 from the $15M
-- = 1,404,928 — "the $1.4M N2N project". Sam's "supplemented operations", the
-- amendment's "N2N Project Partial Funding" and PR #936's narrative are one fact.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Structure ──────────────────────────────────────────────────────────
alter table public.budget_funding
  add column if not exists description  text,
  add column if not exists archived     boolean not null default false,
  add column if not exists parent_id    integer references public.budget_funding(id) on delete cascade,
  add column if not exists section      text,
  add column if not exists sort_order   integer,
  add column if not exists window_label text;

create index if not exists budget_funding_parent_idx  on public.budget_funding(parent_id);
create index if not exists budget_funding_section_idx on public.budget_funding(section, sort_order);

comment on column public.budget_funding.archived is
  'Pre-cutoff (before 2025-26). Rendered behind a disclosure and excluded from every total; retained so historical totals still reconcile.';
comment on column public.budget_funding.parent_id is
  'Parent line. Children are the collapsible detail beneath a budget total (project pool -> projects; $6M -> its allocations).';
comment on column public.budget_funding.section is
  'source_one_time | source_ongoing | use_35m | use_15m | use_ongoing | pool | history';
comment on column public.budget_funding.window_label is
  'Free text for a line whose per-year split is NOT derivable from the source document — shown instead of inventing a schedule.';

-- ── 2. Re-point the six existing rows ─────────────────────────────────────
-- 1 + 2: the $6M era, archived behind the cutoff, now parents of the history.
update public.budget_funding set
  name = 'CPL Scaling Statewide — $6M Prop 98 · CO administration',
  description = 'P98 Scaling CPL Statewide: AI, professional development, projects & sprints, ASCCC contract. Five allocations administered by the Chancellor''s Office.',
  section = 'history', archived = true, sort_order = 30, window_label = '2024-2028'
where id = 1;

update public.budget_funding set
  name = 'CPL Scaling Statewide — $6M Prop 98 · RCCD transfers',
  description = 'The share of the $6M transferred to the RCCD MAP Grant (GFA0164), including the AI Apprenticeship CPL project.',
  section = 'history', archived = true, sort_order = 31, window_label = '2024-2028'
where id = 2;

-- 3: the 2025-26 ongoing year. Precedes the 2026-29 window; kept, not archived.
update public.budget_funding set
  name = 'CPL Initiative Operations — $5M Prop 98',
  description = 'The 2025 ongoing appropriation. We asked for $7M and received $5M; the gap to the ~$7.4M actually needed was covered from the remaining $6M-era allocation plus $59,692 of the $15M.',
  section = 'source_ongoing', sort_order = 20, window_label = '2025-26',
  archived = false
where id = 3;

-- 4: the $15M one-time.
update public.budget_funding set
  name = 'CPL Infrastructure & Scaling — $15M Prop 98',
  description = 'The 2025 one-time appropriation — the first installment of the $50M implementation request.',
  section = 'source_one_time', sort_order = 10, window_label = '2025-26 →',
  archived = false
where id = 4;

-- 5: THE FIX — the consolidated $7M ongoing row (was the mixed "$2M" row).
--    Amendment: $7,000,000 x 3 = $21,000,000 (2026-27 .. 2028-29). 2029-30 is
--    left at 0 because the amendment budgets only through its 6/30/29 term end,
--    even though the appropriation itself is ongoing.
update public.budget_funding set
  name = 'CPL Initiative Operations — $7M Prop 98',
  source_code = '$7M P98 Ongoing',
  description = 'From 2026-27 the ongoing operations appropriation reaches the full $7M originally requested — the Legislature added the remaining $2M. Budgeted through 2028-29 in the Sept-2026 BOG amendment; the appropriation itself is ongoing.',
  section = 'source_ongoing', sort_order = 21, window_label = '$7,000,000 × 3 yrs',
  archived = false,
  yr_2025_26_budget = 0, yr_2025_26_expense = 0,
  yr_2026_27 = 7000000, yr_2027_28 = 7000000, yr_2028_29 = 7000000, yr_2029_30 = 0,
  total = 21000000, avg_yearly = 7000000
where id = 5;

-- 6: the $35M one-time. The amendment gives no per-year availability split, so
--    the window is recorded and the year cells are cleared rather than invented
--    (they previously carried a 15/15/5 spread with no source).
update public.budget_funding set
  name = 'CPL Local Implementation — $35M Prop 98',
  description = 'The 2026 one-time appropriation — the remaining balance of the $50M implementation request. Allocated by the Sept-2026 BOG amendment over two years.',
  section = 'source_one_time', sort_order = 11, window_label = '2026-27 · 2027-28',
  archived = false,
  yr_2025_26_budget = 0, yr_2026_27 = 0, yr_2027_28 = 0, yr_2028_29 = 0, yr_2029_30 = 0,
  total = 35000000, avg_yearly = null
where id = 6;

-- ── 3. Uses — each appropriation, fully allocated ─────────────────────────
-- $35M: the amendment's three components. Ties to the penny:
--   25,240,308 + 800,000 + 8,959,692 = 35,000,000
insert into public.budget_funding
  (name, source_code, section, sort_order, description, window_label,
   yr_2026_27, yr_2027_28, yr_2028_29, total)
select v.* from (values
  ('College Implementation Awards — 115 colleges & 4 noncredit', '$35M P98', 'use_35m', 10,
   'The three-priority college pool. Includes the $1M noncredit feeder carve-out and the $1M guaranteed rural allowance, both carved from inside this total.',
   null, 12620154::numeric, 12620154::numeric, 0::numeric, 25240308::numeric),
  ('CO Staff — 2.0 FTE', '$35M P98', 'use_35m', 11,
   'Chancellor''s Office staffing for the implementation, $400,000 per year for two years.',
   null, 400000, 400000, 0, 800000),
  ('CPL Projects — $35M share', '$35M P98', 'use_35m', 12,
   'The $35M contribution to the combined project pool. The amendment budgets projects as one $18M pool across both appropriations and never splits them by source, so no per-year split is shown.',
   'not split by year in the amendment', 0, 0, 0, 8959692)
) as v(name, source_code, section, sort_order, description, window_label,
       yr_2026_27, yr_2027_28, yr_2028_29, total)
where not exists (select 1 from public.budget_funding b where b.name = v.name);

-- $15M: 5,900,000 + 59,692 + 9,040,308 = 15,000,000
insert into public.budget_funding
  (name, source_code, section, sort_order, description, window_label, total)
select v.* from (values
  ('Implementation grants — $50,000 × 118 institutions', '$15M P98', 'use_15m', 10,
   'ESS 25-82 seed grants to every college and noncredit campus whose CIO certified by Jan 15, 2026. 114 colleges + 4 noncredit campuses; Sequoias declined.',
   '2025-26', 5900000::numeric),
  ('N2N Lightleap — partial funding', '$15M P98', 'use_15m', 11,
   'Completes the AI Apprenticeship CPL (N2N Lightleap) project: $1,345,236 came from the $6M P98 Scaling CPL and this $59,692 from the $15M, for $1,404,928 in total.',
   '2026-27', 59692),
  ('CPL Projects — $15M share', '$15M P98', 'use_15m', 12,
   'The remaining $15M balance. Once the additional $2M ongoing was approved, this no longer had to close the gap on the ~$7.4M annual operating budget — which is what released it into the project pool.',
   'not split by year in the amendment', 9040308)
) as v(name, source_code, section, sort_order, description, window_label, total)
where not exists (select 1 from public.budget_funding b where b.name = v.name);

-- Ongoing use — mirrors the source line.
insert into public.budget_funding
  (name, source_code, section, sort_order, description,
   yr_2026_27, yr_2027_28, yr_2028_29, total)
select v.* from (values
  ('$7M Ongoing Operations — RCCD', '$7M P98 Ongoing', 'use_ongoing', 10,
   'MAP CPL Grant: team operations, platform development, training, partnerships and projects.',
   7000000::numeric, 7000000::numeric, 7000000::numeric, 21000000::numeric)
) as v(name, source_code, section, sort_order, description,
       yr_2026_27, yr_2027_28, yr_2028_29, total)
where not exists (select 1 from public.budget_funding b where b.name = v.name);

-- ── 4. The combined $18M project pool ─────────────────────────────────────
-- 8,959,692 (of the $35M) + 9,040,308 (of the $15M) = 18,000,000.
insert into public.budget_funding
  (name, source_code, section, sort_order, description,
   yr_2026_27, yr_2027_28, yr_2028_29, total)
select v.* from (values
  ('CPL Initiative RCCD Projects', 'Pool', 'pool', 10,
   'Projects administered through the RCCD MAP Grant under the Sept-2026 BOG amendment.',
   3253650::numeric, 3161000::numeric, 4142000::numeric, 10556650::numeric),
  ('Additional CPL Initiative Projects — CO or TBA', 'Pool', 'pool', 20,
   'Projects administered by the Chancellor''s Office, or not yet assigned.',
   2303350, 2520000, 2620000, 7443350)
) as v(name, source_code, section, sort_order, description,
       yr_2026_27, yr_2027_28, yr_2028_29, total)
where not exists (select 1 from public.budget_funding b where b.name = v.name);

-- RCCD projects (8) — children of 'CPL Initiative RCCD Projects'
insert into public.budget_funding
  (name, source_code, section, sort_order, parent_id, description,
   yr_2026_27, yr_2027_28, yr_2028_29, total)
select v.name, v.source_code, 'pool', v.sort_order,
       (select id from public.budget_funding where name = 'CPL Initiative RCCD Projects'),
       v.description, v.y1, v.y2, v.y3, v.total
from (values
  ('Lightleap AI Apprenticeship Tools', 'Pool', 11, 'AI apprenticeship tooling, continuing the N2N project.', 1400000::numeric, 2000000::numeric, 3200000::numeric, 6600000::numeric),
  ('District Administrative Support',   'Pool', 12, 'RCCD district administration of the MAP CPL Grant.',       268650, 261000, 342000, 871650),
  ('Futuro Behavioral Health CPL',      'Pool', 13, 'CPL pathways for the behavioral health workforce.',         400000, 400000, 0, 800000),
  ('Credential Engine CTDL & Catalog Pathways', 'Pool', 14, 'Publishing CPL credentials to the Credential Registry in CTDL.', 160000, 200000, 300000, 660000),
  ('CPL Credential Registry Planning — WestEd', 'Pool', 15, 'Planning study for a statewide CPL credential registry.', 200000, 200000, 200000, 600000),
  ('ASCCC Pathways to Credit',          'Pool', 16, 'Faculty-led statewide credit recommendations.',             500000, 0, 0, 500000),
  ('Foundation Event — Regional CPL Training', 'Pool', 17, 'Regional CPL training events.',                      300000, 0, 0, 300000),
  ('Military Base Demonstration Scaling', 'Pool', 18, 'Scaling the military base demonstration project.',        25000, 100000, 100000, 225000)
) as v(name, source_code, sort_order, description, y1, y2, y3, total)
where not exists (select 1 from public.budget_funding b where b.name = v.name);

-- Additional CO/TBA projects (6)
insert into public.budget_funding
  (name, source_code, section, sort_order, parent_id, description,
   yr_2026_27, yr_2027_28, yr_2028_29, total)
select v.name, v.source_code, 'pool', v.sort_order,
       (select id from public.budget_funding where name = 'Additional CPL Initiative Projects — CO or TBA'),
       v.description, v.y1, v.y2, v.y3, v.total
from (values
  ('New Project — TBA', 'Pool', 21, 'Not yet assigned.', 1173350::numeric, 1100000::numeric, 1100000::numeric, 3373350::numeric),
  ('Lake Tahoe Valid8 — Portfolio Builder & CPL Navigators', 'Pool', 22, 'Portfolio-based CPL assessment tooling and navigator support.', 620000, 900000, 1000000, 2520000),
  ('Foundation — AI Skills to Course', 'Pool', 23, 'Matching AI skills frameworks to course outcomes.', 200000, 200000, 200000, 600000),
  ('Capitol Impact — Apprenticeship Skills & Advanced CTE Data', 'Pool', 24, 'Apprenticeship skills and CTE data infrastructure.', 120000, 130000, 130000, 380000),
  ('RP Research Studies', 'Pool', 25, 'Field research on CPL practice and outcomes.', 100000, 100000, 100000, 300000),
  ('Noncredit CPL', 'Pool', 26, 'Noncredit CPL development.', 90000, 90000, 90000, 270000)
) as v(name, source_code, sort_order, description, y1, y2, y3, total)
where not exists (select 1 from public.budget_funding b where b.name = v.name);

-- ── 5. Funding history, 2017 to the cutoff (archived) ─────────────────────
-- $17,307,440 built and scaled MAP to 116 colleges before the statewide
-- appropriations. Pilot 807,440 + Scale 10,500,000 + $6M 6,000,000.
insert into public.budget_funding
  (name, source_code, section, sort_order, archived, description, window_label, total)
select v.name, v.source_code, 'history', v.sort_order, true, v.description, v.window_label, v.total
from (values
  ('Cervantes 1',  'Seed',      1,  'Seed funding to plan the technology solution.',                  '2017-2018', 79215::numeric),
  ('SWP IEDRC 2',  'SWP',       2,  'Implement beta MAP at the Inland Empire Desert Regional Consortium.', '2018-2019', 103957),
  ('SWP IEDRC 3',  'SWP',       3,  'IEDRC professional development.',                                '2019-2020', 457892),
  ('SWP IEDRC 1',  'SWP',       4,  'Implement beta MAP at IEDRC.',                                   '2020-2021', 130000),
  ('SWP IEDRC 4',  'SWP',       5,  'Implement beta MAP at IEDRC.',                                   '2021-2022', 36376),
  ('P98 Cervantes 2', 'P98',   10,  'Scale MAP to 55 colleges and all CPL types.',                    '2021-2023', 2000000),
  ('P98 Cervantes 3', 'P98',   11,  'Scale MAP to 76 colleges · MAP 2.0.',                            '2022-2025', 2000000),
  ('FIPSE Calvert',   'FIPSE', 12,  'Scale MAP to 116 colleges and add MAP functionality.',           '2023-2025', 3000000),
  ('CCCCO Grant',     'CCCCO', 13,  'CO CPL Demonstration Project supporting the Vision 2030 strategy.', '2024-2025', 3500000)
) as v(name, source_code, sort_order, description, window_label, total)
where not exists (select 1 from public.budget_funding b where b.name = v.name);

-- The seven $6M allocations, nested under the two existing rows they sum to.
insert into public.budget_funding
  (name, source_code, section, sort_order, archived, parent_id, description, window_label, total)
select v.name, 'P98 Scaling CPL', 'history', v.sort_order, true,
       (select id from public.budget_funding where id = v.parent), v.description, v.window_label, v.total
from (values
  ('ASCCC: Pathways to Credit statewide credit recommendations', 32, 1, 'V0718', '2025-2028', 1563900::numeric),
  ('Foundation: AI Skills Matching',                             33, 1, 'V0515', '2025-2026', 200000),
  ('RP Group: Field CPL Survey',                                 34, 1, 'V0639', '2024-2025', 57275),
  ('WestEd: CPL Credential Registry Planning',                   35, 1, 'V0719', '2025-2026', 200000),
  ('Foundation: Regional Training',                              36, 1, null,    '2024-2025', 233589),
  ('AI Apprenticeship CPL → RCCD MAP Grant',                     37, 2, 'GFA0164 — completed by the $59,692 from the $15M, for $1,404,928 in total.', '2025-2026', 1345236),
  ('Transfer to RCCD MAP Grant',                                 38, 2, 'GFA0164', '2025-2026', 2400000)
) as v(name, sort_order, parent, description, window_label, total)
where not exists (select 1 from public.budget_funding b where b.name = v.name);

-- ── 6. Verification ───────────────────────────────────────────────────────
-- Every one of these must hold; the committed test suite asserts the same set.
--   sources one-time        = 50,000,000   ($15M + $35M — the fulfilled ask)
--   uses $35M               = 35,000,000
--   uses $15M               = 15,000,000
--   pool parents            = 18,000,000   = 8,959,692 + 9,040,308
--   pool children           = 18,000,000
--   history (archived)      = 17,307,440
--   $6M children vs parents =  2,254,764 / 3,745,236

-- ── 7. Applied 2026-07-30 — two Excel float artifacts cleaned ─────────────
-- id 2 carried 3,745,235.64 but its seven-allocation children sum to exactly
-- 3,745,236; id 4 carried 15,000,000.16 against a $15,000,000 appropriation.
-- Both were rounding residue from the retired Excel workbook, and both would
-- have broken the reconciliation by cents.
--   update public.budget_funding set total = 3745236  where id = 2;
--   update public.budget_funding set total = 15000000, yr_2025_26_budget = 15000000
--     where id = 4;
--
-- Post-apply verification (2026-07-30, live):
--   45 rows.  source_one_time 50,000,000 · source_ongoing 26,000,000
--   use_35m 35,000,000 · use_15m 15,000,000 · use_ongoing 21,000,000
--   pool parents 18,000,000 == pool children 18,000,000
--   $6M children: parent 1 = 2,254,764 · parent 2 = 3,745,236
--   history parents-only = 17,307,440   (all-archived = 23,307,440 DOUBLE-COUNTS
--   the $6M — the render must always sum PARENTS ONLY).

-- ── 8. Applied 2026-07-30 — stale spend schedule on the $15M SOURCE row ───
-- Surfaced immediately by the new "total is computed from the years" rule: the
-- $15M source row still carried its old SPEND schedule in the out-years
-- (2,808,450.40 + 2,136,854.53 + 2,013,327.01 + 2,081,675.46 = 9,040,307.40 —
-- the remaining balance, which now lives in Uses), so the row would have
-- displayed $24,040,307. A SOURCE row carries the appropriation once, never the
-- appropriation plus its own spend plan.
--   update public.budget_funding set yr_2025_26_budget = 15000000,
--          yr_2026_27 = 0, yr_2027_28 = 0, yr_2028_29 = 0, yr_2029_30 = 0
--    where id = 4;
--   update public.budget_funding set yr_2025_26_budget = 5000000 where id = 3;
--   update public.budget_funding set yr_2025_26_budget = 3745236 where id = 2;
--
-- Post-fix: every row that has year cells now satisfies Sum(years) == total.
-- Zero drift. (That check is worth re-running after any bulk edit.)

-- ── 9. Applied 2026-07-30 — Sam's N2N ruling ──────────────────────────────
-- A session flagged the amendment's `Lightleap AI Apprenticeship Tools
-- $1,400,000` (2026-27, year 1 of $6,600,000) as a possible double count of the
-- already-completed $1,404,928. SAM RULED IT IS NOT: the original contract was a
-- SINGLE YEAR; the amendment extends it another year and adds other colleges.
-- Different scope, not the same dollars. Recorded on the row itself so the
-- question is not re-raised:
--   update public.budget_funding set description = 'Extends the AI Apprenticeship
--     CPL contract with Santiago Canyon — the original was a single year
--     (completed at $1,404,928 from the $6M plus $59,692 of the $15M); this adds
--     another year and brings in additional colleges. Different scope, not the
--     same dollars.'
--   where name = 'Lightleap AI Apprenticeship Tools';
--
-- STILL OPEN (Sam is handling): the two $5M rows in the funding history
-- ("State Funds Ongoing — MAP CPL Grant" and "P98 CPL Operations") look like one
-- appropriation seen twice — the CO's P98 line and the RCCD grant of it. Only
-- one should count or the 2025-26 operating year doubles.
