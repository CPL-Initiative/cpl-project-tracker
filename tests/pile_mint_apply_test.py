#!/usr/bin/env python3
"""Fixture checks for kb/_pile_mint_apply.py, which lands the Needs an M-ID pile mint the dry run plans.

One check per failure the apply must never produce: a write when the plan moved since it was frozen; a write over a
course a person curated, or onto an id that is a merge target; a write with a wrong --expect or without one; a write
without a fresh live read; any untouched row's bytes changed; a count that grows by other than the planned number;
TOP deciding anything (it is stamped after the plan is fixed); a rollback that does not return the original bytes or
lets a returned id be handed out again; a rollback that refuses a file a later build pass rewrote compact, runs over
a person's row or a live curation row, or takes a live read of the wrong shape.

Run from repo root: python3 tests/pile_mint_apply_test.py
"""
import copy
import hashlib
import json
import os
import shutil
import sys
import tempfile
from datetime import datetime, timedelta, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
sys.path.insert(0, os.path.join(ROOT, "tests"))
import _pile_mint_apply as ap  # noqa: E402
import _pile_mint_dryrun as pm  # noqa: E402
from pile_mint_fixture import fixture  # noqa: E402

results = []


def check(name, cond):
    results.append((name, bool(cond)))
    print(("PASS  " if cond else "FAIL  ") + name)


def sha(path):
    return hashlib.sha256(open(path, "rb").read()).hexdigest()


NOW = datetime(2026, 11, 21, 2, 0, tzinfo=timezone.utc)
DAY = "2026-11-21"
CTE = {"1701.00": False, "0948.00": True}


def tree(inp):
    """The fixture's three identity files on disk, in the files' own format, with an untouched row whose text a
    careless re-serialization would change (non-ASCII, nested lists)."""
    d = tempfile.mkdtemp()
    cat = {"_status": "fixture", "count": len(inp["catalog"]) + 1,
           "courses": dict(inp["catalog"], **{"ZZZZ M1001": {"common_title": "Cañada Señor", "x": [1, {"y": None}]}})}
    mem = {"_status": "fixture", "count": 1, "member_courses_total": 1,
           "memberships": {"ZZZZ M1001": [{"college": "Cañada College", "control_number": "Q1"}]}}
    sing = {"_status": "fixture", "count": len(inp["singletons"]) + 1,
            "courses": dict(inp["singletons"], **{"ZZZZ M10AA": {"common_title": "Uno", "control_number": "Q2"}})}
    for f, doc in zip(pm.IDENTITY_FILES, (cat, mem, sing)):
        with open(os.path.join(d, f), "w", encoding="utf-8") as fh:
            fh.write(ap.serialize(doc))
    return d


def live(**kw):
    base = {"read_at": (NOW - timedelta(minutes=10)).strftime("%Y-%m-%dT%H:%M:%SZ"), "cn_rows": [],
            "merge_targets": [], "id_rows": []}
    base.update(kw)
    return base


def stops(fn):
    try:
        fn()
    except ap.Stop as e:
        return str(e)
    return None


inp = fixture()
# the minted files on disk are the fixture's catalog plus one untouched row: the plan reads what is on disk
d = tree(inp)
inp["catalog"] = json.load(open(os.path.join(d, pm.IDENTITY_FILES[0])))["courses"]
inp["singletons"] = json.load(open(os.path.join(d, pm.IDENTITY_FILES[2])))["courses"]
frozen = pm.compute_plan(copy.deepcopy(inp), DAY)
n = len(frozen["planned"]["courses"]) + len(frozen["planned"]["singletons"])
before = {f: sha(os.path.join(d, f)) for f in pm.IDENTITY_FILES}
raw_before = {f: open(os.path.join(d, f), encoding="utf-8").read() for f in pm.IDENTITY_FILES}
run = lambda **kw: ap.apply(frozen, copy.deepcopy(inp), d, kw.get("live", live()), kw.get("expect", n),
                            kw.get("write", True), NOW, cte_map=CTE, receipt_path=kw.get("receipt"))
unchanged = lambda: all(sha(os.path.join(d, f)) == before[f] for f in pm.IDENTITY_FILES)

check("the fixture plan has records to land", n >= 5)

# ── the gates, each with nothing written ──
moved = copy.deepcopy(frozen)
moved["planned"]["singletons"][sorted(moved["planned"]["singletons"])[0]]["common_title"] = "Edited after review"
check("a moved plan stops the apply", "the plan moved" in (stops(lambda: ap.apply(
    moved, copy.deepcopy(inp), d, live(), n, True, NOW, cte_map=CTE)) or "") and unchanged())
cn = frozen["planned"]["memberships"][sorted(frozen["planned"]["memberships"])[0]][0]["control_number"]
check("a planned course a person curated (a live CN: row) stops the apply",
      "curated courses ['" + cn in (stops(lambda: run(live=live(cn_rows=[{"course_id": "CN:" + cn, "field": "discipline",
                                                                          "value": "Biology"}]))) or "") and unchanged())
pid = sorted(frozen["planned"]["courses"])[0]
check("a planned id that is a live merge target stops the apply",
      "merge targets ['" + pid in (stops(lambda: run(live=live(merge_targets=[pid]))) or "") and unchanged())
check("a live row keyed by a planned id stops the apply",
      "keyed by a planned id ['" + pid in (stops(lambda: run(live=live(id_rows=[pid]))) or "") and unchanged())
check("a wrong --expect stops the apply", "--expect" in (stops(lambda: run(expect=n + 1)) or "") and unchanged())
check("no --expect stops the apply", "--expect" in (stops(lambda: run(expect=None)) or "") and unchanged())
check("no live read stops the apply", "no live" in (stops(lambda: ap.apply(
    frozen, copy.deepcopy(inp), d, None, n, True, NOW, cte_map=CTE)) or "") and unchanged())
check("a stale live read stops the apply", "read them again" in (stops(lambda: run(
    live=live(read_at="2026-11-20T01:00:00Z"))) or "") and unchanged())
failed = copy.deepcopy(frozen)
failed["validation"]["V1_every_wave_course_lands_once"]["pass"] = False
check("a frozen plan that failed its own validation stops the apply", "failed its own validation" in (stops(
    lambda: ap.apply(failed, copy.deepcopy(inp), d, live(), n, True, NOW, cte_map=CTE)) or "") and unchanged())
dry_r = run(write=False)
check("dry by default: it reports and writes nothing", dry_r["written"] is False and unchanged())

# ── the write ──
rp = os.path.join(d, "receipt.json")
r = run(receipt=rp)
docs = {f: json.load(open(os.path.join(d, f), encoding="utf-8")) for f in pm.IDENTITY_FILES}
cat, mem, sing = docs[pm.IDENTITY_FILES[0]], docs[pm.IDENTITY_FILES[1]], docs[pm.IDENTITY_FILES[2]]
check("the receipt is written with the ids, the members of each and both sha256 sets",
      os.path.exists(rp) and set(r["ids"]["courses"]) == set(frozen["planned"]["courses"])
      and all(r["files"][f]["before_sha256"] == before[f] and r["files"][f]["after_sha256"] for f in pm.IDENTITY_FILES)
      and r["members"][pid] == [m["control_number"] for m in frozen["planned"]["memberships"][pid]])
check("counts grow by exactly the planned number",
      cat["count"] == r["counts"]["before"]["courses"] + len(frozen["planned"]["courses"])
      and mem["count"] == 1 + len(frozen["planned"]["memberships"])
      and mem["member_courses_total"] == 1 + sum(len(v) for v in frozen["planned"]["memberships"].values())
      and sing["count"] == r["counts"]["before"]["singletons"] + len(frozen["planned"]["singletons"]))
for f in pm.IDENTITY_FILES:
    raw = open(os.path.join(d, f), encoding="utf-8").read()
    old = json.loads(raw_before[f])
    sect = "memberships" if "memberships" in old else "courses"
    new = json.loads(raw)
    same_rows = all(json.dumps(new[sect][k], indent=2, ensure_ascii=False)
                    == json.dumps(v, indent=2, ensure_ascii=False) for k, v in old[sect].items())
    keeps_place = list(new[sect])[:len(old[sect])] == list(old[sect])
    check(f"{f}: every untouched row is byte-identical and keeps its place", same_rows and keeps_place
          and ("Cañada" in raw) == ("Cañada" in raw_before[f]))
check("the files keep their own format (indent 2, non-ASCII as written)",
      all(open(os.path.join(d, f), encoding="utf-8").read() == ap.serialize(docs[f]) for f in pm.IDENTITY_FILES))
check("nothing beside the three files is written (no alias map, no promotions entry)",
      sorted(os.listdir(d)) == sorted(list(pm.IDENTITY_FILES) + ["receipt.json"]))
rec = cat["courses"][pid]
mrow = mem["memberships"][pid][0]
check("top_code is stamped from the course list after the plan, members in full and the record by its code",
      mrow["top_code"] == "1701.00: Mathematics, General" and rec["top_code"] == "1701.00"
      and rec["top_code_mixed"] is False)
check("cte comes through the CTE joiner's rule", rec["cte"] is False
      and all(sing["courses"][k]["cte"] is False for k in frozen["planned"]["singletons"]))
check("the record keeps the pile mint source", rec["discipline_source"] == "pile_mint")
reloaded = dict(copy.deepcopy(inp), catalog=cat["courses"], singletons=sing["courses"],
                membership_keys=sorted(mem["memberships"]))
after = {f: sha(os.path.join(d, f)) for f in pm.IDENTITY_FILES}
check("a second apply of the same plan stops (the plan moved: its ids are now taken) and writes nothing",
      "the plan moved" in (stops(lambda: ap.apply(frozen, reloaded, d, live(), n, True, NOW, cte_map=CTE)) or "")
      and all(sha(os.path.join(d, f)) == after[f] for f in pm.IDENTITY_FILES))

# ── the rollback ──
receipt = json.load(open(rp))
check("a rollback with a wrong --expect stops", "--expect" in (stops(
    lambda: ap.rollback(receipt, d, n - 1, True, NOW, live())) or ""))
check("a rollback write without a live read stops", "no live" in (stops(
    lambda: ap.rollback(receipt, d, n, True, NOW)) or ""))
check("a dry rollback whose --live file holds JSON null stops, as the write does", "no live" in (stops(
    lambda: ap.rollback(receipt, d, n, False, NOW, None, live_given=True)) or ""))
check("a live read from Postgres now() (microseconds, +00:00) reads", ap.check_live_shape(
    live(read_at=(NOW - timedelta(minutes=5)).strftime("%Y-%m-%dT%H:%M:%S.123456+00:00")), NOW, 6.0) is None)
rid = receipt["ids"]["courses"][0]
check("a rollback stops when a live kb_curation row is keyed on a receipt id, naming it", ("rows keyed on ['" + rid)
      in (stops(lambda: ap.rollback(receipt, d, n, True, NOW, live(id_rows=[rid]))) or ""))
check("a rollback stops when a live row merges into a receipt id, naming it", ("merges into ['" + rid)
      in (stops(lambda: ap.rollback(receipt, d, n, True, NOW, live(merge_targets=[rid]))) or ""))
dry_rb = ap.rollback(receipt, d, n, False, NOW)
check("a rollback is dry by default", dry_rb["written"] is False and sha(os.path.join(d, pm.IDENTITY_FILES[0]))
      == receipt["files"][pm.IDENTITY_FILES[0]]["after_sha256"])
rb = ap.rollback(receipt, d, n, True, NOW, live())
check("the round trip returns the original bytes of all three files",
      rb["files_as_the_apply_left_them"] and all(rb["round_trip"].values()) and unchanged())
res = json.load(open(os.path.join(d, pm.RESERVED_FILE)))
check("the rollback writes the returned ids to the reservation file", set(res["ids"]) == set(r["ids"]["courses"])
      | set(r["ids"]["singletons"]))
inp2 = copy.deepcopy(inp)
inp2["reservations"] = pm.s4dry.add_reserved_ids(copy.deepcopy(inp2["reservations"]), pm.rollback_reserved_ids(d))
again = pm.compute_plan(inp2, DAY)
check("the allocator never hands a returned id out again", not (set(again["planned"]["courses"])
                                                                | set(again["planned"]["singletons"])) & set(res["ids"]))
check("a second rollback stops (its ids are gone)", "not in the identity files" in (stops(
    lambda: ap.rollback(receipt, d, n, True, NOW, live())) or ""))


def fresh():
    """A new tree with the plan applied: (dir, receipt)."""
    t = tree(inp)
    rec = ap.apply(frozen, copy.deepcopy(inp), t, live(), n, True, NOW, cte_map=CTE,
                   receipt_path=os.path.join(t, "receipt.json"))
    return t, json.load(open(os.path.join(t, "receipt.json")))


# finding 1: kb/_infer_disciplines.py rewrites the catalog compact between the apply and the rollback
t, rcp = fresh()
cpath = os.path.join(t, pm.IDENTITY_FILES[0])
doc = json.load(open(cpath, encoding="utf-8"))
doc["courses"][rcp["ids"]["courses"][0]]["cte"] = True          # a build pass restamps a field it owns
with open(cpath, "w", encoding="utf-8") as fh:
    json.dump(doc, fh, ensure_ascii=False)                       # kb/_infer_disciplines.py dump()
    fh.write("\n")
compact_before = json.load(open(cpath, encoding="utf-8"))
rb = ap.rollback(rcp, t, n, True, NOW, live())
after_doc = json.load(open(cpath, encoding="utf-8"))
raw = open(cpath, encoding="utf-8").read()
check("a rollback after a compact rewrite runs (it reads the format it finds)", rb["written"]
      and rb["formats"][pm.IDENTITY_FILES[0]] == "compact" and not rb["files_as_the_apply_left_them"])
check("it deletes exactly the receipt's keys", set(compact_before["courses"]) - set(after_doc["courses"])
      == set(rcp["ids"]["courses"]) and not set(rcp["ids"]["courses"]) & set(after_doc["courses"]))
check("every other row is equal as parsed JSON", all(after_doc["courses"][k] == v for k, v in compact_before["courses"].items()
                                                     if k not in rcp["ids"]["courses"]))
check("it writes the file back in the format it found (compact)", raw == ap.serialize(after_doc, "compact"))
check("the other two files return to their original bytes",
      all(sha(os.path.join(t, f)) == rcp["files"][f]["before_sha256"] for f in pm.IDENTITY_FILES[1:]))
shutil.rmtree(t, ignore_errors=True)

# finding 3: a person's hand edit on a receipt row stops the rollback, naming the row
t, rcp = fresh()
spath = os.path.join(t, pm.IDENTITY_FILES[0])
doc = json.load(open(spath, encoding="utf-8"))
eid = rcp["ids"]["courses"][0]
doc["courses"][eid]["reviewed_at"] = "2026-11-21T01:59:00Z"
doc["courses"][eid]["discipline"] = "Biology"
with open(spath, "w", encoding="utf-8") as fh:
    fh.write(ap.serialize(doc))
msg = stops(lambda: ap.rollback(rcp, t, n, True, NOW, live())) or ""
check("a hand-edited row stops the rollback, naming the row and its fields",
      eid in msg and "reviewed_at" in msg and "discipline" in msg
      and eid in json.load(open(spath, encoding="utf-8"))["courses"])
shutil.rmtree(t, ignore_errors=True)

# finding 2: a live read of the wrong shape is a Stop, never a pass and never a crash
bad = {"cn_rows missing": {k: v for k, v in live().items() if k != "cn_rows"},
       "merge_targets null": live(merge_targets=None), "id_rows a string": live(id_rows=frozen and "LSKL M9002"),
       "cn_rows entry not a row": live(cn_rows=["CN:P1"]), "merge_targets entry not an id": live(merge_targets=[7]),
       "read_at missing": {k: v for k, v in live().items() if k != "read_at"}, "read_at null": live(read_at=None),
       "a list": [live()], "a string": "rows"}
bad["read_at a bare date"] = live(read_at="2026-11-21")
bad["read_at with no zone"] = live(read_at="2026-11-21T01:50:00")
for name, payload in bad.items():
    try:
        ap.check_live(frozen, payload, NOW, 6.0)
        outcome = "passed"
    except ap.Stop:
        outcome = "stop"
    except Exception as e:  # noqa: BLE001  (a crash is the failure this check guards)
        outcome = "crash " + type(e).__name__
    check(f"a live read with {name} stops", outcome == "stop")

# finding 4: the shared reservation loader reads kb/pile_mint_reserved.json, so another minter skips a reserved id
import _subj4_dryrun as s4  # noqa: E402
import _authority_recode_dryrun as rec  # noqa: E402
import _zband_retire_dryrun as zdry  # noqa: E402
rf = os.path.join(tempfile.mkdtemp(), "pile_mint_reserved.json")
json.dump({"ids": ["ABCD M1001", "ABCD M10AA"]}, open(rf, "w"))
os.environ["PILE_MINT_RESERVED"] = rf
try:
    shared = s4.load_id_reservations()
finally:
    os.environ.pop("PILE_MINT_RESERVED")
check("load_id_reservations reads the reservation file (a number, a code and both full ids)",
      1 in shared[("ABCD", "1")] and "0AA" in shared[("ABCD", "1")]
      and {"ABCD M1001", "ABCD M10AA"} <= shared[s4.RESERVED_IDS])
al = rec.Allocator(set(), shared)
check("another minter's allocator (the authority recode) never keeps or gap-fills onto a reserved id",
      al.place("XXXX M1001", "ABCD")[0] == "ABCD M1002" and al.place("XXXX M10AA", "ABCD")[0] == "ABCD M10AB")
bk = zdry.Buckets(set(), shared)
check("the re-mint allocator (Buckets) skips them too",
      bk.next_corr("ABCD", "1", "x") == "ABCD M1002" and bk.next_stand("ABCD", "1", "x") == "ABCD M10AB")
import _overmerge_dryrun as omd  # noqa: E402  (its own copy of the loader, and its allocator)
os.environ["PILE_MINT_RESERVED"] = rf
try:
    om_res = omd.load_id_reservations()
finally:
    os.environ.pop("PILE_MINT_RESERVED")
grp = lambda: {"norm_title": "x", "div": 0}
corr_g, sing_g = grp(), grp()
omd.allocate_fresh({("ABCD", "1"): [(corr_g, "m1")]}, {("ABCD", "1"): [(sing_g, "m2")]}, {}, {}, om_res)
check("the overmerge dry run's own loader reads the reservation file, and its allocator skips both ids",
      1 in om_res[("ABCD", "1")] and corr_g["new_id"] == "ABCD M1002" and sing_g["new_id"] == "ABCD M10AB")
import glob as _glob  # noqa: E402
copies = sorted(os.path.basename(f) for f in _glob.glob(os.path.join(ROOT, "kb", "*.py"))
                if "def load_id_reservations" in open(f, encoding="utf-8").read())
check("every copy of load_id_reservations reads the reservation file (the shared one, or through it)",
      all("pile_reserved_ids" in open(os.path.join(ROOT, "kb", f), encoding="utf-8").read()
          or "_subj4_dryrun.py" in open(os.path.join(ROOT, "kb", f), encoding="utf-8").read() for f in copies)
      and "_overmerge_dryrun.py" in copies)

# ── the SELECT ──
sql = ap.live_sql(frozen)
check("the live SELECT returns one JSON value and names every planned id",
      sql.count("json_build_object(") >= 1 and sql.strip().endswith("as live;")
      and all(i in sql for i in ap.planned_ids(frozen)) and "select *" not in sql.lower())
check("the rollback's SELECT names the receipt's ids", all(i in ap.live_sql(id_list=rcp["ids"]["courses"])
                                                          for i in rcp["ids"]["courses"]))

shutil.rmtree(d, ignore_errors=True)
failed_n = [nm for nm, ok in results if not ok]
print(f"\n{len(results) - len(failed_n)}/{len(results)} passed")
sys.exit(1 if failed_n else 0)
