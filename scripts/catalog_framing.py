#!/usr/bin/env python3
"""scripts/catalog_framing.py: can a college's catalog page show inside COBI?

Sam, 2026-10-09, reading a Cerritos record beside its catalog page in two windows:
"It would be nice if you could show a split view like this on the Prog Rev tab so I
don't have to do it manually." The Program Requirements tab can put the catalog page
in a frame beside the record only where the college's site allows another site to
frame it; a site that sends X-Frame-Options or a CSP frame-ancestors refusal shows an
error box instead, and the browser does not tell the page which happened.

So this reads it once per host, from a runner (the session container cannot reach
college sites): for each catalog host it loads one page and records the two headers,
then loads a parent page served at COBI's own origin (https://cpl-initiative.github.io)
holding an iframe of that page, and records whether the frame showed the catalog or
the browser's refusal. The frame test is the verdict; the headers say why.

Hosts come from anon reads (the key the tab itself uses): every program record's
source_url anon may read, then each registry row's catalog_url for a host not yet
seen. One load and one framed load per host, 3 s apart, under the census user agent
that names the CPL Initiative (Sam's call 5 on sheet 23).

Writes nothing anywhere. It prints a line per host and, last, the JSON a session
commits to kb/catalog_framing.json, which the tab reads to choose the side-by-side
frame or a window beside it.

  python3 scripts/catalog_framing.py            # every host
  python3 scripts/catalog_framing.py --only cerritos
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
import urllib.request
from datetime import datetime, timezone
from urllib.parse import urlsplit

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
from _program_source_census import UA_SUFFIX  # noqa: E402  the census user agent

REST = "https://hvuwhnbuahrtptokpqfh.supabase.co/rest/v1"
# The public anon key program_requirements.js carries; anon reads checked records only.
ANON = ("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2dXdobmJ1YWhydHB0b2"
        "twcWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NzI0ODEsImV4cCI6MjA5MTE0ODQ4MX0.p0q-93iTM0GkF2z8_q"
        "7Vvl1tsX9SFGMM-W7Wdx7WfmM")
COBI = "https://cpl-initiative.github.io"
PARENT = COBI + "/__catalog_framing_check.html"


def anon(path: str) -> list[dict]:
    req = urllib.request.Request(REST + "/" + path, headers={"apikey": ANON, "Authorization": "Bearer " + ANON})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def hosts_to_read() -> dict[str, dict]:
    """One sample address per host: a record's page first (what the tab frames), else the
    registry's catalog address."""
    out: dict[str, dict] = {}
    for r in anon("program_requirement_records?select=college,source_url&source_url=not.is.null&order=college"):
        h = urlsplit(r["source_url"]).hostname
        if h:
            out.setdefault(h, {"sample": r["source_url"], "colleges": set()})["colleges"].add(r["college"])
    for r in anon("program_source_registry?select=college,catalog_url&catalog_url=not.is.null&order=college"):
        h = urlsplit(r["catalog_url"]).hostname
        if h:
            out.setdefault(h, {"sample": r["catalog_url"], "colleges": set()})["colleges"].add(r["college"])
    return out


def frame_ancestors(csp: str) -> str | None:
    for part in (csp or "").split(";"):
        part = part.strip()
        if part.lower().startswith("frame-ancestors"):
            return part[len("frame-ancestors"):].strip()
    return None


def headers_allow(xfo: str | None, fa: str | None) -> bool | None:
    """What the headers say about framing at COBI's origin. Neither header means a browser
    frames the page; None only for an X-Frame-Options value a browser may read either way."""
    if fa is not None:
        srcs = fa.split()
        if any(s in ("*", "https:", COBI, COBI + "/") or s == "https://*.github.io" for s in srcs):
            return True
        return False
    if xfo:
        return False if re.match(r"\s*(deny|sameorigin)\b", xfo, re.I) else None
    return True


def check(ctx, host: str, sample: str) -> dict:
    row = {"sample": sample}
    page = ctx.new_page()
    try:
        resp = page.goto(sample, wait_until="domcontentloaded", timeout=45000)
        hdr = resp.headers if resp else {}
        row["status"] = resp.status if resp else None
        row["xfo"] = hdr.get("x-frame-options")
        row["frame_ancestors"] = frame_ancestors(hdr.get("content-security-policy", ""))
        row["pdf"] = "pdf" in (hdr.get("content-type") or "").lower()
    except Exception as exc:  # a host that never answers is recorded, not fatal
        row["error"] = str(exc).splitlines()[0][:200]
        if "Download is starting" in row["error"]:
            # A PDF served as a download never renders in headless Chromium, so read its
            # headers with a plain request instead (run 38005833715: 17 such hosts).
            try:
                # HEAD, never GET: a whole catalog PDF took 16 minutes to download in run
                # 38009803753 and timed the job out. GET only where a host refuses HEAD.
                r = ctx.request.fetch(sample, method="HEAD", timeout=45000, max_redirects=5)
                if r.status in (405, 501):
                    r = ctx.request.get(sample, timeout=45000, max_redirects=5)
                hdr = r.headers
                row["attachment"] = "attachment" in (hdr.get("content-disposition") or "").lower()
                row["status"] = r.status
                row["xfo"] = hdr.get("x-frame-options")
                row["frame_ancestors"] = frame_ancestors(hdr.get("content-security-policy", ""))
                row["pdf"] = True
                row.pop("error", None)
            except Exception as exc2:
                row["error"] = str(exc2).splitlines()[0][:200]
    finally:
        page.close()
    time.sleep(3)

    parent = ctx.new_page()
    try:
        parent.route(PARENT, lambda route: route.fulfill(
            status=200, content_type="text/html",
            body='<!doctype html><title>frame check</title><iframe id="f" src="%s" width="900" height="700"></iframe>'
                 % sample.replace('"', "%22")))
        parent.goto(PARENT, wait_until="domcontentloaded", timeout=30000)
        parent.wait_for_timeout(9000)
        kids = [f for f in parent.frames if f != parent.main_frame]
        url = kids[0].url if kids else ""
        body = ""
        if kids and not url.startswith("chrome-error:"):
            try:
                body = kids[0].evaluate("document.body ? document.body.innerText.slice(0, 2000) : ''")
            except Exception:
                body = ""
        row["frame_url"] = url
        row["frames"] = bool(kids) and not url.startswith("chrome-error:") and url not in ("", "about:blank") and len(body.strip()) > 40
    except Exception as exc:
        row["frames"] = None
        row["frame_error"] = str(exc).splitlines()[0][:200]
    finally:
        parent.close()
    # Headers not read (the host never answered) say nothing, so neither does the verdict.
    read = row.get("status") is not None and "error" not in row
    row["headers_say"] = headers_allow(row.get("xfo"), row.get("frame_ancestors")) if read else None
    if row.get("pdf") or not read:
        # Headless Chromium draws no PDF in a frame, so the frame test cannot see one;
        # a PDF host is judged by its headers alone, and an unread host stays unknown.
        # A file sent as an attachment downloads from a frame too, so it gets its own window.
        row["frames"] = False if row.get("attachment") else row["headers_say"]
    time.sleep(3)
    return row


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--only", default="", help="only hosts or colleges containing this text")
    a = ap.parse_args()
    hosts = hosts_to_read()
    if a.only:
        t = a.only.lower()
        hosts = {h: v for h, v in hosts.items() if t in h or any(t in c.lower() for c in v["colleges"])}
    from playwright.sync_api import sync_playwright  # runner only

    result = {"checked_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
              "run": os.environ.get("GITHUB_RUN_ID") or None, "origin": COBI, "hosts": {}}
    with sync_playwright() as p:
        browser = p.chromium.launch()
        probe = browser.new_page()
        ua = probe.evaluate("navigator.userAgent").replace("HeadlessChrome", "Chrome")
        probe.close()
        ctx = browser.new_context(user_agent=ua + " " + UA_SUFFIX, accept_downloads=False)
        for i, (h, v) in enumerate(sorted(hosts.items()), 1):
            row = check(ctx, h, v["sample"])
            row["colleges"] = sorted(v["colleges"])
            result["hosts"][h] = row
            print("%3d/%d %-44s frames=%-5s status=%s xfo=%s fa=%s" % (
                i, len(hosts), h, row.get("frames"), row.get("status"), row.get("xfo"), row.get("frame_ancestors")), flush=True)
        browser.close()
    print("CATALOG_FRAMING_JSON_BEGIN")
    print(json.dumps(result, indent=1, sort_keys=True))
    print("CATALOG_FRAMING_JSON_END")
    return 0


if __name__ == "__main__":
    sys.exit(main())
