#!/usr/bin/env python3
"""S703's one follow-up PR (r-collection-first-sam-2026-11-20): S697's four findings left on #3644
(f-followup-four-left-s697), a `through` field on a page pin (d-clovis-through-pin-to-followup-s703) and the
named-gaps rollback's tag. One check group per item, each guarding the failure it names.

    python3 tests/program_requirements_follow_up_s703_test.py

  1. The own-run filter in kb/_program_reread_keep_better.py: an only= filing carries an earlier kept_passing entry
     with the run that wrote it, and None where the earlier file named no run. `str(e.get("run") or run) == run`
     counted that None entry as this run's. This run's own entries carry no run key, so the count takes them alone.
  2. named_fragment read any '=' as viewer parameters, so #/program?id=1 and #/program?id=2 were one page, and so
     were two PDF named destinations (#nameddest=a, #nameddest=b). Only the PDF open parameters name no place.
  3. EDITION_TOKEN joined catalog-v24.pdf and catalog-v25.pdf as two editions of one catalog. An edition is one
     digit, or two below 20 (S697's v12 and v13 stay editions); a two-digit token from 20 up is a year.
  4. A capture-only prior read (no records/) whose PDF gave no page ended red after #3644 put read_short before
     file_prior (College of the Desert's preview 44711759115, pages_total 0). It files its preview and ends green;
     a prior read that extracted still refuses.
  5. A pin's `through`: the title words may print across the pinned page through `through`, and pdf_best reads the
     pinned page through it and no page after, a page naming no listed course included, and `through` is at most
     PDF_RUN_PAGES past the pin. A pin without
     `through` binds and reads exactly as before (Cosumnes River's S650 pins on their fixture).
  6. kb/_program_named_gaps.py --receipt R --applied M named the rollback after the default tag s680 unless --tag was
     passed. It takes the tag from the receipt's file name, refuses a --tag that differs, and refuses a name with no tag.
  7. Self-recall (second reader on #3683): over every committed folder, same_page, names_page, same_file,
     named_fragment and pdf_page_of answer as main's definitions do. Swapping main's named_fragment and
     EDITION_TOKEN into the module gives main's answers, since every other page call is the same code.
Item 2 also covers the second reader's two shapes (#:~:text= and #page=12&zoom), and item 4 the 528-page preview
an empty read must not replace (City College of San Francisco, run 44777204746).
"""
import io
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from contextlib import redirect_stderr, redirect_stdout

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_named_gaps as G  # noqa: E402
import _program_requirements_college as C  # noqa: E402
import _program_requirements_reconcile as R  # noqa: E402
import _program_reread_keep_better as K  # noqa: E402

FAILS = []
N = [0]


def check(ok, what):
    N[0] += 1
    print(("ok   " if ok else "FAIL ") + what)
    if not ok:
        FAILS.append(what)


def dump(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as fh:
        json.dump(obj, fh)


def load(path):
    with open(path) as fh:
        return json.load(fh)


def git(cwd, *args):
    subprocess.run(["git", *args], cwd=cwd, check=True, capture_output=True)


_tmp = tempfile.mkdtemp(prefix="follow_up_s703_")
_saved_dir = C.COLLEGE_DIR
try:
    # ── 1. The own-run filter: a carried entry with a None run is never this run's ─────────────────────────
    PASS = {"pass": True, "coverage": {"placed": 4, "listed": 4, "share": 1.0, "none_placed": False, "pass": True},
            "invented": {"pass": True}, "arithmetic": {"status": "equal"}}
    repo = os.path.join(_tmp, "keep")
    os.makedirs(repo)
    git(repo, "init", "-q")
    git(repo, "config", "user.email", "t@example.com")
    git(repo, "config", "user.name", "t")
    folder = os.path.join(repo, "kb", "program_requirements_college", "fixture")

    def rec(cn, run):
        return {"college": "Fixture College", "control_number": cn, "title": "Business Administration",
                "award": "A.S. Degree", "source_url": "https://x.edu/cat.pdf#page=1", "extracted_run": run,
                "score": PASS, "record": {"program": {"section_heading": "Business Administration, A.S."},
                                          "blocks": []}}
    for cn in ("70001", "70002", "70003", "70004"):
        dump(os.path.join(folder, "records", cn + ".json"), rec(cn, 111))
    dump(os.path.join(folder, "capture.json"), {"run": "111"})
    git(repo, "add", "-A")
    git(repo, "commit", "-qm", "base")
    git(repo, "tag", "base")
    dump(os.path.join(folder, "records", "70001.json"), rec("70001", 222))
    dump(os.path.join(folder, "capture.json"), {"run": "222"})

    def guard_count(programs):
        dump(os.path.join(folder, "kept_passing.json"), {"run": "222", "programs": programs})
        acct = K.keep_better(folder, base="base", checked=set(), out=lambda *_: None)
        return acct["counts"]["kept_by_extraction_guard"], sorted(acct["runs"]["222"]["kept_by_extraction_guard"])

    own = [{"control_number": "70002", "reason": "passes_less"}]
    carried = [{"control_number": "70003", "reason": "covers_less", "run": "111"}]
    unstamped = [{"control_number": "70004", "reason": "passes_less", "run": None}]
    check(guard_count(own) == (1, ["70002"]), "1 this run's own entry (no run key) counts as this run's")
    check(guard_count(own + carried) == (1, ["70002"]), "1 an entry carried with an earlier run is not counted")
    check(guard_count(own + carried + unstamped) == (1, ["70002"]),
          "1 an entry carried with a None run (the earlier file named none) is not counted (%s)"
          % (guard_count(own + carried + unstamped),))
    check(guard_count(own + [dict(carried[0], run="222")]) == (2, ["70002", "70003"]),
          "1 an entry stamped with this run's own number counts")
    # The writer's side: a carried entry always holds the run key, None when the earlier file named no run.
    _cn = ["80001", "80002"]
    base = os.path.join(_tmp, "writer", "filed")
    dest = os.path.join(base, C.slug_of("Writer College"))
    for cn in _cn:
        dump(os.path.join(dest, "records", cn + ".json"),
             {"college": "Writer College", "control_number": cn, "title": "P" + cn, "source_url": "https://o/%s" % cn,
              "record": {"program": {}, "blocks": [{"name": "Core"}]}, "score": PASS, "extracted_run": "1"})
    dump(os.path.join(dest, "sources.json"), [{"control_number": cn, "source": {"url": "https://o/%s" % cn}}
                                              for cn in _cn])
    dump(os.path.join(dest, "kept_passing.json"), {"programs": [{"control_number": "80002", "reason": "covers_less"}]})
    C.COLLEGE_DIR = base
    out = os.path.join(_tmp, "writer", "out")
    for cn in _cn:
        dump(os.path.join(out, "sources", cn + ".json"),
             {"college": "Writer College", "control_number": cn, "title": "P" + cn, "closed_list": [{"code": "A 1"}],
              "text": "A 1 Core", "coverage": 1.0, "codes_found": ["A1"], "method": "pdf_pages",
              "source": {"url": "https://o/%s" % cn}})
        os.makedirs(os.path.join(out, "records"), exist_ok=True)
        shutil.copyfile(os.path.join(dest, "records", cn + ".json"), os.path.join(out, "records", cn + ".json"))
    dump(os.path.join(out, "capture.json"), {"college": "Writer College", "programs": 2, "with_closed_list": 2,
                                             "pdf": {"url": "https://o/c.pdf", "access": "ok", "pages_total": 9}})
    dump(os.path.join(out, "not_named_0.json"), {"only": ["80001"], "programs": ["80002"]})
    dump(os.path.join(out, "extract_account_0.json"),
         {"run": "9", "shard": 0, "calls": 1, "sent": ["80001"], "finished": True, "failed": []})
    dump(os.path.join(out, "kept_passing_0.json"), [{"control_number": "80001", "reason": "passes_less"}])
    os.environ["SUPABASE_SERVICE_KEY"] = os.environ.get("SUPABASE_SERVICE_KEY") or "test"
    with redirect_stdout(io.StringIO()):
        rc = C.file_run("Writer College", out, "9")
    kp = load(os.path.join(dest, "kept_passing.json"))
    by = {e["control_number"]: e for e in kp["programs"]}
    check(rc == 0 and "run" not in by["80001"] and "run" in by["80002"] and by["80002"]["run"] is None,
          "1 the filing writes its own entry with no run key and the carried one with run None (%s)" % kp)

    # ── 2. named_fragment: a route or a named destination names a place ──────────────────────────────────
    NF = C.named_fragment
    check(NF("https://c.edu/x.pdf#page=12&zoom=100") == "" and NF("https://c.edu/x.pdf#page=3") == ""
          and NF("https://c.edu/x.pdf") == "" and NF("https://c.edu/x.pdf#view=FitH&pagemode=bookmarks") == "",
          "2 PDF viewer parameters alone name no place, as before")
    check(NF("https://c.edu/p/#accounting-aa") == "accounting-aa", "2 a plain fragment names a place, as before")
    check(not C.same_page("https://c.edu/catalog/#/program?id=1", "https://c.edu/catalog/#/program?id=2")
          and not C.names_page("https://c.edu/catalog/#/program?id=1", "https://c.edu/catalog/#/program?id=2"),
          "2 #/program?id=1 and #/program?id=2 are two pages")
    check(C.same_page("https://c.edu/catalog/#/program?id=1", "https://C.edu/catalog/#/program?id=1"),
          "2 one route spelled two ways is one page")
    check(not C.same_page("https://c.edu/c.pdf#nameddest=accounting", "https://c.edu/c.pdf#nameddest=biology"),
          "2 two named destinations are two places (#nameddest=)")
    check(C.same_page("https://c.edu/c.pdf#nameddest=accounting&zoom=100", "https://c.edu/c.pdf#nameddest=accounting"),
          "2 a viewer parameter beside a named destination is set aside")
    check(C.same_page("https://c.edu/c.pdf#page=129", "https://c.edu/c.pdf#page=130&zoom=100"),
          "2 a PDF page one off, with a viewer parameter, is still one page")
    # Second reader on #3683: a text fragment and a viewer setting with no value name no place.
    check(NF("https://c.edu/p/#:~:text=Business%20Administration") == ""
          and NF("https://c.edu/p/#accounting-aa:~:text=Core") == "accounting-aa"
          and C.same_page("https://c.edu/p/", "https://c.edu/p/#:~:text=Total%20Units")
          and C.same_page("https://c.edu/p/#:~:text=a", "https://c.edu/p/#:~:text=b"),
          "2 a text fragment (#:~:text=) is set aside: no place, and a name before it stands")
    check(NF("https://c.edu/x.pdf#page=12&zoom") == "" and NF("https://c.edu/x.pdf#zoom") == ""
          and C.same_page("https://c.edu/x.pdf#page=12&zoom", "https://c.edu/x.pdf#page=12"),
          "2 a viewer setting with no value (#page=12&zoom) is still a viewer setting")

    # ── 3. EDITION_TOKEN: one digit ──────────────────────────────────────────────────────────────────────
    check(not C.same_file("https://c.edu/docs/catalog-v24.pdf", "https://c.edu/docs/catalog-v25.pdf"),
          "3 catalog-v24.pdf and catalog-v25.pdf are two files")
    check(not C.same_file("https://c.edu/catalog_v2025.pdf", "https://c.edu/catalog_v2026.pdf"),
          "3 catalog_v2025.pdf and catalog_v2026.pdf stay two files")
    check(C.same_file("https://c.edu/2026-27-Catalog-v2-508.pdf", "https://c.edu/2026-27-Catalog-v3-508.pdf"),
          "3 Canyons' v2 and v3 stay one catalog's two editions")
    check(C.same_file("https://c.edu/docs/catalog-v12.pdf", "https://c.edu/docs/catalog-v13.pdf")
          and not C.same_file("https://c.edu/docs/catalog-v19.pdf", "https://c.edu/docs/catalog-v20.pdf"),
          "3 v12 and v13 stay editions (S697); v20 and up is a year, never joined to an edition")

    # ── 4. A capture-only prior read with no PDF page files its preview ──────────────────────────────────
    PRIOR = {"only": ["1", "2"], "catalog_year": "2025-2026", "start": "https://x.example/old.pdf", "format": "pdf"}
    base = os.path.join(_tmp, "prior", "filed")
    dest = os.path.join(base, C.slug_of("Prior College"))
    dump(os.path.join(dest, "records", "1.json"), {"control_number": "1", "score": PASS})
    dump(os.path.join(dest, "prior_2025-2026.json"), {"run": "8", "filed": ["1"], "kept": []})
    C.COLLEGE_DIR = base
    out = os.path.join(_tmp, "prior", "out")
    desert = {"college": "Prior College", "programs": 8, "with_closed_list": 8, "prior": PRIOR,
              "pdf": {"url": None, "access": "no_address", "pages_total": 0}}
    dump(os.path.join(out, "capture.json"), desert)
    buf = io.StringIO()
    with redirect_stdout(buf):
        rc = C.file_run("Prior College", out, "44711759115")
    said = buf.getvalue()
    pv = os.path.join(dest, "prior_2025-2026_preview.json")
    check(rc == 0 and os.path.isfile(pv) and load(pv)["pdf"]["access"] == "no_address" and "gave no page" in said,
          "4 a capture-only prior read whose PDF gave no page files its preview and ends green (rc %r: %s)"
          % (rc, said.strip()[:160]))
    check(load(os.path.join(dest, "prior_2025-2026.json")) == {"run": "8", "filed": ["1"], "kept": []}
          and os.path.isfile(os.path.join(dest, "records", "1.json")),
          "4 the earlier prior read's account and the records stay as filed")
    # Second reader on #3683: an empty read never replaces a preview whose PDF gave pages (City College of San
    # Francisco's 528-page preview of run 44777204746, committed on main).
    ccsf = {"college": "Prior College", "programs": 27, "with_closed_list": 27, "prior": PRIOR, "run": "44777204746",
            "pdf": {"url": "https://www.ccsf.edu/sites/default/files/2026/document/ccsf-catalog-2025-2026.pdf",
                    "pages_total": 528, "access": "ok"}}
    dump(pv, ccsf)
    with redirect_stdout(io.StringIO()) as b1:
        rc = C.file_run("Prior College", out, "44711759118")
    check(rc != 0 and load(pv) == ccsf and "528 PDF pages" in b1.getvalue(),
          "4 an empty read keeps a filed 528-page preview as filed, and ends red (rc %r: %s)"
          % (rc, b1.getvalue().strip()[:160]))
    dump(pv, dict(ccsf, pdf={"url": None, "access": "no_address", "pages_total": 0}))
    with redirect_stdout(io.StringIO()):
        rc = C.file_run("Prior College", out, "44711759119")
    check(rc == 0 and load(pv)["run"] == "44711759119", "4 an empty read replaces an empty preview, and ends green")
    os.makedirs(os.path.join(out, "records"))
    with redirect_stdout(io.StringIO()) as b2:
        rc = C.file_run("Prior College", out, "44711759116")
    check(rc != 0 and "gave no page" in b2.getvalue(), "4 a prior read that extracted, with no PDF page, still ends red")
    plain = os.path.join(_tmp, "plain", "out")
    dump(os.path.join(plain, "capture.json"), dict(desert, prior=None, college="Prior College"))
    with redirect_stdout(io.StringIO()):
        rc = C.file_run("Prior College", plain, "44711759117")
    check(rc != 0, "4 a plain capture-only read with no PDF page ends red, as before")

    # ── 5. A pin's through ───────────────────────────────────────────────────────────────────────────────
    filler = ["Course descriptions\nART 1 Drawing (3)"] * 3
    core = ("BUSINESS ADMINISTRATION ASSOCIATE IN SCIENCE DEGREE\nCatalog Description\nCore\nBA 5 Intro 3\n"
            "BA 10 Law 3\nBA 33 Math 3\n")
    options = "Entrepreneur Option\nBA 20 Small business 3\nBA 21 Startups 3\n"
    pages = filler + [core, options] + filler            # the pin's page is p.4, the option prints on p.5
    ent = {"control_number": "33432", "title": "Business Administration: Entrepreneur",
           "closed_list": [{"code": c} for c in ("BA 5", "BA 10", "BA 33", "BA 20", "BA 21")]}
    words = "BUSINESS ADMINISTRATION ASSOCIATE IN SCIENCE DEGREE Catalog Description"
    head, why = C.pdf_pinned_heading(pages, ent, {"page": 4, "words": words})
    check(head is None and why == "PDF page 4 does not print every title word",
          "5 without through, the core page that lacks 'Entrepreneur' binds nothing, as before (%s)" % why)
    head, why = C.pdf_pinned_heading(pages, ent, {"page": 4, "through": 5, "words": words})
    got = C.pdf_best("https://x.edu/c.pdf", pages, ent, ent["closed_list"], "pypdf", head)
    check(why is None and head == {"page": 3, "at": 0, "pinned": True, "through": 4}
          and got["pages"] == [4, 5] and got["url"].endswith("#page=4") and got["coverage"] == 1.0,
          "5 through p.5 binds across the page break and reads pp.4-5 (%s, %s)" % (why, got and got["pages"]))
    # A section whose total prints on a page naming no listed course (Clovis 33492's p.149).
    ss = ("SOCIAL SCIENCE ASSOCIATE IN ARTS DEGREE\nRequired courses\nSOC 1A Intro 3\nHIST 12 US 3\nPSY 2 General 3\n"
          "Select two courses from List A\n")
    tail = "List A: any course in anthropology\nTotal Units for the Major: 18\n"
    pages2 = filler + [ss, tail] + filler
    soc = {"control_number": "33492", "title": "Social Science",
           "closed_list": [{"code": c} for c in ("SOC 1A", "HIST 12", "PSY 2")]}
    sw = "SOCIAL SCIENCE ASSOCIATE IN ARTS DEGREE"
    h0, _ = C.pdf_pinned_heading(pages2, soc, {"page": 4, "words": sw})
    plain_read = C.pdf_best("https://x.edu/c.pdf", pages2, soc, soc["closed_list"], "pypdf", h0)
    h1, why1 = C.pdf_pinned_heading(pages2, soc, {"page": 4, "words": sw, "through": 5})
    thru = C.pdf_best("https://x.edu/c.pdf", pages2, soc, soc["closed_list"], "pypdf", h1)
    check(plain_read["pages"] == [4] and "Total Units" not in plain_read["text"],
          "5 without through, the window stops at the page before the total (%s)" % plain_read["pages"])
    check(why1 is None and thru["pages"] == [4, 5] and "Total Units for the Major: 18" in thru["text"]
          and thru["coverage"] == plain_read["coverage"],
          "5 through p.5 reads the page naming no listed course, and its total (%s)" % thru["pages"])
    # through names the section's last page: the window stops there even where the next pages name listed courses
    # (Clovis 33432: pp.108-109 print the Management degree, whose core names the same BA courses).
    more = "MANAGEMENT ASSOCIATE IN SCIENCE DEGREE\nSOC 2 Problems 3\nSOC 1A Intro 3\n"
    pages3 = filler + [ss, more, more, more, more]
    soc3 = dict(soc, closed_list=soc["closed_list"] + [{"code": "SOC 2"}])
    h3, _ = C.pdf_pinned_heading(pages3, soc3, {"page": 4, "words": sw})
    run3 = C.pdf_best("https://x.edu/c.pdf", pages3, soc3, soc3["closed_list"], "pypdf", h3)["pages"]
    h3, _ = C.pdf_pinned_heading(pages3, soc3, {"page": 4, "words": sw, "through": 5})
    got3 = C.pdf_best("https://x.edu/c.pdf", pages3, soc3, soc3["closed_list"], "pypdf", h3)
    check(run3 == [4, 5, 6, 7] and got3["pages"] == [4, 5],
          "5 a pin without through runs on while pages name listed courses (%s); through p.5 stops at p.5 (%s)"
          % (run3, got3["pages"]))
    for bad, want in (({"through": 3}, "is not from p.4 to p.7"), ({"through": 4 + C.PDF_RUN_PAGES + 1}, "is not from"),
                      ({"through": "five"}, "is not a page number")):
        h, w = C.pdf_pinned_heading(pages2, soc, dict({"page": 4, "words": sw}, **bad))
        check(h is None and want in (w or ""), "5 a through %r binds nothing (%s)" % (bad["through"], w))
    h, w = C.pdf_pinned_heading(pages2[:5], soc, {"page": 4, "words": sw, "through": 6})
    check(h is None and "past the file's last page" in (w or ""), "5 a through past the file binds nothing (%s)" % w)
    h, w = C.pdf_pinned_heading(pages2, soc, {"page": 4, "words": sw, "through": 4})
    check(w is None and h == h0 and "through" not in h, "5 through equal to the pin reads as a pin without it")
    # Existing pins, unchanged: Cosumnes River's S650 pins on their committed fixture bind the same heading, and
    # pdf_best reads the same pages as _pdf_run does from it.
    fx = load(os.path.join(ROOT, "tests", "fixtures", "program_requirements_cosumnes_pinned_pages.json"))
    fpages = [""] * fx["pages_total"]
    for k, v in fx["pages"].items():
        fpages[int(k) - 1] = v
    pins = (R.load_steps().get("Cosumnes River College") or {}).get("pdf_pages") or {}
    same = []
    for p in fx["programs"]:
        prog = dict(p, closed_list=[{"code": c} for c in p["courses"]])
        pin = pins.get(prog["control_number"])
        if not pin or "through" in pin:
            continue
        h, w = C.pdf_pinned_heading(fpages, prog, pin)
        b = C.pdf_best("https://x.edu/c.pdf", fpages, prog, prog["closed_list"], "pypdf", h)
        same.append(w is None and set(h) == {"page", "at", "pinned"}
                    and b["pages"] == [i + 1 for i in C._pdf_run(fpages, h["page"], prog["closed_list"])])
    check(len(same) >= 2 and all(same), "5 Cosumnes River's pins without through bind and read as before (%s)" % same)

    # ── 6. The named-gaps rollback takes the receipt's tag ───────────────────────────────────────────────
    check(G.receipt_day_tag("kb/receipts/program_requirement_records_named_gaps_2026-11-21_s697p2.json")
          == ("2026-11-21", "s697p2"), "6 the receipt's file name gives its day and tag")
    check(G.receipt_day_tag("kb/receipts/some_other_receipt.json") == (None, None), "6 another name gives none")
    rdir = os.path.join(_tmp, "gaps")
    receipt = os.path.join(rdir, "program_requirement_records_named_gaps_2026-11-21_s697p2.json")
    dump(receipt, {"records": [], "by_gap": {}})
    applied = os.path.join(rdir, "migrate.json")
    dump(applied, {})
    seen = {}
    _rp, _wr = G.replan_applied, G.write_rollback

    def fake_replan(body, mig, frm, tag="s680"):
        seen["replan"] = tag
        body["applied"] = {"from": frm, "returned": 0}
        return body

    def fake_write(body, rec_, day, tag):
        seen["write"] = (day, tag)
        return os.path.join(rdir, "%s_%s_prreq_named_gaps_rollback.sql" % (day, tag))
    G.replan_applied, G.write_rollback = fake_replan, fake_write
    try:
        with redirect_stdout(io.StringIO()):
            rc = G.main(["--receipt", receipt, "--applied", applied])
        check(rc == 0 and seen == {"replan": "s697p2", "write": ("2026-11-21", "s697p2")},
              "6 with no --tag, the replan and the rollback take the receipt's tag s697p2, never s680 (%s)" % seen)
        seen.clear()
        with redirect_stdout(io.StringIO()):
            rc = G.main(["--receipt", receipt, "--applied", applied, "--tag", "s697p2"])
        check(rc == 0 and seen.get("write") == ("2026-11-21", "s697p2"), "6 a --tag equal to the receipt's runs")
        for argv, what in ((["--tag", "s680"], "a --tag that differs from the receipt's"), ([], "a receipt name with no tag")):
            seen.clear()
            r = receipt if argv else os.path.join(rdir, "receipt.json")
            if not argv:
                dump(r, {"records": []})
            err = io.StringIO()
            try:
                with redirect_stderr(err), redirect_stdout(io.StringIO()):
                    G.main(["--receipt", r, "--applied", applied] + argv)
                stopped = False
            except SystemExit as e:
                stopped = e.code != 0
            check(stopped and not seen and re.search(r"tag", err.getvalue()),
                  "6 %s stops before anything is written (%s)" % (what, err.getvalue().strip()[-120:]))
    finally:
        G.replan_applied, G.write_rollback = _rp, _wr

    # ── 7. Self-recall over every committed folder: the page calls answer as main's did ───────────────────
    # main's two definitions this PR changes, as #3644 left them; every other page call is the same code, so
    # swapping these two into the module gives main's answers. Over all committed records the two must agree.
    import glob
    import itertools
    import urllib.parse

    MAIN_EDITION = re.compile(r"(?i)(?<![a-z0-9])v(?:er(?:sion)?)?[-_]?\d{1,2}(?![a-z0-9])")

    def main_named_fragment(url):
        frag = urllib.parse.urlparse(url or "").fragment
        return "" if not frag or "=" in frag else frag.lower()

    calls = ("same_page", "names_page", "same_file", "named_fragment", "pdf_page_of")

    def answers(fn_pairs, urls, file_pairs):
        out = {"same_page": [C.same_page(a, b) for a, b in fn_pairs],
               "names_page": [C.names_page(a, b) for a, b in fn_pairs],
               "same_file": [C.same_file(a, b) for a, b in file_pairs],
               "named_fragment": [C.named_fragment(u) for u in urls],
               "pdf_page_of": [C.pdf_page_of(u) for u in urls]}
        return out
    pairs, urls, file_pairs, n_records = [], set(), [], 0
    for folder in sorted(glob.glob(os.path.join(ROOT, "kb", "program_requirements_college", "*"))):
        try:
            entries = {e.get("control_number"): e for e in load(os.path.join(folder, "sources.json"))}
        except (OSError, ValueError):
            entries = {}
        mine = set()
        for path in glob.glob(os.path.join(folder, "records", "*.json")):
            try:
                rec_ = load(path)
            except (OSError, ValueError):
                continue
            n_records += 1
            a = rec_.get("source_url")
            b = ((entries.get(rec_.get("control_number")) or {}).get("source") or {}).get("url")
            mine.update(u for u in (a, b) if u)
            if a and b:
                pairs.append((a, b))
        mine.update(u for u in ((e.get("source") or {}).get("url") for e in entries.values()) if u)
        urls |= mine
        # same_file differs between the two only through the edition token, so the pairs that can differ are the
        # files of one college whose names match once their digits are set aside; every such pair is compared.
        by_shape = {}
        for f in sorted({u.split("#")[0] for u in mine}):
            by_shape.setdefault(re.sub(r"\d+", "#", f.lower()), []).append(f)
        file_pairs.extend(p for fs in by_shape.values() for p in itertools.combinations(fs, 2))
    urls = sorted(urls)
    new = answers(pairs, urls, file_pairs)
    _nf, _et = C.named_fragment, C.EDITION_TOKEN
    C.named_fragment, C.EDITION_TOKEN = main_named_fragment, MAIN_EDITION
    try:
        old = answers(pairs, urls, file_pairs)
    finally:
        C.named_fragment, C.EDITION_TOKEN = _nf, _et
    differ = {k: sum(x != y for x, y in zip(old[k], new[k])) for k in calls}
    check(n_records > 18000 and len(pairs) > 18000 and len(urls) > 16000 and len(file_pairs) > 0
          and not any(differ.values()),
          "7 over %d committed records, %d record/entry pairs, %d addresses and %d same-shape file pairs, every page "
          "call answers as main's did (%s)" % (n_records, len(pairs), len(urls), len(file_pairs), differ))
    # The swap is live: on the shapes this PR changes, main's definitions answer otherwise.
    C.named_fragment, C.EDITION_TOKEN = main_named_fragment, MAIN_EDITION
    try:
        swapped = (C.same_page("https://c.edu/c/#/program?id=1", "https://c.edu/c/#/program?id=2"),
                   C.same_file("https://c.edu/catalog-v24.pdf", "https://c.edu/catalog-v25.pdf"))
    finally:
        C.named_fragment, C.EDITION_TOKEN = _nf, _et
    check(swapped == (True, True), "7 main's definitions, swapped in, still join id=1 with id=2 and v24 with v25")
finally:
    C.COLLEGE_DIR = _saved_dir
    shutil.rmtree(_tmp, ignore_errors=True)

print("%s: %d checks, %d failure(s)" % ("FAIL" if FAILS else "ok", N[0], len(FAILS)))
sys.exit(1 if FAILS else 0)
