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


# The family's own naming form, "ASE Certificate Bundles: T6 + T8 with Snap-on 604" (Sam, Open Asks Sheet 181,
# 2026-11-11; cpl_memory d-sheet-181-replies-2026-11-11). Read like the older forms, so a renamed member keeps its
# tests as search aliases and family_read() gives the same title back.
FAMILY_FORM = re.compile(r"^ASE\s+Certificate\s+Bundles\s*:\s*(.+)$")


def _part(title):
    """The words of a curated title that name its tests: after "ASE Bundle —", before "—" in "ASE A8 + L1 — ...",
    after "ASE Certificate Bundles:". None for a title in none of these forms."""
    t = (title or "").strip()
    m = FAMILY_FORM.match(t)
    if m:
        return m.group(1).strip()
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


_PARTS = re.compile(r"\s*[,+]\s*|\s+with\s+", re.I)
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


def family_read(family, title):
    """How a family member stands against the family's naming form (Sam, Open Asks Sheet 181, 2026-11-11): the family,
    a colon, the ASE tests in ASE's own order (kb/cert_naming.py's table) joined by " + ", then any part no ASE code
    names, kept as written, after "with": "ASE Certificate Bundles: T6 + T8 with Snap-on 604".

    Returns {"status", "title", "why"}:
      named        "title" is the member's name in the form
      already      the member already carries it ("title" is the title itself)
      unparseable  the parser cannot code the mix (an "or", a part that mixes a test code with other words, or no
                   test at all); "title" is None and the member is left for a person
      no-mix       the title names no mix; "title" is None
    """
    got = parts(title)
    if not got:
        return {"status": "no-mix", "title": None, "why": "the title names no test mix"}
    if not got["tests"]:
        return {"status": "unparseable", "title": None, "why": "the mix names no ASE test the parser can code"}
    ors = [p for p in got["tests"] if _OR.search(p)]
    if ors:
        return {"status": "unparseable", "title": None,
                "why": "an \"or\" in %s: any one of the tests qualifies, so the tests cannot be joined by \"+\""
                       % ", ".join(ors)}
    bad = [p for p in got["with"] if _OR.search(p) or cert_naming.codes_named(p)]
    if bad:
        return {"status": "unparseable", "title": None,
                "why": "a part the parser cannot read as one test or one named credential: %s" % ", ".join(bad)}
    tests = sorted(set(t.upper() for t in got["tests"]), key=_ORDER.get)
    new = "%s: %s" % (family, " + ".join(tests))
    new += (" with " + " + ".join(got["with"])) if got["with"] else ""
    return {"status": "already" if new == (title or "").strip() else "named", "title": new, "why": ""}


def family_title(family, title):
    """The title a family member takes in the family's naming form ("ASE Certificate Bundles: A4 + A5"), or None when
    the title names no mix or the parser cannot code it (family_read). Idempotent: a member already in the form gets its
    own title back. A proposal only: a person approves it, or a ruled plan names it (kb/ruled_renames.py)."""
    return family_read(family, title)["title"]


def exception(title):
    """The member a person codes by hand: the parser cannot code its mix (family_read's "unparseable": an "or", a part
    that mixes a test code with other words, or no ASE test). {"title", "mix", "tests", "with", "why"}; None for a
    coded mix or a title with none.

    A part no ASE code names is coded as written, after "with" (family_read), and is no exception: Sam, 5:38 AM PT
    2026-11-13 (#3228), on the eleven "titles to code by hand": "I think you and sky could just use a routine to do the
    hand titling-- I would just defer to it's mix as written unless there was an obvious error". The routine is this
    parser; what it cannot read is the obvious error left for him."""
    got = from_title(title)
    if not got or got["coded"]:
        return None
    read = family_read("", title)
    if read["status"] != "unparseable":
        return None
    p = parts(title)
    return {"title": title, "mix": got["label"], "tests": p["tests"], "with": p["with"], "why": read["why"]}
