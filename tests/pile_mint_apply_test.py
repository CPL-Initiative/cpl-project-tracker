#!/usr/bin/env python3
"""Fixture checks for kb/_pile_mint_apply.py, which lands the Needs an M-ID pile mint the dry run plans.

One check per failure the apply must never produce: a write when the plan moved since it was frozen; a write over a
course a person curated, or onto an id that is a merge target; a write with a wrong --expect or without one; a write
without a fresh live read; any untouched row's bytes changed; a count that grows by other than the planned number;
TOP deciding anything (it is stamped after the plan is fixed); a rollback that does not return the original bytes or
lets a returned id be handed out again.

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
    sing = {"_status": "fixture", "count": 1, "courses": {"ZZZZ M10AA": {"common_title": "Uno", "control_number": "Q2"}}}
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
      and sing["count"] == 1 + len(frozen["planned"]["singletons"]))
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
check("a rollback with a wrong --expect stops", "--expect" in (stops(lambda: ap.rollback(receipt, d, n - 1, True, NOW))
                                                              or ""))
dry_rb = ap.rollback(receipt, d, n, False, NOW)
check("a rollback is dry by default", dry_rb["written"] is False and sha(os.path.join(d, pm.IDENTITY_FILES[0]))
      == receipt["files"][pm.IDENTITY_FILES[0]]["after_sha256"])
rb = ap.rollback(receipt, d, n, True, NOW)
check("the round trip returns the original bytes of all three files",
      rb["files_as_the_apply_left_them"] and all(rb["round_trip"].values()) and unchanged())
res = json.load(open(os.path.join(d, pm.RESERVED_FILE)))
check("the rollback writes the returned ids to the reservation file", set(res["ids"]) == set(r["ids"]["courses"])
      | set(r["ids"]["singletons"]))
inp2 = copy.deepcopy(inp)
inp2["returned_ids"] = sorted(pm.rollback_reserved_ids(d))
again = pm.compute_plan(inp2, DAY)
check("the allocator never hands a returned id out again", not (set(again["planned"]["courses"])
                                                                | set(again["planned"]["singletons"])) & set(res["ids"]))
check("a second rollback stops (its ids are gone)", "not in the identity files" in (stops(
    lambda: ap.rollback(receipt, d, n, True, NOW)) or ""))

# ── the SELECT ──
sql = ap.live_sql(frozen)
check("the live SELECT returns one JSON value and names every planned id",
      sql.count("json_build_object(") >= 1 and sql.strip().endswith("as live;") and all(i in sql for i in ap.planned_ids(frozen))
      and "select *" not in sql.lower())

shutil.rmtree(d, ignore_errors=True)
failed_n = [nm for nm, ok in results if not ok]
print(f"\n{len(results) - len(failed_n)}/{len(results)} passed")
sys.exit(1 if failed_n else 0)
