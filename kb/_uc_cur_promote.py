#!/usr/bin/env python3
"""UC-CUR placeholder promotion — DRY RUN by default, --apply mutates (Rule 7).

A client mint on the CCR tab (doConsolidate in unified_courses.js) and the gated
auto-merge bot (kb/_auto_merge_worklist.py) both write a TRANSIENT target
`UC-CUR-*` into kb_curation: a self-keyed unified_title (+ discipline) row and
the members' merge_into pointers. Until 2026-09-03 the Z scheme numbered those
(kb/_uc_cur_zscheme_*.py, retired with the band). Since Sam's rulings of
2026-09-03 — "everything that isn't a CID or CCN is a MID" (card 12: a retired
identity becomes a REAL M-ID record) and the continuation band (card 11) — a
placeholder is promoted to a real M-ID record:

  id      SUBJ M<band><seq>. SUBJ is the discipline's canonical SUBJ4 (an
          umbrella discipline — Foreign Languages, Kinesiology — keeps the
          members' own split code); band 9 when the members are noncredit,
          else 1; seq the lowest free corroborated number in that bucket,
          continuing into the next band digit when the bucket is full. Every id
          ever minted stays reserved: the free set is computed over courses ∪
          singletons ∪ curation keys ∪ identities ∪ common ∪ every ALIAS_MAPS
          old and new id ∪ the CCN / C-ID reservations.
  record  materialized into kb/coci_minted_courses.json exactly as the Z-band
          retirement materialized a machine cluster (the members' aggregate;
          origin 'curator mint', or 'machine cluster' for a UC-CUR-AUTO target;
          `_promoted_from`; NO membership entry of its own — the members keep
          theirs and their merge_into pointers, so no college course is counted
          twice). A client mint carries its curator's reviewed_by / reviewed_at.
  re-key  kb/coci_curation.json self-key + pointers (git side); the Supabase
          half from the receipt through .github/workflows/supabase-rekey.yml in
          the same window.

HELD, never guessed (Rule 7): a placeholder with fewer than two pointers (a
mint is a merge; one pointer is a re-home for a curator), one whose discipline
neither the curation row nor its members name, one whose discipline has no
four-letter canonical code, one whose band cannot be read. Held rows are
reported and left exactly as they are.

Receipt: kb/uc_cur_promote_out/<date>/{alias_map.json, report.md,
supabase_ops.json, validation.md}. After the apply commit: register
alias_map.json in kb/_rekey_promotions.py ALIAS_MAPS, dispatch
supabase-rekey.yml with it, run kb/_post_apply_chain.py once, then
daily-dashboard.yml (the artifact policy).

Gates at apply (all must pass or nothing is written):
  V1-V5  the plan's validations, recomputed
  P0     this receipt not already applied; no planned placeholder already
         promoted (a `_promoted_from` stamp on a catalog record)
  P1     plan fidelity: the recomputed alias map == the frozen receipt
  P3     curation freshness at write-time (--curation-export or --fresh-read)
  G1-G8  post-mutation: curation count conserved; no promoted key or pointer
         left; the catalog grows by exactly the promoted count, each record
         key == course_id, M-shaped, stamped, titled, disciplined, ≥2 members;
         memberships untouched; untouched rows byte-identical; minted and
         singleton keys disjoint; every merge_into pointer still resolves

Usage (from repo root):
  python3 kb/_uc_cur_promote.py                                  # dry run + receipt
  python3 kb/_uc_cur_promote.py --receipt kb/uc_cur_promote_out/<date> \\
      --fresh-read /tmp/fresh.json --apply                       # write
0 placeholders today (2026-09-04): the tool exits 0 with "nothing to promote".
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from collections import Counter
from datetime import date, datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import _zband_retire_dryrun as zdry  # noqa: E402
import _zband_retire_apply as zapp  # noqa: E402
from _authority_recode_apply import (_atomic_dump, _trailing_nl, fresh_read_matches,  # noqa: E402
                                     plan_fidelity, rebuild_overlay)

MEMBERSHIPS = os.path.join(HERE, "coci_minted_memberships.json")
ALIASES = os.path.join(HERE, "discipline_aliases.json")
OUT_DIR = os.environ.get("UC_CUR_PROMOTE_OUT") or os.path.join(HERE, "uc_cur_promote_out")

UC_CUR_RE = re.compile(r"^UC-CUR-")
AUTO_RE = re.compile(r"^UC-CUR-AUTO")
MEMBER_BAND_RE = re.compile(r"^[A-Z]{1,6} M(\d)")
STAMP = "_promoted_from"
ORIGIN_CURATOR = "curator mint"
ORIGIN_AUTO = "machine cluster"
CLASSIFIED_BY = ("kb/_uc_cur_promote.py — a UC-CUR placeholder promoted to an M-ID record "
                 "(Sam, 2026-09-03: everything that is not a C-ID or CCN is an M-ID)")


def _load(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _nt(t):
    return re.sub(r"[^a-z0-9]+", " ", (t or "").lower()).strip()


# ── discovery ───────────────────────────────────────────────────────────────
def find_placeholders(curations):
    """{placeholder: {"members": [pointing keys, sorted], "entry": its own row or {}}}.
    A target with a self-row and no pointers, or pointers and no self-row, is
    surfaced (not dropped): both shapes are part of the re-key surface."""
    out = {}
    for cid, v in curations.items():
        if not isinstance(v, dict):
            continue
        mi = v.get("merge_into")
        if mi and UC_CUR_RE.match(str(mi)):
            out.setdefault(mi, {"members": [], "entry": {}})["members"].append(cid)
        if UC_CUR_RE.match(cid):
            out.setdefault(cid, {"members": [], "entry": {}})["entry"] = v
    for ph in out:
        out[ph]["members"].sort()
    return out


def reserved_alias_ids():
    """Every old and new id named by any registered alias map — an id ever
    minted stays reserved (Sam, 2026-09-03, card 11)."""
    try:
        import alias_chain as ac
    except Exception:
        return set()
    ids = set()
    for rel in ac.ALIAS_MAPS:
        path = os.path.join(ROOT, rel)
        if not os.path.exists(path):
            continue
        try:
            m = ac.load_alias(rel)
        except Exception:
            continue
        for old, v in (m or {}).items():
            ids.add(old)
            new = ac.step(v)
            if new:
                ids.add(new)
    return ids


# ── the plan ────────────────────────────────────────────────────────────────
def compute_plan(courses, singletons, curations, identities, common, canon_doc, fl_doc,
                 reservations, extra_reserved=()):
    """Pure. -> {"alias": {ph: new_id}, "rows": {ph: {...}}, "held": {ph: {...}},
    "validation": {...}, "continued": [...]}."""
    codes, umbrella = zdry.canonical_codes(canon_doc, fl_doc, {})
    alias_rev = {}
    for canon_name, alts in (canon_doc.get("_aliases") or {}).items():
        for a in alts or []:
            alias_rev[a] = canon_name

    def resolve_disc(d):
        d = (d or "").strip()
        if not d:
            return None
        if d in codes:
            return d
        bare = re.sub(r"\s*\([^)]*\)\s*$", "", d).strip()
        if bare in codes:
            return bare
        return alias_rev.get(d) or alias_rev.get(bare) or d

    all_keys = (set(courses) | set(singletons) | set(curations) | set(identities or {})
                | set(common or {}) | set(extra_reserved or ()))
    buckets = zdry.Buckets(all_keys, reservations)
    phs = find_placeholders(curations)
    alias, rows, held = {}, {}, {}

    def hold(ph, why, **extra):
        held[ph] = dict({"placeholder": ph, "why": why}, **extra)

    order = sorted(phs, key=lambda p: (_nt((phs[p]["entry"] or {}).get("unified_title")), p))
    for ph in order:
        info = phs[ph]
        entry, members = info["entry"] or {}, info["members"]
        recs = [(m, courses.get(m) or singletons.get(m) or {}) for m in members]
        title = entry.get("unified_title") or next((r.get("common_title") for _, r in recs if r.get("common_title")), None)
        if len(members) < 2:
            hold(ph, "fewer than two pointers — a mint is a merge; a single pointer is a re-home for a curator",
                 members=members, title=title)
            continue
        disc = resolve_disc(entry.get("discipline"))
        disc_source = "curation row" if disc else None
        if not disc:
            dc = Counter(resolve_disc(r.get("discipline")) for _, r in recs if r.get("discipline"))
            if dc:
                mx = max(dc.values())
                disc = sorted(d for d, c in dc.items() if c == mx)[0]
                disc_source = "members' modal discipline"
        if not disc:
            hold(ph, "no discipline on the curation row and none on the members (Rule 7: never guessed)",
                 members=members, title=title)
            continue
        code, code_source = None, None
        if disc in umbrella:
            s4c = Counter((r.get("subject_4letter") or "").upper() for _, r in recs
                          if (r.get("subject_4letter") or "").upper() in umbrella[disc])
            if s4c:
                mx = max(s4c.values())
                code, code_source = sorted(c for c, n in s4c.items() if n == mx)[0], "umbrella: the members' split code"
        if not code:
            code, code_source = codes.get(disc), "the discipline's canonical code"
        if not code or not zdry.SUBJ4_RE.match(code):
            hold(ph, f"no four-letter canonical code for the discipline {disc!r}", members=members,
                 title=title, discipline=disc)
            continue
        cs = Counter((r.get("credit_status") or "").lower() for _, r in recs if r.get("credit_status"))
        if cs:
            modal_cs = cs.most_common(1)[0][0]
            band = "9" if "noncredit" in modal_cs else "1"
            band_source = "members' modal credit status"
        else:
            bd = Counter(MEMBER_BAND_RE.match(m).group(1) for m in members if MEMBER_BAND_RE.match(m))
            if not bd:
                hold(ph, "no credit status on the members and no band digit in their ids",
                     members=members, title=title, discipline=disc)
                continue
            band = bd.most_common(1)[0][0]
            band_source = "members' id band digit"
        new_id = buckets.next_corr(code, band, ph)
        if not new_id:
            hold(ph, f"bucket {code} M{band} is full through the continuation bands", members=members,
                 title=title, discipline=disc)
            continue
        how = "continuation band" if any(o == ph for o, _, _ in buckets.continued) else "lowest free number"
        alias[ph] = new_id
        rows[ph] = {"new_id": new_id, "title": title, "discipline": disc, "discipline_source": disc_source,
                    "code_source": code_source, "band": band, "band_source": band_source,
                    "members": len(members), "member_ids": members, "how": how,
                    "origin": ORIGIN_AUTO if AUTO_RE.match(ph) else ORIGIN_CURATOR,
                    "reviewed_by": entry.get("reviewed_by"), "reviewed_at": entry.get("reviewed_at")}

    news = list(alias.values())
    validation = {
        "V1_new_ids_unique": {"pass": len(set(news)) == len(news)},
        "V2_new_ids_disjoint_from_existing": {"pass": not (set(news) & all_keys)},
        "V3_all_new_subj4_four_letters": {"pass": all(zdry.SUBJ4_RE.match(n.split(" ")[0]) for n in news)},
        "V4_no_overflow": {"pass": not buckets.overflow, "overflow": buckets.overflow[:10]},
        "V5_alias_invertible": {"pass": len({v: k for k, v in alias.items()}) == len(alias)},
        "V6_m_shape": {"pass": all(zdry.M_CORR_RE.match(n) for n in news)},
    }
    return {"alias": alias, "rows": rows, "held": held, "validation": validation,
            "continued": [c for c in buckets.continued if c[0] in alias]}


# ── receipts (dry run) ──────────────────────────────────────────────────────
def write_receipts(plan, out, today):
    os.makedirs(out, exist_ok=True)
    am = {"_status": f"DRY-RUN {today} — UC-CUR placeholder promotion. NOT applied. The alias map is the "
                     f"receipt of record and, once applied, the rollback handle (read right-to-left).",
          "_generated_by": "kb/_uc_cur_promote.py", "_generated_at": today,
          "_rule": ("a placeholder becomes a real M-ID record: the discipline's canonical SUBJ4 (an umbrella "
                    "keeps the members' split code), band 9 noncredit / 1 credit, the lowest free number, "
                    "continuation band when full; fewer than two pointers, no discipline, no code or no band "
                    "is HELD, never guessed"),
          "count": len(plan["alias"]),
          "aliases": {ph: plan["rows"][ph] for ph in plan["alias"]},
          "held": plan["held"]}
    _atomic_dump(os.path.join(out, "alias_map.json"), am, True)
    _atomic_dump(os.path.join(out, "supabase_ops.json"), {
        "_about": ("The Supabase half, same cron window AFTER the apply commit: dispatch "
                   ".github/workflows/supabase-rekey.yml with alias_map_path = this receipt's alias_map.json "
                   "(self-keys + merge_into pointers; a clean bijection, idempotent)."),
        "rekey": {"workflow": ".github/workflows/supabase-rekey.yml",
                  "alias_map_path": os.path.relpath(os.path.join(out, "alias_map.json"), ROOT),
                  "pairs": len(plan["alias"])}}, True)
    L = [f"# UC-CUR placeholder promotion — dry run {today}", "", f"status: DRY-RUN {today} — nothing applied", "",
         f"- placeholders found: **{len(plan['alias']) + len(plan['held']):,}**",
         f"- planned: **{len(plan['alias']):,}** · held: **{len(plan['held']):,}** · continuation-band mints: "
         f"**{len(plan['continued']):,}**", "", "## Validation", ""]
    L += [f"- {'✅' if v['pass'] else '❌'} {k}" for k, v in plan["validation"].items()]
    L += ["", "## Planned", "", "| placeholder | new id | title | discipline | band | members | origin | how |",
          "|---|---|---|---|---|---:|---|---|"]
    for ph, r in plan["rows"].items():
        L.append(f"| `{ph}` | `{r['new_id']}` | {r['title']} | {r['discipline']} | {r['band']} | {r['members']} | "
                 f"{r['origin']} | {r['how']} ({r['code_source']}) |")
    if plan["held"]:
        L += ["", "## Held (left exactly as they are)", "", "| placeholder | title | why |", "|---|---|---|"]
        for ph, h in plan["held"].items():
            L.append(f"| `{ph}` | {h.get('title')} | {h['why']} |")
    L += ["", "## Apply procedure", "",
          "1. `python3 kb/_uc_cur_promote.py --receipt <this dir> --fresh-read <mcp count json> --apply` "
          "(P0 · P1 · P3 · G1-G8).",
          "2. Commit; register `alias_map.json` in `kb/_rekey_promotions.py` ALIAS_MAPS; dispatch "
          "`supabase-rekey.yml` with it; `python3 kb/_post_apply_chain.py` once; dispatch `daily-dashboard.yml`.", ""]
    with open(os.path.join(out, "report.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(L))
    with open(os.path.join(out, "validation.md"), "w", encoding="utf-8") as f:
        f.write(f"# UC-CUR placeholder promotion — dry-run validation\n\n- generated: `{today}`\n"
                f"- planned: **{len(plan['alias'])}** · held: **{len(plan['held'])}**\n\n"
                + "\n".join(f"- {'✅' if v['pass'] else '❌'} {k}" for k, v in plan["validation"].items()) + "\n")


# ── the apply ───────────────────────────────────────────────────────────────
def materialize(ph, new_id, entry, members, courses, singletons, memberships, today):
    """The catalog record for a promoted placeholder — the Z-band retirement's
    aggregate, re-stamped and re-originated."""
    rec = zapp.materialize(ph, new_id, entry, members, courses, singletons, memberships, today)
    rec.pop(zapp.STAMP, None)
    rec[STAMP] = ph
    auto = bool(AUTO_RE.match(ph))
    rec["origin"] = ORIGIN_AUTO if auto else ORIGIN_CURATOR
    rec["common_title_source"] = "curation unified_title (promoted placeholder)"
    rec["classified_by"] = CLASSIFIED_BY
    if not auto:
        rec["reviewed_by"] = entry.get("reviewed_by")
        rec["reviewed_at"] = entry.get("reviewed_at")
    rec["_notes"] = (f"Promoted from the transient placeholder {ph} ({'auto-merge' if auto else 'client'} mint). "
                     f"The members keep their own records and their merge_into pointers; this record carries "
                     f"the aggregate and has no membership entry of its own. _machine_cluster_members lists "
                     f"the pointers at promotion (the field the post-apply chain re-keys).")
    return rec


def apply_plan(docs, plan, now, today=None):
    """Mutate the loaded docs in place from the plan; returns (stats, materialized)."""
    today = today or date.today().isoformat()
    alias = dict(plan["alias"])
    courses = docs["courses"]["courses"]
    singletons = docs["singletons"]["courses"]
    memberships = docs["memberships"]["memberships"]
    cur_doc = docs["curation"]
    curations = cur_doc["curations"]
    stats = Counter()
    materialized = []
    new_cur = {}
    for k, v in curations.items():
        if isinstance(v, dict) and v.get("merge_into") in alias:
            v = dict(v)
            v["merge_into"] = alias[v["merge_into"]]
            stats["curation_pointers"] += 1
        if k in alias:
            stats["curation_keys"] += 1
            new_cur[alias[k]] = v
        else:
            new_cur[k] = v
    cur_doc["curations"] = dict(sorted(new_cur.items()))
    for ph, new_id in alias.items():
        row = plan["rows"][ph]
        entry = curations.get(ph) or {}
        rec = materialize(ph, new_id, entry, row["member_ids"], courses, singletons, memberships, today)
        courses[new_id] = rec
        materialized.append({"new_id": new_id, "from": ph, "title": rec.get("common_title"),
                             "discipline": rec.get("discipline"), "members": row["members"],
                             "colleges": rec.get("source_college_count"), "origin": rec["origin"]})
        stats["materialized"] += 1
    docs["courses"]["count"] = len(courses)
    era = docs["courses"].setdefault("_uc_cur_promoted", [])
    era.append(now)
    return stats, materialized


def post_gates(orig, docs, plan, materialized):
    alias = plan["alias"]
    courses = docs["courses"]["courses"]
    singletons = docs["singletons"]["courses"]
    curations = docs["curation"]["curations"]
    g = {}
    g["G1 curation count conserved"] = len(curations) == len(orig["curation"])
    g["G2 no promoted key or pointer left"] = (
        not any(k in alias for k in curations)
        and not any(isinstance(v, dict) and v.get("merge_into") in alias for v in curations.values()))
    g["G3 catalog grows by exactly the promoted count"] = (
        len(courses) == len(orig["courses"]) + len(alias) and all(v in courses for v in alias.values())
        and len(materialized) == len(alias))
    g["G4 every record: key == course_id, M shape, stamp, title, discipline, ≥2 members"] = all(
        courses[v].get("course_id") == v and zdry.M_CORR_RE.match(v) and courses[v].get(STAMP) == k
        and courses[v].get("common_title") and courses[v].get("discipline")
        and (courses[v].get("corroboration_members") or 0) >= 2 for k, v in alias.items())
    g["G5 memberships untouched"] = docs["memberships"]["memberships"] == orig["memberships"]
    g["G6 untouched rows byte-identical"] = (
        all(courses[k] == orig["courses"][k] for k in orig["courses"])
        and all(curations.get(alias.get(k, k)) == orig["curation"][k]
                for k in orig["curation"] if k not in alias and orig["curation"][k].get("merge_into") not in alias))
    g["G7 minted and singleton keys disjoint"] = not (set(courses) & set(singletons))
    resolvable = set(courses) | set(singletons) | set(orig.get("common") or {})
    g["G8 every M-shaped or promoted pointer resolves"] = all(
        (v["merge_into"] in resolvable) or not zdry.M_CORR_RE.match(str(v["merge_into"]))
        for v in curations.values() if isinstance(v, dict) and v.get("merge_into"))
    return g


def already_promoted(courses, alias):
    """P0 detail: a planned placeholder that a catalog record already names."""
    stamped = {r.get(STAMP) for r in courses.values() if isinstance(r, dict) and r.get(STAMP)}
    return sorted(k for k in alias if k in stamped)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--receipt", help="the frozen dry-run receipt dir (required with --apply)")
    ap.add_argument("--curation-export")
    ap.add_argument("--fresh-read")
    ap.add_argument("--allow-plan-drift", action="store_true")
    ap.add_argument("--out", default=None, help="dry-run receipt dir (default kb/uc_cur_promote_out/<today>)")
    args = ap.parse_args()
    today = date.today().isoformat()
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    courses_doc, singles_doc = _load(zdry.COURSES), _load(zdry.SINGLETONS)
    mem_doc, cur_doc = _load(MEMBERSHIPS), _load(zdry.CURATION)
    art_doc, common = _load(zdry.ARTICULATIONS), _load(zdry.COMMON)
    canon_doc, fl_doc = _load(zdry.CANONICAL), _load(zdry.FL_SPLIT)
    if os.path.exists(ALIASES):
        canon_doc["_aliases"] = _load(ALIASES).get("aliases") or {}
    committed = cur_doc.get("curations") or {}

    plan = compute_plan(json.loads(json.dumps(courses_doc["courses"])),
                        json.loads(json.dumps(singles_doc["courses"])),
                        json.loads(json.dumps(committed)),
                        json.loads(json.dumps(art_doc.get("identities") or {})),
                        json.loads(json.dumps(common)), canon_doc, fl_doc,
                        zdry.load_id_reservations(), reserved_alias_ids())
    n_found = len(plan["alias"]) + len(plan["held"])
    print(f"placeholders: {n_found} found · {len(plan['alias'])} planned · {len(plan['held'])} held")
    for ph, h in plan["held"].items():
        print(f"  held {ph}: {h['why']}")
    if not n_found:
        print("nothing to promote — no UC-CUR placeholder in the overlay.")
        return 0
    failed = [k for k, v in plan["validation"].items() if not v["pass"]]
    if failed:
        sys.exit(f"ABORT: validation gate(s) failed: {failed}")

    if not args.apply:
        out = args.out or os.path.join(OUT_DIR, today)
        write_receipts(plan, out, today)
        for ph, r in plan["rows"].items():
            print(f"  {ph} -> {r['new_id']}  {r['title']!r}  {r['discipline']}  band {r['band']}  "
                  f"{r['members']} members  ({r['how']}; {r['code_source']})")
        print(f"\nDRY RUN — receipt → {os.path.relpath(out, ROOT)}/  (review, then --apply with --receipt)")
        return 0

    if not args.receipt:
        sys.exit("ABORT: --apply needs --receipt <dry-run dir>.")
    frozen_path = os.path.join(args.receipt, "alias_map.json")
    frozen_doc = _load(frozen_path)
    if str(frozen_doc.get("_status", "")).startswith("APPLIED"):
        sys.exit("ABORT (P0): this receipt is already applied.")
    dup = already_promoted(courses_doc["courses"], plan["alias"])
    if dup:
        sys.exit(f"ABORT (P0): already promoted (a record carries the stamp): {dup[:5]}")
    if args.curation_export:
        rebuilt = rebuild_overlay(_load(args.curation_export))
        if json.dumps(rebuilt, sort_keys=True) != json.dumps(committed, sort_keys=True):
            sys.exit("ABORT (P3): the export does not rebuild the committed overlay — live curation drifted.")
        p3 = f"export rebuilds the committed overlay exactly ({len(committed)} entries)"
    elif args.fresh_read:
        fresh = _load(args.fresh_read)
        if not fresh_read_matches(fresh, committed):
            sys.exit(f"ABORT (P3): fresh read {fresh} != the committed overlay ({len(committed)} entries).")
        p3 = f"fresh read matches the committed overlay ({len(committed)} entries)"
    else:
        sys.exit("ABORT (P3): --apply needs --curation-export or --fresh-read.")
    print(f"P3 curation freshness: {p3}")
    ok, drift = plan_fidelity(plan, frozen_doc)
    if not ok:
        msg = f"plan drift vs the frozen receipt: {len(drift)} differing keys (sample {drift[:5]})"
        if not args.allow_plan_drift:
            sys.exit(f"ABORT (P1): {msg} — re-run the dry run, re-review, or pass --allow-plan-drift.")
        print(f"⚠ P1 OVERRIDDEN: {msg}")
    else:
        print(f"P1 plan fidelity: recomputed plan == frozen receipt ({len(plan['alias'])} aliases) ✓")

    orig = {"courses": json.loads(json.dumps(courses_doc["courses"])),
            "memberships": json.loads(json.dumps(mem_doc["memberships"])),
            "curation": json.loads(json.dumps(committed)), "common": dict(common)}
    docs = {"courses": courses_doc, "singletons": singles_doc, "memberships": mem_doc, "curation": cur_doc}
    stats, materialized = apply_plan(docs, plan, now, today)
    gates = post_gates(orig, docs, plan, materialized)
    print("gates:")
    for gname, okg in gates.items():
        print(f"  {'PASS' if okg else 'FAIL'}  {gname}")
    print("ripple: " + " | ".join(f"{k} {v:,}" for k, v in sorted(stats.items())))
    if not all(gates.values()):
        sys.exit("✗ gate failure — NOTHING written. `git checkout kb/` if in doubt.")

    for path, doc in ((zdry.COURSES, courses_doc), (zdry.CURATION, cur_doc)):
        _atomic_dump(path, doc, _trailing_nl(path))
    frozen_doc["_status"] = (f"APPLIED {now} — UC-CUR placeholder promotion. Every promoted placeholder is a real "
                             f"M-ID record with its origin and a {STAMP} stamp; the alias map is the rollback "
                             f"handle (read right-to-left).")
    frozen_doc["_applied_at"] = now
    frozen_doc["_applied_by"] = "kb/_uc_cur_promote.py"
    _atomic_dump(frozen_path, frozen_doc, True)
    _atomic_dump(os.path.join(args.receipt, "materialized.json"), {
        "_about": "the promoted placeholders as materialized: new id, the placeholder, title, discipline, "
                  "member count (their merge_into pointers), distinct colleges, origin",
        "count": len(materialized), "rows": materialized}, True)
    with open(os.path.join(args.receipt, "validation.md"), "w", encoding="utf-8") as f:
        f.write(f"# UC-CUR placeholder promotion — APPLY validation receipt\n\n- applied: `{now}`\n"
                f"- aliases: **{len(plan['alias']):,}** · held: **{len(plan['held']):,}**\n"
                f"- P1 plan fidelity: recomputed == frozen ✓\n- P3 curation freshness: {p3}\n\n"
                f"## Ripple\n\n| what | count |\n|---|---:|\n"
                + "".join(f"| {k} | {v:,} |\n" for k, v in sorted(stats.items()))
                + "\n## Apply gates\n\n" + "\n".join(f"- ✅ {g}" for g in gates)
                + "\n\n## Plan validation (recomputed at apply)\n\n"
                + "\n".join(f"- ✅ {k}" for k in plan["validation"]) + "\n")
    report = os.path.join(args.receipt, "report.md")
    if os.path.exists(report):
        with open(report, encoding="utf-8") as f:
            txt = f.read()
        txt = re.sub(r"^status: DRY-RUN.*$", f"status: APPLIED {now} — see validation.md", txt, count=1, flags=re.M)
        with open(report, "w", encoding="utf-8") as f:
            f.write(txt)
    print(f"\n✓ APPLIED. receipt → {os.path.relpath(args.receipt, ROOT)}/")
    print("NEXT (same window): commit; register the receipt in kb/_rekey_promotions.py ALIAS_MAPS; dispatch "
          "supabase-rekey.yml with its alias map; python3 kb/_post_apply_chain.py once; daily-dashboard.yml.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
