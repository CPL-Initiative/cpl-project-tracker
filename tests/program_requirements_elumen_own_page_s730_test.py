#!/usr/bin/env python3
"""S730 (elumen2): the eLumen follow-up's list, its force list, and Antelope Valley 43150's pin.

    python3 tests/program_requirements_elumen_own_page_s730_test.py

WHY. #3810 bound 38 Antelope Valley programs and 2 at College of the Redwoods to their own pages, and the reads held
each one held_no_gain, so the live row still holds a record read from the sister award's page
(kb/_elumen_own_page_s730.py). A forced read files the own-page record; a live row is replaced only where that record
passes, and never where a person checked it.

  1. The list names exactly the 40 held programs, each with its filed record read from another page than its own.
  2. The force list holds no kept key and no person-settled row, and the dispatch carries the force list; the reread's
     keys are the decided replaces alone. Fed a checked live row and a kept key, both leave the force list.
  3. verdict(): an own-page record that passes replaces; one that fails, or a record from another run or page, keeps.
  4. On the branch, every key not decided replace still holds its filed record from its filed run, so a reread, which
     posts only the newest run's records, cannot post it; a replace holds its own-page record.
  5. 43150's pin: it names the A.S. page; on a stand-in for that page (S721's Electrical Technology A.S. page as page
     read 45381304038 printed it, retitled and carrying 43150's ten listed courses) the pin binds, the same page
     unpinned is refused for a marked degree (rule B reads its GE map), and a pin to the certificate's page is refused
     on its heading. No other Antelope Valley pin moves.
Pure stdlib.
"""
import copy
import gzip
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _elumen_own_page_s730 as E  # noqa: E402
import _program_requirements_college as C  # noqa: E402

FAILS = []
N = [0]


def check(ok, what):
    N[0] += 1
    print(("ok   " if ok else "FAIL ") + what)
    if not ok:
        FAILS.append(what)


LST = json.load(open(E.LIST, encoding="utf-8"))
AV, CR = "Antelope Valley College", "College of the Redwoods"
# The held_no_gain lists of capture 45574354887 (Antelope Valley) and 45574359765 (Redwoods), as filed on main at
# 56c21b96.
HELD = {AV: set("02150 02152 02155 02160 02184 02185 07242 07246 07247 07248 10234 10235 10237 10238 10241 12137 "
                "14790 16468 19460 19463 19464 19465 19467 19469 19470 19471 20149 20159 20162 20163 20175 20179 "
                "20181 20202 20203 43151 43843 45151".split()),
        CR: {"45557", "45595"}}

# ── 1. the list ──────────────────────────────────────────────────────────────────────────────────
for college, want in HELD.items():
    got = {e["control_number"] for e in LST["entries"] if e["college"] == college}
    check(got == want, "1 %s: the list names the %d held programs (%s)" % (college, len(want), sorted(got ^ want)))
other = [e["control_number"] for e in LST["entries"] if e["filed"]["source_url"] == e["own_url"]]
check(not other, "1 each filed record was read from another page than its own (%s)" % other)

# ── 2. the force list ────────────────────────────────────────────────────────────────────────────
for d in LST["dispatch"]:
    college = d["college"]
    force = set(d["force"].split(",")) - {""}
    kept = {e["control_number"] for e in LST["entries"] if e["college"] == college and e["decision"] == "keep"}
    settled = {e["control_number"] for e in LST["entries"] if e["college"] == college and e.get("person_settled")}
    check(force == set(E.force_names(LST, college)), "2 %s: the dispatch's force is the force list" % college)
    check(not force & (kept | settled), "2 %s: no kept key and no person-settled row in the force list (%s)"
          % (college, sorted(force & (kept | settled))))
    rr = set(E.reread_keys(LST, college))
    check(not rr & (kept | settled) and rr <= force | {e["control_number"] for e in LST["entries"]
                                                       if e["decision"] == "replace"},
          "2 %s: the reread's keys are decided replaces alone (%d)" % (college, len(rr)))
    check(set(d["only"].split(",")) == force | set(E.ALSO_READ.get(college, [])),
          "2 %s: only= names the force list and %s" % (college, E.ALSO_READ.get(college, [])))
    check(d["estimate_high_usd"] is not None and d["estimate_high_usd"] <= 40,
          "2 %s: the read's estimate ($%s, high $%s) is within $40" % (college, d["estimate_usd"], d["estimate_high_usd"]))

# Against a fixed list, never the list's own fields (the S731 second reader): no live row of the 40 was checked at the
# conductor's read of 11:24Z, so the force list is the held set, less any key decided keep.
for college, want in HELD.items():
    d = [x for x in LST["dispatch"] if x["college"] == college][0]
    kept = {e["control_number"] for e in LST["entries"] if e["college"] == college and e["decision"] == "keep"}
    check(set(d["force"].split(",")) - {""} == want - kept,
          "2 %s: the force list is the %d held programs less the kept (%s)" % (college, len(want), sorted(kept)))
check(set(LST["dispatch"][0]["only"].split(",")) - set(LST["dispatch"][0]["force"].split(",")) <= {"43150"},
      "2 only= adds 43150 alone beside the force list")

fake = copy.deepcopy(LST)
live = {"rows": [{"college": AV, "cn": "02150", "source_url": "x", "extracted_run": 1, "checked": True},
                 {"college": AV, "cn": "02152", "source_url": "x", "extracted_run": 1, "checked": False}]}
fake = E.settled(fake, live)
for e in fake["entries"]:
    if e["control_number"] == "02155":
        e["decision"] = "keep"
    if e["control_number"] == "02160":
        e["decision"] = "replace"
f = E.force_names(fake, AV)
check("02150" not in f and "02155" not in f and "02152" in f and "02160" in f,
      "2 a checked live row and a kept key leave the force list; an unchecked one and a replace stay")
fd = [d for d in fake["dispatch"] if d["college"] == AV][0]
check("02150" not in fd["force"].split(",") and "02150" not in fd["only"].split(","),
      "2 settled() takes the checked row out of the dispatch's force and only")
check(E.reread_keys(fake, AV) == ["02160"], "2 the reread's keys: the replace alone")

# ── 3. verdict() ─────────────────────────────────────────────────────────────────────────────────
e0 = [e for e in LST["entries"] if e["control_number"] == "02150"][0]
good = {"coverage": {"pass": True, "placed": 8, "listed": 8}, "invented": {"pass": True, "count": 0},
        "arithmetic": {"status": "equal"}}
bad = dict(good, arithmetic={"status": "unequal", "computed": [40, 40], "stated": [60, 60]})
own = {"source_url": e0["own_url"], "extracted_run": 99, "score": good, "record": {"program": {}}}
check(E.verdict(e0, own, "99")[0] == "replace", "3 an own-page record that passes replaces")
v = E.verdict(e0, dict(own, score=bad), "99")
check(v[0] == "keep" and "arithmetic unequal" in v[1], "3 an own-page record that fails keeps, and says why (%s)" % v[1])
check(E.verdict(e0, dict(own, extracted_run=98), "99")[0] == "keep", "3 a record from another run keeps")
check(E.verdict(e0, dict(own, source_url=e0["filed"]["source_url"]), "99")[0] == "keep",
      "3 a record from the sister page keeps")
# 43150 has no live row, so step=load inserts whatever the branch holds: only an own-page record that passes.
pin = LST["pin"]
p_own = {"source_url": pin["url"], "extracted_run": 99, "score": good, "record": {"program": {}}}
check(E.pin_read(pin, p_own, "99")["decision"] == "insert", "3 43150: an own-page record that passes is inserted")
pr = E.pin_read(pin, dict(p_own, score=bad), "99")
check(pr["decision"] == "leave_out" and "arithmetic unequal" in pr["why"],
      "3 43150: an own-page record whose arithmetic fails is left out, and says why (%s)" % pr["why"])
check(E.pin_read(pin, dict(p_own, source_url=pin["filed"]["source_url"]), "99")["decision"] == "leave_out",
      "3 43150: a record from the certificate's page is left out")
fk = copy.deepcopy(LST)
fk["pin"]["read"] = pr
check(E.insert_keys(fk, AV) == [], "3 43150 left out: load has nothing of it to insert")

# ── 4. the branch's records ──────────────────────────────────────────────────────────────────────
wrong = []
for e in LST["entries"]:
    rec = json.load(open(os.path.join(E.folder(E.COLLEGES[e["college"]]), "records", e["control_number"] + ".json")))
    if e["decision"] == "replace":
        ok = rec.get("source_url") == e["own_url"] and (e.get("own_record") or {}).get("score", {}).get("passes_live")
    else:
        ok = rec.get("source_url") == e["filed"]["source_url"] and str(rec.get("extracted_run")) == e["filed"]["extracted_run"]
    if not ok:
        wrong.append(e["control_number"])
check(not wrong, "4 each key not replaced holds its filed record from its filed run; each replace its own page (%s)" % wrong)
r43 = json.load(open(os.path.join(E.folder("antelope_valley"), "records", "43150.json")))
dec = (LST["pin"].get("read") or {}).get("decision")
import _program_requirements_score as SC  # noqa: E402
check((dec == "insert" and r43.get("source_url") == LST["pin"]["url"] and SC.passes_live(r43.get("score")))
      or (dec != "insert" and r43.get("source_url") == LST["pin"]["filed"]["source_url"]),
      "4 43150 on the branch: its own-page record only where it passes (%s), else its filed record, which load skips"
      % dec)

# ── 5. 43150's pin ───────────────────────────────────────────────────────────────────────────────
pins = C.site_pin_entries(AV)
AS = LST["pin"]["url"]
check(pins.get("43150", {}).get("url") == AS and AS.endswith("all-automotive-systems-as-fall-2026"),
      "5 43150 is pinned to the All Automotive Systems A.S. page")
check(set(pins) == {"02145", "02149", "02153", "11647", "11648", "12161", "14414", "15404", "43150"},
      "5 Antelope Valley's pins: S721's eight and 43150 (%s)" % sorted(pins))
S721 = json.load(gzip.open(os.path.join(ROOT, "tests", "fixtures", "program_requirements_lever_pins_s721.json.gz"),
                           "rt", encoding="utf-8"))
avc = S721["colleges"][AV]
elec_url = [u for u in avc["pages"] if u.endswith("electrical-technology-as-fall-2026")][0]
elec = ["ELEC110", "ELEC115", "ELEC120", "ELEC130", "ELEC140", "ELEC150", "ELEC160", "ELEC220", "ELEC250"]  # as printed
codes = ["AUTO100", "AUTO160", "AUTO211", "AUTO220", "AUTO230", "AUTO240", "AUTO250", "AUTO260", "AUTO270", "AUTO280"]
body = avc["pages"][elec_url]["text"].replace("Electrical Technology", "All Automotive Systems")
for old, new in zip(elec, codes):
    body = body.replace(old, new)
body = body.replace(codes[8] + " - Electricians Journeyman Review 3",
                    codes[8] + " - Electricians Journeyman Review 3\n" + codes[9] + " - Automotive Course 4", 1)


def page(url, h1, text):
    got = {"url": url, "final_url": url, "title": h1, "h1": h1, "body": text, "content": text, "links": []}
    return {"url": url, "title": h1, "h1": h1, "body": text, "content": text, "got": got, "codes": C.page_net(got)}


p43150 = {"control_number": "43150", "title": "All Automotive Systems", "award": "A.S. Degree", "shape": "x",
          "status": "Active", "closed_list": [{"code": c} for c in codes], "load_id": "1", C.RC.MARK: True}
pg = page(AS, "All Automotive Systems AS", body)
check(all(c in body for c in codes) and C.RC.page_type(body) == "ge",
      "5 the stand-in page carries the ten listed courses and reads as a general-education page to rule B")
got = C.site_pinned([p43150], [pg], {"43150": pins["43150"]}).get("43150") or {}
check((got.get("best") or {}).get("url") == AS and got["best"]["coverage"] >= C.P.ACCEPT_SHARE,
      "5 pinned, 43150 binds its own page at the accept share (%s)" % got.get("why"))
check(not C.candidates(p43150, [pg], [p43150], {}), "5 unpinned and marked, the same page is no candidate (rule B)")
cert_url = AS.replace("-as-fall-2026", "-cert-fall-2025")
cert = page(cert_url, "All Automotive Systems Cert", body.replace("All Automotive Systems AS", "All Automotive Systems Cert"))
r = C.site_pinned([p43150], [cert], {"43150": {"url": cert_url}}).get("43150") or {}
check("best" not in r and "heading" in (r.get("why") or ""), "5 a pin to the certificate's page is refused on its heading")

print("\n%d checks, %d failed" % (N[0], len(FAILS)))
sys.exit(1 if FAILS else 0)
