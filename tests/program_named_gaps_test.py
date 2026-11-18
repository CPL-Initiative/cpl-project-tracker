#!/usr/bin/env python3
"""A record that fails a check is collected with its gap named and scored, and the census counts it collected.

WHY. Sam, 2026-11-17 (relayed by COBIx on #3358): never drop a record for failing; collect it with gaps noted
and confidence scores. kb/_program_named_gaps.py names the gap (score.gaps, checks.gaps) and scores it
(score.confidence, checks.confidence); kb/_harvest_gap_census.py counts the row collected. A rule that named a
gap on a record that passes, or a census that counted a named gap whose coverage fails, would hide real work.
Pinned on fixtures:

  * a local degree the overlap ruling would pass but for a major whose check fails is collected, unit arithmetic
    30; a major that matches exactly, or passes on another reading, is never flagged;
  * a required course with no units names no_units_read (20), unless the notes say the requirements list or table
    is missing or cut off; no_units_printed is off, its note matcher failing its self-recall; a record failing
    for another reason too takes neither; the words name four courses and how many more;
  * the rules against the held answer on every failing record (the receipt's 1,938, right 1,938, wrong 0);
  * each new matcher's self-recall on held answers (noncredit awards; required courses that carry units);
  * the live row ends as the college load posts the committed record (load_rows carries checks.gaps);
  * the census takes a row with checks.gaps out of the gap only when coverage and invented pass;
  * the guarded UPDATE adds the keys only where the run, the arithmetic and the absence of gaps still hold,
    and the rollback removes only what it wrote;
  * the rollback is rebuilt from the rows the apply returned (run 44273638344): it names exactly those 75, each
    with its before-image checks, and a rollback built from fewer returned rows names fewer (Rule 10 a2);
  * the collection lane's colleges are left out.

Run from repo root: python3 tests/program_named_gaps_test.py
"""
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_named_gaps as NG  # noqa: E402
import _harvest_gap_census as G  # noqa: E402
import collection_lane as CL  # noqa: E402

checks, failures = [0], []


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


def local_degree(major_computed, major_stated):
    arith = {"pass": False, "status": "unequal", "against": "degree", "computed": [63.0, 63.0],
             "stated": [60.0, 60.0], "ge": [21.0, 21.0],
             "major": {"pass": major_computed == major_stated, "status": "equal" if major_computed == major_stated
                       else "unequal", "computed": major_computed, "stated": major_stated}}
    return {"college": "Butte College", "control_number": "1", "award": "A.S. Degree", "extracted_run": "9",
            "record": {"program": {"degree_total": {"min": 60, "max": 60}, "ge_units": {"min": 21, "max": 21}}},
            "score": {"coverage": {"pass": True, "share": 0.9}, "invented": {"pass": True}, "arithmetic": arith}}


f = local_degree([42.0, 42.0], [40.0, 40.0])
check(NG.judge(f) and NG.judge(f)[0] == "major_total_differs", "a major that differs names the gap")
# A major that passes on another reading than plain equality (Alameda 01118, Glendale 02587): the degree fails for
# another reason, so the major is not the gap (S680 second reader, F2).
f3 = local_degree([42.0, 42.0], [40.0, 40.0])
f3["score"]["arithmetic"]["major"].update({"pass": True, "status": "equal", "tolerance": True})
check(NG.judge(f3) is None, "a major whose check passes on another reading is never major_total_differs")
check(NG.confidence(f, "major_total_differs")["unit_arithmetic"] == 30, "unit arithmetic scores 30")
check(NG.confidence(f, "major_total_differs")["course_list_match"] == 90, "course-list match is the placed share")
check(NG.judge(local_degree([42.0, 42.0], [42.0, 42.0])) is None, "an exact major is never flagged")
f2 = local_degree([42.0, 42.0], [40.0, 40.0])
f2["score"]["coverage"]["pass"] = False
check(NG.judge(f2) is None, "a record whose coverage fails takes no gap")


def no_units(notes, extra_why=()):
    return {"college": "Butte College", "control_number": "2", "award": "Certificate of Achievement", "extracted_run": "9",
            "record": {"notes": notes, "program": {"total_units": {"min": 12, "max": 12}},
                       "blocks": [{"name": "Required", "rule": "all", "courses": [{"code": "EMED 135"}, {"code": "EMED 101", "units": 6}]}]},
            "score": {"coverage": {"pass": True, "share": 1.0}, "invented": {"pass": True},
                      "arithmetic": {"pass": False, "status": "incomplete",
                                     "why": ["a required course in 'Required' has no units"] + list(extra_why)}}}


check(not NG.NO_UNITS_PRINTED_ON and NG.judge(no_units(["EMED 135 is printed with no units."]))[0] == "no_units_read",
      "no_units_printed is off: a note saying the catalog prints none still names no_units_read")
check(NG.judge(no_units([]))[0] == "no_units_read", "otherwise no_units_read")
# An incomplete read is not this gap (S680 second reader, F1): the notes of Butte 14583 and West Los Angeles 42627.
check(NG.judge(no_units(["The Required Courses list is cut off mid-entry after 'VOC ED 411CE Vocational English as a'; "
                         "its hours and any further courses are not recorded."])) is None,
      "a requirements list cut off takes no gap")
check(NG.judge(no_units(["The catalog text is cut off mid-sentence in the admission point system (Healthcare Experience); "
                         "the program's course requirements table, any unit totals, and any program learning outcomes "
                         "are not in the provided text."])) is None, "a requirements table not in the text takes no gap")
check(NG.judge(no_units(["The Career Opportunities list is cut off at 'Community Health N'."]))[0] == "no_units_read",
      "a cut-off career list is not an incomplete requirements read")
check(NG.judge(no_units(["The text is cut off partway through the Program Learning Outcomes; any further outcomes and a "
                         "requirements table may follow in the full page."]))[0] == "no_units_read",
      "a page cut off elsewhere is not a requirements list cut off (Taft 31290)")
check(NG.judge(no_units([], ["'Electives' chooses courses but names no minimum"])) is None,
      "a record failing for another reason too takes neither")
# The words list four courses and say how many more.
many = no_units([])
many["record"]["blocks"][0]["courses"] = [{"code": "ESL %d" % i} for i in range(6)]
check("ESL 3 and 2 more" in NG.judge(many)[1], "the words name four courses and how many more")
check("and" not in NG._listed(["A", "B"]) and NG._listed(list("ABCDE")) == "A, B, C, D and 1 more", "the list words")
# F4: the gap's stable name rides on the record and the row; its sentence is GAPS[name].
check(all(k.isidentifier() for k in NG.GAPS), "gap names are short stable keys")

# The census counts a named gap collected only with coverage and invented passing.
check(G.collected_with_gaps({"coverage": True, "invented": True, "arithmetic": "unequal", "gaps": ["x"]}) == ["x"],
      "a row with checks.gaps is collected")
check(not G.collected_with_gaps({"coverage": False, "invented": True, "arithmetic": "unequal", "gaps": ["x"]}),
      "not when coverage fails")
check(not G.collected_with_gaps({"coverage": True, "invented": True, "arithmetic": "unequal"}), "not without gaps")
check(G.flat_checks({"coverage": {"pass": True}, "invented": {"pass": True}, "arithmetic": {"status": "unequal"},
                     "gaps": [{"gap": "no_units_read", "label": NG.GAPS["no_units_read"]}]})["gaps"] == ["no_units_read"],
      "a filed score's gaps reach the flat checks by name")

# The SQL guards (kb/_guarded_sql.py, the shape #3496's review settled).
row = {"i": 1, "college": "O'Neill College", "control_number": "1", "extracted_run": "9",
       "before_image": {"record": {"a": 1}, "checks": {"arithmetic": "unequal"}},
       "after_image": {"checks": {"arithmetic": "unequal", "gaps": ["x"]}}}
up, rb, pre = NG.update_sql([row]), NG.rollback_sql([row]), NG.pre_read_sql([row])
check("r.extracted_run = v.extracted_run" in up and "r.checks = v.before_checks" in up and "r.record = v.before_record" in up
      and "r.checked is not true" in up and "e(expect) as (values (1))" in up and "::int::text::json" in up,
      "the UPDATE is guarded on run, the before-image and a person's check, and aborts off its count")
check("r.checks = v.after_checks" in rb and "r.checked is not true" in rb and "A partial rollback" in rb,
      "the rollback takes back only the after-image, skips a checked row, and aborts off its count")
check("O''Neill" in up and pre.startswith("with v(") and "json_build_object" in pre, "quoting and one JSON value")

# Self-recall of the new matchers on held answers, from the committed files.
import glob  # noqa: E402
import json  # noqa: E402
files, every = [], []
for p_ in glob.glob(os.path.join(ROOT, "kb", "program_requirements_college", "*", "records", "*.json")):
    with open(p_, encoding="utf-8") as fh:
        d = json.load(fh)
    if isinstance(d.get("score"), dict):
        every.append(d)
        if not CL.held(d.get("college")):
            files.append(d)
# The record rules against the held answer on every failing record that coverage and invented pass (F3): the
# second reader's count, 1,938 right and 0 wrong, with Butte 14583 and West Los Angeles 42627 held as no gap.
rc_ = NG.recall(every)
check(rc_["held"] > 0 and rc_["right"] == rc_["held"] and rc_["wrong"] == 0,
      "the recall on failing records whose answer is held: %s" % {k: rc_[k] for k in ("held", "right", "wrong")})
check(not any(NG.answer(d) for d in every if (d["college"], str(d["control_number"])) in NG.HELD_INCOMPLETE),
      "the reader's two incomplete reads take no gap")
print("recall: %(held)d failing records held, right %(right)d, wrong %(wrong)d" % rc_)
mr = NG.matcher_recall(files)
check(mr["noncredit"]["wrong"] == 0 and mr["noncredit"]["missed"] == 0,
      "NONCREDIT against the state's award: %s" % mr["noncredit"])
check(mr["printed_no_units"]["wrong"] > 0 and not NG.NO_UNITS_PRINTED_ON,
      "PRINTED_NO_UNITS fails its self-recall (%s), so its rule stays off" % mr["printed_no_units"])
print("matcher recall: noncredit %(held)d held, right %(right)d, wrong %(wrong)d, missed %(missed)d" % mr["noncredit"]
      + "; printed_no_units %(held)d held, right %(right)d, wrong %(wrong)d (rule off)" % mr["printed_no_units"])

# The live row ends as the college load posts the committed record.
RECEIPT = os.path.join(ROOT, "kb", "receipts", "program_requirement_records_named_gaps_2026-11-18_s680.json")
if os.path.isfile(RECEIPT):
    import _program_requirements_college as C  # noqa: E402
    with open(RECEIPT, encoding="utf-8") as fh:
        rc = json.load(fh)
    imgs = {}
    for college in sorted({r["college"] for r in rc["records"]}):
        for r in C.load_rows(college)[0]:
            imgs[(college, str(r["control_number"]))] = r
    same = sum(1 for r in rc["records"] if imgs.get((r["college"], str(r["control_number"])), {}).get("checks")
               == r["after_image"]["checks"] and imgs[(r["college"], str(r["control_number"]))]["record"]
               == r["before_image"]["record"])
    check(same == len(rc["records"]), "the load posts the after-image for %d of %d rows" % (same, len(rc["records"])))
    check(all(r["after_image"]["checks"].get("gaps") and r["before_image"]["checks"].get("gaps") is None
              for r in rc["records"]), "every row gains its gap and had none")
    check(not any(CL.held(r["college"]) for r in rc["records"]), "no collection-lane college in the plan")
    check(len(rc["records"]) == 75 and rc["by_gap"] == {"no_units_read": 75}
          and all(r["after_image"]["checks"]["gaps"] == ["no_units_read"] for r in rc["records"]),
          "the plan is 75 rows, all no_units_read, stored by name")
    held_out = {("Butte College", "14583"), ("West Los Angeles College", "42627"), ("College of Alameda", "01118"),
                ("Glendale Community College", "02587")}
    check(not held_out & {(r["college"], str(r["control_number"])) for r in rc["records"]},
          "the four rows the second reader held are out of the plan")
    check(rc["recall"]["held"] == 1938 and rc["recall"]["right"] == 1938 and rc["recall"]["wrong"] == 0,
          "the receipt's recall: 1,938 held, right 1,938, wrong 0")
    with open(os.path.join(ROOT, "kb", "migrations", "2026-11-18_s680_prreq_named_gaps_rollback.sql"),
              encoding="utf-8") as fh:
        rollback_text = fh.read()
    check("lasts only until the next load" in rollback_text[:4000], "the rollback says how long it lasts")

    # Rule 10 (a2): the rollback is rebuilt from the rows the apply returned, and names exactly those rows.
    import hashlib  # noqa: E402
    import re  # noqa: E402
    import _program_requirements_rescore as RS  # noqa: E402
    MIGRATE = os.path.join(ROOT, "kb", "receipts", "migration_s680_prreq_named_gaps_apply_44273638344.json")
    APPLY = os.path.join(ROOT, "kb", "migrations", "2026-11-18_s680_prreq_named_gaps_apply.sql")
    with open(MIGRATE, encoding="utf-8") as fh:
        mig = json.load(fh)
    with open(APPLY, "rb") as fh:
        apply_bytes = fh.read()
    check(hashlib.sha256(apply_bytes).hexdigest() == mig["sha256"],
          "the committed apply is the file the runner applied (its sha256 is the migrate receipt's)")
    check(NG.update_sql(rc["records"]) == rc["apply"] and rc["apply"] in apply_bytes.decode("utf-8"),
          "the applied guard matched on the receipt's before-images (the apply rebuilds from the receipt's rows)")
    got = RS.returned_value(mig)
    returned = sorted(got["keys"])
    check(len(returned) == 75 and len(set(returned)) == 75 and not got.get("skipped_checked"),
          "the apply returned 75 places, none twice, none skipped as checked")
    applied = rc.get("applied") or {}
    check(applied.get("keys") == returned and applied.get("returned") == 75
          and applied.get("from") == "kb/receipts/migration_s680_prreq_named_gaps_apply_44273638344.json",
          "the receipt marks the returned rows applied, from the migrate receipt")
    row_re = re.compile(r"^  \((\d+), '((?:[^']|'')*)', '((?:[^']|'')*)', (\d+), '((?:[^']|'')*)'::jsonb, "
                        r"'((?:[^']|'')*)'::jsonb, '((?:[^']|'')*)'::jsonb\)", re.M)
    named = [(int(m.group(1)), m.group(2).replace("''", "'"), m.group(3), int(m.group(4)),
              json.loads(m.group(6).replace("''", "'")), json.loads(m.group(7).replace("''", "'")))
             for m in row_re.finditer(rollback_text)]
    by_i = {r["i"]: r for r in rc["records"]}
    want = {(i, by_i[i]["college"], str(by_i[i]["control_number"])) for i in returned}
    have = {(i, c, n) for i, c, n, _, _, _ in named}
    check(len(named) == 75 and have == want,
          "the rollback names exactly the 75 returned rows (missing %d, extra %d)" % (len(want - have), len(have - want)))
    check(all(b == by_i[i]["before_image"]["checks"] and a == by_i[i]["after_image"]["checks"]
              and run == int(by_i[i]["extracted_run"]) for i, _, _, run, b, a in named),
          "each rollback row restores its before-image checks from its after-image, on its filed run")
    check("e(expect) as (values (75))" in rollback_text and "set checks = v.before_checks" in rollback_text
          and "r.checks = v.after_checks" in rollback_text and "r.checked is not true" in rollback_text,
          "the rollback is the guarded shape: count 75, before from after, a person's check skipped")
    with open(os.path.join(ROOT, "kb", "migrations", ".apply"), encoding="utf-8") as fh:
        check("named_gaps_rollback" not in fh.read(), "the rollback is committed, not applied")
    # The failure mode: a rollback built from the plan, not from what the apply returned.
    short = {"response": json.dumps([{"returned": {"returned": 74, "keys": returned[1:], "skipped_checked": []}}])}
    trial = NG.replan_applied(json.loads(json.dumps(rc)), short, "trial")
    check("e(expect) as (values (74))" in trial["rollback"]
          and "(%d, %s" % (returned[0], NG._q(by_i[returned[0]]["college"])) not in trial["rollback"],
          "a rollback rebuilt from 74 returned rows names 74 and leaves the unreturned row out")
    stray = {"response": json.dumps([{"returned": {"returned": 1, "keys": [999], "skipped_checked": []}}])}
    try:
        NG.replan_applied(json.loads(json.dumps(rc)), stray, "trial")
        check(False, "a returned place outside the plan is refused")
    except ValueError:
        check(True, "")
    print("rollback: %d rows named, the %d the apply returned" % (len(named), len(returned)))

check(CL.held("Chabot College") and not CL.held("Butte College"), "the collection lane's colleges are held")

if failures:
    for m in failures:
        print("FAIL:", m)
    sys.exit(1)
print("%d/%d checks passed: program named gaps" % (checks[0], checks[0]))
