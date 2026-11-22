#!/usr/bin/env python3
"""File Sam's held Cerritos subject decisions as kb_curation rows (S701, #3655): the forward SQL and its rollback.

Sam decided a common subject code for 30 Cerritos local subject codes on 2026-11-21 (relayed by COBIx on #3655) and
revised ATH to KINE on 2026-11-22 (r-athletics-under-kine-sam-2026-11-22). The session held them as an answer set
until the save path was approved; Sam approved it on 2026-11-22 (r-subject-save-path-kb-curation-sam-2026-11-22).
This builder writes them on that path, as the Subjects page's Save writes a person's decision:

  course_id  SUBJ:<college slug>|<local code>|<band>
  field      subject_decision
  value      JSON text; here {"common_code", "decided_by", "decided_at", "source"} (no local_title: Sam decided codes)

The band is the page's rule (commons_subjects.js bandOf), read from kb/status/local_subject_titles.json: credit where
COCI lists a credit course under the code, whole where COCI lists no course under it. A decision on a code whose COCI
courses are all noncredit is refused: noncredit decisions wait on the noncredit title list (r-noncredit-hold-sam-
2026-11-21). Every common code must be a canonical SUBJ in kb/discipline_canonical_subj4.json.

Rule 10: INSERT only, ON CONFLICT (course_id, field) DO NOTHING, so a person's saved row stands; one cohort,
subjects-s701@bot (reviewer_label is generated from reviewer_email, so the cohort id is the label too); the rollback
deletes that cohort's subject_decision rows and nothing else. Neither file is pointed at by kb/migrations/.apply: the
conductor applies after a second read. No clock is read, so a second run writes identical files.

Run:  python3 kb/_file_subject_decisions.py           write the two SQL files
      python3 kb/_file_subject_decisions.py --check   exit 1 if either file differs from what the inputs give
"""
import hashlib
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DECISIONS = "kb/reference/subject_code_decisions_cerritos_2026-11-21.json"
TITLES = "kb/status/local_subject_titles.json"
CANONICAL = "kb/discipline_canonical_subj4.json"
FORWARD = "kb/migrations/2026-11-22_s701_subject_decisions.sql"
ROLLBACK = "kb/migrations/2026-11-22_s701_subject_decisions_rollback.sql"
COHORT = "subjects-s701@bot"
PREFIX = "SUBJ:"
FIELD = "subject_decision"


def read_json(rel):
    with open(os.path.join(ROOT, rel), encoding="utf-8") as f:
        return json.load(f)


def band_of(row):
    """credit, whole, or noncredit (no decision files) — the page's bandOf."""
    if (row.get("credit_courses") or 0) > 0:
        return "credit"
    if (row.get("noncredit_courses") or 0) > 0:
        return "noncredit"
    return "whole" if not (row.get("state_courses") or 0) else "credit"


def key(slug, code, band):
    if "|" in code or "|" in slug:
        raise ValueError("a key segment may not hold |: %s %s" % (slug, code))
    return PREFIX + slug + "|" + code + "|" + band


def sql_text(s):
    return "'" + s.replace("'", "''") + "'"


def plan():
    dec = read_json(DECISIONS)
    titles = read_json(TITLES)
    canon = {v.get("canonical_subj4") for v in read_json(CANONICAL).get("disciplines", {}).values()}
    cols = titles["columns"]
    rows_by = {}
    for c in titles["colleges"]:
        for r in c["rows"]:
            rows_by[(c["slug"], r[0])] = dict(zip(cols, r))
    revised = {x["local_code"]: x for x in dec.get("revised") or []}
    source = ("%s; Sam's decisions of %s relayed by %s" % (DECISIONS, dec["decided_at"][:10], dec["relayed_by"]))
    out = []
    for d in dec["decisions"]:
        code, slug, common = d["local_code"], d["college"], d["common_code"]
        row = rows_by.get((slug, code))
        if row is None:
            raise SystemExit("REFUSED: %s %s is not in %s" % (slug, code, TITLES))
        band = band_of(row)
        if band == "noncredit":
            raise SystemExit("REFUSED: %s %s holds only noncredit courses; noncredit decisions are on hold" % (slug, code))
        if common not in canon:
            raise SystemExit("REFUSED: %s is not a canonical SUBJ in %s" % (common, CANONICAL))
        value = {"common_code": common, "decided_by": dec["decided_by"], "decided_at": dec["decided_at"], "source": source}
        if code in revised:
            rv = revised[code]
            value["revised"] = {"from": rv["from"], "to": rv["to"], "by": rv["by"], "on": rv["on"], "memory": rv["memory"]}
        out.append({"course_id": key(slug, code, band), "band": band, "common_code": common,
                    "value": json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))})
    ids = [x["course_id"] for x in out]
    if len(set(ids)) != len(ids):
        raise SystemExit("REFUSED: two decisions share a key")
    return dec, out


def digest(dec):
    return hashlib.sha256(json.dumps(dec["decisions"], ensure_ascii=False, sort_keys=True,
                                     separators=(",", ":")).encode("utf-8")).hexdigest()


def render(dec, rows):
    n = len(rows)
    bands = {}
    for r in rows:
        bands[r["band"]] = bands.get(r["band"], 0) + 1
    band_words = ", ".join("%d %s" % (bands[b], b) for b in sorted(bands))
    head = [
        "-- Sam's %d Cerritos subject decisions as kb_curation rows (S701, #3655). PREPARED, NOT APPLIED, and NOT pointed at" % n,
        "-- by kb/migrations/.apply: the conductor applies it after a second read.",
        "-- Written by kb/_file_subject_decisions.py from %s (decisions sha256 %s)" % (DECISIONS, digest(dec)),
        "-- and %s (bands). Ruling: r-subject-save-path-kb-curation-sam-2026-11-22 (\"Fine.\"); ATH is KINE" % TITLES,
        "-- (r-athletics-under-kine-sam-2026-11-22). Key SUBJ:<college>|<local code>|<band>, field subject_decision; %s." % band_words,
        "-- The value carries the common code and who decided it; Sam decided codes, so no local_title is filed.",
        "-- Rule 10: INSERT only, ON CONFLICT (course_id, field) DO NOTHING, so a row a person saved first stands. One cohort,",
        "-- reviewer_email %s; reviewer_label is generated from it and reads the same cohort id." % COHORT,
        "-- Privacy (Rule 10 a3): a college slug, a subject code and a common code per row, and the cohort id; no student or",
        "-- staff detail. kb/governance_surface_map.json maps field:kb_curation.subject_decision to DR-25.",
        "-- ROLLBACK: %s" % ROLLBACK,
        "insert into public.kb_curation (course_id, field, value, reviewer_email) values",
    ]
    vals = ["  (%s, %s, %s, %s)" % (sql_text(r["course_id"]), sql_text(FIELD), sql_text(r["value"]), sql_text(COHORT)) for r in rows]
    body = ",\n".join(vals) + "\non conflict (course_id, field) do nothing;\n"
    tail = ("\n-- Read back (expect %d rows under the cohort; any key a person held first shows its own reviewer):\n"
            "select json_build_object('cohort_rows', count(*) filter (where reviewer_email = %s),\n"
            "  'keys', count(*), 'credit', count(*) filter (where course_id like '%%|credit'),\n"
            "  'whole', count(*) filter (where course_id like '%%|whole'))\n"
            "from public.kb_curation where field = %s and course_id like 'SUBJ:cerritos|%%';\n"
            % (n, sql_text(COHORT), sql_text(FIELD)))
    forward = "\n".join(head) + "\n" + body + tail
    rollback = (
        "-- Rollback of %s (S701). Deletes only the cohort's subject_decision rows, so a row a person saved\n"
        "-- under the same key (their own reviewer_email) stays. Per docs/reference/data_write_rollback.md, read live first\n"
        "-- and hold out any row changed since the apply.\n"
        "delete from public.kb_curation where reviewer_email = %s and course_id like 'SUBJ:%%' and field = %s;\n"
        % (FORWARD, sql_text(COHORT), sql_text(FIELD)))
    return forward, rollback


def main(argv):
    dec, rows = plan()
    forward, rollback = render(dec, rows)
    files = {FORWARD: forward, ROLLBACK: rollback}
    if "--check" in argv:
        stale = []
        for rel, text in files.items():
            try:
                with open(os.path.join(ROOT, rel), encoding="utf-8") as f:
                    if f.read() != text:
                        stale.append(rel)
            except OSError:
                stale.append(rel)
        if stale:
            print("behind its inputs: " + ", ".join(stale) + "; run python3 kb/_file_subject_decisions.py")
            return 1
        print("the subject decision filing is current")
        return 0
    for rel, text in files.items():
        with open(os.path.join(ROOT, rel), "w", encoding="utf-8") as f:
            f.write(text)
    bands = {}
    for r in rows:
        bands[r["band"]] = bands.get(r["band"], 0) + 1
    print("%s: %d rows %s; %s" % (FORWARD, len(rows), json.dumps(bands, sort_keys=True), ROLLBACK))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
