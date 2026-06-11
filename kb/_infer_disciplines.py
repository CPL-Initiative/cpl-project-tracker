"""
Infer a discipline for blank-discipline COCI staging courses from the authored
lexicon in kb/discipline_inference.json.

  kb/discipline_inference.json  ->  coci_minted_courses.json + coci_unified_courses.json

Two layers, in order, applied only to entries with a blank `discipline`:
  1. subject_map     — subject code -> discipline (higher precision)
  2. title_keywords  — whole-word title match -> discipline (lower precision)

subject_map entry forms (Session 45 — college-homonym subjects):
  "AUTO": "Automotive Technology"                       <- global (most entries)
  "GSS":  {"discipline": "Gunsmithing",
           "colleges": ["Lassen College"]}              <- COLLEGE-SCOPED
A scoped entry fires only when EVERY college behind the row (the singleton's
college / the M-ID's member colleges) is in the allowlist. Subject codes are
college-local vocabulary — the same code can name different departments at
different colleges (CADM = Corrections ADMin at Bakersfield, Computer-Aided
Drafting at Merced). kb/_audit_subject_map.py detects these homonyms; the
majority side keeps its precise fill via scoping, the minority side falls
through to the TOP/description/division passes' per-row evidence.

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
and run again. Blanks fill; this script's own prior fills RE-INFER (lexicon
refinements propagate) and RETRACT when they no longer re-derive (lexicon
removals propagate too — Session 45; a retracted row blanks so the later
passes / curation re-fill it from per-row evidence). Manual/seed disciplines
and other passes' fills are never touched.

After editing subject_map, run kb/_audit_subject_map.py first: it flags
COLLEGE-HOMONYM subject codes (the same code naming different departments at
different colleges — the CADM/CRIM M1003 failure class) that must not be in
the global map.

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
    for e in subject_map.values():
        d = e if isinstance(e, str) else (e or {}).get("discipline")
        if d not in valid:
            bad.add(d)
        if not isinstance(e, str) and not (e or {}).get("colleges"):
            bad.add(f"<scoped entry without colleges: {e!r}>")
    for k in keywords:
        if k["discipline"] not in valid:
            bad.add(k["discipline"])
    if bad:
        print("ABORT — lexicon targets not in reference/mq_disciplines.json:")
        for d in sorted(str(x) for x in bad):
            print("   ", repr(d))
        raise SystemExit(1)

    # Precompile whole-word keyword patterns.
    kw_rules = [(re.compile(r"\b(?:%s)\b" % "|".join(re.escape(t) for t in k["any"]), re.I),
                 k["discipline"]) for k in keywords]

    curated = set((load("coci_curation.json") or {}).get("curations", {}).keys())
    today = date.today().isoformat()
    stats = Counter()
    by_disc = Counter()

    def infer(subjects, title, colleges):
        # subject_map: assign only when all of the entry's subjects agree.
        mapped = set()
        for s in subjects:
            e = subject_map.get(s)
            if e is None:
                continue
            if isinstance(e, str):
                mapped.add(e)
            else:
                # college-scoped homonym entry: fires only when EVERY college
                # behind the row is in the allowlist (conservative — a mixed
                # minted row falls through to the per-row evidence passes).
                allow = set(e["colleges"])
                if colleges and all(c in allow for c in colleges):
                    mapped.add(e["discipline"])
        if len(mapped) == 1:
            return mapped.pop(), "subject_map", conf["subject_map"]
        t = title or ""
        for pat, disc in kw_rules:
            if pat.search(t):
                return disc, "title_keyword", conf["title_keyword"]
        return None, None, None

    def process(record, subjects, title, colleges=None):
        if record.get("reviewed_at"):
            stats["skip_reviewed"] += 1
            return False
        has = record.get("discipline")
        ai = record.get("discipline_source")  # set by a prior inference pass
        # Leave original-seed / manual disciplines (have a value but no
        # discipline_source) untouched. Re-infer our own prior AI guesses so
        # lexicon refinements propagate; fill blanks.
        if has and not ai:
            return False
        disc, source, c = infer([s for s in subjects if s], title, colleges)
        if not disc:
            if has and ai in ("subject_map", "title_keyword"):
                # RETRACTION (Session 45, the CADM/CRIM M1003 case): a prior
                # fill by THIS script that no longer re-derives means its
                # lexicon entry was corrected or removed. Refinements have
                # always propagated via re-inference; retractions must too,
                # or a removed entry leaves its poison behind. Blank the fill
                # + provenance so the later passes (description / TOP /
                # TOP-division) or curation re-fill from per-row evidence on
                # the next chain run. Fills owned by those later passes
                # (ai = description/top_code/top_division) are never touched.
                record["discipline"] = None
                for k in ("discipline_source", "discipline_confidence",
                          "discipline_inferred_at"):
                    record.pop(k, None)
                stats["retracted_" + ai] += 1
                return True
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

    # Member colleges per M-ID — the college context scoped entries fire on.
    memships = (load("coci_minted_memberships.json") or {}).get("memberships", {})
    mem_colleges = {mid: [m.get("college") for m in ms if m.get("college")]
                    for mid, ms in memships.items()}

    # ---- minted (corroborated) M-IDs -----------------------------------------
    mdoc = load("coci_minted_courses.json")
    for cid, v in mdoc["courses"].items():
        if cid in curated:
            stats["skip_curated"] += 1
            continue
        process(v, [v.get("subject")], v.get("common_title"), mem_colleges.get(cid))
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
        process(v, [v.get("subject")], v.get("common_title"),
                [v["college"]] if v.get("college") else None)
    dump("coci_minted_singletons.json", sdoc)
    stats["singletons_filled"] = stats["subject_map"] + stats["title_keyword"] - before

    print("Discipline inference complete (minted M-IDs + clusters + singletons):")
    print(f"  subject_map assigned : {stats['subject_map']}")
    print(f"  title_keyword assigned: {stats['title_keyword']}")
    print(f"  of which singletons   : {stats['singletons_filled']}")
    print(f"  RETRACTED (subj-map)  : {stats['retracted_subject_map']}"
          f"   <- lexicon entry no longer fires; re-fill via the later passes")
    print(f"  RETRACTED (title-kw)  : {stats['retracted_title_keyword']}")
    print(f"  still blank           : {stats['still_blank']}")
    print(f"  skipped (reviewed)    : {stats['skip_reviewed']}")
    print(f"  skipped (curated)     : {stats['skip_curated']}")
    print("  top disciplines assigned:")
    for d, n in by_disc.most_common(15):
        print(f"    {n:5}  {d}")


if __name__ == "__main__":
    main()
