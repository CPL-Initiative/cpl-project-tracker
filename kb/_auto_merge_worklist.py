#!/usr/bin/env python3
"""Auto-curate the dependable suggested-merge lanes — DRY-RUN planner.

Sam (2026-06-12, after hand-reviewing ~80 of the 9,087 worklist groups):
most are straightforward merges whose only nuance is trivial common-title
regularization ("BIOLOGY 1 - HONORS" → "Biology 1 Honors"); auto-curate
those, regularize the title deterministically, and flag them auto-merged
for a later second look.

SCOPE (pass 1 — the dependable lanes ONLY):
  * anchored ``groups``           — level-safe same-title merges INTO an
                                    existing identity (the worklist's most
                                    conservative lane; cid_conflict
                                    over-merges already excluded upstream)
  * ``singleton_groups``          — cross-college only (same_college groups
                                    are usually intra-college variant
                                    ladders → stay human)
  The similarity lanes (🏷 title / 📝 desc), co-articulation families, and
  🧾 evidence groups stay HUMAN in pass 1.

GATES (a group failing any is bucketed for human review, never planned):
  * ≥2 live members after the curation overlay (already-merged members and
    already-confirmed groups drop out naturally)
  * not Keep-as-is dismissed (exact live-member signature match)
  * no contested member (m.x — shouldn't occur in these lanes; guarded)
  * band purity — all M-shaped ids share one band digit (credit 1xxx vs
    noncredit 9xxx never auto-merge across; "bands never cross in merges")
  * the merge target is itself unconsumed (no merge_into row on it)

TITLE RULE (deterministic — no per-group research):
  * official C-ID/CCN target → NO title write (official title authoritative)
  * target already carries a curator unified_title → KEPT (never overwrite)
  * else: normalize(longest member title) via kb/_normalize_common_titles
    (mojibake → "(formerly …)" strip → romans→digits → Title Case) + the
    Honors de-dash rule ("… - Honors"/"…: HONORS" → "… Honors")

WRITE SHAPE (mirrors unified_courses.js doConsolidate exactly):
  * each non-target member  → {course_id, field: merge_into,   value: target}
  * non-official target     → {course_id, field: unified_title, value: title}
  * NO discipline writes — merge ≠ verify; auto-merges must never read as
    curator-Verified (UC-CUR-AUTO mints stay blank-discipline → the normal
    blank-disc queue).
  * reviewed_by marker at apply time: "automerge-v1" — the second-look
    handle (queryable, chip-able, bulk-revertible as a cohort).

OUTPUTS (kb/automerge_out/<date>/) — NOTHING is mutated, NOTHING is sent
to Supabase; the apply step is a separate, explicitly-authorized run that
re-executes this planner against fresh state first:
  * plan.json         — full machine plan (per group: lane, signature,
                        target, title action, members, exact write rows)
  * supabase_ops.sql  — the would-be upserts, ON CONFLICT DO NOTHING so a
                        human row written between plan and apply ALWAYS
                        wins; header-guarded "do not run until reviewed"
  * report.md         — human skim: counts, gate buckets, title-change
                        showcase, units-spread stats, samples

Run from repo root:  python3 kb/_auto_merge_worklist.py
"""
import hashlib
import importlib.util
import json
import os
import random
import re
import sys
from collections import Counter
from datetime import datetime as _dt

SD = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(SD)

_norm_spec = importlib.util.spec_from_file_location(
    "norm", os.path.join(SD, "_normalize_common_titles.py"))
norm = importlib.util.module_from_spec(_norm_spec)
_argv = sys.argv
sys.argv = ["x"]
_norm_spec.spec = None
_norm_spec.loader.exec_module(norm)
sys.argv = _argv

MARKER = "automerge-v1"
PASS2_TITLE = "--pass2-title" in sys.argv   # pass 2: the 🏷 title-similarity lane
if PASS2_TITLE:
    MARKER = "automerge-titlelane-v1"        # distinct, separately-revertible cohort
PRI = {"CCN-ID": 0, "C-ID": 1, "M-ID": 2, "Unified": 3}
OFFICIAL = {"CCN-ID", "C-ID"}
BAND_RE = re.compile(r"^[A-Z]{2,4} M(\d)")
HONORS_RE = re.compile(r"\s*[-–—:,]+\s*(Honors)$", re.I)


def load_payload():
    p = os.path.join(ROOT, "unified_courses_suggestions.js")
    s = open(p, encoding="utf-8").read()
    i = s.find("window.CPL_UC_SUGGESTIONS")
    i = s.find("=", i)
    return json.loads(s[i + 1:].rstrip().rstrip(";"))


def load_overlay():
    p = os.path.join(SD, "coci_curation.json")
    doc = json.load(open(p, encoding="utf-8"))
    cur = doc.get("curations", doc)
    merged = {}        # course_id -> target (existing merge_into rows)
    titles = {}        # course_id -> curator unified_title
    dismissed = set()  # Keep-as-is signatures
    for cid, v in cur.items():
        if not isinstance(v, dict):
            continue
        if v.get("merge_into"):
            merged[cid] = v["merge_into"]
        if v.get("unified_title"):
            titles[cid] = v["unified_title"]
        if v.get("merge_dismissed"):
            dismissed.add(v["merge_dismissed"])
    return merged, titles, dismissed


def regularize_title(t):
    t2 = norm.normalize(t)
    # Honors de-dash + force-case: "… - Honors"/"…: HONORS" → "… Honors".
    # title_case preserves ALL-CAPS tokens in mixed-case titles (presumed
    # acronyms) — HONORS never is one, so re-case it explicitly anywhere.
    t2 = HONORS_RE.sub(" Honors", t2)
    t2 = re.sub(r"\bHONORS\b", "Honors", t2)
    return re.sub(r"\s{2,}", " ", t2).strip()


def band_of(course_id):
    m = BAND_RE.match(course_id or "")
    return m.group(1) if m else None


def main():
    payload = load_payload()
    merged, cur_titles, dismissed = load_overlay()
    today = _dt.now().strftime("%Y-%m-%d")
    odir = os.path.join(SD, "automerge_out", today + ("-titlelane" if PASS2_TITLE else ""))
    os.makedirs(odir, exist_ok=True)

    if PASS2_TITLE:
        # Pass 2 (Sam, 2026-06-13 — INFORMED whole-lane choice after seeing the
        # title-cosine over-merge risk, e.g. "Barbering: Level 2" 9.5u vs
        # "Barbering 2" 2u at score 1.0). The 🏷 title-similarity lane, with the
        # SAME correctness gates as pass 1 (band purity / Keep-as-is dismissed /
        # contested / ≥2 live members). NO units/same-college gate — Sam took the
        # whole lane; the residue is reviewable via the ⚙ Triage lane and the
        # cohort is revertible (delete where reviewer_email = the marker).
        lanes = [("title", payload.get("title_groups") or [])]
    else:
        lanes = [("anchored", payload.get("groups") or []),
                 ("singleton", payload.get("singleton_groups") or [])]

    plan, buckets = [], Counter()
    title_changes, spreads = [], []
    used_targets = set()

    for lane, groups in lanes:
        for g in groups:
            # Dedupe by id — the payload can list one id under two kinds
            # (e.g. an M-ID also present in the stand-alone payload); first
            # occurrence wins so the write set stays unique per group.
            seen_ids = set()
            mem = [m for m in (g.get("members") or [])
                   if m.get("id") not in merged
                   and not (m["id"] in seen_ids or seen_ids.add(m["id"]))]
            if len(mem) < 2:
                buckets[f"{lane}: already consumed (<2 live members)"] += 1
                continue
            sig = "|".join(sorted(m["id"] for m in mem))
            if sig in dismissed:
                buckets[f"{lane}: Keep-as-is dismissed"] += 1
                continue
            if lane == "singleton" and g.get("same_college"):
                buckets["singleton: same_college (stays human)"] += 1
                continue
            if any(m.get("x") for m in mem):
                buckets[f"{lane}: contested member (stays human)"] += 1
                continue
            bands = {b for m in mem if (b := band_of(m["id"]))}
            if len(bands) > 1:
                buckets[f"{lane}: band mix credit/noncredit (stays human)"] += 1
                continue

            cands = sorted([m for m in mem if m.get("k") != "Stand-Alone"],
                           key=lambda m: PRI.get(m.get("k"), 9))
            # anchored ALWAYS needs an identity target; a title group merges INTO
            # its M-ID when one is present, else MINTS (like a singleton group);
            # singleton always mints.
            if lane == "anchored" or (lane == "title" and cands):
                if not cands:
                    buckets["anchored: no identity target (stays human)"] += 1
                    continue
                target = cands[0]["id"]
                target_kind = cands[0].get("k") or ""
                if target in merged:
                    buckets[f"{lane}: target itself consumed (stays human)"] += 1
                    continue
            else:
                target = "UC-CUR-AUTO" + hashlib.md5(sig.encode()).hexdigest()[:8].upper()
                target_kind = "Unified (new)"
                if target in used_targets:   # md5[:8] collision — effectively never
                    buckets[f"{lane}: mint-id collision (stays human)"] += 1
                    continue
            used_targets.add(target)

            longest = max((m.get("t") or "" for m in mem), key=len)
            if target_kind in OFFICIAL:
                title_action, title = "official (no title write)", None
            elif target in cur_titles:
                title_action, title = "kept curator title", None
            else:
                title = regularize_title(longest)
                title_action = "regularized" if title != longest else "unchanged"
                if title != longest:
                    title_changes.append((longest, title))

            units = [m.get("u") for m in mem if isinstance(m.get("u"), (int, float))]
            spread = round(max(units) - min(units), 2) if len(units) >= 2 else 0.0
            spreads.append(spread)

            writes = [{"course_id": m["id"], "field": "merge_into", "value": target}
                      for m in mem if m["id"] != target]
            if title is not None:
                writes.append({"course_id": target, "field": "unified_title", "value": title})

            plan.append({
                "lane": lane, "sig": sig, "score": g.get("score"),
                "target": target, "target_kind": target_kind,
                "title_action": title_action, "title": title,
                "units_spread": spread,
                "review_hint": "wide units spread" if spread > 4 else "",
                "members": [{"id": m["id"], "k": m.get("k"), "t": m.get("t"),
                             "u": m.get("u")} for m in mem],
                "writes": writes,
            })

    n_writes = sum(len(p["writes"]) for p in plan)
    n_merge_rows = sum(1 for p in plan for w in p["writes"] if w["field"] == "merge_into")
    n_title_rows = n_writes - n_merge_rows

    with open(os.path.join(odir, "plan.json"), "w", encoding="utf-8") as f:
        json.dump({
            "_status": "DRY-RUN — nothing applied",
            "_generated_at": _dt.now().isoformat(timespec="seconds"),
            "_payload_generated_at": payload.get("generated_at"),
            "_marker": MARKER,
            "_scope": ("PASS 2 — the 🏷 title-similarity lane, WHOLE lane (Sam's "
                       "informed choice 2026-06-13); correctness gates only (band "
                       "purity/dismissed/contested/≥2-live); desc/family/evidence "
                       "lanes stay human") if PASS2_TITLE else
                      ("anchored groups + cross-college singleton_groups; "
                       "title/desc/family/evidence lanes stay human (pass 1)"),
            "counts": {"groups_planned": len(plan),
                       "merge_rows": n_merge_rows, "title_rows": n_title_rows,
                       "excluded": dict(buckets)},
            "groups": plan,
        }, f, ensure_ascii=False, indent=1)

    sql = [
        "-- AUTO-MERGE PASS 1 — generated by kb/_auto_merge_worklist.py (DRY-RUN receipt)",
        "-- DO NOT RUN until the plan is reviewed AND the planner has been re-run",
        "-- against fresh state in the same sitting (fresh-read-at-write-time rule).",
        "-- ON CONFLICT DO NOTHING: a human curation row ALWAYS wins over this pass.",
        "begin;",
    ]
    for p in plan:
        for w in p["writes"]:
            cid = w["course_id"].replace("'", "''")
            val = (w["value"] or "").replace("'", "''")
            sql.append(
                f"insert into public.kb_curation (course_id, field, value, reviewed_by) "
                f"values ('{cid}', '{w['field']}', '{val}', '{MARKER}') "
                f"on conflict (course_id, field) do nothing;")
    sql.append("commit;")
    with open(os.path.join(odir, "supabase_ops.sql"), "w", encoding="utf-8") as f:
        f.write("\n".join(sql) + "\n")

    rng = random.Random(20260612)
    sample = rng.sample(plan, min(60, len(plan)))
    hist = Counter()
    for s in spreads:
        hist["0 (uniform)" if s == 0 else "≤1u" if s <= 1 else "≤2u" if s <= 2
             else "≤4u" if s <= 4 else ">4u"] += 1

    rep = [
        f"# Auto-merge pass 1 — DRY-RUN plan ({today})",
        "",
        f"Worklist payload: `{payload.get('generated_at')}` · curation overlay: "
        f"synced same run · marker: `{MARKER}` · **nothing applied**.",
        "",
        f"## Planned: **{len(plan)} groups** → {n_merge_rows} merge rows + "
        f"{n_title_rows} title rows ({n_writes} curation upserts)",
        "",
        "| lane | planned |", "|---|---|",
        f"| anchored (merge into existing identity) | {sum(1 for p in plan if p['lane'] == 'anchored')} |",
        f"| singleton (mint new unified course) | {sum(1 for p in plan if p['lane'] == 'singleton')} |",
        f"| title (merge into M-ID, else mint) | {sum(1 for p in plan if p['lane'] == 'title')} |",
        "",
        "## Excluded (stays human / already handled)",
        "",
        "| reason | groups |", "|---|---|",
    ]
    rep += [f"| {k} | {v} |" for k, v in sorted(buckets.items())]
    rep += [
        "",
        f"## Units spread across planned groups ({len(spreads)})",
        "",
        "| spread | groups |", "|---|---|",
    ]
    rep += [f"| {k} | {hist[k]} |"
            for k in ["0 (uniform)", "≤1u", "≤2u", "≤4u", ">4u"] if hist.get(k)]
    rep += [
        "",
        f"## Title regularizations ({len(title_changes)} of {len(plan)} planned groups)",
        "", "First 25 (longest-member title → chosen unified title):", "",
    ]
    for a, b in title_changes[:25]:
        rep.append(f"- `{a}` → **{b}**")
    rep += ["", "## Random sample of 60 planned groups (seeded — reproducible)", ""]
    for p in sample:
        rep.append(f"### {p['lane']} → `{p['target']}` ({p['target_kind']}) · "
                   f"title: {p['title_action']}"
                   + (f" → **{p['title']}**" if p["title"] else ""))
        for m in p["members"]:
            u = f" · {m['u']}u" if m.get("u") is not None else ""
            rep.append(f"- `{m['id']}` ({m.get('k')}) {m.get('t')}{u}")
        if p["review_hint"]:
            rep.append(f"- ⚠ {p['review_hint']} ({p['units_spread']}u)")
        rep.append("")
    rep += [
        "## Apply procedure (NOT tonight — after Sam's skim)",
        "",
        "1. Re-run this planner against fresh `main` (post-cron) in the apply sitting.",
        "2. Execute `supabase_ops.sql` in batches via the Supabase session "
        "(ON CONFLICT DO NOTHING — human rows always win).",
        "3. Fold the overlay (`kb/_apply_curation.py`) or let the daily cron publish.",
        f"4. Second-look handle: `select * from kb_curation where reviewed_by = '{MARKER}'`.",
        "",
    ]
    with open(os.path.join(odir, "report.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(rep))

    print(f"DRY-RUN: planned {len(plan)} groups "
          f"({n_merge_rows} merges + {n_title_rows} titles = {n_writes} rows); "
          f"excluded {sum(buckets.values())} → {odir}/")
    for k, v in sorted(buckets.items()):
        print(f"  excluded · {k}: {v}")


if __name__ == "__main__":
    main()
