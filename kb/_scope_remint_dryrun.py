#!/usr/bin/env python3
"""The re-mint dry run for one scope's READY M-IDs (#3655, the commons lane's NEXT (5)). Measurement only.

Sam, 2026-11-22 (r-subjects-before-remint-sam-2026-11-22): finish the common subject and local subject titles
before re-minting M-IDs. The order he approved (d-remint-order-subjects-outcomes-dryrun-s707): settle the scope's
codes, rerun the outcomes comparison, then ONE dry run. kb/_mid_readiness.py applies the draft gate and writes
kb/status/mid_readiness.json; this script reads that file and nothing decides here that the gate did not.

WHAT IT PLANS, per ready M-ID (the gate's `shape`):
  one code     every member settled to one common code X. When X is the M-ID's own prefix nothing moves. Otherwise
               the M-ID takes X's prefix, keeping its number where the new key is free and gap-filling where it is
               not (the authority recode's Allocator, the S612/SkyKumquat pattern), and its discipline becomes the
               one whose Common SUBJ is X in kb/discipline_canonical_subj4.json, since the code is what a person
               settled (each discipline following its code, the Sheet 104 precedent).
  splits       the members settled to two or more codes. A split of ONE college's course listed under two local
     along     codes with the same number and title (Cerritos ELAP 90.08 and AED 90.08, Solar Energy) is a
     code      cross-listing: one course, so one identity, and it stays where it is
               (d-crosslisted-split-keeps-its-identity-s710). Any other split is held for a person: which member
               keeps the id is a judgment this dry run does not make.

A SLOT AN EARLIER RE-MINT VACATED, or one SkyView's layout still draws, is never taken (the S436 duplicate-point
failure): the allocator's used set is every live key plus kb/alias_chain.py's maps (_eths_remint.ever_minted_ids)
plus _eths_remint.skyview_ids, plus the reserved pile ids.

The plan's shape is the one _eths_remint.apply_plan consumes (moves[old] = {..., "discipline", "new_id"}, alias),
so an apply, when Sam sets the gate, reuses that code path and its post-gates. This script has no --apply.

    python3 kb/_scope_remint_dryrun.py                 # the aed scope -> kb/scope_remint_out/<date>-<scope>/
    python3 kb/_scope_remint_dryrun.py --stdout        # print the summary, write nothing

What an apply would still need (the playbook, docs/coursecontrolnumber_remint.md): the live kb_curation rows for the
moved ids read at write time, the receipt registered in ALIAS_MAPS in the same commit, kb/_post_apply_chain.py,
the generated files re-keyed token for token, supabase-rekey.yml with the receipt, then daily-dashboard.yml, all
before the next cron.
"""
from __future__ import annotations

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

READINESS = os.path.join("kb", "status", "mid_readiness.json")
SEED = os.path.join("kb", "discipline_canonical_subj4.json")
OUT_ROOT = os.path.join("kb", "scope_remint_out")
NUM_RE = re.compile(r"^\s*([A-Za-z&/ .\-]*?)\s*([0-9][0-9A-Za-z.\-]*)\s*$")


def norm_title(t):
    return re.sub(r"[^a-z0-9]+", " ", (t or "").lower()).strip()


def course_number(code):
    m = NUM_RE.match(code or "")
    return (m.group(2).upper() if m else (code or "").strip().upper())


def crosslisted(rows):
    """One college's one course under two or more local codes: same college, number and title on every member."""
    if len(rows) < 2:
        return False
    colleges = {r.get("college") for r in rows}
    numbers = {course_number(r.get("code")) for r in rows}
    titles = {norm_title(r.get("title")) for r in rows}
    codes = {(r.get("code") or "").split()[0].upper() for r in rows if r.get("code")}
    return len(colleges) == 1 and len(numbers) == 1 and len(titles) == 1 and len(codes) > 1


def discipline_for_code(seed):
    """Common SUBJ -> the one discipline that holds it; a code two disciplines claim maps to None."""
    owners = {}
    for d, e in seed.items():
        c = e.get("canonical_subj4")
        if c:
            owners.setdefault(c, []).append(d)
    return {c: (ds[0] if len(ds) == 1 else None) for c, ds in owners.items()}


def compute_plan(scope, readiness, members, courses, singletons, curations, seed, reservations,
                 vacated=frozenset(), drawn=frozenset()):
    """Pure. -> the plan (moves, alias, stays, held, validation, gapfilled)."""
    import _authority_recode_dryrun as rec

    sc = readiness["scopes"][scope]
    by_mid = sc["by_mid"]
    ready = sorted(m for m, v in by_mid.items() if v.get("ready"))
    owner = discipline_for_code(seed)
    moves, stays, held, missing = {}, {}, {}, []
    for mid in ready:
        v = by_mid[mid]
        rec_ = courses.get(mid) or singletons.get(mid)
        if rec_ is None:
            missing.append(mid)
            continue
        prefix = mid.split(" ")[0]
        codes = list(v.get("codes") or {})
        rows = members.get(mid) or []
        base = {"old_id": mid, "source": "minted" if mid in courses else "singleton",
                "title": (curations.get(mid) or {}).get("unified_title") or rec_.get("common_title") or "",
                "members": len(rows) or v.get("members"), "codes": v.get("codes"),
                "colleges": sorted({r.get("college") for r in rows if r.get("college")}),
                "from_discipline": rec_.get("discipline")}
        if v.get("shape") == "splits along code":
            if crosslisted(rows):
                stays[mid] = dict(base, why="cross-listed: one college's one course under %s; one identity, it "
                                            "stays (d-crosslisted-split-keeps-its-identity-s710)"
                                            % " and ".join(sorted({(r.get("code") or "").split()[0] for r in rows})))
            else:
                held[mid] = dict(base, why="splits along code across courses: which member keeps the id is a "
                                           "person's call")
            continue
        code = codes[0] if len(codes) == 1 else None
        if not code:
            held[mid] = dict(base, why="no settled code in the readiness file")
            continue
        if code == prefix:
            stays[mid] = dict(base, why="settled to its own prefix %s; nothing moves" % code)
            continue
        disc = owner.get(code)
        if not disc:
            held[mid] = dict(base, why="%s is no single discipline's Common SUBJ in the seed" % code)
            continue
        if not rec.parse_id(mid)[4] or rec.parse_id(mid)[1] != "M":
            held[mid] = dict(base, why="not a numbered M-ID (an Honors id moves with its base)")
            continue
        moves[mid] = dict(base, route=code, discipline=disc,
                          merged_into=(curations.get(mid) or {}).get("merge_into"))

    real = set(courses) | set(singletons) | set(curations)
    alloc = rec.Allocator((real | set(vacated) | set(drawn)) - set(moves), reservations)
    for mid in sorted(moves):
        new_id, how = alloc.place(mid, moves[mid]["route"], prefer_keep=True,
                                  reason="%s -> %s (scope %s)" % (mid, moves[mid]["route"], scope))
        moves[mid]["new_id"], moves[mid]["how"] = new_id, how
    alias = {k: v["new_id"] for k, v in moves.items() if v.get("new_id")}
    new_ids = list(alias.values())
    pointing = sorted(k for k, c in curations.items()
                      if isinstance(c, dict) and c.get("merge_into") in moves and k not in moves)
    validation = {
        "V0_every_ready_mid_has_a_record": {"pass": not missing, "missing": missing[:10]},
        "V2_new_ids_unique_and_free": {"pass": len(set(new_ids)) == len(new_ids) == len(moves)
                                       and not (set(new_ids) & ((real | set(vacated) | set(drawn)) - set(moves))),
                                       "unplaced": sorted(set(moves) - set(alias))},
        "V3_prefix_is_the_settled_code": {"pass": all(v["new_id"].startswith(v["route"] + " ")
                                                      for v in moves.values() if v.get("new_id"))},
        "V4_every_ready_mid_accounted_for": {"pass": len(moves) + len(stays) + len(held) + len(missing) == len(ready)},
    }
    return {"scope": scope, "college": sc.get("college"), "code": sc.get("code"), "ready": len(ready),
            "moves": moves, "alias": alias, "stays": stays, "held": held,
            "merge_pointers_into_moved": pointing, "gapfilled": alloc.gapfilled, "validation": validation}


def touches(plan, docs):
    """What an apply would re-key, per id-keyed file (counted, never changed)."""
    alias = plan["alias"]
    out = Counter()
    for k in alias:
        if k in docs["memberships"].get("memberships", {}):
            out["coci_minted_memberships.json"] += 1
        if k in docs["curation"].get("curations", {}):
            out["coci_curation.json keys"] += 1
        if k in (docs["articulations"].get("identities") or {}):
            out["coci_articulations.json identities"] += 1
    out["coci_articulations.json rows"] = sum(1 for a in docs["articulations"].get("articulations", [])
                                              if a.get("course_id") in alias)
    out["coci_curation.json merge_into pointers"] = len(plan["merge_pointers_into_moved"])
    return dict(out)


def render(plan, readiness, today, receipt, touched):
    src = readiness.get("_sources") or {}
    v = plan["validation"]
    how = Counter(m["how"] for m in plan["moves"].values())
    lines = [
        "# Re-mint dry run: the %s scope's ready M-IDs (%s)" % (plan["scope"], today), "",
        "DRY RUN. Nothing is re-keyed: no kb file, no table, no generated file. Written by "
        "`kb/_scope_remint_dryrun.py` from `kb/status/mid_readiness.json` (the draft gate "
        "`d-remint-ready-gate-draft-s707`, Sam's to set).", "",
        "Scope: every M-ID with a member under %s's local code %s. Members read from %s; outcomes compare current: %s."
        % (plan["college"], plan["code"], src.get("members"), src.get("outcomes_current")), "",
        "## Count", "",
        "| | M-IDs |", "|---|---|",
        "| Ready by the gate | %d |" % plan["ready"],
        "| Would move | %d (%s) |" % (len(plan["moves"]), ", ".join("%d %s" % (n, k) for k, n in how.most_common()) or "none"),
        "| Stay where they are | %d |" % len(plan["stays"]),
        "| Held for a person | %d |" % len(plan["held"]), "",
        "Checks: " + "; ".join("%s %s" % (k, "pass" if x.get("pass") else "FAIL") for k, x in v.items()) + ".", "",
        "An apply would re-key: " + ("; ".join("%s %d" % (k, n) for k, n in touched.items()) or "nothing") + ".", "",
        "Receipt (dry run): `%s`." % receipt, "",
        "## Would move", "",
        "| Old | New | How | Discipline | Members | Title |", "|---|---|---|---|---|---|",
    ]
    for k in sorted(plan["moves"]):
        m = plan["moves"][k]
        lines.append("| %s | %s | %s | %s to %s | %s | %s |" % (k, m.get("new_id"), m.get("how"), m["from_discipline"],
                                                              m["discipline"], m["members"], m["title"]))
    for name, key in (("Stay", "stays"), ("Held", "held")):
        lines += ["", "## %s" % name, ""]
        if not plan[key]:
            lines.append("None.")
            continue
        lines += ["| M-ID | Members | Title | Why |", "|---|---|---|---|"]
        for k in sorted(plan[key]):
            m = plan[key][k]
            lines.append("| %s | %s | %s | %s |" % (k, m["members"], m["title"], m["why"]))
    lines += ["", "## Before an apply", "",
              "The playbook, `docs/coursecontrolnumber_remint.md`: read the live `kb_curation` rows for the moved ids "
              "at write time; register the applied receipt in `kb/alias_chain.py` `ALIAS_MAPS` in the same commit; run "
              "`kb/_post_apply_chain.py`; re-key the generated files token for token; after the merge, "
              "`supabase-rekey.yml` with the receipt, the read-back, then `daily-dashboard.yml`, before the next cron.",
              ""]
    return "\n".join(lines)


def load_inputs(root=ROOT):
    import _authority_recode_dryrun as rec
    import _eths_remint as er
    import _mid_outcomes_compare as comp
    with open(os.path.join(root, READINESS), encoding="utf-8") as f:
        readiness = json.load(f)
    with open(os.path.join(root, SEED), encoding="utf-8") as f:
        seed = json.load(f)["disciplines"]
    members, _ = comp.load_members(root)
    docs = er.load_docs()
    return readiness, seed, members, docs, rec.load_id_reservations(), er.ever_minted_ids(), er.skyview_ids(root)


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--scope", default="aed")
    ap.add_argument("--stdout", action="store_true")
    a = ap.parse_args(argv)
    readiness, seed, members, docs, reservations, vacated, drawn = load_inputs()
    plan = compute_plan(a.scope, readiness, members, docs["courses"]["courses"], docs["singletons"]["courses"],
                        docs["curation"]["curations"], seed, reservations, vacated=vacated, drawn=drawn)
    today = date.today().isoformat()
    out = os.path.join(OUT_ROOT, "%s-%s" % (today, a.scope))
    receipt = os.path.join(out, "alias_map.json").replace(os.sep, "/")
    touched = touches(plan, docs)
    md = render(plan, readiness, today, receipt, touched)
    ok = all(x.get("pass") for x in plan["validation"].values())
    if a.stdout:
        print(md)
        return 0 if ok else 1
    os.makedirs(os.path.join(ROOT, out), exist_ok=True)
    with open(os.path.join(ROOT, out, "plan.json"), "w", encoding="utf-8") as f:
        json.dump(plan, f, ensure_ascii=False, indent=1)
        f.write("\n")
    with open(os.path.join(ROOT, receipt), "w", encoding="utf-8") as f:
        json.dump({"_status": "scope re-mint old->new alias (receipt + rollback inverse) - DRY RUN, not applied",
                   "_at": today, "_scope": a.scope, "_count": len(plan["alias"]),
                   "_gate": "d-remint-ready-gate-draft-s707 (draft, Sam's to set)",
                   "aliases": {k: {"new_id": v, "route": plan["moves"][k]["route"],
                                   "discipline": plan["moves"][k]["discipline"]}
                               for k, v in sorted(plan["alias"].items())}}, f, ensure_ascii=False, indent=1)
        f.write("\n")
    with open(os.path.join(ROOT, out, "report.md"), "w", encoding="utf-8") as f:
        f.write(md)
    print("DRY RUN - %d move, %d stay, %d held; wrote %s/(plan.json, alias_map.json, report.md)"
          % (len(plan["moves"]), len(plan["stays"]), len(plan["held"]), out))
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
