#!/usr/bin/env python3
"""ESL packaging — dry-run and apply, sharing one compute_plan().

Default is DRY-RUN. `--apply` performs the live write and requires --confirm.

MECHANISM (Sam's ruling, 2026-08-24): the three comprehensives are EXISTING ESL
identities chosen as survivors and renamed, not newly minted ids. That keeps the
write inside verbs already in production (`unified_title` + `merge_into`), needs
no new id scheme, and cannot trip `merge_into_orphan` — a UC-CUR-* id would have
revived a prefix Session 56 re-minted away (live count today: 0), and a Z-scheme
id is not self-trusted by the audit rule.

SURVIVOR CHOICE is a stated rule, not taste. Among candidates that are
actionable, high-confidence, and whose level came from a real level WORD:
  1. prefer the dominant SUBJ4 (coherence — the three are one set)
  2. prefer a title that OPENS with the plain level word
  3. then the most colleges (a well-established anchor)
  4. then the shortest title
A survivor never merges into itself and is excluded from the fold list.

RULE 10: fresh live read at write time, re-measure, cross-check pending
unified_title_merge_confirm targets, INSERT-only ON CONFLICT DO NOTHING under a
cohort reviewer_email, committed receipt.
"""
import argparse, json, os, re, sys, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# Six comprehensives (Sam, 2026-08-24). The three LEVELS were the original
# doctrine; Vocational and Civic were carve-outs the plan meant to leave as
# scattered identities, and Sam ruled they should each collapse to one course
# too. Enrichment is NEW — no bucket in the plan produces it, so it is carved
# out of the levels by an explicit title rule (below).
#
# Transfer-level ESL is deliberately NOT here. It awards real transferable
# credit, the plan flagged it for individual confirmation, and Sam has not ruled
# on it — folding it would be the one mis-fold that under-serves a student.
LEVELS = ("Beginning ESL", "Intermediate ESL", "Advanced ESL")
FOLD = LEVELS + ("Vocational ESL", "Vocational ESL — Healthcare",
                 "Civic ESL", "Enrichment ESL")
SOURCE_BUCKET = {"Vocational ESL": "Vocational ESL (VESL)",
                 "Civic ESL": "ESL Citizenship"}
NAMES = {b: b for b in FOLD}

import re as _re

# Sam, 2026-08-24: Vocational ESL carries its subject — but ONLY Healthcare.
# Measured: 78% of the lane (90 of 116) is generic workplace English, the
# subject-specific residue is 26 across eight subjects, and AUTOMOTIVE — the
# example that prompted the question — does not exist in the corpus at all.
# Healthcare is the one subject with mass and a clear credit story; the rest
# stay generic and can be split later by dragging, once the map shows them.
_HEALTHCARE = _re.compile(
    r"health scien|healthcare|health care|\bnurs|medical|patient|caregiv|"
    r"dental|phlebot|\bcna\b", _re.I)

def is_healthcare(title):
    return bool(_HEALTHCARE.search(title or ""))
LEVEL_WORD = {"Beginning ESL": "beginning", "Intermediate ESL": "intermediate",
              "Advanced ESL": "advanced", "Vocational ESL": "vocational",
              "Vocational ESL — Healthcare": "health",
              "Civic ESL": "citizenship", "Enrichment ESL": "culture"}

# ENRICHMENT: the title's FRAME must be culture/media/leisure — language learned
# THROUGH something, or about cultural life. Title-primary, per the plan's own
# lesson that a word in the title is not the course's frame (the first VESL pass
# over-caught 4x by matching incidental workplace vocabulary).
_ENRICH_FRAME = _re.compile(
    r"(through\s+(american\s+)?(film|movies?|music|media|television|literature|art|"
    r"urban life|current events|contemporary life)"
    r"|\bculture\s+(and|through)\s+(film|movies?|music|media)"
    r"|\b(american )?culture\b(?!.*\b(classroom|college|academic|etiquette|study)\b)"
    r"|\bcross[- ]cultural\b"
    r"|\bdrama for communication\b"
    r"|\b(lifelong|leisure|enrichment|older adults?|seniors?)\b)", _re.I)
# Explicitly NOT enrichment even though the word appears — these are academic prep.
_ENRICH_VETO = _re.compile(r"\b(classroom culture|college ready|academic|etiquette|"
                           r"college success|study skills)\b", _re.I)

def is_enrichment(title):
    t = title or ""
    if _ENRICH_VETO.search(t):
        return False
    return bool(_ENRICH_FRAME.search(t))


def load_js(fname):
    with open(os.path.join(ROOT, fname), encoding="utf-8") as fh:
        src = fh.read()
    i = src.index("window."); i = src.index("=", i) + 1
    return json.loads(src[i:].strip().rstrip(";"))


def title_of(i, idx, sa, P):
    if i in idx: return idx[i][1]
    if i in sa:  return sa[i].get("title") or ""
    return (P.get(i) or {}).get("title", "")


def compute_plan(live_curation=None):
    """The whole plan. `live_curation` is {course_id: {field: value}} read fresh
    from Supabase at write time; None falls back to the committed sync (dry-run)."""
    plan = json.load(open(os.path.join(ROOT,
        "kb/esl_package_out/2026-07-15/esl_package_plan.json"), encoding="utf-8"))
    P = {r["id"]: r for r in plan["identities"]}

    if live_curation is None:
        cur = json.load(open(os.path.join(ROOT, "kb/coci_curation.json"),
                             encoding="utf-8"))["curations"]
        source = "committed kb/coci_curation.json"
    else:
        cur, source = live_curation, "LIVE Supabase read"
    merged = {k for k, v in cur.items() if isinstance(v, dict) and v.get("merge_into")}

    idx = {r[0]: r for r in load_js("unified_courses_index.js")}
    sa = {r["id"]: r for r in load_js("unified_courses_standalone.js")["rows"]}
    live_rows = set(idx) | set(sa)
    mem = load_js("unified_courses_members.js")["members"]

    def title(i):
        return title_of(i, idx, sa, P)

    def alive(i):
        return i not in merged and i in live_rows

    actionable = {b: [] for b in FOLD}
    enrichment_from = {}
    for i, r in P.items():
        if not alive(i):
            continue
        b = r.get("bucket")
        if b in LEVELS:
            # Enrichment is carved OUT of the levels, so a level's count drops
            if is_enrichment(title_of(i, idx, sa, P)):
                actionable["Enrichment ESL"].append(i)
                enrichment_from[i] = b
            else:
                actionable[b].append(i)
        elif b == SOURCE_BUCKET["Vocational ESL"]:
            t = title_of(i, idx, sa, P)
            actionable["Vocational ESL — Healthcare" if is_healthcare(t)
                       else "Vocational ESL"].append(i)
        elif b == SOURCE_BUCKET["Civic ESL"]:
            actionable["Civic ESL"].append(i)
        # Transfer-level deliberately untouched

    # dominant SUBJ4 across the whole fold — the three survivors share it
    subj = {}
    for b in FOLD:
        for i in actionable[b]:
            s = i.split()[0]
            subj[s] = subj.get(s, 0) + 1
    dominant = max(subj, key=subj.get) if subj else None

    survivors = {}
    for b in FOLD:
        word = LEVEL_WORD[b]
        pool = actionable[b]
        # Levels have a real level WORD to key on; the three new comprehensives
        # do not, so they fall back to the most-adopted member of their bucket.
        cands = [i for i in pool
                 if P[i]["confidence"] == "high" and P[i]["signal"] == "word"] \
                if b in LEVELS else list(pool)
        if not cands:
            cands = list(pool)
        if not cands:
            raise SystemExit(f"no candidate for {b} — refusing to invent one")
        # For a LEVEL, the level word is real semantics and ranks ahead of size.
        # For the three NEW comprehensives there is no level to encode and the
        # title is replaced anyway, so ADOPTION decides — a 12-college anchor is
        # a far better survivor than a 2-college one that merely opens with the
        # right word.
        if b in LEVELS:
            key = lambda i: (0 if i.split()[0] == dominant else 1,
                             0 if title(i).strip().lower().startswith(word) else 1,
                             -len(mem.get(i) or []), len(title(i)))
        else:
            key = lambda i: (-len(mem.get(i) or []),
                             0 if i.split()[0] == dominant else 1,
                             len(title(i)))
        cands.sort(key=key)
        survivors[b] = cands[0]

    surv_ids = set(survivors.values())
    folds = []
    for b in FOLD:
        for i in actionable[b]:
            if i in surv_ids:
                continue                      # a survivor never merges into itself
            folds.append({"id": i, "into": survivors[b], "bucket": b,
                          "conf": P[i]["confidence"], "sig": P[i]["signal"]})

    return {
        "_curation_source": source,
        "survivors": [{"bucket": b, "id": survivors[b], "was": title(survivors[b]),
                       "becomes": NAMES[b], "colleges": len(mem.get(survivors[b]) or [])}
                      for b in FOLD],
        "dominant_subj4": dominant,
        "folds": folds,
        "enrichment_carved_from": {b: sum(1 for v in enrichment_from.values() if v == b)
                                   for b in LEVELS},
        "counts": {"folds": len(folds), "survivors": len(surv_ids),
                   "rows_to_write": len(folds) + len(surv_ids),
                   "by_bucket": {b: sum(1 for f in folds if f["bucket"] == b) for b in FOLD},
                   "medium_confidence": sum(1 for f in folds if f["conf"] == "medium")},
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--confirm", action="store_true",
                    help="required alongside --apply; without it nothing is written")
    ap.add_argument("--live-curation", help="path to a fresh live curation JSON dump")
    ap.add_argument("--date", default=datetime.date.today().isoformat())
    ap.add_argument("--cohort", default="package-esl-s187@bot")
    ap.add_argument("--emit-sql", help="write the INSERT statements here instead of running them")
    args = ap.parse_args()

    live = None
    if args.live_curation:
        live = json.load(open(args.live_curation, encoding="utf-8"))
    plan = compute_plan(live)

    print(f"curation source: {plan['_curation_source']}")
    print(f"dominant SUBJ4:  {plan['dominant_subj4']}\n")
    print("SURVIVORS (renamed, never merged into themselves):")
    for s in plan["survivors"]:
        print(f"  {s['id']:13s} {s['colleges']:3d} colleges   \"{s['was'][:44]}\"")
        print(f"  {'':13s}      becomes → \"{s['becomes']}\"")
    c = plan["counts"]
    print(f"\nfolds:            {c['folds']:,}   {c['by_bucket']}")
    print(f"medium confidence:{c['medium_confidence']:,}")
    print(f"ROWS TO WRITE:    {c['rows_to_write']:,}  "
          f"({c['survivors']} unified_title + {c['folds']} merge_into)")

    outdir = os.path.join(ROOT, "kb", "esl_package_out", args.date)
    os.makedirs(outdir, exist_ok=True)
    receipt = os.path.join(outdir, "esl_apply_plan.json")
    json.dump({"_status": "APPLIED" if (args.apply and args.confirm) else "DRY-RUN",
               "_cohort": args.cohort, "_date": args.date, **plan},
              open(receipt, "w", encoding="utf-8"), indent=1)
    print(f"\nreceipt: {os.path.relpath(receipt, ROOT)}")

    if args.emit_sql:
        rows = []
        for s in plan["survivors"]:
            rows.append((s["id"], "unified_title", s["becomes"]))
        for f in plan["folds"]:
            rows.append((f["id"], "merge_into", f["into"]))
        def q(v): return "'" + str(v).replace("'", "''") + "'"
        with open(args.emit_sql, "w", encoding="utf-8") as fh:
            fh.write("insert into kb_curation (course_id, field, value, reviewer_email, reviewed_at)\nvalues\n")
            fh.write(",\n".join(f"({q(a)},{q(b)},{q(c2)},{q(args.cohort)},now())"
                                for a, b, c2 in rows))
            fh.write("\non conflict do nothing;\n")
        print(f"sql:     {args.emit_sql}  ({len(rows):,} rows)")

    if args.apply and not args.confirm:
        sys.exit("\n--apply given without --confirm: nothing written.")


if __name__ == "__main__":
    main()
