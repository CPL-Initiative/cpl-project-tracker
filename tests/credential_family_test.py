"""A credential family is a field, never a fold (Sam, 2026-11-11, in session; cpl_memory
sam-bundle-family-is-a-field-2026-11-11).

Each ASE bundle stays its own canonical title and carries the family "ASE Certificate Bundles"; his 31 saved
folds are read as family tags. Guards:
  1. kb/test_mix.py reads a bundle's tests; an "or" and a non-ASE part stay as written;
  2. kb/_family_tag_plan.py converts the 24 bundle titles and holds the seven for Sam, untouched ("ASE C1 or G1"
     joined the held any-one-test titles, agreed with COBIx on #3111); the write itself is
     tests/credential_family_apply_test.py;
  3. it gives insert rows of the family field only, one per converted title, and none for a held title;
  4. Sam's fold rows stay beside the tags, and the rename's family hold (kb/fold_issuer.py hold_family_folds) keeps
     every one of them out of the fold, so every title, and every adoption read by title, stays as it was;
  5. the nightly sync carries the family onto kb/credentials.json and takes it off again after a rollback;
  6. kb/credential_aliases.py gives a member its tests as aliases, so A4 finds both A4 bundles;
  7. the field is mapped in kb/governance_surface_map.json;
  8. the members whose mix the parser cannot code fully (an "or", or a part no ASE code names, which joins "with")
     are one exception list for a person, and every member is proposed in the family's naming form
     ("ASE Certificate Bundles: A4 + A5") in the existing rename batch, two titles with one mix sharing one name.

Run from the repo root: python3 tests/credential_family_test.py
"""
import json
import os
import shutil
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _apply_credential_review as acr  # noqa: E402
import _family_tag_plan as ftp  # noqa: E402
import credential_aliases  # noqa: E402
import test_mix  # noqa: E402

CHECKS = []


def check(name, cond):
    CHECKS.append((name, bool(cond)))


FAM = "ASE Certificate Bundles"
LEAD = "ASE A2+A3 — Automatic Transmission and Manual Drive Train (combined)"
SAVED = [LEAD, "Advanced Electrical and Electronic Systems", "ASE A2 + A3 + A6 — Transmission, Drive Train, and Electrical",
         "ASE A8 + L1 — Engine Performance and Advanced Engine Performance",
         "ASE A9 + L2 — Light Vehicle Diesel and Medium/Heavy Diesel Advanced", "ASE Bundle — A1, A6, A8, L1",
         "ASE Bundle — A2, A3, A6", "ASE Bundle — A4, A5", "ASE Bundle — A4, A5, A6", "ASE Bundle — A6 or T6 + L3",
         "ASE Bundle — A6, A8, L1", "ASE Bundle — L2, T8, SP/2 HD", "ASE Bundle — T2, T5, T7, T8 + MACS/609",
         "ASE Bundle — T2, T6, T8 + Snap-on 604", "ASE Bundle — T2, T8", "ASE Bundle — T3, T4, T5, T8",
         "ASE Bundle — T3, T8, SP/2 HD", "ASE Bundle — T4, T8, SP/2 HD", "ASE Bundle — T5, T8", "ASE Bundle — T5, T8, SP/2 HD",
         "ASE Bundle — T6, L2 + Cummins ISX + SP/2 HD", "ASE Bundle — T6, T8 + Snap-on 604", "ASE Bundle — T7, T8 + MACS/609",
         "ASE C1 or G1 — Service Consultant or Auto Maintenance and Light Repair", "ASE Certification (any A1–A8)",
         "ASE G1 + ALI Lift It Right Bundle",
         "ASE L1 + L2 — Advanced Engine Performance and Electronic Diesel Engine Diagnosis", "ASE Master Automobile Technician",
         "ASE Master Automobile Technician (A1–A8 + L1)", "ASE Master Automobile Technician (A1–A8) or L3",
         "ASE Master Medium/Heavy Truck Technician (T1–T8)"]
HELD = {"Advanced Electrical and Electronic Systems", "ASE Certification (any A1–A8)", "ASE Master Automobile Technician",
        "ASE Master Automobile Technician (A1–A8 + L1)", "ASE Master Automobile Technician (A1–A8) or L3",
        "ASE Master Medium/Heavy Truck Technician (T1–T8)",
        "ASE C1 or G1 — Service Consultant or Auto Maintenance and Light Repair"}

# ── 1. the tests a title names ──────────────────────────────────────────
check("a bundle's tests read as codes", test_mix.from_title("ASE Bundle — A4, A5")["label"] == "A4, A5")
check("an 'or' stays as written", test_mix.components("ASE Bundle — A6 or T6 + L3")[-1] == "A6 or T6 + L3")
check("a non-ASE part stays as written", "T5, T8, SP/2 HD" in test_mix.components("ASE Bundle — T5, T8, SP/2 HD"))
check("each named test is an alias", test_mix.components("ASE Bundle — A4, A5, A6") == ["ASE A4", "ASE A5", "ASE A6"])

# ── 2. the plan ─────────────────────────────────────────────────────────
ROWS = []
for k, t in enumerate(SAVED):
    ts = "2026-11-11T15:26:%02d.%06d+00:00" % (54 + (k > 15), 1000 + k)
    base = {"course_id": ftp.PREFIX + t, "value": FAM, "reviewer_email": "slee@cccco.edu", "reviewed_at": ts,
            "validated_at": None, "validated_by": None, "reviewer_label": "a reviewer"}
    ROWS.append(dict(base, field="unified_title_override"))
    if t != LEAD:
        ROWS.append(dict(base, field="unified_title_merge_confirm"))
# A row from another field on a bundle stays out of the plan, whatever it holds.
ROWS.append({"course_id": ftp.PREFIX + "ASE Bundle — A4, A5", "field": "issuing_agency_override",
             "value": "National Institute for Automotive Service Excellence (ASE)", "reviewer_email": "map@rccd.edu",
             "reviewed_at": "2026-07-09T00:07:00+00:00", "validated_at": None, "validated_by": None,
             "reviewer_label": "a reviewer"})
fams = ftp.families()
check("the family is declared", FAM in fams and fams[FAM]["issuer"].endswith("(ASE)"))
p = ftp.plan(ROWS, fams)
conv = {it["title"] for it in p["convert"]}
check("24 bundle titles convert", len(conv) == 24 and LEAD in conv and "ASE Bundle — A4, A5" in conv)
check("the seven titles Sam keeps or that are not bundles are held, untouched", {it["title"] for it in p["held"]} == HELD)
check("ASE C1 or G1 is held as an any-one-test title, by the generator's data",
      "ASE C1 or G1 — Service Consultant or Auto Maintenance and Light Repair" in ftp.HOLD
      and "ASE C1 or G1 — Service Consultant or Auto Maintenance and Light Repair" not in conv)

# ── 3. the insert rows ──────────────────────────────────────────────────
tags, written, conflicts = ftp.tag_rows(p, ROWS)
check("one insert row per converted title, of the family field only, and nothing else",
      {t["course_id"][len(ftp.PREFIX):] for t in tags} == conv and len(tags) == 24
      and all(set(t) == {"course_id", "field", "value"} and t["field"] == "credential_family" and t["value"] == FAM
              for t in tags) and not written and not conflicts)
check("a held title gives no row", not any(t["course_id"][len(ftp.PREFIX):] in HELD for t in tags))
check("the generator writes no SQL", not hasattr(ftp, "plan_sql") and not hasattr(ftp, "rollback_sql"))

# ── 4. the fold rows stay, and no fold runs ─────────────────────────────
import fold_issuer  # noqa: E402

overrides = {}
for r in ROWS:
    overrides.setdefault(r["course_id"][len(ftp.PREFIX):], {})[r["field"]] = r["value"]
for t in tags:
    overrides[t["course_id"][len(ftp.PREFIX):]]["credential_family"] = t["value"]
renames = {t: v["unified_title_override"] for t, v in overrides.items()
           if v.get("unified_title_override") and v.get("unified_title_merge_confirm") != v["unified_title_override"]}
merges = {t: v["unified_title_merge_confirm"] for t, v in overrides.items() if v.get("unified_title_merge_confirm")}
keep_r, keep_m, held_f = fold_issuer.hold_family_folds(renames, merges, fold_issuer.family_titles(ftp.FAMILIES))
check("every saved fold into the family title is held by the rename's family hold, so no title moves",
      not keep_r and not keep_m and {h["old"] for h in held_f} == set(SAVED))

# ── 5. the nightly sync ─────────────────────────────────────────────────
tmp = tempfile.mkdtemp()
try:
    os.makedirs(os.path.join(tmp, "kb", "reference"))
    shutil.copy(ftp.FAMILIES, os.path.join(tmp, "kb", "reference", "credential_families.json"))
    cr = {t: [{"issuing_agency": "National Institute for Automotive Service Excellence (ASE)"}] for t in SAVED}
    cr["Engine Repair (ASE A1)"] = [{"issuing_agency": "ASE"}]
    crp = os.path.join(tmp, "kb", "credentials.json")
    json.dump(cr, open(crp, "w", encoding="utf-8"))
    famp = os.path.join(tmp, "kb", "reference", "credential_families.json")
    put, cleared, und = acr.promote_families(overrides, crp, famp)
    got = json.load(open(crp, encoding="utf-8"))
    check("the sync carries the family onto every record of each tagged title", set(put) == conv
          and all(r.get("family") == FAM for t in conv for r in got[t]))
    check("…and onto no other title", all("family" not in r for t in set(got) - conv for r in got[t]))
    check("the sync field is read, and stamps no review", "credential_family" in acr.FIELDS and "credential_family" in acr.DECISION_ONLY)

    # ── 6. the aliases ──────────────────────────────────────────────────
    members = credential_aliases.family_members(tmp)
    a4 = sorted(t for t, m in members.items() if "ASE A4" in m["aliases"])
    check("a search alias ASE A4 finds both the A4+A5 and the A4+A5+A6 bundle", a4 == ["ASE Bundle — A4, A5", "ASE Bundle — A4, A5, A6"])
    check("a member keeps its 'or' as written", "A6 or T6 + L3" in members["ASE Bundle — A6 or T6 + L3"]["aliases"])

    acr.promote_families({}, crp, famp)
    check("after a rollback of the rows the sync takes the family off again",
          all("family" not in r for recs in json.load(open(crp, encoding="utf-8")).values() for r in recs))
    _, _, und = acr.promote_families({"ASE Bundle — A4, A5": {"credential_family": "No Such Family"}}, crp, famp)
    check("a family no file declares is never carried", und == [("ASE Bundle — A4, A5", "No Such Family")])
finally:
    shutil.rmtree(tmp)

# ── 7. governance ──────────────────────────────────────────────────────
gov = json.load(open(os.path.join(ROOT, "kb", "governance_surface_map.json"), encoding="utf-8"))
check("the field is mapped in the governance surface map", "field:kb_curation.credential_family" in gov.get("mapped", {}))

# ── 8. the exception list and the proposed family titles ───────────────
import _build_exhibits_related as rel  # noqa: E402

EXC = {t for t in conv if test_mix.exception(t)}
check("the members the parser cannot code fully are the eleven with an 'or' or a non-ASE part (C1 or G1 is held)",
      len(EXC) == 11 and {"ASE Bundle — A6 or T6 + L3", "ASE Bundle — T7, T8 + MACS/609",
                          "ASE G1 + ALI Lift It Right Bundle"} <= EXC
      and "ASE Bundle — A4, A5" not in EXC)
check("a non-ASE part joins with 'with', an 'or' stays inside its part",
      test_mix.exception("ASE Bundle — T7, T8 + MACS/609") == {"title": "ASE Bundle — T7, T8 + MACS/609", "mix": "T7, T8 + MACS/609",
                                                              "tests": ["T7", "T8"], "with": ["MACS/609"]}
      and test_mix.parts("ASE Bundle — A6 or T6 + L3") == {"tests": ["A6 or T6", "L3"], "with": []})
check("a member's proposed title is the family plus its tests",
      test_mix.family_title(FAM, "ASE Bundle — A4, A5") == "ASE Certificate Bundles: A4 + A5"
      and test_mix.family_title(FAM, "ASE G1 + ALI Lift It Right Bundle") == "ASE Certificate Bundles: G1 with ALI Lift It Right"
      and test_mix.family_title(FAM, "ASE Master Automobile Technician") is None)

_lj, _fm = rel.load_json, rel.credential_aliases.family_members
try:
    def lj(root, path, default=None):
        got = _lj(root, path, default)
        if path == "kb/credential_review_overlay.json":
            # As after the tags land: Sam's fold rows stay beside them, so every member still holds its saved fold.
            ov = dict((got or {}).get("overrides") or {})
            for t in conv:
                ov[t] = dict(ov.get(t) or {}, unified_title_override=FAM, unified_title_merge_confirm=FAM,
                             credential_family=FAM)
            got = dict(got or {}, overrides=ov)
        return got
    rel.load_json = lj
    rel.credential_aliases.family_members = lambda root=".": {t: {"family": FAM, "aliases": test_mix.components(t)} for t in conv}
    built = rel.build(ROOT)
finally:
    rel.load_json, rel.credential_aliases.family_members = _lj, _fm
famrows = [r for b in built["batches"] for r in b["rows"] if r.get("kind") == "family"]
present = {t for t in conv if any(x[0] == t for x in built["titles"])}
check("the rename batch proposes every member in the reference in the family form, and no held title",
      {r["current"] for r in famrows} == present and len(present) >= 20
      and all(r["proposed"] == test_mix.family_title(FAM, r["current"]) for r in famrows)
      and not any(r["current"] in HELD for r in famrows))
same = [r for r in famrows if r["proposed"] == "ASE Certificate Bundles: A2 + A3 + A6"]
check("two titles with one mix share one proposed title: one leads, the other folds into it",
      len(same) != 2 or sorted(bool(r["merge"]) for r in same) == [False, True])
exl = built["families"][FAM]["exceptions"]
check("the family's exception list holds the members to code by hand, each with its tests and its 'with' parts",
      {e["title"] for e in exl} == EXC & present and all("tests" in e and "with" in e for e in exl))

failed = [n for n, ok in CHECKS if not ok]
for n, ok in CHECKS:
    print(("PASS  " if ok else "FAIL  ") + n)
print(f"\n{len(CHECKS) - len(failed)}/{len(CHECKS)} passed")
sys.exit(1 if failed else 0)
