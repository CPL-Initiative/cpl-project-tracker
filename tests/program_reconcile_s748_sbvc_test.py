#!/usr/bin/env python3
"""S748 (lane 1, keys): San Bernardino Valley's two reconcile steps for Music A.A. 04894's applied pair.

WHY. 04894 held by key through S740, S741 and S742. Its page adds to its printed 27-37, so no gap is true of it, and
a record today's scorer passes without the state's list is never gap-filed (kb/_program_piles_s742_sbvc.py). The
record fails with the state's list on one row: the page prints 'MUS 141X2 & MUS 241X2' as one row with one figure, 1,
under 'Complete 4 semesters totaling 2 units'. The reading put the 1 on MUS 141X2 and left MUS 241X2 without units,
the scorer priced MUS 241X2 from the state's list at 0.5, and the record added to 26.5-36.5. The scorer change S741
named moves 9 records fail to pass and 22 pass to fail over 18,970 and is not proposed. What S742 left is the
college's own reconcile steps (kb/program_requirements_reconcile.json, 'San Bernardino Valley College'), written
here with kinds the reconcile already holds, no code changed:

  and_units   the course the page joins to the row above by '&', read with no units, takes 0: the row's figure is the
              pair's (Monterey Peninsula's kind, S536).
  repeat      with block_sum (Saddleback's guard, S731): under the page's words 'Complete 4 semesters totaling 2
              units' the row counts twice, the count each of the pair's codes prints (X2: four semesters over the two
              courses), only where the list then adds exactly to the 2 its heading states.

The entry's own award gate ("awards": "noncredit") gated every step of the college, so it is lifted; the one earlier
step keeps its own noncredit gate, and both new steps read local A.A. degrees alone.

Pinned here:
  * the steps as written: the entry carries no gate of its own, the noncredit step keeps its gate, and the two new
    steps read local A.A. degrees, cite the page reads and come in order (the joined course takes 0 first);
  * the page's own lines (college-page-read run 46117535772, the course list as the capture's text breaks it, quoted
    below line for line; run 46117225783 printed the page as the capture reads it): on them the two steps give MUS
    241X2 0 units and MUS 141X2 two enrollments, and today's scorer, with the state's list, passes 04894 at 27-37;
  * the wrong joins refused: a page that does not print the pair joined; the pair under other heading words; a
    list whose heading states another figure; a course that already carries a count; a transfer degree, an A.S.
    degree and a certificate holding the same row; another college's record;
  * the lifted gate changes nothing else: every committed record of the college reconciles on the worst page (one
    that prints every pair of its lists joined by '&') exactly as it does under the entry as main holds it, 04894
    aside, and a noncredit record still takes its hours flag while a credit record never does;
  * the self-recall over every committed record of the college on that worst page: the steps reach one record,
    04894, which turns passing; no passing record turns failing.

A test of the steps on the committed records and the quoted lines. The free reconcile that reads the live page is the
runner's. Either state of 04894 is accepted: as S742 left it, or as that reconcile files it.

Run from repo root: python3 tests/program_reconcile_s748_sbvc_test.py
"""
import copy
import glob
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_piles_s714_ccsf as C  # noqa: E402
import _program_requirements_reconcile as R  # noqa: E402
import _program_requirements_score as S  # noqa: E402

SBVC, CN = "San Bernardino Valley College", "04894"
FOLDER = os.path.join(ROOT, "kb", "program_requirements_college", "san_bernardino_valley", "records")
STEPS = R.load_steps()
CONF = STEPS[SBVC]
READ_VIEW, READ_ROWS = "46117225783", "46117535772"
checks, failures = [0], []

# The course list of Music A.A. 04894's page, as read 46117535772 printed the page's text (a tab between cells; the
# log folds a run of short lines with ' · ', split back here to the lines the capture reads).
PAGE = """Course List
CODE\tTITLE\tUNITS
Required Courses:
Theory Courses:
MUS 101\tMusic Theory I: Fundamentals\t3
MUS 101L\tMusicianship I\t1
MUS 102\tMusic Theory II: Scales and Modes\t3
MUS 102L\tMusicianship II\t1
MUS 201\tMusic Theory III: Basic Harmony\t3
MUS 201L\tMusicianship III\t1
MUS 202\tMusic Theory IV: Harmony\t3
MUS 202L\tMusicianship IV\t1
Music History - Complete one course from the following:
MUS 104\tHistory of Rock and Roll\t3
MUS 105\tAmerican Popular Music\t3
MUS 106\tHistory of Jazz\t3
MUS 107\tMusic Cultures of the World\t3
MUS 108\tHistory of Hip Hop Music\t3
MUS 121\tMusic History and Literature - Middle Ages through Baroque\t3
or MUS 121H\tMusic History and Literature - Middle Ages through Baroque - Honors
MUS 122\tMusic History and Literature - Classic through Contemporary\t3
or MUS 122H\tMusic History and Literature - Classic through Contemporary - Honors
Applied Courses:
Complete 4 semesters totaling 2 units
MUS 141X2
& MUS 241X2\tApplied Music I
and Applied Music II\t1
Applied Ensemble Courses:
Complete 4 semesters totaling 4 units
MUS 150X4\tMixed Chorus\t1
MUS 152X4\tChamber Singers\t1
MUS 154X4\tCollege Singers\t1
MUS 156X4\tConcert Choir\t1
MUS 158X4\tGospel Choir\t1
MUS 160X4\tCommercial Music Ensemble\t1
MUS 162X4\tWind Ensemble\t1
MUS 166X4\tConcert Band\t1
MUS 167X4\tJazz Combo\t1
MUS 168X4\tJazz Band\t1
MUS 180X4\tInstrumental Chamber Music\t1
Complete one pathway from the following:
Commercial Music
MUS 103\tIntroduction to the Music Industry\t3
MUS 120\tSongwriting\t3
MUS 123\tElectronic Music I\t3
MUS 124\tElectronic Music II\t3
Instrumental
MUS 117A\tElementary Acoustic Guitar\t1
MUS 117B\tIntermediate Acoustic Guitar\t1
MUS 117C\tIntermediate/Advanced Acoustic Guitar\t1
MUS 117D\tAdvanced Acoustic Guitar\t1
MUS 133\tElementary Piano\t1
MUS 134\tIntermediate Piano\t1
MUS 135\tAdvanced Piano\t1
Jazz
MUS 170X2\tJazz Improvisation and Theory I\t1
MUS 171X2\tJazz Improvisation and Theory II\t1
Vocal
MUS 130\tElementary Voice\t3
MUS 131\tIntermediate Voice\t3
MUS 133\tElementary Piano\t1
Total Units\t27-37
"""
ROW = "MUS 141X2\n& MUS 241X2\tApplied Music I\nand Applied Music II\t1"
HEADING = "Complete 4 semesters totaling 2 units"
APPLIED = "Applied Courses: Complete 4 semesters totaling 2 units"


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)
        print("FAIL: " + msg)


def load(cn):
    with open(os.path.join(FOLDER, cn + ".json"), encoding="utf-8") as fh:
        return json.load(fh)


def as_read(f):
    """04894 as the reading left it: MUS 241X2 without units and no count (the record a reconcile filed, undone)."""
    g = copy.deepcopy(f)
    for b in g["record"]["blocks"]:
        for c in b.get("courses") or []:
            if S.norm_code(c.get("code")) == "MUS241X2" and c.get("units") == 0:
                c["units"] = None
            if S.norm_code(c.get("code")) == "MUS141X2":
                c.pop("times", None)
    return g


def steps_on(f, text, steps=None, college=SBVC, award=None):
    return R._college_steps(f["record"], text, college, f.get("award") if award is None else award, steps,
                            control_number=f.get("control_number"))


def view(f, record):
    sc = S.score(record, C.closed_list(SBVC, f.get("control_number")), None, f.get("award"), R.prefix_aliases(SBVC),
                 R.packed_codes(SBVC))
    return {"pass": bool(S.passes_live(sc)), "coverage": sc["coverage"]["pass"], "invented": sc["invented"]["pass"],
            "arithmetic": sc["arithmetic"].get("status"), "computed": sc["arithmetic"].get("computed"),
            "stated": sc["arithmetic"].get("stated")}


def applied(record):
    return [b for b in record.get("blocks") or [] if b.get("name") == APPLIED][0]


def pair(record):
    return {S.norm_code(c["code"]): (c.get("units"), c.get("times")) for c in applied(record)["courses"]}


# ── the steps as written ──────────────────────────────────────────────────
kinds = [st.get("kind") for st in CONF.get("steps") or []]
check("awards" not in CONF, "the entry carries no award gate of its own")
check(kinds == ["set", "and_units", "repeat"], "the entry's steps, in order: the hours flag, the joined course, the "
                                               "count (%r)" % kinds)
hours, joined, count = (CONF["steps"] + [{}, {}, {}])[:3]
check(hours.get("field") == "hours_total_printed" and hours.get("awards") == "noncredit",
      "the hours flag keeps its own noncredit gate")
check(joined.get("awards") == "local_aa" and count.get("awards") == "local_aa" and count.get("block_sum") is True,
      "both new steps read local A.A. degrees, and the count carries block_sum")
check(READ_VIEW in (joined.get("read") or "") and READ_ROWS in (joined.get("read") or "")
      and READ_ROWS in (joined.get("source_words") or "") and HEADING in (joined.get("source_words") or ""),
      "the joined-course step cites both page reads and the heading's words")
check("X2" in (count.get("why") or "") and "block_sum" in (count.get("why") or ""),
      "the count's step says where its count comes from and what holds it")
for path in ("kb/college_reads/s748_keys_san_bernardino_valley_04894.json",
             "kb/college_reads/s748_keys_san_bernardino_valley_04894_rows.json"):
    with open(os.path.join(ROOT, path), encoding="utf-8") as fh:
        plan = json.load(fh)
    check(plan["college"] == SBVC and [p["url"] for p in plan["pages"]] == [load(CN)["source_url"]],
          "%s reads the address 04894 was read from" % path)

# ── the page's own lines ──────────────────────────────────────────────────
check(PAGE.count(ROW) == 1 and PAGE.count(HEADING + "\n" + ROW) == 1,
      "the page prints the pair as one row, once, directly under 'Complete 4 semesters totaling 2 units'")
check("Complete 4 semesters totaling 4 units\nMUS 150X4\tMixed Chorus\t1" in PAGE and "Total Units\t27-37" in PAGE,
      "the ensemble list under it prints four semesters at 4 units over courses coded X4, and the page totals 27-37")
filed = load(CN)
read = as_read(filed)
check(pair(read["record"]) == {"MUS141X2": (1, None), "MUS241X2": (None, None)}
      and applied(read["record"])["rule"] == "all" and applied(read["record"])["stated"] == {"min": 2, "max": 2},
      "as read, the applied list is rule all at a stated 2 with the row's 1 on MUS 141X2 and MUS 241X2 without units")
before = view(read, read["record"])
check(before["pass"] is False and before["coverage"] and before["invented"] and before["arithmetic"] == "unequal"
      and before["computed"] == [26.5, 36.5] and before["stated"] == [27.0, 37.0],
      "as read, 04894 places every listed course and adds to 26.5-36.5 against the printed 27-37 (%r)" % before)
out, notes = steps_on(read, PAGE)
check([n.get("field") for n in notes] == ["joined_units", "times"]
      and notes[0]["now"] == {"MUS 241X2": "MUS 141X2"} and notes[1]["now"] == {"MUS 141X2": 2}
      and notes[1]["words"].split() == (HEADING + " MUS 141X2 & MUS 241X2").split(),
      "on the page's lines: the joined course takes the row's figure once, then the row counts twice (%r)"
      % [(n.get("field"), n.get("now")) for n in notes])
check(pair(out) == {"MUS141X2": (1, 2), "MUS241X2": (0, None)}, "MUS 241X2 at 0 and MUS 141X2 twice (%r)" % pair(out))
rest = lambda rec: [b for b in rec["blocks"] if b.get("name") != APPLIED]  # noqa: E731
check(rest(out) == rest(read["record"]) and out["program"] == read["record"]["program"],
      "nothing but the applied list moves")
after = view(read, out)
check(after == dict(before, **{"pass": True, "arithmetic": "equal", "computed": [27.0, 37.0]}),
      "today's scorer, with the state's list, then passes 04894 at its printed 27-37 (%r)" % after)
again, more = steps_on(dict(read, record=out), PAGE)
check(more == [] and again == out, "the steps run again change nothing")
check(view(filed, filed["record"]) in (before, after), "04894 as committed is one of the two states")

# ── the wrong joins refused ───────────────────────────────────────────────
unjoined = PAGE.replace(ROW, "MUS 141X2\tApplied Music I\t1\nMUS 241X2\tApplied Music II")
check(steps_on(read, unjoined)[1] == [], "a page that does not print the pair joined changes nothing")
other = PAGE.replace(HEADING, "Complete 4 semesters of applied study")
o, n2 = steps_on(read, other)
check([x.get("field") for x in n2] == ["joined_units"] and pair(o)["MUS141X2"] == (1, None),
      "the pair under other heading words: the row's figure is still the pair's, and no count is read")
three = copy.deepcopy(read)
applied(three["record"])["stated"] = {"min": 3, "max": 3}
o, n2 = steps_on(three, PAGE)
check("times" not in [x.get("field") for x in n2] and pair(o)["MUS141X2"] == (1, None),
      "a list whose heading states another figure takes no count (block_sum)")
counted = copy.deepcopy(read)
applied(counted["record"])["courses"][0]["times"] = 4
o, n2 = steps_on(counted, PAGE)
check("times" not in [x.get("field") for x in n2] and pair(o)["MUS141X2"] == (1, 4),
      "a course that already carries a count keeps it")
for award in ("A.A- T Degree", "A.S. Degree",
              "Certificate of Achievement requiring 16S/24Q to fewer than 30S/45Q units", "Noncredit program"):
    check(steps_on(read, PAGE, award=award) == (read["record"], []), "%s: the steps read nothing" % award)
check(R.awards_match("local_aa", filed["award"]), "04894's own award is a local A.A.")
for name in ("Monterey Peninsula College", "Saddleback College", "Crafton Hills College"):
    o, n2 = steps_on(read, PAGE, college=name)
    check("times" not in [x.get("field") for x in n2], "%s's entry reads no count from these lines" % name)
check(all(not ((st.get("pattern") or "").count("141X")) for name, c in STEPS.items() if name != SBVC
          and isinstance(c, dict) for st in c.get("steps") or []), "no other college's entry carries the count's step")

# ── the lifted gate changes nothing else, and the self-recall ─────────────
old = copy.deepcopy(STEPS)
old[SBVC]["awards"] = "noncredit"
old[SBVC]["steps"] = [st for st in old[SBVC]["steps"] if st.get("kind") == "set"]


def worst(rec):
    """A page that prints every pair of the record's lists joined by '&' (a course with units, then one without),
    under the count's own heading words: the most the two steps could be offered."""
    lines = ["Requirements", HEADING]
    for b in rec.get("blocks") or []:
        cs = b.get("courses") or []
        for i, c in enumerate(cs):
            if i and c.get("code") and cs[i - 1].get("code") and c.get("units") is None \
                    and c.get("units_max") is None and S._num(cs[i - 1].get("units")) is not None:
                lines.append("%s\n& %s\tTitle\nand Title\t%s" % (cs[i - 1]["code"], c["code"], cs[i - 1]["units"]))
    lines.append("Total Hours 48-54")
    return "\n".join(lines), len(lines) - 3


records, offered, reached, moved, flagged, credit_flagged = 0, [], [], {}, 0, 0
for path in sorted(glob.glob(os.path.join(FOLDER, "*.json"))):
    with open(path, encoding="utf-8") as fh:
        f = json.load(fh)
    if not isinstance(f.get("record"), dict):
        continue
    if f["control_number"] == CN:
        f = read
    records += 1
    text, pairs = worst(f["record"])
    if pairs and R.awards_match("local_aa", f.get("award")):
        offered.append(f["control_number"])
    new_out, new_notes = steps_on(f, text)
    old_out, old_notes = steps_on(f, text, steps=old)
    if (new_out.get("program") or {}).get("hours_total_printed"):
        flagged += 1
        credit_flagged += 0 if R.awards_match("noncredit", f.get("award")) else 1
    if new_out != old_out or new_notes != old_notes:
        reached.append(f["control_number"])
        a, b = view(f, old_out), view(f, new_out)
        if a != b:
            moved[f["control_number"]] = (a, b)
check(records >= 200, "the college's committed records are read (%d)" % records)
check(offered == [CN], "on the worst page the steps are offered one local A.A. record's pair, 04894's (%r)" % offered)
check(reached == [CN], "they reach 04894 alone: every other record reconciles as under the gated entry (%r)" % reached)
check(sorted(moved) == [CN] and moved[CN][0]["pass"] is False and moved[CN][1]["pass"] is True,
      "04894 turns passing, and no other record's score moves (%r)" % sorted(moved))
check(not [cn for cn, (a, b) in moved.items() if a["pass"] and not b["pass"]], "no passing record turns failing")
check(flagged >= 1 and credit_flagged == 0,
      "the hours flag still reads noncredit programs alone (%d flagged, %d of them credit)" % (flagged, credit_flagged))

print("self-recall: %d records, offered %d, reached %d, fail to pass %d, pass to fail %d"
      % (records, len(offered), len(reached), len([1 for a, b in moved.values() if not a["pass"] and b["pass"]]),
         len([1 for a, b in moved.values() if a["pass"] and not b["pass"]])))
print("%d checks, %d failures" % (checks[0], len(failures)))
sys.exit(1 if failures else 0)
