#!/usr/bin/env python3
"""Mt. San Antonio's SLO pages (S683; the Courses area's ask 5 on #3533): the reader and its self-recall count.

The failure modes these checks pin: a full read of a page no load has proved, run before anyone has counted its
outcomes by eye (S681: Chabot's load filed 1,013 objectives as SLOs); a self-recall count that calls a page right
when only one kind matches; a Mt. San Antonio page filed under the host label "www"; a course code sent into the
page address unencoded. The self-recall itself runs over kb/course_outcomes/mtsac_recall.json, the filed trial pages
a person read by eye; until that file exists the count is 0 of 0 and the full read refuses. Pure-stdlib python.
"""
import gzip
import importlib.util
import json
import os
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("course_outcomes_read", os.path.join(ROOT, "kb", "_course_outcomes_read.py"))
read = importlib.util.module_from_spec(spec)
spec.loader.exec_module(read)

results = []


def check(name, cond, why=""):
    results.append((name, bool(cond), why))


# 1. The index: every loaded code, its SLO page addressed by code, filed under mtsac.
ix = read.catalog_index("mt_san_antonio")
codes = read.index_mod.record_codes(["mt_san_antonio"])["mt_san_antonio"]
first = sorted(ix["index"])[0]
check("1 the index names every code the loaded records hold, one SLO page each",
      len(ix["index"]) == len(codes) and all(len(v) == 1 and len(v[0]["reports"]) == 1 for v in ix["index"].values()),
      (len(ix["index"]), len(codes)))
check("1 a code goes into the page address encoded (ACCT 1A as ACCT%201A)",
      read.mtsac_index()["index"][first][0]["reports"][0] == read.MTSAC_SLO % first.replace(" ", "%20")
      and read.MTSAC_SLO % "ACCT%201A" == "https://www.mtsac.edu/slo/index.html?course=ACCT%201A")
check("1 the read files under host mtsac, never the address's first label (www)", ix.get("host") == "mtsac")
check("1 the trial reads 12 courses spread across the subjects",
      len(read.spread(read.wanted_courses(ix, ["mt_san_antonio"]), 12)) == 12)

# 2. The gate: no full read before the self-recall count passes.
rc = read.mtsac_recall()
if not rc["ok"]:
    try:
        read.main(["--catalog", "mt_san_antonio", "--part", "1", "--of", "1"])
        refused = False
    except SystemExit as exc:
        refused = "self-recall" in str(exc)
    check("2 GUARD: with the self-recall count short, a full read refuses before it loads a page", refused)
else:
    check("2 GUARD: the self-recall count passes, so a full read may run", rc["ok"])


# 3. The count itself, on a filed folder shaped like a trial's: right only when both kinds match by eye.
def page(slos, objectives):
    text = "Mt. San Antonio College\nStudent Learning Outcomes\n" + "\n".join(
        "%d. %s" % (i + 1, s) for i, s in enumerate(slos))
    if objectives:
        text += "\nCourse Objectives\n" + "\n".join("%d. %s" % (i + 1, s) for i, s in enumerate(objectives))
    return text + "\n"


with tempfile.TemporaryDirectory() as tmp:
    folder = os.path.join(tmp, "trial_1")
    os.makedirs(folder)
    pages = {"ACCT 1A": (["Prepare a balance sheet.", "Record journal entries."], []),
             "BIOL 1": (["Explain cell structure."], ["Describe mitosis.", "Use a microscope."])}
    for code, (slos, objs) in pages.items():
        stem = code.replace(" ", "_")
        open(os.path.join(folder, stem + ".txt"), "w").write(page(slos, objs))
        with gzip.open(os.path.join(folder, stem + ".html.gz"), "wt") as f:
            f.write("<html><body></body></html>")
    got = {c: read.parse_page("<html></html>", page(*pages[c]), "other") for c in pages}
    eye = {"trial": "1", "pages": {c: {"slo": len(got[c]["outcomes"]), "objective": len(got[c]["objectives"]),
                                       "by": "fixture"} for c in pages}}
    path = os.path.join(tmp, "recall.json")
    json.dump(eye, open(path, "w"))
    all_right = read.mtsac_recall(path, tmp)
    eye["pages"]["BIOL 1"]["objective"] += 1
    json.dump(eye, open(path, "w"))
    one_off = read.mtsac_recall(path, tmp)
check("3 a page counts right when both its SLO and objective counts match by eye",
      all_right["right"] == 2 and not all_right["wrong"], all_right)
check("3 a page whose objectives miss by one counts wrong, even with its SLOs right",
      one_off["right"] == 1 and [w[0] for w in one_off["wrong"]] == ["BIOL 1"], one_off)
check("3 two right pages are too few to pass: the count needs %d" % read.MTSAC_RECALL_PAGES,
      all_right["ok"] is False and "at least %d" % read.MTSAC_RECALL_PAGES in all_right["why"])

# 4. The self-recall on Mt. San Antonio's own filed pages, printed so the count is on the record.
print("self-recall on filed Mt. San Antonio pages: %d right of %d%s" % (
    rc["right"], rc["pages"], "" if rc["ok"] else " (%s)" % rc["why"]))
for code, want, seen in rc["wrong"]:
    print("  wrong %-10s by eye %s, parsed %s" % (code, want, seen))
if os.path.exists(read.MTSAC_RECALL):
    check("4 the hand-read pages parse right on %d%% of at least %d pages"
          % (int(read.MTSAC_RECALL_SHARE * 100), read.MTSAC_RECALL_PAGES), rc["ok"], rc["why"])

passed = sum(1 for _, ok, _ in results if ok)
for name, ok, why in results:
    print(("  ok   " if ok else "  FAIL ") + name + ("" if ok or not why else " — " + str(why)))
print("\nmtsac_slo_read_test.py: %d/%d checks passed" % (passed, len(results)))
sys.exit(0 if passed == len(results) else 1)
