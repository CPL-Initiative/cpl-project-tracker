#!/usr/bin/env python3
"""The credential rename re-points the saved values it leaves on a retired title, holds a person's, counts the old
titles left in kb/**/*.json, and starts the dashboard after a committed apply (#3110, COBIx comments 6813000047 and
6813256997, after the 2026-11-12 apply left "ASE Bundle — A4, A5" saved; the PR #3140 review's 20 findings).

Each failure mode runs through the REAL dry run, apply and undo (kb/_cred_rename_dryrun.py, _cred_rename_apply.py,
_cred_rename_undo.py, _cred_rename_repoint.py) over a scratch kb/ tree, and kb_curation through a fake PostgREST that
applies each request's own eq filters:
  1. a bot-saved value moves in every saved file, the receipt files each from a fresh read, the undo puts it back;
     the saved assignments' copy is never written: its kb_curation title row moves and the copy follows;
  2. the person test reads the title's own saver: a person's title under a bot's newer issuer save is held, a title
     naming no saver is held on both sides, a person's occupation ruling is held, a ruling that would name a title
     twice is held; a superstring of an old title never moves and is never counted;
  3. the undo guards on value and saver: a person re-saving the same value is drift, listed and left;
  4. by_title fans two old keys into one that holds ids, and the undo splits them back; a rename chain stops the
     plan before anything is written;
  5. the kb_curation half: a lost PATCH response files landed from a read; a guard that misses files fail; a row
     already on the new title is filed and not written; the take-back and the undo read each row back, newest log
     first, and leave a row a person changed;
  6. the apply re-points what EARLIER applies left: every applied receipt in applied order (a same-day -2 after the
     first, by _applied_at), an undone or failed one skipped, each chain followed to the title live now; the full
     undo stops on a moved assignment a person re-saved, read live before any file goes back; the nightly sync
     records the title's own saver;
  7. the old-title count, its --check, and the dry run's prediction;
  8. the workflow: the dashboard job alone holds actions: write, runs only after a push, fails on a failed lookup or
     dispatch; the apply's take-back reverses the row moves; a no-op run never fails on a missing count.

No network. Run from the repo root: python3 tests/cred_rename_repoint_test.py
"""
import contextlib
import io
import json
import os
import shutil
import sys
import tempfile
import urllib.parse

import yaml

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _cred_rename_apply as app  # noqa: E402
import _cred_rename_dryrun as dry  # noqa: E402
import _cred_rename_repoint as rp  # noqa: E402
import _cred_rename_undo as undo  # noqa: E402

CHECKS = []


def check(name, cond, why=""):
    CHECKS.append((name, bool(cond), why))


OLD, NEW = "Widget Bundle — A, B", "Widget Certificate Bundles: A + B"
SUPER = OLD + ", C"   # a different title that holds OLD as a substring
RAW = "Widget A and B"
BOT_RAW, PERSON_RAW, NOREV_RAW, LEGACY_RAW = ("Widget A + B (bot)", "Widget AB (a person's title)",
                                              "Widget AB (no saver)", "Widget AB (copy before the saver field)")
LEGACY_PERSON_RAW = "Widget AB (old copy, a person's)"
BOT, BOT2, PERSON, SAM = "cer-procedure-classifier@bot", "fold-issuer@bot", "map@rccd.edu", "slee@cccco.edu"
FAMILY = "Widget Certificate Bundles"
T1 = "2026-10-31T14:01:01+00:00"


def write(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2, ensure_ascii=False)
        f.write("\n")


def read(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def tree(root, person=True):
    kb = os.path.join(root, "kb")
    write(os.path.join(kb, "credentials.json"), {OLD: [{"issuing_agency": "Widget Board"}],
                                                 SUPER: [{"issuing_agency": "Widget Board"}],
                                                 "Other": [{"issuing_agency": "Other Board"}]})
    write(os.path.join(kb, "unified_titles.json"), {RAW: {"unified_title": OLD, "reviewed_by": BOT}})
    write(os.path.join(kb, "coci_articulations.json"), {"articulations": [
        {"course_id": "C1", "exhibit_id": "E1", "exhibit_title": RAW, "unified_title": OLD}]})
    a = {BOT_RAW: {"unified_title": OLD, "reviewed_by": BOT, "reviewed_at": T1, "title_reviewed_by": BOT,
                   "title_reviewed_at": T1},
         LEGACY_RAW: {"unified_title": OLD, "reviewed_by": BOT, "reviewed_at": T1},
         "Widget ABC": {"unified_title": SUPER, "reviewed_by": BOT, "title_reviewed_by": BOT}}
    if person:
        # The person saved the title; a bot saved the issuer later, so the entry's newest saver is the bot.
        a[PERSON_RAW] = {"unified_title": OLD, "reviewed_by": BOT2, "reviewed_at": "2026-11-01T00:00:00+00:00",
                         "title_reviewed_by": PERSON, "title_reviewed_at": "2026-06-02T18:00:00+00:00"}
        a[NOREV_RAW] = {"unified_title": OLD, "reviewed_by": BOT2, "title_reviewed_by": None}
        a[LEGACY_PERSON_RAW] = {"unified_title": OLD, "reviewed_by": PERSON}   # old shape, a person's newest save
    write(os.path.join(kb, "unclassified_assignments.json"), {"assignments": a, "sweep_kept": {}})
    write(os.path.join(kb, "cer_classified.json"), {"records": {BOT_RAW: {"raw_title": BOT_RAW, "unified_title": OLD},
                                                                "Widget ABC": {"unified_title": SUPER}}})
    write(os.path.join(kb, "reference", "map_cpl_opportunities_verified.json"),
          {"by_title": {OLD: ["X1"], "Other": ["X2"]}})
    occ = {"widget tech": {"credentials": [{"title": OLD, "tier": "D"}, {"title": SUPER, "tier": "R"}],
                           "curated_by": "skywalker-s120@bot", "curated_at": "2026-08-05"}}
    if person:
        occ["widget lead"] = {"credentials": [{"title": OLD, "tier": "D"}], "curated_by": PERSON}
        occ["widget twin"] = {"credentials": [{"title": OLD, "tier": "D"}, {"title": NEW, "tier": "R"}],
                              "curated_by": "skywalker-s120@bot"}
    write(os.path.join(kb, "occupation_credential_map.json"), {"occupations": occ})
    write(os.path.join(kb, "credential_review_overlay.json"), {"_read_at": "2026-11-12T00:00:00Z", "overrides": {
        OLD: {"unified_title_override": NEW, "reviewed_by": SAM, "reviewed_at": "2026-11-11T15:00:00+00:00",
              "field_reviews": {"unified_title_override": {"by": SAM, "at": "2026-11-11T15:00:00+00:00"}}}}})
    write(os.path.join(kb, "exhibits_related.json"), {"titles": []})
    return kb


real = {m: {k: getattr(m, k) for k in dir(m) if k.isupper()} for m in (dry, app, undo, rp)}
real_rest = {m: m.rest for m in (rp, undo)}


def restore():
    for m, d in real.items():
        for k, v in d.items():
            setattr(m, k, v)
    for m, f in real_rest.items():
        m.rest = f


def point(kb):
    for m in (dry, app, undo):
        m.CREDENTIALS = os.path.join(kb, "credentials.json")
        m.UNIFIED_TITLES = os.path.join(kb, "unified_titles.json")
        m.ARTICULATIONS = os.path.join(kb, "coci_articulations.json")
    dry.OVERLAY = app.OVERLAY = os.path.join(kb, "credential_review_overlay.json")
    dry.RELATED = app.RELATED = os.path.join(kb, "exhibits_related.json")
    dry.FAMILIES = app.FAMILIES = os.path.join(kb, "reference", "credential_families.json")
    dry.PLANS_DIR = app.PLANS_DIR = os.path.join(kb, "cred_rename_plans")
    dry.OUT_DIR = app.DRYRUN_OUT = os.path.join(kb, "cred_rename_dryrun")
    dry.OUT_ROOT = os.path.join(kb, "cred_rename_out")
    app.ALIAS_PATH = os.path.join(dry.OUT_DIR, "alias_map.json")
    app.OUT_ROOT = os.path.join(kb, "cred_rename_out")
    undo.KEY = None


def quiet(fn, *a, **k):
    with contextlib.redirect_stdout(io.StringIO()):
        return fn(*a, **k)


def refused(fn, *a):
    try:
        quiet(fn, *a)
        return False
    except SystemExit:
        return True


class Fake:
    """kb_curation behind PostgREST, unique on (course_id, field): GET, PATCH and DELETE apply every eq./is.null
    filter. lose: a PATCH commits and raises (a lost response); before_patch: run before each PATCH."""
    COLS = ("value", "reviewer_email", "reviewed_at", "validated_at", "validated_by")

    def __init__(self, rows):
        self.rows = {(c, f): dict({k: None for k in self.COLS}, **r) for (c, f), r in rows.items()}
        self.lose, self.before_patch, self.patches = False, None, 0

    def _match(self, key, row, q):
        for k, v in q.items():
            if k in ("select", "order"):
                continue
            have = key[0] if k == "course_id" else key[1] if k == "field" else row.get(k)
            if v == "is.null":
                if have is not None:
                    return False
            elif not v.startswith("eq.") or have != v[3:]:
                return False
        return True

    def __call__(self, method, path, body=None, prefer=None):
        q = dict(urllib.parse.parse_qsl(path.split("?", 1)[1])) if "?" in path else {}
        hits = [(k, r) for k, r in self.rows.items() if self._match(k, r, q)]
        if method == "GET":
            return [dict(r, course_id=k[0], field=k[1]) for k, r in hits]
        if method == "PATCH":
            self.patches += 1
            if self.before_patch:
                self.before_patch(self)
                hits = [(k, r) for k, r in self.rows.items() if self._match(k, r, q)]
            for _, r in hits:
                r.update(body)
            if self.lose:
                raise OSError("response lost")
            return [dict(r) for _, r in hits]
        if method == "DELETE":
            for k, _ in hits:
                del self.rows[k]
            return []
        raise AssertionError(method)


U = lambda raw: (rp.UNCLASS + raw, rp.UNCLASS_FIELD)  # noqa: E731

tmp = tempfile.mkdtemp(prefix="repoint_")
try:
    # ── 1 and 2: the apply ──────────────────────────────────────────────────────────────────────────────────────
    root = os.path.join(tmp, "a")
    kb = tree(root)
    point(kb)
    quiet(dry.main)
    am = read(os.path.join(dry.OUT_DIR, "alias_map.json"))
    check("dry run: the rename is planned and apply-safe", am["renames"] == {OLD: NEW} and am["summary"]["apply_safe"],
          am.get("renames"))
    prev = am.get("repoint_preview") or {}
    pc = sorted((c["file"], c["key"]) for c in prev.get("changes") or [])
    check("dry run: previews the bot moves and the copy's two kb_curation moves", pc == sorted([
        ("kb/unclassified_assignments.json", BOT_RAW), ("kb/unclassified_assignments.json", LEGACY_RAW),
        ("kb/cer_classified.json", BOT_RAW), ("kb/reference/map_cpl_opportunities_verified.json", NEW),
        ("kb/occupation_credential_map.json", "widget tech")]), pc)
    ph = sorted((h["file"], h["key"]) for h in prev.get("held_person_rows") or [])
    check("dry run: previews the five held rows", ph == sorted([
        ("kb/unclassified_assignments.json", PERSON_RAW), ("kb/unclassified_assignments.json", NOREV_RAW),
        ("kb/unclassified_assignments.json", LEGACY_PERSON_RAW),
        ("kb/occupation_credential_map.json", "widget lead"), ("kb/occupation_credential_map.json", "widget twin")]),
          ph)
    predicted = am.get("would_leave_old_titles") or {}

    quiet(app.main)
    ua = read(os.path.join(kb, "unclassified_assignments.json"))["assignments"]
    check("apply: the saved assignments' copy is never written (its kb_curation row moves instead)",
          all(ua[r]["unified_title"] == OLD for r in (BOT_RAW, LEGACY_RAW, PERSON_RAW, NOREV_RAW)))
    check("apply: the classifier's cache names the new title, the superstring untouched",
          read(os.path.join(kb, "cer_classified.json"))["records"] == {
              BOT_RAW: {"raw_title": BOT_RAW, "unified_title": NEW}, "Widget ABC": {"unified_title": SUPER}})
    bt = read(os.path.join(kb, "reference", "map_cpl_opportunities_verified.json"))["by_title"]
    check("apply: MAP's by_title moves the ids to the new title", bt == {NEW: ["X1"], "Other": ["X2"]}, bt)
    occ = read(os.path.join(kb, "occupation_credential_map.json"))["occupations"]
    check("apply: a bot's ruling moves, its superstring entry stays",
          [c["title"] for c in occ["widget tech"]["credentials"]] == [NEW, SUPER], occ["widget tech"])
    check("apply: a person's ruling and a ruling that would name the title twice are unchanged",
          occ["widget lead"]["credentials"][0]["title"] == OLD and occ["widget twin"]["credentials"][0]["title"] == OLD)
    receipt = os.path.join(kb, "cred_rename_out", sorted(os.listdir(os.path.join(kb, "cred_rename_out")))[0])
    rc = read(os.path.join(receipt, "repoint.json"))
    fl = {(c["file"], c["key"]): c["filed"] for c in rc["filed"]}
    check("receipt: each file write filed landed from a fresh read; each row move via kb_curation",
          fl[("kb/cer_classified.json", BOT_RAW)] == "landed" and fl[("kb/unclassified_assignments.json", BOT_RAW)]
          == "via_kb_curation" and fl[("kb/unclassified_assignments.json", LEGACY_RAW)] == "via_kb_curation", fl)
    held = {h["key"]: h for h in rc["held_person_rows"]}
    check("receipt: the person's title is held though a bot saved the entry's newest field",
          held[PERSON_RAW]["reviewer"] == PERSON and held[PERSON_RAW]["before"] == OLD, held.get(PERSON_RAW))
    check("receipt: a title naming no saver is held", NOREV_RAW in held and held[NOREV_RAW]["reviewer"] is None)
    check("receipt: the person's ruling and the twin ruling are held with their reasons",
          "curated" in held["widget lead"]["why"] and "twice" in held["widget twin"]["why"])

    # ── 5: the kb_curation half, then the copy re-read ──────────────────────────────────────────────────────────
    fake = Fake({U(BOT_RAW): {"value": OLD, "reviewer_email": BOT, "reviewed_at": T1},
                 U(LEGACY_RAW): {"value": OLD, "reviewer_email": BOT, "reviewed_at": T1},
                 U(PERSON_RAW): {"value": OLD, "reviewer_email": PERSON, "reviewed_at": "t"},
                 U(NOREV_RAW): {"value": OLD, "reviewer_email": None, "reviewed_at": "t"}})
    fake.lose = True
    _, ops = rp.run_supabase(receipt, fake)
    by = {o["course_id"][len(rp.UNCLASS):]: o for o in ops}
    check("kb_curation: a bot's title rows move; a lost response files landed from the read",
          fake.rows[U(BOT_RAW)]["value"] == NEW and fake.rows[U(LEGACY_RAW)]["value"] == NEW
          and by[BOT_RAW]["filed"] == "landed" and by[BOT_RAW]["status"] == "ok", by.get(BOT_RAW))
    check("kb_curation: held rows are never planned, never written",
          PERSON_RAW not in by and NOREV_RAW not in by and fake.rows[U(PERSON_RAW)]["value"] == OLD
          and fake.rows[U(NOREV_RAW)]["value"] == OLD)
    logs = [n for n in os.listdir(receipt) if n.startswith("repoint_supabase_log")]
    check("kb_curation: the log is filed", logs == ["repoint_supabase_log.json"]
          and read(os.path.join(receipt, logs[0]))["_state"] == "filed")
    # The workflow re-reads the copy (kb/_apply_unclassified_triage.py) and the overlay after the moves.
    d = read(os.path.join(kb, "unclassified_assignments.json"))
    for raw in d["assignments"]:
        r = fake.rows.get(U(raw))
        if r:
            d["assignments"][raw]["unified_title"] = r["value"]
    write(os.path.join(kb, "unclassified_assignments.json"), d)
    write(os.path.join(kb, "credential_review_overlay.json"), {"overrides": {}})
    left = rp.old_titles_left({OLD: NEW}, {}, root)
    locs = sorted(x["location"] for x in left["locations"])
    want = sorted(["kb/unclassified_assignments.json:/assignments/%s/unified_title" % PERSON_RAW,
                   "kb/unclassified_assignments.json:/assignments/%s/unified_title" % LEGACY_PERSON_RAW,
                   "kb/unclassified_assignments.json:/assignments/%s/unified_title" % NOREV_RAW,
                   "kb/occupation_credential_map.json:/occupations/widget lead/credentials[0]/title",
                   "kb/occupation_credential_map.json:/occupations/widget twin/credentials[0]/title"])
    check("count: after the apply, the held rows are the old titles left, and no superstring", locs == want, locs)
    check("count: the dry run's prediction equals the count after the apply",
          sorted(x["location"] for x in predicted.get("locations") or []) == want, predicted.get("locations"))
    check("count: the receipt names its scope", left["scope"] == "kb/**/*.json")

    # A row already on the new title: filed from the read, never written.
    p0 = fake.patches
    _, ops2 = rp.run_supabase(receipt, fake)
    check("kb_curation: a row already on the new title is filed 'already' and not written",
          fake.patches == p0 and all(o["status"] == "already" for o in ops2), ops2)

    # ── 5 (cont.): the take-back reads newest log first and reads each row back ──────────────────────────────────
    fake.lose = False
    fake.rows[U(LEGACY_RAW)]["reviewer_email"] = PERSON   # a person re-saved the same value since the move
    _, back = rp.supabase_undo(receipt, rest_fn=fake)
    st = {o["course_id"][len(rp.UNCLASS):]: o["status"] for o in back}
    check("take-back: the bot's row goes back, read back", st.get(BOT_RAW) == "ok"
          and fake.rows[U(BOT_RAW)]["value"] == OLD and fake.rows[U(BOT_RAW)]["reviewer_email"] == BOT, st)
    check("take-back: a row a person saved since is left as they made it",
          st.get(LEGACY_RAW) == "left" and fake.rows[U(LEGACY_RAW)]["value"] == NEW, st)
    rl = read(os.path.join(receipt, "repoint_rollback_log.json"))
    check("take-back: its log is filed after a pending one", rl["_state"] == "filed" and len(rl["log"]) == 2, rl)

    # A guard that misses: the row changes between the read and the PATCH.
    fake.rows[U(BOT_RAW)].update(value=OLD, reviewer_email=BOT, reviewed_at=T1)
    fake.before_patch = lambda f: f.rows[U(BOT_RAW)].update(reviewed_at="2026-11-12T09:00:00+00:00")
    fake.rows[U(LEGACY_RAW)].update(value=OLD, reviewer_email=BOT, reviewed_at="2026-11-12T08:00:00+00:00")
    _, ops3 = rp.run_supabase(receipt, fake)
    by3 = {o["course_id"][len(rp.UNCLASS):]: o for o in ops3}
    check("kb_curation: a PATCH whose guard misses files the row as it stands, status fail",
          by3[BOT_RAW]["status"] == "fail" and by3[BOT_RAW]["filed"] == "changed"
          and fake.rows[U(BOT_RAW)]["value"] == OLD, by3.get(BOT_RAW))
    fake.before_patch = None

    # Two logs: the undo uses the newer run's before_row.
    logs2 = sorted(n for n in os.listdir(receipt) if n.startswith("repoint_supabase_log"))
    first = rp.supabase_undo_ops(receipt)
    newest = read(os.path.join(receipt, sorted(logs2, key=lambda n: (n != "repoint_supabase_log.json", n))[-1]))
    check("undo order: with three logs, each row's reversal comes from the newest log that moved it",
          len(logs2) == 3 and {o["course_id"]: o["before"]["reviewed_at"] for o in first}[rp.UNCLASS + LEGACY_RAW]
          == "2026-11-12T08:00:00+00:00" == {e["course_id"]: e["before_row"]["reviewed_at"]
                                              for e in newest["log"]}[rp.UNCLASS + LEGACY_RAW], first)

    # A planned row move whose live title row names no saver is left, like the file side's hold.
    nul = os.path.join(tmp, "nul")
    write(os.path.join(nul, "repoint.json"), {"planned": [
        {"file": "kb/unclassified_assignments.json", "kind": "value", "key": "N", "field": "unified_title",
         "before": OLD, "after": NEW, "reviewer": None, "via": "kb_curation"}]})
    fn = Fake({U("N"): {"value": OLD, "reviewer_email": None, "reviewed_at": T1}})
    _, opsn = rp.run_supabase(nul, fn)
    check("kb_curation: a live title row naming no saver is left, never written",
          opsn[0]["status"] == "left" and fn.rows[U("N")]["value"] == OLD and fn.patches == 0, opsn)

    # ── 1 (cont.) and 3: the file undo ──────────────────────────────────────────────────────────────────────────
    quiet(undo.main, [receipt, "--apply", "--json-only"])
    check("undo: the cache, by_title and the bot's ruling are back, the held rows as they were",
          read(os.path.join(kb, "cer_classified.json"))["records"][BOT_RAW]["unified_title"] == OLD
          and read(os.path.join(kb, "reference", "map_cpl_opportunities_verified.json"))["by_title"]
          == {OLD: ["X1"], "Other": ["X2"]}
          and [c["title"] for c in read(os.path.join(kb, "occupation_credential_map.json"))["occupations"][
              "widget tech"]["credentials"]] == [OLD, SUPER]
          and OLD in read(os.path.join(kb, "credentials.json")))

    clean = os.path.join(tmp, "clean")
    kbc = tree(clean, person=False)
    point(kbc)
    quiet(dry.main)
    quiet(app.main)
    rcpt = os.path.join(kbc, "cred_rename_out", sorted(os.listdir(os.path.join(kbc, "cred_rename_out")))[0])
    p = os.path.join(kbc, "occupation_credential_map.json")
    d = read(p)
    d["occupations"]["widget tech"]["curated_by"] = PERSON   # a person re-saves the ruling, same title
    write(p, d)
    check("undo: a person re-saving the same value is drift, and nothing is written",
          refused(undo.main, [rcpt, "--apply", "--json-only"]) and OLD not in read(os.path.join(kbc, "credentials.json")))
    quiet(undo.main, [rcpt, "--apply", "--json-only", "--force"])
    check("undo --force: the person's ruling is left as they saved it, its fold group whole",
          read(p)["occupations"]["widget tech"]["credentials"][0]["title"] == NEW
          and NEW in read(os.path.join(kbc, "credentials.json"))
          and read(os.path.join(kbc, "cer_classified.json"))["records"][BOT_RAW]["unified_title"] == NEW)

    # ── 4: by_title fan-in, and a rename chain ──────────────────────────────────────────────────────────────────
    fan = os.path.join(tmp, "fan")
    write(os.path.join(fan, "kb", "reference", "map_cpl_opportunities_verified.json"),
          {"by_title": {"M1": ["1"], "M2": ["2", "9"], "T": ["3", "9"], "Z": ["4"]}})
    ch, _ = rp.plan({"M1": "T", "M2": "T"}, fan)
    rp.apply_changes(ch, fan)
    bt = read(os.path.join(fan, "kb", "reference", "map_cpl_opportunities_verified.json"))["by_title"]
    check("by_title: two old keys merge onto a key that holds ids, as one union", bt == {"T": ["1", "2", "3", "9"],
                                                                                        "Z": ["4"]}, bt)
    rp.apply_changes([rp.reverse(c) for c in ch], fan)
    check("by_title: the undo splits the ids back", read(os.path.join(
        fan, "kb", "reference", "map_cpl_opportunities_verified.json"))["by_title"] == {
            "M1": ["1"], "M2": ["2", "9"], "T": ["3", "9"], "Z": ["4"]})
    try:
        rp.plan({"A": "X", "X": "Z"}, fan)
        chained = False
    except rp.RenameChain:
        chained = True
    check("plan: a rename chain stops the plan before anything is written", chained)

    # ── 6: every applied rename, in applied order ──────────────────────────────────────────────────────────────
    hist = os.path.join(tmp, "hist")
    write(os.path.join(hist, "2026-11-12-2", "alias_map.json"), {"renames": {"B": "C"},
                                                                 "_applied_at": "2026-11-12T09:00:00Z"})
    write(os.path.join(hist, "2026-11-12", "alias_map.json"), {"renames": {"A": "B"}, "_applied_at": "2026-11-12T01:00:00Z"})
    write(os.path.join(hist, "2026-10-01", "alias_map.json"), {"renames": {"Q": "R"}, "_applied_at": "2026-10-01T22:00:00Z"})
    write(os.path.join(hist, "2026-11-13", "alias_map.json"), {"renames": {"R": "S"}, "_applied_at": "2026-11-13T01:00:00Z"})
    write(os.path.join(hist, "2026-11-13", "undone.json"), {})
    write(os.path.join(hist, "2026-11-14", "alias_map.json"), {"renames": {"C": "D"}, "_applied_at": "x"})
    write(os.path.join(hist, "2026-11-14", "apply_failed.json"), {})
    write(os.path.join(hist, "2026-11-15", "alias_map.json"), {"renames": {"C": "E"}})   # never applied
    hm, ho = rp.history_moves(hist)
    check("history: two applies on one day resolve in applied order (the -2 folder after the first)",
          hm.get("A") == "C" and hm.get("B") == "C" and ho.get("A") == "2026-11-12", hm)
    write(os.path.join(hist, "2026-11-12-10", "alias_map.json"), {"renames": {"C": "D"},
                                                                  "_applied_at": "2026-11-12T20:00:00Z"})
    hm10, _ = rp.history_moves(hist)
    check("history: a tenth same-day apply follows the second (applied time, never the folder name's order)",
          hm10.get("A") == "D" and hm10.get("B") == "D", hm10)
    shutil.rmtree(os.path.join(hist, "2026-11-12-10"))
    check("history: an undone, a failed and a never-applied receipt are skipped", hm.get("Q") == "R"
          and "R" not in hm and hm.get("A") == "C", hm)
    hm2, _ = rp.history_moves(hist, {"C": "Z"}, live={"Z", "R"})
    check("history: this apply's moves go on top, each chain lands on the title live now",
          hm2 == {"A": "Z", "B": "Z", "C": "Z", "Q": "R"}, hm2)
    hm3, _ = rp.history_moves(hist, None, live={"R", "B"})
    check("history: a target not live, or an old title live again, is left out", hm3 == {"Q": "R"}, hm3)

    # The apply carries an earlier apply's residue, in its own receipt, naming the apply it comes from.
    point(kbc)
    write(os.path.join(kbc, "cred_rename_out", "2026-01-02", "alias_map.json"),
          {"renames": {"Gadget Old": "Other"}, "_applied_at": "2026-01-02T00:00:00Z"})
    d = read(os.path.join(kbc, "cer_classified.json"))
    d["records"]["Gadget raw"] = {"unified_title": "Gadget Old"}
    d["records"]["Widget two cached"] = {"unified_title": "Widget Two"}   # this apply's own rename
    write(os.path.join(kbc, "cer_classified.json"), d)
    d = read(os.path.join(kbc, "unclassified_assignments.json"))
    d["assignments"]["Gadget assign"] = {"unified_title": "Gadget Old", "reviewed_by": BOT, "title_reviewed_by": BOT,
                                         "title_reviewed_at": T1}
    write(os.path.join(kbc, "unclassified_assignments.json"), d)
    d = read(os.path.join(kbc, "credentials.json"))
    d["Widget Two"] = [{"issuing_agency": "Widget Board"}]
    write(os.path.join(kbc, "credentials.json"), d)
    d = read(os.path.join(kbc, "unified_titles.json"))
    d["Widget two raw"] = {"unified_title": "Widget Two", "reviewed_by": BOT}
    write(os.path.join(kbc, "unified_titles.json"), d)
    write(os.path.join(kbc, "credential_review_overlay.json"), {"overrides": {"Widget Two": {
        "unified_title_override": "Widget Two B", "reviewed_by": SAM, "reviewed_at": "2026-11-11T15:00:00+00:00",
        "field_reviews": {"unified_title_override": {"by": SAM, "at": "2026-11-11T15:00:00+00:00"}}}}})
    quiet(dry.main)
    dprev = read(os.path.join(dry.OUT_DIR, "alias_map.json"))["repoint_preview"]["changes"]
    check("dry run: the preview shows an earlier apply's residue with the apply it comes from",
          any(c["key"] == "Gadget raw" and c.get("from_apply") == "2026-01-02" for c in dprev), dprev)
    quiet(app.main)
    newest = sorted(n for n in os.listdir(os.path.join(kbc, "cred_rename_out")) if n.startswith("20"))[-1]
    rr = read(os.path.join(kbc, "cred_rename_out", newest, "repoint.json"))
    check("apply: an earlier apply's machine value is re-pointed in this apply's receipt",
          read(os.path.join(kbc, "cer_classified.json"))["records"]["Gadget raw"]["unified_title"] == "Other"
          and any(c["key"] == "Gadget raw" and c.get("from_apply") == "2026-01-02" for c in rr["planned"]),
          rr["planned"])
    check("apply: this apply's own moves name its real receipt folder",
          [c.get("from_apply") for c in rr["planned"] if c["key"] == "Widget two cached"] == [newest], rr["planned"])
    cbn = os.path.join(kbc, "cred_rename_out", newest)

    # The undo and the take-back of an earlier apply's re-point, filed in the later apply's receipt.
    fg = Fake({U("Gadget assign"): {"value": "Gadget Old", "reviewer_email": BOT, "reviewed_at": T1}})
    rp.run_supabase(cbn, fg)
    moved = fg.rows[U("Gadget assign")]["value"] == "Other"
    _, tb = rp.supabase_undo(cbn, rest_fn=fg)
    check("take-back: an earlier apply's row moved in this receipt goes back, read back",
          moved and fg.rows[U("Gadget assign")]["value"] == "Gadget Old" and [o["status"] for o in tb] == ["ok"], tb)
    out = io.StringIO()
    with contextlib.redirect_stdout(out):
        try:
            undo.main([rcpt, "--apply", "--json-only"])
            msg = ""
        except SystemExit as e:
            msg = str(e)
    check("undo order: an earlier apply refuses while a later one is in force, naming it",
          msg.startswith("undo %s first" % newest) and NEW in read(os.path.join(kbc, "credentials.json")), msg)
    quiet(undo.main, [cbn, "--apply", "--json-only"])
    check("undo: the later apply puts back the earlier apply's re-point it holds",
          read(os.path.join(kbc, "cer_classified.json"))["records"]["Gadget raw"]["unified_title"] == "Gadget Old"
          and os.path.isfile(os.path.join(cbn, "undone.json")) and "Widget Two" in read(os.path.join(kbc,
                                                                                                 "credentials.json")))

    # The full undo reads a moved assignment's live row before any file goes back.
    fu = Fake({U(BOT_RAW): {"value": OLD, "reviewer_email": BOT, "reviewed_at": T1},
               U(LEGACY_RAW): {"value": OLD, "reviewer_email": BOT, "reviewed_at": T1}})
    rp.run_supabase(rcpt, fu)
    fu.rows[U(BOT_RAW)].update(reviewer_email=PERSON, reviewed_at="2026-11-13T00:00:00+00:00")  # a person re-saves
    undo.KEY = "test"
    undo.rest = fu
    d = read(p)
    d["occupations"]["widget tech"]["curated_by"] = "skywalker-s120@bot"
    write(p, d)
    check("full undo: a moved assignment a person re-saved stops the undo before any file goes back",
          refused(undo.main, [rcpt, "--apply"]) and NEW in read(os.path.join(kbc, "credentials.json"))
          and fu.rows[U(BOT_RAW)]["value"] == NEW)
    quiet(undo.main, [rcpt, "--apply", "--force"])
    check("full undo --force: that fold group stays whole, the person's row as they saved it",
          NEW in read(os.path.join(kbc, "credentials.json")) and fu.rows[U(BOT_RAW)]["value"] == NEW
          and fu.rows[U(LEGACY_RAW)]["value"] == NEW, fu.rows)
    undo.KEY = None

    # The nightly sync records the title's own saver, whatever field a later save touched.
    import _apply_unclassified_triage as tri
    asg, _, _, _ = tri.build_assignments([
        {"course_id": rp.UNCLASS + "R1", "field": "unified_title_assignment", "value": NEW, "reviewer_email": PERSON,
         "reviewed_at": "2026-06-01T00:00:00+00:00"},
        {"course_id": rp.UNCLASS + "R1", "field": "issuing_agency_assignment", "value": "Widget Board",
         "reviewer_email": BOT, "reviewed_at": "2026-11-01T00:00:00+00:00"}])
    check("sync: title_reviewed_by is the title row's saver, reviewed_by the newest of any field",
          asg["R1"]["title_reviewed_by"] == PERSON and asg["R1"]["title_reviewed_at"] == "2026-06-01T00:00:00+00:00"
          and asg["R1"]["reviewed_by"] == BOT, asg)

    # A scalar title-keyed file moves its value; old titles with different values wait for a person.
    sc = os.path.join(tmp, "sc")
    write(os.path.join(sc, "kb", "statewide_exhibit_categories.json"), {"titles": {
        "O1": "Cat A", "O2": "Cat B", "O3": "Cat C", "N3": "Cat D", "O4": "Cat E", "N4": "Cat E"}})
    ch, hl = rp.plan({"O1": "N1", "O2": "N2a", "O3": "N3", "O4": "N4"}, sc)
    rp.apply_changes(ch, sc)
    check("scalar keys: a value moves to an absent new title, or folds into one holding the same value",
          read(os.path.join(sc, "kb", "statewide_exhibit_categories.json"))["titles"]
          == {"N1": "Cat A", "N2a": "Cat B", "O3": "Cat C", "N3": "Cat D", "N4": "Cat E"})
    check("scalar keys: an old title whose value differs from the target's is held and listed, never dropped",
          [h["key"] for h in hl] == ["N3"] and "different" in hl[0]["why"], hl)
    mk = os.path.join(tmp, "mk")
    write(os.path.join(mk, "kb", "reference", "map_cpl_opportunities_verified.json"), {"by_title": {"M1": ["1"],
                                                                                                    "M2": ["2"]}})
    chm, _ = rp.plan({"M1": "T", "M2": "T"}, mk, {"M1": "2026-10-01", "M2": "2026-11-12"})
    check("from_apply: a merged key names every origin", chm[0]["from_apply"] == ["2026-10-01", "2026-11-12"], chm)
    write(os.path.join(sc, "kb", "statewide_exhibit_categories.json"), {"titles": {"O1": "Cat A", "O2": "Cat B"}})
    ch2, hl2 = rp.plan({"O1": "N9", "O2": "N9"}, sc)
    check("scalar keys: two old titles with different values onto one new title are held",
          not ch2 and len(hl2) == 1 and "different" in hl2[0]["why"], (ch2, hl2))

    # ── 7: the count and --check ────────────────────────────────────────────────────────────────────────────────
    lean = os.path.join(tmp, "lean")
    kbl = tree(lean, person=False)
    point(kbl)
    quiet(dry.main)
    quiet(app.main)
    lr = os.path.join(kbl, "cred_rename_out", sorted(os.listdir(os.path.join(kbl, "cred_rename_out")))[0])
    fk = Fake({U(BOT_RAW): {"value": OLD, "reviewer_email": BOT, "reviewed_at": T1},
               U(LEGACY_RAW): {"value": OLD, "reviewer_email": BOT, "reviewed_at": T1}})
    rp.run_supabase(lr, fk)
    d = read(os.path.join(kbl, "unclassified_assignments.json"))
    for raw in (BOT_RAW, LEGACY_RAW):
        d["assignments"][raw]["unified_title"] = fk.rows[U(raw)]["value"]
    write(os.path.join(kbl, "unclassified_assignments.json"), d)
    write(os.path.join(kbl, "credential_review_overlay.json"), {"overrides": {}})
    check("count: reads 0 on a clean tree", rp.old_titles_left({OLD: NEW}, {}, lean)["count"] == 0,
          rp.old_titles_left({OLD: NEW}, {}, lean)["locations"])
    code = quiet(rp.main, ["--count", lr, "--root", lean])
    code2 = quiet(rp.main, ["--count", lr, "--check"])
    check("count: --count writes the receipt and --check passes at 0", code == 0 and code2 == 0)
    check("count: --check with no receipt (a no-op run) passes", quiet(rp.main, ["--count", "", "--check"]) == 0)
    write(os.path.join(kbl, "it_ai_credential_catalog.json"), {"credentials": [{"title": NEW, "formerly": [OLD]}]})
    write(os.path.join(kbl, "reference", "cos_certifications.json"), {"certifications": [{"name": OLD}]})
    check("count: a field that keeps an earlier name on purpose (formerly, an outside catalog's name) is not left",
          rp.old_titles_left({OLD: NEW}, {}, lean)["count"] == 0, rp.old_titles_left({OLD: NEW}, {}, lean)["locations"])
    write(os.path.join(kbl, "planted.json"), {"note": {"title": OLD}})
    write(os.path.join(kbl, "somewhere", "2026-11-12", "report.json"), {"t": OLD})
    write(os.path.join(kbl, "cer_procedures_out", "saved", "saved_x.json"), {"t": OLD})
    write(os.path.join(kbl, "exhibits_related.json"), {"titles": [[NEW, 0, 1, 0, 0, [OLD], []]]})
    with open(os.path.join(kbl, "ascii.json"), "w", encoding="utf-8") as f:
        json.dump({"t": OLD}, f, ensure_ascii=True)
    write(os.path.join(kbl, "reference", "credential_families.json"), [FAMILY])
    write(os.path.join(kbl, "credential_review_overlay.json"), {"overrides": {OLD: {
        "unified_title_override": FAMILY, "field_reviews": {"unified_title_override": {"by": SAM, "at": "x"}}}}})
    left = rp.old_titles_left({OLD: NEW}, {}, lean)
    locs = sorted(x["location"] for x in left["locations"])
    check("count: finds planted titles (ASCII escapes too), skips receipt, dated, saved/ folders and the alias slot",
          locs == ["kb/ascii.json:/t", "kb/planted.json:/note/title"] and left["alias_entries_skipped"] == 3, locs)
    check("count: a person's fold into a family title is kept, not left",
          [k["location"] for k in left["kept"]] == ["kb/credential_review_overlay.json:/overrides/%s" % OLD], left)
    quiet(rp.main, ["--count", lr, "--root", lean])
    out = io.StringIO()
    with contextlib.redirect_stdout(out):
        code3 = rp.main(["--count", lr, "--check"])
    check("count: --check exits 1 above 0 and names each location",
          code3 == 1 and "kb/planted.json:/note/title" in out.getvalue(), out.getvalue())

    # ── 2: a re-point with no credential change still files a receipt and moves its row ─────────────────────────
    os.remove(os.path.join(kbl, "planted.json"))
    write(os.path.join(kbl, "cred_rename_out", "2026-01-03", "alias_map.json"),
          {"renames": {"Lean Old": "Other"}, "_applied_at": "2026-01-03T00:00:00Z"})
    d = read(os.path.join(kbl, "unclassified_assignments.json"))
    d["assignments"]["Lean assign"] = {"unified_title": "Lean Old", "reviewed_by": BOT, "title_reviewed_by": BOT}
    write(os.path.join(kbl, "unclassified_assignments.json"), d)
    gho = os.path.join(tmp, "gh_output")
    os.environ["GITHUB_OUTPUT"] = gho
    try:
        before = set(os.listdir(os.path.join(kbl, "cred_rename_out")))
        quiet(app.main)   # the plan's rename is already applied; the only leftover is a row through kb_curation
        new = sorted(set(os.listdir(os.path.join(kbl, "cred_rename_out"))) - before)
        snap = read(os.path.join(kbl, "cred_rename_out", new[0], "alias_map.json")) if new else {}
        rq = read(os.path.join(kbl, "cred_rename_out", new[0], "repoint.json")) if new else {}
        check("apply: a row-only re-point files a re-point-only receipt the row step runs on",
              len(new) == 1 and snap.get("_repoint_only") and snap["renames"] == {}
              and [c["key"] for c in rq["planned"]] == ["Lean assign"] and rq["planned"][0]["via"] == "kb_curation"
              and "repoint_receipt=true" in open(gho).read(), (new, rq.get("planned")))
        fl = Fake({U("Lean assign"): {"value": "Lean Old", "reviewer_email": BOT, "reviewed_at": T1}})
        rp.run_supabase(os.path.join(kbl, "cred_rename_out", new[0]), fl)
        check("apply: that receipt's row moves", fl.rows[U("Lean assign")]["value"] == "Other")
        # No rename planned at all, and a leftover to re-point: the same.
        am2 = read(app.ALIAS_PATH)
        am2.update(renames={}, merges={})
        write(app.ALIAS_PATH, am2)
        d = read(os.path.join(kbl, "cer_classified.json"))
        d["records"]["Lean raw"] = {"unified_title": "Lean Old"}
        write(os.path.join(kbl, "cer_classified.json"), d)
        before = set(os.listdir(os.path.join(kbl, "cred_rename_out")))
        quiet(app.main)
        new2 = sorted(set(os.listdir(os.path.join(kbl, "cred_rename_out"))) - before)
        check("apply: with no rename planned, leftovers still file a receipt and move",
              len(new2) == 1 and read(os.path.join(kbl, "cer_classified.json"))["records"]["Lean raw"]["unified_title"]
              == "Other" and read(os.path.join(kbl, "cred_rename_out", new2[0], "alias_map.json")).get("_repoint_only"),
              new2)
    finally:
        os.environ.pop("GITHUB_OUTPUT", None)

    # ── 5 (cont.): the rename undo's own ops read each row back ─────────────────────────────────────────────────
    fu = Fake({("_CREDENTIAL_REVIEW::T", "issuer_resolution"): {"value": "v", "reviewer_email": undo.fold_issuer.COHORT}})
    undo.rest = fu
    r1 = undo.run_op({"op": "res_delete", "course_id": "_CREDENTIAL_REVIEW::T", "field": "issuer_resolution",
                      "after": "v"})
    check("undo op: a delete whose echo is empty is filed ok from the read-back", r1["status"] == "ok"
          and not fu.rows, r1)
    fu.rows[U(BOT_RAW)] = {"value": NEW, "reviewer_email": PERSON, "reviewed_at": T1}
    r2 = undo.run_op({"op": "repoint_back", "course_id": U(BOT_RAW)[0], "field": U(BOT_RAW)[1], "after": NEW,
                      "before": {"value": OLD, "reviewer_email": BOT, "reviewed_at": T1}})
    check("undo op: a re-pointed row a person saved since is left, unchanged",
          r2["status"] == "left" and fu.rows[U(BOT_RAW)]["value"] == NEW, r2)
    fu.rows[U(BOT_RAW)] = {"value": NEW, "reviewer_email": BOT, "reviewed_at": T1}
    fu.lose = True
    r3 = undo.run_op({"op": "repoint_back", "course_id": U(BOT_RAW)[0], "field": U(BOT_RAW)[1], "after": NEW,
                      "before": {"value": OLD, "reviewer_email": BOT, "reviewed_at": T1}})
    check("undo op: a lost PATCH response is filed ok from the read-back",
          r3["status"] == "ok" and fu.rows[U(BOT_RAW)]["value"] == OLD, r3)
finally:
    restore()
    shutil.rmtree(tmp, ignore_errors=True)

# ── 8: the workflow ─────────────────────────────────────────────────────────────────────────────────────────────
wf = yaml.safe_load(open(os.path.join(ROOT, ".github", "workflows", "cred-rename-apply.yml"), encoding="utf-8"))
jobs = wf["jobs"]
steps = jobs["apply"]["steps"]
names = [s.get("name") for s in steps]
commit_i = names.index("Commit + push")
crun = steps[commit_i]["run"]
check("workflow: the dispatch is its own job, needing the apply, run only once it pushed",
      jobs["dashboard"]["needs"] == ["apply"] and "needs.apply.outputs.pushed == 'true'" in jobs["dashboard"]["if"]
      and jobs["apply"]["outputs"]["pushed"] == "${{ steps.commit.outputs.pushed }}")
check("workflow: only the dashboard job holds actions: write, and its checkout keeps no token",
      jobs["dashboard"]["permissions"].get("actions") == "write"
      and "actions" not in (jobs["apply"].get("permissions") or {})
      and jobs["dashboard"]["steps"][0]["with"].get("persist-credentials") is False)
drun = jobs["dashboard"]["steps"][1]["run"]
check("workflow: the dispatch fails on a failed lookup or a failed dispatch, and on another workflow's pending run",
      "set -euo pipefail" in drun and "if ! events=$(gh run list" in drun
      and "if ! gh workflow run daily-dashboard.yml --ref main" in drun and drun.count("exit 1") >= 3)
check("workflow: the dispatch is not in the apply job",
      not any("gh workflow run" in (s.get("run") or "") for s in jobs["apply"]["steps"]))
check("workflow: a pending scheduled dashboard run does not stand in for a dispatch; a dispatched one does",
      "--json status,event" in drun and '*" workflow_dispatch "*) ' in drun and "dispatch over it" in drun
      and '.status == "requested"' in drun and '.status == "queued"' in drun)
check("workflow: a re-point-only receipt skips the issuer and row-move steps",
      all(steps[names.index(n)].get("if") == "steps.json.outputs.repoint_receipt != 'true'"
          for n in ("Write the fold's issuer resolutions to kb_curation", "Apply Supabase kb_curation row migration")))
check("workflow: the commit step sets pushed only after a push succeeded, never on a no-op",
      crun.index('echo "pushed=true"') > crun.index("if git push origin HEAD:main; then")
      and crun.index('echo "pushed=true"') > crun.index("No changes to commit"))
check("workflow: the old-title check is the apply's last step, gated on a receipt (a no-op never fails on it)",
      "--count" in (steps[-1].get("run") or "") and "--check" in steps[-1]["run"]
      and "steps.json.outputs.receipt != ''" in str(steps[-1].get("if"))
      and "steps.commit.outputs.pushed == 'true'" in str(steps[-1].get("if")))
check("workflow: the take-back reverses the row moves too",
      "--supabase-undo" in steps[names.index("Take back the resolutions and commit the receipt when the apply did not "
                                             "land")]["run"])
check("workflow: after the row moves the saved assignments' copy is re-read",
      "_apply_unclassified_triage.py" in steps[names.index("Re-sync the credential-review overlay after the row "
                                                           "moves")]["run"])
check("workflow: the count runs before the commit, and the commit carries the re-pointed files",
      names.index("Count the old titles left under kb/") < commit_i
      and all(f in crun for f in ("kb/unclassified_assignments.json", "kb/cer_classified.json",
                                  "kb/occupation_credential_map.json",
                                  "kb/reference/map_cpl_opportunities_verified.json", "kb/exhibits_related.json")))
inp = (wf.get(True) or wf.get("on"))["workflow_dispatch"]["inputs"]
check("workflow: one write path: no repoint_only input, no repoint job", set(inp) == {"only_plan"}
      and set(jobs) == {"apply", "dashboard"} and "if" not in jobs["apply"])
check("workflow: the apply holds the daily-dashboard group and never cancels a running job",
      jobs["apply"]["concurrency"] == {"group": "daily-dashboard", "cancel-in-progress": False} and "concurrency" not in wf)
check("workflow: the commit carries the re-keyed statewide categories",
      "kb/statewide_exhibit_categories.json" in crun)
dash = yaml.safe_load(open(os.path.join(ROOT, ".github", "workflows", "daily-dashboard.yml"), encoding="utf-8"))
gate = dash["jobs"]["gate"]["steps"][0]["run"]
check("dashboard: the gate runs every non-scheduled event, so the dispatched run is never skipped",
      'if [ "$EVENT" != "schedule" ]; then echo "run=true"' in gate
      and dash["concurrency"] == {"group": "daily-dashboard", "cancel-in-progress": False}
      and dash["jobs"]["update-dashboard"]["if"] == "needs.gate.outputs.run == 'true'"
      and "workflow_dispatch" in (dash.get(True) or dash.get("on") or {}))

for name, ok, why in CHECKS:
    print(("PASS " if ok else "FAIL ") + name + ("" if ok or not why else "  -- %s" % str(why)[:400]))
n = sum(ok for _, ok, _ in CHECKS)
print("%d/%d passed" % (n, len(CHECKS)))
sys.exit(0 if n == len(CHECKS) else 1)
