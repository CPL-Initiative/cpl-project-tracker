#!/usr/bin/env python3
"""The local subject codes the pile mint holds on, ranked by the held courses each one releases (S695).

Sam, 2026-11-20 (r-collect-for-mids-work-order-sam-2026-11-20): collection serves the M-IDs, and fixes are ranked by
the M-ID cards they unblock. Sam, 2026-11-20 (r-subjects-card-on-the-commons-sam-2026-11-20): "don't we need a
commons card for subjects to house the common subjects and local subject titles we'll be establishing from catalog
data?"

The pile mint dry run (kb/_pile_mint_dryrun.py) holds a course a common four-letter subject code (SUBJ4) for its
local subject would help release under three reasons (HELD_REASONS): no route gives it a SUBJ4
(`no_route_gives_a_subj4`), the subject map's reading of its code is below route (i)'s floor
(`route_i_below_its_floor`), or its title is a generic shell with no convention (`shell_title_no_convention`, a ruled
kind's title left out: RULED_BY_KIND decides those). Those courses share a much shorter list of local subject codes:
once a person decides the common subject code for one local code, the held courses under it can be minted. Each
course carries its reason. This tool groups the held courses by local subject code (statewide, then by college) and
writes, per code:

  - the colleges using it and the held courses each one releases (count, control numbers, up to 5 example titles);
  - the printed subject name, where kb/status/local_subject_titles.json (the Subjects card's file) holds one;
  - the evidence that fell short: what the subject map read (the dry run's own note, route i), what the same college's
    identity-holding courses under the code voted (route ii) and what the code voted statewide (route iii), each as
    winner, votes and share with the floor it missed; and the subject map's near entries (keys that share the code's
    first three characters, or that one extends the other).

A vote winner is written as `suggestion`, with its votes and share, never as a decision: the routes missed the 98%
self-recall floor, which is why the course is held. A TOP code is read nowhere (CLAUDE.md Rule 7). Nothing is written
to any table and no identity file is touched. Read-only.

Reads: a plan file (`--plan PATH`, e.g. one kb/_pile_mint_dryrun.py --out wrote), or, by default, the plan computed in
memory by kb/_pile_mint_dryrun.py's own compute_plan from the committed files; the vote tables come from the same
module's functions over the same inputs. Writes kb/status/held_subject_codes.json. The only date written is the
plan's own (today's, when the plan is computed in memory). A rerun on the same inputs writes the same bytes.

GUARD. A held count that falls by more than half against the committed file stops the write with a warning (a plan
whose held reasons were renamed would otherwise publish a near-empty list without a word), unless --expect-fall names
the fall as expected.

  python3 kb/_held_subject_codes.py [--plan PATH] [--out PATH] [--expect-fall]
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)

OUT = os.path.join("kb", "status", "held_subject_codes.json")
TITLES = os.path.join("kb", "status", "local_subject_titles.json")
EXAMPLES = 5
NEAR_MAX = 5
ROUTE_NAMES = {"ii": "college_subject_code", "iii": "statewide_subject_code"}
# The plan's held reasons a decided common subject code for the course's local subject would help release.
HELD_REASONS = ("no_route_gives_a_subj4", "route_i_below_its_floor", "shell_title_no_convention")
FALL_LIMIT = 0.5


def held_of(plan, ruled_kinds=()):
    """The plan's held courses a code decision bears on, each with its `reason` (one of HELD_REASONS). A shell title
    of a ruled kind is left out: the ruling, never a code decision, places it."""
    out = []
    for reason in HELD_REASONS:
        for r in (plan.get("held") or {}).get(reason) or []:
            if reason == "shell_title_no_convention" and r.get("kind") in ruled_kinds:
                continue
            out.append(dict(r, reason=reason))
    return out


def fall_guard(new_held, committed_path, expect_fall=False):
    """None when the write may go ahead, else the warning: the held count fell by more than half against the
    committed file and no flag names the fall as expected."""
    if expect_fall or not os.path.exists(committed_path):
        return None
    try:
        with open(committed_path, encoding="utf-8") as f:
            was = int(((json.load(f).get("totals") or {}).get("held")) or 0)
    except (OSError, ValueError, TypeError):
        return None
    if was and new_held < was * (1 - FALL_LIMIT):
        return (f"the held count falls from {was} to {new_held}, more than half; the plan's held lists may have "
                "changed meaning. Nothing written. Pass --expect-fall when the fall is expected.")
    return None


def normsubj(s):
    """kb/_seed_coci_minted_mids.py normsubj: the subject map's key form (upper case, letters and digits only)."""
    return re.sub(r"[^A-Z0-9]", "", str(s or "").upper())


def college_key(s):
    """kb/_build_local_subject_titles.py college_key."""
    return re.sub(r"[^a-z0-9]+", " ", str(s or "").lower()).strip()


def winner(counter):
    """kb/_pile_mint_dryrun.py winner, without the leave-out: (subj4 or "" on a tie, support, share) or None."""
    c = Counter(counter or {})
    n = sum(c.values())
    if not n:
        return None
    top = sorted(c.items(), key=lambda kv: (-kv[1], kv[0]))
    if len(top) > 1 and top[0][1] == top[1][1]:
        return ("", n, top[0][1] / n)
    return (top[0][0], n, top[0][1] / n)


def _votes(n):
    return f"{n} vote" if n == 1 else f"{n} votes"


def vote(counter, floor, short=False):
    """One route's evidence for one code: what it voted and why that missed the floor."""
    if short:
        return {"winner": None, "votes": 0, "share": None,
                "missed": "a code of two characters or fewer gets no statewide vote"}
    w = winner(counter)
    if not w:
        return {"winner": None, "votes": 0, "share": None,
                "missed": "no identity-holding course under this code votes"}
    subj4, n, share = w
    top = dict(sorted(Counter(counter).items(), key=lambda kv: (-kv[1], kv[0]))[:3])
    out = {"winner": subj4 or None, "votes": n, "share": round(share, 4), "tally": top}
    if not subj4:
        out["missed"] = "a tie at the top of the vote"
    elif not floor:
        out["missed"] = "no floor reaches 98% on the self-recall test"
    elif n < floor["support_min"] and share < floor["share_min"]:
        out["missed"] = f"{_votes(n)} under the floor of {floor['support_min']}, and a share under {floor['share_min']:.2f}"
    elif n < floor["support_min"]:
        out["missed"] = f"{_votes(n)} under the floor of {floor['support_min']}"
    elif share < floor["share_min"]:
        out["missed"] = f"a share of {share:.2f} under the floor of {floor['share_min']:.2f}"
    else:
        out["missed"] = "the vote reached its floor, and the subject map reads another discipline for the code"
    return out


def near_entries(ns, disc_map):
    """The subject map's keys that share the code's first three characters, or that one extends the other. Spelling
    only: a near entry is a lead for a person, never a decision."""
    if len(ns) < 2:
        return []
    hits = []
    for k in sorted(disc_map):
        if k == ns:
            continue
        if (len(ns) >= 3 and len(k) >= 3 and k[:3] == ns[:3]) or k.startswith(ns) or (ns.startswith(k) and len(k) >= 2):
            hits.append({"key": k, "discipline": disc_map[k]})
    hits.sort(key=lambda h: (abs(len(h["key"]) - len(ns)), h["key"]))
    return hits[:NEAR_MAX]


def printed_names(titles_doc):
    """(college key, normalized code) -> the printed subject name from the Subjects card's file."""
    out = {}
    cols = (titles_doc or {}).get("columns") or []
    if "code" not in cols or "printed_name" not in cols:
        return out
    ci, pi = cols.index("code"), cols.index("printed_name")
    for c in (titles_doc or {}).get("colleges") or []:
        ck = college_key(c.get("college"))
        for r in c.get("rows") or []:
            if r[pi]:
                out.setdefault((ck, normsubj(r[ci])), r[pi])
    return out


def build(held, thresholds, col, state, disc_map, titles_doc, short_max=2, sources=None):
    """Pure. held: held_of(plan), each row with its reason. thresholds: {route name: floor or None}. col:
    {(college, ns): Counter}. state: {ns: Counter}. Returns the document."""
    names = printed_names(titles_doc)
    by_code = defaultdict(lambda: defaultdict(list))
    for r in held:
        by_code[normsubj(r["subject"])][r["college"]].append(r)
    f2, f3 = thresholds.get(ROUTE_NAMES["ii"]), thresholds.get(ROUTE_NAMES["iii"])
    codes = []
    for ns, by_col in by_code.items():
        colleges = []
        whys = Counter()
        spell = Counter()
        reasons = Counter()
        for college in sorted(by_col):
            rows = sorted(by_col[college], key=lambda r: (r["title"], r["control_number"]))
            for r in rows:
                reason = r.get("reason") or HELD_REASONS[0]
                reasons[reason] += 1
                if reason == "no_route_gives_a_subj4":
                    whys[r.get("why") or "no route reaches its floor"] += 1
                elif reason == "route_i_below_its_floor":
                    whys[f"route (i) reads {r.get('subj4')}, right for {r.get('right')} of {r.get('holders')} "
                         "holders, under its 98% floor"] += 1
                spell[r["subject"]] += 1
            colleges.append({
                "college": college, "held": len(rows),
                "printed_name": names.get((college_key(college), ns)),
                "control_numbers": [r["control_number"] for r in rows],
                "reasons": [r.get("reason") or HELD_REASONS[0] for r in rows],
                "_titles": [r["title"] for r in rows[:EXAMPLES]],
                "college_vote": vote(col.get((college, ns)), f2),
            })
        colleges.sort(key=lambda c: (-c["held"], c["college"]))
        examples = []
        for c in colleges:
            for t in c.pop("_titles"):
                if len(examples) < EXAMPLES:
                    examples.append({"title": t, "college": c["college"]})
        sv = vote(state.get(ns), f3, short=len(ns) <= short_max)
        # A suggestion is the statewide winner when it has one, else the college vote with the most votes. Labeled a
        # suggestion with its votes: it missed the floor, so it decides nothing.
        sug = None
        if sv.get("winner"):
            sug = {"subj4": sv["winner"], "from": "statewide vote", "votes": sv["votes"], "share": sv["share"]}
        else:
            best = sorted((c for c in colleges if c["college_vote"].get("winner")),
                          key=lambda c: (-c["college_vote"]["votes"], c["college"]))
            if best:
                v = best[0]["college_vote"]
                sug = {"subj4": v["winner"], "from": "vote at " + best[0]["college"], "votes": v["votes"],
                       "share": v["share"]}
        held_n = sum(c["held"] for c in colleges)
        codes.append({
            "code": sorted(spell.items(), key=lambda kv: (-kv[1], kv[0]))[0][0], "key": ns,
            "spellings": sorted(spell), "held": held_n, "pairs": len(colleges), "colleges": colleges,
            "by_reason": dict(sorted(reasons.items())),
            "printed_names": sorted({c["printed_name"] for c in colleges if c["printed_name"]}),
            "examples": examples,
            "subject_map": {"reads": disc_map.get(ns), "notes": dict(sorted(whys.items(), key=lambda kv: (-kv[1], kv[0])))},
            "statewide_vote": sv, "suggestion": sug, "near_entries": near_entries(ns, disc_map),
        })
    codes.sort(key=lambda c: (-c["held"], c["key"]))
    ranked = [c["held"] for c in codes]
    pairs = sum(len(c["colleges"]) for c in codes)
    return {
        "_what": ("The local subject codes the pile mint holds on (the held reasons a common subject code bears on: "
                  "no route, route (i) under its floor, a shell title with no convention), ranked by the held "
                  "courses a decided common subject code would help release. Read-only; nothing here is a decision."),
        "_rule": ("Codes are compared in the subject map's key form (upper case, letters and digits only), statewide; "
                  "each college under a code is listed with its own held courses. A suggestion is the vote's winner "
                  "with its votes and share; it missed the 98% self-recall floor, which is why the course is held, "
                  "so it decides nothing. Near entries share the first three characters or extend the code. A TOP "
                  "code is never read."),
        "_generated_by": "kb/_held_subject_codes.py",
        "_sources": sources or {},
        "floors": {"college_subject_code": f2, "statewide_subject_code": f3},
        "totals": {"held": sum(ranked), "codes": len(codes), "pairs": pairs,
                   "by_reason": dict(sorted(Counter(r.get("reason") or HELD_REASONS[0] for r in held).items())),
                   "top_20_release": sum(ranked[:20]),
                   "with_suggestion": sum(1 for c in codes if c["suggestion"]),
                   "with_printed_name": sum(1 for c in codes if c["printed_names"])},
        "codes": codes,
    }


def vote_tables(inp, pm):
    """The identity-holding courses' votes, built exactly as kb/_pile_mint_dryrun.py compute_plan builds them."""
    courses, members = inp["courses"], inp["members"]
    by_cn = pm.holders(members)
    ctrl_rows = Counter(c["ctrl"] for c in courses)
    holding, seen = [], set()
    for c in courses:
        if c["ctrl"] in seen or ctrl_rows[c["ctrl"]] > 1 or c["ctrl"] not in by_cn:
            continue
        seen.add(c["ctrl"])
        s4 = pm.own_subj4(by_cn[c["ctrl"]], members)
        if s4:
            holding.append((c["college"], pm.seed.normsubj(c["subj"]), s4))
    return pm.vote_tables(holding)


def dump(doc):
    return json.dumps(doc, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n"


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--plan", default=None, help="a plan.json kb/_pile_mint_dryrun.py wrote; default: computed in memory")
    ap.add_argument("--out", default=os.path.join(ROOT, OUT))
    ap.add_argument("--expect-fall", action="store_true", help="the held count may fall by more than half")
    a = ap.parse_args(argv)
    import _pile_mint_dryrun as pm  # noqa: E402  (load_inputs, compute_plan, holders, own_subj4, vote_tables)
    inp = pm.load_inputs()
    if a.plan:
        with open(a.plan, encoding="utf-8") as f:
            plan = json.load(f)
        plan_from = "a plan file kb/_pile_mint_dryrun.py wrote"
    else:
        plan = pm.compute_plan(inp, pm.date.today().isoformat())
        plan_from = "computed in memory by kb/_pile_mint_dryrun.py compute_plan"
    held = held_of(plan, tuple(getattr(pm, "RULED_BY_KIND", {})))
    thresholds = (plan.get("self_recall") or {}).get("thresholds") or {}
    col, state = vote_tables(inp, pm)
    with open(os.path.join(ROOT, TITLES), encoding="utf-8") as f:
        titles_doc = json.load(f)
    sources = {"plan": plan_from, "plan_date": plan.get("_generated_at"),
               "identity_file": (plan.get("inputs") or {}).get("identity_file"),
               "course_list": (plan.get("inputs") or {}).get("course_list"),
               "printed_names": TITLES, "subject_map": "kb/reference/subject_discipline_map.json"}
    doc = build(held, thresholds, col, state, inp["disc_map"], titles_doc, short_max=pm.SUBJ_SHORT, sources=sources)
    warn = fall_guard(doc["totals"]["held"], a.out, a.expect_fall)
    if warn:
        print("[held_subject_codes] WARNING: " + warn)
        return 1
    with open(a.out, "w", encoding="utf-8") as f:
        f.write(dump(doc))
    t = doc["totals"]
    print(f"[held_subject_codes] {t['held']} held courses, {t['codes']} codes, {t['pairs']} college-and-code pairs; "
          f"the top 20 codes release {t['top_20_release']}")
    for c in doc["codes"][:10]:
        print(f"  {c['code']:<8} {c['held']:>4}  {len(c['colleges'])} colleges")
    return 0


if __name__ == "__main__":
    sys.exit(main())
