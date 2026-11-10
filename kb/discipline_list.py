#!/usr/bin/env python3
"""Split a comma-separated list of MQ disciplines into its names.

`cross_listed_disciplines` (kb_curation, and a minted record's own field)
holds a course's second disciplines as one comma-separated string. Two MQ
discipline names carry commas of their own: "Air Conditioning, Refrigeration,
Heating" and "Sign Language, American". A plain split on the comma read
"Sign Language, American" as two disciplines, neither of which exists (COBIx
on #3025, 2026-11-10, the day a tab first offered every MQ name as a second
discipline).

The split reads the MQ list as its dictionary: at each position it takes the
longest run of pieces that spells a known name, and a piece that begins no
known name stands alone, as it always did. With no dictionary it is the plain
split.
"""


def split_disciplines(value, known=()):
    """`value` as a list of discipline names, or [] when it holds none."""
    pieces = [p.strip() for p in str(value or "").split(",")]
    pieces = [p for p in pieces if p]
    known = set(known or ())
    longest = max((n.count(",") + 1 for n in known), default=1)
    out, i = [], 0
    while i < len(pieces):
        took = 1
        for k in range(min(longest, len(pieces) - i), 1, -1):
            if ", ".join(pieces[i:i + k]) in known:
                took = k
                break
        name = ", ".join(pieces[i:i + took])
        if name not in out:
            out.append(name)
        i += took
    return out


if __name__ == "__main__":
    import json, os, sys
    here = os.path.dirname(os.path.abspath(__file__))
    mq = json.load(open(os.path.join(here, "reference", "mq_disciplines.json"), encoding="utf-8")).get("disciplines", [])
    print(json.dumps(split_disciplines(sys.argv[1] if len(sys.argv) > 1 else "", mq)))
