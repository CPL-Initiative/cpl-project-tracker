#!/usr/bin/env python3
"""The measurements behind the Jev next step for each of the four references.

Sam, 2026-09-28: bring a next step for each reference (the CSR, the CCR, the
CER and the CCRR). Each step rests on a count, and a count typed into a sheet
goes stale while the sheet waits: four cards on the 2026-09-22 sheet asked him
to rule on work that had already landed. So the open-asks builder calls
`measure()` at build time, and `--write` records a receipt of the same numbers.

Read-only. Local files only, no network, nothing written but the receipt.

  python3 kb/_jev_next_steps.py            # print the four measurements
  python3 kb/_jev_next_steps.py --write    # also write kb/receipts/jev_next_steps_<date>.json
"""
import collections
import glob
import importlib.util
import itertools
import json
import os
import sys
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)


def _load(name, rel):
    spec = importlib.util.spec_from_file_location(name, os.path.join(HERE, rel))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def _findings(pattern):
    hits = sorted(glob.glob(os.path.join(HERE, pattern)))
    if not hits:
        return None, []
    raw = json.load(open(hits[-1], encoding="utf-8"))
    rows = raw["findings"] if isinstance(raw, dict) and "findings" in raw else raw
    return os.path.relpath(hits[-1], ROOT), rows


def _scan(pattern, rules):
    path, rows = _findings(pattern)
    judged = [f for f in rows if f.get("rule") in rules and f.get("needs_judgment")]
    return {
        "file": path,
        "findings": len(rows),
        "by_rule": dict(collections.Counter(f.get("rule") for f in rows).most_common()),
        "jev_askable": len(judged),
        "jev_by_rule": dict(collections.Counter(f.get("rule") for f in judged).most_common()),
    }


def cer(jev):
    """The exhibit reference: the scanner's findings and the judgment residue."""
    return _scan(os.path.join("trail_crew_out", "*", "findings.json"), jev.CER_RULES)


def csr(jev):
    """The subject reference: the findings, the askable residue, the collisions."""
    out = _scan(os.path.join("csr_out", "*", "findings.json"), jev.CSR_RULES)
    trail = _load("csr_trail", "_csr_trail.py")
    reg = json.load(open(os.path.join(HERE, "discipline_canonical_subj4.json"),
                         encoding="utf-8"))["disciplines"]
    out["collisions"] = [{"a": a, "b": b, "code": c,
                          "mids_a": (reg.get(a) or {}).get("total_mids"),
                          "mids_b": (reg.get(b) or {}).get("total_mids")}
                         for a, b, c in trail.cs2_dups(reg)]
    return out


def ccrr():
    """The credit recommendation reference: what the anchored pairing reached,
    and what pairing groups that articulate to one course identity would reach.

    ⚠️ PAIRED BY KEY, NEVER CHAINED. 164 strings bridge two or more course
    identities, so connected components would chain AJ 110 to AJ 160 through
    Community Relations; a pair here shares one course, and nothing is joined
    transitively. The count is an upper bound until the credential course-count
    gate removes the pairs a one-course credential manufactures."""
    trial = _load("typesafe_cr_trial", "_typesafe_cr_trial.py")
    groups = json.load(open(trial.WORKLIST, encoding="utf-8"))["groups"]
    by_key = {g["key"]: g for g in groups}
    anchored = trial.build_pairs()
    by_canon = collections.defaultdict(list)
    for g in groups:
        by_canon[(g.get("canonical") or "").strip()].append(g)
    unanchored = [m for c, m in by_canon.items() if c and len(m) >= 2
                  and not any(x.get("rung") in trial.ANCHOR_RUNGS for x in m)]
    by_course = collections.defaultdict(list)
    for g in groups:
        for c in g.get("courses") or []:
            by_course[c].append(g["key"])
    pairs = set()
    for keys in by_course.values():
        for a, b in itertools.combinations(sorted(set(keys)), 2):
            pairs.add((a, b))
    reached = {k for p in pairs for k in p}
    solo = [k for k in reached if by_key[k].get("rung") == 5]
    return {
        "groups": len(groups),
        "rung5_groups": sum(1 for g in groups if g.get("rung") == 5),
        "rows": sum(g.get("rows") or 0 for g in groups),
        "anchored_pairs": len(anchored),
        "anchored_rows": sum(p["rows"] for p in anchored),
        "unanchored_clusters": len(unanchored),
        "unanchored_groups": sum(len(m) for m in unanchored),
        "unanchored_rows": sum(sum(x.get("rows") or 0 for x in m) for m in unanchored),
        "course_pairs": len(pairs),
        "course_groups": len(reached),
        "course_rung5_groups": len(solo),
        "course_rung5_rows": sum(by_key[k].get("rows") or 0 for k in solo),
    }


# Sam's destinations on the moves of the 2026-09-22 title-rung sitting, from
# his notes in the calibration receipt. Item 11 (Field Studies) moved with no
# destination named, and item 13 was "cross list", so neither is scored.
TITLE_RUNG_DESTINATIONS = {8: "Photography", 20: "Office Technologies",
                           21: "Theater Arts", 22: "Theater Arts", 23: "Ethnic Studies"}


def ccr(jev):
    """The course reference: does the course's own membership name where Sam
    moved it? Candidates are the disciplines its member colleges' subject codes
    resolve to, read the way the cross-list lane reads them."""
    cal = json.load(open(os.path.join(HERE, "receipts",
                                      "jev_ccr_title_rung_calibration_2026-09-22_s282.json"),
                         encoding="utf-8"))
    smap = json.load(open(os.path.join(HERE, "reference", "subject_discipline_map.json"),
                          encoding="utf-8"))
    smap = smap.get("map", smap)
    rows = []
    for it in cal["items"][:cal["_scored"]["through"]]:
        mid = it["id"].split("||")[0]
        votes = collections.Counter()
        for m in jev._members(mid) or []:
            d = smap.get((m.get("subject") or "").strip().upper())
            if isinstance(d, dict):
                d = d.get("discipline")
            if d:
                votes[d] += 1
        dest = TITLE_RUNG_DESTINATIONS.get(it["item"])
        rows.append({"item": it["item"], "title": it["title"], "home": it["discipline"],
                     "verdict": it["verdict"], "destination": dest,
                     "candidates": dict(votes.most_common()),
                     "named": bool(dest and dest in votes),
                     "plurality": votes.most_common(1)[0][0] if votes else None})
    moves = [r for r in rows if r["destination"]]
    return {
        "scored": len(rows),
        "moves": sum(1 for r in rows if r["verdict"] == "move"),
        "keeps": sum(1 for r in rows if r["verdict"] == "keep"),
        "auc": cal["_result"]["auc"],
        "lowest_move_p": cal["_result"]["lowest_move_p"],
        "highest_keep_p": cal["_result"]["highest_keep_p"],
        "destinations": len(moves),
        "destinations_named": sum(1 for r in moves if r["named"]),
        "plurality_matches": sum(1 for r in moves if r["plurality"] == r["destination"]),
        "items": rows,
    }


def measure():
    jev = _load("jev_adjudicate", "_jev_adjudicate.py")
    return {"cer": cer(jev), "csr": csr(jev), "ccrr": ccrr(), "ccr": ccr(jev)}


def main():
    m = measure()
    cc = m["ccr"]
    print("CCR  %d scored (%d moves, %d keeps), AUC %.3f; members name %d of %d destinations, "
          "plurality alone matches %d" % (cc["scored"], cc["moves"], cc["keeps"], cc["auc"],
                                          cc["destinations_named"], cc["destinations"],
                                          cc["plurality_matches"]))
    r = m["ccrr"]
    print("CCRR %d anchored pairs (%d rows) · %d unanchored clusters (%d groups, %d rows) · "
          "course pairing %d pairs over %d groups, %d at rung 5 (%d rows)" % (
              r["anchored_pairs"], r["anchored_rows"], r["unanchored_clusters"],
              r["unanchored_groups"], r["unanchored_rows"], r["course_pairs"],
              r["course_groups"], r["course_rung5_groups"], r["course_rung5_rows"]))
    for k in ("cer", "csr"):
        s = m[k]
        print("%s  %d findings, %d for Jev %s  (%s)" % (k.upper(), s["findings"], s["jev_askable"],
                                                    s["jev_by_rule"], s["file"]))
    for c in m["csr"]["collisions"]:
        print("     collision %s: %s (%s ids) and %s (%s ids)" % (c["code"], c["a"], c["mids_a"],
                                                               c["b"], c["mids_b"]))
    if "--write" in sys.argv[1:]:
        path = os.path.join(HERE, "receipts", "jev_next_steps_%s.json" % date.today())
        with open(path, "w", encoding="utf-8") as fh:
            json.dump(dict(m, _doc=__doc__.split("\n")[0], _measured=str(date.today())),
                      fh, indent=1, ensure_ascii=False)
        print("wrote", os.path.relpath(path, ROOT))
    return 0


if __name__ == "__main__":
    sys.exit(main())
