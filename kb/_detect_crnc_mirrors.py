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


import re

_DIGITS = re.compile(r"\d+")


def _num_core(course_number: str) -> str:
    """The longest digit-run of a course number, as the comparison core.
    'ELECT 111' → '111', 'B1BNC' → '1', 'AUTO 060B' → '060'."""
    nums = _DIGITS.findall(course_number or "")
    return max(nums, key=len) if nums else ""


def _numbers_correspond(cr_num: str, nc_num: str) -> bool:
    """A credit ⟷ noncredit course-number correspondence under the CA
    noncredit-mirror conventions the verify pass documented (2026-07-12):
      - identical number  (206B ⟷ 206B; 99 ⟷ 99)
      - NC = credit + a leading prefix digit (5 ⟷ 305, 52 ⟷ 352, 11 ⟷ 111,
        50 ⟷ 850) → the credit core is a SUFFIX of the NC core
      - NC = credit with an NC suffix (B1B ⟷ B1BNC; 059N ⟷ 59) → the shorter
        core is a substring of the longer
    Guard: cores must be >= 2 chars to avoid 1-digit coincidences."""
    a, b = _num_core(cr_num), _num_core(nc_num)
    if not a or not b:
        return False
    if a == b:
        return True
    lo, hi = (a, b) if len(a) <= len(b) else (b, a)
    if len(lo) < 2:
        return False
    # credit core is the tail of the NC core (prefix-digit convention), or a
    # clean substring (suffix-marker convention).
    return hi.endswith(lo) or lo in hi


def _subj_ok(cr_subj: str, nc_subj: str, numbers_identical: bool) -> bool:
    """Subjects correspond when equal, when the NC subject is a noncredit
    variant of the credit stem (NC/N/VOC prefix, or shares a >=2-char stem), or
    — for an identical course number — when a noncredit umbrella subject
    (e.g. VFPA over DNCE) fronts the credit one."""
    c = (cr_subj or "").upper().replace(".", "").replace(" ", "")
    n = (nc_subj or "").upper().replace(".", "").replace(" ", "")
    if not c or not n:
        return False
    if c == n:
        return True
    stripped = re.sub(r"^(NC|N|VOC)", "", n)
    if stripped and (stripped == c or (len(stripped) >= 2 and (stripped in c or c in stripped))):
        return True
    if c in n or n in c:                       # shared stem (RLST vs NCRL-ish)
        return True
    return bool(numbers_identical)             # umbrella subject + identical number


def classify(members: list) -> dict | None:
    """Return a mirror classification for one identity's members, or None if the
    identity does not mix credit and noncredit bands.

    A noncredit member is 'mirrored' iff it has a SAME-COLLEGE credit member
    whose course number corresponds (CA mirror numbering) and whose subject
    corresponds (equal / NC-variant / umbrella-on-identical-number). class:
      mirror         — EVERY nc member mirrors  (D-3 suppress; CPL pairing)
      partial_mirror — some but not all mirror   (curator/faculty look)
      band_mix       — none mirror               (genuine over-merge; split stands)
    """
    bands = {band(m.get("credit_status")) for m in members}
    if not ("CR" in bands and "NC" in bands):
        return None
    crs = [m for m in members if band(m.get("credit_status")) == "CR"]
    pairs, nc_total, nc_mirrored = [], 0, 0
    for m in members:
        if band(m.get("credit_status")) != "NC":
            continue
        nc_total += 1
        nc_num, nc_subj, nc_coll = m.get("course_number"), (m.get("subject") or ""), m.get("college")
        matched = None
        for c in crs:
            if c.get("college") != nc_coll:
                continue
            if not _numbers_correspond(c.get("course_number"), nc_num):
                continue
            identical = _num_core(c.get("course_number")) == _num_core(nc_num) != ""
            if _subj_ok(c.get("subject") or "", nc_subj, identical):
                matched = c
                break
        if matched:
            nc_mirrored += 1
            pairs.append([nc_coll, f"{matched.get('subject')} {matched.get('course_number')}",
                          f"{nc_subj} {nc_num}"])
    if nc_total == 0:
        return None
    cls = "mirror" if nc_mirrored == nc_total else ("partial_mirror" if nc_mirrored else "band_mix")
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
