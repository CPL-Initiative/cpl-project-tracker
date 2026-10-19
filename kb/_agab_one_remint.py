#!/usr/bin/env python3
"""Sheet 99 card 3: Agricultural Business and Related Services takes AGAB; its identity AUTB M1006 moves (Rule 7).

Sam ruled on 2026-10-19 (Open Asks Sheet 99 card 3, 16:37Z, "agab"): Agricultural
Business and Related Services takes AGAB, the C-ID family code AG-AB with the hyphen
removed, and its one identity is re-keyed under the playbook. AUTB was Auto Body
Technology's canonical (221 ids) and the data's modal code for Agricultural Business
too, so one code sat on two MQ disciplines: the reference's one collision since the
authority recode of 2026-09-03 (cpl_memory autb-names-two-disciplines-2026-09-29).

SCOPE. One identity, pinned by id, title and the discipline Sam himself set on it
(kb_curation, 2026-07-13: discipline = Agricultural Business and Related Services),
so a catalog that drifted since the ruling refuses (V0):
  AUTB M1006  Supervision and Management in Agriculture  (TOP 0112.00 Agriculture
              Business; members at Butte and Cuesta under AB and AGB)

The record's own discipline field still says Auto Body Technology (its local code AB
is Auto Body's); the move sets it to the discipline Sam's row names, which is what
V3 checks. The second AUTB record under that discipline, AUTB M1071 Import Body
Customizing (a machine cluster of two auto body courses, TOP 0949.00), carries the
same 2026-07-13 row of Sam's; it is NOT moved here, because the evidence on it reads
Auto Body and a human-sourced row is never superseded by a session's inference
(Rule 8): it is a card for Sam on the standing sheet.

ALLOCATION: keep the number when `AGAB M1006` is free (it is, 2026-10-19), else
gap-fill with the authority recode's allocator and collision surface.

APPLY. The ETHS re-mint's apply and post gates (kb/_eths_remint.py apply_plan,
post_gates, fresh_read_check) with this re-mint's own stamp, `_agab_remint_from`.
Files mutated are the ETHS re-mint's five (see that docstring). Register the receipt
in kb/alias_chain.py ALIAS_MAPS in the same commit, run kb/_post_apply_chain.py and
`--rekey-skyview`, rebuild the SkyView payloads the lints check, and re-key Supabase
kb_curation from the committed receipt with .github/workflows/supabase-rekey.yml in
the same cron window. The pick itself (Agricultural Business -> AGAB in the
_CANON_SUBJ4 namespace) is a separate insert-only receipt through supabase-migrate.yml.

GATES: V0 (the pinned id, standing, on AUTB, titled as the ruling names, Sam's
discipline row on it, not merged away), P0 (not already applied), V2 (the new id
unique and free), V3 (AGAB, the band kept), then at apply P1 (the recomputed alias
equals the reviewed receipt), P3 (the live kb_curation rows for the id and anything
pointing at it match the committed overlay), V1, V3, V4, V5 from the ETHS re-mint's
post gates.

Run:
  python3 kb/_agab_one_remint.py                                  # dry run -> kb/agab_remint_out/<date>/
  python3 kb/_agab_one_remint.py --apply --receipt kb/agab_remint_out/<date>/alias_map.json \\
      --fresh-read <live.json>
  python3 kb/_agab_one_remint.py --rekey-skyview --receipt kb/agab_remint_out/<date>/alias_map.json
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

OUT_ROOT = os.environ.get("AGAB_REMINT_OUT") or os.path.join(HERE, "agab_remint_out")
STAMP = "_agab_remint_from"
TARGET = "AGAB"
DISCIPLINE = "Agricultural Business and Related Services"
SCOPE = "sheet99-card3"
RULING = ('Sam, 2026-10-19 (Open Asks Sheet 99 card 3, "agab"): Agricultural Business and Related Services '
          'takes AGAB; its identity AUTB M1006 is re-keyed under the playbook')

# id -> (the title the ruling names, the TOP code family the course sits in)
PINNED = {
    "AUTB M1006": ("Supervision and Management in Agriculture", "0112"),
}


def compute_plan(courses, singletons, curations, reservations):
    """Pure. The plan dict the receipt and the apply consume."""
    found, v0_bad = {}, []
    stamps_from = {r.get(STAMP): k for k, r in list(courses.items()) + list(singletons.items()) if r.get(STAMP)}
    for cid, (title_wanted, top) in sorted(PINNED.items()):
        r = courses.get(cid) or singletons.get(cid)
        if r is None:
            if cid in stamps_from:
                continue                     # already moved under this re-mint: P0 reports it
            v0_bad.append(f"{cid} is not in the catalog")
            continue
        title = r.get("common_title") or ""
        why = []
        cur = curations.get(cid) or {}
        if cur.get("merge_into"):
            why.append("merged away")
        if title != title_wanted:
            why.append(f"title {title!r} is not {title_wanted!r}")
        if cur.get("discipline") != DISCIPLINE:
            why.append(f"the overlay's discipline is {cur.get('discipline')!r}, not Sam's row {DISCIPLINE!r}")
        if not str(r.get("top_code") or "").startswith(top):
            why.append(f"TOP {r.get('top_code')!r} is not in {top}")
        if not cid.startswith("AUTB "):
            why.append("not on AUTB")
        if why:
            v0_bad.append(f"{cid}: " + "; ".join(why))
        found[cid] = r

    moves = {}
    for cid, r in found.items():
        moves[cid] = {"old_id": cid, "source": "minted" if cid in courses else "singleton",
                      "title": r.get("common_title") or "", "route": TARGET, "discipline": DISCIPLINE,
                      "discipline_before": r.get("discipline"), "top_code": r.get("top_code")}
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
                                                              reason=f"{cid} -> {TARGET} ({SCOPE})")
    alias = {k: v["new_id"] for k, v in moves.items() if v.get("new_id")}
    new_ids = list(alias.values())
    applied = sorted(k for k in stamps_from if k in PINNED)
    validation = {
        "V0_pinned_one": {"pass": not v0_bad and (len(found) + len(applied)) == len(PINNED),
                          "problems": v0_bad, "found": len(found)},
        "P0_not_applied": {"pass": not applied, "applied": applied},
        "V2_new_ids_unique_and_free": {"pass": len(set(new_ids)) == len(new_ids) == len(moves)
                                       and not (set(new_ids) & (real - set(moves))),
                                       "unplaced": sorted(set(moves) - set(alias))},
        "V3_codes_and_bands": {"pass": all(v["new_id"].startswith(TARGET + " ") and rec.SUBJ4_RE.match(TARGET)
                                           for v in moves.values() if v.get("new_id"))},
    }
    return {"scopes": [SCOPE], "moves": moves, "alias": alias, "validation": validation,
            "gapfilled": alloc.gapfilled}


def render_report(plan, today, receipt):
    L = [f"# Sheet 99 card 3 re-mint: Agricultural Business takes AGAB - dry run {today}", "",
         f"The ruling: {RULING}. The re-mint runs under the playbook (docs/coursecontrolnumber_remint.md).", "",
         "## Validation", ""]
    for k, v in plan["validation"].items():
        L.append(f"- **{k}**: {'pass' if v.get('pass') else 'FAIL'}"
                 + ("" if v.get("pass") else f" `{json.dumps({x: y for x, y in v.items() if x != 'pass'})}`"))
    L += ["", f"## Moves ({len(plan['moves'])} to {TARGET})", "",
          "| Old id | New id | How | Title | Discipline before | TOP |", "|---|---|---|---|---|---|"]
    for k, v in sorted(plan["moves"].items()):
        L.append(f"| {k} | {v.get('new_id')} | {v.get('how')} | {v['title']} | {v.get('discipline_before')} | {v.get('top_code')} |")
    reused = plan.get("reused_retired_ids") or []
    if reused:
        L += ["", f"**{len(reused)} new ids take a slot an earlier re-mint vacated**: "
              + ", ".join(reused) + ". The chain resolves a stored id through the maps of its own era."]
    L += ["", "## Not moved: AUTB M1071 Import Body Customizing", "",
          "Sam's 2026-07-13 curation row sets its discipline to Agricultural Business and Related Services too, "
          "while its title, its TOP (0949.00 Automotive Collision Repair) and its two members (Auto Body "
          "Technology at Cerritos, Automotive Technology at Victor Valley) read auto body. A human-sourced row "
          "is never superseded by a session's inference (Rule 8): it is a card for Sam. Until he answers, the "
          "Reference view lists Agricultural Business with one row off its code (AUTB), which is true.", "",
          "## After the apply", "",
          "1. Register the receipt in `kb/alias_chain.py` ALIAS_MAPS in the same commit, and run "
          "`python3 kb/_post_apply_chain.py`.",
          f"2. Re-key SkyView's hand-built layout: `python3 kb/_agab_one_remint.py --rekey-skyview --receipt {receipt}`, "
          "then rebuild the payloads the lints check.",
          "3. The pick: the insert-only receipt kb/receipts/csr_agab_pick_2026-10-19_s427.sql through "
          "supabase-migrate.yml (kb/migrations/.apply), and the seed entry edited to match.",
          f"4. After the merge, before the next cron's curation sync: dispatch `supabase-rekey.yml` with "
          f"`alias_map_path={receipt}`.",
          "5. Read the live kb_curation rows back: none on an old id; the pick under csr-s427@bot.", ""]
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
    print(f"Sheet 99 card 3 re-mint - moving {len(plan['moves'])} to {TARGET}")
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
            "_status": "Sheet 99 card 3 re-mint old->new alias (receipt + rollback inverse) - DRY RUN, not applied",
            "_at": today, "_scope": [SCOPE], "_count": len(plan["alias"]), "_ruling": RULING,
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
    plan["validation"]["P1_matches_receipt"] = {"pass": frozen == plan["alias"] and receipt.get("_scope") == [SCOPE]}
    with open(args.fresh_read, encoding="utf-8") as f:
        plan["validation"]["P3_fresh_read"] = er.fresh_read_check(json.load(f), curations, plan)
    before = {n: {k: (dict(v) if isinstance(v, dict) else v) for k, v in d.items()} for n, d in docs.items()}
    pre_art = sum(1 for a in docs["articulations"].get("articulations", []) if a.get("course_id") in plan["alias"])
    # The ETHS re-mint's apply, stamping with THIS re-mint's key.
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
    receipt.update({"_status": "Sheet 99 card 3 re-mint old->new alias (receipt + rollback inverse) - APPLIED",
                    "_applied_at": today, "_applied_ruling": RULING, "_counts": dict(counts)})
    er.dump(args.receipt, receipt)
    print(f"APPLIED - {dict(counts)}. Next: register the receipt in kb/alias_chain.py ALIAS_MAPS, run "
          f"kb/_post_apply_chain.py and --rekey-skyview, commit, then dispatch supabase-rekey.yml with the receipt.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
