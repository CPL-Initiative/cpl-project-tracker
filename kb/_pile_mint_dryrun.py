#!/usr/bin/env python3
"""The Needs an M-ID pile: plan the mint of new M-IDs, DRY RUN ONLY (Rule 7).

Sam, 2026-11-20 (r-mids-first-then-course-exhibit-titles-sam-2026-11-20): "as we get commons re-established through
this process, my priority will be the mids so i can then finish the exhibit titles for course-based exhibits that rely
on cid/ccn/mid (ccrs)". Sam, 2026-09-03, card 12: "everything that isn't a CID or CCN is a MID".

The Courses List's Needs an M-ID pile is the local courses with no M-ID, no C-ID and no CCN, less the courses
kb/coci_not_applicable.json keeps out of every count (kb/_closest_mid.py defines it). Most carry a title the identity
seed set aside as a generic shell (practicum, tutoring, seminar, apprenticeship...), and many are real courses. This
tool plans the M-IDs they would get and reports what it would do. It reads committed files only, writes
kb/pile_mint_out/<date>/plan.json and prints a summary. It has no --apply and writes no identity file and no table.

THE WAVE. The pile less, each counted and listed: (a) courses kb/coci_closest_mid.json files at the Strong or
Possible level (a person or a second-stage check settles those first); (b) special-topics and selected-topics titles
(their content changes each term); (c) a control number that names more than one course in the state list; (d) a
course a `CN:` row in kb/coci_curation.json already re-homes. A course is counted under the first of (a) to (d) that
holds for it.

THE SUBJ4, in this order, the route recorded on the course:
  (i)   the subject map, through the seed's discipline_for_modal and canonical_subj_token (a one- or two-character
        subject code never decides a discipline alone; an umbrella discipline keeps its split code);
  (ii)  where the map is silent, the SUBJ4 the same college's courses under the same local subject code carry in the
        identity file;
  (iii) where that is silent, the SUBJ4 the same local subject code carries statewide (codes of three characters or
        more only);
  (iv)  otherwise the course is held, with the reason.
Routes (ii) and (iii) are a new matcher, gated by a self-recall test: every identity-holding course's SUBJ4 is
predicted from the other identity-holding courses, the course itself left out, and the right and wrong counts are
filed by support (how many courses vote) and share (the winner's share of the vote). A route is accepted only at the
support and share floors where it is right at least 98% of the time on that test. The TOP code is read nowhere.

GROUPING. Wave courses sharing (normalized title, SUBJ4, band) are one common course: two or more make a catalog
record with a memberships entry, one makes a stand-alone record. A group whose courses all sit at one college is
flagged one_college. Band 9 for Noncredit and Noncredit Enhanced, else 1 (credit_char in kb/_build_coci_lookup.py).
Units never split a group. A group that would duplicate an M-ID the identity files already hold (same normalized
title, SUBJ4 and band) is held for Assign with that M-ID.

IDS. `SUBJ4 M<band><seq>`: a catalog record takes the lowest free corroborated number (`M1036`, continuing into the
next band digit when a credit bucket is full), a stand-alone record the lowest free stand-alone code (`M10BT`: band,
one digit, two letters; kb/_remint_apply.py sing_code, kb/_zband_retire_dryrun.py standalone_code). The allocator is
kb/_zband_retire_dryrun.py Buckets over every id ever minted (the three identity files, the identity file's keys,
curation keys and merge_into values, identities, common courses, every alias map's old and new side) and the CCN and
C-ID reservations, as kb/_uc_cur_promote.py uses it.

Usage (from repo root):  python3 kb/_pile_mint_dryrun.py [--date YYYY-MM-DD] [--out DIR]
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
import _closest_mid as cm  # noqa: E402  (load_js and the pile's definition)
import _seed_coci_minted_mids as seed  # noqa: E402  (STOP_RE, CODE_RE, ntitle, discipline_for_modal, ...)
import _zband_retire_dryrun as zdry  # noqa: E402  (Buckets, the id shapes, canonical_codes, reservations)
import _uc_cur_promote as promote  # noqa: E402  (reserved_alias_ids: every alias map's old and new side)

OUT_DIR = os.environ.get("PILE_MINT_OUT") or os.path.join(HERE, "pile_mint_out")
TOPICS_RE = re.compile(r"\b(special|selected|spec|sel)\s+topic")
NONCREDIT_CHARS = ("N", "E")
CREDIT_WORDS = {"C": "Credit", "N": "Noncredit", "E": "Noncredit Enhanced"}
ACCURACY_FLOOR = 0.98
SUPPORT_GRID = (1, 2, 3, 4, 5, 7, 10, 15, 20, 30, 50, 100, 200)
SHARE_GRID = (0.5, 0.6, 0.67, 0.75, 0.8, 0.85, 0.9, 0.95, 1.0)
SUPPORT_BUCKETS = ((1, 1), (2, 2), (3, 4), (5, 9), (10, 19), (20, 49), (50, 99), (100, 10 ** 9))
SHARE_BUCKETS = ((0.0, 0.6), (0.6, 0.8), (0.8, 0.9), (0.9, 1.0), (1.0, 1.01))
ROUTE_SOURCE = {"i": "subject_map", "ii": "college_subject_code", "iii": "statewide_subject_code"}
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


# ── the pile (kb/_closest_mid.py's definition) ─────────────────────────────
def lookup_courses(L):
    """The Courses List rows as kb/_closest_mid.py reads them, plus the credit character (column 6). The TOP column
    (7) is never read."""
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


def shell_kind(title):
    nt = seed.ntitle(title)
    m = seed.STOP_RE.search(nt)
    if m:
        return "generic shell: " + m.group(0).strip()
    if seed.CODE_RE.match(nt):
        return "code-only title"
    return "ordinary"


# ── the self-recall test for routes (ii) and (iii) ─────────────────────────
def own_subj4(mids, members):
    ms = sorted((m for m in mids if is_m_id(m) and zdry.SUBJ4_RE.match(m.split(" ")[0])),
                key=lambda m: (-len(members.get(m) or []), m))
    return ms[0].split(" ")[0] if ms else None


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
    """Predict every identity-holding course's SUBJ4 by route (ii) and by route (iii), the course left out of the
    vote. Returns {route: {"cells": [...], "obs": [(support, share, right, map_silent)]}}."""
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

    # ── the identity-holding courses vote (routes ii and iii) ──
    holding = []
    seen = set()
    for c in courses:
        if c["ctrl"] in seen or ctrl_rows[c["ctrl"]] > 1 or c["ctrl"] not in by_cn:
            continue
        seen.add(c["ctrl"])
        s4 = own_subj4(by_cn[c["ctrl"]], members)
        if s4:
            holding.append((c["college"], seed.normsubj(c["subj"]), s4))
    col, state = vote_tables(holding)
    silent_ns = {seed.normsubj(c["subj"]) for c in wave
                 if route_i(c["subj"], disc_map, canon_map, umbrella, fl_subjects, disc_alias)[1] is None}
    recall = self_recall(holding, col, state, silent_ns)
    thresholds = {r: choose_thresholds(recall[r]["obs"]) for r in ("ii", "iii")}
    # route (i)'s own agreement with the identity file, for the record (it is the seed's rule, not a new matcher)
    ri = Counter()
    for college, ns, s4 in holding:
        got = route_i(ns, disc_map, canon_map, umbrella, fl_subjects, disc_alias)[1]
        ri["silent" if got is None else ("right" if got == s4 else "wrong")] += 1

    def accept(route, w):
        t = thresholds[route]
        return bool(w and w[0] and t and w[1] >= t["support_min"] and w[2] >= t["share_min"])

    # ── the SUBJ4 for each wave course ──
    held = defaultdict(list)
    placed = []
    route_count = Counter()
    for c in wave:
        ns = seed.normsubj(c["subj"])
        disc, s4, note = route_i(c["subj"], disc_map, canon_map, umbrella, fl_subjects, disc_alias)
        route = "i" if s4 else None
        if not s4:
            for r, w in (("ii", winner(col.get((c["college"], ns), {}))),
                         ("iii", winner(state.get(ns, {})) if len(ns) > SUBJ_SHORT else None)):
                if not accept(r, w):
                    continue
                cand = w[0]
                if disc and (cand not in umbrella.get(disc, set()) and s4_disc.get(cand) != disc):
                    note = f"the subject map reads {disc!r} and route ({r}) offers {cand}, another discipline's code"
                    continue
                s4, route = cand, r
                break
        tag = {"college": c["college"], "control_number": c["ctrl"], "title": c["title"], "subject": c["subj"]}
        if not s4:
            held["no_route_gives_a_subj4"].append(dict(tag, why=note or "no route reaches its floor"))
            continue
        d = disc if route == "i" else (disc or s4_disc.get(s4))
        if not d:
            held["subj4_names_no_discipline"].append(dict(tag, subj4=s4, route=route))
            continue
        route_count[route] += 1
        placed.append(dict(c, subj4=s4, discipline=d, route=route, band=band_of(c["credit"]), nt=seed.ntitle(c["title"])))

    # ── grouping and the duplicate check ──
    existing = defaultdict(list)
    for doc in (inp["catalog"], inp["singletons"]):
        for mid, r in doc.items():
            if not isinstance(r, dict) or not is_m_id(mid):
                continue
            m = zdry.M_CORR_RE.match(mid) or zdry.M_STAND_RE.match(mid)
            # a continuation digit (2 to 8) is a credit bucket that filled (card 11)
            existing[(seed.ntitle(r.get("common_title")), m.group(1), "9" if m.group(2) == "9" else "1")].append(mid)
    groups = defaultdict(list)
    for p in placed:
        groups[(p["nt"], p["subj4"], p["band"])].append(p)

    all_keys = (set(inp["catalog"]) | set(inp["singletons"]) | set(inp["curations"]) | set(members)
                | set(inp["identities"]) | set(inp["common"]) | set(inp["alias_ids"]) | set(inp["membership_keys"])
                | {v.get("merge_into") for v in inp["curations"].values() if isinstance(v, dict) and v.get("merge_into")})
    all_keys.discard(None)
    buckets = zdry.Buckets(all_keys, inp["reservations"])
    planned_courses, planned_members, planned_single, plan_rows = {}, {}, {}, []
    assign = []
    for key in sorted(groups, key=lambda k: (k[1], k[2], k[0])):
        g = sorted(groups[key], key=lambda p: (p["college"], p["ctrl"]))
        nt, s4, band = key
        twins = sorted(existing.get(key) or [])
        if twins:
            assign.append({"title": _modal_title(g), "subj4": s4, "band": band, "existing": twins[:5],
                           "courses": [{"college": p["college"], "control_number": p["ctrl"]} for p in g]})
            held["duplicate_of_an_existing_m_id_held_for_assign"].extend(
                {"college": p["college"], "control_number": p["ctrl"], "title": p["title"], "assign_to": twins[0]}
                for p in g)
            continue
        if len(g) >= 2:
            new_id = buckets.next_corr(s4, band, nt)
        else:
            new_id = buckets.next_stand(s4, band, nt)
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
                          "control_numbers": [p["ctrl"] for p in g]})

    validation = _validate(wave, left, held, planned_courses, planned_members, planned_single, inp, all_keys,
                           buckets)
    shells = Counter(shell_kind(c["title"]) for c in pile)
    return {
        "_status": f"DRY-RUN {today}: the Needs an M-ID pile planned as M-IDs. Nothing applied; no identity file and "
                   "no table written. A second reader reviews this plan before any apply is written.",
        "_generated_by": "kb/_pile_mint_dryrun.py", "_generated_at": today,
        "inputs": inp["provenance"],
        "measures": {
            "pile": len(pile), "pile_by_title_kind": dict(sorted(shells.items())),
            "left_out": {k: len(v) for k, v in sorted(left.items())}, "wave": len(wave),
            "subj4_by_route": {ROUTE_SOURCE[r]: route_count.get(r, 0) for r in ("i", "ii", "iii")},
            "held": {k: len(v) for k, v in sorted(held.items())},
            "planned_catalog_records": len(planned_courses),
            "planned_catalog_courses": sum(len(v) for v in planned_members.values()),
            "planned_stand_alone_records": len(planned_single),
            "one_college_catalog_records": sum(1 for r in plan_rows if r["kind"] == "catalog" and r["one_college"]),
            "duplicate_groups_held_for_assign": len(assign),
            "continuation_band_mints": len(buckets.continued),
        },
        "self_recall": {
            "how": ("Every identity-holding course (its control number names one course and one M-ID's members) has its "
                    "SUBJ4 predicted from the others, itself left out. support = courses that vote; share = the "
                    "winner's share; a tie at the top is wrong. A route is accepted at the floors with the most "
                    "predictions among those right at least 98% of the time."),
            "population": len(holding),
            "route_i_agreement": dict(sorted(ri.items())),
            "thresholds": {ROUTE_SOURCE[r]: thresholds[r] for r in ("ii", "iii")},
            "tables": {ROUTE_SOURCE[r]: recall[r]["cells"] for r in ("ii", "iii")},
            "map_silent_subjects": {
                ROUTE_SOURCE[r]: _accuracy([o for o in recall[r]["obs"] if o[3]], thresholds[r]) for r in ("ii", "iii")},
        },
        "validation": validation,
        "planned": {"courses": dict(sorted(planned_courses.items())),
                    "memberships": dict(sorted(planned_members.items())),
                    "singletons": dict(sorted(planned_single.items()))},
        "plan_rows": plan_rows,
        "held_for_assign": assign,
        "held": {k: v for k, v in sorted(held.items())},
        "left_out": {k: v for k, v in sorted(left.items())},
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
    """The planned record(s) in the shapes the identity files carry. TOP-derived fields stay null: the TOP code is
    not read here, and the apply stamps `cte` and `top_code` with the tools that own them."""
    title = _modal_title(g)
    subj_counts = Counter(p["subj"] for p in g)
    modal_subj = sorted(subj_counts.items(), key=lambda kv: (-kv[1], kv[0]))[0][0]
    cs = Counter(CREDIT_WORDS.get(p["credit"], "Credit") for p in g)
    modal_cs = sorted(cs.items(), key=lambda kv: (-kv[1], kv[0]))[0][0]
    units = [float(p["units"]) for p in g if p["units"] is not None]
    uc = Counter(units)
    typical = sorted(uc.items(), key=lambda kv: (-kv[1], kv[0]))[0][0] if uc else None
    d_route = sorted({p["route"] for p in g})
    route = d_route[0]
    disc = sorted({p["discipline"] for p in g})[0]
    dconf = 0.8 if route == "i" else None
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
            "discipline_source": ROUTE_SOURCE[route], "discipline_confidence": dconf, "discipline_inferred_at": today,
            "one_college": len(colleges) == 1, "_pile_mint_from": "kb/pile_mint_out/" + today,
        }
        mem = [{"college": p["college"], "control_number": p["ctrl"], "subject": p["subj"], "course_number": p["num"],
                "units": p["units"], "credit_status": CREDIT_WORDS.get(p["credit"], "Credit"), "top_code": None}
               for p in g]
        return rec, mem
    p = g[0]
    return ({"course_id": new_id, "common_title": p["title"], "subject": p["subj"], "subject_4letter": s4,
             "course_number": p["num"], "college": p["college"], "control_number": p["ctrl"],
             "credit_status": CREDIT_WORDS.get(p["credit"], "Credit"), "typical_units": p["units"], "top_code": None,
             "discipline": disc, "discipline_source": ROUTE_SOURCE[route], "discipline_confidence": dconf,
             "discipline_inferred_at": today, "cte": None, "_pile_mint_from": "kb/pile_mint_out/" + today},)


def _validate(wave, left, held, pc, pm, ps, inp, all_keys, buckets):
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
    return {
        "V1_every_wave_course_lands_once": {"pass": once, "wave": len(wave_cn), "landed": sum(landed.values())},
        "V2_no_planned_id_reserved_or_ever_minted": {"pass": not reserved_hit, "hits": reserved_hit[:10]},
        "V3_no_planned_id_twice": {"pass": not dup_ids, "duplicates": dup_ids[:10]},
        "V4_id_shape": {"pass": not bad_shape, "bad": bad_shape[:10]},
        "V5_no_planned_control_number_in_an_identity_file": {"pass": not already, "hits": already[:10]},
        "V7_no_overflow": {"pass": not buckets.overflow, "overflow": buckets.overflow[:10]},
    }


def _reserved(i, reservations):
    m = zdry.M_CORR_RE.match(i)
    return bool(m and int(m.group(3)) in reservations.get((m.group(1), m.group(2)), set()))


# ── loading ────────────────────────────────────────────────────────────────
def load_inputs():
    L = cm.load_js(os.path.join(ROOT, "coci_lookup_data.js"), "window.CPL_COCI_LOOKUP")
    M = cm.load_js(os.path.join(ROOT, "unified_courses_members.js"), "window.CPL_UC_MEMBERS")
    descs = {}
    for f in sorted(glob.glob(os.path.join(ROOT, "coci_lookup_desc_*.js"))):
        s = open(f, encoding="utf-8").read()
        descs.update(json.loads(s[s.index("=", s.index('window.CPL_COCI_DESC["')) + 1:].strip().rstrip(";")))
    cat_doc, sing_doc = _load(zdry.COURSES), _load(zdry.SINGLETONS)
    mem_doc = _load(promote.MEMBERSHIPS)
    cur_doc = _load(zdry.CURATION)
    closest = _load(os.path.join(HERE, "coci_closest_mid.json"))
    canon_doc = _load(zdry.CANONICAL)
    disc_map = _load(seed.DISC_MAP_PATH)["map"]
    na = _load(os.path.join(HERE, "coci_not_applicable.json")).get("courses") or {}
    memberships = mem_doc.get("memberships") or {}
    return {
        "courses": lookup_courses(L), "members": M["members"], "descs": descs, "na": na, "closest": closest,
        "catalog": cat_doc["courses"], "singletons": sing_doc["courses"], "curations": cur_doc.get("curations") or {},
        "identities": _load(zdry.ARTICULATIONS).get("identities") or {}, "common": _load(zdry.COMMON),
        "membership_keys": list(memberships),
        "membership_cns": [m.get("control_number") for ms in memberships.values() for m in ms if m.get("control_number")],
        "singleton_cns": [r.get("control_number") for r in sing_doc["courses"].values() if r.get("control_number")],
        "disc_aliases": _load(promote.ALIASES).get("aliases") or {},
        "disc_map": disc_map, "canon_map": seed.load_canonical_map(), "canon_doc": canon_doc,
        "fl_doc": _load(zdry.FL_SPLIT), "reservations": zdry.load_id_reservations(),
        "alias_ids": sorted(promote.reserved_alias_ids()),
        "provenance": {
            "identity_file": "unified_courses_members.js generated_at " + str(M.get("generated_at")),
            "course_list": "coci_lookup_data.js _built_at " + str(L.get("_built_at")),
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
    a = ap.parse_args(argv)
    inp = load_inputs()
    plan = compute_plan(inp, a.date)
    again = compute_plan(load_inputs(), a.date)
    first, second = dump(plan), dump(again)
    plan["validation"]["V6_two_runs_identical_bytes"] = {"pass": first == second}
    out = a.out or os.path.join(OUT_DIR, a.date)
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
    print(f"  thresholds: {plan['self_recall']['thresholds']}")
    for k, v in plan["validation"].items():
        print(f"  {'PASS' if v['pass'] else 'FAIL'}  {k}")
    print(f"  plan -> {os.path.relpath(os.path.join(out, 'plan.json'), ROOT)}")
    return 0 if all(v["pass"] for v in plan["validation"].values()) else 1


if __name__ == "__main__":
    sys.exit(main())
