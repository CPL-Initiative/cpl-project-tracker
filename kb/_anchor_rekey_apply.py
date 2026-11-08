#!/usr/bin/env python3
"""Anchor re-key APPLY: the curated anchor's 20 flagged M-ID keys onto their Common SUBJ (Sam, Open Asks Sheet 171
card 4, "As proposed", 2026-11-08 20:14Z; Commons ruling 3, #2921; Rule 7 and docs/coursecontrolnumber_remint.md).

The receipted half of kb/_anchor_rekey_dryrun.py. The plan is RECOMPUTED here through the dry run's plan() on the
current state (apply == spec) and gated against the committed kb/anchor_rekey_dryrun/plan.json. Then:

  rekey        a key a pending map already moved to a free id takes that id; the chain carries it, so it is NOT in
               this receipt's map (none on 2026-11-08: see collisions);
  prefix_swap  the 15 take the canonical on their own number;
  collisions   the ambiguous keys whose id on the canonical is held take the lowest
               number on their canonical that no record, anchor key, crosswalk pointer or alias-chain id has ever
               used (the authority recode's allocator, gap-fill in the key's own band). Three per the dry run Sam
               ruled on (AUTD M10FZ, PLGL M10IA, PLGL M10IB) and two the S612 rebuild found: AUTD M10FX and FY,
               which the dry run had read as re-keys. The 2026-09-04 prefix fold put two HVAC singletons on the ids
               the Z-band retirement had given those diesel entries the day before, and the 2026-11-05 recode moved
               the singletons to DIES M10FX and FY. Following the map would merge Diesel Engines with an HVAC course,
               so they take the collision rule Sam ruled;
  held         the 3 dead-format HOSP keys stay: their disciplines have no Common SUBJ (the curator worklist).

What mutates:
  kb/common_courses.json       20 keys renamed; each moved record gains `_anchor_rekey_from` (its old key).
                               Its `subject` field is the local subject a college used and is left alone.
  kb/course_crosswalk.json     course_id pointers re-pointed.
  kb/common_courses_era.json   NEW: the anchor's `_rekeyed_through`. It sits beside the anchor because the anchor is a
                               flat id -> record dict and excel_to_dashboard.py walks every entry of it.

Supabase is not written here: kb_curation holds no row on any old or new key (P3, the fresh read below); a row that
appears later re-keys through supabase-rekey.yml with this receipt.

Usage (from repo root):
  python3 kb/_anchor_rekey_apply.py                                   # verify, print the plan
  python3 kb/_anchor_rekey_apply.py --fresh-read FRESH.json --apply   # write
FRESH.json is the live read of kb_curation on every old and new key: a JSON list of {course_id, field}.
Receipt: kb/anchor_rekey_out/2026-11-08/{alias_map.json, fresh_read.json, report.md}. Rollback: git revert.
"""
import argparse
import json
import os
import sys
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import alias_chain  # noqa: E402
import _anchor_rekey_dryrun as dry  # noqa: E402
from _authority_recode_dryrun import Allocator  # noqa: E402

DATE = "2026-11-08"
RECEIPT = os.path.join(HERE, "anchor_rekey_out", DATE)
MAP_REL = "kb/anchor_rekey_out/%s/alias_map.json" % DATE
ERA = os.path.join(HERE, "common_courses_era.json")
STAMP = "_anchor_rekey_from"
RULING = ("Sam, Open Asks Sheet 171 card 4, 'As proposed', 2026-11-08 20:14Z: the three collisions take the next free "
          "number on their Common SUBJ, the three hospitality entries stay on the curator worklist, the 20 apply together")


def load(rel):
    with open(os.path.join(ROOT, rel), encoding="utf-8") as f:
        return json.load(f)


def dump(path, doc):
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(doc, f, indent=2, ensure_ascii=False)
        f.write("\n")
    os.replace(tmp, path)


def chain_without_me():
    return [p for p in alias_chain.ALIAS_MAPS if p != MAP_REL]


def build(anchor, crosswalk, live, disciplines, chain_maps):
    """(rows, alias, new_alias): rows is the recomputed plan; alias every anchor move (old -> new, the 20);
    new_alias the moves this receipt makes (the 18 the chain did not already decide)."""
    rows = dry.plan(anchor, disciplines, live, chain_maps)
    used = set(live) | set(anchor)
    used |= {v.get("course_id") for v in crosswalk.values() if isinstance(v, dict) and v.get("course_id")}
    for _p, m in chain_maps:
        used |= set(m) | {alias_chain.step(v) for v in m.values()}
    moving = {r["key"] for r in rows if r["kind"] != "ambiguous" or not r["key"].startswith("M-ID ")}
    alloc = Allocator(used - moving, {})
    alias, new_alias = {}, {}
    for r in rows:
        if r["kind"] in ("rekey", "prefix_swap"):
            alias[r["key"]] = r["resolved"]
            alloc.taken.add(r["resolved"])
            if r["kind"] == "prefix_swap":
                new_alias[r["key"]] = {"new_id": r["resolved"], "kind": "prefix_swap", "discipline": r["discipline"]}
    for r in rows:
        if r["kind"] == "ambiguous" and not r["key"].startswith("M-ID ") and "already held" in r["why"]:
            nid, how = alloc.place(r["key"], r["canonical"], prefer_keep=False, reason=r["why"])
            if not nid:
                raise SystemExit("ABORT: no free number on %s for %s" % (r["canonical"], r["key"]))
            r["resolved"], r["kind"], r["why"] = nid, "collision", r["why"] + "; takes " + nid + " (" + how + ")"
            alias[r["key"]] = nid
            new_alias[r["key"]] = {"new_id": nid, "kind": "collision", "discipline": r["discipline"]}
    return rows, alias, new_alias


def gates(rows, alias, committed, anchor, crosswalk, live, chain_maps, fresh):
    g = {}
    want = {(r["key"], r["kind"], r.get("resolved")) for r in committed["rows"] if r["kind"] != "ambiguous"}
    have = {(r["key"], r["kind"], r.get("resolved")) for r in rows if r["kind"] in ("rekey", "prefix_swap")}
    g["P1 the recomputed re-keys and prefix swaps equal the committed dry run"] = want == have
    amb = {r["key"] for r in committed["rows"] if r["kind"] == "ambiguous"}
    g["P1b every key the dry run left for a person is a collision or a held HOSP key"] = amb == (
        {r["key"] for r in rows if r["kind"] == "collision"} | {r["key"] for r in rows if r["key"].startswith("M-ID ")})
    g["V1 twenty keys move, the three HOSP keys stay"] = len(alias) == 20 and not any(k.startswith("M-ID ") for k in alias)
    news = list(alias.values())
    g["V2 every new key is distinct"] = len(set(news)) == len(news)
    ever = set()
    for _p, m in chain_maps:
        ever |= set(m) | {alias_chain.step(v) for v in m.values()}
    pre = {k: v for k, v in alias.items() if not any(k in m for _p, m in chain_maps)}
    g["V3 no new key is a live record, another anchor key or a crosswalk pointer"] = not any(
        n in live or (n in anchor and n not in alias) for n in news)
    g["V4 a key the chain did not decide lands on an id the chain never used"] = not any(n in ever for n in pre.values())
    disc = {r["key"]: r["canonical"] for r in rows if r.get("canonical")}
    g["V5 every new key is on its discipline's Common SUBJ"] = all(n.split()[0] == disc[k] for k, n in alias.items())
    if fresh is not None:
        ids = set(alias) | set(news)
        g["P3 kb_curation holds no row on an old or new key (fresh read)"] = not any(
            r.get("course_id") in ids for r in fresh)
    return g


def apply(anchor, crosswalk, alias):
    out = {}
    for k, rec in anchor.items():
        nk = alias.get(k, k)
        if nk != k:
            rec = dict(rec)
            rec[STAMP] = k
        out[nk] = rec
    n = 0
    for v in crosswalk.values():
        if isinstance(v, dict) and v.get("course_id") in alias:
            v["course_id"] = alias[v["course_id"]]
            n += 1
    return out, n


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--fresh-read", help="the live kb_curation read on every old and new key (JSON list)")
    args = ap.parse_args()
    alias_chain.selftest()
    if os.path.exists(ERA):
        print("P0: kb/common_courses_era.json exists; the anchor re-key is already applied. Nothing to do.")
        return 0
    anchor = load("kb/common_courses.json")
    crosswalk = load("kb/course_crosswalk.json")
    reg = load("kb/discipline_canonical_subj4.json")
    disciplines = reg.get("disciplines", reg)
    minted = load("kb/coci_minted_courses.json")["courses"]
    singles = load("kb/coci_minted_singletons.json")
    singles = singles.get("courses", singles) if isinstance(singles, dict) else {}
    live = {k: v for k, v in list(minted.items()) + list(singles.items()) if not k.startswith("_") and isinstance(v, dict)}
    chain_maps = [(p, alias_chain.load_alias(p)) for p in chain_without_me()]
    committed = load("kb/anchor_rekey_dryrun/plan.json")
    rows, alias, new_alias = build(anchor, crosswalk, live, disciplines, chain_maps)
    fresh = None
    if args.fresh_read:
        with open(args.fresh_read, encoding="utf-8") as f:
            fresh = json.load(f)
    g = gates(rows, alias, committed, anchor, crosswalk, live, chain_maps, fresh)
    for k, v in alias.items():
        print("  %-12s -> %s" % (k, v))
    for name, ok in g.items():
        print(("PASS " if ok else "FAIL ") + name)
    if not all(g.values()):
        print("ABORT: a gate failed; nothing written.")
        return 1
    if not args.apply:
        print("verify only: pass --fresh-read and --apply to write.")
        return 0
    if fresh is None:
        print("ABORT: --apply needs --fresh-read (P3).")
        return 1
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    new_anchor, xrefs = apply(anchor, crosswalk, alias)
    if len(new_anchor) != len(anchor):
        print("ABORT: the anchor's count changed; nothing written.")
        return 1
    os.makedirs(RECEIPT, exist_ok=True)
    dump(os.path.join(RECEIPT, "alias_map.json"), {
        "_status": "Anchor re-key old->new alias (receipt + rollback inverse) - APPLIED",
        "_at": DATE, "_applied_at": now, "_applied_by": "kb/_anchor_rekey_apply.py", "_ruling": RULING,
        "_scope": "kb/common_courses.json keys and kb/course_crosswalk.json pointers; anchor-only ids, no minted record",
        "_count": len(new_alias),
        "_also_moved_by_the_chain": {k: v for k, v in alias.items() if k not in new_alias},
        "aliases": dict(sorted(new_alias.items()))})
    dump(os.path.join(RECEIPT, "fresh_read.json"), {"_read_at": now, "_about": "kb_curation on every old and new key",
                                                     "rows": fresh})
    dump(os.path.join(ROOT, "kb", "common_courses.json"), new_anchor)
    dump(os.path.join(ROOT, "kb", "course_crosswalk.json"), crosswalk)
    dump(ERA, {"_about": ("The era of kb/common_courses.json: the alias maps already folded into its keys. It sits beside "
                          "the anchor because the anchor is a flat id -> record dict that excel_to_dashboard.py walks "
                          "whole. A later re-key applies only the maps after this list (alias_chain.pending_maps)."),
               "_stamped_by": "kb/_anchor_rekey_apply.py", "_stamped_at": now,
               "_rekeyed_through": chain_without_me() + [MAP_REL]})
    lines = ["---", "title: Anchor re-key, applied", "date: " + DATE, "status: APPLIED " + now, "---", "",
             "# The curated anchor's flagged keys, re-keyed", "", RULING + ".", "",
             "Moved: %d anchor keys (%d decided by this receipt, %d by the 2026-11-05 recode's map). Crosswalk pointers "
             "re-pointed: %d. Held: the three `M-ID HOSP` keys (no Common SUBJ for Travel Services or Hotel and Motel "
             "Services). kb_curation rows on these keys at the fresh read: %d." % (
                 len(alias), len(new_alias), len(alias) - len(new_alias), xrefs, len(fresh)), "",
             "| Old key | New key | Kind | Discipline | Title |", "|---|---|---|---|---|"]
    for r in rows:
        lines.append("| %s | %s | %s | %s | %s |" % (r["key"], alias.get(r["key"], "held"), r["kind"],
                                                     r.get("discipline") or "", r.get("title") or ""))
    lines += ["", "## Gates", ""] + ["- PASS " + k for k in g] + [
        "", "Rollback: `git revert` the commit; the map above read right to left is the inverse.", ""]
    with open(os.path.join(RECEIPT, "report.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print("APPLIED: %d keys, %d crosswalk pointers. Register %s in kb/alias_chain.py ALIAS_MAPS." % (
        len(alias), xrefs, MAP_REL))
    return 0


if __name__ == "__main__":
    sys.exit(main())
