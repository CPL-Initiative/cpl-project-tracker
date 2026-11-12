#!/usr/bin/env python3
"""Guards for kb/_chatbox_ghost_delete.py: the guarded, receipted delete of Sierra's ghost rows (Sam, Open Asks
Sheet 183 card 6, 2026-11-12, "delete").

Each check is a way the delete could take a row it should not, or leave no way back:
  1. The plan finds exactly the ghosts: live titles the sync would not upsert, compared as exact strings.
  2. Apply refuses a wrong count, a changed reference, a share above the ceiling, a short reference.
  3. Apply skips a title back in the reference, a title gone since the plan, and a row changed since the plan.
  4. A delete whose response is lost is retried, and applied.json comes from a fresh read, so it is right even when
     the response never arrives.
  5. Undo restores every column of a deleted row byte-for-value (numerics as read: 12.50 stays 12.50) and leaves a
     row the sync re-created alone.
  6. plan, apply, undo returns the table to its starting state exactly.
  7. A title holding a comma, a parenthesis, a quote, a plus sign or a dash goes through the real urllib transport
     to a local HTTP server and deletes only itself.
  8. The script imports the sync's loader rather than copying it.

A fake PostgREST holds the table in memory; check 7 serves the same fake over http.server.
Run: python3 tests/chatbox_ghost_delete_test.py
"""

import copy
import decimal
import hashlib
import http.server
import json
import os
import shutil
import sys
import tempfile
import threading
import urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _chatbox_ghost_delete as g  # noqa: E402
import _sync_credential_catalog as sync  # noqa: E402

D = decimal.Decimal
results = []


def check(name, cond, detail=""):
    results.append((name, bool(cond)))
    print(("PASS  " if cond else "FAIL  ") + name + (("\n      %s" % (detail,)) if detail and not cond else ""))


# ── a fake PostgREST over one table ──────────────────────────────────────────

class LostResponse(OSError):
    pass


class Fake:
    def __init__(self, rows, cap=7):
        self.rows = {r["unified_title"]: copy.deepcopy(r) for r in rows}
        self.cap = cap                 # the server caps a page below what was asked
        self.calls = []
        self.lose_next_delete_response = 0
        self.fail_deletes_after = None  # raise (after applying) on every delete past this many

    def snapshot(self):
        return {t: g.canonical(r) for t, r in sorted(self.rows.items())}

    def send(self, method, url, headers, body):
        parts = urllib.parse.urlsplit(url)
        assert parts.path.endswith("/rest/v1/" + g.TABLE), parts.path
        q = urllib.parse.parse_qs(parts.query, keep_blank_values=True)
        self.calls.append((method, parts.query))
        if method == "GET":
            assert q.get("order") == ["unified_title.asc"], q
            lo, hi = (int(x) for x in headers["Range"].split("-"))
            hi = min(hi, lo + self.cap - 1)
            page = [self.rows[t] for t in sorted(self.rows)][lo:hi + 1]
            cols = q["select"][0]
            if cols != "*":
                page = [{c: r.get(c) for c in cols.split(",")} for r in page]
            return 200, {}, g.dumps(page).encode()
        if method == "DELETE":
            val = q.get("unified_title", [""])[0]
            assert val.startswith("eq."), "a delete without an exact title: %r" % parts.query
            self.rows.pop(val[3:], None)
            n = sum(1 for c in self.calls if c[0] == "DELETE")
            if self.lose_next_delete_response:
                self.lose_next_delete_response -= 1
                raise LostResponse("connection reset after the server deleted")
            if self.fail_deletes_after is not None and n > self.fail_deletes_after:
                raise LostResponse("connection reset (persistent)")
            return 204, {}, b""
        if method == "POST":
            assert q.get("on_conflict") == ["unified_title"], q
            assert "resolution=ignore-duplicates" in headers.get("Prefer", ""), headers
            for r in g.loads(body.decode()):
                self.rows.setdefault(r["unified_title"], r)   # ON CONFLICT DO NOTHING
            return 201, {}, b""
        raise AssertionError(method)


def row(title, **kw):
    base = {c: None for c in g.COLUMNS}
    base.update({"unified_title": title, "cpl_types": ["Military", "Industry"], "statewide": False,
                 "has_local": True, "adopter_colleges": ["Chaffey", "Cerritos"], "potential_colleges": [],
                 "n_articulation_lines": 3, "eligible_credits": D("12.50"), "applied_credits": D("0"),
                 "transcribed_credits": D("1.0"), "in_review_credits": None, "students_served": 11,
                 "served_suppressed": False, "raw_variants": ["%s variant" % title, "Ünïcode — dash"],
                 "search_text": title.lower(), "conf_title": D("0.875"), "curated_by": "map@rccd.edu",
                 "curated_at": "2026-10-01T12:00:00.123456+00:00", "source_generated_at": "2026-11-11T11:52:19+00:00",
                 "synced_at": "2026-09-01T20:16:00.5+00:00"})
    base.update(kw)
    return base


def write_reference(path, titles):
    doc = {"_generated_at": "2026-11-12T11:52:19+00:00",
           "unified_titles": [{"ut": t, "raw_variants": [{"r": t + " raw"}], "articulations": []} for t in titles]}
    with open(path, "w", encoding="utf-8") as f:
        f.write("window.CPL_CREDENTIAL_REFERENCE = " + json.dumps(doc) + ";\n")
    return path


TMP = tempfile.mkdtemp(prefix="ghost_delete_test_")
try:
    REF_TITLES = ["Live %04d" % i for i in range(40)] + ["Tricky, (one) \"quoted\" + A6 — L3"]
    GHOSTS = ["Ghost A (retired)", "Ghost B, renamed", "live 0001"]   # case differs from a live title: still a ghost
    START = [row(t) for t in REF_TITLES] + [row(t, eligible_credits=D("3.10")) for t in GHOSTS]
    ref_path = write_reference(os.path.join(TMP, "reference.js"), REF_TITLES)
    ref = g.reference(ref_path)
    LOW = dict(min_reference=10)      # the fixture's reference is small; the default floor is pinned below

    def fresh_plan(fake, **kw):
        receipts = tempfile.mkdtemp(dir=TMP)
        return g.plan(g.Rest("http://fake", "k", send=fake.send, sleep=lambda s: None), ref, receipts,
                      **dict(LOW, **kw))

    def rest(fake):
        return g.Rest("http://fake", "k", send=fake.send, sleep=lambda s: None)

    # 1. the plan finds exactly the ghosts ------------------------------------------------------------------
    fake = Fake(START)
    before = fake.snapshot()
    pdir, doc = fresh_plan(fake)
    check("plan: the ghosts are exactly the live titles absent from the reference (exact strings)",
          sorted(x["unified_title"] for x in doc["ghosts"]) == sorted(GHOSTS), [x["unified_title"] for x in doc["ghosts"]])
    check("plan: counts and the reference's sha256 recorded",
          doc["live_count"] == len(START) and doc["ghost_count"] == 3 and doc["reference"]["titles"] == len(REF_TITLES)
          and doc["reference"]["sha256"] == hashlib.sha256(open(ref_path, "rb").read()).hexdigest())
    check("plan: paged past a server cap below the page size, and wrote nothing live",
          fake.snapshot() == before and sum(1 for c in fake.calls if c[0] == "GET") > len(START) // 7)
    on_disk = g.read_json(os.path.join(pdir, "plan.json"))
    check("plan: the before-rows are complete, every column, numerics as read",
          all(set(x) == set(g.COLUMNS) for x in on_disk["ghosts"])
          and '"eligible_credits": 3.10' in open(os.path.join(pdir, "plan.json"), encoding="utf-8").read()
          and g.canonical(on_disk["ghosts"][0]) == g.canonical(fake.rows[on_disk["ghosts"][0]["unified_title"]]))
    check("plan: the receipt says how to undo", "mode=undo" in on_disk["README"])
    check("plan: each ghost carries its alias notes",
          set(on_disk["aliases"]) == set(GHOSTS)
          and all({"alias_to", "alias_of", "exact_name_answered_by"} <= set(v) for v in on_disk["aliases"].values()))
    check("plan: 'live 0001' is answered by 'Live 0001' at tier 1 (lower-case match), the others by nothing",
          on_disk["aliases"]["live 0001"]["exact_name_answered_by"] == ["Live 0001"]
          and on_disk["aliases"]["Ghost A (retired)"]["exact_name_answered_by"] == [])
    try:
        fresh_plan(Fake(START), min_reference=g.MIN_REFERENCE)
        check("plan: refuses a reference under the 2,000-title floor", False)
    except g.Refused:
        check("plan: refuses a reference under the 2,000-title floor", True)

    # 2. apply refuses ---------------------------------------------------------------------------------------
    def refuses(name, fn):
        snap = fake.snapshot()
        try:
            fn()
            check(name, False, "did not refuse")
        except g.Refused:
            check(name, fake.snapshot() == snap and not os.path.exists(os.path.join(pdir, "apply_log.json")))

    refuses("apply: refuses a wrong confirm count", lambda: g.apply(rest(fake), pdir, 2, ref, **LOW))
    other = g.reference(write_reference(os.path.join(TMP, "reference2.js"), REF_TITLES + ["Brand New"]))
    refuses("apply: refuses a reference whose sha256 is not the plan's", lambda: g.apply(rest(fake), pdir, 3, other, **LOW))
    refuses("apply: refuses a ghost share above the ceiling",
            lambda: g.apply(rest(fake), pdir, 3, ref, max_share=0.05, **LOW))
    refuses("apply: refuses a short reference", lambda: g.apply(rest(fake), pdir, 3, ref, min_reference=1000))
    check("apply: the default floor is 2,000 titles and the default ceiling 15%",
          g.MIN_REFERENCE == 2000 and g.MAX_SHARE == 0.15)

    # 3. apply skips what moved since the plan ---------------------------------------------------------------
    fake = Fake(START)
    pdir, doc = fresh_plan(fake)
    plan_path = os.path.join(pdir, "plan.json")
    edited = g.read_json(plan_path)
    edited["ghosts"].append(row("Live 0002"))              # a planned title that is in the reference
    edited["ghost_count"] += 1
    g.write_json(plan_path, edited)
    del fake.rows["Ghost B, renamed"]                       # vanished between plan and apply
    fake.rows["live 0001"]["adopter_colleges"] = ["Changed"]  # changed between plan and apply
    code, applied = g.apply(rest(fake), pdir, 4, ref, **LOW)
    check("apply: deletes only the ghost still live, absent from the reference and unchanged",
          "Ghost A (retired)" not in fake.rows and "Live 0002" in fake.rows and "live 0001" in fake.rows,
          sorted(fake.rows)[-4:])
    check("apply: reports each skip in its bucket",
          applied["skipped_in_reference"] == ["Live 0002"] and applied["held_changed_since_plan"] == ["live 0001"]
          and "Ghost B, renamed" in applied["gone"])
    log = g.read_json(os.path.join(pdir, "apply_log.json"))["attempts"][0]
    check("apply: the log names every planned title and the skips",
          len(log["planned"]) == 4 and log["skipped_gone_before_apply"] == ["Ghost B, renamed"]
          and log["to_delete"] == ["Ghost A (retired)"])
    check("apply: exits 1 while a planned ghost remains (the held row)", code == 1 and applied["ghosts_remain"] == ["live 0001"])

    # apply_log is written before the first delete
    fake = Fake(START)
    pdir, doc = fresh_plan(fake)
    seen = {}
    real = fake.send

    def spy(method, url, headers, body):
        if method == "DELETE" and "log" not in seen:
            seen["log"] = os.path.exists(os.path.join(pdir, "apply_log.json"))
        return real(method, url, headers, body)
    fake.send = spy
    g.apply(rest(fake), pdir, 3, ref, **LOW)
    check("apply: apply_log.json is on disk before the first delete", seen.get("log") is True)

    # 4. a lost delete response ------------------------------------------------------------------------------
    fake = Fake(START)
    pdir, doc = fresh_plan(fake)
    fake.lose_next_delete_response = 1
    code, applied = g.apply(rest(fake), pdir, 3, ref, **LOW)
    check("apply: a lost delete response is retried and the receipt comes from a fresh read",
          code == 0 and sorted(applied["gone"]) == sorted(GHOSTS) and applied["remain"] == []
          and applied["live_count_after"] == len(REF_TITLES), applied)
    fake = Fake(START)
    pdir, doc = fresh_plan(fake)
    fake.fail_deletes_after = 1          # every delete after the first applies, then its response is lost for good
    code, applied = g.apply(rest(fake), pdir, 3, ref, **LOW)
    check("apply: when every retry loses its response, the fresh read still files what landed",
          code == 1 and applied["error"] and set(applied["gone"]) == set(GHOSTS) - set(applied["remain"])
          and all(t in fake.rows for t in applied["remain"]) and all(t not in fake.rows for t in applied["gone"]),
          applied)

    # 5 + 6. undo ------------------------------------------------------------------------------------------
    fake = Fake(START)
    start = fake.snapshot()
    pdir, doc = fresh_plan(fake)
    code, _ = g.apply(rest(fake), pdir, 3, ref, **LOW)
    check("round trip: apply removed the three ghosts", code == 0 and all(t not in fake.rows for t in GHOSTS))
    code, undone = g.undo(rest(fake), pdir)
    check("round trip: plan, apply, undo returns the table to its starting state exactly",
          code == 0 and fake.snapshot() == start and sorted(undone["restored_exactly"]) == sorted(GHOSTS))
    check("undo: numerics byte-for-value (12.50 stays 12.50, 3.10 stays 3.10)",
          g.dumps(fake.rows["Ghost A (retired)"]["eligible_credits"]) == "3.10"
          and isinstance(fake.rows["Ghost A (retired)"]["conf_title"], D))
    try:
        g.apply(rest(fake), pdir, 3, ref, **LOW)
        check("apply: refuses a plan that was undone", False)
    except g.Refused:
        check("apply: refuses a plan that was undone", True)

    fake = Fake(START)
    pdir, doc = fresh_plan(fake)
    g.apply(rest(fake), pdir, 3, ref, **LOW)
    recreated = row("Ghost A (retired)", adopter_colleges=["As the sync wrote it"], eligible_credits=D("9"))
    fake.rows["Ghost A (retired)"] = copy.deepcopy(recreated)
    code, undone = g.undo(rest(fake), pdir)
    check("undo: a row re-created since the delete is left as it stands",
          g.canonical(fake.rows["Ghost A (retired)"]) == g.canonical(recreated)
          and undone["present_as_written_since"] == ["Ghost A (retired)"] and code == 0)
    check("undo: the other two came back exactly",
          sorted(undone["restored_exactly"]) == ["Ghost B, renamed", "live 0001"])
    ulog = g.read_json(os.path.join(pdir, "undo_log.json"))["attempts"][0]
    check("undo: the log names what it inserted and what it found present",
          ulog["present_before_undo"] == ["Ghost A (retired)"] and sorted(ulog["to_insert"]) == ["Ghost B, renamed", "live 0001"])

    # 7. the real transport against a local HTTP server --------------------------------------------------------
    tricky = "Tricky, (one) \"quoted\" + A6 — L3"
    hfake = Fake([row(t) for t in REF_TITLES] + [row(tricky + " old")])
    tref_path = write_reference(os.path.join(TMP, "reference3.js"), REF_TITLES)

    class H(http.server.BaseHTTPRequestHandler):
        def log_message(self, *a):
            pass

        def _do(self):
            n = int(self.headers.get("Content-Length") or 0)
            body = self.rfile.read(n) if n else None
            status, _h, out = hfake.send(self.command, "http://x" + self.path, dict(self.headers), body)
            self.send_response(status)
            self.send_header("Content-Length", str(len(out)))
            self.end_headers()
            self.wfile.write(out)
        do_GET = do_DELETE = do_POST = _do

    srv = http.server.HTTPServer(("127.0.0.1", 0), H)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    try:
        os.environ["SUPABASE_URL"] = "http://127.0.0.1:%d" % srv.server_address[1]
        os.environ["SUPABASE_SERVICE_KEY"] = "test-key"
        receipts = tempfile.mkdtemp(dir=TMP)
        old_out = os.environ.pop("GITHUB_OUTPUT", None)
        rc = g.main(["plan", "--reference", tref_path, "--receipts", receipts, "--min-reference", "10"])
        pd = os.path.join(receipts, os.listdir(receipts)[0])
        planned = g.read_json(os.path.join(pd, "plan.json"))
        rc2 = g.main(["apply", "--plan", pd, "--confirm-count", "1", "--reference", tref_path, "--min-reference", "10"])
        check("urllib transport: an exact eq. delete of a title with , ( ) \" + and a dash takes only itself",
              rc == 0 and rc2 == 0 and [x["unified_title"] for x in planned["ghosts"]] == [tricky + " old"]
              and tricky + " old" not in hfake.rows and len(hfake.rows) == len(REF_TITLES) and tricky in hfake.rows)
        rc3 = g.main(["undo", "--plan", pd])
        check("urllib transport: undo puts it back", rc3 == 0 and tricky + " old" in hfake.rows)
        sync_titles = {r["unified_title"] for r in sync.build_rows(sync.load_artifact(tref_path))}
        check("the sync's report counts the ghosts it leaves",
              g.count_ghosts(g.Rest(os.environ["SUPABASE_URL"], "k"), sync_titles) == 1)
        if old_out is not None:
            os.environ["GITHUB_OUTPUT"] = old_out
    finally:
        srv.shutdown()

    # 8. one loader -------------------------------------------------------------------------------------------
    src = open(os.path.join(ROOT, "kb", "_chatbox_ghost_delete.py"), encoding="utf-8").read()
    check("the script imports the sync's loader and defines none of its own",
          g.sync is sync and "def build_rows" not in src and "def load_artifact" not in src and "def to_row" not in src)
    check("the script never deletes without an exact title",
          '"unified_title=eq."' in src and "unified_title=in." not in src)
finally:
    shutil.rmtree(TMP, ignore_errors=True)

failed = [n for n, ok in results if not ok]
print("\n%d/%d passed" % (len(results) - len(failed), len(results)))
sys.exit(1 if failed else 0)
