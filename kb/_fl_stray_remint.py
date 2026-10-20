#!/usr/bin/env python3
"""The Foreign Languages strays: twelve identities on nine codes neither the umbrella nor the CSR declares (Rule 7).

S435 measured the 110 stray codes (`kb/csr_out/latest.json` `_mid_codes.strays`). Nine of them sit on identities
that already carry `discipline == "Foreign Languages"`, so no curator answer is missing: the discipline is settled
and only the code is off. The umbrella's model (docs/fl_subj4_remint_scope.md, Sam 2026-06-09) is one code per
language a student enrolls in, `FL` + an intuitive two-letter tag where no authority code exists, and FLNG the
residual for a course that is no one language. This dry run pins each of the twelve to that model:

  - three move to a language the umbrella already carries: JAPA to JAPN, GREE to FLGR, FILI to FLTA;
  - seven take a new language code under the umbrella, as Hmong, Punjabi and Nahuatl did: Aramaic FLAM,
    Hupa FLHU, Egyptian hieroglyphs FLEG, Khmer FLKH, Turkish FLTU;
  - one, Honors Linguistics, is no one language and goes to the residual FLNG.

The discipline never changes (V3: Foreign Languages before and after). The apply also adds the five new codes to
the umbrella's `umbrella_codes` in kb/discipline_canonical_subj4.json and kb/foreign_language_subj4.json, so the
daily scan reads them as by design rather than as strays.

DRY RUN ONLY until Sam answers the card (Open Asks Sheet 106): S432's apply of the same shape was held by the
session's permission check. The apply path is kb/_forestry_wine_remint.py's, via kb/_eths_remint.py.

Run:
  python3 kb/_fl_stray_remint.py                    # dry run -> kb/fl_stray_remint_out/<date>/
  python3 kb/_fl_stray_remint.py --apply --receipt kb/fl_stray_remint_out/<date>/alias_map.json \\
      --fresh-read <live.json>
  python3 kb/_fl_stray_remint.py --rekey-skyview --receipt kb/fl_stray_remint_out/<date>/alias_map.json
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

OUT_ROOT = os.environ.get("FL_STRAY_REMINT_OUT") or os.path.join(HERE, "fl_stray_remint_out")
STAMP = "_fl_stray_remint_from"
DISCIPLINE = "Foreign Languages"
SCOPE = "fl-strays-s435"
RULING = ("Proposed on Open Asks Sheet 106 (S435, 2026-10-20): the twelve Foreign Languages identities on stray "
          "codes re-key to their language's code under the umbrella (docs/fl_subj4_remint_scope.md), the discipline "
          "unchanged")
# id -> (title, target code, why)
PINS = {
    "JAPA M1001": ("Continuation of Beginning Kanji for Reading and Writing", "JAPN", "Japanese"),
    "GREE M1001": ("Elementary Modern Standard Greek", "FLGR", "Greek"),
    "FILI M1001": ("Elementary Filipino (Tagalog)", "FLTA", "Filipino (Tagalog)"),
    "ARAM M10AA": ("Aramaic 1", "FLAM", "Aramaic (new)"),
    "ARAM M10AB": ("Aramaic 2", "FLAM", "Aramaic (new)"),
    "ARAM M10AC": ("Aramaic 3", "FLAM", "Aramaic (new)"),
    "HUPA M10AA": ("Elementary Hupa 1A", "FLHU", "Hupa (new)"),
    "HUPA M10AB": ("Elementary Hupa 1B", "FLHU", "Hupa (new)"),
    "HIER M10AA": ("Egypt Hieroglyphs 1", "FLEG", "Egyptian hieroglyphs (new)"),
    "KHME M1001": ("Khmer for Heritage Speakers", "FLKH", "Khmer (new)"),
    "TURK M10AA": ("Elementary Turkish 1", "FLTU", "Turkish (new)"),
    "LING M10AF": ("Honors Linguistics 1", "FLNG", "no one language: the residual"),
}
NEW_CODES = {"FLAM": "Aramaic", "FLHU": "Hupa", "FLEG": "Egyptian Hieroglyphs", "FLKH": "Khmer", "FLTU": "Turkish"}


def compute_plan(courses, singletons, curations, reservations, pins, umbrella):
    """Pure. The plan dict the receipt and the apply consume."""
    found, v0_bad = {}, []
    stamps_from = {r.get(STAMP): k for k, r in list(courses.items()) + list(singletons.items()) if r.get(STAMP)}
    allowed = set(umbrella) | set(NEW_CODES)
    for cid, (title_wanted, code, _why) in sorted(pins.items()):
        r = courses.get(cid) or singletons.get(cid)
        if r is None:
            if cid in stamps_from:
                continue
            v0_bad.append(f"{cid} is not in the catalog")
            continue
        why = []
        if (r.get("common_title") or "") != title_wanted:
            why.append(f"title {r.get('common_title')!r} is not the pinned {title_wanted!r}")
        if r.get("discipline") != DISCIPLINE:
            why.append(f"discipline {r.get('discipline')!r} is not {DISCIPLINE!r}")
        if code not in allowed:
            why.append(f"target {code!r} is neither an umbrella code nor a proposed new one")
        if cid.split()[0] in allowed:
            why.append("already on an umbrella code")
        if why:
            v0_bad.append(f"{cid}: " + "; ".join(why))
        found[cid] = (r, code)

    moves = {}
    for cid, (r, code) in found.items():
        moves[cid] = {"old_id": cid, "source": "minted" if cid in courses else "singleton",
                      "title": r.get("common_title") or "", "route": code, "why": pins[cid][2],
                      "discipline": DISCIPLINE, "discipline_before": r.get("discipline"),
                      "discipline_source_before": r.get("discipline_source"), "top_code": r.get("top_code"),
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
    taken_codes = {k.split()[0] for k in real - set(moves)}
    validation = {
        "V0_pinned_set": {"pass": not v0_bad and (len(found) + len(applied)) == len(pins),
                          "problems": v0_bad, "found": len(found), "pinned": len(pins)},
        "P0_not_applied": {"pass": not applied, "applied": applied},
        "V2_new_ids_unique_and_free": {"pass": len(set(new_ids)) == len(new_ids) == len(moves)
                                       and not (set(new_ids) & (real - set(moves))),
                                       "unplaced": sorted(set(moves) - set(alias))},
        "V3_codes_and_bands": {"pass": all(v["new_id"].startswith(v["route"] + " ") and rec.SUBJ4_RE.match(v["route"])
                                           for v in moves.values() if v.get("new_id"))},
        "V6_new_codes_unused": {"pass": not (set(NEW_CODES) & taken_codes),
                                "in_use": sorted(set(NEW_CODES) & taken_codes)},
    }
    return {"scopes": [SCOPE], "moves": moves, "alias": alias, "validation": validation,
            "gapfilled": alloc.gapfilled}


def render_report(plan, today, receipt):
    L = [f"# Foreign Languages strays ({SCOPE}) - dry run {today}", "",
         f"{RULING}. The re-mint runs under the playbook (docs/coursecontrolnumber_remint.md).", "",
         "## Validation", ""]
    for k, v in plan["validation"].items():
        L.append(f"- **{k}**: {'pass' if v.get('pass') else 'FAIL'}"
                 + ("" if v.get("pass") else f" `{json.dumps({x: y for x, y in v.items() if x != 'pass'})}`"))
    L += ["", f"## Moves ({len(plan['moves'])})", "",
          "| Old id | New id | How | Title | Language | Merged into | TOP |", "|---|---|---|---|---|---|---|"]
    for k, v in sorted(plan["moves"].items()):
        L.append(f"| {k} | {v.get('new_id')} | {v.get('how')} | {v['title']} | {v['why']} | "
                 f"{v.get('merged_into') or ''} | {v.get('top_code')} |")
    L += ["", "New umbrella codes: " + ", ".join(f"{c} ({n})" for c, n in sorted(NEW_CODES.items())) + ".", "",
          "## After the apply", "",
          "1. Add the new codes to Foreign Languages' `umbrella_codes` (kb/discipline_canonical_subj4.json) and to "
          "kb/foreign_language_subj4.json.",
          "2. Register the receipt in `kb/alias_chain.py` ALIAS_MAPS in the same commit, and run "
          "`python3 kb/_post_apply_chain.py`.",
          f"3. `python3 kb/_fl_stray_remint.py --rekey-skyview --receipt {receipt}`, then rebuild the payloads.",
          f"4. After the merge: dispatch `supabase-rekey.yml` with `alias_map_path={receipt}`; read kb_curation back.",
          ""]
    return "\n".join(L)


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--receipt")
    ap.add_argument("--fresh-read")
    ap.add_argument("--rekey-skyview", action="store_true")
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
    with open(os.path.join(HERE, "discipline_canonical_subj4.json"), encoding="utf-8") as f:
        reg = json.load(f)
    umbrella = reg["disciplines"][DISCIPLINE].get("umbrella_codes") or []
    plan = compute_plan(courses, singletons, curations, rec.load_id_reservations(), PINS, umbrella)
    plan["reused_retired_ids"] = sorted(set(plan["alias"].values()) & er.ever_minted_ids())
    print(f"FL strays re-mint - moving {len(plan['moves'])} of {len(PINS)} pinned")
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
            "_status": "FL strays re-mint old->new alias (receipt + rollback inverse) - DRY RUN, not applied",
            "_at": today, "_scope": [SCOPE], "_count": len(plan["alias"]), "_ruling": RULING,
            "aliases": {k: {"new_id": v, "route": plan["moves"][k]["route"], "discipline": DISCIPLINE}
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
    if bad:
        sys.exit("APPLY BLOCKED - " + ", ".join(bad) + ": " +
                 json.dumps({k: plan["validation"][k] for k in bad})[:600])
    for name, f in er.FILES.items():
        er.dump(os.path.join(er.KB_DIR, f), docs[name])
    ent = reg["disciplines"][DISCIPLINE]
    ent["umbrella_codes"] = sorted(set(umbrella) | set(NEW_CODES))
    er.dump(os.path.join(HERE, "discipline_canonical_subj4.json"), reg)
    receipt.update({"_status": "FL strays re-mint old->new alias (receipt + rollback inverse) - APPLIED",
                    "_applied_at": today, "_counts": dict(counts)})
    er.dump(args.receipt, receipt)
    print(f"APPLIED - {dict(counts)}. Next: kb/foreign_language_subj4.json, ALIAS_MAPS, kb/_post_apply_chain.py, "
          "--rekey-skyview, commit, then supabase-rekey.yml with the receipt.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
