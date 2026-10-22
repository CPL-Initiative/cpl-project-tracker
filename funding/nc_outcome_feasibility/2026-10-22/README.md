# Noncredit outcome feasibility, 2026-10-22

Sam's ask of 2026-10-22: MAP will not carry a reliable noncredit-origin flag (`LocID2`) for a while, so the noncredit
share of each award keeps its FTES sizing and releases on outcomes a noncredit program can meet without it. His second
outcome, *at least 5% of the noncredit courses the program provides have a CPL opportunity based on an exhibit*, was a
guess he asked us to test. This folder is the test.

- `nc_shares_dump.js` reads every institution's award and noncredit share from the model under one config dump
  (`cpl_funding_config_9c944a82.json`, the live row at 2026-10-22 17:32Z: Scenario 3 published, noncredit portion 15%,
  noncredit FTES weighted 2.724). Output: `nc_shares.json`.
- `nc_courses.sql` counts each college's COCI noncredit courses by funding category (CDCP = enhanced funding: ESL,
  basic skills, short-term vocational, workforce preparation; the rest is non-enhanced: parenting, older adults, home
  economics, health and safety, disabilities, immigrant education), its noncredit programs, the noncredit courses whose
  title equals a credit course's at the same college (mirrored candidates), the CDCP titles that name a credential,
  license or exam, and its MAP exhibits by type. Output: `nc_courses.json` (read through the Supabase MCP the same day).
- `nc_outcome_feasibility.py` joins the two on the roster's short names and tests six target rules. Output:
  `summary.json` and the printed tables.

Headline figures (the 111 institutions that carry a noncredit share, $3,786,046 together):

| | median per institution | p90 | max | statewide |
|---|---:|---:|---:|---:|
| Noncredit courses in COCI | 75 | 225 | 460 | 11,390 |
| CDCP noncredit courses | 39 | 161 | 310 | 7,129 |
| Mirrored candidates (CDCP) | 4 | 31 | 80 | 1,212 |
| Credential-like CDCP titles | 5 | 24 | 46 | 991 |
| Exhibits in MAP, any type | 1 | 51 | 759 | 2,301 |

Exhibits each rule requires: 5% of all noncredit courses, median 4, p90 12, max 23, 623 statewide, 17 institutions
above their mirrored plus credential-like supply; 5% of CDCP courses, median 2, p90 9, max 16, 406 statewide, 6 above;
the greater of 2 and 5% of CDCP capped at 10, median 2, max 10, 428 statewide, 19 above (the floor at the smallest
programs). With the model's dormant `nc_threshold_ftes` dial at 300 noncredit FTES: 42 institutions at or above it hold
$3,246,934; 69 below hold $539,112 (the largest $27,623); the 42 need 235 exhibits under the recommended rule, 37 of them
have the supply in their own catalog today, and 16 hold no exhibit of any kind in MAP.

Re-run: `node funding/nc_outcome_feasibility/2026-10-22/nc_shares_dump.js <config.json> nc_shares.json`, the SQL through
the MCP into `nc_courses.json`, then the Python script. The design these figures inform and Sam's calls are on Open Asks
Sheet 113 and in `docs/cpl_funding_lessons.md` (2026-10-22).
