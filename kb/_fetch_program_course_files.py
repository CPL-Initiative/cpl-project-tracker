#!/usr/bin/env python3
"""Fetch the CCCCO Data Mart "College Master Course/Program File" for EVERY
college and concatenate to one CSV — the "no Select All" workaround.

The Data Mart (https://datamart.cccco.edu/Courses/College_MCF.aspx) is an
ASP.NET WebForms report with a per-college dropdown and no bulk export. A real
headless browser (Playwright/Chromium) drives it: read the College dropdown's
full option list, then for each college select the file type, View Report, and
Export → CSV. A browser handles all the __VIEWSTATE / postback machinery, so
there is nothing brittle to reverse-engineer.

File types (confirmed from the live dropdown):
  - "Master Course File"   → course-level, with Max/Min Units (no program link)
  - "Program File"         → program-level (title / award / status)
  - "Program Course File"  → the program→course JOIN (what the graph needs)

We pull "Program Course File" (the keystone join) and "Program File" (fresh
program metadata, so we stop depending on the stale coci_program_export snapshot).

Outputs (repo-relative):
  kb/reference/coci_program_course_file.csv
  kb/reference/coci_program_file.csv

NOTE: this CANNOT run from the Claude sandbox — its egress policy blocks
datamart.cccco.edu. It runs on the GitHub Actions runner
(.github/workflows/program-course-fetch.yml), whose network can reach the site.
Selectors marked "VERIFY ON FIRST RUN" are the spots to adjust against the real
page if the first Actions run trips.

Run (on the runner): python3 kb/_fetch_program_course_files.py
Env knobs: MCF_FILE_TYPES (comma list), MCF_LIMIT (int, for a smoke test),
           MCF_DELAY_MS (politeness delay between colleges).
"""
import csv
import io
import os
import sys
import time

URL = "https://datamart.cccco.edu/Courses/College_MCF.aspx"
HERE = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(HERE, "reference")

# File type -> output filename.
FILE_TYPES = {
    "Program Course File": "coci_program_course_file.csv",
    "Program File": "coci_program_file.csv",
}

# Labels visible on the page (VERIFY ON FIRST RUN — adjust if the DOM differs).
LBL_COLLEGE = "Select College"
LBL_FILETYPE = "Select File Type"
BTN_VIEW = "View Report"
BTN_EXPORT = "Export To"
RADIO_CSV = "CSV"


def _log(msg):
    print(msg, flush=True)


def fetch_all(file_types=None, limit=None, delay_ms=1200):
    from playwright.sync_api import sync_playwright

    file_types = file_types or list(FILE_TYPES.keys())
    os.makedirs(OUT_DIR, exist_ok=True)
    results = {ft: [] for ft in file_types}          # ft -> list[dict rows]
    headers = {ft: None for ft in file_types}
    failures = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(accept_downloads=True)
        page = ctx.new_page()
        page.set_default_timeout(45000)
        page.goto(URL, wait_until="networkidle")

        # Enumerate the college dropdown options (skip the blank prompt).
        college_select = page.locator("select").first  # VERIFY: first select = College
        options = college_select.locator("option")
        colleges = []
        for i in range(options.count()):
            val = options.nth(i).get_attribute("value")
            txt = (options.nth(i).inner_text() or "").strip()
            if val and txt and "select" not in txt.lower():
                colleges.append((val, txt))
        _log("Found %d colleges." % len(colleges))
        if limit:
            colleges = colleges[:limit]

        selects = page.locator("select")
        for ci, (cval, ctext) in enumerate(colleges, 1):
            for ft in file_types:
                try:
                    # Re-select college (a file-type/college postback may reset state).
                    selects.nth(0).select_option(value=cval)     # College
                    page.wait_for_load_state("networkidle")
                    page.locator("select").nth(1).select_option(label=ft)  # File Type
                    page.wait_for_load_state("networkidle")
                    page.get_by_role("button", name=BTN_VIEW).click()
                    page.wait_for_load_state("networkidle")
                    # Choose CSV, then Export triggers a download.
                    try:
                        page.get_by_text(RADIO_CSV, exact=True).click()
                    except Exception:
                        pass  # CSV is the default radio
                    with page.expect_download() as dl_info:
                        page.get_by_role("button", name=BTN_EXPORT).click()
                    download = dl_info.value
                    raw = _read_download(download)
                    rows = list(csv.DictReader(io.StringIO(raw)))
                    if rows:
                        if headers[ft] is None:
                            headers[ft] = list(rows[0].keys())
                        results[ft].extend(rows)
                    _log("  [%d/%d] %-28s %-20s %d rows"
                         % (ci, len(colleges), ctext, ft, len(rows)))
                except Exception as e:
                    failures.append((ctext, ft, str(e)[:120]))
                    _log("  [%d/%d] %-28s %-20s FAILED: %s"
                         % (ci, len(colleges), ctext, ft, str(e)[:120]))
                time.sleep(delay_ms / 1000.0)
        browser.close()

    # Write one concatenated CSV per file type.
    for ft, fname in FILE_TYPES.items():
        if ft not in results or not results[ft]:
            continue
        path = os.path.join(OUT_DIR, fname)
        with open(path, "w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=headers[ft])
            w.writeheader()
            w.writerows(results[ft])
        _log("WROTE %s — %d rows" % (path, len(results[ft])))

    if failures:
        _log("\n%d college/file-type fetches failed:" % len(failures))
        for c, ft, err in failures[:40]:
            _log("  - %s / %s: %s" % (c, ft, err))
    # Non-zero exit if EVERYTHING failed (so CI/commit-guard catches a broken run).
    got = sum(len(v) for v in results.values())
    return got, failures


def _read_download(download):
    """Read a Playwright download's bytes as text without assuming a temp path."""
    path = download.path()
    with open(path, "r", encoding="utf-8-sig", errors="replace") as f:
        return f.read()


def main():
    fts = os.environ.get("MCF_FILE_TYPES")
    file_types = [s.strip() for s in fts.split(",")] if fts else None
    limit = int(os.environ["MCF_LIMIT"]) if os.environ.get("MCF_LIMIT") else None
    delay = int(os.environ.get("MCF_DELAY_MS", "1200"))
    got, failures = fetch_all(file_types, limit, delay)
    if got == 0:
        _log("ERROR: 0 rows fetched — treating as failure.")
        sys.exit(1)


if __name__ == "__main__":
    main()
