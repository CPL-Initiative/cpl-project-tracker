#!/usr/bin/env python3
"""Sheet 99 card 6: nine MQ discipline names take the handbook's spellings (one re-key window).

Sam ruled on 2026-10-19 (Open Asks Sheet 99 card 6, 16:37Z, "Rename as the handbook spells
them"), re-affirming his 2026-09-08 ruling on the hard-ones sheet. Eight names in
kb/reference/mq_disciplines.json carry a Title 5 section number the PDF read captured into the
title (53412, 53414; cpl_memory eight-mq-discipline-names-carry-a-title-5-section-number-2026-09-08),
and one is cut short ("Disabled Student Programs and"). kb/reference/mq_sections.json already
records each one's index spelling as `index_name` (the 2026-07-11 positional re-parse); the rename
takes it verbatim, the parentheticals "(DSPS)" and "(ESL)" included, since the ruling says the
handbook's spelling.

WHY A WINDOW, NOT AN EDIT. A discipline name is a key: the picks, the identities' discipline
fields, the subject map and the overlay hang from it, and the daily sync carries kb_curation into
kb/discipline_canonical_subj4.json and kb/coci_curation.json. So the file stores below change in
one commit, and the four live kb_curation rows that carry an old name change in the same cron
window through supabase-migrate.yml (kb/receipts/mq_title5_rename_2026-10-20_s430.sql, guarded
UPDATEs with the before-values in the receipt). No identity is re-minted: ids stay, names move.

THE STORES (source of truth only; the generated payloads follow on the daily run or their builders):
  kb/reference/mq_disciplines.json, kb/reference/mq_sections.json, kb/reference/subject_discipline_map.json,
  kb/discipline_canonical_subj4.json, kb/discipline_inference.json, kb/coci_curation.json,
  kb/coci_minted_courses.json, kb/coci_minted_singletons.json
Each old name is replaced only as a whole JSON string ("<old>", or a "_CANON_SUBJ4::<old>" key),
so a longer name that contains a short one ("Learning Disabilities: Disabled Student Programs and
Services" contains "Disabled Student Programs and") is never touched. kb/discipline_aliases.json
records the nine under `renamed`, which kb/_alias_canon.py resolves for the inference passes and the
CSR's "also:" chips never read, so an old spelling in a lexicon resolves instead of resurrecting.

GATES: R0 each old name is in mq_sections.json with the index_name named here; R1 no new name is
already a key or value in any store; R2 every store parses after the edit with no duplicate key;
R3 no old name survives as a whole string in any store; R4 each store holds as many new-name
strings as it held old-name strings. In mq_sections.json, R1 reads the keys only (the index_name
fields already hold the new spellings) and the apply drops an index_name equal to its key.

Run:
  python3 kb/_mq_title5_rename.py            # dry run -> kb/mq_rename_out/<date>/plan.json, nothing written
  python3 kb/_mq_title5_rename.py --apply    # edit the stores, then re-run the gates
"""
import argparse
import json
import os
import sys
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

RENAMES = {
    "Community College Counselor of Students with Disabilities 53414":
        "Community College Counselor of Students with Disabilities",
    "Deaf and Hearing Impaired: Disabled Students Programs 53414":
        "Deaf and Hearing Impaired: Disabled Students Programs and Services",
    "Developmental Disabilities: Disabled Students Programs and Services 53414":
        "Developmental Disabilities: Disabled Students Programs and Services",
    "Disabled Student Programs and":
        "Disabled Student Programs and Services (DSPS)",
    "English as a Second Language Noncredit 53412":
        "English as a Second Language (ESL): Noncredit",
    "Interdisciplinary-Basic Skills: Noncredit 53412":
        "Interdisciplinary-Basic Skills: Noncredit",
    "Learning Disabilities: Disabled Student Programs and Services 53414":
        "Learning Disabilities: Disabled Student Programs and Services",
    "Physical Disabilities: Disabled Student Programs and Services 53414":
        "Physical Disabilities: Disabled Student Programs and Services",
    "Speech Language Pathology: Disabled Student Programs and 53414 Services":
        "Speech Language Pathology: Disabled Student Programs and Services",
}
CANON_PREFIX = "_CANON_SUBJ4::"
STORES = [
    "kb/reference/mq_disciplines.json",
    "kb/reference/mq_sections.json",
    "kb/reference/subject_discipline_map.json",
    "kb/discipline_canonical_subj4.json",
    "kb/discipline_inference.json",
    "kb/coci_curation.json",
    "kb/coci_minted_courses.json",
    "kb/coci_minted_singletons.json",
]
ALIASES = os.path.join(HERE, "discipline_aliases.json")
SECTIONS = "kb/reference/mq_sections.json"


def quoted(name):
    return [json.dumps(name), json.dumps(CANON_PREFIX + name)]


def count(text, names):
    return sum(text.count(q) for n in names for q in quoted(n))


def rename_text(text):
    for old, new in RENAMES.items():
        for qo, qn in zip(quoted(old), quoted(new)):
            text = text.replace(qo, qn)
    return text


def no_duplicate_keys(pairs):
    seen, dup = set(), set()
    for k, _ in pairs:
        (dup if k in seen else seen).add(k)
    dup = sorted(dup)
    if dup:
        raise ValueError("duplicate key(s): %s" % ", ".join(dup))
    return dict(pairs)


def read(rel):
    with open(os.path.join(ROOT, rel), encoding="utf-8") as f:
        return f.read()


def plan():
    """The gates that hold before any edit, and what the edit would do to each store."""
    errors, stores = [], {}
    sections = json.loads(read("kb/reference/mq_sections.json"))["disciplines"]
    for old, new in RENAMES.items():
        got = (sections.get(old) or {}).get("index_name")
        if got != new:
            errors.append("R0: %r has index_name %r in mq_sections.json, not %r" % (old, got, new))
    for rel in STORES:
        text = read(rel)
        n_old, n_new = count(text, RENAMES), count(text, RENAMES.values())
        if rel == SECTIONS:  # its index_name fields already hold the new spellings; only a key may not
            n_new = sum(1 for n in RENAMES.values() if n in sections)
        if n_new:
            errors.append("R1: %s already holds %d new-name string(s)" % (rel, n_new))
        stores[rel] = {"old_strings": n_old,
                       "by_name": {o: count(text, [o]) for o in RENAMES if count(text, [o])}}
    return {"ruling": "Sam, Open Asks Sheet 99 card 6, 2026-10-19 16:37Z: Rename as the handbook spells them",
            "renames": RENAMES, "stores": stores, "errors": errors}


def apply():
    errors = []
    before = {rel: count(read(rel), RENAMES) for rel in STORES}
    for rel in STORES:
        text = read(rel)
        new = rename_text(text)
        try:
            json.loads(new, object_pairs_hook=no_duplicate_keys)
        except ValueError as e:
            errors.append("R2: %s: %s" % (rel, e))
            continue
        if rel == SECTIONS:
            # index_name recorded where a key was an operational rename of the index's spelling
            # (the 2026-07-11 re-parse); a key that now IS the index's spelling drops it.
            doc = json.loads(new)
            for name, entry in doc["disciplines"].items():
                if entry.get("index_name") == name:
                    del entry["index_name"]
            new = json.dumps(doc, indent=1, ensure_ascii=False) + "\n"
        if new != text:
            with open(os.path.join(ROOT, rel), "w", encoding="utf-8") as f:
                f.write(new)
    for rel in STORES:
        text = read(rel)
        if count(text, RENAMES):
            errors.append("R3: %s still holds an old name" % rel)
        if count(text, RENAMES.values()) != before[rel]:
            errors.append("R4: %s holds %d new-name strings, %d old ones before"
                          % (rel, count(text, RENAMES.values()), before[rel]))
    with open(ALIASES, encoding="utf-8") as f:
        doc = json.load(f)
    doc["renamed"] = dict(sorted(RENAMES.items()))
    doc["_renamed_about"] = ("Old spelling -> current MQ name, resolved by kb/_alias_canon.py for the inference passes; "
                             "the CSR's also: chips read `aliases` only. The nine Title 5-numbered and cut-short names "
                             "took the handbook's spellings on Sam's Open Asks Sheet 99 card 6 (2026-10-19, "
                             "\"Rename as the handbook spells them\"; kb/_mq_title5_rename.py, S430).")
    with open(ALIASES, "w", encoding="utf-8") as f:
        f.write(json.dumps(doc, indent=2, ensure_ascii=False) + "\n")
    return {"before": before, "errors": errors}


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--apply", action="store_true", help="edit the stores (default: dry run)")
    args = ap.parse_args(argv)
    p = plan()
    out_dir = os.path.join(HERE, "mq_rename_out", date.today().isoformat())
    if not args.apply:
        os.makedirs(out_dir, exist_ok=True)
        with open(os.path.join(out_dir, "plan.json"), "w", encoding="utf-8") as f:
            f.write(json.dumps(p, indent=1, ensure_ascii=False) + "\n")
        for rel, s in p["stores"].items():
            print("%-44s %4d old-name string(s)" % (rel, s["old_strings"]))
        print("\n".join(p["errors"]) or "gates R0, R1 hold; dry run, nothing written")
        return 1 if p["errors"] else 0
    if p["errors"]:
        print("\n".join(p["errors"]))
        return 1
    res = apply()
    print("\n".join(res["errors"]) or "applied: gates R2, R3, R4 hold; %d strings renamed across %d stores"
          % (sum(res["before"].values()), sum(1 for v in res["before"].values() if v)))
    return 1 if res["errors"] else 0


if __name__ == "__main__":
    sys.exit(main())
