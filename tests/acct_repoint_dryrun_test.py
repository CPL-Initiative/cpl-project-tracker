#!/usr/bin/env python3
"""kb/_acct_repoint_dryrun.py on fixtures. The failure it guards first: a row a person settled (a discipline overlay,
or a merge into a record that does not move) showing up in the alias map. Then: a homonym college code never counts
as accounting, a shell never leaves its merge target, a slot an earlier re-mint vacated is never taken (except by the
row that held it), a non-accounting title on an accounting code stays, and an Honors id moves with its base."""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), "kb"))
import _acct_repoint_dryrun as ar  # noqa: E402

fails = []


def check(ok, msg):
    print(("ok   " if ok else "FAIL ") + msg)
    if not ok:
        fails.append(msg)


def m(college, subject):
    return {"college": college, "subject": subject, "control_number": college[:3] + subject, "units": 3.0}


def rec(title, disc="Business", **kw):
    r = {"common_title": title, "discipline": disc}
    r.update(kw)
    return r


courses = {
    "BUSI M1001": rec("Financial Accounting"),
    "BUSI M1001H": rec("Honors Financial Accounting"),
    "BUSI M1002": rec("Managerial Accounting"),               # a person set Business: held
    "BUSI M1003": rec("Cost Accounting"),                     # a person merged it into BSOT M1005: held
    "BSOT M1005": rec("Office Accounting Basics", disc="Business Office Technology"),
    "BUSI M1004": rec("Accounting Principles"),               # a bot merged it into BUSI M1001: moves with it (family 3 of 5 accounting, with the Honors id)
    "BUSI M1006": rec("Strategies for College Success"),      # Copper Mountain's ACC: a homonym
    "BUSI M1007": rec("Personal Finance"),                    # on ACCT, reads as another subject: flagged
    "BUSI M1008": rec("Payroll Accounting", _subj4_fold_from="ACCT M1008"),   # returns home
    "BUSI M1009": rec("Business Mathematics"),                # on ACCTG, neutral title: moves (the brief's example)
    "BUSI M1010": rec("Introduction to Business"),            # no accounting course: untouched
}
memberships = {
    "BUSI M1001": [m("A College", "ACCT"), m("B College", "ACCTG"), m("C College", "BUS")],
    "BUSI M1001H": [m("A College", "ACCT")],
    "BUSI M1002": [m("A College", "ACCT"), m("B College", "ACCTG")],
    "BUSI M1003": [m("D College", "ACTG"), m("E College", "ACC")],
    "BSOT M1005": [m("F College", "BSOT")],
    "BUSI M1004": [m("G College", "BUS")],
    "BUSI M1006": [m("Copper Mountain College", "ACC"), m("Copper Mountain College", "ACC")],
    "BUSI M1007": [m("A College", "ACCT"), m("B College", "Accounting (ACCTG)")],
    "BUSI M1008": [m("A College", "ACCT"), m("D College", "ACTG")],
    "BUSI M1009": [m("B College", "ACCTG"), m("A College", "ACCT")],
    "BUSI M1010": [m("C College", "BUS")],
}
curations = {
    "BUSI M1002": {"discipline": "Business", "reviewed_by": "curator@college.edu"},
    "BUSI M1003": {"merge_into": "BSOT M1005", "reviewed_by": "curator@college.edu"},
    "BUSI M1004": {"merge_into": "BUSI M1001", "reviewed_by": "automerge-titlelane-v1@bot"},
}
decisions = {"statewide": [{"code": "ACCT", "discipline": "Business", "who": "a reviewer", "at": "2026-11-24"}]}
vacated = {"ACCT M1001", "ACCT M1004", "ACCT M1008"}

plan = ar.compute_plan(courses, {}, memberships, curations, decisions, {}, [], vacated=vacated)
alias = plan["alias"]
held = {i for h in plan["held"] for i in h["ids"]}
flagged = {i for f in plan["flagged"] for i in f["ids"]}

check("BUSI M1002" not in alias and "BUSI M1002" in held, "a person's discipline overlay holds the row out of the map")
check("BUSI M1003" not in alias and "BUSI M1003" in held, "a person's merge into a record that stays holds the shell")
h3 = next((h for h in plan["held"] if "BUSI M1003" in h["ids"]), {})
check((h3.get("curator") or {}).get("BUSI M1003", {}).get("merge_into") == "BSOT M1005", "the hold names the curator's value")
check("BUSI M1004" in alias and "BUSI M1001" in alias, "a shell moves with its target, though its own courses are BUS")
check("BUSI M1006" not in alias and "Copper Mountain College|ACC" in plan["homonyms"], "a homonym code is not accounting")
check("BUSI M1007" not in alias and "BUSI M1007" in flagged, "a title that reads as another subject stays, flagged")
check(alias.get("BUSI M1009") == "ACCT M1009", "a Business Math course on ACCTG moves and keeps its number")
check("BUSI M1010" not in alias, "an identity with no accounting course is untouched")
check(not (set(alias.values()) & (vacated - {"ACCT M1008"})), "no new id lands on a vacated slot")
check(alias.get("BUSI M1008") == "ACCT M1008" and "BUSI M1008" in plan["returned_home"], "a row returns to its own old id")
check(alias.get("BUSI M1001H") == alias.get("BUSI M1001", "") + "H", "an Honors id moves with its base")
check(all(v.get("pass") for v in plan["validation"].values()), "the plan's validation passes")
check(not plan["gates"]["G1_statewide_filings"]["pass"], "a person's statewide filing under Business keeps the apply gate open")
check(not (set(alias) & (held | flagged)), "held and flagged ids never appear in the map")

print(f"\n{'FAIL' if fails else 'PASS'}: {len(fails)} failure(s)")
sys.exit(1 if fails else 0)
