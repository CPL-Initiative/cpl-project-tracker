#!/usr/bin/env python3
"""A stored credential title is resolved at read time, through the applied rename snapshots in force.

Why (the S640 conductor, cpl_memory d-rename-repoint-stopped-resolve-at-read-s640): #3140 rewrote live rows
inside the rename apply, and five review rounds each found a wrong-data fault; the last was a snapshot finder
with no in-force filter, which replayed an undone apply. kb/credential_aliases.py resolves instead, the way
kb/alias_chain.py resolves a stored M-ID, and no live row is rewritten.

Guards, each a fault:
  1. an undone snapshot does not resolve (undone.json beside it, or its fold_id named by any undone.json),
     except the groups the undo skipped; an undo that left no marker returns its titles through the live rule;
     a re-apply in a new folder resolves again; a failed apply and a never-applied snapshot do not resolve;
  2. apply order is _applied_at as an instant, never the folder name; a malformed time, a tie on a common
     title, and a title in both renames and merges each raise;
  3. a live title is itself at every step (the S641 conductor, D1: three live titles a 2026-07-08 snapshot
     moved); a title that is not live moves through every snapshot (A->B then B->C reads C; a swap moves
     once; a merge reads its target; an unknown title reads itself), whenever it was saved;
  4. a title the fold retired is a search alias of each title its exhibits went to, from the append-only
     ledger, never a resolution; a later report with an empty retire list removes no alias (D2);
  5. the browser's table gives resolve's answer, and is current;
  D3. a chain that ends on a title that is not live follows the retire ledger's one live target, or ends there
     and is reported; no alias attaches to a dead title;
  6. the stale "ASE Bundle — A4, A5" shape (a saved assignment, cer-procedure-classifier@bot, 2026-10-31, before
     the 2026-11-12 apply) reads as its live credential in each routed reader, and the three returned titles
     keep the fold's answer on main.

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


def snap(root, name, at, renames=None, merges=None, fold_id=None, undo=False):
    d = os.path.join(root, "kb", "cred_rename_out", name)
    doc = {"renames": renames or {}, "merges": merges or {}}
    if at:
        doc["_applied_at"] = at
    write(os.path.join(d, "alias_map.json"), doc)
    if fold_id or undo:
        write(os.path.join(d, "undo.json"), {"fold_id": fold_id} if fold_id else {})
    return d


def raises(fn):
    try:
        fn()
    except ca.SnapshotError:
        return True
    return False


def live(root, titles):
    write(os.path.join(root, "kb", "credentials.json"), {t: [{}] for t in titles})


OLD, NEW = "ASE Bundle — A4, A5", "ASE Certificate Bundles: A4 + A5"
RAW = "Automotive Service Excellence (ASE) A4 and A5"
SAVED_AT = "2026-10-31T14:01:01.108182+00:00"

tmp = tempfile.mkdtemp(prefix="cred-title-resolver-")
try:
    # ── 1-3: the resolver on a fixture ──
    snap(tmp, "2026-07-08", "2026-07-08T12:00:00Z", {"A": "B", "Brought Back": "Gone To"}, {"Merged Away": "Kept"})
    snap(tmp, "2026-07-09", "2026-07-09T12:00:00Z", {"B": "C", "Swap 1": "Swap 2", "Swap 2": "Swap 1", "L1": "L2"})
    snap(tmp, "2026-07-10", "2026-07-10T12:00:00Z", {"L2": "L3"})
    snap(tmp, "2026-08-01", None, {"C": "Never Applied"})
    d = snap(tmp, "2026-08-02", "2026-08-02T12:00:00Z", {"C": "Failed Apply"})
    write(os.path.join(d, "apply_failed.json"), {})
    d = snap(tmp, "2026-09-01", "2026-09-01T12:00:00Z", {"C": "Undone Here", "Kept Group": "Still Folded"},
             fold_id="2026-09-01@2026-09-01T12:00:00Z")
    write(os.path.join(d, "undone.json"), {"fold_ids": ["2026-09-01@2026-09-01T12:00:00Z"],
                                           "skipped_groups": ["Still Folded", "Kept Group"]})
    snap(tmp, "2026-09-02", "2026-09-02T12:00:00Z", {"C": "Undone Elsewhere"}, fold_id="F2")
    write(os.path.join(tmp, "kb", "cred_rename_out", "zz-undo-record", "undone.json"), {"fold_ids": ["F2"]})
    # undone, then re-applied in a new folder: the re-apply stands
    d = snap(tmp, "2026-09-03", "2026-09-03T12:00:00Z", {"Re 1": "Re 2"}, fold_id="F3")
    write(os.path.join(d, "undone.json"), {"fold_ids": ["F3"]})
    snap(tmp, "2026-09-04", "2026-09-04T12:00:00Z", {"Re 1": "Re 2"}, fold_id="F4")
    # an undo with no fold_id writes no undone.json; it put "Unmarked" back in the reference
    snap(tmp, "2026-09-05", "2026-09-05T12:00:00Z", {"Unmarked": "Unmarked New"}, undo=True)
    # apply order: the base folder was applied first, though "2026-11-12/" sorts after "2026-11-12-2/"
    snap(tmp, "2026-11-12", "2026-11-12T00:54:43Z", {OLD: NEW, "Order 1": "Order 2"})
    snap(tmp, "2026-11-12-2", "2026-11-12T05:14:50+00:00", {"Order 2": "Order 3"})
    # a tie on titles the two do not share is ordered by name; one in another zone is the same instant
    snap(tmp, "2026-11-13-a", "2026-11-13T08:00:00Z", {"Tie A": "Tie B"})
    snap(tmp, "2026-11-13-b", "2026-11-13T00:00:00-08:00", {"Tie X": "Tie Y"})
    live(tmp, ["C", "Kept", "Swap 2", "Brought Back", "Unmarked", "L2", "Order 3", NEW, "Re 2", "Tie B", "Tie Y",
               "Still Folded", "Gone To"])

    snaps = ca.snapshots(tmp)
    names = [s["name"] for s in snaps]
    now = ca.resolver(tmp)
    lv = ca.live_titles(tmp)
    check("a never-applied and a failed apply's snapshot are not in force",
          "2026-08-01" not in names and "2026-08-02" not in names, names)
    check("an undone snapshot does not resolve (undone.json beside it)", "2026-09-01" in names
          and ca.resolve("C", snaps)[0] == "C", ca.resolve("C", snaps))
    check("an undone snapshot does not resolve (its fold_id in another folder's undone.json)", "2026-09-02" not in names)
    check("a group the undo skipped stays folded", ca.resolve("Kept Group", snaps)[0] == "Still Folded")
    check("an undo, then a re-apply in a new folder: the re-apply resolves", "2026-09-03" not in names and now("Re 1") == "Re 2")
    check("an undo that left no marker returns its old title through the live rule", now("Unmarked") == "Unmarked"
          and "Unmarked" in ca.returned(tmp) and "Unmarked" not in ca.load(tmp).get("Unmarked New", []))
    check("apply order is _applied_at as an instant: 2026-11-12 before 2026-11-12-2",
          names.index("2026-11-12") < names.index("2026-11-12-2") and now("Order 1") == "Order 3", names)
    check("a tie on titles the two do not share is ordered by name, a zone offset read as the instant",
          names.index("2026-11-13-a") < names.index("2026-11-13-b") and now("Tie X") == "Tie Y")
    check("a chain A->B then B->C resolves A to C, with both applies named",
          ca.resolve("A", snaps, lv) == ("C", ["2026-07-08", "2026-07-09"]), ca.resolve("A", snaps, lv))
    check("a swap in one map moves once, not twice (titles not live)",
          ca.resolve("Swap 1", snaps)[0] == "Swap 2" and ca.resolve("Swap 2", snaps)[0] == "Swap 1")
    check("a live title is itself: a swapped title that is live stays", now("Swap 2") == "Swap 2")
    check("a live title is itself at every step: the chain stops at the first live title", now("L1") == "L2")
    check("a title a person brought back reads as itself and is no alias of where it went",
          now("Brought Back") == "Brought Back" and "Brought Back" not in ca.load(tmp).get("Gone To", [])
          and "Brought Back" in ca.returned(tmp))
    check("a merged title resolves to its target", now("Merged Away") == "Kept")
    check("an unknown title returns itself", now("Nobody Renamed This") == "Nobody Renamed This" and now("") == "")
    mv = ca.moves(tmp)
    check("moves() follows each title that is not live to the title it names now, and leaves the live ones",
          mv["A"] == {"now": "C", "by": ["2026-07-08", "2026-07-09"]} and "C" not in mv and "Brought Back" not in mv)

    # malformed, tied and doubled snapshots raise
    for label, setup in (
            ("a malformed _applied_at", lambda r: snap(r, "bad", "yesterday", {"P": "Q"})),
            ("an _applied_at with no zone", lambda r: snap(r, "bad", "2026-11-14T00:00:00", {"P": "Q"})),
            ("two snapshots at one instant naming a common title",
             lambda r: (snap(r, "t1", "2026-11-14T00:00:00Z", {"P": "Q"}), snap(r, "t2", "2026-11-14T00:00:00Z", {"Q": "R"}))),
            ("a title in both renames and merges of one snapshot",
             lambda r: snap(r, "both", "2026-11-14T00:00:00Z", {"P": "Q"}, {"P": "R"}))):
        r2 = tempfile.mkdtemp(prefix="cred-title-bad-")
        try:
            setup(r2)
            check(f"{label} fails loudly", raises(lambda: ca.snapshots(r2)))
        finally:
            shutil.rmtree(r2, ignore_errors=True)

    # ── 4: the fold's retired titles are search aliases, from the ledger ──
    live(tmp, ["C", "Back Again", "MIL3", "MIL4 Renamed", "Kept", "Brought Back", "Unmarked"])
    ca.append_retires(tmp, "2026-11-11", "2026-11-11T00:24:16Z",
                      [{"title": "Automotive Braking Systems", "to": ["MIL3", "MIL4"]}, {"title": "Back Again", "to": ["C"]}])
    check("the ledger appends once per retire", ca.append_retires(tmp, "2026-11-11", "x", [{"title": "Back Again", "to": ["C"]}]) == 0)
    # the day's report is rewritten by a later run with no retires: the ledger keeps them
    write(os.path.join(tmp, "kb", "unclassified_fold", "2026-11-11", "report.json"),
          {"mode": "apply", "_generated_at": "2026-11-11T06:36:00Z", "credential_retires": []})
    ca.append_retires(tmp, "2026-11-11", "2026-11-11T06:36:00Z", [])
    snap(tmp, "2026-11-14", "2026-11-14T00:00:00Z", {"MIL4": "MIL4 Renamed"})
    aka = ca.load(tmp)
    check("a retired title is an alias of each title its exhibits went to, each followed through later renames",
          "Automotive Braking Systems" in aka.get("MIL3", []) and "Automotive Braking Systems" in aka.get("MIL4 Renamed", []),
          aka)
    check("a later report with an empty retire list removes no alias", "Automotive Braking Systems" in aka.get("MIL3", []))
    check("a retired title is never a resolution", ca.resolver(tmp)("Automotive Braking Systems") == "Automotive Braking Systems")
    check("a retired title that is a credential again is no alias", "Back Again" not in aka.get("C", []))
    check("rename aliases come first", aka.get("C", [])[:2] == ["A", "B"], aka.get("C"))

    # ── D3: a chain's dead end follows the ledger's one live target, or is reported ──
    snap(tmp, "2026-11-15", "2026-11-15T00:00:00Z", {"Calc I": "Calc I Early", "Two Way": "Two Way End",
                                                     "Nowhere": "Nowhere End", "Dead Target": "DT End"})
    ca.append_retires(tmp, "2026-11-15", "2026-11-15T01:00:00Z",
                      [{"title": "Calc I Early", "to": ["Calc 1 Early"]}, {"title": "Two Way End", "to": ["MIL3", "Kept"]},
                       {"title": "DT End", "to": ["Gone Too"]}, {"title": "Back Again", "to": ["Never Here"]}])
    with open(os.path.join(tmp, "kb", "credentials.json"), encoding="utf-8") as f:
        cr = json.load(f)
    cr["Calc 1 Early"] = [{}]
    write(os.path.join(tmp, "kb", "credentials.json"), cr)
    now = ca.resolver(tmp)
    ends = {r["title"]: r for r in ca.dead_ends(tmp)}
    check("D3: a dead end the ledger sends to exactly one live title follows it", now("Calc I") == "Calc 1 Early"
          and "Calc I" not in ends and "Calc I" in ca.load(tmp).get("Calc 1 Early", []))
    check("D3: a dead end the ledger sends to two live titles stays, and is reported",
          now("Two Way") == "Two Way End" and "2 live titles" in ends.get("Two Way", {}).get("why", ""), ends.get("Two Way"))
    check("D3: a dead end no retire names stays, and is reported", now("Nowhere") == "Nowhere End"
          and ends.get("Nowhere", {}).get("end") == "Nowhere End")
    check("D3: a dead end whose only target is not live is reported", "none of its targets" in ends.get("Dead Target", {}).get("why", ""))
    check("D3: no alias attaches to a dead title", not any(k in ca.load(tmp) for k in ("Two Way End", "Nowhere End", "DT End")))
    dead_rt = ca.retired(tmp, report=True)[1]
    check("D3: a retire whose target is not live is reported, also when the retired title is live again",
          any(r["title"] == "Back Again" and r["to"] == "Never Here" for r in dead_rt), dead_rt)
    check("D3: a title no snapshot moved is never resolved through the ledger", now("Calc I Early") == "Calc I Early")

    # ── 5: the browser's table gives resolve's answer ──
    t = ca.table(tmp)
    tab, rt, lv = t["moves"], t["retires"], ca.live_titles(tmp)

    def first_live(path, live_set):
        return next((h for h in path if h in live_set), None)

    def pick(title, live_set):   # the rule map_links.js applies to the table
        if title in live_set:
            return title
        hops = tab.get(title) or []
        if not hops:
            return title
        hit = first_live(hops, live_set)
        if hit:
            return hit
        got = []
        for path in rt.get(hops[-1]) or []:
            x = first_live(path, live_set)
            if x and x not in got:
                got.append(x)
        return got[0] if len(got) == 1 else hops[-1]
    snaps, led = ca.snapshots(tmp), ca.ledger(tmp)
    probe = ["A", "B", "Swap 1", "Swap 2", "Merged Away", "Order 1", OLD, "Kept Group", "C", "L1", "Brought Back",
             "Unmarked", "Re 1", "Unknown", "Calc I", "Two Way", "Nowhere", "Dead Target"]
    bad = [(x, pick(x, s), ca.resolve(x, snaps, s, led)[0]) for x in probe for s in (lv, frozenset())
           if pick(x, s) != ca.resolve(x, snaps, s, led)[0]]
    check("the table's first-live-hop rule gives resolve's answer, with and without the live set", not bad, bad)
    check("the table's report names the returned titles, the dead ends and the dead retires",
          "Brought Back" in t["report"]["returned"] and any(r["title"] == "Nowhere" for r in t["report"]["dead_ends"])
          and any(r["title"] == "Back Again" for r in t["report"]["dead_retires"]))
    have = open(os.path.join(ROOT, ca.TABLE), encoding="utf-8").read()
    check("kb/credential_title_moves.json is current (python3 kb/credential_aliases.py)",
          ca._checked(have) == ca._checked(ca._render(ROOT)))

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
    write(os.path.join(t2, "kb", "exhibits_review.json"), {"written_at": "2026-11-13T00:00:00Z",
                                                          "held": [{"raw": "H", "title": OLD, "issuer": ""}]})
    rnow = ca.resolver(t2)

    import _build_exhibits_related as rel  # noqa: E402
    d = rel.build(t2)
    idx = {row[0]: row for row in d["titles"]}
    check("Exhibits related titles: a stale saved or held title is not listed as a title a card could fold into",
          OLD not in idx and NEW in idx and idx[NEW][4] == rel.IN_REFERENCE, sorted(idx))

    import _fold_unclassified as fold  # noqa: E402
    clean, skip, supersede, revise, stale, conflict = fold.classify(saved, ut, rnow)
    check("the nightly fold reads the stale row as already classified, never re-creating the old title",
          [r["raw"] for r in skip] == [RAW] and not (clean or supersede or revise or stale or conflict)
          and skip[0]["assigned"] == NEW, (clean, supersede, stale, conflict))
    resaved = {RAW: dict(saved[RAW], reviewed_at="2026-11-13T09:00:00Z")}
    check("...and a row re-saved after the apply still resolves (no era guard)",
          [r["raw"] for r in fold.classify(resaved, ut, rnow)[1]] == [RAW])
    bare = fold.classify(saved, ut)
    check("...and without the resolver the same row does not read as classified (the fault the resolver removes)",
          not bare[1] and any(r["raw"] == RAW for b in bare for r in b), [len(b) for b in bare])

    import _sweep_exhibit_titles as sw  # noqa: E402
    cur, _ = sw.current_titles(ut, resaved, set(), rnow)
    check("Another look: a stale saved title saved later than the reference still reads as the live credential",
          cur.get(RAW) == NEW, cur)

    import _cer_procedures as cp  # noqa: E402
    p = cp.as_proposal({"unified_title": OLD, "confidence_title": 0.9, "asked": "2026-10-31"}, {NEW: set()}, rnow)
    check("the classifier's cached answer is proposed as the title the rename made", p["title"] == NEW, p)

    by = ca.by_current_title({OLD: ["X1"], NEW: ["X2"], "Unrenamed": ["X3"]}, t2)
    check("a title-keyed file (MAP's verified links, the category seed) reads under the live title, its own first",
          by[NEW] == ["X2", "X1"] and by["Unrenamed"] == ["X3"], by)
finally:
    shutil.rmtree(tmp, ignore_errors=True)

# ── 6, on the repo's own data ──
now = ca.resolver(ROOT)
creds = json.load(open(os.path.join(ROOT, "kb", "credentials.json"), encoding="utf-8"))
check("the live saved row: 'ASE Bundle — A4, A5' resolves to a live credential", now(OLD) == NEW and NEW in creds, now(OLD))
check("D3 on the repo: Calculus I follows the ledger's one live title past its retired rename",
      now("Calculus I") == "Single Variable Calculus 1 Early Transcendentals" and now("Calculus I") in creds)
three = ["Automotive Electronics", "Automotive Electrical Schematic Diagnosis", "Automotive Suspension, Steering and Alignment"]
check("the three titles a person brought back after the 2026-07-08 snapshot read as themselves, and are reported",
      all(now(x) == x for x in three) and all(x in ca.returned(ROOT) for x in three)
      and not any(x in v for v in ca.load(ROOT).values() for x in three))
import _fold_unclassified as fold  # noqa: E402
ut = json.load(open(os.path.join(ROOT, "kb", "unified_titles.json"), encoding="utf-8"))
asg = json.load(open(os.path.join(ROOT, "kb", "unclassified_assignments.json"), encoding="utf-8"))["assignments"]
names = ["clean", "skip", "supersede", "revise", "stale", "conflict"]


def buckets(fn):
    return {r["raw"]: n for n, b in zip(names, fold.classify(asg, ut, fn)) for r in b}


b0, b1 = buckets(None), buckets(now)
moved = sorted({(b0[k], b1[k]) for k in b0 if b0[k] != b1[k]})
check("on main's data the resolver only takes stale rows to skip (no row leaves skip)", all(m == ("stale", "skip") for m in moved),
      moved)
import _build_partner_crosswalk as pc  # noqa: E402
check("the partner crosswalk reads a ruling's renamed title as the live credential",
      pc.ruled_title("ASE Bundle — T7, T8 + MACS/609") in creds)
for rel_path in ("kb/_build_college_offering_crosswalk.py", "kb/_build_occupation_cpl_crosswalk.py"):
    src = open(os.path.join(ROOT, rel_path), encoding="utf-8").read()
    check(f"{rel_path} reads its title-keyed source through kb/credential_aliases.py",
          "credential_aliases.resolver(" in src or "credential_aliases.by_current_title(" in src)
ledger = json.load(open(os.path.join(ROOT, ca.RETIRES), encoding="utf-8"))["retires"]
check("the retire ledger holds the 2026-11-12 retires a later run's report dropped",
      any(r["title"] == "Automotive Braking Systems" and r["day"] == "2026-11-12" for r in ledger)
      and "Automotive Braking Systems" in ca.load(ROOT).get("Military Tactical Wheeled Vehicle – Drive Train (ASE MIL3)", []))
src = open(os.path.join(ROOT, "kb", "_fold_unclassified.py"), encoding="utf-8").read()
check("the fold appends each apply's retires to the ledger", "credential_aliases.append_retires(" in src)

failed = [n for n, ok in results if not ok]
print(f"\n{len(results) - len(failed)}/{len(results)} passed")
sys.exit(1 if failed else 0)
