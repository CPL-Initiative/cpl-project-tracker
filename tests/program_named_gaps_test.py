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
  * the collection lane's colleges are left out, each plan judged against the held list frozen in its receipt;
  * COBIx's four findings on #3497: no_hours_read on an hours program, GE None with no degree total, course-list
    match capped at 50 where a note says the list may continue, the 60 source score named;
  * the S681 plan, one plan in three parts: A the S680 apply's rows to the corrected values (guarded on the image
    S680 wrote), B #3502's catalog rows that meet their gap's sentence (the 16 no-units rows and the failing ones
    held out), C units rule A5's five with 56 and its note; each file names exactly the plan's rows, and a part B
    or C row at a held college fails;
  * a row a later reread replaced from this plan's after-image (its reread receipt's before-image holds the checks
    the plan wrote) is the reread's: the load checks skip it and part B keeps it as planned, at most a few rows.

Run from repo root: python3 tests/program_named_gaps_test.py
"""
import collections
import os
import re
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


def reread_later(rows, image="after_image"):
    """The plan rows a later reread replaced (kb/receipts/program_requirement_records_college_reread_*.json): the
    reread names the row in replaced_keys and its before-image holds the checks this plan wrote, so the plan's write
    landed first and the reread's record is the live one (S683: Santa Rosa Junior 44788 and City College of San
    Francisco 16991 and 41049, reread at 08:24Z and 08:28Z after the S681 apply at 08:11Z). Those rows are judged by
    the reread's own test (tests/program_reread_keep_better_test.py), never against this plan's after-image."""
    import glob
    import json as _json
    want = {(r["college"], str(r["control_number"])): r[image]["checks"] for r in rows}
    out = set()
    for p in sorted(glob.glob(os.path.join(ROOT, "kb", "receipts", "program_requirement_records_college_reread_*.json"))):
        with open(p, encoding="utf-8") as fh:
            rr = _json.load(fh)
        replaced = {str(k) for k in rr.get("replaced_keys") or []}
        for b in rr.get("before") or []:
            k = (rr.get("college"), str(b.get("control_number")))
            if k[1] in replaced and k in want and b.get("checks") == want[k]:
                out.add(k)
    return out


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
    # S681's part A rewrote most of these rows' scores: there the load posts S681's after-image, elsewhere S680's.
    R681 = os.path.join(ROOT, "kb", "receipts", "program_requirement_records_named_gaps_2026-11-18_s681.json")
    with open(R681, encoding="utf-8") as fh:
        rc681 = json.load(fh)
    a681 = {(r["college"], str(r["control_number"])): r for r in rc681["records"] if r["part"] == "A"}
    # A row a later reread replaced from S681's after-image is the reread's now (reread_later).
    later680 = reread_later([a681.get((r["college"], str(r["control_number"]))) or r for r in rc["records"]])
    same = sum(1 for r in rc["records"] if (r["college"], str(r["control_number"])) not in later680
               and imgs.get((r["college"], str(r["control_number"])), {}).get("checks")
               == (a681.get((r["college"], str(r["control_number"]))) or r)["after_image"]["checks"]
               and imgs[(r["college"], str(r["control_number"]))]["record"] == r["before_image"]["record"])
    check(same == len(rc["records"]) - len(later680), "the load posts the latest after-image for %d of %d rows (%d reread later)"
          % (same, len(rc["records"]) - len(later680), len(later680)))
    print("S680 rows a later reread replaced: %d" % len(later680))
    check(all(r["after_image"]["checks"].get("gaps") and r["before_image"]["checks"].get("gaps") is None
              for r in rc["records"]), "every row gains its gap and had none")
    # Each plan is judged against the held list it ran under, frozen in its receipt: kb/collection_lane.py moves.
    check(len(rc["held_colleges"]) == 12 and not any(r["college"] in set(rc["held_colleges"]) for r in rc["records"]),
          "no college the S680 plan held (its receipt's frozen twelve) is in the plan")
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

# ── COBIx's four findings on #3497, on fixtures ───────────────────────────
hrs = no_units([])
hrs["record"]["program"]["measure"] = "hours"
check(NG.judge(hrs)[0] == "no_hours_read" and "no hours" in NG.judge(hrs)[1] and "units" not in NG.judge(hrs)[1],
      "finding 1: a program measured in hours names no_hours_read, in hours")
check(NG.judge(no_units([]))[0] == "no_units_read", "finding 1: a units program keeps no_units_read")
check(NG.GAPS["no_hours_read"] == "A required course carries no hours as read, so the program's hours cannot be added.",
      "finding 1: the hours sentence")
check(NG.confidence(no_units([]), "no_units_read")["ge_pattern"] is None,
      "finding 2: no degree total, so general education does not apply (None, never 100)")
check(NG.confidence(f, "major_total_differs")["ge_pattern"] == 100, "finding 2: a degree with its GE units scores 100")
# Finding 3 (the S681 second reader): an explicit list of reviewed records, each with its note's words; no matcher.
cont = no_units(["The text is cut off partway through the outcomes; a requirements table may follow in the full page."])
check(NG.confidence(cont, "no_units_read")["course_list_match"] == 100,
      "finding 3: a record off the reviewed list is not capped, whatever its note says")
taft = no_units([NG.MAY_CONTINUE_REVIEWED[("Taft College", "31290")]])
taft.update({"college": "Taft College", "control_number": "31290"})
check(NG.confidence(taft, "no_units_read")["course_list_match"] == 50, "finding 3: a reviewed record is capped at 50")
taft2 = dict(taft, record=dict(taft["record"], notes=["A different note."]))
check(NG.may_continue(taft2) is None, "finding 3: a reviewed record whose note no longer says so is not capped")
check(set(NG.MAY_CONTINUE_REVIEWED) == {("Fullerton College", "18166"), ("Santa Ana College", "34014"),
                                        ("Taft College", "31290")} and not hasattr(NG, "MAY_CONTINUE")
      and len(NG.MAY_CONTINUE_MISSES) == 5 and "held-answer test" in NG.MAY_CONTINUE_NEXT,
      "finding 3: the list is the three reviewed records, no matcher, and the next step names the five misses")
check(NG.confidence(no_units([]), "no_units_read", None)["source"] == 60 and "60" in NG.confidence.__doc__
      and "UNKNOWN_SOURCE" in NG.confidence.__doc__, "finding 4: an unknown or missing method scores 60, and says so")
touched = {(d.get("college"), str(d.get("control_number"))) for d in every if NG.may_continue(d)}
check(touched == set(NG.MAY_CONTINUE_REVIEWED),
      "finding 3: over every filed record the cap reaches exactly the three reviewed records (%d)" % len(touched))

# The catalog_figures_differ sentence on fixtures: a record meeting it, and the reader's failure (a required list
# with a course that carries no units).
def figs(courses_a, stated_a, computed, stated):
    return {"record": {"program": {}, "blocks": [
        {"name": "Required", "rule": "all", "stated": stated_a, "courses": courses_a},
        {"name": "Select one", "rule": "choose_courses", "minimum": 1, "stated": 3,
         "courses": [{"code": "X 1", "units": 3}, {"code": "X 2", "units": 4}]}]},
        "score": {"arithmetic": {"pass": False, "status": "unequal", "computed": computed, "stated": stated}}}


check(NG.figures_differ_fails(figs([{"code": "A 1", "units": 3}, {"code": "A 2", "units": 3}], 6, [9, 10], [8, 8]))
      is None, "a record whose lists match their figures and sum past the total meets the sentence")
check("carries no units" in (NG.figures_differ_fails(figs([{"code": "A 1", "units": 3}, {"code": "A 2"}], 6,
                                                          [9, 10], [8, 8])) or ""),
      "a required list with a course that carries no units fails the sentence")
check("adds to" in (NG.figures_differ_fails(figs([{"code": "A 1", "units": 3}, {"code": "A 2", "units": 4}], 6,
                                                   [10, 11], [8, 8])) or ""),
      "a required list that does not add to its figure fails the sentence")
check("past" in (NG.figures_differ_fails(figs([{"code": "A 1", "units": 3}, {"code": "A 2", "units": 3}], 6,
                                                [9, 10], [9, 10])) or ""), "lists that do not sum past the total fail")


# ── the S681 plan: one plan, three parts ──────────────────────────────────
HELD681 = set(rc681["held_colleges"])


def held_rows(rows):
    """The plan's part B and C rows at a college its receipt holds (the frozen list) or a parked one."""
    return [r for r in rows if r["part"] != "A" and (r["college"] in HELD681 or r["college"] in G.PARKED)]


rows681 = rc681["records"]
key = lambda r: (r["college"], str(r["control_number"]))  # noqa: E731
by_part = {p: {key(r) for r in rows681 if r["part"] == p} for p in "ABC"}
check(HELD681 == set(NG.HELD_S681) and len(HELD681) == 12 and "College of the Siskiyous" not in HELD681,
      "the receipt freezes the twelve held colleges: tonight's lane five and the released seven")
check(not held_rows(rows681), "no part B or C row of the plan is at a held college")
fake = [r for r in rows681 if r["part"] == "B"][0]
check(held_rows(rows681 + [dict(fake, college="Lassen College")])
      and held_rows([dict(fake, college="Golden West College")]),
      "a part B or C row at a held college fails this test (Lassen, Golden West)")
s680_keys = {key(r) for r in rc["records"]}
left_a = {(x["college"], x["control_number"]) for x in rc681["left_out"] + rc681["unchanged"] if x["part"] == "A"}
check(by_part["A"] | left_a == s680_keys and not by_part["A"] & left_a and len(by_part["A"]) == 73,
      "part A is every row the S680 apply wrote less the unchanged: %d" % len(by_part["A"]))
check(left_a == {("Hartnell College", "11803"), ("Oxnard College", "36569")} and not rc681["left_out"],
      "part A leaves only Hartnell 11803 and Oxnard 36569, whose live values are already the corrected ones")
s680_after = {key(r): r["after_image"]["checks"] for r in rc["records"]}
check(all(r["before_image"]["checks"] == s680_after[key(r)] for r in rows681 if r["part"] == "A"),
      "part A is guarded on the image the S680 apply wrote")
plan3502 = NG.planned()
check(len(plan3502) == 54 and collections.Counter(g for g, _ in plan3502.values())
      == {"catalog_figures_differ": 38, "no_units_printed": 16}, "#3502's plan names 54: 38 figures, 16 no units")
# Part B: every one of the 38 catalog rows checked against its gap's sentence in code; the 16 no-units rows held out.
filed_by_key = {(d.get("college"), str(d.get("control_number"))): d for d in every}
catalog = {k for k, (g, _) in plan3502.items() if g == "catalog_figures_differ"}
later681 = reread_later(rows681)
print("S681 rows a later reread replaced: %d" % len(later681))
# A part B row a later reread replaced was read against the record the plan saw; the filed record is the reread's.
meets = {k for k in catalog if (k in later681 and k in by_part["B"])
         or (k not in later681 and NG.figures_differ_fails(filed_by_key[k]) is None)}
want_b = {k for k in meets if k[0] not in HELD681}
check(by_part["B"] == want_b and len(want_b) == 21 and len(catalog) == 38,
      "part B is the 38 catalog rows that meet the sentence: %d (%d fail)" % (len(want_b), len(catalog - meets)))
held = {(x["college"], x["control_number"]): x for x in rc681["held_out"]}
check(set(held) == (set(plan3502) - want_b) and len(held) == 33
      and all(held[k]["why"] == NG.HOLD_NO_UNITS_PRINTED for k, (g, _) in plan3502.items() if g == "no_units_printed")
      and all(held[k]["why"].startswith("the record does not meet the gap's own sentence: ") for k in catalog - meets),
      "the receipt holds out the 16 no-units rows and the %d failing catalog rows, each with its reason" % len(catalog - meets))
check({("College of the Sequoias", "37744"), ("Cypress College", "39887"), ("Ventura College", "39961"),
       ("Victor Valley College", "40161")} <= set(held), "the second reader's four are held out")
check(not any(r["gap"] == "no_units_printed" for r in rows681), "no no_units_printed row is in the plan")
check(all(r["gap"] == plan3502[key(r)][0] for r in rows681 if r["part"] == "B"), "part B takes the plan's gap")
check(by_part["C"] == set(NG.A5_FIVE), "part C is units rule A5's five rows")
check(all(r["confidence"]["unit_arithmetic"] == 56 and r["gap"] is None
          and r["after_image"]["checks"].get("confidence_notes") == {"unit_arithmetic": NG.A5_NOTE}
          and "gaps" not in r["after_image"]["checks"] and r["after_image"]["checks"]["arithmetic"] == "equal"
          for r in rows681 if r["part"] == "C"), "part C: 56 and its note, passing, no gap")
hours_gap = [r for r in rows681 if r["gap"] in ("no_units_read", "no_hours_read")]
check(all((r["gap"] == "no_hours_read") == (r["before_image"]["record"]["program"].get("measure") == "hours")
          for r in hours_gap) and sum(r["gap"] == "no_hours_read" for r in hours_gap) == 52,
      "the hours label lands on exactly the hours-measured programs (52)")
filed_gaps = [(d, g["gap"]) for d in every for g in (d["score"].get("gaps") or []) if isinstance(g, dict)
              and g.get("gap") in ("no_units_read", "no_hours_read")]
check(filed_gaps and all((g == "no_hours_read") == NG.hours_measured(d) for d, g in filed_gaps),
      "every filed record: no_hours_read exactly where the program counts hours (%d)" % len(filed_gaps))
check(all(r["confidence"]["ge_pattern"] is None for r in rows681
          if NG.S._span(r["before_image"]["record"]["program"].get("degree_total")) is None),
      "no row with no degree total scores GE")
check(next(r for r in rows681 if key(r) == ("Taft College", "31290"))["confidence"]["course_list_match"] == 50,
      "Taft 31290's course-list match is capped at 50")
imgs681 = {}
for college in sorted({r["college"] for r in rows681}):
    for r in C.load_rows(college)[0]:
        imgs681[(college, str(r["control_number"]))] = r
check(all(imgs681[key(r)]["checks"] == r["after_image"]["checks"] and imgs681[key(r)]["record"]
          == r["before_image"]["record"] for r in rows681 if key(r) not in later681),
      "the load posts each plan row's after-image, record unchanged (less the %d a later reread replaced)" % len(later681))
check(later681 <= {key(r) for r in rows681} and len(later681) < 10,
      "a later reread replaced a few of the plan's rows, never a sweep: %d" % len(later681))
MIG = os.path.join(ROOT, "kb", "migrations", "2026-11-18_s681_prreq_named_gaps_")
texts = {}
for part in ("preread", "apply", "rollback"):
    with open(MIG + part + ".sql", encoding="utf-8") as fh:
        texts[part] = fh.read()
check(NG.update3_sql(rows681, "s681 named-gaps") == rc681["apply"] and rc681["apply"] in texts["apply"]
      and rc681["rollback"] in texts["rollback"] and rc681["pre_read"] in texts["preread"],
      "the three files are the receipt's SQL, rebuilt from its rows")
row3 = re.compile(r"^  \((\d+), '([ABC])', '((?:[^']|'')*)', '((?:[^']|'')*)', (\d+), ", re.M)
for part in ("preread", "apply", "rollback"):
    named3 = {(m.group(2), m.group(3).replace("''", "'"), m.group(4)) for m in row3.finditer(texts[part])}
    check(named3 == {(r["part"], r["college"], r["control_number"]) for r in rows681} and len(named3) == 99,
          "the %s names exactly the plan's 99 rows (A 73, B 21, C 5)" % part)
check("e(expect) as (values (99))" in texts["apply"] and "e(expect) as (values (99))" in texts["rollback"]
      and "This rollback runs first" in texts["rollback"][:4000]
      and "2026-11-18_s680_prreq_named_gaps_rollback.sql" in texts["rollback"][:4000]
      and "2026-11-18_s680_prreq_units_rules_rollback_rows.sql" in texts["rollback"][:4000],
      "the apply and rollback abort off 99, and the rollback names the undo order")
with open(os.path.join(ROOT, "kb", "migrations", ".apply"), encoding="utf-8") as fh:
    check("s681_prreq_named_gaps" not in fh.read(), "the S681 plan is committed, not applied")
print("S681 plan: A %d, B %d, C %d" % tuple(len(by_part[p]) for p in "ABC"))

# ── the S684 pass: the S683 wave's re-read records take their gap again ─────
R684 = os.path.join(ROOT, "kb", "receipts", "program_requirement_records_named_gaps_2026-11-19_s684.json")
with open(R684, encoding="utf-8") as fh:
    rc684 = json.load(fh)
rows684 = rc684["records"]
wave684 = NG.wave_runs(set(rc684["colleges"]))
check(len(rc684["colleges"]) == 15 and set(wave684) == set(rc684["colleges"]),
      "the S684 pass names the wave's fifteen colleges, each with its account")
check(rows684 and all(r["college"] in wave684 and str(r["extracted_run"]) in wave684[r["college"]] for r in rows684),
      "every S684 row is a record the S683 wave re-read, at its run")
check(not {key(r) for r in rows684} & {tuple(k) for k in rc684["checked_excluded"]}
      and ["West Los Angeles College", "17111"] in rc684["checked_excluded"],
      "no S684 row is a row a person checked (West Los Angeles's four are excluded)")
check(not set(rc684["colleges"]) & set(rc684["held_colleges"]) and len(rc684["held_colleges"]) == 15,
      "lane 2's fifteen colleges are held, none of them planned")
check(all(r["part"] == "A" and r["gap"] == NG.answer(dict(filed_by_key[key(r)], score={
          k: v for k, v in filed_by_key[key(r)]["score"].items() if k not in ("gaps", "confidence")}))[0]
          or r["part"] == "B" and r["gap"] == plan3502[key(r)][0] and NG.figures_differ_fails(filed_by_key[key(r)]) is None
          for r in rows684), "each S684 row's gap is its rule's (A) or #3502's plan's, meeting the sentence (B)")
check(all(filed_by_key[key(r)]["score"]["gaps"][0]["gap"] == r["gap"] for r in rows684),
      "each S684 record file carries its gap")
check(all(set(r["after_image"]["checks"]) - set(r["before_image"]["checks"]) == {"gaps", "confidence"}
          and {k: v for k, v in r["after_image"]["checks"].items() if k not in ("gaps", "confidence")}
          == r["before_image"]["checks"] for r in rows684), "the S684 apply adds gaps and confidence, nothing else")
check(all(x["wave_reread"] == (str(x["extracted_run"]) in wave684.get(x["college"], set())) for x in rc684["held_out"])
      and {(x["college"], x["control_number"]) for x in rc684["held_out"] if x["wave_reread"]}
      == {("City College of San Francisco", "16991"), ("Santa Rosa Junior College", "45486")},
      "each held-out row says whether the wave re-read it (two did: CCSF 16991, Santa Rosa 45486)")
MIG4 = os.path.join(ROOT, "kb", "migrations", "2026-11-19_s684_prreq_named_gaps_")
t4 = {}
for part in ("preread", "apply", "rollback"):
    with open(MIG4 + part + ".sql", encoding="utf-8") as fh:
        t4[part] = fh.read()
check(NG.update3_sql(rows684, "s684 named-gaps") == rc684["apply"] and rc684["apply"] in t4["apply"]
      and NG.rollback3_sql(rows684, "s684 named-gaps rollback") == rc684["rollback"]
      and rc684["rollback"] in t4["rollback"] and rc684["pre_read"] in t4["preread"]
      and "e(expect) as (values (%d))" % len(rows684) in t4["apply"],
      "the S684 files are the receipt's SQL, rebuilt from its rows")
with open(os.path.join(ROOT, "kb", "migrations", ".apply"), encoding="utf-8") as fh:
    check("s684_prreq_named_gaps" not in fh.read(), "the S684 plan is committed, not applied")
print("S684 pass: %d rows (%s)" % (len(rows684), ", ".join("%s %d" % kv for kv in sorted(rc684["by_gap"].items()))))

if failures:
    for m in failures:
        print("FAIL:", m)
    sys.exit(1)
print("%d/%d checks passed: program named gaps" % (checks[0], checks[0]))
