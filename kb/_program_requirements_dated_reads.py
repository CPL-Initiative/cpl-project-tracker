#!/usr/bin/env python3
"""The display builder's two dated reads, refreshed on a runner (S644).

kb/_build_roep_display.py runs offline over two dated copies:
  kb/program_requirements_pilot/registry_read.json    program_source_registry's ten catalog
                                                      and sequence columns for each college
  kb/program_requirements_pilot/map_cr_by_course.json MAP's credit recommendations per course
                                                      code at each college (the aggregate
                                                      kb/program_requirements_pilot/map_cr_by_course.sql
                                                      describes): counts and exhibit titles only
Until S644 a session refreshed both through the Supabase connector at every new college, and
the map read for Santiago Canyon alone was 609 source rows carried through a session's context.
This script reads them on a runner (.github/workflows/program-requirements-dated-reads.yml) and
files only the aggregate.

THE MAP READ. PostgREST cannot run the SQL, so the script reads the source rows with the service
key (map_college_cr_unit is reviewer-gated), Range-paginated, only the columns the SQL selects:
map_colleges' college_id and college_name; map_college_cr_unit's college_id, college_course,
source_code, exhibit_id and credit_rec; map_ace_exhibit_titles' and chatbox_exhibits' exhibit id
and title. No student column is selected, and no row is ever printed: the log carries counts.
It then computes the SQL's aggregate in Python:
  - a college_course string names courses by the SQL's pattern, (?:^|,\\s*)SUBJ-NUM, and a
    string naming several courses counts toward each; the code is SUBJ and NUM with a space;
  - an exhibit's title is map_ace_exhibit_titles' title, else chatbox_exhibits' (a left join, so
    an exhibit with two title rows yields both, as in SQL); the source is source_code, else
    'unnamed';
  - per college and code: recs (distinct credit_rec), exhibits (distinct exhibit_id),
    exhibits_by_source, titles ({title, source, recs} ordered by recs descending, then title in
    the database's en_US collation; null when none), untitled_exhibits;
  - a college none of whose rows names a course gets an empty entry.

PROOF IT EQUALS THE SQL. `verify --colleges A,B,C` recomputes colleges already filed and exits 1
unless each equals its filed entry exactly, printing only the course codes and field names that
differ. The workflow runs it before it reads or writes anything else.

Usage:
  python3 kb/_program_requirements_dated_reads.py verify   --colleges "Merced College,Cuesta College"
  python3 kb/_program_requirements_dated_reads.py map      --colleges "Santiago Canyon College" --out out
  python3 kb/_program_requirements_dated_reads.py registry --colleges all --out out
  python3 kb/_program_requirements_dated_reads.py file     --out out --by "SkyWren (S644), run 123"
`--colleges` takes registry names, comma-separated, or `all` (every college either file holds or
a college folder under kb/program_requirements_college/ files).
"""
from __future__ import annotations

import argparse
import datetime
import glob
import json
import os
import re
import sys
import unicodedata
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
from _program_requirements_pilot import SUPABASE_ANON, SUPABASE_URL  # noqa: E402

PILOT = os.path.join(HERE, "program_requirements_pilot")
MAP_FILE = os.path.join(PILOT, "map_cr_by_course.json")
REGISTRY_FILE = os.path.join(PILOT, "registry_read.json")
MAP_SQL = os.path.join(PILOT, "map_cr_by_course.sql")
COLLEGE_FOLDERS = os.path.join(HERE, "program_requirements_college")
SCRIPT = "kb/_program_requirements_dated_reads.py"
WORKFLOW = ".github/workflows/program-requirements-dated-reads.yml"

REGISTRY_COLUMNS = ("catalog_platform", "catalog_year", "catalog_url", "census_run_id", "sequence_source",
                    "sequence_access", "sequence_host", "sequence_url", "sequence_note", "sequence_checked_run")
# The SQL's pattern, unchanged: regexp_matches(u.college_course, '(?:^|,\s*)([A-Z][A-Z0-9&/ ]*?)-([0-9A-Z][0-9A-Z.]*)', 'g').
# The subject cannot hold a hyphen, so the first hyphen ends it in both engines.
COURSE = re.compile(r"(?:^|,\s*)([A-Z][A-Z0-9&/ ]*?)-([0-9A-Z][0-9A-Z.]*)")
PAGE = 1000
CHUNK = 150

MAP_WHAT = ("MAP's credit recommendations per course at the harvest's %d colleges (every key under colleges): "
            "how many credit recommendations and exhibits MAP holds against each course code, and the exhibit "
            "titles behind them. Counts and credential titles only; no student column is read or carried. The "
            "ROEP display builder (kb/_build_roep_display.py) reads it as the 'articulated here' kind beside the "
            "CER's industry-credential lines.")
REGISTRY_WHAT = ("The harvest registry's catalog and map columns for the harvest's %d colleges (every key under "
                 "colleges), as the ROEP display builder reads them (kb/_build_roep_display.py). "
                 "program_source_registry is public-read; this file is a dated copy so the builder runs offline "
                 "and its output is reproducible.")
REFRESH = ("On a runner: dispatch %s with colleges=<registry names, comma-separated> or all; it recomputes three "
           "filed colleges first and stops unless they equal their entries, then files this read for the named "
           "colleges (%s)." % (WORKFLOW, SCRIPT))


# ── the aggregate ────────────────────────────────────────────────────────────────
def course_codes(college_course: str | None) -> list[str]:
    """Every course a college_course string names, in order (a repeat stays a repeat, as in SQL)."""
    return ["%s %s" % (m.group(1), m.group(2)) for m in COURSE.finditer(college_course or "")]


# The database orders titles in en_US (glibc 2.28 and later): case is a later level than the letter,
# and punctuation is not ignored, tab before space before the marks below, then digits, then letters.
# Measured against the 3,294 equal-recs pairs the file held on 2026-11-13: every pair in this order.
_MARKS = "\t\n _-,;:!?.'\"()[]{}@*/\\&#%`^+<=>|~$"


def title_key(s: str):
    first, accents, case = [], [], []
    for ch in s:
        d = unicodedata.normalize("NFD", ch)
        base = d[0]
        if base in _MARKS:
            first.append((0, _MARKS.index(base)))
        elif base.isdigit():
            first.append((1, base))
        elif base.isalpha():
            first.append((2, base.lower()))
        else:
            first.append((0, 100 + ord(base)))
        accents.append(len(d) > 1)
        case.append(base.isupper())
    return (first, accents, case, s)


def aggregate(units: list[dict], ace: dict, chatbox: dict) -> dict:
    """{college: {code: entry}} from the source rows.

    units: {college, college_course, source_code, exhibit_id, credit_rec}, one a map_college_cr_unit row.
    ace: {str(exhibit_id): [title, ...]}, every map_ace_exhibit_titles row's title (the left join).
    chatbox: {str(exhibit_id): title}, chatbox_exhibits' title (the SQL's limit 1)."""
    groups: dict = {}
    for u in units:
        if not (u.get("college_course") or ""):
            continue
        ex = u.get("exhibit_id")
        ek = None if ex is None else str(ex)
        fallback = chatbox.get(ek) if ek is not None else None
        titles = [t if t is not None else fallback for t in ace.get(ek, [])] if ek is not None and ek in ace else [fallback]
        src = u.get("source_code") or "unnamed"
        for code in course_codes(u["college_course"]):
            g = groups.setdefault((u["college"], code), [])
            for t in titles:
                g.append((src, ex, u.get("credit_rec"), t))
    out: dict = {}
    for (college, code), rows in groups.items():
        by_src: dict = {}
        by_title: dict = {}
        for src, ex, rec, t in rows:
            by_src.setdefault(src, set())
            if ex is not None:
                by_src[src].add(ex)
            if t is not None:
                s = by_title.setdefault((t, src), set())
                if rec is not None:
                    s.add(rec)
        titles = [{"title": t, "source": src, "recs": len(recs)} for (t, src), recs in by_title.items()]
        titles.sort(key=lambda x: (-x["recs"], title_key(x["title"]), x["source"]))
        out.setdefault(college, {})[code] = {
            "recs": len({r for _, _, r, _ in rows if r is not None}),
            "exhibits": len({e for _, e, _, _ in rows if e is not None}),
            "exhibits_by_source": {s: len(v) for s, v in sorted(by_src.items())},
            "titles": titles or None,
            "untitled_exhibits": len({e for _, e, _, t in rows if e is not None and t is None}),
        }
    return {c: dict(sorted(v.items())) for c, v in out.items()}


def differences(got: dict, filed: dict) -> list[str]:
    """The course codes and field names on which two entries differ; never a value."""
    out = ["%s: only in the fresh read" % k for k in sorted(set(got) - set(filed))]
    out += ["%s: only in the filed entry" % k for k in sorted(set(filed) - set(got))]
    for k in sorted(set(got) & set(filed)):
        fields = sorted(f for f in set(got[k]) | set(filed[k]) if got[k].get(f) != filed[k].get(f))
        if fields:
            out.append("%s: %s" % (k, ", ".join(fields)))
    return out


# ── the reads ────────────────────────────────────────────────────────────────────
def _in(values) -> str:
    return "in.(%s)" % ",".join('"%s"' % str(v).replace("\\", "\\\\").replace('"', '\\"') for v in values)


def _paged(key: str, table: str, select: str, filters: dict, order: str) -> list[dict]:
    """Every row, Range-paginated over an order on every selected column, checked against the exact count."""
    rows, total = [], None
    qs = "&".join(["select=" + select] + ["%s=%s" % (k, urllib.parse.quote(v, safe="(),.*")) for k, v in filters.items()]
                  + ["order=" + order])
    while total is None or len(rows) < total:
        req = urllib.request.Request("%s/rest/v1/%s?%s" % (SUPABASE_URL, table, qs), headers={
            "apikey": key, "Authorization": "Bearer " + key, "Prefer": "count=exact",
            "Range-Unit": "items", "Range": "%d-%d" % (len(rows), len(rows) + PAGE - 1)})
        with urllib.request.urlopen(req, timeout=120) as resp:
            page = json.loads(resp.read().decode())
            rng = resp.headers.get("Content-Range") or ""
        if "/" not in rng or rng.endswith("/*"):
            raise SystemExit("%s sent no exact count (Content-Range); the read cannot be checked whole." % table)
        total = int(rng.rsplit("/", 1)[1])
        if not page and len(rows) < total:
            raise SystemExit("%s stopped at %d of %d rows." % (table, len(rows), total))
        rows.extend(page)
    if len(rows) != total:
        raise SystemExit("%s returned %d rows against a count of %d." % (table, len(rows), total))
    return rows


def _chunks(values, n=CHUNK):
    values = sorted(values, key=str)
    for i in range(0, len(values), n):
        yield values[i:i + n]


def service_key() -> str:
    key = os.environ.get("SUPABASE_SERVICE_KEY") or ""
    if not key:
        raise SystemExit("SUPABASE_SERVICE_KEY is not set: map_college_cr_unit is reviewer-gated.")
    return key


def read_map(colleges: list[str]) -> dict:
    key = service_key()
    ids = _paged(key, "map_colleges", "college_id,college_name", {"college_name": _in(colleges)},
                 "college_id,college_name")
    name_of = {r["college_id"]: r["college_name"] for r in ids}
    missing = sorted(set(colleges) - set(name_of.values()))
    if missing:
        raise SystemExit("not a map_colleges name: %s" % "; ".join(missing))
    units = []
    for part in _chunks(name_of):
        for r in _paged(key, "map_college_cr_unit", "college_id,college_course,source_code,exhibit_id,credit_rec",
                        {"college_id": _in(part), "college_course": "not.is.null"},
                        "college_id,college_course,source_code,exhibit_id,credit_rec"):
            r["college"] = name_of[r.pop("college_id")]
            units.append(r)
    naming = [u for u in units if course_codes(u.get("college_course"))]
    exhibits = {u["exhibit_id"] for u in naming if u.get("exhibit_id") is not None}
    ace: dict = {}
    chatbox: dict = {}
    for part in _chunks(exhibits):
        for r in _paged(key, "map_ace_exhibit_titles", "exhibit_id,title", {"exhibit_id": _in(part)}, "exhibit_id,title"):
            ace.setdefault(str(r["exhibit_id"]), []).append(r.get("title"))
        for r in _paged(key, "chatbox_exhibits", "exhibit_id,exhibit_title", {"exhibit_id": _in(part)},
                        "exhibit_id,exhibit_title"):
            chatbox.setdefault(str(r["exhibit_id"]), r.get("exhibit_title"))
    agg = aggregate(naming, ace, chatbox)
    out = {c: agg.get(c, {}) for c in colleges}
    for c in colleges:
        n_units = sum(1 for u in units if u["college"] == c)
        n_naming = sum(1 for u in naming if u["college"] == c)
        print("%-44s %6d rows with a course field, %6d name a course, %4d course codes" % (c, n_units, n_naming, len(out[c])))
    return out


def read_registry(colleges: list[str]) -> dict:
    rows = _paged(SUPABASE_ANON, "program_source_registry", "college," + ",".join(REGISTRY_COLUMNS),
                  {"college": _in(colleges)}, "college")
    got = {r["college"]: {k: r.get(k) for k in REGISTRY_COLUMNS} for r in rows}
    missing = sorted(set(colleges) - set(got))
    if missing:
        raise SystemExit("not a program_source_registry college: %s" % "; ".join(missing))
    return {c: got[c] for c in colleges}


# ── the files ────────────────────────────────────────────────────────────────────
def load(path: str) -> dict:
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


def dump(path: str, data: dict) -> None:
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(json.dumps(data, indent=1, ensure_ascii=False) + "\n")


def all_colleges() -> list[str]:
    names = set(load(MAP_FILE)["colleges"]) | set(load(REGISTRY_FILE)["colleges"])
    for cap in glob.glob(os.path.join(COLLEGE_FOLDERS, "*", "capture.json")):
        c = load(cap).get("college")
        if c:
            names.add(c)
    return sorted(names)


def parse_colleges(arg: str) -> list[str]:
    if arg.strip() == "all":
        return all_colleges()
    names = [c.strip() for c in arg.split(",") if c.strip()]
    if not names:
        raise SystemExit("no college named")
    return list(dict.fromkeys(names))


def sql_list(text: str) -> list[str]:
    m = re.search(r"c\.college_name in \((.*?)\)\n", text, re.S)
    return [v.replace("''", "'") for v in re.findall(r"'((?:[^']|'')*)'", m.group(1))]


def sync_sql(text: str, names) -> str:
    """map_cr_by_course.sql's college list names every college the file holds: missing ones join its end."""
    have = set(sql_list(text))
    add = [n for n in names if n not in have]
    if not add:
        return text
    m = re.search(r"(c\.college_name in \(.*?)(\)\n)", text, re.S)
    lines = ",\n                         ".join(",".join("'%s'" % n.replace("'", "''") for n in add[i:i + 6])
                                                for i in range(0, len(add), 6))
    return text[:m.end(1)] + ",\n                         " + lines + text[m.end(1):]


def file_reads(out: str, by: str, today: str | None = None) -> None:
    today = today or datetime.date.today().isoformat()
    for name, path, what in (("map", MAP_FILE, MAP_WHAT), ("registry", REGISTRY_FILE, REGISTRY_WHAT)):
        fresh_path = os.path.join(out, name + ".json")
        if not os.path.exists(fresh_path):
            continue
        fresh = load(fresh_path)
        data = load(path)
        added = [c for c in fresh["colleges"] if c not in data["colleges"]]
        moved = [c for c in fresh["colleges"] if c in data["colleges"] and data["colleges"][c] != fresh["colleges"][c]]
        data["colleges"].update(fresh["colleges"])
        data["_what"] = what % len(data["colleges"])
        data["_read_at"] = today
        note = "%s on %s through %s (%s): %d colleges read (%s); %d added%s, %d changed%s." % (
            by, today, SCRIPT, WORKFLOW, len(fresh["colleges"]), fresh.get("detail") or "the ten columns",
            len(added), (" (%s)" % ", ".join(added)) if added else "", len(moved),
            (" (%s)" % ", ".join(moved)) if moved else "")
        if fresh.get("verified"):
            note += " Before the read, %s recomputed equal to their filed entries." % ", ".join(fresh["verified"])
        data["_read_by"] = note + " Earlier: " + data.get("_read_by", "")
        data["_refresh"] = REFRESH
        dump(path, data)
        print("%s: %d colleges filed, %d added, %d changed" % (os.path.relpath(path, ROOT), len(fresh["colleges"]),
                                                             len(added), len(moved)))
        if name == "map":
            with open(MAP_SQL, encoding="utf-8") as fh:
                text = fh.read()
            new = sync_sql(text, list(data["colleges"]))
            if new != text:
                with open(MAP_SQL, "w", encoding="utf-8") as fh:
                    fh.write(new)


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("step", choices=("verify", "map", "registry", "file"))
    ap.add_argument("--colleges", default="")
    ap.add_argument("--out", default="out")
    ap.add_argument("--by", default="a dispatch")
    ap.add_argument("--verified", default="", help="map: the colleges the verify step recomputed, for the note")
    a = ap.parse_args(argv)
    if a.step == "file":
        file_reads(a.out, a.by)
        return 0
    colleges = parse_colleges(a.colleges)
    if a.step == "verify":
        filed = load(MAP_FILE)["colleges"]
        absent = [c for c in colleges if c not in filed]
        if absent:
            print("not filed, so nothing to verify against: %s" % "; ".join(absent))
            return 1
        got = read_map(colleges)
        bad = 0
        for c in colleges:
            diff = differences(got[c], filed[c])
            if diff:
                bad += 1
                print("DIFFERS %s (%d keys):" % (c, len(diff)))
                for d in diff:
                    print("  " + d)
            else:
                print("equal   %s (%d course codes)" % (c, len(filed[c])))
        if bad:
            print("::error::%d of %d filed colleges recompute differently; nothing was read or filed." % (bad, len(colleges)))
            return 1
        return 0
    os.makedirs(a.out, exist_ok=True)
    if a.step == "map":
        got = read_map(colleges)
        codes = sum(len(v) for v in got.values())
        payload = {"colleges": got, "detail": "%d course codes" % codes,
                   "verified": [c for c in a.verified.split(",") if c.strip()]}
        dump(os.path.join(a.out, "map.json"), payload)
    else:
        dump(os.path.join(a.out, "registry.json"), {"colleges": read_registry(colleges)})
    return 0


if __name__ == "__main__":
    sys.exit(main())
