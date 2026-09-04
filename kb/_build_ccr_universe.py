#!/usr/bin/env python3
"""CCR Universe — precomputed layout for every course identity, with every
stand-alone course in orbit around the identity it is most aligned to.

READ-ONLY. Emits prototype/ccr_universe.json (+ the member payload and the
per-discipline description shards).

WHY PRECOMPUTED
---------------
~50,000 points cannot be force-laid-out in a browser on every load, and a live
force graph at that size is an unreadable hairball besides. So the layout is
computed ONCE here and shipped as coordinates: the browser only draws, which
makes pan/zoom/search instant and the result stable between sessions (a layout
that reshuffles every load is unnavigable — you cannot learn where anything is).

The arrangement is ISLANDS: one per discipline, packed on a spiral biggest-first.
Disciplines are the thing a curator navigates by, and keeping them spatially
separate is what makes "this course is in the wrong subject entirely" visible at
a glance — and what lets a curator drag one island next to another to move a
course across areas.

STAND-ALONES ORBIT (Sam, 2026-09-03)
------------------------------------
Sam: "have unassigned course individually in orbit around the cluster they are
most aligned to (rather than having them all sit in a huge cluster as they are
now)." Until this change every discipline had a second "· stand-alone" island —
Kinesiology's held 2,400 points in one disc, which is exactly the blob he was
describing. Now each stand-alone course is scored against the clustered
identities of its own discipline and placed on an orbit ring around the best
match, so the map itself proposes where the course probably belongs and the
curator can accept it with one drag.

The alignment is a PLACEMENT SUGGESTION, never a curation decision: nothing is
written, the point stays hollow, and the inspector says why it sits where it
does. The signals, in the order they count:

  local subject code shared     the colleges' own subject prefix (e.g. ADED)
  title words shared            Dice overlap of lightly stemmed title tokens
  same SUBJ4                    our own working label — weak, near-constant
                                inside one discipline, so it never decides alone
  TOP · units · credit type     corroborators only — they add nothing unless a
                                subject or title signal already fired (Rule 7's
                                two-signals-agree gate: TOP is faculty-entered
                                with no gatekeeper and must never lead)

A stand-alone with no title overlap and no shared local subject has no honest
parent at home. ORBITS MAY CROSS DISCIPLINES (Sam, 2026-09-03; see GRAB_BAG
below): a course filed under a grab-bag discipline (Vocational, the no-discipline
pile) is scored against the whole reference with a small bonus for staying home;
any other course looks outside its subject only when nothing at home qualified,
and then only for a strong title match. A cross-discipline satellite is drawn in
its parent's island and carries `h`, the discipline it is filed under. What is
left sits on its island's OUTER RIM, individually, and the inspector says so.

Positions are in an abstract world space; the client maps to screen.

MEMBERS SHIP SEPARATELY
-----------------------
The layout payload carries identities. The DRAG carries courses, so SkyView also
needs the member college courses — ~134,000 of them. They go to a SECOND file
(--members-out) rather than into the island points, for two reasons:
ccr_universe.json stays a layout file for every other reader, and "the members
cost N MB" stays a legible fact instead of a silent doubling of a file nobody
re-measures.

The member record is the minimum a drag needs: [control_number, course code,
college index]. Titles and units are NOT carried here — they travel in the
description shards, which load per discipline only when a curator opens an
identity. The control number is stored as an INTEGER with the invariant "CCC"
prefix stripped; a member whose control number is absent or malformed is DROPPED
and counted, never coerced to zero, because the control number IS the write key
(`CN:<control_number>`) and a course with no key cannot be re-homed.

DESCRIPTION SHARDS ARE KEYED BY CONTROL NUMBER
----------------------------------------------
One JSON file per discipline: { "<control number digits>": [description, course
title, units] }. Keyed by control number rather than by member position so a
member the payload drops (no key) cannot shift every later description onto the
wrong course, and so the shards stay valid when the layout is rebuilt. They are
gitignored (45 MB of derived text) and published to the public Supabase Storage
bucket `ccr-desc` by .github/workflows/skyview-desc-shards.yml — Sam's lean,
2026-08-24: "I expect we'll put the shards on supabase."
"""
import argparse, json, math, os, re, unicodedata, zlib
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BLANK = "(no discipline yet)"

# why-bits on an orbiting point (`w`), decoded by prototype/ccr_universe.js
W_SUBJ, W_SUBJ4, W_TITLE, W_TOP, W_UNITS, W_CREDIT = 1, 2, 4, 8, 16, 32

# Minimum evidence for an orbit. Either the titles genuinely overlap, or the
# colleges' own subject code is shared AND at least one title word agrees. A
# bare SUBJ4 match never qualifies: inside one discipline nearly every identity
# shares it, so it would attach every stray to the biggest identity for no reason.
ALIGN_MIN_DICE = 0.25

# ORBITS MAY CROSS DISCIPLINES (Sam, 2026-09-03). "We have in our CCR queue
# Business courses that are assigned to the Business subject while others are
# assigned to Vocational subject (a noncredit practice), but there is a small
# business discipline MQ that would probably be a better fit for the vocational
# business courses--so I would want them to orbit around business or small
# business… vocational is a big grab bag of noncredit courses and many need to
# stay there and some need to be moved to a MID course in another discipline."
#
# Two rules follow. A course filed under a GRAB-BAG discipline is scored against
# the whole reference, with a small bonus for staying home ("many need to stay
# there") so it leaves only for a clearly better parent. A course filed under
# any other discipline is scored at home first, and only when nothing at home
# qualifies does it look across the reference — and then it needs a STRONG title
# match, because leaving your own subject on a weak one is how a map starts
# lying. Either way the point is drawn in the parent's island and carries `h`,
# the discipline it is filed under, so the inspector can say so.
GRAB_BAG = {"Vocational", BLANK}
HOME_BONUS = 0.4
CROSS_MIN_DICE = 0.5
# …and at least two title words in common (or the whole title), because on a
# two-word title one shared word is Dice 0.5: "Mediation Skills" would have
# crossed to "Study Skills Lab", "Shop Steward" to "Machine Shop". Measured on the
# first cross build, 2026-09-03.
CROSS_MIN_SHARED = 2

STOP = {
    "the", "a", "an", "and", "of", "to", "in", "for", "on", "with", "or", "at",
    "by", "from", "into", "its", "i", "ii", "iii", "iv", "v", "vi", "vii", "viii",
    "ix", "x", "introduction", "intro", "introductory", "part", "level", "topics",
    "special", "course", "courses", "studies", "study", "basic", "fundamentals",
    "principles", "general", "applied", "advanced", "beginning", "intermediate",
    "elementary", "seminar", "lab", "laboratory", "practicum", "workshop",
}
WORD_RE = re.compile(r"[a-z0-9]+")
NUM_RE = re.compile(r"^\d+[a-z]?$")


def stem(w):
    """Tiny stemmer: enough that 'swimming'/'swim', 'applications'/'application'
    and 'studies'/'study' agree. Deliberately conservative — a stemmer that
    over-merges makes unrelated titles look aligned."""
    if len(w) > 5 and w.endswith("ing"):
        w = w[:-3]
        if len(w) > 3 and w[-1] == w[-2]:          # swimm -> swim
            w = w[:-1]
    elif len(w) > 4 and w.endswith("ies"):
        w = w[:-3] + "y"
    elif len(w) > 4 and w.endswith("es") and not w.endswith("ss"):
        w = w[:-2]
    elif len(w) > 3 and w.endswith("s") and not w.endswith("ss"):
        w = w[:-1]
    return w


def toks(title):
    """Stemmed content words of a title. Bare numbers drop out: 'Conditioning 4'
    and 'Conditioning 3' are the same family, and a level digit is not a topic."""
    out = set()
    for w in WORD_RE.findall((title or "").lower()):
        # bare numbers are level markers; a lone letter ("3-D", "2-D") is noise
        if w in STOP or NUM_RE.match(w) or len(w) < 2:
            continue
        out.add(stem(w))
    return out


def prefix(ident):
    return str(ident or "").split(" ")[0].upper()


def local_subjects(row):
    return {str(s).upper() for s in (row.get("subj") or []) if s}


def dice(a, b):
    if not a or not b:
        return 0.0
    return 2.0 * len(a & b) / (len(a) + len(b))


def score_pair(sa, ident, sa_toks, id_toks):
    """Alignment score of one stand-alone against one identity. Returns
    (score, why_bits, dice). Corroborators (TOP, units, credit) count only after a
    subject or title signal fired — see the module docstring."""
    # The TITLE carries the weight. Inside one discipline the subject code is
    # shared by most identities and the corroborators are cheap to satisfy, so
    # if they could outvote a title the best-named parent would lose to the one
    # with matching units and TOP — measured on the first build: "Swim Training
    # for Competition" landed on "Aerobic Weight Training" over a swimming
    # identity because TOP + units + credit added 1.5 to a weaker title match.
    # Weights: a full corroborator stack (subject + TOP + units + credit) is
    # worth 2.2, which a title gap of ~0.28 Dice overturns. A marginal title
    # difference legitimately loses to shared subject code, TOP and units; a
    # clear one does not.
    why, score = 0, 0.0
    if local_subjects(sa) & local_subjects(ident):
        score += 1.5; why |= W_SUBJ
    elif prefix(sa["id"]) == prefix(ident["id"]):
        score += 0.3; why |= W_SUBJ4
    d = dice(sa_toks, id_toks)
    if d > 0:
        score += 8.0 * d; why |= W_TITLE
    if why & (W_SUBJ | W_TITLE):
        if sa.get("top") and sa.get("top") == ident.get("top"):
            score += 0.5; why |= W_TOP
        if sa.get("units") is not None and sa.get("units") == ident.get("units"):
            score += 0.15; why |= W_UNITS
        if sa.get("credit") and sa.get("credit") == ident.get("credit"):
            score += 0.05; why |= W_CREDIT
    return score, why, d


def qualifies(why, d):
    """The evidence floor an orbit needs (see ALIGN_MIN_DICE)."""
    if d >= ALIGN_MIN_DICE:
        return True
    return bool(why & W_SUBJ) and d > 0


def align_standalones(idents, sas, home_disc=None, home_bonus=0.0, min_dice=0.0, min_shared=0):
    """Score every stand-alone in `sas` against the identities in `idents`.

    Returns {stand_alone_id: (parent_id, score, why_bits)} for those that clear
    the floor; the rest are absent (the caller puts them on the rim). Candidate
    identities are found through inverted indexes on title tokens and subject
    codes, so an island of 1,000 identities is not 1,000 comparisons per course.

    `home_disc` + `home_bonus`: candidates in the stand-alone's own discipline
    score the bonus, so a grab-bag course stays home unless another discipline
    is clearly better. `min_dice` / `min_shared`: a stricter title floor (Dice,
    and words in common unless the titles are identical), used when a course is
    allowed to look outside its own subject at all.
    """
    by_tok, by_subj, id_toks = defaultdict(list), defaultdict(list), []
    for k, r in enumerate(idents):
        t = toks(r.get("title"))
        id_toks.append(t)
        for w in t:
            by_tok[w].append(k)
        for c in local_subjects(r) | {prefix(r["id"])}:
            by_subj[c].append(k)
    out = {}
    for s in sas:
        st = toks(s.get("title"))
        cand = set()
        for w in st:
            cand.update(by_tok.get(w, ()))
        for c in local_subjects(s):
            cand.update(by_subj.get(c, ()))
        best = None
        for k in cand:
            r = idents[k]
            sc, why, d = score_pair(s, r, st, id_toks[k])
            if not qualifies(why, d) or d < min_dice:
                continue
            if min_shared and d < 0.99 and len(st & id_toks[k]) < min_shared:
                continue
            if home_disc is not None and (r.get("disc") or BLANK) == home_disc:
                sc += home_bonus
            key = (sc, int(r.get("members") or 0), r["id"])
            if best is None or key > best[0]:
                best = (key, r["id"], sc, why)
        if best:
            out[s["id"]] = (best[1], round(best[2], 2), best[3])
    return out


# ── geometry ─────────────────────────────────────────────────────────────────
SAT_R = 2.6          # world radius of a stand-alone satellite
RING_GAP = 1.6       # clearance between satellites on a ring / between rings
NODE_GAP = 1.6       # clearance between identity footprints
GOLDEN = 2.399963229728653


def node_r(members):
    """The identity's drawn radius in world units — the SAME formula the client
    draws with ((2.2 + sqrt(n) * 1.05) * zoom), so a footprint computed here is
    the footprint on screen."""
    return 2.2 + math.sqrt(max(1, members)) * 1.05


def plan_rings(base_r, count, sat_r=SAT_R):
    """Orbit rings around a node of radius base_r for `count` satellites:
    [(ring_radius, slots)], inner ring first, every ring full before the next."""
    rings, R, left = [], base_r + sat_r + 2.2, count
    while left > 0:
        cap = max(6, int(2 * math.pi * R / (2 * sat_r + RING_GAP)))
        take = min(cap, left)
        rings.append((round(R, 2), take))
        left -= take
        R += 2 * sat_r + RING_GAP + 0.2
    return rings


def footprint(base_r, rings, sat_r=SAT_R):
    return base_r if not rings else rings[-1][0] + sat_r + 1.0


def ring_positions(cx, cy, R, count, phase):
    """`count` points evenly spaced on a ring, starting at `phase` radians."""
    return [(cx + R * math.cos(phase + 2 * math.pi * i / count),
             cy + R * math.sin(phase + 2 * math.pi * i / count)) for i in range(count)]


def phase_of(key):
    """A stable per-identity rotation so neighbouring orbits do not all start at
    3 o'clock. Deterministic (zlib.crc32), so the layout is reproducible."""
    return (zlib.crc32(str(key).encode("utf-8")) % 3600) / 3600.0 * 2 * math.pi


def pack_rings(items, gap=NODE_GAP):
    """Place circles of radius `items[i]` (sorted DESCENDING by the caller) on
    concentric rings: the largest at the centre, then rings outward, each ring
    sized by the largest footprint it carries so nothing on it can overlap.

    Returns ([(x, y)...] in input order, outer_radius). O(n), deterministic, and
    it never produces an overlap — which a spiral pack only approximates and a
    force layout only promises.
    """
    if not items:
        return [], 0.0
    pos = [None] * len(items)
    pos[0] = (0.0, 0.0)
    R_prev, f_prev = 0.0, items[0]
    i = 1
    while i < len(items):
        f_ring = items[i]                       # largest on this ring (sorted desc)
        R = R_prev + f_prev + f_ring + gap
        cap = max(1, int(2 * math.pi * R / (2 * f_ring + gap)))
        take = min(cap, len(items) - i)
        # Spread the ring's members evenly even when it is not full, and rotate
        # rings against each other so radial "spokes" do not form.
        for j, (x, y) in enumerate(ring_positions(0, 0, R, take, 0.37 * i)):
            pos[i + j] = (x, y)
        R_prev, f_prev = R, f_ring
        i += take
    return pos, R_prev + f_prev


def layout_island(idents, sats_by_parent, rim_sats, sat_r=SAT_R):
    """Lay out one discipline: identities (with their orbiting stand-alones) on
    concentric rings, then the unaligned stand-alones on rim rings outside them.

    Returns (points, radius). Points carry island-relative coordinates; the
    caller adds the island centre. Identity points: i,x,y,t,n,s,f,r,u[,k].
    Satellite points add a:1 and o (parent id) / q (score) / w (why) — plus h
    (the discipline the course is filed under) when that is not this island —
    or, on the rim, a:1 with no `o`. `sats_by_parent` values are
    (row, (score, why)) or (row, (score, why), home) tuples.
    """
    plans = []
    for r in idents:
        base = node_r(int(r.get("members") or 0))
        sats = sats_by_parent.get(r["id"], [])
        rings = plan_rings(base, len(sats), sat_r)
        plans.append((r, base, rings, footprint(base, rings, sat_r), sats))
    plans.sort(key=lambda p: (-p[3], -(int(p[0].get("members") or 0)), p[0]["id"]))
    centres, core_r = pack_rings([p[3] for p in plans])

    pts = []
    for (r, base, rings, foot, sats), (cx, cy) in zip(plans, centres):
        pt = point_of(r, cx, cy)
        if sats:
            pt["k"] = len(sats)
        pts.append(pt)
        si = 0
        ph = phase_of(r["id"])
        for R, slots in rings:
            for (x, y) in ring_positions(cx, cy, R, slots, ph):
                item = sats[si]
                s, (score, why) = item[0], item[1]
                home = item[2] if len(item) > 2 else None
                sp = point_of(s, x, y)
                sp.update({"a": 1, "o": r["id"], "q": score, "w": why})
                if home is not None:
                    sp["h"] = home                  # filed under another discipline
                pts.append(sp)
                si += 1
    # the rim: unaligned stand-alones on rings outside the identity pack
    R = core_r + sat_r + 4.0 if plans else 0.0
    left = list(rim_sats)
    if not plans and left:
        # A discipline with no identities at all: one course at the centre, the
        # rest on rings from the first radius two satellites can share.
        sp = point_of(left[0], 0.0, 0.0); sp["a"] = 1; pts.append(sp)
        left = left[1:]
        R = 2 * sat_r + RING_GAP
    ring_i = 0
    while left:
        cap = max(6, int(2 * math.pi * R / (2 * sat_r + RING_GAP)))
        take = min(cap, len(left))
        for (x, y), s in zip(ring_positions(0, 0, R, take, 0.31 * ring_i), left[:take]):
            sp = point_of(s, x, y)
            sp["a"] = 1
            pts.append(sp)
        left = left[take:]
        R += 2 * sat_r + RING_GAP + 0.2
        ring_i += 1
    radius = max(R if rim_sats or not plans else core_r, 12.0) + sat_r + 6.0
    return pts, radius


# 0 credit · 1 noncredit · 2 noncredit enhanced. Absent = not recorded, and it
# stays absent rather than defaulting — see the note in point_of().
CREDIT_CODE = {"Credit": 0, "Noncredit": 1, "Noncredit Enhanced": 2}


def point_of(row, x, y):
    fl = row.get("flags") or {}
    pt = {
        "i": row["id"], "x": round(x, 1), "y": round(y, 1),
        "t": row.get("title") or "",
        "n": int(row.get("members") or 0),
        "s": {"C-ID": 1, "CCN-ID": 2, "M-ID": 0}.get(row.get("id_system"), 3),
        "f": 1 if any(v is True or (isinstance(v, str) and v)
                      for kk, v in fl.items() if kk != "reviewed") else 0,
        "r": 1 if fl.get("reviewed") else 0,
    }
    if row.get("units") is not None:
        pt["u"] = row["units"]
    # ── credit status, so the map can draw and filter on it ───────────────────
    # Sam, 2026-09-04: "Need to visually differentiate NC courses … Also need a
    # CR NC toggle", and "In the Keyword Search, keep CR courses together
    # separated from NC courses". The scorer already READ `credit` as a
    # corroborator (W_CREDIT) but nothing ever emitted it, so the client could
    # not draw what it never received.
    #
    # ⚠️ THREE STATES AND A GAP, not two. "Noncredit" and "Noncredit Enhanced"
    # are different things (the Enhanced/CDCP distinction), and 73 identities
    # carry no value at all. A field that collapsed this to a boolean would make
    # those 73 silently credit — the false-zero shape this repo has been bitten
    # by before. Absent stays absent: `c` is simply not emitted.
    c = CREDIT_CODE.get((row.get("credit") or "").strip())
    if c is not None:
        pt["c"] = c
    return pt


def load_js(fname):
    with open(os.path.join(ROOT, fname), encoding="utf-8") as fh:
        src = fh.read()
    i = src.index("window."); i = src.index("=", i) + 1
    return json.loads(src[i:].strip().rstrip(";"))


CN_RE = re.compile(r"^CCC(\d{9})$")


def slug(name):
    """Discipline -> a filename. Stable, lowercase, ASCII-safe, collision-checked by
    the caller — a shard whose name collides would silently serve another subject's
    descriptions, which is worse than having none."""
    out = []
    for ch in unicodedata.normalize("NFKD", name):
        if ch.isalnum() and ord(ch) < 128:
            out.append(ch.lower())
        elif out and out[-1] != "-":
            out.append("-")
    return ("".join(out).strip("-") or "x")[:60]


def cn_digits(raw):
    hit = CN_RE.match(str(raw or "").strip().upper())
    return str(int(hit.group(1))) if hit else None


def write_desc_shards(islands, out_rel, mem, desc):
    """Course descriptions, ONE FILE PER DISCIPLINE, fetched when a curator opens
    an identity: { "<control number digits>": [description|null, title, units] }.

    `mem` is unified_courses_members.js's members map (identity -> [{cn,n,t,u,c,p}]),
    `desc` is unified_courses_member_desc.js's map (identity -> [text per member,
    in the same order]). Keying the shard by control number is what makes the
    two agree even when a member has no key or the layout is rebuilt.

    WHY NOT INLINE. Measured 2026-08-24: descriptions are 34.8 MB at their stored
    500-char truncation and still 11.6 MB cut to 120 chars, against a built page
    already at 9.7 MB. There is no truncation that makes them inlinable and still
    worth reading, so they load on demand from the `ccr-desc` storage bucket (or
    from ./ccr_desc/ when the page is served locally). Under file:// fetch() is
    blocked and the client SAYS so — a drill-down that shows nothing is
    indistinguishable from a course with no description.
    """
    path = os.path.join(ROOT, out_rel)
    os.makedirs(path, exist_ok=True)
    for stale in os.listdir(path):          # a renamed discipline must not leave a ghost
        if stale.endswith(".json"):
            os.remove(os.path.join(path, stale))

    seen, total, n_desc, n_courses = {}, 0, 0, 0
    for isl in islands:
        name = isl["sh"]
        if name in seen and seen[name] != isl["d"]:
            raise SystemExit(f"shard name collision: {isl['d']!r} and {seen[name]!r} "
                             f"both slug to {name!r} — rename before shipping")
        seen[name] = isl["d"]
        shard = {}
        for pt in isl["p"]:
            members = mem.get(pt["i"]) or []
            texts = desc.get(pt["i"]) or []
            for k, m in enumerate(members):
                cn = cn_digits(m.get("cn"))
                if not cn:
                    continue
                text = texts[k] if k < len(texts) and texts[k] else None
                rec = [text, m.get("t") or "", m.get("u")]
                if cn in shard and shard[cn][0] and not text:
                    continue                       # keep the described copy of a shared key
                shard[cn] = rec
                n_courses += 1
                if text:
                    n_desc += 1
        blob = json.dumps(shard, separators=(",", ":"), ensure_ascii=False)
        with open(os.path.join(path, name + ".json"), "w", encoding="utf-8") as fh:
            fh.write(blob)
        total += len(blob.encode("utf-8"))
    print(f"wrote {out_rel}/  ({len(islands)} shards, {total/1048576:.1f} MB, "
          f"{n_courses:,} courses, {n_desc:,} with a description)")
    return {"shards": len(islands), "bytes": total, "courses": n_courses, "described": n_desc}


def write_members(mem_payload, placed_ids, out_rel):
    """Emit the draggable member courses for the identities the universe places.

    Record: [control_number:int, course code, college index]. See the module
    docstring for why the title is left out and why a member with no usable
    control number is dropped rather than carried with a placeholder key.

    Two counts are reported because they mean different things and a reader who
    sees only one will misread the file:

      dropped_no_key            a member that cannot be dragged at all.
      cn_on_multiple_identities a control number surfacing under MORE THAN ONE
                                identity. That is the known forward-join
                                behavior for an over-merged identity, and it
                                matters here because the WRITE is one row per
                                control number: re-homing such a course is a
                                single global statement, so it must leave every
                                card it was showing on, not just the one the
                                curator was looking at. The consumer needs the
                                number to know that case is live.

    ⚠️ That counter answers ONE question and is routinely read as answering a
    second. It counts one course claimed by several identities. It does NOT
    count a control number that names several different COURSES — a separate
    fault, larger, and not bounded by this one, because the write key cannot
    tell those rows apart at all. Sized by kb/_audit_control_number_claims.py;
    guarded in the consumer by prototype/ccr_universe.js::canMove. No figure is
    quoted here on purpose: the last one sat in this docstring until it was
    wrong by 43.
    """
    mem = mem_payload["members"]
    out, dropped, owners = {}, 0, defaultdict(set)
    for ident in placed_ids:
        recs = []
        for m in mem.get(ident, ()):
            hit = CN_RE.match(str(m.get("cn") or "").strip().upper())
            if not hit:
                dropped += 1
                continue
            recs.append([int(hit.group(1)), m.get("n") or "", m.get("c")])
            owners[hit.group(1)].add(ident)
        if recs:
            out[ident] = recs

    payload = {
        "_about": "SkyView draggable members — identity id -> [[control_number, "
                  "course code, college index]]. Control numbers are the CCC prefix "
                  "stripped; re-add it to write CN:CCC<9 digits>. READ-ONLY extract.",
        "_generated_from": mem_payload.get("generated_at"),
        "colleges": mem_payload.get("colleges") or [],
        "counts": {
            "identities": len(out),
            "members": sum(len(v) for v in out.values()),
            "dropped_no_key": dropped,
            "cn_on_multiple_identities": sum(1 for v in owners.values() if len(v) > 1),
        },
        "m": out,
    }
    path = os.path.join(ROOT, out_rel)
    json.dump(payload, open(path, "w", encoding="utf-8"), separators=(",", ":"))
    c = payload["counts"]
    print(f"wrote {out_rel}  ({os.path.getsize(path)/1024:.0f} KB)")
    print(f"  {c['members']:,} members over {c['identities']:,} identities; "
          f"{c['dropped_no_key']} dropped for no control number; "
          f"{c['cn_on_multiple_identities']:,} control numbers on >1 identity")


def group_corpus(rows, sa_rows):
    """Group identities and stand-alones by discipline, and decide where every
    stand-alone sits: orbiting a parent in its own discipline, orbiting a parent
    found corpus-wide (no-discipline courses only), or on its island's rim.

    Returns (order, sats_by_parent, rim_by_disc, stats) where `order` is the
    discipline list biggest-first with its identity rows.
    """
    by_disc, sa_by_disc = defaultdict(list), defaultdict(list)
    for r in rows:
        by_disc[r.get("disc") or BLANK].append(r)
    for r in sa_rows:
        sa_by_disc[r.get("disc") or BLANK].append(r)

    sats_by_parent = defaultdict(list)          # parent id -> [(sa row, (score, why), home|None)]
    rim_by_disc = defaultdict(list)             # disc -> [sa row]
    disc_of_ident = {r["id"]: (r.get("disc") or BLANK) for r in rows}
    stats = {"aligned": 0, "aligned_cross": 0, "aligned_from_blank": 0, "rim": 0,
             "why": defaultdict(int)}

    for disc, sas in sa_by_disc.items():
        idents = by_disc.get(disc, [])
        if disc in GRAB_BAG:
            # A grab bag: ask the whole reference, with a bonus for staying home.
            hits = align_standalones(rows, sas, home_disc=disc, home_bonus=HOME_BONUS)
        else:
            hits = align_standalones(idents, sas) if idents else {}
            # Nothing at home qualified: a STRONG title match elsewhere may still
            # give the course a parent; anything weaker stays on this island's rim.
            left = [x for x in sas if x["id"] not in hits]
            if left:
                hits.update(align_standalones(rows, left, min_dice=CROSS_MIN_DICE,
                                              min_shared=CROSS_MIN_SHARED))
        for s in sas:
            hit = hits.get(s["id"])
            if hit:
                parent, score, why = hit
                pdisc = disc_of_ident.get(parent, BLANK)
                home = disc if pdisc != disc else None
                sats_by_parent[parent].append((s, (score, why), home))
                stats["aligned"] += 1
                if home is not None:
                    stats["aligned_cross"] += 1
                if disc == BLANK:
                    stats["aligned_from_blank"] += 1
                for bit in (W_SUBJ, W_SUBJ4, W_TITLE, W_TOP, W_UNITS, W_CREDIT):
                    if why & bit:
                        stats["why"][bit] += 1
            else:
                rim_by_disc[disc].append(s)
                stats["rim"] += 1
    for parent in sats_by_parent:
        sats_by_parent[parent].sort(key=lambda t: (-t[1][0], t[0]["id"]))

    all_discs = set(by_disc) | set(sa_by_disc)
    weight = {d: len(by_disc.get(d, [])) + 0.25 * len(sa_by_disc.get(d, [])) for d in all_discs}
    order = sorted(all_discs, key=lambda d: (-weight[d], d))
    return order, by_disc, sa_by_disc, sats_by_parent, rim_by_disc, disc_of_ident, stats


def build_islands(order, by_disc, sa_by_disc, sats_by_parent, rim_by_disc):
    GAP = 34.0
    islands, placed = [], []
    for k, disc in enumerate(order):
        idents = by_disc.get(disc, [])
        pts, r_isl = layout_island(idents, sats_by_parent, rim_by_disc.get(disc, []))
        r_isl = max(26.0, r_isl)
        # walk outward on a golden-angle spiral until this disc clears every
        # island already placed — biggest first keeps the centre dense
        step = 0.0
        while True:
            theta_k = GOLDEN * k + step
            dist = 46.0 * math.sqrt(k + 1) + step * 26.0
            cx, cy = dist * math.cos(theta_k), dist * math.sin(theta_k)
            if all(math.hypot(cx - p[0], cy - p[1]) > (r_isl + p[2] + GAP) for p in placed):
                break
            step += 0.28
            if step > 400:                              # give up rather than hang
                break
        placed.append((cx, cy, r_isl))
        for p in pts:
            p["x"] = round(p["x"] + cx, 1)
            p["y"] = round(p["y"] + cy, 1)
        n_sa = sum(1 for p in pts if p.get("a"))
        islands.append({
            "d": disc, "sh": slug(disc),
            "x": round(cx, 1), "y": round(cy, 1), "r": round(r_isl, 1),
            "n": len(idents), "sa": n_sa,
            "al": sum(1 for p in pts if p.get("a") and p.get("o")),
            "xin": sum(1 for p in pts if p.get("h")),   # drawn here, filed under another subject
            "p": pts,
        })
    xs = [p[0] for p in placed]; ys = [p[1] for p in placed]; rs = [p[2] for p in placed]
    bounds = {"x0": round(min(x - r for x, r in zip(xs, rs)), 1),
              "x1": round(max(x + r for x, r in zip(xs, rs)), 1),
              "y0": round(min(y - r for y, r in zip(ys, rs)), 1),
              "y1": round(max(y + r for y, r in zip(ys, rs)), 1)}
    return islands, bounds


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="prototype/ccr_universe.json")
    ap.add_argument("--members-out", default="prototype/ccr_universe_members.json",
                    help="second payload: the draggable member courses per identity")
    ap.add_argument("--desc-dir", default="prototype/ccr_desc",
                    help="per-discipline description shards, fetched on demand")
    ap.add_argument("--shards-only", action="store_true",
                    help="write only the description shards (the storage publisher "
                         "runs this; the layout payloads stay as committed)")
    ap.add_argument("--no-standalone", dest="include_standalone", action="store_false",
                    default=True, help="omit the stand-alone courses (a lighter payload)")
    args = ap.parse_args()

    data = load_js("unified_courses_data.js")
    mem_payload = load_js("unified_courses_members.js")
    mem = mem_payload["members"]
    rows, seen, dup = [], set(), []
    for r in data["rows"]:
        # The export carries a few identity ids TWICE (2026-09-03: `ENGL 100` and
        # `ITIS 160`, both CCNs). A point id is a key here — the client indexes
        # nodes and orbits by it — so the first row wins and the rest are named,
        # never silently drawn twice.
        if r["id"] in seen:
            dup.append(r["id"]); continue
        seen.add(r["id"]); rows.append(r)
    if dup:
        print(f"  note: {len(dup)} duplicate identity id(s) in unified_courses_data.js "
              f"kept once: {', '.join(sorted(set(dup)))}")
    sa_rows = []
    if args.include_standalone:
        for r in load_js("unified_courses_standalone.js")["rows"]:
            if r["id"] in seen:
                dup.append(r["id"]); continue
            seen.add(r["id"]); sa_rows.append(r)

    (order, by_disc, sa_by_disc, sats_by_parent, rim_by_disc,
     disc_of_ident, stats) = group_corpus(rows, sa_rows)
    islands, bounds = build_islands(order, by_disc, sa_by_disc, sats_by_parent, rim_by_disc)

    desc = load_js("unified_courses_member_desc.js").get("desc") or {}
    shard_stats = write_desc_shards(islands, args.desc_dir, mem, desc)
    if args.shards_only:
        print("  --shards-only: layout payloads left as committed")
        return

    placed_ids = [p["i"] for isl in islands for p in isl["p"]]
    n_ident = sum(i["n"] for i in islands)
    out = {
        "_about": "CCR Universe — precomputed island layout. READ-ONLY extract; "
                  "the browser draws these coordinates, it does not solve a layout. "
                  "Points with `a` are stand-alone courses; `o` names the identity they "
                  "orbit (a placement suggestion, not a curation decision).",
        "_generated_from": data.get("generated_at"),
        "counts": {
            "identities": n_ident,
            "stand_alone": len(sa_rows),
            "points": n_ident + len(sa_rows),
            "orbiting": stats["aligned"],
            "orbiting_cross": stats["aligned_cross"],
            "orbiting_from_no_discipline": stats["aligned_from_blank"],
            "rim": stats["rim"],
            "disciplines": len(islands),
            "member_rows": sum(len(mem.get(i, ())) for i in placed_ids),
            "member_rows_all_identities": sum(len(v) for v in mem.values()),
            "described_courses": shard_stats["described"],
        },
        "why_bits": {"subject": W_SUBJ, "subj4": W_SUBJ4, "title": W_TITLE,
                     "top": W_TOP, "units": W_UNITS, "credit": W_CREDIT},
        "bounds": bounds,
        "islands": islands,
    }
    path = os.path.join(ROOT, args.out)
    json.dump(out, open(path, "w", encoding="utf-8"), separators=(",", ":"))
    print(f"wrote {args.out}  ({os.path.getsize(path)/1024:.0f} KB)")

    write_members(mem_payload, placed_ids, args.members_out)

    c = out["counts"]
    print(f"  {c['identities']:,} identities + {c['stand_alone']:,} stand-alone courses "
          f"in {len(islands)} islands")
    print(f"  orbiting: {c['orbiting']:,} ({c['orbiting_cross']:,} in another discipline's island, "
          f"{c['orbiting_from_no_discipline']:,} of those from the no-discipline pile) · "
          f"on the rim: {c['rim']:,}")
    names = {W_SUBJ: "local subject", W_SUBJ4: "subj4", W_TITLE: "title",
             W_TOP: "top", W_UNITS: "units", W_CREDIT: "credit"}
    print("  why (an orbit may carry several): " +
          ", ".join(f"{names[b]} {stats['why'][b]:,}" for b in names))
    print(f"  bounds {bounds}")
    print("  largest:", ", ".join(f"{i['d'][:22]} ({i['n']}+{i['sa']})" for i in islands[:5]))


if __name__ == "__main__":
    main()
