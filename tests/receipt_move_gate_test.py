#!/usr/bin/env python3
"""No display receipt leaves the tree unstored (S680, #3476 Part 4 step 4).

WHY. The 141 display receipts committed before S680 move to the private cpl-receipts
bucket in one PR: a one-time runner stores each and files its index entry
(kb/_receipt_move_display.py, .github/workflows/receipt-move.yml), then a later commit
removes them with `git rm`. The failures this pins:

  * a file removed that was never stored, or stored from other bytes than the tree's:
    the live gate below compares the base branch's tree with this one, and every
    display receipt the base tracks that this tree lacks must have an entry naming
    that path's git blob (and, where the blob is on disk, its sha256);
  * a plain .sql over the bucket's 50 MB stored as it is: the move gzips it, and the
    entry names both the stored object's sha256 and the repo file's;
  * a fetch or an apply that hands back the gzipped bytes instead of the receipt;
  * a re-run that stores everything again, or a display run's earlier entry that the
    move cannot complete with the repo file's identity;
  * the move workflow committing anything but index entries.

The live gate needs the base tree: in GitHub Actions it fetches main's trees alone
(--filter=blob:none, so no receipt is downloaded); in a session it reads origin/main
when that ref exists, and says so when it does not. RECEIPT_GATE_BASE names another.

Run from the repo root: python3 tests/receipt_move_gate_test.py
"""
import gzip
import json
import os
import shutil
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _receipt_store as S  # noqa: E402
import _receipt_move_display as M  # noqa: E402
import _program_requirements_display_apply as A  # noqa: E402

passed = 0


def check(cond, why):
    global passed
    if not cond:
        print("FAIL: " + why)
        sys.exit(1)
    passed += 1


def stmt(college, cn, display):
    lit = json.dumps(display).replace("'", "''")
    return ("insert into public.program_requirement_records (college, control_number, program_title, measure, "
            "record, checks, display) select r.college, r.control_number, r.program_title, r.measure, r.record, "
            "r.checks, '%s'::jsonb from public.program_requirement_records r where r.college = '%s' and "
            "r.control_number = '%s' on conflict (college, control_number) do update set display = "
            "excluded.display;" % (lit, college, cn))


class Bucket:
    def __init__(self):
        self.objects, self.puts = {}, []

    def put(self, obj, data):
        self.puts.append(obj)
        if obj in self.objects:
            return "exists"
        self.objects[obj] = data
        return "stored"

    def get(self, obj):
        if obj not in self.objects:
            raise OSError("404 %s" % obj)
        return self.objects[obj]


FULL_GZ = "program_requirement_records_display_2026-11-13_cdd185495ce4.sql.gz"
FULL_SQL = "program_requirement_records_display_2026-10-06_5be53871ebf4.sql"
DELTA = "program_requirement_records_display_2026-10-08_5be53871ebf4_s347_delta.sql"
DATED = "program_requirement_records_display_2026-10-04.sql"
APPLIED = "program_requirement_records_display_2026-11-13_cdd185495ce4.applied_44003384689.json"

# ---- tracked(): display receipts only, with their kind, blob and size.
listing = "\n".join(["100644 blob %s %d\tkb/receipts/%s" % ("a" * 40, 10, FULL_GZ),
                     "100644 blob %s %d\tkb/receipts/%s" % ("b" * 40, 11, FULL_SQL),
                     "100644 blob %s %d\tkb/receipts/%s" % ("c" * 40, 12, DELTA),
                     "100644 blob %s %d\tkb/receipts/%s" % ("d" * 40, 13, DATED),
                     "100644 blob %s %d\tkb/receipts/%s" % ("e" * 40, 14, APPLIED),
                     "100644 blob %s %d\tkb/receipts/index/%s.json" % ("f" * 40, 15, FULL_GZ),
                     "100644 blob %s %d\tkb/receipts/program_requirement_records_load_2026-10-04.sql" % ("0" * 40, 9)])
got = M.tracked(listing)
check([(x["name"], x["kind"], x["blob"][0], x["size"]) for x in got] == [
    (FULL_GZ, S.DISPLAY_KIND, "a", 10), (FULL_SQL, S.DISPLAY_KIND, "b", 11),
    (DELTA, "program_requirement_records_display_delta", "c", 12),
    (DATED, "program_requirement_records_display_dated", "d", 13)],
      "tracked() lists the full, delta and date-only receipts with their kinds, and no applied record, index "
      "entry or other receipt: %s" % [(x["name"], x["kind"]) for x in got])
check(M.build_of(FULL_SQL, S.DISPLAY_KIND) == ("5be53871ebf4", "2026-10-06")
      and M.build_of(DELTA, "program_requirement_records_display_delta") == ("5be53871ebf4", "2026-10-08")
      and M.build_of(DATED, "program_requirement_records_display_dated") == (None, "2026-10-04"),
      "each kind's build and date come from its name; a date-only receipt names no build")

tmp = tempfile.mkdtemp()
try:
    root = os.path.join(tmp, "repo")
    rec = os.path.join(root, "kb", "receipts")
    os.makedirs(rec)
    index = os.path.join(rec, "index")
    texts = {
        FULL_GZ: "-- build cdd185495ce4\n" + stmt("Cerritos College", "02201", {"build": "cdd185495ce4"}) + "\n",
        FULL_SQL: "-- build 5be53871ebf4\n" + "\n".join(stmt("College A", "%05d" % i, {"build": "5be53871ebf4"})
                                                       for i in range(3)) + "\n",
        DELTA: "-- a delta\n" + stmt("College A", "00001", {"build": "5be53871ebf4"}) + "\n",
        DATED: "-- the first build\n" + stmt("College A", "00002", {"build": "1234567890ab"}) + "\n",
    }
    raw = {}
    for n, t in texts.items():
        raw[n] = gzip.compress(t.encode(), mtime=0) if n.endswith(".gz") else t.encode()
        open(os.path.join(rec, n), "wb").write(raw[n])
    items = [{"path": "kb/receipts/" + n, "name": n, "blob": S.git_blob(b), "kind": S.kind_of(n), "size": len(b)}
             for n, b in raw.items()]
    bucket = Bucket()
    logs = []
    tally = M.move(items, bucket, root=root, index_path=index, run="44300000001", workers=3, log=logs.append)
    check(tally["stored"] == 4 and not tally["failed"], "the move stores all four: %s %s" % (dict(tally), logs[-3:]))
    e = {n: S.read_entry(n, index) for n in raw}
    check(all(S.entry_problems(x) == [] for x in e.values()), "every moved entry is sound: %s"
          % {n: S.entry_problems(x) for n, x in e.items()})
    check(sorted(os.listdir(index)) == sorted(n + ".json" for n in raw), "one entry file a receipt")
    p = e[FULL_SQL]
    check(p["gzip"] is True and p["object"] == "display/" + FULL_SQL + ".gz"
          and bucket.objects[p["object"]] == gzip.compress(raw[FULL_SQL], compresslevel=9, mtime=0)
          and p["sha256"] == S.sha256_bytes(bucket.objects[p["object"]]) and p["bytes"] == len(bucket.objects[p["object"]])
          and p["repo_sha256"] == S.sha256_bytes(raw[FULL_SQL]) and p["repo_bytes"] == len(raw[FULL_SQL])
          and p["repo_blob"] == S.git_blob(raw[FULL_SQL]) and p["rows"] == 3,
          "a plain .sql is gzipped to be stored, and its entry names the object's sha256 and size and the repo "
          "file's sha256, size and blob")
    g = e[FULL_GZ]
    check("gzip" not in g and g["object"] == "display/" + FULL_GZ and g["repo_sha256"] == g["sha256"]
          and g["repo_blob"] == S.git_blob(raw[FULL_GZ]), "a gzipped receipt is stored as it is")
    check(e[DELTA]["object"] == "display/delta/" + DELTA + ".gz" and e[DELTA]["build"] == "5be53871ebf4"
          and e[DATED]["object"] == "display/dated/" + DATED + ".gz" and e[DATED]["build"] is None,
          "a delta and a date-only receipt take their own kinds and folders")
    # A fetch and the apply hand back the receipt as the repo held it.
    out = os.path.join(tmp, "out")
    check(open(S.fetch(FULL_SQL, bucket, out=out, index_path=index, log=logs.append), "rb").read() == raw[FULL_SQL],
          "fetch gunzips a gzipped store back to the repo file's bytes")
    st = A.stored_receipt(None, name=FULL_SQL, fetch=bucket.get, folder=rec, index_path=index)
    check(A.parse(A.read_receipt(st["local"])) == A.parse(texts[FULL_SQL]) and st["repo"] == os.path.join(rec, FULL_SQL),
          "the apply re-applies a moved plain receipt from its gzipped object")
    os.remove(st["local"])
    bad = dict(e[FULL_SQL], repo_sha256="0" * 64)
    try:
        S.file_bytes(bad, bucket.objects[bad["object"]])
        check(False, "bytes that unpack to another sha256 than repo_sha256 are refused")
    except SystemExit:
        check(True, "bytes that unpack to another sha256 than repo_sha256 are refused")
    st = A.stored_receipt(None, name=FULL_SQL, fetch=None, folder=rec, index_path=index)
    check(st["local"] == os.path.join(rec, FULL_SQL), "without the bucket the repo copy serves, checked by repo_sha256")
    # A re-run stores nothing again.
    bucket.puts.clear()
    tally = M.move(items, bucket, root=root, index_path=index, workers=2, log=logs.append)
    check(tally["already"] == 4 and not bucket.puts, "a re-run skips every file whose entry names its blob")
    # A display run stored the page's receipt first: the move completes that entry, keeping when it was stored.
    ix2 = os.path.join(tmp, "index2")
    b2 = Bucket()
    first = S.store_file(os.path.join(rec, FULL_GZ), kind=S.DISPLAY_KIND, build="cdd185495ce4", built="2026-11-13",
                         rows=1, storage=b2, run="44200000000", index_path=ix2, log=logs.append)
    M.move([x for x in items if x["name"] == FULL_GZ], b2, root=root, index_path=ix2, run="44300000002", log=logs.append)
    done = S.read_entry(FULL_GZ, ix2)
    check(done["repo_blob"] == S.git_blob(raw[FULL_GZ]) and done["stored_at"] == first["stored_at"]
          and done["run"] == "44200000000" and S.entry_problems(done) == [],
          "the move adds the repo file's identity to a display run's entry and keeps its run")
    # A file whose bytes are not the tree's blob is refused and indexed nowhere.
    ix3 = os.path.join(tmp, "index3")
    wrong = [dict(items[0], blob="1" * 40)]
    tally = M.move(wrong, Bucket(), root=root, index_path=ix3, log=logs.append)
    check(tally["failed"] == 1 and not os.path.exists(ix3) and "blob" in logs[-1],
          "a file whose bytes are not the tree's blob is refused and files no entry")

    # ---- gate(): a removed path must have an entry naming its blob.
    base = items
    check(M.gate(base, {x["path"] for x in base}, index) == [], "nothing removed, nothing to prove")
    check(M.gate(base, set(), index, read_blob=lambda b: {S.git_blob(v): v for v in raw.values()}.get(b)) == [],
          "every removed path with its entry, blob and sha256 passes")
    lost = [{"path": "kb/receipts/" + FULL_SQL.replace("5be5", "9999"), "name": FULL_SQL.replace("5be5", "9999"),
             "blob": "2" * 40, "kind": S.DISPLAY_KIND, "size": 1}]
    check(any("no index entry" in x for x in M.gate(base + lost, set(), index)), "a path removed unstored fails")
    other = [dict(items[1], blob="3" * 40)]
    check(any("its entry names" in x for x in M.gate(other, set(), index)),
          "a path whose blob is not the one its entry names fails")
    check(any("sha256" in x for x in M.gate(items[:1], set(), index, read_blob=lambda b: b"other bytes")),
          "a blob whose sha256 is not the entry's repo_sha256 fails")
finally:
    shutil.rmtree(tmp, ignore_errors=True)


# ---- the move workflow: started by its trigger file on a claude/ branch, commits index entries alone.
wf = open(os.path.join(ROOT, ".github", "workflows", "receipt-move.yml"), encoding="utf-8").read()
check("- 'kb/receipts/.move'" in wf and "branches: ['claude/**']" in wf and "git diff --quiet FETCH_HEAD -- kb/receipts/.move" in wf,
      "a claude/ push that changes kb/receipts/.move from main's starts the move")
check("python3 kb/_receipt_move_display.py --apply" in wf and "SUPABASE_SERVICE_KEY" in wf
      and "git add kb/receipts/index" in wf and "git add kb/receipts\n" not in wf and "git add -A" not in wf
      and "grep -v '^kb/receipts/index/'" in wf, "the move commits index entries and refuses anything else staged")
check("github.actor != 'github-actions[bot]'" in wf and "startsWith(github.event.head_commit.message, 'Merge')" in wf,
      "the bot's commit and a merge of main never start it again")


# ---- the live gate: this tree against the base branch's.
def g(*a):
    r = subprocess.run(["git", *a], cwd=ROOT, capture_output=True, text=True)
    return r.returncode, r.stdout


base_ref = os.environ.get("RECEIPT_GATE_BASE")
promisor = False
if not base_ref and os.environ.get("GITHUB_ACTIONS") == "true":
    # Into a ref of its own, so FETCH_HEAD and origin/main stay as the job left them.
    code, _ = g("fetch", "-q", "--no-tags", "--depth=1", "--filter=blob:none", "origin", "+main:refs/receipt-gate/main")
    check(code == 0, "CI fetched main's trees for the gate")
    base_ref, promisor = "refs/receipt-gate/main", True
if not base_ref and g("rev-parse", "-q", "--verify", "refs/remotes/origin/main")[0] == 0:
    base_ref = "refs/remotes/origin/main"
if not base_ref:
    print("note: no base branch on disk (no origin/main); the live gate runs in CI")
else:
    code, base_listing = g("ls-tree", "-r", base_ref, "--", "kb/receipts/")
    check(code == 0, "the base tree %s lists kb/receipts" % base_ref)
    code, head_listing = g("ls-tree", "-r", "HEAD", "--", "kb/receipts/")
    head_paths = {line.split("\t", 1)[1] for line in head_listing.splitlines() if "\t" in line}

    def read_blob(blob):
        if promisor or g("cat-file", "-e", blob)[0] != 0:
            return None
        return subprocess.run(["git", "cat-file", "blob", blob], cwd=ROOT, capture_output=True).stdout

    base_items = M.tracked(base_listing)
    problems = M.gate(base_items, head_paths, read_blob=read_blob)
    gone = sum(1 for x in base_items if x["path"] not in head_paths)
    for p in problems[:20]:
        print("  " + p)
    check(not problems, "every display receipt this tree removed from %s is stored and indexed (%d removed, %d "
          "problems)" % (base_ref, gone, len(problems)))
    print("gate: %d display receipts on %s, %d removed here, each stored" % (len(base_items), base_ref, gone))

print("ok: receipt move gate pass (%d checks)" % passed)
