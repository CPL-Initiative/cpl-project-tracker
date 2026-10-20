#!/usr/bin/env python3
"""The Common Subjects Reference's two quarterly routines, in probe mode (S431, 2026-10-20).

kb/csr_procedures.json carries two routines Sam asked for on 2026-10-19: `mq_list` (keep the MQ discipline list
current from the Chancellor's Office handbook) and `authority_tables` (keep the C-ID and CCN subject tables
current). Their sources answer a runner and refuse the sandbox, so they run on one
(.github/workflows/csr-quarterly.yml).

Probe mode is the first step the lane names: it asks each source what it serves today and prints one line per
source, `PROBE {json}`, carrying every value, because a session reads a runner through its job log (a run's
artifact sits on a host the sandbox proxy refuses). It writes no file and applies nothing.

Comparison mode (`--compare`, S433, 2026-10-20) reads each source against kb/reference/csr_quarterly_baseline.json,
what the source served when last read and accepted, and prints one `COMPARE {json}` line per source with a verdict:
`same`, `changed` (the edition or the handbook PDF's hash moved), `unread` (the source did not answer) or
`no_baseline` (nothing accepted yet: the C-ID hosts refuse a runner). It also writes the verdicts to the job's step
summary when GITHUB_STEP_SUMMARY is set, and exits 1 on `changed`, so the quarterly run reads red when the handbook
moved and a session turns the diff into a card for Sam. It applies nothing and never edits the baseline.

For the handbook it also follows the page's handbook link, hashes the PDF, reads the edition from the link, and
compares it with the edition kb/reference/mq_sections.json was read from.

    python3 kb/_csr_quarterly_probe.py            # probe every source
    python3 kb/_csr_quarterly_probe.py --compare  # probe, then read each source against the baseline
    python3 kb/_csr_quarterly_probe.py --dry-run  # list the sources, fetch nothing
"""
import hashlib
import html.parser
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MQ_SECTIONS = os.path.join(ROOT, "kb", "reference", "mq_sections.json")
BASELINE = os.path.join(ROOT, "kb", "reference", "csr_quarterly_baseline.json")

MQ_PAGE = ("https://www.cccco.edu/About-Us/Chancellors-Office/Divisions/Educational-Services-and-Support/"
           "What-we-do/Educational-Programs-and-Professional-Development/Minimum-Qualifications/")

# key, the routine it serves, the address, the links worth listing, and whether to follow the first one.
TARGETS = [
    {"key": "mq_page", "routine": "mq_list", "url": MQ_PAGE,
     "links": r"minimum.?qualifications.*\.pdf", "follow": True},
    # The C-ID site moved from c-id.net to c-idsystem.org (ASCCC); its search pages live on data-c-idsystem.org,
    # with no www (S437, 2026-10-20: c-idsystem.org/descriptors/ links /descriptors/final there, /courses/ links
    # /approved-courses). The sandbox proxy refuses the data host, so a runner reads it.
    {"key": "cid_home", "routine": "authority_tables", "url": "https://c-idsystem.org/",
     "links": r"descriptor|course|export|download|\.csv|data-c-idsystem"},
    {"key": "cid_data", "routine": "authority_tables", "url": "https://data-c-idsystem.org/descriptors/final",
     "links": r"descriptor|export|download|\.csv|\.xlsx|page="},
    {"key": "cid_courses", "routine": "authority_tables", "url": "https://data-c-idsystem.org/approved-courses",
     "links": r"export|download|\.csv|\.xlsx|discipline|page="},
]

EDITION = re.compile(r"(\d{1,2})(?:st|nd|rd|th)\s*edition", re.I)
UA = "cpl-project-tracker csr-quarterly probe (https://github.com/CPL-Initiative/cpl-project-tracker)"
MAX_LINKS = 25


class _Links(html.parser.HTMLParser):
    """Every <a href> with its text, and the page's <title>."""

    def __init__(self):
        super().__init__()
        self.links, self.title = [], ""
        self._href, self._text, self._in_title = None, [], False

    def handle_starttag(self, tag, attrs):
        if tag == "a":
            self._href, self._text = dict(attrs).get("href"), []
        elif tag == "title":
            self._in_title = True

    def handle_endtag(self, tag):
        if tag == "a" and self._href:
            self.links.append((self._href, " ".join("".join(self._text).split())))
            self._href = None
        elif tag == "title":
            self._in_title = False

    def handle_data(self, data):
        if self._href is not None:
            self._text.append(data)
        if self._in_title:
            self.title += data


def edition_of(*texts):
    """The edition number a link's text or address names (19 for "19th Edition" or "19theditionminimum..."), or None."""
    for t in texts:
        m = EDITION.search(urllib.parse.unquote(t or ""))
        if m:
            return int(m.group(1))
    return None


def committed_edition(path=MQ_SECTIONS):
    """The edition kb/reference/mq_sections.json was read from, from its `_source`."""
    try:
        with open(path, encoding="utf-8") as f:
            return edition_of(json.load(f).get("_source", ""))
    except (OSError, ValueError):
        return None


def fetch(url, timeout=60):
    """(status, final_url, content_type, body) for a GET; status None and the reason in content_type on failure."""
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.geturl(), r.headers.get("Content-Type", ""), r.read()
    except urllib.error.HTTPError as e:
        return e.code, url, e.headers.get("Content-Type", "") if e.headers else "", e.read() or b""
    except Exception as e:  # DNS, TLS, timeout: the probe reports it and moves on
        return None, url, "error: %s" % e, b""


def probe(target, get=fetch, committed=None):
    """What one source serves today, as a flat dict. Never raises on a network failure."""
    status, final, ctype, body = get(target["url"])
    out = {"key": target["key"], "routine": target["routine"], "url": target["url"], "status": status,
           "final_url": final, "content_type": ctype, "bytes": len(body),
           "sha256": hashlib.sha256(body).hexdigest() if body else None, "title": "", "links": []}
    if status is None or "html" not in (ctype or "").lower():
        return out
    parser = _Links()
    try:
        parser.feed(body.decode("utf-8", "replace"))
    except Exception as e:  # malformed markup: report what was read
        out["parse_error"] = str(e)
    out["title"] = " ".join(parser.title.split())
    pattern = re.compile(target["links"], re.I)
    seen = set()
    for href, text in parser.links:
        absolute = urllib.parse.urljoin(final or target["url"], href)
        if absolute in seen or not (pattern.search(absolute) or pattern.search(text)):
            continue
        seen.add(absolute)
        out["links"].append({"href": absolute, "text": text, "edition": edition_of(text, absolute)})
        if len(out["links"]) >= MAX_LINKS:
            break
    if target.get("follow") and out["links"]:
        first = out["links"][0]
        d_status, d_final, d_ctype, d_body = get(first["href"])
        out["document"] = {"href": first["href"], "status": d_status, "final_url": d_final, "content_type": d_ctype,
                           "bytes": len(d_body), "sha256": hashlib.sha256(d_body).hexdigest() if d_body else None,
                           "edition": first["edition"]}
        if committed is not None:
            out["committed_edition"] = committed
            out["edition_matches"] = first["edition"] == committed
    return out


def load_baseline(path=BASELINE):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def compare(result, base):
    """One source's verdict against its accepted baseline: same, changed, unread or no_baseline."""
    doc = result.get("document") or {}
    seen = {"edition": doc.get("edition"), "document_sha256": doc.get("sha256")}
    out = {"key": result["key"], "routine": result["routine"], "status": result["status"], "seen": seen}
    if not base or not base.get("document_sha256"):
        out["verdict"] = "no_baseline"
    elif result["status"] != 200 or doc.get("status") != 200 or not doc.get("sha256"):
        out["verdict"] = "unread"
    else:
        moved = [k for k in ("edition", "document_sha256") if seen[k] != base.get(k)]
        out["verdict"] = "changed" if moved else "same"
        if moved:
            out["moved"] = moved
            out["baseline"] = {k: base.get(k) for k in ("edition", "document_sha256", "read_at")}
    return out


def summary_md(verdicts):
    lines = ["## CSR quarterly comparison", "", "| source | routine | status | verdict |", "|---|---|---|---|"]
    for v in verdicts:
        lines.append("| %s | %s | %s | %s |" % (v["key"], v["routine"], v["status"], v["verdict"]))
    if any(v["verdict"] == "changed" for v in verdicts):
        lines += ["", "A source moved. A session reads the diff and opens a card for Sam; nothing is applied."]
    return "\n".join(lines) + "\n"


def main(argv):
    if "--dry-run" in argv:
        for t in TARGETS:
            print("TARGET %s %s %s" % (t["key"], t["routine"], t["url"]))
        return 0
    committed = committed_edition()
    results = []
    for t in TARGETS:
        r = probe(t, committed=committed if t["routine"] == "mq_list" else None)
        results.append(r)
        print("PROBE " + json.dumps(r, sort_keys=True))
    if "--compare" not in argv:
        return 0
    base = load_baseline()
    verdicts = [compare(r, base.get(r["key"])) for r in results]
    for v in verdicts:
        print("COMPARE " + json.dumps(v, sort_keys=True))
    step = os.environ.get("GITHUB_STEP_SUMMARY")
    if step:
        with open(step, "a", encoding="utf-8") as f:
            f.write(summary_md(verdicts))
    return 1 if any(v["verdict"] == "changed" for v in verdicts) else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
