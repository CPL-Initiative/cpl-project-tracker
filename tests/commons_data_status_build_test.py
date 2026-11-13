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
  (8) the data dictionary is parsed from docs/reference/data_dictionary.md, the one source: one entry per dataset
      heading, every label present, evidence that exists, and the committed file equal to the doc's parse;
  (9) the API checklist: a status counts only with evidence in the repo, a claimed connection without it reads
      unverified;
  (10) the live block and the overall bar keep basis live, apart from the committed-files figures (the export
      itself is guarded by tests/commons_data_live_test.py).

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
check("(5) the API checklist tile and the JST funnel are TBA with reasons", all(d["tba"].get(k) for k in ("apis", "jst")))
check("(5) the overall bar is TBA with its reason exactly while the live counts are not read",
      bool(d["tba"].get("overall")) == (d["live"]["state"] != "read") and ("teachout_approved" in d["tba"]) == (d["live"]["state"] != "read"))

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

# (8) the data dictionary: the doc is the one source (S647, #3220)
doc = open(os.path.join(ROOT, B.DICTIONARY_DOC), encoding="utf-8").read()
D = d["dictionary"]["datasets"]
headings = re.findall(r"^### (.+)$", B._section(doc, B.DICT_SECTION), re.M)
check("(8) the doc parses with no error (every label, a known group and a register stage)", d["dictionary"]["errors"] == [], d["dictionary"]["errors"][:3])
check("(8) ⭐ one dictionary entry per dataset heading in the doc, in its order", [e["name"] for e in D] == [h.strip() for h in headings])
check("(8) ⭐ the committed file's dictionary and checklist are the doc's (a doc edit without a rebuild fails here)",
      committed.get("dictionary") == d["dictionary"] and committed.get("apis") == d["apis"])
check("(8) the datasets the brief lists, Harvested, Connected and Planned (19 on #3220)", len(D) == 19
      and {e["group"] for e in D} == set(B.GROUPS), len(D))
check("(8) every entry names its owner, today's procedure, the planned improvement and its stage",
      all(e["owner"] and e["procedure_today"] and e["planned_improvement"] and e["stage"] in B.STAGES for e in D))
check("(8) every entry's evidence exists in the repo", all(e["evidence"] and not e["evidence_missing"] for e in D),
      [(e["name"], e["evidence_missing"]) for e in D if e["evidence_missing"] or not e["evidence"]][:3])
anchors = [e["link"].split("#", 1)[1] for e in D]
check("(8) each entry links its own anchor in the doc", len(set(anchors)) == len(D) and all(e["link"].startswith(B.DICTIONARY_DOC + "#") for e in D))
check("(8) the register links the dictionary, and the dictionary the register",
      "data_dictionary.md" in open(os.path.join(ROOT, "docs", "reference", "data_sources.md"), encoding="utf-8").read()
      and "data_sources.md" in doc)
check("(8) student-level data never enters COBI, said where the draft says it", "Student-level data never enters COBI" in doc)
with tempfile.TemporaryDirectory() as tmp:
    os.makedirs(os.path.join(tmp, "docs", "reference"))
    shutil.copy(os.path.join(ROOT, "docs", "reference", "data_sources.md"), os.path.join(tmp, "docs", "reference"))
    broken = doc.replace("- **Stage:** Scheduled\n", "", 1).replace(
        "| MAP CustomReport API | MAP (RCCD / InfoTech) | yes | connected |  | `scripts/daily_build.sh::Fetch CustomReport from MAP API`",
        "| MAP CustomReport API | MAP (RCCD / InfoTech) | yes | connected |  | `scripts/no_such_file.sh`", 1)
    open(os.path.join(tmp, B.DICTIONARY_DOC), "w", encoding="utf-8").write(broken)
    bd, ba = B.parse_dictionary(tmp)
    check("(8) a dataset with no Stage line is an error", any("Stage" in e for e in bd["errors"]), bd["errors"][:2])
    m = [r for r in ba["rows"] if r["api"] == "MAP CustomReport API"][0]
    check("(9) ⭐ a claimed connection whose evidence is missing reads unverified, never connected",
          m["status"] == "unverified" and m["claimed"] == "connected" and ba["connected"] == 0, m)

# (9) the API checklist
A = d["apis"]
check("(9) fifteen APIs, one connected (the MAP CustomReport API)", A["total"] == 15 and A["connected"] == 1
      and [r["api"] for r in A["rows"] if r["status"] == "connected"] == ["MAP CustomReport API"], A["by_status"])
check("(9) every status is the vocabulary or unverified", all(r["status"] in B.API_STATUSES + ("unverified",) for r in A["rows"]))
check("(9) a row with no evidence reads unverified", all(r["status"] == "unverified" for r in A["rows"] if not r["evidence"]))
check("(9) the two priority APIs are CCCStart and the JST feed", sorted(r["api"][:8] for r in A["rows"] if r["priority"]) == ["CCCStart", "JST auth"])
check("(9) by_status counts the rows", sum(A["by_status"].values()) == A["total"])

# (10) the live block and the overall bar keep their own basis
LV, OV = d["live"], d["overall"]
check("(10) the live block names basis live and a state", LV["basis"] == "live" and LV["state"] in ("read", "not read yet"))
check("(10) before its first read it carries an explicit not-read-yet block", LV["state"] == "read" or (LV["read_at"] is None and LV["colleges"] == {}))
check("(10) every live college is a crosswalk college", set(LV["colleges"]) <= {str(c["id"]) for c in C})
check("(10) the overall bar is basis live, with the live read time, and only for colleges the live read holds",
      OV["basis"] == "live" and OV["read_at"] == LV["read_at"] and set(OV["colleges"]) == set(LV["colleges"]))
check("(10) no college row mixes in a live figure", not any(k in c for c in C for k in ("live", "overall")))

failed = [n for n, ok in results if not ok]
print("\n%d/%d checks passed" % (len(results) - len(failed), len(results)))
sys.exit(1 if failed else 0)
