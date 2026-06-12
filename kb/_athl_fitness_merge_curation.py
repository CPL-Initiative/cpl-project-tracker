#!/usr/bin/env python3
"""ATHL roster-family + KINE fitness merge curation (Session 51, Sam-directed).

ANALYZE by default (prints every family + verdict, writes the analysis
receipt); ``--apply`` writes the AUTO-verdict merges as curation rows into
kb/coci_curation.json and emits the matching Supabase upsert ops
(kb/kin_pe_pass2_out/<date>/supabase_merge_ops.json) — the operator executes
those in the same window and verifies SELECT-back == overlay.

These are CURATION merges (kb_curation ``merge_into`` + ``unified_title``),
the same record the worklist Confirm writes — reversible by deleting the
rows, never a file-level re-key. Sam directed both sets on 2026-06-12:
"KINE M1607 Fitness and Wellness should be merged with Intro to Fitness (as
well as several other fitness MIDs … Walking for Fitness should keep its
lane" + "(KINE M1265 Basketball, Men) should move to ATHL and merging
analysis done".

ATHLETICS AUTO-MERGE CONTRACT (frozen — everything else is FLAGGED for the
worklist, never auto-merged):
  * rows are post-pass-2 ATHL minted parents;
  * facet-parse the title: sport, gender, season markers, level markers,
    course type;
  * a family = (sport, gender, band); AUTO only when every member is
    type=ROSTER (the team course itself: "Intercollegiate X", "Varsity X",
    "X Team …", "X, Men") with NO season marker (fall/spring/off/pre-season
    lanes stay distinct) and NO level marker (the ordinal rule: 2/3/4 and
    II/III/IV are distinct enrollment levels);
  * gender must be explicit, OR implied by a single-gender CCCAA sport
    (baseball/football -> men, softball/beach- and sand-volleyball -> women);
    unmarked rows of dual-gender sports are FLAGGED, not merged;
  * target = largest corroboration (tie: lowest id); unified_title =
    "Intercollegiate <Sport>" (+ " — Men/Women" for dual-gender sports).

FITNESS SETS (hand-frozen from the 2026-06-12 analysis of the 130-row
fitness/wellness family; the receipt records the keep-out reasoning —
noncredit M9017 keeps its band lane, Walking keeps its lane per Sam, leveled
ladders + modality lanes + the 3-unit lecture lane stay distinct).
"""
import json
import os
import re
import sys
from collections import defaultdict
from datetime import datetime, timezone

APPLY = "--apply" in sys.argv
SD = os.path.dirname(os.path.abspath(__file__))


def kb(p):
    return os.path.join(SD, p)


NOW = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.123456+00:00")
REVIEWER = "MAP@rccd.edu"

# ── fitness sets (KINE parents; all verified live + same band below) ─────────
FITNESS_SETS = [
    {"target": "KINE M1596", "title": "Physical Fitness",
     "members": ["KINE M1607", "KINE M1561", "KINE M1593", "KINE M1595",
                  "KINE M1556", "KINE M1605", "KINE M1587", "KINE M1603",
                  "KINE M1589"],
     "why": "the general-fitness activity course (0.5–1u credit): Fitness and "
            "Wellness / Fitness and Health / Personal Fitness (+ and Wellness) / "
            "Fitness / Ultimate Fitness / Life Fitness / Total Fitness / Lifetime "
            "Fitness — one concept, many names; target = largest (12 colleges)."},
    {"target": "KINE M1582", "title": "Lifelong Fitness Lab",
     "members": ["KINE M1584"],
     "why": "Lab vs Laboratory spelling twins (fam key missed: lab != laboratory)."},
    {"target": "KINE M1586", "title": "Fitness for Life",
     "members": ["KINE M1590"],
     "why": "Fitness For Life / Fitness For Living — the 3-unit lecture course."},
    {"target": "KINE M1305", "title": "Walking/Jogging for Fitness — Beginning",
     "members": ["KINE M1577", "KINE M1284"],
     "why": "Introduction / Beginner / Beginning of the walk-jog combo course — "
            "same level, same modality (within-lane merge; Walking lanes stay)."},
]
FITNESS_KEEP_OUT = [
    ("KINE M9017", "Introduction to Physical Fitness", "NONCREDIT (band 9) — merging into a "
     "credit M1### identity breaks the banded-number contract and manufactures a "
     "unit_anomaly over-merge; it keeps the noncredit intro-fitness lane"),
    ("KINE M1606", "Walking for Fitness", "Sam: keeps its lane (walking modality); also "
     "already over-merge-flagged at 38 members — do not grow it"),
    ("KINE M1586", "Fitness for Life", "3-unit lecture lane target (F3) — distinct from the "
     "1-unit activity course F1"),
    ("KINE M1560", "Foundation for Fitness and Wellness", "3-unit lecture, distinct "
     "'Foundations' concept — candidate for a later curator look vs M1586"),
    ("KINE M1604", "Total Fitness for Women", "gendered section stays distinct"),
    ("KINE M1585", "Physical Fitness Laboratory", "lab-format lane (Fitness Lab ladder "
     "exists Beginning/Intermediate/Advanced) — not the lecture/activity course"),
]

# ── athletics facet parser ───────────────────────────────────────────────────
SPORTS = ["beach volleyball", "sand volleyball", "water polo", "cross country",
          "track and field", "swimming and diving", "flag football", "touch football",
          "baseball", "basketball", "softball", "soccer", "football", "volleyball",
          "swimming", "tennis", "golf", "badminton", "wrestling", "track",
          "cheer", "pep squad", "esports", "electronic sports"]
SINGLE_GENDER = {"baseball": "men", "football": "men", "softball": "women",
                 "beach volleyball": "women", "sand volleyball": "women"}
SEASON = re.compile(r"\b(fall|spring|summer|winter)\b|off.?season|pre.?season|out.?of.?season|in.?season", re.I)
LEVEL = re.compile(r"\b(?:[1234]|i{1,3}|iv|advanced|beginning|intermediate|beginner|elite)\b", re.I)
NON_ROSTER = re.compile(r"condition|strength|training|skills?\b|fundament|foundation|techni|theor|strateg|analy|apprec|officiat|coach|academic|success|orientation|topics|experimental|fitness|development|workshop|summer|camp|prep\b|defense|offense|special teams", re.I)
ROSTER_HINT = re.compile(r"intercollegiate|varsity|\bteam\b|athletics|competitive|intrcol", re.I)
GENDER_RE = re.compile(r"\b(men|women|man|woman|coed|co-ed)(?:'s)?\b", re.I)


def facet(title):
    t = " " + re.sub(r"[^a-z0-9' ]+", " ", str(title or "").lower()) + " "
    sport = next((s for s in SPORTS if f" {s} " in re.sub(r"\s+", " ", t)), None)
    genders = {{"man": "men", "woman": "women"}.get(m.group(1).lower(), m.group(1).lower())
               for m in GENDER_RE.finditer(t)}
    if {"men", "women"} <= genders or "coed" in genders or "co-ed" in genders:
        gender = "coed"   # "(Men and Women)" titles must never join a gendered group
    else:
        gender = next(iter(genders), None)
    season = bool(SEASON.search(t))
    level = bool(LEVEL.search(t))
    roster = bool(ROSTER_HINT.search(t)) and not NON_ROSTER.search(t)
    bare_roster = bool(sport) and not NON_ROSTER.search(t) and not ROSTER_HINT.search(t)
    competitive = "competitive" in t
    return {"sport": sport, "gender": gender, "season": season, "level": level,
            "roster": roster, "bare": bare_roster, "competitive": competitive}


def main():
    cat = json.load(open(kb("coci_minted_courses.json")))
    C = cat["courses"]
    cdoc = json.load(open(kb("coci_curation.json")))
    CU = cdoc.setdefault("curations", {})

    # ── validate the fitness sets ────────────────────────────────────────────
    fit_rows = []
    for s in FITNESS_SETS:
        ids = [s["target"]] + s["members"]
        for i in ids:
            assert i in C, f"fitness id not live: {i}"
            assert i.split("M")[-1][0] == ids[0].split("M")[-1][0], f"band mix in {s['target']} set"
            assert not (isinstance(CU.get(i), dict) and CU[i].get("merge_into")), f"{i} already merged"
        fit_rows.append(s)

    # ── athletics families ───────────────────────────────────────────────────
    athl = {k: v for k, v in C.items() if v.get("subject_4letter") == "ATHL"}
    fams = defaultdict(list)
    odd = []
    for cid, v in sorted(athl.items()):
        f = facet(v.get("common_title"))
        band = cid.split("M")[-1][0]
        if not f["sport"]:
            odd.append((cid, v.get("common_title"), "no sport parsed"))
            continue
        gender = f["gender"] or SINGLE_GENDER.get(f["sport"])
        fams[(f["sport"], gender, band)].append((cid, v, f))

    auto, flagged = [], []
    for (sport, gender, band), members in sorted(fams.items(), key=lambda kv: (kv[0][0], kv[0][1] or "", kv[0][2])):
        rosters = [(cid, v, f) for cid, v, f in members
                   if (f["roster"] or f["bare"]) and not f["season"] and not f["level"]
                   and not f["competitive"]]
        rest = [(cid, v, f) for cid, v, f in members if (cid, v, f) not in rosters]
        explicit_ok = gender is not None or sport in ("cheer", "pep squad", "swimming and diving")
        unmarked = [(cid, v, f) for cid, v, f in rosters
                    if f["gender"] is None and sport not in SINGLE_GENDER]
        mergeable = [m for m in rosters if m not in unmarked] if gender else []
        if sport in SINGLE_GENDER:
            mergeable = rosters
        entry = {"sport": sport, "gender": gender, "band": band,
                 "rosters": [(c, v.get("common_title"), v.get("corroboration_members") or 0)
                             for c, v, f in rosters],
                 "other_lanes": [(c, v.get("common_title")) for c, v, f in rest],
                 "unmarked_dual_gender": [(c, v.get("common_title")) for c, v, f in unmarked]}
        if len(mergeable) >= 2 and explicit_ok:
            tgt = max(mergeable, key=lambda m: ((m[1].get("corroboration_members") or 0), m[0]))
            title = "Intercollegiate " + " ".join(
                w if w == "and" else w.capitalize() for w in sport.split())
            if sport not in SINGLE_GENDER and gender in ("men", "women"):
                title += " — " + gender.title()
            entry["verdict"] = "AUTO"
            entry["target"] = tgt[0]
            entry["unified_title"] = title
            entry["merge_members"] = [c for c, v, f in mergeable if c != tgt[0]]
            auto.append(entry)
        else:
            entry["verdict"] = "FLAG (n<2 mergeable, or gender unresolved)"
            flagged.append(entry)

    # ── report ───────────────────────────────────────────────────────────────
    print(f"ATHL roster families: {len(fams)} | AUTO-merge groups: {len(auto)} | "
          f"flag-only: {len(flagged)} | unparsed: {len(odd)}")
    n_rows = 0
    for e in auto:
        print(f"\n  AUTO {e['sport']} / {e['gender']} / band {e['band']} -> {e['target']} "
              f"\"{e['unified_title']}\"")
        for c, t, n in e["rosters"]:
            mark = "TARGET" if c == e["target"] else ("merge " if c in e["merge_members"] else "      ")
            print(f"     {mark} {c:12} ({n:>2}) {t}")
        n_rows += len(e["merge_members"]) + 1
    print(f"\n  curation rows to write: {n_rows} (members + unified_title targets) "
          f"+ {sum(len(s['members']) + 1 for s in fit_rows)} fitness rows")

    outdir = kb(os.path.join("kin_pe_pass2_out", datetime.now().strftime("%Y-%m-%d")))
    os.makedirs(outdir, exist_ok=True)
    lines = ["# ATHL roster-family merging analysis + fitness merge sets — Session 51 "
             f"({datetime.now():%Y-%m-%d})", "",
             "Sam's directive (2026-06-12): athletics M-IDs moved to ATHL get a merging",
             "analysis; the fitness family consolidates (Walking keeps its lane).",
             "AUTO groups below were applied as kb_curation merges (reversible);",
             "FLAG groups are surfaced for the worklist/curator, never auto-merged.", ""]
    lines.append("## Fitness merges (KINE)\n")
    for s in fit_rows:
        lines.append(f"- **{s['target']}** ← {', '.join(s['members'])} — *{s['title']}*. {s['why']}")
    lines.append("\n### Deliberately NOT merged (fitness)\n")
    for cid, t, why in FITNESS_KEEP_OUT:
        lines.append(f"- `{cid}` *{t}* — {why}")
    lines.append("\n## ATHL roster families — AUTO\n")
    for e in auto:
        lines.append(f"### {e['sport']} / {e['gender'] or '—'} / band {e['band']} → `{e['target']}` "
                     f"“{e['unified_title']}”")
        for c, t, n in e["rosters"]:
            tag = "**TARGET**" if c == e["target"] else ("MERGED" if c in e["merge_members"] else "kept")
            lines.append(f"- {tag} `{c}` ({n} colleges) {t}")
        if e["unmarked_dual_gender"]:
            lines.append(f"- _unmarked-gender rows held out:_ " +
                         ", ".join(f"`{c}` {t}" for c, t in e["unmarked_dual_gender"]))
        lines.append("")
    lines.append("## ATHL roster families — FLAGGED (curator review; not merged)\n")
    for e in flagged:
        lines.append(f"### {e['sport']} / {e['gender'] or 'gender unresolved'} / band {e['band']}")
        for c, t, n in e["rosters"]:
            lines.append(f"- roster-ish `{c}` ({n}) {t}")
        for c, t in e["unmarked_dual_gender"]:
            lines.append(f"- unmarked `{c}` {t}")
        for c, t in e["other_lanes"][:14]:
            lines.append(f"- other-lane `{c}` {t}")
        lines.append("")
    if odd:
        lines.append("## Unparsed ATHL titles (no sport facet)\n")
        for c, t, why in odd:
            lines.append(f"- `{c}` {t} — {why}")
    open(os.path.join(outdir, "athl_family_analysis.md"), "w").write("\n".join(lines) + "\n")
    print(f"  analysis -> {os.path.relpath(os.path.join(outdir, 'athl_family_analysis.md'), SD)}")

    if not APPLY:
        print("\nANALYZE only — re-run with --apply to write curation rows + Supabase ops.")
        return

    # ── apply: overlay + Supabase ops ────────────────────────────────────────
    ops = []

    def add_row(cid, field, value):
        e = CU.setdefault(cid, {})
        e[field] = value
        e["reviewed_by"] = REVIEWER
        e["reviewed_at"] = NOW
        ops.append({"course_id": cid, "field": field, "value": value})

    for s in fit_rows:
        for m in s["members"]:
            add_row(m, "merge_into", s["target"])
        add_row(s["target"], "unified_title", s["title"])
    for e in auto:
        for m in e["merge_members"]:
            add_row(m, "merge_into", e["target"])
        add_row(e["target"], "unified_title", e["unified_title"])

    cdoc["count"] = len(CU)
    json.dump(cdoc, open(kb("coci_curation.json"), "w"), ensure_ascii=False, indent=2)
    with open(kb("coci_curation.json"), "a") as f:
        f.write("\n")
    json.dump({"generated_at": NOW, "reviewer": REVIEWER, "ops": ops,
               "sql_template": "INSERT INTO kb_curation (course_id, field, value, reviewer_email, reviewed_at) "
                               "VALUES (%s) ON CONFLICT (course_id, field) DO UPDATE SET "
                               "value = EXCLUDED.value, reviewer_email = EXCLUDED.reviewer_email, "
                               "reviewed_at = EXCLUDED.reviewed_at"},
              open(os.path.join(outdir, "supabase_merge_ops.json"), "w"), ensure_ascii=False, indent=1)
    print(f"  ✓ APPLIED locally: {len(ops)} curation rows -> kb/coci_curation.json")
    print(f"  Supabase ops -> {os.path.relpath(os.path.join(outdir, 'supabase_merge_ops.json'), SD)}"
          f" (execute via MCP in the same window, then SELECT-back verify)")


if __name__ == "__main__":
    main()
