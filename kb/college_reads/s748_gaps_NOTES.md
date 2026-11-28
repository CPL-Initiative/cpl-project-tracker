# S748 gaps: notes for the conductor (Allan Hancock, Mt. San Antonio)

Written 2026-11-28 by worker `gaps` on `claude/s748-gaps`. The census is run 46089216929 (2026-11-28 00:44Z).

## 1. Mt. San Antonio's eight (02990, 08045, 16544, 30762, 36697, 39709, 39710, 44689)

Each was loaded once, at run 38059865531 (2026-10-10) or 39891607837 (2026-10-23), and its committed record still
carries the score the scorer gave at that read, so the committed score and the live row both read unequal; today's
scorer adds each to its printed total (02990 as `meets`, 08045 as `short_high`, the other six with a choice list read
without units counted at the figure the list prints), and no reconcile has run over these records since their read
(`read_run` empty, `reconciled` empty, the college's entry has `steps: []`). No single dispatch posts them: a plain
`step=reread` or `step=load` posts the committed records as filed, whose scores still fail, and
`python3 kb/_program_requirements_rescore.py --check` names none of them, so the free reconcile
(`program-requirements-college.yml`, `step=reconcile`, `extract=0`, Mt. San Antonio College) rescores and commits
them under its run, and `step=reread` then posts them.

How I measured it: `kb/_program_piles_s714_ccsf.py` `fresh_score` (the scorer over the committed record and the
state's list, no page text) over all 386 committed records. Eight move fail to pass, none moves pass to fail. The
reconcile scores with the fresh page text as well, which I could not run here.

## 2. The five pin candidates: already read, none pinned

The repository holds a free read and a filed answer for each, so none is read again
(`d-west-valley-no-blind-rerun-s727`).

| Program | Read | Filed answer |
|---|---|---|
| Allan Hancock 42208 Viticulture Level 2 | 45564881318 (its own entry 28876/30923) | names 6 of the state's 17 courses; the capture refuses it (`allan_hancock/named_gaps_s730.json`, `list_by_reference`) |
| Allan Hancock 42210 Viticulture Level 3 | 45564881318 (its own entry 28876/30922) | names 7 of the state's 20 courses; the same answer |
| Mt. San Antonio 15574 Radio Broadcasting On-the-Air | 45029764686 | the page is Audio Media 11120's (`mt_san_antonio/no_record_s703.json`) |
| Mt. San Antonio 22161 Radio Broadcasting: On-Air | 45029764686 | the page is Audio Media 22160's |
| Mt. San Antonio 31598 Adult High School Diploma | 45029764686 | the page is Secondary Education 36743's |

The same S703 file names two programs whose own page exists and the capture never reached: Digital Media Specialist
43777 and Regenerative Communities 43999. Plan `kb/college_reads/s748_gaps_mt_san_antonio_own_pages.json` reads
both as the capture reads them (two loads, free). The result and any pin are in section 5.

## 3. Allan Hancock's 27 no-closed-list programs whose own page the lookup found

Nothing extracts them today. The lookup (S652, #3299 slice A) files the page beside the program and leaves its method
`no_closed_list`: the record carries no source and no text, so the reader sends nothing
(`kb/_program_requirements_college.py`, the comment above `ncl_lookup`). Slice B, which would hand such a program its
found page and score it with no state list to check coverage against, is not built; it is a reader code change with
its own gate and needs a second reader. The repository's estimator (`kb/_program_requirements_wave.py` `price`)
puts the read at $2.70: 27 programs at the $0.08 floor rate with its 1.25 margin.

## 4. `kb/collection_lane.py`'s hold on Allan Hancock

S681 set the hold for one night's split; no later run lifted it. Three tools read it:
`kb/_program_named_gaps.py` (its record-rule runs and labels skip the college),
`kb/_program_requirements_units_rules.py` and `kb/_program_discontinued.py` (their plans skip it), and
`kb/_harvest_gap_census.py` `named_gap` (the census gives the college's programs no label).

For tonight it changes nothing in plan `s748g1`: a by-key pile never reads the hold, the load posts a filed gap for
any college, and the census counts a live row with a gap as collected whatever the lane says. The four Allan Hancock
rows the record rules name are in `s748g1` already. With the hold lifted, the census would label one more program
(45033 Cal-GETC, `ge_pattern_certificate`), measured by calling `named_gap` over the college's 87 with the hold off.
Lifting it is the conductor's split to change: one line in a shared file three tools import.
