---
title: A double-decoded string needs the codec that decoded it — cp1252, a C1 passthrough, and repair before you collapse whitespace
created: 2026-09-18
updated: 2026-09-18
tags: [methodology, encoding, loader, coci, pitfall]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[methodology-what-might-qualify-is-a-different-question-from-who-already-grants-it]]"
artifacts:
  - kb/_text_repair.py
  - kb/_build_college_courses.py
  - chatbox/build_coci_offerings.py
  - tests/course_title_mojibake_test.py
---

# A double-decoded string needs the codec that decoded it — cp1252, a C1 passthrough, and repair before you collapse whitespace

> **One-sentence summary** — UTF-8 text that was read back as cp1252, once or twice, is repaired by re-encoding it with cp1252 (not latin-1) and passing the five bytes cp1252 leaves undefined straight through, and the repair has to run before any whitespace normalization touches the string.

## Context

Sierra's first prospective-credit course list rendered Pasadena's NURS 102 to a
student as *"Fundamentals of Vocational Nursing Ã¢â‚¬â€œ Theory"*. Both COCI
loaders already carried a repair called `fix_moji`. Measured on the live
tables (2026-09-18): 381 of 141,696 course titles across 84 colleges and 186 of
16,097 offerings rows still carried the damage, and 0 program titles.

## What was measured

Reading the exact code points back from the table showed five shapes, and why
the existing repair could reach none of them:

- `Ã¢â‚¬â€œ` is an en dash decoded wrong twice (– → â€“ → Ã¢â‚¬â€œ). The
  intermediate form contains ‚ and € and œ, which are cp1252 characters that
  Latin-1 cannot encode, so a repair that round-trips through Latin-1 raises
  and returns the string unchanged.
- `â€™` is a right quote decoded wrong once. It contains no "Ã", so a repair
  that fires only on "Ã" never runs.
- `â„¢` is a trademark decoded wrong once, with no "Ã" and no "â€" either.
- `Ã¢â‚¬â€` followed by U+009D is an em dash decoded wrong twice. Its last byte
  is one of the five bytes cp1252 leaves undefined (0x81, 0x8D, 0x8F, 0x90,
  0x9D), which a lenient decoder passed through as a C1 control. A strict
  cp1252 encoder cannot encode it, so the round trip fails.
- `Ã‚Â` followed by a plain space is a no-break space decoded wrong twice, and
  then flattened. The builder's `clean()` collapsed `\s+` (which matches a
  no-break space) to a plain space before the repair ran, and the round trip
  can never close once the byte it needs is gone.

And the two repairs were copies of each other, applied to the college name
only. A copy in each of two builders is the drift the repo already warns about,
and neither copy was applied to the field that reaches students.

## The rule

1. **Re-encode with the codec that did the wrong decode.** For text that came
   through Windows tooling that is cp1252, and the difference from Latin-1 is
   exactly the 0x80–0x9F block the damage lives in.
2. **Pass the five undefined bytes through.** A custom error handler maps
   U+0081, U+008D, U+008F, U+0090 and U+009D back to their byte; everything else
   still fails loudly.
3. **Iterate until the text stops changing, and let the UTF-8 decode be the
   guard.** Up to three passes. A string that is not mojibake fails the UTF-8
   decode and comes back untouched, which is the safety property the test pins
   ("Âme et corps", "Cañada College", an en dash already correct).
4. **Trigger on the once-decoded forms too.** "Ã" and "Â" mark two-byte lead
   bytes; "â" followed by any character of the cp1252 0x80–0x9F block or the
   Latin-1 supplement marks a three-byte sequence read wrong once.
5. **Repair before you normalize.** Whitespace collapse, trimming and case
   folding all destroy bytes the round trip needs. `clean(fix_moji(raw))`,
   never `fix_moji(clean(raw))`.
6. **One repair, imported by every loader, applied to every field a person
   reads.** `kb/_text_repair.py`; the test asserts both builders import it and
   apply it to the title.

## How it is guarded

`tests/course_title_mojibake_test.py` (40, stdlib, a `js-tests.yml` step):
thirteen live shapes repaired, idempotence on the repaired form, genuine text
untouched, a non-string cell passing through, the trigger seeing the forms
that carry no "Ã", and both builders importing the module and repairing the
title, the course builder before `clean()`.

## What it does not do yet

- The stored rows are not rewritten. The offerings table is truncate-and-
  replaced nightly, so its 186 clear on the next sync. The course table's sync
  is upsert-only with the title in its conflict key, so its 381 garbled rows
  stay beside the repaired ones, doubling alignment candidates for those
  courses, until they are deleted after the first clean sync with a receipt.
  That is a shared-table write, so it waits for Sam (`s274-sam-course-title-cleanup`).
- A no-break space that was already flattened in a stored row cannot be
  recovered by the round trip; only the rebuild from the source workbook can.
