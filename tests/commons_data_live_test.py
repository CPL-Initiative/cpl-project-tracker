#!/usr/bin/env python3
"""The Commons data dashboard's live counts (kb/_commons_data_live.py, #3215) and how the builder takes them.

COBIx's conditions on PR #3222 (2026-11-13): counts per college only, never rows; the Actions secret, never a browser
key, no new anon grant; read_at and basis "live" carried, never one figure with the committed-files basis. What this
guards, each a way the export could break them:
  (1) ⭐ counts only: the tables that name a person are derived from the committed schemas, and every query the export
      sends over a full fixture run reads them by count alone, with no select; every other read selects only its
      allowed columns, never *, and no allowed column names a person;
  (2) the guard refuses a row read of a person table, a select on a count, a select of *, an unlisted column or table,
      and any query that names a person column (a filter, an or=, an order; COBIx's finding 3 on #3232);
  (2b) every Range-paged read has a total order ending in the table's unique key, and tied rows across a page
      boundary are each read once (COBIx's finding 2);
  (3) the passing filter is the census's rule: for every check combination it counts what
      _program_requirements_score.counts_passing_on_tab counts;
  (4) the figures over the fixture, through Range paging (pages of 2) and chunked control numbers (2 at a time):
      Active, Teachout and Approved apart; a college's COCI twins counted once; unmatched names listed, no figures;
      no person's name, no URL in the output;
  (5) fail soft: a read that fails writes state "failed"; no service key reads nothing and names why (never anon);
      the builder keeps the previous block and records the attempt; a block that is not counts only is refused;
  (5c) the scrub tests a JWT's signature alone and skips runs in a committed anon key, so a file quoting the
      anon key is never a hit (two dummy JWTs sharing header and payload prefix);
  (5d) accept_active_shift takes one read outside the Active band, logged in the block with both counts and the
      run, and never waives the college floor or an empty read;
  (6) the overall bar is the quoted rule over the live block, basis live;
  (7) the workflow: every job naming the service key declares the live-counts environment (Sam's, restricted to
      main) and runs on main alone, every step naming it too; the key on steps alone; the export's file scrubbed
      before its upload; the census job runs on a branch and after a failed export, takes the counts only when the
      export succeeded, builds with --live, and makes the one push.

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
    ("a filter on a person column of a person table", ("count", "program_requirement_records", "checked_by=eq.Pat")),
    ("a person column inside or=", ("count", "program_source_registry", "or=(corrected_by.is.null,college.eq.X)")),
    ("a person column in an order", ("count", "program_requirement_records", "college=eq.X&order=checked_by")),
    ("a person column, URL-encoded", ("count", "program_source_registry", "corrected%5Fby=not.is.null")),
    ("a person column on a table without one", ("page", "course_outcomes", "select=college&checked_by=eq.X")),
]:
    try:
        L.guard(*call)
        refused = False
    except L.Refused:
        refused = True
    check("(2) the guard refuses " + label, refused)
check("(2) the person columns the guard refuses are every column in PEOPLE",
      L.PERSON_COLUMNS == sorted({c for v in people.values() for c in v}) and L.PERSON_COLUMNS)
check("(2) a column whose name only contains a person column's letters still passes (checked, not checked_by)",
      L.guard("count", "program_requirement_records", "college=eq.X&checked=is.true") is None)

# (2b) every Range-paged read has a total order ending in a unique key (COBIx's finding 2 on #3232)
for table, qs in (("coci_college_programs", L.PROGRAMS_QS), ("coci_program_courses", L.COURSES_QS),
                  ("course_outcomes", L.OUTCOMES_QS)):
    order = re.search(r"(?:^|&)order=([^&]+)", qs).group(1).split(",")
    uk = L.UNIQUE_KEY[table]
    if uk:
        check("(2b) %s's order ends in its unique key %s" % (table, uk), tuple(order[-len(uk):]) == uk, order)
    else:
        check("(2b) %s (no key in the repo) orders by every column it reads, so ties are identical tuples" % table,
              set(L.COLUMN_READS[table]) <= set(order), order)
check("(2b) course_outcomes' unique key is its schema's primary key",
      re.search(r"^\s+id\s+bigint generated always as identity primary key", open(os.path.join(ROOT, SCHEMAS["course_outcomes"])).read(), re.M))
check("(2b) coci_program_courses' unique key is its schema's primary key",
      "primary key (college, program_control_number, course_control_number)" in open(os.path.join(ROOT, SCHEMAS["coci_program_courses"])).read())
# tied rows across a page boundary: the fixture returns ties reversed on every other page, as a database may
tied = L.Fixture({"course_outcomes": [{"id": i, "college": "Allan Hancock College", "course_code": "SAME %d" % (i % 2),
                                       "kind": "slo" if i < 6 else "objective", "loaded_at": "2026-11-%02dT00:00:00Z" % i}
                                      for i in range(1, 11)]})
every = ["2026-11-%02dT00:00:00Z" % i for i in range(1, 11)]
DR_PAGE = DR.PAGE
DR.PAGE = 2
try:
    got = DR.paged(tied.page, "course_outcomes", L.OUTCOMES_QS)
    old = DR.paged(tied.page, "course_outcomes", "select=college,course_code,kind,loaded_at&order=college,course_code")
finally:
    DR.PAGE = DR_PAGE
check("(2b) ⭐ with the total order every tied row is read exactly once across the page boundaries",
      sorted(r["loaded_at"] for r in got) == every, sorted(r["loaded_at"] for r in got))
check("(2b) the fixture models the bug: the old order skips and repeats tied rows",
      sorted(r["loaded_at"] for r in old) != every)

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


# (5) fail soft, and never the key in a file (the review of #3232, finding 1)
class Broken(L.Fixture):
    def page(self, table, qs, start, size):
        raise RuntimeError("the network went away")


DUMMY = "dummyKEY-" + "x7Q2" * 50 + "\n"     # a stand-in service key ending in a newline, as a web paste leaves it


class LeakyHeader(L.Fixture):
    """What urllib raises for a key holding a newline: the whole key in the exception text."""
    def page(self, table, qs, start, size):
        raise ValueError("Invalid header value %r" % DUMMY.encode())


failed = L.export(Broken({}), L.resolver(ROOT), "1234")
check("(5) a read that fails writes state failed with a class from the fixed vocabulary, no exception text",
      failed["state"] == "failed" and failed["error_class"] == "other" and "network" not in json.dumps(failed))
leaky = L.export(LeakyHeader({}), L.resolver(ROOT), "1234")
check("(5) ⭐ an exception that carries the key is stored as its class alone ('bad header'), never its text",
      leaky["error_class"] == "bad header" and not L.holds_key(json.dumps(leaky), DUMMY), leaky)
import urllib.error  # noqa: E402
for exc, want in ((urllib.error.HTTPError("u", 401, "no", {}, None), ("unauthorized", 401)),
                  (urllib.error.HTTPError("u", 503, "down", {}, None), ("upstream 5xx", 503)),
                  (urllib.error.URLError(TimeoutError()), ("timeout", None)),
                  (SystemExit("x changed while it was read (1 rows, then 2)"), ("count moved", None)),
                  (SystemExit("x stopped at 5 of 9 rows"), ("short read", None))):
    check("(5) a failure is classed %s" % want[0], L.error_class(exc) == want, L.error_class(exc))
check("(5) the key is stripped when read; one still holding whitespace or a control character is refused by class",
      L.clean_key("abc\n") == ("abc", None) and L.clean_key("ab\nc") == (None, "bad header")
      and L.clean_key("ab\x07c") == (None, "bad header") and L.clean_key("") == (None, "no service key"))
check("(5) the scrub finds any 20-character run of the key", L.holds_key("..." + DUMMY[30:50] + "...", DUMMY)
      and not L.holds_key("..." + DUMMY[30:49] + "...", DUMMY))
with tempfile.TemporaryDirectory() as tmp:
    out = os.path.join(tmp, "out", "live.json")
    env = {k: v for k, v in os.environ.items() if k != L.KEY_ENV}
    r = subprocess.run([sys.executable, os.path.join(ROOT, "kb", "_commons_data_live.py"), "--out", out, "--run-id", "9"],
                       capture_output=True, text=True, env=env, timeout=120)
    nokey = json.load(open(out, encoding="utf-8"))
    check("(5) without the service key it reads nothing, exits 0 and says why", r.returncode == 0 and nokey["state"] == "failed"
          and nokey["error_class"] == "no service key" and L.KEY_ENV in r.stdout, (r.returncode, nokey))
    src_text = open(os.path.join(ROOT, "kb", "_commons_data_live.py"), encoding="utf-8").read()
    check("(5) ⭐ the export never holds the anon key", "SUPABASE_ANON" not in src_text and "role\":\"anon" not in src_text)

    # the review's case end to end: a key holding a newline, the export, the builder, the scrub
    env2 = dict(env, **{L.KEY_ENV: DUMMY + "x\n"})   # still holds a newline inside after stripping
    r2 = subprocess.run([sys.executable, os.path.join(ROOT, "kb", "_commons_data_live.py"), "--out", out, "--run-id", "9"],
                        capture_output=True, text=True, env=env2, timeout=120)
    dumped = open(out, encoding="utf-8").read()
    check("(5) ⭐ a key holding a newline is refused before any read, and neither the export file nor the log holds a run of it",
          json.loads(dumped)["error_class"] == "bad header" and not L.holds_key(dumped, DUMMY)
          and not L.holds_key(r2.stdout + r2.stderr, DUMMY), json.loads(dumped))
    status = os.path.join(tmp, "commons_data.json")
    r3 = subprocess.run([sys.executable, os.path.join(ROOT, "kb", "_build_commons_data_status.py"), "--root", ROOT,
                         "--out", status, "--live", out, "--quiet"], capture_output=True, text=True, timeout=300)
    st = open(status, encoding="utf-8").read()
    check("(5) ⭐ the status file the builder writes holds no run of the key, and records the class",
          r3.returncode == 0 and not L.holds_key(st, DUMMY) and json.loads(st)["live"]["last_attempt"]["error_class"] == "bad header",
          r3.stderr[-300:])
    with open(out, "w", encoding="utf-8") as f:   # an export that somehow carries the key in a free-text field
        json.dump(dict(leaky, error="Invalid header value " + DUMMY), f)
    subprocess.run([sys.executable, os.path.join(ROOT, "kb", "_build_commons_data_status.py"), "--root", ROOT,
                    "--out", status, "--live", out, "--quiet"], capture_output=True, text=True, timeout=300)
    check("(5) ⭐ the builder copies no export text into the status file, only the class",
          not L.holds_key(open(status, encoding="utf-8").read(), DUMMY))
    r4 = subprocess.run([sys.executable, os.path.join(ROOT, "kb", "_commons_data_live.py"), "--scrub", os.path.dirname(out), status],
                        capture_output=True, text=True, env=dict(env, **{L.KEY_ENV: DUMMY}), timeout=60)
    check("(5) ⭐ --scrub fails, naming the file and never the key, when an output holds the key",
          r4.returncode == 1 and "live.json" in r4.stdout and not L.holds_key(r4.stdout, DUMMY), r4.stdout[-200:])
    os.remove(out)
    r5 = subprocess.run([sys.executable, os.path.join(ROOT, "kb", "_commons_data_live.py"), "--scrub", os.path.dirname(out), status],
                        capture_output=True, text=True, env=dict(env, **{L.KEY_ENV: DUMMY}), timeout=60)
    check("(5) --scrub passes clean outputs", r5.returncode == 0, r5.stdout[-200:])

# (5b) a short read never replaces a good block (the review of #3232, finding 2)
cw = json.load(open(B.crosswalk_path(ROOT), encoding="utf-8"))["colleges"]
UNIVERSE = [str(e["college_id"]) for e in cw if e["entity_kind"] in B.IN_SCOPE]
template = block["colleges"]["17"]


def full_block(active_each=170, ids=None, at="2026-11-14T06:00:00Z"):
    b = json.loads(json.dumps(block))
    b["read_at"] = at
    b["colleges"] = {}
    for cid in (UNIVERSE if ids is None else ids):
        e = json.loads(json.dumps(template))
        e["programs"]["active"] = active_each
        b["colleges"][cid] = e
    return b


with tempfile.TemporaryDirectory() as tmp:
    def take(b, prev):
        p = os.path.join(tmp, "x.json")
        with open(p, "w", encoding="utf-8") as f:
            json.dump(b, f)
        return B.live_block(p, prev, len(UNIVERSE))

    normal = take(full_block(), None)
    check("(5b) ⭐ a normal read (every college, %d Active) is taken" % (170 * len(UNIVERSE)),
          normal["state"] == "read" and normal["last_attempt"]["ok"], normal["last_attempt"])
    empty = take(dict(full_block(), colleges={}), normal)
    check("(5b) ⭐ an empty read keeps the previous block and records a short read with its counts",
          empty["colleges"] == normal["colleges"] and empty["read_at"] == normal["read_at"]
          and empty["last_attempt"]["error_class"] == "short read" and empty["last_attempt"]["counts"]["colleges"] == 0,
          empty["last_attempt"])
    chunk = take(full_block(ids=UNIVERSE[:20]), normal)
    check("(5b) ⭐ a one-chunk read (20 colleges) keeps the previous block",
          chunk["colleges"] == normal["colleges"] and chunk["last_attempt"]["error_class"] == "short read", chunk["last_attempt"])
    thin = take(full_block(active_each=120), normal)
    check("(5b) every college but fewer Active programs than the band allows (a part-loaded table) keeps the previous block",
          thin["colleges"] == normal["colleges"] and thin["last_attempt"]["counts"]["active"] == 120 * len(UNIVERSE))
    near = take(full_block(active_each=160, at="2026-11-15T06:00:00Z"), normal)
    check("(5b) a read within the band of the previous one (-6%) is taken", near["state"] == "read" and near["read_at"] == "2026-11-15T06:00:00Z")
    first_thin = take(full_block(active_each=100), None)
    check("(5b) with no previous block, a read under the absolute floor is not taken",
          first_thin["state"] == "not read yet" and first_thin["last_attempt"]["counts"]["active_floor"] == B.ACTIVE_FLOOR)
    check("(5b) the fixture's two-college read is a short read too", take(block, None)["state"] == "not read yet")

    good = os.path.join(tmp, "good.json")
    with open(good, "w", encoding="utf-8") as f:
        json.dump(full_block(), f)
    taken = B.live_block(good, None, len(UNIVERSE))
    check("(5) a read block is taken whole, with its read time and an ok attempt",
          taken["state"] == "read" and taken["last_attempt"]["ok"] and len(taken["colleges"]) == len(UNIVERSE))
    bad_path = os.path.join(tmp, "bad.json")
    with open(bad_path, "w", encoding="utf-8") as f:
        json.dump(failed, f)
    kept = B.live_block(bad_path, taken, len(UNIVERSE))
    check("(5) ⭐ a failed read keeps the previous block whole and records the attempt by class",
          kept["read_at"] == taken["read_at"] and kept["colleges"] == taken["colleges"] and kept["last_attempt"]["ok"] is False
          and kept["last_attempt"]["error_class"] == "other")
    missing = B.live_block(os.path.join(tmp, "none.json"), taken, len(UNIVERSE))
    check("(5) a missing export (a branch run, the step skipped) keeps the previous block and records not read",
          missing["read_at"] == taken["read_at"] and missing["last_attempt"]["error_class"] == "not read")
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
    refused = B.live_block(bad_path, taken, len(UNIVERSE))
    check("(5) and a refused block keeps the previous one", refused["colleges"] == taken["colleges"]
          and refused["last_attempt"]["error_class"] == "not counts only")

# (5c) the scrub never mistakes the public anon key for the service key (COBIx, 6857150335): two HS256 JWTs that
# share the header and the start of the payload
import base64  # noqa: E402


def _b64(obj):
    return base64.urlsafe_b64encode(json.dumps(obj, separators=(",", ":")).encode()).decode().rstrip("=")


HEAD = _b64({"alg": "HS256", "typ": "JWT"})
ANON_JWT = HEAD + "." + _b64({"iss": "supabase", "ref": "dummyprojectref00000", "role": "anon", "iat": 1}) + ".Anon0signature0ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef"
SERVICE_JWT = HEAD + "." + _b64({"iss": "supabase", "ref": "dummyprojectref00000", "role": "service_role", "iat": 1}) \
    + ".Svc0secret0signature0zyxwvutsrqponmlkjihgfedcbaZYXWV"
shared = os.path.commonprefix([ANON_JWT, SERVICE_JWT])
check("(5c) the two dummy JWTs share the header and a payload prefix longer than a scrub run",
      len(shared) > len(HEAD) + L.SCRUB_RUN, len(shared))
check("(5c) ⭐ a file quoting the anon key is no hit for the service key", not L.holds_key("cfg = '%s'" % ANON_JWT, SERVICE_JWT))
check("(5c) ⭐ a run of the service key's signature is a hit", L.holds_key("x" + SERVICE_JWT.split(".")[2][5:25] + "x", SERVICE_JWT))
check("(5c) the whole service key is a hit", L.holds_key(SERVICE_JWT, SERVICE_JWT))
twin = SERVICE_JWT.split(".")[2][:L.SCRUB_RUN]
anon_twin = ANON_JWT.rsplit(".", 1)[0] + "." + twin + "tail"
check("(5c) a signature run that also sits in a committed anon key is skipped, and the rest of the signature still counts",
      not L.holds_key("q" + twin + "q", SERVICE_JWT, [anon_twin]) and L.holds_key("q" + twin + "q", SERVICE_JWT, []))
check("(5c) a key that is not a JWT is tested whole", L.holds_key("..." + DUMMY[30:50], DUMMY))
anon_real = L.committed_anon_keys(ROOT)
check("(5c) the committed anon key is found in the repo, and only anon-role tokens", anon_real and all(L._jwt_role(t) == "anon" for t in anon_real))
with tempfile.TemporaryDirectory() as tmp:
    f = os.path.join(tmp, "status.json")
    with open(f, "w", encoding="utf-8") as fh:
        json.dump({"quoted": ANON_JWT, "real_anon": anon_real[0] if anon_real else ""}, fh)
    check("(5c) ⭐ --scrub passes a status file that quotes anon keys", L.scrub([tmp], SERVICE_JWT, [ANON_JWT]) == [])
    with open(f, "w", encoding="utf-8") as fh:
        fh.write(SERVICE_JWT)
    check("(5c) and fails one that holds the service key", L.scrub([tmp], SERVICE_JWT, [ANON_JWT]) == [f])

# (5d) the Active band cannot ratchet: an explicit, logged override (COBIx, 6857150335)
with tempfile.TemporaryDirectory() as tmp:
    def take2(b, prev, accept):
        p = os.path.join(tmp, "y.json")
        with open(p, "w", encoding="utf-8") as fh:
            json.dump(dict(b, run_id="777"), fh)
        return B.live_block(p, prev, len(UNIVERSE), accept)

    good_prev = take2(full_block(), None, False)
    shifted = full_block(active_each=110, at="2026-11-16T06:00:00Z")      # a real, lasting 35% drop
    check("(5d) without the override a shift outside the band is a short read", take2(shifted, good_prev, False)["read_at"] == good_prev["read_at"])
    taken_o = take2(shifted, good_prev, True)
    check("(5d) ⭐ with accept_active_shift the shifted read is taken, and the block says it was taken by override, with both counts and the run",
          taken_o["state"] == "read" and taken_o["read_at"] == "2026-11-16T06:00:00Z"
          and taken_o["override"] == {"accepted_by_override": "accept_active_shift", "active": 110 * len(UNIVERSE),
                                      "previous_active": 170 * len(UNIVERSE), "run_id": "777"}
          and taken_o["last_attempt"]["accepted_by_override"] is True, taken_o.get("override"))
    check("(5d) the next read is compared with the accepted level, and carries no override",
          take2(full_block(active_each=112, at="2026-11-17T06:00:00Z"), taken_o, False)["override"] is None)
    check("(5d) ⭐ the override never waives the college floor",
          take2(full_block(active_each=170 * 6, ids=UNIVERSE[:20]), good_prev, True)["read_at"] == good_prev["read_at"])
    check("(5d) ⭐ the override never takes an empty read",
          take2(dict(full_block(), colleges={}), good_prev, True)["last_attempt"]["error_class"] == "short read")
    check("(5d) the override also lifts the first read's absolute floor, but not its college floor",
          take2(full_block(active_each=100), None, True)["state"] == "read"
          and take2(full_block(active_each=100, ids=UNIVERSE[:5]), None, True)["state"] == "not read yet")
    check("(5d) a read inside the band needs no override and records none", take2(full_block(active_each=165), good_prev, True)["override"] is None)

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

# (7) the workflow: two jobs, the key in the live-counts environment alone (Sam's setting, COBIx's recommendation)
wf_text = open(os.path.join(ROOT, ".github", "workflows", "harvest-gap-census.yml"), encoding="utf-8").read()
import yaml  # noqa: E402
wf = yaml.safe_load(wf_text)
jobs = wf["jobs"]
MAIN_ONLY = r"\s*github\.ref\s*==\s*'refs/heads/main'\s*"
ENV_NAME = "live-counts"


SECRET_FORMS = re.compile(r"SUPABASE_SERVICE_KEY|toJSON\(\s*secrets\s*\)|secrets\s*\.\s*\*|secrets\s*\[")


def mentions_key(x):
    """The key by name, or any form that would hand a step every secret (toJSON(secrets), secrets.*, secrets[...])."""
    return bool(SECRET_FORMS.search(json.dumps({k: v for k, v in x.items() if k != "name"} if isinstance(x, dict) else x)))


def env_of(job):
    e = job.get("environment")
    return e.get("name") if isinstance(e, dict) else e


keyed_jobs = {n: j for n, j in jobs.items() if mentions_key(j)}
check("(7) ⭐ every job that references SUPABASE_SERVICE_KEY declares the environment live-counts and runs on main alone",
      keyed_jobs and all(env_of(j) == ENV_NAME and re.fullmatch(MAIN_ONLY, str(j.get("if") or "")) for j in keyed_jobs.values()),
      {n: (env_of(j), j.get("if")) for n, j in keyed_jobs.items()})
check("(7) ⭐ every step that references SUPABASE_SERVICE_KEY runs on main alone, by its own if or its job's",
      all(re.fullmatch(MAIN_ONLY, str(s.get("if") or j.get("if") or ""))
          for j in jobs.values() for s in j.get("steps") or [] if mentions_key(s)))
check("(7) the key sits on steps alone, never on a job's or the workflow's env",
      "env" not in wf and not any(mentions_key(j.get("env") or {}) for j in jobs.values())
      and all(not mentions_key({k: v for k, v in s.items() if k not in ("env", "name")}) for j in jobs.values() for s in j.get("steps") or []))
lc, census = jobs.get("live-counts") or {}, jobs.get("census") or {}
lc_steps, steps = lc.get("steps") or [], census.get("steps") or []
check("(7) the live-counts job holds least permissions (contents read) and the census job no key and no environment",
      lc.get("permissions") == {"contents": "read"} and not mentions_key(census) and "environment" not in census)
check("(7) ⭐ the census job runs on a branch and after a failed export: it needs the export but runs unless cancelled",
      census.get("needs") in ("live-counts", ["live-counts"]) and "!cancelled()" in str(census.get("if"))
      and not re.search("refs/heads/main", str(census.get("if"))))
lc_names = [s.get("name") or s.get("uses") for s in lc_steps]
up = [i for i, s in enumerate(lc_steps) if "upload-artifact" in str(s.get("uses"))]
scrub_i = [i for i, s in enumerate(lc_steps) if "--scrub out" in (s.get("run") or "")]
check("(7) ⭐ the export's file is scrubbed for the key before its upload, and a hit deletes it and fails the job",
      scrub_i and up and scrub_i[0] < up[0] and "rm -rf out" in lc_steps[scrub_i[0]]["run"]
      and lc_steps[up[0]]["with"]["path"] == "out/commons_data_live.json", lc_names)
dl = [i for i, s in enumerate(steps) if "download-artifact" in str(s.get("uses"))]
bi = [i for i, s in enumerate(steps) if "_build_commons_data_status.py --live out/commons_data_live.json" in (s.get("run") or "")]
check("(7) the census job takes the counts only when the export succeeded, never failing on their absence, then builds with --live",
      dl and bi and dl[0] < bi[0] and steps[dl[0]].get("continue-on-error") is True
      and "needs.live-counts.result == 'success'" in str(steps[dl[0]].get("if"))
      and steps[dl[0]]["with"]["name"] == lc_steps[up[0]]["with"]["name"])
check("(7) one writer and one push: only the census job commits, and the export's file is never added",
      wf_text.count("git push") == 1 and "git push" not in json.dumps(lc) and "git add out" not in wf_text
      and "commons_data_live.json" not in [ln for ln in wf_text.splitlines() if "git add" in ln].__str__())
check("(7) the wildcard secret forms count as naming the key",
      all(mentions_key({"env": {"X": v}}) for v in ("${{ toJSON(secrets) }}", "${{ toJSON( secrets ) }}", "${{ secrets.* }}",
                                                     "${{ secrets['SUPABASE_SERVICE_KEY'] }}"))
      and not mentions_key({"env": {"X": "${{ inputs.accept_active_shift }}"}}))
check("(7) ⭐ no job outside the live-counts environment uses any wildcard secret form",
      not any(SECRET_FORMS.search(json.dumps(j)) for n, j in jobs.items() if env_of(j) != ENV_NAME))
check("(7) every artifact upload keeps a short retention (the live counts ride in both)",
      all((s.get("with") or {}).get("retention-days") == 3 for j in jobs.values() for s in j.get("steps") or []
          if "upload-artifact" in str(s.get("uses"))))
check("(7) the push keeps the one concurrency group", wf.get("concurrency", {}).get("group") == "harvest-gap-census-${{ github.ref_name }}")
check("(7) the workflow stays dispatch only", list((wf.get(True) or wf.get("on") or {}).keys()) == ["workflow_dispatch"])
inp = ((wf.get(True) or wf.get("on") or {})["workflow_dispatch"] or {}).get("inputs", {}).get("accept_active_shift") or {}
builder_step = steps[bi[0]]
check("(7) ⭐ accept_active_shift is a boolean dispatch input, default false, reaching the builder through env and logged",
      inp.get("type") == "boolean" and inp.get("default") is False
      and "inputs.accept_active_shift" in json.dumps(builder_step.get("env") or {})
      and "--accept-active-shift" in builder_step["run"] and "::notice::" in builder_step["run"]
      and "${{" not in builder_step["run"], inp)
check("(5) a key that only ends in a newline is stripped, so urllib never sees the newline",
      L.clean_key(DUMMY)[0] == DUMMY.strip() and "\n" not in L.clean_key(DUMMY)[0])

failed_n = [n for n, ok in results if not ok]
print("\n%d/%d checks passed" % (len(results) - len(failed_n), len(results)))
sys.exit(1 if failed_n else 0)
