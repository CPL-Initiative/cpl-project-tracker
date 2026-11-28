#!/usr/bin/env python3
"""kb/_alignment_remint_dryrun.py on fixtures (S749, r-full-remint-for-new-joins-sam-2026-11-28). Each check goes red
if its guard is removed: no M-ID under two codes, no proposed code on another discipline's code or an existing M-ID
prefix, a forwarding row for every planned id, a person's row or code flagged and never moved, every alignment change
carried, and Sam's four noncredit codes kept."""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), "kb"))
import _alignment_remint_dryrun as ar  # noqa: E402
import _authority_recode_dryrun as rec  # noqa: E402

fails = []


def check(ok, msg):
    print(("ok   " if ok else "FAIL ") + msg)
    if not ok:
        fails.append(msg)


def row(disc=None, title="T", **kw):
    r = {"discipline": disc, "common_title": title}
    r.update(kw)
    return r


BOT = {"reviewed_by": "csr@bot"}


def seed():
    s = {
        "Dietetics/Nutritional Science": {"canonical_subj4": "NUTR", **BOT},
        "Nutritional Science/Dietetics": {"canonical_subj4": "FDNT", **BOT},
        "Aeronautics": {"canonical_subj4": "AERO", **BOT},
        "Aviation": {"canonical_subj4": "AVIA", **BOT},
        "Photography": {"canonical_subj4": "PHOT", **BOT},
        "Photographic Technology/ Commercial Photography": {"canonical_subj4": "CPHT", **BOT},
        "Public Relations": {"canonical_subj4": "PREL", **BOT},
        "Travel Services": {"canonical_subj4": "TRVL", **BOT},
        "Flight Attendant Training": {"canonical_subj4": "FLTR", "reviewed_by": "Sam (in session, S717)"},
        "Foreign Languages": {"canonical_subj4": "FLNG", "umbrella_codes": ["FLTA"], **BOT},
    }
    for d, c in ar.SETTLED_CODES.items():
        s[d] = {"canonical_subj4": c, "reviewed_by": "Sam (in session, S705)"}
    return s


RECEIPT = {"changed": [{"discipline": "Photographic Technology/ Commercial Photography", "from": "PHTC", "to": "CPHT"}],
           "held": [{"discipline": "Aeronautics", "from": "AERO", "to": "AERN"},
                    {"discipline": "Flight Attendant Training", "from": "FLTR", "to": "FLTA"},
                    {"discipline": "Home Economics: Noncredit", "from": "HMEN", "to": "HECN"}],
           "added": []}


def courses():
    return {
        "NUTR M1001": row("Dietetics/Nutritional Science", "Nutrition"),     # FDNT M1001 is taken: gap-fill
        "NUTR M1002": row("Dietetics/Nutritional Science", "Diet"),          # FDNT M1002 free: keeps its number
        "FDNT M1001": row("Nutritional Science/Dietetics", "Basic Nutrition"),
        "AERO M1001": row(None, "AS100", subject="AEROST"),
        "PUBR M1001": row(None, "Principles of Public Relations", subject="PUB REL"),
        "TOUR M1001": row(None, "Travel", subject="TOUR"),
        "FLTA M1001": row("Foreign Languages", "Filipino 1"),
        "AVIA M1001": row("Aviation", "Flight"),
    }


def singletons():
    return {"PHTC M10AB": row(None, "Studio Lighting", subject="PHTC", college="Moorpark College"),
            "NUTR M10AA": row("Dietetics/Nutritional Science", "Sports Nutrition", college="X")}


def plan(c=None, s=None, cur=None, sd=None, receipt=None, decisions=None, minted=()):
    return ar.compute_plan(courses() if c is None else c, singletons() if s is None else s, cur or {}, {},
                           sd or seed(), receipt or RECEIPT, {"aliases": {}}, decisions or {"statewide": []}, {},
                           {}, minted=minted)


def ok(p, k):
    return p["validation"][k]["pass"]


# 1. The baseline plan passes every gate and moves each id once, onto its scope's code.
p = plan()
check(all(v["pass"] for v in p["validation"].values()), "the fixture plan passes every gate")
check(p["moves"]["NUTR M1002"]["new_id"] == "FDNT M1002" and p["moves"]["NUTR M1002"]["how"] == "kept number",
      "a free number is kept (NUTR M1002 -> FDNT M1002)")
check(p["moves"]["NUTR M1001"]["new_id"] != "FDNT M1001" and p["moves"]["NUTR M1001"]["new_id"].startswith("FDNT M1"),
      "a taken number gap-fills (FDNT M1001 already exists)")
check(p["moves"]["PHTC M10AB"]["new_id"].startswith("PHOT ") and p["moves"]["AERO M1001"]["new_id"] == "AERN M1001",
      "PHTC goes to PHOT, AERO to AERN")
check("FLTA M1001" not in p["moves"] and "AVIA M1001" not in p["moves"] and "FDNT M1001" not in p["moves"],
      "every other M-ID is left alone")
check(p["moves"]["NUTR M1002"]["discipline_after"] == "Nutritional Science/Dietetics",
      "the fold's rows join Nutritional Science/Dietetics")

# 2. No M-ID under two codes: an allocator that hands out a live id is caught.
real_free = rec.Allocator.free
rec.Allocator.free = lambda self, key: True
try:
    p2 = plan()
finally:
    rec.Allocator.free = real_free
check(not ok(p2, "V1_each_id_one_new_id_unique_and_free"),
      "V1 catches a new id that is already live (NUTR M1001 onto the live FDNT M1001)")
real_place = rec.Allocator.place
rec.Allocator.place = lambda self, old, pre, prefer_keep=True, reason="": ("FDNT M1002", "gap-filled")
try:
    p3 = plan()
finally:
    rec.Allocator.place = real_place
check(not ok(p3, "V1_each_id_one_new_id_unique_and_free"), "V1 catches two ids given one new id")

# 3. No proposed code collides with an existing M-ID prefix or a code another discipline holds.
c = courses()
c["AERN M1005"] = row("Aviation", "an Aviation id already on AERN")
check(not ok(plan(c=c), "V5_codes_free"), "V5 catches a target code that already prefixes another discipline's M-IDs")
sd = seed()
sd["Tourism"] = {"canonical_subj4": "TRVL", **BOT}
check(not ok(plan(sd=sd), "V5_codes_free"), "V5 catches a target code another discipline holds")
c = courses()
c["FLTR M1001"] = row(None, "stray on FLTR")
check(not ok(plan(c=c), "V5_codes_free"), "V5 catches a chosen code (FLTR) that an M-ID already starts with")

# 4. Every planned retired id has a forwarding row, and only those.
rows = ar.forwarding_rows(p)
planned = {k for k, v in p["moves"].items() if v["status"] != "held_person"}
check({r[0] for r in rows} == planned and all(r[1] == p["moves"][r[0]]["new_id"] for r in rows),
      "the forwarding draft has one row per planned id, to its new id")
check(ar.render_forwarding(p).splitlines()[0] == ",".join(ar.FORWARDING_HEADER), "the forwarding header is old_mid,new_mid,reason,date")

# 5. A person's row is flagged, never changed.
cur = {"NUTR M1002": {"unified_title": "Diet Planning", "reviewed_by": "map@rccd.edu"},
       "CN:X|1": {"merge_into": "TOUR M1001", "reviewed_by": "jessica@rccd.edu"}}
p5 = plan(cur=cur)
check(p5["moves"]["NUTR M1002"]["status"] == "held_person" and "NUTR M1002" not in p5["alias"],
      "a person's curation row holds its M-ID out of the plan")
check(p5["moves"]["TOUR M1001"]["status"] == "held_person" and "TOUR M1001" not in p5["alias"],
      "a person's pointer at an M-ID holds it out of the plan")
check(not any(r[0] in ("NUTR M1002", "TOUR M1001") for r in ar.forwarding_rows(p5)), "held ids take no forwarding row")
sd = seed()
sd["Dietetics/Nutritional Science"]["reviewed_by"] = "map@rccd.edu"
p6 = plan(sd=sd)
check(any(x["scope"] == "nutr-fold" for x in p6["conflicts"])
      and all(v["status"] == "needs_yes" for v in p6["moves"].values() if v["scope"] == "nutr-fold"),
      "a person-curated code the fold retires goes on the yes/no list and its rows wait on the yes")
dec = {"statewide": [{"code": "PUB REL", "discipline": "Journalism", "who": "a reviewer", "at": "2026-11-24"}]}
p7 = plan(decisions=dec)
check(p7["moves"]["PUBR M1001"]["status"] == "needs_yes" and p7["moves"]["TOUR M1001"]["status"] == "planned",
      "a person's filing of a row's local subject flags that row alone")
minted = [{"mq_discipline": "Flight Attendant Training", "proposed_code": "FLTA"}]
p8 = plan(minted=minted)
check(any(x["kind"] == "minted_vs_person" and x["kept"] == "FLTR" for x in p8["conflicts"])
      and not any(v["code_before"] == "FLTR" for v in p8["moves"].values()),
      "a minted-list code against a person's code is a conflict, never a change")

# 6. Every alignment change is carried, and the four noncredit codes are kept.
r = dict(RECEIPT, changed=RECEIPT["changed"] + [{"discipline": "Aviation", "from": "AVIA", "to": "AVTN"}])
check(not ok(plan(receipt=r), "V0_every_alignment_change_is_carried"), "V0 catches a code change no scope carries")
sd = seed()
sd["Home Economics: Noncredit"]["canonical_subj4"] = "HECN"
check(not ok(plan(sd=sd), "V7_person_settled_codes_kept"), "V7 catches a person-settled noncredit code that moved")
check(ok(plan(), "V7_person_settled_codes_kept") and "HMEN" not in plan()["detected"],
      "the held HMEN -> HECN is a person's code kept, not a change to carry")

print(f"\n{len(fails)} failure(s)")
sys.exit(1 if fails else 0)
