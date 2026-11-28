#!/usr/bin/env python3
"""S748: the capture files the catalog lookup's found page as a no-closed-list program's source, where its college
opts in, with its self-recall against an oracle the rule does not see.

    python3 tests/program_requirements_found_pages_s748_test.py

WHY. 1,098 programs at site-read colleges have no course list in the Program Course File. Since S652 the capture
looks each one up in the catalog by title and award and files the answer beside method no_closed_list, with no
source and no text, so nothing ever reads the page: Skyline's capture 45798037585 found the own page of 55 such
programs, and 194 Active programs at 14 colleges have a found page on the filed captures. S652 left the reading
for a later slice.

THE CHANGE (kb/_program_requirements_college.py, kb/_program_requirements_extract.py).
  * ncl_reads_found(college): the college's reconcile entry carries "read_found_pages": true. No entry does today.
  * ncl_found_source(): the found page as a source record, method catalog_lookup, the page's text read with every
    tab, only where the reader's own page checks keep it (RC.site_page: rules B, C and A).
  * ncl_filed(): what capture() files for a looked-up program; with the flag off, the record it filed before.
  * X.sendable(): the extraction's bar. A catalog_lookup source has no listed codes to cover, so it is sent on its
    method; every other source reads as before.

Pinned here:
  1. OFF by default: no reconcile entry carries the key, ncl_reads_found() is false for every filed college, and
     ncl_filed() with the flag off returns the record as S652 filed it.
  2. The fixture, Skyline's Accounting A.S. 05809 as its filed answer names its page: filed with the flag on, with
     the text and the marks a reader of the source needs. Refused, each with its reason: a program that has a
     closed list, an answer that is not found, a page the capture did not read, a page read twice, a
     course-descriptions page (rule B), a heading without the award and a page that prints another title (rule
     A), a page with no text. A refused page leaves the no_closed_list record, with why, and is not sent.
  3. The bar: over every filed source in the repo sendable() equals the bar as it was (a share of at least
     MIN_COVERAGE), and none carries the new method, so no filed capture sends anything else.
  4. THE SELF-RECALL (the S652 review rule). Subjects: every closed-list program whose filed record passes as the
     live table counts it, at every college whose capture searched. Each is looked up as if it had no list, the
     other programs keeping their pages. THE ORACLE IS INDEPENDENT OF THE RULE: the page the passing record was
     read from was chosen by the closed-list search on the share of the state's listed course codes it prints, and
     the record then placed every listed course and added to the printed total. The lookup reads none of that: it
     reads the page's heading, title and address against the program's title and award. Right: the lookup finds
     that page. Wrong: it finds another page. Counted a second time with rule A's heading test on the found page's
     heading lines (what the committed files hold of RC.site_page), and a third time with no page claimed by any
     other program, the harder setting (one wrong there, San Bernardino Valley 22830, named below). Limits, said plainly: the pages are the ones some program was filed on
     (a page no program holds is not committed), and a Coursedog capture's pages do not rebuild offline (Glendale).
     Each capture's own self-test, run on every page it read, is filed in its capture.json.
  5. The fourteen colleges with a found page, their Active programs, and the estimator's price.

MUTATIONS (run in memory 2026-11-28, nothing on disk changed; each goes red):
  the flag dropped (ncl_reads_found always true): section 1, 1 check. The change reverted (ncl_filed files nothing):
  section 2, 2 checks. Rules B, C and A dropped: section 2, 5 checks. The bar as it was (sendable ignores the
  method): 2 checks; the bar dropped (sendable always true): 4 checks. The title match loosened (NCL_OWN 0.5) and
  the award match dropped: section 4's count of right answers, 1,738 and 1,267 against 1,916. Said plainly: those
  two go red on the right count and not on a wrong answer, because the lookup's one-page, one-program rule turns
  every extra match into no answer; the wrong counts stay 0 under both.
Pure stdlib.
"""
import collections
import copy
import glob
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_requirements_college as C  # noqa: E402
import _program_requirements_extract as X  # noqa: E402
import _program_requirements_reconcile as R  # noqa: E402
import _program_requirements_score as S  # noqa: E402
import _program_requirements_wave as W  # noqa: E402
import _reader_page_checks as RC  # noqa: E402

FAILS, N = [], [0]
BASE = os.path.join(ROOT, "kb", "program_requirements_college")
# The recall's figures on 2026-11-28 (17 colleges searched). A later capture moves them a little; wrong stays 0.
TESTED, RIGHT, BAND = 2295, 1916, 150
FOUND_COLLEGES, FOUND_ACTIVE = 14, 194


def check(ok, what):
    N[0] += 1
    print(("ok   " if ok else "FAIL ") + what)
    if not ok:
        FAILS.append(what)


def load(*parts):
    with open(os.path.join(BASE, *parts), encoding="utf-8") as fh:
        return json.load(fh)


FOLDERS = sorted(glob.glob(os.path.join(BASE, "*", "")))

# ── 1. off by default ─────────────────────────────────────────────────────────────────────────────
print("1. off by default")
STEPS = R.load_steps()
# The colleges a reviewed commit may turn on, each by its own entry. None is on at this commit; Skyline is the first
# planned (55 found pages), on a sibling branch, so the test reads it in either state.
MAY_OPT_IN = {"Skyline College"}
opted = {c for c, e in STEPS.items() if isinstance(e, dict) and C.NCL_READ_KEY in e}
check(opted <= MAY_OPT_IN and all(STEPS[c][C.NCL_READ_KEY] is True for c in opted),
      "no college's reconcile entry carries %r but the ones named here, each as true (%s)"
      % (C.NCL_READ_KEY, sorted(opted)))
colleges = []
for folder in FOLDERS:
    try:
        colleges.append(load(os.path.basename(os.path.dirname(folder)), "capture.json").get("college"))
    except (OSError, ValueError):
        pass
check(len(colleges) >= 100 and [c for c in colleges if C.ncl_reads_found(c)] == sorted(opted),
      "ncl_reads_found() is false for each of the %d filed colleges but those (%d on)" % (len(colleges), len(opted)))
check(C.NCL_FOUND_METHOD == X.NO_LIST_METHOD == "catalog_lookup", "the capture and the extraction name one method")

# ── 2. the fixture ────────────────────────────────────────────────────────────────────────────────
print("2. Skyline's Accounting A.S. 05809 on its found page")
SKY = "Skyline College"
src = {s["control_number"]: s for s in load("skyline", "sources.json")}
filed = src["05809"]
ANSWER = filed["catalog_lookup"]
check(filed["method"] == "no_closed_list" and filed["source"] is None and not filed.get("listed")
      and ANSWER["result"] == "found" and ANSWER["page"]["url"].endswith("/programs/accounting-as.php"),
      "the filed capture found 05809's page and filed no source for it")
PROG = {"control_number": "05809", "title": filed["title"], "award": filed["award"], "shape": filed["shape"],
        "status": "Active", "closed_list": [], "load_id": None}
REG = {"catalog_url": "https://catalog.skylinecollege.edu/current/", "catalog_year": "2026-2027",
       "catalog_platform": "custom_html", "catalog_format": "html"}
BODY = ("Accounting Associate in Science Degree Program\nProgram Description\nThe program prepares students for "
        "entry-level accounting work.\nRequired Core Courses\nACTG 121 Financial Accounting 4\nACTG 131 Managerial "
        "Accounting 4\nBUS. 201 Business Law 3\nTotal Required Units 11\n")


def page(url=None, h1=None, title=None, body=BODY):
    pg = ANSWER["page"]
    got = {"body": body, "title": pg["title"] if title is None else title, "h1": pg["h1"] if h1 is None else h1}
    return {"url": url or pg["url"], "title": got["title"], "h1": got["h1"], "body": body, "got": got}


def bare():
    return C.source_record(SKY, PROG, REG, None, "no_closed_list")


rec, why = C.ncl_found_source(SKY, PROG, REG, ANSWER, [page(), page(url=src["30882"]["source"]["url"], h1="Other")])
check(why is None and rec["method"] == "catalog_lookup" and rec["text"] == BODY and rec["closed_list"] == []
      and rec["source"]["url"] == ANSWER["page"]["url"] and rec["source"]["no_closed_list"] is True
      and rec["coverage"] == 0.0 and rec["codes_found"] == [] and rec["catalog_lookup"] == ANSWER
      and rec["title"] == PROG["title"] and rec["source"]["label"] == {"award": 1, "title": 1.0},
      "the found page is filed as the source: method catalog_lookup, its text, no listed codes, the answer kept (%s)"
      % why)
check(X.sendable(rec) and not X.sendable(bare()) and not X.sendable(dict(rec, text=""))
      and not X.sendable(dict(rec, closed_list=[{"code": "ACTG 121"}])),
      "the extraction sends it; a no_closed_list record, one with no text and one with a list are not sent on the "
      "method")
REFUSALS = [
    ("a program that has a closed list", dict(PROG, closed_list=[{"code": "ACTG 121"}]), ANSWER, [page()], "closed list"),
    ("an answer that is not found", PROG, {"result": "not_matched", "why": "x"}, [page()], "found no page"),
    ("a page the capture did not read", PROG, ANSWER, [page(url=src["30882"]["source"]["url"])], "read 0 times"),
    ("a page read twice", PROG, ANSWER, [page(), page()], "read 2 times"),
    ("a course-descriptions page", PROG, ANSWER,
     [page(body="\n".join("ACTG %d Course Title\nUnits: 3\nPrerequisite: none\nDescription of the course."
                          % i for i in range(100, 140)))], "rule B"),
    ("a heading without the award", PROG, ANSWER, [page(h1="Accounting", title="Accounting", body="Accounting\n")],
     "rule A"),
    ("a page that prints another title", dict(PROG, title="Taxation"), ANSWER, [page()], "rule A"),
    ("a page with no text", PROG, ANSWER, [page(body="")], ""),
]
for name, prog, ans, pages, words in REFUSALS:
    got, why = C.ncl_found_source(SKY, prog, REG, ans, pages)
    check(got is None and why and words in why, "refused: %s (%s)" % (name, why))
check(RC.site_page(page(), PROG, BODY, {}, "innerText")[0] is not None
      and RC.site_page(page(h1="Accounting", title="Accounting", body="Accounting\n"), PROG, "Accounting\n", {},
                       "innerText")[0] is None,
      "the refusals are the reader's own page check, RC.site_page, on the same page")

print("   ncl_filed: what capture() files")
before = bare()
off = C.ncl_filed(SKY, copy.deepcopy(before), PROG, REG, ANSWER, [page()], False)
check(off == dict(before, catalog_lookup=ANSWER) and off["method"] == "no_closed_list" and not X.sendable(off),
      "flag off: the record S652 filed, the answer beside method no_closed_list, no source, not sent")
on = C.ncl_filed(SKY, copy.deepcopy(before), PROG, REG, ANSWER, [page()], True)
check(on["method"] == "catalog_lookup" and on["text"] == BODY and X.sendable(on), "flag on: the found page, sent")
held = C.ncl_filed(SKY, copy.deepcopy(before), PROG, REG, ANSWER,
                   [page(h1="Accounting", title="Accounting", body="Accounting\n")], True)
check(held["method"] == "no_closed_list" and held["source"] is None and not X.sendable(held)
      and "rule A" in (held["catalog_lookup"].get("unfiled") or "") and held["catalog_lookup"]["result"] == "found",
      "flag on, a page the rules refuse: the no_closed_list record with why it stays unfiled, not sent")
miss = {"result": "not_matched", "why": C.NCL_NO_PAGE}
check(C.ncl_filed(SKY, copy.deepcopy(before), PROG, REG, miss, [page()], True) == dict(before, catalog_lookup=miss),
      "flag on, no page found: the record as before")

# ── 3. the bar ────────────────────────────────────────────────────────────────────────────────────
print("3. the extraction's bar over every filed source")
sources, differs, new_method = 0, [], []
for folder in FOLDERS:
    slug = os.path.basename(os.path.dirname(folder))
    try:
        rows = load(slug, "sources.json")
    except (OSError, ValueError):
        continue
    for s in rows:
        sources += 1
        if X.sendable(s) != ((s.get("coverage") or 0) >= X.MIN_COVERAGE):
            differs.append((slug, s["control_number"]))
        if s.get("method") == X.NO_LIST_METHOD:
            new_method.append((slug, s["control_number"]))
check(sources > 20000 and not differs and not new_method,
      "sendable() is the bar as it was on each of %d filed sources, and none carries the new method (%s, %s)"
      % (sources, differs[:3], new_method[:3]))

# ── 4. the self-recall ────────────────────────────────────────────────────────────────────────────
print("4. the self-recall: the lookup against the page each passing record was read from")
tot, by_college, wrong, wrong_open, found_at = collections.Counter(), {}, [], [], {}
for folder in FOLDERS:
    slug = os.path.basename(os.path.dirname(folder))
    try:
        cap, srcs = load(slug, "capture.json"), load(slug, "sources.json")
    except (OSError, ValueError):
        continue
    look = cap.get("catalog_lookup") or {}
    if look.get("found_active"):
        found_at[slug] = look["found_active"]
    if not (look.get("self_test") or {}).get("searches"):
        continue
    programs = [{"control_number": s["control_number"], "title": s.get("title"), "award": s.get("award"),
                 "status": s.get("status"), "closed_list": [1] * int(s.get("listed") or 0)} for s in srcs]
    by_cn = {p["control_number"]: p for p in programs}
    by_url = {}
    for s in srcs:
        so = s.get("source") or {}
        if so.get("url"):
            by_url.setdefault(C.page_stem(so["url"]), {"url": so["url"], "title": so.get("title"), "h1": so.get("h1")})
    feats = C.ncl_pages(list(by_url.values()), cap.get("college"), cap.get("catalog_year"))
    own_all = {s["control_number"]: C.page_stem(s["source"]["url"]) for s in srcs if (s.get("source") or {}).get("url")}
    n = collections.Counter()
    for s in srcs:
        cn = s["control_number"]
        path = os.path.join(folder, "records", cn + ".json")
        if not s.get("listed") or not s.get("source") or not os.path.isfile(path):
            continue
        with open(path, encoding="utf-8") as fh:
            r = json.load(fh)
        if not S.passes_live(r.get("score") or {}) or not r.get("source_url"):
            continue
        truth = C.page_stem(r["source_url"])       # the oracle: the page the passing record was read from
        if truth not in by_url:
            n["page_not_filed"] += 1
            continue
        n["tested"] += 1
        prog = dict(by_cn[cn], closed_list=[])
        claims = C.ncl_claims({k: v for k, v in own_all.items() if k != cn}, feats)
        for claimed, bucket, key in ((claims, wrong, ""), ({}, wrong_open, "open_")):
            ans = C.ncl_answer(prog, feats, claimed, programs)
            if ans["result"] != "found":
                n[key + "not_found"] += 1
                continue
            stem = C.page_stem(ans["page"]["url"])
            pg = by_url[stem]
            heads = RC.heading_line([pg.get("h1") or "", (pg.get("title") or "").split("|")[0],
                                     RC._slug_words(pg.get("url"))], prog["title"], prog["award"]) >= 0
            if stem == truth:
                n[key + "right"] += 1
                n[key + "right_rule_a"] += heads
            else:
                n[key + "wrong"] += 1
                n[key + "wrong_rule_a"] += heads
                bucket.append((slug, cn, prog["title"], ans["page"]["url"], r["source_url"]))
    by_college[slug] = n
    tot.update(n)
for slug in sorted(by_college):
    n = by_college[slug]
    if slug in found_at or n["wrong"] or n["open_wrong"]:
        print("   %-24s found %3d | tested %4d: right %4d (rule A keeps %4d), wrong %d, not found %3d | no page "
              "claimed: right %4d, wrong %d" % (slug, found_at.get(slug, 0), n["tested"], n["right"], n["right_rule_a"],
                                                n["wrong"], n["not_found"], n["open_right"], n["open_wrong"]))
for w in (wrong + wrong_open)[:8]:
    print("   wrong: %s %s %r found %s, read from %s" % w)
print("   %d colleges searched; tested %d; right %d (rule A keeps %d), wrong %d, not found %d; with no page claimed: "
      "right %d, wrong %d, not found %d; %d passing records' pages are not among the filed pages"
      % (len(by_college), tot["tested"], tot["right"], tot["right_rule_a"], tot["wrong"], tot["not_found"],
         tot["open_right"], tot["open_wrong"], tot["open_not_found"], tot["page_not_filed"]))
check(len(by_college) >= 15 and abs(tot["tested"] - TESTED) <= BAND,
      "the recall read %d colleges' passing records (%d tested; %d on 2026-11-28)" % (len(by_college), tot["tested"], TESTED))
check(abs(tot["right"] - RIGHT) <= BAND and tot["right"] >= 0.8 * tot["tested"],
      "the lookup finds the page the passing record was read from for %d of %d (%d on 2026-11-28)"
      % (tot["right"], tot["tested"], RIGHT))
check(not wrong, "it finds another program's page for none: %s" % wrong[:3])
# The harder setting, reported: with no page claimed the lookup gives San Bernardino Valley's Hospitality/Culinary Arts
# certificate 22830 the page titled 'Hospitality/Culinary Arts Certificate of Achievement', where its passing record
# was read from the A.A. page's certificate section. In a capture that page is held by two closed-list programs
# (09374, 09375), so it is never given; the count is pinned so a looser match shows here too.
OPEN_WRONG = {("san_bernardino_valley", "22830")}
check({(w[0], w[1]) for w in wrong_open} <= OPEN_WRONG and len(wrong_open) <= 1,
      "with no page claimed by any other program it finds another page for one at most, San Bernardino Valley "
      "22830 (%s)" % [(w[0], w[1]) for w in wrong_open])
check(tot["right_rule_a"] <= tot["right"] and tot["right_rule_a"] >= 0.95 * tot["right"] and not tot["wrong_rule_a"],
      "rule A's heading test keeps %d of the %d right pages and files no wrong one" % (tot["right_rule_a"], tot["right"]))

# ── 5. the colleges ───────────────────────────────────────────────────────────────────────────────
print("5. the colleges with a found page, their Active programs, the estimator's price")
total = 0
for slug, n in sorted(found_at.items(), key=lambda kv: (-kv[1], kv[0])):
    price = W.price(n, W.DEFAULT_COST_PER_PROGRAM, W.parse_limit("40"), True)
    total += n
    print("   %-24s %3d programs, estimate $%.2f (%s)" % (slug, n, price["price_usd"], "go" if price["go"] else "over"))
check(abs(len(found_at) - FOUND_COLLEGES) <= 3 and abs(total - FOUND_ACTIVE) <= 30,
      "%d colleges hold %d Active no-closed-list programs with a found page (%d and %d on 2026-11-28)"
      % (len(found_at), total, FOUND_COLLEGES, FOUND_ACTIVE))

print("\n%d checks, %d failed" % (N[0], len(FAILS)))
sys.exit(1 if FAILS else 0)
