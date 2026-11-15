#!/usr/bin/env python3
"""The Honors pairs: a DRY RUN of the `honors_of` rows and the base-plus-H mints (S653). It writes a plan and nothing
else: no kb file outside its own out dir, no generated file, no Supabase row, no `.apply` line.

THE RULINGS (Sam): an Honors course gets its own M-ID with a declared equivalence to its base (Sheet 191 card 1,
`sam-honors-own-mid-2026-11-13`); "Base number plus H (MATH M1036H)", "Two-way: either satisfies the other",
"Build the field first, then the rows", "Rows for all 508 pairs" (Sheet 197 card 3, 14:37Z 2026-11-14,
`sam-sheet-197-answers-2026-11-14`); "CCN structures should be our gold standard"
(`sam-ccn-structures-gold-standard-2026-11-14`); C-ID records stay as the official body numbers them (Sheet 195).
Design and the step order: docs/reference/honors_of_design.md.

WHAT IT DOES.
  1. Reproduces the pair count with the code that found it: `measure_honors` in kb/_reclustering_s648_dryrun.py
     (imported, never copied), on the committed members file. Since the 2026-11-14 20:27Z daily run the committed
     payload carries #3304's delete and step 1's two rows, so the plan reads it as it stands (S654); the two
     simulated exports that stood in for the delete before it synced are retired.
  2. Plans each pair: the honors_of row, the proposed H id, member counts by named measure, and every hold. THE
     NARROW RULE (S654, `d-honors-narrow-positive-rule-s654`; #3315's third review): a pair gets a row and a mint only
     when (a) the second derivation (kb/_honors_pairs_second.py) finds it by number, the matcher finding it too; (b)
     the base holds one title group; (c) no college gives the base two course numbers; (d) the sequence marks of
     every raw title on both sides agree, read before strip_honors. Held is the default: everything else waits until
     its base is split. Held outright as well: the bases review three named, two Honors ids with different courses
     on one official base, a base holding a CCN-coded course. lump_reasons stays as a report column only.
  3. --check, on the apply day after the last daily run: re-measures all of it on the checkout's payload, refuses
     unless the step-2 rows' digest and the plan's class digest are the plan's, and refuses a checkout without
     origin/main's head. On a pass it writes check_receipt.json beside the plan: the head, both digests, the SQL's
     sha256 and the payload's. scripts/supabase_migrate.py refuses the rows SQL without a matching receipt.

THE MEASURES, NAMED (COBIx's review of #3304, item 3). "local courses" = rows in unified_courses_members.js under the
id (HUMA M1110 63 to 62 in S652's simulation); "folded identities" = the `members` field of the id's row in
unified_courses_data.js or unified_courses_standalone.js (HUMA M1110 11 to 10).

Run (from repo root):
  python3 kb/_honors_of_s653_dryrun.py --plan        # writes kb/honors_of_s653_out/<today>/ and step 2's SQL
  python3 kb/_honors_of_s653_dryrun.py --sql-only    # redrafts step 2's SQL from the newest plan.json
  python3 kb/_honors_of_s653_dryrun.py --check       # the apply-day check on the newest plan (or --date)
"""
import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
from collections import Counter, defaultdict
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)

import honors_of as ho  # noqa: E402
import _reclustering_s648_dryrun as s648  # noqa: E402
import _mid_outcomes_compare as cmp  # noqa: E402
import alias_chain  # noqa: E402

COHORT = "honors-s653@bot"          # step 1: the first two honors_of rows (2026-11-14_s653_honors_of_field.sql)
COHORT_ROWS = "honors-rows-s653@bot"  # step 2: its own cohort, so each rollback keys on cohort and field alone
ho_LEDGER = ("reviewed_by", "reviewed_at", "validated_at", "validated_by")
# The two rows #3304 deleted live (receipt kb/receipts/migration_s652_honors_two_row_delete_43607926526.json).
S652_DELETED = [
    {"course_id": "HUMA M10ME", "field": "merge_into", "value": "HUMA M1110", "reviewer_email": "automerge-v1@bot"},
    {"course_id": "LIBR M10CJ", "field": "merge_into", "value": "LIBR M1040", "reviewer_email": "automerge-v1@bot"},
]
# Decided and not yet done: its own step, after the field (d-huma-m10oi-into-m1110-s652).
DECIDED_MERGES = {"HUMA M10OI": "HUMA M1110"}


def jload(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def js_payload(path):
    s = open(path, encoding="utf-8").read()
    i = s.index("=", s.index("window.")) + 1
    while s[i].isspace():
        i += 1
    return json.JSONDecoder().raw_decode(s, i)[0]


# ── The overlay ─────────────────────────────────────────────────────────────────────────────────────────────────

def overlay_live(doc):
    """The overlay as kb/_apply_curation.py writes it after #3304's delete. Since the 2026-11-14 20:27Z daily run
    the committed overlay is that already (the two leaf entries hold honors_of, never the merge); a copy that still
    carries the deleted merges has them taken out, each entry holding only the merge."""
    cur = doc["curations"]
    for r in S652_DELETED:
        e = cur.get(r["course_id"]) or {}
        if e.get(r["field"]) is None:
            continue
        if (e.get(r["field"]), e.get("reviewed_by")) != (r["value"], r["reviewer_email"]):
            raise SystemExit(f"ABORT: the overlay's {r['course_id']} entry is not the deleted row: {e}")
        if {k for k in e if k not in (r["field"], "reviewed_by", "reviewed_at")}:
            raise SystemExit(f"ABORT: {r['course_id']} carries other fields")
        del cur[r["course_id"]]
    doc["count"] = len(cur)
    return doc


# ── 3. The plan ─────────────────────────────────────────────────────────────────────────────────────────────────

class Shim:
    """What measure_honors reads from kb/_reclustering_s648_dryrun.World, without the COCI workbook."""

    def __init__(self, members_dir):
        self.members, self.generated_at = cmp.load_members(members_dir)
        self.cat = jload(os.path.join(HERE, "coci_minted_courses.json"))["courses"]
        self.sg = jload(os.path.join(HERE, "coci_minted_singletons.json"))["courses"]
        self.cur = jload(os.path.join(HERE, "coci_curation.json"))["curations"]
        districts, _ = cmp.load_districts(ROOT)
        self.voice = cmp.voice_of(districts)

    def id_system(self, i):
        return s648.World.id_system(self, i)

    def discipline(self, i):
        return s648.World.discipline(self, i)

    def provenance(self, identity, college, code):
        return {"sits_by": "not read by this plan"}


def pairs_of(rows):
    return Counter((r["identity"], r["base_identity"]) for r in rows
                   if r.get("base_identity") and r["base_identity"] != r["identity"])


def folded_identities(out_dir):
    out = {}
    for name in ("unified_courses_data.js", "unified_courses_standalone.js"):
        for r in js_payload(os.path.join(out_dir, name)).get("rows") or []:
            out.setdefault(r["id"], r.get("members"))
    return out


def merge_path(merge_into, i):
    """i and every id its merge_into chain passes through, in order (a cycle stops the walk)."""
    path, seen = [i], {i}
    while path[-1] in merge_into and merge_into[path[-1]] not in seen:
        path.append(merge_into[path[-1]])
        seen.add(path[-1])
    return path


def joining_edges(merge_into, h, b):
    """The merge edges that put h and b under one id: each side's edges up to the first id both paths reach. None when
    the two stay apart. An edge is the id that carries the merge_into row."""
    ph, pb = merge_path(merge_into, h), merge_path(merge_into, b)
    meet = [i for i in ph if i in set(pb)]
    if not meet:
        return None
    m = meet[0]
    return ph[:ph.index(m)] + pb[:pb.index(m)]


def honors_titles(w, i):
    return sorted({s648.strip_honors(m["title"]) for m in (w.members.get(i) or [])
                   if s648.is_honors(m["title"], m["code"])[0] == "honors"} - {""})


# Words that name no course of their own: a title check reads past them ("Introduction to Astronomy Laboratory" is
# "Astronomy Laboratory"; "General Chemistry" is "Chemistry").
FOLD_FILLER = {"introduction", "intro", "introductory", "principles", "fundamentals", "general"}


def _title_words(title):
    t = re.split(r"\bformerly\b", s648.strip_honors(title or ""), maxsplit=1)[0]
    t = re.sub(r"\bu s\b|\bus\b", "united states", " " + t + " ")
    return [w for w in t.split() if len(w) > 1 and w not in s648.STOP and w not in FOLD_FILLER
            and not (re.search(r"\d", w) and re.search(r"[a-z]", w))   # a course code (240h) is not a word
            and w not in s648.ROMAN and not w.isdigit()]                 # sequence marks are compared apart


def _word_names(a, b):
    """One title word names another: equal, or the shorter, three letters or more, begins the longer (Hist,
    History). No looser spelling: a same-first-letter subsequence reads Phil as Physical."""
    if a == b:
        return True
    s, l = (a, b) if len(a) <= len(b) else (b, a)
    return len(s) >= 3 and l.startswith(s)


def one_course(x, y):
    """Two titles name one course: the same sequence marks (seq_tokens: I and II, A and B, to 1750 and since), and every
    word of each, past fillers, named in the other. Fails closed: a different word makes two courses."""
    if s648.seq_tokens(x) != s648.seq_tokens(y):
        return False
    wx, wy = _title_words(x), _title_words(y)
    if not wx or not wy:
        return wx == wy
    return all(any(_word_names(a, b) for b in wy) for a in wx) and all(any(_word_names(b, a) for a in wx) for b in wy)


def same_course(titles_a, titles_b):
    """Two ids' Honors titles name one course: each title of each names one of the other's (one_course)."""
    return bool(titles_a) and bool(titles_b) and all(any(one_course(a, b) for b in titles_b) for a in titles_a) \
        and all(any(one_course(a, b) for a in titles_a) for b in titles_b)


def near(x, y):
    """Looser than one_course, for reading a base's members: the stems mostly agree (title_agree 0.5) or one_course,
    and always the same sequence marks. Catalog variants of one course read as one ("Comparative World Religions",
    "World Religions"); parts and periods never do."""
    if s648.seq_tokens(x) != s648.seq_tokens(y):
        return False
    return s648.title_agree(s648.strip_honors(x), s648.strip_honors(y)) >= 0.5 or one_course(x, y) \
        or (min(len(_title_words(x)), len(_title_words(y))) >= 2 and s648.abbrev_agree(x, y) >= 1.0)


def title_clusters(titles):
    """Group titles into courses, most common title first: a title joins the first group whose every title it is near
    (complete linkage), else starts its own. A chain of near titles ("Introduction to Fiction", "Fiction", "Fiction
    Writing") never joins two courses through a middle title. Returns [(local courses, [titles by count])]."""
    cnt = Counter(s648.strip_honors(t) for t in titles)
    groups = []
    for t in sorted(cnt, key=lambda x: (-cnt[x], x)):
        for g in groups:
            if all(near(t, u) for u in g):
                g.append(t)
                break
        else:
            groups.append([t])
    return sorted(((sum(cnt[t] for t in g), g) for g in groups), key=lambda x: (-x[0], x[1]))


SIBLING_AGREE = 0.4   # two titles this close whose sequence marks differ are parts of one subject


def lump_reasons(w, h, b):
    """Why the base, or the Honors id, holds more than one course (#3315's review: an H id would claim an equivalence
    its members do not have). Empty when each holds one course. Measure: local courses in unified_courses_members.js.
    A base is a lump when its titles fall into two groups of two or more local courses each, or two of its titles
    name one subject in different parts or periods (I and II; to 1820 and since). An Honors id is a lump when its
    Honors titles fall into two groups."""
    base = [m["title"] for m in (w.members.get(b) or []) if s648.is_honors(m["title"], m["code"])[0] != "honors"]
    hon = [m["title"] for m in (w.members.get(h) or []) if s648.is_honors(m["title"], m["code"])[0] == "honors"]
    out = []
    groups = title_clusters(base)
    big = [g for g in groups if g[0] >= 2]
    if len(big) >= 2:
        out.append(f"the base holds more than one course: {len(big)} of two or more local courses each, "
                   + "; ".join(f"{g[1][0]} ({g[0]})" for g in big[:4]))
    distinct = sorted({s648.strip_honors(t) for t in base})
    for i, x in enumerate(distinct):
        sib = next((y for y in distinct[i + 1:] if s648.seq_tokens(x) != s648.seq_tokens(y)
                    and s648.title_agree(x, y) >= SIBLING_AGREE), None)
        if sib:
            out.append(f"the base holds two parts or periods of one subject: {x}; {sib}")
            break
    hg = title_clusters(hon)
    if len(hg) >= 2:
        out.append("the Honors id holds two Honors courses: " + "; ".join(g[1][0] for g in hg[:3]))
    return out


# ── The narrow rule (S654) ──────────────────────────────────────────────────────────────────────────────────────
# #3315's third review: the lump test and the sequence test leaked for a third round, so they no longer decide. A
# pair gets a row and a mint only when all four tests below pass; held is the default (`d-honors-narrow-positive-
# rule-s654`). Each test reads the members file (local courses) and fails closed.

# The bases review three named in findings 1 and 2, held outright until each is split (MUSIC 015A and 015B in one id,
# HUM 16, 18 and 24 in one id, Advanced C, C++ and C# in one id, a dashed period lost, a sequence under one title).
REVIEW3_BASES = ("ASTR M1019", "BIOL M1049", "BIOL M1262", "ENGL M1348", "ETHS M1256", "FREN M1014", "FREN M1035",
                 "FTVE M1002", "HIST M1183", "HUMA M1114", "HUMA M1125", "ITIS M1068", "JAPN M1017", "JAPN M1032",
                 "MATH M1123", "MUSI M1044", "MUSI M1237")
# Finding 5's Honors ids: two ids with different parts on one official base, or a pair that is not Honors and base.
REVIEW3_ROW_ONLY = ("BIOL M1103", "BIOL M10OY", "BUSI M10FD", "BUSI M10FE", "MATH M11DN", "MATH M11DO", "THTR M11MI")
# A CCN-coded local course (Skyline ASTR C1001L): the CCN record is the gold standard (Sam, 2026-11-14).
CCN_CODE = re.compile(r"^[A-Z]+\s*C\d{4}[A-Z]*$")
H_ID_SQL = r"^[A-Z]{1,6} [MZ][0-9][A-Z0-9]{3}H$"   # the mint's marker: a kb_curation row keyed on an H id
STRICT_STOP = {"and", "of", "the", "a", "an", "in", "for", "on"}
PART_WORDS = {"one": "1", "two": "2", "three": "3", "four": "4", "first": "1", "second": "2", "third": "3"}


def strict_words(title):
    """A title's words for the one-group test: lower case, '&' read as 'and', 'U.S.' as 'united states', '+' and '#'
    kept (C, C++ and C# are three courses), 'with' kept (Astronomy Lab beside Astronomy with Lab is two), sequence
    marks dropped (they are compared apart, in sequence_marks), a trailing s dropped from a word of four letters or
    more."""
    t = s648.HONORS_WORD.sub(" ", title or "").lower().replace("&", " and ")
    t = re.sub(r"\bu\.?\s?s\.?(?=\s|$)", " united states ", t)
    ws = [x for x in re.findall(r"[a-z0-9][a-z0-9+#]*", t)
          if x not in STRICT_STOP and x not in s648.ROMAN and not re.fullmatch(r"\d{1,2}", x)]
    if ws and len(ws[-1]) == 1:
        ws = ws[:-1]
    return [x.rstrip("s") if len(x) > 3 else x for x in ws]


def _strict_names(a, b):
    if a == b:
        return True
    s, l = (a, b) if len(a) <= len(b) else (b, a)
    return len(s) >= 3 and l.startswith(s) and not re.search(r"[+#]", l)


def strict_one(x, y):
    """Two titles name one course: every word of each, equal or a prefix of three letters or more, in the other."""
    wx, wy = strict_words(x), strict_words(y)
    if not wx or not wy:
        return wx == wy
    return all(any(_strict_names(a, b) for b in wy) for a in wx) and all(any(_strict_names(b, a) for a in wx) for b in wy)


def one_title_group(titles):
    """(b): every distinct title names one course with every other (complete linkage: no middle title chains two)."""
    ts = sorted(set(titles))
    return bool(ts) and all(strict_one(a, b) for i, a in enumerate(ts) for b in ts[i + 1:])


def course_number(code):
    """The number part of a local code, subject and spaces dropped, leading zeros dropped: 'HIST 128' and 'BIOL 128'
    (one course cross-listed) are one number; 'MUSIC 015A' and 'MUSIC 015B' are two; 'F TV 002A' is '2A'."""
    c = re.sub(r"\s+", "", (code or "").upper())
    m = re.search(r"\d[0-9A-Z]*$", c)
    return re.sub(r"^0+(?=\d)", "", m.group(0) if m else c)


def two_numbers(rows):
    """(c): the colleges that give these rows two course numbers or more."""
    by = defaultdict(set)
    for r in rows:
        by[r["college"]].add(course_number(r["code"]))
    return sorted(c for c, v in by.items() if len(v) > 1)


def sequence_marks(title):
    """(d): the marks that tell one course of a sequence from the next, read from the raw title before strip_honors
    (a dashed period, "(1895-1950)", survives): seq_tokens, plus an end letter C to F, "Part One" or "Part 2", and the
    words early, late, later and recent."""
    raw = title or ""
    out = set(s648.seq_tokens(raw))
    low = s648.HONORS_WORD.sub(" ", raw).lower()
    ws = re.findall(r"[a-z0-9]+", low)
    if ws and len(ws[-1]) == 1 and ws[-1] in "cdef":
        out.discard("1")
        out.add("letter " + ws[-1])
    for m in re.finditer(r"\bpart\s+(one|two|three|four|first|second|third|\d|iv|i{1,3})\b", low):
        out.discard("1")
        out.add("part " + PART_WORDS.get(m.group(1), str(s648.ROMAN_VALUE.get(m.group(1), m.group(1)))))
    for word in ("early", "late", "later", "recent"):
        if re.search(r"\b" + word + r"\b", low):
            out.add("period " + word)
    return frozenset(out)


def narrow_reasons(w, h, b, base_system, second_by, base_rows=None):
    """Why the narrow rule holds the pair (empty: a row, and a mint on an M-ID base). base_rows: for an official base,
    the base courses the pair names (an official record holds many colleges' courses by its body's definition, so
    (b) and (c) read only an M-ID base). The labels in kb/_honors_matcher_recall.py score this function."""
    out = []
    if "number" not in (second_by or ()):
        out.append("(a) the second derivation does not find the pair by number"
                   + (" (by title alone)" if second_by else ""))
    hon = [m for m in (w.members.get(h) or []) if s648.is_honors(m["title"], m["code"])[0] == "honors"]
    if base_system == "M-ID":
        base = [m for m in (w.members.get(b) or []) if s648.is_honors(m["title"], m["code"])[0] != "honors"]
        if not one_title_group([m["title"] for m in base]):
            ts = sorted({" ".join(m["title"].split()) for m in base})
            out.append(f"(b) the base holds more than one title group: {'; '.join(ts[:4])}"
                       + (f" and {len(ts) - 4} more" if len(ts) > 4 else ""))
        tn = two_numbers(base)
        if tn:
            out.append(f"(c) a college gives the base two course numbers: {', '.join(tn[:3])}")
    else:
        base = base_rows or []
    marks = {sequence_marks(m["title"]) for m in base + hon}
    if len(marks) > 1:
        out.append("(d) the sequence marks differ across the base and the Honors side: "
                   + "; ".join(sorted(", ".join(sorted(x)) for x in marks)[:4]))
    return out


def plan_pairs(w, rows, out_dir, live_cur, second):
    """Every pair either derivation finds, planned. second: kb/_honors_pairs_second.derive on the same members. A pair
    gets a row only where both find it (two signals); a pair one alone finds is held and says which."""
    first = pairs_of(rows)
    pairs = Counter(first)
    for k in second:
        pairs.setdefault(k, 0)
    folded = folded_identities(out_dir)
    index = set(cmp.load_index(out_dir))
    live_ids = index | set(w.members) | set(w.cat) | set(w.sg)
    honors_rows = defaultdict(list)
    for r in rows:
        if r.get("base_identity") and r["base_identity"] != r["identity"]:
            honors_rows[(r["identity"], r["base_identity"])].append(r)
    bases_of = defaultdict(set)
    for (h, b) in pairs:
        bases_of[h].add(b)
    # A base whose courses already pair with a CCN Honors record (ASTR C1001H beside ASTR M1012): CCN holds that
    # Honors course, so an M-ID Honors pair on the same base waits for it (the #3313 review's addition).
    ccn_h_partner = defaultdict(set)
    for (h, b) in pairs:
        if s648.World.id_system(w, h) == "CCN-ID" and h.endswith("H"):
            ccn_h_partner[b].add(h)
    # The Honors M-IDs whose courses name this base and no other share the base's one H id (decision 3). The first
    # (most local courses, then id) takes it by a one-to-one alias map at the mint; each other one keeps its own
    # honors_of row under its own id and folds by a merge into the minted H id, its own change after the mint. So the
    # mint never moves two ids onto one key, and no (course_id, field) slot is ever written twice (#3315's review,
    # item 5).
    honors_of_base = defaultdict(set)
    for (h, b) in pairs:
        if s648.World.id_system(w, h).startswith("M-ID") and len(bases_of[h]) == 1:
            honors_of_base[b].add(h)

    def h_order(b):
        return sorted(honors_of_base[b], key=lambda i: (-len(w.members.get(i) or []), i))
    # Finding 5: an official base that takes two or more M-ID Honors ids holds each unless their Honors titles name
    # one course (two-way rows would make part I and part II equivalent through one base).
    official_takers = defaultdict(set)
    for (h, b) in pairs:
        if s648.World.id_system(w, h).startswith("M-ID") and not s648.World.id_system(w, b).startswith("M-ID"):
            official_takers[b].add(h)

    def takers_one_course(b):
        ts = [honors_titles(w, i) for i in sorted(official_takers[b])]
        raw = {sequence_marks(m["title"]) for i in official_takers[b] for m in (w.members.get(i) or [])
               if s648.is_honors(m["title"], m["code"])[0] == "honors"}
        return len(raw) <= 1 and all(same_course(ts[0], t) for t in ts[1:])
    promotions = jload(os.path.join(HERE, "promotions.json"))["promotions"]
    merge_into = {k: v["merge_into"] for k, v in live_cur.items() if isinstance(v, dict) and v.get("merge_into")}
    pending, _ = alias_chain.pending_maps(None, baseline_through=alias_chain.ALIAS_MAPS[-1])
    pmaps = alias_chain.load_maps(pending)

    def system(i):
        s = w.id_system(i)
        return "M-ID" if s.startswith("M-ID") else s

    def composition(i):
        ms = w.members.get(i) or []
        kinds = Counter(s648.is_honors(m["title"], m["code"])[0] for m in ms)
        return {"local_courses": len(ms), "honors_courses": kinds.get("honors", 0),
                "program_courses": kinds.get("program", 0),
                "colleges": len({m["college"] for m in ms})}

    def person(i):
        e = live_cur.get(i) or {}
        rb = e.get("reviewed_by")
        return rb if rb and not ho.is_bot(rb) else None

    out = []
    for (h, b), n in sorted(pairs.items()):
        hs, bs = system(h), system(b)
        hc, bc = composition(h), composition(b)
        pure = hc["local_courses"] > 0 and hc["honors_courses"] + hc["program_courses"] == hc["local_courses"]
        rec = {"honors_id": h, "base_id": b, "honors_system": hs, "base_system": bs,
               "course_pairs": n,
               "courses": [[r["college"], r["code"], r["base_code"]] for r in honors_rows[(h, b)]][:4],
               "honors": {"local_courses": hc["local_courses"], "honors_courses": hc["honors_courses"],
                          "colleges": hc["colleges"], "folded_identities": folded.get(h)},
               "base": {"local_courses": bc["local_courses"], "colleges": bc["colleges"],
                        "folded_identities": folded.get(b)},
               "proposed_h_id": ho.honors_id_for(b) if bs == "M-ID" else None,
               "found_by": sorted((["the matcher"] if (h, b) in first else [])
                                  + (["the second derivation"] if (h, b) in second else [])),
               "second_by": sorted(second.get((h, b)) or []),
               "holds": [], "notes": []}
        if alias_chain.resolve_id(h, pmaps) != h or alias_chain.resolve_id(b, pmaps) != b:
            rec["holds"].append("an id moves under a pending alias map")
        if hs != "M-ID":
            rec["action"] = "none: the Honors side is a " + hs + " record, which stays as its body numbers it"
            if hs == "CCN-ID" and h.endswith("H") and h[:-1] == b:
                rec["notes"].append("CCN already holds this pair as base and H record")
            out.append(rec)
            continue
        # A row's key and value are live ids in the payload the plan reads; on the apply day --check re-measures the
        # whole plan on the day's payload (the SQL itself cannot see the live id set).
        for i in (h, b):
            if i not in live_ids:
                raise SystemExit(f"ABORT: {i} (pair {h} with {b}) is not in the live id set")
        # Two signals or hold (the conductor, after #3315's review): the matcher and the second derivation must both
        # find the pair.
        if (h, b) not in first:
            rec["holds"].append("found by the second derivation alone (by " + " and ".join(rec["second_by"])
                                + "): the matcher holds it out")
        elif (h, b) not in second:
            rec["holds"].append("found by the matcher alone: the second derivation does not find it")
        # The narrow rule (S654): a row and a mint only where all four tests pass; held is the default, leads and
        # followers alike, until the base is split. lump_reasons stays as a report column and decides nothing.
        base_rows = None
        if bs != "M-ID":
            want = {(r["college"], r["base_code"]) for r in honors_rows[(h, b)]}
            base_rows = [m for m in (w.members.get(b) or []) if (m["college"], m["code"]) in want]
        rec["narrow"] = narrow_reasons(w, h, b, bs, rec["second_by"], base_rows)
        rec["holds"].extend(rec["narrow"])
        if bs == "M-ID":
            rec["report_lump"] = lump_reasons(w, h, b)
        if b in REVIEW3_BASES:
            rec["holds"].append("named in #3315's third review (findings 1 and 2): held until the base is split")
        if h in REVIEW3_ROW_ONLY:
            rec["holds"].append("named in #3315's third review (finding 5): two Honors ids with different parts, or "
                                "a pair that is not Honors and base, on one official base")
        if bs != "M-ID" and len(official_takers[b]) > 1 and not takers_one_course(b):
            rec["holds"].append(f"the official base {b} takes {len(official_takers[b])} Honors ids whose Honors "
                                f"titles name different courses: {', '.join(sorted(official_takers[b]))}")
        ccn = sorted({m["code"] for m in (w.members.get(b) or []) if CCN_CODE.match(" ".join(m["code"].split()))})
        if bs == "M-ID" and ccn:
            rec["holds"].append(f"the base holds a CCN-coded course ({', '.join(ccn[:3])}): the CCN record is the "
                                "gold standard, and the course belongs under it before any mint")
        md = sorted(k for k, v in live_cur.items() if isinstance(v, dict) and v.get("merge_dismissed")
                    and {h, b} <= set(str(v["merge_dismissed"]).split("|")))
        if md:
            rec["notes"].append(f"a Keep as-is ({', '.join(md)}) names both ids: it agrees with the pair standing apart")
        if not pure:
            rec["holds"].append(f"the Honors course shares its M-ID with {hc['local_courses'] - hc['honors_courses'] - hc['program_courses']} "
                                "non-Honors course(s): a split comes before any row")
        if len(bases_of[h]) > 1:
            rec["holds"].append(f"the Honors M-ID's courses name {len(bases_of[h])} base identities: "
                                + ", ".join(sorted(bases_of[h])))
        if ccn_h_partner.get(b):
            rec["holds"].append(f"the CCN Honors record {', '.join(sorted(ccn_h_partner[b]))} already pairs with a "
                                f"course in {b}: this M-ID's Honors courses belong beside it")
        if bs == "M-ID":
            hid = rec["proposed_h_id"]
            if hid in live_ids and hid != h:
                rec["holds"].append(f"the proposed id {hid} already exists")
            if len(honors_of_base[b]) > 1 and h in honors_of_base[b] and h_order(b)[0] != h:
                lead = h_order(b)[0]
                rec["fold_into"] = hid
                rec["fold_lead"] = lead
                mine, theirs = honors_titles(w, h), honors_titles(w, lead)
                rec["fold_titles"] = {"this": mine, "lead": theirs}
                if not same_course(mine, theirs):
                    rec["holds"].append(f"the fold would join distinct Honors courses: {lead} takes {hid}, and this "
                                        "id's Honors titles name another course in a base that lumps several")
                else:
                    rec["notes"].append(f"the base has {len(honors_of_base[b])} single-base Honors M-IDs "
                                        f"({', '.join(h_order(b))}): {lead} takes {hid} at the mint; this one keeps "
                                        "its own honors_of row and merges into the H id after the mint, its own change")
        elif bs == "CCN-ID":
            if b + "H" in live_ids:
                rec["holds"].append(f"the CCN record {b}H already holds Honors courses beside {b}: this M-ID's "
                                    "courses belong beside it, a fold and not a row")
            else:
                rec["notes"].append("the base is a CCN record: honors_of names it; no H id is minted (CCN numbers its own)")
        else:
            rec["notes"].append("the base is a C-ID record: honors_of names it; no H id (C-ID has no H ids)")
        for i, side in ((b, "base"), (h, "Honors id")):
            if i in merge_into:
                rec["holds"].append(f"the {side} {i} is slated to merge into {merge_into[i]}")
            if i in DECIDED_MERGES:
                rec["holds"].append(f"the {side} {i} is DECIDED to merge into {DECIDED_MERGES[i]}")
        # Item 1: a person's saved row holds the pair only where the pair's honors_of would contradict it: a person's
        # merge that puts the Honors id and its base under one id. A person's merge of a third course into either
        # side, a title, a discipline or a Keep as-is agrees with the pair standing apart.
        edges = joining_edges(merge_into, h, b)
        if edges:
            by = sorted({live_cur[e].get("reviewed_by") or "?" for e in edges})
            if any(not ho.is_bot(x) for x in by):
                rec["holds"].append("a person's merge joins the Honors id and its base: Rule 10, the person's row wins")
            else:
                rec["holds"].append("a bot's merge joins the Honors id and its base")
        have = (live_cur.get(h) or {}).get("honors_of")
        if have and (h not in STEP1_IDS or have != b):
            rec["holds"].append(f"the Honors id already carries honors_of {have}")
        elif have:
            rec["notes"].append("step 1's row stands (applied 2026-11-14, honors-s653@bot); step 2 writes no row here")
        for i, side in ((h, "Honors id"), (b, "base")):
            p = person(i)
            if p:
                fields = sorted(k for k in (live_cur.get(i) or {}) if k not in ho_LEDGER)
                rec["notes"].append(f"a person saved {', '.join(fields)} on the {side}: the row overrides nothing"
                                    + (" and the mint carries it to the H id" if side == "Honors id" else ""))
        pm = sorted(k for k, v in merge_into.items() if v in (h, b) and person(k))
        if pm:
            rec["notes"].append(f"a person merged other courses into the pair's ids, and none joins the pair: {len(pm)}")
            rec["person_merges_in"] = pm
        if len(bases_of[h]) > 1:
            share = Counter({bb: pairs[(h, bb)] for bb in bases_of[h]})
            top, n_top = share.most_common(1)[0]
            rec["modal_base"] = {"id": top, "course_pairs": n_top, "of": sum(share.values())}
        tg = ((promotions.get(h) or {}).get("official_targets") or {})
        if any(t.split(":", 1)[-1] == b for t in tg):
            rec["notes"].append("kb/promotions.json names the base among the Honors id's official targets: held, then "
                                "released by the generator's Phase B guard (#3313, decision 4)")
        if rec["holds"]:
            rec["action"] = "held"
        elif bs == "M-ID" and rec.get("fold_into"):
            rec["action"] = "row, fold after the mint"
        elif bs == "M-ID":
            rec["action"] = "row and mint"
        else:
            rec["action"] = "row only (official base)"
        out.append(rec)
    # A follower folds into its lead's H id: when the lead is held, no H id is minted, and the follower holds too.
    act = {(p["honors_id"], p["base_id"]): p for p in out}
    for p in out:
        if p.get("fold_lead") and p["action"] != "held":
            lead = act.get((p["fold_lead"], p["base_id"]))
            if not lead or lead["action"] != "row and mint":
                p["holds"].append(f"the lead {p['fold_lead']} is held, so no H id is minted for this base")
                p["action"] = "held"
    mints = Counter(p["proposed_h_id"] for p in out if p["action"] == "row and mint")
    dup = [k for k, v in mints.items() if v > 1]
    if dup:
        raise SystemExit(f"ABORT: two mints name one H id: {dup}")
    return out


def hold_class(hold):
    return re.sub(r"[A-Z]{2,6} [A-Z]?\w*\d\w*", "<id>", hold).split(":")[0].split(" (")[0]


def summarize(plan, live_cur=None):
    s = {"pairs": len(plan), "by_action": dict(Counter(p["action"].split(":")[0] for p in plan).most_common()),
         "by_systems": dict(Counter(f"{p['honors_system']} Honors, {p['base_system']} base" for p in plan).most_common()),
         "holds_by_reason": {}}
    s["by_signals"] = dict(Counter(" and ".join(p["found_by"]) for p in plan).most_common())
    s["by_signals_m_id_honors"] = dict(Counter(" and ".join(p["found_by"]) for p in plan
                                               if p["honors_system"] == "M-ID").most_common())
    reasons = Counter()
    for p in plan:
        for h in p["holds"]:
            reasons[hold_class(h)] += 1
    s["holds_by_reason"] = dict(reasons.most_common())
    s["held_pairs_by_first_reason"] = dict(Counter(hold_class(p["holds"][0]) for p in plan if p["holds"]).most_common())
    s["notes_by_reason"] = dict(Counter(re.sub(r"[A-Z]{2,6} [A-Z]?\w*\d\w*", "<id>", n).split(":")[0]
                                        for p in plan for n in p["notes"]).most_common())
    s["pairs_held"] = sum(1 for p in plan if p["holds"])
    s["rows_to_write"] = sum(1 for p in plan if p["action"].startswith("row"))
    s["mints"] = sum(1 for p in plan if p["action"] == "row and mint")
    s["folds_after_the_mint"] = sum(1 for p in plan if p["action"] == "row, fold after the mint")
    named = {i for p in plan if p["action"].startswith("row") for i in (p["honors_id"], p["base_id"])}
    if live_cur is not None:
        pm = [k for k, v in live_cur.items() if v.get("merge_into") in named and v.get("reviewed_by")
              and not ho.is_bot(v["reviewed_by"])]
        s["person_merges_into_a_planned_id"] = {
            "measure": "overlay entries (kb/coci_curation.json, the live-equivalent fold) whose merge_into names an id "
                       "of a planned row and whose reviewed_by is not a bot",
            "rows": len(pm),
            "joining_a_planned_pair": sum(1 for p in plan if any("a person's merge joins" in h for h in p["holds"])),
        }
    return s


def write_md(doc, path):
    s, rep = doc["summary"], doc["reproduction"]
    nr = doc.get("narrow") or {}
    L = ["# The Honors pairs: `honors_of` rows and base-plus-H mints, dry run (S653, redrawn S654)", "",
         f"Written by `kb/_honors_of_s653_dryrun.py` at {doc['written']}. Nothing was applied. Design: "
         "`docs/reference/honors_of_design.md`. Every pair, with its counts and holds, is in `plan.json` beside this file.", "",
         "## The count, reproduced", "",
         f"`measure_honors` (kb/_reclustering_s648_dryrun.py), on the committed members file (generated "
         f"{rep['committed']['members_generated_at']}): **{rep['committed']['pairs']} pairs** "
         f"({rep['committed']['course_rows']} Honors courses apart from their base). The committed payload carries "
         "#3304's delete and step 1's two rows since the 2026-11-14 20:27Z daily run, so the plan reads it as it "
         "stands, the same payload `--check` re-measures.", "",
         "## The narrow rule", "",
         "A pair gets a row and a mint only when all four tests pass; held is the default, until the base is split "
         "(`d-honors-narrow-positive-rule-s654`, after #3315's third review). (a) The second derivation finds the "
         "pair by number, and the matcher finds it too. (b) The base holds one title group. (c) No college gives the "
         "base two course numbers. (d) The sequence marks of every raw title on both sides agree, read before "
         "`strip_honors`. An official base (C-ID, CCN) is one record by its body's definition, so (b) and (c) read "
         "only an M-ID base, and (d) reads the base courses the pair names. Held outright as well: the 17 bases "
         "review three named in findings 1 and 2, two Honors ids with different courses on one official base "
         "(finding 5), and a base holding a CCN-coded course (finding 6).", "",
         f"- the M-ID Honors pairs on an M-ID base that both derivations find: {nr.get('both_found', '?')}; the four "
         f"tests pass on {nr.get('pass', '?')}; by test (a pair can fail several): {nr.get('fails', {})}",
         f"- the review's named bases held: {nr.get('named_held', '?')} of {len(REVIEW3_BASES)}, "
         f"{nr.get('named_held_by_rule', '?')} by the four tests alone"]
    rc = doc.get("recall") or {}
    if rc:
        lab = rc["labels"]
        L += ["", "## Two signals, and the self-recall measures", "",
              "A pair gets a row only where two derivations that share no code both find it: the matcher "
              "(`kb/_reclustering_s648_dryrun.py` `measure_honors`) and the second derivation "
              "(`kb/_honors_pairs_second.py`, from course numbers and titles directly). A pair one alone finds is "
              "held and says which. `kb/_honors_matcher_recall.py` measures each against hand labels "
              f"({lab['real']} real pairs, {lab['not_real']} not real; {rc['measure']}):", ""]
        for k, name in (("matcher", "the matcher"), ("second", "the second derivation"), ("both", "both (the rows)")):
            r = rc[k]
            L.append(f"- {name}: {r['pairs']} pairs; right {r['right']}, wrong {r['wrong']}, missed {r['missed']}, "
                     f"held out {r['held_out']}; {r['unlabeled_found']} found carry no label"
                     + (f"; missed {', '.join('`' + a + '` with `' + b + '`' for a, b in r['missed_pairs'])}"
                        if r["missed_pairs"] else ""))
        L += [f"- the course-title test (`one_course`), {len(rc['titles']['pairs'])} labeled title pairs: right "
              f"{rc['titles']['right']}, wrong {rc['titles']['wrong']} ("
              + "; ".join(f"{x['a']} / {x['b']}" for x in rc["titles"]["pairs"] if not x["pass"]) + ")",
              "- the narrow rule (`narrow_reasons`, without the named lists), against hand labels from review three's "
              f"findings 1 and 2 and plain one-course bases: must hold {rc['narrow']['positives']['labels']}, right "
              f"{rc['narrow']['positives']['right']}, wrong {rc['narrow']['positives']['wrong']}"
              + (f" ({', '.join(rc['narrow']['positives']['wrong_pairs'])})" if rc['narrow']['positives']['wrong'] else "")
              + f"; must pair {rc['narrow']['negatives']['labels']}, right {rc['narrow']['negatives']['right']}, wrong "
              f"{rc['narrow']['negatives']['wrong']}"
              + (f" ({', '.join(rc['narrow']['negatives']['wrong_pairs'])})" if rc['narrow']['negatives']['wrong'] else "")]
    pm = s.get("person_merges_into_a_planned_id") or {}
    L += ["", "## The plan", "",
          f"- pairs: {s['pairs']}",
          f"- by action: {s['by_action']}",
          f"- by systems: {s['by_systems']}",
          f"- by signals (a row needs both): {s['by_signals']}; M-ID Honors side only: {s['by_signals_m_id_honors']}",
          f"- rows to write (no hold): {s['rows_to_write']}, of which mints (base plus H): {s['mints']}, "
          f"folds after the mint: {s['folds_after_the_mint']}; step 1 writes "
          f"{sum(1 for p in doc['pairs'] if p['action'].startswith('row') and p['honors_id'] in STEP1_IDS)} of them "
          f"and step 2 the rest",
          f"- held pairs by first reason: {s['held_pairs_by_first_reason']}",
          f"- holds by reason (a pair can carry several): {s['holds_by_reason']}",
          (f"- person merges into a planned id ({pm['measure']}): {pm['rows']}; pairs a person's merge joins: "
           f"{pm['joining_a_planned_pair']}. Only a join holds a pair (Rule 10); the rest proceed." if pm else ""),
          f"- the rows' digest: md5 `{doc.get('rows_md5')}` over the step-2 rows, `course_id>value` joined by `|` in "
          "C order; the migration refuses unless what it inserts has the same digest",
          f"- the plan's class digest: md5 `{doc.get('plan_md5')}` over every pair's `honors_id>base_id>action>proposed "
          "H id>fold_into`, so a mint or fold class that goes stale refuses `--check` too", "",
          "**The fan-in order.** One H id per base (decision 3). The Honors M-ID with the most local courses takes "
          "it at the mint, by a one-to-one alias map. Each other single-base Honors M-ID on that base keeps its own "
          "`honors_of` row under its own id and merges into the H id after the mint, its own change. The mint never "
          "moves two ids onto one key, so no `(course_id, field)` slot is written twice. A follower whose Honors "
          "titles name a different course from the lead's is held: the fold would join distinct courses.", "",
          "Measures: *local courses* = rows in `unified_courses_members.js`; *folded identities* = the row's "
          "`members` in `unified_courses_data.js` or `unified_courses_standalone.js`.", "",
          "### Held pairs, by first reason", ""]
    held = defaultdict(list)
    for p in doc["pairs"]:
        if p["holds"]:
            held[hold_class(p["holds"][0])].append(p)
    for k in sorted(held, key=lambda x: (-len(held[x]), x)):
        L.append(f"- **{k}** ({len(held[k])}): " + ", ".join(f"`{p['honors_id']}` with `{p['base_id']}`" for p in held[k]))
    L += ["", "### Two examples per class", ""]
    by = defaultdict(list)
    for p in doc["pairs"]:
        key = p["action"].split(":")[0] if not p["holds"] else "held: " + p["holds"][0].split(":")[0].split(" (")[0]
        by[re.sub(r"[A-Z]{2,6} [A-Z]?\w*\d\w*", "<id>", key)].append(p)
    for k in sorted(by):
        L.append(f"- **{k}** ({len(by[k])}):")
        for p in by[k][:2]:
            L.append(f"  - `{p['honors_id']}` ({p['honors']['local_courses']} local courses, {p['honors']['folded_identities']} "
                     f"folded identities) with base `{p['base_id']}` ({p['base']['local_courses']} local courses, "
                     f"{p['base']['folded_identities']} folded identities); proposed `{p['proposed_h_id']}`; "
                     f"courses {p['courses'][:2]}")
    L += ["", "## What a person does", "",
          "Nothing here is applied. The rows migration (`kb/migrations/2026-11-14_s653_honors_of_rows.sql`) is "
          "drafted and not listed in `kb/migrations/.apply`. On the apply day, after the last daily run: merge "
          "`origin/main`, run `python3 kb/_honors_of_s653_dryrun.py --check` (it reads the newest plan folder), and "
          "commit the `check_receipt.json` it writes with the `.apply` line. The runner refuses the file without a "
          "receipt whose SQL and payload digests match the checkout.", ""]
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(L))


STEP1_IDS = ("HUMA M10ME", "LIBR M10CJ")   # their rows land in step 1 (2026-11-14_s653_honors_of_field.sql)
ROWS_SQL = os.path.join(HERE, "migrations", "2026-11-14_s653_honors_of_rows.sql")
ROWS_RB = os.path.join(HERE, "migrations", "2026-11-14_s653_honors_of_rows_rollback.sql")


def q(s):
    return "'" + str(s).replace("'", "''") + "'"


def step2_rows(doc):
    """The step-2 rows: every unheld pair's honors_of, less step 1's two, sorted by key (C order)."""
    return sorted((p["honors_id"], p["base_id"]) for p in doc["pairs"]
                  if p["action"].startswith("row") and p["honors_id"] not in STEP1_IDS)


def rows_md5(rows):
    """The digest the migration computes over what it inserts: md5 of course_id>value joined by | in C order."""
    return hashlib.md5("|".join(f"{h}>{b}" for h, b in sorted(rows)).encode("utf-8")).hexdigest()


def plan_md5(pairs):
    """The class digest (#3315's third review: the rows digest covers pairs only, so a mint or fold class could go stale
    unseen): md5 over every pair's honors_id>base_id>action>proposed H id>fold_into, joined by | in C order."""
    keys = sorted(f"{p['honors_id']}>{p['base_id']}>{p['action']}>{p.get('proposed_h_id') or ''}>"
                  f"{p.get('fold_into') or ''}" for p in pairs)
    return hashlib.md5("|".join(keys).encode("utf-8")).hexdigest()


def plan_dir(date=None):
    """The plan folder: --date's, or the newest dated folder holding a plan.json (never today's date: a check run the
    day after the plan reads the plan it was drawn as; #3315's third review, finding 8)."""
    base = os.path.join(HERE, "honors_of_s653_out")
    if date:
        return os.path.join(base, date)
    dated = sorted(n for n in os.listdir(base) if re.fullmatch(r"\d{4}-\d{2}-\d{2}", n)
                   and os.path.exists(os.path.join(base, n, "plan.json")))
    if not dated:
        raise SystemExit(f"no plan folder under {os.path.relpath(base, ROOT)}: run --plan")
    return os.path.join(base, dated[-1])


# What the plan reads: the receipt names each file's sha256, and the runner refuses when one has moved since.
PAYLOAD = ("unified_courses_members.js", "unified_courses_member_desc.js", "unified_courses_index.js",
           "unified_courses_data.js", "unified_courses_standalone.js", "kb/coci_curation.json",
           "kb/coci_minted_courses.json", "kb/coci_minted_singletons.json", "kb/promotions.json", "kb/alias_chain.py")
RECEIPT = "check_receipt.json"


def sha256_of(path):
    with open(path, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()


def write_rows_sql(doc, write=True):
    """Step 2's migration and rollback, drafted from plan.json: one insert-only statement under one guard."""
    rows = step2_rows(doc)
    digest = rows_md5(rows)
    plan_rel = f"kb/honors_of_s653_out/{doc['date']}/plan.json"
    receipt_rel = f"kb/honors_of_s653_out/{doc['date']}/{RECEIPT}"
    pm = (doc.get("summary") or {}).get("person_merges_into_a_planned_id") or {}
    vals = ",\n    ".join(f"({q(h)}, {q(b)})" for h, b in rows)
    s1 = ", ".join(q(i) for i in STEP1_IDS)
    head = [
        "-- DRAFT, NOT IN kb/migrations/.apply. Step 2 of the Honors build: the honors_of rows for every pair the plan",
        f"-- writes ({len(rows)} rows; {plan_rel}, written {doc['written']}; rows md5 {digest}, class md5",
        f"-- {doc.get('plan_md5')}).",
        "-- Design: docs/reference/honors_of_design.md. Ruling: Sam, Sheet 197 card 3 (14:37Z 2026-11-14): \"Build the field",
        "-- first, then the rows\"; \"Rows for all 508 pairs\". THE NARROW RULE (S654, d-honors-narrow-positive-rule-s654,",
        "-- after #3315's third review): a pair gets a row only where the second derivation finds it by number and the",
        "-- matcher finds it too, the base holds one title group, no college gives the base two course numbers, and the",
        "-- raw sequence marks agree; held is the default, and held pairs get no row (plan.md lists them by reason).",
        "-- Written by kb/_honors_of_s653_dryrun.py from the committed plan. Lands after step 1 (applied 2026-11-14).",
        "-- ON THE APPLY DAY, after the last daily run, merge origin/main and run",
        "-- `python3 kb/_honors_of_s653_dryrun.py --check` (it reads the newest plan folder): it re-measures the pairs and",
        "-- classes on the day's payload, refuses unless they give these rows and classes exactly, and writes the receipt",
        "-- named on the next line. scripts/supabase_migrate.py refuses this file unless that receipt exists and names",
        "-- this file's sha256 and the checkout's payload digests. That is where liveness is checked; this statement",
        "-- reads only kb_curation and cannot see the live id set.",
        f"-- requires-check-receipt: {receipt_rel}",
        f"-- Insert-only under its own cohort, {COHORT_ROWS}, ON CONFLICT DO NOTHING (Rule 10). One plain statement: the",
        "-- insert hangs on one guard CTE, and a failed guard raises, so nothing is written. The guard refuses when:",
        f"--   * step 1's two honors_of rows ({COHORT}) are not both present, or any other honors_of row exists;",
        "--   * any id a row names carries a merge_into row: it was merged away, or merged into its partner, after the",
        "--     plan (this covers every join of a pair, so no chain walk is needed). A person's merge of a third course",
        "--     into either side does not refuse: it agrees with the pair standing apart (#3315's first review, item 1;",
        f"--     {pm.get('rows', '?')} such rows when this plan was drawn, the overlay's count);",
        "--   * a unified_title_merge_confirm row names any id a row names: a curator's pending merge (Rule 10 a);",
        "--   * a kb_curation row is keyed on an H id: the step-4 mint has landed;",
        "--   * what it inserts differs from the plan in count or digest.",
        f"-- The result is a count and an md5 ({digest}) over the inserted rows, course_id>value joined by | in C order, so",
        "-- the runner's receipt (scripts/supabase_migrate.py keeps the first 4,000 characters) holds the whole record and",
        "-- checks against plan.json. No row image is returned: the insert-only cohort rolls back by its reviewer_email.",
        "-- Rollback: 2026-11-14_s653_honors_of_rows_rollback.sql, keyed on the cohort and the field, never on ids; it",
        "-- refuses after the step-4 mint until the mint's own rollback has run.",
        "",
    ]
    body = f"""with planned (course_id, value) as (
  values
    {vals}
),
named (id) as (
  select course_id from planned union select value from planned
),
step1 as (
  select count(*) as n from public.kb_curation s
  where s.field = 'honors_of' and s.reviewer_email = '{COHORT}' and s.course_id in ({s1})
),
other_honors as (
  select count(*) as n from public.kb_curation o
  where o.field = 'honors_of' and not (o.reviewer_email = '{COHORT}' and o.course_id in ({s1}))
),
moved as (
  select count(*) as n from public.kb_curation m where m.field = 'merge_into' and m.course_id in (select id from named)
),
confirm as (
  select count(*) as n from public.kb_curation c
  where c.field = 'unified_title_merge_confirm'
    and (c.course_id in (select id from named) or c.value in (select id from named))
),
minted as (
  select count(*) as n from public.kb_curation h where h.course_id ~ '{H_ID_SQL}'
),
guard as (
  select (select n from step1) = 2 and (select n from other_honors) = 0 and (select n from moved) = 0
     and (select n from confirm) = 0 and (select n from minted) = 0 as ok,
     (select n from step1) as step1_rows, (select n from other_honors) as other_honors_rows,
     (select n from moved) as merged_ids, (select n from confirm) as pending_confirms,
     (select n from minted) as h_id_rows
),
added as (
  insert into public.kb_curation as k (course_id, field, value, reviewer_email)
  select p.course_id, 'honors_of', p.value, '{COHORT_ROWS}'
  from guard g cross join planned p
  where g.ok
  on conflict (course_id, field) do nothing
  returning k.course_id, k.value
),
digest as (
  select count(*) as n,
         md5(coalesce(string_agg(a.course_id || '>' || a.value, '|' order by a.course_id collate "C"), '')) as md5
  from added a
)
select case when g.ok and d.n = {len(rows)} and d.md5 = '{digest}'
            then jsonb_build_object('inserted', d.n, 'md5', d.md5, 'cohort', '{COHORT_ROWS}')
            else ('refused by the guard: step 1 rows ' || g.step1_rows
                  || ', other honors_of rows ' || g.other_honors_rows || ', named ids merged ' || g.merged_ids
                  || ', pending merge confirms ' || g.pending_confirms || ', rows keyed on an H id ' || g.h_id_rows
                  || ', inserted ' || d.n || ' of {len(rows)} with digest ' || d.md5)::int::text::jsonb
       end as changed
from guard g cross join digest d;

-- Read back: expect {len(rows)} honors_of rows under {COHORT_ROWS} and 2 under {COHORT}.
--   select reviewer_email, count(*) from public.kb_curation where field = 'honors_of' group by 1;
"""
    sql = "\n".join(head) + body
    rb = "\n".join([
        "-- DRAFT. Rollback for 2026-11-14_s653_honors_of_rows.sql: the step-2 cohort's rows go, keyed on the cohort",
        f"-- ({COHORT_ROWS}) and the field, never on ids (#3315's first review, item 2). One plain statement on one",
        "-- guard, which raises and changes nothing while any kb_curation row is keyed on an H id: the step-4 mint has",
        "-- landed, and a minted H id would lose its honors_of row while its pair hold stands on the field (COBIx on",
        "-- #3315, 18:15Z and 18:47Z). Run the mint's own rollback first; then this. Step 1's rows are another cohort and",
        "-- stay (their own rollback removes them, and refuses while a removable row of this cohort stands). A row a",
        "-- person re-saved carries the person's reviewer and is never touched; a row a person validated (the Verify",
        "-- control stamps every row of a course) stays, counted as kept_for_a_person, and blocks no other rollback.",
        "-- The result is the count and an md5 over the deleted rows (course_id>value, | joined, C order). They equal the",
        f"-- forward result ({len(rows)}, {digest}) while no person has re-saved or validated a row; a difference names",
        "-- rows a person now owns.",
        "with minted as (",
        f"  select count(*) as n from public.kb_curation h where h.course_id ~ '{H_ID_SQL}'",
        "),",
        "kept as (",
        "  select count(*) as n from public.kb_curation k",
        f"  where k.reviewer_email = '{COHORT_ROWS}' and k.field = 'honors_of'",
        "    and not (k.validated_by is null or k.validated_by like '%@bot')",
        "),",
        "guard as (",
        "  select (select n from minted) = 0 as ok, (select n from minted) as h_id_rows",
        "),",
        "removed as (",
        "  delete from public.kb_curation k",
        "  using guard g",
        f"  where g.ok and k.reviewer_email = '{COHORT_ROWS}' and k.field = 'honors_of'",
        "    and (k.validated_by is null or k.validated_by like '%@bot')",
        "  returning k.course_id, k.value",
        ")",
        "select case when g.ok",
        "            then (select jsonb_build_object('deleted', count(*), 'kept_for_a_person', (select n from kept), 'md5',",
        "                    md5(coalesce(string_agg(r.course_id || '>' || r.value, '|' order by r.course_id collate \"C\"),",
        "                                 ''))) from removed r)",
        "            else ('refused by the guard: ' || g.h_id_rows || ' kb_curation rows are keyed on an H id, so the step-4'",
        "                  || ' mint has landed; run its rollback first')::int::text::jsonb",
        "       end as undone",
        "from guard g;",
        f"-- Read back: expect 0 rows under {COHORT_ROWS}, apart from any a person validated.",
        ""])
    if not write:
        return sql, rb
    for path, text in ((ROWS_SQL, sql), (ROWS_RB, rb)):
        with open(path, "w", encoding="utf-8") as f:
            f.write(text)
    return len(rows)


def check_plan(doc, root=ROOT, sql_only=False, fresh=True, overlay=None, receipt=True):
    """Refuse a stale plan, on the apply day after the last daily run: the checkout must contain origin/main's head;
    the committed SQL must be what the plan writes; no alias map may have landed after the plan; and the pairs and
    classes, re-measured from the checkout's payload, must give the plan's step-2 rows and classes (both digests).
    This is where liveness is checked: the SQL cannot see the live id set. On a pass it writes check_receipt.json beside
    the plan, which scripts/supabase_migrate.py requires (COBIx on #3315, 18:47Z). CI runs the SQL half alone
    (--check-sql), since the payload moves daily. root, fresh, overlay and receipt are for the tests."""
    problems = []
    sql, rb = write_rows_sql(doc, write=False)
    for path, text in ((ROWS_SQL, sql), (ROWS_RB, rb)):
        if not os.path.exists(path) or open(path, encoding="utf-8").read() != text:
            problems.append(f"{os.path.relpath(path, ROOT)} differs from what the plan writes (run --sql-only)")
    if rows_md5(step2_rows(doc)) != doc.get("rows_md5"):
        problems.append("plan.json's rows_md5 is not the digest of its rows")
    if plan_md5(doc["pairs"]) != doc.get("plan_md5"):
        problems.append("plan.json's plan_md5 is not the digest of its classes")
    if sql_only:
        if problems:
            raise SystemExit("STALE: " + "; ".join(problems))
        print(f"SQL current: {doc['step2_rows']} step-2 rows, digest {doc['rows_md5']}, classes {doc['plan_md5']}")
        return 0
    if doc.get("alias_era") != alias_chain.ALIAS_MAPS[-1]:
        problems.append(f"an alias map landed after the plan ({doc.get('alias_era')} -> {alias_chain.ALIAS_MAPS[-1]}): "
                        "redraw it")
    head = None
    if fresh:
        fp, head = freshness(root)
        problems += fp
    # The re-measure (#3315's review): the pairs and classes, recomputed from the checkout's payload and overlay,
    # must give the reviewed plan's step-2 rows and classes exactly. A pair the daily re-cluster dissolved, a base
    # re-minted, an id merged away or a new hold all change a digest.
    cur = jload(overlay or os.path.join(HERE, "coci_curation.json"))["curations"]
    stale_overlay = [r["course_id"] for r in S652_DELETED
                     if (cur.get(r["course_id"]) or {}).get(r["field"]) == r["value"]]
    if stale_overlay:
        problems.append(f"the checkout's overlay still carries the rows #3304 deleted ({', '.join(stale_overlay)}): "
                        "it predates the delete's sync; wait for the next daily run and merge origin/main")
    else:
        import _honors_pairs_second as second
        w = Shim(root)
        _, _, rows, _ = s648.measure_honors(w)
        redrawn = plan_pairs(w, rows, root, cur, second.derive(w.members))
        now = step2_rows({"pairs": redrawn})
        if rows_md5(now) != doc.get("rows_md5"):
            was = set(step2_rows(doc))
            problems.append(f"the re-measure on the checkout's payload gives {len(now)} step-2 rows, digest "
                            f"{rows_md5(now)}, not the plan's {doc['step2_rows']} ({doc['rows_md5']}): added "
                            f"{sorted(set(now) - was)[:6]}, gone {sorted(was - set(now))[:6]}; redraw the plan")
        elif plan_md5(redrawn) != doc.get("plan_md5"):
            was = {(p["honors_id"], p["base_id"]): p["action"] for p in doc["pairs"]}
            moved = sorted(f"{p['honors_id']} with {p['base_id']}: {was.get((p['honors_id'], p['base_id']))} -> "
                           f"{p['action']}" for p in redrawn
                           if was.get((p["honors_id"], p["base_id"])) != p["action"])
            problems.append(f"the re-measure gives the plan's rows but not its classes (class md5 {plan_md5(redrawn)}, "
                            f"not {doc['plan_md5']}): {moved[:6]}; redraw the plan")
    if problems:
        raise SystemExit("STALE: " + "; ".join(problems))
    out = {"what": "kb/_honors_of_s653_dryrun.py --check passed: the plan re-measured on this checkout's payload",
           "written": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
           "plan": f"kb/honors_of_s653_out/{doc['date']}/plan.json", "rows_md5": doc["rows_md5"],
           "plan_md5": doc["plan_md5"], "step2_rows": doc["step2_rows"], "origin_main_head": head,
           "sql": os.path.relpath(ROWS_SQL, ROOT), "sql_sha256": sha256_of(ROWS_SQL),
           "payload": {p: sha256_of(os.path.join(root, p)) for p in PAYLOAD}}
    if receipt:
        path = os.path.join(HERE, "honors_of_s653_out", doc["date"], RECEIPT)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(out, f, indent=1)
            f.write("\n")
        print(f"wrote {os.path.relpath(path, ROOT)}: commit it with the .apply line")
    print(f"plan current: re-measured on the checkout's payload, {doc['step2_rows']} step-2 rows, digest "
          f"{doc['rows_md5']}, classes {doc['plan_md5']}, era {doc['alias_era']}")
    return out


def freshness(root=ROOT):
    """([problems], origin/main's head): the checkout must contain origin/main's head (the daily run commits the
    payload there, never to this branch)."""
    try:
        head = subprocess.run(["git", "-C", root, "ls-remote", "origin", "refs/heads/main"], capture_output=True,
                              text=True, timeout=60).stdout.split()
        if not head:
            return ["could not read origin/main's head (git ls-remote): run --check where origin is reachable"], None
        ok = subprocess.run(["git", "-C", root, "merge-base", "--is-ancestor", head[0], "HEAD"],
                            capture_output=True).returncode == 0
    except (OSError, subprocess.SubprocessError) as e:
        return [f"could not test the checkout's freshness: {e}"], None
    return ([] if ok else [f"the checkout does not contain origin/main's head {head[0][:8]}: fetch and merge "
                           "origin/main, then run --check again"]), head[0]


def freshness_problems(root=ROOT):
    return freshness(root)[0]


def narrow_summary(plan):
    """The narrow rule's own counts, over the M-ID Honors pairs on an M-ID base that both derivations find."""
    both = [p for p in plan if p["honors_system"] == "M-ID" and p["base_system"] == "M-ID" and len(p["found_by"]) == 2]
    fails = Counter(x[:3] for p in both for x in p.get("narrow") or [])
    named = [p for p in plan if p["base_id"] in REVIEW3_BASES]
    return {"measure": "M-ID Honors pairs on an M-ID base that both derivations find (identity pairs on "
                       "unified_courses_members.js); a test fails when narrow_reasons names it",
            "both_found": len(both), "pass": sum(1 for p in both if not p.get("narrow")),
            "fails": dict(sorted(fails.items())),
            "named_bases_in_plan": len({p["base_id"] for p in named}),
            "named_held": len({p["base_id"] for p in named if p["action"] == "held"}),
            "named_held_by_rule": len({p["base_id"] for p in named if p.get("narrow")})}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--plan", action="store_true", help="draw the plan on the committed payload, and its SQL")
    ap.add_argument("--date", help="the plan folder's date (default: the newest; --plan writes today's)")
    ap.add_argument("--sql-only", action="store_true",
                    help="draft step 2's migration and rollback from the plan.json; no re-measure")
    ap.add_argument("--check", action="store_true",
                    help="the apply-day check, after the last daily run: refuse unless the checkout contains "
                         "origin/main, the SQL is the plan's, and a re-measure on the day's payload gives its rows "
                         "and classes; on a pass, write check_receipt.json")
    ap.add_argument("--check-sql", action="store_true", help="the SQL half of --check alone (CI)")
    a = ap.parse_args()
    if a.sql_only or a.check or a.check_sql:
        doc = jload(os.path.join(plan_dir(a.date), "plan.json"))
        if a.check or a.check_sql:
            check_plan(doc, sql_only=a.check_sql)
            return 0
        print(f"drafted {write_rows_sql(doc)} rows: {os.path.relpath(ROWS_SQL, ROOT)}, {os.path.relpath(ROWS_RB, ROOT)}")
        return 0
    if not a.plan:
        raise SystemExit("pass --plan, --sql-only, --check or --check-sql")
    date = a.date or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    w = Shim(ROOT)
    _, _, rows, _ = s648.measure_honors(w)
    pc = pairs_of(rows)
    rep = {"committed": {"members_generated_at": w.generated_at, "pairs": len(pc), "course_rows": sum(pc.values())},
           "how": "kb/_reclustering_s648_dryrun.measure_honors on the committed members file; a pair is an (Honors "
                  "identity, base identity) whose Honors course and base course at one college sit in different "
                  "identities"}
    cur = jload(os.path.join(HERE, "coci_curation.json"))["curations"]
    if any((cur.get(r["course_id"]) or {}).get(r["field"]) == r["value"] for r in S652_DELETED):
        raise SystemExit("ABORT: the committed overlay predates #3304's delete; the plan reads the payload as it stands")
    import _honors_pairs_second as second
    plan = plan_pairs(w, rows, ROOT, cur, second.derive(w.members))
    import _honors_matcher_recall as recall
    rc = recall.measure(w.members, ROOT)
    if rc["both"]["wrong"] or not all(f["pass"] for f in rc["fixtures"]):
        raise SystemExit("ABORT: a self-recall measure fails: " + json.dumps({
            "both_wrong": rc["both"]["wrong_pairs"], "fixtures": [f["name"] for f in rc["fixtures"] if not f["pass"]]}))
    held_named = {p["base_id"] for p in plan if p["base_id"] in REVIEW3_BASES and p["action"] != "held"}
    if held_named:
        raise SystemExit(f"ABORT: a base #3315's third review named is not held: {sorted(held_named)}")
    doc = {"_about": "Dry run of the honors_of rows and base-plus-H mints. Nothing applied. Design: "
                     "docs/reference/honors_of_design.md.",
           "written": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "date": date,
           "cohort": COHORT, "cohort_rows": COHORT_ROWS, "alias_era": alias_chain.ALIAS_MAPS[-1],
           "reproduction": rep, "narrow": narrow_summary(plan),
           "recall": {k: v for k, v in rc.items() if k != "fixtures"},
           "summary": summarize(plan, cur), "pairs": plan}
    doc["rows_md5"] = rows_md5(step2_rows(doc))
    doc["step2_rows"] = len(step2_rows(doc))
    doc["plan_md5"] = plan_md5(plan)
    od = os.path.join(HERE, "honors_of_s653_out", date)
    os.makedirs(od, exist_ok=True)
    with open(os.path.join(od, "plan.json"), "w", encoding="utf-8") as f:
        json.dump(doc, f, indent=1, ensure_ascii=False)
        f.write("\n")
    write_md(doc, os.path.join(od, "plan.md"))
    write_rows_sql(doc)
    print(json.dumps({"reproduction": rep["committed"], "narrow": doc["narrow"], "summary": {
        k: doc["summary"][k] for k in ("pairs", "by_action", "rows_to_write", "mints", "folds_after_the_mint",
                                       "pairs_held", "held_pairs_by_first_reason")},
        "step2_rows": doc["step2_rows"], "rows_md5": doc["rows_md5"], "plan_md5": doc["plan_md5"]}, indent=1))
    return 0


if __name__ == "__main__":
    sys.exit(main())
