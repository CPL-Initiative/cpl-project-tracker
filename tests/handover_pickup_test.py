#!/usr/bin/env python3
"""Guard for kb/_handover_pickup.py, the reader's pickup for hand-overs (Sam, 2026-11-20: "item or link and a try the
link button").

    python3 tests/handover_pickup_test.py

WHAT THIS GUARDS (each a way the pickup could mislead a person, press on a site, or keep what it must not):
  (1) a bot check is filed as a bot check, whatever the status code says (a WAF header on a 202, a block title on a
      200, a 403), and never as a page that reads;
  (2) after a host answers one bot check in a run, the reader loads nothing more from that host (Sam, 2026-11-18,
      #3536: the reader stops at one);
  (3) robots.txt's refusal, a sign-in wall, a missing page and an address that never answers each read as what they
      are, with words a person can act on;
  (4) a page that reads is counted by the outline reader's own parser, and `found` carries counts and heading words
      only: no line of the page's text, and no name printed on it;
  (5) a dropped PDF, saved web page, text file and CSV are each opened and counted; an empty file, a file that is no
      PDF and a scan with no text say so; a kind the pickup does not open is stored and sized;
  (6) the pickup never reads who handed a row over or the file's name, and its log line names neither, nor the
      address;
  (7) pasted data and a saved API procedure with no test are left waiting for a session; a test of an API address is
      one GET, robots.txt first, and a refusal or a challenge reads as one;
  (8) the named row goes first; every row the reader looked at is answered exactly once, with the run's id.
"""
from __future__ import annotations

import importlib.util
import io
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("handover_pickup", os.path.join(ROOT, "kb", "_handover_pickup.py"))
hp = importlib.util.module_from_spec(spec)
spec.loader.exec_module(hp)
SRC = open(os.path.join(ROOT, "kb", "_handover_pickup.py"), encoding="utf-8").read()

results = []


def check(name, cond, why=""):
    results.append((name, bool(cond), why))


OUTLINE = """COURSE OUTLINE OF RECORD
HLTH 167 Staying Mentally Sharp for Older Adults
Originator: Pat Q. Faculty
Student Learning Outcomes
1. Identify the changes of normal aging in memory.
2. Practice three strategies that support recall.
Course Objectives
1. Describe how sleep affects attention.
2. Compare two memory techniques.
3. Plan a weekly routine of mental exercise.
Methods of Instruction
Lecture and discussion.
"""


def page(**kw):
    base = {"url": "https://outlines.example.edu/hlth167", "final_url": "https://outlines.example.edu/hlth167", "status": 200,
            "access": "ok", "title": "HLTH 167", "content_type": "text/html; charset=utf-8", "links": [], "body": OUTLINE, "html": ""}
    base.update(kw)
    return base


class FakeReader:
    """Stands in for the polite Reader: load() answers from a table by host and counts the loads."""

    def __init__(self, table):
        self.table, self.loaded = table, []
        self.page = self
        self.request = self

    def evaluate(self, _js):
        raise RuntimeError("no browser here")   # load_full keeps the page's own body

    def load(self, url):
        self.loaded.append(url)
        return dict(self.table[url], url=url)


class FakeApi:
    def __init__(self, files=None):
        self.files, self.marks = files or {}, []

    def file(self, path):
        return self.files[path]

    def mark(self, row_id, status, note, run, found):
        self.marks.append({"id": row_id, "status": status, "note": note, "run": run, "found": found})
        return {"rows": 1}


def make_pdf(text_lines):
    """A small real PDF holding the given lines (or none: a page with no text, as a scan has)."""
    objs, stream = [], b"BT /F1 12 Tf 72 720 Td 14 TL " + b"".join(
        b"(" + ln.replace("(", "[").replace(")", "]").encode("latin-1") + b") Tj T* " for ln in text_lines) + b"ET"
    objs.append(b"<< /Type /Catalog /Pages 2 0 R >>")
    objs.append(b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>")
    objs.append(b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>")
    objs.append(b"<< /Length %d >>\nstream\n" % len(stream) + stream + b"\nendstream")
    objs.append(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
    out, offsets = io.BytesIO(), []
    out.write(b"%PDF-1.4\n")
    for i, o in enumerate(objs, 1):
        offsets.append(out.tell())
        out.write(b"%d 0 obj\n" % i + o + b"\nendobj\n")
    xref = out.tell()
    out.write(b"xref\n0 %d\n0000000000 65535 f \n" % (len(objs) + 1))
    for off in offsets:
        out.write(b"%010d 00000 n \n" % off)
    out.write(b"trailer\n<< /Size %d /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF\n" % (len(objs) + 1, xref))
    return out.getvalue()


def main():
    # ── (1) a bot check, by each of its signs ──
    for name, pg in (("a WAF header on a 202", page(status=202, waf="x-amzn-waf-action: challenge", body="", title="")),
                     ("the reader's own challenge filing (robots.txt answered by a WAF)", page(status=None, access="challenge", waf="robots.txt: challenge", body="", title="")),
                     ("a block title on a 200", page(title="Just a moment...", body="Checking your browser")),
                     ("a 403", page(status=403, body="", title="")),
                     ("a 429", page(status=429, body="", title=""))):
        status, note, found = hp.judge_link(pg, {"outcomes": 9})
        check("(1) %s is a bot check" % name, status == "bot_check" and "outcomes" not in found, "%s | %s | %s" % (status, note, found))

    # ── (3) each other answer reads as what it is ──
    cases = (("robots.txt's refusal", page(status=None, access="robots_disallow"), "could_not_read", "robots.txt refuses"),
             ("an address that never answers", page(status=None, access="unreachable"), "could_not_read", "did not answer"),
             ("a 401", page(status=401), "could_not_read", "asks for a sign-in"),
             ("a missing page", page(status=404), "could_not_read", "was not found (status 404)"),
             ("a server error", page(status=500), "could_not_read", "answered with status 500"))
    for name, pg, want, words in cases:
        status, note, _ = hp.judge_link(pg, None)
        check("(3) %s reads as it is" % name, status == want and words in note, "%s | %s" % (status, note))
    signin = page(body="Please sign in to continue", title="Sign In", html='<form><input type="password" name="password"></form>')
    status, note, _ = hp.judge_link(signin, None)
    check("(3) a sign-in wall reads as one", status == "could_not_read" and "sign-in" in note, "%s | %s" % (status, note))

    # ── (4) a page that reads: the parser's count, and nothing of the text ──
    parsed = hp.counts_of("", OUTLINE, "https://outlines.example.edu/hlth167")
    check("(4) the outline reader's parser counts the outcomes and objectives", parsed["outcomes"] == 2 and parsed["objectives"] == 3, json.dumps(parsed))
    check("(4) the section headings are the parser's own words", "STUDENT LEARNING OUTCOMES" in parsed["section_heads"] and "METHODS OF INSTRUCTION" in parsed["section_heads"], json.dumps(parsed["section_heads"]))
    status, note, found = hp.judge_link(page(), parsed)
    blob = json.dumps(found)
    check("(4) a page that reads is filed reads, with its count", status == "reads" and found["outcomes"] == 2 and found["objectives"] == 3 and found["http_status"] == 200, blob)
    check("(4) ⭐ what was found carries no line of the page and no name printed on it",
          "Pat Q. Faculty" not in blob and "Originator" not in blob and "Identify the changes" not in blob and "Lecture" not in blob, blob)
    check("(4) what was found is counts, a host, a type and heading words",
          set(found) <= {"http_status", "final_host", "content_type", "outcomes", "objectives", "section_heads", "chars"}, sorted(found))

    # ── (5) dropped files ──
    pdf = make_pdf(OUTLINE.strip().split("\n"))
    status, note, found = hp.judge_file(pdf, "application/pdf")
    check("(5) a dropped PDF is opened and counted", status == "reads" and found["pages"] == 1 and found["outcomes"] == 2 and found["objectives"] == 3, "%s | %s | %s" % (status, note, found))
    check("(5) ⭐ a PDF's count carries no line of its text and no name printed in it", "Pat Q. Faculty" not in json.dumps(found) and "Identify the changes" not in json.dumps(found), json.dumps(found))
    status, note, found = hp.judge_file(make_pdf([]), "application/pdf")
    check("(5) a scan with no text says so", status == "could_not_read" and "no text our reader can read" in note, "%s | %s" % (status, note))
    status, note, _ = hp.judge_file(b"this is not a pdf", "application/pdf")
    check("(5) a file that is no PDF says so", status == "could_not_read" and "could not be opened as a PDF" in note, "%s | %s" % (status, note))
    status, note, _ = hp.judge_file(b"", "application/pdf")
    check("(5) an empty file says so", status == "could_not_read" and "empty" in note, "%s | %s" % (status, note))
    saved = ("<html><head><style>p{color:red}</style><script>var x = 'Student Learning Outcomes';</script></head><body><h1>HLTH 167</h1>"
             "<h2>Student Learning Outcomes</h2><ol><li>Identify the changes of normal aging in memory.</li><li>Practice three strategies that support recall.</li></ol>"
             "<h2>Methods of Instruction</h2><p>Lecture.</p></body></html>").encode("utf-8")
    status, note, found = hp.judge_file(saved, "text/html")
    check("(5) a saved web page is opened and counted", status == "reads" and found["outcomes"] == 2, "%s | %s | %s" % (status, note, found))
    check("(5) a saved page's script and style are no part of its text", "var x" not in hp.html_text(saved.decode()) and "color:red" not in hp.html_text(saved.decode()))
    status, note, found = hp.judge_file(OUTLINE.encode("utf-8"), "text/plain")
    check("(5) a text file is counted", status == "reads" and found["outcomes"] == 2 and found["objectives"] == 3, json.dumps(found))
    status, note, found = hp.judge_file("﻿College,Control Number,Term\nOhlone College,CCC000337481,Spring 2026\nOhlone College,CCC000141070,Spring 2026\n".encode("utf-8"), "text/csv")
    check("(5) a CSV reads as its header and its row count", status == "reads" and found["rows"] == 2 and found["columns"] == ["College", "Control Number", "Term"], json.dumps(found))
    status, note, found = hp.judge_file(b"PK\x03\x04 zipped", "application/zip")
    check("(5) a kind the pickup does not open is stored and sized", status == "reads" and "A session opens this kind of file" in note and found == {"bytes": 11, "file_type": "application/zip"}, "%s | %s | %s" % (status, note, found))

    # ── (6) the person and the file's name stay out ──
    check("(6) ⭐ the pickup never selects who handed a row over or the file's name", "handed_by" not in hp.COLUMNS and "file_name" not in hp.COLUMNS, hp.COLUMNS)
    row = {"id": "11111111-2222-3333-4444-555555555555", "kind": "link", "college": "Grossmont College", "course_code": "OT 110",
           "link_url": "https://secret.example.edu/outline?token=abc", "handed_by": "a.person@example.org", "file_name": "Smith_OT110.pdf"}
    line = hp.tag(row)
    check("(6) the log line names the row, its kind, its college and course, and nothing else",
          line == "11111111 link Grossmont College OT 110" and "example" not in line and "Smith" not in line, line)

    # ── (7) what waits for a session ──
    check("(7) pasted data waits for a session", not hp.needs_look({"kind": "paste"}))
    check("(7) a note waits for a session, and the pickup never asks for its words", not hp.needs_look({"kind": "note"}) and "note" not in hp.COLUMNS.split(","))
    check("(7) a saved API procedure with no test waits for a session", not hp.needs_look({"kind": "api", "api": {"which": "catalog", "address": "https://a.example/b"}}))
    check("(7) an API address to test, a link and a file are looked at",
          hp.needs_look({"kind": "api", "api": {"test": True}}) and hp.needs_look({"kind": "link"}) and hp.needs_look({"kind": "file"}))
    status, note, found = hp.judge_api(200, {"Content-Type": "application/json; charset=utf-8"}, b'[{"code":"OT 110"},{"code":"OT 111"}]')
    check("(7) an API that answers reads, with its status, type and shape only", status == "reads" and found == {"http_status": 200, "bytes": 37, "content_type": "application/json", "json": True, "top": "list of 2"}, json.dumps(found))
    status, note, _ = hp.judge_api(403, {"cf-mitigated": "challenge"}, b"")
    check("(7) an API that challenges the reader is a bot check", status == "bot_check", "%s | %s" % (status, note))
    status, note, _ = hp.judge_api(200, {"x-amzn-waf-action": "captcha"}, b"")
    check("(7) a WAF header on a 200 is a bot check too", status == "bot_check", "%s | %s" % (status, note))
    status, note, _ = hp.judge_api(401, {}, b"")
    check("(7) an API that asks for a key says so", status == "could_not_read" and "asks for a key" in note, note)
    status, note, _ = hp.judge_api(None, {}, b"", "timed out")
    check("(7) an API that never answers says so", status == "could_not_read" and "did not answer" in note, note)

    class Resp:
        def __init__(self, status, body, headers=None):
            self.status, self._b, self.headers = status, body, headers or {}

        def read(self, *_):
            return self._b

        def __enter__(self):
            return self

        def __exit__(self, *_):
            return False

    asked = []

    def opener(req, timeout=0):
        asked.append((req.full_url, req.get_header("User-agent")))
        if req.full_url.endswith("/robots.txt"):
            return Resp(200, b"User-agent: *\nDisallow: /private/\n")
        return Resp(200, b"{}", {"Content-Type": "application/json"})

    census = hp.readers()["census"]
    st, headers, body, err, refused = hp.fetch_api("https://api.example.edu/v1/courses", census.UA_SUFFIX, census.robots_allows, opener)
    check("(7) a test of an API address is one GET, robots.txt first, under the reader's name",
          [u for u, _ in asked] == ["https://api.example.edu/robots.txt", "https://api.example.edu/v1/courses"] and all("CPLInitiativeCatalogCensus" in (ua or "") for _, ua in asked) and st == 200 and not refused,
          json.dumps(asked))
    asked.clear()
    st, headers, body, err, refused = hp.fetch_api("https://api.example.edu/private/courses", census.UA_SUFFIX, census.robots_allows, opener)
    check("(7) an address robots.txt refuses is never requested", refused and [u for u, _ in asked] == ["https://api.example.edu/robots.txt"], json.dumps(asked))

    # ── (2) and (8): a whole run ──
    rows = [
        {"id": "a0000000-0000-0000-0000-000000000001", "kind": "link", "college": "Ohlone College", "link_url": "https://blocked.example.edu/outlines/a"},
        {"id": "a0000000-0000-0000-0000-000000000002", "kind": "link", "college": "Ohlone College", "link_url": "https://blocked.example.edu/outlines/b"},
        {"id": "a0000000-0000-0000-0000-000000000003", "kind": "link", "college": "Grossmont College", "course_code": "OT 110", "link_url": "https://outlines.example.edu/hlth167"},
        {"id": "a0000000-0000-0000-0000-000000000004", "kind": "file", "college": "North Orange Continuing Education", "course_code": "HLTH 167", "file_path": "2026-11-20/x/outline.pdf", "file_type": "application/pdf"},
        {"id": "a0000000-0000-0000-0000-000000000005", "kind": "paste", "college": "Grossmont College", "course_code": "OT 110"},
        {"id": "a0000000-0000-0000-0000-000000000006", "kind": "api", "college": "Ohlone College", "api": {"which": "catalog", "address": "https://api.example.edu/v1/courses"}},
        {"id": "a0000000-0000-0000-0000-000000000007", "kind": "api", "college": "Ohlone College", "api": {"which": "catalog", "address": "https://api.example.edu/v1/courses", "test": True}},
        {"id": "a0000000-0000-0000-0000-000000000008", "kind": "file", "college": "Ohlone College", "file_path": "2026-11-20/y/missing.pdf", "file_type": "application/pdf"},
    ]
    ordered = hp.order_rows(rows, "a0000000-0000-0000-0000-000000000003")
    check("(8) the named row goes first, the rest keep their order",
          [r["id"][-1] for r in ordered] == ["3", "1", "2", "4", "5", "6", "7", "8"], [r["id"][-1] for r in ordered])
    reader = FakeReader({
        "https://blocked.example.edu/outlines/a": page(status=403, body="", title="Access denied"),
        "https://blocked.example.edu/outlines/b": page(),
        "https://outlines.example.edu/hlth167": page(),
    })
    api = FakeApi({"2026-11-20/x/outline.pdf": pdf})
    made, logged = [], []

    def make_reader():
        made.append(1)
        return reader

    tally = hp.run(api, ordered, "4470001", make_reader=make_reader,
                   api_get=lambda address: (200, {"Content-Type": "application/json"}, b"{}", None, False), log=logged.append)
    by = {m["id"][-1]: m for m in api.marks}
    check("(2) ⭐ after one bot check the reader loads nothing more from that host",
          reader.loaded == ["https://outlines.example.edu/hlth167", "https://blocked.example.edu/outlines/a"] and by["2"]["status"] == "bot_check" and "earlier in this run" in by["2"]["note"],
          json.dumps(reader.loaded))
    check("(2) the first row on that host is filed as the bot check it met", by["1"]["status"] == "bot_check", json.dumps(by["1"]))
    check("(8) one browser serves the whole run", len(made) == 1, len(made))
    check("(8) every row the reader looked at is answered exactly once, with the run's id",
          sorted(by) == ["1", "2", "3", "4", "7", "8"] and len(api.marks) == 6 and all(m["run"] == "4470001" for m in api.marks), sorted(by))
    check("(8) the link that reads carries the parser's count", by["3"]["status"] == "reads" and by["3"]["found"]["outcomes"] == 2, json.dumps(by["3"]))
    check("(8) the dropped PDF carries its count", by["4"]["status"] == "reads" and by["4"]["found"]["objectives"] == 3, json.dumps(by["4"]))
    check("(8) the API test is answered", by["7"]["status"] == "reads", json.dumps(by["7"]))
    check("(8) a file missing from the store stops that row alone, with words", by["8"]["status"] == "could_not_read" and "stopped on an error" in by["8"]["note"], json.dumps(by["8"]))
    check("(7) the pasted data and the untested API procedure are left waiting", tally.get("left_waiting") == 2 and "5" not in by and "6" not in by, json.dumps(tally))
    check("(6) ⭐ no log line carries an address, a file path or a person", not any("example" in ln or "outline.pdf" in ln or "@" in ln for ln in logged), json.dumps(logged))

    # ── the source keeps its own promises ──
    check("the pickup writes nothing to the repository", "open(" not in SRC.replace("urlopen(", "").replace("self.open(", "") and "git " not in SRC, "a file write or a git call appeared")
    check("the pickup answers only through commons_handover_mark", SRC.count("/rest/v1/rpc/") == 1 and "rpc/commons_handover_mark" in SRC)

    bad = [r for r in results if not r[1]]
    for name, ok, why in results:
        print(("ok   " if ok else "FAIL ") + name + ("" if ok else "\n       " + str(why)[:500]))
    print("\n%d checks, %d failed" % (len(results), len(bad)))
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
