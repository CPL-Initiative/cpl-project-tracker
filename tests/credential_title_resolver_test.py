#!/usr/bin/env python3
"""A stored credential title is resolved at read time, through the applied rename snapshots in force.

Why (the S640 conductor, cpl_memory d-rename-repoint-stopped-resolve-at-read-s640): #3140 rewrote live rows
inside the rename apply, and five review rounds each found a wrong-data fault; the last was a snapshot finder
with no in-force filter, which replayed an undone apply. kb/credential_aliases.py resolves instead, the way
kb/alias_chain.py resolves a stored M-ID, and no live row is rewritten.

Guards, each a fault:
  1. an undone snapshot does not resolve (undone.json beside it, or its fold_id named by any undone.json),
     except the groups the undo skipped; a failed apply and a never-applied snapshot do not resolve;
  2. apply order is _applied_at, never the folder name ("2026-11-12/" sorts after "2026-11-12-2/");
  3. a chain A->B then B->C reads C; a swap in one map moves once; a merge reads its target; an unknown title
     reads itself; a value saved after an apply never moves through it (the era guard);
  5. the browser's table (kb/credential_title_moves.json) gives the same answer as resolve, and is current;
  6. the stale "ASE Bundle — A4, A5" shape (a saved assignment, cer-procedure-classifier@bot, 2026-10-31, before
     the 2026-11-12 apply) reads as its live credential in each routed reader.

Run from the repo root: python3 tests/credential_title_resolver_test.py
"""
import json
import os
import shutil
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import credential_aliases as ca  # noqa: E402

results = []


def check(name, cond, detail=""):
    results.append((name, bool(cond)))
    print(("PASS  " if cond else "FAIL  ") + name + (f"\n      {detail}" if detail and not cond else ""))


def write(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False)


def snap(root, name, at, renames=None, merges=None, fold_id=None):
    d = os.path.join(root, "kb", "cred_rename_out", name)
    doc = {"renames": renames or {}, "merges": merges or {}}
    if at:
        doc["_applied_at"] = at
    write(os.path.join(d, "alias_map.json"), doc)
    if fold_id:
        write(os.path.join(d, "undo.json"), {"fold_id": fold_id})
    return d


OLD, NEW = "ASE Bundle — A4, A5", "ASE Certificate Bundles: A4 + A5"
RAW = "Automotive Service Excellence (ASE) A4 and A5"
SAVED_AT = "2026-10-31T14:01:01.108182+00:00"

tmp = tempfile.mkdtemp(prefix="cred-title-resolver-")
try:
    # ── 1-3: the resolver on a fixture ──
    snap(tmp, "2026-07-08", "2026-07-08T12:00:00Z", {"A": "B"}, {"Merged Away": "Kept"})
    snap(tmp, "2026-07-09", "2026-07-09T12:00:00Z", {"B": "C", "Swap 1": "Swap 2", "Swap 2": "Swap 1"})
    snap(tmp, "2026-08-01", None, {"C": "Never Applied"})
    d = snap(tmp, "2026-08-02", "2026-08-02T12:00:00Z", {"C": "Failed Apply"})
    write(os.path.join(d, "apply_failed.json"), {})
    d = snap(tmp, "2026-09-01", "2026-09-01T12:00:00Z", {"C": "Undone Here", "Kept Group": "Still Folded"},
             fold_id="2026-09-01@2026-09-01T12:00:00Z")
    write(os.path.join(d, "undone.json"), {"fold_ids": ["2026-09-01@2026-09-01T12:00:00Z"],
                                           "skipped_groups": ["Still Folded", "Kept Group"]})
    # an undo whose undone.json names a fold id, the receipt's own folder holding none
    snap(tmp, "2026-09-02", "2026-09-02T12:00:00Z", {"C": "Undone Elsewhere"}, fold_id="F2")
    write(os.path.join(tmp, "kb", "cred_rename_out", "zz-undo-record", "undone.json"), {"fold_ids": ["F2"]})
    # apply order: the base folder was applied first, though "2026-11-12/" sorts after "2026-11-12-2/"
    snap(tmp, "2026-11-12", "2026-11-12T00:54:43Z", {OLD: NEW, "Order 1": "Order 2"})
    snap(tmp, "2026-11-12-2", "2026-11-12T05:14:50Z", {"Order 2": "Order 3"})

    snaps = ca.snapshots(tmp)
    names = [s["name"] for s in snaps]
    now = ca.resolver(tmp)
    check("a never-applied and a failed apply's snapshot are not in force",
          "2026-08-01" not in names and "2026-08-02" not in names, names)
    check("an undone snapshot does not resolve (undone.json beside it)", now("C") == "C", now("C"))
    check("an undone snapshot does not resolve (its fold_id in another folder's undone.json)",
          "2026-09-02" not in names, names)
    check("a group the undo skipped stays folded", now("Kept Group") == "Still Folded", now("Kept Group"))
    check("apply order is _applied_at: 2026-11-12 before 2026-11-12-2",
          names.index("2026-11-12") < names.index("2026-11-12-2") and now("Order 1") == "Order 3", names)
    check("a chain A->B then B->C resolves A to C, with both applies named",
          ca.resolve("A", snaps) == ("C", ["2026-07-08", "2026-07-09"]), ca.resolve("A", snaps))
    check("a swap in one map moves once, not twice", now("Swap 1") == "Swap 2" and now("Swap 2") == "Swap 1")
    check("a merged title resolves to its target", now("Merged Away") == "Kept")
    check("an unknown title returns itself", now("Nobody Renamed This") == "Nobody Renamed This" and now("") == "")
    check("the era guard: a value saved after an apply never moves through it",
          now("B", "2026-07-10T00:00:00Z") == "B" and now("A", "2026-07-08T18:00:00+00:00") == "A"
          and now("A", "2026-07-08") == "C" and now("B", "2026-07-08T18:00:00+00:00") == "C")
    mv = ca.moves(tmp)
    check("moves() follows each old title to the title it carries now",
          mv["A"] == {"now": "C", "by": ["2026-07-08", "2026-07-09"]} and mv["B"]["now"] == "C" and "C" not in mv)

    # ── 5: the browser's table gives resolve's answer ──
    tab = ca.table(tmp)["moves"]

    def pick(title, since=None):   # the rule map_links.js applies: the first pair applied after `since`
        for at, t in tab.get(title, []):
            if not since or since[:19] < at[:19]:
                return t
        return title
    probe = ["A", "B", "Swap 1", "Merged Away", "Order 1", OLD, "Kept Group", "C", "Unknown"]
    sinces = [None, "2026-07-08T18:00:00Z", "2026-07-10T00:00:00Z", "2026-11-12T03:00:00Z"]
    bad = [(t, s, pick(t, s), now(t, s)) for t in probe for s in sinces if pick(t, s) != ca.resolver(tmp)(t, s)]
    check("the table's first-pair-after rule gives resolve's answer at every era", not bad, bad)
    have = open(os.path.join(ROOT, ca.TABLE), encoding="utf-8").read()
    check("kb/credential_title_moves.json is current (python3 kb/credential_aliases.py)", have == ca._render(ROOT))

    # ── 6: the stale ASE A4, A5 saved assignment, in each routed reader ──
    t2 = os.path.join(tmp, "readers")
    snap(t2, "2026-11-12", "2026-11-12T00:54:43Z", {OLD: NEW})
    stamp = {"reviewed_by": "slee@cccco.edu", "reviewed_at": "2026-11-12T00:54:43Z"}
    ut = {RAW: dict(stamp, unified_title=NEW, source_exhibit_ids=["MAPICI-ASE45-1-001"])}
    write(os.path.join(t2, "kb", "unified_titles.json"), ut)
    write(os.path.join(t2, "kb", "credentials.json"), {NEW: [{"issuing_agency": "ASE"}]})
    saved = {RAW: {"unified_title": OLD, "issuing_agency": "ASE", "reviewed_by": "cer-procedure-classifier@bot",
                   "reviewed_at": SAVED_AT}}
    write(os.path.join(t2, "kb", "unclassified_assignments.json"), {"assignments": saved})
    rnow = ca.resolver(t2)

    import _build_exhibits_related as rel  # noqa: E402
    d = rel.build(t2)
    idx = {row[0]: row for row in d["titles"]}
    check("Exhibits related titles: the stale saved title is not listed as a title a card could fold into",
          OLD not in idx and NEW in idx and idx[NEW][4] == rel.IN_REFERENCE, sorted(idx))

    import _fold_unclassified as fold  # noqa: E402
    clean, skip, supersede, revise, stale, conflict = fold.classify(saved, ut, rnow)
    check("the nightly fold reads the stale row as already classified, never re-creating the old title",
          [r["raw"] for r in skip] == [RAW] and not (clean or supersede or revise or stale or conflict)
          and skip[0]["assigned"] == NEW, (clean, supersede, stale, conflict))
    bare = fold.classify(saved, ut)
    check("...and without the resolver the same row does not read as classified (the fault the resolver removes)",
          not bare[1] and any(r["raw"] == RAW for b in bare for r in b), [len(b) for b in bare])

    import _sweep_exhibit_titles as sw  # noqa: E402
    cur, _ = sw.current_titles(ut, {RAW: dict(saved[RAW], reviewed_at="2026-11-12T09:00:00Z")}, set(),
                               lambda t, since=None: rnow(t))
    check("Another look: a stale saved title saved later than the reference still reads as the live credential",
          cur.get(RAW) == NEW, cur)

    import _cer_procedures as cp  # noqa: E402
    p = cp.as_proposal({"unified_title": OLD, "confidence_title": 0.9, "asked": "2026-10-31"}, {NEW: set()}, rnow)
    check("the classifier's cached answer is proposed as the title the rename made", p["title"] == NEW, p)

    by = ca.by_current_title({OLD: ["X1"], NEW: ["X2"], "Unrenamed": ["X3"]}, t2, "2026-10-26T23:35Z")
    check("a title-keyed file (MAP's verified links, the category seed) reads under the live title, its own first",
          by[NEW] == ["X2", "X1"] and by["Unrenamed"] == ["X3"], by)
    late = ca.by_current_title({OLD: ["X1"]}, t2, "2026-11-13T00:00:00Z")
    check("...and a file checked after the apply is read as written", late == {OLD: ["X1"]}, late)
finally:
    shutil.rmtree(tmp, ignore_errors=True)

# ── 6, on the repo's own data ──
live = ca.resolver(ROOT)
creds = json.load(open(os.path.join(ROOT, "kb", "credentials.json"), encoding="utf-8"))
check("the live saved row: 'ASE Bundle — A4, A5' (saved 2026-10-31) resolves to a live credential",
      live(OLD, SAVED_AT) == NEW and NEW in creds, live(OLD, SAVED_AT))
import _build_partner_crosswalk as pc  # noqa: E402
check("the partner crosswalk reads a ruling's renamed title as the live credential",
      pc.ruled_title("ASE Bundle — T7, T8 + MACS/609", "2026-08-05") in creds)
for rel_path in ("kb/_build_college_offering_crosswalk.py", "kb/_build_occupation_cpl_crosswalk.py"):
    src = open(os.path.join(ROOT, rel_path), encoding="utf-8").read()
    check(f"{rel_path} reads its title-keyed source through kb/credential_aliases.py",
          "credential_aliases.resolver(" in src or "credential_aliases.by_current_title(" in src)

failed = [n for n, ok in results if not ok]
print(f"\n{len(results) - len(failed)}/{len(results)} passed")
sys.exit(1 if failed else 0)
