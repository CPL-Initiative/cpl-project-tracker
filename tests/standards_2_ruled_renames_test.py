#!/usr/bin/env python3
"""Sam's seven other saved standards folds, as the second standards plan (S640; his rename-batch saves of 2026-11-11
15:26:54Z, read under ruling A's principle, cpl_memory sam-ic-exhibits-go-to-cert-title-2026-11-11).

The failure modes guarded:
  1. the frozen plan (kb/cred_rename_plans/2026-11-12_standards_2.json) loads beside the other two, names the ruling,
     and holds exactly seven renames, each Sam's override alone; each entry says where every exhibit's CPL type comes
     from, and a "Noncredit for AUTO" exhibit says its type is read from the title; the one builder reproduces it, and
     still writes plan 1 as committed;
  2. the builder's gate: an industry-certification exhibit (from either id source) or a non-college issuer leaves a
     source out; so does an exhibit whose type no committed file shows;
  3. on a tree where plan 1 is applied, --only-plan standards-2-2026-11-12 plans exactly the seven, defers the rest,
     plans no fold group (so no issuer decision), and still holds the eight restored titles as emptied;
  4. the apply over copies creates the seven standards titles with the college as issuer;
  5. the kb_curation row move on rows shaped like the live ones (Sam's seven overrides and the subject fill's bot rows
     where kb/exhibit_subject_out/saved/ shows it wrote them) deletes only Sam's fulfilled overrides, moves the bot
     rows to the new titles, and the undo puts every row back with reviewer and stamp.

No network. Run from the repo root: python3 tests/standards_2_ruled_renames_test.py
"""
import contextlib
import glob
import io
import json
import os
import shutil
import sys
import tempfile
import urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KB = os.path.join(ROOT, "kb")
sys.path.insert(0, KB)
import _build_standards_rename_plan as builder  # noqa: E402
import _cred_rename_apply as app  # noqa: E402
import _cred_rename_apply_supabase as sup  # noqa: E402
import _cred_rename_dryrun as dry  # noqa: E402
import _cred_rename_undo as undo  # noqa: E402
import ruled_renames  # noqa: E402

CHECKS = []


def check(name, cond, why=""):
    CHECKS.append((name, bool(cond), why))


PLAN_ID, PLAN1 = "standards-2-2026-11-12", "standards-2026-11-12"
SAM = "slee@cccco.edu"
COLLEGE = "California Community Colleges"
EXPECT = [
    ("Automotive Technology (ASE L1 Advanced Engine Performance Specialist)",
     "Advanced Engine Performance Specialist (ASE L1 standards)"),
    ("Automotive Technology (ASE A2 Automatic Transmission/Transaxle)", "Automatic Transmission/Transaxle (ASE A2 standards)"),
    ("Automotive Technology (ASE A6 Electrical/Electronic Systems)", "Electrical/Electronic Systems (ASE A6 standards)"),
    ("Automotive Technology (ASE L3 Light Duty Hybrid/Electric Vehicle Specialist)",
     "Light Duty Hybrid/Electric Vehicle Specialist (ASE L3 standards)"),
    ("Automotive Technology (ASE A9 Light Vehicle Diesel Engines)", "Light Vehicle Diesel Engines (ASE A9 standards)"),
    ("Manual Drive Train and Axles (ASE A3 Manual Drive Train and Axles)", "Manual Drive Train and Axles (ASE A3 standards)"),
    ("Suspension and Steering (ASE A4 Suspension and Steering)", "Suspension and Steering (ASE A4 standards)")]
RESTORE = {"Automotive Braking Systems", "Heating and Air Conditioning", "Automotive Air Conditioner",
           "Advanced Electrical and Electronic Systems", "Engine Performance 1 (ASE A8 Engine Performance)",
           "Engine Performance 2 (ASE A8 Engine Performance)",
           "Automotive Electrical/Electronics 1 (ASE A6 Electrical/Electronic Systems)",
           "Automotive Electrical/Electronics 2 (ASE A6 Electrical/Electronic Systems)"}
NEWS = {n for _, n in EXPECT}

# ── 1. the frozen plan ──────────────────────────────────────────────────────────────────────────────────
plans = ruled_renames.load()
ids = [p["plan_id"] for p in plans]
check("the committed ruled plans are exactly Sheet 181's and the two standards plans",
      sorted(ids) == sorted(["sheet181-2026-11-12", PLAN1, PLAN_ID]), ids)
plan = next(p for p in plans if p["plan_id"] == PLAN_ID)
plan1 = next(p for p in plans if p["plan_id"] == PLAN1)
check("the plan names Sam's saves, ruling A's principle and its memory row, and who carried it out",
      "15:26:54Z in the rename batch" in plan["ruling"] and "sam-ic-exhibits-go-to-cert-title-2026-11-11" in plan["ruling"]
      and plan["decided_by"] == ("Sam Lee's saved folds (rename batch, 2026-11-11); scoped and carried out by the "
                                 "Session 640 conductor") and plan["decided_at"] == "2026-11-11T15:26:54Z")
E = plan["entries"]
olds = {e["old"] for e in E}
check("exactly the seven renames, in the plan's target order", [(e["old"], e["new"], e["kind"]) for e in E]
      == [(o, n, "rename") for o, n in EXPECT])
check("each entry is Sam's own override alone: no merge confirm, no family",
      all(e["evidence"]["unified_title_override"]["by"] == SAM and "unified_title_merge_confirm" not in e["evidence"]
          and not e.get("family") for e in E))
types = [t for e in E for t in e["evidence"]["exhibit_types"]]
check("every exhibit of every entry has a CPL type and says where it was read",
      types and all(t["type"] and t["from"] for t in types)
      and all(len(e["evidence"]["exhibit_types"]) >= len(e["evidence"]["exhibits"]) for e in E))
check("each 'Noncredit for AUTO' exhibit is typed from its title, saying no committed file carries its MAP id",
      all(t["type"] == "noncredit" and t["id"] is None and t["from"] == builder.NONCREDIT_FROM_TITLE
          for t in types if t["exhibit"].startswith("Noncredit for AUTO"))
      and sum(t["exhibit"].startswith("Noncredit for AUTO") for t in types) == 7)
check("the other exhibits are typed from their MAP ids, all credit by exam",
      {(t["id"], t["type"]) for t in types if t["id"]} == {("MAPCXH-A2-1-001", "credit by exam"),
                                                          ("MAPCXH-SHSA-1-001", "credit by exam"),
                                                          ("MAPCBEN-SAS-1-001", "credit by exam"),
                                                          ("MAPCXS-SASS-1-001", "credit by exam")})
check("no industry-certification exhibit and no issuer but the college system",
      not any(t["type"] == "industry certification" for t in types)
      and all(e["evidence"]["issuer"] == [COLLEGE] for e in E))
check("the plan touches none of the eight restored titles and none of plan 1's",
      not (olds | NEWS) & RESTORE and not olds & {e["old"] for e in plan1["entries"]})

# ── 2. the builder's gate ───────────────────────────────────────────────────────────────────────────────
L1 = EXPECT[0][1]
fx_over = {t: {"unified_title_override": L1, "reviewed_by": SAM, "reviewed_at": "2026-11-11T15:26:54Z"}
           for t in ("IC by adoption", "Unknown type", "ASE issued", "College noncredit")}
fx_cr = {t: [{"issuing_agency": COLLEGE}] for t in fx_over}
fx_cr["ASE issued"] = [{"issuing_agency": "National Institute for Automotive Service Excellence (ASE)"}]
fx_ut = {"IC raw": {"unified_title": "IC by adoption"}, "Some exam": {"unified_title": "Unknown type"},
         "Noncredit for AUTO X": {"unified_title": "ASE issued"}, "Noncredit for AUTO L1": {"unified_title": "College noncredit"}}
fx_ad = {"credentials": {"IC by adoption": {"x": [["MAPICI-XYZ-1-001", "IC raw", 1.0]]}}}
fx = builder.build(fx_over, fx_cr, fx_ut, builder.PLANS["standards-2"], fx_ad)
fl = {x["old"]: x["why"] for x in fx["left_out"]}
check("an industry-certification id from kb/exhibits_adoption.json leaves the source out, naming it",
      "MAPICI-XYZ-1-001" in fl.get("IC by adoption", ""))
check("an exhibit whose type no committed file shows leaves the source out", "Some exam" in fl.get("Unknown type", ""))
check("a non-college issuer leaves the source out", "Automotive Service Excellence" in fl.get("ASE issued", ""))
check("only the college's noncredit source is an entry",
      [(e["old"], e["kind"]) for e in fx["entries"]] == [("College noncredit", "rename")])

# ── the files before plan 2, with plan 1 applied ─────────────────────────────────────────────────────────
tmp = tempfile.mkdtemp()
real = {m: {k: getattr(m, k) for k in dir(m) if k.isupper()} for m in (dry, app, sup, undo)}


def restore():
    for m, d in real.items():
        for k, v in d.items():
            setattr(m, k, v)


PRE_FILES = ("credentials.json", "unified_titles.json", "coci_articulations.json")


def quiet(fn, *a):
    with contextlib.redirect_stdout(io.StringIO()):
        return fn(*a)


try:
    work = os.path.join(tmp, "kb")
    os.makedirs(work)
    for n in PRE_FILES + ("credential_review_overlay.json", "exhibits_related.json"):
        shutil.copy(os.path.join(KB, n), os.path.join(work, n))
    W = {n: os.path.join(work, n) for n in os.listdir(work)}
    # Undo any applied snapshot that carried an entry of either standards plan, so the copies stand before both
    # whatever main holds; plan 1's file half is then applied below, as the dispatch order has it.
    std_olds = olds | {e["old"] for e in plan1["entries"]}
    snaps = [os.path.dirname(p) for p in sorted(glob.glob(os.path.join(KB, "cred_rename_out", "*", "alias_map.json")))
             if (lambda d: d.get("_applied_at") and (set(d.get("renames") or {}) | set(d.get("merges") or {})) & std_olds)(
                 json.load(open(p, encoding="utf-8"))) and os.path.isfile(os.path.join(os.path.dirname(p), "undo.json"))]
    undo.CREDENTIALS, undo.UNIFIED_TITLES, undo.ARTICULATIONS = (W[n] for n in PRE_FILES)
    undo.KEY = None
    for k, s in enumerate(reversed(snaps)):
        rc = os.path.join(tmp, "receipt%d" % k)
        shutil.copytree(s, rc)
        quiet(undo.main, [rc, "--apply", "--json-only", "--force"])
    restore()
    for m in (dry, app):
        m.CREDENTIALS, m.UNIFIED_TITLES, m.ARTICULATIONS = (W[n] for n in PRE_FILES)
    dry.OVERLAY = app.OVERLAY = W["credential_review_overlay.json"]
    dry.RELATED = app.RELATED = W["exhibits_related.json"]
    dry.OUT_DIR = app.DRYRUN_OUT = os.path.join(work, "dry")
    app.ALIAS_PATH = os.path.join(work, "dry", "alias_map.json")
    app.OUT_ROOT = sup.OUT_ROOT = os.path.join(work, "out")
    overlay = (json.load(open(W["credential_review_overlay.json"], encoding="utf-8")) or {}).get("overrides") or {}
    pre_cr = json.load(open(W["credentials.json"], encoding="utf-8"))
    pre_ut = json.load(open(W["unified_titles.json"], encoding="utf-8"))
    adoption = json.load(open(os.path.join(KB, "exhibits_adoption.json"), encoding="utf-8"))
    # The builder reads Sam's saved folds; once the apply's row moves delete them and the sync drops them, the plan is
    # frozen and the builder has nothing left to read.
    if all((overlay.get(o) or {}).get("unified_title_override") == n for o, n in EXPECT):
        rebuilt = builder.build(overlay, pre_cr, pre_ut, builder.PLANS["standards-2"], adoption)
        check("the builder reproduces the committed plan's entries from the pre-apply files", rebuilt["entries"] == E)
        if all((overlay.get(x["old"]) or {}).get("unified_title_override") == x["new"] for x in plan["left_out"]):
            check("and its left-out list", rebuilt["left_out"] == plan["left_out"])
    if all((overlay.get(e["old"]) or {}).get("unified_title_override") == e["new"] for e in plan1["entries"]):
        check("the one builder still writes plan 1 as committed",
              builder.build(overlay, pre_cr, pre_ut, builder.PLANS["standards"], adoption) == plan1)

    # Plan 1's file half first, when it has not landed in these files.
    if {e["old"] for e in plan1["entries"]} & set(pre_cr):
        quiet(dry.main, ["--only-plan", PLAN1])
        quiet(app.main)
    after1 = json.load(open(W["credentials.json"], encoding="utf-8"))
    check("plan 1 is applied on the tree plan 2 runs over",
          not {e["old"] for e in plan1["entries"]} & set(after1) and {e["new"] for e in plan1["entries"]} <= set(after1))

    # ── 3. the scoped dry run ───────────────────────────────────────────────────────────────────────────
    quiet(dry.main, ["--only-plan", PLAN_ID])
    am = json.load(open(os.path.join(work, "dry", "alias_map.json"), encoding="utf-8"))
    check("--only-plan plans exactly the seven renames, apply-safe, none held",
          am["renames"] == dict(EXPECT) and not am["merges"] and am["summary"]["apply_safe"] is True
          and not am["ruled"]["held"] and am["only_plan"] == PLAN_ID)
    check("every other rename and merge waits, none of the seven", not {d["old"] for d in am["deferred"]} & olds)
    check("no fold group, so no issuer decision", am["issuer_preview"] == {})
    check("the eight restored titles stay held as emptied, planned nowhere",
          {h["old"] for h in am["held_emptied"]} >= RESTORE and not RESTORE & set(am["renames"]))

    # ── 4. the apply over copies ────────────────────────────────────────────────────────────────────────
    rdir = quiet(app.main)
    cr = json.load(open(W["credentials.json"], encoding="utf-8"))
    check("the seven standards titles exist with the college as their one issuer, the sources gone",
          NEWS <= set(cr) and not olds & set(cr) and all([r.get("issuing_agency") for r in cr[n]] == [COLLEGE] for n in NEWS))
    check("no restored title's record changed", all(cr.get(t) == pre_cr.get(t) for t in RESTORE))
    snap = json.load(open(os.path.join(rdir, "alias_map.json"), encoding="utf-8"))
    check("the apply's snapshot holds exactly the seven", snap["renames"] == dict(EXPECT) and not snap["merges"])

    # ── 5. the row move and its undo on live-shaped rows ────────────────────────────────────────────────
    BOT = "exhibit-subject-s638@bot"
    filled = {}
    for path in sorted(glob.glob(os.path.join(KB, "exhibit_subject_out", "saved", "*.json"))):
        doc = json.load(open(path, encoding="utf-8"))
        for r in doc.get("rows") or []:
            t = str(r.get("course_id", "")).split("::", 1)[-1]
            if t in olds and r.get("reviewer_email") == BOT:
                filled[(sup.KEY_PREFIX + t, r["field"])] = {"value": r["value"], "reviewer_email": BOT,
                                                            "reviewed_at": "2026-11-11T21:41:27+00:00",
                                                            "validated_at": None, "validated_by": None}
    live = {(sup.KEY_PREFIX + e["old"], "unified_title_override"): {
        "value": e["new"], "reviewer_email": SAM, "reviewed_at": e["evidence"]["unified_title_override"]["at"],
        "validated_at": None, "validated_by": None} for e in E}
    live.update(filled)
    start = {k: dict(v) for k, v in live.items()}
    with_subj = sorted({k[0][len(sup.KEY_PREFIX):] for k in filled})
    check("the subject fill wrote rows on six of the seven sources (every one but A4)",
          with_subj == sorted(o for o, _ in EXPECT if "A4" not in o) and len(filled) == 12, with_subj)

    def match(q):
        cond = {k: (None if v == "is.null" else v[3:]) for k, v in q.items() if k != "select"}
        return [k for k, v in live.items() if all((k[0] if c == "course_id" else k[1] if c == "field" else v.get(c)) == w
                                                  for c, w in cond.items())]

    def fake_rest(method, path, body=None, prefer=""):
        keys = match({k: v[0] for k, v in urllib.parse.parse_qs(path.partition("?")[2]).items()})
        if method == "GET":
            return [dict(live[k], course_id=k[0], field=k[1]) for k in keys]
        if method == "DELETE":
            return [dict(live.pop(k), course_id=k[0], field=k[1]) for k in keys]
        if method == "PATCH":
            out = []
            for k in keys:
                nk = (body.get("course_id", k[0]), k[1])
                if nk != k and nk in live:
                    raise Exception("HTTP Error 409: Conflict")
                live[nk] = live.pop(k)
                out.append(dict(live[nk], course_id=nk[0], field=nk[1]))
            return out
        k = (body["course_id"], body["field"])
        if k in live:
            return []
        live[k] = {c: body.get(c) for c in ("value", "reviewer_email", "reviewed_at", "validated_at", "validated_by")}
        return [dict(live[k], course_id=k[0], field=k[1])]

    def qs(**eq):
        return urllib.parse.urlencode({k: "eq." + v for k, v in eq.items()})

    def fetch():
        out = {}
        for (cid, f), v in live.items():
            out.setdefault(cid, []).append(dict(v, course_id=cid, field=f))
        return out

    def delete(cid, field):
        n = len(fake_rest("DELETE", "kb_curation?" + qs(course_id=cid, field=field)))
        return {"course_id": cid, "field": field, "op": "delete", "status": "ok", "rows_affected": n}

    def patch(old, new, field):
        try:
            n = len(fake_rest("PATCH", "kb_curation?" + qs(course_id=old, field=field), {"course_id": new}))
        except Exception as e:
            return {"op": "patch", "status": "fail", "error": str(e)}
        return {"old_course_id": old, "new_course_id": new, "field": field, "op": "patch", "status": "ok", "rows_affected": n}

    sup.KEY, sup.fetch_credential_review_rows, sup.delete_row, sup.patch_row = "test", fetch, delete, patch
    try:
        quiet(sup.main)
        moved_ok = True
    except SystemExit as e:
        moved_ok = not e.code
    check("the row move finishes with every op landed", moved_ok)
    log = json.load(open(os.path.join(rdir, "supabase_log.json"), encoding="utf-8"))["log"]
    by_op = {}
    for x in log:
        by_op.setdefault(x["op"], []).append(x)
    K = sup.KEY_PREFIX
    check("Sam's seven overrides are deleted as fulfilled, and no other row of a person's is touched",
          sorted((x["course_id"], x["field"]) for x in by_op.get("delete", []))
          == sorted(k for k, v in start.items() if v["reviewer_email"] == SAM))
    check("the twelve bot subject rows move to the new titles, unchanged",
          len(by_op.get("patch", [])) == 12
          and all(live.get((K + dict(EXPECT)[k[0][len(K):]], k[1])) == v for k, v in filled.items()))
    ops_u, cannot = undo.supabase_ops(undo._logs(rdir, "supabase_log"))
    real_rest, undo.rest = undo.rest, fake_rest
    try:
        ran = undo.run_supabase(ops_u)
    finally:
        undo.rest = real_rest
    check("the undo runs all nineteen ops and leaves none it cannot reverse",
          not cannot and len(ops_u) == 19 and all(r["status"] == "ok" for r in ran), [r for r in ran if r["status"] != "ok"][:2])
    check("the undo puts every row back with its own reviewer and stamp, and nothing on the targets", live == start,
          sorted(set(live) ^ set(start))[:3])
finally:
    restore()
    shutil.rmtree(tmp, ignore_errors=True)

failed = [(n, w) for n, ok, w in CHECKS if not ok]
for n, ok, w in CHECKS:
    print(("PASS  " if ok else "FAIL  ") + n + ("" if ok or not w else "  (%s)" % (w,)))
print(f"\n{len(CHECKS) - len(failed)}/{len(CHECKS)} passed")
sys.exit(1 if failed else 0)
