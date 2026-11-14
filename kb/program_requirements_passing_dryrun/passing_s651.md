## Passing function: one dry run for four changes (S651), nothing applied

Filed records on `main`, scored by the tab's rule before and after; the live table may differ (a reconcile SELECT goes with this). Census: live, 2026-11-13 18:04Z.

| Change | Effect on the filed records |
|---|---|
| 1. Noncredit Total Hours | 45 candidates, fail to pass only, each decided on its captured text at the rescore |
| 2. Own-list rule | not coded: no record exists; 1668 programs with no closed list are unread |
| 3. GE-pattern certificates | 91 match criteria 1-3 (CSU-GE 25, Cal-GETC 36, Cal-GETC at a parked college 2, IGETC 28); 0 have quoted evidence, so 0 count |
| 4. Degree electives-fill guard | 5 pass to fail; 25 failing degree records held |

**Passing, all filed records:** 15838 before, 15833 after, of 19137.

### The ten largest college movements

| College | Before | After | Change |
|---|---:|---:|---:|
| American River College | 300 | 299 | -1 |
| Butte College | 138 | 137 | -1 |
| College of San Mateo | 53 | 52 | -1 |
| College of the Siskiyous | 66 | 65 | -1 |
| Cypress College | 252 | 251 | -1 |

### Change 4, every pass to fail

- American River College 04544
- Butte College 01329
- College of San Mateo 31224
- College of the Siskiyous 10949
- Cypress College 32097

Held (the current fill would pass them on a rescore; the guard keeps them failing): American River College 07206; Cañada College 30834; Cañada College 31856; College of San Mateo 35574; Cosumnes River College 04602; Cosumnes River College 04607; Cosumnes River College 04614; Cosumnes River College 07305; Cosumnes River College 11319; Cosumnes River College 11338; Cosumnes River College 33542; Cypress College 03777; Cypress College 32134; Cypress College 37246; Folsom Lake College 15368; Folsom Lake College 38736; Folsom Lake College 39574; Folsom Lake College 42612; Foothill College 06047; Porterville College 06773; Sacramento City College 04656; Sacramento City College 04688; Sacramento City College 07350; Sacramento City College 21418; Solano Community College 38591.

Change 1's candidates by college: Berkeley City College 2; College of the Desert 1; College of the Sequoias 4; College of the Siskiyous 1; El Camino College 5; Gavilan College 1; Grossmont College 2; Los Medanos College 2; Palo Verde College 4; Pasadena City College 21; San Jose City College 1; Southwestern College 1.

### Cosumnes River's seven holds

| Control number | Filed | Current rescore | After |
|---|---|---|---|
| 04602 | fail | pass | fail |
| 04607 | fail | pass | fail |
| 04614 | fail | pass | fail |
| 07305 | fail | pass | fail |
| 11319 | fail | pass | fail |
| 11338 | fail | pass | fail |
| 33542 | fail | pass | fail |

Nothing is applied: the migration is drafted and not listed in `kb/migrations/.apply`.
