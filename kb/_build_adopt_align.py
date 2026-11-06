#!/usr/bin/env python3
"""_build_adopt_align.py — the Credential Catalog's analysis for faculty: issuer skills against harvested course outcomes.

Sam, 2026-11-06, on the catalog mock: the public asks a college (or the CPL Initiative with ASCCC, statewide) to
evaluate a credential, and the request carries an analysis "like the Foundation and ASCCC's project": the skills the
issuer publishes for the credential, aligned to the course outcomes (SLOs and objectives) the harvest holds, with a
confidence score, "so when college faculty get the request for credential CPL assessment/articulation, they have an
analysis and recommendations ready to adopt or adapt." He named TypeSafe's Jev as the likely scorer.

This file is the first, lexical version of that analysis. The score is a word-overlap cosine between a skill area's
words and an outcome's words (stop words out, a light stem), the family of the Outcomes-match hints
(kb/_build_exhibit_slo_neighbors.py). It is illustrative by design and labeled so on the page: the Foundation and ASCCC
method, or a Jev Score per skill area, replaces it in this same file, and faculty verify every alignment before it
counts (credential_watch_agent.md: faculty verification of the skills is a human step and never the agent's).

What it reads:
  kb/reference/industry_credential_skills.json   the skill areas each issuer publishes (65 credentials on 2026-11-06)
  library/adopt/adopt_data.json                  the settled credentials and their columns
  kb/exhibits_adoption.json                      each articulating college's courses behind a credential
  public.course_outcomes                         the harvested SLOs, through PostgREST with SUPABASE_SERVICE_KEY
                                                 (the daily run's secret; the table is public record), or --outcomes
                                                 rows.json for a test or an offline run
Writes library/adopt/adopt_align.json, which library/adopt/adopt.js reads when a credential's panel opens. Runs daily
from daily-dashboard.yml after the adoption page's data. It writes nothing anywhere else.

Usage, from the repo root:
  python3 kb/_build_adopt_align.py                       # read course_outcomes, write the file
  python3 kb/_build_adopt_align.py --outcomes rows.json  # rows from a file instead
"""
import argparse
import datetime as dt
import json
import math
import os
import re
import sys
import urllib.request

OUT = "library/adopt/adopt_align.json"
URL = os.environ.get("SUPABASE_URL", "https://hvuwhnbuahrtptokpqfh.supabase.co").rstrip("/")
PAGE = 1000
COVERED_AT = 0.2   # a skill area counts as covered when an outcome scores this or more
TOP_ROWS = 12      # outcome rows kept per credential, strongest first

STOP = set("""the and of to in for a an with on by from or as is are be that this these those their its into using use
upon will students student able course completion knowledge demonstrate understand understanding identify explain
describe apply various different appropriate effectively how such e.g including other basic introduction""".split())


def iso_now():
    return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def load_json(path, default=None):
    if not os.path.exists(path):
        return default
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def norm_title(t):
    return re.sub(r"[^a-z0-9]+", " ", str(t or "").lower().replace("©", "").replace("®", "")).strip()


def course_key(code):
    return re.sub(r"[^A-Za-z0-9]", "", str(code or "")).upper()


def tokens(text):
    out = set()
    for w in re.findall(r"[a-z][a-z0-9+/-]*", str(text or "").lower()):
        if w in STOP or len(w) < 3:
            continue
        for p in w.split("/"):
            p = re.sub(r"ies$", "y", p)
            if len(p) > 4:
                p = re.sub(r"(ing|ed|es|s)$", "", p)
            if len(p) >= 3:
                out.add(p)
    return out


def cosine(a, b):
    return len(a & b) / math.sqrt(len(a) * len(b)) if a and b else 0.0


# ── course_outcomes ───────────────────────────────────────────────────────────────────────────────────────────────

def read_outcomes(key):
    """Every course's newest read: college, course_code, course_title, outcomes. Range-paginated (Rule 10 b)."""
    rows, start = [], 0
    while True:
        req = urllib.request.Request(
            URL + "/rest/v1/course_outcomes?select=college,course_code,course_title,outcomes,read_run&order=id",
            headers={"apikey": key, "Authorization": "Bearer " + key, "Range-Unit": "items",
                     "Range": "%d-%d" % (start, start + PAGE - 1)})
        with urllib.request.urlopen(req, timeout=120) as r:
            page = json.loads(r.read().decode("utf-8"))
        rows.extend(page)
        if len(page) < PAGE:
            break
        start += PAGE
    return rows


def index_outcomes(rows):
    """(college, course key) -> the newest read's row, with its outcome texts cleaned."""
    by = {}
    for r in rows:
        k = (r.get("college"), course_key(r.get("course_code")))
        if not k[1]:
            continue
        old = by.get(k)
        if old is None or (r.get("read_run") or 0) >= (old.get("read_run") or 0):
            by[k] = r
    for r in by.values():
        outs = []
        for o in (r.get("outcomes") or []):
            o = re.sub(r"\s+", " ", str(o or "")).strip()
            # A lead-in line ("Upon the completion of this course, the student should be able to:") is not an outcome.
            if len(o) < 12 or o.endswith(":"):
                continue
            outs.append(o)
        r["_outs"] = outs
    return by


# ── the join and the score ────────────────────────────────────────────────────────────────────────────────────────

def skill_titles(skills, titles):
    """Each skills record's catalog title: the same name folded, else the one title that contains it or that it contains."""
    by_norm = {norm_title(t): t for t in titles}
    out = {}
    for rec in skills:
        n = norm_title(rec.get("name"))
        t = by_norm.get(n)
        if not t and n:
            cands = [v for k, v in by_norm.items() if n in k or k in n]
            t = cands[0] if len(cands) == 1 else None
        if t and t not in out:
            out[t] = rec
    return out


def courses_behind(adoption, title, columns):
    """[(college, course code)] a credential's articulating colleges name, columns only."""
    e = (adoption.get("credentials") or {}).get(title) or {}
    names = adoption.get("colleges") or []
    out = []
    for k, (units, lines) in (e.get("a") or {}).items():
        college = names[int(k)]
        if college not in columns:
            continue
        for course, rec in lines or []:
            m = re.match(r"\s*([A-Za-z][A-Za-z &/-]*?\s*\d+[A-Za-z]*)", str(course or ""))
            if m:
                out.append((college, m.group(1).strip()))
    return out


def align_one(rec, courses, outcomes):
    doms = []
    for s in rec.get("skills") or []:
        name = s.get("domain") or s.get("skill") or s.get("name") or json.dumps(s, ensure_ascii=False)
        doms.append({"domain": name, "weight": s.get("weight") or s.get("weight_pct") or s.get("percent")})
    dom_tokens = [(d["domain"], tokens(d["domain"])) for d in doms]
    seen, found = set(), []
    for college, code in courses:
        k = (college, course_key(code))
        if k in seen:
            continue
        seen.add(k)
        r = outcomes.get(k)
        if not r or not r.get("_outs"):
            continue
        slos = []
        for o in r["_outs"]:
            ot = tokens(o)
            best = max(((name, cosine(dt_, ot)) for name, dt_ in dom_tokens), key=lambda x: x[1], default=(None, 0.0))
            slos.append({"text": o, "skill": best[0], "score": round(best[1], 2)})
        found.append({"college": college, "code": r.get("course_code") or code, "title": r.get("course_title"),
                      "slos": slos, "mean": round(sum(s["score"] for s in slos) / len(slos), 2) if slos else 0})
    found.sort(key=lambda c: -c["mean"])
    covered = 0
    for name, dt_ in dom_tokens:
        if any(cosine(dt_, tokens(s["text"])) >= COVERED_AT for c in found for s in c["slos"]):
            covered += 1
    return {
        "issuer_skills_kind": rec.get("skills_kind"), "source": rec.get("source_url"), "skills": doms,
        "courses": found, "covered": covered, "of": len(doms),
        "confidence": round(covered / len(doms), 2) if doms and found else None,
    }


def build(root, outcome_rows):
    data = load_json(os.path.join(root, "library/adopt/adopt_data.json")) or {}
    adoption = load_json(os.path.join(root, "kb/exhibits_adoption.json")) or {}
    skills = (load_json(os.path.join(root, "kb/reference/industry_credential_skills.json")) or {}).get("credentials") or []
    titles = [c["t"] for c in data.get("credentials") or []]
    columns = {c[0] for c in data.get("colleges") or []}
    outcomes = index_outcomes(outcome_rows)
    joined = skill_titles(skills, titles)
    align = {}
    for title, rec in sorted(joined.items(), key=lambda kv: kv[0].lower()):
        align[title] = align_one(rec, courses_behind(adoption, title, columns), outcomes)
    with_courses = sum(1 for a in align.values() if a["courses"])
    return {
        "schema": 1,
        "_about": "The Credential Catalog's analysis for faculty (kb/_build_adopt_align.py): per settled credential with "
                  "issuer-published skill areas, the harvested course outcomes of its articulating colleges and a lexical "
                  "alignment score. Illustrative: a word-overlap cosine between a skill area and an outcome; covered = "
                  "skill areas with an outcome at %.1f or more; confidence = covered / skill areas. The Foundation and "
                  "ASCCC method, or a TypeSafe Jev Score per skill area, replaces the score here; faculty verify every "
                  "alignment before it counts." % COVERED_AT,
        "method": "lexical cosine (illustrative)",
        "written_at": iso_now(),
        "cover": {"colleges": len({k[0] for k in outcomes}), "courses": len(outcomes)},
        "counts": {"credentials_with_skills": len(joined), "with_outcomes": with_courses},
        "align": align,
    }


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--root", default=os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    ap.add_argument("--outcomes", default=None, help="course_outcomes rows as a JSON list, instead of the database")
    ap.add_argument("--out", default=None)
    ap.add_argument("--quiet", action="store_true")
    a = ap.parse_args(argv)
    if a.outcomes:
        rows = load_json(a.outcomes) or []
    else:
        key = os.environ.get("SUPABASE_SERVICE_KEY")
        if not key:
            print("SUPABASE_SERVICE_KEY not set and no --outcomes file; nothing written.", file=sys.stderr)
            return 2
        rows = read_outcomes(key)
    data = build(a.root, rows)
    out = a.out or os.path.join(a.root, OUT)
    os.makedirs(os.path.dirname(out) or ".", exist_ok=True)
    with open(out, "w", encoding="utf-8") as f:
        f.write(json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n")
    if not a.quiet:
        print("wrote %s: %d credentials with issuer skills, %d with harvested outcomes; outcomes cover %d courses at %d colleges"
              % (os.path.relpath(out, a.root), data["counts"]["credentials_with_skills"], data["counts"]["with_outcomes"],
                 data["cover"]["courses"], data["cover"]["colleges"]))
    return 0


if __name__ == "__main__":
    sys.exit(main())
