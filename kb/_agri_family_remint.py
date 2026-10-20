#!/usr/bin/env python3
"""Sheet 103: the 44 AGRI identities Jev placed in a C-ID family twice over move to their family codes (Rule 7).

Sam ruled on 2026-10-20 (Open Asks Sheet 103, 01:49Z, "Confirm the 44"), carrying out his Sheet 99 card 4
ruling ("sitting"). The Agriculture umbrella files a course by the C-ID family a student enrolls in: AGAB
(Agriculture Business), AGAS (Animal Science), AGEH (Environmental Horticulture), AGMA (Agriculture Mechanics)
and AGPS (Plant Science), with AGRI the residual for a course no family covers. Jev read the 404 AGRI
identities twice (runs 39352507898 and 39353307914); 56 passed the gate (same family both times, both at 0.9 or
above), and the 44 that are neither forestry nor wine appreciation are `proposed` in
kb/jev_agri_families/2026-10-20.json. This re-keys exactly those, pinned by id, title and family.

WHAT MOVES. The key only: `AGRI M1131` becomes `AGPS M1131` (the number kept where it is free, else the
authority recode's allocator gap-fills it). Each record keeps its own discipline, since the family codes are
the Agriculture umbrella's own codes (kb/discipline_canonical_subj4.json umbrella_codes). An identity merged
into another moves too, and so does every pointer at a moved id: the ETHS re-mint's apply re-keys curation
keys and merge_into values alike.

NOT MOVED. The ten forestry courses and the two wine-appreciation courses at the gate (`second_look`) stay on
AGRI, a discipline question for the Forestry/Natural Resources row; the 119 family proposals below the gate
and the 229 Jev left on AGRI stay too.

APPLY. As kb/_agab_one_remint.py: the ETHS re-mint's apply and post gates with this re-mint's stamp,
`_agri_family_remint_from`. Register the receipt in kb/alias_chain.py ALIAS_MAPS in the same commit, run
kb/_post_apply_chain.py and `--rekey-skyview`, rebuild the SkyView payloads the lints check, and after the
merge re-key Supabase kb_curation from the committed receipt with supabase-rekey.yml before the next cron's
curation sync.

GATES: V0 (each pinned id stands on AGRI with the sitting's title, its family one of the five), P0 (not
already applied), V2 (new ids unique and free), V3 (each new id on its family code); at apply P1 (the
recomputed alias equals the reviewed receipt), P3 (the live kb_curation rows for the ids and anything pointing
at them match the committed overlay), V1, V3, V4, V5 from the ETHS re-mint's post gates.

Run:
  python3 kb/_agri_family_remint.py                                  # dry run -> kb/agri_family_remint_out/<date>/
  python3 kb/_agri_family_remint.py --apply --receipt kb/agri_family_remint_out/<date>/alias_map.json \\
      --fresh-read <live.json>
  python3 kb/_agri_family_remint.py --rekey-skyview --receipt kb/agri_family_remint_out/<date>/alias_map.json
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

OUT_ROOT = os.environ.get("AGRI_FAMILY_REMINT_OUT") or os.path.join(HERE, "agri_family_remint_out")
SITTING = os.path.join(HERE, "jev_agri_families", "2026-10-20.json")
STAMP = "_agri_family_remint_from"
RESIDUAL = "AGRI"
FAMILIES = ("AGAB", "AGAS", "AGEH", "AGMA", "AGPS")
SCOPE = "sheet103-confirm-44"
RULING = ('Sam, 2026-10-20 (Open Asks Sheet 103, 01:49Z, "Confirm the 44"): the AGRI identities Jev placed in '
          'the same C-ID family in both sittings at 0.9 or above, less forestry and wine appreciation, move to '
          'their family codes under the playbook')


def pinned(sitting):
    """id -> (title, family) for the identities the ruling confirms."""
    rows = {r["id"]: r for r in sitting["answers"]}
    return {i: (rows[i]["title"], rows[i]["family"]) for i in sitting["proposed"]}


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
            why.append(f"title {r.get('common_title')!r} is not the sitting's {title_wanted!r}")
        if family not in FAMILIES:
            why.append(f"family {family!r} is not one of {FAMILIES}")
        if not cid.startswith(RESIDUAL + " "):
            why.append(f"not on {RESIDUAL}")
        if why:
            v0_bad.append(f"{cid}: " + "; ".join(why))
        found[cid] = (r, family)

    moves = {}
    for cid, (r, family) in found.items():
        moves[cid] = {"old_id": cid, "source": "minted" if cid in courses else "singleton",
                      "title": r.get("common_title") or "", "route": family,
                      "discipline": r.get("discipline"), "discipline_before": r.get("discipline"),
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
    L = [f"# Sheet 103 re-mint: the AGRI residual's 44 to their C-ID families - dry run {today}", "",
         f"The ruling: {RULING}. The re-mint runs under the playbook (docs/coursecontrolnumber_remint.md).", "",
         "## Validation", ""]
    for k, v in plan["validation"].items():
        L.append(f"- **{k}**: {'pass' if v.get('pass') else 'FAIL'}"
                 + ("" if v.get("pass") else f" `{json.dumps({x: y for x, y in v.items() if x != 'pass'})}`"))
    L += ["", f"## Moves ({len(plan['moves'])}: " + ", ".join(f"{k} {n}" for k, n in sorted(by.items())) + ")", "",
          "| Old id | New id | How | Title | Merged into | Discipline | TOP |", "|---|---|---|---|---|---|---|"]
    for k, v in sorted(plan["moves"].items()):
        L.append(f"| {k} | {v.get('new_id')} | {v.get('how')} | {v['title']} | {v.get('merged_into') or ''} | "
                 f"{v.get('discipline')} | {v.get('top_code')} |")
    reused = plan.get("reused_retired_ids") or []
    if reused:
        L += ["", f"**{len(reused)} new ids take a slot an earlier re-mint vacated**: "
              + ", ".join(reused) + ". The chain resolves a stored id through the maps of its own era."]
    L += ["", "## Not moved", "",
          "The ten forestry courses and two wine-appreciation courses at the gate (`second_look` in "
          "kb/jev_agri_families/2026-10-20.json) stay on AGRI, a discipline question for the Forestry/Natural "
          "Resources row. The 119 family proposals below the gate and the 229 identities Jev left on AGRI stay too.", "",
          "## After the apply", "",
          "1. Register the receipt in `kb/alias_chain.py` ALIAS_MAPS in the same commit, and run "
          "`python3 kb/_post_apply_chain.py`.",
          f"2. Re-key SkyView's hand-built layout: `python3 kb/_agri_family_remint.py --rekey-skyview --receipt {receipt}`, "
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
    args = ap.parse_args(argv)
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
    with open(SITTING, encoding="utf-8") as f:
        pins = pinned(json.load(f))
    plan = compute_plan(courses, singletons, curations, rec.load_id_reservations(), pins)
    plan["reused_retired_ids"] = sorted(set(plan["alias"].values()) & er.ever_minted_ids())
    print(f"Sheet 103 re-mint - moving {len(plan['moves'])} of {len(pins)} pinned off {RESIDUAL}")
    for k, v in plan["validation"].items():
        print(f"  {k}: {'ok' if v.get('pass') else 'FAIL'}")

    if not args.apply:
        out = os.path.join(OUT_ROOT, today)
        rp = os.path.join(out, "alias_map.json")
        if os.path.exists(rp):
            with open(rp, encoding="utf-8") as f:
                if json.load(f).get("_applied_at"):
                    sys.exit(f"{os.path.relpath(out, ROOT)} holds an applied receipt; a dry run never overwrites it")
        os.makedirs(out, exist_ok=True)
        er.dump(os.path.join(out, "plan.json"), plan)
        er.dump(rp, {
            "_status": "Sheet 103 re-mint old->new alias (receipt + rollback inverse) - DRY RUN, not applied",
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
    receipt.update({"_status": "Sheet 103 re-mint old->new alias (receipt + rollback inverse) - APPLIED",
                    "_applied_at": today, "_applied_ruling": RULING, "_counts": dict(counts)})
    er.dump(args.receipt, receipt)
    print(f"APPLIED - {dict(counts)}. Next: register the receipt in kb/alias_chain.py ALIAS_MAPS, run "
          f"kb/_post_apply_chain.py and --rekey-skyview, commit, then dispatch supabase-rekey.yml with the receipt.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
