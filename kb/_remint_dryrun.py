"""
DRY-RUN analyzer for the CourseControlNumber re-mint + M-prefix/banded renumber.

MEASUREMENT ONLY. Writes nothing to the machine layers (memberships,
coci_articulations, minted catalog/clusters, lazy artifacts) and nothing to
Supabase. Produces two reviewable artifacts under kb/remint_dryrun/:
  - report.md       — distribution (1:1 rename / vanish-to-official / 1:many
                      split / orphan) + the 6 curation entries' fates.
  - alias_map.json  — old M-ID -> new identity(ies), with classification, so a
                      later apply step can re-key curation (git + Supabase).

WHY title is the mapping key. Both the old mint (_seed_coci_minted_mids.py) and
the re-mint group rows that LACK an official C-ID/CCN by normalized title; each
distinct normalized title is exactly one old M-ID (corroborated >=2 members, or
a singleton). The re-mint differs by (a) keying membership at College/
CourseControlNumber granularity off the richer raw list and (b) letting members
that carry an official C-ID/CCN promote out of the minted cluster. So an old
M-ID's fate is read off its title cluster in the NEW raw list: rows still
lacking an official ID stay minted (renamed/renumbered); rows now carrying an
official ID promote (and if a cluster yields >1 distinct new identity it is a
1:many split that needs human review before the merge_into pointer is moved).

New minted-identity format (PROPOSED — confirm before apply):
  "<SUBJ4> M<NNNN>"  — SUBJ4 = synthetic 4-letter subject (first <=4 alpha chars
  of the cluster's modal subject; MAP surrogate, NOT the official CCN list).
  Band: noncredit / noncredit-enhanced -> 9xxx (the one band we can assert from
  credit_status). Credit -> 1xxx as a NON-SEMANTIC sequence bucket (the M-prefix
  already disclaims CCN equivalence; we do NOT claim 100-level/transferability).
  This single credit-bucket choice is the one open knob flagged for review.
"""
import json
import os
import re
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, "reference", "coci_course_list.xlsx")
OUT_DIR = os.path.join(HERE, "remint_dryrun")

SENT = {None, "", "null", "n/a", "na", "not applicable", "(blank)", "blank", "none"}
STOP_PATTERNS = [
    r"independent stud", r"directed stud", r"dir stud", r"special stud",
    r"special project", r"special topic", r"selected topic", r"special problem",
    r"work experience", r"cooperative (work )?(education|experience)", r"coop ",
    r"internship", r"\bintern\b", r"supervised tutoring",
    r"student instructional assistant", r"service learning", r"occupational work",
    r"tutoring", r"practicum", r"fieldwork", r"field work", r"field experience",
    r"field study", r"directed practice", r"clinical practice", r"cooperative work",
    r"work based learning", r"work-based", r"on the job", r"apprenticeship",
    r"seminar$", r"^seminar", r"special assignment", r"volunteer", r"community service",
]
STOP_RE = re.compile("|".join(STOP_PATTERNS))
CODE_RE = re.compile(r"^[a-z]{1,6} ?\d{1,4}[a-z]?$")


def clean(v):
    if v is None:
        return None
    s = str(v).strip()
    return None if s.lower() in SENT else s


def ntitle(t):
    if t is None:
        return ""
    t = re.sub(r"\s+", " ", str(t)).strip().lower()
    t = re.sub(r"[^a-z0-9 ]", " ", t)
    return re.sub(r"\s+", " ", t).strip()


def credit_status(ct, units):
    c = (ct or "").strip().lower()
    if c == "credit course":
        return "Credit"
    if c in ("other noncredit enhanced funding", "workforce preparation enhanced funding"):
        return "Noncredit Enhanced"
    if c == "non-enhanced funding":
        return "Noncredit"
    try:
        u = float(units)
    except (TypeError, ValueError):
        u = 0
    return "Credit" if u > 0 else "Noncredit"


def subj4(subject):
    a = re.sub(r"[^A-Za-z]", "", str(subject or "")).upper()
    return (a[:4] or "MISC")


def build_new_index():
    """Stream the raw list once. ntitle -> {officials:Counter, minted_n:int,
    minted_subjects:Counter, minted_credit:Counter}. Generic/code titles skipped
    (same exclusions as the mint)."""
    import openpyxl
    wb = openpyxl.load_workbook(RAW, read_only=True)
    ws = wb[wb.sheetnames[0]]
    it = ws.iter_rows(values_only=True)
    next(it)
    idx = {}
    skipped = 0
    for (College, CCNum, Subj, Cnum, Title, Units, CreditType,
         NCcat, Top, CID, Desc, CCNcommon) in it:
        nt = ntitle(Title)
        if not nt or len(nt) < 4 or STOP_RE.search(nt) or CODE_RE.match(nt):
            skipped += 1
            continue
        e = idx.get(nt)
        if e is None:
            e = idx[nt] = {"officials": Counter(), "minted_n": 0,
                           "subjects": Counter(), "credit": Counter()}
        cid = clean(CID)
        ccn = clean(CCNcommon)
        if ccn:
            e["officials"][f"CCN:{ccn}"] += 1
        elif cid:
            e["officials"][f"C-ID:{cid}"] += 1
        else:
            e["minted_n"] += 1
            e["subjects"][str(Subj or "").strip()] += 1
            e["credit"][credit_status(CreditType, Units)] += 1
    wb.close()
    return idx, skipped


def main():
    os.makedirs(OUT_DIR, exist_ok=True)

    cat = json.load(open(os.path.join(HERE, "coci_minted_courses.json")))["courses"]
    sing = json.load(open(os.path.join(HERE, "coci_minted_singletons.json")))["courses"]
    curation = json.load(open(os.path.join(HERE, "coci_curation.json")))["curations"]

    # old M-ID -> (common_title, tier)
    old = {}
    for mid, r in cat.items():
        old[mid] = (r.get("common_title"), "corroborated")
    for mid, r in sing.items():
        old[mid] = (r.get("common_title"), "singleton")

    print(f"old M-IDs: {len(old)} (corroborated {len(cat)}, singleton {len(sing)})")
    new_idx, skipped = build_new_index()
    print(f"new-list distinct mintable/official titles: {len(new_idx)} (rows skipped generic/code: {skipped})")

    # First pass: assign a deterministic new minted code to every title that
    # still has minted rows in the new list (the rename targets). Sequence per
    # (subj4, band) over sorted ntitle so codes are stable + reproducible.
    minted_meta = {}  # nt -> (subj4, credit_status, band_digit, corroborated?)
    for nt, e in new_idx.items():
        if e["minted_n"] == 0:
            continue
        s4 = subj4(e["subjects"].most_common(1)[0][0])
        cs = e["credit"].most_common(1)[0][0]
        band = "9" if cs in ("Noncredit", "Noncredit Enhanced") else "1"
        minted_meta[nt] = (s4, cs, band, e["minted_n"] >= 2)
    # Bucket sizing (informs the numbering-scheme decision). A CCN-style 4-digit
    # code allows only 999 per (subject, band); measure how far the minted space
    # blows past that, and how much smaller the corroborated-only space is.
    bucket_all = Counter((m[0], m[2]) for m in minted_meta.values())
    bucket_corr = Counter((m[0], m[2]) for m in minted_meta.values() if m[3])
    max_bucket = max(bucket_all.values()) if bucket_all else 0
    max_bucket_corr = max(bucket_corr.values()) if bucket_corr else 0
    seq_width = max(4, len(str(max_bucket)))  # overflow-safe uniform width
    seq = defaultdict(int)
    new_code = {}
    for nt in sorted(minted_meta):
        s4, cs, band, _corr = minted_meta[nt]
        seq[(s4, band)] += 1
        new_code[nt] = f"{s4} M{band}{seq[(s4, band)]:0{seq_width}d}"

    # Classify every old M-ID.
    classes = Counter()
    aliases = {}
    split_examples = []
    for mid, (title, tier) in old.items():
        nt = ntitle(title)
        e = new_idx.get(nt)
        if e is None:
            classes["orphan"] += 1
            aliases[mid] = {"class": "orphan", "tier": tier, "new": [],
                            "note": "title absent from new raw list (or now generic/code-excluded)"}
            continue
        officials = sorted(e["officials"])
        minted = e["minted_n"] > 0
        new_ids = []
        if minted:
            new_ids.append(new_code[nt])
        new_ids.extend(officials)
        if minted and not officials:
            cls = "rename"
        elif officials and not minted:
            cls = "vanish_to_official" if len(officials) == 1 else "split"
        else:  # minted + officials
            cls = "split"
        classes[cls] += 1
        rec = {"class": cls, "tier": tier, "new": new_ids}
        if cls == "split":
            rec["flag"] = "1:many — review before moving any curation/merge_into pointer"
            if len(split_examples) < 25:
                split_examples.append((mid, title, new_ids))
        aliases[mid] = rec

    # The 6 curation entries' fates (the decision-critical detail).
    curation_report = {}
    for key, body in curation.items():
        is_mid = key.startswith("M-ID ")
        entry = {"is_m_id": is_mid, "curation_fields": [k for k in body if not k.startswith("_")]}
        if is_mid:
            a = aliases.get(key)
            entry["mapping"] = a or {"class": "NOT FOUND in old M-ID set", "new": []}
        else:
            entry["mapping"] = {"class": "not an M-ID — key is stable, not re-keyed"}
        # does it point merge_into another id? is that target an M-ID (needs rewrite)?
        mi = body.get("merge_into")
        if mi:
            entry["merge_into"] = mi
            entry["merge_into_is_m_id"] = mi.startswith("M-ID ")
        curation_report[key] = entry

    top_buckets = sorted(bucket_all.items(), key=lambda kv: -kv[1])[:10]
    summary = {
        "old_m_ids_total": len(old),
        "corroborated": len(cat),
        "singletons": len(sing),
        "classes": dict(classes),
        "new_minted_identities": len(new_code),
        "new_minted_noncredit_9xxx": sum(1 for nt in new_code if minted_meta[nt][2] == "9"),
        "new_minted_credit_1xxx": sum(1 for nt in new_code if minted_meta[nt][2] == "1"),
        "numbering": {
            "seq_width_used": seq_width,
            "max_per_subject_band_ALL": max_bucket,
            "max_per_subject_band_CORROBORATED_only": max_bucket_corr,
            "ccn_4digit_capacity_per_subject_band": 999,
            "buckets_over_999_ALL": sum(1 for v in bucket_all.values() if v > 999),
            "buckets_over_999_CORROBORATED_only": sum(1 for v in bucket_corr.values() if v > 999),
            "top10_buckets_ALL": [{"subj_band": f"{s} {b}", "n": v} for (s, b), v in top_buckets],
        },
    }

    alias_doc = {
        "_about": "DRY RUN — old M-ID -> new identity(ies). NOT applied to any machine layer or Supabase.",
        "_scheme": "<SUBJ4> M<band><seq>; band 9=noncredit (asserted), 1=credit (NON-SEMANTIC bucket, confirm).",
        "summary": summary,
        "curation_entries": curation_report,
        "aliases": dict(sorted(aliases.items())),
    }
    with open(os.path.join(OUT_DIR, "alias_map.json"), "w", encoding="utf-8") as f:
        json.dump(alias_doc, f, indent=2, ensure_ascii=False)
        f.write("\n")

    nb = summary["numbering"]
    cur_lines = []
    for k, v in curation_report.items():
        m = v["mapping"]
        line = f"| `{k}` | {'M-ID' if v['is_m_id'] else 'cluster'} | {m.get('class')} | {', '.join(f'`{x}`' for x in m.get('new', [])) or '—'} |"
        if "merge_into" in v:
            line += f" merge_into `{v['merge_into']}` (M-ID? {v['merge_into_is_m_id']}) |"
        else:
            line += " — |"
        cur_lines.append(line)
    split_lines = [f"| `{mid}` | {title} | {', '.join(f'`{x}`' for x in nids)} |"
                   for mid, title, nids in split_examples]
    report = f"""# CourseControlNumber re-mint — DRY-RUN report

**Measurement only. Nothing was written to the machine layers or Supabase.**
Artifacts: `kb/remint_dryrun/alias_map.json` (this run) + this report.
Generator: `kb/_remint_dryrun.py`.

## What this measures
Each old minted M-ID is mapped to its fate under a CourseControlNumber-grained
re-mint, read off its **normalized title** (the grouping key the mint actually
uses) in the richer raw list `kb/reference/coci_course_list.xlsx` (141,738 rows).
A title's rows that still lack an official C-ID/CCN stay **minted** (renamed /
renumbered); rows that now carry an official C-ID/CCN **promote** out; a cluster
that yields more than one distinct new identity is a **1:many split**.

## Distribution (all {summary['old_m_ids_total']:,} old M-IDs)
| class | count | meaning |
|---|---|---|
| rename | {classes.get('rename',0):,} | 1:1 — stays minted, gets a new `SUBJ4 M####` key |
| vanish_to_official | {classes.get('vanish_to_official',0):,} | all members promote to ONE official C-ID/CCN; M-ID dissolves |
| split | {classes.get('split',0):,} | **1:many — needs review**; minted remnant + promoted official(s), or >1 official |
| orphan | {classes.get('orphan',0):,} | title absent from the new list |

Old M-IDs: {summary['corroborated']:,} corroborated + {summary['singletons']:,} singletons.
New minted identities: {summary['new_minted_identities']:,}
(noncredit→9xxx: {summary['new_minted_noncredit_9xxx']:,}; credit→1xxx: {summary['new_minted_credit_1xxx']:,}).

## The 6 curation entries (decision-critical)
| key | kind | fate | new id(s) | merge_into |
|---|---|---|---|---|
{chr(10).join(cur_lines)}

All five curated **M-ID** keys map **1:1 (rename)** — none split — and every
`merge_into` points at the curator-minted `UC-CUR-MPG029OM` cluster, which is
**not** an M-ID, so no `merge_into` value needs rewriting. The re-key of the
human layer is therefore: rewrite the 5 curation **keys** (git + Supabase),
leave all `merge_into` values untouched.

## ⚠ Open decision — the credit numbering bucket
Banding `credit_status` is clean for **noncredit** (→ `9xxx`). But **credit**
minted identities ({summary['new_minted_credit_1xxx']:,} of them) do NOT fit a
CCN-style 4-digit-per-subject code: a `SUBJ C####` allows only **999** per
(subject, band), and our minted space blows past that.

- max identities in one (subject, band) bucket — **ALL**: {nb['max_per_subject_band_ALL']:,}
- max — **corroborated-only** (drop singletons): {nb['max_per_subject_band_CORROBORATED_only']:,}
- (subject,band) buckets over 999 — ALL: {nb['buckets_over_999_ALL']} · corroborated-only: {nb['buckets_over_999_CORROBORATED_only']}
- top buckets: {', '.join(f"{b['subj_band']}={b['n']}" for b in nb['top10_buckets_ALL'])}

This run used an overflow-safe **{nb['seq_width_used']}-digit** sequence
(`SUBJ4 M1{'0'*(nb['seq_width_used']-1)}…`), which is wider than CCN's 4 digits
— so the codes are valid + unique but no longer 4-digit-CCN-shaped. **Options to
confirm before apply:** (a) accept the wider non-4-digit minted number (still
unmistakably ours via the `M`); (b) give only the {summary['corroborated']:,}
**corroborated** M-IDs a formal `M####` and keep singletons on a lighter key;
(c) drop the per-subject band entirely for credit (only noncredit carries the
`9` band) and sequence credit globally per subject.

## Splits to review (first {len(split_lines)} of {classes.get('split',0):,})
| old M-ID | title | new identities |
|---|---|---|
{chr(10).join(split_lines)}

## How the apply step will treat each layer (per your instruction)
- **Machine layers** (memberships, `coci_articulations`, minted catalog /
  clusters / singletons, lazy artifacts) → **regenerated** under the new keys.
- **Human curation layer** (`coci_curation.json` + live Supabase `kb_curation`)
  → **aliased**: rewrite `course_id` keys (and any `merge_into` that is an M-ID
  — here, none) via this map. Live Supabase row count must be verified to match
  git's 6 before applying.
"""
    with open(os.path.join(OUT_DIR, "report.md"), "w", encoding="utf-8") as f:
        f.write(report)

    print("\n=== DISTRIBUTION ===")
    for k in ("rename", "vanish_to_official", "split", "orphan"):
        print(f"  {k:20} {classes.get(k,0):,}")
    print(f"\nnew minted: {len(new_code):,} (noncredit 9xxx {summary['new_minted_noncredit_9xxx']:,}, "
          f"credit 1xxx {summary['new_minted_credit_1xxx']:,})")
    print(f"numbering: width {seq_width}, max/bucket ALL {max_bucket:,}, "
          f"corroborated-only {max_bucket_corr:,}, buckets>999 ALL {nb['buckets_over_999_ALL']}")
    print("\n=== 6 CURATION ENTRIES ===")
    for k, v in curation_report.items():
        m = v["mapping"]
        print(f"  {k}: {m.get('class')} -> {m.get('new', [m.get('class')])}")
    print(f"\nwrote {os.path.join(OUT_DIR,'alias_map.json')} + report.md")
    return alias_doc, split_examples


if __name__ == "__main__":
    main()
