#!/usr/bin/env python3
"""kb/_build_program_certs.py: the industry certifications a program connects to (Sam, 2026-11-27).

Failure modes: a credit line written "Computer Information Systems (CIS) 062A" read as no course, or a page line's
"and 2 more" read as a course; a code that differs only by spaces or a leading zero (CIS 062A, CIS 62A) missed; a
credential that gives credit at another college listed here; a credential of another CPL type listed as an industry
certification; an exhibit code built at another college, or one MAP's ?Exhibit= pattern refuses, sent; a certification
in both groups left unmarked; the matcher's known false hits back (ASE inside ASEAN, CNA inside CNAME, AWS standards
or welding symbols read as a certification, an EMT job title read as one, NATEF standards, Amazon's AWS read as the
welding society); a rerun that writes other bytes; a committed file the build would rewrite.

Run from repo root: python3 tests/program_certs_test.py
"""
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _build_program_certs as B  # noqa: E402

results = []


def check(name, cond):
    results.append(bool(cond))
    print(("  ok  " if cond else "FAIL  ") + name)


def keys(line):
    return [k for k, _a, _b in B.find_certs(line)]


# ── Credit lines ─────────────────────────────────────────────────────────────────────────
codes = B.line_codes("CIS 75: 3 hours in Networking; Computer Information Systems (CIS) 062A: 3 hours in ICT "
                     "Essentials; LACCD GE Area 7: 3 hours in Lifelong Learning; and 2 more")
check("a page line: plain code, the (CIS) form, a GE area with a number, never 'and 2 more'",
      codes == ["CIS 75", "CIS 062A", "LACCD GE Area 7"])
check("compact: spaces and the number's leading zeros fold", B.compact("CIS 062A") == B.compact("CIS 62A") == "CIS62A"
      and B.compact("CYBR 106 F") == B.compact("CYBR 106F"))

# ── The build over fixtures ──────────────────────────────────────────────────────────────
PROGRAMS = {
    "alpha": {"college": "Alpha College", "programs": {
        "100": {"codes": {B.compact(c): c for c in ["CIS 62A", "CIS 75", "CYBR 106F"]},
                "outcomes": ["Prepare for the CompTIA A+ and Network+ certification exams."], "careers": []},
        "200": {"codes": {B.compact("ART 1"): "ART 1"}, "outcomes": ["Draw well."], "careers": ["Illustrator"]},
        "300": {"codes": {B.compact("WELD 1"): "WELD 1"}, "outcomes": ["Read American Welding Society welding symbols."],
                "careers": ["EMT"]},
    }},
}
EARNABLE = {
    "Alpha College": [
        {"t": "CompTIA Network+", "i": "CompTIA", "codes": ["CIS 062A"], "exhibits": ["MAPICI-NETP-1-001"]},
        {"t": "Cisco CCNA", "i": "Cisco", "codes": ["CYBR 106 F", "MATH 1"], "exhibits": []},
        {"t": "Art Portfolio", "i": "Alpha College", "codes": ["ART 2"], "exhibits": []},
    ],
    "Beta College": [{"t": "CompTIA A+", "i": "CompTIA", "codes": ["CIS 75"], "exhibits": ["MAPICI-APLUS-1-001"]}],
}
docs, index, stats = B.build(ROOT, programs=PROGRAMS, earnable=EARNABLE)
p100 = docs["alpha"]["programs"]["100"]
earned = {e["t"]: e for e in p100.get("earns_cpl_here", [])}
check("earns: a credential whose line names a program course, matched across the zero and the space",
      set(earned) == {"CompTIA Network+", "Cisco CCNA"} and earned["CompTIA Network+"]["courses"] == ["CIS 62A"]
      and earned["Cisco CCNA"]["courses"] == ["CYBR 106F"])
check("earns: another college's credential is not listed here", "CompTIA A+" not in earned)
prep = {e["key"]: e for e in p100.get("prepares_for", [])}
check("prepares for: A+ and Network+ named, the general CompTIA key dropped",
      set(prep) == {"comptia_aplus", "comptia_network"})
check("both: the Network+ named in the catalog and earned here is marked on both sides",
      prep["comptia_network"].get("both") and earned["CompTIA Network+"].get("both")
      and not prep["comptia_aplus"].get("both") and not earned["Cisco CCNA"].get("both"))
check("the quote is the catalog's line, verbatim", prep["comptia_aplus"]["quote"]
      == "Prepare for the CompTIA A+ and Network+ certification exams." and prep["comptia_aplus"]["from"] == "outcomes")
check("a program with neither group has no entry; nor do welding symbols or an EMT job title",
      "200" not in docs["alpha"]["programs"] and "300" not in docs["alpha"]["programs"])
check("index maps the college to its slug", index == {"colleges": {"Alpha College": "alpha"}})

# ── The adoption page's own reading ──────────────────────────────────────────────────────
import json  # noqa: E402
import tempfile  # noqa: E402
tmp = tempfile.mkdtemp()
os.makedirs(os.path.join(tmp, "library", "adopt"))
os.makedirs(os.path.join(tmp, "kb"))
json.dump({"types": ["Credit By Exam", "Industry Certification"], "colleges": [["Alpha College"], ["Beta College"]],
           "credentials": [
               {"t": "CompTIA Network+", "i": "CompTIA", "y": [1], "a": [[0, 3.0, "CIS 75: 3 hours; and 1 more"]],
                "m": [["MAPICI-NETP-1-001", 0, ""], ["MAPICI-NET(P)-1-001", 0, ""], ["MAPICI-NETB-1-001", 1, ""]]},
               {"t": "Typing by exam", "i": "Alpha College", "y": [0], "a": [[0, 1.0, "BUS 1: 1 hour"]], "m": []},
           ]}, open(os.path.join(tmp, "library", "adopt", "adopt_data.json"), "w"))
json.dump({"colleges": ["Alpha College"], "credentials": {"CompTIA Network+": {"a": {"0": [3.0, [["CIS 75", "3 hours"],
           ["Computer Information Systems (CIS) 062A", "3 hours"]]]}}}}, open(os.path.join(tmp, "kb", "exhibits_adoption.json"), "w"))
got = B.read_earnable(tmp)
alpha = got.get("Alpha College") or []
check("read: Industry Certification only", [e["t"] for e in alpha] == ["CompTIA Network+"])
check("read: the full lines of exhibits_adoption.json over the page's clipped ones, the (CIS) form read",
      alpha and alpha[0]["codes"] == ["CIS 75", "CIS 062A"])
check("read: this college's exhibit codes only, and only those MAP's pattern accepts",
      alpha and alpha[0]["exhibits"] == ["MAPICI-NETP-1-001"])

# ── The matcher's known false hits stay out, its forms stay in ───────────────────────────
for line, want in [
    ("The ASEAN market and CNAME records.", []),
    ("Plan and construct quality products that conform to recognized AWS standards.", []),
    ("Read and interpret American Welding Society welding symbols.", []),
    ("Diagnose vehicles in accordance with NATEF standards.", []),
    ("Diagnose vehicles in accordance with ASE standards.", []),
    ("Deploy certificates for use with AWS services.", []),
    ("EMT", []),
    ("Demonstrate the role of an entry level paramedic. Assessment: Written exams", []),
    ("Perform sanitation according to the Board of Barbering and Cosmetology.", []),
    ("Prepare for the ASE A8 certification.", ["ase"]),
    ("Pass the AWS D1.1 structural welding certification test.", ["aws_weld"]),
    ("Be prepared for the AWS Solutions Architect Associate exam.", ["aws_cloud"]),
    ("Pass the National Registry EMT-B written exam for certification.", ["nremt", "emt"]),
    ("Certified Nursing Assistant", ["cna"]),
    ("Take the NCLEX-PN licensing examination.", ["nclex_pn"]),
    ("Analyze FAA regulations governing licensing of small Unmanned Aerial Systems (sUAS).", ["faa_drone"]),
]:
    check("matcher: %r -> %s" % (line[:60], want or "nothing"), sorted(keys(line)) == sorted(want))

# ── Trained by (S746) ────────────────────────────────────────────────────────────────────
check("trainer: a two-spelling body folds to one key",
      B.agency_key("Ironworkers Joint Apprenticeship and Training Committee")
      == B.agency_key("Ironworker Joint Apprenticeship Training Committee"))
check("trainer: committee words fold to JATC", B.short_name("Ironworker Joint Apprenticeship Training Committee") == "Ironworker JATC")
check("trainer: a trailing acronym is the short name", B.short_name("California Department of Forestry and Fire Protection (CAL FIRE)") == "CAL FIRE")
check("trainer: two committees named as one read as what they share",
      B.short_name("Carpenters Training Committee for Northern California / Southern California Carpenters Joint Apprenticeship")
      == "Carpenters Training Committee")
check("trainer: a bare JATC takes the issuer's acronym",
      B.qualified("Joint Apprenticeship Training Committee (JATC)", "International Brotherhood of Electrical Workers (IBEW)")
      == "IBEW Joint Apprenticeship Training Committee")
for name, ok in [("Ironworker Joint Apprenticeship Training Committee", True), ("Mater Dei High School", False),
                 ("U.S. Armed Forces", False), ("varies by academy", False)]:
    check("trainer: %s %s" % (name, "kept" if ok else "left out"), bool(B.TRAINER_OK.search(name) and not B.NO_ONE.match(name)) == ok)
T_PROG = {"codes": {B.compact("IWAP 40.50"): "IWAP 40.50", B.compact("IWAP 40.07"): "IWAP 40.07"}}
T_ROWS = [{"t": "Cranes", "codes": ["IWAP 40.50"]}, {"t": "Period 1", "codes": ["IWAP 40.07", "IWAP 40.50", "MATH 1"]},
          {"t": "AP Biology", "codes": ["IWAP 40.07"]}, {"t": "Rigging", "codes": ["WELD 1"]}]
T_TRAIN = {"Cranes": "Ironworker Joint Apprenticeship Training Committee",
           "Period 1": "Ironworkers Joint Apprenticeship and Training Committee",
           "Rigging": "Ironworker Joint Apprenticeship Training Committee"}
tb = B.trained_by(T_PROG, T_ROWS, T_TRAIN)
check("trainer: one entry for the body, both spellings' credentials in it", len(tb) == 1 and [c["t"] for c in tb[0]["creds"]] == ["Cranes", "Period 1"])
check("trainer: the spelling more credentials carry", tb and tb[0]["a"] == "Ironworker Joint Apprenticeship Training Committee" and tb[0]["s"] == "Ironworker JATC")
check("trainer: the program's courses only, a credential with none left out",
      tb and tb[0]["courses"] == ["IWAP 40.07", "IWAP 40.50"] and tb[0]["creds"][1]["courses"] == ["IWAP 40.07", "IWAP 40.50"])

# ── Bytes ────────────────────────────────────────────────────────────────────────────────
again = B.build(ROOT, programs=PROGRAMS, earnable=EARNABLE)
check("the same inputs write the same bytes", B.dump(again[0]["alpha"]) == B.dump(docs["alpha"]))
r = subprocess.run([sys.executable, os.path.join(ROOT, "kb", "_build_program_certs.py"), "--check"], cwd=ROOT,
                   capture_output=True, text=True)
check("the committed files are current (" + (r.stdout.strip() or r.stderr.strip())[:120] + ")", r.returncode == 0)

print("%d/%d checks passed: program certs" % (sum(results), len(results)))
sys.exit(0 if all(results) else 1)
