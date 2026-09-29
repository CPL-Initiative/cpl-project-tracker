# -*- coding: utf-8 -*-
"""Score the occupation matcher against Delta College's 139 human rulings.

WHY THIS EXISTS. `kb/_build_regional_cpl_opportunity.py` pairs an occupation with
a college's programs by title. Every fix to that pairing so far has been argued
from a handful of bad rows Sam happened to notice -- Commercial Pilots reaching
Commercial Music, Audiovisual Equipment Installers reaching Diesel Equipment
Technology. `kb/delta_offering_map.json` holds 139 occupations a human ruled
against Delta's actual catalog, which makes it a labeled test set: 52 confirmed,
38 potential, 49 none.

TWO SCORES, and the second is the one that matters.

  PAIR level  -- of the individual occupation-to-program pairs the matcher
                 proposes, how many did the human also name. Useful for tuning,
                 harsh by construction: a human names the programs that best
                 answer the question, not every program whose title overlaps.

  DECISION level -- for each occupation, does the matcher agree with the human
                 about whether this college has ANYTHING to offer. This is what
                 the tool actually renders: an occupation either appears as an
                 opportunity or it does not. A false positive here puts a wrong
                 row in front of a college.

Run:  python3 kb/_score_occupation_matcher.py [--verbose]
"""
import json
import re
import sys
import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def _load_builder():
    spec = importlib.util.spec_from_file_location(
        "rco", ROOT / "kb" / "_build_regional_cpl_opportunity.py")
    m = importlib.util.module_from_spec(spec)
    sys.modules["rco"] = m
    spec.loader.exec_module(m)
    return m


def norm_program(s):
    """Human rulings name a program as a college catalog does -- with the award in
    parentheses, and with '&' where COCI writes 'and'. Strip to a comparable key."""
    s = re.sub(r"\((?:[^()]*)\)", " ", s or "")          # drop the award parenthetical
    s = s.replace("&", " and ")
    s = re.sub(r"\b(a\.?s\.?-?t?|a\.?a\.?-?t?|cert|certificate|degree)\b", " ", s, flags=re.I)
    s = re.sub(r"[^a-z0-9]+", " ", s.lower())
    return " ".join(s.split())


def score(verbose=False):
    m = _load_builder()
    rulings = json.loads((ROOT / "kb" / "delta_offering_map.json").read_text())["occupations"]

    R, _DM = m.make_resolver()
    progs, cat = m.college_capability("San Joaquin Delta College", R)
    prog_titles = sorted({p["title"] for p in progs})
    if not prog_titles:
        raise SystemExit("no Delta programs loaded -- check the college name resolver")

    course_titles = sorted({c["title"] for c in cat})
    matcher = m.Matcher(prog_titles)
    cmatcher = m.Matcher(course_titles)
    by_norm = {}
    for t in prog_titles:
        by_norm.setdefault(norm_program(t), set()).add(t)

    tp = fp = fn = 0
    d_tp = d_fp = d_fn = d_tn = 0
    misses, wrong = [], []

    for occ, rule in sorted(rulings.items()):
        truth_raw = rule.get("programs") or []
        truth = set()
        for t in truth_raw:
            n = norm_program(t)
            truth |= by_norm.get(n, set())
            if n not in by_norm:                 # human named it; COCI spells it otherwise
                for k, v in by_norm.items():
                    if n and (n in k or k in n):
                        truth |= v
        pred = {t for t in prog_titles if matcher.hit(occ, t)}

        tp += len(pred & truth)
        fp += len(pred - truth)
        fn += len(truth - pred)

        # The tool renders an occupation as an opportunity when EITHER a program
        # or a course matches, and a human ruling names both, so the decision
        # score has to see both or it understates the tool.
        human_says_yes = bool(truth_raw or rule.get("courses"))
        tool_says_yes = bool(pred) or any(cmatcher.hit(occ, t) for t in course_titles)
        if human_says_yes and tool_says_yes:
            d_tp += 1
        elif human_says_yes and not tool_says_yes:
            d_fn += 1
            misses.append((occ, rule["fit"], (truth_raw or rule.get("courses") or [])[:2]))
        elif not human_says_yes and tool_says_yes:
            d_fp += 1; wrong.append((occ, rule["fit"], sorted(pred)[:2]))
        else:
            d_tn += 1

    def pr(t, f_p, f_n):
        p = t / (t + f_p) if (t + f_p) else 0.0
        r = t / (t + f_n) if (t + f_n) else 0.0
        f = 2 * p * r / (p + r) if (p + r) else 0.0
        return p, r, f

    p1, r1, f1 = pr(tp, fp, fn)
    p2, r2, f2 = pr(d_tp, d_fp, d_fn)
    out = {
        "occupations": len(rulings),
        "delta_programs": len(prog_titles),
        "delta_courses": len(course_titles),
        "pair": {"tp": tp, "fp": fp, "fn": fn,
                 "precision": round(p1, 3), "recall": round(r1, 3), "f1": round(f1, 3)},
        "decision": {"tp": d_tp, "fp": d_fp, "fn": d_fn, "tn": d_tn,
                     "precision": round(p2, 3), "recall": round(r2, 3), "f1": round(f2, 3),
                     "accuracy": round((d_tp + d_tn) / len(rulings), 3)},
    }
    print(json.dumps(out, indent=1))
    if verbose:
        print("\nFALSE POSITIVES — the human found nothing, the matcher found something:")
        for o, fit, pd in wrong:
            print(f"  [{fit}] {o[:44]:46} -> {'; '.join(pd)[:62]}")
        print("\nMISSES — the human found programs, the matcher found none:")
        for o, fit, td in misses:
            print(f"  [{fit}] {o[:44]:46} -> {'; '.join(td)[:62]}")
    return out


if __name__ == "__main__":
    score(verbose="--verbose" in sys.argv)
