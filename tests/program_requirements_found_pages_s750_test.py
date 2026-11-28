#!/usr/bin/env python3
"""S750, round 2 of the found-pages change: the three points the S748 second reader held the paid probe on, and the
cause of a free capture that filed nothing.

    python3 tests/program_requirements_found_pages_s750_test.py

S748 (tests/program_requirements_found_pages_s748_test.py) lets a capture file the catalog lookup's found page as the
source of a program the state's Program Course File lists no course for. Its reader said GO WITH and held the paid
probe. This file pins what round 2 changed:

  1. THE REQUEST. The extraction function answered 400 to an empty closed list. Its version 13 reads one beside
     no_closed_list true (tests/extract_closed_list_input.test.js runs the function's check). Here: the runner's
     call() says so for a catalog_lookup source with no courses and for no other source, and a no-list record too
     long for one reply keeps its error, since a read in parts divides a closed list that is not there.
  2. THE SCORER. A record scored against no listed course fails coverage with the gap named (S.NO_LIST_GAP). Every
     live-passing filed record at the twelve colleges, read as the function is told to read a no-list program
     (each course a catalog addition) and scored against an empty list: none passes coverage, though most would
     pass on their arithmetic alone. No filed record is scored against an empty list, so no filed score moves.
  3. THE OPT-IN. The reconcile entry's key only asks. The capture measures the lookup's recall on its own pages
     against answers already held (C.ncl_found_recall, the open setting) and files found pages only where it
     clears the floor (C.ncl_reads_found, C.ncl_file_found).
     HOW THE ORACLE DIFFERS FROM THE RULE. The rule (C.ncl_match) reads a page's heading, title and address
     against the program's title and award. The oracle is the page each passing record was read from: the
     closed-list search took it on the share of the state's listed course codes it prints, and the extraction then
     placed every listed course on it, invented none and added to the printed total. Neither reads what the other
     reads. IT CAN REPORT A WRONG: in the open setting no page is claimed, so every page is a candidate. The
     fixture has one (a certificate read from its degree's page while its own titled page exists), and the filed
     colleges have one, San Bernardino Valley 22830, which keeps that college under the floor's "none wrong".
     Each college's recall is printed and the colleges that clear the floor are named.
  4. ONE PAGE, TWO ADDRESSES. Free capture 46126538324 (Skyline, the key on) filed 0 of 55 found pages. Skyline
     serves each program page as <name>.php and <name>.xml, one page stem, and S748 refused a found page read
     under its stem more than once. The page filed is the one the answer names by its whole address, and the
     capture's account names each unfiled page's reason.

MUTATIONS (run 2026-11-28 on the files, one at a time, each restored; every one goes red, by this many checks):
  the request   the runner never declares no list (declares_no_list always false): 3. It declares for any source
                with no courses (the method test dropped): 2. A no-list record past max_tokens goes to parts (the
                guard dropped; call_in_parts raises on an empty list): 1.
  the scorer    score() passes coverage at zero listed (no_list dropped from cov_ok): 3. It fails coverage and
                names no gap: 3.
  the opt-in    the gate dropped (ncl_reads_found reads the key alone): 5. The key dropped (it reads the recall
                alone): 1. ncl_asks_found always true: 3 here and 1 in the S748 test. ncl_file_found files on the
                key alone, the measurement ignored: 4. The floor dropped to 0: 7. The minimum tested dropped to 0:
                4. A wrong answer allowed (clears ignores wrongs): 5.
  the recall    run with the other programs' pages claimed, as S748's first count was: the fixture's wrong and San
                Bernardino Valley's both vanish: 3. The oracle replaced by the rule's own answer (right whenever
                the lookup finds a page): 5. Any filed record taken as a held answer (a subject need not pass): 3.
  the page      ncl_found_page matches by stem again: 4. ncl_account leaves the filed count and the reasons out: 1.
Pure stdlib.
"""
import collections
import copy
import glob
import io
import json
import os
import sys
from contextlib import redirect_stdout

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_requirements_college as C  # noqa: E402
import _program_requirements_extract as X  # noqa: E402
import _program_requirements_reconcile as R  # noqa: E402
import _program_requirements_score as S  # noqa: E402

FAILS, N = [], [0]
BASE = os.path.join(ROOT, "kb", "program_requirements_college")
# Tonight's twelve colleges (the conductor's list, S750), by folder.
TWELVE = ["skyline", "allan_hancock", "college_of_san_mateo", "diablo_valley", "san_joaquin_delta", "gavilan",
          "glendale_community", "cabrillo", "coastline_community", "feather_river", "napa_valley", "lemoore"]


def check(ok, what):
    N[0] += 1
    print(("ok   " if ok else "FAIL ") + what)
    if not ok:
        FAILS.append(what)


def load(*parts):
    with open(os.path.join(BASE, *parts), encoding="utf-8") as fh:
        return json.load(fh)


def quiet(fn, *args, **kw):
    with redirect_stdout(io.StringIO()):
        return fn(*args, **kw)


# ── 1. the request ────────────────────────────────────────────────────────────────────────
print("1. the runner's request for a program the state lists no course for")
NO_LIST_SRC = {"college": "Skyline College", "control_number": "05809", "title": "Accounting", "award": "A.S. Degree",
               "catalog_year": "2026-2027", "method": X.NO_LIST_METHOD, "closed_list": [],
               "source": {"url": "https://catalog.skylinecollege.edu/current/programs/accounting-as.php"},
               "text": "Accounting Associate in Science Degree Program\nACTG 121 Financial Accounting 4\n"}
LISTED_SRC = dict(NO_LIST_SRC, method="sitemap_page", closed_list=[{"code": "ACTG 121", "title": "Financial Accounting",
                                                                    "units": 4}])
sent = []
real_post = X._post


def fake_post(answer):
    def post(body, key):
        sent.append(body)
        return dict(answer)
    return post


X._post = fake_post({"record": {"blocks": []}, "error": None, "usage": {}, "model": "m"})
try:
    X.call(NO_LIST_SRC, "k")
    X.call(LISTED_SRC, "k")
    X.call(dict(NO_LIST_SRC, method="sitemap_page"), "k")
    check(len(sent) == 3 and sent[0].get("no_closed_list") is True and sent[0]["closed_list"] == [],
          "a catalog_lookup source with no courses is sent with no_closed_list true beside its empty list")
    check("no_closed_list" not in sent[1] and sent[1]["closed_list"] == LISTED_SRC["closed_list"],
          "a source with courses is sent as before, with no declaration")
    check("no_closed_list" not in sent[2] and sent[2]["closed_list"] == [],
          "a source of any other method that lost its courses declares nothing, so the function's 400 stops it")
    check(X.declares_no_list(NO_LIST_SRC) and not X.declares_no_list(LISTED_SRC)
          and not X.declares_no_list(dict(LISTED_SRC, method=X.NO_LIST_METHOD))
          and not X.declares_no_list(dict(NO_LIST_SRC, method="no_closed_list")),
          "declares_no_list: the method and the empty list together, neither alone")
    del sent[:]
    X._post = fake_post({"record": None, "error": "the reply ran past max_tokens", "usage": {}, "model": "m"})
    try:
        long_one = X.call(NO_LIST_SRC, "k")
        crashed = None
    except Exception as exc:                      # the guard dropped: call_in_parts divides an empty list
        long_one, crashed = {}, exc
    check(crashed is None and len(sent) == 1 and "max_tokens" in (long_one.get("error") or "")
          and "part" not in sent[0],
          "a no-list record too long for one reply keeps its error: one call, no part (%s)" % crashed)
    del sent[:]
    parted = X.call(dict(LISTED_SRC, closed_list=[{"code": "ACTG %d" % i} for i in range(121, 125)]), "k")
    check(len(sent) >= 3 and all("part" in b for b in sent[1:]) and parted.get("parts"),
          "a record with courses that runs past max_tokens is still read in parts")
finally:
    X._post = real_post

# ── 2. the scorer ─────────────────────────────────────────────────────────────────────────
print("2. a record scored against no listed course")
REC = {"program": {"total_units": 8, "measure": "units"},
       "blocks": [{"name": "Required Core Courses", "rule": "all", "minimum": None, "option_group": None,
                   "stated": None,
                   "courses": [{"code": "ACTG 121", "units": 4, "catalog_addition": True, "alternatives": []},
                               {"code": "ACTG 131", "units": 4, "catalog_addition": True, "alternatives": []}]}],
       "missing_explained": [], "notes": []}
TEXT = "Required Core Courses\nACTG 121 Financial Accounting 4\nACTG 131 Managerial Accounting 4\nTotal 8 units\n"
none = S.score(copy.deepcopy(REC), [], TEXT)
check(none["coverage"]["listed"] == 0 and none["coverage"]["pass"] is False and none["pass"] is False
      and not S.passes_live(none),
      "zero listed: coverage is false, the record does not pass and does not pass as the live table counts it")
check(none["invented"]["pass"] is True and none["arithmetic"]["status"] == "equal"
      and not none["coverage"]["unexplained"] and not none["coverage"]["none_placed"],
      "every other check passes on that record: coverage alone holds it (it passed at 0 of 0 before)")
gap = none["coverage"].get("no_list") or {}
check(gap.get("gap") == S.NO_LIST_GAP == "no_state_course_list" and "lists no course" in (gap.get("words") or ""),
      "the gap is named in the score: coverage.no_list %r" % gap.get("gap"))
unreadable = S.score(copy.deepcopy(REC), [{"code": ""}, {"code": None}], TEXT)
check(unreadable["coverage"]["pass"] is False and (unreadable["coverage"].get("no_list") or {}).get("gap") == S.NO_LIST_GAP,
      "a closed list whose codes cannot be read is no list either")
LIST = [{"code": "ACTG 121", "units": 4}, {"code": "ACTG 131", "units": 4}]
with_list = S.score({**copy.deepcopy(REC), "blocks": [dict(REC["blocks"][0], courses=[
    dict(c, catalog_addition=False) for c in REC["blocks"][0]["courses"]])]}, LIST, TEXT)
check(with_list["coverage"]["pass"] is True and "no_list" not in with_list["coverage"] and S.passes_live(with_list),
      "the same record against its two listed courses passes, and names no gap")
check(S.places_none(none) is False,
      "a no-list record is not 'places none' (that rule reads a list it was given): the load keeps it, failing")


def as_no_list(record):
    """The record as the function is told to read a program with no list: every course a catalog addition."""
    rec = copy.deepcopy(record)
    for b in rec.get("blocks") or []:
        for c in b.get("courses") or []:
            c["catalog_addition"] = True
            for a in c.get("alternatives") or []:
                if isinstance(a, dict):
                    a["catalog_addition"] = True
    return rec


passing = still = named = filed_zero = filed_all = ARITHMETIC_ALONE = 0
for path in sorted(glob.glob(os.path.join(BASE, "*", "records", "*.json"))):
    slug = path.split(os.sep)[-3]
    if slug not in TWELVE:
        continue
    with open(path, encoding="utf-8") as fh:
        r = json.load(fh)
    sc = r.get("score") or {}
    filed_all += 1
    filed_zero += (sc.get("coverage") or {}).get("listed") == 0
    if not isinstance(r.get("record"), dict) or not S.passes_live(sc):
        continue
    passing += 1
    got = S.score(as_no_list(r["record"]), [], None, r.get("award"))
    still += got["coverage"]["pass"] is True
    named += (got["coverage"].get("no_list") or {}).get("gap") == S.NO_LIST_GAP
    # What held before S750: every check but coverage.
    ARITHMETIC_ALONE += bool(got["invented"]["pass"] and got["arithmetic"]["status"] == "equal")
print("   %d live-passing filed records at the twelve colleges, read as no-list records and scored against an empty "
      "list: %d pass coverage, %d name the gap; %d would pass live on their arithmetic alone"
      % (passing, still, named, ARITHMETIC_ALONE))
check(passing > 1000 and still == 0 and named == passing,
      "none of the %d passes coverage against an empty list, and each names the gap" % passing)
check(ARITHMETIC_ALONE >= 0.8 * passing,
      "the guard is what holds them: %d of %d would pass as the live table counts it without it"
      % (ARITHMETIC_ALONE, passing))
check(filed_all > 1500 and filed_zero == 0,
      "no filed record at the twelve colleges is scored against zero listed courses (%d read), so no filed score moves"
      % filed_all)

# ── the fixture college for sections 3 and 4 ─────────────────────────────────────────────────────
FIX = "Fixture College"
REG = {"catalog_url": "https://c.edu/", "catalog_year": "2026-2027", "catalog_platform": "custom_html",
       "catalog_format": "html"}
PASS = {"coverage": {"pass": True}, "invented": {"pass": True}, "arithmetic": {"status": "equal"}}
FAIL = {"coverage": {"pass": True}, "invented": {"pass": True}, "arithmetic": {"status": "unequal"}}
SUBJECTS = ["Accounting", "Anthropology", "Astronomy", "Biology", "Botany", "Chemistry", "Dance", "Economics",
            "Engineering", "Film", "Geography", "Geology", "History", "Humanities", "Journalism", "Kinesiology",
            "Linguistics", "Mathematics", "Music", "Nursing", "Oceanography", "Philosophy", "Photography", "Physics",
            "Psychology", "Sociology", "Statistics", "Theater", "Welding", "Zoology", "Art", "Automotive Technology",
            "Cosmetology", "Paralegal", "Real Estate", "Surveying"]


def slug(title):
    return title.lower().replace(" ", "-")


def page(title, kind="as", h1=None, body=None, ext=".php"):
    words = {"as": "Associate in Science Degree Program", "aa": "Associate in Arts Degree Program",
             "ca": "Certificate of Achievement"}[kind]
    heading = "%s %s" % (title, words) if h1 is None else h1
    text = "%s\nRequired Core Courses\n%s 101 Introduction 3\nTotal Required Units 3\n" % (heading, title[:4].upper()) \
        if body is None else body
    got = {"body": text, "title": heading, "h1": heading}
    return {"url": "https://c.edu/programs/%s-%s%s" % (slug(title), kind, ext), "title": heading, "h1": heading,
            "body": text, "got": got}


def program(cn, title, award="A.S. Degree", listed=1):
    return {"control_number": cn, "title": title, "award": award, "shape": "certificate" if "Cert" in award else "local",
            "status": "Active", "closed_list": [{"code": "X 1"}] * listed, "load_id": None}


def college(right=36, not_found=0, wrong=False, failing=0, unread=0):
    """A college of closed-list programs with their pages and filed records, and two programs with no list whose
    own pages are among them. right: programs the lookup finds on the page their passing record was read from;
    not_found: programs whose page prints another title; wrong: a certificate read from its degree's page while its
    own titled page exists; failing: programs whose record fails; unread: passing records read from a page the
    capture did not read."""
    programs, pages, filed = [], [], {}
    names = list(SUBJECTS)
    for i in range(right):
        t = names[i]
        programs.append(program("9%04d" % i, t))
        pages.append(page(t))
        filed["9%04d" % i] = {"record": {}, "score": PASS, "source_url": pages[-1]["url"]}
    for i in range(not_found):
        t = "Hidden %s" % names[i]
        # Its page prints a department's heading at an address that names no program: nothing for the lookup to read.
        pg = dict(page(t, h1="Department %d Offerings" % i), url="https://c.edu/programs/dept-%d.php" % i)
        programs.append(program("7%04d" % i, t))
        pages.append(pg)
        filed["7%04d" % i] = {"record": {}, "score": PASS, "source_url": pg["url"]}
    if wrong:
        programs += [program("80001", "Culinary Arts", "A.A. Degree"),
                     program("80002", "Culinary Arts", "Certificate of Achievement")]
        pages += [page("Culinary Arts", "aa"), page("Culinary Arts", "ca")]
        degree = pages[-2]["url"]
        filed["80001"] = {"record": {}, "score": PASS, "source_url": degree}
        filed["80002"] = {"record": {}, "score": PASS, "source_url": degree}   # the oracle: the degree's page
    for i in range(failing):
        t = "Failing %s" % names[i]
        programs.append(program("6%04d" % i, t))
        pages.append(page(t))
        filed["6%04d" % i] = {"record": {}, "score": FAIL, "source_url": pages[-1]["url"]}
    for i in range(unread):
        t = "Unread %s" % names[i]
        programs.append(program("5%04d" % i, t))
        filed["5%04d" % i] = {"record": {}, "score": PASS, "source_url": "https://c.edu/programs/%s-as.php" % slug(t)}
    # Two programs the state lists no course for, each with its own page.
    for cn, t, kind, award in (("10001", "Viticulture", "as", "A.S. Degree"),
                               ("10002", "Enology", "ca", "Certificate of Achievement")):
        programs.append(program(cn, t, award, 0))
        pages.append(page(t, kind))
    return programs, pages, filed


def recall(**kw):
    programs, pages, filed = college(**kw)
    return C.ncl_found_recall(programs, C.ncl_pages(pages, FIX, REG["catalog_year"]), filed.get)


# ── 3. the opt-in is tied to the measured recall ──────────────────────────────────────────────────
print("3. the opt-in: the key asks, the measured recall answers")
check(C.NCL_READ_FLOOR == C.NCL_FLOOR == 0.8 and C.NCL_READ_MIN_TESTED == 30,
      "the floor is the lookup's own (NCL_FLOOR, 0.8) of at least 30 tested, none wrong")
clean = recall()
check((clean["tested"], clean["right"], clean["wrong"], clean["not_found"]) == (36, 36, 0, 0) and clean["clears"]
      and clean["recall"] == 1.0,
      "36 held answers, each found on its own page: tested 36, right 36, the floor cleared (%s)" % clean)
one_wrong = recall(wrong=True)
check(one_wrong["tested"] == 38 and one_wrong["right"] == 37 and one_wrong["wrong"] == 1 and not one_wrong["clears"]
      and one_wrong["wrongs"][0]["control_number"] == "80002"
      and one_wrong["wrongs"][0]["found"].endswith("culinary-arts-ca.php")
      and one_wrong["wrongs"][0]["read_from"].endswith("culinary-arts-aa.php"),
      "THE RECALL REPORTS A WRONG: a certificate whose passing record was read from its degree's page is given its "
      "own titled page; 37 of 38 right is over the floor, and the one wrong answer keeps the read off (%s)"
      % one_wrong["wrongs"])
programs_w, pages_w, filed_w = college(wrong=True)
feats_w = C.ncl_pages(pages_w, FIX, REG["catalog_year"])
own_w = {cn: C.page_stem(r["source_url"]) for cn, r in filed_w.items()}
claimed = C.ncl_claims({k: v for k, v in own_w.items() if k != "80002"}, feats_w)
closed_setting = C.ncl_answer(dict(programs_w[37], closed_list=[]), feats_w, claimed, programs_w)
check(programs_w[37]["control_number"] == "80002" and closed_setting["result"] == "found"
      and closed_setting["page"]["url"].endswith("culinary-arts-ca.php"),
      "the open setting is what counts it: every page is a candidate, none claimed by another program")
low = recall(right=23, not_found=7)
check(low["tested"] == 30 and low["right"] == 23 and low["not_found"] == 7 and low["recall"] == 0.767
      and not low["clears"], "23 of 30 found (76.7%%) is under the floor: %s" % {k: low[k] for k in ("tested", "right")})
at_floor = recall(right=24, not_found=6)
check(at_floor["tested"] == 30 and at_floor["recall"] == 0.8 and at_floor["clears"],
      "24 of 30 (80%) clears it")
few = recall(right=29)
check(few["tested"] == 29 and few["recall"] == 1.0 and not few["clears"],
      "29 tested, all right, is too few to stand behind 'none wrong': under 30 tested the read stays off")
mixed = recall(right=30, failing=5, unread=4)
check(mixed["tested"] == 30 and mixed["right"] == 30 and mixed["not_read"] == 4 and mixed["clears"],
      "only held answers are tested: a failing record is no answer, and a passing record whose page was not read is "
      "counted apart (not_read %d)" % mixed["not_read"])

real_steps = R.load_steps


def with_key(on):
    R.load_steps = lambda *a, **k: {FIX: {"steps": [], C.NCL_READ_KEY: True}} if on else {FIX: {"steps": []}}


def file_found(on, **kw):
    """ncl_file_found on the fixture college: (recs, the measurement, the lookup's answers)."""
    programs, pages, filed = college(**kw)
    feats = C.ncl_pages(pages, FIX, REG["catalog_year"])
    own = {p["control_number"]: C.page_stem(filed[p["control_number"]]["source_url"])
           for p in programs if p["closed_list"]}
    claims = C.ncl_claims(own, feats)
    recs, answers = [], {}
    for p in programs:
        if p["closed_list"]:
            recs.append({"control_number": p["control_number"], "title": p["title"], "award": p["award"],
                         "status": "Active", "method": "sitemap_page", "source": {"url": filed[p["control_number"]]["source_url"]}})
        else:
            recs.append(C.source_record(FIX, p, REG, None, "no_closed_list"))
            answers[p["control_number"]] = C.ncl_answer(p, feats, claims, programs)
    with_key(on)
    try:
        written = []
        got = quiet(C.ncl_file_found, FIX, recs, programs, pages, answers, REG, filed.get, written.append)
    finally:
        R.load_steps = real_steps
    return recs, got, answers, written


def methods(recs):
    return [r["method"] for r in recs if r["control_number"] in ("10001", "10002")]


try:
    with_key(True)
    check(C.ncl_asks_found(FIX) and C.ncl_reads_found(FIX, clean) and not C.ncl_reads_found(FIX, None)
          and not C.ncl_reads_found(FIX, low) and not C.ncl_reads_found(FIX, one_wrong)
          and not C.ncl_reads_found(FIX, few),
          "the key on: read only with a recall that clears (none measured, under the floor, one wrong, too few: off)")
    with_key(False)
    check(not C.ncl_asks_found(FIX) and not C.ncl_reads_found(FIX, clean),
          "the key off: a recall that clears switches nothing on")
finally:
    R.load_steps = real_steps

recs, got, answers, written = file_found(True)
check(all(a["result"] == "found" for a in answers.values()) and methods(recs) == [C.NCL_FOUND_METHOD] * 2
      and got["reads"] is True and got["clears"] and len(written) == 2
      and all(X.sendable(r) and X.declares_no_list(r) for r in recs if r["control_number"] in ("10001", "10002")),
      "the key on and the recall cleared: both found pages are filed as sources, written, sendable, and their "
      "requests declare no list")
for name, kw in (("under the floor", {"right": 23, "not_found": 7}), ("one wrong answer", {"wrong": True}),
                 ("too few tested", {"right": 29})):
    recs, got, answers, written = file_found(True, **kw)
    check(all(a["result"] == "found" for a in answers.values()) and methods(recs) == ["no_closed_list"] * 2
          and got["reads"] is False and not any(X.sendable(r) for r in recs if r["method"] == "no_closed_list")
          and all(r["source"] is None for r in recs if r["method"] == "no_closed_list"),
          "the key on, %s: the lookup still finds both pages and neither is filed (right %d of %d, wrong %d)"
          % (name, got["right"], got["tested"], got["wrong"]))
recs_off, got_off, answers_off, _ = file_found(False)
programs_o, _, _ = college()
bare = [dict(C.source_record(FIX, p, REG, None, "no_closed_list"), catalog_lookup=answers_off[p["control_number"]])
        for p in programs_o if not p["closed_list"]]
check(got_off is None and [r for r in recs_off if r["control_number"] in ("10001", "10002")] == bare,
      "the key off: nothing is measured, and each record is the one S652 filed, the answer beside no_closed_list")

# ── 4. one page, two addresses; and the account says why ───────────────────────────────────────────
print("4. one page under two addresses, and the account's reasons")
src = {s["control_number"]: s for s in load("skyline", "sources.json")}
ANSWER = src["05809"]["catalog_lookup"]
SKY_PROG = {"control_number": "05809", "title": src["05809"]["title"], "award": src["05809"]["award"],
            "shape": src["05809"]["shape"], "status": "Active", "closed_list": [], "load_id": None}
SKY_REG = {"catalog_url": "https://catalog.skylinecollege.edu/current/", "catalog_year": "2026-2027",
           "catalog_platform": "custom_html", "catalog_format": "html"}
PHP = ANSWER["page"]["url"]
XML = PHP[:-len(".php")] + ".xml"
BODY = ("Accounting Associate in Science Degree Program\nRequired Core Courses\nACTG 121 Financial Accounting 4\n"
        "ACTG 131 Managerial Accounting 4\nTotal Required Units 8\n")


def sky_page(url=PHP, body=BODY):
    got = {"body": body, "title": ANSWER["page"]["title"], "h1": ANSWER["page"]["h1"]}
    return {"url": url, "title": got["title"], "h1": got["h1"], "body": body, "got": got}


check(PHP.endswith("/programs/accounting-as.php") and C.page_stem(PHP) == C.page_stem(XML) and PHP != XML,
      "Skyline's accounting-as.php and accounting-as.xml are one page stem, two addresses")
exts = collections.Counter(os.path.splitext((s.get("source") or {}).get("url") or "")[1] for s in src.values()
                           if s.get("source"))
check(exts[".php"] > 30 and exts[".xml"] >= 1,
      "Skyline's filed capture read pages under both: its sources name %d .php pages and %d .xml"
      % (exts[".php"], exts[".xml"]))
both = [sky_page(XML, "<program>Accounting</program>\n"), sky_page(), sky_page(XML[:-4] + "-other.php", "x")]
pg, why = C.ncl_found_page(ANSWER, both)
check(why is None and pg is both[1], "of the two, the page filed is the one the answer names by its whole address")
rec, why = C.ncl_found_source("Skyline College", SKY_PROG, SKY_REG, ANSWER, both)
check(why is None and rec["method"] == C.NCL_FOUND_METHOD and rec["text"] == BODY and rec["source"]["url"] == PHP,
      "so Skyline's found page is filed with the .php page's text, the .xml address beside it (%s)" % why)
check(C.ncl_found_page(ANSWER, [sky_page(XML)]) == (None, "the found page was read 0 times among the capture's pages"),
      "the other address alone is not the page the lookup matched: unfiled")
same, why_same = C.ncl_found_page(ANSWER, [sky_page(), sky_page()])
differ, why_differ = C.ncl_found_page(ANSWER, [sky_page(), sky_page(body=BODY + "Electives\n")])
check(same is not None and why_same is None and differ is None and "read 2 times" in why_differ
      and "different text" in why_differ,
      "one address read twice is one page where both reads gave one text, and unfiled where they differ")

recs, got, answers, _ = file_found(True)
with_key(True)
try:
    acct = C.ncl_account(recs, answers, {"searches": True}, REG["catalog_year"], got)
finally:
    R.load_steps = real_steps
fr = acct.get("found_read") or {}
check(fr.get("filed") == 2 and fr.get("unfiled") == {} and fr.get("reads") is True and fr.get("tested") == 36
      and all(f.get("filed") is True and "unfiled" not in f for f in acct["found_programs"]),
      "the account of a college that reads its found pages: the recall, 2 filed, none unfiled")
recs, got, answers, _ = file_found(True, right=23, not_found=7)
acct_low = C.ncl_account(recs, answers, {"searches": True}, REG["catalog_year"], got)
check(acct_low["found_read"]["filed"] == 0 and acct_low["found_read"]["unfiled"] == {"the recall did not clear the floor": 2}
      and all(f.get("filed") is False and f.get("unfiled") for f in acct_low["found_programs"]),
      "under the floor the account says so for each found page: %s" % acct_low["found_read"]["unfiled"])
# A page the rules refuse and a page not read at its address, in a college that reads: each reason is counted.
programs, pages, filed = college()
pages = [dict(p, body="Viticulture\n", h1="Viticulture", title="Viticulture",
              got={"body": "Viticulture\n", "h1": "Viticulture", "title": "Viticulture"})
         if p["url"].endswith("viticulture-as.php") else p for p in pages]
feats = C.ncl_pages(pages, FIX, REG["catalog_year"])
claims = C.ncl_claims({p["control_number"]: C.page_stem(filed[p["control_number"]]["source_url"])
                       for p in programs if p["closed_list"]}, feats)
recs = [C.source_record(FIX, p, REG, None, "no_closed_list") for p in programs if not p["closed_list"]]
answers = {"10001": {"result": "found", "page": {"url": "https://c.edu/programs/viticulture-as.php"}},
           "10002": {"result": "found", "page": {"url": "https://c.edu/programs/enology-ca.xml"}}}
with_key(True)
try:
    got = quiet(C.ncl_file_found, FIX, recs, programs, pages, answers, REG, filed.get)
    acct_why = C.ncl_account(recs, answers, {"searches": True}, REG["catalog_year"], got)
finally:
    R.load_steps = real_steps
whys = {f["control_number"]: f.get("unfiled") for f in acct_why["found_programs"]}
check(got["reads"] is True and acct_why["found_read"]["filed"] == 0
      and "rule A" in (whys["10001"] or "") and "read 0 times" in (whys["10002"] or "")
      and sum(acct_why["found_read"]["unfiled"].values()) == 2 and len(acct_why["found_read"]["unfiled"]) == 2,
      "a college that reads: a page rule A refuses and a page not read at its address each name their reason (%s)"
      % acct_why["found_read"]["unfiled"])
recs_off, got_off, answers_off, _ = file_found(False)
acct_off = C.ncl_account(recs_off, answers_off, {"searches": True}, REG["catalog_year"], got_off)
check("found_read" not in acct_off and all("filed" not in f and "unfiled" not in f for f in acct_off["found_programs"])
      and acct_off == C.ncl_account(recs_off, answers_off, {"searches": True}, REG["catalog_year"]),
      "a college that does not ask gets the account it always got, key for key")

# ── 5. each college's recall on the filed pages ────────────────────────────────────────────────────
print("5. each college's open-setting recall, on its filed pages and its passing filed records")


def filed_recall(slug_):
    """A college's recall rebuilt from its committed files: the pages are the ones its sources were filed on (a page
    no program holds is not committed, so the capture's own measurement, on every page it read, is the one that
    gates), the answers its passing filed records."""
    cap, srcs = load(slug_, "capture.json"), load(slug_, "sources.json")
    programs = [{"control_number": s["control_number"], "title": s.get("title"), "award": s.get("award"),
                 "status": s.get("status"), "closed_list": [1] * int(s.get("listed") or 0)} for s in srcs]
    by_url = {}
    for s in srcs:
        so = s.get("source") or {}
        if so.get("url"):
            by_url.setdefault(C.page_stem(so["url"]), {"url": so["url"], "title": so.get("title"), "h1": so.get("h1")})
    feats = C.ncl_pages(list(by_url.values()), cap.get("college"), cap.get("catalog_year"))
    got = C.ncl_found_recall(programs, feats, C.ncl_filed_records(os.path.join(BASE, slug_)))
    look = cap.get("catalog_lookup") or {}
    return cap.get("college"), got, look


RECALLS = {}
for folder in sorted(glob.glob(os.path.join(BASE, "*", ""))):
    slug_ = os.path.basename(os.path.dirname(folder))
    try:
        name, got, look = filed_recall(slug_)
    except (OSError, ValueError):
        continue
    if not (look.get("self_test") or {}).get("searches"):
        continue
    RECALLS[slug_] = (name, got, look.get("found_active") or 0)
for slug_, (name, got, found) in sorted(RECALLS.items()):
    if slug_ in TWELVE or found or got["wrong"]:
        print("   %-24s %s found pages %3d | tested %4d: right %4d, wrong %d, not found %3d | recall %s | %s"
              % (slug_, "*" if slug_ in TWELVE else " ", found, got["tested"], got["right"], got["wrong"],
                 got["not_found"], got["recall"], "clears" if got["clears"] else "under the floor"))
tot = collections.Counter()
for _, got, _ in RECALLS.values():
    tot.update({k: got[k] for k in ("tested", "right", "wrong", "not_found")})
print("   %d colleges searched: tested %d, right %d, wrong %d, not found %d (* = tonight's twelve)"
      % (len(RECALLS), tot["tested"], tot["right"], tot["wrong"], tot["not_found"]))
check(len(RECALLS) >= 15 and set(TWELVE) <= set(RECALLS) and tot["tested"] > 2000,
      "the recall read %d colleges, the twelve among them (%d tested)" % (len(RECALLS), tot["tested"]))
wrongs = [(s, w["control_number"]) for s, (_, g, _) in RECALLS.items() for w in g["wrongs"]]
check(0 < len(wrongs) <= 3 and ("san_bernardino_valley", "22830") in wrongs
      and not RECALLS["san_bernardino_valley"][1]["clears"],
      "IT REPORTS A WRONG ON FILED DATA: San Bernardino Valley 22830, given the page titled with its own title and "
      "award where its passing record was read from the A.A. page's certificate section; that college stays off (%s)"
      % wrongs)
clearing = sorted(s for s in TWELVE if RECALLS[s][1]["clears"])
print("   of the twelve, %d clear the floor on their filed pages: %s" % (len(clearing), ", ".join(clearing)))
print("   under it: %s" % ", ".join(s for s in TWELVE if s not in clearing))
glendale = RECALLS["glendale_community"][1]
check(not glendale["clears"] and glendale["recall"] < 0.5,
      "Glendale is under the floor on its filed pages (%d of %d: a Coursedog capture's pages carry no heading in "
      "the committed sources); only a capture's own measurement can switch it on" % (glendale["right"], glendale["tested"]))
check(len(clearing) >= 9 and all(RECALLS[s][1]["wrong"] == 0 for s in TWELVE),
      "%d of the twelve clear it, and none of the twelve has a wrong answer" % len(clearing))

# ── 6. no entry asks without a measurement behind it ─────────────────────────────────────────────────
print("6. the committed opt-ins")
STEPS = R.load_steps()
asking = sorted(c for c, e in STEPS.items() if isinstance(e, dict) and C.NCL_READ_KEY in e)
by_name = {name: (s, got) for s, (name, got, _) in RECALLS.items()}


def measured(college_):
    """Whether a college that asks has a recall behind it: its filed pages clear the floor here, or a capture filed
    for it (capture.json, or a capture-only run's capture_preview.json) measured one that cleared on its own pages."""
    s, got = by_name.get(college_, (None, None))
    if got and got["clears"]:
        return True
    for name in ("capture.json", "capture_preview.json"):
        try:
            fr = (load(s or C.slug_of(college_), name).get("catalog_lookup") or {}).get("found_read") or {}
        except (OSError, ValueError):
            continue
        if (fr.get("clears") is True and fr.get("wrong") == 0 and (fr.get("tested") or 0) >= C.NCL_READ_MIN_TESTED
                and fr.get("floor") == C.NCL_READ_FLOOR and fr["right"] / fr["tested"] >= C.NCL_READ_FLOOR):
            return True
    return False


check(all(STEPS[c][C.NCL_READ_KEY] is True for c in asking) and all(measured(c) for c in asking),
      "every reconcile entry that asks (%s) has a recall that clears the floor behind it" % (asking or "none today"))
check(not measured("Glendale Community College") and measured("Skyline College")
      and not measured("San Bernardino Valley College"),
      "the rule itself: Skyline may ask on its filed pages; Glendale and San Bernardino Valley may not, until a "
      "capture's own measurement clears")

# ── 7. capture() runs the step ────────────────────────────────────────────────────────────────
print("7. capture() files found pages through the measured step alone")
with open(os.path.join(ROOT, "kb", "_program_requirements_college.py"), encoding="utf-8") as fh:
    CODE = fh.read()
cap_body = CODE.split("\ndef capture(", 1)[1].split("\ndef ", 1)[0]
check(cap_body.count("ncl_file_found(") == 1 and "ncl_filed(" not in cap_body and "ncl_found_source(" not in cap_body
      and "ncl_account(recs, answers, test, reg.get(\"catalog_year\"), found_read)" in cap_body,
      "capture() calls ncl_file_found once, files no found page any other way, and hands its measurement to the "
      "account")
step = CODE.split("\ndef ncl_file_found(", 1)[1].split("\ndef ", 1)[0]
check("ncl_asks_found(college)" in step and "ncl_found_recall(" in step and "ncl_reads_found(college, found_read)" in step
      and step.index("found_read = ncl_found_recall(") < step.index("= ncl_filed(college"),
      "ncl_file_found asks, measures, then files")

print("\n%d checks, %d failed" % (N[0], len(FAILS)))
sys.exit(1 if FAILS else 0)
