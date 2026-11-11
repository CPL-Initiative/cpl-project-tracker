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
    write(paths["credential_review_overlay.json"], {"overrides": OVERLAY})
    write(paths["exhibits_related.json"], RELATED)
    dry_out = os.path.join(tmp, "cred_rename_dryrun")
    out_root = os.path.join(tmp, "cred_rename_out")
    for mod in (dry, app, undo):
        mod.CREDENTIALS = paths["credentials.json"]
        mod.UNIFIED_TITLES = paths["unified_titles.json"]
        mod.ARTICULATIONS = paths["coci_articulations.json"]
    dry.OVERLAY = app.OVERLAY = paths["credential_review_overlay.json"]
    dry.RELATED = app.RELATED = paths["exhibits_related.json"]
    dry.OUT_DIR = app.DRYRUN_OUT = dry_out
    app.ALIAS_PATH = os.path.join(dry_out, "alias_map.json")
    app.OUT_ROOT = out_root

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

    # ── the Supabase carry, against a fake PostgREST ─────────────────────
    calls = []

    def fake_fetch():
        def rows(t, **f):
            return [{"course_id": "_CREDENTIAL_REVIEW::" + t, "field": k, "value": v,
                     "reviewer_email": by, "reviewed_at": at} for k, (v, by, at) in f.items()]
        out = {}
        for r in (rows("Automotive Air Conditioner",
                       issuing_agency_override=(ASE, MAP, "2026-07-09T00:07:08Z"),
                       unified_title_override=(HAC_T, SAM, "2026-11-11T15:26:54Z"))
                  + rows("Heating and Air Conditioning",
                         issuing_agency_override=("California Community College Chancellor's Office", SAM,
                                                  "2026-11-11T15:47:58Z"),
                         unified_title_override=(HAC_T, SAM, "2026-11-11T15:26:55Z"),
                         unified_title_merge_confirm=(HAC_T, SAM, "2026-11-11T15:26:55Z"))
                  + rows("Automotive Braking Systems", issuing_agency_override=(ASE, MAP, JUL),
                         unified_title_override=(BR_T, SAM, F1))):
            out.setdefault(r["course_id"], []).append(r)
        return out

    def fake_delete(cid, field):
        calls.append(("delete", cid, field))
        return {"course_id": cid, "field": field, "op": "delete", "status": "ok", "rows_affected": 1}

    def fake_patch(old, new, field):
        calls.append(("patch", old, new, field))
        return {"old_course_id": old, "new_course_id": new, "field": field, "op": "patch",
                "status": "ok", "rows_affected": 1}

    def fake_set(cid, value, by, at, exists):
        calls.append(("issuer", cid, value, by, exists))
        return {"course_id": cid, "field": "issuing_agency_override",
                "op": "issuer_update" if exists else "issuer_insert", "status": "ok", "rows_affected": 1,
                "after_row": {"value": value, "reviewer_email": by, "reviewed_at": at}}

    sup.KEY, sup.OUT_ROOT = "test", out_root
    sup.fetch_credential_review_rows, sup.delete_row, sup.patch_row, sup.set_issuer = (
        fake_fetch, fake_delete, fake_patch, fake_set)
    with contextlib.redirect_stdout(io.StringIO()):
        try:
            sup.main()
        except SystemExit:
            pass
    tgt = "_CREDENTIAL_REVIEW::" + HAC_T
    check("carry: the lead's ASE override moves to the new title",
          ("patch", "_CREDENTIAL_REVIEW::Automotive Air Conditioner", tgt, "issuing_agency_override") in calls)
    check("carry: the target's override is set to Sam's issuer under his stamp",
          ("issuer", tgt, CCC, SAM, True) in calls, str([c for c in calls if c[0] == "issuer"]))
    slog = read(os.path.join(rdir, "supabase_log.json"))
    iss = [e for e in slog["log"] if e.get("kind") == "issuer" and e.get("op") == "issuer_update"]
    check("carry: the log keeps the before-row of the override it replaced",
          iss and iss[0]["before_row"]["value"] == ASE and iss[0]["before_row"]["reviewer_email"] == MAP)
    dropped = [e for e in slog["log"] if e.get("kind") == "issuer" and e.get("dropped_by_rule") == "standards"]
    check("carry: rule 2b deletes the ASE override the lead moved onto the standards title, logged",
          dropped and dropped[0]["course_id"] == "_CREDENTIAL_REVIEW::" + BR_T
          and dropped[0]["before_row"]["reviewer_email"] == MAP)
    sql, cannot = undo.supabase_plan(slog)
    check("undo plan: the override rule 2b deleted comes back under its person's stamp",
          "values ('_CREDENTIAL_REVIEW::%s', 'issuing_agency_override', '%s', '%s'" % (BR_T, ASE, MAP) in sql)
    check("undo plan: the issuer update goes back to ASE", "set value = '%s'" % ASE.replace("'", "''") in sql)
    check("undo plan: a deleted row comes back insert-only",
          "insert into kb_curation" in sql and "on conflict do nothing" in sql)
    check("undo plan: a moved row moves back",
          "set course_id = '_CREDENTIAL_REVIEW::Automotive Air Conditioner'" in sql)
    check("undo plan: every op this log holds is reversible", not cannot)

    # ── undo ─────────────────────────────────────────────────────────────
    with contextlib.redirect_stdout(io.StringIO()):
        undo.main([rdir])  # dry run writes nothing
    check("undo: a dry run writes nothing", read(paths["credentials.json"]) == creds)
    with contextlib.redirect_stdout(io.StringIO()):
        undo.main([rdir, "--apply"])
    check("undo: credentials.json is back", read(paths["credentials.json"]) == CREDS)
    check("undo: unified_titles.json is back", read(paths["unified_titles.json"]) == UT)
    check("undo: coci_articulations.json is back", read(paths["coci_articulations.json"]) == ARTS)
    # Drift: re-apply, then edit a folded title by hand; the undo refuses.
    write(paths["credential_review_overlay.json"], {"overrides": OVERLAY})
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
            undo.main([rdir2, "--apply"])
        except SystemExit as e:
            refused = bool(e.code)
    check("undo: a value changed since the apply refuses the run", refused)
    check("undo: a refused run writes nothing", read(paths["credentials.json"]) == c)

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
