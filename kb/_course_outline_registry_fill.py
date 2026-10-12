#!/usr/bin/env python3
"""Fill the registry's course outline fields from a course outline census run.

Sam, Open Asks Sheet 70 card 1 (2026-10-12 20:40Z): "Apply as a migration", then
fill the fields from a pass over every college that loads pages only. The
migration (program_source_registry_course_outline_2026_10_12, S373) added the
cor_* columns to program_source_registry; this script reads
kb/course_outline_census/census_<run>.json and writes the receipt that fills them:

  kb/receipts/program_source_registry_course_outline_<date>_s<N>.sql

One UPDATE over a VALUES list (a row a college), applied only where cor_checked_run is still null,
so a second apply changes nothing and a row a person filled is kept. The columns
were empty before the first fill, so the rollback sets them back to null where
cor_checked_run is this run (the receipt's last statement, commented out). The
history trigger files every prior row under the run.

Card 2 ("Record and move on", with "look for other repositories for the outcomes
data and record the link"): a sign-in system is recorded as sign_in with no
request to the college, and the page whose SLOs were read, an outline or a
catalog course page, goes in cor_slo_source_url.

The repo's Supabase guard routes an UPDATE to a shared table through
apply_migration, so a session applies the receipt's UPDATE as a migration and
appends the read-back to the receipt (S373: 118 rows, md5 equal to fields()).

Usage: python3 kb/_course_outline_registry_fill.py kb/course_outline_census/census_<run>.json --session 373
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SYSTEMS = {"curriqunet", "curricunet", "elumen", "coursedog", "courseleaf_cim", "kuali", "webcms", "none_found"}
ACCESS = {"public", "sign_in", "refused", "unreached", "not_found"}
OPENED = {"outline_with_slos", "slos", "outline"}
NAMES = {"curriqunet": "CurriQunet", "curricunet": "CurricUNET", "elumen": "eLumen", "coursedog": "Coursedog",
         "courseleaf_cim": "CourseLeaf's curriculum module", "kuali": "Kuali", "webcms": "WebCMS"}


# What the census found, in plain words for a person, the tab and Sierra; {name}
# is the system's name. The receipt derives the same note in SQL from the key.
NOTES = {
    "none": "The course outline census found no course outline system linked from the college's homepage, catalog or curriculum pages.",
    "outline_with_slos": "{name} opens course outlines to the public, and the outline read prints the course's student learning outcomes.",
    "slos": "A public {name} course page prints the course's student learning outcomes.",
    "outline": "{name} opens course outlines to the public; the outline read prints no student learning outcomes heading.",
    "list_only": "{name} answers in public, but the census reached no course's outline from it.",
    "sign_in": "{name} asks for a sign-in. Recorded with no request to the college (Open Asks Sheet 70 card 2).",
    "refused": "{name} refused the census's visit (robots or 401/403). Recorded with no request to the college.",
    "unreached": "{name} did not answer the census.",
}


def note_key(system: str, verdict: str, access: str) -> str:
    if system == "none_found":
        return "none"
    if verdict in ("outline_with_slos", "slos", "outline", "list_only"):
        return verdict
    return access if access in ("sign_in", "refused") else "unreached"


def picked_host(row: dict) -> dict:
    """The host the census recorded for the row (its cor_url is that host's page)."""
    for h in row.get("hosts") or []:
        if row.get("cor_url") in (h.get("final_url"), h.get("url")):
            return h
    return (row.get("hosts") or [{}])[0]


def fields(row: dict, run: str) -> dict:
    """The eight cor_* values for one census row."""
    system = row.get("cor_system") or "none_found"
    if system not in SYSTEMS:
        system = "other"
    verdict = row.get("cor_outline") or "not_probed"
    host = picked_host(row) if system != "none_found" else {}
    outline = host.get("outline") or {}
    proof = row.get("cor_outline_url") if verdict in OPENED else None
    # Known only where an outline or a course page was read: true when it printed
    # outcomes, false when an outline printed none, null where none was reached.
    slos = True if verdict in ("outline_with_slos", "slos") else False if verdict == "outline" else None
    if verdict in OPENED:
        access = "public"
    elif verdict in ("sign_in", "refused", "unreached"):
        access = verdict
    else:
        access = row.get("cor_access") if row.get("cor_access") in ACCESS else "not_found"
    key = note_key(system, verdict, access)
    note = NOTES[key].replace("{name}", NAMES.get(system, system))
    return {
        "cor_system": system,
        "cor_url": outline.get("start") or row.get("cor_url"),
        "cor_access": access,
        "cor_proof_url": proof,
        "cor_prints_slos": slos,
        "cor_slo_source_url": proof if slos else None,
        "cor_note": note,
        "cor_checked_run": "course-outline-census run %s" % run,
    }


def sql_lit(v) -> str:
    if v is None:
        return "null"
    if isinstance(v, bool):
        return "true" if v else "false"
    return "'" + str(v).replace("'", "''") + "'"


def receipt(census: dict, session: int, today: str) -> str:
    run = str(census["run"])
    rows = sorted(census["rows"], key=lambda r: r["college"])
    lines = [
        "-- S%d, %s: the registry's course outline fields, filled from course outline census run %s." % (session, today, run),
        "-- Sam, Open Asks Sheet 70 (2026-10-12 20:40-20:42Z): card 1 \"Apply as a migration\" (then fill from a",
        "-- pages-only pass over every college); card 2 \"Record and move on\", note \"And look for other",
        "-- repositories for the outcomes data and record the link and data in prog reqs\".",
        "-- Written by kb/_course_outline_registry_fill.py from kb/course_outline_census/census_%s.json." % run,
        "-- Counts by cor_access: %s." % json.dumps(_count(rows, run, "cor_access"), sort_keys=True),
        "-- Counts by cor_system: %s." % json.dumps(_count(rows, run, "cor_system"), sort_keys=True),
        "-- Printing SLOs: %d." % sum(1 for r in rows if fields(r, run)["cor_prints_slos"]),
        "--",
        "-- The UPDATE applies only where cor_checked_run is null, so a second apply changes nothing.",
        "-- Rollback (Rule 10 a2): the columns were empty before this fill; the statement at the end, uncommented,",
        "-- empties them again, and program_source_registry_history holds every prior row under the run.",
        "",
    ]
    def row_sql(r):
        f = fields(r, run)
        key = note_key(f["cor_system"], r.get("cor_outline") or "not_probed", f["cor_access"])
        return "  (%s)" % ", ".join(sql_lit(x) for x in (r["college"], f["cor_system"], f["cor_url"],
                                                         f["cor_access"], key, f["cor_proof_url"]))
    name = "case v.system %s else v.system end" % " ".join(
        "when %s then %s" % (sql_lit(k), sql_lit(n)) for k, n in sorted(NAMES.items()))
    note = "case v.k %s end" % " ".join(
        "when %s then replace(%s, '{name}', %s)" % (sql_lit(k), sql_lit(t), name) for k, t in NOTES.items())
    lines.append(
        "update public.program_source_registry r set\n"
        "  cor_system         = v.system,\n"
        "  cor_url            = v.url,\n"
        "  cor_access         = v.access,\n"
        "  cor_proof_url      = v.proof,\n"
        "  cor_prints_slos    = case when v.k in ('outline_with_slos', 'slos') then true when v.k = 'outline' then false end,\n"
        "  cor_slo_source_url = case when v.k in ('outline_with_slos', 'slos') then v.proof end,\n"
        "  cor_note           = %s,\n"
        "  cor_checked_run    = %s\n"
        "from (values\n%s\n) as v(college, system, url, access, k, proof)\n"
        "where r.college = v.college\n  and r.cor_checked_run is null;\n"
        % (note, sql_lit("course-outline-census run %s" % run), ",\n".join(row_sql(r) for r in rows)))
    lines += [
        "select cor_access, count(*) from public.program_source_registry",
        "where cor_checked_run = %s group by 1 order by 1;" % sql_lit("course-outline-census run %s" % run),
        "",
        "-- Rollback:",
        "-- update public.program_source_registry set cor_system = null, cor_url = null, cor_access = null,",
        "--   cor_proof_url = null, cor_prints_slos = null, cor_slo_source_url = null, cor_note = null,",
        "--   cor_checked_run = null",
        "-- where cor_checked_run = %s;" % sql_lit("course-outline-census run %s" % run),
        "",
    ]
    return "\n".join(lines)


def _count(rows, run, key):
    out = {}
    for r in rows:
        v = fields(r, run)[key]
        out[v] = out.get(v, 0) + 1
    return out


def main(argv=None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("census")
    ap.add_argument("--session", type=int, required=True)
    ap.add_argument("--date", default=date.today().isoformat())
    a = ap.parse_args(argv)
    census = json.load(open(a.census))
    out = os.path.join(ROOT, "kb", "receipts",
                       "program_source_registry_course_outline_%s_s%d.sql" % (a.date, a.session))
    with open(out, "w") as f:
        f.write(receipt(census, a.session, a.date))
    print("wrote", os.path.relpath(out, ROOT))
    return 0


if __name__ == "__main__":
    sys.exit(main())
