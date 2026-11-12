#!/usr/bin/env python3
"""cred_rename_fold_issuer_test.py — a fold keeps one issuer by the agreed precedence, in one pass, and undoes.

#3110 build step 1 (COBIx 2026-11-11 16:18Z, Sky S637), under Sam's ruling 1: the canonical title carries
the credential's issuer. What this pins, each a way the apply could go wrong without an error:

  cert form   Brakes (ASE A5) <- Automotive Technology (ASE A5 Brakes) ends with ASE only; the folded college
              record is dropped (before, the fold kept both), and the July person-set record it drops is
              named with who and when.
  reviewer    Heating and Air Conditioning (ASE A7 standards): its lead Automotive Air Conditioner carries a
              July ASE override, the merged row carries Sam's issuer set after the fold. Only Sam's counts
              (rule 1 is an issuer set with the fold), spelled "California Community Colleges"; the receipt
              holds the conflict and the before-value, and the guard flags its 2 IC exhibits.
  standards   rule 2b: Brakes (ASE A5 standards) keeps the college and drops ASE, flagged for its IC
              exhibits; the ASE override its lead carried is deleted on kb_curation and logged.
  additive    a plain fold keeps both issuers; a bot cohort's issuer is not a person's.
  one pass    a lead and its confirmed siblings apply in one run; an unconfirmed sibling still waits.
  undo        kb/_cred_rename_undo.py puts every file back, refuses drift, and writes the kb_curation reversal.
  carry       the Supabase step sets the target's issuer override to the winner and logs the before-row.

Run from the repo root:
    python3 tests/cred_rename_fold_issuer_test.py
"""
import contextlib
import io
import json
import os
import shutil
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import fold_issuer  # noqa: E402
import _cred_rename_dryrun as dry  # noqa: E402
import _cred_rename_apply as app  # noqa: E402
import _cred_rename_apply_supabase as sup  # noqa: E402
import _cred_rename_undo as undo  # noqa: E402
import _cred_fold_resolution_write as resw  # noqa: E402
import _apply_credential_review as acr  # noqa: E402

results = []
ASE = "National Institute for Automotive Service Excellence (ASE)"
CCC = "California Community Colleges"
AWS = "American Welding Society (AWS)"


def check(name, cond, why=""):
    results.append((name, bool(cond), why))


def rec(issuer, trainer=None):
    return {"issuing_agency": issuer, "training_agency": trainer, "confidence_issuer": 1.0}


def ov(**fields):
    """An overlay entry from field rows (value, reviewer, reviewed_at), stamped per field as
    kb/_apply_credential_review.py writes it; the entry's own stamp is its latest row's."""
    e, stamps = {}, {}
    for f, (v, by, at) in fields.items():
        e[f] = v
        stamps[f] = {"by": by, "at": at}
    last = max(stamps.values(), key=lambda s: s["at"])
    e["reviewed_by"], e["reviewed_at"] = last["by"], last["at"]
    e["field_reviews"] = stamps
    return e


SAM = "slee@cccco.edu"
MAP = "map@rccd.edu"
BOT = "cer-bulk-s1@bot"
HAC_T = "Heating and Air Conditioning (ASE A7 standards)"
EP_T = "Engine Performance (ASE A8 standards)"
BR_T = "Brakes (ASE A5 standards)"
F1, F2, F3 = "2026-11-11T15:26:54Z", "2026-11-11T15:26:55Z", "2026-11-11T15:26:56Z"
JUL = "2026-07-09T00:07:08Z"


def mine(issuer, by, at, trainer=None):
    r = rec(issuer, trainer)
    r["reviewed_by"], r["reviewed_at"] = by, at
    return r


CREDS = {
    "Brakes (ASE A5)": [rec(ASE)],
    # A July person-set college record: read as an ordinary record, so rule 2 drops it, and says so.
    "Automotive Technology (ASE A5 Brakes)": [mine(CCC, MAP, "2026-07-07T20:44:36Z")],
    "Automotive Air Conditioner": [mine(ASE, MAP, JUL)],
    "Heating and Air Conditioning": [rec(ASE), rec("California Community College Chancellor's Office")],
    "Automotive Technology (ASE A7 Heating and Air Conditioning)": [rec(CCC)],
    "Automotive Technology (ASE A8 Engine Performance)": [rec(CCC)],
    "Engine Performance 1 (ASE A8 Engine Performance)": [rec(CCC)],
    "Engine Performance 3 (ASE A8 Engine Performance)": [rec(CCC)],
    "Automotive Braking Systems": [mine(ASE, MAP, JUL)],
    "Automotive Brakes Lab": [rec(CCC)],
    "Welding Fundamentals": [rec(AWS)],
    "Welding Basics": [rec(CCC, "Some ROP")],
    "Untouched": [rec(CCC)],
}
OVERLAY = {
    "Automotive Technology (ASE A5 Brakes)": ov(
        issuing_agency_override=(CCC, MAP, "2026-07-07T20:44:36Z"),
        unified_title_override=("Brakes (ASE A5)", SAM, F2),
        unified_title_merge_confirm=("Brakes (ASE A5)", SAM, F2)),
    # The lead creates the target; its ASE override was set by a person in July, before the fold.
    "Automotive Air Conditioner": ov(issuing_agency_override=(ASE, MAP, JUL),
                                     unified_title_override=(HAC_T, SAM, F1)),
    # Sam's issuer, set after the fold was saved: rule 1.
    "Heating and Air Conditioning": ov(
        issuing_agency_override=("California Community College Chancellor's Office", SAM, "2026-11-11T15:47:58Z"),
        unified_title_override=(HAC_T, SAM, F2), unified_title_merge_confirm=(HAC_T, SAM, F2)),
    "Automotive Technology (ASE A7 Heating and Air Conditioning)": ov(
        unified_title_override=(HAC_T, SAM, F2), unified_title_merge_confirm=(HAC_T, SAM, F2)),
    # The lead's entry reads later than its sibling (a later edit): it still leads, having no confirm.
    "Automotive Technology (ASE A8 Engine Performance)": ov(unified_title_override=(EP_T, SAM, F1),
                                                            quality_flag_override=("", SAM, "2026-11-11T16:00:00Z")),
    "Engine Performance 1 (ASE A8 Engine Performance)": ov(unified_title_override=(EP_T, SAM, F2),
                                                           unified_title_merge_confirm=(EP_T, SAM, F2)),
    # No confirm: waits for a person, as before.
    "Engine Performance 3 (ASE A8 Engine Performance)": ov(unified_title_override=(EP_T, SAM, F3)),
    # Rule 2b: the lead names ASE (a July override), the sibling is the college's.
    "Automotive Braking Systems": ov(issuing_agency_override=(ASE, MAP, JUL),
                                     unified_title_override=(BR_T, SAM, F1)),
    "Automotive Brakes Lab": ov(unified_title_override=(BR_T, SAM, F2), unified_title_merge_confirm=(BR_T, SAM, F2)),
    # A bot cohort's issuer is not a person's: the fold stays additive.
    "Welding Basics": ov(issuing_agency_override=(CCC, BOT, "2026-11-12T00:00:00Z"),
                         unified_title_override=("Welding Fundamentals", SAM, F2),
                         unified_title_merge_confirm=("Welding Fundamentals", SAM, F2)),
}

UT = {
    "AUTO 101 Brakes": {"unified_title": "Automotive Technology (ASE A5 Brakes)"},
    "AC 1": {"unified_title": "Automotive Air Conditioner"},
    "HVAC NC": {"unified_title": "Heating and Air Conditioning"},
    "AUTO A7": {"unified_title": "Automotive Technology (ASE A7 Heating and Air Conditioning)"},
    "AUTO A8": {"unified_title": "Automotive Technology (ASE A8 Engine Performance)"},
    "EP1": {"unified_title": "Engine Performance 1 (ASE A8 Engine Performance)"},
    "EP3": {"unified_title": "Engine Performance 3 (ASE A8 Engine Performance)"},
    "WELD 1": {"unified_title": "Welding Basics"},
    "AUTO 52": {"unified_title": "Automotive Braking Systems"},
    "AUTO 52L": {"unified_title": "Automotive Brakes Lab"},
    "Other": {"unified_title": "Untouched"},
}
ARTS = {"articulations": [
    {"course_id": "AUTO M1001", "exhibit_id": "MAPCXS-AB-1-001", "exhibit_title": "AUTO 101 Brakes",
     "unified_title": "Automotive Technology (ASE A5 Brakes)"},
    {"course_id": "AUTO M1002", "exhibit_id": "MAPICI-HV-1-001", "exhibit_title": "HVAC NC",
     "unified_title": "Heating and Air Conditioning"},
    {"course_id": "AUTO M1003", "exhibit_id": "MAPCXS-A8-1-001", "exhibit_title": "AUTO A8",
     "unified_title": "Automotive Technology (ASE A8 Engine Performance)"},
    {"course_id": "WELD M1001", "exhibit_id": "MAPCXS-W1-1-001", "exhibit_title": "WELD 1",
     "unified_title": "Welding Basics"},
]}
RELATED = {"titles": [
    ["Automotive Braking Systems", 0, 2, 1, 0, [], [["ic", 2]]],
    ["Heating and Air Conditioning", 0, 1, 1, 0, [], [["ic", 1]]],
    ["Automotive Air Conditioner", 0, 1, 1, 0, [], [["ic", 1]]],
    ["Automotive Technology (ASE A5 Brakes)", 0, 7, 6, 0, [], [["ic", 1], ["cx", 5]]],
]}


READ_AT = "2026-11-11T16:00:00Z"  # when the apply's overlay was read: decided_at


def issuers_in(creds, t):
    return sorted({r["issuing_agency"] for r in creds.get(t) or []})


class Nightly:
    """kb/_apply_credential_review.py main() run against the fake kb_curation: the real nightly sync."""

    def __init__(self, mod, db, paths, out_root):
        self.mod, self.db = mod, db
        mod.KEY = "test"
        mod.OUT = paths["credential_review_overlay.json"]
        mod.CR_PATH = paths["credentials.json"]
        mod.CRED_OUT_ROOT = out_root

    def run(self):
        self.mod.fetch_rows = lambda: [dict(r) for r in self.db.rows.values()]
        with contextlib.redirect_stdout(io.StringIO()):
            self.mod.main()


class FakeDB:
    """kb_curation in memory, wired into kb/_cred_rename_apply_supabase.py's five calls, with PostgREST's
    guard semantics: a guarded write affects 0 rows when the row no longer holds the guarded value."""

    def __init__(self, mod):
        self.rows, self.calls, self.before_write = {}, [], None
        mod.KEY = "test"
        mod.fetch_credential_review_rows = self.fetch
        mod.delete_row, mod.patch_row = self.delete, self.patch
        mod.read_row, mod.guarded_write = self.read, self.guarded

    def add(self, title, **fields):
        for f, (v, by, at) in fields.items():
            cid = "_CREDENTIAL_REVIEW::" + title
            self.rows[(cid, f)] = {"course_id": cid, "field": f, "value": v, "reviewer_email": by,
                                   "reviewed_at": at, "validated_at": None, "validated_by": None}

    def validate(self, title, field, by):
        r = self.rows[("_CREDENTIAL_REVIEW::" + title, field)]
        r["validated_at"], r["validated_by"] = "2026-11-01T00:00:00Z", by

    def get(self, title, field):
        return self.rows.get(("_CREDENTIAL_REVIEW::" + title, field))

    def fetch(self):
        out = {}
        for r in self.rows.values():
            out.setdefault(r["course_id"], []).append(dict(r))
        return out

    def delete(self, cid, field):
        self.calls.append(("delete", cid, field))
        n = 1 if self.rows.pop((cid, field), None) else 0
        return {"course_id": cid, "field": field, "op": "delete", "status": "ok", "rows_affected": n}

    def patch(self, old, new, field):
        self.calls.append(("patch", old, new, field))
        if (new, field) in self.rows:
            return {"old_course_id": old, "new_course_id": new, "field": field, "op": "patch",
                    "status": "fail", "error": "HTTP Error 409: Conflict"}
        r = self.rows.pop((old, field), None)
        if r:
            self.rows[(new, field)] = dict(r, course_id=new)
        return {"old_course_id": old, "new_course_id": new, "field": field, "op": "patch",
                "status": "ok", "rows_affected": 1 if r else 0}

    def read(self, cid, field):
        if self.before_write:
            hook, self.before_write = self.before_write, None
            hook()
        r = self.rows.get((cid, field))
        return dict(r) if r else None

    def wire_writer(self, mod):
        """The resolution writer's three calls, with PostgREST's semantics."""
        mod.KEY = "test"
        self.fail_insert_for = set()

        def insert_ignore(row):
            self.calls.append(("res_insert", row["course_id"]))
            if row["course_id"] in self.fail_insert_for:
                raise RuntimeError("HTTP Error 503: Service Unavailable")
            if (row["course_id"], row["field"]) in self.rows:
                return []
            self.rows[(row["course_id"], row["field"])] = dict({"validated_at": None, "validated_by": None}, **row)
            return [row]

        def get_row(cid, field):
            r = self.rows.get((cid, field))
            return dict(r) if r else None

        def replace_own(cid, field, old_value, new):
            r = self.rows.get((cid, field))
            if not r or r.get("reviewer_email") != fold_issuer.COHORT or r.get("value") != old_value:
                return []
            r.update(new)
            return [r]
        mod.insert_ignore, mod.get_row, mod.replace_own = insert_ignore, get_row, replace_own

    def guarded(self, op, cid, field, before, body=None):
        self.calls.append(("guarded", op, cid, field))
        cur = self.rows.get((cid, field))
        out = {"course_id": cid, "field": field, "op": "issuer_" + op}
        if op == "insert":
            if cur:
                return dict(out, status="conflict", rows_affected=0)
            self.rows[(cid, field)] = dict({"course_id": cid, "field": field, "validated_at": None,
                                            "validated_by": None}, **body)
            return dict(out, status="ok", rows_affected=1, after_row=body)
        if not cur or cur["value"] != before["value"] or cur["reviewed_at"] != before["reviewed_at"]:
            return dict(out, status="conflict", rows_affected=0)
        if op == "delete":
            del self.rows[(cid, field)]
        else:
            cur.update(body)
        return dict(out, status="ok", rows_affected=1, after_row=body)


def write(path, obj):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2, ensure_ascii=False)


def read(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


tmp = tempfile.mkdtemp(prefix="fold_issuer_")
try:
    paths = {n: os.path.join(tmp, n) for n in
             ("credentials.json", "unified_titles.json", "coci_articulations.json",
              "credential_review_overlay.json", "exhibits_related.json")}
    write(paths["credentials.json"], CREDS)
    write(paths["unified_titles.json"], UT)
    write(paths["coci_articulations.json"], ARTS)
    write(paths["credential_review_overlay.json"], {"_read_at": READ_AT, "overrides": OVERLAY})
    write(paths["exhibits_related.json"], RELATED)
    dry_out = os.path.join(tmp, "cred_rename_dryrun")
    out_root = os.path.join(tmp, "cred_rename_out")
    for mod in (dry, app, undo):
        mod.CREDENTIALS = paths["credentials.json"]
        mod.UNIFIED_TITLES = paths["unified_titles.json"]
        mod.ARTICULATIONS = paths["coci_articulations.json"]
    dry.OVERLAY = app.OVERLAY = paths["credential_review_overlay.json"]
    dry.RELATED = app.RELATED = paths["exhibits_related.json"]
    dry.FAMILIES = app.FAMILIES = os.path.join(tmp, "no_families.json")  # hermetic: no family titles
    dry.PLANS_DIR = app.PLANS_DIR = os.path.join(tmp, "no_plans")  # hermetic: no ruled plans
    dry.OUT_DIR = app.DRYRUN_OUT = dry_out
    app.ALIAS_PATH = os.path.join(dry_out, "alias_map.json")
    app.OUT_ROOT = sup.OUT_ROOT = out_root

    with contextlib.redirect_stdout(io.StringIO()):
        dry.main()
    amap = read(os.path.join(dry_out, "alias_map.json"))
    coll = read(os.path.join(dry_out, "collisions.json"))

    # ── one pass ─────────────────────────────────────────────────────────
    check("one pass: the lead renames", amap["renames"].get("Automotive Air Conditioner") == HAC_T)
    check("one pass: a confirmed sibling folds in the same run, not queued",
          amap["merges"].get("Heating and Air Conditioning") == HAC_T
          and amap["merges"].get("Automotive Technology (ASE A7 Heating and Air Conditioning)") == HAC_T)
    check("one pass: the merge detail names the same-run lead",
          any(m.get("same_run_lead") == "Automotive Air Conditioner" for m in amap["merge_details"]))
    queued = {c["old_unified_title"]: c["reason"] for c in coll["collisions"]}
    check("one pass: an unconfirmed sibling still waits as intra_batch_same_target",
          queued.get("Engine Performance 3 (ASE A8 Engine Performance)") == "intra_batch_same_target",
          str(queued))
    check("one pass: the dry-run stays apply-safe", amap["summary"]["apply_safe"] is True)
    prev = amap.get("issuer_preview") or {}
    check("preview: the dry-run reports each group's rule",
          prev.get(HAC_T, {}).get("rule") == "reviewer" and prev.get("Brakes (ASE A5)", {}).get("rule") == "cert-form"
          and prev.get("Welding Fundamentals", {}).get("rule") == "additive", json.dumps(prev)[:300])

    with contextlib.redirect_stdout(io.StringIO()):
        app.main()
    creds = read(paths["credentials.json"])
    issuers = lambda t: sorted({r["issuing_agency"] for r in creds.get(t) or []})  # noqa: E731

    # ── the three rules ──────────────────────────────────────────────────
    check("cert form: Brakes (ASE A5) ends with ASE only", issuers("Brakes (ASE A5)") == [ASE],
          str(issuers("Brakes (ASE A5)")))
    check("cert form: the folded title is gone", "Automotive Technology (ASE A5 Brakes)" not in creds)
    check("reviewer: Sam's issuer wins, in the reference spelling", issuers(HAC_T) == [CCC], str(issuers(HAC_T)))
    check("standards: a (ASE ... standards) title keeps the college", issuers(EP_T) == [CCC], str(issuers(EP_T)))
    check("rule 2b: Brakes (ASE A5 standards) ends with the college only, ASE dropped",
          issuers(BR_T) == [CCC], str(issuers(BR_T)))
    check("one pass: a lead whose entry reads later than its sibling still leads",
          amap["renames"].get("Automotive Technology (ASE A8 Engine Performance)") == EP_T
          and amap["merges"].get("Engine Performance 1 (ASE A8 Engine Performance)") == EP_T)
    check("additive: a plain fold keeps both issuers, a bot's override aside",
          issuers("Welding Fundamentals") == sorted([AWS, CCC]), str(issuers("Welding Fundamentals")))
    check("the untouched title is untouched", creds.get("Untouched") == CREDS["Untouched"])

    outs = sorted(os.listdir(out_root))
    rdir = os.path.join(out_root, outs[-1])
    snap = read(os.path.join(rdir, "alias_map.json"))
    md = open(os.path.join(rdir, "validation.md"), encoding="utf-8").read()
    res = snap["issuer_resolution"][HAC_T]["resolution"]
    check("receipt: the conflict keeps the target's before-value",
          res["conflict"] and res["conflict"]["target_override_before"]["issuer"] == ASE
          and res["conflict"]["target_override_before"]["by"] == MAP)
    check("rule 1 narrowed: only the issuer set with the fold counts; the July one is an ordinary record",
          [h["by"] for h in res["humans"]] == [SAM] and [h["by"] for h in res["older_people"]] == [MAP],
          json.dumps(res["humans"]) + json.dumps(res["older_people"]))
    check("rule 1 narrowed: the fold save time is the group's earliest", res["fold_saved_at"] == F1)
    check("receipt: validation.md carries the conflict line", "CONFLICT" in md and HAC_T in md)
    check("receipt: each group names the rule that decided it",
          f"`{HAC_T}` (rule 1" in md and f"`{BR_T}` (rule 2b" in md and "`Brakes (ASE A5)` (rule 2," in md
          and "`Welding Fundamentals` (rule 3" in md)
    hx = snap["issuer_resolution"][HAC_T]["exceptions"]
    check("guard: HVAC's 2 industry-certification exhibits are flagged, by rule 1",
          hx and hx[0]["ic_exhibits"] == 2 and hx[0]["rule"] == "reviewer" and "EXCEPTION" in md)
    bx = snap["issuer_resolution"][BR_T]["exceptions"]
    check("guard: rule 2b on a title with industry-certification exhibits is flagged",
          bx and bx[0]["ic_exhibits"] == 2 and bx[0]["rule"] == "standards")
    check("guard: rule 2 raises no exception", not snap["issuer_resolution"]["Brakes (ASE A5)"]["exceptions"])
    check("rule 2: an older person-set issuer reads as a record and is dropped",
          snap["issuer_resolution"]["Brakes (ASE A5)"]["resolution"]["rule"] == "cert-form")
    check("receipt: a person-set record dropped by rule 2 is named with who and when",
          "PERSON-SET record dropped: %s on `Automotive Technology (ASE A5 Brakes)`, set by %s at 2026-07-07" % (CCC, MAP) in md)
    check("receipt: a person-set record dropped by rule 2b is named with who and when",
          "PERSON-SET record dropped: %s on `%s`, set by %s" % (ASE, BR_T, MAP) in md)
    check("receipt: a person-set record reissued by rule 1 is named",
          "PERSON-SET record reissued: %s on `%s`, set by %s" % (ASE, HAC_T, MAP) in md)
    u = read(os.path.join(rdir, "undo.json"))
    check("undo file: the person-set records rule 2 and 2b dropped are kept whole",
          u["credentials"]["Automotive Braking Systems"]["before"] == CREDS["Automotive Braking Systems"]
          and u["credentials"]["Automotive Technology (ASE A5 Brakes)"]["before"]
          == CREDS["Automotive Technology (ASE A5 Brakes)"])

    # ── same-day second apply keeps the first receipt ────────────────────
    check("receipt dir: a same-day folder name", outs[-1].startswith(app.TODAY))
    with contextlib.redirect_stdout(io.StringIO()):
        app.main()  # re-dispatch: everything already applied
    check("finding 9: an apply that changes nothing writes no new receipt",
          sorted(os.listdir(out_root)) == outs, str(os.listdir(out_root)))

    # ── kb_curation: the row moves (as on main) and the resolution rows ──
    db = FakeDB(sup)
    db.wire_writer(resw)
    db.add("Automotive Air Conditioner", issuing_agency_override=(ASE, MAP, JUL),
           unified_title_override=(HAC_T, SAM, F1))
    db.add("Heating and Air Conditioning",
           issuing_agency_override=("California Community College Chancellor's Office", SAM, "2026-11-11T15:47:58Z"),
           unified_title_override=(HAC_T, SAM, F2), unified_title_merge_confirm=(HAC_T, SAM, F2))
    db.add("Automotive Braking Systems", issuing_agency_override=(ASE, MAP, JUL),
           unified_title_override=(BR_T, SAM, F1))
    db.validate("Automotive Braking Systems", "issuing_agency_override", "faculty@college.edu")
    db.add("Automotive Technology (ASE A8 Engine Performance)", unified_title_override=(EP_T, SAM, F1),
           unified_title_merge_confirm=(EP_T, SAM, F1))
    snap1 = read(os.path.join(rdir, "alias_map.json"))
    rows1 = snap1["resolution_rows"]
    check("resolution rows: one per folded target, under the bot cohort",
          sorted(r["course_id"].split("::")[1] for r in rows1) == sorted(snap1["issuer_resolution"])
          and all(r["reviewer_email"] == fold_issuer.COHORT and r["field"] == "issuer_resolution" for r in rows1))
    hv = next(r["value"] for r in rows1 if r["course_id"].endswith(HAC_T))
    check("resolution value: rule, winner in the reference spelling, dropped, decided_at, fold id",
          hv["rule"] == "reviewer" and hv["winner"] == CCC and hv["dropped"] == [ASE]
          and hv["decided_at"] == READ_AT and hv["fold_id"].startswith(os.path.basename(rdir) + "@"), json.dumps(hv))
    bv = next(r["value"] for r in rows1 if r["course_id"].endswith("Brakes (ASE A5)"))
    check("resolution value: a target's own kept record is never listed as dropped (rule 2)",
          bv["rule"] == "cert-form" and bv["dropped"] == [CCC])
    log1, failed1 = resw.write_rows(rows1, "2026-11-11T18:00:00Z")
    check("writer: every row inserts", failed1 == 0 and all(e["op"] == "insert" for e in log1))
    log1b, failed1b = resw.write_rows(rows1, "2026-11-11T18:05:00Z")
    check("writer: a retry finds its own rows and writes nothing", failed1b == 0
          and all(e["op"] == "skip" for e in log1b))
    with contextlib.redirect_stdout(io.StringIO()):
        try:
            sup.main()
        except SystemExit:
            pass
    tgt = "_CREDENTIAL_REVIEW::" + HAC_T
    check("moves: the lead's ASE override moves to the new title, as on main",
          ("patch", "_CREDENTIAL_REVIEW::Automotive Air Conditioner", tgt, "issuing_agency_override") in db.calls)
    check("moves: no issuer row is updated by the fold (the redesign)",
          not any(c[0] == "guarded" for c in db.calls) and db.get(HAC_T, "issuing_agency_override")["value"] == ASE)
    check("moves: a lead's confirm naming the title it creates is deleted, not moved onto it",
          db.get(EP_T, "unified_title_merge_confirm") is None)
    slog = read(os.path.join(rdir, "supabase_log.json"))
    check("moves: a deleted row's before_row keeps validated_at and validated_by",
          any(e.get("before_row", {}).get("value") for e in slog["log"]))
    src_text = open(os.path.join(ROOT, "kb/_cred_rename_apply_supabase.py"), encoding="utf-8").read()
    check("still_open 3: the carry is gone, so its retry gap cannot be reached",
          all(x not in src_text for x in ("def guarded_write", "def _carry_write", "def set_issuer", "issuer_update")))

    # ── the nightly: resolve every reader's issuer and enforce it ────────
    nightly = Nightly(acr, db, paths, out_root)
    nightly.run()
    ov_doc = read(paths["credential_review_overlay.json"])
    hv_e = ov_doc["overrides"][HAC_T]
    check("nightly: the HVAC override reads the fold's winner, the moved July row superseded",
          hv_e["issuing_agency_override"] == CCC and hv_e["issuer_fold"]["set_by_fold"]
          and hv_e["issuer_fold"]["superseded"][0]["by"] == MAP, json.dumps(hv_e)[:400])
    br_e = ov_doc["overrides"][BR_T]
    check("nightly: rule 2b strikes the ASE override the lead moved onto the standards title",
          "issuing_agency_override" not in br_e and br_e["issuer_raw"]["issuing_agency_override"]["value"] == ASE)
    cn = read(paths["credentials.json"])
    check("nightly: credentials.json holds each fold's issuers, unchanged by the enforcement",
          issuers_in(cn, HAC_T) == [CCC] and issuers_in(cn, BR_T) == [CCC], str(issuers_in(cn, HAC_T)))
    nightly.run()
    check("nightly: a second night changes nothing", read(paths["credentials.json"]) == cn)

    # ── undo ─────────────────────────────────────────────────────────────
    with contextlib.redirect_stdout(io.StringIO()):
        undo.main([rdir])  # dry run writes nothing
    check("undo: a dry run writes nothing", read(paths["credentials.json"]) == creds)
    with contextlib.redirect_stdout(io.StringIO()):
        undo.main([rdir, "--apply", "--json-only"])
    check("undo: credentials.json is back", read(paths["credentials.json"]) == CREDS)
    check("undo: unified_titles.json is back", read(paths["unified_titles.json"]) == UT)
    check("undo: coci_articulations.json is back", read(paths["coci_articulations.json"]) == ARTS)
    # Drift: re-apply, then edit a folded title by hand; the undo refuses.
    write(paths["credential_review_overlay.json"], {"_read_at": READ_AT, "overrides": OVERLAY})
    with contextlib.redirect_stdout(io.StringIO()):
        dry.main()
        app.main()
    rdir2 = os.path.join(out_root, sorted(os.listdir(out_root), key=len)[-1])
    check("receipt dir: a second same-day apply writes beside the first", rdir2 != rdir and os.path.isfile(
        os.path.join(rdir2, "undo.json")))
    c = read(paths["credentials.json"])
    c[HAC_T].append(rec("Hand edit"))
    write(paths["credentials.json"], c)
    refused = False
    with contextlib.redirect_stdout(io.StringIO()):
        try:
            undo.main([rdir2, "--apply", "--json-only"])
        except SystemExit as e:
            refused = bool(e.code)
    check("undo: a value changed since the apply refuses the run", refused)
    check("undo: a refused run writes nothing", read(paths["credentials.json"]) == c)
    with contextlib.redirect_stdout(io.StringIO()):
        undo.main([rdir2, "--apply", "--force", "--json-only"])
    c2, u2 = read(paths["credentials.json"]), read(paths["unified_titles.json"])
    check("finding 6: --force skips the drifted fold group whole (no source restored beside its target)",
          "Heating and Air Conditioning" not in c2 and "Automotive Air Conditioner" not in c2
          and u2["HVAC NC"]["unified_title"] == HAC_T, str([k for k in c2 if "Air Cond" in k]))
    check("finding 6: --force still reverses the groups that did not drift",
          "Automotive Technology (ASE A5 Brakes)" in c2 and u2["AUTO 101 Brakes"]["unified_title"]
          == "Automotive Technology (ASE A5 Brakes)")

    # ── finding 7: a same-run lead with no credentials record ────────────
    write(paths["credentials.json"], {"Sib": [rec(CCC)], "Other": [rec(CCC)]})
    write(paths["unified_titles.json"], {"r1": {"unified_title": "Lead"}, "r2": {"unified_title": "Sib"},
                                         "r3": {"unified_title": "Other"}})
    write(paths["coci_articulations.json"], {"articulations": []})
    write(paths["credential_review_overlay.json"], {"overrides": {
        "Lead": ov(unified_title_override=("New Title", SAM, F1)),
        "Sib": ov(unified_title_override=("New Title", SAM, F2), unified_title_merge_confirm=("New Title", SAM, F2)),
        "Other": ov(unified_title_override=("Other Renamed", SAM, F2))}})
    with contextlib.redirect_stdout(io.StringIO()):
        dry.main()
    a7 = read(os.path.join(dry_out, "alias_map.json"))
    q7 = {x["old_unified_title"]: x["reason"] for x in read(os.path.join(dry_out, "collisions.json"))["collisions"]}
    check("finding 7: a sibling whose lead has no credentials record is held, not folded",
          "Sib" not in a7["merges"] and q7.get("Sib") == "lead_has_no_credentials_record", json.dumps(q7))
    pol = next(x["policy"] for x in read(os.path.join(dry_out, "collisions.json"))["collisions"]
               if x["old_unified_title"] == "Sib")
    rep7 = open(os.path.join(dry_out, "report.md"), encoding="utf-8").read()
    check("still_open 2: the dry-run says plainly that the confirmed sibling waits, and why",
          "no credentials.json record" in pol and "Nothing is folded" in pol and "becomes a regular collision" not in pol
          and "Held for a person" in rep7 and "`Sib`" in rep7, pol)
    check("finding 7: the rest of the batch still applies", a7["renames"].get("Other") == "Other Renamed")
    a7["merges"] = {"Sib": "New Title"}  # a stale map that slipped past the dry-run
    write(os.path.join(dry_out, "alias_map.json"), a7)
    before7 = open(paths["credentials.json"], encoding="utf-8").read()
    exited = False
    with contextlib.redirect_stdout(io.StringIO()):
        try:
            app.main()
        except SystemExit:
            exited = True
    check("finding 7: the apply refuses before writing anything",
          exited and open(paths["credentials.json"], encoding="utf-8").read() == before7)

    # ── finding 8: rule 2 does not depend on which source leads ──────────
    outs8 = []
    for lead_recs, sib_recs in (([rec(CCC)], [rec(ASE)]), ([rec(ASE)], [rec(CCC)])):
        cr = {"L": lead_recs, "S": sib_recs}
        pl = fold_issuer.plan({"L": "Brakes (ASE A5)"}, {"S": "Brakes (ASE A5)"}, {}, cr)
        r8 = pl["Brakes (ASE A5)"]["resolution"]
        recs8, _ = fold_issuer.fold_records(r8, lead_recs, [("S", sib_recs)])
        outs8.append(sorted({x["issuing_agency"] for x in recs8}))
    check("finding 8: a cert-form title created in the run ends with ASE whichever source leads",
          outs8 == [[ASE], [ASE]], str(outs8))

    # ── finding 2: a person's override names a record that carries no reviewer ──
    r2 = {"target": "Engine Repair (ASE A1 standards)", "rule": "standards", "drop_body": ASE,
          "target_exists_before": False, "humans": [],
          "older_people": [{"title": "ASE A1 — Engine Repair", "issuer": ASE, "by": MAP, "at": JUL}]}
    _, log2 = fold_issuer.fold_records(r2, [], [("ASE A1 — Engine Repair", [dict(rec(ASE), reviewed_by=None)])])
    check("finding 2: a dropped record is named as person-set from the override's stamp",
          log2["people"] and log2["people"][0]["by"] == MAP and log2["people"][0]["at"] == JUL)

    # ── minor 0 and 2: stamps and receipt folders compare in order ───────
    check("minor 0: stamps with different offsets compare as instants",
          fold_issuer.ts("2026-11-11 15:26:55.029+00") > fold_issuer.ts("2026-11-11T15:26:54Z")
          and fold_issuer.ts("2026-11-11T08:00:00-08:00") > fold_issuer.ts("2026-11-11T15:59:59Z"))
    for n in ("2026-11-11", "2026-11-11-9", "2026-11-11-10"):
        os.makedirs(os.path.join(tmp, "order", n), exist_ok=True)
        write(os.path.join(tmp, "order", n, "alias_map.json"), {})
    sup.OUT_ROOT = os.path.join(tmp, "order")
    check("minor 2: the tenth same-day receipt is the newest", sup._find_latest_snapshot()[0] == "2026-11-11-10")
    sup.OUT_ROOT = out_root

    # ── the overlay stamp ────────────────────────────────────────────────
    entry = {"issuing_agency_override": "X", "reviewed_by": "someone@bot", "reviewed_at": "2026-01-01",
             "field_reviews": {"issuing_agency_override": {"by": SAM, "at": "2026-11-11"}}}
    check("stamp: the per-field reviewer decides, never the entry's latest",
          fold_issuer._stamp(entry, "issuing_agency_override")[1] == SAM)
    check("stamp: an issuer with no row stamp never counts as set with the fold",
          fold_issuer._stamp({"issuing_agency_override": "X", "reviewed_by": SAM,
                              "reviewed_at": "2026-11-11"}, "issuing_agency_override")[2] == "")
    check("spelling: the Chancellor's Office reads as the reference form",
          fold_issuer.canonical_issuer("California Community College Chancellor’s Office") == CCC)
finally:
    shutil.rmtree(tmp, ignore_errors=True)

failed = [r for r in results if not r[1]]
for name, ok, why in results:
    print(("PASS " if ok else "FAIL ") + name + ("" if ok or not why else "  -- " + why))
print(f"{len(results) - len(failed)}/{len(results)} passed")
sys.exit(1 if failed else 0)
