#!/usr/bin/env python3
"""scripts/library_check.py: the check-row writer, list on a pass, and the footer line (#3560 part 2; S688).

    python3 tests/library_check_test.py

Sam's go of Nov 19, 2026 (via COBIx on #3560): nothing lists publicly until its accessibility check passes; every
Library page carries a footer line built from its own check record; a piece not yet re-checked reads Not yet
certified. The REST calls are faked, and so is the engine (scripts/a11y.js, which needs a browser). Guards:
  A. One row per checked page, with the record's current url and version key (the url the gate matches,
     c.url = l.url), the division's standard and tool, pass or fail, the findings count, an https report address on
     Pages, and created_by naming the run. checked_at is the database's.
  B. List on a pass: only a piece whose publish_target is public, not listed, whose check passed at its current url
     and key; the update is guarded on the record as read, at that url and version. A fail lists nothing.
  C. The footer: from the piece's own latest check at its key and url, newest wins; a fail, a check at another url, a
     check older than the page's last change, or none reads the division's Not yet certified. One block, placed before
     the Ask Sierra script, replaced in place on every run.
  D. A failed engine or insert leaves no claim behind: every page goes back as it was and no report stays.
  E. The plan: pages --finish moved, plus pieces waiting on the Public Library with no check since the page changed.
"""
import json
import os
import shutil
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "scripts"))
import library_check as lc  # noqa: E402
import library_publish as lp  # noqa: E402

fails = []


def check(ok, msg):
    print(("ok   " if ok else "FAIL ") + msg)
    if not ok:
        fails.append(msg)


P = lp.PAGES
SET = {"cobi": {"division": "cobi", "standard": "WCAG 2.1 AA and Section 508", "reviewer_or_tool": "axe-core automated check",
                "footer_template": "Accessibility: {standard}, checked {date}, report linked.",
                "not_certified": "Accessibility: Not yet certified."}}


def rec(slug, **kw):
    r = {"id": "id-" + slug, "slug": slug, "title": slug.title(), "url": P + slug + "/", "version": "2", "division": "cobi",
         "publish_target": "internal", "public_listed": False, "retired_at": None, "updated_at": "2026-11-20T10:00:00+00:00",
         "summary": "A summary.", "public_summary": None, "seen_by": "team"}
    r.update(kw)
    return r


def chk(r, result="pass", at="2026-11-20T18:00:00+00:00", url=None, key=None, **kw):
    c = {"id": "c-" + r["slug"] + at, "library_id": r["id"], "version_key": key or lc.page_key(r), "url": r["url"] if url is None else url,
         "result": result, "checked_at": at, "created_at": at, "standard": "WCAG 2.1 AA and Section 508",
         "tool_or_reviewer": "axe-core automated check", "report_url": "https://cpl-initiative.github.io/r.txt", "findings": 0}
    c.update(kw)
    return c


# ── C. the footer from the check record ──────────────────────────────────────────────────────────────────────────
R = rec("flyer")
check(lc.page_key(R) == "version:2" and lc.page_key(rec("x", version=None)) == "page", "the version key is library.js checkKey()'s")
check(lc.latest_check([chk(R)], R) is not None, "a pass at the record's key and url is its latest check")
check(lc.latest_check([chk(R, url=P + "flyer-old/")], R) is None, "C ⭐ a check at another url is not this page's")
check(lc.latest_check([chk(R, url="")], R) is None, "a check with no url is not this page's")
check(lc.latest_check([chk(R, key="version:1")], R) is None, "a check of another version is not this page's")
newest = lc.latest_check([chk(R, at="2026-11-20T18:00:00+00:00"), chk(R, "fail", at="2026-11-20T19:00:00+00:00")], R)
check(newest and newest["result"] == "fail", "newest wins at one key and url")
moved = dict(R, page_changed_at="2026-11-20T18:30:00+00:00")
check(lc.latest_check([chk(R, at="2026-11-20T18:00:00+00:00")], moved) is None,
      "C ⭐ a pass older than the page's last change (a version relabeled to a key that passed) is not this page's")

line = lc.footer_line(chk(R, at="2026-11-19T20:00:00+00:00"), SET["cobi"])
check(line == 'Accessibility: WCAG 2.1 AA and Section 508, checked Nov 19, 2026, <a href="https://cpl-initiative.github.io/r.txt">report linked</a>.',
      "C ⭐ a pass reads Sam's shape: the standard, the date, and the report linked")
check(lc.footer_line(chk(R, at="2026-11-20T04:00:00+00:00"), SET["cobi"]).count("Nov 19, 2026") == 1,
      "the date is California's (04:00 UTC on Nov 20 is Nov 19 there)")
check(lc.footer_line(chk(R, "fail"), SET["cobi"]) == "Accessibility: Not yet certified.", "C a fail reads Not yet certified")
check(lc.footer_line(None, SET["cobi"]) == "Accessibility: Not yet certified.", "C no check reads Not yet certified")
check("<a" not in lc.footer_line(chk(R, report_url="javascript:alert(1)"), SET["cobi"]), "only an https report is linked")
t2 = dict(SET["cobi"], footer_template="{standard} by {reviewer} on {date}: {report}.")
check(lc.footer_line(chk(R, at="2026-11-19T20:00:00+00:00"), t2) ==
      'WCAG 2.1 AA and Section 508 by axe-core automated check on Nov 19, 2026: <a href="https://cpl-initiative.github.io/r.txt">report</a>.',
      "a division's template fills {standard}, {reviewer}, {date} and {report}")
check(lc.footer_line(chk(R, standard="<b>x</b>"), dict(SET["cobi"], footer_template="{standard}.")).startswith("&lt;b&gt;"),
      "the check's words are escaped")

PAGE = ("<!doctype html>\n<html lang=\"en\">\n<head>\n<title>T</title>\n</head>\n<body>\n<main id=\"main\"><h1>T</h1></main>\n"
        "<!-- Ask Sierra: a chip. -->\n<script src=\"../../sierra/sidebar.js\" defer></script>\n</body>\n</html>\n")
one = lc.stamp(PAGE, lc.footer_block(chk(R), SET["cobi"]))
two = lc.stamp(one, lc.footer_block(None, SET["cobi"]))
check(one.count("cpl-library-check:") == 1 and one.index("cpl-check-line") < one.index("<!-- Ask Sierra"),
      "C the line sits before the Ask Sierra script, which stays last in <body>")
check(two.count("cpl-library-check:") == 1 and "Not yet certified" in two and "report linked" not in two,
      "C ⭐ a second stamp replaces the line in place: one block, never two")
check(lc.stamp(two, lc.footer_block(None, SET["cobi"])) == two, "stamping is idempotent")
check(two.endswith("</body>\n</html>\n"), "the page still ends </body></html>")
risk = lp.risk_counts(one)
check(risk["a srcdoc or style attribute"] == 0 and risk["an event handler"] == 0 and "\\" not in lc.footer_block(chk(R), SET["cobi"]),
      "the block has no style attribute, handler or backslash, so a revision's risk counts read it the same")
check(not lp.added_risks(one, one) and not lp.added_risks(one, two), "a page whose line changes adds no risk")

# ── E. the plan ──────────────────────────────────────────────────────────────────────────────────────────────────
tmp = Path(tempfile.mkdtemp(prefix="libcheck-"))
try:
    for slug in ("flyer", "poster", "guide", "waiting-checked", "relabeled", "elsewhere"):
        (tmp / "library" / slug).mkdir(parents=True)
        (tmp / "library" / slug / "index.html").write_text(PAGE, encoding="utf-8")
    recs = [rec("flyer"), rec("poster", publish_target="public"), rec("guide", publish_target="public"),
            rec("waiting-checked", publish_target="public"), rec("relabeled", publish_target="public", page_changed_at="2026-11-20T19:00:00+00:00"),
            rec("elsewhere", publish_target="public", url="https://claude.ai/artifact/x"),
            rec("not-here", publish_target="public")]
    old = [chk(recs[3], "fail"), chk(recs[4], "pass", at="2026-11-20T18:00:00+00:00")]
    plan = lc.plan(recs, old, ["flyer"], tmp)
    check(plan == ["flyer", "guide", "poster", "relabeled"],
          "E ⭐ a page moved this run, waiting pieces with no check since the page changed; never a page the checkout lacks, "
          "one at another address, or a waiting piece whose page already has its check: %s" % plan)

    # ── A, B, C, D: the run, with the REST calls and the engine faked ───────────────────────────────────────────
    calls, inserted = [], []
    state = {r["slug"]: dict(r) for r in recs}

    def fake_api(path, method="GET", body=None, headers=None):
        calls.append((method, path, body))
        if path.startswith("cpl_library_division_settings"):
            return list(SET.values())
        if path.startswith("cpl_library_checks") and method == "GET":
            return list(old)
        if path.startswith("cpl_library_checks") and method == "POST":
            out = []
            for i, b in enumerate(body):
                row = dict(b, id="new-%d" % i, checked_at="2026-11-20T20:00:0%d+00:00" % i, created_at="2026-11-20T20:00:00+00:00")
                out.append(row)
            inserted.extend(out)
            return out
        if path.startswith("cpl_library?select=*&retired_at=is.null"):
            return [dict(r) for r in state.values()]
        if path.startswith("cpl_library?select=*&id=eq."):
            i = path.split("id=eq.", 1)[1]
            return [dict(r) for r in state.values() if r["id"] == i]
        if path.startswith("cpl_library?") and method == "PATCH":
            return [dict(body)]
        raise AssertionError("unexpected call " + method + " " + path)

    engine_out = {"targets": {"flyer": {"pass": True, "findings": 0, "lines": []}, "flyer-dark": {"pass": True, "findings": 0, "lines": []},
                              "poster": {"pass": True, "findings": 0, "lines": []}, "poster-dark": {"pass": True, "findings": 0, "lines": []},
                              "guide": {"pass": True, "findings": 0, "lines": []},
                              "guide-dark": {"pass": False, "findings": 2, "lines": ["contrast  3.1:1", "axe color-contrast"]},
                              "relabeled": {"pass": True, "findings": 0, "lines": []}, "relabeled-dark": {"pass": True, "findings": 0, "lines": []}},
                  "axe": {"version": "4.10.2", "tags": ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]}, "widths": [320, 1440]}
    seen = {}

    def fake_engine(slugs, out_path):
        seen["slugs"] = list(slugs)
        seen["pages"] = {s: (tmp / "library" / s / "index.html").read_text(encoding="utf-8") for s in slugs}
        return engine_out

    saved = (lp.api, lc.ROOT, lc.RECEIPTS, os.environ.get("GITHUB_RUN_ID"))
    lp.api = fake_api
    lc.ROOT, lc.RECEIPTS = tmp, tmp / "kb" / "receipts" / "library_checks"
    os.environ["GITHUB_RUN_ID"] = "4242"
    try:
        (tmp / "plan.json").write_text(json.dumps({"check": plan}), encoding="utf-8")
        lc.check_phase(str(tmp / "plan.json"), engine=fake_engine, now=datetime(2026, 11, 20, 20, 0, 0, tzinfo=timezone.utc))
        posts = [c for c in calls if c[0] == "POST"]
        rows = posts[0][2] if posts else []
        by = {r["library_id"]: r for r in rows}
        check(len(posts) == 1 and len(rows) == 4 and set(by) == {"id-flyer", "id-guide", "id-poster", "id-relabeled"},
              "A ⭐ one row per checked page, in one insert")
        f = by.get("id-flyer", {})
        check(f.get("url") == P + "flyer/" and f.get("version_key") == "version:2",
              "A ⭐ each row names the record's current url and version key (the gate matches c.url = l.url)")
        check(f.get("standard") == "WCAG 2.1 AA and Section 508" and f.get("tool_or_reviewer") == "axe-core automated check",
              "A the standard and the tool are the division's settings")
        check(f.get("created_by") == "library-publish.yml run 4242" and "checked_at" not in f,
              "A created_by names the run; checked_at is left to the database")
        check(str(f.get("report_url", "")).startswith("https://cpl-initiative.github.io/cpl-project-tracker/library/flyer/accessibility/")
              and (tmp / f["report_url"].split("cpl-project-tracker/", 1)[1]).exists(),
              "A the report is a file beside the page, at its https address on Pages")
        g = by.get("id-guide", {})
        check(g.get("result") == "fail" and g.get("findings") == 2, "A ⭐ a page whose Dark check fails is a fail, with its findings")
        rep = (tmp / g["report_url"].split("cpl-project-tracker/", 1)[1]).read_text(encoding="utf-8")
        check("Did not pass" in rep and "Dark: contrast  3.1:1" in rep and "Findings: 2" in rep, "the report says what the check found, in plain words")
        check("report linked" in seen["pages"]["guide"] and "report linked" in seen["pages"]["flyer"],
              "C the engine checks the page with the line it will show on a pass, so the page checked is the page served")

        patches = [c for c in calls if c[0] == "PATCH"]
        listed = {c[1].split("id=eq.", 1)[1].split("&", 1)[0] for c in patches}
        check(listed == {"id-poster", "id-relabeled"}, "B ⭐ only pieces published to the Public Library whose check passed are listed: %s" % listed)
        pp = next((c for c in patches if "id=eq.id-poster" in c[1]), None)
        check(pp and "url=eq." + "https%3A%2F%2Fcpl-initiative.github.io%2Fcpl-project-tracker%2Flibrary%2Fposter%2F" in pp[1]
              and "updated_at=eq." in pp[1] and "public_listed=is.false" in pp[1] and "publish_target=eq.public" in pp[1]
              and "version=eq.2" in pp[1], "B ⭐ the listing is guarded on the record as read, at the url and version checked")
        check(pp and pp[2]["public_listed"] is True and pp[2]["seen_by"] == "public" and pp[2]["public_summary"] == "A summary."
              and pp[2]["listed_by"] == lc.BOT, "B the listing writes the columns set_public writes, with a summary")
        check(not any("id-guide" in c[1] for c in patches) and not any("id-flyer" in c[1] for c in patches),
              "B a fail lists nothing, and an Internal piece is never listed")

        page = lambda s: (tmp / "library" / s / "index.html").read_text(encoding="utf-8")  # noqa: E731
        check("checked Nov 20, 2026" in page("flyer") and "report linked</a>" in page("flyer"), "C ⭐ a passing page's line is its check's")
        check("Not yet certified" in page("guide") and "report linked" not in page("guide"), "C ⭐ a failing page reads Not yet certified")
        check("Not yet certified" in page("waiting-checked"), "C ⭐ an unchecked page (its only check failed) reads Not yet certified")
        check(all(page(s).count("cpl-library-check:") == 1 for s in ("flyer", "guide", "poster", "waiting-checked")), "C one line per page")
        rc = list((tmp / "kb" / "receipts" / "library_checks").glob("*.json"))
        body = json.loads(rc[0].read_text(encoding="utf-8")) if rc else {}
        check(len(rc) == 1 and len(body.get("checks", [])) == 4 and len(body.get("listed", [])) == 2
              and body["listed"][0]["before"].get("public_listed") is False, "A B one receipt: the rows and each listing's before-values")

        # D. an engine that never reports, and an insert the database refuses
        for s in ("poster",):
            (tmp / "library" / s / "index.html").write_text(PAGE, encoding="utf-8")
        before = page("poster")
        calls.clear()

        def broken(slugs, out_path):
            raise FileNotFoundError("node")
        raised = False
        try:
            (tmp / "plan2.json").write_text(json.dumps({"check": ["poster"]}), encoding="utf-8")
            lc.check_phase(str(tmp / "plan2.json"), engine=broken, now=datetime(2026, 11, 20, 21, 0, 0, tzinfo=timezone.utc))
        except FileNotFoundError:
            raised = True
        check(raised and page("poster") == before and not list((tmp / "library" / "poster" / "accessibility").glob("*-210000Z.txt"))
              and not any(c[0] == "POST" for c in calls), "D ⭐ an engine that cannot run leaves the page as it was, no report and no row")
        lp.api = lambda path, method="GET", body=None, headers=None: (_ for _ in ()).throw(RuntimeError("400 url")) \
            if method == "POST" else fake_api(path, method, body, headers)
        raised = False
        try:
            lc.check_phase(str(tmp / "plan2.json"), engine=fake_engine, now=datetime(2026, 11, 20, 22, 0, 0, tzinfo=timezone.utc))
        except RuntimeError:
            raised = True
        check(raised and page("poster") == before, "D ⭐ an insert the database refuses leaves no line claiming a pass")
    finally:
        lp.api, lc.ROOT, lc.RECEIPTS = saved[0], saved[1], saved[2]
        if saved[3] is None:
            os.environ.pop("GITHUB_RUN_ID", None)
        else:
            os.environ["GITHUB_RUN_ID"] = saved[3]
finally:
    shutil.rmtree(tmp, ignore_errors=True)

# B, pure: should_list
w = rec("w", publish_target="public")
check(lc.should_list(w, chk(w)) and not lc.should_list(w, chk(w, "fail")) and not lc.should_list(w, chk(w, url=P + "z/"))
      and not lc.should_list(dict(w, public_listed=True), chk(w)) and not lc.should_list(dict(w, publish_target="internal"), chk(w))
      and not lc.should_list(w, chk(w, key="version:1")), "B should_list: public, unlisted, passed at its own url and key")
check(lc.engine_result({"targets": {"a": {"pass": True, "findings": 0}}}, "a")["pass"] is False,
      "a page the engine reported only in Light is a fail, never a pass")
check(lc.page_key(rec("u", version="  ")) == "page", "a blank version reads page")

# --finish names the records it moved, so the plan checks exactly those.
tmpf = Path(tempfile.mkdtemp(prefix="libfinish-"))
try:
    saved_api, saved_rc = lp.api, lp.RECEIPTS
    lp.RECEIPTS = tmpf
    for slug, ok in (("a-one", True), ("b-two", False)):
        (tmpf / ("2026-11-20-%s.json" % slug)).write_text(json.dumps({"slug": slug, "draft_id": "d", "record_id": "r-" + slug,
                                                                       "before": {"updated_at": "t"}, "update": {}}), encoding="utf-8")
    lp.api = lambda path, method="GET", body=None, headers=None: ([{}] if "r-a-one" in path else []) if path.startswith("cpl_library?") else []
    import contextlib
    import io
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        lp.finish_phase("2026-11-20", "abc1234")
    got = json.loads(buf.getvalue())
    check(got.get("moved") == ["a-one"] and got.get("left_for_next_run") == ["b-two"], "--finish names the records it moved: %s" % got)
finally:
    lp.api, lp.RECEIPTS = saved_api, saved_rc
    shutil.rmtree(tmpf, ignore_errors=True)

# scripts/library_page.py cannot read a check record: a rebuild keeps the line the page carried, a new page reads Not
# yet certified until the check run writes its line.
import library_page as lpg  # noqa: E402
tmpp = Path(tempfile.mkdtemp(prefix="libpage-"))
try:
    saved_root = lpg.ROOT
    lpg.ROOT = tmpp
    src = tmpp / "src.html"
    src.write_text("<title>A Piece</title>\n<main><h1>A Piece</h1></main>", encoding="utf-8")
    import contextlib
    import io
    with contextlib.redirect_stdout(io.StringIO()):
        lpg.main(["library_page.py", "a-piece", str(src)])
    out = tmpp / "library" / "a-piece" / "index.html"
    first = out.read_text(encoding="utf-8")
    check("Not yet certified" in first and first.count("cpl-library-check:") == 1 and first.endswith("</body>\n</html>\n"),
          "a new page library_page.py writes reads Not yet certified")
    out.write_text(lc.stamp(first, lc.footer_block(chk(rec("a-piece")), SET["cobi"])), encoding="utf-8")
    with contextlib.redirect_stdout(io.StringIO()):
        lpg.main(["library_page.py", "a-piece", str(src)])
    again = out.read_text(encoding="utf-8")
    check("report linked" in again and again.count("cpl-library-check:") == 1,
          "a rebuild keeps the line the check run wrote, once (the run rewrites it from the record)")
finally:
    lpg.ROOT = saved_root
    shutil.rmtree(tmpp, ignore_errors=True)

print("\nlibrary_check_test.py: %s" % ("all checks passed" if not fails else "%d FAILED" % len(fails)))
sys.exit(1 if fails else 0)
