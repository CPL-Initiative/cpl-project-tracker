"""A family title groups adoption by test mix (Sam's bundle rule, issue #3110, 2026-11-11).

Every local ASE bundle variation folds into one family title, "ASE Certificate Bundles", and each local
bundle stays a local exhibit with its own test mix. Grouped by the common title alone, the statewide card
put Pierce's A4+A5 bundle and Trade-Tech's T2+T8 bundle on one card, so Pierce read as having adopted
T2+T8 and was never offered it. kb/test_mix.py reads the mix (the title the exhibit sat under before the
fold first, its MAP title second) and names a family title from the data; `_build_statewide_adoption`
groups a family title by mix and every other title as before.

Run from the repo root: python3 tests/statewide_test_mix_test.py
"""
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
sys.path.insert(0, os.path.join(ROOT, "kb"))
import excel_to_dashboard as gen  # noqa: E402
import test_mix  # noqa: E402

CHECKS = []


def check(name, cond):
    CHECKS.append((name, bool(cond)))


# ── the mix ─────────────────────────────────────────────────────────────
ft = test_mix.from_title
check("a bundle title's codes read as the mix", ft("ASE Bundle — A4, A5")[:2] == ("codes:A4,A5", "A4, A5"))
check("a code-first pair reads the same way", ft("ASE A2 + A3 + A6 — Transmission, Drive Train, and Electrical")[1] == "A2, A3, A6")
check("…and equal sets share one key", ft("ASE A2 + A3 + A6 — Transmission, Drive Train, and Electrical")[0] == ft("ASE Bundle — A2, A3, A6")[0])
check("an 'or' is never flattened into 'and': the title's own words, grouped by that title",
      ft("ASE Bundle — A6 or T6 + L3") == ("title:ASE Bundle — A6 or T6 + L3", "A6 or T6 + L3", False))
check("a part no code names stays in the mix", ft("ASE Bundle — T5, T8, SP/2 HD")[1:] == ("T5, T8, SP/2 HD", False)
      and ft("ASE Bundle — T5, T8")[0] != ft("ASE Bundle — T5, T8, SP/2 HD")[0])
check("a title in no bundle form names no mix", ft("ASE Certificate Bundles") is None and ft("Business Law") is None)
prior = {"MAPICI-ASE(42-1-001": "ASE Bundle — A4, A5", "MAPCXI-ACAT-1-001": "ASE Master Automobile Technician (A1–A8 + L1)"}
m = test_mix.exhibit_mix("MAPICI-ASE(42-1-001", "ASE Certificate Bundles", "Automotive Service Excellence (ASE) A4 and A5", prior)
check("after the fold the mix comes from the old title", m == {"key": "codes:A4,A5", "label": "A4, A5", "coded": True})
m = test_mix.exhibit_mix("MAPCXI-ACAT-1-001", "ASE Certificate Bundles", "ASE Certifications: A1 thru A8, L1 Cx", prior)
check("a range keeps the old title's words", m["label"] == "ASE Master Automobile Technician (A1–A8 + L1)" and not m["coded"])
m = test_mix.exhibit_mix("MAPICI-NEW-1-001", "ASE Certificate Bundles", "ASE Certifications: A4, A5, A6 + Residency Units", {})
check("an exhibit with no old title reads a plain list of tests from its MAP title", m["label"] == "A4, A5, A6" and m["coded"])
m = test_mix.exhibit_mix("MAPICI-NEW-2-001", "ASE Certificate Bundles", "Automotive bundle, local", {})
check("an exhibit whose title names no code is unspecified and groups only with itself",
      m == {"key": "id:MAPICI-NEW-2-001", "label": test_mix.NOT_NAMED, "coded": False})

# ── the family, from the data ───────────────────────────────────────────
rows = [("ASE Certificate Bundles", "MAPICI-ASE(42-1-001", "x"), ("ASE Certificate Bundles", "MAPICI-ATT+-1-001", "y"),
        ("ASE Bundle — A4, A5", "MAPICI-Z-1-001", "z"), ("Business Law", "MAPCXS-B0BL-1-001", "BUS 018: Business Law")]
keys = test_mix.adoption_keys(rows, {"MAPICI-ASE(42-1-001": "ASE Bundle — A4, A5", "MAPICI-ATT+-1-001": "ASE Bundle — T2, T8"})
check("two distinct mixes make a family title", {k[0] for k in keys} == {"ASE Certificate Bundles"})
check("one mix is no family: a pre-fold bundle title keeps its key", ("ASE Bundle — A4, A5", "MAPICI-Z-1-001") not in keys)

# ── the committed record holds the two bundles the tests below use ──────
rec = test_mix.load_prior()
check("the prior-title record holds Pierce's A4+A5 and Trade-Tech's T2+T8 exhibits",
      rec.get("MAPICI-ASE(42-1-001") == "ASE Bundle — A4, A5" and rec.get("MAPICI-ATT+-1-001") == "ASE Bundle — T2, T8")

# ── the statewide groups ────────────────────────────────────────────────
COLS = ["College", "ExhibitID", "Exhibit Title", "spare3", "Articulation College",
        "Course", "Credit Recommendation", "Collaborative Type", "TOP Code",
        "CID Number", "s10", "s11", "s12", "CPL Type Description"]
CM = {c: i for i, c in enumerate(COLS)}


def row(eid, title, artic, course, credit, cpl="Industry Certification"):
    r = [""] * len(COLS)
    r[CM["College"]] = artic
    r[CM["ExhibitID"]] = eid
    r[CM["Exhibit Title"]] = title
    r[CM["Articulation College"]] = artic
    r[CM["Course"]] = course
    r[CM["Credit Recommendation"]] = credit
    r[CM["TOP Code"]] = "0948.00"
    r[CM["CPL Type Description"]] = cpl
    return r


FOLDED = {"Automotive Service Excellence (ASE) A4 and A5", "ASE T2, T8, + Residency Units"}
real = gen._classify_exhibit


def folded(raw_title, *a, **k):
    """The classifier after the 30 saved folds apply: both bundles read as the family title."""
    got = dict(real(raw_title, *a, **k))
    if raw_title.strip() in FOLDED:
        got["unified_title"] = "ASE Certificate Bundles"
    return got


gen._classify_exhibit = folded
try:
    out = gen._build_statewide_adoption([], [
        row("MAPICI-ASE(42-1-001", "Automotive Service Excellence (ASE) A4 and A5", "Los Angeles Pierce College", "A S T 002",
            "5 hours in Suspension Brakes and Power Systems"),
        row("MAPICI-ATT+-1-001", "ASE T2, T8, + Residency Units", "Los Angeles Trade Technical College", "DIESEL 100",
            "4 hours in Diesel Engines"),
        row("MAPCXS-B0BL-1-001", "BUS 018: Business Law", "Copper Mountain College", "BUS 018", "3 hours in Business Law",
            "Credit By Exam"),
        row("MAPCxH-BLH-1-001", "Business Law HS-CNUSD", "Norco College", "BUS 18", "3 hours in Business Law", "Credit By Exam"),
    ], CM) or []
finally:
    gen._classify_exhibit = real

fam = {e.get("test_mix"): e for e in out if e["unified_title"] == "ASE Certificate Bundles"}
check("the family title builds one card per mix", set(fam) == {"A4, A5", "T2, T8"})
check("the A4+A5 card names only Pierce as an adopter", fam.get("A4, A5", {}).get("adopter_names") == ["Los Angeles Pierce College"])
check("…so Pierce is not shown as having adopted T2+T8",
      "Los Angeles Pierce College" not in fam.get("T2, T8", {}).get("adopter_names", []))
check("each family card carries its adoption key", fam.get("T2, T8", {}).get("test_mix_key") == "codes:T2,T8")
bl = [e for e in out if e["unified_title"] == "Business Law"]
check("a non-family title (Business Law) groups exactly as before: one card, both colleges, no mix",
      len(bl) == 1 and bl[0]["adopter_names"] == ["Copper Mountain College", "Norco College"]
      and "test_mix" not in bl[0] and "test_mix_key" not in bl[0])

failed = [n for n, ok in CHECKS if not ok]
for n, ok in CHECKS:
    print(("PASS  " if ok else "FAIL  ") + n)
print(f"\n{len(CHECKS) - len(failed)}/{len(CHECKS)} passed")
sys.exit(1 if failed else 0)
