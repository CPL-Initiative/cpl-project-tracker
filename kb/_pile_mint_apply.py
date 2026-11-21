#!/usr/bin/env python3
"""Land the Needs an M-ID pile mint that kb/_pile_mint_dryrun.py plans. DRY BY DEFAULT (Rule 7, Rule 10).

Sam, 2026-11-20 (r-mids-first-then-course-exhibit-titles-sam-2026-11-20): the M-IDs first. The playbook is mandatory
(docs/coursecontrolnumber_remint.md); this is a mint of new ids, never a re-key: no alias map, no kb/promotions.json
entry, no Supabase write.

WHAT IT DOES, in order, and it stops at the first failure with nothing written:
  1. Recomputes the plan from the committed files (kb/_pile_mint_dryrun.py compute_plan, the plan's own date) and
     stops unless every decision section equals the frozen plan it is given.
  2. Stops unless every validation of the frozen plan passed.
  3. Reads a file of live kb_curation rows (--live; the conductor runs the SELECT --print-sql prints) and stops when a
     planned course has a `CN:` row, a planned id is a merge_into target, or a row is keyed by a planned id. The read
     must be fresher than --max-age-hours (Rule 10: a fresh live read at write time).
  4. Ranks every held course through kb/_closest_mid.py with the planned records added, and stops if a held course's
     first recommendation is a planned shell-title record at the Strong level (design F).
  5. With --apply and --expect N (N = the planned records), inserts the planned records into
     kb/coci_minted_courses.json, kb/coci_minted_memberships.json (its count and member_courses_total) and
     kb/coci_minted_singletons.json, and nothing else. Every file must re-serialize to its own bytes before the write;
     new keys go at the end, so every untouched row stays byte-identical; each count grows by exactly the planned
     number. `top_code` is stamped from the course list (coci_lookup_data.js column 7) after the plan is fixed, and
     `cte` through kb/_join_cte_from_top.py's rule. TOP decides nothing here.
  6. Writes a receipt: the ids, the members of each, each file's sha256 and counts before and after.

ROLLBACK. --rollback RECEIPT (dry by default; --apply --expect N, N = the receipt's ids) deletes exactly the
receipt's keys, puts the counts back, and writes the ids to kb/pile_mint_reserved.json, which the dry run's allocator
reads, so a returned id is never handed out again. When the files are as the apply left them, it checks the round trip
returns each file's original bytes.

UC_KB_DIR names another directory for the three identity files and the reservation file (a scratch copy).

Usage (from repo root):
  python3 kb/_pile_mint_apply.py --plan kb/pile_mint_out/<date>_v2/plan.json --print-sql
  python3 kb/_pile_mint_apply.py --plan PLAN --live LIVE.json                       (dry: what it would write)
  python3 kb/_pile_mint_apply.py --plan PLAN --live LIVE.json --apply --expect N   [--receipt PATH]
  python3 kb/_pile_mint_apply.py --rollback RECEIPT [--apply --expect N]
"""
from __future__ import annotations

import argparse
import copy
import hashlib
import json
import os
import sys
from collections import Counter
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import _pile_mint_dryrun as dry  # noqa: E402
import _join_cte_from_top as cte  # noqa: E402

COURSES, MEMBERSHIPS, SINGLETONS = dry.IDENTITY_FILES
DECISION_SECTIONS = ("measures", "planned", "plan_rows", "held", "held_for_assign", "left_out", "shell_conventions",
                     "route_i_floor", "self_recall", "folds")
TOP_COLUMN = 7


class Stop(Exception):
    """A gate refused; nothing was written."""


def kb_dir():
    return os.environ.get("UC_KB_DIR") or HERE


def sha256(path):
    with open(path, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()


def serialize(doc):
    """The identity files' own format (json.dump indent 2, ensure_ascii off, a closing newline)."""
    return json.dumps(doc, indent=2, ensure_ascii=False) + "\n"


def read_doc(path):
    with open(path, encoding="utf-8") as f:
        raw = f.read()
    doc = json.loads(raw)
    if serialize(doc) != raw:
        raise Stop(f"{os.path.basename(path)} does not re-serialize to its own bytes; the apply would rewrite rows "
                   "it does not touch")
    return doc


def write_doc(path, doc):
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        f.write(serialize(doc))
    os.replace(tmp, path)


def now_utc():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


# ── the gates ──────────────────────────────────────────────────────────────
def check_plan(frozen, plan):
    moved = [s for s in DECISION_SECTIONS if dry.dump(frozen.get(s)) != dry.dump(plan.get(s))]
    if moved:
        raise Stop("the plan moved since it was frozen: " + ", ".join(moved) + ". Re-run the dry run and review it.")
    failed = [k for k, v in (frozen.get("validation") or {}).items() if not v.get("pass")]
    if failed:
        raise Stop("the frozen plan failed its own validation: " + ", ".join(failed))


def planned_ids(plan):
    return sorted(plan["planned"]["courses"]) + sorted(plan["planned"]["singletons"])


def planned_cns(plan):
    return sorted({m["control_number"] for ms in plan["planned"]["memberships"].values() for m in ms}
                  | {r["control_number"] for r in plan["planned"]["singletons"].values()})


def check_live(plan, live, now, max_age_hours):
    """live = {"read_at", "cn_rows": [{course_id, field, value, ...}], "merge_targets": [ids], "id_rows": [ids]}."""
    if live is None:
        raise Stop("no live kb_curation rows given (--live); run the SELECT --print-sql prints")
    read_at = str(live.get("read_at") or "")
    try:
        t = datetime.fromisoformat(read_at.replace("Z", "+00:00"))
        if t.tzinfo is None:
            t = t.replace(tzinfo=timezone.utc)
    except ValueError:
        raise Stop(f"the live rows carry no readable read_at ({read_at!r})")
    age = (now - t).total_seconds() / 3600
    if age > max_age_hours or age < -0.05:
        raise Stop(f"the live rows were read {age:.1f} hours ago; read them again (limit {max_age_hours} hours)")
    ids, cns = set(planned_ids(plan)), set(planned_cns(plan))
    curated = sorted({r["course_id"][3:] for r in live.get("cn_rows") or [] if str(r.get("course_id", "")).startswith("CN:")}
                     & cns)
    targets = sorted(set(live.get("merge_targets") or []) & ids)
    keyed = sorted(set(live.get("id_rows") or []) & ids)
    if curated or targets or keyed:
        raise Stop(f"live curation touches the plan: curated courses {curated[:10]}, merge targets {targets[:10]}, "
                   f"rows keyed by a planned id {keyed[:10]}. A person's row wins; re-run the dry run.")


def check_closest(plan, inp):
    m = dry.closest_measure(plan, inp)
    if m["after"]["strong_on_a_shell_title"]:
        raise Stop(f"{m['after']['strong_on_a_shell_title']} held courses would see a planned shell-title record as "
                   "their Strong first recommendation in Closest M-ID")
    return m


def live_sql(plan):
    """The one SELECT, returning one JSON value, the conductor runs before an apply (Rule 10's fresh read)."""
    ids = ", ".join("'" + i.replace("'", "''") + "'" for i in planned_ids(plan))
    return ("with ids(id) as (select unnest(array[" + ids + "]::text[]))\n"
            "select json_build_object(\n"
            "  'read_at', now(),\n"
            "  'cn_rows', coalesce((select json_agg(json_build_object('course_id', k.course_id, 'field', k.field,\n"
            "      'value', k.value, 'reviewer_email', k.reviewer_email, 'reviewed_at', k.reviewed_at)\n"
            "      order by k.course_id, k.field) from kb_curation k where k.course_id like 'CN:%'), '[]'::json),\n"
            "  'merge_targets', coalesce((select json_agg(distinct k.value) from kb_curation k\n"
            "      join ids on k.value = ids.id where k.field = 'merge_into'), '[]'::json),\n"
            "  'id_rows', coalesce((select json_agg(distinct k.course_id) from kb_curation k\n"
            "      join ids on k.course_id = ids.id), '[]'::json)\n"
            ") as live;")


# ── the records, stamped ───────────────────────────────────────────────────
def stamped_records(plan, inp, cte_map):
    """The planned records with top_code from the course list (column 7) and cte through the CTE joiner's rule."""
    top_of = {}
    for r in inp["L"]["rows"]:
        top_of.setdefault(str(r[1] or ""), str(r[TOP_COLUMN] or "").strip() or None)
    code = lambda t: t.split(":")[0].strip() if t else None
    courses = copy.deepcopy(plan["planned"]["courses"])
    members = copy.deepcopy(plan["planned"]["memberships"])
    singles = copy.deepcopy(plan["planned"]["singletons"])
    for mid, rec in courses.items():
        tops = Counter()
        for m in members[mid]:
            m["top_code"] = top_of.get(m["control_number"])
            if code(m["top_code"]):
                tops[code(m["top_code"])] += 1
        ranked = sorted(tops.items(), key=lambda kv: (-kv[1], kv[0]))
        rec["top_code"] = ranked[0][0] if ranked else None
        rec["top_code_mixed"] = len(tops) > 1
        rec["top_code_distribution"] = dict(ranked) if len(tops) > 1 else None
        rec["cte"] = cte.cte_for(rec["top_code"], cte_map)[0]
    for mid, rec in singles.items():
        rec["top_code"] = code(top_of.get(rec["control_number"]))
        rec["cte"] = cte.cte_for(rec["top_code"], cte_map)[0]
    return courses, members, singles


# ── apply and rollback ─────────────────────────────────────────────────────
def apply(frozen, inp, kdir, live, expect, write, now, max_age_hours=6.0, cte_map=None, receipt_path=None,
          plan_path=None):
    """Returns the receipt (written only with write=True). Raises Stop on any gate."""
    plan = dry.compute_plan(inp, frozen["_generated_at"])
    check_plan(frozen, plan)
    n = len(planned_ids(frozen))
    check_live(frozen, live, now, max_age_hours)
    closest = check_closest(frozen, inp)
    if write and expect != n:
        raise Stop(f"--expect {expect} does not match the plan's {n} records")
    paths = {f: os.path.join(kdir, f) for f in dry.IDENTITY_FILES}
    docs = {f: read_doc(p) for f, p in paths.items()}
    before = {f: sha256(p) for f, p in paths.items()}
    cat, mem, sing = docs[COURSES], docs[MEMBERSHIPS], docs[SINGLETONS]
    courses, members, singles = stamped_records(frozen, inp, cte_map if cte_map is not None else cte.load_cte_map())
    clash = sorted((set(courses) & set(cat["courses"])) | (set(members) & set(mem["memberships"]))
                   | (set(singles) & set(sing["courses"])) | (set(singles) & set(cat["courses"]))
                   | (set(courses) & set(sing["courses"])))
    if clash:
        raise Stop(f"planned ids already in the identity files: {clash[:10]}")
    counts_before = {"courses": cat.get("count"), "memberships": mem.get("count"),
                     "member_courses_total": mem.get("member_courses_total"), "singletons": sing.get("count")}
    for k, v in courses.items():
        cat["courses"][k] = v
    for k, v in members.items():
        mem["memberships"][k] = v
    for k, v in singles.items():
        sing["courses"][k] = v
    if isinstance(cat.get("count"), int):
        cat["count"] += len(courses)
    if isinstance(mem.get("count"), int):
        mem["count"] += len(members)
    if isinstance(mem.get("member_courses_total"), int):
        mem["member_courses_total"] += sum(len(v) for v in members.values())
    if isinstance(sing.get("count"), int):
        sing["count"] += len(singles)
    counts_after = {"courses": cat.get("count"), "memberships": mem.get("count"),
                    "member_courses_total": mem.get("member_courses_total"), "singletons": sing.get("count")}
    receipt = {
        "_what": ("kb/_pile_mint_apply.py receipt: the Needs an M-ID pile mint. Roll back with "
                  "python3 kb/_pile_mint_apply.py --rollback THIS --apply --expect " + str(n) + "."),
        "applied_at": now.strftime("%Y-%m-%dT%H:%M:%SZ"), "plan": plan_path, "plan_date": frozen["_generated_at"],
        "plan_sha256": hashlib.sha256(dry.dump({s: frozen.get(s) for s in DECISION_SECTIONS}).encode()).hexdigest(),
        "live_read_at": live.get("read_at"),
        "ids": {"courses": sorted(courses), "singletons": sorted(singles)},
        "members": {**{k: [m["control_number"] for m in v] for k, v in sorted(members.items())},
                    **{k: [v["control_number"]] for k, v in sorted(singles.items())}},
        "counts": {"before": counts_before, "after": counts_after},
        "closest_after": closest["after"]["tally"],
        "files": {f: {"before_sha256": before[f]} for f in dry.IDENTITY_FILES},
        "written": False,
    }
    if not write:
        return receipt
    for f, p in paths.items():
        write_doc(p, docs[f])
    for f, p in paths.items():
        receipt["files"][f]["after_sha256"] = sha256(p)
    receipt["written"] = True
    if receipt_path:
        os.makedirs(os.path.dirname(os.path.abspath(receipt_path)), exist_ok=True)
        with open(receipt_path, "w", encoding="utf-8") as fh:
            json.dump(receipt, fh, indent=2, ensure_ascii=False, sort_keys=True)
            fh.write("\n")
    return receipt


def rollback(receipt, kdir, expect, write, now):
    ids = receipt["ids"]
    n = len(ids["courses"]) + len(ids["singletons"])
    if write and expect != n:
        raise Stop(f"--expect {expect} does not match the receipt's {n} ids")
    paths = {f: os.path.join(kdir, f) for f in dry.IDENTITY_FILES}
    as_left = all(sha256(p) == (receipt["files"][f].get("after_sha256")) for f, p in paths.items())
    docs = {f: read_doc(p) for f, p in paths.items()}
    cat, mem, sing = docs[COURSES], docs[MEMBERSHIPS], docs[SINGLETONS]
    missing = sorted([k for k in ids["courses"] if k not in cat["courses"] or k not in mem["memberships"]]
                     + [k for k in ids["singletons"] if k not in sing["courses"]])
    if missing:
        raise Stop(f"receipt ids not in the identity files: {missing[:10]}")
    removed_members = 0
    for k in ids["courses"]:
        del cat["courses"][k]
        removed_members += len(mem["memberships"].pop(k))
    for k in ids["singletons"]:
        del sing["courses"][k]
    if isinstance(cat.get("count"), int):
        cat["count"] -= len(ids["courses"])
    if isinstance(mem.get("count"), int):
        mem["count"] -= len(ids["courses"])
    if isinstance(mem.get("member_courses_total"), int):
        mem["member_courses_total"] -= removed_members
    if isinstance(sing.get("count"), int):
        sing["count"] -= len(ids["singletons"])
    out = {"ids": n, "files_as_the_apply_left_them": as_left, "written": False}
    if not write:
        return out
    for f, p in paths.items():
        write_doc(p, docs[f])
    res_path = os.path.join(kdir, dry.RESERVED_FILE)
    res = dry._load(res_path) if os.path.exists(res_path) else {}
    kept = sorted(set(res.get("ids") or []) | set(ids["courses"]) | set(ids["singletons"]))
    with open(res_path, "w", encoding="utf-8") as fh:
        json.dump({"_what": ("Ids a rolled-back pile mint handed out (kb/_pile_mint_apply.py --rollback). The dry "
                             "run's allocator reserves them, so an id once minted is never handed out again."),
                   "updated_at": now.strftime("%Y-%m-%dT%H:%M:%SZ"), "ids": kept}, fh, indent=2, ensure_ascii=False)
        fh.write("\n")
    out["round_trip"] = {f: sha256(p) == receipt["files"][f]["before_sha256"] for f, p in paths.items()}
    out["written"] = True
    return out


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--plan")
    ap.add_argument("--live", help="the live kb_curation rows (the --print-sql SELECT's one JSON value)")
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--expect", type=int)
    ap.add_argument("--receipt")
    ap.add_argument("--rollback", metavar="RECEIPT")
    ap.add_argument("--print-sql", action="store_true")
    ap.add_argument("--max-age-hours", type=float, default=6.0)
    a = ap.parse_args(argv)
    kdir = kb_dir()
    now = datetime.now(timezone.utc)
    try:
        if a.rollback:
            out = rollback(dry._load(a.rollback), kdir, a.expect, a.apply, now)
            print(f"[pile_mint_apply] rollback {'WRITTEN' if out['written'] else 'DRY'}: {out}")
            broken = out["written"] and out["files_as_the_apply_left_them"] and not all(out["round_trip"].values())
            return 1 if broken else 0
        if not a.plan:
            ap.error("--plan or --rollback")
        frozen = dry._load(a.plan)
        if a.print_sql:
            print(live_sql(frozen))
            return 0
        live = dry._load(a.live) if a.live else None
        inp = dry.load_inputs(kdir)
        receipt_path = a.receipt or os.path.join(os.path.dirname(os.path.abspath(a.plan)), "apply_receipt.json")
        r = apply(frozen, inp, kdir, live, a.expect, a.apply, now, a.max_age_hours, receipt_path=receipt_path,
                  plan_path=os.path.relpath(os.path.abspath(a.plan), ROOT))
    except Stop as e:
        print(f"[pile_mint_apply] STOP: {e}")
        return 2
    print(f"[pile_mint_apply] {'WRITTEN' if r['written'] else 'DRY (pass --apply --expect N to write)'}: "
          f"{len(r['ids']['courses'])} catalog records, {len(r['ids']['singletons'])} stand-alone; counts "
          f"{r['counts']['before']} -> {r['counts']['after']}; Closest after {r['closest_after']}")
    if r["written"]:
        print(f"  receipt -> {receipt_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
