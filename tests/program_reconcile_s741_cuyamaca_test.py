#!/usr/bin/env python3
"""S741 (lane 1, keys): Cuyamaca's reconcile step, the degree's 60 as the page words it, on the page's own words.

WHY. Cuyamaca's four University Studies degrees (18634, 18635, 18636, 18637) each add their 18-unit area of emphasis
(the pooled reading, S731) and Cal-GETC's 34 to 52 against a degree total of 60, and fail on the degree alone. Each
page prints, under 'Requirements' (college page read 45768981024, kb/college_reads/cuyamaca_university_studies_s739.json,
the four pages read as the capture reads them):

    Complete 60 transferable units
    CSU or UC transferable units
    California General Education Transfer Curriculum (Cal-GETC)
    Complete 34 units of transfer general education as required for Cal-GETC (see Degree Requirements section of catalog)
    Choose a minimum of 18 units

and no elective line, so each reading left electives_fill_degree false. The 60 is the count of transferable units
the degree asks for, which any CSU or UC transferable units make up. The college's entry
(kb/program_requirements_reconcile.json, "Cuyamaca College") carries one set step: degree_total_minimum, on a local
degree that already holds a degree total, where the page prints 'Complete 60 transferable units'.

Pinned here:
  * the step as written, citing its page read;
  * the step on the page's words: each of the four takes the flag and today's scorer then passes it, its major at
    the pooled 18 and the degree at its floor; a record that carries the flag is left alone;
  * the wrong joins it refuses: a page without the words; a transfer degree and a certificate, though their page
    print the words; a local degree that holds no degree total; another college's record (Grossmont's University
    Studies page, on the same host, takes nothing from Cuyamaca's entry);
  * the self-recall over every committed Cuyamaca record (the S652 review rule, counting what the step joins as well
    as the verdicts), with the words put on every record's page: the flag lands on the four University Studies
    degrees alone; each turns passing; no passing record turns failing; no other field of any record moves;
  * 18637's filed record was read from Grossmont's page, another address than the capture names for it today, so a
    reconcile run leaves it as filed (the moved-page guard) until a read of its own page.

A record a reconcile run has already moved is read in either state: it takes the flag here or carries it already.

S742 (lane 1, readers): a second step. Paid read 46003456131 read 18637 from its own page, and that reading took
'CSU or UC transferable units' as the units that fill the rest of the 60 (electives_fill_degree true), where the
other three readings left the flag false. The scorer's electives guard runs ahead of the floor and asks the catalog
text for the word or for the catalog's own sentence (electives_fill_words), so 18637 failed with its major equal.
The step files the page's words, 'CSU or UC transferable units', where the page prints them directly under 'Complete
60 transferable units', on a local degree that holds a degree total and already reads electives as filling it.
Pinned below: the step as written; 18637 fails as read against its page's text and passes with both steps; the
joins it refuses (a page without the second line, a record that leaves the flag false, a transfer degree); and the
recall, scored against text that prints both lines: the words land on 18637 alone, and no passing record turns
failing. Every score here reads the page's text, since the electives guard reads nothing without it.

Run from repo root: python3 tests/program_reconcile_s741_cuyamaca_test.py
"""
import copy
import glob
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_piles_s714_ccsf as C  # noqa: E402
import _program_requirements_reconcile as R  # noqa: E402
import _program_requirements_score as S  # noqa: E402

CUY = "Cuyamaca College"
FOLDER = os.path.join(ROOT, "kb", "program_requirements_college", "cuyamaca", "records")
STEPS = R.load_steps()
FLAG = "degree_total_minimum"
WORDS = "electives_fill_words"
FOUR = ("18634", "18635", "18636", "18637")
checks, failures = [0], []

# The page read's lines (run 45768981024), University Studies: Communication and Language Arts 18634.
PAGE = """University Studies: Communication and Language Arts
University Studies: Communication and Language Arts
On This Page
Requirements
Program Learning Outcomes
Communication
Language Arts

Requirements
Complete 60 transferable units
CSU or UC transferable units
California General Education Transfer Curriculum (Cal-GETC)
Complete 34 units of transfer general education as required for Cal-GETC (see Degree Requirements section of catalog)
Choose a minimum of 18 units
Students must complete a minimum of three units in Communication, and three units Language Arts. The remaining twelve units may be taken from either category.
"""
NO_WORDS = PAGE.replace("Complete 60 transferable units\n", "")


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


def filed(cn):
    with open(os.path.join(FOLDER, cn + ".json"), encoding="utf-8") as fh:
        return json.load(fh)


def unflagged(f):
    rec = copy.deepcopy(f["record"])
    rec["program"].pop(FLAG, None)
    rec["program"].pop(WORDS, None)
    return rec


def recon(rec, text, award, cn=None, college=CUY):
    return R.reconcile(copy.deepcopy(rec), text, college, award, control_number=cn, steps=STEPS)


def flags(notes):
    return [n for n in notes if n.get("field") == FLAG]


def score(f, rec, text):
    """The record scored against its own state list and the page's text (the electives guard reads the text)."""
    return S.score(rec, C.closed_list(CUY, f["control_number"]), text, f.get("award"),
                   R.prefix_aliases(CUY, year=f.get("catalog_year")), R.packed_codes(CUY))


def arith(f, rec, text=None):
    return score(f, rec, PAGE if text is None else text)["arithmetic"]


print("the entry")
entry = STEPS[CUY]
steps = entry.get("steps") or []
check(len(steps) == 2 and steps[0]["kind"] == "set" and steps[0]["field"] == FLAG and steps[0]["value"] is True
      and steps[0]["awards"] == "local" and steps[0]["only_with"] == "degree_total",
      "the first step: the flag, on a local degree that holds a degree total")
check(steps[1]["kind"] == "set" and steps[1]["field"] == WORDS and steps[1]["value"] == "CSU or UC transferable units"
      and steps[1]["awards"] == "local" and steps[1]["only_with"] == ["degree_total", "electives_fill_degree"]
      and "45768981024" in steps[1]["read"] and "Reversible" in steps[1]["why"] and "46003456131" in steps[1]["why"],
      "the second step (S742): the page's words, on a local degree that holds a degree total and reads electives as "
      "filling it, citing its page read and the paid read")
pat2 = re.compile(steps[1]["pattern"])
check(pat2.search(PAGE) and not pat2.search(PAGE.replace("CSU or UC transferable units\n", ""))
      and not pat2.search("Complete 60 transferable units\nCalifornia General Education Transfer Curriculum\n"
                          "CSU or UC transferable units") and steps[1]["value"] in pat2.search(PAGE).group(0),
      "its pattern reads 'CSU or UC transferable units' only directly under 'Complete 60 transferable units'")
pat = re.compile(steps[0]["pattern"])
check(pat.search(PAGE) and not pat.search(NO_WORDS) and not pat.search("Complete 34 units of transfer general education")
      and not pat.search("Complete transferable units as needed to reach 60"),
      "the pattern reads 'Complete 60 transferable units' and neither the Cal-GETC line nor Grossmont's sentence")
check("45768981024" in steps[0]["read"] and "Reversible" in steps[0]["why"] and "18637" in steps[0]["why"],
      "the step cites its page read and says what a run leaves as filed")

print("the step on the page's own words")
for cn in FOUR:
    f = filed(cn)
    rec = unflagged(f)
    before = arith(f, rec)
    check(not before["pass"] and before["against"] == "degree" and before["computed"] == [52.0, 52.0]
          and before["stated"] == [60.0, 60.0] and (before.get("major") or {}).get("pass") is True
          and (before["major"] or {}).get("computed") == [18.0, 18.0],
          "%s: as read, the major pools to its 18 and the degree reads 52 against 60" % cn)
    p = rec["program"]
    fills = p["electives_fill_degree"] is True       # 18637's reading (paid read 46003456131), and no other
    check(p["total_units"] == {"min": 18, "max": 18} and p["ge_units"] == {"min": 34, "max": 34}
          and p["degree_total"] == {"min": 60, "max": 60} and fills == (cn == "18637")
          and any("60 transferable units" in n.lower() for n in rec.get("notes") or []),
          "%s: the record holds the page's 18, 34 and 60, its note quotes the 60, and 18637 alone reads electives "
          "as filling it" % cn)
    if fills:
        check(before["why"] == ["the record says electives fill the degree total, but the catalog text names no "
                                "electives"],
              "%s: as read it fails on the electives guard alone" % cn)
    new, notes = recon(rec, PAGE, f["award"], cn)
    got = flags(notes)
    check(len(got) == 1 and got[0]["now"] is True and "Complete 60 transferable units" in got[0]["words"]
          and {n.get("field") for n in notes} == ({FLAG, WORDS} if fills else {FLAG}) and new["blocks"] == rec["blocks"],
          "%s: the step sets the flag, citing the page's words, and moves nothing else (18637 takes the page's "
          "words too)" % cn)
    if fills:
        w = [n for n in notes if n.get("field") == WORDS]
        check(len(w) == 1 and w[0]["now"] == "CSU or UC transferable units" and w[0]["was"] is None
              and new["program"][WORDS] == "CSU or UC transferable units" and new["program"]["electives_fill_degree"],
              "%s: the second step files the page's own words and leaves the reading's flag as read" % cn)
        only_flag = copy.deepcopy(new)
        only_flag["program"].pop(WORDS)
        check(not arith(f, only_flag)["pass"], "%s: with the floor alone it still fails the electives guard" % cn)
    after = arith(f, new)
    check(after["pass"] and after["status"] == "equal" and (after.get("degree") or {}).get("minimum") is True
          and (after.get("degree") or {}).get("fill") == [8.0, 8.0],
          "%s: with the floor today's scorer passes it, eight transferable units filling the 60" % cn)
    check(not flags(recon(new, PAGE, f["award"], cn)[1]), "%s: a record that carries the flag is left alone" % cn)

print("the wrong joins it refuses")
f = filed("18634")
check(not flags(recon(unflagged(f), NO_WORDS, f["award"], "18634")[1]), "a page without the words sets nothing")
check(not flags(recon(unflagged(f), PAGE, "A.A- T Degree", "18634")[1]), "a transfer degree takes nothing")
check(not flags(recon(unflagged(f), PAGE, "Certificate of Achievement requiring 16S/24Q to fewer than 30S/45Q units",
                      "18634")[1]), "a certificate takes nothing")
bare = unflagged(f)
bare["program"]["degree_total"] = {"min": None, "max": None}
check(not flags(recon(bare, PAGE, f["award"], "18634")[1]), "a local degree that holds no degree total takes nothing")
check(not flags(recon(unflagged(f), PAGE, f["award"], "18634", college="Grossmont College")[1]),
      "the step is Cuyamaca's alone: Grossmont's entry sets no floor from the same words")
check(not [n for n in recon(unflagged(f), PAGE, f["award"], "18634")[1] if n.get("field") == WORDS],
      "the second step: a record that leaves electives_fill_degree false takes no words (18634)")
f7 = filed("18637")
ONE_LINE = PAGE.replace("CSU or UC transferable units\n", "")
got7 = recon(unflagged(f7), ONE_LINE, f7["award"], "18637")
check(not [n for n in got7[1] if n.get("field") == WORDS] and not arith(f7, got7[0], ONE_LINE)["pass"],
      "the second step: a page that does not print the line files no words, and 18637 keeps failing there")
check(not [n for n in recon(unflagged(f7), PAGE, "A.A- T Degree", "18637")[1] if n.get("field") == WORDS],
      "the second step: a transfer degree takes nothing")

print("the self-recall over every committed Cuyamaca record")
EVERY = "Requirements\nComplete 60 transferable units\nCSU or UC transferable units\n"
read, flagged, worded, turned_passing, turned_failing, others = 0, [], [], [], [], []
for path in sorted(glob.glob(os.path.join(FOLDER, "*.json"))):
    with open(path, encoding="utf-8") as fh:
        f = json.load(fh)
    if not isinstance(f.get("record"), dict):
        continue
    read += 1
    cn = f["control_number"]
    rec = unflagged(f)
    # The record's own heading opens the text: the electives guard counts a filed sentence from that heading on.
    text = "%s\n%s" % ((rec.get("program") or {}).get("section_heading") or "", EVERY)
    new, notes = recon(rec, text, f.get("award"), cn)
    if flags(notes):
        flagged.append(cn)
    if [n for n in notes if n.get("field") == WORDS]:
        worded.append(cn)
    if [n for n in notes if n.get("field") not in (FLAG, WORDS)]:
        others.append(cn)
    before, after = arith(f, rec, text).get("pass"), arith(f, new, text).get("pass")
    if after and not before:
        turned_passing.append(cn)
    if before and not after:
        turned_failing.append(cn)
check(read >= 180, "the recall read the college's records (%d)" % read)
check(flagged == list(FOUR), "the flag lands on the four University Studies degrees alone: %s" % flagged)
check(worded == ["18637"], "the page's words land on 18637 alone, the one record that reads electives as filling "
      "the degree: %s" % worded)
check(turned_passing == list(FOUR), "each of the four turns passing, and no other record: %s" % turned_passing)
check(not turned_failing and not others,
      "no passing record turns failing, and no other field moves: %s %s" % (turned_failing, others))

print("18637 and the moved-page guard")
f = filed("18637")
with open(os.path.join(ROOT, "kb", "program_requirements_college", "cuyamaca", "sources.json"), encoding="utf-8") as fh:
    src = {str(x.get("control_number")): x for x in json.load(fh)}
now = (src["18637"].get("source") or {}).get("url") or ""
check(("/grossmont/" in f["source_url"] and "/cuyamaca/" in now and f["source_url"] != now)
      or (f["source_url"] == now and "/cuyamaca/" in now),
      "18637's filed record is Grossmont's page while the capture names its Cuyamaca page (or a read of that page "
      "has since filed it)")

print("%d checks, %d failures" % (checks[0], len(failures)))
for m in failures:
    print("FAIL:", m)
sys.exit(1 if failures else 0)
