#!/usr/bin/env python3
"""Sync a person's saved subject decisions from kb_curation into kb/status/subject_decisions.json (#3655).

The Subjects page (#commons/subjects, commons_subjects.js) saves a person's decision as one kb_curation row, and the
Local subjects List (csr_local_subjects.js) files a code under an MQ discipline statewide. The page overlays its saves
in the browser; this daily step commits them, so the builders honor them (kb/subject_decisions.py reads the file):
kb/_build_local_subject_titles.py, kb/_held_subject_codes.py and the pile mint dry run (kb/_pile_mint_dryrun.py).

THE READ. PostgREST with the public anon key the page ships (cpl_session.js; SUPABASE_ANON_KEY overrides), asking
course_id, value, reviewed_at and reviewer_label, never reviewer_email (anon cannot read it:
kb/migrations/2026-11-09_kb_curation_hide_reviewer_email.sql). Range-paginated (Rule 10 b), each read checked complete
against the first page's exact count. Three reads:
  subject_decision            course_id like SUBJ:*         the page's saves
  subject_discipline_confirm  course_id like _SUBJ_DISC::*  the List's statewide filings
  course_subject_decision     course_id like CRS:*          the Subjects panel's course moves (one course each)

A KEY'S BAND is credit, whole or nc:<slug>, the slug one that kb/status/noncredit_categories.json lists (slugs); any
other band is listed as unreadable with its reason.

THE FILE carries per decision its key, college slug, code, band, local_title, common_code, who and when. who is
value.decided_by where a filing names the person it was filed for ("Sam"), else reviewer_label: a procedure's cohort
id, or "a reviewer" for a person's own save. No email is committed: a who that reads as one is written "a reviewer".
No clock is read, so a rerun on the same rows writes the same bytes, and a run whose rows did not move writes nothing.

A FAILED READ keeps the committed file and says so (exit 1; the daily step warns and restores it), and so does a read
short of its count or one whose answer carries no count. A live read that carries an exact count is definite: an exact
0 empties that section, so the last Take it back lands. Rows given from a file carry no count, so an empty section
there never empties the file unless --expect-empty names it as expected.

  python3 kb/_sync_subject_decisions.py                 the daily read
  python3 kb/_sync_subject_decisions.py --rows FILE     rows from a file (a JSON list of PostgREST rows, both fields)
  python3 kb/_sync_subject_decisions.py --seed-filed    the 30 rows kb/_file_subject_decisions.py filed (S701), checked
                                                        against the receipt's md5; the List's filings stay unread
"""
import argparse
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import subject_decisions as sd  # noqa: E402

OUT = os.path.join(ROOT, sd.STATUS)
URL = os.environ.get("SUPABASE_URL", "https://hvuwhnbuahrtptokpqfh.supabase.co").rstrip("/")
PAGE = 1000
COLUMNS = "course_id,field,value,reviewed_at,reviewer_label"
READS = ((sd.FIELD, sd.PREFIX), (sd.STATEWIDE_FIELD, sd.STATEWIDE_PREFIX), (sd.COURSE_FIELD, sd.COURSE_PREFIX))
PARTS = ("decisions", "statewide", "courses")
EMAIL_RE = re.compile(r"[^\s@]+@[^\s@]+\.[^\s@]+")
PERSON = "a reviewer"


def anon_key():
    """The public anon key the page reads with (cpl_session.js), or SUPABASE_ANON_KEY."""
    key = os.environ.get("SUPABASE_ANON_KEY")
    if key:
        return key
    with open(os.path.join(ROOT, "cpl_session.js"), encoding="utf-8") as f:
        m = re.search(r"""\b(?:var|let|const)\s+SUPABASE_ANON\s*=\s*(["'`])([^"'`\s]+)\1""", f.read())
    if not m:
        raise ValueError("no anon key in cpl_session.js")
    return m.group(2)


def open_page(req, attempts=4):
    """(rows, Content-Range) for one page, retrying a transient network or TLS failure as kb/_apply_curation.py's
    _fetch_json does; the last failure is raised."""
    delay = 1.0
    for n in range(1, attempts + 1):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.load(r), r.headers.get("Content-Range") or ""
        except OSError as e:
            if n == attempts:
                raise
            print("  fetch attempt %d/%d failed (%s); retry in %.0fs" % (n, attempts, e, delay), file=sys.stderr)
            time.sleep(delay)
            delay *= 2


def fetch(field, prefix, key, opener=None):
    """Every row of one field under one key prefix, Range-paged, checked against the exact count."""
    url = (URL + "/rest/v1/kb_curation?select=" + COLUMNS + "&field=eq." + field
           + "&course_id=like." + urllib.parse.quote(prefix, safe="") + "*&order=course_id.asc")
    rows, start, total = [], 0, None
    while True:
        headers = {"apikey": key, "Authorization": "Bearer " + key, "Accept": "application/json",
                   "Range-Unit": "items", "Range": "%d-%d" % (start, start + PAGE - 1), "Prefer": "count=exact"}
        batch, span = (opener or open_page)(urllib.request.Request(url, headers=headers))
        if not isinstance(batch, list):
            raise ValueError("kb_curation answered something other than a list for " + field)
        tail = str(span).rsplit("/", 1)[-1]
        if start == 0:
            total = int(tail) if tail.isdigit() else None
        rows.extend(batch)
        if len(batch) < PAGE:
            break
        start += PAGE
    if total is None:
        raise ValueError("no row count in Content-Range for " + field)
    if len(rows) != total:
        raise ValueError("a short read for %s: %d rows of %d" % (field, len(rows), total))
    return rows


def label_of(email):
    """kb_curation.reviewer_label's own rule (kb/migrations/2026-11-09_kb_curation_reviewer_label.sql)."""
    if not email:
        return None
    return email if re.search(r"@bot$", email) else PERSON


def safe_who(v):
    """A who that reads as an email address, and is no procedure's cohort id, is written as a person."""
    v = (str(v).strip() if v is not None else "") or None
    if v and EMAIL_RE.search(v) and not v.endswith("@bot"):
        return PERSON
    return v


def value_of(row):
    v = row.get("value")
    if isinstance(v, dict):
        return v
    try:
        v = json.loads(v or "{}")
    except (TypeError, ValueError):
        return None
    return v if isinstance(v, dict) else None


def band_why(band, slugs):
    """None for a band the builders read (credit, whole, nc:<a slug the one list names>), else why not."""
    if band in sd.BANDS:
        return None
    if not str(band).startswith(sd.NC_PREFIX):
        return "the band %s is not credit, whole or nc:<noncredit category>" % band
    s = sd.nc_slug_of(band)
    if not s:
        return "the noncredit band %s holds a character other than lower-case letters, digits and single hyphens" % band
    if s not in slugs:
        return "the noncredit category %s is not one %s names" % (band, sd.CATEGORIES.replace(os.sep, "/"))
    return None


def shape(rows, statewide_read=True, slugs=None):
    """The committed document from PostgREST rows of both fields. Unreadable rows are listed, never dropped quietly.
    slugs: {slug: category}, the one list of noncredit category slugs (kb/status/noncredit_categories.json)."""
    slugs = sd.read_slugs(ROOT) if slugs is None else slugs
    decisions, statewide, courses, unreadable = [], [], [], []
    for r in rows:
        cid, field = str(r.get("course_id") or ""), r.get("field")
        if field == sd.FIELD and cid.startswith(sd.PREFIX):
            v = value_of(r)
            k = sd.parse_key(cid)
            if v is None or not k:
                unreadable.append({"key": cid, "why": "the key or the value does not read"})
                continue
            why = band_why(k[2], slugs)
            if why:
                unreadable.append({"key": cid, "why": why})
                continue
            bad = [f for f in ("local_title", "common_code", "decided_by") if v.get(f) is not None and not isinstance(v[f], str)]
            if bad:
                unreadable.append({"key": cid, "why": "%s is not text" % " and ".join(bad)})
                continue
            decisions.append({
                "key": cid, "college": k[0], "code": k[1], "band": k[2],
                "local_title": (v.get("local_title") or "").strip() or None,
                "common_code": (v.get("common_code") or "").strip().upper() or None,
                "not_a_subject": True if v.get("not_a_subject") else None,
                "who": safe_who(v.get("decided_by") or r.get("reviewer_label")),
                "at": str(v.get("decided_at") or r.get("reviewed_at") or "")[:20] or None})
        elif field == sd.STATEWIDE_FIELD and cid.startswith(sd.STATEWIDE_PREFIX):
            disc = r.get("value")
            disc = disc.strip() if isinstance(disc, str) else None
            statewide.append({"key": cid, "code": sd.map_key(cid[len(sd.STATEWIDE_PREFIX):]), "discipline": disc or None,
                              "who": safe_who(r.get("reviewer_label")),
                              "at": str(r.get("reviewed_at") or "")[:20] or None})
        elif field == sd.COURSE_FIELD and cid.startswith(sd.COURSE_PREFIX):
            v = value_of(r)
            k = sd.parse_course_key(cid)
            if v is None or not k:
                unreadable.append({"key": cid, "why": "the key or the value does not read"})
                continue
            bad = [f for f in ("common_code", "from_mid", "title", "band", "decided_by")
                   if v.get(f) is not None and not isinstance(v[f], str)]
            if bad:
                unreadable.append({"key": cid, "why": "%s is not text" % " and ".join(bad)})
                continue
            if not (v.get("common_code") or "").strip():
                unreadable.append({"key": cid, "why": "the move names no common subject code"})
                continue
            courses.append({
                "key": cid, "college": k[0], "code": k[1], "number": k[2],
                "common_code": v["common_code"].strip().upper(),
                "from_mid": (v.get("from_mid") or "").strip() or None,
                "title": (v.get("title") or "").strip() or None,
                "band": (v.get("band") or "").strip() or None,
                "who": safe_who(v.get("decided_by") or r.get("reviewer_label")),
                "at": str(v.get("decided_at") or r.get("reviewed_at") or "")[:20] or None})
    decisions.sort(key=lambda d: d["key"])
    statewide.sort(key=lambda d: d["key"])
    courses.sort(key=lambda d: d["key"])
    by_band = {}
    for d in decisions:
        by_band[d["band"]] = by_band.get(d["band"], 0) + 1
    return {
        "_what": ("A person's saved subject decisions, synced daily from kb_curation by kb/_sync_subject_decisions.py "
                  "so the builders honor them (kb/subject_decisions.py). decisions: the Subjects page's saves "
                  "(SUBJ:<college>|<code>|<band>, subject_decision; band credit, whole or nc:<noncredit category "
                  "slug>). statewide: the Local subjects List's filings "
                  "(_SUBJ_DISC::<CODE>, subject_discipline_confirm), the MQ discipline a person filed a code under. "
                  "courses: the Subjects panel's course moves (CRS:<college>|<code>|<course number>, "
                  "course_subject_decision), one person's common code for one course, read by the re-mint's gate "
                  "(kb/_mid_readiness.py) and never by a nightly mint. "
                  "who is the person a filing names, a procedure's cohort id, or 'a reviewer'; no email is kept."),
        "_rule": ("A person's save wins over the catalog, the subject map and any recommendation "
                  "(r-subject-save-path-kb-curation-sam-2026-11-22). Precedence for a college's code and band: its "
                  "decision, then a statewide filing, then the subject map, then a recommendation. A credit decision "
                  "reads the code's credit courses only; whole reads a code COCI lists no course under; nc:<slug> "
                  "reads the code's noncredit courses in that COCI noncredit category only."),
        "statewide_read": bool(statewide_read),
        "totals": {"decisions": len(decisions), "by_band": dict(sorted(by_band.items())),
                   "colleges": len({d["college"] for d in decisions}), "statewide": len(statewide),
                   "courses": len(courses), "unreadable": len(unreadable)},
        "decisions": decisions,
        "statewide": statewide,
        "courses": courses,
        "unreadable": unreadable,
    }


def dump(doc):
    return json.dumps(doc, ensure_ascii=False, indent=1, sort_keys=False) + "\n"


def committed(path=OUT):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return None


def empty_guard(doc, was, expect_empty=False, definite=()):
    """None when the write may go ahead, else why not: a section with no rows where the file holds some, read with no
    count to say the empty answer is true. A section in `definite` came from a read with an exact count."""
    if expect_empty or not was:
        return None
    for part in PARTS:
        if part in definite:
            continue
        if was.get(part) and not doc.get(part) and (part != "statewide" or was.get("statewide_read")):
            return ("the read returned no %s rows and %s holds %d; an empty answer never empties the file. Pass "
                    "--expect-empty when every save was taken back." % (part, sd.STATUS, len(was[part])))
    return None


def seed_rows():
    """The 30 rows kb/_file_subject_decisions.py filed (S701), as PostgREST would answer them, checked against the
    receipt's md5 of the live rows; reviewer_label is the cohort id (the generated column's rule)."""
    import _file_subject_decisions as fsd  # noqa: E402
    _dec, rows = fsd.plan()
    receipt = json.load(open(os.path.join(ROOT, fsd.RECEIPT), encoding="utf-8"))
    if fsd.rows_md5(rows) != receipt.get("rows_md5"):
        raise SystemExit("REFUSED: the filed rows' md5 differs from the receipt's; the seed would not be the live rows")
    return [{"course_id": r["course_id"], "field": sd.FIELD, "value": r["value"], "reviewed_at": fsd.APPLIED_AT,
             "reviewer_label": label_of(fsd.COHORT)} for r in rows]


def write(doc, path=OUT):
    """True when the file changed."""
    text = dump(doc)
    try:
        with open(path, encoding="utf-8") as f:
            if f.read() == text:
                return False
    except OSError:
        pass
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)
    return True


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--rows", help="a JSON list of kb_curation rows to use in place of the live read")
    ap.add_argument("--seed-filed", action="store_true", help="the 30 rows filed in S701, statewide left unread")
    ap.add_argument("--expect-empty", action="store_true", help="an empty read may empty the file")
    ap.add_argument("--out", default=OUT)
    a = ap.parse_args(argv)
    was = committed(a.out)
    statewide_read, definite = True, ()
    try:
        if a.seed_filed:
            rows, statewide_read = seed_rows(), False
        elif a.rows:
            with open(a.rows, encoding="utf-8") as f:
                rows = json.load(f)
        else:
            key = anon_key()
            rows = [r for field, prefix in READS for r in fetch(field, prefix, key)]
            definite = PARTS    # fetch raised unless each read carried its exact count
    except (OSError, ValueError) as e:
        print("[subject_decisions] the read failed (%s: %s); %s keeps the committed decisions"
              % (type(e).__name__, e, sd.STATUS), file=sys.stderr)
        return 1
    doc = shape(rows, statewide_read)
    if not statewide_read and was and was.get("statewide_read"):
        doc["statewide"], doc["statewide_read"] = was.get("statewide") or [], True
        doc["totals"]["statewide"] = len(doc["statewide"])
    if a.seed_filed and was and was.get("courses"):
        doc["courses"] = was["courses"]
        doc["totals"]["courses"] = len(doc["courses"])
    warn = empty_guard(doc, was, a.expect_empty, definite)
    if warn:
        print("[subject_decisions] REFUSED: " + warn, file=sys.stderr)
        return 1
    changed = write(doc, a.out)
    t = doc["totals"]
    print("[subject_decisions] %d decisions at %d colleges %s, %d statewide filings%s, %d course moves; %s"
          % (t["decisions"], t["colleges"], json.dumps(t["by_band"]), t["statewide"],
             "" if doc["statewide_read"] else " (not read yet)", t["courses"], "written" if changed else "unchanged"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
