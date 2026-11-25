#!/usr/bin/env python3
"""S730 (elumen2): the eLumen follow-up after #3810, at Antelope Valley and College of the Redwoods.

    python3 kb/_elumen_own_page_s730.py plan                  # the list, from the committed captures and records
    python3 kb/_elumen_own_page_s730.py settled LIVE.json     # the conductor's live read: the live source page and
                                                              # which rows a person checked
    python3 kb/_elumen_own_page_s730.py decide COLLEGE RUN    # after the forced read RUN: replace or keep, key by key

WHY. #3810 (0da3b19a) made each eLumen award bind its own page. Antelope Valley's read 45574354887 and Redwoods' read
45574359765 then bound 38 and 2 programs to their own pages and held each one held_no_gain (held() in
kb/_program_requirements_college.py): its filed record passes, and the own page names the same share of the listed
courses, so the read did not extract it. The filed record, the one the live row holds, was read in run 38979725726
(38979396148 at Redwoods) from the sister award's page: a degree's record headed "Welding Cert", a certificate's
headed "Electronics Technology AS" with the degree's 60 units and 21 of general education. No own-page record exists
on main, so a step=reread (with or without its force, an extraction run id) has nothing of the own page to post: the
own page has to be read, with force naming each program, since held() lets a forced control number through.

A forced number also passes kept_passing(), so the read files the own-page record even when it scores worse. Sam's
rule here (the S730 brief) replaces a live row only where the own-page record passes today's scorer as the live table
counts it (passes_live), so decide runs between the read and the reread: a key whose own-page record does not pass
gets its filed record and source entry back from BASE, and the reread, which posts only the newest run's records
(reread() in kb/_program_requirements_college.py), cannot post it. A row a person checked is never in the read's
force list, and the reread function refuses a checked row besides.

The list is kb/college_reads/s730_elumen_own_page.json. Its test: tests/program_requirements_elumen_own_page_s730_test.py.
Pure stdlib, no network.
"""
import json
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_requirements_rescore as RS  # noqa: E402
import _program_requirements_score as S  # noqa: E402

LIST = os.path.join(ROOT, "kb", "college_reads", "s730_elumen_own_page.json")
BASE = "56c21b967af8c46910624b77515431f85a15ae4c"   # origin/main when S730 began; the read files over it
COLLEGES = {"Antelope Valley College": "antelope_valley", "College of the Redwoods": "college_of_the_redwoods"}
# A program the read names in only= beside the forced ones: 43150's filed record places none of its listed courses,
# so held() never holds it; its pin (kb/program_requirements_reconcile.json, site_pages) binds its own page.
ALSO_READ = {"Antelope Valley College": ["43150"]}


def folder(slug: str) -> str:
    return os.path.join(ROOT, "kb", "program_requirements_college", slug)


def _load(path: str):
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


def _write(path: str, obj) -> None:
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(obj, fh, indent=1, ensure_ascii=False)
        fh.write("\n")


def score_brief(score: dict | None) -> dict:
    sc = score or {}
    cov = sc.get("coverage") or {}
    return {"passes_live": S.passes_live(sc), "pass": sc.get("pass") is True,
            "placed": cov.get("placed"), "listed": cov.get("listed"),
            "arithmetic": (sc.get("arithmetic") or {}).get("status"),
            "invented": (sc.get("invented") or {}).get("count")}


def why_not(score: dict | None) -> list[str]:
    """Each part of passes_live a score fails, in words."""
    sc = score or {}
    out = []
    cov = sc.get("coverage") or {}
    if cov.get("pass") is not True:
        out.append("coverage: placed %s of %s listed courses" % (cov.get("placed"), cov.get("listed")))
    if (sc.get("invented") or {}).get("pass") is not True:
        out.append("invented: %s codes the closed list does not hold" % (sc.get("invented") or {}).get("count"))
    ar = sc.get("arithmetic") or {}
    if ar.get("status") != "equal":
        out.append("arithmetic %s (computed %s, stated %s)" % (ar.get("status"), ar.get("computed"), ar.get("stated")))
    return out


def figures(rec: dict) -> dict:
    p = (rec.get("record") or {}).get("program") or {}
    return {"section_heading": p.get("section_heading"),
            "total_units": (p.get("total_units") or {}).get("min"),
            "degree_total": (p.get("degree_total") or {}).get("min"),
            "ge_units": (p.get("ge_units") or {}).get("min")}


def entry(college: str, slug: str, held: dict, rec: dict, src: dict) -> dict:
    rescore = RS.rescore(rec)
    filed = {"source_url": rec.get("source_url"), "extracted_run": str(rec.get("extracted_run")),
             "score": score_brief(rec.get("score")),
             "rescore_arithmetic": "unchanged" if rescore is None else rescore.get("status")}
    filed.update(figures(rec))
    certificate = not str(held.get("award") or "").startswith(("A.A.", "A.S."))
    return {"college": college, "control_number": held["control_number"], "title": held.get("title"),
            "award": held.get("award"), "own_url": held["url"],
            "own_codes": len(src.get("codes_found") or []), "own_coverage": src.get("coverage"),
            "filed": filed,
            # A certificate's record carrying a degree total or general education units holds the degree's figures.
            "degree_figures_on_certificate": certificate and bool(filed["degree_total"] or filed["ge_units"]),
            "own_record": None, "live": None, "person_settled": None,
            "decision": "read_own_page",
            "why": "held_no_gain in read %s: its filed record passes but was read from %s, so no own-page record "
                   "exists; a forced read files one" % (held.get("run"), (rec.get("source_url") or "").rsplit("/", 1)[-1])}


def plan() -> dict:
    out = {"_what": __doc__.split("WHY.", 1)[1].strip().split("\n\n")[0].replace("\n", " "),
           "base": BASE, "entries": [], "dispatch": [], "pin": {}}
    for college, slug in COLLEGES.items():
        cap = _load(os.path.join(folder(slug), "capture.json"))
        srcs = {s["control_number"]: s for s in _load(os.path.join(folder(slug), "sources.json"))}
        costs = []
        for name in sorted(os.listdir(os.path.join(folder(slug), "records"))):
            r = _load(os.path.join(folder(slug), "records", name))
            if str(r.get("extracted_run")) == str(cap["run"]) and r.get("cost_usd"):
                costs.append(r["cost_usd"])
        mine = []
        for h in cap["would_extract"]["held_no_gain"]:
            rec = _load(os.path.join(folder(slug), "records", h["control_number"] + ".json"))
            e = entry(college, slug, dict(h, run=cap["run"]), rec, srcs.get(h["control_number"]) or {})
            mine.append(e)
        out["entries"] += mine
        names = sorted(e["control_number"] for e in mine)
        only = sorted(set(names) | set(ALSO_READ.get(college, [])))
        mean = sum(costs) / len(costs) if costs else None
        out["dispatch"].append({
            "college": college, "step": "read", "only": ",".join(only), "force": ",".join(names),
            "programs": len(only),
            "estimate_usd": round(mean * len(only), 2) if mean else None,
            "estimate_high_usd": round(max(costs) * len(only), 2) if costs else None,
            "estimate_from": "the mean and the highest cost_usd of the %d records read %s filed" % (len(costs), cap["run"]),
            "then": ["decide %s <the read's run>" % college, "step=load", "step=reread"]})
    av = _load(os.path.join(folder("antelope_valley"), "capture.json"))
    nm = [x for x in av.get("not_found") or [] if x.get("control_number") == "43150"]
    rec = _load(os.path.join(folder("antelope_valley"), "records", "43150.json"))
    out["pin"] = {"college": "Antelope Valley College", "control_number": "43150",
                  "url": "https://avc.elumenapp.com/catalog/2026-27/program/all-automotive-systems-as-fall-2026",
                  "near_miss": (nm[0].get("near_miss") if nm else None),
                  "filed": dict(source_url=rec.get("source_url"), score=score_brief(rec.get("score"))),
                  "live": "none (handoff 728: 43150 has no live row; reread 45579427195 skipped it)",
                  "fix": "the pin alone binds the page; a paid read (only=43150) extracts it and step=load inserts it"}
    return out


def force_names(lst: dict, college: str) -> list[str]:
    """The read's force list: every candidate of the college but a row a person checked or a key kept."""
    return sorted(e["control_number"] for e in lst["entries"] if e["college"] == college
                  and e.get("person_settled") is not True and e["decision"] in ("read_own_page", "replace"))


def reread_keys(lst: dict, college: str) -> list[str]:
    """The keys a reread may post: each decided replace, never a kept or a person-settled key."""
    return sorted(e["control_number"] for e in lst["entries"] if e["college"] == college
                  and e["decision"] == "replace" and e.get("person_settled") is not True)


def settled(lst: dict, live: dict) -> dict:
    """Apply the conductor's live read: {"rows": [{"college", "cn", "source_url", "extracted_run", "checked"}]}."""
    rows = {(r["college"], r["cn"]): r for r in live.get("rows") or []}
    for e in lst["entries"]:
        r = rows.get((e["college"], e["control_number"]))
        e["live"] = None if r is None else {"source_url": r.get("source_url"), "extracted_run": str(r.get("extracted_run")),
                                            "checked": r.get("checked") is True}
        e["person_settled"] = bool(r and r.get("checked") is True)
        if e["person_settled"]:
            e["decision"], e["why"] = "keep", "a person checked the live row (person-settled wins)"
    for d in lst["dispatch"]:
        d["force"] = ",".join(force_names(lst, d["college"]))
        d["only"] = ",".join(sorted(set(d["force"].split(",")) - {""} | set(ALSO_READ.get(d["college"], []))))
        d["programs"] = len(d["only"].split(","))
    return lst


def _git_show(path: str) -> str:
    rel = os.path.relpath(path, ROOT)
    return subprocess.run(["git", "-C", ROOT, "show", "%s:%s" % (BASE, rel)], check=True,
                          capture_output=True, text=True).stdout


def verdict(e: dict, rec: dict, run: str) -> tuple[str, str, dict | None]:
    """(replace or keep, why, the own-page record's account) for one candidate and the record the read filed."""
    own = str(rec.get("extracted_run")) == str(run) and rec.get("source_url") == e["own_url"]
    acct = None if not own else dict(source_url=rec.get("source_url"), extracted_run=str(run),
                                     score=score_brief(rec.get("score")), **figures(rec))
    if own and S.passes_live(rec.get("score")):
        return "replace", "its own-page record (read %s) passes as the live table counts it" % run, acct
    if own:
        return "keep", "its own-page record does not pass: " + "; ".join(why_not(rec.get("score"))), acct
    return "keep", "read %s filed no own-page record for it (record from run %s, %s)" % (
        run, rec.get("extracted_run"), (rec.get("source_url") or "").rsplit("/", 1)[-1]), None


def decide(lst: dict, college: str, run: str) -> dict:
    """After the forced read: each candidate's own-page record replaces the live row where it passes, and where it
    does not, its filed record and source entry come back from BASE so the reread cannot post it."""
    slug = COLLEGES[college]
    src_path = os.path.join(folder(slug), "sources.json")
    srcs = _load(src_path)
    base_srcs = {s["control_number"]: s for s in json.loads(_git_show(src_path))}
    for e in lst["entries"]:
        if e["college"] != college or e.get("person_settled") is True:
            continue
        path = os.path.join(folder(slug), "records", e["control_number"] + ".json")
        e["decision"], e["why"], e["own_record"] = verdict(e, _load(path), run)
        if e["decision"] == "replace":
            continue
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(_git_show(path))
        cn = e["control_number"]
        if cn in base_srcs:
            srcs = [base_srcs[cn] if s.get("control_number") == cn else s for s in srcs]
    _write(src_path, srcs)
    if college == "Antelope Valley College":
        rec = _load(os.path.join(folder(slug), "records", "43150.json"))
        lst["pin"]["read"] = dict(run=str(rec.get("extracted_run")), source_url=rec.get("source_url"),
                                  score=score_brief(rec.get("score")))
    return lst


def main(argv: list[str]) -> int:
    if not argv or argv[0] not in ("plan", "settled", "decide"):
        print(__doc__.split("WHY.", 1)[0])
        return 2
    if argv[0] == "plan":
        lst = plan()
    elif argv[0] == "settled":
        lst = settled(_load(LIST), _load(argv[1]))
    else:
        lst = decide(_load(LIST), argv[1], argv[2])
    _write(LIST, lst)
    for d in lst["dispatch"]:
        print("%s: force %d, replace %d, keep %d; read only=%s force=%s (estimate $%s, high $%s)" % (
            d["college"], len(force_names(lst, d["college"])), len(reread_keys(lst, d["college"])),
            sum(1 for e in lst["entries"] if e["college"] == d["college"] and e["decision"] == "keep"),
            d["only"][:40] + ("..." if len(d["only"]) > 40 else ""), d["force"][:30] + "...",
            d["estimate_usd"], d["estimate_high_usd"]))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
