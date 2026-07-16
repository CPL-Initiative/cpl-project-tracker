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

PRIMARY PATH (2026-07-16): the CO can provide a **full multi-college export**.
When it arrives, just drop it at kb/reference/coci_program_course_file.csv and run
kb/_build_program_course_graph.py — no scraping needed. THIS SCRIPT IS THE
FALLBACK for keeping the file fresh if no bulk export / API exists.

FALLBACK STATUS — the site is **DevExpress ASPx**, not plain HTML. First-run
diagnostics (Actions runs #1/#2) proved: 1 frame, **zero native `<select>`
elements** (the College / File Type "dropdowns" are **ASPxComboBox** widgets), and
DevExpress button ids `ASPxRoundPanel1_RunReportASPxButton_I` (View Report) +
`buttonSaveAs_I` (Export To). To finish the fallback driver: enumerate the combos
via `ASPxClientControl.GetControlCollection()` (the diagnostics block below dumps
their names/item counts), then drive them with the DevExpress client API
(`combo.SetSelectedIndex(i)` fires the AutoPostBack) → click View Report → CSV →
click Export → capture the download. Do NOT expect `page.locator("select")` to work.

NOTE: this CANNOT run from the Claude sandbox — its egress policy blocks
datamart.cccco.edu. It runs on the GitHub Actions runner
(.github/workflows/program-course-fetch.yml), whose network can reach the site.

Run (on the runner): python3 kb/_fetch_program_course_files.py
Env knobs: MCF_FILE_TYPES (comma list), MCF_LIMIT (int, for a smoke test),
           MCF_DELAY_MS (politeness delay between colleges).
"""
import csv
import io
import json
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
        page.goto(URL, wait_until="domcontentloaded")
        try:
            page.wait_for_selector("select", timeout=30000)
        except Exception:
            pass

        # ── Diagnostics: dump the real DOM shape so ONE run reveals it. ──
        _log("page title: %r" % page.title())
        _log("page url: %s" % page.url)
        _log("frames: %d" % len(page.frames))
        selects = page.locator("select")
        sel_info = []
        for i in range(selects.count()):
            s = selects.nth(i)
            opts = s.locator("option")
            n = opts.count()
            sample = [(opts.nth(j).inner_text() or "").strip() for j in range(min(n, 4))]
            sid, sname = s.get_attribute("id"), s.get_attribute("name")
            sel_info.append((i, sid, sname, n, sample))
            _log("  select[%d] id=%r name=%r options=%d sample=%r" % (i, sid, sname, n, sample))
        for tag in ("input[type=submit]", "input[type=button]", "button"):
            loc = page.locator(tag)
            for i in range(min(loc.count(), 8)):
                el = loc.nth(i)
                lab = el.get_attribute("value") or (el.inner_text() if tag == "button" else "") or ""
                _log("  %s[%d] label=%r id=%r" % (tag, i, lab.strip()[:44], el.get_attribute("id")))
        # DevExpress site: the "dropdowns" are ASPxComboBox widgets, not <select>.
        # Enumerate the client controls to get their names + item counts.
        try:
            controls = page.evaluate("""() => {
                try {
                    const arr = ASPxClientControl.GetControlCollection().GetControlsArray();
                    return arr.map(c => {
                        const o = {name: c.name, type: c.constructor && c.constructor.name};
                        try { if (typeof c.GetItemCount === 'function') o.items = c.GetItemCount(); } catch(e){}
                        try { if (typeof c.GetText === 'function') o.text = c.GetText(); } catch(e){}
                        return o;
                    });
                } catch(e) { return {error: String(e)}; }
            }""")
            _log("DevExpress client controls: %s" % json.dumps(controls)[:2500])
        except Exception as e:
            _log("DevExpress evaluate failed: %s" % e)
        inp = page.locator("input")
        for i in range(min(inp.count(), 24)):
            el = inp.nth(i)
            _log("  input[%d] id=%r type=%r class=%r" % (
                i, el.get_attribute("id"), el.get_attribute("type"),
                (el.get_attribute("class") or "")[:44]))

        # ── Detect the College and File Type selects by CONTENT, not index. ──
        def _find_college():
            best = None
            for (i, sid, sname, n, sample) in sel_info:
                tag = ((sid or "") + " " + (sname or "")).lower()
                if "college" in tag and n > 1:
                    return i
                if n > 1 and (best is None or n > sel_info[best][3]):
                    best = i
            return best

        def _find_filetype():
            for (i, sid, sname, n, sample) in sel_info:
                if any("course file" in (s or "").lower() for s in sample):
                    return i
                tag = ((sid or "") + " " + (sname or "")).lower()
                if ("file" in tag or "type" in tag) and n >= 2:
                    return i
            return None

        college_idx = _find_college()
        ft_idx = _find_filetype()
        _log("chosen: college select=%s, file-type select=%s" % (college_idx, ft_idx))
        if college_idx is None:
            _log("NO COLLEGE SELECT FOUND — HTML snippet:")
            _log(page.content()[:3000])
            browser.close()
            return 0, [("*", "*", "no college select found")]

        copts = page.locator("select").nth(college_idx).locator("option")
        colleges = []
        for i in range(copts.count()):
            val = copts.nth(i).get_attribute("value")
            txt = (copts.nth(i).inner_text() or "").strip()
            if val and txt and "select" not in txt.lower():
                colleges.append((val, txt))
        _log("Found %d colleges." % len(colleges))
        if limit:
            colleges = colleges[:limit]

        for ci, (cval, ctext) in enumerate(colleges, 1):
            for ft in file_types:
                try:
                    # Re-query selects fresh each time — an ASP.NET AutoPostBack
                    # re-renders the DOM, so cached handles go stale.
                    page.locator("select").nth(college_idx).select_option(value=cval)
                    page.wait_for_load_state("networkidle")
                    if ft_idx is not None:
                        page.locator("select").nth(ft_idx).select_option(label=ft)
                        page.wait_for_load_state("networkidle")
                    page.get_by_role("button", name=BTN_VIEW, exact=False).click()
                    page.wait_for_load_state("networkidle")
                    # Choose CSV, then Export triggers a download.
                    try:
                        page.get_by_text(RADIO_CSV, exact=True).click()
                    except Exception:
                        pass  # CSV is the default radio
                    with page.expect_download() as dl_info:
                        page.get_by_role("button", name=BTN_EXPORT, exact=False).click()
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
