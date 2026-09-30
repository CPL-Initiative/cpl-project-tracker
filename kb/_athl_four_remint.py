#!/usr/bin/env python3
"""Card 9: Grossmont's four *Advanced Techniques and Strategies of …* titles, KINE -> ATHL (Rule 7).

Sam ruled on 2026-09-29 (open-asks sheet 4, card 9, "Move them to ATHL"). The
ETHS re-mint of the 43 (#1755, kb/eths_remint_out/2026-09-29/standalone+missed/)
routed Grossmont's *Advanced Techniques and Strategies of …* family by the
KIN/PE pass-2 title rule: the six titles that say *Intercollegiate* went to ATHL
(`ATHL M11FJ`–`M11FO`), and Baseball, Football, Softball and Water Polo, whose
titles do not, went to KINE. The card asked whether Grossmont teaches the whole
family as intercollegiate athletics; Sam's answer moves the four to ATHL beside
the six.

SCOPE. Four stand-alones, pinned by id and by the ETHS id each moved from, so a
catalog that drifted since the ruling refuses (V0):
  KINE M12OI  Adv Techniques & Strategies of Baseball     (from ETHS M10BI)
  KINE M12OJ  Adv Techniques & Strategies of Football     (from ETHS M10BK)
  KINE M12OK  Adv Techniques & Strategies-Water Polo      (from ETHS M10BN)
  KINE M12OL  Adv Techniques & Strategies of Softball     (from ETHS M10BO)

ROUTING IS THE RULING, NOT THE TITLE. The pass-2 rule sends these titles to KINE,
which is why they sit there; Sam's ruling routes them to ATHL. The discipline
stays Kinesiology (ATHL and KINE are the umbrella's two codes), so the move
changes the SUBJ4 and the id alone.

ALLOCATION: keep the number when `ATHL <number>` is free, else gap-fill, with
the ETHS re-mint's allocator and collision surface. On 2026-09-30 all four
`ATHL M12OI`–`M12OL` are held by other stand-alones, so all four gap-fill.

APPLY. The ETHS re-mint's apply and post gates (kb/_eths_remint.py apply_plan,
post_gates, fresh_read_check), with this re-mint's own stamp, `_athl_remint_from`:
the record keeps `_eths_remint_from` (its ETHS origin) and gains the KINE id it
left. Files mutated are the ETHS re-mint's five (see that docstring).
Register the receipt in kb/alias_chain.py ALIAS_MAPS in the same commit, run
kb/_post_apply_chain.py and `--rekey-skyview`, rebuild the SkyView payloads the
lints check, and re-key Supabase kb_curation from the committed receipt with
.github/workflows/supabase-rekey.yml in the same cron window.

GATES: V0 (the four pinned ids, standing, on KINE, each stamped from its ETHS id
and titled as the ruling names), P0 (not already applied), V2 (new ids unique and
free), V3 (ATHL, band kept to the stand-alone shape), then at apply P1 (the
recomputed alias equals the reviewed receipt), P3 (the live kb_curation rows for
the four and anything pointing at them match the committed overlay), V1, V3, V4,
V5 from the ETHS re-mint's post gates.

Run:
  python3 kb/_athl_four_remint.py                                  # dry run -> kb/athl_remint_out/<date>/
  python3 kb/_athl_four_remint.py --apply --receipt kb/athl_remint_out/<date>/alias_map.json \\
      --fresh-read <live.json>
  python3 kb/_athl_four_remint.py --rekey-skyview --receipt kb/athl_remint_out/<date>/alias_map.json
"""
import argparse
import json
import os
import re
import sys
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import _authority_recode_dryrun as rec  # noqa: E402  (Allocator, parse_id, SUBJ4_RE, load_id_reservations)
import _eths_remint as er  # noqa: E402  (apply_plan, post_gates, fresh_read_check, rekey_skyview, I/O)

OUT_ROOT = os.environ.get("ATHL_REMINT_OUT") or os.path.join(HERE, "athl_remint_out")
STAMP = "_athl_remint_from"
TARGET = "ATHL"
DISCIPLINE = "Kinesiology"
RULING = 'Sam, 2026-09-29 (open-asks sheet 4, card 9, "Move them to ATHL"): Grossmont\'s four KINE titles move to ATHL'

# id -> (the ETHS id it moved from on 2026-09-29, the sport its title names)
PINNED = {
    "KINE M12OI": ("ETHS M10BI", "baseball"),
    "KINE M12OJ": ("ETHS M10BK", "football"),
    "KINE M12OK": ("ETHS M10BN", "water polo"),
    "KINE M12OL": ("ETHS M10BO", "softball"),
}
FAMILY = re.compile(r"\badv(anced)?\b.*\btech", re.I)


def compute_plan(courses, singletons, curations, reservations):
    """Pure. The plan dict the receipt and the apply consume."""
    found, v0_bad = {}, []
    stamps_from = {r.get(STAMP): k for k, r in list(courses.items()) + list(singletons.items()) if r.get(STAMP)}
    for cid, (eths, sport) in sorted(PINNED.items()):
        r = courses.get(cid) or singletons.get(cid)
        if r is None:
            if cid in stamps_from:
                continue                     # already moved under this re-mint: P0 reports it
            v0_bad.append(f"{cid} is not in the catalog")
            continue
        title = r.get("common_title") or ""
        why = []
        if (curations.get(cid) or {}).get("merge_into"):
            why.append("merged away")
        if r.get(er.STAMP) != eths:
            why.append(f"stamped from {r.get(er.STAMP)!r}, not {eths}")
        if not (FAMILY.search(title) and sport in title.lower()):
            why.append(f"title {title!r} is not the family's {sport} title")
        if why:
            v0_bad.append(f"{cid}: " + "; ".join(why))
        found[cid] = r

    moves = {}
    for cid, r in found.items():
        moves[cid] = {"old_id": cid, "source": "minted" if cid in courses else "singleton",
                      "title": r.get("common_title") or "", "route": TARGET, "discipline": DISCIPLINE,
                      "from_eths": PINNED[cid][0], "top_code": r.get("top_code")}
    real = set(courses) | set(singletons) | set(curations)
    alloc = rec.Allocator(real - set(moves), reservations)
    order = sorted(moves)
    for cid in order:                                   # pass 1: keep the number
        _, letter, band, tail, _ = rec.parse_id(cid)
        want = f"{TARGET} {letter}{band}{tail}"
        moves[cid]["new_id"], moves[cid]["how"] = None, None
        if alloc.free(want):
            alloc.taken.add(want)
            moves[cid]["new_id"], moves[cid]["how"] = want, "kept number"
    for cid in order:                                   # pass 2: gap-fill the rest
        if moves[cid]["new_id"]:
            continue
        moves[cid]["new_id"], moves[cid]["how"] = alloc.place(cid, TARGET, prefer_keep=False,
                                                              reason=f"{cid} -> {TARGET} (card 9)")
    alias = {k: v["new_id"] for k, v in moves.items() if v.get("new_id")}
    new_ids = list(alias.values())
    applied = sorted(k for k in stamps_from if k in PINNED)
    validation = {
        "V0_pinned_four": {"pass": not v0_bad and (len(found) + len(applied)) == len(PINNED),
                           "problems": v0_bad, "found": len(found)},
        "P0_not_applied": {"pass": not applied, "applied": applied},
        "V2_new_ids_unique_and_free": {"pass": len(set(new_ids)) == len(new_ids) == len(moves)
                                       and not (set(new_ids) & (real - set(moves))),
                                       "unplaced": sorted(set(moves) - set(alias))},
        "V3_codes_and_bands": {"pass": all(v["new_id"].startswith(TARGET + " ") and rec.SUBJ4_RE.match(TARGET)
                                           for v in moves.values() if v.get("new_id"))},
    }
    return {"scopes": ["card9"], "moves": moves, "alias": alias, "validation": validation,
            "gapfilled": alloc.gapfilled}


def render_report(plan, today, receipt):
    L = [f"# Card 9 re-mint: Grossmont's four to ATHL - dry run {today}", "",
         f"The ruling: {RULING}. The re-mint runs under the playbook (docs/coursecontrolnumber_remint.md).", "",
         "## Validation", ""]
    for k, v in plan["validation"].items():
        L.append(f"- **{k}**: {'pass' if v.get('pass') else 'FAIL'}"
                 + ("" if v.get("pass") else f" `{json.dumps({x: y for x, y in v.items() if x != 'pass'})}`"))
    L += ["", f"## Moves ({len(plan['moves'])} to {TARGET})", "",
          "| Old id | New id | How | Title | Moved from on 2026-09-29 |", "|---|---|---|---|---|"]
    for k, v in sorted(plan["moves"].items()):
        L.append(f"| {k} | {v.get('new_id')} | {v.get('how')} | {v['title']} | {v['from_eths']} |")
    reused = plan.get("reused_retired_ids") or []
    if reused:
        L += ["", f"**{len(reused)} new ids take a slot an earlier re-mint vacated**: "
              + ", ".join(reused) + ". The chain resolves a stored id through the maps of its own era."]
    L += ["", "## After the apply", "",
          "1. Register the receipt in `kb/alias_chain.py` ALIAS_MAPS in the same commit, and run "
          "`python3 kb/_post_apply_chain.py`.",
          f"2. Re-key SkyView's hand-built layout: `python3 kb/_athl_four_remint.py --rekey-skyview --receipt {receipt}`, "
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
    plan = compute_plan(courses, singletons, curations, rec.load_id_reservations())
    plan["reused_retired_ids"] = sorted(set(plan["alias"].values()) & er.ever_minted_ids())
    print(f"Card 9 re-mint - moving {len(plan['moves'])} to {TARGET}")
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
            "_status": "Card 9 re-mint old->new alias (receipt + rollback inverse) - DRY RUN, not applied",
            "_at": today, "_scope": ["card9"], "_count": len(plan["alias"]), "_ruling": RULING,
            "aliases": {k: {"new_id": v, "route": TARGET, "discipline": DISCIPLINE}
                        for k, v in sorted(plan["alias"].items())}})
        with open(os.path.join(out, "report.md"), "w", encoding="utf-8") as f:
            f.write(render_report(plan, today, os.path.relpath(rp, ROOT)))
        print(f"DRY RUN - wrote {os.path.relpath(out, ROOT)}/(plan.json, alias_map.json, report.md)")
        return 0 if all(v.get("pass") for v in plan["validation"].values()) else 1

    # ── apply ──
    with open(args.receipt, encoding="utf-8") as f:
        receipt = json.load(f)
    frozen = {k: (v["new_id"] if isinstance(v, dict) else v) for k, v in receipt.get("aliases", {}).items()}
    plan["validation"]["P1_matches_receipt"] = {"pass": frozen == plan["alias"] and receipt.get("_scope") == ["card9"]}
    with open(args.fresh_read, encoding="utf-8") as f:
        plan["validation"]["P3_fresh_read"] = er.fresh_read_check(json.load(f), curations, plan)
    before = {n: {k: (dict(v) if isinstance(v, dict) else v) for k, v in d.items()} for n, d in docs.items()}
    pre_art = sum(1 for a in docs["articulations"].get("articulations", []) if a.get("course_id") in plan["alias"])
    # The ETHS re-mint's apply, stamping with THIS re-mint's key: the record keeps
    # `_eths_remint_from` (where it began) and gains `_athl_remint_from`.
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
    receipt.update({"_status": "Card 9 re-mint old->new alias (receipt + rollback inverse) - APPLIED",
                    "_applied_at": today, "_applied_ruling": RULING, "_counts": dict(counts)})
    er.dump(args.receipt, receipt)
    print(f"APPLIED - {dict(counts)}. Next: register the receipt in kb/alias_chain.py ALIAS_MAPS, run "
          f"kb/_post_apply_chain.py and --rekey-skyview, commit, then dispatch supabase-rekey.yml with the receipt.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
