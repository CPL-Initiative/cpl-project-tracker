#!/usr/bin/env python3
"""Sheet 107 card 3: the eight checkable blank stray codes, 79 identities, filed under the discipline both signals name (Rule 7).

Sam ruled on 2026-10-20 (Open Asks Sheet 107 card 3, 13:09Z, his own call, "file-eight"; proposed on Sheet 106 by
S435). kb/_csr_stray_triage.py (kb/csr_out/stray_triage.md) read the colleges' own signal for the stray codes with no
discipline: for each member course, the discipline the same college's other identities on the same local subject
carry. On eight codes that vote passes the gate (85% of at least 10 votes) and the titles name the same field:
ARCE, ARTF and NCAR to Art (ARTS); CSMT to Cosmetology (COSM); BRDC to Broadcasting Technology (BCST); FLGH to
Aviation (AVIA); ARTP to Photography (PHOT); WELL to Health (HLTH).

WHAT MOVES. Each identity re-keys to its discipline's Common SUBJ, keeping its number where free, and takes that
discipline; the blank had no source, so the record lands in the manual state (value, no source) a curator ruling
sets. Pinned by id, title and target, frozen from the catalog on 2026-10-20 (all 79 blank).

NOT MOVED. The seven codes S435 set aside (SGNG, CMPE, RTVF disagree with their titles; EPHO, BUST, GLOB, VFPA are
too thin) and the 86 with no checkable answer stay on the discipline-blank worklist for a curator.

APPLY. As kb/_forestry_wine_remint.py, with this re-mint's stamp `_blank_stray_remint_from`. Register the receipt
in kb/alias_chain.py ALIAS_MAPS, run kb/_post_apply_chain.py and `--rekey-skyview`, and after the merge re-key
Supabase kb_curation with supabase-rekey.yml.

Run:
  python3 kb/_blank_stray_remint.py                                  # dry run -> kb/blank_stray_remint_out/<date>/
  python3 kb/_blank_stray_remint.py --apply --receipt kb/blank_stray_remint_out/<date>/alias_map.json \\
      --fresh-read <live.json>
  python3 kb/_blank_stray_remint.py --rekey-skyview --receipt kb/blank_stray_remint_out/<date>/alias_map.json
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

OUT_ROOT = os.environ.get("BLANK_STRAY_REMINT_OUT") or os.path.join(HERE, "blank_stray_remint_out")
STAMP = "_blank_stray_remint_from"
FROM_CODES = ("ARCE", "ARTF", "NCAR", "CSMT", "BRDC", "FLGH", "ARTP", "WELL")
DISCIPLINES = {"ARTS": "Art", "COSM": "Cosmetology", "BCST": "Broadcasting Technology", "AVIA": "Aviation",
               "PHOT": "Photography", "HLTH": "Health"}
FAMILIES = tuple(DISCIPLINES)
SCOPE = "csr-blank-strays-file-eight"
RULING = ('Sam, 2026-10-20 (Open Asks Sheet 107 card 3, 13:09Z, his own call, "file-eight"; proposed on Sheet 106 by '
          'S435): the 79 identities on the eight stray codes whose two signals agree take the discipline both name '
          'and re-key to its Common SUBJ')
# id -> (title, target code), frozen 2026-10-20 from the catalog: every identity on the eight codes, all blank.
PINS = {
    "ARCE M1001": ("Ceramic Handbuilding 2", "ARTS"),
    "ARCE M10AA": ("Alternative Firing Techniques", "ARTS"),
    "ARCE M10AB": ("Alternative Throwing Techniques", "ARTS"),
    "ARCE M10AC": ("Ceramic Handbuilding 1", "ARTS"),
    "ARCE M10AD": ("Ceramic Handbuilding 3", "ARTS"),
    "ARCE M10AE": ("Ceramic Handbuilding 4", "ARTS"),
    "ARCE M10AF": ("Ceramic Surface Design and Techniques", "ARTS"),
    "ARCE M10AG": ("Ceramic Wheel Throwing 1", "ARTS"),
    "ARCE M10AH": ("Ceramic Wheel Throwing 2", "ARTS"),
    "ARCE M10AI": ("Ceramic Wheel Throwing 3", "ARTS"),
    "ARCE M10AJ": ("Ceramic Wheel Throwing 4", "ARTS"),
    "ARCE M10AK": ("Clay and Glass", "ARTS"),
    "ARCE M10AL": ("Introduction to Glaze Experimentation", "ARTS"),
    "ARCE M10AM": ("Kiln-Formed Glass 1", "ARTS"),
    "ARCE M10AN": ("Kiln-Formed Glass 2", "ARTS"),
    "ARCE M10AO": ("Kiln-Formed Glass 3", "ARTS"),
    "ARCE M10AP": ("Kiln-Formed Glass 4", "ARTS"),
    "ARTF M1001": ("2-Dimensional Art Studio Lab", "ARTS"),
    "ARTF M1002": ("3-Dimensional Art Studio Lab", "ARTS"),
    "ARTF M1003": ("African Art", "ARTS"),
    "ARTF M1008": ("Ceramics Studio Lab", "ARTS"),
    "ARTF M10AA": ("Art Entrepreneurship", "ARTS"),
    "ARTF M10AB": ("Art of the United States: Colonial to Modern Period", "ARTS"),
    "ARTF M10AD": ("Ceramic Production 1", "ARTS"),
    "ARTF M10AE": ("Ceramic Production 2", "ARTS"),
    "ARTF M10AI": ("Industrial and Architectural Ceramic Design 1", "ARTS"),
    "ARTF M10AJ": ("Industrial and Architectural Ceramic Design 2", "ARTS"),
    "ARTF M10AK": ("Introduction to Digital Drawing and Painting", "ARTS"),
    "ARTF M10AR": ("Museum Studies Lab", "ARTS"),
    "ARTF M10AS": ("Native American Art", "ARTS"),
    "ARTF M10AU": ("Public Art 1", "ARTS"),
    "ARTF M10AV": ("Public Art 2", "ARTS"),
    "ARTF M10AW": ("Sustainable Art and Design", "ARTS"),
    "ARTP M10AA": ("Advanced Photogaphy", "PHOT"),
    "ARTP M10AB": ("Alternative Process Photo", "PHOT"),
    "ARTP M10AN": ("Portfolio / Laboratory Practices", "PHOT"),
    "ARTP M10AO": ("Trends in Software and Social Media for Photographers", "PHOT"),
    "ARTP M90AA": ("Introduction to Camera Basics", "PHOT"),
    "BRDC M1003": ("Radio Broadcast Lab", "BCST"),
    "BRDC M10AL": ("Digital Radio Studio Systems", "BCST"),
    "BRDC M10AV": ("Introduction to Writing for Broadcast", "BCST"),
    "BRDC M10BF": ("Radio Documentary Production", "BCST"),
    "BRDC M10BG": ("Radio Operations 1", "BCST"),
    "BRDC M10BH": ("Radio Operations 2", "BCST"),
    "BRDC M10BI": ("Radio Programming and Marketing", "BCST"),
    "BRDC M10BK": ("Sound Design for Digital Film/Video/Radio", "BCST"),
    "CSMT M10AC": ("Advanced Hair Coloring and Styling", "COSM"),
    "CSMT M10AD": ("Advanced Makeup Techniques", "COSM"),
    "CSMT M10AE": ("Contemporary Styling Techniques", "COSM"),
    "CSMT M10AK": ("Hair Sculpting Techniques for Women", "COSM"),
    "CSMT M10AN": ("Intermediate Hair Coloring and Styling", "COSM"),
    "CSMT M10AV": ("Introduction to Hair Coloring", "COSM"),
    "CSMT M10AW": ("Junior Salon 2", "COSM"),
    "CSMT M10AX": ("Long Hair and Period Hair Design and Hair Piece Construction", "COSM"),
    "CSMT M10AY": ("Multi-Texture Design (Level 1-2)", "COSM"),
    "CSMT M10AZ": ("Senior Salon 1", "COSM"),
    "CSMT M10BA": ("Senior Salon 2", "COSM"),
    "CSMT M10BB": ("Skin Therapy 1", "COSM"),
    "CSMT M10BC": ("Skin Therapy 2", "COSM"),
    "CSMT M10BD": ("Skin Therapy 3", "COSM"),
    "CSMT M10BE": ("Skin Therapy 4", "COSM"),
    "CSMT M10BF": ("Tinting 1", "COSM"),
    "FLGH M1002": ("Human Factors and Crew Resource Management", "AVIA"),
    "FLGH M10AB": ("Advanced Navigation", "AVIA"),
    "FLGH M10AE": ("Commercial Pilot 1 Flight Lab", "AVIA"),
    "FLGH M10AF": ("Commercial Pilot 2 Flight Lab", "AVIA"),
    "FLGH M10AH": ("Human Factors & Crew Resource Management", "AVIA"),
    "FLGH M90AA": ("Introduction to Flight Science", "AVIA"),
    "NCAR M90AA": ("Advanced Techniques in Painting", "ARTS"),
    "NCAR M90AC": ("Basic Drawing and Sketching", "ARTS"),
    "NCAR M90AD": ("Fundamentals of Drawing for Commercial Artists", "ARTS"),
    "NCAR M90AE": ("Intermediate Techniques in Painting", "ARTS"),
    "NCAR M90AF": ("Multimedia Sculpture", "ARTS"),
    "NCAR M90AG": ("Painting and Drawing", "ARTS"),
    "NCAR M90AJ": ("Portrait and Figure Drawing and Painting", "ARTS"),
    "NCAR M90AK": ("Watercolor Painting, Beginning", "ARTS"),
    "NCAR M90AL": ("Watercolor Painting, Intermediate", "ARTS"),
    "NCAR M90AM": ("Watercolor Painting on Location", "ARTS"),
    "WELL M10AU": ("Introduction to Wholistic Health", "HLTH"),
}
SETS = {"file-eight": (SCOPE, RULING, PINS, "")}
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
        if cid.split(" ")[0] not in FROM_CODES:
            why.append(f"not on one of the eight stray codes")
        if r.get("discipline"):
            why.append(f"discipline {r.get('discipline')!r} is no longer blank")
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
    L = [f"# Blank stray re-mint ({SCOPE}): eight codes filed under the discipline both signals name - dry run {today}", "",
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
          "The seven codes S435 set aside and the 86 with no checkable answer stay on the discipline-blank worklist.", "",
          "## After the apply", "",
          "1. Register the receipt in `kb/alias_chain.py` ALIAS_MAPS in the same commit, and run "
          "`python3 kb/_post_apply_chain.py`.",
          f"2. Re-key SkyView's hand-built layout: `python3 kb/_blank_stray_remint.py --rekey-skyview --receipt {receipt}`, "
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
    ap.add_argument("--set", default="file-eight", choices=sorted(SETS), help=argparse.SUPPRESS)
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
    print(f"Blank stray re-mint - moving {len(plan['moves'])} of {len(pins)} pinned")
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
            "_status": "Blank stray re-mint old->new alias (receipt + rollback inverse) - DRY RUN, not applied",
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
    receipt.update({"_status": "Blank stray re-mint old->new alias (receipt + rollback inverse) - APPLIED",
                    "_applied_at": today, "_applied_ruling": RULING, "_counts": dict(counts)})
    er.dump(args.receipt, receipt)
    print(f"APPLIED - {dict(counts)}. Next: register the receipt in kb/alias_chain.py ALIAS_MAPS, run "
          f"kb/_post_apply_chain.py and --rekey-skyview, commit, then dispatch supabase-rekey.yml with the receipt.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
