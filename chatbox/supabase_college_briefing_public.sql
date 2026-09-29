-- The PUBLIC layer behind the My College tab — schema of record.
--
-- Sam opened My College to colleges / the public internet (2026-09-17). Three of
-- the tab's four gated tables cannot have that gate simply removed, so this
-- follows the ratified ADR (adr-student-detail-aggregate-disclosure-control)
-- rather than the RLS switch: TWO OBJECTS, NOT ONE.
--
--   * Every base table keeps exactly the gate it has today and is never written.
--   * These `_pub` mirrors carry only what may be public.
--   * Suppression is applied by kb/_publish_college_briefing.py at BUILD time,
--     never at render time — the ADR's point 3. The page reads these.
--   * Rolling back is `drop table`; nothing was destroyed to get here.
--
-- ⚠ WHY map_college_cr_unit HAS NO WHOLESALE MIRROR. Measured 2026-09-17: of its
-- 210,171 rows, 202,618 sit below k=10 and 145,554 describe exactly ONE student
-- at a named college, named course and named credit recommendation, carrying
-- that student's exact credit total. Only the narrow slice the page actually
-- reads (Needs Action, articulated > 0 — 622 rows over 74 colleges) is
-- published, and only after suppression collapses every sub-k row into one
-- remainder that stands for two or more recommendations.
--
-- ⚠ WHY map_college_contacts HAS NO WHOLESALE MIRROR. It is a statewide CCC
-- staff directory — CEO, VPAA, VPSS, senate president, certifying official, all
-- with emails. Routing a student to a person needs the CPL coordinator, the CPL
-- counselor and the landing page. The executive directory stays gated.

create table if not exists map_college_credit_summary_pub (
  college_id           integer primary key,
  students             integer,   -- NULL when suppressed: existence, not a count
  suppressed           boolean not null default false,
  dormant_credits      numeric,
  articulated_waiting  numeric,
  applied_credits      numeric,
  transcribed_credits  numeric,
  built_at             timestamptz not null default now()
);

create table if not exists map_college_goal2_pub (
  college_id  integer not null,
  dest        text    not null,
  students    integer,
  rows_n      integer,
  suppressed  boolean not null default false,
  reason      text,
  built_at    timestamptz not null default now(),
  primary key (college_id, dest)
);

-- One row per published recommendation, plus AT MOST ONE remainder row per
-- college. The remainder carries no recommendation, no course and no headcount;
-- `withheld_recommendations` says how many it stands for, and it is never 1.
create table if not exists map_college_cr_waiting_pub (
  id                       bigint generated always as identity primary key,
  college_id               integer not null,
  credit_rec               text,
  college_course           text,
  course_type              text,
  sum_articulated_credits  numeric,
  distinct_students        integer,
  withheld_recommendations integer,
  built_at                 timestamptz not null default now(),
  constraint cr_waiting_remainder_never_singular
    check (withheld_recommendations is null or withheld_recommendations >= 2),
  constraint cr_waiting_remainder_has_no_identity
    check (withheld_recommendations is null
           or (credit_rec is null and college_course is null and distinct_students is null))
);
create index if not exists map_college_cr_waiting_pub_college
  on map_college_cr_waiting_pub (college_id);

create table if not exists map_college_contacts_pub (
  college               text primary key,
  cpl_coordinator       text,
  cpl_coordinator_email text,
  cpl_counselor         text,
  cpl_counselor_email   text,
  landing_page_url      text,
  built_at              timestamptz not null default now()
);

-- ── Reads are public; writes are service_role only ──────────────────────────
-- ⚠ Rule 10(b2): a `revoke ... from anon, authenticated` protects nothing,
-- because Postgres grants to PUBLIC at creation and anon inherits through it.
-- Name `public` explicitly, then grant back exactly SELECT.
do $$
declare t text;
begin
  foreach t in array array['map_college_credit_summary_pub','map_college_goal2_pub',
                           'map_college_cr_waiting_pub','map_college_contacts_pub']
  loop
    execute format('alter table %I enable row level security', t);
    -- service_role takes its write grant EXPLICITLY *before* PUBLIC loses its
    -- own, or the revoke can take the build job's access with it — the
    -- table-level form of the trap Rule 10(b2) records for functions. Ordering
    -- is the whole point, so it reads in the order it has to happen.
    execute format('grant all on table %I to service_role', t);
    execute format('revoke all on table %I from public', t);
    execute format('grant select on table %I to anon, authenticated', t);
    execute format('drop policy if exists %I on %I', t || '_read', t);
    execute format('create policy %I on %I for select to anon, authenticated using (true)',
                   t || '_read', t);
  end loop;
end $$;
