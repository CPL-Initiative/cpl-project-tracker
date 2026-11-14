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

RESOLVING THE BASE (COBIx's review of #3313). A stored base can go stale two ways, and both are resolved here, once:
  * a re-mint moves it. Every re-keyer moves honors_of values with merge_into values (kb/curation_pointers.py, and
    kb/_rekey_kb_curation_supabase.py live), so a LIVE value is current by construction and stays as stored. A value
    that is not live is resolved through kb/alias_chain.py (imported, never copied), through the maps applied after
    FIELD_BASELINE only: the field was born after that map, so no older map can name its values, and resolving a
    current value again through an old map is the slot-reuse telescoping alias_chain.py warns against.
  * a merge moves it (the base merged into a third id). The worklists read the base at its merge-chain end too.
`hold_merges` takes the alias-resolved map and walks the merge chains itself.

Pure stdlib. `load_live_ids` is the one function that reads a file; everything else is a pure function, and every
reader imports these functions, none copies them.
"""
import json
import os
import re

FIELD = "honors_of"
SUFFIX = "H"
# The newest applied re-mint when the field was born (2026-11-14). Only maps after it can move an honors_of value.
# A value in the live set is NEVER moved, even when a later map names it. That is safe only while every re-keyer
# moves honors_of with the key it points at (kb/curation_pointers.py and the live re-key, in the same land): then a
# live value is current, and a later map naming it means its slot was reused by another row, which resolving would
# wrongly follow. Today it holds: no map is pending after this baseline. A re-keyer that skips honors_of breaks it.
FIELD_BASELINE = "kb/anchor_rekey_out/2026-11-08/alias_map.json"

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


def pending_alias_maps():
    """The alias maps applied after the field was born, loaded in chronological order (kb/alias_chain.py)."""
    import alias_chain
    pending, _ = alias_chain.pending_maps(None, baseline_through=FIELD_BASELINE)
    return alias_chain.load_maps(pending)


def load_live_ids(kb_dir):
    """The live M-ID set a stored base is checked against: the minted courses and the stand-alones."""
    out = set()
    for name in ("coci_minted_courses.json", "coci_minted_singletons.json"):
        try:
            with open(os.path.join(kb_dir, name), encoding="utf-8") as f:
                out |= set((json.load(f) or {}).get("courses", {}))
        except (IOError, ValueError):
            pass
    return out


def _merge_map(curations):
    return {cid: v["merge_into"] for cid, v in (curations or {}).items()
            if isinstance(v, dict) and v.get("merge_into")}


def resolve_base(base, live=None, maps=None):
    """A stored base at the current era: as stored when live (or when no live set is given), else through the maps
    after FIELD_BASELINE (one lookup per map, in order: alias_chain.resolve)."""
    if not maps or live is None or base in live:
        return base
    import alias_chain
    return alias_chain.resolve_id(base, maps)


def honors_map(curations, live=None, maps=None, merge_end=False):
    """{honors id: base id} from the overlay's `honors_of` entries (kb/coci_curation.json `curations`).

    live: the live id set; a stored base outside it resolves through the alias maps after FIELD_BASELINE (`maps`,
    loaded when not given). merge_end: also read the base at its merge-chain end over the overlay's merges, and
    return {honors id: [stored base, chain end]} for the worklists (without_honors_pairs reads either). Empty when no
    entry carries the field, with no file read."""
    raw = {cid: v[FIELD] for cid, v in (curations or {}).items() if isinstance(v, dict) and v.get(FIELD)}
    if not raw:
        return {}
    if live is not None and maps is None:
        maps = pending_alias_maps()
    out = {h: resolve_base(b, live, maps) for h, b in raw.items()}
    if not merge_end:
        return out
    mi = _merge_map(curations)
    ends = {}
    for h, b in out.items():
        e = _end(mi, b)
        ends[h] = sorted({b, e} - {h}) or [b]
    return ends


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
        # A list value names several bases (honors_map(merge_end=True): the stored base and its chain end): each is a
        # pair, and each is held (#3313's review record, minor 1: only the first was).
        for b in sorted(_bases(hmap[h])):
            if h == b or _end(kept, h) != _end(kept, b):
                continue
            # The pair would fold together. Walk both sides to the point where their paths meet; the edges before it
            # are the ones that join them. Cut the first bot edge, the Honors side's first, then the base side's:
            # cutting it leaves every merge past the meeting point and every other id's merge in place. A person's
            # edge is never cut; the pair's honors_of is set aside only when every joining edge is a person's (Rule 10).
            hp, bp = _path(kept, h), _path(kept, b)
            on_b = set(bp)
            meet = next(i for i in hp if i in on_b)
            joining = hp[:hp.index(meet)] + bp[:bp.index(meet)]
            cut = None
            for edge in joining:
                if is_bot(merge_by.get(edge, "@bot")):
                    trial = dict(kept)
                    trial.pop(edge)
                    if _end(trial, h) != _end(trial, b):
                        cut = edge
                        break
            if cut is None:
                edge = joining[0] if joining else (h if h in kept else b)
                person_wins.append({"honors_id": h, "base_id": b, "merge_source": edge, "merge_into": kept.get(edge),
                                    "reviewer": merge_by.get(edge),
                                    "why": "a person's merge joins the pair: it stands (Rule 10)"})
                continue
            held.append({"honors_id": h, "base_id": b, "merge_source": cut, "merge_into": kept.pop(cut),
                         "reviewer": merge_by.get(cut), "why": "honors_of holds the pair apart"})
    return kept, held, person_wins


def _path(merge_into, i):
    """i, then each id its merges reach, to the chain's end (a cycle stops at the repeat)."""
    out = [i]
    while i in merge_into and merge_into[i] not in out:
        i = merge_into[i]
        out.append(i)
    return out


def _bases(v):
    return set(v) if isinstance(v, (list, tuple, set)) else {v}


def without_honors_pairs(ids, hmap):
    """A worklist group's member ids with every Honors id whose base sits in the same group removed. The rest of the
    group may still be offered; the pair never is. hmap values may be one base or a list (honors_map(merge_end=True):
    the stored base and its merge-chain end). Unchanged when hmap is empty or no pair is present."""
    if not hmap:
        return list(ids)
    present = set(ids)
    return [i for i in ids if not (i in hmap and _bases(hmap[i]) & (present - {i}))]


def holds_pair(ids, hmap):
    present = set(ids)
    return any(i in hmap and _bases(hmap[i]) & (present - {i}) for i in present)


def pair_list(hmap):
    """Every (Honors id, base) pair the hmap names, sorted: computed once, then handed to `would_join`."""
    return sorted({(h, bb) for h, b in hmap.items() for bb in _bases(b) if h != bb})


def joined_pairs(merge_into, pairs):
    """[(honors id, base)] that end under one id in this merge map. `pairs` is a pair_list or an hmap."""
    if isinstance(pairs, dict):
        pairs = pair_list(pairs)
    return [(a, b) for a, b in pairs if _end(merge_into, a) == _end(merge_into, b)]


_MISSING = object()


def would_join(src, target, merge_into, pairs):
    """True when writing src -> target into this merge map would put a pair that is apart now under one id.

    A trial over EVERY pair, not a look at src's own partners: a fold of a third id that one side already merged
    into joins the pair as surely as a fold of the side itself (COBIx's review of #3313, round 2). The write is made
    in place and undone, so the map is never copied. The generator's in-memory folds (Phase B, R4, routing) ask this
    before each write, because they also consume and synthesize rows and a later cut could not restore them."""
    if not pairs:
        return False
    before = {p for p in pairs if _end(merge_into, p[0]) == _end(merge_into, p[1])}
    prev = merge_into.get(src, _MISSING)
    merge_into[src] = target
    try:
        return any(p not in before and _end(merge_into, p[0]) == _end(merge_into, p[1]) for p in pairs)
    finally:
        if prev is _MISSING:
            del merge_into[src]
        else:
            merge_into[src] = prev


def phase_b_members(mems, oid, merge_into, pairs, honors_ids):
    """Phase B's member rows for official id `oid`, less any whose fold into it would join a pair. Members are tried
    one by one in a stable order (bases before Honors ids, then by id), each against the map with the members
    accepted so far, so the result never depends on the order the rows came in; the kept rows keep their order."""
    trial = dict(merge_into)
    ordered = sorted(range(len(mems)), key=lambda k: (mems[k]["id"] in honors_ids, mems[k]["id"]))
    keep = set()
    for k in ordered:
        i = mems[k]["id"]
        if would_join(i, oid, trial, pairs):
            continue
        trial[i] = oid
        keep.add(k)
    return [m for k, m in enumerate(mems) if k in keep]


def check_apart(merge_into, pairs, strict=False):
    """The assertion after every fold: no pair ends under one id. `would_join` is complete by construction, so this
    never fires; when it does, a fold was added without the guard. strict (the test suite, --check) fails the run."""
    left = joined_pairs(merge_into, pairs)
    if left and strict:
        raise SystemExit("honors_of: a fold joined " + ", ".join(f"{a}/{b}" for a, b in left[:10]))
    return left


def report_joined(left, env=None):
    """Put the joined-pair count where the daily run reports its health (COBIx's read of #3313, item 3): the count
    goes to $GITHUB_ENV as HONORS_PAIRS_JOINED, which daily-dashboard.yml's Summary step writes into its table and
    turns into one `::warning` annotation when non-zero. Outside Actions it writes nothing. Returns the build-log
    lines to print."""
    env = os.environ if env is None else env
    n = len(left or [])
    path = env.get("GITHUB_ENV")
    if path:
        with open(path, "a", encoding="utf-8") as f:
            f.write(f"HONORS_PAIRS_JOINED={n}\n")
    if not n:
        return []
    names = ", ".join(f"{h}/{b}" for h, b in left[:5])
    return [f"  honors_of: WARNING honors-pair-joined: {n} pair(s) fold together after the in-memory folds: {names}"]
