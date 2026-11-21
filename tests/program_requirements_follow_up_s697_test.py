#!/usr/bin/env python3
"""The second reader's findings on #3641, fixed in one follow-up PR (S697, r-collection-first-sam-2026-11-20).

    python3 tests/program_requirements_follow_up_s697_test.py

  1. A killed extraction in a wave files nothing. The wave's File step runs under always() after the 345-minute
     timeout kills the extract step, which then never reaches the finally that wrote its account. The reader's
     repro: an out/ holding record 1, no account, and a price go for 2: read_short returned None and the filing
     dropped records 2 and 3. extract now writes its account (sent, finished false) before the first call, and
     read_short refuses an unfinished account, or a price go that left no account.
  2. A prior-year read is held to read_short too. The repro: a prior read whose PDF hit ETIMEDOUT took
     prior_2025-2026.json from filed ['1'] to [], and prior_year_flags then flagged both 1 and 2.
  3. A fragment that names a program keeps two pages apart: .../programs/#accounting-aa against
     .../programs/#biology-as.
  4. The edition token is one or two digits: catalog_v2025.pdf and catalog_v2026.pdf are two files.
  5. capture_pdf marks a pinned page's source pinned, and the reread gate then never folds it into the filed page
     one off (deleting the mark passed every suite before this test).
  6. An only= filing keeps the earlier kept_passing.json entries of the programs it does not name.
"""
import glob
import io
import json
import os
import shutil
import sys
import tempfile
from contextlib import redirect_stdout

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_discontinued as D  # noqa: E402
import _program_requirements_college as C  # noqa: E402
import _program_requirements_extract as X  # noqa: E402
import _program_requirements_reconcile as R  # noqa: E402

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


def tree(folder):
    """Every file under folder, byte for byte."""
    out = {}
    for p in sorted(glob.glob(os.path.join(folder, "**", "*"), recursive=True)):
        if os.path.isfile(p):
            with open(p, "rb") as fh:
                out[os.path.relpath(p, folder)] = fh.read()
    return out


COLLEGE = "Follow Up Test College"
PASSING = {"pass": True, "coverage": {"pass": True, "share": 1.0}, "invented": {"pass": True},
           "arithmetic": {"status": "equal"}}
_saved = (C.COLLEGE_DIR, X.call, R.load_steps, C.read_hand_filed, C.P.pdfminer_pages,
          os.environ.get("SUPABASE_SERVICE_KEY"), os.environ.get("ONLY"))
_tmp = tempfile.mkdtemp(prefix="follow_up_s697_")


def filed_college(name, cns, url_of=lambda cn: "https://old.example/%s" % cn, score=PASSING):
    """A filed college: one record per program (passing unless score says) and the sources.json entry it was
    read from."""
    base = os.path.join(_tmp, name, "filed")
    dest = os.path.join(base, C.slug_of(COLLEGE))
    entries = []
    for cn in cns:
        dump(os.path.join(dest, "records", cn + ".json"),
             {"college": COLLEGE, "control_number": cn, "title": "P" + cn, "award": "Certificate of Achievement",
              "source_url": url_of(cn), "record": {"program": {}, "blocks": [{"name": "Core"}]},
              "score": score, "extracted_run": "43000000000", "error": None})
        entries.append({"control_number": cn, "title": "P" + cn, "method": "pdf_pages", "coverage": 1.0,
                        "codes_found": ["A1"], "source": {"url": url_of(cn), "text_from": "pdf_pages"}})
    dump(os.path.join(dest, "sources.json"), entries)
    C.COLLEGE_DIR = base
    return dest


def capture_out(name, cns, url_of, report=None):
    out = os.path.join(_tmp, name, "out")
    for cn in cns:
        dump(os.path.join(out, "sources", cn + ".json"),
             {"college": COLLEGE, "control_number": cn, "shape": "certificate", "title": "P" + cn,
              "award": "Certificate of Achievement", "closed_list": [{"code": "A 1"}], "text": "A 1 Core",
              "coverage": 1.0, "codes_found": ["A1"], "method": "pdf_pages",
              "source": {"url": url_of(cn), "text_from": "pdf_pages"}})
    dump(os.path.join(out, "capture.json"), report or {
        "college": COLLEGE, "programs": len(cns), "with_closed_list": len(cns),
        "pdf": {"url": "https://new.example/c.pdf", "access": "ok", "pages_total": 300}})
    return out


def file_quiet(out, run="44900000000"):
    buf = io.StringIO()
    with redirect_stdout(buf):
        rc = C.file_run(COLLEGE, out, run)
    return rc, buf.getvalue()


try:
    os.environ["SUPABASE_SERVICE_KEY"] = "test"
    os.environ.pop("ONLY", None)
    new_url = lambda cn: "https://new.example/%s" % cn  # noqa: E731

    # ── 1. A killed extraction in a wave files nothing ───────────────────────────
    # The reader's repro: record 1 kept, no account, a price go for 2 and 3 (their pages moved).
    cns = ["1", "2", "3"]
    dest = filed_college("killed", cns, url_of=lambda cn: "https://old.example/%s" % cn if cn == "1" else
                         "https://older.example/%s" % cn)
    before = tree(dest)
    out = capture_out("killed", cns, lambda cn: "https://old.example/%s" % cn if cn == "1" else new_url(cn))
    os.makedirs(os.path.join(out, "records"))
    shutil.copyfile(os.path.join(dest, "records", "1.json"), os.path.join(out, "records", "1.json"))
    dump(os.path.join(out, "wave_price.json"), {"go": True, "would_extract": 2, "extract_asked": True})
    rc, said = file_quiet(out)
    check(rc != 0 and "left no account" in said and "nothing is filed" in said,
          "1 a price go that left no account files nothing (rc %r: %s)" % (rc, said.strip()[:160]))
    check(tree(dest) == before, "1 records 2 and 3 stay filed, and nothing else under the college moves")
    # The account extract writes before its first call, never rewritten: the step was killed mid-read. Even with
    # every record on disk the run is no whole read, since its account (failed calls, their cost) is missing.
    for cn in ("2", "3"):
        with open(os.path.join(out, "records", cn + ".json"), "wb") as fh:
            fh.write(before[os.path.join("records", cn + ".json")])
    dump(os.path.join(out, "extract_account_0.json"),
         {"run": "1", "shard": 0, "calls": 0, "sent": ["2", "3"], "finished": False, "failed": []})
    rc, said = file_quiet(out)
    check(rc != 0 and "never finished" in said and tree(dest) == before,
          "1 an account still marked finished false files nothing (%s)" % said.strip()[:160])
    # An account from before this field (no finished key) is read as finished, as every account was.
    dump(os.path.join(out, "extract_account_0.json"),
         {"run": "1", "shard": 0, "calls": 2, "sent": ["2", "3"], "failed": []})
    check(C.read_short(out, load(os.path.join(out, "capture.json"))) is None,
          "1 an account with no finished field and every record back is a whole read")

    # extract itself: the account is on disk, unfinished, while the calls are in flight; a kill at that moment
    # leaves exactly that out/ (copied here as the call runs), and filing it refuses.
    # Failing records, so the gate sends the two moved programs rather than holding them (held()).
    dest = filed_college("killed_live", cns, url_of=lambda cn: "https://old.example/%s" % cn if cn == "1" else
                         "https://older.example/%s" % cn, score={"pass": False})
    before = tree(dest)
    out = capture_out("killed_live", cns, lambda cn: "https://old.example/%s" % cn if cn == "1" else new_url(cn))
    dump(os.path.join(out, "wave_price.json"), {"go": True, "would_extract": 2, "extract_asked": True})
    seen, killed = [], os.path.join(_tmp, "killed_live", "out_at_kill")

    def call(src, key, *a, **k):
        p = os.path.join(out, "extract_account_0.json")
        acct = load(p) if os.path.exists(p) else {}
        seen.append((src["control_number"], acct.get("sent"), acct.get("finished")))
        if src["control_number"] == "3" and not os.path.exists(killed):
            shutil.copytree(out, killed)
        return {"record": {"program": {}, "blocks": []}, "model": None, "usage": None}
    X.call = call
    with redirect_stdout(io.StringIO()):
        rc = C.extract(out, 0, 1, "44900000010", 1, dest, None, None)
    check(rc == 0 and [s[0] for s in seen] == ["2", "3"] and all(s[1] == ["2", "3"] and s[2] is False for s in seen),
          "1 extract writes its account, naming the programs to send and finished false, before the first call (%s)"
          % seen)
    check(load(os.path.join(out, "extract_account_0.json")).get("finished") is True,
          "1 the account the finally writes says finished")
    rc, said = file_quiet(killed)
    check(rc != 0 and "never finished" in said and tree(dest) == before,
          "1 the out/ a kill leaves mid-read files nothing (%s)" % said.strip()[:160])
    rc, said = file_quiet(out, "44900000010")
    check(rc == 0 and "filed 3 records" in said, "1 the same read, finished, files as before (%s)" % said.strip()[:120])

    # ── 2. A prior-year read is held to read_short ───────────────────────────────
    PRIOR = {"only": ["1", "2"], "catalog_year": "2025-2026", "start": "https://x.example/old.pdf", "format": "pdf"}
    dest = filed_college("prior", ["1", "2"])
    dump(os.path.join(dest, "prior_2025-2026.json"),
         {"college": COLLEGE, "programs": 2, "prior": PRIOR, "run": "8", "filed": ["1"],
          "kept": [{"control_number": "2", "why": "no record read from 2025-2026 (no record)"}]})
    flags_before = [f["control_number"] for f in D.prior_year_flags(C.COLLEGE_DIR)]
    before = tree(dest)
    out = os.path.join(_tmp, "prior", "out")
    os.makedirs(os.path.join(out, "records"))
    dump(os.path.join(out, "capture.json"),
         {"college": COLLEGE, "programs": 2, "with_closed_list": 2, "prior": PRIOR,
          "pdf": {"url": PRIOR["start"], "access": "unreachable", "pages_total": 0, "error": "read ETIMEDOUT"}})
    rc, said = file_quiet(out, "9")
    check(flags_before == ["1"], "2 fixture: the filed prior read flags 1 alone (%s)" % flags_before)
    check(rc != 0 and "gave no page" in said and "ETIMEDOUT" in said,
          "2 a prior read whose PDF timed out ends the filing red (rc %r: %s)" % (rc, said.strip()[:160]))
    check(tree(dest) == before and load(os.path.join(dest, "prior_2025-2026.json"))["filed"] == ["1"],
          "2 prior_2025-2026.json keeps filed ['1']")
    check([f["control_number"] for f in D.prior_year_flags(C.COLLEGE_DIR)] == ["1"],
          "2 prior_year_flags still flags 1 alone, never 2")
    # The same prior read with its pages files its fresh record, as before.
    dump(os.path.join(out, "capture.json"),
         {"college": COLLEGE, "programs": 2, "with_closed_list": 2, "prior": PRIOR,
          "pdf": {"url": PRIOR["start"], "access": "ok", "pages_total": 300}})
    dump(os.path.join(out, "records", "2.json"),
         {"college": COLLEGE, "control_number": "2", "source_url": PRIOR["start"] + "#page=40",
          "record": {"program": {}, "blocks": []}, "score": PASSING, "extracted_run": "9", "error": None})
    rc, said = file_quiet(out, "9")
    check(rc == 0 and load(os.path.join(dest, "prior_2025-2026.json"))["filed"] == ["2"],
          "2 a prior read that gave its pages files as before (%s)" % said.strip()[:120])

    # ── 3. A fragment that names a program keeps two pages apart ────────────────
    acc = "https://catalog.example.edu/programs/#accounting-aa"
    bio = "https://catalog.example.edu/programs/#biology-as"
    check(not C.same_page(acc, bio) and not C.names_page(acc, bio),
          "3 #accounting-aa and #biology-as on one page are two pages for same_page and names_page")
    check(C.same_page(acc, acc.replace("programs/", "Programs/")) and C.names_page(acc, acc.upper()[:8] + acc[8:]),
          "3 one fragment, the address spelled two ways, is still one page")
    check(not C.same_page(acc, "https://catalog.example.edu/programs/"),
          "3 a named fragment and the page with none are two pages")
    pdf = "https://catalog.example.edu/c.pdf"
    check(C.names_page(pdf + "#page=12&zoom=100", pdf + "#page=12") and C.same_page(pdf + "#page=12", pdf + "#page=13"),
          "3 viewer parameters name no program: #page=12&zoom=100 is #page=12, and one page off still folds")
    prev = {"control_number": "7", "coverage": 1.0, "codes_found": ["A1"], "source": {"url": acc, "text_from": "visible"}}
    src = {"control_number": "7", "coverage": 1.0, "codes_found": ["A1"], "text": "A 1",
           "source": {"url": bio, "text_from": "visible"}}
    check(not C.unchanged(prev, src), "3 unchanged() reads another program's fragment as a moved page")
    rec_dir = os.path.join(_tmp, "fragment")
    dump(os.path.join(rec_dir, "records", "7.json"), {"record": {"blocks": []}, "source_url": acc, "score": PASSING,
                                                       "source_coverage": 1.0})
    check(not C.filed_from(os.path.join(rec_dir, "records", "7.json"), src, prev)
          and C.held(os.path.join(rec_dir, "records", "7.json"), dict(prev, source=dict(prev["source"], url=bio)),
                     src)["was_coverage"] == 1.0,
          "3 filed_from() refuses the other program's fragment; held() still reads the record's own share")

    # ── 4. The edition token is one or two digits ────────────────────────────────
    y25, y26 = "https://www.example.edu/docs/catalog_v2025.pdf", "https://www.example.edu/docs/catalog_v2026.pdf"
    check(not C.same_file(y25, y26) and not C.same_page(y25 + "#page=10", y26 + "#page=10"),
          "4 catalog_v2025.pdf and catalog_v2026.pdf are two years' catalogs, two files")
    v2 = "https://www.canyons.edu/_documents/administration/academicaffairs/collegecatalog/2026-27-Catalog-v2-508.pdf"
    check(C.same_file(v2, v2.replace("-v2-", "-v3-")) and C.same_file(y25.replace("v2025", "v12"),
                                                                        y25.replace("v2025", "v13")),
          "4 v2 and v3, and v12 and v13, are still editions of one catalog")

    # ── 5. capture_pdf marks a pinned page's source pinned ───────────────────────
    PIN_COLLEGE = "Pinned Page Test College"
    WELD, AUTO = ["WELD 101", "WELD 102", "WELD 103"], ["AUTO 101", "AUTO 102", "AUTO 103"]
    pages = ["PINNED PAGE TEST COLLEGE CATALOG 2026-2027\n" for _ in range(20)]
    pages[7] += ("Welding Technology\nCertificate of Achievement\nRequired Courses\n"
                 + "".join("%s Welding %d 3\n" % (c, k) for k, c in enumerate(WELD)) + "Total Units 9\n")
    pages[11] += ("Automotive Technology\nCertificate of Achievement\nRequired Courses\n"
                  + "".join("%s Auto %d 3\n" % (c, k) for k, c in enumerate(AUTO)) + "Total Units 9\n")

    def prog(cn, title, codes):
        return {"control_number": cn, "title": title, "award": "Certificate of Achievement", "shape": "certificate",
                "status": "Active", "closed_list": [{"code": c} for c in codes], "load_id": "1"}
    pin_out = os.path.join(_tmp, "pinned", "out")
    os.makedirs(os.path.join(pin_out, "sources"))
    C.read_hand_filed = lambda hf: {"url": "https://x.edu/c.pdf", "access": "hand_filed", "pages": pages,
                                    "extractor": "pypdf"}
    C.P.pdfminer_pages = lambda pdf: {"pages": [], "extractor": "pdfminer"}
    R.load_steps = lambda path=R.STEPS: {PIN_COLLEGE: {"pdf_pages": {"10001": {"page": 8, "words": "Welding Technology"}}}}
    with redirect_stdout(io.StringIO()):
        recs = C.capture_pdf(PIN_COLLEGE, pin_out, [prog("10001", "Welding Technology", WELD),
                                                    prog("10002", "Automotive Technology", AUTO)],
                             {"catalog_url": "https://x.edu/c.pdf"}, {},
                             {"meta": {"url": "https://x.edu/c.pdf", "fetched_by": "test", "fetched_at": "2026-11-21",
                                       "sha256": "0"}})
    by = {r["control_number"]: r for r in recs}
    check(by["10001"]["method"] == "pdf_pages" and (by["10001"].get("source") or {}).get("pinned") is True
          and (by["10001"].get("source") or {}).get("url", "").endswith("#page=8"),
          "5 the program a pdf_pages pin names reads its pinned page, and its source says pinned")
    check(by["10002"]["method"] == "pdf_pages" and "pinned" not in (by["10002"].get("source") or {}),
          "5 an unpinned program's source carries no pinned mark")

    def filed_one_off(r):
        url = r["source"]["url"].rsplit("=", 1)
        return {"control_number": r["control_number"], "coverage": r["coverage"], "codes_found": r["codes_found"],
                "source": {"url": "%s=%d" % (url[0], int(url[1]) + 1), "text_from": r["source"]["text_from"]}}
    check(not C.unchanged(filed_one_off(by["10001"]), by["10001"]) and C.unchanged(filed_one_off(by["10002"]), by["10002"]),
          "5 the reread gate never folds the pinned page into a filed page one off; the unpinned one it does")

    # ── 6. An only= filing keeps the earlier kept_passing entries it does not name ──
    cns6 = ["11338", "04607", "11319"]
    dest = filed_college("kept_passing", cns6)
    dump(os.path.join(dest, "kept_passing.json"), {"run": "44800000000", "programs": [
        {"control_number": "11338", "reason": "covers_less", "title": "P11338"},
        {"control_number": "11319", "reason": "passes_less", "title": "P11319"}]})
    out = capture_out("kept_passing", cns6, lambda cn: new_url(cn) if cn == "11338" else "https://old.example/%s" % cn)
    os.makedirs(os.path.join(out, "records"))
    for cn in cns6:
        shutil.copyfile(os.path.join(dest, "records", cn + ".json"), os.path.join(out, "records", cn + ".json"))
    dump(os.path.join(out, "not_named_0.json"), {"only": ["11338"], "programs": ["04607", "11319"]})
    dump(os.path.join(out, "extract_account_0.json"),
         {"run": "44900000020", "shard": 0, "calls": 1, "sent": ["11338"], "finished": True, "failed": []})
    dump(os.path.join(out, "kept_passing_0.json"),
         [{"control_number": "11338", "reason": "passes_less", "title": "P11338"}])
    rc, said = file_quiet(out, "44900000020")
    kp = load(os.path.join(dest, "kept_passing.json"))
    got = {e["control_number"]: (e["reason"], e.get("run")) for e in kp["programs"]}
    check(rc == 0 and kp["run"] == "44900000020",
          "6 the only= filing files its kept_passing.json under its own run (%s)" % said.strip()[:120])
    check(got == {"11338": ("passes_less", None), "11319": ("passes_less", "44800000000")},
          "6 the named program's entry is this run's, and the unnamed one's earlier entry stays with its run (%s)" % got)
    # Without only=, a filing replaces kept_passing.json whole, as before.
    os.remove(os.path.join(out, "not_named_0.json"))
    rc, said = file_quiet(out, "44900000021")
    check([e["control_number"] for e in load(os.path.join(dest, "kept_passing.json"))["programs"]] == ["11338"],
          "6 a filing without only= replaces kept_passing.json whole")
finally:
    (C.COLLEGE_DIR, X.call, R.load_steps, C.read_hand_filed, C.P.pdfminer_pages) = _saved[:5]
    for k, v in (("SUPABASE_SERVICE_KEY", _saved[5]), ("ONLY", _saved[6])):
        if v is None:
            os.environ.pop(k, None)
        else:
            os.environ[k] = v
    shutil.rmtree(_tmp, ignore_errors=True)

if FAILS:
    print("FAIL: %d of %d" % (len(FAILS), N[0]))
    for f in FAILS:
        print("  - " + f)
    sys.exit(1)
print("ok: follow-up S697 (%d checks)" % N[0])
