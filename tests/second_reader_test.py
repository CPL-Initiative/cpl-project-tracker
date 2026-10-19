#!/usr/bin/env python3
"""kb/_second_reader.py: the second reader reads only failing records, only from the page
the first reading came from, sends the function the provider, compares the two readings
with the one fingerprint, and writes nothing but its comparison file. Stdlib only; no
network (the function call is a fake)."""
import importlib.util
import json
import os
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
spec = importlib.util.spec_from_file_location("_second_reader", os.path.join(ROOT, "kb", "_second_reader.py"))
R = importlib.util.module_from_spec(spec)
spec.loader.exec_module(R)
import _program_requirements_extract as X  # noqa: E402

results = []


def check(name, cond):
    results.append((name, bool(cond)))


CLOSED = [{"code": "BUS 101", "title": "Intro", "units": 3}, {"code": "ACTG 121", "title": "Accounting", "units": 4}]
TEXT = "Business Management Certificate. Required: BUS 101 (3), ACTG 121 (4). Total 19 units."
first_rec = {"program": {"measure": "units", "total_units": {"min": 19, "max": 19}, "degree_total": {"min": None, "max": None},
                         "ge_units": {"min": None, "max": None}, "open_elective_units": None,
                         "degree_elective_units": {"min": None, "max": None}, "electives_fill_degree": False,
                         "outcomes": [], "careers": []},
             "blocks": [{"name": "Core", "rule": "all", "minimum": None, "stated": {"min": None, "max": None},
                         "courses": [{"code": "BUS 101", "units": 3, "units_max": None, "alternatives": []}]}],
             "course_outcomes": [], "missing_explained": [], "notes": []}
passing = {"college": "Test College", "control_number": "00001", "title": "Welding", "award": "A.S. Degree",
           "score": {"pass": True, "coverage": {"pass": True}, "arithmetic": {"pass": True}}, "record": first_rec}
failing = {"college": "Test College", "control_number": "00002", "title": "Business Management",
           "award": "Certificate of Achievement", "source_url": "https://x.test/catalog.pdf#page=154",
           "extracted_run": 1, "model": "claude-opus-5-5",
           "score": {"pass": False, "coverage": {"pass": True}, "arithmetic": {"pass": False, "status": "unequal"}},
           "record": first_rec}

# 1. only failing records
check("a passing record fails no check", R.failing(passing) == [])
check("a failing record names its check", R.failing(failing) == ["arithmetic"])

with tempfile.TemporaryDirectory() as tmp:
    rec_dir = os.path.join(tmp, "test", "records")
    os.makedirs(rec_dir)
    json.dump(passing, open(os.path.join(rec_dir, "00001.json"), "w"))
    json.dump(failing, open(os.path.join(rec_dir, "00002.json"), "w"))
    saved = R.COLLEGE_DIR
    R.COLLEGE_DIR = tmp
    got = R.failing_records("test")
    check("failing_records keeps the failing record alone", [r["control_number"] for r in got] == ["00002"])

    # 2. the page must be the one the record came from
    cap = os.path.join(tmp, "out", "sources")
    os.makedirs(cap)
    same = {"college": "Test College", "control_number": "00002", "title": "Business Management",
            "award": "Certificate of Achievement", "text": TEXT, "closed_list": CLOSED,
            "source": {"url": "https://x.test/catalog.pdf#page=154"}}
    json.dump(same, open(os.path.join(cap, "00002.json"), "w"))
    check("the capture's source on the same page is read", R.source_for(os.path.join(tmp, "out"), failing) is not None)
    moved = dict(same, source={"url": "https://x.test/catalog.pdf#page=9"})
    json.dump(moved, open(os.path.join(cap, "00002.json"), "w"))
    check("a moved page is skipped", R.source_for(os.path.join(tmp, "out"), failing) is None)
    check("no capture dir: nothing is read", R.source_for(None, failing) is None)
    json.dump(same, open(os.path.join(cap, "00002.json"), "w"))

    # 3. the function is asked with the provider, and the comparison uses the one fingerprint
    sent = []

    def fake_post(body, key):
        sent.append(body)
        second = json.loads(json.dumps(first_rec))
        second["blocks"][0]["courses"].append({"code": "ACTG 121", "units": 4, "units_max": None, "alternatives": []})
        return {"provider": "xai", "model": "grok-test", "stop_reason": "stop",
                "usage": {"prompt_tokens": 10, "completion_tokens": 5}, "ms": 12, "record": second, "error": None}

    X._post = fake_post
    out_saved, R.OUT = R.OUT, os.path.join(tmp, "second_out")
    rc = R.run("Test College", os.path.join(tmp, "out"), key="service-key", workers=1)
    R.COLLEGE_DIR = saved
    R.OUT, out_dir = out_saved, R.OUT
    check("run returns 0", rc == 0)
    check("one call, carrying provider xai and no model when none is given",
          len(sent) == 1 and sent[0].get("provider") == "xai" and "model" not in sent[0])
    check("the call carries the same text and closed list the first reader saw",
          sent[0].get("text") == TEXT and sent[0].get("closed_list") == CLOSED)
    path = os.path.join(out_dir, "second_test.json")
    check("the comparison file is written", os.path.isfile(path))
    doc = json.load(open(path, encoding="utf-8"))
    row = doc["rows"][0]
    check("the row holds both readings and a verdict", row["first"]["pass"] is False and row["second"]["record"]
          and row["comparison"]["verdict"] in ("second_passes", "disagree", "both_fail_same_checks", "agree"))
    check("different requirements read as not the same", row["comparison"]["same_requirements"] is False)
    check("the second reading is scored by the one scorer", isinstance(row["second"]["score"], dict)
          and "arithmetic" in row["second"]["score"])
    check("the posture is suggests, on the row and the file", row["posture"] == "suggests" and doc["posture"] == "suggests")
    check("the record folder is untouched", json.load(open(os.path.join(rec_dir, "00002.json")))["score"]["pass"] is False)

    # 4. agreement
    cmp = R.compare(failing, json.loads(json.dumps(first_rec)), {"pass": False, "arithmetic": {"pass": False}})
    check("the same requirements read as agree", cmp["verdict"] == "agree" and cmp["same_requirements"])
    check("no second reading has its own verdict", R.compare(failing, None, None)["verdict"] == "no_second_reading")

# 5. the extractor's call carries provider and model only when given
captured = []
X._post = lambda body, key: (captured.append(body) or {"record": None, "error": "x"})
src = {"college": "C", "title": "T", "award": "A", "text": TEXT, "closed_list": CLOSED, "source": {"url": "u"}}
X.call(src, "k")
X.call(src, "k", provider="xai", model="grok-test")
check("call without a provider sends none", "provider" not in captured[0] and "model" not in captured[0])
check("call with a provider and model sends both", captured[1].get("provider") == "xai" and captured[1].get("model") == "grok-test")

# 6. the function's source: the provider branch, the shared prompt, the key scrubbed
SRC = open(os.path.join(ROOT, "chatbox", "supabase", "functions", "program-requirements-extract", "index.ts"),
           encoding="utf-8").read()
check("the function reads body.provider and allows anthropic and xai",
      'body.provider' in SRC and 'const PROVIDERS = ["anthropic", "xai"]' in SRC)
check("the xAI branch sends the same system prompt and schema",
      'content: SYSTEM }' in SRC and 'schema: RECORD_SCHEMA' in SRC)
check("the xAI branch never guesses a model", "the model is never guessed" in SRC)
check("the xAI key is scrubbed from error text", SRC.count('replaceAll(key, "<redacted>")') >= 2)
check("an xAI call without the function secret answers 500, not a guess", 'error: "XAI_API_KEY not set"' in SRC)

failed = [n for n, ok in results if not ok]
for n, ok in results:
    print(("ok   " if ok else "FAIL ") + n)
print("%d/%d checks passed" % (len(results) - len(failed), len(results)))
sys.exit(1 if failed else 0)
