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

def with_proof(root, r, result, at, page_text):
    """An earlier check of r with its committed report and proof (the sha of page_text)."""
    stamp_ = at[:4] + at[5:7] + at[8:10] + "-" + at[11:13] + at[14:16] + at[17:19] + "Z"
    rel = "library/%s/accessibility/%s.txt" % (r["slug"], stamp_)
    c = chk(r, result, at=at, report_url=lc.SITE + rel)
    (root / rel).parent.mkdir(parents=True, exist_ok=True)
    (root / rel).write_text("report\n", encoding="utf-8")
    (root / rel[:-4]).with_suffix(".json").write_text(json.dumps({"check_id": c["id"], "version_key": c["version_key"], "url": c["url"],
                                                                  "result": result, "sha256": lc.content_hash(page_text)}), encoding="utf-8")
    return c


# ── E. the plan ──────────────────────────────────────────────────────────────────────────────────────────────────
tmp = Path(tempfile.mkdtemp(prefix="libcheck-"))
try:
    for slug in ("flyer", "poster", "guide", "waiting-checked", "relabeled", "elsewhere", "changed", "failed-changed", "steady", "legacy"):
        (tmp / "library" / slug).mkdir(parents=True)
        (tmp / "library" / slug / "index.html").write_text(PAGE, encoding="utf-8")
    recs = [rec("flyer"), rec("poster", publish_target="public", public_summary="For the public."), rec("guide", publish_target="public"),
            rec("waiting-checked", publish_target="public"), rec("relabeled", publish_target="public", public_summary="For the public.", page_changed_at="2026-11-20T19:00:00+00:00"),
            rec("elsewhere", publish_target="public", url="https://claude.ai/artifact/x"),
            rec("not-here", publish_target="public"),
            rec("changed", publish_target="public", public_listed=True, seen_by="public", public_summary="For the public."),
            rec("failed-changed", publish_target="public"), rec("steady"),
            # A legacy listing: listed before the check run, with no check row at all (d-library-legacy-listings-stay-s688).
            rec("legacy", publish_target="public", public_listed=True, seen_by="public", public_summary="For the public.")]
    OTHER = PAGE.replace("<h1>T</h1>", "<h1>An earlier page</h1>")
    old = [with_proof(tmp, recs[3], "fail", "2026-11-20T17:00:00+00:00", PAGE),
           with_proof(tmp, recs[4], "pass", "2026-11-20T18:00:00+00:00", PAGE),
           with_proof(tmp, recs[7], "pass", "2026-11-20T17:10:00+00:00", OTHER),
           with_proof(tmp, recs[8], "fail", "2026-11-20T17:20:00+00:00", OTHER),
           with_proof(tmp, recs[9], "pass", "2026-11-20T17:30:00+00:00", PAGE)]
    plan = lc.plan(recs, old, ["flyer"], tmp)
    check(plan == ["changed", "failed-changed", "flyer", "guide", "legacy", "poster", "relabeled"],
          "E ⭐ the plan: a page moved this run, a page with no check proof, a page whose content differs from its latest check's "
          "proof (listed or failed), and a relabel; never a page the checkout lacks, one at another address, a failed page whose "
          "content has not changed, or a steady page: %s" % plan)
    check(not lc.drifted(recs[9], old, tmp) and lc.drifted(recs[7], old, tmp) and lc.drifted(recs[8], old, tmp),
          "E ⭐ drift is the page on disk against its latest check's committed sha")

    # ── A, B, C, D: the run, with the REST calls and the engine faked ───────────────────────────────────────────
    calls, inserted = [], []
    state = {r["slug"]: dict(r) for r in recs}

    def fake_api(path, method="GET", body=None, headers=None):
        calls.append((method, path, body))
        if path.startswith("cpl_library_division_settings"):
            return list(SET.values())
        if path.startswith("cpl_library_checks") and method == "GET":
            return list(inserted) + list(old)
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
            i = path.split("id=eq.", 1)[1].split("&", 1)[0]
            r = next((x for x in state.values() if x["id"] == i), None)
            if r is None:
                return []
            if body.get("public_listed") is False:
                body = dict(body, publish_target="internal")    # the trigger on unlisting
            r.update(body)
            r["updated_at"] = "2026-11-20T20:%02d:00+00:00" % len(calls)
            return [dict(r)]
        raise AssertionError("unexpected call " + method + " " + path)

    engine_out = {"targets": {"flyer": {"pass": True, "findings": 0, "lines": []}, "flyer-dark": {"pass": True, "findings": 0, "lines": []},
                              "poster": {"pass": True, "findings": 0, "lines": []}, "poster-dark": {"pass": True, "findings": 0, "lines": []},
                              "guide": {"pass": True, "findings": 0, "lines": []},
                              "guide-dark": {"pass": False, "findings": 2, "lines": ["contrast  3.1:1", "axe color-contrast"]},
                              "relabeled": {"pass": True, "findings": 0, "lines": []}, "relabeled-dark": {"pass": True, "findings": 0, "lines": []},
                              "changed": {"pass": True, "findings": 0, "lines": []}, "changed-dark": {"pass": True, "findings": 0, "lines": []},
                              "failed-changed": {"pass": True, "findings": 0, "lines": []}, "failed-changed-dark": {"pass": True, "findings": 0, "lines": []},
                              "legacy": {"pass": False, "findings": 4, "lines": ["contrast  2.9:1"]}, "legacy-dark": {"pass": True, "findings": 0, "lines": []}},
                  "axe": {"version": "4.10.2", "tags": ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]}, "widths": [320, 1440]}
    seen = {}

    def fake_engine(slugs, out_path):
        seen["slugs"] = list(slugs)
        seen["calls_before_engine"] = list(calls)
        seen["pages"] = {s: (tmp / "library" / s / "index.html").read_text(encoding="utf-8") for s in slugs}
        return engine_out

    saved = (lp.api, lc.ROOT, lc.RECEIPTS, os.environ.get("GITHUB_RUN_ID"))
    lp.api = fake_api
    lc.ROOT, lc.RECEIPTS = tmp, tmp / "kb" / "receipts" / "library_checks"
    os.environ["GITHUB_RUN_ID"], os.environ["GITHUB_RUN_ATTEMPT"] = "4242", "1"
    try:
        import contextlib
        import io
        (tmp / "plan.json").write_text(json.dumps({"check": plan}), encoding="utf-8")
        cbuf = io.StringIO()
        with contextlib.redirect_stdout(cbuf):
            lc.check_phase(str(tmp / "plan.json"), engine=fake_engine, now=datetime(2026, 11, 20, 20, 0, 0, tzinfo=timezone.utc))
        (tmp / "check.json").write_text(cbuf.getvalue().strip().splitlines()[-1], encoding="utf-8")
        cj = json.loads((tmp / "check.json").read_text(encoding="utf-8"))
        posts = [c for c in calls if c[0] == "POST"]
        rows = posts[0][2] if posts else []
        by = {r["library_id"]: r for r in rows}
        check(len(posts) == 1 and len(rows) == 7 and set(by) == {"id-flyer", "id-guide", "id-poster", "id-relabeled", "id-changed", "id-failed-changed", "id-legacy"},
              "A ⭐ one row per checked page, in one insert")
        check(not any(c[0] == "PATCH" and "public_listed" in (c[2] or {}) and c[2]["public_listed"] is True for c in calls),
              "B ⭐ --check lists nothing: the listing waits for the push of its report")
        unl = [c for c in seen.get("calls_before_engine", []) if c[0] == "PATCH" and "id=eq.id-changed" in c[1]]
        check(len(unl) == 2 and unl[0][2] == {"public_listed": False, "updated_by": lc.BOT} and "public_listed=is.true" in unl[0][1]
              and "updated_at=eq." in unl[0][1] and unl[1][2].get("publish_target") == "public",
              "E ⭐ a listed piece whose content its latest pass never saw comes off before its new check runs, guarded, with "
              "publish_target put back to public so it relists on a pass")
        check(by.get("id-legacy", {}).get("result") == "fail" and not any(c[0] == "PATCH" and "id=eq.id-legacy" in c[1] for c in calls)
              and state["legacy"]["public_listed"] is True,
              "E ⭐ a legacy listing (listed, no check row) is checked once and stays listed whatever its first check finds: no PATCH fires for it")
        rc0 = list((tmp / "kb" / "receipts" / "library_checks").glob("*.json"))
        un = json.loads(rc0[0].read_text(encoding="utf-8")).get("unlisted", []) if rc0 else []
        check(len(un) == 1 and un[0]["slug"] == "changed" and un[0]["unlisted"] is True and un[0]["before"]["public_listed"] is True
              and un[0].get("publish_target_restored") is True,
              "E the unlisting's before-values, and the restore of publish_target, are in the receipt")
        check(sorted(x["slug"] for x in cj.get("to_list", [])) == ["changed", "failed-changed", "poster", "relabeled"],
              "B check.json names the passing pieces waiting to be listed: %s" % cj.get("to_list"))
        f = by.get("id-flyer", {})
        check(f.get("url") == P + "flyer/" and f.get("version_key") == "version:2",
              "A ⭐ each row names the record's current url and version key (the gate matches c.url = l.url)")
        check(f.get("standard") == "WCAG 2.1 AA and Section 508" and f.get("tool_or_reviewer") == "axe-core automated check",
              "A the standard and the tool are the division's settings")
        check(f.get("created_by") == "library-publish.yml run 4242 attempt 1" and "checked_at" not in f,
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

        n_before = len(calls)
        with contextlib.redirect_stdout(io.StringIO()):
            lc.list_phase(str(tmp / "check.json"))
        patches = [c for c in calls[n_before:] if c[0] == "PATCH"]
        listed = {c[1].split("id=eq.", 1)[1].split("&", 1)[0] for c in patches}
        check(listed == {"id-poster", "id-relabeled", "id-changed"},
              "B ⭐ --list lists only pieces published to the Public Library whose check passed, the one taken off for its change included: %s" % listed)
        pp = next((c for c in patches if "id=eq.id-poster" in c[1]), None)
        check(pp and "url=eq." + "https%3A%2F%2Fcpl-initiative.github.io%2Fcpl-project-tracker%2Flibrary%2Fposter%2F" in pp[1]
              and "updated_at=eq." in pp[1] and "public_listed=is.false" in pp[1] and "publish_target=eq.public" in pp[1]
              and "version=eq.2" in pp[1], "B ⭐ the listing is guarded on the record as read, at the url and version checked")
        check(pp and pp[2]["public_listed"] is True and pp[2]["seen_by"] == "public" and pp[2]["public_summary"] == "For the public."
              and pp[2]["listed_by"] == lc.BOT, "B the listing writes the columns set_public writes, with a summary")
        check(not any("id-guide" in c[1] for c in patches) and not any("id-flyer" in c[1] for c in patches),
              "B a fail lists nothing, and an Internal piece is never listed")

        page = lambda s: (tmp / "library" / s / "index.html").read_text(encoding="utf-8")  # noqa: E731
        check("checked Nov 20, 2026" in page("flyer") and "report linked</a>" in page("flyer"), "C ⭐ a passing page's line is its check's")
        check("Not yet certified" in page("guide") and "report linked" not in page("guide"), "C ⭐ a failing page reads Not yet certified")
        check("Not yet certified" in page("waiting-checked"), "C ⭐ an unchecked page (its only check failed) reads Not yet certified")
        check("Not yet certified" in page("legacy") and state["legacy"]["public_listed"] is True,
              "C a legacy listing whose first check failed keeps its listing and reads Not yet certified")
        check(lc.drift_unlists(dict(state["changed"], public_listed=True), old, "x") and not lc.drift_unlists(state["legacy"], old, page("legacy")),
              "E drift_unlists: a listed piece with a pass its page no longer matches comes off; a legacy listing does not")
        check(all(page(s).count("cpl-library-check:") == 1 for s in ("flyer", "guide", "poster", "waiting-checked")), "C one line per page")
        rcs = sorted((tmp / "kb" / "receipts" / "library_checks").glob("*.json"))
        rc_check = [json.loads(x.read_text(encoding="utf-8")) for x in rcs if not x.name.endswith("-list.json")]
        rc_list = [json.loads(x.read_text(encoding="utf-8")) for x in rcs if x.name.endswith("-list.json")]
        check(len(rc_check) == 1 and len(rc_check[0].get("checks", [])) == 7 and len(rc_list) == 1 and len(rc_list[0].get("listed", [])) == 3
              and all(e["before"].get("public_listed") is False for e in rc_list[0]["listed"]),
              "A B a check receipt with the rows, and a listing receipt with each listing's before-values")

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
w = rec("w", publish_target="public", public_summary="For the public.")
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

# ── R. The second read of #3581 (the S688 conductor, items 1 to 6) ───────────────────────────────────────────────
tmpr = Path(tempfile.mkdtemp(prefix="libcheck-r-"))
saved = (lp.api, lc.ROOT, lc.RECEIPTS)
try:
    lc.ROOT, lc.RECEIPTS = tmpr, tmpr / "kb" / "receipts" / "library_checks"
    for slug in ("a", "b", "c", "listed", "odd", "nosum"):
        (tmpr / "library" / slug).mkdir(parents=True)
        (tmpr / "library" / slug / "index.html").write_text(PAGE, encoding="utf-8")
    pg = lambda s: (tmpr / "library" / s / "index.html").read_text(encoding="utf-8")  # noqa: E731
    RS = {s: rec(s, publish_target="public", public_summary="For the public.") for s in ("a", "b", "c")}
    RS["odd"] = rec("odd", publish_target="public", public_summary="For the public.", version="3 (revised)")
    RS["nosum"] = rec("nosum", publish_target="public")
    posted, patched, prior, at_patch = [], [], [], []

    def api_r(path, method="GET", body=None, headers=None):
        if path.startswith("cpl_library_division_settings"):
            return list(SET.values())
        if path.startswith("cpl_library_checks") and method == "GET":
            return list(posted) + list(prior)
        if path.startswith("cpl_library_checks") and method == "POST":
            # The database refuses the whole batch when one row breaks its key check.
            if any(not lc.KEY_OK.match(b["version_key"]) for b in body):
                raise RuntimeError("HTTP 400 cpl_library_checks_version_key_check")
            out = [dict(b, id="n%d" % i, checked_at="2026-11-20T20:00:00+00:00", created_at="2026-11-20T20:00:00+00:00")
                   for i, b in enumerate(body)]
            posted.extend(out)
            return out
        if path.startswith("cpl_library?select=*&retired_at"):
            return [dict(r) for r in RS.values()]
        if path.startswith("cpl_library?select=*&id=eq."):
            i = path.split("id=eq.", 1)[1]
            return [dict(r) for r in RS.values() if r["id"] == i]
        if method == "PATCH":
            patched.append(path)
            at_patch.append(pg("b"))
            if "id-c" in path:
                raise RuntimeError("HTTP 503")
            return [dict(body)]
        raise AssertionError(path)

    lp.api = api_r
    eng = {"targets": {"a": {"pass": True}, "a-dark": {"pass": True}, "b": {"pass": False, "findings": 3, "lines": ["x"]},
                       "b-dark": {"pass": True}, "c": {"pass": True}, "c-dark": {"pass": True},
                       "nosum": {"pass": True}, "nosum-dark": {"pass": True}}}
    # 5. A version label outside the table's key check: the plan skips it with its reason, and never sends it.
    pl = lc.plan(list(RS.values()), [], ["a", "b", "c", "odd", "nosum"], tmpr)
    sk = lc.skipped(list(RS.values()), ["a", "b", "c", "odd", "nosum"], tmpr)
    check("odd" not in pl and sk == [{"slug": "odd", "why": lc.row_problem(RS["odd"])}] and "3 (revised)" in sk[0]["why"],
          "R5 ⭐ a version label no check record can carry is skipped in the plan, with its reason in plain words")
    (tmpr / "p.json").write_text(json.dumps({"check": ["a", "b", "c", "odd", "nosum"], "skipped": []}), encoding="utf-8")
    raised = ""
    import contextlib
    import io
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        lc.check_phase(str(tmpr / "p.json"), engine=lambda s, o: eng, now=datetime(2026, 11, 20, 20, tzinfo=timezone.utc))
    lines_out = buf.getvalue().strip().splitlines()
    outj = json.loads(lines_out[-1]) if lines_out else {"skipped": [], "to_list": []}
    (tmpr / "check.json").write_text(json.dumps(outj), encoding="utf-8")
    lbuf = io.StringIO()
    try:
        with contextlib.redirect_stdout(lbuf):
            lc.list_phase(str(tmpr / "check.json"))
    except RuntimeError as e:
        raised = str(e)
    lout = lbuf.getvalue().strip().splitlines()
    lj = json.loads(lout[-1]) if lout else {"waiting": []}
    check(len(posted) == 4 and not any(p["library_id"] == "id-odd" for p in posted)
          and any(x["slug"] == "odd" and "cannot carry a check record" in x["why"] for x in outj["skipped"]),
          "R5 ⭐ one bad row never blocks the batch: the rest go in, and check.json names the skipped page and why")
    # 1. A listing that fails mid-run leaves a receipt naming every row and every listing tried, with before-values.
    rcl = sorted(lc.RECEIPTS.glob("*-list.json"))
    rcc = [x for x in lc.RECEIPTS.glob("*.json") if not x.name.endswith("-list.json")]
    body = json.loads(rcl[0].read_text(encoding="utf-8")) if rcl else {}
    lst = {x["slug"]: x for x in body.get("listed", [])}
    check("HTTP 503" in raised and len(rcc) == 1 and len(json.loads(rcc[0].read_text(encoding="utf-8")).get("checks", [])) == 4,
          "R1 ⭐ the check receipt is on disk with every check row, and the listing that raised went red")
    check(lst.get("a", {}).get("listed") is True and str(lst.get("c", {}).get("listed", "")).startswith("unknown")
          and lst["c"]["before"].get("seen_by") == "team" and "public_summary" in lst["c"]["before"],
          "R1 ⭐ each listing's before-values (seen_by, public_summary) were written before its update, the failed one too")
    check(at_patch and all("Not yet certified" in x and "report linked" not in x for x in at_patch)
          and "Not yet certified" in pg("b") and "report linked" in pg("a"),
          "R1 ⭐ the lines are rewritten from the rows written before any listing: the page that failed reads Not yet certified")
    reports = sorted(p.name for p in tmpr.rglob("*.txt"))
    check(len(reports) == 4, "R1 the reports on disk are the four the receipt's rows link: %s" % reports)
    # 4. A passing piece with no public summary a person typed is not listed, and says why.
    check(not any("id-nosum" in p for p in patched) and {"slug": "nosum", "why": "it needs a public summary"} in lj["waiting"],
          "R4 ⭐ a piece with no public summary is never listed with its internal summary or title; it waits, and says why")
    # 1. A failure right after the insert (the first fresh read of a record) still leaves the receipt of the rows.
    for f in list(tmpr.rglob("*.txt")) + list(lc.RECEIPTS.glob("*.json")):
        f.unlink()
    posted.clear()
    api_ok = api_r

    def api_read_fails(path, method="GET", body=None, headers=None):
        return api_ok(path, method, body, headers)
    lp.api = api_read_fails
    saved_restamp = lc.restamp

    def restamp_fails(*a, **k):
        raise RuntimeError("a disk error in the restamp")
    lc.restamp = restamp_fails
    (tmpr / "p1.json").write_text(json.dumps({"check": ["a"], "skipped": []}), encoding="utf-8")
    try:
        with contextlib.redirect_stdout(io.StringIO()):
            lc.check_phase(str(tmpr / "p1.json"), engine=lambda s, o: eng, now=datetime(2026, 11, 20, 20, 30, tzinfo=timezone.utc))
    except RuntimeError:
        pass
    lc.restamp = saved_restamp
    rc1 = list(lc.RECEIPTS.glob("*.json"))
    check(len(rc1) == 1 and len(json.loads(rc1[0].read_text(encoding="utf-8")).get("checks", [])) == 1,
          "R1 ⭐ the receipt is written as soon as the rows are in, before anything after the insert can fail")
    lp.api = api_r
    # 2. The line binds to the page's content (the third round on #3581): a pass prints only while the latest check's
    # committed proof has the page's sha now. The reader's two-run case first: a listed v2 whose new v3 page was pushed
    # and left by --finish, then a second run three hours later that writes nothing.
    for f in list(tmpr.rglob("*.txt")) + list(tmpr.rglob("accessibility/*.json")):
        f.unlink()
    RS.clear()
    L = rec("listed", public_listed=True, seen_by="public", public_summary="For the public.")
    RS["listed"] = L
    OLD_PAGE = lc.stamp(PAGE.replace("<h1>T</h1>", "<h1>Version 2</h1>"), lc.footer_block(None, SET["cobi"]))
    rel = "library/listed/accessibility/20261119-180000Z.txt"
    c1 = chk(L, at="2026-11-19T18:00:00+00:00", report_url=lc.SITE + rel)
    prior[:] = [c1]
    (tmpr / rel).parent.mkdir(parents=True, exist_ok=True)
    (tmpr / rel).write_text("report\n", encoding="utf-8")
    (tmpr / rel[:-4]).with_suffix(".json").write_text(json.dumps({"check_id": c1["id"], "version_key": c1["version_key"], "url": c1["url"],
                                                                  "result": "pass", "sha256": lc.content_hash(OLD_PAGE)}), encoding="utf-8")
    page_file = tmpr / "library" / "listed" / "index.html"
    page_file.write_text(OLD_PAGE, encoding="utf-8")
    with contextlib.redirect_stdout(io.StringIO()):
        lc.check_phase(str(tmpr / "none.json"), engine=lambda s, o: eng, now=datetime(2026, 11, 20, 19, tzinfo=timezone.utc))
    check("report linked" in pg("listed"), "R2 ⭐ a same-content restamp keeps the pass: the page its check saw prints the check's line")
    page_file.write_text(lc.stamp(PAGE.replace("<h1>T</h1>", "<h1>NEW v3</h1>"), lc.footer_block(None, SET["cobi"])), encoding="utf-8")
    (tmpr / "fin.json").write_text(json.dumps({"moved": [], "left_for_next_run": ["listed"]}), encoding="utf-8")
    for n, when, fin in ((1, 20, "fin.json"), (2, 23, "none.json")):
        plan_out = tmpr / ("p2-%d.json" % n)
        with contextlib.redirect_stdout(io.StringIO()):
            lc.plan_phase(str(tmpr / fin), str(plan_out))
            lc.check_phase(str(plan_out), engine=lambda s, o: eng, now=datetime(2026, 11, 20, when, tzinfo=timezone.utc))
        check("Not yet certified" in pg("listed") and "report linked" not in pg("listed"),
              "R2 ⭐ run %d: the new page nobody checked reads Not yet certified, though the record still holds v2's pass%s"
              % (n, " (a later run that writes nothing included)" if n == 2 else ""))
    # One byte changed after its check, and back again (with no newer check than c1: the two runs above checked v3).
    check(any(x["library_id"] == "id-listed" and x["result"] == "fail" for x in posted),
          "R2 ⭐ the drifted page was planned and checked again (it is the page the record names)")
    posted.clear()
    page_file.write_text(OLD_PAGE.replace("Version 2", "Version 2."), encoding="utf-8")
    with contextlib.redirect_stdout(io.StringIO()):
        lc.check_phase(str(tmpr / "none.json"), engine=lambda s, o: eng, now=datetime(2026, 11, 21, 2, tzinfo=timezone.utc))
    check("Not yet certified" in pg("listed"), "R2 ⭐ a page edited by one byte after its check reads Not yet certified")
    page_file.write_text(OLD_PAGE, encoding="utf-8")
    with contextlib.redirect_stdout(io.StringIO()):
        lc.check_phase(str(tmpr / "none.json"), engine=lambda s, o: eng, now=datetime(2026, 11, 21, 5, tzinfo=timezone.utc))
    check("report linked" in pg("listed"), "R2 and the same content back prints the pass again")
    bad = dict(json.loads((tmpr / rel[:-4]).with_suffix(".json").read_text(encoding="utf-8")), check_id="someone-else")
    (tmpr / rel[:-4]).with_suffix(".json").write_text(json.dumps(bad), encoding="utf-8")
    with contextlib.redirect_stdout(io.StringIO()):
        lc.check_phase(str(tmpr / "none.json"), engine=lambda s, o: eng, now=datetime(2026, 11, 21, 8, tzinfo=timezone.utc))
    check("Not yet certified" in pg("listed"), "R2 a proof that names another check never prints this one's pass")
    check(lc.content_hash(lc.stamp(OLD_PAGE, lc.footer_block(c1, SET["cobi"]))) == lc.content_hash(OLD_PAGE),
          "R2 the content hash leaves the accessibility line out, so the line itself never changes it")
    # 1. An insert that errs after some rows landed: the rows are read back by created_by and get their receipt.
    RS.clear()
    RS["a"] = rec("a", publish_target="internal")
    page_file_a = tmpr / "library" / "a" / "index.html"
    page_file_a.write_text(PAGE, encoding="utf-8")
    landed_rows = []

    def api_timeout(path, method="GET", body=None, headers=None):
        if path.startswith("cpl_library_checks") and method == "POST":
            landed_rows[:] = [dict(b, id="late-%d" % i, checked_at="2026-11-21T10:00:00+00:00", created_at="2026-11-21T10:00:00+00:00")
                              for i, b in enumerate(body)]
            raise RuntimeError("HTTP 504 after the commit")
        if path.startswith("cpl_library_checks?select=") and "created_by=eq." in path:
            return list(landed_rows)
        return api_r(path, method, body, headers)
    lp.api = api_timeout
    for f in lc.RECEIPTS.glob("*.json"):
        f.unlink()
    (tmpr / "p3.json").write_text(json.dumps({"check": ["a"], "skipped": []}), encoding="utf-8")
    raised = ""
    try:
        with contextlib.redirect_stdout(io.StringIO()):
            lc.check_phase(str(tmpr / "p3.json"), engine=lambda s, o: eng, now=datetime(2026, 11, 21, 10, tzinfo=timezone.utc))
    except RuntimeError as e:
        raised = str(e)
    rc3 = list(lc.RECEIPTS.glob("*.json"))
    got3 = json.loads(rc3[0].read_text(encoding="utf-8")).get("checks", []) if rc3 else []
    check("504" in raised and len(got3) == 1 and got3[0]["id"] == "late-0" and "report linked" in pg("a")
          and (tmpr / "library/a/accessibility/20261121-100000Z.json").exists(),
          "R1 ⭐ rows that landed though the insert erred are read back by created_by: receipt, proof and line, and the step goes red")
    lp.api = api_r
    # 3. should_list reads page_changed_at as latest_check and the tab do.
    z = rec("z", publish_target="public", public_summary="For the public.", page_changed_at="2026-11-20T20:05:00+00:00")
    zr = {"library_id": "id-z", "url": z["url"], "version_key": "version:2", "result": "pass", "checked_at": "2026-11-20T20:00:00+00:00"}
    check(not lc.should_list(z, zr) and lc.should_list(z, dict(zr, checked_at="2026-11-20T20:06:00+00:00")),
          "R3 ⭐ should_list refuses a pass older than the page's last change, and takes one after it")
    # 6. A rerun is a new attempt.
    saved_env = {k: os.environ.get(k) for k in ("GITHUB_RUN_ID", "GITHUB_RUN_ATTEMPT")}
    os.environ["GITHUB_RUN_ID"], os.environ["GITHUB_RUN_ATTEMPT"] = "77", "2"
    lab = lc.run_label()
    for k, v in saved_env.items():
        os.environ.pop(k, None) if v is None else os.environ.__setitem__(k, v)
    check(lab[0] == "library-publish.yml run 77 attempt 2" and lab[1].endswith("/runs/77/attempts/2"),
          "R6 created_by names the run attempt, so a rerun's rows are its own")
finally:
    lp.api, lc.ROOT, lc.RECEIPTS = saved
    shutil.rmtree(tmpr, ignore_errors=True)

# COBIx on #3581 (7029334238): the PATCH that puts publish_target back to public is checked and recorded.
tmpu = Path(tempfile.mkdtemp(prefix="libcheck-u-"))
saved = (lp.api, lc.ROOT, lc.RECEIPTS)
try:
    lc.ROOT, lc.RECEIPTS = tmpu, tmpu / "rc"
    (tmpu / "library" / "moved").mkdir(parents=True)
    (tmpu / "library" / "moved" / "index.html").write_text(PAGE, encoding="utf-8")
    M = rec("moved", publish_target="public", public_listed=True, seen_by="public", public_summary="For the public.")
    oldm = [with_proof(tmpu, M, "pass", "2026-11-20T17:00:00+00:00", PAGE.replace("<h1>T</h1>", "<h1>Before</h1>"))]
    sent = []

    def api_u(path, method="GET", body=None, headers=None):
        if path.startswith("cpl_library_division_settings"):
            return list(SET.values())
        if path.startswith("cpl_library_checks") and method == "GET":
            return list(oldm)
        if path.startswith("cpl_library_checks") and method == "POST":
            return [dict(b, id="u%d" % i, checked_at="2026-11-20T20:00:00+00:00", created_at="x") for i, b in enumerate(body)]
        if path.startswith("cpl_library?select=*"):
            return [dict(M)]
        if method == "PATCH":
            sent.append((path, body))
            return [] if "publish_target" in body else [dict(M, public_listed=False)]   # the restore matches no row
        raise AssertionError(path)
    lp.api = api_u
    (tmpu / "pu.json").write_text(json.dumps({"check": ["moved"], "skipped": []}), encoding="utf-8")
    raised = ""
    import contextlib
    import io
    try:
        with contextlib.redirect_stdout(io.StringIO()):
            lc.check_phase(str(tmpu / "pu.json"), engine=lambda s_, o: {"targets": {"moved": {"pass": True}, "moved-dark": {"pass": True}}},
                           now=datetime(2026, 11, 20, 20, tzinfo=timezone.utc))
    except RuntimeError as e:
        raised = str(e)
    rcu = list((tmpu / "rc").glob("*.json"))
    ent = (json.loads(rcu[0].read_text(encoding="utf-8")).get("unlisted") or [{}])[0] if rcu else {}
    check(len(sent) == 2 and ent.get("unlisted") is True and ent.get("publish_target_restored") is False
          and "putting publish_target back to public matched no row" in raised,
          "⭐ a restore of publish_target that matches no row is recorded in the receipt and turns the step red (COBIx, 7029334238)")
finally:
    lp.api, lc.ROOT, lc.RECEIPTS = saved
    shutil.rmtree(tmpu, ignore_errors=True)

# 6. Both push loops fail the step after three failed pushes, so no report link points at a commit that never landed.
WF = Path(__file__).resolve().parent.parent.joinpath(".github", "workflows", "library-publish.yml").read_text(encoding="utf-8")
loops = WF.count("for i in 1 2 3; do")
check(loops == 3 and WF.count('if git push origin HEAD:main; then pushed=1; break; fi') == 3
      and WF.count('[ "$pushed" = 1 ] || { echo "::error::') == 3,
      "R6 ⭐ both push loops fail the step when the third push fails")
check("commits only what the receipt proves" in WF, "R1 the checks commit names its rule: whatever is on disk is what the receipt proves")
iL, iP = WF.find("- name: List on a pass"), WF.find("- name: Commit and push the checks")
check(iP > 0 and iL > iP and "if: ${{ !cancelled() && steps.checkpush.outcome == 'success' }}" in WF[iL:iL + 400]
      and "--list --check-file check.json" in WF[iL:iL + 600] and "--list" not in WF[:iP],
      "⭐ the listing is its own step after the checks commit is pushed, and runs only when that push succeeded")
check(WF.count("if git push origin HEAD:main; then pushed=1; break; fi") == 3, "every push loop fails its step after three failed pushes")

# scripts/library_page.py cannot read a check record: every page it writes reads Not yet certified until the run's
# restamp proves the content (certified_check).
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
    check("report linked" not in again and "Not yet certified" in again and again.count("cpl-library-check:") == 1,
          "⭐ a hand rebuild through library_page.py never keeps an old pass line: it reads Not yet certified until the run proves it")
finally:
    lpg.ROOT = saved_root
    shutil.rmtree(tmpp, ignore_errors=True)

print("\nlibrary_check_test.py: %s" % ("all checks passed" if not fails else "%d FAILED" % len(fails)))
sys.exit(1 if fails else 0)
