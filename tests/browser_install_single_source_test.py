#!/usr/bin/env python3
"""browser_install_single_source_test.py — a workflow installs the browser through one script.

On 2026-11-11 the runners could not resolve Ubuntu's archive, and every workflow that ran
`playwright install --with-deps chromium` spent ten minutes in DNS timeouts and failed before its own
work began. scripts/install_browser.sh installs the browser alone, launches it once, and fetches the
system packages only if it will not start. This test fails a workflow that writes the install line
itself, so the next fix lands in one place.

Run from the repo root:
    python3 tests/browser_install_single_source_test.py
"""
import glob
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = re.compile(r"playwright\s+install\b")
CALL = re.compile(r"bash scripts/install_browser\.sh(?: node)?\s*$", re.M)

failures, callers = [], 0
for path in sorted(glob.glob(os.path.join(ROOT, ".github", "workflows", "*.yml"))):
    with open(path, encoding="utf-8") as f:
        text = f.read()
    name = os.path.basename(path)
    for i, line in enumerate(text.splitlines(), 1):
        if RAW.search(line) and not line.lstrip().startswith("#"):
            failures.append("%s:%d installs the browser itself; call scripts/install_browser.sh" % (name, i))
    if CALL.search(text):
        callers += 1
        if text.index("install_browser.sh") < text.find("actions/checkout"):
            failures.append("%s calls the script before it checks the repository out" % name)

with open(os.path.join(ROOT, "scripts", "install_browser.sh"), encoding="utf-8") as f:
    script = f.read()
for want, why in (("python -m playwright install chromium\n", "installs the browser alone first"),
                  ("chromium.launch()", "launches it once"),
                  ("python -m playwright install --with-deps chromium", "keeps the system packages as the fallback"),
                  ("npx playwright install chromium\n", "covers the npm package"),
                  ("set -euo pipefail", "stops on a failed install")):
    if want not in script:
        failures.append("scripts/install_browser.sh no longer %s" % why)
code = "\n".join(l for l in script.splitlines() if not l.lstrip().startswith("#")) + "\n"
if code.index("install chromium\n") > code.index("--with-deps"):
    failures.append("scripts/install_browser.sh fetches the system packages before trying the browser alone")
if callers < 13:
    failures.append("only %d workflows call the script; 13 did on 2026-11-11" % callers)

if failures:
    print("FAIL: %d" % len(failures))
    for f in failures:
        print("  -", f)
    sys.exit(1)
print("ok: %d workflows install the browser through scripts/install_browser.sh" % callers)
