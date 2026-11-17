#!/usr/bin/env python3
"""The typographic rule for credit recommendation wordings (S678, issue #3464, COBIx item 5).

    from kb.cr_typographic import clean_rec, typo_key

COBIx's cause ranking (#3464 comment 6962134078) found that 859 unsettled Common CR rows differ from another
wording only in type: capitals, spacing, unit grammar (`1 hours`), a trailing `.0`, `3 - 4`, `&`, `Intro to`.
The rule a script applies: two wordings are the same recommendation when they are identical after `clean_rec`
and a case-insensitive whitespace squash. Wordings that still differ after that are never folded here; they may
be different recommendations, or a different cause such as truncation (AR-0102-0007).

THE SOURCE TEXT IS NEVER CHANGED. `clean_rec` returns a comparison form and `typo_key` its folded key. Neither
is written over MAP's `credit_rec` or ACE's `CreditRecommendation`; the loader stores ACE's text as the catalog
sent it (trimmed, the loader's one convention) and the key beside it.

ONE RULE IN TWO LANGUAGES. `cr_reference.js` carries the same rule (`crTypoKey`) so the #cr-reference panel can
say that two wordings differ only in type. tests/fixtures/cr_typographic_cases.json holds the cases both must
agree on; tests/map_ace_catalog_cr_test.py runs it here and tests/cr_ace_side_by_side.test.js runs it there.
Change both, and the fixture, together.

COBIx's `clean_rec` lives in its own workspace (build_inventory.py), not in this repo; this is a port of the
fixes its ranking lists, checked against the three cases it tested (AR-0702-0030, MAPCBEN-BDL-1-001,
MOS-21E-001).
"""
from __future__ import annotations

import re

# Words a title-cased topic keeps lowercase unless they open it (COBIx case 3: "... Granted on the Basis of ...").
SMALL = frozenset("a an and as at but by for in into of on or the to with".split())

_NUM = r"\d+(?:\.\d+)?"
# The head of a recommendation: a number or a range, an optional term word, a unit word, then "in" or "of".
_HEAD = re.compile(
    r"^(?P<lo>" + _NUM + r")(?:\s*(?P<sep>-|–|to|or)\s*(?P<hi>" + _NUM + r"))?\s+"
    r"(?P<term>(?:semester|quarter)\s+)?(?P<unit>hours?|units?|credits?)\s+(?P<prep>in|of)\s+(?P<topic>.*)$",
    re.I)


def _squash(s: str) -> str:
    return re.sub(r"\s+", " ", s or "").strip()


def _num(s: str) -> str:
    """A trailing `.0` on a whole number goes (`3.0` -> `3`); any other decimal stays as written."""
    if re.fullmatch(r"\d+\.0+", s):
        return s.split(".")[0]
    return s


def _title(topic: str) -> str:
    """Capitalize each all-lowercase word, the small words excepted unless first. A word that already carries a
    capital (an acronym, `FCAW`, `McGraw`) stays as written, so the cleaned form never lowers a capital."""
    out = []
    for i, w in enumerate(topic.split(" ")):
        if w and w == w.lower() and w[:1].isalpha() and not (i and w in SMALL):
            w = w[:1].upper() + w[1:]
        out.append(w)
    return " ".join(out)


def clean_rec(text: str) -> str:
    """The cleaned comparison form of one wording. Never written over the source text."""
    s = _squash(text)
    if not s:
        return ""
    s = re.sub(r"\s*&\s*", " and ", s)
    s = re.sub(r"\bintro\.?\s+to\b", "Introduction to", s, flags=re.I)
    s = re.sub(r"\bassembler\s+language\b", "Assembly Language", s, flags=re.I)
    s = _squash(s)
    m = _HEAD.match(s)
    if not m:
        return s
    lo, hi, sep = _num(m.group("lo")), m.group("hi"), (m.group("sep") or "")
    unit = m.group("unit").lower().rstrip("s")
    if hi is not None:
        hi = _num(hi)
        sep_l = sep.lower()
        amount = f"{lo}-{hi}" if sep_l in ("-", "–") else f"{lo} {sep_l} {hi}"
        plural = True
    else:
        amount = lo
        plural = float(lo) != 1.0
    term = (m.group("term") or "").strip().lower()
    head = " ".join(x for x in (amount, term, unit + ("s" if plural else "")) if x)
    return f"{head} {m.group('prep').lower()} {_title(m.group('topic'))}"


def typo_key(text: str) -> str:
    """The folded key: the cleaned form, lowercased, whitespace squashed, spaces around a hyphen closed."""
    k = clean_rec(text).lower()
    k = re.sub(r"\s*-\s*", "-", k)
    return _squash(k)


def same_typographically(a: str, b: str) -> bool:
    return bool(typo_key(a)) and typo_key(a) == typo_key(b)


def side_by_side(map_pairs, ace_pairs) -> dict:
    """Classify each distinct MAP (exhibit_id, wording) pair against ACE's catalog lines for the same exhibit.

    Every MAP pair with an exhibit id lands in exactly one bucket, so the buckets add up to `map_pairs`:
      exact        an ACE line on the exhibit reads the same, character for character
      typographic  no exact line, but an ACE line has the same typo_key
      differs      the exhibit has ACE lines and none matches either way
      ace_missing  the catalog holds no line for the exhibit
    A pair with a blank exhibit id cannot be joined and is counted apart as `no_exhibit`.

    `map_typo_settled` is the typographic rule on the MAP side: MAP pairs whose wording shares an exhibit and a
    typo_key with another, different MAP wording (AR-0702-0030's `3 hours in Supervision` and `3 hours in
    supervision`). Those count both members, and overlap the four buckets, which describe the ACE comparison.
    """
    ace_by: dict[str, dict] = {}
    for ex, cr in ace_pairs:
        d = ace_by.setdefault(ex, {"text": set(), "keys": set()})
        d["text"].add(cr)
        d["keys"].add(typo_key(cr))
    seen = set()
    out = {"map_pairs": 0, "exact": 0, "typographic": 0, "differs": 0, "ace_missing": 0, "no_exhibit": 0,
           "map_typo_settled": 0, "ace_pairs": sum(len(d["text"]) for d in ace_by.values()),
           "ace_exhibits": len(ace_by)}
    by_key: dict[tuple, set] = {}
    for ex, cr in map_pairs:
        ex, cr = (ex or "").strip(), (cr or "").strip()
        if not cr or (ex, cr) in seen:
            continue
        seen.add((ex, cr))
        if not ex:
            out["no_exhibit"] += 1
            continue
        out["map_pairs"] += 1
        by_key.setdefault((ex, typo_key(cr)), set()).add(cr)
        a = ace_by.get(ex)
        if a is None:
            out["ace_missing"] += 1
        elif cr in a["text"]:
            out["exact"] += 1
        elif typo_key(cr) in a["keys"]:
            out["typographic"] += 1
        else:
            out["differs"] += 1
    out["map_typo_settled"] = sum(len(v) for v in by_key.values() if len(v) > 1)
    return out
