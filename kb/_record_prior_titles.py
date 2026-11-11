#!/usr/bin/env python3
"""Record the common title each ASE local exhibit sits under, so a fold does not erase its test mix.

WHY. A credential fold (kb/_cred_rename_apply.py) rewrites a raw title's common title in place: after Sam's
30 ASE bundle folds, "ASE Bundle — A4, A5" exists only as an alias of "ASE Certificate Bundles", and nothing
says which local exhibit sat under it. That old title is the cleanest statement of the exhibit's test mix
(kb/test_mix.py), so this script keeps it per exhibit id in kb/reference/exhibit_prior_titles.json.

THE RULE. Each run records an exhibit's common title today, except where the title already recorded is one
the exhibit's title today replaced (kb/credential_aliases.py: an applied rename or merge). Then the old title
stays, which is the point. An exhibit reclassified to an unrelated title takes the new one.

Scope: exhibits whose title is issued by, or named for, a family with a test-code table (ASE today,
kb/cert_naming.py). Reads statewide_data.js; writes only the one JSON file. Run it after the dashboard
pipeline, before any credential rename apply:  python3 kb/_record_prior_titles.py [--check]
"""
import argparse
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import cert_naming  # noqa: E402
import credential_aliases  # noqa: E402
import test_mix  # noqa: E402


def load_js(path):
    s = open(path, encoding="utf-8").read()
    i = re.search(r"window\.\w+\s*=\s*", s).end()
    return json.JSONDecoder().raw_decode(s[i:])[0]


def in_scope(e):
    return (e.get("issuing_agency") == cert_naming.ASE_ISSUER or cert_naming.ASE_NAMED.match(e.get("unified_title") or "")
            or test_mix.from_title(e.get("unified_title") or "") is not None)


def build(sw, have, aliases):
    out = {}
    for e in sw.get("exhibits") or []:
        if not in_scope(e):
            continue
        t = e["unified_title"]
        for i in e.get("exhibit_ids") or []:
            i = i.upper()
            old = have.get(i)
            out[i] = old if old and old != t and old in aliases.get(t, []) else t
    # An id the statewide data no longer carries keeps its record: it may come back under the same title.
    for i, old in have.items():
        out.setdefault(i, old)
    return dict(sorted(out.items()))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--statewide", default=os.path.join(ROOT, "statewide_data.js"))
    ap.add_argument("--check", action="store_true")
    a = ap.parse_args()
    have = test_mix.load_prior()
    titles = build(load_js(a.statewide), have, credential_aliases.load(ROOT))
    doc = {"_about": "Exhibit id -> the common title it sat under before any credential fold, so its test mix "
                     "survives the fold (kb/test_mix.py). Written by kb/_record_prior_titles.py.",
           "titles": titles}
    if a.check:
        if titles != have:
            print("exhibit_prior_titles.json is stale: run python3 kb/_record_prior_titles.py")
            sys.exit(1)
        print("exhibit_prior_titles.json ok")
        return
    os.makedirs(os.path.dirname(test_mix.PRIOR), exist_ok=True)
    with open(test_mix.PRIOR, "w", encoding="utf-8") as f:
        json.dump(doc, f, indent=1, ensure_ascii=False)
        f.write("\n")
    print("%s: %d exhibits" % (test_mix.PRIOR, len(titles)))


if __name__ == "__main__":
    main()
