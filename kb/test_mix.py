#!/usr/bin/env python3
"""test_mix.py — the tests a bundle title names, in plain words, and the search aliases they give it.

Sam's ruling, 2026-11-11 (in session; cpl_memory `sam-bundle-family-is-a-field-2026-11-11`): each ASE bundle
stays its own canonical title and carries a family, "ASE Certificate Bundles" (kb/reference/
credential_families.json), and each component test is a search alias of it. A student who holds A4 finds every
bundle that includes A4 without knowing any college's bundle name. Adoption stays at the title grain.

Codes are read with kb/cert_naming.py's one parser (codes_named). The mix is kept as written where it is more
than a list of codes:

  "ASE Bundle — A4, A5"                  -> A4, A5
  "ASE A2 + A3 + A6 — Transmission, ..."  -> A2, A3, A6
  "ASE Bundle — A6 or T6 + L3"           -> "A6 or T6 + L3"   (an "or" is never flattened into "and")
  "ASE Bundle — T5, T8, SP/2 HD"         -> "T5, T8, SP/2 HD" (a part no code names stays)
  "ASE Certificate Bundles"              -> None (no mix named)

Readers: kb/credential_aliases.py (components), kb/_family_tag_plan.py.
"""
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import cert_naming  # noqa: E402

_ORDER = {c: i for i, c in enumerate(cert_naming.ASE)}
_SEP = re.compile(r"[\s,+&]+|\band\b", re.I)


def _coded(part):
    """Sorted ASE codes when `part` is nothing but codes and separators, else None."""
    codes = [c for c in cert_naming.codes_named(part) if c in _ORDER]
    if not codes:
        return None
    rest = re.sub(r"(?<![A-Za-z0-9])(?:%s)(?![A-Za-z0-9])" % "|".join(codes), " ", part)
    if _SEP.sub("", rest).strip():
        return None
    return sorted(set(codes), key=_ORDER.get)


def _part(title):
    """The words of a curated title that name its tests: after "ASE Bundle —", before "—" in "ASE A8 + L1 — ...".
    None for a title in neither form."""
    t = (title or "").strip()
    m = re.match(r"^ASE\s+Bundle\s*[—–]\s*(.+)$", t)
    if m:
        return m.group(1).strip()
    m = re.match(r"^ASE\s+(.+?)\s+[—–]\s+.+$", t)
    if m:
        return m.group(1).strip()
    m = re.match(r"^ASE\s+(.+?)\s+Bundle$", t)
    if m:
        return m.group(1).strip()
    return None


def from_title(title):
    """{"label", "codes", "coded"} for a bundle title, or None when the title names no mix. `codes` lists every ASE
    test code the mix names, in ASE's order, even where the label keeps an "or" or a non-ASE part."""
    part = _part(title)
    if part is None:
        return None
    coded = _coded(part)
    named = sorted({c for c in cert_naming.codes_named(part) if c in _ORDER}, key=_ORDER.get)
    if coded:
        return {"label": ", ".join(coded), "codes": coded, "coded": True}
    return {"label": part, "codes": named, "coded": False}


def components(title):
    """The search aliases a family member's tests give it: "ASE A4" for each code it names, and the mix as written
    where the mix is more than a list of codes ("A6 or T6 + L3", "T5, T8, SP/2 HD")."""
    got = from_title(title)
    if not got:
        return []
    out = ["ASE " + c for c in got["codes"]]
    if not got["coded"]:
        out.append(got["label"])
    return out


_PARTS = re.compile(r"\s*[,+]\s*")
_OR = re.compile(r"\s+or\s+", re.I)


def _is_ase(part):
    """True when a part of a mix is ASE tests only: one code, or codes joined by "or"."""
    alts = [a.strip() for a in _OR.split(part) if a.strip()]
    return bool(alts) and all(a.upper() in _ORDER for a in alts)


def parts(title):
    """{"tests": [...], "with": [...]} for a bundle title: its ASE parts as written (an "or" kept inside one part) and
    every other part, which joins the bundle "with" the ASE tests (COBIx relaying Sam's ruling on #3110, 18:40Z:
    MACS 609 is not an ASE test, so it is a "with" component). None for a title that names no mix."""
    got = from_title(title)
    if not got:
        return None
    if got["coded"]:
        return {"tests": list(got["codes"]), "with": []}
    out = {"tests": [], "with": []}
    for p in _PARTS.split(got["label"]):
        p = p.strip()
        if p:
            out["tests" if _is_ase(p) else "with"].append(p)
    return out


def family_title(family, title):
    """The title a family member takes in the family's naming form (the ruling as relayed on #3110: family plus the
    normalized mix, "ASE Certificate Bundles: A4 + A5"), or None when the title names no mix. A part no ASE code names
    follows "with": "ASE Certificate Bundles: T7 + T8 with MACS/609". A proposal only: a person approves it."""
    got = parts(title)
    if not got or not got["tests"]:
        return None
    t = "%s: %s" % (family, " + ".join(got["tests"]))
    return t + (" with " + " + ".join(got["with"]) if got["with"] else "")


def exception(title):
    """The member a person codes by hand: its mix holds an "or" or a part no ASE code names, so the parser cannot code
    it fully. {"title", "mix", "tests", "with"}; None for a fully coded mix or a title with none."""
    got = from_title(title)
    if not got or got["coded"]:
        return None
    p = parts(title)
    return {"title": title, "mix": got["label"], "tests": p["tests"], "with": p["with"]}
