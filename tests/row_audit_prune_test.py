#!/usr/bin/env python3
"""kb/_row_audit_prune.py: the newest 14 row audit reports stay, older ones leave only once indexed (#3476 step 5).

Guards the failure modes: a report removed with no stored, read-back copy; latest.json or a recent report
removed; a store failure that fails the daily dashboard run.
Run: python3 tests/row_audit_prune_test.py
"""
import contextlib
import io
import os
import shutil
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _receipt_store as RS  # noqa: E402
import _row_audit_prune as P  # noqa: E402

results = []
TMP = tempfile.mkdtemp(prefix="row_audit_prune_")


def check(name, cond, why=""):
    results.append((name, bool(cond), why))


class FakeStore:
    def __init__(self, fail_put=False, fail_get=False, corrupt=False):
        self.objects, self.fail_put, self.fail_get, self.corrupt = {}, fail_put, fail_get, corrupt

    def put(self, obj, data):
        if self.fail_put:
            raise OSError("upload refused")
        if obj in self.objects:
            return "exists"
        self.objects[obj] = data
        return "stored"

    def get(self, obj):
        if self.fail_get:
            raise OSError("read refused")
        data = self.objects[obj]
        return data + b"x" if self.corrupt else data


def days(n):
    return ["2026-%02d-%02d.md" % (10 + i // 28, 1 + i % 28) for i in range(n)]


def fixture(n=20):
    d = tempfile.mkdtemp(dir=TMP)
    folder, index = os.path.join(d, "row_audit"), os.path.join(d, "index")
    os.makedirs(folder)
    for name in days(n):
        with open(os.path.join(folder, name), "w") as f:
            f.write("# report %s\nline\n" % name)
    with open(os.path.join(folder, "latest.json"), "w") as f:
        f.write("{}")
    with open(os.path.join(folder, "notes.md"), "w") as f:
        f.write("not a dated report")
    return folder, index


def quiet(fn, *a, **k):
    with contextlib.redirect_stdout(io.StringIO()):
        return fn(*a, log=lambda *_: None, **k)


# 1. The newest 14 and latest.json stay; the six older go, each with a sound entry and the bucket's copy.
folder, index = fixture(20)
store = FakeStore()
res = quiet(P.prune, folder, storage=store, index_path=index)
left = sorted(os.listdir(folder))
check("the prune keeps exactly the newest 14 dated reports, latest.json and the undated file",
      left == sorted(days(20)[6:] + ["latest.json", "notes.md"]), left)
check("the six older reports are removed", sorted(res["removed"]) == days(20)[:6] and not res["stayed"], res)
entries = RS.load_index(index)["receipts"]
check("each removed report has a sound row_audit entry at row_audit/row_audit_<date>.md",
      len(entries) == 6 and all(not RS.entry_problems(e) and e["object"] == "row_audit/" + e["name"]
                                and e["kind"] == "row_audit" for e in entries), entries[:1])
check("the bucket holds each removed report's bytes", len(store.objects) == 6
      and all(RS.sha256_bytes(store.objects[e["object"]]) == e["sha256"] for e in entries))

# 2. A store failure removes nothing: the upload, the read-back, or a read-back with other bytes.
for label, kw in (("the upload fails", {"fail_put": True}), ("the read-back fails", {"fail_get": True}),
                  ("the read-back holds other bytes", {"corrupt": True})):
    folder, index = fixture(20)
    res = quiet(P.prune, folder, storage=FakeStore(**kw), index_path=index)
    check("nothing is removed when %s" % label,
          len(os.listdir(folder)) == 22 and not res["removed"] and len(res["stayed"]) == 6
          and not RS.load_index(index)["receipts"], res)

# 3. Nothing without an index entry is removed; an entry with a matching sha256 is enough on its own.
folder, index = fixture(20)
res = quiet(P.prune, folder, storage=None, index_path=index)
check("with no key and no entries, nothing is removed", len(os.listdir(folder)) == 22 and not res["removed"], res)
quiet(P.prune, os.path.join(*os.path.split(fixture(20)[0])), storage=FakeStore(), index_path=index)  # files entries
res = quiet(P.prune, folder, storage=None, index_path=index)
check("a report whose entry names its sha256 is removed with no upload",
      sorted(res["removed"]) == days(20)[:6], res)
folder, _ = fixture(20)
with open(os.path.join(folder, days(20)[0]), "a") as f:
    f.write("edited\n")
res = quiet(P.prune, folder, storage=None, index_path=index)
check("a report whose entry names other bytes stays", days(20)[0] in os.listdir(folder)
      and days(20)[0] in res["stayed"] and len(res["removed"]) == 5, res)

# 4. The daily run's limits: at most --max-store uploads, and an entry for each.
folder, index = fixture(20)
res = quiet(P.prune, folder, storage=FakeStore(), index_path=index, max_store=2)
check("--max-store 2 uploads two and leaves the rest in place", len(res["removed"]) == 2 and len(res["stayed"]) == 4
      and len(os.listdir(folder)) == 20, res)

# 5. The exit code: 0 on a store failure without --strict, 1 with it.
folder, index = fixture(16)
env_key = os.environ.get("SUPABASE_SERVICE_KEY")
os.environ.pop("SUPABASE_SERVICE_KEY", None)
with contextlib.redirect_stdout(io.StringIO()):
    rc_daily = P.main(["--folder", folder])
    rc_strict = P.main(["--folder", folder, "--strict"])
check("without --strict the prune exits 0 when reports stay", rc_daily == 0, rc_daily)
check("with --strict (the one-time move) it exits 1 when reports stay", rc_strict == 1, rc_strict)
if env_key is not None:
    os.environ["SUPABASE_SERVICE_KEY"] = env_key

# 6. The daily build's own block, run through its `step` wrapper against a bucket that refuses every call:
#    the block exits 0, so the daily run's exit code is unchanged, and every report stays.
src = open(os.path.join(ROOT, "scripts", "daily_build.sh"), encoding="utf-8").read()
start = src.index('step "Keep the newest 14 row audit reports" SUPABASE_SERVICE_KEY <<\'STEP\'\n')
block = src[start:src.index("\nSTEP\n", start) + len("\nSTEP\n")]
check("the daily build runs the prune after the auditor writes the day's report",
      src.index("python3 kb/_row_audit.py") < start and "|| echo" in block, block)
for label, script in (("the bucket refuses every call", None),
                      ("the prune itself crashes", "raise SystemExit(7)\n")):
    work = tempfile.mkdtemp(dir=TMP)
    os.makedirs(os.path.join(work, "kb"))
    for fn in ("_receipt_store.py", "_row_audit_prune.py"):
        shutil.copy(os.path.join(ROOT, "kb", fn), os.path.join(work, "kb", fn))
    if script:
        with open(os.path.join(work, "kb", "_row_audit_prune.py"), "w") as f:
            f.write(script)
    shutil.copytree(fixture(15)[0], os.path.join(work, "kb", "row_audit"))
    sh = ("DAILY_BUILD_FUNCTIONS_ONLY=1; . %s\n%s\necho DAILY_RC=$?\n"
          % (os.path.join(ROOT, "scripts", "daily_build.sh"), block))
    env = dict(os.environ, SUPABASE_SERVICE_KEY="k", SUPABASE_URL="http://127.0.0.1:9")
    p = subprocess.run(["bash", "-e", "-c", sh], cwd=work, env=env, capture_output=True, text=True, timeout=120)
    check("the daily block exits 0 when %s" % label, p.returncode == 0 and "DAILY_RC=0" in p.stdout,
          (p.returncode, p.stdout[-400:], p.stderr[-400:]))
    check("every report stays when %s" % label, len(os.listdir(os.path.join(work, "kb", "row_audit"))) == 17)

# 6b. The budget is a bound (second reader M1): against a server that accepts and never answers, a 3 s budget
#     ends the run in about 3 s, with one try a call and every report in place.
import http.server  # noqa: E402
import socketserver  # noqa: E402
import threading  # noqa: E402
import time  # noqa: E402


class Hang(http.server.BaseHTTPRequestHandler):
    def do_POST(self):
        time.sleep(30)

    do_GET = do_POST

    def log_message(self, *a):
        pass


srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), Hang)
srv.daemon_threads = True
threading.Thread(target=srv.serve_forever, daemon=True).start()
url = "http://127.0.0.1:%d" % srv.server_address[1]
calls = []
real_open = __import__("urllib.request").request.urlopen


def counting(req, timeout=None):
    calls.append(timeout)
    return real_open(req, timeout=timeout)


folder, index = fixture(20)
t0 = time.monotonic()
bounded = P.BoundedStorage("k", time.monotonic() + 3, url=url, opener=counting)
res = quiet(P.prune, folder, storage=bounded, index_path=index, budget_seconds=3)
took = time.monotonic() - t0
check("a 3 s budget against a hung bucket ends the run within 5 s (took %.1f s)" % took, took < 5, took)
check("each call gets one try with a timeout no longer than the budget left",
      calls and len(calls) <= 2 and all(t <= 3 for t in calls), calls)
check("every report stays when the budget runs out", len(os.listdir(folder)) == 22 and not res["removed"], res)
srv.shutdown()
check("the daily block bounds the process with timeout and the calls with --budget-seconds",
      "timeout 200 python3 kb/_row_audit_prune.py" in block and "--budget-seconds 180" in block, block)

# 6c. A report fetched back into kb/receipts/ is ignored by git (second reader M2).
ign = subprocess.run(["git", "check-ignore", "-q", "kb/receipts/row_audit_2026-05-23.md"], cwd=ROOT)
keep = subprocess.run(["git", "check-ignore", "-q", "kb/receipts/index/row_audit_2026-05-23.md.json"], cwd=ROOT)
check("git ignores a fetched report in kb/receipts/ and still tracks its index entry",
      ign.returncode == 0 and keep.returncode == 1, (ign.returncode, keep.returncode))

# 7. The daily commit stages the removals and the entries; the index check accepts the new kind.
wf = open(os.path.join(ROOT, ".github", "workflows", "daily-dashboard.yml"), encoding="utf-8").read()
check("the daily commit stages removed reports and their entries by quoted pathspec",
      "git add -A -- 'kb/row_audit/*.md' 'kb/receipts/index/row_audit_*.json'" in wf)
bad = dict(entries[0], name="2026-10-01.md", object="row_audit/2026-10-01.md")
check("an entry not named row_audit_<date>.md is refused", RS.entry_problems(bad))
check("an entry whose built is not its name's date is refused", RS.entry_problems(dict(entries[0], built="2020-01-01")))

shutil.rmtree(TMP, ignore_errors=True)
failed = [r for r in results if not r[1]]
for name, ok, why in results:
    print(("PASS " if ok else "FAIL ") + name + ("" if ok else "  -- %s" % (why,))[:500])
print("%d/%d passed" % (len(results) - len(failed), len(results)))
sys.exit(1 if failed else 0)
