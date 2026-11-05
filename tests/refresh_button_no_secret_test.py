#!/usr/bin/env python3
"""The refresh button carries no shared secret (SEC-3; COBIx round 1 item 2, 2026-11-05).

Guards the failure mode where a regeneration or a hand edit puts the worker's trigger
secret back into the public page: the generator, both HTMLs (Rule 4) and the click module
must name no `secret=` on the worker URL and no `CPL_SCRAPE_` literal, and the button must
hand its click to cobi_refresh.js. Pure stdlib; runs in the `lints` CI job and from
scripts/check_generated.sh's neighbors (`python3 tests/refresh_button_no_secret_test.py`).
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FILES = ["excel_to_dashboard.py", "index.html", "CPL_Dashboard.html", "cobi_refresh.js", "cpl_writer.js"]
failures = []

for rel in FILES:
    text = open(os.path.join(ROOT, rel), encoding="utf-8").read()
    if re.search(r"CPL_SCRAPE_\w+", text):
        failures.append(f"{rel}: carries a CPL_SCRAPE_ literal")
    if re.search(r"workers\.dev/trigger\?secret=", text):
        failures.append(f"{rel}: sends the trigger secret in the query string")
    if re.search(r"body:\s*JSON\.stringify\(\{\s*secret\s*:", text):
        failures.append(f"{rel}: sends a secret in the trigger body")

for rel in ("index.html", "CPL_Dashboard.html"):
    text = open(os.path.join(ROOT, rel), encoding="utf-8").read()
    m = re.search(r'<button id="refreshBtn"[^>]*onclick="([^"]*)"', text)
    if not m or m.group(1).strip() != "cobiTriggerRefresh(this)":
        failures.append(f"{rel}: the refresh button does not hand its click to cobi_refresh.js")
    if '<script src="cobi_refresh.js"></script>' not in text:
        failures.append(f"{rel}: does not load cobi_refresh.js")

gen = open(os.path.join(ROOT, "excel_to_dashboard.py"), encoding="utf-8").read()
if "onclick=\"cobiTriggerRefresh(this)\"" not in gen:
    failures.append("excel_to_dashboard.py: the generator no longer writes onclick=\"cobiTriggerRefresh(this)\"")

if failures:
    print("refresh_button_no_secret: FAIL")
    for f in failures:
        print("  -", f)
    sys.exit(1)
print(f"refresh_button_no_secret: ok ({len(FILES)} files clean; both HTMLs hand the click to cobi_refresh.js)")
