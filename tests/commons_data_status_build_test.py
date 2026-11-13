#!/usr/bin/env python3
"""The Commons data dashboard's builder (kb/_build_commons_data_status.py, #3215 slice 1).

What it guards, each a way the page could mislead:
  (1) the universe is the identity crosswalk's colleges and continuing-education campuses, partners left off,
      every college once;
  (2) every committed harvest folder, SLO queue row and scout row resolves to a crosswalk college (an unmatched
      name would drop a college's figures silently);
  (3) the statewide figures are the sums of the college rows, and the program figures equal the gap census's own
      committed-files count, so the page and the census cannot drift apart;
  (4) a college with no committed harvest carries null figures (unread), never a zero;
  (5) every field carries a College-view flag;
  (6) the age thresholds live in the file, once;
  (7) COBIx's receipts are read as he posts them (a top-level tally keyed by college name, a top-level
      checked_at), over fixture copies of two real receipts under tests/fixtures/spot_checks/ so a later receipt
      cannot turn main red: 4 agree and 1 differ reads partial; a 1-of-1 cross-college tally never reads strong;
      an unreachable page is not a checked record; a later settlement of ours moves only its own row; the newest
      receipt by checked_at counts;
  (8) COBIx's two edge cases on PR 3222: a tally under 5 checked reads limited whatever differs, and a tie on
      checked_at goes to the later source comment id the README names, never the file order;
  (9) slice 2's per-college read figures (platform, catalog year, found, extracted, levers) are null when unread.

Run from the repo root: python3 tests/commons_data_status_build_test.py
"""
import importlib.util
import json
import os
import shutil
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("build_cdd", os.path.join(ROOT, "kb", "_build_commons_data_status.py"))
B = importlib.util.module_from_spec(spec)
spec.loader.exec_module(B)

results = []


def check(name, cond, detail=""):
    results.append((name, bool(cond)))
    print(("PASS " if cond else "FAIL ") + name + ((" — " + str(detail)) if (detail and not cond) else ""))


with tempfile.TemporaryDirectory() as tmp:
    out = os.path.join(tmp, "commons_data.json")
    r = subprocess.run([sys.executable, os.path.join(ROOT, "kb", "_build_commons_data_status.py"), "--root", ROOT, "--out", out, "--quiet"],
                       capture_output=True, text=True, timeout=300)
    check("the builder exits 0 on the repo", r.returncode == 0, r.stderr[-400:])
    with open(out, encoding="utf-8") as f:
        d = json.load(f)

cw = json.load(open(B.crosswalk_path(ROOT), encoding="utf-8"))["colleges"]
in_scope = [e for e in cw if e["entity_kind"] in ("college", "continuing_education")]
C = d["colleges"]
S = d["statewide"]

# (1) the universe
check("(1) the universe is the crosswalk's colleges and continuing-education campuses", len(C) == len(in_scope) == S["colleges"],
      (len(C), len(in_scope)))
check("(1) no partner entity is listed", not any(c["kind"] == "partner" for c in C))
check("(1) every college once", len({c["id"] for c in C}) == len(C))
check("(1) the continuing-education campuses are in", S["continuing_education"] == sum(1 for e in in_scope if e["entity_kind"] == "continuing_education") > 0)

# (2) every name resolves
check("(2) every harvest folder, SLO queue row and scout row resolves to a crosswalk college", d["unmatched"] == [], d["unmatched"][:5])
folders = [p for p in os.listdir(os.path.join(ROOT, B.COLLEGE_DIR)) if os.path.isdir(os.path.join(ROOT, B.COLLEGE_DIR, p))]
check("(2) every committed harvest folder is one harvested college", S["harvested"] == len(folders) == len({c["slug"] for c in C if c["harvested"]}),
      (S["harvested"], len(folders)))

# (3) the sums
hv = [c for c in C if c["harvested"]]
for k in ("programs", "passing", "gap"):
    check("(3) statewide %s is the sum of the college rows" % k, S[k] == sum(c[k] for c in hv), (S[k], sum(c[k] for c in hv)))
check("(3) each college's passing plus still-to-pass is its listed programs", all(c["passing"] + c["gap"] == c["programs"] for c in hv))
check("(3) each college's still-to-pass is the sum of its causes", all(sum(c["causes"].values()) == c["gap"] for c in hv))
check("(3) the program figures equal the gap census's committed-files count",
      (S["programs"], S["passing"], S["gap"]) == (d["census_check"]["universe"], d["census_check"]["passing"], d["census_check"]["gap"]), d["census_check"])
check("(3) unread is the universe less the harvested", S["unread"] == len(C) - S["harvested"] == sum(1 for c in C if not c["harvested"]))

# (4) unread is null, never zero
unread = [c for c in C if not c["harvested"]]
check("(4) a college with no committed harvest carries null figures, never a zero",
      all(c["programs"] is None and c["passing"] is None and c["gap"] is None and c["read_at"] is None for c in unread))
check("(4) every harvested college names its read date and kind", all(c["read_at"] and c["read_kind"] in ("capture", "capture_preview") for c in hv))

# (5) the field flags
check("(5) confidence is TBA only while no spot-check receipt is committed", ("confidence" in d["tba"]) == (S["spot_checked"] == 0))
check("(5) every harvested college has a level, every unread college none",
      all(c["confidence"] for c in hv) and all(c["confidence"] is None for c in unread if not c["spot_check"]))
check("(5) the statewide level counts are the college rows'", sum(S["confidence"].values()) == sum(1 for c in C if c["confidence"]))
check("(5) every field a college row carries has a flag, shareable or internal",
      all(set(c) == set(d["fields"]) for c in C) and set(d["fields"].values()) <= {"shareable", "internal"}, sorted(set(C[0]) ^ set(d["fields"])))
check("(5) dollars and process notes are internal", all(d["fields"][k] == "internal" for k in ("cost_usd", "passed_at_read", "causes", "slo_queue", "scout")))
check("(5) the overall bar, the API checklist and the JST funnel are TBA with reasons", all(d["tba"].get(k) for k in ("overall", "apis", "jst")))

# (6) the thresholds, once
check("(6) the age thresholds are in the file", d["rule"]["age_days"] == {"fresh": 7, "recent": 30})

# (7) the receipts as COBIx posts them, over fixture copies of two real ones
FIX = os.path.join(ROOT, "tests", "fixtures", "spot_checks")
in_scope_resolve = B.Resolver(in_scope)
with tempfile.TemporaryDirectory() as tmp:
    sc = os.path.join(tmp, "kb", "spot_checks")
    os.makedirs(sc)
    for f in os.listdir(FIX):
        shutil.copy(os.path.join(FIX, f), sc)
    um = []
    spot = B.read_spot_checks(tmp, in_scope_resolve, um)
    byname = {e["college_name"]: e["college_id"] for e in in_scope}
    sj = spot.get(byname["San Jose City College"])
    check("(7) ⭐ a real receipt is read: San Jose City 4 agree, 1 differ", sj and (sj["agrees"], sj["differs"], sj["unreachable"]) == (4, 1, 0), sj)
    check("(7) ⭐ San Jose City reads partial", B.confidence(sj, True)["level"] == "partial")
    gr = spot.get(byname["Grossmont College"])
    check("(7) the later settlement of ours moves Grossmont 30977 from unreachable to agrees",
          gr and (gr["agrees"], gr["unreachable"]) == (1, 0) and gr["settled_later"] == ["30977"], gr)
    sb = spot.get(byname["San Bernardino Valley College"])
    check("(7) ⭐ a 1-of-1 cross-college tally never reads strong", B.confidence(sb, True)["level"] == "limited")
    check("(7) every name in the fixtures resolves", um == [], um)
    check("(7) an unreachable page is not a checked record",
          B.confidence({"agrees": 4, "differs": 0, "unreachable": 1, "settled_later": None}, True)["level"] == "limited"
          and B.confidence({"agrees": 5, "differs": 0, "unreachable": 1, "settled_later": None}, True)["level"] == "partial"
          and B.confidence({"agrees": 5, "differs": 0, "unreachable": 0, "settled_later": None}, True)["level"] == "strong")
    check("(7) two or more differing records read limited (display held)",
          B.confidence({"agrees": 3, "differs": 2, "unreachable": 0, "settled_later": None}, True)["level"] == "limited")
    check("(7) machine checks only read limited; an unread college has no level",
          B.confidence(None, True)["level"] == "limited" and B.confidence(None, False) is None)
    # a newer receipt for San Jose City wins over the older one
    with open(os.path.join(FIX, "pr-3206-san-jose-city.check.json"), encoding="utf-8") as f:
        newer = json.load(f)
    newer["checked_at"] = "2099-01-01T00:00:00Z"
    newer["tally"] = {"San Jose City College": {"agrees": 5, "differs": 0, "page_unreachable": 0}}
    with open(os.path.join(sc, "aaa-newer.check.json"), "w", encoding="utf-8") as f:
        json.dump(newer, f)
    sj2 = B.read_spot_checks(tmp, in_scope_resolve, [])[byname["San Jose City College"]]
    check("(7) the newest receipt by checked_at counts, whatever its file name", sj2["checked_at"] == "2099-01-01T00:00:00Z" and B.confidence(sj2, True)["level"] == "strong")

# (8) COBIx's two edge cases on PR 3222 (comment 6852333180), over fixture copies of real receipts
check("(8) ⭐ a thin tally that differs reads limited, never above a thin tally that agrees",
      B.confidence({"agrees": 0, "differs": 1, "unreachable": 0, "settled_later": None}, True)["level"] == "limited"
      and B.confidence({"agrees": 3, "differs": 1, "unreachable": 0, "settled_later": None}, True)["level"] == "limited"
      and B.confidence({"agrees": 1, "differs": 0, "unreachable": 0, "settled_later": None}, True)["level"] == "limited")
check("(8) five or more checked with one differing still reads partial (San Jose City's 4 and 1)",
      B.confidence({"agrees": 4, "differs": 1, "unreachable": 0, "settled_later": None}, True)["level"] == "partial")
with tempfile.TemporaryDirectory() as tmp:
    sc = os.path.join(tmp, "kb", "spot_checks")
    os.makedirs(sc)
    with open(os.path.join(FIX, "pr-3206-san-jose-city.check.json"), encoding="utf-8") as f:
        real = json.load(f)
    # Two receipts for one college with the same checked_at. "zzz" sorts last by name but cites the EARLIER comment,
    # so a file-order tie-break would pick it; the comment-id tie-break must pick "aaa".
    later = dict(real, tally={"San Jose City College": {"agrees": 5, "differs": 0, "page_unreachable": 0}})
    with open(os.path.join(sc, "aaa-later-comment.check.json"), "w", encoding="utf-8") as f:
        json.dump(later, f)
    shutil.copy(os.path.join(FIX, "pr-3206-san-jose-city.check.json"), os.path.join(sc, "zzz-earlier-comment.check.json"))
    with open(os.path.join(sc, "README.md"), "w", encoding="utf-8") as f:
        f.write("| File | Source comment | sha256 |\n|---|---|---|\n"
                "| `zzz-earlier-comment.check.json` | [#3206 comment 6848712362](x) | `0` |\n"
                "| `aaa-later-comment.check.json` | [#3206 comment 6899999999](x) | `0` |\n")
    tie = B.read_spot_checks(tmp, in_scope_resolve, [])[byname["San Jose City College"]]
    check("(8) ⭐ a tie on checked_at goes to the later source comment id, not the file order",
          tie["comment"] == 6899999999 and (tie["agrees"], tie["differs"]) == (5, 0), tie)
    os.rename(os.path.join(sc, "aaa-later-comment.check.json"), os.path.join(sc, "zzz2-later-comment.check.json"))
    with open(os.path.join(sc, "README.md"), "w", encoding="utf-8") as f:
        f.write("| `zzz-earlier-comment.check.json` | [#3206 comment 6848712362](x) | `0` |\n"
                "| `zzz2-later-comment.check.json` | [#3206 comment 6899999999](x) | `0` |\n")
    tie2 = B.read_spot_checks(tmp, in_scope_resolve, [])[byname["San Jose City College"]]
    check("(8) the tie-break holds with the file order reversed", tie2["comment"] == 6899999999, tie2)
    check("(8) the committed receipts carry the README's comment ids",
          all(c["spot_check"]["comment"] for c in C if c["spot_check"]))

# (9) slice 2: the read receipt's own figures, null for an unread college, and the census's words in the rule
def _receipt(slug, name):
    for n in (name, "capture_preview.json" if name == "capture.json" else None):
        if n and os.path.exists(os.path.join(ROOT, B.COLLEGE_DIR, slug, n)):
            return json.load(open(os.path.join(ROOT, B.COLLEGE_DIR, slug, n), encoding="utf-8"))
    return {}


check("(9) each harvested college's platform, catalog year, found and extracted are its own receipts' values",
      all(c["platform"] == _receipt(c["slug"], "capture.json").get("platform") and c["catalog_year"] == _receipt(c["slug"], "capture.json").get("catalog_year")
          and c["found"] == _receipt(c["slug"], "summary.json").get("found") and c["extracted"] == _receipt(c["slug"], "summary.json").get("extracted") for c in hv))
# An unread college, as a fixture: the committed universe is fully harvested today, so the live rows cannot test it.
check("(9) ⭐ an unread college carries None for every read figure, never a zero or an empty map",
      B.slice2_fields(None) == {k: None for k in B.SLICE2} and set(B.SLICE2) <= set(d["fields"]))
check("(9) a harvested college's read figures pass through as its harvest holds them, zeros kept",
      B.slice2_fields({"found": 0, "levers": {}, "platform": "pdf"})["found"] == 0 and B.slice2_fields({"levers": {}})["levers"] == {})
check("(9) each college's levers count its programs still to pass", all(sum(c["levers"].values()) == c["gap"] for c in hv))
# (10) the outcome reasons count what kb/course_outcomes/ holds, so the words cannot overstate it (#3231 review)
with tempfile.TemporaryDirectory() as tmp:
    for host, rows in (("aaa", [{"outcomes": ["x"], "objectives": ["y"]}]), ("bbb", [{"outcomes": ["x"], "objectives": []}]),
                       ("ccc", [{"outcomes": []}]), ("trial_1", [{"outcomes": ["x"], "objectives": ["y"]}])):
        os.makedirs(os.path.join(tmp, B.OUTCOMES, host))
        with open(os.path.join(tmp, B.OUTCOMES, host, "read_1_p1of1.json"), "w", encoding="utf-8") as f:
            json.dump({"rows": rows}, f)
    oh = B.outcome_hosts(tmp)
    check("(10) ⭐ a host counts for SLOs or objectives only when a row holds some, trial runs left out",
          oh == {"slo": ["aaa", "bbb"], "objectives": ["aaa"]}, oh)
    rs = B.outcome_reasons(oh)
    check("(10) the reasons say those counts and name the objective hosts", "for 2 hosts" in rs["slo"] and "for 1 host (aaa)" in rs["objectives"], rs)
check("(10) the committed file's reasons are the builder's count of the repo", {k: d["tba"][k] for k in ("slo", "objectives")} == B.outcome_reasons(B.outcome_hosts(ROOT)))
check("(10) the PLO reason does not say outcomes are missing from the records", "not yet read per college here" in d["tba"]["plo"] and "no PLO" not in d["tba"]["plo"])
check("(9) the cause and lever words are the census's own", set(d["rule"]["causes"]) >= {k for c in hv for k in c["causes"]}
      and set(d["rule"]["levers"]) >= {k for c in hv for k in c["levers"]})

# the committed receipts are byte-for-byte what the README's sha256 names
import hashlib  # noqa: E402
import re  # noqa: E402
readme = open(os.path.join(ROOT, "kb", "spot_checks", "README.md"), encoding="utf-8").read()
named = re.findall(r"`([^`]+\.check\.json)` \| .*? \| `([0-9a-f]{64})`", readme)
on_disk = sorted(f for f in os.listdir(os.path.join(ROOT, "kb", "spot_checks")) if f.endswith(".check.json"))
check("(7) the README names every committed receipt", sorted(n for n, _ in named) == on_disk, (named, on_disk))
check("(7) each committed receipt hashes to the README's sha256",
      all(hashlib.sha256(open(os.path.join(ROOT, "kb", "spot_checks", n), "rb").read()).hexdigest() == h for n, h in named))

# No staleness check here on purpose: a harvest wave commits per-college files without rebuilding this one, so a
# byte check would turn main red on every wave. The census workflow rebuilds it; the page names its build date.
committed = json.load(open(os.path.join(ROOT, B.OUT), encoding="utf-8"))
check("the committed file has the builder's shape", set(committed) == set(d) and committed["schema"] == d["schema"])

failed = [n for n, ok in results if not ok]
print("\n%d/%d checks passed" % (len(results) - len(failed), len(results)))
sys.exit(1 if failed else 0)
