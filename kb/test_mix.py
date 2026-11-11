#!/usr/bin/env python3
"""test_mix.py — a local exhibit's test mix, and the adoption key it gives a family title.

Sam's bundle rule, 2026-11-11 (issue #3110, COBIx 16:00Z and 16:14Z): every local ASE bundle variation
folds into one family title, "ASE Certificate Bundles", and each local bundle stays a local exhibit with its
own test mix. "The catalog must show each local exhibit's test mix, so an A4+A5 bundle doesn't look the same
as a T2+T8 bundle." Request Quick Adopt and the could-adopt lists grouped by the common title alone, so after
the fold a college that articulated A4+A5 would read as having adopted T2+T8.

THE MIX. Read from the title the exhibit sat under before the fold first (kb/reference/
exhibit_prior_titles.json, recorded by kb/_record_prior_titles.py before any fold rewrites it), and from its
own MAP title second (SkyTamarind's design, S638: the old curated title carries the mix far more cleanly than
the freehand MAP title). Codes are read with kb/cert_naming.py's one parser and kept only where the words
around them are nothing but separators:

  "ASE Bundle — A4, A5"                 -> A4, A5        (codes; equal sets group together)
  "ASE A2 + A3 + A6 — Transmission, ..." -> A2, A3, A6
  "ASE Bundle — A6 or T6 + L3"          -> "A6 or T6 + L3" (an "or", a range, or a part no code names:
  "ASE Bundle — T5, T8, SP/2 HD"        -> "T5, T8, SP/2 HD" the title's own words, grouped by that title)
  "ASE Master Automobile Technician"    -> the title itself
  a MAP title that names no code        -> "test mix not named", grouped by its exhibit id alone

THE FAMILY. A title is a family title when its local exhibits carry two or more distinct coded mixes. Read
from the data, never from a name. Every other title keeps its old adoption key, the title alone.

Readers: excel_to_dashboard.py (the statewide groups in statewide_data.js), kb/_verify_map_exhibit_links.py
(the mix beside each Request Quick Adopt chip), kb/_record_prior_titles.py.
"""
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import cert_naming  # noqa: E402

PRIOR = os.path.join(HERE, "reference", "exhibit_prior_titles.json")
NOT_NAMED = "test mix not named"
_ORDER = {c: i for i, c in enumerate(cert_naming.ASE)}
_SEP = re.compile(r"[\s,+&]+|\band\b", re.I)
# What a MAP title may carry around its codes and still read as a plain list of tests.
_FILLER = re.compile(r"\bASE\b|\bAutomotive Services? Excell[ae]nce\b|\bNational Institute for\b|"
                     r"\bCertifications?\b|\bCertificates?\b|\bResidency Units\b|[():]", re.I)


def load_prior(path=PRIOR):
    """exhibit id (upper case) -> the common title it sat under before a fold. {} when the file is absent."""
    try:
        with open(path, encoding="utf-8") as f:
            return {k.upper(): v for k, v in (json.load(f).get("titles") or {}).items()}
    except (OSError, ValueError):
        return {}


def _coded(part, filler=None):
    """Sorted ASE codes when `part` is nothing but codes and separators, else None."""
    codes = [c for c in cert_naming.codes_named(part) if c in _ORDER]
    if not codes:
        return None
    rest = part
    if filler is not None:
        rest = filler.sub(" ", rest)
    rest = re.sub(r"(?<![A-Za-z0-9])(?:%s)(?![A-Za-z0-9])" % "|".join(codes), " ", rest)
    if _SEP.sub("", rest).strip():
        return None
    return sorted(set(codes), key=_ORDER.get)


def _part(title):
    """The words of a curated title that name its tests: after "ASE Bundle —", before "—" in "ASE A8 + L1 — ...",
    the code in "Brakes (ASE A5)". None for a title in no such form."""
    t = (title or "").strip()
    m = re.match(r"^ASE\s+Bundle\s*[—–]\s*(.+)$", t)
    if m:
        return m.group(1).strip()
    m = re.match(r"^ASE\s+(.+?)\s+[—–]\s+.+$", t)
    if m:
        return m.group(1).strip()
    m = cert_naming.NEW_FORM.match(t)
    if m:
        return m.group("code")
    return None


def from_title(title):
    """(key, label, coded) for a curated title, or None when the title names no mix at all."""
    part = _part(title)
    if part is None:
        return None
    codes = _coded(part)
    if codes:
        return "codes:" + ",".join(codes), ", ".join(codes), True
    return "title:" + title.strip(), part, False


def exhibit_mix(eid, title, map_title, prior=None):
    """{"key", "label", "coded"} for one local exhibit under `title` (its common title today)."""
    eid = (eid or "").upper()
    old = (prior or {}).get(eid)
    if old and old.strip() != (title or "").strip():
        got = from_title(old)
        if got and got[2]:
            return {"key": got[0], "label": got[1], "coded": True}
        # An "or", a range, a part no code names, or a title in no bundle form: its own words, grouped by it.
        return {"key": "title:" + old.strip(), "label": got[1] if got else old.strip(), "coded": False}
    got = from_title(title)
    if got and got[2]:
        return {"key": got[0], "label": got[1], "coded": True}
    codes = _coded(map_title or "", _FILLER) if cert_naming.ASE_NAMED.search(map_title or "") or \
        re.search(r"\bASE\b", map_title or "") else None
    if codes:
        return {"key": "codes:" + ",".join(codes), "label": ", ".join(codes), "coded": True}
    named = [c for c in cert_naming.codes_named(map_title or "") if c in _ORDER]
    return {"key": "id:" + eid, "label": (map_title or "").strip() if named else NOT_NAMED, "coded": False}


def adoption_keys(rows, prior=None):
    """rows: [(title, exhibit id, MAP title), ...]. Returns {(title, exhibit id upper): mix} for the rows under
    a family title only (two or more distinct coded mixes); a row under any other title is absent, so its
    adoption key stays the title alone."""
    mixes, coded = {}, {}
    for title, eid, map_title in rows:
        m = exhibit_mix(eid, title, map_title, prior)
        mixes[(title, (eid or "").upper())] = m
        if m["coded"]:
            coded.setdefault(title, set()).add(m["key"])
    family = {t for t, keys in coded.items() if len(keys) >= 2}
    return {k: m for k, m in mixes.items() if k[0] in family}


def adopt_key(title, mix_key):
    """The one string a reader keys adoption by: the title, plus the mix for a family title."""
    return title + ("\u0001" + mix_key if mix_key else "")
