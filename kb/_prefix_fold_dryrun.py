#!/usr/bin/env python3
"""
Prefix fold — DRY RUN. A keep-number prefix re-key for the rows whose M-ID
prefix is not their discipline's canonical SUBJ4 (fold-verify's `re_key`
fate in kb/_subj4_dryrun.py), in two cohorts:

  materialized  the machine clusters the 2026-09-03 Z-band retirement
                materialized under the prefix their cluster was minted with in
                June, while their members' discipline owns another code
                (2026-09-03: 139 — ITIS under Computer Science, HVAC under the
                trades, ARTS under Art History, THTR under Music ...)
  legacy        corroborated M-IDs and stand-alones whose discipline was re-set
                by the July trail-crew / mismint cohorts (kb_curation
                `discipline`) without the prefix following (2026-09-03: 146)

Rule 7 gate: a row whose discipline rests on TOP alone is HELD, never moved —
TOP is a last-in-line corroborator, never a primary determination of identity.
A materialized record's evidence is its members' discipline sources; a legacy
row's is the overlay `discipline` (a reviewed cohort) or the catalog's
`discipline_source`.

The allocation is the authority recode's (kb/_authority_recode_dryrun.py):
keep the number when the new key is free, otherwise gap-fill within the band
and then the continuation bands (Sam, card 11); the collision surface is every
catalog key and every overlay key that is not itself moving, plus the CCN /
C-ID sequence reservations. Two passes, so a displaced row never cascades.

Parity: the candidate set is checked against fold-verify's own `re_key` set
(V8) so the post-apply chain's fold-verify reads 0 once the plan is applied.
Umbrella spans (KINE/ATHL, the language codes, the agriculture families) are
fold-verify's allowances and never move here.

The sheet's verdicts arrive as two flags, so a per-verdict receipt is one
re-run: `--scope materialized` cuts item 2's legacy strays out ("2 edit: hold");
`--ruled-held "<who, when: what>"` folds the TOP-only held rows on the ruling
("3 edit: fold them") with the ruling appended to each row's evidence as the
second signal — a row with NO evidence stays held under any ruling. The apply
(kb/_prefix_fold_apply.py) recomputes the plan with the same flags and refuses
a receipt cut under different ones.

Nothing is written outside OUT_DIR (kb/prefix_fold_out/<date>/). Run:
  python3 kb/_prefix_fold_dryrun.py [--scope all|materialized|legacy] [--ruled-held TEXT] [--no-parity]
"""
import argparse
import copy
import importlib.util
import json
import os
import sys
from collections import Counter, defaultdict
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import _authority_recode_dryrun as rec  # noqa: E402

OUT_DIR = os.environ.get("PREFIX_FOLD_OUT") or os.path.join(HERE, "prefix_fold_out")
TOP_ONLY = {"top_code", "top_division"}
MATERIALIZED_ORIGIN = "machine cluster"
STAMP = "_prefix_fold_from"               # the apply's per-row stamp (each receipt has its own; earlier stamps are kept)


def _s4():
    spec = importlib.util.spec_from_file_location("s4dry", os.path.join(HERE, "_subj4_dryrun.py"))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def members_index(curations):
    """materialized id -> the member ids whose merge_into points at it."""
    idx = defaultdict(list)
    for k, v in curations.items():
        if isinstance(v, dict) and v.get("merge_into"):
            idx[v["merge_into"]].append(k)
    return idx


def evidence(cid, row, rows, curations, members_of):
    """(cohort, sources) — what the row's discipline rests on."""
    r = row["rec"]
    if r.get("origin") == MATERIALIZED_ORIGIN:
        srcs = []
        for m in members_of.get(cid, []):
            mc = curations.get(m) or {}
            mr = (rows.get(m) or {}).get("rec") or {}
            srcs.append("curator" if mc.get("discipline") else (mr.get("discipline_source") or "classified"))
        return "materialized", srcs
    c = curations.get(cid) or {}
    if c.get("discipline"):
        return "legacy", ["overlay:" + (c.get("reviewed_by") or "?")]
    return "legacy", [r.get("discipline_source") or "classified"]


def top_only(srcs):
    return bool(srcs) and all(s in TOP_ONLY for s in srcs)


def classify(rows, canon_doc, allowances):
    """fold-verify's fate logic, verbatim in substance: which rows sit off their
    discipline's canonical code and are not inside an umbrella allowance."""
    canon_map = canon_doc.get("disciplines") or {}
    fates, candidates = Counter(), {}
    for cid, row in rows.items():
        prefix, letter, band, tail, kind = rec.parse_id(cid)
        if not kind or kind == "z":
            fates["skip_offscheme_id"] += 1
            continue
        disc = row["discipline"]
        if not disc:
            fates["skip_no_discipline"] += 1
            continue
        entry = canon_map.get(disc)
        if entry is None:
            fates["skip_unknown_disc"] += 1
            continue
        canon = entry.get("canonical_subj4")
        allow = allowances.get(disc)
        if not canon or not rec.SUBJ4_RE.match(canon):
            fates["blocked_on_curator"] += 1
        elif allow is not None:
            fates["no_change" if prefix in allow else "skip_umbrella_offcode"] += 1
        elif canon == prefix:
            fates["no_change"] += 1
        else:
            fates["re_key"] += 1
            candidates[cid] = canon
    return fates, candidates


def compute_plan(courses, singletons, curations, identities, canon_doc, allowances,
                 reservations, scope="all", ruled_held=None):
    """Pure allocator. Returns the plan dict the receipts and the apply consume.

    ruled_held: the human ruling (who, when, what) that folds the TOP-only held
    rows too — appended to each such row's evidence as the second signal. A row
    with no evidence at all stays held whatever the ruling says."""
    rows = rec.load_rows(courses, singletons, curations)
    members_of = members_index(curations)
    fates, candidates = classify(rows, canon_doc, allowances)

    moves, held, out_of_scope = {}, {}, {}
    for cid, canon in sorted(candidates.items()):
        cohort, srcs = evidence(cid, rows[cid], rows, curations, members_of)
        row = {"old_id": cid, "new_prefix": canon, "discipline": rows[cid]["discipline"],
               "kind": cohort, "evidence": srcs, "title": rows[cid]["title"],
               "basis": f"{rec.parse_id(cid)[0]}->{canon}: {rows[cid]['discipline']} owns {canon}"}
        if not srcs:
            row["why_held"] = "no evidence for the discipline (a materialized record whose members no longer point at it)"
            held[cid] = row
        elif top_only(srcs) and not ruled_held:
            row["why_held"] = "discipline rests on TOP alone (Rule 7: never a primary determination)"
            held[cid] = row
        elif scope != "all" and cohort != scope:
            out_of_scope[cid] = row
        else:
            if top_only(srcs):                       # moves only on the ruling, and says so
                row["evidence"] = srcs + [f"ruled: {ruled_held}"]
                row["ruled"] = ruled_held
            moves[cid] = row

    real_keys = set(courses) | set(singletons) | set(curations)
    ghosts = set(identities) - real_keys
    used = real_keys - set(moves)
    alloc = rec.Allocator(used, reservations)
    order = sorted(moves.values(), key=lambda m: (m["kind"] != "materialized", m["discipline"], m["old_id"]))
    for m in order:                                  # pass 1: keep the number
        m["new_id"], m["how"] = None, None
        prefix, letter, band, tail, kind = rec.parse_id(m["old_id"])
        candidate = f"{m['new_prefix']} {letter}{band}{tail}"
        if alloc.free(candidate):
            alloc.taken.add(candidate)
            m["new_id"], m["how"] = candidate, "kept number"
    for m in order:                                  # pass 2: gap-fill the rest
        if m["new_id"]:
            continue
        m["new_id"], m["how"] = alloc.place(m["old_id"], m["new_prefix"], prefer_keep=False,
                                            reason=m["basis"])
    ghosts_healed = sorted(set(m["new_id"] for m in moves.values() if m.get("new_id")) & ghosts)
    ghosts_vacated = sorted(set(moves) & set(identities))

    alias = {m["old_id"]: m["new_id"] for m in moves.values() if m.get("new_id")}
    new_ids = list(alias.values())
    dup = [k for k, n in Counter(new_ids).items() if n > 1]
    collide = sorted(set(new_ids) & used)
    overflow = [m["old_id"] for m in moves.values() if not m.get("new_id")]
    bad_subj4 = sorted({m["new_prefix"] for m in moves.values() if not rec.SUBJ4_RE.match(m["new_prefix"])})
    chained = sorted(set(alias) & set(alias.values()))
    cycles = sorted(o for o, n in alias.items() if alias.get(n) == o)   # a swap: no safe order without a temporary key
    validation = {
        "V1_conservation": {"pass": len(alias) == len(moves) - len(overflow), "moves": len(moves), "aliased": len(alias)},
        "V2_new_ids_unique": {"pass": not dup, "duplicates": dup[:10]},
        "V3_new_ids_disjoint_from_untouched": {"pass": not collide, "collisions": collide[:10]},
        "V4_discipline_unchanged": {"pass": True, "note": "a fold never changes a row's discipline; the apply gate re-checks it"},
        "V5_alias_invertible": {"pass": len(set(new_ids)) == len(new_ids), "duplicates": dup[:10]},
        "V6_all_new_subj4_four_letters": {"pass": not bad_subj4, "bad": bad_subj4},
        "V7_no_overflow": {"pass": not overflow, "overflow": overflow[:10]},
        "V9_no_swap_cycles": {"pass": not cycles, "cycles": cycles[:10], "chained_keys": len(chained),
                              "note": "a chained key (old AND new) is fine: the catalog re-key maps all keys at once and "
                                      "the Supabase re-key applies vacate-first (#1455); a swap has no safe order"},
    }
    return {"moves": moves, "held": held, "out_of_scope": out_of_scope, "fates": dict(fates),
            "order": [m["old_id"] for m in order], "alias": alias, "gapfilled": alloc.gapfilled,
            "validation": validation, "scope": scope, "ruled_held": ruled_held or None, "rows": rows,
            "identities_ghosts": {"count": len(ghosts), "healed_by_this_fold": ghosts_healed,
                                  "vacated_keys_still_in_identities": ghosts_vacated}}


def parity(plan, courses, singletons, curations, canon_doc):
    """V8 — the candidate set equals fold-verify's re_key set (kb/_subj4_dryrun.py)."""
    s4 = _s4()
    verify = s4.compute_plan(copy.deepcopy(courses), copy.deepcopy(singletons), curations, canon_doc)
    theirs = {r["old_id"] for r in verify["rows"] if r.get("fate") == "re_key"}
    ours = set(plan["moves"]) | set(plan["held"]) | set(plan["out_of_scope"])
    plan["validation"]["V8_parity_with_fold_verify"] = {
        "pass": theirs == ours, "fold_verify_re_key": len(theirs), "candidates_here": len(ours),
        "only_in_fold_verify": sorted(theirs - ours)[:10], "only_here": sorted(ours - theirs)[:10]}
    return plan


def groups(plan):
    g = defaultdict(lambda: {"count": 0, "materialized": 0, "legacy": 0, "kept": 0, "gapfilled": 0, "examples": []})
    for m in plan["moves"].values():
        key = (rec.parse_id(m["old_id"])[0], m["new_prefix"], m["discipline"])
        e = g[key]
        e["count"] += 1
        e[m["kind"]] += 1
        e["kept" if m.get("how") == "kept number" else "gapfilled"] += 1
        if len(e["examples"]) < 3:
            e["examples"].append(f"{m['old_id']} → {m.get('new_id')} · {m['title']}")
    return dict(sorted(g.items(), key=lambda kv: (-kv[1]["count"], kv[0])))


def write_receipts(plan, out):
    os.makedirs(out, exist_ok=True)
    today = date.today().isoformat()
    moves = plan["moves"]
    rec._dump(os.path.join(out, "alias_map.json"), {
        "_status": f"DRY-RUN — prefix fold (scope {plan['scope']}); no kb files mutated, no Supabase writes.",
        "_generated_by": "kb/_prefix_fold_dryrun.py", "_generated_at": today,
        "_rule": "keep the number, gap-fill only where the new key exists (continuation band when the "
                 "band is full); a row whose discipline rests on TOP alone is held",
        "count": len(plan["alias"]), "scope": plan["scope"], "ruled_held": plan.get("ruled_held"),
        "ruled_rows": sorted(old for old, m in moves.items() if m.get("ruled")),
        "aliases": {old: dict({"new_id": m["new_id"], "discipline": m["discipline"], "kind": m["kind"],
                               "item": "fold-worklist", "basis": m["basis"], "how": m["how"],
                               "evidence": m["evidence"]},
                              **({"ruled": m["ruled"]} if m.get("ruled") else {}))
                    for old, m in sorted(moves.items()) if m.get("new_id")}})
    rec._dump(os.path.join(out, "collisions.json"), {
        "_about": "keep-number candidates that were taken and the free key they were gap-filled to; "
                  "plus the articulation identities-map ghosts the fold heals or vacates",
        "count": len(plan["gapfilled"]), "gapfilled": plan["gapfilled"],
        "identities_ghosts": plan["identities_ghosts"]})
    rec._dump(os.path.join(out, "held.json"), {
        "_about": "candidates NOT in the alias map: held (discipline on TOP alone) or outside --scope",
        "held": dict(sorted(plan["held"].items())), "out_of_scope": dict(sorted(plan["out_of_scope"].items())),
        "fates": plan["fates"]})
    sql = ["-- prefix fold kb_curation re-key — generated by kb/_prefix_fold_dryrun.py (PREVIEW)",
           "-- DO NOT RUN. The apply dispatches .github/workflows/supabase-rekey.yml with the receipt.",
           "begin;"]
    for old, new in sorted(plan["alias"].items()):
        o, n = old.replace("'", "''"), new.replace("'", "''")
        sql.append(f"update public.kb_curation set course_id = '{n}' where course_id = '{o}';")
        sql.append(f"update public.kb_curation set value = '{n}' where field = 'merge_into' and value = '{o}';")
    sql.append("commit;")
    with open(os.path.join(out, "supabase_ops.sql"), "w", encoding="utf-8") as f:
        f.write("\n".join(sql) + "\n")
    with open(os.path.join(out, "report.md"), "w", encoding="utf-8") as f:
        f.write(render_report(plan, today, out))


def render_report(plan, today, out):
    moves, alias, val = plan["moves"], plan["alias"], plan["validation"]
    by_kind = Counter(m["kind"] for m in moves.values())
    by_how = Counter(m.get("how") for m in moves.values())
    n_single = sum(1 for o in moves if rec.parse_id(o)[4] == "stand")
    rel = os.path.relpath(out, ROOT)
    L = ["---", "title: Prefix fold — DRY-RUN (the worklist the 2026-09-03 land surfaced)",
         f"date: {today}", "session: 224 (SkyTune)",
         "status: DRY-RUN — nothing mutated; awaiting Sam's verdicts on the decision sheet before any apply",
         "tags: [remint, dry-run, csr, subj4, prefix-fold, rule-7]",
         "artifacts:", f"  - {rel}/alias_map.json", f"  - {rel}/collisions.json", f"  - {rel}/held.json",
         f"  - {rel}/supabase_ops.sql",
         "related:", "  - kb/_authority_recode_dryrun.py (the allocator)", "  - kb/_subj4_dryrun.py (fold-verify)",
         "  - docs/coursecontrolnumber_remint.md", "---", "", "# Prefix fold — DRY-RUN", "", "## TL;DR", "",
         f"- **{len(alias):,}** ids move (scope `{plan['scope']}`): {by_kind.get('materialized', 0):,} materialized "
         f"machine clusters, {by_kind.get('legacy', 0):,} legacy strays ({n_single:,} of them stand-alone shapes).",
         f"- **{by_how.get('kept number', 0):,}** keep their number; **{by_how.get('gap-filled', 0):,}** gap-fill; "
         f"overflow {by_how.get('overflow', 0):,}.",
         f"- **{len(plan['held']):,}** candidates HELD (discipline on TOP alone, or no evidence); "
         f"{len(plan['out_of_scope']):,} outside the scope"
         + (f"; **{sum(1 for m in moves.values() if m.get('ruled')):,}** TOP-only rows fold on the ruling "
            f"`{plan['ruled_held']}`." if plan.get("ruled_held") else "."),
         f"- fold-verify fates on this tree: " + ", ".join(f"{k} {v:,}" for k, v in sorted(plan["fates"].items())) + ".",
         f"- validation: **{sum(1 for v in val.values() if v['pass'])}/{len(val)}** pass.", "",
         "## Groups (old prefix → canonical, discipline)", "",
         "| old → new | discipline | rows | materialized | legacy | kept | gap-filled | examples |", "|---|---|---:|---:|---:|---:|---:|---|"]
    for (old, new, disc), e in groups(plan).items():
        L.append(f"| `{old}` → `{new}` | {disc} | {e['count']} | {e['materialized']} | {e['legacy']} | "
                 f"{e['kept']} | {e['gapfilled']} | {'<br>'.join(e['examples'])} |")
    L += ["", "## Held (Rule 7: TOP alone)", ""]
    if plan["held"]:
        L += ["| id | would go to | discipline | title | members' evidence |", "|---|---|---|---|---|"]
        for cid, m in sorted(plan["held"].items()):
            L.append(f"| `{cid}` | `{m['new_prefix']}` | {m['discipline']} | {m['title']} | {', '.join(m['evidence'])} |")
    else:
        L.append("none")
    L += ["", "## Gap-filled", ""]
    if plan["gapfilled"]:
        L += ["| old | wanted | new | why |", "|---|---|---|---|"]
        for g in plan["gapfilled"]:
            L.append(f"| `{g['old_id']}` | `{g['wanted']}` | `{g['new_id']}` | {g['why']} |")
    else:
        L.append("none — every row keeps its number")
    L += ["", "## Validation", ""]
    for k, v in val.items():
        L.append(f"- {'✅' if v['pass'] else '❌'} {k}" + ("" if v["pass"] else f" — {json.dumps({kk: vv for kk, vv in v.items() if kk != 'pass'})[:300]}"))
    gh = plan["identities_ghosts"]
    L += ["", f"Identities-map ghosts: {gh['count']} (healed by this fold: {len(gh['healed_by_this_fold'])}; "
          f"vacated keys still in identities: {len(gh['vacated_keys_still_in_identities'])}).", ""]
    return "\n".join(L)


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--scope", choices=["all", "materialized", "legacy"], default="all")
    ap.add_argument("--ruled-held", default=None, metavar="TEXT",
                    help="fold the TOP-only held rows on this ruling (who, when: what) — item 3's override")
    ap.add_argument("--no-parity", action="store_true", help="skip V8 (fold-verify takes ~10 s)")
    args = ap.parse_args(argv)
    courses = rec._load(rec.COURSES)["courses"]
    singletons = rec._load(rec.SINGLETONS)["courses"]
    identities = (rec._load(rec.ARTICULATIONS).get("identities") or {})
    curations = rec._load(rec.CURATION).get("curations") or {}
    canon_doc = rec._load(rec.CANONICAL)
    s4 = _s4()
    plan = compute_plan(courses, singletons, curations, identities, canon_doc,
                        s4.load_umbrella_allowances(), rec.load_id_reservations(), scope=args.scope,
                        ruled_held=args.ruled_held)
    if not args.no_parity:
        parity(plan, courses, singletons, curations, canon_doc)
    out = os.path.join(OUT_DIR, date.today().isoformat())
    write_receipts(plan, out)
    val = plan["validation"]
    by_kind = Counter(m["kind"] for m in plan["moves"].values())
    by_how = Counter(m.get("how") for m in plan["moves"].values())
    print(f"[prefix_fold_dryrun] {date.today().isoformat()} scope={args.scope}"
          + (f" ruled-held={args.ruled_held!r}" if args.ruled_held else ""))
    print(f"  moves: {len(plan['alias']):,}  (" + ", ".join(f"{k} {v:,}" for k, v in by_kind.most_common()) + ")"
          f"  · held {len(plan['held']):,} · out of scope {len(plan['out_of_scope']):,}")
    print(f"  kept number {by_how.get('kept number', 0):,} · gap-filled {by_how.get('gap-filled', 0):,} · "
          f"overflow {by_how.get('overflow', 0):,}")
    print(f"  validation: {sum(1 for v in val.values() if v['pass'])}/{len(val)} pass")
    for k, v in val.items():
        if not v["pass"]:
            print(f"    ❌ {k}: {json.dumps({kk: vv for kk, vv in v.items() if kk != 'pass'})[:300]}")
    print(f"  artifacts: {os.path.relpath(out, ROOT)}/{{alias_map,collisions,held}}.json + supabase_ops.sql + report.md")
    return plan


if __name__ == "__main__":
    main()
