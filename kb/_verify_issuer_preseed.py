"""
Verify kb/issuer_preseed.json against its generation rules — the
kb/_verify_preseed_rules.py pattern for the CER issuer-lane pre-seed.

Plan schema v2 (Session 106, Sam's Rule 5f): entries may stage `title` +
`trainer` alongside `issuer`; `issuer: null` = no issuer change (title/trainer
cleanup only); `resurface: true` = the row already carries an issuer and is
surfaced for cleanup, never for an issuer rewrite. Rule 5g (same day) styles
every staged title — leading Beginning/Intermediate/Advanced moves to the END,
"Intro" expands to "Introduction" (official proper names exempt); the
`title-style` lane stages that styling alone.

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

    resurface = {k: v for k, v in staged.items() if v.get("resurface")}
    # core = entries that STAGE AN ISSUER (issuer != null) on a queue row —
    # the arithmetic cohort. Title-only `course-title` entries keep their
    # _residual record (the issuer still needs judgment) so they are neither.
    core = {k: v for k, v in staged.items()
            if not v.get("resurface") and v.get("issuer") is not None}

    # ── structural ──
    check("payload has _about naming the stage-only contract",
          "prefill-only" in (d.get("_about") or "").lower())
    check("issuer-staging entries + residual == null-issuer queue count",
          len(core) + len(residual) == d.get("_queue_count"))
    check("every staged entry carries issuer/via/confidence/note keys",
          all({"issuer", "via", "confidence", "note"} <= set(v) for v in staged.values()))
    check("_counts sums to staged size",
          sum(d.get("_counts", {}).values()) == len(staged))
    check("_resurface_count matches",
          d.get("_resurface_count") == len(resurface))

    # ── queue integrity ──
    check("every staged title exists in the baked CER payload",
          all(ut in rows for ut in staged))
    check("no issuer-staging entry targets a row that already carries an issuer",
          all(not rows[ut].get("issuer") for ut in core if ut in rows))
    check("resurface entries NEVER stage an issuer rewrite (issuer is null)",
          all(v.get("issuer") is None for v in resurface.values()))

    # ── Rule 5c title enrichment ──
    ct = {k: v for k, v in staged.items() if v["via"] == "course-title"}
    check("course-title lane stages ONLY a title (issuer null, never resurface)",
          all(v.get("issuer") is None and v.get("title") and not v.get("resurface")
              for v in ct.values()))
    check("course-title rows keep their _residual record (issuer still open)",
          all(k in {r["ut"] for r in residual} for k in ct))
    titled = {k: v for k, v in staged.items() if v.get("title")}
    check("_titles_staged == count of ALL titled entries",
          d.get("_titles_staged") == len(titled))
    check("every staged title cites its source in the note "
          "(Rule 5c/5f/5g or DIR DAS)",
          all(("Rule 5c" in v["note"] or "Rule 5f" in v["note"]
               or "Rule 5g" in v["note"] or "DIR DAS" in v["note"])
              for v in titled.values()))
    check("no staged title equals the row's current display title",
          all(v["title"] != (rows[k].get("display_title") or k)
              for k, v in titled.items() if k in rows))

    # ── Rule 5g title styling ──
    LEVEL_KEEP = re.compile(
        r"^Advanced\s+(?:Placement\b|EMT\b|Cardiac\b|Cardiovascular\b)", re.I)
    check("Rule 5g: no staged title LEADS with a level word "
          "(official proper names exempt)",
          all(not re.match(r"^(Beginning|Intermediate|Advanced)\s", v["title"],
                           re.I)
              or LEVEL_KEEP.match(v["title"])
              for v in titled.values()))
    check("Rule 5g: no staged title carries the bare abbreviation “Intro”",
          all(not re.search(r"\bIntro\b", v["title"]) for v in titled.values()))
    ts = {k: v for k, v in staged.items() if v["via"] == "title-style"}
    check("title-style lane stages ONLY a title (issuer null, never resurface)",
          all(v.get("issuer") is None and v.get("title") and not v.get("resurface")
              for v in ts.values()))
    check("title-style rows keep their _residual record (issuer still open)",
          all(k in {r["ut"] for r in residual} for k in ts))
    check("title-style notes cite Rule 5g",
          all("Rule 5g" in v["note"] for v in ts.values()))

    # ── lane rules ──
    cx = {k: v for k, v in staged.items() if v["via"] == "cx"}
    check("cx lane stages CCC exactly",
          all(v["issuer"] == CCC for v in cx.values()))
    check("cx lane rows are typed ONLY Credit By Exam / Portfolio Review",
          all(set(rows[k].get("cpl_types") or []) <= {"Credit By Exam", "Portfolio Review"}
              and rows[k].get("cpl_types") for k in cx))

    # Rule 5f — trainer-named local pathway exhibits (supersedes the Session-105
    # local-hs ""-verdict lane).
    lt = {k: v for k, v in staged.items() if v["via"] == "local-trainer"}
    check("local-trainer lane exists (the local-hs \"\" lane is retired)",
          len(lt) > 0 and not any(v["via"] == "local-hs" for v in staged.values()))
    check("local-trainer: a staged school issuer always stages the SAME trainer "
          "(Rule 5f — both default the same)",
          all(v.get("trainer") == v["issuer"] for v in lt.values() if v.get("issuer")))
    check("local-trainer: staged titles carry no school/pathway decoration",
          all(not re.search(r"\((?:[^)]*(?:High School|HS|Adult School|ROP)[^)]*)\)\s*$"
                            r"|High School Pathway|—\s*[^—]*(?:High School|ROP)\s*$",
                            v["title"])
              for v in lt.values() if v.get("title")))
    check("local-trainer: every entry stages SOMETHING (title, trainer, or issuer)",
          all(v.get("title") or v.get("trainer") or v.get("issuer") is not None
              for v in lt.values()))
    check("local-trainer notes are receipted (each cites Rule 5f)",
          all("Rule 5f" in v["note"] for v in lt.values()))

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

    # ── statewide-agency lane (blank statewide issuer resolved via the
    #    Faculty-Collaborative agency rules — Sam 2026-07-08) ──
    swa = {k: v for k, v in staged.items() if v["via"] == "statewide-agency"}
    check("statewide-agency lane never stages an empty issuer",
          all(v["issuer"] for v in swa.values()))
    check("statewide-agency notes carry the statewidecpl receipt",
          all("statewidecpl" in v["note"] for v in swa.values()))
    gtaw_adv = staged.get("Advanced Gas Tungsten Arc Welding (GTAW)")
    check("spot: the welding Cx family stages the American Welding Society "
          "(house AWS spelling)",
          (gtaw_adv is None)
          or gtaw_adv.get("issuer") == "American Welding Society (AWS)")

    # ── apprenticeship lane (Norco / Santiago Canyon sponsors — Sam 2026-07-08) ──
    appr_staged = {k: v for k, v in staged.items() if v["via"] == "apprenticeship"}
    SPONSORS = {"Southwest Carpenter And Affiliated Trade J.A.T.C.",
                "Riverside Area Electrical J. A. C."}
    check("apprenticeship lane stages only the two DIR DAS sponsors",
          all(v["issuer"] in SPONSORS for v in appr_staged.values()))
    check("apprenticeship lane: trainer == issuer (the JATC/JAC trains)",
          all(v.get("trainer") == v["issuer"] for v in appr_staged.values()))
    check("apprenticeship lane notes carry the DIR DAS receipt link",
          all("dir.ca.gov" in v["note"] for v in appr_staged.values()))
    check("apprenticeship lane: staged titles carry no apprenticeship/articulation parens",
          all(not re.search(r"\([^)]*(?:apprenticeship|articulation)[^)]*\)", v["title"], re.I)
              for v in appr_staged.values() if v.get("title")))

    # ── deliberate residuals stay residual ──
    res_uts = {r["ut"] for r in residual}
    appr = [ut for ut in rows
            if not rows[ut].get("issuer")
            and re.search(r"\([^)]*articulation[^)]*\)\s*$", ut, re.I)
            and not re.search(r"high\s*school|\bHS\b|adult\s+(school|education|ed)|"
                              r"\bROP\b|\bROC\b", ut, re.I)]
    check("apprenticeship-articulation rows are residual (DIR-pending) OR staged "
          "via the region-sponsor lane",
          all(ut in res_uts or ut in appr_staged for ut in appr))
    check("Military-typed rows are never staged",
          all("Military" not in (rows[k].get("cpl_types") or []) for k in staged))

    # ── spot anchors (regenerate the plan if the data moved) ──
    check("spot: an Ironworker row stages the Iron Workers international",
          any(k.startswith("Ironworker") and "Iron Workers" in v["issuer"]
              for k, v in fam.items()))
    ab = staged.get("AB Miller High School Pathway — Business and Finance")
    check("spot: the AB Miller pathway row stages school-as-issuer + the stripped title (Rule 5f)",
          (ab is None) or (ab.get("issuer") == "AB Miller High School"
                           and ab.get("trainer") == "AB Miller High School"
                           and ab.get("title") == "Business and Finance"))
    summit = staged.get("Business and Finance (High School Articulation)")
    check("spot: the Summit HS row stages school-as-issuer + the stripped title (Rule 5f)",
          (summit is None) or (summit.get("issuer") == "Summit High School"
                               and summit.get("title") == "Business and Finance"))
    # Sam's 2026-07-08 Rule 5c examples (skip silently if the data moved):
    cr_row = staged.get("Administration of Justice — Community Relations")
    check("spot: 'AoJ — Community Relations' sheds its discipline prefix (Rule 5c)",
          (cr_row is None) or cr_row.get("title") == "Community Relations")
    aoj49 = staged.get("Administration of Justice 049")
    check("spot: the code-titled 'Administration of Justice 049' gains a COCI-"
          "aligned title (Rule 5c lookup)",
          (aoj49 is None) or bool(aoj49.get("title")))
    # Sam's 2026-07-08 Rule 5g examples:
    gtaw = staged.get("Advanced Gas Tungsten Arc Welding (GTAW)")
    check("spot: 'Advanced Gas Tungsten Arc Welding (GTAW)' restyles "
          "level-to-end (Rule 5g)",
          (gtaw is None)
          or gtaw.get("title") == "Gas Tungsten Arc Welding (GTAW) Advanced")
    check("spot: Advanced Placement titles are never level-moved "
          "(Rule 5g proper-name exemption)",
          all((v.get("title") or k).startswith("Advanced Placement")
              for k, v in staged.items() if k.startswith("Advanced Placement")))

    ok = sum(1 for _, c in results if c)
    for name, cond in results:
        print(("✓" if cond else "✗"), name)
    print(f"{ok}/{len(results)} checks passed")
    sys.exit(0 if ok == len(results) else 1)

if __name__ == "__main__":
    main()
