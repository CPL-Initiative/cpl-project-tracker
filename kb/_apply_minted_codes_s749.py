#!/usr/bin/env python3
"""Apply COBIx's minted common codes (Sam's 2026-11-28 ruling, every official MQ discipline its own common code; #3951).

SOURCE. kb/subject_title_hunt/minted_codes.csv (mq_discipline, proposed_code, basis, section). For each discipline the
Common Subjects Reference (kb/discipline_canonical_subj4.json) holds under another code, the code changes to the
proposed one, unless it is HELD:
  - the code it leaves prefixes M-IDs (Aeronautics AERO, 1 M-ID): a change re-keys M-IDs, which is the re-mint
    playbook's (docs/coursecontrolnumber_remint.md), never this script's;
  - the proposed code already prefixes M-IDs (FLTA is Foreign Languages'; PUBR and TOUR carry none we can place), the
    proposer's own rule (kb/_csr_propose_codes.py);
  - the proposed code is another discipline's;
  - a person's curator row (kb_curation _CANON_SUBJ4::) names the discipline's code: checked live at S749, none did.
Two disciplines the file lacks are added, each with its own code (Sam's Asian American Studies ruling, and the
mint-every-MQ rule): Asian American Studies ASAM and African American Studies AFAM, and both leave the Ethnic Studies
alias in kb/discipline_aliases.json. Speech Communication becomes an alias of Communication Studies. Physical Education
stays an alias of Kinesiology (kin_pe_convergence); no pick names PHED or SPIN, so neither is minted. The NUTR fold into
FDNT is held: NUTR prefixes 54 M-IDs.

RECEIPT. kb/receipts/minted_codes_s749.json: each change with its before-value; `git revert` of the commit undoes it.
Run: python3 kb/_apply_minted_codes_s749.py [--apply] [--receipt kb/receipts/<name>.json]

A LATER PASS (S749, the re-mint apply kb/_alignment_remint_apply.py). Once a re-mint moves a held code's M-IDs (AERO's
nine Air Force ROTC ids went to MILS), the same run changes the code (Aeronautics AERO -> AERN). That pass writes its own
receipt (--receipt), so the first pass's before-values stay where kb/subject_decisions.py and the dry run read them.
A code the re-mint ruling chose over the minted list stays after its M-IDs move (RULED: FLTR, PREL, TRVL; Sam,
2026-11-28, r-remint-dryrun-defaults-sam-2026-11-28). A prefix counts the stand-alone M-IDs as well as the catalog's:
AERO had 1 catalog id and 8 stand-alone ones.
"""
import csv
import json
import os
import sys
from collections import Counter
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _csr_assign_codes as A  # noqa: E402
from _apply_canonical_subj4 import record_former  # noqa: E402  (the nightly sync's "formerly" record)

CANON = os.path.join(ROOT, "kb", "discipline_canonical_subj4.json")
ALIASES = os.path.join(ROOT, "kb", "discipline_aliases.json")
MINTED = os.path.join(ROOT, "kb", "subject_title_hunt", "minted_codes.csv")
MINTS = os.path.join(ROOT, "kb", "coci_minted_courses.json")
SINGLETONS = os.path.join(ROOT, "kb", "coci_minted_singletons.json")
RECEIPT = os.path.join(ROOT, "kb", "receipts", "minted_codes_s749.json")
# Codes a person named (Person-settled wins): Sam's four noncredit MQ codes, r-noncredit-four-mq-codes-sam-2026-11-22.
PERSON_NAMED = {"CTZN", "HLSN", "HMEN", "DSPN"}
NEW = {"Asian American Studies": "ASAM", "African American Studies": "AFAM"}
# The codes the re-mint ruling chose where the minted list's proposal collided. Each stays after its M-IDs move (Sam,
# 2026-11-28, r-remint-dryrun-defaults-sam-2026-11-28: "fine on defaults"; COBIx agrees).
RULED = {"Flight Attendant Training": "FLTR", "Public Relations": "PREL", "Travel Services": "TRVL"}


def plan():
    doc = json.load(open(CANON, encoding="utf-8"))
    D = doc["disciplines"]
    pref = Counter()
    for path in (MINTS, SINGLETONS):
        if os.path.exists(path):
            ids = json.load(open(path, encoding="utf-8"))
            pref.update(k.split(" M")[0] for k in (ids.get("courses") or ids))
    used = {v["canonical_subj4"]: k for k, v in D.items()}
    change, held = [], []
    for r in csv.DictReader(open(MINTED, encoding="utf-8")):
        d, code = r["mq_discipline"].strip(), r["proposed_code"].strip().upper()
        cur = (D.get(d) or {}).get("canonical_subj4")
        if not cur or cur == code:
            continue
        why = None
        if cur in PERSON_NAMED:
            why = "%s is a code Sam named on 2026-11-22 (r-noncredit-four-mq-codes-sam-2026-11-22): person-settled, kept" % cur
        elif RULED.get(d) == cur:
            why = "%s is the code the re-mint ruling chose (r-remint-dryrun-defaults-sam-2026-11-28): kept" % cur
        elif pref.get(cur):
            why = "%s prefixes %d M-ID(s): the re-mint playbook's" % (cur, pref[cur])
        elif pref.get(code):
            why = "%s already prefixes %d M-ID(s)" % (code, pref[code])
        elif code in used and used[code] != d:
            why = "%s is %s's code" % (code, used[code])
        (held if why else change).append({"discipline": d, "from": cur, "to": code, "basis": r["basis"].strip(), **({"why": why} if why else {})})
    add = [{"discipline": d, "to": c} for d, c in NEW.items() if d not in D and c not in used and not pref.get(c)]
    return doc, change, held, add


def main(argv):
    receipt = RECEIPT
    if "--receipt" in argv:
        receipt = os.path.join(ROOT, argv[argv.index("--receipt") + 1])
    doc, change, held, add = plan()
    print("change %d, held %d, add %d" % (len(change), len(held), len(add)))
    for h in held:
        print("  held %(discipline)s %(from)s -> %(to)s: %(why)s" % h)
    if "--apply" not in argv:
        return 0
    at = datetime.now(timezone.utc).isoformat(timespec="seconds")
    D = doc["disciplines"]
    for c in change:
        e = D[c["discipline"]]
        # Keep the code a change replaces (Sam, 2026-11-23: "we might need a formerly XXXX and Title").
        record_former(e, c["discipline"], c["to"], at, "csr-s749@bot", None)
        e["canonical_subj4"] = c["to"]
        if e.get("source") == "assigned":       # an assigned code's basis follows the code it now holds
            e["basis"], e["basis_words"] = "minted", c["basis"]
        e["_notes"] = ("Common SUBJ %s from %s (S749): Sam's 2026-11-28 ruling, every official MQ discipline its own common "
                       "code, COBIx's minted list (#3951): %s. " % (c["to"], c["from"], c["basis"])) + (e.get("_notes") or "")
        e["reviewed_at"], e["reviewed_by"] = at, "csr-s749@bot"
    for a in add:
        row = {"code": a["to"], "confidence": 0.9, "level": "Likely", "basis": "minted",
               "words": "Sam's 2026-11-28 ruling: every official MQ discipline its own common code (COBIx's list, #3951)"}
        D[a["discipline"]] = A.entry(row, at)
        D[a["discipline"]]["reviewed_by"] = "csr-s749@bot"
    doc["disciplines"] = D
    if isinstance(doc.get("_counts"), dict):
        doc["_counts"]["total_disciplines"] = len(D)
    with open(CANON, "w", encoding="utf-8") as f:
        json.dump(doc, f, indent=2, ensure_ascii=False)
        f.write("\n")
    al = json.load(open(ALIASES, encoding="utf-8"))
    before_alias = json.loads(json.dumps(al["aliases"]))
    eth = [n for n in al["aliases"].get("Ethnic Studies", []) if n not in NEW]
    if eth:
        al["aliases"]["Ethnic Studies"] = eth
    else:
        al["aliases"].pop("Ethnic Studies", None)
    al["aliases"].setdefault("Communication Studies", [])
    if "Speech Communication" not in al["aliases"]["Communication Studies"]:
        al["aliases"]["Communication Studies"].append("Speech Communication")
    with open(ALIASES, "w", encoding="utf-8") as f:
        json.dump(al, f, indent=2, ensure_ascii=False)
        f.write("\n")
    os.makedirs(os.path.dirname(receipt), exist_ok=True)
    with open(receipt, "w", encoding="utf-8") as f:
        json.dump({"_what": "kb/_apply_minted_codes_s749.py: each change with its before-value; git revert undoes it.",
                   "applied_at": at, "changed": change, "held": held, "added": add,
                   "aliases_before": before_alias, "aliases_after": al["aliases"]}, f, indent=1, ensure_ascii=False)
        f.write("\n")
    print("applied; receipt %s" % os.path.relpath(receipt, ROOT))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
