"""
Infer a discipline for blank-discipline COCI staging courses from the authored
lexicon in kb/discipline_inference.json.

  kb/discipline_inference.json  ->  coci_minted_courses.json + coci_unified_courses.json

Two layers, in order, applied only to entries with a blank `discipline`:
  1. subject_map     — subject code -> discipline (higher precision)
  2. title_keywords  — whole-word title match -> discipline (lower precision)

Guardrails:
  * Every target discipline MUST exist in reference/mq_disciplines.json — the
    script validates the whole lexicon up front and refuses to write on any
    unknown target (protects against typos).
  * NEVER touches an entry that is human-reviewed (`reviewed_at` set) or present
    in coci_curation.json (human curation overlay).
  * Writes `discipline`, keeps `discipline_provisional`, and records
    `discipline_source` ("subject_map" | "title_keyword"),
    `discipline_confidence`, and `discipline_inferred_at` so the draft is
    auditable and reviewers can vet (esp. the lower-confidence keyword hits).

STAGING + flagged-for-review — not ground truth. Re-runnable: edit the lexicon
and run again (it only fills entries that are still blank).

Run from repo root:  python3 kb/_infer_disciplines.py
"""
import json
import os
import re
from collections import Counter
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))


def load(name):
    with open(os.path.join(HERE, name), encoding="utf-8") as f:
        return json.load(f)


def dump(name, obj):
    with open(os.path.join(HERE, name), "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False)
        f.write("\n")


def main():
    lex = load("discipline_inference.json")
    subject_map = lex["subject_map"]
    keywords = lex["title_keywords"]
    conf = lex["_confidence"]
    valid = set(load(os.path.join("reference", "mq_disciplines.json"))["disciplines"])

    # ---- validate every target up front -------------------------------------
    bad = set()
    for d in subject_map.values():
        if d not in valid:
            bad.add(d)
    for k in keywords:
        if k["discipline"] not in valid:
            bad.add(k["discipline"])
    if bad:
        print("ABORT — lexicon targets not in reference/mq_disciplines.json:")
        for d in sorted(bad):
            print("   ", repr(d))
        raise SystemExit(1)

    # Precompile whole-word keyword patterns.
    kw_rules = [(re.compile(r"\b(?:%s)\b" % "|".join(re.escape(t) for t in k["any"]), re.I),
                 k["discipline"]) for k in keywords]

    curated = set((load("coci_curation.json") or {}).get("curations", {}).keys())
    today = date.today().isoformat()
    stats = Counter()
    by_disc = Counter()

    def infer(subjects, title):
        # subject_map: assign only when all of the entry's subjects agree.
        mapped = {subject_map[s] for s in subjects if s in subject_map}
        if len(mapped) == 1:
            return mapped.pop(), "subject_map", conf["subject_map"]
        t = title or ""
        for pat, disc in kw_rules:
            if pat.search(t):
                return disc, "title_keyword", conf["title_keyword"]
        return None, None, None

    def process(record, subjects, title):
        if record.get("reviewed_at"):
            stats["skip_reviewed"] += 1
            return False
        has = record.get("discipline")
        ai = record.get("discipline_source")  # set only by a prior run of this script
        # Leave original-seed / manual disciplines (have a value but no
        # discipline_source) untouched. Re-infer our own prior AI guesses so
        # lexicon refinements propagate; fill blanks.
        if has and not ai:
            return False
        disc, source, c = infer([s for s in subjects if s], title)
        if not disc:
            if not has:
                stats["still_blank"] += 1
            return False
        record["discipline"] = disc
        record["discipline_source"] = source
        record["discipline_confidence"] = c
        record["discipline_inferred_at"] = today
        stats[source] += 1
        by_disc[disc] += 1
        return True

    # ---- minted (corroborated) M-IDs -----------------------------------------
    mdoc = load("coci_minted_courses.json")
    for cid, v in mdoc["courses"].items():
        if cid in curated:
            stats["skip_curated"] += 1
            continue
        process(v, [v.get("subject")], v.get("common_title"))
    dump("coci_minted_courses.json", mdoc)

    # ---- variant-unified clusters --------------------------------------------
    cdoc = load("coci_unified_courses.json")
    for cid, v in cdoc["clusters"].items():
        if cid in curated:
            stats["skip_curated"] += 1
            continue
        process(v, v.get("subjects", []), v.get("synthesized_title") or v.get("canonical_title"))
    dump("coci_unified_courses.json", cdoc)

    # ---- deferred singletons (export-only) -----------------------------------
    # Sparse records: unset fields fall back to _record_defaults (discipline /
    # reviewed_at default to null), so process() reads them correctly as blank.
    before = stats["subject_map"] + stats["title_keyword"]
    sdoc = load("coci_minted_singletons.json")
    for cid, v in sdoc["courses"].items():
        if cid in curated:
            stats["skip_curated"] += 1
            continue
        process(v, [v.get("subject")], v.get("common_title"))
    dump("coci_minted_singletons.json", sdoc)
    stats["singletons_filled"] = stats["subject_map"] + stats["title_keyword"] - before

    print("Discipline inference complete (minted M-IDs + clusters + singletons):")
    print(f"  subject_map assigned : {stats['subject_map']}")
    print(f"  title_keyword assigned: {stats['title_keyword']}")
    print(f"  of which singletons   : {stats['singletons_filled']}")
    print(f"  still blank           : {stats['still_blank']}")
    print(f"  skipped (reviewed)    : {stats['skip_reviewed']}")
    print(f"  skipped (curated)     : {stats['skip_curated']}")
    print("  top disciplines assigned:")
    for d, n in by_disc.most_common(15):
        print(f"    {n:5}  {d}")


if __name__ == "__main__":
    main()
