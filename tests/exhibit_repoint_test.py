#!/usr/bin/env python3
"""exhibit_repoint_test.py — the pair re-point moves one (MAP exhibit id + local title) and nothing beside it.

COBIx's item 6 on #3464 (S678). What this pins, each a way the apply could go wrong without an error:

  same id      CTCNC: one exhibit id (MAPICA-CTCC10-1-001) carries many local titles that share one course-title
               canonical ("Rigging") and must go to different families. Each pair lands on its own family, the
               canonical key stays, a graded exhibit under the same canonical does not move.
  same title   Split: one local title ("CompTIA A+") carried by a graded and a cert-based exhibit. The graded pair
               moves at exhibit grain, the cert-based exhibit that shares the name stays, and the title's own link
               is untouched. Held by default until the dashboard reads the exhibit grain.
  never        a tap-only row (Sam-curated) is never applied; a drifted pair is held; a bot row does not land on a
               Sam-curated target; a local title key is never edited; a source canonical is never renamed.
  undo         --undo-pairs puts every file back byte for byte and refuses a value changed since.
  the list     the committed kb/exhibit_repoint_list.json: each batch's measured count, pinned beside COBIx's
               figure (a difference is a finding, documented here, never forced), and the CTCNC trade rule.

No network. Run from the repo root:  python3 tests/exhibit_repoint_test.py
"""
import contextlib
import copy
import io
import json
import os
import shutil
import sys
import tempfile
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import exhibit_repoint as xr  # noqa: E402
import _build_exhibit_repoint_list as builder  # noqa: E402
import _cred_rename_apply as app  # noqa: E402

FAILS = []


def check(cond, msg):
    if not cond:
        FAILS.append(msg)
        print("FAIL:", msg)


CTC = "MAPICA-CTCC10-1-001"
SAM = sorted(xr.SAM_IDS)[0]


def fixture():
    ut = {
        "Carpenter’s Training Center CTCNC CARP 019": {"unified_title": "Rigging", "confidence_title": 0.75,
                                                       "source_exhibit_ids": [CTC]},
        "Carpenter’s Training Center CTCNC CARP 312": {"unified_title": "Rigging", "confidence_title": 0.75,
                                                       "source_exhibit_ids": [CTC]},
        "Rigging - Credit by Exam": {"unified_title": "Rigging", "confidence_title": 0.9,
                                     "source_exhibit_ids": ["MAPCXS-RIG-1-001"]},
        "CompTIA A+": {"unified_title": "CompTIA A+", "confidence_title": 0.95,
                       "source_exhibit_ids": ["MAPCXI-CA-1-001", "MAPICI-CA-1-001"]},
        "Settled title": {"unified_title": "Sam Canon", "confidence_title": 0.7, "reviewed_by": SAM,
                          "source_exhibit_ids": ["MAPICA-SET-1-001"]},
    }
    creds = {
        "Rigging": [{"issuing_agency": "Carpenters Training Committee for Northern California (CTCNC)"}],
        "Carpenters Apprenticeship — Carpenter": [{"issuing_agency": "CTCNC", "confidence_issuer": 1.0}],
        "Carpenters Apprenticeship — Scaffold Erector": [{"issuing_agency": "CTCNC", "confidence_issuer": 1.0}],
        "CompTIA A+": [{"issuing_agency": "CompTIA"}],
        "Sam Canon": [{"issuing_agency": "X", "reviewed_by": SAM}],
    }

    def art(cid, eid, title, ut_):
        return {"course_id": cid, "exhibit_id": eid, "exhibit_title": title, "unified_title": ut_,
                "issuing_agency": "orig", "cpl_type_description": ""}
    arts = [art("CNST M1", CTC, "Carpenter’s Training Center CTCNC CARP 019", "Rigging"),
            art("CNST M2", CTC, "Carpenter’s Training Center CTCNC CARP 312", "Rigging"),
            art("CNST M3", "MAPCXS-RIG-1-001", "Rigging - Credit by Exam", "Rigging"),
            art("COMP M1", "MAPCXI-CA-1-001", "CompTIA A+", "CompTIA A+"),
            art("COMP M2", "MAPICI-CA-1-001", "CompTIA A+", "CompTIA A+")]
    return ut, creds, arts


def rows():
    def r(batch, eid, local, action, frm, to, **kw):
        return dict({"batch": batch, "exhibit_id": eid, "local_title": local, "action": action, "from": frm,
                     "to": to}, **kw)
    return [
        r("ctcnc", CTC, "Carpenter’s Training Center CTCNC CARP 019", "repoint", "Rigging",
          "Carpenters Apprenticeship — Carpenter"),
        r("ctcnc", CTC, "Carpenter’s Training Center CTCNC CARP 312", "repoint", "Rigging",
          "Carpenters Apprenticeship — Scaffold Erector"),
        r("split", "MAPCXI-CA-1-001", "CompTIA A+", "repoint", "CompTIA A+",
          "Introduction to Computers (CompTIA A+ Standards)", target_issuer="California Community Colleges"),
        r("split", "MAPICA-SET-1-001", "Settled title", "tap_only", "Sam Canon", "Somewhere Else"),
        r("ctcnc", "MAPCXS-RIG-1-001", "Rigging - Credit by Exam", "repoint", "Not Rigging", "Elsewhere"),
        r("ctcnc", "MAPICI-CA-1-001", "CompTIA A+", "repoint", "CompTIA A+", "Sam Canon", target_sam_curated=True),
    ]


def test_pairs():
    ut, creds, arts = fixture()
    ut0, creds0, arts0 = copy.deepcopy(ut), copy.deepcopy(creds), copy.deepcopy(arts)
    ut1, creds1, arts1, undo, rep = xr.apply_rows(rows(), ut, creds, arts, today="2026-11-17")
    check((ut, creds, arts) == (ut0, creds0, arts0), "apply_rows mutated its inputs")
    check(set(ut1) == set(ut0), "a local title key changed")
    check(set(creds0) <= set(creds1), "a source canonical key disappeared (renamed)")
    # same id, many titles: each CTCNC pair to its own family; the graded exhibit stays.
    check(ut1["Carpenter’s Training Center CTCNC CARP 019"]["unified_title"] == "Carpenters Apprenticeship — Carpenter",
          "CARP 019 did not land on Carpenter")
    check(ut1["Carpenter’s Training Center CTCNC CARP 312"]["unified_title"] ==
          "Carpenters Apprenticeship — Scaffold Erector", "CARP 312 did not land on Scaffold Erector")
    check(ut1["Rigging - Credit by Exam"] == ut0["Rigging - Credit by Exam"], "the graded Rigging exhibit moved")
    check(arts1[2] == arts0[2], "the graded Rigging articulation was re-issued")
    check(arts1[0]["unified_title"] == "Carpenters Apprenticeship — Carpenter" and arts1[0]["issuing_agency"] == "CTCNC",
          "CARP 019's articulation was not re-issued onto its family and the family's issuer")
    # same title, two exhibits: held by default (the dashboard reads the title alone).
    held = {(h["exhibit_id"], h["local_title"]): h["why"] for h in rep["held"]}
    check(held.get(("MAPCXI-CA-1-001", "CompTIA A+"), "").startswith("exhibit grain"),
          "the shared-title split was not held at exhibit grain by default")
    check(ut1["CompTIA A+"] == ut0["CompTIA A+"] and arts1[3:] == arts0[3:], "a held exhibit-grain row changed data")
    # never: tap-only, drift, Sam-curated target.
    check(not any(a["action"] == "tap_only" for a in rep["applied"]), "a tap-only row was applied")
    check(ut1["Settled title"] == ut0["Settled title"], "the Sam-curated title moved")
    check(held.get(("MAPCXS-RIG-1-001", "Rigging - Credit by Exam"), "").startswith("drift"), "drift not held")
    check("Sam-curated" in held.get(("MAPICI-CA-1-001", "CompTIA A+"), ""), "a bot row landed on a Sam target")
    check(rep["counts"]["applied"] == 2 and rep["counts"]["articulations_reissued"] == 2,
          "expected 2 applied pairs and 2 re-issued articulations, got %r" % rep["counts"])

    # With the exhibit grain on: the graded CompTIA pair moves, its cert-based twin and the title link stay.
    ut2, creds2, arts2, undo2, rep2 = xr.apply_rows(rows(), ut, creds, arts, with_exhibit_grain=True)
    rec = ut2["CompTIA A+"]
    check(rec["unified_title"] == "CompTIA A+", "the shared title's own link changed")
    check(rec.get("exhibit_unified_titles") == {"MAPCXI-CA-1-001": "Introduction to Computers (CompTIA A+ Standards)"},
          "the exhibit-grain link was not written for the graded exhibit alone")
    check(arts2[4] == arts0[4], "the cert-based exhibit that shares the name was re-issued")
    check(arts2[3]["unified_title"].startswith("Introduction to Computers") and
          arts2[3]["issuing_agency"] == "California Community Colleges", "the graded articulation was not re-issued")
    new = creds2.get("Introduction to Computers (CompTIA A+ Standards)") or [{}]
    check(new[0].get("issuing_agency") == "California Community Colleges" and new[0].get("reviewed_by") is None,
          "the new graded canonical key was not created with the college issuer")
    check(creds2["CompTIA A+"] == creds0["CompTIA A+"], "the source canonical's record changed")
    check("CompTIA A+" not in json.dumps(creds2["Introduction to Computers (CompTIA A+ Standards)"]),
          "the source canonical was written onto the target")

    # Undo puts it all back, and refuses a value changed since.
    ut3, creds3, arts3, refused = xr.undo_pairs(undo2, ut2, creds2, arts2)
    check(not refused and (ut3, creds3, arts3) == (ut0, creds0, arts0), "undo did not restore the fixture: %r" % refused)
    ut2b = copy.deepcopy(ut2)
    ut2b["CompTIA A+"]["unified_title"] = "Changed by a person"
    _, _, _, refused = xr.undo_pairs(undo2, ut2b, creds2, arts2)
    check(("unified_titles", "CompTIA A+") in [x[:2] for x in refused],
          "undo did not refuse a value a person changed since")


def _shared(n):
    """One local title carried by n exhibits, all under "Old"; "New" exists."""
    ids = ["MAPICA-SH%d-1-001" % i for i in range(n)]
    ut = {"Shared title": {"unified_title": "Old", "confidence_title": 0.7, "source_exhibit_ids": list(ids)}}
    creds = {"Old": [{"issuing_agency": "X"}], "New": [{"issuing_agency": "Y", "confidence_issuer": 1.0}]}
    arts = [{"course_id": "C%d" % i, "exhibit_id": e, "exhibit_title": "Shared title", "unified_title": "Old",
             "issuing_agency": "X", "cpl_type_description": ""} for i, e in enumerate(ids)]
    return ids, ut, creds, arts


def test_held_sibling_never_moves():
    """COBIx finding 1 on #3472: a held row never counts as moving, so a sibling's move cannot rewrite the title's
    link under it. Two exhibits on one title, both listed to the same target; one drifts (its row's `from` is stale)."""
    ids, ut, creds, arts = _shared(2)
    a, b = ids
    rs = [{"batch": "t", "exhibit_id": a, "local_title": "Shared title", "action": "repoint", "from": "Stale",
           "to": "New"},
          {"batch": "t", "exhibit_id": b, "local_title": "Shared title", "action": "repoint", "from": "Old",
           "to": "New"}]
    ut1, _, arts1, _, rep = xr.apply_rows(rs, ut, creds, arts)
    held = {h["exhibit_id"]: h["why"] for h in rep["held"]}
    check(held.get(a, "").startswith("drift"), "the drifted row was not held")
    check(held.get(b, "").startswith("exhibit grain"),
          "the sibling of a held row was not held at exhibit grain: %r" % held.get(b))
    check(ut1["Shared title"]["unified_title"] == "Old", "a sibling's title-grain rewrite moved a held row's link")
    check(arts1 == arts, "an articulation moved while both rows were held")
    ut2, _, arts2, _, rep2 = xr.apply_rows(rs, ut, creds, arts, with_exhibit_grain=True)
    check(ut2["Shared title"]["unified_title"] == "Old" and
          ut2["Shared title"].get("exhibit_unified_titles") == {b: "New"},
          "with the exhibit grain on, the sibling did not move alone: %r" % ut2["Shared title"])
    check(arts2[0] == arts[0] and arts2[1]["unified_title"] == "New", "the wrong articulation was re-issued")
    # Cascade: three exhibits, one held for a Sam-curated target. The other two still move together, at exhibit grain.
    ids, ut, creds, arts = _shared(3)
    rs = [{"batch": "t", "exhibit_id": e, "local_title": "Shared title", "action": "repoint", "from": "Old",
           "to": "New", "target_sam_curated": i == 0} for i, e in enumerate(ids)]
    ut3, _, _, _, rep3 = xr.apply_rows(rs, ut, creds, arts, with_exhibit_grain=True)
    check(ut3["Shared title"]["unified_title"] == "Old" and
          ut3["Shared title"].get("exhibit_unified_titles") == {ids[1]: "New", ids[2]: "New"},
          "the cascade moved the held exhibit or missed a sibling: %r" % ut3["Shared title"])
    # The plain case still takes the title grain: every exhibit on the title moves to one target.
    rs = [dict(r, target_sam_curated=False) for r in rs]
    ut4, _, _, _, rep4 = xr.apply_rows(rs, ut, creds, arts)
    check(ut4["Shared title"]["unified_title"] == "New" and rep4["counts"]["by_grain"] == {"title": 3},
          "a title whose every exhibit moves did not take the title grain: %r" % rep4["counts"])


def test_force_undo_skips_whole():
    """COBIx finding 2 on #3472: --undo-pairs --force skips every value changed since the apply, in all three stores,
    and keeps a title's link and its articulations in step: a changed title is skipped whole (its link and its
    articulations), a created canonical still named after the undo stays, and the output lists what it skipped."""
    ut = {"T1": {"unified_title": "Old1", "source_exhibit_ids": ["E1"]},
          "T2": {"unified_title": "Old2", "source_exhibit_ids": ["E2"]}}
    creds = {"Old1": [{"issuing_agency": "X"}], "Old2": [{"issuing_agency": "X"}]}
    arts = [{"course_id": "C1", "exhibit_id": "E1", "exhibit_title": "T1", "unified_title": "Old1",
             "issuing_agency": "X"},
            {"course_id": "C2", "exhibit_id": "E2", "exhibit_title": "T2", "unified_title": "Old2",
             "issuing_agency": "X"}]
    rs = [{"batch": "t", "exhibit_id": "E1", "local_title": "T1", "action": "repoint", "from": "Old1", "to": "Made1",
           "target_issuer": "I1"},
          {"batch": "t", "exhibit_id": "E2", "local_title": "T2", "action": "repoint", "from": "Old2", "to": "Made2",
           "target_issuer": "I2"}]
    ut1, creds1, arts1, undo, rep = xr.apply_rows(rs, ut, creds, arts)
    check(rep["counts"]["applied"] == 2 and "Made1" in creds1 and "Made2" in creds1, "the fixture apply did not run")
    # A person sets T1's confidence after the apply: T1 changed since.
    ut1b = copy.deepcopy(ut1)
    ut1b["T1"]["reviewed_by"] = "a person"
    _, _, _, refused = xr.undo_pairs(undo, ut1b, creds1, arts1)
    check(refused, "the plain undo did not refuse a changed title")
    ut2, creds2, arts2, skipped = xr.undo_pairs(undo, ut1b, creds1, arts1, force=True)
    check(ut2["T1"] == ut1b["T1"], "--force overwrote a title a person changed since")
    check(arts2[0] == arts1[0], "--force restored the articulation of a skipped title (link and articulations out of step)")
    check("Made1" in creds2 and creds2["Made1"] == creds1["Made1"],
          "--force deleted a created canonical the skipped title still names")
    check(ut2["T2"] == ut["T2"] and arts2[1] == arts[1] and "Made2" not in creds2, "--force did not restore the rest")
    sk = {x[:2] for x in skipped}
    check(("unified_titles", "T1") in sk and ("credentials", "Made1") in sk and
          any(s == "articulations" for s, _ in sk), "--force did not list what it skipped: %r" % sorted(sk))
    # A changed credential and a changed articulation are skipped too, never overwritten or deleted.
    creds1c = copy.deepcopy(creds1)
    creds1c["Made2"][0]["reviewed_by"] = "a person"
    arts1c = copy.deepcopy(arts1)
    arts1c[0]["unified_title"] = "Moved by a person"
    ut3, creds3, arts3, skipped3 = xr.undo_pairs(undo, ut1, creds1c, arts1c, force=True)
    check(creds3.get("Made2") == creds1c["Made2"], "--force deleted a created canonical changed since")
    check(arts3[0] == arts1c[0] and ut3["T1"] == ut1["T1"],
          "--force restored T1's link while its articulation had changed (out of step)")
    check(ut3["T2"] == ut["T2"] and arts3[1] == arts[1], "--force did not restore T2 beside a changed canonical")
    check(("credentials", "Made2") in {x[:2] for x in skipped3}, "the changed canonical was not listed as skipped")


def test_cli_end_to_end():
    """The reviewed path: --pairs --dry-run writes nothing; --pairs writes a receipt; --undo-pairs restores."""
    ut, creds, arts = fixture()
    tmp = tempfile.mkdtemp()
    try:
        paths = {"UNIFIED_TITLES": "unified_titles.json", "CREDENTIALS": "credentials.json",
                 "ARTICULATIONS": "coci_articulations.json"}
        saved = {k: getattr(app, k) for k in paths}
        saved_out, saved_today = app.OUT_ROOT, app.TODAY
        for k, f in paths.items():
            setattr(app, k, os.path.join(tmp, f))
        app.OUT_ROOT = os.path.join(tmp, "out")
        app.TODAY = "2026-11-17"
        app._atomic_write_json(app.UNIFIED_TITLES, ut)
        app._atomic_write_json(app.CREDENTIALS, creds)
        app._atomic_write_json(app.ARTICULATIONS, {"articulations": arts})
        lst = os.path.join(tmp, "list.json")
        app._atomic_write_json(lst, {"rows": rows()})
        before = {f: open(os.path.join(tmp, f), encoding="utf-8").read() for f in paths.values()}
        with contextlib.redirect_stdout(io.StringIO()):
            app.pairs_main(["--pairs", lst, "--dry-run"])
        check(before == {f: open(os.path.join(tmp, f), encoding="utf-8").read() for f in paths.values()},
              "a dry run wrote a file")
        check(not os.path.exists(app.OUT_ROOT), "a dry run wrote a receipt")
        with contextlib.redirect_stdout(io.StringIO()):
            app.pairs_main(["--pairs", lst])
        rec = os.path.join(app.OUT_ROOT, "2026-11-17-pairs")
        check(os.path.isfile(os.path.join(rec, "pair_undo.json")) and os.path.isfile(os.path.join(rec, "validation.md")),
              "the apply wrote no receipt")
        moved = json.load(open(app.UNIFIED_TITLES, encoding="utf-8"))
        check(moved["Carpenter’s Training Center CTCNC CARP 312"]["unified_title"] ==
              "Carpenters Apprenticeship — Scaffold Erector", "the CLI apply did not move CARP 312")
        with contextlib.redirect_stdout(io.StringIO()):
            app.pairs_main(["--undo-pairs", rec])
        after = {f: json.load(open(os.path.join(tmp, f), encoding="utf-8")) for f in paths.values()}
        check(after["unified_titles.json"] == ut and after["credentials.json"] == creds and
              after["coci_articulations.json"]["articulations"] == arts, "--undo-pairs did not restore the files")
    finally:
        for k, v in saved.items():
            setattr(app, k, v)
        app.OUT_ROOT, app.TODAY = saved_out, saved_today
        shutil.rmtree(tmp, ignore_errors=True)


def test_cli_force_undo():
    """COBIx finding 2 at the command line: the plain --undo-pairs refuses and writes nothing; --force leaves the
    changed title whole, restores the rest, and lists what it left in the receipt folder."""
    ut, creds, arts = fixture()
    tmp = tempfile.mkdtemp()
    paths = {"UNIFIED_TITLES": "unified_titles.json", "CREDENTIALS": "credentials.json",
             "ARTICULATIONS": "coci_articulations.json"}
    saved = {k: getattr(app, k) for k in paths}
    saved_out, saved_today = app.OUT_ROOT, app.TODAY
    try:
        for k, f in paths.items():
            setattr(app, k, os.path.join(tmp, f))
        app.OUT_ROOT = os.path.join(tmp, "out")
        app.TODAY = "2026-11-17"
        app._atomic_write_json(app.UNIFIED_TITLES, ut)
        app._atomic_write_json(app.CREDENTIALS, creds)
        app._atomic_write_json(app.ARTICULATIONS, {"articulations": arts})
        lst = os.path.join(tmp, "list.json")
        app._atomic_write_json(lst, {"rows": rows()})
        with contextlib.redirect_stdout(io.StringIO()):
            app.pairs_main(["--pairs", lst])
        rec = os.path.join(app.OUT_ROOT, "2026-11-17-pairs")
        moved = json.load(open(app.UNIFIED_TITLES, encoding="utf-8"))
        moved["Carpenter’s Training Center CTCNC CARP 312"]["reviewed_by"] = "a person"
        app._atomic_write_json(app.UNIFIED_TITLES, moved)
        snap = {f: open(os.path.join(tmp, f), encoding="utf-8").read() for f in paths.values()}
        try:
            with contextlib.redirect_stdout(io.StringIO()):
                app.pairs_main(["--undo-pairs", rec])
            check(False, "the plain --undo-pairs did not refuse a changed title")
        except SystemExit as e:
            check("--force leaves each local title" in str(e), "the refusal does not say what --force does: %s" % e)
        check(snap == {f: open(os.path.join(tmp, f), encoding="utf-8").read() for f in paths.values()},
              "a refused undo wrote a file")
        out = io.StringIO()
        with contextlib.redirect_stdout(out):
            app.pairs_main(["--undo-pairs", rec, "--force"])
        after = json.load(open(app.UNIFIED_TITLES, encoding="utf-8"))
        arts2 = json.load(open(app.ARTICULATIONS, encoding="utf-8"))["articulations"]
        check(after["Carpenter’s Training Center CTCNC CARP 312"] ==
              moved["Carpenter’s Training Center CTCNC CARP 312"], "--force overwrote the changed title")
        check(arts2[1]["unified_title"] == "Carpenters Apprenticeship — Scaffold Erector",
              "--force put back the changed title's articulation")
        check(after["Carpenter’s Training Center CTCNC CARP 019"] == ut["Carpenter’s Training Center CTCNC CARP 019"]
              and arts2[0] == arts[0], "--force did not restore the unchanged title")
        lst_skip = json.load(open(os.path.join(rec, "pair_undo_skipped.json"), encoding="utf-8"))
        check({(s["store"], s["key"]) for s in lst_skip} >= {
            ("unified_titles", "Carpenter’s Training Center CTCNC CARP 312"), ("articulations", CTC + " CNST M2")},
            "pair_undo_skipped.json does not list the title and its articulation: %r" % lst_skip)
        check("left unified_titles" in out.getvalue(), "--force did not print what it left")
    finally:
        for k, v in saved.items():
            setattr(app, k, v)
        app.OUT_ROOT, app.TODAY = saved_out, saved_today
        shutil.rmtree(tmp, ignore_errors=True)


def test_naming():
    check(builder.clean_local_title("Intro to Human Resources Management -- (BUS 178)") ==
          "Introduction to Human Resources Management", "Sam's cleaning example failed")
    check(builder.clean_local_title("BASIC LIFE SUPPORT FOR THE HEALTHCARE PROVIDER") ==
          "Basic Life Support for the Healthcare Provider", "SHOUTING-case cleaning failed")
    check(builder.cert_link(["Certified Ethical Hacker (CEH)"], ["EC-Council"]) == "EC-Council CEH Standards",
          "the CEH suffix does not name issuer plus cert")
    check(builder.cert_link(["AP Calculus AB", "Calculus AB AP"], ["College Board"]) == "",
          "AP took a cert suffix (a standardized assessment never does)")
    check(builder.cert_link(["ASE A5 — Brakes"], []) == "ASE A5 Standards", "the ASE suffix is missing")
    check(builder.ctcnc_series(506) == "Insulator" and builder.ctcnc_title_trade(
        "Commercial Blueprint Reading and Mobile Tower Scaffolds") == [], "scaffold as equipment overrode the series")


def test_one_family_spelling():
    """COBIx finding 3 on #3472: one apprenticeship series never lands across two family names. The family's rungs
    are spelled two ways; the spelling most rungs carry is the family's, and a rung keyed under the other spelling
    goes to a person (merge the key, then rebuild) instead of assigning."""
    creds = {"UA Plumbers and Pipefitters Apprenticeship — Level 1": [{"issuing_agency": "UA"}],
             "UA Plumbers/Pipefitters Apprenticeship — Level 2": [{"issuing_agency": "UA"}],
             "UA Plumbers/Pipefitters Apprenticeship — Level 3": [{"issuing_agency": "UA"}]}
    titles = ["UA Local 467 Plumbing and Pipefitting Apprenticeship Year %d" % n for n in (1, 2, 3)]
    arts = [{"course_id": "P%d" % n, "exhibit_id": "MAPICA-UL4P%d-1-001" % n, "exhibit_title": t, "unified_title": None,
             "cpl_type_description": "Other"} for n, t in enumerate(titles, 1)]
    idx = xr.Index({}, creds, arts)
    audit = {"title_cards": [{"raw_title": t, "tags": ["unclassified_in_map"]} for t in titles]}
    out = {r["local_title"]: r for r in builder.batch_apprenticeship(idx, audit, {})}
    check(out[titles[1]]["action"] == "assign" and out[titles[2]]["action"] == "assign",
          "Years 2 and 3 no longer assign to the family: %r" % [out[t]["action"] for t in titles])
    check(out[titles[0]]["action"] == "person" and out[titles[0]]["to"] == "UA Plumbers/Pipefitters Apprenticeship — Level 1",
          "Year 1 assigned under a second family spelling: %r" % ((out[titles[0]]["action"], out[titles[0]]["to"]),))
    fams = {out[t]["to"].split(" Apprenticeship — ")[0] for t in titles if out[t]["action"] == "assign"}
    check(fams == {"UA Plumbers/Pipefitters"}, "the series assigns across family spellings: %r" % fams)


def test_committed_list():
    """The committed list's own counts, pinned at what this session measured on origin/main 2026-11-17 (no MAP
    snapshot in the sandbox). COBIx's figure sits beside each; where they differ the reason is the comment."""
    doc = json.load(open(xr.LIST_PATH, encoding="utf-8"))
    rs = doc["rows"]
    got = {b: Counter(r["action"] for r in rs if r["batch"] == b) for b in doc["counts"]["by_batch"]}
    check({b: dict(c) for b, c in got.items()} == doc["counts"]["by_batch"], "the list's counts disagree with its rows")
    keys = [(r["exhibit_id"], r["local_title"]) for r in rs if r["action"] in xr.APPLIED_ACTIONS]
    check(len(keys) == len(set(keys)), "an applicable pair is on the list twice")
    ctc = [r for r in rs if r["batch"] == "ctcnc"]
    # COBIx 121 re-point, 3 CTCNC tap-only (of 14; the other 11 are not CTCNC), 1 CTCNC person (FA/C). Equal.
    check(got["ctcnc"]["repoint"] == 121 and got["ctcnc"]["tap_only"] == 3, "CTCNC counts moved: %r" % got["ctcnc"])
    fam = Counter(r["to"].split(" — ")[1] for r in ctc if r["action"] == "repoint")
    want = {"Carpenter": 17, "Pile Driver": 16, "Millwright": 16, "Cabinetmaker": 16, "Drywall/Lather": 14,
            "Acoustical Installer": 12, "Scaffold Erector": 12, "Modular Installer": 8, "Insulator": 6,
            "Hardwood Floor Layer": 2, "Shingler": 2}
    check(dict(fam) == want, "the CTCNC family table moved: %r" % dict(fam))
    # COBIx's prose says all 121 carry MAPICA-CTCC10-1-001; his own CSV and the record put the three Rigging modules
    # (CARP 019, 312, 608) on MAPICA-CTCC7/8/9-1-001. Measured: 118 + 3.
    ids = Counter(r["exhibit_id"] for r in ctc if r["action"] == "repoint")
    check(ids[CTC] == 118 and sum(ids.values()) == 121, "the CTCNC exhibit ids moved: %r" % dict(ids))
    by_from = {}
    for r in ctc:
        if r["action"] == "repoint":
            by_from.setdefault(r["from"], set()).add(r["to"])
    check(len(by_from.get("Blueprint Reading-Residential", ())) == 4 and len(by_from.get("Rigging", ())) == 3,
          "the shared CTCNC canonicals do not split to different families")
    # Apprenticeship: COBIx 15 clear. Measured 13 keyed + 2 that clear by the rule but carry no exhibit id in the
    # committed record (UA Local 467 and Local 62 Plumbing and Pipefitting Journeyperson): rebuild with --map.
    # Then COBIx's finding 3 on #3472 (S679): UA Local 467 Year 1 matched Sam's key "UA Plumbers and Pipefitters
    # Apprenticeship — Level 1" while Years 2 and 3 matched "UA Plumbers/Pipefitters ..."; it goes to a person (Sam's
    # merge of his own key), so 12 assign and 3 person.
    appr = [r for r in rs if r["batch"] == "apprenticeship"]
    check(got["apprenticeship"]["assign"] == 12 and sum(1 for r in appr if r["action"] == "person" and r["to"]) == 3,
          "apprenticeship counts moved: %r" % got["apprenticeship"])
    ua = [r for r in appr if r["local_title"].startswith("UA Local 467 Plumbing") and r["action"] == "assign"]
    check(len(ua) == 2 and {r["to"].split(" Apprenticeship — ")[0] for r in ua} == {"UA Plumbers/Pipefitters"},
          "the UA Local 467 series assigns across more than one family spelling: %r" % [r["to"] for r in ua])
    check(sum(1 for r in appr if r.get("minted")) == 7, "COBIx's mints are 7 (his text says eight but lists seven)")
    # The 710: COBIx 2 re-points (CULART010, FLIGHT 101): equal. Confirm-as-is: COBIx 369 of the 710; measured 371
    # titles over every unreviewed title below 0.80, since his first typographic pass (407) is not in the repo.
    low = [r for r in rs if r["batch"] == "low_confidence"]
    check(sorted(r["local_title"] for r in low if r["action"] == "repoint") == ["CULART010", "FLIGHT 101"],
          "the two low-confidence re-points moved")
    check(len({r["local_title"] for r in low if r["action"] == "confirm"}) == 371, "confirm-as-is title count moved")
    # Split: COBIx 265 mixed (146 title grain, 39 more at exhibit grain, 70 Sam, 10 person). Measured 219: 2,784 local
    # titles carry no exhibit id in the committed record (COBIx typed them from MAP's snapshot), and 59 canonicals
    # COBIx counts as splittable name the graded side with the current canonical itself, which moves nothing.
    sc = doc["counts"]["split_canonicals"]
    check(sc["mixed"] == 219, "split mixed count moved: %r" % sc)
    check(all(r["to"] is None for r in rs if r["batch"] == "split" and r["action"] == "person"),
          "a person row carries a target")


if __name__ == "__main__":
    test_pairs()
    test_held_sibling_never_moves()
    test_force_undo_skips_whole()
    test_cli_end_to_end()
    test_cli_force_undo()
    test_naming()
    test_one_family_spelling()
    test_committed_list()
    if FAILS:
        sys.exit("%d failure(s)" % len(FAILS))
    print("exhibit_repoint_test: all checks passed")
