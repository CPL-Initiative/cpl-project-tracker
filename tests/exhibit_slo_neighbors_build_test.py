#!/usr/bin/env python3
"""The Outcomes match builder (kb/_build_exhibit_slo_neighbors.py; Sam, 2026-11-01: "yes to SLO hints").

Guards, on fixture data:
  (1) two credentials articulated to distinct courses with alike SLOs pair at 0.5 or more, each carrying the other's
      AI sort group (None when the sort leaves it alone) and its own;
  (2) a credential that shares an articulated course is never a hint: it sits in "s", marked "course";
  (3) two different courses printing identical SLO text are marked "text", never a hint;
  (4) the 0.5 threshold holds: a pair that scores above zero and under 0.5 is left out, and shows once the threshold
      is lowered;
  (5) GE-area and unit pseudo-codes are skipped even when course_outcomes holds a row under that code;
  (6) the newest read_run of a course is the one read;
  (7) the lexemes match what Postgres 17's to_tsvector('english') made of the same text (measured 2026-11-01);
  (8) the build is deterministic, so --check can compare.
Run from repo root: python3 tests/exhibit_slo_neighbors_build_test.py
"""
import importlib.util
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("slo", ROOT / "kb" / "_build_exhibit_slo_neighbors.py")
slo = importlib.util.module_from_spec(spec)
spec.loader.exec_module(slo)

results = []


def check(name, cond, why=""):
    results.append((name, bool(cond), why))


COLLEGES = ["Alpha College", "Beta College", "Gamma College"]
WINE = ["Identify the principal grape varieties of each wine region.",
        "Describe vineyard practices and winemaking in each region.",
        "Evaluate wines by structured tasting of aroma, acidity and tannin."]
WINE_B = ["Identify the principal grape varieties of each wine region of Spain.",
          "Describe vineyard practices and winemaking across regions.",
          "Evaluate wines through structured tasting of aroma, acidity and tannin."]
NEAR = ["Identify grape and fruit varieties of Spain used in juice production.",
        "Describe sanitation in fruit processing plants.",
        "Operate pasteurization equipment safely."]
WORK = ["Complete a supervised work placement of 60 hours.", "Write learning objectives with the site supervisor."]


def cred(ci, codes):
    return {"a": {str(ci): [3.0, [[c, "Credit"] for c in codes]]}}


def fixture():
    creds = {
        "Wine A": cred(0, ["WINE 1"]),
        "Wine B": cred(1, ["WIN-2"]),
        "Wine C": cred(0, ["WINE 1"]),               # shares WINE 1 at Alpha with Wine A
        "Near Miss": cred(2, ["FOOD 5"]),
        "Work Exp A": cred(0, ["WEXP 99"]),
        "Work Exp B": cred(1, ["HORT 99"]),           # another course, word for word the same SLOs
        "GE Only": cred(0, ["CAL-GETC 1A", "GE 3B", "CSU UNITS"]),
    }
    rows = [
        {"college": "Alpha College", "course_code": "WINE 1", "read_run": 5, "outcomes": WINE},
        {"college": "Beta College", "course_code": "WIN 2", "read_run": 4, "outcomes": ["Weld a fillet joint."]},
        {"college": "Beta College", "course_code": "WIN 2", "read_run": 9, "outcomes": WINE_B},
        {"college": "Gamma College", "course_code": "FOOD 5", "read_run": 5, "outcomes": NEAR},
        {"college": "Alpha College", "course_code": "WEXP 99", "read_run": 5, "outcomes": WORK},
        {"college": "Beta College", "course_code": "HORT 99", "read_run": 5, "outcomes": WORK},
        # A row under a GE pseudo-code, printing the wine SLOs: it must never reach GE Only.
        {"college": "Alpha College", "course_code": "CAL-GETC 1A", "read_run": 5, "outcomes": WINE},
        {"college": "Alpha College", "course_code": "GE 3B", "read_run": 5, "outcomes": WINE},
    ]
    # Twenty credentials on their own subjects, so the wine words sit under the 15% document-frequency cap.
    for k in range(20):
        code = "TOPIC %d" % k
        creds["Filler %02d" % k] = cred(2, [code])
        rows.append({"college": "Gamma College", "course_code": code, "read_run": 5,
                     "outcomes": ["Explain subject%d concepts in context." % k, "Apply topic%d methods." % k]})
    adopt = {"written_at": "2026-11-01T05:22:19Z", "colleges": COLLEGES, "credentials": creds}
    ai = {"_reference_generated_at": "2026-11-01T05:19:29+00:00",
          "groups": [{"name": "Wine", "n": 2}, {"name": "Wine B", "n": 1}, {"name": "Near Miss", "n": 1}],
          "order": {"Wine A": [0, 0], "Wine C": [0, 1], "Wine B": [1, 2], "Near Miss": [2, 3]}}
    return adopt, ai, rows


adopt, ai, rows = fixture()
data = slo.build(adopt, ai, rows)
nb = data["neighbors"]
a, b, c = nb.get("Wine A", {}), nb.get("Wine B", {}), nb.get("Wine C", {})

hit = [x for x in a.get("n", []) if x[0] == "Wine B"]
check("(1) distinct courses with alike SLOs pair at 0.5 or more", hit and hit[0][1] >= 0.5, json.dumps(a))
check("(1) each side carries the other's AI sort group (None when alone) and its own",
      hit and hit[0][2] is None and a.get("g") == "Wine" and [x[2] for x in b.get("n", []) if x[0] == "Wine A"] == ["Wine"]
      and b.get("g") is None, json.dumps([a, b]))
check("(2) a shared articulated course is never a hint, and is marked course in s",
      not any(x[0] == "Wine C" for x in a.get("n", [])) and any(x[0] == "Wine C" and x[3] == "course" for x in a.get("s", []))
      and not any(x[0] == "Wine A" for x in c.get("n", [])), json.dumps([a, c]))
we = nb.get("Work Exp A", {})
check("(3) identical SLO text through another course is marked text, never a hint",
      not we.get("n") and any(x[0] == "Work Exp B" and x[3] == "text" and x[1] >= 0.99 for x in we.get("s", [])), json.dumps(we))
check("(4) a pair under 0.5 is left out", "Near Miss" not in nb and not any(x[0] == "Near Miss" for x in a.get("n", [])), json.dumps(nb.get("Near Miss")))
slo.THRESHOLD = 0.05
low = slo.build(adopt, ai, rows)["neighbors"].get("Near Miss", {})
slo.THRESHOLD = 0.5
lows = [x[1] for x in low.get("n", []) if x[0] in ("Wine A", "Wine B")]
check("(4) the same pair scores above zero and under 0.5: the threshold, not a zero, keeps it out",
      lows and all(0 < s < 0.5 for s in lows), json.dumps(low))
check("(5) GE-area and unit pseudo-codes are skipped even with an outcomes row under the code",
      "GE Only" not in nb and slo.is_pseudo("CALGETC1A") and slo.is_pseudo("GE3B") and slo.is_pseudo("CSUUNITS")
      and not slo.is_pseudo("GEOG1") and "GE Only" not in slo.credential_courses({"colleges": COLLEGES, "credentials": {"GE Only": adopt["credentials"]["GE Only"]}}),
      json.dumps(nb.get("GE Only")))
texts = slo.course_texts(rows)
check("(6) the newest read_run of a course is the one read", "Spain" in texts[("Beta College", "WIN2")] and "Weld" not in texts[("Beta College", "WIN2")])
check("(6) the counts name what was reached", data["counts"]["credentials_reached"] == 26 and data["counts"]["credentials_with_hint"] == 3,
      json.dumps(data["counts"]))

# Postgres 17.6, to_tsvector('english', ...) on 2026-11-01, filtered as the build filters (three characters, a letter).
PG = {
    "Problem-solving skills; the student's ability to analyze and/or apply CO2 in 2D x-ray e.g. generously universal "
    "entrée 3-D self-paced Demonstrate demonstrating, (a) b.c. 1.5 ACCT-151A organizations; news dying skies early":
        "151a abil acct acct-151a analyz and/or appli b.c co2 demonstr die e.g earli entré generous news organ pace problem "
        "problem-solv ray self self-pac skill sky solv student univers x-ray",
    "co-op re-evaluate": "co-op evalu re-evalu",
    "high-quality work-based learning": "base high high-qual learn qualiti work work-bas",
    "well-being 3-D": "well well-b",
    "20th-century art": "20th 20th-century art centuri",
    "one-on-one": "one one-on-on",
    "U.S. history": "histori u.s",
    "H.V.A.C. systems": "h.v.a.c system",
}
bad = {s: " ".join(sorted(set(slo.lexemes(s)))) for s, want in PG.items() if " ".join(sorted(set(slo.lexemes(s)))) != want}
check("(7) the lexemes match Postgres's to_tsvector('english')", not bad, json.dumps(bad, ensure_ascii=False))
check("(8) the build is deterministic", slo.render(slo.build(adopt, ai, rows)) == slo.render(data))

passed = sum(1 for _, ok, _ in results if ok)
for name, ok, why in results:
    print(("PASS " if ok else "FAIL ") + name + ("" if ok or not why else "\n     " + why))
print("\n%d/%d passed" % (passed, len(results)))
sys.exit(0 if passed == len(results) else 1)
