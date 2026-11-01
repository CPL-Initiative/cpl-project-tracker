#!/usr/bin/env python3
"""The Exhibits List's Outcomes match hints: credentials whose articulated courses teach alike, by their course SLOs.

Sam, 2026-11-01, in chat: "yes to SLO hints and the nightly harvest" (cpl_memory sam-slo-hints-and-nightly-harvest-
2026-11-01), after the one-time test (slo-grouping-test-2026-11-01; CPLBrain 20261101_SLO_Grouping_Test.md) found that
course SLOs pair exhibits the word-based AI sort splits. The List shows each pair under a title as
"Outcomes match: <other title> (<its group>)", and a reviewer acts on it with Move. SLO similarity is a second signal,
never a decider (the TOP precedent, CLAUDE.md Rule 7): this file proposes nothing and moves nothing.

The method, the one the test proved in Postgres, so a reader can check a score:
  1. Each credential's articulated courses come from kb/exhibits_adoption.json (a = college -> [units, [[course, CR]]]).
     A course is keyed (college, code upper-cased with letters and digits only). GE-area and unit pseudo-codes are
     dropped (Cal-GETC, Local GE, RCCD GE, GE 3B-style areas, CSU UNITS, CPL UNITS): they name no course.
  2. Each key joins public.course_outcomes (college name, the same code key; the newest read_run per course). A
     credential's document is the distinct SLO texts of its courses: a text two courses print word for word counts once.
  3. The words become English lexemes the way Postgres's to_tsvector('english') makes them (its stop words, the
     Snowball English stemmer, hyphenated words kept whole and in parts); lexemes under three characters or with no
     letter drop. Each weighs sublinear TF times IDF across the reached credentials, and a lexeme found in more than
     15% of them drops.
  4. Every pair's cosine. A pair at THRESHOLD or more is a neighbor, unless the two share an articulated course or
     two of their courses print identical SLO text: that overlap exists by construction, so it is articulation
     evidence, never outcome evidence. Those pairs go in "s" (marked "course" or "text"), never in the hints ("n").
  5. Each neighbor carries its group in kb/exhibits_ai_sort.json (null when the AI sort leaves it alone); the List
     lays a reviewer's kept groups over it, as it does for the rows.

Reads course_outcomes through PostgREST with SUPABASE_SERVICE_KEY (the daily run's secret), Range-paginated. The table
is public record (chatbox/supabase_course_outcomes.sql grants it select to anon); this builder only reads it.

    python3 kb/_build_exhibit_slo_neighbors.py                       # read course_outcomes, write the file
    python3 kb/_build_exhibit_slo_neighbors.py --outcomes rows.json  # read the rows from a file instead
    python3 kb/_build_exhibit_slo_neighbors.py --check               # exit 1 when the file on disk is stale

--check rebuilds from the same source (the key or --outcomes) and compares; with neither it exits 2, since the SLOs
live only in Supabase. Standard library only.
"""
import json
import math
import os
import pathlib
import re
import sys
import urllib.request
from collections import Counter, defaultdict

ROOT = pathlib.Path(__file__).resolve().parent.parent
ADOPT = ROOT / "kb" / "exhibits_adoption.json"
AI_SORT = ROOT / "kb" / "exhibits_ai_sort.json"
OUT = ROOT / "kb" / "exhibit_slo_neighbors.json"
URL = os.environ.get("SUPABASE_URL", "https://hvuwhnbuahrtptokpqfh.supabase.co").rstrip("/")

THRESHOLD = 0.5      # the test: at 0.5 and up, distinct-course pairs read as the same kind of credential
MAX_DF_SHARE = 0.15  # a lexeme in more than this share of reached credentials carries no signal
MIN_LEN = 3
TOP = 5              # neighbors kept per credential, each list
TF_CAP = 256         # Postgres keeps at most 256 positions per lexeme


# ── The course key and the pseudo-codes ────────────────────────────────────────────────────────────────────────────

def course_key(code):
    return re.sub(r"[^A-Za-z0-9]", "", str(code or "")).upper()


def is_pseudo(k):
    """A GE area or a unit line, never a course: Cal-GETC 1A, Local GE, RCCD GE, GE 3B, CSU GE E, CPL UNITS."""
    return (not k or k.startswith(("CALGETC", "LOCALGE", "RCCDGE"))
            or re.fullmatch(r"GE\d[A-Z]?|GEE|CSUGEE|CPLUNITS|CSUUNITS", k) is not None)


# ── to_tsvector('english'), in Python ──────────────────────────────────────────────────────────────────────────────
# Postgres's english.stop list, then the Snowball English (Porter2) stemmer its english_stem dictionary runs.

STOP = set("""i me my myself we our ours ourselves you your yours yourself yourselves he him his himself she her hers
herself it its itself they them their theirs themselves what which who whom this that these those am is are was were be
been being have has had having do does did doing a an the and but if or because as until while of at by for with about
against between into through during before after above below to from up down in out on off over under again further then
once here there when where why how all any both each few more most other some such no nor not only own same so than too
very s t can will just don should now""".split())

VOWELS = set("aeiouy")
DOUBLES = ("bb", "dd", "ff", "gg", "mm", "nn", "pp", "rr", "tt")
LI_END = set("cdeghkmnrt")
EXC1 = {"skis": "ski", "skies": "sky", "dying": "die", "lying": "lie", "tying": "tie", "idly": "idl", "gently": "gentl",
        "ugly": "ugli", "early": "earli", "only": "onli", "singly": "singl", "sky": "sky", "news": "news", "howe": "howe",
        "atlas": "atlas", "cosmos": "cosmos", "bias": "bias", "andes": "andes"}
EXC2 = {"inning", "outing", "canning", "herring", "earring", "proceed", "exceed", "succeed"}
STEP2 = [("ization", "ize"), ("ational", "ate"), ("fulness", "ful"), ("ousness", "ous"), ("iveness", "ive"),
         ("tional", "tion"), ("biliti", "ble"), ("lessli", "less"), ("entli", "ent"), ("ation", "ate"), ("alism", "al"),
         ("aliti", "al"), ("ousli", "ous"), ("iviti", "ive"), ("fulli", "ful"), ("enci", "ence"), ("anci", "ance"),
         ("abli", "able"), ("izer", "ize"), ("ator", "ate"), ("alli", "al"), ("bli", "ble"), ("ogi", "og"), ("li", "")]
STEP3 = [("ational", "ate"), ("tional", "tion"), ("alize", "al"), ("icate", "ic"), ("iciti", "ic"), ("ative", ""),
         ("ical", "ic"), ("ness", ""), ("ful", "")]
STEP4 = ["ement", "ance", "ence", "able", "ible", "ment", "ant", "ent", "ism", "ate", "iti", "ous", "ive", "ize", "ion",
         "al", "er", "ic"]


def _v(w, i):
    return w[i] in VOWELS


def _regions(w):
    def after(start):
        for i in range(start + 1, len(w)):
            if not _v(w, i) and _v(w, i - 1):
                return i + 1
        return len(w)
    r1 = None
    for p in ("gener", "commun", "arsen"):
        if w.startswith(p):
            r1 = len(p)
            break
    if r1 is None:
        r1 = after(0)
    r2 = after(r1) if r1 < len(w) else len(w)
    return r1, r2


def _short_syll(w, end):
    """Does w[:end] end in a short syllable?"""
    if end == 2:
        return _v(w, 0) and not _v(w, 1)
    if end >= 3:
        return (not _v(w, end - 3) and _v(w, end - 2) and not _v(w, end - 1) and w[end - 1] not in "wxY")
    return False


def porter2(word):
    if len(word) <= 2:
        return word
    if word in EXC1:
        return EXC1[word]
    w = list(word)
    if w[0] == "y":
        w[0] = "Y"
    for i in range(1, len(w)):
        if w[i] == "y" and w[i - 1] in VOWELS:
            w[i] = "Y"
    w = "".join(w)
    r1, r2 = _regions(w)

    # Step 1a
    if w.endswith("sses"):
        w = w[:-2]
    elif w.endswith(("ied", "ies")):
        w = w[:-2] if len(w) > 4 else w[:-1]
    elif w.endswith(("us", "ss")):
        pass
    elif w.endswith("s"):
        if any(c in VOWELS for c in w[:-2]):
            w = w[:-1]
    if w in EXC2:
        return w

    # Step 1b
    for suf in ("eedly", "ingly", "edly", "eed", "ing", "ed"):
        if w.endswith(suf):
            if suf in ("eedly", "eed"):
                if len(w) - len(suf) >= r1:
                    w = w[:-len(suf)] + "ee"
            else:
                stem = w[:-len(suf)]
                if any(c in VOWELS for c in stem):
                    w = stem
                    if w.endswith(("at", "bl", "iz")):
                        w += "e"
                    elif w.endswith(DOUBLES):
                        w = w[:-1]
                    elif r1 >= len(w) and _short_syll(w, len(w)):
                        w += "e"
            break

    # Step 1c
    if len(w) > 2 and w[-1] in "yY" and not _v(w, len(w) - 2):
        w = w[:-1] + "i"

    # Step 2
    for suf, rep in STEP2:
        if w.endswith(suf):
            if len(w) - len(suf) >= r1:
                if suf == "ogi":
                    if w[-4:-3] == "l":
                        w = w[:-3] + "og"
                elif suf == "li":
                    if w[-3:-2] in LI_END and len(w) >= 3:
                        w = w[:-2]
                else:
                    w = w[:-len(suf)] + rep
            break

    # Step 3
    for suf, rep in STEP3:
        if w.endswith(suf):
            if len(w) - len(suf) >= r1:
                if suf == "ative":
                    if len(w) - len(suf) >= r2:
                        w = w[:-5]
                else:
                    w = w[:-len(suf)] + rep
            break

    # Step 4
    for suf in STEP4:
        if w.endswith(suf):
            if len(w) - len(suf) >= r2:
                if suf == "ion":
                    if w[-4:-3] in ("s", "t"):
                        w = w[:-3]
                else:
                    w = w[:-len(suf)]
            break

    # Step 5
    if w.endswith("e"):
        if len(w) - 1 >= r2 or (len(w) - 1 >= r1 and not _short_syll(w, len(w) - 1)):
            w = w[:-1]
    elif w.endswith("l"):
        if len(w) - 1 >= r2 and w[-2:-1] == "l":
            w = w[:-1]
    return w.replace("Y", "y")


_STEM_CACHE = {}


def _stem(t):
    s = _STEM_CACHE.get(t)
    if s is None:
        s = _STEM_CACHE[t] = porter2(t)
    return s


_TOKEN = re.compile(
    r"(?P<path>[^\W_]+(?:[./][^\W_]+)+)"                  # u.s, e.g, and/or: Postgres keeps these whole, unstemmed
    r"|(?P<hy>[^\W_]*[^\W\d_][^\W_]*(?:-[^\W_]+)+)"      # self-paced, co-op, 20th-century: whole and in parts
    r"|(?P<w>[^\W_]+)")


def _word(t, out):
    if t.isdigit():
        return
    if any(c.isdigit() for c in t):
        out.append(t)                                    # numword: kept as typed, lower case
    elif t not in STOP:
        out.append(_stem(t))


def lexemes(text):
    """The lexemes to_tsvector('english', text) makes, repeated as often as they occur."""
    out = []
    for m in _TOKEN.finditer(str(text or "").lower()):
        if m.group("path"):
            out.append(m.group("path"))
        elif m.group("hy"):
            whole = m.group("hy")
            parts = whole.split("-")
            out.append(whole if any(c.isdigit() for c in whole) else _stem(whole))
            for p in parts:
                _word(p, out)
        else:
            _word(m.group("w"), out)
    return [x for x in out if len(x) >= MIN_LEN and re.search(r"[a-z]", x)]


# ── Inputs ─────────────────────────────────────────────────────────────────────────────────────────────────────────

def fetch_outcomes():
    """Every course_outcomes row's college, code, read run and SLOs, Range-paginated (Rule 10 b)."""
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not key:
        return None
    endpoint = f"{URL}/rest/v1/course_outcomes?select=college,course_code,read_run,outcomes&order=id.asc"
    rows, start, page = [], 0, 1000
    while True:
        req = urllib.request.Request(endpoint, headers={
            "apikey": key, "Authorization": f"Bearer {key}", "Accept": "application/json",
            "Range-Unit": "items", "Range": f"{start}-{start + page - 1}"})
        with urllib.request.urlopen(req, timeout=60) as r:
            got = json.load(r)
        rows.extend(got or [])
        if not got or len(got) < page:
            break
        start += page
    return rows


def _run(r):
    try:
        return int(r.get("read_run") or 0)
    except (TypeError, ValueError):
        return 0


def course_texts(rows):
    """(college, key) -> (the SLO text, its distinct lines): the newest read_run per course, lines trimmed, distinct,
    in order, joined by a space (the test's array_agg(distinct trim(e) order by trim(e)))."""
    newest = {}
    for r in rows:
        k = (str(r.get("college") or "").strip(), course_key(r.get("course_code")))
        run = _run(r)
        if k[1] and run >= newest.get(k, -1):
            newest[k] = run
    lines = defaultdict(set)
    for r in rows:
        k = (str(r.get("college") or "").strip(), course_key(r.get("course_code")))
        if not k[1] or _run(r) != newest.get(k):
            continue
        outs = r.get("outcomes") or []
        if isinstance(outs, str):
            outs = json.loads(outs)
        for e in outs:
            e = str(e).strip()
            if e:
                lines[k].add(e)
    return {k: " ".join(sorted(v)) for k, v in lines.items() if v}


def credential_courses(adopt):
    """Title -> {(college, key)}: each credential's articulated courses, the pseudo-codes dropped."""
    cols = adopt.get("colleges") or []
    out = {}
    for title, c in (adopt.get("credentials") or {}).items():
        keys = set()
        for ci, v in (c.get("a") or {}).items():
            try:
                college = cols[int(ci)]
            except (ValueError, IndexError):
                continue
            for line in (v[1] if len(v) > 1 else []) or []:
                k = course_key(line[0] if line else "")
                if not is_pseudo(k):
                    keys.add((college, k))
        if keys:
            out[title] = keys
    return out


def ai_groups(ai):
    """Title -> its group's name in the AI sort, or None when the sort leaves it alone."""
    groups = (ai or {}).get("groups") or []
    out = {}
    for t, pos in ((ai or {}).get("order") or {}).items():
        g = groups[pos[0]] if pos and 0 <= pos[0] < len(groups) else None
        out[t] = g["name"] if g and g.get("n", 1) > 1 else None
    return out


# ── The build ──────────────────────────────────────────────────────────────────────────────────────────────────────

def build(adopt, ai, rows):
    texts = course_texts(rows)
    creds = credential_courses(adopt)
    reached = {t: sorted(k for k in ks if k in texts) for t, ks in creds.items()}
    reached = {t: ks for t, ks in reached.items() if ks}
    n = len(reached)

    tf = {}
    for t, ks in reached.items():
        c = Counter()
        for txt in sorted({texts[k] for k in ks}):
            c.update(lexemes(txt))
        tf[t] = c
    df = Counter()
    for c in tf.values():
        df.update(c.keys())
    cap = MAX_DF_SHARE * n
    vec, norm, post = {}, {}, defaultdict(list)
    for t, c in tf.items():
        v = {x: (1 + math.log(min(f, TF_CAP))) * math.log(n / df[x]) for x, f in c.items() if df[x] <= cap}
        v = {x: w for x, w in v.items() if w > 0}
        vec[t] = v
        norm[t] = math.sqrt(sum(w * w for w in v.values()))
        for x, w in v.items():
            post[x].append((t, w))

    dot = defaultdict(float)
    for x, lst in post.items():
        lst.sort()
        for i in range(len(lst)):
            ta, wa = lst[i]
            for j in range(i + 1, len(lst)):
                tb, wb = lst[j]
                dot[(ta, tb)] += wa * wb

    by_course, by_text = defaultdict(set), defaultdict(set)
    for t, ks in reached.items():
        for k in ks:
            by_course[k].add(t)
            by_text[texts[k]].add((t, k))
    shared_course, shared_text = set(), set()
    for ts in by_course.values():
        ts = sorted(ts)
        for i in range(len(ts)):
            for j in range(i + 1, len(ts)):
                shared_course.add((ts[i], ts[j]))
    for members in by_text.values():
        for a, ka in members:
            for b, kb in members:
                if a < b and ka != kb:
                    shared_text.add((a, b))

    group = ai_groups(ai)
    near, shared = defaultdict(list), defaultdict(list)
    pairs_n = pairs_s = 0
    for (a, b), d in dot.items():
        if not norm[a] or not norm[b]:
            continue
        s = d / (norm[a] * norm[b])
        if s + 1e-12 < THRESHOLD:
            continue
        s = round(s, 3)
        kind = "course" if (a, b) in shared_course else "text" if (a, b) in shared_text else None
        if kind:
            pairs_s += 1
            shared[a].append([b, s, group.get(b), kind])
            shared[b].append([a, s, group.get(a), kind])
        else:
            pairs_n += 1
            near[a].append([b, s, group.get(b)])
            near[b].append([a, s, group.get(a)])

    out = {}
    for t in sorted(set(near) | set(shared)):
        e = {"g": group.get(t)}
        if near.get(t):
            e["n"] = sorted(near[t], key=lambda x: (-x[1], x[0]))[:TOP]
        if shared.get(t):
            e["s"] = sorted(shared[t], key=lambda x: (-x[1], x[0]))[:TOP]
        out[t] = e

    colleges = sorted({k[0] for ks in reached.values() for k in ks})
    split = sum(1 for t, e in out.items() for x in e.get("n", [])
                if t < x[0] and not (group.get(t) and group.get(t) == x[2]))
    return {
        "schema": 1,
        "_what": "The Exhibits List's Outcomes match hints: credentials whose articulated courses' SLOs match at cosine "
                 f"{THRESHOLD} or more. n = distinct-course neighbors [title, score, AI sort group or null], the hints; "
                 "s = pairs that share an articulated course or identical SLO text [title, score, group, course|text], "
                 "articulation evidence kept apart; g = the credential's own AI sort group. Built by kb/_build_exhibit_slo_neighbors.py from "
                 "kb/exhibits_adoption.json, kb/exhibits_ai_sort.json and public.course_outcomes; its docstring states "
                 "the method. A second signal, never a decider.",
        "_adoption_written_at": adopt.get("written_at"),
        "_ai_sort_reference": (ai or {}).get("_reference_generated_at"),
        "_params": {"threshold": THRESHOLD, "max_df_share": MAX_DF_SHARE, "min_len": MIN_LEN, "top": TOP},
        "counts": {"credentials_articulated": len(creds), "credentials_reached": n, "colleges": len(colleges),
                   "courses_with_slos": len({k for ks in reached.values() for k in ks}),
                   "pairs_distinct": pairs_n, "pairs_distinct_split_by_ai_sort": split, "pairs_shared": pairs_s,
                   "credentials_with_hint": sum(1 for e in out.values() if e.get("n")),
                   "credentials_with_hint_across_groups": sum(
                       1 for e in out.values() if any(not (e["g"] and e["g"] == x[2]) for x in e.get("n", [])))},
        "colleges": colleges,
        "neighbors": out,
    }


def render(data):
    return json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n"


def main(argv=None):
    argv = sys.argv[1:] if argv is None else argv
    src = argv[argv.index("--outcomes") + 1] if "--outcomes" in argv else None
    if src:
        rows = json.loads(pathlib.Path(src).read_text(encoding="utf-8"))
    else:
        rows = fetch_outcomes()
        if rows is None:
            print("No SLO source: set SUPABASE_SERVICE_KEY or pass --outcomes FILE (course_outcomes rows).")
            return 2
    if not rows:
        print("course_outcomes returned no rows; the file is left as it was.")
        return 1
    adopt = json.loads(ADOPT.read_text(encoding="utf-8"))
    ai = json.loads(AI_SORT.read_text(encoding="utf-8")) if AI_SORT.exists() else {}
    data = build(adopt, ai, rows)
    text = render(data)
    if "--check" in argv:
        if not OUT.exists() or OUT.read_text(encoding="utf-8") != text:
            print("kb/exhibit_slo_neighbors.json is STALE — run: python3 kb/_build_exhibit_slo_neighbors.py")
            return 1
        print("kb/exhibit_slo_neighbors.json ok")
        return 0
    OUT.write_text(text, encoding="utf-8")
    c = data["counts"]
    if "--quiet" not in argv:
        print(f"wrote {OUT.relative_to(ROOT)}: {c['credentials_reached']} credentials reached at {c['colleges']} colleges; "
              f"{c['pairs_distinct']} distinct-course pairs at {THRESHOLD}+ ({c['pairs_distinct_split_by_ai_sort']} split by "
              f"the AI sort), {c['pairs_shared']} sharing a course or text; {c['credentials_with_hint']} carry a hint")
    return 0


if __name__ == "__main__":
    sys.exit(main())
