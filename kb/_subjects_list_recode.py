#!/usr/bin/env python3
"""The Subjects List recode: Sam's eleven new Common SUBJ codes onto their M-IDs (Rule 7).

On the evening of 2026-11-04 (21:25Z to 00:10Z) Sam changed eleven disciplines' Common SUBJ on the
Common Subjects List, each with a note (`kb_curation` `_CANON_SUBJ4::<discipline>` rows, reviewer
slee@cccco.edu). The 00:15Z phase-1e-sync wrote those codes into the seed alone, and main went red
(`tests/csr_trail_rules_test.py`: canonical codes with no identity, 2,488 stray ids), so #2787 reverted
it. A code change and its re-mint land together, in one window. This is that re-mint.

A CODE CHANGE IS A PREFIX RE-KEY THAT KEEPS THE NUMBER (the KB note
`methodology-a-code-change-is-a-prefix-rekey-not-a-resequence`): kb/_subj4_dryrun.py re-sequences
whole buckets and would move thousands of ids for a rename, so this planner keeps each number where the
new key is free and gap-fills only where it is not, through the authority recode's Allocator.

WHAT MOVES.
  plain    ten disciplines: the old code's whole namespace (catalog M-IDs and singletons) moves to the
           new code, the POLS lesson. Each row keeps its own discipline: the few rows on an old code that
           carry another discipline (an Art row on GRAF) were strays before and stay strays, on the new
           code, and the report lists them for the merge worklist.
  split    Media Production leaves FTVE for FMED, so the 2026-09-03 fan-in pair with Film and Media
           Studies ends: only Media Production's rows move (the discipline a curator's overlay names wins
           over the file's: four FTVE rows the 2026-07-12 trail crew filed under Media Production move with
           it); Film's stay on FTVE, and the seed drops `fan_in_with` and `_fan_in_note` from both entries.
           A record's own `discipline` field is never changed here; the overlay keeps the curator's value.

A SLOT AN EARLIER RE-MINT VACATED is not taken (the S436 duplicate-point failure), with one exception:
a row returning to an id it held itself (its own `_*_from` stamp names it) takes it back.

The seed's edit (the new code, Sam's notes with who and when, the fan-in split) is part of the apply, so
the code and its identities land in one commit.

Run (from the repo root):
  python3 kb/_subjects_list_recode.py --picks <live.json>          # dry run -> kb/subjects_list_recode_out/<date>/
  python3 kb/_subjects_list_recode.py --picks <live.json> --apply --receipt <alias_map.json> --fresh-read <rows.json>
<live.json> is the live `_CANON_SUBJ4::` picks, {discipline: {"code", "note", "by", "at"}}, read at write
time (the MCP query is in the report). After the apply: register the receipt in kb/alias_chain.py
ALIAS_MAPS in the same commit, run kb/_post_apply_chain.py, then --finish-seed and --rekey-skyview; re-key
unified_courses_data.js and unified_courses_standalone.js token for token (`--rekey-generated`) so SkyView's
sky reads the ids it draws; rebuild ccr_cpl.json, ccr_sky.json, the blast radius and the dependency map. After
the merge: supabase-rekey.yml with the receipt, the read-back, then daily-dashboard.yml, before the next cron.
"""
import argparse
import json
import os
import re
import sys
from collections import Counter
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import _authority_recode_dryrun as rec  # noqa: E402  (Allocator, parse_id, SUBJ4_RE, load_id_reservations)
import _eths_remint as er  # noqa: E402  (apply_plan, post_gates, fresh_read_check, rekey_skyview, I/O)

OUT_ROOT = os.environ.get("SUBJECTS_LIST_RECODE_OUT") or os.path.join(HERE, "subjects_list_recode_out")
SEED = os.path.join(HERE, "discipline_canonical_subj4.json")
STAMP = "_subjects_list_recode_from"
SCOPE = "subjects-list-2026-11-04"
RULING = ("Sam, 2026-11-04 21:25Z to 2026-11-05 00:10Z (the Common Subjects List, `_CANON_SUBJ4::` saves with "
          "a note each): eleven disciplines take a new Common SUBJ")
# (discipline, from, to, kind). Cross-checked at runtime: `from` against the seed, `to` against the live picks.
RECODES = [
    ("Artificial Intelligence", "CSAI", "CSIS", "plain"),
    ("Broadcasting Technology", "BCST", "BRDC", "plain"),
    ("Building Codes and Regulations", "CNSR", "CBIT", "plain"),
    ("Cabinet Making", "CNSC", "WWKC", "plain"),
    ("Diesel Mechanics", "AUTD", "DIES", "plain"),
    ("Environmental Technologies", "ESCI", "ENVS", "plain"),
    ("Furniture Making", "CSTF", "WWKF", "plain"),
    ("Graphic Arts", "GRAF", "GFCD", "plain"),
    ("Legal Assisting", "PLGL", "PARA", "plain"),
    ("Licensed Vocational Nursing", "NRSV", "VNRS", "plain"),
    ("Media Production", "FTVE", "FMED", "split"),
]
FAN_IN_PARTNER = {"Media Production": "Film and Media Studies"}
GENERATED = ("unified_courses_data.js", "unified_courses_standalone.js")


def own_stamps(r):
    """The ids a row held before earlier re-mints (its `_*_from` stamps)."""
    return {v for k, v in r.items() if k.startswith("_") and k.endswith("_from") and isinstance(v, str)}


def rekey_generated(alias, root=ROOT):
    """-> {file: replacements}. The daily rebuilds both files from the kb; until it runs, SkyView's sky reads
    TOP codes from them by the ids the layout draws, so they are re-keyed in the same commit (the atomic land).
    Exact id tokens only, in one simultaneous pass, never a substring."""
    pat = re.compile(r"(?<![A-Za-z0-9])(" + "|".join(re.escape(k) for k in sorted(alias, key=len, reverse=True))
                     + r")(?![A-Za-z0-9])")
    done = {}
    for rel in GENERATED:
        path = os.path.join(root, rel)
        if not os.path.exists(path):
            continue
        with open(path, encoding="utf-8") as f:
            text = f.read()
        new, n = pat.subn(lambda m: alias[m.group(1)], text)
        if n:
            with open(path, "w", encoding="utf-8") as f:
                f.write(new)
        done[rel] = n
    return done


def compute_plan(courses, singletons, curations, seed, picks, reservations, vacated=frozenset(), drawn=frozenset()):
    """Pure. The plan the receipt and the apply consume."""
    v0 = []
    for d, a, b, kind in RECODES:
        have = (seed.get(d) or {}).get("canonical_subj4")
        if have != a and have != b:
            v0.append(f"{d}: the seed holds {have!r}, not {a!r}")
        live = (picks.get(d) or {}).get("code")
        if live != b:
            v0.append(f"{d}: the live pick is {live!r}, not {b!r}")
        if not rec.SUBJ4_RE.match(b):
            v0.append(f"{d}: {b!r} is not four letters")
        owners = [x for x, e in seed.items()
                  if x != d and (e.get("canonical_subj4") == b or b in (e.get("umbrella_codes") or []))]
        if owners:
            v0.append(f"{d}: {b} is already {', '.join(owners)}'s code")
    carried = {x[0] for x in RECODES}
    extra = sorted(d for d, p in picks.items()
                   if p.get("code") and (seed.get(d) or {}).get("canonical_subj4") not in (p["code"], None)
                   and d not in carried)
    if extra:
        v0.append("live picks this plan does not carry: " + ", ".join(extra))

    by_from = {a: (d, b, kind) for d, a, b, kind in RECODES}
    moves, skipped = {}, []
    for src, recs in (("minted", courses), ("singleton", singletons)):
        for cid, r in recs.items():
            prefix, letter, *_ = rec.parse_id(cid)
            if prefix not in by_from:
                continue
            d, b, kind = by_from[prefix]
            eff = (curations.get(cid) or {}).get("discipline") or r.get("discipline")   # a curator's overlay wins
            if kind == "split" and eff != d:
                continue
            if letter != "M":
                skipped.append(cid)
                continue
            moves[cid] = {"old_id": cid, "source": src, "title": r.get("common_title") or "", "route": b,
                          "kind": kind, "for": d, "discipline": r.get("discipline"), "effective_discipline": eff,
                          "off_discipline": eff != d,
                          "merged_into": (curations.get(cid) or {}).get("merge_into"),
                          "own": sorted(own_stamps(r))}
    real = set(courses) | set(singletons) | set(curations)
    alloc = rec.Allocator((real | set(vacated) | set(drawn)) - set(moves), reservations)
    order = sorted(moves)
    returned = []
    for cid in order:                                           # pass 1: keep the number
        _, letter, band, tail, _ = rec.parse_id(cid)
        want = f"{moves[cid]['route']} {letter}{band}{tail}"
        moves[cid]["new_id"] = moves[cid]["how"] = None
        home = (want in moves[cid]["own"] and want not in alloc.taken
                and want not in (real - set(moves)) and want not in drawn)
        if alloc.free(want):
            moves[cid]["new_id"], moves[cid]["how"] = want, "kept number"
        elif home:                                              # a vacated slot this row itself held
            moves[cid]["new_id"], moves[cid]["how"] = want, "returned home"
            returned.append(cid)
        else:
            continue
        alloc.taken.add(want)
    for cid in order:                                           # pass 2: gap-fill the rest
        if moves[cid]["new_id"]:
            continue
        moves[cid]["new_id"], moves[cid]["how"] = alloc.place(cid, moves[cid]["route"], prefer_keep=False,
                                                              reason=f"{cid} -> {moves[cid]['route']} ({SCOPE})")
    alias = {k: v["new_id"] for k, v in moves.items() if v.get("new_id")}
    new_ids = list(alias.values())
    applied = sorted(k for k, r in list(courses.items()) + list(singletons.items()) if r.get(STAMP))
    orphans = sorted(k for k in curations if rec.parse_id(k)[0] in by_from and k not in moves
                     and by_from[rec.parse_id(k)[0]][2] == "plain")
    validation = {
        "V0_the_plan_matches_seed_and_picks": {"pass": not v0, "problems": v0},
        "P0_not_applied": {"pass": not applied, "applied": applied[:10]},
        "V2_new_ids_unique_and_free": {"pass": len(set(new_ids)) == len(new_ids) == len(moves)
                                       and not (set(new_ids) & (real - set(moves))),
                                       "unplaced": sorted(set(moves) - set(alias))},
        "V3_codes": {"pass": all(v["new_id"].startswith(v["route"] + " ") for v in moves.values() if v.get("new_id"))},
        "V6_no_curation_left_on_an_old_code": {"pass": not orphans, "orphans": orphans[:10], "count": len(orphans)},
        "V7_only_M_ids": {"pass": not skipped, "skipped": skipped[:10]},
    }
    return {"scopes": [SCOPE], "moves": moves, "alias": alias, "validation": validation,
            "gapfilled": alloc.gapfilled, "returned_home": returned}


def seed_edit(seed_doc, picks):
    """The seed after the apply: the new code per recoded discipline, Sam's note (with who and when) on every
    discipline whose live pick carries one, and the fan-in split. Returns a copy. Run again after
    kb/_post_apply_chain.py (`--finish-seed`): its csr-seed step rebuilds the entries and drops `_notes_by`,
    `_notes_at` and `_synced_*`."""
    doc = json.loads(json.dumps(seed_doc))
    disc = doc["disciplines"]
    for d, a, b, kind in RECODES:
        e = disc[d]
        e["canonical_subj4"] = b
        vo = e.get("variants_observed")
        if isinstance(vo, dict) and a in vo:
            vo[b] = vo.pop(a)
        if kind == "split":
            for x in (d, FAN_IN_PARTNER[d]):
                disc[x].pop("fan_in_with", None)
                disc[x].pop("_fan_in_note", None)
    for d, p in picks.items():
        e = disc.get(d)
        if e is None or not p.get("note"):
            continue
        e["_notes"] = p["note"]
        for k, f in (("_notes_by", "by"), ("_notes_at", "at")):
            if p.get(f):
                e[k] = p[f]
    doc["_synced_at"] = date.today().isoformat()
    doc["_synced_from"] = "kb/_subjects_list_recode.py: the live _CANON_SUBJ4:: picks (the Subjects List), read at write time"
    return doc


def render_report(plan, today, receipt):
    moves = plan["moves"]
    how = Counter(v["how"] for v in moves.values())
    L = [f"# The Subjects List recode ({SCOPE}): dry run {today}", "",
         f"The ruling: {RULING}. The re-mint runs under the playbook (docs/coursecontrolnumber_remint.md): a prefix "
         "re-key that keeps the number.", "", "## Validation", ""]
    for k, v in plan["validation"].items():
        L.append(f"- **{k}**: {'pass' if v.get('pass') else 'FAIL'}"
                 + ("" if v.get("pass") else f" `{json.dumps({x: y for x, y in v.items() if x != 'pass'})[:800]}`"))
    L += ["", f"## Moves: {len(moves)} ids, " + ", ".join(f"{n} {k}" for k, n in sorted(how.items())), "",
          "| Discipline | From | To | Ids | Catalog | Singletons | Off-discipline |", "|---|---|---|---|---|---|---|"]
    for d, a, b, kind in RECODES:
        vs = [v for v in moves.values() if v["for"] == d]
        L.append(f"| {d} | {a} | {b} | {len(vs)} | {sum(v['source'] == 'minted' for v in vs)} | "
                 f"{sum(v['source'] == 'singleton' for v in vs)} | {sum(v['off_discipline'] for v in vs)} |")
    off = sorted((k, v) for k, v in moves.items() if v["off_discipline"])
    if off:
        L += ["", "## Off-discipline rows that move with their namespace (strays before and after)", "",
              "| Old id | New id | Title | Discipline |", "|---|---|---|---|"]
        L += [f"| {k} | {v['new_id']} | {v['title']} | {v['effective_discipline']} |" for k, v in off]
    gf = sorted((k, v) for k, v in moves.items() if v["how"] != "kept number")
    if gf:
        L += ["", f"## Not on their own number ({len(gf)})", "",
              "A gap-fill means an earlier re-mint once used the slot; the chain resolves an id stored then to the row "
              "that held it, so the slot stays free.", "", "| Old id | New id | How |", "|---|---|---|"]
        L += [f"| {k} | {v['new_id']} | {v['how']} |" for k, v in gf[:200]]
        if len(gf) > 200:
            L.append(f"| … | {len(gf) - 200} more in plan.json | |")
    L += ["", "## Readings", "",
          "1. **Media Production leaves the fan-in.** Sam's 2026-09-03 ruling (item 13) put Media Production on FTVE "
          "beside Film and Media Studies; his FMED pick ends that pair. Film keeps FTVE; the seed drops `fan_in_with` "
          "from both entries. C-ID's code for these courses is FTVE, so FMED is a CSR code beside it; his note names "
          "FTVE, which records the divergence for the scan.",
          "2. **CSIS changes hands.** Computer Information Systems held CSIS until the 2026-09-03 recode moved it to "
          "ITIS; Artificial Intelligence now takes it. `kb/alias_chain.py` resolves a stored id by its era, so an old "
          "CSIS id still lands on ITIS, and the allocator keeps every slot CIS once held free. A reader that skips the "
          "chain would put a CIS course on an AI code.",
          "3. **Codes the June fold retired come back** (DIES, ENVS, PARA, VNRS, BRDC): their old slots stay free, which "
          "is why those disciplines gap-fill.", "",
          "## Fresh read at write time", "",
          "```sql",
          "select json_object_agg(substr(c.course_id,15), json_build_object('code', c.value, 'note', n.value,",
          "  'by', n.reviewer_email, 'at', n.reviewed_at)) from kb_curation c left join kb_curation n",
          "  on n.course_id = c.course_id and n.field = 'canonical_subj4_notes'",
          "where c.course_id like '\\_CANON\\_SUBJ4::%' and c.field = 'canonical_subj4';",
          "```", "",
          "## After the apply", "",
          "1. Register the receipt in `kb/alias_chain.py` ALIAS_MAPS in the same commit; run "
          "`python3 kb/_post_apply_chain.py`, then `--finish-seed`.",
          f"2. `python3 kb/_subjects_list_recode.py --rekey-skyview --rekey-generated --receipt {receipt}`, then rebuild "
          "`ccr_cpl.json`, `ccr_sky.json`, the blast radius and the dependency map.",
          f"3. After the merge, before the next cron's curation sync: dispatch `supabase-rekey.yml` with "
          f"`alias_map_path={receipt}`, read the live rows back (none on an old id), then dispatch `daily-dashboard.yml`.",
          ""]
    return "\n".join(L)


def load_picks(path):
    with open(path, encoding="utf-8") as f:
        raw = json.load(f)
    return {d: (p if isinstance(p, dict) else {"code": p}) for d, p in raw.items()}


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--picks", help="the live _CANON_SUBJ4:: picks, {discipline: {code, note, by, at}}")
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--receipt", help="the reviewed alias_map.json the apply must reproduce (P1)")
    ap.add_argument("--fresh-read", help="live kb_curation rows for the moved ids (JSON list of {course_id, field, value}) (P3)")
    ap.add_argument("--rekey-skyview", action="store_true")
    ap.add_argument("--rekey-generated", action="store_true",
                    help="after an apply: re-key unified_courses_data.js and unified_courses_standalone.js from the APPLIED --receipt")
    ap.add_argument("--finish-seed", action="store_true",
                    help="after kb/_post_apply_chain.py: put Sam's notes, their who and when, and _synced_* back on the seed")
    args = ap.parse_args(argv)
    if args.rekey_skyview or args.rekey_generated:
        if not args.receipt:
            sys.exit("--rekey-skyview / --rekey-generated need --receipt (an applied one)")
        with open(args.receipt, encoding="utf-8") as f:
            receipt = json.load(f)
        if not receipt.get("_applied_at"):
            sys.exit("--rekey-skyview / --rekey-generated read an APPLIED receipt; this one is a dry run")
        alias = {k: v["new_id"] for k, v in receipt["aliases"].items()}
        if args.rekey_skyview:
            print("SkyView layout re-keyed:", er.rekey_skyview(alias))
        if args.rekey_generated:
            print("generated files re-keyed:", rekey_generated(alias))
        return 0
    if not args.picks:
        sys.exit("--picks is required: the live _CANON_SUBJ4:: picks, read at write time")
    if args.finish_seed:
        with open(SEED, encoding="utf-8") as f:
            seed_doc = json.load(f)
        if any(seed_doc["disciplines"][d].get("canonical_subj4") != b for d, a, b, kind in RECODES):
            sys.exit("--finish-seed runs after the apply; the seed does not hold the new codes yet")
        er.dump(SEED, seed_edit(seed_doc, load_picks(args.picks)))
        print("seed finished: notes, their who and when, and _synced_* restored")
        return 0
    if args.apply and not (args.receipt and args.fresh_read):
        sys.exit("--apply needs --receipt and --fresh-read")

    today = date.today().isoformat()
    picks = load_picks(args.picks)
    docs = er.load_docs()
    with open(SEED, encoding="utf-8") as f:
        seed_doc = json.load(f)
    courses, singletons = docs["courses"]["courses"], docs["singletons"]["courses"]
    curations = docs["curation"]["curations"]
    plan = compute_plan(courses, singletons, curations, seed_doc["disciplines"], picks, rec.load_id_reservations(),
                        vacated=er.ever_minted_ids(), drawn=er.skyview_ids())
    print(f"Subjects List recode - {len(plan['moves'])} ids, {len(plan['returned_home'])} returned home, "
          f"{len(plan['gapfilled'])} gap-filled")
    for k, v in plan["validation"].items():
        print(f"  {k}: {'ok' if v.get('pass') else 'FAIL ' + json.dumps({x: y for x, y in v.items() if x != 'pass'})[:300]}")

    if not args.apply:
        out = os.path.join(OUT_ROOT, today)
        rp = os.path.join(out, "alias_map.json")
        if os.path.exists(rp):
            with open(rp, encoding="utf-8") as f:
                if json.load(f).get("_applied_at"):
                    sys.exit(f"{os.path.relpath(out, ROOT)} holds an applied receipt; a dry run never overwrites it")
        os.makedirs(out, exist_ok=True)
        er.dump(os.path.join(out, "plan.json"), plan)
        er.dump(os.path.join(out, "picks.json"), picks)
        er.dump(rp, {
            "_status": "Subjects List recode old->new alias (receipt + rollback inverse) - DRY RUN, not applied",
            "_at": today, "_scope": [SCOPE], "_count": len(plan["alias"]), "_ruling": RULING,
            "aliases": {k: {"new_id": v, "route": plan["moves"][k]["route"], "discipline": plan["moves"][k]["discipline"]}
                        for k, v in sorted(plan["alias"].items())}})
        with open(os.path.join(out, "report.md"), "w", encoding="utf-8") as f:
            f.write(render_report(plan, today, os.path.relpath(rp, ROOT)))
        print(f"DRY RUN - wrote {os.path.relpath(out, ROOT)}/(plan.json, picks.json, alias_map.json, report.md)")
        return 0 if all(v.get("pass") for v in plan["validation"].values()) else 1

    # ── apply ──
    with open(args.receipt, encoding="utf-8") as f:
        receipt = json.load(f)
    frozen = {k: v["new_id"] for k, v in receipt.get("aliases", {}).items()}
    plan["validation"]["P1_matches_receipt"] = {"pass": frozen == plan["alias"] and receipt.get("_scope") == [SCOPE]}
    with open(args.fresh_read, encoding="utf-8") as f:
        plan["validation"]["P3_fresh_read"] = er.fresh_read_check(json.load(f), curations, plan)
    before = {n: json.loads(json.dumps(d)) for n, d in docs.items()}
    pre_art = sum(1 for a in docs["articulations"].get("articulations", []) if a.get("course_id") in plan["alias"])
    saved, er.STAMP = er.STAMP, STAMP
    try:
        docs, counts = er.apply_plan(docs, plan)
    finally:
        er.STAMP = saved
    plan["validation"].update(er.post_gates(before, docs, plan, pre_art))
    new_seed = seed_edit(seed_doc, picks)
    bad = [k for k, v in plan["validation"].items() if not v.get("pass")]
    if bad:
        sys.exit("APPLY BLOCKED - " + ", ".join(bad) + ": " + json.dumps({k: plan["validation"][k] for k in bad})[:600])
    for name, f in er.FILES.items():
        er.dump(os.path.join(er.KB_DIR, f), docs[name])
    er.dump(SEED, new_seed)
    receipt.update({"_status": "Subjects List recode old->new alias (receipt + rollback inverse) - APPLIED",
                    "_applied_at": today, "_applied_ruling": RULING, "_counts": dict(counts)})
    er.dump(args.receipt, receipt)
    print(f"APPLIED - {dict(counts)}. Next: register the receipt in kb/alias_chain.py ALIAS_MAPS, run "
          "kb/_post_apply_chain.py, --finish-seed, --rekey-skyview --rekey-generated, rebuild the payloads, commit, "
          "then dispatch supabase-rekey.yml with the receipt.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
