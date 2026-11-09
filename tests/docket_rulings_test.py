#!/usr/bin/env python3
"""The Docket (#2963 step 2): the committed cases file, the builder's docket and case batches, and
kb/_docket_rulings.py, which reads the rulings a reviewer saved in the Commons and says what each one runs.

Run from the repo root: python3 tests/docket_rulings_test.py
"""
import json
import os
import re
import sys
import tempfile

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "kb"))
import _build_commons_status as B  # noqa: E402
import _docket_rulings as D  # noqa: E402

results = []


def check(name, cond, detail=None):
    results.append((name, bool(cond)))
    print(("PASS " if cond else "FAIL ") + name + ("" if cond or detail is None else " — %s" % (detail,)))


# ── the committed file ──
with open("kb/docket/cases.json", encoding="utf-8") as f:
    raw = f.read()
doc = json.loads(raw)
cases = doc["cases"]
check("the cases file parses and holds at least one case", cases, len(cases))
check("the cases file, served on Pages, holds no email address", not re.search(r"[\w.+-]+@[\w-]+\.[\w.]+", raw))
REGISTER = {r["id"] for r in [v for v in json.load(open("kb/governance_register.json")).values() if isinstance(v, list)][0]}
for c in cases:
    vals = [ch.get("value") for ch in c.get("choices") or []]
    check("case %s: an id, an addressee handle, a source, what it decides and two or more choices" % c.get("id"),
          c.get("id") and c.get("addressee") and c.get("source") in ("session", "procedure", "cfby") and c.get("decides") and len(vals) >= 2)
    check("case %s: names a register row that owns the decision" % c["id"], c.get("dr") in REGISTER, c.get("dr"))
    check("case %s: every choice has a plan, as commands or as words" % c["id"],
          all((c.get("plans") or {}).get(v) or (c.get("plan_words") or {}).get(v) for v in vals), vals)
    cmds = [cmd for v in vals for cmd in (c.get("plans") or {}).get(v) or []]
    check("case %s: every apply command carries the count it must match" % c["id"],
          all("--apply" not in cmd or "--expect" in cmd for cmd in cmds), cmds)
    check("case %s: a done case says who carried it out and its receipt" % c["id"],
          c.get("status") != "done" or all(k in (c.get("done") or {}) for k in ("choice", "by", "at", "receipt")))

# ── the builder ──
with tempfile.TemporaryDirectory() as td:
    os.makedirs(os.path.join(td, "kb", "docket"))
    os.makedirs(os.path.join(td, "kb", "status"))
    with open(os.path.join(td, "kb", "exhibits_sweep.json"), "w") as f:
        json.dump({"cards": []}, f)
    sheet = "https://claude.ai/artifact/S175"
    with open(os.path.join(td, "kb", "status", "course.json"), "w") as f:
        json.dump({"calls": [{"title": "On the sheet", "link": sheet}, {"title": "Another sheet", "link": "https://claude.ai/artifact/other"}]}, f)
    with open(os.path.join(td, "kb", "docket", "cases.json"), "w") as f:
        json.dump({"cases": [
            {"id": "a", "addressee": "sam", "decides": "A?", "size": {"n": 5}, "sheet": sheet, "plans": {"x": ["cmd"]},
             "choices": [{"value": "x", "words": "X"}, {"value": "y", "words": "Y"}], "status": "open"},
            {"id": "b", "decides": "B?", "choices": [{"value": "x"}], "status": "done"}]}, f)
    dk = B.docket(td)
    check("the builder carries open cases only, without their commands", [c["id"] for c in dk] == ["a"] and "plans" not in dk[0], dk)
    bl = B.batches(td, {}, dk)
    kinds = [(b["kind"], b.get("title")) for b in bl]
    check("a case is a batch, and the sheet it carries is no second batch",
          kinds[0] == ("case", "A?") and ("decision", "On the sheet") not in kinds and ("decision", "Another sheet") in kinds, kinds)
    check("a case batch opens its address", bl[0]["open"] == "#commons/case/a" and bl[0]["n"] == 5, bl[0])
    full = B.build(td)
    check("the status file carries the docket beside the batches", full["docket"] == dk and full["batches"][0]["kind"] == "case")

# ── the ruling reader ──
CS = [{"id": "a", "decides": "A?", "dr": "DR-25", "choices": [{"value": "five"}, {"value": "later"}],
       "plans": {"five": ["python3 x.py --expect 3 --apply"], "later": []}, "plan_words": {"later": "Nothing changes."}, "status": "open"},
      {"id": "b", "decides": "B?", "choices": [{"value": "ok"}], "status": "done", "done": {"choice": "ok"}},
      {"id": "c", "decides": "C?", "choices": [{"value": "ok"}], "status": "open", "sheet": "https://s"}]
rows = [{"course_id": "_DOCKET::a", "value": json.dumps({"case": "a", "choice": "five", "note": "go"}), "reviewer_email": "r@x.edu", "reviewed_at": "2026-11-09T15:00:00Z"},
        {"course_id": "_DOCKET::b", "value": {"case": "b", "choice": "ok"}, "reviewed_at": "2026-11-09"},
        {"course_id": "_DOCKET::zzz", "value": json.dumps({"choice": "five"})},
        {"course_id": "_DOCKET::a2", "value": "not json"},
        {"course_id": "OTHER", "value": "{}"}]
out = D.read(CS, rows)
check("a ruling on an open case names its choice, who, when and the commands it runs",
      len(out["act"]) == 1 and out["act"][0]["choice"] == "five" and out["act"][0]["plan"] == ["python3 x.py --expect 3 --apply"]
      and out["act"][0]["by"] == "r@x.edu" and out["act"][0]["note"] == "go", out["act"])
check("a ruling on a done case is reported done, never run again", [d["case"] for d in out["done"]] == ["b"], out["done"])
check("a ruling with no such case, or a choice the case does not offer, is refused with its reason",
      sorted(r["case"] for r in out["refused"]) == ["a2", "zzz"] and all(r["why"] for r in out["refused"]), out["refused"])
check("an open case with no ruling is listed as waiting", [o["case"] for o in out["open_unruled"]] == ["c"], out["open_unruled"])
bad = D.read(CS, [{"course_id": "_DOCKET::a", "value": json.dumps({"choice": "all"})}])
check("a choice outside the case's list is never acted on", not bad["act"] and bad["refused"][0]["why"].startswith("the case offers"), bad)
check("the read query asks only for the docket's own rows", "field = 'docket_ruling'" in D.SQL and "\\_DOCKET::%" in D.SQL, D.SQL)
with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as f:
    json.dump(rows, f)
try:
    import io
    import contextlib
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        rc = D.main(["--rows", f.name])
    txt = buf.getvalue()
finally:
    os.unlink(f.name)
check("the command line reads committed cases and a rows file and writes nothing", rc == 0 and "REFUSED" in txt and "OPEN" in txt, txt)

n = sum(1 for _, ok in results if ok)
print("\n%d/%d checks passed" % (n, len(results)))
sys.exit(0 if n == len(results) else 1)
