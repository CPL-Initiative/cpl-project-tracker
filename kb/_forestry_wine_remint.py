#!/usr/bin/env python3
"""Sheet 104: ten forestry identities move from AGRI to ENVR, four wine identities to AGPR (Rule 7).

Sam ruled on 2026-10-20 (Open Asks Sheet 104, 03:31-03:32Z, both as proposed; `cpl_memory`
`sam-sheet-104-rulings-2026-10-20`): "move-ten" (the ten forestry courses the Sheet 103 sitting set aside
re-key to ENVR under Forestry/Natural Resources) and "agpr" (the four wine courses re-key to AGPR under
Agricultural Production). This re-keys exactly those fourteen, pinned by id, title and target code.

WHAT MOVES. The key and the discipline: `AGRI M1064` becomes `ENVR M1064` where that number is free, else the
authority recode's allocator gap-fills it. Unlike Sheet 103 (whose family codes sat inside the Agriculture
umbrella), each record's `discipline` follows its new code, and its TOP-derived `discipline_source` goes with
the old value: a curator ruling set it, so it takes the "manual" state (value, no source) that
kb/_kin_pe_pass2.py's flip_disc established, which no re-derivation touches and the TOP gate never holds out.
An identity merged into another moves too, and so does every pointer at a moved id.

NOT MOVED. The four ENVR courses on the same subjects (ENVR M1009, M10CM, M10DI, M1025) stay where they are;
after this window they go to the merge worklist.

APPLY. As kb/_agri_family_remint.py, with this re-mint's stamp `_forestry_wine_remint_from`. Register the
receipt in kb/alias_chain.py ALIAS_MAPS in the same commit, run kb/_post_apply_chain.py and `--rekey-skyview`,
rebuild the SkyView payloads, and after the merge re-key Supabase kb_curation with supabase-rekey.yml.

Run:
  python3 kb/_forestry_wine_remint.py                                  # dry run -> kb/forestry_wine_remint_out/<date>/
  python3 kb/_forestry_wine_remint.py --apply --receipt kb/forestry_wine_remint_out/<date>/alias_map.json \\
      --fresh-read <live.json>
  python3 kb/_forestry_wine_remint.py --rekey-skyview --receipt kb/forestry_wine_remint_out/<date>/alias_map.json
  Add `--set stragglers` to each for the two forestry identities merged into ENVR M1069 (out dir <date>-stragglers).
"""
import argparse
import json
import os
import sys
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import _authority_recode_dryrun as rec  # noqa: E402  (Allocator, parse_id, SUBJ4_RE, load_id_reservations)
import _eths_remint as er  # noqa: E402  (apply_plan, post_gates, fresh_read_check, rekey_skyview, I/O)

OUT_ROOT = os.environ.get("FORESTRY_WINE_REMINT_OUT") or os.path.join(HERE, "forestry_wine_remint_out")
STAMP = "_forestry_wine_remint_from"
RESIDUAL = "AGRI"
DISCIPLINES = {"ENVR": "Forestry/Natural Resources", "AGPR": "Agricultural Production"}
FAMILIES = tuple(DISCIPLINES)
SCOPE = "sheet104-move-ten-agpr"
RULING = ('Sam, 2026-10-20 (Open Asks Sheet 104, 03:31-03:32Z, "move-ten" and "agpr"): the ten forestry courses '
          'the Sheet 103 sitting set aside re-key from AGRI to ENVR (Forestry/Natural Resources) and the four wine '
          'courses to AGPR (Agricultural Production), each record\'s discipline following its code')
PINS = {
    "AGRI M1064": ("Wildland Trees and Shrubs (Dendrology)", "ENVR"),
    "AGRI M1069": ("Forest Ecology", "ENVR"),
    "AGRI M10AX": ("Advanced Forest Ecology and Management", "ENVR"),
    "AGRI M10IL": ("Applied Forest Inventory and Management", "ENVR"),
    "AGRI M10IZ": ("Forest Management and Assessment", "ENVR"),
    "AGRI M10KI": ("Beginning Forestry", "ENVR"),
    "AGRI M10OP": ("Silviculture and Fire Ecology", "ENVR"),
    "AGRI M10OQ": ("Forest Ecology and Management", "ENVR"),
    "AGRI M10SX": ("Forest Protection and Health", "ENVR"),
    "AGRI M1103": ("Forest Health and Protection", "ENVR"),
    "AGRI M1106": ("Wines of France", "AGPR"),
    "AGRI M1119": ("Wines of Italy", "AGPR"),
    "AGRI M1113": ("Wine Service and Hospitality", "AGPR"),
    "AGRI M10FP": ("Beginning Wine Sensory Analysis", "AGPR"),
}
# The follow-up set (S432, proceeded on the recommendation; a card on the standing sheet reverses it): two
# forestry identities the Sheet 103 sitting never set aside, because Jev placed them in AGPS below the gate, stay
# on AGRI while merged into ENVR M1069, the forestry parent "move-ten" moved. Both carry TOP 0114.00 (Forestry).
SETS = {
    "sheet104": (SCOPE, RULING, PINS, ""),
    "stragglers": (
        "sheet104-forestry-stragglers",
        'S432 on Sam\'s Sheet 104 "move-ten" (2026-10-20), proceeded on the recommendation: the two forestry '
        'identities merged into ENVR M1069 that the sitting never named follow their parent to ENVR',
        {"AGRI M10SY": ("Forest Surveying", "ENVR"),
         "AGRI M1104": ("Introduction to Forest Operations", "ENVR")},
        "-stragglers"),
}
SOURCE_KEYS = ("discipline_source", "discipline_confidence", "discipline_inferred_at")


def pinned(_sitting=None):
    """id -> (title, target code) for the identities the ruling moves."""
    return dict(PINS)


def compute_plan(courses, singletons, curations, reservations, pins):
    """Pure. The plan dict the receipt and the apply consume."""
    found, v0_bad = {}, []
    stamps_from = {r.get(STAMP): k for k, r in list(courses.items()) + list(singletons.items()) if r.get(STAMP)}
    for cid, (title_wanted, family) in sorted(pins.items()):
        r = courses.get(cid) or singletons.get(cid)
        if r is None:
            if cid in stamps_from:
                continue                     # already moved under this re-mint: P0 reports it
            v0_bad.append(f"{cid} is not in the catalog")
            continue
        why = []
        if (r.get("common_title") or "") != title_wanted:
            why.append(f"title {r.get('common_title')!r} is not the ruling's {title_wanted!r}")
        if family not in FAMILIES:
            why.append(f"target {family!r} is not one of {FAMILIES}")
        if not cid.startswith(RESIDUAL + " "):
            why.append(f"not on {RESIDUAL}")
        if why:
            v0_bad.append(f"{cid}: " + "; ".join(why))
        found[cid] = (r, family)

    moves = {}
    for cid, (r, family) in found.items():
        moves[cid] = {"old_id": cid, "source": "minted" if cid in courses else "singleton",
                      "title": r.get("common_title") or "", "route": family,
                      "discipline": DISCIPLINES.get(family), "discipline_before": r.get("discipline"),
                      "discipline_source_before": r.get("discipline_source"),
                      "top_code": r.get("top_code"),
                      "merged_into": (curations.get(cid) or {}).get("merge_into")}
    real = set(courses) | set(singletons) | set(curations)
    alloc = rec.Allocator(real - set(moves), reservations)
    order = sorted(moves)
    for cid in order:                                   # pass 1: keep the number
        _, letter, band, tail, _ = rec.parse_id(cid)
        want = f"{moves[cid]['route']} {letter}{band}{tail}"
        moves[cid]["new_id"], moves[cid]["how"] = None, None
        if alloc.free(want):
            alloc.taken.add(want)
            moves[cid]["new_id"], moves[cid]["how"] = want, "kept number"
    for cid in order:                                   # pass 2: gap-fill the rest
        if moves[cid]["new_id"]:
            continue
        route = moves[cid]["route"]
        moves[cid]["new_id"], moves[cid]["how"] = alloc.place(cid, route, prefer_keep=False,
                                                              reason=f"{cid} -> {route} ({SCOPE})")
    alias = {k: v["new_id"] for k, v in moves.items() if v.get("new_id")}
    new_ids = list(alias.values())
    applied = sorted(k for k in stamps_from if k in pins)
    validation = {
        "V0_pinned_set": {"pass": not v0_bad and (len(found) + len(applied)) == len(pins),
                          "problems": v0_bad, "found": len(found), "pinned": len(pins)},
        "P0_not_applied": {"pass": not applied, "applied": applied},
        "V2_new_ids_unique_and_free": {"pass": len(set(new_ids)) == len(new_ids) == len(moves)
                                       and not (set(new_ids) & (real - set(moves))),
                                       "unplaced": sorted(set(moves) - set(alias))},
        "V3_codes_and_bands": {"pass": all(v["new_id"].startswith(v["route"] + " ") and rec.SUBJ4_RE.match(v["route"])
                                           for v in moves.values() if v.get("new_id"))},
    }
    return {"scopes": [SCOPE], "moves": moves, "alias": alias, "validation": validation,
            "gapfilled": alloc.gapfilled}


def render_report(plan, today, receipt):
    by = {}
    for v in plan["moves"].values():
        by[v["route"]] = by.get(v["route"], 0) + 1
    L = [f"# Sheet 104 re-mint ({SCOPE}): forestry to ENVR, wine to AGPR - dry run {today}", "",
         f"The ruling: {RULING}. The re-mint runs under the playbook (docs/coursecontrolnumber_remint.md).", "",
         "## Validation", ""]
    for k, v in plan["validation"].items():
        L.append(f"- **{k}**: {'pass' if v.get('pass') else 'FAIL'}"
                 + ("" if v.get("pass") else f" `{json.dumps({x: y for x, y in v.items() if x != 'pass'})}`"))
    L += ["", f"## Moves ({len(plan['moves'])}: " + ", ".join(f"{k} {n}" for k, n in sorted(by.items())) + ")", "",
          "| Old id | New id | How | Title | Merged into | Discipline before (source) | Discipline after | TOP |",
          "|---|---|---|---|---|---|---|---|"]
    for k, v in sorted(plan["moves"].items()):
        L.append(f"| {k} | {v.get('new_id')} | {v.get('how')} | {v['title']} | {v.get('merged_into') or ''} | "
                 f"{v.get('discipline_before')} ({v.get('discipline_source_before') or 'none'}) | "
                 f"{v.get('discipline')} | {v.get('top_code')} |")
    reused = plan.get("reused_retired_ids") or []
    if reused:
        L += ["", f"**{len(reused)} new ids take a slot an earlier re-mint vacated**: "
              + ", ".join(reused) + ". The chain resolves a stored id through the maps of its own era."]
    L += ["", "## Not moved", "",
          "The four ENVR courses on the same subjects (ENVR M1009, M10CM, M10DI, M1025) stay; after this window they "
          "go to the merge worklist.", "",
          "## After the apply", "",
          "1. Register the receipt in `kb/alias_chain.py` ALIAS_MAPS in the same commit, and run "
          "`python3 kb/_post_apply_chain.py`.",
          f"2. Re-key SkyView's hand-built layout: `python3 kb/_forestry_wine_remint.py --rekey-skyview --receipt {receipt}`, "
          "then rebuild the payloads the lints check.",
          f"3. After the merge, before the next cron's curation sync: dispatch `supabase-rekey.yml` with "
          f"`alias_map_path={receipt}`.",
          "4. Read the live kb_curation rows back: none on an old id.", ""]
    return "\n".join(L)


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--receipt", help="the reviewed alias_map.json the apply must reproduce (P1)")
    ap.add_argument("--fresh-read", help="live kb_curation rows (JSON list of {course_id, field, value}) (P3)")
    ap.add_argument("--rekey-skyview", action="store_true",
                    help="after an apply: re-key SkyView's hand-built layout files from the APPLIED --receipt")
    ap.add_argument("--set", default="sheet104", choices=sorted(SETS),
                    help="which pinned set: the fourteen Sheet 104 named, or the two forestry stragglers")
    args = ap.parse_args(argv)
    global SCOPE, RULING, PINS
    SCOPE, RULING, PINS, suffix = SETS[args.set]
    if args.rekey_skyview:
        if not args.receipt:
            sys.exit("--rekey-skyview needs --receipt (an applied one)")
        with open(args.receipt, encoding="utf-8") as f:
            receipt = json.load(f)
        if not receipt.get("_applied_at"):
            sys.exit("--rekey-skyview reads an APPLIED receipt; this one is a dry run")
        alias = {k: (v["new_id"] if isinstance(v, dict) else v) for k, v in receipt["aliases"].items()}
        print("SkyView layout re-keyed:", er.rekey_skyview(alias))
        return 0
    if args.apply and not (args.receipt and args.fresh_read):
        sys.exit("--apply needs --receipt and --fresh-read")

    today = date.today().isoformat()
    docs = er.load_docs()
    courses, singletons = docs["courses"]["courses"], docs["singletons"]["courses"]
    curations = docs["curation"]["curations"]
    pins = pinned()
    plan = compute_plan(courses, singletons, curations, rec.load_id_reservations(), pins)
    plan["reused_retired_ids"] = sorted(set(plan["alias"].values()) & er.ever_minted_ids())
    print(f"Sheet 104 re-mint - moving {len(plan['moves'])} of {len(pins)} pinned off {RESIDUAL}")
    for k, v in plan["validation"].items():
        print(f"  {k}: {'ok' if v.get('pass') else 'FAIL'}")

    if not args.apply:
        out = os.path.join(OUT_ROOT, today + suffix)
        rp = os.path.join(out, "alias_map.json")
        if os.path.exists(rp):
            with open(rp, encoding="utf-8") as f:
                if json.load(f).get("_applied_at"):
                    sys.exit(f"{os.path.relpath(out, ROOT)} holds an applied receipt; a dry run never overwrites it")
        os.makedirs(out, exist_ok=True)
        er.dump(os.path.join(out, "plan.json"), plan)
        er.dump(rp, {
            "_status": "Sheet 104 re-mint old->new alias (receipt + rollback inverse) - DRY RUN, not applied",
            "_at": today, "_scope": [SCOPE], "_count": len(plan["alias"]), "_ruling": RULING,
            "aliases": {k: {"new_id": v, "route": plan["moves"][k]["route"],
                            "discipline": plan["moves"][k]["discipline"]}
                        for k, v in sorted(plan["alias"].items())}})
        with open(os.path.join(out, "report.md"), "w", encoding="utf-8") as f:
            f.write(render_report(plan, today, os.path.relpath(rp, ROOT)))
        print(f"DRY RUN - wrote {os.path.relpath(out, ROOT)}/(plan.json, alias_map.json, report.md)")
        return 0 if all(v.get("pass") for v in plan["validation"].values()) else 1

    # ── apply ──
    with open(args.receipt, encoding="utf-8") as f:
        receipt = json.load(f)
    frozen = {k: (v["new_id"] if isinstance(v, dict) else v) for k, v in receipt.get("aliases", {}).items()}
    plan["validation"]["P1_matches_receipt"] = {"pass": frozen == plan["alias"] and receipt.get("_scope") == [SCOPE]}
    with open(args.fresh_read, encoding="utf-8") as f:
        plan["validation"]["P3_fresh_read"] = er.fresh_read_check(json.load(f), curations, plan)
    before = {n: {k: (dict(v) if isinstance(v, dict) else v) for k, v in d.items()} for n, d in docs.items()}
    pre_art = sum(1 for a in docs["articulations"].get("articulations", []) if a.get("course_id") in plan["alias"])
    saved, er.STAMP = er.STAMP, STAMP
    try:
        docs, counts = er.apply_plan(docs, plan)
    finally:
        er.STAMP = saved
    for name in ("courses", "singletons"):           # a curator ruling set the discipline: the manual state
        for nk in plan["alias"].values():
            r = docs[name]["courses"].get(nk)
            if r is not None:
                for k in SOURCE_KEYS:
                    r.pop(k, None)
                counts["discipline_sources_cleared"] += 1
    plan["validation"].update(er.post_gates(before, docs, plan, pre_art))
    bad = [k for k, v in plan["validation"].items() if not v.get("pass")]
    for k in ("P1_matches_receipt", "P3_fresh_read", "V1_conservation", "V3_discipline_follows_route",
              "V4_articulations", "V5_nothing_left_on_an_old_id"):
        print(f"  {k}: {'ok' if plan['validation'][k].get('pass') else 'FAIL'}")
    if bad:
        sys.exit("APPLY BLOCKED - " + ", ".join(bad) + ": " +
                 json.dumps({k: plan["validation"][k] for k in bad})[:600])
    for name, f in er.FILES.items():
        er.dump(os.path.join(er.KB_DIR, f), docs[name])
    receipt.update({"_status": "Sheet 104 re-mint old->new alias (receipt + rollback inverse) - APPLIED",
                    "_applied_at": today, "_applied_ruling": RULING, "_counts": dict(counts)})
    er.dump(args.receipt, receipt)
    print(f"APPLIED - {dict(counts)}. Next: register the receipt in kb/alias_chain.py ALIAS_MAPS, run "
          f"kb/_post_apply_chain.py and --rekey-skyview, commit, then dispatch supabase-rekey.yml with the receipt.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
