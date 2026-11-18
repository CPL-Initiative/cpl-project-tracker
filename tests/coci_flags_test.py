#!/usr/bin/env python3
"""The course flags keep every record and take flagged ones out of the counts (Sam, 2026-11-17, relayed by COBIx:
"flag the record, never delete it; take flagged records out of counts, waiting piles, to-dos and fetch plans";
the Courses bot's ask, #3480 Source 13, test section).

Offline: a fixture checkout in a temporary folder, the three builders run against it with --root, and kb/_flags.py
read back. The failure modes guarded:
  1. a builder deletes or rewrites an input, or a record vanishes from every output;
  2. a flag lands on the wrong record (an exhibit-linked emptied card, a card with one independent study course among
     ordinary ones, an externship, "French 1");
  4. a flagged card still counts, or a card carrying two flags is subtracted twice;
  5. a flagged record loses its note;
  6. the title rule drifts from its fixed checks;
  7. a note uses insider words;
  and a person's review is hidden by a machine flag without the note saying so.

Run: python3 tests/coci_flags_test.py   (exit 0 = all pass)
"""
import gzip
import hashlib
import json
import os
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _flags as F  # noqa: E402
import _not_applicable_rule as R  # noqa: E402
import _row_audit as RA  # noqa: E402
import plain_words  # noqa: E402

results = []


def check(name, cond):
    results.append((name, bool(cond)))


COLLEGES = ["Alpha College", "Beta College"]


def m(c, cn, t, n="ART 1"):
    return {"c": c, "cn": cn, "t": t, "n": n}


FIXTURE = {
    "kb/coci_minted_courses.json": {"courses": {
        "ARTS M1001": {"common_title": "Drawing I"},          # merged into ARTS M1002
        "ARTS M1002": {"common_title": "Drawing"},            # the target, live
        "ARTS M1003": {"common_title": "Painting I"},         # emptied, an exhibit points to it
        "ARTS M1004": {"common_title": "Painting II"},        # emptied, no link: inactive
        "ARTS M1005": {"common_title": "Independent Study"},  # every course independent study: not applicable
        "ARTS M1006": {"common_title": "Studio Projects"},    # one independent study among ordinary courses
        "ARTS M1007": {"common_title": "Ceramics"},           # every course inactive at the state: retired
        "ARTS M1008": {"common_title": "Sculpture"},          # emptied, no link, but a person reviewed it
        "ARTS M1009": {"common_title": "Glass"},              # merged AND retired: subtracted once
    }},
    "kb/coci_minted_singletons.json": {"courses": {}},
    "kb/coci_minted_memberships.json": {"memberships": {
        "ARTS M1001": [{"college": "Alpha College", "control_number": "CCC1"}],
        "ARTS M1003": [{"college": "Alpha College", "control_number": "CCC30"}],
        "ARTS M1004": [{"college": "Alpha College", "control_number": "CCC40"}],
        "ARTS M1007": [{"college": "Alpha College", "control_number": "CCC70"},
                       {"college": "Beta College", "control_number": "CCC71"}],
        "ARTS M1009": [{"college": "Beta College", "control_number": "CCC90"}],
    }},
    "kb/coci_curation.json": {"curations": {
        "ARTS M1001": {"merge_into": "ARTS M1002", "reviewed_by": "skyview-s600@bot"},
        "ARTS M1009": {"merge_into": "ARTS M1002", "reviewed_by": "skyview-s600@bot"},
        "ARTS M1008": {"discipline": "Art", "reviewed_by": "named-curator", "reviewed_at": "2026-11-09T10:00:00Z"},
    }},
    # The applied re-key markers say the ids are current; the builder reads them raw (never resolves them again).
    "kb/coci_articulations.json": dict({k: "fixture" for k in __import__("_build_remint_blast_radius").APPLIED_MARKERS},
                                       articulations=[{"course_id": "ARTS M1003"}]),
}
LIST = {"generated_at": "fixture", "colleges": COLLEGES, "members": {
    "ARTS M1001": [m(0, "CCC1", "Drawing I")],
    "ARTS M1002": [m(1, "CCC2", "Drawing")],
    "ARTS M1005": [m(0, "CCC50", "Independent Study in Art"), m(1, "CCC51", "Directed Study: Art")],
    "ARTS M1006": [m(0, "CCC60", "Independent Study in Art"), m(1, "CCC61", "Studio Projects")],
    "ARTS M1007": [m(0, "CCC70", "Ceramics"), m(1, "CCC71", "Ceramics I")],
}}
CREDREF = {"unified_titles": []}
# The state's course list: every course above, plus five with no card.
NO_CARD = [("AB 389", "na"), ("French 1", "gap"), ("Internship in Music", "na"),
           ("Medical Assisting Externship", "gap"), ("Selected Topics in Art", "gap")]
COCI_ROWS = [[0, "CCC1", "ART", "1", "Drawing I"], [1, "CCC2", "ART", "2", "Drawing"],
             [0, "CCC50", "ART", "99", "Independent Study in Art"], [1, "CCC51", "ART", "98", "Directed Study: Art"],
             [0, "CCC60", "ART", "99", "Independent Study in Art"], [1, "CCC61", "ART", "10", "Studio Projects"],
             [0, "CCC71", "ART", "5", "Ceramics I"]]
COCI_ROWS += [[0, "CCN%d" % i, "AB" if t == "AB 389" else "FREN", str(i), t] for i, (t, _) in enumerate(NO_CARD)]
STATUS = [("CCC70", "Inactive"), ("CCC71", "Deleted"), ("CCC90", "Inactive"), ("CCC2", "Active"),
          ("CCC30", "Active"), ("CCC40", "Active")]
FALL = ["CCC2", "CCC50"]


def write_fixture(root):
    for rel, obj in FIXTURE.items():
        os.makedirs(os.path.dirname(os.path.join(root, rel)), exist_ok=True)
        with open(os.path.join(root, rel), "w", encoding="utf-8") as f:
            json.dump(obj, f)
    for rel, name, obj in (("unified_courses_members.js", "CPL_UC_MEMBERS", LIST),
                           ("credential_reference_data.js", "CPL_CREDENTIAL_REFERENCE", CREDREF),
                           ("coci_lookup_data.js", "CPL_COCI_LOOKUP", {"colleges": COLLEGES, "rows": COCI_ROWS})):
        with open(os.path.join(root, rel), "w", encoding="utf-8") as f:
            f.write("window.%s = %s;\n" % (name, json.dumps(obj)))
    os.makedirs(os.path.join(root, "kb/reference"), exist_ok=True)
    with gzip.open(os.path.join(root, "kb/reference/coci_program_course_file.csv.gz"), "wt", encoding="utf-8") as f:
        f.write("CourseControlNumber,CourseStatus\n" + "".join("%s,%s\n" % r for r in STATUS))
    with open(os.path.join(root, "kb/reference/cb_course_basic_fall2025.csv"), "w", encoding="utf-8") as f:
        f.write("CB_CONTROL_NUMBER\n" + "".join(c + "\n" for c in FALL))


def digests(root):
    out = {}
    for d, _, fs in os.walk(root):
        for n in fs:
            p = os.path.join(d, n)
            with open(p, "rb") as f:
                out[os.path.relpath(p, root)] = hashlib.sha256(f.read()).hexdigest()
    return out


with tempfile.TemporaryDirectory() as tmp:
    write_fixture(tmp)
    before = digests(tmp)
    for b in ("_build_retired_cards.py", "_build_inactive_cards.py", "_build_not_applicable.py"):
        r = subprocess.run([sys.executable, os.path.join(ROOT, "kb", b), "--root", tmp], capture_output=True, text=True)
        check(b + " runs on the fixture", r.returncode == 0)
        if r.returncode:
            print(r.stderr[-800:])
    after = digests(tmp)
    # 1. Never deletes.
    check("1. every input file is byte-identical afterwards", all(after.get(k) == v for k, v in before.items()))
    check("1. the builders add exactly the three flag files",
          sorted(set(after) - set(before)) == sorted([F.FILES["retired"], F.FILES["inactive"], F.FILES["not_applicable"]]))
    flags = F.load_flags(tmp, titles={"ARTS M1002": "Drawing"})
    cards = set(FIXTURE["kb/coci_minted_courses.json"]["courses"])
    check("1. every card is still a record the flags can name (flagged or counted)",
          all(flags.counted(c) or flags.kinds(c) for c in cards))
    for rel in (F.FILES["retired"], F.FILES["inactive"], F.FILES["not_applicable"]):
        with open(os.path.join(tmp, rel), "rb") as f1:
            first = f1.read()
        subprocess.run([sys.executable, os.path.join(ROOT, "kb", "_build_" + {
            "kb/coci_retired_cards.json": "retired_cards", "kb/coci_inactive_cards.json": "inactive_cards",
            "kb/coci_not_applicable.json": "not_applicable"}[rel] + ".py"), "--root", tmp], capture_output=True)
        with open(os.path.join(tmp, rel), "rb") as f2:
            check("1. a rebuild writes the same bytes: " + rel, f2.read() == first)

    # 2. Right flags.
    check("2. the merged card is merged", flags.kinds("ARTS M1001") == ["merged"])
    check("2. the target is not flagged", flags.kinds("ARTS M1002") == [])
    check("2. the emptied card with an exhibit link is not inactive", "inactive" not in flags.kinds("ARTS M1003"))
    check("2. the emptied card without one is inactive", flags.kinds("ARTS M1004") == ["inactive"])
    check("2. the all-independent-study card is not applicable", flags.kinds("ARTS M1005") == ["not_applicable"])
    check("2. the mixed card is not", flags.kinds("ARTS M1006") == [])
    check("2. the card whose courses are all inactive at the state is retired", flags.kinds("ARTS M1007") == ["retired"])
    check("2. a card both retired and merged carries both, retired first", flags.kinds("ARTS M1009") == ["retired", "merged"])
    for i, (t, want) in enumerate(NO_CARD):
        got = flags.course_flag(COLLEGES[0], "CCN%d" % i)
        check("2. no-card course %r is %s" % (t, "not applicable" if want == "na" else "a real gap"),
              (got == "not_applicable") == (want == "na"))
    with open(os.path.join(tmp, F.FILES["not_applicable"])) as f:
        na = json.load(f)
    check("2. the gap count splits 2 not applicable from 3 real gaps",
          na["counts"]["courses"] == 2 and na["counts"]["real_gaps"] == 3 and na["counts"]["courses_with_no_card"] == 5)

    # A person's review is final: the machine flag adds its note and the card stays counted.
    check("person: the reviewed emptied card carries the inactive flag", flags.kinds("ARTS M1008") == ["inactive"])
    check("person: and stays in the counts", flags.counted("ARTS M1008"))
    check("person: and its note says why", flags.note("ARTS M1008").startswith(
        "A person reviewed this shared course on Nov 9, 2026, and their ruling stands"))

    # 4. Leave the counts, each flagged card subtracted once.
    rows = [{"row_id": c, "row_kind": "Course", "faculty_readiness": "ready", "mc_readiness": "needs_review",
             "tags": ["blank_description"]} for c in sorted(cards)]
    rows.append({"row_id": "ARTS M1002", "row_kind": "Unified", "faculty_readiness": "needs_review",
                 "mc_readiness": "needs_review", "tags": ["cluster_blanks_when_aggregatable"]})
    st = RA._stats(rows, flags)
    counted = {"ARTS M1002", "ARTS M1003", "ARTS M1006", "ARTS M1008"}
    check("4. total_cards counts the distinct cards no flag takes out", st["total_cards"] == len(counted))
    check("4. every tag count leaves flagged cards out", st["tag_counts"]["blank_description"] == len(counted))
    check("4. a merge target's two rows count once", st["faculty_readiness"]["ready"] == len(counted))
    check("4. the merged-and-retired card is subtracted once, as retired",
          st["kept_not_counted"] == {"retired": 2, "merged": 1, "inactive": 1, "not_applicable": 1})
    check("4. every row is still written", st["rows_written"] == len(rows) and st["distinct_cards"] == len(cards))
    check("4. the scorer's helper names every hidden card and no counted one",
          set(F.hidden_card_ids(tmp)) == cards - counted)

    # 5. Still findable, with the exact note.
    check("5. the merged note names its target", flags.note("ARTS M1001") ==
          "Merged into another shared course, Drawing. Kept for the record; its colleges are counted there.")
    check("5. the inactive note", flags.note("ARTS M1004") == F.NOTES["inactive"])
    check("5. the not-applicable card note", flags.note("ARTS M1005") == F.NA_CARD_NOTES["independent"])
    check("5. the not-applicable course note", flags.course_note(COLLEGES[0], "CCN2") == F.NA_COURSE_NOTES["internship"])
    check("5. a card with two flags carries both notes", flags.note("ARTS M1009").startswith(F.NOTES["retired"]))

    # Era guard (COBIx on #3519, finding 2): a flag file built before the latest re-mint names card ids that may now
    # belong to other cards, so its card flags are set aside until it is rebuilt; course entries stay in force.
    for rel in (F.FILES["retired"], F.FILES["inactive"], F.FILES["not_applicable"]):
        with open(os.path.join(tmp, rel)) as f:
            doc = json.load(f)
        check("era: %s carries the current era" % rel, doc.get(F.ERA_KEY) == F.current_era())
        doc[F.ERA_KEY] = "kb/an_earlier_remint/alias_map.json"
        with open(os.path.join(tmp, rel), "w") as f:
            json.dump(doc, f)
    old = F.load_flags(tmp, titles={"ARTS M1002": "Drawing"})
    check("era: every stale machine flag file is set aside", sorted(old.stale) == sorted(F.MACHINE_FLAGS))
    check("era: a stale inactive file hides no card", old.kinds("ARTS M1004") == [] and old.counted("ARTS M1004"))
    check("era: a stale not-applicable file hides no card", old.counted("ARTS M1005"))
    check("era: merged still comes from the curation overlay", old.kinds("ARTS M1001") == ["merged"])
    check("era: course entries survive a re-mint",
          old.course_flag(COLLEGES[0], "CCN2") == "not_applicable")
    check("era: the scorer's helper hides only merged cards", set(F.hidden_card_ids(tmp)) == {"ARTS M1001", "ARTS M1009"})
    r = subprocess.run([sys.executable, os.path.join(ROOT, "kb", "_build_inactive_cards.py"), "--root", tmp, "--check"],
                       capture_output=True, text=True)
    check("era: --check calls a stale-era file stale", r.returncode == 1)

# The links file is current-era: the inactive builder reads its ids raw and refuses a file without its markers.
# (S683 second reader: resolving the already-current ids again moved 1,291 links onto unrelated live cards, and 64
# cards escaped the flag.)
import _build_inactive_cards as BI  # noqa: E402
check("era: the inactive builder resolves no link id", BI.linked_ids(
    {"articulations": [{"course_id": "ARTS M1083"}]}, {}) == {"ARTS M1083"})
try:
    BI.assert_current_era({"articulations": []})
    check("era: a links file without its applied markers is refused", False)
except SystemExit:
    check("era: a links file without its applied markers is refused", True)
try:
    BI.assert_links_agree({"articulations": [{"course_id": "ARTS M1083"}]},
                          {"unified_titles": [{"articulations": [{"cid": "ARTS M1068"}]}]})
    check("era: a credential reference naming an id the links file lacks is refused", False)
except SystemExit:
    check("era: a credential reference naming an id the links file lacks is refused", True)
BI.assert_links_agree({"articulations": [{"course_id": "ARTS M1083"}]},
                      {"unified_titles": [{"articulations": [{"cid": "ARTS M1083"}]}]})
check("era: an agreeing credential reference passes", True)
real_flags = F.load_flags(ROOT)
check("era: no committed flag file is set aside", real_flags.stale == [])
with open(os.path.join(ROOT, "kb/coci_articulations.json")) as f:
    raw_links ={a.get("course_id") for a in json.load(f).get("articulations") or []}
with open(os.path.join(ROOT, F.FILES["inactive"])) as f:
    committed_inactive = set(json.load(f)["cards"])
check("era: no committed inactive card is a card an exhibit links to as the file writes it",
      not (raw_links & committed_inactive))
check("era: the AP Art History link keeps ARTS M1083 off the inactive list", "ARTS M1083" not in committed_inactive)

# Recall on real records: the cards the Courses bot's ask names (#3480 Source 13), read from the committed files.
real = F.load_flags(ROOT)
for cid in ("WEXP M1002", "WELD M1006", "MUSI M1466", "ARTS M1450", "COMM M1045", "ARTS M1514", "IDST M1171",
            "WEXP M1013", "IDST M9027"):
    check("recall: %s is not applicable" % cid, "not_applicable" in real.kinds(cid))
check("recall: ETHS M1171 is not flagged not applicable", "not_applicable" not in real.kinds("ETHS M1171"))

# 6. Rule check.
check("6. the title rule's %d fixed checks pass" % len(R.CHECKS), not R.self_check() and len(R.CHECKS) == 26)

# 7. Plain words.
BANNED = ["M-ID", "control number", "merge_into", "seed", "null", "should", "must", "please"]
for n in F.ALL_NOTES:
    bad = [w for w in BANNED if w.lower() in n.lower()]
    check("7. plain words: %s..." % n[:40], not bad and not plain_words.offenses(n))
check("7. American spelling in the notes", not any(w in " ".join(F.ALL_NOTES).lower()
                                                     for w in ("honour", "colour", "recognis", "organis", "catalogue")))

failed = [n for n, ok in results if not ok]
for n, ok in results:
    print(("PASS  " if ok else "FAIL  ") + n)
print("\n%d/%d passed" % (len(results) - len(failed), len(results)))
sys.exit(1 if failed else 0)
