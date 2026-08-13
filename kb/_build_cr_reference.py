#!/usr/bin/env python3
"""Build the COMMON CR REFERENCE worklist — a curation queue, not a merge engine.

WHY THIS EXISTS
---------------
Sam, 2026-08-13:

    "we should have a Common CR Reference just as we have pretty well developed
     CER, CSR, and the beginnings of a CCR."

and the ruling that governs the matching:

    "CID is only one factor in determining common CR references. Similar to the
     CCR, we take into account matching factors like title, course name and
     number, course description, subject, etc."

`docs/common_cr_reference_scope.md` measured what automation can actually reach
against those factors, and the answer is the reason this file emits a WORKLIST
rather than a set of merges:

    rung 1  published statewide set        351 lines / 134 credentials
    rung 2  C-ID declared on the line      36 of those 351
    rung 3  CCR course identity (gated)    40 strings
    rung 4  twin merge (mechanical)        ~160
    rung 5  title/description similarity   0 — suggestions only, never merges

**Roughly 90% of the 2,344 distinct strings is curator judgement**, because
*Racial Issues and the Police*, *Community Relations* and *Community and the
Justice System* are one POST topic in three unrelated sets of words. No string
metric reaches that; a reference does. So the deliverable is the queue, ranked
by how much each decision is worth, with the automated rungs pre-applied and
labelled — and the curator supplies the other nine tenths.

SCOPE: GLOBAL, WITH A SPLIT AFFORDANCE (Sam, 2026-08-13)
-------------------------------------------------------
Asked whether the reference is global or per-credential, Sam chose **global**:
one canonical vocabulary, the credential shown as context, and a curator able to
split a string per-credential where the meaning genuinely differs.

The measurement behind the choice: 407 strings (17%) span more than one
credential but carry **45% of all articulation rows**, and in the cases that
matter the same wording genuinely IS the same recommendation —
`3-4 hours in Introduction to Flux Cored Arc Welding (FCAW)` appears under ten
different AWS/ASME credentials and means one thing in all ten.

⚠️ The handoff into this build said "the top strings span up to 61 credentials,
and that is where the value is." That is backwards, and it is worth recording
because it would have mis-ranked the queue: the 61-credential string is
`3 hours in Elective Course Credits` — 61 credentials, 61 rows, **one college**.
It is a placeholder, not a topic. Ranking by *credentials spanned* would have
put the least useful string in the corpus at the top of the worklist. Ranking by
COLLAPSE VALUE (wordings × colleges affected) sinks it to zero without needing a
special case, which is why that is the ranking rule below.

GROUPING IS BY KEY, NEVER BY SIMILARITY CHAINING
------------------------------------------------
Scope §3: merges must be pairwise and gated, **never transitive** — 164 rec
strings bridge ≥2 course identities, so connected components over "shares a
course identity" would chain `AJ 110` ↔ *Community Relations* ↔ `AJ 160` and
blob Intro to AJ, Community Relations and Physical Training into one reference.

Every automated rung here groups by an explicit KEY (a published line, a C-ID, a
course identity inside a single-course credential, an identical normalised topic
string). None of them chains through pairwise similarity. Rung 5 — the only
similarity signal — never groups at all; it is emitted as a suggestion hanging
off a group for a curator to accept or ignore.

Run from repo root:  python3 kb/_build_cr_reference.py
Reads:  kb/peer_articulations_payload.json   (built by _build_peer_articulations.py)
        kb/credential_recs.json              (built by _build_credential_recs.py)
Writes: kb/cr_reference_worklist.json
"""
import json
import os
import re
import sys
import collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PEERS = os.path.join(ROOT, "kb", "peer_articulations_payload.json")
CREDS = os.path.join(ROOT, "kb", "credential_recs.json")
CIDS = os.path.join(ROOT, "kb", "reference", "cid_descriptors.json")
CCNS = os.path.join(ROOT, "kb", "reference", "ccn_courses.json")
OUT = os.path.join(ROOT, "kb", "cr_reference_worklist.json")

# ── THE NAMING CASCADE (Sam, 2026-08-13) ───────────────────────────────────
#
#   "as is the procedure with CCR, when there is a C-ID or CCN title and number,
#    we go with that for the Common CR Reference (CCRR). Once we get M-IDs in
#    good shape, those will rule as well — third in the cascade."
#
# So the CCRR's NAME is not the most popular freehand wording when an official
# identity exists — it is that identity's official title and number. This is the
# CCR's own §10 precedence (CCN > C-ID > M-ID > Unified) transposed onto
# recommendations, which is exactly what "as is the procedure with CCR" asks for.
#
#   1. CCN   — AB1111 Common Course Number, the newest and most authoritative
#   2. C-ID  — ASCCC-approved descriptor
#   3. M-ID  — GATED OFF (see below)
#   4. the published statewide line
#   5. the wording the most colleges actually wrote
#
# ⚠️ M-ID IS WIRED BUT DISABLED. Sam's condition is "once we get M-IDs in good
# shape", and Rule 7 says the M-ID layer is AI-assisted STAGING, not yet
# faculty-published — re-mints are still permitted, so an M-ID chosen as a
# public canonical name today could be re-keyed tomorrow. Flip this to True in
# the same change that declares the M-ID layer faculty-published; the rung is
# already implemented and tested below.
MID_RULES = False

CID_TITLES, CCN_TITLES = {}, {}

# An official identity only names the group when the group resolves to exactly
# ONE of them. The course↔rec-line pairing is denormalised wherever it is
# multi-line (scope §3: of the (credential, course) pairs touching >1 line, ZERO
# have differing college sets), so a group spanning several identities cannot
# safely borrow any one of their names.
def load_official():
    cid, ccn = {}, {}
    if os.path.exists(CIDS):
        for d in load(CIDS, "C-ID descriptors").get("descriptors") or []:
            if d.get("descriptor") and d.get("title"):
                cid[d["descriptor"].strip().upper()] = d["title"].strip()
    if os.path.exists(CCNS):
        for c in load(CCNS, "CCN courses").get("courses") or []:
            if c.get("ccn") and c.get("title"):
                ccn[c["ccn"].strip().upper()] = c["title"].strip()
    return cid, ccn

# ── The shape: "<units-expr> <unit-word> in <topic>" ────────────────────────
# 2,323 of 2,344 distinct strings (99.1%) fit this strictly; the 21 misses are
# all RANGE units (3-4 hours, 3 or 4 hours, 3 to 4 hours), so with range parsing
# the shape holds at 100%. Both halves matter: the units expression is
# mechanical and the topic is the freehand part that needs curation.
_NUM = r"\d+(?:\.\d+)?"
_RANGE = rf"{_NUM}(?:\s*(?:-|–|—|to|or)\s*{_NUM})?"
SHAPE_RE = re.compile(
    rf"^\s*(?P<units>{_RANGE})\s*(?P<word>hours?|units?|credits?|semester\s+units?)\s+in\s+(?P<topic>.+?)\s*$",
    re.IGNORECASE,
)

# Abbreviation folds ONLY. Deliberately NOT level folds: `Introduction` must
# never fold into `Advanced` — that pair is a real distinction in this data
# (Introduction to FCAW vs Advanced FCAW are separate recommendations under the
# same welding credentials), and it is the CCR's `level` safety screen.
ABBREV_FOLDS = [
    (re.compile(r"\bintro\b", re.I), "introduction"),
    (re.compile(r"\bintro to\b", re.I), "introduction to"),
    (re.compile(r"\badvance\b", re.I), "advanced"),
    (re.compile(r"\badv\b", re.I), "advanced"),
    (re.compile(r"\bprin\b", re.I), "principles"),
    (re.compile(r"\bmgmt\b", re.I), "management"),
    (re.compile(r"\badmin\b", re.I), "administration"),
    (re.compile(r"\s*&\s*", re.I), " and "),
]

# CCR safety screens, carried over verbatim because they earned themselves
# there. A group whose members disagree on any of these is held as a
# SUGGESTION rather than an automatic merge, however well the key matches.
SCREENS = {
    "level": re.compile(r"\b(introduction|introductory|advanced|intermediate|beginning|elementary|basic)\b", re.I),
    "honors": re.compile(r"\b(honors?|honours?)\b", re.I),
    "lab": re.compile(r"\b(lab|laboratory)\b", re.I),
    "sport": re.compile(r"\b(baseball|basketball|football|soccer|softball|volleyball|swimming|track|tennis|golf|wrestling)\b", re.I),
    "gender": re.compile(r"\b(men'?s|women'?s|male|female)\b", re.I),
}


def parse_rec(s):
    """Split a credit_rec into (units_lo, units_hi, unit_word, topic).

    Returns units as floats so `3 hours` and `3.0 hours` compare equal — that
    pair is real and common (`3 hours in Community Relations` has 293 rows,
    `3.0 hours in Community Relations` has 122) and they are plainly the same
    recommendation. A string that does not fit the shape keeps its whole text
    as the topic rather than being dropped.
    """
    m = SHAPE_RE.match(s or "")
    if not m:
        return (None, None, None, (s or "").strip())
    raw = m.group("units")
    nums = [float(n) for n in re.findall(_NUM, raw)]
    lo = nums[0] if nums else None
    hi = nums[-1] if nums else None
    word = re.sub(r"\s+", " ", m.group("word").strip().lower())
    word = re.sub(r"s$", "", word)  # hours→hour, units→unit
    return (lo, hi, word, m.group("topic").strip())


def fold_abbrev(topic):
    """Expand abbreviations. Shared by the key AND the safety screens.

    ⚠️ These MUST share it. The screens originally ran on the raw topic, so
    `Intro to Administration of Justice` read as level-absent while
    `Introduction to Administration of Justice` read as level-present; they
    disagreed, and the level screen blocked the single highest-value merge in
    the corpus (5 wordings across 26 colleges) — the abbreviation fold was
    silently undone by the screen that ran before it. A normalisation and the
    screens that judge it have to see the same text.
    """
    t = (topic or "").lower()
    for rx, rep in ABBREV_FOLDS:
        t = rx.sub(rep, t)
    return t


def topic_key(topic):
    """Aggressive normalisation of the topic half — units already discarded.

    This is the rung-4 twin-merge key. Measured collapse on the full corpus:
    2,344 → 2,183 (6.9%). That number is the whole argument for this being a
    curation workbench: throwing units away entirely and folding the commonest
    abbreviations still collapses under 7%.
    """
    t = fold_abbrev(topic)
    t = re.sub(r"\(.*?\)", " ", t)          # trailing acronym parentheticals
    t = re.sub(r"[^a-z0-9]+", " ", t)       # punctuation → space
    t = re.sub(r"\b(the|a|an|of|for|to|in|and)\b", " ", t)  # structural words
    t = re.sub(r"\s+", " ", t).strip()
    return t


def screen_profile(topic):
    """Which safety screens a topic trips, as a comparable signature.

    Runs on the ABBREVIATION-FOLDED topic so `Intro` and `Introduction` are
    judged as the same level — see fold_abbrev().
    """
    t = fold_abbrev(topic)
    return {name: bool(rx.search(t)) for name, rx in SCREENS.items()}


def screens_agree(profiles):
    """True when every member trips the same screens."""
    if not profiles:
        return True
    first = profiles[0]
    return all(p == first for p in profiles[1:])


def load(path, label):
    if not os.path.exists(path):
        sys.exit(f"✗ missing {label}: {path}\n  build it first (see kb/README.md)")
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


def build():
    global CID_TITLES, CCN_TITLES
    CID_TITLES, CCN_TITLES = load_official()
    peers = load(PEERS, "peer articulations payload")["peer_articulations"]
    creds = load(CREDS, "credential recs")["rows"]

    stats = collections.Counter()

    # ── The published statewide lines: rung 1, the authority ───────────────
    # These are MAP's own curated recommendations, already public on the Fact
    # Sheet. A local wording that matches one of them is not a merge candidate;
    # it is a variant OF the published line, and the published line is canonical
    # by definition rather than by any measurement here.
    published = {}          # topic_key -> {credit, cid, credentials[]}
    published_exact = {}    # exact credit string -> topic_key
    for c in creds:
        if c.get("rec_kind") != "statewide_authoritative":
            continue
        for r in c.get("recs") or []:
            credit = (r.get("credit") or "").strip()
            if not credit:
                continue
            _, _, _, topic = parse_rec(credit)
            k = topic_key(topic)
            if not k:
                continue
            e = published.setdefault(k, {"credit": credit, "cid": r.get("cid"),
                                         "credentials": [], "lines": 0})
            e["lines"] += 1
            if r.get("cid") and not e["cid"]:
                e["cid"] = r.get("cid")
            if c["unified_title"] not in e["credentials"]:
                e["credentials"].append(c["unified_title"])
            published_exact[credit] = k
    stats["published_topics"] = len(published)
    stats["published_lines"] = sum(e["lines"] for e in published.values())

    # ── Credential → distinct course identities (the rung-3 gate) ──────────
    # Scope §3: the usable gate is the credential's COURSE COUNT, not the
    # line fraction. In a credential resolving to exactly ONE course identity,
    # N wordings are unambiguously N phrasings of one recommendation. The
    # cartesian/line-fraction gate was built, measured (43 pairs) and does NOT
    # fire on the case it was invented for — `AJ 110` pairs with 8 of POST's 43
    # lines, reads non-cartesian, and Physical Training still merges into Intro
    # to Administration of Justice. Do not reintroduce it.
    cred_courses = collections.defaultdict(set)
    for r in peers:
        if r.get("course_id"):
            cred_courses[r["unified_title"]].add(r["course_id"])
    single_course_creds = {k for k, v in cred_courses.items() if len(v) == 1}
    stats["single_course_credentials"] = len(single_course_creds)

    # ── Aggregate every distinct credit_rec string ─────────────────────────
    agg = {}
    for r in peers:
        s = (r.get("credit_rec") or "").strip()
        if not s:
            continue
        e = agg.get(s)
        if e is None:
            lo, hi, word, topic = parse_rec(s)
            e = agg[s] = {
                "rec": s, "units_lo": lo, "units_hi": hi, "unit_word": word,
                "topic": topic, "key": topic_key(topic),
                "shape_ok": lo is not None,
                "rows": 0, "credentials": set(), "colleges": set(),
                "subjects": set(), "courses": set(), "cids": set(),
            }
        e["rows"] += 1
        e["credentials"].add(r["unified_title"])
        if r.get("college"):
            e["colleges"].add(r["college"])
        if r.get("subject"):
            e["subjects"].add(r["subject"])
        if r.get("course_id"):
            e["courses"].add(r["course_id"])
            if (r.get("identity_system") or "").upper() == "C-ID":
                e["cids"].add(r["course_id"])
    stats["distinct_strings"] = len(agg)
    stats["total_rows"] = sum(e["rows"] for e in agg.values())
    stats["shape_fits"] = sum(1 for e in agg.values() if e["shape_ok"])

    # ── Group by key. KEY-grouping only — never similarity chaining ────────
    by_key = collections.defaultdict(list)
    for e in agg.values():
        by_key[e["key"] or ("\x00" + e["rec"])].append(e)

    groups = []
    for key, members in by_key.items():
        members.sort(key=lambda m: (-m["rows"], m["rec"]))
        creds_all, colls_all, courses_all, cids_all, subs_all = set(), set(), set(), set(), set()
        for m in members:
            creds_all |= m["credentials"]
            colls_all |= m["colleges"]
            courses_all |= m["courses"]
            cids_all |= m["cids"]
            subs_all |= m["subjects"]

        pub = published.get(key)

        # Rung assignment — strongest evidence first, exactly the CCR's contract.
        rung, rung_why, acts = 5, "", False
        if pub:
            rung = 1
            rung_why = "Published statewide recommendation — MAP's own curated line, already on the Fact Sheet"
            acts = True
        elif len(cids_all) == 1 and len(subs_all) >= 1 and len(members) > 1:
            rung = 2
            rung_why = "One C-ID declared across every wording, and subject agrees (two signals)"
            acts = True
        elif len(members) > 1 and len(courses_all) == 1 and \
                any(c in single_course_creds for c in creds_all):
            rung = 3
            rung_why = ("CCR course identity, inside a credential resolving to exactly one course — "
                        "so these are phrasings of one recommendation")
            acts = True
        elif len(members) > 1:
            rung = 4
            rung_why = "Twin merge — identical topic after normalisation"
            acts = True

        # Safety screens. A group whose members disagree on level / Honors /
        # lab / sport / gender is held as a SUGGESTION regardless of how well
        # the key matched. Level is the one that actually bites here:
        # Introduction to FCAW vs Advanced FCAW are separate recommendations.
        profiles = [screen_profile(m["topic"]) for m in members]
        screen_ok = screens_agree(profiles)
        objecting = []
        if not screen_ok:
            for name in SCREENS:
                if len({p[name] for p in profiles}) > 1:
                    objecting.append(name)

        # Units are a SCREEN on rung 4, never identity (scope §3: SPAN 100 is
        # written at 4, 4.5 and 5 units by different colleges and is one
        # recommendation). A stronger rung overrides the screen; rung 4 does not.
        unit_vals = {(m["units_lo"], m["units_hi"]) for m in members if m["units_lo"] is not None}
        units_differ = len(unit_vals) > 1
        if rung == 4 and units_differ:
            acts = False
            objecting.append("units")
        if not screen_ok:
            acts = False

        # ── Canonical name: the cascade (Sam, 2026-08-13) ──────────────────
        # CCN > C-ID > M-ID (gated) > published statewide line > most-colleges
        # wording. An official identity NAMES the reference; it does not merely
        # corroborate it.
        #
        # Prefer the C-ID declared on the PUBLISHED line over one derived from
        # articulations: the published pairing is curated, the articulation
        # pairing is denormalised (scope §3).
        official_id = (pub or {}).get("cid") or (sorted(cids_all)[0] if len(cids_all) == 1 else None)
        mids = sorted(c for c in courses_all if c not in cids_all)
        official_title, official_system = None, None
        if official_id:
            key_up = official_id.strip().upper()
            if key_up in CCN_TITLES:
                official_title, official_system = CCN_TITLES[key_up], "CCN"
            elif key_up in CID_TITLES:
                official_title, official_system = CID_TITLES[key_up], "C-ID"
        if not official_title and MID_RULES and len(mids) == 1:
            official_id, official_system = mids[0], "M-ID"
            official_title = None          # M-ID titles come from the CCR, not a descriptor file

        # ⚠️ A DIVERGENT OFFICIAL TITLE IS FLAGGED, NEVER SILENTLY APPLIED.
        # `AJ 122 — Criminal Court Process` renames a group whose colleges all
        # wrote "Principles and Procedures of the Justice System"; that is the
        # cascade doing its job, but it is also the shape of a real error, because
        # POST carries `AJ 110` on two genuinely different lines and Sam ruled that
        # repeat must be FLAGGED and never auto-resolved. So when the official
        # title shares no content word with what colleges actually wrote, say so
        # and let a curator look — the same posture the alignment layer's
        # `cid_title_divergent` takes.
        title_divergent = False
        if official_title:
            off_toks = set(topic_key(official_title).split())
            mod_toks = set(topic_key(members[0]["topic"]).split())
            # Compare squashed forms too, so "Pre-Calculus Mathematics" is not
            # called divergent from "Precalculus" over a hyphen.
            off_sq = "".join(sorted(off_toks)).replace(" ", "")
            mod_sq = "".join(mod_toks)
            squash_hit = any(t in mod_sq.replace(" ", "") or mod_sq.replace(" ", "") in t
                             for t in ["".join(off_toks)]) or \
                         any(o in "".join(sorted(mod_toks)) for o in [off_sq] if o)
            title_divergent = bool(off_toks) and not (off_toks & mod_toks) and not squash_hit

        # ⚠️ A DIVERGENT OFFICIAL TITLE IS OFFERED, NOT APPLIED.
        # Flagging alone is not enough here. `AJ 110` reaches this group through
        # the denormalised (credential, course) pairing, and two of the groups it
        # would rename are "Physical Training and Health Education" and "CSU GE E
        # — Lifelong Understanding" — the exact cross-join the scope doc names.
        # Auto-applying the C-ID title there does not merely mislabel, it asserts
        # that Physical Training IS Introduction to Criminal Justice. So a
        # divergent title keeps the freehand canonical and rides along as a
        # PROPOSAL for a curator to accept. Sam's rule on the AJ 110 repeat —
        # flagged, never auto-resolved — is the same rule.
        if title_divergent:
            official_applied = False
        elif official_title:
            official_applied = True
            canonical = official_id + " — " + official_title
            canonical_source = official_system
        elif official_system == "M-ID":
            official_applied = True
            canonical = official_id
            canonical_source = "M-ID"
        elif pub:
            official_applied = False
            canonical = pub["credit"]
            canonical_source = "published_statewide"
        else:
            official_applied = False
            canonical = members[0]["rec"]
            canonical_source = "most_colleges"
        if title_divergent:
            canonical = pub["credit"] if pub else members[0]["rec"]
            canonical_source = ("published_statewide" if pub else "most_colleges") + "_official_proposed"

        # COLLAPSE VALUE — the ranking rule. (wordings − 1) × colleges touched.
        # The −1 is the real gain: collapsing N wordings removes N−1 of them.
        # Weighting by COLLEGES is what sinks `3 hours in Elective Course
        # Credits` (61 credentials, one college) to zero without a special case.
        collapse = (len(members) - 1) * max(len(colls_all), 1)

        groups.append({
            "key": key if not key.startswith("\x00") else "",
            "canonical": canonical,
            "canonical_source": canonical_source,
            "official_id": official_id,
            "official_title": official_title,
            "official_system": official_system,
            "title_divergent": title_divergent,
            "official_applied": official_applied,
            # The freehand wording the most colleges actually wrote, kept even
            # when an official identity supplies the name — a curator has to be
            # able to see what the field says as well as what it resolves to.
            "modal_wording": members[0]["rec"],
            "cid": official_id,
            "rung": rung,
            "rung_why": rung_why,
            "acts_automatically": acts,
            "screens_objecting": sorted(set(objecting)),
            "units_differ": units_differ,
            "wordings": len(members),
            "rows": sum(m["rows"] for m in members),
            "credentials": len(creds_all),
            "colleges": len(colls_all),
            "courses": sorted(courses_all)[:12],
            "subjects": sorted(subs_all)[:12],
            "collapse_value": collapse,
            "members": [{
                "rec": m["rec"], "topic": m["topic"], "rows": m["rows"],
                # The screen profile is EMITTED rather than left to be re-derived.
                # A consumer that recomputes it needs its own copy of the
                # abbreviation folds, and a copy that drifts reproduces the exact
                # defect the screens exist to prevent: the first version of
                # tests/cr_reference.test.js re-implemented the folds, missed
                # `adv`→`advanced`, and reported two correctly-merged groups
                # ("Adv Acoustical Ceiling Layout" / "Advanced Acoustical Ceiling
                # Layout") as level-straddling failures. One derivation, one place.
                "screens": screen_profile(m["topic"]),
                "units_lo": m["units_lo"], "units_hi": m["units_hi"],
                "unit_word": m["unit_word"],
                "credentials": sorted(m["credentials"])[:8],
                "credentials_n": len(m["credentials"]),
                "colleges_n": len(m["colleges"]),
                "courses": sorted(m["courses"])[:6],
            } for m in members],
            "sample_credentials": sorted(creds_all)[:8],
        })

    # Rank: the decisions worth making, first.
    groups.sort(key=lambda g: (-g["collapse_value"], -g["rows"], g["canonical"]))

    for g in groups:
        stats[f"rung_{g['rung']}_groups"] += 1
        if g["wordings"] > 1:
            stats["groups_with_a_decision"] += 1
            stats["strings_collapsible"] += g["wordings"] - 1
        if g["acts_automatically"] and g["wordings"] > 1:
            stats["auto_groups"] += 1
            stats["auto_strings_collapsed"] += g["wordings"] - 1
        if g["screens_objecting"]:
            stats["groups_held_by_a_screen"] += 1

    # Head-heaviness — the reason this is tractable at all. Measured, not
    # assumed: the top 50 strings carry 49.4% of all articulation rows.
    ranked_rows = sorted((e["rows"] for e in agg.values()), reverse=True)
    tot = sum(ranked_rows) or 1
    for n in (50, 100, 250):
        stats[f"pct_rows_in_top_{n}_strings"] = round(100.0 * sum(ranked_rows[:n]) / tot, 1)

    return groups, dict(stats)


def main():
    groups, stats = build()
    payload = {
        "_generated_by": "kb/_build_cr_reference.py",
        "_scope": "global",   # Sam, 2026-08-13 — global vocabulary + split affordance
        "_doc": "docs/common_cr_reference_scope.md",
        "_stats": stats,
        "groups": groups,
    }
    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, ensure_ascii=False)
    print(f"→ {OUT}")
    for k in sorted(stats):
        v = stats[k]
        print(f"  {k:34} {v:,}" if isinstance(v, int) else f"  {k:34} {v}")

    # ── Acceptance probes. Each one is a case the scope doc named; if any
    # stops holding, a rule above has drifted and the queue is mis-ranked.
    print("\nACCEPTANCE")
    top = groups[0]
    print(f"  top of queue: {top['canonical'][:60]!r}")
    print(f"    {top['wordings']} wordings · {top['colleges']} colleges · collapse {top['collapse_value']}")

    # 1. The placeholder must NOT reach the head of the queue.
    elective = next((i for i, g in enumerate(groups)
                     if "elective course credit" in g["key"]), None)
    if elective is None:
        print("  ⚠ 'Elective Course Credits' not found — check the parser")
    else:
        g = groups[elective]
        print(f"  elective placeholder ranked #{elective + 1} of {len(groups)} "
              f"(collapse {g['collapse_value']}, {g['credentials']} credentials, {g['colleges']} colleges)")
        if elective < 50:
            sys.exit("✗ the placeholder reached the head of the queue — ranking rule broke")

    # 2. No group that MERGES may contain members disagreeing on a screen.
    #
    # ⚠️ The first version of this probe asked whether a group's KEY contained
    # both "introduction" and "advanced". It reported 2 failures, and both were
    # single-wording groups whose one string legitimately carries both words
    # ("3 hours in Advanced Composition & Introduction to Literature"). Nothing
    # was being merged, so the screen had nothing to act on. Testing a proxy for
    # the condition instead of the condition is the same mistake the cartesian
    # gate made — see docs/common_cr_reference_lessons.md.
    bad = []
    for g in groups:
        if not (g["acts_automatically"] and g["wordings"] > 1):
            continue
        profiles = [screen_profile(m["topic"]) for m in g["members"]]
        if not screens_agree(profiles):
            bad.append(g)
    print(f"  merging groups whose members disagree on a screen: {len(bad)} (must be 0)")
    if bad:
        for g in bad[:3]:
            print(f"      {g['key']!r}: {[m['rec'] for m in g['members']][:3]}")
        sys.exit("✗ safety screen failed — a merging group crossed a level/Honors/lab/sport/gender line")

    # 2b. And the screens must actually be DOING something, or they are decoration.
    held = [g for g in groups if g["screens_objecting"] and g["wordings"] > 1]
    print(f"  groups a screen actively held back from merging: {len(held)}")
    for g in held[:3]:
        print(f"      held by {'+'.join(g['screens_objecting'])}: {[m['rec'] for m in g['members']][:2]}")

    # 3. The Community Relations twin (3 hours / 3.0 hours) must be one group.
    cr = next((g for g in groups if g["key"] == "community relations"), None)
    if cr:
        print(f"  'Community Relations': {cr['wordings']} wordings, rung {cr['rung']}, "
              f"auto={cr['acts_automatically']}")
        for m in cr["members"][:4]:
            print(f"      {m['rows']:>4} rows  {m['rec']}")
    else:
        print("  ⚠ 'Community Relations' group not found")


if __name__ == "__main__":
    main()
