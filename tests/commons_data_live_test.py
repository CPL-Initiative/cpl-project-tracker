#!/usr/bin/env python3
"""The Commons data dashboard's live counts (kb/_commons_data_live.py, #3215) and how the builder takes them.

COBIx's conditions on PR #3222 (2026-11-13): counts per college only, never rows; the Actions secret, never a browser
key, no new anon grant; read_at and basis "live" carried, never one figure with the committed-files basis. What this
guards, each a way the export could break them:
  (1) ⭐ counts only: the tables that name a person are derived from the committed schemas, and every query the export
      sends over a full fixture run reads them by count alone, with no select; every other read selects only its
      allowed columns, never *, and no allowed column names a person;
  (2) the guard refuses a row read of a person table, a select on a count, a select of *, an unlisted column or table;
  (3) the passing filter is the census's rule: for every check combination it counts what
      _program_requirements_score.counts_passing_on_tab counts;
  (4) the figures over the fixture, through Range paging (pages of 2) and chunked control numbers (2 at a time):
      Active, Teachout and Approved apart; a college's COCI twins counted once; unmatched names listed, no figures;
      no person's name, no URL in the output;
  (5) fail soft: a read that fails writes state "failed"; no service key reads nothing and names why (never anon);
      the builder keeps the previous block and records the attempt; a block that is not counts only is refused;
  (6) the overall bar is the quoted rule over the live block, basis live;
  (7) the workflow: the service key at the export step's scope alone, the builder takes --live, one push.

Run from the repo root: python3 tests/commons_data_live_test.py
"""
import importlib.util
import itertools
import json
import os
import re
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _commons_data_live as L  # noqa: E402
import _program_requirements_dated_reads as DR  # noqa: E402
import _program_requirements_score as S  # noqa: E402

spec = importlib.util.spec_from_file_location("build_cdd", os.path.join(ROOT, "kb", "_build_commons_data_status.py"))
B = importlib.util.module_from_spec(spec)
spec.loader.exec_module(B)

FIXTURE = os.path.join(ROOT, "tests", "fixtures", "commons_data_live", "tables.json")
STAND_IN = "Pat Person"
results = []


def check(name, cond, detail=""):
    results.append((name, bool(cond)))
    print(("PASS " if cond else "FAIL ") + name + ((" — " + str(detail)) if (detail and not cond) else ""))


def fixture():
    with open(FIXTURE, encoding="utf-8") as f:
        return L.Fixture(json.load(f))


# (1) the person tables, from the schemas the repo commits
SCHEMAS = {"program_requirement_records": "chatbox/supabase_program_requirement_records.sql",
           "program_source_registry": "kb/supabase_program_source_registry.sql",
           "course_outcomes": "chatbox/supabase_course_outcomes.sql",
           "coci_program_courses": "chatbox/supabase_program_courses.sql"}
PERSONISH = re.compile(r"(_by|email|e_mail|phone|^name|_name|first|last|ssn|dob|birth)$")


def schema_columns(table, path):
    text = open(os.path.join(ROOT, path), encoding="utf-8").read()
    m = re.search(r"create table if not exists public\.%s \((.*?)\n\);" % table, text, re.S)
    return re.findall(r"^\s+([a-z_]+)\s+[a-z]", m.group(1), re.M) if m else []


people = {}
for t, p in SCHEMAS.items():
    cols = schema_columns(t, p)
    check("(1) the schema of %s is read" % t, len(cols) >= 5, cols)
    named = tuple(c for c in cols if PERSONISH.search(c))
    if named:
        people[t] = named
check("(1) ⭐ the export's person tables are exactly the schemas' tables with a person column",
      {k: tuple(v) for k, v in L.PEOPLE.items()} == people, (L.PEOPLE, people))
check("(1) no allowed column names a person",
      not any(PERSONISH.search(c) for cols in L.COLUMN_READS.values() for c in cols), L.COLUMN_READS)
check("(1) no person table has a column read", not set(L.PEOPLE) & set(L.COLUMN_READS))
check("(1) coci_college_programs (no schema file in the repo) reads only college, control number and status",
      L.COLUMN_READS["coci_college_programs"] == ("college", "control_number", "status"))

src = fixture()
DR_PAGE, L_CHUNK = DR.PAGE, L.CHUNK
DR.PAGE, L.CHUNK = 2, 2          # many pages and many chunks over a small fixture
try:
    block = L.export(src, L.resolver(ROOT), "fixture-run")
finally:
    DR.PAGE, L.CHUNK = DR_PAGE, L_CHUNK
check("the fixture run reads", block["state"] == "read", block.get("error"))

bad = []
for method, table, qs in src.log:
    params = dict(re.findall(r"(?:^|&)([^=&]+)=([^&]*)", qs))
    if table in L.PEOPLE and (method != "count" or "select" in params):
        bad.append((method, table, qs[:80]))
    if method == "page":
        cols = params.get("select", "*").split(",")
        if "*" in cols or not set(cols) <= set(L.COLUMN_READS.get(table, ())):
            bad.append((method, table, qs[:80]))
check("(1) ⭐ over a full run, a person table is only ever counted, and a column read selects only its allowed columns",
      not bad and any(t in L.PEOPLE for _, t, _ in src.log), bad[:3])
check("(1) the dry-run plan passes the same guard", all(L.guard(*q) is None for q in L.plan()))

# (2) the guard refuses
for label, call in [
    ("a row read of a person table", ("page", "program_requirement_records", "select=college")),
    ("a select on a count of a person table", ("count", "program_source_registry", "select=corrected_by&college=eq.X")),
    ("a select of *", ("page", "course_outcomes", "select=*")),
    ("no select at all on a page read", ("page", "course_outcomes", "college=eq.X")),
    ("a column outside the list", ("page", "coci_program_courses", "select=college,course_title")),
    ("a table the export does not read", ("count", "map_users", "college=eq.X")),
]:
    try:
        L.guard(*call)
        refused = False
    except L.Refused:
        refused = True
    check("(2) the guard refuses " + label, refused)

# (3) the passing filter is the census's rule
agree = True
for cov, inv, ar in itertools.product((True, False, None), (True, False, None), ("equal", "unequal", "incomplete", "unstated", None)):
    one = L.Fixture({"program_requirement_records": [{"college": "C", "checks": {"coverage": cov, "invented": inv, "arithmetic": ar}}]})
    if (one.count("program_requirement_records", "college=eq.C&" + L.PASSING_QS) == 1) != S.counts_passing_on_tab({"coverage": cov, "invented": inv, "arithmetic": ar}):
        agree = False
check("(3) ⭐ the passing filter counts exactly what counts_passing_on_tab counts, every combination", agree)
check("(3) the filter is built from TAB_PASSING", all(s in L.PASSING_QS for s in S.TAB_PASSING))

# (4) the figures
C = block["colleges"]
ah, noce = C.get("17"), C.get("121")
check("(4) colleges are keyed by crosswalk id", set(C) == {"17", "121"}, sorted(C))
check("(4) Active, Teachout and Approved are counted apart; an Inactive program is not read",
      ah["programs"] == {"active": 5, "teachout": 1, "approved": 1}, ah["programs"])
check("(4) records by status: Active 4, passing 2 (equal and unstated), with PLOs 2; Teachout 1 passing; Approved 0 passing",
      (ah["records"]["active"], ah["records"]["active_passing"], ah["records"]["active_with_plos"],
       ah["records"]["teachout_passing"], ah["records"]["approved"], ah["records"]["approved_passing"]) == (4, 2, 2, 1, 1, 0), ah["records"])
check("(4) every record and the person-confirmed ones are counts", (ah["records"]["total"], ah["records"]["checked"]) == (6, 1))
check("(4) courses on Active programs are distinct codes (ACCT 101 on two programs, ACCT-102 spelled with a hyphen)",
      ah["program_courses"] == {"rows": 5, "active_courses": 3}, ah["program_courses"])
check("(4) SLO courses: 3 read, 2 on Active programs; objectives 1; another kind is not counted; the newest load per kind",
      (ah["outcomes"]["slo_courses"], ah["outcomes"]["slo_courses_on_active"], ah["outcomes"]["objective_courses"],
       ah["outcomes"]["slo_loaded_at"], ah["outcomes"]["objective_loaded_at"]) == (3, 2, 1, "2026-11-03T00:00:00Z", "2026-11-04T00:00:00Z"),
      ah["outcomes"])
check("(4) the registry reads as booleans: a catalog link, no curriculum view, no sequence source, a sequence checked",
      ah["registry"] == {"row": True, "catalog_link": True, "course_outline_link": False, "sequence_source": False, "sequence_checked": True})
check("(4) a college's two COCI spellings count once: North Orange's shared control number is one program",
      noce["names"] == ["North Orange Continuing Education", "North Orange Continuing Education Credit"] and noce["programs"]["active"] == 2, noce)
check("(4) a name the crosswalk does not hold is listed, with no figures", block["unmatched"] == ["Nowhere College", "Somewhere Else"])
check("(4) statewide is the sum of the colleges", block["statewide"]["programs"]["active"] == sum(c["programs"]["active"] for c in C.values()))
dump = json.dumps(block)
check("(4) ⭐ no person's name and no URL leave the runner", STAND_IN not in dump and "http" not in dump)
check("(4) the block names its basis, its read time, its run and each figure's table",
      block["basis"] == "live" and block["read_at"] and block["run_id"] == "fixture-run" and set(block["tables"]) == set(B.LIVE_GROUPS))
check("(4) the builder takes the fixture block as counts only", B.counts_only(block) is None, B.counts_only(block))
check("(4) paging and chunking ran (pages of 2, two control numbers at a time)",
      sum(1 for m, t, _ in src.log if m == "page" and t == "coci_college_programs") > 3)


# (5) fail soft
class Broken(L.Fixture):
    def page(self, table, qs, start, size):
        raise RuntimeError("the network went away")


failed = L.export(Broken({}), L.resolver(ROOT), "broken-run")
check("(5) a read that fails writes state failed with its error", failed["state"] == "failed" and "network" in failed["error"])
with tempfile.TemporaryDirectory() as tmp:
    out = os.path.join(tmp, "live.json")
    env = {k: v for k, v in os.environ.items() if k != L.KEY_ENV}
    r = subprocess.run([sys.executable, os.path.join(ROOT, "kb", "_commons_data_live.py"), "--out", out, "--run-id", "9"],
                       capture_output=True, text=True, env=env, timeout=120)
    nokey = json.load(open(out, encoding="utf-8"))
    check("(5) without the service key it reads nothing, exits 0 and says why", r.returncode == 0 and nokey["state"] == "failed"
          and L.KEY_ENV in nokey["error"], (r.returncode, nokey))
    src_text = open(os.path.join(ROOT, "kb", "_commons_data_live.py"), encoding="utf-8").read()
    check("(5) ⭐ the export never holds the anon key", "SUPABASE_ANON" not in src_text and "role\":\"anon" not in src_text)

    good = os.path.join(tmp, "good.json")
    with open(good, "w", encoding="utf-8") as f:
        json.dump(block, f)
    taken = B.live_block(good, None)
    check("(5) a read block is taken whole, with its read time and an ok attempt",
          taken["state"] == "read" and taken["read_at"] == block["read_at"] and taken["last_attempt"]["ok"] and taken["colleges"] == block["colleges"])
    bad_path = os.path.join(tmp, "bad.json")
    with open(bad_path, "w", encoding="utf-8") as f:
        json.dump(failed, f)
    kept = B.live_block(bad_path, taken)
    check("(5) ⭐ a failed read keeps the previous block whole and records the attempt",
          kept["read_at"] == taken["read_at"] and kept["colleges"] == taken["colleges"] and kept["last_attempt"]["ok"] is False
          and "network" in kept["last_attempt"]["error"])
    check("(5) a missing export keeps the previous block", B.live_block(os.path.join(tmp, "none.json"), taken)["read_at"] == taken["read_at"])
    check("(5) with no export named the previous block is carried unchanged", B.live_block(None, taken) == taken)
    check("(5) the first state is an explicit not-read-yet block",
          B.live_block(None, None) == B.LIVE_NOT_READ and B.LIVE_NOT_READ["read_at"] is None and B.LIVE_NOT_READ["state"] == "not read yet")
    leak = json.loads(json.dumps(block))
    leak["colleges"]["17"]["records"]["checked_by"] = STAND_IN
    check("(5) a block carrying a string where a count belongs is refused", B.counts_only(leak) is not None)
    leak = json.loads(json.dumps(block))
    leak["colleges"]["17"]["rows"] = [{"college": "x"}]
    check("(5) a block carrying rows is refused", B.counts_only(leak) is not None)
    with open(bad_path, "w", encoding="utf-8") as f:
        json.dump(leak, f)
    check("(5) and a refused block keeps the previous one", B.live_block(bad_path, taken)["colleges"] == taken["colleges"])

# (6) the overall bar
ov = B.overall_block(B.live_block(None, dict(block, flag="internal")))
a = ov["colleges"]["17"]
want = {"catalog": round(2 / 3, 4), "requirements": round(2 / 5, 4), "slos": round(2 / 3, 4), "plos": round(2 / 5, 4)}
check("(6) the parts: catalog checks of 3, Active passing of Active, SLO courses on Active of Active courses, PLOs of Active",
      a["parts"] == want, a["parts"])
check("(6) ⭐ overall = (catalog + requirements + (SLOs + PLOs) / 2) / 3",
      abs(a["value"] - (want["catalog"] + want["requirements"] + (want["slos"] + want["plos"]) / 2) / 3) < 1e-4, a)
check("(6) a part with no denominator counts as zero (North Orange has no courses on file)", ov["colleges"]["121"]["parts"]["slos"] == 0)
check("(6) overall names basis live and the read time", ov["basis"] == "live" and ov["read_at"] == block["read_at"])
check("(6) before the first read there is no overall figure", B.overall_block(B.LIVE_NOT_READ)["colleges"] == {})

# (7) the workflow
wf_text = open(os.path.join(ROOT, ".github", "workflows", "harvest-gap-census.yml"), encoding="utf-8").read()
import yaml  # noqa: E402
wf = yaml.safe_load(wf_text)
steps = wf["jobs"]["census"]["steps"]
with_key = [s.get("name") for s in steps if "SUPABASE_SERVICE_KEY" in json.dumps(s.get("env") or {})]
check("(7) ⭐ the service key sits on the export step alone, never on the job or the workflow",
      with_key == ["Commons data live counts (service key, counts only; fails soft)"]
      and "env" not in wf["jobs"]["census"] and "env" not in wf, with_key)
check("(7) the export runs before the builder, and the builder takes --live",
      [i for i, s in enumerate(steps) if "_commons_data_live.py" in (s.get("run") or "")][0]
      < [i for i, s in enumerate(steps) if "_build_commons_data_status.py --live out/commons_data_live.json" in (s.get("run") or "")][0])
check("(7) one push, and the export's file is never added", wf_text.count("git push") == 1 and "git add out" not in wf_text
      and "commons_data_live.json" not in [l for l in wf_text.splitlines() if "git add" in l].__str__())
check("(7) the workflow stays dispatch only", list((wf.get(True) or wf.get("on") or {}).keys()) == ["workflow_dispatch"])

failed_n = [n for n, ok in results if not ok]
print("\n%d/%d checks passed" % (len(results) - len(failed_n), len(results)))
sys.exit(1 if failed_n else 0)
