#!/usr/bin/env python3
"""Guards for kb/_course_outcomes_load.py and course_outcomes_load() (S374; Sam,
Open Asks Sheet 70 card 3).

The load is the one write to course_outcomes. The failure modes these checks pin:
a row for a college the outline does not name, a fingerprint that no longer
matches the outcomes it stands for, a receipt that cannot roll the load back, and
any write path but the insert-only function. Pure-stdlib python.
"""
import importlib.util
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("load", os.path.join(ROOT, "kb", "_course_outcomes_load.py"))
load = importlib.util.module_from_spec(spec)
spec.loader.exec_module(load)
TRIAL = os.path.join(ROOT, "kb", "course_outcomes", "trial_38317539422", "read.json")
SQL = os.path.join(ROOT, "chatbox", "supabase_course_outcomes.sql")

checks = []


def check(name):
    def wrap(fn):
        checks.append((name, fn))
        return fn
    return wrap


@check("each course becomes one row per college its outline names (RIV, MOV, NOR), with the outcomes unchanged")
def _():
    rows, skipped = load.rows_from([TRIAL], "rccd")
    trial = json.load(open(TRIAL))["rows"]
    want = sum(len(r["offered_at"]) for r in trial)
    assert len(rows) == want and not skipped, (len(rows), want, skipped)
    by = {(r["college"], r["course_code"]): r for r in rows}
    cis = [r for r in trial if r["code"] == "CIS 11"][0]
    for college in ("Riverside City College", "Moreno Valley College", "Norco College"):
        assert by[(college, "CIS 11")]["outcomes"] == cis["outcomes"], college
    assert ("Moreno Valley College", "ACC 19") not in by, "ACC 19's outline names RIV and NOR only"


SD_TRIAL = os.path.join(ROOT, "kb", "course_outcomes", "trial_38350787486", "read.json")


@check("an SDCCD course becomes one row per college group, each with that college's own outcomes")
def _():
    rows, skipped = load.rows_from([SD_TRIAL], "sdccd")
    trial = json.load(open(SD_TRIAL))["rows"]
    want = sum(1 for r in trial for g in r.get("groups") or [] if g["outcomes"])
    assert len(rows) == want == 16, (len(rows), want)
    by = {(r["college"], r["course_code"]): r for r in rows}
    geog = [r for r in trial if r["code"] == "GEOG 101"][0]["groups"]
    assert by[("San Diego City College", "GEOG 101")]["outcomes"] == geog[1]["outcomes"]
    assert by[("San Diego Miramar College", "GEOG 101")]["outcomes"] == geog[2]["outcomes"]
    assert ("San Diego City College", "ARCH 100") not in by, "ARCH 100 prints Mesa's outcomes only"
    assert {s["course_code"] for s in skipped} == {"AAPI 124", "SDGE 302"}, skipped
    assert all(r["shape"] in ("list", "paragraph") for r in rows)


@check("a group whose title names no college the host maps is skipped with its reason, never guessed")
def _():
    import tempfile
    d = json.load(open(SD_TRIAL))
    d["rows"] = [r for r in d["rows"] if r["code"] == "PHOT 100"]
    d["rows"][0]["groups"][0]["group"] = "Continuing Education"
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as f:
        json.dump(d, f)
    try:
        rows, skipped = load.rows_from([f.name], "sdccd")
    finally:
        os.unlink(f.name)
    assert rows == [] and skipped[0]["group"] == "Continuing Education" and "no college" in skipped[0]["why"], skipped


@check("a filed row whose fingerprint does not match its outcomes stops the load")
def _():
    import tempfile
    d = json.load(open(TRIAL))
    d["rows"][0]["outcomes"] = d["rows"][0]["outcomes"] + ["an added line"]
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as f:
        json.dump(d, f)
    try:
        load.rows_from([f.name], "rccd")
        raise AssertionError("the load went on")
    except SystemExit as e:
        assert "fingerprint" in str(e), e
    finally:
        os.unlink(f.name)


@check("the receipt names every inserted id and the delete that removes exactly those")
def _():
    results = [{"inserted": 2, "kept": 1, "inserted_keys": [{"id": 11, "college": "Norco College", "course_code": "A 1"},
                                                            {"id": 12, "college": "Norco College", "course_code": "B 2"}]},
               {"inserted": 0, "kept": 3, "inserted_keys": []}]
    r = load.receipt_of("rccd", "123456", [TRIAL], [{}] * 6, [], results, None)
    assert r["inserted"] == 2 and r["kept"] == 4, r
    assert r["rollback"] == "delete from public.course_outcomes where id in (11, 12);", r["rollback"]
    assert load.receipt_of("rccd", "123456", [TRIAL], [], [], [], None)["rollback"] is None


@check("the only write is the insert-only function on the service role: no PATCH, DELETE or table address")
def _():
    src = open(os.path.join(ROOT, "kb", "_course_outcomes_load.py")).read()
    assert re.findall(r'"rpc/[a-z_]+"', src) == ['"rpc/course_outcomes_load"'], "another rpc"
    assert not re.search(r'method="(PATCH|DELETE|PUT)"|/rest/v1/course_outcomes', src), "a direct table write"
    sql = open(SQL).read()
    assert "on conflict (college, course_code, source_url, fingerprint) do nothing" in sql
    assert "if coalesce(auth.role(), '') <> 'service_role'" in sql
    assert re.search(r"revoke all on function public\.course_outcomes_load\(text, jsonb\) from public, anon, authenticated",
                     sql)
    assert re.search(r"revoke insert, update, delete, truncate on public\.course_outcomes from public, anon, authenticated",
                     sql)
    assert not re.search(r"^\s*(update|delete)\b", sql, re.I | re.M), "an update or delete in the SQL"


EL_CAB = os.path.join(ROOT, "kb", "course_outcomes", "trial_38506174617", "read.json")


@check("an eLumen read loads one row per course for the college whose records name it, marked as read from the catalog")
def _():
    rows, skipped = load.rows_from([EL_CAB], "cabrillo")
    trial = json.load(open(EL_CAB))["rows"]
    assert len(rows) == len(trial) and not skipped, (len(rows), skipped)
    assert {r["college"] for r in rows} == {"Cabrillo College"}, {r["college"] for r in rows}
    assert {(r["source_kind"], r["source_system"]) for r in rows} == {("catalog", "elumen")}
    acct = [r for r in rows if r["course_code"] == "ACCT 151A"][0]
    assert len(acct["outcomes"]) == 2 and acct["source_url"].endswith(",course,acct151a?tenant=cabrillo.elumenapp.com"), acct


def main():
    failed = 0
    for i, (name, fn) in enumerate(checks, 1):
        try:
            fn()
            print("  ok   %d %s" % (i, name))
        except AssertionError as e:
            failed += 1
            print("  FAIL %d %s\n       %s" % (i, name, str(e)[:400]))
    print("\ncourse_outcomes_load_test.py: %d/%d checks passed" % (len(checks) - failed, len(checks)))
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
