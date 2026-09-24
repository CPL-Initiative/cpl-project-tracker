#!/usr/bin/env python3
"""Apply kb/reference/asccc_area_map.json to college_lookup.js as `ascccArea`.

WHY A SCRIPT. college_lookup.js is hand-maintained (district + SW region per
college) and read by the EACR at load time; the ASCCC Area is a third field on
the same rows. Keeping the AREA in a derivation record (which college, on what
basis, confirmed or provisional) and applying it here means the lookup never
carries a value the record cannot explain, and `--check` (run by
scripts/check_generated.sh) fails the moment the two drift.

    python3 kb/_apply_asccc_areas.py          # rewrite the field
    python3 kb/_apply_asccc_areas.py --check  # exit 1 if college_lookup.js differs
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RECORD = os.path.join(ROOT, "kb", "reference", "asccc_area_map.json")
LOOKUP = os.path.join(ROOT, "college_lookup.js")

ENTRY = re.compile(r'^(  "(?P<name>[^"]+)":\s*\{)(?P<body>[^}]*)(\}.*)$', re.M)


def area_of(record):
    out = {}
    for area, groups in record["areas"].items():
        for name in groups.get("confirmed", []) + groups.get("geography", []):
            out[name] = area
    for alias, canon in record.get("aliases", {}).items():
        out[alias] = out[canon]
    for name, area in record.get("district_level", {}).items():
        out[name] = area
    return out


def apply(src, areas):
    def sub(m):
        name, body = m.group("name"), m.group("body")
        body = re.sub(r',\s*ascccArea:\s*"[A-D]"', "", body)
        area = areas.get(name)
        if area:
            body = body.rstrip() + ', ascccArea: "%s"' % area
        return m.group(1) + body + " " + m.group(4).lstrip() if area else m.group(0)
    return ENTRY.sub(sub, src)


def main(argv):
    record = json.load(open(RECORD, encoding="utf-8"))
    areas = area_of(record)
    src = open(LOOKUP, encoding="utf-8").read()
    out = apply(src, areas)
    names = re.findall(r'^  "([^"]+)":', src, flags=re.M)
    unassigned = [n for n in names if n not in areas and n not in record.get("_not_ccc", [])]
    if unassigned:
        print("college_lookup.js entries with no ASCCC Area in the record: " + " | ".join(unassigned))
        return 1
    if "--check" in argv:
        if out != src:
            print("college_lookup.js is out of step with kb/reference/asccc_area_map.json — "
                  "run: python3 kb/_apply_asccc_areas.py")
            return 1
        print("college_lookup.js ascccArea fields match the record (%d colleges)." % len(areas))
        return 0
    if out != src:
        open(LOOKUP, "w", encoding="utf-8").write(out)
        print("wrote ascccArea on %d entries." % sum(1 for n in names if n in areas))
    else:
        print("college_lookup.js already current.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
