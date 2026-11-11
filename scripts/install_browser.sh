#!/usr/bin/env bash
# install_browser.sh — the one place a workflow installs Playwright's Chromium.
#
# The runner image already holds Chromium's system libraries. `playwright install --with-deps` only
# adds font packages from Ubuntu's archive, and on 2026-11-11 the runners could not resolve that
# archive: ten minutes of DNS timeouts, exit 100, and no page read (college page read 43040340552,
# twice; De Anza's capture 43046657326). So the browser is installed alone and launched once, and the
# packages are fetched only if it will not start.
#
# Usage, after the workflow has installed the playwright package itself:
#   bash scripts/install_browser.sh          # Python's playwright
#   bash scripts/install_browser.sh node     # the npm package (npx playwright)
# tests/browser_install_single_source_test.py fails a workflow that writes the install line itself.
set -euo pipefail

if [ "${1:-python}" = "node" ]; then
  npx playwright install chromium
  if ! node -e '
    const { chromium } = require("playwright");
    (async () => { const b = await chromium.launch(); const p = await b.newPage(); await p.setContent("<p>ok</p>"); await b.close(); })()
      .catch((e) => { console.error(String(e)); process.exit(1); });
  '; then
    echo "::warning title=Browser needed system packages::Chromium would not start; fetching them with --with-deps."
    npx playwright install --with-deps chromium
  fi
else
  python -m playwright install chromium
  if ! python - <<'PY'
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch()
    b.new_page().set_content("<p>ok</p>")
    b.close()
PY
  then
    echo "::warning title=Browser needed system packages::Chromium would not start; fetching them with --with-deps."
    python -m playwright install --with-deps chromium
  fi
fi
