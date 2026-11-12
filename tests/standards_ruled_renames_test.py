#!/usr/bin/env python3
"""The standards folds Sam's ruling A covers, as their own ruled plan (S640; cpl_memory
sam-ic-exhibits-go-to-cert-title-2026-11-11, "A, C as recommended").

The failure modes guarded:
  1. the frozen plan (kb/cred_rename_plans/2026-11-12_standards.json) loads beside Sheet 181's, names the ruling, and
     holds exactly the four folds into Brakes (ASE A5 standards), Heating and Air Conditioning (ASE A7 standards) and
     Engine Performance (ASE A8 standards) whose sources still hold an exhibit; its builder reproduces it from the
     committed files as they stood before the apply;
  2. it names none of the eight titles the ASE plan's restore (-4) put Sam's rows back on, and lists them, and the
     other standards folds ruling A does not name, under left_out;
  3. --only-plan standards-2026-11-12 plans exactly these entries, defers every other rename and merge, keeps the
     college as issuer of the one fold group (rule 2b), and still holds the restored titles as emptied;
  4. --only-plan sheet181-2026-11-12 defers all four, so neither plan's scope reaches the other's;
  5. the apply over copies of the pre-apply files creates the three standards titles with the college as issuer, and
     the kb_curation row move touches no row on a restored title and deletes no person's row but the fulfilled
     rename and merge-confirm rows on the four sources.

No network. Run from the repo root: python3 tests/standards_ruled_renames_test.py
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
import fold_issuer  # noqa: E402
import ruled_renames  # noqa: E402

CHECKS = []


def check(name, cond, why=""):
    CHECKS.append((name, bool(cond), why))


PLAN_ID = "standards-2026-11-12"
A5, A7, A8 = ("Brakes (ASE A5 standards)", "Heating and Air Conditioning (ASE A7 standards)",
              "Engine Performance (ASE A8 standards)")
EXPECT = [("Automotive Technology (ASE A5 Brakes)", A5, "rename"),
          ("Automotive Technology (ASE A7 Heating and Air Conditioning)", A7, "rename"),
          ("Automotive Technology (ASE A8 Engine Performance)", A8, "rename"),
          ("Engine Performance (ASE A8 Engine Performance)", A8, "merge")]
RESTORE = {"Automotive Braking Systems", "Heating and Air Conditioning", "Automotive Air Conditioner",
           "Advanced Electrical and Electronic Systems", "Engine Performance 1 (ASE A8 Engine Performance)",
           "Engine Performance 2 (ASE A8 Engine Performance)",
           "Automotive Electrical/Electronics 1 (ASE A6 Electrical/Electronic Systems)",
           "Automotive Electrical/Electronics 2 (ASE A6 Electrical/Electronic Systems)"}
COLLEGE = "California Community Colleges"
FOLD_ROWS = ("unified_title_override", "unified_title_merge_confirm")

# ── 1. the frozen plan ──────────────────────────────────────────────────────────────────────────────────
plans = ruled_renames.load()
ids = [p["plan_id"] for p in plans]
check("the standards plan loads beside Sheet 181's, each id once",
      ids.count(PLAN_ID) == 1 and ids.count("sheet181-2026-11-12") == 1 and len(ids) == len(set(ids)))
# An apply dispatched with an empty only_plan carries every committed plan, so a plan file lands only on purpose: the
# next ruled plan adds its id here.
check("the committed ruled plans are exactly Sheet 181's and the standards plan",
      sorted(ids) == ["sheet181-2026-11-12", PLAN_ID], ids)
plan = next(p for p in plans if p["plan_id"] == PLAN_ID)
check("the plan names Sam's words, the memory row and who decided",
      '"A, C as recommended"' in plan["ruling"] and "sam-ic-exhibits-go-to-cert-title-2026-11-11" in plan["ruling"]
      and plan["decided_by"].startswith("Sam Lee (in session S638, 2026-11-11)") and plan["decided_at"].startswith("2026-11-11"))
E = plan["entries"]
olds = {e["old"] for e in E}
check("exactly the four folds into the A5, A7 and A8 standards titles", [(e["old"], e["new"], e["kind"]) for e in E] == EXPECT)
check("no entry carries a family: none is a family-tag fold", not any(e.get("family") for e in E))
check("every entry cites Sam's saved fold row as its evidence",
      all(e["evidence"]["unified_title_override"]["by"] == "slee@cccco.edu"
          and e["evidence"]["unified_title_override"]["value"] == e["new"] for e in E))

# ── 2. what it leaves out ───────────────────────────────────────────────────────────────────────────────
left = {x["old"]: x for x in plan["left_out"]}
check("no restored title is an entry's source or target", not (olds | {e["new"] for e in E}) & RESTORE)
check("each restored title with a standards fold is left out as emptied",
      {o for o, x in left.items() if "holds no exhibit" in x["why"]} == RESTORE - {"Advanced Electrical and Electronic Systems"})
check("the standards folds ruling A does not name are left out with that reason",
      {x["new"] for x in left.values() if "names the A5, A7 and A8" in x["why"]} & {A5, A7, A8} == set()
      and len([x for x in left.values() if "names the A5, A7 and A8" in x["why"]]) == 7)
check("each left-out reason says what it says once",
      all(x["why"].count("holds no exhibit") <= 1 for x in plan["left_out"]))

# The builder gates what its reason claims: a source holding an industry-certification exhibit (MAP's IC path) or
# issued by anyone but the college system is left out with that reason and never written as an entry (ruling A).
fx_over = {t: {"unified_title_override": A5, "reviewed_by": "slee@cccco.edu", "reviewed_at": "2026-11-11T15:26:54Z"}
           for t in ("IC source", "ASE source", "College source")}
fx_cr = {"IC source": [{"issuing_agency": COLLEGE}],
         "ASE source": [{"issuing_agency": "National Institute for Automotive Service Excellence (ASE)"}],
         "College source": [{"issuing_agency": COLLEGE}]}
fx_ut = {"r1": {"unified_title": "IC source", "source_exhibit_ids": ["MAPICO-IBS-1-001"]},
         "r2": {"unified_title": "ASE source", "source_exhibit_ids": ["MAPCXS-B3-1-001"]},
         "r3": {"unified_title": "College source", "source_exhibit_ids": ["MAPCBEN-ABS-1-001"]}}
fx = builder.build(fx_over, fx_cr, fx_ut)
fx_left = {x["old"]: x["why"] for x in fx["left_out"]}
check("the builder leaves out a source holding an industry-certification exhibit, naming it",
      "IC source" in fx_left and "industry-certification" in fx_left["IC source"] and "MAPICO-IBS-1-001" in fx_left["IC source"])
check("the builder leaves out a source issued by anyone but the college system, naming the issuer",
      "ASE source" in fx_left and "Automotive Service Excellence" in fx_left["ASE source"])
check("only the college's own exams become an entry",
      [(e["old"], e["new"], e["kind"]) for e in fx["entries"]] == [("College source", A5, "rename")])


# ── the files as they stood before this plan was applied ───────────────────────────────────────────────
tmp = tempfile.mkdtemp()
real = {m: {k: getattr(m, k) for k in dir(m) if k.isupper()} for m in (dry, app, sup, undo)}


def restore():
    for m, d in real.items():
        for k, v in d.items():
            setattr(m, k, v)


PRE_FILES = ("credentials.json", "unified_titles.json", "coci_articulations.json")


def pre_apply(into):
    """Copies of the committed files with every applied rename snapshot that carried an entry of this plan undone over
    them (newest first). Before the apply the copies are the committed files as they are."""
    os.makedirs(into)
    for n in PRE_FILES:
        shutil.copy(os.path.join(KB, n), os.path.join(into, n))
    snaps = []
    for path in sorted(glob.glob(os.path.join(KB, "cred_rename_out", "*", "alias_map.json"))):
        doc = json.load(open(path, encoding="utf-8"))
        if (doc.get("_applied_at") and (set(doc.get("renames") or {}) | set(doc.get("merges") or {})) & olds
                and os.path.isfile(os.path.join(os.path.dirname(path), "undo.json"))):
            snaps.append(os.path.dirname(path))
    undo.CREDENTIALS, undo.UNIFIED_TITLES, undo.ARTICULATIONS = (os.path.join(into, n) for n in PRE_FILES)
    undo.KEY = None
    for k, s in enumerate(reversed(snaps)):
        rc = os.path.join(into, "receipt%d" % k)
        shutil.copytree(s, rc)
        with contextlib.redirect_stdout(io.StringIO()):
            undo.main([rc, "--apply", "--json-only", "--force"])
    restore()
    return {n: os.path.join(into, n) for n in PRE_FILES}


def alias_map(*argv):
    with contextlib.redirect_stdout(io.StringIO()):
        dry.main(list(argv))
    return json.load(open(os.path.join(dry.OUT_DIR, "alias_map.json"), encoding="utf-8"))


try:
    PRE = pre_apply(os.path.join(tmp, "pre"))
    pre_cr = json.load(open(PRE["credentials.json"], encoding="utf-8"))
    pre_ut = json.load(open(PRE["unified_titles.json"], encoding="utf-8"))
    overlay = (json.load(open(dry.OVERLAY, encoding="utf-8")) or {}).get("overrides") or {}
    # The builder reads Sam's saved folds; once the apply's row move has deleted them and the nightly sync has dropped
    # them from the overlay, the plan is frozen and the builder has nothing left to read (as Sheet 181's).
    sam_folds = sum(1 for o in olds for f in FOLD_ROWS if (overlay.get(o) or {}).get(f))
    if all((overlay.get(e["old"]) or {}).get("unified_title_override") == e["new"] for e in E):
        rebuilt = builder.build(overlay, pre_cr, pre_ut)
        check("the builder reproduces the committed plan from the pre-apply files",
              rebuilt["entries"] == E and rebuilt["left_out"] == plan["left_out"] and rebuilt["plan_id"] == PLAN_ID)

    # ── 3. the scoped dry run ───────────────────────────────────────────────────────────────────────────
    dry.CREDENTIALS, dry.UNIFIED_TITLES, dry.ARTICULATIONS = (PRE[n] for n in PRE_FILES)
    dry.OUT_DIR = os.path.join(tmp, "dry")
    am = alias_map("--only-plan", PLAN_ID)
    moved = dict(am["renames"], **am["merges"])
    check("--only-plan plans exactly the four entries, apply-safe, none held",
          moved == {e["old"]: e["new"] for e in E} and set(am["renames"]) == {e["old"] for e in E if e["kind"] == "rename"}
          and am["summary"]["apply_safe"] is True and not am["ruled"]["held"] and am["only_plan"] == PLAN_ID)
    check("every other rename and merge is deferred, none of the four", am["deferred"] and not {d["old"] for d in am["deferred"]} & olds)
    ip = am["issuer_preview"]
    check("the one fold group keeps the college as issuer (rule 2b), no conflict, no exception",
          set(ip) == {A8} and ip[A8]["rule"] == "standards" and ip[A8]["conflict"] is None and not ip[A8]["exceptions"])
    check("the restored titles' folds stay held as emptied and are planned nowhere",
          {h["old"] for h in am["held_emptied"]} >= RESTORE and not RESTORE & set(moved))

    # ── 4. Sheet 181's scope never reaches these ────────────────────────────────────────────────────────
    sm = alias_map("--only-plan", "sheet181-2026-11-12")
    check("--only-plan sheet181-2026-11-12 defers all four",
          olds <= {d["old"] for d in sm["deferred"]} and not olds & (set(sm["renames"]) | set(sm["merges"])))

    # ── 5. the apply over copies, and the row move ──────────────────────────────────────────────────────
    work = os.path.join(tmp, "kb")
    os.makedirs(work)
    for n in PRE_FILES + ("credential_review_overlay.json", "exhibits_related.json"):
        shutil.copy(PRE.get(n) or os.path.join(KB, n), os.path.join(work, n))
    W = {n: os.path.join(work, n) for n in os.listdir(work)}
    for m in (dry, app):
        m.CREDENTIALS, m.UNIFIED_TITLES, m.ARTICULATIONS = (W[n] for n in PRE_FILES)
    dry.OVERLAY = app.OVERLAY = W["credential_review_overlay.json"]
    dry.RELATED = app.RELATED = W["exhibits_related.json"]
    dry.OUT_DIR = app.DRYRUN_OUT = os.path.join(work, "dry")
    app.ALIAS_PATH = os.path.join(work, "dry", "alias_map.json")
    app.OUT_ROOT = sup.OUT_ROOT = os.path.join(work, "out")
    with contextlib.redirect_stdout(io.StringIO()):
        dry.main(["--only-plan", PLAN_ID])
        rdir = app.main()
    cr = json.load(open(W["credentials.json"], encoding="utf-8"))
    check("the three standards titles exist and the four sources are gone", {A5, A7, A8} <= set(cr) and not olds & set(cr))
    check("each standards title keeps the college as its one issuer",
          all([r.get("issuing_agency") for r in cr[t]] == [COLLEGE] for t in (A5, A7, A8)))
    check("no restored title's record changed", all(cr.get(t) == pre_cr.get(t) for t in RESTORE))
    snap = json.load(open(os.path.join(rdir, "alias_map.json"), encoding="utf-8"))
    check("the apply's snapshot holds exactly the four", dict(snap["renames"], **snap["merges"]) == {e["old"]: e["new"] for e in E})

    # ── 6. the kb_curation row move and its undo, on rows shaped like the live ones ─────────────────────────
    # Sam's seven fold rows (from the plan's evidence, so this holds after the apply's sync drops them) and the
    # subject fill's bot rows on three of the four sources (exhibit-subject-s638@bot); nothing on the three targets
    # (the conductor's live read, 04:41Z 2026-11-12).
    BOT = "exhibit-subject-s638@bot"
    live = {}
    for e in E:
        for f in FOLD_ROWS:
            ev = e["evidence"].get(f)
            if ev:
                live[(sup.KEY_PREFIX + e["old"], f)] = {"value": ev["value"], "reviewer_email": ev["by"],
                                                        "reviewed_at": ev["at"], "validated_at": None,
                                                        "validated_by": None}
    for o, subj in ((EXPECT[1][0], "AUTO"), (EXPECT[2][0], "AUTO"), (EXPECT[3][0], "AUTO")):
        for f, v in (("subj_override", subj), ("subj_source", "courses at one college")):
            live[(sup.KEY_PREFIX + o, f)] = {"value": v, "reviewer_email": BOT, "reviewed_at": "2026-11-11T21:41:27+00:00",
                                             "validated_at": None, "validated_by": None}
    start = {k: dict(v) for k, v in live.items()}
    check("the live-shaped store holds thirteen rows: Sam's seven and six bot subject rows",
          len(start) == 13 and sum(v["reviewer_email"] == "slee@cccco.edu" for v in start.values()) == 7)

    def match(q):
        cond = {k: (None if v == "is.null" else v[3:]) for k, v in q.items() if k != "select"}
        return [k for k, v in live.items()
                if all((k[0] if c == "course_id" else k[1] if c == "field" else v.get(c)) == want
                       for c, want in cond.items())]

    def fake_rest(method, path, body=None, prefer=""):
        q = {k: v[0] for k, v in urllib.parse.parse_qs(path.partition("?")[2]).items()}
        keys = match(q)
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

    def fetch():
        out = {}
        for (cid, f), v in live.items():
            out.setdefault(cid, []).append(dict(v, course_id=cid, field=f))
        return out

    def delete(cid, field):
        n = len(fake_rest("DELETE", "kb_curation?" + urllib.parse.urlencode({"course_id": "eq." + cid, "field": "eq." + field})))
        return {"course_id": cid, "field": field, "op": "delete", "status": "ok", "rows_affected": n}

    def patch(old, new, field):
        try:
            n = len(fake_rest("PATCH", "kb_curation?" + urllib.parse.urlencode({"course_id": "eq." + old, "field": "eq." + field}),
                              {"course_id": new}))
        except Exception as e:
            return {"op": "patch", "status": "fail", "error": str(e)}
        return {"old_course_id": old, "new_course_id": new, "field": field, "op": "patch", "status": "ok", "rows_affected": n}

    sup.KEY, sup.fetch_credential_review_rows, sup.delete_row, sup.patch_row = "test", fetch, delete, patch
    with contextlib.redirect_stdout(io.StringIO()):
        try:
            sup.main()
            moved_ok = True
        except SystemExit as e:
            moved_ok = not e.code
    check("the row move finishes with every op landed", moved_ok)
    log = json.load(open(os.path.join(rdir, "supabase_log.json"), encoding="utf-8"))
    L = {(x.get("course_id") or x.get("old_course_id"), x.get("field")): x for x in log["log"]}
    K = sup.KEY_PREFIX
    check("the A7 and the A8 lead's subject rows move to their standards titles",
          all(L[(K + o, f)]["op"] == "patch" and L[(K + o, f)]["new_course_id"] == K + n
              for o, n in ((EXPECT[1][0], A7), (EXPECT[2][0], A8)) for f in ("subj_override", "subj_source"))
          and all((K + n, f) in live for n in (A7, A8) for f in ("subj_override", "subj_source")))
    check("the A8 merge source's subject rows fan in as supersede-deletes, never patched over the lead's",
          all(L[(K + EXPECT[3][0], f)]["op"] == "delete" and L[(K + EXPECT[3][0], f)].get("superseded_by_target")
              for f in ("subj_override", "subj_source"))
          and live[(K + A8, "subj_override")]["reviewed_at"] == start[(K + EXPECT[2][0], "subj_override")]["reviewed_at"])
    check("Sam's seven fold rows are deleted as fulfilled, and nothing else of a person's is touched",
          sorted(k for k, x in L.items() if x["op"] == "delete" and x["before_row"]["reviewer_email"] == "slee@cccco.edu")
          == sorted(k for k, v in start.items() if v["reviewer_email"] == "slee@cccco.edu")
          and not any(k[0] == K + o for k in live for o in olds))
    ops_u, cannot = undo.supabase_ops(undo._logs(rdir, "supabase_log"))
    real_rest, undo.rest = undo.rest, fake_rest
    try:
        ran = undo.run_supabase(ops_u)
    finally:
        undo.rest = real_rest
    check("the undo runs every op and leaves none it cannot reverse",
          not cannot and len(ops_u) == 13 and all(r["status"] == "ok" for r in ran), [r for r in ran if r["status"] != "ok"][:2])
    check("the undo puts all thirteen rows back, each with its own reviewer and stamp, and nothing on the targets",
          live == start, sorted(set(live) ^ set(start))[:3])
    restore()

    rows = {}
    for t in olds | RESTORE | {A5, A7, A8}:
        e = overlay.get(t) or {}
        for f, v in e.items():
            if f in ("field_reviews", "reviewed_by", "reviewed_at", "ruled") or not isinstance(v, str):
                continue
            st = (e.get("field_reviews") or {}).get(f) or {}
            cid = sup.KEY_PREFIX + t
            rows.setdefault(cid, []).append({"course_id": cid, "field": f, "value": v,
                                             "reviewer_email": st.get("by") or e.get("reviewed_by"),
                                             "reviewed_at": st.get("at") or e.get("reviewed_at")})
    ops = sup.plan_moves(snap["renames"], snap["merges"], rows, fold_issuer.family_titles(dry.FAMILIES))
    touched = {o.get("course_id") or o.get("old_course_id") for o in ops if o.get("op") != "skip"}
    check("the row move touches no row on a restored title", not touched & {sup.KEY_PREFIX + t for t in RESTORE})
    person_deletes = [o for o in ops if o.get("op") == "delete"
                      and not str((o.get("before_row") or {}).get("reviewer_email") or "").endswith("@bot")]
    check("a person's row is deleted only as a fulfilled rename or merge confirm on one of the four sources",
          all(o["field"] in FOLD_ROWS and o["course_id"][len(sup.KEY_PREFIX):] in olds for o in person_deletes)
          and len(person_deletes) == sam_folds, [(o["course_id"], o["field"]) for o in person_deletes])
finally:
    restore()
    shutil.rmtree(tmp, ignore_errors=True)

failed = [(n, w) for n, ok, w in CHECKS if not ok]
for n, ok, w in CHECKS:
    print(("PASS  " if ok else "FAIL  ") + n + ("" if ok or not w else "  (%s)" % (w,)))
print(f"\n{len(CHECKS) - len(failed)}/{len(CHECKS)} passed")
sys.exit(1 if failed else 0)
