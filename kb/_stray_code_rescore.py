#!/usr/bin/env python3
"""The stray-code rescore as a 0-100 confidence (S733; Sam, 2026-11-25: "i want to use confidence bars 0-100 rather
than low, med, high throughout all commons procedures", r-confidence-0-100-in-all-commons-procedures-sam-2026-11-25).

Reads kb/subject_title_hunt/20261125_stray_code_rescore.csv (116 local subjects behind the stray M-ID codes, S730's
rescore with S733's titles) and writes, in place, a `confidence` column (0-100) for its proposed common subject, then
the list a person picks from (every row under THRESHOLD), kb/subject_title_hunt/20261125_stray_codes_a_person_picks.md.

THE SCORE, each part a measured rate, never a chosen one:
  - the statewide model's calibrated probability that the code's common subject is the proposal
    (kb/status/statewide_subject_codes.json `recommend`, or its `next`); a person's statewide filing reads 100;
  - where the college's own catalog heading names the discipline, at least TITLE_NAMES (91: the title source was right
    on 9 of 9 of Sam's 30 decisions, kb/status/local_subject_recommendations.json `common_code.sams_30`, as (9+1)/(9+2));
  - where the heading and the filing name different disciplines, at most DISAGREE (the two signals cancel: 50 at most,
    since neither outweighs the other);
  - with no title of the college's own, at most DISAGREE: the statewide model and filing read the letters alone, and
    one code can mean two subjects at two colleges (S730: Glendale's AT), so nothing checks the call;
  - a row with no proposal takes the model's top call as its suggestion and its probability as the score.
THRESHOLD (90) is the band where the statewide model's own self-recall holds (calls at 0.9 or more were right 97% of
the time, `self_recall` in kb/status/statewide_subject_codes.json); below it a person picks.

Usage: python3 kb/_stray_code_rescore.py [--check]
"""
import csv
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CSV = os.path.join(ROOT, "kb", "subject_title_hunt", "20261125_stray_code_rescore.csv")
PICKS = os.path.join(ROOT, "kb", "subject_title_hunt", "20261125_stray_codes_a_person_picks.md")
STATEWIDE = os.path.join(ROOT, "kb", "status", "statewide_subject_codes.json")
TITLE_NAMES, DISAGREE, THRESHOLD = 91, 50, 90
TITLE_BASIS = "the title names the discipline"
DISAGREE_BASES = ("title and filing disagree: a person picks",)


def code_key(s):
    return "".join(ch for ch in str(s or "").upper() if ch.isalnum() or ch == "&")


def statewide():
    with open(STATEWIDE, encoding="utf-8") as f:
        return {code_key(c["code"]): c for c in json.load(f)["codes"]}


def score(row, sw):
    rec = (sw.get(code_key(row["local_subject"])) or {}).get("recommend") or {}
    nxt = rec.get("next") or {}
    prop = row.get("proposed_common_subject") or ""
    suggested = prop or rec.get("common") or ""
    if suggested and rec.get("common") == suggested:
        p = rec.get("confidence") or 0
    elif suggested and nxt.get("common") == suggested:
        p = nxt.get("confidence") or 0
    else:
        p = 0
    s = round(100 * p)
    if row.get("basis") == TITLE_BASIS:
        s = max(s, TITLE_NAMES)
    if row.get("basis") in DISAGREE_BASES or not str(row.get("local_subject_title") or "").strip():
        s = min(s, DISAGREE)
    return s, suggested, (rec.get("discipline") if suggested == rec.get("common") else None)


def build():
    with open(CSV, encoding="utf-8", newline="") as f:
        rows = list(csv.DictReader(f))
    sw = statewide()
    for r in rows:
        s, sug, disc = score(r, sw)
        r["confidence"] = str(s)
        r["suggested_common_subject"] = sug
        if not r.get("discipline") and disc:
            r["discipline"] = disc
        r.pop("level", None)
    fields = ["college", "local_subject", "local_subject_title", "proposed_common_subject", "suggested_common_subject",
              "discipline", "confidence", "basis", "filed_common", "filed_by", "courses", "stray_mids",
              "sample_course_titles", "rescored"]
    out = [",".join(fields)]
    import io
    buf = io.StringIO()
    w = csv.DictWriter(buf, fieldnames=fields, lineterminator="\n", extrasaction="ignore")
    w.writeheader()
    w.writerows(rows)
    picks = sorted((r for r in rows if int(r["confidence"]) < THRESHOLD),
                   key=lambda r: (-int(r["confidence"]), r["college"], r["local_subject"]))
    md = ["# Stray-code local subjects a person picks (S733, 2026-11-25)", "",
          "The %d local subjects behind the stray M-ID codes whose common subject scores under %d of 100, from "
          "`20261125_stray_code_rescore.csv` (`kb/_stray_code_rescore.py` says how the score is measured). Each line: the "
          "confidence, the college, the local code and its title, the courses on it, sample course titles, and the "
          "suggested common subject where one source names one." % (len(picks), THRESHOLD), "",
          "| Confidence | College | Local subject | Title | Courses | Sample course titles | Suggested |",
          "|---|---|---|---|---|---|---|"]
    for r in picks:
        sug = r["suggested_common_subject"]
        if sug and r.get("discipline"):
            sug += " " + r["discipline"]
        md.append("| %s | %s | %s | %s | %s | %s | %s |" % (
            r["confidence"], r["college"], r["local_subject"], r["local_subject_title"] or "(none)", r["courses"],
            r["sample_course_titles"].replace("|", "/")[:90], sug))
    return rows, buf.getvalue(), "\n".join(md) + "\n"


def main(argv):
    rows, csv_text, md = build()
    if "--check" in argv:
        with open(CSV, encoding="utf-8") as f:
            a = f.read()
        with open(PICKS, encoding="utf-8") as f:
            b = f.read()
        if a != csv_text or b != md:
            print("stray-code rescore is stale: run python3 kb/_stray_code_rescore.py")
            return 1
        print("stray-code rescore is current")
        return 0
    with open(CSV, "w", encoding="utf-8") as f:
        f.write(csv_text)
    with open(PICKS, "w", encoding="utf-8") as f:
        f.write(md)
    n = sum(1 for r in rows if int(r["confidence"]) >= THRESHOLD)
    print("stray-code rescore: %d of %d at %d or more; %d for a person" % (n, len(rows), THRESHOLD, len(rows) - n))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
