#!/usr/bin/env python3
"""A failed live-metrics scrape turns the daily run red (#2890 item 1, #2891 item 1; S601).

From 2026-11-05 to 11-07 the worker refused the scrape every night, the step printed
"Scrape failed ()" and kept the old live_metrics.json, and every run passed, so nobody
saw it. This guards that failure mode from both ends of daily-dashboard.yml:

  - the scrape step checks the HTTP status as well as the keys, and logs an ::error;
  - a last step, after the push and the summary, fails the run whenever the status
    is anything but success, so the dashboard still publishes and the run is still red.

Pure stdlib; runs in the `lints` CI job.
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
wf = open(os.path.join(ROOT, ".github", "workflows", "daily-dashboard.yml"), encoding="utf-8").read()
failures = []

scrape = wf[wf.find("name: Scrape live metrics"):wf.find("name: ", wf.find("name: Scrape live metrics") + 10)]
if "%{http_code}" not in scrape:
    failures.append("the scrape step no longer records the worker's HTTP status")
if "code != '200'" not in scrape:
    failures.append("the scrape step accepts a reply without checking for HTTP 200")
if "::error" not in scrape:
    failures.append("the scrape step's failure is not logged as an ::error")
if "scrape?secret=" in scrape or "--data-urlencode" not in scrape:
    failures.append("the scrape puts the secret in the URL unencoded; a base64 '+' reads back as a space (S601)")
if "x-scrape-secret" not in scrape:
    failures.append("the scrape does not send the x-scrape-secret header")
if "curl -s " in scrape:
    failures.append("the scrape uses curl -s, which hides curl's own error")

push = wf.find("name: Commit and push to main")
summary = wf.find("name: Summary")
fail = wf.find("name: Fail the run on a stale scrape")
if fail == -1:
    failures.append("no step fails the run on a stale scrape")
else:
    if not (push < summary < fail):
        failures.append("the fail step must come after the push and the summary, so the dashboard still publishes")
    tail = wf[fail:]
    if not re.search(r"if:\s*env\.LIVE_METRICS_STATUS\s*!=\s*'success'", tail):
        failures.append("the fail step is not gated on LIVE_METRICS_STATUS != 'success'")
    if "exit 1" not in tail:
        failures.append("the fail step does not exit non-zero")

if failures:
    print("FAIL daily scrape fails loudly:\n  " + "\n  ".join(failures))
    sys.exit(1)
print("PASS daily scrape fails loudly (status checked, ::error logged, last step turns the run red)")
