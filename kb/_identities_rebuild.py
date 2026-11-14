#!/usr/bin/env python3
"""Articulation identities map — rebuild every M-ID entry from the current
catalog. DRY RUN by default; --apply writes kb/coci_articulations.json.

kb/coci_articulations.json carries an `identities` map beside its articulation
records. The export's rollup (excel_to_dashboard.py, export_unified_courses,
`rollup`) builds every row's adopter and potential college lists from it:
for each member id it reads `identities[member]`, and a member with no entry
contributes nothing, neither its earning colleges nor the colleges that teach
it. A curator's merge_into folds a member's records into its target's row, so
a merged-away member with no entry never reaches its target (FIRE M1274 into
FIRE 130 X, 2026-11-13: the lists stayed 5 and 6).

The entries were last DERIVED in May (kb/_remint_apply_articulations.py, the
1b rule: catalog metadata, and colleges_offering = the colleges of the id's
control-number membership). Every later re-mint moved the records' course_id
and re-keyed only some entries, so the map now has three faults the records
do not: articulated ids with no entry, entries whose offering no longer
matches the id's membership, and M-ID entries on ids no record names, whose
title belongs to another course (pre-fold keys that collide with a current
id, so a liveness test reads them as live).

An M-ID entry is purely a function of the catalog, so it is regenerated,
never re-keyed: the records' course_id is the authority for which ids need
one, and each is rebuilt by the 1b rule. A C-ID/CCN entry came from the seed's
CID Number join and passes through untouched. The plan, per id:

  fill      an articulated live M-ID with no entry: add it
  refresh   an articulated live M-ID whose entry differs from the 1b rule:
            replace it (stamps such as _identities_rekeyed_from are kept)
  same      an articulated live M-ID whose entry already matches
  keep_cid  a C-ID/CCN entry: untouched
  orphan    an M-ID entry no record names: HELD. Dropping one is a delete,
            so --apply keeps them unless --drop-orphans comes with a ruling,
            and the dry run writes them to orphan_worklist.json first
            (Sam's ruling 5, 2026-09-05: never a silent drop)
  no_record an articulated id live in no catalog: listed, nothing written

Usage (from repo root):
  python3 kb/_identities_rebuild.py                 # dry run -> kb/identities_rebuild_out/<date>/
  python3 kb/_identities_rebuild.py --apply         # fill + refresh; orphans kept
  python3 kb/_identities_rebuild.py --apply --drop-orphans --ruling "<who, when: what>"
  python3 kb/_identities_rebuild.py --check         # exit 1 when an articulated live id has no entry
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from collections import Counter, defaultdict
from datetime import date, datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
sys.path.insert(0, ROOT)
from _authority_recode_apply import _atomic_dump, _trailing_nl  # noqa: E402

KB = os.environ.get("IDENTITIES_REBUILD_KB") or HERE
OUT_DIR = os.environ.get("IDENTITIES_REBUILD_OUT") or os.path.join(HERE, "identities_rebuild_out")
OVER_MERGE_SPREAD = 8  # the 1b rule and the seed's (subject_spread >= 8 is over-merged)
STAMPS = ("_identities_rekeyed_from",)
ERA = "_identities_rebuilt"
GENERATED_BY = "kb/_identities_rebuild.py"


def _load(name):
    with open(os.path.join(KB, name), encoding="utf-8") as f:
        return json.load(f)


def _nt(t):
    return re.sub(r"[^a-z0-9]+", " ", (t or "").lower()).strip()


def derive_entry(cid, cat, sg, mem):
    """The 1b rule (kb/_remint_apply_articulations.py new_meta + offering), on
    the current catalog. None when the id is in neither M-ID catalog."""
    r = cat.get(cid)
    single = r is None
    if single:
        r = sg.get(cid)
    if r is None:
        return None
    if single:
        offering = {r["college"]} if r.get("college") else set()
    else:
        offering = {m["college"] for m in mem.get(cid, []) if m.get("college")}
    spread = r.get("subject_spread", 1) or 1
    off = sorted(offering)
    return {
        "identity_system": "M-ID",
        "title": r.get("common_title"),
        "discipline": r.get("discipline"),
        "confidence": r.get("confidence"),
        "subject_spread": r.get("subject_spread", 1),
        "over_merged": spread >= OVER_MERGE_SPREAD,
        "is_singleton": single,
        "credit_status": r.get("credit_status"),
        "credit_status_mixed": bool(r.get("credit_status_mixed")),
        "top_code_mixed": bool(r.get("top_code_mixed")),
        "noncredit_category_mixed": bool(r.get("noncredit_category_mixed")),
        "colleges_offering": off,
        "colleges_offering_count": len(off),
    }


def _bare(e):
    return {k: v for k, v in (e or {}).items() if k not in STAMPS}


def compute_plan(identities, records, cat, sg, mem):
    """Pure. Returns the per-id dispositions and the entries to write."""
    art_ids = sorted({r["course_id"] for r in records if r.get("course_id")})
    art_set = set(art_ids)
    fill, refresh, same, keep_cid, no_record = {}, {}, [], [], []
    for cid in art_ids:
        cur = identities.get(cid)
        if cur is not None and cur.get("identity_system") != "M-ID":
            keep_cid.append(cid)
            continue
        new = derive_entry(cid, cat, sg, mem)
        if new is None:  # in no M-ID catalog: nothing to derive, the entry (if any) stays
            no_record.append(cid)
            continue
        if cur is None:
            fill[cid] = new
        elif _bare(cur) == new:
            same.append(cid)
        else:
            refresh[cid] = new
    orphan = sorted(k for k, v in identities.items()
                    if k not in art_set and (v or {}).get("identity_system") == "M-ID")
    cid_unarticulated = sorted(k for k, v in identities.items()
                               if k not in art_set and (v or {}).get("identity_system") != "M-ID")
    return {"fill": fill, "refresh": refresh, "same": same, "keep_cid": keep_cid,
            "orphan": orphan, "cid_unarticulated": cid_unarticulated, "no_record": no_record,
            "entries_before": len(identities), "articulated_ids": len(art_ids)}


def apply_plan(identities, plan, drop_orphans=False):
    """Pure. The new identities map: fills added, refreshes replaced (stamps
    kept), orphans dropped only when asked, everything else byte-identical."""
    out = {}
    for k, v in identities.items():
        if k in plan["refresh"]:
            e = dict(plan["refresh"][k])
            for s in STAMPS:
                if s in v:
                    e[s] = v[s]
            out[k] = e
        elif drop_orphans and k in set(plan["orphan"]):
            continue
        else:
            out[k] = v
    for k, e in plan["fill"].items():
        out[k] = dict(e)
    return dict(sorted(out.items()))


def missing_entries(identities, records, cat, sg):
    """Articulated ids live in an M-ID catalog with no identities entry: the
    rows whose lists the export's rollup cannot build, and every merged-away
    member that cannot reach its target. Empty is the invariant."""
    return sorted({r["course_id"] for r in records
                   if r.get("course_id") and r["course_id"] not in identities
                   and (r["course_id"] in cat or r["course_id"] in sg)})


def flatten(merge_into):
    """The export's own chain flattening, imported so the target is the one the
    page draws (excel_to_dashboard.flatten_merge_chains)."""
    from excel_to_dashboard import flatten_merge_chains
    m = dict(merge_into)
    flatten_merge_chains(m)
    return m


def target_lists(identities, earned, mids):
    """What the export's rollup returns for these member ids: (adopted,
    potential). Report only; the export's nested rollup is the authority."""
    off, ad, any_art = set(), set(), False
    for m in mids:
        e = identities.get(m)
        if e:
            any_art = True
            off |= set(e.get("colleges_offering", []))
            ad |= set(earned.get(m, set()))
    return (sorted(ad), sorted(off - ad)) if any_art else ([], [])


def merge_view(identities, new_ident, records, curation, cat, sg, cid_ref):
    """Per merge target with an articulated member: the lists before and after."""
    mi = flatten({k: v["merge_into"] for k, v in curation.items() if v.get("merge_into")})
    members = defaultdict(list)
    for src, tgt in mi.items():
        members[tgt].append(src)
    earned = defaultdict(set)
    for r in records:
        if r.get("course_id"):
            earned[r["course_id"]].update(r.get("earned_by_colleges") or [])
    rows = {}
    for tgt, mems in members.items():
        if not any(m in earned for m in mems):
            continue
        has_self = tgt in cat or tgt in sg or tgt in cid_ref or tgt in identities
        mids = ([tgt] if has_self else []) + sorted(mems)
        b = target_lists(identities, earned, mids)
        a = target_lists(new_ident, earned, mids)
        rows[tgt] = {"members_articulated": sorted(m for m in mems if m in earned),
                     "members_without_entry_before": sorted(m for m in mems if m in earned and m not in identities),
                     "adopted": [len(b[0]), len(a[0])], "potential": [len(b[1]), len(a[1])]}
    return rows


def write_receipt(plan, view, identities, records, out, today):
    os.makedirs(out, exist_ok=True)
    by_course = defaultdict(list)
    for r in records:
        if r.get("course_id"):
            by_course[r["course_id"]].append(r)
    changed = {t: v for t, v in view.items() if v["adopted"][0] != v["adopted"][1]
               or v["potential"][0] != v["potential"][1]}
    reached = {t: v for t, v in view.items() if v["members_without_entry_before"]}
    counts = {"articulated_ids": plan["articulated_ids"], "entries_before": plan["entries_before"],
              "fill": len(plan["fill"]), "refresh": len(plan["refresh"]), "same": len(plan["same"]),
              "keep_cid": len(plan["keep_cid"]), "orphan_held": len(plan["orphan"]),
              "cid_unarticulated_kept": len(plan["cid_unarticulated"]), "no_record": len(plan["no_record"]),
              "entries_after_apply": plan["entries_before"] + len(plan["fill"]),
              "entries_after_apply_with_drop": plan["entries_before"] + len(plan["fill"]) - len(plan["orphan"]),
              "merge_targets_with_articulated_members": len(view),
              "merge_targets_reached_by_a_member_without_entry": len(reached),
              "merge_targets_whose_lists_change": len(changed)}
    refresh_why = Counter()
    for k, new in plan["refresh"].items():
        cur = _bare(identities[k])
        if _nt(cur.get("title")) != _nt(new.get("title")):
            refresh_why["title differs (the entry describes another course)"] += 1
        elif set(cur.get("colleges_offering") or []) != set(new["colleges_offering"]):
            refresh_why["offering differs from the membership"] += 1
        else:
            refresh_why["metadata only"] += 1
    flips = sum(1 for k, new in plan["refresh"].items()
                if bool(identities[k].get("over_merged")) != new["over_merged"])
    doc = {"_status": f"DRY-RUN {today} — nothing applied", "_generated_by": GENERATED_BY,
           "_rule": ("every articulated live M-ID gets the entry the 1b rule derives from the current catalog "
                     "(kb/_remint_apply_articulations.py); C-ID/CCN entries pass through; M-ID entries no "
                     "record names are held for a ruling"),
           "counts": counts, "refresh_why": dict(refresh_why), "over_merged_flips": flips,
           "fill": sorted(plan["fill"]), "refresh": sorted(plan["refresh"]),
           "no_record": plan["no_record"],
           "merge_targets": {t: view[t] for t in sorted(reached)}}
    _atomic_dump(os.path.join(out, "plan.json"), doc, True)
    rows = []
    for k in plan["orphan"]:
        e = identities[k]
        rows.append({"identity": k, "entry_title": e.get("title"),
                     "colleges_offering": len(e.get("colleges_offering") or []),
                     "rekeyed_from": e.get("_identities_rekeyed_from"),
                     "why": "no articulation record names this id, so the export's rollup reads "
                            "an entry with nothing to adopt"})
    _atomic_dump(os.path.join(out, "orphan_worklist.json"), {
        "_status": f"DRY-RUN {today} — held; nothing dropped",
        "_generated_by": GENERATED_BY,
        "_rule": "Sam's ruling 5, 2026-09-05: a removed set is a worklist, never a silent drop.",
        "count": len(rows), "rows": rows}, True)
    L = [f"# Identities map rebuild — dry run {today}", "", f"status: DRY-RUN {today}, nothing applied", "",
         f"- articulated ids: {plan['articulated_ids']:,}; entries now: {plan['entries_before']:,}",
         f"- fill {len(plan['fill']):,} · refresh {len(plan['refresh']):,} · same {len(plan['same']):,} · "
         f"C-ID/CCN kept {len(plan['keep_cid']):,} · no catalog record {len(plan['no_record']):,}",
         f"- orphan M-ID entries held: {len(plan['orphan']):,} (orphan_worklist.json); "
         f"C-ID/CCN entries with no record, kept: {len(plan['cid_unarticulated']):,}",
         f"- refresh, why: " + "; ".join(f"{k} {v:,}" for k, v in refresh_why.most_common()),
         f"- over_merged flips on refresh: {flips:,}",
         f"- entries after --apply: {counts['entries_after_apply']:,}; "
         f"with --drop-orphans: {counts['entries_after_apply_with_drop']:,}", "",
         "## Merge targets", "",
         f"- targets with an articulated member: {len(view):,}",
         f"- reached by a member that had no entry: {len(reached):,}",
         f"- whose adopter or potential count changes: {len(changed):,}", "",
         "| target | members without entry before | adopted | potential |", "|---|---|---|---|"]
    for t in sorted(reached, key=lambda t: (-len(reached[t]["members_without_entry_before"]), t))[:30]:
        v = reached[t]
        L.append(f"| `{t}` | {', '.join(v['members_without_entry_before'][:4])} | "
                 f"{v['adopted'][0]} to {v['adopted'][1]} | {v['potential'][0]} to {v['potential'][1]} |")
    L += ["", "## Apply", "",
          "1. `python3 kb/_identities_rebuild.py --apply` writes the fills and refreshes and keeps the orphans;",
          "   `--drop-orphans --ruling \"<who, when: what>\"` also drops them, after this worklist.",
          "2. Commit kb/coci_articulations.json in one cron window; the daily run rebuilds the lists.",
          "3. `python3 kb/_identities_rebuild.py --check` then exits 0.", ""]
    with open(os.path.join(out, "report.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(L))
    return counts


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--drop-orphans", action="store_true")
    ap.add_argument("--ruling")
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--out")
    args = ap.parse_args()
    today = date.today().isoformat()
    art_path = os.path.join(KB, "coci_articulations.json")
    art = _load("coci_articulations.json")
    identities = art.get("identities") or {}
    records = art.get("articulations") or []
    cat = _load("coci_minted_courses.json")["courses"]
    sg = _load("coci_minted_singletons.json")["courses"]
    if args.check:
        miss = missing_entries(identities, records, cat, sg)
        print(f"articulated live ids with no identities entry: {len(miss)}"
              + (f" (sample {miss[:5]})" if miss else ""))
        return 1 if miss else 0
    mem = _load("coci_minted_memberships.json")["memberships"]
    plan = compute_plan(identities, records, cat, sg, mem)
    print(f"articulated {plan['articulated_ids']:,} · entries {plan['entries_before']:,} · fill {len(plan['fill']):,} · "
          f"refresh {len(plan['refresh']):,} · same {len(plan['same']):,} · C-ID kept {len(plan['keep_cid']):,} · "
          f"orphans held {len(plan['orphan']):,} · no record {len(plan['no_record']):,}")
    if not args.apply:
        curation = _load("coci_curation.json").get("curations", {})
        cid_ref = _load(os.path.join("reference", "coci_courses.json"))["courses"]
        view = merge_view(identities, apply_plan(identities, plan), records, curation, cat, sg, cid_ref)
        out = args.out or os.path.join(OUT_DIR, today)
        counts = write_receipt(plan, view, identities, records, out, today)
        print(f"DRY RUN — receipt → {os.path.relpath(out, ROOT)}/ · merge targets reached "
              f"{counts['merge_targets_reached_by_a_member_without_entry']:,}")
        return 0
    if args.drop_orphans and not args.ruling:
        sys.exit("ABORT: --drop-orphans needs --ruling \"<who, when: what>\" (a drop is a delete).")
    new_ident = apply_plan(identities, plan, drop_orphans=args.drop_orphans)
    gates = {
        "G1 every articulated live id has an entry": not missing_entries(new_ident, records, cat, sg),
        "G2 every C-ID/CCN entry untouched": all(new_ident.get(k) == v for k, v in identities.items()
                                                 if (v or {}).get("identity_system") != "M-ID"),
        "G3 a second plan changes nothing": not (lambda p: p["fill"] or p["refresh"])(
            compute_plan(new_ident, records, cat, sg, mem)),
    }
    for g, ok in gates.items():
        print(f"  {'PASS' if ok else 'FAIL'}  {g}")
    if not all(gates.values()):
        sys.exit("gate failure — nothing written")
    if new_ident == identities:
        print("no change — the map already matches the catalog")
        return 0
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    art["identities"] = new_ident
    art.setdefault(ERA, []).append({"at": now, "fill": len(plan["fill"]), "refresh": len(plan["refresh"]),
                                    "orphans_dropped": len(plan["orphan"]) if args.drop_orphans else 0,
                                    **({"ruling": args.ruling} if args.ruling else {})})
    _atomic_dump(art_path, art, _trailing_nl(art_path))
    print(f"APPLIED: fill {len(plan['fill']):,} · refresh {len(plan['refresh']):,} · orphans "
          f"{'dropped' if args.drop_orphans else 'kept'} {len(plan['orphan']):,}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
