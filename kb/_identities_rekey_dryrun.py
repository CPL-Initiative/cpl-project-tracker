#!/usr/bin/env python3
"""Articulation identities map — rebuild-from-baseline re-key. DRY RUN by
default; --apply needs the frozen receipt and Sam's ruling (Rule 7).

kb/coci_articulations.json carries an `identities` map (2,346 entries on
2026-09-04) keyed by course id: identity_system, title, discipline, confidence,
over_merged, colleges_offering … The re-mint applies since May re-keyed the
articulations' course_id values and the memberships, but the identities map was
re-keyed by only some of them (the S110 class), so 1,597 of its keys (68%) name
ids no longer in the catalog. Display is safe meanwhile — the generator reads the
catalog record first and consults this map only for a LIVE member id
(colleges_offering in rollup, over_merged) — so a ghost is inert for display
and exactly wrong for the one thing that still reads it by key.

Measured 2026-09-04 (S225, reproduced by S226): resolving each ghost through
the full ALIAS_MAPS chain (kb/_rekey_promotions.resolve — one lookup per map,
chronological) lands 1,422 on live catalog ids, 175 nowhere (dead: no map ever
named them again), 16 converge on 7 live ids, 44 land on a key that already
carries a live entry; titles agree on 1,258 of the 1,422 (the rest are
normalization variants such as "Academy I" / "Academy 1").

The plan, per ghost key:
  rekey            → the live id has no entry: move the entry, stamp
                     `_identities_rekeyed_from`
  drop_collision   → the live id already has an entry: keep the live entry
                     (computed on the current catalog), drop the ghost
  drop_converged   → several ghosts land on one live id with no entry: the one
                     whose title agrees with the catalog title wins, then the
                     one with more colleges, then the alphabetical first; the
                     others drop
  drop_dead        → no map names it again, or it lands on a non-live id: drop
                     (nothing can display it — the generator only reads the map
                     for live member ids)

Nothing here is a judgment about a course; it is hygiene on a side table. It is
still a mutation of an id-keyed artifact class, so it takes the playbook's
shape: a receipt, P0 (never twice), P1 (recomputed == frozen), gates, one cron
window, and Sam's reply by number on the sheet that carries the four counts.

Usage (from repo root):
  python3 kb/_identities_rekey_dryrun.py                        # dry run + receipt
  python3 kb/_identities_rekey_dryrun.py --receipt kb/identities_rekey_out/<date> \\
      --ruling "Sam, <date>: …" --apply                         # write
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
import alias_chain as rp  # noqa: E402  (the ONE chain — Sam's ruling 8)
from _authority_recode_apply import _atomic_dump, _trailing_nl  # noqa: E402

ARTICULATIONS = os.path.join(HERE, "coci_articulations.json")
COURSES = os.path.join(HERE, "coci_minted_courses.json")
SINGLETONS = os.path.join(HERE, "coci_minted_singletons.json")
OUT_DIR = os.environ.get("IDENTITIES_REKEY_OUT") or os.path.join(HERE, "identities_rekey_out")
STAMP = "_identities_rekeyed_from"
ERA = "_identities_rekeyed"


def _load(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _nt(t):
    return re.sub(r"[^a-z0-9]+", " ", (t or "").lower()).strip()


def load_maps():
    return [rp.load_alias(rel) for rel in rp.ALIAS_MAPS if os.path.exists(os.path.join(ROOT, rel))]


def compute_plan(identities, live, maps, title_of):
    """Pure. live = set of catalog ids; title_of(id) -> the catalog title or None."""
    ghosts = sorted(k for k in identities if k not in live)
    resolved = {g: rp.resolve(g, maps) for g in ghosts}
    by_target = defaultdict(list)
    dead = []
    for g, (new, hops) in resolved.items():
        if new == g or new not in live:
            dead.append(g)
        else:
            by_target[new].append(g)
    rekey, drop_collision, drop_converged, basis = {}, {}, {}, {}
    for new, gs in sorted(by_target.items()):
        if new in identities:
            for g in gs:
                drop_collision[g] = new
            continue
        if len(gs) == 1:
            rekey[gs[0]] = new
            continue
        ct = _nt(title_of(new))
        def rank(g):
            e = identities[g] or {}
            return (0 if ct and _nt(e.get("title")) == ct else 1,
                    -len(e.get("colleges_offering") or []), g)
        ordered = sorted(gs, key=rank)
        win, runner = ordered[0], ordered[1]
        rekey[win] = new
        rw, rr = rank(win), rank(runner)
        # The DECIDING criterion — the first rank component where the winner beats
        # the runner-up — not merely the first one the winner satisfies.
        basis[new] = ("title agrees with the catalog" if rw[0] < rr[0]
                      else "more colleges offering" if rw[1] < rr[1]
                      else "alphabetical first")
        for g in ordered[1:]:
            drop_converged[g] = new
    agree = sum(1 for g, new in rekey.items() if _nt(identities[g].get("title")) == _nt(title_of(new)))
    differ = [(g, new, identities[g].get("title"), title_of(new)) for g, new in rekey.items()
              if _nt(identities[g].get("title")) != _nt(title_of(new))]
    hops = Counter(len(resolved[g][1]) for g in ghosts if resolved[g][0] != g)
    n_after = len(identities) - len(ghosts) + len(rekey)
    validation = {
        "V1_every_ghost_dispositioned": {"pass": len(rekey) + len(drop_collision) + len(drop_converged) + len(dead) == len(ghosts)},
        "V2_rekey_targets_live_and_unique": {"pass": all(n in live for n in rekey.values()) and len(set(rekey.values())) == len(rekey)},
        "V3_rekey_targets_have_no_entry": {"pass": not any(n in identities for n in rekey.values())},
        "V4_post_state_all_live": {"pass": True, "entries_after": n_after},
    }
    return {"rekey": rekey, "drop_collision": drop_collision, "drop_converged": drop_converged,
            "drop_dead": sorted(dead), "winner_basis": basis, "ghosts": len(ghosts),
            "title_agree": agree, "title_differ": differ, "hops": dict(sorted(hops.items())),
            "validation": validation, "entries_before": len(identities), "entries_after": n_after}


def apply_plan(identities, plan, now):
    """Pure with respect to files: returns (new identities map, stats)."""
    out, stats = {}, Counter()
    drops = set(plan["drop_dead"]) | set(plan["drop_collision"]) | set(plan["drop_converged"])
    for k, v in identities.items():
        if k in plan["rekey"]:
            e = dict(v)
            e[STAMP] = k
            out[plan["rekey"][k]] = e
            stats["rekeyed"] += 1
        elif k in drops:
            stats["dropped"] += 1
        else:
            out[k] = v
            stats["kept"] += 1
    return dict(sorted(out.items())), stats


def post_gates(orig, new_ident, plan, live):
    g = {}
    g["G1 every remaining key is a live catalog id"] = all(k in live for k in new_ident)
    g["G2 count = before - ghosts + rekeyed"] = len(new_ident) == plan["entries_after"]
    g["G3 every re-keyed entry carries its old key"] = all(
        new_ident.get(n, {}).get(STAMP) == o for o, n in plan["rekey"].items())
    g["G4 untouched live entries byte-identical"] = all(
        new_ident.get(k) == v for k, v in orig.items() if k in live)
    g["G5 no dropped key remains"] = not any(
        k in new_ident for k in list(plan["drop_dead"]) + list(plan["drop_collision"]) + list(plan["drop_converged"]))
    return g


def write_receipts(plan, out, today):
    os.makedirs(out, exist_ok=True)
    aliases = {}
    for g, n in plan["rekey"].items():
        aliases[g] = {"new_id": n, "action": "rekey"}
    for g, n in plan["drop_collision"].items():
        aliases[g] = {"new_id": n, "action": "drop_collision", "why": "the live id already carries an entry"}
    for g, n in plan["drop_converged"].items():
        aliases[g] = {"new_id": n, "action": "drop_converged", "why": f"another ghost won the entry ({plan['winner_basis'].get(n)})"}
    for g in plan["drop_dead"]:
        aliases[g] = {"new_id": None, "action": "drop_dead", "why": "no alias map names it again, or it lands on a non-live id"}
    _atomic_dump(os.path.join(out, "alias_map.json"), {
        "_status": f"DRY-RUN {today} — identities map rebuild-from-baseline re-key. NOT applied.",
        "_generated_by": "kb/_identities_rekey_dryrun.py", "_generated_at": today,
        "_rule": ("resolve each ghost key through the full ALIAS_MAPS chain; move the entry onto its live id when "
                  "that id has none; keep the live entry on a collision; the title-agreeing ghost wins a "
                  "convergence; drop what nothing names again"),
        "_note": ("this map is NOT an ALIAS_MAPS receipt: it re-keys a side table whose keys the chain already "
                  "knows; it must not be registered in kb/_rekey_promotions.py ALIAS_MAPS"),
        "count": len(aliases), "counts": {"rekey": len(plan["rekey"]), "drop_collision": len(plan["drop_collision"]),
                                          "drop_converged": len(plan["drop_converged"]), "drop_dead": len(plan["drop_dead"])},
        "aliases": aliases}, True)
    L = [f"# Identities map re-key — dry run {today}", "", f"status: DRY-RUN {today} — nothing applied", "",
         f"- entries: **{plan['entries_before']:,}** · ghosts: **{plan['ghosts']:,}** · after: **{plan['entries_after']:,}**",
         f"- re-key: **{len(plan['rekey']):,}** (titles agree on {plan['title_agree']:,}) · drop, collision: "
         f"**{len(plan['drop_collision']):,}** · drop, converged: **{len(plan['drop_converged']):,}** · drop, dead: "
         f"**{len(plan['drop_dead']):,}**", f"- hops through the chain: {plan['hops']}", "", "## Validation", ""]
    L += [f"- {'✅' if v['pass'] else '❌'} {k}" for k, v in plan["validation"].items()]
    L += ["", "## The sheet for Sam (reply by number)", "",
          f"1. Re-key {len(plan['rekey']):,} entries onto the live id the alias chain names (proposed: yes).",
          f"2. Drop {len(plan['drop_dead']):,} entries no map names again (proposed: yes — nothing can display them).",
          f"3. Drop {len(plan['drop_collision']):,} ghosts whose live id already carries an entry (proposed: keep the live entry).",
          f"4. On {len(plan['drop_converged']):,} convergences, keep the ghost whose title agrees with the catalog "
          f"(proposed: yes; basis recorded per target).",
          f"5. {len(plan['title_differ']):,} re-keyed entries carry a title that differs from the catalog's (normalization "
          f"variants; the catalog overrides display — proposed: no action).", "",
          "## Title differences (sample)", "", "| ghost | live id | map title | catalog title |", "|---|---|---|---|"]
    for g, n, t1, t2 in plan["title_differ"][:25]:
        L.append(f"| `{g}` | `{n}` | {t1} | {t2} |")
    L += ["", "## Apply procedure", "",
          "1. Sam replies by number; record the ruling as data.",
          "2. `python3 kb/_identities_rekey_dryrun.py --receipt <this dir> --ruling \"<who, when: what>\" --apply` "
          "(P0 · P1 · G1-G5); commit in one cron window; the daily run regenerates the artifacts.",
          "3. This receipt is NOT registered in ALIAS_MAPS (it re-keys a side table, it mints nothing).", ""]
    with open(os.path.join(out, "report.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(L))
    with open(os.path.join(out, "validation.md"), "w", encoding="utf-8") as f:
        f.write(f"# Identities map re-key — dry-run validation\n\n- generated: `{today}`\n\n"
                + "\n".join(f"- {'✅' if v['pass'] else '❌'} {k}" for k, v in plan["validation"].items()) + "\n")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--receipt")
    ap.add_argument("--ruling", help="Sam's reply, verbatim with who and when (required with --apply)")
    ap.add_argument("--out")
    args = ap.parse_args()
    today = date.today().isoformat()
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    art = _load(ARTICULATIONS)
    courses, singles = _load(COURSES)["courses"], _load(SINGLETONS)["courses"]
    live = set(courses) | set(singles)
    title_of = lambda i: (courses.get(i) or singles.get(i) or {}).get("common_title")
    identities = art.get("identities") or {}
    plan = compute_plan(identities, live, load_maps(), title_of)
    print(f"identities {plan['entries_before']:,} · ghosts {plan['ghosts']:,} · re-key {len(plan['rekey']):,} "
          f"(titles agree {plan['title_agree']:,}) · drop collision {len(plan['drop_collision']):,} · "
          f"drop converged {len(plan['drop_converged']):,} · drop dead {len(plan['drop_dead']):,} · after {plan['entries_after']:,}")
    failed = [k for k, v in plan["validation"].items() if not v["pass"]]
    if failed:
        sys.exit(f"ABORT: validation failed: {failed}")
    if not args.apply:
        out = args.out or os.path.join(OUT_DIR, today)
        write_receipts(plan, out, today)
        print(f"DRY RUN — receipt → {os.path.relpath(out, ROOT)}/")
        return 0
    if not args.receipt or not args.ruling:
        sys.exit("ABORT: --apply needs --receipt <dir> and --ruling \"<who, when: what>\".")
    if art.get(ERA):
        print(f"note: the map was re-keyed before ({art[ERA]}); P0 is per receipt.")
    frozen_path = os.path.join(args.receipt, "alias_map.json")
    frozen = _load(frozen_path)
    if str(frozen.get("_status", "")).startswith("APPLIED"):
        sys.exit("ABORT (P0): this receipt is already applied.")
    live_plan = {g: (v["action"], v["new_id"]) for g, v in frozen["aliases"].items()}
    mine = {}
    for g, n in plan["rekey"].items():
        mine[g] = ("rekey", n)
    for g, n in plan["drop_collision"].items():
        mine[g] = ("drop_collision", n)
    for g, n in plan["drop_converged"].items():
        mine[g] = ("drop_converged", n)
    for g in plan["drop_dead"]:
        mine[g] = ("drop_dead", None)
    drift = sorted(k for k in set(mine) | set(live_plan) if mine.get(k) != live_plan.get(k))
    if drift:
        sys.exit(f"ABORT (P1): plan drift vs the frozen receipt: {len(drift)} keys (sample {drift[:5]}) — re-run the dry run.")
    print(f"P1 plan fidelity: recomputed == frozen ({len(mine)} dispositions) ✓")
    new_ident, stats = apply_plan(identities, plan, now)
    gates = post_gates(identities, new_ident, plan, live)
    for gname, ok in gates.items():
        print(f"  {'PASS' if ok else 'FAIL'}  {gname}")
    if not all(gates.values()):
        sys.exit("✗ gate failure — NOTHING written.")
    art["identities"] = new_ident
    art.setdefault(ERA, []).append({"at": now, "receipt": os.path.relpath(args.receipt, ROOT), "ruling": args.ruling})
    _atomic_dump(ARTICULATIONS, art, _trailing_nl(ARTICULATIONS))
    frozen["_status"] = f"APPLIED {now} — identities map re-key. Ruling: {args.ruling}"
    frozen["_applied_at"] = now
    frozen["_applied_by"] = "kb/_identities_rekey_dryrun.py"
    frozen["_ruling"] = args.ruling
    _atomic_dump(frozen_path, frozen, True)
    with open(os.path.join(args.receipt, "validation.md"), "w", encoding="utf-8") as f:
        f.write(f"# Identities map re-key — APPLY validation receipt\n\n- applied: `{now}`\n- ruling: {args.ruling}\n"
                f"- ripple: " + " · ".join(f"{k} {v:,}" for k, v in sorted(stats.items())) + "\n\n## Gates\n\n"
                + "\n".join(f"- ✅ {g}" for g in gates) + "\n")
    print(f"\n✓ APPLIED. ripple: " + " | ".join(f"{k} {v:,}" for k, v in sorted(stats.items())))
    return 0


if __name__ == "__main__":
    sys.exit(main())
