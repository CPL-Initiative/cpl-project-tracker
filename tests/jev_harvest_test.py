#!/usr/bin/env python3
"""kb/_jev_harvest.py: the Jev sitting over the harvest's failing records asks only about
failing records, tells Jev when no page text is in hand, bounds the text it sends, and
proposes nothing (every row carries the uncalibrated posture). Stdlib only; no network."""
import importlib.util
import json
import os
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("_jev_harvest", os.path.join(ROOT, "kb", "_jev_harvest.py"))
J = importlib.util.module_from_spec(spec)
spec.loader.exec_module(J)

results = []


def check(name, cond):
    results.append((name, bool(cond)))


passing = {"college": "Test College", "control_number": "00001", "title": "Welding", "award": "A.S. Degree",
           "score": {"coverage": {"pass": True}, "invented": {"pass": True}, "arithmetic": {"pass": True}},
           "record": {"program": {"total_units": {"min": 60, "max": 60}}, "blocks": []}}
failing = {"college": "Test College", "control_number": "00002", "title": "Business Management",
           "award": "Certificate of Achievement", "source_url": "https://x.test/catalog.pdf#page=154",
           "score": {"coverage": {"pass": True, "share": 0.714, "missing": ["ACTG121"]},
                     "invented": {"pass": True}, "arithmetic": {"pass": False, "status": "unequal",
                                                                 "computed": [12, 12], "stated": [19, 19],
                                                                 "why": ["the blocks sum to 12.0-12.0; the catalog states 19.0-19.0"]}},
           "record": {"program": {"measure": "units", "total_units": {"min": 19, "max": 19}},
                      "blocks": [{"name": "Core", "rule": "all", "minimum": None, "stated": None,
                                  "courses": [{"code": "BUS. 101", "units": 3, "units_max": None, "alternatives": []}]}],
                      "missing_explained": [{"code": "ACTG 121", "why": "printed before the excerpt begins"}],
                      "notes": ["The excerpt starts on page 154 in the middle of the section."]}}

# 1. only failing records are asked about
check("a passing record fails no check", J.failing(passing) == [])
check("a failing record names the check it fails", J.failing(failing) == ["arithmetic"])
careers_only = dict(passing, control_number="00003",
                    score=dict(passing["score"], careers={"pass": False, "not_verbatim": ["film work"]}))
check("the careers check holds no record back, so failing it alone is no failure (S424)",
      J.failing(careers_only) == [])
with tempfile.TemporaryDirectory() as tmp:
    rec_dir = os.path.join(tmp, "test", "records")
    os.makedirs(rec_dir)
    json.dump(passing, open(os.path.join(rec_dir, "00001.json"), "w"))
    json.dump(failing, open(os.path.join(rec_dir, "00002.json"), "w"))
    saved = J.COLLEGE_DIR
    J.COLLEGE_DIR = tmp
    got = J.failing_records("test")
    J.COLLEGE_DIR = saved
    check("failing_records keeps the failing record alone", [r["control_number"] for r in got] == ["00002"])

# 2. the state says when no text is in hand, and bounds the text when it is
st = J.state_for(failing, None)
check("no text: page_text is None and the note says so", st["page_text"] is None and "no page text" in st["page_text_note"])
check("the state carries the program, the figures, the blocks and the checks",
      st["program"]["control_number"] == "00002" and st["record"]["figures"]["total_units"] == {"min": 19, "max": 19}
      and st["record"]["blocks"][0]["courses"][0]["code"] == "BUS. 101" and st["checks"]["arithmetic"]["status"] == "unequal")
check("the failing checks are named for Jev", st["failing"] == ["arithmetic"])
long = "x" * (J.TEXT_CHARS + 500)
st2 = J.state_for(failing, long)
check("page text is cut to TEXT_CHARS and the note says the cut", len(st2["page_text"]) == J.TEXT_CHARS and "first" in st2["page_text_note"])
st3 = J.state_for(failing, "short text")
check("a short text goes whole", st3["page_text"] == "short text" and "whole" in st3["page_text_note"])

# 3. the questions
q = J.questions()
check("five questions, one set per record", sorted(q) == ["cause", "electives_fill", "ge_in_total", "missing_printed", "owner"])
check("cause is a choice carrying cannot_tell", q["cause"]["type"] == "choice" and "cannot_tell" in q["cause"]["criteria"])
check("owner is a choice carrying none", q["owner"]["type"] == "choice" and "none" in q["owner"]["criteria"])
check("the nouls carry true and false criteria", all(q[k]["type"] == "noul" and set(q[k]["criteria"]) == {"true", "false"}
                                                    for k in ("ge_in_total", "electives_fill", "missing_printed")))
check("every question names the state field it reads", all("`" in (q[k]["instructions"] or "") for k in q))

# 4. a row proposes nothing: the posture is uncalibrated, answers are carried as given
row = J.answer_row(failing, {"cause": {"choice": "excerpt_cut", "confidence": 0.8}, "owner": {"choice": "reader_procedure"},
                             "ge_in_total": {"noul": 0.1}, "electives_fill": {"noul": 0.05}, "missing_printed": {"noul": 0.2}})
check("the row carries the uncalibrated posture", row["posture"] == "uncalibrated")
check("the row carries Jev's typed answers as given", row["cause"] == "excerpt_cut" and row["owner"] == "reader_procedure"
      and row["ge_in_total"] == 0.1 and row["missing_printed"] == 0.2)
check("a noul answer is kept as a probability, never a boolean", isinstance(row["electives_fill"], float))
empty = J.answer_row(failing, {})
check("no answer leaves every judgment None", empty["cause"] is None and empty["ge_in_total"] is None)

# 5. no page text leaks into the dry run of a college with no capture dir
check("page_text reads None with no capture dir", J.page_text(None, "00002") is None)

failed = [n for n, ok in results if not ok]
for n, ok in results:
    print(("PASS  " if ok else "FAIL  ") + n)
print("All %d checks passed." % len(results) if not failed else "%d of %d checks FAILED." % (len(failed), len(results)))
sys.exit(1 if failed else 0)
