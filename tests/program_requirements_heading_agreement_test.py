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
  * the review's false alarms (S645 review of #3201): a COCI title's own words ("Chemistry for UC")
    are no award; a heading naming an award and none of the title's words (Pasadena) is set aside in
    its own bucket; Santa Rosa's clipped COCI titles still name their headings;
  * the snapshot reads only the files the tree commits, says its date, keeps a branch's folder out,
    and its --check fails once the tree moves.

The reader's gated after-reading is pinned in tests/program_requirements_pdf_numbers_after_test.py.

Run from repo root: python3 tests/program_requirements_heading_agreement_test.py
"""
import contextlib
import io
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

# ── 3. The review's false alarms (S645 review of #3201) ─────────────────────────────────────────
# Irvine Valley 44477 is COCI "Chemistry for UC", an A.S.: its title's words are the title, not a
# transfer degree (finding 14).
c = S.heading_award_check(rec("Chemistry for UC Transfer - A.S. Degree"), AS, "44477", "Chemistry for UC")
check(c["pass"] and c["status"] == "agrees", "a title naming 'for UC' is no transfer degree: %r" % c)
check(S.heading_award_types("Chemistry for UC Transfer - A.S. Degree") >= {"transfer"},
      "without the title the words still read as a transfer degree (the alarm this fixes)")
c = S.heading_award_check(rec("Mathematics 2.0 for Transfer"), AA, "46343", "Mathematics 2.0 for Transfer")
check(not c["pass"] and c["kind"] == "transfer_under_local_degree",
      "a title that names a type itself keeps it: %r" % c)
c = S.heading_award_check(rec("Economics, AA-T"), AA, "11943", "Economics")
check(not c["pass"] and c["kind"] == "transfer_under_local_degree", "the S644 misfile still fails with its title: %r" % c)
# Pasadena 03105: one page for the A.S. and its certificate; a heading naming the award and no title word
# goes to its own bucket, never a failure (finding 15).
c = S.heading_award_check(rec("Requirements for the Certificate of Achievement"), AS, "03105", "Architecture")
check(c["pass"] and c["status"] == "names_award_not_program" and c["kind"] == "certificate_under_local_degree"
      and c["why"], "an award-only heading is set aside with its reason: %r" % c)
c = S.heading_award_check(rec("Requirements for the Certificate of Achievement"), AS, "03105")
check(not c["pass"], "without the program's title the check cannot set it aside")
a = H.agreement(rec("Requirements for the Certificate of Achievement"), "Architecture", AS, "03105")
check(a["verdict"] == "cannot_tell" and a["reason"] == "award_not_program", "the measure buckets it: %r" % a)
# Santa Rosa's clipped COCI titles (finding 18).
for heading, title in (("Computer Studies: Network and Systems Security Administration", "CS Cybersecurity"),
                       ("Mechatronics: Industrial Maintenance Technician", "Mchtroncs:IndustrlMntnncTchncn")):
    check(not H.names_other_title(heading, title), "a clipped title names its heading: %r / %r" % (heading, title))
check(H.names_other_title("Chemistry", "Welding Technology"), "a heading naming another program still crosses")
check(H.names_other_title("Department of Biology", "Art"), "a short title is no abbreviation of the heading's words")

# ── 4. The snapshot reads the committed tree, and --check catches a stale one ───────────────────
tmp = tempfile.mkdtemp()
try:
    import subprocess
    repo = os.path.join(tmp, "repo")
    col = os.path.join(repo, "colleges", "fixture_college")
    os.makedirs(os.path.join(col, "records"))
    for cn, heading in (("11943", "Economics, AA-T"), ("11944", "Economics, AA")):
        with open(os.path.join(col, "records", cn + ".json"), "w") as f:
            json.dump({"control_number": cn, "record": rec(heading),
                       "score": {"coverage": {"pass": True}, "invented": {"pass": True},
                                 "arithmetic": {"status": "equal"}}}, f)
    with open(os.path.join(col, "sources.json"), "w") as f:
        json.dump([{"control_number": "11943", "title": "Economics", "award": AA},
                   {"control_number": "11944", "title": "Economics", "award": AA}], f)
    subprocess.run(["git", "init", "-q", repo], check=True)
    subprocess.run(["git", "-C", repo, "add", "colleges/fixture_college/sources.json",
                    "colleges/fixture_college/records/11943.json"], check=True)
    rep = H.build(os.path.join(repo, "colleges"))
    check(rep["totals"]["records"] == 1 and rep["totals"]["check_would_fail_passing"] == 1,
          "only the tracked record is read: %r" % rep["totals"])
    check(H.build(os.path.join(repo, "colleges"), tracked=False)["totals"]["records"] == 2,
          "and both without the tree's list")
    out_json, out_md = os.path.join(tmp, "a.json"), os.path.join(tmp, "a.md")
    root = os.path.join(repo, "colleges")
    with contextlib.redirect_stdout(io.StringIO()):
        H.main(["--root", root, "--out-json", out_json, "--out-md", out_md])
        fresh = H.main(["--root", root, "--out-json", out_json, "--out-md", out_md, "--check"])
        subprocess.run(["git", "-C", repo, "add", "colleges/fixture_college/records/11944.json"], check=True)
        stale = H.main(["--root", root, "--out-json", out_json, "--out-md", out_md, "--check"])
    check(fresh == 0 and stale == 1, "--check passes on a fresh snapshot and fails once the tree moves: %r"
          % ((fresh, stale),))
    md = open(out_md).read()
    check("A dated snapshot of main, as of" in md and "pass on the committed files" in md and "today" not in md,
          "the snapshot says it is dated and what 'pass' means")
    with contextlib.redirect_stdout(io.StringIO()):
        refused = H.main(["--extra", col + ":claude/x"])
    check(refused == 2, "an --extra folder never enters the committed snapshot")
finally:
    shutil.rmtree(tmp)

if failures:
    print("FAIL: %d" % len(failures))
    for f in failures:
        print("  -", f)
    sys.exit(1)
print("ok: program requirements heading agreement (%d checks)" % checks[0])
