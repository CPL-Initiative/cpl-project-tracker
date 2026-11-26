"""LACCD's class schedule search, read for local subject titles (S736; kb/_laccd_schedule_subjects.py).

WHAT THIS GUARDS (the likely failure: a schedule title quietly taking the place of a title a person or the catalog set):
  (1) the lookup's log parses into code -> title, folded lines or not; a code printed under two titles is held out;
  (2) a college's find carries only codes the college holds, each with its own campus's search address;
  (3) a heading already filed (the catalog's, or one a person set) stands: the schedule title is counted, never filed
      over it; an untitled code takes the schedule's title with rule "schedule";
  (4) schedule rows never mark the record as the catalog's whole index, so a code still untitled stays "not read"
      rather than "not in the catalog", and the build names the class schedule as the title's source.
Run from repo root: `python3 tests/laccd_schedule_subjects_test.py`.
"""
import json
import os
import sys
import tempfile

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "kb"))
import _laccd_schedule_subjects as L  # noqa: E402
import _file_found_subject_titles as F  # noqa: E402
import _build_local_subject_titles as B  # noqa: E402

results = []


def check(name, cond, why=""):
    results.append((name, bool(cond), why))


LOG = """read\tRead\t2026-11-26T17:40:01.1Z ##### PAGE 2 · answers: subjects · submitted from page 1
read\tRead\t2026-11-26T17:40:01.1Z --- text (whole page) ---
read\tRead\t2026-11-26T17:40:01.1Z · 0 · 1 · Select a Subject · A S L · American Sign Language · Select · ACCTG · Accounting · Select
read\tRead\t2026-11-26T17:40:01.1Z CH DEV · Child Development · Select · ODD · Odd Studies · Select
read\tRead\t2026-11-26T17:40:01.1Z OLD ADL
read\tRead\t2026-11-26T17:40:01.1Z Older Adults and the Long Course Title That Runs Past The Fold Width
read\tRead\t2026-11-26T17:40:01.1Z Select · Close
read\tRead\t2026-11-26T17:40:02.1Z ##### PAGE 3 · answers: subjects · submitted from page 1
read\tRead\t2026-11-26T17:40:02.1Z Select a Subject · ODD · Even Studies · Select · Close
read\tRead\t2026-11-26T17:40:02.1Z === COLLEGE PAGE READ JSON BEGIN ===
"""

pairs = L.lookup_pairs(L.log_lines(LOG))
table = L.district_table(pairs)
check("(1) the lookup parses, a long title on its own line included",
      table.get("ASL") == ("A S L", "American Sign Language") and table.get("CHDEV") == ("CH DEV", "Child Development")
      and table["OLDADL"][1].startswith("Older Adults"), json.dumps(pairs))
check("(1) a code under two titles is held out", table.get("ODD", "x") is None, json.dumps(table.get("ODD")))

codes = {"los_angeles_pierce": ["OLD ADL", "ACCTG", "ODD", "NOPE"], "los_angeles_valley": ["CH DEV"]}
out = L.finds(table, codes, "999", "2026-11-26")
p = {t["code"]: t for t in out["los_angeles_pierce"]["titles"]}
check("(2) only codes the college holds, never a split code", sorted(p) == ["ACCTG", "OLD ADL"], sorted(p))
check("(2) each title's source is its campus's search for the code",
      "Campus=LAPC" in p["OLD ADL"]["url"] and "subj=OLD%20ADL" in p["OLD ADL"]["url"]
      and "Campus=LAVC" in out["los_angeles_valley"]["titles"][0]["url"] and p["ACCTG"]["rule"] == "schedule"
      and p["ACCTG"]["where"] == "class schedule", json.dumps(p["OLD ADL"]))
check("(2) a college with nothing found says so", out["east_los_angeles"]["not_read"] and not out["east_los_angeles"]["titles"])

with tempfile.TemporaryDirectory() as root:
    F.SUBJECTS = os.path.join(root, "kb", "hand_filed_catalogs", "subjects")
    os.makedirs(F.SUBJECTS)
    with open(os.path.join(F.SUBJECTS, "los_angeles_pierce.json"), "w", encoding="utf-8") as f:
        json.dump({"college": "Los Angeles Pierce College", "rows": [
            {"code": "ACCTG", "heading": "Accounting and Bookkeeping", "rule": "named", "found_by": "Sam Lee"},
            {"code": "OLD ADL", "heading": None, "rule": None}]}, f)
    r = F.file_doc("los_angeles_pierce", out["los_angeles_pierce"], False)
    with open(os.path.join(F.SUBJECTS, "los_angeles_pierce.json"), encoding="utf-8") as f:
        rows = {x["code"]: x for x in json.load(f)["rows"]}
    check("(3) a heading a person filed stands; the schedule's differs and is counted",
          rows["ACCTG"]["heading"] == "Accounting and Bookkeeping" and rows["ACCTG"]["found_by"] == "Sam Lee"
          and r["differ"] == 1, json.dumps(r))
    check("(3) an untitled code takes the schedule's title, marked as the schedule's",
          (rows["OLD ADL"].get("heading") or "").startswith("Older Adults") and rows["OLD ADL"]["rule"] == "schedule"
          and rows["OLD ADL"]["where"] == "class schedule" and r["added"] == 1, json.dumps(rows["OLD ADL"]))
    r = F.file_doc("los_angeles_valley", {"college": "Los Angeles Valley College", "run": "999", "titles": [
        {"code": "ART", "title": "Art", "url": "u", "rule": "schedule"}, {"code": "MUSIC", "title": "Music", "url": "u"}]}, False)
    with open(os.path.join(F.SUBJECTS, "los_angeles_valley.json"), encoding="utf-8") as f:
        rows = {x["code"]: x for x in json.load(f)["rows"]}
    check("(3) a schedule title that spells its code (ART, Art) files; a catalog heading that does is still held out",
          rows.get("ART", {}).get("heading") == "Art" and "MUSIC" not in rows and r["skipped"] == 1, json.dumps(r))
    subj = B.read_subjects(root, "los_angeles_pierce")
    check("(4) schedule rows never read as the catalog's whole index", subj is not None and subj["index"] is False, subj and subj["index"])

with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "kb", "_build_local_subject_titles.py"), encoding="utf-8") as f:
    src = f.read()
check("(4) the build names the class schedule as a title's source", '"schedule": "the college\'s class schedule"' in src)

fail = 0
for n, ok, why in results:
    print(("PASS " if ok else "FAIL ") + n + ("" if ok else "\n     " + str(why)))
    fail += 0 if ok else 1
print("%d/%d checks passed" % (len(results) - fail, len(results)))
sys.exit(1 if fail else 0)
