# Plan: Golden West SLO rows, the "Course Outcomes" sub-heading moved out of the outcomes (S690, 2026-11-20)

**Status: a plan, not run.** The conductor runs step 1 (four pages and a summary), files each page's result in this
receipt as the before-values, runs step 2 and files what it returns. Nothing below has touched `course_outcomes`.

**What:** a guarded UPDATE on `course_outcomes` for exactly 476 Golden West College SLO rows from CourseLeaf read
41399075269 (`f-golden-west-474-header-rows-s689`). The ids come from load receipt
`kb/receipts/course_outcomes_cccd_41412025040.json` (its `inserted_keys`, one id per course code, 7451 to 8018):
each row whose filed outcomes carry a line matching `^cour?se (learning )?outcomes?:?$` and whose `lead` is null.
S689's live count was 474; the two more are THEA G210 (id 7729, "Course Outcome") and MUS G111 (id 7934, "Couse
Outcomes"), both sub-headings (second reader on #3601). In the filed read, 471 carry the line first and last, 4 sit
under an ILOs block (CS G262, DANC G125, MUS G261, THEA G211) and ACCT G163 carries it twice. Each row's outcomes
become the items after the last such line; that line moves to `lead`; `shape` becomes `paragraph` where one outcome
is left (22 rows), else `list`; `fingerprint` becomes `md5(outcomes::text)`, the way S665's fix reproduced the
loader's fingerprints. No other column, row or table changes. The write refuses any count but 476.

**Why in place** (`d-goldenwest-subhead-fix-in-place-s665`): the load inserts by fingerprint, so a reread under the
reader fix on this branch would otherwise insert a second copy beside each row.

**The filed reads (second reader's MAJOR):** this branch corrects both of Golden West's filed reads the same way,
as S665 corrected its 3 rows: `kb/course_outcomes/cccd/read_41399075269_p{1,2}of2.json` (476 rows) and
`read_44251936045_p{1,2}of2.json` (454 rows; that read loaded objectives only, receipt
`course_outcomes_cccd_44263910106.json`). Each file carries a `corrected` note. A `golden_west` SLO load of the newest
read (`read_44251936045`) now posts no row with the sub-heading: replayed against the corrected live keys, it would
insert 19 rows and none carries it (`gw_reload.py`). Chosen over `never_load`, which would keep the read's 19 new
outcome blocks out too.

**Same shape elsewhere, reported, not in this plan:** Coastline ANTH G190 (id 7204), and four Golden West rows whose
outcomes open with "Course Objectives" (ELL G015N, ART G145, AUTO G004N, ELL G025N).

The 476 ids, used by every step:

```
7451,7452,7453,7454,7455,7456,7457,7458,7459,7460,7461,7462,7463,7464,7465,7466,7468,7469,7471,7477,7483,7484,7485,7486,7487,7488,7489,7490,7491,7492,7493,7494,7495,7496,7497,7498,7499,7500,7501,7502,7503,7504,7505,7506,7507,7508,7509,7510,7511,7513,7514,7515,7516,7517,7518,7519,7520,7521,7522,7523,7524,7525,7526,7527,7528,7529,7530,7531,7538,7539,7541,7542,7543,7544,7545,7547,7548,7549,7550,7551,7552,7553,7554,7555,7556,7557,7558,7559,7561,7562,7563,7564,7565,7566,7567,7568,7569,7570,7571,7572,7574,7576,7577,7578,7579,7581,7582,7583,7584,7585,7586,7587,7588,7589,7590,7591,7592,7593,7594,7595,7596,7597,7598,7599,7600,7601,7602,7603,7604,7605,7606,7607,7608,7609,7610,7612,7613,7614,7615,7616,7617,7618,7619,7620,7621,7622,7623,7625,7626,7627,7628,7629,7630,7631,7632,7633,7634,7635,7636,7637,7638,7639,7640,7641,7642,7643,7644,7645,7646,7647,7648,7649,7650,7651,7652,7653,7654,7655,7656,7657,7658,7660,7661,7663,7664,7668,7672,7673,7674,7675,7677,7678,7679,7680,7681,7682,7683,7684,7685,7687,7688,7689,7690,7691,7692,7693,7694,7695,7696,7697,7698,7700,7703,7704,7705,7706,7707,7708,7709,7710,7712,7713,7714,7715,7716,7717,7718,7719,7720,7721,7722,7723,7724,7725,7726,7727,7728,7729,7730,7731,7732,7733,7734,7735,7736,7737,7739,7741,7742,7743,7744,7745,7746,7748,7749,7751,7752,7754,7758,7763,7764,7765,7766,7767,7768,7769,7770,7771,7774,7776,7777,7778,7779,7780,7781,7782,7783,7784,7785,7786,7787,7788,7789,7790,7791,7793,7795,7796,7797,7798,7799,7800,7801,7802,7803,7804,7805,7807,7808,7809,7810,7811,7812,7813,7814,7815,7822,7823,7824,7825,7826,7828,7829,7830,7833,7834,7835,7836,7837,7838,7839,7840,7841,7842,7843,7844,7846,7848,7850,7851,7852,7853,7854,7855,7856,7858,7859,7860,7861,7862,7863,7864,7867,7868,7869,7870,7871,7872,7873,7874,7875,7876,7877,7878,7879,7880,7881,7882,7883,7884,7885,7886,7887,7888,7889,7890,7891,7892,7893,7894,7895,7896,7898,7899,7900,7901,7902,7903,7904,7905,7906,7907,7909,7910,7911,7912,7913,7914,7916,7917,7918,7919,7920,7921,7922,7923,7924,7925,7926,7927,7928,7929,7930,7931,7932,7933,7934,7935,7936,7937,7938,7940,7941,7942,7943,7944,7945,7946,7947,7949,7953,7957,7958,7959,7960,7961,7962,7963,7964,7965,7966,7967,7970,7971,7972,7973,7974,7975,7976,7977,7978,7979,7980,7981,7982,7983,7984,7985,7988,7989,7990,7991,7992,7993,7994,7995,7996,7997,7998,7999,8000,8001,8002,8004,8005,8006,8008,8009,8010,8011,8012,8014,8015,8016,8017,8018
```

## 1. Pre-read, paged by id (each page one SELECT, one JSON value)

Run once per page, with `:lo` and `:hi` replaced by 7451 and 7595, 7596 and 7731, 7732 and 7884, 7885 and 8018 (120, 120,
120 and 116 ids). File each page's `before` array in order; together they are the before-values.

```sql
with ids as (select unnest('{7451,7452,7453,7454,7455,7456,7457,7458,7459,7460,7461,7462,7463,7464,7465,7466,7468,7469,7471,7477,7483,7484,7485,7486,7487,7488,7489,7490,7491,7492,7493,7494,7495,7496,7497,7498,7499,7500,7501,7502,7503,7504,7505,7506,7507,7508,7509,7510,7511,7513,7514,7515,7516,7517,7518,7519,7520,7521,7522,7523,7524,7525,7526,7527,7528,7529,7530,7531,7538,7539,7541,7542,7543,7544,7545,7547,7548,7549,7550,7551,7552,7553,7554,7555,7556,7557,7558,7559,7561,7562,7563,7564,7565,7566,7567,7568,7569,7570,7571,7572,7574,7576,7577,7578,7579,7581,7582,7583,7584,7585,7586,7587,7588,7589,7590,7591,7592,7593,7594,7595,7596,7597,7598,7599,7600,7601,7602,7603,7604,7605,7606,7607,7608,7609,7610,7612,7613,7614,7615,7616,7617,7618,7619,7620,7621,7622,7623,7625,7626,7627,7628,7629,7630,7631,7632,7633,7634,7635,7636,7637,7638,7639,7640,7641,7642,7643,7644,7645,7646,7647,7648,7649,7650,7651,7652,7653,7654,7655,7656,7657,7658,7660,7661,7663,7664,7668,7672,7673,7674,7675,7677,7678,7679,7680,7681,7682,7683,7684,7685,7687,7688,7689,7690,7691,7692,7693,7694,7695,7696,7697,7698,7700,7703,7704,7705,7706,7707,7708,7709,7710,7712,7713,7714,7715,7716,7717,7718,7719,7720,7721,7722,7723,7724,7725,7726,7727,7728,7729,7730,7731,7732,7733,7734,7735,7736,7737,7739,7741,7742,7743,7744,7745,7746,7748,7749,7751,7752,7754,7758,7763,7764,7765,7766,7767,7768,7769,7770,7771,7774,7776,7777,7778,7779,7780,7781,7782,7783,7784,7785,7786,7787,7788,7789,7790,7791,7793,7795,7796,7797,7798,7799,7800,7801,7802,7803,7804,7805,7807,7808,7809,7810,7811,7812,7813,7814,7815,7822,7823,7824,7825,7826,7828,7829,7830,7833,7834,7835,7836,7837,7838,7839,7840,7841,7842,7843,7844,7846,7848,7850,7851,7852,7853,7854,7855,7856,7858,7859,7860,7861,7862,7863,7864,7867,7868,7869,7870,7871,7872,7873,7874,7875,7876,7877,7878,7879,7880,7881,7882,7883,7884,7885,7886,7887,7888,7889,7890,7891,7892,7893,7894,7895,7896,7898,7899,7900,7901,7902,7903,7904,7905,7906,7907,7909,7910,7911,7912,7913,7914,7916,7917,7918,7919,7920,7921,7922,7923,7924,7925,7926,7927,7928,7929,7930,7931,7932,7933,7934,7935,7936,7937,7938,7940,7941,7942,7943,7944,7945,7946,7947,7949,7953,7957,7958,7959,7960,7961,7962,7963,7964,7965,7966,7967,7970,7971,7972,7973,7974,7975,7976,7977,7978,7979,7980,7981,7982,7983,7984,7985,7988,7989,7990,7991,7992,7993,7994,7995,7996,7997,7998,7999,8000,8001,8002,8004,8005,8006,8008,8009,8010,8011,8012,8014,8015,8016,8017,8018}'::bigint[]) as id),
hit as (
  select c.id, c.course_code, c.source_url, c.outcomes, c.lead, c.shape, c.fingerprint
    from public.course_outcomes c join ids using (id)
   where c.id between :lo and :hi
)
select json_build_object(
  'lo', :lo, 'hi', :hi, 'rows', count(*),
  'checksum', md5(string_agg(id || ':' || fingerprint || ':' || shape, ',' order by id)),
  'before', json_agg(json_build_object('id', id, 'outcomes', outcomes, 'lead', lead, 'shape', shape,
                                       'fingerprint', fingerprint) order by id))
from hit;
```

The summary (one SELECT, one JSON value):

```sql
with ids as (select unnest('{7451,7452,7453,7454,7455,7456,7457,7458,7459,7460,7461,7462,7463,7464,7465,7466,7468,7469,7471,7477,7483,7484,7485,7486,7487,7488,7489,7490,7491,7492,7493,7494,7495,7496,7497,7498,7499,7500,7501,7502,7503,7504,7505,7506,7507,7508,7509,7510,7511,7513,7514,7515,7516,7517,7518,7519,7520,7521,7522,7523,7524,7525,7526,7527,7528,7529,7530,7531,7538,7539,7541,7542,7543,7544,7545,7547,7548,7549,7550,7551,7552,7553,7554,7555,7556,7557,7558,7559,7561,7562,7563,7564,7565,7566,7567,7568,7569,7570,7571,7572,7574,7576,7577,7578,7579,7581,7582,7583,7584,7585,7586,7587,7588,7589,7590,7591,7592,7593,7594,7595,7596,7597,7598,7599,7600,7601,7602,7603,7604,7605,7606,7607,7608,7609,7610,7612,7613,7614,7615,7616,7617,7618,7619,7620,7621,7622,7623,7625,7626,7627,7628,7629,7630,7631,7632,7633,7634,7635,7636,7637,7638,7639,7640,7641,7642,7643,7644,7645,7646,7647,7648,7649,7650,7651,7652,7653,7654,7655,7656,7657,7658,7660,7661,7663,7664,7668,7672,7673,7674,7675,7677,7678,7679,7680,7681,7682,7683,7684,7685,7687,7688,7689,7690,7691,7692,7693,7694,7695,7696,7697,7698,7700,7703,7704,7705,7706,7707,7708,7709,7710,7712,7713,7714,7715,7716,7717,7718,7719,7720,7721,7722,7723,7724,7725,7726,7727,7728,7729,7730,7731,7732,7733,7734,7735,7736,7737,7739,7741,7742,7743,7744,7745,7746,7748,7749,7751,7752,7754,7758,7763,7764,7765,7766,7767,7768,7769,7770,7771,7774,7776,7777,7778,7779,7780,7781,7782,7783,7784,7785,7786,7787,7788,7789,7790,7791,7793,7795,7796,7797,7798,7799,7800,7801,7802,7803,7804,7805,7807,7808,7809,7810,7811,7812,7813,7814,7815,7822,7823,7824,7825,7826,7828,7829,7830,7833,7834,7835,7836,7837,7838,7839,7840,7841,7842,7843,7844,7846,7848,7850,7851,7852,7853,7854,7855,7856,7858,7859,7860,7861,7862,7863,7864,7867,7868,7869,7870,7871,7872,7873,7874,7875,7876,7877,7878,7879,7880,7881,7882,7883,7884,7885,7886,7887,7888,7889,7890,7891,7892,7893,7894,7895,7896,7898,7899,7900,7901,7902,7903,7904,7905,7906,7907,7909,7910,7911,7912,7913,7914,7916,7917,7918,7919,7920,7921,7922,7923,7924,7925,7926,7927,7928,7929,7930,7931,7932,7933,7934,7935,7936,7937,7938,7940,7941,7942,7943,7944,7945,7946,7947,7949,7953,7957,7958,7959,7960,7961,7962,7963,7964,7965,7966,7967,7970,7971,7972,7973,7974,7975,7976,7977,7978,7979,7980,7981,7982,7983,7984,7985,7988,7989,7990,7991,7992,7993,7994,7995,7996,7997,7998,7999,8000,8001,8002,8004,8005,8006,8008,8009,8010,8011,8012,8014,8015,8016,8017,8018}'::bigint[]) as id),
hit as (
  select c.id, c.college, c.kind, c.read_run, c.course_code, c.source_url, c.outcomes, c.lead, c.shape, c.fingerprint,
         (select max(e.i) - 1 from jsonb_array_elements_text(c.outcomes) with ordinality e(x, i)
           where e.x ~* '^cour?se (learning )?outcomes?:?$') as last_head
    from public.course_outcomes c join ids using (id)
), fixed as (
  select hit.*, coalesce((select jsonb_agg(e.x order by e.i) from jsonb_array_elements(outcomes) with ordinality e(x, i)
                           where e.i - 1 > last_head), '[]'::jsonb) as new_outcomes
    from hit
)
select json_build_object(
  'ids_listed', (select count(*) from ids), 'rows', count(*),
  'guard_ok', count(*) filter (where college = 'Golden West College' and kind = 'slo' and read_run = '41399075269'
                                 and lead is null and last_head is not null and fingerprint = md5(outcomes::text)),
  'head_first', count(*) filter (where last_head = 0),
  'emptied', count(*) filter (where jsonb_array_length(new_outcomes) = 0),
  'to_paragraph', count(*) filter (where jsonb_array_length(new_outcomes) = 1),
  'collisions', (select count(*) from fixed f join public.course_outcomes c
                   on c.college = 'Golden West College' and c.kind = 'slo' and c.course_code = f.course_code
                  and c.source_url = f.source_url and c.fingerprint = md5(f.new_outcomes::text) and c.id <> f.id),
  'checksum', md5(string_agg(id || ':' || fingerprint || ':' || shape, ',' order by id)))
from fixed;
```

**Go only when** `ids_listed`, `rows` and `guard_ok` are each 476, `emptied` and `collisions` are 0, the four pages'
`rows` sum to 476, and the check below, run on the filed before-values, returns the summary's `checksum` and 476.

```sql
select json_build_object('rows', count(*),
       'checksum', md5(string_agg(b.id || ':' || b.fingerprint || ':' || b.shape, ',' order by b.id)))
  from jsonb_to_recordset($before$<the four pages' before arrays, joined into one array>$before$::jsonb)
       as b(id bigint, outcomes jsonb, lead text, shape text, fingerprint text);
```

## 2. The write (guarded on the 476 ids and the count; returns one JSON value with each row's before-values)

```sql
with ids as (select unnest('{7451,7452,7453,7454,7455,7456,7457,7458,7459,7460,7461,7462,7463,7464,7465,7466,7468,7469,7471,7477,7483,7484,7485,7486,7487,7488,7489,7490,7491,7492,7493,7494,7495,7496,7497,7498,7499,7500,7501,7502,7503,7504,7505,7506,7507,7508,7509,7510,7511,7513,7514,7515,7516,7517,7518,7519,7520,7521,7522,7523,7524,7525,7526,7527,7528,7529,7530,7531,7538,7539,7541,7542,7543,7544,7545,7547,7548,7549,7550,7551,7552,7553,7554,7555,7556,7557,7558,7559,7561,7562,7563,7564,7565,7566,7567,7568,7569,7570,7571,7572,7574,7576,7577,7578,7579,7581,7582,7583,7584,7585,7586,7587,7588,7589,7590,7591,7592,7593,7594,7595,7596,7597,7598,7599,7600,7601,7602,7603,7604,7605,7606,7607,7608,7609,7610,7612,7613,7614,7615,7616,7617,7618,7619,7620,7621,7622,7623,7625,7626,7627,7628,7629,7630,7631,7632,7633,7634,7635,7636,7637,7638,7639,7640,7641,7642,7643,7644,7645,7646,7647,7648,7649,7650,7651,7652,7653,7654,7655,7656,7657,7658,7660,7661,7663,7664,7668,7672,7673,7674,7675,7677,7678,7679,7680,7681,7682,7683,7684,7685,7687,7688,7689,7690,7691,7692,7693,7694,7695,7696,7697,7698,7700,7703,7704,7705,7706,7707,7708,7709,7710,7712,7713,7714,7715,7716,7717,7718,7719,7720,7721,7722,7723,7724,7725,7726,7727,7728,7729,7730,7731,7732,7733,7734,7735,7736,7737,7739,7741,7742,7743,7744,7745,7746,7748,7749,7751,7752,7754,7758,7763,7764,7765,7766,7767,7768,7769,7770,7771,7774,7776,7777,7778,7779,7780,7781,7782,7783,7784,7785,7786,7787,7788,7789,7790,7791,7793,7795,7796,7797,7798,7799,7800,7801,7802,7803,7804,7805,7807,7808,7809,7810,7811,7812,7813,7814,7815,7822,7823,7824,7825,7826,7828,7829,7830,7833,7834,7835,7836,7837,7838,7839,7840,7841,7842,7843,7844,7846,7848,7850,7851,7852,7853,7854,7855,7856,7858,7859,7860,7861,7862,7863,7864,7867,7868,7869,7870,7871,7872,7873,7874,7875,7876,7877,7878,7879,7880,7881,7882,7883,7884,7885,7886,7887,7888,7889,7890,7891,7892,7893,7894,7895,7896,7898,7899,7900,7901,7902,7903,7904,7905,7906,7907,7909,7910,7911,7912,7913,7914,7916,7917,7918,7919,7920,7921,7922,7923,7924,7925,7926,7927,7928,7929,7930,7931,7932,7933,7934,7935,7936,7937,7938,7940,7941,7942,7943,7944,7945,7946,7947,7949,7953,7957,7958,7959,7960,7961,7962,7963,7964,7965,7966,7967,7970,7971,7972,7973,7974,7975,7976,7977,7978,7979,7980,7981,7982,7983,7984,7985,7988,7989,7990,7991,7992,7993,7994,7995,7996,7997,7998,7999,8000,8001,8002,8004,8005,8006,8008,8009,8010,8011,8012,8014,8015,8016,8017,8018}'::bigint[]) as id),
hit as (
  select c.id, c.outcomes, c.lead, c.shape, c.fingerprint,
         (select max(e.i) - 1 from jsonb_array_elements_text(c.outcomes) with ordinality e(x, i)
           where e.x ~* '^cour?se (learning )?outcomes?:?$') as last_head
    from public.course_outcomes c join ids using (id)
   where c.college = 'Golden West College' and c.kind = 'slo' and c.read_run = '41399075269' and c.lead is null
     and c.fingerprint = md5(c.outcomes::text)
), fixed as (
  select hit.*, outcomes ->> last_head::int as new_lead,
         coalesce((select jsonb_agg(e.x order by e.i) from jsonb_array_elements(outcomes) with ordinality e(x, i)
                    where e.i - 1 > last_head), '[]'::jsonb) as new_outcomes
    from hit where last_head is not null
), done as (
  update public.course_outcomes c
     set lead = f.new_lead,
         outcomes = f.new_outcomes,
         shape = case when jsonb_array_length(f.new_outcomes) > 1 then 'list' else 'paragraph' end,
         fingerprint = md5(f.new_outcomes::text)
    from fixed f
   where c.id = f.id and jsonb_array_length(f.new_outcomes) > 0 and (select count(*) from fixed) = 476
  returning c.id, f.outcomes as before_outcomes, f.lead as before_lead, f.shape as before_shape,
            f.fingerprint as before_fingerprint, c.fingerprint as after_fingerprint
)
select json_build_object('updated', count(*), 'refused', count(*) = 0 and (select count(*) from fixed) <> 476,
                         'eligible', (select count(*) from fixed),
                         'rows', json_agg(json_build_object('id', id, 'outcomes', before_outcomes, 'lead', before_lead,
                                          'shape', before_shape, 'fingerprint', before_fingerprint,
                                          'after_fingerprint', after_fingerprint) order by id))
  from done;
-- expected: updated 476. Any other eligible count updates nothing and returns refused true.
```

## 3. Rollback (from the write's returned `rows`, holding out any row changed after the write)

A row whose fingerprint is no longer the one the write set was changed since (a curator or a load): it is held out
and listed for Sam (`docs/reference/data_write_rollback.md`, step 2). The literal is dollar-quoted, so the
outcomes' apostrophes need no escaping.

```sql
with b as (
  select * from jsonb_to_recordset($before$<the write's returned rows array>$before$::jsonb)
       as b(id bigint, outcomes jsonb, lead text, shape text, fingerprint text, after_fingerprint text)
), back as (
  update public.course_outcomes c
     set outcomes = b.outcomes, lead = b.lead, shape = b.shape, fingerprint = b.fingerprint
    from b
   where c.id = b.id and c.college = 'Golden West College' and c.kind = 'slo' and c.fingerprint = b.after_fingerprint
  returning c.id
)
select json_build_object('rolled_back', (select count(*) from back),
                         'held_out', (select json_agg(b.id order by b.id) from b where b.id not in (select id from back)),
                         'listed', (select count(*) from b));
-- rolled_back plus held_out must equal listed; then step 1's summary checksum must read as before over the
-- rolled-back ids
```

**Checked on a local copy (S690):** the steps ran on a scratch Postgres 16 table loaded with read 41399075269's 568
filed SLO rows (as filed before this branch corrected them) at the receipt's ids. Pre-read pages 120, 120, 120 and
116 rows; summary 476 listed, 476 rows, 476 guard_ok, 471 head first, 0 emptied, 22 to paragraph, 0 collisions,
checksum `cb441aa17605cc3827460f2e207587bb`; the check on the joined before-values returned 476 and the same
checksum. The write updated 476, and no outcome matched the sub-heading after it; a second write updated 0 and
returned refused. With one row curated before the write (eligible 475), the write updated 0 and returned refused.
With row 7729 edited after the write, the rollback restored 475 and held out 7729.
