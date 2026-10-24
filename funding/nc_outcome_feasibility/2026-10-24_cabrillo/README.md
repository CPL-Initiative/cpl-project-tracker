# Cabrillo College, measured against the noncredit outcomes (2026-10-24, S468)

Sam's ask 2 of 2026-10-24 (handoff 467): *"use Cabrillo College as a use case to see if you might be able to measure
their data against the metrics we need to count. Hoping we can find a metric that can be counted rather than
attested."* This is the builder's dry run. Nothing here is published, and no figure reaches a college.

Read through the Supabase MCP at about 17:35Z from `chatbox_college_courses` (COCI), `chatbox_exhibits` (MAP),
`map_exhibit_credential` and `coci_college_programs`. Cabrillo carries 166 CDCP noncredit courses (an NC-1 target of
9: the greater of 2 and 5% of 166, capped at 10), 81 active noncredit programs, and 79 exhibits (46 credit by exam, 26
industry certification, 7 portfolio review; 69 local, 2 adopted from the CCC set, 8 unmarked).

## NC-1, channel by channel

| Channel (Sam's Sheet 113) | Counted from data? | Cabrillo |
|---|---|---:|
| 1. The exhibit names a noncredit course | Yes (target course or exact title) | 0 by target, 5 by title, all 5 also in channel 2 |
| 2. A target credit course mirrors a noncredit course | **Yes, today** | **33 exhibits** (target 9) |
| 3. A credential the program's courses name | Only with a curated credential-to-course match | 2 or 3 more (CompTIA A+ to *CIS 471A/B A+ Certification Prep*; EMT to *FT 484NRE National Registry Exam-B Prep*) |
| 4. The strike team's attested list | No, attested by definition | not measured |

**Channel 2 is the counted metric.** Cabrillo numbers its noncredit twins 400 above the credit course in the same
subject (CEM 155 Blueprint Reading and CEM 455; CIS 133A and CIS 433A; MUS 31A and MUS 431A), and 33 of its 79
exhibits target a credit course with such a twin. No exhibit in MAP targets a noncredit course itself, which is why
channel 1 finds nothing by target. Three title matches are looser than the course pairs (title_norm folds *I* and
*II*: Fundamental Recording Techniques, Game Audio Production, Photoshop for Photography); each exhibit still has an
exact twin, so the count stands.

**Statewide, the same rule** (`nc1_mirror_channel.sql`): of 102 colleges with CDCP courses, 4 meet their NC-1 target
on channel 2 alone today (Cabrillo 33 of 9, Santa Ana 17 of 10, Las Positas 9 of 3, Norco 3 of 3), 8 have some, and
90 have none; 38 of the 410 exhibits the targets add up to are counted. So the channel pays for work a college has
done, and most colleges have it ahead of them. A college builds toward it by articulating an exhibit to a credit
course its noncredit program mirrors, which is the program's learning by construction.

Two limits. `sample_courses` lists an exhibit's target courses as MAP's Exhibits report gives them, so the count is
a floor; and 61 exhibits statewide (4 at Cabrillo) carry no `exhibit_id`, so the builder must key them by title or
they drop out of a distinct count (they did, in the first pass: 29, not 33).

## NC-2

Cabrillo has no noncredit CPL portfolio-development course in COCI. It has two professional portfolio courses (ECE
480B *Early Childhood Education Professional Portfolio Development*, HSERV 451CP *Family Development Credential
Portfolio*) that a title search would wrongly count, and statewide one noncredit course title names prior learning.
So COCI can **confirm** NC-2 once a control number is named, and cannot **find** it by title. Two ways to count it
without an attestation: the Chancellor's Office names the course in its guidance (a title the course must carry, or
a TOP or CIP code the sync can test), or the strike team's attestation names the control number and the COCI sync
confirms it is chaptered in a CDCP program, as the scenario already says.

## What the builder takes from this

Emit `nc_exh` from channel 2 (above), plus channel 1 by title where it adds an exhibit; key exhibits by id or title;
`nc_cdcp` per roster institution from the same COCI table; channel 3 waits on a curated crosswalk; channel 4 and NC-2
wait on the attestation surface. Standalone noncredit institutions count at their district's credit colleges (Sheet
113), which this read does not yet do.
