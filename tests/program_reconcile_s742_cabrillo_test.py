#!/usr/bin/env python3
"""S742 (lane 2, cheap piles): Cabrillo's reconcile step for lists the page heads 'Recommended' and counts.

WHY. Four Cabrillo degrees (Dance A.A. 06352, Geology A.S. 06380, Psychology A.A. 06381, Exercise and Sports Science
A.A. 44992) head every list 'Recommended', and the reading filed each list as rule 'recommended', which adds
nothing: each degree read as general education alone, 24 to 33 units under the printed 60, and held through S720 and
S740 because no gap is true of a list the page counts. College page read 46001469210
(kb/college_reads/s742_piles_cabrillo_recommended.json, each page's own content call) prints how the page counts
them, quoted below line for line: under the award's 'Complete the following number of credits: 60' come general
education and each 'Recommended' list with its own 'Complete the following number of credits: N'. The college's
entry (kb/program_requirements_reconcile.json, 'Cabrillo College') carries one new step, kind recommended_counts
(kb/_program_requirements_reconcile.py): a list filed as rule 'recommended' becomes N units to choose where the page
prints that list's name with the very figure the record states, all of the record's recommended lists or none.

Pinned here:
  * the step as written, citing its page read, and the kind described;
  * the step on the page's own lines, the four pages' Program Requirements text committed whole in the page reads'
    plan files (runs 46001469210 and 46013582118): Psychology's four lists, Geology's three, Dance's seven and
    Exercise and Sports Science's three become units to choose at their printed figures, and today's scorer then
    passes each degree at its printed 60; a wrong page, or a list printed at another figure, is refused;
  * the wrong joins it refuses: a page without the lines; a page that prints one list at another figure (all or
    none); a list that states no figure; two lists of one name and figure the page prints once; a record that
    would not add to its printed total with the lists counted (an advisory list on a passing record, 06345); a
    certificate, which the college's steps never read; another college's record;
  * the self-recall over every committed Cabrillo record (the S652 review rule, counting what the step joins as well
    as the verdicts), the four on their committed pages and every other record on a page printing its own lists'
    figures (the most the step could be offered): the step reads the four degrees alone,
    each turns passing, no passing record turns failing, and nothing but the lists' rule and minimum moves;
  * the held answers: every passing Cabrillo record whose 'Recommended' lists the reading already counted, misread
    as these four were and put through the step, passes again (right, wrong counted; wrong must be 0).

A test of the step's logic on committed records and quoted lines. The free reconcile that reads the live pages is the
runner's. Either state of the four records is accepted: as S740 left them, or as that reconcile files them.

Run from repo root: python3 tests/program_reconcile_s742_cabrillo_test.py
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

CAB = "Cabrillo College"
FOLDER = os.path.join(ROOT, "kb", "program_requirements_college", "cabrillo", "records")
STEPS = R.load_steps()
KIND = "recommended_counts"
FOUR = ("06352", "06380", "06381", "44992")
PAGE_READ = "46001469210"
checks, failures = [0], []

# The page read's lines (run 46001469210), Psychology A.A. 06381 and Geology A.S. 06380, the requirements as printed.
PSYCH = """Toggle · Program Requirements · Psychology - Associate in Arts (A.A.) · Complete the following number of credits: 60 · Cabrillo College General Education 24 · Recommended Major Requirements · Complete the following number of credits: 3 · PSYCC1000 - Introduction to Psychology 3 · PSYCH1H - Honors General Psychology 3 · Recommended Major Requirements
Complete the following number of credits: 3-5
PSYCH2A - Statistics for Behavioral Sciences 3
BUS9 - Business Statistics 3 · STATC1000 - Introduction to Statistics 5
Note: students may take only one statistics course. 0
Recommended Major Requirements
Complete the following number of credits: 9-10
PSYCH2B - Research Methods in Psychology 4
PSYCH4 - Introduction to Biological Psychology 3
Recommended Major Electives · Complete the following number of credits: 9
PSYCH31 - Introduction to Abnormal Psychology 3
General electives: any transferable or degree applicable course. 9 - 12
"""
GEOL_HEAD = ("Toggle · Program Requirements · Geology - Associate in Science (A.S.) · Complete the following number of "
             "credits: 60 · Cabrillo College General Education 24 · Recommended Major Requirements · Complete the "
             "following number of credits: 13 · GEOL10 - Physical Geology 4 · GEOL20 - Historical Geology 4 · CHEM1A - "
             "General Chemistry I 5 · Recommended Major Electives · Complete the following number of credits: 8 · "
             "GEOL15 - Environmental Geology 3 · GEOL25 - Geology of National Parks 3\n")


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


def filed(cn):
    with open(os.path.join(FOLDER, cn + ".json"), encoding="utf-8") as fh:
        return json.load(fh)


def named(b):
    return str(b.get("name") or "").lower().startswith("recommended")


def misread(f):
    """The record as the reading filed it: every counted 'Recommended' list back at rule 'recommended'."""
    rec = copy.deepcopy(f["record"])
    every = cn_of(f) in FOUR      # the four: every list was filed so, a sub-list under another name too (Dance)
    for b in rec.get("blocks") or []:
        if (named(b) or every) and b.get("rule") in ("recommended", "choose_units", "choose_courses", "all") \
                and S._span(b.get("stated")) is not None:
            b["rule"], b["minimum"] = "recommended", None
    return rec


def cn_of(f):
    return str(f.get("control_number"))


def fig(span):
    lo, hi = span
    one = lambda v: ("%d" % v) if float(v).is_integer() else ("%g" % v)   # noqa: E731
    return one(lo) if lo == hi else "%s-%s" % (one(lo), one(hi))


def page_of(rec, drop=None, alter=None):
    """A page that prints each 'Recommended' list of the record as Cabrillo prints it: the list's name, then its
    'Complete the following number of credits: N'. drop: a list's place to leave out; alter: {place: figure}."""
    out = ["Program Requirements · %s · Complete the following number of credits: 60" % "The award",
           "Cabrillo College General Education 24"]
    for i, b in enumerate(rec.get("blocks") or []):
        span = S._span(b.get("stated"))
        if span is None or i == drop or not (named(b) or b.get("rule") == "recommended"):
            continue
        out += [str(b.get("name")), "Complete the following number of credits: %s" % ((alter or {}).get(i) or fig(span))]
    return "\n".join(out) + "\n"


def recon(rec, text, award, cn=None, college=CAB):
    return R.reconcile(copy.deepcopy(rec), text, college, award, control_number=cn, steps=STEPS)


def stepped(notes):
    return [n for n in notes if n.get("field") == "blocks" and (n.get("was") or {}).get("rule") == "recommended"]


def arith(f, rec):
    return C.fresh_score(dict(f, record=rec))["arithmetic"]


def rules(rec):
    return [(b.get("rule"), b.get("minimum")) for b in rec.get("blocks") or []]


print("the entry")
entry = STEPS[CAB]
steps = [st for st in entry.get("steps") or [] if st.get("kind") == KIND]
check(len(steps) == 1 and entry.get("awards") == "associate" and PAGE_READ in steps[0].get("why", "")
      and "s742_piles_cabrillo_recommended.json" in steps[0]["why"] and "right 23, wrong 0" in steps[0]["why"],
      "Cabrillo carries one recommended_counts step, on associate degrees, citing its page read and its recall")
pat = re.compile(steps[0]["pattern"])
got = [(" ".join(m.group("name").split()), m.group("min"), m.group("max")) for m in pat.finditer(PSYCH)]
check(got == [("Psychology - Associate in Arts (A.A.)", "60", None),
              ("Recommended Major Requirements", "3", None), ("Recommended Major Requirements", "3", "5"),
              ("Recommended Major Requirements", "9", "10"), ("Recommended Major Electives", "9", None)],
      "the pattern reads the page read's lines for Psychology, each heading with its figure: %r" % got)
check(not pat.search("Below are courses recommended by the department that can be used to meet major requirements"),
      "the page's prose is no list's line")
with open(R.STEPS, encoding="utf-8") as fh:
    check(KIND in json.load(fh)["_kinds"], "the kind is described")
with open(os.path.join(ROOT, "kb", "college_reads", "s742_piles_cabrillo_recommended.json"), encoding="utf-8") as fh:
    urls = [p["url"] for p in json.load(fh)["pages"]]
check(any("psychology-associate-in-arts" in u for u in urls) and any("geology-associate-in-science" in u for u in urls),
      "the page read's plan names the two pages quoted here")

# The four pages' own Program Requirements text, committed whole in the page reads' plan files under their runs
# (the step's reader, MAJOR: a recall built from each record's own lists can never report a wrong page).
PAGES = {}
for _name, _run in (("s742_piles_cabrillo_recommended", "46001469210"),
                    ("s742_piles_cabrillo_recommended_2", "46013582118")):
    with open(os.path.join(ROOT, "kb", "college_reads", _name + ".json"), encoding="utf-8") as fh:
        _plan = json.load(fh)
    for _cn, _text in _plan["_quoted"][_run].items():
        if not _cn.startswith("_"):
            PAGES[_cn] = _text
    for _cn in PAGES:
        pass
check(sorted(PAGES) == sorted(FOUR) and all("Complete the following number of credits: 60" in t for t in PAGES.values())
      and PSYCH.split("\n")[0] in PAGES["06381"] and GEOL_HEAD.strip() in PAGES["06380"],
      "the four degrees' pages are committed as their page reads printed them: %r" % sorted(PAGES))

print("the step on the page's own lines")
for cn, want in (("06381", [3, 3, 9, 9]), ("06380", [13, 8, 9]), ("06352", [3, 3.5, 10.5, 4, 4, 3, 3]),
                 ("44992", [10, 8, 18])):
    f = filed(cn)
    rec = misread(f)
    text = PAGES[cn]
    new, notes = recon(rec, text, f["award"], cn)
    lists = list(new["blocks"])
    check(len(stepped(notes)) == 1 and [b["minimum"] for b in lists] == want
          and all(b["rule"] == "choose_units" for b in lists),
          "%s: every Recommended list reads as units to choose at its printed figure %r: %r" % (cn, want, rules(new)))
    a = arith(f, new)
    check(a["status"] == "equal" and a["against"] == "degree" and S._span({"min": a["stated"][0], "max": a["stated"][1]}) == (60, 60),
          "%s: today's scorer then passes the degree at its printed 60: %r" % (cn, {k: a.get(k) for k in ("status", "computed", "stated")}))
    check(arith(f, rec)["status"] != "equal", "%s: as the reading filed it the degree does not add up" % cn)
    again, more = recon(new, text, f["award"], cn)
    check(not stepped(more) and again == new, "%s: a record already read so is left alone" % cn)
# A page that prints one of the record's lists at another figure refuses the record, on the page's own text.
f = filed("06352")
rec = misread(f)
new, notes = recon(rec, PAGES["06352"].replace("Complete the following number of credits: 10.5",
                                              "Complete the following number of credits: 12"), f["award"], "06352")
check(not stepped(notes), "Dance: its Techniques list printed at 12 where the record states 10.5 moves no list")
new, notes = recon(rec, PAGES["06381"], f["award"], "06352")
check(not stepped(notes), "Dance's record on Psychology's page moves no list (a wrong page is refused)")

print("the wrong joins it refuses")
f = filed("06381")
rec = misread(f)
for name, text in (("a page without the lines", "Psychology - Associate in Arts (A.A.)\nCabrillo College General Education 24\n"),
                   ("a page that prints one list at another figure", page_of(rec, alter={1: "3"})),
                   ("a page that leaves one list out", page_of(rec, drop=3))):
    new, notes = recon(rec, text, f["award"], "06381")
    check(not stepped(notes) and rules(new) == rules(rec), "%s moves no list (all or none)" % name)
g = copy.deepcopy(rec)
g["blocks"][0]["stated"] = {"min": None, "max": None}
new, notes = recon(g, page_of(rec), f["award"], "06381")
check(not stepped(notes) and rules(new) == rules(g), "a list that states no figure leaves the record as read")
g = copy.deepcopy(rec)
g["blocks"][1] = copy.deepcopy(g["blocks"][0])          # two lists of one name and one figure
new, notes = recon(g, page_of(rec), f["award"], "06381")
check(not stepped(notes), "two lists of one name and figure the page prints once are not read")
new, notes = recon(g, page_of(g), f["award"], "06381")
check(not stepped(notes), "printed twice, the page shows them, and the record no longer adds to its 60: left as read")
# The step's reader, MAJOR: a list the page prints a figure for and does not count (an advisory list). Astronomy
# A.S. 06345 passes with one recommended list that states no figure; given a printed figure, counting it would take
# the degree past its total, so the record is left as read.
adv = filed("06345")
if any(b.get("rule") == "recommended" for b in adv["record"]["blocks"]) and arith(adv, adv["record"])["status"] == "equal":
    g = copy.deepcopy(adv["record"])
    for b in g["blocks"]:
        if b.get("rule") == "recommended":
            b["stated"] = {"min": 6, "max": 6}
    new, notes = recon(g, page_of(g), adv["award"], "06345")
    check(not stepped(notes) and rules(new) == rules(g) and arith(adv, new)["status"] == "equal",
          "06345: an advisory list with a printed figure is not counted, and the passing record stays as read")
new, notes = recon(rec, PSYCH, "Certificate of Achievement requiring 16S/24Q to fewer than 30S/45Q units", "06381")
check(not stepped(notes), "a certificate is never read by the college's steps")
new, notes = recon(rec, PSYCH, f["award"], "06381", college="Hartnell College")
check(not stepped(notes), "another college's record takes nothing from Cabrillo's entry")
hold = copy.deepcopy(STEPS)
next(st for st in hold[CAB]["steps"] if st["kind"] == KIND)["hold"] = {"06381": "a test hold"}
new, notes = R.reconcile(copy.deepcopy(rec), PSYCH, CAB, f["award"], control_number="06381", steps=hold)
check(not stepped(notes), "a record the step's hold names is left alone")

print("the self-recall over Cabrillo's committed records")
moved, to_pass, to_fail, other, right, wrong, held = [], [], [], [], 0, [], 0
for path in sorted(glob.glob(os.path.join(FOLDER, "*.json"))):
    with open(path, encoding="utf-8") as fh:
        f = json.load(fh)
    cn = str(f["control_number"])
    rec = f["record"] if cn not in FOUR else misread(f)
    before = arith(f, rec)["status"]
    # The four are read on their own committed pages; every other record on a page that prints its own lists'
    # figures, the most the step could be offered.
    new, notes = recon(rec, PAGES[cn] if cn in FOUR else page_of(rec), f.get("award"), cn)
    if stepped(notes):
        moved.append(cn)
        after = arith(f, new)["status"]
        if before != "equal" and after == "equal":
            to_pass.append(cn)
        if before == "equal" and after != "equal":
            to_fail.append(cn)
        a, b = copy.deepcopy(rec), copy.deepcopy(new)
        for x in (a, b):
            for blk in x["blocks"]:
                blk.pop("rule", None)
                blk.pop("minimum", None)
        if a != b:
            other.append(cn)
    # The held answers: a passing record whose Recommended lists the reading counted, misread and stepped.
    counted = [b for b in f["record"].get("blocks") or [] if named(b) and b.get("rule") != "recommended"
               and S._span(b.get("stated")) is not None]
    if cn in FOUR or not counted or not S.passes_live(f.get("score")) \
            or not R.awards_match("associate", f.get("award")) \
            or any(b.get("rule") == "recommended" for b in f["record"].get("blocks") or []):
        continue
    held += 1
    mis = misread(f)
    new, notes = recon(mis, page_of(mis), f.get("award"), cn)
    if stepped(notes) and arith(f, new)["status"] == "equal":
        right += 1
    else:
        wrong.append(cn)
print("  moved %r; to pass %r; to fail %r; held answers %d: right %d, wrong %r" % (moved, to_pass, to_fail, held, right, wrong))
check(sorted(moved) == sorted(FOUR), "the step reads the four degrees alone: %r" % moved)
check(sorted(to_pass) == sorted(FOUR) and not to_fail, "each turns passing, and no passing record turns failing")
check(not other, "nothing but the lists' rule and minimum moves: %r" % other)
check(held >= 15 and right == held and not wrong,
      "every passing degree whose Recommended lists were counted passes again when misread and stepped (%d of %d)"
      % (right, held))
for cn in ("06345", "09600"):
    f = filed(cn)
    if any(b.get("rule") == "recommended" and S._span(b.get("stated")) is None for b in f["record"]["blocks"]):
        new, notes = recon(f["record"], page_of(f["record"]), f["award"], cn)
        check(not stepped(notes), "%s holds a recommended list with no figure and stays as read" % cn)

print("%d checks, %d failures" % (checks[0], len(failures)))
for m in failures:
    print("FAIL:", m)
sys.exit(1 if failures else 0)
