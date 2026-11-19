#!/usr/bin/env python3
"""Inactive shared courses: kept for the record, out of every count (Sam's flag-and-hide rule, 2026-11-17; the Courses
bot's ask, #3480 Source 13, item 3).

A live card (one that is not merged into another; one-course cards included) is INACTIVE when no college's course sits on it in the Courses
List's file (unified_courses_members.js, with each merged card's courses folded into the card it merged into) and no
exhibit points to it in either committed link store:
  kb/coci_articulations.json      articulations[].course_id, read RAW: the file carries its applied re-key markers,
                                  so its ids are already current. Resolving them through kb/alias_chain.py again
                                  applies the permutation twice and moves links onto unrelated live cards (measured
                                  S683: 1,291 of 2,144 M-ID links moved, 64 cards escaped the flag). The builder
                                  refuses a file that lacks a marker, as kb/_build_remint_blast_radius.py does.
  credential_reference_data.js    unified_titles[].articulations[].cid (what the Exhibits List's Common SUBJ reads).
                                  The dashboard build writes it from the links file, so every cid must be a
                                  course_id there; the builder refuses one that lags (assert_links_agree).

Nothing is deleted: the card stays in the minted files, the List files and kb_curation. This writes
kb/coci_inactive_cards.json, one entry per card with its former local courses (from the minted memberships) and the
cards they sit on now, and the stores checked with their sha256. A card that gains a college's course or an exhibit
link drops off on the next build. kb/_flags.py reads the file.

    python3 kb/_build_inactive_cards.py            # write kb/coci_inactive_cards.json
    python3 kb/_build_inactive_cards.py --check    # exit 1 when the committed file differs from a rebuild
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _flags as F  # noqa: E402

ROOT = os.path.dirname(HERE)
OUT = "kb/coci_inactive_cards.json"
INPUTS = {
    "cards": "kb/coci_minted_courses.json",
    "one_course_cards": "kb/coci_minted_singletons.json",
    "memberships": "kb/coci_minted_memberships.json",
    "curation": "kb/coci_curation.json",
    "list_members": "unified_courses_members.js",
    "articulations": "kb/coci_articulations.json",
    "credential_reference": "credential_reference_data.js",
}
RULE = ("A card that is not merged is inactive when no college's course sits on it in the Courses List's file "
        "(merged cards' courses folded into their target) and no exhibit link in either store points to it.")


def linked_ids(articulations, credential_reference):
    """Every card id an exhibit points to, as each store writes it (both stores are current-era)."""
    out = set()
    for a in (articulations or {}).get("articulations") or []:
        cid = (a or {}).get("course_id")
        if cid:
            out.add(cid)
    for t in (credential_reference or {}).get("unified_titles") or []:
        for a in (t or {}).get("articulations") or []:
            if (a or {}).get("cid"):
                out.add(a["cid"])
    return out


def assert_current_era(articulations):
    """Refuse a links file that does not say its ids are current (the blast-radius script's markers, imported)."""
    from _build_remint_blast_radius import APPLIED_MARKERS
    missing = [k for k in APPLIED_MARKERS if not (articulations or {}).get(k)]
    if missing:
        raise SystemExit("ABORT: kb/coci_articulations.json lacks applied markers %s; its ids may be from an older "
                         "era. Re-key it (kb/_remint_apply_articulations.py) before building." % ", ".join(missing))


def assert_links_agree(articulations, credential_reference):
    """Refuse a credential reference that lags the links file. The dashboard build writes its `cid`s from
    kb/coci_articulations.json, so each one is a `course_id` there; an id the links file no longer holds means a
    re-key reached the links file and the reference was not rebuilt after it (COBIx on #3519, finding 3)."""
    have = {(a or {}).get("course_id") for a in (articulations or {}).get("articulations") or []}
    extra = sorted({(a or {}).get("cid") for t in (credential_reference or {}).get("unified_titles") or []
                    for a in (t or {}).get("articulations") or [] if (a or {}).get("cid")} - have)
    if extra:
        raise SystemExit("ABORT: the credential reference names %d card ids that kb/coci_articulations.json does not "
                         "(%s); it predates the links file's re-key. Rebuild it with the daily dashboard build before "
                         "building." % (len(extra), ", ".join(extra[:5])))


def build(courses, memberships, curation, list_members, articulations, credential_reference, singletons=None):
    singletons = singletons or {}
    names = [str(c or "").strip() for c in (list_members.get("colleges") or [])]
    members = list_members.get("members") or {}
    folded = F.folded_members(members, curation)
    by_key = {}
    for cid, rows in members.items():
        for m in rows or []:
            if m.get("cn"):
                by_key.setdefault(F.course_key(names[m["c"]] if m.get("c") is not None and m["c"] < len(names) else "",
                                               m["cn"]), set()).add(cid)
    links = linked_ids(articulations, credential_reference)
    # A link to a merged card counts for the card its colleges moved to.
    links |= {F.final_target(x, curation) for x in list(links)}
    cards = {}
    for cid in sorted(F.card_universe(courses, curation, singletons)):
        if (curation.get(cid) or {}).get("merge_into"):
            continue
        if folded.get(cid) or cid in links:
            continue
        was = []
        rows = memberships.get(cid) or ([singletons[cid]] if cid in singletons and cid not in courses else [])
        for m in rows:
            k = F.course_key(m.get("college"), m.get("control_number"))
            was.append([m.get("college") or "", m.get("control_number") or "", sorted(by_key.get(k, ()))])
        cards[cid] = {"former_courses": was, "never_had_a_course": not was}
        if cid in singletons and cid not in courses:
            cards[cid]["one_course_card"] = True
    return cards


def main(argv):
    check = "--check" in argv
    ROOT = argv[argv.index("--root") + 1] if "--root" in argv else globals()["ROOT"]   # a fixture checkout, for tests
    p = lambda k: os.path.join(ROOT, INPUTS[k])  # noqa: E731
    load = lambda k: F._read(ROOT, INPUTS[k]) or {}  # noqa: E731
    courses = load("cards").get("courses") or {}
    mem = load("memberships")
    memberships = mem.get("memberships", mem)
    curation = load("curation").get("curations") or {}
    arts = load("articulations")
    assert_current_era(arts)
    credref = F.loadjs(p("credential_reference"))
    assert_links_agree(arts, credref)
    cards = build(courses, memberships, curation, F.loadjs(p("list_members")), arts,
                  credref, load("one_course_cards").get("courses") or {})
    payload = {
        "_about": "Inactive shared courses, kept for the record and out of every count, waiting pile, to-do and "
                  "fetch plan (Sam, 2026-11-17: flag the record, never delete it). Built by kb/_build_inactive_cards.py; "
                  "read through kb/_flags.py.",
        "_rule": RULE,
        "_note": F.NOTES["inactive"],
        "_inputs": {k: {"path": v, "sha256": F.sha256_of(p(k))} for k, v in sorted(INPUTS.items())},
        F.ERA_KEY: F.current_era(),
        "count": len(cards),
        "never_had_a_course": sum(1 for c in cards.values() if c["never_had_a_course"]),
        "one_course_cards": sum(1 for c in cards.values() if c.get("one_course_card")),
        "cards": cards,
    }
    if check:
        cur = F._read(ROOT, OUT) or {}
        same = cur.get("cards") == payload["cards"] and F.is_current_era(cur)
        print("%s: %s (%d cards)" % (OUT, "current" if same else "STALE: run python3 kb/_build_inactive_cards.py",
                                    len(cards)))
        return 0 if same else 1
    F.write_json(os.path.join(ROOT, OUT), payload)
    print("wrote %s: %d inactive cards (%d never had a course)" % (OUT, len(cards), payload["never_had_a_course"]))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
