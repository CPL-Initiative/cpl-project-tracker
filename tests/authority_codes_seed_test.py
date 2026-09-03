#!/usr/bin/env python3
"""kb/_seed_authority_codes.py — attribution rules on a synthetic fixture.

Item 19 of the 2026-09-03 rulings: the chip data must follow the rulings first,
the seed's own canonical picks second, the corpus majority third (above the
item-17 floor, never on a dismissed pair), and a curated name home last —
and a code with a ruled or canonical home must NOT spill onto the discipline
its mis-filed rows sit under. The seed fields then flip by themselves when a
canonical code changes (THEA csr + chip today, THTR c-id + no chip after the
fold).

Run from repo root: python3 tests/authority_codes_seed_test.py
"""
import importlib.util
import os
import sys
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
spec = importlib.util.spec_from_file_location(
    "auth", os.path.join(ROOT, "kb", "_seed_authority_codes.py"))
auth = importlib.util.module_from_spec(spec)
spec.loader.exec_module(auth)

failures = []


def check(label, cond):
    print(("PASS  " if cond else "FAIL  ") + label)
    if not cond:
        failures.append(label)


DISCIPLINES = {
    "Administration of Justice": {"canonical_subj4": "CRIM"},
    "Sociology": {"canonical_subj4": "SOCI"},
    "Art": {"canonical_subj4": "ARTS"},
    "Art History": {"canonical_subj4": "ARTH"},
    "Psychology": {"canonical_subj4": "PSYC"},
    "Drama/Theater Arts": {"canonical_subj4": "THEA"},
    "Health": {"canonical_subj4": "HLTH"},
    "Kinesiology": {"canonical_subj4": "KINE"},
    "Music": {"canonical_subj4": "MUSI"},
    "Commercial Music": {"canonical_subj4": "MUSC"},
    "Dance": {"canonical_subj4": "DANC"},
    "Mathematics": {"canonical_subj4": "MATH"},
}
RULINGS = {"changes": [
    {"item": 8, "discipline": "Administration of Justice",
     "authority": {"c-id": ["AJ", "LPPS"]}},
    {"item": 7, "discipline": "Drama/Theater Arts", "authority": {"c-id": ["THTR"]}},
    {"item": 5, "discipline": "Music", "authority": {"c-id": ["MUS", "CMUS"]}},
    {"item": 15, "discipline": "Psychology", "authority": {"ccn": "PSYC", "c-id": ["PSY"]}},
]}
UNIVERSE = sorted({("c-id", c) for c in ["AJ", "LPPS", "THTR", "MUS", "CMUS", "PSY", "ARTH",
                                         "PH", "KIN", "SOCI", "MATH"]}
                  | {("ccn", c) for c in ["PSYC", "ARTH", "MATH", "STAT"]})
EV = {
    ("c-id", "AJ"): Counter({"Administration of Justice": 42, "Sociology": 4}),
    ("c-id", "ARTH"): Counter({"Art": 25, "Art History": 14}),
    ("ccn", "ARTH"): Counter({"Art": 2, "Art History": 1}),
    ("c-id", "PH"): Counter({"Health": 30, "Kinesiology": 2}),
    ("c-id", "KIN"): Counter({"Kinesiology": 4, "Health": 3}),
    ("c-id", "SOCI"): Counter({"Sociology": 46, "Psychology": 6}),
    ("c-id", "MATH"): Counter({"Mathematics": 114}),
    ("ccn", "MATH"): Counter({"Mathematics": 4}),
    ("ccn", "STAT"): Counter({"Mathematics": 2}),
    ("c-id", "THTR"): Counter({"Drama/Theater Arts": 125, "Music": 3}),
    ("c-id", "CMUS"): Counter({"Music": 21, "Commercial Music": 4}),
}

table = auth.attribute(UNIVERSE, EV, RULINGS, DISCIPLINES)


def homes(system, code):
    return {a["discipline"]: a["basis"] for a in table[(system, code)]["attributed"]}


# 1. ruled home only — the 4 mis-filed AJ rows under Sociology do not attach
check("ruled: AJ attaches to Administration of Justice only",
      homes("c-id", "AJ") == {"Administration of Justice": "ruled"})
check("ruled: the first ruled C-ID code is the discipline-level chip, the second waits",
      [a["chip_primary"] for a in table[("c-id", "AJ")]["attributed"]] == [True]
      and [a["chip_primary"] for a in table[("c-id", "LPPS")]["attributed"]] == [False])
# 2. canonical home only — ARTH's 25 rows under Art are mis-filed, not a home
check("canonical: C-ID ARTH attaches to Art History (its canonical) and not to Art",
      homes("c-id", "ARTH") == {"Art History": "canonical"})
check("canonical: CCN ARTH attaches to Art History too",
      homes("ccn", "ARTH") == {"Art History": "canonical"})
# 3. dismissed pairs never attach, even with strong evidence (a reading for Sam)
check("dismissed: PH under Health (30 rows) stays unhomed under item 17",
      homes("c-id", "PH") == {} and
      table[("c-id", "PH")]["dismissed"] == [{"discipline": "Health", "rows": 30},
                                             {"discipline": "Kinesiology", "rows": 2}])
# 4. majority above the floor, with the dismissed pair excluded
check("majority: KIN attaches to Kinesiology (4 rows, the floor)",
      homes("c-id", "KIN") == {"Kinesiology": "majority"})
# 5. name homes are additive
check("name: STAT (2 rows, under the floor) attaches to Mathematics by name",
      homes("ccn", "STAT") == {"Mathematics": "name"})
check("name + ruled: CMUS attaches to Music (ruled) AND Commercial Music (name)",
      homes("c-id", "CMUS") == {"Music": "ruled", "Commercial Music": "name"})

# 6. seed fields
seed = {"disciplines": {d: dict(e) for d, e in DISCIPLINES.items()}}
auth.fold_into_seed(seed, table)
D = seed["disciplines"]
check("Administration of Justice: csr source, chip C-ID AJ only, proposed flag",
      D["Administration of Justice"]["canonical_source"] == "csr"
      and D["Administration of Justice"]["authority_chips"] == [{"system": "C-ID", "code": "AJ"}]
      and D["Administration of Justice"]["cid_subject_codes"] == ["AJ", "LPPS"]
      and D["Administration of Justice"]["authority_flag"] == "proposed")
check("Psychology: ccn source (rule 2), chip C-ID PSY, no proposed flag",
      D["Psychology"]["canonical_source"] == "ccn"
      and D["Psychology"]["ccn_subject_code"] == "PSYC"
      and D["Psychology"]["authority_chips"] == [{"system": "C-ID", "code": "PSY"}]
      and D["Psychology"]["authority_flag"] is None)
check("Mathematics: ccn source, the second CCN code STAT is a chip",
      D["Mathematics"]["canonical_source"] == "ccn"
      and D["Mathematics"]["ccn_subject_code"] == "MATH"
      and D["Mathematics"]["authority_chips"] == [{"system": "CCN", "code": "STAT"}])
check("Art History: ccn source, no chip (both authorities say ARTH)",
      D["Art History"]["canonical_source"] == "ccn" and D["Art History"]["authority_chips"] == [])
check("Sociology: c-id source, no chip", D["Sociology"]["canonical_source"] == "c-id"
      and D["Sociology"]["authority_chips"] == [])
check("Dance: no authority code at all — csr, proposed, no chip",
      D["Dance"]["canonical_source"] == "csr" and D["Dance"]["authority_flag"] == "proposed"
      and D["Dance"]["authority_chips"] == [])
check("Drama/Theater Arts before the fold: csr with a C-ID THTR chip",
      D["Drama/Theater Arts"]["canonical_source"] == "csr"
      and D["Drama/Theater Arts"]["authority_chips"] == [{"system": "C-ID", "code": "THTR"}])
# 7. the fields flip by themselves once the fold lands
after = {"disciplines": {d: dict(e) for d, e in DISCIPLINES.items()}}
after["disciplines"]["Drama/Theater Arts"]["canonical_subj4"] = "THTR"
table2 = auth.attribute(UNIVERSE, EV, RULINGS, after["disciplines"])
auth.fold_into_seed(after, table2)
check("Drama/Theater Arts after the fold: c-id source, no chip, no proposed flag",
      after["disciplines"]["Drama/Theater Arts"]["canonical_source"] == "c-id"
      and after["disciplines"]["Drama/Theater Arts"]["authority_chips"] == []
      and after["disciplines"]["Drama/Theater Arts"]["authority_flag"] is None)
check("the top-level _authority_codes block carries the counts",
      seed["_authority_codes"]["counts"]["csr"] == 8 and seed["_authority_codes"]["counts"]["ccn"] == 3
      and seed["_authority_codes"]["counts"]["c-id"] == 1)

print(f"\n{len(failures)} failure(s)")
sys.exit(1 if failures else 0)
