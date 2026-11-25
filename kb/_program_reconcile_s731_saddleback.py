#!/usr/bin/env python3
"""S731, lane 2: Saddleback's repeat steps, for the seven records S730's plan s730b held on the reconcile lever.

S730's piles (kb/_program_piles_s730_saddleback.py on claude/s730-piles-saddleback, plan s730b) held seven Saddleback
College records on the reconcile_steps lever (p-gap-filing-leaves-census-lever-s721): each page prints 'The following
course must be taken twice for a total of two units: 2.0' over a 1-unit course, ETT 142 (19050, 19051) or MUS 50
(41420, 41422, 41423, 41425, 41426), and the reading lists the course once, so each record falls one unit short of its
printed total. Sam's collect-with-gaps ruling (sam-collect-with-gaps-2026-11-17) and collection first put them back.

THE READING (kb/program_requirements_reconcile.json, Saddleback College; the repeat kind in
kb/_program_requirements_reconcile.py): two pattern steps, the words before the course and the course before the
words (the capture keeps no page text, so both orders are read), each with block_sum: the course counts twice only
as a listed course of a rule-all block whose courses, with the count, add exactly to the block's stated figure (the
name_pattern reading's own guard, S673). Commercial Music 41419 and Music 33565 print the same words over MUS 50 read
as a 'choose 2 units' list, which already counts it twice, and stay as filed; so do Music 04073 (MUS 50 'may be taken
up to 4 times' in a choose list), Theatre Arts Performance and Acting 04074 (ETT 142 in a choose list) and Theatre
Arts 32307 (ETT 142 with ETT 100 in a rule-all block of 3, which the count would carry past its figure).

THE SELF-RECALL (the S652 rule): recall() runs Saddleback's steps on every committed Saddleback record with a stand-in
text that prints the words over both courses, so the record-side guards alone decide: a fire on one of the seven is
right, a fire anywhere else wrong, and no fire on one of the seven wrong. Each fire's record then passes today's
scorer. Boundary readings: the words gone from the text, the block's stated figure one unit off, the block read as a
choose list, the course given a count, a course of the block with no units, the course an alternative.

THE RUN (the conductor's brief, S731): a reconcile of Saddleback on this branch, program-requirements-college.yml with
step=reconcile, extract=0, college "Saddleback College" (free, no model call). It reads every page again and
reconciles every filed record; keep-only then puts every other record back as the base filed it
(d-rios-reconcile-keeps-only-targets-s720) and checks each target: carried by the run, its base an earlier run's
filing (p-keep-only-trusts-base-s727), the record changed in its course's times alone, the step's note filed, and
its arithmetic passing. It refuses, writing nothing, unless all seven are kept and every restored file is free of the
run, and refuses again if any other record still carries the run; then it runs both Commons builders under python3.12.

    python3 kb/_program_reconcile_s731_saddleback.py
    python3 kb/_program_reconcile_s731_saddleback.py keep-only --run <reconcile run id> --base <the run's commit's parent>

Guard: tests/program_reconcile_s731_saddleback_test.py.
"""
from __future__ import annotations

import argparse
import collections
import copy
import glob
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_requirements_reconcile as R  # noqa: E402
import _program_requirements_score as S  # noqa: E402

ROOT = os.path.dirname(HERE)
COLLEGE = "Saddleback College"
SLUG = "saddleback"
COLLEGE_DIR = os.path.join(HERE, "program_requirements_college")
# The seven, each with its course and its arithmetic before the step and after it (today's scorer, no closed list).
TARGETS = {
    "19050": {"code": "ETT 142", "before": [17, 18], "stated": [18, 19]},
    "19051": {"code": "ETT 142", "before": [27, 28], "stated": [28, 29]},
    "41420": {"code": "MUS 50", "before": [16, 16], "stated": [17, 17]},
    "41422": {"code": "MUS 50", "before": [17.5, 17.5], "stated": [18.5, 18.5]},
    "41423": {"code": "MUS 50", "before": [16, 17], "stated": [17, 18]},
    "41425": {"code": "MUS 50", "before": [21, 21], "stated": [22, 22]},
    "41426": {"code": "MUS 50", "before": [16, 16], "stated": [17, 17]},
}
# The other Saddleback records that carry either course, each with why the step leaves it.
KEPT = {
    "04073": "MUS 50 'may be taken up to 4 times' sits in a choose_units list (Restricted Electives 4-6)",
    "04074": "ETT 142 ('If ETT 142 is selected, course needs to be taken two times') sits in a choose_units list",
    "32307": "ETT 142 sits with ETT 100 in a rule-all block of 3 the pair already fills; taken twice it adds to 4",
    "33565": "the words print over MUS 50 read as a 'choose 2 units' list, which already counts it twice",
    "41419": "the words print over MUS 50 read as a 'choose 2 units' list, which already counts it twice",
}
_WORDS = "The following course must be taken twice for a total of two units: 2.0"
# A page text that prints the words over both courses, so the record-side guards alone decide.
STAND_IN = "%s\nMUS 50 Music Performance 1.0\n%s\nETT 142 Stage Crew 1.0\n" % (_WORDS, _WORDS)


def _path(cn: str) -> str:
    return os.path.join(COLLEGE_DIR, SLUG, "records", cn + ".json")


def _load(cn: str) -> dict | None:
    if not os.path.isfile(_path(cn)):
        return None
    with open(_path(cn), encoding="utf-8") as fh:
        return json.load(fh)


def steps() -> list[dict]:
    """Saddleback's repeat steps, as its config carries them."""
    return [s for s in R.load_steps()[COLLEGE]["steps"] if s["kind"] == "repeat"]


def run_steps(filed: dict, text: str = STAND_IN, sts: list | None = None) -> tuple[dict, list[dict]]:
    """Saddleback's repeat steps alone on the record."""
    return R._college_steps(filed.get("record") or {}, text, "X", filed.get("award"),
                            steps={"X": {"steps": steps() if sts is None else sts}},
                            control_number=filed.get("control_number"))


def arith(record: dict, award) -> dict:
    return S.score(record, [], None, award).get("arithmetic") or {}


def _pair(v):
    return None if v is None else [float(v[0]), float(v[1])]


def reconciled_by_step(filed: dict) -> dict | None:
    """The run's note, where a reconcile already counted the target's course twice."""
    cn = str(filed.get("control_number"))
    code = (TARGETS.get(cn) or {}).get("code")
    for n in filed.get("reconciled") or []:
        if isinstance(n, dict) and n.get("field") == "times" and (n.get("now") or {}).get(code) == 2:
            return n
    return None


def _times(record: dict, code: str) -> list:
    return [c.get("times") for b in record.get("blocks") or [] for c in b.get("courses") or []
            if S.norm_code(c.get("code") or "") == S.norm_code(code)]


def outcome(cn: str, f: dict | None = None) -> dict:
    """A target's arithmetic before the step and after it (the step on the filed record, or the run's filing)."""
    f = _load(cn) if f is None else f
    e = TARGETS[cn]
    if reconciled_by_step(f):
        rec = f["record"]
        before = copy.deepcopy(rec)
        for b in before["blocks"]:
            for c in b.get("courses") or []:
                if S.norm_code(c.get("code") or "") == S.norm_code(e["code"]):
                    c.pop("times", None)
    else:
        before = f["record"]
        rec = run_steps(f)[0]
    a0, a1 = arith(before, f.get("award")), arith(rec, f.get("award"))
    return {"control_number": cn, "code": e["code"], "state": "after" if reconciled_by_step(f) else "before",
            "before": [a0.get("status"), a0.get("computed"), a0.get("stated")],
            "after": [a1.get("status"), a1.get("computed"), a1.get("stated")], "times": _times(rec, e["code"])}


def recall() -> dict:
    """The steps over every committed Saddleback record, with the stand-in text: a fire on one of the seven is right,
    anywhere else wrong; each fire's record must pass today's scorer."""
    out = {"read": 0, "fired": [], "right": 0, "wrong": [], "after_not_passing": [], "carriers_kept": []}
    for p in sorted(glob.glob(os.path.join(COLLEGE_DIR, SLUG, "records", "*.json"))):
        with open(p, encoding="utf-8") as fh:
            f = json.load(fh)
        if not isinstance(f.get("record"), dict):
            continue
        out["read"] += 1
        cn = str(f.get("control_number"))
        if cn in TARGETS and reconciled_by_step(f):
            # After the run: the target already carries the count; the steps have nothing left to set.
            out["fired"].append(cn)
            ok = _times(f["record"], TARGETS[cn]["code"]) == [2] and not run_steps(f)[1]
            if ok:
                out["right"] += 1
            else:
                out["wrong"].append([cn, "reconciled, but not as the reading says"])
            if arith(f["record"], f.get("award")).get("status") != "equal":
                out["after_not_passing"].append(cn)
            continue
        new, notes = run_steps(f)
        fired = bool(notes)
        if fired:
            out["fired"].append(cn)
        if cn in KEPT and not fired:
            out["carriers_kept"].append(cn)
        if fired != (cn in TARGETS):
            out["wrong"].append([cn, "fired" if fired else "did not fire"])
            continue
        if fired and (len(notes) != 1 or _times(new, TARGETS[cn]["code"]) != [2]):
            out["wrong"].append([cn, "fired, but not once on its course"])
            continue
        out["right"] += 1
        if fired and arith(new, f.get("award")).get("status") != "equal":
            out["after_not_passing"].append(cn)
    return out


def _before_image(f: dict) -> dict:
    """After the run, the target as the base filed it (the count taken off), so the boundaries read the same."""
    if not reconciled_by_step(f):
        return f
    g = copy.deepcopy(f)
    for b in g["record"]["blocks"]:
        for c in b.get("courses") or []:
            c.pop("times", None)
    return g


def boundaries() -> dict:
    """Each target with one thing the reading needs taken away: the steps must not fire."""
    out, wrong = collections.Counter(), []

    def tally(name, ok, cn):
        out["%s %s" % (name, "right" if ok else "wrong")] += 1
        if not ok:
            wrong.append([cn, name])

    def block_of(g, code):
        return next(b for b in g["record"]["blocks"] for c in b.get("courses") or []
                    if S.norm_code(c.get("code") or "") == S.norm_code(code))

    for cn, e in TARGETS.items():
        f = _before_image(_load(cn))
        tally("fires as filed", bool(run_steps(f)[1]), cn)
        tally("the words gone from the text", not run_steps(f, text="MUS 50 1.0\nETT 142 1.0\n")[1], cn)
        tally("taken three times in the text", not run_steps(f, text=STAND_IN.replace("twice", "three times"))[1], cn)
        g = copy.deepcopy(f)
        b = block_of(g, e["code"])
        b["stated"] = {"min": b["stated"]["min"] + 1, "max": b["stated"]["max"] + 1}
        tally("the block's figure one unit off", not run_steps(g)[1], cn)
        g = copy.deepcopy(f)
        block_of(g, e["code"])["rule"] = "choose_units"
        tally("the block read as a choose list", not run_steps(g)[1], cn)
        g = copy.deepcopy(f)
        b = block_of(g, e["code"])
        next(c for c in b["courses"] if S.norm_code(c["code"]) == S.norm_code(e["code"]))["times"] = 3
        tally("the course given a count", not run_steps(g)[1], cn)
        g = copy.deepcopy(f)
        b = block_of(g, e["code"])
        b["courses"].append({"code": "MUS 999", "units": None, "units_max": None, "alternatives": []})
        tally("a course of the block with no units", not run_steps(g)[1], cn)
        g = copy.deepcopy(f)
        b = block_of(g, e["code"])
        c = next(c for c in b["courses"] if S.norm_code(c["code"]) == S.norm_code(e["code"]))
        b["courses"].remove(c)
        b["courses"].append({"code": "MUS 998", "units": c["units"], "units_max": None, "alternatives": [dict(c)]})
        tally("the course an alternative", not run_steps(g)[1], cn)
    return {"counts": dict(out), "wrong": wrong}


def check_target(cn: str, f: dict, b: dict | None) -> str | None:
    """Why a target the reconcile run filed (f) is not as the reading says, against its base filing (b)."""
    import _program_requirements_college as C
    if b is None:
        return "no base filing"
    code = TARGETS[cn]["code"]
    if str(b.get("extracted_run")) == str(f.get("extracted_run")) or _times(b.get("record") or {}, code) != [None]:
        return "the base is not an earlier run's filing without the count: --base is not the filing before the run"
    if not reconciled_by_step(f):
        return "the step's note is not filed"
    rec_b = copy.deepcopy(b["record"])
    for blk in rec_b["blocks"]:
        for c in blk.get("courses") or []:
            if S.norm_code(c.get("code") or "") == S.norm_code(code):
                c["times"] = 2
    if rec_b != f["record"]:
        return "the run changed more than the course's times"
    if not C.same_address(f.get("source_url") or "", b.get("source_url") or ""):
        return "the run read another page"
    a = (f.get("score") or {}).get("arithmetic") or {}
    if a.get("pass") is not True or a.get("status") != "equal":
        return "the rescore does not pass"
    return None


def keep_only_plan(run: str, current: dict, base: dict) -> dict:
    """What keep-only writes, decided before anything is written (Butte's form, kb/_program_reconcile_s727_butte.py)."""
    held, kept, restore = [], [], {}
    for cn, f in sorted(current.items()):
        carried = str(f.get("extracted_run")) == str(run)
        if cn in TARGETS:
            if not carried:
                held.append([cn, "the run did not carry it"])
                continue
            why = check_target(cn, f, json.loads(base[cn]) if base.get(cn) else None)
            if why:
                held.append([cn, why])
            else:
                kept.append(cn)
        elif carried:
            body = base.get(cn)
            if body is None:
                held.append([cn, "no base filing to restore"])
            elif str(json.loads(body).get("extracted_run")) == str(run):
                held.append([cn, "the base still carries the run: --base is not the filing before the run"])
            else:
                restore[cn] = body
    held += [[cn, "no record file"] for cn in sorted(set(TARGETS) - set(current))]
    return {"kept": kept, "restore": restore, "held": held}


def keep_only(run: str, base: str, build: bool = True) -> dict:
    """After the reconcile run filed on this branch: every Saddleback record but the seven goes back to the base
    commit's filing, and each target is checked (keep_only_plan). Refuses, writing nothing, unless all seven are kept;
    after writing, refuses again if any record but the seven still carries the run. Then both Commons builders run."""
    current, base_text = {}, {}
    for p in sorted(glob.glob(os.path.join(COLLEGE_DIR, SLUG, "records", "*.json"))):
        cn = os.path.basename(p)[:-5]
        with open(p, encoding="utf-8") as fh:
            current[cn] = json.load(fh)
        if cn in TARGETS or str(current[cn].get("extracted_run")) == str(run):
            was = subprocess.run(["git", "show", "%s:%s" % (base, os.path.relpath(p, ROOT))],
                                 capture_output=True, text=True, cwd=ROOT)
            base_text[cn] = was.stdout if was.returncode == 0 else None
    plan = keep_only_plan(run, current, base_text)
    if plan["held"] or sorted(plan["kept"]) != sorted(TARGETS):
        raise SystemExit("keep-only refused, nothing written: %s" % plan["held"])
    for cn, body in plan["restore"].items():
        with open(_path(cn), "w", encoding="utf-8") as fh:
            fh.write(body)
    still = []
    for p in glob.glob(os.path.join(COLLEGE_DIR, SLUG, "records", "*.json")):
        cn = os.path.basename(p)[:-5]
        with open(p, encoding="utf-8") as fh:
            if cn not in TARGETS and str(json.load(fh).get("extracted_run")) == str(run):
                still.append(cn)
    if still:
        raise SystemExit("keep-only: records beside the seven still carry the run: %s" % sorted(still))
    if build:
        subprocess.run(["python3", "kb/_build_commons_status.py", "--quiet"], check=True, cwd=ROOT)
        subprocess.run(["python3", "kb/_build_commons_data_status.py"], check=True, cwd=ROOT)
    return {"run": run, "base": base, "kept": sorted(plan["kept"]), "restored": len(plan["restore"]),
            "next": "commit the records and the Commons builders' output, then dispatch step=reread"}


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = ap.add_subparsers(dest="cmd")
    k = sub.add_parser("keep-only")
    k.add_argument("--run", required=True)
    k.add_argument("--base", required=True, help="the commit before the run's own (the run's commit's parent)")
    k.add_argument("--no-build", action="store_true", help="skip the Commons builders")
    a = ap.parse_args(argv)
    if a.cmd == "keep-only":
        print(json.dumps(keep_only(a.run, a.base, build=not a.no_build)))
        return 0
    rc, bd = recall(), boundaries()
    print("recall: %s" % json.dumps(rc))
    print("boundaries: %s" % json.dumps(bd))
    for cn in TARGETS:
        print("outcome: %s" % json.dumps(outcome(cn)))
    return 1 if rc["wrong"] or rc["after_not_passing"] or sorted(rc["fired"]) != sorted(TARGETS) \
        or sorted(rc["carriers_kept"]) != sorted(KEPT) or bd["wrong"] else 0


if __name__ == "__main__":
    sys.exit(main())
