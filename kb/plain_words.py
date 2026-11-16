#!/usr/bin/env python3
"""Plain words in what Sam reads: the rule, importable (Sam, 2026-11-16, relayed by COBIx on #3395, item 1).

Sam pasted a Commons card he could not interpret ("Should a program checked against its college's own course list
count in the headline? 1,604 active programs have no closed course list in the state's Program Course File...") and
asked what "closed course list" and "the headline" mean. Insider terms make his answers come out unsure, so a term
on TERMS may not appear in anything he is asked to read unless the same sentence defines it: a parenthetical right
after the term, or the word "means".

One rule, two readers: tests/plain_words_for_sam_test.py (open calls and the Commons' copy) and the vault's
decision-sheet builder (CPLBrain/decision-sheets/_build_open_asks_decision_sheet.py, which puts this folder on its
path). Neither keeps a copy of TERMS. Pure stdlib; importing it runs nothing.
"""
import html
import re

# COBIx's list (#3395, 2026-11-16), each a term Sam has had to ask about or that only the sessions use.
TERMS = ["closed course list", "headline", "carry-basis", "re-clustering", "re-cluster", "lane", "payload",
         "receipt", "held", "person-settled"]


def sentences(text):
    return [s for s in re.split(r"(?<=[.?!])\s+", text or "") if s.strip()]


def defined(sentence, term):
    """The sentence defines the term: '(' right after it, or 'means' in the sentence."""
    m = re.search(r"\b%s\b" % re.escape(term), sentence, re.I)
    after = sentence[m.end():m.end() + 3] if m else ""
    return after.lstrip().startswith("(") or re.search(r"\bmeans\b", sentence, re.I) is not None


def offenses(text):
    """Each (term, sentence) where a listed term stands undefined."""
    out = []
    for s in sentences(text):
        for t in TERMS:
            if re.search(r"\b%s\b" % re.escape(t), s, re.I) and not defined(s, t):
                out.append((t, s.strip()[:140]))
    return out


def visible(markup):
    """The words a reader sees in an HTML fragment: tags dropped, entities read, space collapsed."""
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", markup or ""))).strip()
