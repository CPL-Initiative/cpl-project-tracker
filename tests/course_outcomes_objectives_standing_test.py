#!/usr/bin/env python3
"""Course objectives are a standing part of every SLO read (S649; Sam, 2026-11-13: "add objectives to the collection
list of data from cors. they should be collected when slos are collected").

The failure modes these checks pin: a read path that files SLOs and passes over the objectives its page prints; an
outline system recorded as printing objectives whose trial pages show otherwise; a filed read that holds SLOs and no
objectives with nothing naming why; an objectives reread that posts SLO rows or loses its order, its hold or its undo.
The pinned fixtures are the filed trial pages under kb/course_outcomes/trial_<run>/. Pure-stdlib python.
"""
import glob
import gzip
import importlib.util
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "kb", "course_outcomes")


def _mod(name, rel):
    spec = importlib.util.spec_from_file_location(name, os.path.join(ROOT, rel))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


read = _mod("course_outcomes_read", "kb/_course_outcomes_read.py")
load = _mod("course_outcomes_load", "kb/_course_outcomes_load.py")
PLAN = json.load(open(os.path.join(OUT, "objectives_reread_plan.json")))

checks = []


def check(name):
    def wrap(fn):
        checks.append((name, fn))
        return fn
    return wrap


def trial_pages(system):
    """(trial, code, parsed) for every filed trial page of one outline system."""
    out = []
    for folder in sorted(glob.glob(os.path.join(OUT, "trial_*"))):
        d = json.load(open(os.path.join(folder, "read.json")))
        for row in d["rows"]:
            sys_ = read.page_system(row.get("report") or "")
            if sys_ != system:
                continue
            stem = re.sub(r"[^A-Za-z0-9]+", "_", row["code"])
            txt, page = os.path.join(folder, stem + ".txt"), os.path.join(folder, stem + ".html.gz")
            if not (os.path.exists(txt) and os.path.exists(page)):
                continue
            got = read.parse_page(gzip.open(page, "rt").read(), open(txt).read(), sys_)
            out.append((os.path.basename(folder), row["code"], got))
    return out


def has_slos(got):
    return bool(got.get("outcomes")) or any(g.get("outcomes") for g in got.get("groups") or [])


@check("the reader collects both kinds in the one pass, and every read's head names them")
def _():
    assert tuple(read.COR_COLLECTS) == ("slo", "objective"), read.COR_COLLECTS
    src = open(os.path.join(ROOT, "kb", "_course_outcomes_read.py")).read()
    assert '"collects": list(COR_COLLECTS)' in src, "the read head does not name what it collects"
    assert re.search(r"def parse_page\(.*\n.*\n\s*return \{\*\*_parse_outcomes\(.*\), \*\*objectives_block\(", src), \
        "parse_page no longer files objectives beside the outcomes"


@check("every read path returns the objectives keys, whatever the outline system and whether or not the page prints any")
def _():
    page = "<html><body><h3>Student Learning Outcomes</h3><ol><li>Do a thing.</li></ol></body></html>"
    text = "Student Learning Outcomes\n1. Do a thing.\n"
    for system in ("curriqunet", "courseleaf", "elumen", "other", None):
        got = read.parse_page(page, text, system)
        for k in ("objectives", "objectives_heading", "objectives_lead", "objectives_fingerprint"):
            assert k in got, (system, k)
        assert got["objectives"] == [], (system, got["objectives"])
    text2 = text + "Course Objectives:\n1. Measure a part.\n2. Read a print.\nCourse Content\n"
    got = read.parse_page(page, text2, "elumen")
    assert got["objectives"] == ["Measure a part.", "Read a print."], got["objectives"]


@check("every outline system the census names carries an objectives record, and each says printed True, False or template")
def _():
    for system in ("curriqunet", "courseleaf", "elumen"):
        rec = read.OBJECTIVES_BY_SYSTEM.get(system)
        assert rec and rec.get("printed") in (True, False, "template") and rec.get("evidence"), (system, rec)


@check("curriQunet (pinned trials): every trial page that prints SLOs also files objectives")
def _():
    pages = trial_pages("curriqunet")
    assert len(pages) >= 60, len(pages)
    miss = [(t, c) for t, c, g in pages if has_slos(g) and not g["objectives"]]
    assert not miss, miss[:6]
    assert read.OBJECTIVES_BY_SYSTEM["curriqunet"]["printed"] is True


@check("CourseLeaf, the Coast district (pinned trial 38508460207): every page that prints SLOs also files objectives")
def _():
    pages = trial_pages("courseleaf")
    assert len(pages) >= 12, len(pages)
    with_slos = [(t, c, g) for t, c, g in pages if has_slos(g)]
    assert len(with_slos) >= 9, len(with_slos)
    miss = [(t, c) for t, c, g in with_slos if not g["objectives"]]
    assert not miss, miss
    assert read.OBJECTIVES_BY_SYSTEM["courseleaf"]["printed"] is True


@check("eLumen (pinned trials): objectives are filed exactly where the visible text prints a heading, never from source")
def _():
    pages = trial_pages("elumen")
    assert len(pages) >= 90, len(pages)
    for folder in sorted(glob.glob(os.path.join(OUT, "trial_*"))):
        d = json.load(open(os.path.join(folder, "read.json")))
        for row in d["rows"]:
            if read.page_system(row.get("report") or "") != "elumen":
                continue
            stem = re.sub(r"[^A-Za-z0-9]+", "_", row["code"])
            txt = os.path.join(folder, stem + ".txt")
            if not os.path.exists(txt):
                continue
            text = open(txt).read()
            page = gzip.open(os.path.join(folder, stem + ".html.gz"), "rt").read()
            got = read.parse_page(page, text, "elumen")
            printed = bool(read.objectives_of(text)["objectives"])
            assert bool(got["objectives"]) == printed, (folder, row["code"])
    assert read.OBJECTIVES_BY_SYSTEM["elumen"]["printed"] == "template"


@check("Contra Costa's commented-out Course Objectives (trial 42346448758) are not read: the page does not print them")
def _():
    folder = os.path.join(OUT, "trial_42346448758")
    page = gzip.open(os.path.join(folder, "BUS_102.html.gz"), "rt").read()
    assert "Course Objectives:" in page and "<!--" in page.split("Course Objectives:")[0][-400:], "fixture moved"
    got = read.parse_page(page, open(os.path.join(folder, "BUS_102.txt")).read(), "elumen")
    assert got["objectives"] == [], got["objectives"]


def newest_reads():
    """Each host's newest complete read, by college slug: (host, slug) -> (system, read files)."""
    out = {}
    for host_dir in sorted(glob.glob(os.path.join(OUT, "*"))):
        host = os.path.basename(host_dir)
        if not os.path.isdir(host_dir) or host.startswith("trial_"):
            continue
        by_slugs = {}
        for path in glob.glob(os.path.join(host_dir, "read_*_p*of*.json")):
            d = json.load(open(path))
            if not d.get("complete"):
                continue
            key = d.get("slugs") or host
            if key not in by_slugs or int(d["run"]) > by_slugs[key][0]:
                by_slugs[key] = (int(d["run"]), [])
            if int(d["run"]) == by_slugs[key][0]:
                by_slugs[key][1].append(d)
        for slugs, (_, docs) in by_slugs.items():
            for slug in slugs.split(","):
                out[(host, slug)] = docs
    return out


@check("GUARD: a filed read that holds SLOs files objectives too, or the reread plan names why none exist")
def _():
    named = {s for step in PLAN["order"] for s in step["slugs"]}
    named |= {r["slug"] for r in PLAN["not_reread"]} | {r["slug"] for r in PLAN["held"]}
    reads = newest_reads()
    assert len(reads) >= 19, len(reads)
    bad = []
    for (host, slug), docs in sorted(reads.items()):
        rows = [r for d in docs for r in d["rows"]]
        if not any(has_slos(r) for r in rows):
            continue
        filed = any(r.get("objectives") for r in rows)
        system = docs[0].get("system")
        printed = (read.OBJECTIVES_BY_SYSTEM.get(system) or {}).get("printed")
        if filed:
            continue
        if slug in named:
            continue
        bad.append((host, slug, system, printed, "SLOs and no objectives, and the reread plan does not name it"))
    assert not bad, bad


@check("GUARD: a read the objectives reader ran on a system that prints them files objectives on most SLO pages")
def _():
    for (host, slug), docs in sorted(newest_reads().items()):
        if read.OBJECTIVES_BY_SYSTEM.get(docs[0].get("system"), {}).get("printed") is not True:
            continue
        rows = [r for d in docs for r in d["rows"]]
        if not all("objectives" in r for r in rows):
            continue  # filed before the reader took objectives: the plan's reread
        slo = [r for r in rows if has_slos(r)]
        obj = [r for r in slo if r.get("objectives")]
        assert slo and len(obj) * 2 >= len(slo), (host, slug, len(obj), len(slo))


@check("the reread plan covers every SLO college without objectives, holds De Anza and College of Marin, reads none twice")
def _():
    reads = newest_reads()
    no_obj = {slug for (host, slug), docs in reads.items()
              if any(has_slos(r) for d in docs for r in d["rows"])
              and not all("objectives" in r for d in docs for r in d["rows"])}
    planned = {s for step in PLAN["order"] for s in step["slugs"]}
    skipped = {r["slug"] for r in PLAN["not_reread"] if r["state"] == "none_printed"}
    assert no_obj == planned | skipped, (sorted(no_obj - planned - skipped), sorted((planned | skipped) - no_obj))
    assert {"de_anza", "college_of_marin"} <= {r["slug"] for r in PLAN["held"]}
    assert not ({"de_anza", "college_of_marin"} & planned)
    for r in PLAN["not_reread"]:
        if r["state"] == "none_printed":
            assert read.OBJECTIVES_BY_SYSTEM[r["system"]]["printed"] != True, r  # noqa: E712
    assert len(planned) == sum(len(s["slugs"]) for s in PLAN["order"]), "a college in two steps"


@check("the reread plan runs most exhibit articulations first, one host at a time, with trigger lines that resolve")
def _():
    steps = PLAN["order"]
    arts = [s["articulations"] for s in steps]
    assert arts == sorted(arts, reverse=True), arts
    assert [s["step"] for s in steps] == list(range(1, len(steps) + 1))
    for s in steps:
        lines = dict(x.split("=", 1) for x in s["read"])
        assert lines.get("run") == "<today's date>", s["host"]
        assert lines.get("parts", "").isdigit() and int(lines["parts"]) == s["parts"], s["host"]
        if "index" in lines:
            assert os.path.exists(os.path.join(ROOT, lines["index"])), lines["index"]
            assert lines.get("slugs"), s["host"]
        else:
            assert lines.get("catalog") in s["slugs"], s["host"]
        assert s["load"] == ["host=%s" % s["host"], "kind=objective"], s["load"]
        assert s["branch"].startswith("claude/slo-objectives-"), s["branch"]
        assert os.path.isdir(os.path.join(OUT, s["host"])), s["host"]
    cccd = [s for s in steps if s["host"] == "cccd"]
    assert all("after" in s for s in cccd[1:]), "a second read on one host must wait for the first"


@check("the objectives load posts objective rows only, and its receipt names the kind, what it held back and the undo")
def _():
    trial = os.path.join(OUT, "trial_42573515439", "read.json")
    rows, _ = load.rows_from([trial], "cuesta")
    kinds = {r["kind"] for r in rows}
    assert kinds == {"slo", "objective"}, kinds
    only, held = load.only_kind(rows, "objective")
    assert only and {r["kind"] for r in only} == {"objective"} and held == len(rows) - len(only), (len(only), held)
    assert load.only_kind(rows, "all") == (rows, 0)
    res = [{"inserted_keys": [{"id": 7, "college": "Cuesta College", "course_code": "X 1", "kind": "objective"}],
            "kept": 3}]
    rec = load.receipt_of("cuesta", "123456", [trial], only, [], res, None, "objective", held)
    assert rec["kind"] == "objective" and rec["held_back"] == held, rec
    assert rec["rollback"] == "delete from public.course_outcomes where id in (7);", rec["rollback"]
    wf = open(os.path.join(ROOT, ".github", "workflows", "course-outcomes-load.yml")).read()
    assert "s/^kind=//p" in wf and '--kind "${kind:-all}"' in wf, "the load workflow does not pass kind"


@check("the load stays insert-only with kind in the key, so an objective row never replaces an SLO row")
def _():
    sql = open(os.path.join(ROOT, "kb", "migrations", "2026-11-05_course_outcomes_kind.sql")).read()
    assert "on conflict (college, course_code, source_url, kind, fingerprint) do nothing" in sql
    body = sql.split("create or replace function public.course_outcomes_load", 1)[1]
    assert not re.search(r"^\s*(update|delete)\b", body, re.I | re.M), "an update or delete in the load function"


@check("every list of what is collected from course outlines names objectives beside SLOs")
def _():
    docs = {
        "docs/reference/data_dictionary.md": r"### Course SLOs[\s\S]*?### Course objectives",
        "docs/reference/scheduled_sessions.md": r"11\. \*\*The course SLO and objectives read",
        "docs/reference/lanes/program-requirements-harvest.md": r"objectives_reread_plan",
        "kb/course_outcomes/queue.json": r"objective",
    }
    for rel, pat in docs.items():
        assert re.search(pat, open(os.path.join(ROOT, rel)).read(), re.I), rel


def main():
    failed = 0
    for i, (name, fn) in enumerate(checks, 1):
        try:
            fn()
            print("  ok   %d %s" % (i, name))
        except AssertionError as e:
            failed += 1
            print("  FAIL %d %s\n       %s" % (i, name, str(e)[:400]))
        except Exception as e:  # noqa: BLE001
            failed += 1
            print("  FAIL %d %s\n       %s: %s" % (i, name, type(e).__name__, str(e)[:400]))
    print("\ncourse_outcomes_objectives_standing_test.py: %d/%d checks passed" % (len(checks) - failed, len(checks)))
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
