#!/usr/bin/env python3
"""Three reader fixes before the next paid college read, and Butte's addresses (S697).

    python3 tests/program_requirements_reader_fixes_s697_test.py

  A. A run that is no whole read files nothing (f-timed-out-read-still-files-s691). Santa Monica's read
     44883500729 timed out on its catalog PDF (read ETIMEDOUT), every program read as not found, and the filing
     step committed the run: 46 records left the branch. file_run now refuses a capture whose PDF gave no page, an
     extraction run whose capture read no program's text, and an extraction that ended short of the programs it
     sent, and leaves the filed records as they are. A whole run still files.
  B. would_extract honors the reread gate's same-page calls (f-would-extract-relists-same-page-s691,
     d-reread-gate-same-page-calls-s690). College of the Canyons' records filed from its 2026-27 Catalog v2 were
     priced as new pages once the catalog moved to v3 (pricing run 44886119075). A v2 record against a v3 page of
     the same catalog, at equal coverage, is not sent; a page one PDF page off is the same page; a genuinely new
     page, another catalog, or a smaller share still goes. S411's case (sources.json naming a page the record was
     never read from, with no share to prove it) still goes.
  C. only= (#3500): the preview and the price count the named programs alone, the extraction sends exactly them,
     every other program keeps its filed record byte for byte and its sources.json entry, an unknown name is
     refused by name, and an empty only= behaves as before.
  D. Butte (f-butte-page-addresses-changed-case-s690): an address that moved from Catalog//iq to catalog/iq is
     the same page for unchanged() and held().
"""
import argparse
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
import _program_requirements_college as C  # noqa: E402
import _program_requirements_extract as X  # noqa: E402
import _program_requirements_wave as W  # noqa: E402

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


def snapshot(folder):
    out = {}
    for p in sorted(glob.glob(os.path.join(folder, "records", "*.json"))):
        with open(p, "rb") as fh:
            out[os.path.basename(p)] = fh.read()
    return out


COLLEGE = "Reader Fixes Test College"
PASSING = {"pass": True, "coverage": {"pass": True, "share": 1.0}, "invented": {"pass": True},
           "arithmetic": {"status": "equal"}}
V2 = "https://www.canyons.edu/_documents/administration/academicaffairs/collegecatalog/2026-27-Catalog-v2-508.pdf"
V3 = V2.replace("-v2-", "-v3-")
_saved = (C.COLLEGE_DIR, X.call, os.environ.get("SUPABASE_SERVICE_KEY"), os.environ.get("ONLY"))
_tmp = tempfile.mkdtemp(prefix="reader_fixes_s697_")


def filed_college(name, cns, url_of=lambda cn: "https://old.example/%s" % cn, cov=1.0):
    """A filed college: one failing record per program and the sources.json entry it was read from."""
    root = os.path.join(_tmp, name)
    dest = os.path.join(root, "filed", C.slug_of(COLLEGE))
    entries = []
    for cn in cns:
        dump(os.path.join(dest, "records", cn + ".json"),
             {"college": COLLEGE, "control_number": cn, "title": "P" + cn, "award": "Certificate of Achievement",
              "source_url": url_of(cn), "record": {"program": {}, "blocks": [{"name": "Core"}]},
              "score": {"pass": False}, "extracted_run": "43000000000", "error": None})
        entries.append({"control_number": cn, "title": "P" + cn, "method": "pdf_pages", "coverage": cov,
                        "codes_found": ["A1"], "source": {"url": url_of(cn), "text_from": "pdf_pages"}})
    dump(os.path.join(dest, "sources.json"), entries)
    return root, dest


def capture_out(root, cns, url_of, cov=1.0, text="A 1 Core", report=None):
    out = os.path.join(root, "out")
    for cn in cns:
        dump(os.path.join(out, "sources", cn + ".json"),
             {"college": COLLEGE, "control_number": cn, "shape": "certificate", "title": "P" + cn,
              "award": "Certificate of Achievement", "closed_list": [{"code": "A 1"}], "text": text,
              "coverage": cov, "codes_found": ["A1"], "method": "pdf_pages" if text else "not_found",
              "source": {"url": url_of(cn), "text_from": "pdf_pages"} if text else None})
    dump(os.path.join(out, "capture.json"), report or {"college": COLLEGE, "programs": len(cns),
                                                       "with_closed_list": len(cns)})
    return out


def file_quiet(out):
    buf = io.StringIO()
    with redirect_stdout(buf):
        rc = C.file_run(COLLEGE, out, "44900000000")
    return rc, buf.getvalue()


try:
    os.environ["SUPABASE_SERVICE_KEY"] = "test"
    os.environ.pop("ONLY", None)

    # ── A. A run that is no whole read files nothing ─────────────────────────────
    cns = ["%05d" % (21000 + i) for i in range(4)]
    root, dest = filed_college("timed_out", cns)
    C.COLLEGE_DIR = os.path.dirname(dest)
    before = snapshot(dest)
    before_sources = open(os.path.join(dest, "sources.json")).read()
    smc = {"college": COLLEGE, "programs": 4, "with_closed_list": 4, "catalog_year": "2026-2027",
           "pdf": {"url": "https://catalog.example/current/catalog.pdf", "access": "unreachable", "status": None,
                   "bytes": None, "pages_total": 0, "error": "APIRequestContext.get: read ETIMEDOUT"}}
    out = capture_out(root, cns, None, cov=0.0, text="", report=smc)
    # The extraction kept one passing record and sent nothing, as Santa Monica's did (184 of 230 kept).
    os.makedirs(os.path.join(out, "records"))
    shutil.copyfile(os.path.join(dest, "records", cns[0] + ".json"), os.path.join(out, "records", cns[0] + ".json"))
    dump(os.path.join(out, "extract_account_0.json"), {"run": "1", "shard": 0, "calls": 0, "failed": [], "sent": []})
    rc, said = file_quiet(out)
    check(rc != 0, "A a read whose catalog PDF timed out ends the filing step red (rc %r)" % rc)
    check("::error::" in said and "gave no page" in said and "ETIMEDOUT" in said and "nothing is filed" in said,
          "A the log says why: the PDF gave no page, with the error, and that nothing is filed (%s)" % said.strip()[:200])
    check(snapshot(dest) == before and open(os.path.join(dest, "sources.json")).read() == before_sources,
          "A every filed record and the sources.json stay as they were (Santa Monica lost 46)")
    # The same capture with extract=0 files no misleading preview either.
    shutil.rmtree(os.path.join(out, "records"))
    rc, said = file_quiet(out)
    check(rc != 0 and not os.path.exists(os.path.join(dest, "capture_preview.json")),
          "A a capture-only run whose PDF gave no page files no preview")

    # A catalog of pages that answered nothing: no program's text was read.
    root, dest = filed_college("no_text", cns)
    C.COLLEGE_DIR = os.path.dirname(dest)
    before = snapshot(dest)
    out = capture_out(root, cns, None, cov=0.0, text="")
    os.makedirs(os.path.join(out, "records"))
    rc, said = file_quiet(out)
    check(rc != 0 and "read no program's text" in said and snapshot(dest) == before,
          "A an extraction run whose capture read no program's text files nothing (%s)" % said.strip()[:160])

    # An extraction that ended short: two programs sent, one came back, the other is neither failed nor held.
    root, dest = filed_college("short", cns, url_of=lambda cn: "https://new.example/%s" % cn)
    C.COLLEGE_DIR = os.path.dirname(dest)
    before = snapshot(dest)
    out = capture_out(root, cns, lambda cn: "https://new.example/%s" % cn)
    os.makedirs(os.path.join(out, "records"))
    for cn in cns[:3]:
        shutil.copyfile(os.path.join(dest, "records", cn + ".json"), os.path.join(out, "records", cn + ".json"))
    dump(os.path.join(out, "extract_account_0.json"),
         {"run": "1", "shard": 0, "calls": 1, "failed": [], "sent": [cns[2], cns[3]]})
    rc, said = file_quiet(out)
    check(rc != 0 and "ended short" in said and "1 of the 2" in said and cns[3] in said and snapshot(dest) == before,
          "A an extraction with fewer results than programs sent files nothing (%s)" % said.strip()[:160])
    # The same run, the missing program a failed call: a whole run, and it files.
    dump(os.path.join(out, "extract_account_0.json"),
         {"run": "1", "shard": 0, "calls": 2, "sent": [cns[2], cns[3]],
          "failed": [{"control_number": cns[3], "status": "HTTP 500", "kept_filed": False}]})
    rc, said = file_quiet(out)
    check(rc == 0 and "filed 3 records" in said,
          "A a program whose call failed is accounted for, so the run files as before (%s)" % said.strip()[:120])
    check(C.read_short(out, {"programs": 4, "pdf": {"pages_total": 312, "access": "ok"}}) is None,
          "A a PDF that gave its pages is a whole read")

    # ── B. would_extract honors the reread gate's same-page calls ────────────────
    check(C.same_page(V2 + "#page=130", V3 + "#page=129") and C.same_page(V2 + "#page=107", V3 + "#page=107"),
          "B a new edition of the same catalog, on its page or one page off, is the same page (Canyons 32656, 10298)")
    check(not C.same_page(V2 + "#page=130", V3 + "#page=132") and not C.same_page(V2 + "#page=130", V2 + "#page=150"),
          "B two pages or more off is another page")
    check(not C.same_page(V2 + "#page=130", V2.replace("2026-27", "2025-26") + "#page=130")
          and not C.same_page(V2 + "#page=130", V2.replace("Catalog", "Schedule") + "#page=130"),
          "B another year's catalog, or another file, is another page")
    check(not C.same_page(V2, V3 + "#page=5") and C.same_page(V2, V3),
          "B a whole-file address and a page of it are not compared as pages; two whole files of one catalog are one")

    cn_same, cn_off, cn_new, cn_less, cn_other = "10298", "32656", "45268", "02275", "44444"
    pages = {cn_same: 107, cn_off: 130, cn_new: 150, cn_less: 107, cn_other: 90}
    root, dest = filed_college("canyons", list(pages), url_of=lambda cn: V2 + "#page=%d" % pages[cn])
    # 32656 passes as the live table counts it; a window one page off stands only for such a record.
    _p = os.path.join(dest, "records", cn_off + ".json")
    dump(_p, dict(json.load(open(_p)), score=PASSING))
    # The v3 capture: the same page, one page off, a genuinely new page (150 -> 180), a smaller share, another file.
    new_url = {cn_same: V3 + "#page=107", cn_off: V3 + "#page=129", cn_new: V3 + "#page=180",
               cn_less: V3 + "#page=107", cn_other: "https://www.canyons.edu/other/noncredit-guide.pdf#page=90"}
    recs = []
    for cn in pages:
        recs.append({"control_number": cn, "title": "P" + cn, "coverage": 0.8 if cn == cn_less else 1.0,
                     "codes_found": ["A1"], "text": "A 1 Core", "method": "pdf_pages",
                     "source": {"url": new_url[cn], "text_from": "pdf_pages"}})
    wx = C.would_extract(COLLEGE, recs, folder=dest)
    listed = sorted(x["control_number"] for x in wx["list"])
    check(cn_same not in listed and cn_off not in listed and wx["kept"] == 2,
          "B a v2 record against the v3 page of the same catalog at equal coverage is not sent, on its page or one "
          "page off (%s)" % listed)
    check(cn_new in listed and cn_other in listed and cn_less in listed,
          "B a genuinely new page, another file, and a window naming a smaller share still go (%s)" % listed)
    # The record carries the share it was read from: a same page with an equal or higher share is kept.
    rec_path = os.path.join(dest, "records", cn_off + ".json")
    rec = json.load(open(rec_path))
    rec["source_coverage"] = 0.9
    dump(rec_path, rec)
    prev_off = json.load(open(os.path.join(dest, "sources.json")))[1]
    check(C.filed_from(rec_path, recs[1], None) and C.filed_from(rec_path, recs[1], prev_off),
          "B a record's own share (0.9) under the moved page's (1.0) is the gate's coverage half")
    rec["source_coverage"] = 1.0
    dump(rec_path, rec)
    check(not C.filed_from(rec_path, dict(recs[1], coverage=0.95), None),
          "B a moved page naming a smaller share than the record's is not the record's page")
    # S411: sources.json names a page the record was never read from, and nothing gives the share it was read at.
    s411 = {"control_number": "5", "coverage": 1.0, "codes_found": ["E1"], "source": {"url": "y#page=237"}}
    root411 = os.path.join(_tmp, "s411")
    dump(os.path.join(root411, "records", "5.json"), {"record": {"blocks": []}, "source_url": "y#page=236"})
    check(not C.filed_from(os.path.join(root411, "records", "5.json"), dict(s411, text="t"), s411),
          "B S411's record, filed beside a fresh source one page on, with no share to prove it, still goes")
    # A page called on purpose is new evidence (pricing run 44911690112): Cosumnes River's 07305, pinned to its
    # heading's p.212 and filed from p.213 at the same share and codes, goes to the model; so does a page the
    # reader's page checks assigned.
    crc = "https://crc.losrios.edu/catalog/compiled-catalog/crc-catalog-26-27.pdf"
    root_pin = os.path.join(_tmp, "pinned")
    dump(os.path.join(root_pin, "records", "07305.json"),
         {"record": {"blocks": []}, "source_url": crc + "#page=213", "score": PASSING})
    prev_pin = {"control_number": "07305", "coverage": 1.0, "codes_found": ["BIT100"],
                "source": {"url": crc + "#page=213", "text_from": "pdf_pages"}}
    for flag in ({"pinned": True}, {"page_check": {"rule": "A", "page": 212, "share": 1.0}}):
        new_pin = {"control_number": "07305", "coverage": 1.0, "codes_found": ["BIT100"], "text": "t",
                   "source": dict({"url": crc + "#page=212", "text_from": "pdf_pages"}, **flag)}
        check(not C.unchanged(prev_pin, new_pin)
              and not C.filed_from(os.path.join(root_pin, "records", "07305.json"), new_pin, prev_pin),
              "B a page one off that was called on purpose (%s) is not the filed page" % list(flag)[0])
    drift = {"control_number": "07305", "coverage": 1.0, "codes_found": ["BIT100"], "text": "t",
             "source": {"url": crc + "#page=212", "text_from": "pdf_pages"}}
    check(C.unchanged(prev_pin, drift) and C.filed_from(os.path.join(root_pin, "records", "07305.json"), drift, prev_pin),
          "B the same page one off with no call is the gate's drifted page, for a record that passes")
    dump(os.path.join(root_pin, "records", "04586.json"),
         {"record": {"blocks": []}, "source_url": crc + "#page=134", "score": {"pass": False}})
    check(not C.filed_from(os.path.join(root_pin, "records", "04586.json"),
                           dict(drift, source={"url": crc + "#page=133", "text_from": "pdf_pages"}),
                           dict(prev_pin, source={"url": crc + "#page=134", "text_from": "pdf_pages"})),
          "B a failing record's window one page off is read again (Cosumnes River's 04586, p.134 to p.133)")
    dump(os.path.join(root_pin, "records", "45268.json"),
         {"record": {"blocks": []}, "source_url": V2 + "#page=150", "score": {"pass": False}})
    check(C.filed_from(os.path.join(root_pin, "records", "45268.json"),
                       {"coverage": 1.0, "text": "t", "source": {"url": V3 + "#page=150"}},
                       {"coverage": 1.0, "source": {"url": V2 + "#page=150"}}),
          "B a new edition on the same page number stands for a failing record too")
    # The extraction applies the same test: it sends the new page and the smaller share, and keeps the rest.
    sent = []
    X.call = lambda src, key, *a, **k: (sent.append(src["control_number"]),
                                        {"record": {"program": {}, "blocks": []}, "model": None, "usage": None})[1]
    out = os.path.join(root, "out")
    for r in recs:
        dump(os.path.join(out, "sources", r["control_number"] + ".json"),
             dict(r, college=COLLEGE, shape="certificate", award="Certificate of Achievement",
                  closed_list=[{"code": "A 1"}]))
    with redirect_stdout(io.StringIO()):
        rc = C.extract(out, 0, 1, "44900000001", 1, dest, None, None)
    check(rc == 0 and sorted(sent) == sorted([cn_new, cn_other, cn_less]),
          "B the extraction sends what the preview lists and no more (%s)" % sorted(sent))

    # ── C. only= ─────────────────────────────────────────────────────────────────
    cnsC = ["11338", "04607", "11319", "07305", "04614"]
    root, dest = filed_college("only", cnsC)
    C.COLLEGE_DIR = os.path.dirname(dest)
    before = snapshot(dest)
    before_entries = {e["control_number"]: e for e in json.load(open(os.path.join(dest, "sources.json")))}
    # Three programs moved to their heading's page, one stayed, one filed program has no source this capture.
    moved = {"11338", "04607", "11319"}
    url_of = lambda cn: ("https://new.example/%s" % cn) if cn in moved else "https://old.example/%s" % cn  # noqa: E731
    recsC = [{"control_number": cn, "title": "P" + cn, "coverage": 1.0, "codes_found": ["A1"], "text": "A 1 Core",
              "method": "pdf_pages", "source": {"url": url_of(cn), "text_from": "pdf_pages"}} for cn in cnsC[:4]]
    wx_all = C.would_extract(COLLEGE, recsC, folder=dest, only=set())
    check(wx_all["programs"] == 3 and "not_named" not in wx_all and "only" not in wx_all,
          "C an empty only= lists every program that moved, as before (%d)" % wx_all["programs"])
    wx2 = C.would_extract(COLLEGE, recsC, folder=dest, only={"11338", "04607"})
    check(sorted(x["control_number"] for x in wx2["list"]) == ["04607", "11338"] and wx2["programs"] == 2
          and [x["control_number"] for x in wx2["not_named"]] == ["11319"],
          "C with only= naming two of three moved programs the preview lists two and names the third not_named")
    os.environ["ONLY"] = "11338,04607"
    check(C.would_extract(COLLEGE, recsC, folder=dest)["programs"] == 2,
          "C the capture reads only= from ONLY, the workflow's env")
    os.environ.pop("ONLY")

    out = capture_out(root, cnsC[:4], url_of)
    rep = json.load(open(os.path.join(out, "capture.json")))
    rep["would_extract"] = wx_all       # a capture run without ONLY: the price narrows it all the same
    dump(os.path.join(out, "capture.json"), rep)
    ns = argparse.Namespace(college=COLLEGE, out=out, extract="0", limit_usd="40", attempt="1",
                            write=os.path.join(root, "row.json"), run="1", fresh="1", force="", only="11338,04607")
    with redirect_stdout(io.StringIO()) as buf:
        rc = W.price_main(ns)
    got = json.load(open(os.path.join(out, "wave_price.json")))
    check(rc == 0 and got["would_extract"] == 2 and got["only_priced"] == ["04607", "11338"]
          and got["not_named"] == ["11319"] and got["price_usd"] == round(2 * got["cost_per_program"] * W.PRICE_MARGIN, 2),
          "C the estimate prices the two named programs alone, through the same gate (%s)"
          % {k: got.get(k) for k in ("would_extract", "price_usd", "why")})
    ns.only = ""
    with redirect_stdout(io.StringIO()):
        W.price_main(ns)
    check(json.load(open(os.path.join(out, "wave_price.json")))["would_extract"] == 3,
          "C an empty only= prices every program that moved, as before")
    ns.only = "11338,99999"
    with redirect_stdout(io.StringIO()) as buf:
        rc = W.price_main(ns)
    got = json.load(open(os.path.join(out, "wave_price.json")))
    check(rc == 1 and not got["go"] and "99999 is not in the capture" in got["why"] and "99999" in buf.getvalue(),
          "C an unknown control number in only= refuses the price by name (%s)" % got["why"])
    ns.only, ns.force = "11338", "04607"
    with redirect_stdout(io.StringIO()):
        rc = W.price_main(ns)
    check(rc == 1 and "force= names 04607" in json.load(open(os.path.join(out, "wave_price.json")))["why"],
          "C a forced number only= does not name refuses the price")
    ns.only, ns.force, ns.extract = "11338,04607", "", "1"
    with redirect_stdout(io.StringIO()):
        W.price_main(ns)
    check(json.load(open(os.path.join(out, "wave_price.json")))["go"] is True,
          "C a named read within the $40 limit goes")

    sent = []
    X.call = lambda src, key, *a, **k: (sent.append(src["control_number"]),
                                        {"record": {"program": {}, "blocks": []}, "model": None, "usage": None})[1]
    with redirect_stdout(io.StringIO()):
        rc = C.extract(out, 0, 1, "44900000002", 1, dest, None, None, only={"11338", "04607"})
    check(rc == 0 and sorted(sent) == ["04607", "11338"],
          "C the extraction sends exactly the named control numbers (%s)" % sorted(sent))
    nn = json.load(open(os.path.join(out, "not_named_0.json")))
    check(nn["programs"] == ["04614", "07305", "11319"], "C every other program is listed not named (%s)" % nn["programs"])
    with redirect_stdout(io.StringIO()):
        rc = C.file_run(COLLEGE, out, "44900000002")
    after = snapshot(dest)
    entries = {e["control_number"]: e for e in json.load(open(os.path.join(dest, "sources.json")))}
    nn_out = {cn: open(os.path.join(out, "records", cn + ".json"), "rb").read() for cn in ("11319", "07305", "04614")}
    check(all(nn_out[cn] == before[cn + ".json"] for cn in nn_out),
          "C the extraction sets each unnamed program back to its filed record byte for byte")
    check(rc == 0 and all(json.loads(after[cn + ".json"]) == json.loads(before[cn + ".json"])
                          for cn in ("11319", "07305", "04614")),
          "C each unnamed program's filed record stands as filed, the moved one and the one with no source too")
    check(all(json.loads(after[cn + ".json"])["extracted_run"] == "44900000002" for cn in ("11338", "04607")),
          "C the named programs carry the new read")
    check(entries["11319"] == before_entries["11319"] and entries["04614"] == before_entries["04614"]
          and entries["11338"]["source"]["url"] == "https://new.example/11338",
          "C an unnamed program keeps its sources.json entry, so the next read still sees it moved")
    sent.clear()
    with redirect_stdout(io.StringIO()) as buf:
        rc = C.extract(out, 0, 1, "44900000003", 1, dest, None, None, only={"11338", "55555"})
    check(rc == 2 and not sent and "55555 is not in the capture" in buf.getvalue(),
          "C the extraction refuses an unknown name too, and sends nothing")
    check(C.main(["extract", "--college", COLLEGE, "--out", out, "--force", "07305", "--only", "11338"]) == 2,
          "C a forced number only= does not name refuses the extraction")

    # ── D. Butte ─────────────────────────────────────────────────────────────────
    was = "https://butte.curriqunet.com/Catalog//iq/25398/28078/28202"
    now = "https://butte.curriqunet.com/catalog/iq/25398/28078/28202"
    prev = {"control_number": "12345", "coverage": 1.0, "codes_found": ["A1"],
            "source": {"url": was, "text_from": "visible"}}
    src = {"control_number": "12345", "coverage": 1.0, "codes_found": ["A1"], "text": "A 1",
           "source": {"url": now, "text_from": "visible"}}
    check(C.unchanged(prev, src), "D Butte's Catalog//iq to catalog/iq is the same page for unchanged()")
    check(not C.unchanged(prev, dict(src, source={"url": now.replace("28202", "28203"), "text_from": "visible"})),
          "D another Butte program's page is not")
    bdir = os.path.join(_tmp, "butte")
    dump(os.path.join(bdir, "records", "12345.json"),
         {"control_number": "12345", "source_url": now, "record": {"blocks": [{"courses": ["A 1"]}]},
          "score": {"pass": True, "coverage": {"pass": True, "share": 1.0}, "invented": {"pass": True},
                    "arithmetic": {"status": "equal"}}})
    import _program_requirements_score as S
    if S.passes_live(json.load(open(os.path.join(bdir, "records", "12345.json")))["score"]):
        h = C.held(os.path.join(bdir, "records", "12345.json"), prev, dict(src, source={"url": now + "/x"}))
        check(h is not None and h["reason"] == "held_no_gain" and h["was_coverage"] == 1.0,
              "D held() reads the share from Butte's sources.json entry across the spelling change (%r)" % h)
    else:
        check(False, "D the Butte fixture's score passes as the live table counts it")
    wb = C.would_extract("Butte College", [src], folder=os.path.join(_tmp, "butte_we"))
    check(wb["programs"] == 1, "D a Butte program with no filed record still goes")
    root, dest = filed_college("butte_we", ["12345"], url_of=lambda cn: now)
    dump(os.path.join(dest, "sources.json"), [prev])
    wb = C.would_extract("Butte College", [src], folder=dest)
    check(wb["programs"] == 0 and wb["kept"] == 1,
          "D Butte's unchanged program is kept, not priced (%s)" % {k: wb[k] for k in ("programs", "kept")})
finally:
    C.COLLEGE_DIR, X.call = _saved[0], _saved[1]
    for k, v in (("SUPABASE_SERVICE_KEY", _saved[2]), ("ONLY", _saved[3])):
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
print("ok: reader fixes S697 (%d checks)" % N[0])
