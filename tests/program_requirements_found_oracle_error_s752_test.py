#!/usr/bin/env python3
"""S752: a confirmed oracle error no longer counts against the college in the found-pages recall.

    python3 tests/program_requirements_found_oracle_error_s752_test.py

Sam, 2026-11-28, 11:24 AM PT (r-found-pages-oracle-error-not-counted-sam-2026-11-28): "Page-finder gate: a confirmed
oracle error (the finder picked the right page and the saved record came from the wrong page) no longer counts against
the college. Re-read those records from the right pages. That frees San Mateo (05745, 10927, 33393) now."

The recall (C.ncl_found_recall, S750) tests the catalog lookup against the page each passing record was read from (the
oracle). COBIx judged each of the 14 wrong answers the free captures counted (kb/found_pages_wrong_verdicts_2026-11-28.json):
3 confirmed oracle errors (San Mateo), 1 confirmed real wrong (Skyline 39394), 5 probable oracle errors, 5 unconfirmed.
Only a confirmed oracle error leaves the count (C.ncl_oracle_errors, C.ncl_recall_tally). It stays tested, so it is
neither right nor wrong and the recall is not raised by it.

  1. THE VERDICTS, read by path: exactly the three San Mateo control numbers, nothing probable or unconfirmed.
  2. THE LIVE S750 NUMBERS (the captures' found_read, handoff 751; San Mateo's own wrongs from capture 46157242032's
     capture_preview.json on claude/s750-found-san-mateo): San Mateo clears (55 tested, 47 right, 0 counted wrong);
     Skyline, Diablo Valley, San Joaquin Delta and Gavilan do not; Coastline and Napa Valley are unchanged.
  3. THE RECALL ITSELF, on a fixture college whose one wrong is a certificate read from its degree's page: confirmed,
     it leaves the count and the college clears; probable, at another college, or with no college named, it counts.
  4. THE OPT-IN: College of San Mateo asks, and only because (2) clears it.

MUTATIONS (run 2026-11-28 on kb/_program_requirements_college.py, one at a time, each restored; each goes red):
  the excusal dropped (ncl_recall_tally counts every wrong): 5.
  a probable verdict excused too (ncl_oracle_errors ignores confidence): 5.
  any verdict at any confidence, wrong_stands included (the verdict test dropped): 6.
  keyed by control number alone (the college ignored): 2.
  an excused wrong counted right: 2.
  an excused wrong dropped from tested: 2.
  ncl_file_found does not pass the college: 1.
Pure stdlib.
"""
import io
import json
import os
import sys
from contextlib import redirect_stdout

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_requirements_college as C  # noqa: E402

FAILS, N = [], [0]
VERDICTS = os.path.join(ROOT, "kb", "found_pages_wrong_verdicts_2026-11-28.json")
CSM = "College of San Mateo"


def check(ok, what):
    N[0] += 1
    print(("ok   " if ok else "FAIL ") + what)
    if not ok:
        FAILS.append(what)


# ── 1. the verdicts ─────────────────────────────────────────────────────────────────────────────
print("1. the committed verdicts, read by path")
with open(VERDICTS, encoding="utf-8") as fh:
    V = json.load(fh)
errs = C.ncl_oracle_errors()
check(C.NCL_ORACLE_VERDICTS == (VERDICTS,) and errs == {CSM: {"05745", "10927", "33393"}},
      "the confirmed oracle errors are San Mateo's three, and nothing else (%s)" % errs)
by_kind = {}
for v in V["verdicts"]:
    by_kind.setdefault((v["verdict"], v["confidence"]), []).append((v["college"], v["control_number"]))
check(len(by_kind[("oracle_error", "probable")]) == 5 and len(by_kind[("unconfirmed", "unconfirmed")]) == 5
      and by_kind[("wrong_stands", "confirmed")] == [("Skyline College", "39394")]
      and not any(cn in errs.get(c, set()) for k, rows in by_kind.items() if k != ("oracle_error", "confirmed")
                  for c, cn in rows),
      "the 5 probable, the 5 unconfirmed and Skyline's confirmed real wrong all still count")
check(C.ncl_oracle_errors([os.path.join(ROOT, "kb", "no_such_verdicts.json")]) == {},
      "a missing verdicts file names no oracle error")

# ── 2. the live S750 numbers, before and after ───────────────────────────────────────────────────
print("2. the live recall of each capture, before and after")
# (tested, right, not_found, the wrong answers' control numbers): each capture's found_read (handoff 751, 15:50Z; the
# verdicts file's _captures names each run). Coastline 46161449846 and Napa Valley 46161456023 from their reasons in
# the opt-in map. San Mateo's three, with both addresses, from capture 46157242032's capture_preview.json.
LIVE = {
    "Skyline College": (42, 35, 6, ["39394"]),
    CSM: (55, 47, 5, ["05745", "10927", "33393"]),
    "Diablo Valley College": (200, 189, 9, ["12908", "12142"]),
    "San Joaquin Delta College": (204, 197, 6, ["22252"]),
    "Gavilan College": (81, 72, 7, ["21292", "30577"]),
    "Coastline Community College": (125, 121, 4, []),
    "Napa Valley College": (88, 82, 6, []),
}
CSM_WRONGS = [
    {"control_number": "05745", "title": "Biology", "award": "A.S. Degree",
     "found": "http://catalog.collegeofsanmateo.edu/current/programs/biology-as.php",
     "read_from": "http://catalog.collegeofsanmateo.edu/current/programs/biology-as-t.php"},
    {"control_number": "10927", "title": "Business Administration", "award": "A.S. Degree",
     "found": "http://catalog.collegeofsanmateo.edu/current/programs/business-administration-as.php",
     "read_from": "http://catalog.collegeofsanmateo.edu/current/programs/business-administration-2-0-as-t.php"},
    {"control_number": "33393", "title": "Music", "award": "A.A- T Degree",
     "found": "http://catalog.collegeofsanmateo.edu/current/programs/music-aa-t.php",
     "read_from": "https://catalog.collegeofsanmateo.edu/current/programs/electronic-music-aa.php"},
]


def tally(college, oracle_errors=None):
    tested, right, not_found, cns = LIVE[college]
    wrongs = CSM_WRONGS if college == CSM else [{"control_number": cn} for cn in cns]
    return C.ncl_recall_tally(tested, right, not_found, 0, wrongs, college, oracle_errors)


before = {c: tally(c, {}) for c in LIVE}
after = {c: tally(c) for c in LIVE}
for c in LIVE:
    b, a = before[c], after[c]
    print("   %-28s before: %3d tested, %3d right, %d wrong, %s | after: %d wrong, %d the oracle's, %s"
          % (c, b["tested"], b["right"], b["wrong"], "clears" if b["clears"] else "off",
             a["wrong"], len(a["oracle_errors"]), "clears" if a["clears"] else "off"))
csm = after[CSM]
check((csm["tested"], csm["right"], csm["wrong"], csm["not_found"], csm["recall"]) == (55, 47, 0, 5, 0.855)
      and csm["clears"] and not before[CSM]["clears"]
      and [w["control_number"] for w in csm["oracle_errors"]] == ["05745", "10927", "33393"] and csm["wrongs"] == [],
      "SAN MATEO CLEARS: 55 tested, 47 right, 0 counted wrong, its three listed as the oracle's error (%s)"
      % {k: csm[k] for k in ("tested", "right", "wrong", "recall", "clears")})
check(bool(csm["oracle_errors"]) and csm["oracle_errors"][0]["found"].endswith("/biology-as.php")
      and csm["oracle_errors"][0]["read_from"].endswith("/biology-as-t.php"),
      "each excused wrong keeps both addresses, so the account says which page the reread takes")
sky = after["Skyline College"]
check(sky["wrong"] == 1 and sky["wrongs"][0]["control_number"] == "39394" and not sky["clears"]
      and not sky["oracle_errors"],
      "SKYLINE DOES NOT: 39394 is a confirmed real wrong and stays counted")
dvc = after["Diablo Valley College"]
check(dvc["wrong"] == 2 and not dvc["clears"] and {w["control_number"] for w in dvc["wrongs"]} == {"12908", "12142"},
      "a probable oracle error still counts: Diablo Valley 12908 (probable) and 12142 (unconfirmed) keep it off")
check(not after["San Joaquin Delta College"]["clears"] and not after["Gavilan College"]["clears"]
      and after["Gavilan College"]["wrong"] == 2,
      "San Joaquin Delta and Gavilan stay off (unconfirmed, probable)")
check(all(after[c] == dict(before[c]) for c in ("Coastline Community College", "Napa Valley College"))
      and all(after[c]["clears"] for c in ("Coastline Community College", "Napa Valley College")),
      "Coastline and Napa Valley are unchanged and still clear")
check(C.ncl_recall_tally(55, 47, 5, 0, CSM_WRONGS, "Skyline College")["wrong"] == 3
      and C.ncl_recall_tally(55, 47, 5, 0, CSM_WRONGS)["wrong"] == 3,
      "the same control numbers at another college, or with no college named, still count")

# ── 3. the recall itself ─────────────────────────────────────────────────────────────────────────
print("3. ncl_found_recall on a fixture college")
FIX = "Fixture College"
YEAR = "2026-2027"
PASS = {"coverage": {"pass": True}, "invented": {"pass": True}, "arithmetic": {"status": "equal"}}
SUBJECTS = ["Accounting", "Anthropology", "Astronomy", "Biology", "Botany", "Chemistry", "Dance", "Economics",
            "Engineering", "Film", "Geography", "Geology", "History", "Humanities", "Journalism", "Kinesiology",
            "Linguistics", "Mathematics", "Music", "Nursing", "Oceanography", "Philosophy", "Photography", "Physics",
            "Psychology", "Sociology", "Statistics", "Theater", "Welding", "Zoology", "Art", "Cosmetology"]


def page(title, kind="as"):
    words = {"as": "Associate in Science Degree Program", "aa": "Associate in Arts Degree Program",
             "ca": "Certificate of Achievement"}[kind]
    heading = "%s %s" % (title, words)
    text = "%s\nRequired Core Courses\n%s 101 Introduction 3\nTotal Required Units 3\n" % (heading, title[:4].upper())
    return {"url": "https://c.edu/programs/%s-%s.php" % (title.lower().replace(" ", "-"), kind), "title": heading,
            "h1": heading, "body": text, "got": {"body": text, "title": heading, "h1": heading}}


def program(cn, title, award="A.S. Degree"):
    return {"control_number": cn, "title": title, "award": award, "shape": "certificate" if "Cert" in award else "local",
            "status": "Active", "closed_list": [{"code": "X 1"}], "load_id": None}


programs, pages, filed = [], [], {}
for i, t in enumerate(SUBJECTS):
    programs.append(program("9%04d" % i, t))
    pages.append(page(t))
    filed["9%04d" % i] = {"record": {}, "score": PASS, "source_url": pages[-1]["url"]}
programs += [program("80001", "Culinary Arts", "A.A. Degree"),
             program("80002", "Culinary Arts", "Certificate of Achievement")]
pages += [page("Culinary Arts", "aa"), page("Culinary Arts", "ca")]
filed["80001"] = {"record": {}, "score": PASS, "source_url": pages[-2]["url"]}
filed["80002"] = {"record": {}, "score": PASS, "source_url": pages[-2]["url"]}   # the oracle: the degree's page
feats = C.ncl_pages(pages, FIX, YEAR)


def recall(*a, **kw):
    return C.ncl_found_recall(programs, feats, filed.get, *a, **kw)


plain = recall()
confirmed = recall(FIX, {FIX: {"80002"}})
check(plain["wrong"] == 1 and not plain["clears"] and plain["oracle_errors"] == []
      and plain == recall(FIX, {}) and plain == recall(FIX),
      "with no verdict, or none for this college, the certificate read from its degree's page counts (%d of %d right)"
      % (plain["right"], plain["tested"]))
check(confirmed["wrong"] == 0 and confirmed["clears"] and confirmed["tested"] == plain["tested"] == 34
      and confirmed["right"] == plain["right"] == 33
      and [w["control_number"] for w in confirmed["oracle_errors"]] == ["80002"]
      and confirmed["oracle_errors"][:1] and confirmed["oracle_errors"][0]["found"].endswith("culinary-arts-ca.php"),
      "a confirmed oracle error leaves the count, stays tested and is not right: 33 of 34, the college clears")
check(not recall("Other College", {FIX: {"80002"}})["clears"] and not recall(None, {FIX: {"80002"}})["clears"],
      "the verdict is keyed by college: another college's, or no college named, excuses nothing")
probable_file = {"verdicts": [{"college": FIX, "control_number": "80002", "verdict": "oracle_error",
                               "confidence": "probable"},
                              {"college": FIX, "control_number": "80002", "verdict": "wrong_stands",
                               "confidence": "confirmed"}]}
tmp = os.path.join(os.environ.get("TMPDIR", "/tmp"), "s752_verdicts_%d.json" % os.getpid())
with open(tmp, "w", encoding="utf-8") as fh:
    json.dump(probable_file, fh)
try:
    from_file = C.ncl_oracle_errors([tmp])
finally:
    os.remove(tmp)
check(from_file == {} and not recall(FIX, from_file)["clears"],
      "a probable oracle error, or a confirmed real wrong, in a verdicts file still counts")
with open(os.path.join(ROOT, "kb", "_program_requirements_college.py"), encoding="utf-8") as fh:
    CODE = fh.read()
step = CODE.split("\ndef ncl_file_found(", 1)[1].split("\ndef ", 1)[0]
check("ncl_found_recall(programs, ncl_pages(pages, college, reg.get(\"catalog_year\")), filed, college)" in step,
      "the capture's step measures with its college named, so the committed verdicts apply to it")
sink = io.StringIO()
with redirect_stdout(sink):
    real = C.ncl_asking
    C.ncl_asking = lambda: {FIX: "the fixture asks"}
    try:
        got = C.ncl_file_found(FIX, [], programs, pages, {}, {"catalog_year": YEAR}, filed.get)
    finally:
        C.ncl_asking = real
check(got["wrong"] == 1 and not got["reads"] and "0 the oracle's confirmed error" in sink.getvalue(),
      "the capture prints how many wrongs were the oracle's confirmed error (%s)" % sink.getvalue().strip()[:160])

# ── 4. the opt-in ────────────────────────────────────────────────────────────────────────────────
print("4. College of San Mateo asks")
asking = C.ncl_asking()
check(CSM in asking and "46157242032" in asking[CSM] and "05745, 10927 and 33393" in asking[CSM]
      and after[CSM]["clears"],
      "San Mateo asks, its reason names the capture and the three confirmed oracle errors, and its live recall "
      "clears under the ruling")
check(all(after[c]["clears"] for c in asking if c in after),
      "no college in the live table asks unless its live recall clears")

print("\n%d checks, %d failed" % (N[0], len(FAILS)))
sys.exit(1 if FAILS else 0)
