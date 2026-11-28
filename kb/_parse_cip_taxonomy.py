#!/usr/bin/env python3
"""Read the Chancellor's Office CIP Taxonomy PDF into its CTE designations (S749).

SOURCE. kb/reference/cip_taxonomy_2026-09.pdf: "California Community Colleges Classification of Instructional
Programs (CIP) Taxonomy, September 2026", the final list that replaces the TOP Code Manual. Sam attached it on
2026-11-28 (relayed by COBIx). Each 6-digit CIP code carries one of CTE / Not CTE / Noncredit / Both, or "CIP No
Longer in Use". It supersedes the July 15 draft (kb/reference/cip_cte_certified_260715.json, kept for history).

OUTPUT. kb/reference/cip_taxonomy_202609.json: {"_meta": ..., "designations": {"01.0000": "Both", ...}} for every
code the PDF lists, with "Noncredit CIP" written "Noncredit". kb/_build_cip_crosswalk.py reads it first.

HOW. pdftotext -layout; a code line ends in its flag (one or more spaces before it). A row whose title wraps carries
its flag on the next line, and 43.0116's "CIP No Longer in Use" wraps around the code line. The script fails when a
listed code has no flag.

Run: python3 kb/_parse_cip_taxonomy.py [--check]
"""
import json
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
PDF = os.path.join(HERE, "reference", "cip_taxonomy_2026-09.pdf")
OUT = os.path.join(HERE, "reference", "cip_taxonomy_202609.json")
FLAGS = ["Not CTE", "Noncredit CIP", "Noncredit", "Both", "CTE"]
CODE = re.compile(r"^\s*(\d{2}\.\d{4})\b(.*)$")


def parse(text):
    lines = text.split("\n")
    out = {}
    for i, ln in enumerate(lines):
        m = CODE.match(ln)
        if not m:
            continue
        code, rest = m.group(1), m.group(2).rstrip()
        flag = next((f for f in FLAGS if re.search(r"(^|\s)" + re.escape(f) + r"$", rest)), None)
        if flag is None:
            near = " ".join(lines[j].strip() for j in range(max(0, i - 1), min(len(lines), i + 2)))
            if "CIP No Longer" in near and "in Use" in near:
                flag = "CIP No Longer in Use"
        if flag is None:
            for j in (i + 1, i + 2):
                s = lines[j].rstrip() if j < len(lines) else ""
                if CODE.match(s):
                    break
                flag = next((f for f in FLAGS if re.search(r"\s{2,}" + re.escape(f) + r"$", s)), None)
                if flag:
                    break
        if flag is None:
            raise SystemExit("no flag for %s" % code)
        out[code] = "Noncredit" if flag == "Noncredit CIP" else flag
    return out


def build():
    text = subprocess.run(["pdftotext", "-layout", PDF, "-"], capture_output=True, text=True, check=True).stdout
    d = parse(text)
    return {"_meta": {"source": "kb/reference/cip_taxonomy_2026-09.pdf (CCCCO CIP Taxonomy, September 2026, final)",
                      "built_by": "kb/_parse_cip_taxonomy.py",
                      "note": "The Chancellor's Office's CTE / Not CTE / Noncredit / Both designation for every CIP code "
                              "the taxonomy lists; 'Noncredit CIP' is written 'Noncredit'. Supersedes "
                              "cip_cte_certified_260715.json (the July 15 draft's 244 certified disagreements).",
                      "count": len(d)},
            "designations": dict(sorted(d.items()))}


def main(argv):
    doc = build()
    body = json.dumps(doc, indent=1, ensure_ascii=False) + "\n"
    if "--check" in argv:
        ok = os.path.exists(OUT) and open(OUT, encoding="utf-8").read() == body
        print("%s is %s" % (os.path.relpath(OUT), "current" if ok else "behind the PDF: run python3 kb/_parse_cip_taxonomy.py"))
        return 0 if ok else 1
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(body)
    print("wrote %s: %d codes" % (os.path.relpath(OUT), doc["_meta"]["count"]))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
