#!/usr/bin/env python3
"""A wave of the program requirements harvest reads several colleges at once and
files them once (S644; kb/_program_requirements_wave.py,
.github/workflows/program-requirements-wave.yml).

WHY. A wave can spend model calls at up to eight colleges in one dispatch, and its
one table is what the conductor reads before any reread. The ways it goes wrong
are known in advance:

  * Two colleges on one catalog host break the standing rule (never two reads on
    one host); eLumen and Coursedog colleges share the vendor's host too.
  * A limit above Sam's standing $40 a college, or a price over the limit, spends
    without a card.
  * A capture that met HTTP 503s files a partial read as complete (Rio Hondo's
    reconcile read 34 of 328 pages and said nothing, S640).
  * A verify that restates the scorer drifts from it, and a table that sums the
    wrong cost (summary.json's cost_usd counts older runs) misleads the reader.

Each is pinned against the module's OWN functions on fixtures, with no browser
and no network. Run from repo root: python3 tests/program_requirements_wave_test.py
"""
import json
import os
import shutil
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_requirements_wave as W  # noqa: E402
import _program_requirements_college as C  # noqa: E402
import _program_requirements_score as S  # noqa: E402

failures = []
checks = [0]


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


def refused(fn, *a):
    try:
        fn(*a)
    except W.Refused as exc:
        return str(exc)
    return None


check(not {"playwright", "pypdf", "pdfminer"} & set(sys.modules),
      "importing the wave pulled in a runner-only dependency")

# ── plan: names, the cap, the limit, the branch ─────────────────────────────
check(W.parse_colleges(" Cerritos College, Mt. San Antonio College ,,") == ["Cerritos College", "Mt. San Antonio College"],
      "the colleges split on commas, trimmed, empties dropped")
eight = ",".join("College %d" % i for i in range(8))
check(len(W.parse_colleges(eight)) == 8, "eight colleges are a wave")
check("at most 8" in (refused(W.parse_colleges, eight + ",College 9") or ""), "a ninth college is refused")
check("named twice" in (refused(W.parse_colleges, "Cerritos College, cerritos college") or ""),
      "a college named twice is refused, whatever its letter case")
check(refused(W.parse_colleges, " , ") is not None, "a wave naming no college is refused")
check(W.parse_limit("40") == 40.0 and W.parse_limit("12.5") == 12.5, "a limit at or under $40 stands")
check("standing limit" in (refused(W.parse_limit, "40.01") or ""), "a limit above $40 is refused")
check(all(refused(W.parse_limit, v) for v in ("0", "-5", "abc", "nan", "inf")),
      "a limit of zero, below zero, not a number or infinite is refused")
check(W.parse_extract("0") is False and W.parse_extract("1") is True and refused(W.parse_extract, "yes"),
      "extract is 0 or 1 and nothing else")
check(W.check_branch("s644a", "claude/harvest-wave-s644a") is None, "the wave runs on its own branch")
check("never runs on main" in (refused(W.check_branch, "s644a", "main") or ""), "the wave refuses main")
check("this dispatch ran on" in (refused(W.check_branch, "s644a", "claude/harvest-cerritos") or ""),
      "the wave refuses a branch that is not claude/harvest-wave-<wave>")
check(refused(W.check_branch, "S644 A", "claude/harvest-wave-S644 A"), "a wave name with capitals or spaces is refused")

# ── plan: hosts ─────────────────────────────────────────────────────────────
REG = {
    "A College": {"college": "A College", "catalog_url": "https://catalog.a.edu/", "catalog_platform": "courseleaf"},
    "B College": {"college": "B College", "catalog_url": "https://www.catalog.a.edu/programs/", "catalog_platform": "courseleaf"},
    "C College": {"college": "C College", "catalog_url": "https://c.elumenapp.com/catalog/c/", "catalog_platform": "elumen"},
    "D College": {"college": "D College", "catalog_url": "https://d.elumenapp.com/catalog/d/", "catalog_platform": "elumen"},
    "E College": {"college": "E College", "catalog_url": "https://www.e.edu/catalog", "catalog_platform": "custom_html",
                  "procedure": {"catalog": {"start": "https://www.e.edu/catalog", "follow": "Full catalog",
                                            "format": "pdf"}}},
    "F College": {"college": "F College", "catalog_url": "https://f.edu/", "catalog_platform": "custom_html",
                  "procedure": {"catalog": {"start": "https://f.edu/", "file": "https://docs.shared-cms.com/f.pdf",
                                            "format": "pdf"}}},
    "G College": {"college": "G College", "catalog_url": "https://g.edu/", "catalog_platform": "acalog"},
    "H College": {"college": "H College", "catalog_url": "https://h.edu/", "catalog_platform": "acalog"},
}
REG["G College"]["procedure"] = {"catalog": {"start": "https://g.edu/", "file": "https://docs.shared-cms.com/g.pdf",
                                             "format": "pdf"}}
hosts = {n: W.hosts_of(r) for n, r in REG.items()}
check(hosts["A College"] == hosts["B College"] == ["catalog.a.edu"], "www. is the same host: %r" % hosts["B College"])
check("api-prod.elumenapp.com" in hosts["C College"] and "api-prod.elumenapp.com" in hosts["D College"],
      "an eLumen college reads the vendor's publish host")
check("docs.shared-cms.com" in hosts["F College"], "a procedure step's named file is a host the capture reads")
check(W.hosts_of({}, {"copy_url": "https://losrios.edu/arc.pdf"}) == ["losrios.edu"]
      and W.hosts_of({}, {"file": "x.pdf.gz"}, True) == [],
      "a hand-filed copy reads only its copy_url's host, and none when the file sits beside its record")
m = W.plan_wave(["A College", "C College", "E College"], REG, hosts)
check([x["college"] for x in m] == ["A College", "C College", "E College"]
      and [x["slug"] for x in m] == [C.slug_of(n) for n in ("A College", "C College", "E College")],
      "three colleges on three hosts plan, each with its folder's slug")
why = refused(W.plan_wave, ["A College", "B College"], REG, hosts) or ""
check("two reads on one host" in why and "catalog.a.edu" in why, "two colleges on one catalog host are refused: %s" % why)
check("api-prod.elumenapp.com" in (refused(W.plan_wave, ["C College", "D College"], REG, hosts) or ""),
      "two eLumen colleges are refused: both read the vendor's host")
check("docs.shared-cms.com" in (refused(W.plan_wave, ["F College", "G College"], REG, hosts) or ""),
      "two colleges whose catalog files sit on one host are refused")
check("not in program_source_registry: Nowhere College" in
      (refused(W.plan_wave, ["A College", "Nowhere College"], dict(REG, **{"Nowhere College": {}}), hosts) or ""),
      "a name the registry does not hold is refused")

# ── price: the gate at the limit and above it ───────────────────────────────
def recs_at(n, cost, **extra):
    return {"%03d" % i: dict({"cost_usd": cost}, **extra) for i in range(n)}


# Review finding 3: summary.json's rate divides by every record, so calls with no price count as
# programs at $0 and the gate passes a college whose real cost is above $40. Second read: every record
# with a positive cost counts, errored or not, and the rate is never below 0.08.
diluted = dict(recs_at(100, 0.12), **{"e%03d" % i: {"cost_usd": 0, "error": "HTTP 502"} for i in range(200)})
diluted.update({"u%03d" % i: {"cost_usd": None} for i in range(50)})
check(W.cost_per_program(diluted)[0] == 0.12,
      "the rate counts only records with a positive cost: calls with no price are no programs at $0")
check(W.cost_per_program(recs_at(19, 0.5))[0] == 0.5 and W.cost_per_program(recs_at(1, 0.5))[0] == 0.5
      and W.cost_per_program(recs_at(1, 0.01))[0] == 0.08,
      "a small sample can raise the rate and never lower it: 19 records at $0.50 price at $0.50")
check(W.cost_per_program(recs_at(300, 0.03))[0] == 0.08 and W.cost_per_program({})[0] == 0.08,
      "the rate is never below the 0.08 default, and no records price at it")
check(W.cost_per_program(dict(recs_at(30, 0.1), **{"x%d" % i: {"cost_usd": 9.0, "error": "timeout"}
                                                     for i in range(5)}))[0] == round(48 / 35, 4),
      "an errored call with a cost was paid for: five errored records at $9 count")
WHOLE = {"listed": 100, "answered": 100, "partial": False}
at = W.price(400, 0.08, 40.0, True, WHOLE)       # 400 x 0.08 x 1.25 = 40.00
check(at["price_usd"] == 40.0 and at["within_limit"] and at["go"], "a price exactly at the limit extracts: %r" % at)
over = W.price(401, 0.08, 40.0, True, WHOLE)     # 40.10
check(over["price_usd"] == 40.1 and not over["within_limit"] and not over["go"] and "over the limit" in over["why"],
      "a price a cent over the limit does not extract: %r" % over)
check(W.price(100, 0.1, 10.0, True, WHOLE)["price_usd"] == 12.5 and not W.price(100, 0.1, 10.0, True, WHOLE)["go"],
      "the 25% margin is in the price the gate reads")
check(not W.price(10, 0.08, 40.0, False, WHOLE)["go"], "extract 0 never extracts")
check(not W.price(0, 0.08, 40.0, True, WHOLE)["go"], "nothing to extract: no extraction step")
check(not W.price(10, 0.08, 40.0, True, {"partial": True, "why": "34 of 328 pages answered"})["go"],
      "a partial capture is never sent to the model")

# ── the capture's page account ──────────────────────────────────────────────
check(C.pages_account({"pages_read": 34}, "courseleaf", 328) == (328, 34, 0), "the page queue is what a capture listed")
check(C.pages_account({"pages_read": 34, "curriqunet": {"entries_read": 328}}, "curriqunet", 0) == (328, 34, 0),
      "a curriQunet capture lists its entries")
check(C.pages_account({"pages_read": 9, "elumen": {"program_pages_listed": 10}}, "elumen", 0) == (10, 9, 0)
      and C.pages_account({"pages_read": 3, "coursedog": {"catalog": [1, 2, 3, 4]}}, "coursedog", 0) == (4, 3, 0),
      "eLumen's publish slugs and Coursedog's program search are what those captures listed")


def share_of(report, platform, queue_len):
    listed, answered, _ = C.pages_account(report, platform, queue_len)
    return W.pages_share({"pages_listed": listed, "pages_answered": answered})


# Review finding 4: a listing call that failed lost pages no count of answers sees. Each reader, with
# every page it did list answering, must still read as partial.
check(C.failed_calls(["u1: HTTP 503", "u2: ECONNRESET (tried again)", "u3: HTTP 404", "u4: timeout",
                      "u5: robots disallows"]) == 3,
      "a failed call is final: a retry note is not one, and a 404 is the host's answer")
check(share_of({"pages_read": 20, "listing_failed": 3, "sitemap": {}}, "courseleaf", 20)["partial"],
      "sitemap readers: a nested sitemap or index that failed holds the capture though every listed page answered")
check(share_of({"pages_read": 20, "curriqunet": {"entries_read": 20, "failed_calls": 3}}, "curriqunet", 0)["partial"]
      and not share_of({"pages_read": 19, "curriqunet": {"entries_read": 20, "failed_calls": 1}}, "curriqunet", 0)["partial"]
      and C.pages_account({"pages_read": 17, "curriqunet": {"entries_read": 20, "failed_calls": 3}}, "curriqunet", 0)
      == (20, 17, 0),
      "curriQunet: index and child calls that failed count; a failed page call is counted once, as unanswered")
check(share_of({"pages_read": 20, "elumen": {"program_pages_listed": 20, "listing_failed": 4}}, "elumen", 0)["partial"]
      and share_of({"pages_read": 20, "elumen": {"listing_failed": 4}}, "elumen", 20)["partial"],
      "eLumen, publish and rendered: a menu, department or hub call that failed holds the capture")
check(share_of({"pages_read": 20, "acalog": {"listing_failed": 3}}, "acalog", 20)["partial"],
      "Acalog: a site map or menu page that failed holds the capture")
check(share_of({"pages_read": 120, "coursedog": {"listed": 191, "catalog": [0] * 120}}, "coursedog", 0)["partial"]
      and share_of({"pages_read": 120, "coursedog": {"catalog": [0] * 120, "errors": ["skip 120: HTTP 503"] * 20}},
                   "coursedog", 0)["partial"],
      "Coursedog: the search's own total, and a search page that failed, count as listed")
check(share_of({"pages_read": 0}, "courseleaf", 0)["partial"], "a capture that listed nothing is held")


class _Resp:
    def __init__(self, status, text=""):
        self.status, self.ok, self._t = status, 200 <= status < 300, text

    def text(self):
        return self._t


class _Req:
    def __init__(self, answers):
        self.answers = answers

    def get(self, url, timeout=None):
        return self.answers[url]


class _Reader:
    def __init__(self, answers):
        self.request, self.delay, self.loads = _Req(answers), 0, 0

    def _robots_for(self, url):
        return None


IDX = ('<?xml version="1.0"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
       '<sitemap><loc>https://cat.x.edu/a.xml</loc></sitemap><sitemap><loc>https://cat.x.edu/b.xml</loc></sitemap>'
       '<sitemap><loc>https://cat.x.edu/c.xml</loc></sitemap></sitemapindex>')
PAGES = ('<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
         '<url><loc>https://cat.x.edu/programs/art-aa/</loc></url></urlset>')
sm = C.read_sitemap(_Reader({"https://cat.x.edu/sitemap.xml": _Resp(200, IDX), "https://cat.x.edu/a.xml": _Resp(200, PAGES),
                             "https://cat.x.edu/b.xml": _Resp(503), "https://cat.x.edu/c.xml": _Resp(404)}),
                    "https://cat.x.edu/")
check(sm["pages"] == ["https://cat.x.edu/programs/art-aa/"] and sm.get("failed") == ["https://cat.x.edu/b.xml: HTTP 503"],
      "a nested sitemap answering 503 is recorded as failed; one answering 404 is gone: %r" % sm.get("failed"))
_load, _P = C.P.load, C.P
try:
    _answers = {"https://cat.x.edu/": {"access": "ok", "status": 200, "links": [
        {"text": "Degrees and Certificates", "href": "https://cat.x.edu/degrees/"},
        {"text": "Programs of Study", "href": "https://cat.x.edu/programs/"}]},
        "https://cat.x.edu/degrees/": {"access": "http_error", "status": 503, "links": []},
        "https://cat.x.edu/programs/": {"access": "ok", "status": 200, "links": []}}
    C.P.load = lambda reader, url, cache, *a, **k: _answers.get(url, {"access": "http_error", "status": 404})
    _failed: list = []
    C.index_links(None, "https://cat.x.edu/", {}, _failed)
    check(_failed == ["https://cat.x.edu/degrees/"], "an index page answering 503 is recorded as failed: %r" % _failed)
finally:
    C.P.load = _load
check(C.load_failed({"access": "http_error", "status": 503}) and not C.load_failed({"access": "ok"})
      and not C.load_failed({"access": "http_error", "status": 404}),
      "a listing page failed unless it answered, or the host said it is gone")
check(W.pages_share({"pages_listed": 328, "pages_answered": 34})["partial"]
      and not W.pages_share({"pages_listed": 100, "pages_answered": 90})["partial"]
      and W.pages_share({"pages_listed": 100, "pages_answered": 89})["partial"],
      "90% of the listed pages answered is whole, 89% is partial")
check(W.pages_share({})["partial"] and W.pages_share({"pages_listed": 0, "pages_answered": 0})["partial"],
      "a capture that counted no pages, or listed none, is held")


# ── verify: each verdict on fixtures ────────────────────────────────────────
def score(passes, share=1.0):
    return {"pass": passes, "coverage": {"pass": passes, "share": share, "listed": 10, "placed": int(share * 10)},
            "invented": {"pass": True}, "arithmetic": {"status": "equal" if passes else "unequal"}}


check(S.passes_live(score(True)) and not S.passes_live(score(False)), "the fixture's scores read as the scorer reads them")


def folder(base, recs, kept=None):
    """A college folder, or a run's out/ folder: records/, and kept_passing_0.json as extract() writes it."""
    os.makedirs(os.path.join(base, "records"), exist_ok=True)
    for cn, rec in recs.items():
        with open(os.path.join(base, "records", cn + ".json"), "w") as fh:
            json.dump(dict(rec, control_number=cn), fh)
    if kept:
        with open(os.path.join(base, "kept_passing_0.json"), "w") as fh:
            json.dump(kept, fh)
    return base


tmp = tempfile.mkdtemp()
try:
    MAIN = {"01": {"score": score(True), "extracted_run": "1"}, "02": {"score": score(False), "extracted_run": "1"},
            "03": {"score": score(True, 0.9), "extracted_run": "1"}}
    base = folder(os.path.join(tmp, "base"), MAIN)
    CAP = {"pages_listed": 50, "pages_answered": 50}
    PRICED = {"would_extract": 3, "price_usd": 0.3, "extract_asked": True, "within_limit": True, "why": "within"}
    OK = {"capture": "success", "extract": "success", "file": "success"}
    RUN = "99"
    # ready: 02 fails to pass, a new record 04, 01 kept by kept_passing, 03 moved with no model call.
    run = folder(os.path.join(tmp, "ready"), {
        "01": {"score": score(True), "extracted_run": "1"},
        "02": {"score": score(True), "extracted_run": RUN, "model": "m", "cost_usd": 0.06},
        "03": {"score": score(True, 0.9), "extracted_run": RUN, "read_run": "1", "cost_usd": 0.05},
        "04": {"score": score(False), "extracted_run": RUN, "model": "m", "cost_usd": 0.07}},
        kept=[{"control_number": "01", "cost_usd": 0.04}])
    v = W.verify("X College", run, base, CAP, PRICED, RUN, OK, out_dir=run)
    check(v["verdict"] == "ready", "a run with no pass to fail and no lost coverage is ready: %r" % v["verdict"])
    check((v["fail_to_pass"], v["pass_to_fail"], v["lost_coverage"], v["kept"], v["new"]) == (1, 0, 0, 1, 1),
          "fail to pass, pass to fail, lost coverage, kept, new: %r" % [v[k] for k in
                                                                       ("fail_to_pass", "pass_to_fail", "lost_coverage", "kept", "new")])
    check(v["extracted"] == 2 and v["cost_usd"] == 0.17,
          "the run's cost is its fresh records plus kept_passing, never a moved record's old cost: %r" % [v["extracted"], v["cost_usd"]])
    # Review finding 2: the file step stopped, so the college's folder still holds main's records; the
    # cost is read from the run's out/ folder, which the extraction wrote call by call.
    v = W.verify("X College", base, base, CAP, PRICED, RUN, {"capture": "success", "extract": "success", "file": "failure"},
                 out_dir=run)
    check(v["verdict"] == "failed: file" and v["cost_usd"] == 0.17 and v["extracted"] == 2 and v["kept"] == 1,
          "a file step that did not finish still reports what the model calls cost: %r" % [v["cost_usd"], v["extracted"]])
    # pass to fail: 01 now fails, 03 is absent.
    run = folder(os.path.join(tmp, "p2f"), {"01": {"score": score(False), "extracted_run": RUN, "model": "m"},
                                            "02": {"score": score(False), "extracted_run": "1"}})
    v = W.verify("X College", run, base, CAP, PRICED, RUN, OK)
    check(v["pass_to_fail"] == 2 and v["verdict"] == "held: 2 pass to fail, 0 lost coverage"
          and {d["why"] for d in v["detail"]["pass_to_fail"]} == {"fails", "absent"},
          "a passing record that fails, or that the run no longer files, holds the college: %r" % v["verdict"])
    # lost coverage: 03 still passes at a smaller share.
    run = folder(os.path.join(tmp, "lost"), dict(MAIN, **{"03": {"score": score(True, 0.8), "extracted_run": RUN,
                                                                  "model": "m"}}))
    v = W.verify("X College", run, base, CAP, PRICED, RUN, OK)
    check(v["lost_coverage"] == 1 and v["pass_to_fail"] == 0 and v["verdict"] == "held: 0 pass to fail, 1 lost coverage",
          "a passing record placing a smaller share holds the college: %r" % v["verdict"])
    # partial capture: held before anything else is read.
    run = folder(os.path.join(tmp, "same"), MAIN)
    v = W.verify("X College", run, base, {"pages_listed": 328, "pages_answered": 34}, PRICED, RUN, OK)
    check(v["verdict"] == "held: partial capture (34 of 328 pages answered)", "a partial capture is held: %r" % v["verdict"])
    # capture only, over the limit, failed.
    v = W.verify("X College", run, base, CAP, dict(PRICED, extract_asked=False), RUN,
                 {"capture": "success", "extract": "skipped", "file": "success"})
    check(v["verdict"] == "captured" and v["extracted"] == 0 and v["cost_usd"] == 0,
          "a capture-only run is captured, at no cost: %r" % v["verdict"])
    v = W.verify("X College", run, base, CAP, dict(PRICED, within_limit=False), RUN,
                 {"capture": "success", "extract": "skipped", "file": "success"})
    check(v["verdict"] == "held: price over the limit", "a price over the limit is held: %r" % v["verdict"])
    v = W.verify("X College", run, base, None, None, RUN, {"capture": "failure", "extract": "skipped", "file": "skipped"})
    check(v["verdict"] == "failed: capture", "a failed capture is failed: %r" % v["verdict"])
    v = W.verify("X College", run, None, CAP, PRICED, RUN, {"capture": "success", "extract": "failure", "file": "success"})
    check(v["verdict"] == "failed: extract" and v["new"] == 3, "a stopped extraction is failed; main filing none makes every record new")

    # ── file: one table, the folders copied, the sums ───────────────────────
    root = os.path.join(tmp, "repo")
    os.makedirs(os.path.join(root, "kb", "hand_filed_catalogs"))
    folder(os.path.join(root, "kb", "program_requirements_college", "x"), {"stale": {"score": score(True)}})
    arts = os.path.join(tmp, "arts")
    rows = {"x": dict(W.verify("X College", os.path.join(tmp, "ready"), base, CAP, PRICED, RUN, OK,
                               out_dir=os.path.join(tmp, "ready")), price_usd=0.3),
            "y": dict(W.verify("Y College", os.path.join(tmp, "p2f"), base, CAP, PRICED, RUN, OK), price_usd=1.25),
            "z": dict(W.verify("Z College", run, base, CAP, PRICED, RUN,
                               {"capture": "success", "extract": "failure", "file": "failure"}), cost_usd=0.5)}
    for slug, row in rows.items():
        art = os.path.join(arts, W.artifact_name(RUN, slug, 1))
        os.makedirs(os.path.join(art, "wave_out"))
        with open(os.path.join(art, "wave_out", slug + ".wave.json"), "w") as fh:
            json.dump(row, fh)
        shutil.copytree(os.path.join(tmp, "ready"), os.path.join(art, "kb", "program_requirements_college", slug))
    matrix = [{"college": "X College", "slug": "x", "hosts": ["x.edu"]}, {"college": "Y College", "slug": "y", "hosts": []},
              {"college": "Z College", "slug": "z", "hosts": []}, {"college": "Q College", "slug": "q", "hosts": []}]
    summ = W.file_wave("s644a", arts, matrix, RUN, True, 40.0, root=root)
    check(summ["total_cost_usd"] == round(0.17 + 0.0 + 0.5, 2) and summ["total_price_usd"] == round(0.3 + 1.25 + 0.3, 2),
          "the wave's totals sum its rows: %r" % [summ["total_cost_usd"], summ["total_price_usd"]])
    check(summ["ready"] == ["X College"] and [r["verdict"] for r in summ["rows"]][1:] ==
          ["held: 2 pass to fail, 0 lost coverage", "failed: extract", "failed: no result"],
          "each college's verdict rides into the table, a job with no result included")
    xdir = os.path.join(root, "kb", "program_requirements_college", "x", "records")
    check(sorted(os.listdir(xdir)) == ["01.json", "02.json", "03.json", "04.json"],
          "a filed folder replaces the branch's whole, so a record the run removed does not stay")
    check(os.path.isdir(os.path.join(root, "kb", "program_requirements_college", "y"))
          and not os.path.isdir(os.path.join(root, "kb", "program_requirements_college", "z")),
          "a held college's folder is filed; one whose file step did not finish is not")
    md = open(os.path.join(root, "kb", "program_requirements_wave", "s644a.md")).read()
    js = json.load(open(os.path.join(root, "kb", "program_requirements_wave", "s644a.json")))
    check(js["rows"][0]["college"] == "X College" and "| X College | 3 | $0.30 | 2 | $0.17 | 1 | 0 | 0 | 1 | 1 | 50 of 50 | ready |" in md
          and "Total cost $0.67" in md and "Z College: its folder was not filed" in md,
          "the table names a row a college with its counts, the total, and what was not filed")
finally:
    shutil.rmtree(tmp, ignore_errors=True)

# ── the workflow ────────────────────────────────────────────────────────────
import yaml  # noqa: E402

wf_text = open(os.path.join(ROOT, ".github", "workflows", "program-requirements-wave.yml")).read()
wf = yaml.safe_load(wf_text)
on = wf.get("on", wf.get(True))
check(list(on) == ["workflow_dispatch"], "the wave runs on a dispatch alone: never a push or a schedule")
ins = on["workflow_dispatch"]["inputs"]
check(ins["extract"]["default"] == "0" and ins["limit_usd"]["default"] == "40", "a wave defaults to capture only, at $40")
jobs = wf["jobs"]
read = jobs["read"]
check(read["strategy"]["fail-fast"] is False and read["strategy"]["max-parallel"] == 6,
      "one college failing never stops the others; at most six read at once")
check(read["permissions"] == {"contents": "read"} and "git push" not in json.dumps(read),
      "a college's job pushes nothing")
check(jobs["file"]["permissions"] == {"contents": "write"} and wf_text.count("git push") == 1,
      "one job, after the matrix, makes the one push")
names = [s.get("name") or s.get("uses") for s in read["steps"]]
ext = next(s for s in read["steps"] if s.get("id") == "extract")
check(ext["if"] == "steps.price.outputs.go == 'true'" and "kb/_program_requirements_college.py extract" in ext["run"],
      "the extraction is the college script's own, and runs only on the price's go")
holders = [s.get("name") for j in jobs.values() for s in j["steps"] if "SUPABASE_SERVICE_KEY" in json.dumps(s)]
check(holders == ["Extract and score"], "the service key reaches the extraction step alone: %r" % holders)
check(names.index("Capture") < names.index("Price the extraction") < names.index("Extract and score")
      < names.index("File the run into this job's checkout") < names.index("Verify against main's filed records"),
      "capture, price, extract, file, verify, in that order")
check("CENSUS_DELAY_MS: '4000'" in wf_text, "the capture reads at the census's pace")
gov = json.load(open(os.path.join(ROOT, "kb", "governance_surface_map.json")))
check("writes no table" in gov["dismissed"].get("workflow:program-requirements-wave.yml", ""),
      "the wave is dismissed in the governance map with its reason")
college_wf = open(os.path.join(ROOT, ".github", "workflows", "program-requirements-college.yml")).read()
# Review finding 5: reads on one branch stay one at a time (never two reads on one host); a load or
# reread, which reads no catalog, groups by its college so several on a wave branch never cancel.
cwf = yaml.safe_load(college_wf)
group = cwf["concurrency"]["group"]
check("github.event.inputs.step == 'load' || github.event.inputs.step == 'reread'" in group
      and "format('-{0}', github.event.inputs.college)" in group and group.endswith("|| '' }}"),
      "the college joins the group for a load or reread alone: %s" % group)
load_steps = cwf["jobs"]["load"]["steps"]
lnames = [x.get("name") or x.get("uses") for x in load_steps]
up = [i for i, x in enumerate(load_steps) if str(x.get("uses", "")).startswith("actions/upload-artifact")]
push = next(x for x in load_steps if x.get("name") == "Commit the receipt to the branch that ran it")
check(up and up[0] < lnames.index("Commit the receipt to the branch that ran it")
      and load_steps[up[0]]["if"] == "always()",
      "the receipt, the rollback of a table write, rides in the run's artifact before any push")
# Second read, 5: only this run's receipts (kb/receipts holds over a thousand files), and an upload that
# fails never fails a job whose write and push succeed.
for _job in ("load", "display"):
    _ups = [x for x in cwf["jobs"][_job]["steps"] if str(x.get("uses", "")).startswith("actions/upload-artifact")]
    check(_ups and all(x["with"]["path"] == "kb/receipts/*${{ github.run_id }}*" and x.get("continue-on-error") is True
                       and x["with"]["name"] == "receipts-${{ github.run_id }}-${{ github.run_attempt }}" for x in _ups)
          and "receipts-${{ github.run_id }}-${{ github.run_attempt }}: commit it by hand" in college_wf,
          "the %s job uploads only this run's receipts under a name carrying its attempt, and its upload never "
          "fails the job" % _job)
check("for i in 1 2 3 4 5 6 7 8 9 10; do" in push["run"] and "RANDOM" in push["run"]
      and "::error::" in push["run"] and push["run"].rstrip().endswith("exit 1"),
      "the receipt's push tries ten times at random waits, then fails loudly naming the artifact")
check(any(str(x.get("uses", "")).startswith("actions/upload-artifact") and x.get("if") == "always()"
          for x in cwf["jobs"]["display"]["steps"]),
      "the display job's applied record rides in the run's artifact too")

# Review finding 1: a re-run keeps the run id and its first commit, so it would price against the branch
# before the wave filed and pay twice. An extracting wave runs once, and reads the branch's head.
check(W.check_attempt(True, "1") is None and W.check_attempt(False, "3") is None,
      "a first attempt extracts; a capture-only wave may run again")
check("dispatch a new wave" in (refused(W.check_attempt, True, "2") or ""), "an extracting re-run is refused")
check(read["steps"][0].get("with", {}).get("ref") == "${{ github.ref_name }}"
      and jobs["file"]["steps"][0].get("with", {}).get("ref") == "${{ github.ref_name }}",
      "the read and file jobs check out the branch's head, never the dispatch's commit")
plan_step = next(x for x in jobs["plan"]["steps"] if x.get("id") == "plan")
price_step = next(x for x in read["steps"] if x.get("id") == "price")
check(plan_step["env"].get("ATTEMPT") == "${{ github.run_attempt }}" and '--attempt "$ATTEMPT"' in plan_step["run"]
      and price_step["env"].get("ATTEMPT") == "${{ github.run_attempt }}" and '--attempt "$ATTEMPT"' in price_step["run"]
      and '--write "wave_out/$SLUG.wave.json"' in price_step["run"],
      "plan and price both read the attempt, and the price files its provisional row")
check(read["timeout-minutes"] < 360, "the job stops under the runner's limit, so its filing steps still run")
# Second read, 4: the wave's one push tries as the receipts' does, and its error names what to commit.
_push = next(x for x in jobs["file"]["steps"] if x.get("name") == "Commit to the wave branch, once")["run"]
check("for i in 1 2 3 4 5 6 7 8 9 10; do" in _push and "RANDOM" in _push
      and "wave-filed-${{ github.run_id }}-<attempt>-<college>" in _push and "before any new wave" in _push,
      "the wave's push tries ten times at random waits and names the artifacts to commit by hand")
_filed_up = next(x for x in read["steps"] if str(x.get("with", {}).get("name", "")).startswith("wave-filed-"))
check(_filed_up["with"]["retention-days"] == 90, "the wave-filed artifacts are kept 90 days")
# COBIx (6840501911): a re-run keeps the run id, and a name cannot be uploaded twice in one run, so every
# upload names its attempt.
_names = [x["with"]["name"] for x in read["steps"] if str(x.get("uses", "")).startswith("actions/upload-artifact")]
check(_names and all("${{ github.run_id }}-${{ github.run_attempt }}-" in n for n in _names)
      and W.artifact_name("5", "x", 2) == "wave-filed-5-2-x"
      and _filed_up["with"]["name"] == "wave-filed-${{ github.run_id }}-${{ github.run_attempt }}-${{ matrix.slug }}",
      "each of the wave's uploads names its attempt: %r" % _names)
# Second read, 2: the wave's extraction stops at its limit; the college workflow's does not change.
# Since S647 the college workflow sets one only on a staged read (sources_from, the conductor's $40 hard stop):
# a read that captures sets none.
_cwf = yaml.safe_load(college_wf)
_college_ext = [x for x in _cwf["jobs"]["read"]["steps"] if x.get("name") == "Extract and score"]
check('--ceiling-usd "$LIMIT_USD"' in ext["run"]
      and _college_ext and _college_ext[0]["env"]["CEILING"] == "${{ github.event.inputs.sources_from != '' && '40' || '' }}"
      and college_wf.lower().count("ceiling") == 3,
      "the wave passes its limit as the extraction's ceiling; the college workflow sets one only on a staged read")

import subprocess  # noqa: E402

_t = tempfile.mkdtemp()
try:
    json.dump({"pages_listed": 10, "pages_answered": 10, "would_extract": {"programs": 12}},
              open(os.path.join(_t, "capture.json"), "w"))
    _row = os.path.join(_t, "wave_out", "nowhere.wave.json")
    _cmd = [sys.executable, os.path.join(ROOT, "kb", "_program_requirements_wave.py"), "price", "--college",
            "Nowhere College", "--out", _t, "--extract", "1", "--limit-usd", "40", "--run", "77", "--write", _row]
    _env = dict(os.environ, GITHUB_OUTPUT=os.path.join(_t, "o"))
    first = subprocess.run(_cmd + ["--attempt", "1"], env=_env, capture_output=True, text=True)
    prov = json.load(open(_row))
    check(first.returncode == 0 and "go=true" in open(os.path.join(_t, "o")).read()
          and prov["provisional"] and prov["allowed_usd"] == round(12 * 0.08 * 1.25, 2)
          and prov["verdict"].startswith("failed: the job did not finish"),
          "the price files a provisional row naming what the college may spend, before any model call: %r" % prov)
    again = subprocess.run(_cmd + ["--attempt", "2"], env=_env, capture_output=True, text=True)
    got = json.load(open(os.path.join(_t, "wave_price.json")))
    check(again.returncode == 1 and got["go"] is False and got.get("rerun")
          and open(os.path.join(_t, "o")).read().strip().splitlines()[-1] == "go=false",
          "an extracting re-run's price refuses, says go=false and fails the step")
    check(W.verdict({"capture": "success", "extract": "skipped", "file": "success"}, {"x": 1},
                    {"partial": False}, got, {"pass_to_fail": [], "lost_coverage": []}, 0)
          == "held: a re-run never extracts (dispatch a new wave)", "the refused re-run reads as held in the table")
    # The table shows a stopped job's allowance.
    summ = W.summarize_wave("w", "77", True, 40.0, [dict(prov, college="Nowhere College")])
    md = W.table_md(summ)
    check(summ["unfinished_allowed_usd"] == 1.2 and "up to $1.20" in md and "Up to $1.20 more" in md,
          "a job that stopped after its price shows what it was allowed to spend")
finally:
    shutil.rmtree(_t, ignore_errors=True)

# Review finding 2, third case: when one model call raises, the reads already kept are still filed.
import _program_requirements_extract as XT  # noqa: E402

_t = tempfile.mkdtemp()
_saved = (XT.call, XT.score, os.environ.get("SUPABASE_SERVICE_KEY"))
try:
    keep = os.path.join(_t, "keep")
    out = os.path.join(_t, "out")
    os.makedirs(os.path.join(keep, "records"))
    os.makedirs(os.path.join(out, "sources"))
    json.dump({"control_number": "01", "record": {"blocks": []}, "source_url": "https://x.edu/a", "score": score(True)},
              open(os.path.join(keep, "records", "01.json"), "w"))
    for cn in ("01", "02"):
        json.dump({"college": "Test College", "control_number": cn, "shape": "certificate", "title": "T" + cn,
                   "award": "Certificate of Achievement", "closed_list": [{"code": "A 1"}], "text": "A 1",
                   "coverage": 1.0, "codes_found": ["A1"], "source": {"url": "https://x.edu/" + cn}},
                  open(os.path.join(out, "sources", cn + ".json"), "w"))

    def _call(src, key, *a, **k):
        if src["control_number"] == "02":
            raise RuntimeError("the function went away")
        return {"record": {"blocks": []}, "model": None, "usage": None}
    XT.call, XT.score = _call, (lambda rec, *a, **k: score(False))
    os.environ["SUPABASE_SERVICE_KEY"] = "test"
    raised = False
    try:
        C.extract(out, 0, 1, "77", 1, keep, None)
    except RuntimeError:
        raised = True
    kp = os.path.join(out, "kept_passing_0.json")
    check(raised and os.path.exists(kp) and [x["control_number"] for x in json.load(open(kp))] == ["01"],
          "a call that raises stops the step, and the kept list written so far is still filed")
finally:
    XT.call, XT.score = _saved[0], _saved[1]
    if _saved[2] is None:
        os.environ.pop("SUPABASE_SERVICE_KEY", None)
    else:
        os.environ["SUPABASE_SERVICE_KEY"] = _saved[2]
    shutil.rmtree(_t, ignore_errors=True)

# Second read, 2 and 3: a hard stop on the run's actual cost, and an unpriced call counted toward it at
# the most expensive model's price.
USAGE = {"input_tokens": 10000, "output_tokens": 2000}     # $0.08 at the priced model
_m = next(iter(XT.PRICE))
check(abs(XT.cost(_m, USAGE) - 0.08) < 1e-9 and C.call_charge(None, USAGE) == max(XT.cost(m, USAGE) for m in XT.PRICE)
      and C.call_charge(0.02, USAGE) == 0.02 and C.call_charge(None, None) == 0.0,
      "a call counts its price, or with usage and no price the most expensive model's price")


def _run_ceiling(ceiling, model):
    t = tempfile.mkdtemp()
    keep, out = os.path.join(t, "keep"), os.path.join(t, "out")
    os.makedirs(os.path.join(keep, "records"))
    os.makedirs(os.path.join(out, "sources"))
    json.dump({"control_number": "05", "record": {"blocks": []}, "source_url": "https://x.edu/old", "score": score(False)},
              open(os.path.join(keep, "records", "05.json"), "w"))
    for i in range(1, 6):
        cn = "%02d" % i
        json.dump({"college": "Test College", "control_number": cn, "shape": "certificate", "title": "T" + cn,
                   "award": "Certificate of Achievement", "closed_list": [{"code": "A 1"}], "text": "A 1",
                   "coverage": 1.0, "codes_found": ["A1"], "source": {"url": "https://x.edu/" + cn}},
                  open(os.path.join(out, "sources", cn + ".json"), "w"))
    sent = []

    def _call(src, key, *a, **k):
        sent.append(src["control_number"])
        return {"record": {"blocks": []}, "model": model, "usage": dict(USAGE)}
    saved = (XT.call, XT.score, os.environ.get("SUPABASE_SERVICE_KEY"))
    XT.call, XT.score = _call, (lambda rec, *a, **k: score(True))
    os.environ["SUPABASE_SERVICE_KEY"] = "test"
    try:
        rc = C.extract(out, 0, 1, "77", 1, keep, None, ceiling)
    finally:
        XT.call, XT.score = saved[0], saved[1]
        if saved[2] is None:
            os.environ.pop("SUPABASE_SERVICE_KEY", None)
        else:
            os.environ["SUPABASE_SERVICE_KEY"] = saved[2]
    return t, out, rc, sent


_t, _out, _rc, _sent = _run_ceiling(0.16, _m)
try:
    ns = json.load(open(os.path.join(_out, "not_sent_0.json")))
    check(_rc == 0 and _sent == ["01", "02"] and ns["programs"] == ["03", "04", "05"] and ns["spent_usd"] == 0.16,
          "once the run's actual cost reaches the ceiling, no further program is sent: %r" % _sent)
    check(json.load(open(os.path.join(_out, "records", "05.json")))["source_url"] == "https://x.edu/old"
          and not os.path.exists(os.path.join(_out, "records", "03.json")),
          "a program not sent keeps its filed record, so filing the run drops nothing")
    _v = W.verify("T College", _out, None, {"pages_listed": 5, "pages_answered": 5},
                  {"would_extract": 5, "price_usd": 0.5, "extract_asked": True, "within_limit": True}, "77",
                  {"capture": "success", "extract": "success", "file": "success"}, out_dir=_out)
    check(_v["verdict"] == "held: reached the limit, 3 programs not sent" and _v["cost_usd"] == 0.16
          and _v["not_sent"] == 3, "the row says the limit was reached, with the real cost: %r" % _v["verdict"])
finally:
    shutil.rmtree(_t, ignore_errors=True)
_t, _out, _rc, _sent = _run_ceiling(None, _m)
check(_sent == ["01", "02", "03", "04", "05"] and not os.path.exists(os.path.join(_out, "not_sent_0.json")),
      "no ceiling, today's behavior: every program is sent")
shutil.rmtree(_t, ignore_errors=True)
_t, _out, _rc, _sent = _run_ceiling(0.16, "an-unpriced-model")
try:
    check(_sent == ["01", "02"], "an unpriced call counts toward the stop at the most expensive model's price: %r" % _sent)
    _v = W.verify("T College", _out, None, {"pages_listed": 5, "pages_answered": 5},
                  {"would_extract": 5, "price_usd": 0.5, "extract_asked": True, "within_limit": True}, "77",
                  {"capture": "success", "extract": "success", "file": "success"}, out_dir=_out)
    _md = W.table_md(W.summarize_wave("w", "77", True, 40.0, [dict(_v, college="T College")]))
    check(_v["unpriced"] == 2 and _v["cost_usd"] == 0 and "$0.00 plus 2 unpriced calls" in _md
          and "leaves out 2 unpriced calls" in _md,
          "unpriced calls are counted in the row and the table: %r" % _v["unpriced"])
finally:
    shutil.rmtree(_t, ignore_errors=True)

# Last finding: a program the ceiling held back keeps its old record, so sources.json must keep the entry
# that record was read from; with the new capture's entry beside the old record it reads as unchanged and
# is never sent again. A program whose call errored filed no record, and is sent again too.
_t = tempfile.mkdtemp()
_saved = (C.COLLEGE_DIR, XT.call, XT.score, os.environ.get("SUPABASE_SERVICE_KEY"))
try:
    C.COLLEGE_DIR = os.path.join(_t, "colleges")
    keep = os.path.join(C.COLLEGE_DIR, C.slug_of("Test College"))
    os.makedirs(os.path.join(keep, "records"))
    # 05: filed from the same page at a smaller share, failing, with no fingerprint (most filed records).
    json.dump({"control_number": "05", "record": {"blocks": []}, "source_url": "https://x.edu/05", "score": score(False)},
              open(os.path.join(keep, "records", "05.json"), "w"))
    json.dump([{"control_number": "05", "source": {"url": "https://x.edu/05"}, "coverage": 0.8, "codes_found": ["A1"]}],
              open(os.path.join(keep, "sources.json"), "w"))

    def _out(name):
        out = os.path.join(_t, name)
        os.makedirs(os.path.join(out, "sources"))
        json.dump({"college": "Test College", "programs": 5}, open(os.path.join(out, "capture.json"), "w"))
        srcs = []
        for i in range(1, 6):
            cn = "%02d" % i
            srcs.append({"college": "Test College", "control_number": cn, "shape": "certificate", "title": "T" + cn,
                         "award": "Certificate of Achievement", "closed_list": [{"code": "A 1"}], "text": "A 1",
                         "coverage": 1.0, "codes_found": ["A1"], "method": "sitemap_page",
                         "source": {"url": "https://x.edu/" + cn}})
            json.dump(srcs[-1], open(os.path.join(out, "sources", cn + ".json"), "w"))
        return out, srcs
    sent = []

    def _call(src, key, *a, **k):
        sent.append(src["control_number"])
        if src["control_number"] == "02":
            return {"record": None, "error": "HTTP 502", "model": None, "usage": None}
        return {"record": {"blocks": []}, "model": _m, "usage": dict(USAGE)}
    XT.call, XT.score = _call, (lambda rec, *a, **k: score(True))
    os.environ["SUPABASE_SERVICE_KEY"] = "test"
    out1, srcs = _out("out1")
    C.extract(out1, 0, 1, "81", 1, keep, None, 0.16)
    first = list(sent)
    C.file_run("Test College", out1, "81")
    filed_src = {x["control_number"]: x for x in json.load(open(os.path.join(keep, "sources.json")))}
    check(first == ["01", "02", "03"] and filed_src["05"]["coverage"] == 0.8 and "04" not in filed_src,
          "a program not sent keeps the entry its record was read from, or none: %r %r" % (first, sorted(filed_src)))
    wx = C.would_extract("Test College", srcs, folder=keep)
    check(sorted(x["control_number"] for x in wx["list"]) == ["02", "04", "05"],
          "the next preview counts every program the ceiling held back, and the one whose call errored: %r"
          % sorted(x["control_number"] for x in wx["list"]))
    del sent[:]
    out2, _ = _out("out2")
    C.extract(out2, 0, 1, "82", 1, keep, None, None)
    check(sorted(sent) == ["02", "04", "05"], "the next run with no ceiling sends them all: %r" % sorted(sent))
finally:
    C.COLLEGE_DIR, XT.call, XT.score = _saved[0], _saved[1], _saved[2]
    if _saved[3] is None:
        os.environ.pop("SUPABASE_SERVICE_KEY", None)
    else:
        os.environ["SUPABASE_SERVICE_KEY"] = _saved[3]
    shutil.rmtree(_t, ignore_errors=True)

# The pick (COBIx 6840501911): for each college the latest attempt that paid for model calls, else the
# latest. A capture-only re-run of an extracting wave never displaces attempt 1's paid records.
_t = tempfile.mkdtemp()
try:
    def _art(attempt, slug, row):
        d = os.path.join(_t, W.artifact_name("9", slug, attempt), "wave_out")
        os.makedirs(d)
        json.dump(row, open(os.path.join(d, slug + ".wave.json"), "w"))
    _paid = {"verdict": "ready", "extracted": 40, "cost_usd": 3.1, "outcomes": {"capture": "success", "extract": "success", "file": "success"}}
    _later = {"verdict": "held: a re-run never extracts (dispatch a new wave)", "extracted": 0, "cost_usd": 0,
              "outcomes": {"capture": "success", "extract": "skipped", "file": "success"}}
    _art(1, "a", _paid)
    _art(2, "a", _later)
    _art(3, "a", _later)
    _, row_a, at_a = W.pick_attempt(_t, "9", "a")
    check(at_a == 1 and row_a["cost_usd"] == 3.1 and row_a["attempts"] == [1, 2, 3],
          "a capture-only re-run never displaces the paid attempt: picked %r" % at_a)
    _art(1, "b", {"verdict": "failed: capture", "outcomes": {"capture": "failure", "extract": "skipped"}})
    _art(2, "b", {"verdict": "captured", "outcomes": {"capture": "success", "extract": "skipped", "file": "success"}})
    check(W.pick_attempt(_t, "9", "b")[2] == 2, "with no paid attempt, the latest attempt is filed")
    _art(1, "c", {"provisional": True, "allowed_usd": 12.0, "verdict": "failed: the job did not finish after its price"})
    _art(2, "c", {"verdict": "captured", "outcomes": {"capture": "success", "extract": "skipped", "file": "success"}})
    check(W.pick_attempt(_t, "9", "c")[2] == 1,
          "an attempt allowed to spend that stopped before its verify still outranks a later capture-only one")
    _art(1, "a_b", _later)
    check(W.pick_attempt(_t, "9", "a")[1]["attempts"] == [1, 2, 3] and W.pick_attempt(_t, "9", "z") == (None, None, None),
          "a college's attempts are its own (a_b is not a), and a college with none has no pick")
finally:
    shutil.rmtree(_t, ignore_errors=True)

# The two run-cost sums agree (S648 review of #3202): the wave's run_cost reads the failed calls' cost
# (extract_account_<shard>.json), and the college's run_cost_of reads the halt's (extract_halt_<shard>.json).
_rc = tempfile.mkdtemp()
try:
    os.makedirs(os.path.join(_rc, "records"))
    C._write(os.path.join(_rc, "records", "A1.json"), {"control_number": "A1", "extracted_run": "900", "cost_usd": 0.1})
    C._write(os.path.join(_rc, "extract_account_0.json"), {"calls": 3, "failed": [{"control_number": "B2", "cost_usd": 0.2}]})
    C._write(os.path.join(_rc, "extract_halt_0.json"), {"cause": "upstream_timeout", "status": 503, "cost_usd": 0.3})
    check(W.run_cost(_rc, "900")["cost_usd"] == 0.6 and C.run_cost_of(_rc, "900") == 0.6,
          "the wave's run_cost and the college's run_cost_of both count the record, the failed call and the halt: "
          "%r, %r" % (W.run_cost(_rc, "900")["cost_usd"], C.run_cost_of(_rc, "900")))
finally:
    shutil.rmtree(_rc, ignore_errors=True)

if failures:
    print("FAIL: %d" % len(failures))
    for f in failures:
        print("  -", f)
    sys.exit(1)
print("ok: program requirements wave (%d checks)" % checks[0])
