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
import glob
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

# 1b. identity: what the Common Course Reference shows today, every kind (S332). The build read
# kb/coci_minted_memberships.json, which holds only identities with two or more members, so a
# stand-alone course and every C-ID or CCN identity read as none: 140 of 289 course entries.
check(not hasattr(b, "MEMBERSHIPS") and b.LIVE_MEMBERS.endswith("unified_courses_members.js"),
      "identity reads the live members file, not the multi-member memberships file")
fx_members = {"generated_at": "fixture", "colleges": ["Cerritos College", "American River College"], "members": {
    "WELD M10CA": [{"c": 0, "n": "IWAP 41.09", "cn": "CCC1"}],
    "STAT C1000": [{"c": 0, "n": "STAT C1000", "cn": "CCC2"}],
    "MATH 110": [{"c": 0, "n": "STAT C1000", "cn": "CCC2"}, {"c": 1, "n": "STAT 300", "cn": "CCC5"}],
    "INDT M1149": [{"c": 0, "n": "IWAP 40.63", "cn": "CCC3"}, {"c": 1, "n": "IW 104", "cn": "CCC4"}]}}
fx_index = [["WELD M10CA", "OSHA 30/Extension Review", "IWAP", "Stand-Alone", 1.5],
            ["STAT C1000", "Introduction to Statistics", "STAT", "CCN-ID", None],
            ["MATH 110", "Introduction to Statistics", "STAT", "C-ID", 4],
            ["INDT M1149", "IW - Structural Lead Hazard", "IWAP;IW", "Course", 2]]
fx = b.Identity(fx_members, fx_index, minted={})
check(fx.mid("Cerritos College", "IWAP 41.09", "CCC1") == "WELD M10CA", "identity: a stand-alone course has one")
check(fx.mid("Cerritos College", "IWAP 40.63") == "INDT M1149", "identity: by college and code where no control number is given")
check(fx.ids("Cerritos College", "STAT C1000", "CCC2") == ["STAT C1000", "MATH 110"],
      "identity: a course under a CCN id and a C-ID holds both, CCN first")
r = fx.ref("STAT C1000", fx.ids("Cerritos College", "STAT C1000", "CCC2"))
check(r and r["kind"] == "CCN" and r["cid"] == "MATH 110", "identity: a CCN id carries the C-ID beside it (got %s)" % r)
r = fx.ref("MATH 110")
check(r and r["kind"] == "C-ID" and r["cid"] == "MATH 110", "identity: a C-ID identity shows its C-ID (got %s)" % r)
check(fx.ref("NONE M0000") is None, "identity: an id the live set does not hold shows none")

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
# A course counts once (S340): Irvine Valley's Art A.A. requires ART 85 and lists it again among
# its electives; the elective takes another course, and a required course printed twice counts once.
rep = [{"rule": "all", "courses": [{"code": "C1", "units": 3}, {"code": "N1", "units": 3}]},
       {"rule": "choose_units", "minimum": 3, "courses": [{"code": "C1", "units": 3}, {"code": "C2", "units": 3}]},
       {"rule": "all", "courses": [{"code": "C1", "units": 2}]}]
pr = b.plan(rep, has)
check(pr["cpl"] == 6 and pr["picks"] == ["C1", "C2"],
      "plan: a course in two blocks counts once, and a choice never picks it again (got %s %s)" % (pr["cpl"], pr["picks"]))
# A read map (Sam, open-asks sheet 47 card 9, 2026-10-07, as proposed): a choice with no printed
# minimum takes the least the map prints for it, through a CPL course; along the map, a course the map
# names inside a choice counts in place of the CPL course, and a choice it leaves open counts as up-to.
salon = [{"rule": "all", "courses": [{"code": "C1", "units": 2}]},
         {"rule": "choose_units", "minimum": None, "stated": {"min": None},
          "courses": [{"code": "C7", "units": 1}, {"code": "C8", "units": 3}]}]
m = {"status": "read", "terms": [{"label": "T1", "items": [
    {"kind": "course", "codes": ["C1"], "units": "2"},
    {"kind": "choice", "codes": ["C7", "C8", "C9"], "units": "1-4"}]}]}
check(b.plan(salon, has)["cpl"] == 2, "plan: a choice with no printed minimum and no map counts nothing")
h = b.map_hints(m)
check(h["named"] == {b.ck("C1")} and h["choices"][0]["least"] == 1.0,
      "map_hints: a course on its own line is a pick, and a choice printed whole carries its least (got %s)" % h)
check(b.plan(salon, has, None, h)["cpl"] == 3, "plan: the choice takes the map's least, 1 unit, through a CPL course")
check(b.plan(salon, has, None, h, path=True)["cpl"] == 3, "plan: along the map, an open choice counts as up-to does")
check(b.map_hints({"status": "refused"}) == {"named": set(), "choices": []}, "map_hints: an unread map adds nothing")
pick = [{"rule": "choose_courses", "minimum": 1, "courses": [{"code": "C2", "units": 3}, {"code": "N4", "units": 3}]},
        {"rule": "all", "courses": [{"code": "N5", "units": 3, "alternatives": [{"code": "C3", "units": 3}]}]}]
mp = {"status": "read", "terms": [{"label": "T1", "items": [{"kind": "course", "codes": ["N4"]},
                                                           {"kind": "course", "codes": ["N5"]}]}]}
hp = b.map_hints(mp)
check(b.plan(pick, has, None, hp)["cpl"] == 6, "plan: up-to still takes the CPL course in every choice")
pp = b.plan(pick, has, None, hp, path=True)
check(pp["cpl"] == 0 and pp["picks"] == [],
      "plan: along the map, the map's picks (N4 in a choice, N5 over its or) count in place of the CPL course (got %s)" % pp)

# 2a. A recommended block counts toward nothing (Sam's rule 4, 2026-10-11): its CPL course adds
# no units to the figure, and the figure picks no course from it.
rec_blocks = [{"rule": "all", "courses": [{"code": "C1", "units": 3}]},
              {"rule": "recommended", "minimum": None, "courses": [{"code": "C9", "units": 4}]}]
rp = b.plan(rec_blocks, has)
check(rp["cpl"] == 3 and rp["picks"] == ["C1"], "plan: a recommended block adds nothing to the figure (got %s)" % rp)

# 2b. COCI's word on a mismatched course (Sam, 2026-10-11, reading the Mt. San Antonio sample:
# "find the 2 courses in COCI with a different status ... list them with a chip noting the Coci
# status so the college can follow up if needed. Make this a rule for all such courses."). The
# failures this guards: a catalog addition the program carries Inactive under an older control
# number read as "not on the state's list"; the current version named when it is the same one;
# a course on no program under any status given a status; a listed course the catalog does not
# print without its status.
X = b.norm_college("X College")
fx_coci = {"on_program": {(X, "P1", b.ck("EMS 80")): {"status": "Inactive", "ccn": "CCC1"},
                          (X, "P1", b.ck("ID 36")): {"status": "Approved", "ccn": "CCC3"}},
           "current": {(X, b.ck("EMS 80")): {"ccn": "CCC2", "units": 9.0},
                       (X, b.ck("ID 36")): {"ccn": "CCC3", "units": 2.0}}}
f = b.coci_facts(fx_coci, "X College", "P1", "EMS80")
check(f == {"status": "Inactive", "program_ccn": "CCC1", "current_ccn": "CCC2"},
      "coci_facts: the program's status and control number, and the current version (got %s)" % f)
check(b.coci_facts(fx_coci, "X College", "P1", "ID 36")["current_ccn"] is None,
      "coci_facts: a current version that is the program's own is not named twice")
check(b.coci_facts(fx_coci, "X College", "P2", "EMS 80") is None,
      "coci_facts: a course the program carries under no status has none")
filed_fx = {"record": {"blocks": [{"rule": "all", "courses": [
    {"code": "EMS 80", "units": 9, "catalog_addition": True}, {"code": "ZZ 1", "units": 3, "catalog_addition": True}]}],
    "missing_explained": [{"code": "ID 36", "why": "not in the text"}]}, "score": {}}
gs = b.gaps_for("X College", "courseleaf", "A.S. Degree", "units", filed_fx, None, {"min": None}, None,
                lambda code: b.coci_facts(fx_coci, "X College", "P1", code))
ems_g = [g for g in gs if (g.get("coci") or [{}])[0].get("code") == "EMS 80"]
check(len(ems_g) == 1 and "EMS 80 CCC1, Inactive in COCI" in ems_g[0]["text"] and "current EMS 80 is CCC2" in ems_g[0]["text"]
      and ems_g[0]["owner"] == "college",
      "gaps: a catalog addition the program carries under another status names it, for the college (got %s)" % ems_g)
check(any("prints ZZ 1 for this program; the state's Program Course File does not list it." in g["text"] for g in gs)
      and not any("EMS 80" in g["text"] and "does not list" in g["text"] for g in gs),
      "gaps: only an addition COCI carries under no status reads as unlisted")
check(any(g["text"].startswith("The state's Program Course File lists ID 36") and "ID 36 CCC3, Approved in COCI" in g["text"]
          and (g.get("coci") or [{}])[0].get("status") == "Approved" for g in gs),
      "gaps: a listed course the catalog does not print carries its COCI status")

# 2c. A program that points at a retired version of a course the college still offers lists
# that course (Sam, 2026-10-11, Cerritos 02226's ENGT 116 and 117: "If the Program Course file
# has 116 and 117 as active, it shouldn't matter that they have older inactive versions"; then
# "go"). The failures this guards: such a course flagged for the college as off the list; a
# current version the file itself calls Inactive treated as offered; a course with no current
# version losing its flag.
fx_keep = {"on_program": {(X, "P1", b.ck(c)): {"status": "Inactive", "ccn": n + "0"}
                          for c, n in (("AA 1", "A"), ("BB 2", "B"), ("CC 3", "C"), ("DD 4", "D"))},
           "current": {(X, b.ck("AA 1")): {"ccn": "A1"}, (X, b.ck("BB 2")): {"ccn": "B1"},
                       (X, b.ck("CC 3")): {"ccn": "C1"}, (X, b.ck("DD 4")): {"ccn": "D0"}},
           "status_of": {"A1": "Active", "C1": "Inactive"}, "offered": {"B1", "C1"},
           "keep": ("Active", "Approved", "Active - Teachout Only")}
fk = lambda code: b.coci_facts(fx_keep, "X College", "P1", code)
check(fk("AA 1").get("listed") is True and fk("AA 1")["program_ccn"] == "A0" and fk("AA 1")["current_ccn"] == "A1",
      "coci_facts: a retired pointer whose current version the file calls Active is listed (got %s)" % fk("AA 1"))
check(fk("BB 2").get("listed") is True,
      "coci_facts: a current version on no program counts as offered when Fall 2025's course basic report carries it")
check(not fk("CC 3").get("listed"), "coci_facts: the file's own Inactive for the current version wins over the course basic report")
check(not fk("DD 4").get("listed") and fk("DD 4")["current_ccn"] is None,
      "coci_facts: a course with no current version is not listed")
filed_k = {"record": {"blocks": [{"rule": "all", "courses": [
    {"code": c, "units": 3, "catalog_addition": True} for c in ("AA 1", "BB 2", "CC 3", "DD 4")]}]}, "score": {}}
gk = b.gaps_for("X College", "courseleaf", "A.S. Degree", "units", filed_k, None, {"min": None}, None, fk)
named = sorted((g.get("coci") or [{}])[0].get("code") for g in gk if g["kind"] == "Catalog and state file differ")
check(named == ["CC 3", "DD 4"], "gaps: no flag for a course the program lists through an older version (got %s)" % named)

# 2e. Record shape 5 (Sam, Open Asks Sheet 78 card 2, "Record both figures"): a page that prints the
# degree total with general education and no major total. The failure this guards: the gaps saying
# "The catalog prints no program total" for a page that prints one for the degree.
def deg_gaps(arith):
    fd = {"record": {"program": {"degree_total": {"min": 64, "max": 68}, "ge_units": {"min": 34, "max": 38}},
                     "blocks": []}, "score": {"arithmetic": arith}}
    return b.gaps_for("X College", "elumen", "A.S. Degree", "units", fd, None, {"min": None}, None, lambda code: None)
gd = deg_gaps({"status": "equal", "against": "degree", "computed": [64, 68]})
check(not any(g["kind"] in ("No printed total", "Check not met") for g in gd),
      "gaps: blocks and general education that make the printed degree total raise no gap (got %s)" % gd)
gd = deg_gaps({"status": "unequal", "against": "degree", "computed": [60, 64]})
check(any(g["kind"] == "Check not met" and g["text"] == "The blocks and general education add to 60-64 units; "
          "the catalog prints 64-68 units for the degree." for g in gd)
      and not any("no program total" in g["text"] for g in gd),
      "gaps: a degree total the blocks and general education miss names both figures (got %s)" % gd)
gd = deg_gaps({"status": "incomplete", "against": "degree", "computed": [30, 30],
               "why": ["the record names the degree total and the CalGETC pattern, but no units for it"]})
check(any(g["kind"] == "Check not met" and g["text"].startswith("The catalog prints 64-68 units for the degree") for g in gd),
      "gaps: a degree total the check could not add to says why (got %s)" % gd)

# 2d. A receipt never names a word the Supabase connector holds, even when a record's text
# does (Long Beach City 37305, 2026-10-11: a careers note says "a reviewer may choose to drop
# it", and the guard refused the whole build). The failures this guard: a stalling word in the
# receipt, and an escape that changes what the display job applies.
import _program_requirements_display_apply as apply_mod  # noqa: E402
fx_disp = {"gaps": [{"text": "a reviewer may choose to drop it; Delete and TRUNCATE; undelete stays"}], "v": 1}
fx_build = {"build": "fx", "built": "2026-10-11", "programs": [
    {"key": "x_1", "college": "X College", "control_number": "1", "filed": "college", "display": fx_disp}]}
fx_sql = b.sql_text(fx_build)
check(not b.STALL.search(fx_sql), "receipt: no stalling word survives in the SQL (got %s)" % b.STALL.search(fx_sql))
fx_rows = apply_mod.parse(fx_sql)
check(len(fx_rows) == 1 and fx_rows[0]["display"] == fx_disp,
      "receipt: the display job parses the escaped JSON back to the same display (got %s)" % fx_rows)

# 3. the committed outputs agree with each other
data = load_js()
progs = data["programs"]
filed = sorted(os.path.splitext(os.path.basename(f))[0] for d in b.RECORD_FOLDERS
               for f in glob.glob(os.path.join(b.PILOT, d, "*.json")))
check(sorted(p["key"] for p in progs) == filed and len(progs) >= 22,
      "every filed record, records/ and records_maps/, is in cpl_pathways_roep_data.js (got %d of %d)" % (len(progs), len(filed)))
check(all(p["filed"] == ("records" if os.path.exists(os.path.join(b.PILOT, "records", p["key"] + ".json")) else "records_maps")
          for p in progs), "each program names the folder it is filed in")
for k in ("here", "adopt", "consider", "up_to"):
    check(bool(data["definitions"].get(k)), "definition of %s is stated once, for the page and Sierra" % k)
receipt = b.receipt_path(data)
check(os.path.exists(receipt), "the display receipt for build date %s exists" % data["built"])
sql = sql_displays(receipt) if os.path.exists(receipt) else {}
# The page carries the pilot's programs; the receipt carries them and every full-college
# record (S355: the blocks of Cerritos's 270 lacked titles, ids and CPL counts because no
# build reached them). A full-college record of a program the pilot filed stays the pilot's.
pilot_keys = {(p["college"], p["control_number"]) for p in progs}
phase2 = b.college_records(pilot_keys)
check(len(sql) == len(progs) + len(phase2),
      "the receipt writes every program: the page's %d and %d full-college records (got %d)" % (len(progs), len(phase2), len(sql)))
check(all(k in sql for k in pilot_keys) and all((f["college"], f["control_number"]) in sql for _, _, f, _ in phase2),
      "every program the page or a college folder files is in the receipt")
cer = sql.get(("Cerritos College", "02201")) or {}
arch = (cer.get("courses") or {}).get("ARCH 110") or {}
check(arch.get("title") and any(i["kind"] == "M-ID" and i["id"] and i.get("title") for i in arch.get("ids") or []),
      "a full-college record carries its course's title and every id with its title (Cerritos ARCH 110: %s)" % arch)
hed = ((sql.get(("Cerritos College", "41982")) or {}).get("courses") or {}).get("HED 100", {}).get("here") or {}
check(hed.get("exhibits_n") == 1 and hed.get("exhibits") and hed["exhibits"][0].get("credential") == "Basic Military Training",
      "the CPL count is the exhibits articulated here, MAP's untitled row not counted beside the feed's named one (HED 100: %s)" % hed)
# The rule on the real records (S359's Mt. San Antonio sample): EMS 80 is on the paramedic program
# Inactive under CCC000584685 while COCI's current EMS 80 is CCC000616276; Agricultural Science and
# Technology keeps its unit difference, the blocks' 29.5-31.5 beside the printed 30.5.
ems = ((sql.get(("Mt. San Antonio College", "03059")) or {}).get("courses") or {}).get("EMS 80") or {}
check(ems.get("coci") == {"status": "Inactive", "program_ccn": "CCC000584685", "current_ccn": "CCC000616276"},
      "Mt. San Antonio EMS 80 carries its COCI status on the paramedic program (got %s)" % ems.get("coci"))
ag = ((sql.get(("Mt. San Antonio College", "02990")) or {}).get("checks") or {}).get("units_differ")
check(ag == {"blocks": [29.5, 31.5], "printed": [30.5, 30.5]},
      "Agricultural Science and Technology keeps its unit difference as printed (got %s)" % ag)
for p in progs:
    d = p["display"]
    key = (p["college"], p["control_number"])
    check(d.get("build") == data["build"], "%s carries the build stamp" % p["key"])
    check(sql.get(key) == d, "%s: Sierra's display equals the page's" % p["key"])

    def units_of(c, d=d):
        if c.get("units") is not None:
            return float(c["units"])
        return float((d["courses"].get(c["code"]) or {}).get("units_from_state_file") or 0)

    here = lambda c, d=d: bool((d["courses"].get(c["code"]) or {}).get("here"))
    hints = b.map_hints(d["map"])
    again = b.plan(p["record"]["blocks"], here, units_of, hints)
    check(again["cpl"] == d["figure"]["up_to"], "%s: up-to figure recomputes from the page's data (%s)" % (p["key"], again["cpl"]))
    if d["map"]["status"] == "read":
        along = b.plan(p["record"]["blocks"], here, units_of, hints, path=True)
        check(along["cpl"] == d["figure"]["path"] and d["figure"]["path"] <= d["figure"]["up_to"],
              "%s: the figure along the map recomputes from the page's data, never above up-to (%s)" % (p["key"], along["cpl"]))
    else:
        check(d["figure"]["path"] is None and "No pathway map" in d["figure"]["path_why"],
              "%s: no read map, so no figure along one" % p["key"])
    codes = {x["code"] for bl in p["record"]["blocks"] for c in bl["courses"] for x in [c] + (c.get("alternatives") or [])}
    check(codes == set(d["courses"]), "%s: one course entry per course the record names" % p["key"])

# 3b. a read map (S340): the terms as the college prints them, each of the record's courses in
# the term the map names it in, and the rest unplaced; never a course the record does not hold.
reads = [p for p in progs if p["display"]["map"]["status"] == "read"]
check({p["key"] for p in reads} == {"smc_43767", "ivc_10265", "mtsac_03086", "mtsac_33876"},
      "the four programs with a read map show it (got %s)" % sorted(p["key"] for p in reads))
# Sheet 50 card 4 (S346): an off-list course the map names rides its item, marked, and
# never enters the record's courses or the placed set.
fire = [p for p in reads if p["key"] == "mtsac_03086"]
offs = [c for p in fire for t in p["display"]["map"]["terms"] for it in t["items"] for c in it.get("off_list") or []]
check(offs == ["KINF 51A", "KINF 51B", "KINF 52A"], "mtsac_03086: the map's three off-list KINF courses are marked (got %s)" % offs)
check(not [c for p in fire for c in offs if c in p["display"]["map"]["placed"] or c in p["display"]["courses"]],
      "mtsac_03086: an off-list course is never one of the record's courses")
for p in reads:
    m = p["display"]["map"]
    seq = json.load(open(os.path.join(b.SEQUENCES, p["key"] + ".json")))
    check(len(m["terms"]) == len(seq["terms"]) and [t["label"] for t in m["terms"]] == [t["label"] for t in seq["terms"]],
          "%s: the terms are the map's, in its order" % p["key"])
    check(set(m["placed"]) | set(m["not_placed"]) == set(p["display"]["courses"])
          and not set(m["placed"]) & set(m["not_placed"]),
          "%s: every course of the record is placed or unplaced, once" % p["key"])
    check(all(b.ck(c) in {b.ck(x) for it in m["terms"][n]["items"] for x in it["codes"]} for c, n in m["placed"].items()),
          "%s: a placed course is named in the term it is placed in" % p["key"])
    check(p["display"]["figure"]["path"] is not None and p["display"]["figure"]["path_why"] is None,
          "%s: a read map carries the figure along it" % p["key"])
sm = [p for p in progs if p["key"] == "smc_43767"]
check(bool(sm) and sm[0]["display"]["map"]["not_placed"] == ["COSM 49R"] and sm[0]["display"]["map"]["placed"]["COSM 95A"] == 3,
      "Santa Monica: COSM 49R alone is off the map, and the Salon Experience choice sits in its fourth term")
check(bool(sm) and sm[0]["display"]["figure"]["up_to"] == 22.5 and sm[0]["display"]["figure"]["path"] == 22.5,
      "Santa Monica Barbering reads up to 22.5 units and 22.5 along its map: COSM 11C counts once, and Salon "
      "Experience counts at the 1 unit the map prints (sheet 47 card 9)")
iv = [p for p in progs if p["key"] == "ivc_10265"]
check(bool(iv) and iv[0]["display"]["figure"]["up_to"] == 3.0 and iv[0]["display"]["figure"]["path"] == 3.0,
      "Irvine Valley Art reads up to 3 units and 3 along its map: ART 85 counts once")
# Sam loaded both on open-asks sheet 47 card 8 (2026-10-07): every record is filed in records/,
# so the receipt names none waiting.
check(all(p["filed"] == "records" for p in progs) and "are filed in records_maps/" not in
      (open(receipt).read() if os.path.exists(receipt) else ""),
      "every record is filed in records/ and the receipt names none waiting")

# 4. the figure the approved mock-up shows for the hand-built map
iw = [p for p in progs if p["key"] == "cerritos_42158"]
check(bool(iw) and iw[0]["display"]["figure"]["up_to"] == 31.5, "Cerritos Ironworker A.S. reads up to 31.5 units (the mock-up's figure)")

# 4b. "already here" compares the CER's unified title too (S332): Riverside's CIS-27 holds
# "CompTIA Security+ (CIS-27)", so CompTIA Security+ is not "for consideration" there.
cy = [p for p in progs if p["key"] == "riverside_40061"]
cis27 = cy[0]["display"]["courses"].get("CIS-27", {}) if cy else {}
check(bool(cy) and "CompTIA Security+" not in [c["credential"] for c in cis27.get("consider") or []],
      "Riverside CIS-27 does not list a credential it already holds as for consideration")
iw63 = (iw[0]["display"]["courses"].get("IWAP 40.63") or {}) if iw else {}
check(bool(iw63.get("identity")) and bool(iw63.get("adopt")),
      "Cerritos IWAP 40.63 has its identity and American River's could-adopt lead")

# 4c. a MAP articulation that names a second course goes to the college (S335). Miramar's EMT
# Certification and Driver Operator 1B recommendations sit on EMGM 106 and FIPT 321P, which carry
# their titles, and also on AUTO 156G Engine and Related Systems. A record shared by colleges, a
# course in the same subject with other words, and a course with no partner stay quiet.
import tempfile  # noqa: E402

feed = {"articulations": [
    {"exhibit_id": "X1", "unified_title": "EMT Certification", "earned_by_colleges": ["A College"],
     "credit_recommendations": ["0.3 hours in Perilaryngeal Airway Adjuncts/Defibrillation Training"],
     "local_courses": [{"subject": "EMGM", "number": "106", "title": "Perilaryngeal Airway Adjuncts/Defibrillation Training"}]},
    {"exhibit_id": "X1", "unified_title": "EMT Certification", "earned_by_colleges": ["A College"],
     "credit_recommendations": ["0.3 hours in Perilaryngeal Airway Adjuncts/Defibrillation Training"],
     "local_courses": [{"subject": "AUTO", "number": "156G", "title": "Engine and Related Systems"}]},
    {"exhibit_id": "X2", "unified_title": "NCCER Welding Level 2", "earned_by_colleges": ["A College"],
     "credit_recommendations": ["3 hours in Printreading and Welding Symbols Interpretation"],
     "local_courses": [{"subject": "WELD", "number": "56", "title": "Blueprint Reading (Metal Trades)"},
                       {"subject": "WELD", "number": "52", "title": "Welding Symbols"}]},
    {"exhibit_id": "X3", "unified_title": "POST Basic Academy", "earned_by_colleges": ["A College", "B College"],
     "credit_recommendations": ["3 hours in Community Relations"],
     "local_courses": [{"subject": "AJ", "number": "2", "title": "Administration of Justice"},
                       {"subject": "SOC", "number": "1", "title": "Community Relations"}]},
    {"exhibit_id": "X4", "unified_title": "Lone", "earned_by_colleges": ["A College"],
     "credit_recommendations": ["3 hours in Marine Biology"],
     "local_courses": [{"subject": "AUTO", "number": "1", "title": "Brakes"}]}]}
with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as fh:
    json.dump(feed, fh)
was_artics, b.ARTICS = b.ARTICS, fh.name
try:
    sc = b.second_courses()
finally:
    b.ARTICS = was_artics
    os.unlink(fh.name)
hit = sc.get((b.norm_college("A College"), b.ck("AUTO 156G"))) or []
check(len(hit) == 1 and hit[0]["beside"] == ["EMGM 106"] and hit[0]["credential"] == "EMT Certification",
      "second course: AUTO 156G is named beside EMGM 106 (got %s)" % hit)
check(len(sc) == 1, "second course: the same-subject, shared and partnerless records stay quiet (got %s)" % sorted(sc))
mira = [p for p in progs if p["key"] == "miramar_35030"]
seconds = [g for g in (mira[0]["display"]["gaps"] if mira else []) if g["kind"] == "MAP names a second course"]
check(len(seconds) == 2 and all(g["owner"] == "college" and "AUTO 156G" in g["text"] for g in seconds),
      "Miramar Entrepreneurship carries the two AUTO 156G drafts for the college (got %d)" % len(seconds))
others = [p["key"] for p in progs if p["key"] != "miramar_35030"
          and any(g["kind"] == "MAP names a second course" for g in p["display"]["gaps"])]
check(not others, "no other pilot program carries a second-course draft (got %s)" % others)

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


# Estimated equivalent units for a noncredit program's hours (Sam, 2026-10-11): the lecture rate, Title 5
# section 55002.5, labeled on the pages as for estimating only, not awarded units; Sierra never cites them
# (Sam: "I'm a little afraid they'll be misconstrued as real units rather than estimated equivalents").
# Sam's bands (2026-10-11, lecture rate): 16-18 hours = 1.0, 32-36 = 2.0, 48-54 = 3.0, in half units.
check(b.LECTURE_HOURS_PER_UNIT == (16, 18)
      and [b.equivalent_units(h) for h in (8, 16, 18, 32, 36, 48, 54, 55, 56, 324)] == [0.5, 1, 1, 2, 2, 3, 3, 3, 3.5, 20]
      and b.equivalent_units(None) is None, "hours become estimated equivalent units at the lecture rate, every band whole")
eq_bad = []
for key, d in sql.items():
    e, f = d.get("equivalent_units"), (d.get("figure") or {})
    if f.get("measure") == "hours":
        tmin = (f.get("total") or {}).get("min")
        if not e or e.get("rate") != "lecture" or e.get("hours_per_unit") != [16, 18] or \
                (e.get("total") or {}).get("min") != b.equivalent_units(tmin):
            eq_bad.append(key)
    elif e is not None:
        eq_bad.append(key)
check(not eq_bad and any(d.get("equivalent_units") for d in sql.values()),
      "every noncredit program carries its total as equivalent units, and no units program does: %r" % eq_bad[:5])
chat = open(os.path.join(ROOT, "chatbox", "supabase", "functions", "cpl-chat", "index.ts")).read()
check("equivalent_units" not in chat and "equivalent units" not in chat.lower(),
      "Sierra never reads or names equivalent units (Sam, 2026-10-11)")

names = field_names(read, set()) | field_names(data, set()) | field_names(list(sql.values()), set())
check(not [n for n in names if re.search(r"student|learner_id|ssn|emplid", n, re.I)],
      "no student field in the read or either output")
check(not b.STALL.search(open(receipt).read()) if os.path.exists(receipt) else False,
      "the receipt names no word the Supabase connector holds")

print("\n%d failure(s)" % len(fails))
sys.exit(1 if fails else 0)
