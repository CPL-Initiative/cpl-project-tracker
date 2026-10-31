#!/usr/bin/env python3
"""Guards kb/_fold_unclassified.py: a held assignment holds only itself.

Sam, Open Asks Sheet 94 card 1 (2026-10-18): "apply". Until then the fold applied nothing while
any saved assignment conflicted with a human-reviewed classification: 18 conflicts held 176 clean
assignments from 2026-07-08, while the tab promised each would fold on the next refresh. These
checks pin the per-assignment hold: a conflict is held and reported, the clean assignments beside
it fold, a supersede of an unreviewed machine draft still folds, a clean raw whose articulation
rows carry another title is held by itself, and a second run changes nothing.

Runs on a temporary knowledge base; no network. Run from repo root:
    python3 tests/fold_unclassified_test.py
"""
import io
import json
import os
import shutil
import sys
import tempfile
from contextlib import redirect_stdout

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _fold_unclassified as fu  # noqa: E402

results = []


def check(name, cond, why=""):
    results.append((name, bool(cond), why))


HUMAN = {"reviewed_by": "map@rccd.edu", "reviewed_at": "2026-10-01T10:00:00+00:00"}
RAW_CONFLICT = "ADJU 232 - Juvenile Justice Procedures - Credit by Exam"
RAW_CLEAN = "ACTG-51 APPLIED ACCOUNTING"
RAW_RIPPLE = "Pipe Welding - Credit by Exam"
RAW_SUPERSEDE = "AUTO 600 Completion"


def write(path, obj, minified=False):
    with open(path, "w", encoding="utf-8") as fh:
        if minified:
            json.dump(obj, fh, ensure_ascii=False, separators=(",", ":"))
        else:
            json.dump(obj, fh, indent=2, ensure_ascii=False)


def fixture(tmp):
    """Four saved assignments: one conflicts with a human-reviewed entry, one is clean, one is
    clean but its articulation rows carry another title, one supersedes a machine draft."""
    kb = os.path.join(tmp, "kb")
    os.makedirs(os.path.join(kb, "exhibit_audit"))
    write(os.path.join(kb, "unclassified_assignments.json"), {"assignments": {
        RAW_CONFLICT: dict(unified_title="Juvenile Justice Procedures", **HUMAN),
        RAW_CLEAN: dict(unified_title="Applied Accounting", issuing_agency="California Community Colleges", **HUMAN),
        RAW_RIPPLE: dict(unified_title="Pipe Welding", **HUMAN),
        RAW_SUPERSEDE: dict(unified_title="AUTO 600 Completion Certificate", **HUMAN),
    }})
    write(os.path.join(kb, "unified_titles.json"), {
        # A human reviewed this one in June; the saved assignment disagrees: a conflict.
        RAW_CONFLICT: {"unified_title": "Juvenile Law and Procedures", "confidence_title": 0.9,
                       "classified_at": "2026-05-20", "classified_by": "claude-batch",
                       "reviewed_at": "2026-06-02T18:32:36+00:00", "reviewed_by": "map@rccd.edu"},
        # An unreviewed machine draft: the saved assignment supersedes it.
        RAW_SUPERSEDE: {"unified_title": "AUTO 600 - Long Beach City College Auto Course",
                        "confidence_title": 0.42, "classified_at": "2026-05-20",
                        "classified_by": "claude-batch", "reviewed_at": None, "reviewed_by": None},
        "Unrelated": {"unified_title": "Unrelated", "confidence_title": 1.0, "classified_at": "2026-01-01",
                      "classified_by": "curator (CER unclassified-triage)", "reviewed_at": "2026-01-01",
                      "reviewed_by": "map@rccd.edu"},
    })
    write(os.path.join(kb, "credentials.json"), {
        "Juvenile Law and Procedures": [{"issuing_agency": "California Community Colleges", "training_agency": None,
                                         "confidence_issuer": 1.0, "confidence_trainer": 0.9,
                                         "classified_at": "2026-06-02", "classified_by": "curator",
                                         "reviewed_at": "2026-06-02", "reviewed_by": "map@rccd.edu"}],
    })
    write(os.path.join(kb, "coci_articulations.json"), {"articulations": [
        {"exhibit_title": RAW_RIPPLE, "unified_title": "Pipe Welding (SMAW)", "college": "A College"},
        {"exhibit_title": RAW_CLEAN, "unified_title": "Applied Accounting", "college": "A College"},
    ]})
    write(os.path.join(kb, "exhibit_audit", "latest.json"), {"title_cards": [
        {"raw_title": r, "unified_title": None, "tags": ["unclassified_in_map"]}
        for r in (RAW_CONFLICT, RAW_CLEAN, RAW_RIPPLE, RAW_SUPERSEDE)],
        "stats": {"tag_counts": {"unclassified_in_map": 4}, "unclassified_in_map": 4}}, minified=True)
    write(os.path.join(kb, "unclassified_suggestions.json"), {"suggestions": {}})
    return kb


def point_at(kb, outdir):
    fu.OVERLAY = os.path.join(kb, "unclassified_assignments.json")
    fu.SUGGEST = os.path.join(kb, "unclassified_suggestions.json")
    fu.UT_PATH = os.path.join(kb, "unified_titles.json")
    fu.CR_PATH = os.path.join(kb, "credentials.json")
    fu.AUDIT_PATH = os.path.join(kb, "exhibit_audit", "latest.json")
    fu.ART_PATH = os.path.join(kb, "coci_articulations.json")
    fu.OUTDIR = outdir
    fu.PANEL_PATH = os.path.join(kb, "credential_review_overlay.json")


def run(flag):
    sys.argv = ["_fold_unclassified.py", flag]
    buf = io.StringIO()
    with redirect_stdout(buf):
        fu.main()
    return buf.getvalue()


def load(path):
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


tmp = tempfile.mkdtemp(prefix="fold-test-")
try:
    kb = fixture(tmp)
    out = os.path.join(tmp, "out")
    point_at(kb, out)

    log = run("--apply-if-safe")
    ut = load(fu.UT_PATH)
    report = load(os.path.join(out, "report.json"))
    applied = load(os.path.join(out, "applied.json"))

    check("the clean assignment folds while a conflict stands beside it",
          ut.get(RAW_CLEAN, {}).get("unified_title") == "Applied Accounting", log)
    check("the conflict is held: the human-reviewed classification stands",
          ut[RAW_CONFLICT]["unified_title"] == "Juvenile Law and Procedures"
          and ut[RAW_CONFLICT]["reviewed_at"] == "2026-06-02T18:32:36+00:00")
    check("a clean raw whose articulation rows carry another title is held by itself",
          RAW_RIPPLE not in ut)
    check("the supersede of an unreviewed machine draft still folds",
          ut[RAW_SUPERSEDE]["unified_title"] == "AUTO 600 Completion Certificate"
          and ut[RAW_SUPERSEDE]["classified_by"] == fu.CLASSIFIED_BY)
    check("the untouched entry is untouched", ut["Unrelated"]["unified_title"] == "Unrelated")

    held = {h["raw"]: h for h in report.get("held", [])}
    check("the report lists each held assignment with its kind and why",
          set(held) == {RAW_CONFLICT, RAW_RIPPLE}
          and held[RAW_CONFLICT]["kind"] == "conflict"
          and held[RAW_CONFLICT]["why"].startswith("human-reviewed classification stands")
          and held[RAW_RIPPLE]["kind"] == "ripple"
          and "Pipe Welding (SMAW)" in held[RAW_RIPPLE]["why"], held)
    check("the receipt names what folded and what was held",
          [r["raw"] for r in applied["folded"]] == [RAW_CLEAN]
          and [r["raw"] for r in applied["superseded"]] == [RAW_SUPERSEDE]
          and {h["raw"] for h in applied["held"]} == {RAW_CONFLICT, RAW_RIPPLE})
    check("no gate blocks the apply any more", report["apply_safe"] is True
          and "V1_apply_safe" not in report["gates"] and "V4_no_articulation_ripple" not in report["gates"])
    check("the credential record for the folded title is added with its issuer",
          load(fu.CR_PATH).get("Applied Accounting", [{}])[0].get("issuing_agency") == "California Community Colleges")
    audit = load(fu.AUDIT_PATH)
    pruned = {c["raw_title"] for c in audit["title_cards"] if c.get("unified_title")}
    check("the audit snapshot drops only the folded raws",
          pruned == {RAW_CLEAN, RAW_SUPERSEDE} and audit["stats"]["unclassified_in_map"] == 2)
    check("the log says how many were held", "held" in log and "APPLIED" in log, log)

    # A second run: the folded ones are skipped, the held ones are still held, nothing changes.
    before = json.dumps(ut, sort_keys=True)
    log2 = run("--apply-if-safe")
    check("a second run folds nothing and changes nothing",
          json.dumps(load(fu.UT_PATH), sort_keys=True) == before and "Nothing to fold" in log2, log2)
    report2 = load(os.path.join(out, "report.json"))
    check("the second run still reports the two held assignments",
          {h["raw"] for h in report2["held"]} == {RAW_CONFLICT, RAW_RIPPLE})

    # The manual --apply never exits on a held assignment either.
    shutil.rmtree(out)
    kb2 = fixture(os.path.join(tmp, "second"))
    point_at(kb2, out)
    try:
        log3 = run("--apply")
        check("--apply folds the clean assignments and does not stop on a held one",
              "APPLIED" in log3 and load(fu.UT_PATH).get(RAW_CLEAN, {}).get("unified_title") == "Applied Accounting")
    except SystemExit as exc:
        check("--apply folds the clean assignments and does not stop on a held one", False, str(exc))

    # The revise lane (Another look, Sam 2026-10-31): a person re-picks a title the reference holds,
    # naming the title it replaces. It lands while that title still stands, and only then.
    kb3 = os.path.join(tmp, "revise", "kb")
    os.makedirs(os.path.join(kb3, "exhibit_audit"))
    A1, SPAN, MOVED, OLDER = "Noncredit for AUTO A1", "SPAN 001: Elementary Spanish I", "Moved meanwhile", "Kept older"
    SAM_EARLIER = {"reviewed_by": "slee@cccco.edu", "reviewed_at": "2026-10-31T14:00:00+00:00"}
    SAM_LATER = {"reviewed_by": "slee@cccco.edu", "reviewed_at": "2026-11-01T18:00:00+00:00"}
    curator = lambda t, who: {"unified_title": t, "confidence_title": 1.0, "classified_at": "2026-10-31",  # noqa: E731
                              "classified_by": fu.CLASSIFIED_BY, **who}
    write(os.path.join(kb3, "unified_titles.json"), {
        A1: curator("Engine Repair", SAM_EARLIER),
        SPAN: curator("Elementary Spanish I", SAM_EARLIER),
        "SPAN 1 at another college": curator("Elementary Spanish 1", SAM_EARLIER),
        MOVED: curator("Changed Since", {"reviewed_by": "map@rccd.edu", "reviewed_at": "2026-11-01T10:00:00+00:00"}),
        OLDER: curator("W", {"reviewed_by": "map@rccd.edu", "reviewed_at": "2026-11-05T10:00:00+00:00"}),
    })
    rec = lambda: [{"issuing_agency": "California Community Colleges", "training_agency": None,  # noqa: E731
                    "classified_by": fu.CLASSIFIED_BY, **SAM_EARLIER}]
    write(os.path.join(kb3, "credentials.json"), {"Engine Repair": rec(), "Elementary Spanish I": rec(),
                                                  "Elementary Spanish 1": rec(), "Changed Since": rec(), "W": rec()})
    write(os.path.join(kb3, "unclassified_assignments.json"), {"assignments": {
        A1: dict(unified_title="Automotive Technology (ASE A1 Engine Repair)", supersedes="Engine Repair",
                 issuing_agency="California Community Colleges", **SAM_LATER),
        SPAN: dict(unified_title="Elementary Spanish 1", supersedes="Elementary Spanish I", **SAM_LATER),
        MOVED: dict(unified_title="Y", supersedes="Old Name", **SAM_LATER),
        OLDER: dict(unified_title="Z", supersedes="W", **SAM_LATER),
    }})
    write(os.path.join(kb3, "coci_articulations.json"), {"articulations": [
        {"exhibit_title": A1, "unified_title": "Engine Repair", "college": "Las Positas College"}]})
    write(os.path.join(kb3, "exhibit_audit", "latest.json"), {"title_cards": [], "stats": {}}, minified=True)
    write(os.path.join(kb3, "unclassified_suggestions.json"), {"suggestions": {}})
    write(os.path.join(kb3, "credential_review_overlay.json"),
          {"overrides": {"Engine Repair": {"issuing_agency_override": "Local High School"}}})
    out3 = os.path.join(tmp, "revise", "out")
    point_at(kb3, out3)
    fu.PANEL_PATH = os.path.join(kb3, "credential_review_overlay.json")
    log4 = run("--apply-if-safe")
    ut3, cr3 = load(fu.UT_PATH), load(fu.CR_PATH)
    rep3 = load(os.path.join(out3, "report.json"))
    check("a re-pick naming the title that still stands lands (revise)",
          ut3[A1]["unified_title"] == "Automotive Technology (ASE A1 Engine Repair)"
          and ut3[A1].get("_revised_from") == "Engine Repair"
          and ut3[A1]["reviewed_at"] == SAM_LATER["reviewed_at"], log4)
    check("the emptied credential is renamed to the new title, its records kept",
          "Engine Repair" not in cr3
          and cr3.get("Automotive Technology (ASE A1 Engine Repair)", [{}])[0].get("_renamed_from") == "Engine Repair"
          and len(cr3["Automotive Technology (ASE A1 Engine Repair)"]) == 1)
    check("the receipt names the panel rows left under the old name",
          [m["panel_rows_left"] for m in rep3["credential_moves"]] == [["issuing_agency_override"]])
    check("a revise into a credential that exists retires the emptied one, whole, in the receipt",
          ut3[SPAN]["unified_title"] == "Elementary Spanish 1" and "Elementary Spanish I" not in cr3
          and [m["title"] for m in rep3["credential_retires"]] == ["Elementary Spanish I"]
          and rep3["credential_retires"][0]["records"][0]["issuing_agency"] == "California Community Colleges")
    check("a re-pick whose replaced title changed meanwhile is held as a conflict",
          ut3[MOVED]["unified_title"] == "Changed Since"
          and any(h["raw"] == MOVED and h["kind"] == "conflict" for h in rep3["held"]))
    check("a re-pick older than the reference's decision is stale, never applied",
          ut3[OLDER]["unified_title"] == "W" and [r["raw"] for r in rep3["stale"]] == [OLDER])
    check("the articulation row moves with the revised title",
          load(fu.ART_PATH)["articulations"][0]["unified_title"] == "Automotive Technology (ASE A1 Engine Repair)")
    before3 = json.dumps([ut3, cr3], sort_keys=True)
    run("--apply-if-safe")
    check("a second run changes nothing after a revise",
          json.dumps([load(fu.UT_PATH), load(fu.CR_PATH)], sort_keys=True) == before3)
finally:
    shutil.rmtree(tmp, ignore_errors=True)

failed = [r for r in results if not r[1]]
for name, ok, why in results:
    print(("PASS " if ok else "FAIL ") + name + ("" if ok else "  " + repr(why)[:400]))
print("%d checks, %d failed" % (len(results), len(failed)))
sys.exit(1 if failed else 0)
