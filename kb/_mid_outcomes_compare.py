#!/usr/bin/env python3
"""MID re-clustering, Step 1: a no-write comparison of each M-ID against its members' outcomes and objectives.

Issue #2962 and COBIx's operational brief of 2026-11-12; Sam's go, relayed by COBIx, 2026-11-12: "yes, let's roll!"
(cpl_memory sam-mid-reclustering-step-1-go-2026-11-12). The M-IDs were clustered on subject, number, title and TOP.
This script asks what the harvested student learning outcomes and course objectives say about each grouping:
Confirmed, Split, Merge candidate, or Not enough text. It writes two files under kb/status/ and nothing else: no
table, no M-ID, no unified_courses artifact.

THE METHOD, IN TWO SENTENCES. Each course's outcome and objective statements become word stems, with the lead-ins
("Upon successful completion...") and the generic verbs ("identify", "describe", "analyze") removed and every stem
weighted by how rare it is across all harvested courses; two courses agree when the cosine of their weighted stems
reaches LINK. Inside an M-ID the courses that agree form groups, and more than one group is a proposed split only when
the descriptions or the course titles also disagree; a description pair and a title pair corroborate, TOP never does.

Standing rules this file enforces (each has a test in tests/mid_outcomes_compare_test.py):
  * A missing or thin SLO never counts against a course (Sam, 2026-11-09, on #2962): a member with no text joins no
    group and is never the reason for a split.
  * An SLO never overrides on its own (same ruling): a split the outcomes alone propose is "limited", a flag for a
    person, and a merge needs the description or the title to agree before it is a candidate above limited.
  * TOP is a last-in-line corroborator (CLAUDE.md Rule 7): it is shown, and never used to split, merge or confirm.
  * Units never split an identity (Sam, 2026-09-27): units are shown as a range and read by nothing else.
  * Three confidence levels, Sam's three match levels (Open Asks Sheet 181, 2026-11-11; cpl_memory
    d-sheet-181-replies-2026-11-11): strong, partial and limited, with the reasons shown.
  * A stored M-ID resolves through kb/alias_chain.py before it is compared with the live set (Rule 7, ruling 8).
  * One district is one voice (COBIx on #2962, 2026-11-12, comment 6829696579): two colleges of one district print
    one outline, so a pair inside one district never makes a confirmation, a split or a merge above what one college
    alone could. The district comes from the committed college identity crosswalk (kb/_college_identity_latest.py).
  * A live read that returns zero rows stops the run (COBIx on #3165): an empty table is never reported on.

Sources:
  outcomes   kb/course_outcomes/<host>/read_*.json, the reads public.course_outcomes is loaded from, turned into rows
             by kb/_course_outcomes_load.py's own rows_from (one copy of that logic); or, with --source live, the table
             itself through PostgREST, read-only and Range-paginated (Rule 10 b), with SUPABASE_ANON_KEY only (the
             table grants select to anon); a missing key or a short read stops the run, with no fallback.
  members    unified_courses_members.js and unified_courses_member_desc.js (rebuilt nightly, current-era keys).
  titles     unified_courses_index.js.
  reach      unified_courses_aligned.js (rebuilt nightly from kb/coci_articulations.json, keyed by course identity):
             the credentials that articulate to each M-ID, by MAP's CPL type. Credit by exam takes its title from
             the M-ID, so it is a split's reach; an industry certification keeps its official name (Sam,
             2026-11-12, sam-cert-title-official-name-not-mid-2026-11-12) and is shown, never counted toward it.
             kb/exhibits_review.json adds the held titles in the Review queue whose title comes "from M-ID ...".
  districts  kb/college_identity/<newest>/crosswalk.json, through kb/_college_identity_latest.py.
  subjects   kb/reference/subject_discipline_map.json, for the structural check (a member whose subject code names
             another discipline than the rest of its M-ID); TOP is never read for it.

    python3 kb/_mid_outcomes_compare.py                    # committed reads; writes kb/status/mid_outcomes_compare_<date>.*
    python3 kb/_mid_outcomes_compare.py --source live      # the table (on a runner)
    python3 kb/_mid_outcomes_compare.py --date 2026-11-12 --stdout   # print the summary, write nothing

Standard library only; no model, no paid call.
"""
from __future__ import annotations

import argparse
import datetime as dt
import glob
import importlib.util
import json
import math
import os
import re
import sys
import urllib.request
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)

from _suggest_unclassified import load_js, norm_college, split_code  # noqa: E402
from _college_identity_latest import latest_crosswalk_path  # noqa: E402
import alias_chain  # noqa: E402


def _load(name, file):
    spec = importlib.util.spec_from_file_location(name, os.path.join(HERE, file))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


# The Postgres-english lexemes the exhibit SLO hints already use, and the load's own row builder: one copy of each.
_slo = _load("build_exhibit_slo_neighbors", "_build_exhibit_slo_neighbors.py")
lexemes, stem = _slo.lexemes, _slo._stem

URL = os.environ.get("SUPABASE_URL", "https://hvuwhnbuahrtptokpqfh.supabase.co").rstrip("/")
OUT_DIR = os.path.join(ROOT, "kb", "status")

# ── The thresholds (stated in the report; calibration printed beside them) ─────────────────────────────────────────
LINK = 0.30          # outcome cosine at which two courses teach alike
STRONG = 0.50        # mean outcome cosine for a strong confirmation
MERGE = 0.55         # outcome cosine across two M-IDs for a merge candidate
DESC_LINK = 0.30     # description cosine at which two descriptions agree
DESC_STRONG = 0.50   # description cosine a strong merge needs when the two titles each name something the other lacks
TITLE_AGREE = 0.50   # title stem Jaccard at or above which two titles agree
MIN_LEX = 12         # fewer stems than this after stripping is thin text, treated as none
MIN_LINES = 2        # so is a single statement
BOILER_COURSES = 4   # a statement printed word for word by this many distinct course codes is boilerplate
MAX_DF_SHARE = 0.15  # a stem in more than this share of documents carries no signal

# Sam's three match levels (Sheet 181, 2026-11-11).
LEVELS = ("strong", "partial", "limited")
CLASSES = ("Confirmed", "Split", "Merge candidate", "Not enough text")
# The first run of 2026-11-12 (#3165, 41eeb44a), before the district guard: (all, strong), shown beside the counts.
FIRST_RUN = {"Confirmed": (557, 221), "Split": (760, 19), "Merge candidate": (221, 63), "Not enough text": (319, None)}

# The verbs and words every outcome statement uses: removed before weighting. Stemmed the way lexemes() stems.
GENERIC = {stem(w) for w in """
identify describe explain demonstrate analyze analyse apply evaluate understand use utilize discuss develop compare
contrast define recognize interpret perform complete successful success upon learn learning outcome outcomes skill
skills knowledge concept concepts basic effective effectively include including various relate related student
students course courses able ability will should demonstrate demonstration create assess examine summarize illustrate
distinguish construct produce prepare practice principle principles appropriate appropriately proper properly
understanding knowledgeable competency competencies competent proficiency proficient method methods technique
techniques process processes topic topics area areas level levels different variety range key fundamental
fundamentals introduction introductory introduce work working information formulate articulate determine
""".split()}

LEAD_IN = [
    # An institutional outcome label SDCCD and others print before the statement ("Critical Thinking: ...").
    re.compile(r"^\s*[A-Z][A-Za-z&/,' -]{2,40}:\s+"),
    re.compile(r"^\s*(upon|after|by the end of|at the (end|conclusion) of|on)\b[^:,;]{0,120}[:,;]\s*", re.I),
    re.compile(r"^\s*(the\s+)?(students?|learners?|participants?)\s+(will|should|shall|can|must)?\s*(be\s+able\s+to)?\s*[:,]?\s*",
               re.I),
    re.compile(r"^\s*(be\s+able\s+to)\s*", re.I),
]
DESC_NOISE = re.compile(
    r"(^|(?<=[.;]))\s*(prerequisites?|corequisites?|advisor(y|ies)|recommended( preparation)?|limitation on enrollment|"
    r"transfer(s|able)?( to)?|c-id|formerly|not open to|may be taken|repeatab\w*|grading|units?|lecture|lab)\b[^.]*\.?",
    re.I)


# ── Text to weighted stems ─────────────────────────────────────────────────────────────────────────────────────────

def strip_lead(line):
    s = str(line or "").strip()
    for rx in LEAD_IN:
        s = rx.sub("", s, count=1)
    return s


def stems_of(text):
    return [t for t in lexemes(text) if t not in GENERIC]


def norm_line(line):
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9 ]", " ", str(line or "").lower())).strip()


class Space:
    """Sublinear TF times IDF over a set of documents, a stem in more than MAX_DF_SHARE of them dropped."""

    def __init__(self, docs):
        self.n = max(1, len(docs))
        df = Counter()
        for toks in docs.values():
            df.update(set(toks))
        cap = MAX_DF_SHARE * self.n if self.n >= 40 else self.n + 1
        self.idf = {t: math.log(self.n / c) + 1.0 for t, c in df.items() if c <= cap}
        self.vec = {k: self._vec(toks) for k, toks in docs.items()}

    def _vec(self, toks):
        tf = Counter(t for t in toks if t in self.idf)
        v = {t: (1 + math.log(c)) * self.idf[t] for t, c in tf.items()}
        norm = math.sqrt(sum(x * x for x in v.values())) or 1.0
        return {t: x / norm for t, x in v.items()}

    def sim(self, a, b):
        va, vb = self.vec.get(a), self.vec.get(b)
        if not va or not vb:
            return None
        if len(va) > len(vb):
            va, vb = vb, va
        return round(sum(x * vb.get(t, 0.0) for t, x in va.items()), 4)


def title_stems(title):
    return set(lexemes(title))


def title_jaccard(a, b):
    sa, sb = title_stems(a), title_stems(b)
    if not sa or not sb:
        return None
    return round(len(sa & sb) / len(sa | sb), 4)


def titles_distinct(a, b):
    """Two titles name different things: a shared stem may remain, but each keeps a word the other lacks."""
    sa, sb = title_stems(a), title_stems(b)
    if not sa or not sb:
        return False
    return bool(sa - sb) and bool(sb - sa) and (len(sa & sb) / len(sa | sb)) < 0.6


LEVEL_WORDS = {"beginning": "1", "elementary": "1", "intermediate": "2", "advanced": "3"}
ROMAN = {"i": "1", "ii": "2", "iii": "3", "iv": "4", "v": "5", "vi": "6"}


def level_of(title):
    """The level a title names, as (stage, step): a level word (beginning, elementary, intermediate, advanced) and a
    roman numeral or digit after the first word, each "1" when absent. Both are read, so Elementary Spanish II is
    (1, 2) and Spanish: Beginning I is (1, 1); the first run read the level word alone and took them for one level."""
    t = re.sub(r"[^a-z0-9 ]", " ", str(title or "").lower()).split()
    stage = next((LEVEL_WORDS[w] for w in t if w in LEVEL_WORDS), "1")
    step = next((ROMAN.get(w, w) for w in t[1:] if (w in ROMAN and w != "v") or re.fullmatch(r"\d", w)), "1")
    return stage, step


LAB = {"lab", "laboratory", "labs"}


def levels_differ(a, b):
    """Two titles of one sequence (Design and Design II, Spanish 1 and 2), or a lecture and its laboratory
    (Biological Anthropology and Biological Anthropology Laboratory): a merge of them is never proposed."""
    wa = set(re.sub(r"[^a-z0-9 ]", " ", str(a or "").lower()).split())
    wb = set(re.sub(r"[^a-z0-9 ]", " ", str(b or "").lower()).split())
    return level_of(a) != level_of(b) or bool(wa & LAB) != bool(wb & LAB)


def nice_title(t):
    t = " ".join(str(t or "").split())
    return t.title() if t.isupper() else t


# ── Inputs ─────────────────────────────────────────────────────────────────────────────────────────────────────────

def outcome_rows_from_files(root=ROOT):
    """Every row kb/_course_outcomes_load.py would post, from the committed reads (its own rows_from)."""
    load = _load("course_outcomes_load", "_course_outcomes_load.py")
    rows, hosts = [], []
    base = os.path.join(root, "kb", "course_outcomes")
    for host in sorted(os.listdir(base)):
        if host.startswith("trial") or not os.path.isdir(os.path.join(base, host)):
            continue
        paths = load.read_files(host)
        if not paths:
            continue
        got, _skipped = load.rows_from(paths, host)
        rows.extend(got)
        hosts.append(host)
    return rows, hosts


def _get_page(endpoint, key, start, page):
    """One Range page and the table's exact total from Content-Range (Prefer: count=exact)."""
    req = urllib.request.Request(endpoint, headers={
        "apikey": key, "Authorization": "Bearer " + key, "Accept": "application/json",
        "Prefer": "count=exact", "Range-Unit": "items", "Range": "%d-%d" % (start, start + page - 1)})
    with urllib.request.urlopen(req, timeout=60) as r:
        got = json.load(r)
        rng = r.headers.get("Content-Range") or ""
    total = rng.rsplit("/", 1)[-1] if "/" in rng else ""
    return got or [], int(total) if total.isdigit() else None


def outcome_rows_live(get_page=None, env=None):
    """course_outcomes through PostgREST with the anon key only (the table grants select to anon,
    chatbox/supabase_course_outcomes.sql), Range-paginated; the newest read_run per college, code and kind.
    A missing key or a read short of the table's exact count stops the run: it never falls back to the committed
    reads, and never reports on a truncated read (COBIx on #3165, 2026-11-12)."""
    env = os.environ if env is None else env
    key = env.get("SUPABASE_ANON_KEY")
    if not key:
        raise SystemExit("--source live needs SUPABASE_ANON_KEY (the public anon key; a read-only GET). "
                         "It does not fall back to the committed reads.")
    get_page = get_page or _get_page
    endpoint = (URL + "/rest/v1/course_outcomes?select=college,course_code,course_title,kind,outcomes,read_run,"
                "source_url&order=id.asc")
    rows, start, page, total = [], 0, 1000, None
    while True:
        got, n = get_page(endpoint, key, start, page)
        total = n if n is not None else total
        rows.extend(got)
        if not got or len(got) < page:
            break
        start += page
    if total is None:
        raise SystemExit("course_outcomes sent no exact count (Content-Range); the read cannot be checked whole.")
    if len(rows) != total:
        raise SystemExit("course_outcomes read %d rows of %d: the pager stopped short (a max-rows cap?)"
                         % (len(rows), total))
    if not rows:
        # An empty read matches an empty count, so the check above passes it; a report on no outcomes would class
        # every M-ID Not enough text and read as a finding (COBIx on #3165, 2026-11-12).
        raise SystemExit("course_outcomes returned zero rows: nothing to compare, and no report is written. "
                         "Check the table and its anon grant before rerunning.")
    newest = {}
    for r in rows:
        k = (r.get("college"), r.get("course_code"), r.get("kind"))
        try:
            run = int(r.get("read_run") or 0)
        except (TypeError, ValueError):
            run = 0
        newest[k] = max(newest.get(k, -1), run)
    keep = []
    for r in rows:
        try:
            run = int(r.get("read_run") or 0)
        except (TypeError, ValueError):
            run = 0
        if run == newest[(r.get("college"), r.get("course_code"), r.get("kind"))]:
            outs = r.get("outcomes") or []
            r["outcomes"] = json.loads(outs) if isinstance(outs, str) else outs
            keep.append(r)
    return keep


def course_key(college, code):
    sc = split_code(code)
    return (norm_college(college), sc) if sc else None


def build_courses(rows):
    """(college, (subj, num)) -> {college, code, title, lines, kinds, sources}: SLOs and objectives together,
    distinct statements in the order printed, boilerplate statements removed."""
    courses = {}
    for r in rows:
        k = course_key(r.get("college"), r.get("course_code"))
        if not k:
            continue
        c = courses.setdefault(k, {"college": r.get("college"), "code": r.get("course_code"),
                                   "title": r.get("course_title"), "lines": [], "kinds": set(), "sources": set()})
        c["kinds"].add(r.get("kind") or "slo")
        if r.get("source_url"):
            c["sources"].add(r["source_url"])
        for line in r.get("outcomes") or []:
            line = " ".join(str(line).split())
            if line and line not in c["lines"]:
                c["lines"].append(line)
    # A statement printed word for word by many courses is the outline's template, not the course.
    # Counted by distinct course code, so a district outline printed for three colleges counts once.
    by_line = defaultdict(set)
    for k, c in courses.items():
        for x in c["lines"]:
            by_line[norm_line(strip_lead(x))].add(k[1])
    boiler = {x for x, codes in by_line.items() if len(codes) >= BOILER_COURSES}
    for c in courses.values():
        c["lines"] = [x for x in c["lines"] if norm_line(strip_lead(x)) not in boiler]
        c["stems"] = [t for x in c["lines"] for t in stems_of(strip_lead(x))]
    return courses, len(boiler)


def clean_college(name):
    name = (name or "").strip()
    if "Ã" in name:
        try:
            name = name.encode("latin-1").decode("utf-8")
        except (UnicodeEncodeError, UnicodeDecodeError):
            pass
    return name


def load_members(root=ROOT):
    m = load_js(os.path.join(root, "unified_courses_members.js"))
    d = load_js(os.path.join(root, "unified_courses_member_desc.js"))
    names = [clean_college(c) for c in m["colleges"]]
    desc = d.get("desc") or {}
    out = {}
    for mid, rows in (m.get("members") or {}).items():
        ds = desc.get(mid) or []
        out[mid] = [{"college": names[r["c"]] if isinstance(r.get("c"), int) and r["c"] < len(names) else "",
                     "code": r.get("n") or "", "title": r.get("t") or "", "units": r.get("u"), "top": r.get("p"),
                     "desc": ds[i] if i < len(ds) else ""} for i, r in enumerate(rows)]
    return out, m.get("generated_at")


def load_index(root=ROOT):
    path = os.path.join(root, "unified_courses_index.js")
    with open(path, encoding="utf-8") as f:
        src = f.read()
    start = re.search(r"window\.\w+\s*=\s*\[", src).end() - 1
    rows = json.loads(src[start:src.rindex("]") + 1])
    return {r[0]: {"title": r[1], "subject": r[2]} for r in rows}


def load_reach(root=ROOT):
    """M-ID -> the Exhibit Reference titles whose canonical title comes from it (the Review card's
    "Canonical title, from M-ID ...")."""
    path = os.path.join(root, "kb", "exhibits_review.json")
    if not os.path.exists(path):
        return {}
    d = json.load(open(path, encoding="utf-8"))
    out = defaultdict(list)
    for h in d.get("held") or []:
        frm = str(h.get("from") or "")
        if frm.startswith("M-ID ") and h.get("aligned_id"):
            out[h["aligned_id"]].append({"raw": h.get("raw"), "title": h.get("title"), "exhibits": h.get("ids") or []})
    return dict(out)


CBE, CERT = "Credit By Exam", "Industry Certification"


def load_aligned(root=ROOT, live=None):
    """M-ID -> {"cbe": [...], "cert": [...], "other": n}: the credentials unified_courses_aligned.js says articulate to
    it, by MAP's modal CPL type. Each entry is [credential, issuer, earning colleges].

    The file's keys are course identities written from kb/coci_articulations.json, which carries its applied re-key
    markers and is re-keyed at every apply (kb/_build_remint_blast_radius.py's reading 2: resolving it again
    double-applies). So the keys pass through alias_chain with the newest map as the baseline: no map is pending and
    no key moves. Measured 2026-11-12: from any baseline after 2026-06-12 the same 1,487 of 2,319 keys hit the
    members file; the rest name no live M-ID and are returned, never dropped (they are the articulations
    kb/remint_blast_worklist.json already lists as homeless). live: the set of live M-IDs to test against."""
    path = os.path.join(root, "unified_courses_aligned.js")
    if not os.path.exists(path):
        return {}, []
    raw = (load_js(path) or {}).get("aligned") or {}
    pending, _ = alias_chain.pending_maps(None, baseline_through=alias_chain.ALIAS_MAPS[-1])
    maps = alias_chain.load_maps(pending)
    out, homeless = {}, []
    for key, items in raw.items():
        mid = alias_chain.resolve_id(key, maps)
        if live is not None and mid not in live:
            homeless.append(key)
            continue
        rec = out.setdefault(mid, {"cbe": [], "cert": [], "other": 0})
        for x in items or []:
            entry = [x.get("c") or "", x.get("i") or "", int(x.get("n") or 0)]
            if x.get("p") == CBE:
                rec["cbe"].append(entry)
            elif x.get("p") == CERT:
                rec["cert"].append(entry)
            else:
                rec["other"] += 1
    return out, sorted(homeless)


def load_districts(root=ROOT):
    """normalized college name -> district, from the newest committed identity crosswalk (its name, short and
    every variant). A college the crosswalk does not name is its own voice."""
    base = os.path.join(root, "kb", "college_identity")
    try:
        path = latest_crosswalk_path(base)
    except SystemExit:
        return {}, None
    with open(path, encoding="utf-8") as f:
        doc = json.load(f)
    out = {}
    for r in doc.get("colleges") or []:
        if not r.get("district"):
            continue
        for n in [r.get("college_name"), r.get("short")] + list(r.get("variants") or []):
            if n:
                out.setdefault(norm_college(n), r["district"])
    return out, os.path.relpath(path, root)


def voice_of(districts):
    """college name -> the voice it speaks with: its district, else the college itself."""
    def voice(college):
        k = norm_college(college)
        return districts.get(k) or ("college:" + k)
    return voice


def load_subject_map(root=ROOT):
    path = os.path.join(root, "kb", "reference", "subject_discipline_map.json")
    if not os.path.exists(path):
        return {}
    with open(path, encoding="utf-8") as f:
        return (json.load(f) or {}).get("map") or {}


def subject_outliers(members, subject_map, index=None):
    """The structural check (COBIx, 6829696579 point 3): a member whose subject code names a different discipline
    from the rest of its M-ID, with no outcome text needed. A subject reads as a discipline only through the
    conservative subject_discipline_map (ambiguous codes are null there and are read as nothing); TOP is never read.
    A member is an outlier when at least three members map, one discipline is held by at least two of them and by more
    than half of those that map, the member's own discipline is a different one held by at most a quarter of them,
    and its title does not agree with the M-ID's title (stem overlap below TITLE_AGREE): an Introduction to Public
    Health filed under ALH is a prefix, not another course. index: M-ID -> {"title": ...}.
    Returns {mid: {"discipline": modal, "outliers": [[college, code, title, discipline], ...]}}."""
    out = {}
    index = index or {}
    for mid, ms in members.items():
        if len(ms) < 3:
            continue
        mapped = []
        for m in ms:
            sc = split_code(m.get("code"))
            subj = re.sub(r"[^A-Z0-9]", "", (sc[0] if sc else "").upper())
            d = subject_map.get(subj)
            if d:
                mapped.append((m, subj, d))
        if len(mapped) < 3:
            continue
        disc = Counter(d for _, _, d in mapped)
        modal, n_modal = disc.most_common(1)[0]
        if n_modal < 2 or n_modal * 2 <= len(mapped):
            continue
        mid_title = (index.get(mid) or {}).get("title") or proposed_title(ms)
        odd = [[m["college"], m["code"], nice_title(m["title"]), d] for m, s, d in mapped
               if d != modal and disc[d] * 4 <= len(mapped)
               and (title_jaccard(m["title"], mid_title) or 0) < TITLE_AGREE]
        if odd:
            out[mid] = {"discipline": modal, "outliers": odd, "mapped": len(mapped), "members": len(ms)}
    return out


def resolve_named(ids, baseline=None):
    """A stored M-ID (one a person named on a date) through the alias chain: the maps applied after its era.
    The named ids here were cited on 2026-11-11, after the last applied map, so the baseline is that map."""
    pending, _ = alias_chain.pending_maps(None, baseline_through=baseline or alias_chain.ALIAS_MAPS[-1])
    maps = alias_chain.load_maps(pending)
    return {i: alias_chain.resolve_id(i, maps) for i in ids}


# ── The comparison ─────────────────────────────────────────────────────────────────────────────────────────────────

def components(nodes, edge):
    """Connected groups of nodes (dicts with an index "i") under edge(a, b)."""
    parent = {n["i"]: n["i"] for n in nodes}

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    for i, a in enumerate(nodes):
        for b in nodes[i + 1:]:
            if edge(a, b):
                parent[find(a["i"])] = find(b["i"])
    groups = defaultdict(list)
    for n in nodes:
        groups[find(n["i"])].append(n)
    return sorted(groups.values(), key=lambda g: (-len(g), g[0]["i"]))


def proposed_title(members):
    c = Counter(nice_title(m["title"]) for m in members if m.get("title"))
    return c.most_common(1)[0][0] if c else ""


def compare_mid(mid, members, courses, out_space, desc_space, voice=None):
    """One M-ID's result. members: the members file's rows; each gets 'key' and 'text' (enough outcome text).
    voice: college -> district (one district is one voice); each college is its own voice when not given."""
    voice = voice or voice_of({})
    rows = []
    for i, m in enumerate(members):
        k = course_key(m["college"], m["code"])
        c = courses.get(k) if k else None
        n = len(c["stems"]) if c else 0
        rows.append(dict(m, i=i, key=k, has_text=bool(c and c["lines"]),
                         text=bool(c and n >= MIN_LEX and len(c["lines"]) >= MIN_LINES),
                         lines=(c["lines"] if c else []), source=sorted(c["sources"])[0] if c and c["sources"] else None))
    text = [r for r in rows if r["text"]]
    units = sorted({float(r["units"]) for r in rows if isinstance(r.get("units"), (int, float))})
    res = {"mid": mid, "members": len(rows), "colleges": len({norm_college(r["college"]) for r in rows}),
           "with_text": len(text), "has_text": sum(1 for r in rows if r["has_text"]), "thin": sum(1 for r in rows if r["has_text"] and not r["text"]),
           "units": [units[0], units[-1]] if units else None,
           "tops": sorted({r["top"] for r in rows if r.get("top")}),
           "same_college_suite": max(Counter(norm_college(r["college"]) for r in rows).values() or [0]) >= 2,
           "districts_with_text": len({voice(r["college"]) for r in text})}
    if len(text) < 2:
        res.update(cls="Not enough text", level=None,
                   why="fewer than two members print enough outcome text (%d of %d); a missing SLO counts against no one"
                       % (len(text), len(rows)))
        res["rows"] = rows
        return res

    def osim(a, b):
        return out_space.sim(a["key"], b["key"])

    def dsim(a, b):
        return desc_space.sim(("d", mid, a["i"]), ("d", mid, b["i"]))

    pairs = []
    for x in range(len(text)):
        for y in range(x + 1, len(text)):
            a, b = text[x], text[y]
            pairs.append({"a": a["i"], "b": b["i"], "out": osim(a, b), "desc": dsim(a, b),
                          "title": title_jaccard(a["title"], b["title"]),
                          "same_outline": bool(a["source"] and a["source"] == b["source"]),
                          "same_district": voice(a["college"]) == voice(b["college"])})
    by = {(p["a"], p["b"]): p for p in pairs}

    def pair(a, b):
        return by.get((a["i"], b["i"])) or by.get((b["i"], a["i"]))

    groups = components(text, lambda a, b: (pair(a, b)["out"] or 0) >= LINK)
    res["pairs"] = pairs
    if len(groups) == 1:
        # A pair inside one district is one voice: its outlines agree by construction (RCCD, SDCCD).
        indep = [p for p in pairs if not p["same_outline"] and not p["same_district"]]
        mean = sum(p["out"] or 0 for p in indep) / len(indep) if indep else None
        desc_ok = any((p["desc"] or 0) >= DESC_LINK for p in indep)
        title_ok = any((p["title"] or 0) >= TITLE_AGREE for p in indep)
        if mean is None:
            level, why = "limited", ("the members that agree sit in one district (or print one shared outline), so "
                                     "the agreement is one voice")
        elif mean >= STRONG and (desc_ok or title_ok):
            level, why = "strong", "outcomes agree (mean %.2f) and the %s agree too" % (
                mean, "descriptions" if desc_ok else "titles")
        elif min(p["out"] or 0 for p in indep) >= LINK or mean >= LINK:
            level, why = "partial", "outcomes agree (mean %.2f)%s" % (
                mean, "" if (desc_ok or title_ok) else ", with no second signal")
        else:
            level, why = "limited", "the members connect only through a chain of agreeing pairs (mean %.2f)" % mean
        res.update(cls="Confirmed", level=level, why=why, mean_out=round(mean, 4) if mean is not None else None)
    else:
        # Every pair of groups: does the description, or the title, also say they differ? TOP and units are not read.
        desc_votes, title_votes, cross = 0, 0, []
        for gi in range(len(groups)):
            for gj in range(gi + 1, len(groups)):
                ps = [pair(a, b) for a in groups[gi] for b in groups[gj]]
                ds = [p["desc"] for p in ps if p["desc"] is not None]
                d_split = bool(ds) and max(ds) < DESC_LINK
                t_split = all(titles_distinct(a["title"], b["title"]) for a in groups[gi] for b in groups[gj])
                desc_votes += d_split
                title_votes += t_split
                cross.append({"groups": [gi, gj], "max_out": max((p["out"] or 0) for p in ps),
                              "max_desc": max(ds) if ds else None, "desc_disagrees": d_split, "titles_differ": t_split})
        n_cross = len(cross)
        d_all, t_all = desc_votes == n_cross, title_votes == n_cross
        # A college that files courses in two groups has itself said they are different courses (two codes). A
        # split that rests only on different colleges' wording can be a paraphrase, so it is never above partial.
        where = defaultdict(set)
        for gi, g in enumerate(groups):
            for r in g:
                where[norm_college(r["college"])].add(gi)
        same_college = any(len(v) > 1 for v in where.values())
        # One district is one voice (COBIx, 6829696579): a group made of one district's colleges is one outline,
        # so a strong split needs a group that two districts' outlines put together.
        cross_district_group = any(len({voice(r["college"]) for r in g}) >= 2 for g in groups)
        if d_all and t_all and same_college and cross_district_group:
            level, why = "strong", ("outcomes, descriptions and titles all say the groups teach different things, one "
                                    "college files courses in more than one group, and a group holds outlines from "
                                    "two or more districts")
        elif d_all and t_all and same_college:
            level, why = "partial", ("outcomes, descriptions and titles say the groups differ and one college files "
                                     "courses in more than one group, but every group sits inside one district, so "
                                     "this is one district's catalog, and word overlap cannot tell a different course "
                                     "from a paraphrase")
        elif d_all and t_all:
            level, why = "partial", ("outcomes, descriptions and titles say the groups differ, but each college sits in "
                                     "one group, so different wording of one course is not ruled out")
        elif d_all or t_all:
            level, why = "partial", "outcomes and the %s say the groups differ; the %s do not" % (
                ("descriptions", "titles") if d_all else ("titles", "descriptions"))
        else:
            level, why = "limited", ("only the outcomes say the groups differ: a flag for a person, never a split "
                                     "on its own")
        res.update(cls="Split", level=level, why=why, cross=cross, same_college_split=same_college,
                   cross_district_group=cross_district_group,
                   groups=[{"members": [r["i"] for r in g], "title": proposed_title(g),
                            "colleges": sorted({r["college"] for r in g}),
                            "districts": len({voice(r["college"]) for r in g})} for g in groups],
                   unplaced=[r["i"] for r in rows if not r["text"]])
    res["rows"] = rows
    return res


def merge_candidates(mid_rows, out_space, desc_space, voice=None):
    """Course pairs across two M-IDs of one Common SUBJ whose outcomes agree at MERGE or more. A candidate above
    limited needs the description or the title to agree as well, and the two courses must sit in two districts: a
    pair inside one district is one voice (COBIx, 6829696579; BIOL M1094/M1095 rested on one RCCD outline)."""
    voice = voice or voice_of({})
    by_subj = defaultdict(list)
    for mid, rows in mid_rows.items():
        subj = mid.split(" ")[0]
        for r in rows:
            if r["text"]:
                by_subj[subj].append((mid, r))
    found = defaultdict(list)
    for subj, items in by_subj.items():
        # An inverted index over each course's strongest stems keeps this from being every pair.
        post = defaultdict(set)
        for n, (_mid, r) in enumerate(items):
            v = out_space.vec.get(r["key"]) or {}
            for t in sorted(v, key=v.get, reverse=True)[:8]:
                post[t].add(n)
        seen = set()
        for ns in post.values():
            ns = sorted(ns)
            if len(ns) > 400:
                continue
            for x in range(len(ns)):
                for y in range(x + 1, len(ns)):
                    a, b = items[ns[x]], items[ns[y]]
                    if a[0] == b[0] or (ns[x], ns[y]) in seen:
                        continue
                    seen.add((ns[x], ns[y]))
                    s = out_space.sim(a[1]["key"], b[1]["key"]) or 0
                    if s < MERGE or levels_differ(a[1]["title"], b[1]["title"]):
                        continue
                    d = desc_space.sim(("d", a[0], a[1]["i"]), ("d", b[0], b[1]["i"]))
                    t = title_jaccard(a[1]["title"], b[1]["title"])
                    d_ok, t_ok = (d or 0) >= DESC_LINK, (t or 0) >= TITLE_AGREE
                    one_voice = voice(a[1]["college"]) == voice(b[1]["college"])
                    # Two titles that each name something the other lacks (Real Estate Practice, Real Estate
                    # Principles) agree on overlap alone; a strong merge of them needs descriptions at DESC_STRONG.
                    distinct = titles_distinct(a[1]["title"], b[1]["title"])
                    level = "limited" if one_voice else \
                        "strong" if (d_ok and t_ok and (not distinct or (d or 0) >= DESC_STRONG)) else \
                        "partial" if (d_ok or t_ok) else "limited"
                    key = tuple(sorted((a[0], b[0])))
                    first = a if a[0] == key[0] else b
                    second = b if first is a else a
                    found[key].append({"level": level, "out": s, "desc": d, "title": t,
                                       "a": [first[1]["i"]], "b": [second[1]["i"]],
                                       "same_outline": bool(a[1]["source"] and a[1]["source"] == b[1]["source"]),
                                       "same_district": one_voice})
    out = {}
    for key, ps in found.items():
        best = min(ps, key=lambda p: (LEVELS.index(p["level"]), -p["out"]))
        out[key] = {"pair": list(key), "level": best["level"], "pairs": len(ps), "best": best}
    return out


def calibration(results, out_space, voice=None):
    """The method checked where the data is strong: the same title at two colleges of two districts inside one M-ID
    (should agree) against two courses of one Common SUBJ in different M-IDs with different titles (should not)."""
    voice = voice or voice_of({})
    same, diff = [], []
    by_subj = defaultdict(list)
    for res in results.values():
        rows = [r for r in res["rows"] if r["text"]]
        for x in range(len(rows)):
            for y in range(x + 1, len(rows)):
                a, b = rows[x], rows[y]
                if voice(a["college"]) != voice(b["college"]) and \
                        title_stems(a["title"]) == title_stems(b["title"]) and a["source"] != b["source"]:
                    same.append(out_space.sim(a["key"], b["key"]) or 0)
        for r in rows:
            by_subj[res["mid"].split(" ")[0]].append((res["mid"], r))
    for subj, items in sorted(by_subj.items()):
        for x in range(0, len(items) - 1, 3):
            a, b = items[x], items[x + 1]
            if a[0] != b[0] and (title_jaccard(a[1]["title"], b[1]["title"]) or 0) == 0:
                diff.append(out_space.sim(a[1]["key"], b[1]["key"]) or 0)

    def q(v, p):
        if not v:
            return None
        v = sorted(v)
        return round(v[min(len(v) - 1, int(p * len(v)))], 3)
    return {"same_title_two_colleges": {"pairs": len(same), "median": q(same, .5), "p10": q(same, .1),
                                        "share_at_or_above_link": round(sum(s >= LINK for s in same) / len(same), 3)
                                        if same else None},
            "different_mid_and_title": {"pairs": len(diff), "median": q(diff, .5), "p90": q(diff, .9),
                                        "p95": q(diff, .95),
                                        "share_at_or_above_link": round(sum(s >= LINK for s in diff) / len(diff), 3)
                                        if diff else None}}


LEADERSHIP = re.compile(r"\b(supervis\w*|leadership)\b", re.I)

# The four clean cases of the first report (2026-11-12), kept as examples of the candidate rules (COBIx,
# 6829696579 point 3); cited on that date, so they resolve through the alias chain like AGAB M1002.
EXAMPLES = ("MATH 130", "PH 101", "AGAS M1136", "AGAS M1140", "BSOT M1209")


def run(rows, members, index, reach, source_label, today, aligned=None, districts=None, subject_map=None):
    """aligned: load_aligned()'s map; districts: load_districts()'s map (each college its own voice when None);
    subject_map: load_subject_map()'s map for the structural check."""
    aligned = aligned or {}
    voice = voice_of(districts or {})
    courses, n_boiler = build_courses(rows)
    out_space = Space({k: c["stems"] for k, c in courses.items()
                       if len(c["stems"]) >= MIN_LEX and len(c["lines"]) >= MIN_LINES})

    # Which M-IDs hold any member with outcome text, and which hold two or more (the scope).
    key_mids = defaultdict(set)
    for mid, ms in members.items():
        for m in ms:
            k = course_key(m["college"], m["code"])
            if k in courses:
                key_mids[k].add(mid)
    with_any = {mid for mids in key_mids.values() for mid in mids}
    named = resolve_named(["AGAB M1002"])
    lead_mids = {mid for mid in members if LEADERSHIP.search((index.get(mid) or {}).get("title") or "")}
    look = with_any | set(named.values()) | lead_mids | (set(resolve_named(list(EXAMPLES)).values()) & set(members))

    desc_docs = {}
    for mid in look:
        for i, m in enumerate(members.get(mid) or []):
            d = DESC_NOISE.sub(" ", m.get("desc") or "")
            toks = stems_of(d)
            if len(toks) >= MIN_LEX:
                desc_docs[("d", mid, i)] = toks
    desc_space = Space(desc_docs)

    results = {mid: compare_mid(mid, members.get(mid) or [], courses, out_space, desc_space, voice)
               for mid in sorted(look)}
    in_scope = {mid for mid, r in results.items() if r["has_text"] >= 2}
    merges = merge_candidates({mid: results[mid]["rows"] for mid in with_any}, out_space, desc_space, voice)
    for key, mg in merges.items():
        for mid in key:
            results[mid].setdefault("merge_with", []).append(
                {"mid": key[1] if mid == key[0] else key[0], "level": mg["level"], "pairs": mg["pairs"],
                 "best_out": mg["best"]["out"], "best_desc": mg["best"]["desc"]})
    for mid, r in results.items():
        r["title"] = (index.get(mid) or {}).get("title") or ""
        r["reach"] = reach.get(mid, [])
        al = aligned.get(mid) or {}
        # Credit by exam counts as titled from the M-ID when its title is the M-ID's or a member's: every stem of it
        # in one of those titles, or a stem overlap at TITLE_AGREE. A credit-by-exam credential under another title
        # (a Plant Propagation exam joined to a Spanish course) reaches the M-ID but is not titled from it.
        names = [r["title"]] + [m.get("title") for m in members.get(mid) or []]
        titled, other = [], []
        for x in al.get("cbe") or []:
            st = title_stems(x[0])
            ok = bool(st) and any(n and (st <= title_stems(n) or (title_jaccard(x[0], n) or 0) >= TITLE_AGREE)
                                  for n in names)
            (titled if ok else other).append(x)
        r["cbe"], r["cbe_other"] = titled, other
        r["cert"], r["other_paths"] = al.get("cert") or [], al.get("other") or 0
        good =[m for m in r.get("merge_with", []) if m["level"] != "limited"]
        if r["cls"] == "Confirmed" and good:
            r["cls_primary"] = "Merge candidate"
        elif r["cls"] == "Not enough text" and good:
            r["cls_primary"] = "Merge candidate"
        else:
            r["cls_primary"] = r["cls"]
    return {"courses": courses, "results": results, "in_scope": in_scope, "with_any": with_any, "merges": merges,
            "named": named, "lead_mids": lead_mids, "boiler": n_boiler, "out_space": out_space,
            "desc_space": desc_space,
            "calibration": calibration({m: results[m] for m in in_scope}, out_space, voice),
            "structural": subject_outliers(members, subject_map or {}, index),
            "examples": resolve_named(list(EXAMPLES)),
            "source": source_label, "today": today}


# ── The report ─────────────────────────────────────────────────────────────────────────────────────────────────────

def inventory(rows, courses, members, results, in_scope, with_any):
    by_kind = Counter(r.get("kind") or "slo" for r in rows)
    colleges = {r.get("college") for r in rows}
    joined = len(courses)
    member_keys = {course_key(m["college"], m["code"]) for ms in members.values() for m in ms}
    matched = sum(1 for k in courses if k in member_keys)
    suites = sum(1 for m in in_scope if results[m]["same_college_suite"])
    obj_courses = sum(1 for c in courses.values() if "objective" in c["kinds"])
    return {"rows": dict(by_kind), "colleges": len(colleges), "courses": joined, "courses_in_an_mid": matched,
            "courses_with_objectives": obj_courses, "mids_with_any_text": len(with_any),
            "mids_two_or_more_with_text": len(in_scope), "same_college_suites": suites,
            "mids_total": len(members)}


def short(rows, i):
    r = rows[i]
    return "%s %s, %s" % (r["code"], nice_title(r["title"]), r["college"])


def quote(rows, i, n=2):
    r = rows[i]
    return ["%s (%s %s): \"%s\"" % (r["college"], r["code"], nice_title(r["title"]), x) for x in r["lines"][:n]]


def reach_of(results, kind, c):
    """A case's reach: the credit-by-exam credentials titled from its M-ID(s), and the earning colleges behind them.
    Certifications keep their official names and are not counted (COBIx on #3111, 6827702046)."""
    mids = [c["mid"]] if kind == "split" else list(c["pair"])
    cbe = [x for m in mids for x in results[m]["cbe"]]
    return len(cbe), sum(x[2] for x in cbe)


def pick_cases(results, in_scope, merges, n=6, skip=()):
    """The cases for Sam (COBIx, 6829696579 point 2; Sam's rule of 2026-11-12, order by student blast radius): from
    the strong and partial splits and merges, by credit-by-exam reach first, then by strength, then by breadth. One
    case per Common SUBJ, one Honors pair at most (a second asks the same question twice), and the named examples
    are shown in their own section."""
    cands = []
    for m in in_scope:
        r = results[m]
        if r["cls"] == "Split" and r["level"] in ("strong", "partial") and m not in skip:
            cands.append(("split", r, r["level"], r["colleges"]))
    for mg in merges.values():
        if mg["level"] in ("strong", "partial") and not (set(mg["pair"]) & set(skip)):
            cands.append(("merge", mg, mg["level"], sum(results[x]["colleges"] for x in mg["pair"])))
    cands.sort(key=lambda t: (-reach_of(results, t[0], t[1])[0], -reach_of(results, t[0], t[1])[1],
                              LEVELS.index(t[2]), -t[3], t[1].get("mid") or " ".join(t[1].get("pair") or [])))
    out, subj, honors_taken = [], set(), False
    for kind, c, _lv, _w in cands:
        if reach_of(results, kind, c)[0] == 0:
            break
        mids = [c["mid"]] if kind == "split" else c["pair"]
        s = mids[0].split(" ")[0]
        if s in subj:
            continue
        honors = any("honors" in (results[x]["title"] or "").lower() for x in mids)
        if honors and honors_taken:
            continue
        honors_taken = honors_taken or honors
        out.append((kind, c))
        subj.add(s)
        if len(out) >= n:
            break
    return out


def cbe_txt(results, mids):
    parts = []
    for m in mids:
        r = results[m]
        cbe, cert = r["cbe"], r["cert"]
        s = "%s: %d credit-by-exam credential%s titled from it (%d earning college%s)%s; %d certification%s, not "\
            "counted, since a certification keeps its official name" % (
                m, len(cbe), "" if len(cbe) == 1 else "s", sum(x[2] for x in cbe),
                "" if sum(x[2] for x in cbe) == 1 else "s",
                (", " + "; ".join("*%s*" % x[0] for x in cbe[:3])) if cbe else "",
                len(cert), "" if len(cert) == 1 else "s")
        if r.get("cbe_other"):
            s += "; %d more credit-by-exam credential%s reach%s it under another title, not counted (%s)" % (
                len(r["cbe_other"]), "" if len(r["cbe_other"]) == 1 else "s",
                "es" if len(r["cbe_other"]) == 1 else "", "; ".join("*%s*" % x[0] for x in r["cbe_other"][:3]))
        if r["reach"]:
            s += "; in the Review queue, %s" % reach_txt(r["reach"])
        parts.append(s)
    return ". ".join(parts)


def render(state, members_at):
    R, scope = state["results"], state["in_scope"]
    inv = inventory(state["rows"], state["courses"], state["members"], R, scope, state["with_any"])
    counts = Counter((R[m]["cls_primary"], R[m]["level"] if R[m]["cls_primary"] == R[m]["cls"] else
                      max((x["level"] for x in R[m].get("merge_with", []) if x["level"] != "limited"),
                          key=LEVELS.index, default=None)) for m in scope)
    cal = state["calibration"]
    L = []
    w = L.append
    w("# MID re-clustering, Step 1: outcomes and objectives against the M-IDs (%s)" % state["today"])
    w("")
    w("Issue #2962, COBIx's operational brief of 2026-11-12, Sam's go relayed by COBIx (\"yes, let's roll!\", "
      "cpl_memory sam-mid-reclustering-step-1-go-2026-11-12). A no-write comparison: nothing here changes an M-ID, a "
      "table or a generated file. Built by `kb/_mid_outcomes_compare.py`; every M-ID's result is in the JSON beside "
      "this file.")
    w("")
    w("Source of the outcomes text: %s. Membership: `unified_courses_members.js` (generated %s), descriptions "
      "`unified_courses_member_desc.js`, titles `unified_courses_index.js`, exhibit reach `unified_courses_aligned.js` "
      "and `kb/exhibits_review.json`, districts `%s`, subjects `kb/reference/subject_discipline_map.json`."
      % (state["source"], members_at, state.get("crosswalk") or "kb/college_identity/"))
    w("")
    w("This report replaces the first run of this date (#3165, `41eeb44a`). COBIx read it and gave four findings "
      "(#2962, comment 6829696579), taken as given: the district guard now covers splits and merges, every case "
      "carries its exhibit reach, the cases for Sam are chosen by that reach, and a structural check reads subject "
      "codes. The first run's six cases stay below as examples, re-rated.")
    w("")
    w("## Inventory")
    w("")
    w("Course outcomes live in one table, `course_outcomes` on Supabase, and every row in it is loaded from a read "
      "committed under `kb/course_outcomes/<host>/` (the load receipts in `kb/receipts/course_outcomes_*.json` add "
      "up to the same rows, an older Orange Coast read aside). No program learning outcomes (PLOs) have been "
      "harvested: the table holds two kinds, `slo` and `objective`. Descriptions come from COCI through "
      "`unified_courses_member_desc.js` for every M-ID member.")
    w("")
    w("| Source | Rows | Courses | Colleges |")
    w("|---|---|---|---|")
    obj = inv["rows"].get("objective", 0)
    w("| SLOs | %d | %d | %d |" % (inv["rows"].get("slo", 0),
                                   sum(1 for c in state["courses"].values() if "slo" in c["kinds"]), inv["colleges"]))
    w("| Course objectives | %d | %d | %d |" % (obj, inv["courses_with_objectives"],
                                               len({r["college"] for r in state["rows"] if r.get("kind") == "objective"})))
    w("| PLOs | 0 | 0 | 0 |")
    w("| Descriptions (COCI) | one per member | %d members in the M-IDs read here | statewide |"
      % sum(len(state["members"].get(m) or []) for m in R))
    w("")
    w("Of %d courses with outcomes text, %d match a member of an M-ID (college and code). %d M-IDs hold at least one "
      "member with text; %d hold two or more (the scope of this pass), and %d of those are same-college suites, two "
      "or more members from one college. That is %.1f%% of the %d M-IDs."
      % (inv["courses"], inv["courses_in_an_mid"], inv["mids_with_any_text"], inv["mids_two_or_more_with_text"],
         inv["same_college_suites"], 100.0 * inv["mids_two_or_more_with_text"] / max(1, inv["mids_total"]),
         inv["mids_total"]))
    w("")
    w("## Method")
    w("")
    w("Each course's outcome and objective statements become word stems, with the lead-ins and generic verbs removed "
      "and each stem weighted by how rare it is across all harvested courses; two courses agree when the cosine of "
      "their weighted stems reaches %.2f. Inside an M-ID the agreeing courses form groups, and more than one group is "
      "a proposed split only when the descriptions or the titles also disagree." % LINK)
    w("")
    w("Thresholds: agree at %.2f; strong confirmation at a mean of %.2f with a second signal; merge candidate at "
      "%.2f across two M-IDs of one Common SUBJ; descriptions agree at %.2f; titles agree at a stem overlap of %.2f, "
      "and a strong merge of two titles that each name something the other lacks needs descriptions at %.2f. "
      "A course with fewer than %d stems after stripping is thin and treated as having no text; %d statements printed "
      "word for word by %d or more courses were dropped as outline boilerplate."
      % (LINK, STRONG, MERGE, DESC_LINK, TITLE_AGREE, DESC_STRONG, MIN_LEX, state["boiler"], BOILER_COURSES))
    w("")
    a, b = cal["same_title_two_colleges"], cal["different_mid_and_title"]
    w("Where the data is strong, the method agrees with the M-IDs: %d pairs of same-titled courses at two colleges "
      "inside one M-ID score a median of %s, and %s of them reach the agree line. %d sampled pairs of differently "
      "titled courses in different M-IDs of one Common SUBJ score a median of %s, and %s of them reach it (95th "
      "percentile %s)." % (a["pairs"], a["median"], pct(a["share_at_or_above_link"]), b["pairs"], b["median"],
                          pct(b["share_at_or_above_link"]), b["p95"]))
    w("")
    w("Confidence uses Sam's three match levels (Open Asks Sheet 181, 2026-11-11): strong, partial and limited. A "
      "split the outcomes alone propose is limited, a flag for a person, since an SLO never overrides on its own. A "
      "member with no text joins no group and is never the reason for a split. TOP and units are shown and read by "
      "nothing.")
    w("")
    w("Blind spots. Word overlap misses a paraphrase: two colleges can teach the same course in different words and "
      "read as a weak pair, which is why a split needs a second signal. Shared vocabulary can join different levels of "
      "one subject (Spanish 1 and Spanish 2 use the same words), so a confirmation does not prove a level is right. "
      "Thin outlines (one or two statements) are set aside, not judged. Objectives exist for four colleges only, so most "
      "courses are read on SLOs alone.")
    w("")
    w("One district is one voice. District outlines printed once for several colleges (RCCD, SDCCD, LACCD) agree by "
      "construction, so a pair of colleges inside one district counts as one voice everywhere: it never makes a "
      "confirmation strong or partial, a merge pair inside one district is limited, and a split is strong only when a "
      "group holds outlines from two or more districts. The district is the committed college identity crosswalk's "
      "(`kb/_college_identity_latest.py`); a college it does not name is its own voice. The calibration above counts "
      "only same-titled pairs from two districts.")
    w("")
    w("## Counts by class and confidence (the %d M-IDs in scope)" % len(scope))
    w("")
    w("| Class | Strong | Partial | Limited | All | First run (no district guard) |")
    w("|---|---|---|---|---|---|")
    for cls in CLASSES:
        row = [counts.get((cls, lv), 0) for lv in LEVELS]
        tot = sum(v for (c, _), v in counts.items() if c == cls)
        f = FIRST_RUN[cls]
        w("| %s | %d | %d | %d | %d | %s |" % (cls, row[0], row[1], row[2], tot,
                                              "%d (%d strong)" % f if f[1] is not None else "%d" % f[0]))
    w("")
    w("What moved, and why: the district guard. A confirmation or a merge that rested on one district's shared outline "
      "is one voice now, so strong confirmations and merge candidates fall the most; an M-ID that had been a merge "
      "candidate only through such a pair returns to its own class. The guard changes a split's level, never whether "
      "its groups disagree, so the split count is unchanged; its strong splits fall where every group sat inside one "
      "district. A second correction moves the merges too: the first run read a title's level word alone, so "
      "*Elementary Spanish II* and *Spanish: Beginning I* read as one level and could pair; the level reader now reads "
      "the word and the numeral, and a lecture never pairs with its laboratory.")
    w("")
    w("A Merge candidate here is an M-ID whose outcomes otherwise confirm it and whose courses also agree, at partial "
      "or strong, with a course in another M-ID of the same Common SUBJ. A Not enough text M-ID in scope holds two "
      "members with outcomes text, one or both too thin to judge.")
    sing = [m for m in state["with_any"] if R[m]["members"] == 1]
    sing_m = [m for m in sing if any(x["level"] != "limited" for x in R[m].get("merge_with", []))]
    w("")
    w("Outliers. %d single-member M-IDs carry outcomes text; the outcomes place %d of them beside a course in another "
      "M-ID of the same Common SUBJ at partial or strong, and leave %d alone." % (len(sing), len(sing_m),
                                                                                len(sing) - len(sing_m)))
    w("")
    # AGAB M1002
    agab = state["named"]["AGAB M1002"]
    r = R.get(agab)
    w("## AGAB M1002, Agricultural Ambassadors")
    w("")
    if r:
        w("AGAB M1002 %s through `kb/alias_chain.py` (the maps applied after its era, 2026-11-08's anchor re-key "
          "the last). Its title in the index is *%s*. Its %d members, from %s: %s. Units %s, TOP %s." % (
              "resolves to itself" if agab == "AGAB M1002" else "resolves to " + agab, r["title"], r["members"],
              ", ".join(sorted({x["college"] for x in r["rows"]})),
              "; ".join(short(r["rows"], i) for i in range(len(r["rows"]))),
              units_txt(r["units"]), ", ".join(r["tops"]) or "none"))
        w("")
        w("Class: %s. %s." % (r["cls"], r["why"]))
        if r["cls"] == "Not enough text":
            dpairs = [(i, j, desc_pair(state, agab, i, j)) for i in range(r["members"]) for j in range(i + 1, r["members"])]
            dtxt = "; ".join("%s and %s %s" % (r["rows"][i]["code"], r["rows"][j]["code"],
                                             "%.2f" % d if d is not None else "n/a") for i, j, d in dpairs)
            w("")
            w("Merced's course outlines have not been harvested, so no outcome or objective is on file for any of the "
              "three. Read on descriptions alone, at limited confidence (the lower rung COBIx's brief allows), the "
              "description cosines are %s against the %.2f agree line. The titles share the stem *Agricultural "
              "Ambassadors* and each names a different specialization. What the harvest needs: Merced's outline "
              "platform read for these three courses (one college, three outlines), the SLOs and objectives filed under "
              "`kb/course_outcomes/merced/`, then this script rerun." % (dtxt, DESC_LINK))
            for i in range(r["members"]):
                d = (r["rows"][i].get("desc") or "").strip()
                if d:
                    w("")
                    w("> %s (%s): \"%s\"" % (r["rows"][i]["code"], r["rows"][i]["college"], d[:300]))
    else:
        w("AGAB M1002 is not in the members file.")
    w("")
    def case(head, kind, c):
        if kind == "split":
            w("### %s %s, %s: proposed split (%s)" % (head, c["mid"], c["title"], c["level"]))
            w("")
            w("%d members, %d colleges, units %s. %s." % (c["members"], c["colleges"], units_txt(c["units"]), c["why"]))
            for gi, g in enumerate(c["groups"]):
                w("")
                w("Group %s, proposed title *%s* (%s; %d district%s):" % (
                    "ABCDEFGH"[gi], g["title"], ", ".join(g["colleges"]), g["districts"],
                    "" if g["districts"] == 1 else "s"))
                for i in g["members"][:3]:
                    for line in quote(c["rows"], i):
                        w("- %s" % line)
            if c.get("unplaced"):
                w("")
                w("No text, left where they are: %s%s." % ("; ".join(short(c["rows"], i) for i in c["unplaced"][:6]),
                                                          " and %d more" % (len(c["unplaced"]) - 6)
                                                          if len(c["unplaced"]) > 6 else ""))
            g0, g1 = c["groups"][0], c["groups"][1]
            cr = c["cross"][0]
            w("")
            w("Student test: someone who completed *%s* would not be repeating *%s*; their outcomes score at most %.3f "
              "against each other, below the %.2f agree line, and their descriptions %s." % (
                  g0["title"], g1["title"], cr["max_out"], LINK,
                  "score at most %.2f" % cr["max_desc"] if cr["max_desc"] is not None else "are not on file"))
            w("")
            w("Exhibit reach: %s." % cbe_txt(R, [c["mid"]]))
        else:
            ma, mb = c["pair"]
            ra, rb = R[ma], R[mb]
            bi, bj = c["best"]["a"][0], c["best"]["b"][0]
            w("### %s %s and %s: proposed merge (%s)" % (head, ma, mb, c["level"]))
            w("")
            w("%s, *%s* (%d members) and %s, *%s* (%d members), one Common SUBJ. The closest pair across two districts: "
              "%s and %s, outcomes %.2f, descriptions %s, titles %s; %d course pairs reach the merge line." % (
                  ma, ra["title"], ra["members"], mb, rb["title"], rb["members"], short(ra["rows"], bi),
                  short(rb["rows"], bj), c["best"]["out"], fmt(c["best"]["desc"]), fmt(c["best"]["title"]), c["pairs"]))
            w("")
            for line in quote(ra["rows"], bi, 3) + quote(rb["rows"], bj, 3):
                w("- %s" % line)
            w("")
            if titles_distinct(ra["rows"][bi]["title"], rb["rows"][bj]["title"]):
                w("Student test: the two outlines name the same outcomes in close to the same words, so someone who "
                  "completed %s may be repeating much of %s. The two titles each name something the other lacks "
                  "(*%s*, *%s*), so before a merge a person checks whether a student takes both, as two required "
                  "courses or two steps of one sequence; word overlap cannot tell." % (
                      short(ra["rows"], bi), short(rb["rows"], bj), nice_title(ra["rows"][bi]["title"]),
                      nice_title(rb["rows"][bj]["title"])))
            else:
                w("Student test: someone who completed %s would be repeating much of %s; the two outlines name the "
                  "same outcomes in close to the same words." % (short(ra["rows"], bi), short(rb["rows"], bj)))
            w("")
            w("Exhibit reach: %s." % cbe_txt(R, [ma, mb]))
        w("")

    ex = state.get("examples") or {}
    ex_ids = {v for v in ex.values() if v in R}
    picked = pick_cases(R, scope, state["merges"], skip=ex_ids)
    in_s = [m for m in scope]
    w("## Cases for Sam, by exhibit reach")
    w("")
    w("Sam's rule of 2026-11-12, relayed by COBIx (6829696579 point 2): order a batch by student blast radius, how "
      "many students or members of the public a correct call would help. The cases below come from the strong and "
      "partial splits and merges, ordered by exhibit reach first and strength second. Reach is the credit-by-exam "
      "credentials whose title comes from the M-ID, since a split or a rename retitles them; certifications keep "
      "their official names (Sam, 2026-11-12) and are shown, never counted (the two columns agreed on #3111, "
      "6827702046). Of the %d M-IDs in scope, %d carry credit-by-exam reach and %d carry certifications; %d strong or "
      "partial splits and %d strong or partial merge pairs reach any credit-by-exam credential."
      % (len(in_s), sum(1 for m in in_s if R[m]["cbe"]), sum(1 for m in in_s if R[m]["cert"]),
         sum(1 for m in in_s if R[m]["cls"] == "Split" and R[m]["level"] in ("strong", "partial") and R[m]["cbe"]),
         sum(1 for mg in state["merges"].values() if mg["level"] in ("strong", "partial")
             and (R[mg["pair"][0]]["cbe"] or R[mg["pair"][1]]["cbe"]))))
    w("")
    w("Potential-CPL blast radius. The repo holds no committed per-M-ID measure of the students or members of the "
      "public a call would reach: `prototype/ccr_cpl.json` and `unified_courses_aligned.js` count credentials and "
      "colleges, structural counts only, and students per title (`exhibit_title_students`) are a reviewer-only read "
      "in Supabase. So this report shows no such column and orders by credit-by-exam reach, the nearest committed "
      "measure; the earning colleges behind each credential are shown beside it.")
    w("")
    w("| # | Case | Level | Credit-by-exam credentials | Earning colleges | Certifications (not counted) |")
    w("|---|---|---|---|---|---|")
    for n, (kind, c) in enumerate(picked, 1):
        mids = [c["mid"]] if kind == "split" else list(c["pair"])
        k, cols = reach_of(R, kind, c)
        w("| %d | %s %s | %s | %d | %d | %d |" % (n, " and ".join(mids), "split" if kind == "split" else "merge",
                                                 c["level"], k, cols, sum(len(R[m]["cert"]) for m in mids)))
    w("")
    for n, (kind, c) in enumerate(picked, 1):
        case("%d." % n, kind, c)

    # The re-rated cases COBIx named, and the four clean examples of the candidate rules.
    w("## Two cases re-rated by the district guard")
    w("")
    it = R.get("ITIS 140")
    if it:
        w("ITIS 140, *%s*: the first run called it a strong split. Group A was Norco College CIS 2 and Riverside City "
          "College CIS 2, word for word one RCCD outline, set against Riverside City's own CSC 20, so every member with "
          "text sits in one district. Its class now: %s, %s. %s." % (it["title"], it["cls"], it["level"] or "no level",
                                                                     (it.get("why") or "").capitalize()))
        w("")
    mg = state["merges"].get(("BIOL M1094", "BIOL M1095"))
    if mg:
        w("BIOL M1094 and BIOL M1095, *General Biology* and *General Biology Honors*: the first run's 1.00 was Moreno "
          "Valley BIO 1 against Norco BIO 1H, one RCCD text. All %d course pairs that reach the merge line sit inside "
          "one district, so the merge is %s now. What the pair shows is that RCCD writes its Honors course with its "
          "base course's outcomes; it does not show that the M-IDs should merge statewide." % (mg["pairs"], mg["level"]))
        w("")
    w("## The candidate rules and their four examples")
    w("")
    w("The first run's four clean cases stay as examples of two candidate rules, re-rated under the district guard. "
      "They hold.")
    w("")
    w("Rule 1, a course from another subject inside an M-ID splits out. MATH 130 holds Cabrillo CHEM 5 and PH 101 "
      "holds Modesto GEOG 106. The rule is structural and the outcomes only confirm it, so it runs below as its own "
      "check on subject codes, with no outcome text needed.")
    w("")
    w("Rule 2, an Honors section merges with its base course: a policy call for Sam. For a student it fits, since the "
      "outcomes match and nothing is repeated. C-ID and some articulation keep Honors separate, so the question for "
      "Sam is which he means: one M-ID for the base course and its Honors section, or two M-IDs with a declared "
      "equivalence between them. AGAS M1136 and M1140 is the merge example (Shasta and Cuesta, two districts); BIOL "
      "M1094 and M1095 is the Honors pair, limited until a second district's outlines say the same.")
    w("")
    for mid in EXAMPLES:
        if mid == "AGAS M1140":
            continue
        rid = ex.get(mid, mid)
        r = R.get(rid)
        if not r:
            w("%s is not in the members file." % mid)
            w("")
            continue
        if mid == "AGAS M1136":
            pair = state["merges"].get(tuple(sorted((rid, ex.get("AGAS M1140", "AGAS M1140")))))
            if pair:
                case("Example:", "merge", pair)
            continue
        if r["cls"] == "Split":
            case("Example:", "split", r)
        else:
            w("### Example: %s, %s: %s (%s)" % (rid, r["title"], r["cls"].lower(), r["level"] or "no level"))
            w("")
            w("%s." % (r.get("why") or ""))
            w("")
        if mid == "BSOT M1209":
            w("The likely call is a rename plus a split, not a split alone. The M-ID's index title is *%s*, but most of "
              "its members, and the members with text, are *Records Management*. Rename the M-ID to the title its "
              "members carry, and split Shasta BSOT 150 *Electronic Medical Records* out." % r["title"])
            w("")

    # The structural check
    st = state.get("structural") or {}
    n_odd = sum(len(v["outliers"]) for v in st.values())
    st_scope = [m for m in st if m in scope]
    w("## Structural check: a member from another subject")
    w("")
    w("A member whose subject code names a different discipline from the rest of its M-ID, read from subject codes "
      "alone, with no outcome text (COBIx, 6829696579 point 3). A subject reads as a discipline only through "
      "`kb/reference/subject_discipline_map.json`, which leaves ambiguous codes null; TOP is never read (CLAUDE.md "
      "Rule 7). A member is flagged when at least three members map, one discipline holds more than half of them, the "
      "member's own discipline holds a quarter or less, and its title does not agree with the M-ID's title (an "
      "*Introduction to Public Health* filed under ALH is a prefix, not another course). The map is a staging draft "
      "and a cross-listed course (an ETHN literature course beside ENGL) is the discipline cross-listing lane's case, "
      "so each flag is a candidate for a person.")
    w("")
    w("%d M-IDs hold %d flagged members. %d of those M-IDs are in this report's outcomes scope, where the outcomes "
      "class them: %s." % (len(st), n_odd, len(st_scope), ", ".join(
          " ".join(x for x in (cls, lv, str(n)) if x) for (cls, lv), n in sorted(
              Counter((R[m]["cls"], R[m]["level"]) for m in st_scope).items(),
              key=lambda kv: (CLASSES.index(kv[0][0]), LEVELS.index(kv[0][1]) if kv[0][1] else 9)))))
    w("")
    w("| M-ID | Title | Members | Discipline of the rest | Flagged members |")
    w("|---|---|---|---|---|")
    top = sorted(st, key=lambda m: (-len(st[m]["outliers"]), -st[m]["members"], m))
    for m in [x for x in ("MATH 130", "PH 101") if x in st] + [x for x in top if x not in ("MATH 130", "PH 101")][:23]:
        v = st[m]
        w("| %s | %s | %d | %s | %s |" % (m, (R.get(m) or {}).get("title") or state["index"].get(m, {}).get("title", ""),
                                          v["members"], v["discipline"],
                                          "; ".join("%s %s, %s (%s)" % (o[1], o[2], o[0], o[3]) for o in v["outliers"][:4])
                                          + (" and %d more" % (len(v["outliers"]) - 4) if len(v["outliers"]) > 4 else "")))
    w("")
    w("Every flagged M-ID and member is in the JSON beside this file (`structural`).")
    w("")
    # Leadership
    w("## Impact track, first batch: Leadership and supervision")
    w("")
    lead = sorted(state["lead_mids"], key=lambda m: (-R[m]["members"], m))
    lw = [m for m in lead if R[m]["with_text"] >= 1]
    w("Sam, relayed by COBIx, 2026-11-12: \"the 3 hours leadership is a gold mine on the surface waiting for its "
      "day.\" %d M-IDs carry Leadership or Supervision in their title; %d of them hold a member with outcomes text "
      "and %d hold two or more. The military side, the JST 3-hour Leadership recommendation, is in no committed file "
      "this script reads: MAP's ACE recommendation rows live in Supabase (`map_college_cr_unit`, `source_code` ACE, "
      "per `docs/military_cr_reference_scope.md`), which the anon key is not known to read. This section stays on the "
      "committed data in every run, live or not, and nothing is widened for it; which of these M-IDs those "
      "recommendations land on is a read for a later pass."
      % (len(lead), len(lw), sum(1 for m in lead if m in scope)))
    w("")
    w("| M-ID | Title | Members | Colleges | With text | Class | Colleges without outlines on file |")
    w("|---|---|---|---|---|---|---|")
    for m in lead[:25]:
        r = R[m]
        missing = Counter(x["college"] for x in r["rows"] if not x["has_text"])
        w("| %s | %s | %d | %d | %d | %s%s | %s |" % (
            m, r["title"], r["members"], r["colleges"], r["with_text"], r["cls_primary"],
            " (" + r["level"] + ")" if r.get("level") and r["cls_primary"] == r["cls"] else "",
            ", ".join(c for c, _ in missing.most_common(4)) + (" and %d more" % (len(missing) - 4) if len(missing) > 4
                                                                else "")))
    w("")
    gap = Counter(x["college"] for m in lead for x in R[m]["rows"] if not x["has_text"])
    w("What a good call needs: outlines from the colleges that hold most of these courses and have none on file, "
      "first %s. Each is one college's outline read from the separate $40 SLO, PLO and objective pot, which is not "
      "this worker's to run. De Anza's SLO trial (#3145) is already in flight, so its courses may arrive without a "
      "new read; Merced (for AGAB M1002) and Canyons are the next two (COBIx, 6829696579 point 4). With the outlines "
      "in, the supervision courses can be compared with each other and, once the ACE rows are read, beside the JST "
      "recommendation's own description. MAP's ACE rows are public recommendations, not student data, so a one-time, "
      "read-only committed export of the Leadership and Supervision rows would let the next pass set them beside "
      "these M-IDs without widening the anon key; if that needs a key the runner lacks, it is a one-line ask for Sam."
      % ", ".join("%s (%d courses)" % kv for kv in gap.most_common(6)))
    w("")
    w("## Partial or whole")
    w("")
    w("This report reads %s. The committed reads hold every row the load receipts record, so this pass covers the "
      "outcomes the table held at the last load (18 colleges). A dispatch of `mid-outcomes-compare.yml` reads the "
      "table itself and rewrites this report, which matters once a load lands that was not filed here first."
      % state["source"])
    w("")
    return "\n".join(L) + "\n", inv, counts


def pct(x):
    return "n/a" if x is None else "%d%%" % round(100 * x)


def fmt(x):
    return "n/a" if x is None else "%.2f" % x


def units_txt(u):
    if not u:
        return "not stated"
    return ("%g" % u[0]) if u[0] == u[1] else "%g to %g" % (u[0], u[1])


def reach_txt(items):
    if not items:
        return "no Exhibit Reference title takes its canonical title from this M-ID"
    return "%d Exhibit Reference title%s take%s the canonical title from it (%s)" % (
        len(items), "" if len(items) == 1 else "s", "s" if len(items) == 1 else "",
        "; ".join("%s, proposed *%s*" % (x["raw"], x["title"]) for x in items[:4]))


def desc_pair(state, mid, i, j):
    return state["desc_space"].sim(("d", mid, i), ("d", mid, j)) if state.get("desc_space") else None


def to_json(state, inv, counts):
    """Every M-ID read, one record each. members_with_text rows are [college, code, title, units, TOP, enough text,
    statements]; a member with no text is counted, not listed (the file would be 20 MB). Groups and merges name their
    courses as [college, code]."""
    R = state["results"]
    out = {}
    for mid in sorted(R):
        r = R[mid]
        rec = {k: r.get(k) for k in ("title", "cls", "cls_primary", "level", "why", "members", "colleges", "has_text",
                                      "with_text", "thin", "units", "tops", "same_college_suite", "mean_out")
               if r.get(k) not in (None, [], "")}
        rec["in_scope"] = mid in state["in_scope"]
        if not rec["in_scope"] and r["cls"] == "Not enough text":
            rec.pop("why", None)   # the one reason every such record shares; the _about says it
        rows = r["rows"]

        def ref(i):
            return [rows[i]["college"], rows[i]["code"]]
        rec["members_with_text"] = [[x["college"], x["code"], x["title"], x["units"], x["top"], int(x["text"]),
                                     len(x["lines"])] for x in rows if x["has_text"]]
        if r.get("groups"):
            rec["groups"] = [dict(g, members=[ref(i) for i in g["members"]]) for g in r["groups"]]
        if r.get("unplaced"):
            rec["unplaced"] = len(r["unplaced"])
        if r.get("cross"):
            rec["cross"] = r["cross"][:20]
        for k in ("merge_with", "same_college_split"):
            if r.get(k):
                rec[k] = r[k]
        if r["reach"]:
            rec["exhibit_reach"] = r["reach"]
        if r.get("cbe"):
            rec["cbe_titled_from_mid"] = r["cbe"]
        if r.get("cbe_other"):
            rec["cbe_other_title"] = r["cbe_other"]
        if r.get("cert"):
            rec["cert_exhibits"] = r["cert"]
        if r.get("cross_district_group") is not None and r["cls"] == "Split":
            rec["cross_district_group"] = r["cross_district_group"]
        if r.get("districts_with_text"):
            rec["districts_with_text"] = r["districts_with_text"]
        out[mid] = rec
    merges = []
    for _, m in sorted(state["merges"].items()):
        if m["level"] == "limited":
            continue
        ra, rb = R[m["pair"][0]]["rows"], R[m["pair"][1]]["rows"]
        best = dict(m["best"], a=[ra[m["best"]["a"][0]]["college"], ra[m["best"]["a"][0]]["code"]],
                    b=[rb[m["best"]["b"][0]]["college"], rb[m["best"]["b"][0]]["code"]])
        merges.append(dict(m, best=best))
    return {"_about": ("MID re-clustering Step 1 (#2962): every M-ID that holds a member with outcomes text, plus "
                       "AGAB M1002 and the Leadership and supervision M-IDs, compared on outcomes and objectives first, "
                       "descriptions second, titles as corroboration, TOP and units never. Written by "
                       "kb/_mid_outcomes_compare.py; no-write. members_with_text rows are [college, code, title, units, "
                       "TOP, enough text, statements]; groups and merges name courses as [college, code]. An M-ID outside "
                       "the scope with no why is Not enough text: fewer than two members print enough outcome text, "
                       "and a missing SLO counts against no one. cross lists at most 20 group pairs. One district is one "
                       "voice (COBIx, 6829696579). cbe_titled_from_mid and cert_exhibits are [credential, issuer, "
                       "earning colleges] from unified_courses_aligned.js; aligned_keys_not_in_members are that file's "
                       "keys naming no live M-ID. structural lists members whose subject names another discipline."),
            "date": state["today"], "source": state["source"],
            "thresholds": {"link": LINK, "strong": STRONG, "merge": MERGE, "desc_link": DESC_LINK,
                           "desc_strong_distinct_titles": DESC_STRONG,
                           "title_agree": TITLE_AGREE, "min_stems": MIN_LEX, "min_statements": MIN_LINES,
                           "boilerplate_codes": BOILER_COURSES, "max_df_share": MAX_DF_SHARE},
            "levels": list(LEVELS), "inventory": inv, "calibration": state["calibration"],
            "counts": {"%s|%s" % k: v for k, v in sorted(counts.items(), key=lambda kv: (str(kv[0][0]), str(kv[0][1])))},
            "named": state["named"], "examples": state.get("examples") or {}, "merges": merges,
            "first_run": {k: {"all": v[0], "strong": v[1]} for k, v in FIRST_RUN.items()},
            "districts_from": state.get("crosswalk"),
            "aligned_keys_attached": state.get("aligned_hit"),
            "aligned_keys_not_in_members": state.get("aligned_homeless") or [],
            "structural": state.get("structural") or {},
            "mids": out}


def dump(doc, f):
    """One M-ID per line, so a rerun's diff reads by M-ID."""
    mids = doc.pop("mids")
    head = json.dumps(doc, ensure_ascii=False, indent=1)
    f.write(head[:-2] + ',\n "mids": {\n')
    f.write(",\n".join("  %s: %s" % (json.dumps(k), json.dumps(v, ensure_ascii=False, separators=(",", ":")))
                        for k, v in mids.items()))
    f.write("\n }\n}\n")


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", choices=("files", "live"), default="files")
    ap.add_argument("--date", default=dt.date.today().isoformat())
    ap.add_argument("--stdout", action="store_true", help="print the summary; write nothing")
    a = ap.parse_args(argv)
    if a.source == "live":
        rows = outcome_rows_live()
        label = ("the live `course_outcomes` table (source: live; PostgREST with the anon key, read-only, %d rows "
                 "after the newest read per course, the exact count matched)" % len(rows))
    else:
        rows, hosts = outcome_rows_from_files()
        label = "the committed reads under `kb/course_outcomes/` (source: files; %d hosts, %d rows)" % (
            len(hosts), len(rows))
    if not rows:
        raise SystemExit("No outcome rows were read: nothing to compare, and no report is written.")
    members, members_at = load_members()
    aligned, homeless = load_aligned(live=set(members))
    districts, crosswalk = load_districts()
    index = load_index()
    state = run(rows, members, index, load_reach(), label, a.date, aligned=aligned, districts=districts,
                subject_map=load_subject_map())
    state["index"] = index
    state["rows"], state["members"] = rows, members
    state["aligned_homeless"], state["crosswalk"] = homeless, crosswalk
    state["aligned_hit"] = len(aligned)
    md, inv, counts = render(state, members_at)
    if a.stdout:
        print(md)
        return 0
    os.makedirs(OUT_DIR, exist_ok=True)
    base = os.path.join(OUT_DIR, "mid_outcomes_compare_%s" % a.date)
    with open(base + ".md", "w", encoding="utf-8") as f:
        f.write(md)
    with open(base + ".json", "w", encoding="utf-8") as f:
        dump(to_json(state, inv, counts), f)
    print("wrote %s.md and .json: %d M-IDs read, %d in scope" % (os.path.relpath(base, ROOT), len(state["results"]),
                                                                  len(state["in_scope"])))
    return 0


if __name__ == "__main__":
    sys.exit(main())
