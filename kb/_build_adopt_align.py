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
  library/adopt/adopt_more.json                  the not-yet-evaluated credentials (unreviewed, below)

Unreviewed credentials (#3405, COBIx's next step after the CPL-AI title chips): a not-yet-evaluated credential has no
articulating college, so its issuer skill areas are scored against every harvested course. A course is a standout when
it covers at least STANDOUT_MIN skill areas and at least half of them, each at COVERED_AT. The section is written with
chips_shown false: the page shows no chip from it until a session has read what the daily run produced and turned it
on (no chip that reads as an expectation before anyone has looked).

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
STANDOUT_MIN = 3   # an unreviewed credential's course must cover at least this many skill areas, and at least half
TOP_COURSES = 3    # standout courses kept per unreviewed credential, strongest first
RARE_DF = 0.002    # a distinctive outcome word appears in at most this share of harvested outcomes
TITLE_DF = 0.01    # a distinctive course-title word appears in at most this share of course titles
RARE_MIN = 2       # the floor on those counts, so a small corpus (a test) still has distinctive words

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
    """Every course's SLO rows: college, course_code, course_title, outcomes. Range-paginated (Rule 10 b). kind=eq.slo:
    the table also holds each course's objectives (kind objective, S584), which are not SLOs (COBIx on #3263)."""
    rows, start = [], 0
    while True:
        req = urllib.request.Request(
            URL + "/rest/v1/course_outcomes?select=college,course_code,course_title,kind,outcomes,read_run&kind=eq.slo&order=id",
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
    """(college, course key) -> the newest read's SLO row, with its outcome texts cleaned. A row of another kind (a
    course's objectives) never stands in for its SLOs, whatever its read_run."""
    by = {}
    for r in rows:
        if (r.get("kind") or "slo") != "slo":
            continue
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


def domains_of(rec):
    out = []
    for s in rec.get("skills") or []:
        name = s.get("domain") or s.get("skill") or s.get("name") or json.dumps(s, ensure_ascii=False)
        t = tokens(name)
        if t:
            out.append((name, t))
    return out


def score_unreviewed(joined, outcomes):
    """Each unreviewed credential's skill areas against every harvested course, on distinctive words only.

    The first run (2026-11-16 22:04Z) scored on every word: 151 of 191 credentials had a "standout" at all 19 colleges,
    many absurd (a fitness course for Identity and Access Administrator, a retailing course for CISA). Common words
    such as "planning", "management" and "systems" carried them. So:
      - a word is distinctive when it appears in at most RARE_DF of all harvested outcomes;
      - a skill area is scorable when it holds a distinctive word, and an outcome covers it when the outcome shares
        at least half of the area's distinctive words (one at least);
      - a course is a standout when it covers at least STANDOUT_MIN scorable areas and at least half of them, and its
        own title shares a distinctive title word (at most TITLE_DF of course titles) with the credential's title or
        its skill areas.
    Returns {title: {of, scorable, need, standouts: n colleges, top: [[college, code, course title, covered, share]]}}."""
    index, outs = {}, []
    for k, r in outcomes.items():
        for o in r.get("_outs") or []:
            t = tokens(o)
            if not t:
                continue
            i = len(outs)
            outs.append(k)
            for w in t:
                index.setdefault(w, []).append(i)
    n_out = max(1, len(outs))
    rare = lambda w: 0 < len(index.get(w, ())) <= max(RARE_MIN, RARE_DF * n_out)
    title_df = {}
    for r in outcomes.values():
        for w in tokens(r.get("course_title")):
            title_df[w] = title_df.get(w, 0) + 1
    n_titles = max(1, len(outcomes))
    title_ok = lambda w: 0 < title_df.get(w, 0) <= max(RARE_MIN, TITLE_DF * n_titles)
    result = {}
    for title, rec in sorted(joined.items(), key=lambda kv: kv[0].lower()):
        doms = domains_of(rec)
        scored = [(name, {w for w in dt_ if rare(w)}) for name, dt_ in doms]
        scored = [(name, rd) for name, rd in scored if rd]
        need = max(STANDOUT_MIN, math.ceil(len(scored) / 2))
        if len(scored) < STANDOUT_MIN:
            continue
        cred_words = tokens(title).union(*[dt_ for _, dt_ in doms])
        covered = {}  # course key -> {domain index: share of its distinctive words matched}
        for di, (_, rd) in enumerate(scored):
            hits = {}
            for w in rd:
                for i in index.get(w, ()):
                    hits[i] = hits.get(i, 0) + 1
            want = max(1, math.ceil(len(rd) / 2))
            for i, n in hits.items():
                if n >= want:
                    d = covered.setdefault(outs[i], {})
                    d[di] = max(d.get(di, 0), n / len(rd))
        stand = []
        for k, d in covered.items():
            if len(d) < need:
                continue
            r = outcomes[k]
            if not any(title_ok(w) for w in tokens(r.get("course_title")) & cred_words):
                continue
            stand.append([k[0], r.get("course_code") or k[1], r.get("course_title") or "", len(d),
                          round(sum(d.values()) / len(d), 2)])
        if not stand:
            continue
        stand.sort(key=lambda x: (-x[3], -x[4], x[0], x[1]))
        result[title] = {"of": len(doms), "scorable": len(scored), "need": need,
                         "standouts": len({x[0] for x in stand}), "top": stand[:TOP_COURSES]}
    return result


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
    more = load_json(os.path.join(root, "library/adopt/adopt_more.json")) or {}
    unrev_titles = [h["t"] for h in more.get("harvested") or [] if h.get("ms") != "inmap" and h.get("t")]
    unrev_joined = {t: r for t, r in skill_titles(skills, unrev_titles).items() if t not in joined}
    unreviewed = score_unreviewed(unrev_joined, outcomes)
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
        "counts": {"credentials_with_skills": len(joined), "with_outcomes": with_courses,
                   "unreviewed_with_skills": len(unrev_joined), "unreviewed_with_standout": len(unreviewed)},
        "align": align,
        # Not-yet-evaluated credentials: a named course that covers at least STANDOUT_MIN and half of the issuer's skill
        # areas. chips_shown stays false until a session has read this section and turned the page's chips on.
        "unreviewed": {"chips_shown": False, "rule": "distinctive words only (outcome df <= %.3f, title df <= %.2f); covers >= max(%d, half) scorable skill areas; the course title shares a distinctive word" % (RARE_DF, TITLE_DF, STANDOUT_MIN),
                       "by_title": unreviewed},
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
        print("wrote %s: %d credentials with issuer skills, %d with harvested outcomes; outcomes cover %d courses at %d colleges; "
              "%d unreviewed credentials with skills, %d with a standout course"
              % (os.path.relpath(out, a.root), data["counts"]["credentials_with_skills"], data["counts"]["with_outcomes"],
                 data["cover"]["courses"], data["cover"]["colleges"], data["counts"]["unreviewed_with_skills"],
                 data["counts"]["unreviewed_with_standout"]))
    return 0


if __name__ == "__main__":
    sys.exit(main())
