#!/usr/bin/env python3
"""emptied_title_guard_test.py — a person's saved fold rows on a title that holds no exhibit do nothing.

Sky and COBIx, 2026-11-11 (#3110, comments 6805765536 point 2 and 6808678022): a plan never retires a
person's saved row on an emptied title; the readers ignore it. A title is emptied when no
kb/unified_titles.json raw maps to it (the fold's own test, kb/_fold_unclassified.py's revise lane).

The fixture is the S638 state after the ASE plans and the nightly fold, with Sam's rows restored:
"Heating and Air Conditioning" holds no exhibit and still carries his rename, his merge confirm into
"Heating and Air Conditioning (ASE A7 standards)" and his 15:47 issuer override; "Automotive Braking
Systems" holds no exhibit, has no credentials.json record left, and carries his rename. Without the guard
the dry run folds the first (a rule 1 issuer conflict on the A7 standards title) and fails V2 on the
second (the whole apply refuses). With it: no fold, no conflict, no rename from either, and the apply
stays safe. Give the first title a raw again and the same rows fold, conflict and all.

Run from the repo root:
    python3 tests/emptied_title_guard_test.py
"""
import contextlib
import io
import json
import os
import shutil
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import fold_issuer  # noqa: E402
import _cred_rename_dryrun as dry  # noqa: E402
import _cred_rename_apply as app  # noqa: E402

results = []
ASE = "National Institute for Automotive Service Excellence (ASE)"
CCC = "California Community Colleges"
SAM = "slee@cccco.edu"
HAC = "Heating and Air Conditioning"
HAC_T = "Heating and Air Conditioning (ASE A7 standards)"
LEAD = "Automotive Technology (ASE A7 Heating and Air Conditioning)"
ABS = "Automotive Braking Systems"
BR_T = "Brakes (ASE A5 standards)"
F1, F2 = "2026-11-11T15:26:54Z", "2026-11-11T15:26:55Z"


def check(name, cond, why=""):
    results.append((name, bool(cond), why))


def ov(**fields):
    e, stamps = {}, {}
    for f, (v, by, at) in fields.items():
        e[f] = v
        stamps[f] = {"by": by, "at": at}
    last = max(stamps.values(), key=lambda s: s["at"])
    e["reviewed_by"], e["reviewed_at"] = last["by"], last["at"]
    e["field_reviews"] = stamps
    return e


def write(path, obj):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2, ensure_ascii=False)


def read(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


CREDS = {
    LEAD: [{"issuing_agency": ASE, "training_agency": None}],
    # The emptied title's record is still there (a reviewed record the fold left orphaned).
    HAC: [{"issuing_agency": ASE, "training_agency": None}],
    "Untouched": [{"issuing_agency": CCC, "training_agency": None}],
}
OVERLAY = {
    # A non-emptied lead with no confirm: it creates the A7 standards title.
    LEAD: ov(issuing_agency_override=(ASE, SAM, "2026-07-09T00:07:08Z"), unified_title_override=(HAC_T, SAM, F1)),
    # Sam's three rows on the emptied title, the issuer saved after the fold (rule 1 if it were read).
    HAC: ov(issuing_agency_override=("California Community College Chancellor's Office", SAM, "2026-11-11T15:47:58Z"),
            unified_title_override=(HAC_T, SAM, F2), unified_title_merge_confirm=(HAC_T, SAM, F2)),
    # Sam's rename on an emptied title with no credentials.json record: V2 would refuse the whole apply.
    ABS: ov(unified_title_override=(BR_T, SAM, F1)),
}
UT_EMPTIED = {
    "AUTO A7": {"unified_title": LEAD},
    "Other": {"unified_title": "Untouched"},
    # MIL7 moved off Heating and Air Conditioning, MIL3 and MIL4 off Automotive Braking Systems.
    "Automotive Service Excellence MIL7 - Heating, Ventilation & Air Conditioning":
        {"unified_title": "Military Tactical Wheeled Vehicle – Heating, Ventilation and Air Conditioning (ASE MIL7)"},
}

tmp = tempfile.mkdtemp(prefix="emptied_guard_")
try:
    paths = {n: os.path.join(tmp, n) for n in
             ("credentials.json", "unified_titles.json", "coci_articulations.json",
              "credential_review_overlay.json", "exhibits_related.json")}
    dry_out = os.path.join(tmp, "cred_rename_dryrun")
    out_root = os.path.join(tmp, "cred_rename_out")
    for mod in (dry, app):
        mod.CREDENTIALS = paths["credentials.json"]
        mod.UNIFIED_TITLES = paths["unified_titles.json"]
        mod.ARTICULATIONS = paths["coci_articulations.json"]
    dry.OVERLAY = app.OVERLAY = paths["credential_review_overlay.json"]
    dry.RELATED = app.RELATED = paths["exhibits_related.json"]
    dry.FAMILIES = app.FAMILIES = os.path.join(tmp, "no_families.json")
    dry.OUT_DIR = app.DRYRUN_OUT = dry_out
    app.ALIAS_PATH = os.path.join(dry_out, "alias_map.json")
    app.OUT_ROOT = out_root

    def setup(ut):
        write(paths["credentials.json"], CREDS)
        write(paths["unified_titles.json"], ut)
        write(paths["coci_articulations.json"], {"articulations": []})
        write(paths["credential_review_overlay.json"], {"_read_at": "2026-11-11T23:00:00Z", "overrides": OVERLAY})
        write(paths["exhibits_related.json"], {"titles": []})
        with contextlib.redirect_stdout(io.StringIO()):
            dry.main()
        return read(os.path.join(dry_out, "alias_map.json")), read(os.path.join(dry_out, "collisions.json"))

    # ── the emptied state ────────────────────────────────────────────────
    amap, coll = setup(UT_EMPTIED)
    planned = set(amap["renames"]) | set(amap["merges"])
    check("dry run: an emptied title's merge confirm folds nothing", HAC not in amap["merges"], json.dumps(amap["merges"]))
    check("dry run: an emptied title's override renames nothing", HAC not in amap["renames"] and ABS not in amap["renames"],
          json.dumps(amap["renames"]))
    check("dry run: an emptied title never waits as a collision either",
          not {c["old_unified_title"] for c in coll["collisions"]} & {HAC, ABS})
    check("dry run: the non-emptied lead still renames onto the standards title",
          amap["renames"].get(LEAD) == HAC_T, json.dumps(amap["renames"]))
    prev = amap["issuer_preview"]
    check("dry run: no issuer conflict and no rule 1 from the emptied title's issuer row",
          not any(g["conflict"] or g["rule"] == "reviewer" for g in prev.values()), json.dumps(prev)[:300])
    check("dry run: an emptied title with no record no longer fails V2; the apply stays safe",
          amap["summary"]["apply_safe"] is True and amap["summary"]["v2_source_exists_pass"] is True,
          json.dumps(amap["summary"]))
    held = {(h["old"], h["kind"]) for h in amap["held_emptied"]}
    check("dry run: both emptied titles are named as held, the merge as a merge",
          held == {(HAC, "merge"), (ABS, "rename")} and amap["summary"]["held_emptied_titles"] == 2, str(held))
    report = open(os.path.join(dry_out, "report.md"), encoding="utf-8").read()
    check("dry run: the report names the held titles", "holds no exhibit" in report and HAC in report)

    def run_apply(buf=None):
        """The apply's own refusal (sys.exit on apply_safe false) is a result here, never a crash."""
        try:
            with contextlib.redirect_stdout(buf or io.StringIO()):
                app.main()
            return None
        except SystemExit as e:
            return str(e)

    refused = run_apply()
    check("apply: runs rather than refusing the whole batch", refused is None, str(refused)[:200])
    creds = read(paths["credentials.json"])
    check("apply: the emptied title's record is not folded", creds.get(HAC) == CREDS[HAC], json.dumps(creds.get(HAC)))
    check("apply: the lead renames", LEAD not in creds and creds.get(HAC_T) == CREDS[LEAD])
    outs = sorted(os.listdir(out_root)) if os.path.isdir(out_root) else []
    snap = read(os.path.join(out_root, outs[-1], "alias_map.json")) if outs else {"renames": {HAC: "?"}, "merges": {}}
    check("apply: the frozen alias map the kb_curation carry reads names neither emptied title",
          not ({HAC, ABS} & (set(snap["renames"]) | set(snap["merges"]))))
    check("apply: no resolution row and no issuer decision for the emptied title",
          not snap.get("issuer_resolution") and not snap.get("resolution_rows"), json.dumps(snap.get("resolution_rows")))

    # ── the apply holds an emptied fold even from a stale alias map ─────
    write(paths["credentials.json"], CREDS)
    stale = dict(amap, renames={LEAD: HAC_T}, merges={HAC: HAC_T})
    write(app.ALIAS_PATH, stale)
    shutil.rmtree(out_root, ignore_errors=True)
    buf = io.StringIO()
    run_apply(buf)
    creds = read(paths["credentials.json"])
    check("apply: a merge of an emptied title in a stale alias map is held, not folded",
          creds.get(HAC) == CREDS[HAC] and fold_issuer.EMPTIED_HELD_LINE in buf.getvalue(), buf.getvalue()[-300:])

    # ── the same rows act again once the title holds an exhibit ──────────
    shutil.rmtree(out_root, ignore_errors=True)
    amap2, _ = setup(dict(UT_EMPTIED, **{"HVAC NC": {"unified_title": HAC}, "AUTO 52": {"unified_title": ABS}}))
    check("revived: the merge confirm folds again", amap2["merges"].get(HAC) == HAC_T, json.dumps(amap2["merges"]))
    g = amap2["issuer_preview"].get(HAC_T) or {}
    check("revived: Sam's issuer set after the fold decides by rule 1, with the conflict",
          g.get("rule") == "reviewer" and g.get("winner") == CCC and g.get("conflict"), json.dumps(g)[:300])
    check("revived: the rename acts again", amap2["renames"].get(ABS) == BR_T, json.dumps(amap2["renames"]))
    check("revived: nothing is held", amap2["held_emptied"] == [])

    # ── the shared helper ────────────────────────────────────────────────
    r, m, h = fold_issuer.hold_emptied_folds({"A": "X", "B": "Y"}, {"C": "X"}, {"A"})
    check("helper: keeps a source that holds an exhibit, holds the rest",
          r == {"A": "X"} and m == {} and [x["old"] for x in h] == ["B", "C"])
    check("helper: titles_holding_exhibits reads the raws' unified titles",
          fold_issuer.titles_holding_exhibits({"a": {"unified_title": "T"}, "b": {}, "c": None}) == {"T"})
finally:
    shutil.rmtree(tmp, ignore_errors=True)

failed = [r for r in results if not r[1]]
for name, ok, why in results:
    print(("PASS " if ok else "FAIL ") + name + ("" if ok or not why else "  -- " + why))
print(f"{len(results) - len(failed)}/{len(results)} passed")
sys.exit(1 if failed else 0)
