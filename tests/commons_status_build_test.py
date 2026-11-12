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
import re
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
_ns = [i for i in _ex["issues"] if i.get("open") == "#exhibits/list/nosubj"]
check("Exhibits: credentials with no Common SUBJ is a routine count from the subject fill's worklist (S638), so the day history carries its trend",
      len(_ns) == 1 and isinstance(_ns[0]["n"], int) and _ns[0]["carry"] == "routine"
      and _ns[0]["n"] == json.load(open(os.path.join(ROOT, "kb", "exhibit_subject_out", "worklist.json")))["no_subject"],
      _ns)
check("Exhibits: the card and its counts open the List; held titles and conflicts keep Review; the procedures open Rules, never the retired CER",
      _ex["links"][0]["href"] == "#exhibits/list" and all(p_["open"] == "#exhibits/list" for p_ in _ex["pair"])
      # S574: the titles that have left MAP open their own List filter, never the retired CER's whole list.
      # S638: the credentials with no Common SUBJ open the List's No Common SUBJ filter.
      and all(i["open"] in ("#exhibits/held", "#exhibits/conflict", "#exhibits/list/left", "#exhibits/list/nosubj") for i in _ex["issues"])
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
check("Course: the Courses List is the row's home and its pair opens it, SkyView the second word, Progress the third "
      "(Sam, 2026-11-04: \"I want to be able to use list or skyview. Skyview is still too buggy to make the main workspace\"); "
      "each issue opens its job's List filter (S574)",
      co["tab"] == "#coci-lookup/courses"
      and co["links"] == [{"href": "#coci-lookup/courses", "text": "Open the Courses List"},
                          {"href": "https://cpl-initiative.github.io/cpl-project-tracker/prototype/skyview.html", "text": "Open SkyView"},
                          {"href": "#coci-lookup/progress", "text": "Open Progress"}]
      and all(p.get("open") == co["tab"] for p in co["pair"])
      and all((i.get("open") or "").startswith("#coci-lookup/list/") for i in co["issues"]))
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
      and rows[4]["pair"][1]["open"] == "#canonical-subj4/list/person"
      # S574: an issue opens its job filtered; the stray identity codes are courses' identities, so the Courses List's.
      and all((i.get("open") or "").startswith("#canonical-subj4/") or i.get("open") == "#coci-lookup/list/stray" for i in rows[4]["issues"]))
# A collision issue is listed only while a collision exists (the AGAB re-key of 2026-10-19 closed the one, S427):
# a known issue with nothing in it is not an issue, and facts.shared keeps the measure.
# The unconfirmed issue leaves the list at zero too (every MQ discipline confirmed, 2026-11-04, S566).
collision_issues = [i for i in rows[4]["issues"] if "two MQ disciplines" in i.get("words", "")]
modal_issues = [i for i in rows[4]["issues"] if "modal code, unconfirmed" in i.get("words", "")]
check("Subjects: the unconfirmed issue, when listed, opens the List's Open filter, where a pick is confirmed, and a collision issue, when one is listed, the List's In a collision",
      all(i["open"] == "#canonical-subj4/open" for i in modal_issues) and bool(sub.get("modal")) == bool(modal_issues)
      and all(i["open"] == "#canonical-subj4/list/collision" for i in collision_issues)
      and bool(sub.get("shared")) == bool(collision_issues))
if os.path.exists(os.path.join(ROOT, "kb", "csr_out", "latest.json")):
    with open(os.path.join(ROOT, "kb", "csr_out", "latest.json"), encoding="utf-8") as fh:
        _scan0 = json.load(fh)
    _anch = sum(1 for f in _scan0.get("findings") or [] if f.get("rule") in ("cs9_anchor_subj_diverge", "cs9_anchor_dead_format"))
    check("Subjects: with the daily scan's file, the stray codes and the anchor entries are re-key issues with an owner",
          all(i.get("owner") for i in rows[4]["issues"]) and sub.get("scanned_at")
          and any("identity codes" in i.get("words", "") and i.get("carry") == "reaches" for i in rows[4]["issues"])
          and [i["n"] for i in rows[4]["issues"] if "curated anchor entries" in i.get("words", "")] == ([_anch] if _anch else [])
          and all(i.get("carry") == "reaches" for i in rows[4]["issues"] if "curated anchor entries" in i.get("words", "")))
if os.path.exists(os.path.join(ROOT, "kb", "csr_out", "latest.json")):
    # The card's findings count is the Subjects page's (S561): judgment findings less the ones another item counts.
    with open(os.path.join(ROOT, "kb", "csr_out", "latest.json"), encoding="utf-8") as fh:
        _scan = json.load(fh)
    _want = sum(1 for f in _scan.get("findings") or [] if f.get("needs_judgment")
                and f.get("rule") not in ("cs7_unreviewed", "cs4_aligned", "cs4_missed_alignment", "cs2_dup",
                                          "cs9_anchor_subj_diverge", "cs9_anchor_dead_format"))
    _got = [i["n"] for i in rows[4]["issues"] if "to confirm or note" in i.get("words", "")]
    # A zero leaves the list (SkyBeacon, 2026-11-06: Sam noted all nine weak mnemonics and the card kept asking).
    check("Subjects: the scan-findings issue counts what the tab's opened page counts (S561), and leaves at zero", _got == ([_want] if _want else []))
    _js = open(os.path.join(ROOT, "canonical_subj4.js"), encoding="utf-8").read()
    check("Subjects: the skip list matches canonical_subj4.js's ASK_SKIP, the anchor rules included",
          'var ANCHOR_RULES = ["cs9_anchor_subj_diverge", "cs9_anchor_dead_format"];' in _js
          and 'var ASK_SKIP = ["cs7_unreviewed", "cs4_aligned", "cs4_missed_alignment", "cs2_dup"].concat(ANCHOR_RULES);' in _js
          and set(B.CSR_ASK_SKIP) == {"cs7_unreviewed", "cs4_aligned", "cs4_missed_alignment", "cs2_dup", "cs9_anchor_subj_diverge", "cs9_anchor_dead_format"})
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

# ── the one queue (Sam, 2026-11-04, S573): every issue names who carries it, and the queue groups the person items ──
allissues = [(r["key"], i) for r in data["rows"] for i in r.get("issues", [])]
check("every known issue names who carries it: a routine or one of the four reasons",
      all(i.get("carry") in B.CARRY_KEYS for _, i in allissues), [(k, i.get("words")) for k, i in allissues if i.get("carry") not in B.CARRY_KEYS])
q = data.get("queue") or {}
check("the status file carries the queue, its four reasons in order",
      [g["key"] for g in q.get("reasons", [])] == ["no_procedure", "unsure", "reaches", "keep_call"])
check("the queue leaves nothing unsorted on the repo", not q.get("unsorted"), q.get("unsorted"))
person = sum(len(g["items"]) for g in q.get("reasons", []))
check("every issue lands once: the person items and the carried ones add up to the issues",
      person + len(q.get("carried", [])) == len(allissues), (person, len(q.get("carried", [])), len(allissues)))
check("a routine's issue never reaches a person's queue",
      all(i["words"] not in [x["words"] for g in q.get("reasons", []) for x in g["items"]]
          for _, i in allissues if i.get("carry") == "routine"))
probe = B.build_queue([{"key": "x", "title": "X", "issues": [{"n": 3, "words": "a new issue", "owner": "someone"},
                                                             {"n": None, "words": "an unread one", "carry": "unsure", "error": "E"}]}])
check("an issue that names no reason lands under unsorted, so it cannot hide",
      [i["words"] for i in probe.get("unsorted", [])] == ["a new issue"])
check("an unread issue keeps its null and its error in the queue",
      probe["reasons"][1]["items"] == [{"ref": "x", "title": "X", "n": None, "words": "an unread one", "owner": None, "open": None, "error": "E"}])

# ── a stalled routine (S624): a stamp past its cadence, or a routine's backlog as large as a week before ──
check("the queue carries the stalled list, and it names only the two measured kinds",
      isinstance(q.get("stalled"), list) and all(x.get("kind") in ("stopped", "not_shrinking") for x in q["stalled"]), q.get("stalled"))
srows = [{"key": "course", "title": "C", "tab": "#c", "machine": {"what": "the auditor", "at": "2026-11-08T00:00:00Z", "every_hours": 24},
          "issues": [{"n": 50, "words": "flat ones", "carry": "routine", "open": "#c/flat"},
                     {"n": 40, "words": "shrinking ones", "carry": "routine", "open": "#c/down"},
                     {"n": 9, "words": "grown ones on 12 cards", "carry": "routine", "open": "#c/up"},
                     {"n": 70, "words": "a person's", "carry": "unsure", "open": "#c/p"},
                     {"n": 5, "words": "new today", "carry": "routine", "open": "#c/new"}]},
         {"key": "cr", "title": "R", "tab": "#r", "machine": {"what": "on dispatch", "at": "2026-01-01T00:00:00Z", "every_hours": None}, "issues": []}]
shist = {"schema": 1, "days": {
    "2026-11-01": {"course|#c/flat|flat ones": 50, "course|#c/down|shrinking ones": 60, "course|#c/up|grown ones on # cards": 7, "course|#c/p|a person's": 70},
    "2026-11-06": {"course|#c/flat|flat ones": 49, "course|#c/down|shrinking ones": 30, "course|#c/up|grown ones on # cards": 99}}}
st = B.build_stalled(srows, shist, "2026-11-08T12:00:00Z")
check("a routine within its cadence and slack is not stopped; a routine on dispatch never is", [x for x in st if x["kind"] == "stopped"] == [], st)
st2 = B.build_stalled(srows, shist, "2026-11-09T12:30:00Z")
check("a stamp older than 1.5 cadences reads stopped, with what stopped, since when, its cadence and where it opens",
      [x for x in st2 if x["kind"] == "stopped"] == [{"ref": "course", "title": "C", "kind": "stopped", "what": "the auditor",
                                                     "since": "2026-11-08T00:00:00Z", "every_hours": 24, "open": "#c"}], st2)
ns = {x["words"]: x for x in st if x["kind"] == "not_shrinking"}
check("a backlog as large as seven days before stalls; a smaller one, a person's item and one with no reading that old do not",
      sorted(ns) == ["flat ones", "grown ones on 12 cards"], sorted(ns))
check("the comparison is the latest reading at least seven days old, never a nearer one, and a figure in the words does not break the key",
      ns.get("flat ones", {}).get("was") == 50 and ns["flat ones"]["since"] == "2026-11-01" and ns.get("grown ones on 12 cards", {}).get("was") == 7, ns)
check("a build with no history says nothing has stopped shrinking", [x for x in B.build_stalled(srows, {"days": {}}, "2026-11-08T12:00:00Z") if x["kind"] == "not_shrinking"] == [])
rh = B.record_history({"days": {"2026-%02d-%02d" % (m, d): {} for m in (8, 9, 10) for d in range(1, 29)}}, "2026-11-08", B.routine_readings(srows))
check("the history keeps one entry a day, the routines' counts alone, and the last %d days" % B.HISTORY_KEEP_DAYS,
      len(rh["days"]) == B.HISTORY_KEEP_DAYS and max(rh["days"]) == "2026-11-08" and "course|#c/p|a person's" not in rh["days"]["2026-11-08"]
      and rh["days"]["2026-11-08"]["course|#c/up|grown ones on # cards"] == 9, sorted(rh["days"])[-2:])
hist_file = json.load(open(os.path.join(ROOT, B.HISTORY), encoding="utf-8")) if os.path.exists(os.path.join(ROOT, B.HISTORY)) else None
check("the committed history is the builder's shape: day keys, and whole-number counts",
      hist_file and all(re.match(r"^\d{4}-\d{2}-\d{2}$", d) and all(isinstance(v, int) for v in r.values()) for d, r in hist_file["days"].items()))

# ── the confidence count (Sam, 2026-11-04, S573): what a person did with each procedure's work afterward ──
conf = {c.get("ref"): c for c in data.get("confidence", [])}
check("the status file carries the confidence count for Exhibits, Subjects and the CR rule rungs", set(conf) == {"exhibit", "subjects", "cr"}, list(conf))
with tempfile.TemporaryDirectory() as cx:
    os.makedirs(os.path.join(cx, "kb/receipts"))
    def _g(key, rung, auto, recs):
        return {"key": key, "rung": rung, "acts_automatically": auto, "members": [{"rec": w, "rows": 1} for w in recs]}
    json.dump({"groups": [_g("a", 1, True, ["a1", "a2"]), _g("b", 1, True, ["b1"]), _g("c", 2, True, ["c1", "c2"]),
                          _g("d", 2, True, ["d1"]), _g("e", 3, True, ["e1"]), _g("f", 5, False, ["f1"]), _g("h", 4, True, ["h1", "h2"])]},
              open(os.path.join(cx, "kb/cr_reference_worklist.json"), "w"))
    json.dump({"rows": [{"group_key": "a", "decision": "confirmed", "members": ["a1", "a2", "a3"], "excluded": []},
                        {"group_key": "c", "decision": "confirmed", "members": ["c1"], "excluded": ["c2"]},
                        {"group_key": "d", "decision": "not_a_topic", "members": ["d1"]},
                        {"group_key": "e", "decision": "deferred"},
                        {"group_key": "h", "decision": "not_a_topic", "members": ["h1", "h2"]},
                        {"group_key": "f", "decision": "confirmed", "members": ["f1"]}], "written_at": "2026-01-01T00:00Z"},
              open(os.path.join(cx, "kb/receipts/cr_reference_decisions_2026-01-01_x.json"), "w"))
    # a later receipt whose name sorts first: its row for h stands, by the receipt's own time
    json.dump({"rows": [{"group_key": "h", "decision": "confirmed", "members": ["h1", "h2"], "excluded": []}], "written_at": "2026-02-01T00:00Z"},
              open(os.path.join(cx, "kb/receipts/cr_reference_decisions_2025-12-31_a.json"), "w"))
    cc = B.confidence_cr(cx)
    pr = {p["name"]: p for p in cc["procedures"]}
    check("CR confidence counts only the groups a rule folded, one line a rung, in groups",
          cc["unit"] == "groups" and sorted(pr) == ["rung 1", "rung 2", "rung 3", "rung 4"] and cc["total"]["placed"] == 6, cc)
    check("a confirmed group the person added a wording to is widened, never plain kept; one never decided is not looked at",
          (pr["rung 1"]["widened"], pr["rung 1"]["kept"], pr["rung 1"]["untouched"], pr["rung 1"]["looked"]) == (1, 0, 1, 1), pr["rung 1"])
    check("a group confirmed with the rule's own wordings is kept, and the latest receipt by its own time stands, whatever its name",
          (pr["rung 4"]["kept"], pr["rung 4"]["moved"], pr["rung 4"]["widened"]) == (1, 0, 0), pr["rung 4"])
    bad = json.load(open(os.path.join(cx, "kb/cr_reference_worklist.json")))
    bad["groups"].append(_g("z", 5, True, ["z1"]))
    json.dump(bad, open(os.path.join(cx, "kb/cr_reference_worklist.json"), "w"))
    try:
        B.confidence_cr(cx); raised = False
    except ValueError:
        raised = True
    check("a group that acts automatically outside rungs 1 to 4 stops the count, so the tab's words cannot go wrong quietly", raised)
    check("a group with a rule's wording set aside, or read not a topic, is moved",
          (pr["rung 2"]["moved"], pr["rung 2"]["kept"]) == (2, 0), pr["rung 2"])
    check("a deferred decision settles nothing: the group stays not looked at", pr["rung 3"]["untouched"] == 1 and pr["rung 3"]["looked"] == 0, pr["rung 3"])
for ref, c in conf.items():
    t = c.get("total") or {}
    check("confidence %s: every placed item lands in exactly one state" % ref,
          not c.get("error") and t.get("placed") == sum(t.get(k, 0) for k in ("untouched", "kept", "widened", "renamed", "moved", "by_procedure", "left")), c.get("error") or t)
    check("confidence %s: looked is kept plus renamed plus moved" % ref, t.get("looked") == t.get("kept", 0) + t.get("widened", 0) + t.get("renamed", 0) + t.get("moved", 0))
with tempfile.TemporaryDirectory() as fx:
    os.makedirs(os.path.join(fx, "kb", "cer_procedures_out", "saved"))
    rows = [  # the procedure's saves: (raw title, the common title it placed)
        ("A1", "Alpha"), ("B1", "Beta"), ("B2", "Beta"), ("C1", "Gamma"), ("D1", "Delta"), ("D2", "Delta"), ("E1", "Eps"), ("F1", "Phi")]
    with open(os.path.join(fx, "kb", "cer_procedures_out", "saved", "saved_2026-11-01T00-00-00Z.json"), "w") as f:
        json.dump({"at": "2026-11-01", "rows": [{"course_id": "_UNCLASSIFIED::" + k, "field": "unified_title_assignment", "value": v,
                                                 "reviewer_email": "cer-procedure-p1@bot", "procedure": "p1"} for k, v in rows]}, f)
    now = {
        "A1": {"unified_title": "Alpha", "reviewed_by": "cer-procedure-p1@bot"},          # untouched
        "B1": {"unified_title": "Beta Two", "reviewed_by": "map@rccd.edu"},               # Beta renamed: both moved together
        "B2": {"unified_title": "Beta Two", "reviewed_by": "map@rccd.edu"},
        "C1": {"unified_title": "Gamma", "reviewed_by": "map@rccd.edu"},                  # kept
        "D1": {"unified_title": "Delta One", "reviewed_by": "map@rccd.edu"},              # Delta split: one moved away
        "D2": {"unified_title": "Delta", "reviewed_by": "map@rccd.edu"},
        "E1": {"unified_title": "Eps", "reviewed_by": "cer-procedure-p2@bot"},            # revised by another procedure
        "X9": {"unified_title": "Delta", "reviewed_by": "map@rccd.edu"},
    }                                                                                    # F1 left the reference
    with open(os.path.join(fx, "kb", "unified_titles.json"), "w") as f:
        json.dump(now, f)
    ce = B.confidence_exhibits(fx)["total"]
    check("confidence fixture: untouched, kept, renamed with the family, a split one moved, another procedure, left",
          (ce["untouched"], ce["kept"], ce["renamed"], ce["moved"], ce["by_procedure"], ce["left"]) == (1, 2, 2, 1, 1, 1), ce)
    check("confidence fixture: a split counts the one that left its family as moved, never as renamed",
          ce["moved"] == 1 and ce["looked"] == 5)
    bare = B.build_confidence(os.path.join(fx, "nowhere"))
    check("an unreadable confidence source carries its error, never a zero", all(c.get("error") and "total" not in c for c in bare), bare)

# ── the next batch (Sam's Commons rulings, 2026-11-08, #2921): Another look's open cards, six at most ──
import json as _json, tempfile as _tf, os as _os
nb = data.get("next_batch")
# next_batch is the batches list's first (the Docket, step 1): Another look's six when any card is open, else an open
# case or call, else one of Sam's jobs. With every case done (S621), a job leads, and that is right.
check("the status file carries next_batch, or none when no card is open",
      nb is None or (nb == (data.get("batches") or [None])[0] and (nb.get("open") != "#exhibits/another-look/batch" or nb.get("n", 0) <= 6)), nb)
with _tf.TemporaryDirectory() as td:
    _os.makedirs(_os.path.join(td, "kb"))
    with open(_os.path.join(td, "kb", "exhibits_sweep.json"), "w") as f:
        _json.dump({"generated_at": "2026-11-08T00:00:00Z", "cards": [{"rules": ["fold"]}] * 9}, f)
    b9 = B.next_batch(td)
    check("a batch is six at most and keeps the open count", b9["n"] == 6 and b9["of"] == 9 and b9["title"] == "Another look at 6 exhibit titles", b9)
    with open(_os.path.join(td, "kb", "exhibits_sweep.json"), "w") as f:
        _json.dump({"cards": []}, f)
    check("no open card, no batch", B.next_batch(td) is None)
check("an unreadable sweep carries its error, never a batch of zero", "error" in B._safe(lambda r: 1 / 0, "."))

# ── the ordered batches (#2963 step 1; COBIx on #2921, 2026-11-09): Another look, open decisions, Sam's jobs ──
bl = data.get("batches")
check("the status file carries an ordered batches list", isinstance(bl, list), type(bl))
check("next_batch is the list's first batch", not bl or data.get("next_batch") == next((b for b in bl if not b.get("error")), None))
with _tf.TemporaryDirectory() as td:
    _os.makedirs(_os.path.join(td, "kb", "status"))
    with open(_os.path.join(td, "kb", "exhibits_sweep.json"), "w") as f:
        _json.dump({"generated_at": "2026-11-08T00:00:00Z", "cards": [
            {"id": "c%d" % i, "current": "T%d" % i, "rules": ["fold"], "locals": [{"raw": "local %d" % i}, {"raw": ""}]} for i in range(8)]}, f)
    with open(_os.path.join(td, "kb", "status", "course.json"), "w") as f:
        _json.dump({"calls": [{"title": "Answered", "answer": {"words": "confirm"}, "link": "https://x"},
                              {"title": "Open one", "text": "Why", "link": "https://claude.ai/artifact/abc"}]}, f)
    with open(_os.path.join(td, "kb", "status", "cr.json"), "w") as f:
        f.write("{not json")
    q = {"reasons": [{"key": "no_procedure", "items": [{"ref": "course", "n": 14523, "words": "seedless", "owner": "the Common Subjects reference", "open": "#a"}]},
                     {"key": "unsure", "items": [{"ref": "course", "title": "Common Course Reference", "n": 8, "words": "in doubt", "owner": "Sam (rule on each)", "open": "#coci-lookup/list/doubt"},
                                                 {"ref": "cr", "n": None, "owner": "Sam", "open": "#b", "error": "x"}]}]}
    got = B.batches(td, q)
    kinds = [b["kind"] for b in got]
    check("batches run Another look, then the open decisions, then Sam's jobs", kinds[0] == "another-look" and kinds[-1] == "job"
          and kinds.index("job") > max(i for i, k in enumerate(kinds) if k == "decision"), kinds)
    a = got[0]
    check("Another look names its six cards with the keys a decision saves under", len(a["cards"]) == 6
          and a["cards"][0] == {"id": "c0", "current": "T0", "keys": ["_UNCLASSIFIED::local 0"]} and a["at"] == "2026-11-08T00:00:00Z", a["cards"][:1])
    dec = [b for b in got if b["kind"] == "decision" and not b.get("error")]
    check("an answered call is no batch; an open one opens its sheet", [d["title"] for d in dec] == ["Open one"]
          and dec[0]["open"] == "https://claude.ai/artifact/abc" and dec[0]["project"] == "course", dec)
    bad = [b for b in got if b.get("error")]
    check("an unreadable run log is named, never read as holding nothing", "cr" in [b["project"] for b in bad]
          and all(b["project"] != "course" for b in bad) and any("JSONDecodeError" in b["error"] for b in bad), bad)
    jobs = [b for b in got if b["kind"] == "job"]
    check("only a job Sam carries, counted and readable, is a batch", len(jobs) == 1 and jobs[0]["n"] == 8 and jobs[0]["open"] == "#coci-lookup/list/doubt", jobs)

# ── the small helpers ──
check("receipt_time turns 2026-10-18T17-37-29Z into ISO", B.receipt_time("2026-10-18T17-37-29Z") == "2026-10-18T17:37:29Z")
check("receipt_time leaves an ISO stamp alone", B.receipt_time("2026-10-18T17:37:29Z") == "2026-10-18T17:37:29Z")
check("a reviewer ending in @bot is a cohort; a person is the rest",
      B.is_cohort("cer-procedure-course-identity@bot") and B.is_cohort("preseed-v1@bot") and not B.is_cohort("map@rccd.edu") and not B.is_cohort(None))
check("figure() carries an error, never a zero", B.figure(lambda: 1 / 0)["n"] is None and "ZeroDivisionError" in B.figure(lambda: 1 / 0)["error"])

failed = [n for n, ok in results if not ok]
print("\n%d/%d checks passed" % (len(results) - len(failed), len(results)))
sys.exit(1 if failed else 0)
