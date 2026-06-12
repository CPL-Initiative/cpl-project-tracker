"""Fan-in discipline-alias guard for the inference passes.

kb/discipline_aliases.json records folded ALTERNATE discipline names
(canonical -> [alternates], e.g. Kinesiology -> ["Physical Education"]).
An alternate is still a valid MQ name, so the passes' mq_disciplines.json
validation cannot catch a lexicon/map target that names one — and a target
that does quietly resurrects the folded discipline on the next re-derivation
(the Session-45 re-derive re-filled "Physical Education" on 605 rows after
the 2026-06-10 convergence had folded it to zero, which parked them on the
synthetic PEDU SUBJ4 at the Session-50 fold; repaired in Session 51 by
kb/_kin_pe_pass2.py).

Every inference pass resolves its targets through resolve_targets() at load
time: alternates map to their canonical with a loud warning, so a future
lexicon edit can never reintroduce one.
"""
from __future__ import annotations

import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
ALIASES = os.path.join(HERE, "discipline_aliases.json")


def alternate_to_canonical() -> dict:
    """{alternate discipline name -> canonical discipline name}."""
    if not os.path.exists(ALIASES):
        return {}
    with open(ALIASES, encoding="utf-8") as f:
        doc = json.load(f)
    rev = {}
    for canon, alts in (doc.get("aliases") or {}).items():
        for a in alts or []:
            rev[a] = canon
    return rev


def resolve_target(disc, rev=None, context=""):
    """One target: alternate -> canonical (warns), anything else unchanged."""
    if rev is None:
        rev = alternate_to_canonical()
    if disc in rev:
        print(f"  WARNING{' (' + context + ')' if context else ''}: target "
              f"{disc!r} is a folded alternate discipline name — resolved to "
              f"canonical {rev[disc]!r} (kb/discipline_aliases.json). "
              f"Re-point the source entry.")
        return rev[disc]
    return disc
