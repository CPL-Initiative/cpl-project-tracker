#!/usr/bin/env python3
"""Guard the extraction function's schema against the API's union limit.

    python3 tests/program_requirements_extract_schema_test.py

Extraction version 8 (S392) failed on every call: "Schemas contains too many parameters
with union types (17 parameters with type arrays or anyOf). This causes exponential
compilation cost." (Cabrillo 06350 and 06378, run 38656003434, S393). A nullable field
counts once per use, so the test counts the uses in the source of
chatbox/supabase/functions/program-requirements-extract/index.ts and fails above
sixteen. Version 9 holds each span as one nullable object and returns a null span as
{min: null, max: null}, the shape kb/_program_requirements_score.py reads.
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = open(os.path.join(ROOT, "chatbox", "supabase", "functions", "program-requirements-extract", "index.ts"),
           encoding="utf-8").read()
LIMIT = 16
results = []


def check(name, ok, why=""):
    results.append((name, bool(ok), why))


schema = SRC.split("const RECORD_SCHEMA", 1)[1].split("\nconst SYSTEM", 1)[0]
uses = (len(re.findall(r"\.\.\.NUM_OR_NULL\b|:\s*NUM_OR_NULL\b", schema))
        + len(re.findall(r"\.\.\.SPAN_OR_NULL\b|:\s*SPAN_OR_NULL\b", schema))
        + len(re.findall(r"anyOf:", schema)))
check("the record schema holds at most %d union-typed parameters (it holds %d)" % (LIMIT, uses), 0 < uses <= LIMIT)
check("NUM_OR_NULL and SPAN_OR_NULL are each one union",
      SRC.count('const NUM_OR_NULL = { anyOf: [{ type: "number" }, { type: "null" }] };') == 1
      and re.search(r"const SPAN_OR_NULL = \{\s*anyOf: \[", SRC)
      and "min: { type: \"number\" }, max: { type: \"number\" }" in SRC)

spans = re.findall(r"\n\s+(\w+): \{\n\s+\.\.\.SPAN_OR_NULL,", schema)
keys = re.search(r'const SPAN_KEYS = \[([^\]]*)\]', SRC)
keys = re.findall(r'"(\w+)"', keys.group(1)) if keys else []
check("every program span in the schema comes back as {min: null, max: null} when null: %s" % spans,
      sorted(k for k in spans if k != "stated") == sorted(keys) and "stated" in spans
      and "b.stated = { min: null, max: null }" in SRC and "unnullSpans(JSON.parse(textBlock.text))" in SRC)
check("the instructions no longer ask for null and null", "null and null" not in SRC.lower())

for name, ok, why in results:
    print(("ok   " if ok else "FAIL ") + name + (": " + why if why and not ok else ""))
bad = [r for r in results if not r[1]]
print("program_requirements_extract_schema_test.py: %d/%d checks passed" % (len(results) - len(bad), len(results)))
sys.exit(1 if bad else 0)
