"""
Verify kb/issuer_preseed.json against its generation rules — the
kb/_verify_preseed_rules.py pattern for the missing-issuer lane.

Run from repo root:  python3 kb/_verify_issuer_preseed.py
Exits non-zero on any failure.
"""
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
PLAN = os.path.join(HERE, "issuer_preseed.json")
CRD_JS = os.path.join(os.path.dirname(HERE), "credential_reference_data.js")

CCC = "California Community Colleges"

results = []
def check(name, cond):
    results.append((name, bool(cond)))

def load_queue_index():
    raw = open(CRD_JS, encoding="utf-8").read()
    start = raw.index("{", raw.index("window.CPL_CREDENTIAL_REFERENCE"))
    data = json.loads(raw[start:raw.rstrip().rstrip(";").rfind("}") + 1])
    return {r["ut"]: r for r in data.get("unified_titles", []) if r.get("ut")}

def main():
    d = json.load(open(PLAN, encoding="utf-8"))
    staged = d.get("staged", {})
    residual = d.get("_residual", [])
    rows = load_queue_index()

    # ── structural ──
    check("payload has _about naming the stage-only contract",
          "prefill-only" in (d.get("_about") or "").lower())
    check("staged + residual == queue count",
          len(staged) + len(residual) == d.get("_queue_count"))
    check("every staged entry carries issuer/via/confidence/note keys",
          all({"issuer", "via", "confidence", "note"} <= set(v) for v in staged.values()))
    check("_counts sums to staged size",
          sum(d.get("_counts", {}).values()) == len(staged))

    # ── queue integrity: only null-issuer CER rows are staged ──
    check("every staged title exists in the baked CER payload",
          all(ut in rows for ut in staged))
    check("no staged title already carries an issuer (never overwrite)",
          all(not rows[ut].get("issuer") for ut in staged if ut in rows))

    # ── lane rules ──
    cx = {k: v for k, v in staged.items() if v["via"] == "cx"}
    check("cx lane stages CCC exactly",
          all(v["issuer"] == CCC for v in cx.values()))
    check("cx lane rows are typed ONLY Credit By Exam / Portfolio Review",
          all(set(rows[k].get("cpl_types") or []) <= {"Credit By Exam", "Portfolio Review"}
              and rows[k].get("cpl_types") for k in cx))

    hs = {k: v for k, v in staged.items() if v["via"] == "local-hs"}
    check("local-hs lane stages the empty no-formal-issuer verdict",
          all(v["issuer"] == "" for v in hs.values()))
    check("local-hs titles all say High School Pathway/Articulation",
          all(re.search(r"high\s+school\s+(pathway|articulation)", k, re.I) for k in hs))

    cae = {k: v for k, v in staged.items() if v["via"] == "course-as-exhibit"}
    check("course-as-exhibit lane stages the empty verdict",
          all(v["issuer"] == "" for v in cae.values()))
    check("course-as-exhibit rows all carry the suspect flag",
          all(rows[k].get("quality_flag") == "suspect_course_as_exhibit" for k in cae))

    fam = {k: v for k, v in staged.items() if v["via"] == "family"}
    check("family lane notes are receipted (each names a sibling)",
          all("kb/credentials.json" in v["note"] and "“" in v["note"] for v in fam.values()))
    check("family lane never stages an empty issuer",
          all(v["issuer"] for v in fam.values()))
    check("family lane stays small/high-precision (≤ 60 rows)", len(fam) <= 60)

    # ── deliberate residuals stay residual ──
    res_uts = {r["ut"] for r in residual}
    appr = [ut for ut in rows
            if not rows[ut].get("issuer")
            and re.search(r"\([^)]*articulation[^)]*\)\s*$", ut, re.I)
            and not re.search(r"high\s+school", ut, re.I)]
    check("apprenticeship-articulation rows are ALL residual (DIR-pending precedent)",
          all(ut in res_uts for ut in appr))
    check("Military-typed rows are never staged",
          all("Military" not in (rows[k].get("cpl_types") or []) for k in staged))

    # ── spot anchors (regenerate the plan if the data moved) ──
    check("spot: an Ironworker row stages the Iron Workers international",
          any(k.startswith("Ironworker") and "Iron Workers" in v["issuer"]
              for k, v in fam.items()))
    check("spot: 'AB Miller High School Pathway — Business and Finance' staged no-issuer",
          (staged.get("AB Miller High School Pathway — Business and Finance") or {}).get("issuer") == ""
          if "AB Miller High School Pathway — Business and Finance" in staged else True)

    ok = sum(1 for _, c in results if c)
    for name, cond in results:
        print(("✓" if cond else "✗"), name)
    print(f"{ok}/{len(results)} checks passed")
    sys.exit(0 if ok == len(results) else 1)

if __name__ == "__main__":
    main()
