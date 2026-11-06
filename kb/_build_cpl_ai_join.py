"""
The 115 CPL-AI certifications joined to the common exhibits (Sam, 2026-11-06, SkyLantern: "go ahead and join the 115
to common exhibits").

A common exhibit is a canonical credential in kb/credentials.json; the college-entered titles behind it are in
kb/unified_titles.json. Each certification below was judged by hand in session, from a ranked candidate list (title
tokens, a code that must agree: A4, AZ-900, Grade II) and the college titles behind each candidate. Four kinds:

  exact        the exhibit's own identity is this certification (versions folded, as the reference already folds
               Office 2019 and Microsoft 365 Apps under one exam).
  named_under  a college title names this certification, but the reference filed it under a broader or mistitled
               exhibit; shown, and flagged for a title fix in the CER (the reference is staging: re-titles are
               permitted under the playbook, never done here).
  related      a different credential in the same family or from the same program; shown as a lead, never as the
               certification's exhibit.
  (absent)     no exhibit holds it yet: 61 of 115 on 2026-11-06.

The seven first found named_under (2026-11-06) moved to their own exhibits by the CER plan of the same day; until the
nightly fold makes those titles, --check accepts a title a committed CER plan assigns and says it waits.

These are a session's judgments, recorded with a reason each; a curator's correction wins (CLAUDE.md, "their domain
knowledge outranks your inference"). The file also resolves CPL-AI's 121 college names to MAP's names through the
college identity crosswalk, so the view can say which colleges with a strong course already award the credential.

    python3 kb/_build_cpl_ai_join.py           # write kb/cpl_ai/exhibit_join.json
    python3 kb/_build_cpl_ai_join.py --check   # every exhibit named still exists; every code is a CPL-AI code
"""
import json
import os
import sys
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from _build_cpl_ai import college_key  # noqa: E402

OUT = os.path.join(HERE, "cpl_ai", "exhibit_join.json")
INDEX = os.path.join(HERE, "cpl_ai", "hosted", "index.json")
CREDS = os.path.join(HERE, "credentials.json")
CROSSWALK = os.path.join(HERE, "college_identity", "2026-08-23", "crosswalk.json")
ADOPT = os.path.join(HERE, "..", "library", "adopt", "adopt_data.json")
DECIDED = "SkyLantern session, 2026-11-06, at Sam's ask; a curator's correction wins"

MOS = "Versions folded: the reference holds Office 2019 and Microsoft 365 Apps under one exam, as the college titles show."
ASE = "The ASE area code agrees, and the college titles behind the exhibit name the same test."
SAME = "Same title and issuer."
WW2 = "Wastewater Treatment Plant Operator Certificate, Grade II or Higher"
WW4 = "Wastewater Treatment Plant Operator Certificate, Grade IV or Higher"
PLANS = os.path.join(HERE, "cer_decisions_out")

# code: (kind, [exhibits], reason)
J = {
    "ase1": ("exact", ["ASE A1 — Engine Repair"], ASE),
    "ase2": ("exact", ["ASE A2 — Automatic Transmission/Transaxle"], ASE),
    "ase3": ("exact", ["ASE A3 — Manual Drive Train and Axles"], ASE),
    "ase4": ("exact", ["ASE A4 — Suspension and Steering"], ASE),
    "ase5": ("exact", ["ASE A5 — Brakes"], ASE),
    "ase6": ("exact", ["ASE A6 — Electrical/Electronic Systems"], ASE),
    "ase7": ("exact", ["ASE A7 — Heating and Air Conditioning"], ASE),
    "ase8": ("exact", ["ASE A8 — Engine Performance"], ASE),
    "ase9": ("exact", ["ASE A9 — Light Vehicle Diesel Engines"], ASE),
    "ase10": ("exact", ["ASE L3 — Light Duty Hybrid/Electric Vehicle Specialist"], ASE),
    "comptia1": ("exact", ["CompTIA A+"], SAME),
    "comptia3": ("exact", ["CompTIA Cloud+"], SAME),
    "comptia4": ("exact", ["CompTIA Cloud Essentials+"], SAME),
    "comptia5": ("exact", ["CompTIA CySA+"], SAME),
    "comptia9": ("exact", ["CompTIA Linux+"], SAME),
    "comptia10": ("exact", ["CompTIA Network+"], SAME),
    "comptia11": ("exact", ["CompTIA PenTest+"], SAME),
    "comptia12": ("exact", ["CompTIA Project+"], SAME),
    "comptia13": ("exact", ["CompTIA Server+"], SAME),
    "comptia14": ("exact", ["CompTIA Security+"], SAME),
    "comptia15": ("exact", ["CompTIA Tech+"], SAME),
    "microsoft1": ("exact", ["Microsoft Certified: Azure AI Fundamentals"], "Same exam (AI-900)."),
    "microsoft2": ("exact", ["Microsoft Certified: Azure Fundamentals (AZ-900)"], "Same exam (AZ-900)."),
    "microsoft8": ("exact", ["Microsoft Office Specialist — Word"], MOS),
    "microsoft13": ("exact", ["Microsoft Office Specialist — Word"], MOS),
    "microsoft9": ("exact", ["Microsoft Office Specialist — Excel"], MOS),
    "microsoft14": ("exact", ["Microsoft Office Specialist — Excel"], MOS),
    "microsoft10": ("exact", ["Microsoft Office Specialist — PowerPoint"], MOS),
    "microsoft11": ("exact", ["Microsoft Office Specialist — Word Expert"], "Same exam (MO-101)."),
    "microsoft12": ("exact", ["Microsoft Office Specialist — Excel Expert"], "Same exam (MO-211)."),
    "adobe8": ("exact", ["Adobe Certified Professional — Visual Design (Photoshop)"], "A college title names this exam word for word."),
    "adobe1": ("exact", ["Adobe Certified Professional — Acrobat"], "Adobe's Acrobat Pro professional certification; the exhibit is its only Acrobat identity."),
    "autodesk1": ("exact", ["Autodesk Certified User/Professional — AutoCAD"], "Autodesk's AutoCAD certification; the exhibit folds User and Professional."),
    "autodesk5": ("exact", ["Autodesk Certified User/Professional — Revit Architecture"], "Autodesk's Revit certification; the exhibit folds User and Professional."),
    "certiport1": ("exact", ["Entrepreneurship and Small Business (ESB) Certification"], SAME),
    "intuit1": ("exact", ["Intuit QuickBooks Online Certified User"], SAME),
    "intuit2": ("exact", ["Intuit Certified Bookkeeping Professional"], SAME),
    "rda1": ("exact", ["Registered Dental Assistant (RDA) License"], "The Dental Board of California's RDA license."),
    "servsafe1": ("exact", ["ServSafe Food Protection Manager Certification", "ServSafe Food Protection Manager"],
                  "The reference holds two exhibits for this one certification; the first carries the college titles, the second a course's. A fold for the CER."),
    # Formerly named under another exhibit; moved to their own by the CER plan kb/cer_decisions_out/2026-11-06 (Sam, same
    # day: "go ahead and make the seven title fixes in the CER"). Exact once the nightly fold re-points them.
    "ace1": ("exact", ["ACE Certified Personal Trainer"], "ACE's Personal Trainer Certification, moved by the CER plan of 2026-11-06 from Personal Training Certification."),
    "acsm1": ("exact", ["ACSM Certified Personal Trainer (ACSM-CPT)"], "ACSM-CPT, moved by the CER plan of 2026-11-06 from Personal Trainer Instructor."),
    "nasm1": ("exact", ["NASM Certified Personal Trainer (NASM-CPT)"], "NASM-CPT, moved by the CER plan of 2026-11-06 from Personal Trainer Instructor."),
    "wwtp2": ("exact", [WW2], "The exhibit accepts the State Water Board's grade II or any higher one; moved by the CER plan of 2026-11-06 from Wastewater Treatment 1."),
    "wwtp3": ("exact", [WW2], "The exhibit accepts the State Water Board's grade II or any higher one; moved by the CER plan of 2026-11-06 from Wastewater Treatment 1."),
    "wwtp4": ("exact", [WW4, WW2], "Both exhibits accept grade IV; moved by the CER plan of 2026-11-06 from Wastewater Treatment 1 and 2."),
    "wwtp5": ("exact", [WW4, WW2], "Both exhibits accept grade V; moved by the CER plan of 2026-11-06 from Wastewater Treatment 1 and 2."),
    # related: same family or program, a different credential.
    "aws1": ("related", ["AWS D1.1 Structural Welder Qualification"], "AWS's welder qualification under D1.1; the Certified Welder program is a different credential."),
    "autodesk2": ("related", ["Autodesk Certified User"], "The exhibit is Autodesk Certified User with no product named."),
    "autodesk3": ("related", ["Autodesk Certified User"], "The exhibit is Autodesk Certified User with no product named."),
    "autodesk4": ("related", ["Autodesk Certified User"], "The exhibit is Autodesk Certified User with no product named."),
    "autodesk6": ("related", ["Autodesk Certified User"], "The exhibit is Autodesk Certified User with no product named."),
    "mssc1": ("related", ["MSSC Certified Production Technician (CPT) — Machinist"], "MSSC's CPT under a title that mixes a military machinist designation."),
    "servsafe2": ("related", ["Food Handler Card"], "California's food handler card, which a ServSafe Food Handler course can lead to; a different credential."),
    "wwtp1": ("related", ["Wastewater Treatment Plant Operator Grade 1"], "CWEA's grade 1, a different issuer from the State Water Board's Grade I certificate."),
}


def colleges_map(names):
    """CPL-AI college names to MAP's names, through the identity crosswalk; None where MAP has no such college."""
    cw = json.load(open(CROSSWALK, encoding="utf-8"))["colleges"]
    adopt = {college_key(c[0]): c[0] for c in json.load(open(ADOPT, encoding="utf-8"))["colleges"]}

    def k(n):
        return college_key(n.replace("Mount ", "Mt. "))
    v = {}
    for r in cw:
        for n in [r["college_name"], r.get("short"), r.get("mis_name")] + list(r.get("variants") or []):
            if n:
                v.setdefault(k(n), r["college_name"])
    out = {}
    for n in names:
        m = v.get(k(n)) or adopt.get(k(n))
        out[n] = adopt.get(k(m)) if m else None
    return out


def build():
    index = json.load(open(INDEX, encoding="utf-8"))
    titles = {c["code"]: c["title"] for c in index["credentials"]}
    joins = {code: {"kind": kind, "exhibits": ex, "reason": why} for code, (kind, ex, why) in sorted(J.items())}
    kinds = Counter(j["kind"] for j in joins.values())
    return {
        "_about": ("The 115 CPL-AI certifications joined to the common exhibits (kb/credentials.json), by "
                   "kb/_build_cpl_ai_join.py. Kinds: exact, named_under (flagged for a title fix), related. " + DECIDED + "."),
        "decided": DECIDED,
        "counts": {"certifications": len(titles), "exact": kinds["exact"], "named_under": kinds["named_under"],
                   "related": kinds["related"], "none": len(titles) - len(joins)},
        "joins": joins,
        "colleges": colleges_map(index["colleges"]),
    }


def pending_titles():
    """Titles a committed CER plan assigns that the nightly fold has not made yet: an exhibit named here may wait on one."""
    out = set()
    for d in sorted(os.listdir(PLANS)) if os.path.isdir(PLANS) else []:
        p = os.path.join(PLANS, d, "plan.json")
        if os.path.exists(p):
            for r in json.load(open(p, encoding="utf-8")).get("rows") or []:
                if r.get("field") in ("unified_title_assignment", "unified_title_override"):
                    out.add(r.get("value"))
    return out


def check():
    creds = json.load(open(CREDS, encoding="utf-8"))
    pending = pending_titles()
    codes = {c["code"] for c in json.load(open(INDEX, encoding="utf-8"))["credentials"]}
    bad = [code for code in J if code not in codes]
    named = {e for kind, ex, why in J.values() for e in ex}
    gone = sorted(e for e in named if e not in creds and e not in pending)
    waiting = sorted(e for e in named if e not in creds and e in pending)
    have = json.load(open(OUT, encoding="utf-8")) if os.path.exists(OUT) else None
    if bad or gone or have is None or have.get("joins") != build()["joins"]:
        print("cpl-ai join: " + "; ".join(filter(None, [
            bad and "not CPL-AI codes: %s" % bad,
            gone and "exhibits no longer in kb/credentials.json (re-titled or merged? update J): %s" % gone,
            (have is None or have.get("joins") != build()["joins"]) and "exhibit_join.json is stale; rerun the builder"])))
        return 1
    c = have["counts"]
    print("cpl-ai join ok: %d exact, %d named under another exhibit, %d related, %d with no exhibit%s"
          % (c["exact"], c["named_under"], c["related"], c["none"],
             "; %d exhibit(s) wait on the nightly fold of a committed CER plan" % len(waiting) if waiting else ""))
    return 0


def main(argv):
    if "--check" in argv:
        return check()
    out = build()
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
        f.write("\n")
    c = out["counts"]
    unresolved = [k for k, v in out["colleges"].items() if v is None]
    print("cpl-ai join: %d exact, %d named_under, %d related, %d none; %d of %d colleges resolve to MAP (%s unresolved)"
          % (c["exact"], c["named_under"], c["related"], c["none"], len(out["colleges"]) - len(unresolved),
             len(out["colleges"]), ", ".join(unresolved)))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
