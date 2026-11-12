#!/usr/bin/env python3
"""title_in_use.py — the title already in use for a held exhibit: a statewide exhibit first, then the most used.

Sam, in session, 2026-11-12 (cpl_memory `sam-classifier-suggests-title-in-use-2026-11-12`): "also think about how you
could apply this to your intelligence moving forward...being able to suggest the best canonical title based on what's
in use...". The card that prompted it: American River's "Firefighter Recruit Academy Certificate" (California State
Fire Training) was proposed the new title "Firefighter Academy" while the reference already holds the statewide exhibit
"Firefighter 1" with 11 local titles. He said it should be renamed "Firefighter 1".

This is the Python side of ONE rule. exhibits.js holds the other side (relatedFor and relAligned, #3160), which names
the title on the Review card; kb/_build_exhibits_review.py calls this module to make it the proposal. The two are
pinned to the same fixtures and the same constants by tests/fixtures/title_in_use_cases.json, which
tests/title_in_use_test.py and tests/title_in_use_parity.test.js both read: a change to one side that the other does
not follow fails a test. The rule, in words (the JS comment above relAligned says the same):

  (a) A title in the reference that is itself a statewide exhibit is that exhibit ("self"); nothing else is named.
  (b) A candidate is in the reference, shares the card's words (an ASE card: the same test code), and has the card's
      own issuer. A title from another issuer is never named, however many words it shares.
  (c) Several statewide candidates: the one with the most local titles is named only on a clear lead, at least
      STATEWIDE_LEAD times the local titles of the next one; else none.
  (d) None statewide: the most used candidate (the card's own title competes when it is in the reference), with at
      least POPULAR_MIN local titles and more than every other candidate; a tie names none. Outside an ASE test, a
      candidate here must also name the same thing: the words of its title (earlier titles left out) hold every word
      of the card's title, or the card's hold every word of its title ("English as a Second Language" for "English
      as a Second Language (ESL 220A)"). Two shared words are not enough (measured over the 177 held titles,
      2026-11-12: "Emergency Medical Services (EMS 10)" named Emergency Medical Responder, "Residential Insulation
      Blow-In" named Blueprint Reading-Residential, "Administration of Justice (AJ 54)" named Introduction to
      Corrections through an earlier title).
  (e) Outside an ASE test, a card whose title ends in a course code in parentheses ("Administration of Justice
      (AJ 54)") is one course: a candidate must carry the same code, or it is not named, statewide or most used
      (measured: AJ 54, 60, 63 and 64 all named Introduction to Administration of Justice; ESL 220A to 231B all
      named English as a Second Language).

Never reads TOP, never calls a model or the network. "Statewide" is fact-sheet/statewide_recs.js, the list the List's
Basis column and the card read.
"""
import json
import os
import re

POPULAR_MIN = 3
STATEWIDE_LEAD = 3
LOCAL_ISSUER = "California Community Colleges"
ASE_ISSUER = "National Institute for Automotive Service Excellence (ASE)"
# exhibits.js REL_STOP: words that never make two titles related.
STOP = frozenset(["and", "the", "of", "in", "for", "to", "a", "an", "by", "on", "with", "or", "credit", "exam",
                  "noncredit", "certification", "certificate", "course", "level", "introduction", "intro", "basic",
                  "advanced"])

STATEWIDE = "in_use_statewide"
MOST_USED = "in_use_most_used"
SELF = "self"

_A = re.ASCII
_WORD = re.compile(r"[a-z][a-z0-9+#]{2,}", _A)
_ASE_CODE = re.compile(r"(?:^|[^A-Za-z0-9])([A-Z]\d|xEV)(?![A-Za-z0-9])", _A)
_ASE_TOKEN = re.compile(r"(?:^|[^A-Za-z])ASE(?![A-Za-z])", _A)
_ASE_CERT_TITLE = re.compile(r"^\s*(?:ASE\b|Automotive Services? Excellence\b|National Institute for Automotive "
                             r"Service Excellence\b)", re.I | _A)
_ASE_CERT_FORM = re.compile(r"\(ASE\s+(?:[A-Z]\d|xEV)\)\s*$", _A)
_ASE_ISSUER_WORDS = re.compile(r"Automotive Service Excellence", re.I)


def rel_words(text):
    """exhibits.js relWords: the words of a title, stop words out, a plural "s" or "es" off."""
    out = set()
    for w in _WORD.findall(str(text or "").lower()):
        if w not in STOP:
            out.add(re.sub(r"(?:es|s)$", "", w))
    return out


def ase_codes_in(text):
    out = []
    for c in _ASE_CODE.findall(text or ""):
        if c not in out:
            out.append(c)
    return out


def ase_issuer(title):
    """exhibits.js aseIssuer: a title in ASE's own form names ASE as its issuer."""
    t = title or ""
    return ASE_ISSUER if _ASE_CERT_TITLE.search(t) or _ASE_CERT_FORM.search(t) else ""


def issuer_for(title, issuer):
    """exhibits.js issuerFor: the issuer the card's box shows for a title."""
    return ase_issuer(title) or issuer or ""


def ase_of(title, raw, issuer):
    """exhibits.js aseOf: the ASE test a card is about, {"code"} ("" when none is named), or None for a non-ASE card."""
    t, r = title or "", raw or ""
    is_ase = (bool(ase_issuer(t)) or re.search(r"\(ASE\s", t, _A) or _ASE_ISSUER_WORDS.search(issuer or "")
              or _ASE_TOKEN.search(r) or re.search(r"\bAUTO\w*\s+[A-Z]\d\b", r, _A))
    if not is_ase:
        return None
    m = (re.search(r"\(ASE\s+([A-Z]\d|xEV)", t, _A) or re.search(r"^\s*ASE\s+([A-Z]\d|xEV)\b", t, _A)
         or re.search(r"\bAUTO\w*\s+([A-Z]\d)\b", r, _A)
         or re.search(r"(?:^|[^A-Za-z])ASE[^A-Za-z0-9]+(?:\w+\s+)?\(?([A-Z]\d)\b", r, _A))
    return {"code": m.group(1) if m else ""}


def entry(t, issuer, locals_, adopted, proposed=False, aka=()):
    """One title in the index, the fields exhibits.js loadRelated reads from a kb/exhibits_related.json row."""
    aka = list(aka or [])
    ase = bool(_ASE_ISSUER_WORDS.search(issuer or "")) or bool(_ASE_TOKEN.search(t))
    return {"t": t, "issuer": issuer or "", "locals": locals_ or 0, "adopted": adopted or 0, "proposed": bool(proposed),
            "aka": aka, "ase": ase, "codes": ase_codes_in(t) if ase else [], "words": rel_words(t + " " + " ".join(aka))}


def index_from_related(d):
    """The index from a kb/exhibits_related.json-shaped object: titles [t, issuer index, locals, adopted, proposed,
    aka, ...]. The parity fixture uses this shape, so both sides read the same rows."""
    issuers = d.get("issuers") or []
    out = []
    for row in d.get("titles") or []:
        iss = issuers[row[1]] if len(row) > 1 and isinstance(row[1], int) and 0 <= row[1] < len(issuers) else ""
        out.append(entry(row[0], iss, row[2] if len(row) > 2 else 0, row[3] if len(row) > 3 else 0,
                         (row[4] if len(row) > 4 else 0) == 1, row[5] if len(row) > 5 else []))
    return out


def index_from_reference(credentials, unified_titles, adoption=None, aka=None):
    """The index over the reference only (kb/credentials.json keys and every title kb/unified_titles.json maps a raw to):
    the same titles, issuers and counts kb/_build_exhibits_related.py writes for its in-the-reference rows. A title only
    proposed is left out; the rule never names one."""
    locals_of = {}
    for raw, e in (unified_titles or {}).items():
        t = ((e or {}).get("unified_title") or "").strip() if isinstance(e, dict) else ""
        if t and raw.strip():
            locals_of[t] = locals_of.get(t, 0) + 1
    out = []
    for t in sorted(set(credentials or {}) | set(locals_of), key=str.lower):
        recs = (credentials or {}).get(t) or [{}]
        iss = (((recs[0] if isinstance(recs, list) and recs else {}) or {}).get("issuing_agency") or "").strip()
        adopted = len(((adoption or {}).get(t) or {}).get("a") or {})
        out.append(entry(t, iss, locals_of.get(t, 0), adopted, False, (aka or {}).get(t) or []))
    return out


def statewide_from_js(path):
    """The titles fact-sheet/statewide_recs.js names (window.CPL_STATEWIDE_RECS = {title: [...]})."""
    if not os.path.exists(path):
        return set()
    with open(path, encoding="utf-8") as f:
        src = f.read()
    start = src.find("{")
    if start < 0:
        return set()
    return set(json.loads(src[start:src.rindex("}") + 1]))


_PAREN_CODE = re.compile(r"\(\s*([A-Z]{2,6})\s+([A-Z0-9]{1,6})\s*\)\s*$", _A)


def paren_code(title):
    """(e)'s course code: "AJ 54" for "Administration of Justice (AJ 54)", else ""."""
    m = _PAREN_CODE.search(title or "")
    return m.group(1) + " " + m.group(2) if m else ""


def names_same(a, b):
    """(d)'s word test: one title's words hold all of the other's."""
    return bool(a) and bool(b) and (a <= b or b <= a)


def related(index, title, raw, issuer):
    """exhibits.js relatedFor: the titles beside a card, each with its tier. Returns {"family", "code", "rows"}, rows
    [{"o", "tier"}] in the JS order."""
    fam = ase_of(title, raw, issuer)
    rows = []
    if fam:
        code = fam["code"]
        series = code[0] if code else ""
        for o in index:
            if not o["ase"]:
                continue
            tier = 0 if code and code in o["codes"] else 1 if series and any(c[0] == series for c in o["codes"]) else 2
            rows.append({"o": o, "tier": tier, "rank": len(o["codes"]) if tier == 0 else 0})
        rows.sort(key=lambda x: (x["tier"], x["rank"], -x["o"]["locals"], x["o"]["t"].lower(), x["o"]["t"]))
        return {"family": "ASE", "code": code, "rows": rows}
    words, iss = rel_words(title), (issuer or "").strip()
    named = bool(iss) and iss != LOCAL_ISSUER
    for o in index:
        n = len(words & o["words"])
        same = named and o["issuer"] == iss
        tier = 0 if same and n else 1 if (n >= 2 or (n and n == len(words))) else 2 if same else -1
        if tier >= 0:
            rows.append({"o": o, "tier": tier, "rank": -n})
    rows.sort(key=lambda x: (x["tier"], x["rank"], -x["o"]["locals"], x["o"]["t"].lower(), x["o"]["t"]))
    return {"family": "", "code": "", "rows": rows}


def aligned(got, card_title, card_issuer, statewide, index=None):
    """exhibits.js relAligned: {"kind": "self" | in_use_statewide | in_use_most_used, "o"} or None. `index` is the
    whole index (exhibits.js state.rel.by), for the card's own title; without it, the related rows stand in."""
    t0, iss = (card_title or "").strip(), (card_issuer or "").strip()
    own = next((o for o in (index if index is not None else [x["o"] for x in got["rows"]]) if o["t"] == t0), None)
    if t0 and own is not None and not own["proposed"] and t0 in statewide:
        return {"kind": SELF, "o": own}
    if not iss:
        return None
    near = [x for x in got["rows"] if not x["o"]["proposed"] and x["o"]["t"] != t0 and x["o"]["issuer"] == iss
            and (x["tier"] == 0 if got["family"] else x["tier"] <= 1)]
    code = "" if got["family"] else paren_code(t0)
    if code:
        near = [x for x in near if paren_code(x["o"]["t"]) == code]

    def by_use(x):
        return (-x["o"]["locals"], -x["o"]["adopted"], x["o"]["t"].lower(), x["o"]["t"])

    sw = sorted((x for x in near if x["o"]["t"] in statewide), key=by_use)
    if sw:
        if len(sw) > 1 and sw[0]["o"]["locals"] < STATEWIDE_LEAD * sw[1]["o"]["locals"]:
            return None
        return {"kind": STATEWIDE, "o": sw[0]["o"]}
    if not got["family"]:
        mine = rel_words(t0)
        near = [x for x in near if names_same(mine, rel_words(x["o"]["t"]))]
    pool = near + [x for x in got["rows"] if x["o"]["t"] == t0 and not x["o"]["proposed"] and x["o"]["issuer"] == iss]
    if not pool:
        return None
    top = sorted(pool, key=by_use)[0]
    if top["o"]["t"] == t0 or top["o"]["locals"] < POPULAR_MIN:
        return None
    if any(x is not top and x["o"]["locals"] >= top["o"]["locals"] for x in pool):
        return None
    return {"kind": MOST_USED, "o": top["o"]}


def in_use(index, statewide, title, raw, issuer):
    """The title in use for a card proposing `title` under `issuer` (the box's issuer, issuer_for), or None."""
    iss = issuer_for(title, issuer)
    return aligned(related(index, title, raw, iss), title, iss, statewide, index)
