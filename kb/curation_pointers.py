#!/usr/bin/env python3
"""The curation overlay's id-valued fields, and the one re-key of their values (S653).

A `kb_curation` row whose VALUE is an id moves with a re-mint, exactly as its course_id does: `merge_into` (the
merge target) and `honors_of` (an Honors M-ID's base, kb/honors_of.py). Every re-keyer of the overlay calls
`rekey_entry`, and kb/_rekey_kb_curation_supabase.py (the live re-key, supabase-rekey.yml) reads POINTER_FIELDS, so a
new id-valued field joins every re-key by one line here. `merge_dismissed` is a "|"-joined group signature and is
not re-keyed (a changed group legitimately re-offers).

Before this module each re-keyer moved merge_into alone, and a re-mint would have left every honors_of naming a dead
base until the next live sync (COBIx's review of #3313). Re-mint scripts that ran once and are frozen history keep
their own loop; the list is in docs/reference/honors_of_design.md, *Re-keyers*.
"""

POINTER_FIELDS = ("merge_into", "honors_of")


def rekey_entry(entry, alias):
    """(entry, moved): the overlay entry with each pointer value the flat alias map names moved to its new id. The
    caller's dict is never changed: a copy is returned when anything moves, else the same entry."""
    if not isinstance(entry, dict):
        return entry, 0
    out, moved = entry, 0
    for field in POINTER_FIELDS:
        v = entry.get(field)
        if v and v in alias and alias[v]:
            if out is entry:
                out = dict(entry)
            out[field] = alias[v]
            moved += 1
    return out, moved
