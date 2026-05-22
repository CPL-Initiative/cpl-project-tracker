"""
Description-aware discipline inference for blank-discipline COCI staging
courses — a higher-effort complement to kb/_infer_disciplines.py (which only
looks at subject codes + course titles).

Many tail courses have an uninformative title ("Climate Control", "Electronic
Systems and Controls") but a description that names the field outright
("...heating, ventilation, and air conditioning (HVAC)...", "...automotive
electrical and electronic systems..."). This pass mines that signal.

Sources of the description text, per record:
  * minted M-IDs   -> in-file `description`           (kb/coci_minted_courses.json)
  * clusters       -> in-file `synthesized_description`(kb/coci_unified_courses.json)
  * singletons     -> the generated unified_courses_details.js (id -> {d,s});
                      singletons carry no in-file description. If that file is
                      absent the pass simply skips singletons (parents-only).

Why a SAFE phrase set + scoring (not the title lexicon):
  Descriptions are long (~400 chars) and mention disciplines tangentially (a
  history course names a language; an emeritus course says "older adults"). So
  this pass uses ONLY high-precision technical phrases that don't appear
  off-topic in prose, scores each description by phrase-hit count per
  discipline, and assigns the plurality winner — but ONLY when there is a
  single, unambiguous winner (a tie is skipped). Fills are written at a low
  confidence (0.5) with `discipline_source = "description"` so the dashboard's
  Generated-by filter can triage them separately from the title/subject fills.

Guardrails (same as _infer_disciplines.py):
  * Every target discipline MUST exist in reference/mq_disciplines.json.
  * NEVER touches a reviewed (`reviewed_at`) or curated (coci_curation.json) entry.
  * Only fills entries whose `discipline` is still blank. Idempotent / re-runnable.

Run from repo root (refresh unified_courses_details.js first for singleton
coverage):  python3 kb/_infer_disciplines_from_desc.py
"""
import json
import os
import re
from collections import Counter
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CONFIDENCE = 0.5
SOURCE = "description"

# High-precision phrases: terms decisive even inside a long description.
# (subject_map / title_keyword in discipline_inference.json handle the rest.)
SAFE_PHRASES = [
    (["welding", "gas tungsten arc", "gas metal arc", "shielded metal arc",
      "nondestructive testing", "non-destructive testing"], "Welding"),
    (["automotive"], "Automotive Technology"),
    (["dental"], "Dental Technology"),
    (["phlebotomy"], "Health Care Ancillaries"),
    (["cosmetology"], "Cosmetology"),
    (["barbering"], "Barbering"),
    (["heating, ventilation", "hvac", "refrigeration"], "Air Conditioning, Refrigeration, Heating"),
    (["paramedic", "emergency medical technician", "basic life support",
      "advanced cardiac life support"], "Emergency Medical Technologies"),
    (["surgical technolog", "operating room"], "Surgical Technology"),
    (["computer numerical control", "cnc machin"], "Machine Tool Technology"),
    (["industrial robot", "robotics"], "Robotics"),
    (["cybersecurity", "cyber security", "penetration testing"], "Computer Information Systems"),
    (["court reporting", "stenograph"], "Court Reporting"),
    (["embalming", "funeral service", "funeral director", "mortuary"], "Mortuary Science"),
    (["viticulture", "enology"], "Agricultural Production"),
    (["solidworks", "autocad", "computer-aided drafting", "computer aided drafting"], "Drafting/CADD"),
    (["photovoltaic"], "Environmental Technologies"),
    (["radiographic", "fluoroscopy"], "Radiological Technology"),
    (["veterinary"], "Registered Veterinary Technician"),
    (["aircraft", "airframe", "flight instructor", "private pilot"], "Aviation"),
    (["sonograph", "ultrasound"], "Diagnostic Medical Technology"),
    (["upholster"], "Upholstering"),
    (["locksmith"], "Locksmithing"),
    (["gunsmith"], "Gunsmithing"),
    (["floral design"], "Ornamental Horticulture"),
    (["sign language interpret", "american sign language"], "Sign Language, American"),
    (["pharmacy technician"], "Pharmacy Technology"),
]


def load(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def dump(path, obj):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False)
        f.write("\n")


def load_details():
    """id -> description text, from the generated unified_courses_details.js.
    Returns {} if the file is absent (then singletons are skipped)."""
    p = os.path.join(ROOT, "unified_courses_details.js")
    if not os.path.exists(p):
        print("  note: unified_courses_details.js absent — singletons skipped "
              "(run export_unified_courses() first for full coverage).")
        return {}
    raw = open(p, encoding="utf-8").read()
    payload = raw[raw.index("=") + 1:].rstrip().rstrip(";").strip()
    det = json.loads(payload)
    return {k: (v.get("d") if isinstance(v, dict) else None) for k, v in det.items()}


def main():
    valid = set(load(os.path.join(HERE, "reference", "mq_disciplines.json"))["disciplines"])
    bad = {d for _, d in SAFE_PHRASES if d not in valid}
    if bad:
        print("ABORT — phrase targets not in reference/mq_disciplines.json:")
        for d in sorted(bad):
            print("   ", repr(d))
        raise SystemExit(1)

    rules = [(re.compile(r"\b(?:%s)\b" % "|".join(re.escape(t) for t in terms), re.I), disc)
             for terms, disc in SAFE_PHRASES]

    def classify(desc):
        if not desc or len(desc.strip()) < 20:
            return None
        score = Counter()
        for pat, disc in rules:
            n = len(pat.findall(desc))
            if n:
                score[disc] += n
        if not score:
            return None
        ranked = score.most_common()
        if len(ranked) > 1 and ranked[1][1] == ranked[0][1]:
            return None  # tie — ambiguous, skip
        return ranked[0][0]

    curated = set((load(os.path.join(HERE, "coci_curation.json")) or {}).get("curations", {}).keys())
    details = load_details()
    today = date.today().isoformat()
    stats = Counter()
    by_disc = Counter()

    def fill(record, desc):
        if record.get("reviewed_at") or record.get("discipline"):
            return False
        disc = classify(desc)
        if not disc:
            return False
        record["discipline"] = disc
        record["discipline_source"] = SOURCE
        record["discipline_confidence"] = CONFIDENCE
        record["discipline_inferred_at"] = today
        by_disc[disc] += 1
        return True

    # minted M-IDs — in-file `description`
    f = os.path.join(HERE, "coci_minted_courses.json")
    doc = load(f)
    for cid, v in doc["courses"].items():
        if cid in curated:
            stats["skip_curated"] += 1
            continue
        if fill(v, v.get("description")):
            stats["minted"] += 1
    dump(f, doc)

    # clusters — in-file `synthesized_description`
    f = os.path.join(HERE, "coci_unified_courses.json")
    doc = load(f)
    for cid, v in doc["clusters"].items():
        if cid in curated:
            stats["skip_curated"] += 1
            continue
        if fill(v, v.get("synthesized_description")):
            stats["cluster"] += 1
    dump(f, doc)

    # singletons — description only via the generated details.js
    f = os.path.join(HERE, "coci_minted_singletons.json")
    doc = load(f)
    for cid, v in doc["courses"].items():
        if cid in curated:
            stats["skip_curated"] += 1
            continue
        if fill(v, details.get(cid)):
            stats["singleton"] += 1
    dump(f, doc)

    total = stats["minted"] + stats["cluster"] + stats["singleton"]
    print("Description-aware discipline inference complete:")
    print(f"  minted M-IDs filled : {stats['minted']}")
    print(f"  clusters filled     : {stats['cluster']}")
    print(f"  singletons filled   : {stats['singleton']}")
    print(f"  TOTAL filled        : {total}")
    print(f"  skipped (curated)   : {stats['skip_curated']}")
    print("  top disciplines assigned:")
    for d, n in by_disc.most_common(15):
        print(f"    {n:5}  {d}")


if __name__ == "__main__":
    main()
