#!/usr/bin/env python3
"""A read stops at the extraction function's 503 (or 401) and files nothing over a record (S647).

    python3 tests/program_requirements_extract_halt_test.py

Sam, Open Asks Sheet 190 card 6 (2026-11-13 13:21Z, "deploy"), on COBIx's finding on #3202 (comment
6850015321). From about 09:29Z to 11:15Z that day the database refused connections, and
program-requirements-extract answered 401 to every one of Glendale's 135 paid calls (run 43384599013): the read
went on through all of them, filed 121 error stubs over good records, and read as an expired key for an hour.
Version 12 of the function answers 503 when its caller check gets no answer (tests/service_caller_check.test.js);
this test guards the runner's half:

  A. _post keeps the HTTP status and the function's reason beside the error text, a read in parts carries them,
     and halt_of stops on 503 and 401 only (a 400, 500 or 502 is one program's failure, as before).
  B. extract(): the first 503 is tried once more; answered 503 again, the read stops. No further program is
     sent, every program keeps its filed record exactly, none gets a stub, the halt names the cause in
     extract_halt_<shard>.json, and the step returns HALT_EXIT (red).
  C. Filing such a run (the wave files it; the one-college workflow skips its file step) leaves every filed
     record and its sources.json entry as they were.
  D. A 503 that clears on the retry is no halt: the read goes on and files its records. A refused key (401)
     halts the same way.
  E. The wave's verdict names the halt; the one-college workflow's file step still needs extract to pass.
"""
import glob
import io
import json
import os
import shutil
import sys
import tempfile
import urllib.error

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_requirements_college as C  # noqa: E402
import _program_requirements_extract as X  # noqa: E402
import _program_requirements_wave as W  # noqa: E402

results = []


def check(name, ok, why=""):
    results.append((name, bool(ok), why))


ANSWER_503 = {"ok": False, "error": "the caller check could not reach the database, so no call was made; try "
                                    "again once it answers", "reason": "upstream_timeout",
              "detail": "no answer in 12000 ms"}


def http_error(code, body):
    raw = json.dumps(body) if isinstance(body, dict) else body
    return urllib.error.HTTPError("https://x/functions/v1/program-requirements-extract", code, "x", {},
                                  io.BytesIO(raw.encode()))


# ── A. The status and the function's reason ride beside the error ──
_urlopen = X.urllib.request.urlopen
try:
    def raising(code, body):
        def f(req, timeout=None):
            raise http_error(code, body)
        return f
    X.urllib.request.urlopen = raising(503, ANSWER_503)
    got = X._post({"text": "t"}, "k")
    check("A the 503 answer keeps its status, reason and detail beside the error text",
          got.get("http_status") == 503 and got.get("reason") == "upstream_timeout"
          and got.get("detail") == "no answer in 12000 ms" and got["error"].startswith("HTTP 503: "), repr(got))
    h = X.halt_of(got)
    check("A halt_of stops on the 503 and names the cause and the function's reason",
          h and h["status"] == 503 and h["reason"] == "upstream_timeout" and "database" in h["cause"], repr(h))
    X.urllib.request.urlopen = raising(401, {"error": "unauthorized", "reason": "key_refused"})
    h401 = X.halt_of(X._post({}, "k"))
    check("A halt_of stops on a 401 (the key refused)", h401 and h401["status"] == 401 and h401["reason"] == "key_refused")
    for code in (400, 413, 429, 500, 502):
        X.urllib.request.urlopen = raising(code, "<html>%d</html>" % code)
        g = X._post({}, "k")
        check("A an HTTP %d is one program's failure, not a halt" % code,
              g.get("http_status") == code and X.halt_of(g) is None)
    check("A an answer with no status (a timeout, a record) is no halt",
          X.halt_of({"error": "timed out"}) is None and X.halt_of({"record": {}}) is None and X.halt_of(None) is None)
finally:
    X.urllib.request.urlopen = _urlopen

src_parts = {"college": "T", "control_number": "1", "closed_list": [{"code": "A %d" % i} for i in range(3)],
             "text": "A 0 A 1 A 2"}
parts = X.call_in_parts(src_parts, "k", {"text": "t"},
                        post=lambda b, k: {"error": "HTTP 503: {}", "http_status": 503, "reason": "upstream_http_503"}
                        if b["part"]["index"] == 2 else {"record": {"blocks": []}})
check("A a read in parts carries the failing part's status and reason, so it halts too",
      parts.get("http_status") == 503 and parts.get("reason") == "upstream_http_503" and X.halt_of(parts), repr(parts))

# ── B to D. extract() and file_run() over a college with filed records ──
_saved = (X.call, C.COLLEGE_DIR, os.environ.get("SUPABASE_SERVICE_KEY"))
_tmp = tempfile.mkdtemp(prefix="extract_halt_")
COLLEGE = "Test College"


def college_dirs(name):
    """A filed college (12 programs, a record each) and a run's out/ whose capture read them all on new pages."""
    base = os.path.join(_tmp, name)
    dest = os.path.join(base, "filed", C.slug_of(COLLEGE))
    out = os.path.join(base, "out")
    os.makedirs(os.path.join(dest, "records"))
    os.makedirs(os.path.join(out, "sources"))
    cns = ["%05d" % (10000 + i) for i in range(12)]
    entries = []
    for cn in cns:
        filed = {"college": COLLEGE, "control_number": cn, "title": "P" + cn, "award": "Certificate of Achievement",
                 "source_url": "https://old.example/%s" % cn, "record": {"program": {}, "blocks": [{"name": "Core"}]},
                 "score": {"pass": False}, "extracted_run": "43000000000", "error": None}
        json.dump(filed, open(os.path.join(dest, "records", cn + ".json"), "w"))
        entries.append({"control_number": cn, "title": "P" + cn, "source": {"url": "https://old.example/%s" % cn}})
        json.dump({"college": COLLEGE, "control_number": cn, "shape": "certificate", "title": "P" + cn,
                   "award": "Certificate of Achievement", "closed_list": [{"code": "A 1"}], "text": "A 1 Core",
                   "coverage": 1.0, "codes_found": ["A1"], "method": "page",
                   "source": {"url": "https://new.example/%s" % cn, "text_sha": "new" + cn}},
                  open(os.path.join(out, "sources", cn + ".json"), "w"))
    json.dump(entries, open(os.path.join(dest, "sources.json"), "w"))
    json.dump({"college": COLLEGE, "programs": len(cns)}, open(os.path.join(out, "capture.json"), "w"))
    return dest, out, cns


def snapshot(dest):
    return {os.path.basename(p): json.load(open(p)) for p in sorted(glob.glob(os.path.join(dest, "records", "*.json")))}


try:
    os.environ["SUPABASE_SERVICE_KEY"] = "test"

    # B. A database outage: every call answers 503.
    dest, out, cns = college_dirs("outage")
    C.COLLEGE_DIR = os.path.dirname(dest)
    before, before_sources = snapshot(dest), open(os.path.join(dest, "sources.json")).read()
    calls = []

    def outage(src, key, *a, **k):
        calls.append(src["control_number"])
        return {"error": "HTTP 503: " + json.dumps(ANSWER_503), "http_status": 503,
                "reason": "upstream_timeout", "detail": ANSWER_503["detail"]}
    X.call = outage
    rc = C.extract(out, 0, 1, "43400000000", 1, dest, None, None, halt_wait_s=0.01)
    check("B ⭐ a 503 halts the read: the step returns HALT_EXIT, red", rc == C.HALT_EXIT and rc != 0, repr(rc))
    check("B ⭐ the first program is tried once more and no other program is sent",
          calls == [cns[0], cns[0]], repr(calls))
    got = snapshot(out)
    check("B ⭐ every program keeps its filed record exactly, and none gets a stub",
          got == before and len(got) == len(cns) and not any("HTTP 503" in json.dumps(r) for r in got.values()),
          "%d of %d" % (len(got), len(before)))
    halt = C.extract_halt(out)
    check("B extract_halt_0.json names the status, the cause, the function's reason and where it stopped",
          halt and halt["status"] == 503 and halt["reason"] == "upstream_timeout" and halt["control_number"] == cns[0]
          and halt["not_sent"] == len(cns) and "database" in halt["cause"], repr(halt))
    _ns = os.path.join(out, "not_sent_0.json")
    ns = json.load(open(_ns)) if os.path.exists(_ns) else {}
    check("B every program is listed not sent, with the halt",
          sorted(ns.get("programs") or []) == cns and (ns.get("halted") or {}).get("status") == 503)
    check("B the step's message names the outage and that nothing was filed over a record",
          bool(halt) and "HTTP 503, upstream_timeout" in C.halt_message(halt, len(cns))
          and "Nothing was filed over a record" in C.halt_message(halt, len(cns)))

    # C. Filing the halted run (the wave files it) leaves the college as it was.
    C.file_run(COLLEGE, out, "43400000000")
    check("C ⭐ filing a halted run overwrites no record", snapshot(dest) == before)
    check("C ⭐ and keeps every program's sources.json entry, so the next run sends each one again",
          json.load(open(os.path.join(dest, "sources.json"))) == json.loads(before_sources))

    # D. A 503 that clears on the retry is no halt; the read goes on.
    dest2, out2, cns2 = college_dirs("blip")
    C.COLLEGE_DIR = os.path.dirname(dest2)
    seen = []

    def blip(src, key, *a, **k):
        seen.append(src["control_number"])
        if len(seen) == 1:
            return {"error": "HTTP 503: {}", "http_status": 503, "reason": "upstream_timeout"}
        return {"record": {"program": {}, "blocks": []}, "model": None, "usage": None}
    X.call = blip
    rc2 = C.extract(out2, 0, 1, "43400000001", 1, dest2, None, None, halt_wait_s=0.01)
    fresh = [json.load(open(p)) for p in glob.glob(os.path.join(out2, "records", "*.json"))]
    check("D ⭐ a 503 that clears on the retry is no halt: the allowed caller proceeds and every program is read",
          rc2 == 0 and len(seen) == len(cns2) + 1 and C.extract_halt(out2) is None
          and len(fresh) == len(cns2) and all(r.get("extracted_run") == "43400000001" for r in fresh),
          "rc %r, %d calls, %d records" % (rc2, len(seen), len(fresh)))

    dest3, out3, cns3 = college_dirs("refused")
    C.COLLEGE_DIR = os.path.dirname(dest3)
    before3, n3 = snapshot(dest3), []

    def refused(src, key, *a, **k):
        n3.append(src["control_number"])
        return {"error": "HTTP 401: {}", "http_status": 401, "reason": "key_refused"}
    X.call = refused
    rc3 = C.extract(out3, 0, 1, "43400000002", 1, dest3, None, None, halt_wait_s=0.01)
    got3 = snapshot(out3)
    check("D a refused key (401) halts the same way, with no record written over",
          rc3 == C.HALT_EXIT and len(n3) == 2 and got3 == before3 and (C.extract_halt(out3) or {}).get("status") == 401)

    dest4, out4, cns4 = college_dirs("one_bad")
    C.COLLEGE_DIR = os.path.dirname(dest4)
    n4 = []

    def one_bad(src, key, *a, **k):
        n4.append(src["control_number"])
        if src["control_number"] == cns4[0]:
            return {"error": "HTTP 502: bad gateway", "http_status": 502}
        return {"record": {"program": {}, "blocks": []}, "model": None, "usage": None}
    X.call = one_bad
    rc4 = C.extract(out4, 0, 1, "43400000003", 1, dest4, None, None, halt_wait_s=0.01)
    check("D a 502 is one program's failure, as before: no halt, every program sent once",
          rc4 == 0 and sorted(n4) == cns4 and C.extract_halt(out4) is None)
finally:
    X.call, C.COLLEGE_DIR = _saved[0], _saved[1]
    if _saved[2] is None:
        os.environ.pop("SUPABASE_SERVICE_KEY", None)
    else:
        os.environ["SUPABASE_SERVICE_KEY"] = _saved[2]
    shutil.rmtree(_tmp, ignore_errors=True)

# ── E. Where the halt shows ──
outcomes = {"capture": "success", "extract": "failure", "file": "success"}
cmp = {"pass_to_fail": [], "lost_coverage": []}
v = W.verdict(outcomes, {"x": 1}, {}, {}, cmp, 0, 12,
              {"status": 503, "reason": "upstream_timeout", "cause": X.HALT_STATUS[503]})
check("E the wave's verdict names the halt's status, reason and cause",
      v.startswith("failed: extract stopped, HTTP 503 upstream_timeout") and "database" in v, v)
check("E with no halt the verdict reads as before", W.verdict(outcomes, {"x": 1}, {}, {}, cmp, 0, 0) == "failed: extract")
WF = open(os.path.join(ROOT, ".github", "workflows", "program-requirements-college.yml"), encoding="utf-8").read()
file_step = WF.split("- name: File the run\n", 1)[1].split("- name:", 1)[0] if "- name: File the run\n" in WF else ""
check("E the one-college workflow's file step has no if:, so a halted extract (red) files nothing",
      file_step.strip().startswith("run: python3 kb/_program_requirements_college.py file") and "if:" not in file_step,
      file_step[:200])

failed = [r for r in results if not r[1]]
for name, ok, why in results:
    print(("ok   " if ok else "FAIL ") + name + ("" if ok or not why else "\n       " + str(why)[:400]))
print("\nprogram_requirements_extract_halt_test.py: %d/%d checks passed" % (len(results) - len(failed), len(results)))
sys.exit(1 if failed else 0)
