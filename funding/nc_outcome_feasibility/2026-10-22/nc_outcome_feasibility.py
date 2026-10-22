#!/usr/bin/env python3
"""Is "5% of a noncredit program's courses carry an exhibit-based CPL opportunity" a feasible target?

Sam's ask of 2026-10-22: with no reliable noncredit-origin flag (LocID2) coming for a while, the noncredit
share of each award keeps its FTES sizing and releases on outcomes a noncredit program can meet without it.
His second outcome names 5% of the program's noncredit courses, a guess he asked us to test.

Inputs, beside this file:
  nc_shares.json    every institution's award and noncredit share from the model (nc_shares_dump.js) under the
                    live config of 2026-10-22 17:32Z (md5 9c944a82; Scenario 3 published, noncredit 15%)
  nc_courses.json   COCI course counts by funding category, noncredit programs, title-identical credit and
                    noncredit pairs ("mirrored candidates"), credential-like titles and MAP exhibits per college
                    (nc_courses.sql, read through the Supabase MCP the same day)

Output: summary.json and the printed tables. Reads only; nothing here changes the model.

  python3 funding/nc_outcome_feasibility/2026-10-22/nc_outcome_feasibility.py
"""
import json
import math
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..", "..", "..")

STOP = {"college", "community", "of", "the", "city", "junior"}
ALIAS = {"la": "los angeles", "sd": "san diego", "cont": "continuing", "ed": "education", "canada": "cañada"}
# Roster short names the token match cannot reach.
OVERRIDE = {"West Hills Coalinga": "Coalinga College", "West Hills Lemoore": "Lemoore College",
            "LA Swest": "Los Angeles Southwest College", "Calbright": "Calbright College Credit",
            "SD Cont. Ed": "San Diego College of Continuing Education", "NOCE": "North Orange Continuing Education"}


def norm(s):
    s = re.sub(r"[^a-z0-9ñ ]+", " ", s.lower().replace(".", ""))
    toks = []
    for t in s.split():
        toks.extend(ALIAS.get(t, t).split())
    return [t for t in toks if t not in STOP]


def match(roster_name, coci_names):
    """The COCI spelling of a funding-roster short name: every token of the short name inside the COCI name,
    the exact token set first, then the shortest; never a '... Credit' location."""
    if roster_name in OVERRIDE:
        return OVERRIDE[roster_name]
    rn = set(norm(roster_name))
    hits = [c for c in coci_names if rn <= set(norm(c)) and not c.endswith(" Credit")]
    exact = [c for c in hits if set(norm(c)) == rn]
    if exact:
        return exact[0]
    return sorted(hits, key=lambda c: len(norm(c)))[0] if hits else None


def pct_of(n, pct):
    return math.ceil((n or 0) * pct)


RULES = {
    "5% of all noncredit courses": lambda r: pct_of(r["nc_all"], 0.05),
    "5% of CDCP noncredit courses": lambda r: pct_of(r["nc_cdcp"], 0.05),
    "10% of CDCP noncredit courses": lambda r: pct_of(r["nc_cdcp"], 0.10),
    "floor 2, 5% of CDCP, cap 10": lambda r: max(2, min(10, pct_of(r["nc_cdcp"], 0.05))),
    "floor 3, 5% of CDCP, cap 15": lambda r: max(3, min(15, pct_of(r["nc_cdcp"], 0.05))),
    "by noncredit FTES band (2/4/8/12)": lambda r: (2 if (r["noncredit_ftes"] or 0) < 300 else 4 if (r["noncredit_ftes"] or 0) < 1000
                                                 else 8 if (r["noncredit_ftes"] or 0) < 3000 else 12),
}
RECOMMENDED = "floor 2, 5% of CDCP, cap 10"


def q(v, p):
    v = sorted(v)
    return v[min(len(v) - 1, int(round(p * (len(v) - 1))))] if v else 0


def dist(v):
    return {"min": min(v), "p10": q(v, .1), "p25": q(v, .25), "median": q(v, .5), "p75": q(v, .75), "p90": q(v, .9),
            "max": max(v), "sum": sum(v)}


def main():
    shares = json.load(open(os.path.join(HERE, "nc_shares.json")))
    courses = json.load(open(os.path.join(HERE, "nc_courses.json")))
    cmap = {c["college"]: c for c in courses}
    rows, unmatched = [], []
    for r in shares["rows"]:
        m = match(r["college"], list(cmap))
        if not m:
            unmatched.append(r["college"])
        c = cmap.get(m, {})
        rows.append(dict(r, coci=m, **{k: c.get(k) for k in (
            "nc_all", "nc_cdcp", "nc_wfp", "credit", "cert_like", "nc_programs", "exhibits", "non_military",
            "ind_cert", "cbe", "ccc_adopted", "mirrored", "mirrored_cdcp", "mirrored_titles")}))
    nc = [r for r in rows if (r["nc_award"] or 0) > 0]
    supply = lambda r: (r["mirrored_cdcp"] or 0) + (r["cert_like"] or 0)
    out = {"config": "cpl_funding_config md5 9c944a82 (2026-10-22 17:32Z), " + shares["scenario"] + " " + shares["window"],
           "unmatched_roster_names": unmatched,
           "institutions_with_a_noncredit_share": len(nc), "institutions": len(rows),
           "noncredit_shares_total": round(sum(r["nc_award"] for r in nc)),
           "share_bands": [], "distributions": {}, "rules": {}, "threshold": {}}
    print("institutions with a noncredit share: %d of %d; noncredit shares $%s" % (len(nc), len(rows), f"{out['noncredit_shares_total']:,}"))
    for a, b in [(0, 5000), (5000, 10000), (10000, 25000), (25000, 50000), (50000, 100000), (100000, 10**12)]:
        g = [r for r in nc if a <= r["nc_award"] < b]
        out["share_bands"].append({"from": a, "to": b, "institutions": len(g), "total": round(sum(r["nc_award"] for r in g))})
        print("  noncredit share $%d to %s: %d institutions, $%s" % (a, "up" if b == 10**12 else b, len(g), f"{round(sum(r['nc_award'] for r in g)):,}"))
    for key in ("nc_all", "nc_cdcp", "mirrored_cdcp", "cert_like", "exhibits", "non_military"):
        out["distributions"][key] = dist([r[key] or 0 for r in nc])
        print("  %-14s %s" % (key, out["distributions"][key]))
    print("\nTARGET RULES: exhibits required per institution, over the %d institutions with a noncredit share" % len(nc))
    for name, f in RULES.items():
        t = [f(r) for r in nc]
        short = [r["college"] for r in nc if f(r) > supply(r)]
        out["rules"][name] = {"per_institution": dist(t), "statewide_total": sum(t), "target_exceeds_supply": len(short),
                              "target_exceeds_supply_names": short}
        print("  %-34s median %2d p90 %2d max %2d statewide %4d; target above mirrored + credential-like supply at %d"
              % (name, q(t, .5), q(t, .9), max(t), sum(t), len(short)))
    rec = RULES[RECOMMENDED]
    for thr in (100, 250, 300, 500):
        above = [r for r in nc if r["nc_only"] or (r["noncredit_ftes"] or 0) >= thr]
        below = [r for r in nc if not r["nc_only"] and (r["noncredit_ftes"] or 0) < thr]
        out["threshold"][str(thr)] = {
            "at_or_above": len(above), "at_or_above_total": round(sum(r["nc_award"] for r in above)),
            "below": len(below), "below_total": round(sum(r["nc_award"] for r in below)),
            "largest_below": round(max([r["nc_award"] for r in below] or [0])),
            "recommended_rule_exhibits_above": sum(rec(r) for r in above),
            "above_with_supply_today": sum(1 for r in above if rec(r) <= supply(r)),
            "above_with_no_exhibit_in_map": sum(1 for r in above if not (r["exhibits"] or 0))}
        print("threshold %d noncredit FTES: %s" % (thr, out["threshold"][str(thr)]))
    z = [r for r in nc if not (r["exhibits"] or 0)]
    out["no_exhibit_in_map"] = {"institutions": len(z), "noncredit_shares_total": round(sum(r["nc_award"] for r in z))}
    out["recommended_rule"] = RECOMMENDED
    out["per_institution"] = [{k: r.get(k) for k in ("college", "nc_only", "noncredit_ftes", "nc_award", "nc_all", "nc_cdcp",
                                                     "mirrored_cdcp", "cert_like", "exhibits", "ccc_adopted")}
                              | {"target_recommended": rec(r), "supply": supply(r)} for r in sorted(nc, key=lambda r: -r["nc_award"])]
    json.dump(out, open(os.path.join(HERE, "summary.json"), "w"), indent=1)
    print("\nwrote summary.json; unmatched roster names:", unmatched)


if __name__ == "__main__":
    main()
