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
  (9) slice 2's per-college read figures (platform, catalog year, found, extracted, levers) are null when unread;
  (11) the data dictionary is parsed from docs/reference/data_dictionary.md, the one source: one entry per dataset
       heading, every label present, evidence that exists, and the committed file equal to the doc's parse;
  (12) the API checklist: a status counts only with evidence in the repo, a claimed connection without it reads
       unverified;
  (13) the live block and the overall bar keep basis live, apart from the committed-files figures (the export
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

# (11) the data dictionary: the doc is the one source (S647, #3220)
doc = open(os.path.join(ROOT, B.DICTIONARY_DOC), encoding="utf-8").read()
D = d["dictionary"]["datasets"]
headings = re.findall(r"^### (.+)$", B._section(doc, B.DICT_SECTION), re.M)
check("(11) the doc parses with no error (every label, a known group and a register stage)", d["dictionary"]["errors"] == [], d["dictionary"]["errors"][:3])
check("(11) ⭐ one dictionary entry per dataset heading in the doc, in its order", [e["name"] for e in D] == [h.strip() for h in headings])
check("(11) ⭐ the committed file's dictionary and checklist are the doc's (a doc edit without a rebuild fails here)",
      committed.get("dictionary") == d["dictionary"] and committed.get("apis") == d["apis"])
check("(11) the datasets the brief lists, Harvested, Connected and Planned (19 on #3220)", len(D) == 19
      and {e["group"] for e in D} == set(B.GROUPS), len(D))
check("(11) every entry names its owner, today's procedure, the planned improvement and its stage",
      all(e["owner"] and e["procedure_today"] and e["planned_improvement"] and e["stage"] in B.STAGES for e in D))
check("(11) every entry's evidence exists in the repo", all(e["evidence"] and not e["evidence_missing"] for e in D),
      [(e["name"], e["evidence_missing"]) for e in D if e["evidence_missing"] or not e["evidence"]][:3])
anchors = [e["link"].split("#", 1)[1] for e in D]
check("(11) each entry links its own anchor in the doc", len(set(anchors)) == len(D) and all(e["link"].startswith(B.DICTIONARY_DOC + "#") for e in D))
check("(11) the register links the dictionary, and the dictionary the register",
      "data_dictionary.md" in open(os.path.join(ROOT, "docs", "reference", "data_sources.md"), encoding="utf-8").read()
      and "data_sources.md" in doc)
check("(11) ⭐ the student boundary is stated as it is: records stay in MAP, COBI keeps counts, and the pseudonymous rows "
      "that pass through are named with where they live and both ADRs",
      "Student records stay in MAP; COBI keeps counts." in doc and "Student-level data never enters COBI" not in doc
      and all(s in doc for s in ("pseudonymous per-student rows", "stg_map_student_credit", "map_student_credit",
                                 "adr-funding-priority-metrics-privacy", "adr-student-detail-aggregate-disclosure-control",
                                 "never commits them", "before anything is committed or shown")))
cpl = B._section(doc, B.DICT_SECTION).split("### CPL / MAP", 1)[1].split("\n### ", 1)[0]
check("(11) ⭐ the CPL / MAP entry no longer says the pull carries no student data, and names both ADRs",
      "no student data" not in cpl and "adr-funding-priority-metrics-privacy" in cpl
      and "adr-student-detail-aggregate-disclosure-control" in cpl and "pseudonymous" in cpl)
map_row = [ln for ln in doc.splitlines() if ln.startswith("| MAP CustomReport API |")][0]
check("(11) the MAP API row names the pseudonymous rows and both ADRs",
      "pseudonymous" in map_row and "adr-funding-priority-metrics-privacy" in map_row and "adr-student-detail-aggregate-disclosure-control" in map_row)
check("(11) synced_at is defined as the promote sets it (insert or a changed value), never as the last sync",
      "| `synced_at` | timestamptz | Last sync |" not in doc and "values last changed" in cpl)
check("(11) ⭐ an entry backed only by citations of the doc family marks its external claims",
      all(e["unverified_claims"] >= 1 for e in D if not e["repo_verifiable"]),
      [e["name"] for e in D if not e["repo_verifiable"] and e["unverified_claims"] < 1])
check("(11) citations of the doc family are listed apart from the repo's own evidence",
      all(set(e["evidence_cited"]) == {x for x in e["evidence"] if B.cited(x)} for e in D)
      and any(e["evidence_cited"] for e in D) and any(e["repo_verifiable"] for e in D))
check("(11) the three lakes the report alone describes carry the mark on each of their report-sourced lines",
      all(e["unverified_claims"] >= 2 for e in D if e["name"] in ("Ellucian Insights Data Lake (institution)",
          "Ellucian Aggregated Insights Data Lake", "InvokeClarity Data Lake (institution)")))
with tempfile.TemporaryDirectory() as tmp:
    os.makedirs(os.path.join(tmp, "docs", "reference"))
    shutil.copy(os.path.join(ROOT, "docs", "reference", "data_sources.md"), os.path.join(tmp, "docs", "reference"))
    broken = doc.replace("- **Stage:** Scheduled\n", "", 1).replace(
        "| MAP CustomReport API | MAP (RCCD / InfoTech) | yes | connected |  | `scripts/daily_build.sh::Fetch CustomReport from MAP API`",
        "| MAP CustomReport API | MAP (RCCD / InfoTech) | yes | connected |  | `scripts/no_such_file.sh`", 1)
    open(os.path.join(tmp, B.DICTIONARY_DOC), "w", encoding="utf-8").write(broken)
    bd, ba = B.parse_dictionary(tmp)
    check("(11) a dataset with no Stage line is an error", any("Stage" in e for e in bd["errors"]), bd["errors"][:2])
    m = [r for r in ba["rows"] if r["api"] == "MAP CustomReport API"][0]
    check("(12) ⭐ a claimed connection whose evidence is missing reads unverified, never connected",
          m["status"] == "unverified" and m["claimed"] == "connected" and ba["connected"] == 0, m)
    cited_only = doc.replace(
        "| ASSIST API | ASSIST (intersegmental) | yes | planned |", "| ASSIST API | ASSIST (intersegmental) | yes | connected |", 1)
    open(os.path.join(tmp, B.DICTIONARY_DOC), "w", encoding="utf-8").write(cited_only)
    _, ca = B.parse_dictionary(tmp)
    a = [r for r in ca["rows"] if r["api"] == "ASSIST API"][0]
    check("(12) ⭐ a claimed connection whose only evidence is the register's own line reads unverified",
          a["status"] == "unverified" and a["claimed"] == "connected" and a["evidence_cited"], a)

# (12) the API checklist
A = d["apis"]
check("(12) fifteen APIs, one connected (the MAP CustomReport API)", A["total"] == 15 and A["connected"] == 1
      and [r["api"] for r in A["rows"] if r["status"] == "connected"] == ["MAP CustomReport API"], A["by_status"])
check("(12) every status is the vocabulary or unverified", all(r["status"] in B.API_STATUSES + ("unverified",) for r in A["rows"]))
check("(12) a row with no evidence reads unverified", all(r["status"] == "unverified" for r in A["rows"] if not r["evidence"]))
check("(12) the two priority APIs are CCCStart and the JST feed", sorted(r["api"][:8] for r in A["rows"] if r["priority"]) == ["CCCStart", "JST auth"])
check("(12) by_status counts the rows", sum(A["by_status"].values()) == A["total"])

# (13) the live block and the overall bar keep their own basis
LV, OV = d["live"], d["overall"]
check("(13) the live block names basis live and a state", LV["basis"] == "live" and LV["state"] in ("read", "not read yet"))
check("(13) before its first read it carries an explicit not-read-yet block", LV["state"] == "read" or (LV["read_at"] is None and LV["colleges"] == {}))
check("(13) every live college is a crosswalk college", set(LV["colleges"]) <= {str(c["id"]) for c in C})
check("(13) the overall bar is basis live, with the live read time, and only for colleges the live read holds",
      OV["basis"] == "live" and OV["read_at"] == LV["read_at"] and set(OV["colleges"]) == set(LV["colleges"]))
check("(13) no college row mixes in a live figure", not any(k in c for c in C for k in ("live", "overall")))

# (14) each cause's programs (S649, COBIx's item 1 on #3229): one sidecar per college with programs still to pass.
# A pinned fixture first: one college, four programs, each cause and each source of a catalog page.
with tempfile.TemporaryDirectory() as tmp:
    cd = os.path.join(tmp, B.COLLEGE_DIR, "ridge")
    os.makedirs(os.path.join(cd, "records"))
    srcs = [{"control_number": "00001", "title": "Welding", "award": "A.S. Degree", "method": "sitemap_page",
             "source": {"url": "https://catalog.ridge.example.edu/welding/#p1"}},
            {"control_number": "00002", "title": "Accounting", "award": "Certificate of Achievement", "method": "no_closed_list", "source": {}},
            {"control_number": "00003", "title": "Nursing", "award": "A.S. Degree", "method": "pdf_section",
             "source": {"url": "javascript:alert(1)"}},
            {"control_number": "00004", "title": "Biology", "award": "A.S.-T Degree", "method": "page_missing", "source": {"url": "ftp://x"}}]
    json.dump(srcs, open(os.path.join(cd, "sources.json"), "w"))
    # 00001 has a filed record whose source_url names the page the reader used; it wins over the capture's page.
    json.dump({"control_number": "00001", "source_url": "https://catalog.ridge.example.edu/welding/#p2", "score": None},
              open(os.path.join(cd, "records", "00001.json"), "w"))
    json.dump({"control_number": "00003", "source_url": "data:text/html,x", "score": None},
              open(os.path.join(cd, "records", "00003.json"), "w"))
    census = {"programs": [
        {"college": "Ridge College", "control_number": "00004", "cause": "page_not_found", "lever": "reader_page_search"},
        {"college": "Ridge College", "control_number": "00001", "cause": "extraction_error", "lever": "paid_read"},
        {"college": "Ridge College", "control_number": "00002", "cause": "no_closed_list", "lever": "program_course_file_check"},
        {"college": "Ridge College", "control_number": "00003", "cause": "extraction_error", "lever": "paid_read"},
        {"college": "Elsewhere", "control_number": "99999", "cause": "not_in_capture", "lever": "capture_and_read"}]}
    sc = B.cause_programs(tmp, census, {"ridge": {"name": "Ridge College"}, "hill": {"name": "Hill College"}})
    rows = (sc.get("ridge") or {}).get("programs") or []
    by = {r["cn"]: r for r in rows}
    check("(14) ⭐ the fixture: one sidecar per college with programs still to pass, none for a college with none or one the run does not hold",
          sorted(sc) == ["ridge"], sorted(sc))
    check("(14) ⭐ a filed record's source_url wins over the capture's page; title and award come from sources.json",
          by.get("00001") == {"cn": "00001", "title": "Welding", "award": "A.S. Degree", "cause": "extraction_error", "lever": "paid_read",
                              "url": "https://catalog.ridge.example.edu/welding/#p2"}, by.get("00001"))
    check("(14) ⭐ a page that is not http(s) is null, never a link (javascript:, data:, ftp:, or none at all)",
          by["00002"]["url"] is None and by["00003"]["url"] is None and by["00004"]["url"] is None, rows)
    check("(14) the order is cause, then title", [r["cn"] for r in rows] == ["00003", "00001", "00002", "00004"], [r["cn"] for r in rows])
    text = B.dumps_programs(sc["ridge"])
    back = json.loads(text)
    check("(14) the sidecar is one program a line and reads back whole",
          back == sc["ridge"] and text.count("\n") == len(rows) + 2 and back["basis"] == "committed files only", text[:200])
    p1 = B.programs_dir_for(tmp, None, None)
    p2 = B.programs_dir_for(tmp, os.path.join(tmp, "x", "c.json"), None)
    check("(14) the sidecars go beside --out when one is given, never into the repo", p1 == os.path.join(tmp, B.PROGRAMS_DIR)
          and p2 == os.path.join(tmp, "x", "commons_data_programs"), (p1, p2))

# Then the repo: each committed sidecar agrees with its college's cause counts, and --check covers them.
PD = os.path.join(ROOT, B.PROGRAMS_DIR)
off = []
for c in C:
    if not c["harvested"]:
        continue
    want = {k: v for k, v in (c.get("census_causes") or c["causes"] or {}).items() if v}
    f = c.get("programs_file")
    if not want:
        if f:
            off.append(c["name"] + ": a file with nothing still to pass")
        continue
    if f != B.PROGRAMS_DIR + "/" + c["slug"] + ".json" or not os.path.exists(os.path.join(ROOT, f)):
        off.append(c["name"] + ": no sidecar (" + str(f) + ")")
        continue
    got = {}
    for r in json.load(open(os.path.join(ROOT, f), encoding="utf-8"))["programs"]:
        got[r["cause"]] = got.get(r["cause"], 0) + 1
    if got != want:
        off.append(c["name"] + ": " + str(got) + " != " + str(want))
check("(14) ⭐ every committed sidecar lists exactly the programs each cause counts (the census basis), college by college", not off, off[:5])
# (16) the review of #3261: the lists and their counts come from the gap census's live read where it holds the college.
CEN = json.load(open(os.path.join(ROOT, B.CENSUS), encoding="utf-8"))
if CEN.get("basis") == "live":
    live_total = sum(sum((c.get("census_causes") or {}).values()) for c in C if c["harvested"] and (c.get("census_basis") or {}).get("basis") == "live")
    covered = [c for c in C if c["harvested"] and (c.get("census_basis") or {}).get("basis") == "live"]
    want_total = sum(len(v) for k, v in CEN["programs_by_college"].items())
    check("(16) ⭐ with a live census on file, every college it holds counts its causes from it, and the totals agree",
          covered and live_total == want_total, (live_total, want_total, len(covered)))
    check("(16) no college's cause list carries the committed-files-only cause where the live census holds it",
          not any("unknown_without_live" in (c.get("census_causes") or {}) for c in covered))
with tempfile.TemporaryDirectory() as tmp:
    os.makedirs(os.path.join(tmp, "kb", "status"))
    json.dump({"basis": "live", "written_at": "2026-11-13 18:04Z",
               "programs_by_college": {"Ridge College": {"00001": "units_unequal", "00002": "parked_college|units_unequal"}},
               "levers": [{"lever": "reconcile_steps", "members": ["00001"]}, {"lever": "unpark", "members": ["00002"]}]},
              open(os.path.join(tmp, B.CENSUS), "w"))
    lv = B.read_live_census(tmp, None)
    res = lambda n: {"Ridge College": 1, "Hill College": 2}.get(n)
    merged, basis = B.merge_census({"programs": [{"college": "Hill College", "control_number": "9", "cause": "unknown_without_live", "lever": "reconcile_steps"},
                                                 {"college": "Ridge College", "control_number": "7", "cause": "unknown_without_live", "lever": "reconcile_steps"}]},
                                   lv, {"ridge": {"name": "Ridge College"}, "hill": {"name": "Hill College"}}, res)
    check("(16) ⭐ the fixture: a college the live census holds takes its causes (text before |) and levers; one it does not keeps the committed files, labeled",
          sorted((g["college"], g["control_number"], g["cause"], g["lever"]) for g in merged)
          == [("Hill College", "9", "unknown_without_live", "reconcile_steps"), ("Ridge College", "00001", "units_unequal", "reconcile_steps"),
              ("Ridge College", "00002", "parked_college", "unpark")]
          and basis == {"ridge": {"basis": "live", "at": "2026-11-13 18:04Z"}, "hill": {"basis": "committed files only", "at": None}}, (merged, basis))
    json.dump({"basis": "committed files only", "programs_by_college": {}}, open(os.path.join(tmp, B.CENSUS), "w"))
    check("(16) a census written from the committed files alone is not taken as live", B.read_live_census(tmp, None) is None)
check("(16) ⭐ the census workflow hands the builder the census it just wrote",
      "--census kb/status/harvest_gap_census.json" in open(os.path.join(ROOT, ".github", "workflows", "harvest-gap-census.yml"), encoding="utf-8").read())
extra = sorted(set(os.listdir(PD)) - {os.path.basename(c[k]) for c in C for k in ("programs_file", "outcomes_file") if c.get(k)}) if os.path.isdir(PD) else ["no folder"]
check("(14) no sidecar for a college the file does not name", not extra, extra[:5])
check("(14) every row's programs_file carries a College-view flag", B.FIELDS.get("programs_file") == "internal")
rc = subprocess.run([sys.executable, os.path.join(ROOT, "kb", "_build_commons_data_status.py"), "--root", ROOT, "--check"],
                    capture_output=True, text=True, timeout=300)
check("(14) --check names the sidecars", "college sidecars current" in rc.stdout and rc.returncode == 0, rc.stdout[-300:])
# (15) the outcome sidecars (S649, Sam's asks 4 and 5): PLO text per program from the records, SLO and objective
# courses by subject from the committed reads, and a college whose outlines print no objectives says so.
nob = sorted(c["name"] for c in C if c.get("objectives_printed") is False)
check("(15) ⭐ the colleges whose committed reads are all on an outline system that prints no objectives, and hold none, are flagged",
      all(k in B.FIELDS for k in ("outcomes_file", "outline_system", "objectives_printed"))
      and all(set(c["outline_system"] or []) <= set(B.NO_OBJECTIVES_SYSTEMS) for c in C if c.get("objectives_printed") is False), nob)
oc = [c for c in C if c.get("outcomes_file")]
bad15 = []
for c in oc:
    o = json.load(open(os.path.join(ROOT, c["outcomes_file"]), encoding="utf-8"))
    cs = o["courses"]
    if sum(r["slo_courses"] for r in cs["by_subject"]) != cs["slo_courses"] or sum(r["objective_courses"] for r in cs["by_subject"]) != cs["objective_courses"]:
        bad15.append(c["name"] + ": by subject does not sum")
    if any(not p["outcomes"] or not all(isinstance(x, str) and x for x in p["outcomes"]) for p in o["programs"]):
        bad15.append(c["name"] + ": a program with no PLO text")
check("(15) ⭐ every outcome sidecar's subjects sum to its course counts, and every listed program carries PLO text", oc and not bad15, bad15[:5])
with tempfile.TemporaryDirectory() as tmp:
    od = os.path.join(tmp, B.OUTCOMES, "dist")
    os.makedirs(od)
    rows = [{"code": "ANTH C141", "named_by": ["ridge"], "outcomes": ["a"], "objectives": []},
            {"code": "ANTHC 141", "named_by": ["ridge"], "outcomes": ["b"], "objectives": ["x"]},
            {"code": "BIO 1", "named_by": ["ridge"], "outcomes": [], "groups": [{"group": "Ridge", "outcomes": ["c"]}]},
            {"code": "ART-2", "named_by": ["elsewhere"], "outcomes": ["d"]}]
    json.dump({"system": "curriqunet", "at": "2026-11-01T00:00:00Z", "rows": rows}, open(os.path.join(od, "read_1_p1of1.json"), "w"))
    os.makedirs(os.path.join(tmp, B.OUTCOMES, "trial_9"))
    json.dump({"system": "elumen", "rows": [{"code": "CHEM 1", "named_by": ["ridge"], "outcomes": ["e"]}]}, open(os.path.join(tmp, B.OUTCOMES, "trial_9", "read_9_p1of1.json"), "w"))
    rd = os.path.join(tmp, B.COLLEGE_DIR, "ridge", "records")
    os.makedirs(rd)
    json.dump({"control_number": "00001", "title": "Welding", "award": "A.S.", "record": {"program": {"outcomes": ["Weld.", " "]}}}, open(os.path.join(rd, "00001.json"), "w"))
    json.dump({"control_number": "00002", "title": "Art", "record": {"program": {"outcomes": []}}}, open(os.path.join(rd, "00002.json"), "w"))
    oo = B.college_outcomes(tmp, {"ridge": {"name": "Ridge College"}})["ridge"]
    check("(15) the fixture: one course per normalized key, a groups row counts, a trial folder and another college's rows are left out",
          oo["courses"]["slo_courses"] == 2 and oo["courses"]["objective_courses"] == 1
          and oo["courses"]["by_subject"] == [{"subject": "ANTHC", "slo_courses": 1, "objective_courses": 1}, {"subject": "BIO", "slo_courses": 1, "objective_courses": 0}]
          and oo["courses"]["objectives_printed"] is None, oo["courses"])
    check("(15) the fixture: a program's PLOs in the record's words, blank lines dropped, a program with none left out",
          oo["programs"] == [{"cn": "00001", "title": "Welding", "award": "A.S.", "outcomes": ["Weld."]}], oo["programs"])
    check("(15) objectives_printed is false only when every read is on a system that prints none and none was found",
          B.objectives_printed({"obj": set(), "systems": {"elumen"}}) is False and B.objectives_printed({"obj": {"X1"}, "systems": {"elumen"}}) is None
          and B.objectives_printed({"obj": set(), "systems": {"elumen", "curriqunet"}}) is None and B.objectives_printed(None) is None)
wf = open(os.path.join(ROOT, ".github", "workflows", "harvest-gap-census.yml"), encoding="utf-8").read()
check("(14) ⭐ the census workflow commits the sidecar folder with the file", "git add -A " + B.PROGRAMS_DIR in wf, "")

failed = [n for n, ok in results if not ok]
print("\n%d/%d checks passed" % (len(results) - len(failed), len(results)))
sys.exit(1 if failed else 0)
