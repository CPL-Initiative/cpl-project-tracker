#!/usr/bin/env python3
"""Is a CourseControlNumber a unique course key? Audit — READ-ONLY.

SkyView's member re-home writes `CN:<control number>` and nothing else. Every
layer downstream of that key assumes the number names exactly ONE course:

  excel_to_dashboard.py  `member_extract` is keyed on the bare control number,
                         so the key leaves EVERY native identity at once; and
                         `_leaf_cns("CN:…")` resolves the destination through
                         `cn_rows[cn][0]` — an arbitrary pick when the list is
                         longer than one.
  prototype/ccr_universe.js
                         `byCn[cn]` keeps the FIRST record seen, so a moved
                         course renders on the destination as whichever
                         colliding course was indexed first.

In the primary source that assumption does not hold. This script measures how
badly, and splits the failure into classes that want DIFFERENT repairs — which
is the whole point, because a single headline number ("1,122 duplicate claims")
reads as one worklist and is actually four unrelated conditions, three of them
not defects at all.

⚠️ It reports; it changes nothing. The build is RIGHT to reproduce its source
faithfully (a load must reproduce its source, not improve it) — the repair for
most of what is found here is upstream in COCI or in the roster rules, not in
the generator.

Run:  python3 kb/_audit_control_number_claims.py [--out kb/control_number_audit]
"""
import argparse
import collections
import datetime as _dt
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "kb", "reference", "coci_course_list.xlsx")
RULES = os.path.join(ROOT, "kb", "reference", "map_college_roster_rules.json")

# The build's own key test. A member failing it cannot be dragged at all, which
# is a different problem from a key that names too much.
CN_RE = re.compile(r"^CCC\d{9}$")

# A Common Course Number is C + FOUR digits (ANTH C1001, MATH C2220), optionally
# suffixed H/L for honors/lab. Deliberately NOT C + three digits: `HCRS C139` is
# a local code that merely looks like one, and calling it official would file a
# spacing artifact under the wrong class. C-IDs (`ANTH 110`) are indistinguishable
# from local codes by shape, so they are not detectable here and are not claimed
# to be.
CCN_RE = re.compile(r"^[A-Z]+\s+C\d{4}[A-Z]?$")


def nz(s):
    return re.sub(r"[^a-z0-9]", "", (s or "").lower())


def load_rules():
    """The declared institution fold. It exists, it is authoritative, and the
    member-college roster in excel_to_dashboard.py never consults it."""
    try:
        with open(RULES, encoding="utf-8") as fh:
            return (json.load(fh).get("fold") or {}).get("map") or {}
    except Exception as e:                                     # pragma: no cover
        print(f"  WARNING: could not read {RULES}: {e}", file=sys.stderr)
        return {}


def read_raw():
    """(cn -> {(college, code, title)}, rows, no_key_rows) from the COCI list."""
    import openpyxl
    wb = openpyxl.load_workbook(RAW, read_only=True, data_only=True)
    ws = wb.active
    it = ws.iter_rows(values_only=True)
    hdr = [str(h or "") for h in next(it)]
    C = {h: i for i, h in enumerate(hdr)}
    need = ["College", "CourseControlNumber", "Subject", "Course_Number", "CourseTitle"]
    missing = [n for n in need if n not in C]
    if missing:
        sys.exit(f"COCI course list is missing column(s): {missing}")
    by, rows, nokey = collections.defaultdict(set), 0, 0
    for r in it:
        rows += 1
        cn = str(r[C["CourseControlNumber"]] or "").strip().upper()
        col = str(r[C["College"]] or "").strip()
        code = " ".join(f"{r[C['Subject']] or ''} {r[C['Course_Number']] or ''}".split())
        title = str(r[C["CourseTitle"]] or "").strip()
        if not CN_RE.match(cn):
            nokey += 1
            continue
        by[cn].add((col, code, title))
    return by, rows, nokey


def classify(variants, fold):
    """One control number's distinct (college, code, title) rows -> a class.

    The institution fold is applied FIRST and the result RE-DEDUPED, because the
    two are different questions and only doing the first gets both wrong:

      * without the fold, one institution entered under two roster names reads
        as a statewide uniqueness violation — which is how 1,371 of these were
        being counted;
      * with the fold but no re-dedupe, a pair that collapses to a single
        identical row reads as a "code written two ways" when there is only one
        way and only one course.

    A cn that collapses to one row is `roster_twin`: the SOURCE says one course.
    It still reaches the artifact as two rows, because the member-college roster
    does not apply the fold — so it is still ambiguous to a consumer, and that is
    counted separately rather than folded away here.
    """
    v = {(fold.get(c, c), code, t) for c, code, t in variants}
    if len(v) == 1:
        return "roster_twin"
    v = sorted(v)
    if len({x[0] for x in v}) > 1:
        return "cross_institution"
    # One institution. Strip the official-code representation of the same course:
    # a college's ANTH 101 also appears as ANTH C1001 once it is assigned a CCN.
    local = [x for x in v if not CCN_RE.match(x[1].upper())]
    if len({(x[1], x[2]) for x in local}) <= 1 and len(local) < len(v):
        return "official_code_variant"
    if len({nz(x[2]) for x in v}) == 1:
        return "code_variant"
    if len({nz(x[1]) for x in v}) == 1:
        return "title_variant"
    return "collision"


CLASSES = [
    ("collision", "TWO REAL COURSES share one control number",
     "The key cannot express which. A re-home is unsafe here and an audit "
     "worklist item upstream in COCI."),
    ("cross_institution", "Two INSTITUTIONS share one control number",
     "A control number is supposed to be unique statewide. Upstream COCI/college "
     "data error; not repairable here."),
    ("official_code_variant", "One course carrying both its local and its CCN code",
     "The C-ID/CCN cutover, working as intended. Not a defect — but it still "
     "makes the key non-unique, so a drag still cannot tell the rows apart."),
    ("code_variant", "One course whose code is written two ways",
     "A formatting/representation artifact (KFIT 6.2 / KFIT 62). Cosmetic, "
     "except that it too makes the key non-unique."),
    ("title_variant", "One course whose title is written two ways",
     "Same course, reworded. Cosmetic."),
    ("roster_twin", "ONE course, under an institution entered twice",
     "Not ambiguous in the source at all once the declared fold is applied — but "
     "the member roster never applies it, so the artifact still carries two rows "
     "under two college names and the key still cannot tell them apart."),
]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=os.path.join("kb", "control_number_audit"))
    ap.add_argument("--date", default=_dt.date.today().isoformat(),
                    help="receipt date stamp (default today)")
    args = ap.parse_args()

    fold = load_rules()
    print(f"reading {os.path.relpath(RAW, ROOT)} …")
    by, rows, nokey = read_raw()
    amb = {cn: v for cn, v in by.items() if len(v) > 1}
    counts = collections.Counter()
    members = collections.defaultdict(list)
    owners = collections.defaultdict(collections.Counter)
    for cn, v in amb.items():
        k = classify(v, fold)
        counts[k] += 1
        members[k].append(cn)
        for c, _, _ in v:
            owners[k][fold.get(c, c)] += 1

    # How much of the fold's work is invisible without it — the number that made
    # a roster defect look like a statewide-uniqueness epidemic.
    unfolded = sum(1 for v in amb.values() if len({c for c, _, _ in v}) > 1)
    absorbed = unfolded - counts["cross_institution"]

    # ── the consumer side: what SkyView can actually drag ────────────────────
    drag = {}
    mp = os.path.join(ROOT, "prototype", "ccr_universe_members.json")
    if os.path.exists(mp):
        pay = json.load(open(mp, encoding="utf-8"))
        seen = collections.defaultdict(set)
        for ident, recs in pay["m"].items():
            for c_n, code, ci in recs:
                seen["CCC%09d" % c_n].add((code, ci))
        ambset = {cn for cn, v in seen.items() if len(v) > 1}
        hit_rows = sum(1 for recs in pay["m"].values()
                       for c_n, _, _ in recs if "CCC%09d" % c_n in ambset)
        hit_ids = {ident for ident, recs in pay["m"].items()
                   if any("CCC%09d" % c_n in ambset for c_n, _, _ in recs)}
        drag = {"payload_rows": sum(len(v) for v in pay["m"].values()),
                "payload_cns": len(seen), "ambiguous_cns": len(ambset),
                "draggable_rows_on_an_ambiguous_key": hit_rows,
                "identities_showing_one": len(hit_ids),
                "counter_reports": pay["counts"].get("cn_on_multiple_identities")}

    # ── the roster the fold never reaches ───────────────────────────────────
    roster = {}
    mp2 = os.path.join(ROOT, "prototype", "ccr_universe_members.json")
    if os.path.exists(mp2):
        names = json.load(open(mp2, encoding="utf-8")).get("colleges") or []
        hits = []
        for nm in names:
            if nm in fold:
                hits.append((nm, f"the fold maps it to `{fold[nm]}`"))
            elif "\u00c3" in nm or "\u00c2" in nm:
                # utf-8 read as latin-1. Worth calling out separately: unlike the
                # duplicate-entry case there is no correct spelling to fold FROM
                # here, because the raw export carries only the broken one.
                hits.append((nm, "mis-encoded — utf-8 read as latin-1, and the "
                                 "raw COCI export carries no correct spelling to "
                                 "fold from"))
        roster = {"n": len(names), "hits": hits}

    outdir = os.path.join(ROOT, args.out)
    os.makedirs(outdir, exist_ok=True)
    md = os.path.join(outdir, f"{args.date}.md")
    with open(md, "w", encoding="utf-8") as fh:
        w = fh.write
        w(f"# Is a CourseControlNumber a unique course key?\n\n")
        w(f"Audit of `kb/reference/coci_course_list.xlsx` — {args.date}. "
          f"Generated by `kb/_audit_control_number_claims.py`. READ-ONLY.\n\n")
        w(f"- raw rows: **{rows:,}**\n")
        w(f"- rows with no usable control number (blank or a `NULL` sentinel): "
          f"**{nokey:,}** — these cannot be dragged at all\n")
        w(f"- distinct control numbers: **{len(by):,}**\n")
        w(f"- control numbers resolving to more than one row **as the artifact "
          f"builds them**: **{len(amb):,}** ({len(amb)/max(len(by),1)*100:.2f}%)\n")
        w(f"- of those, naming more than one course **in the source, once the "
          f"declared institution fold is applied**: "
          f"**{len(amb)-counts['roster_twin']:,}**\n\n")
        w("Both numbers are true and they answer different questions. The first "
          "is what a consumer sees and what the `CN:` write key has to cope with; "
          "the second is what the data actually says.\n\n")
        w("## The classes want different repairs\n\n")
        w("| Count | Class | What it is |\n|---:|---|---|\n")
        for key, label, why in CLASSES:
            w(f"| {counts[key]:,} | {label} | {why} |\n")
        w(f"\n**{absorbed:,}** of these read as *two institutions* until the "
          "declared fold in `kb/reference/map_college_roster_rules.json` is "
          "applied — one institution entered under two roster names "
          "(`… Continuing Education` / `… Continuing Education Credit`). "
          "That file is consulted where college names enter the EACR adoption "
          "payload; the member-college roster (`mcolleges`, built by `_mc()`) "
          "does not consult it, so both spellings reach the member tables.\n\n")
        if drag:
            w("## What SkyView can drag\n\n")
            w(f"- member rows in the payload: **{drag['payload_rows']:,}** over "
              f"**{drag['payload_cns']:,}** control numbers\n")
            w(f"- control numbers naming >1 course *in the payload*: "
              f"**{drag['ambiguous_cns']:,}**\n")
            w(f"- **draggable rows whose write key names more than one course: "
              f"{drag['draggable_rows_on_an_ambiguous_key']:,}**, across "
              f"{drag['identities_showing_one']:,} identities\n")
            w(f"- the payload's own `cn_on_multiple_identities` counter reports "
              f"**{drag['counter_reports']:,}** — a different question (one course "
              "claimed by several identities), so it neither contains nor bounds "
              "the number above\n\n")
        # The two classes that are actual defects are also the two that name
        # somebody who can fix them. A worklist without an owner is a statistic.
        for key in ("collision", "cross_institution"):
            if not counts[key]:
                continue
            label = next(l for k, l, _ in CLASSES if k == key)
            w(f"## Who carries them — {label}\n\n")
            w(f"{counts[key]:,} control numbers, across "
              f"{len(owners[key]):,} institutions.\n\n")
            w("| Rows | Institution |\n|---:|---|\n")
            for name, n in owners[key].most_common():
                w(f"| {n:,} | {name} |\n")
            w("\n")
        # The same unapplied fold, showing up as something a curator READS.
        if roster:
            w("## The member roster the fold does not reach\n\n")
            w(f"`unified_courses_members.js` carries **{roster['n']}** college "
              "names, built by `_mc()` straight from the raw COCI list. It never "
              "consults `kb/reference/map_college_roster_rules.json`, so a name "
              "the fold would repair reaches a curator's screen as typed:\n\n")
            for nm, why in roster["hits"]:
                w(f"- `{nm}` — {why}\n")
            w("\n")
        w("## Examples\n\n")
        for key, label, _ in CLASSES:
            ex = sorted(members[key])[:3]
            if not ex:
                continue
            w(f"### {label} ({counts[key]:,})\n\n")
            for cn in ex:
                w(f"- `{cn}`\n")
                for c, code, t in sorted(by[cn]):
                    w(f"  - `{code}` — {t} @ {c}\n")
            w("\n")

    js = os.path.join(outdir, f"{args.date}.json")
    json.dump({"_about": "Control-number uniqueness audit. READ-ONLY receipt.",
               "generated": args.date, "raw_rows": rows, "rows_no_key": nokey,
               "distinct_control_numbers": len(by), "ambiguous": len(amb),
               "absorbed_by_roster_fold": absorbed,
               "classes": {k: counts[k] for k, _, _ in CLASSES},
               "skyview": drag,
               "owners": {k: dict(v) for k, v in owners.items()},
               "roster_names_fold_does_not_reach": roster.get("hits") or [],
               "members": {k: sorted(v) for k, v in members.items()}},
              open(js, "w", encoding="utf-8"), indent=1)

    print(f"\n  raw rows {rows:,} · distinct control numbers {len(by):,} · "
          f"no key {nokey:,}")
    print(f"  resolving to >1 row as built: {len(amb):,}  "
          f"(in the source after folding: {len(amb)-counts['roster_twin']:,})")
    for key, label, _ in CLASSES:
        print(f"    {counts[key]:6,d}  {label}")
    print(f"  {absorbed:,} absorbed by the declared roster fold")
    if drag:
        print(f"  SkyView: {drag['draggable_rows_on_an_ambiguous_key']:,} draggable "
              f"rows carry a key naming >1 course")
    print(f"\nwrote {os.path.relpath(md, ROOT)} and {os.path.relpath(js, ROOT)}")


if __name__ == "__main__":
    main()
