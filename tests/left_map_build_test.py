#!/usr/bin/env python3
"""kb/_build_left_map.py and kb/_apply_left_map.py: the leftover-title decisions (S678, COBIx's item 2 on #3464).

Guards: Sam's two groups (graded = Credit By Exam + Portfolio Review; cert-based = the other four) and a mixed label;
a noncredit title never an industry title's twin; no address in the committed file; the committed file current; a Move
changes only that raw key's link (no other key, no retires file); a Remove keeps the raw key and its history; a move to
a canonical title not in the reference is refused; the bake leaves a removed title out. The nightly (S679): the newest
decision per title wins, no write when nothing changes, --live needs the key and writes no row, and the daily build
runs the apply after the unclassified fold and before the pipeline, fails loud, and rebuilds the file after the auditor.
The second reader's findings (S679): the rebuild fallback writes back the first pass's LEFT_MAP_STATUS; a newer keep
undoes a Move or a Remove; a Move on a used title is held; HTTP 416 ends the read; receipts are named to the second;
kb/unified_titles.json is written atomically.

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

# The second reader's findings on #3477 (S679).
# (2) The input-rebuild fallback pushes the first build, so it writes back the first pass's LEFT_MAP_STATUS beside the
#     scrape status; the rebuild's own value would turn the run green over a failed apply, or red over a good one.
import subprocess  # noqa: E402
import urllib.error  # noqa: E402
cap = next((ln.strip() for ln in wf.splitlines() if "first_status=${LIVE_METRICS_STATUS" in ln), "")
res = next((ln.strip() for ln in wf.splitlines() if 'echo "LIVE_METRICS_STATUS=$first_status"' in ln), "")


def fallback_status(first, rebuild):
    """Run the workflow's own capture and restore lines around a rebuild that wrote its own status; the value the
    later steps read is the last LEFT_MAP_STATUS line in GITHUB_ENV."""
    with tempfile.TemporaryDirectory() as td:
        genv = os.path.join(td, "env")
        open(genv, "w").close()
        script = "set -eu\n%s\necho \"LEFT_MAP_STATUS=%s\" >> \"$GITHUB_ENV\"\n%s\n" % (cap, rebuild, res)
        env = dict(os.environ, GITHUB_ENV=genv, LEFT_MAP_STATUS=first, LIVE_METRICS_STATUS="success", SCRAPE_DETAIL="")
        subprocess.run(["bash", "-c", script], env=env, check=True, capture_output=True)
        vals = [ln.split("=", 1)[1] for ln in open(genv).read().splitlines() if ln.startswith("LEFT_MAP_STATUS=")]
        return vals[-1] if vals else None


check("the rebuild fallback writes back the first pass's LEFT_MAP_STATUS: failed stays failed (no false green)",
      bool(cap and res) and fallback_status("failed", "success") == "failed", (cap, res))
check("the rebuild fallback writes back the first pass's LEFT_MAP_STATUS: success stays success (no false red)",
      bool(cap and res) and fallback_status("success", "failed") == "success", (cap, res))
step = wf[wf.find("name: Commit and push to main"):]
check("the status is saved before the first build is staged and restored in the failed-rebuild branch, after its reset",
      -1 < step.find("first_left=${LEFT_MAP_STATUS:-}") < step.find("\n          stage\n") < step.find("if ! daily_rebuild; then")
      < step.find('git reset -q --hard "$pre"\n              { echo "LIVE_METRICS_STATUS=$first_status"') < step.find('echo "LEFT_MAP_STATUS=$first_left"'))

# (3) The undo holds: the newest decision wins, so a newer keep after a Move or a Remove restores left_map.from and
#     drops the marker, and a Remove after a Move keeps the original from.
ut3 = {"M": {"unified_title": "Brakes"}, "R": {"unified_title": "Brakes"}, "MR": {"unified_title": "Brakes"}}
cans = {"Brakes", "Wheels"}
step1 = [{"course_id": "_LEFT_MAP::M", "value": "moved:Wheels", "reviewed_at": "2026-11-17T01:00:00Z"},
         {"course_id": "_LEFT_MAP::R", "value": "removed", "reviewed_at": "2026-11-17T01:00:00Z"},
         {"course_id": "_LEFT_MAP::MR", "value": "moved:Wheels", "reviewed_at": "2026-11-17T01:00:00Z"}]
s1 = A.apply(json.loads(json.dumps(ut3)), A.plan(ut3, A.latest(step1), cans)[0])
step2 = step1 + [{"course_id": "_LEFT_MAP::M", "value": "keep", "reviewed_at": "2026-11-18T01:00:00Z"},
                 {"course_id": "_LEFT_MAP::R", "value": "keep", "reviewed_at": "2026-11-18T01:00:00Z"},
                 {"course_id": "_LEFT_MAP::MR", "value": "removed", "reviewed_at": "2026-11-18T01:00:00Z"}]
ch2 = A.plan(s1, A.latest(step2), cans | {"Wheels"})[0]
s2 = A.apply(json.loads(json.dumps(s1)), ch2)
check("a newer keep after a Move restores left_map.from and drops the marker",
      s2["M"] == {"unified_title": "Brakes"}, s2["M"])
check("a newer keep after a Remove drops the marker", s2["R"] == {"unified_title": "Brakes"}, s2["R"])
check("a Remove after a Move keeps the original from, so a later keep goes all the way back",
      s2["MR"]["left_map"]["decision"] == "removed" and s2["MR"]["left_map"]["from"] == "Brakes" and s2["MR"]["unified_title"] == "Wheels", s2["MR"])
mr = [c for c in ch2 if c[0] == "MR"][0]
check("each change carries the marker it replaced, for the receipt's before_left_map",
      mr[5] == {"decision": "moved", "from": "Brakes", "at": "2026-11-17T01:00:00Z"}, mr)
s3 = A.apply(json.loads(json.dumps(s2)), A.plan(s2, [{"course_id": "_LEFT_MAP::MR", "value": "keep", "reviewed_at": "2026-11-19T00:00:00Z"}], cans)[0])
check("a keep after a Move then a Remove restores the link the title had before either", s3["MR"] == {"unified_title": "Brakes"}, s3["MR"])
check("applying the same decisions again changes nothing more", A.plan(s2, A.latest(step2), cans)[0] == [])
check("the docstring's undo is a newer keep, and says a git revert alone is redone",
      "save a newer keep" in A.__doc__ and "does not hold" in A.__doc__ and "git revert" in A.__doc__)

# (4) The conductor's call: a Move applies only to a title nothing uses; a saved Move on a used title is held and logged.
ut4 = {"Used": {"unified_title": "Brakes"}, "Free": {"unified_title": "Brakes"}}
mv4 = [{"course_id": "_LEFT_MAP::Used", "value": "moved:Wheels"}, {"course_id": "_LEFT_MAP::Free", "value": "moved:Wheels"}]
ch4, sk4 = A.plan(ut4, mv4, cans, frozenset({"Used"}))
check("a Move on a used title is held with its reason; one on an unused title applies",
      [c[0] for c in ch4] == ["Free"] and len(sk4) == 1 and sk4[0][0] == "Used" and sk4[0][1].startswith("held:"), (ch4, sk4))
committed_used = A.used_titles()
check("the used set comes from the committed kb/exhibit_left_map.json (446 used of 810)", len(committed_used) == d["counts"]["still_used"], len(committed_used))

# (5) A Range past the end (HTTP 416) is the end of the rows; receipts are named to the second, with a suffix when
#     taken; kb/unified_titles.json is written through a temp file renamed into place.


class _Resp:
    def __init__(self, rows):
        self.b = json.dumps(rows).encode()

    def read(self, *a):
        b, self.b = self.b, b""
        return b

    def __enter__(self):
        return self

    def __exit__(self, *a):
        return False


def _opener(pages):
    seen = []

    def op(req, timeout=None):
        seen.append(req.get_header("Range"))
        rows = pages.get(req.get_header("Range"))
        if rows is None:
            raise urllib.error.HTTPError(req.full_url, 416, "Range Not Satisfiable", {}, None)
        return _Resp(rows)
    return op, seen


os.environ["SUPABASE_SERVICE_KEY"] = "test-key"
try:
    op, seen = _opener({"0-1": [{"course_id": "_LEFT_MAP::a"}, {"course_id": "_LEFT_MAP::b"}]})
    got = A.fetch_live(page_size=2, opener=op)
    check("HTTP 416 on the next page ends the read with the rows already read, never an error",
          [r["course_id"] for r in got] == ["_LEFT_MAP::a", "_LEFT_MAP::b"] and seen == ["0-1", "2-3"], (got, seen))
finally:
    if saved is not None:
        os.environ["SUPABASE_SERVICE_KEY"] = saved
    else:
        os.environ.pop("SUPABASE_SERVICE_KEY", None)

real_root = A.ROOT
with tempfile.TemporaryDirectory() as td:
    A.ROOT = td
    try:
        os.makedirs(os.path.join(td, "kb", "receipts"))
        import datetime  # noqa: E402
        when = datetime.datetime(2026, 11, 18, 1, 2, 3, tzinfo=datetime.timezone.utc)
        st, p1 = A.receipt_path(when)
        open(p1, "w").close()
        _, p2 = A.receipt_path(when)
        open(p2, "w").close()
        _, p3 = A.receipt_path(when)
        check("receipts are named to the second, with _2, _3 when that name is taken",
              st == "2026-11-18T010203Z" and os.path.basename(p1) == "left_map_apply_2026-11-18T010203Z.json"
              and os.path.basename(p2) == "left_map_apply_2026-11-18T010203Z_2.json"
              and os.path.basename(p3) == "left_map_apply_2026-11-18T010203Z_3.json", (p1, p2, p3))
        target = os.path.join(td, "kb", "x.json")
        with open(target, "w") as f:
            f.write("old\n")
        real_replace = os.replace

        def boom(a, b):
            raise OSError("disk full")
        os.replace = boom
        try:
            A.write_atomic(target, "new\n")
            raised = False
        except OSError:
            raised = True
        finally:
            os.replace = real_replace
        left = [n for n in os.listdir(os.path.dirname(target)) if n.startswith(".tmp_")]
        check("a write that fails before the rename leaves the old file whole and no temp file behind",
              raised and open(target).read() == "old\n" and not left, (raised, left))
        # The whole apply, end to end, on a scratch tree.
        for n in os.listdir(os.path.join(td, "kb", "receipts")):
            os.unlink(os.path.join(td, "kb", "receipts", n))
        with open(os.path.join(td, "kb", "unified_titles.json"), "w") as f:
            json.dump({"Old A": {"unified_title": "Brakes"}, "Used B": {"unified_title": "Brakes"}, "Live": {"unified_title": "Wheels"}}, f)
        with open(os.path.join(td, "kb", "exhibit_left_map.json"), "w") as f:
            json.dump({"titles": {"Old A": {"used": False}, "Used B": {"used": True}}}, f)
        rowsf = os.path.join(td, "rows.json")
        with open(rowsf, "w") as f:
            json.dump([{"course_id": "_LEFT_MAP::Old A", "value": "moved:Wheels", "reviewed_at": "t1"},
                       {"course_id": "_LEFT_MAP::Used B", "value": "moved:Wheels", "reviewed_at": "t1"}], f)
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            rc = A.main(["--rows", rowsf, "--apply"])
        out_ut = json.load(open(os.path.join(td, "kb", "unified_titles.json")))
        recs = os.listdir(os.path.join(td, "kb", "receipts"))
        rec = json.load(open(os.path.join(td, "kb", "receipts", recs[0]))) if len(recs) == 1 else {}
        check("end to end: the unused title moves, the used one is held and logged, the receipt carries before_left_map",
              rc == 0 and out_ut["Old A"]["unified_title"] == "Wheels" and out_ut["Used B"] == {"unified_title": "Brakes"}
              and "held:" in buf.getvalue() and [c["raw"] for c in rec.get("changes", [])] == ["Old A"]
              and rec["changes"][0]["before_left_map"] is None
              and not [n for n in os.listdir(os.path.join(td, "kb")) if n.startswith(".tmp_")], (rc, out_ut, recs, buf.getvalue()))
        # (5, the third reader) A write of kb/unified_titles.json that fails takes its receipt with it: no receipt names a
        # change that did not land, and the file stays as it was.
        for n in os.listdir(os.path.join(td, "kb", "receipts")):
            os.unlink(os.path.join(td, "kb", "receipts", n))
        with open(os.path.join(td, "kb", "unified_titles.json"), "w") as f:
            json.dump({"Old A": {"unified_title": "Brakes"}, "Live": {"unified_title": "Wheels"}}, f)
        before_text = open(os.path.join(td, "kb", "unified_titles.json")).read()
        os.replace = boom
        try:
            with contextlib.redirect_stdout(io.StringIO()):
                A.main(["--rows", rowsf, "--apply"])
            failed_loud = False
        except OSError:
            failed_loud = True
        finally:
            os.replace = real_replace
        check("(5) a failed write of the file deletes its receipt, leaves the file whole and fails loud",
              failed_loud and os.listdir(os.path.join(td, "kb", "receipts")) == []
              and open(os.path.join(td, "kb", "unified_titles.json")).read() == before_text,
              (failed_loud, os.listdir(os.path.join(td, "kb", "receipts"))))
    finally:
        A.ROOT = real_root

# (4, the third reader) A keep whose left_map.from is no longer a canonical title is held and logged, never restored.
ut6 = {"Gone": {"unified_title": "Wheels", "left_map": {"decision": "moved", "from": "Old Brakes", "at": "t1"}},
       "Here": {"unified_title": "Wheels", "left_map": {"decision": "moved", "from": "Brakes", "at": "t1"}},
       "Other": {"unified_title": "Brakes"}}
keeps = [{"course_id": "_LEFT_MAP::Gone", "value": "keep", "reviewed_at": "t2"}, {"course_id": "_LEFT_MAP::Here", "value": "keep", "reviewed_at": "t2"}]
cans6 = {e["unified_title"] for e in ut6.values()}
ch6, sk6 = A.plan(ut6, keeps, cans6)
check("(4) a keep whose from is no longer a canonical title is held and logged; one whose from is still one restores it",
      [c[0] for c in ch6] == ["Here"] and ch6[0][3] == "Brakes" and len(sk6) == 1 and sk6[0][0] == "Gone"
      and sk6[0][1].startswith("held:") and "Old Brakes" in sk6[0][1], (ch6, sk6))

# (4) The reviewed rename apply renames left_map.from with its canonical title, and its undo puts it back.
R = mod("_cred_rename_apply")
U = mod("_cred_rename_undo")
real_ut = R.UNIFIED_TITLES
with tempfile.TemporaryDirectory() as td:
    R.UNIFIED_TITLES = os.path.join(td, "unified_titles.json")
    try:
        with open(R.UNIFIED_TITLES, "w") as f:
            json.dump({"Moved": {"unified_title": "Wheels", "left_map": {"decision": "moved", "from": "Brakes", "at": "t1"}},
                       "Removed": {"unified_title": "Brakes", "left_map": {"decision": "removed", "from": "Brakes", "at": "t1"}},
                       "Plain": {"unified_title": "Brakes"}, "Elsewhere": {"unified_title": "Wheels",
                                                                            "left_map": {"decision": "moved", "from": "Rims", "at": "t1"}}}, f)
        res = R.rewrite_unified_titles_values({"Brakes": "Brake Systems"})
        got = json.load(open(R.UNIFIED_TITLES))
        check("(4) the rename apply renames left_map.from with the unified_title, and only where it names the old title",
              got["Moved"] == {"unified_title": "Wheels", "left_map": {"decision": "moved", "from": "Brake Systems", "at": "t1"}}
              and got["Removed"]["unified_title"] == "Brake Systems" and got["Removed"]["left_map"]["from"] == "Brake Systems"
              and got["Plain"]["unified_title"] == "Brake Systems" and got["Elsewhere"]["left_map"]["from"] == "Rims"
              and res["_left_map_from"] == {"Moved": {"before": "Brakes", "after": "Brake Systems"},
                                            "Removed": {"before": "Brakes", "after": "Brake Systems"}}, (got, res.get("_left_map_from")))
        cans7 = {e["unified_title"] for e in got.values()}
        ch7, sk7 = A.plan(got, [{"course_id": "_LEFT_MAP::Moved", "value": "keep", "reviewed_at": "t2"}], cans7)
        check("(4) after the rename, a keep restores the link to the canonical title's new name",
              [(c[0], c[3]) for c in ch7] == [("Moved", "Brake Systems")] and not sk7, (ch7, sk7))
        undo = {"unified_titles": res["_changed"], "unified_titles_left_map_from": res["_left_map_from"], "groups": {"Brake Systems": ["Brakes"]}}
        changes, drift, _ = U.plan_undo(undo, {}, got, [])
        U.apply_undo(changes, {}, got, [])
        check("(4) the rename's undo puts left_map.from back with the unified_title",
              not drift and got["Moved"]["left_map"]["from"] == "Brakes" and got["Removed"]["left_map"]["from"] == "Brakes"
              and got["Removed"]["unified_title"] == "Brakes" and got["Plain"]["unified_title"] == "Brakes", (drift, got))
        apply_src = open(os.path.join(ROOT, "kb", "_cred_rename_apply.py"), encoding="utf-8").read()
        check("(4) the apply's undo receipt carries the left_map.from renames", '"unified_titles_left_map_from": ut_res["_left_map_from"]' in apply_src)
    finally:
        R.UNIFIED_TITLES = real_ut

# A credential rename rewrites unified_titles.json and coci_articulations.json, which this file is built from: the
# 2026-11-18 apply left it stale and main's tests red until S679 rebuilt it. The rename workflow rebuilds and commits it.
rw = open(os.path.join(ROOT, ".github", "workflows", "cred-rename-apply.yml"), encoding="utf-8").read()
rb = rw[rw.index("name: Rebuild the files derived from the credential keys"):]
rb = rb[:rb.index("- name:", 10)]
rc = rw[rw.index("name: Commit + push"):]
check("the rename workflow rebuilds the leftover-title file with the files derived from the credential keys, and commits it",
      "python3 kb/_build_left_map.py" in rb and "kb/exhibit_left_map.json" in rc[:rc.index("git diff --cached")])

print("\n%d/%d checks passed" % (sum(results), len(results)))
sys.exit(0 if all(results) else 1)
