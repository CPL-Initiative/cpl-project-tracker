#!/usr/bin/env python3
"""Dry run: the curated anchor's M-ID keys the CSR scan flags (cs9), resolved through the one alias chain (S611).

Sam's Commons ruling 3 (2026-11-08, #2921): dry-run the anchor re-keys under the re-mint playbook (Rule 7) and bring
back only the ambiguous choices. The scan (`kb/_csr_trail.py` cs9) flags 20 anchor entries in
`kb/common_courses.json` whose id prefix differs from the CSR canonical, and one in the dead `M-ID SUBJ NNN` format.

ERA FIRST. The anchor carries no `_rekeyed_through`, so `alias_chain.pending_maps` needs its baseline named, and a
guess re-applies a permutation silently (the first draft of this script ran the whole chain and sent GRAF M10IB, an
id the Z-band retirement re-used, to CRIM M11SD through the 2026-06-12 fold). The baseline is read, never assumed:
the latest map whose OUTPUT is a flagged key, and the run refuses if any key is an INPUT to a map between its own
producer and that baseline (a map the anchor never took). On
2026-11-08 that is `kb/prefix_fold_out/2026-09-03/alias_map.json` (the 2026-09-04 prefix fold): it produced AUTD M10FX
and FY, and the other 18 came from the Z-band retirement the day before and are inputs to no map since.

Each flagged key goes through the pending maps only, then sorts:

  rekey        a pending map moves it to an id on the canonical: the map already decided it;
  prefix_swap  no pending map moves it (an anchor-only id the 2026-11-05 recode never saw, since that recode moved
               minted identities), so it takes the canonical on its own number, the recode's own rule, when that id
               is unused: not minted, not an anchor key, and never an input or output of any map in the chain;
  ambiguous    anything else (a collision, a move off the canonical, the dead key format): for a person.

Read-only. Writes kb/anchor_rekey_dryrun/plan.json and report.md. Nothing in common_courses.json changes here.
The apply is kb/_anchor_rekey_apply.py (S612); since it, the anchor carries its era in kb/common_courses_era.json and
this run reads it from there.
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import alias_chain  # noqa: E402
from _csr_trail import cs9_anchor  # noqa: E402

OUT = os.path.join(HERE, "anchor_rekey_dryrun")


def load(name):
    with open(os.path.join(HERE, name), encoding="utf-8") as f:
        return json.load(f)


def baseline_of(keys, chain_maps):
    """The anchor's era, read from its keys. Each key's producer is the latest map with it as an OUTPUT; the baseline
    is the latest producer. A key whose producer is earlier passed the maps between unchanged only if it is an INPUT
    to none of them; one that is would mean a map the anchor never took, so the run refuses (SystemExit)."""
    paths = [p for p, _m in chain_maps]
    outs = [{alias_chain.step(v) for v in m.values()} for _p, m in chain_maps]
    ins = [set(m) for _p, m in chain_maps]
    prod = {}
    for k in keys:
        idx = [i for i, o in enumerate(outs) if k in o]
        if not idx:
            raise SystemExit("ABORT: no map in the chain produced the anchor key " + k)
        prod[k] = idx[-1]
    base = max(prod.values())
    skipped = {k: [paths[j] for j in range(i + 1, base + 1) if k in ins[j]] for k, i in prod.items()}
    skipped = {k: v for k, v in skipped.items() if v}
    if skipped:
        raise SystemExit("ABORT: these anchor keys are inputs to maps at or before the baseline " + paths[base]
                         + ", so the anchor is not in one era: " + json.dumps(skipped, indent=1))
    return paths[base]


def plan(anchor, disciplines, live, chain_maps, era=None):
    """`era` is the anchor's `_rekeyed_through` (kb/common_courses_era.json, stamped by the S612 apply); without it
    the era is read from the flagged keys."""
    dead, diverged = cs9_anchor(anchor, disciplines)
    if era:
        pending, _era = alias_chain.pending_maps(era, chain=[p for p, _m in chain_maps])
    elif diverged:
        base = baseline_of([k for k, _p, _c in diverged], chain_maps)
        pending, _era = alias_chain.pending_maps(None, baseline_through=base, chain=[p for p, _m in chain_maps])
    else:
        pending = []
    maps = [m for p, m in chain_maps if p in pending]
    used = set()
    for _p, m in chain_maps:
        used |= set(m) | {alias_chain.step(v) for v in m.values()}
    rows = []
    taken = set()
    for key, _prefix, canon in diverged:
        rec = anchor[key]
        new, hops = alias_chain.resolve(key, maps)
        row = {"key": key, "discipline": rec.get("discipline"), "canonical": canon, "resolved": new, "hops": hops,
               "title": rec.get("common_title")}
        if hops:
            if new.split()[0] != canon:
                row["kind"], row["why"] = "ambiguous", "a pending map moves it off the canonical " + canon
            elif new in anchor or new in taken:
                row["kind"], row["why"] = "ambiguous", "another anchor entry already holds " + new
            elif new in live:
                # The map moved ANOTHER record that shared this id (S612: the 2026-09-04 prefix fold put two HVAC
                # singletons on AUTD M10FX and FY, the ids the Z-band retirement gave the anchor's diesel entries the
                # day before; the 2026-11-05 recode then took the singletons to DIES). Following it merges the two.
                t = (live.get(new) or {}).get("common_title") or (live.get(new) or {}).get("title")
                row["kind"], row["why"] = "ambiguous", (new + " is already held" + (" by " + t if t else "")
                                                         + " (the map moved another record that shared this id); it "
                                                         "needs a fresh number on " + canon)
            else:
                row["kind"], row["why"] = "rekey", "a pending map moves it to " + new
        else:
            cand = canon + " " + key.split()[1]
            row["resolved"] = cand
            if cand in live or cand in anchor or cand in taken:
                held = live.get(cand) if isinstance(live, dict) else None
                t = (held or anchor.get(cand) or {}).get("title") or (held or anchor.get(cand) or {}).get("common_title")
                row["kind"], row["why"] = "ambiguous", cand + " is already held" + (" by " + t if t else "") + "; it needs a fresh number on " + canon
            elif cand in used:
                row["kind"], row["why"] = "ambiguous", cand + " appears in the alias chain (an id of another era)"
            else:
                row["kind"], row["why"] = "prefix_swap", "no pending map moves it; " + cand + " is unused"
        if row["kind"] != "ambiguous":
            taken.add(row["resolved"])
        rows.append(row)
    for key in dead:
        rows.append({"key": key, "kind": "ambiguous", "why": "dead pre-remint key format; the chain keys M-IDs only",
                     "discipline": anchor[key].get("discipline"), "title": anchor[key].get("common_title")})
    return rows


def main():
    anchor = load("common_courses.json")
    reg = load("discipline_canonical_subj4.json")
    disciplines = reg.get("disciplines", reg)
    minted = load("coci_minted_courses.json")["courses"]
    singles = load("coci_minted_singletons.json")
    singles = singles.get("courses", singles) if isinstance(singles, dict) else {}
    live = {k: v for k, v in list(minted.items()) + list(singles.items()) if not k.startswith("_") and isinstance(v, dict)}
    chain_maps = [(p, alias_chain.load_alias(p)) for p in alias_chain.ALIAS_MAPS]
    era_path = os.path.join(HERE, "common_courses_era.json")
    era = load("common_courses_era.json").get("_rekeyed_through") if os.path.exists(era_path) else None
    rows = plan(anchor, disciplines, live, chain_maps, era)
    os.makedirs(OUT, exist_ok=True)
    counts = {}
    for r in rows:
        counts[r["kind"]] = counts.get(r["kind"], 0) + 1
    with open(os.path.join(OUT, "plan.json"), "w", encoding="utf-8") as f:
        flagged = [r["key"] for r in rows if not r["key"].startswith("M-ID ")]
        json.dump({"schema": 1, "baseline": ("_rekeyed_through: " + era[-1]) if era else
                   (baseline_of(flagged, chain_maps) if flagged else None),
                   "counts": counts, "rows": rows}, f, indent=1, sort_keys=True)
        f.write("\n")
    lines = ["# The curated anchor's flagged M-ID keys, resolved through the alias chain", "",
             "Generated by `kb/_anchor_rekey_dryrun.py`. Read-only: nothing in `kb/common_courses.json` changes here.", "",
             "Counts: " + ", ".join("%s %d" % (k, counts[k]) for k in sorted(counts)) + ".", "",
             "| Anchor key | Discipline | Canonical | Resolves to | Kind | Why |", "|---|---|---|---|---|---|"]
    for r in rows:
        lines.append("| %s | %s | %s | %s | %s | %s |" % (r["key"], r.get("discipline") or "", r.get("canonical") or "",
                                                         r.get("resolved") or "", r["kind"], r["why"]))
    with open(os.path.join(OUT, "report.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    print("anchor re-key dry run:", counts)
    return 0


if __name__ == "__main__":
    sys.exit(main())
