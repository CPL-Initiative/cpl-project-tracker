#!/usr/bin/env python3
"""Flag the programs a college has discontinued, so they leave the queue and the failing counts.

Sam approved it on 2026-11-17 (relayed by COBIx on #3480, comment 6967372099), on the retired-course
pattern: flag the program, keep its record and receipts with a note, never delete it, and never show it
as needing attention. A program is discontinued when

  * its own catalog section marks it teach-out, inactive, discontinued, deactivated, suspended or no
    longer accepting students ("catalog_mark"), or
  * the current catalog year does not print it while a prior year's does ("prior_year_only": the
    harvest read it from the year it was last printed, CAPTURE_PRIOR in kb/_program_requirements_college.py,
    because the current catalog prints only its successor's page).

The mark must sit in the program's own section: its heading line and the lines under it before the first
course row. A course row marked "(Being Deactivated)" says nothing about the program, and a reader's
guess ("the program may have been discontinued") is never a mark. Reader notes are not read at all.

SOURCES. The committed prior-year reads (kb/program_requirements_college/<slug>/prior_<year>.json, never a
_preview), and, where a runner hands one over, a capture directory (--capture DIR: the program-requirements
artifact's out/, with sources/<cn>.json carrying the text the reader saw). The committed files keep no
page text, so a run without --capture can find only the prior-year rule's programs.

THE COLLECTION LANE'S COLLEGES are left out tonight (S680 conductor, one writer per college):
COLLECTION_LANE_S680 below, or --skip-college NAME in addition.

Writes kb/status/program_discontinued.json. kb/_harvest_gap_census.py reads it and lists each flagged
program beside the gap, out of it. Writes no table: git revert undoes the flag.

    python3 kb/_program_discontinued.py                  # committed files only
    python3 kb/_program_discontinued.py --capture out    # plus a runner capture's page text
    python3 kb/_program_discontinued.py --check          # fail when the committed file is stale

Guard: tests/program_discontinued_test.py.
"""
from __future__ import annotations

import argparse
import glob
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
COLLEGE_DIR = os.path.join(HERE, "program_requirements_college")
OUT = os.path.join(HERE, "status", "program_discontinued.json")

RULING = ("Sam, 2026-11-17, relayed by COBIx on #3480 (comment 6967372099): flag discontinued programs out "
          "of the queue; flag, never delete")

# The collection lane holds these colleges tonight (S680 conductor's split, docs/session_681_handoff.md on
# PR #3487, widened to nine before any write). Every count and flag here leaves them out.
COLLECTION_LANE_S680 = (
    "Golden West College", "Coastline Community College", "Orange Coast College", "Cosumnes River College",
    "Lassen College", "Los Medanos College", "Diablo Valley College", "College of the Redwoods",
    "Allan Hancock College",
)

# A program-level mark. Each alternative names the program's state, never a course's.
MARK = re.compile(
    r"\bteach[\s-]?out\b"
    r"|\bno\s+longer\s+(?:accepting|admitting|enrolling|offered|being\s+offered|available)\b"
    r"|\bnot\s+(?:currently\s+)?accepting\s+(?:new\s+)?(?:students|applications|majors)\b"
    r"|\b(?:program|degree|certificate|major)\s+(?:is|has\s+been|was|will\s+be)\s+"
    r"(?:inactive|inactivated|deactivated|discontinued|suspended|archived)\b"
    r"|\b(?:inactive|discontinued|deactivated|suspended)\s+(?:program|degree|certificate|major)\b"
    r"|^\s*[\(\[]?\s*(?:inactive|discontinued|deactivated|suspended)\s*[\)\]]?\s*$",
    re.I)
# A guess is never a mark.
GUESS = re.compile(r"\b(?:may|might|could)\s+(?:have\s+been|be)\b|\b(?:possibly|probably|perhaps|reviewer|unclear)\b"
                   r"|\bappears?\s+to\b", re.I)
# A course row: it opens on a course code (BUS 101, SPCH121I, BIOL C1001L, CIS-10A).
COURSE_ROW = re.compile(r"^\s*[A-Z][A-Z&/]{1,7}\s*-?\s*[A-Z]?\d{1,4}[A-Z]{0,3}\b")
SECTION_LINES = 12


def _lines(text: str) -> list[str]:
    return [ln.strip() for ln in (text or "").splitlines() if ln.strip()]


def _start(lines: list[str], heading: str | None) -> int:
    """The program's own heading line, or the top of the text when no heading is named or found."""
    if heading:
        h = re.sub(r"\W+", " ", heading).strip().lower()
        for i, ln in enumerate(lines):
            if h and h in re.sub(r"\W+", " ", ln).strip().lower():
                return i
    return 0


def section_mark(text: str | None, heading: str | None = None) -> str | None:
    """The line in the program's own section that marks it discontinued, or None. The section runs from
    its heading to the first course row, at most SECTION_LINES lines."""
    lines = _lines(text or "")
    if not lines:
        return None
    i = _start(lines, heading)
    for j, ln in enumerate(lines[i:i + SECTION_LINES]):
        if j and COURSE_ROW.match(ln):
            break
        if MARK.search(ln) and not GUESS.search(ln) and not COURSE_ROW.match(ln):
            return ln[:240]
    return None


def held(college: str | None, skip: tuple[str, ...] = ()) -> bool:
    return (college or "") in COLLECTION_LANE_S680 or (college or "") in skip


def prior_year_flags(base: str = COLLEGE_DIR) -> list[dict]:
    """The programs a prior-year read filed: the current catalog prints only a successor's page."""
    out = []
    for path in sorted(glob.glob(os.path.join(base, "*", "prior_*.json"))):
        if path.endswith("_preview.json"):
            continue
        with open(path, encoding="utf-8") as fh:
            d = json.load(fh)
        prior = d.get("prior") or {}
        filed = {str(x.get("control_number") if isinstance(x, dict) else x) for x in (d.get("filed") or [])}
        slug = os.path.basename(os.path.dirname(path))
        cur_year = None
        cap = os.path.join(os.path.dirname(path), "capture.json")
        if os.path.isfile(cap):
            with open(cap, encoding="utf-8") as fh:
                cur_year = json.load(fh).get("catalog_year")
        for cn in prior.get("only") or []:
            cn = str(cn)
            if filed and cn not in filed:
                continue
            rec_path = os.path.join(os.path.dirname(path), "records", "%s.json" % cn)
            title = award = None
            if os.path.isfile(rec_path):
                with open(rec_path, encoding="utf-8") as fh:
                    rec = json.load(fh)
                title, award = rec.get("title"), rec.get("award")
            out.append({"college": d.get("college"), "control_number": cn, "title": title, "award": award,
                        "how": "prior_year_only",
                        "source_line": "The %s catalog does not print it; the %s catalog does (prior-year read, run %s)."
                                       % (cur_year or "current", prior.get("catalog_year"), d.get("run") or "unknown"),
                        "source": os.path.relpath(path, ROOT)})
    return out


def capture_flags(capture_dir: str) -> list[dict]:
    """The programs whose own section, in a runner capture's page text, carries a mark."""
    out = []
    cap = os.path.join(capture_dir, "capture.json")
    college = None
    if os.path.isfile(cap):
        with open(cap, encoding="utf-8") as fh:
            college = json.load(fh).get("college")
    for path in sorted(glob.glob(os.path.join(capture_dir, "sources", "*.json"))):
        with open(path, encoding="utf-8") as fh:
            d = json.load(fh) or {}
        src = d.get("source") if isinstance(d.get("source"), dict) else {}
        line = section_mark(d.get("text"), src.get("h1") or d.get("h1") or d.get("heading"))
        if line:
            out.append({"college": d.get("college") or college,
                        "control_number": str(d.get("control_number") or os.path.basename(path)[:-5]),
                        "title": d.get("title"), "award": d.get("award"), "how": "catalog_mark",
                        "source_line": line, "source": src.get("url") or d.get("url")})
    return out


def build(captures: list[str] = (), skip: tuple[str, ...] = (), base: str = COLLEGE_DIR) -> dict:
    flags, left_out = {}, 0
    for f in prior_year_flags(base) + [x for c in captures for x in capture_flags(c)]:
        if held(f.get("college"), skip):
            left_out += 1
            continue
        flags.setdefault((f["college"], f["control_number"]), f)
    rows = [flags[k] for k in sorted(flags)]
    by_college: dict = {}
    by_how: dict = {}
    for r in rows:
        by_college[r["college"]] = by_college.get(r["college"], 0) + 1
        by_how[r["how"]] = by_how.get(r["how"], 0) + 1
    return {"rule": RULING, "held_colleges": list(COLLECTION_LANE_S680) + [s for s in skip],
            "left_out_held": left_out, "flagged": len(rows), "by_how": by_how, "by_college": by_college,
            "page_text": "capture" if captures else "none committed: catalog_mark needs a runner capture (--capture)",
            "flags": rows}


def keys(path: str = OUT) -> dict:
    """{(college, control_number): flag} from the committed file, or {} when there is none."""
    if not os.path.isfile(path):
        return {}
    with open(path, encoding="utf-8") as fh:
        d = json.load(fh)
    return {(f["college"], str(f["control_number"])): f for f in d.get("flags") or []}


def dumps(d: dict) -> str:
    return json.dumps(d, ensure_ascii=False, indent=1) + "\n"


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--capture", action="append", default=[], help="a runner capture's out/ directory")
    ap.add_argument("--skip-college", action="append", default=[], help="a further college to leave out")
    ap.add_argument("--out", default=OUT)
    ap.add_argument("--check", action="store_true", help="fail when the committed file differs; write nothing")
    a = ap.parse_args(argv)
    d = build(a.capture, tuple(a.skip_college))
    text = dumps(d)
    if a.check:
        have = open(a.out, encoding="utf-8").read() if os.path.isfile(a.out) else ""
        if a.capture or have == text:
            print("program_discontinued.json is current (%d flagged)" % d["flagged"])
            return 0
        print("program_discontinued.json is stale: run python3 kb/_program_discontinued.py")
        return 1
    os.makedirs(os.path.dirname(a.out), exist_ok=True)
    with open(a.out, "w", encoding="utf-8") as fh:
        fh.write(text)
    print("%d programs flagged discontinued (%s); %d left out at the collection lane's colleges"
          % (d["flagged"], ", ".join("%s %d" % kv for kv in sorted(d["by_how"].items())) or "none", d["left_out_held"]))
    for c, n in sorted(d["by_college"].items()):
        print("  %s: %d" % (c, n))
    return 0


if __name__ == "__main__":
    sys.exit(main())
