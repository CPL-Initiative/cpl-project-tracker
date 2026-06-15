"""
UC-CUR → Z-scheme re-mint — APPLY (Rule 7).

Sam signed off on the dry-run (2026-06-15, "Go now — build + run the apply").
This is the apply half of the Rule-7 playbook. It is SEPARATE from the dry-run
and re-derives the plan against fresh state via the SHARED compute_plan() before
writing anything.

WHAT IT DOES (git side — deterministic, offline):
  1. Re-runs compute_plan() against the CURRENT kb/coci_curation.json + minted
     catalog + canonical map, and ASSERTS the alias map matches the committed
     dry-run receipt (apply == spec; aborts on any drift in the re-key surface).
  2. Re-keys kb/coci_curation.json IN PLACE:
       - self-keyed `unified_title` rows: course_id  UC-CUR-* → SUBJ Z<band><seq>
       - `merge_into` pointers:           value      UC-CUR-* → SUBJ Z<band><seq>
     (reviewer_email / reviewed_at / validated_* preserved; dict re-sorted by
     course_id to match kb/_apply_curation.py's output format.)
  3. Writes kb/uc_cur_zseq.json from the dry-run's zseq_seed (option B counter).
  4. Restamps the dry-run receipt `_status` → APPLIED and writes apply_log.json.
  5. Emits supabase_apply.sql (batched bulk UPDATEs) for the LIVE re-key — run
     via the Supabase MCP in the SAME cron window (the durable source-of-truth
     change; the daily cron rebuilds the git overlay from it).
  6. V-validates the re-keyed git overlay (no UC-CUR left in the re-key surface;
     every target id is a valid Z-id; counts conserved).

WHAT IT DOES NOT DO:
  - It does NOT touch Supabase (no network). The operator runs supabase_apply.sql
    via the MCP. The fresh-read safeguard (md5 of the UC-CUR surface, git vs live)
    is performed by the operator BEFORE running this (it matched 2026-06-15).
  - It does NOT change recognition/mint code — that ships in the same PR.

The re-key is a clean BIJECTION (no slot reuse), so the committed alias_map.json
is the authoritative provenance + rollback handle (read right-to-left). No per-row
curation stamps are written (they wouldn't survive the cron's Supabase→git rebuild
anyway, and there is no slot reuse to disambiguate).

Run from repo root, AFTER the fresh-read safeguard passes:
  python3 kb/_uc_cur_zscheme_apply.py            # dry assert + write git + emit SQL
  python3 kb/_uc_cur_zscheme_apply.py --check     # assert only, write nothing
"""
from __future__ import annotations

import importlib.util
import json
import os
import re
import sys
from datetime import date, datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
CURATION = os.path.join(HERE, "coci_curation.json")
COUNTER = os.path.join(HERE, "uc_cur_zseq.json")
RECEIPT_DIR = os.path.join(HERE, "uc_cur_zscheme_out", date.today().isoformat())

# import the shared allocator from the dry-run (apply == spec)
_spec = importlib.util.spec_from_file_location(
    "zdry", os.path.join(HERE, "_uc_cur_zscheme_dryrun.py"))
zdry = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(zdry)

Z_ID_RE = re.compile(r"^[A-Z]{2,6} Z[0-9][0-9A-Z]{3}$")
UC_CUR_RE = re.compile(r"^UC-CUR-")


def _sql_lit(s: str) -> str:
    return "'" + (s or "").replace("'", "''") + "'"


def _bulk_update_sql(pairs, set_col, where_clause):
    """One UPDATE ... FROM (VALUES ...) per ~1000 pairs."""
    out = []
    for i in range(0, len(pairs), 1000):
        chunk = pairs[i:i + 1000]
        values = ",".join(f"({_sql_lit(o)},{_sql_lit(n)})" for o, n in chunk)
        out.append(
            f"update public.kb_curation k set {set_col} = m.newid "
            f"from (values {values}) as m(oldid, newid) "
            f"where {where_clause};")
    return out


def main():
    check_only = "--check" in sys.argv

    with open(CURATION, encoding="utf-8") as f:
        doc = json.load(f)
    curations = doc.get("curations", doc) or {}
    with open(zdry.CANONICAL, encoding="utf-8") as f:
        canon_doc = json.load(f)
    member_idx, all_ids = zdry.load_member_index()

    # 1. re-derive + assert spec-match against the committed dry-run receipt ----
    plan = zdry.compute_plan(curations, member_idx, all_ids, canon_doc)
    alias = {k: v["new_id"] for k, v in plan["alias_map"].items()}
    fails = [k for k, v in plan["validation"].items() if not v["pass"]]
    if fails:
        sys.exit(f"ABORT — validation gates failed on fresh state: {fails}")

    receipt_alias_path = os.path.join(RECEIPT_DIR, "alias_map.json")
    if os.path.exists(receipt_alias_path):
        with open(receipt_alias_path, encoding="utf-8") as f:
            receipt = json.load(f)["aliases"]
        receipt_alias = {k: v["new_id"] for k, v in receipt.items()}
        if receipt_alias != alias:
            only_now = set(alias) - set(receipt_alias)
            only_receipt = set(receipt_alias) - set(alias)
            changed = {k for k in set(alias) & set(receipt_alias)
                       if alias[k] != receipt_alias[k]}
            sys.exit(f"ABORT — re-derived alias differs from the dry-run receipt: "
                     f"new={len(only_now)} gone={len(only_receipt)} changed={len(changed)}. "
                     f"Re-run the dry-run + re-review (fresh-read drift).")
        print(f"[apply] spec-match OK — {len(alias)} aliases == dry-run receipt")
    else:
        print(f"[apply] WARNING — no dry-run receipt at {receipt_alias_path}; "
              f"proceeding on freshly computed plan ({len(alias)} aliases)")

    # 2. compose Supabase bulk-UPDATE SQL (operator runs via MCP) --------------
    self_pairs = sorted(alias.items())                         # course_id rename
    target_pairs = sorted(alias.items())                       # merge_into value
    sql = [
        "-- UC-CUR → Z-scheme LIVE re-key — kb/_uc_cur_zscheme_apply.py",
        "-- Run in ONE cron window (before 10:17 UTC) via the Supabase MCP, AFTER",
        "-- the fresh-read md5 safeguard passes. Two bulk-update classes, batched.",
        "begin;",
    ]
    sql += _bulk_update_sql(self_pairs, "course_id", "k.course_id = m.oldid")
    sql += _bulk_update_sql(target_pairs, "value",
                            "k.field = 'merge_into' and k.value = m.oldid")
    sql.append("commit;")
    os.makedirs(RECEIPT_DIR, exist_ok=True)
    with open(os.path.join(RECEIPT_DIR, "supabase_apply.sql"), "w", encoding="utf-8") as f:
        f.write("\n".join(sql) + "\n")

    if check_only:
        print("[apply] --check: wrote supabase_apply.sql; no git mutation. Done.")
        return

    # 3. re-key the git overlay IN PLACE ---------------------------------------
    new_curations = {}
    n_key_rekey = n_val_rekey = 0
    for cid, v in curations.items():
        nid = alias.get(cid, cid)         # rename self-keyed UC-CUR rows
        if nid != cid:
            n_key_rekey += 1
        if isinstance(v, dict) and v.get("merge_into") in alias:
            v = dict(v)
            v["merge_into"] = alias[v["merge_into"]]
            n_val_rekey += 1
        # a re-keyed id must not already exist (clean bijection)
        if nid in new_curations:
            sys.exit(f"ABORT — re-keyed id collision in overlay: {nid}")
        new_curations[nid] = v
    doc["curations"] = dict(sorted(new_curations.items()))
    doc["count"] = len(doc["curations"])
    with open(CURATION, "w", encoding="utf-8") as f:
        json.dump(doc, f, indent=2, ensure_ascii=False)
        f.write("\n")

    # 4. write the persisted counter (option B) --------------------------------
    with open(COUNTER, "w", encoding="utf-8") as f:
        json.dump({
            "_about": "Per-(SUBJ4, band) sequence high-water for UC-CUR→Z mints. "
                      "Future Z-mints read+increment so the existing cohort never "
                      "renumbers (option B). Seeded by the 2026-06-15 re-mint.",
            "_format": "'SUBJ4|band' -> highest seq assigned (next mint = seq+1)",
            "_applied_at": date.today().isoformat(),
            "counters": plan["zseq_seed"],
        }, f, indent=2, ensure_ascii=False)
        f.write("\n")

    # 5. V-validate the re-keyed overlay ---------------------------------------
    leftover_keys = [k for k in doc["curations"] if UC_CUR_RE.match(k)]
    leftover_ptrs = [k for k, v in doc["curations"].items()
                     if isinstance(v, dict) and UC_CUR_RE.match(v.get("merge_into") or "")]
    bad_targets = [v["merge_into"] for v in doc["curations"].values()
                   if isinstance(v, dict) and v.get("merge_into", "").find(" Z") > 0
                   and not Z_ID_RE.match(v["merge_into"])]
    assert not leftover_keys, f"UC-CUR self-keys remain: {leftover_keys[:5]}"
    assert not leftover_ptrs, f"UC-CUR merge_into remain: {leftover_ptrs[:5]}"
    assert not bad_targets, f"malformed Z merge_into: {bad_targets[:5]}"

    # 6. restamp receipt _status → APPLIED + apply_log -------------------------
    if os.path.exists(receipt_alias_path):
        with open(receipt_alias_path, encoding="utf-8") as f:
            rec = json.load(f)
        rec["_status"] = ("APPLIED — git overlay re-keyed " + date.today().isoformat()
                          + "; Supabase re-keyed live via supabase_apply.sql (MCP).")
        rec["_applied_at"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        with open(receipt_alias_path, "w", encoding="utf-8") as f:
            json.dump(rec, f, indent=2, ensure_ascii=False)
            f.write("\n")
    with open(os.path.join(RECEIPT_DIR, "apply_log.json"), "w", encoding="utf-8") as f:
        json.dump({
            "_status": "APPLIED",
            "_applied_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "aliases": len(alias),
            "git_self_keys_rekeyed": n_key_rekey,
            "git_merge_into_rekeyed": n_val_rekey,
            "counter_buckets": len(plan["zseq_seed"]),
            "supabase": "run supabase_apply.sql via MCP in the same window",
        }, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"[apply] git overlay re-keyed: {n_key_rekey} self-keys + "
          f"{n_val_rekey} merge_into pointers → Z; overlay now {doc['count']} rows.")
    print(f"[apply] wrote {COUNTER} ({len(plan['zseq_seed'])} counters), "
          f"restamped receipt, wrote apply_log.json + supabase_apply.sql.")
    print(f"[apply] NEXT: run {RECEIPT_DIR}/supabase_apply.sql via the Supabase MCP, "
          f"then merge the code PR + dispatch the workflow.")


if __name__ == "__main__":
    main()
