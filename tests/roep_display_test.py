#!/usr/bin/env python3
"""Guard for the ROEP display build (kb/_build_roep_display.py).

The failure this guards: Sierra and the CPL Pathways page saying different things
about one program. They read two outputs of one build, the page
cpl_pathways_roep_data.js and Sierra the `display` column the dated SQL receipt
writes, so the guard holds the two byte for byte to each other and recomputes the
up-to figure from the page's own data. It also holds the build's inputs to the
promise the lane makes: MAP's credit-recommendation read carries counts and
exhibit titles, never a student column.

The CER and the articulation feed are rebuilt every morning, so this guard never
rebuilds from them (a rebuild would go stale by the next cron). It checks what was
committed against itself.

    python3 tests/roep_display_test.py
"""
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))

import _build_roep_display as b  # noqa: E402

fails = []


def check(cond, msg):
    print(("ok   " if cond else "FAIL ") + msg)
    if not cond:
        fails.append(msg)


def load_js():
    out = subprocess.run(["node", "-e", "global.window={};require(process.argv[1]);"
                          "process.stdout.write(JSON.stringify(window.CPL_PATHWAYS_ROEP))",
                          b.OUT_JS], check=True, capture_output=True, text=True)
    return json.loads(out.stdout)


def sql_displays(path):
    out = {}
    pat = re.compile(r"^insert into public\.program_requirement_records .* select r\.college, r\.control_number, "
                     r"r\.program_title, r\.measure, r\.record, r\.checks, '(.*)'::jsonb from public\.program_requirement_records r "
                     r"where r\.college = '(.*)' and r\.control_number = '(.*)' on conflict \(college, control_number\) "
                     r"do update set display = excluded\.display;$")
    for line in open(path, encoding="utf-8"):
        m = pat.match(line.rstrip("\n"))
        if m:
            out[(m.group(2).replace("''", "'"), m.group(3))] = json.loads(m.group(1).replace("''", "'"))
    return out


# 1. the key: one course however a source prints it
check(b.ck("IWAP 40.5") == b.ck("IWAP 40.50"), "ck: IWAP 40.5 and IWAP 40.50 are one course")
check(b.ck("ADJ-1") == b.ck("ADJ 1"), "ck: Riverside's ADJ-1 is MAP's ADJ 1")
check(b.ck("REAL ES 001") != b.ck("REAL ES 010"), "ck: REAL ES 001 and 010 stay apart")
check(b.ck("ANATOMY 001") == b.ck("ANATOMY 1"), "ck: West LA's ANATOMY 001 is the state file's ANATOMY 1")
check(b.ck("IWAP 40.07") != b.ck("IWAP 40.7"), "ck: a leading zero after the decimal point is kept")

# 2. plan(): the mock-up's rules
has = lambda c: c["code"].startswith("C")
blocks = [
    {"rule": "all", "courses": [{"code": "C1", "units": 3}, {"code": "N1", "units": 3,
                                "alternatives": [{"code": "C2", "units": 4}]}]},
    {"rule": "choose_courses", "minimum": 1, "courses": [{"code": "N2", "units": 5}, {"code": "C3", "units": 2}]},
    {"rule": "choose_units", "minimum": 4, "courses": [{"code": "C4", "units": 3}, {"code": "C5", "units": 3}]},
    {"rule": "all", "option_group": "g", "courses": [{"code": "N3", "units": 6}]},
    {"rule": "all", "option_group": "g", "courses": [{"code": "C6", "units": 1}]},
]
pl = b.plan(blocks, has)
check(pl["cpl"] == 3 + 4 + 2 + 4 + 1, "plan: alternative with CPL, CPL pick in a choice, partial units, the option with more CPL (got %s)" % pl["cpl"])

# 3. the committed outputs agree with each other
data = load_js()
progs = data["programs"]
check(len(progs) == 20, "20 programs in cpl_pathways_roep_data.js (got %d)" % len(progs))
for k in ("here", "adopt", "consider", "up_to"):
    check(bool(data["definitions"].get(k)), "definition of %s is stated once, for the page and Sierra" % k)
receipt = b.receipt_path(data)
check(os.path.exists(receipt), "the display receipt for build date %s exists" % data["built"])
sql = sql_displays(receipt) if os.path.exists(receipt) else {}
check(len(sql) == len(progs), "the receipt writes every program (%d of %d)" % (len(sql), len(progs)))
for p in progs:
    d = p["display"]
    key = (p["college"], p["control_number"])
    check(d.get("build") == data["build"], "%s carries the build stamp" % p["key"])
    check(sql.get(key) == d, "%s: Sierra's display equals the page's" % p["key"])

    def units_of(c, d=d):
        if c.get("units") is not None:
            return float(c["units"])
        return float((d["courses"].get(c["code"]) or {}).get("units_from_state_file") or 0)

    again = b.plan(p["record"]["blocks"], lambda c, d=d: bool((d["courses"].get(c["code"]) or {}).get("here")), units_of)
    check(again["cpl"] == d["figure"]["up_to"], "%s: up-to figure recomputes from the page's data (%s)" % (p["key"], again["cpl"]))
    codes = {x["code"] for bl in p["record"]["blocks"] for c in bl["courses"] for x in [c] + (c.get("alternatives") or [])}
    check(codes == set(d["courses"]), "%s: one course entry per course the record names" % p["key"])

# 4. the figure the approved mock-up shows for the hand-built map
iw = [p for p in progs if p["key"] == "cerritos_42158"]
check(bool(iw) and iw[0]["display"]["figure"]["up_to"] == 31.5, "Cerritos Ironworker A.S. reads up to 31.5 units (the mock-up's figure)")

# 5. no student column anywhere in the read or the outputs
read = json.load(open(b.MAP_READ))
allowed = {"recs", "exhibits", "exhibits_by_source", "titles", "untitled_exhibits"}
keys = {k for col in read["colleges"].values() for row in col.values() for k in row}
check(keys <= allowed, "MAP read carries counts and titles only (keys %s)" % sorted(keys - allowed))


def field_names(v, out):
    if isinstance(v, dict):
        for k, x in v.items():
            out.add(k)
            field_names(x, out)
    elif isinstance(v, list):
        for x in v:
            field_names(x, out)
    return out


names = field_names(read, set()) | field_names(data, set()) | field_names(list(sql.values()), set())
check(not [n for n in names if re.search(r"student|learner_id|ssn|emplid", n, re.I)],
      "no student field in the read or either output")
check(not b.STALL.search(open(receipt).read()) if os.path.exists(receipt) else False,
      "the receipt names no word the Supabase connector holds")

print("\n%d failure(s)" % len(fails))
sys.exit(1 if fails else 0)
