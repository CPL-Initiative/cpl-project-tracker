#!/usr/bin/env python3
"""A record's own heading against the program it is filed under, and a catalog that prints the number after.

WHY (S644). Santiago Canyon's 2026-2027 catalog PDF prints "Control Number: N" AFTER each program. The
PDF reader cut each page from the number's line, so a local degree's window opened on the transfer
degree printed next, and Economics AA 11943 and Sociology AA 11947 PASSED the machine checks holding
their AA-T's requirements (COBIx, #3194 comment 6841001207). Pinned here on small fixtures, never on
the committed or live files:

  * the scorer's heading_award_check names a transfer degree filed under a local degree, and the
    reverse, as its own failing reason; a heading naming no award, a generic heading and the model's
    note that the heading is not in its text never fail; a printed control number proves nothing;
  * the measure (kb/_program_requirements_heading_agreement.py) counts agree, disagree and cannot
    tell, says which disagreeing records pass, reads a window that opens on its own number line and
    then names another program as bound to the next program (`after`), and counts what the check
    would fail among passing records;
  * the reader (kb/_program_requirements_college.py) finds the habit in the catalog's own lines
    (pdf_numbers_after), binds each program to the block that ENDS at its number, and refuses a
    window another program's number closes; a catalog without the habit reads as before.

Run from repo root: python3 tests/program_requirements_heading_agreement_test.py
"""
import json
import os
import shutil
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_requirements_college as C  # noqa: E402
import _program_requirements_heading_agreement as H  # noqa: E402
import _program_requirements_score as S  # noqa: E402

checks, failures = [0], []


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


def rec(heading):
    return {"program": {"section_heading": heading}}


AA, AAT, AS, AST = "A.A. Degree", "A.A- T Degree", "A.S. Degree", "A.S. T Degree"
COA = "Certificate of Achievement requiring 16S/24Q to fewer than 30S/45Q units"

# ── 1. The scorer's check ───────────────────────────────────────────────────────────────────────
c = S.heading_award_check(rec("Economics, AA-T"), AA, "11943")
check(c["pass"] is False and c["status"] == "names_other_award" and c["kind"] == "transfer_under_local_degree",
      "a transfer degree's heading under a local degree fails with its own reason: %r" % c)
c = S.heading_award_check(rec("A.S. in Early Childhood Education"), AST, "32114")
check(not c["pass"] and c["kind"] == "local_degree_under_transfer", "and the reverse: %r" % c)
for heading, award in (("Economics, AA", AA), ("Sociology, AA-T", AAT), ("Associate in Arts in Psychology for Transfer", AAT),
                       ("Political Science - A.A.-Transfer", AAT), ("Physics Associate in Science Degree for UC Transfer", AST),
                       ("After School Program Associate Teacher, CA", COA), ("Degrees and Certificates - KINESIOLOGY", AAT),
                       ("Biology AS and AS-T", AS), ("Astronomy - AS.AST", AS)):
    c = S.heading_award_check(rec(heading), award, "1")
    check(c["pass"], "a heading naming its own award type passes: %r -> %r" % (heading, c))
for heading in ("Nursing", "Program Requirements", "", None,
                "Not in the text (only the Accounting A.S. degree section appears)",
                "No A.S. Degree section for Gemology in the text (only 'Gemology, CA' Certificate of Achievement)"):
    c = S.heading_award_check(rec(heading), AA, "1")
    check(c["pass"] and c["status"] in ("unstated", "heading_absent"),
          "a heading naming no award, or the model's note that it is absent, never fails: %r -> %r" % (heading, c))
c = S.heading_award_check(rec("Apprenticeship Electricity, Sound Installer, CA - Certificate of Achievement "
                              "(Control Number: 19588)"), AS, "19588")
check(not c["pass"] and c["kind"] == "certificate_under_local_degree",
      "the program's own number copied into the heading proves nothing (Santiago 19588 holds the certificate): %r" % c)
check(S.passes_live({"coverage": {"pass": True}, "invented": {"pass": True}, "arithmetic": {"status": "equal"}}),
      "passes_live is unchanged: the check is in no pass rule")

# ── 2. The measure, on a scratch college ───────────────────────────────────────────────────────
tmp = tempfile.mkdtemp()
try:
    col = os.path.join(tmp, "fixture_college")
    os.makedirs(os.path.join(col, "records"))
    ok_score = {"coverage": {"pass": True, "listed": 3, "placed": 3}, "invented": {"pass": True},
                "arithmetic": {"status": "equal", "pass": True}, "pass": True}
    bad_score = {"coverage": {"pass": True, "listed": 3, "placed": 3}, "invented": {"pass": True},
                 "arithmetic": {"status": "unequal", "pass": False}, "pass": False}
    rows = [("11943", "Economics", AA, "Economics, AA-T", ok_score),      # disagree, passes
            ("11856", "Biology", AS, "Biology, AS-T", bad_score),         # disagree, fails
            ("11866", "General Marketing", AS, "General Marketing, AS", ok_score),   # agree
            ("11933", "Chemistry", AS, "Program Requirements", ok_score),            # cannot tell
            ("11950", "Welding", COA, "Not in the text (only the Welding AS appears)", bad_score),  # cannot tell
            ("11960", "Welding Technology", AS, "Chemistry, AS", ok_score),          # disagree on title
            ("11970", "Surveying", AS, "Control Number: 21666", bad_score)]          # disagree on number
    sources = []
    for cn, title, award, heading, sc in rows:
        sources.append({"control_number": cn, "title": title, "award": award, "method": "pdf_pages"})
        with open(os.path.join(col, "records", cn + ".json"), "w") as f:
            json.dump({"control_number": cn, "title": title, "award": award,
                       "record": rec(heading), "score": sc}, f)
    sources.append({"control_number": "35110", "title": "Biology", "award": AST, "method": "pdf_pages"})
    sources.append({"control_number": "35111", "title": "Economics", "award": AAT, "method": "not_found"})
    with open(os.path.join(col, "sources.json"), "w") as f:
        json.dump(sources, f)
    with open(os.path.join(col, "capture.json"), "w") as f:
        json.dump({"college": "Fixture College", "platform": "pdf", "pdf": {"picks": [
            {"control_number": "11856", "cn_printed": True,
             "opens": "[page 89] Control Number: 11856 Biology, AS-T A.S. Degree for Transfer Unit Range 37"},
            {"control_number": "11943", "cn_printed": True,
             "opens": "[page 120] Control Number: 11943 Economics, AA-T A.A. Degree for Transfer Unit Range 18"},
            {"control_number": "11866", "cn_printed": True,
             "opens": "[page 124] General Marketing, AS (Control Number: 11866) Program Rules"},
            {"control_number": "11933", "cn_printed": True,
             "opens": "[page 93] (Control Number: 11933) This degree prepares students for transfer."}]}}, f)
    rep = H.build(os.path.join(tmp, "none"), [col + ":claude/fixture"])
    fx = rep["colleges"][0]
    check(fx["read_from"] == "claude/fixture" and fx["records"] == 7, "an --extra folder is read: %r" % fx["read_from"])
    check((fx["agree"], fx["disagree"], fx["cannot_tell"]) == (1, 4, 2),
          "agree, disagree, cannot tell: %r" % ((fx["agree"], fx["disagree"], fx["cannot_tell"]),))
    check(fx["disagree_passing"] == 2 and fx["by_reason"] == {"award": 2, "title": 1, "number": 1},
          "two disagreeing records pass, and each disagreement names its reason: %r %r"
          % (fx["disagree_passing"], fx["by_reason"]))
    check(fx["check_would_fail_passing"] == 1 and fx["check_would_fail_passing_transfer_local"] == 1,
          "the heading check would fail the one passing record whose heading names another award type: %r"
          % fx["check_would_fail_passing"])
    pos = fx["control_number_print"]["positions"]
    check(pos == {"after": 2, "at_heading": 1, "under_heading": 1} and fx["control_number_print"]["prints"] == "after",
          "a window opening on its own number line and then another program's heading reads as after; the number "
          "on the heading's line reads at the heading; a description after it reads under the heading: %r" % pos)
    check(fx["window_after"] == 2 and fx["window_after_passing"] == 1 and fx["suspect"] == 4,
          "records from a window bound to the next program are listed with the disagreements: %r"
          % ((fx["window_after"], fx["window_after_passing"], fx["suspect"]),))
    md = H.markdown(rep)
    check("Fixture College" in md and "| 2 (1) | 4 (2) |" in md, "the table carries the college and its windows")
finally:
    shutil.rmtree(tmp)

# ── 3. The reader: a catalog that prints the number after its program ────────────────────────────
BIO_AS = [{"code": c} for c in ("BIOL 211", "CHEM 200A", "CHEM 200B")]
BIO_AST = [{"code": c} for c in ("BIOL 211", "CHEM 200A", "MATH 180", "PHYS 150A")]
ECON_AA = [{"code": c} for c in ("ECON 120", "ECON 121", "MATH 219")]
PAGES = [
    "Credit Programs\nArt, AA\nA.A. Degree\nART 100 Drawing 3\nControl Number: 11800\n"
    "Biology, AS\nA.S. Degree\nUnit Range for Completion : 25.0 - 25.0\nBIOL 211 Cell Biology 4\nCHEM 200A General Chemistry 5\n",
    "Credit Programs\nCHEM 200B General Chemistry 5\nTotal 25\nControl Number: 11856\n"
    "Biology, AS-T\nA.S. Degree for Transfer\nUnit Range for Completion : 37.0 - 37.0\nBIOL 211 Cell Biology 4\n"
    "CHEM 200A General Chemistry 5\nMATH 180 Calculus 4\nPHYS 150A Physics 4\nControl Number: 35110\n"
    "Economics, AA\nA.A. Degree\nECON 120 Macroeconomics 3\nECON 121 Microeconomics 3\nMATH 219 Statistics 4\n"
    "Control Number: 11943\nEconomics, AA-T\nA.A. Degree for Transfer\nECON 120 Macroeconomics 3\n",
    "Credit Programs\nECON 121 Microeconomics 3\nMATH 219 Statistics 4\nControl Number: 35200\n",
]
PROGS = [{"control_number": "11800", "title": "Art", "award": AA},
         {"control_number": "11856", "title": "Biology", "award": AS},
         {"control_number": "35110", "title": "Biology", "award": AST},
         {"control_number": "11943", "title": "Economics", "award": AA},
         {"control_number": "35200", "title": "Economics", "award": AAT}]
votes = C.pdf_numbers_after(PAGES, PROGS)
check(votes["after_mode"] and votes["after"] >= 3 and votes["before"] == 0,
      "the catalog's own lines show the number printed after its program: %r" % votes)
old = C.pdf_best("https://x.edu/c.pdf", PAGES, PROGS[1], BIO_AS, "pypdf")
check(old and "Biology, AS-T" in old["text"],
      "without the habit read, the Biology A.S. window holds the AS-T printed after its number (the S644 misread)")
new = C.pdf_best("https://x.edu/c.pdf", PAGES, PROGS[1], BIO_AS, "pypdf", numbers_after=True)
check(new and new["pages"] == [1, 2] and new["coverage"] == 1.0 and "Biology, AS\nA.S. Degree" in new["text"]
      and "AS-T" not in new["text"] and "Art, AA" not in new["text"] and new["bound"] == "number_after",
      "the A.S. reads the block that ends at its own number, from the previous number line: %r"
      % ((new and (new["pages"], new["text"][:120])),))
ast = C.pdf_best("https://x.edu/c.pdf", PAGES, PROGS[2], BIO_AST, "pypdf", numbers_after=True)
check(ast and ast["pages"] == [2] and "Biology, AS-T" in ast["text"] and "Economics" not in ast["text"]
      and "Biology, AS\n" not in ast["text"], "the AS-T reads its own block: %r" % (ast and ast["text"][:160]))
econ = C.pdf_best("https://x.edu/c.pdf", PAGES, PROGS[3], ECON_AA, "pypdf", numbers_after=True)
check(econ and "Economics, AA\nA.A. Degree" in econ["text"] and "AA-T" not in econ["text"],
      "Economics AA reads its own block, never the AA-T after its number: %r" % (econ and econ["text"][:160]))
spanning = C.pdf_best("https://x.edu/c.pdf", PAGES, PROGS[4], ECON_AA, "pypdf", numbers_after=True)
check(spanning and spanning["pages"] == [2, 3] and spanning["text"].count("Economics, AA-T") == 1,
      "a block that runs onto the next page is read across it, back to the previous number: %r"
      % (spanning and spanning["pages"]))
# A program whose number the catalog does not print: its window is the one the picker finds, and the
# first number it prints closes another program's block, so it is refused, never handed over.
unprinted = {"control_number": "40000", "title": "Economics", "award": AA}
ref = C.pdf_best("https://x.edu/c.pdf", PAGES, unprinted, ECON_AA, "pypdf", numbers_after=True)
check(ref and ref.get("refused") and ref["coverage"] == 0.0 and not ref["text"],
      "a window another program's number closes is refused: %r" % (ref and ref.get("refused")))
# A catalog that prints the number at the heading keeps the reader as it was.
BEFORE = ["Programs\nControl Number: 11856\nBiology, AS\nA.S. Degree\nBIOL 211 Cell Biology 4\nCHEM 200A Chemistry 5\n"
          "CHEM 200B Chemistry 5\nControl Number: 35110\nBiology, AS-T\nA.S. Degree for Transfer\nBIOL 211 Cell 4\n"
          "Control Number: 11943\nEconomics, AA\nA.A. Degree\nECON 120 Macro 3\n"]
bv = C.pdf_numbers_after(BEFORE, PROGS)
check(not bv["after_mode"] and bv["before"] >= 3, "numbers printed at each heading read as before: %r" % bv)

if failures:
    print("FAIL: %d" % len(failures))
    for f in failures:
        print("  -", f)
    sys.exit(1)
print("ok: program requirements heading agreement (%d checks)" % checks[0])
