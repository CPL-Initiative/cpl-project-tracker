#!/usr/bin/env python3
"""The lists_past_their_figure gap (S703, the catalog-wording lever): the catalog's figures, each list counted at the
figure it prints, add to its printed total, while a list's courses carry more units than that figure.

WHY. Sam, 2026-11-17 (relayed by COBIx on #3358): never drop a record for failing; collect it with gaps noted and
confidence scores. Santa Monica prints a figure over each list, its required core too (Psychology AA-T 36265:
"Required Core Course 9" over courses of 4, 3 and 3, three lists at 3 each, "18" printed; the courses add to 19).
S652's review rule: a new rule runs first against records whose answer is already held. Pinned here:

  * fixtures: the gap where the figures add to the total and a required or choose-courses list's courses pass its
    figure; none where the figures do not add to it, where the sum falls short, where a blank "or" alternative
    stands, or where a list prints no figure;
  * the self-recall on held answers: every passing record the scorer reproduces whose figures add to its total and
    one of whose lists its courses meet exactly; each such list's courses one unit more (the gap) and the total one
    more beside it (no gap), read by the scorer itself (wrong 0);
  * the boundary readings (#3678 and #3679 second readers, finding 2): the list half a unit past its figure (the
    gap), the total half a unit past the figures (no gap), and the list beside another list of its own courses that
    a note lets it take (no gap), each wrong 0;
  * the claim check (finding 1; decided d-lists-gap-holds-claim-false-s703): a record whose own words make the
    claim false takes no gap (a list that takes another list's courses and meets its figure with them, a second
    printed total the courses meet, a counted course that is optional or exempt, a note naming the course or list
    that makes up the difference, a sum inside a printed range); the 29 hand-held records (S703's 17, and the
    second reader's 12 on 5d3851de, decided d-lists-gap-holds-range-sums-s703 for six of them) are held by key,
    lists_claim flags 28 of them (all but Los Angeles Trade Technical 08479, held by key alone), and its counts on
    the census's records of the gap's shape are pinned;
  * the plain recall on every failing record stays wrong 0;
  * the s703w plan names only programs the committed census lists as units_unequal, none held out, and its
    pre-read, guarded UPDATE and rollback name exactly the plan's rows;
  * the colleges held from tonight's plan (lane 1's six, worker levers' five, worker peralta's four) and the parked
    colleges are untouched.

Run from repo root: python3 tests/program_lists_past_figure_s703_test.py
"""
import glob
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_named_gaps as NG  # noqa: E402
import _harvest_gap_census as G  # noqa: E402
import _program_requirements_college as C  # noqa: E402

checks, failures = [0], []


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


LANE_1_S703 = ("City College of San Francisco", "San Diego College of Continuing Education", "Clovis Community College",
               "Cosumnes River College", "Glendale Community College", "Butte College")
# Held by other workers tonight (S703 conductor): levers and peralta.
LEVERS_S703 = ("Ohlone College", "San Joaquin Delta College", "Mt. San Antonio College", "Santa Barbara City College",
               "Orange Coast College")
PERALTA_S703 = ("Berkeley City College", "College of Alameda", "Laney College", "Merritt College")
HELD_S703 = LANE_1_S703 + LEVERS_S703 + PERALTA_S703
GAP = "lists_past_their_figure"


def course(units, alts=()):
    return {"code": "X %s" % units, "units": units, "units_max": None,
            "alternatives": [{"code": "Y", "units": a} for a in alts]}


def psych(core=(4, 3, 3), core_figure=9, total=18, computed=None, alts=(), list_figure=3):
    blocks = [{"rule": "all", "name": "Required Core Course", "stated": {"min": core_figure, "max": core_figure},
               "courses": [course(u, alts if i == 0 else ()) for i, u in enumerate(core)]}]
    for name in ("LIST A", "LIST B", "LIST C"):
        blocks.append({"rule": "choose_courses", "name": name, "minimum": 1,
                       "stated": {"min": list_figure, "max": list_figure} if list_figure else None,
                       "courses": [course(3), course(4)]})
    comp = computed or [sum(core) + 9.0, sum(core) + 12.0]
    return {"college": "Example College", "control_number": "99999", "award": "A.A.-T Degree",
            "record": {"program": {"measure": "units"}, "blocks": blocks, "notes": []},
            "score": {"coverage": {"pass": True, "share": 1.0}, "invented": {"pass": True},
                      "arithmetic": {"pass": False, "status": "unequal", "computed": comp, "stated": [total, total],
                                     "against": "program",
                                     "why": ["the blocks sum to %s-%s; the catalog states %s-%s"
                                             % (comp[0], comp[1], total, total)]}}}


def named(f):
    return (NG.answer(f) or (None,))[0], NG.held_answer(f)


f = psych()
check(named(f) == (GAP, GAP), "Santa Monica's shape (9 + 3 + 3 + 3 printed, 18 total, courses 19) takes the gap")
check("Required Core Course" in NG.lists_past_their_figure(f) and "18" in NG.lists_past_their_figure(f),
      "the words name the list and the printed total")
check(NG.confidence(f, GAP)["unit_arithmetic"] == 60 and GAP in NG.GAPS, "unit arithmetic 60; the gap has its sentence")
check(named(psych(total=20))[0] != GAP and named(psych(total=20))[1] != GAP,
      "figures that do not add to the printed total take no gap")
check(named(psych(core=(3, 3, 2), computed=[17.0, 20.0]))[0] != GAP, "a sum short of the total takes no gap")
blank = psych()
blank["record"]["blocks"][0]["courses"][0]["alternatives"] = [{"code": "Y", "units": None}]
check(named(blank) == (None, None), "a blank 'or' alternative is units rule A4's, never this gap")
check(named(psych(list_figure=None))[0] != GAP, "a list that prints no figure takes no gap")


def listed_past(note=None, name="LIST B", extra_total=None):
    """The core at its figure; LIST A of 3-unit courses; LIST B's one course 4 units against a figure of 3."""
    f = psych(core=(3, 3, 3), computed=[19.0, 22.0])
    f["record"]["blocks"][2] = {"rule": "choose_courses", "name": name, "minimum": 1, "stated": {"min": 3, "max": 3},
                                "courses": [course(4)]}
    f["record"]["blocks"][1]["courses"] = [course(3), course(3)]
    f["record"]["notes"] = [note] if note else []
    return f


check(named(listed_past()) == (GAP, GAP) and NG.lists_claim(listed_past()) == "stands",
      "a list whose one course passes its figure, with no word letting it take another's, takes the gap")
cross = listed_past("List B also allows any List A course not already used.")
check(NG.lists_claim(cross) == "lists_meet_figure" and named(cross) == (None, None),
      "a list a note lets take another list's courses, and which meets its figure with them, takes no gap")
check(named(listed_past(name="LIST B (or any List A course not already used)")) == (None, None),
      "the same allowance in the list's own name takes no gap")
opened = listed_past("List B also allows any lower division CSU-transferable Economics elective.")
check(NG.lists_claim(opened) == "lists_meet_figure" and named(opened) == (None, None),
      "a list whose allowance reaches courses off the record is never past its figure")
other = psych()
other["record"]["notes"] = ["Conflicting totals: the table prints 'Total Units 19'."]
check(NG.lists_claim(other) == "prints_other_total" and named(other) == (None, None),
      "a second printed total the courses meet takes no gap (a reread passes it free)")
sample = psych()
sample["record"]["notes"] = ["The Suggested Course Sequence prints 'Total : 19'; this is a sample-plan total."]
check(NG.lists_claim(sample) == "stands", "a sample plan's total is not the program's")
opt = psych()
opt["record"]["notes"] = ["X 4 is optional: the core is 9 units without it."]
check(NG.lists_claim(opt) == "course_optional" and named(opt) == (None, None),
      "a counted course a note calls optional takes no gap")
rec_note = psych()
rec_note["record"]["notes"] = ["Y 3 is recommended before X 4 and does not count toward the total."]
check(NG.lists_claim(rec_note) == "stands", "a note on a recommended course leaves the claim standing")
diff = psych()
diff["record"]["notes"] = ["The 9 would fit if only one of the X 3 rows were required."]
check(NG.lists_claim(diff) == "note_names_difference" and named(diff) == (None, None),
      "a note naming the course that makes up the difference takes no gap")
moved = psych()
moved["record"]["notes"] = ["ARTH 26 may actually belong to List A."]
check(NG.lists_claim(moved) == "note_names_difference", "a course a note says may belong to another list")
page = psych()
page["record"]["notes"] = ["The source page may belong to a different certificate; a reviewer should verify it."]
check(NG.lists_claim(page) == "stands", "a page that may belong elsewhere names no course, so the claim stands")
ranged = psych(total=18, computed=[19.0, 19.0])
ranged["score"]["arithmetic"]["stated"] = [18.0, 20.0]
ranged["record"]["blocks"][1:] = [{"rule": "choose_courses", "name": n, "minimum": 1, "stated": {"min": 3, "max": 3},
                                   "courses": [course(3)]} for n in ("LIST A", "LIST B")]
ranged["record"]["blocks"].append({"rule": "choose_units", "name": "LIST C", "minimum": 3,
                                   "stated": {"min": 3, "max": 5}, "courses": [course(3), course(5)]})
check(NG.lists_claim(ranged) == "within_printed_range" and named(ranged) == (None, None),
      "a sum inside the printed range takes no gap (d-lists-gap-holds-range-sums-s703)")
by_why = {}
for w in NG.HELD_LISTS.values():
    by_why[w] = by_why.get(w, 0) + 1
check(len(NG.HELD_LISTS) == 29 and by_why == {NG.LISTS_CROSS_WHY: 8, NG.LISTS_TOTAL_WHY: 4, NG.LISTS_OPTIONAL_WHY: 5,
                                              NG.LISTS_DIFFERENCE_WHY: 6, NG.LISTS_RANGE_WHY: 6},
      "29 records held by key: 8 take another list's courses, 4 print a second total, 5 count an optional course, "
      "6 name the difference, 6 sum inside a printed range (%s)" % by_why)

res = NG.run(write=False, gaps=(GAP,), skip=HELD_S703, census_causes=("units_unequal",))
lr = res["lists_recall"]
check(lr["held"] > 20000 and lr["right"] == lr["held"] and lr["wrong"] == 0
      and lr["by_kind"].get("all", 0) > 1000 and lr["by_kind"].get("choose_courses", 0) > 1000,
      "self-recall, a list's courses and the total moved: held %d, right %d, wrong %d, by kind %s (%s)"
      % (lr["held"], lr["right"], lr["wrong"], lr["by_kind"], lr["wrong_keys"][:3]))
bd = lr["by_boundary"]
check(bd.get("past_by_half", 0) > 1000 and bd.get("total_by_half", 0) > 1000 and bd.get("cross_list", 0) > 1000,
      "the boundary readings ran, each right: %s" % bd)
lp = res["lists_precision"]
check((lp["stands"], lp["lists_meet_figure"], lp["prints_other_total"], lp["course_optional"],
       lp["note_names_difference"], lp["within_printed_range"]) == (18, 8, 4, 5, 5, 6),
      "lists_claim on the census's 46 records of the gap's shape: stands 18, meet 8, other total 4, optional 5, "
      "names the difference 5, inside a range 6 (%s)" % lp)
check(lp["hand_held"] == 29 and lp["hand_held_flagged_by_lists_claim"] == 28
      and lp["hand_held_not_flagged"] == ["Los Angeles Trade Technical College 08479"],
      "lists_claim flags %d of the 29 hand-held records (%s)" % (lp["hand_held_flagged_by_lists_claim"],
                                                                lp["hand_held_not_flagged"]))
check(not any(m["college"] in HELD_S703 for m in res["moved"]), "the dry run moves no record at a held college")
rc = res["recall"]
check(rc["wrong"] == 0 and rc["by_answer"].get(GAP, 0) == 21,
      "the plain recall with the new rule: right %d, wrong %d, the gap held on 21 (%d)" % (rc["right"], rc["wrong"], rc["by_answer"].get(GAP, 0)))

with open(os.path.join(ROOT, "kb", "receipts", "program_requirement_records_named_gaps_2026-11-22_s703w.json"),
          encoding="utf-8") as fh:
    plan = json.load(fh)
keys = {(r["college"], str(r["control_number"])) for r in plan["records"]}
census = NG.census_keys(("units_unequal",))
check(plan["only_gaps"] == [GAP] and plan["census_causes"] == ["units_unequal"], "one gap, at one census cause")
check(keys and keys <= census, "every plan row is a census units_unequal program (%d of %d)" % (len(keys & census),
                                                                                            len(keys)))
check(all(r["gap"] == GAP and r["after_image"]["checks"].get("gaps") == [GAP]
          and not (r["before_image"]["checks"] or {}).get("gaps") for r in plan["records"]),
      "each row takes the gap, and none filed a gap before")
check(len(keys) == 17 and plan["collected"] == 17, "the plan holds 17 rows (%d)" % len(keys))
check(not {c for c, _ in keys} & set(HELD_S703), "no plan row at a college held tonight")
check(not {c for c, _ in keys} & set(G.PARKED), "no plan row at a parked college")
check(not keys & set(NG.HELD_LISTS), "no plan row is a hand-held record")
check(len(set(plan["held_colleges"])) == len(plan["held_colleges"]) and set(HELD_S703) <= set(plan["held_colleges"]),
      "the receipt names each held college once, the fifteen held tonight among them")
for part in ("apply", "preread", "rollback"):
    with open(os.path.join(ROOT, "kb", "migrations", "2026-11-22_s703w_prreq_named_gaps_%s.sql" % part),
              encoding="utf-8") as fh:
        sql_keys = set(re.findall(r"^\s*\(\d+, '([^']+)', '(\d{5})', \d+,", fh.read(), re.M))
    check(sql_keys == keys, "the %s names exactly the plan's rows (%d of %d)" % (part, len(sql_keys), len(keys)))
for college, cn in sorted(keys):
    with open(os.path.join(ROOT, "kb", "program_requirements_college", C.slug_of(college), "records", cn + ".json"),
              encoding="utf-8") as fh:
        filed = json.load(fh)
    check([g.get("gap") for g in filed["score"].get("gaps") or []] == [GAP], "%s %s: the record files the gap"
          % (college, cn))
    check(NG.lists_claim(filed) == "stands" and NG.lists_held_out(filed) is None,
          "%s %s: a plan row's own words leave the claim standing" % (college, cn))
for college in HELD_S703:
    for p in glob.glob(os.path.join(ROOT, "kb", "program_requirements_college", C.slug_of(college), "records", "*.json")):
        with open(p, encoding="utf-8") as fh:
            sc = json.load(fh).get("score") or {}
        check(GAP not in [g.get("gap") for g in sc.get("gaps") or [] if isinstance(g, dict)],
              "%s: a held college's record carries no %s" % (os.path.relpath(p, ROOT), GAP))

if failures:
    for m in failures:
        print("FAIL:", m)
    sys.exit(1)
print("%d/%d checks passed: lists_past_their_figure (S703)" % (checks[0], checks[0]))
