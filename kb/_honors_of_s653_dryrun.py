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
  2. Plans each Honors M-ID on its ANCHORS (S654, `d-honors-anchored-rows-s654`, after #3315's fourth review): the
     same-college course pairs kb/_honors_anchors.py finds, its rules 1 to 3 deciding the row and the mint. Each row
     carries its anchors, so a later split of either cluster can rewire it. The cluster tests (one title group, two
     numbers, sequence marks, lump_reasons) decide nothing: a base they flag is a split candidate in the report. The
     matcher and the second derivation stay as report signals and name a second base for the mint's clause.
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
import _honors_anchors as anchors_mod  # noqa: E402

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


# ── The cluster tests, report columns only (S654) ─────────────────────────────────────────────────────────
# Since the anchored rows (`d-honors-anchored-rows-s654`) these hold and release nothing: a base they flag is a
# split candidate for the re-clustering lane (split_flags). The rows rest on anchors (kb/_honors_anchors.py).
CCN_CODE = anchors_mod.CCN_CODE
H_ID_SQL = r"^[A-Z]{1,6} [MZ][0-9][A-Z0-9]{3}H$"   # the mint's marker: a kb_curation row keyed on an H id
STRICT_STOP = {"and", "of", "the", "a", "an", "in", "for", "on"}
PART_WORDS = {"one": "1", "two": "2", "three": "3", "four": "4", "first": "1", "second": "2", "third": "3"}


def strict_words(title):
    """A title's words for the one-group test: lower case, '&' read as 'and', 'U.S.' as 'united states', '+' and '#'
    kept (C, C++ and C# are three courses), 'with' kept (Astronomy Lab beside Astronomy with Lab is two), sequence
    marks dropped (they are compared apart, in sequence_marks), a trailing s dropped from a word of four letters or
    more."""
    t = re.split(r"\bformerly\b", anchors_mod.clean(title), maxsplit=1, flags=re.I)[0]
    t = s648.HONORS_WORD.sub(" ", t).lower().replace("&", " and ")
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
    raw = anchors_mod.clean(title)
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


def split_flags(w, h, b):
    """The cluster tests, as report columns only (S654, anchored rows): a base or an Honors id they flag is a SPLIT
    CANDIDATE for the re-clustering lane. They hold and release nothing."""
    base = [m for m in (w.members.get(b) or []) if not anchors_mod.honors_word(m["title"])]
    hon = [m for m in (w.members.get(h) or []) if anchors_mod.honors_word(m["title"])]
    out = []
    if base and not one_title_group([anchors_mod.clean(m["title"]) for m in base]):
        out.append("the base holds more than one title group")
    if two_numbers(base):
        out.append("a college gives the base two course numbers: " + ", ".join(two_numbers(base)[:3]))
    if len({sequence_marks(anchors_mod.clean(m["title"])) for m in base + hon}) > 1:
        out.append("the sequence marks differ across the base and the Honors side")
    if hon and not one_title_group([s648.strip_honors(anchors_mod.clean(m["title"])) for m in hon]):
        out.append("the Honors id holds more than one Honors title group")
    return out


def plan_pairs(w, rows, out_dir, live_cur, second):
    """The anchored plan (S654, `d-honors-anchored-rows-s654`): one record per Honors M-ID with an anchor, keyed on
    its anchored base, plus every pair the matcher or the second derivation finds without an anchor (action none).
    Rules 1 to 3 live in kb/_honors_anchors.py; the safety holds below (pending alias maps, merges slated or decided,
    a person's join, an id already carrying another honors_of, a CCN Honors record beside the base) stay."""
    first = pairs_of(rows)
    folded = folded_identities(out_dir)
    index = set(cmp.load_index(out_dir))
    live_ids = index | set(w.members) | set(w.cat) | set(w.sg)
    promotions = jload(os.path.join(HERE, "promotions.json"))["promotions"]
    merge_into = {k: v["merge_into"] for k, v in live_cur.items() if isinstance(v, dict) and v.get("merge_into")}
    pending, _ = alias_chain.pending_maps(None, baseline_through=alias_chain.ALIAS_MAPS[-1])
    pmaps = alias_chain.load_maps(pending)

    def system(i):
        s = w.id_system(i)
        return "M-ID" if s.startswith("M-ID") else s

    def person(i):
        rb = (live_cur.get(i) or {}).get("reviewed_by")
        return rb if rb and not ho.is_bot(rb) else None

    an = anchors_mod.anchors(w.members)
    by_x = defaultdict(list)
    for a in an:
        by_x[a["honors_id"]].append(a)
    into = defaultdict(set)
    for x, xa in by_x.items():
        if system(x) == "M-ID":
            for a in xa:
                if a["kind"] == "anchor" and a["base_id"] != x:
                    into[a["base_id"]].add(x)
    named_by = defaultdict(set)
    for (h, b) in set(first) | set(second):
        named_by[h].add(b)
    ccn_h_partner = defaultdict(set)
    for (h, b) in set(first) | set(second):
        if system(h) == "CCN-ID" and h.endswith("H"):
            ccn_h_partner[b].add(h)

    out, seen = [], set()
    for x in sorted(by_x):
        xa = sorted(by_x[x], key=lambda a: (a["base_id"], a["college"], a["honors_code"]))
        hs = system(x)
        if hs != "M-ID":
            for b in sorted({a["base_id"] for a in xa} - {x}):   # an official record holding both is one record
                seen.add((x, b))
                out.append({"honors_id": x, "base_id": b, "honors_system": hs, "base_system": system(b),
                            "action": f"none: the Honors side is a {hs} record, which stays as its body numbers it",
                            "anchors": [a for a in xa if a["base_id"] == b], "holds": [], "no_mint": [], "notes": []})
            continue
        dec = anchors_mod.decide(x, xa, w.members, into, named_by.get(x, ()), lambda i: system(i) != "M-ID")
        b = dec.get("base") or (dec["bases"] or [xa[0]["base_id"]])[0]
        bs = system(b)
        hon = sum(1 for m in (w.members.get(x) or []) if anchors_mod.honors_word(m["title"])
                  or any((m["college"], m["code"]) == (a["college"], a["honors_code"]) for a in xa))
        rec = {"honors_id": x, "base_id": b, "honors_system": hs, "base_system": bs,
               "anchors": [{k: a[k] for k in ("kind", "base_id", "college", "honors_code", "base_code",
                                              "honors_title", "base_title")} for a in xa],
               "anchor_bases": dec["bases"],
               "honors": {"local_courses": len(w.members.get(x) or []), "honors_courses": hon,
                          "folded_identities": folded.get(x)},
               "base": {"local_courses": len(w.members.get(b) or []), "folded_identities": folded.get(b)},
               "proposed_h_id": ho.honors_id_for(b) if bs == "M-ID" else None,
               "found_by": sorted((["the matcher"] if (x, b) in first else [])
                                  + (["the second derivation"] if (x, b) in second else [])),
               "holds": list(dec["holds"]), "no_mint": list(dec["no_mint"]), "notes": [],
               "split_candidate": split_flags(w, x, b), "report_lump": lump_reasons(w, x, b) if bs == "M-ID" else []}
        for bb in dec["bases"]:
            seen.add((x, bb))
        seen.add((x, b))
        for i in (x, b):   # the mostly-not-Honors hold lives in kb/_honors_anchors.py decide (rule 2)
            if i not in live_ids:
                raise SystemExit(f"ABORT: {i} (anchored {x} to {b}) is not in the live id set")
            if alias_chain.resolve_id(i, pmaps) != i:
                rec["holds"].append(f"{i} moves under a pending alias map")
        for i, side in ((b, "base"), (x, "Honors id")):
            if i in merge_into:
                rec["holds"].append(f"the {side} {i} is slated to merge into {merge_into[i]}")
            if i in DECIDED_MERGES:
                rec["holds"].append(f"the {side} {i} is DECIDED to merge into {DECIDED_MERGES[i]}")
        edges = joining_edges(merge_into, x, b)
        if edges:
            by = sorted({live_cur[e].get("reviewed_by") or "?" for e in edges})
            rec["holds"].append("a person's merge joins the Honors id and its base: Rule 10, the person's row wins"
                                if any(not ho.is_bot(y) for y in by) else "a bot's merge joins the Honors id and its base")
        have = (live_cur.get(x) or {}).get("honors_of")
        if have and have != b:
            rec["holds"].append(f"the Honors id already carries honors_of {have}")
        elif have:
            rec["notes"].append("the honors_of row stands" + (" (step 1, applied 2026-11-14)" if x in STEP1_IDS else ""))
        if ccn_h_partner.get(b):
            rec["holds"].append(f"the CCN Honors record {', '.join(sorted(ccn_h_partner[b]))} already pairs with a "
                                f"course in {b}: this M-ID's Honors courses belong beside it")
        if bs == "CCN-ID" and b + "H" in live_ids:
            rec["holds"].append(f"the CCN record {b}H already holds Honors courses beside {b}")
        if rec["proposed_h_id"] and rec["proposed_h_id"] in live_ids and rec["proposed_h_id"] != x:
            rec["no_mint"].append(f"the proposed id {rec['proposed_h_id']} already exists")
        md = sorted(k for k, v in live_cur.items() if isinstance(v, dict) and v.get("merge_dismissed")
                    and {x, b} <= set(str(v["merge_dismissed"]).split("|")))
        if md:
            rec["notes"].append(f"a Keep as-is ({', '.join(md)}) names both ids: it agrees with the pair standing apart")
        pm = sorted(k for k, v in merge_into.items() if v in (x, b) and person(k))
        if pm:
            rec["person_merges_in"] = pm
        tg = ((promotions.get(x) or {}).get("official_targets") or {})
        if any(t.split(":", 1)[-1] == b for t in tg):
            rec["notes"].append("kb/promotions.json names the base among the Honors id's official targets")
        if rec["holds"]:
            rec["action"] = "held"
        elif bs != "M-ID":
            rec["action"] = "row only (official base)"
        elif not rec["no_mint"]:
            rec["action"] = "row and mint"
        else:
            rec["action"] = "row, mint held"
        out.append(rec)
    for (h, b) in sorted((set(first) | set(second)) - seen):
        out.append({"honors_id": h, "base_id": b, "honors_system": system(h), "base_system": system(b),
                    "action": "none: no anchor" if system(h) == "M-ID" else
                    f"none: the Honors side is a {system(h)} record, which stays as its body numbers it",
                    "anchors": [], "holds": [], "no_mint": [], "notes": [],
                    "found_by": sorted((["the matcher"] if (h, b) in first else [])
                                       + (["the second derivation"] if (h, b) in second else []))})
    mints = Counter(p["proposed_h_id"] for p in out if p["action"] == "row and mint")
    dup = [k for k, v in mints.items() if v > 1]
    if dup:
        raise SystemExit(f"ABORT: two mints name one H id: {dup}")
    return out


def hold_class(hold):
    return re.sub(r"[A-Z]{2,6} [A-Z]?\w*\d\w*", "<id>", hold).split(":")[0].split(" (")[0]


def summarize(plan, live_cur=None):
    s = {"pairs": len(plan), "by_action": dict(Counter(p["action"].split(":")[0] for p in plan).most_common()),
         "by_systems": dict(Counter(f"{p['honors_system']} Honors, {p['base_system']} base" for p in plan).most_common())}
    an = [a for p in plan if p["honors_system"] == "M-ID" for a in p.get("anchors") or []]
    s["anchors"] = {"measure": "same-college course pairs (kb/_honors_anchors.py rule 1) on unified_courses_members.js "
                               "whose Honors course sits in an M-ID, counted once per Honors course and base course",
                    "anchor": sum(1 for a in an if a["kind"] == "anchor"),
                    "doubtful": sum(1 for a in an if a["kind"] == "doubtful"),
                    "on_rows": sum(len(p["anchors"]) for p in plan if p["action"].startswith("row"))}
    reasons = Counter(hold_class(h) for p in plan for h in p["holds"])
    s["holds_by_reason"] = dict(reasons.most_common())
    s["held_pairs_by_first_reason"] = dict(Counter(hold_class(p["holds"][0]) for p in plan if p["holds"]).most_common())
    s["mint_held_by_reason"] = dict(Counter(hold_class(h) for p in plan if p["action"] == "row, mint held"
                                            for h in p["no_mint"]).most_common())
    s["pairs_held"] = sum(1 for p in plan if p["action"] == "held")
    s["rows_to_write"] = sum(1 for p in plan if p["action"].startswith("row"))
    s["mints"] = sum(1 for p in plan if p["action"] == "row and mint")
    s["split_candidates"] = sorted({p["base_id"] for p in plan if p["action"].startswith("row") and
                                    p.get("split_candidate")})
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


def _anchor_line(a):
    return (f"{a['college']}: {a['honors_code']} \"{a['honors_title']}\" beside {a['base_code']} "
            f"\"{a['base_title']}\"" + ("" if a["kind"] == "anchor" else " (doubtful)"))


def write_md(doc, path):
    s, rep = doc["summary"], doc["reproduction"]
    L = ["# The Honors pairs: `honors_of` rows on anchors, dry run (S653, redrawn S654)", "",
         f"Written by `kb/_honors_of_s653_dryrun.py` at {doc['written']}. Nothing was applied. Design: "
         "`docs/reference/honors_of_design.md`. Every pair, with its anchors, counts and holds, is in `plan.json`.", "",
         "## The count, reproduced", "",
         f"`measure_honors` (kb/_reclustering_s648_dryrun.py), on the committed members file (generated "
         f"{rep['committed']['members_generated_at']}): **{rep['committed']['pairs']} pairs** "
         f"({rep['committed']['course_rows']} Honors courses apart from their base). The plan reads the committed "
         "payload as it stands, the same payload `--check` re-measures.", "",
         "## Rows rest on anchors", "",
         "An anchor is two courses at one college: an Honors course and the base course whose code names the same "
         "subject and number once the Honors marker is struck, with a second signal at the course level (an Honors "
         "word in the title, or equal titles). An Honors M-ID gets a row to its base when every anchor lands in that "
         "base; anchors in two bases, or a doubtful anchor (an Honors number pair whose titles disagree), hold it. A "
         "mint also needs every member course anchored, one Honors M-ID per base, no CCN-coded course in the base, "
         "and no second base named by another derivation (`kb/_honors_anchors.py`; `d-honors-anchored-rows-s654`).", "",
         "A row on an impure base is the base's own impurity, not this plan's fault. The anchors say where the row "
         "goes when the base is split, so the re-clustering lane can rewire it mechanically.", "",
         f"- anchors ({s['anchors']['measure']}): {s['anchors']['anchor']}, and {s['anchors']['doubtful']} doubtful; "
         f"{s['anchors']['on_rows']} carry the rows",
         f"- split candidates (bases of a row that a cluster test flags; report only): {len(s['split_candidates'])}"]
    rc = doc.get("recall") or {}
    if rc:
        L += ["", "## The self-recall measures", "",
              f"Hand labels in `kb/_honors_matcher_recall.py` ({rc['measure']}):", ""]
        for k, name in (("matcher", "the matcher"), ("second", "the second derivation")):
            r = rc[k]
            L.append(f"- {name}: {r['pairs']} pairs; right {r['right']}, wrong {r['wrong']}, missed {r['missed']}, "
                     f"held out {r['held_out']}")
        a, c = rc["anchors"], rc["clusters"]
        L += [f"- anchors (rule 1), {a['labels']} course pairs written by hand: right {a['right']}, wrong {a['wrong']}",
              f"- clusters (rules 2 and 3), {c['labels']} Honors ids with an expected class: right {c['right']}, wrong "
              f"{c['wrong']}",
              f"- mutation: each of {len(rc['mutation'])} clauses dropped in turn; a label fails for "
              f"{sum(1 for m in rc['mutation'] if m['caught'])}"
              + "".join(f"; uncaught: {m['clause']}" for m in rc["mutation"] if not m["caught"])]
    pm = s.get("person_merges_into_a_planned_id") or {}
    L += ["", "## The plan", "",
          f"- pairs: {s['pairs']}",
          f"- by action: {s['by_action']}",
          f"- by systems: {s['by_systems']}",
          f"- rows to write: {s['rows_to_write']}, of which mints (base plus H): {s['mints']}; step 1 wrote "
          f"{sum(1 for p in doc['pairs'] if p['action'].startswith('row') and p['honors_id'] in STEP1_IDS)} of them "
          "and step 2 writes the rest",
          f"- held by first reason: {s['held_pairs_by_first_reason']}",
          f"- rows whose mint is held, by reason: {s['mint_held_by_reason']}",
          (f"- person merges into a planned id ({pm['measure']}): {pm['rows']}; pairs a person's merge joins: "
           f"{pm['joining_a_planned_pair']}" if pm else ""),
          f"- the rows' digest: md5 `{doc.get('rows_md5')}` over the step-2 rows, `course_id>value` joined by `|` in "
          "C order; the migration refuses unless what it inserts has the same digest",
          f"- the plan's class digest: md5 `{doc.get('plan_md5')}` over every pair's class and its anchors, so a "
          "class or an anchor that moves refuses `--check`", "",
          "Measures: *local courses* = rows in `unified_courses_members.js`.", "",
          "## Every row and its anchors", ""]
    for p in doc["pairs"]:
        if p["action"].startswith("row"):
            L.append(f"- `{p['honors_id']}` to `{p['base_id']}` ({p['action']}"
                     + (f"; proposed `{p['proposed_h_id']}`" if p["action"] == "row and mint" else "")
                     + (f"; split candidate: {'; '.join(p['split_candidate'])}" if p.get("split_candidate") else "")
                     + "): " + " | ".join(_anchor_line(a) for a in p["anchors"]))
    L += ["", "## Held, with the reason and the anchors", ""]
    for p in doc["pairs"]:
        if p["action"] == "held":
            L.append(f"- `{p['honors_id']}` to `{p['base_id']}`: {p['holds'][0]}. "
                     + " | ".join(_anchor_line(a) for a in p["anchors"][:4]))
    L += ["", "## Before the mints (step 4)", "",
          "- HLTH M10ZH mints HLTH M1134H beside C-ID PHS 102, which holds five courses and one Honors course "
          "(Cypress PHS 281HC). PHS 102 is a plain C-ID, not an Honors record, so counting it would hold a mint on a "
          "non-Honors id; the question is step 4's, as a base split or merge, and no step-2 row is affected "
          "(#3315's anchors review).",
          "- Step 4's own rollback (the inverse alias map) is written and proved before the mint: the step-1 and step-2 "
          "rollbacks refuse while any row is keyed on an H id, and the Postgres proof's mint cases use a synthetic "
          "inverse today.",
          "", "## Split candidates for the re-clustering lane", "",
          ", ".join(f"`{b}`" for b in s["split_candidates"]), "",
          "## What a person does", "",
          "Nothing here is applied. The rows migration (`kb/migrations/2026-11-14_s653_honors_of_rows.sql`) is "
          "drafted and not listed in `kb/migrations/.apply`. On the apply day, after the last daily run: merge "
          "`origin/main`, run `python3 kb/_honors_of_s653_dryrun.py --check` (it reads the newest plan folder), and "
          "commit the `check_receipt.json` it writes with the `.apply` line. The runner refuses the file without a "
          "receipt whose SQL, payload and main head match.", ""]
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
    """The class digest (#3315's third and fourth reviews): md5 over every pair's honors_id>base_id>action>proposed H
    id and each of its anchors (college, Honors code, base code, kind), joined by | in C order. A class or an anchor
    that moves changes it."""
    keys = sorted(f"{p['honors_id']}>{p['base_id']}>{p['action']}>{p.get('proposed_h_id') or ''}>"
                  + ";".join(sorted(f"{a['college']}/{a['honors_code']}/{a['base_code']}/{a['kind']}"
                                    for a in p.get("anchors") or []))
                  for p in pairs)
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
        "-- first, then the rows\"; \"Rows for all 508 pairs\". ANCHORED ROWS (S654, d-honors-anchored-rows-s654, after",
        "-- #3315's fourth review): a row rests on same-college course pairs, an Honors course and its base course with",
        "-- one subject and number (kb/_honors_anchors.py); every anchor of the Honors M-ID must land in the one base.",
        "-- plan.md lists every row's anchors, and the held pairs by reason.",
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
    rc = recall.measure(w.members, ROOT, plan)
    if (rc["anchors"]["wrong"] or rc["clusters"]["wrong"] or not all(m["caught"] for m in rc["mutation"])
            or not all(f["pass"] for f in rc["fixtures"]) or not all(x["pass"] for x in rc["label_resolution"])):
        raise SystemExit("ABORT: a self-recall measure fails: " + json.dumps({
            "anchors": rc["anchors"]["wrong_labels"], "clusters": rc["clusters"]["wrong_labels"],
            "mutation": [m["clause"] for m in rc["mutation"] if not m["caught"]],
            "fixtures": [f["name"] for f in rc["fixtures"] if not f["pass"]],
            "label_resolution": [x["name"] for x in rc["label_resolution"] if not x["pass"]]}))
    doc = {"_about": "Dry run of the honors_of rows and base-plus-H mints. Nothing applied. Design: "
                     "docs/reference/honors_of_design.md.",
           "written": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "date": date,
           "cohort": COHORT, "cohort_rows": COHORT_ROWS, "alias_era": alias_chain.ALIAS_MAPS[-1],
           "reproduction": rep,
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
    print(json.dumps({"reproduction": rep["committed"], "summary": {
        k: doc["summary"][k] for k in ("pairs", "by_action", "anchors", "rows_to_write", "mints", "pairs_held",
                                       "held_pairs_by_first_reason", "mint_held_by_reason")},
        "step2_rows": doc["step2_rows"], "rows_md5": doc["rows_md5"], "plan_md5": doc["plan_md5"]}, indent=1))
    return 0


if __name__ == "__main__":
    sys.exit(main())
