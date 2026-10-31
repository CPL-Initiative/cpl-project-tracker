"""
The CPL-AI matching (Activity 1.1.1) as a dated snapshot COBI's Program Requirements dialog reads.

Sam, Open Asks Sheet 147 card 5 (2026-10-31, "dialog"): load the CPL-AI matching into the Program
Requirements dialog first; Sierra and the public pages wait for his word.

The source is the CPL-AI recommendations page (https://map.rccd.edu/CPL-AI/), whose catalog rates
33,232 course and certification pairs at 121 colleges in three evidence tiers: Strong evidence,
Faculty interpretation and Limited evidence. The page credits the statewide Credit for Prior Learning
& Artificial Intelligence Initiative, funded by College Futures Foundation and implemented with the
Academic Senate for California Community Colleges and the Success Center for California Community
Colleges; the snapshot carries that credit and the page's own caveat, word for word.

The snapshot keeps the first two tiers: a Limited evidence pair is the page's own weakest reading,
and the dialog shows what a faculty member would act on. Each pair keeps its tier and the course code
as the page wrote it, under its college and a folded course key (leading zeros dropped, spaces and
marks removed), so MAP's "CIS 005A" meets a catalog's "CIS 5A".

    python3 kb/_build_cpl_ai.py --fetch            # read the live catalog, write the snapshot
    python3 kb/_build_cpl_ai.py --from catalog.json # build from a saved copy
    python3 kb/_build_cpl_ai.py --check             # the snapshot reads as its builder writes it
"""
import json
import os
import re
import sys
import unicodedata
import urllib.request
from collections import Counter
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "cpl_ai", "pairs.json")
SOURCE = "https://map.rccd.edu/CPL-AI/preview-data/catalog.json"
PAGE = "https://map.rccd.edu/CPL-AI/"
TIERS = {1: "Strong evidence", 2: "Faculty interpretation"}
CREDIT = ("These recommendations were developed through the statewide Credit for Prior Learning & Artificial "
          "Intelligence Initiative, funded by College Futures Foundation and implemented in partnership with the "
          "Academic Senate for California Community Colleges and the Success Center for California Community "
          "Colleges.")
CAVEAT = ("These recommendations are intended to support local review and decision-making. Final determinations "
          "regarding Credit for Prior Learning remain the responsibility of individual colleges and their "
          "established processes.")


def college_key(name):
    """'Cañada College' and 'Canada College' meet; 'Lassen Community College' meets 'Lassen College'."""
    s = unicodedata.normalize("NFKD", name or "").encode("ascii", "ignore").decode().lower()
    s = re.sub(r"\b(community|college|district)\b", " ", s)
    return re.sub(r"[^a-z0-9]", "", s)


def course_key(code):
    """'CIS 005A' and 'CIS 5A' meet; 'ADM JUS 8' and 'ADMJUS 008' meet."""
    m = re.match(r"^(.*?)(\d+)([A-Za-z]*)\s*$", (code or "").strip())
    if not m:
        return re.sub(r"[^A-Z0-9]", "", (code or "").upper())
    return re.sub(r"[^A-Z0-9]", "", m.group(1).upper()) + str(int(m.group(2))) + m.group(3).upper()


def build(rows, fetched_at):
    creds = sorted({r["credential"] for r in rows if r.get("tier") in TIERS})
    ci = {c: i for i, c in enumerate(creds)}
    by_college, names = {}, {}
    kept = 0
    for r in rows:
        if r.get("tier") not in TIERS or not r.get("college") or not r.get("courseCode"):
            continue
        ck = college_key(r["college"])
        names.setdefault(ck, r["college"])
        slot = by_college.setdefault(ck, {}).setdefault(course_key(r["courseCode"]), [])
        entry = [ci[r["credential"]], r["tier"], r["courseCode"].strip()]
        if entry not in slot:
            slot.append(entry)
            kept += 1
    for courses in by_college.values():
        for slot in courses.values():
            slot.sort(key=lambda e: (e[1], creds[e[0]]))
    tiers = Counter(r.get("tier") for r in rows)
    return {
        "_about": ("The CPL-AI matching (Activity 1.1.1), as read from %s on %s by kb/_build_cpl_ai.py. "
                   "by_college[college key][course key] = [[credential index, tier, course code as written]]; "
                   "tiers 1 and 2 only. Sam, Open Asks Sheet 147 card 5 (2026-10-31): the Program Requirements "
                   "dialog reads it first; Sierra and the public pages wait for his word." % (PAGE, fetched_at[:10])),
        "source": SOURCE, "page": PAGE, "fetched_at": fetched_at,
        "credit": CREDIT, "caveat": CAVEAT,
        "tiers": {str(k): v for k, v in TIERS.items()},
        "counts": {"pairs": len(rows), "certifications": len({r["credential"] for r in rows}),
                   "colleges": len({r["college"] for r in rows}),
                   "by_tier": {str(k): tiers[k] for k in sorted(tiers) if k is not None}, "kept": kept},
        "credentials": creds,
        "colleges": dict(sorted(names.items())),
        "by_college": {k: dict(sorted(v.items())) for k, v in sorted(by_college.items())},
    }


def write(snap, path=OUT):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(snap, f, ensure_ascii=False, separators=(",", ":"))
        f.write("\n")


def main(argv):
    if "--check" in argv:
        snap = json.load(open(OUT, encoding="utf-8"))
        bad = [k for k in ("source", "credit", "caveat", "tiers", "credentials", "by_college") if not snap.get(k)]
        if bad or snap["credit"] != CREDIT or snap["caveat"] != CAVEAT:
            print("cpl-ai snapshot is missing or altered: %s" % (bad or "credit/caveat"))
            return 1
        print("cpl-ai snapshot ok: %d pairs kept from %s" % (snap["counts"]["kept"], snap["fetched_at"]))
        return 0
    if "--from" in argv:
        path = argv[argv.index("--from") + 1]
        rows = json.load(open(path, encoding="utf-8"))
        fetched_at = datetime.fromtimestamp(os.path.getmtime(path), timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    elif "--fetch" in argv:
        with urllib.request.urlopen(urllib.request.Request(SOURCE, headers={"User-Agent": "cpl-project-tracker"}),
                                    timeout=120) as r:
            rows = json.load(r)
        fetched_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    else:
        print(__doc__)
        return 2
    snap = build(rows, fetched_at)
    write(snap)
    c = snap["counts"]
    print("cpl-ai: %d pairs, %d certifications, %d colleges; kept %d (tiers 1-2) -> %s"
          % (c["pairs"], c["certifications"], c["colleges"], c["kept"], os.path.relpath(OUT)))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
