#!/usr/bin/env python3
"""S741: the scorer's option reading takes Roman numerals of two or more letters (OPTION_PART), with its statewide self-recall.

WHY. Cosumnes River's Spanish A.A.-T 33542 prints 'OPTION I - Non-Native Spanish Speaker' (16 units) and 'OPTION II -
Native Spanish Speaker Units: 16', Option II over two lists (8 and 8), and 'Total Units: 19'. The reading kept the
three blocks in one option group. The scorer's option reading (option_parts, S714) joins blocks whose names open with
the same 'Option N' into one option, but its pattern knew digits and single letters only: 'OPTION I' read as the
letter I and 'OPTION II' as nothing, so the group had a block with no key and was never read as parts (the lane's
NEXT (3): OPTION_PART misses 'OPTION II'). The record was collected with the named gap option_lists_read_apart
(plan s739l). The pattern now also reads a Roman numeral of two to five letters of I, V and X.

Pinned here:
  * the pattern: 'Option II', 'OPTION III', 'Option IV', 'Option VI', 'Option IX' and 'Option XII' are options now;
    'Option I', 'Option V', 'Option X', 'Option 2' and 'Option B' read as before, with the same keys; 'Option I or
    II', 'Option II, III', 'Option II and III', 'Option II - 3 units' (a range's dash before a digit) and a word that
    merely opens with the letters ('Option Vista', 'Option IIa') are no option;
  * the self-recall over every filed record, counting what the change joins as well as the verdicts (the S652 review
    rule): four records carry a block the change newly names; the option parts move at two, Cosumnes River 33542 and
    Imperial Valley 01873; each is right by its own reader's note, held in kb/_program_piles_s714_ccsf.py
    (OPTION_PARTS_HELD); the two others (Columbia 20782, Imperial Valley 31458) hold one block an option, so nothing
    joins and nothing moves;
  * the verdicts, by today's scorer against each record's state list: 33542 adds to 19 against the printed 19 and
    01873 to 18-19 against the printed 18-20 (the short-high reading); no passing record turns failing;
  * every other college whose filed result would move is named: Imperial Valley College (01873), on its next rescore.
    No row is written by this change.

Run from repo root: python3 tests/program_option_roman_s741_test.py
"""
import glob
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_piles_s714_ccsf as C  # noqa: E402
import _program_requirements_score as S  # noqa: E402

BEFORE = re.compile(r"^\s*option\s+(\d{1,2}|[a-z])\b(?!\s*(?:,|or\b|and\b|-\s*\d|–\s*\d|through\b))", re.I)
TODAY = S.OPTION_PART
checks, failures = [0], []


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


def key(pattern, name):
    m = pattern.match(name)
    return m.group(1).lower() if m else None


print("the pattern")
for name, k in (("Option II - Exercise Science", "ii"), ("OPTION III", "iii"), ("Option IV: Select one", "iv"),
                ("Option VI", "vi"), ("Option IX", "ix"), ("Option XII (9 units)", "xii")):
    check(key(TODAY, name) == k and key(BEFORE, name) is None, "%r is an option now, and was none" % name)
for name, k in (("Option I - Intercollegiate Athletics", "i"), ("OPTION V", "v"), ("Option X", "x"),
                ("Option 2: A statistics course", "2"), ("Option B", "b"), ("Option 12", "12")):
    check(key(TODAY, name) == k == key(BEFORE, name), "%r reads as before" % name)
for name in ("Option I or II", "Option II, III or IV", "Option II and III", "Option II - 3 units", "Option II through IV",
             "Option Vista", "Option IIa", "Optional II", "Options II"):
    check(key(TODAY, name) is None, "%r is no option" % name)

print("the self-recall over every filed record")
read, named, joined, to_passing, from_passing = 0, [], [], [], []
for path in sorted(glob.glob(os.path.join(ROOT, "kb", "program_requirements_college", "*", "records", "*.json"))):
    try:
        with open(path, encoding="utf-8") as fh:
            f = json.load(fh)
    except ValueError:
        continue
    rec = f.get("record")
    if not isinstance(rec, dict):
        continue
    read += 1
    names = [str(b.get("name") or "") for b in rec.get("blocks") or [] if b.get("option_group")]
    if not any(TODAY.match(x) and not BEFORE.match(x) for x in names):
        continue
    k = (f.get("college"), str(f.get("control_number")))
    named.append(k)
    S.OPTION_PART = BEFORE
    try:
        parts_before, before = S.option_parts(rec), C.fresh_score(f)["arithmetic"]
    finally:
        S.OPTION_PART = TODAY
    parts_after, after = S.option_parts(rec), C.fresh_score(f)["arithmetic"]
    if parts_before != parts_after:
        joined.append(k)
    if after.get("pass") and not before.get("pass"):
        to_passing.append(k)
    if before.get("pass") and not after.get("pass"):
        from_passing.append(k)
    if k == ("Cosumnes River College", "33542"):
        check(after.get("computed") == [19.0, 19.0] and after.get("stated") == [19.0, 19.0] and "fill" not in after
              and set(parts_after.values()) == {("Option", "i"), ("Option", "ii")},
              "33542: Option II's two lists are one option, and the record adds to the printed 19 with no fill")
    if k == ("Imperial Valley College", "01873"):
        check(not before.get("pass") and after.get("pass") and after.get("computed") == [18.0, 19.0]
              and after.get("stated") == [18.0, 20.0] and after.get("short_high") is True
              and len({v for v in parts_after.values()}) == 2 and len(parts_after) == 5,
              "01873: three blocks are Option I and two are Option II; 18-19 against the printed 18-20")
check(read > 18000, "the recall read every filed record (%d)" % read)
check(named == [("Columbia College", "20782"), ("Cosumnes River College", "33542"),
                ("Imperial Valley College", "01873"), ("Imperial Valley College", "31458")],
      "four records carry a block the change newly names: %s" % named)
check(joined == [("Cosumnes River College", "33542"), ("Imperial Valley College", "01873")],
      "the option parts move at two records: %s" % joined)
check(all(C.OPTION_PARTS_HELD.get(k) == "passes" for k in joined),
      "each joined record's held answer is its own reader's note (OPTION_PARTS_HELD): right 2, wrong 0")
check(not from_passing, "no passing record turns failing: %s" % from_passing)
check(set(to_passing) <= set(joined) and ("Imperial Valley College", "01873") in to_passing,
      "the verdicts that turn passing are the joined records' alone: %s" % to_passing)
OTHER_COLLEGES = sorted({c for c, _ in joined} - {"Cosumnes River College"})
check(OTHER_COLLEGES == ["Imperial Valley College"],
      "every other college whose filed result would move is named: %s" % OTHER_COLLEGES)

print("%d checks, %d failures" % (checks[0], len(failures)))
for m in failures:
    print("FAIL:", m)
sys.exit(1 if failures else 0)
