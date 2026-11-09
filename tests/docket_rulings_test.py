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


# ── step 3: the processor ──
import subprocess
import _docket_process as P  # noqa: E402

for c in cases:
    for v, cmds in (c.get("plans") or {}).items():
        for cmd in cmds:
            argv, why = P.vet(cmd)
            check("processor: the committed plan %r passes the vet" % cmd[:60], argv and not why, why)
for cmd, frag in [("python3 kb/other.py --expect 3 --apply", "not on the processor's list"),
                  ("python3 kb/_ccr_seed_confirm_apply.py --discipline Music --expect 250", "no --apply"),
                  ("python3 kb/_ccr_seed_confirm_apply.py --discipline Music --apply", "no --expect"),
                  ("python3 kb/_ccr_seed_confirm_apply.py --discipline 'Music;rm' --expect 3 --apply", "character"),
                  ("bash -c 'python3 kb/_ccr_seed_confirm_apply.py --expect 1 --apply'", "not a python3 script")]:
    argv, why = P.vet(cmd)
    check("processor: refuses %s" % frag, argv is None and frag in (why or ""), why)

FAKE = """import json, os, sys, datetime
a = sys.argv[1:]
d = a[a.index('--discipline') + 1]
if d == 'Boom':
    print('expected 3, found 2'); sys.exit(1)
os.makedirs('kb/ccr_seed_confirm_out/today', exist_ok=True)
json.dump({'d': d}, open('kb/ccr_seed_confirm_out/today/%s.json' % d.lower(), 'w'))
print('applied', d)
"""


def repo(td, plans):
    os.makedirs(os.path.join(td, "kb", "docket"))
    os.makedirs(os.path.join(td, "kb", "status"))
    with open(os.path.join(td, "kb", "_ccr_seed_confirm_apply.py"), "w") as f:
        f.write(FAKE)
    with open(os.path.join(td, "kb", "docket", "cases.json"), "w") as f:
        json.dump({"cases": [{"id": "k", "decides": "K?", "sheet": "https://claude.ai/artifact/S", "status": "open",
                              "choices": [{"value": "go", "words": "Go"}, {"value": "talk", "words": "Talk"}],
                              "plans": plans, "plan_words": {"talk": "A session decides."}}]}, f)
    with open(os.path.join(td, "kb", "status", "course.json"), "w") as f:
        json.dump({"calls": [{"title": "K?", "link": "https://claude.ai/artifact/S"}]}, f)
    with open(os.path.join(td, "rows.json"), "w") as f:
        json.dump([{"course_id": "_DOCKET::k", "value": json.dumps({"case": "k", "choice": "go"}), "reviewed_at": "2026-11-09T16:00:00Z"}], f)
    for cmd in (["git", "init", "-q"], ["git", "add", "-A"], ["git", "-c", "user.email=t@t", "-c", "user.name=t", "commit", "-qm", "x"]):
        subprocess.run(cmd, cwd=td, check=True)


def run(td, *extra):
    import io
    import contextlib
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        rc = P.main(["--root", td, "--rows", os.path.join(td, "rows.json"), "--no-rebuild"] + list(extra))
    return rc, buf.getvalue()


ok_plan = {"go": ["python3 kb/_ccr_seed_confirm_apply.py --discipline Music --expect 3 --apply",
                  "python3 kb/_ccr_seed_confirm_apply.py --discipline English --expect 2 --apply"], "talk": []}
with tempfile.TemporaryDirectory() as td:
    repo(td, ok_plan)
    rc, out = run(td)
    check("processor: without --apply it reports and writes nothing", rc == 0 and "WOULD k: go" in out
          and not os.path.exists(os.path.join(td, "kb", "docket", "receipts")), out)
    rc, out = run(td, "--apply")
    doc = json.load(open(os.path.join(td, "kb", "docket", "cases.json")))
    c = doc["cases"][0]
    rec = json.load(open(os.path.join(td, c["done"]["receipt"])))
    check("processor: a ruling's commands run in order and the case reads done", rc == 0 and c["status"] == "done"
          and [s["exit"] for s in rec["steps"]] == [0, 0], (rc, out, c))
    check("processor: the receipt names each script's own receipt and the undo, newest first",
          rec["undo"] == ["python3 kb/_ccr_seed_confirm_apply.py --undo kb/ccr_seed_confirm_out/today/english.json",
                          "python3 kb/_ccr_seed_confirm_apply.py --undo kb/ccr_seed_confirm_out/today/music.json"], rec["undo"])
    check("processor: the case's done record names no email", not re.search(r"@", json.dumps(c["done"])) and c["done"]["choice"] == "go", c["done"])
    call = json.load(open(os.path.join(td, "kb", "status", "course.json")))["calls"][0]
    check("processor: the run-log call on the same sheet is answered, so the band stops waiting", call.get("answer", {}).get("by") == "the Docket"
          and "Go" in call["answer"]["words"], call)
    rc, out = run(td, "--apply")
    check("processor: a second run finds the case done and runs nothing again", rc == 0 and "No open case carries a ruling." in out, out)

with tempfile.TemporaryDirectory() as td:
    repo(td, {"go": ["python3 kb/_ccr_seed_confirm_apply.py --discipline Music --expect 3 --apply",
                     "python3 kb/_ccr_seed_confirm_apply.py --discipline Boom --expect 2 --apply",
                     "python3 kb/_ccr_seed_confirm_apply.py --discipline English --expect 2 --apply"], "talk": []})
    rc, out = run(td, "--apply")
    c = json.load(open(os.path.join(td, "kb", "docket", "cases.json")))["cases"][0]
    rec = json.load(open(os.path.join(td, c["done"]["receipt"])))
    check("processor: a failing command stops the rest, the job exits 1 and the case reads partial with its receipt",
          rc == 1 and c["status"] == "partial" and len(rec["steps"]) == 2 and rec["undo"] and
          not os.path.exists(os.path.join(td, "kb", "ccr_seed_confirm_out", "today", "english.json")), (rc, rec.get("why")))
    check("processor: a partial case is never re-run; a session finishes it", D.read(D.load_cases(td), json.load(open(os.path.join(td, "rows.json"))))["act"] == [])

with tempfile.TemporaryDirectory() as td:
    repo(td, ok_plan)
    with open(os.path.join(td, "rows.json"), "w") as f:
        json.dump([{"course_id": "_DOCKET::k", "value": json.dumps({"case": "k", "choice": "talk"})}], f)
    rc, out = run(td, "--apply")
    c = json.load(open(os.path.join(td, "kb", "docket", "cases.json")))["cases"][0]
    check("processor: a choice whose plan is words is left open for a session", rc == 0 and c["status"] == "open" and "NEEDS_SESSION" in out, out)

# ── the Edge Function and the workflow ──
FN = open("chatbox/supabase/functions/docket-process/index.ts", encoding="utf-8").read()
serve = FN[FN.index("Deno.serve("):]
check("function: the reviewer check runs before the key is read or GitHub is called",
      0 < serve.index("await callerIsReviewer(req)") < serve.index("DISPATCH_TOKEN") and serve.index("await callerIsReviewer(req)") < serve.index("gh("))
check("function: a reviewer's session only; the team phrase and the anon key never dispatch",
      "team_pass_ok" not in FN and "bearer !== anon" in FN and "if (!who) return reply(origin, 401" in serve)
check("function: it writes no table and dispatches only the processor, on main, in apply mode",
      FN.count("/rest/v1/") == 1 and 'const WORKFLOW = "docket-process.yml";' in FN and 'ref: "main", inputs: { mode: "apply" }' in FN)
WF = open(".github/workflows/docket-process.yml", encoding="utf-8").read()
check("workflow: nightly and on dispatch, behind the daily build, running the processor",
      "schedule:" in WF and "workflow_dispatch:" in WF and "group: daily-dashboard" in WF and "python kb/_docket_process.py --apply" in WF)
check("workflow: the failure watch and the deploy list both name it",
      '"Docket process"' in open(".github/workflows/workflow-failure-watch.yml").read()
      and "- docket-process" in open(".github/workflows/cpl-chat-deploy.yml").read())
n = sum(1 for _, ok in results if ok)
print("\n%d/%d checks passed" % (n, len(results)))
sys.exit(0 if n == len(results) else 1)
