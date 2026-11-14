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


### Live reconcile (09:31Z 2026-11-14)

**Live:** 18233 rows, 15834 passing; Active 16747 rows, 14596 passing. **Files:** 19137 records, 15838 passing, so 904 filed records are not live and the files count 4 more passing. **105 of 118 colleges differ** (10 in the passing count). The ten largest differences:

| College | Filed | Live rows | Filed passing | Live passing |
|---|---:|---:|---:|---:|
| City College of San Francisco | 349 | 296 | 257 | 257 |
| Santa Rosa Junior College | 268 | 222 | 191 | 191 |
| Cosumnes River College | 217 | 182 | 146 | 146 |
| American River College | 368 | 335 | 300 | 300 |
| Southwestern College | 220 | 190 | 168 | 168 |
| College of the Desert | 358 | 330 | 288 | 288 |
| Fresno City College | 237 | 211 | 204 | 204 |
| Mendocino College | 118 | 93 | 73 | 73 |
| San Bernardino Valley College | 225 | 200 | 161 | 161 |
| De Anza College | 221 | 236 | 205 | 214 |

- **Change 4's five flips:** 5 of 5 pass live today (the read's own count); 5 are Active in the June program export. Against the table: live passing 15834 to 15829, Active passing 14596 to 14591.
- **Change 4's 25 held and change 1's 45 candidates** fail on file. The read is per college, so it cannot say which are live rows. 0 held and 7 candidates sit at colleges whose filed and live row counts agree; equal counts suggest, but do not prove, the same records.
- **Change 3's 91 programs** (2 at parked colleges) and change 2's 1668 have no row; the census that named them read the live Active list. Change 3's would add 91 to Active passing, once quoted.
- Nothing is applied: the migration is drafted and not listed in `kb/migrations/.apply`.
