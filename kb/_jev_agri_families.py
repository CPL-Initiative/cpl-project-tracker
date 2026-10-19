#!/usr/bin/env python3
"""Jev over the agriculture residual: a C-ID family for each AGRI identity, for Sam to confirm.

Sam, Open Asks Sheet 99 card 4 (16:37Z, 2026-10-19, his own call): "sitting". The Agriculture
umbrella splits its codes by the subject a student enrolls in: the five C-ID families AG-AB
(Agriculture Business), AG-AS (Animal Science), AG-EH (Environmental Horticulture), AG-MA
(Agriculture Mechanics) and AG-PS (Plant Science) became the umbrella codes AGAB, AGAS, AGEH,
AGMA and AGPS on 2026-09-03, and AGRI is the residual for a course no family covers (cards 4
to 6 that day). The residual holds 404 identities (measured 2026-10-19: 86 clustered, 318
stand-alone), most of them courses a family plainly covers.

WHAT THIS IS. One System One call per AGRI identity asks Jev which family the course belongs
to, from its title, its description where the cluster carries one, its TOP code and its
colleges, with the families' own C-ID descriptor titles as the vocabulary; a second question
asks whether the family is plain from the title and description alone. The answers are
ranked for a person: Sam confirms, the rest stay residual (the card after this sitting).
The hit is cheap to verify: a title either names its family or it does not.

POSTURE (kb/_jev_adjudicate.py, ladder item 3: every reference calibrates its own gate and
none inherits 0.85). No gate is measured for this question yet, so every answer here is
`uncalibrated`, and nothing is re-keyed off it: Sam's confirmation is what moves an identity,
and the re-key then runs under the playbook with its own dry run and receipt. This SUGGESTS.
It never edits a record, a seed or a table.

RUN IT ON A RUNNER (typesafe.ai is egress-blocked from the agent sandbox): typesafe-smoke.yml,
input `agri_families=true` (and `agri_limit` to cap a tranche). The sitting's file is uploaded
as the run's artifact; a session commits it under kb/jev_agri_families/<date>.json.

    python3 kb/_jev_agri_families.py --dry-run           # the plan and the first state, no call
    python3 kb/_jev_agri_families.py --limit 40          # a tranche
"""
import argparse
import datetime as dt
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
from _typesafe_smoke import choice, noul, system_one  # noqa: E402

OUT = os.path.join(HERE, "jev_out")
RESIDUAL = "AGRI"
POSTURE = "uncalibrated"
DESC_CHARS = 700

FAMILIES = {
    "AGAB": {"c_id": "AG-AB", "name": "Agriculture Business",
             "words": "Agricultural business, economics, sales, marketing, accounting, computer applications, labor and farm management."},
    "AGAS": {"c_id": "AG-AS", "name": "Animal Science",
             "words": "Animal science and husbandry: beef, dairy, equine, poultry, sheep, goat and swine production, feeding and nutrition, animal health, livestock judging and evaluation."},
    "AGEH": {"c_id": "AG-EH", "name": "Environmental Horticulture",
             "words": "Environmental and ornamental horticulture: plant materials, propagation, nursery and greenhouse practice, landscape design, construction, irrigation and maintenance, turf, arboriculture, pest management in horticulture."},
    "AGMA": {"c_id": "AG-MA", "name": "Agriculture Mechanics",
             "words": "Agricultural mechanics and engineering technology: tractors and equipment, welding and fabrication for agriculture, farm power, irrigation systems, shop practice, precision agriculture technology."},
    "AGPS": {"c_id": "AG-PS", "name": "Plant Science",
             "words": "Plant and soil science: crop production, agronomy, soils and fertility, pest management in crops, viticulture and enology, fruit and vegetable production, forestry and natural resources where the course is a crop or land course."},
}


def residual_identities(courses, singletons):
    """Every identity keyed under the residual code, with what Jev sees of it."""
    out = []
    for source, recs in (("minted", courses), ("singleton", singletons)):
        for cid, r in recs.items():
            if not cid.startswith(RESIDUAL + " "):
                continue
            desc = (r.get("description") or "").strip()
            colleges = []
            if r.get("college"):
                colleges = [r["college"]]
            out.append({"id": cid, "source": source, "title": r.get("common_title") or "",
                        "description": desc[:DESC_CHARS], "top_code": r.get("top_code"),
                        "discipline": r.get("discipline"), "colleges": colleges,
                        "members": r.get("corroboration_members") or (1 if source == "singleton" else None)})
    out.sort(key=lambda x: x["id"])
    return out


def family_vocabulary(descriptors):
    """The five families with their C-ID descriptor titles, the authority's own words."""
    vocab = {}
    for code, f in FAMILIES.items():
        titles = sorted({d.get("title") or "" for d in descriptors
                         if re.match(r"^%s\b" % re.escape(f["c_id"]), d.get("descriptor") or "")} - {""})
        vocab[code] = {"c_id_subject": f["c_id"], "name": f["name"], "covers": f["words"], "c_id_descriptors": titles}
    return vocab


def state_for(identity, vocab):
    return {
        "identity": {k: identity[k] for k in ("id", "title", "description", "top_code", "colleges", "members")},
        "families": vocab,
        "residual": {"code": RESIDUAL, "means": "a general agriculture course no family covers: an orientation, a survey "
                                                "of agriculture, agricultural education, or a course that spans the "
                                                "families equally"},
        "note": "The identity sits on the Agriculture umbrella's residual code. Answer from the title and the "
                "description; the TOP code corroborates and never decides (a TOP code is faculty-entered with no "
                "gatekeeper). A course that names an animal, a crop, a landscape task, a machine or a business "
                "practice belongs to that family even when its college filed it under a general agriculture prefix.",
    }


def questions():
    crit = {code: "%s (%s): %s" % (f["name"], f["c_id"], f["words"]) for code, f in FAMILIES.items()}
    crit[RESIDUAL] = ("Residual: a general agriculture course no single family covers, such as an orientation, a survey of "
                      "agriculture, agricultural education or leadership, or a course spanning several families equally.")
    return {
        "family": choice(
            "The course at `identity` sits on the Agriculture umbrella's residual code. Which of the five C-ID families at "
            "`families` is its home, judged from its title and description, with the TOP code as a corroborator only? "
            "Answer AGRI when no single family covers it (see `residual`).", crit),
        "plain": noul(
            "Is the family plain from the title and the description alone, so that a person would confirm it without "
            "opening the college's catalog?",
            {"true": "The title or description names the family's subject outright.",
             "false": "The family is an inference; a person would want to read the catalog entry."}),
    }


def answer_row(identity, answers):
    a = answers or {}
    fam = a.get("family") or {}
    plain = (a.get("plain") or {}).get("noul")
    return {
        "id": identity["id"], "source": identity["source"], "title": identity["title"], "top_code": identity["top_code"],
        "members": identity["members"], "family": fam.get("choice"), "family_confidence": fam.get("confidence"),
        "plain": plain, "residual": fam.get("choice") == RESIDUAL, "posture": POSTURE,
    }


def load_inputs(kb_dir=None):
    kb_dir = kb_dir or HERE
    courses = json.load(open(os.path.join(kb_dir, "coci_minted_courses.json"), encoding="utf-8"))["courses"]
    singletons = json.load(open(os.path.join(kb_dir, "coci_minted_singletons.json"), encoding="utf-8"))["courses"]
    descriptors = json.load(open(os.path.join(kb_dir, "reference", "cid_descriptors.json"), encoding="utf-8"))["descriptors"]
    return courses, singletons, descriptors


def run(limit=None, dry_run=False, key=None, call=system_one, out_dir=OUT, inputs=None, out=print, now=None):
    courses, singletons, descriptors = inputs or load_inputs()
    every = residual_identities(courses, singletons)
    identities = every[:limit] if limit else every
    vocab = family_vocabulary(descriptors)
    out("%d identities on %s (%d clustered, %d stand-alone); asking about %d"
        % (len(every), RESIDUAL, sum(1 for i in every if i["source"] == "minted"),
           sum(1 for i in every if i["source"] == "singleton"), len(identities)))
    if dry_run:
        if identities:
            out("first state: " + json.dumps(state_for(identities[0], vocab))[:1200])
        out("questions: " + ", ".join(questions()))
        out("dry run: no call, nothing written")
        return {"asked": 0, "every": len(every)}
    if not key and call is system_one:
        out("TYPESAFE_API_KEY is not set; nothing asked")
        return {"asked": 0, "every": len(every), "error": "no key"}
    rows, errors = [], 0
    for ident in identities:
        st = state_for(ident, vocab)
        try:
            answers = (call(st, questions(), key) or {}).get("answers") or {}
            row = answer_row(ident, answers)
        except Exception as exc:  # one identity's failure never ends the sitting
            errors += 1
            row = answer_row(ident, {})
            row["error"] = str(exc).splitlines()[0][:200]
        rows.append(row)
        out("%-12s %-5s %-5s %-50s %s" % (row["id"], row["family"] or "-",
                                          ("%.2f" % row["family_confidence"]) if isinstance(row["family_confidence"], (int, float)) else "-",
                                          row["title"][:50], ("error: " + row["error"]) if row.get("error") else ("plain" if row["plain"] else "")))
    tally = {}
    for r in rows:
        tally[r["family"] or "error"] = tally.get(r["family"] or "error", 0) + 1
    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, "agri_families.json")
    at = (now or dt.datetime.now(dt.timezone.utc)).isoformat(timespec="seconds")
    json.dump({"_doc": "Jev's C-ID family for each identity on the Agriculture umbrella's residual code AGRI. %s: no "
                       "gate is measured for this question, so nothing is re-keyed off it; Sam confirms (Open Asks Sheet "
                       "99 card 4, 2026-10-19: sitting), the rest stay residual, and the re-key runs under the playbook. "
                       "SUGGESTS, never edits." % POSTURE.upper(),
               "at": at, "run": os.environ.get("GITHUB_RUN_ID"), "posture": POSTURE, "residual_code": RESIDUAL,
               "identities_on_residual": len(every), "asked": len(rows), "errors": errors, "families": tally,
               "answers": rows},
              open(path, "w", encoding="utf-8"), indent=1, ensure_ascii=False)
    out("wrote %s: %d asked, %d error(s); families %s" % (os.path.relpath(path, ROOT), len(rows), errors, json.dumps(tally)))
    return {"asked": len(rows), "errors": errors, "families": tally, "path": path}


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--limit", type=int, help="ask about the first N identities (id order)")
    ap.add_argument("--dry-run", action="store_true", help="the plan and the first state; no call, nothing written")
    a = ap.parse_args(argv)
    res = run(a.limit, a.dry_run, (os.environ.get("TYPESAFE_API_KEY") or "").strip())
    return 1 if res.get("error") else 0


if __name__ == "__main__":
    sys.exit(main())
