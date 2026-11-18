#!/usr/bin/env python3
"""One reader for the course flags: merged, retired, inactive and not applicable (Sam, 2026-11-17, relayed by COBIx:
"flag the record, never delete it; take flagged records out of counts, waiting piles, to-dos and fetch plans").

A flag never deletes anything. The minted files, the List files, `kb_curation` and the exhibit stores keep every
record; a flag is a separate entry naming the record, the rule and a plain note, and a counter that imports this
module leaves the flagged record out of its count, its waiting pile, its to-do filter and its fetch plan. The record
still opens, with its note.

The four sources:
  merged          `merge_into` on the card in kb/coci_curation.json (the committed copy of kb_curation). A person's
                  or a curation rule's merge; its colleges count on the card it merged into.
  retired         kb/coci_retired_cards.json, built by kb/_build_retired_cards.py (the version 5 rule: every
                  college's course on the card is marked Inactive or Deleted at the state, or gone from every list).
  inactive        kb/coci_inactive_cards.json, built by kb/_build_inactive_cards.py (no college's course sits on the
                  card in the Courses List's file, and no exhibit points to it).
  not_applicable  kb/coci_not_applicable.json, built by kb/_build_not_applicable.py (independent or directed study,
                  an internship or work experience, or a code-only listing; rule in kb/_not_applicable_rule.py).
                  It holds courses with no card as well as cards.

Order when two flags meet: retired, merged, inactive, not applicable. A record carries every note that applies and is
subtracted once.

A person's ruling stays final. On a card a named person reviewed (a `reviewed_by` that is not a bot), a machine flag
(retired, inactive, not applicable) adds its note and says so, and the card stays in the counts: a machine flag never
hides a person's ruling silently. Merged is itself a curation ruling, so a merged card always leaves the counts.

Readers:
    from _flags import load_flags
    F = load_flags()
    F.kinds(card_id)            # every flag on the card, in order
    F.flag_of(card_id)          # the first, or None
    F.counted(card_id)          # False when a flag takes it out of counts, piles, to-dos and fetch plans
    F.note(card_id)             # the plain note a person sees
    F.course_flag(college, cn)  # a course with no card: "not_applicable" or None
    F.course_note(college, cn)
    F.hidden_band(card_id)      # for a scorer's bands: the kind that takes the card out of every band, or None

Pure stdlib. A missing flag file reads as no flags of that kind, so a fresh checkout or a test fixture still works.

Era guard (COBIx on #3519). Each builder stamps its file with ERA_KEY, the last re-mint in kb/alias_chain.py's
ALIAS_MAPS when it ran. A re-mint registers its map there before kb/_post_apply_chain.py runs, and it re-keys the
minted files but not these three, so an older stamp means the file's card ids may now name different cards (a re-mint
reuses slots). load_flags() then sets that file's card flags aside, prints why, and lists the kind in Flags.stale: the
flagged cards come back into the counts until the daily build rebuilds the file, and no live card is hidden by a
stale id. The not-applicable file's course entries are keyed by college and control number, which a re-mint never
changes, so they stay in force.
"""
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
ERA_KEY = "_ids_current_through"

FLAG_ORDER = ("retired", "merged", "inactive", "not_applicable")
MACHINE_FLAGS = ("retired", "inactive", "not_applicable")

FILES = {
    "curation": "kb/coci_curation.json",
    "retired": "kb/coci_retired_cards.json",
    "inactive": "kb/coci_inactive_cards.json",
    "not_applicable": "kb/coci_not_applicable.json",
}

# The notes a person reads. Plain words: no ids, no field names, no "should" (tests/coci_flags_test.py check 7).
NOTES = {
    "retired": ("Retired: every college's version of this course is marked inactive in the state's course "
                "inventory, or no longer appears in it. Kept for the record; nothing to do."),
    "merged": "Merged into another shared course, {target}. Kept for the record; its colleges are counted there.",
    "inactive": ("Inactive: no college's course sits on this shared course any more, and no exhibit points to it. "
                 "Kept for the record; nothing to do."),
}
NA_COURSE_NOTES = {
    "independent": ("Not applicable: independent or directed study. Courses like this are set up one student at a "
                    "time, so they aren't shared across colleges. Kept for the record; nothing to do."),
    "internship": ("Not applicable: an internship or work experience. Courses like this are set up one student at a "
                   "time, so they aren't shared across colleges. Kept for the record; nothing to do."),
    "code_only": ("Not applicable: the state's course list gives this course a number but no title. Kept for the "
                  "record; nothing to do."),
}
NA_CARD_NOTES = {
    "independent": ("Not applicable: every college's course on this shared course is independent or directed study. "
                    "Courses like this are set up one student at a time, so they aren't shared across colleges. Kept "
                    "for the record; nothing to do."),
    "internship": ("Not applicable: every college's course on this shared course is an internship or work experience. "
                   "Courses like this are set up one student at a time, so they aren't shared across colleges. Kept "
                   "for the record; nothing to do."),
    "code_only": ("Not applicable: every college's course on this shared course has a number but no title in the "
                  "state's course list. Kept for the record; nothing to do."),
    "mixed": ("Not applicable: every college's course on this shared course is independent or directed study, an "
              "internship or work experience, or a listing with a number and no title. Kept for the record; nothing "
              "to do."),
}
NOT_SEEN_NOTE = "No college lists this course in Fall 2025; it may be taught in other terms."
PERSON_NOTE = ("A person reviewed this shared course{on}, and their ruling stands, so it stays in the counts. "
               "The machine's note reads: {note}")

# Every note text, for the plain-words test and for a page that prints them once.
ALL_NOTES = ([NOTES["retired"], NOTES["inactive"], NOTES["merged"].format(target="Introduction to Art"),
              NOT_SEEN_NOTE, PERSON_NOTE.format(on=" on Nov 9, 2026", note=NOTES["inactive"])]
             + list(NA_COURSE_NOTES.values()) + list(NA_CARD_NOTES.values()))


def is_person(reviewed_by):
    """A named person's review, never a bot cohort (`<lane>-s<N>@bot`, `automerge@bot` and the like)."""
    r = str(reviewed_by or "").strip().lower()
    return bool(r) and not r.endswith("@bot") and not r.endswith(".bot")


def course_key(college, control_number):
    return "%s|%s" % (str(college or "").strip(), str(control_number or "").strip())


def loadjs(path):
    """The JSON object a `window.X = {...};` file assigns."""
    with open(path, encoding="utf-8") as f:
        s = f.read()
    s = s[s.find("= {") + 2:]
    return json.loads(s[:s.rstrip().rstrip(";").rfind("}") + 1])


def _read(root, rel):
    p = rel if os.path.isabs(rel) else os.path.join(root, rel)
    if not os.path.exists(p):
        return None
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def _when(iso):
    """'2026-11-09...' as 'Nov 9, 2026'; empty when unreadable."""
    m = re.match(r"(\d{4})-(\d{2})-(\d{2})", str(iso or ""))
    if not m:
        return ""
    months = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split()
    y, mo, d = int(m.group(1)), int(m.group(2)), int(m.group(3))
    return "%s %d, %d" % (months[mo - 1], d, y) if 1 <= mo <= 12 else ""


def current_era():
    """The last applied re-mint (kb/alias_chain.py ALIAS_MAPS, imported, never copied): the era a flag file's ids
    must be built in."""
    if HERE not in sys.path:
        sys.path.insert(0, HERE)
    from alias_chain import ALIAS_MAPS
    return ALIAS_MAPS[-1]


def is_current_era(doc):
    """True when a flag file was built in the current era (a missing file is no flags, so it passes)."""
    return doc is None or (doc or {}).get(ERA_KEY) == current_era()


class Flags(object):
    def __init__(self, curation=None, retired=None, inactive=None, not_applicable=None, titles=None, stale=None):
        self.stale = list(stale or [])   # the kinds whose file predates the latest re-mint (set aside by load_flags)
        self.curation = curation or {}
        self.retired = (retired or {}).get("cards") or {}
        self.inactive = (inactive or {}).get("cards") or {}
        na = not_applicable or {}
        self.na_cards = na.get("cards") or {}
        self.na_courses = na.get("courses") or {}
        self.titles = titles or {}
        self.merged = {}
        for cid, c in self.curation.items():
            tgt = (c or {}).get("merge_into")
            if tgt and tgt != cid:
                self.merged[cid] = tgt

    # ── cards ──
    def kinds(self, card_id):
        out = []
        if card_id in self.retired:
            out.append("retired")
        if card_id in self.merged:
            out.append("merged")
        if card_id in self.inactive:
            out.append("inactive")
        if card_id in self.na_cards:
            out.append("not_applicable")
        return out

    def flag_of(self, card_id):
        k = self.kinds(card_id)
        return k[0] if k else None

    def person_review(self, card_id):
        """The date a named person reviewed the card ('' when undated), or None when no person did."""
        c = self.curation.get(card_id) or {}
        return (c.get("reviewed_at") or "") if is_person(c.get("reviewed_by")) else None

    def counted(self, card_id):
        """False when a flag takes the card out of counts, piles, to-dos and fetch plans."""
        k = self.kinds(card_id)
        if not k:
            return True
        if "merged" in k:
            return False
        return self.person_review(card_id) is not None   # a person's ruling keeps it in, with the note

    def hidden_kind(self, card_id):
        """The flag that takes the card out of the counts (the first in order), or None when it is counted."""
        return None if self.counted(card_id) else self.flag_of(card_id)

    hidden_band = hidden_kind   # the name a scorer's band step reads

    def _one_note(self, kind, card_id):
        if kind == "merged":
            tgt = self.merged.get(card_id)
            title = self.titles.get(tgt) or ""
            if title:
                return NOTES["merged"].format(target=title)
            return NOTES["merged"].replace(", {target}", "")
        if kind == "not_applicable":
            return NA_CARD_NOTES.get((self.na_cards.get(card_id) or {}).get("kind"), NA_CARD_NOTES["mixed"])
        return NOTES[kind]

    def note(self, card_id):
        k = self.kinds(card_id)
        if not k:
            return ""
        text = " ".join(self._one_note(x, card_id) for x in k)
        if self.counted(card_id):
            when = _when(self.person_review(card_id))
            return PERSON_NOTE.format(on=(" on " + when) if when else "", note=text)
        return text

    # ── courses with no card ──
    def course_flag(self, college, control_number):
        return "not_applicable" if course_key(college, control_number) in self.na_courses else None

    def course_note(self, college, control_number):
        e = self.na_courses.get(course_key(college, control_number))
        if not e:
            return ""
        kind = e[0] if isinstance(e, list) else (e or {}).get("kind")
        return NA_COURSE_NOTES.get(kind, "")

    # ── totals ──
    def summary(self, card_ids=None):
        """Per kind, how many cards carry it and how many it takes out of the counts (each subtracted once)."""
        ids = set(card_ids) if card_ids is not None else (
            set(self.retired) | set(self.merged) | set(self.inactive) | set(self.na_cards))
        carried = {k: 0 for k in FLAG_ORDER}
        hidden = {k: 0 for k in FLAG_ORDER}
        kept_by_person = 0
        for cid in ids:
            ks = self.kinds(cid)
            for k in ks:
                carried[k] += 1
            h = self.hidden_kind(cid)
            if h:
                hidden[h] += 1
            elif ks:
                kept_by_person += 1
        return {"carried": carried, "not_counted": hidden, "kept_in_counts_by_a_person": kept_by_person,
                "not_applicable_courses": len(self.na_courses), "set_aside_until_rebuilt": list(self.stale)}


def load_flags(root=None, titles=None):
    """The four flag sources from a checkout (default: this repo). `titles` maps card id to title for the merged
    note; when omitted, the curation overlay's unified titles stand in."""
    root = root or ROOT
    cur = (_read(root, FILES["curation"]) or {}).get("curations") or {}
    if titles is None:
        titles = {k: v.get("unified_title") for k, v in cur.items() if isinstance(v, dict) and v.get("unified_title")}
    docs, stale = {}, []
    for kind in MACHINE_FLAGS:
        doc = _read(root, FILES[kind])
        if not is_current_era(doc):
            stale.append(kind)
            sys.stderr.write("kb/_flags.py: %s was built before the latest re-mint (%s); its card flags are set aside "
                             "until the daily build rebuilds it.\n" % (FILES[kind], current_era()))
            # Course entries (college|control number) survive a re-mint; card ids may not.
            doc = {"courses": doc.get("courses") or {}} if kind == "not_applicable" else None
        docs[kind] = doc
    return Flags(curation=cur, retired=docs["retired"], inactive=docs["inactive"],
                 not_applicable=docs["not_applicable"], titles=titles, stale=stale)


def hidden_card_ids(root=None):
    """Every card a flag takes out of the counts, as {card_id: kind}: the one call a scorer or a fetch-plan builder
    needs to skip flagged cards (kb/_ccr_confidence_score.py and kb/_ccr_confidence_apply.py are to import it)."""
    F = load_flags(root)
    ids = set(F.retired) | set(F.merged) | set(F.inactive) | set(F.na_cards)
    return {cid: F.hidden_kind(cid) for cid in sorted(ids) if F.hidden_kind(cid)}


# ── shared by the flag builders ──
def card_universe(courses, curation, singletons=None):
    """Every card: the minted cards, every merge target, and the one-course cards (singletons)."""
    ids = {k for k, v in courses.items() if not k.startswith("_") and isinstance(v, dict)}
    ids |= {(c or {}).get("merge_into") for c in curation.values() if (c or {}).get("merge_into")}
    ids |= {k for k, v in (singletons or {}).items() if not k.startswith("_") and isinstance(v, dict)}
    return ids


def final_target(card_id, curation, limit=20):
    """Where a merged card's colleges count: its `merge_into`, followed to the end of the chain."""
    cur, seen = card_id, set()
    while limit > 0:
        tgt = ((curation.get(cur) or {}).get("merge_into") or "").strip()
        if not tgt or tgt == cur or tgt in seen:
            return cur
        seen.add(cur)
        cur, limit = tgt, limit - 1
    return cur


def folded_members(members, curation):
    """The Courses List's members per card (unified_courses_members.js `members`), with each merged card's members
    folded into the card it merged into: the count a person sees on the List."""
    out = {}
    for cid, rows in (members or {}).items():
        out.setdefault(final_target(cid, curation), []).extend(rows or [])
    return out


def sha256_of(path):
    import hashlib
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def write_json(path, payload):
    """Sorted, one entry per line: a small diff when one card moves, and the same bytes for the same inputs."""
    with open(path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=0, sort_keys=True, separators=(",", ":"))
        f.write("\n")
