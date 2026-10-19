-- Annual Workplan Goals: a Current value for every year, not only 2025-26.
-- Sam, 2026-10-19 (S426): "make sure all of the annual columns can be edited.
-- Currently, only the 2025-2026 year is editable." The one `current` column on the
-- GOAL row held the 2025-26 value and nothing else; fiscal year 2026-27 began on
-- July 1, 2026, with no column to hold its value.
--
-- Adds cur_2025_26 .. cur_2029_30 to public.workplan_goals, carried on the GOAL
-- row as `current` was, and copies `current` into cur_2025_26 (the column it was
-- typed under). `current` stays in place, unread once the generator
-- (excel_to_dashboard.py), the editor (workplan_goals.js) and the summary drafter
-- (activity_summaries.js) read cur_*; a later migration drops it.
--
-- RLS is row-level and unchanged: the public read policy and the reviewer-or-phrase
-- insert and update policies cover the new columns as they covered `current`.
--
-- ROLLBACK (one statement; `current` was never changed):
--   alter table public.workplan_goals
--     drop column if exists cur_2025_26, drop column if exists cur_2026_27,
--     drop column if exists cur_2027_28, drop column if exists cur_2028_29,
--     drop column if exists cur_2029_30;

alter table public.workplan_goals
  add column if not exists cur_2025_26 numeric,
  add column if not exists cur_2026_27 numeric,
  add column if not exists cur_2027_28 numeric,
  add column if not exists cur_2028_29 numeric,
  add column if not exists cur_2029_30 numeric;

comment on column public.workplan_goals.cur_2025_26 is
  'Current (actual) for 2025-26, on the GOAL row. Edited on the Annual Workplan Goals tab.';
comment on column public.workplan_goals.cur_2026_27 is
  'Current (actual) for 2026-27, on the GOAL row. Edited on the Annual Workplan Goals tab.';
comment on column public.workplan_goals.cur_2027_28 is
  'Current (actual) for 2027-28, on the GOAL row. Edited on the Annual Workplan Goals tab.';
comment on column public.workplan_goals.cur_2028_29 is
  'Current (actual) for 2028-29, on the GOAL row. Edited on the Annual Workplan Goals tab.';
comment on column public.workplan_goals.cur_2029_30 is
  'Current (actual) for 2029-30, on the GOAL row. Edited on the Annual Workplan Goals tab.';

-- The value typed under the 2025-26 column moves to the 2025-26 column.
update public.workplan_goals
   set cur_2025_26 = current
 where current is not null
   and cur_2025_26 is null;
