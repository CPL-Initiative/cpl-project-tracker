#!/usr/bin/env python3
"""S740 (lane 1, reads): Santa Ana's reconcile entry, on the page's own words.

WHY. The gap census of 2026-11-26 12:06Z (run 45816008322) lists 15 Santa Ana College records on the reconcile_steps
lever. Three are areas of emphasis of the Liberal Arts A.A., and each fails on one reading: the catalog prints one
sentence on each emphasis's entry, under 'I. Requirements:',

    Complete a minimum of 18 units from a single Area of Emphasis listed below.

and 'Total : 18.0' under the emphasis's lists, where each list prints its own least. The reading kept each list as a
choice of its own at that least, so the records added to 9-13 (Arts, Humanities and Communications 18581), 3.5-7.5
(Business and Technology 18582) and 15 (Kinesiology and Wellness 19268, whose last list, 'e. Additional units to be
selected from a, b, or c above for a total of 18 units', names no least). The college's entry
(kb/program_requirements_reconcile.json, "Santa Ana College") carries one pool_lists step with floors: an emphasis's
lists become one 18-unit choice, each list's least kept in floors.

The page text is college page read 45835379921's (kb/college_reads/s740_reads_santa_ana_pages.json), each entry
read as the capture reads it, quoted here line for line (course rows left out, marked '...').

Pinned here:
  * the step on the page's words: each emphasis's lists join into one choice of 18, its floors the lists' own
    leasts, and today's scorer then adds the record to the printed 18;
  * the wrong joins it must refuse: a page without the sentence, a transfer degree, a certificate, an emphasis that
    prints one list, a record whose total is another figure, lists whose leasts sum past the figure, and a list the
    block pattern does not name;
  * the self-recall over every committed Santa Ana record (the S652 review rule, counting what the entry joins as
    well as the verdicts), with the sentence put on every record's page: the step joins the lists of these three
    alone, and the other three emphases (18580, 18583, 18584, one list of 18 each) stay as read and passing.

A record a reconcile run may move is read in either state: each of the three is either as read (its lists apart) or
already joined (one list named by the step, its floors the pinned ones), and the test holds before and after a
reconcile files the change.

Run from repo root: python3 tests/program_reconcile_s740_santa_ana_test.py
"""
import copy
import glob
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_piles_s714_ccsf as C  # noqa: E402
import _program_requirements_reconcile as R  # noqa: E402
import _program_requirements_score as S  # noqa: E402

SAC = "Santa Ana College"
FOLDER = os.path.join(ROOT, "kb", "program_requirements_college", "santa_ana", "records")
STEPS = R.load_steps()
POOLED = "The Area of Emphasis's lists"
AA = "A.A. Degree"
checks, failures = [0], []


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


def filed(cn):
    with open(os.path.join(FOLDER, cn + ".json"), encoding="utf-8") as fh:
        return json.load(fh)


def recon(record, text, award=AA, cn=None):
    return R.reconcile(record, text, SAC, award, control_number=cn, steps=STEPS)


def units(record):
    (lo, hi), why = S.program_units(record, {})
    return [lo, hi], why


# ── the pages' own words (college page read 45835379921; pages 6, 7 and 9 of the Santa Ana plan) ────────────────
SUMMARY = """Summary
This is a diversified degree designed for students desiring a broad knowledge of liberal arts and sciences plus additional coursework in an “Area of Emphasis”.
I. Requirements:
Complete general education Plan 1 (associate degree AA/AS only, nontransfer) or Plan 2 (Cal-GETC, CSU or UC transfer) as related to your educational goal. The CSU GE or IGETC pattern may be used in some cases; please see a counselor for details .
Complete a minimum of 18 units from a single Area of Emphasis listed below. For depth of study, students are strongly encouraged to complete two or more courses in a single discipline as part of their 18 units .
Complete all other associate degree requirements for Santa Ana College.
II. Areas of Emphasis:
1. American Studies Emphasis
2. Arts, Humanities and Communications Emphasis
3. Business and Technology Emphasis
4. Kinesiology and Wellness Emphasis
5. Mathematics and Science Emphasis
6. Social And Behavioral Sciences Emphasis
"""
SENTENCE = "Complete a minimum of 18 units from a single Area of Emphasis"
PAGES = {
    "18581": """Liberal Arts Arts, Humanities and Communications Emphasis: A.A. Degree
Program Code: SAC.LAAH.AA
Program Control Number: 18581
Requirements
Arts: Minimum 3-4 units from this block
18.0
...
Humanities: Minimum 3-5 units from this block
...
Communications: Minimum 3-4 units from this block
...
Total : 18.0
""" + SUMMARY,
    "18582": """Liberal Arts Business and Technology Emphasis: A.A. Degree
Program Code: SAC.LABT.AA
Program Control Number: 18582
Requirements
Business: Minimum 2-4.5 units from this block
18.0- 0.0
...
Technology: Minimum 1.5-3 units from this block
...
Total : 18.0- 0.0
""" + SUMMARY,
    "19268": """Liberal Arts Kinesiology and Wellness Emphasis: A.A. Degree
Program Code: SAC.LAKW.AA
Program Control Number: 19268
Requirements
a. Kinesiology and Movement (minimum 3 units)
18.0
3.0
...
b. Scientific and Nutrition Foundation (minimum 3 units)
...
c. Behavioral Development, Communication, and Diversity (Minimum 3 units)
...
d. Physical Activity (6 units selected from at least three different areas)
...
e. Additional units to be selected from a, b, or c above for a total of 18 units
Total : 18.0
""" + SUMMARY,
}
# Each emphasis's lists as the reading kept them: (name, minimum, stated least). The pinned floors are these.
LISTS = {
    "18581": [("Arts: Minimum 3-4 units from this block", 3, 3),
              ("Humanities: Minimum 3-5 units from this block", 3, 3),
              ("Communications: Minimum 3-4 units from this block", 3, 3)],
    "18582": [("Business", 2, 2), ("Technology", 1.5, 1.5)],
    "19268": [("a. Kinesiology and Movement (minimum 3 units)", 3, 3),
              ("b. Scientific and Nutrition Foundation (minimum 3 units)", 3, None),
              ("c. Behavioral Development, Communication, and Diversity (Minimum 3 units)", 3, None),
              ("d. Physical Activity (6 units selected from at least three different areas)", 6, None),
              ("e. Additional units to be selected from a, b, or c above for a total of 18 units", None, None)],
}
AS_READ = {"18581": [9.0, 13.0], "18582": [3.5, 7.5], "19268": [15.0, 15.0]}

step = next((st for st in (STEPS.get(SAC) or {}).get("steps") or [] if st.get("kind") == "pool_lists"), {})
print("the entry")
check(step.get("with_floors") is True and step.get("awards") == "local" and step.get("name") == POOLED
      and step.get("pattern") == "Complete a minimum of (?P<n>\\d+) units from a single Area of Emphasis",
      "kb/program_requirements_reconcile.json holds Santa Ana's entry with its pool_lists step, floors kept")
check(len((STEPS.get(SAC) or {}).get("steps") or []) == 1, "the entry holds that one step")
for cn, page in PAGES.items():
    check(SENTENCE in page and "Program Control Number: %s" % cn in page,
          "%s: its own entry prints the sentence" % cn)
    check(all(name in page or name + ": Minimum" in page for name, _m, _s in LISTS[cn]),
          "%s: its entry prints each list's heading" % cn)


def joined(record):
    """The record's one joined list, or None."""
    bs = [b for b in record.get("blocks") or [] if b.get("name") == POOLED]
    return bs[0] if len(bs) == 1 and len(record.get("blocks") or []) == 1 else None


def floors_of(block):
    return [(f.get("name"), f.get("minimum")) for f in block.get("floors") or []]


print("the step on the page's own words")
for cn in sorted(PAGES):
    f = filed(cn)
    rec = f["record"]
    want = [(name, m) for name, m, _s in LISTS[cn]]
    already = joined(rec)
    if already is None:
        # As read: the lists apart, adding short of the printed 18.
        check([b.get("name") for b in rec["blocks"]] == [name for name, _m, _s in LISTS[cn]]
              and all(b.get("rule") == "choose_units" for b in rec["blocks"]),
              "%s: as read, the record holds the emphasis's lists apart" % cn)
        check(units(rec)[0] == AS_READ[cn], "%s: as read, the lists add to %s" % (cn, AS_READ[cn]))
        new, notes = recon(copy.deepcopy(rec), PAGES[cn], cn=cn)
    else:
        # After a reconcile filed the join: the committed record is the step's own output.
        new, notes = rec, [n for n in f.get("reconciled") or [] if n.get("now") == POOLED]
    one = joined(new)
    check(one is not None and one.get("rule") == "choose_units" and one.get("minimum") == 18
          and one.get("stated") == {"min": 18, "max": 18}, "%s: its lists join into one choice of 18" % cn)
    check(one is not None and floors_of(one) == want, "%s: each list's least stays in floors" % cn)
    check(len(notes) == 1 and notes[0].get("words") == SENTENCE and notes[0].get("field") == "blocks"
          and notes[0].get("was") == [name for name, _m, _s in LISTS[cn]],
          "%s: the note names the sentence and the lists it joined" % cn)
    got, why = units(new)
    check(got == [18.0, 18.0] and not why, "%s: the record then adds to the printed 18 (%s, %s)" % (cn, got, why))
    codes = [S.norm_code(c.get("code")) for c in (one or {}).get("courses") or []]
    check(len(codes) == len(set(codes)) and len(codes) > 0, "%s: a course two lists print is counted once" % cn)
    a = C.fresh_score(dict(f, record=new))["arithmetic"]
    check(a.get("status") == "equal" and a.get("computed") == [18.0, 18.0] and a.get("stated") == [18.0, 18.0],
          "%s: today's scorer reads 18 against the printed 18 (%s)" % (cn, a))


def lists_record(cn="18581", total=18, lists=None):
    """A record shaped as the reading kept an emphasis: its lists apart, one course each."""
    return {"program": {"section_heading": "an emphasis", "measure": "units", "total_units": {"min": total, "max": total}},
            "blocks": [{"name": name, "rule": "choose_units", "minimum": m, "option_group": None,
                        "stated": {"min": s, "max": s}, "courses": [{"code": "ART %d" % (100 + i), "units": 3,
                                                                     "units_max": None, "alternatives": []}]}
                       for i, (name, m, s) in enumerate(lists or LISTS[cn])],
            "notes": []}


print("the wrong joins it refuses")
base = lists_record()
new, notes = recon(copy.deepcopy(base), PAGES["18581"])
check(joined(new) is not None and len(notes) == 1, "the shaped record joins on the page's words (the control)")
for label, rec, text, award in (
        ("a page without the sentence", base, PAGES["18581"].replace(SENTENCE, "Complete the units"), AA),
        ("a sentence about another thing ('from a single discipline')", base,
         PAGES["18581"].replace("from a single Area of Emphasis", "from a single discipline"), AA),
        ("a transfer degree", base, PAGES["18581"], "A.A- T Degree"),
        ("a certificate", base, PAGES["18581"],
         "Certificate of Achievement requiring 16S/24Q to fewer than 30S/45Q units"),
        ("a record whose total is another figure", lists_record(total=21), PAGES["18581"], AA),
        ("an emphasis that prints one list", lists_record(lists=[("Courses", 18, 18)]), PAGES["18581"], AA),
        ("one list the pattern names beside one it does not",
         lists_record(lists=[("Arts: Minimum 3-4 units from this block", 3, 3), ("Electives", 3, 3)]),
         PAGES["18581"], AA),
        ("lists whose leasts sum past the figure",
         lists_record(lists=[("Arts: Minimum 3-4 units from this block", 10, 10),
                             ("Humanities: Minimum 3-5 units from this block", 9, 9)]), PAGES["18581"], AA)):
    new, notes = recon(copy.deepcopy(rec), text, award)
    check(not notes and new == rec, "refused: %s" % label)

print("the self-recall over every committed Santa Ana record")
EVERY = "I. Requirements:\n%s listed below.\n" % SENTENCE
read = joined_now = already_joined = 0
moved_verdict, joins = [], []
for path in sorted(glob.glob(os.path.join(FOLDER, "*.json"))):
    with open(path, encoding="utf-8") as fh:
        f = json.load(fh)
    rec = f.get("record")
    if not isinstance(rec, dict):
        continue
    read += 1
    cn = f.get("control_number")
    if joined(rec) is not None:
        already_joined += 1
        joins.append(cn)
        continue
    new, notes = recon(copy.deepcopy(rec), EVERY, f.get("award"), cn=cn)
    if any(n.get("now") == POOLED for n in notes):
        joined_now += 1
        joins.append(cn)
        before = S.passes_live(f.get("score"))
        after = C.fresh_score(dict(f, record=new))["arithmetic"].get("status") == "equal"
        if before and not after:
            moved_verdict.append(cn)
    else:
        check(not any(n.get("field") == "blocks" for n in notes), "%s: the entry changes no other record's lists" % cn)
check(read >= 340, "the recall read the college's records (%d)" % read)
check(sorted(joins) == ["18581", "18582", "19268"],
      "with the sentence on every page, the step joins the three emphases alone: %s" % sorted(joins))
check(joined_now + already_joined == 3, "each of the three is joined now or was joined by a filed reconcile")
check(not moved_verdict, "no passing record turns failing: %s" % moved_verdict)
for cn in ("18580", "18583", "18584"):
    f = filed(cn)
    new, notes = recon(copy.deepcopy(f["record"]), PAGES["18581"], cn=cn)
    check(not [n for n in notes if n.get("field") == "blocks"] and len(f["record"]["blocks"]) == 1
          and units(f["record"])[0] == [18.0, 18.0],
          "%s: an emphasis printed as one list of 18 stays as read" % cn)

print("%d checks, %d failures" % (checks[0], len(failures)))
for m in failures:
    print("FAIL:", m)
sys.exit(1 if failures else 0)
