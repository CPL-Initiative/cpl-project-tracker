#!/usr/bin/env python3
"""scripts/library_file.py — the Library's automatic filer (Sam's calls 7-8, 2026-10-05).

    python3 tests/library_file_test.py

Guards what the filer can get wrong without a network: the version name (the
original date code kept, N one past the highest in either folder), the resumable
upload (a dropped connection resumes where Drive says it stopped, never resending a
byte), the size and md5 check, the two-folder fence, reuse of a same-bytes copy
and refusal of a different one, the receipt's guards, and that the script never
deletes, trashes or overwrites anything in Drive. Pure stdlib; a fake Drive.
"""

from __future__ import annotations

import hashlib
import importlib.util
import io
import json
import os
import re
import sys
import tempfile
import datetime as dt

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_PATH = os.path.join(ROOT, "scripts", "library_file.py")
spec = importlib.util.spec_from_file_location("library_file", SRC_PATH)
lf = importlib.util.module_from_spec(spec)
spec.loader.exec_module(lf)
SRC = open(SRC_PATH, encoding="utf-8").read()

results = []


def check(name, cond, why=""):
    results.append((name, bool(cond), why))


LIB, DRAFTS = lf.FOLDERS["library"][0], lf.FOLDERS["drafts"][0]


class FakeDrive:
    """Answers the Drive and OAuth calls the filer makes, and records them."""

    def __init__(self, files=None, scope=lf.FULL_SCOPE, drop_second_chunk=False, bad_md5=False, can_add=True):
        self.files = files or {LIB: [], DRAFTS: []}
        self.scope = scope
        self.calls = []
        self.received = bytearray()
        self.drop = drop_second_chunk
        self.bad_md5 = bad_md5
        self.can_add = can_add
        self.puts = 0
        self.pending = None

    def __call__(self, method, url, headers=None, data=None):
        headers = headers or {}
        self.calls.append((method, url, dict(headers), len(data or b"")))
        if url == lf.TOKEN_URL:
            return 200, {}, json.dumps({"access_token": "ya29.secret-access", "scope": self.scope}).encode()
        if url.startswith(lf.API + "/about"):
            return 200, {}, json.dumps({"user": {"emailAddress": "camapinitiative@example.org"}}).encode()
        if url.startswith(lf.API + "/files/"):
            return 200, {}, json.dumps({"id": "x", "capabilities": {"canAddChildren": self.can_add}}).encode()
        if url.startswith(lf.API + "/files?"):
            parent = re.search(r"%27([A-Za-z0-9_-]+)%27", url).group(1)
            return 200, {}, json.dumps({"files": self.files.get(parent, [])}).encode()
        if url.startswith(lf.UPLOAD) and method == "POST":
            self.pending = json.loads(data)
            self.total = int(headers["X-Upload-Content-Length"])
            return 200, {"location": "https://www.googleapis.com/upload/drive/v3/files?upload_id=abc"}, b""
        if "upload_id=abc" in url and method == "PUT":
            rng = headers["Content-Range"]
            if rng.startswith("bytes */"):  # how far did it get?
                return 308, ({"range": "bytes=0-" + str(len(self.received) - 1)} if self.received else {}), b""
            start = int(re.match(r"bytes (\d+)-", rng).group(1))
            self.puts += 1
            if start != len(self.received):
                return 400, {}, b'{"error":{"message":"bad offset"}}'
            self.received.extend(data)
            if self.drop and self.puts == 2:
                raise ConnectionResetError("connection reset by peer")
            if len(self.received) < self.total:
                return 308, {"range": "bytes=0-" + str(len(self.received) - 1)}, b""
            md5 = hashlib.md5(bytes(self.received)).hexdigest()
            return 200, {}, json.dumps({"id": "1NEWfileID", "name": self.pending["name"], "size": str(len(self.received)),
                                        "md5Checksum": "0" * 32 if self.bad_md5 else md5}).encode()
        return 404, {}, b'{"error":{"message":"unexpected call"}}'


def args_for(argv):
    return lf.parse(argv)


# ── (1) naming: <date code>_<name>_vN, the original date code kept ────────
p = lf.plan_name("out/20261006_Summit_Table.xlsx", [], today=dt.date(2026, 10, 6))
check("(1) a first file is _v1 under its own date code", p["file_name"] == "20261006_Summit_Table_v1.xlsx", p)
p = lf.plan_name("out/20261009_Summit_Table_v1.xlsx",
                 ["20261006_Summit_Table_v1.xlsx", "20261007_Summit_Table_v2.xlsx", "20261006_Other_v4.xlsx"])
check("(1) the next edit is one past the highest, under the ORIGINAL date code",
      p["file_name"] == "20261006_Summit_Table_v3.xlsx", p)
p = lf.plan_name("20260826_T5_55050_Conformity.docx", ["20260826_T5_55050_Conformity.docx"])
check("(1) a file in Drive with no _vN counts as v1", p["file_name"] == "20260826_T5_55050_Conformity_v2.docx", p)
p = lf.plan_name("Board deck.pptx", [], date_code="20261001")
check("(1) a name with no date code takes --date-code, spaces become underscores", p["file_name"] == "20261001_Board_deck_v1.pptx", p)
p = lf.plan_name("Board.pptx", [], today=dt.date(2026, 10, 6))
check("(1) and otherwise today's", p["file_name"] == "20261006_Board_v1.pptx", p)
p = lf.plan_name("20260929_IT_AI_v3.pptx", [])
check("(1) a local _v3 with nothing in Drive stays v3 (earlier versions live elsewhere)", p["n"] == 3, p)
p = lf.plan_name("20261006_Deck_v1.pptx", ["20261006_Deck_v1.PPTX"])
check("(1) the extension matches without regard to case", p["n"] == 2, p)

# ── (2) resumable upload, including a dropped connection mid-file ─────────
tmp = tempfile.mkdtemp()
big = os.path.join(tmp, "20261006_Film_v1.mp4")
payload = os.urandom(600 * 1024)
open(big, "wb").write(payload)
fake = FakeDrive(drop_second_chunk=True)
d = lf.Drive("tok", transport=fake)
res = d.upload(big, "20261006_Film_v1.mp4", DRAFTS, "video/mp4", "test", chunk=256 * 1024, sleep=lambda s: None)
check("(2) the whole file arrives intact through a dropped connection", bytes(fake.received) == payload and res["id"] == "1NEWfileID")
ranges = [c[2].get("Content-Range") for c in fake.calls if c[0] == "PUT"]
check("(2) after the drop it asks how far Drive got, then resumes there",
      ranges == ["bytes 0-262143/614400", "bytes 262144-524287/614400", "bytes */614400", "bytes 524288-614399/614400"], ranges)
check("(2) chunks are multiples of 256 KiB", lf.CHUNK % (256 * 1024) == 0)
start = [c for c in fake.calls if c[0] == "POST" and c[1].startswith(lf.UPLOAD)][0]
check("(2) the upload names its folder and declares its length", fake.pending["parents"] == [DRAFTS] and start[2]["X-Upload-Content-Length"] == str(len(payload)))
try:
    d.upload(big, "x.mp4", "SomeoneElsesFolder", "video/mp4", "test")
    check("(2) a folder outside CPLLibrary is refused", False)
except lf.FilerError as e:
    check("(2) a folder outside CPLLibrary is refused", "only into CPLLibrary" in str(e))

# ── (3) a new version, end to end, with its receipt ───────────────────────
lf.RECEIPTS = os.path.join(tmp, "receipts")
doc = os.path.join(tmp, "20261009_Summit_Table_v1.xlsx")
open(doc, "wb").write(b"PK\x03\x04 a spreadsheet's bytes")
fake = FakeDrive(files={LIB: [], DRAFTS: [{"id": "old1", "name": "20261006_Summit_Table_v1.xlsx", "size": "10", "md5Checksum": "a"}]})
lines = []
token, scope = lf.sign_in({k: "v" for k in lf.ENV}, transport=fake)
out = lf.file_one(args_for([doc, "--slug", "summit-table-x1"]), lf.Drive(token, transport=fake),
                  now=dt.datetime(2026, 10, 9, 17, 5, 0, tzinfo=dt.timezone.utc), out=lines.append)
e = out["entry"]
check("(3) the edit files as v2 under the original date code", e["file_name"] == "20261006_Summit_Table_v2.xlsx" and e["label"] == "v2", e)
check("(3) the version carries when it was filed, its link, file id and md5",
      e["filed_at"] == "2026-10-09T17:05:00Z" and e["url"] == "https://drive.google.com/file/d/1NEWfileID/view"
      and e["md5"] == hashlib.md5(open(doc, "rb").read()).hexdigest() and e["folder"] == "CPLLibrary/Drafts", e)
sql = out["sql"]
check("(3) the receipt is guarded on the Drive file id (applying it twice changes nothing)",
      "not (versions @> '[{\"file_id\":\"1NEWfileID\"}]'::jsonb)" in sql, sql)
check("(3) the new version goes first and the same name's earlier files read Replaced", sql.startswith("update public.cpl_library set\n  versions = '[{") and "Replaced by v2" in sql)
check("(3) a Requested record moves to Draft when its draft lands in Drafts", "case when status = 'requested' then 'draft' else status end" in sql)
check("(3) it links the record to Drive", "home = 'drive'" in sql and "url = 'https://drive.google.com/file/d/1NEWfileID/view'" in sql)
check("(3) it never touches a retired record", "retired_at is null" in sql)
check("(3) the receipt file is written and names how to roll back",
      os.path.isfile(out["receipt"]) and "cpl_library_history" in open(out["receipt"]).read()
      and os.path.basename(out["receipt"]) == "2026-10-09_summit-table-x1__20261006_Summit_Table_v2.sql", out["receipt"])
check("(3) the run names the migration to apply it under",
      out["migration"] == "cpl_library_file_2026_10_09_summit_table_x1_20261006_summit_table_v2"
      and any(out["migration"] in l for l in lines) and out["migration"] in open(out["receipt"]).read(), out["migration"])
check("(3) no token reaches the output", not any("ya29" in l or "secret" in l for l in lines) and "ya29" not in open(out["receipt"]).read())
out_lib = lf.receipt_sql("version", "s", e, "library", ".xlsx", {"lineage": "x"})
check("(3) filing to CPLLibrary leaves the status to Sam", "status = status" in out_lib)

# ── (4) move: an existing file keeps its name; same bytes reused, others refused ──
deck = os.path.join(tmp, "20260716_CPL_Initiative_BOG_Update.pptx")
open(deck, "wb").write(b"a deck")
md5 = hashlib.md5(b"a deck").hexdigest()
fake = FakeDrive(files={LIB: [{"id": "dropped1", "name": "20260716_CPL_Initiative_BOG_Update.pptx", "size": "6", "md5Checksum": md5}], DRAFTS: []})
out = lf.file_one(args_for([deck, "--slug", "update-to-the-board-of-governors-2026-07", "--move", "--to", "library"]),
                  lf.Drive("t", transport=fake), now=dt.datetime(2026, 10, 9, 17, 5, tzinfo=dt.timezone.utc), out=lambda s: None)
check("(4) a copy Sam dropped in with the same bytes is reused, not uploaded again",
      out["entry"]["file_id"] == "dropped1" and not any(c[1].startswith(lf.UPLOAD) for c in fake.calls))
sql = out["sql"]
check("(4) move keeps the file's own name and label", out["entry"]["file_name"] == "20260716_CPL_Initiative_BOG_Update.pptx" and out["entry"]["label"] == "v1")
check("(4) move repoints the entry whose link ends in that name (underscores escaped for LIKE)",
      "like '%/20260716\\_CPL\\_Initiative\\_BOG\\_Update.pptx'" in sql, sql)
check("(4) move repoints the record only when its link was that file", "url = case when url is null or url like" in sql and "home = case when url is null or url like" in sql)
check("(4) move never renumbers or changes status", "version =" not in sql and "status =" not in sql)
fake = FakeDrive(files={LIB: [{"id": "other", "name": "20260716_CPL_Initiative_BOG_Update.pptx", "size": "99", "md5Checksum": "f" * 32}], DRAFTS: []})
try:
    lf.file_one(args_for([deck, "--slug", "update-to-the-board-of-governors-2026-07", "--move", "--to", "library"]),
                lf.Drive("t", transport=fake), out=lambda s: None)
    check("(4) a same-named file with different bytes stops the run", False)
except lf.FilerError as e:
    check("(4) a same-named file with different bytes stops the run", "never overwrites" in str(e))

# ── (5) a bad copy is reported, never recorded ───────────────────────────
fake = FakeDrive(bad_md5=True)
try:
    lf.file_one(args_for([doc, "--slug", "summit-table-x1"]), lf.Drive("t", transport=fake), out=lambda s: None)
    check("(5) an md5 mismatch stops the run before a receipt", False)
except lf.FilerError as e:
    check("(5) an md5 mismatch stops the run before a receipt", "md5" in str(e))

# ── (6) --new writes an INSERT-only receipt, quoting safely ──────────────
fake = FakeDrive()
out = lf.file_one(args_for([doc, "--new", "--title", "Colleges' table", "--kind", "spreadsheet", "--occasion", "Summit"]),
                  lf.Drive("t", transport=fake), now=dt.datetime(2026, 10, 9, tzinfo=dt.timezone.utc), out=lambda s: None)
sql = out["sql"]
check("(6) --new inserts once and never updates", sql.startswith("insert into public.cpl_library") and "on conflict (slug) do nothing" in sql and "update" not in sql.split("\n")[0])
check("(6) a quote in a title is doubled", "'Colleges'' table'" in sql, sql)
check("(6) a new draft says draft; who it is for stays Sam's", "'draft'" in sql and "seen_by" in sql and ", null," in sql)

# ── (7) --check reports the scope and both folders ───────────────────────
said = []
ok = lf.check(lf.Drive("t", transport=FakeDrive()), lf.FULL_SCOPE, out=said.append)
check("(7) a full-scope sign-in that can add to both folders passes", ok and sum("can add files" in s for s in said) == 2, said)
said = []
ok = lf.check(lf.Drive("t", transport=FakeDrive(can_add=False)), "https://www.googleapis.com/auth/drive.file", out=said.append)
check("(7) the narrow scope is named and fails", not ok and any("narrow scope" in s for s in said), said)
try:
    lf.credentials({})
    check("(7) missing secrets name all three and the setup page", False)
except SystemExit as e:
    check("(7) missing secrets name all three and the setup page", all(k in str(e.code) for k in lf.ENV) and lf.SETUP in str(e.code))

# ── (8) it never deletes, trashes, renames or overwrites ──────────────────
check("(8) no DELETE, PATCH or trash call anywhere in the filer",
      not re.search(r'"(DELETE|PATCH)"', SRC) and '"trashed": true' not in SRC and "/trash" not in SRC and "files.delete" not in SRC)
check("(8) every write is a POST to start an upload or a PUT of its bytes",
      set(re.findall(r'transport\(\s*"([A-Z]+)"', SRC)) <= {"GET", "POST", "PUT"} and 'self.transport("PUT", session' in SRC)
check("(8) the scope the setup asks for is the full Drive scope", lf.FULL_SCOPE == "https://www.googleapis.com/auth/drive")

if __name__ == "__main__":
    passed = 0
    for name, ok, why in results:
        print(("  ok  " if ok else "FAIL  ") + name + ("" if ok or not why else "\n        > " + str(why)[:600]))
        passed += ok
    print("\nlibrary_file_test.py: %d/%d checks passed" % (passed, len(results)))
    sys.exit(0 if passed == len(results) else 1)
