#!/usr/bin/env python3
"""The `honors_of` field: one Honors M-ID names its base, and the equivalence runs both ways (S653).

THE RULINGS (Sam): an Honors course gets its own M-ID with a declared equivalence to its base (Sheet 191 card 1,
`sam-honors-own-mid-2026-11-13`); "Base number plus H (MATH M1036H)", "Two-way: either satisfies the other",
"Build the field first, then the rows", "Rows for all 508 pairs" (Sheet 197 card 3, 14:37Z 2026-11-14,
`sam-sheet-197-answers-2026-11-14`); "CCN structures should be our gold standard"
(`sam-ccn-structures-gold-standard-2026-11-14`). Design: docs/reference/honors_of_design.md.

WHAT THE FIELD IS. A `kb_curation` row (course_id = the Honors M-ID, field = 'honors_of', value = its base's id),
folded by kb/_apply_curation.py into kb/coci_curation.json beside the other fields. It is stored once, on the
Honors side. The base's Honors partner is DERIVED here (`partners`), never stored a second time.

WHAT IT HOLDS. A merge that would join an Honors id and its base, directly, through a chain, or through a third id
both land on, is held apart (`hold_merges`), and a worklist group never offers the pair (`without_honors_pairs`).
The hold is pairwise: it keys on the two ids, so a third id merging into the base leaves it standing (COBIx's review
of #3304, item 1: a group-signature dismissal re-offers the pair once the group's membership changes).

Rule 10: a person's merge wins. When the merge row that joins a pair was saved by a person (a reviewer outside
`@bot`), the merge stands and the `honors_of` is the one set aside; both cases are reported, never dropped silently.

THE ID RULE. The Honors M-ID is its base's id plus H: MATH M1036 -> MATH M1036H. Only an M-ID base takes an H id.
A C-ID or CCN record is never re-keyed and never takes a minted H (C-ID has no H ids; CCN numbers its own, ENGL
C1000H beside ENGL C1000). The M-ID shape with its optional H is `M_ID_RE`; every parser that reads an M-ID's shape
accepts the H (the list: docs/reference/honors_of_design.md, *Id parsers*).

Pure stdlib, no I/O: every reader imports these functions, none copies them.
"""
import re

FIELD = "honors_of"
SUFFIX = "H"

# An M-ID (or a retired Z id): SUBJ, a space, M or Z, the band digit, three more characters, then the optional H
# that marks an Honors M-ID. Four characters after the letter is a base; five ending in H is its Honors id. A
# stand-alone tail can end in H ("ABCD M10GH" is a base): the length, not the letter, decides.
M_ID_RE = re.compile(r"^([A-Z]{1,6}) ([MZ])(\d)([A-Z0-9]{3})(H?)$")


def is_bot(reviewer):
    return bool(reviewer) and str(reviewer).endswith("@bot")


def parse(cid):
    """(subj, letter, band, tail, honors) or None when the id is not M-ID shaped."""
    m = M_ID_RE.match(cid or "")
    if not m:
        return None
    subj, letter, band, tail, h = m.groups()
    return subj, letter, band, tail, bool(h)


def is_m_id(cid):
    return parse(cid) is not None


def is_honors_id(cid):
    p = parse(cid)
    return bool(p and p[4])


def base_of_id(cid):
    """The base id an Honors M-ID's number names (MATH M1036H -> MATH M1036), else None."""
    return cid[:-1] if is_honors_id(cid) else None


def honors_id_for(base_id):
    """The Honors id a base takes: its id plus H. None for a C-ID or CCN base, or a base that is itself Honors."""
    p = parse(base_id)
    if not p or p[4] or p[1] != "M":
        return None
    return base_id + SUFFIX


def honors_map(curations):
    """{honors id: base id} from the overlay's `honors_of` entries (kb/coci_curation.json `curations`)."""
    out = {}
    for cid, v in (curations or {}).items():
        if isinstance(v, dict) and v.get(FIELD):
            out[cid] = v[FIELD]
    return out


def partners(hmap):
    """The two-way equivalence, derived: {id: sorted ids it is equivalent to}. A base reads its Honors partner here."""
    out = {}
    for h, b in hmap.items():
        out.setdefault(h, set()).add(b)
        out.setdefault(b, set()).add(h)
    return {k: sorted(v) for k, v in out.items()}


def _end(merge_into, i):
    seen = {i}
    while i in merge_into and merge_into[i] not in seen:
        i = merge_into[i]
        seen.add(i)
    return i


def hold_merges(merge_into, hmap, merge_by=None):
    """Merge edges that would join an Honors id and its base, held apart.

    merge_into: {source: target}, one hop per source (the overlay's map, before chains are flattened).
    hmap: {honors id: base id}.
    merge_by: {source: reviewer} for the merge rows, when known; a person's merge wins (Rule 10).

    Returns (kept, held, person_wins): kept is a new {source: target} map; held lists each edge removed, with why;
    person_wins lists each pair a person's merge joins, which stands. Nothing changes when hmap is empty."""
    kept = dict(merge_into)
    held, person_wins = [], []
    if not hmap:
        return kept, held, person_wins
    merge_by = merge_by or {}
    for h in sorted(hmap):
        b = hmap[h]
        if h == b or _end(kept, h) != _end(kept, b):
            continue
        # The pair would fold together. Cut the Honors id's own merge first, else the base's own: each is the first
        # hop of its side, so cutting it leaves that side standing and every other merge (a third id into the base,
        # the base into its target) in place. A person's merge is never cut.
        cut = None
        for edge in (h, b):
            if edge in kept and is_bot(merge_by.get(edge, "@bot")):
                trial = dict(kept)
                trial.pop(edge)
                if _end(trial, h) != _end(trial, b):
                    cut = edge
                    break
        if cut is None:
            edge = h if h in kept else b
            person_wins.append({"honors_id": h, "base_id": b, "merge_source": edge, "merge_into": kept.get(edge),
                                "reviewer": merge_by.get(edge),
                                "why": "a person's merge joins the pair: it stands (Rule 10)"})
            continue
        held.append({"honors_id": h, "base_id": b, "merge_source": cut, "merge_into": kept.pop(cut),
                     "reviewer": merge_by.get(cut), "why": "honors_of holds the pair apart"})
    return kept, held, person_wins


def without_honors_pairs(ids, hmap):
    """A worklist group's member ids with every Honors id whose base sits in the same group removed. The rest of the
    group may still be offered; the pair never is. Unchanged when hmap is empty or no pair is present."""
    if not hmap:
        return list(ids)
    present = set(ids)
    return [i for i in ids if hmap.get(i) not in present]


def holds_pair(ids, hmap):
    present = set(ids)
    return any(hmap.get(i) in present for i in present)
