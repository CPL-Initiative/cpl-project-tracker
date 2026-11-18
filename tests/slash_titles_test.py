#!/usr/bin/env python3
"""A slash joining words in a canonical credential title is written "and" (Sam, in session S679, 2026-11-18: "I
believe I replaced the / with and to avoid formatting issues and should be a general rule for other titles. UA
Plumbers and Pipefitters").

The failure modes guarded:
  1. the rule: a word slash becomes " and " (a chain of three takes commas); a code slash (a code on each side: a
     digit or capitals) stays; an official-name slash (an ASE test name's pair in an ASE title, or an official phrase)
     stays ("Medical/Surgical" among the official phrases); one code beside one word is a word join;
  2. the plan: every word-joining slash title in kb/credentials.json is renamed or held; a spaced slash between two
     whole names (either side holds "and", or both sides are full titles) is held for a person; a rename onto an
     existing credential or search alias, compared case-folded and whitespace squashed, or two slash titles onto one
     "and" title, is a combine and is held, never planned; a rebuild keeps the applied entries (append-only) and
     drops an unapplied one the rule now holds (the S679 conductor on COBIx's review of #3479, 2026-11-18);
  3. the guard: --check fails on a new word-joining slash credential the plan does not cover, and passes on the
     committed files;
  4. the route: kb/ruled_renames.py loads the plan and lays its entries over the overlay; no entry's target is
     already a credential.

No network. Run from the repo root: python3 tests/slash_titles_test.py
"""
import contextlib
import io
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(ROOT, "kb"))
import ruled_renames  # noqa: E402
import slash_titles as st  # noqa: E402

FAILS = []


def check(cond, msg):
    if not cond:
        FAILS.append(msg)


def test_rule():
    words = {
        "UA Plumbers/Pipefitters Apprenticeship — Level 2": "UA Plumbers and Pipefitters Apprenticeship — Level 2",
        "Carpenters Apprenticeship — Drywall/Lather": "Carpenters Apprenticeship — Drywall and Lather",
        "Autodesk Certified User/Professional — AutoCAD": "Autodesk Certified User and Professional — AutoCAD",
        "Advanced Desserts and Pastry/Chocolate/Sugar": "Advanced Desserts and Pastry, Chocolate, and Sugar",
        "Ironworker Apprenticeship — OSHA 30/Extension Review": "Ironworker Apprenticeship — OSHA 30 and Extension Review",
        "Education / Careers in Education Intermediate": "Education and Careers in Education Intermediate",
        "Standard First Aid/CPR/AED": "Standard First Aid, CPR, and AED",
    }
    for old, new in words.items():
        check(st.word_slash(old) and st.and_form(old) == new, "word slash: %r gave %r" % (old, st.and_form(old)))
        check(not st.word_slash(new) and st.and_form(new) == new, "the 'and' form is not stable: %r" % new)
    codes = ["ASE Certificate Bundles: T3 + T8 with SP/2 HD", "ASE Certificate Bundles: T7 + T8 with MACS/609",
             "AWS B2.2/B2.2M Brazing Performance Qualification", "AWS Welder Qualification — D1.1/D1.3/D17.1",
             "Basic Wildland Firefighter (S-130/S-190)",
             "CSTI Hazardous Materials First Responder Awareness and Operations (FRA/FRO) Instructor",
             "Automotive Technology 3A/3B", "CAD/CAM Engineering", "Welding for HVAC/R",
             "NWCG Wildland Fire Certifications (S-190 / S-290 / ICS-100 / ICS-700 bundle)"]
    for t in codes:
        check(st.read(t)["kind"] == "code" and st.and_form(t) == t, "code slash changed: %r -> %r" % (t, st.and_form(t)))
    official = ["ASE A6 — Electrical/Electronic Systems", "ASE Master Medium/Heavy Truck Technician (T1–T8)",
                "Automatic Transmission/Transaxle (ASE A2)", "Medium/Heavy Truck Parts Specialist (ASE P1 standards)",
                "Fire Apparatus Driver/Operator 1A", "NWCG S-339 — Division/Group Supervisor (All-Risk)",
                "Acute Medical/Surgical Nursing and Mental Health Nursing",
                "Acute Medical/Surgical and Nursing of the Childbearing Family"]
    for t in official:
        check(st.read(t)["kind"] == "official" and st.and_form(t) == t,
              "official-name slash changed: %r -> %r" % (t, st.and_form(t)))
    # An ASE pair outside an ASE title is a word join: the official name is ASE's, and the title does not name it.
    check(st.and_form("Diesel Electrical/Electronic Systems") == "Diesel Electrical and Electronic Systems",
          "an ASE pair kept its slash in a title that does not name ASE")
    check(st.read("Engine Repair")["kind"] is None, "a title with no slash was read as one")
    # A spaced slash between two whole names: either side holds "and", or both sides are full titles.
    for t in ["DSST A History of the Vietnam War / Civil War and Reconstruction",
              "Wall and Column Forms / Cutting and Burning (Carpentry)",
              "Video Gaming 1 / Computer Programming and Game Design",
              "Standards and Training for Corrections (STC) / Board of Parole Hearings",
              "Metal Building Erection 1 / Foreman Training"]:
        m = [m for m, k in st.slashes(t) if k == "word"][0]
        check(st.whole_names(t, m), "a spaced slash between two whole names was not caught: %r" % t)
    for t in ["Education / Careers in Education Intermediate", "Pastry/Chocolate and Sugar Arts",
              "Carpenters Apprenticeship — Drywall/Lather"]:
        m = [m for m, k in st.slashes(t) if k == "word"][0]
        check(not st.whole_names(t, m), "a word join read as two whole names: %r" % t)
    check(st.sides("Ironworker — Rigging / Signaling Basics (Level 1)", list(st._SLASH.finditer(
        "Ironworker — Rigging / Signaling Basics (Level 1)"))[0]) == ("Rigging", "Signaling Basics"),
        "a side does not stop at a dash or a parenthesis")
    check(st.title_key("  Drywall  And\tLather ") == "drywall and lather", "the combine key does not fold case or space")


def test_plan():
    creds = {"UA Plumbers/Pipefitters Apprenticeship — Level 2": [{}], "Hydraulics/Pneumatics": [{}],
             "Hydraulics and Pneumatics": [{}], "Water/Wastewater": [{}], "Water / Wastewater": [{}],
             "CAD/CAM Engineering": [{}], "ASE A6 — Electrical/Electronic Systems": [{}]}
    doc = st.build(creds)
    renamed = {e["old"]: e["new"] for e in doc["entries"]}
    held = {h["old"] for h in doc["held"]}
    check(renamed == {"UA Plumbers/Pipefitters Apprenticeship — Level 2":
                      "UA Plumbers and Pipefitters Apprenticeship — Level 2"}, "plan entries: %r" % renamed)
    check(held == {"Hydraulics/Pneumatics", "Water/Wastewater", "Water / Wastewater"}, "held combines: %r" % held)
    check({k["title"] for k in doc["kept"]} == {"CAD/CAM Engineering", "ASE A6 — Electrical/Electronic Systems"},
          "kept titles: %r" % doc["kept"])
    # Combines on the key: a credential that differs in case or spacing, and a search alias, hold the rename.
    doc2 = st.build({"Carpenters — Drywall/Lather": [{}], "Carpenters — Drywall  And Lather": [{}],
                     "Oil/Acrylic Painting": [{}], "Painting Basics": [{}], "Hydraulics/Pneumatics": [{}]},
                    aliases={"Painting Basics": ["oil and acrylic painting"],
                             "Hydraulics/Pneumatics": ["Hydraulics and Pneumatics"]})
    held2 = {h["old"]: h["why"] for h in doc2["held"]}
    check(set(held2) == {"Carpenters — Drywall/Lather", "Oil/Acrylic Painting"}, "combine on the key: %r" % held2)
    check("an alias of Painting Basics" in held2.get("Oil/Acrylic Painting", ""), "an alias combine does not name it")
    check([e["old"] for e in doc2["entries"]] == ["Hydraulics/Pneumatics"],
          "a credential's own alias held its rename: %r" % doc2["entries"])
    # Whole names are held with their reason; an unapplied committed entry the rule now holds is dropped.
    doc3 = st.build({"Video Gaming 1 / Computer Programming and Game Design": [{}]},
                    {"entries": [{"old": "Video Gaming 1 / Computer Programming and Game Design",
                                  "new": "Video Gaming 1 and Computer Programming and Game Design", "kind": "rename",
                                  "why": "x"}]})
    check(doc3["entries"] == [] and [h["old"] for h in doc3["held"]] ==
          ["Video Gaming 1 / Computer Programming and Game Design"] and "whole names" in doc3["held"][0]["why"],
          "a whole-names slash was planned: %r" % doc3)
    check(all(e["kind"] == "rename" and "Sam, 2026-11-18" in e["why"] for e in doc["entries"]),
          "an entry lacks its kind or the ruling")
    check(doc["decided_by"].startswith("Sam") and st.WORDS in doc["ruling"], "the plan does not carry Sam's words")
    # Append-only: an applied entry (its old title gone) stays in a rebuild.
    later = st.build({"Prefab/Sound Panels": [{}]}, doc)
    olds = [e["old"] for e in later["entries"]]
    check(olds == ["UA Plumbers/Pipefitters Apprenticeship — Level 2", "Prefab/Sound Panels"],
          "a rebuild dropped or reordered a committed entry: %r" % olds)
    check(st.uncovered({"Prefab/Sound Panels": [{}], "Oil/Acrylic Painting": [{}]}, later) == ["Oil/Acrylic Painting"],
          "uncovered() misses a new word-joining slash title")


def test_committed():
    creds = json.load(open(st.CREDENTIALS, encoding="utf-8"))
    plan = json.load(open(st.OUT, encoding="utf-8"))
    check(st.uncovered(creds, plan) == [], "a word-joining slash title is not planned: %r" % st.uncovered(creds, plan)[:5])
    with contextlib.redirect_stdout(io.StringIO()):
        try:
            st.main(["--check"])
        except SystemExit as e:
            FAILS.append("--check failed on the committed files: %s" % e)
    targets = [e["new"] for e in plan["entries"]]
    check(len(targets) == len(set(targets)), "two entries share a target")
    # An applied entry (run 44227947795, 2026-11-18: its old title is gone and its new one is a credential) is the
    # rename done, not a combine; the combine checks read the entries not yet applied.
    pending = [e for e in plan["entries"] if not (e["old"] not in creds and e["new"] in creds)]
    check(not any(e["new"] in creds for e in pending), "an entry's target is already a credential (a combine)")
    check(all(st.and_form(e["old"]) == e["new"] for e in plan["entries"]), "an entry disagrees with the rule")
    # Measured on origin/main 82a3dad7 merged in, 2026-11-18: 151 slash titles, 80 word joins planned, 7 whole-name
    # slashes held for a person, 64 kept (code or official name, "Medical/Surgical" among them), 0 combines. The plan
    # only grows once applied (append-only), so the entry pin is a floor.
    held = sorted(h["old"] for h in plan["held"])
    check(len(plan["entries"]) >= 80 and held == sorted([
        "DSST A History of the Vietnam War / Civil War and Reconstruction",
        "Metal Building Erection 1 / Foreman Training",
        "Nursing Skills / Clinical Simulation Laboratory Advanced",
        "Standards and Training for Corrections (STC) / Board of Parole Hearings",
        "Video Gaming 1 / Computer Programming and Game Design",
        "Wall and Column Forms / Cutting and Burning (Carpentry)",
        "Water Treatment Operator Grade T3 / Distribution Grade D3"]),
        "plan size moved: %d entries, held %r" % (len(plan["entries"]), held))
    check(not any("Medical/Surgical" in e["old"] for e in plan["entries"]), "a Medical/Surgical title is planned")
    keys = {st.title_key(t) for t in creds}
    check(not any(st.title_key(e["new"]) in keys for e in pending),
          "an entry's target matches a credential, case and spacing aside")
    # The guard catches a new one.
    bad = dict(creds, **{"Heating/Cooling Fundamentals": [{}]})
    check(st.uncovered(bad, plan) == ["Heating/Cooling Fundamentals"], "the guard missed a new word-joining slash title")


def test_route():
    plans = {p["plan_id"]: p for p in ruled_renames.load()}
    check(st.PLAN_ID in plans, "kb/ruled_renames.py does not load the slash-to-and plan")
    plan = plans.get(st.PLAN_ID) or {"entries": []}
    creds = {e["old"]: [{}] for e in plan["entries"][:3]}
    eff, report = ruled_renames.overlay({}, [plan], (), creds, set(creds))
    check(len(report["applied"]) == 3 and all(eff[o]["unified_title_override"] == st.and_form(o) for o in creds),
          "the route does not lay the plan's renames over the overlay: %r" % report)


if __name__ == "__main__":
    for t in (test_rule, test_plan, test_committed, test_route):
        t()
    if FAILS:
        print("slash_titles_test: %d failure(s)" % len(FAILS))
        for f in FAILS:
            print("  - " + f)
        sys.exit(1)
    print("slash_titles_test: all checks passed")
