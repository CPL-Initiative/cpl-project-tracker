#!/usr/bin/env python3
"""The Commons tab's builder (kb/_build_commons_status.py) reads every row from the committed
files, and a figure it cannot read is null beside its error, never a zero.

Sam, 2026-10-18 20:10Z: "Build it as a tab now." The tab (commons.js) draws whatever this
builder writes to kb/status/commons.json, so the contract guarded here is the file's shape:
five rows in the mock-up's order, each with a complete pair, its tests, known issues naming an
owner, settled procedures and a machine stamp; and the S343 rule that a failed read says so.

Run from the repo root: python3 tests/commons_status_build_test.py
"""
import importlib.util
import json
import os
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("build_commons", os.path.join(ROOT, "kb", "_build_commons_status.py"))
B = importlib.util.module_from_spec(spec)
spec.loader.exec_module(B)

results = []


def check(name, cond, detail=""):
    results.append((name, bool(cond)))
    print(("PASS " if cond else "FAIL ") + name + ((" — " + str(detail)) if (detail and not cond) else ""))


# ── the file, as the daily run writes it ──
with tempfile.TemporaryDirectory() as tmp:
    out = os.path.join(tmp, "commons.json")
    r = subprocess.run([sys.executable, os.path.join(ROOT, "kb", "_build_commons_status.py"), "--root", ROOT, "--out", out, "--quiet"],
                       capture_output=True, text=True, timeout=300)
    check("the builder exits 0 on the repo", r.returncode == 0, r.stderr[-400:])
    with open(out, encoding="utf-8") as f:
        data = json.load(f)

check("schema 1 with a written_at stamp", data.get("schema") == 1 and str(data.get("written_at", "")).endswith("Z"))
rows = data.get("rows", [])
check("five rows in the mock-up's order", [r.get("key") for r in rows] == ["requirements", "exhibit", "course", "cr", "subjects"])
for r in rows:
    key = r.get("key")
    pair = r.get("pair") or []
    # A link to the home or to one of its routes (Exhibits' card opens #exhibits/progress, S556).
    check(key + ": a title, a home (a tab hash or SkyView's page) and a link to it", r.get("title")
          and (str(r.get("tab", "")).startswith("#") or str(r.get("tab", "")).endswith("/prototype/skyview.html"))
          and any(l.get("href") == r.get("tab") or str(l.get("href", "")).startswith(str(r.get("tab")) + "/")
                  for l in r.get("links", [])))
    check(key + ": the row read without an error", not r.get("error"), r.get("error"))
    check(key + ": the complete pair is two whole numbers with the count inside the universe",
          pair and isinstance(pair[0].get("n"), int) and isinstance(pair[0].get("of"), int) and 0 <= pair[0]["n"] <= pair[0]["of"],
          pair[:1])
    # The Commons' step 3 (S425): a count may open a list under its tab (#canonical-subj4/progress).
    check(key + ": the pair opens the tab", pair and str(pair[0].get("open") or "").startswith(r.get("tab") or "~"))
    check(key + ": at least one test behind the count", isinstance(r.get("tests"), list) and len(r["tests"]) >= 1)
    check(key + ": every known issue carries a count, words and an owner",
          all(isinstance(i.get("n"), int) and i.get("words") and i.get("owner") for i in r.get("issues", [])),
          [i for i in r.get("issues", []) if not (isinstance(i.get("n"), int) and i.get("words") and i.get("owner"))])
    check(key + ": at least one known issue and one settled procedure", len(r.get("issues", [])) >= 1 and len(r.get("procedures", [])) >= 1)
    m = r.get("machine") or {}
    check(key + ": a machine stamp with what and when", m.get("what") and m.get("at"), m)
    check(key + ": the sources it read are named", isinstance(r.get("sources"), list) and len(r["sources"]) >= 1)
    check(key + ": no figure is a bare zero", all(i.get("n") != 0 for i in r.get("issues", [])) and pair[0].get("n") != 0)

req = rows[0]
f = req.get("facts") or {}
# Every Commons action opens the reference's List (Sam, 2026-11-03), on the filter a count names where the List has one.
check("Programs: the card and its counts open CPL Pathways' List, the issues its Fail and Not read yet filters",
      req["links"][0]["href"] == "#program-requirements/list" and all(p_["open"] == "#program-requirements/list" for p_ in req["pair"])
      and [i["open"] for i in req["issues"]] == ["#program-requirements/list/fail", "#program-requirements/list/unread"][:len(req["issues"])],
      (req["links"], [p_["open"] for p_ in req["pair"]], [i["open"] for i in req["issues"]]))
_ex = [r for r in rows if r["key"] == "exhibit"][0]
check("Exhibits: the card and its counts open the List; held titles and conflicts keep Review; the procedures open Rules, never the retired CER",
      _ex["links"][0]["href"] == "#exhibits/list" and all(p_["open"] == "#exhibits/list" for p_ in _ex["pair"])
      and all(i["open"] in ("#exhibits/held", "#exhibits/conflict", "#credential-reference/all") for i in _ex["issues"])
      and _ex["procedures"][0]["open"] == "#exhibits/rules",
      (_ex["links"], [p_["open"] for p_ in _ex["pair"]], [i["open"] for i in _ex["issues"]], _ex["procedures"][0].get("open")))
building = data.get("building", [])
check("the three building references follow the rows (S552): credentials, outcomes, skills",
      [b.get("key") for b in building] == ["credentials", "outcomes", "skills"])
for b in building:
    bp = (b.get("pair") or [{}])[0]
    check(b.get("key", "?") + ": a count with no universe, its words, and a machine stamp, read without an error",
          isinstance(bp.get("n"), int) and bp.get("n") > 0 and bp.get("of") is None and bp.get("words")
          and (b.get("machine") or {}).get("at") and not b.get("error"), b.get("error") or bp)
check("credentials: the catalog's own counts", (building[0].get("facts") or {}).get("issuers") and "issuers" in building[0]["pair"][0]["words"])
check("outcomes: counted from the committed reads, colleges by the courses' named_by",
      isinstance((building[1].get("facts") or {}).get("colleges"), list) and len(building[1]["facts"]["colleges"]) >= 1
      and building[1]["facts"].get("reads", 0) >= 1)

check("Program Requirements: complete + failing + unread = the active universe",
      f.get("complete") + f.get("failing") + f.get("unread") == f.get("active") == req["pair"][0]["of"], f)
check("Program Requirements: its run log is named (kb/status/program-requirements.json)",
      req.get("status_file") == "kb/status/program-requirements.json")
check("Program Requirements: the issues are the failing and the unread counts",
      [i["n"] for i in req["issues"]] == [f.get("failing"), f.get("unread")])
ex = rows[1].get("facts") or {}
check("Exhibit: a person's and a cohort's stamps sum to the stamped titles", ex.get("person") + ex.get("cohort") == ex.get("stamped") == rows[1]["pair"][0]["n"])
co = rows[2]
check("Course: SkyView is the row's home and every count opens it (Sam, 20:46Z); the Courses List is the second word (2026-11-01); its Progress page the third (S559)",
      co["links"] == [{"href": co["tab"], "text": "Open SkyView"}, {"href": "#coci-lookup", "text": "Open the Courses List"},
                      {"href": "#coci-lookup/progress", "text": "Open Progress"}]
      and co["tab"].endswith("/prototype/skyview.html")
      and all(i.get("open") == co["tab"] for i in co["issues"]) and co["pair"][0]["open"] == co["tab"])
cr = rows[3]
crf = cr.get("facts") or {}
# S437 (the CR Progress view; Open Asks Sheet 108 card 5): one pair, the wordings that resolve to a
# settled reference of every wording, a rule's placements and a curator's beyond them summing to it.
check("CR: settled wordings of every wording first, opening the List (Sam, 2026-11-03)",
      cr["pair"][0]["n"] == crf.get("settled") and cr["pair"][0]["of"] == crf.get("wordings")
      and cr["pair"][0]["open"] == "#cr-reference/list" and cr["links"][0]["href"] == "#cr-reference/list" and cr["tests"] == ["rule-settled", "curator-decided", "confirmed by a person"])
check("CR: a rule's wordings and a curator's beyond them sum to the settled count, the rest unsettled",
      crf.get("rule_wordings") + crf.get("curator_only") == crf.get("settled")
      and crf.get("settled") + crf.get("unsettled") == crf.get("wordings")
      and crf.get("settled_rows") + crf.get("unsettled_rows") == crf.get("rows"))
check("CR: the head bands nest (top 50, 100, 250) and none settles more than it holds",
      all(crf["head"][k]["settled"] <= crf["head"][k]["of"] for k in ("50", "100", "250"))
      and crf["head"]["50"]["settled"] <= crf["head"]["100"]["settled"] <= crf["head"]["250"]["settled"])
check("CR: every count opens a filter of the tab",
      all(i["open"] in ("#cr-reference/open", "#cr-reference/names") for i in cr["issues"]) and cr["procedures"][0]["open"] == "#cr-reference/auto")
# The settling rule on a fixture: a confirmed decision settles its members less the ones it split out,
# a folded wording settles though its own group carries no decision, and a deferred decision settles nothing.
with tempfile.TemporaryDirectory() as fx:
    os.makedirs(os.path.join(fx, "kb", "receipts"))
    def grp(key, recs, auto=False, rows=1):
        return {"key": key, "acts_automatically": auto, "wordings": len(recs), "members": [{"rec": r, "rows": rows} for r in recs]}
    with open(os.path.join(fx, "kb", "cr_reference_worklist.json"), "w") as f:
        json.dump({"_stats": {"auto_groups": 1, "rung_5_groups": 4, "total_rows": 13},
                   "groups": [grp("a", ["a1", "a2"], auto=True, rows=5), grp("b", ["b1", "b2"]), grp("c", ["c1"]), grp("d", ["d1"]), grp("e", ["e1"])]}, f)
    with open(os.path.join(fx, "kb", "receipts", "cr_reference_decisions_2026-10-20_fixture.json"), "w") as f:
        json.dump({"items": [], "rows": [
            {"group_key": "b", "decision": "confirmed", "members": ["b1", "b2", "c1"], "excluded": ["b2"]},
            {"group_key": "d", "decision": "deferred", "members": ["d1"], "excluded": []}]}, f)
    fxr = B.row_cr(fx)["facts"]
    check("CR fixture: a rule settles a1 and a2; a decision b1 and the folded c1, not the split-out b2 or the deferred d1",
          fxr["rule_wordings"] == 2 and fxr["curator_only"] == 2 and fxr["settled"] == 4 and fxr["unsettled"] == 3, fxr)
sub = rows[4].get("facts") or {}
check("Subjects: a person's and a cohort's confirmations sum to the confirmed count", sub.get("person") + sub.get("cohort") == sub.get("confirmed"))
# S425: the pair is the settled count (confirmed, on the authority rule, in no collision), never above the confirmed count,
# and its words say MQ discipline (Sam, 2026-10-19).
check("Subjects: settled is the confirmed count less the collisions, and the pair carries it",
      sub.get("settled") == rows[4]["pair"][0]["n"] and sub.get("settled") <= sub.get("confirmed") and rows[4]["pair"][0]["of"] == sub.get("disciplines"))
check("Subjects: the pair's words say MQ disciplines and name the three tests", "MQ disciplines" in rows[4]["pair"][0]["words"]
      and rows[4]["tests"] == ["confirmed", "authority rule", "collision-free", "confirmed by a person"])
check("Subjects: the card and its counts open the List (Sam, 2026-11-03), every issue the tab's own list",
      rows[4]["links"][0]["href"] == "#canonical-subj4/list" and rows[4]["pair"][0]["open"] == "#canonical-subj4/list"
      and rows[4]["pair"][1]["open"] == "#canonical-subj4/list/person" and all((i.get("open") or "").startswith("#canonical-subj4/") for i in rows[4]["issues"]))
# A collision issue is listed only while a collision exists (the AGAB re-key of 2026-10-19 closed the one, S427):
# a known issue with nothing in it is not an issue, and facts.shared keeps the measure.
collision_issues = [i for i in rows[4]["issues"] if "two MQ disciplines" in i.get("words", "")]
check("Subjects: the unconfirmed issue opens the List's Open filter, where a pick is confirmed, and a collision issue, when one is listed, the List's In a collision",
      rows[4]["issues"][0]["open"] == "#canonical-subj4/open" and all(i["open"] == "#canonical-subj4/list/collision" for i in collision_issues)
      and bool(sub.get("shared")) == bool(collision_issues))
if os.path.exists(os.path.join(ROOT, "kb", "csr_out", "latest.json")):
    check("Subjects: with the daily scan's file, the scan findings and the stray codes are known issues with an owner",
          len(rows[4]["issues"]) >= 3 and all(i.get("owner") for i in rows[4]["issues"]) and sub.get("scanned_at")
          and any("scan findings" in i.get("words", "") for i in rows[4]["issues"])
          and any("identity codes" in i.get("words", "") for i in rows[4]["issues"]))
if os.path.exists(os.path.join(ROOT, "kb", "csr_out", "latest.json")):
    # The card's findings count is the Subjects page's (S561): judgment findings less the ones another item counts.
    with open(os.path.join(ROOT, "kb", "csr_out", "latest.json"), encoding="utf-8") as fh:
        _scan = json.load(fh)
    _want = sum(1 for f in _scan.get("findings") or [] if f.get("needs_judgment")
                and f.get("rule") not in ("cs7_unreviewed", "cs4_aligned", "cs4_missed_alignment", "cs2_dup"))
    _got = [i["n"] for i in rows[4]["issues"] if "to confirm or note" in i.get("words", "")]
    check("Subjects: the scan-findings issue counts what the tab's opened page counts (S561)", _got == [_want])
    _js = open(os.path.join(ROOT, "canonical_subj4.js"), encoding="utf-8").read()
    check("Subjects: the skip list matches canonical_subj4.js's ASK_SKIP",
          'var ASK_SKIP = ["cs7_unreviewed", "cs4_aligned", "cs4_missed_alignment", "cs2_dup"];' in _js)
if os.path.exists(os.path.join(ROOT, "kb", "csr_procedures.json")):
    with open(os.path.join(ROOT, "kb", "csr_procedures.json"), encoding="utf-8") as f:
        store = json.load(f)
    on = [p for p in store["procedures"] if p.get("on")]
    check("Subjects: the procedures cell counts the store's procedures in force and names the rules",
          rows[4]["procedures"][0]["n"] == len(on) and sub.get("procedures_on") == len(on)
          and all(any(p["name"] == w["words"] for p in on) for w in rows[4]["procedures"][1:]
                  if not w["words"].startswith("Counted from"))  # the timing line (S561) names no procedure
          and rows[4]["procedures"][-1]["words"].startswith("Counted from the picks"))

# ── Confirmed by a person on all five (Sheet 160; Sam, S565, 2026-11-03: "yes to both, build them for all four") ──
check("confirmed: every row carries a second pair, a person's confirmations over the first pair's denominator",
      all(len(r["pair"]) == 2 and r["pair"][1]["words"].startswith("confirmed by a person") and r["pair"][1]["of"] == r["pair"][0]["of"]
          and "confirmed by a person" in r["tests"] for r in rows), [(r["key"], r["pair"]) for r in rows])
check("confirmed: never more than its denominator, and its complete share never more than it",
      all(r["pair"][1]["n"] is None or r["pair"][1]["n"] <= r["pair"][1]["of"] for r in rows))
check("confirmed: CR counts the wordings a curator's decision names, all of them settled",
      cr["pair"][1]["n"] == crf.get("curator_wordings") == crf.get("confirmed") and crf.get("confirmed_settled") == crf.get("confirmed"))
check("confirmed: Subjects counts a person's confirmations, a cohort's left out",
      rows[4]["pair"][1]["n"] == rows[4]["facts"]["person"] and rows[4]["facts"]["person_settled"] <= rows[4]["facts"]["person"])
check("confirmed: Exhibit counts a person's title stamps", rows[1]["pair"][1]["n"] == rows[1]["facts"]["person"])
with tempfile.TemporaryDirectory() as tmp:
    os.makedirs(os.path.join(tmp, "kb"))
    with open(os.path.join(tmp, "kb", "coci_curation.json"), "w") as f:
        json.dump({"curations": {
            "ART M1001": {"unified_title": "Drawing", "reviewed_by": "map@rccd.edu"},
            "ART M10AA": {"merge_into": "ART M1002", "reviewed_by": "MAP@rccd.edu"},
            "ART M1003": {"unified_title": "Painting", "reviewed_by": "automerge-v1@bot"},
            "ART M9999": {"discipline": "Art", "reviewed_by": "map@rccd.edu"}}}, f)
    cf = B.confirmed_cards(tmp, {"rows": [{"id": "ART M1001", "k": "X", "fr": "ready"}, {"id": "ART M1001", "k": "C", "fr": "needs_review"},
                                          {"id": "ART M1002", "k": "C", "fr": "needs_review"}, {"id": "ART M10AA", "k": "C", "fr": "ready"},
                                          {"id": "ART M1003", "k": "C", "fr": "ready"}]})
    check("confirmed: Course counts the card a save is keyed on and the card it places a course into, in cards (C and X twice); a cohort never",
          cf == {"confirmed": 4, "ready": 2}, cf)
import importlib.util as _iu
_sp = _iu.spec_from_file_location("sync_checked", os.path.join(ROOT, "kb", "_sync_program_checked.py"))
SC = _iu.module_from_spec(_sp); _sp.loader.exec_module(SC)
check("Pathways sync: a person's checks only, no address, college and number and day in a stable order",
      SC.shape([{"college": "B", "control_number": 2, "checked_by": "slee@cccco.edu", "checked_at": "2026-10-04T01:02:03Z"},
                {"college": "A", "control_number": "01", "checked_by": "Sam", "checked_at": "2026-10-10T00:00:00Z"},
                {"college": "C", "control_number": "9", "checked_by": "trial@bot", "checked_at": None}])
      == [["A", "01", "2026-10-10"], ["B", "2", "2026-10-04"]])
req = rows[0]
check("Pathways: the confirmed pair reads the synced checks, and its complete share is a subset",
      req["pair"][1]["n"] == req["facts"]["confirmed"] and req["facts"]["confirmed_complete"] <= req["facts"]["confirmed"])

# ── the S343 rule: a source that cannot be read is null with its error, never a zero ──
with tempfile.TemporaryDirectory() as empty:
    bare = B.build(empty)
    check("an empty root still writes five rows", [r["key"] for r in bare["rows"]] == ["requirements", "exhibit", "course", "cr", "subjects"])
    check("every row of an empty root carries its error and a null pair",
          all(r.get("error") and r["pair"][0]["n"] is None and r["pair"][0]["of"] is None for r in bare["rows"]),
          [(r["key"], r.get("error")) for r in bare["rows"]])
    check("an unread row draws no zero anywhere", all(i.get("n") != 0 for r in bare["rows"] for i in r.get("issues", [])))

# ── the small helpers ──
check("receipt_time turns 2026-10-18T17-37-29Z into ISO", B.receipt_time("2026-10-18T17-37-29Z") == "2026-10-18T17:37:29Z")
check("receipt_time leaves an ISO stamp alone", B.receipt_time("2026-10-18T17:37:29Z") == "2026-10-18T17:37:29Z")
check("a reviewer ending in @bot is a cohort; a person is the rest",
      B.is_cohort("cer-procedure-course-identity@bot") and B.is_cohort("preseed-v1@bot") and not B.is_cohort("map@rccd.edu") and not B.is_cohort(None))
check("figure() carries an error, never a zero", B.figure(lambda: 1 / 0)["n"] is None and "ZeroDivisionError" in B.figure(lambda: 1 / 0)["error"])

failed = [n for n, ok in results if not ok]
print("\n%d/%d checks passed" % (len(results) - len(failed), len(results)))
sys.exit(1 if failed else 0)
