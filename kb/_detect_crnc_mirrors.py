#!/usr/bin/env python3
"""Detect CR/NC mirror families among minted M-ID identities. READ-ONLY.

Doctrine v0.3, Q-CREDITNC (Sam, 2026-07-12): a college's *mirrored* CR/NC pair
— the same course offered in both a credit and a noncredit section, the NC
section free + taught by a vocationally-qualified instructor + bridged to
credit via Credit-by-Exam — is a CPL mechanism, NOT a D-3 band-purity
violation. So the auditor must NOT flag a credit/noncredit member mix as an
over-merge when the noncredit members are same-college same-subject mirrors of
credit members.

This script classifies every identity whose members mix credit + noncredit
bands into:
  - mirror        : EVERY noncredit member has a same-college same-subject
                    credit sibling → keep as one identity (D-3 suppressed).
  - partial_mirror: SOME (>=1, not all) NC members mirror → curator/faculty look.
  - band_mix      : NC members have NO same-college same-subject credit sibling
                    → a genuine credit/noncredit over-merge (D-3 split stands).
  - (identities with no CR/NC mix are omitted.)

Writes kb/crnc_mirrors.json: {id: {"class", "nc_total", "nc_mirrored",
"pairs": [[credit_member, nc_member], ...]}}. Consumers (kb/_row_audit.py,
kb/_ccr_trail.py) can read this to suppress the credit_mixed / D-3 signal for
`mirror` identities and surface the Credit-by-Exam CPL pairing instead.

Idempotent. Run from repo root: python3 kb/_detect_crnc_mirrors.py
"""
from __future__ import annotations

import json
import os
from collections import defaultdict
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))


def load(name):
    with open(os.path.join(HERE, name), encoding="utf-8") as f:
        return json.load(f)


def band(credit_status: str) -> str:
    cs = (credit_status or "").lower()
    if "noncredit" in cs or "non-credit" in cs:
        return "NC"
    if "credit" in cs:
        return "CR"
    return "?"


def classify(members: list) -> dict | None:
    """Return a mirror classification for one identity's members, or None if the
    identity does not mix credit and noncredit bands."""
    bands = {band(m.get("credit_status")) for m in members}
    if not ("CR" in bands and "NC" in bands):
        return None
    # index credit members by (college, subject) for the sibling lookup
    cr_keys = set()
    for m in members:
        if band(m.get("credit_status")) == "CR":
            cr_keys.add((m.get("college"), (m.get("subject") or "").strip()))
    pairs, nc_total, nc_mirrored = [], 0, 0
    for m in members:
        if band(m.get("credit_status")) != "NC":
            continue
        nc_total += 1
        key = (m.get("college"), (m.get("subject") or "").strip())
        if key in cr_keys:
            nc_mirrored += 1
            pairs.append([key[0], key[1], m.get("course_number")])
    if nc_total == 0:
        return None
    if nc_mirrored == nc_total:
        cls = "mirror"
    elif nc_mirrored > 0:
        cls = "partial_mirror"
    else:
        cls = "band_mix"
    return {"class": cls, "nc_total": nc_total, "nc_mirrored": nc_mirrored, "pairs": pairs}


def main():
    mem = load("coci_minted_memberships.json")["memberships"]
    out, counts = {}, defaultdict(int)
    for cid, members in mem.items():
        c = classify(members or [])
        if c is None:
            continue
        out[cid] = c
        counts[c["class"]] += 1
    blob = {
        "_about": "CR/NC mirror classification per identity (Doctrine v0.3 Q-CREDITNC). "
                  "class=mirror → D-3 credit_mixed is a CPL Credit-by-Exam pairing, not an over-merge.",
        "_at": str(date.today()),
        "_counts": dict(counts),
        "mirrors": out,
    }
    path = os.path.join(HERE, "crnc_mirrors.json")
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(blob, f, indent=1, ensure_ascii=False)
        f.write("\n")
    os.replace(tmp, path)
    total = sum(counts.values())
    print(f"[detect_crnc_mirrors] CR/NC-mixing identities: {total}")
    print(f"  mirror (D-3 suppress):    {counts['mirror']}")
    print(f"  partial_mirror (curator): {counts['partial_mirror']}")
    print(f"  band_mix (split stands):  {counts['band_mix']}")
    print(f"  wrote: {path}")


if __name__ == "__main__":
    main()
