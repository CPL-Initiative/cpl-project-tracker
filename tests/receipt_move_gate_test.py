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
  * the one-time move's workflow or trigger coming back, so another branch could run it.

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
import _row_audit_prune as P  # noqa: E402

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


# ---- S695 (#3476 item 1): the applied records move to display/applied/, each removed only once it reads back.
class Flaky(Bucket):
    """A bucket whose reads fail (unreachable) or hand back other bytes (corrupt)."""

    def __init__(self, unreachable=False, corrupt=False, refuse_put=False):
        super().__init__()
        self.unreachable, self.corrupt, self.refuse_put = unreachable, corrupt, refuse_put

    def put(self, obj, data):
        if self.refuse_put:
            raise OSError("503 the store is down")
        return super().put(obj, data)

    def get(self, obj):
        if self.unreachable:
            raise OSError("connection refused")
        data = super().get(obj)
        return data + b"x" if self.corrupt else data


def applied_fixture(n=3):
    d = tempfile.mkdtemp()
    rec, index = os.path.join(d, "kb", "receipts"), os.path.join(d, "kb", "receipts", "index")
    os.makedirs(rec)
    names = ["program_requirement_records_display_2026-11-13_cdd185495ce4.applied_4400000000%d.json" % i
             for i in range(n - 1)]
    names.append("program_requirement_records_display_2026-11-13_f48d35c7623e.applied_43415894285_2_santiago-"
                 "canyon-college.json")
    for i, nm in enumerate(names):
        rb = {"planned": 2 + i, "build": nm.split("_")[5][:12],
              "rollback": {"to_null": [], "reapply": {"f0f1ee88c04f": ["Cerritos College|0220%d" % i]}}}
        open(os.path.join(rec, nm), "w").write(json.dumps(rb, indent=1) + "\n")
    return d, rec, index, names


d, rec, index, names = applied_fixture()
try:
    paths = [os.path.join(rec, n) for n in names]
    raw = {n: open(p, "rb").read() for n, p in zip(names, paths)}
    check(S.kind_of(names[0]) is None, "an applied record is not a display receipt kind (kind_of stays display-only)")
    bucket = Bucket()
    res = S.store_applied(paths, bucket, run="44500000001", index_path=index, log=lambda *_: None)
    check(sorted(res["removed"]) == sorted(names) and not res["stayed"] and not any(os.path.exists(p) for p in paths),
          "every applied record that reads back is stored and removed: %s" % res)
    ents = {n: S.read_entry(n, index) for n in names}
    check(all(e and S.entry_problems(e) == [] for e in ents.values()),
          "every pointer is a sound display_applied entry: %s" % {n: S.entry_problems(e or {}) for n, e in ents.items()})
    e0 = ents[names[0]]
    check(e0["kind"] == "display_applied" and e0["object"] == "display/applied/" + names[0] + ".gz"
          and e0["gzip"] is True and e0["repo_blob"] == S.git_blob(raw[names[0]])
          and e0["repo_sha256"] == S.sha256_bytes(raw[names[0]]) and e0["repo_bytes"] == len(raw[names[0]])
          and e0["build"] == "cdd185495ce4" and e0["built"] == "2026-11-13" and e0["rows"] == 2,
          "the pointer names the object, the gzip, the repo file's blob, sha256 and size, the build and the rows")
    check(S.entry_problems(dict(e0, build="ffffffffffff")) and S.entry_problems(dict(e0, name="x.applied_1.json")),
          "a pointer whose build is not its name's, or whose name is not an applied record's, is refused")
    check("display_applied" in S.PUBLIC_SAFE, "an applied record may be handed out by step=fetch")
    # The round trip: the reader of a moved record finds it through the pointer, never in the tree.
    gone_path = paths[0]
    got = S.local_or_stored(gone_path, bucket, index_path=index, log=lambda *_: None)
    check(got != gone_path and not got.startswith(rec) and open(got, "rb").read() == raw[names[0]],
          "local_or_stored fetches a moved record through its pointer to a temporary folder, byte for byte")
    for label, store in (("the store is unreachable", Flaky(unreachable=True)), ("no key", None)):
        try:
            S.local_or_stored(gone_path, store, index_path=index, log=lambda *_: None)
            check(False, "a moved record's read refuses when %s" % label)
        except SystemExit:
            check(True, "a moved record's read refuses when %s" % label)
    corrupt = Flaky(corrupt=True)
    corrupt.objects = dict(bucket.objects)
    try:
        S.local_or_stored(gone_path, corrupt, index_path=index, log=lambda *_: None)
        check(False, "a moved record whose stored bytes differ is refused")
    except SystemExit:
        check(True, "a moved record whose stored bytes differ is refused")
    try:
        S.local_or_stored(os.path.join(rec, "program_requirement_records_display_2026-11-13_cdd185495ce4.applied_9.json"),
                          bucket, index_path=index)
        check(False, "a record neither on disk nor indexed is refused, never read as empty")
    except SystemExit:
        check(True, "a record neither on disk nor indexed is refused, never read as empty")
    # The rollback reader: --only-keys-from takes the moved record through its pointer.
    check(open(S.local_or_stored(paths[1], bucket, index_path=index, log=lambda *_: None)).read()
          == raw[names[1]].decode(), "a second moved record reads back the same way")
finally:
    shutil.rmtree(d, ignore_errors=True)

# Nothing is removed when the store fails, differs or is unreachable; a re-run removes with no new upload.
for label, kw in (("the upload fails", {"refuse_put": True}), ("the read-back is unreachable", {"unreachable": True}),
                  ("the read-back's sha256 differs", {"corrupt": True})):
    d, rec, index, names = applied_fixture()
    try:
        paths = [os.path.join(rec, n) for n in names]
        res = S.store_applied(paths, Flaky(**kw), index_path=index, log=lambda *_: None)
        check(not res["removed"] and len(res["stayed"]) == len(names) and all(os.path.exists(p) for p in paths),
              "nothing is removed when %s: %s" % (label, res))
    finally:
        shutil.rmtree(d, ignore_errors=True)
d, rec, index, names = applied_fixture()
try:
    paths = [os.path.join(rec, n) for n in names]
    res = S.store_applied(paths, None, index_path=index, log=lambda *_: None)
    check(not res["removed"] and all(os.path.exists(p) for p in paths), "without a key nothing is removed")
    b = Bucket()
    S.store_applied(paths[:1], b, index_path=index, remove=False, log=lambda *_: None)
    b.puts.clear()
    res = S.store_applied(paths[:1], b, index_path=index, log=lambda *_: None)
    check(res["removed"] == names[:1] and not b.puts, "a record already stored is removed after a read-back, no upload")
    open(paths[1], "a").write(" ")
    S.store_applied(paths[1:2], b, index_path=index, remove=False, log=lambda *_: None)
    open(paths[1], "a").write(" ")
    res = S.store_applied(paths[1:2], b, index_path=index, log=lambda *_: None)
    check(names[1] in res["stayed"] and os.path.exists(paths[1]),
          "a record whose pointer names other bytes stays: %s" % res)
    # The gate covers applied records too: one removed with no pointer fails.
    listing = "\n".join("100644 blob %s %d\tkb/receipts/%s" % (S.git_blob(open(p, "rb").read()), 1, n)
                        for n, p in zip(names, paths) if os.path.exists(p))
    listing += "\n100644 blob %s 1\tkb/receipts/%s" % ("4" * 40, names[0].replace("44000000000", "44000000099"))
    base = S.tracked_applied(listing)
    check(len(base) == 3 and all(x["name"].endswith(".json") for x in base), "tracked_applied lists applied records")
    check(any("no index entry" in x for x in M.gate(base, set(), index)), "an applied record removed unstored fails")
finally:
    shutil.rmtree(d, ignore_errors=True)


# ---- the move ran once (run 44259862567, 2026-11-18) and its workflow and trigger are gone, so no branch can
# start it again after the merge.
check(not os.path.exists(os.path.join(ROOT, ".github", "workflows", "receipt-move.yml"))
      and not os.path.exists(os.path.join(ROOT, "kb", "receipts", ".move")),
      "the one-time move's workflow and trigger file are removed")


# ---- S695: the row audit gate, on a fixture: a removal needs an entry with the blob's size and sha256.
d = tempfile.mkdtemp()
try:
    rep = os.path.join(d, "2026-11-20.md")
    open(rep, "wb").write(b"# report\n")
    ix = os.path.join(d, "index")
    stored_copy = os.path.join(d, "row_audit_2026-11-20.md")
    shutil.copyfile(rep, stored_copy)
    S.store_file(stored_copy, kind=S.ROW_AUDIT_KIND, build=None, built="2026-11-20", rows=1, storage=Bucket(),
                 index_path=ix, log=lambda *_: None)
    data = open(rep, "rb").read()
    one = P.tracked_reports("100644 blob %s %d\tkb/row_audit/2026-11-20.md\n100644 blob %s 9\tkb/row_audit/latest.json"
                            % (S.git_blob(data), len(data), "5" * 40))
    check(len(one) == 1, "tracked_reports lists the dated report and not latest.json")
    check(P.gate(one, set(), ix, read_blob=lambda b: data) == [], "a stored report's removal passes")
    check(any("sha256" in x for x in P.gate(one, set(), ix, read_blob=lambda b: b"other")),
          "a removal whose bytes are not the entry's fails")
    check(any("bytes" in x for x in P.gate([dict(one[0], size=99)], set(), ix)), "a removal of another size fails")
    check(any("no index entry" in x for x in P.gate([dict(one[0], path="kb/row_audit/2026-11-19.md",
                                                          name="2026-11-19.md")], set(), ix)),
          "a removal with no entry fails")
finally:
    shutil.rmtree(d, ignore_errors=True)


# ---- S695: receipt-slim.yml stores before it removes, gates before it pushes, and stages nothing else.
slim = open(os.path.join(ROOT, ".github", "workflows", "receipt-slim.yml"), encoding="utf-8").read()
order = [slim.index(x) for x in ("store-applied --tracked |", "_row_audit_prune.py --keep 0 --strict",
                                 "git add -A -- kb/receipts kb/row_audit", "git commit -q",
                                 "RECEIPT_GATE_BASE=HEAD~1 python3 tests/receipt_move_gate_test.py",
                                 "git push origin HEAD:main")]
check(order == sorted(order) and "workflow_dispatch:" in slim and "push:" not in slim and "schedule:" not in slim
      and "group: daily-dashboard" in slim and "fetch-depth: 2" in slim and "set -o pipefail" in slim,
      "receipt-slim.yml is dispatch-only, in the apply group, and stores, stages, commits, gates and pushes in order")
check("unexpected staged changes" in slim and "^D\tkb/receipts/program_requirement_records_display_" in slim,
      "receipt-slim.yml refuses any staged change other than the two kinds' removals, entries and the list")
check(slim.count("inputs.mode == 'apply'") == 3, "dry-run writes nothing: every writing step is apply-only")


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

    base_items = M.tracked(base_listing) + S.tracked_applied(base_listing)  # S695: applied records too
    problems = M.gate(base_items, head_paths, read_blob=read_blob)
    gone = sum(1 for x in base_items if x["path"] not in head_paths)
    for p in problems[:20]:
        print("  " + p)
    check(not problems, "every display receipt and applied record this tree removed from %s is stored and "
          "indexed (%d removed, %d problems)" % (base_ref, gone, len(problems)))
    print("gate: %d display receipts and applied records on %s, %d removed here, each stored"
          % (len(base_items), base_ref, gone))
    # S695: the dated row audit reports, by size (and sha256 where the blob is on disk).
    # -l reads each blob's size, which a blob-less fetch would download one by one: CI reads names alone.
    code, ra_base = g("ls-tree", "-r", *([] if promisor else ["-l"]), base_ref, "--", "kb/row_audit/")
    check(code == 0, "the base tree %s lists kb/row_audit" % base_ref)
    code, ra_head = g("ls-tree", "-r", "HEAD", "--", "kb/row_audit/")
    ra_paths = {line.split("\t", 1)[1] for line in ra_head.splitlines() if "\t" in line}
    ra_items = P.tracked_reports(ra_base)
    ra_problems = P.gate(ra_items, ra_paths, read_blob=read_blob)
    for p in ra_problems[:20]:
        print("  " + p)
    check(not ra_problems, "every row audit report this tree removed from %s is stored with its size and sha256 "
          "(%d problems)" % (base_ref, len(ra_problems)))

print("ok: receipt move gate pass (%d checks)" % passed)
