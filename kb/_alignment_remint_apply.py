#!/usr/bin/env python3
"""The common-subject alignment re-mint, S749: the APPLY of the dry run kb/_alignment_remint_dryrun.py (Rule 7).

THE RULINGS. Sam via COBIx, 2026-11-28: re-mint every M-ID whose common code or discipline join changes under the new
alignment, once, in one pass (r-full-remint-for-new-joins-sam-2026-11-28); "fine on defaults" for the totals and every
conflict (r-remint-dryrun-defaults-sam-2026-11-28; COBIx agrees). 346 M-IDs: NUTR -> FDNT 320, AERO -> MILS 9 (Fresno's
Air Force ROTC), PHTC -> PHOT 4, PUBR -> PREL 1, TOUR -> TRVL 12. Aeronautics takes AERN with no M-ID. FLTR, HMEN,
CTZN, HLSN and DSPN are untouched. The apply is "in one PR. It contains the re-mint, the forwarding map, the receipt,
and tests that every old M-ID resolves and that no person-curated row changed without an OK."

WHAT IT WRITES, each through the writer that already owns the file, in the file's own order:
  identity files   kb/coci_minted_{courses,singletons,memberships}.json, kb/coci_articulations.json, kb/coci_curation.json
                   through kb/_eths_remint.py apply_plan (the re-mint writer): each key re-keyed where it stands, the
                   record stamped `_alignment_remint_from`; the overlay kept in key order, as kb/_apply_curation.py
                   writes it. Every pointer (merge_into, honors_of) at a moving id follows it.
  the NUTR fold    Dietetics/Nutritional Science leaves kb/discipline_canonical_subj4.json and becomes an alias of
                   Nutritional Science/Dietetics in kb/discipline_aliases.json (the file's way of recording a fold).
                   The nightly sync (kb/_apply_canonical_subj4.py) skips a `_CANON_SUBJ4::` row whose discipline the
                   file lacks, and the seeder (kb/_seed_canonical_subj4.py) builds entries from M-ID disciplines, so
                   neither brings it back.
  AERN             kb/_apply_minted_codes_s749.py, rerun now that AERO prefixes no M-ID, with its own receipt
                   kb/receipts/minted_codes_s749_aern.json; it changes Aeronautics alone (the gate refuses anything else).
  one pick         Fresno City College AEROST moves AERO -> MILS with its nine M-IDs (the dry run's picks edit), edited
                   on its own line so the file keeps its order.
  the receipt      kb/alignment_remint_out/2026-11-28/: alias_map.json (registered in kb/alias_chain.py ALIAS_MAPS),
                   rollback.json (every before-value this step overwrote), kb_curation_rows.json (the live rows the
                   migration moves, before and after), report.md.
  kb_curation      kb/migrations/2026-11-28_s749_remint_kb_curation_{preread,apply,rollback}.sql. Guarded UPDATEs on
                   rows whose reviewer_email ends @bot. Not in kb/migrations/.apply: the conductor runs the pre-read,
                   then the apply, after a second read.

GATES (each refuses before a byte is written, or rolls back what it wrote):
  P0  not applied yet: no record carries the stamp and the receipt holds no `_applied_at`.
  P1  the fresh plan equals the committed dry run (kb/remint_dryrun/s749_plan.json) and kb/mid_forwarding.csv, every
      dry-run gate passes, and no move waits on a yes or holds a person's row.
  P2  the re-key conserves every file's count, leaves nothing on an old id, keeps every articulation, and drops no
      identity entry.
  P3  the minted-code writer changes Aeronautics AERO -> AERN and nothing else.
  P4  no person-curated row changes except the five Sam OK'd (PERSON_OK).

Run (from the repo root):
  python3 kb/_alignment_remint_apply.py --apply      # the apply; then register the receipt, run the chain
  python3 kb/_alignment_remint_apply.py --rollback   # puts back every byte the apply step wrote (git revert does the rest)
After --apply: python3 kb/_post_apply_chain.py, then --rekey-skyview and --rekey-generated, then the builders
scripts/check_generated.sh names. After the merge, in one cron window: the pre-read, the migration, daily-dashboard.yml.
"""
import argparse
import csv
import io
import json
import os
import sys
from collections import Counter
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import _alignment_remint_dryrun as ar  # noqa: E402  (compute_plan, SCOPES, forwarding_rows, render_forwarding)
import _apply_minted_codes_s749 as mc  # noqa: E402  (the seed's code writer)
import _authority_recode_dryrun as rec  # noqa: E402  (load_id_reservations)
import _eths_remint as er  # noqa: E402  (apply_plan, post_gates, FILES, dump, ever_minted_ids, skyview_ids, rekey_skyview)
import subject_decisions as sd  # noqa: E402  (canonical_codes, discipline_aliases: how a filing resolves)
from _flags import is_person  # noqa: E402
from curation_pointers import POINTER_FIELDS  # noqa: E402

DATE = "2026-11-28"
STAMP = "_alignment_remint_from"
RULINGS = "r-full-remint-for-new-joins-sam-2026-11-28; r-remint-dryrun-defaults-sam-2026-11-28"
COHORT = "remint-s749"
FOLD_FROM, FOLD_INTO = "Dietetics/Nutritional Science", "Nutritional Science/Dietetics"
AERN_DISCIPLINE, AERN_FROM, AERN_TO = "Aeronautics", "AERO", "AERN"
# The picks edit the dry run named (Sam's "fine on defaults"): the pick follows its nine M-IDs to Military Studies.
PICK_EDITS = [{"file": "kb/subject_title_hunt/20261128_common_picks_slate2.csv", "college": "Fresno City College",
               "local_subject_code": "AEROST", "band": "credit", "from": "AERO", "to": "MILS",
               "basis": "M-ID MILS (the nine Air Force ROTC M-IDs moved from AERO in the S749 re-mint)"}]
# The person-curated rows this apply changes, each OK'd by Sam on 2026-11-28 (r-remint-dryrun-defaults-sam-2026-11-28,
# the dry run's yes/no list, items 1 and 2: "yes, all 320"). map@rccd.edu's NUTR override on Dietetics/Nutritional
# Science leaves with the discipline, and the four local codes a reviewer filed under it on 2026-11-24 follow the fold
# to FDNT. Nothing else a person curated may change (P4).
PERSON_OK = ("seed:Dietetics/Nutritional Science", "filing:_SUBJ_DISC::NF", "filing:_SUBJ_DISC::NUTR",
             "filing:_SUBJ_DISC::NUTRI", "filing:_SUBJ_DISC::NUTRTN")
SEED_OWNED = ("canonical_subj4", "source", "_notes", "reviewed_at", "reviewed_by", "validated_at", "validated_by",
              "umbrella_codes", "fan_in_with")
MIGRATION = "2026-11-28_s749_remint_kb_curation"


def paths(root=ROOT):
    kb = os.path.join(root, "kb")
    out = os.path.join(kb, "alignment_remint_out", DATE)
    return {"root": root, "kb": kb, "out": out, "receipt": os.path.join(out, "alias_map.json"),
            "rollback": os.path.join(out, "rollback.json"), "rows": os.path.join(out, "kb_curation_rows.json"),
            "report": os.path.join(out, "report.md"),
            "seed": os.path.join(kb, "discipline_canonical_subj4.json"),
            "aliases": os.path.join(kb, "discipline_aliases.json"),
            "minted_receipt": os.path.join(kb, "receipts", "minted_codes_s749.json"),
            "aern_receipt": os.path.join(kb, "receipts", "minted_codes_s749_aern.json"),
            "minted_csv": os.path.join(kb, "subject_title_hunt", "minted_codes.csv"),
            "decisions": os.path.join(kb, "status", "subject_decisions.json"),
            "plan": os.path.join(kb, "remint_dryrun", "s749_plan.json"),
            "forwarding": os.path.join(kb, "mid_forwarding.csv"),
            "migrations": os.path.join(kb, "migrations")}


def load(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


def write(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)


def rel(p, path):
    return os.path.relpath(path, p["root"]).replace(os.sep, "/")


# ── the plan ─────────────────────────────────────────────────────────────────
def fresh_plan(p, docs):
    """The dry run's plan, recomputed now from the files under p['root'] (the dry run's own compute_plan)."""
    with open(p["minted_csv"], encoding="utf-8") as f:
        minted = list(csv.DictReader(f))
    return ar.compute_plan(docs["courses"]["courses"], docs["singletons"]["courses"], docs["curation"]["curations"],
                           docs["memberships"]["memberships"], load(p["seed"])["disciplines"],
                           load(p["minted_receipt"]), load(p["aliases"]), load(p["decisions"]),
                           ar.load_picks(p["root"]), rec.load_id_reservations(), vacated=er.ever_minted_ids(),
                           drawn=er.skyview_ids(p["root"]), minted=minted)


def plan_gates(fresh, committed, forwarding_text):
    """P1: the fresh plan is the reviewed dry run, row for row."""
    bad = [k for k, v in fresh["validation"].items() if not v.get("pass")]
    waiting = sorted(k for k, v in fresh["moves"].items() if v["status"] not in ("approved", "planned"))
    return {"P1_matches_the_dry_run": {"pass": fresh["alias"] == committed.get("alias")
                                       and forwarding_text == ar.render_forwarding(fresh),
                                       "fresh": len(fresh["alias"]), "committed": len(committed.get("alias") or {})},
            "P1_dry_run_gates_pass": {"pass": not bad, "failing": bad},
            "P1_every_move_answered": {"pass": not waiting, "waiting": waiting[:10]}}


# ── person-curated rows ─────────────────────────────────────────────────────
def person_rows(seed_doc, aliases_doc, curations, decisions):
    """{key: value} for every person-curated row the apply could touch: a seed entry a person reviewed (its owned
    fields), a person's overlay entry, and each statewide filing with the common code it resolves to."""
    out = {}
    for d, e in (seed_doc.get("disciplines") or {}).items():
        if is_person(e.get("reviewed_by")) or is_person(e.get("validated_by")):
            out["seed:" + d] = {k: e.get(k) for k in SEED_OWNED}
    for k, e in curations.items():
        if isinstance(e, dict) and (is_person(e.get("reviewed_by")) or is_person(e.get("validated_by"))):
            out["curation:" + k] = e
    _, by_disc = sd.canonical_codes(seed_doc)
    folded = {a: d for d, names in (aliases_doc.get("aliases") or {}).items() for a in names or []}
    for s in decisions.get("statewide") or []:
        disc = (s.get("discipline") or "").strip()
        if disc not in by_disc and folded.get(disc) in by_disc:
            disc = folded[disc]
        out["filing:" + str(s.get("key"))] = {"code": s.get("code"), "filed": s.get("discipline"),
                                              "common": by_disc.get(disc)}
    return out


def person_changes(before, after):
    return sorted(k for k in set(before) | set(after) if before.get(k) != after.get(k))


# ── the re-key ───────────────────────────────────────────────────────────────
def rekey(docs, plan):
    """The identity re-key through kb/_eths_remint.py apply_plan, in memory. -> (docs, counts, rollback parts)."""
    alias = plan["alias"]
    shim = {"alias": alias, "moves": {k: {"discipline": plan["moves"][k]["discipline_after"]} for k in alias}}
    records = {}
    for name in ("courses", "singletons"):
        for k, r in docs[name]["courses"].items():
            if k in alias:
                records[alias[k]] = {"source": name, "old_id": k,
                                     "before": {f: r[f] for f in ("course_id", "subject_4letter", "discipline") if f in r},
                                     "absent": [f for f in ("course_id", "subject_4letter", "discipline") if f not in r]}
    cur = docs["curation"]["curations"]
    was_sorted = list(cur) == sorted(cur)
    pointers = [[alias.get(k, k), f, e[f], alias[e[f]]] for k, e in cur.items() if isinstance(e, dict)
                for f in POINTER_FIELDS if isinstance(e.get(f), str) and e[f] in alias]
    arts = [i for i, a in enumerate(docs["articulations"].get("articulations", [])) if a.get("course_id") in alias]
    idents = [alias[k] for k in (docs["articulations"].get("identities") or {}) if k in alias]
    mem = [alias[k] for k in docs["memberships"]["memberships"] if k in alias]
    saved, er.STAMP = er.STAMP, STAMP
    try:
        docs, counts = er.apply_plan(docs, shim)
    finally:
        er.STAMP = saved
    if was_sorted:                                   # kb/_apply_curation.py writes the overlay in key order
        docs["curation"]["curations"] = dict(sorted(docs["curation"]["curations"].items()))
    return docs, counts, {"records": records, "memberships": mem, "articulations": arts, "identities": idents,
                          "curation": {"keys": {alias[k]: k for k in cur if k in alias}, "pointers": pointers,
                                       "was_sorted": was_sorted}}


def fold_seed(seed_doc, aliases_doc):
    """The NUTR fold in memory: the discipline leaves the seed, its name joins the aliases. -> before-values."""
    D = seed_doc["disciplines"]
    names = list(D)
    before = {"index": names.index(FOLD_FROM), "entry": D[FOLD_FROM],
              "counts": json.loads(json.dumps(seed_doc.get("_counts")))}
    seed_doc["disciplines"] = {d: e for d, e in D.items() if d != FOLD_FROM}
    if isinstance(seed_doc.get("_counts"), dict) and "total_disciplines" in seed_doc["_counts"]:
        seed_doc["_counts"]["total_disciplines"] = len(seed_doc["disciplines"])
    al = aliases_doc.setdefault("aliases", {})
    if FOLD_FROM not in al.get(FOLD_INTO, []):
        al.setdefault(FOLD_INTO, []).append(FOLD_FROM)
    return before


def edit_picks(p, edits=PICK_EDITS):
    """Each pick edited on its own line; every other byte of the file stays. -> before/after lines."""
    done = []
    for e in edits:
        path = os.path.join(p["root"], e["file"])
        lines = read(path).splitlines(keepends=True)
        hit = None
        for i, line in enumerate(lines):
            row = next(csv.reader([line]))
            if len(row) >= 7 and row[0] == e["college"] and row[1] == e["local_subject_code"] and row[2] == e["band"]:
                hit = i
                break
        if hit is None:
            raise SystemExit(f"APPLY BLOCKED - the pick {e['college']} {e['local_subject_code']} is not in {e['file']}")
        row = next(csv.reader([lines[hit]]))
        if row[3] != e["from"]:
            raise SystemExit(f"APPLY BLOCKED - {e['file']}:{hit + 1} names {row[3]}, not {e['from']}")
        row[3], row[6] = e["to"], e["basis"]
        buf = io.StringIO()
        csv.writer(buf, lineterminator="").writerow(row)
        new = buf.getvalue() + lines[hit][len(lines[hit].rstrip("\r\n")):]
        done.append({"file": e["file"], "line": hit + 1, "before": lines[hit], "after": new})
        lines[hit] = new
        write(path, "".join(lines))
    return done


def run_minted_writer(p, receipt_path, apply_it):
    """kb/_apply_minted_codes_s749.py pointed at p's files. -> (change, held)."""
    keep = {k: getattr(mc, k) for k in ("ROOT", "CANON", "ALIASES", "MINTED", "MINTS", "SINGLETONS", "RECEIPT")}
    mc.ROOT, mc.CANON, mc.ALIASES, mc.MINTED = p["root"], p["seed"], p["aliases"], p["minted_csv"]
    mc.MINTS = os.path.join(p["kb"], "coci_minted_courses.json")
    mc.SINGLETONS = os.path.join(p["kb"], "coci_minted_singletons.json")
    mc.RECEIPT = p["minted_receipt"]
    try:
        _doc, change, held, add = mc.plan()
        if apply_it:
            with open(os.devnull, "w") as dn:
                out, sys.stdout = sys.stdout, dn
                try:
                    mc.main(["--apply", "--receipt", rel(p, receipt_path)])
                finally:
                    sys.stdout = out
        return change, held, add
    finally:
        for k, v in keep.items():
            setattr(mc, k, v)


# ── kb_curation: the migration ──────────────────────────────────────────────
def curation_rows(curations, alias):
    """The live rows the migration moves, read from the committed overlay (the nightly sync's fold of kb_curation):
    every overlay field on a moving id, and every pointer at one. -> [{course_id, field, value, new_course_id,
    new_value}] (before -> after)."""
    rows = []
    for k, e in sorted(curations.items()):
        if not isinstance(e, dict):
            continue
        for f, v in e.items():
            if f.startswith(("reviewed", "validated")) or f == "ruling":
                continue
            val = v if isinstance(v, str) else json.dumps(v)
            moved_key = k in alias
            moved_val = f in POINTER_FIELDS and val in alias
            if moved_key or moved_val:
                # `by`: the overlay's reviewer (an honors_of row restamps nothing, so it shows none; the migration's
                # guard reads the live reviewer_email).
                rows.append({"course_id": k, "field": f, "value": val, "new_course_id": alias.get(k, k),
                             "new_value": alias[val] if moved_val else val,
                             "by": None if f == "honors_of" else e.get("reviewed_by")})
    return rows


def q(s):
    return "'" + str(s).replace("'", "''") + "'"


def sql_values(rows, cols):
    return ",\n".join("  (" + ", ".join(q(r[c]) for c in cols) + ")" for r in rows)


def migration_sql(alias, rows, receipt_rel, rows_rel):
    """-> {preread, apply, rollback}: three SQL texts, each one statement returning one JSON value."""
    n = len(rows)
    m = sql_values([{"o": o, "n": v} for o, v in sorted(alias.items())], ("o", "n"))
    v = sql_values(rows, ("course_id", "field", "value", "new_course_id", "new_value"))
    ptr = ", ".join(q(f) for f in POINTER_FIELDS)
    head = (f"-- S749: the common-subject alignment re-mint's kb_curation half (r-full-remint-for-new-joins-sam-2026-11-28,\n"
            f"-- r-remint-dryrun-defaults-sam-2026-11-28). {len(alias)} M-IDs move ({receipt_rel}); the {n} rows below sit on a\n"
            f"-- moving id or point at one (merge_into, honors_of), every one written by an @bot cohort in the committed\n"
            f"-- overlay. Before and after per row: {rows_rel}. NOT in kb/migrations/.apply.\n")
    ctes = (f"with m(old_id, new_id) as (values\n{m}),\n"
            f"v(course_id, field, value, new_course_id, new_value) as (values\n{v}),\n"
            f"t as (select k.course_id, k.field, k.value, k.reviewer_email from public.kb_curation k\n"
            f"       where k.course_id in (select old_id from m)\n"
            f"          or (k.field in ({ptr}) and k.value in (select old_id from m))),\n"
            f"g as (select (select count(*) from t where coalesce(t.reviewer_email, '') not like '%@bot') as person_n,\n"
            f"             (select count(*) from t where not exists (select 1 from v where v.course_id = t.course_id\n"
            f"                and v.field = t.field and v.value = t.value)) as unplanned_n,\n"
            f"             (select count(*) from public.kb_curation k where k.course_id in (select new_id from m)) as landing_n,\n"
            f"             (select count(*) from t) as touching_n)")
    pre = (head + "-- Pre-read, read-only: one SELECT, one JSON value. Run it just before the apply; `go` must be true.\n"
           + ctes + ",\n"
           "list as (select\n"
           "  (select coalesce(json_agg(json_build_object('course_id', t.course_id, 'field', t.field, 'by', t.reviewer_email)\n"
           "          order by t.course_id, t.field), '[]'::json) from t where coalesce(t.reviewer_email, '') not like '%@bot') as person_rows,\n"
           "  (select coalesce(json_agg(json_build_object('course_id', t.course_id, 'field', t.field, 'value', t.value,\n"
           "          'by', t.reviewer_email) order by t.course_id, t.field), '[]'::json) from t where not exists (select 1 from v\n"
           "          where v.course_id = t.course_id and v.field = t.field and v.value = t.value)) as unplanned,\n"
           "  (select coalesce(json_agg(json_build_object('course_id', v.course_id, 'field', v.field) order by v.course_id, v.field),\n"
           "          '[]'::json) from v where not exists (select 1 from t where t.course_id = v.course_id and t.field = v.field\n"
           "          and t.value = v.value)) as missing,\n"
           "  (select coalesce(json_agg(json_build_object('course_id', k.course_id, 'field', k.field, 'value', k.value,\n"
           "          'by', k.reviewer_email) order by k.course_id, k.field), '[]'::json) from public.kb_curation k\n"
           "          where k.course_id in ('_CANON_SUBJ4::Aeronautics', '_CANON_SUBJ4::Dietetics/Nutritional Science')) as code_rows)\n"
           f"select json_build_object('planned', {n}, 'touching', g.touching_n, 'person_rows', list.person_rows,\n"
           "       'unplanned', list.unplanned, 'missing', list.missing, 'landing', g.landing_n, 'code_rows', list.code_rows,\n"
           f"       'go', g.person_n = 0 and g.unplanned_n = 0 and g.landing_n = 0 and g.touching_n = {n})\n"
           "  from g, list;\n")
    app = (head + "-- Guarded UPDATE, one statement. It aborts, writing nothing, when a person's row touches a moving id, a row\n"
           "-- the plan does not name touches one, a row already sits on a new id, or the UPDATE matches other than the\n"
           f"-- plan's {n} rows. course_id and value change; reviewer_email and reviewed_at stay.\n"
           + ctes + ",\n"
           "u as (update public.kb_curation k\n"
           "         set course_id = v.new_course_id, value = v.new_value\n"
           "        from v, g\n"
           "       where g.person_n = 0 and g.unplanned_n = 0 and g.landing_n = 0\n"
           "         and k.course_id = v.course_id and k.field = v.field and k.value = v.value\n"
           "         and k.reviewer_email like '%@bot'\n"
           "      returning k.course_id, k.field),\n"
           "s as (select count(*) as n from u)\n"
           "select case when g.person_n > 0 then ('s749 re-mint guard: ' || g.person_n || ' person rows touch a moving id')::int::text::json\n"
           "            when g.unplanned_n > 0 then ('s749 re-mint guard: ' || g.unplanned_n || ' rows the plan does not name')::int::text::json\n"
           "            when g.landing_n > 0 then ('s749 re-mint guard: ' || g.landing_n || ' rows already on a new id')::int::text::json\n"
           f"            when s.n = {n} then json_build_object('updated', s.n, 'cohort_untouched', 'reviewer_email and reviewed_at kept')\n"
           f"            else ('s749 re-mint guard: the UPDATE matched ' || s.n || ' rows, the plan names {n}')::int::text::json end as returned\n"
           "  from g, s;\n")
    # Second reader (S749, S752): the rollback also aborts when a person row sits on, or points at (merge_into, honors_of),
    # any of the moved ids' new ids, which a
    # revert would strand. The new ids are the receipt's own (alias_map.json), read here so the SQL stays derived.
    _am = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "kb", "alignment_remint_out", "2026-11-28", "alias_map.json")
    _new = sorted({x["new_id"] for x in json.load(open(_am, encoding="utf-8"))["aliases"].values()}) if os.path.exists(_am) else []
    _w = ", ".join("('%s')" % i for i in _new) or "(NULL)"
    back = (head + "-- Rollback, NOT applied: each row back to its before-value, where it still holds the after-value. It aborts,\n"
            "-- writing nothing, when a row sits on an old id again or the UPDATE matches other than the plan's rows. Pair it with\n"
            "-- `git revert` of the land. It also aborts when a person has saved a row on any of the 346 new ids since the apply\n"
            "-- (second reader, S749): those rows would be stranded on an id the revert takes away.\n"
            f"with v(course_id, field, value, new_course_id, new_value) as (values\n{v}),\n"
            f"w(new_id) as (values {_w}),\n"
            "p as (select count(*) as person_n from public.kb_curation k where (k.course_id in (select new_id from w)\n"
            "         or (k.field in ('merge_into', 'honors_of') and k.value in (select new_id from w)))\n"
            "         and coalesce(k.reviewer_email, '') not like '%@bot'),\n"
            "g as (select count(*) as back_n from public.kb_curation k where k.course_id in (select course_id from v)\n"
            "         and k.course_id <> all (select new_course_id from v)),\n"
            "u as (update public.kb_curation k\n"
            "         set course_id = v.course_id, value = v.value\n"
            "        from v, g, p\n"
            "       where g.back_n = 0 and p.person_n = 0 and k.course_id = v.new_course_id and k.field = v.field and k.value = v.new_value\n"
            "         and k.reviewer_email like '%@bot'\n"
            "      returning k.course_id, k.field),\n"
            "s as (select count(*) as n from u)\n"
            "select case when p.person_n > 0 then ('s749 rollback guard: ' || p.person_n || ' person rows sit on a new id; rolling back would strand them')::int::text::json\n"
            "            when g.back_n > 0 then ('s749 rollback guard: ' || g.back_n || ' rows already on an old id')::int::text::json\n"
            f"            when s.n = {n} then json_build_object('restored', s.n)\n"
            f"            else ('s749 rollback guard: the UPDATE matched ' || s.n || ' rows, the plan names {n}')::int::text::json end as returned\n"
            "  from g, s, p;\n")
    return {"preread": pre, "apply": app, "rollback": back}


# ── apply ────────────────────────────────────────────────────────────────────
def applied(p, docs=None):
    if os.path.exists(p["receipt"]) and load(p["receipt"]).get("_applied_at"):
        return True
    docs = docs or er.load_docs(p["kb"])
    return any(r.get(STAMP) for n in ("courses", "singletons") for r in docs[n]["courses"].values())


def apply(p, at=None, plan=None):
    """The apply on the files under p['root']. Returns the receipt; raises SystemExit on a gate."""
    at = at or datetime.now(timezone.utc).isoformat(timespec="seconds")
    docs = er.load_docs(p["kb"])
    if applied(p, docs):
        raise SystemExit("APPLY BLOCKED - P0: the re-mint is applied already (stamp or receipt present)")
    committed = load(p["plan"])
    plan = plan or fresh_plan(p, docs)
    gates = plan_gates(plan, committed, read(p["forwarding"]))
    bad = [k for k, v in gates.items() if not v["pass"]]
    if bad:
        raise SystemExit("APPLY BLOCKED - " + json.dumps({k: gates[k] for k in bad})[:800])
    seed_doc, aliases_doc, decisions = load(p["seed"]), load(p["aliases"]), load(p["decisions"])
    before_person = person_rows(seed_doc, aliases_doc, docs["curation"]["curations"], decisions)
    before_text = {n: read(os.path.join(p["kb"], f)) for n, f in er.FILES.items()}
    before_docs = {n: json.loads(t) for n, t in before_text.items()}
    pre_art = sum(1 for a in before_docs["articulations"].get("articulations", []) if a.get("course_id") in plan["alias"])
    rows = curation_rows(before_docs["curation"]["curations"], plan["alias"])
    docs, counts, rb = rekey(docs, plan)
    shim = {"alias": plan["alias"], "moves": {k: {"discipline": plan["moves"][k]["discipline_after"]} for k in plan["alias"]}}
    post = er.post_gates(before_docs, docs, shim, pre_art)
    post["P2_no_identity_dropped"] = {"pass": not counts.get("identities_stale_dropped")}
    bad = [k for k, v in post.items() if not v.get("pass")]
    if bad:
        raise SystemExit("APPLY BLOCKED - " + json.dumps({k: post[k] for k in bad})[:800])
    gates.update(post)

    # Every check that needs nothing written has passed. Write, then check what the writers did; a failed check rolls back.
    seed_text, aliases_text = read(p["seed"]), read(p["aliases"])
    rb["seed"] = fold_seed(seed_doc, aliases_doc)
    rb["seed"]["aeronautics"] = json.loads(json.dumps(seed_doc["disciplines"][AERN_DISCIPLINE]))
    rb["aliases_before"] = load(p["aliases"])
    rb["aern_receipt"] = rel(p, p["aern_receipt"])
    rb["aern_receipt_existed"] = os.path.exists(p["aern_receipt"])
    for name, f in er.FILES.items():
        er.dump(os.path.join(p["kb"], f), docs[name])
    er.dump(p["seed"], seed_doc)
    er.dump(p["aliases"], aliases_doc)
    receipt = {"_status": "S749 common-subject alignment re-mint old->new alias (receipt + rollback inverse) - APPLIED",
               "_applied_at": at, "_rulings": RULINGS, "_scopes": sorted(ar.SCOPES), "_stamp": STAMP,
               "_count": len(plan["alias"]), "_dry_run": rel(p, p["plan"]), "_forwarding": rel(p, p["forwarding"]),
               "aliases": {k: {"new_id": v, "scope": plan["moves"][k]["scope"],
                               "discipline_before": plan["moves"][k]["discipline_before"],
                               "discipline_after": plan["moves"][k]["discipline_after"]}
                           for k, v in sorted(plan["alias"].items())}}
    try:
        change, held, add = run_minted_writer(p, p["aern_receipt"], apply_it=False)
        want = [(AERN_DISCIPLINE, AERN_FROM, AERN_TO)]
        got = [(c["discipline"], c["from"], c["to"]) for c in change]
        if got != want or add:
            raise SystemExit(f"APPLY BLOCKED - P3: the minted-code writer would change {got} and add {add}, not {want} alone")
        run_minted_writer(p, p["aern_receipt"], apply_it=True)
        rb["picks"] = edit_picks(p)
        after_person = person_rows(load(p["seed"]), load(p["aliases"]), docs["curation"]["curations"], decisions)
        changed = person_changes(before_person, after_person)
        gates["P3_aern_alone"] = {"pass": True, "changed": got}
        gates["P4_person_rows_only_the_ok_list"] = {"pass": set(changed) <= set(PERSON_OK), "changed": changed,
                                                    "outside_the_ok_list": sorted(set(changed) - set(PERSON_OK))}
        if not gates["P4_person_rows_only_the_ok_list"]["pass"]:
            raise SystemExit("APPLY BLOCKED - P4: " + json.dumps(gates["P4_person_rows_only_the_ok_list"])[:800])
    except SystemExit:
        restore(p, rb, before_text=before_text, seed_text=seed_text, aliases_text=aliases_text)
        raise
    receipt["_counts"] = dict(counts)
    receipt["_person_rows_changed"] = changed
    receipt["_person_ok"] = list(PERSON_OK)
    receipt["_gates"] = {k: v.get("pass") for k, v in gates.items()}
    receipt["_kb_curation_rows"] = len(rows)
    receipt["_migration"] = f"kb/migrations/{MIGRATION}_{{preread,apply,rollback}}.sql"
    os.makedirs(p["out"], exist_ok=True)
    er.dump(p["receipt"], receipt)
    er.dump(p["rollback"], {"_what": "Every before-value the S749 re-mint apply overwrote; kb/_alignment_remint_apply.py "
                                     "--rollback restores those bytes. git revert of the land restores the rest.",
                            "_at": at, **rb})
    er.dump(p["rows"], {"_what": "The kb_curation rows the S749 migration moves, before (course_id, value) and after "
                                 "(new_course_id, new_value), read from the committed overlay.", "_at": at,
                        "count": len(rows), "rows": rows})
    sql = migration_sql(plan["alias"], rows, rel(p, p["receipt"]), rel(p, p["rows"]))
    for kind, text in sql.items():
        write(os.path.join(p["migrations"], f"{MIGRATION}_{kind}.sql"), text)
    write(p["report"], report(receipt, rb, rows, gates))
    return receipt


def restore(p, rb, before_text=None, seed_text=None, aliases_text=None):
    """Put back what the apply step wrote. With the texts in hand (a failed gate) it writes them back as they were;
    from the receipt alone (--rollback) it rebuilds them from the before-values."""
    for e in reversed(rb.get("picks") or []):
        path = os.path.join(p["root"], e["file"])
        lines = read(path).splitlines(keepends=True)
        if lines[e["line"] - 1] == e["after"]:
            lines[e["line"] - 1] = e["before"]
            write(path, "".join(lines))
    aern = os.path.join(p["root"], rb["aern_receipt"]) if rb.get("aern_receipt") else None
    if aern and os.path.exists(aern) and not rb.get("aern_receipt_existed"):
        os.remove(aern)
    if seed_text is not None:
        write(p["seed"], seed_text)
        write(p["aliases"], aliases_text)
    else:
        doc = load(p["seed"])
        D = doc["disciplines"]
        if "aeronautics" in rb["seed"]:
            D[AERN_DISCIPLINE] = rb["seed"]["aeronautics"]
        items = [(d, e) for d, e in D.items() if d != FOLD_FROM]
        items.insert(rb["seed"]["index"], (FOLD_FROM, rb["seed"]["entry"]))
        doc["disciplines"] = dict(items)
        doc["_counts"] = rb["seed"]["counts"]
        er.dump(p["seed"], doc)
        er.dump(p["aliases"], rb["aliases_before"])
    if before_text is not None:
        for name, f in er.FILES.items():
            write(os.path.join(p["kb"], f), before_text[name])
        return
    docs = er.load_docs(p["kb"])
    back = {}
    for new, r in rb["records"].items():
        back[new] = r["old_id"]
    for name in ("courses", "singletons"):
        out = {}
        for k, r in docs[name]["courses"].items():
            info = rb["records"].get(k)
            if info and info["source"] == name:
                r = dict(r)
                r.update(info["before"])
                for f in info["absent"]:
                    r.pop(f, None)
                r.pop(STAMP, None)
                out[info["old_id"]] = r
            else:
                out[k] = r
        docs[name]["courses"] = out
    docs["memberships"]["memberships"] = {back.get(k, k) if k in rb["memberships"] else k: v
                                          for k, v in docs["memberships"]["memberships"].items()}
    arts = docs["articulations"].get("articulations", [])
    for i in rb["articulations"]:
        arts[i]["course_id"] = back[arts[i]["course_id"]]
    ident = docs["articulations"].get("identities")
    if isinstance(ident, dict):
        docs["articulations"]["identities"] = {back[k] if k in rb["identities"] else k: v for k, v in ident.items()}
    c = rb["curation"]
    cur = docs["curation"]["curations"]
    for key_after, f, old, new in c["pointers"]:
        e = cur.get(key_after)
        if isinstance(e, dict) and e.get(f) == new:
            e[f] = old
    cur = {c["keys"].get(k, k): v for k, v in cur.items()}
    docs["curation"]["curations"] = dict(sorted(cur.items())) if c["was_sorted"] else cur
    for name, f in er.FILES.items():
        er.dump(os.path.join(p["kb"], f), docs[name])


def payload_disciplines(receipt, path):
    """After the token re-key, each moved row in the catalog payload carries the discipline its record now holds, as
    the daily generator would write it. The payload filled a discipline-less AERO row from its prefix (Aviation,
    `dsrc` subject_map_edge); on MILS that fill neither holds nor re-derives (tests/discipline_edge_fill_test.py). The
    file is written back in its own serialization (it round-trips through json.dumps). -> rows changed."""
    if not os.path.exists(path):
        return 0
    src = read(path)
    j = src.index("=", src.index("window.")) + 1
    body = src[j:].strip().rstrip(";")
    doc = json.loads(body)
    if json.dumps(doc, ensure_ascii=False) != body:
        raise SystemExit(f"{path} does not round-trip through json.dumps; left as it is")
    after = {v["new_id"]: v.get("discipline_after") for v in receipt["aliases"].values()}
    n = 0
    for row in doc.get("rows") or []:
        d = after.get(row.get("id"))
        if d and row.get("disc") != d:
            row["disc"] = d
            if row.get("dsrc") == "subject_map_edge":
                row.pop("dsrc")
            n += 1
    if n:
        write(path, src[:j] + src[j:].replace(body, json.dumps(doc, ensure_ascii=False), 1))
    return n


def rollback(p):
    if not os.path.exists(p["rollback"]):
        raise SystemExit("no rollback receipt at " + rel(p, p["rollback"]))
    restore(p, load(p["rollback"]))


def report(receipt, rb, rows, gates):
    by = Counter(v["scope"] for v in receipt["aliases"].values())
    L = [f"# The common-subject alignment re-mint (S749): APPLIED {receipt['_applied_at'][:10]}", "",
         f"The rulings: {RULINGS} (Sam via COBIx, 2026-11-28). The dry run is kb/remint_dryrun/s749_report.md; this "
         "apply reproduces its plan row for row (P1).", "", "## Gates", ""]
    L += [f"- **{k}**: {'pass' if v else 'FAIL'}" for k, v in receipt["_gates"].items()]
    L += ["", f"## Moves: {receipt['_count']} M-IDs", "", "| Scope | Ids |", "|---|---|"]
    L += [f"| {s} | {n} |" for s, n in sorted(by.items())]
    L += ["", "## Counts", "", "```", json.dumps(receipt["_counts"], indent=1), "```", "",
          "## Person-curated rows that changed (Sam's OK list)", ""]
    L += [f"- {k}" for k in receipt["_person_rows_changed"]] or ["- none"]
    L += ["", "## Beside the re-key", "",
          f"- The NUTR fold: {FOLD_FROM} left kb/discipline_canonical_subj4.json (it stood at position "
          f"{rb['seed']['index'] + 1}) and is an alias of {FOLD_INTO} in kb/discipline_aliases.json.",
          f"- {AERN_DISCIPLINE}: {AERN_FROM} -> {AERN_TO} through kb/_apply_minted_codes_s749.py "
          f"(receipt {rb['aern_receipt']}).",
          *[f"- The pick {e['file']}:{e['line']}: `{e['before'].strip()}` -> `{e['after'].strip()}`" for e in rb["picks"]],
          "", f"## kb_curation: {len(rows)} rows", "",
          f"Every row is an @bot cohort's in the committed overlay. Migration: `{receipt['_migration']}`; before and "
          "after per row: `kb_curation_rows.json`. The conductor runs the pre-read, then the apply after a second read; "
          "it is not in kb/migrations/.apply.", "",
          "## Rollback", "",
          "1. `git revert` of the land, which takes the receipt out of ALIAS_MAPS with everything the chain rebuilt.",
          "2. Or, before the chain runs, `python3 kb/_alignment_remint_apply.py --rollback`: every byte the apply step wrote.",
          f"3. kb_curation: `kb/migrations/{MIGRATION}_rollback.sql`, in the same cron window.", ""]
    return "\n".join(L)


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--rollback", action="store_true")
    ap.add_argument("--rekey-skyview", action="store_true", help="after the apply: SkyView's hand-built layout")
    ap.add_argument("--rekey-generated", action="store_true", help="after the apply: the generated payloads, token for token")
    args = ap.parse_args(argv)
    p = paths()
    if args.rollback:
        rollback(p)
        print("rolled back the apply step's files from", rel(p, p["rollback"]))
        return 0
    if args.rekey_skyview or args.rekey_generated:
        r = load(p["receipt"])
        if not r.get("_applied_at"):
            sys.exit("--rekey-* read an APPLIED receipt")
        alias = {k: v["new_id"] for k, v in r["aliases"].items()}
        if args.rekey_skyview:
            print("SkyView layout re-keyed:", er.rekey_skyview(alias))
        if args.rekey_generated:
            import _subjects_list_recode as slr
            print("generated files re-keyed:", slr.rekey_generated(alias))
            print("payload disciplines:", payload_disciplines(r, os.path.join(p["root"], "unified_courses_data.js")))
        return 0
    if not args.apply:
        docs = er.load_docs(p["kb"])
        if applied(p, docs):
            print("applied:", rel(p, p["receipt"]))
            return 0
        g = plan_gates(fresh_plan(p, docs), load(p["plan"]), read(p["forwarding"]))
        for k, v in g.items():
            print(f"  {k}: {'ok' if v['pass'] else 'FAIL ' + json.dumps(v)[:300]}")
        return 0 if all(v["pass"] for v in g.values()) else 1
    r = apply(p)
    print(f"APPLIED - {r['_count']} M-IDs, {r['_kb_curation_rows']} kb_curation rows, counts {r['_counts']}; person "
          f"rows changed {r['_person_rows_changed']}. Next: register {rel(p, p['receipt'])} in kb/alias_chain.py "
          "ALIAS_MAPS, run kb/_post_apply_chain.py, then --rekey-skyview --rekey-generated.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
