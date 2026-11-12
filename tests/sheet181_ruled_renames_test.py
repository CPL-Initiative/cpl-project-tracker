#!/usr/bin/env python3
"""Open Asks Sheet 181's credential renames (Sam, 2026-11-11 22:55Z; cpl_memory d-sheet-181-replies-2026-11-11).

The failure modes guarded:
  1. the family's naming form: tests in ASE's order, joined by " + ", a non-ASE part after "with"; an "or" or a part
     mixing a code with other words is unparseable and left for a person; a renamed title reads back as itself and
     keeps its tests as search aliases;
  2. the frozen plan (kb/cred_rename_plans/2026-11-12_sheet181.json) names the ruling, renames each bundle member to
     its family form, merges a shared mix into one lead, merges (A1–A8 + L1) into ASE Master Automobile
     Technician, and names no Truck, any-one-of Master ("or L3"), any-one-test, emptied or restore title;
     --only-plan applies the plan alone and defers every other rename;
  3. kb/ruled_renames.py lays an entry over a slot that holds only a family-tag fold, and holds it when a person saved
     another title, when the title is gone, no longer a member, or the rename target already exists;
  4. the dry run over the committed files: hold_family_folds does not block a member's rename (its target is not the
     family title); the Master merge is not a chain hazard and its issuer is rule 3, additive, with no conflict; a
     title that holds no exhibit is still held as emptied; the overlay file is not changed;
  5. the apply over copies of the committed files lands every entry, and the Supabase row move leaves every one of
     Sam's fold rows where it was (op "keep"), never moved or deleted, carries the family tag to the new title, and
     the undo puts the files back.

No network. Run from the repo root: python3 tests/sheet181_ruled_renames_test.py
"""
import contextlib
import hashlib
import io
import json
import os
import shutil
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KB = os.path.join(ROOT, "kb")
sys.path.insert(0, KB)
import _build_sheet181_rename_plan as builder  # noqa: E402
import _cred_rename_apply as app  # noqa: E402
import _cred_rename_apply_supabase as sup  # noqa: E402
import _cred_rename_dryrun as dry  # noqa: E402
import _cred_rename_undo as undo  # noqa: E402
import _family_tag_plan as ftp  # noqa: E402
import fold_issuer  # noqa: E402
import ruled_renames  # noqa: E402
import test_mix  # noqa: E402

CHECKS = []


def check(name, cond, why=""):
    CHECKS.append((name, bool(cond), why))


FAM = "ASE Certificate Bundles"
MASTER = "ASE Master Automobile Technician"
TRUCK = "ASE Master Medium/Heavy Truck Technician (T1–T8)"
ANY_ONE = {"ASE Certification (any A1–A8)", "ASE C1 or G1 — Service Consultant or Auto Maintenance and Light Repair"}
EMPTIED = "Advanced Electrical and Electronic Systems"
OR_L3 = "ASE Master Automobile Technician (A1–A8) or L3"
# The titles the ASE plan's restore (-4) puts Sam's rows back on (S639 conductor).
RESTORE = {"Automotive Braking Systems", "Heating and Air Conditioning", "Automotive Air Conditioner", EMPTIED,
           "Engine Performance 1 (ASE A8 Engine Performance)", "Engine Performance 2 (ASE A8 Engine Performance)",
           "Automotive Electrical/Electronics 1 (ASE A6 Electrical/Electronic Systems)",
           "Automotive Electrical/Electronics 2 (ASE A6 Electrical/Electronic Systems)"}
SAM = "slee@cccco.edu"

# ── 1. the naming form ──────────────────────────────────────────────────────────────────────────────────
fr = test_mix.family_read
check("tests join with ' + '", test_mix.family_title(FAM, "ASE Bundle — A4, A5") == FAM + ": A4 + A5")
check("tests run in ASE's own order, whatever order the title wrote them",
      test_mix.family_title(FAM, "ASE Bundle — T6, L2 + Cummins ISX + SP/2 HD")
      == FAM + ": L2 + T6 with Cummins ISX + SP/2 HD"
      and test_mix.family_title(FAM, "ASE Bundle — A5, A4") == FAM + ": A4 + A5")
check("a non-ASE part follows 'with', kept as written",
      test_mix.family_title(FAM, "ASE Bundle — T6, T8 + Snap-on 604") == FAM + ": T6 + T8 with Snap-on 604"
      and test_mix.family_title(FAM, "ASE G1 + ALI Lift It Right Bundle") == FAM + ": G1 with ALI Lift It Right")
r = fr(FAM, "ASE Bundle — A6 or T6 + L3")
check("an 'or' is unparseable: no title, and the reason says so", r["status"] == "unparseable" and r["title"] is None
      and "or" in r["why"])
r = fr(FAM, "ASE Bundle — T5, T8 + SP/2 A6 kit")
check("a part that mixes a test code with other words is unparseable", r["status"] == "unparseable" and r["title"] is None)
check("a title with no mix is no-mix", fr(FAM, MASTER)["status"] == "no-mix" and fr(FAM, "ASE Certification (any A1–A8)")["title"] is None)
for t in ("ASE Bundle — A4, A5", "ASE Bundle — T7, T8 + MACS/609", "ASE Bundle — T6, L2 + Cummins ISX + SP/2 HD"):
    new = test_mix.family_title(FAM, t)
    check("idempotent: %r reads back as itself" % new, fr(FAM, new) == {"status": "already", "title": new, "why": ""})
check("a renamed title keeps its tests as search aliases",
      test_mix.components(FAM + ": A4 + A5") == ["ASE A4", "ASE A5"]
      and "ASE T6" in test_mix.components(FAM + ": T6 + T8 with Snap-on 604"))

# ── 2. the frozen plan ──────────────────────────────────────────────────────────────────────────────────
plans = ruled_renames.load()
check("one ruled plan is committed", [p["plan_id"] for p in plans] == ["sheet181-2026-11-12"])
plan = plans[0]
check("the plan names Sheet 181, its memory row and when Sam decided",
      "Sheet 181" in plan["ruling"] and "d-sheet-181-replies-2026-11-11" in plan["ruling"]
      and plan["decided_at"] == "2026-11-11T22:55:00Z")
E = plan["entries"]
bund = [e for e in E if e.get("family") == FAM]
check("every bundle entry's new title is its family form", bund and all(e["new"] == test_mix.family_title(FAM, e["old"]) for e in bund))
leads = {}
for e in bund:
    if e["kind"] == "rename":
        leads.setdefault(e["new"], []).append(e["old"])
check("each new bundle title has exactly one lead; a shared mix's other title merges into it",
      all(len(v) == 1 for v in leads.values())
      and all(e["new"] in leads for e in bund if e["kind"] == "merge"))
check("the A2 + A3 + A6 pair is one title by an ordinary merge",
      sorted(e["kind"] for e in bund if e["new"] == FAM + ": A2 + A3 + A6") == ["merge", "rename"])
check("only the (A1–A8 + L1) variant merges into ASE Master Automobile Technician",
      [e["old"] for e in E if e["new"] == MASTER and e["kind"] == "merge"] == ["ASE Master Automobile Technician (A1–A8 + L1)"])
olds = {e["old"] for e in E}
check("24 entries: 22 renames and 2 merges", len(E) == 24 and sum(e["kind"] == "rename" for e in E) == 22)
check("no entry for the Truck title, the Master target, the any-one-of Master, an any-one-test title or the emptied title",
      not olds & ({TRUCK, MASTER, OR_L3, EMPTIED} | ANY_ONE) and not {e["new"] for e in E} & {FAM, TRUCK})
check("the unparseable member and the any-one-of Master are listed as left for a person, unrenamed",
      [u["title"] for u in plan["unparseable"]] == ["ASE Bundle — A6 or T6 + L3"]
      and [x["title"] for x in plan["left_for_person"]] == ["ASE Bundle — A6 or T6 + L3", OR_L3]
      and not olds & {"ASE Bundle — A6 or T6 + L3", OR_L3})
check("the plan touches none of the eight restore titles", not (olds | {e["new"] for e in E}) & RESTORE)
check("the any-one-test titles are listed as keeping their titles", set(plan["any_one_test"]) == ANY_ONE)

# The builder over a small fixture: members from Sam's saved folds, the pair, the hold.
fx_over = {t: {"unified_title_override": FAM, "unified_title_merge_confirm": FAM, "reviewed_by": SAM}
           for t in ("ASE Bundle — A4, A5", "ASE Bundle — A2, A3, A6", "ASE A2 + A3 + A6 — X", "ASE Bundle — A6 or T6 + L3",
                     TRUCK, "ASE Certification (any A1–A8)")}
fx_cr = {t: [{"issuing_agency": "National Institute for Automotive Service Excellence (ASE)"}] for t in fx_over}
fx_ut = {"r1": {"unified_title": "ASE Bundle — A2, A3, A6"}, "r2": {"unified_title": "ASE Bundle — A2, A3, A6"},
         "r3": {"unified_title": "ASE A2 + A3 + A6 — X"}}
fx = builder.build(fx_over, fx_cr, fx_ut, ftp.families())
check("the builder names the member with more local titles as the pair's lead",
      [(e["old"], e["kind"]) for e in fx["entries"] if e["new"] == FAM + ": A2 + A3 + A6"]
      == [("ASE Bundle — A2, A3, A6", "rename"), ("ASE A2 + A3 + A6 — X", "merge")])
check("the builder leaves out the Truck title and the any-one-test title, and lists the 'or' member",
      not {e["old"] for e in fx["entries"]} & {TRUCK, "ASE Certification (any A1–A8)"}
      and [u["title"] for u in fx["unparseable"]] == ["ASE Bundle — A6 or T6 + L3"])

# ── 3. the overlay rule ─────────────────────────────────────────────────────────────────────────────────
P1 = {"plan_id": "p", "ruling": "r", "decided_by": "Sam", "decided_at": "2026-11-11T22:55:00Z", "entries": [
    {"old": "A", "new": "A new", "kind": "rename", "family": FAM},
    {"old": "B", "new": "T", "kind": "merge"},
    {"old": "C", "new": "C new", "kind": "rename", "family": FAM},
    {"old": "D", "new": "D new", "kind": "rename"},
    {"old": "E", "new": "E new", "kind": "rename", "family": FAM},
    {"old": "F", "new": "T", "kind": "rename"}]}
ov = {"A": {"unified_title_override": FAM, "unified_title_merge_confirm": FAM, "issuing_agency_override": "ASE",
            "reviewed_by": SAM},
      "B": {"unified_title_override": FAM, "unified_title_merge_confirm": FAM},
      "C": {"unified_title_override": "A person's title"},
      "E": {"issuing_agency_override": "ASE"}}
creds = {k: [{}] for k in ("A", "B", "C", "E", "F", "T")}
eff, rep = ruled_renames.overlay(ov, [P1], {FAM}, creds, {"A", "B", "C", "E", "F"})
st = {e["old"]: "applied" for e in rep["applied"]}
st.update({e["old"]: "held" for e in rep["held"]})
st.update({e["old"]: "done" for e in rep["done"]})
check("a slot holding only a family-tag fold takes the ruled rename; the stored rows are kept for the receipt",
      st["A"] == "applied" and eff["A"]["unified_title_override"] == "A new"
      and "unified_title_merge_confirm" not in eff["A"] and eff["A"]["issuing_agency_override"] == "ASE"
      and eff["A"]["ruled"]["stored"] == {"unified_title_override": FAM, "unified_title_merge_confirm": FAM}
      and eff["A"]["field_reviews"]["unified_title_override"] == {"by": "Sam", "at": "2026-11-11T22:55:00Z"})
check("a merge takes the confirm too, stamped at the ruling", st["B"] == "applied"
      and eff["B"]["unified_title_merge_confirm"] == "T"
      and eff["B"]["field_reviews"]["unified_title_merge_confirm"]["at"] == "2026-11-11T22:55:00Z")
check("a person's other title holds the entry", st["C"] == "held" and eff["C"] == ov["C"])
check("a title that is gone is done", st["D"] == "done" and "D" not in eff)
check("a title no longer in the family is held", st["E"] == "held" and eff["E"] == ov["E"])
check("a rename onto an existing credential is held", st["F"] == "held")
check("the overlay passed in is never changed", ov["A"]["unified_title_override"] == FAM)

# ── 4. the dry run over the committed files ─────────────────────────────────────────────────────────────
tmp = tempfile.mkdtemp()
real = {m: {k: getattr(m, k) for k in dir(m) if k.isupper()} for m in (dry, app, sup, undo)}


def restore():
    for m, d in real.items():
        for k, v in d.items():
            setattr(m, k, v)


def sha(path):
    return hashlib.sha256(open(path, "rb").read()).hexdigest()


try:
    over_sha = sha(dry.OVERLAY)
    dry.OUT_DIR = os.path.join(tmp, "dry")
    with contextlib.redirect_stdout(io.StringIO()):
        dry.main()
    am = json.load(open(os.path.join(dry.OUT_DIR, "alias_map.json"), encoding="utf-8"))
    applied = {e["old"] for e in am["ruled"]["applied"]}
    check("the dry run applies every plan entry and holds none (committed files)",
          applied == olds and not am["ruled"]["held"], am["ruled"]["held"][:2])
    moved = dict(am["renames"])
    moved.update(am["merges"])
    check("each entry is a rename or merge in the alias map, onto its plan title",
          all(moved.get(e["old"]) == e["new"] for e in E))
    _, _, held = fold_issuer.hold_family_folds({e["old"]: e["new"] for e in E if e["kind"] == "rename"},
                                               {e["old"]: e["new"] for e in E if e["kind"] == "merge"},
                                               fold_issuer.family_titles(dry.FAMILIES))
    check("hold_family_folds holds no ruled rename: its target is the member's own title, never the family title",
          not held and not applied & {h["old"] for h in am["held_family"]})
    check("Sam's folds on the titles the plan leaves alone stay held as family tags",
          {h["old"] for h in am["held_family"]} >= {TRUCK, MASTER, EMPTIED, "ASE Bundle — A6 or T6 + L3"} | ANY_ONE)
    mp = am["issuer_preview"].get(MASTER) or {}
    check("the Master merge is planned (not a chain hazard) and its issuer is rule 3, additive, with no conflict",
          am["merges"].get("ASE Master Automobile Technician (A1–A8 + L1)") == MASTER
          and mp.get("rule") == "additive" and mp.get("conflict") is None and mp.get("humans") == []
          and not mp.get("exceptions"), mp)
    check("no ruled title is held as emptied, and no emptied title is touched",
          not applied & {h["old"] for h in am["held_emptied"]}
          and not {h["old"] for h in am["held_emptied"]} & set(moved))
    check("the dry run leaves the overlay file as it was", sha(dry.OVERLAY) == over_sha)
    check("the dry run is apply-safe", am["summary"]["apply_safe"] is True)
    check("the any-one-of Master stays held as a family tag fold, never merged",
          OR_L3 not in moved and OR_L3 in {h["old"] for h in am["held_family"]})

    # --only-plan: the plan's renames and merges alone; every other one is deferred, none lost.
    with contextlib.redirect_stdout(io.StringIO()):
        dry.main(["--only-plan", plan["plan_id"]])
    om = json.load(open(os.path.join(dry.OUT_DIR, "alias_map.json"), encoding="utf-8"))
    omoved = dict(om["renames"])
    omoved.update(om["merges"])
    check("--only-plan applies exactly the plan's 24 entries and is apply-safe",
          omoved == {e["old"]: e["new"] for e in E} and om["summary"]["clean_renames"] == 22
          and om["summary"]["confirmed_merges"] == 2 and om["summary"]["apply_safe"] is True and om["only_plan"] == plan["plan_id"])
    check("--only-plan defers every other rename and merge, the standards folds among them",
          {d["old"] for d in om["deferred"]} == set(moved) - olds and len(om["deferred"]) > 0
          and all(o not in omoved for o in set(moved) - olds))
    check("--only-plan's issuer preview names only the plan's folds",
          set(om["issuer_preview"]) == {e["new"] for e in E if e["kind"] == "merge"})
    try:
        with contextlib.redirect_stdout(io.StringIO()):
            dry.main(["--only-plan", "no-such-plan"])
        refused = False
    except SystemExit as e:
        refused = "no such plan" in str(e.code)
    check("--only-plan refuses a plan id that is not committed", refused)
    try:
        with contextlib.redirect_stdout(io.StringIO()):
            dry.main(["--only-plan", "   "])
        blank = False
    except SystemExit as e:
        blank = "blank" in str(e.code)
    wf = open(os.path.join(ROOT, ".github", "workflows", "cred-rename-apply.yml"), encoding="utf-8").read()
    check("a blank only_plan is refused by the dry run and by the workflow, never run unscoped",
          blank and "only_plan is blank" in wf and "tr -d '[:space:]'" in wf)

    # An entry on a title that is still a credential but holds no exhibit is held as emptied, never renamed.
    env = os.path.join(tmp, "emptied")
    os.makedirs(os.path.join(env, "plans"))
    json.dump({"X": [{"issuing_agency": "ASE"}], "Y": [{"issuing_agency": "ASE"}]}, open(os.path.join(env, "cr.json"), "w"))
    json.dump({"r": {"unified_title": "Y"}}, open(os.path.join(env, "ut.json"), "w"))
    json.dump({"articulations": []}, open(os.path.join(env, "art.json"), "w"))
    json.dump({"overrides": {"X": {"unified_title_override": FAM, "unified_title_merge_confirm": FAM}}},
              open(os.path.join(env, "ov.json"), "w"))
    json.dump(dict(P1, entries=[{"old": "X", "new": FAM + ": A4 + A5", "kind": "rename", "family": FAM}]),
              open(os.path.join(env, "plans", "p.json"), "w"))
    dry.CREDENTIALS, dry.UNIFIED_TITLES, dry.ARTICULATIONS = (os.path.join(env, n) for n in ("cr.json", "ut.json", "art.json"))
    dry.OVERLAY, dry.PLANS_DIR, dry.OUT_DIR = os.path.join(env, "ov.json"), os.path.join(env, "plans"), os.path.join(env, "dry")
    with contextlib.redirect_stdout(io.StringIO()):
        dry.main()
    em = json.load(open(os.path.join(env, "dry", "alias_map.json"), encoding="utf-8"))
    check("a ruled entry on a title that holds no exhibit is held as emptied, never renamed",
          "X" not in em["renames"] and [h["old"] for h in em["held_emptied"]] == ["X"])
    restore()

    # ── 5. the apply over copies of the committed files, and the Supabase row move ─────────────────────
    work = os.path.join(tmp, "kb")
    os.makedirs(work)
    for n in ("credentials.json", "unified_titles.json", "coci_articulations.json", "credential_review_overlay.json",
              "exhibits_related.json"):
        shutil.copy(os.path.join(KB, n), os.path.join(work, n))
    W = {n: os.path.join(work, n) for n in os.listdir(work)}
    for m in (dry, app, undo):
        m.CREDENTIALS, m.UNIFIED_TITLES, m.ARTICULATIONS = (W["credentials.json"], W["unified_titles.json"],
                                                            W["coci_articulations.json"])
    dry.OVERLAY = app.OVERLAY = W["credential_review_overlay.json"]
    dry.RELATED = app.RELATED = W["exhibits_related.json"]
    dry.OUT_DIR = app.DRYRUN_OUT = os.path.join(work, "dry")
    app.ALIAS_PATH = os.path.join(work, "dry", "alias_map.json")
    app.OUT_ROOT = sup.OUT_ROOT = os.path.join(work, "out")
    creds_before = json.load(open(W["credentials.json"], encoding="utf-8"))
    ut_before = open(W["unified_titles.json"], encoding="utf-8").read()
    with contextlib.redirect_stdout(io.StringIO()):
        dry.main(["--only-plan", plan["plan_id"]])   # the scope the first live dispatch uses
        rdir = app.main()
    cr = json.load(open(W["credentials.json"], encoding="utf-8"))
    check("every old title leaves the reference and every new title is in it",
          not olds & set(cr) and {e["new"] for e in E} <= set(cr))
    check("the Truck title, the any-one-of Master, the any-one-test titles, the 'or' member and the emptied title keep "
          "their titles", {TRUCK, OR_L3, EMPTIED, "ASE Bundle — A6 or T6 + L3"} | ANY_ONE <= set(cr))
    check("under --only-plan the standards folds' sources stay as they were",
          all(cr.get(d["old"]) == creds_before.get(d["old"]) for d in om["deferred"]))
    check("the merged Master title keeps one ASE record",
          [r.get("issuing_agency") for r in cr[MASTER]] == ["National Institute for Automotive Service Excellence (ASE)"])
    snap = json.load(open(os.path.join(rdir, "alias_map.json"), encoding="utf-8"))
    check("the apply's frozen snapshot names every entry, so the old names become search aliases",
          all((snap.get("renames") or {}).get(e["old"]) == e["new"] or (snap.get("merges") or {}).get(e["old"]) == e["new"]
              for e in E))

    # kb_curation as it stands for these titles: Sam's fold rows, a family tag on each member, one issuer row.
    over = json.load(open(W["credential_review_overlay.json"], encoding="utf-8"))["overrides"]
    rows = {}

    def add(title, field, value, by, at="2026-11-11T15:26:55.029+00:00"):
        cid = sup.KEY_PREFIX + title
        rows[(cid, field)] = {"course_id": cid, "field": field, "value": value, "reviewer_email": by,
                              "reviewed_at": at, "validated_at": None, "validated_by": None}

    for t in olds | {MASTER, TRUCK}:
        for f in ("unified_title_override", "unified_title_merge_confirm"):
            if (over.get(t) or {}).get(f):
                add(t, f, over[t][f], SAM)
        if any(e["old"] == t and e.get("family") for e in E):
            add(t, "credential_family", FAM, ftp.CREDENTIAL_FAMILY_COHORT, "2026-11-11T23:38:21Z")
    add("ASE Bundle — A4, A5", "issuing_agency_override", "National Institute for Automotive Service Excellence (ASE)",
        "map@rccd.edu", "2026-07-09T00:07:00+00:00")
    sam_rows = {k: dict(v) for k, v in rows.items() if v["reviewer_email"] == SAM}

    def fetch():
        out = {}
        for x in rows.values():
            out.setdefault(x["course_id"], []).append(dict(x))
        return out

    def delete(cid, field):
        rows.pop((cid, field), None)
        return {"course_id": cid, "field": field, "op": "delete", "status": "ok", "rows_affected": 1}

    def patch(old, new, field):
        if (new, field) in rows:
            return {"op": "patch", "status": "fail", "error": "HTTP Error 409: Conflict"}
        x = rows.pop((old, field))
        rows[(new, field)] = dict(x, course_id=new)
        return {"old_course_id": old, "new_course_id": new, "field": field, "op": "patch", "status": "ok"}

    sup.KEY, sup.fetch_credential_review_rows, sup.delete_row, sup.patch_row = "test", fetch, delete, patch
    with contextlib.redirect_stdout(io.StringIO()):
        try:
            sup.main()
            sup_failed = False
        except SystemExit as e:
            sup_failed = bool(e.code)
    check("the row move finishes", not sup_failed)
    check("every one of Sam's fold rows is where it was, unchanged: never moved or deleted",
          all(rows.get(k) == v for k, v in sam_rows.items()) and len(sam_rows) >= 2 * len(olds))
    log = json.load(open(os.path.join(rdir, "supabase_log.json"), encoding="utf-8"))["log"]
    kept = [x for x in log if x.get("op") == "keep"]
    check("each is logged as kept, with the row as it stood", len(kept) == len(sam_rows) - sum(
        1 for k in sam_rows if k[0] in (sup.KEY_PREFIX + MASTER, sup.KEY_PREFIX + TRUCK))
          and all(x.get("before_row", {}).get("reviewer_email") == SAM for x in kept))
    lead = next(e for e in E if e["old"] == "ASE Bundle — A4, A5")
    check("the family tag and the issuer row move to the renamed title",
          rows.get((sup.KEY_PREFIX + lead["new"], "credential_family"), {}).get("value") == FAM
          and (sup.KEY_PREFIX + lead["new"], "issuing_agency_override") in rows
          and (sup.KEY_PREFIX + lead["old"], "credential_family") not in rows)
    check("no Master merge moves a family tag onto the Master title",
          (sup.KEY_PREFIX + MASTER, "credential_family") not in rows)

    # The undo puts the files back, and its SQL reversal never touches a fold row of Sam's.
    undo.KEY = None
    with contextlib.redirect_stdout(io.StringIO()):
        undo.main([rdir, "--apply", "--json-only", "--supabase-plan"])
    check("the undo puts credentials.json and unified_titles.json back",
          json.load(open(W["credentials.json"], encoding="utf-8")) == creds_before
          and json.loads(open(W["unified_titles.json"], encoding="utf-8").read()) == json.loads(ut_before))
    sql = open(os.path.join(rdir, "undo_supabase.sql"), encoding="utf-8").read()
    check("the kb_curation reversal moves the family tags back and names no fold row",
          "credential_family" in sql and "unified_title_override" not in sql and "unified_title_merge_confirm" not in sql)
finally:
    restore()
    shutil.rmtree(tmp, ignore_errors=True)

failed = [(n, w) for n, ok, w in CHECKS if not ok]
for n, ok, w in CHECKS:
    print(("PASS  " if ok else "FAIL  ") + n + ("" if ok or not w else "  -- %s" % (w,)))
print(f"\n{len(CHECKS) - len(failed)}/{len(CHECKS)} passed")
sys.exit(1 if failed else 0)
