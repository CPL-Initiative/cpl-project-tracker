#!/usr/bin/env python3
"""Guard for kb/_program_requirements_dated_reads.py and its workflow (S644).

The map read computes in Python what kb/program_requirements_pilot/map_cr_by_course.sql computes in
SQL, so each rule of the SQL is pinned to invented rows: the course-code pattern, a string naming
several courses counting toward each, the title fallback (map_ace_exhibit_titles, else
chatbox_exhibits, both rows of a two-title exhibit), the 'unnamed' source, the distinct counts, the
title order (recs descending, then the database's en_US collation), an empty entry for a college no
row of which names a course, and the verify step's diff naming keys and fields, never values. Then
the filing: the notes, the SQL's college list, the file format. Then the workflow: a dispatch only,
the service key on the one MAP step, verify before any read, the retrying push. Pure stdlib plus
PyYAML; no network; reads no committed data file except the workflow and the governance map.

Run: python3 tests/program_requirements_dated_reads_test.py   (exit 0 = all pass)
"""
import json
import os
import shutil
import sys
import tempfile

import yaml

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_requirements_dated_reads as D  # noqa: E402

checks, failures = [0], []


def check(ok, what):
    checks[0] += 1
    if not ok:
        failures.append(what)


# 1. the pattern
check(D.course_codes("ADJ-13 Intro (3.0), ADJ-19 Patrol (3.0)") == ["ADJ 13", "ADJ 19"],
      "a string naming two courses names both")
check(D.course_codes("AUTO-B10 Engines") == ["AUTO B10"], "a letter-led number is read")
check(D.course_codes("FIRE TECH-101.5 Fire Behavior") == ["FIRE TECH 101.5"], "a spaced subject and a dotted number")
check(D.course_codes("Intro, EMS-80") == ["EMS 80"], "a course after a comma is read")
check(D.course_codes("Intro EMS-80") == [], "a course mid-string with no comma before it is not (the SQL's anchor)")
check(D.course_codes("-") == [] and D.course_codes("") == [] and D.course_codes(None) == [], "no course: no code")
check(D.course_codes("ems-80") == [], "the pattern is upper case, as in SQL")
check(D.course_codes("EMS-80 EMT,\u00a0EMS-81 Lab") == ["EMS 80"],
      "a no-break space after the comma is not Postgres's \\s, so the second course is not read (re.ASCII)")
check(D.course_codes("EMS-80 EMT, EMS-81 Lab") == ["EMS 80", "EMS 81"], "an ordinary space after the comma is")
check(D.course_codes("EMS-80, EMS-80") == ["EMS 80", "EMS 80"], "a repeat stays a repeat")

# 2. the aggregate
units = [
    {"college": "A College", "college_course": "EMS-80 EMT (5.0), EMS-81 Lab (1.0)", "source_code": "ACE", "exhibit_id": "X1", "credit_rec": "r1"},
    {"college": "A College", "college_course": "EMS-80 EMT (5.0)", "source_code": "ACE", "exhibit_id": "X1", "credit_rec": "r2"},
    {"college": "A College", "college_course": "EMS-80 EMT (5.0)", "source_code": "", "exhibit_id": "X2", "credit_rec": "r3"},
    {"college": "A College", "college_course": "EMS-80 EMT (5.0)", "source_code": None, "exhibit_id": "X3", "credit_rec": "r4"},
    {"college": "A College", "college_course": "EMS-80 EMT (5.0)", "source_code": "ACE", "exhibit_id": "X4", "credit_rec": "r5"},
    {"college": "A College", "college_course": "EMS-80 EMT (5.0)", "source_code": "ACE", "exhibit_id": None, "credit_rec": "r6"},
    {"college": "A College", "college_course": "", "source_code": "ACE", "exhibit_id": "X9", "credit_rec": "r9"},
]
ace = {"X1": ["Basic EMT"], "X4": ["Medic One", None]}
chatbox = {"X2": ["Medic Zulu", None, "Field Medic"], "X4": ["Chatbox Medic"], "X3": [None]}
agg = D.aggregate(units, ace, chatbox)
e80 = agg["A College"]["EMS 80"]
check(set(agg["A College"]) == {"EMS 80", "EMS 81"}, "a two-course string counts toward each; an empty course field toward none")
check(agg["A College"]["EMS 81"]["recs"] == 1 and agg["A College"]["EMS 81"]["exhibits"] == 1,
      "the second course of the string carries its row")
check(e80["recs"] == 6, "recs counts distinct credit recommendations (got %s)" % e80["recs"])
check(e80["exhibits"] == 4, "exhibits counts distinct exhibits, a null exhibit not counted (got %s)" % e80["exhibits"])
check(e80["exhibits_by_source"] == {"ACE": 2, "unnamed": 2},
      "an empty or null source reads 'unnamed'; a source of null exhibits counts zero of them (got %s)" % e80["exhibits_by_source"])
titles = [(t["title"], t["source"], t["recs"]) for t in e80["titles"]]
check(("Basic EMT", "ACE", 2) in titles, "a titled exhibit's recs are its distinct recommendations")
check(("Field Medic", "unnamed", 1) in titles and not any(x[0] == "Medic Zulu" for x in titles),
      "no map_ace title: chatbox_exhibits' first title in title order, nulls last (the ordered SQL)")
check(D.first_title([None, "b", "A"]) == "A" and D.first_title([None]) is None and D.first_title([]) is None,
      "the fallback skips nulls and takes the first in title order")
check(("Medic One", "ACE", 1) in titles and ("Chatbox Medic", "ACE", 1) in titles,
      "a two-row exhibit yields both, the null row falling back to chatbox (the left join)")
check(e80["untitled_exhibits"] == 1, "an exhibit with no title anywhere is untitled (X3; got %s)" % e80["untitled_exhibits"])
check(titles[0] == ("Basic EMT", "ACE", 2), "titles order by recs descending first")
check(list(e80) == ["recs", "exhibits", "exhibits_by_source", "titles", "untitled_exhibits"], "the entry's fields")
none = D.aggregate([{"college": "B College", "college_course": "EMS-80", "source_code": "ACE", "exhibit_id": "X3", "credit_rec": "r1"}],
                   {}, {})
check(none["B College"]["EMS 80"]["titles"] is None, "no title at all: titles is null, as jsonb_agg of nothing")

# 3. the title order (en_US, measured): case after the letter, punctuation counted, tab before space
def ordered(a, b):
    return D.title_key(a) < D.title_key(b)


check(ordered("Alpha by Mail", "Alpha Supervisor"), "case is a later level than the letter (b before S)")
check(ordered("Cavalry Scout", "CH-47 Pilot"), "Ca before CH")
check(ordered("Mechanic-Trainee", "Mechanic, F/A-18"), "a hyphen before a comma")
check(ordered("BIO 1\tBiology", "BIO 1 Biology"), "a tab before a space")
check(ordered("Unit 9", "Unit A"), "a digit before a letter")
check(ordered("alpha", "Alpha"), "lower case before upper at the last level")
t = D.aggregate([{"college": "C", "college_course": "X-1", "source_code": "ACE", "exhibit_id": e, "credit_rec": "r"}
                 for e in ("E1", "E2", "E3")], {"E1": ["Zeta"], "E2": ["alpha"], "E3": ["Beta"]}, {})["C"]["X 1"]["titles"]
check([x["title"] for x in t] == ["alpha", "Beta", "Zeta"], "equal recs order by title in that collation (got %s)" % t)

# 4. the verify diff names keys and fields only
filed = {"EMS 80": dict(e80), "EMS 99": {"recs": 1}}
got = {"EMS 80": dict(e80, recs=7), "EMS 81": {"recs": 1}}
diff = D.differences(got, filed)
check(diff == ["EMS 81: only in the fresh read", "EMS 99: only in the filed entry", "EMS 80: recs"],
      "the diff names the codes and the field (got %s)" % diff)
check(not any("Basic EMT" in d or "7" in d for d in diff), "the diff carries no value")
check(D.differences(agg["A College"], json.loads(json.dumps(agg["A College"]))) == [],
      "an entry equals its own JSON round trip")

# 4b. verify's one tolerance: chatbox fallback titles and the order of tied titles
fb = {}
D.aggregate(units, ace, chatbox, fb)
check(fb == {("A College", "EMS 80"): {"Medic Zulu", "Field Medic"}},
      "the fallback candidates are the titles of an exhibit chatbox holds several of (got %s)" % fb)
old = json.loads(json.dumps(e80))
for x in old["titles"]:
    if x["title"] == "Field Medic":
        x["title"] = "Medic Zulu"   # what the unordered SQL may have taken
check(D.fallback_only(e80 and {"EMS 80": e80}, {"EMS 80": old}, {"EMS 80": fb[("A College", "EMS 80")]}) == 2,
      "a fallback title alone: agrees except 2 fallback titles (one in, one out)")
swapped = json.loads(json.dumps(e80))
swapped["titles"] = list(reversed(swapped["titles"]))
check(D.fallback_only({"EMS 80": e80}, {"EMS 80": swapped}, {}) == 1, "titles in another order alone: one")
wrong = json.loads(json.dumps(old))
wrong["recs"] = 99
check(D.fallback_only({"EMS 80": e80}, {"EMS 80": wrong}, {"EMS 80": fb[("A College", "EMS 80")]}) is None,
      "a fallback title beside any other difference fails")
other = json.loads(json.dumps(e80))
other["titles"][0]["title"] = "Something Else"
check(D.fallback_only({"EMS 80": e80}, {"EMS 80": other}, {"EMS 80": fb[("A College", "EMS 80")]}) is None,
      "a title that is no fallback candidate fails")
check(D.fallback_only({"EMS 80": e80}, {"EMS 80": e80, "EMS 9": {}}, {}) is None, "a missing code fails")

# 4c. a name MAP does not know files an empty entry; the reads count before and after
calls = []


def fake(table, select, filters, order):
    calls.append(table)
    if table == "map_colleges":
        return [{"college_id": 7, "college_name": "A College"}]
    if table == "map_college_cr_unit":
        return [{"college_id": 7, "college_course": "EMS-80 EMT", "source_code": "ACE", "exhibit_id": "X1", "credit_rec": "r1"}]
    if table == "map_ace_exhibit_titles":
        return [{"exhibit_id": "X1", "title": "Basic EMT"}]
    return []


import contextlib  # noqa: E402
import io  # noqa: E402
buf = io.StringIO()
with contextlib.redirect_stdout(buf):
    got = D.read_map(["A College", "Unknown College"], fetch=fake)
check(got["Unknown College"] == {} and got["A College"]["EMS 80"]["recs"] == 1,
      "a name with no map_colleges row files an empty entry beside the others (got %s)" % got)
log = buf.getvalue()
check("notice: 1 named colleges have no map_colleges row" in log and "Basic EMT" not in log and "r1" not in log,
      "a count-only notice; no row reaches the log")


def pages(counts, rows):
    seq = iter(counts)

    def fetch_page(table, qs, start, size):
        return (rows[start:start + size], next(seq))
    return fetch_page


D.PAGE = 2
check(D.paged(pages([3, 3, 3, 3], [1, 2, 3]), "t", "") == [1, 2, 3], "a still table reads whole over its pages")
for counts, what in (([3, 4], "between pages"), ([3, 3, 3, 4], "after the last page")):
    try:
        D.paged(pages(counts, [1, 2, 3, 4]), "t", "")
        check(False, "a count that moved %s stops the run" % what)
    except SystemExit as e:
        check("Run the dispatch again" in str(e), "a count that moved %s stops the run and says to run again" % what)
D.PAGE = 1000

# 5. the filing
tmp = tempfile.mkdtemp()
try:
    pilot = os.path.join(tmp, "pilot")
    out = os.path.join(tmp, "out")
    os.makedirs(pilot)
    os.makedirs(out)
    D.MAP_FILE, D.REGISTRY_FILE, D.MAP_SQL = (os.path.join(pilot, n) for n in
                                              ("map.json", "registry.json", "map.sql"))
    base = {"_what": "old", "_source": "src", "_read_at": "2026-10-18", "_read_by": "Someone (S1) by hand.",
            "_refresh": "old", "colleges": {"Old College": {"EMS 1": {"recs": 1}}}}
    D.dump(D.MAP_FILE, base)
    D.dump(D.REGISTRY_FILE, dict(base, colleges={"Old College": {k: None for k in D.REGISTRY_COLUMNS}}))
    with open(D.MAP_SQL, "w") as fh:
        fh.write("where c.college_name in ('Old College',\n                         'O''Neil College')\n  and x\n")
    D.dump(os.path.join(out, "map.json"), {"colleges": {"New College": {}, "Old College": {"EMS 1": {"recs": 2}}},
                                           "detail": "1 course codes", "verified": ["Old College"]})
    D.dump(os.path.join(out, "registry.json"), {"colleges": {"New College": {k: None for k in D.REGISTRY_COLUMNS}}})
    D.file_reads(out, "SkyTest (S0), run 1", today="2026-11-13")
    m = D.load(D.MAP_FILE)
    r = D.load(D.REGISTRY_FILE)
    check(m["colleges"]["New College"] == {}, "a college no row of which names a course files an empty entry")
    check(m["colleges"]["Old College"] == {"EMS 1": {"recs": 2}}, "a named college's entry is replaced")
    check(m["_read_at"] == "2026-11-13" and m["_read_by"].startswith("SkyTest (S0), run 1 on 2026-11-13")
          and m["_read_by"].endswith("Earlier: Someone (S1) by hand."), "the note says who and when, the earlier notes kept")
    check("1 added (New College), 1 changed (Old College)" in m["_read_by"] and "Old College recomputed equal" in m["_read_by"],
          "the note names what was added, changed and verified")
    check("2 colleges" in m["_what"] and "no student column" in m["_what"] and "2 colleges" in r["_what"],
          "_what counts the colleges each file holds")
    check(D.WORKFLOW in m["_refresh"] and D.WORKFLOW in r["_refresh"], "_refresh names the workflow")
    check(m["_source"] == "src", "_source is kept")
    sql = open(D.MAP_SQL).read()
    check(D.sql_list(sql) == ["Old College", "O'Neil College", "New College"] and sql.endswith("  and x\n"),
          "the SQL's college list gains the new college and keeps the rest (got %s)" % D.sql_list(sql))
    check(open(D.MAP_FILE, encoding="utf-8").read() == json.dumps(m, indent=1, ensure_ascii=False) + "\n",
          "the file keeps its format (indent 1, UTF-8, a closing newline)")
    check(D.sync_sql(sql, ["Old College", "New College"]) == sql, "a list already true is left alone")
finally:
    shutil.rmtree(tmp)

# 6. the committed SQL names every college the committed file holds
committed = D.load(os.path.join(ROOT, "kb", "program_requirements_pilot", "map_cr_by_course.json"))
listed = set(D.sql_list(open(os.path.join(ROOT, "kb", "program_requirements_pilot", "map_cr_by_course.sql"),
                             encoding="utf-8").read()))
check(set(committed["colleges"]) <= listed, "map_cr_by_course.sql names every filed college (missing %s)"
      % sorted(set(committed["colleges"]) - listed))

# 7. the workflow
wf_text = open(os.path.join(ROOT, D.WORKFLOW)).read()
wf = yaml.safe_load(wf_text)
on = wf.get(True) or wf.get("on")
check(list(on) == ["workflow_dispatch"], "a dispatch only (got %s)" % list(on))
check(set(on["workflow_dispatch"]["inputs"]) == {"colleges", "verify", "by"}, "inputs: colleges, verify, by")
check(len(on["workflow_dispatch"]["inputs"]["verify"]["default"].split(",")) == 3, "three filed colleges verified by default")
steps = wf["jobs"]["read"]["steps"]
check(steps[0].get("name") == "Refuse to run on main" and 'exit 1' in steps[0]["run"] and "main" in steps[0]["run"],
      "the first step refuses main")
runs = "\n".join(s.get("run") or "" for s in steps)
check("${{" not in runs, "no expression is expanded inside a run script; the ref, run id and inputs come through env")
holders = [s.get("name") for s in steps if "SUPABASE_SERVICE_KEY" in json.dumps(s)]
check(holders == ["Verify the filed colleges, then read MAP for the named ones"],
      "the service key reaches the MAP step alone: %r" % holders)
mapstep = steps[[s.get("name") for s in steps].index(holders[0])] if holders else {"run": ""}
lines = [ln for ln in mapstep["run"].splitlines() if ln.strip()]
check(len(lines) == 2 and " verify " in lines[0] and " map " in lines[1], "verify runs before the MAP read, in one shell that stops on failure")
names = [s.get("name") for s in steps]
check(names.index(holders[0]) < names.index("Read the registry (public read)") < names.index("File both reads")
      < names.index("Commit to the branch that ran it"), "verify and read, then the registry, then file, then commit")
commit = steps[names.index("Commit to the branch that ran it")]["run"]
check("for i in 1 2 3 4 5 6 7 8 9 10" in commit and "git pull --rebase" in commit, "the retrying push")
check("supabase" not in commit.lower(), "the commit step reads no table")
check(wf["permissions"] == {"contents": "read"} and wf["jobs"]["read"]["permissions"] == {"contents": "write"},
      "contents: write on the job alone")
gov = json.load(open(os.path.join(ROOT, "kb", "governance_surface_map.json")))
reason = gov["dismissed"].get("workflow:program-requirements-dated-reads.yml", "")
check("writes no table" in reason, "dismissed in the governance map with its reason")

if failures:
    print("FAIL: program requirements dated reads (%d of %d)" % (len(failures), checks[0]))
    for f in failures:
        print("  -", f)
    sys.exit(1)
print("%d/%d checks passed: program requirements dated reads" % (checks[0], checks[0]))
