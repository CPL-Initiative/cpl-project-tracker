#!/usr/bin/env python3
"""Synonym-map CANDIDATE ambiguity measurement (Session 62).

kb/synonym_map.json grows one MEASURED pair at a time. Its rule #2: "Add a pair
ONLY after MEASURING that the canonical short token is unambiguous as a
standalone word in the title data (grep the staging titles for the bare token
first)." This script operationalizes that check: for each candidate
(short_token, [expansion phrases]) it reports, over the worklist's member pool
(minted parents + Stand-Alone singletons):

  * how many titles use the BARE short token as a standalone word, and the
    DISCIPLINE spread of those titles — the ambiguity signal. A clean pair is
    dominated by ONE discipline (high purity); a token that scatters across
    unrelated disciplines (CS, IT, MA, CD) is ambiguous → exclude it.
  * how many titles use each EXPANSION phrase — the grouping YIELD the pair buys.
  * a few sample titles for eyeballing.

It modifies nothing. The pair's impact on group COUNTS is measured separately by
kb/_sug_segment_dryrun.py (which loads the live map). Append new candidates to
CANDIDATES and re-run BEFORE editing synonym_map.json.

Run from repo root:  python3 kb/_synonym_candidate_dryrun.py
"""
import json
import os
import re
from collections import Counter

SD = os.path.dirname(os.path.abspath(__file__))

# (short_token, [expansion phrases], verdict-note). The Session-62 pass kept as a
# self-documenting record of what was added and what was rejected (and why).
CANDIDATES = [
    ("ece",  ["early childhood education"],
     "ADDED — clean, Child Dev/ECE"),
    ("emt",  ["emergency medical technician", "emergency medical technology"],
     "ADDED — clean, all emergency-medical (firefighter/lifeguard EMT still = EMT)"),
    ("cna",  ["certified nursing assistant", "certified nurse assistant"],
     "ADDED — clean, health/nursing; also unifies the nurse/nursing variant"),
    ("hvac", ["heating ventilation and air conditioning"],
     "ADDED — clean, all HVAC trades; pulls expansion stragglers into a 114-strong family"),
    ("lvn",  ["licensed vocational nursing", "licensed vocational nurse"],
     "ADDED — clean, all nursing"),
    ("cis",  ["computer information systems", "computer information science"],
     "REJECTED — low bare yield + Systems/Science split"),
    ("cd",   ["child development"],
     "REJECTED — 'cd' collides with CD-ROM / compact-disc"),
    ("ma",   ["medical assistant", "medical assisting"],
     "REJECTED — 2-letter token, inherently ambiguous (Master of Arts, …)"),
]


def norm(t):
    t = re.sub(r"\([^)]*\)", " ", str(t or "").lower())
    t = re.sub(r"[^a-z0-9 ]+", " ", t)
    return " ".join(t.split())


def load_rows():
    rows = []
    for fn in ("coci_minted_courses.json", "coci_minted_singletons.json"):
        for _cid, rec in json.load(open(os.path.join(SD, fn)))["courses"].items():
            rows.append((rec.get("common_title") or "",
                         rec.get("subject") or "", rec.get("discipline") or ""))
    return rows


def main():
    rows = load_rows()
    norms = [(norm(t), t, s, d) for (t, s, d) in rows]
    try:
        in_map = set(json.load(open(os.path.join(SD, "synonym_map.json")))["synonyms"].values())
    except Exception:
        in_map = set()

    print("Synonym-candidate ambiguity check over %d staging titles "
          "(minted parents + Stand-Alone singletons).\n" % len(rows))
    print("Read the discipline spread as the unambiguity signal: one dominant discipline — "
          "OR a minority that is the SAME field (e.g. ESL-for-ECE listed under ESL, Fire-EMT "
          "under Fire Tech) — is SAFE. Only a scatter across UNRELATED fields means the bare "
          "token is ambiguous (CD→compact-disc, MA→Master of Arts): exclude it.\n")

    for tok, exps, note in CANDIDATES:
        rx = re.compile(r"\b" + re.escape(tok) + r"\b")
        bare = [(t, s, d) for (n, t, s, d) in norms if rx.search(n)]
        discs = Counter(d for _, _, d in bare if d)
        top = discs.most_common(1)[0] if discs else ("n/a", 0)
        purity = (top[1] / len(bare)) if bare else 0.0
        flag = " [IN MAP]" if tok in in_map else ""
        print("── %r%s: %s" % (tok, flag, note))
        print("   bare-token titles: %d | top-discipline purity: %.0f%% (%s)"
              % (len(bare), purity * 100, top[0]))
        print("   disciplines: %s" % dict(discs.most_common(4)))
        for ph in exps:
            prx = re.compile(r"\b" + re.escape(ph) + r"\b")
            n = sum(1 for tup in norms if prx.search(tup[0]))
            print("   expansion %r: %d titles" % (ph, n))
        for t, s, _d in bare[:4]:
            print("      · [%s] %r" % (s, t))
        print()
    print("Then measure group impact with: python3 kb/_sug_segment_dryrun.py")


if __name__ == "__main__":
    main()
