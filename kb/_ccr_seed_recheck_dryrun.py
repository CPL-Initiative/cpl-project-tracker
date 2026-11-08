#!/usr/bin/env python3
"""Dry run: can a second signal re-check the seed discipline on the Common Course Reference's capped cards? (S612)

Sam's Commons ruling 4 (2026-11-08, #2921) makes the Common Course Reference the next dataset, one high-impact
discipline or seed family at a time. Its largest person item is the auditor's `seed_untouched_discipline` tag
(kb/_row_audit.py): a minted common course whose discipline carries no `discipline_source`, the original Phase B
seed that no pass ever re-checked, capped at 0.79. No procedure exists for it (`carry: no_procedure`).

This run measures each available second signal on those cards. Two were checked and set aside, so the run reports
TOP alone:

  the subject map (kb/discipline_inference.json)  fills blanks; it covers few of these cards, and the seed was
                                                  itself a subject-code heuristic, so its agreement is not a second
                                                  signal;
  the CSR's local_subject_variants                are tallied FROM the cards' own disciplines, so checking a card
                                                  against them confirms the seed with itself;
  TOP (kb/top_discipline_map.json)                faculty-entered in COCI, independent of the subject code, and a
                                                  last-in-line CORROBORATOR under the standing TOP rule: usable when
                                                  a second signal (here the seed) agrees, never alone.

Per card, its members' TOP codes vote through the TOP map (catch-all codes are not in the map, so they cast no vote):

  top_agrees    the plurality vote names the card's discipline;
  top_differs   the plurality names another discipline (a curator's card: the two signals disagree);
  no_top        no member's TOP code maps.

The course description (Sam, Open Asks Sheet 173 note, 2026-11-08: "Can't we use course description and slos and
objectives to confirm rather than top or alongside top") is the second signal: kb/_ccr_desc_signal.py learns each
discipline's vocabulary from trusted records and is scored held out before it judges a card. `combine()` gives the
verdict from both. SLOs reach thirteen colleges so far and join when the nightly read covers more.

Curated cards are left out (reviewed_at, a curation-overlay discipline or merge_into). Course CIP, the exit from TOP
(fall 2026), is not filled yet. Read-only: nothing in the catalog changes, and lifting a card's score is Sam's call.

Writes kb/ccr_seed_recheck_dryrun/{plan.json, report.md}; `--discipline NAME` adds that discipline's worklist.
"""
import argparse
import json
import os
import sys
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "ccr_seed_recheck_dryrun")
BATCH = 6     # a first sitting: six cards at most (Commons ruling 2)


def load(name):
    with open(os.path.join(HERE, name), encoding="utf-8") as f:
        return json.load(f)


def top_code(member):
    return str(member.get("top_code") or "").split(":")[0].strip()


def curated(cid, rec, cur):
    c = cur.get(cid) or {}
    return bool(rec.get("reviewed_at") or c.get("discipline") or c.get("merge_into"))


def classify(courses, memberships, topmap, cur, model=None, desc=None):
    """{discipline: {kind: [row, ...]}} over the seed-untouched, uncurated cards. With a description `model`
    (kb/_ccr_desc_signal.py), each row also carries `desc` (the best fits) and `desc_kind`."""
    out = defaultdict(lambda: defaultdict(list))
    for cid, rec in courses.items():
        if cid.startswith("_") or not isinstance(rec, dict):
            continue
        disc = rec.get("discipline")
        if not disc or rec.get("discipline_source") or curated(cid, rec, cur):
            continue
        members = memberships.get(cid) or []
        votes = Counter(topmap[t] for t in (top_code(m) for m in members) if t in topmap)
        row = {"id": cid, "title": rec.get("common_title"), "members": len(members),
               "colleges": len({m.get("college") for m in members}), "votes": dict(votes.most_common(3))}
        if model is not None:
            import _ccr_desc_signal as S
            toks = S.tokens(S.record_text(cid, rec, memberships, desc or {}))
            r = model.rank(toks) if len(toks) >= 5 else []
            row["desc"] = r
            row["desc_kind"] = ("no_desc" if not r else
                                ("desc_agrees" if r[0][0] == disc else "desc_differs") + "_" + S.margin_band(r))
        if not votes:
            kind = "no_top"
        else:
            best = votes.most_common()
            tied = [d for d, n in best if n == best[0][1]]
            kind = "top_agrees" if tied == [disc] else "top_differs"
        out[disc][kind].append(row)
    return out


def combine(top_kind, desc_kind):
    """The card's verdict from both signals. Confirmed: the description fits the seed with a clear margin and TOP
    does not name another discipline. For a curator: both name another discipline, or a clear description does and
    TOP does not side with the seed."""
    if desc_kind == "desc_agrees_clear" and top_kind != "top_differs":
        return "confirmed_by_description" + ("_and_top" if top_kind == "top_agrees" else "")
    # TOP agreeing with the seed outvotes a description that differs (Swimming read as Environmental Technologies on
    # "water"): two signals against one stay unsettled rather than reach a person.
    if (desc_kind == "desc_differs_clear" and top_kind != "top_agrees") or \
            (desc_kind.startswith("desc_differs") and top_kind == "top_differs"):
        return "for_a_curator"
    return "unsettled"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--discipline", help="also write this discipline's worklist")
    args = ap.parse_args()
    sys.path.insert(0, HERE)
    from _alias_canon import alternate_to_canonical, resolve_target
    rev = alternate_to_canonical()
    topmap = {c: resolve_target(d, rev, "top_discipline_map[%s]" % c)
              for c, d in load("top_discipline_map.json")["map"].items()}
    courses = load("coci_minted_courses.json")["courses"]
    mem = load("coci_minted_memberships.json")
    mem = mem.get("memberships", mem)
    cur = load("coci_curation.json").get("curations", {})
    import _ccr_desc_signal as S
    desc = S.load_descriptions()
    singles = load("coci_minted_singletons.json")["courses"]
    train = S.trusted(courses, singles, cur, mem, desc)
    evaluation = S.evaluate(train)
    model = S.Model([(d, t) for _c, d, t, _b in train])
    out = classify(courses, mem, topmap, cur, model, desc)
    kinds = ("top_agrees", "top_differs", "no_top")
    by = {d: {k: len(v.get(k, [])) for k in kinds} for d, v in out.items()}
    tot = {k: sum(r[k] for r in by.values()) for k in kinds}
    order = sorted(by, key=lambda d: -sum(by[d].values()))
    os.makedirs(OUT, exist_ok=True)
    both = Counter()
    by_both = defaultdict(Counter)
    for d, v in out.items():
        for k in kinds:
            for r in v.get(k, []):
                key = combine(k, r.get("desc_kind", "no_desc"))
                both[key] += 1
                by_both[d][key] += 1
    plan = {"schema": 2, "counts": tot, "cards": sum(tot.values()), "by_discipline": {d: by[d] for d in order},
            "signals": dict(both), "signals_by_discipline": {d: dict(by_both[d]) for d in order},
            "description_model": {"trained_on": len(train), "held_out": evaluation}}
    if args.discipline:
        rows = out.get(args.discipline) or {}
        plan["worklist"] = {"discipline": args.discipline,
                            "batch": sorted([r for k in kinds for r in rows.get(k, [])
                                             if combine(k, r.get("desc_kind", "no_desc")) == "for_a_curator"],
                                            key=lambda r: (-r["colleges"], r["id"]))[:BATCH],
                            **{k: sorted(rows.get(k, []), key=lambda r: r["id"]) for k in kinds}}
    with open(os.path.join(OUT, "plan.json"), "w", encoding="utf-8") as f:
        json.dump(plan, f, indent=1, sort_keys=True)
        f.write("\n")
    lines = ["# The Common Course Reference's seed disciplines, re-checked against TOP (dry run)", "",
             "Generated by `kb/_ccr_seed_recheck_dryrun.py`. Read-only. TOP corroborates only: a card it agrees with "
             "has two signals; a card it differs on is a curator's.", "",
             "Uncurated seed cards: %d. TOP agrees on %d, differs on %d, casts no vote on %d." % (
                 plan["cards"], tot["top_agrees"], tot["top_differs"], tot["no_top"]), "",
             "| Discipline | Cards | TOP agrees | TOP differs | No TOP vote |", "|---|---:|---:|---:|---:|"]
    for d in order:
        r = by[d]
        lines.append("| %s | %d | %d | %d | %d |" % (d, sum(r.values()), r["top_agrees"], r["top_differs"], r["no_top"]))
    ev = evaluation
    lines += ["", "## The description signal (Sam, Sheet 173 note, 2026-11-08)", "",
              "Learned from %d records a curator or the subject map placed; seed cards are never training data. Held out, "
              "it names the trusted discipline %.0f%% of the time, %.0f%% when its margin is clear (%d of %d), %.0f%% on "
              "curator-labelled records alone." % (len(train), 100 * ev["all"]["rate"], 100 * ev["band:clear"]["rate"],
                                                   ev["band:clear"]["right"], ev["band:clear"]["n"], 100 * ev["curator"]["rate"]), "",
              "| Verdict | Cards |", "|---|---:|"]
    for k in ("confirmed_by_description_and_top", "confirmed_by_description", "for_a_curator", "unsettled"):
        lines.append("| %s | %d |" % (k.replace("_", " "), both.get(k, 0)))
    if args.discipline:
        bd = by_both.get(args.discipline, {})
        lines += ["", "%s: %s." % (args.discipline, ", ".join("%s %d" % (k.replace("_", " "), bd.get(k, 0)) for k in (
            "confirmed_by_description_and_top", "confirmed_by_description", "for_a_curator", "unsettled")))]
    if args.discipline:
        w = plan["worklist"]
        lines += ["", "## %s: the first batch for a curator (most colleges first)" % args.discipline, "",
                  "| Card | Title | Colleges | Description fits | TOP votes |", "|---|---|---:|---|---|"]
        for r in w["batch"]:
            lines.append("| %s | %s | %d | %s | %s |" % (r["id"], r["title"], r["colleges"],
                                                       ", ".join("%s %.2f" % tuple(x) for x in (r.get("desc") or [])[:2]),
                                                       ", ".join("%s %d" % kv for kv in r["votes"].items())))
    with open(os.path.join(OUT, "report.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    print("seed re-check dry run:", tot)
    return 0


if __name__ == "__main__":
    sys.exit(main())
