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
import shutil
import tempfile

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
        if printed is not True and all("objectives" in r for r in rows):
            continue  # the objectives reader ran, and this system's template printed none: the record names why
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


@check("the reread plan covers every SLO college without objectives (a landed step may stay until it moves to done), "
       "holds De Anza and College of Marin, reads none twice")
def _():
    reads = newest_reads()
    no_obj = {slug for (host, slug), docs in reads.items()
              if any(has_slos(r) for d in docs for r in d["rows"])
              and not all("objectives" in r for d in docs for r in d["rows"])}
    planned = {s for step in PLAN["order"] for s in step["slugs"]}
    skipped = {r["slug"] for r in PLAN["not_reread"] if r["state"] == "none_printed"}
    assert no_obj <= planned | skipped, sorted(no_obj - planned - skipped)
    done = {r["slug"] for r in PLAN["done"]}
    assert not (done & no_obj), sorted(done & no_obj)
    assert not (done & planned), sorted(done & planned)
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
        assert s["load"] == ["host=%s" % s["host"], "kind=objective",
                             "slugs=%s" % ",".join(sorted(s["slugs"]))], s["load"]
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
    assert "s/^slugs=//p" in wf and '--slugs "$slugs"' in wf, "the load workflow does not pass slugs"


@check("the load stays insert-only with kind in the key, so an objective row never replaces an SLO row")
def _():
    sql = open(os.path.join(ROOT, "kb", "migrations", "2026-11-05_course_outcomes_kind.sql")).read()
    assert "on conflict (college, course_code, source_url, kind, fingerprint) do nothing" in sql
    body = sql.split("create or replace function public.course_outcomes_load", 1)[1]
    assert not re.search(r"^\s*(update|delete)\b", body, re.I | re.M), "an update or delete in the load function"


CUESTA = os.path.join(OUT, "trial_42573515439", "read.json")


@check("read_one, the path a full read takes, files the objectives keys and items from a pinned curriQunet page")
def _():
    folder = os.path.dirname(CUESTA)
    row = json.load(open(CUESTA))["rows"][0]
    stem = re.sub(r"[^A-Za-z0-9]+", "_", row["code"])
    page = {"status": 200, "final_url": row["report"], "title": row["code"],
            "html": gzip.open(os.path.join(folder, stem + ".html.gz"), "rt").read(),
            "body": open(os.path.join(folder, stem + ".txt")).read()}
    saved = read.cor.load_full
    read.cor.load_full = lambda reader, url: page
    try:
        got = read.read_one(None, {"code": row["code"], "report": row["report"]})
    finally:
        read.cor.load_full = saved
    for k in ("objectives", "objectives_heading", "objectives_lead", "objectives_fingerprint"):
        assert k in got, k
    assert got["objectives"] and got["outcomes"], (len(got["objectives"]), len(got["outcomes"]))


class FakeTable:
    """course_outcomes under the migration's unique key; fail_on: the call that commits, then raises."""
    def __init__(self, seed=(), fail_on=None):
        self.rows, self.calls, self.fail_on, self.next_id = {}, 0, fail_on, 1000
        for r in seed:
            self.put(r)

    @staticmethod
    def key(r):
        return (r["college"], r["course_code"], r["source_url"], r.get("kind", "slo"), r["fingerprint"])

    def put(self, r):
        if self.key(r) in self.rows:
            return None
        self.next_id += 1
        self.rows[self.key(r)] = dict(r, id=self.next_id)
        return self.next_id

    def rpc(self, body, key):
        self.calls += 1
        ins, kept = [], 0
        for r in body["p_rows"]:
            new = self.put(r)
            if new is None:
                kept += 1
            else:
                ins.append({"id": new, "college": r["college"], "course_code": r["course_code"],
                            "kind": r.get("kind", "slo")})
        if self.calls == self.fail_on:
            raise TimeoutError("timed out")
        return {"inserted_keys": ins, "kept": kept}


def run_main(table, argv, batch=None):
    """load.main against the pinned Cuesta read and a fake table, receipts in a temp dir: (exit, receipt)."""
    saved = (load.read_files, load._rpc, load.RECEIPTS, load.BATCH, os.environ.get("SUPABASE_SERVICE_KEY"))
    tmp = tempfile.mkdtemp(prefix="co_load_")
    load.read_files = lambda host, slugs=None: [CUESTA]
    load._rpc = table.rpc
    load.RECEIPTS = tmp
    if batch:
        load.BATCH = batch
    os.environ["SUPABASE_SERVICE_KEY"] = "dummy"
    try:
        code = load.main(argv)
    finally:
        load.read_files, load._rpc, load.RECEIPTS, load.BATCH = saved[:4]
        if saved[4] is None:
            os.environ.pop("SUPABASE_SERVICE_KEY", None)
        else:
            os.environ["SUPABASE_SERVICE_KEY"] = saved[4]
    files = glob.glob(os.path.join(tmp, "*.json"))
    rec = json.load(open(files[0])) if files else None
    shutil.rmtree(tmp, ignore_errors=True)
    return code, rec


@check("main() with --kind objective: every posted row an objective, held_back the SLO count, ids exactly the inserts")
def _():
    rows, _ = load.rows_from([CUESTA], "cuesta")
    slo = [r for r in rows if r["kind"] == "slo"]
    obj = [r for r in rows if r["kind"] == "objective"]
    table = FakeTable(seed=slo + obj[:3])  # the SLOs and three objectives already loaded
    before = set(table.rows)
    code, rec = run_main(table, ["--host", "cuesta", "--run", "1234567", "--kind", "objective"])
    assert code == 0 and rec, (code, rec)
    new = [v for k, v in table.rows.items() if k not in before]
    assert all(v["kind"] == "objective" for v in new) and len(new) == len(obj) - 3, len(new)
    assert rec["kind"] == "objective" and rec["held_back"] == len(slo), (rec["held_back"], len(slo))
    assert rec["posted"] == len(obj) and rec["kept"] == 3, (rec["posted"], rec["kept"])
    assert sorted(k["id"] for k in rec["inserted_keys"]) == sorted(v["id"] for v in new)
    assert all(k["kind"] == "objective" for k in rec["inserted_keys"])


def _apply_delete(table, stmt):
    """A receipt's rollback_by_key, applied to the fake: kind in (...) and (college, read_run) in (...)."""
    head, tail = stmt.split("and (college, read_run) in", 1)
    kinds = set(re.findall(r"'([a-z]+)'", head))
    pairs = {(c.replace("''", "'"), int(run)) for c, run in re.findall(r"\('((?:[^']|'')*)', (\d+)\)", tail)}
    gone = [k for k, v in table.rows.items()
            if v.get("kind", "slo") in kinds and (v["college"], int(v["read_run"])) in pairs]
    for k in gone:
        del table.rows[k]
    return len(gone)


@check("UNDO: a batch that commits and loses its response is covered by the receipt's rollback_by_key")
def _():
    rows, _ = load.rows_from([CUESTA], "cuesta")
    assert len([r for r in rows if r["kind"] == "objective"]) > 10
    table = FakeTable(fail_on=2)
    code, rec = run_main(table, ["--host", "cuesta", "--run", "1234567", "--kind", "objective"], batch=5)
    assert code == 1 and rec["error"].startswith("batch 2"), (code, rec and rec["error"])
    held = len(table.rows)
    assert held == 10 and len(rec["inserted_keys"]) == 5, (held, len(rec["inserted_keys"]))  # 5 rows no id names
    assert rec["posted"] == 10, rec["posted"]  # the batches sent, the failed one included
    assert _apply_delete(table, rec["rollback_by_key"]) == held and not table.rows, len(table.rows)


@check("rollback_by_key never reaches another kind or another read of the same college, and doubles a quote")
def _():
    rows, _ = load.rows_from([CUESTA], "cuesta")
    slo = [r for r in rows if r["kind"] == "slo"]
    obj = [r for r in rows if r["kind"] == "objective"]
    other = dict(obj[0], read_run="999999999", fingerprint="x" * 32)
    table = FakeTable(seed=slo + obj + [other])
    _apply_delete(table, load.rollback_by_key(obj))
    left = list(table.rows.values())
    assert len(left) == len(slo) + 1, len(left)
    assert {v["kind"] for v in left if v["read_run"] != "999999999"} == {"slo"}
    assert "Jacinto''s" in load.rollback_by_key([dict(obj[0], college="Mt. San Jacinto's")])


@check("a kind= load that finds no rows of that kind fails loudly, so a stale kind= line cannot pass as a load")
def _():
    saved = load.only_kind
    load.only_kind = lambda rows, kind: ([], len(rows))
    table = FakeTable()
    try:
        code, rec = run_main(table, ["--host", "cuesta", "--run", "1234567", "--kind", "objective"])
    finally:
        load.only_kind = saved
    assert code == 1 and rec is None and table.calls == 0, (code, rec, table.calls)


@check("--slugs keeps the Coast district's other colleges out of one college's load")
def _():
    all_ = load.read_files("cccd")
    for slug in ("golden_west", "coastline_community", "orange_coast"):
        only = load.read_files("cccd", [slug])
        assert only and {json.load(open(p))["slugs"] for p in only} == {slug}, slug
    mixed = {json.load(open(p))["slugs"] for p in all_}
    assert {"golden_west", "orange_coast"} <= mixed, mixed  # unfiltered, one college's load reposts the others


@check("the Commons outcomes card counts each slice once, from its newest run, so a reread never doubles it")
def _():
    cs = _mod("commons_status", "kb/_build_commons_status.py")
    tmp = tempfile.mkdtemp(prefix="co_cs_")
    dst = os.path.join(tmp, "kb", "course_outcomes", "laspositas")
    os.makedirs(dst)
    one = glob.glob(os.path.join(OUT, "laspositas", "read_*.json"))
    for p in one:
        d = json.load(open(p))
        json.dump(d, open(os.path.join(dst, os.path.basename(p)), "w"))
        d["run"] = str(int(d["run"]) + 1)
        json.dump(d, open(os.path.join(dst, "read_%s_p%dof%d.json" % (d["run"], d["part"], d["of"])), "w"))
    got = cs.building_outcomes(tmp)
    want = sum(json.load(open(p))["summary"]["outcomes"] for p in one)
    assert got["facts"]["outcomes"] == want and got["facts"]["reads"] == len(one), (got["facts"], want)


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
