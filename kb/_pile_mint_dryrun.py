#!/usr/bin/env python3
"""The Needs an M-ID pile: plan the mint of new M-IDs, DRY RUN ONLY (Rule 7). Version 2, after the second reader.

Sam, 2026-11-20 (r-mids-first-then-course-exhibit-titles-sam-2026-11-20): "as we get commons re-established through
this process, my priority will be the mids so i can then finish the exhibit titles for course-based exhibits that rely
on cid/ccn/mid (ccrs)". Sam, 2026-09-03, card 12: "everything that isn't a CID or CCN is a MID".

The Courses List's Needs an M-ID pile is the local courses with no M-ID, no C-ID and no CCN, less the courses
kb/coci_not_applicable.json keeps out of every count (kb/_closest_mid.py defines it). This tool plans the M-IDs they
would get and reports what it would do. It reads committed files only, writes kb/pile_mint_out/<date>_v2/plan.json and
prints a summary. It writes no identity file and no table: kb/_pile_mint_apply.py recomputes this plan and lands it.

THE WAVE. The pile less, each counted and listed: (a) courses kb/coci_closest_mid.json files at the Strong or
Possible level (a person or a second-stage check settles those first); (b) special-topics and selected-topics titles
(their content changes each term); (c) a control number that names more than one course in the state list; (d) a
course a `CN:` row in kb/coci_curation.json already re-homes. A course is counted under the first of (a) to (d) that
holds for it.

THE SUBJ4. Every route is measured on the identity-holding courses (a control number that names one course and sits
in an M-ID's members), each course left out of its own measure, and decides only where it is right at least 98% of
the time on that measure. The TOP code is read nowhere.
  (r)   A ruled kind (RULED_KINDS: a shell kind a decision placed, with its slug and grounds) mints its bare title
        under the ruled SUBJ4, one common course per (title, band) statewide; a title naming more than the kind is
        held and listed by class. The first: d-tutoring-under-lskl-2026-11-21, Supervised Tutoring and Tutoring
        under LSKL. It is no measured route, so it decides before (s).
  (s)   A generic-shell title (the seed's STOP_PATTERNS: practicum, tutoring, seminar, work experience...) or a
        code-only title takes the identity file's own convention for its kind and credit band: the SUBJ4 the
        identity-holding courses of that kind carry. The measure leaves out the course's whole college, so a kind
        that one college's courses hold has no convention. A kind whose convention is right 98% of the time over 10
        or more courses mints under that SUBJ4, one common course per (title, band) statewide, never one per local
        subject. Any other shell title is held, named by its kind. No route below reads a shell title.
  (i)   The subject map, through the seed's discipline_for_modal and canonical_subj_token, decides only on a subject
        code whose identity-holding courses it reads right at least 98% of the time, with 10 or more of them (the
        second reader's floor: route (i) was right for 87.3% of courses overall and for none of the shell titles).
        Below the floor the course is held.
  (ii)  Where the map is silent, the SUBJ4 the same college's ordinary-title courses under the same local subject code
        carry in the identity file;
  (iii) where that is silent, the SUBJ4 the same local subject code carries statewide (codes of three characters or
        more only). Routes (ii) and (iii) take the support and share floors their self-recall test sets.
  Otherwise the course is held, with the reason.
  (p)   A PERSON'S DECISION (#3655; r-subject-save-path-kb-curation-sam-2026-11-22: a person's save wins over the
        catalog, the subject map and any recommendation). Where a person saved a common subject code for the course's
        college and local code (kb/status/subject_decisions.json, read through kb/subject_decisions.py for_course),
        a credit course takes that code as its SUBJ4 ahead of routes (i), (ii) and (iii), and a shell title with no
        convention takes it in place of the hold. A noncredit or noncredit enhanced course never takes a credit
        decision (r-noncredit-disciplines-separate-in-mqs-sam-2026-11-21). A ruled kind and an accepted convention
        stand: each names the course's title kind, which a decision about the local subject does not. A statewide
        filing in the Local subjects List decides no M-ID (kb/subject_decisions.py). The plan lists every course a
        decision placed with its key and what the machine routes would have done (`decided`): released from a hold,
        or placed under another SUBJ4, or the same.

GROUPING. Wave courses sharing (folded title, SUBJ4, band) are one common course: two or more make a catalog record
with a memberships entry, one makes a stand-alone record. The fold drops punctuation, case and spacing alone; a roman
or arabic numeral is a level and never folds, and the plan lists the pairs a numeral keeps apart. A group whose courses
all sit at one college is flagged one_college. Band 9 for Noncredit and Noncredit Enhanced, else 1. Units never split
a group. A group that would duplicate an M-ID the identity files already hold (same folded title, SUBJ4 and band) is
held for Assign with that M-ID.

THE RECORDS carry `discipline_source: "pile_mint"` and the route in `pile_mint_route`, so kb/_infer_disciplines.py
leaves them as written, the auditor scores them as a session's mint no person confirmed, and the title bags read them
only when their title is no shell (`pile_mint_shell`).

IDS. `SUBJ4 M<band><seq>`: a catalog record takes the lowest free corroborated number, a stand-alone record the lowest
free stand-alone code. The allocator is kb/_zband_retire_dryrun.py Buckets over every id ever minted (the three
identity files, the identity file's keys, curation keys and merge_into values, identities, common courses, every alias
map's old and new side), every `new_id` a staged plan under kb/overmerge_out/ names, the ids a rollback of this mint
returned (kb/pile_mint_reserved.json), and the CCN and C-ID reservations.

Usage (from repo root):  python3 kb/_pile_mint_dryrun.py [--date YYYY-MM-DD] [--out DIR] [--closest]
  --closest also writes closest_measure.json beside the plan: each held course ranked by kb/_closest_mid.py against
  the identity file with the planned records added.
"""
from __future__ import annotations

import argparse
import glob
import json
import os
import re
import sys
from collections import Counter, defaultdict
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import _closest_mid as cm  # noqa: E402  (load_js, the pile's definition, the ranker)
import _seed_coci_minted_mids as seed  # noqa: E402  (STOP_PATTERNS, CODE_RE, ntitle, discipline_for_modal, ...)
import _zband_retire_dryrun as zdry  # noqa: E402  (Buckets, the id shapes, canonical_codes, reservations)
import _uc_cur_promote as promote  # noqa: E402  (reserved_alias_ids: every alias map's old and new side)
import _top_gate as top_gate  # noqa: E402  (is_top_sourced)
import _subj4_dryrun as s4dry  # noqa: E402  (add_reserved_ids: the shared reservation loader's rule)
import subject_decisions as sdec  # noqa: E402  (a person's saved subject decisions: for_course, slugs_by_college)

OUT_DIR = os.environ.get("PILE_MINT_OUT") or os.path.join(HERE, "pile_mint_out")
PLAN_TAG = "_v3"
RESERVED_IDS = ("*", "ids")  # kb/_subj4_dryrun.py RESERVED_IDS: the full ids a rolled-back mint returned
DISCIPLINE_SOURCE = "pile_mint"
RESERVED_FILE = "pile_mint_reserved.json"
STAGED_PLANS = ("overmerge_out/*/alias_map.json",)
IDENTITY_FILES = ("coci_minted_courses.json", "coci_minted_memberships.json", "coci_minted_singletons.json")
TOPICS_RE = re.compile(r"\b(special|selected|spec|sel)\s+topic")
NUMERAL_RE = re.compile(r"^(?:\d+[a-z]?|i|ii|iii|iv|v|vi|vii|viii|ix|x|xi|xii)$")
SHELL_PATTERNS = [(p, re.compile(p)) for p in seed.STOP_PATTERNS]
CODE_ONLY = "code-only title"
NONCREDIT_CHARS = ("N", "E")
CREDIT_WORDS = {"C": "Credit", "N": "Noncredit", "E": "Noncredit Enhanced"}
ACCURACY_FLOOR = 0.98
MIN_HOLDERS = 10          # route (i)'s per-code floor and a shell convention's floor (the second reader's finding 1)
SUPPORT_GRID = (1, 2, 3, 4, 5, 7, 10, 15, 20, 30, 50, 100, 200)
SHARE_GRID = (0.5, 0.6, 0.67, 0.75, 0.8, 0.85, 0.9, 0.95, 1.0)
SUPPORT_BUCKETS = ((1, 1), (2, 2), (3, 4), (5, 9), (10, 19), (20, 49), (50, 99), (100, 10 ** 9))
SHARE_BUCKETS = ((0.0, 0.6), (0.6, 0.8), (0.8, 0.9), (0.9, 1.0), (1.0, 1.01))
ROUTE_SOURCE = {"r": "ruled_kind", "s": "shell_convention", "p": "person_decision", "i": "subject_map",
                "ii": "college_subject_code", "iii": "statewide_subject_code"}
# Ruled kinds: a shell kind a person or the conductor ruled onto a SUBJ4, kept apart from the measured conventions.
# Only the bare title mints ("Supervised Tutoring", "Tutoring", in any punctuation and case); a title that names
# more than the kind ("Supervised Tutoring in Mathematics", "Tutoring Methods") is held and listed by class.
RULED_KINDS = [{
    "ruling": "d-tutoring-under-lskl-2026-11-21",
    "decided_by": "the S695 conductor, Sam's to revise",
    "kinds": ["supervised tutoring", "tutoring"],
    "bare": r"^(?:supervised )?tutoring$",
    "subj4": "LSKL", "discipline": "Learning Assistance or Learning Skills",
    "grounds": ("The MQ handbook's discipline 'Learning Assistance or Learning Skills Coordinators/Instructors, and "
                "Tutoring Coordinators'; kb/discipline_canonical_subj4.json gives 'Learning Assistance or Learning "
                "Skills' the Common SUBJ LSKL (curator_override)."),
}]
RULED_BY_KIND = {k: r for r in RULED_KINDS for k in r["kinds"]}
TUTOR_PREP_RE = re.compile(r"\b(train|method|technique|theory|introduction|intro|fundamental|preparation|prep|"
                           r"material|effective|principle|practicum|peer|leadership)")


def ruled_title_class(title):
    """Why a ruled kind's title is held: it names a subject beside the kind, it prepares tutors, or something else."""
    nt = seed.ntitle(title)
    if TUTOR_PREP_RE.search(nt):
        return "prepares tutors (training, methods, peer tutoring)"
    if re.match(r"^supervised tutoring\b", nt) or re.search(r"\btutoring (in|for|of)\b", nt) or nt.endswith(" tutoring"):
        return "names a subject or center beside the kind"
    return "other"
CLASSIFIED_BY = ("kb/_pile_mint_dryrun.py: the Needs an M-ID pile minted as M-IDs (Sam, 2026-11-20: the M-IDs "
                 "first; Sam, 2026-09-03: everything that is not a C-ID or CCN is an M-ID)")
SUBJ_SHORT = seed.SHORT_CODE_MAX


def _load(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def is_m_id(k):
    return bool(zdry.M_CORR_RE.match(k) or zdry.M_STAND_RE.match(k))


def band_of(credit_char):
    return "9" if credit_char in NONCREDIT_CHARS else "1"


def plan_dir(today):
    return today + PLAN_TAG


# ── titles ─────────────────────────────────────────────────────────────────
def shell_pattern(title):
    """The seed's STOP_PATTERNS entry a title matches first (in the list's order), CODE_ONLY for a title that is only
    a course code, else None (an ordinary title)."""
    nt = seed.ntitle(title)
    for p, rx in SHELL_PATTERNS:
        if rx.search(nt):
            return p
    if seed.CODE_RE.match(nt):
        return CODE_ONLY
    return None


def shell_kind(title):
    p = shell_pattern(title)
    return "ordinary" if p is None else (p if p == CODE_ONLY else "generic shell: " + p)


def fold_key(title):
    """Two titles fold when they differ by punctuation, case or spacing alone. A numeral token (arabic, or a roman
    numeral to xii) is a level: the key keeps the numerals apart, so `Algebra I` and `Algebra 1` never fold."""
    toks = seed.ntitle(title).split()
    return "".join(toks) + "|" + " ".join(t for t in toks if NUMERAL_RE.match(t))


def numeral_base(title):
    return "".join(t for t in seed.ntitle(title).split() if not NUMERAL_RE.match(t))


# ── the pile (kb/_closest_mid.py's definition) ─────────────────────────────
def lookup_courses(L):
    """The Courses List rows as kb/_closest_mid.py reads them, plus the credit character (column 6). The TOP column
    (7) is never read here; kb/_pile_mint_apply.py stamps it after the plan is fixed."""
    colleges = [str(c or "").strip() for c in L["colleges"]]
    return [{"college": colleges[r[0]], "ctrl": str(r[1] or ""), "subj": str(r[2] or ""), "num": str(r[3] or ""),
             "title": str(r[4] or ""), "units": r[5] if isinstance(r[5], (int, float)) else None,
             "credit": str(r[6] or ""), "cid": r[8], "ccn": r[9]} for r in L["rows"]]


def holders(members):
    """control number -> the identity file's ids that list it (kb/_closest_mid.py by_cn)."""
    by_cn = defaultdict(list)
    for mid, rows in members.items():
        for r in rows:
            if r.get("cn"):
                by_cn[r["cn"]].append(mid)
    return by_cn


def pile_of(courses, by_cn, na):
    """kb/_closest_mid.py main(), "The pile": no M-ID, no C-ID, no CCN, and not kept out of the counts. The module
    keeps the predicate inline (no helper to import), so it is mirrored here in one line and cross-checked against
    kb/coci_closest_mid.json's own count whenever both read the same identity file."""
    return [c for c in courses if c["ctrl"] not in by_cn and not c["cid"] and not c["ccn"]
            and (c["college"] + "|" + c["ctrl"]) not in na]


# ── the identity-holding courses ───────────────────────────────────────────
def own_mid(mids, members):
    """The M-ID a holder's SUBJ4 is read from: its largest common course, by id on a tie."""
    ms = sorted((m for m in mids if is_m_id(m) and zdry.SUBJ4_RE.match(m.split(" ")[0])),
                key=lambda m: (-len(members.get(m) or []), m))
    return ms[0] if ms else None


def own_subj4(mids, members):
    m = own_mid(mids, members)
    return m.split(" ")[0] if m else None


def vote_tables(holding):
    """holding: [(college, nsubj, subj4)] -> (by (college, nsubj), by nsubj) Counters."""
    col, state = defaultdict(Counter), defaultdict(Counter)
    for college, ns, s4 in holding:
        col[(college, ns)][s4] += 1
        if len(ns) > SUBJ_SHORT:
            state[ns][s4] += 1
    return col, state


def winner(counter, leave_out=None):
    """(subj4, support, share) or None. A tie at the top is no answer."""
    c = Counter(counter)
    if leave_out:
        c[leave_out] -= 1
        if c[leave_out] <= 0:
            del c[leave_out]
    n = sum(c.values())
    if not n:
        return None
    top = sorted(c.items(), key=lambda kv: (-kv[1], kv[0]))
    if len(top) > 1 and top[0][1] == top[1][1]:
        return ("", n, top[0][1] / n)  # a tie: support counted, no answer
    return (top[0][0], n, top[0][1] / n)


def _support_bucket(v):
    for lo, hi in SUPPORT_BUCKETS:
        if lo <= v <= hi:
            return f"{lo}+" if hi >= 10 ** 9 else (str(lo) if lo == hi else f"{lo}-{hi}")
    return "?"


def _share_bucket(v):
    for lo, hi in SHARE_BUCKETS:
        if lo <= v < hi:
            return "1.00" if lo == 1.0 else f"{lo:.2f}-{hi:.2f}"
    return "?"


def self_recall(holding, col, state, silent_ns):
    """Predict every ordinary-title identity-holding course's SUBJ4 by route (ii) and by route (iii), the course left
    out of the vote. Returns {route: {"cells": [...], "obs": [(support, share, right, map_silent)]}}."""
    out = {}
    for route, table, keyf in (("ii", col, lambda c, ns: (c, ns)), ("iii", state, lambda c, ns: ns)):
        obs = []
        for college, ns, s4 in holding:
            if route == "iii" and len(ns) <= SUBJ_SHORT:
                continue
            w = winner(table.get(keyf(college, ns), {}), leave_out=s4)
            if not w:
                continue
            obs.append((w[1], round(w[2], 4), w[0] == s4, ns in silent_ns))
        cells = Counter()
        for sup, sh, right, _ in obs:
            cells[(_support_bucket(sup), _share_bucket(sh), right)] += 1
        order = {b: i for i, b in enumerate([_support_bucket(lo) for lo, _ in SUPPORT_BUCKETS])}
        keys = sorted({(a, b) for a, b, _ in cells}, key=lambda k: (order.get(k[0], 99), k[1]))
        out[route] = {"obs": obs, "cells": [{"support": a, "share": b, "right": cells[(a, b, True)],
                                             "wrong": cells[(a, b, False)]} for a, b in keys]}
    return out


def choose_thresholds(obs):
    """The (support floor, share floor) with the most predictions among those right at least 98% of the time.
    Ties go to the higher floors. None when no pair reaches the floor."""
    best = None
    for smin in SUPPORT_GRID:
        for shmin in SHARE_GRID:
            sel = [r for s, sh, r, _ in obs if s >= smin and sh >= shmin]
            if not sel:
                continue
            acc = sum(sel) / len(sel)
            if acc < ACCURACY_FLOOR:
                continue
            key = (len(sel), smin, shmin)
            if best is None or key > best[0]:
                best = (key, {"support_min": smin, "share_min": shmin, "n": len(sel), "right": sum(sel),
                              "accuracy": round(acc, 4)})
    return best[1] if best else None


def _loo(groups):
    """groups: {unit: Counter(subj4)}. Each unit's courses predicted from every other unit's: (right, wrong). No
    answer (nothing left, or a tie) counts wrong."""
    total = Counter()
    for c in groups.values():
        total.update(c)
    right = wrong = 0
    for c in groups.values():
        rest = Counter({s: v - c.get(s, 0) for s, v in total.items() if v - c.get(s, 0) > 0})
        w = winner(rest)
        for s, k in c.items():
            if w and w[0] == s:
                right += k
            else:
                wrong += k
    return right, wrong


def shell_conventions(holders_list, record_disc, s4_disc):
    """The identity file's convention per (shell kind, band). Each holder's SUBJ4 is predicted from the holders of its
    kind and band at OTHER colleges (leave one college out): a college's own courses are one curriculum decision and
    never its own evidence, and a convention must hold statewide to mint statewide. No answer counts wrong. Accepted
    at MIN_HOLDERS courses and ACCURACY_FLOOR. The course-grain and record-grain leave-one-out are filed beside it for
    the reader. -> {(kind, band): entry}; band "*" rows are the kind across bands, for the record only."""
    units = defaultdict(lambda: {"college": defaultdict(Counter), "record": defaultdict(Counter), "n": 0,
                                 "mids": Counter()})
    for h in holders_list:
        if not h["kind"]:
            continue
        for key in ((h["kind"], h["band"]), (h["kind"], "*")):
            u = units[key]
            u["college"][h["college"]][h["s4"]] += 1
            u["record"][h["mid"]][h["s4"]] += 1
            u["mids"][h["mid"]] += 1
            u["n"] += 1
    out = {}
    for key, u in units.items():
        s4_all = Counter()
        for c in u["college"].values():
            s4_all.update(c)
        right, wrong = _loo(u["college"])
        r_rec, _ = _loo(u["record"])
        r_course = sum(k for s, k in s4_all.items() if (winner(s4_all, leave_out=s) or ("",))[0] == s)
        n = right + wrong
        top = winner(s4_all)
        s4 = top[0] if top and top[0] else None
        acc = right / n if n else 0.0
        discs = Counter(record_disc.get(m) for m in u["mids"] if record_disc.get(m))
        disc = s4_disc.get(s4) or (sorted(discs.items(), key=lambda kv: (-kv[1], kv[0]))[0][0] if discs else None)
        out[key] = {"kind": key[0], "band": key[1], "subj4": s4, "courses": n, "colleges": len(u["college"]),
                    "records": len(u["mids"]), "record_ids": sorted(u["mids"])[:5], "right": right, "wrong": wrong,
                    "accuracy": round(acc, 4),
                    "course_grain_right": r_course, "record_grain_right": r_rec, "discipline": disc,
                    "accepted": bool(key[1] != "*" and s4 and disc and n >= MIN_HOLDERS and acc >= ACCURACY_FLOOR)}
    return out


# ── the SUBJ4 for one course ───────────────────────────────────────────────
def subj4_disciplines(canon_doc, umbrella):
    """SUBJ4 -> its discipline: a discipline's canonical code, an umbrella's split codes. A code two disciplines claim
    names neither."""
    claims = defaultdict(set)
    for d, e in (canon_doc.get("disciplines") or {}).items():
        c = e.get("canonical_subj4")
        if c and zdry.SUBJ4_RE.match(c) and d not in umbrella:
            claims[c].add(d)
    for d, codes in umbrella.items():
        for c in codes:
            claims[c].add(d)
    return {c: next(iter(ds)) for c, ds in claims.items() if len(ds) == 1}


def route_i(subj, disc_map, canon_map, umbrella, fl_subjects, disc_alias=None):
    """(discipline, subj4 or None, note). The seed's own reading of one course's subject code. A discipline the map
    spells by an alias (kb/discipline_aliases.json: "Theater Arts") reads as its canonical name, as
    kb/_uc_cur_promote.py resolves it."""
    disc, note = seed.discipline_for_modal(subj, Counter({subj: 1}), disc_map)
    if not disc:
        return None, None, note
    disc = (disc_alias or {}).get(disc, disc)
    token = seed.canonical_subj_token(disc, seed.mint_token(subj, Counter({subj: 1})), canon_map)
    if disc in umbrella:
        if token not in umbrella[disc]:
            token = fl_subjects.get(seed.normsubj(subj)) if disc == "Foreign Languages" else None
        if token not in umbrella[disc]:
            return disc, None, f"umbrella {disc}: the subject code {subj!r} names none of its split codes"
        return disc, token, None
    if not zdry.SUBJ4_RE.match(token or "") or disc not in canon_map:
        return disc, None, f"the discipline {disc!r} has no four-letter canonical code"
    return disc, token, None


def staged_plan_ids(kb_dir=HERE):
    """Every new_id a staged, not-yet-applied plan names (kb/overmerge_out/<date>/alias_map.json): outside
    kb/alias_chain.py's ALIAS_MAPS, so reserved_alias_ids does not see them (the second reader's finding 6)."""
    ids = set()

    def collect_new_ids(x):
        if isinstance(x, dict):
            for k, v in x.items():
                if k == "new_id" and isinstance(v, str):
                    ids.add(v)
                else:
                    collect_new_ids(v)
        elif isinstance(x, list):
            for v in x:
                collect_new_ids(v)
    for pat in STAGED_PLANS:
        for f in sorted(glob.glob(os.path.join(kb_dir, pat))):
            collect_new_ids(_load(f))
    return ids


def rollback_reserved_ids(kb_dir=HERE):
    """The ids kb/pile_mint_reserved.json holds; the shared loader (kb/_subj4_dryrun.py load_id_reservations) reads
    the same file for every minter."""
    p = os.path.join(kb_dir, RESERVED_FILE)
    return set((_load(p).get("ids") or [])) if os.path.exists(p) else set()


# ── the plan ───────────────────────────────────────────────────────────────
def compute_plan(inp, today):
    """Pure. `inp` holds the loaded files (see load_inputs). Returns the plan dict."""
    courses = inp["courses"]
    members = inp["members"]
    by_cn = holders(members)
    na = inp["na"]
    disc_map, canon_map = inp["disc_map"], inp["canon_map"]
    codes, umbrella = zdry.canonical_codes(inp["canon_doc"], inp["fl_doc"], {})
    fl_subjects = {}
    for v in (inp["fl_doc"].get("languages") or {}).values():
        for s in v.get("subjects") or []:
            fl_subjects[seed.normsubj(s)] = v["subj4"]
    s4_disc = subj4_disciplines(inp["canon_doc"], umbrella)
    disc_alias = {a: name for name, alts in (inp.get("disc_aliases") or {}).items() for a in alts or []}
    ri_cache = {}

    def ri(ns):
        if ns not in ri_cache:
            ri_cache[ns] = route_i(ns, disc_map, canon_map, umbrella, fl_subjects, disc_alias)
        return ri_cache[ns]

    pile = pile_of(courses, by_cn, na)
    ctrl_rows = Counter(c["ctrl"] for c in courses)
    cn_rehomed = {k[3:]: v.get("merge_into") for k, v in inp["curations"].items()
                  if k.startswith("CN:") and isinstance(v, dict)}
    closest = inp["closest"]
    settle_bands = set()
    for lv in (closest.get("measure") or {}).get("levels") or []:
        if lv.get("key") in ("strong", "possible"):
            settle_bands.update(lv.get("bands") or [])
    closest_rows = closest.get("rows") or {}

    # ── the wave ──
    left = defaultdict(list)
    wave = []
    for c in sorted(pile, key=lambda c: (c["college"], c["ctrl"])):
        row = closest_rows.get(c["ctrl"])
        tag = {"college": c["college"], "control_number": c["ctrl"], "title": c["title"]}
        if row and row[1] in settle_bands:
            left["a_strong_or_possible_match"].append(dict(tag, closest=row[2][0][0] if row[2] else None,
                                                           level="strong" if row[1] >= 5 else "possible"))
        elif TOPICS_RE.search(seed.ntitle(c["title"])):
            left["b_special_or_selected_topics"].append(tag)
        elif ctrl_rows[c["ctrl"]] > 1:
            left["c_control_number_names_several_courses"].append(dict(tag, rows=ctrl_rows[c["ctrl"]]))
        elif c["ctrl"] in cn_rehomed:
            left["d_curation_re_homes_it"].append(dict(tag, merge_into=cn_rehomed[c["ctrl"]]))
        else:
            wave.append(c)

    # ── the identity-holding courses ──
    hlist = []
    seen = set()
    for c in courses:
        if c["ctrl"] in seen or ctrl_rows[c["ctrl"]] > 1 or c["ctrl"] not in by_cn:
            continue
        seen.add(c["ctrl"])
        mid = own_mid(by_cn[c["ctrl"]], members)
        if mid:
            hlist.append({"college": c["college"], "ns": seed.normsubj(c["subj"]), "s4": mid.split(" ")[0],
                          "mid": mid, "kind": shell_pattern(c["title"]), "band": band_of(c["credit"])})

    # route (i): its reading of every holder, per subject code (the floor) and per title kind (finding 1)
    code_stats = defaultdict(lambda: [0, 0])
    ri_by_kind = Counter()
    for h in hlist:
        got = ri(h["ns"])[1]
        kind = "ordinary" if h["kind"] is None else "shell"
        if got is None:
            ri_by_kind[(kind, "silent")] += 1
            continue
        code_stats[h["ns"]][0] += 1
        code_stats[h["ns"]][1] += got == h["s4"]
        ri_by_kind[(kind, "right" if got == h["s4"] else "wrong")] += 1

    def at_floor(ns, leave_out_right=None):
        n, r = code_stats.get(ns, (0, 0))
        if leave_out_right is not None:
            n, r = n - 1, r - leave_out_right
        return n >= MIN_HOLDERS and r / n >= ACCURACY_FLOOR

    floor_loo = Counter()
    for h in hlist:
        got = ri(h["ns"])[1]
        if got is None:
            continue
        ok = got == h["s4"]
        floor_loo["answered"] += 1
        floor_loo["answered_right"] += ok
        if at_floor(h["ns"], leave_out_right=ok):
            floor_loo["at_floor"] += 1
            floor_loo["at_floor_right"] += ok
    codes_at_floor = sorted(ns for ns in code_stats if at_floor(ns))

    # (s): the shell conventions
    record_disc = {}
    for doc in (inp["catalog"], inp["singletons"]):
        for mid, r in doc.items():
            # a discipline TOP alone decided never names a convention's discipline (CLAUDE.md Rule 7)
            if isinstance(r, dict) and r.get("discipline") and not top_gate.is_top_sourced(r):
                record_disc[mid] = r["discipline"]
    conventions = shell_conventions(hlist, record_disc, s4_disc)

    # (ii) and (iii): the ordinary-title holders vote
    holding = [(h["college"], h["ns"], h["s4"]) for h in hlist if h["kind"] is None]
    col, state = vote_tables(holding)
    silent_ns = {seed.normsubj(c["subj"]) for c in wave if shell_pattern(c["title"]) is None
                 and ri(seed.normsubj(c["subj"]))[1] is None}
    recall = self_recall(holding, col, state, silent_ns)
    thresholds = {r: choose_thresholds(recall[r]["obs"]) for r in ("ii", "iii")}

    def accept(route, w):
        t = thresholds[route]
        return bool(w and w[0] and t and w[1] >= t["support_min"] and w[2] >= t["share_min"])

    # ── the SUBJ4 for each wave course ──
    held = defaultdict(list)
    placed = []
    route_count = Counter()
    decisions = inp.get("subject_decisions")
    dec_slug = inp.get("decision_slugs") or {}
    decided = []

    def decision_of(c):
        if not decisions:
            return None
        return decisions.for_course(dec_slug.get(sdec.college_key(c["college"])), c["subj"], c["credit"])

    def machine_ordinary(c, ns, tag):
        """Routes (i), (ii), (iii) for an ordinary title: ("placed", s4, route, conf, disc) or ("held", list, row)."""
        disc, s4, note = ri(ns)
        route = "i" if s4 else None
        conf = None
        if s4:
            if not at_floor(ns):
                n, r = code_stats.get(ns, (0, 0))
                return ("held", "route_i_below_its_floor", dict(tag, subj4=s4, holders=n, right=r))
            n, r = code_stats[ns]
            conf = round(r / n, 4)
        else:
            for rt, w in (("ii", winner(col.get((c["college"], ns), {}))),
                          ("iii", winner(state.get(ns, {})) if len(ns) > SUBJ_SHORT else None)):
                if not accept(rt, w):
                    continue
                cand = w[0]
                if disc and (cand not in umbrella.get(disc, set()) and s4_disc.get(cand) != disc):
                    note = f"the subject map reads {disc!r} and route ({rt}) offers {cand}, another discipline's code"
                    continue
                s4, route, conf = cand, rt, thresholds[rt]["accuracy"]
                break
        if not s4:
            return ("held", "no_route_gives_a_subj4", dict(tag, why=note or "no route reaches its floor"))
        return ("placed", s4, route, conf, disc if route == "i" else (disc or s4_disc.get(s4)))

    for c in wave:
        ns = seed.normsubj(c["subj"])
        kind = shell_pattern(c["title"])
        tag = {"college": c["college"], "control_number": c["ctrl"], "title": c["title"], "subject": c["subj"]}
        band = band_of(c["credit"])
        conf = None
        ruling = None
        pd = decision_of(c) if kind not in RULED_BY_KIND else None
        if kind in RULED_BY_KIND:
            rk = RULED_BY_KIND[kind]
            if not re.match(rk["bare"], seed.ntitle(c["title"])):
                held["ruled_kind_title_names_more_than_the_kind"].append(
                    dict(tag, kind=kind, band=band, ruling=rk["ruling"], title_class=ruled_title_class(c["title"])))
                continue
            d = s4_disc.get(rk["subj4"])
            if d != rk["discipline"]:
                held["ruled_kind_subj4_names_another_discipline"].append(dict(tag, kind=kind, subj4=rk["subj4"]))
                continue
            s4, route, ruling = rk["subj4"], "r", rk["ruling"]
        elif kind and not ((conventions.get((kind, band)) or {}).get("accepted")) and pd:
            # a shell title with no convention, under a code a person decided: the decision in place of the hold
            s4, route, d = pd["common_code"], "p", s4_disc.get(pd["common_code"])
            decided.append(dict(tag, key=pd["key"], subj4=s4, moved=pd.get("moved", False),
                                machine="held: shell_title_no_convention"))
        elif kind:
            conv = conventions.get((kind, band))
            if not (conv and conv["accepted"]):
                held["shell_title_no_convention"].append(dict(tag, kind=kind, band=band))
                continue
            if conv["records"] == 1:
                # the convention is one statewide common course (WEXP M1001, the cross-listed Work Experience
                # outline): the course joins it by Assign, never a second record beside it
                held["convention_is_one_common_course_held_for_assign"].append(
                    dict(tag, kind=kind, band=band, assign_to=conv["record_ids"][0]))
                continue
            s4, d, route, conf = conv["subj4"], conv["discipline"], "s", conv["accuracy"]
        else:
            out = machine_ordinary(c, ns, tag)
            if pd:
                # a person's decision wins over routes (i) to (iii); the plan records what they would have done
                s4, route, d = pd["common_code"], "p", s4_disc.get(pd["common_code"])
                machine = ("held: " + out[1]) if out[0] == "held" else (
                    "placed: " + out[1] + " by " + ROUTE_SOURCE[out[2]])
                decided.append(dict(tag, key=pd["key"], subj4=s4, moved=pd.get("moved", False), machine=machine))
            elif out[0] == "held":
                held[out[1]].append(out[2])
                continue
            else:
                _, s4, route, conf, d = out
        if not d:
            held["subj4_names_no_discipline"].append(dict(tag, subj4=s4, route=route))
            continue
        route_count[route] += 1
        placed.append(dict(c, subj4=s4, discipline=d, route=route, band=band, kind=kind, conf=conf,
                           ruling=ruling, fk=fold_key(c["title"]), decision=pd["key"] if route == "p" else None))

    # ── grouping and the duplicate check ──
    existing = defaultdict(list)
    for doc in (inp["catalog"], inp["singletons"]):
        for mid, r in doc.items():
            if not isinstance(r, dict) or not is_m_id(mid):
                continue
            m = zdry.M_CORR_RE.match(mid) or zdry.M_STAND_RE.match(mid)
            # a continuation digit (2 to 8) is a credit bucket that filled (card 11)
            existing[(fold_key(r.get("common_title")), m.group(1), "9" if m.group(2) == "9" else "1")].append(mid)
    groups = defaultdict(list)
    for p in placed:
        groups[(p["fk"], p["subj4"], p["band"])].append(p)
    folded = sorted(({"subj4": k[1], "band": k[2], "titles": sorted({p["title"] for p in g})}
                     for k, g in groups.items() if len({seed.ntitle(p["title"]) for p in g}) > 1),
                    key=lambda x: (x["subj4"], x["band"], x["titles"]))
    # what the fold does across the whole wave, placed or held, by (title, band): the spellings it joins and the
    # titles a numeral keeps apart
    w_fold, w_base = defaultdict(set), defaultdict(lambda: defaultdict(set))
    for c in wave:
        b = band_of(c["credit"])
        w_fold[(fold_key(c["title"]), b)].add(c["title"])
        w_base[(numeral_base(c["title"]), b)][fold_key(c["title"])].add(c["title"])
    wave_folds = sorted(({"band": k[1], "titles": sorted(ts)} for k, ts in w_fold.items()
                         if len({seed.ntitle(t) for t in ts}) > 1), key=lambda x: (x["band"], x["titles"]))
    numeral_pairs = sorted(({"band": k[1], "titles": sorted(min(ts) for ts in fks.values())}
                            for k, fks in w_base.items() if len(fks) > 1), key=lambda x: (x["band"], x["titles"]))

    staged = set(inp.get("staged_ids") or ())
    returned = set(inp["reservations"].get(RESERVED_IDS) or ())
    all_keys = (set(inp["catalog"]) | set(inp["singletons"]) | set(inp["curations"]) | set(members)
                | set(inp["identities"]) | set(inp["common"]) | set(inp["alias_ids"]) | set(inp["membership_keys"])
                | staged | returned
                | {v.get("merge_into") for v in inp["curations"].values() if isinstance(v, dict) and v.get("merge_into")})
    all_keys.discard(None)
    buckets = zdry.Buckets(all_keys, inp["reservations"])
    planned_courses, planned_members, planned_single, plan_rows = {}, {}, {}, []
    assign = []
    for key in sorted(groups, key=lambda k: (k[1], k[2], k[0])):
        g = sorted(groups[key], key=lambda p: (p["college"], p["ctrl"]))
        fk, s4, band = key
        twins = sorted(existing.get(key) or [])
        if twins:
            assign.append({"title": _modal_title(g), "subj4": s4, "band": band, "existing": twins[:5],
                           "courses": [{"college": p["college"], "control_number": p["ctrl"]} for p in g]})
            held["duplicate_of_an_existing_m_id_held_for_assign"].extend(
                {"college": p["college"], "control_number": p["ctrl"], "title": p["title"], "assign_to": twins[0]}
                for p in g)
            continue
        if len(g) >= 2:
            new_id = buckets.next_corr(s4, band, fk)
        else:
            new_id = buckets.next_stand(s4, band, fk)
        if not new_id:
            held["bucket_full"].extend({"college": p["college"], "control_number": p["ctrl"], "title": p["title"],
                                        "bucket": f"{s4} M{band}"} for p in g)
            continue
        recs = _records(new_id, g, inp["descs"], today)
        if len(g) >= 2:
            planned_courses[new_id], planned_members[new_id] = recs
        else:
            planned_single[new_id] = recs[0]
        plan_rows.append({"id": new_id, "title": _modal_title(g), "kind": "catalog" if len(g) >= 2 else "stand-alone",
                          "courses": len(g), "colleges": len({p["college"] for p in g}),
                          "one_college": len({p["college"] for p in g}) == 1, "route": sorted({p["route"] for p in g}),
                          "shell": g[0]["kind"], "control_numbers": [p["ctrl"] for p in g]})

    validation = _validate(wave, left, held, planned_courses, planned_members, planned_single, inp, all_keys,
                           buckets, staged, conventions)
    shells = Counter(shell_kind(c["title"]) for c in pile)
    tut = _tutoring(pile, wave, hlist, inp)
    return {
        "_status": f"DRY-RUN {today} (version 2, after the second reader): the Needs an M-ID pile planned as M-IDs. "
                   "Nothing applied; no identity file and no table written. kb/_pile_mint_apply.py lands it.",
        "_generated_by": "kb/_pile_mint_dryrun.py", "_generated_at": today,
        "inputs": inp["provenance"],
        "measures": {
            "pile": len(pile), "pile_by_title_kind": dict(sorted(shells.items())),
            "left_out": {k: len(v) for k, v in sorted(left.items())}, "wave": len(wave),
            "subj4_by_route": {ROUTE_SOURCE[r]: route_count.get(r, 0) for r in ("s", "p", "i", "ii", "iii")},
            "decided": len(decided),
            "decided_released": sum(1 for x in decided if x["machine"].startswith("held: ")),
            "held": {k: len(v) for k, v in sorted(held.items())},
            "held_shell_titles_by_kind": dict(sorted(Counter(h["kind"] for h in held["shell_title_no_convention"])
                                                     .items(), key=lambda kv: (-kv[1], kv[0]))),
            "planned_catalog_records": len(planned_courses),
            "planned_catalog_courses": sum(len(v) for v in planned_members.values()),
            "planned_stand_alone_records": len(planned_single),
            "planned_records": len(planned_courses) + len(planned_single),
            "planned_courses": sum(len(v) for v in planned_members.values()) + len(planned_single),
            "one_college_catalog_records": sum(1 for r in plan_rows if r["kind"] == "catalog" and r["one_college"]),
            "duplicate_groups_held_for_assign": len(assign),
            "continuation_band_mints": len(buckets.continued),
            "ids_reserved_from_staged_plans": len(staged), "ids_reserved_from_rollbacks": len(returned),
        },
        "route_i_floor": {
            "how": ("Route (i) reads each identity-holding course's subject code; a code decides only when route (i) "
                    "reads its holders right at least 98% of the time with at least 10 holders. For a holder the "
                    "measure leaves the holder out of its own code's count."),
            "by_title_kind": {f"{k}_{s}": n for (k, s), n in sorted(ri_by_kind.items())},
            "holders_answered": floor_loo["answered"], "holders_answered_right": floor_loo["answered_right"],
            "holders_at_floor": floor_loo["at_floor"], "holders_at_floor_right": floor_loo["at_floor_right"],
            "subject_codes_at_floor": len(codes_at_floor), "subject_codes_answered": len(code_stats),
        },
        "shell_conventions": [conventions[k] for k in sorted(conventions, key=lambda k: (k[0], k[1]))],
        "ruled_kinds": RULED_KINDS,
        "ruled_kind_held_titles": _ruled_held(held),
        "supervised_tutoring": tut,
        "self_recall": {
            "how": ("Every ordinary-title identity-holding course (its control number names one course and one "
                    "M-ID's members) has its SUBJ4 predicted from the others, itself left out. support = courses that "
                    "vote; share = the winner's share; a tie at the top is wrong. A route is accepted at the floors "
                    "with the most predictions among those right at least 98% of the time."),
            "population": len(holding),
            "thresholds": {ROUTE_SOURCE[r]: thresholds[r] for r in ("ii", "iii")},
            "tables": {ROUTE_SOURCE[r]: recall[r]["cells"] for r in ("ii", "iii")},
            "map_silent_subjects": {
                ROUTE_SOURCE[r]: _accuracy([o for o in recall[r]["obs"] if o[3]], thresholds[r]) for r in ("ii", "iii")},
        },
        "folds": {"how": ("Titles fold when they differ by punctuation, case or spacing alone; a numeral is a level "
                          "and never folds. Placed groups the fold joined, then the whole wave by (title, band)."),
                  "placed_groups_folded_across_spellings": folded,
                  "wave_titles_folded": len(wave_folds), "wave_folded_across_spellings": wave_folds[:200],
                  "wave_numeral_pairs": len(numeral_pairs), "wave_numeral_pairs_kept_apart": numeral_pairs[:200]},
        "validation": validation,
        "planned": {"courses": dict(sorted(planned_courses.items())),
                    "memberships": dict(sorted(planned_members.items())),
                    "singletons": dict(sorted(planned_single.items()))},
        "plan_rows": plan_rows,
        "held_for_assign": assign,
        # every wave course a person's decision placed (route p): its key, its SUBJ4, and what the machine routes
        # would have done ("held: <reason>" is a course the decision released)
        "decided": sorted(decided, key=lambda x: (x["college"], x["control_number"])),
        "held": {k: v for k, v in sorted(held.items())},
        "left_out": {k: v for k, v in sorted(left.items())},
    }


def _ruled_held(held):
    rows = held.get("ruled_kind_title_names_more_than_the_kind") or []
    by = defaultdict(Counter)
    for h in rows:
        by[h["title_class"]][seed.ntitle(h["title"])] += 1
    return {"courses": len(rows), "colleges": len({h["college"] for h in rows}),
            "by_class": {k: {"courses": sum(v.values()), "titles": len(v), "first": v.most_common(12)}
                         for k, v in sorted(by.items())}}


def _tutoring(pile, wave, hlist, inp):
    """Supervised Tutoring, one statewide noncredit course type, on its own: how many sit in the pile and the wave,
    and what the identity file does with tutoring today."""
    tut = lambda t: "tutoring" in seed.ntitle(t)
    w = [c for c in wave if tut(c["title"])]
    held_ids = [h["mid"] for h in hlist if h["kind"] in ("supervised tutoring", "tutoring")]
    minted = sorted(mid for doc in (inp["catalog"], inp["singletons"]) for mid, r in doc.items()
                    if isinstance(r, dict) and tut(r.get("common_title") or ""))
    member_ids = sorted({mid for mid, rows in inp["members"].items() if any(tut(r.get("t") or "") for r in rows)})
    return {
        "pile": sum(1 for c in pile if tut(c["title"])), "wave": len(w),
        "wave_by_band": dict(sorted(Counter(band_of(c["credit"]) for c in w).items())),
        "wave_colleges": len({c["college"] for c in w}),
        "wave_top_local_subjects": Counter(c["subj"] for c in w).most_common(10),
        "identity_holding_courses_with_a_tutoring_title": len(held_ids),
        "minted_records_with_a_tutoring_title": minted[:20], "minted_records_with_a_tutoring_title_count": len(minted),
        "identity_file_ids_with_a_tutoring_member": member_ids[:20],
        "identity_file_ids_with_a_tutoring_member_count": len(member_ids),
    }


def _accuracy(obs, t):
    if not t:
        return None
    sel = [r for s, sh, r, _ in obs if s >= t["support_min"] and sh >= t["share_min"]]
    return {"n": len(sel), "right": sum(sel), "accuracy": round(sum(sel) / len(sel), 4) if sel else None}


def _modal_title(g):
    tc = Counter(p["title"] for p in g)
    return sorted(tc.items(), key=lambda kv: (-kv[1], kv[0]))[0][0]


def _records(new_id, g, descs, today):
    """The planned record(s) in the shapes the identity files carry. TOP fields stay null here: the TOP code is not
    read by the plan, and kb/_pile_mint_apply.py stamps `top_code` from the course list and `cte` through
    kb/_join_cte_from_top.py's map after the plan is fixed."""
    title = _modal_title(g)
    subj_counts = Counter(p["subj"] for p in g)
    modal_subj = sorted(subj_counts.items(), key=lambda kv: (-kv[1], kv[0]))[0][0]
    cs = Counter(CREDIT_WORDS.get(p["credit"], "Credit") for p in g)
    modal_cs = sorted(cs.items(), key=lambda kv: (-kv[1], kv[0]))[0][0]
    units = [float(p["units"]) for p in g if p["units"] is not None]
    uc = Counter(units)
    typical = sorted(uc.items(), key=lambda kv: (-kv[1], kv[0]))[0][0] if uc else None
    routes = sorted({ROUTE_SOURCE[p["route"]] for p in g})
    disc = sorted({p["discipline"] for p in g})[0]
    confs = [p["conf"] for p in g if p["conf"] is not None]
    dconf = min(confs) if confs else None
    shell = g[0]["kind"]
    dl = [(descs.get(p["ctrl"]) or "").strip() for p in g]
    dl = sorted((d for d in dl if d), key=lambda d: (-len(d), d))
    description = dl[0] if dl else None
    s4 = new_id.split(" ")[0]
    colleges = {p["college"] for p in g}
    notes = []
    if units and min(units) != max(units):
        notes.append(f"units {min(units):g} to {max(units):g} (units never split an identity)")
    if len(colleges) == 1 and len(g) >= 2:
        notes.append("one college")
    prov = {"discipline_source": DISCIPLINE_SOURCE, "pile_mint_route": "+".join(routes), "pile_mint_shell": shell,
            "discipline_confidence": dconf, "discipline_inferred_at": today,
            "_pile_mint_from": "kb/pile_mint_out/" + plan_dir(today)}
    rulings = sorted({p["ruling"] for p in g if p.get("ruling")})
    if rulings:
        prov["pile_mint_ruling"] = "+".join(rulings)
    keys = sorted({p["decision"] for p in g if p.get("decision")})
    if keys:
        prov["pile_mint_decision"] = "+".join(keys)
    if len(g) >= 2:
        rec = {
            "course_id": new_id, "id_system": "M-ID", "ccn_id": None, "c_id": None,
            "common_title": title, "common_title_source": "local catalog (most common printed title)",
            "description": description, "description_source": "local catalog (longest on file)" if description else None,
            "subject": modal_subj, "subject_4letter": s4, "discipline": disc, "discipline_provisional": modal_subj,
            "typical_units": typical, "confidence": seed.confidence(len(g), len(subj_counts)),
            "corroboration_members": len(g), "subject_spread": len(subj_counts), "source_college_count": len(colleges),
            "classified_at": today, "classified_by": CLASSIFIED_BY, "reviewed_at": None, "reviewed_by": None,
            "_notes": "; ".join(notes) or None,
            "credit_status": modal_cs, "credit_status_mixed": len(cs) > 1,
            "top_code": None, "noncredit_category": None, "top_code_mixed": None, "top_code_distribution": None,
            "noncredit_category_mixed": None, "noncredit_category_distribution": None, "cte": None,
            "one_college": len(colleges) == 1,
        }
        rec.update(prov)
        mem = [{"college": p["college"], "control_number": p["ctrl"], "subject": p["subj"], "course_number": p["num"],
                "units": p["units"], "credit_status": CREDIT_WORDS.get(p["credit"], "Credit"), "top_code": None}
               for p in g]
        return rec, mem
    p = g[0]
    rec = {"course_id": new_id, "common_title": p["title"], "subject": p["subj"], "subject_4letter": s4,
           "course_number": p["num"], "college": p["college"], "control_number": p["ctrl"],
           "credit_status": CREDIT_WORDS.get(p["credit"], "Credit"), "typical_units": p["units"], "top_code": None,
           "discipline": disc, "cte": None}
    rec.update(prov)
    return (rec,)


def _validate(wave, left, held, pc, pm, ps, inp, all_keys, buckets, staged, conventions):
    wave_cn = Counter(c["ctrl"] for c in wave)
    landed = Counter()
    for ms in pm.values():
        for m in ms:
            landed[m["control_number"]] += 1
    for r in ps.values():
        landed[r["control_number"]] += 1
    for rows in held.values():
        for r in rows:
            landed[r["control_number"]] += 1
    once = all(landed[k] == 1 for k in wave_cn) and set(landed) == set(wave_cn)
    ids = list(pc) + list(ps)
    reserved_hit = sorted(i for i in ids if i in all_keys or _reserved(i, inp["reservations"]))
    dup_ids = sorted(k for k, n in Counter(ids).items() if n > 1)

    def shape_ok(i):
        m = zdry.M_CORR_RE.match(i)
        rec = pc.get(i) or ps.get(i) or {}
        band = "9" if rec.get("credit_status") in ("Noncredit", "Noncredit Enhanced") else "1"
        if i in pc:
            return bool(m and zdry.SUBJ4_RE.match(m.group(1)) and m.group(2) in zdry.continuation_bands(band))
        m = zdry.M_STAND_RE.match(i)
        return bool(m and zdry.SUBJ4_RE.match(m.group(1)) and m.group(2) == band)
    bad_shape = sorted(i for i in ids if not shape_ok(i))
    known_cn = set(inp["membership_cns"]) | set(inp["singleton_cns"])
    planned_cn = {m["control_number"] for ms in pm.values() for m in ms} | {r["control_number"] for r in ps.values()}
    already = sorted(planned_cn & known_cn)
    recs = list(pc.items()) + list(ps.items())
    # a shell title mints under its convention, a ruled kind, or a person's decision that names its key
    shell_ok = {ROUTE_SOURCE["s"], ROUTE_SOURCE["r"], ROUTE_SOURCE["p"]}

    def shell_bad(r):
        parts = set(str(r.get("pile_mint_route") or "").split("+"))
        return not parts <= shell_ok or (ROUTE_SOURCE["p"] in parts and not r.get("pile_mint_decision"))
    bad_shell = sorted(i for i, r in recs if r.get("pile_mint_shell") and shell_bad(r))
    bad_source = sorted(i for i, r in recs if r.get("discipline_source") != DISCIPLINE_SOURCE)
    return {
        "V1_every_wave_course_lands_once": {"pass": once, "wave": len(wave_cn), "landed": sum(landed.values())},
        "V2_no_planned_id_reserved_or_ever_minted": {"pass": not reserved_hit, "hits": reserved_hit[:10]},
        "V3_no_planned_id_twice": {"pass": not dup_ids, "duplicates": dup_ids[:10]},
        "V4_id_shape": {"pass": not bad_shape, "bad": bad_shape[:10]},
        "V5_no_planned_control_number_in_an_identity_file": {"pass": not already, "hits": already[:10]},
        "V7_no_overflow": {"pass": not buckets.overflow, "overflow": buckets.overflow[:10]},
        "V8_no_planned_id_a_staged_plan_names": {"pass": not (set(ids) & staged),
                                                  "hits": sorted(set(ids) & staged)[:10]},
        "V9_a_shell_title_mints_only_under_its_convention": {"pass": not bad_shell, "bad": bad_shell[:10]},
        "V10_every_record_carries_the_pile_mint_source": {"pass": not bad_source, "bad": bad_source[:10]},
    }


def _reserved(i, reservations):
    if i in (reservations.get(RESERVED_IDS) or ()):
        return True
    m = zdry.M_CORR_RE.match(i)
    return bool(m and int(m.group(3)) in reservations.get((m.group(1), m.group(2)), set()))


# ── the Closest M-ID measure (design F) ────────────────────────────────────
def closest_measure(plan, inp):
    """The rest of the pile (every held and left-out course) ranked by kb/_closest_mid.py's Index over the identity
    file with the planned records added (their members as the course list prints them): how many first
    recommendations become a planned record, at which level. `strong_on_a_shell_title` counts a Strong first
    recommendation of a planned shell-title record, the apply's stop, less the right answers: a course of a ruled
    kind left out of the wave (`Supervised Tutoring in Mathematics`) whose first recommendation is that kind's ruled
    record, counted apart as `strong_on_its_own_ruled_kind`."""
    L = inp["L"]
    col_ix = {c: i for i, c in enumerate(str(x or "").strip() for x in L["colleges"])}
    by_ctrl = {c["ctrl"]: c for c in inp["courses"]}
    members = dict(inp["members"])
    planned = dict(plan["planned"]["memberships"])
    for mid, r in plan["planned"]["singletons"].items():
        planned[mid] = [{"control_number": r["control_number"]}]
    for mid, ms in planned.items():
        rows = []
        for m in ms:
            c = by_ctrl[m["control_number"]]
            rows.append({"c": col_ix.get(c["college"]), "n": (c["subj"] + " " + c["num"]).strip(), "t": c["title"],
                         "u": c["units"], "cn": c["ctrl"]})
        members[mid] = rows
    row_of = {r["id"]: r for r in plan["plan_rows"]}
    ruled_kinds_of = {}
    for mid, r in row_of.items():
        if "r" in (r.get("route") or []) and r.get("shell") in RULED_BY_KIND:
            ruled_kinds_of[mid] = set(RULED_BY_KIND[r["shell"]]["kinds"])
    rest = [h for part in ("held", "left_out") for rows in (plan.get(part) or {}).values() for h in rows]
    level = lambda b: "strong" if b in (5, 6) else ("possible" if b in (3, 4) else "none")
    out = {}
    for name, mem in (("before", inp["members"]), ("after", members)):
        ix = cm.Index(mem, inp["descs"])
        tally = Counter()
        firsts = []
        for h in rest:
            c = by_ctrl.get(h["control_number"])
            top = ix.rank(c) if c else []
            if not top:
                tally["no_candidate"] += 1
                continue
            lv = level(cm.band_of(top[0]["score"]))
            first = top[0]["mid"]
            new = first in row_of
            tally[("new_record_" if new else "existing_") + lv] += 1
            if new:
                kind = shell_pattern(h["title"])
                firsts.append({"control_number": h["control_number"], "title": h["title"], "first": first,
                               "level": lv, "score": round(top[0]["score"], 3), "shell": row_of[first].get("shell"),
                               "own_ruled_kind": kind in ruled_kinds_of.get(first, ())})
        strong = [f for f in firsts if f["level"] == "strong"]
        out[name] = {"tally": dict(sorted(tally.items())), "first_is_a_new_record": firsts[:40],
                     "strong_on_its_own_ruled_kind": sum(1 for f in strong if f["own_ruled_kind"]),
                     "strong_on_a_shell_title": sum(1 for f in strong if f["shell"] and not f["own_ruled_kind"]),
                     "strong_others": [f for f in strong if not f["own_ruled_kind"]][:20]}
    out["ranked"] = len(rest)
    out["held"] = sum(len(v) for v in plan["held"].values())
    out["held_sharing_an_exact_title_with_a_planned_record"] = _exact_title_overlap(plan, by_ctrl)
    return out


def _exact_title_overlap(plan, by_ctrl):
    planned_titles = set()
    for r in plan["plan_rows"]:
        for cn in r["control_numbers"]:
            planned_titles.add(cm.norm_title(by_ctrl[cn]["title"]))
    return sum(1 for rows in plan["held"].values() for h in rows if cm.norm_title(h["title"]) in planned_titles)


# ── loading ────────────────────────────────────────────────────────────────
def load_inputs(kb_dir=None):
    """The committed files. `kb_dir` (default kb/, or UC_KB_DIR) is where the three identity files and the rollback
    reservation file are read, so kb/_pile_mint_apply.py can run the whole round trip in a scratch copy."""
    kb_dir = kb_dir or os.environ.get("UC_KB_DIR") or HERE
    L = cm.load_js(os.path.join(ROOT, "coci_lookup_data.js"), "window.CPL_COCI_LOOKUP")
    M = cm.load_js(os.path.join(ROOT, "unified_courses_members.js"), "window.CPL_UC_MEMBERS")
    descs = {}
    for f in sorted(glob.glob(os.path.join(ROOT, "coci_lookup_desc_*.js"))):
        s = open(f, encoding="utf-8").read()
        descs.update(json.loads(s[s.index("=", s.index('window.CPL_COCI_DESC["')) + 1:].strip().rstrip(";")))
    cat_doc = _load(os.path.join(kb_dir, IDENTITY_FILES[0]))
    mem_doc = _load(os.path.join(kb_dir, IDENTITY_FILES[1]))
    sing_doc = _load(os.path.join(kb_dir, IDENTITY_FILES[2]))
    cur_doc = _load(zdry.CURATION)
    closest = _load(os.path.join(HERE, "coci_closest_mid.json"))
    canon_doc = _load(zdry.CANONICAL)
    disc_map = _load(seed.DISC_MAP_PATH)["map"]
    na = _load(os.path.join(HERE, "coci_not_applicable.json")).get("courses") or {}
    memberships = mem_doc.get("memberships") or {}
    return {
        "L": L, "courses": lookup_courses(L), "members": M["members"], "descs": descs, "na": na, "closest": closest,
        "catalog": cat_doc["courses"], "singletons": sing_doc["courses"], "curations": cur_doc.get("curations") or {},
        "identities": _load(zdry.ARTICULATIONS).get("identities") or {}, "common": _load(zdry.COMMON),
        "membership_keys": list(memberships),
        "membership_cns": [m.get("control_number") for ms in memberships.values() for m in ms if m.get("control_number")],
        "singleton_cns": [r.get("control_number") for r in sing_doc["courses"].values() if r.get("control_number")],
        "disc_aliases": _load(promote.ALIASES).get("aliases") or {},
        "disc_map": disc_map, "canon_map": seed.load_canonical_map(), "canon_doc": canon_doc,
        "subject_decisions": sdec.load(ROOT, canon_doc), "decision_slugs": sdec.slugs_by_college(ROOT),
        "fl_doc": _load(zdry.FL_SPLIT),
        "reservations": s4dry.add_reserved_ids(zdry.load_id_reservations(), rollback_reserved_ids(kb_dir)),
        "alias_ids": sorted(promote.reserved_alias_ids()),
        "staged_ids": sorted(staged_plan_ids()),
        "provenance": {
            "identity_file": "unified_courses_members.js generated_at " + str(M.get("generated_at")),
            "course_list": "coci_lookup_data.js _built_at " + str(L.get("_built_at")) + ", from "
                           + str(L.get("_source")),
            "closest_mid": "kb/coci_closest_mid.json identity_file " + str(closest.get("identity_file")),
            "closest_mid_pile": closest.get("pile"),
            "minted_catalog": "kb/coci_minted_courses.json _generated_at " + str(cat_doc.get("_generated_at")),
        },
    }


def dump(plan):
    return json.dumps(plan, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n"


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--date", default=date.today().isoformat())
    ap.add_argument("--out", default=None)
    ap.add_argument("--closest", action="store_true", help="also write closest_measure.json (design F)")
    a = ap.parse_args(argv)
    inp = load_inputs()
    plan = compute_plan(inp, a.date)
    again = compute_plan(load_inputs(), a.date)
    first, second = dump(plan), dump(again)
    plan["validation"]["V6_two_runs_identical_bytes"] = {"pass": first == second}
    out = a.out or os.path.join(OUT_DIR, plan_dir(a.date))
    os.makedirs(out, exist_ok=True)
    with open(os.path.join(out, "plan.json"), "w", encoding="utf-8") as f:
        f.write(dump(plan))
    m = plan["measures"]
    print(f"[pile_mint_dryrun] {a.date}  {plan['inputs']['identity_file']}")
    print(f"  pile {m['pile']}  (kb/coci_closest_mid.json filed {plan['inputs']['closest_mid_pile']} on "
          f"{plan['inputs']['closest_mid']})")
    print(f"  left out: {m['left_out']}  wave {m['wave']}")
    print(f"  SUBJ4 by route: {m['subj4_by_route']}  held: {m['held']}")
    print(f"  planned: {m['planned_catalog_records']} catalog records ({m['planned_catalog_courses']} courses, "
          f"{m['one_college_catalog_records']} one college), {m['planned_stand_alone_records']} stand-alone; "
          f"{m['duplicate_groups_held_for_assign']} groups held for Assign")
    print(f"  route (i) floor: {plan['route_i_floor']['holders_at_floor_right']} of "
          f"{plan['route_i_floor']['holders_at_floor']} holders right on {plan['route_i_floor']['subject_codes_at_floor']}"
          f" codes")
    print(f"  shell conventions accepted: {[(c['kind'], c['band'], c['subj4']) for c in plan['shell_conventions'] if c['accepted']]}")
    print(f"  thresholds: {plan['self_recall']['thresholds']}")
    for k, v in plan["validation"].items():
        print(f"  {'PASS' if v['pass'] else 'FAIL'}  {k}")
    print(f"  plan -> {os.path.relpath(os.path.join(out, 'plan.json'), ROOT)}")
    if a.closest:
        cmz = closest_measure(plan, inp)
        with open(os.path.join(out, "closest_measure.json"), "w", encoding="utf-8") as f:
            f.write(dump(cmz))
        print(f"  closest: before {cmz['before']['tally']}")
        print(f"           after  {cmz['after']['tally']}  strong on a shell title {cmz['after']['strong_on_a_shell_title']}")
    return 0 if all(v["pass"] for v in plan["validation"].values()) else 1


if __name__ == "__main__":
    sys.exit(main())
