-- DRAFT, NOT IN kb/migrations/.apply. Step 2 of the Honors build: the honors_of rows for every pair the plan
-- writes (246 rows; kb/honors_of_s653_out/2026-11-15/plan.json, written 2026-11-15T02:26:09Z; rows md5 5e438594518f1fe0ac7dd8f559199c2c, class md5
-- d926338769084d779f0426f846868207).
-- Design: docs/reference/honors_of_design.md. Ruling: Sam, Sheet 197 card 3 (14:37Z 2026-11-14): "Build the field
-- first, then the rows"; "Rows for all 508 pairs". THE NARROW RULE (S654, d-honors-narrow-positive-rule-s654,
-- after #3315's third review): a pair gets a row only where the second derivation finds it by number and the
-- matcher finds it too, the base holds one title group, no college gives the base two course numbers, and the
-- raw sequence marks agree; held is the default, and held pairs get no row (plan.md lists them by reason).
-- Written by kb/_honors_of_s653_dryrun.py from the committed plan. Lands after step 1 (applied 2026-11-14).
-- ON THE APPLY DAY, after the last daily run, merge origin/main and run
-- `python3 kb/_honors_of_s653_dryrun.py --check` (it reads the newest plan folder): it re-measures the pairs and
-- classes on the day's payload, refuses unless they give these rows and classes exactly, and writes the receipt
-- named on the next line. scripts/supabase_migrate.py refuses this file unless that receipt exists and names
-- this file's sha256 and the checkout's payload digests. That is where liveness is checked; this statement
-- reads only kb_curation and cannot see the live id set.
-- requires-check-receipt: kb/honors_of_s653_out/2026-11-15/check_receipt.json
-- Insert-only under its own cohort, honors-rows-s653@bot, ON CONFLICT DO NOTHING (Rule 10). One plain statement: the
-- insert hangs on one guard CTE, and a failed guard raises, so nothing is written. The guard refuses when:
--   * step 1's two honors_of rows (honors-s653@bot) are not both present, or any other honors_of row exists;
--   * any id a row names carries a merge_into row: it was merged away, or merged into its partner, after the
--     plan (this covers every join of a pair, so no chain walk is needed). A person's merge of a third course
--     into either side does not refuse: it agrees with the pair standing apart (#3315's first review, item 1;
--     10 such rows when this plan was drawn, the overlay's count);
--   * a unified_title_merge_confirm row names any id a row names: a curator's pending merge (Rule 10 a);
--   * a kb_curation row is keyed on an H id: the step-4 mint has landed;
--   * what it inserts differs from the plan in count or digest.
-- The result is a count and an md5 (5e438594518f1fe0ac7dd8f559199c2c) over the inserted rows, course_id>value joined by | in C order, so
-- the runner's receipt (scripts/supabase_migrate.py keeps the first 4,000 characters) holds the whole record and
-- checks against plan.json. No row image is returned: the insert-only cohort rolls back by its reviewer_email.
-- Rollback: 2026-11-14_s653_honors_of_rows_rollback.sql, keyed on the cohort and the field, never on ids; it
-- refuses after the step-4 mint until the mint's own rollback has run.
with planned (course_id, value) as (
  values
    ('ANTH M1005', 'ANTH M1006'),
    ('ANTH M10AK', 'ANTH M10AL'),
    ('ANTH M10EW', 'ANTH M1122'),
    ('ANTH M10IG', 'ANTH M10IF'),
    ('ANTH M10IM', 'ANTH M1131'),
    ('ARCH M10AP', 'ARCH M10AN'),
    ('ARCH M10BL', 'ARCH M10BK'),
    ('ARCH M10BP', 'ARCH M10BD'),
    ('ARCH M10CE', 'ARCH M10CF'),
    ('ARCH M10JX', 'ARCH M1065'),
    ('ARCH M10KJ', 'ARCH M1066'),
    ('ARTH M1006', 'ARTH M1005'),
    ('ARTH M1037', 'ARTH M1011'),
    ('ARTS M10KT', 'ARTS 210'),
    ('ARTS M10MX', 'ARTS M10MY'),
    ('ARTS M10NI', 'ARTS M1078'),
    ('ARTS M10PX', 'ARTS M10PY'),
    ('ARTS M10QM', 'ARTH 130'),
    ('ARTS M10UM', 'ARTS M10UN'),
    ('ARTS M10UU', 'ARTS M10UV'),
    ('ASTR M1039', 'ASTR M1044'),
    ('ASTR M1048', 'ASTR M1053'),
    ('ASTR M10AC', 'PHSC M1003'),
    ('ASTR M10AU', 'ASTR M10AT'),
    ('ASTR M10BE', 'ASTR M1023'),
    ('ASTR M10BZ', 'ASTR M1028'),
    ('BIOL M1091', 'BIOL M1089'),
    ('BIOL M1096', 'BIOL M1097'),
    ('BIOL M10GG', 'BIOL M10GH'),
    ('BIOL M10GV', 'BIOT 150 X'),
    ('BIOL M10GW', 'BIOT 220 X'),
    ('BIOL M10HU', 'BIOL M10HV'),
    ('BIOL M10LH', 'BIOL M1065'),
    ('BIOL M10NT', 'BIOL M1087'),
    ('BIOL M10NU', 'BIOL M1088'),
    ('BIOL M10NW', 'BIOL M1092'),
    ('BIOL M10OA', 'BIOL M1098'),
    ('BIOL M10OB', 'BIOL M10OI'),
    ('BIOL M10OU', 'BIOL M1119'),
    ('BIOL M10OV', 'BIOL M10QB'),
    ('BIOL M10OX', 'BIOL 135 S'),
    ('BIOL M10QZ', 'BIOT 101 B X'),
    ('BIOL M10ZV', 'BIOL M11BA'),
    ('BIOL M10ZX', 'BIOL M11BJ'),
    ('BIOL M1101', 'BIOL M1105'),
    ('BIOL M1102', 'BIOL 140'),
    ('BIOL M11AA', 'GEOL M1056'),
    ('BIOL M1226', 'PSY 130'),
    ('BIOL M1317', 'BIOL M1318'),
    ('BUSI M1061', 'ACCT 120'),
    ('BUSI M10SK', 'BUS 120'),
    ('BUSI M10SS', 'BUSI M1172'),
    ('BUSI M10TV', 'BUSI M10UK'),
    ('BUSI M11LQ', 'LPPS 110'),
    ('CHEM M1033', 'CHEM M10DH'),
    ('CHEM M10FL', 'CHEM 160 S'),
    ('COMM M10AW', 'COMM M10AX'),
    ('COMM M10CE', 'COMM M10CF'),
    ('COMM M10DK', 'COMM 140'),
    ('COMP M10DM', 'COMP 132'),
    ('COMP M10IG', 'COMP 112'),
    ('COMP M10QS', 'ITIS 130'),
    ('COUN M10BK', 'COUN M10BL'),
    ('COUN M10BM', 'COUN M1004'),
    ('COUN M10UD', 'COUN M1159'),
    ('CRIM M1066', 'CRIM M1068'),
    ('CRIM M11DJ', 'AJ 120'),
    ('DANC M1057', 'DANC M1054'),
    ('DANC M10JE', 'DANC M10JF'),
    ('DANC M11GZ', 'DANC M1208'),
    ('DANC M11SK', 'DANC M11SN'),
    ('ECON M10AX', 'ECON M10AY'),
    ('ECON M10BI', 'ECON M1012'),
    ('ECON M10BO', 'ECON M1022'),
    ('ENGL M1061', 'ENGL M1063'),
    ('ENGL M10BA', 'ENGL 160'),
    ('ENGL M10BB', 'ENGL 165'),
    ('ENGL M10IR', 'ENGL M10IS'),
    ('ENGL M10JI', 'ENGL M10JJ'),
    ('ENGL M10LQ', 'ENGL M10LR'),
    ('ENGL M10MG', 'ENGL M10MH'),
    ('ENGL M10MT', 'ENGL M10MS'),
    ('ENGL M10QH', 'ENGL M10QI'),
    ('ENGL M10UR', 'ENGL M1179'),
    ('ENGL M10US', 'ENGL M1417'),
    ('ENGL M10VV', 'ENGL 200'),
    ('ENGL M10XI', 'ENGL M10XJ'),
    ('ENGL M10YU', 'THTR 114'),
    ('ENGL M11AV', 'HUMA M10KJ'),
    ('ENGL M11CF', 'ENGL M11CG'),
    ('ENGL M11CL', 'ENGL M11CH'),
    ('ENGL M11EY', 'ENGL M11HC'),
    ('ENGL M11FB', 'ETHN M1034'),
    ('ENGL M11FC', 'ENGL M1346'),
    ('ENGL M1203', 'ENGL M1206'),
    ('ENGL M1415', 'PHIL M1034'),
    ('ENVS M10NA', 'ENVS M10NB'),
    ('ETHS M1013', 'ETHS M1014'),
    ('ETHS M1068', 'POLS M1002'),
    ('ETHS M1097', 'ETHS M1098'),
    ('ETHS M10DF', 'ETHS M10DG'),
    ('ETHS M10MD', 'ETHS M10ME'),
    ('ETHS M10NO', 'ETHN M1019'),
    ('ETHS M10OD', 'ETHS M1170'),
    ('ETHS M10OE', 'ETHS M1172'),
    ('ETHS M10SH', 'ETHS M10SI'),
    ('ETHS M1103', 'ETHS M1104'),
    ('ETHS M1147', 'ETHS M1150'),
    ('ETHS M1194', 'ETHS M1195'),
    ('ETHS M1204', 'SOCI 150'),
    ('ETHS M1261', 'ETHS M1082'),
    ('FDNT M10BE', 'NUTR M1018'),
    ('FLNG M11LR', 'SLNA M10AM'),
    ('FREN M1050', 'FREN M1003'),
    ('FREN M1053', 'FREN M1006'),
    ('FTVE M1019', 'FTVE M1018'),
    ('FTVE M10DK', 'FTVE M10DJ'),
    ('FTVE M10DX', 'FTVE M1021'),
    ('FTVE M10EV', 'FTVE M1029'),
    ('FTVE M10HO', 'FTVE M10HR'),
    ('FTVE M10LJ', 'FTVE M10LK'),
    ('FTVM M10AS', 'FTVM M10AF'),
    ('GEOG M10CM', 'GEOG 140'),
    ('GEOG M10FA', 'GEOG 110'),
    ('GEOL M1041', 'GEOL 100'),
    ('GEOL M10EU', 'GEOL M1022'),
    ('GFCD M10FI', 'ARTS M1310'),
    ('GFCD M10FJ', 'ARTS M1331'),
    ('HIST M10HW', 'HIST M10HX'),
    ('HIST M10KV', 'HIST M10LD'),
    ('HIST M10MO', 'HIST M1095'),
    ('HIST M10NK', 'HIST M10NL'),
    ('HIST M10QP', 'HIST M10QQ'),
    ('HIST M10TA', 'HIST M10TB'),
    ('HIST M10TI', 'HIST M1156'),
    ('HIST M10UN', 'HIST M10VY'),
    ('HIST M1163', 'HIST M1190'),
    ('HIST M1165', 'HIST M1191'),
    ('HLTH M11BP', 'PH 100'),
    ('HORT M10MA', 'AG-PS 104 104'),
    ('HUMA M1018', 'HUMA M1019'),
    ('HUMA M1027', 'HUMA M1029'),
    ('HUMA M10BC', 'HUMA M10BD'),
    ('HUMA M10CM', 'HUMA M10CN'),
    ('HUMA M10CS', 'HUMA M10CT'),
    ('HUMA M10DQ', 'HUMA M10DS'),
    ('HUMA M10HX', 'HUMA M10HY'),
    ('HUMA M10ID', 'HUMA M10IF'),
    ('HUMA M10IJ', 'HUMA M10II'),
    ('HUMA M10IX', 'HUMA M10IZ'),
    ('HUMA M10KI', 'ENGL M1239'),
    ('HUMA M10KQ', 'IDST M10RM'),
    ('HUMA M10LR', 'HUMA M10MJ'),
    ('HUMA M10LS', 'HUMA M1088'),
    ('HUMA M10LT', 'HUMA M10MP'),
    ('HUMA M10LU', 'HUMA M10MW'),
    ('HUMA M10LX', 'HUMA M1097'),
    ('HUMA M10LZ', 'HUMA M1100'),
    ('HUMA M10MD', 'HUMA M10OF'),
    ('HUMA M10MF', 'HUMA M10OM'),
    ('HUMA M1119', 'COMM 120'),
    ('HUMN M1002', 'COMM M1067'),
    ('HUMN M1003', 'HUMN M1004'),
    ('IDST M10CL', 'IDST M10CM'),
    ('IDST M10JC', 'IDST M10JD'),
    ('IDST M10JU', 'COUN M1045'),
    ('IDST M10OJ', 'IDST M1094'),
    ('IDST M10TE', 'IDST M10WV'),
    ('INFO M10AB', 'INFO M1002'),
    ('INFO M10AC', 'INFO M1003'),
    ('ITIS M10SQ', 'ITIS M1113'),
    ('ITIS M11LX', 'ITIS M1262'),
    ('JAPN M10AK', 'JAPN M1018'),
    ('JAPN M10BH', 'JAPN M1006'),
    ('JAPN M10CP', 'JAPN M1015'),
    ('KINE M13AD', 'KINE M1523'),
    ('LATN M10AG', 'LATN M1001'),
    ('LIBR M10BO', 'LIBR M1009'),
    ('LIBR M10CI', 'LIBR M1040'),
    ('LIBR M10CK', 'LIBR M10CX'),
    ('LIBR M10CL', 'LIBR M1026'),
    ('MATH M10NA', 'MATH 210'),
    ('MATH M10NC', 'MATH 230'),
    ('MATH M11CM', 'MATH 130'),
    ('MATH M1333', 'MATH 210'),
    ('MRKT M10BN', 'BUSI M1361'),
    ('MUSI M1040', 'MUSI M1043'),
    ('MUSI M10LX', 'MUSI M10LZ'),
    ('MUSI M10LY', 'MUSI M10MC'),
    ('MUSI M10MH', 'MUSI M1582'),
    ('MUSI M10MN', 'MUSI M10MO'),
    ('MUSI M10PH', 'MUSI M10PI'),
    ('MUSI M11PS', 'MUSI M1252'),
    ('MUSI M11QG', 'MUSI M1254'),
    ('MUSI M11XO', 'MUSI M1334'),
    ('MUSI M12CD', 'MUSI M1488'),
    ('MUSI M12CE', 'MUSI M1518'),
    ('MUSI M1589', 'MUSI M1072'),
    ('MUSI M1634', 'MUSI M1522'),
    ('NUTR M10CB', 'NUTR M10CC'),
    ('PHIL M10AW', 'PHIL 130'),
    ('PHIL M10DI', 'PHIL 140'),
    ('PHIL M10EW', 'PHIL 120'),
    ('PHIL M10GA', 'HIST M1194'),
    ('PHIL M10GB', 'PHIL M1090'),
    ('PHIL M10GC', 'SJS 130'),
    ('PHOT M10DT', 'PHOT M10DU'),
    ('PHOT M10HE', 'PHOT M10HF'),
    ('PHOT M10IH', 'PHOT M1055'),
    ('PHOT M10MV', 'JOUR 160'),
    ('PHSC M10BM', 'ASTR M1017'),
    ('PHSC M10FT', 'ASTR M1040'),
    ('PHYS M10DH', 'PHYS 105'),
    ('PHYS M10FR', 'PHYS 205'),
    ('POLS M1033', 'POLS 130'),
    ('POLS M10AU', 'POLS M10AV'),
    ('POLS M10BY', 'POLS M1020'),
    ('PSYC M10DA', 'SOCI 125'),
    ('PSYC M10DB', 'PSYC M1042'),
    ('PSYC M10DQ', 'PSY 150'),
    ('PSYC M10FM', 'PSYC M1059'),
    ('PSYC M10FO', 'PSYC M1061'),
    ('PSYC M10FZ', 'PSY 180'),
    ('PSYC M10GF', 'PSY 120'),
    ('PSYC M10ID', 'PSYC M1121'),
    ('PSYC M1140', 'PSYC M1087'),
    ('SOCI M1059', 'SOCI 115'),
    ('SOCI M10DN', 'SOCI 140'),
    ('SOCI M10DT', 'SOCI M10BI'),
    ('SOCI M10EC', 'SOCI M1079'),
    ('SOCS M10BN', 'SOCS M10BP'),
    ('SOCS M10CO', 'HUMA M10EO'),
    ('SOCS M10CP', 'HUMA M10FA'),
    ('SOCS M10CQ', 'HUMN M10BG'),
    ('SOCS M10DH', 'HUMA M10GW'),
    ('SOCS M10DW', 'SOCS M10DX'),
    ('SOCS M10DY', 'HUMA M10HW'),
    ('SOCS M10GA', 'GLST 101'),
    ('SOCS M10GB', 'GLST 102'),
    ('SOCS M10GW', 'SJS 110'),
    ('SPAN M1046', 'SPAN 110'),
    ('SPAN M10DH', 'SPAN M1026'),
    ('SPAN M10FX', 'SPAN M10FY'),
    ('THTR M10PG', 'THTR M1056'),
    ('THTR M10YI', 'THTR M10YJ'),
    ('THTR M11CE', 'THTR M11CF')
),
named (id) as (
  select course_id from planned union select value from planned
),
step1 as (
  select count(*) as n from public.kb_curation s
  where s.field = 'honors_of' and s.reviewer_email = 'honors-s653@bot' and s.course_id in ('HUMA M10ME', 'LIBR M10CJ')
),
other_honors as (
  select count(*) as n from public.kb_curation o
  where o.field = 'honors_of' and not (o.reviewer_email = 'honors-s653@bot' and o.course_id in ('HUMA M10ME', 'LIBR M10CJ'))
),
moved as (
  select count(*) as n from public.kb_curation m where m.field = 'merge_into' and m.course_id in (select id from named)
),
confirm as (
  select count(*) as n from public.kb_curation c
  where c.field = 'unified_title_merge_confirm'
    and (c.course_id in (select id from named) or c.value in (select id from named))
),
minted as (
  select count(*) as n from public.kb_curation h where h.course_id ~ '^[A-Z]{1,6} [MZ][0-9][A-Z0-9]{3}H$'
),
guard as (
  select (select n from step1) = 2 and (select n from other_honors) = 0 and (select n from moved) = 0
     and (select n from confirm) = 0 and (select n from minted) = 0 as ok,
     (select n from step1) as step1_rows, (select n from other_honors) as other_honors_rows,
     (select n from moved) as merged_ids, (select n from confirm) as pending_confirms,
     (select n from minted) as h_id_rows
),
added as (
  insert into public.kb_curation as k (course_id, field, value, reviewer_email)
  select p.course_id, 'honors_of', p.value, 'honors-rows-s653@bot'
  from guard g cross join planned p
  where g.ok
  on conflict (course_id, field) do nothing
  returning k.course_id, k.value
),
digest as (
  select count(*) as n,
         md5(coalesce(string_agg(a.course_id || '>' || a.value, '|' order by a.course_id collate "C"), '')) as md5
  from added a
)
select case when g.ok and d.n = 246 and d.md5 = '5e438594518f1fe0ac7dd8f559199c2c'
            then jsonb_build_object('inserted', d.n, 'md5', d.md5, 'cohort', 'honors-rows-s653@bot')
            else ('refused by the guard: step 1 rows ' || g.step1_rows
                  || ', other honors_of rows ' || g.other_honors_rows || ', named ids merged ' || g.merged_ids
                  || ', pending merge confirms ' || g.pending_confirms || ', rows keyed on an H id ' || g.h_id_rows
                  || ', inserted ' || d.n || ' of 246 with digest ' || d.md5)::int::text::jsonb
       end as changed
from guard g cross join digest d;

-- Read back: expect 246 honors_of rows under honors-rows-s653@bot and 2 under honors-s653@bot.
--   select reviewer_email, count(*) from public.kb_curation where field = 'honors_of' group by 1;
