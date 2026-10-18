#!/usr/bin/env python3
"""The Commons tab's builder (kb/_build_commons_status.py) reads every row from the committed
files, and a figure it cannot read is null beside its error, never a zero.

Sam, 2026-10-18 20:10Z: "Build it as a tab now." The tab (commons.js) draws whatever this
builder writes to kb/status/commons.json, so the contract guarded here is the file's shape:
five rows in the mock-up's order, each with a complete pair, its tests, known issues naming an
owner, settled procedures and a machine stamp; and the S343 rule that a failed read says so.

Run from the repo root: python3 tests/commons_status_build_test.py
"""
import importlib.util
import json
import os
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("build_commons", os.path.join(ROOT, "kb", "_build_commons_status.py"))
B = importlib.util.module_from_spec(spec)
spec.loader.exec_module(B)

results = []


def check(name, cond, detail=""):
    results.append((name, bool(cond)))
    print(("PASS " if cond else "FAIL ") + name + ((" — " + str(detail)) if (detail and not cond) else ""))


# ── the file, as the daily run writes it ──
with tempfile.TemporaryDirectory() as tmp:
    out = os.path.join(tmp, "commons.json")
    r = subprocess.run([sys.executable, os.path.join(ROOT, "kb", "_build_commons_status.py"), "--root", ROOT, "--out", out, "--quiet"],
                       capture_output=True, text=True, timeout=300)
    check("the builder exits 0 on the repo", r.returncode == 0, r.stderr[-400:])
    with open(out, encoding="utf-8") as f:
        data = json.load(f)

check("schema 1 with a written_at stamp", data.get("schema") == 1 and str(data.get("written_at", "")).endswith("Z"))
rows = data.get("rows", [])
check("five rows in the mock-up's order", [r.get("key") for r in rows] == ["requirements", "exhibit", "course", "cr", "subjects"])
for r in rows:
    key = r.get("key")
    pair = r.get("pair") or []
    check(key + ": a title, a tab hash and an Open the tab link", r.get("title") and str(r.get("tab", "")).startswith("#")
          and any(l.get("text") == "Open the tab" and l.get("href") == r.get("tab") for l in r.get("links", [])))
    check(key + ": the row read without an error", not r.get("error"), r.get("error"))
    check(key + ": the complete pair is two whole numbers with the count inside the universe",
          pair and isinstance(pair[0].get("n"), int) and isinstance(pair[0].get("of"), int) and 0 <= pair[0]["n"] <= pair[0]["of"],
          pair[:1])
    check(key + ": the pair opens the tab", pair and pair[0].get("open") == r.get("tab"))
    check(key + ": at least one test behind the count", isinstance(r.get("tests"), list) and len(r["tests"]) >= 1)
    check(key + ": every known issue carries a count, words and an owner",
          all(isinstance(i.get("n"), int) and i.get("words") and i.get("owner") for i in r.get("issues", [])),
          [i for i in r.get("issues", []) if not (isinstance(i.get("n"), int) and i.get("words") and i.get("owner"))])
    check(key + ": at least one known issue and one settled procedure", len(r.get("issues", [])) >= 1 and len(r.get("procedures", [])) >= 1)
    m = r.get("machine") or {}
    check(key + ": a machine stamp with what and when", m.get("what") and m.get("at"), m)
    check(key + ": the sources it read are named", isinstance(r.get("sources"), list) and len(r["sources"]) >= 1)
    check(key + ": no figure is a bare zero", all(i.get("n") != 0 for i in r.get("issues", [])) and pair[0].get("n") != 0)

req = rows[0]
f = req.get("facts") or {}
check("Program Requirements: complete + failing + unread = the active universe",
      f.get("complete") + f.get("failing") + f.get("unread") == f.get("active") == req["pair"][0]["of"], f)
check("Program Requirements: its run log is named (kb/status/program-requirements.json)",
      req.get("status_file") == "kb/status/program-requirements.json")
check("Program Requirements: the issues are the failing and the unread counts",
      [i["n"] for i in req["issues"]] == [f.get("failing"), f.get("unread")])
ex = rows[1].get("facts") or {}
check("Exhibit: a person's and a cohort's stamps sum to the stamped titles", ex.get("person") + ex.get("cohort") == ex.get("stamped") == rows[1]["pair"][0]["n"])
cr = rows[3]
check("CR: the curator's decisions are a second pair line with no universe", len(cr["pair"]) == 2 and "of" not in cr["pair"][1] and isinstance(cr["pair"][1].get("n"), int))
sub = rows[4].get("facts") or {}
check("Subjects: a person's and a cohort's confirmations sum to the confirmed count", sub.get("person") + sub.get("cohort") == sub.get("confirmed") == rows[4]["pair"][0]["n"])

# ── the S343 rule: a source that cannot be read is null with its error, never a zero ──
with tempfile.TemporaryDirectory() as empty:
    bare = B.build(empty)
    check("an empty root still writes five rows", [r["key"] for r in bare["rows"]] == ["requirements", "exhibit", "course", "cr", "subjects"])
    check("every row of an empty root carries its error and a null pair",
          all(r.get("error") and r["pair"][0]["n"] is None and r["pair"][0]["of"] is None for r in bare["rows"]),
          [(r["key"], r.get("error")) for r in bare["rows"]])
    check("an unread row draws no zero anywhere", all(i.get("n") != 0 for r in bare["rows"] for i in r.get("issues", [])))

# ── the small helpers ──
check("receipt_time turns 2026-10-18T17-37-29Z into ISO", B.receipt_time("2026-10-18T17-37-29Z") == "2026-10-18T17:37:29Z")
check("receipt_time leaves an ISO stamp alone", B.receipt_time("2026-10-18T17:37:29Z") == "2026-10-18T17:37:29Z")
check("a reviewer ending in @bot is a cohort; a person is the rest",
      B.is_cohort("cer-procedure-course-identity@bot") and B.is_cohort("preseed-v1@bot") and not B.is_cohort("map@rccd.edu") and not B.is_cohort(None))
check("figure() carries an error, never a zero", B.figure(lambda: 1 / 0)["n"] is None and "ZeroDivisionError" in B.figure(lambda: 1 / 0)["error"])

failed = [n for n, ok in results if not ok]
print("\n%d/%d checks passed" % (len(results) - len(failed), len(results)))
sys.exit(1 if failed else 0)
