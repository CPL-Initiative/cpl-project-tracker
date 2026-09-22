#!/usr/bin/env python3
"""The orphan-parent worklist — identities whose members all disagree with them.

Item 9 of Sam's cross-list decision sheet (2026-09-22). Among the rows whose
member colleges resolve to more than one MQ discipline, some carry a recorded
discipline that appears **nowhere** among their members. The parent says one
thing and every college under it says another. *Hydraulics (Fluid Power)* sits
under Agriculture while its members read Automotive Technology and Fire
Technology.

These are neither dual homes nor specializations, so sending them through a
cross-list pass would record the disagreement as a second home and settle
nothing. They get their own list.

⚠️ **`decidable` MEANS CHECKABLE, NEVER "THE PARENT IS WRONG"**, and it is the same lesson the
discipline-blank worklist learned: a list of ids with no column saying whether
the answer is checkable reads as a to-do, and the next session fills it. Three
things make a row undecidable here:

  * the members themselves disagree (a split is a question, never a correction);
  * every mapped member signal rests on a subject code of one or two characters,
    which is ambiguous by construction — filling from it would reintroduce the
    `ES` error the minting gate now blocks (`_seed_coci_minted_mids.py`);
  * the row carries a C-ID rather than an M-ID, so a discipline change reaches
    past our own staging layer.

⚠️ THE MEMBER SIGNAL IS `row["subj"]`, NOT THE ID PREFIX — the opposite of the
blanks worklist. That file asks what an identity's own canonical SUBJ4 says;
this one asks what the member COLLEGES typed, because the disagreement between
the parent and its members is the whole subject.

Read-only. Run from the repo root: `python3 kb/_build_orphan_parent_worklist.py`
(`--check` exits 1 if the committed file is stale).
"""
import collections
import importlib.util
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(HERE, "orphan_parent_worklist.json")


def _short_code_max():
    """The short-code threshold, from the one place that defines it.

    Rule 7's alias-chain lesson applies to any rule with two copies: the chain
    was copy-pasted once and the copy drifted to 7 maps against 15 under a
    comment promising lockstep. Import it.
    """
    spec = importlib.util.spec_from_file_location(
        "_seed_mids", os.path.join(HERE, "_seed_coci_minted_mids.py"))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.SHORT_CODE_MAX


def _rows():
    src = open(os.path.join(ROOT, "unified_courses_data.js"), encoding="utf-8").read()
    return json.loads(src[src.index("{"):src.rindex("}") + 1])["rows"]


def build():
    short_max = _short_code_max()
    code_to_disc = json.load(
        open(os.path.join(HERE, "reference", "subject_discipline_map.json")))["map"]
    rows = _rows()

    out = []
    for r in rows:
        recorded = r.get("disc")
        if not recorded:
            continue                      # a blank is the OTHER worklist's row
        seen = collections.Counter()
        long_seen = collections.Counter()
        codes = []
        for c in (r.get("subj") or []):
            key = str(c).upper()
            d = code_to_disc.get(key)
            if not d:
                continue
            codes.append(key)
            seen[d] += 1
            if len(key) > short_max:
                long_seen[d] += 1
        if len(seen) < 2 or recorded in seen:
            continue                      # agrees with somebody, or has one voice

        # Why this row is, or is not, answerable from what the payload holds.
        if len(long_seen) == 0:
            decidable, why = False, (
                "every member signal rests on a subject code of one or two characters, "
                "which is ambiguous by construction — the subject map has to be repaired "
                "before this row can be read")
        elif len(long_seen) > 1:
            decidable, why = False, (
                "the members disagree among themselves (%s), so this is a question rather "
                "than a correction — a cross-list candidate once the parent is settled"
                % " and ".join(sorted(long_seen)))
        elif r.get("id_system") != "M-ID":
            decidable, why = False, (
                "this carries a %s rather than an M-ID, so a discipline change reaches "
                "past our own staging layer" % r.get("id_system"))
        else:
            d, n = long_seen.most_common(1)[0]
            decidable, why = True, (
                "every member that resolves on a code longer than %d characters reads %s "
                "(%d of them)" % (short_max, d, n))

        out.append({
            "id": r.get("id"),
            "title": (r.get("title") or "").strip(),
            "id_system": r.get("id_system"),
            "recorded_discipline": recorded,
            "members": r.get("members"),
            "subject_codes": sorted(set(codes)),
            "member_disciplines": dict(seen.most_common()),
            "member_disciplines_on_long_codes": dict(long_seen.most_common()),
            "decidable": decidable,
            "why": why,
            # ⚠️ WHAT THE MEMBERS SAY, NEVER WHAT IS RIGHT. `AUTD M1040 Medium and
            # Heavy Truck Drivetrain Service` is recorded Diesel Mechanics while its
            # members read Automotive Technology — and Diesel Mechanics is arguably
            # the better answer for a heavy-truck drivetrain course. A unanimous
            # member reading makes the row ANSWERABLE; the curator still decides
            # which side is the error.
            "members_say": (long_seen.most_common(1)[0][0] if decidable else None),
        })

    out.sort(key=lambda x: (not x["decidable"], -(x["members"] or 0), x["id"]))
    undecidable = [x for x in out if not x["decidable"]]
    doc = {
        "_about": ("Identities whose recorded discipline appears nowhere among their "
                   "members' mapped disciplines. Item 9 of Sam's cross-list decision "
                   "sheet, 2026-09-22: their own worklist, ahead of the cross-list pass."),
        "_generated_by": "kb/_build_orphan_parent_worklist.py",
        "_read_this_first": (
            "`decidable` is the column that matters. A false there means the payload "
            "holds nothing to check a proposed discipline against — the members disagree, "
            "or every signal rests on a one or two character subject code, or the row "
            "carries an approved identifier. Filling those from the modal member would "
            "reproduce the `ES`-reads-Ethnic-Studies error in reverse. "
            "\u26a0 And `members_say` is what the colleges typed, never a verdict on "
            "the parent: AUTD M1040 Medium and Heavy Truck Drivetrain Service is "
            "recorded Diesel Mechanics while its members read Automotive Technology, "
            "and Diesel Mechanics is arguably the better answer. A decidable row is "
            "one a curator can settle from what is here, whichever way they settle it."),
        "_counts": {
            "orphan_parents": len(out),
            "decidable": len(out) - len(undecidable),
            "undecidable": len(undecidable),
            "members_disagree": sum(1 for x in undecidable if "disagree among themselves" in x["why"]),
            "short_codes_only": sum(1 for x in undecidable if "one or two characters" in x["why"]),
            "carries_an_approved_identifier": sum(1 for x in undecidable if "rather than an M-ID" in x["why"]),
        },
        "rows": out,
    }
    return doc


def main(argv):
    doc = build()
    text = json.dumps(doc, indent=2, ensure_ascii=False) + "\n"
    if "--check" in argv:
        if not os.path.exists(OUT) or open(OUT, encoding="utf-8").read() != text:
            print("orphan-parent worklist is STALE — run: "
                  "python3 kb/_build_orphan_parent_worklist.py")
            return 1
        print("orphan-parent worklist is current")
        return 0
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(text)
    c = doc["_counts"]
    print("wrote %s — %d orphan parents; %d decidable, %d not "
          "(%d members disagree, %d rest on a short code, %d carry an approved identifier)"
          % (OUT, c["orphan_parents"], c["decidable"], c["undecidable"],
             c["members_disagree"], c["short_codes_only"],
             c["carries_an_approved_identifier"]))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
