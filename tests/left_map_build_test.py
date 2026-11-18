#!/usr/bin/env python3
"""kb/_build_left_map.py and kb/_apply_left_map.py: the leftover-title decisions (S678, COBIx's item 2 on #3464).

Guards: Sam's two groups (graded = Credit By Exam + Portfolio Review; cert-based = the other four) and a mixed label;
a noncredit title never an industry title's twin; no address in the committed file; the committed file current; a Move
changes only that raw key's link (no other key, no retires file); a Remove keeps the raw key and its history; a move to
a canonical title not in the reference is refused; the bake leaves a removed title out. The nightly (S679): the newest
decision per title wins, no write when nothing changes, --live needs the key and writes no row, and the daily build
runs the apply after the unclassified fold and before the pipeline, fails loud, and rebuilds the file after the auditor.

Run from repo root: python3 tests/left_map_build_test.py
"""
import importlib.util
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def mod(name):
    spec = importlib.util.spec_from_file_location(name, os.path.join(ROOT, "kb", name + ".py"))
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


B, A = mod("_build_left_map"), mod("_apply_left_map")
results = []


def check(name, cond, detail=""):
    results.append(bool(cond))
    print(("PASS " if cond else "FAIL ") + name + ((" — " + str(detail)) if (detail and not cond) else ""))


check("graded and cert-based groups", B.group_of({"Credit By Exam", "Portfolio Review"}) == "graded" and B.group_of({"Industry Certification", "Military"}) == "cert"
      and B.group_of({"Credit By Exam", "Industry Certification"}) == "mixed" and B.group_of(set()) == "")
check("a mixed label lists its types", B.label({"Industry Certification", "Credit By Exam"}) == "Credit By Exam and Industry Certification (mixed)"
      and B.label(set()) == "CPL type not recorded")
check("a noncredit title is never an industry title's kind", B.kind("Noncredit for CNA") == "noncredit" and B.kind("Industry Training Evidence for CNA") == "industry")
text = open(os.path.join(ROOT, B.OUT), encoding="utf-8").read()
check("the committed file names no address", chr(64) not in text)
d = json.loads(text)
check("the committed file holds the auditor's 810 titles under 577 canonical titles", d["counts"]["titles"] == 810 and d["counts"]["credentials"] == 577, d["counts"])
check("the committed file is current", json.dumps(B.build(), indent=1, ensure_ascii=False) + "\n" == text)

ut = {"Old A": {"unified_title": "Brakes"}, "Old B": {"unified_title": "Brakes"}, "Live": {"unified_title": "Wheels"}}
rows = [{"course_id": "_LEFT_MAP::Old A", "value": "moved:Wheels", "reviewed_at": "2026-11-17T23:00:00Z"},
        {"course_id": "_LEFT_MAP::Old B", "value": "removed", "reviewed_at": "2026-11-17T23:00:00Z"},
        {"course_id": "_LEFT_MAP::Live", "value": "keep"},
        {"course_id": "_LEFT_MAP::Live", "value": "moved:Nowhere"}]
ch, sk = A.plan(ut, rows, {"Brakes", "Wheels"})
check("a Move and a Remove plan, a Keep changes nothing, an unknown target is refused",
      [c[1] for c in ch] == ["moved", "removed"] and len(sk) == 1 and "not in the reference" in sk[0][1], (ch, sk))
out = A.apply(json.loads(json.dumps(ut)), ch)
check("a Move re-points only that raw key", out["Old A"]["unified_title"] == "Wheels" and out["Old A"]["left_map"]["from"] == "Brakes" and out["Live"] == ut["Live"])
check("a Remove keeps the raw key, its link and its history, marked removed", out["Old B"]["unified_title"] == "Brakes" and out["Old B"]["left_map"]["decision"] == "removed")
check("applying twice changes nothing more", A.plan(out, rows, {"Brakes", "Wheels"})[0] == [])
body = open(os.path.join(ROOT, "kb", "_apply_left_map.py")).read().split('"""', 2)[2]
check("the apply never writes retires or articulations", "retires" not in body and "coci_articulations" not in body)
bake = open(os.path.join(ROOT, "excel_to_dashboard.py")).read()
check("the reference bake leaves a removed title out of its canonical's local titles", '(ent.get("left_map") or {}).get("decision") == "removed"' in bake)

# The nightly (S679, the lane's NEXT 1): the newest decision per title wins, nothing is written when nothing changes,
# --live needs the service key, the apply writes no Supabase row, and the daily build runs it in the right place.
newest = A.latest([{"course_id": "_LEFT_MAP::X", "value": "keep", "reviewed_at": "2026-11-17T10:00:00Z"},
                   {"course_id": "_LEFT_MAP::X", "value": "removed", "reviewed_at": "2026-11-18T10:00:00Z"},
                   {"course_id": "_LEFT_MAP::X", "value": "moved:Wheels", "reviewed_at": "2026-11-16T10:00:00Z"},
                   {"course_id": "_CREDENTIAL_REVIEW::X", "value": "keep"}])
check("the newest decision per title wins, and only _LEFT_MAP:: rows count", [r["value"] for r in newest] == ["removed"], newest)
import contextlib  # noqa: E402
import io  # noqa: E402
import tempfile  # noqa: E402
utp = os.path.join(ROOT, A.UT)
before = os.stat(utp).st_mtime_ns
with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as tf:
    json.dump([{"course_id": "_LEFT_MAP::no such local title here", "value": "removed"}], tf)
buf = io.StringIO()
with contextlib.redirect_stdout(buf):
    rc = A.main(["--rows", tf.name, "--apply"])
os.unlink(tf.name)
check("with nothing to change, --apply writes no file and no receipt", rc == 0 and os.stat(utp).st_mtime_ns == before and "no file written" in buf.getvalue(), buf.getvalue())
saved = os.environ.pop("SUPABASE_SERVICE_KEY", None)
try:
    A.fetch_live()
    refused = False
except SystemExit as e:
    refused = "SUPABASE_SERVICE_KEY" in str(e)
finally:
    if saved is not None:
        os.environ["SUPABASE_SERVICE_KEY"] = saved
check("--live refuses without the service key, never a silent empty read", refused)
check("the apply reads kb_curation and writes no row there", "Range" in body and "left_map_decision" in body
      and not any(w in body for w in ("method=", '"POST"', "'POST'", "Prefer", "PATCH", "DELETE")))

wf = open(os.path.join(ROOT, ".github", "workflows", "daily-dashboard.yml"), encoding="utf-8").read()
build_sh = open(os.path.join(ROOT, "scripts", "daily_build.sh"), encoding="utf-8").read()
full = wf.replace("run: bash scripts/daily_build.sh", "run: bash scripts/daily_build.sh\n" + build_sh, 1)
sync, fold = full.find('step "Sync curation overlay from Supabase"'), full.find("python kb/_fold_unclassified.py")
at, pipe = full.find("python kb/_apply_left_map.py --live --apply"), full.find('step "Run dashboard pipeline"')
check("the daily runs the apply in the curation sync, after the unclassified fold and before the pipeline bakes the reference",
      -1 < sync < fold < at < pipe, (sync, fold, at, pipe))
blk = full[at:full.find("\nSTEP", at)]
check("a failed apply is an ::error and records LEFT_MAP_STATUS=failed, never a bare echo",
      "::error title=Leftover-title decisions not applied::" in blk and 'LEFT_MAP_STATUS=failed" >> "$GITHUB_ENV"' in blk
      and 'LEFT_MAP_STATUS=success" >> "$GITHUB_ENV"' in blk, blk[:400])
aud, lb = full.find('step "Run exhibit-canonicalization auditor"'), full.find('step "Build the titles that have left MAP"')
cms = full.find('step "Build the Commons status"')
check("the leftover-title file rebuilds after the auditor and the apply, before the Commons status",
      -1 < at < aud < lb < cms and "python3 kb/_build_left_map.py" in full[lb:cms], (at, aud, lb, cms))
commit = full[full.find("name: Commit and push to main"):]
check("the daily commit carries the receipts and the leftover-title file",
      "git add kb/receipts/left_map_apply_*.json" in commit and "git add kb/exhibit_left_map.json" in commit and "kb/unified_titles.json" in commit)
push, summ = full.find("name: Commit and push to main"), full.find("name: Summary")
red = full.find("name: Fail the run when the leftover-title decisions did not apply")
tail = full[red:]
check("after the push and the summary, a last step turns the run red on LEFT_MAP_STATUS=failed",
      -1 < push < summ < red and "env.LEFT_MAP_STATUS == 'failed'" in tail[:600] and "exit 1" in tail[:900], red)
watch = open(os.path.join(ROOT, ".github", "workflows", "workflow-failure-watch.yml"), encoding="utf-8").read()
name = wf.split("\n", 1)[0].replace("name:", "").strip().strip('"')
check("the workflow failure watch lists the daily, so a red run opens its issue", '- "%s"' % name in watch, name)

print("\n%d/%d checks passed" % (sum(results), len(results)))
sys.exit(0 if all(results) else 1)
