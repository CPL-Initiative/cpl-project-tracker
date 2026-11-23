#!/usr/bin/env python3
"""Guards for kb/_course_outcomes_load.py and course_outcomes_load() (S374; Sam,
Open Asks Sheet 70 card 3).

The load is the one write to course_outcomes. The failure modes these checks pin:
a row for a college the outline does not name, a fingerprint that no longer
matches the outcomes it stands for, a receipt that cannot roll the load back, and
any write path but the insert-only function. Pure-stdlib python.
"""
import glob
import importlib.util
import json
import os
import re
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("load", os.path.join(ROOT, "kb", "_course_outcomes_load.py"))
load = importlib.util.module_from_spec(spec)
spec.loader.exec_module(load)
TRIAL = os.path.join(ROOT, "kb", "course_outcomes", "trial_38317539422", "read.json")
SQL = os.path.join(ROOT, "chatbox", "supabase_course_outcomes.sql")

checks = []


def check(name):
    def wrap(fn):
        checks.append((name, fn))
        return fn
    return wrap


@check("each course becomes one row per college its outline names (RIV, MOV, NOR), with the outcomes unchanged")
def _():
    rows, skipped = load.rows_from([TRIAL], "rccd")
    rows = [r for r in rows if r["kind"] == "slo"]
    trial = json.load(open(TRIAL))["rows"]
    want = sum(len(r["offered_at"]) for r in trial)
    assert len(rows) == want and not skipped, (len(rows), want, skipped)
    by = {(r["college"], r["course_code"]): r for r in rows}
    cis = [r for r in trial if r["code"] == "CIS 11"][0]
    for college in ("Riverside City College", "Moreno Valley College", "Norco College"):
        assert by[(college, "CIS 11")]["outcomes"] == cis["outcomes"], college
    assert ("Moreno Valley College", "ACC 19") not in by, "ACC 19's outline names RIV and NOR only"


SD_TRIAL = os.path.join(ROOT, "kb", "course_outcomes", "trial_38350787486", "read.json")


@check("an SDCCD course becomes one row per college group, each with that college's own outcomes")
def _():
    rows, skipped = load.rows_from([SD_TRIAL], "sdccd")
    rows = [r for r in rows if r["kind"] == "slo"]
    trial = json.load(open(SD_TRIAL))["rows"]
    want = sum(1 for r in trial for g in r.get("groups") or [] if g["outcomes"])
    assert len(rows) == want == 16, (len(rows), want)
    by = {(r["college"], r["course_code"]): r for r in rows}
    geog = [r for r in trial if r["code"] == "GEOG 101"][0]["groups"]
    assert by[("San Diego City College", "GEOG 101")]["outcomes"] == geog[1]["outcomes"]
    assert by[("San Diego Miramar College", "GEOG 101")]["outcomes"] == geog[2]["outcomes"]
    assert ("San Diego City College", "ARCH 100") not in by, "ARCH 100 prints Mesa's outcomes only"
    assert {s["course_code"] for s in skipped} == {"AAPI 124", "SDGE 302"}, skipped
    assert all(r["shape"] in ("list", "paragraph") for r in rows)


@check("course objectives load as their own rows (kind objective) for the same colleges, beside the SLOs (Sam, 2026-11-02)")
def _():
    rows, _ = load.rows_from([TRIAL], "rccd")
    trial = {r["code"]: r for r in json.load(open(TRIAL))["rows"]}
    obj = [r for r in rows if r["kind"] == "objective"]
    assert len(obj) == sum(len(r["offered_at"]) for r in trial.values() if r.get("objectives")), len(obj)
    acc = [r for r in obj if r["course_code"] == "ACC 19"]
    assert {r["college"] for r in acc} == {"Riverside City College", "Norco College"}
    assert acc[0]["outcomes"] == trial["ACC 19"]["objectives"] and acc[0]["heading"] == "Course Objectives"
    assert acc[0]["fingerprint"] == load.fingerprint(acc[0]["outcomes"])
    # SDCCD prints one set for the course: each college whose SLO group it names, even when SLOs are skipped.
    rows, _ = load.rows_from([SD_TRIAL], "sdccd")
    geog = {r["college"] for r in rows if r["kind"] == "objective" and r["course_code"] == "GEOG 101"}
    assert geog >= {"San Diego City College", "San Diego Miramar College"}, geog
    # A read filed before the reader took objectives loads exactly as before.
    old = json.load(open(TRIAL))
    for r in old["rows"]:
        for k in ("objectives", "objectives_heading", "objectives_lead", "objectives_fingerprint"):
            r.pop(k, None)
    import tempfile
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as f:
        json.dump(old, f)
    rows, _ = load.rows_from([f.name], "rccd")
    os.unlink(f.name)
    assert rows and all(r["kind"] == "slo" for r in rows)


@check("a group whose title names no college the host maps is skipped with its reason, never guessed")
def _():
    import tempfile
    d = json.load(open(SD_TRIAL))
    d["rows"] = [r for r in d["rows"] if r["code"] == "PHOT 100"]
    d["rows"][0]["groups"][0]["group"] = "Continuing Education"
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as f:
        json.dump(d, f)
    try:
        rows, skipped = load.rows_from([f.name], "sdccd")
    finally:
        os.unlink(f.name)
    assert rows == [] and skipped[0]["group"] == "Continuing Education" and "no college" in skipped[0]["why"], skipped


IVC_TRIAL = os.path.join(ROOT, "kb", "course_outcomes", "trial_44910471774", "read.json")


@check("Irvine Valley's report 198 files each SLO as an untitled entry: the load joins a page's entries, in order, into "
       "one SLO row for Irvine Valley College, its objectives beside it, and no row for Saddleback (S697)")
def _():
    trial = json.load(open(IVC_TRIAL))["rows"]
    rows, skipped = load.rows_from([IVC_TRIAL], "saddleback")
    assert not skipped, skipped
    assert {r["college"] for r in rows} == {"Irvine Valley College"}, {r["college"] for r in rows}
    slo = {r["course_code"]: r for r in rows if r["kind"] == "slo"}
    obj = {r["course_code"]: r for r in rows if r["kind"] == "objective"}
    assert len(slo) == len(obj) == len(trial) == 12, (len(slo), len(obj))
    for t in trial:
        want = [o for g in t["groups"] for o in g["outcomes"]]
        assert slo[t["code"]]["outcomes"] == want and slo[t["code"]]["fingerprint"] == load.fingerprint(want), t["code"]
        assert obj[t["code"]]["outcomes"] == t["objectives"], t["code"]


@check("GUARD: untitled entries join only at a host UNTITLED_GROUPS names; at SDCCD they skip, never guessed (S697)")
def _():
    rows, skipped = load.rows_from([IVC_TRIAL], "sdccd")
    assert rows == [] and skipped and all("no college" in s["why"] for s in skipped), (rows[:1], skipped[:1])
    d = json.load(open(SD_TRIAL))
    assert not any(load.untitled_groups("saddleback", r) for r in d["rows"] if any(g.get("group") for g in r.get("groups") or []))


@check("GUARD: untitled entries join only for the report UNTITLED_GROUPS names (198); the same rows printed by "
       "another report on the folder are skipped (second reader on #3642)")
def _():
    trial = json.load(open(IVC_TRIAL))
    assert all(load.untitled_groups("saddleback", r) for r in trial["rows"])
    moved = [dict(r, report=r["report"].replace("reportId=198", "reportId=201")) for r in trial["rows"]]
    assert not any(load.untitled_groups("saddleback", r) for r in moved)


@check("GUARD: a load from a folder holding two colleges' reads refuses without slugs=, so its receipt's key-scoped "
       "rollback never names the other college's rows (Saddleback's and Irvine Valley's under saddleback; #3642)")
def _():
    import shutil
    import tempfile
    saved = load.OUT_DIR
    tmp = tempfile.mkdtemp()
    try:
        os.makedirs(os.path.join(tmp, "saddleback"))
        base = json.load(open(IVC_TRIAL))
        for run, slugs in (("101", "saddleback"), ("102", "irvine_valley")):
            json.dump(dict(base, run=run, slugs=slugs, part=1, of=1, complete=True),
                      open(os.path.join(tmp, "saddleback", "read_%s_p1of1.json" % run), "w"))
        load.OUT_DIR = tmp
        why = load.shared_folder_problem("saddleback", [])
        assert why and "slugs=" in why and "irvine_valley" in why and "saddleback" in why, why
        assert load.shared_folder_problem("saddleback", ["irvine_valley"]) is None
        assert load.main(["--host", "saddleback", "--dry"]) == 2
        assert load.main(["--host", "saddleback", "--dry", "--slugs", "irvine_valley"]) == 0
        os.remove(os.path.join(tmp, "saddleback", "read_101_p1of1.json"))
        assert load.shared_folder_problem("saddleback", []) is None
    finally:
        load.OUT_DIR = saved
        shutil.rmtree(tmp)


IVC_READ = sorted(__import__("glob").glob(os.path.join(ROOT, "kb", "course_outcomes", "saddleback",
                                                       "read_44913397609_p*of2.json")))


@check("GUARD: a filed line with no letter (report 198's '123', a bare '1') never loads: Irvine Valley's 12 rows "
       "that filed one, HLTH 7 and KNES 64 load no SLO row, the other 10 lose only those lines (S697)")
def _():
    filed = {}
    for p in IVC_READ:
        for r in json.load(open(p))["rows"]:
            items = (r.get("outcomes") or []) + [o for g in r.get("groups") or [] for o in g.get("outcomes") or []]
            if any(not re.search(r"[^\W\d_]", o) for o in items):
                filed[r["code"]] = items
    assert len(filed) == 12, sorted(filed)
    rows, skipped = load.rows_from(IVC_READ, "saddleback")
    slo = {r["course_code"]: r for r in rows if r["kind"] == "slo"}
    only_junk = {c for c, items in filed.items() if all(not re.search(r"[^\W\d_]", o) for o in items)}
    assert only_junk == {"HLTH 7", "KNES 64"}, only_junk
    assert not only_junk & set(slo) and only_junk <= {s["course_code"] for s in skipped if "no letter" in s.get("why", "")}
    for code in set(filed) - only_junk:
        want = [o for o in filed[code] if re.search(r"[^\W\d_]", o)]
        assert slo[code]["outcomes"] == want and slo[code]["fingerprint"] == load.fingerprint(want), code
    assert load.DROPPED == {"lines": 15, "rows": 2}, load.DROPPED
    assert all(re.search(r"[^\W\d_]", o) for r in rows for o in r["outcomes"])


SDCCE_TRIAL = os.path.join(ROOT, "kb", "course_outcomes", "trial_45017581874", "read.json")
SDCCE_RECALL = os.path.join(ROOT, "kb", "course_outcomes", "sdcce_recall.json")


@check("San Diego College of Continuing Education's trial loads its objectives as counted from the filed pages, "
       "12 of 12: HMID 535 loads the 11 objectives its Legacy Data paragraph numbers, its only copy, and HSDP 403's "
       "pointer drops (S703; d-legacy-objectives-kept-when-only-copy-s703)")
def _():
    want = json.load(open(SDCCE_RECALL))
    trial = json.load(open(SDCCE_TRIAL))
    assert want["trial"] == str(trial["run"]) and want["parser_fingerprint"] == trial["parser_fingerprint"]
    assert len(want["pages"]) == 12 and all(p["slo"] == 0 and p.get("from") and p.get("at")
                                            for p in want["pages"].values())
    filed = {r["code"]: len(r.get("objectives") or []) for r in trial["rows"]}
    assert {c for c, n in filed.items() if n != want["pages"][c]["objective"]} == {"HMID 535", "HSDP 403"}, filed
    rows, skipped = load.rows_from([SDCCE_TRIAL], "sdccd")
    assert all(r["kind"] == "objective" and r["college"] == "San Diego College of Continuing Education" for r in rows)
    got = {r["course_code"]: len(r["outcomes"]) for r in rows}
    assert got == {c: p["objective"] for c, p in want["pages"].items() if p["objective"]}, got
    assert got["HMID 535"] == 11
    hmid = next(r for r in rows if r["course_code"] == "HMID 535")
    assert hmid["outcomes"][0] == "Adhere to all safety requirements for the upholstery shop." and \
        hmid["outcomes"][-1].startswith("Show ethical standards") and hmid["shape"] == "list" and \
        hmid["fingerprint"] == load.fingerprint(hmid["outcomes"]) and not any(
            "Legacy Data" in o or "Upon successful completion" in o for o in hmid["outcomes"]), hmid
    gone = {s["course_code"]: s["why"] for s in skipped if s.get("kind") == "objective"}
    assert set(gone) == {"HSDP 403"} and "points to another outline" in gone["HSDP 403"], gone
    assert load.DROPPED == {"lines": 2, "rows": 1}, load.DROPPED


@check("a Legacy Data heading after a block's objectives ends it; one that opens the block drops alone and its "
       "paragraph loads, split by its numbers 1, 2, 3 in order; a pointer line drops; an objective naming an outline "
       "stays")
def _():
    block = {"outcomes": ["Apply safety practices.", "See specific course outline.", "Legacy Data", "1. Old text."],
             "maps_to": None, "fingerprint": "x", "shape": "list"}
    got = load.no_letterless(block)
    assert got["outcomes"] == ["Apply safety practices."] and got["shape"] == "paragraph", got
    keep = {"outcomes": ["Write a course outline for a short workshop.", "See the legacy data section in the text."],
            "fingerprint": "f", "shape": "list"}
    assert load.no_letterless(keep) is keep
    only = load.no_letterless({"outcomes": ["Legacy Data", "Upon completion, students can: 1. Apply X. 2. Explain "
                                                "Y."], "maps_to": [[], []], "fingerprint": "x", "shape": "list"})
    assert only["outcomes"] == ["Apply X.", "Explain Y."] and only["maps_to"] is None and \
        only["fingerprint"] == load.fingerprint(only["outcomes"]), only
    loose = load.no_letterless({"outcomes": ["Legacy Data", "Apply X in 2 ways. 4. Explain Y."], "fingerprint": "x"})
    assert loose["outcomes"] == ["Apply X in 2 ways. 4. Explain Y."] and loose["shape"] == "paragraph", loose
    assert load.no_letterless({"outcomes": ["Legacy Data"]}) is None


LAN_READ = sorted(glob.glob(os.path.join(ROOT, "kb", "course_outcomes", "lan", "read_45031089800_p*of5.json")))
LAN_PICK = {("AMT 058", "College of Alameda"), ("ARTH C1100", "Laney College"), ("HIST 056", "College of Alameda"),
            ("AFRAM 032", "Laney College"), ("ECT 015", "Laney College"), ("COMM C1004", "Laney College")}


def lan_rows():
    """The six pages of Peralta's full read 45031089800 the label checks read, as filed."""
    out = []
    for p in LAN_READ:
        d = json.load(open(p))
        out += [r for r in d["rows"] if (r["code"], r.get("college_printed")) in LAN_PICK]
    return d, out


@check("GUARD: Peralta's lan load cleans the four label cases off its filed lines (S713; d-peralta-load-cleans-labels-"
       "first-s713): Alameda AMT 058's SCANS lines, Laney ARTH C1100's 'Part 2' heading and AFRAM 032's ': ' drop "
       "or strip, ECT 015 keeps the objectives after its SCANS run, COMM C1004 keeps the text a 'Part 1::' label "
       "heads, and Alameda HIST 056's None-only SLO block loads nothing and is listed as a skip")
def _():
    assert len(LAN_READ) == 5, LAN_READ
    head, picked = lan_rows()
    assert len(picked) == 6, sorted(r["code"] for r in picked)
    with tempfile.TemporaryDirectory() as tmp:
        path = os.path.join(tmp, "read_45031089800_p1of1.json")
        json.dump({**head, "part": 1, "of": 1, "rows": picked}, open(path, "w"))
        rows, skipped = load.rows_from([path], "lan")
        by = {(r["course_code"], r["kind"]): r for r in rows}
        amt = [o for o in next(r for r in picked if r["code"] == "AMT 058")["objectives"]]
        assert ": SCANS Competencies:" in amt and "Competency #3: Information" in amt and "Skill #1: Basic Skills" in amt
        assert by[("AMT 058", "objective")]["outcomes"] == amt[:9], by[("AMT 058", "objective")]["outcomes"]
        arth = by[("ARTH C1100", "objective")]["outcomes"]
        assert "Part 2" in next(r for r in picked if r["code"] == "ARTH C1100")["objectives"]
        assert len(arth) == 9 and not any(o.lower().startswith("part") for o in arth), arth
        afram = by[("AFRAM 032", "objective")]["outcomes"]
        assert afram[0].startswith("The objective of the course is") and not any(o.startswith(":") for o in afram)
        ect = by[("ECT 015", "objective")]["outcomes"]
        assert ect[-3:][0] == "Explain how evaporation provides a cooling affect" and len(ect) == 9 and \
            not any("SCANS" in o or o.startswith(("Information:", "Technology:", "Basic skills:")) for o in ect), ect
        comm = by[("COMM C1004", "objective")]["outcomes"]
        assert comm[0].startswith("Evaluate and apply research methods") and \
            any(o.startswith("Understand and articulate the foundational principles") for o in comm) and \
            not any(o.lower().startswith("part") for o in comm), comm
        assert ("HIST 056", "slo") not in by and ("HIST 056", "objective") in by
        gone = [s for s in skipped if s["course_code"] == "HIST 056"]
        assert len(gone) == 1 and gone[0]["kind"] == "slo" and "placeholder" in gone[0]["why"], skipped
        for r in rows:
            assert r["fingerprint"] == load.fingerprint(r["outcomes"]), r["course_code"]
        assert load.LABEL_CLEANED["rows"] == 1 and load.LABEL_CLEANED["placeholder"] == 1, load.LABEL_CLEANED
    # The full read, pinned after the clean (S713, the second reader on 51bee0ca): a regression in any case fails here.
    rows, skipped = load.rows_from(LAN_READ, "lan")
    assert load.LABEL_CLEANED == {"colon": 233, "scans": 284, "part": 26, "placeholder": 8, "note": 12, "rows": 7}, \
        load.LABEL_CLEANED
    assert load.DROPPED == {"lines": 9, "rows": 0}, load.DROPPED
    per = {}
    for r in rows:
        per[(r["college"], r["kind"])] = per.get((r["college"], r["kind"]), 0) + 1
    assert per == {("Laney College", "slo"): 663, ("Laney College", "objective"): 663,
                   ("Merritt College", "slo"): 463, ("Merritt College", "objective"): 465,
                   ("College of Alameda", "slo"): 365, ("College of Alameda", "objective"): 368,
                   ("Berkeley City College", "slo"): 372, ("Berkeley City College", "objective"): 372}, per
    assert len(skipped) == 7 and all("placeholder" in s["why"] for s in skipped), skipped
    items = [o.strip() for r in rows for o in r["outcomes"]]
    assert not [o for o in items if o.startswith(":") or load.SCANS_OPEN.match(o) or load.PLACEHOLDER.match(o)
                or load.SYSTEM_NOTE.match(o) or re.match(r"^part\s*\d+\s*:*\s*$", o, re.I)]
    assert not [o for o in items if re.search(r"won['’]?t (allow )?delete|duplicate to be removed", o, re.I)]


@check("CONTROL: the same filed lines at a host LABEL_CLEAN_HOSTS does not name load exactly as filed, SCANS, Part "
       "headings, ': ' and None alike, and the filed read's own fingerprints stand (no other host's load moves)")
def _():
    assert load.LABEL_CLEAN_HOSTS == {"lan"}
    head, picked = lan_rows()
    with tempfile.TemporaryDirectory() as tmp:
        path = os.path.join(tmp, "read_45031089800_p1of1.json")
        json.dump({**head, "part": 1, "of": 1, "rows": picked}, open(path, "w"))
        rows, skipped = load.rows_from([path], "cabrillo")
        by = {(r["course_code"], r["kind"]): r for r in rows}
        for r in picked:
            assert by[(r["code"], "objective")]["outcomes"] == r["objectives"], r["code"]
            assert by[(r["code"], "objective")]["fingerprint"] == r["objectives_fingerprint"], r["code"]
            assert by[(r["code"], "slo")]["outcomes"] == r["outcomes"], r["code"]
        assert by[("HIST 056", "slo")]["outcomes"] == ["None"] and not skipped, skipped
        assert load.LABEL_CLEANED == {"colon": 0, "scans": 0, "part": 0, "placeholder": 0, "note": 0, "rows": 0}


@check("an outcome that opens with a number ('1. Analyze ...') loads whole; '#1', '.', '•' and '123' drop")
def _():
    block = {"outcomes": ["1. Analyze a balance sheet.", "#1", "2) Explain accruals.", ".", "•", "123"],
             "maps_to": [["a"], [], ["b"], [], [], []], "fingerprint": "x", "shape": "list"}
    got = load.no_letterless(block)
    assert got["outcomes"] == ["1. Analyze a balance sheet.", "2) Explain accruals."], got
    assert got["maps_to"] == [["a"], ["b"]] and got["fingerprint"] == load.fingerprint(got["outcomes"])
    whole = {"outcomes": ["1. Analyze a balance sheet."], "fingerprint": "f", "shape": "paragraph"}
    assert load.no_letterless(whole) is whole and load.no_letterless({"outcomes": ["1", "#2"]}) is None


@check("a filed row whose fingerprint does not match its outcomes stops the load")
def _():
    import tempfile
    d = json.load(open(TRIAL))
    d["rows"][0]["outcomes"] = d["rows"][0]["outcomes"] + ["an added line"]
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as f:
        json.dump(d, f)
    try:
        load.rows_from([f.name], "rccd")
        raise AssertionError("the load went on")
    except SystemExit as e:
        assert "fingerprint" in str(e), e
    finally:
        os.unlink(f.name)


@check("the receipt names every inserted id and the delete that removes exactly those")
def _():
    results = [{"inserted": 2, "kept": 1, "inserted_keys": [{"id": 11, "college": "Norco College", "course_code": "A 1"},
                                                            {"id": 12, "college": "Norco College", "course_code": "B 2"}]},
               {"inserted": 0, "kept": 3, "inserted_keys": []}]
    r = load.receipt_of("rccd", "123456", [TRIAL], [{}] * 6, [], results, None)
    assert r["inserted"] == 2 and r["kept"] == 4, r
    assert r["rollback"] == "delete from public.course_outcomes where id in (11, 12);", r["rollback"]
    assert load.receipt_of("rccd", "123456", [TRIAL], [], [], [], None)["rollback"] is None


@check("the only write is the insert-only function on the service role: no PATCH, DELETE or table address")
def _():
    src = open(os.path.join(ROOT, "kb", "_course_outcomes_load.py")).read()
    assert re.findall(r'"rpc/[a-z_]+"', src) == ['"rpc/course_outcomes_load"'], "another rpc"
    assert not re.search(r'method="(PATCH|DELETE|PUT)"|/rest/v1/course_outcomes', src), "a direct table write"
    sql = open(SQL).read()
    assert "on conflict (college, course_code, source_url, fingerprint) do nothing" in sql
    assert "if coalesce(auth.role(), '') <> 'service_role'" in sql
    assert re.search(r"revoke all on function public\.course_outcomes_load\(text, jsonb\) from public, anon, authenticated",
                     sql)
    assert re.search(r"revoke insert, update, delete, truncate on public\.course_outcomes from public, anon, authenticated",
                     sql)
    assert not re.search(r"^\s*(update|delete)\b", sql, re.I | re.M), "an update or delete in the SQL"


EL_CAB = os.path.join(ROOT, "kb", "course_outcomes", "trial_38506174617", "read.json")


@check("an eLumen read loads one row per course for the college whose records name it, marked as read from the catalog")
def _():
    rows, skipped = load.rows_from([EL_CAB], "cabrillo")
    trial = json.load(open(EL_CAB))["rows"]
    assert len(rows) == len(trial) and not skipped, (len(rows), skipped)
    assert {r["college"] for r in rows} == {"Cabrillo College"}, {r["college"] for r in rows}
    assert {(r["source_kind"], r["source_system"]) for r in rows} == {("catalog", "elumen")}
    acct = [r for r in rows if r["course_code"] == "ACCT 151A"][0]
    assert len(acct["outcomes"]) == 2 and acct["source_url"].endswith(",course,acct151a?tenant=cabrillo.elumenapp.com"), acct


@check("a host's slices: one per college set and part, and a college re-read in fewer parts drops its older split (S670)")
def _():
    import tempfile
    tmp = tempfile.mkdtemp(prefix="co_slices_")
    os.makedirs(os.path.join(tmp, "h"))
    def put(run, part, of, slugs, complete=True):
        json.dump({"run": str(run), "part": part, "of": of, "slugs": slugs, "complete": complete, "rows": []},
                  open(os.path.join(tmp, "h", "read_%d_p%dof%d.json" % (run, part, of)), "w"))
    put(100, 1, 3, "a"); put(100, 2, 3, "a"); put(100, 3, 3, "a")  # a's first read, 3 parts
    put(300, 1, 2, "a"); put(300, 2, 2, "a")                        # a re-read in 2 parts
    put(200, 1, 2, "b"); put(200, 2, 2, "b")                        # b, same split as a's newest, older run
    put(400, 1, 2, "b", complete=False); put(400, 2, 2, "b")        # b's newer read failed part 1
    saved = load.OUT_DIR
    load.OUT_DIR = tmp
    try:
        got = sorted(os.path.basename(p) for p in load.read_files("h"))
    finally:
        load.OUT_DIR = saved
    want = ["read_200_p1of2.json", "read_300_p1of2.json", "read_300_p2of2.json", "read_400_p2of2.json"]
    assert got == want, got


def load_job_steps(wf: str) -> tuple[str, list[str]]:
    """The load job's header (its lines above steps:) and each of its steps as written, one block a step."""
    job = wf[wf.index("\n  load:\n"):]
    head, _, body = job.partition("\n    steps:\n")
    steps, cur = [], []
    for line in body.split("\n"):
        if re.match(r"^  \S", line):  # the next job
            break
        if line.startswith("      - ") and cur:
            steps.append("\n".join(cur))
            cur = []
        cur.append(line)
    if cur:
        steps.append("\n".join(cur))
    return head, steps


def standing_test_gates_load(wf: str) -> str | None:
    """Why the standing test would not stop the load, or None when it does: the test step runs first, neither step
    nor the job carries continue-on-error, the test's command is not softened with || true, and the load step has
    no if: (if: always() or failure() runs it after a red test)."""
    head, steps = load_job_steps(wf)
    test = [i for i, st in enumerate(steps) if "run: python3 tests/course_outcomes_objectives_standing_test.py" in st]
    load_ = [i for i, st in enumerate(steps) if "python3 kb/_course_outcomes_load.py" in st]
    if len(test) != 1 or len(load_) != 1 or test[0] >= load_[0]:
        return "the standing test step must come once, before the load step (%s, %s)" % (test, load_)
    if "continue-on-error" in head:
        return "the load job carries continue-on-error"
    for i in range(test[0], load_[0] + 1):
        if re.search(r"^\s+(?:- )?continue-on-error:", steps[i], re.M):
            return "step %d carries continue-on-error" % i
        if "|| true" in steps[i] or "|| exit 0" in steps[i]:
            return "step %d softens its command" % i
    if re.search(r"^\s+(?:- )?if:", steps[load_[0]], re.M):
        return "the load step carries an if:, which can run it past a red standing test"
    return None


@check("GUARD: the load workflow runs the standing test before the load step, so a red check posts nothing (S691)")
def _():
    wf = open(os.path.join(ROOT, ".github", "workflows", "course-outcomes-load.yml")).read()
    why = standing_test_gates_load(wf)
    assert why is None, why


@check("GUARD: the gate fails continue-on-error above run: on the test step or on the job, if: always() or failure() "
       "on the load step, and || true on the test (S691's second reader)")
def _():
    wf = open(os.path.join(ROOT, ".github", "workflows", "course-outcomes-load.yml")).read()
    test_head = "      - name: The standing test, before anything posts\n"
    load_head = "      - name: Load the filed read, insert-only\n"
    assert test_head in wf and load_head in wf, "the step names moved; update this check"
    mutants = {
        "continue-on-error above run:": wf.replace(test_head, test_head + "        continue-on-error: true\n"),
        "if: always() on the load step": wf.replace(load_head, load_head + "        if: always()\n"),
        "if: failure() on the load step": wf.replace(load_head, load_head + "        if: ${{ failure() }}\n"),
        "|| true on the test": wf.replace("run: python3 tests/course_outcomes_objectives_standing_test.py",
                                          "run: python3 tests/course_outcomes_objectives_standing_test.py || true"),
        "continue-on-error on the job": wf.replace("    timeout-minutes: 20\n",
                                                   "    timeout-minutes: 20\n    continue-on-error: true\n", 1),
    }
    passed = [k for k, v in mutants.items() if v == wf or standing_test_gates_load(v) is None]
    assert not passed, "mutants the gate lets through: %s" % passed


def main():
    failed = 0
    for i, (name, fn) in enumerate(checks, 1):
        try:
            fn()
            print("  ok   %d %s" % (i, name))
        except AssertionError as e:
            failed += 1
            print("  FAIL %d %s\n       %s" % (i, name, str(e)[:400]))
    print("\ncourse_outcomes_load_test.py: %d/%d checks passed" % (len(checks) - failed, len(checks)))
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
