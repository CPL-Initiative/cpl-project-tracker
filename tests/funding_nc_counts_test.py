#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Scenario 4's noncredit outcome counts: nc_cdcp, nc_exh, nc_course, builder checks.

Sam's Open Asks Sheets 113 and 114 (2026-10-22) release each noncredit share on
NC-1 (exhibits built or adopted for the noncredit program's learning, against
the greater of 2 and 5% of nc_cdcp, capped at 10) and NC-2 (a noncredit CPL
portfolio-development course chaptered in a CDCP program). The builder reads one
service-role RPC (kb/supabase_cpl_funding_nc_counts.sql) and matches here.

What this pins, in order of how expensive each would be to get wrong:

  1. ABSENT, NOT ZERO. With no RPC payload there is no nc_exh / nc_cdcp /
     nc_course key anywhere. srcDelivered() asks the artifact for the key, and a
     zero would turn TBA into a measured nothing.
  2. NO DENOMINATOR, NO TARGET. An institution COCI does not carry (or carries
     with no funding category) gets no nc_cdcp: a 0 would set NC-1's floor of 2.
  3. THE CHANNELS COUNT AS S468 MEASURED. Channel 2 (a target credit course
     with a CDCP twin), channel 1 (the exhibit's own title), channel 4 (the
     attested list, by MAP exhibit ID or title); one exhibit counts once.
  4. A STANDALONE COUNTS AT ITS DISTRICT'S CREDIT COLLEGES, against its own CDCP
     titles, and lands in origination.in_scope, never in colleges.
  5. NC-2 COUNTS ONLY A CONFIRMED COURSE: an attested control number the COCI
     read did not confirm stays 0.
  6. CHANNEL 3 COUNTS ONLY A CONFIRMED CROSSWALK ROW (funding/nc_credential_crosswalk.json),
     and only while one of its courses is still a CDCP title there; a proposed row
     counts nothing, and an exhibit already counted counts once.
  7. NEVER GUESSED. A COCI name that does not resolve is logged and moves nothing.
  8. A FAILED CALL IS RETRIED. The first daily run (2026-10-25) got HTTP 500 from
     PostgREST's 8 s statement timeout; a 500 then an answer counts, three 500s
     leave every nc key absent.

Run: python3 tests/funding_nc_counts_test.py
"""
import json
import os
import subprocess
import sys
import tempfile
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
BUILDER = os.path.join(ROOT, "funding", "_build_funding_performance.py")
SQL = os.path.join(ROOT, "kb", "supabase_cpl_funding_nc_counts.sql")
WORKFLOW = os.path.join(ROOT, ".github", "workflows", "daily-dashboard.yml")
VIEW = "View_StudentAggregatedValues_APIDataset"
COLUMNS = ["College", "Catalog Year", "Applied Credits", "Eligible Credits",
           "Transcribed Credits", "MAP Internal StudentID", "Potential Student", "Test Student"]
NC_KEYS = ("nc_exh", "nc_cdcp", "nc_course")

failures = []
checks = [0]


def check(label, cond, detail=""):
    checks[0] += 1
    if cond:
        print(f"PASS  {label}")
    else:
        print(f"FAIL  {label}" + (f"  — {detail}" if detail else ""))
        failures.append(label)


MAP_ROWS = [["Bakersfield College", "2026-2027", "6", "12", "6", f"b{i}", "", ""] for i in range(12)]


def ex(college, xid, title, title_norm, targets, exhibit_id=None):
    return {"college": college, "xid": xid, "exhibit_id": exhibit_id if exhibit_id is not None else xid,
            "title": title, "title_norm": title_norm, "targets": targets}


FIXTURE = {
    "fiscal_year": "2026-27",
    "institutions": [
        {"college": "Cabrillo College", "cdcp": 166,
         "titles": ["blueprint reading", "understanding infant development", "esl beginning literacy"]},
        {"college": "Cypress College", "cdcp": 0, "titles": []},
        {"college": "North Orange Continuing Education", "cdcp": 199, "titles": ["esl level one"]},
        {"college": "Nowhere Community College", "cdcp": 40, "titles": ["blueprint reading"]},
    ],
    "exhibits": [
        ex("Cabrillo College", "C-1", "Blueprint Reading I", "blueprint reading i", ["blueprint reading"]),   # channel 2
        ex("Cabrillo College", "C-2", "Understanding Infant Development", "understanding infant development", []),  # channel 1
        ex("Cabrillo College", "C-3", "Calculus", "calculus", ["calculus"]),                                 # none
        ex("Cabrillo College", "C-4", "QuickBooks", "quickbooks", []),                                       # attested by id
        ex("Cabrillo College", "t:French Wines", "French Wines", "french wines", [], exhibit_id=""),         # attested by title
        ex("Cabrillo College", "C-7", "Fork Lift", "fork lift", []),                                       # proposed only
        ex("Cabrillo College", "t:Wine Pairing", "Wine Pairing", "wine pairing", [], exhibit_id=""),        # course gone
        ex("Cabrillo College", "C-6", "Blueprint Reading", "blueprint reading", ["blueprint reading"]),      # channels 1 and 2: once
        ex("Cypress College", "CY-1", "ESL One", "esl one", ["esl level one"]),                              # NOCE's twin
        ex("Fullerton College", "CY-1", "ESL One", "esl one", ["esl level one"]),                            # same exhibit, adopted
        ex("Santa Ana College", "SA-1", "ESL One", "esl one", ["esl level one"]),                            # outside NOCE's district
    ],
    "attestations": [
        {"college": "Cabrillo", "status": "self_attested", "exhibits": "c-4; french wines\nNOT-IN-MAP",
         "portfolio_course": "CCC000111"},
        {"college": "NOCE", "status": "confirmed", "exhibits": None, "portfolio_course": "CCC000999"},
    ],
    "portfolio_courses": [{"college": "Cabrillo College", "control_number": "CCC000111"}],
}


CROSSWALK = {"rows": [
    {"college": "Cabrillo College", "exhibit": "C-3", "status": "confirmed", "confirmed_by": "test",
     "courses": [{"code": "BP 400", "title_norm": "blueprint reading"}]},                  # counts
    {"college": "Cabrillo College", "exhibit": "C-7", "status": "proposed", "confirmed_by": None,
     "courses": [{"code": "BP 400", "title_norm": "blueprint reading"}]},                  # proposed: no
    {"college": "Cabrillo College", "exhibit": "Wine Pairing", "status": "confirmed", "confirmed_by": "test",
     "courses": [{"code": "X 1", "title_norm": "no longer offered"}]},                     # course gone: no
    {"college": "Cabrillo College", "exhibit": "C-1", "status": "confirmed", "confirmed_by": "test",
     "courses": [{"code": "BP 400", "title_norm": "blueprint reading"}]},                  # channel 2 already: once
]}
COMMITTED_XWALK = os.path.join(ROOT, "funding", "nc_credential_crosswalk.json")


def run_builder(fixture=None, crosswalk=None, env_extra=None):
    payload = [{"viewName": VIEW, "generatedAt": "2026-10-25T00:00:00+00:00",
                "columnName": COLUMNS, "columnValue": MAP_ROWS}]
    env = {k: v for k, v in os.environ.items() if k != "SUPABASE_SERVICE_KEY"}
    env.update(env_extra or {})
    with tempfile.TemporaryDirectory() as td:
        src = os.path.join(td, "CustomReport_latest.json")
        out = os.path.join(td, "out.js")
        with open(src, "w", encoding="utf-8") as f:
            json.dump(payload, f)
        argv = [sys.executable, BUILDER, src, "--out", out]
        if fixture is not None:
            fx = os.path.join(td, "nc_counts.json")
            with open(fx, "w", encoding="utf-8") as f:
                json.dump(fixture, f)
            argv += ["--nc-counts", fx]
        if crosswalk is not None:
            xw = os.path.join(td, "xwalk.json")
            with open(xw, "w", encoding="utf-8") as f:
                json.dump(crosswalk, f)
            argv += ["--nc-crosswalk", xw]
        proc = subprocess.run(argv, capture_output=True, text=True, cwd=td, env=env)
        if proc.returncode != 0:
            raise AssertionError(f"builder exited {proc.returncode}\n{proc.stderr}")
        text = open(out, encoding="utf-8").read()
    return json.loads(text[text.index("{"):text.rindex("};") + 1]), proc.stdout


def all_keys(obj, out=None):
    out = set() if out is None else out
    if isinstance(obj, dict):
        for k, v in obj.items():
            out.add(k)
            all_keys(v, out)
    elif isinstance(obj, list):
        for v in obj:
            all_keys(v, out)
    return out


def serve_rpc(statuses):
    """A stand-in PostgREST: answers each POST with the next status in
    `statuses` (the last repeats), 200 carrying FIXTURE."""
    calls = []

    class H(BaseHTTPRequestHandler):
        def do_POST(self):
            self.rfile.read(int(self.headers.get("Content-Length") or 0))
            calls.append(self.path)
            code = statuses[min(len(calls), len(statuses)) - 1]
            body = json.dumps(FIXTURE if code == 200 else {"code": "57014"}).encode()
            self.send_response(code)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def log_message(self, *a):
            pass

    srv = HTTPServer(("127.0.0.1", 0), H)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    env = {"SUPABASE_SERVICE_KEY": "test", "SUPABASE_URL": f"http://127.0.0.1:{srv.server_port}",
           "CPL_NC_COUNTS_RETRY_S": "0", "no_proxy": "127.0.0.1", "NO_PROXY": "127.0.0.1"}
    return srv, calls, env


def main():
    # ── 1. no payload: absent, never zero ───────────────────────────────────
    p, log = run_builder()
    keys = all_keys(p)
    check("1a: with no RPC payload and no key, no nc_exh, nc_cdcp or nc_course anywhere",
          not any(k in keys for k in NC_KEYS), str(sorted(k for k in keys if k.startswith("nc_"))))
    check("1b: …and the run says why", "SUPABASE_SERVICE_KEY unset" in log)
    check("1c: the MAP measures still build", p["statewide"].get("pe", 0) > 0)

    # ── 2-6. a payload ──────────────────────────────────────────────────────
    p, log = run_builder(FIXTURE, {"rows": []})
    cols, st = p["colleges"], p["statewide"]
    og = (p.get("origination") or {}).get("in_scope") or {}
    cab, noce = cols.get("Cabrillo", {}), og.get("NOCE", {})
    check("2a: an institution COCI does not carry gets no nc_cdcp (Fresno City)",
          "nc_cdcp" not in cols.get("Fresno City", {}))
    check("2b: an institution COCI carries with no CDCP course gets a measured 0 (Cypress)",
          cols.get("Cypress", {}).get("nc_cdcp") == 0)
    check("3a: Cabrillo counts channels 1, 2 and 4, each exhibit once (C-1, C-2, C-4, French Wines, C-6)",
          cab.get("nc_exh") == 5, f"got {cab.get('nc_exh')}")
    check("3b: Cabrillo's denominator is its CDCP course count", cab.get("nc_cdcp") == 166)
    check("3c: Cypress counts no exhibit whose twin is NOCE's course", cols.get("Cypress", {}).get("nc_exh") == 0)
    check("4a: NOCE lands in origination.in_scope, never in colleges", "NOCE" not in cols and noce.get("nc_cdcp") == 199)
    check("4b: NOCE counts its district's exhibit once across Cypress and Fullerton, never Santa Ana's",
          noce.get("nc_exh") == 1, f"got {noce.get('nc_exh')}")
    check("5a: NC-2 counts Cabrillo's confirmed course", cab.get("nc_course") == 1)
    check("5b: an attested course COCI did not confirm stays 0 (NOCE)", noce.get("nc_course") == 0)
    check("6a: a COCI name that does not resolve is logged", "Nowhere Community College" in log)
    check("6b: …and moves no figure", st.get("nc_cdcp") == 166 + 0 + 199, f"got {st.get('nc_cdcp')}")
    check("6c: the statewide keys srcDelivered() reads are the institutions' sums",
          st.get("nc_exh") == 6 and st.get("nc_course") == 1, f"got {st.get('nc_exh')} / {st.get('nc_course')}")

    # ── channel 3: the curated crosswalk ────────────────────────────────────
    p3, log3 = run_builder(FIXTURE, CROSSWALK)
    cab3 = p3["colleges"].get("Cabrillo", {})
    check("6d: a confirmed crosswalk row adds its exhibit; a proposed row, a row whose course is no longer "
          "CDCP, and an exhibit already counted add nothing (5 + C-3 = 6)",
          cab3.get("nc_exh") == 6, f"got {cab3.get('nc_exh')}")
    check("6e: the run log names the confirmed rows it read", "3 confirmed crosswalk row(s)" in log3)
    xw = json.load(open(COMMITTED_XWALK, encoding="utf-8"))
    rows = xw.get("rows") or []
    check("6f: every committed crosswalk row is proposed or confirmed, and a confirmed row names who confirmed it",
          rows and all(r.get("status") in ("proposed", "confirmed") for r in rows) and
          all(r.get("confirmed_by") for r in rows if r.get("status") == "confirmed"))
    check("6g: every committed row names its college, exhibit and at least one course title_norm",
          all(r.get("college") and r.get("exhibit") and r.get("courses") and
              all(c.get("title_norm") for c in r["courses"]) for r in rows))

    # ── 8. a failed call is retried ─────────────────────────────────────────
    srv, calls, env = serve_rpc([500, 200])
    try:
        p8, log8 = run_builder(env_extra=env)
    finally:
        srv.shutdown()
    check("8a: a 500 then an answer: the counts land", "nc_exh" in p8["statewide"] and len(calls) == 2,
          f"calls={len(calls)} keys={sorted(k for k in all_keys(p8) if k.startswith('nc_'))}")
    check("8b: …and the run log says it answered on the second attempt",
          "attempt 1 failed" in log8 and "answered on attempt 2" in log8)
    srv, calls, env = serve_rpc([500])
    try:
        p8b, log8b = run_builder(env_extra=env)
    finally:
        srv.shutdown()
    check("8c: three 500s: three calls, and no nc key anywhere (absent, never zero)",
          len(calls) == 3 and not any(k in all_keys(p8b) for k in NC_KEYS), f"calls={len(calls)}")
    check("8d: …and the last line keeps the words a reader greps for",
          "cpl_funding_nc_counts failed (" in log8b and "on all 3 attempts" in log8b)

    # ── the SQL and the workflow ────────────────────────────────────────────
    sql = open(SQL, encoding="utf-8").read()
    check("7a: the RPC is closed to public, anon and authenticated, open to service_role (Rule 10 b2)",
          "revoke all on function public.cpl_funding_nc_counts() from public, anon, authenticated;" in sql and
          "grant execute on function public.cpl_funding_nc_counts() to service_role;" in sql)
    check("7b: the RPC returns no attestor, email or award count",
          not any(w in sql.split("select jsonb_build_object(")[1] for w in ("attestor", "email", "nc_awarded_count")))
    wf = open(WORKFLOW, encoding="utf-8").read()
    step = wf[wf.index("name: Build funding priority-metric actuals"):]
    step = step[:step.index("- name:", 10)]
    check("7c: the daily step hands the builder the service key", "SUPABASE_SERVICE_KEY" in step)

    print(f"\n{checks[0] - len(failures)}/{checks[0]} passed")
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
